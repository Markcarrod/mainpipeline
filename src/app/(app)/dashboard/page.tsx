import Link from "next/link";
import { ArrowUpRight, Download, Sparkles } from "lucide-react";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { CampaignPerformanceChart, MeetingsTrendChart, ReplyRateChart } from "@/components/charts/overview-charts";
import { ChartCard } from "@/components/shared/chart-card";
import { ClientProgressCard } from "@/components/shared/client-progress-card";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { MeetingStatusPill, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getDashboardSnapshot,
} from "@/lib/portal-data";
import { formatLastUpdated, getClientName, getMeetingsBookedThisMonth, getUpcomingMeetings } from "@/lib/portal-helpers";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const { dataset, metrics } = await getDashboardSnapshot();
  const upcomingMeetings = getUpcomingMeetings(dataset.meetings, dataset.lastUpdated, 6);
  const topCampaigns = [...dataset.campaigns]
    .sort((a, b) => b.meetingsBooked - a.meetingsBooked)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="surface-card subtle-grid overflow-hidden rounded-[32px] border-white/80 bg-white px-7 py-7">
        <PageHeader
          eyebrow="Executive Overview"
          title="A confident delivery snapshot for Pipeline Portal"
          description="Present campaign momentum, meeting pacing, and client progress in one clean view built for screen-share and internal operating rhythm."
          action={
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="rounded-xl">
                <Sparkles className="h-4 w-4" />
                Share live view
              </Button>
            </div>
          }
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard label="Messages Sent" value={formatNumber(metrics.messagesSent)} delta="+11.4%" hint="vs last 30 days" />
            <KpiCard label="Replies" value={formatNumber(metrics.replies)} delta="+8.2%" hint={formatPercent(metrics.replyRate)} />
            <KpiCard label="Positive Replies" value={formatNumber(metrics.positiveReplies)} delta="+6.1%" hint={formatPercent(metrics.positiveReplyRate)} />
            <KpiCard label="Meetings Booked" value={formatNumber(metrics.meetingsBooked)} delta="+9.7%" hint="Across all campaigns" />
            <KpiCard label="Show Rate" value={formatPercent(metrics.showRate)} delta="+3.4 pts" hint="Completed vs booked" />
            <KpiCard label="Active Clients" value={String(metrics.activeClients)} delta="4 retained" hint={formatCurrency(11600)} />
          </div>
          <Card className="rounded-[28px] border-blue-100 bg-[linear-gradient(180deg,_rgba(239,246,255,0.9)_0%,_rgba(255,255,255,1)_100%)]">
            <CardContent className="flex h-full flex-col justify-between p-7">
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-blue-700 shadow-sm">
                  April delivery
                </div>
                <div>
                  <h3 className="text-3xl font-semibold leading-tight">
                    Three active clients are pacing above 80% of target before month-end.
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                    Northstar Demand leads volume, while Growth Marketing Agency is closest to hitting target in full.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Highest booking campaign</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">RevOps Leaders US</p>
                  <p className="mt-2 text-sm text-slate-600">14 meetings booked from 205 replies</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Most presentation-ready client</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">Growth Marketing Agency</p>
                  <p className="mt-2 text-sm text-slate-600">17 of 18 target meetings currently delivered</p>
                </div>
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.16em] text-slate-400">
                {formatLastUpdated(dataset.lastUpdated)}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartCard title="Booked meetings over time" description="Weekly trend across active clients and in-flight campaigns.">
          <MeetingsTrendChart data={dataset.dashboardTrend} />
        </ChartCard>
        <ChartCard title="Reply rate trend" description="Reply quality versus positive reply conversion over the last seven checkpoints.">
          <ReplyRateChart data={dataset.dashboardTrend} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Top performing campaigns" description="Campaigns ranked by booked meetings and positive replies.">
          <CampaignPerformanceChart
            data={topCampaigns.map((campaign) => ({
              name: campaign.name,
              meetingsBooked: campaign.meetingsBooked,
              positiveReplies: campaign.positiveReplies,
            }))}
          />
        </ChartCard>
        <ChartCard title="Client target progress" description="Current month delivery against each client commitment.">
          <div className="space-y-4">
            {dataset.clients.map((client) => (
              <ClientProgressCard
                key={client.id}
                name={client.name}
                booked={getMeetingsBookedThisMonth(dataset, client.id)}
                target={client.monthlyMeetingTarget}
              />
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Upcoming meetings</h3>
                <p className="text-sm text-slate-500">Next booked calls across all active delivery.</p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/meetings">
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prospect</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingMeetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{meeting.prospectName}</p>
                        <p className="text-sm text-slate-500">{meeting.company}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getClientName(dataset, meeting.clientId)}</TableCell>
                    <TableCell>{dataset.campaigns.find((item) => item.id === meeting.campaignId)?.name}</TableCell>
                    <TableCell>
                      <MeetingStatusPill status={meeting.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="rounded-[28px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Recent activity</h3>
                <p className="text-sm text-slate-500">A concise feed of delivery movement and noteworthy updates.</p>
              </div>
              <StatusBadge status="active" />
            </div>
            <div className="mt-6">
              <ActivityFeed items={dataset.activities} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
