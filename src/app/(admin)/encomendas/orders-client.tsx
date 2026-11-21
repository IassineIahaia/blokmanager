"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { AdminHeader } from "@/components/shared/admin-header";
import { PaymentBadge, StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Alert, Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch, errorMessage } from "@/lib/fetcher";
import {
  ORDER_STATUS_LABEL,
  formatDate,
  formatMT,
  formatNumber,
  formatPhone,
  orderCode,
  type OrderPaymentStatus,
  type OrderStatus,
} from "@/lib/format";
import { cn } from "@/lib/utils";

interface OrderRow {
  id: string;
  number: number;
  customerName: string;
  customerPhone: string | null;
  zoneName: string | null;
  total: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  createdAt: string;
  _count: { items: number };
}

interface ListResponse {
  orders: OrderRow[];
  total: number;
  page: number;
  pageSize: number;
  counts: Partial<Record<OrderStatus, number>>;
  verifying: number;
}

const TABS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "pendente", label: ORDER_STATUS_LABEL.pendente },
  { value: "confirmado", label: ORDER_STATUS_LABEL.confirmado },
  { value: "em_entrega", label: ORDER_STATUS_LABEL.em_entrega },
  { value: "entregue", label: ORDER_STATUS_LABEL.entregue },
  { value: "cancelado", label: ORDER_STATUS_LABEL.cancelado },
];

interface Props {
  initialStatus: string;
  initialPayment: string;
  initialQuery: string;
}

export function OrdersClient({ initialStatus, initialPayment, initialQuery }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [payment, setPayment] = useState(initialPayment);
  const [query, setQuery] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (payment) params.set("pagamento", payment);
  if (search) params.set("q", search);
  const filterQs = params.toString();
  if (page > 1) params.set("page", String(page));
  const key = `${params.toString()}#${reloadTick}`;
  const loading = loadedKey !== key;

  useEffect(() => {
    let cancelled = false;
    const qs = key.split("#")[0];
    apiFetch<ListResponse>(`/api/orders${qs ? `?${qs}` : ""}`)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoadedKey(key));
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Mantém o URL alinhado com os filtros (para partilhar / voltar atrás)
  useEffect(() => {
    router.replace(`/encomendas${filterQs ? `?${filterQs}` : ""}`, { scroll: false });
  }, [filterQs, router]);

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const allCount = data ? Object.values(data.counts).reduce((s, n) => s + (n ?? 0), 0) : 0;

  return (
    <div className="flex-1">
      <AdminHeader
        title="Encomendas"
        subtitle="Pedidos da loja online e encomendas registadas no balcão"
        actions={
          <Button onClick={() => setShowNew(true)} className="h-10 bg-primary text-on-primary hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> Nova encomenda
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-8">
        {error && <Alert onClose={() => setError(null)}>{error}</Alert>}

        {data && data.verifying > 0 && payment !== "em_verificacao" && (
          <button
            onClick={() => {
              setPayment("em_verificacao");
              setStatus("");
              setPage(1);
            }}
            className="w-full text-left"
          >
            <Alert tone="warning">
              <b>{data.verifying}</b> {data.verifying === 1 ? "encomenda tem" : "encomendas têm"} pagamentos à espera de verificação.{" "}
              <span className="underline">Ver agora</span>
            </Alert>
          </button>
        )}

        {/* Separadores por estado */}
        <div className="flex gap-1 overflow-x-auto border-b border-outline-variant">
          {TABS.map((t) => {
            const count = t.value ? data?.counts[t.value as OrderStatus] ?? 0 : allCount;
            return (
              <button
                key={t.value}
                onClick={() => {
                  setStatus(t.value);
                  setPage(1);
                }}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-body-sm font-medium transition-colors",
                  status === t.value ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface",
                )}
              >
                {t.label}
                <span className="rounded-full bg-surface-container-high px-1.5 text-[11px] tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(query.trim());
              setPage(1);
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => {
                if (query.trim() !== search) {
                  setSearch(query.trim());
                  setPage(1);
                }
              }}
              placeholder="Pesquisar por cliente, telefone ou código (BM-0012)"
              className="pl-9"
              aria-label="Pesquisar encomendas"
            />
          </form>
          <SelectInput
            value={payment}
            onChange={(e) => {
              setPayment(e.target.value);
              setPage(1);
            }}
            className="sm:w-56"
            aria-label="Filtrar por pagamento"
          >
            <option value="">Todos os pagamentos</option>
            <option value="por_pagar">Por pagar</option>
            <option value="em_verificacao">Em verificação</option>
            <option value="pago">Pago</option>
          </SelectInput>
        </div>

        <div className="overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest">
          {!data && loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !data || data.orders.length === 0 ? (
            <EmptyState
              title="Nenhuma encomenda encontrada"
              description={status || payment || search ? "Experimente outros filtros." : "As encomendas da loja aparecem aqui."}
            />
          ) : (
            <div className={cn("transition-opacity", loading && "opacity-50")}>
              {/* Tabela (desktop) */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow className="bg-surface-container-low">
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">Pedido</TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">Cliente</TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">Entrega</TableHead>
                    <TableHead className="text-right text-label-caps uppercase text-on-surface-variant">Total</TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">Estado</TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-variant">Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map((o) => (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer border-outline-variant hover:bg-surface-container-low"
                      onClick={() => router.push(`/encomendas/${o.id}`)}
                    >
                      <TableCell>
                        <Link href={`/encomendas/${o.id}`} className="font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                          {orderCode(o.number)}
                        </Link>
                        <span className="block text-[12px] text-on-surface-variant">{formatDate(o.createdAt, true)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-on-surface">{o.customerName}</span>
                        {o.customerPhone && <span className="block text-[12px] text-on-surface-variant">{formatPhone(o.customerPhone)}</span>}
                      </TableCell>
                      <TableCell className="text-on-surface-variant">{o.zoneName ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatMT(o.total)}</TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell>{o.status !== "cancelado" ? <PaymentBadge status={o.paymentStatus} /> : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Cartões (mobile) */}
              <ul className="divide-y divide-outline-variant md:hidden">
                {data.orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/encomendas/${o.id}`} className="block space-y-2 p-4 active:bg-surface-container-low">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">{orderCode(o.number)}</span>
                        <span className="font-semibold tabular-nums">{formatMT(o.total)}</span>
                      </div>
                      <p className="text-body-sm text-on-surface">
                        {o.customerName}
                        <span className="text-on-surface-variant"> · {formatDate(o.createdAt)}</span>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge status={o.status} />
                        {o.status !== "cancelado" && <PaymentBadge status={o.paymentStatus} />}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {data && totalPages > 1 && (
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
            <span>
              {formatNumber(data.total)} encomendas · página {data.page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Seguinte <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <NewOrderModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(id) => {
          setShowNew(false);
          reload();
          router.push(`/encomendas/${id}`);
        }}
      />
    </div>
  );
}

// ─────────────── Nova encomenda (balcão / telefone) ───────────────

interface ProductOption {
  id: string;
  label: string;
  price: number;
  available: number;
  active: boolean;
}

interface ZoneOption {
  id: string;
  name: string;
  fee: number;
}

function NewOrderModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [lines, setLines] = useState<{ productId: string; quantity: string }[]>([{ productId: "", quantity: "" }]);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", zoneId: "", address: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([apiFetch<ProductOption[]>("/api/products"), apiFetch<ZoneOption[]>("/api/zones")])
      .then(([p, z]) => {
        setProducts(p.filter((x) => x.active));
        setZones(z);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [open]);

  const byId = new Map(products.map((p) => [p.id, p]));
  const subtotal = lines.reduce((s, l) => s + (byId.get(l.productId)?.price ?? 0) * (Number(l.quantity) || 0), 0);
  const fee = zones.find((z) => z.id === form.zoneId)?.fee ?? 0;

  function reset() {
    setLines([{ productId: "", quantity: "" }]);
    setForm({ customerName: "", customerPhone: "", zoneId: "", address: "", notes: "" });
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const order = await apiFetch<{ id: string }>("/api/orders", {
        method: "POST",
        body: {
          ...form,
          zoneId: form.zoneId || null,
          items: lines
            .filter((l) => l.productId && Number(l.quantity) > 0)
            .map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
        },
      });
      reset();
      onCreated(order.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Nova encomenda"
      description="Para pedidos feitos ao balcão ou por telefone. O stock é reservado ao gravar."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-primary text-on-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar encomenda · {formatMT(subtotal + fee)}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && <Alert onClose={() => setError(null)}>{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente" htmlFor="no-name" required>
            <TextInput id="no-name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          </Field>
          <Field label="Telefone" htmlFor="no-phone" hint="Opcional, para avisos por WhatsApp">
            <TextInput id="no-phone" type="tel" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
          </Field>
        </div>

        <div className="space-y-2">
          <p className="text-[13px] font-medium text-on-surface">Produtos</p>
          {lines.map((line, idx) => {
            const p = byId.get(line.productId);
            return (
              <div key={idx} className="flex items-start gap-2">
                <SelectInput
                  value={line.productId}
                  onChange={(e) => setLines(lines.map((l, i) => (i === idx ? { ...l, productId: e.target.value } : l)))}
                  className="flex-1"
                  aria-label="Produto"
                >
                  <option value="">Escolher produto…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} — {formatMT(p.price)} ({formatNumber(p.available)} disp.)
                    </option>
                  ))}
                </SelectInput>
                <TextInput
                  type="number"
                  min={1}
                  max={p?.available}
                  placeholder="Qtd."
                  value={line.quantity}
                  onChange={(e) => setLines(lines.map((l, i) => (i === idx ? { ...l, quantity: e.target.value } : l)))}
                  className="w-28"
                  aria-label="Quantidade"
                />
                <button
                  onClick={() => setLines(lines.length > 1 ? lines.filter((_, i) => i !== idx) : [{ productId: "", quantity: "" }])}
                  className="grid h-11 w-11 place-items-center rounded-md text-on-surface-variant hover:bg-error-container hover:text-error"
                  aria-label="Remover linha"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={() => setLines([...lines, { productId: "", quantity: "" }])}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar produto
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Entrega" htmlFor="no-zone">
            <SelectInput id="no-zone" value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })}>
              <option value="">Levanta na fábrica (sem entrega)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name} — {formatMT(z.fee)}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Endereço" htmlFor="no-address">
            <TextInput id="no-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={!form.zoneId} />
          </Field>
          <Field label="Notas" htmlFor="no-notes" className="sm:col-span-2">
            <TextArea id="no-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>

        <div className="space-y-1 rounded-md bg-surface-container-low p-3 text-body-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatMT(subtotal)}</span></div>
          <div className="flex justify-between"><span>Entrega</span><span className="tabular-nums">{formatMT(fee)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span className="tabular-nums">{formatMT(subtotal + fee)}</span></div>
        </div>
      </div>
    </Modal>
  );
}
