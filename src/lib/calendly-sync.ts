import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { MeetingStatus } from "@/types/portal";

const CALENDLY_API_URL = "https://api.calendly.com";

type AdminClient = SupabaseClient<Database>;

interface CalendlyPerson {
  name?: string | null;
  email?: string | null;
}

interface CalendlyLocation {
  type?: string | null;
  location?: string | null;
  join_url?: string | null;
}

export interface CalendlyScheduledEvent {
  uri?: string;
  name?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  event_type?: string;
  location?: CalendlyLocation | null;
  event_memberships?: Array<{
    user?: string;
    user_name?: string;
    user_email?: string;
  }>;
}

export interface CalendlyInvitee {
  uri?: string;
  name?: string;
  email?: string;
  status?: string;
  canceled?: boolean;
  rescheduled?: boolean;
  cancellation?: {
    reason?: string | null;
    canceled_by?: string | null;
  } | null;
  tracking?: Record<string, string | null>;
  questions_and_answers?: Array<{
    question?: string;
    answer?: string;
  }>;
  scheduled_event?: CalendlyScheduledEvent | string;
  created_at?: string;
  updated_at?: string;
}

interface CalendlyCollectionResponse<T> {
  collection?: T[];
  pagination?: {
    next_page?: string | null;
  };
  resource?: T;
}

export interface CalendlySyncResult {
  clientId: string;
  fetched: number;
  upserted: number;
  skipped: number;
}

function firstString(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
}

function findAnswer(invitee: CalendlyInvitee, patterns: string[], fallback: string) {
  const answer = invitee.questions_and_answers?.find((item) => {
    const question = String(item.question ?? "").toLowerCase();
    return patterns.some((pattern) => question.includes(pattern));
  })?.answer;

  return firstString(answer, fallback);
}

function normalizeCalendlyStatus(event: CalendlyScheduledEvent, invitee: CalendlyInvitee, now = new Date()): MeetingStatus {
  const eventStatus = String(event.status ?? "").toLowerCase();
  const inviteeStatus = String(invitee.status ?? "").toLowerCase();

  if (invitee.canceled || eventStatus === "canceled" || inviteeStatus === "canceled") return "cancelled";
  if (invitee.rescheduled) return "rescheduled";
  if (event.end_time && new Date(event.end_time) < now) return "completed";

  return "scheduled";
}

function getScheduledEvent(invitee: CalendlyInvitee, fallbackEvent?: CalendlyScheduledEvent) {
  if (invitee.scheduled_event && typeof invitee.scheduled_event === "object") {
    return invitee.scheduled_event;
  }

  return fallbackEvent ?? {};
}

export function calendlyInviteeToMeetingRecord(
  clientId: string,
  invitee: CalendlyInvitee,
  fallbackEvent?: CalendlyScheduledEvent,
) {
  const event = getScheduledEvent(invitee, fallbackEvent);
  const bookingUid = firstString(invitee.uri, event.uri);

  if (!bookingUid) return null;

  const host = event.event_memberships?.[0];
  const location = event.location;
  const meetingUrl = firstString(location?.join_url, location?.location);
  const company = findAnswer(invitee, ["company", "organization", "business"], "Unknown company");
  const jobTitle = findAnswer(invitee, ["title", "role", "position"], "Unknown title");

  return {
    booking_uid: bookingUid,
    client_id: clientId,
    prospect_name: firstString(invitee.name, "Unknown"),
    prospect_email: firstString(invitee.email, "unknown@example.com"),
    email: firstString(invitee.email, "unknown@example.com"),
    company,
    job_title: jobTitle,
    event_name: firstString(event.name, "Calendly meeting"),
    meeting_start: firstString(event.start_time, invitee.created_at, new Date().toISOString()),
    meeting_end: firstString(event.end_time, event.start_time, new Date().toISOString()),
    meeting_datetime: firstString(event.start_time, invitee.created_at, new Date().toISOString()),
    status: normalizeCalendlyStatus(event, invitee),
    source: "Calendly",
    notes: meetingUrl ? `Meeting URL: ${meetingUrl}` : null,
    cal_booking_id: firstString(event.uri) || null,
    event_type_id: firstString(event.event_type) || null,
    host_name: firstString(host?.user_name) || null,
    host_email: firstString(host?.user_email) || null,
    raw_latest_payload: { invitee, event } as unknown as Json,
    last_event_at: firstString(invitee.updated_at, invitee.created_at) || null,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertCalendlyInvitees(
  supabase: AdminClient,
  clientId: string,
  invitees: Array<{ invitee: CalendlyInvitee; event?: CalendlyScheduledEvent }>,
) {
  const records = invitees
    .map(({ invitee, event }) => calendlyInviteeToMeetingRecord(clientId, invitee, event))
    .filter((record): record is NonNullable<ReturnType<typeof calendlyInviteeToMeetingRecord>> => Boolean(record));

  if (!records.length) {
    return { upserted: 0, skipped: invitees.length };
  }

  const { error } = await supabase.from("meetings").upsert(records as never, {
    onConflict: "booking_uid",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { upserted: records.length, skipped: invitees.length - records.length };
}

async function calendlyGet<T>(token: string, url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as T & { message?: string; title?: string };

  if (!response.ok) {
    throw new Error(data.message || data.title || `Calendly returned ${response.status}`);
  }

  return data;
}

export async function getCalendlyUserContext(token: string) {
  const data = await calendlyGet<{
    resource?: {
      uri?: string;
      current_organization?: string;
    };
  }>(token, `${CALENDLY_API_URL}/users/me`);

  return {
    userUri: data.resource?.uri ?? "",
    organizationUri: data.resource?.current_organization ?? "",
  };
}

export async function syncClientCalendlyBookings(
  supabase: AdminClient,
  credential: { client_id: string; calendly_api_key: string; user_uri?: string | null },
  options: { lookbackDays?: number; count?: number } = {},
): Promise<CalendlySyncResult> {
  const lookbackDays = options.lookbackDays ?? 45;
  const count = options.count ?? 50;
  const userUri = credential.user_uri || (await getCalendlyUserContext(credential.calendly_api_key)).userUri;

  if (!userUri) {
    throw new Error("Calendly user URI could not be resolved from the API token.");
  }

  const minStartTime = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  const maxStartTime = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const eventUrl = new URL(`${CALENDLY_API_URL}/scheduled_events`);
  eventUrl.searchParams.set("user", userUri);
  eventUrl.searchParams.set("min_start_time", minStartTime);
  eventUrl.searchParams.set("max_start_time", maxStartTime);
  eventUrl.searchParams.set("count", String(count));

  let nextEventsUrl: string | null = eventUrl.toString();
  let fetched = 0;
  let upserted = 0;
  let skipped = 0;

  for (let page = 0; nextEventsUrl && page < 10; page += 1) {
    const eventsData: CalendlyCollectionResponse<CalendlyScheduledEvent> = await calendlyGet<CalendlyCollectionResponse<CalendlyScheduledEvent>>(
      credential.calendly_api_key,
      nextEventsUrl,
    );

    for (const event of eventsData.collection ?? []) {
      if (!event.uri) continue;

      const inviteesUrl = new URL(`${event.uri}/invitees`);
      inviteesUrl.searchParams.set("count", "100");
      const inviteesData = await calendlyGet<CalendlyCollectionResponse<CalendlyInvitee>>(
        credential.calendly_api_key,
        inviteesUrl.toString(),
      );
      const invitees = (inviteesData.collection ?? []).map((invitee) => ({ invitee, event }));
      const result = await upsertCalendlyInvitees(supabase, credential.client_id, invitees);

      fetched += invitees.length;
      upserted += result.upserted;
      skipped += result.skipped;
    }

    nextEventsUrl = eventsData.pagination?.next_page ?? null;
  }

  return { clientId: credential.client_id, fetched, upserted, skipped };
}
