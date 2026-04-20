"use server";

import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createCalcomLinkAction(clientId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const rawDuration = formData.get("duration") as string;
  const duration = parseInt(rawDuration, 10);

  if (!env.calcomApiKey) {
    return { error: "CALCOM_API_KEY is not configured in the environment." };
  }

  try {
    const res = await fetch("https://api.cal.com/v1/event-types?apiKey=" + env.calcomApiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        length: duration,
        hidden: false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || "Failed to create Cal.com event type." };
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) return { error: "Supabase client unconfigured" };

    const username = data.event_type?.users?.[0]?.username || "org";
    const { error: insertError } = await supabase.from("client_integrations").insert({
      client_id: clientId,
      provider: "Cal.com",
      label: title,
      api_key_hint: "cal_••••" + env.calcomApiKey.slice(-4),
      status: "connected",
      notes: `Link: https://cal.com/${username}/${slug}`,
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
