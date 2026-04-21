"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getClientWebhookUrl } from "@/lib/app-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface WebhookActionState {
  error: string;
  success: string;
  webhookUrl?: string;
  generatedSecret?: string;
  webhookSecretConfigured?: boolean;
  clientId?: string;
}

const webhookActionSchema = z.object({
  clientId: z.string().uuid("Pick a valid client."),
  operation: z.enum(["generate", "regenerate", "revoke"]),
});

const initialState: WebhookActionState = {
  error: "",
  success: "",
};

export const initialWebhookActionState = initialState;

export async function updateClientWebhookAction(
  _: WebhookActionState,
  formData: FormData,
): Promise<WebhookActionState> {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "You are not authenticated. Please log in again.", success: "" };
    }

    const parsed = webhookActionSchema.safeParse({
      clientId: formData.get("clientId"),
      operation: formData.get("operation"),
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid request.",
        success: "",
      };
    }

    const { clientId, operation } = parsed.data;
    const admin = createSupabaseAdminClient();

    if (!admin) {
      return {
        error: "Supabase admin client is not configured. Add SUPABASE_SERVICE_ROLE_KEY.",
        success: "",
        clientId,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientRes = await (admin as any).from("clients").select("id, name").eq("id", clientId).maybeSingle();

    if (clientRes.error || !clientRes.data) {
      return {
        error: clientRes.error?.message ?? "Client not found.",
        success: "",
        clientId,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingRes = await (admin as any)
      .from("client_cal_credentials")
      .select("cal_api_key, booking_link")
      .eq("client_id", clientId)
      .maybeSingle();

    if (existingRes.error) {
      return {
        error: existingRes.error.message,
        success: "",
        clientId,
      };
    }

    const calApiKey = String(existingRes.data?.cal_api_key ?? "");
    const bookingLink = String(existingRes.data?.booking_link ?? "");

    if (operation === "revoke") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin as any).from("client_cal_credentials").upsert(
        {
          client_id: clientId,
          cal_api_key: calApiKey,
          booking_link: bookingLink,
          webhook_url: "",
          webhook_signing_secret: "",
        },
        { onConflict: "client_id" },
      );

      if (error) {
        return { error: error.message, success: "", clientId };
      }

      revalidatePath("/settings/webhooks");
      revalidatePath("/settings");

      return {
        error: "",
        success: "Webhook revoked for this client.",
        webhookUrl: "",
        generatedSecret: "",
        webhookSecretConfigured: false,
        clientId,
      };
    }

    const webhookUrl = getClientWebhookUrl(clientId);
    const generatedSecret = randomBytes(24).toString("hex");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from("client_cal_credentials").upsert(
      {
        client_id: clientId,
        cal_api_key: calApiKey,
        booking_link: bookingLink,
        webhook_url: webhookUrl,
        webhook_signing_secret: generatedSecret,
      },
      { onConflict: "client_id" },
    );

    if (error) {
      return {
        error: error.message,
        success: "",
        clientId,
      };
    }

    revalidatePath("/settings/webhooks");
    revalidatePath("/settings");

    return {
      error: "",
      success: operation === "regenerate" ? "Webhook and secret regenerated." : "Webhook generated for this client.",
      webhookUrl,
      generatedSecret,
      webhookSecretConfigured: true,
      clientId,
    };
  } catch {
    return {
      error: "Webhook action failed unexpectedly. Please try again.",
      success: "",
    };
  }
}
