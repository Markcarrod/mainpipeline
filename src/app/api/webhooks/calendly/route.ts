import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { calendlyInviteeToMeetingRecord, type CalendlyInvitee } from "@/lib/calendly-sync";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface CalendlyWebhookPayload {
  event?: string;
  created_at?: string;
  payload?: CalendlyInvitee;
}

function getSignatureParts(signatureHeader: string | null) {
  if (!signatureHeader) return null;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );

  return {
    timestamp: parts.t,
    signature: parts.v1,
  };
}

function verifyCalendlySignature(rawBody: string, signatureHeader: string | null, secret: string | null) {
  if (!secret) return true;

  const parts = getSignatureParts(signatureHeader);
  if (!parts?.timestamp || !parts.signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${parts.timestamp}.${rawBody}`, "utf8")
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(parts.signature, "hex"));
  } catch {
    return false;
  }
}

async function getClientWebhookSigningSecret(clientId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("client_calendly_credentials")
    .select("webhook_signing_secret")
    .eq("client_id", clientId)
    .maybeSingle();

  const secret = String(data?.webhook_signing_secret ?? "").trim();
  return secret || null;
}

export async function POST(request: Request) {
  const requestClientId = new URL(request.url).searchParams.get("clientId");

  if (!requestClientId) {
    return NextResponse.json({ error: "Missing clientId." }, { status: 400 });
  }

  const rawBody = await request.text();
  const signingSecret = await getClientWebhookSigningSecret(requestClientId);
  const signatureHeader = request.headers.get("calendly-webhook-signature");

  if (!verifyCalendlySignature(rawBody, signatureHeader, signingSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let body: CalendlyWebhookPayload;
  try {
    body = JSON.parse(rawBody) as CalendlyWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventType = body.event ?? "";
  const invitee = body.payload;

  if (!invitee || !["invitee.created", "invitee.canceled"].includes(eventType)) {
    return NextResponse.json({ success: true, message: `Event "${eventType}" is not handled.` }, { status: 202 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });
  }

  const meetingRecord = calendlyInviteeToMeetingRecord(requestClientId, invitee);
  if (!meetingRecord) {
    return NextResponse.json({ error: "Calendly payload is missing an invitee URI." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: webhookEvent } = await (supabase as any).from("webhook_events").insert({
    trigger_event: eventType,
    booking_uid: meetingRecord.booking_uid,
    cal_booking_id: meetingRecord.cal_booking_id,
    client_id: requestClientId,
    payload: body,
    headers: Object.fromEntries(request.headers.entries()),
  }).select("id").maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("meetings").upsert(meetingRecord, {
    onConflict: "booking_uid",
    ignoreDuplicates: false,
  });

  if (error) {
    if (webhookEvent?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("webhook_events").update({
        processed_successfully: false,
        processing_error: error.message,
      }).eq("id", webhookEvent.id);
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (webhookEvent?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("webhook_events").update({
      processed_successfully: true,
    }).eq("id", webhookEvent.id);
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/calendly",
    supportedEvents: ["invitee.created", "invitee.canceled"],
    timestamp: new Date().toISOString(),
  });
}
