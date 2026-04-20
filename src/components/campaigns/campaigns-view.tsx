"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getClientName } from "@/lib/portal-helpers";
import { formatPercent } from "@/lib/utils";
import type { PortalDataset } from "@/types/portal";

export function CampaignsView({ dataset }: { dataset: PortalDataset }) {
  const [client, setClient] = useState("all");
  const [status, setStatus] = useState("all");

  const campaigns = useMemo(
    () =>
      dataset.campaigns.filter((campaign) => {
        const matchesClient = client === "all" || campaign.clientId === client;
        const matchesStatus = status === "all" || campaign.status === status;
        return matchesClient && matchesStatus;
      }),
    [client, dataset.campaigns, status],
  );

  return (
    <DataTable
      toolbar={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Select value={client} onValueChange={setClient}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {dataset.clients.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="warming">Warming</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      {campaigns.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Messages Sent</TableHead>
              <TableHead>Replies</TableHead>
              <TableHead>Positive Replies</TableHead>
              <TableHead>Meetings Booked</TableHead>
              <TableHead>Reply Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium text-slate-900">
                  <Link href={`/campaigns/${campaign.id}`} className="inline-flex items-center gap-2">
                    {campaign.name}
                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                  </Link>
                </TableCell>
                <TableCell>{getClientName(dataset, campaign.clientId)}</TableCell>
                <TableCell>{campaign.channel}</TableCell>
                <TableCell>
                  <StatusBadge status={campaign.status} />
                </TableCell>
                <TableCell>{campaign.messagesSent.toLocaleString()}</TableCell>
                <TableCell>{campaign.replies}</TableCell>
                <TableCell>{campaign.positiveReplies}</TableCell>
                <TableCell>{campaign.meetingsBooked}</TableCell>
                <TableCell>{formatPercent((campaign.replies / campaign.messagesSent) * 100)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="p-6">
          <EmptyState
            title="No campaigns in this slice"
            description="Broaden the client or status filters to review more outreach programs."
          />
        </div>
      )}
    </DataTable>
  );
}
