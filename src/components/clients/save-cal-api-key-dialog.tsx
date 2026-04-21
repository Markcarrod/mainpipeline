"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { saveClientCalApiKeyAction } from "@/app/(app)/clients/[id]/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SaveCalApiKeyDialog({
  clientId,
  clientName,
  hasCalApiKey,
}: {
  clientId: string;
  clientName: string;
  hasCalApiKey: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const res = await saveClientCalApiKeyAction(clientId, formData);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Cal API key saved for this client.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <KeyRound className="mr-2 h-4 w-4" />
          {hasCalApiKey ? "Update API Key" : "Add API Key"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>{hasCalApiKey ? "Update Cal API Key" : "Add Cal API Key"}</DialogTitle>
            <DialogDescription>
              Save the Cal API key for {clientName}. It will be stored server-side and used when creating links.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor="calApiKey">Cal API Key</Label>
              <Input id="calApiKey" name="calApiKey" placeholder="cal_live_xxxxxxxxx" required />
              <p className="text-xs text-slate-500">This key is stored securely and tied to this client only.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
