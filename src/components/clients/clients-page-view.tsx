"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, PlugZap, Plus, Users } from "lucide-react";
import { createClientAction, type CreateClientState } from "@/app/(app)/clients/actions";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { getMeetingsBookedThisMonth } from "@/lib/portal-helpers";
import { formatCurrency } from "@/lib/utils";
import type { Client, ClientIntegration, PortalDataset } from "@/types/portal";

const initialState: CreateClientState = { error: "", success: "" };

export function ClientsPageView({ dataset }: { dataset: PortalDataset }) {
  const [open, setOpen] = useState(false);
  const [portalDataset, setPortalDataset] = useState(dataset);
  const [state, formAction, pending] = useActionState(createClientAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.client) {
      return;
    }

    setPortalDataset((current) => ({
      ...current,
      clients: [state.client as Client, ...current.clients],
      clientIntegrations: state.integration
        ? [state.integration as ClientIntegration, ...current.clientIntegrations]
        : current.clientIntegrations,
    }));
    setOpen(false);
    formRef.current?.reset();
  }, [state.client, state.integration]);

  const clientCards = useMemo(
    () =>
      portalDataset.clients.map((client) => ({
        client,
        booked: getMeetingsBookedThisMonth(portalDataset, client.id),
        integrations: portalDataset.clientIntegrations.filter((integration) => integration.clientId === client.id),
      })),
    [portalDataset],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clients"
        title="Client delivery and target pacing"
        description="Every client card is tuned for internal review and live screen-sharing with agency prospects."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New client
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-2">
        {clientCards.map(({ client, booked, integrations }) => (
          <Link key={client.id} href={`/clients/${client.id}`}>
            <Card className="h-full rounded-[28px] transition-transform hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-950">{client.name}</h3>
                        <p className="text-sm text-slate-500">{client.industry}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Metric label="Monthly target" value={`${client.monthlyMeetingTarget} meetings`} />
                      <Metric label="Booked this month" value={`${booked} meetings`} />
                      <Metric label="Monthly price" value={formatCurrency(client.monthlyPrice)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {integrations.length ? (
                        integrations.slice(0, 2).map((integration) => (
                          <div
                            key={integration.id}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            <PlugZap className="h-3.5 w-3.5" />
                            {integration.provider}
                          </div>
                        ))
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                          <PlugZap className="h-3.5 w-3.5" />
                          Add integration details
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 text-right">
                    <StatusBadge status={client.status} />
                    <div className="inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                      View client
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add new client</DialogTitle>
            <DialogDescription>
              Capture client basics, target profile, and any API or integration context you want available on the account.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} ref={formRef} className="space-y-5 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client name" name="name" placeholder="Newport Growth Partners" />
              <Field label="Industry" name="industry" placeholder="Lead generation agency" />
              <Field label="Target industry" name="targetIndustry" placeholder="B2B SaaS" />
              <Field label="Target location" name="targetLocation" placeholder="United States" />
              <Field label="Company size" name="targetCompanySize" placeholder="11-200 employees" />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select name="status" defaultValue="onboarding">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Monthly meeting target" name="monthlyMeetingTarget" type="number" placeholder="16" />
              <Field label="Monthly price (USD)" name="monthlyPrice" type="number" placeholder="2000" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Target job titles</label>
              <Input name="targetJobTitles" placeholder="Founder, VP Sales, Head of Growth" required />
            </div>

            <div className="rounded-3xl border bg-slate-50/80 p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">Client integrations</p>
                <p className="text-sm leading-6 text-slate-500">
                  Add a provider, API key hint, or connection note so the account feels complete and operational.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Provider" name="integrationProvider" placeholder="Cal.com, HubSpot, Slack" optional />
                <Field label="Label" name="integrationLabel" placeholder="Scheduling access" optional />
                <Field label="API key or token" name="integrationApiKey" placeholder="Paste token" optional />
                <Field label="Integration note" name="integrationNotes" placeholder="Used for meeting syncs" optional />
              </div>
            </div>

            {state.error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {state.error}
              </div>
            ) : null}
            {state.success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {state.success}
              </div>
            ) : null}

            <DialogFooter className="px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating..." : "Create client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  optional = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <Input name={name} type={type} placeholder={placeholder} required={!optional} />
    </div>
  );
}
