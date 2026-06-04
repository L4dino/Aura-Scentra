import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Pedido } from "@/lib/types";
import { normalizePedidoItems } from "@/lib/types";
import { formatMZN } from "@/lib/format";
import { Package, Clock, Truck, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/conta")({ component: Conta });

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  processando: { label: "Processando", color: "text-amber-400 border-amber-500/40 bg-amber-500/10", icon: <Clock className="h-3.5 w-3.5" /> },
  pendente: { label: "Processando", color: "text-amber-400 border-amber-500/40 bg-amber-500/10", icon: <Clock className="h-3.5 w-3.5" /> },
  a_caminho: { label: "A caminho", color: "text-blue-400 border-blue-500/40 bg-blue-500/10", icon: <Truck className="h-3.5 w-3.5" /> },
  confirmado: { label: "A caminho", color: "text-blue-400 border-blue-500/40 bg-blue-500/10", icon: <Truck className="h-3.5 w-3.5" /> },
  entregue: { label: "Entregue", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  cancelado: { label: "Cancelado", color: "text-destructive border-destructive/40 bg-destructive/10", icon: <XCircle className="h-3.5 w-3.5" /> },
};

function Conta() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [view, setView] = useState<"perfil" | "pedidos">("perfil");
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);
  if (loading) return <div className="p-20 text-center text-muted-foreground">A carregar…</div>;
  if (!user) return null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl">Minha conta</h1>
      <div className="mt-6 flex gap-2 border-b border-border">
        <button onClick={() => setView("perfil")} className={`px-4 py-2 text-sm uppercase tracking-widest transition ${view === "perfil" ? "border-b-2 border-gold text-gold" : "text-muted-foreground hover:text-foreground"}`}>Perfil</button>
        <button onClick={() => setView("pedidos")} className={`inline-flex items-center gap-2 px-4 py-2 text-sm uppercase tracking-widest transition ${view === "pedidos" ? "border-b-2 border-gold text-gold" : "text-muted-foreground hover:text-foreground"}`}>
          <Package className="h-4 w-4" /> Meus pedidos
        </button>
      </div>
      {view === "perfil" ? (
        <>
          <div className="mt-6 rounded-xl border border-border/60 bg-card p-6 space-y-2 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
            <p><span className="text-muted-foreground">Nome:</span> {profile?.nome ?? "—"}</p>
            {profile?.is_admin && <p className="text-gold">Admin</p>}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/favoritos" className="rounded-md border border-border px-4 py-2 text-sm hover:border-gold">Favoritos</Link>
            <Link to="/nhoguista" className="rounded-md border border-border px-4 py-2 text-sm hover:border-gold">Nhoguista</Link>
            <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }} className="ml-auto rounded-md border border-destructive/50 px-4 py-2 text-sm text-destructive hover:bg-destructive/10">Sair</button>
          </div>
        </>
      ) : (
        <MeusPedidos userId={user.id} />
      )}
    </div>
  );
}

function MeusPedidos({ userId }: { userId: string }) {
  const [items, setItems] = useState<Pedido[] | null>(null);
  useEffect(() => {
    supabase
      .from("pedidos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data ?? []) as Pedido[]));
  }, [userId]);
  if (items === null) return <p className="py-10 text-center text-sm text-muted-foreground">A carregar…</p>;
  if (items.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">Ainda não fez nenhum pedido.</p>;
  return (
    <div className="mt-6 space-y-3">
      {items.map((p) => {
        const s = STATUS_MAP[p.status] ?? STATUS_MAP.processando;
        return (
          <div key={p.id} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-MZ")}</p>
                <p className="font-medium">Pedido #{p.id.slice(0, 8)}</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${s.color}`}>
                {s.icon}{s.label}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{normalizePedidoItems(p.items).map((i) => `${i.nome} x${i.qty}`).join(", ") || "Itens não detalhados"}</p>
            <p className="mt-2 text-sm font-semibold text-gold">{formatMZN(p.total)}</p>
          </div>
        );
      })}
    </div>
  );
}