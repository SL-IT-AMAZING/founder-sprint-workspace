"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="p-0 backdrop:bg-black/40"
      style={{ maxWidth: 560, width: "100%", margin: "auto", border: "1px solid var(--color-card-border)", borderRadius: 9 }}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">{title}</h2>
          <button
            onClick={onClose}
            className="text-lg"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-foreground-muted)" }}
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
