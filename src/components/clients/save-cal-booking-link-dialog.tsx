"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { saveClientCalBookingLinkAction } from "@/app/(app)/clients/[id]/actions";
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

export function SaveCalBookingLinkDialog({
  clientId,
  clientName,
  hasBookingLink,
}: {
  clientId: string;
  clientName: string;
  hasBookingLink: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const res = await saveClientCalBookingLinkAction(clientId, formData);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Booking link saved and webhook is ready.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Link2 className="mr-2 h-4 w-4" />
          {hasBookingLink ? "Update Booking Link" : "Add Booking Link"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>{hasBookingLink ? "Update Cal Booking Link" : "Add Cal Booking Link"}</DialogTitle>
            <DialogDescription>
              Save the booking link from {clientName}. This also ensures a client-specific webhook URL exists.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor="bookingLink">Booking Link</Label>
              <Input
                id="bookingLink"
                name="bookingLink"
                placeholder="https://cal.com/your-team/discovery-call"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
