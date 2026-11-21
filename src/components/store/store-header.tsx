"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatMT, formatNumber } from "@/lib/format";
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

export function StoreHeader({ businessName }: { businessName: string }) {
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
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label={`${businessName} — início`}>
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-on-primary">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <rect x="2" y="5" width="9" height="6" rx="1" />
                <rect x="13" y="5" width="9" height="6" rx="1" />
                <rect x="7" y="13" width="10" height="6" rx="1" />
              </svg>
            </span>
            <span className="text-[18px] font-bold tracking-tight text-on-surface">BlokManager</span>
          </Link>

          <nav className="hidden items-center gap-7 text-body-sm font-medium text-on-surface-variant md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "transition-colors hover:text-primary",
                  pathname === l.href && "text-primary",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!inCheckout && (
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex h-10 items-center gap-2 rounded-md border border-outline-variant bg-white px-3 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                aria-label={`Abrir carrinho (${totalItems} unidades)`}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Carrinho</span>
                {totalItems > 0 && (
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] font-bold leading-none text-on-secondary tabular-nums">
                    {formatNumber(totalItems)}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="grid h-10 w-10 place-items-center rounded-md text-on-surface md:hidden"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-outline-variant bg-white px-4 py-2 md:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-2 py-3 text-body-sm font-medium text-on-surface hover:bg-surface-container-low"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

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
    <div className="fixed inset-0 z-50 print:hidden" role="dialog" aria-modal="true" aria-label="Carrinho">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <h2 className="text-title-md font-semibold text-on-surface">O meu carrinho</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface-container-low" aria-label="Fechar carrinho">
            <X className="h-5 w-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingCart className="h-10 w-10 text-outline" />
            <p className="font-medium text-on-surface">O carrinho está vazio</p>
            <p className="text-body-sm text-on-surface-variant">Escolha os blocos no catálogo para começar.</p>
            <Button variant="outline" onClick={onClose} className="mt-2">
              Ver catálogo
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-outline-variant overflow-y-auto px-5">
              {cart.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-on-surface">{item.label}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      {formatMT(item.price)} / un. · mín. {formatNumber(item.minimumOrder)}
                    </p>
                    <p className="mt-1 text-body-sm font-semibold text-on-surface tabular-nums">
                      {formatMT(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center rounded-md border border-outline-variant">
                    <button
                      onClick={() => step(item.productId, -1)}
                      className="grid h-9 w-9 place-items-center hover:bg-surface-container-low"
                      aria-label={`Diminuir ${item.label}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-14 text-center text-body-sm font-semibold tabular-nums">
                      {formatNumber(item.quantity)}
                    </span>
                    <button
                      onClick={() => step(item.productId, 1)}
                      className="grid h-9 w-9 place-items-center hover:bg-surface-container-low"
                      aria-label={`Aumentar ${item.label}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="rounded-md p-2 text-on-surface-variant hover:bg-error-container hover:text-error"
                    aria-label={`Remover ${item.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-outline-variant px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-on-surface-variant">Subtotal</span>
                <span className="text-title-md font-bold text-on-surface tabular-nums">{formatMT(totalPrice)}</span>
              </div>
              <p className="text-[12px] text-on-surface-variant">A taxa de entrega é calculada no passo seguinte.</p>
              <Button
                className="h-12 w-full bg-primary text-base font-semibold text-on-primary hover:bg-primary/90"
                onClick={() => {
                  onClose();
                  router.push("/checkout");
                }}
              >
                Finalizar encomenda
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
