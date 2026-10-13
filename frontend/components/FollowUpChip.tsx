import { followUpState, formatDateTime, formatTime } from "@/lib/time";

const STYLES = {
  overdue: "bg-red-50 text-red-700 ring-red-600/20",
  today: "bg-blue-50 text-blue-700 ring-blue-600/20",
  upcoming: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function FollowUpChip({ iso }: { iso: string | null }) {
  const state = followUpState(iso);
  if (!iso || !state) return null;

  const [icon, text] =
    state === "overdue"
      ? ["⚠", `Overdue · was due ${formatDateTime(iso)}`]
      : state === "today"
        ? ["🔔", `Follow-up today at ${formatTime(iso)}`]
        : ["📅", `Follow-up ${formatDateTime(iso)}`];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${STYLES[state]}`}>
      <span aria-hidden>{icon}</span>
      {text}
    </span>
  );
}
