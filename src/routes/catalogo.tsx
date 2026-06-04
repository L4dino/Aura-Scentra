import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect, useState } from "react";
import { useRegion, detectRegion, PROVINCIAS, isAvailableInRegion } from "@/lib/region";
import { MapPin, X } from "lucide-react";

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
  const { active: regionActive, provincia, setActive, setProvincia, toggle } = useRegion();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Detecção automática (só se ainda não houver província definida)
  useEffect(() => {
    if (!provincia) {
      detectRegion().then((r) => { if (r) setProvincia(r); });
    }
  }, [provincia, setProvincia]);

  const onToggleFilter = () => {
    if (!regionActive) {
      if (!provincia) {
        // Sem detecção automática: abre o picker para escolher manualmente
        setPickerOpen(true);
        return;
      }
      setActive(true);
    } else {
      setActive(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["produtos", cat, tag, page, regionActive, provincia],
    queryFn: async () => {
      let q = supabase.from("produtos").select("*", { count: "exact" }).order("created_at", { ascending: false });
      if (cat) q = q.eq("categoria", cat);
      if (tag) q = q.eq("tag", tag);
      const { data, count } = await q;
      let items = (data ?? []) as Produto[];
      if (regionActive && provincia) {
        items = items.filter((p) => isAvailableInRegion(p.provincias ?? null, provincia));
      }
      const total = items.length;
      const from = (page - 1) * PER_PAGE;
      items = items.slice(from, from + PER_PAGE);
      return { items, count: total || (count ?? 0) };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PER_PAGE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl">Catálogo</h1>
        <p className="mt-2 text-sm text-muted-foreground">Perfumes premium para todos os momentos.</p>
      </div>

      {/* Filtro por região */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={onToggleFilter}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition ${
            regionActive
              ? "border-gold bg-gold text-primary-foreground shadow-gold"
              : "border-border bg-background/40 text-muted-foreground hover:border-gold/60 hover:text-foreground"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          {regionActive ? `Filtrando: ${provincia ?? "Minha região"}` : "Mostrar na minha região"}
        </button>
        {regionActive && (
          <>
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-4 py-2 text-xs uppercase tracking-widest text-gold transition hover:bg-gold/20"
            >
              <MapPin className="h-3.5 w-3.5" />
              Mudar província
            </button>
            <button
              onClick={() => setActive(false)}
              className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-destructive hover:text-destructive"
              aria-label="Desativar filtro"
              title="Mostrar todos os produtos"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {pickerOpen && (
        <RegionPicker
          current={provincia}
          onClose={() => setPickerOpen(false)}
          onPick={(p) => {
            setProvincia(p);
            setActive(true);
            setPickerOpen(false);
          }}
        />
      )}

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

function RegionPicker({
  current,
  onClose,
  onPick,
}: {
  current: string | null;
  onClose: () => void;
  onPick: (p: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 md:items-center md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-2xl border border-border/60 bg-card md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-lg">Escolha a sua província</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4">
          {PROVINCIAS.map((p) => (
            <button
              key={p}
              onClick={() => onPick(p)}
              className={`rounded-md border px-3 py-2.5 text-sm transition ${
                current === p ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}