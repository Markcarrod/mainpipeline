import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncClientCalBookings } from "@/lib/cal-sync";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request: Request) {
  if (!env.cronSecret) return true;

  const authorization = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");

  return authorization === `Bearer ${env.cronSecret}` || headerSecret === env.cronSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized sync request." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("client_cal_credentials")
    .select("client_id, cal_api_key")
    .neq("cal_api_key", "");

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data: credentials, error: credentialsError } = await query;

  if (credentialsError) {
    return NextResponse.json({ error: credentialsError.message }, { status: 500 });
  }

  const startedAt = new Date().toISOString();
  const results = [];

  for (const credential of credentials ?? []) {
    try {
      results.push(await syncClientCalBookings(supabase, credential));
    } catch (error) {
      results.push({
        clientId: String(credential.client_id),
        error: error instanceof Error ? error.message : "Unknown Cal sync error.",
      });
    }
  }

  const failed = results.filter((result) => "error" in result);
  const status = failed.length ? "partial_failure" : "success";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("sync_logs").insert({
    sync_type: "cal_bookings",
    status,
    message: failed.length ? `${failed.length} client sync(s) failed.` : "Cal bookings synced.",
    metadata: { startedAt, results },
  });

  return NextResponse.json({
    success: failed.length === 0,
    startedAt,
    results,
  });
}

export async function GET(request: Request) {
  return POST(request);
}
