"use client";

import { useEffect, useState } from "react";

import { FollowUpChip } from "@/components/FollowUpChip";
import { CloseButton, Modal } from "@/components/Modal";
import { NoteForm } from "@/components/NoteForm";
import { NoteTimeline } from "@/components/NoteTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { addNote, getLead } from "@/lib/api";
import type { LeadDetail } from "@/lib/types";

// onChanged lets the list behind the popup refresh after every save
type Props = { leadId: number; onClose: () => void; onChanged: () => void };

export function LeadModal({ leadId, onClose, onChanged }: Props) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    getLead(leadId).then(
      (data) => !ignore && setLead(data),
      (e: Error) => !ignore && setError(e.message),
    );
    return () => {
      ignore = true;
    };
  }, [leadId, reloadKey]);

  async function handleAddNote(data: { body: string; follow_up_at?: string }) {
    await addNote(leadId, data);
    setReloadKey((k) => k + 1);
    onChanged();
  }

  return (
    <Modal labelledBy="lead-modal-title" onClose={onClose} width="max-w-2xl">
      <div className="flex max-h-[85vh] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <h2 id="lead-modal-title" className="truncate text-xl font-bold">
              {lead?.name ?? "Lead"}
              {lead?.company && <span className="font-normal text-slate-500"> ({lead.company})</span>}
            </h2>
            {lead?.phone && (
              <p className="mt-1 text-sm text-slate-600">
                <span aria-hidden>📞</span>{" "}
                <a href={`tel:${lead.phone}`} className="hover:underline">
                  {lead.phone}
                </a>
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {lead && <StatusBadge status={lead.status} />}
            <CloseButton onClick={onClose} />
          </div>
        </header>

        {lead?.next_follow_up_at && (
          <div className="border-b border-slate-200 px-6 py-2.5">
            <FollowUpChip iso={lead.next_follow_up_at} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-5">
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              Couldn&apos;t load this lead: {error}
            </p>
          ) : lead ? (
            <NoteTimeline notes={lead.notes} />
          ) : (
            <p className="text-sm text-slate-500">Loading…</p>
          )}
        </div>

        {lead && <NoteForm onSubmit={handleAddNote} />}
      </div>
    </Modal>
  );
}
