insert into public.clients
  (id, name, industry, target_industry, target_location, target_company_size, target_job_titles, monthly_meeting_target, monthly_price, status, created_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Growth Marketing Agency', 'Marketing Services', 'B2B SaaS', 'United States', '11-200 employees', '["VP Marketing","Demand Gen Manager","Head of Growth"]', 18, 2200, 'active', '2025-11-12T09:15:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'Scale Sprint Media', 'Paid Media Agency', 'Ecommerce Brands', 'United States, Canada', '10-150 employees', '["Founder","CMO","Head of Ecommerce"]', 14, 1800, 'active', '2025-12-09T14:05:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'Northstar Demand', 'RevOps Consulting', 'Technology Services', 'North America', '51-500 employees', '["Revenue Operations Lead","VP Sales","CRO"]', 20, 2600, 'active', '2026-01-18T11:40:00Z'),
  ('10000000-0000-0000-0000-000000000004', 'Elevate Leads Studio', 'Outbound Agency', 'Professional Services', 'United Kingdom, Europe', '20-250 employees', '["Managing Director","Commercial Director","Founder"]', 16, 2000, 'onboarding', '2026-02-06T08:20:00Z'),
  ('10000000-0000-0000-0000-000000000005', 'Revenue Loop Digital', 'Demand Generation', 'SaaS and IT Services', 'United States', '50-1000 employees', '["VP Sales","Head of Revenue","Sales Director"]', 22, 3000, 'paused', '2025-10-02T12:30:00Z');

insert into public.accounts (id, label, platform, status, daily_limit, created_at) values
  ('acct_01', 'SDR-01', 'LinkedIn', 'healthy', 45, '2025-12-21T10:00:00Z'),
  ('acct_02', 'SDR-02', 'Smartlead', 'healthy', 70, '2025-12-23T10:00:00Z'),
  ('acct_03', 'SDR-03', 'Instantly', 'healthy', 70, '2025-12-25T10:00:00Z'),
  ('acct_04', 'SDR-04', 'LinkedIn', 'healthy', 45, '2025-12-27T10:00:00Z'),
  ('acct_05', 'SDR-05', 'Instantly', 'healthy', 70, '2025-12-29T10:00:00Z'),
  ('acct_06', 'SDR-06', 'Smartlead', 'healthy', 70, '2025-12-31T10:00:00Z'),
  ('acct_07', 'SDR-07', 'LinkedIn', 'healthy', 45, '2026-01-02T10:00:00Z'),
  ('acct_08', 'SDR-08', 'Smartlead', 'healthy', 70, '2026-01-04T10:00:00Z'),
  ('acct_09', 'SDR-09', 'Instantly', 'healthy', 70, '2026-01-06T10:00:00Z'),
  ('acct_10', 'SDR-10', 'LinkedIn', 'healthy', 45, '2026-01-08T10:00:00Z'),
  ('acct_11', 'SDR-11', 'Instantly', 'healthy', 70, '2026-01-10T10:00:00Z'),
  ('acct_12', 'SDR-12', 'Smartlead', 'healthy', 70, '2026-01-12T10:00:00Z'),
  ('acct_13', 'SDR-13', 'LinkedIn', 'healthy', 45, '2026-01-14T10:00:00Z'),
  ('acct_14', 'SDR-14', 'Smartlead', 'warming', 70, '2026-01-16T10:00:00Z'),
  ('acct_15', 'SDR-15', 'Instantly', 'warming', 70, '2026-01-18T10:00:00Z'),
  ('acct_16', 'SDR-16', 'LinkedIn', 'warming', 45, '2026-01-20T10:00:00Z'),
  ('acct_17', 'SDR-17', 'Smartlead', 'warming', 70, '2026-01-22T10:00:00Z'),
  ('acct_18', 'SDR-18', 'Instantly', 'warming', 70, '2026-01-24T10:00:00Z'),
  ('acct_19', 'SDR-19', 'LinkedIn', 'restricted', 45, '2026-01-26T10:00:00Z'),
  ('acct_20', 'SDR-20', 'Smartlead', 'restricted', 70, '2026-01-28T10:00:00Z');

insert into public.campaigns
  (id, client_id, name, channel, status, messages_sent, replies, positive_replies, meetings_booked, start_date, created_at)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Q2 SaaS Demand Gen Push', 'Email', 'active', 2440, 156, 39, 12, '2026-03-05', '2026-03-03T09:00:00Z'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Executive LinkedIn Follow-Up', 'LinkedIn', 'active', 620, 58, 15, 5, '2026-03-24', '2026-03-22T15:20:00Z'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Ecommerce Founder Sprint', 'Multi-channel', 'active', 1860, 118, 28, 9, '2026-03-10', '2026-03-08T10:00:00Z'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'RevOps Leaders US', 'Email', 'active', 2890, 205, 47, 14, '2026-02-26', '2026-02-24T12:10:00Z'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'CRO Intent Signal Motion', 'LinkedIn', 'warming', 410, 31, 8, 3, '2026-04-02', '2026-04-02T09:45:00Z'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'UK Agency Pilot', 'Email', 'warming', 320, 18, 5, 2, '2026-04-08', '2026-04-05T13:15:00Z'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', 'Enterprise Sales Directors', 'Multi-channel', 'paused', 1750, 104, 24, 7, '2026-02-01', '2026-01-29T10:30:00Z'),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005', 'Pipeline Reactivation', 'Email', 'completed', 980, 66, 18, 6, '2025-12-12', '2025-12-10T08:40:00Z');

insert into public.client_integrations
  (id, client_id, provider, label, api_key_hint, status, notes, created_at)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Cal.com', 'Discovery calendar', 'cal_••••f0aa', 'connected', 'Primary scheduling flow for discovery calls and booked meetings.', '2026-03-12T09:10:00Z'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'HubSpot', 'CRM sync token', 'pat_••••9c24', 'pending', 'Waiting on full pipeline mapping before pushing meeting outcomes.', '2026-04-04T14:20:00Z'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'Webhook', 'Meeting delivered endpoint', 'Bearer ••••2d91', 'needs_attention', 'Paused client. Endpoint needs refresh before restarting automated delivery.', '2026-02-18T12:05:00Z');

with source_data as (
  select
    gs,
    (array['Avery Chen','Priya Nair','Mason Walker','Sofia Ramirez','Jordan Kim','Taylor Brooks','Daniel Reed','Hannah Price','Olivia Ross','Liam Patel','Chloe Martin','Noah Bennett','Isabella Hall','Elijah Foster','Amara James','Lucas Perry','Grace Coleman','Ethan Scott','Zoey Cooper','Nathan Hughes','Mila Turner','Caleb Green','Ella Morris','Isaac Rivera','Ruby Ward'])[((gs - 1) % 25) + 1] as prospect_name,
    (array['LiftGrid','Northforge','SignalPeak','Flowstack','Bridgehouse','Brightpath','CoreVista','Beaconlane','BlueOrbit','Stackline','MetricSpring','CloudScale','AdLoom','PioneerIQ','ModularLabs','RevenuePilot','VantageOps','AtlasCommerce','AcumenPro','LaunchGrid','SwayLogic','VectorHouse','NexaWorks','OptiBridge','ClarityForge'])[((gs - 1) % 25) + 1] as company,
    (array['VP Marketing','Demand Gen Manager','Founder','Head of Growth','CMO','Revenue Operations Lead','VP Sales','Commercial Director','Founder','Sales Director','Head of Revenue','Managing Director','CMO','Demand Gen Manager','Head of Ecommerce','VP Sales','Revenue Operations Lead','Founder','Commercial Director','Head of Growth','CMO','VP Marketing','Founder','Sales Director','Managing Director'])[((gs - 1) % 25) + 1] as job_title,
    (array['completed','completed','scheduled','completed','scheduled','completed','rescheduled','completed','no_show','scheduled'])[((gs - 1) % 10) + 1] as meeting_status,
    (array['Email','LinkedIn','Email','Referral','Website'])[((gs - 1) % 5) + 1] as meeting_source,
    (array['20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000003'])[((gs - 1) % 8) + 1] as campaign_id,
    (array['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002'])[((gs - 1) % 8) + 1] as client_id,
    (array['acct_01','acct_06','acct_09','acct_04','acct_12','acct_16','acct_10','acct_08'])[((gs - 1) % 8) + 1] as account_id
  from generate_series(1, 50) as gs
)
insert into public.meetings
  (client_id, campaign_id, prospect_name, email, company, job_title, meeting_datetime, status, source, account_id, notes, created_at)
select
  client_id,
  campaign_id,
  prospect_name,
  lower(replace(prospect_name, ' ', '.')) || '@' || lower(company) || '.com',
  company,
  job_title,
  (timestamp with time zone '2026-04-20 10:30:00+00' + ((gs - 18) * interval '1 day') + (((gs - 1) % 4) * interval '2 hour') + interval '13 hour'),
  case when gs = 48 then 'cancelled' else meeting_status end,
  meeting_source,
  account_id,
  case
    when gs % 5 = 0 then 'Strong initial fit. Asked for team structure and outbound benchmarks before next step.'
    when gs % 3 = 0 then 'Referenced current hiring push and intent data. Good momentum into discovery.'
    else 'Standard qualification call booked from outbound reply.'
  end,
  (timestamp with time zone '2026-04-20 10:30:00+00' + ((gs - 18) * interval '1 day') + (((gs - 1) % 4) * interval '2 hour') + interval '13 hour' - interval '36 hour')
from source_data;
