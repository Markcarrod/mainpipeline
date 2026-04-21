"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateClientStatusAction } from "@/app/(app)/clients/[id]/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClientStatus } from "@/types/portal";

const statusLabels: Record<ClientStatus, string> = {
  active: "Active",
  paused: "Paused",
  onboarding: "Onboarding",
};

export function ClientStatusSelect({
  clientId,
  status,
}: {
  clientId: string;
  status: ClientStatus;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isPending, startTransition] = useTransition();

  function onChange(nextStatus: ClientStatus) {
    if (nextStatus === currentStatus) {
      return;
    }

    const previousStatus = currentStatus;
    setCurrentStatus(nextStatus);

    startTransition(async () => {
      const result = await updateClientStatusAction(clientId, nextStatus);

      if (result?.error) {
        setCurrentStatus(previousStatus);
        toast.error(result.error);
        return;
      }

      toast.success(`Client marked ${statusLabels[nextStatus].toLowerCase()}.`);
    });
  }

  return (
    <Select value={currentStatus} onValueChange={(value) => onChange(value as ClientStatus)} disabled={isPending}>
      <SelectTrigger className="w-40 rounded-xl">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="onboarding">Onboarding</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="paused">Paused</SelectItem>
      </SelectContent>
    </Select>
  );
}
