import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  CreditCard,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plus,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatMT, whatsappLink } from "@/lib/format";
import { ProductCard } from "@/components/store/product-card";
import { ProductRow } from "@/components/store/product-row";
import { CatalogSync } from "@/components/store/catalog-sync";
import { HeroImage, ProductImage } from "@/components/store/product-image";

const steps = [
  { icon: PackageCheck, title: "Escolha", desc: "Seleccione o tipo de bloco e a quantidade. O stock mostrado é o real da fábrica." },
  { icon: MapPin, title: "Entrega", desc: "Indique a zona e o endereço da obra. A taxa de entrega aparece logo." },
  { icon: CreditCard, title: "Pagamento", desc: "Pague por M-Pesa ou e-Mola e indique a referência da transacção." },
  { icon: Truck, title: "Recebe", desc: "Confirmamos o pagamento e levamos os blocos até à sua obra." },
];

const faqs = [
  {
    q: "Quanto tempo demora a entrega?",
    a: "Em Nampula Cidade entregamos normalmente em 24 a 48 horas úteis após a confirmação do pagamento. Para outros distritos combinamos a data consigo.",
  },
  {
    q: "Posso pagar na entrega?",
    a: "Para encomendas grandes pedimos o pagamento antecipado por M-Pesa ou e-Mola. Fale connosco pelo WhatsApp se precisar de outra solução.",
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

function SectionNumber({ n, className }: { n: string; className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 select-none font-display font-bold leading-none ${className}`}
    >
      {n}
    </div>
  );
}

export default async function StorefrontPage() {
  await connection();
  const [{ products, zones }, settings] = await Promise.all([getCatalog(), getSettings()]);
  const cheapestZone = zones.reduce<number | null>((min, z) => (min === null || z.fee < min ? z.fee : min), null);
  const maxAvailable = Math.max(0, ...products.map((p) => p.available));
  const featured = products.find((p) => p.type === "15cm") ?? products[0];
  const orcamento = whatsappLink(settings.whatsapp_number, "Olá! Gostaria de um orçamento para blocos.");

  return (
    <>
      <CatalogSync products={products} />

      {/* ── 01 · Hero ── */}
      <header className="relative -mt-28 flex min-h-[860px] w-full items-center overflow-hidden bg-neutral-950 text-white">
        <SectionNumber n="01" className="right-6 top-32 text-[10rem] text-white/5 md:right-12" />
        <div className="absolute inset-0 z-0">
          <HeroImage
            src="/images/hero.jpg"
            alt="Camião a carregar paletes de blocos de cimento no estaleiro da SSP"
            className="h-full w-full opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-40 md:grid-cols-2 md:px-12">
          <div className="reveal-now">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-white/80">Bloco Seguro · Nampula</span>
            </div>
            <h1 className="mb-6 font-display text-[3.4rem] font-light leading-[0.9] tracking-tighter sm:text-[4.5rem] lg:text-[5.5rem]">
              Construa com
              <span className="block italic text-white/50">blocos seguros.</span>
            </h1>
            <p className="max-w-lg border-l border-white/20 pl-6 text-lg font-light leading-relaxed text-white/70 md:text-xl">
              Blocos de cimento e pavê produzidos pela SSP em Nampula. Encomende online, pague por M-Pesa ou e-Mola e
              receba na sua obra.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="#catalogo"
                className="group flex items-center gap-2 rounded-full bg-white px-8 py-4 font-medium text-black transition-colors hover:bg-neutral-200"
              >
                Ver catálogo
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={orcamento}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-4 font-medium text-white transition-colors hover:bg-white/10"
              >
                <MessageCircle className="h-5 w-5" /> Pedir orçamento
              </a>
            </div>
          </div>

          {featured && (
            <div className="reveal-now reveal-d3 relative flex items-center justify-center md:justify-end">
              <div className="relative aspect-[3/4] w-full max-w-sm">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent opacity-30 blur-3xl" />
                <div className="animate-float relative z-10 h-full w-full overflow-hidden rounded-[32px] border border-white/10 shadow-2xl">
                  <ProductImage
                    type={featured.type}
                    label={featured.label}
                    imageUrl={featured.imageUrl}
                    className="h-full w-full"
                  />
                </div>

                <div className="absolute -bottom-8 -left-4 z-20 w-72 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-xl md:-left-12">
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-xs uppercase tracking-widest text-white/50">Stock hoje</span>
                    <div className="flex h-4 items-end gap-1" aria-hidden="true">
                      {products.slice(0, 4).map((p, i) => (
                        <div
                          key={p.id}
                          className="w-1 animate-pulse rounded-full bg-white/80"
                          style={{
                            height: `${Math.max(25, maxAvailable ? (p.available / maxAvailable) * 100 : 25)}%`,
                            animationDelay: `${0.1 * (i + 1)}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4 text-sm text-white/80">
                    <div className="flex items-center gap-3">
                      <Truck className="h-[18px] w-[18px]" />
                      <span>{cheapestZone !== null ? `Entrega desde ${formatMT(cheapestZone)}` : "Entrega na província"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-[18px] w-[18px]" />
                      <span>Stock reservado no pedido</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-[18px] w-[18px]" />
                      <span>M-Pesa e e-Mola</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── 02 · Catálogo ── */}
      <section id="catalogo" className="relative scroll-mt-24 overflow-hidden bg-[#fdfdfd] py-24 text-neutral-900 md:py-32">
        <SectionNumber n="02" className="left-6 top-12 text-[12rem] text-black opacity-[0.06] md:left-12" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-12">
          <div className="reveal mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div>
              <span className="mb-4 block text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">Catálogo</span>
              <h2 className="font-display text-5xl font-light leading-[0.95] tracking-tighter md:text-7xl">
                Escolha o seu
                <br />
                <span className="text-neutral-300">bloco.</span>
              </h2>
            </div>
            <p className="max-w-sm border-l border-neutral-200 pl-6 text-lg font-light text-neutral-500">
              Preços por unidade, com stock actualizado em tempo real. As unidades ficam reservadas assim que encomenda.
            </p>
          </div>

          {products.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-neutral-300 p-12 text-center text-neutral-500">
              O catálogo está a ser actualizado. Contacte-nos pelo WhatsApp para encomendar.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} className={`reveal reveal-d${Math.min(i + 1, 4)}`} />
              ))}
            </div>
          )}

          <div className="reveal mt-16 flex justify-center">
            <Link
              href="/checkout"
              className="group flex items-center gap-3 rounded-full bg-neutral-900 px-8 py-4 text-white shadow-lg transition-all hover:bg-neutral-800 hover:shadow-xl"
            >
              <span className="font-medium tracking-wide">Finalizar encomenda</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 03 · Stock e condições ── */}
      {products.length > 0 && (
        <section id="detalhes" className="relative scroll-mt-24 border-t border-white/5 bg-neutral-950 px-6 py-24">
          <SectionNumber n="03" className="right-6 top-12 text-[10rem] text-white/5 md:right-12" />
          <div className="relative z-10 mx-auto w-full max-w-5xl">
            <div className="reveal mb-16 text-center">
              <h3 className="mb-4 font-display text-3xl font-light text-white md:text-5xl">Stock e condições</h3>
              <p className="text-white/50">Quantidades mínimas, múltiplos de encomenda e stock disponível hoje.</p>
            </div>
            <div className="flex flex-col gap-4">
              {products.map((p, i) => (
                <div key={p.id} className={`reveal reveal-d${Math.min(i + 1, 4)}`}>
                  <ProductRow product={p} maxAvailable={maxAvailable} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 04 · Entregas ── */}
      <section id="entregas" className="relative scroll-mt-24 border-t border-white/5 bg-neutral-950 px-6 py-24">
        <SectionNumber n="04" className="left-6 top-12 text-[10rem] text-white/5 md:left-12" />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="reveal mb-16 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div>
              <span className="mb-4 block text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">Entregas</span>
              <h2 className="font-display text-5xl font-light leading-[0.95] tracking-tighter text-white md:text-6xl">
                Entregamos na
                <br />
                <span className="text-white/50">sua obra.</span>
              </h2>
            </div>
            <p className="max-w-md border-l border-white/10 pl-6 text-lg font-light text-white/60">
              Frota própria preparada para terrenos difíceis. Cada bloco chega inteiro, do carregamento à descarga.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col gap-3 lg:col-span-8">
              {zones.map((z) => (
                <div
                  key={z.id}
                  className="reveal group grid grid-cols-12 items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10"
                >
                  <div className="col-span-8 flex items-center gap-5 md:col-span-9">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors group-hover:bg-white group-hover:text-black">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg font-normal text-white transition-transform group-hover:translate-x-1">
                        {z.name}
                      </h4>
                      <p className="mt-1 text-sm text-white/40">Província de Nampula</p>
                    </div>
                  </div>
                  <div className="col-span-4 flex justify-end md:col-span-3">
                    <span className="font-price text-xl text-white">{formatMT(z.fee)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4 lg:pl-4">
              <div className="reveal sticky top-32 overflow-hidden rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md">
                <HeroImage
                  src="/images/fabrica.jpg"
                  alt="Estaleiro da SSP com paletes de blocos e camião"
                  className="h-48 w-full"
                />
                <div className="p-8">
                  <h3 className="mb-3 font-display text-xl font-light text-white">A nossa fábrica</h3>
                  <p className="mb-6 flex items-start gap-2 text-sm text-white/60">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    Muahivire Expansão, próximo ao Hospital do Control, Nampula
                  </p>
                  <a
                    href={orcamento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
                  >
                    <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 05 · Como encomendar ── */}
      <section id="como-funciona" className="relative scroll-mt-24 border-t border-neutral-200 bg-[#f8f8f8] px-6 py-32 text-neutral-900">
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="reveal mb-24 flex flex-col items-center text-center">
            <span className="mb-4 block text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">Processo</span>
            <h2 className="mb-6 font-display text-4xl font-light md:text-5xl">Como encomendar</h2>
            <p className="max-w-xl text-lg font-light text-neutral-500">
              Tudo online e pelo telemóvel. Sem deslocações e sem filas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className={`reveal reveal-d${i + 1} group rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-900 transition-colors group-hover:bg-neutral-900 group-hover:text-white">
                  <s.icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Passo {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mb-3 font-display text-xl font-medium">{s.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="reveal mt-16 flex justify-center">
            <Link
              href="/acompanhar"
              className="inline-flex items-center gap-2 border-b border-neutral-900 pb-0.5 text-neutral-900 transition-colors hover:border-neutral-600 hover:text-neutral-600"
            >
              Já encomendou? Acompanhe o pedido <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mx-auto mt-32 max-w-3xl">
            <h3 className="reveal mb-8 text-center font-display text-3xl font-light">Perguntas frequentes</h3>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="reveal group rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow open:shadow-lg"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-normal">
                    {f.q}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition-transform group-open:rotate-45">
                      <Plus className="h-4 w-4" />
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
