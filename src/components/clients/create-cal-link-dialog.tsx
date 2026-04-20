"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
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
import { createCalcomLinkAction } from "@/app/(app)/clients/[id]/actions";

export function CreateCalLinkDialog({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const slugifiedName = clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const res = await createCalcomLinkAction(clientId, formData);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Booking link created successfully!");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Link2 className="mr-2 h-4 w-4" />
          Create Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create Cal.com Link</DialogTitle>
            <DialogDescription>
              Generate a native Cal.com event type for {clientName}. This will be added to their active integrations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={`Discovery Call - ${clientName}`}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={`discovery-${slugifiedName}`}
                required
              />
              <p className="text-xs text-slate-500">cal.com/your-org/[slug]</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Length (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                defaultValue={30}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
