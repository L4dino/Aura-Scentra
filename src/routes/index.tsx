import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { produtoVisivelEm } from "@/lib/produto-visibilidade";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Truck, ShieldCheck, Award } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: destaques = [], isLoading } = useQuery({
    queryKey: ["produtos", "destaque"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("*")
        .eq("destaque", true)
        .order("created_at", { ascending: false })
        .limit(6);
      return ((data ?? []) as Produto[]).filter((p) => produtoVisivelEm(p, "catalogo"));
    },
  });

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,oklch(0.78_0.13_82_/_0.18),transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold">
              <span className="h-px w-8 bg-gold" /> Exclusividade que te define
            </span>
            <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
              Descubra a sua <br /> assinatura.
              <br />
              <span className="text-gold">AURA SCENTRA.</span>
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground">
              Perfumes únicos para momentos inesquecíveis. Originais, entregues em todo Moçambique.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-gold transition hover:opacity-90"
              >
                Explorar perfumes <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/nhoguista"
                className="inline-flex items-center rounded-md border border-gold/40 px-6 py-3 text-sm uppercase tracking-widest text-gold transition hover:bg-gold/10"
              >
                Seja Nhoguista
              </Link>
            </div>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-gradient-to-br from-black/60 via-card to-black/80 shadow-gold">
            <img
              src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200"
              alt="Coleção AURA SCENTRA"
              className="h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-b border-border/40 bg-black/30">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-3">
          {[
            { Icon: Truck, t: "Entrega rápida", d: "Em qualquer lugar de Moçambique" },
            { Icon: ShieldCheck, t: "Pagamento seguro", d: "Ambiente 100% protegido" },
            { Icon: Award, t: "Produtos originais", d: "Garantia de autenticidade" },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-gold">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gold">{t}</p>
                <p className="text-xs text-muted-foreground">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide md:text-4xl">Compre por categoria</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { c: "masculino", t: "Masculino", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800" },
            { c: "feminino", t: "Feminino", img: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800" },
            { c: "unissex", t: "Unissex", img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800" },
          ].map((cat) => (
            <Link
              key={cat.c}
              to="/catalogo"
              search={{ cat: cat.c } as never}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60"
            >
              <img src={cat.img} alt={cat.t} className="h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-display text-2xl text-gold">{cat.t}</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Ver coleção</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide md:text-4xl">Perfumes em destaque</h2>
          <Link to="/catalogo" className="text-xs uppercase tracking-widest text-gold hover:underline">
            Ver todos →
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : destaques.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem produtos ainda. Execute o script SQL e adicione no admin.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {destaques.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
