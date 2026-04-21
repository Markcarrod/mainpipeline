"use client";

import { useActionState, useMemo, useState } from "react";
import { updateClientWebhookAction, initialWebhookActionState } from "@/app/(app)/settings/webhooks/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ClientOption {
  id: string;
  name: string;
  status: string;
}

interface CredentialRecord {
  clientId: string;
  webhookUrl: string;
  webhookSecretConfigured: boolean;
  updatedAt: string;
}

export function WebhookManager({
  clients,
  credentials,
  adminError,
}: {
  clients: ClientOption[];
  credentials: CredentialRecord[];
  adminError: string;
}) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? "");
  const [state, formAction, pending] = useActionState(updateClientWebhookAction, initialWebhookActionState);

  const credentialMap = useMemo(
    () =>
      new Map(
        credentials.map((record) => [
          record.clientId,
          {
            webhookUrl: record.webhookUrl,
            webhookSecretConfigured: record.webhookSecretConfigured,
            updatedAt: record.updatedAt,
          },
        ]),
      ),
    [credentials],
  );

  const selectedCredential = credentialMap.get(state.clientId ?? selectedClientId);
  const effectiveWebhookUrl = state.webhookUrl ?? selectedCredential?.webhookUrl ?? "";
  const effectiveSecretConfigured = state.webhookSecretConfigured ?? selectedCredential?.webhookSecretConfigured ?? false;

  if (!clients.length) {
    return (
      <div className="rounded-2xl border border-dashed bg-slate-50 px-4 py-6 text-sm text-slate-600">
        No clients found yet. Add a client first, then return here to generate its webhook.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {adminError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {adminError}
        </div>
      ) : null}

      <form action={formAction} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <label htmlFor="clientId" className="text-sm font-medium text-slate-700">
              Pick client
            </label>
            <select
              id="clientId"
              name="clientId"
              value={selectedClientId}
              onChange={(event) => setSelectedClientId(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none ring-blue-500 focus:ring-2"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="submit"
                name="operation"
                value="generate"
                disabled={pending || Boolean(adminError)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate
              </button>
              <button
                type="submit"
                name="operation"
                value="regenerate"
                disabled={pending || Boolean(adminError)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Regenerate
              </button>
              <button
                type="submit"
                name="operation"
                value="revoke"
                disabled={pending || Boolean(adminError)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-slate-900">Current status</p>
          <Badge variant={effectiveWebhookUrl ? "green" : "outline"}>
            {effectiveWebhookUrl ? "Webhook active" : "No webhook"}
          </Badge>
          <Badge variant={effectiveSecretConfigured ? "blue" : "outline"}>
            {effectiveSecretConfigured ? "Secret configured" : "Secret missing"}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">Webhook URL</p>
        <p className="break-all rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
          {effectiveWebhookUrl || "No webhook URL saved for this client yet."}
        </p>
        <p className="text-xs text-slate-500">Latest generated secret</p>
        <p className="break-all rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
          {state.generatedSecret || "Secret values are hidden after refresh. Regenerate to issue a new one."}
        </p>
      </div>

      {state.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</div>
      ) : null}
      {state.success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}

      <div className="text-xs text-slate-500">
        <p>Generate: creates a permanent client-specific webhook URL and secret.</p>
        <p>Regenerate: rotates the secret and re-saves the webhook URL for the same client.</p>
        <p>Revoke: clears webhook URL and secret for the selected client.</p>
      </div>
      <Button variant="outline" type="button" onClick={() => navigator.clipboard.writeText(effectiveWebhookUrl)} disabled={!effectiveWebhookUrl}>
        Copy webhook URL
      </Button>
    </div>
  );
}
