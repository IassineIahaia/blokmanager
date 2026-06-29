import Link from "next/link";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { AdminHeader } from "@/components/shared/admin-header";
import { MetricCard } from "@/components/shared/metric-card";
import { CurrencyValue } from "@/components/shared/currency-value";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MaterialLevelBar } from "@/components/shared/stock-progress-bar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import { dashboardMetrics, recentOrders, materialStocks } from "@/lib/mock-data";

export default function DashboardPage() {
  const m = dashboardMetrics;

  return (
    <div className="flex-1">
      <AdminHeader title="Painel Geral" userName="João Silva" userRole="Administrador" />

      <div className="p-4 md:p-8 space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Blocos em Stock"
            value={formatNumber(m.blocksInStock)}
            footer={
              <div className="flex gap-6 pt-2 border-t border-outline-variant">
                {m.blocksByType.map((b) => (
                  <div key={b.type}>
                    <p className="text-label-caps text-on-surface-variant uppercase">
                      {b.type}
                    </p>
                    <p className="text-body-md font-medium text-on-surface">
                      {formatNumber(b.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            }
          />

          <MetricCard
            label="Produção Hoje"
            value={formatNumber(m.productionToday)}
            badge={`↗ ${m.productionChangePct}%`}
            badgeClassName="text-primary"
            footer={
              <p className="italic">
                Meta diária: {formatNumber(m.productionGoal)} blocos
              </p>
            }
          />

          <MetricCard
            label="Encomendas Pendentes"
            value={String(m.pendingOrders)}
            valueClassName="text-secondary"
            footer={<p>Aguardando aprovação logística</p>}
          />

          <MetricCard
            label="Caixa do Dia"
            value={
              <CurrencyValue
                value={m.dailyCash}
                className="text-3xl font-semibold tracking-tight"
              />
            }
            footer={<p>Apurado em 4 vendas confirmadas</p>}
          />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent orders */}
          <div className="lg:col-span-2 rounded-md border border-outline-variant bg-surface-container-lowest">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <h2 className="text-title-md font-medium text-on-surface">
                Encomendas Recentes
              </h2>
              <Link
                href="#"
                className="text-body-sm font-medium text-primary hover:underline"
              >
                Ver todas
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <EmptyState
                title="Sem encomendas ainda"
                description="As novas encomendas dos clientes vão aparecer aqui."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-container-low">
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">
                      ID Pedido
                    </TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">
                      Cliente
                    </TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-variant text-right">
                      Valor
                    </TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="border-outline-variant">
                      <TableCell className="font-medium text-on-surface">
                        #{order.id}
                      </TableCell>
                      <TableCell className="text-on-surface-variant">
                        {order.cliente}
                      </TableCell>
                      <TableCell className="text-right text-on-surface">
                        <CurrencyValue value={order.valor} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Stock alerts */}
          <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-6 space-y-4">
            <h2 className="text-title-md font-medium text-on-surface">Alertas de Stock</h2>

            {materialStocks
              .filter((mat) => mat.current < mat.minimum)
              .map((mat) => (
                <div
                  key={mat.name}
                  className="rounded-md border border-secondary-container bg-secondary-container/20 p-4 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-on-surface">
                        Stock Baixo: {mat.name}
                      </p>
                      <p className="text-body-sm text-on-surface-variant mt-1">
                        Restam {mat.current} {mat.unit}. Mínimo recomendado: {mat.minimum}{" "}
                        {mat.unit}.
                      </p>
                    </div>
                  </div>
                  <MaterialLevelBar current={mat.current} minimum={mat.minimum} />
                </div>
              ))}

            <Button className="w-full h-11 bg-secondary text-on-secondary hover:bg-secondary/90 rounded-md">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Solicitar Suprimentos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}