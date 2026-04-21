/**
 * cal-webhook.ts
 *
 * Modular helpers for the Pipeline Portal Cal.com webhook integration.
 * All Cal.com-specific business logic lives here so the route handler
 * stays thin and easy to test.
 */

export const CAL_EVENT_TYPES = [
  "BOOKING_CREATED",
  "BOOKING_CANCELLED",
  "BOOKING_RESCHEDULED",
  "BOOKING_NO_SHOW_UPDATED",
  "MEETING_STARTED",
  "MEETING_ENDED",
] as const;

export type CalEventType = (typeof CAL_EVENT_TYPES)[number];

export type MeetingStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show";

const EVENT_STATUS_MAP: Record<CalEventType, MeetingStatus> = {
  BOOKING_CREATED: "scheduled",
  BOOKING_CANCELLED: "cancelled",
  BOOKING_RESCHEDULED: "rescheduled",
  BOOKING_NO_SHOW_UPDATED: "no_show",
  MEETING_STARTED: "scheduled",
  MEETING_ENDED: "completed",
};

export function mapEventToStatus(event: string): MeetingStatus | null {
  if (!CAL_EVENT_TYPES.includes(event as CalEventType)) return null;
  return EVENT_STATUS_MAP[event as CalEventType];
}

export interface CalWebhookPayload {
  triggerEvent?: string;
  event?: string;
  type?: string;
  createdAt?: string;
  uid?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  metadata?: Record<string, string>;
  attendees?: Array<{
    name?: string;
    email?: string;
    timeZone?: string;
  }>;
  bookingFieldsResponses?: {
    clientId?: string;
    company?: { value?: string } | string;
    jobTitle?: { value?: string } | string;
    notes?: string;
    [key: string]: unknown;
  };
  payload?: {
    uid?: string;
    bookingUid?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    attendee?: {
      name?: string;
      email?: string;
      timeZone?: string;
    };
    attendees?: Array<{
      name?: string;
      email?: string;
      timeZone?: string;
    }>;
    bookingFieldsResponses?: {
      clientId?: string;
      company?: { value?: string } | string;
      jobTitle?: { value?: string } | string;
      notes?: string;
      [key: string]: unknown;
    };
    metadata?: Record<string, string>;
  };
}

export interface ParsedMeetingData {
  bookingUid: string;
  clientId: string | null;
  prospectName: string;
  prospectEmail: string;
  company: string;
  jobTitle: string;
  eventName: string;
  meetingStart: string;
  meetingEnd: string;
  status: MeetingStatus;
  source: string;
}

export function parseCalPayload(
  body: CalWebhookPayload,
  eventType: string,
): ParsedMeetingData | null {
  const status = mapEventToStatus(eventType);
  if (!status) return null;

  // BOOKING_* usually nested in `payload`, MEETING_* may be flat.
  const p = (body.payload ?? body) as NonNullable<CalWebhookPayload["payload"]> & {
    attendees?: Array<{ name?: string; email?: string }>;
  };

  const bookingUid = p.uid ?? p.bookingUid ?? null;
  if (!bookingUid) return null;

  const clientId =
    (p.bookingFieldsResponses?.clientId as string | undefined) ??
    p.metadata?.clientId ??
    body.metadata?.clientId ??
    null;

  function unwrapField(
    val: { value?: string } | string | undefined,
    fallback: string,
  ): string {
    if (!val) return fallback;
    if (typeof val === "string") return val || fallback;
    return val.value || fallback;
  }

  const firstAttendee = Array.isArray(p.attendees) ? p.attendees[0] : undefined;
  const attendee = p.attendee ?? firstAttendee;

  const prospectName = attendee?.name ?? "Unknown";
  const prospectEmail = attendee?.email ?? "unknown@example.com";
  const company = unwrapField(
    p.bookingFieldsResponses?.company as { value?: string } | string | undefined,
    "Unknown company",
  );
  const jobTitle = unwrapField(
    p.bookingFieldsResponses?.jobTitle as { value?: string } | string | undefined,
    "Unknown title",
  );
  const eventName = p.title ?? "Meeting";
  const meetingStart = p.startTime ?? new Date().toISOString();
  const meetingEnd = p.endTime ?? new Date().toISOString();

  return {
    bookingUid,
    clientId,
    prospectName,
    prospectEmail,
    company,
    jobTitle,
    eventName,
    meetingStart,
    meetingEnd,
    status,
    source: "Cal.com",
  };
}

export function isValidCalPayload(body: unknown): body is CalWebhookPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    (typeof b.triggerEvent === "string" && b.triggerEvent.length > 0) ||
    (typeof b.event === "string" && b.event.length > 0) ||
    (typeof b.type === "string" && b.type.length > 0)
  );
}

export function getTriggerEvent(body: CalWebhookPayload): string | null {
  const event = body.triggerEvent ?? body.event ?? body.type ?? null;
  if (!event || typeof event !== "string") return null;
  return event;
}
