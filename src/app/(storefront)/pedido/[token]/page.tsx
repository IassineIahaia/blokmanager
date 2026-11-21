import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CheckCircle2, Circle, MapPin, MessageCircle, PartyPopper, Phone, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import {
  ORDER_STATUS_DESCRIPTION,
  ORDER_STATUS_LABEL,
  PAYMENT_ITEM_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  formatDate,
  formatMT,
  formatNumber,
  formatPhone,
  orderCode,
  whatsappLink,
} from "@/lib/format";
import { paidAmount } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { PaymentPanel } from "./payment-panel";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
  title: "O meu pedido",
  robots: { index: false, follow: false },
};

const TRACK = [
  { key: "pendente", label: "Pedido feito" },
  { key: "confirmado", label: "Confirmado" },
  { key: "em_entrega", label: "Em entrega" },
  { key: "entregue", label: "Entregue" },
] as const;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  await connection();
  const [{ token }, { novo }] = await Promise.all([params, searchParams]);

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!order) notFound();

  const settings = await getSettings();
  const code = orderCode(order.number);
  const paid = paidAmount(order.payments);
  const remaining = Math.max(0, order.total - paid);
  const cancelled = order.status === "cancelado";
  const currentIndex = TRACK.findIndex((t) => t.key === order.status);
  const showPayment = !cancelled && order.paymentStatus !== "pago" && remaining > 0;

  const waMessage = `Olá! Sobre o meu pedido ${code} (${formatMT(order.total)}).`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      {novo && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4 print:hidden">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-body-sm">
            <p className="font-semibold text-on-surface">Pedido recebido! Os seus blocos estão reservados.</p>
            <p className="mt-1 text-on-surface-variant">
              Guarde este link (ou o código <b>{code}</b>) para acompanhar o pedido. Para concluir, faça o pagamento abaixo.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-caps uppercase text-on-surface-variant">Pedido</p>
          <h1 className="text-[28px] font-bold tracking-tight text-on-surface">{code}</h1>
          <p className="text-body-sm text-on-surface-variant">Feito em {formatDate(order.createdAt, true)}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <PrintButton />
          <a
            href={whatsappLink(settings.whatsapp_number, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#25D366] px-4 text-body-sm font-medium text-white hover:bg-[#1fb957]"
          >
            <MessageCircle className="h-4 w-4" /> Falar connosco
          </a>
        </div>
      </div>

      {/* Estado */}
      <section className="mt-6 rounded-lg border border-outline-variant bg-white p-5">
        {cancelled ? (
          <div className="flex items-center gap-3 text-on-error-container">
            <XCircle className="h-6 w-6 text-error" />
            <div>
              <p className="font-semibold">{ORDER_STATUS_LABEL.cancelado}</p>
              <p className="text-body-sm text-on-surface-variant">{ORDER_STATUS_DESCRIPTION.cancelado}</p>
            </div>
          </div>
        ) : (
          <>
            <ol className="flex items-center">
              {TRACK.map((t, i) => {
                const done = i <= currentIndex;
                return (
                  <li key={t.key} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      {done ? (
                        <CheckCircle2 className="h-7 w-7 text-primary" />
                      ) : (
                        <Circle className="h-7 w-7 text-outline-variant" />
                      )}
                      <span className={cn("text-[12px] font-medium", done ? "text-on-surface" : "text-on-surface-variant")}>
                        {t.label}
                      </span>
                    </div>
                    {i < TRACK.length - 1 && (
                      <span className={cn("mx-2 mb-5 h-0.5 flex-1 rounded", i < currentIndex ? "bg-primary" : "bg-outline-variant")} />
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-center text-body-sm text-on-surface-variant">
              {ORDER_STATUS_DESCRIPTION[order.status]}
              {order.deliveryDate && order.status !== "entregue" && (
                <> Entrega prevista: <b className="text-on-surface">{formatDate(order.deliveryDate)}</b>.</>
              )}
            </p>
          </>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {showPayment && (
            <PaymentPanel
              token={token}
              code={code}
              remaining={remaining}
              paymentStatus={order.paymentStatus}
              preferredMethod={order.paymentMethod === "numerario" ? null : order.paymentMethod}
              mpesaNumber={settings.mpesa_number}
              emolaNumber={settings.emola_number}
              bankDetails={settings.bank_details}
              customerPhone={order.customerPhone}
            />
          )}

          {/* Itens */}
          <section className="rounded-lg border border-outline-variant bg-white">
            <h2 className="border-b border-outline-variant px-5 py-4 font-semibold text-on-surface">Itens</h2>
            <table className="w-full text-body-sm">
              <tbody className="divide-y divide-outline-variant">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-5 py-3 text-on-surface">
                      {i.productName}
                      <span className="block text-[12px] text-on-surface-variant">
                        {formatNumber(i.quantity)} × {formatMT(i.unitPrice)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{formatMT(i.lineTotal)}</td>
                  </tr>
                ))}
                {order.items.length === 0 && (
                  <tr>
                    <td className="px-5 py-3 text-on-surface-variant" colSpan={2}>Encomenda registada sem detalhe de itens.</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t border-outline-variant text-on-surface">
                <tr>
                  <td className="px-5 pt-3 text-on-surface-variant">Subtotal</td>
                  <td className="px-5 pt-3 text-right tabular-nums">{formatMT(order.subtotal)}</td>
                </tr>
                <tr>
                  <td className="px-5 pt-1 text-on-surface-variant">Entrega{order.zoneName ? ` (${order.zoneName})` : ""}</td>
                  <td className="px-5 pt-1 text-right tabular-nums">{formatMT(order.deliveryFee)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="px-5 py-3">Total</td>
                  <td className="px-5 py-3 text-right text-[18px] text-primary tabular-nums">{formatMT(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="space-y-3 rounded-lg border border-outline-variant bg-white p-5 text-body-sm">
            <h2 className="font-semibold text-on-surface">Entrega</h2>
            <p className="font-medium text-on-surface">{order.customerName}</p>
            {order.customerPhone && (
              <p className="flex items-center gap-2 text-on-surface-variant">
                <Phone className="h-4 w-4" /> {formatPhone(order.customerPhone)}
              </p>
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

          <section className="space-y-3 rounded-lg border border-outline-variant bg-white p-5 text-body-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-on-surface">Pagamento</h2>
              <span
                className={cn(
                  "rounded-sm px-2 py-0.5 text-label-caps",
                  order.paymentStatus === "pago"
                    ? "bg-primary-container text-on-primary-container"
                    : order.paymentStatus === "em_verificacao"
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {PAYMENT_STATUS_LABEL[order.paymentStatus]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Pago</span>
              <span className="tabular-nums">{formatMT(paid)}</span>
            </div>
            {remaining > 0 && !cancelled && (
              <div className="flex justify-between font-semibold">
                <span>Em falta</span>
                <span className="tabular-nums">{formatMT(remaining)}</span>
              </div>
            )}
            {order.payments.length > 0 && (
              <ul className="space-y-2 border-t border-outline-variant pt-3">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span className="text-on-surface-variant">
                      {PAYMENT_METHOD_LABEL[p.method]}
                      {p.reference && <span className="block text-[12px]">Ref. {p.reference}</span>}
                    </span>
                    <span className="text-right">
                      <span className="block tabular-nums">{formatMT(p.amount)}</span>
                      <span
                        className={cn(
                          "text-[12px]",
                          p.status === "confirmado" ? "text-primary" : p.status === "rejeitado" ? "text-error" : "text-on-secondary-container",
                        )}
                      >
                        {PAYMENT_ITEM_STATUS_LABEL[p.status]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 text-body-sm print:hidden">
            <h2 className="mb-3 font-semibold text-on-surface">Histórico</h2>
            <ol className="space-y-3 border-l border-outline-variant pl-4">
              {order.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-on-surface">{e.message}</p>
                  <p className="text-[12px] text-on-surface-variant">{formatDate(e.createdAt, true)}</p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <p className="mt-8 text-center text-body-sm text-on-surface-variant print:hidden">
        Perdeu este link? Use <Link href="/acompanhar" className="text-primary underline">Acompanhar pedido</Link> com o código e o seu telefone.
      </p>
      <p className="mt-8 hidden text-center text-[12px] text-on-surface-variant print:block">
        {settings.business_name} · {settings.business_phone} · Documento gerado em {formatDate(new Date(), true)}
      </p>
    </div>
  );
}
