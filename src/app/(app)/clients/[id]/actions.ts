"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getClientWebhookUrl } from "@/lib/app-url";
import { requireSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { deleteLocalClient } from "@/lib/local-portal-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createCalcomLinkAction(clientId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const rawDuration = formData.get("duration") as string;
  const duration = parseInt(rawDuration, 10);
  const webhookUrl = getClientWebhookUrl(clientId);

  const admin = createSupabaseAdminClient();
  let clientCalApiKey = "";

  if (admin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: credential } = await (admin as any)
      .from("client_cal_credentials")
      .select("cal_api_key")
      .eq("client_id", clientId)
      .maybeSingle();

    clientCalApiKey = String(credential?.cal_api_key ?? "");
  }

  const calApiKey = clientCalApiKey;

  if (!calApiKey) {
    return { error: "No Cal.com API key found for this client. Add it in client setup." };
  }

  if (!title?.trim() || !slug?.trim() || Number.isNaN(duration) || duration <= 0) {
    return { error: "Please provide a valid title, slug, and duration." };
  }

  try {
    const res = await fetch("https://api.cal.com/v2/event-types", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${calApiKey}`,
        "cal-api-version": "2024-06-14",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lengthInMinutes: duration,
        title,
        slug,
        hidden: false,
        metadata: {
          clientId,
          webhookUrl,
        },
      }),
    });

    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      const message =
        typeof data.message === "string"
          ? data.message
          : typeof data.error === "string"
            ? data.error
            : raw || "Failed to create Cal.com event type.";
      return { error: message };
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) return { error: "Supabase client unconfigured" };

    const eventType = (data.data ?? data.event_type ?? {}) as Record<string, unknown>;
    const users = eventType.users;
    let username = "org";

    if (Array.isArray(users) && users.length > 0) {
      const first = users[0] as unknown;
      if (typeof first === "string") {
        username = first;
      } else if (first && typeof first === "object" && "username" in (first as Record<string, unknown>)) {
        const parsedUsername = (first as Record<string, unknown>).username;
        if (typeof parsedUsername === "string" && parsedUsername.trim()) {
          username = parsedUsername;
        }
      }
    }

    const publicLink = `https://cal.com/${username}/${slug}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any).from("client_integrations").insert({
      client_id: clientId,
      provider: "Cal.com",
      label: title,
      api_key_hint: "cal_****" + calApiKey.slice(-4),
      status: "connected",
      notes: `Link: ${publicLink} | Webhook: ${webhookUrl}`,
    });

    if (insertError) {
      return { error: "Link created but failed to save in portal: " + insertError.message };
    }

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Unknown error occurred." };
  }
}

export async function saveClientCalApiKeyAction(clientId: string, formData: FormData) {
  await requireSession();

  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured. Connect Supabase to store API keys." };
  }

  const apiKey = String(formData.get("calApiKey") ?? "").trim();

  if (!apiKey) {
    return { error: "Cal API key is required." };
  }

  if (!apiKey.startsWith("cal_")) {
    return { error: "Cal API key should start with cal_." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { error: "Supabase admin client is not configured." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: existingError } = await (admin as any)
    .from("client_cal_credentials")
    .select("booking_link, webhook_url, webhook_signing_secret")
    .eq("client_id", clientId)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }

  const bookingLink = String(existing?.booking_link ?? "");
  const webhookUrl = String(existing?.webhook_url ?? getClientWebhookUrl(clientId));
  const webhookSigningSecret = String(existing?.webhook_signing_secret ?? "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("client_cal_credentials").upsert(
    {
      client_id: clientId,
      cal_api_key: apiKey,
      booking_link: bookingLink,
      webhook_url: webhookUrl,
      webhook_signing_secret: webhookSigningSecret,
    },
    { onConflict: "client_id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/settings/webhooks");
  return { success: true };
}

export async function saveClientCalBookingLinkAction(clientId: string, formData: FormData) {
  await requireSession();

  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured. Connect Supabase to store booking links." };
  }

  const bookingLink = String(formData.get("bookingLink") ?? "").trim();

  if (!bookingLink) {
    return { error: "Cal booking link is required." };
  }

  try {
    new URL(bookingLink);
  } catch {
    return { error: "Please enter a valid URL." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { error: "Supabase admin client is not configured." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: existingError } = await (admin as any)
    .from("client_cal_credentials")
    .select("cal_api_key, webhook_url, webhook_signing_secret")
    .eq("client_id", clientId)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }

  const calApiKey = String(existing?.cal_api_key ?? "");
  const webhookUrl = String(existing?.webhook_url ?? getClientWebhookUrl(clientId));
  const webhookSigningSecret =
    String(existing?.webhook_signing_secret ?? "").trim() || randomBytes(24).toString("hex");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("client_cal_credentials").upsert(
    {
      client_id: clientId,
      cal_api_key: calApiKey,
      booking_link: bookingLink,
      webhook_url: webhookUrl,
      webhook_signing_secret: webhookSigningSecret,
    },
    { onConflict: "client_id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/settings/webhooks");

  return { success: true, webhookUrl };
}

export async function deleteClientAction(clientId: string) {
  await requireSession();

  if (!clientId) {
    return { error: "Client id is required." };
  }

  if (!isSupabaseConfigured) {
    await deleteLocalClient(clientId);
    revalidatePath("/clients");
    revalidatePath("/settings/webhooks");
    return { success: true };
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { error: "Supabase admin client is not configured." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("clients").delete().eq("id", clientId);

  if (error) {
    return { error: error.message || "Failed to delete client." };
  }

  revalidatePath("/clients");
  revalidatePath("/settings/webhooks");
  return { success: true };
}
