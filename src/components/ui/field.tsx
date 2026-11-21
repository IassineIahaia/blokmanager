import * as React from "react";
import { cn } from "@/lib/utils";

const controlClass =
  "w-full rounded-md border border-outline-variant bg-white px-3 text-body-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60 aria-[invalid=true]:border-error";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Rótulo + controlo + mensagem de erro/ajuda. */
export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-on-surface">
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[12px] font-medium text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlClass, "h-11", className)} {...props} />;
  },
);

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(controlClass, "resize-none py-2.5", className)} {...props} />;
  },
);

export const SelectInput = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectInput({ className, ...props }, ref) {
    return <select ref={ref} className={cn(controlClass, "h-11 pr-8", className)} {...props} />;
  },
);

/** Caixa de aviso (erro, sucesso ou informação). */
export function Alert({
  tone = "error",
  children,
  className,
  onClose,
}: {
  tone?: "error" | "success" | "info" | "warning";
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}) {
  const tones = {
    error: "border-error/30 bg-error-container text-on-error-container",
    success: "border-primary/30 bg-primary/10 text-on-primary-container",
    info: "border-outline-variant bg-surface-container-low text-on-surface",
    warning: "border-secondary/40 bg-secondary-container/30 text-on-secondary-container",
  };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-body-sm", tones[tone], className)}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Fechar aviso">
          ✕
        </button>
      )}
    </div>
  );
}
