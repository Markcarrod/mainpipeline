import { env } from "@/lib/env";

export function getAppBaseUrl() {
  if (env.appUrl) {
    return env.appUrl.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function getClientWebhookUrl(clientId: string) {
  return `${getAppBaseUrl()}/api/webhooks/calcom?clientId=${encodeURIComponent(clientId)}`;
}
