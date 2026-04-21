"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteClientAction } from "@/app/(app)/clients/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteClientDialog({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onDeleteClient() {
    startTransition(async () => {
      const result = await deleteClientAction(clientId);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`${clientName} deleted.`);
      setOpen(false);
      router.push("/clients");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-rose-700 hover:bg-rose-50 hover:text-rose-800">
          Delete client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this client?</DialogTitle>
          <DialogDescription>
            This will remove {clientName} and related records. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            onClick={onDeleteClient}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Yes, delete client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
