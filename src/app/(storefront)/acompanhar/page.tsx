"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Field, TextInput } from "@/components/ui/field";
import { apiFetch, errorMessage } from "@/lib/fetcher";

export default function TrackOrderPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token } = await apiFetch<{ token: string }>("/api/acompanhar", {
        method: "POST",
        body: { code, phone },
      });
      router.push(`/pedido/${token}`);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Search className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-[26px] font-bold tracking-tight text-on-surface">Acompanhar pedido</h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Indique o código do pedido (ex.: BM-0012) e o telefone usado na encomenda.
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-lg border border-outline-variant bg-white p-6">
        {error && <Alert onClose={() => setError(null)}>{error}</Alert>}
        <Field label="Código do pedido" htmlFor="code" required>
          <TextInput id="code" placeholder="BM-0012" value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="off" />
        </Field>
        <Field label="Telefone" htmlFor="phone" required>
          <TextInput id="phone" type="tel" inputMode="tel" placeholder="84 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </Field>
        <Button type="submit" disabled={loading} className="h-11 w-full bg-primary font-semibold text-on-primary hover:bg-primary/90">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ver o meu pedido
        </Button>
      </form>
    </div>
  );
}
