# Pipeline Portal

Pipeline Portal is a polished MVP for an SDR client portal and internal CRM-style dashboard. It is built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-style components, Recharts, and Supabase-ready auth/data scaffolding.

## What is included

- `/login` email/password sign-in
- Protected app routes for Dashboard, Meetings, Clients, Campaigns, and Settings
- Premium desktop-first sidebar CRM shell
- Believable seeded demo data for five SDR clients
- Client creation flow with integration/API capture fields
- Supabase schema and SQL seed files
- Cal.com webhook scaffold at `/api/webhooks/calcom`
- Vercel-friendly environment setup

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui component patterns
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Recharts

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local`.

3. For demo mode, you can leave the env vars empty.

4. For live Supabase auth/data:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Demo login

When Supabase keys are not present, the app falls back to demo mode.

- Email: `team@pipelineportal.io`
- Password: `pipeline123`

## Supabase setup

Run the SQL files in order:

1. [schema.sql](/Users/kayan/Pictures/Apps/Buyer%20Radar/supabase/schema.sql)
2. [seed.sql](/Users/kayan/Pictures/Apps/Buyer%20Radar/supabase/seed.sql)

The app already includes typed mappings in [database.ts](/Users/kayan/Pictures/Apps/Buyer%20Radar/src/types/database.ts).

If you already applied an earlier version of the schema, rerun [schema.sql](/Users/kayan/Pictures/Apps/Buyer%20Radar/supabase/schema.sql) so the `client_integrations` table and insert policies are available for the new client onboarding flow.

## Cal.com webhook scaffold

The webhook endpoint is:

`POST /api/webhooks/calcom`

Expected metadata for automatic meeting creation:

- `clientId`
- `campaignId`
- `accountId` (optional)

If the required metadata or Supabase admin credentials are missing, the route responds in demo mode without writing to the database.

## Deployment

This project is ready for Vercel deployment.

Recommended production env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CALCOM_WEBHOOK_SIGNING_SECRET`

Build command:

```bash
npm run build
```

## Notes

- The UI is intentionally restrained and presentation-friendly for live discovery calls.
- Demo mode keeps the portal usable even before a live Supabase project is connected.
