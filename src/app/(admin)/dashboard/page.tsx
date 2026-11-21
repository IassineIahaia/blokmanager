import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, Truck, Wallet } from "lucide-react";
import { AdminHeader } from "@/components/shared/admin-header";
import { MetricCard } from "@/components/shared/metric-card";
import { PaymentBadge, StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MaterialLevelBar } from "@/components/shared/stock-progress-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMT, formatNumber, orderCode } from "@/lib/format";

const DAILY_PRODUCTION_GOAL = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Início do dia em Maputo (UTC+2, sem horário de verão). */
function startOfDayMaputo(offsetDays = 0) {
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 2 * 60 * 60 * 1000;
  return new Date(start + offsetDays * DAY_MS);
}

async function getDashboardData() {
  const today = startOfDayMaputo();
  const yesterday = startOfDayMaputo(-1);
  const weekAgo = startOfDayMaputo(-6);

  const [
    recentOrders,
    products,
    materials,
    prodToday,
    prodYesterday,
    cashToday,
    verifying,
    toDeliver,
    pending,
    weekPayments,
    weekProduction,
  ] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.materialStock.findMany({ orderBy: { name: "asc" } }),
    prisma.productionEntry.aggregate({ where: { date: { gte: today } }, _sum: { quantity: true, damaged: true } }),
    prisma.productionEntry.aggregate({ where: { date: { gte: yesterday, lt: today } }, _sum: { quantity: true } }),
    prisma.payment.aggregate({ where: { status: "confirmado", reviewedAt: { gte: today } }, _sum: { amount: true } }),
    prisma.order.count({ where: { paymentStatus: "em_verificacao", status: { not: "cancelado" } } }),
    prisma.order.count({ where: { status: { in: ["confirmado", "em_entrega"] } } }),
    prisma.order.count({ where: { status: "pendente" } }),
    prisma.payment.findMany({
      where: { status: "confirmado", reviewedAt: { gte: weekAgo } },
      select: { amount: true, reviewedAt: true },
    }),
    prisma.productionEntry.findMany({ where: { date: { gte: weekAgo } }, select: { quantity: true, date: true } }),
  ]);

  // Série dos últimos 7 dias
  const days = Array.from({ length: 7 }, (_, i) => {
    const start = startOfDayMaputo(i - 6);
    const end = new Date(start.getTime() + DAY_MS);
    const inDay = (d: Date | null) => !!d && d >= start && d < end;
    return {
      label: start.toLocaleDateString("pt-PT", { weekday: "short", timeZone: "Africa/Maputo" }).replace(".", ""),
      sales: weekPayments.filter((p) => inDay(p.reviewedAt)).reduce((s, p) => s + p.amount, 0),
      production: weekProduction.filter((p) => inDay(p.date)).reduce((s, p) => s + p.quantity, 0),
    };
  });

  const producedToday = prodToday._sum.quantity ?? 0;
  const producedYesterday = prodYesterday._sum.quantity ?? 0;

  return {
    recentOrders,
    products,
    materials,
    producedToday,
    damagedToday: prodToday._sum.damaged ?? 0,
    productionChangePct: producedYesterday ? Math.round(((producedToday - producedYesterday) / producedYesterday) * 100) : null,
    cashToday: cashToday._sum.amount ?? 0,
    verifying,
    toDeliver,
    pending,
    days,
  };
}

export default async function DashboardPage() {
  const d = await getDashboardData();
  const blocksAvailable = d.products.reduce((s, p) => s + p.available, 0);
  const lowMaterials = d.materials.filter((m) => m.current < m.minimum);
  const lowProducts = d.products.filter((p) => p.active && p.available < p.minimumOrder * 3);
  const maxSales = Math.max(1, ...d.days.map((x) => x.sales));
  const maxProd = Math.max(1, ...d.days.map((x) => x.production));
  const todayLabel = new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Maputo",
  });

  return (
    <div className="flex-1">
      <AdminHeader title="Painel geral" subtitle={todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} />

      <div className="space-y-6 p-4 md:p-8">
        {/* Acções necessárias */}
        {(d.verifying > 0 || d.toDeliver > 0 || d.pending > 0) && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { n: d.verifying, label: "pagamentos por verificar", href: "/encomendas?pagamento=em_verificacao", icon: Wallet, tone: d.verifying > 0 ? "bg-secondary-container/50 border-secondary/40" : "bg-white border-outline-variant" },
              { n: d.pending, label: "encomendas pendentes", href: "/encomendas?status=pendente", icon: Clock, tone: "bg-white border-outline-variant" },
              { n: d.toDeliver, label: "encomendas por entregar", href: "/encomendas?status=confirmado", icon: Truck, tone: "bg-white border-outline-variant" },
            ].map((a) => (
              <Link key={a.label} href={a.href} className={`group flex items-center gap-3 rounded-md border p-4 transition-shadow hover:shadow-md ${a.tone}`}>
                <a.icon className="h-5 w-5 text-on-surface-variant" />
                <span className="flex-1 text-body-sm text-on-surface">
                  <b className="text-[18px]">{a.n}</b> {a.label}
                </span>
                <ArrowRight className="h-4 w-4 text-on-surface-variant transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Blocos disponíveis"
            value={formatNumber(blocksAvailable)}
            footer={
              <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-outline-variant pt-2">
                {d.products.map((p) => (
                  <div key={p.id}>
                    <p className="text-[11px] uppercase text-on-surface-variant">{p.type}</p>
                    <p className="font-medium text-on-surface tabular-nums">{formatNumber(p.available)}</p>
                  </div>
                ))}
              </div>
            }
          />
          <MetricCard
            label="Produção hoje"
            value={formatNumber(d.producedToday)}
            badge={d.productionChangePct !== null ? `${d.productionChangePct >= 0 ? "↗" : "↘"} ${d.productionChangePct}% vs ontem` : undefined}
            badgeClassName={d.productionChangePct !== null && d.productionChangePct < 0 ? "text-error" : "text-primary"}
            footer={
              <div className="space-y-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (d.producedToday / DAILY_PRODUCTION_GOAL) * 100)}%` }} />
                </div>
                <p>Meta: {formatNumber(DAILY_PRODUCTION_GOAL)} · {formatNumber(d.damagedToday)} danificados</p>
              </div>
            }
          />
          <MetricCard
            label="Encomendas abertas"
            value={String(d.pending + d.toDeliver)}
            valueClassName="text-secondary-foreground"
            footer={<p>{d.pending} pendentes · {d.toDeliver} por entregar</p>}
          />
          <MetricCard
            label="Recebido hoje"
            value={<span className="tabular-nums">{formatMT(d.cashToday)}</span>}
            footer={<p>Pagamentos confirmados hoje</p>}
          />
        </div>

        {/* Gráficos dos últimos 7 dias */}
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { title: "Vendas recebidas (7 dias)", key: "sales" as const, max: maxSales, fmt: formatMT, color: "bg-primary" },
            { title: "Produção (7 dias)", key: "production" as const, max: maxProd, fmt: formatNumber, color: "bg-secondary" },
          ].map((chart) => (
            <section key={chart.title} className="rounded-md border border-outline-variant bg-surface-container-lowest p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-medium text-on-surface">{chart.title}</h2>
                <span className="text-body-sm text-on-surface-variant tabular-nums">
                  Total {chart.fmt(d.days.reduce((s, x) => s + x[chart.key], 0))}
                </span>
              </div>
              <div className="flex h-36 items-end gap-2" role="img" aria-label={chart.title}>
                {d.days.map((day, i) => (
                  <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[10px] text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100 tabular-nums">
                      {chart.fmt(day[chart.key])}
                    </span>
                    <div
                      className={`w-full rounded-t ${chart.color} ${i === 6 ? "" : "opacity-60"}`}
                      style={{ height: `${Math.max(2, (day[chart.key] / chart.max) * 100)}%` }}
                      title={`${day.label}: ${chart.fmt(day[chart.key])}`}
                    />
                    <span className="text-[11px] capitalize text-on-surface-variant">{day.label}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="rounded-md border border-outline-variant bg-surface-container-lowest lg:col-span-2">
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
              <h2 className="text-title-md font-medium text-on-surface">Encomendas recentes</h2>
              <Link href="/encomendas" className="text-body-sm font-medium text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            {d.recentOrders.length === 0 ? (
              <EmptyState title="Sem encomendas ainda" description="As novas encomendas dos clientes vão aparecer aqui." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-container-low">
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">Pedido</TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">Cliente</TableHead>
                    <TableHead className="text-right text-label-caps uppercase text-on-surface-variant">Valor</TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.recentOrders.map((order) => (
                    <TableRow key={order.id} className="border-outline-variant">
                      <TableCell>
                        <Link href={`/encomendas/${order.id}`} className="font-medium text-primary hover:underline">
                          {orderCode(order.number)}
                        </Link>
                        <span className="block text-[12px] text-on-surface-variant">{formatDate(order.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-on-surface-variant">{order.customerName}</TableCell>
                      <TableCell className="text-right text-on-surface tabular-nums">{formatMT(order.total)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge status={order.status} />
                          {order.status !== "cancelado" && <PaymentBadge status={order.paymentStatus} />}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <section className="space-y-4 rounded-md border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="text-title-md font-medium text-on-surface">Alertas de stock</h2>

            {lowMaterials.length === 0 && lowProducts.length === 0 && (
              <p className="text-body-sm text-on-surface-variant">Todos os níveis de stock estão bons.</p>
            )}

            {lowProducts.map((p) => (
              <div key={p.id} className="flex items-start gap-2 rounded-md border border-outline-variant p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-secondary-foreground" />
                <p className="text-body-sm text-on-surface">
                  <b>{p.label}</b>: só {formatNumber(p.available)} disponíveis
                  {p.reserved > 0 && ` (${formatNumber(p.reserved)} reservados)`}.
                </p>
              </div>
            ))}

            {lowMaterials.map((mat) => (
              <div key={mat.id} className="space-y-2 rounded-md border border-secondary-container bg-secondary-container/20 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-secondary-foreground" />
                  <div>
                    <p className="font-medium text-on-surface">Stock baixo: {mat.name}</p>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      Restam {formatNumber(mat.current)} {mat.unit}. Mínimo: {formatNumber(mat.minimum)} {mat.unit}.
                    </p>
                  </div>
                </div>
                <MaterialLevelBar current={mat.current} minimum={mat.minimum} />
              </div>
            ))}

            <Link
              href="/producao#materiais"
              className="flex h-11 w-full items-center justify-center rounded-md bg-secondary font-medium text-on-secondary hover:bg-secondary/90"
            >
              Registar entrada de materiais
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
