"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-outline-variant bg-white px-4 text-body-sm font-medium text-on-surface hover:bg-surface-container-low"
    >
      <Printer className="h-4 w-4" /> Imprimir / PDF
    </button>
  );
}
