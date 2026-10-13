import { STATUS, STATUSES } from "@/lib/status";
import type { LeadStatus } from "@/lib/types";

type Props = { value: LeadStatus | null; onChange: (status: LeadStatus | null) => void };

const OPTIONS: [LeadStatus | null, string][] = [[null, "All"], ...STATUSES.map((s): [LeadStatus, string] => [s, STATUS[s].label])];

export function StatusFilter({ value, onChange }: Props) {
  return (
    <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-500">Filters:</span>
      {OPTIONS.map(([status, label]) => (
        <button
          key={label}
          type="button"
          aria-pressed={value === status}
          onClick={() => onChange(status)}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
            value === status
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
