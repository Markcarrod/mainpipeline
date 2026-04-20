import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { ActivityItem } from "@/types/portal";

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-5">
      {items.map((item) => (
        <div key={item.id} className="flex gap-4">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">{item.title}</p>
            <p className="text-sm leading-6 text-slate-600">{item.detail}</p>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              {formatDistanceToNowStrict(parseISO(item.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
