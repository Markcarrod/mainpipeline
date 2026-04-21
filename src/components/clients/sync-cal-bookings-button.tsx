"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { syncClientCalBookingsAction } from "@/app/(app)/clients/[id]/actions";
import { Button } from "@/components/ui/button";

export function SyncCalBookingsButton({
  clientId,
  disabled,
  provider = "cal.com",
}: {
  clientId: string;
  disabled: boolean;
  provider?: "cal.com" | "calendly";
}) {
  const [loading, setLoading] = useState(false);

  async function syncBookings() {
    setLoading(true);
    const result = await syncClientCalBookingsAction(clientId, provider);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    const upserted = "upserted" in result ? result.upserted : 0;
    toast.success(`Synced ${upserted} ${provider === "calendly" ? "Calendly" : "Cal.com"} booking records.`);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-xl"
      disabled={disabled || loading}
      onClick={syncBookings}
    >
      <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      {loading ? "Syncing" : provider === "calendly" ? "Sync Calendly" : "Sync Cal"}
    </Button>
  );
}
