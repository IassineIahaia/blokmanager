import { formatMT } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CurrencyValueProps {
  value: number;
  className?: string;
}

export function CurrencyValue({ value, className }: CurrencyValueProps) {
  return <span className={cn("tabular-nums", className)}>{formatMT(value)}</span>;
}