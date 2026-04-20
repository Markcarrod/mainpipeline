import { isSameMonth, parseISO } from "date-fns";
import { cache } from "react";
import { demoDataset } from "@/data/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Campaign, Meeting, PortalDataset } from "@/types/portal";

function hydrateDataset(): PortalDataset {
  return demoDataset;
}

export const getPortalDataset = cache(async (): Promise<PortalDataset> => {
  if (!isSupabaseConfigured) {
    return hydrateDataset();
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return hydrateDataset();
  }

  const [clientsRes, integrationsRes, campaignsRes, meetingsRes, accountsRes] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("client_integrations").select("*").order("created_at", { ascending: false }),
    supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
    supabase.from("meetings").select("*").order("meeting_datetime", { ascending: false }),
    supabase.from("accounts").select("*").order("label"),
  ]);

  if (clientsRes.error || integrationsRes.error || campaignsRes.error || meetingsRes.error || accountsRes.error) {
    return hydrateDataset();
  }

  const clients = (clientsRes.data ?? []) as Array<Record<string, unknown>>;
  const integrations = (integrationsRes.data ?? []) as Array<Record<string, unknown>>;
  const campaigns = (campaignsRes.data ?? []) as Array<Record<string, unknown>>;
  const meetings = (meetingsRes.data ?? []) as Array<Record<string, unknown>>;
  const accounts = (accountsRes.data ?? []) as Array<Record<string, unknown>>;

  return {
    ...demoDataset,
    clients: clients.map((client) => ({
      id: String(client.id),
      name: String(client.name),
      industry: String(client.industry),
      targetIndustry: String(client.target_industry),
      targetLocation: String(client.target_location),
      targetCompanySize: String(client.target_company_size),
      targetJobTitles: Array.isArray(client.target_job_titles) ? client.target_job_titles.map(String) : [],
      monthlyMeetingTarget: Number(client.monthly_meeting_target),
      monthlyPrice: Number(client.monthly_price),
      status: client.status as PortalDataset["clients"][number]["status"],
      createdAt: String(client.created_at),
    })),
    clientIntegrations: integrations.map((integration) => ({
      id: String(integration.id),
      clientId: String(integration.client_id),
      provider: String(integration.provider),
      label: String(integration.label),
      apiKeyHint: String(integration.api_key_hint ?? ""),
      status: integration.status as PortalDataset["clientIntegrations"][number]["status"],
      notes: String(integration.notes ?? ""),
      createdAt: String(integration.created_at),
    })),
    campaigns: campaigns.map((campaign) => ({
      id: String(campaign.id),
      clientId: String(campaign.client_id),
      name: String(campaign.name),
      channel: campaign.channel as Campaign["channel"],
      status: campaign.status as Campaign["status"],
      messagesSent: Number(campaign.messages_sent),
      replies: Number(campaign.replies),
      positiveReplies: Number(campaign.positive_replies),
      meetingsBooked: Number(campaign.meetings_booked),
      startDate: String(campaign.start_date),
      createdAt: String(campaign.created_at),
      accountIds: [],
    })),
    meetings: meetings.map((meeting) => ({
      id: String(meeting.id),
      clientId: String(meeting.client_id),
      campaignId: String(meeting.campaign_id),
      prospectName: String(meeting.prospect_name),
      email: String(meeting.email),
      company: String(meeting.company),
      jobTitle: String(meeting.job_title),
      meetingDatetime: String(meeting.meeting_datetime),
      status: meeting.status as Meeting["status"],
      source: meeting.source as Meeting["source"],
      accountId: String(meeting.account_id),
      notes: String(meeting.notes ?? ""),
      createdAt: String(meeting.created_at),
    })),
    accounts: accounts.map((account) => ({
      id: String(account.id),
      label: String(account.label),
      platform: account.platform as PortalDataset["accounts"][number]["platform"],
      status: account.status as PortalDataset["accounts"][number]["status"],
      dailyLimit: Number(account.daily_limit),
      createdAt: String(account.created_at),
    })),
  };
});

export async function getDashboardSnapshot() {
  const dataset = await getPortalDataset();
  const currentMonthMeetings = dataset.meetings.filter((meeting) =>
    isSameMonth(parseISO(meeting.meetingDatetime), parseISO(dataset.lastUpdated)),
  );
  const bookedMeetings = currentMonthMeetings.filter((meeting) =>
    ["scheduled", "completed", "no_show", "rescheduled"].includes(meeting.status),
  );
  const completedMeetings = currentMonthMeetings.filter((meeting) => meeting.status === "completed");
  const messagesSent = dataset.campaigns.reduce((sum, campaign) => sum + campaign.messagesSent, 0);
  const replies = dataset.campaigns.reduce((sum, campaign) => sum + campaign.replies, 0);
  const positiveReplies = dataset.campaigns.reduce((sum, campaign) => sum + campaign.positiveReplies, 0);
  const meetingsBooked = dataset.campaigns.reduce((sum, campaign) => sum + campaign.meetingsBooked, 0);

  return {
    dataset,
    metrics: {
      messagesSent,
      replies,
      positiveReplies,
      meetingsBooked,
      showRate: bookedMeetings.length ? (completedMeetings.length / bookedMeetings.length) * 100 : 0,
      activeClients: dataset.clients.filter((client) => client.status === "active").length,
      replyRate: messagesSent ? (replies / messagesSent) * 100 : 0,
      positiveReplyRate: replies ? (positiveReplies / replies) * 100 : 0,
    },
  };
}

export function getClientById(dataset: PortalDataset, clientId: string) {
  return dataset.clients.find((client) => client.id === clientId) ?? null;
}

export function getCampaignById(dataset: PortalDataset, campaignId: string) {
  return dataset.campaigns.find((campaign) => campaign.id === campaignId) ?? null;
}

export function getClientMeetings(dataset: PortalDataset, clientId: string) {
  return dataset.meetings.filter((meeting) => meeting.clientId === clientId);
}

export function getCampaignMeetings(dataset: PortalDataset, campaignId: string) {
  return dataset.meetings.filter((meeting) => meeting.campaignId === campaignId);
}

export function getMeetingsBookedThisMonth(dataset: PortalDataset, clientId: string) {
  return dataset.meetings.filter(
    (meeting) =>
      meeting.clientId === clientId &&
      isSameMonth(parseISO(meeting.meetingDatetime), parseISO(dataset.lastUpdated)) &&
      ["scheduled", "completed", "no_show", "rescheduled"].includes(meeting.status),
  ).length;
}

export function getClientCampaigns(dataset: PortalDataset, clientId: string) {
  return dataset.campaigns.filter((campaign) => campaign.clientId === clientId);
}
