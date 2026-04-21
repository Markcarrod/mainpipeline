import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  type CalWebhookPayload,
  isValidCalPayload,
  parseCalPayload,
} from "@/lib/cal-webhook";

function verifyCalSignature(rawBody: string, signatureHeader: string | null, secret: string | null): boolean {
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
    return false;
  }
}

async function getClientWebhookSigningSecret(clientId: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("client_cal_credentials")
    .select("webhook_signing_secret")
    .eq("client_id", clientId)
    .maybeSingle();

  const secret = String(data?.webhook_signing_secret ?? "").trim();
  return secret || null;
}

export async function POST(request: Request) {
  const requestClientId = new URL(request.url).searchParams.get("clientId");

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request body." }, { status: 400 });
  }

  if (!rawBody || rawBody.trim() === "") {
    return NextResponse.json({ error: "Empty request body." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!isValidCalPayload(body)) {
    return NextResponse.json(
      { error: "Payload missing required field: triggerEvent." },
      { status: 400 },
    );
  }

  const payload = body as CalWebhookPayload;
  const eventType = payload.triggerEvent!;
  const meeting = parseCalPayload(payload, eventType);

  if (!meeting) {
    return NextResponse.json(
      { success: true, message: `Event "${eventType}" is not handled.` },
      { status: 202 },
    );
  }

  const resolvedClientId = meeting.clientId ?? requestClientId ?? null;
  const clientSecret = resolvedClientId ? await getClientWebhookSigningSecret(resolvedClientId) : null;
  const signatureHeader = request.headers.get("x-cal-signature-256");

  if (resolvedClientId && !clientSecret) {
    return NextResponse.json(
      { error: "Webhook signing secret is not configured for this client." },
      { status: 401 },
    );
  }

  if (!verifyCalSignature(rawBody, signatureHeader, clientSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  if (!resolvedClientId) {
    return NextResponse.json(
      {
        success: true,
        message:
          "Webhook acknowledged. No clientId in metadata - database write skipped. " +
          "Add clientId to your Cal.com booking metadata to enable meeting tracking.",
      },
      { status: 202 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Database client not configured. Check SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meetingsTable = (supabase as any).from("meetings");

  const meetingRecord = {
    booking_uid: meeting.bookingUid,
    client_id: resolvedClientId,
    prospect_name: meeting.prospectName,
    prospect_email: meeting.prospectEmail,
    email: meeting.prospectEmail,
    company: meeting.company,
    job_title: meeting.jobTitle,
    event_name: meeting.eventName,
    meeting_start: meeting.meetingStart,
    meeting_end: meeting.meetingEnd,
    meeting_datetime: meeting.meetingStart,
    status: meeting.status,
    source: meeting.source,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await meetingsTable.upsert(meetingRecord, {
    onConflict: "booking_uid",
    ignoreDuplicates: false,
  });

  if (upsertError) {
    return NextResponse.json(
      { error: "Database write failed. Please check server logs." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/calcom",
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
