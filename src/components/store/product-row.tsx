"use client";

import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatMT, formatNumber } from "@/lib/format";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductImage } from "./product-image";
import { openCartDrawer } from "./store-header";

/** Linha da lista "Stock e condições" (fundo escuro). */
export function ProductRow({ product, maxAvailable }: { product: CatalogProduct; maxAvailable: number }) {
  const { cart, addToCart } = useCart();
  const inCart = cart.some((i) => i.productId === product.id);
  const soldOut = product.available < product.minimumOrder;
  const level = maxAvailable > 0 ? Math.max(0.04, product.available / maxAvailable) : 0;
  const bars = 24;

  return (
    <div className="group grid grid-cols-1 items-center gap-6 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 md:grid-cols-12 md:p-6">
      <div className="flex items-center gap-6 md:col-span-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white md:h-24 md:w-24">
          <ProductImage type={product.type} label={product.label} imageUrl={product.imageUrl} className="h-full w-full" />
        </div>
        <div>
          <h4 className="font-display text-xl font-light text-white">{product.label}</h4>
          {product.description && (
            <p className="mt-1 text-xs uppercase tracking-wider text-white/40">{product.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-4 border-white/10 md:col-span-6 md:border-l md:pl-6">
        <Spec label="Mínimo" value={`${formatNumber(product.minimumOrder)} un.`} />
        <Spec label="Múltiplos de" value={`${formatNumber(product.orderStep)} un.`} />
        <Spec label="Disponível" value={soldOut ? "Esgotado" : `${formatNumber(product.available)} un.`} />
        <div className="col-span-3 mt-1">
          <div className="mb-1 flex items-center justify-between text-xs text-white/30">
            <span>Nível de stock</span>
            <span>{Math.round(level * 100)}%</span>
          </div>
          <div className="flex h-8 w-full items-end gap-0.5" aria-hidden="true">
            {Array.from({ length: bars }, (_, i) => {
              const on = i < Math.round(level * bars);
              const h = 35 + ((i * 37) % 55);
              return (
                <div
                  key={i}
                  className={on ? "w-1 rounded-t-sm bg-white/60" : "w-1 rounded-t-sm bg-white/10"}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 md:col-span-2 md:justify-end">
        <span className="font-price text-xl text-white">{formatMT(product.price)}</span>
        <button
          onClick={() => {
            if (inCart) return openCartDrawer();
            addToCart({
              productId: product.id,
              label: product.label,
              price: product.price,
              minimumOrder: product.minimumOrder,
              orderStep: product.orderStep,
            });
            openCartDrawer();
          }}
          disabled={soldOut}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-black group-hover:border-white disabled:opacity-30"
          aria-label={inCart ? "Ver carrinho" : `Adicionar ${product.label}`}
        >
          {inCart ? <Check className="h-[18px] w-[18px]" /> : <ShoppingCart className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-white/50">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}
