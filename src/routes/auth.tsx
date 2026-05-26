import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { sanitizeRedirect } from "@/lib/safe-navigate";
import { toast } from "sonner";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(searchSchema),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const redirected = useRef(false);
  const afterAuth = sanitizeRedirect(redirect);

  useEffect(() => {
    if (authLoading || !user || redirected.current) return;
    redirected.current = true;
    nav({ to: afterAuth, replace: true });
  }, [authLoading, user, nav, afterAuth]);

  const goAfterAuth = () => {
    nav({ to: afterAuth, replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Introduza o email");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { data: { nome }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Conta criada com sucesso!");
          goAfterAuth();
        } else {
          toast.success("Conta criada! Confirme o email e depois entre com a sua palavra-passe.");
          setMode("login");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) throw error;
        if (!data.session) {
          throw new Error("Sessão não iniciada. Confirme o email ou tente novamente.");
        }
        toast.success("Bem-vindo de volta");
        goAfterAuth();
      }
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="p-20 text-center text-muted-foreground">A carregar…</div>;
  }

  if (user) {
    return (
      <div className="p-20 text-center text-muted-foreground">
        <p>Já tem sessão iniciada.</p>
        <Link to={afterAuth} className="mt-4 inline-block text-gold hover:underline">
          Continuar →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-center font-display text-4xl">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">Aceda à sua conta AURA SCENTRA</p>

      <form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border border-border/60 bg-card p-6">
        {mode === "signup" && (
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm" required />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm" required autoComplete="email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Palavra-passe" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        <button disabled={loading} className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-gold disabled:opacity-60">
          {loading ? "A processar…" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>
      <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 text-center text-sm text-muted-foreground hover:text-gold">
        {mode === "login" ? "Ainda não tem conta? Criar agora" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}
