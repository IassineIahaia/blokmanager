"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/shared/admin-header";
import { Button } from "@/components/ui/button";
import { Alert, Field, TextArea, TextInput } from "@/components/ui/field";
import { apiFetch, errorMessage, FetchError } from "@/lib/fetcher";
import { formatPhone } from "@/lib/format";

interface Settings {
  business_name: string;
  business_phone: string;
  whatsapp_number: string;
  mpesa_number: string;
  emola_number: string;
  bank_details: string;
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<Settings>("/api/settings")
      .then((s) =>
        setForm({
          ...s,
          whatsapp_number: formatPhone(s.whatsapp_number),
          mpesa_number: formatPhone(s.mpesa_number),
          emola_number: formatPhone(s.emola_number),
        }),
      )
      .catch((err) => setError(errorMessage(err)));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setErrors({});
    setError(null);
    setSaved(false);
    try {
      await apiFetch("/api/settings", { method: "PUT", body: form });
      setSaved(true);
    } catch (err) {
      if (err instanceof FetchError && err.details) {
        setErrors(Object.fromEntries(Object.entries(err.details).map(([k, v]) => [k, v?.[0] ?? ""])));
      }
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof Settings>(key: K, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  }

  return (
    <div className="flex-1">
      <AdminHeader title="Configurações" subtitle="Dados mostrados aos clientes na loja e na página do pedido" />

      <div className="max-w-3xl p-4 md:p-8">
        {!form ? (
          error ? <Alert>{error}</Alert> : <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={save} className="space-y-6">
            {error && <Alert onClose={() => setError(null)}>{error}</Alert>}
            {saved && <Alert tone="success" onClose={() => setSaved(false)}>Configurações guardadas.</Alert>}

            <section className="space-y-4 rounded-md border border-outline-variant bg-surface-container-lowest p-5">
              <h2 className="font-semibold text-on-surface">Negócio</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome" htmlFor="business_name" error={errors.business_name} required>
                  <TextInput id="business_name" value={form.business_name} onChange={(e) => set("business_name", e.target.value)} />
                </Field>
                <Field label="Telefone (mostrado no rodapé)" htmlFor="business_phone" error={errors.business_phone} required>
                  <TextInput id="business_phone" value={form.business_phone} onChange={(e) => set("business_phone", e.target.value)} />
                </Field>
                <Field label="WhatsApp de atendimento" htmlFor="whatsapp_number" error={errors.whatsapp_number} required hint="Recebe as mensagens dos clientes">
                  <TextInput id="whatsapp_number" type="tel" value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} />
                </Field>
              </div>
            </section>

            <section className="space-y-4 rounded-md border border-outline-variant bg-surface-container-lowest p-5">
              <div>
                <h2 className="font-semibold text-on-surface">Recebimentos</h2>
                <p className="text-body-sm text-on-surface-variant">Números para onde os clientes enviam o pagamento.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Número M-Pesa" htmlFor="mpesa_number" error={errors.mpesa_number} required>
                  <TextInput id="mpesa_number" type="tel" value={form.mpesa_number} onChange={(e) => set("mpesa_number", e.target.value)} />
                </Field>
                <Field label="Número e-Mola" htmlFor="emola_number" error={errors.emola_number} required>
                  <TextInput id="emola_number" type="tel" value={form.emola_number} onChange={(e) => set("emola_number", e.target.value)} />
                </Field>
                <Field
                  label="Dados bancários (opcional)"
                  htmlFor="bank_details"
                  className="sm:col-span-2"
                  hint="Se preenchido, a loja passa a oferecer pagamento por transferência bancária."
                >
                  <TextArea
                    id="bank_details"
                    rows={4}
                    value={form.bank_details}
                    onChange={(e) => set("bank_details", e.target.value)}
                    placeholder={"Banco: …\nTitular: …\nNIB: …"}
                  />
                </Field>
              </div>
            </section>

            <Button type="submit" disabled={saving} className="h-11 bg-primary px-8 text-on-primary hover:bg-primary/90">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Guardar configurações
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
