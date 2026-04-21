import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { ChartCard } from "@/components/shared/chart-card";
import { ClientProgressCard } from "@/components/shared/client-progress-card";
import { ClientStatusSelect } from "@/components/clients/client-status-select";
import { CreateCalLinkDialog } from "@/components/clients/create-cal-link-dialog";
import { DeleteClientDialog } from "@/components/clients/delete-client-dialog";
import { SaveCalApiKeyDialog } from "@/components/clients/save-cal-api-key-dialog";
import { SaveCalBookingLinkDialog } from "@/components/clients/save-cal-booking-link-dialog";
import { SaveCalendlyConnectionDialog } from "@/components/clients/save-calendly-connection-dialog";
import { SyncCalBookingsButton } from "@/components/clients/sync-cal-bookings-button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getClientById,
  getClientCampaigns,
  getClientMeetings,
  getPortalDataset,
} from "@/lib/portal-data";
import {
  formatLastUpdated,
  getClientIntegrations,
  getMeetingsBookedThisMonth,
} from "@/lib/portal-helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataset = await getPortalDataset();
  const client = getClientById(dataset, id);

  if (!client) {
    notFound();
  }

  const campaigns = getClientCampaigns(dataset, client.id);
  const meetings = getClientMeetings(dataset, client.id).slice(0, 8);
  const booked = getMeetingsBookedThisMonth(dataset, client.id);
  const integrations = getClientIntegrations(dataset, client.id);
  const admin = createSupabaseAdminClient();
  let hasCalApiKey = false;
  let hasBookingLink = false;
  let webhookUrl = "";
  let bookingLink = "";
  let hasCalendlyToken = false;
  let hasCalendlyLink = false;
  let calendlyWebhookUrl = "";
  let calendlyBookingLink = "";

  if (admin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from("client_cal_credentials")
      .select("cal_api_key, booking_link, webhook_url")
      .eq("client_id", client.id)
      .maybeSingle();

    hasCalApiKey = Boolean(String(data?.cal_api_key ?? "").trim());
    hasBookingLink = Boolean(String(data?.booking_link ?? "").trim());
    webhookUrl = String(data?.webhook_url ?? "");
    bookingLink = String(data?.booking_link ?? "");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: calendlyData } = await (admin as any)
      .from("client_calendly_credentials")
      .select("calendly_api_key, booking_link, webhook_url")
      .eq("client_id", client.id)
      .maybeSingle();

    hasCalendlyToken = Boolean(String(calendlyData?.calendly_api_key ?? "").trim());
    hasCalendlyLink = Boolean(String(calendlyData?.booking_link ?? "").trim());
    calendlyWebhookUrl = String(calendlyData?.webhook_url ?? "");
    calendlyBookingLink = String(calendlyData?.booking_link ?? "");
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[32px] bg-white px-7 py-7">
        <PageHeader
          eyebrow="Client Detail"
          title={client.name}
          description={`${client.industry} | ${formatCurrency(client.monthlyPrice)}/month | ${formatLastUpdated(dataset.lastUpdated)}`}
          action={
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button>
                <FileText className="h-4 w-4" />
                Share update
              </Button>
              <DeleteClientDialog clientId={client.id} clientName={client.name} />
            </div>
          }
        />
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card className="rounded-[28px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>Client summary for internal review and discovery-call presentation.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <StatusBadge status={client.status} />
                    <ClientStatusSelect clientId={client.id} status={client.status} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Info label="Monthly target" value={`${client.monthlyMeetingTarget} meetings`} />
                <Info label="Booked this month" value={`${booked} meetings`} />
                <Info label="Target location" value={client.targetLocation} />
                <Info label="Company size" value={client.targetCompanySize} />
              </CardContent>
            </Card>
            <Card className="rounded-[28px]">
              <CardHeader>
                <CardTitle>ICP</CardTitle>
                <CardDescription>Current targeting criteria used to source and qualify prospects.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Info label="Target industry" value={client.targetIndustry} />
                <Info label="Job titles" value={client.targetJobTitles.join(", ")} />
              </CardContent>
            </Card>
            <Card className="rounded-[28px] border-blue-100 bg-blue-50/60">
              <CardHeader>
                <CardTitle>Performance Guarantee</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-slate-700">
                  If we do not reach the agreed meeting target, outreach continues at no additional cost until the remaining meetings are delivered.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <ChartCard title="Target progress" description="Progress toward the active monthly commitment.">
              <ClientProgressCard name={client.name} booked={booked} target={client.monthlyMeetingTarget} />
            </ChartCard>
            <Card className="rounded-[28px]">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="space-y-1.5">
                  <CardTitle>Client integrations</CardTitle>
                  <CardDescription>Scheduling, CRM, and API access notes for this account.</CardDescription>
                  <p className="text-xs text-slate-500">Choose either Cal.com or Calendly for each client account.</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue={hasCalendlyToken ? "calendly" : "calcom"}>
                  <TabsList>
                    <TabsTrigger value="calcom">Cal.com</TabsTrigger>
                    <TabsTrigger value="calendly">Calendly</TabsTrigger>
                  </TabsList>
                  <TabsContent value="calcom">
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">Cal.com connection</p>
                          <p className="text-xs text-slate-500">
                            API key: <span className="font-medium text-slate-900">{hasCalApiKey ? "Configured" : "Missing"}</span> | Booking link:{" "}
                            <span className="font-medium text-slate-900">{hasBookingLink ? "Configured" : "Missing"}</span>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <SaveCalApiKeyDialog clientId={client.id} clientName={client.name} hasCalApiKey={hasCalApiKey} />
                          <SaveCalBookingLinkDialog clientId={client.id} clientName={client.name} hasBookingLink={hasBookingLink} />
                          <SyncCalBookingsButton clientId={client.id} disabled={!hasCalApiKey} />
                          <CreateCalLinkDialog clientId={client.id} clientName={client.name} hasCalApiKey={hasCalApiKey} />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Info label="Cal.com booking link" value={bookingLink || "No Cal.com link saved yet"} />
                        <Info label="Cal.com webhook URL" value={webhookUrl || "No Cal.com webhook URL generated yet"} />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="calendly">
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">Calendly connection</p>
                          <p className="text-xs text-slate-500">
                            API token: <span className="font-medium text-slate-900">{hasCalendlyToken ? "Configured" : "Missing"}</span> | Booking link:{" "}
                            <span className="font-medium text-slate-900">{hasCalendlyLink ? "Configured" : "Missing"}</span>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <SaveCalendlyConnectionDialog clientId={client.id} clientName={client.name} hasCalendlyToken={hasCalendlyToken} />
                          <SyncCalBookingsButton clientId={client.id} disabled={!hasCalendlyToken} provider="calendly" />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Info label="Calendly booking link" value={calendlyBookingLink || "No Calendly link saved yet"} />
                        <Info label="Calendly webhook URL" value={calendlyWebhookUrl || "No Calendly webhook URL generated yet"} />
                      </div>
                    </div>
                  </TabsContent>
                  <div className="mt-3">
                    <Link href="/settings/webhooks" className="text-sm font-medium text-blue-700 hover:underline">
                      Open webhook manager
                    </Link>
                  </div>
                </Tabs>
                {integrations.length ? (
                  integrations.map((integration) => (
                    <div key={integration.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{integration.provider}</p>
                          <p className="mt-1 text-sm text-slate-500">{integration.label}</p>
                        </div>
                        <StatusBadge status={integration.status} />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <Info label="API key hint" value={integration.apiKeyHint || "No key stored"} />
                        <Info label="Notes" value={integration.notes || "No notes added yet"} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                    No client integrations added yet. Use the Cal.com or Calendly controls above to add scheduling credentials for this client.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[28px]">
              <CardHeader>
                <CardTitle>Campaigns</CardTitle>
                <CardDescription>Linked delivery motions currently tied to this client.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaigns.map((campaign) => (
                  <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="block rounded-2xl bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{campaign.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {campaign.channel} | {campaign.messagesSent.toLocaleString()} sent
                        </p>
                      </div>
                      <StatusBadge status={campaign.status} />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Card className="rounded-[28px]">
        <CardHeader>
          <CardTitle>Recent meetings</CardTitle>
          <CardDescription>Most recent conversations sourced for this client account.</CardDescription>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value}</p>
    </div>
  );
}
