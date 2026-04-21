import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WebhookManager } from "@/components/settings/webhook-manager";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { getPortalDataset } from "@/lib/portal-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface WebhookCredential {
  clientId: string;
  webhookUrl: string;
  webhookSecretConfigured: boolean;
  updatedAt: string;
}

export default async function WebhooksSettingsPage() {
  await requireSession();

  const dataset = await getPortalDataset();
  const admin = createSupabaseAdminClient();
  let credentials: WebhookCredential[] = [];
  let adminError = "";

  if (admin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("client_cal_credentials")
      .select("client_id, webhook_url, webhook_signing_secret, updated_at");

    if (error) {
      adminError = error.message;
    } else {
      credentials = ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
        clientId: String(item.client_id),
        webhookUrl: String(item.webhook_url ?? ""),
        webhookSecretConfigured: Boolean(String(item.webhook_signing_secret ?? "").trim()),
        updatedAt: String(item.updated_at ?? ""),
      }));
    }
  } else {
    adminError = "SUPABASE_SERVICE_ROLE_KEY is missing.";
  }

  const clients = dataset.clients
    .map((client) => ({
      id: client.id,
      name: client.name,
      status: client.status,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Client webhook manager"
        description="Pick a client, generate a unique webhook URL, and permanently manage revoke or regenerate actions."
        action={
          <Button variant="outline" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
              Back to settings
            </Link>
          </Button>
        }
      />
      <Card className="rounded-[28px]">
        <CardContent className="p-6">
          <WebhookManager clients={clients} credentials={credentials} adminError={adminError} />
        </CardContent>
      </Card>
    </div>
  );
}
