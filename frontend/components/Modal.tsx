"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = { labelledBy: string; onClose: () => void; children: ReactNode; width?: string };

// Native <dialog>: the browser handles the focus trap, Esc to close and the backdrop.
// Mounting opens it; the parent closes it by unmounting in onClose.
export function Modal({ labelledBy, onClose, children, width = "max-w-lg" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // a click outside the content lands on the backdrop
      className={`m-auto w-[calc(100%-2rem)] ${width} overflow-hidden rounded-xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm`}
    >
      {children}
    </dialog>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}
