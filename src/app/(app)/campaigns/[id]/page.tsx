import { notFound } from "next/navigation";
import { CampaignPerformanceChart, MeetingsTrendChart, ReplyFunnelChart } from "@/components/charts/overview-charts";
import { ChartCard } from "@/components/shared/chart-card";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCampaignById, getCampaignMeetings, getPortalDataset } from "@/lib/portal-data";
import { getClientName } from "@/lib/portal-helpers";
import { formatPercent } from "@/lib/utils";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataset = await getPortalDataset();
  const campaign = getCampaignById(dataset, id);

  if (!campaign) {
    notFound();
  }

  const meetings = getCampaignMeetings(dataset, campaign.id).slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campaign Detail"
        title={campaign.name}
        description={`${getClientName(dataset, campaign.clientId)} • ${campaign.channel}`}
        action={<StatusBadge status={campaign.status} />}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Messages Sent" value={campaign.messagesSent.toLocaleString()} delta="+7.8%" />
        <KpiCard label="Replies" value={String(campaign.replies)} delta={formatPercent((campaign.replies / campaign.messagesSent) * 100)} />
        <KpiCard label="Positive Replies" value={String(campaign.positiveReplies)} delta={formatPercent((campaign.positiveReplies / campaign.replies) * 100)} />
        <KpiCard label="Meetings Booked" value={String(campaign.meetingsBooked)} delta="Strong pacing" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="Booked meetings trend" description="Performance trend mirrored against the dashboard period.">
          <MeetingsTrendChart data={dataset.dashboardTrend} />
        </ChartCard>
        <ChartCard title="Reply funnel" description="How booked conversations are converting from total replies.">
          <ReplyFunnelChart
            replies={campaign.replies}
            positiveReplies={campaign.positiveReplies}
            meetingsBooked={campaign.meetingsBooked}
          />
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="Campaign comparison" description="Context for how this motion stacks up against other active plays.">
          <CampaignPerformanceChart
            data={dataset.campaigns.slice(0, 5).map((item) => ({
              name: item.name,
              meetingsBooked: item.meetingsBooked,
              positiveReplies: item.positiveReplies,
            }))}
          />
        </ChartCard>
        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle>Linked account IDs used</CardTitle>
            <CardDescription>Sending infrastructure currently attached to this campaign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaign.accountIds.map((accountId) => (
              <div key={accountId} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                {accountId}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-[28px]">
        <CardHeader>
          <CardTitle>Recent linked meetings</CardTitle>
          <CardDescription>Latest prospects sourced directly from this campaign.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospect</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell className="font-medium text-slate-900">{meeting.prospectName}</TableCell>
                  <TableCell>{meeting.company}</TableCell>
                  <TableCell>{meeting.jobTitle}</TableCell>
                  <TableCell>
                    <StatusBadge status={meeting.status} />
                  </TableCell>
                  <TableCell>{meeting.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
