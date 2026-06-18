import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect, useState } from "react";
import { useRegion, detectRegion, PROVINCIAS, isAvailableInRegion } from "@/lib/region";
import { MapPin, X, ChevronDown, Check } from "lucide-react";

const search = z.object({
  cat: z.enum(["masculino", "feminino", "unissex"]).optional(),
  tag: z.string().optional(),
  marca: z.string().optional(),
  page: z.number().default(1),
});

export const Route = createFileRoute("/catalogo")({
  validateSearch: zodValidator(search),
  component: Catalogo,
});

const PER_PAGE = 4;

function Catalogo() {
  const { cat, tag, marca, page } = Route.useSearch();
  const navigate = useNavigate({ from: "/catalogo" });
  const { active: regionActive, provincia, setActive, setProvincia, toggle } = useRegion();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);

  const selectedBrands = (marca ?? "")
    .split(",")
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);

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
    queryKey: ["produtos", cat, tag, regionActive, provincia],
    queryFn: async () => {
      let q = supabase.from("produtos").select("*", { count: "exact" }).order("created_at", { ascending: false });
      if (cat) q = q.eq("categoria", cat);
      if (tag) q = q.eq("tag", tag);
      const { data, count } = await q;
      let items = (data ?? []) as Produto[];
      if (regionActive && provincia) {
        items = items.filter((p) => isAvailableInRegion(p.provincias ?? null, provincia));
      }
      return { items, count: items.length || (count ?? 0) };
    },
  });

  const allItems = data?.items ?? [];

  // Build brand counts from current category/tag/region scope
  const brandCounts = new Map<string, { label: string; count: number }>();
  allItems.forEach((p) => {
    const label = (p.marca ?? "").trim();
    if (!label) return;
    const key = label.toLowerCase();
    const existing = brandCounts.get(key);
    if (existing) existing.count += 1;
    else brandCounts.set(key, { label, count: 1 });
  });
  const brands = Array.from(brandCounts.entries())
    .map(([key, v]) => ({ key, label: v.label, count: v.count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const filteredByBrand = selectedBrands.length === 0
    ? allItems
    : allItems.filter((p) => p.marca && selectedBrands.includes(p.marca.trim().toLowerCase()));

  const totalCount = filteredByBrand.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const from = (page - 1) * PER_PAGE;
  const pageItems = filteredByBrand.slice(from, from + PER_PAGE);

  const toggleBrand = (key: string) => {
    const set = new Set(selectedBrands);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    const next = Array.from(set);
    navigate({
      search: (prev: z.infer<typeof search>) => ({
        ...prev,
        marca: next.length ? next.join(",") : undefined,
        page: 1,
      }),
    });
  };

  const clearBrands = () => {
    navigate({
      search: (prev: z.infer<typeof search>) => ({ ...prev, marca: undefined, page: 1 }),
    });
  };

  const brandsLabel = selectedBrands.length === 0
    ? "Todas as marcas"
    : selectedBrands.length === 1
      ? (brands.find((b) => b.key === selectedBrands[0])?.label ?? "1 marca")
      : `${selectedBrands.length} marcas`;

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

      {/* Filtro por marcas */}
      <div className="relative mb-8">
        <button
          onClick={() => setBrandsOpen((v) => !v)}
          className="inline-flex w-full max-w-xs items-center justify-between gap-2 rounded-full border border-border bg-background/40 px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground transition hover:border-gold hover:text-foreground sm:w-auto"
          aria-expanded={brandsOpen}
          aria-haspopup="listbox"
        >
          <span className="truncate">{brandsLabel}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${brandsOpen ? "rotate-180" : ""}`} />
        </button>

        {brandsOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setBrandsOpen(false)} />
            <div
              role="listbox"
              className="absolute left-0 z-40 mt-2 max-h-80 w-72 overflow-y-auto rounded-xl border border-border/60 bg-card p-2 shadow-xl"
            >
              <button
                onClick={clearBrands}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted/40"
              >
                <span className="flex items-center gap-2">
                  <span className={`flex h-4 w-4 items-center justify-center rounded border ${selectedBrands.length === 0 ? "border-gold bg-gold text-primary-foreground" : "border-border"}`}>
                    {selectedBrands.length === 0 && <Check className="h-3 w-3" />}
                  </span>
                  Todas as marcas
                </span>
                <span className="text-xs text-muted-foreground">{allItems.length}</span>
              </button>
              {brands.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">Sem marcas disponíveis.</p>
              ) : (
                brands.map((b) => {
                  const checked = selectedBrands.includes(b.key);
                  return (
                    <button
                      key={b.key}
                      onClick={() => toggleBrand(b.key)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted/40"
                    >
                      <span className="flex items-center gap-2">
                        <span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? "border-gold bg-gold text-primary-foreground" : "border-border"}`}>
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <span className="truncate">{b.label}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{b.count}</span>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pageItems.map((p) => <ProductCard key={p.id} p={p} />)}
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