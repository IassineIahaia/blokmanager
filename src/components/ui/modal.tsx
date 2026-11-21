"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

/** Diálogo modal simples e acessível (Esc fecha, foco no conteúdo, bloqueia scroll). */
export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in" onClick={onClose} />
      <div
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col rounded-t-xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 sm:rounded-xl",
          size === "sm" ? "sm:max-w-md" : size === "md" ? "sm:max-w-lg" : "sm:max-w-2xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
          <div>
            <h2 id="modal-title" className="text-title-md font-semibold text-on-surface">{title}</h2>
            {description && <p className="mt-0.5 text-body-sm text-on-surface-variant">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container-low" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-outline-variant px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
