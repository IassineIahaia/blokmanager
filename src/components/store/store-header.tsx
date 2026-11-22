"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, MessageCircle, Minus, PackageOpen, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatMT, formatNumber, whatsappLink } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Abre a gaveta do carrinho a partir de qualquer componente da loja. */
export function openCartDrawer() {
  window.dispatchEvent(new Event("blok:open-cart"));
}

const links = [
  { href: "/#catalogo", label: "Catálogo" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#entregas", label: "Entregas" },
  { href: "/acompanhar", label: "Acompanhar pedido" },
];

export function StoreHeader({ businessName, whatsappNumber }: { businessName: string; whatsappNumber: string }) {
  const { totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const open = () => setCartOpen(true);
    window.addEventListener("blok:open-cart", open);
    return () => window.removeEventListener("blok:open-cart", open);
  }, []);

  const inCheckout = pathname.startsWith("/checkout");

  return (
    <>
      <div className="fixed inset-x-0 top-4 z-40 flex justify-center px-4 sm:top-6 print:hidden">
        <header className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-neutral-950/85 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between py-2 pl-2 pr-2 sm:pr-4">
            <Link href="/" className="flex items-center gap-3 pl-3" aria-label={`${businessName} — início`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/ssp-logo-white.png" alt={businessName} width={800} height={238} className="h-7 w-auto" />
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-medium text-white/60 md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn("transition-colors hover:text-white", pathname === l.href && "text-white")}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <a
                href={whatsappLink(whatsappNumber, "Olá! Gostaria de um orçamento para blocos.")}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Falar no WhatsApp"
              >
                <MessageCircle className="h-[18px] w-[18px]" />
              </a>
              {!inCheckout && (
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative grid h-10 w-10 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={`Abrir carrinho (${totalItems} unidades)`}
                >
                  <ShoppingBag className="h-[18px] w-[18px]" />
                  {totalItems > 0 && (
                    <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-medium leading-none text-black tabular-nums">
                      {totalItems > 999 ? "999+" : formatNumber(totalItems)}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white md:hidden"
                aria-label="Menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="grid gap-1 border-t border-white/10 p-3 md:hidden">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
        </header>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, step, removeItem, totalPrice } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 print:hidden" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-black/5 bg-white shadow-2xl animate-in slide-in-from-right sm:w-[420px]">
        <header className="flex h-14 items-center justify-between border-b border-black/5 px-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-black/70" />
            <h2 id="cart-title" className="font-display text-lg font-light tracking-tight">
              O meu carrinho
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/5 text-black/70 transition hover:bg-black/5"
            aria-label="Fechar carrinho"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 text-black/60">
              <PackageOpen className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-black">O carrinho está vazio</p>
            <p className="mt-1 text-sm text-black/60">Escolha os blocos no catálogo para começar.</p>
            <button
              onClick={onClose}
              className="mt-5 h-9 rounded-xl border border-black/5 bg-white px-4 text-sm text-black/70 transition hover:bg-black/5"
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-3 overflow-y-auto p-5">
              {cart.map((item) => (
                <li key={item.productId} className="rounded-2xl border border-black/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium tracking-tight text-black">{item.label}</p>
                      <p className="text-xs text-black/50">
                        {formatMT(item.price)} / un. · mín. {formatNumber(item.minimumOrder)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="rounded-lg p-1.5 text-black/40 transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Remover ${item.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex h-9 items-center rounded-xl border border-black/5 bg-black/[0.02]">
                      <button
                        onClick={() => step(item.productId, -1)}
                        className="grid h-full w-9 place-items-center rounded-l-xl text-black/70 transition hover:bg-black/5"
                        aria-label={`Diminuir ${item.label}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-14 text-center text-sm font-medium tabular-nums">
                        {formatNumber(item.quantity)}
                      </span>
                      <button
                        onClick={() => step(item.productId, 1)}
                        className="grid h-full w-9 place-items-center rounded-r-xl text-black/70 transition hover:bg-black/5"
                        aria-label={`Aumentar ${item.label}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-medium tabular-nums text-black">{formatMT(item.price * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-black/5 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-black/60">Subtotal</span>
                <span className="font-price text-2xl text-black">{formatMT(totalPrice)}</span>
              </div>
              <p className="text-xs text-black/50">A taxa de entrega é calculada no passo seguinte.</p>
              <button
                className="h-12 w-full rounded-full bg-neutral-900 text-sm font-medium text-white transition hover:bg-neutral-800"
                onClick={() => {
                  onClose();
                  router.push("/checkout");
                }}
              >
                Finalizar encomenda
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
