import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  delta,
  hint,
  accent,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  accent?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-[28px] border-white/70 bg-white">
      <CardContent className="relative p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
              {accent ?? "Live"}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {delta ?? "Stable"}
            </div>
            <span className="text-slate-500">{hint}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
