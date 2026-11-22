"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/5 bg-white px-4 text-sm font-medium text-black hover:bg-black/5"
    >
      <Printer className="h-4 w-4" /> Imprimir / PDF
    </button>
  );
}
