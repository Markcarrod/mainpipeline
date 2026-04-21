"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { upsertLocalClient } from "@/lib/local-portal-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Client, ClientIntegration, ClientStatus } from "@/types/portal";

export interface CreateClientState {
  error: string;
  success: string;
  client?: Client;
  integration?: ClientIntegration;
}

const clientSchema = z.object({
  name: z.string().min(2, "Add a client name."),
  industry: z.string().min(2, "Add an industry."),
  targetIndustry: z.string().min(2, "Add the target industry."),
  targetLocation: z.string().min(2, "Add a target location."),
  targetCompanySize: z.string().min(2, "Add a company size band."),
  targetJobTitles: z.string().min(2, "Add at least one target title."),
  monthlyMeetingTarget: z.coerce.number().int().min(1, "Set a monthly target."),
  monthlyPrice: z.coerce.number().min(500, "Set a monthly price."),
  status: z.enum(["active", "paused", "onboarding"]),
  integrationProvider: z.string().optional(),
  integrationLabel: z.string().optional(),
  integrationApiKey: z.string().optional(),
  integrationNotes: z.string().optional(),
});

function maskApiKey(value?: string) {
  if (!value) {
    return "";
  }

  const clean = value.trim();

  if (clean.length <= 4) {
    return "••••";
  }

  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`;
}

export async function createClientAction(
  _: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry"),
    targetIndustry: formData.get("targetIndustry"),
    targetLocation: formData.get("targetLocation"),
    targetCompanySize: formData.get("targetCompanySize"),
    targetJobTitles: formData.get("targetJobTitles"),
    monthlyMeetingTarget: formData.get("monthlyMeetingTarget"),
    monthlyPrice: formData.get("monthlyPrice"),
    status: formData.get("status"),
    integrationProvider: formData.get("integrationProvider"),
    integrationLabel: formData.get("integrationLabel"),
    integrationApiKey: formData.get("integrationApiKey"),
    integrationNotes: formData.get("integrationNotes"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the fields and try again.",
      success: "",
    };
  }

  const values = parsed.data;
  const createdAt = new Date().toISOString();
  const client: Client = {
    id: randomUUID(),
    name: values.name,
    industry: values.industry,
    targetIndustry: values.targetIndustry,
    targetLocation: values.targetLocation,
    targetCompanySize: values.targetCompanySize,
    targetJobTitles: values.targetJobTitles.split(",").map((item) => item.trim()).filter(Boolean),
    monthlyMeetingTarget: values.monthlyMeetingTarget,
    monthlyPrice: values.monthlyPrice,
    status: values.status as ClientStatus,
    createdAt,
  };

  const integration: ClientIntegration | undefined =
    values.integrationProvider || values.integrationLabel || values.integrationApiKey || values.integrationNotes
      ? {
          id: randomUUID(),
          clientId: client.id,
          provider: values.integrationProvider?.trim() || "Custom",
          label: values.integrationLabel?.trim() || "Client access",
          apiKeyHint: maskApiKey(values.integrationApiKey),
          status: values.integrationApiKey ? "connected" : "pending",
          notes: values.integrationNotes?.trim() || "Added during client onboarding.",
          createdAt,
        }
      : undefined;

  if (!isSupabaseConfigured) {
    if (process.env.NODE_ENV === "production") {
      return {
        error:
          "Supabase is not configured in production. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.",
        success: "",
      };
    }

    try {
      await upsertLocalClient(client, integration);
      revalidatePath("/clients");
      revalidatePath(`/clients/${client.id}`);
    } catch {
      return {
        error: "Local storage fallback failed. Configure Supabase to persist clients.",
        success: "",
      };
    }

    return {
      error: "",
      success: "Client created successfully in local mode.",
      client,
      integration,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { error: "Supabase connection is unavailable.", success: "" };
  }

  const { data: insertedClient, error: clientError } = await (supabase.from("clients") as never as {
    insert: (value: Record<string, unknown>) => {
      select: () => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  })
    .insert({
      name: client.name,
      industry: client.industry,
      target_industry: client.targetIndustry,
      target_location: client.targetLocation,
      target_company_size: client.targetCompanySize,
      target_job_titles: client.targetJobTitles,
      monthly_meeting_target: client.monthlyMeetingTarget,
      monthly_price: client.monthlyPrice,
      status: client.status,
    })
    .select()
    .single();

  if (clientError || !insertedClient) {
    return {
      error:
        clientError?.message ??
        "Unable to create the client. Apply the latest schema and RLS policies in Supabase first.",
      success: "",
    };
  }

  const persistedClient: Client = {
    ...client,
    id: String(insertedClient.id),
    createdAt: String(insertedClient.created_at),
  };

  let persistedIntegration: ClientIntegration | undefined;

  if (integration) {
    const { data: insertedIntegration, error: integrationError } = await (supabase.from(
      "client_integrations",
    ) as never as {
      insert: (value: Record<string, unknown>) => {
        select: () => {
          single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
        };
      };
    })
      .insert({
        client_id: persistedClient.id,
        provider: integration.provider,
        label: integration.label,
        api_key_hint: integration.apiKeyHint || null,
        status: integration.status,
        notes: integration.notes,
      })
      .select()
      .single();

    if (integrationError || !insertedIntegration) {
      return {
        error:
          integrationError?.message ??
          "Client was created, but the integration record could not be saved. Apply the latest schema and try again.",
        success: "",
        client: persistedClient,
      };
    }

    persistedIntegration = {
      ...integration,
      id: String(insertedIntegration.id),
      clientId: String(insertedIntegration.client_id),
      apiKeyHint: String(insertedIntegration.api_key_hint ?? ""),
      status: insertedIntegration.status as ClientIntegration["status"],
      notes: String(insertedIntegration.notes ?? ""),
      createdAt: String(insertedIntegration.created_at),
    };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${persistedClient.id}`);

  return {
    error: "",
    success: "Client created successfully.",
    client: persistedClient,
    integration: persistedIntegration,
  };
}
