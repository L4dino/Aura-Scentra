import type { Produto } from "@/lib/types";

export type ProdutoCanal = "catalogo" | "com_stock" | "sem_stock";

/** null/undefined conta como visível (produtos antigos). false = oculto. */
export function produtoVisivelEm(p: Produto, canal: ProdutoCanal): boolean {
  switch (canal) {
    case "catalogo":
      return p.disponivel_catalogo !== false;
    case "com_stock":
      return p.disponivel_com_stock !== false;
    case "sem_stock":
      return p.disponivel_sem_stock !== false;
  }
}

export function produtoVisivelEmAlgum(p: Produto): boolean {
  return (
    produtoVisivelEm(p, "catalogo") ||
    produtoVisivelEm(p, "com_stock") ||
    produtoVisivelEm(p, "sem_stock")
  );
}
