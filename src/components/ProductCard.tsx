import { Link } from "@tanstack/react-router";
import { Eye, Heart, Star } from "lucide-react";
import type { Produto } from "@/lib/types";
import { formatMZN } from "@/lib/format";
import { TAG_LABEL } from "@/lib/product-labels";
import { useCart } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function ProductCard({ p }: { p: Produto }) {
  const add = useCart((s) => s.add);
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const inStock = (p.stock ?? 0) > 0;

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
    e.stopPropagation();
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
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition hover:border-gold/40 hover:shadow-gold">
      <Link to="/produto/$id" params={{ id: p.id }} className="relative block aspect-square overflow-hidden bg-black/40">
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
        <button
          type="button"
          onClick={toggleFav}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-foreground/80 backdrop-blur transition hover:text-gold"
          aria-label="Favoritar"
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-gold text-gold" : ""}`} />
        </button>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to="/produto/$id" params={{ id: p.id }} className="hover:text-gold">
          <h3 className="font-display text-lg leading-tight">{p.nome}</h3>
        </Link>
        {p.marca && <p className="text-xs text-muted-foreground">{p.marca}</p>}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span>{p.avaliacao?.toFixed(1) ?? "—"}</span>
        </div>
        <div className="mt-1 text-base font-semibold text-gold">{formatMZN(p.preco)}</div>
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Link
            to="/produto/$id"
            params={{ id: p.id }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-[11px] uppercase tracking-widest text-foreground transition hover:border-gold/40 hover:text-gold"
          >
            <Eye className="h-3.5 w-3.5" /> Ver detalhes
          </Link>
          <button
            type="button"
            disabled={!inStock}
            onClick={() => {
              if (!inStock) return;
              add(p);
              toast.success(`${p.nome} adicionado ao carrinho`);
            }}
            className="w-full rounded-md border border-gold/40 px-3 py-2 text-[11px] uppercase tracking-widest text-gold transition hover:bg-gold hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {inStock ? "Adicionar ao carrinho" : "Esgotado"}
          </button>
        </div>
      </div>
    </article>
  );
}
