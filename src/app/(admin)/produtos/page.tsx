"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { History, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminHeader } from "@/components/shared/admin-header";
import { StockProgressBar } from "@/components/shared/stock-progress-bar";
import { BlockIllustration } from "@/components/store/block-illustration";
import { Button } from "@/components/ui/button";
import { Alert, Field, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { apiFetch, errorMessage } from "@/lib/fetcher";
import { formatDate, formatMT, formatNumber, orderCode } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  type: string;
  label: string;
  description: string | null;
  details: string | null;
  price: number;
  minimumOrder: number;
  orderStep: number;
  active: boolean;
  imageUrl: string | null;
  available: number;
  reserved: number;
  total: number;
}

interface Zone {
  id: string;
  name: string;
  fee: number;
  active: boolean;
}

interface Movement {
  id: string;
  type: "producao" | "reserva" | "liberacao" | "entrega" | "ajuste";
  quantity: number;
  note: string | null;
  createdAt: string;
  product: { label: string };
  order: { id: string; number: number } | null;
}

const MOVEMENT_LABEL: Record<Movement["type"], string> = {
  producao: "Produção",
  reserva: "Reserva",
  liberacao: "Reserva libertada",
  entrega: "Entrega",
  ajuste: "Ajuste manual",
};

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [zoneModal, setZoneModal] = useState<Zone | "new" | null>(null);
  const [movements, setMovements] = useState<Movement[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(() => {
    return Promise.all([apiFetch<Product[]>("/api/products"), apiFetch<Zone[]>("/api/zones")])
      .then(([p, z]) => {
        setProducts(p);
        setZones(z);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(p: Product) {
    try {
      await apiFetch(`/api/products/${p.id}`, { method: "PATCH", body: { active: !p.active } });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function openHistory() {
    setShowHistory(true);
    try {
      setMovements(await apiFetch<Movement[]>("/api/stock/movements"));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="flex-1">
      <AdminHeader
        title="Produtos e preços"
        subtitle="O que aparece na loja, a que preço, e quanto há em stock"
        actions={
          <Button variant="outline" className="h-10" onClick={openHistory}>
            <History className="mr-1.5 h-4 w-4" /> Movimentos de stock
          </Button>
        }
      />

      <div className="space-y-8 p-4 md:p-8">
        {error && <Alert onClose={() => setError(null)}>{error}</Alert>}

        {!products ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {products.map((p) => (
              <article key={p.id} className={cn("flex gap-4 rounded-md border border-outline-variant bg-surface-container-lowest p-4", !p.active && "opacity-60")}>
                <div className="hidden h-24 w-28 shrink-0 items-center justify-center rounded-md bg-surface-container-low sm:flex">
                  <BlockIllustration type={p.type} className="h-20" />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-on-surface">{p.label}</h2>
                      <p className="text-body-sm text-on-surface-variant">
                        {formatMT(p.price)} / un. · mín. {formatNumber(p.minimumOrder)} · +{formatNumber(p.orderStep)}
                      </p>
                    </div>
                    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[12px] text-on-surface-variant">
                      <input type="checkbox" checked={p.active} onChange={() => toggleActive(p)} className="h-4 w-4 accent-primary" />
                      Na loja
                    </label>
                  </div>
                  <div>
                    <StockProgressBar available={p.available} reserved={p.reserved} total={p.total} />
                    <div className="mt-1 flex justify-between text-[12px] text-on-surface-variant tabular-nums">
                      <span>{formatNumber(p.available)} disponíveis</span>
                      <span>{formatNumber(p.reserved)} reservados</span>
                      <span>{formatNumber(p.total)} no armazém</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAdjusting(p)}>
                      Ajustar stock
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Zonas de entrega */}
        <section className="rounded-md border border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
            <div>
              <h2 className="font-semibold text-on-surface">Zonas de entrega</h2>
              <p className="text-body-sm text-on-surface-variant">Taxa cobrada ao cliente por encomenda.</p>
            </div>
            <Button size="sm" onClick={() => setZoneModal("new")} className="bg-primary text-on-primary hover:bg-primary/90">
              <Plus className="mr-1 h-4 w-4" /> Nova zona
            </Button>
          </div>
          <ul className="divide-y divide-outline-variant">
            {zones.map((z) => (
              <li key={z.id} className={cn("flex items-center justify-between gap-3 px-5 py-3 text-body-sm", !z.active && "opacity-60")}>
                <span className="text-on-surface">
                  {z.name} {!z.active && <span className="text-[12px] text-on-surface-variant">(inactiva)</span>}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium tabular-nums">{formatMT(z.fee)}</span>
                  <button onClick={() => setZoneModal(z)} className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container-low" aria-label={`Editar ${z.name}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
            {zones.length === 0 && <li className="px-5 py-4 text-body-sm text-on-surface-variant">Sem zonas. A loja não aceita encomendas sem pelo menos uma zona activa.</li>}
          </ul>
        </section>
      </div>

      {editing && <EditProductModal product={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {adjusting && <AdjustStockModal product={adjusting} onClose={() => setAdjusting(null)} onSaved={() => { setAdjusting(null); load(); }} />}
      {zoneModal && <ZoneModal zone={zoneModal === "new" ? null : zoneModal} onClose={() => setZoneModal(null)} onSaved={() => { setZoneModal(null); load(); }} />}

      <Modal open={showHistory} onClose={() => setShowHistory(false)} size="lg" title="Movimentos de stock" description="Últimos 100 movimentos de blocos">
        {!movements ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : movements.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">Ainda não há movimentos registados.</p>
        ) : (
          <ul className="divide-y divide-outline-variant text-body-sm">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-on-surface">
                    {MOVEMENT_LABEL[m.type]} · {m.product.label}
                    {m.order && (
                      <Link href={`/encomendas/${m.order.id}`} className="ml-1 text-primary hover:underline">{orderCode(m.order.number)}</Link>
                    )}
                  </p>
                  <p className="text-[12px] text-on-surface-variant">{formatDate(m.createdAt, true)}{m.note && ` · ${m.note}`}</p>
                </div>
                <span className={cn("font-semibold tabular-nums", m.quantity > 0 ? "text-primary" : "text-error")}>
                  {m.quantity > 0 ? "+" : ""}{formatNumber(m.quantity)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}

function EditProductModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    label: product.label,
    description: product.description ?? "",
    details: product.details ?? "",
    price: String(product.price),
    minimumOrder: String(product.minimumOrder),
    orderStep: String(product.orderStep),
    imageUrl: product.imageUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/products/${product.id}`, {
        method: "PATCH",
        body: {
          ...form,
          price: Number(form.price),
          minimumOrder: Number(form.minimumOrder),
          orderStep: Number(form.orderStep),
        },
      });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Editar ${product.label}`}
      description="As alterações de preço aplicam-se apenas a novas encomendas."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-primary text-on-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Guardar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {error && <Alert className="sm:col-span-3">{error}</Alert>}
        <Field label="Nome" htmlFor="p-label" className="sm:col-span-2" required>
          <TextInput id="p-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </Field>
        <Field label="Preço (MT)" htmlFor="p-price" required>
          <TextInput id="p-price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </Field>
        <Field label="Subtítulo" htmlFor="p-desc" className="sm:col-span-3" hint="Ex.: Divisória Interior">
          <TextInput id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Descrição na loja" htmlFor="p-details" className="sm:col-span-3">
          <TextArea id="p-details" rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
        </Field>
        <Field label="Encomenda mínima" htmlFor="p-min">
          <TextInput id="p-min" type="number" min={1} value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })} />
        </Field>
        <Field label="Incremento" htmlFor="p-step" hint="Botões + / − do carrinho">
          <TextInput id="p-step" type="number" min={1} value={form.orderStep} onChange={(e) => setForm({ ...form, orderStep: e.target.value })} />
        </Field>
        <Field label="URL da foto" htmlFor="p-img" hint="Opcional">
          <TextInput id="p-img" type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

function AdjustStockModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [direction, setDirection] = useState<1 | -1>(-1);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/products/${product.id}/stock`, {
        method: "POST",
        body: { quantity: direction * Number(quantity), note },
      });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Ajustar stock — ${product.label}`}
      description={`Disponível agora: ${formatNumber(product.available)} unidades. Para produção nova use a página Produção.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !(Number(quantity) > 0) || !note.trim()} className="bg-primary text-on-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Aplicar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="grid grid-cols-2 gap-2">
          {([[-1, "Retirar (quebras)"], [1, "Adicionar (contagem)"]] as const).map(([d, label]) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={cn("h-10 rounded-md border text-body-sm font-medium", direction === d ? "border-primary bg-primary/10 text-primary" : "border-outline-variant")}
            >
              {label}
            </button>
          ))}
        </div>
        <Field label="Quantidade" htmlFor="adj-q" required>
          <TextInput id="adj-q" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="Motivo" htmlFor="adj-note" required hint="Fica no histórico de movimentos">
          <TextInput id="adj-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: 20 blocos partidos no carregamento" />
        </Field>
      </div>
    </Modal>
  );
}

function ZoneModal({ zone, onClose, onSaved }: { zone: Zone | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(zone?.name ?? "");
  const [fee, setFee] = useState(zone ? String(zone.fee) : "");
  const [active, setActive] = useState(zone?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(zone ? `/api/zones/${zone.id}` : "/api/zones", {
        method: zone ? "PATCH" : "POST",
        body: { name, fee: Number(fee), active },
      });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await apiFetch(`/api/zones/${zone!.id}`, { method: "DELETE" });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={zone ? `Editar ${zone.name}` : "Nova zona de entrega"}
      footer={
        <>
          {zone && (
            <Button variant="outline" onClick={remove} disabled={saving} className="mr-auto text-error">
              <Trash2 className="mr-1 h-4 w-4" /> Apagar
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-primary text-on-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Nome" htmlFor="z-name" required>
          <TextInput id="z-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Taxa de entrega (MT)" htmlFor="z-fee" required>
          <TextInput id="z-fee" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-body-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-primary" />
          Disponível na loja
        </label>
      </div>
    </Modal>
  );
}
