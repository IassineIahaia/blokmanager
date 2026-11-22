"use client";

import { ArrowUpRight, Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatMT, formatNumber } from "@/lib/format";
import type { CatalogProduct } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";
import { openCartDrawer } from "./store-header";

/** Cartão alto (formato retrato) com foto de fundo, como na referência. */
export function ProductCard({ product, className }: { product: CatalogProduct; className?: string }) {
  const { cart, addToCart, step } = useCart();
  const inCart = cart.find((i) => i.productId === product.id);
  const soldOut = product.available < product.minimumOrder;
  const lowStock = !soldOut && product.available < product.minimumOrder * 2;

  function add() {
    addToCart({
      productId: product.id,
      label: product.label,
      price: product.price,
      minimumOrder: product.minimumOrder,
      orderStep: product.orderStep,
    });
    openCartDrawer();
  }

  return (
    <article
      className={cn(
        "group relative flex h-[520px] w-full flex-col justify-between overflow-hidden rounded-[32px] bg-[#151515] p-7 transition-transform duration-500 hover:-translate-y-2 hover:shadow-2xl",
        className,
      )}
    >
      <div className="absolute inset-0">
        <ProductImage
          type={product.type}
          label={product.label}
          imageUrl={product.imageUrl}
          className="h-full w-full opacity-85 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/30 to-transparent" />
      </div>

      <div className="relative z-10 flex items-start justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider backdrop-blur-sm",
            soldOut
              ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
              : lowStock
                ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                : "border-white/15 bg-white/10 text-white/80",
          )}
        >
          {!soldOut && <span className={cn("h-1.5 w-1.5 rounded-full", lowStock ? "bg-amber-400" : "bg-green-400")} />}
          {soldOut ? "Esgotado" : lowStock ? "Últimas unidades" : "Em stock"}
        </span>
        <button
          onClick={inCart ? openCartDrawer : add}
          disabled={soldOut}
          className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/5 text-white opacity-60 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-white hover:text-black disabled:hidden"
          aria-label={inCart ? "Ver carrinho" : `Adicionar ${product.label}`}
        >
          {inCart ? <Check className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
        </button>
      </div>

      <div className="relative z-10 mt-auto">
        {product.description && (
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/50">{product.description}</p>
        )}
        <h3 className="mb-4 font-display text-3xl font-light leading-none tracking-tight text-white">{product.label}</h3>

        <div className="flex items-center justify-between border-t border-white/10 pt-5 text-white/90">
          <span className="font-price text-2xl">
            {formatMT(product.price)}
            <span className="ml-1 font-sans text-xs not-italic text-white/50">/ un.</span>
          </span>
          <span className="text-xs uppercase tracking-wide text-white/50">mín. {formatNumber(product.minimumOrder)} un.</span>
        </div>

        <div className="mt-5">
          {inCart ? (
            <div className="flex h-12 items-center justify-between rounded-full border border-white/15 bg-white/10 px-1 text-white backdrop-blur-sm">
              <button
                onClick={() => step(product.id, -1)}
                className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/15"
                aria-label={`Diminuir ${product.label}`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm tabular-nums">{formatNumber(inCart.quantity)} un.</span>
              <button
                onClick={() => step(product.id, 1)}
                disabled={inCart.quantity + product.orderStep > product.available}
                className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/15 disabled:opacity-30"
                aria-label={`Aumentar ${product.label}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={add}
              disabled={soldOut}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-medium text-black transition-colors hover:bg-neutral-200 disabled:bg-white/10 disabled:text-white/40"
            >
              {soldOut ? "Sem stock de momento" : <>Adicionar ao carrinho <Plus className="h-4 w-4" /></>}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
