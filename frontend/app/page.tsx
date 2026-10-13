"use client";

import { useEffect, useState } from "react";

import { LeadList } from "@/components/LeadList";
import { listLeads } from "@/lib/api";
import type { Lead } from "@/lib/types";

export default function Home() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false; // drop responses that arrive after a newer request started
    listLeads({}).then(
      (data) => {
        if (ignore) return;
        setLeads(data);
        setError(null);
      },
      (e: Error) => {
        if (!ignore) setError(e.message);
      },
    );
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-600">
            <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8M15 7h6v6" />
            </svg>
            LeadFlow
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {error && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>Couldn&apos;t load leads: {error}</span>
            <button type="button" onClick={reload} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {leads === null ? (
          !error && <p className="text-slate-500">Loading leads…</p>
        ) : leads.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No leads yet.
          </p>
        ) : (
          <LeadList leads={leads} onOpen={setSelectedId} />
        )}
      </main>
    </>
  );
}
