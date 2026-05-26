import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { NHOGUISTA_STATUS_LABEL, parseNhoguista } from "@/lib/nhoguista";
import { supabase } from "@/lib/supabase";
import type { Nhoguista } from "@/lib/types";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/conta")({ component: Conta });

function Conta() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [nhoguista, setNhoguista] = useState<Nhoguista | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("nhoguistas")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setNhoguista(parseNhoguista(data as Nhoguista | null)));
  }, [user]);

  if (loading) return <div className="p-20 text-center text-muted-foreground">A carregar…</div>;
  if (!user) {
    nav({ to: "/auth" });
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-4xl">Minha conta</h1>
      <div className="mt-6 rounded-xl border border-border/60 bg-card p-6 space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Email:</span> {user.email}
        </p>
        <p>
          <span className="text-muted-foreground">Nome:</span> {profile?.nome ?? "—"}
        </p>
        {profile?.is_admin && <p className="text-gold">Admin</p>}
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-card p-6 text-sm">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Programa Nhoguista</p>
        {nhoguista ? (
          <div className="mt-2 space-y-1">
            <p>
              Estado:{" "}
              <span className={nhoguista.status === "aprovado" ? "text-gold font-medium" : ""}>
                {NHOGUISTA_STATUS_LABEL[nhoguista.status]}
              </span>
            </p>
            {nhoguista.status === "aprovado" && (
              <p className="text-muted-foreground">Código: <span className="text-gold">{nhoguista.codigo}</span></p>
            )}
            <Link to="/nhoguista" className="mt-2 inline-block text-gold hover:underline">
              Ver painel nhoguista →
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-muted-foreground">
            Ainda não se candidatou.{" "}
            <Link to="/nhoguista" className="text-gold hover:underline">
              Candidatar agora
            </Link>
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/favoritos" className="rounded-md border border-border px-4 py-2 text-sm hover:border-gold">
          Favoritos
        </Link>
        <Link to="/nhoguista" className="rounded-md border border-border px-4 py-2 text-sm hover:border-gold">
          Nhoguista
        </Link>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            nav({ to: "/" });
          }}
          className="ml-auto rounded-md border border-destructive/50 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
