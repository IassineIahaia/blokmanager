'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

/** Linha do carrinho. Os preços aqui são só para mostrar: o servidor recalcula tudo no checkout. */
export interface CartItem {
  productId: string;
  label: string;
  price: number;
  minimumOrder: number;
  orderStep: number;
  quantity: number;
}

const STORAGE_KEY = 'blok_cart_v2';
const EMPTY: CartItem[] = [];

// ── Store externo (localStorage + subscritores) ──
let current: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (current) return current;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    current = Array.isArray(parsed) ? parsed : [];
  } catch {
    current = [];
  }
  return current!;
}

function write(next: CartItem[]) {
  current = next;
  try {
    if (next.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // modo privado / armazenamento bloqueado: o carrinho fica só em memória
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      current = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Arredonda para o mínimo e múltiplos do incremento a partir do mínimo. */
export function clampQuantity(item: Pick<CartItem, 'minimumOrder' | 'orderStep'>, qty: number) {
  if (qty <= 0) return 0;
  return Math.max(item.minimumOrder, Math.round(qty));
}

export function useCart() {
  const cart = useSyncExternalStore(subscribe, read, () => EMPTY);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity = item.minimumOrder) => {
    const list = read();
    const existing = list.find((i) => i.productId === item.productId);
    write(
      existing
        ? list.map((i) => (i.productId === item.productId ? { ...i, ...item, quantity: i.quantity + quantity } : i))
        : [...list, { ...item, quantity: clampQuantity(item, quantity) }],
    );
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    write(
      read()
        .map((i) => (i.productId === productId ? { ...i, quantity: clampQuantity(i, quantity) } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  /** Soma/subtrai um incremento; abaixo do mínimo remove o produto. */
  const step = useCallback((productId: string, direction: 1 | -1) => {
    const item = read().find((i) => i.productId === productId);
    if (!item) return;
    const next = item.quantity + direction * item.orderStep;
    write(
      read()
        .map((i) => (i.productId === productId ? { ...i, quantity: next < i.minimumOrder ? 0 : next } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    write(read().filter((i) => i.productId !== productId));
  }, []);

  /** Actualiza preços/nomes com os dados mais recentes do catálogo e remove produtos que já não existem. */
  const syncWithCatalog = useCallback(
    (products: { id: string; label: string; price: number; minimumOrder: number; orderStep: number }[]) => {
      const list = read();
      if (!list.length) return;
      const byId = new Map(products.map((p) => [p.id, p]));
      const next = list
        .filter((i) => byId.has(i.productId))
        .map((i) => {
          const p = byId.get(i.productId)!;
          return {
            ...i,
            label: p.label,
            price: p.price,
            minimumOrder: p.minimumOrder,
            orderStep: p.orderStep,
            quantity: Math.max(i.quantity, p.minimumOrder),
          };
        });
      if (JSON.stringify(next) !== JSON.stringify(list)) write(next);
    },
    [],
  );

  const clearCart = useCallback(() => write([]), []);

  const totals = useMemo(
    () => ({
      totalItems: cart.reduce((s, i) => s + i.quantity, 0),
      totalPrice: cart.reduce((s, i) => s + i.quantity * i.price, 0),
    }),
    [cart],
  );

  return { cart, addToCart, setQuantity, step, removeItem, syncWithCatalog, clearCart, ...totals };
}
