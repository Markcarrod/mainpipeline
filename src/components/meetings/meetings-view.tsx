"use client";

import { useMemo, useState } from "react";
import { format, isAfter, subDays } from "date-fns";
import { Search } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { MeetingStatusPill } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCampaignName, getClientName } from "@/lib/portal-helpers";
import type { Meeting, PortalDataset } from "@/types/portal";

export function MeetingsView({ dataset }: { dataset: PortalDataset }) {
  const [status, setStatus] = useState("all");
  const [client, setClient] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const meetings = useMemo(() => {
    return dataset.meetings.filter((meeting) => {
      const matchesStatus = status === "all" || meeting.status === status;
      const matchesClient = client === "all" || meeting.clientId === client;
      const normalizedQuery = query.toLowerCase();
      const haystack = `${meeting.prospectName} ${meeting.company} ${meeting.email}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesDate =
        dateRange === "all" ||
        isAfter(
          new Date(meeting.meetingDatetime),
          dateRange === "7" ? subDays(new Date(dataset.lastUpdated), 7) : subDays(new Date(dataset.lastUpdated), 30),
        );
      return matchesStatus && matchesClient && matchesQuery && matchesDate;
    });
  }, [client, dataset.lastUpdated, dataset.meetings, query, status, dateRange]);

  return (
    <>
      <DataTable
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-10"
                placeholder="Search by prospect, company, or email"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show">No show</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      >
        {meetings.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospect Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Date/Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow
                  key={meeting.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedMeeting(meeting)}
                >
                  <TableCell className="font-medium text-slate-900">{meeting.prospectName}</TableCell>
                  <TableCell>{meeting.company}</TableCell>
                  <TableCell>{meeting.jobTitle}</TableCell>
                  <TableCell>{getClientName(dataset, meeting.clientId)}</TableCell>
                  <TableCell>{getCampaignName(dataset, meeting.campaignId)}</TableCell>
                  <TableCell>{format(new Date(meeting.meetingDatetime), "MMM d, yyyy h:mm a")}</TableCell>
                  <TableCell>
                    <MeetingStatusPill status={meeting.status} />
                  </TableCell>
                  <TableCell>{meeting.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No meetings match these filters"
              description="Try broadening the client or status filters to review more booked calls."
            />
          </div>
        )}
      </DataTable>

      <Dialog open={Boolean(selectedMeeting)} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
        <DialogContent>
          {selectedMeeting ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMeeting.prospectName}</DialogTitle>
                <DialogDescription>
                  {selectedMeeting.company} • {selectedMeeting.jobTitle}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 px-6 py-5 text-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Detail label="Client" value={getClientName(dataset, selectedMeeting.clientId)} />
                  <Detail label="Campaign" value={getCampaignName(dataset, selectedMeeting.campaignId)} />
                  <Detail label="Email" value={selectedMeeting.email} />
                  <Detail label="Source" value={selectedMeeting.source} />
                  <Detail label="Date" value={format(new Date(selectedMeeting.meetingDatetime), "MMM d, yyyy")} />
                  <Detail label="Time" value={format(new Date(selectedMeeting.meetingDatetime), "h:mm a")} />
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Notes</p>
                  <p className="mt-3 leading-6 text-slate-700">{selectedMeeting.notes}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMeeting(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value}</p>
    </div>
  );
}
