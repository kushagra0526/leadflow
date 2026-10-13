import { LeadCard } from "@/components/LeadCard";
import { groupLeads } from "@/lib/time";
import type { Lead } from "@/lib/types";

type Props = { leads: Lead[]; onOpen: (id: number) => void };

export function LeadList({ leads, onOpen }: Props) {
  const { overdue, today, rest } = groupLeads(leads);
  return (
    <div className="space-y-8">
      <Section title="Overdue" icon="⚠" color="text-red-700" leads={overdue} onOpen={onOpen} />
      <Section title="Today's follow-ups" icon="📌" color="text-slate-600" leads={today} onOpen={onOpen} />
      <Section title="All leads" color="text-slate-600" leads={rest} onOpen={onOpen} />
    </div>
  );
}

function Section({ title, icon, color, leads, onOpen }: Props & { title: string; icon?: string; color: string }) {
  if (leads.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className={`mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${color}`}>
        {icon && <span aria-hidden>{icon}</span>}
        {title}
        <span className="font-medium text-slate-500">({leads.length})</span>
      </h2>
      <ul className="space-y-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  );
}
