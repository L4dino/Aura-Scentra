import { Link } from "@tanstack/react-router";
import { Heart, Star, Eye } from "lucide-react";
import type { Produto } from "@/lib/types";
import { formatMZN } from "@/lib/format";
import { useCart } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

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
    <Link
      to="/produto/$id"
      params={{ id: p.id }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition hover:border-gold/40 hover:shadow-gold"
    >
      <div className="relative aspect-square overflow-hidden bg-black/40">
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
          <span className="absolute left-3 bottom-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-black">
            Por encomenda
          </span>
        )}
        <button
          onClick={toggleFav}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-foreground/80 backdrop-blur transition hover:text-gold"
          aria-label="Favoritar"
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-gold text-gold" : ""}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg leading-tight">{p.nome}</h3>
        {p.marca && <p className="text-xs text-muted-foreground">{p.marca}</p>}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span>{p.avaliacao?.toFixed(1) ?? "4.8"}</span>
          <span>({p.num_avaliacoes ?? 0})</span>
        </div>
        <div className="mt-1 text-base font-semibold text-gold">{formatMZN(p.preco)}</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <span className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-2 text-[11px] uppercase tracking-widest text-muted-foreground transition group-hover:border-gold/40 group-hover:text-gold">
            <Eye className="h-3.5 w-3.5" /> Detalhes
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              add(p);
              toast.success(
                semStock
                  ? `${p.nome} adicionado (por encomenda)`
                  : `${p.nome} adicionado ao carrinho`,
              );
            }}
            className={`rounded-md px-2 py-2 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground transition hover:opacity-90 ${semStock ? "bg-amber-500" : "bg-gold"}`}
          >
            {semStock ? "Encomendar" : "Adicionar"}
          </button>
        </div>
      </div>
    </Link>
  );
}