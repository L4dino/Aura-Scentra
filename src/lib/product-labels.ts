import type { Categoria, Tag } from "@/lib/types";

export const TAG_LABEL: Record<NonNullable<Tag>, string> = {
  novo: "Novo",
  promocao: "Promoção",
  mais_vendido: "Mais vendido",
  queima_stock: "Queima de stock",
};

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  unissex: "Unissex",
};
