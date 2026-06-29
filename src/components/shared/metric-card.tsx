import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
value: React.ReactNode;
  valueClassName?: string;
  badge?: string;
  badgeClassName?: string;
  footer?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  valueClassName,
  badge,
  badgeClassName,
  footer,
}: MetricCardProps) {
  return (
    <Card className="border-outline-variant rounded-md shadow-none">
      <CardContent className="px-6 py-5">
        <p className="text-label-caps text-on-surface-variant uppercase mb-2">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-semibold tracking-tight", valueClassName)}>
            {value}
          </span>
          {badge && (
            <span className={cn("text-sm font-medium", badgeClassName)}>
              {badge}
            </span>
          )}
        </div>
        {footer && <div className="mt-3 text-sm text-on-surface-variant">{footer}</div>}
      </CardContent>
    </Card>
  );
}