import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

export function ClientProgressCard({
  name,
  booked,
  target,
}: {
  name: string;
  booked: number;
  target: number;
}) {
  const progress = Math.min((booked / target) * 100, 100);

  return (
    <Card className="rounded-[24px]">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">{name}</p>
            <p className="text-sm text-slate-500">
              {booked} of {target} meetings booked
            </p>
          </div>
          <div className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            {formatPercent(progress, 0)}
          </div>
        </div>
        <Progress value={progress} />
      </CardContent>
    </Card>
  );
}
