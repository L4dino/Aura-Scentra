import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Produto } from "./types";

interface CartState {
  items: CartItem[];
  ownerId: string | null;
  add: (p: Produto, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOwner: (id: string | null) => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerId: null,
      add: (p, qty = 1) =>
        set((s) => {
          const ex = s.items.find((i) => i.produto.id === p.id);
          if (ex) {
            return {
              items: s.items.map((i) =>
                i.produto.id === p.id ? { ...i, qty: i.qty + qty, por_encomenda: (p.stock ?? 0) <= 0 } : i,
              ),
            };
          }
          return { items: [...s.items, { produto: p, qty, por_encomenda: (p.stock ?? 0) <= 0 }] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.produto.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.produto.id === id ? { ...i, qty: Math.max(1, qty) } : i,
          ),
        })),
      clear: () => set({ items: [] }),
      setOwner: (id) =>
        set((s) => {
          if (s.ownerId === id) return s;
          // Initial guest -> login: keep cart, just claim ownership.
          if (s.ownerId === null && id !== null) return { ownerId: id };
          // Logout or account swap: empty the cart.
          return { ownerId: id, items: [] };
        }),
      total: () => get().items.reduce((sum, i) => sum + i.produto.preco * i.qty, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "aura-cart" },
  ),
);

interface RefState {
  ref: string | null;
  setRef: (r: string) => void;
}

export const useReferral = create<RefState>()(
  persist(
    (set) => ({
      ref: null,
      setRef: (r) => set({ ref: r }),
    }),
    { name: "aura-ref" },
  ),
);