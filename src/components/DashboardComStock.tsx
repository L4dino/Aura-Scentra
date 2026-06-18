import { useEffect, useMemo, useState } from "react";
import { supabase, WHATSAPP_NUMBER } from "@/lib/supabase";
import type { Nhoguista, Produto, Requisicao } from "@/lib/types";
import { normalizeRequisicaoItems } from "@/lib/types";
import { useRequisicao } from "@/lib/requisicao-store";
import { formatMZN } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Minus, Trash2, ShoppingBag, Send, TrendingUp, AlertCircle, ClipboardList } from "lucide-react";
import { buildRequisicaoMessage, whatsappLink } from "@/lib/whatsapp";
import { useAuth } from "@/lib/auth";
import { ModeSwitchButton } from "@/components/ModeSwitchButton";

export function DashboardComStock({ n, onRefresh }: { n: Nhoguista; onRefresh?: () => void }) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<"catalogo" | "requisicao" | "historico">("catalogo");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [busy, setBusy] = useState(false);
  const [observacaoGeral, setObservacaoGeral] = useState("");
  const cart = useRequisicao();

  useEffect(() => {
    supabase.from("produtos").select("*").order("created_at", { ascending: false })
      .then(({ data }) => {
        const all = (data ?? []) as Produto[];
        // Mostrar apenas produtos disponíveis para com_stock (default true)
        setProdutos(all.filter((p) => p.disponivel_com_stock !== false));
      });
  }, []);

  const loadRequisicoes = () => {
    supabase.from("requisicoes").select("*").eq("nhoguista_codigo", n.codigo).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) return;
        setRequisicoes((data ?? []) as Requisicao[]);
      });
  };
  useEffect(() => { loadRequisicoes(); }, [n.codigo]);

  const stats = useMemo(() => ({
    itensCarrinho: cart.count(),
    totalEstimado: cart.totalEstimado(),
    requisicoesPendentes: requisicoes.filter((r) => r.status === "pendente").length,
  }), [cart, requisicoes]);

  const finalizar = async () => {
    if (cart.items.length === 0) return toast.error("Carrinho vazio");
    for (const it of cart.items) {
      const minQ = Math.max(1, Number(it.produto.qty_minima_revenda ?? 1));
      if (it.qty < minQ) return toast.error(`${it.produto.nome}: mínimo ${minQ} unidades`);
    }
    setBusy(true);
    const codigo = `REQ-${Date.now().toString().slice(-6)}`;
    const items = cart.items.map((i) => ({
      produto_id: i.produto.id,
      nome: i.produto.nome,
      qty: i.qty,
      preco_revendedor: Number(i.produto.preco_revendedor ?? i.produto.preco),
      preco_venda_sugerido: Number(i.produto.preco_venda_sugerido ?? i.produto.preco),
      observacao: i.observacao ?? null,
    }));
    const total = items.reduce((s, i) => s + (i.preco_revendedor ?? 0) * i.qty, 0);
    const payload = {
      codigo,
      nhoguista_id: n.id,
      nhoguista_codigo: n.codigo,
      user_id: n.user_id,
      nome_revendedor: profile?.nome ?? null,
      telefone: n.telefone,
      items,
      total_estimado: total,
      observacao: observacaoGeral || null,
      status: "pendente",
    };
    const { data, error } = await supabase.from("requisicoes").insert(payload).select().single();
    setBusy(false);
    if (error) {
      if (error.code === "42P01" || /relation .* does not exist/i.test(error.message)) {
        return toast.error("Sistema de requisições ainda não instalado — execute o SQL fornecido.");
      }
      return toast.error(error.message);
    }
    const saved = data as Requisicao;
    const msg = buildRequisicaoMessage(items, {
      codigo: saved.codigo,
      nomeRevendedor: profile?.nome ?? n.codigo,
      telefone: n.telefone,
      status: "pendente",
      observacao: observacaoGeral,
    });
    window.open(whatsappLink(msg, WHATSAPP_NUMBER), "_blank");
    cart.clear();
    setObservacaoGeral("");
    loadRequisicoes();
    toast.success(`Requisição ${saved.codigo} enviada`);
    setTab("historico");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Nhoguista com stock</p>
          <h1 className="mt-1 font-display text-4xl">Painel de Gestão</h1>
          <p className="mt-1 text-sm text-muted-foreground">Código: <span className="font-mono text-gold">{n.codigo}</span></p>
        </div>
        <ModeSwitchButton n={n} onChanged={() => onRefresh?.()} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat icon={<ShoppingBag className="h-4 w-4" />} label="No carrinho" value={String(stats.itensCarrinho)} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Total estimado" value={formatMZN(stats.totalEstimado)} highlight />
        <Stat icon={<ClipboardList className="h-4 w-4" />} label="Requisições pendentes" value={String(stats.requisicoesPendentes)} />
      </div>

      <div className="mt-8 flex gap-2 border-b border-border">
        <TabBtn active={tab === "catalogo"} onClick={() => setTab("catalogo")}>Catálogo</TabBtn>
        <TabBtn active={tab === "requisicao"} onClick={() => setTab("requisicao")}>
          Carrinho ({stats.itensCarrinho})
        </TabBtn>
        <TabBtn active={tab === "historico"} onClick={() => setTab("historico")}>Histórico</TabBtn>
      </div>

      {tab === "catalogo" && (
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {produtos.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">Sem produtos disponíveis para revendedor com stock.</p>}
          {produtos.map((p) => {
            const compra = Number(p.preco_revendedor ?? p.preco);
            const venda = Number(p.preco_venda_sugerido ?? p.preco);
            const margem = venda - compra;
            const margemPct = compra > 0 ? Math.round((margem / compra) * 100) : 0;
            const minQ = Math.max(1, Number(p.qty_minima_revenda ?? 1));
            const inCart = cart.items.find((i) => i.produto.id === p.id);
            const stockBaixo = (p.stock ?? 0) <= 5;
            return (
              <div key={p.id} className="overflow-hidden rounded-xl border border-border/60 bg-card">
                <div className="flex gap-3 p-3">
                  {p.imagem_url && <img src={p.imagem_url} alt={p.nome} className="h-20 w-20 rounded object-cover" />}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{p.nome}</h3>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{p.marca}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest">
                      <span className={stockBaixo ? "text-destructive" : "text-emerald-400"}>Stock: {p.stock ?? 0}</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-border/60 bg-background/40 px-3 py-2 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Compra</p>
                    <p className="font-semibold text-gold">{formatMZN(compra)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Venda sugerida</p>
                    <p className="font-semibold">{formatMZN(venda)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Margem</p>
                    <p className="font-semibold text-emerald-400">{formatMZN(margem)} ({margemPct}%)</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Qty mínima</p>
                    <p className="font-semibold">{minQ}</p>
                  </div>
                </div>
                <div className="p-3">
                  {inCart ? (
                    <p className="text-center text-xs text-emerald-400">✓ {inCart.qty}× no carrinho</p>
                  ) : (
                    <button
                      onClick={() => { cart.add(p, minQ); toast.success("Adicionado à requisição"); }}
                      disabled={(p.stock ?? 0) <= 0}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-gold px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar à requisição
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "requisicao" && (
        <div className="mt-6 space-y-3">
          {cart.items.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Carrinho vazio. Adicione produtos do catálogo.</p>
          )}
          {cart.items.map((it) => {
            const compra = Number(it.produto.preco_revendedor ?? it.produto.preco);
            const minQ = Math.max(1, Number(it.produto.qty_minima_revenda ?? 1));
            return (
              <div key={it.produto.id} className="rounded-lg border border-border/60 bg-card p-3">
                <div className="flex items-center gap-3">
                  {it.produto.imagem_url && <img src={it.produto.imagem_url} alt="" className="h-16 w-16 rounded object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{it.produto.nome}</p>
                    <p className="text-xs text-gold">{formatMZN(compra)} × {it.qty} = {formatMZN(compra * it.qty)}</p>
                    <p className="text-[10px] text-muted-foreground">Mínimo: {minQ}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => cart.setQty(it.produto.id, it.qty - 1)} className="rounded border border-border p-1.5 hover:border-gold"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm">{it.qty}</span>
                    <button onClick={() => cart.setQty(it.produto.id, it.qty + 1)} className="rounded border border-border p-1.5 hover:border-gold"><Plus className="h-3 w-3" /></button>
                    <button onClick={() => cart.remove(it.produto.id)} className="ml-1 rounded p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <input
                  value={it.observacao ?? ""}
                  onChange={(e) => cart.setObs(it.produto.id, e.target.value)}
                  placeholder="Observação (opcional)"
                  className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
                />
              </div>
            );
          })}
          {cart.items.length > 0 && (
            <div className="rounded-lg border border-gold/40 bg-gold/5 p-4 space-y-3">
              <textarea
                rows={2}
                value={observacaoGeral}
                onChange={(e) => setObservacaoGeral(e.target.value)}
                placeholder="Observação geral da requisição (opcional)"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Total estimado</p>
                  <p className="text-2xl font-display text-gold">{formatMZN(stats.totalEstimado)}</p>
                </div>
                <button
                  onClick={finalizar}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-60"
                >
                  <Send className="h-4 w-4" /> {busy ? "A enviar…" : "Finalizar requisição"}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Será aberto o WhatsApp do administrador com o resumo.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "historico" && (
        <div className="mt-6 space-y-2">
          {requisicoes.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Ainda sem requisições.</p>}
          {requisicoes.map((r) => (
            <div key={r.id} className="rounded-lg border border-border/60 bg-card p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-mono text-gold">{r.codigo}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                  r.status === "pendente" ? "bg-gold/10 text-gold"
                  : r.status === "aprovada" ? "bg-blue-500/10 text-blue-400"
                  : r.status === "entregue" ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-destructive/10 text-destructive"
                }`}>{r.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-MZ")}</p>
              <p className="mt-1 text-xs">{normalizeRequisicaoItems(r.items).map((i) => `${i.nome} x${i.qty}`).join(", ")}</p>
              {r.total_estimado > 0 && <p className="mt-1 text-xs text-gold">Total: {formatMZN(r.total_estimado)}</p>}
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