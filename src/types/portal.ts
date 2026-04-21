export type ClientStatus = "active" | "paused" | "onboarding";
export type CampaignStatus = "active" | "warming" | "paused" | "completed";
export type MeetingStatus =
  | "scheduled"
  | "completed"
  | "no_show"
  | "rescheduled"
  | "cancelled";
export type AccountStatus = "healthy" | "warming" | "restricted";
export type IntegrationStatus = "connected" | "pending" | "needs_attention";

export interface Client {
  id: string;
  name: string;
  industry: string;
  targetIndustry: string;
  targetLocation: string;
  targetCompanySize: string;
  targetJobTitles: string[];
  monthlyMeetingTarget: number;
  monthlyPrice: number;
  status: ClientStatus;
  createdAt: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  channel: "Email" | "LinkedIn" | "Multi-channel";
  status: CampaignStatus;
  messagesSent: number;
  replies: number;
  positiveReplies: number;
  meetingsBooked: number;
  startDate: string;
  createdAt: string;
  accountIds: string[];
}

export interface Meeting {
  id: string;
  clientId: string;
  campaignId: string;
  prospectName: string;
  email: string;
  company: string;
  jobTitle: string;
  meetingDatetime: string;
  status: MeetingStatus;
  source: "Email" | "LinkedIn" | "Referral" | "Website" | "Cal.com";
  accountId: string;
  notes: string;
  createdAt: string;
}

export interface OutreachAccount {
  id: string;
  label: string;
  platform: "Smartlead" | "Instantly" | "LinkedIn";
  status: AccountStatus;
  dailyLimit: number;
  createdAt: string;
}

export interface ClientIntegration {
  id: string;
  clientId: string;
  provider: string;
  label: string;
  apiKeyHint: string;
  status: IntegrationStatus;
  notes: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  fullName: string;
  role: string;
  email: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: "meeting" | "campaign" | "client" | "account";
}

export interface DashboardMetricPoint {
  label: string;
  meetingsBooked: number;
  replyRate: number;
  positiveReplyRate: number;
}

export interface PortalDataset {
  clients: Client[];
  clientIntegrations: ClientIntegration[];
  campaigns: Campaign[];
  meetings: Meeting[];
  accounts: OutreachAccount[];
  activities: ActivityItem[];
  dashboardTrend: DashboardMetricPoint[];
  profile: Profile;
  lastUpdated: string;
}
