import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Nhoguista, Produto, Pedido } from "@/lib/types";
import { normalizePedidoItems } from "@/lib/types";
import { formatMZN } from "@/lib/format";
import { toast } from "sonner";
import { Copy, Share2, Link2, MousePointerClick, CheckCircle2, Package, Clock, Phone } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/supabase";
import { track } from "@/lib/events";
import { NHOGUISTA_SEM_STOCK_SETTING, NHOGUISTA_COM_STOCK_SETTING, getBooleanSetting } from "@/lib/settings";
import { DashboardComStock } from "@/components/DashboardComStock";
import { ModeSwitchButton } from "@/components/ModeSwitchButton";

export const Route = createFileRoute("/nhoguista")({ component: Page });

const PROVINCIAS = ["Maputo","Matola","Gaza","Inhambane","Sofala","Manica","Tete","Zambézia","Nampula","Cabo Delgado","Niassa"];

function Page() {
  const { user, loading } = useAuth();
  const [n, setN] = useState<Nhoguista | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { setChecking(false); return; }
    supabase.from("nhoguistas").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { setN(data as Nhoguista | null); setChecking(false); });
  }, [user, loading]);

  if (loading || checking) return <div className="p-20 text-center text-muted-foreground">A carregar…</div>;

  if (!user) return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-display text-4xl">Programa Nhoguista</h1>
      <p className="mt-3 text-muted-foreground">Ganhe comissões revendendo perfumes AURA SCENTRA. Inicie sessão para se candidatar.</p>
      <Link to="/auth" className="mt-6 inline-block rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground">Entrar</Link>
    </div>
  );

  if (!n) return <Apply userId={user.id} onCreated={setN} />;
  const refresh = async () => {
    const { data } = await supabase.from("nhoguistas").select("*").eq("id", n.id).maybeSingle();
    if (data) setN(data as Nhoguista);
  };
  if (n.tipo === "com_stock" && n.status === "aprovado") return <DashboardComStock n={n} onRefresh={refresh} />;
  return <Dashboard n={n} onRefresh={refresh} />;
}

function Apply({ userId, onCreated }: { userId: string; onCreated: (n: Nhoguista) => void }) {
  const [telefone, setTelefone] = useState("");
  const [provincia, setProvincia] = useState("");
  const [tipo, setTipo] = useState<"sem_stock" | "com_stock">("sem_stock");
  const [semStockOpen, setSemStockOpen] = useState(true);
  const [comStockOpen, setComStockOpen] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBooleanSetting(NHOGUISTA_SEM_STOCK_SETTING, true).then((result) => {
      setSemStockOpen(result.value);
      if (!result.value) setTipo("com_stock");
    });
    getBooleanSetting(NHOGUISTA_COM_STOCK_SETTING, true).then((result) => {
      setComStockOpen(result.value);
    });
  }, []);

  const apply = async () => {
    if (!telefone || !provincia) return toast.error("Preencha todos os campos");
    if (tipo === "sem_stock" && !semStockOpen) return toast.error("Candidaturas sem stock estão temporariamente inactivas");
    if (tipo === "com_stock" && !comStockOpen) return toast.error("Candidaturas com stock estão temporariamente inactivas");
    setBusy(true);
    const codigo = "REV-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    // sem_stock = auto-aprovado (dashboard de partilha). com_stock = pendente (admin contacta).
    const status = tipo === "sem_stock" ? "aprovado" : "pendente";
    let { data, error } = await supabase
      .from("nhoguistas")
      .insert({ user_id: userId, codigo, telefone, provincia, status, tipo })
      .select()
      .single();
    if (error && /column .*tipo|"tipo"/i.test(error.message)) {
      // fallback: schema sem coluna tipo
      const retry = await supabase
        .from("nhoguistas")
        .insert({ user_id: userId, codigo, telefone, provincia, status })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    onCreated({ ...(data as Nhoguista), tipo });
    toast.success(
      tipo === "sem_stock"
        ? "Bem-vindo Nhoguista! O seu painel está pronto."
        : "Candidatura enviada — o administrador entrará em contacto.",
    );
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Candidatar a Nhoguista</h1>
      <p className="mt-2 text-sm text-muted-foreground">Preencha os dados para se tornar revendedor oficial.</p>
      <div className="mt-6 space-y-3 rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { if (semStockOpen) setTipo("sem_stock"); }}
            disabled={!semStockOpen}
            className={`rounded-md border-2 px-3 py-3 text-left text-xs transition ${tipo === "sem_stock" ? "border-gold bg-gold/5" : "border-border bg-background/40"} ${!semStockOpen ? "cursor-not-allowed opacity-45" : ""}`}
          >
            <p className="font-semibold uppercase tracking-widest text-gold">Sem stock</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{semStockOpen ? "Partilha links e ganha comissão. Acesso imediato." : "Candidaturas temporariamente inactivas."}</p>
          </button>
          <button
            type="button"
            onClick={() => { if (comStockOpen) setTipo("com_stock"); }}
            disabled={!comStockOpen}
            className={`rounded-md border-2 px-3 py-3 text-left text-xs transition ${tipo === "com_stock" ? "border-gold bg-gold/5" : "border-border bg-background/40"} ${!comStockOpen ? "cursor-not-allowed opacity-45" : ""}`}
          >
            <p className="font-semibold uppercase tracking-widest text-gold">Com stock</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{comStockOpen ? "Recebe produtos para revender. Admin contacta em 48h." : "Candidaturas temporariamente inactivas."}</p>
          </button>
        </div>
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone (ex: 84xxxxxxx)" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm" />
        <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm">
          <option value="">Província</option>
          {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={apply} disabled={busy} className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-60">
          {busy ? "A enviar…" : "Candidatar"}
        </button>
      </div>
    </div>
  );
}

function Dashboard({ n, onRefresh }: { n: Nhoguista; onRefresh: () => void }) {
  const [tab, setTab] = useState<"produtos" | "pedidos">("produtos");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [evCounts, setEvCounts] = useState({ shares: 0, finalizar: 0 });
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const storeLink = `${origin}/?ref=${n.codigo}`;

  useEffect(() => {
    supabase.from("produtos").select("*").order("created_at", { ascending: false })
      .then(({ data }) => {
        const all = (data ?? []) as Produto[];
        setProdutos(all.filter((p) => p.disponivel_sem_stock !== false));
      });
    supabase.from("pedidos").select("*").eq("nhoguista_codigo", n.codigo).order("created_at", { ascending: false })
      .then(({ data }) => setPedidos((data ?? []) as Pedido[]));
    supabase.from("eventos").select("tipo").eq("nhoguista_codigo", n.codigo)
      .then(({ data }) => {
        const evs = (data ?? []) as { tipo: string }[];
        setEvCounts({
          shares: evs.filter((e) => e.tipo === "share_link").length,
          finalizar: evs.filter((e) => e.tipo === "click_finalizar").length,
        });
      });
  }, [n.codigo]);

  const stats = useMemo(() => ({ qtd: pedidos.length }), [pedidos]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
    track("share_link", null, n.codigo);
    setEvCounts((c) => ({ ...c, shares: c.shares + 1 }));
  };

  const share = (title: string, url: string) => {
    track("share_link", null, n.codigo);
    setEvCounts((c) => ({ ...c, shares: c.shares + 1 }));
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url, text: `${title} — AURA SCENTRA` }).catch(() => copy(url, "Link"));
    } else {
      copy(url, "Link");
    }
  };

  if (n.status !== "aprovado") {
    const created = new Date(n.created_at).getTime();
    const hrs = (Date.now() - created) / 36e5;
    const past48h = hrs >= 48;
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-4xl">Nhoguista com stock</h1>
        <div className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-6">
          <p className="inline-flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gold" />
            <span>Estado: <span className="font-semibold text-gold uppercase">{n.status}</span></span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            A sua candidatura foi recebida. O administrador entrará em contacto consigo dentro de <span className="text-gold font-semibold">48 horas</span> para combinar a entrega dos produtos.
          </p>
          {past48h && (
            <div className="mt-5 rounded-md border border-gold/40 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-widest text-gold">Já passaram 48h?</p>
              <p className="mt-1 text-sm">Contacte o administrador diretamente:</p>
              <a
                href={`https://wa.me/258${WHATSAPP_NUMBER.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Phone className="h-4 w-4" /> +258 {WHATSAPP_NUMBER}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Nhoguista AURA</p>
          <h1 className="mt-1 font-display text-4xl">Painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Código: <span className="font-mono text-gold">{n.codigo}</span></p>
        </div>
        <ModeSwitchButton n={n} onChanged={onRefresh} />
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat icon={<Share2 className="h-4 w-4" />} label="Partilhas" value={String(evCounts.shares)} />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Cliques finalizar" value={String(evCounts.finalizar)} />
        <Stat icon={<Package className="h-4 w-4" />} label="Pedidos gerados" value={String(stats.qtd)} highlight />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Métricas reais do fluxo manual via WhatsApp. Os valores financeiros são combinados directamente com o cliente.
      </p>

      {/* Link geral da loja */}
      <div className="mt-6 rounded-xl border border-gold/30 bg-gradient-to-r from-gold/10 to-transparent p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
          <Link2 className="h-4 w-4" /> Link geral da loja
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Partilhe este link para ganhar comissão em qualquer compra.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="flex-1 truncate rounded bg-background/60 px-3 py-2 text-xs text-gold">{storeLink}</code>
          <button onClick={() => copy(storeLink, "Link")} className="inline-flex items-center gap-1 rounded-md border border-gold/40 px-3 py-2 text-xs text-gold hover:bg-gold/10">
            <Copy className="h-3.5 w-3.5" /> Copiar
          </button>
          <button onClick={() => share("AURA SCENTRA", storeLink)} className="inline-flex items-center gap-1 rounded-md bg-gold px-3 py-2 text-xs font-semibold text-primary-foreground">
            <Share2 className="h-3.5 w-3.5" /> Partilhar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-2 border-b border-border">
        <TabBtn active={tab === "produtos"} onClick={() => setTab("produtos")}>Catálogo & partilha</TabBtn>
        <TabBtn active={tab === "pedidos"} onClick={() => setTab("pedidos")}>Os meus pedidos</TabBtn>
      </div>

      {tab === "produtos" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {produtos.map((p) => {
            const link = `${origin}/produto/${p.id}?ref=${n.codigo}`;
            return (
              <div key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
                <div className="aspect-square overflow-hidden bg-black/40">
                  {p.imagem_url && <img src={p.imagem_url} alt={p.nome} className="h-full w-full object-cover" />}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-display text-lg leading-tight">{p.nome}</h3>
                  <p className="text-xs text-muted-foreground">{p.marca}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gold">{formatMZN(p.preco)}</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-400">
                      Comissão {formatMZN(p.comissao_valor ?? 0)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => copy(link, "Link do produto")} className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold">
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </button>
                    <button onClick={() => share(p.nome, link)} className="inline-flex items-center justify-center gap-1 rounded-md bg-gold px-2 py-2 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground">
                      <Share2 className="h-3.5 w-3.5" /> Partilhar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "pedidos" && (
        <div className="mt-6 space-y-2">
          {pedidos.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Ainda sem pedidos com o seu código.</p>}
          {pedidos.map((p) => (
              <div key={p.id} className="rounded-lg border border-border/60 bg-card p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{p.nome_cliente}</p>
                  <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">{p.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-MZ")} • {p.localizacao}</p>
                <p className="mt-1 text-xs">{normalizePedidoItems(p.items).map((i) => `${i.nome} x${i.qty}`).join(", ") || "Itens não detalhados"}</p>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-gold/40 bg-gold/5" : "border-border/60 bg-card"}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">{icon}{label}</div>
      <p className={`mt-2 text-2xl font-display ${highlight ? "text-gold" : ""}`}>{value}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm uppercase tracking-widest transition ${active ? "border-b-2 border-gold text-gold" : "text-muted-foreground hover:text-foreground"}`}>{children}</button>
  );
}