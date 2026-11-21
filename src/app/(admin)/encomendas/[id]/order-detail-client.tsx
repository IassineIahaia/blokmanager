"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Printer,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { AdminHeader } from "@/components/shared/admin-header";
import { PaymentBadge, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Alert, Field, SelectInput, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { apiFetch, errorMessage } from "@/lib/fetcher";
import {
  ORDER_STATUS_LABEL,
  ORDER_TRANSITIONS,
  PAYMENT_ITEM_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  formatDate,
  formatMT,
  formatNumber,
  formatPhone,
  orderCode,
  whatsappLink,
  type OrderPaymentStatus,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/format";
import { cn } from "@/lib/utils";

interface OrderDetail {
  id: string;
  number: number;
  accessToken: string;
  customerName: string;
  customerPhone: string | null;
  zoneName: string | null;
  deliveryFee: number;
  address: string | null;
  reference: string | null;
  notes: string | null;
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: PaymentMethod | null;
  deliveryDate: string | null;
  createdAt: string;
  driver: { id: string; name: string } | null;
  items: { id: string; productName: string; unitPrice: number; quantity: number; lineTotal: number }[];
  payments: {
    id: string;
    method: PaymentMethod;
    amount: number;
    reference: string | null;
    payerPhone: string | null;
    status: PaymentStatus;
    note: string | null;
    createdAt: string;
  }[];
  events: { id: string; message: string; actor: string; createdAt: string }[];
}

const ACTION_STYLE: Record<OrderStatus, { label: string; className: string; icon: typeof Check }> = {
  pendente: { label: "Pendente", className: "", icon: Check },
  confirmado: { label: "Confirmar encomenda", className: "bg-primary text-on-primary hover:bg-primary/90", icon: CheckCircle2 },
  em_entrega: { label: "Saiu para entrega", className: "bg-violet-600 text-white hover:bg-violet-700", icon: Truck },
  entregue: { label: "Marcar como entregue", className: "bg-primary text-on-primary hover:bg-primary/90", icon: CheckCircle2 },
  cancelado: { label: "Cancelar", className: "border border-error/40 bg-white text-error hover:bg-error-container", icon: XCircle },
};

function customerMessage(o: OrderDetail, link: string) {
  const code = orderCode(o.number);
  switch (o.status) {
    case "pendente":
      return o.paymentStatus === "por_pagar"
        ? `Olá ${o.customerName}! Recebemos o seu pedido ${code} (${formatMT(o.total)}). Pode pagar e acompanhar aqui: ${link}`
        : `Olá ${o.customerName}! Estamos a verificar o pagamento do pedido ${code}. Acompanhe aqui: ${link}`;
    case "confirmado":
      return `Olá ${o.customerName}! O seu pedido ${code} está confirmado${o.deliveryDate ? ` e a entrega está prevista para ${formatDate(o.deliveryDate)}` : ""}. Detalhes: ${link}`;
    case "em_entrega":
      return `Olá ${o.customerName}! O seu pedido ${code} saiu para entrega${o.driver ? ` com o motorista ${o.driver.name}` : ""}. Por favor esteja disponível para a descarga.`;
    case "entregue":
      return `Olá ${o.customerName}! O pedido ${code} foi entregue. Obrigado pela preferência!`;
    case "cancelado":
      return `Olá ${o.customerName}. O pedido ${code} foi cancelado. Se tiver dúvidas, responda a esta mensagem.`;
  }
}

export function OrderDetailClient({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [delivery, setDelivery] = useState({ driverId: "", deliveryDate: "" });
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    return apiFetch<{ order: OrderDetail; drivers: { id: string; name: string }[] }>(`/api/orders/${id}`)
      .then(({ order, drivers }) => {
        setOrder(order);
        setDrivers(drivers);
        setDelivery({
          driverId: order.driver?.id ?? "",
          deliveryDate: order.deliveryDate ? order.deliveryDate.slice(0, 10) : "",
        });
      })
      .catch((err) => {
        if (err?.status === 404) setNotFound(true);
        else setError(errorMessage(err));
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      await load();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(null);
    }
  }

  if (notFound) {
    return (
      <div className="flex-1">
        <AdminHeader title="Encomenda não encontrada" back={{ href: "/encomendas", label: "Encomendas" }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1">
        <AdminHeader title="Encomenda" back={{ href: "/encomendas", label: "Encomendas" }} />
        {error ? <Alert className="m-8">{error}</Alert> : (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        )}
      </div>
    );
  }

  const code = orderCode(order.number);
  const paid = order.payments.filter((p) => p.status === "confirmado").reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, order.total - paid);
  const nextStatuses = ORDER_TRANSITIONS[order.status];
  const publicLink = typeof window !== "undefined" ? `${window.location.origin}/pedido/${order.accessToken}` : "";
  const pendingPayments = order.payments.filter((p) => p.status === "pendente");
  const deliveryChanged =
    delivery.driverId !== (order.driver?.id ?? "") ||
    delivery.deliveryDate !== (order.deliveryDate ? order.deliveryDate.slice(0, 10) : "");

  return (
    <div className="flex-1">
      <AdminHeader
        title={code}
        subtitle={`Criada em ${formatDate(order.createdAt, true)}`}
        back={{ href: "/encomendas", label: "Encomendas" }}
        actions={
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={order.status} />
            {order.status !== "cancelado" && <PaymentBadge status={order.paymentStatus} />}
          </div>
        }
      />

      <div className="space-y-6 p-4 md:p-8">
        {error && <Alert onClose={() => setError(null)}>{error}</Alert>}

        {/* Barra de acções */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest p-3 print:hidden">
          {nextStatuses.map((s) => {
            const a = ACTION_STYLE[s];
            const needsPaymentWarning = s === "confirmado" && order.paymentStatus !== "pago";
            return (
              <Button
                key={s}
                disabled={!!busy}
                onClick={() => {
                  setStatusNote("");
                  if (s === "cancelado" || s === "entregue" || needsPaymentWarning) setConfirmStatus(s);
                  else run(s, () => apiFetch(`/api/orders/${id}`, { method: "PATCH", body: { status: s } }));
                }}
                className={cn("h-10", a.className)}
              >
                {busy === s ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <a.icon className="mr-1.5 h-4 w-4" />}
                {a.label}
              </Button>
            );
          })}
          {nextStatuses.length === 0 && (
            <span className="px-2 text-body-sm text-on-surface-variant">
              Encomenda {ORDER_STATUS_LABEL[order.status].toLowerCase()} — sem mais acções.
            </span>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            {order.customerPhone && (
              <a
                href={whatsappLink(order.customerPhone, customerMessage(order, publicLink))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#25D366] px-3 text-body-sm font-medium text-white hover:bg-[#1fb957]"
              >
                <MessageCircle className="h-4 w-4" /> Avisar cliente
              </a>
            )}
            <Button
              variant="outline"
              className="h-10"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(publicLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  setError("Não foi possível copiar. Link: " + publicLink);
                }
              }}
            >
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              {copied ? "Copiado" : "Link do cliente"}
            </Button>
            <Button variant="outline" className="h-10" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Pagamentos por verificar em destaque */}
            {pendingPayments.length > 0 && order.status !== "cancelado" && (
              <section className="rounded-md border-2 border-secondary bg-secondary-container/20 p-5">
                <h2 className="font-semibold text-on-surface">Pagamento a verificar</h2>
                <p className="mb-4 text-body-sm text-on-surface-variant">
                  Confirme no extracto M-Pesa / e-Mola se a transacção entrou antes de aprovar.
                </p>
                <ul className="space-y-3">
                  {pendingPayments.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-md border border-outline-variant bg-white p-3">
                      <div className="flex-1 text-body-sm">
                        <p className="font-semibold text-on-surface">
                          {formatMT(p.amount)} · {PAYMENT_METHOD_LABEL[p.method]}
                        </p>
                        <p className="text-on-surface-variant">
                          Ref. <b className="font-mono text-on-surface">{p.reference ?? "—"}</b>
                          {p.payerPhone && ` · de ${formatPhone(p.payerPhone)}`} · {formatDate(p.createdAt, true)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={!!busy}
                        onClick={() => run(`pay-${p.id}`, () => apiFetch(`/api/payments/${p.id}`, { method: "PATCH", body: { action: "confirmar" } }))}
                        className="bg-primary text-on-primary hover:bg-primary/90"
                      >
                        {busy === `pay-${p.id}` ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                        Confirmar
                      </Button>
                      <Button size="sm" variant="outline" disabled={!!busy} onClick={() => { setRejectNote(""); setRejecting(p.id); }} className="text-error">
                        <X className="mr-1 h-4 w-4" /> Rejeitar
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Itens */}
            <section className="overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest">
              <h2 className="border-b border-outline-variant px-5 py-4 font-semibold text-on-surface">Itens</h2>
              <table className="w-full text-body-sm">
                <thead className="bg-surface-container-low text-left text-label-caps uppercase text-on-surface-variant">
                  <tr>
                    <th className="px-5 py-2">Produto</th>
                    <th className="px-5 py-2 text-right">Qtd.</th>
                    <th className="px-5 py-2 text-right">Preço</th>
                    <th className="px-5 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td className="px-5 py-3 text-on-surface">{i.productName}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{formatNumber(i.quantity)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{formatMT(i.unitPrice)}</td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums">{formatMT(i.lineTotal)}</td>
                    </tr>
                  ))}
                  {order.items.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-3 text-on-surface-variant">Encomenda antiga, sem detalhe de itens.</td></tr>
                  )}
                </tbody>
                <tfoot className="border-t border-outline-variant">
                  <tr><td colSpan={3} className="px-5 pt-3 text-right text-on-surface-variant">Subtotal</td><td className="px-5 pt-3 text-right tabular-nums">{formatMT(order.subtotal)}</td></tr>
                  <tr><td colSpan={3} className="px-5 pt-1 text-right text-on-surface-variant">Entrega{order.zoneName && ` (${order.zoneName})`}</td><td className="px-5 pt-1 text-right tabular-nums">{formatMT(order.deliveryFee)}</td></tr>
                  <tr className="font-bold"><td colSpan={3} className="px-5 py-3 text-right">Total</td><td className="px-5 py-3 text-right text-[18px] text-primary tabular-nums">{formatMT(order.total)}</td></tr>
                </tfoot>
              </table>
            </section>

            {/* Pagamentos */}
            <section className="rounded-md border border-outline-variant bg-surface-container-lowest">
              <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
                <div>
                  <h2 className="font-semibold text-on-surface">Pagamentos</h2>
                  <p className="text-body-sm text-on-surface-variant">
                    Pago {formatMT(paid)} de {formatMT(order.total)}
                    {remaining > 0 && order.status !== "cancelado" && <> · <b className="text-on-surface">falta {formatMT(remaining)}</b></>}
                  </p>
                </div>
                {order.status !== "cancelado" && remaining > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setShowPayment(true)} className="print:hidden">
                    <Plus className="mr-1 h-4 w-4" /> Registar pagamento
                  </Button>
                )}
              </div>
              {order.payments.length === 0 ? (
                <p className="px-5 py-4 text-body-sm text-on-surface-variant">
                  Ainda sem pagamentos.{order.paymentMethod && ` O cliente escolheu ${PAYMENT_METHOD_LABEL[order.paymentMethod]}.`}
                </p>
              ) : (
                <ul className="divide-y divide-outline-variant">
                  {order.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-body-sm">
                      <div>
                        <p className="text-on-surface">
                          {PAYMENT_METHOD_LABEL[p.method]}
                          {p.reference && <span className="font-mono text-on-surface-variant"> · {p.reference}</span>}
                        </p>
                        <p className="text-[12px] text-on-surface-variant">
                          {formatDate(p.createdAt, true)}
                          {p.note && ` · ${p.note}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium tabular-nums">{formatMT(p.amount)}</p>
                        <p className={cn("text-[12px]", p.status === "confirmado" ? "text-primary" : p.status === "rejeitado" ? "text-error" : "text-on-secondary-container")}>
                          {PAYMENT_ITEM_STATUS_LABEL[p.status]}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="space-y-3 rounded-md border border-outline-variant bg-surface-container-lowest p-5 text-body-sm">
              <h2 className="font-semibold text-on-surface">Cliente</h2>
              <p className="font-medium text-on-surface">{order.customerName}</p>
              {order.customerPhone && (
                <a href={`tel:+${order.customerPhone}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="h-4 w-4" /> {formatPhone(order.customerPhone)}
                </a>
              )}
              {(order.address || order.zoneName) && (
                <p className="flex items-start gap-2 text-on-surface-variant">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {[order.address, order.zoneName].filter(Boolean).join(", ")}
                    {order.reference && <span className="block">Ref.: {order.reference}</span>}
                  </span>
                </p>
              )}
              {order.notes && <p className="rounded-md bg-surface-container-low p-3 text-on-surface-variant">“{order.notes}”</p>}
            </section>

            {order.status !== "cancelado" && order.status !== "entregue" && (
              <section className="space-y-4 rounded-md border border-outline-variant bg-surface-container-lowest p-5 print:hidden">
                <h2 className="font-semibold text-on-surface">Agendar entrega</h2>
                <Field label="Motorista" htmlFor="driver">
                  <SelectInput id="driver" value={delivery.driverId} onChange={(e) => setDelivery({ ...delivery, driverId: e.target.value })}>
                    <option value="">Sem motorista</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Data prevista" htmlFor="deliveryDate">
                  <TextInput id="deliveryDate" type="date" value={delivery.deliveryDate} onChange={(e) => setDelivery({ ...delivery, deliveryDate: e.target.value })} />
                </Field>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={!deliveryChanged || !!busy}
                  onClick={() =>
                    run("delivery", () =>
                      apiFetch(`/api/orders/${id}`, {
                        method: "PATCH",
                        body: { driverId: delivery.driverId || null, deliveryDate: delivery.deliveryDate || null },
                      }),
                    )
                  }
                >
                  {busy === "delivery" && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Guardar entrega
                </Button>
              </section>
            )}
            {(order.status === "entregue" || order.status === "cancelado") && order.driver && (
              <section className="rounded-md border border-outline-variant bg-surface-container-lowest p-5 text-body-sm">
                <h2 className="mb-2 font-semibold text-on-surface">Entrega</h2>
                <p className="text-on-surface-variant">Motorista: {order.driver.name}</p>
              </section>
            )}

            <section className="rounded-md border border-outline-variant bg-surface-container-lowest p-5 text-body-sm">
              <h2 className="mb-3 font-semibold text-on-surface">Histórico</h2>
              <ol className="space-y-3 border-l border-outline-variant pl-4">
                {order.events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className={cn("absolute -left-[21px] top-1.5 h-2 w-2 rounded-full", e.actor === "cliente" ? "bg-secondary" : "bg-primary")} />
                    <p className="text-on-surface">{e.message}</p>
                    <p className="text-[12px] text-on-surface-variant">
                      {formatDate(e.createdAt, true)} · {e.actor}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </div>

      {/* Confirmação de mudança de estado */}
      <Modal
        open={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        size="sm"
        title={confirmStatus ? ACTION_STYLE[confirmStatus].label : ""}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmStatus(null)}>Voltar</Button>
            <Button
              disabled={!!busy}
              className={confirmStatus ? ACTION_STYLE[confirmStatus].className : ""}
              onClick={async () => {
                const s = confirmStatus!;
                const ok = await run(s, () => apiFetch(`/api/orders/${id}`, { method: "PATCH", body: { status: s, note: statusNote || null } }));
                if (ok) setConfirmStatus(null);
              }}
            >
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Confirmar
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-body-sm text-on-surface">
          {confirmStatus === "cancelado" && (
            <p>
              A reserva dos blocos é libertada e volta ao stock disponível.
              {paid > 0 && <b className="block pt-2 text-error">Atenção: já foram pagos {formatMT(paid)}. Combine a devolução com o cliente.</b>}
            </p>
          )}
          {confirmStatus === "entregue" && (
            <p>
              Os blocos saem definitivamente do stock.
              {remaining > 0 && <b className="block pt-2 text-error">Ainda falta receber {formatMT(remaining)}. Registe o pagamento se o cliente pagou na entrega.</b>}
            </p>
          )}
          {confirmStatus === "confirmado" && (
            <p>
              O pagamento ainda não está confirmado ({formatMT(paid)} de {formatMT(order.total)}). Confirme apenas se combinou pagamento na entrega
              ou outra condição com o cliente.
            </p>
          )}
          <Field label="Nota (opcional)" htmlFor="statusNote">
            <TextInput id="statusNote" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Ex.: cliente pediu para adiar" />
          </Field>
        </div>
      </Modal>

      {/* Rejeitar pagamento */}
      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        size="sm"
        title="Rejeitar pagamento"
        description="O cliente verá que o pagamento foi rejeitado e poderá enviar outra referência."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejecting(null)}>Voltar</Button>
            <Button
              disabled={!!busy}
              className="bg-error text-on-error hover:bg-error/90"
              onClick={async () => {
                const pid = rejecting!;
                const ok = await run(`pay-${pid}`, () =>
                  apiFetch(`/api/payments/${pid}`, { method: "PATCH", body: { action: "rejeitar", note: rejectNote || null } }),
                );
                if (ok) setRejecting(null);
              }}
            >
              Rejeitar
            </Button>
          </>
        }
      >
        <Field label="Motivo" htmlFor="rejectNote" hint="Ex.: referência não encontrada no extracto">
          <TextInput id="rejectNote" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
        </Field>
      </Modal>

      {showPayment && (
      <AdminPaymentModal
        open
        onClose={() => setShowPayment(false)}
        remaining={remaining}
        defaultMethod={order.paymentMethod ?? "numerario"}
        onSave={async (body) => {
          const ok = await run("payment", () => apiFetch(`/api/orders/${id}/payments`, { method: "POST", body }));
          if (ok) setShowPayment(false);
        }}
        saving={busy === "payment"}
      />
      )}
    </div>
  );
}

function AdminPaymentModal({
  open,
  onClose,
  remaining,
  defaultMethod,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  remaining: number;
  defaultMethod: PaymentMethod;
  onSave: (body: { method: PaymentMethod; amount: number; reference: string | null; note: string | null }) => void;
  saving: boolean;
}) {
  const [method, setMethod] = useState<PaymentMethod>(defaultMethod);
  const [amount, setAmount] = useState(String(remaining));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Registar pagamento recebido"
      description="Fica confirmado de imediato. Se cobrir o total, a encomenda é confirmada automaticamente."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={saving || !(Number(amount) > 0)}
            onClick={() => onSave({ method, amount: Math.round(Number(amount)), reference: reference || null, note: note || null })}
            className="bg-primary text-on-primary hover:bg-primary/90"
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Registar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Método" htmlFor="pm-method">
          <SelectInput id="pm-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Valor (MT)" htmlFor="pm-amount" hint={`Em falta: ${formatMT(remaining)}`}>
          <TextInput id="pm-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Referência" htmlFor="pm-ref">
          <TextInput id="pm-ref" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} />
        </Field>
        <Field label="Nota" htmlFor="pm-note">
          <TextInput id="pm-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
