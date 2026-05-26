import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { formatMZN } from "@/lib/format";
import { CATEGORIA_LABEL, TAG_LABEL } from "@/lib/product-labels";
import { useCart, useReferral } from "@/lib/store";
import { Star, ShoppingBag, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { whatsappLink, buildWhatsAppMessage } from "@/lib/whatsapp";

export const Route = createFileRoute("/produto/$id")({
  component: ProdutoPage,
});

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ProdutoPage() {
  const { id } = Route.useParams();
  const add = useCart((s) => s.add);
  const ref = useReferral((s) => s.ref);
  const [qty, setQty] = useState(1);

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

  const inStock = (p.stock ?? 0) > 0;
  const maxQty = Math.max(1, p.stock ?? 1);

  const buyNow = () => {
    const msg = buildWhatsAppMessage([{ produto: p, qty }], {
      nome: "",
      localizacao: "",
      ref,
    });
    window.open(whatsappLink(msg), "_blank");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link to="/catalogo" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Catálogo
      </Link>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border border-border/60 bg-card">
          {p.imagem_url ? (
            <img src={p.imagem_url} alt={p.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">Sem imagem</div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {p.tag && (
              <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                {TAG_LABEL[p.tag]}
              </span>
            )}
            {p.destaque && (
              <span className="rounded-full border border-gold/40 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gold">
                Destaque
              </span>
            )}
            <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest ${inStock ? "bg-green-500/15 text-green-600" : "bg-destructive/15 text-destructive"}`}>
              {inStock ? "Em stock" : "Esgotado"}
            </span>
          </div>

          {p.marca && <p className="mt-4 text-xs uppercase tracking-[0.3em] text-gold">{p.marca}</p>}
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{p.nome}</h1>

          {p.avaliacao != null && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span>{p.avaliacao.toFixed(1)} / 5</span>
            </div>
          )}

          <p className="mt-6 text-3xl font-semibold text-gold">{formatMZN(p.preco)}</p>

          <section className="mt-8 rounded-xl border border-border/60 bg-card p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">Descrição</h2>
            {p.descricao ? (
              <p className="leading-relaxed text-muted-foreground whitespace-pre-line">{p.descricao}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">Descrição não disponível.</p>
            )}
          </section>

          <section className="mt-6 rounded-xl border border-border/60 bg-card px-5">
            <h2 className="border-b border-border/40 py-3 text-xs font-semibold uppercase tracking-widest text-gold">
              Informação do produto
            </h2>
            <DetailRow label="Categoria" value={p.categoria ? CATEGORIA_LABEL[p.categoria] : null} />
            <DetailRow label="Marca" value={p.marca} />
            <DetailRow label="Preço" value={formatMZN(p.preco)} />
            <DetailRow label="Avaliação" value={p.avaliacao != null ? `${p.avaliacao.toFixed(1)} / 5` : null} />
            <DetailRow label="Stock disponível" value={inStock ? `${p.stock} unidade(s)` : "Esgotado"} />
            {p.tag && <DetailRow label="Etiqueta" value={TAG_LABEL[p.tag]} />}
          </section>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-border">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-lg"
                disabled={!inStock}
              >
                −
              </button>
              <span className="w-10 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="px-3 py-2 text-lg"
                disabled={!inStock}
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={!inStock}
              onClick={() => {
                add(p, qty);
                toast.success("Adicionado ao carrinho");
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-gold/40 px-6 py-3 text-sm uppercase tracking-widest text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingBag className="h-4 w-4" /> Adicionar
            </button>
          </div>
          <button
            type="button"
            disabled={!inStock}
            onClick={buyNow}
            className="mt-3 w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-gold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Comprar pelo WhatsApp
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
