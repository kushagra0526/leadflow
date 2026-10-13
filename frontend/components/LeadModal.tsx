"use client";

import { useEffect, useState } from "react";

import { FollowUpChip } from "@/components/FollowUpChip";
import { CloseButton, Modal } from "@/components/Modal";
import { NoteForm } from "@/components/NoteForm";
import { NoteTimeline } from "@/components/NoteTimeline";
import { addNote, getLead, updateLead } from "@/lib/api";
import { STATUS, STATUSES } from "@/lib/status";
import type { LeadDetail, LeadStatus } from "@/lib/types";

// onChanged lets the list behind the popup refresh after every save
type Props = { leadId: number; onClose: () => void; onChanged: () => void };

export function LeadModal({ leadId, onClose, onChanged }: Props) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getLead(leadId).then(
      (data) => {
        if (ignore) return;
        setLead(data);
        setError(null);
      },
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

  // On failure `lead` is unchanged, so the status dropdown snaps back to the saved value.
  async function handleUpdate(data: { status?: LeadStatus; next_follow_up_at?: null }) {
    setSaveError(null);
    try {
      setLead(await updateLead(leadId, data));
      onChanged();
    } catch (e) {
      setSaveError((e as Error).message);
    }
  }

  return (
    <Modal labelledBy="lead-modal-title" onClose={onClose} width="max-w-2xl">
      <div className="flex max-h-[85vh] flex-col">
        <header className="flex items-start gap-2 border-b border-slate-200 px-6 py-4">
          {/* on narrow screens the status dropdown wraps under the name instead of squeezing it */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1 basis-48">
              <h2 id="lead-modal-title" className="break-words text-xl font-bold">
                {lead?.name ?? "Lead"}
                {lead?.company && <span className="font-normal text-slate-500"> ({lead.company})</span>}
              </h2>
              {lead?.phone && (
                <p className="mt-1 whitespace-nowrap text-sm text-slate-600">
                  <span aria-hidden>📞</span>{" "}
                  <a href={`tel:${lead.phone}`} className="hover:underline">
                    {lead.phone}
                  </a>
                </p>
              )}
            </div>
            {lead && (
              <select
                aria-label="Lead status"
                value={lead.status}
                onChange={(e) => handleUpdate({ status: e.target.value as LeadStatus })}
                className={`cursor-pointer rounded-full border-0 py-1 pl-3 pr-8 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS[lead.status].badge}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS[s].label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <CloseButton onClick={onClose} />
        </header>

        {saveError && (
          <p role="alert" className="border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-red-700">
            Couldn&apos;t save: {saveError}
          </p>
        )}

        {lead?.next_follow_up_at && (
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-2.5">
            <FollowUpChip iso={lead.next_follow_up_at} />
            <button
              type="button"
              onClick={() => handleUpdate({ next_follow_up_at: null })}
              className="shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              ✓ Mark done
            </button>
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
