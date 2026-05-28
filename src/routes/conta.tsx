import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/conta")({ component: Conta });

function Conta() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  if (loading) return <div className="p-20 text-center text-muted-foreground">A carregar…</div>;
  if (!user) { nav({ to: "/auth" }); return null; }
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-4xl">Minha conta</h1>
      <div className="mt-6 rounded-xl border border-border/60 bg-card p-6 space-y-2 text-sm">
        <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
        <p><span className="text-muted-foreground">Nome:</span> {profile?.nome ?? "—"}</p>
        {profile?.is_admin && <p className="text-gold">Admin</p>}
      </div>
      <div className="mt-6 flex gap-3">
        <Link to="/favoritos" className="rounded-md border border-border px-4 py-2 text-sm hover:border-gold">Favoritos</Link>
        <Link to="/nhoguista" className="rounded-md border border-border px-4 py-2 text-sm hover:border-gold">Nhoguista</Link>
        <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }} className="ml-auto rounded-md border border-destructive/50 px-4 py-2 text-sm text-destructive hover:bg-destructive/10">Sair</button>
      </div>
    </div>
  );
}