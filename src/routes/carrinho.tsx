import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart, useReferral } from "@/lib/store";
import { formatMZN } from "@/lib/format";
import { Trash2, MessageCircle, Lock, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { buildWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/carrinho")({
  component: Carrinho,
});

const PROVINCIAS = ["Maputo","Matola","Gaza","Inhambane","Sofala","Manica","Tete","Zambézia","Nampula","Cabo Delgado","Niassa"];

function Carrinho() {
  const { items, remove, setQty, total, clear } = useCart();
  const ref = useReferral((s) => s.ref);
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [provincia, setProvincia] = useState("");
  const [bairro, setBairro] = useState("");
  const [pagamento, setPagamento] = useState("whatsapp");
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill from profile + last-used location (localStorage)
  useEffect(() => {
    if (profile?.nome && !nome) setNome(profile.nome);
    if (profile?.telefone && !telefone) setTelefone(profile.telefone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("aura-delivery");
    if (saved) {
      try {
        const d = JSON.parse(saved) as { provincia?: string; bairro?: string };
        if (d.provincia && !provincia) setProvincia(d.provincia);
        if (d.bairro && !bairro) setBairro(d.bairro);
      } catch { /* noop */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const PAY_LABEL: Record<string, string> = {
    whatsapp: "WhatsApp (combinar)",
    mpesa: "M-Pesa",
    emola: "e-Mola",
    visa: "Visa",
  };
  const discountRate = pagamento === "mpesa" || pagamento === "emola" ? 0.08 : 0;
  const subtotal = total();
  const desconto = Math.round(subtotal * discountRate);
  const totalFinal = subtotal - desconto;

  const checkout = async () => {
    if (!user) {
      toast.error("Inicie sessão para finalizar o pedido");
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("aura-post-login", "/carrinho");
      }
      navigate({ to: "/auth" });
      return;
    }
    if (!nome.trim() || !provincia || !bairro.trim()) {
      toast.error("Preencha nome, província e bairro");
      return;
    }
    if (items.length === 0) return;
    setSubmitting(true);
    const localizacao = `${provincia} - ${bairro}`;
    // Persist client data for next purchases
    await supabase.from("profiles").update({ nome, telefone }).eq("id", user.id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("aura-delivery", JSON.stringify({ provincia, bairro }));
    }
    await refreshProfile();
    await supabase.from("pedidos").insert({
      user_id: user.id,
      nome_cliente: nome,
      telefone,
      localizacao,
      items: items.map((i) => ({
        id: i.produto.id,
        nome: i.produto.nome,
        qty: i.qty,
        preco: i.produto.preco,
        por_encomenda: !!i.por_encomenda,
      })),
      total: totalFinal,
      nhoguista_codigo: ref,
    });
    const msg = buildWhatsAppMessage(items, {
      nome, localizacao, telefone, ref,
      pagamento: PAY_LABEL[pagamento],
      desconto, total: totalFinal,
    });
    window.open(whatsappLink(msg), "_blank");
    clear();
    toast.success("Pedido enviado! Continuando no WhatsApp.");
    navigate({ to: "/" });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">O seu carrinho está vazio</h1>
        <p className="mt-2 text-muted-foreground">Explore o catálogo e descubra fragrâncias únicas.</p>
        <Link to="/catalogo" className="mt-6 inline-block rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <h1 className="font-display text-3xl">Carrinho</h1>
        <div className="mt-6 space-y-3">
          {items.map((i) => (
            <div key={i.produto.id} className="flex gap-4 rounded-xl border border-border/60 bg-card p-3">
              <div className="h-24 w-24 overflow-hidden rounded-md bg-black/40">
                {i.produto.imagem_url && <img src={i.produto.imagem_url} alt={i.produto.nome} className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{i.produto.nome}</p>
                    <p className="text-xs text-muted-foreground">{i.produto.marca}</p>
                    {i.por_encomenda && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                        <AlertTriangle className="h-3 w-3" /> Por encomenda
                      </p>
                    )}
                  </div>
                  <button onClick={() => remove(i.produto.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-border">
                    <button onClick={() => setQty(i.produto.id, i.qty - 1)} className="px-3 py-1">−</button>
                    <span className="w-8 text-center text-sm">{i.qty}</span>
                    <button onClick={() => setQty(i.produto.id, i.qty + 1)} className="px-3 py-1">+</button>
                  </div>
                  <p className="font-semibold text-gold">{formatMZN(i.produto.preco * i.qty)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-fit rounded-xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-xl">Resumo do pedido</h2>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span><span>{formatMZN(total())}</span>
        </div>
        {desconto > 0 && (
          <div className="mt-1 flex justify-between text-sm text-emerald-400">
            <span>Desconto {pagamento === "mpesa" ? "M-Pesa" : "e-Mola"} (8%)</span>
            <span>-{formatMZN(desconto)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between text-sm text-muted-foreground">
          <span>Entrega</span><span>A combinar</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold">
          <span>Total</span><span className="text-gold">{formatMZN(totalFinal)}</span>
        </div>

        <div className="mt-6 space-y-3">
          <Input placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input placeholder="Telefone (opcional)" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          <select
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Província</option>
            {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <Input placeholder="Distrito / Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Forma de pagamento</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <PayOption id="whatsapp" cur={pagamento} set={setPagamento} label="WhatsApp" sub="Combinar" color="#25D366" />
            <PayOption id="mpesa" cur={pagamento} set={setPagamento} label="M-Pesa" sub="-8%" color="#ED1C24" />
            <PayOption id="emola" cur={pagamento} set={setPagamento} label="e-Mola" sub="-8%" color="#F58220" />
            <PayOption id="visa" cur={pagamento} set={setPagamento} label="Visa" sub="" color="#1A1F71" />
          </div>
        </div>

        {!user && !authLoading && (
          <p className="mt-4 flex items-center gap-2 rounded-md border border-gold/30 bg-gold/5 p-3 text-xs text-gold">
            <Lock className="h-3.5 w-3.5" /> Inicie sessão para finalizar o pedido.
          </p>
        )}

        <CheckoutButton pagamento={pagamento} submitting={submitting} onClick={checkout} />
        {ref && <p className="mt-3 text-center text-xs text-muted-foreground">Ref. Nhoguista: <span className="text-gold">{ref}</span></p>}
      </div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold" />;
}
function PayOption({ id, cur, set, label, sub, color }: { id: string; cur: string; set: (s: string) => void; label: string; sub: string; color: string }) {
  const active = cur === id;
  return (
    <button
      type="button"
      onClick={() => set(id)}
      className={`flex flex-col items-start gap-1 rounded-md border-2 px-3 py-2.5 text-left transition ${active ? "bg-card" : "border-border bg-background/40 hover:border-border"}`}
      style={active ? { borderColor: color } : undefined}
    >
      <span className="text-xs font-bold" style={{ color }}>{label}</span>
      {sub && <span className="text-[10px] uppercase tracking-widest text-emerald-400">{sub}</span>}
    </button>
  );
}

function CheckoutButton({ pagamento, submitting, onClick }: { pagamento: string; submitting: boolean; onClick: () => void }) {
  const cfg: Record<string, { bg: string; fg: string; label: string }> = {
    whatsapp: { bg: "#25D366", fg: "#fff", label: "Finalizar pelo WhatsApp" },
    mpesa: { bg: "#ED1C24", fg: "#fff", label: "Pagar com M-Pesa" },
    emola: { bg: "#F58220", fg: "#fff", label: "Pagar com e-Mola" },
    visa: { bg: "#1A1F71", fg: "#fff", label: "Pagar com Visa" },
  };
  const c = cfg[pagamento] ?? cfg.whatsapp;
  return (
    <button
      onClick={onClick}
      disabled={submitting}
      style={{ backgroundColor: c.bg, color: c.fg }}
      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold uppercase tracking-widest shadow-lg transition hover:opacity-90 disabled:opacity-50"
    >
      <MessageCircle className="h-4 w-4" /> {c.label}
    </button>
  );
}