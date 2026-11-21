"use client";

import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatMT, formatNumber } from "@/lib/format";
import type { CatalogProduct } from "@/lib/catalog";
import { BlockIllustration } from "./block-illustration";
import { openCartDrawer } from "./store-header";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { cart, addToCart, step } = useCart();
  const inCart = cart.find((i) => i.productId === product.id);
  const soldOut = product.available < product.minimumOrder;
  const lowStock = !soldOut && product.available < product.minimumOrder * 2;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-white transition-shadow hover:shadow-lg">
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-b from-surface-container-low to-surface-container">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.label} className="h-full w-full object-cover" />
        ) : (
          <BlockIllustration type={product.type} className="h-36 transition-transform group-hover:scale-105" />
        )}
        <span
          className={
            soldOut
              ? "absolute left-3 top-3 rounded-sm bg-error-container px-2 py-0.5 text-label-caps text-on-error-container"
              : lowStock
                ? "absolute left-3 top-3 rounded-sm bg-secondary-container px-2 py-0.5 text-label-caps text-on-secondary-container"
                : "absolute left-3 top-3 rounded-sm bg-primary px-2 py-0.5 text-label-caps text-on-primary"
          }
        >
          {soldOut ? "Esgotado" : lowStock ? "Últimas unidades" : "Disponível"}
        </span>
        {inCart && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-sm bg-on-surface px-2 py-0.5 text-label-caps text-white">
            <Check className="h-3 w-3" /> {formatNumber(inCart.quantity)} un.
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-on-surface">{product.label}</h3>
          {product.description && (
            <p className="text-label-caps uppercase text-primary">{product.description}</p>
          )}
          {product.details && (
            <p className="mt-2 text-body-sm leading-relaxed text-on-surface-variant">{product.details}</p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-outline-variant pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Preço unitário</p>
            <p className="text-[22px] font-bold leading-tight text-on-surface tabular-nums">{formatMT(product.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Mínimo</p>
            <p className="text-body-sm font-medium text-on-surface">{formatNumber(product.minimumOrder)} un.</p>
          </div>
        </div>

        {inCart ? (
          <div className="flex items-center gap-2">
            <div className="flex h-11 flex-1 items-center justify-between rounded-md border border-outline-variant">
              <button
                onClick={() => step(product.id, -1)}
                className="grid h-full w-11 place-items-center hover:bg-surface-container-low"
                aria-label={`Diminuir ${product.label}`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-body-sm font-semibold tabular-nums">{formatNumber(inCart.quantity)}</span>
              <button
                onClick={() => step(product.id, 1)}
                disabled={inCart.quantity + product.orderStep > product.available}
                className="grid h-full w-11 place-items-center hover:bg-surface-container-low disabled:opacity-40"
                aria-label={`Aumentar ${product.label}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button variant="outline" className="h-11" onClick={openCartDrawer}>
              Ver carrinho
            </Button>
          </div>
        ) : (
          <Button
            disabled={soldOut}
            onClick={() => {
              addToCart({
                productId: product.id,
                label: product.label,
                price: product.price,
                minimumOrder: product.minimumOrder,
                orderStep: product.orderStep,
              });
              openCartDrawer();
            }}
            className="h-11 w-full bg-primary font-semibold text-on-primary hover:bg-primary/90"
          >
            {soldOut ? "Sem stock de momento" : `Adicionar ${formatNumber(product.minimumOrder)} un.`}
          </Button>
        )}
      </div>
    </article>
  );
}
