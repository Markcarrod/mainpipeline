/**
 * /app/api/webhooks/cal/route.ts
 *
 * Pipeline Portal — Cal.com Webhook Endpoint
 *
 * Public URL:  https://app.pipelineportal.com/api/webhooks/cal
 * Test URL:    https://app.pipelineportal.com/api/webhooks/cal/test
 *
 * Supported events:
 *   BOOKING_CREATED       → status: scheduled
 *   BOOKING_CANCELLED     → status: cancelled
 *   BOOKING_RESCHEDULED   → status: rescheduled
 *   BOOKING_NO_SHOW_UPDATED → status: no_show
 *   MEETING_STARTED       → status: scheduled
 *   MEETING_ENDED         → status: completed
 *
 * Security:
 *   - Validates HMAC-SHA256 signature when CALCOM_WEBHOOK_SIGNING_SECRET
 *     is set (strongly recommended in production).
 *   - Uses the Supabase service-role key — never the anon key — so that
 *     inserts/updates bypass RLS policies safely from the server.
 *
 * Multi-client routing:
 *   - Cal.com must pass `clientId` in the booking metadata so we know
 *     which Pipeline Portal client this booking belongs to.
 *   - If no clientId is provided the webhook still returns 202 so Cal.com
 *     stops retrying, but nothing is written to the database.
 */

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import {
  type CalWebhookPayload,
  isValidCalPayload,
  parseCalPayload,
} from "@/lib/cal-webhook";

// ─── HMAC signature verification ───────────────────────────────────────────

/**
 * Verifies the `x-cal-signature-256` header using the signing secret.
 * Cal.com signs the raw request body with HMAC-SHA256 in hex.
 * Returns true when the secret is not configured (open mode / development).
 */
function verifyCalSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = env.calcomSigningSecret;

  // If no secret is configured, skip verification (development / test only)
  if (!secret) return true;

  if (!signatureHeader) return false;

  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signatureHeader, "hex"),
    );
  } catch {
    // Buffer lengths differ → definitely invalid
    return false;
  }
}

// ─── POST — Main webhook handler ────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Read raw body (needed for HMAC verification before JSON parsing)
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request body." }, { status: 400 });
  }

  if (!rawBody || rawBody.trim() === "") {
    return NextResponse.json({ error: "Empty request body." }, { status: 400 });
  }

  // 2. Verify HMAC signature (production safety)
  const signatureHeader = request.headers.get("x-cal-signature-256");
  if (!verifyCalSignature(rawBody, signatureHeader)) {
    console.warn("[cal-webhook] Invalid signature — request rejected.");
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  // 3. Parse JSON payload
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // 4. Validate basic payload shape
  if (!isValidCalPayload(body)) {
    return NextResponse.json(
      { error: "Payload missing required field: triggerEvent." },
      { status: 400 },
    );
  }

  const payload = body as CalWebhookPayload;
  const eventType = payload.triggerEvent!;

  // 5. Parse and normalise the payload into a clean meeting record
  const meeting = parseCalPayload(payload, eventType);

  if (!meeting) {
    // Unrecognised event type — acknowledge but don't process
    console.info(`[cal-webhook] Unrecognised event type "${eventType}" — ignoring.`);
    return NextResponse.json(
      { success: true, message: `Event "${eventType}" is not handled.` },
      { status: 202 },
    );
  }

  // 6. Log the incoming event
  console.info(
    `[cal-webhook] Received ${eventType} for UID ${meeting.bookingUid}` +
      (meeting.clientId ? ` | client ${meeting.clientId}` : " | no clientId"),
  );

  // 7. Reject if clientId is missing — we cannot route this meeting
  if (!meeting.clientId) {
    console.warn(
      `[cal-webhook] bookingUid=${meeting.bookingUid} has no clientId — writing skipped.`
    );
    return NextResponse.json(
      {
        success: true,
        message:
          "Webhook acknowledged. No clientId in metadata — database write skipped. " +
          "Add clientId to your Cal.com booking metadata to enable meeting tracking.",
      },
      { status: 202 },
    );
  }

  // 8. Get the Supabase admin client (uses service-role key, bypasses RLS)
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("[cal-webhook] Supabase admin client is not configured.");
    return NextResponse.json(
      { error: "Database client not configured. Check SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  // 9. Upsert the meeting record — insert on first event, update on subsequent
  //    ones (e.g. BOOKING_CANCELLED after BOOKING_CREATED).
  //
  // NOTE: The Database type only defines Row shapes (not Insert/Update shapes),
  // so Supabase's TS generics resolve the insert param as `never`.
  // We cast to `unknown` first to bypass that limitation safely — the runtime
  // values are correct and validated by parseCalPayload above.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meetingsTable = (supabase as any).from("meetings");

  const meetingRecord = {
    // Natural key: booking_uid is unique per Cal.com booking
    booking_uid: meeting.bookingUid,

    // Routing
    client_id: meeting.clientId,

    // Prospect details
    prospect_name: meeting.prospectName,
    prospect_email: meeting.prospectEmail,
    email: meeting.prospectEmail,          // legacy column — keep in sync
    company: meeting.company,
    job_title: meeting.jobTitle,

    // Event metadata
    event_name: meeting.eventName,
    meeting_start: meeting.meetingStart,
    meeting_end: meeting.meetingEnd,

    // Legacy single-timestamp column — keep in sync with start
    meeting_datetime: meeting.meetingStart,

    // Status derived from event type
    status: meeting.status,

    // Source attribution
    source: meeting.source,

    // updated_at is managed by a trigger but set explicitly for new inserts
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await meetingsTable.upsert(meetingRecord, {
    // onConflict: use the unique index on booking_uid
    onConflict: "booking_uid",
    ignoreDuplicates: false,
  });

  if (upsertError) {
    console.error(
      `[cal-webhook] Database error for UID ${meeting.bookingUid}:`,
      upsertError.message,
    );
    return NextResponse.json(
      { error: "Database write failed. Please check server logs." },
      { status: 500 },
    );
  }

  console.info(
    `[cal-webhook] ✓ Meeting upserted — UID ${meeting.bookingUid} → status "${meeting.status}"`,
  );

  // 10. Return success
  return NextResponse.json({ success: true });
}

// ─── GET — Health check / test endpoint ────────────────────────────────────

/**
 * GET /api/webhooks/cal
 *
 * Returns a simple health status so you can confirm the endpoint is
 * reachable before wiring it into Cal.com.
 *
 * curl https://app.pipelineportal.com/api/webhooks/cal
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/cal",
    supportedEvents: [
      "BOOKING_CREATED",
      "BOOKING_CANCELLED",
      "BOOKING_RESCHEDULED",
      "BOOKING_NO_SHOW_UPDATED",
      "MEETING_STARTED",
      "MEETING_ENDED",
    ],
    timestamp: new Date().toISOString(),
  });
}
