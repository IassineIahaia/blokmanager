"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Clock, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Field, TextInput } from "@/components/ui/field";
import { apiFetch, errorMessage } from "@/lib/fetcher";
import { formatMT, formatPhone, type OrderPaymentStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

type Method = "mpesa" | "emola" | "transferencia";

interface Props {
  token: string;
  code: string;
  remaining: number;
  paymentStatus: OrderPaymentStatus;
  preferredMethod: Method | null;
  mpesaNumber: string;
  emolaNumber: string;
  bankDetails: string;
  customerPhone: string | null;
}

export function PaymentPanel(props: Props) {
  const router = useRouter();
  const methods: { id: Method; label: string }[] = [
    { id: "mpesa", label: "M-Pesa" },
    { id: "emola", label: "e-Mola" },
    ...(props.bankDetails ? [{ id: "transferencia" as const, label: "Transferência" }] : []),
  ];
  const [method, setMethod] = useState<Method>(
    methods.some((m) => m.id === props.preferredMethod) ? props.preferredMethod! : "mpesa",
  );
  const [reference, setReference] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [showForm, setShowForm] = useState(props.paymentStatus !== "em_verificacao");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const number = method === "mpesa" ? props.mpesaNumber : method === "emola" ? props.emolaNumber : null;

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // sem permissão de clipboard: o utilizador pode copiar à mão
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) {
      setError("Escreva a referência da transacção que recebeu por SMS.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/pedido/${props.token}/pagamento`, {
        method: "POST",
        body: { method, reference: reference.trim(), ...(payerPhone.trim() ? { payerPhone } : {}) },
      });
      setReference("");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-black/20 bg-white print:hidden">
      <div className="bg-black/[0.03] px-5 py-4">
        <h2 className="font-semibold text-black">Pagar {formatMT(props.remaining)}</h2>
        <p className="text-sm text-black/60">
          Os blocos ficam reservados. A entrega é agendada depois de confirmarmos o pagamento.
        </p>
      </div>

      <div className="space-y-5 p-5">
        {props.paymentStatus === "em_verificacao" && (
          <Alert tone="warning">
            <p className="flex items-center gap-2 font-medium">
              <Clock className="h-4 w-4" /> Recebemos a sua referência e estamos a verificar.
            </p>
            <p className="mt-1">Normalmente confirmamos em poucas horas (horário de expediente).</p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="mt-2 font-medium underline">
                Enviar outra referência
              </button>
            )}
          </Alert>
        )}

        <div className="flex gap-2" role="tablist">
          {methods.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={method === m.id}
              onClick={() => setMethod(m.id)}
              className={cn(
                "h-10 flex-1 rounded-xl border text-sm font-medium transition-colors",
                method === m.id ? "border-black bg-black text-white" : "border-black/5 hover:bg-black/5",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {number ? (
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black text-[12px] font-bold text-white">1</span>
              <div className="flex-1">
                <p className="text-black">
                  Envie <b>{formatMT(props.remaining)}</b> por {method === "mpesa" ? "M-Pesa" : "e-Mola"} para:
                </p>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-black/5 bg-black/[0.03] px-4 py-3">
                  <span className="text-[20px] font-bold tracking-wide text-black tabular-nums">{formatPhone(number)}</span>
                  <button
                    onClick={() => copy(number.replace(/^258/, ""), "num")}
                    className="flex items-center gap-1 text-sm font-medium text-black"
                  >
                    {copied === "num" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied === "num" ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black text-[12px] font-bold text-white">2</span>
              <p className="text-black">
                Se o serviço pedir uma descrição, escreva o código do pedido{" "}
                <button onClick={() => copy(props.code, "code")} className="font-bold text-black underline">
                  {props.code}
                </button>
                {copied === "code" && <span className="ml-1 text-black">(copiado)</span>}.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black text-[12px] font-bold text-white">3</span>
              <p className="text-black">Escreva abaixo a referência da transacção que vem na SMS de confirmação.</p>
            </li>
          </ol>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-black">
              Transfira <b>{formatMT(props.remaining)}</b> para a conta abaixo, com o descritivo <b>{props.code}</b>:
            </p>
            <pre className="whitespace-pre-wrap rounded-xl border border-black/5 bg-black/[0.03] p-4 font-sans text-black">
              {props.bankDetails}
            </pre>
          </div>
        )}

        {showForm && (
          <form onSubmit={submit} className="space-y-4 border-t border-black/5 pt-5">
            {error && <Alert onClose={() => setError(null)}>{error}</Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Referência da transacção" htmlFor="reference" required hint="Ex.: 8KJ3HX2LQ1">
                <TextInput
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  autoComplete="off"
                  maxLength={60}
                />
              </Field>
              <Field
                label="Número que pagou (se for outro)"
                htmlFor="payerPhone"
                hint={props.customerPhone ? `Por omissão: ${formatPhone(props.customerPhone)}` : undefined}
              >
                <TextInput id="payerPhone" type="tel" inputMode="tel" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} />
              </Field>
            </div>
            <Button type="submit" disabled={submitting} className="h-11 w-full bg-black font-semibold text-white hover:bg-black/85 sm:w-auto sm:px-8">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Já paguei — enviar referência
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
