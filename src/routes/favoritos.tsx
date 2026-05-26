import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/favoritos")({
  component: Favoritos,
});

function Favoritos() {
  const { user, loading } = useAuth();
  const { data: produtos = [] } = useQuery({
    queryKey: ["favoritos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favoritos")
        .select("produto:produtos(*)")
        .eq("user_id", user!.id);
      const rows = (data ?? []) as unknown as Array<{ produto: Produto }>;
      return rows.map((r) => r.produto).filter(Boolean);
    },
  });

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">A carregar…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Os seus favoritos</h1>
        <p className="mt-2 text-muted-foreground">Entre na sua conta para ver e sincronizar favoritos.</p>
        <Link to="/auth" className="mt-6 inline-block rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-4xl">Favoritos</h1>
      {produtos.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Ainda sem favoritos. Toque no ♥ em qualquer produto.</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {produtos.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}