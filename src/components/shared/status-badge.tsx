import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pendente: {
    label: "Pendente",
    className: "bg-secondary-container text-on-secondary-container border-transparent",
  },
  confirmado: {
    label: "Confirmado",
    className: "bg-blue-100 text-blue-700 border-transparent",
  },
  entregue: {
    label: "Entregue",
    className: "bg-primary-container text-on-primary-container border-transparent",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-error-container text-on-error-container border-transparent",
  },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn("rounded-sm font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}