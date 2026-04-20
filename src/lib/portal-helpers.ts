import { format, isSameMonth, parseISO } from "date-fns";
import type { Meeting, MeetingStatus, PortalDataset } from "@/types/portal";

export function getClientName(dataset: PortalDataset, clientId: string) {
  return dataset.clients.find((client) => client.id === clientId)?.name ?? "Unknown client";
}

export function getCampaignName(dataset: PortalDataset, campaignId: string) {
  return dataset.campaigns.find((campaign) => campaign.id === campaignId)?.name ?? "Unknown campaign";
}

export function getMeetingsBookedThisMonth(dataset: PortalDataset, clientId: string) {
  return dataset.meetings.filter(
    (meeting) =>
      meeting.clientId === clientId &&
      isSameMonth(parseISO(meeting.meetingDatetime), parseISO(dataset.lastUpdated)) &&
      ["scheduled", "completed", "no_show", "rescheduled"].includes(meeting.status),
  ).length;
}

export function getStatusCount(meetings: Meeting[], status: MeetingStatus) {
  return meetings.filter((meeting) => meeting.status === status).length;
}

export function getUpcomingMeetings(meetings: Meeting[], referenceDate: string, limit = 6) {
  return [...meetings]
    .filter((meeting) => parseISO(meeting.meetingDatetime) >= parseISO(referenceDate))
    .sort((a, b) => a.meetingDatetime.localeCompare(b.meetingDatetime))
    .slice(0, limit);
}

export function formatLastUpdated(value: string) {
  return `Last updated ${format(parseISO(value), "MMM d, yyyy 'at' h:mm a")}`;
}

export function getClientIntegrations(dataset: PortalDataset, clientId: string) {
  return dataset.clientIntegrations.filter((integration) => integration.clientId === clientId);
}
