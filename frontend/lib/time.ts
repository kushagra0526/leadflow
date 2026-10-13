import type { Lead } from "./types";

export type FollowUpState = "overdue" | "today" | "upcoming";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Compared by calendar day in the browser's timezone: only the browser knows what "today" is for the user.
export function followUpState(iso: string | null, now = new Date()): FollowUpState | null {
  if (!iso) return null;
  const due = startOfDay(new Date(iso));
  const today = startOfDay(now);
  return due < today ? "overdue" : due === today ? "today" : "upcoming";
}

// Splits the list into the three sections of the main screen; follow-up sections are soonest first.
export function groupLeads(leads: Lead[], now = new Date()) {
  const groups = { overdue: [] as Lead[], today: [] as Lead[], rest: [] as Lead[] };
  for (const lead of leads) {
    const state = followUpState(lead.next_follow_up_at, now);
    groups[state === "overdue" || state === "today" ? state : "rest"].push(lead);
  }
  const byDue = (a: Lead, b: Lead) => Date.parse(a.next_follow_up_at!) - Date.parse(b.next_follow_up_at!);
  groups.overdue.sort(byDue);
  groups.today.sort(byDue);
  return groups;
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86400],
  ["month", 30 * 86400],
  ["week", 7 * 86400],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(iso: string, now = new Date()): string {
  const seconds = (Date.parse(iso) - now.getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.trunc(seconds / size), unit);
  }
  return "just now";
}

const dateTime = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const timeOnly = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatTime = (iso: string) => timeOnly.format(new Date(iso));
