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

const clients: Client[] = [];

const campaigns: Campaign[] = [];

const clientIntegrations: ClientIntegration[] = [];

const accounts: OutreachAccount[] = [];

const meetings: Meeting[] = [];

const dashboardTrend: DashboardMetricPoint[] = [];

const activities: ActivityItem[] = [];

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

