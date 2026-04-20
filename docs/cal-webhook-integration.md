# Pipeline Portal — Cal.com Webhook Integration

This document explains how to connect each client's Cal.com account to Pipeline Portal so that every booking event is automatically tracked in the meetings database.

---

## How it works

```
Add Client
    ↓
System generates unique Webhook URL for the client
    ↓
Client pastes that URL into their Cal.com webhook settings
    ↓
Cal.com sends booking events → Pipeline Portal receives & stores them
    ↓
Meetings appear in your dashboard in real time
```

---

## 1 — Webhook URL

Each client's webhook URL follows this format:

```
https://app.pipelineportal.com/api/webhooks/cal?clientId=<CLIENT_UUID>
```

Replace `<CLIENT_UUID>` with the client's Pipeline Portal `id` from the `clients` table.

> **Why a separate URL per client?**  
> Cal.com sends webhooks without any built-in tenant identifier. By passing `clientId` in the URL query string (or via Cal.com booking form metadata), Pipeline Portal can route each booking to the correct client record.

---

## 2 — Set up the webhook in Cal.com

Follow these steps for each client:

1. Log in to the client's Cal.com account at [cal.com](https://cal.com)
2. Go to **Settings → Developer → Webhooks**
3. Click **"Add Webhook"** (or **"New Webhook"**)
4. In the **Subscriber URL** field, paste:
   ```
   https://app.pipelineportal.com/api/webhooks/cal
   ```
5. Under **"Active Events"**, check all of the following:
   - ☑ `BOOKING_CREATED`
   - ☑ `BOOKING_CANCELLED`
   - ☑ `BOOKING_RESCHEDULED`
   - ☑ `BOOKING_NO_SHOW_UPDATED`
   - ☑ `MEETING_STARTED`
   - ☑ `MEETING_ENDED`
6. **(Recommended for production)** — Enable the **"Secret"** field and copy the value into your `.env.local` / Vercel environment as `CALCOM_WEBHOOK_SIGNING_SECRET`
7. Click **"Save"**

---

## 3 — Pass clientId via booking metadata

Pipeline Portal needs to know *which client* a booking belongs to. The cleanest way is to add a hidden `clientId` field to the Cal.com booking form.

### Option A — Cal.com Booking Form Custom Field (recommended)

1. Open the event type in Cal.com
2. Go to **"Booking Questions"**
3. Add a new question:
   - **Type:** Short text
   - **Identifier:** `clientId`
   - **Default value:** `<CLIENT_UUID>`
   - **Hidden:** ✓ (checked)
4. Save the event type

The value will appear in `bookingFieldsResponses.clientId` in every webhook payload.

### Option B — Cal.com Metadata

Alternatively, include it in the Cal.com [metadata](https://cal.com/docs/developing/webhooks#metadata) object if using the API to create bookings programmatically.

---

## 4 — Verify the integration

### Health check

Before adding the URL in Cal.com, confirm the endpoint is reachable:

```bash
curl https://app.pipelineportal.com/api/webhooks/cal/test
```

Expected response:
```json
{
  "status": "ok",
  "message": "Pipeline Portal Cal.com webhook endpoint is live.",
  "webhookUrl": "https://app.pipelineportal.com/api/webhooks/cal",
  "configured": {
    "supabase": true,
    "hmacVerification": true
  }
}
```

### Send a test payload

Use the **"Test"** button inside Cal.com's webhook settings page.  
Alternatively, send a manual test with `curl`:

```bash
curl -X POST https://app.pipelineportal.com/api/webhooks/cal \
  -H "Content-Type: application/json" \
  -d '{
    "triggerEvent": "BOOKING_CREATED",
    "createdAt": "2026-04-20T22:00:00Z",
    "payload": {
      "uid": "test-booking-uid-001",
      "title": "Discovery Call",
      "startTime": "2026-04-25T09:00:00Z",
      "endTime": "2026-04-25T09:30:00Z",
      "attendee": {
        "name": "Jane Smith",
        "email": "jane@acmecorp.com",
        "timeZone": "Europe/London"
      },
      "bookingFieldsResponses": {
        "clientId": "<YOUR_CLIENT_UUID>",
        "company": "Acme Corp",
        "jobTitle": "Head of Sales"
      },
      "metadata": {}
    }
  }'
```

Expected response:
```json
{ "success": true }
```

---

## 5 — Event → meeting status mapping

| Cal.com Event            | Meeting status in Portal |
|--------------------------|--------------------------|
| `BOOKING_CREATED`        | `scheduled`              |
| `BOOKING_CANCELLED`      | `cancelled`              |
| `BOOKING_RESCHEDULED`    | `rescheduled`            |
| `BOOKING_NO_SHOW_UPDATED`| `no_show`                |
| `MEETING_STARTED`        | `scheduled`              |
| `MEETING_ENDED`          | `completed`              |

Each event **upserts** based on `booking_uid`, so a booking that goes through multiple state changes (e.g. created → rescheduled → completed) results in a single meeting row with an up-to-date status.

---

## 6 — Database schema changes

Run the migration file against your Supabase project before deploying:

```
supabase/migrations/20260420_meetings_webhook.sql
```

Or paste the contents into the **Supabase SQL Editor** and run it manually.

Key additions to `public.meetings`:

| Column          | Type         | Notes                              |
|-----------------|--------------|------------------------------------|
| `booking_uid`   | text (unique)| Cal.com booking UID — enables upsert |
| `prospect_email`| text         | Attendee email from Cal.com        |
| `meeting_start` | timestamptz  | Booking start (UTC)                |
| `meeting_end`   | timestamptz  | Booking end (UTC)                  |
| `event_name`    | text         | Cal.com event type name            |
| `updated_at`    | timestamptz  | Auto-updated on every change       |

---

## 7 — Environment variables

| Variable                      | Required | Description                                        |
|-------------------------------|----------|----------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`    | ✅       | Supabase project URL                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅     | Supabase anon key (client-side safe)               |
| `SUPABASE_SERVICE_ROLE_KEY`   | ✅       | Service role key — used for webhook DB writes      |
| `CALCOM_API_KEY`              | Optional | For creating event types via the Cal.com API       |
| `CALCOM_WEBHOOK_SIGNING_SECRET` | Recommended | HMAC-SHA256 webhook signature verification  |

Add these in **Vercel → Project → Settings → Environment Variables** for production.

---

## 8 — Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `401 Invalid webhook signature` | `CALCOM_WEBHOOK_SIGNING_SECRET` mismatch | Copy the secret from Cal.com webhook settings and re-set in Vercel |
| `202` response, no DB row | `clientId` missing from payload | Add a hidden `clientId` booking field in Cal.com event type |
| `500` response | Supabase write failed | Check Vercel function logs; ensure migration has been applied |
| No events arriving | Webhook URL wrong or events not selected | Verify URL in Cal.com settings and tick all 6 events |
