"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardMetricPoint } from "@/types/portal";

const chartStroke = "#2563eb";
const lightStroke = "#93c5fd";
const gridStroke = "#e5e7eb";

export function MeetingsTrendChart({ data }: { data: DashboardMetricPoint[] }) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis tickLine={false} axisLine={false} width={32} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="meetingsBooked"
            stroke={chartStroke}
            strokeWidth={3}
            dot={{ r: 4, fill: chartStroke }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReplyRateChart({ data }: { data: DashboardMetricPoint[] }) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis tickLine={false} axisLine={false} width={40} unit="%" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="replyRate" stroke={chartStroke} strokeWidth={2.5} dot={false} />
          <Line
            type="monotone"
            dataKey="positiveReplyRate"
            stroke={lightStroke}
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CampaignPerformanceChart({
  data,
}: {
  data: { name: string; meetingsBooked: number; positiveReplies: number }[];
}) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12 }}>
          <CartesianGrid stroke={gridStroke} horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={128} />
          <Tooltip />
          <Legend />
          <Bar dataKey="meetingsBooked" radius={[0, 8, 8, 0]} fill={chartStroke} />
          <Bar dataKey="positiveReplies" radius={[0, 8, 8, 0]} fill={lightStroke} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReplyFunnelChart({
  replies,
  positiveReplies,
  meetingsBooked,
}: {
  replies: number;
  positiveReplies: number;
  meetingsBooked: number;
}) {
  const data = [
    { value: replies, name: "Replies", fill: "#dbeafe" },
    { value: positiveReplies, name: "Positive Replies", fill: "#93c5fd" },
    { value: meetingsBooked, name: "Meetings Booked", fill: "#2563eb" },
  ];

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip />
          <Funnel dataKey="value" data={data} isAnimationActive>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}
