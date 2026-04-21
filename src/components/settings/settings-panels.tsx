import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env, isCalcomConfigured, isSupabaseConfigured } from "@/lib/env";

export function SettingsPanels() {
  const calcomReady = isCalcomConfigured;
  const webhookReady = Boolean(env.calcomSigningSecret);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <SettingsCard
        title="Workspace settings"
        description="Pipeline Portal is configured for internal operators and discovery-call demos."
        items={[
          ["Workspace", "Pipeline Portal"],
          ["Default region", "North America"],
          ["Client visibility", "Internal and screen-share ready"],
        ]}
      />
      <SettingsCard
        title="Profile settings"
        description="Primary operator profile used across notifications and exports."
        items={[
          ["Full name", "Maya Thompson"],
          ["Role", "Agency Lead"],
          ["Notifications", "Daily summary enabled"],
        ]}
      />
      <Card className="rounded-[28px]">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Scheduling</CardTitle>
              <CardDescription>
                Cal.com scheduling runs with per-client API keys, and webhook events create meetings once the signing secret is configured.
              </CardDescription>
            </div>
            <Badge variant={calcomReady ? "green" : "outline"}>{calcomReady ? "Connected" : "Demo Mode"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>
            Provider: <span className="font-medium text-slate-900">Cal.com</span>
          </p>
          <p>
            API access:{" "}
            <span className="font-medium text-slate-900">{calcomReady ? "Per-client enabled" : "Not configured"}</span>
          </p>
          <p>
            Webhook signing:{" "}
            <span className="font-medium text-slate-900">{webhookReady ? "Configured" : "Pending secret"}</span>
          </p>
          <p>
            Booking flow: inbound webhook event {"->"} lookup client and campaign {"->"} create meeting record {"->"} surface in meetings dashboard.
          </p>
          <div className="flex gap-3">
            <Button variant="outline">View webhook docs</Button>
            <Button variant="secondary">Test booking event</Button>
          </div>
        </CardContent>
      </Card>
      <SettingsCard
        title="Supabase connection"
        description="Database and auth status for production deployment."
        items={[
          ["Auth", isSupabaseConfigured ? "Connected" : "Demo mode"],
          ["Database", isSupabaseConfigured ? "Connected" : "Demo dataset"],
          ["Last sync", "Apr 20, 2026 10:30 AM UTC"],
        ]}
      />
      <SettingsCard
        title="Webhook placeholder"
        description="Reserved routes for future enrichment, Slack notifications, and CRM syncs."
        items={[
          ["Booking events", "/api/webhooks/calcom"],
          ["Sync status", webhookReady ? "Ready for signed events" : "Waiting for webhook secret"],
          ["Retries", "Manual replay supported"],
        ]}
      />
      <SettingsCard
        title="Account defaults"
        description="Safe outreach defaults used when spinning up new sender accounts."
        items={[
          ["Daily limit", "70 sends"],
          ["Warm-up threshold", "14 days"],
          ["Time zone", "Africa/Lagos"],
        ]}
      />
    </div>
  );
}

function SettingsCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: [string, string][];
}) {
  return (
    <Card className="rounded-[28px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-900">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
