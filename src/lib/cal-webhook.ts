/**
 * cal-webhook.ts
 *
 * Modular helpers for the Pipeline Portal Cal.com webhook integration.
 * All Cal.com-specific business logic lives here so the route handler
 * stays thin and easy to test.
 */

// ─── Supported Cal.com trigger event types ─────────────────────────────────

export const CAL_EVENT_TYPES = [
  "BOOKING_CREATED",
  "BOOKING_CANCELLED",
  "BOOKING_RESCHEDULED",
  "BOOKING_NO_SHOW_UPDATED",
  "MEETING_STARTED",
  "MEETING_ENDED",
] as const;

export type CalEventType = (typeof CAL_EVENT_TYPES)[number];

// Meeting status values stored in the database
export type MeetingStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show";

// ─── Event → status mapping ─────────────────────────────────────────────────

const EVENT_STATUS_MAP: Record<CalEventType, MeetingStatus> = {
  BOOKING_CREATED: "scheduled",
  BOOKING_CANCELLED: "cancelled",
  BOOKING_RESCHEDULED: "rescheduled",
  BOOKING_NO_SHOW_UPDATED: "no_show",
  MEETING_STARTED: "scheduled",
  MEETING_ENDED: "completed",
};

/**
 * Returns the MeetingStatus for a given Cal.com trigger event string.
 * Returns null if the event type is unrecognised.
 */
export function mapEventToStatus(event: string): MeetingStatus | null {
  if (!CAL_EVENT_TYPES.includes(event as CalEventType)) return null;
  return EVENT_STATUS_MAP[event as CalEventType];
}

// ─── Raw Cal.com webhook payload types ─────────────────────────────────────

/** Shape of the raw JSON body sent by Cal.com webhooks. */
export interface CalWebhookPayload {
  /** e.g. "BOOKING_CREATED" */
  triggerEvent?: string;
  createdAt?: string;
  payload?: {
    uid?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    /** Primary attendee (the prospect) */
    attendee?: {
      name?: string;
      email?: string;
      timeZone?: string;
    };
    /** Flat responses from Cal.com booking form fields */
    bookingFieldsResponses?: {
      /** Pipeline Portal client UUID — injected via metadata */
      clientId?: string;
      company?: { value?: string } | string;
      jobTitle?: { value?: string } | string;
      notes?: string;
      [key: string]: unknown;
    };
    /** Free-form metadata object that can also carry clientId */
    metadata?: Record<string, string>;
  };
}

// ─── Normalised meeting record ───────────────────────────────────────────────

/** Clean, validated data ready to upsert into the meetings table. */
export interface ParsedMeetingData {
  bookingUid: string;
  clientId: string | null;
  prospectName: string;
  prospectEmail: string;
  company: string;
  jobTitle: string;
  eventName: string;
  meetingStart: string; // ISO-8601 UTC
  meetingEnd: string; // ISO-8601 UTC
  status: MeetingStatus;
  source: string;
}

/**
 * Extracts all fields we care about from a raw Cal.com payload.
 *
 * Handles two common Cal.com field shapes:
 *  - Simple string: `{ company: "Acme" }`
 *  - Object with value: `{ company: { value: "Acme" } }`
 */
export function parseCalPayload(
  body: CalWebhookPayload,
  eventType: string,
): ParsedMeetingData | null {
  const status = mapEventToStatus(eventType);
  if (!status) return null;

  const p = body.payload;
  if (!p) return null;

  // booking_uid is mandatory — without it we cannot upsert
  const bookingUid = p.uid ?? null;
  if (!bookingUid) return null;

  // Prefer clientId from booking form fields, fall back to metadata
  const clientId =
    (p.bookingFieldsResponses?.clientId as string | undefined) ??
    p.metadata?.clientId ??
    null;

  // Helper to unwrap single-value or string field shapes
  function unwrapField(
    val: { value?: string } | string | undefined,
    fallback: string,
  ): string {
    if (!val) return fallback;
    if (typeof val === "string") return val || fallback;
    return val.value || fallback;
  }

  const prospectName = p.attendee?.name ?? "Unknown";
  const prospectEmail = p.attendee?.email ?? "unknown@example.com";
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

/**
 * Validates that the raw body is a non-null object with at least a
 * `triggerEvent` field string. Returns false for obviously malformed payloads.
 */
export function isValidCalPayload(body: unknown): body is CalWebhookPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return typeof b.triggerEvent === "string" && b.triggerEvent.length > 0;
}
