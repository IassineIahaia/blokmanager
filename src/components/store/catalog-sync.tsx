"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import type { CatalogProduct } from "@/lib/catalog";

/** Mantém preços e nomes do carrinho alinhados com o catálogo actual. */
export function CatalogSync({ products }: { products: CatalogProduct[] }) {
  const { syncWithCatalog } = useCart();
  useEffect(() => {
    syncWithCatalog(products);
  }, [products, syncWithCatalog]);
  return null;
}
