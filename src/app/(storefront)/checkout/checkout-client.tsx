"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { AlertTriangle, Check, ChevronLeft, Landmark, Loader2, Lock, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { useCart } from "@/lib/cart-context";
import { apiFetch, errorMessage, FetchError } from "@/lib/fetcher";
import { formatMT, formatNumber, normalizePhone } from "@/lib/format";
import type { CatalogProduct, CatalogZone } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Method = "mpesa" | "emola" | "transferencia";
type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Carrinho" },
  { n: 2, label: "Entrega" },
  { n: 3, label: "Pagamento" },
];

const noopSubscribe = () => () => {};

interface Props {
  products: CatalogProduct[];
  zones: CatalogZone[];
  hasBankDetails: boolean;
}

export function CheckoutClient({ products, zones, hasBankDetails }: Props) {
  const router = useRouter();
  const { cart, step: stepQty, removeItem, clearCart, totalPrice } = useCart();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    zoneId: zones[0]?.id ?? "",
    address: "",
    reference: "",
    notes: "",
  });
  const [method, setMethod] = useState<Method>("mpesa");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const zone = zones.find((z) => z.id === form.zoneId);
  const fee = zone?.fee ?? 0;
  const total = totalPrice + fee;

  // Problemas de stock/mínimo detectados no cliente (o servidor volta a validar)
  const cartIssues = cart
    .map((i) => {
      const p = byId.get(i.productId);
      if (!p) return `${i.label} já não está disponível.`;
      if (i.quantity > p.available) return `${p.label}: só temos ${formatNumber(p.available)} unidades em stock.`;
      if (i.quantity < p.minimumOrder) return `${p.label}: a encomenda mínima é ${formatNumber(p.minimumOrder)} unidades.`;
      return null;
    })
    .filter(Boolean) as string[];

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validateDelivery() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Indique o seu nome.";
    if (!normalizePhone(form.customerPhone)) e.customerPhone = "Número inválido. Ex.: 84 123 4567";
    if (!form.zoneId) e.zoneId = "Escolha a zona de entrega.";
    if (form.address.trim().length < 5) e.address = "Indique o endereço da entrega.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goTo(next: Step) {
    if (next >= 2 && cartIssues.length) return setStep(1);
    if (next === 3 && !validateDelivery()) return;
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!acceptTerms) {
      setErrors((e) => ({ ...e, terms: "Aceite os termos para continuar." }));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiFetch<{ token: string }>("/api/checkout", {
        method: "POST",
        body: {
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          ...form,
          paymentMethod: method,
        },
      });
      clearCart();
      router.push(`/pedido/${res.token}?novo=1`);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof FetchError && err.details) {
        const fieldErrors = Object.fromEntries(
          Object.entries(err.details).map(([k, v]) => [k, v?.[0] ?? ""]),
        );
        setErrors(fieldErrors);
        if (["customerName", "customerPhone", "zoneId", "address"].some((k) => fieldErrors[k])) setStep(2);
      }
      setSubmitError(errorMessage(err));
    }
  }

  if (!hydrated) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <ShoppingCart className="h-12 w-12 text-outline" />
        <h1 className="mt-4 text-[22px] font-semibold text-on-surface">O seu carrinho está vazio</h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">Escolha os blocos no catálogo para fazer uma encomenda.</p>
        <Link
          href="/#catalogo"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-6 font-semibold text-on-primary hover:bg-primary/90"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-16">
      <Link href="/#catalogo" className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-on-surface">
        <ChevronLeft className="h-4 w-4" /> Continuar a comprar
      </Link>

      {/* Indicador de passos */}
      <ol className="mt-4 flex items-center rounded-lg border border-outline-variant bg-white px-4 py-3">
        {STEPS.map((s, i) => (
          <li key={s.n} className="flex flex-1 items-center last:flex-none">
            <button
              onClick={() => s.n < step && goTo(s.n)}
              disabled={s.n >= step}
              className="flex items-center gap-2 disabled:cursor-default"
            >
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold",
                  s.n <= step ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {s.n < step ? <Check className="h-4 w-4" /> : s.n}
              </span>
              <span className={cn("text-body-sm font-medium", s.n === step ? "text-on-surface" : "text-on-surface-variant", "hidden sm:inline")}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && <span className={cn("mx-3 h-px flex-1", s.n < step ? "bg-primary" : "bg-outline-variant")} />}
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {submitError && <Alert onClose={() => setSubmitError(null)}>{submitError}</Alert>}

          {/* ── Passo 1: carrinho ── */}
          {step === 1 && (
            <section className="rounded-lg border border-outline-variant bg-white">
              <h1 className="border-b border-outline-variant px-5 py-4 text-title-md font-semibold text-on-surface">
                Reveja a sua encomenda
              </h1>
              {cartIssues.length > 0 && (
                <div className="px-5 pt-4">
                  <Alert tone="warning">
                    <p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" /> Ajuste o carrinho:</p>
                    <ul className="mt-1 list-disc pl-6">{cartIssues.map((m) => <li key={m}>{m}</li>)}</ul>
                  </Alert>
                </div>
              )}
              <ul className="divide-y divide-outline-variant px-5">
                {cart.map((item) => {
                  const p = byId.get(item.productId);
                  return (
                    <li key={item.productId} className="flex flex-wrap items-center gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-on-surface">{item.label}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          {formatMT(item.price)} / un.
                          {p && ` · ${formatNumber(p.available)} em stock`}
                        </p>
                      </div>
                      <div className="flex items-center rounded-md border border-outline-variant">
                        <button onClick={() => stepQty(item.productId, -1)} className="grid h-10 w-10 place-items-center hover:bg-surface-container-low" aria-label="Diminuir">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-16 text-center text-body-sm font-semibold tabular-nums">{formatNumber(item.quantity)}</span>
                        <button
                          onClick={() => stepQty(item.productId, 1)}
                          disabled={!!p && item.quantity + item.orderStep > p.available}
                          className="grid h-10 w-10 place-items-center hover:bg-surface-container-low disabled:opacity-40"
                          aria-label="Aumentar"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="w-28 text-right font-semibold tabular-nums text-on-surface">{formatMT(item.price * item.quantity)}</p>
                      <button onClick={() => removeItem(item.productId)} className="rounded-md p-2 text-on-surface-variant hover:bg-error-container hover:text-error" aria-label={`Remover ${item.label}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ── Passo 2: dados e entrega ── */}
          {step === 2 && (
            <section className="space-y-6 rounded-lg border border-outline-variant bg-white p-5">
              <div>
                <h1 className="text-title-md font-semibold text-on-surface">Os seus dados</h1>
                <p className="text-body-sm text-on-surface-variant">Usamos o telefone para confirmar o pagamento e combinar a entrega.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo ou empresa" htmlFor="customerName" error={errors.customerName} required>
                  <TextInput id="customerName" autoComplete="name" value={form.customerName} onChange={(e) => update("customerName", e.target.value)} aria-invalid={!!errors.customerName} />
                </Field>
                <Field label="Telefone (WhatsApp)" htmlFor="customerPhone" error={errors.customerPhone} required hint="Ex.: 84 123 4567">
                  <TextInput id="customerPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="84 123 4567" value={form.customerPhone} onChange={(e) => update("customerPhone", e.target.value)} aria-invalid={!!errors.customerPhone} />
                </Field>
              </div>

              <div className="border-t border-outline-variant pt-5">
                <h2 className="text-title-md font-semibold text-on-surface">Entrega</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Zona de entrega" htmlFor="zoneId" error={errors.zoneId} required>
                  <SelectInput id="zoneId" value={form.zoneId} onChange={(e) => update("zoneId", e.target.value)}>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} — {formatMT(z.fee)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Ponto de referência" htmlFor="reference" hint="Ex.: perto da escola, portão azul">
                  <TextInput id="reference" value={form.reference} onChange={(e) => update("reference", e.target.value)} />
                </Field>
                <Field label="Endereço completo" htmlFor="address" error={errors.address} required className="sm:col-span-2">
                  <TextInput id="address" autoComplete="street-address" placeholder="Bairro, rua, número do talhão…" value={form.address} onChange={(e) => update("address", e.target.value)} aria-invalid={!!errors.address} />
                </Field>
                <Field label="Instruções para o motorista (opcional)" htmlFor="notes" className="sm:col-span-2">
                  <TextArea id="notes" rows={3} placeholder="Ex.: entrar pelo portão lateral; descarregar junto à obra" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
                </Field>
              </div>
            </section>
          )}

          {/* ── Passo 3: pagamento ── */}
          {step === 3 && (
            <section className="space-y-5 rounded-lg border border-outline-variant bg-white p-5">
              <div>
                <h1 className="text-title-md font-semibold text-on-surface">Como vai pagar?</h1>
                <p className="text-body-sm text-on-surface-variant">
                  Depois de confirmar, mostramos o número para onde enviar o pagamento e o seu código de pedido.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Método de pagamento">
                {(
                  [
                    { id: "mpesa", label: "M-Pesa", sub: "Vodacom", badge: "bg-red-600", short: "M" },
                    { id: "emola", label: "e-Mola", sub: "Movitel", badge: "bg-orange-500", short: "e" },
                    ...(hasBankDetails ? [{ id: "transferencia", label: "Transferência", sub: "Conta bancária", badge: "bg-slate-700", short: "" }] : []),
                  ] as { id: Method; label: string; sub: string; badge: string; short: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    role="radio"
                    aria-checked={method === m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors",
                      method === m.id ? "border-primary bg-primary/5" : "border-outline-variant hover:bg-surface-container-low",
                    )}
                  >
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md font-bold text-white", m.badge)}>
                      {m.short || <Landmark className="h-5 w-5" />}
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-on-surface">{m.label}</span>
                      <span className="block text-[12px] text-on-surface-variant">{m.sub}</span>
                    </span>
                    <span className={cn("grid h-5 w-5 place-items-center rounded-full border-2", method === m.id ? "border-primary" : "border-outline-variant")}>
                      {method === m.id && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </span>
                  </button>
                ))}
              </div>

              <ol className="space-y-2 rounded-lg bg-surface-container-low p-4 text-body-sm text-on-surface">
                <li><b>1.</b> Confirme a encomenda: os blocos ficam reservados para si.</li>
                <li><b>2.</b> Envie <b>{formatMT(total)}</b> para o número que aparece no ecrã seguinte.</li>
                <li><b>3.</b> Escreva a referência da transacção (vem na SMS de confirmação).</li>
                <li><b>4.</b> Confirmamos o pagamento e agendamos a entrega.</li>
              </ol>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    setErrors((er) => ({ ...er, terms: "" }));
                  }}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="text-body-sm text-on-surface-variant">
                  Li e aceito os{" "}
                  <Link href="/termos" target="_blank" className="text-primary underline">termos de uso</Link>. A entrega é feita após a confirmação do pagamento.
                </span>
              </label>
              {errors.terms && <p className="text-[12px] font-medium text-error">{errors.terms}</p>}
            </section>
          )}
        </div>

        {/* ── Resumo ── */}
        <aside className="h-fit space-y-4 rounded-lg border border-outline-variant bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold text-on-surface">Resumo</h2>
          <ul className="space-y-2 text-body-sm">
            {cart.map((i) => (
              <li key={i.productId} className="flex justify-between gap-2">
                <span className="text-on-surface-variant">{i.label} × {formatNumber(i.quantity)}</span>
                <span className="font-medium tabular-nums text-on-surface">{formatMT(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-outline-variant pt-3 text-body-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="tabular-nums">{formatMT(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Entrega{zone ? ` (${zone.name})` : ""}</span>
              <span className="tabular-nums">{step >= 2 ? formatMT(fee) : "—"}</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between border-t border-outline-variant pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-[22px] font-bold text-primary tabular-nums">{formatMT(step >= 2 ? total : totalPrice)}</span>
          </div>

          <div className="hidden gap-2 lg:flex">
            {step > 1 && (
              <Button variant="outline" className="h-12" onClick={() => goTo((step - 1) as Step)} disabled={submitting}>
                Voltar
              </Button>
            )}
            <PrimaryAction step={step} submitting={submitting} disabled={step === 1 && cartIssues.length > 0} onNext={() => goTo((step + 1) as Step)} onSubmit={submit} />
          </div>
          <p className="flex items-center justify-center gap-1.5 text-[12px] text-on-surface-variant">
            <Lock className="h-3.5 w-3.5" /> Os preços são confirmados pelo servidor.
          </p>
        </aside>
      </div>

      {/* Barra fixa em mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-outline-variant bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="flex-1">
          <p className="text-[11px] uppercase text-on-surface-variant">Total</p>
          <p className="font-bold tabular-nums">{formatMT(step >= 2 ? total : totalPrice)}</p>
        </div>
        {step > 1 && (
          <Button variant="outline" className="h-11" onClick={() => goTo((step - 1) as Step)} disabled={submitting}>
            Voltar
          </Button>
        )}
        <PrimaryAction step={step} submitting={submitting} disabled={step === 1 && cartIssues.length > 0} onNext={() => goTo((step + 1) as Step)} onSubmit={submit} />
      </div>
    </div>
  );
}

function PrimaryAction({
  step,
  submitting,
  disabled,
  onNext,
  onSubmit,
}: {
  step: Step;
  submitting: boolean;
  disabled: boolean;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <Button
      onClick={step === 3 ? onSubmit : onNext}
      disabled={disabled || submitting}
      className="h-12 flex-1 bg-primary font-semibold text-on-primary hover:bg-primary/90"
    >
      {submitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A enviar…
        </>
      ) : step === 1 ? (
        "Continuar"
      ) : step === 2 ? (
        "Ir para pagamento"
      ) : (
        "Confirmar encomenda"
      )}
    </Button>
  );
}
