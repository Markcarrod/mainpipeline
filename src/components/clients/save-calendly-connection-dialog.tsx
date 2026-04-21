"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { saveClientCalendlyConnectionAction } from "@/app/(app)/clients/[id]/actions";
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

export function SaveCalendlyConnectionDialog({
  clientId,
  clientName,
  hasCalendlyToken,
}: {
  clientId: string;
  clientName: string;
  hasCalendlyToken: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const res = await saveClientCalendlyConnectionAction(clientId, formData);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Calendly connection saved.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <CalendarCheck className="h-4 w-4" />
          {hasCalendlyToken ? "Update Calendly" : "Add Calendly"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>{hasCalendlyToken ? "Update Calendly" : "Add Calendly"}</DialogTitle>
            <DialogDescription>
              Save the Calendly token and booking link for {clientName}. Calendly uses its own webhook endpoint.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor="calendlyApiKey">Calendly API Token</Label>
              <Input id="calendlyApiKey" name="calendlyApiKey" placeholder="Paste Calendly personal access token" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bookingLink">Calendly Booking Link</Label>
              <Input id="bookingLink" name="bookingLink" placeholder="https://calendly.com/team/discovery" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="webhookSigningSecret">Webhook Signing Secret</Label>
              <Input id="webhookSigningSecret" name="webhookSigningSecret" placeholder="Optional Calendly webhook signing key" />
              <p className="text-xs text-slate-500">Use the signing key from the Calendly webhook subscription. Leave blank only for local testing.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Calendly"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
