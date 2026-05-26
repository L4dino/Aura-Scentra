import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { NHOGUISTA_STATUS_LABEL, parseNhoguista } from "@/lib/nhoguista";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Nhoguista } from "@/lib/types";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/nhoguista")({ component: Page });

async function resolveUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function Page() {
  const { user: ctxUser, loading: authLoading } = useAuth();
  const [n, setN] = useState<Nhoguista | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [telefone, setTelefone] = useState("");
  const [provincia, setProvincia] = useState("");

  const fetchNhoguista = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("nhoguistas")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      setLoadError(error.message);
      return null;
    }
    setLoadError(null);
    return parseNhoguista(data as Nhoguista | null);
  }, []);

  const reload = useCallback(
    async (uid: string, silent = false) => {
      if (!silent) setRefreshing(true);
      const row = await fetchNhoguista(uid);
      setN(row);
      if (!silent) setRefreshing(false);
      return row;
    },
    [fetchNhoguista],
  );

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    (async () => {
      setPageLoading(true);
      setNeedsLogin(false);
      const user = ctxUser ?? (await resolveUser());
      if (cancelled) return;

      if (!user) {
        setNeedsLogin(true);
        setPageLoading(false);
        return;
      }

      setUserId(user.id);
      const row = await fetchNhoguista(user.id);
      if (!cancelled) {
        setN(row);
        setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ctxUser, authLoading, fetchNhoguista]);

  // Actualizar automaticamente enquanto estiver pendente
  useEffect(() => {
    if (!userId || n?.status !== "pendente") return;

    const onVisible = () => {
      if (document.visibilityState === "visible") void reload(userId, true);
    };
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(() => void reload(userId, true), 12000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [userId, n?.status, reload]);

  if (authLoading || pageLoading) {
    return <div className="p-20 text-center text-muted-foreground">A carregar…</div>;
  }

  if (needsLogin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-4xl">Programa Nhoguista</h1>
        <p className="mt-3 text-muted-foreground">
          Ganhe comissões revendendo perfumes AURA SCENTRA. Entre na sua conta para se candidatar.
        </p>
        <Link
          to="/auth"
          search={{ redirect: "/nhoguista" }}
          className="mt-6 inline-block rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground"
        >
          Entrar
        </Link>
      </div>
    );
  }

  if (!userId) return null;

  const apply = async () => {
    if (!telefone.trim() || !provincia.trim()) {
      toast.error("Preencha telefone e província");
      return;
    }
    const user = ctxUser ?? (await resolveUser());
    if (!user) {
      toast.error("Sessão expirada. Entre novamente.");
      setNeedsLogin(true);
      return;
    }
    const codigo = (user.email?.split("@")[0] ?? "rev") + "-" + Math.random().toString(36).slice(2, 6);
    const { data, error } = await supabase
      .from("nhoguistas")
      .insert({ user_id: user.id, codigo, telefone: telefone.trim(), provincia: provincia.trim(), status: "pendente" })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setN(parseNhoguista(data as Nhoguista));
    toast.success("Candidatura enviada");
  };

  if (n) {
    const aprovado = n.status === "aprovado";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = aprovado ? `${origin}/?ref=${n.codigo}` : "";
    const statusLabel = NHOGUISTA_STATUS_LABEL[n.status];

    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-4xl">Painel Nhoguista</h1>
          <button
            type="button"
            onClick={() => reload(userId)}
            disabled={refreshing}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {loadError && (
          <p className="mt-4 rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Não foi possível carregar o estado: {loadError}
          </p>
        )}

        <div className="mt-6 rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Estado da candidatura</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
                n.status === "aprovado"
                  ? "bg-green-500/15 text-green-600"
                  : n.status === "rejeitado"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-gold/15 text-gold"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          {n.status === "aprovado" && (
            <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm">
              <p className="font-medium text-gold">Parabéns! A sua candidatura foi aprovada.</p>
              <p className="mt-1 text-muted-foreground">
                Partilhe o link abaixo. Quando alguém comprar com o seu código, ganha comissão.
              </p>
            </div>
          )}

          {n.status === "pendente" && (
            <p className="text-sm text-muted-foreground">
              A aguardar aprovação do administrador. O link da loja e o código de partilha só ficam disponíveis depois da confirmação.
              Esta página actualiza automaticamente — ou clique em «Actualizar».
            </p>
          )}

          {n.status === "rejeitado" && (
            <p className="text-sm text-destructive">
              A sua candidatura não foi aprovada. Contacte-nos se tiver dúvidas.
            </p>
          )}

          {aprovado && (
            <>
              <p>
                <span className="text-sm text-muted-foreground">Código: </span>
                <span className="text-gold font-medium">{n.codigo}</span>
              </p>
              <div>
                <p className="text-sm text-muted-foreground">Link da loja para partilhar:</p>
                <code className="mt-1 block break-all rounded bg-background p-3 text-xs text-gold">{link}</code>
              </div>
            </>
          )}
        </div>
        <Link to="/conta" className="mt-6 inline-block text-sm text-gold hover:underline">
          ← Voltar à conta
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Candidatar a Nhoguista</h1>
      <p className="mt-2 text-sm text-muted-foreground">Preencha os dados abaixo para enviar a sua candidatura.</p>
      <div className="mt-6 space-y-3 rounded-xl border border-border/60 bg-card p-6">
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={provincia} onChange={(e) => setProvincia(e.target.value)} placeholder="Província" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <button type="button" onClick={apply} className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground">
          Candidatar
        </button>
      </div>
      <Link to="/conta" className="mt-4 inline-block text-sm text-muted-foreground hover:text-gold">
        ← Voltar à conta
      </Link>
    </div>
  );
}
