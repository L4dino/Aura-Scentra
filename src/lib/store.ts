import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Produto } from "./types";

const clientStorage = createJSONStorage(() => localStorage);

interface CartState {
  items: CartItem[];
  add: (p: Produto, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p, qty = 1) =>
        set((s) => {
          const ex = s.items.find((i) => i.produto.id === p.id);
          if (ex) {
            return {
              items: s.items.map((i) =>
                i.produto.id === p.id ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { produto: p, qty }] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.produto.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.produto.id === id ? { ...i, qty: Math.max(1, qty) } : i,
          ),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.produto.preco * i.qty, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: "aura-cart",
      storage: clientStorage,
      skipHydration: true,
    },
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
    {
      name: "aura-ref",
      storage: clientStorage,
      skipHydration: true,
    },
  ),
);