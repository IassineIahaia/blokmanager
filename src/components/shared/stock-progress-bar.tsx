import { cn } from "@/lib/utils";

interface StockProgressBarProps {
  available: number;
  reserved: number;
  total: number;
}

export function StockProgressBar({ available, reserved, total }: StockProgressBarProps) {
  const availablePct = total > 0 ? (available / total) * 100 : 0;
  const reservedPct = total > 0 ? (reserved / total) * 100 : 0;

  return (
    <div className="h-2 w-full rounded-full bg-surface-container-highest overflow-hidden flex">
      <div className="bg-primary h-full" style={{ width: `${availablePct}%` }} />
      <div className="bg-secondary h-full" style={{ width: `${reservedPct}%` }} />
    </div>
  );
}

interface MaterialLevelBarProps {
  current: number;
  minimum: number;
}

export function MaterialLevelBar({ current, minimum }: MaterialLevelBarProps) {
  const ratio = minimum > 0 ? current / minimum : 1;
  const pct = Math.min(ratio * 100, 100);
  const isBelowMinimum = current < minimum;

  return (
    <div className="space-y-1">
      <div className="h-2 w-full rounded-full bg-surface-container-highest overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            isBelowMinimum ? "bg-error" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isBelowMinimum && (
        <p className="text-body-sm text-error font-medium">
          Reabastecimento necessário
        </p>
      )}
    </div>
  );
}