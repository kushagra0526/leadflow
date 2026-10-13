import { formatDateTime, timeAgo } from "@/lib/time";
import type { Note } from "@/lib/types";

export function NoteTimeline({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No conversations logged yet. Add the first note below.</p>;
  }

  return (
    <ol className="ml-1.5 space-y-6 border-l-2 border-slate-200 pl-6">
      {notes.map((note, i) => (
        <li key={note.id} className="relative">
          <span
            aria-hidden
            className={`absolute -left-[33px] top-0.5 h-4 w-4 rounded-full border-4 border-slate-50 ${i === 0 ? "bg-blue-600" : "bg-slate-300"}`}
          />
          <p className="text-xs text-slate-500">
            <time dateTime={note.created_at}>{formatDateTime(note.created_at)}</time> ({timeAgo(note.created_at)})
          </p>
          <div className="mt-1.5 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
            <p className="whitespace-pre-wrap break-words text-slate-800">{note.body}</p>
            {note.follow_up_at && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                <span aria-hidden>📅</span>
                Follow-up set for: {formatDateTime(note.follow_up_at)}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
