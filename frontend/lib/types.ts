export type LeadStatus = "new" | "contacted" | "qualified" | "proposal_sent" | "won" | "lost";

export type Note = {
  id: number;
  body: string;
  follow_up_at: string | null;
  created_at: string;
};

export type Lead = {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  next_follow_up_at: string | null;
  created_at: string;
  last_note: Note | null;
};

export type LeadDetail = Lead & { notes: Note[] };
