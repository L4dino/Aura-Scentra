import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Chrome } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const googleSignIn = async () => {
    try {
      const redirect =
        typeof window !== "undefined"
          ? `${window.location.origin}/`
          : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirect },
      });
      if (error) throw error;
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // Try to sign in immediately so user stays authenticated even
        // when email confirmation is disabled or already auto-confirmed.
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) {
          toast.success("Conta criada! Verifique o seu email para confirmar.");
        } else {
          toast.success("Conta criada — sessão iniciada");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta");
      }
      let dest = "/";
      if (typeof window !== "undefined") {
        const after = window.sessionStorage.getItem("aura-post-login");
        if (after) {
          window.sessionStorage.removeItem("aura-post-login");
          dest = after;
        }
      }
      nav({ to: dest as never });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-center font-display text-4xl">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">Aceda à sua conta AURA SCENTRA</p>

      <form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border border-border/60 bg-card p-6">
        {mode === "signup" && (
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm" required />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Palavra-passe" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm" required minLength={6} />
        <button disabled={loading} className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-gold disabled:opacity-60">
          {loading ? "A processar…" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={googleSignIn}
        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-md border border-border bg-card px-4 py-3.5 text-sm font-semibold uppercase tracking-widest text-foreground shadow-lg transition hover:border-gold hover:shadow-gold"
      >
        <span className="absolute inset-y-0 left-0 w-1 bg-gold transition-all group-hover:w-full group-hover:opacity-10" />
        <span className="grid h-8 w-8 place-items-center rounded-full bg-background ring-1 ring-border transition group-hover:ring-gold/60">
          <Chrome className="h-4 w-4 text-gold" />
        </span>
        Entrar com Google
      </button>

      <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 text-center text-sm text-muted-foreground hover:text-gold">
        {mode === "login" ? "Ainda não tem conta? Criar agora" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}