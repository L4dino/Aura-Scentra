import { Link } from "@tanstack/react-router";
import { Heart, Star, Eye, ShoppingBag, Clock } from "lucide-react";
import type { Produto } from "@/lib/types";
import { formatMZN } from "@/lib/format";
import { useCart } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useRegion, isAvailableInRegion } from "@/lib/region";
import { track } from "@/lib/events";
import { RegionsPopover } from "@/components/RegionsPopover";

const TAG_LABEL: Record<string, string> = {
  novo: "Novo",
  promocao: "Promoção",
  mais_vendido: "Mais vendido",
  queima_stock: "Queima de stock",
};

export function ProductCard({ p }: { p: Produto }) {
  const add = useCart((s) => s.add);
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const semStock = (p.stock ?? 0) <= 0;
  const { active: regionActive, provincia } = useRegion();
  const disponivel = isAvailableInRegion(p.provincias ?? null, provincia);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("favoritos")
      .select("produto_id")
      .eq("user_id", user.id)
      .eq("produto_id", p.id)
      .maybeSingle()
      .then(({ data }) => setFav(!!data));
  }, [user, p.id]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Entre na sua conta para guardar favoritos");
      return;
    }
    if (fav) {
      await supabase.from("favoritos").delete().eq("user_id", user.id).eq("produto_id", p.id);
      setFav(false);
    } else {
      await supabase.from("favoritos").insert({ user_id: user.id, produto_id: p.id });
      setFav(true);
    }
  };

  return (
    <article
      className="group relative flex flex-col rounded-xl border border-border/60 bg-card transition hover:border-gold/40 hover:shadow-gold"
    >
      <Link
        to="/produto/$id"
        params={{ id: p.id }}
        onClick={() => track("click_produto", p.id)}
        className="relative block aspect-square overflow-hidden rounded-t-xl bg-black/40"
      >
        {p.imagem_url ? (
          <img
            src={p.imagem_url}
            alt={p.nome}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">Sem imagem</div>
        )}
        {p.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
            {TAG_LABEL[p.tag] ?? p.tag}
          </span>
        )}
        {semStock && (
          <span className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-gold ring-1 ring-gold/40 backdrop-blur">
            <Clock className="h-3 w-3" /> Por encomenda
          </span>
        )}
      </Link>
      <button
        onClick={toggleFav}
        className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-foreground/80 backdrop-blur transition hover:text-gold"
        aria-label="Favoritar"
      >
        <Heart className={`h-4 w-4 ${fav ? "fill-gold text-gold" : ""}`} />
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to="/produto/$id" params={{ id: p.id }} onClick={() => track("click_produto", p.id)} className="font-display text-lg leading-tight hover:text-gold">
          {p.nome}
        </Link>
        {p.marca && <p className="text-xs text-muted-foreground">{p.marca}</p>}
        <RegionsPopover value={p.provincias} />
        {regionActive && provincia && !disponivel && (
          <p className="text-[11px] font-medium text-amber-400">Sob consulta para {provincia}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span>{p.avaliacao?.toFixed(1) ?? "4.8"}</span>
          <span>({p.num_avaliacoes ?? 0})</span>
        </div>
        <div className="mt-1 text-base font-semibold text-gold">{formatMZN(p.preco)}</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link to="/produto/$id" params={{ id: p.id }} onClick={() => track("click_produto", p.id)} className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-2 text-[11px] uppercase tracking-widest text-muted-foreground transition hover:border-gold/40 hover:text-gold">
            <Eye className="h-3.5 w-3.5" /> Detalhes
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              add(p);
              track("click_compra", p.id);
              toast.success(
                semStock
                  ? `${p.nome} adicionado (por encomenda)`
                  : `${p.nome} adicionado ao carrinho`,
              );
            }}
            className={`inline-flex items-center justify-center gap-1 rounded-md bg-gold px-2 py-2 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground transition hover:opacity-90 ${semStock ? "border border-dashed border-background/40" : ""}`}
          >
            {semStock ? <><Clock className="h-3.5 w-3.5" /> Encomendar</> : <><ShoppingBag className="h-3.5 w-3.5" /> Adicionar</>}
          </button>
        </div>
      </div>
    </article>
  );
}