import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatMT(value: number): string {
  const formatted = new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `MT ${formatted}`;
}

/**
 * Formats a number with thousands separators, no currency prefix.
 * Example: formatNumber(5420) -> "5.420"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-PT").format(value);
}