"use client";

import Link from "next/link";
import { BarChart3, BriefcaseBusiness, CalendarRange, LayoutDashboard, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: CalendarRange },
  { href: "/clients", label: "Clients", icon: BriefcaseBusiness },
  { href: "/campaigns", label: "Campaigns", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[272px] shrink-0 border-r border-sidebar-border bg-sidebar px-5 py-6 lg:flex lg:flex-col">
      <div className="px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white shadow-sm">
            PP
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pipeline Portal</p>
            <h2 className="text-lg font-semibold text-slate-950">Client Delivery</h2>
          </div>
        </div>
      </div>
      <nav className="mt-10 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-900">Discovery Call Ready</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Clean performance views, presentable client pages, and realistic meeting pacing for live demos.
        </p>
      </div>
    </aside>
  );
}
