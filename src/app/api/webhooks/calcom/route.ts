import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

interface CalcomPayload {
  triggerEvent?: string;
  createdAt?: string;
  payload?: {
    startTime?: string;
    attendee?: {
      name?: string;
      email?: string;
      timeZone?: string;
    };
    bookingFieldsResponses?: {
      company?: string;
      jobTitle?: string;
      notes?: string;
      clientId?: string;
      campaignId?: string;
      accountId?: string;
    };
    metadata?: Record<string, string>;
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const parsed = JSON.parse(rawBody) as CalcomPayload;
  const headerStore = await headers();

  if (env.calcomSigningSecret) {
    const providedSecret = headerStore.get("x-cal-signature-256");

    if (!providedSecret) {
      return NextResponse.json({ error: "Missing Cal.com signature header." }, { status: 401 });
    }
  }

  const clientId =
    parsed.payload?.bookingFieldsResponses?.clientId ?? parsed.payload?.metadata?.clientId;
  const campaignId =
    parsed.payload?.bookingFieldsResponses?.campaignId ?? parsed.payload?.metadata?.campaignId;
  const accountId =
    parsed.payload?.bookingFieldsResponses?.accountId ?? parsed.payload?.metadata?.accountId ?? "acct_01";

  if (!clientId || !campaignId) {
    return NextResponse.json(
      {
        mode: "demo",
        message: "Webhook received, but clientId or campaignId is missing from the payload metadata.",
      },
      { status: 202 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({
      mode: "demo",
      message: "Webhook received in demo mode. No database write performed.",
      received: parsed.triggerEvent ?? "booking.created",
    });
  }

  const { error } = await (supabase.from("meetings") as never as {
    insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  }).insert({
    client_id: clientId,
    campaign_id: campaignId,
    prospect_name: parsed.payload?.attendee?.name ?? "Cal.com attendee",
    email: parsed.payload?.attendee?.email ?? "unknown@example.com",
    company: parsed.payload?.bookingFieldsResponses?.company ?? "Unknown company",
    job_title: parsed.payload?.bookingFieldsResponses?.jobTitle ?? "Unknown title",
    meeting_datetime: parsed.payload?.startTime ?? new Date().toISOString(),
    status: "scheduled",
    source: "Website",
    account_id: accountId,
    notes: parsed.payload?.bookingFieldsResponses?.notes ?? "Created from Cal.com webhook",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Meeting record created from Cal.com webhook.",
  });
}
