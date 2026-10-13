import { STATUS } from "@/lib/status";
import type { LeadStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: LeadStatus }) {
  const { label, badge } = STATUS[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${badge}`}
    >
      {label}
    </span>
  );
}
