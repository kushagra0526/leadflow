"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { CloseButton, Modal } from "@/components/Modal";
import { createLead } from "@/lib/api";

type Props = { onClose: () => void; onCreated: () => void };

const input =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export function AddLeadModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // runs after the dialog opens (child effects first), which would otherwise focus the close button
  useEffect(() => nameRef.current?.focus(), []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createLead({ name, company, phone });
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <Modal labelledBy="add-lead-title" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="add-lead-title" className="text-lg font-bold">
            Add New Lead
          </h2>
          <CloseButton onClick={onClose} />
        </header>

        <div className="space-y-4 px-6 py-5">
          <label className="block text-sm font-medium text-slate-700">
            Full Name <span className="text-red-600" aria-hidden>*</span>
            <input
              ref={nameRef}
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Doe"
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Company <span className="font-normal text-slate-500">(Optional)</span>
            <input
              maxLength={120}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Stark Industries"
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone <span className="font-normal text-slate-500">(Optional)</span>
            <input
              type="tel"
              pattern="\+?[0-9 \(\)\-]{7,20}"
              title="7–20 digits; spaces, +, - and ( ) are allowed"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +91 98765 43210"
              className={input}
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Lead"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
