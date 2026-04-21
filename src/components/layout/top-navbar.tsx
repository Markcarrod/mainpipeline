"use client";

import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/meetings": "Meetings",
  "/clients": "Clients",
  "/campaigns": "Campaigns",
  "/settings/webhooks": "Webhooks",
  "/settings": "Settings",
};

export function TopNavbar({
  fullName,
  role,
}: {
  fullName: string;
  role: string;
}) {
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const title =
    Object.entries(titles).find(([key]) => pathname.startsWith(key))?.[1] ?? "Pipeline Portal";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200/80 bg-background/95 px-5 py-4 backdrop-blur">
      <div className="flex items-center gap-4">
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-slate-600 lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
          <p className="text-sm text-slate-500">Pipeline Portal</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden w-80 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="h-10 rounded-xl pl-10" placeholder="Search meetings, clients, campaigns..." />
        </div>
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-slate-600 shadow-sm">
          <Bell className="h-4 w-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl border bg-white px-2 py-1.5 shadow-sm">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-slate-900">{fullName}</p>
              <p className="text-xs text-slate-500">{role}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Signed in</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setLogoutOpen(true)}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Do you want to log out?</DialogTitle>
            <DialogDescription>
              You will be signed out of this workspace and redirected to the login page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <form action={logoutAction}>
              <Button type="submit">Yes, log out</Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
