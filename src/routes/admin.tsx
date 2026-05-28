import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Produto, Nhoguista, Pedido } from "@/lib/types";
import { formatMZN } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Upload, Package, Users, ShoppingBag, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: Admin });

type Tab = "stats" | "produtos" | "nhoguistas" | "pedidos";

function Admin() {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("stats");
  if (loading) return <div className="p-20 text-center text-muted-foreground">A carregar…</div>;
  if (!profile?.is_admin) return <div className="p-20 text-center text-muted-foreground">Acesso restrito.</div>;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "Visão geral", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "produtos", label: "Produtos", icon: <Package className="h-4 w-4" /> },
    { id: "nhoguistas", label: "Nhoguistas", icon: <Users className="h-4 w-4" /> },
    { id: "pedidos", label: "Pedidos", icon: <ShoppingBag className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-4xl">Admin</h1>
      <div className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-widest transition ${tab === t.id ? "border-b-2 border-gold text-gold" : "text-muted-foreground hover:text-foreground"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "stats" && <Stats />}
        {tab === "produtos" && <Produtos />}
        {tab === "nhoguistas" && <Nhogs />}
        {tab === "pedidos" && <Pedidos />}
      </div>
    </div>
  );
}

function Stats() {
  const [s, setS] = useState({ produtos: 0, pedidos: 0, vendas: 0, nhoguistas: 0 });
  useEffect(() => {
    (async () => {
      const [p, pe, n] = await Promise.all([
        supabase.from("produtos").select("id", { count: "exact", head: true }),
        supabase.from("pedidos").select("total"),
        supabase.from("nhoguistas").select("id", { count: "exact", head: true }),
      ]);
      const vendas = (pe.data ?? []).reduce((sum: number, r: { total: number }) => sum + (r.total ?? 0), 0);
      setS({ produtos: p.count ?? 0, pedidos: (pe.data ?? []).length, vendas, nhoguistas: n.count ?? 0 });
    })();
  }, []);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Produtos" value={String(s.produtos)} icon={<Package />} />
      <StatCard label="Pedidos" value={String(s.pedidos)} icon={<ShoppingBag />} />
      <StatCard label="Vendas totais" value={formatMZN(s.vendas)} icon={<TrendingUp />} highlight />
      <StatCard label="Nhoguistas" value={String(s.nhoguistas)} icon={<Users />} />
    </div>
  );
}
function StatCard({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? "border-gold/40 bg-gold/5" : "border-border/60 bg-card"}`}>
      <div className="flex items-center justify-between text-muted-foreground"><span className="text-xs uppercase tracking-widest">{label}</span><span className="text-gold">{icon}</span></div>
      <p className={`mt-3 font-display text-3xl ${highlight ? "text-gold" : ""}`}>{value}</p>
    </div>
  );
}

const emptyForm = {
  nome: "", marca: "", preco: "", categoria: "masculino", imagem_url: "",
  descricao: "", destaque: false, tag: "", stock: "10",
  comissao_valor: "0", avaliacao: "4.8", num_avaliacoes: "0",
};

function Produtos() {
  const [items, setItems] = useState<Produto[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const load = () => supabase.from("produtos").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems((data ?? []) as Produto[]));
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("Eliminar este produto?")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto eliminado"); load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} produtos</p>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold">
          <Plus className="h-4 w-4" /> Criar produto
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
            {p.imagem_url ? <img src={p.imagem_url} alt="" className="h-16 w-16 rounded object-cover" /> : <div className="h-16 w-16 rounded bg-background" />}
            <div className="flex-1 text-sm min-w-0">
              <p className="truncate font-medium">{p.nome}</p>
              <p className="text-xs text-muted-foreground">{p.marca} • {formatMZN(p.preco)}</p>
              <p className="text-[10px] uppercase tracking-widest text-gold">{p.categoria} • stock {p.stock} • comissão {formatMZN(p.comissao_valor ?? 0)}</p>
            </div>
            <button onClick={() => { setEditing(p); setOpen(true); }} className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-gold"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => del(p.id)} className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {open && <ProductModal initial={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function ProductModal({ initial, onClose, onSaved }: { initial: Produto | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(() => initial ? {
    nome: initial.nome, marca: initial.marca ?? "", preco: String(initial.preco),
    categoria: initial.categoria ?? "masculino", imagem_url: initial.imagem_url ?? "",
    descricao: initial.descricao ?? "", destaque: initial.destaque,
    tag: initial.tag ?? "", stock: String(initial.stock ?? 10),
    comissao_valor: String(initial.comissao_valor ?? 0),
    avaliacao: String(initial.avaliacao ?? 4.8),
    num_avaliacoes: String(initial.num_avaliacoes ?? 0),
  } : emptyForm);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("produtos").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("produtos").getPublicUrl(path);
    setForm((f) => ({ ...f, imagem_url: data.publicUrl }));
    toast.success("Imagem enviada");
  };

  const save = async () => {
    if (!form.nome || !form.preco) return toast.error("Nome e preço são obrigatórios");
    setBusy(true);
    const payload = {
      nome: form.nome, marca: form.marca || null, preco: Number(form.preco),
      categoria: form.categoria, imagem_url: form.imagem_url || null,
      descricao: form.descricao || null, destaque: form.destaque,
      tag: form.tag || null, stock: Number(form.stock) || 0,
      comissao_valor: Number(form.comissao_valor) || 0,
      avaliacao: Number(form.avaliacao) || null,
      num_avaliacoes: Number(form.num_avaliacoes) || 0,
    };
    const op = initial
      ? supabase.from("produtos").update(payload).eq("id", initial.id)
      : supabase.from("produtos").insert(payload);
    const { error } = await op;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Produto atualizado" : "Produto criado");
    onSaved();
  };

  const F = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 md:items-center md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border/60 bg-card md:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h3 className="font-display text-xl">{initial ? "Editar produto" : "Novo produto"}</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome *"><input className={inp} value={form.nome} onChange={(e) => F("nome", e.target.value)} /></Field>
            <Field label="Marca"><input className={inp} value={form.marca} onChange={(e) => F("marca", e.target.value)} /></Field>
            <Field label="Preço (MZN) *"><input type="number" className={inp} value={form.preco} onChange={(e) => F("preco", e.target.value)} /></Field>
            <Field label="Categoria">
              <select className={inp} value={form.categoria} onChange={(e) => F("categoria", e.target.value)}>
                <option value="masculino">Masculino</option><option value="feminino">Feminino</option><option value="unissex">Unissex</option>
              </select>
            </Field>
            <Field label="Tag (etiqueta)">
              <select className={inp} value={form.tag} onChange={(e) => F("tag", e.target.value)}>
                <option value="">Nenhuma</option>
                <option value="novo">Novo</option>
                <option value="promocao">Promoção</option>
                <option value="mais_vendido">Mais vendido</option>
                <option value="queima_stock">Queima de stock</option>
              </select>
            </Field>
            <Field label="Stock"><input type="number" className={inp} value={form.stock} onChange={(e) => F("stock", e.target.value)} /></Field>
            <Field label="Comissão Nhoguista (MZN)"><input type="number" className={inp} value={form.comissao_valor} onChange={(e) => F("comissao_valor", e.target.value)} /></Field>
            <Field label="Avaliação (0-5)"><input type="number" step="0.1" className={inp} value={form.avaliacao} onChange={(e) => F("avaliacao", e.target.value)} /></Field>
            <Field label="Nº avaliações"><input type="number" className={inp} value={form.num_avaliacoes} onChange={(e) => F("num_avaliacoes", e.target.value)} /></Field>
            <Field label="Destaque na home">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.destaque} onChange={(e) => F("destaque", e.target.checked)} />
                <span className="text-muted-foreground">Mostrar em destaque</span>
              </label>
            </Field>
          </div>
          <Field label="Descrição">
            <textarea rows={3} className={inp} value={form.descricao} onChange={(e) => F("descricao", e.target.value)} />
          </Field>
          <Field label="Imagem (URL ou upload)">
            <input className={inp} placeholder="https://..." value={form.imagem_url} onChange={(e) => F("imagem_url", e.target.value)} />
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-gold hover:text-gold">
              <Upload className="h-4 w-4" /> Carregar imagem
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {form.imagem_url && <img src={form.imagem_url} alt="" className="mt-3 h-32 w-32 rounded-lg object-cover" />}
          </Field>
        </div>
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button>
          <button onClick={save} disabled={busy} className="rounded-md bg-gold px-6 py-2 text-sm font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-60">{busy ? "A guardar…" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}
const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>{children}</div>;
}

function Nhogs() {
  const [items, setItems] = useState<(Nhoguista & { profiles?: { nome: string | null } })[]>([]);
  const load = () => supabase.from("nhoguistas").select("*, profiles(nome)").order("created_at", { ascending: false }).then(({ data }) => setItems((data ?? []) as never));
  useEffect(() => { load(); }, []);
  const set = async (id: string, status: string) => {
    const { error } = await supabase.from("nhoguistas").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Nhoguista ${status}`); load();
  };
  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Sem candidaturas.</p>}
      {items.map((n) => (
        <div key={n.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card p-3 text-sm">
          <div className="flex-1 min-w-[200px]">
            <p className="font-medium">{n.profiles?.nome ?? n.codigo}</p>
            <p className="text-xs text-muted-foreground">{n.codigo} • {n.provincia} • {n.telefone}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-widest ${n.status === "aprovado" ? "bg-emerald-500/10 text-emerald-400" : n.status === "rejeitado" ? "bg-destructive/10 text-destructive" : "bg-gold/10 text-gold"}`}>{n.status}</span>
          {n.status !== "aprovado" && <button onClick={() => set(n.id, "aprovado")} className="rounded border border-emerald-500/40 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10">Aprovar</button>}
          {n.status !== "rejeitado" && <button onClick={() => set(n.id, "rejeitado")} className="rounded border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Rejeitar</button>}
        </div>
      ))}
    </div>
  );
}

function Pedidos() {
  const [items, setItems] = useState<Pedido[]>([]);
  const load = () => supabase.from("pedidos").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems((data ?? []) as Pedido[]));
  useEffect(() => {
    load();
    const ch = supabase.channel("pedidos-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos" }, (payload) => {
        toast.success(`Novo pedido de ${(payload.new as Pedido).nome_cliente}`);
        load();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Estado atualizado"); load();
  };
  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Sem pedidos.</p>}
      {items.map((p) => (
        <div key={p.id} className="rounded-lg border border-border/60 bg-card p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{p.nome_cliente}</p>
              <p className="text-xs text-muted-foreground">{p.localizacao} • {p.telefone} • {new Date(p.created_at).toLocaleString("pt-MZ")}</p>
            </div>
            <span className="text-gold">{formatMZN(p.total)}</span>
          </div>
          <p className="mt-2 text-xs">{p.items.map((i) => `${i.nome} x${i.qty}`).join(", ")}</p>
          {p.nhoguista_codigo && <p className="mt-1 text-xs text-gold">Ref: {p.nhoguista_codigo}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-xs">
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}