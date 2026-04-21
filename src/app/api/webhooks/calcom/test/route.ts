/**
 * /app/api/webhooks/cal/test/route.ts
 *
 * Health-check endpoint for the Cal.com webhook integration.
 *
 * Use this URL to verify the webhook endpoint is reachable before
 * adding it to Cal.com settings:
 *
 *   GET https://app.pipelineportal.com/api/webhooks/cal/test
 *
 * Returns { status: "ok" } with a 200.
 */

import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  const configured = {
    supabase: Boolean(env.supabaseUrl && env.supabaseServiceRoleKey),
    hmacVerification: Boolean(env.calcomSigningSecret),
  };

  return NextResponse.json({
    status: "ok",
    message: "Pipeline Portal Cal.com webhook endpoint is live.",
    webhookUrl: "https://app.pipelineportal.com/api/webhooks/calcom",
    configured,
    timestamp: new Date().toISOString(),
  });
}
