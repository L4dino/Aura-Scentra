import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";

const search = z.object({
  cat: z.enum(["masculino", "feminino", "unissex"]).optional(),
  tag: z.string().optional(),
  page: z.number().default(1),
});

export const Route = createFileRoute("/catalogo")({
  validateSearch: zodValidator(search),
  component: Catalogo,
});

const PER_PAGE = 4;

function Catalogo() {
  const { cat, tag, page } = Route.useSearch();
  const navigate = useNavigate({ from: "/catalogo" });

  const { data, isLoading } = useQuery({
    queryKey: ["produtos", cat, tag, page],
    queryFn: async () => {
      let q = supabase.from("produtos").select("*", { count: "exact" }).order("created_at", { ascending: false });
      if (cat) q = q.eq("categoria", cat);
      if (tag) q = q.eq("tag", tag);
      const from = (page - 1) * PER_PAGE;
      q = q.range(from, from + PER_PAGE - 1);
      const { data, count } = await q;
      return { items: (data ?? []) as Produto[], count: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PER_PAGE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl">Catálogo</h1>
        <p className="mt-2 text-sm text-muted-foreground">Perfumes premium para todos os momentos.</p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Chip active={!cat && !tag} onClick={() => navigate({ search: { page: 1 } })}>Todos</Chip>
        <Chip active={cat === "masculino"} onClick={() => navigate({ search: { cat: "masculino", page: 1 } })}>Masculino</Chip>
        <Chip active={cat === "feminino"} onClick={() => navigate({ search: { cat: "feminino", page: 1 } })}>Feminino</Chip>
        <Chip active={cat === "unissex"} onClick={() => navigate({ search: { cat: "unissex", page: 1 } })}>Unissex</Chip>
        <span className="mx-2 h-5 w-px bg-border" />
        <Chip active={tag === "novo"} onClick={() => navigate({ search: { tag: "novo", page: 1 } })}>Novos</Chip>
        <Chip active={tag === "promocao"} onClick={() => navigate({ search: { tag: "promocao", page: 1 } })}>Promoção</Chip>
        <Chip active={tag === "mais_vendido"} onClick={() => navigate({ search: { tag: "mais_vendido", page: 1 } })}>Mais vendidos</Chip>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data?.items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => navigate({ search: (prev: z.infer<typeof search>) => ({ ...prev, page: i + 1 }) })}
                  className={`h-9 w-9 rounded-md border text-sm transition ${
                    page === i + 1
                      ? "border-gold bg-gold text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-gold hover:text-gold"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest transition ${
        active
          ? "border-gold bg-gold text-primary-foreground"
          : "border-border text-muted-foreground hover:border-gold hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}