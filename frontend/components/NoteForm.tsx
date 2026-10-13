"use client";

import { useState, type FormEvent } from "react";

type Props = { onSubmit: (data: { body: string; follow_up_at?: string }) => Promise<void> };

const input =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export function NoteForm({ onSubmit }: Props) {
  const [body, setBody] = useState("");
  const [withFollowUp, setWithFollowUp] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // The inputs hold the user's local wall-clock time; toISOString sends that moment in UTC.
      const follow_up_at = withFollowUp ? new Date(`${date}T${time}`).toISOString() : undefined;
      await onSubmit({ body, follow_up_at });
      setBody("");
      setWithFollowUp(false);
      setDate("");
      setTime("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-6 py-4">
      <label htmlFor="note-body" className="sr-only">
        New note
      </label>
      <textarea
        id="note-body"
        required
        maxLength={2000}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Log a new discussion…"
        className={`${input} w-full resize-y`}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={withFollowUp}
            onChange={(e) => setWithFollowUp(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-blue-600"
          />
          Set follow-up
        </label>
        <input
          type="date"
          aria-label="Follow-up date"
          required={withFollowUp}
          disabled={!withFollowUp}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${input} disabled:cursor-not-allowed disabled:opacity-50`}
        />
        <input
          type="time"
          aria-label="Follow-up time"
          required={withFollowUp}
          disabled={!withFollowUp}
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={`${input} disabled:cursor-not-allowed disabled:opacity-50`}
        />
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="ml-auto rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Note"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
