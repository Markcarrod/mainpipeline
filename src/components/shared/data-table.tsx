import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataTable({
  toolbar,
  children,
  className,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card overflow-hidden rounded-[28px]", className)}>
      {toolbar ? <div className="border-b bg-white px-6 py-4">{toolbar}</div> : null}
      <div className="bg-white">{children}</div>
    </div>
  );
}
