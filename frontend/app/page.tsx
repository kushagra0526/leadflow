"use client";

import { useEffect, useState } from "react";

import { AddLeadModal } from "@/components/AddLeadModal";
import { LeadList } from "@/components/LeadList";
import { LeadModal } from "@/components/LeadModal";
import { StatusFilter } from "@/components/StatusFilter";
import { listLeads } from "@/lib/api";
import type { Lead, LeadStatus } from "@/lib/types";

export default function Home() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<LeadStatus | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(""); // `query` once the user stops typing

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let ignore = false; // drop responses that arrive after a newer request started
    listLeads({ status, q: search }).then(
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
  }, [status, search, reloadKey]);

  // A tab left open (e.g. overnight) re-sorts today's/overdue follow-ups when the user comes back to it.
  useEffect(() => {
    const onFocus = () => setReloadKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const reload = () => setReloadKey((k) => k + 1);
  const clearFilters = () => {
    setStatus(null);
    setQuery("");
  };
  const filtered = status !== null || search.trim() !== "";

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
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            + Add New Lead
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <StatusFilter value={status} onChange={setStatus} />
          <input
            type="search"
            aria-label="Search leads by name"
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:ml-auto sm:w-60"
          />
        </div>

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
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            {filtered ? (
              <>
                No leads match these filters.{" "}
                <button type="button" onClick={clearFilters} className="font-semibold text-blue-600 hover:underline">
                  Clear filters
                </button>
              </>
            ) : (
              "No leads yet."
            )}
          </div>
        ) : (
          <LeadList leads={leads} onOpen={setSelectedId} />
        )}
      </main>

      {selectedId !== null && <LeadModal leadId={selectedId} onClose={() => setSelectedId(null)} onChanged={reload} />}
      {adding && <AddLeadModal onClose={() => setAdding(false)} onCreated={reload} />}
    </>
  );
}
