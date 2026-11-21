import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  type OrderPaymentStatus,
  type OrderStatus,
} from "@/lib/format";

const statusClass: Record<OrderStatus, string> = {
  pendente: "bg-secondary-container/60 text-on-secondary-container",
  confirmado: "bg-blue-100 text-blue-800",
  em_entrega: "bg-violet-100 text-violet-800",
  entregue: "bg-primary-container/40 text-on-primary-container",
  cancelado: "bg-error-container text-on-error-container",
};

const paymentClass: Record<OrderPaymentStatus, string> = {
  por_pagar: "bg-surface-container-high text-on-surface-variant",
  em_verificacao: "bg-secondary-container text-on-secondary-container",
  pago: "bg-primary-container/40 text-on-primary-container",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-sm border-transparent font-medium", statusClass[status])}>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

export function PaymentBadge({ status }: { status: OrderPaymentStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-sm border-transparent font-medium", paymentClass[status])}>
      {PAYMENT_STATUS_LABEL[status]}
    </Badge>
  );
}
