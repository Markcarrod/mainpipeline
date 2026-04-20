import { addDays, addHours, subDays } from "date-fns";
import type {
  ActivityItem,
  Campaign,
  Client,
  ClientIntegration,
  DashboardMetricPoint,
  Meeting,
  OutreachAccount,
  PortalDataset,
  Profile,
} from "@/types/portal";

const now = new Date("2026-04-20T10:30:00.000Z");

const clients: Client[] = [
  {
    id: "client_growth-marketing-agency",
    name: "Growth Marketing Agency",
    industry: "Marketing Services",
    targetIndustry: "B2B SaaS",
    targetLocation: "United States",
    targetCompanySize: "11-200 employees",
    targetJobTitles: ["VP Marketing", "Demand Gen Manager", "Head of Growth"],
    monthlyMeetingTarget: 18,
    monthlyPrice: 2200,
    status: "active",
    createdAt: "2025-11-12T09:15:00.000Z",
  },
  {
    id: "client_scale-sprint-media",
    name: "Scale Sprint Media",
    industry: "Paid Media Agency",
    targetIndustry: "Ecommerce Brands",
    targetLocation: "United States, Canada",
    targetCompanySize: "10-150 employees",
    targetJobTitles: ["Founder", "CMO", "Head of Ecommerce"],
    monthlyMeetingTarget: 14,
    monthlyPrice: 1800,
    status: "active",
    createdAt: "2025-12-09T14:05:00.000Z",
  },
  {
    id: "client_northstar-demand",
    name: "Northstar Demand",
    industry: "RevOps Consulting",
    targetIndustry: "Technology Services",
    targetLocation: "North America",
    targetCompanySize: "51-500 employees",
    targetJobTitles: ["Revenue Operations Lead", "VP Sales", "CRO"],
    monthlyMeetingTarget: 20,
    monthlyPrice: 2600,
    status: "active",
    createdAt: "2026-01-18T11:40:00.000Z",
  },
  {
    id: "client_elevate-leads-studio",
    name: "Elevate Leads Studio",
    industry: "Outbound Agency",
    targetIndustry: "Professional Services",
    targetLocation: "United Kingdom, Europe",
    targetCompanySize: "20-250 employees",
    targetJobTitles: ["Managing Director", "Commercial Director", "Founder"],
    monthlyMeetingTarget: 16,
    monthlyPrice: 2000,
    status: "onboarding",
    createdAt: "2026-02-06T08:20:00.000Z",
  },
  {
    id: "client_revenue-loop-digital",
    name: "Revenue Loop Digital",
    industry: "Demand Generation",
    targetIndustry: "SaaS and IT Services",
    targetLocation: "United States",
    targetCompanySize: "50-1000 employees",
    targetJobTitles: ["VP Sales", "Head of Revenue", "Sales Director"],
    monthlyMeetingTarget: 22,
    monthlyPrice: 3000,
    status: "paused",
    createdAt: "2025-10-02T12:30:00.000Z",
  },
];

const campaigns: Campaign[] = [
  {
    id: "camp_gma_email_q2",
    clientId: clients[0].id,
    name: "Q2 SaaS Demand Gen Push",
    channel: "Email",
    status: "active",
    messagesSent: 2440,
    replies: 156,
    positiveReplies: 39,
    meetingsBooked: 12,
    startDate: "2026-03-05",
    createdAt: "2026-03-03T09:00:00.000Z",
    accountIds: ["acct_01", "acct_02", "acct_03"],
  },
  {
    id: "camp_gma_linkedin_exec",
    clientId: clients[0].id,
    name: "Executive LinkedIn Follow-Up",
    channel: "LinkedIn",
    status: "active",
    messagesSent: 620,
    replies: 58,
    positiveReplies: 15,
    meetingsBooked: 5,
    startDate: "2026-03-24",
    createdAt: "2026-03-22T15:20:00.000Z",
    accountIds: ["acct_04", "acct_05"],
  },
  {
    id: "camp_ssm_ecom_founders",
    clientId: clients[1].id,
    name: "Ecommerce Founder Sprint",
    channel: "Multi-channel",
    status: "active",
    messagesSent: 1860,
    replies: 118,
    positiveReplies: 28,
    meetingsBooked: 9,
    startDate: "2026-03-10",
    createdAt: "2026-03-08T10:00:00.000Z",
    accountIds: ["acct_06", "acct_07", "acct_08"],
  },
  {
    id: "camp_nsd_revops_us",
    clientId: clients[2].id,
    name: "RevOps Leaders US",
    channel: "Email",
    status: "active",
    messagesSent: 2890,
    replies: 205,
    positiveReplies: 47,
    meetingsBooked: 14,
    startDate: "2026-02-26",
    createdAt: "2026-02-24T12:10:00.000Z",
    accountIds: ["acct_09", "acct_10", "acct_11"],
  },
  {
    id: "camp_nsd_cro_signal",
    clientId: clients[2].id,
    name: "CRO Intent Signal Motion",
    channel: "LinkedIn",
    status: "warming",
    messagesSent: 410,
    replies: 31,
    positiveReplies: 8,
    meetingsBooked: 3,
    startDate: "2026-04-02",
    createdAt: "2026-04-02T09:45:00.000Z",
    accountIds: ["acct_12", "acct_13"],
  },
  {
    id: "camp_els_uk_agency",
    clientId: clients[3].id,
    name: "UK Agency Pilot",
    channel: "Email",
    status: "warming",
    messagesSent: 320,
    replies: 18,
    positiveReplies: 5,
    meetingsBooked: 2,
    startDate: "2026-04-08",
    createdAt: "2026-04-05T13:15:00.000Z",
    accountIds: ["acct_14", "acct_15"],
  },
  {
    id: "camp_rld_enterprise_sales",
    clientId: clients[4].id,
    name: "Enterprise Sales Directors",
    channel: "Multi-channel",
    status: "paused",
    messagesSent: 1750,
    replies: 104,
    positiveReplies: 24,
    meetingsBooked: 7,
    startDate: "2026-02-01",
    createdAt: "2026-01-29T10:30:00.000Z",
    accountIds: ["acct_16", "acct_17", "acct_18"],
  },
  {
    id: "camp_rld_reactivation",
    clientId: clients[4].id,
    name: "Pipeline Reactivation",
    channel: "Email",
    status: "completed",
    messagesSent: 980,
    replies: 66,
    positiveReplies: 18,
    meetingsBooked: 6,
    startDate: "2025-12-12",
    createdAt: "2025-12-10T08:40:00.000Z",
    accountIds: ["acct_19", "acct_20"],
  },
];

const clientIntegrations: ClientIntegration[] = [
  {
    id: "integration_gma_cal",
    clientId: clients[0].id,
    provider: "Cal.com",
    label: "Discovery calendar",
    apiKeyHint: "cal_••••f0aa",
    status: "connected",
    notes: "Primary scheduling flow for discovery calls and booked meetings.",
    createdAt: "2026-03-12T09:10:00.000Z",
  },
  {
    id: "integration_nsd_hubspot",
    clientId: clients[2].id,
    provider: "HubSpot",
    label: "CRM sync token",
    apiKeyHint: "pat_••••9c24",
    status: "pending",
    notes: "Waiting on full pipeline mapping before pushing meeting outcomes.",
    createdAt: "2026-04-04T14:20:00.000Z",
  },
  {
    id: "integration_rld_webhook",
    clientId: clients[4].id,
    provider: "Webhook",
    label: "Meeting delivered endpoint",
    apiKeyHint: "Bearer ••••2d91",
    status: "needs_attention",
    notes: "Paused client. Endpoint needs refresh before restarting automated delivery.",
    createdAt: "2026-02-18T12:05:00.000Z",
  },
];

const accounts: OutreachAccount[] = Array.from({ length: 20 }).map((_, index) => ({
  id: `acct_${String(index + 1).padStart(2, "0")}`,
  label: `SDR-${String(index + 1).padStart(2, "0")}`,
  platform: index % 3 === 0 ? "LinkedIn" : index % 2 === 0 ? "Instantly" : "Smartlead",
  status: index < 13 ? "healthy" : index < 18 ? "warming" : "restricted",
  dailyLimit: index % 3 === 0 ? 45 : 70,
  createdAt: subDays(now, 120 - index * 2).toISOString(),
}));

const meetingBlueprints = [
  ["Avery Chen", "LiftGrid", "VP Marketing"],
  ["Priya Nair", "Northforge", "Demand Gen Manager"],
  ["Mason Walker", "SignalPeak", "Founder"],
  ["Sofia Ramirez", "Flowstack", "Head of Growth"],
  ["Jordan Kim", "Bridgehouse", "CMO"],
  ["Taylor Brooks", "Brightpath", "Revenue Operations Lead"],
  ["Daniel Reed", "CoreVista", "VP Sales"],
  ["Hannah Price", "Beaconlane", "Commercial Director"],
  ["Olivia Ross", "BlueOrbit", "Founder"],
  ["Liam Patel", "Stackline", "Sales Director"],
  ["Chloe Martin", "MetricSpring", "Head of Revenue"],
  ["Noah Bennett", "CloudScale", "Managing Director"],
  ["Isabella Hall", "AdLoom", "CMO"],
  ["Elijah Foster", "PioneerIQ", "Demand Gen Manager"],
  ["Amara James", "Modular Labs", "Head of Ecommerce"],
  ["Lucas Perry", "RevenuePilot", "VP Sales"],
  ["Grace Coleman", "VantageOps", "Revenue Operations Lead"],
  ["Ethan Scott", "Atlas Commerce", "Founder"],
  ["Zoey Cooper", "AcumenPro", "Commercial Director"],
  ["Nathan Hughes", "LaunchGrid", "Head of Growth"],
  ["Mila Turner", "SwayLogic", "CMO"],
  ["Caleb Green", "VectorHouse", "VP Marketing"],
  ["Ella Morris", "NexaWorks", "Founder"],
  ["Isaac Rivera", "OptiBridge", "Sales Director"],
  ["Ruby Ward", "Clarity Forge", "Managing Director"],
];

const statusSequence = [
  "completed",
  "completed",
  "scheduled",
  "completed",
  "scheduled",
  "completed",
  "rescheduled",
  "completed",
  "no_show",
  "scheduled",
] as const;

const sourceSequence = ["Email", "LinkedIn", "Email", "Referral", "Website"] as const;
const campaignRotation = [0, 2, 3, 1, 4, 6, 3, 2];

const meetings: Meeting[] = Array.from({ length: 50 }).map((_, index) => {
  const blueprint = meetingBlueprints[index % meetingBlueprints.length];
  const campaign = campaigns[campaignRotation[index % campaignRotation.length]];
  const status = statusSequence[index % statusSequence.length];
  const meetingDate = addHours(addDays(now, index - 18), (index % 4) * 2 + 13);
  const accountId = campaign.accountIds[index % campaign.accountIds.length];

  return {
    id: `meeting_${String(index + 1).padStart(2, "0")}`,
    clientId: campaign.clientId,
    campaignId: campaign.id,
    prospectName: blueprint[0],
    email: `${blueprint[0].toLowerCase().replace(/[^a-z]+/g, ".")}@${blueprint[1]
      .toLowerCase()
      .replace(/[^a-z]+/g, "")}.com`,
    company: blueprint[1],
    jobTitle: blueprint[2],
    meetingDatetime: meetingDate.toISOString(),
    status: index === 47 ? "cancelled" : status,
    source: sourceSequence[index % sourceSequence.length],
    accountId,
    notes:
      index % 5 === 0
        ? "Strong initial fit. Asked for team structure and outbound benchmarks before next step."
        : index % 3 === 0
          ? "Referenced current hiring push and intent data. Good momentum into discovery."
          : "Standard qualification call booked from outbound reply.",
    createdAt: addHours(meetingDate, -36).toISOString(),
  };
});

const dashboardTrend: DashboardMetricPoint[] = [
  { label: "Mar 11", meetingsBooked: 5, replyRate: 6.8, positiveReplyRate: 24.1 },
  { label: "Mar 18", meetingsBooked: 7, replyRate: 7.4, positiveReplyRate: 25.2 },
  { label: "Mar 25", meetingsBooked: 8, replyRate: 7.1, positiveReplyRate: 23.8 },
  { label: "Apr 1", meetingsBooked: 9, replyRate: 7.8, positiveReplyRate: 26.6 },
  { label: "Apr 8", meetingsBooked: 11, replyRate: 8.2, positiveReplyRate: 27.9 },
  { label: "Apr 15", meetingsBooked: 10, replyRate: 8.5, positiveReplyRate: 28.7 },
  { label: "Apr 22", meetingsBooked: 12, replyRate: 8.1, positiveReplyRate: 27.4 },
];

const activities: ActivityItem[] = [
  {
    id: "act_01",
    title: "Northstar Demand booked two meetings this morning",
    detail: "RevOps Leaders US generated back-to-back discovery calls with VP Sales prospects.",
    timestamp: "2026-04-20T09:48:00.000Z",
    type: "meeting",
  },
  {
    id: "act_02",
    title: "Scale Sprint Media crossed 100 replies",
    detail: "Reply rate has held above 6% for the last three weeks across ecommerce accounts.",
    timestamp: "2026-04-19T16:12:00.000Z",
    type: "campaign",
  },
  {
    id: "act_03",
    title: "Elevate Leads Studio finished onboarding review",
    detail: "ICP and targeting were approved for UK agency decision-makers ahead of volume ramp.",
    timestamp: "2026-04-18T13:10:00.000Z",
    type: "client",
  },
  {
    id: "act_04",
    title: "Three LinkedIn accounts moved into healthy sending",
    detail: "Warm-up thresholds cleared with no deliverability flags in the last 72 hours.",
    timestamp: "2026-04-18T09:32:00.000Z",
    type: "account",
  },
  {
    id: "act_05",
    title: "Growth Marketing Agency hit 94% of monthly target",
    detail: "Two more positive replies are in live follow-up for the final meetings needed.",
    timestamp: "2026-04-17T18:05:00.000Z",
    type: "client",
  },
];

const profile: Profile = {
  id: "profile_maya",
  fullName: "Maya Thompson",
  role: "Agency Lead",
  email: "team@pipelineportal.io",
};

export const demoDataset: PortalDataset = {
  clients,
  clientIntegrations,
  campaigns,
  meetings,
  accounts,
  activities,
  dashboardTrend,
  profile,
  lastUpdated: now.toISOString(),
};
