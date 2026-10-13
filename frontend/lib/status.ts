import type { LeadStatus } from "./types";

// Object key order is the order of the filter chips and the status dropdown.
export const STATUS: Record<LeadStatus, { label: string; badge: string }> = {
  new: { label: "New", badge: "bg-green-50 text-green-700 ring-green-600/20" },
  contacted: { label: "Contacted", badge: "bg-yellow-50 text-yellow-800 ring-yellow-600/25" },
  qualified: { label: "Qualified", badge: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  proposal_sent: { label: "Proposal Sent", badge: "bg-purple-50 text-purple-700 ring-purple-600/20" },
  won: { label: "Won", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  lost: { label: "Lost", badge: "bg-slate-100 text-slate-600 ring-slate-500/20" },
};

export const STATUSES = Object.keys(STATUS) as LeadStatus[];

export const isClosed = (status: LeadStatus) => status === "won" || status === "lost";
