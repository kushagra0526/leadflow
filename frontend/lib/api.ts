import type { Lead, LeadDetail, LeadStatus, Note } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ValidationError = { loc?: (string | number)[]; msg: string };

// FastAPI sends {detail: "..."} for 404s and {detail: [{loc, msg}, ...]} for 422s.
function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: string | ValidationError[] } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => `${e.loc?.at(-1) ?? "input"}: ${e.msg}`).join("; ");
  return `Request failed (${status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorMessage(body, res.status));
  return body as T;
}

export function listLeads(filters: { status?: LeadStatus | null; q?: string }) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  return request<Lead[]>(`/api/leads?${params}`);
}

export const getLead = (id: number) => request<LeadDetail>(`/api/leads/${id}`);

export const createLead = (data: { name: string; company?: string; phone?: string }) =>
  request<Lead>("/api/leads", { method: "POST", body: JSON.stringify(data) });

export const updateLead = (id: number, data: { status?: LeadStatus; next_follow_up_at?: null }) =>
  request<LeadDetail>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const addNote = (id: number, data: { body: string; follow_up_at?: string }) =>
  request<Note>(`/api/leads/${id}/notes`, { method: "POST", body: JSON.stringify(data) });
