import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Produto } from "./types";

export interface RequisicaoCartItem {
  produto: Produto;
  qty: number;
  observacao?: string;
}

interface ReqState {
  items: RequisicaoCartItem[];
  ownerId: string | null;
  add: (p: Produto, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  setObs: (id: string, observacao: string) => void;
  clear: () => void;
  setOwner: (id: string | null) => void;
  totalEstimado: () => number;
  count: () => number;
}

export const useRequisicao = create<ReqState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerId: null,
      add: (p, qty = 1) =>
        set((s) => {
          const minQ = Math.max(1, Number(p.qty_minima_revenda ?? 1));
          const ex = s.items.find((i) => i.produto.id === p.id);
          if (ex) return { items: s.items.map((i) => i.produto.id === p.id ? { ...i, qty: i.qty + qty } : i) };
          return { items: [...s.items, { produto: p, qty: Math.max(qty, minQ) }] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.produto.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.produto.id !== id) return i;
            const minQ = Math.max(1, Number(i.produto.qty_minima_revenda ?? 1));
            return { ...i, qty: Math.max(minQ, qty) };
          }),
        })),
      setObs: (id, observacao) =>
        set((s) => ({ items: s.items.map((i) => i.produto.id === id ? { ...i, observacao } : i) })),
      clear: () => set({ items: [] }),
      setOwner: (id) =>
        set((s) => {
          if (s.ownerId === id) return s;
          if (s.ownerId === null && id !== null) return { ownerId: id };
          return { ownerId: id, items: [] };
        }),
      totalEstimado: () =>
        get().items.reduce((sum, i) => sum + (Number(i.produto.preco_revendedor ?? i.produto.preco) * i.qty), 0),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: "aura-requisicao" },
  ),
);