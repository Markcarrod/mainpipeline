"use server";

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

  try {
    const res = await fetch("https://api.cal.com/v1/event-types?apiKey=" + encodeURIComponent(calApiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        length: duration,
        hidden: false,
        metadata: {
          clientId,
          webhookUrl: getClientWebhookUrl(clientId),
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || "Failed to create Cal.com event type." };
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) return { error: "Supabase client unconfigured" };

    const username = data.event_type?.users?.[0]?.username || "org";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any).from("client_integrations").insert({
      client_id: clientId,
      provider: "Cal.com",
      label: title,
      api_key_hint: "cal_****" + calApiKey.slice(-4),
      status: "connected",
      notes: `Link: https://cal.com/${username}/${slug} | Webhook: ${getClientWebhookUrl(clientId)}`,
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
