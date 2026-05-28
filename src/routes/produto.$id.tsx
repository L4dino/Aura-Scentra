import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { formatMZN } from "@/lib/format";
import { useCart } from "@/lib/store";
import { Star, ShoppingBag, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/produto/$id")({
  component: ProdutoPage,
});

function ProdutoPage() {
  const { id } = Route.useParams();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();

  const { data: p, isLoading } = useQuery({
    queryKey: ["produto", id],
    queryFn: async () => {
      const { data } = await supabase.from("produtos").select("*").eq("id", id).maybeSingle();
      return data as Produto | null;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">A carregar…</div>;
  }
  if (!p) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Link to="/catalogo" className="mt-4 inline-block text-gold">Voltar ao catálogo</Link>
      </div>
    );
  }

  const semStock = (p.stock ?? 0) <= 0;

  const finalizar = () => {
    add(p, qty);
    navigate({ to: "/carrinho" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link to="/catalogo" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Catálogo
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border border-border/60 bg-card">
          {p.imagem_url && <img src={p.imagem_url} alt={p.nome} className="h-full w-full object-cover" />}
        </div>
        <div>
          {p.marca && <p className="text-xs uppercase tracking-[0.3em] text-gold">{p.marca}</p>}
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{p.nome}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span>{p.avaliacao?.toFixed(1) ?? "4.8"}</span>
            <span>({p.num_avaliacoes ?? 0} avaliações)</span>
          </div>
          <p className="mt-6 text-3xl font-semibold text-gold">{formatMZN(p.preco)}</p>
          {semStock ? (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
              Por encomenda
            </p>
          ) : (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Em stock
            </p>
          )}
          {p.descricao && <p className="mt-6 leading-relaxed text-muted-foreground">{p.descricao}</p>}

          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-lg">−</button>
              <span className="w-10 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-lg">+</button>
            </div>
            <button
              onClick={() => {
                add(p, qty);
                toast.success(semStock ? "Adicionado (por encomenda)" : "Adicionado ao carrinho");
              }}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-6 py-3 text-sm uppercase tracking-widest transition ${semStock ? "border-amber-500/50 text-amber-400 hover:bg-amber-500/10" : "border-gold/40 text-gold hover:bg-gold/10"}`}
            >
              <ShoppingBag className="h-4 w-4" /> {semStock ? "Encomendar" : "Adicionar"}
            </button>
          </div>
          <button
            onClick={finalizar}
            className="mt-3 w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-gold transition hover:opacity-90"
          >
            Finalizar compra
          </button>

          <div className="mt-8 space-y-2 text-xs text-muted-foreground">
            <p>✓ Produto 100% original</p>
            <p>✓ Entrega rápida em todo Moçambique</p>
            <p>✓ Pagamento na entrega disponível</p>
          </div>
        </div>
      </div>
    </div>
  );
}