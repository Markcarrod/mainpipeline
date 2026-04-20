import { MeetingsView } from "@/components/meetings/meetings-view";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { getPortalDataset } from "@/lib/portal-data";
import { getStatusCount } from "@/lib/portal-helpers";

export default async function MeetingsPage() {
  const dataset = await getPortalDataset();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Meetings"
        title="Booked calls across every active client"
        description="Track upcoming calls, outcomes, and schedule changes without losing campaign context."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Scheduled" value={String(getStatusCount(dataset.meetings, "scheduled"))} delta="+4 this week" />
        <KpiCard label="Completed" value={String(getStatusCount(dataset.meetings, "completed"))} delta="+7 this week" />
        <KpiCard label="No Shows" value={String(getStatusCount(dataset.meetings, "no_show"))} delta="Holding steady" />
        <KpiCard label="Rescheduled" value={String(getStatusCount(dataset.meetings, "rescheduled"))} delta="2 pending reconfirmation" />
      </div>
      <MeetingsView dataset={dataset} />
    </div>
  );
}
