'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { CartItem } from '@/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQty: (type: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Carregar do localStorage ao montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem('blok_cart');
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);

  // Guardar no localStorage sempre que o cart muda
  useEffect(() => {
    localStorage.setItem('blok_cart', JSON.stringify(cart));
  }, [cart]);

  function addToCart(item: CartItem) {
    setCart(prev => {
      const existing = prev.find(i => i.type === item.type);
      if (existing) {
        return prev.map(i => i.type === item.type
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
        );
      }
      return [...prev, item];
    });
  }

  function updateQty(type: string, delta: number) {
    setCart(prev => prev
      .map(i => i.type === type ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
      .filter(i => i.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
    localStorage.removeItem('blok_cart');
  }

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}