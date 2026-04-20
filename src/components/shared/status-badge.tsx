import { Badge } from "@/components/ui/badge";
import type {
  AccountStatus,
  CampaignStatus,
  ClientStatus,
  IntegrationStatus,
  MeetingStatus,
} from "@/types/portal";

export function StatusBadge({
  status,
}: {
  status: ClientStatus | CampaignStatus | MeetingStatus | AccountStatus | IntegrationStatus;
}) {
  const normalized = status.replace("_", " ");
  const variant =
    status === "active" || status === "healthy" || status === "completed" || status === "connected"
      ? "green"
      : status === "paused" ||
          status === "cancelled" ||
          status === "restricted" ||
          status === "needs_attention"
        ? "red"
        : status === "onboarding" || status === "warming" || status === "rescheduled"
          ? "amber"
          : "blue";

  return <Badge variant={variant}>{normalized}</Badge>;
}

export function MeetingStatusPill({ status }: { status: MeetingStatus }) {
  return <StatusBadge status={status} />;
}
