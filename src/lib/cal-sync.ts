import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { MeetingStatus } from "@/types/portal";

export const CAL_API_VERSION = "2026-02-25";
const CAL_BOOKINGS_URL = "https://api.cal.com/v2/bookings";

type AdminClient = SupabaseClient<Database>;

type FieldValue = string | { value?: string | number | boolean | null } | null | undefined;

interface CalPerson {
  name?: string | null;
  email?: string | null;
  displayEmail?: string | null;
  timeZone?: string | null;
  absent?: boolean | null;
}

export interface CalApiBooking {
  id?: string | number;
  uid?: string;
  bookingUid?: string;
  title?: string;
  status?: string;
  start?: string;
  end?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  meetingUrl?: string;
  eventTypeId?: string | number;
  eventType?: { id?: string | number; slug?: string | null } | null;
  hosts?: CalPerson[];
  attendees?: CalPerson[];
  attendee?: CalPerson;
  absentHost?: boolean | null;
  bookingFieldsResponses?: Record<string, FieldValue>;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt?: string;
  updatedAt?: string;
  rescheduledFromUid?: string | null;
  rescheduledToUid?: string | null;
}

interface CalBookingsResponse {
  status?: string;
  data?: CalApiBooking[];
  pagination?: {
    hasNextPage?: boolean;
    returnedItems?: number;
  };
  message?: string;
  error?: string;
}

export interface CalSyncResult {
  clientId: string;
  fetched: number;
  upserted: number;
  skipped: number;
}

function unwrapField(value: FieldValue, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value || fallback;
  const unwrapped = value.value;
  if (unwrapped === null || unwrapped === undefined) return fallback;
  return String(unwrapped) || fallback;
}

function firstString(...values: Array<string | number | boolean | null | undefined>) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }

  return "";
}

function normalizeBookingStatus(booking: CalApiBooking, now = new Date()): MeetingStatus {
  const calStatus = String(booking.status ?? "").toLowerCase();

  if (calStatus.includes("cancel")) return "cancelled";
  if (booking.rescheduledFromUid || booking.rescheduledToUid || calStatus.includes("resched")) {
    return "rescheduled";
  }
  if (booking.absentHost || booking.attendees?.some((attendee) => attendee.absent)) return "no_show";
  if (calStatus.includes("no_show") || calStatus.includes("no-show")) return "no_show";
  if (calStatus.includes("reject") || calStatus.includes("declin")) return "cancelled";

  const end = booking.end ?? booking.endTime;
  if (end && new Date(end) < now) return "completed";

  return "scheduled";
}

export function bookingToMeetingRecord(clientId: string, booking: CalApiBooking) {
  const bookingUid = firstString(booking.uid, booking.bookingUid);
  if (!bookingUid) return null;

  const attendee = booking.attendee ?? booking.attendees?.[0] ?? {};
  const host = booking.hosts?.[0] ?? {};
  const start = firstString(booking.start, booking.startTime, booking.createdAt, new Date().toISOString());
  const end = firstString(booking.end, booking.endTime, start);
  const fields = booking.bookingFieldsResponses ?? {};
  const prospectEmail = firstString(attendee.email, attendee.displayEmail, "unknown@example.com");
  const eventTypeId = firstString(booking.eventTypeId, booking.eventType?.id);
  const meetingUrl = firstString(booking.meetingUrl, booking.location);

  return {
    booking_uid: bookingUid,
    client_id: clientId,
    prospect_name: firstString(attendee.name, "Unknown"),
    prospect_email: prospectEmail,
    email: prospectEmail,
    company: unwrapField(fields.company, "Unknown company"),
    job_title: unwrapField(fields.jobTitle, "Unknown title"),
    event_name: firstString(booking.title, booking.eventType?.slug, "Meeting"),
    meeting_start: start,
    meeting_end: end,
    meeting_datetime: start,
    status: normalizeBookingStatus(booking),
    source: "Cal.com",
    notes: meetingUrl ? `Meeting URL: ${meetingUrl}` : null,
    cal_booking_id: firstString(booking.id) || null,
    event_type_id: eventTypeId || null,
    host_name: firstString(host.name) || null,
    host_email: firstString(host.email, host.displayEmail) || null,
    raw_latest_payload: booking as unknown as Json,
    last_event_at: firstString(booking.updatedAt, booking.createdAt) || null,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertCalBookings(
  supabase: AdminClient,
  clientId: string,
  bookings: CalApiBooking[],
) {
  const records = bookings
    .map((booking) => bookingToMeetingRecord(clientId, booking))
    .filter((record): record is NonNullable<ReturnType<typeof bookingToMeetingRecord>> => Boolean(record));

  if (!records.length) {
    return { upserted: 0, skipped: bookings.length };
  }

  const { error } = await supabase.from("meetings").upsert(records as never, {
    onConflict: "booking_uid",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { upserted: records.length, skipped: bookings.length - records.length };
}

async function fetchCalBookingsPage(
  apiKey: string,
  params: URLSearchParams,
): Promise<CalBookingsResponse> {
  const response = await fetch(`${CAL_BOOKINGS_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": CAL_API_VERSION,
    },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as CalBookingsResponse;

  if (!response.ok) {
    throw new Error(data.message || data.error || `Cal.com returned ${response.status}`);
  }

  return data;
}

export async function syncClientCalBookings(
  supabase: AdminClient,
  credential: { client_id: string; cal_api_key: string },
  options: { lookbackDays?: number; take?: number } = {},
): Promise<CalSyncResult> {
  const lookbackDays = options.lookbackDays ?? 45;
  const take = options.take ?? 100;
  const afterUpdatedAt = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  let skip = 0;
  let fetched = 0;
  let upserted = 0;
  let skipped = 0;

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({
      status: "upcoming,past,cancelled,unconfirmed",
      afterUpdatedAt,
      sortUpdatedAt: "asc",
      take: String(take),
      skip: String(skip),
    });
    const data = await fetchCalBookingsPage(credential.cal_api_key, params);
    const bookings = Array.isArray(data.data) ? data.data : [];
    const result = await upsertCalBookings(supabase, credential.client_id, bookings);

    fetched += bookings.length;
    upserted += result.upserted;
    skipped += result.skipped;

    if (!data.pagination?.hasNextPage || bookings.length === 0) break;
    skip += bookings.length;
  }

  return { clientId: credential.client_id, fetched, upserted, skipped };
}
