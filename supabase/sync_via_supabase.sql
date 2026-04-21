-- SQL to set up automated Cal.com booking syncing via Supabase pg_cron.
-- Enable pg_cron and pg_net in Supabase Dashboard -> Database -> Extensions first.
-- If CRON_SECRET is set in the app, replace CHANGE_ME with that same value.

select
  cron.schedule(
    'buyer-radar-cal-booking-sync',
    '*/5 * * * *',
    $$
    select
      net.http_post(
        url := 'https://YOUR-APP-DOMAIN/api/sync/bookings',
        headers := '{"Content-Type":"application/json","Authorization":"Bearer CHANGE_ME"}'::jsonb,
        body := '{}'::jsonb
      );
    $$
  );

-- View jobs:
-- select * from cron.job;

-- View recent runs:
-- select * from cron.job_run_details order by start_time desc limit 10;
