import { FollowUpChip } from "@/components/FollowUpChip";
import { StatusBadge } from "@/components/StatusBadge";
import { isClosed } from "@/lib/status";
import { followUpState, timeAgo } from "@/lib/time";
import type { Lead } from "@/lib/types";

const TONE = {
  overdue: "border-red-200 bg-red-50/50",
  today: "border-blue-200 bg-blue-50/60",
  upcoming: "border-slate-200 bg-white",
};

export function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (id: number) => void }) {
  const state = followUpState(lead.next_follow_up_at);
  const closed = isClosed(lead.status);
  const tone = state ? TONE[state] : closed ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(lead.id)}
        className={`w-full rounded-lg border p-4 text-left shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${tone}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate">
            <span className={`text-lg font-semibold ${closed ? "text-slate-500" : "text-slate-900"}`}>{lead.name}</span>
            {lead.company && <span className="text-sm text-slate-500"> ({lead.company})</span>}
          </p>
          <StatusBadge status={lead.status} />
        </div>

        <div className="mt-2 flex items-baseline gap-2 text-sm">
          {lead.last_note ? (
            <p className="min-w-0 truncate text-slate-600">
              <span className="font-medium text-slate-700">Last note:</span> {lead.last_note.body}
            </p>
          ) : (
            <p className="italic text-slate-500">No notes yet · added</p>
          )}
          <span className="shrink-0 text-xs text-slate-500">{timeAgo(lead.last_note?.created_at ?? lead.created_at)}</span>
        </div>

        {state && (
          <div className="mt-3">
            <FollowUpChip iso={lead.next_follow_up_at} />
          </div>
        )}
      </button>
    </li>
  );
}
