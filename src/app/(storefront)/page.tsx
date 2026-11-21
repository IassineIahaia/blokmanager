import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatMT, whatsappLink } from "@/lib/format";
import { ProductCard } from "@/components/store/product-card";
import { CatalogSync } from "@/components/store/catalog-sync";
import { BlockIllustration } from "@/components/store/block-illustration";

const steps = [
  {
    icon: PackageCheck,
    title: "Escolha os blocos",
    desc: "Seleccione o tipo e a quantidade. O stock mostrado é o real da fábrica.",
  },
  {
    icon: MapPin,
    title: "Indique a entrega",
    desc: "Escolha a zona e o endereço. A taxa de entrega é calculada logo.",
  },
  {
    icon: CreditCard,
    title: "Pague por M-Pesa ou e-Mola",
    desc: "Envie o pagamento e indique a referência. Confirmamos e agendamos a entrega.",
  },
];

const faqs = [
  {
    q: "Quanto tempo demora a entrega?",
    a: "Em Nampula Cidade entregamos normalmente em 24 a 48 horas úteis após a confirmação do pagamento. Para outros distritos combinamos a data consigo.",
  },
  {
    q: "Posso pagar na entrega?",
    a: "Para encomendas grandes pedimos o pagamento antecipado por M-Pesa, e-Mola ou transferência. Fale connosco pelo WhatsApp se precisar de outra solução.",
  },
  {
    q: "Os blocos reservados ficam garantidos?",
    a: "Sim. Assim que faz o pedido, as unidades ficam reservadas para si no nosso stock até à entrega ou cancelamento.",
  },
  {
    q: "Como acompanho o meu pedido?",
    a: "Depois de encomendar recebe um link do pedido. Também pode usar a página “Acompanhar pedido” com o código e o seu telefone.",
  },
];

export default async function StorefrontPage() {
  await connection();
  const [{ products, zones }, settings] = await Promise.all([getCatalog(), getSettings()]);
  const cheapestZone = zones.reduce<number | null>((min, z) => (min === null || z.fee < min ? z.fee : min), null);

  return (
    <>
      <CatalogSync products={products} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-inverse-surface text-white">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 24px",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.2fr_1fr] md:px-8 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium">
              <span className="h-2 w-2 rounded-full bg-primary-container" /> Produção própria em Nampula
            </span>
            <h1 className="mt-5 text-[34px] font-bold leading-[1.1] tracking-tight md:text-[52px]">
              Blocos de cimento com entrega <span className="text-primary-container">na sua obra.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/75">
              Encomende online em minutos, pague por M-Pesa ou e-Mola e acompanhe a entrega. Material resistente
              para construção civil em Nampula, Nacala e arredores.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#catalogo"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-secondary px-6 font-semibold text-on-secondary transition-colors hover:bg-secondary/90"
              >
                Ver preços e encomendar <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={whatsappLink(settings.whatsapp_number, "Olá! Gostaria de um orçamento para blocos.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/25 px-6 font-medium transition-colors hover:bg-white/10"
              >
                <MessageCircle className="h-4 w-4" /> Pedir orçamento
              </a>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6 text-center md:text-left">
              <div>
                <dt className="text-[12px] text-white/60">Desde</dt>
                <dd className="text-[20px] font-bold">
                  {products.length ? formatMT(Math.min(...products.map((p) => p.price))) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-white/60">Entrega desde</dt>
                <dd className="text-[20px] font-bold">{cheapestZone !== null ? formatMT(cheapestZone) : "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-white/60">Zonas</dt>
                <dd className="text-[20px] font-bold">{zones.length}</dd>
              </div>
            </dl>
          </div>

          <div className="relative hidden h-[340px] md:block" aria-hidden="true">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl" />
            <BlockIllustration type="15cm" className="absolute left-0 top-4 h-48 drop-shadow-2xl" />
            <BlockIllustration type="12cm" className="absolute right-0 top-28 h-44 drop-shadow-2xl" />
            <BlockIllustration type="pave" className="absolute bottom-0 left-16 h-40 drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ── Garantias ── */}
      <section className="border-b border-outline-variant bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 text-body-sm sm:grid-cols-3 md:px-8">
          {[
            { icon: BadgeCheck, t: "Qualidade controlada", d: "Cura completa antes da venda" },
            { icon: ShieldCheck, t: "Stock reservado", d: "As suas unidades ficam garantidas" },
            { icon: Truck, t: "Frota própria", d: "Descarga em terrenos difíceis" },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-on-surface">{t}</p>
                <p className="text-on-surface-variant">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catálogo ── */}
      <section id="catalogo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <div>
            <p className="text-label-caps uppercase text-primary">Catálogo</p>
            <h2 className="mt-1 text-[28px] font-bold tracking-tight text-on-surface md:text-[34px]">Os nossos produtos</h2>
          </div>
          <p className="text-body-sm text-on-surface-variant">Preços por unidade. Stock actualizado em tempo real.</p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-outline-variant bg-white p-10 text-center text-on-surface-variant">
            O catálogo está a ser actualizado. Contacte-nos pelo WhatsApp para encomendar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="scroll-mt-20 bg-surface-container-low py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-label-caps uppercase text-primary">Simples e rápido</p>
            <h2 className="mt-1 text-[28px] font-bold tracking-tight text-on-surface md:text-[34px]">Como encomendar</h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="relative rounded-lg border border-outline-variant bg-white p-6">
                <span className="absolute right-5 top-4 text-[40px] font-bold leading-none text-surface-container-highest">
                  {i + 1}
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-on-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-on-surface">{s.title}</h3>
                <p className="mt-2 text-body-sm leading-relaxed text-on-surface-variant">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Entregas ── */}
      <section id="entregas" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="h-[320px] overflow-hidden rounded-lg border border-outline-variant">
            <iframe
              title="Mapa da província de Nampula"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src="https://www.openstreetmap.org/export/embed.html?bbox=38.9%2C-16.4%2C40.9%2C-14.3&layer=mapnik&marker=-15.1165%2C39.2666"
            />
          </div>
          <div>
            <p className="text-label-caps uppercase text-primary">Entregas</p>
            <h2 className="mt-1 text-[28px] font-bold tracking-tight text-on-surface md:text-[34px]">
              Entregamos onde estiver a sua obra
            </h2>
            <p className="mt-3 text-body-sm leading-relaxed text-on-surface-variant">
              A nossa frota está preparada para terrenos de difícil acesso. Garantimos a integridade de cada bloco
              desde o carregamento até à descarga.
            </p>
            <ul className="mt-6 divide-y divide-outline-variant rounded-lg border border-outline-variant bg-white">
              {zones.map((z) => (
                <li key={z.id} className="flex items-center justify-between px-4 py-3 text-body-sm">
                  <span className="flex items-center gap-2 text-on-surface">
                    <MapPin className="h-4 w-4 text-primary" /> {z.name}
                  </span>
                  <span className="font-semibold text-on-surface tabular-nums">{formatMT(z.fee)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-surface-container-low py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="text-center text-[28px] font-bold tracking-tight text-on-surface">Perguntas frequentes</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-lg border border-outline-variant bg-white p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-on-surface">
                  {f.q}
                  <span className="ml-4 text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-body-sm leading-relaxed text-on-surface-variant">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
