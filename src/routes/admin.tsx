import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Produto, Nhoguista, Pedido, Banner } from "@/lib/types";
import { normalizePedidoItems } from "@/lib/types";
import { formatMZN } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Upload, Package, Users, ShoppingBag, TrendingUp, Eye, MousePointerClick, MessageCircle, CheckCircle2, Image as ImageIcon, UserCog, Search, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { PROVINCIAS, normalizeProvincias } from "@/lib/region";
import { NHOGUISTA_SEM_STOCK_SETTING, NHOGUISTA_COM_STOCK_SETTING, getBooleanSetting, setBooleanSetting } from "@/lib/settings";
import { normalizeRequisicaoItems } from "@/lib/types";
import type { Requisicao } from "@/lib/types";
import { whatsappPedidoLink, whatsappLink } from "@/lib/whatsapp";
import { produtoVisivelEm } from "@/lib/produto-visibilidade";

export const Route = createFileRoute("/admin")({ component: Admin });

type Tab = "stats" | "produtos" | "banners" | "nhoguistas" | "pedidos" | "requisicoes" | "utilizadores";

function Admin() {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("stats");
  if (loading) return <div className="p-20 text-center text-muted-foreground">A carregar…</div>;
  if (!profile?.is_admin) return <div className="p-20 text-center text-muted-foreground">Acesso restrito.</div>;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "Visão geral", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "produtos", label: "Produtos", icon: <Package className="h-4 w-4" /> },
    { id: "banners", label: "Banners", icon: <ImageIcon className="h-4 w-4" /> },
    { id: "nhoguistas", label: "Nhoguistas", icon: <Users className="h-4 w-4" /> },
    { id: "pedidos", label: "Pedidos", icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "requisicoes", label: "Requisições", icon: <ClipboardList className="h-4 w-4" /> },
    { id: "utilizadores", label: "Utilizadores", icon: <UserCog className="h-4 w-4" /> },
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
        {tab === "banners" && <Banners />}
        {tab === "nhoguistas" && <Nhogs />}
        {tab === "pedidos" && <Pedidos />}
        {tab === "requisicoes" && <Requisicoes />}
        {tab === "utilizadores" && <Utilizadores />}
      </div>
    </div>
  );
}

function Stats() {
  const [s, setS] = useState({
    produtos: 0,
    pedidos: 0,
    nhoguistas: 0,
    views: 0,
    clicksProduto: 0,
    clicksCompra: 0,
    clicksFinalizar: 0,
    clicksWhatsapp: 0,
  });
  useEffect(() => {
    (async () => {
      const [p, pe, n, ev] = await Promise.all([
        supabase.from("produtos").select("id", { count: "exact", head: true }),
        supabase.from("pedidos").select("id", { count: "exact", head: true }),
        supabase.from("nhoguistas").select("id", { count: "exact", head: true }),
        supabase.from("eventos").select("tipo"),
      ]);
      const evs = (ev.data ?? []) as { tipo: string }[];
      const by = (t: string) => evs.filter((e) => e.tipo === t).length;
      setS({
        produtos: p.count ?? 0,
        pedidos: pe.count ?? 0,
        nhoguistas: n.count ?? 0,
        views: by("view_produto"),
        clicksProduto: by("click_produto"),
        clicksCompra: by("click_compra"),
        clicksFinalizar: by("click_finalizar"),
        clicksWhatsapp: by("click_whatsapp"),
      });
    })();
  }, []);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Produtos" value={String(s.produtos)} icon={<Package />} />
        <StatCard label="Pedidos" value={String(s.pedidos)} icon={<ShoppingBag />} highlight />
        <StatCard label="Nhoguistas" value={String(s.nhoguistas)} icon={<Users />} />
        <StatCard label="Visualizações" value={String(s.views)} icon={<Eye />} />
      </div>
      <div>
        <h3 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Comportamento do utilizador</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Cliques em produto" value={String(s.clicksProduto)} icon={<MousePointerClick />} />
          <StatCard label="Cliques em comprar" value={String(s.clicksCompra)} icon={<ShoppingBag />} />
          <StatCard label="Cliques finalizar" value={String(s.clicksFinalizar)} icon={<CheckCircle2 />} />
          <StatCard label="Cliques WhatsApp" value={String(s.clicksWhatsapp)} icon={<MessageCircle />} />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Métricas baseadas em ações reais. Pagamento manual — não é contabilizado como receita confirmada.
        </p>
      </div>
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
  provincias: [] as string[], todas_regioes: true,
  preco_revendedor: "", preco_venda_sugerido: "", qty_minima_revenda: "1",
  disponivel_com_stock: true, disponivel_sem_stock: true, disponivel_catalogo: true,
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
              <p className="mt-1 flex flex-wrap gap-1">
                {produtoVisivelEm(p, "catalogo") && <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">Catálogo</span>}
                {produtoVisivelEm(p, "com_stock") && <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">Com stock</span>}
                {produtoVisivelEm(p, "sem_stock") && <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">Sem stock</span>}
                {!produtoVisivelEm(p, "catalogo") && !produtoVisivelEm(p, "com_stock") && !produtoVisivelEm(p, "sem_stock") && (
                  <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-destructive">Oculto</span>
                )}
              </p>
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
    provincias: normalizeProvincias(initial.provincias),
    todas_regioes: normalizeProvincias(initial.provincias).length === 0,
    preco_revendedor: initial.preco_revendedor != null ? String(initial.preco_revendedor) : "",
    preco_venda_sugerido: initial.preco_venda_sugerido != null ? String(initial.preco_venda_sugerido) : "",
    qty_minima_revenda: String(initial.qty_minima_revenda ?? 1),
    disponivel_com_stock: initial.disponivel_com_stock !== false,
    disponivel_sem_stock: initial.disponivel_sem_stock !== false,
    disponivel_catalogo: initial.disponivel_catalogo !== false,
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
    const selectedProvincias = normalizeProvincias(form.provincias);
    const payload = {
      nome: form.nome, marca: form.marca || null, preco: Number(form.preco),
      categoria: form.categoria, imagem_url: form.imagem_url || null,
      descricao: form.descricao || null, destaque: form.destaque,
      tag: form.tag || null, stock: Number(form.stock) || 0,
      comissao_valor: Number(form.comissao_valor) || 0,
      avaliacao: Number(form.avaliacao) || null,
      num_avaliacoes: Number(form.num_avaliacoes) || 0,
      provincias: form.todas_regioes ? null : selectedProvincias,
      preco_revendedor: form.preco_revendedor ? Number(form.preco_revendedor) : null,
      preco_venda_sugerido: form.preco_venda_sugerido ? Number(form.preco_venda_sugerido) : null,
      qty_minima_revenda: Number(form.qty_minima_revenda) || 1,
      disponivel_com_stock: form.disponivel_com_stock,
      disponivel_sem_stock: form.disponivel_sem_stock,
      disponivel_catalogo: form.disponivel_catalogo,
    };
    if (!form.todas_regioes && selectedProvincias.length === 0) {
      setBusy(false);
      return toast.error("Selecione pelo menos uma província ou marque todas as províncias");
    }
    const tryOp = (p: typeof payload | Record<string, unknown>) => initial
      ? supabase.from("produtos").update(p).eq("id", initial.id)
      : supabase.from("produtos").insert(p);
    let { error } = await tryOp(payload);
    if (error && /column .*"?(preco_revendedor|preco_venda_sugerido|qty_minima_revenda|disponivel_com_stock|disponivel_sem_stock|disponivel_catalogo)"?/i.test(error.message)) {
      // Fallback se as novas colunas ainda não existirem
      const { preco_revendedor: _a, preco_venda_sugerido: _b, qty_minima_revenda: _c, disponivel_com_stock: _d, disponivel_sem_stock: _e, disponivel_catalogo: _f, ...legacy } = payload;
      void _a; void _b; void _c; void _d; void _e; void _f;
      const retry = await tryOp(legacy);
      error = retry.error;
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Produto atualizado" : "Produto criado");
    onSaved();
  };

  const remove = async () => {
    if (!initial) return;
    if (!confirm(`Eliminar "${initial.nome}"? Esta acção não pode ser desfeita.`)) return;
    setBusy(true);
    const { error } = await supabase.from("produtos").delete().eq("id", initial.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Produto eliminado");
    onSaved();
  };

  const F = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const toggleProv = (p: string) =>
    setForm((f) => ({
      ...f,
      provincias: f.provincias.includes(p) ? f.provincias.filter((x) => x !== p) : [...f.provincias, p],
    }));

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
            <Field label="Preço revendedor (MZN)"><input type="number" className={inp} value={form.preco_revendedor} onChange={(e) => F("preco_revendedor", e.target.value)} placeholder="opcional" /></Field>
            <Field label="Preço venda sugerido (MZN)"><input type="number" className={inp} value={form.preco_venda_sugerido} onChange={(e) => F("preco_venda_sugerido", e.target.value)} placeholder="opcional" /></Field>
            <Field label="Qty mínima revenda"><input type="number" className={inp} value={form.qty_minima_revenda} onChange={(e) => F("qty_minima_revenda", e.target.value)} /></Field>
            <Field label="Destaque na home">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.destaque} onChange={(e) => F("destaque", e.target.checked)} />
                <span className="text-muted-foreground">Mostrar em destaque</span>
              </label>
            </Field>
          </div>
          <Field label="Visibilidade do produto">
            <p className="mb-2 text-xs text-muted-foreground">
              Escolha onde o produto aparece. Se nenhuma opção estiver activa, fica oculto em todo o site.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition ${form.disponivel_catalogo ? "border-gold bg-gold/5" : "border-border"}`}>
                <input type="checkbox" className="mt-0.5" checked={form.disponivel_catalogo} onChange={(e) => F("disponivel_catalogo", e.target.checked)} />
                <span>
                  <span className="block font-medium text-foreground">Catálogo normal</span>
                  <span className="text-xs text-muted-foreground">Site público e loja</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition ${form.disponivel_com_stock ? "border-gold bg-gold/5" : "border-border"}`}>
                <input type="checkbox" className="mt-0.5" checked={form.disponivel_com_stock} onChange={(e) => F("disponivel_com_stock", e.target.checked)} />
                <span>
                  <span className="block font-medium text-foreground">Nhoguista com stock</span>
                  <span className="text-xs text-muted-foreground">Painel de revendedor</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition ${form.disponivel_sem_stock ? "border-gold bg-gold/5" : "border-border"}`}>
                <input type="checkbox" className="mt-0.5" checked={form.disponivel_sem_stock} onChange={(e) => F("disponivel_sem_stock", e.target.checked)} />
                <span>
                  <span className="block font-medium text-foreground">Nhoguista sem stock</span>
                  <span className="text-xs text-muted-foreground">Painel de partilha</span>
                </span>
              </label>
            </div>
          </Field>
          <Field label="Descrição">
            <textarea rows={3} className={inp} value={form.descricao} onChange={(e) => F("descricao", e.target.value)} />
          </Field>
          <Field label={`Disponibilidade por província${form.todas_regioes ? "" : ` (${normalizeProvincias(form.provincias).length} selecionadas)`}`}>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.todas_regioes}
                onChange={(e) => F("todas_regioes", e.target.checked)}
              />
              <span className="text-muted-foreground">Disponível em todas as províncias</span>
            </label>
            {!form.todas_regioes && (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {PROVINCIAS.map((p) => {
                  const on = form.provincias.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleProv(p)}
                      className={`rounded border px-2 py-1.5 text-xs transition ${
                        on ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
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
        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-border bg-card px-5 py-4">
          <div>
            {initial && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button>
            <button onClick={save} disabled={busy} className="rounded-md bg-gold px-6 py-2 text-sm font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-60">{busy ? "A guardar…" : "Guardar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>{children}</div>;
}

type AdminUserRow = {
  id: string;
  nome: string | null;
  email: string | null;
  tipo: "admin" | "revendedor" | "cliente";
  created_at: string;
  last_login: string | null;
  total: number;
};

const PAGE_SIZE = 20;

function Utilizadores() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setPage(0); }, [filter]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("admin_list_users", {
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
        p_filter: filter,
        p_active_days: 30,
      });
      if (!active) return;
      if (error) {
        const fallback = await loadUsersFallback(page, filter);
        if (!active) return;
        if (fallback.error) toast.error(error.message);
        setRows(fallback.rows);
        setTotal(fallback.total);
      } else {
        const list = (data ?? []) as AdminUserRow[];
        setRows(list);
        setTotal(list[0]?.total ?? 0);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [page, filter]);

  const filtered = search.trim()
    ? rows.filter((r) => {
        const q = search.toLowerCase();
        return (r.nome ?? "").toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q);
      })
    : rows;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-md border border-border bg-card p-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-widest transition ${
                filter === f ? "bg-gold text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Activos (30d)" : "Inactivos"}
            </button>
          ))}
        </div>
        <div className="relative ml-auto flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar nesta página…"
            className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-3 text-sm outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        <div className="hidden grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-3 border-b border-border bg-background/40 px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground md:grid">
          <span>Nome</span><span>Email</span><span>Tipo</span><span>Criado</span><span>Último acesso</span>
        </div>
        {loading && <p className="px-4 py-8 text-center text-sm text-muted-foreground">A carregar…</p>}
        {!loading && filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sem utilizadores nesta vista.</p>
        )}
        {!loading && filtered.map((u) => (
          <div key={u.id} className="grid grid-cols-1 gap-1 border-b border-border/60 px-4 py-3 text-sm last:border-0 md:grid-cols-[2fr_2fr_1fr_1fr_1fr] md:items-center md:gap-3">
            <span className="font-medium">{u.nome ?? "—"}</span>
            <span className="truncate text-muted-foreground">{u.email ?? "—"}</span>
            <span>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                u.tipo === "admin" ? "bg-destructive/15 text-destructive"
                : u.tipo === "revendedor" ? "bg-gold/15 text-gold"
                : "bg-secondary text-muted-foreground"}`}>
                {u.tipo}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-MZ")}</span>
            <span className="text-xs text-muted-foreground">
              {u.last_login ? new Date(u.last_login).toLocaleString("pt-MZ") : <span className="italic">Nunca</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Total: {total} • Página {page + 1} de {totalPages}</span>
        <div className="flex gap-2">
          <button
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </button>
          <button
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 disabled:opacity-40"
          >
            Próxima <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

async function loadUsersFallback(page: number, filter: "all" | "active" | "inactive") {
  let query = supabase
    .from("profiles")
    .select("id,nome,email,is_admin,created_at,last_login", { count: "exact" })
    .order("last_login", { ascending: false, nullsFirst: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  const limitDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  if (filter === "active") query = query.gte("last_login", limitDate);
  if (filter === "inactive") query = query.or(`last_login.is.null,last_login.lt.${limitDate}`);
  const [{ data: profiles, count, error }, { data: nhoguistas }] = await Promise.all([
    query,
    supabase.from("nhoguistas").select("user_id,status").eq("status", "aprovado"),
  ]);
  const revendedores = new Set((nhoguistas ?? []).map((row) => row.user_id));
  return {
    error: error?.message,
    total: count ?? 0,
    rows: ((profiles ?? []) as Array<Record<string, unknown>>).map((profile) => ({
      id: String(profile.id),
      nome: (profile.nome as string | null) ?? null,
      email: (profile.email as string | null) ?? null,
      tipo: profile.is_admin ? "admin" : revendedores.has(String(profile.id)) ? "revendedor" : "cliente",
      created_at: String(profile.created_at ?? new Date().toISOString()),
      last_login: (profile.last_login as string | null) ?? null,
      total: count ?? 0,
    })) as AdminUserRow[],
  };
}

function Nhogs() {
  const [items, setItems] = useState<(Nhoguista & { profiles?: { nome: string | null } })[]>([]);
  const [semStockOpen, setSemStockOpen] = useState(true);
  const [comStockOpen, setComStockOpen] = useState(true);
  const [settingMissing, setSettingMissing] = useState(false);
  const load = async () => {
    const { data, error } = await supabase.from("nhoguistas").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setItems([]);
      return;
    }
    const rows = (data ?? []) as Nhoguista[];
    const userIds = [...new Set(rows.map((n) => n.user_id).filter(Boolean))];
    const names = new Map<string, string | null>();
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id,nome").in("id", userIds);
      (profiles ?? []).forEach((profile) => names.set(profile.id, profile.nome ?? null));
    }
    setItems(rows.map((n) => ({ ...n, profiles: { nome: names.get(n.user_id) ?? null } })));
  };
  useEffect(() => {
    load();
    getBooleanSetting(NHOGUISTA_SEM_STOCK_SETTING, true).then((result) => {
      setSemStockOpen(result.value);
      setSettingMissing(result.missingTable);
    });
    getBooleanSetting(NHOGUISTA_COM_STOCK_SETTING, true).then((result) => {
      setComStockOpen(result.value);
    });
  }, []);
  const set = async (id: string, status: string) => {
    // Se rejeitar/cancelar — exigir nova aprovação na próxima troca de modo
    const payload: Record<string, unknown> = { status };
    if (status !== "aprovado") {
      payload.troca_aprovada = false;
      payload.tipo_pendente = null;
    }
    let { error } = await supabase.from("nhoguistas").update(payload).eq("id", id);
    if (error && /troca_aprovada|tipo_pendente/i.test(error.message)) {
      const retry = await supabase.from("nhoguistas").update({ status }).eq("id", id);
      error = retry.error;
    }
    if (error) return toast.error(error.message);
    toast.success(`Nhoguista ${status}`); load();
  };
  const approveSwitch = async (n: Nhoguista) => {
    if (!n.tipo_pendente) return;
    const { error } = await supabase.from("nhoguistas")
      .update({ tipo: n.tipo_pendente, tipo_pendente: null, troca_aprovada: true })
      .eq("id", n.id);
    if (error) return toast.error(error.message);
    toast.success("Troca de modo aprovada"); load();
  };
  const rejectSwitch = async (n: Nhoguista) => {
    const { error } = await supabase.from("nhoguistas")
      .update({ tipo_pendente: null })
      .eq("id", n.id);
    if (error) return toast.error(error.message);
    toast.success("Pedido de troca rejeitado"); load();
  };
  const toggleSetting = async (key: string, current: boolean, setter: (v: boolean) => void, label: string) => {
    const next = !current;
    const { error } = await setBooleanSetting(key, next);
    if (error) return toast.error(error);
    setter(next);
    toast.success(`${label} ${next ? "activadas" : "desactivadas"}`);
  };
  return (
    <div className="space-y-2">
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-4">
          <div>
            <p className="text-sm font-medium">Candidaturas — sem stock</p>
            <p className="text-xs text-muted-foreground">Controla se novos revendedores sem stock podem candidatar-se.</p>
            {settingMissing && <p className="mt-1 text-[11px] text-gold">Instale a tabela app_settings pelo SQL indicado.</p>}
          </div>
          <button
            onClick={() => toggleSetting(NHOGUISTA_SEM_STOCK_SETTING, semStockOpen, setSemStockOpen, "Candidaturas sem stock")}
            className={`rounded-md border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition ${semStockOpen ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10" : "border-destructive/40 text-destructive hover:bg-destructive/10"}`}
          >
            {semStockOpen ? "Desactivar" : "Activar"}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-4">
          <div>
            <p className="text-sm font-medium">Candidaturas — com stock</p>
            <p className="text-xs text-muted-foreground">Controla se novos revendedores com stock podem candidatar-se.</p>
          </div>
          <button
            onClick={() => toggleSetting(NHOGUISTA_COM_STOCK_SETTING, comStockOpen, setComStockOpen, "Candidaturas com stock")}
            className={`rounded-md border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition ${comStockOpen ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10" : "border-destructive/40 text-destructive hover:bg-destructive/10"}`}
          >
            {comStockOpen ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>
      {items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Sem candidaturas.</p>}
      {items.map((n) => (
        <div key={n.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card p-3 text-sm">
          <div className="flex-1 min-w-[200px]">
            <p className="font-medium">{n.profiles?.nome ?? n.codigo}</p>
            <p className="text-xs text-muted-foreground">
              {n.codigo} • {n.provincia} • {n.telefone}
              {n.tipo && <> • modo: <span className="text-gold uppercase">{n.tipo}</span></>}
            </p>
            {n.tipo_pendente && (
              <p className="mt-1 text-[11px] text-gold">
                Pedido de troca para <span className="uppercase">{n.tipo_pendente}</span>
              </p>
            )}
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-widest ${n.status === "aprovado" ? "bg-emerald-500/10 text-emerald-400" : n.status === "rejeitado" ? "bg-destructive/10 text-destructive" : "bg-gold/10 text-gold"}`}>{n.status}</span>
          {n.tipo_pendente && (
            <>
              <button onClick={() => approveSwitch(n)} className="rounded border border-emerald-500/40 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10">Aprovar troca</button>
              <button onClick={() => rejectSwitch(n)} className="rounded border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Rejeitar troca</button>
            </>
          )}
          {n.status !== "aprovado" && <button onClick={() => set(n.id, "aprovado")} className="rounded border border-emerald-500/40 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10">Aprovar</button>}
          {n.status !== "rejeitado" && <button onClick={() => set(n.id, "rejeitado")} className="rounded border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Rejeitar</button>}
        </div>
      ))}
    </div>
  );
}

function Pedidos() {
  const [items, setItems] = useState<Pedido[]>([]);
  const [details, setDetails] = useState<Pedido | null>(null);
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
              <p className="text-xs text-muted-foreground">
                {p.localizacao} •{" "}
                {p.telefone ? (
                  <a href={whatsappPedidoLink(p.nome_cliente, p.id, p.telefone)} target="_blank" rel="noreferrer" className="text-gold hover:underline">{p.telefone}</a>
                ) : "—"} • {new Date(p.created_at).toLocaleString("pt-MZ")}
              </p>
            </div>
            <span className="text-gold">{formatMZN(p.total)}</span>
          </div>
          <p className="mt-2 text-xs">{normalizePedidoItems(p.items).map((i) => `${i.nome} x${i.qty}`).join(", ") || "Itens não detalhados"}</p>
          {p.nhoguista_codigo && <p className="mt-1 text-xs text-gold">Ref: {p.nhoguista_codigo}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-xs">
              <option value="pendente">Pendente</option>
              <option value="processando">Processando</option>
              <option value="concluido">Concluído</option>
              <option value="a_caminho">A caminho</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
            {p.telefone && (
              <a href={whatsappPedidoLink(p.nome_cliente, p.id, p.telefone)} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1 rounded border border-emerald-500/40 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10">
                <MessageCircle className="h-3 w-3" /> Abrir WhatsApp
              </a>
            )}
            <button onClick={() => setDetails(p)} className="inline-flex items-center gap-1 rounded border border-border px-3 py-1 text-xs hover:border-gold hover:text-gold">
              <Eye className="h-3 w-3" /> Ver detalhes
            </button>
          </div>
        </div>
      ))}
      {details && <PedidoDetailsModal pedido={details} onClose={() => setDetails(null)} />}
    </div>
  );
}

function PedidoDetailsModal({ pedido, onClose }: { pedido: Pedido; onClose: () => void }) {
  const items = normalizePedidoItems(pedido.items);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 md:items-center md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border/60 bg-card md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-xl">Pedido #{pedido.id.slice(0, 8).toUpperCase()}</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-5 text-sm">
          <div><span className="text-muted-foreground">Cliente:</span> {pedido.nome_cliente}</div>
          <div><span className="text-muted-foreground">Telefone:</span> {pedido.telefone ?? "—"}</div>
          <div><span className="text-muted-foreground">Localização:</span> {pedido.localizacao}</div>
          <div><span className="text-muted-foreground">Status:</span> <span className="text-gold uppercase">{pedido.status}</span></div>
          {pedido.nhoguista_codigo && <div><span className="text-muted-foreground">Ref nhoguista:</span> {pedido.nhoguista_codigo}</div>}
          <div className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Itens</p>
            <ul className="space-y-1 text-xs">
              {items.map((i, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{i.nome} × {i.qty}{i.por_encomenda ? " ⚠️" : ""}</span>
                  {typeof i.preco === "number" && <span className="text-gold">{formatMZN(i.preco * i.qty)}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-muted-foreground">Total</span>
            <span className="text-lg font-display text-gold">{formatMZN(pedido.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Requisicoes() {
  const [items, setItems] = useState<Requisicao[]>([]);
  const [missing, setMissing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pendente" | "aprovada" | "entregue" | "cancelada">("all");
  const [details, setDetails] = useState<Requisicao | null>(null);
  const load = async () => {
    const { data, error } = await supabase.from("requisicoes").select("*").order("created_at", { ascending: false });
    if (error) {
      if (error.code === "42P01" || /relation .* does not exist/i.test(error.message)) {
        setMissing(true); setItems([]); return;
      }
      toast.error(error.message); return;
    }
    setMissing(false);
    setItems((data ?? []) as Requisicao[]);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("req-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "requisicoes" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("requisicoes").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Estado atualizado"); load();
  };

  if (missing) {
    return (
      <div className="rounded-lg border border-gold/40 bg-gold/5 p-6 text-sm">
        <p className="font-semibold text-gold">Sistema de requisições não instalado</p>
        <p className="mt-2 text-muted-foreground">Execute o script SQL <code className="text-gold">revendedor_stock_system.sql</code> no SQL Editor do Lovable Cloud para activar.</p>
      </div>
    );
  }

  const filtered = filter === "all" ? items : items.filter((r) => r.status === filter);
  return (
    <div className="space-y-2">
      <div className="mb-3 flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
        {(["all", "pendente", "aprovada", "entregue", "cancelada"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-widest transition ${filter === f ? "bg-gold text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {f === "all" ? "Todas" : f}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Sem requisições.</p>}
      {filtered.map((r) => (
        <div key={r.id} className="rounded-lg border border-border/60 bg-card p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-gold">{r.codigo}</p>
              <p className="text-xs">{r.nome_revendedor ?? "—"} <span className="text-muted-foreground">({r.nhoguista_codigo})</span></p>
              <p className="text-xs text-muted-foreground">
                {r.telefone ? (
                  <a href={whatsappLink(`Olá, sobre a sua requisição ${r.codigo}…`, r.telefone)} target="_blank" rel="noreferrer" className="text-gold hover:underline">{r.telefone}</a>
                ) : "—"} • {new Date(r.created_at).toLocaleString("pt-MZ")}
              </p>
            </div>
            <span className="text-gold">{formatMZN(r.total_estimado ?? 0)}</span>
          </div>
          <p className="mt-2 text-xs">{normalizeRequisicaoItems(r.items).map((i) => `${i.nome} x${i.qty}`).join(", ")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-xs">
              <option value="pendente">Pendente</option>
              <option value="aprovada">Aprovada</option>
              <option value="entregue">Entregue</option>
              <option value="cancelada">Cancelada</option>
            </select>
            {r.telefone && (
              <a href={whatsappLink(`Olá ${r.nome_revendedor ?? ""}, sobre a requisição ${r.codigo}…`, r.telefone)} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1 rounded border border-emerald-500/40 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10">
                <MessageCircle className="h-3 w-3" /> WhatsApp
              </a>
            )}
            <button onClick={() => setDetails(r)} className="inline-flex items-center gap-1 rounded border border-border px-3 py-1 text-xs hover:border-gold hover:text-gold">
              <Eye className="h-3 w-3" /> Ver detalhes
            </button>
          </div>
        </div>
      ))}
      {details && <RequisicaoDetailsModal req={details} onClose={() => setDetails(null)} />}
    </div>
  );
}

function RequisicaoDetailsModal({ req, onClose }: { req: Requisicao; onClose: () => void }) {
  const items = normalizeRequisicaoItems(req.items);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 md:items-center md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border/60 bg-card md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-xl">{req.codigo}</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-5 text-sm">
          <div><span className="text-muted-foreground">Revendedor:</span> {req.nome_revendedor ?? "—"}</div>
          <div><span className="text-muted-foreground">Código:</span> {req.nhoguista_codigo ?? "—"}</div>
          <div><span className="text-muted-foreground">Telefone:</span> {req.telefone ?? "—"}</div>
          <div><span className="text-muted-foreground">Status:</span> <span className="text-gold uppercase">{req.status}</span></div>
          <div className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Itens</p>
            <ul className="space-y-1 text-xs">
              {items.map((i, idx) => (
                <li key={idx} className="flex flex-col gap-0.5 border-b border-border/40 pb-1 last:border-0">
                  <div className="flex justify-between">
                    <span>{i.nome} × {i.qty}</span>
                    {i.preco_revendedor ? <span className="text-gold">{formatMZN(i.preco_revendedor * i.qty)}</span> : null}
                  </div>
                  {i.observacao && <span className="text-[10px] text-muted-foreground">obs: {i.observacao}</span>}
                </li>
              ))}
            </ul>
          </div>
          {req.observacao && (
            <div><span className="text-muted-foreground">Observação:</span> {req.observacao}</div>
          )}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-muted-foreground">Total estimado</span>
            <span className="text-lg font-display text-gold">{formatMZN(req.total_estimado ?? 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Banners() {
  const [items, setItems] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const load = () =>
    supabase
      .from("banners")
      .select("*")
      .order("ordem", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error("Banners: " + error.message);
        setItems((data ?? []) as Banner[]);
      });
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("Eliminar este banner?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Banner eliminado"); load();
  };
  const toggle = async (b: Banner) => {
    const { error } = await supabase.from("banners").update({ ativo: !b.ativo }).eq("id", b.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} banners</p>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold">
          <Plus className="h-4 w-4" /> Novo banner
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Sem banners. Crie o primeiro.</p>}
        {items.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
            {b.imagem_url
              ? <img src={b.imagem_url} alt="" className="h-16 w-28 rounded object-cover" />
              : <div className="h-16 w-28 rounded bg-background" />}
            <div className="flex-1 min-w-0 text-sm">
              <p className="truncate font-medium">{b.titulo ?? "Sem título"}</p>
              <p className="truncate text-xs text-muted-foreground">{b.subtitulo ?? ""}</p>
              <p className="text-[10px] uppercase tracking-widest text-gold">ordem {b.ordem} • {b.ativo ? "activo" : "inactivo"}</p>
            </div>
            <button onClick={() => toggle(b)} className={`rounded px-2 py-1 text-[10px] uppercase tracking-widest ${b.ativo ? "border border-emerald-500/40 text-emerald-400" : "border border-border text-muted-foreground"}`}>
              {b.ativo ? "Desactivar" : "Activar"}
            </button>
            <button onClick={() => { setEditing(b); setOpen(true); }} className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-gold"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => del(b.id)} className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {open && <BannerModal initial={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function BannerModal({ initial, onClose, onSaved }: { initial: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(() => initial ? {
    imagem_url: initial.imagem_url ?? "",
    titulo: initial.titulo ?? "",
    subtitulo: initial.subtitulo ?? "",
    link: initial.link ?? "",
    ordem: String(initial.ordem ?? 0),
    ativo: initial.ativo,
  } : { imagem_url: "", titulo: "", subtitulo: "", link: "", ordem: "0", ativo: true });
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    const path = `banners/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("produtos").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("produtos").getPublicUrl(path);
    setForm((f) => ({ ...f, imagem_url: data.publicUrl }));
    toast.success("Imagem enviada");
  };

  const save = async () => {
    if (!form.imagem_url) return toast.error("Imagem é obrigatória");
    setBusy(true);
    const payload = {
      imagem_url: form.imagem_url,
      titulo: form.titulo || null,
      subtitulo: form.subtitulo || null,
      link: form.link || null,
      ordem: Number(form.ordem) || 0,
      ativo: form.ativo,
    };
    const op = initial
      ? supabase.from("banners").update(payload).eq("id", initial.id)
      : supabase.from("banners").insert(payload);
    const { error } = await op;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Banner atualizado" : "Banner criado");
    onSaved();
  };

  const F = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 md:items-center md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl overflow-y-auto rounded-t-2xl border border-border/60 bg-card md:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h3 className="font-display text-xl">{initial ? "Editar banner" : "Novo banner"}</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-5">
          <Field label="Título"><input className={inp} value={form.titulo} onChange={(e) => F("titulo", e.target.value)} /></Field>
          <Field label="Subtítulo"><input className={inp} value={form.subtitulo} onChange={(e) => F("subtitulo", e.target.value)} /></Field>
          <Field label="Link (opcional)"><input className={inp} placeholder="/catalogo ou https://..." value={form.link} onChange={(e) => F("link", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ordem"><input type="number" className={inp} value={form.ordem} onChange={(e) => F("ordem", e.target.value)} /></Field>
            <Field label="Activo">
              <label className="flex items-center gap-2 py-2 text-sm">
                <input type="checkbox" checked={form.ativo} onChange={(e) => F("ativo", e.target.checked)} />
                <span className="text-muted-foreground">Visível no site</span>
              </label>
            </Field>
          </div>
          <Field label="Imagem">
            <input className={inp} placeholder="https://..." value={form.imagem_url} onChange={(e) => F("imagem_url", e.target.value)} />
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-gold hover:text-gold">
              <Upload className="h-4 w-4" /> Carregar imagem
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {form.imagem_url && <img src={form.imagem_url} alt="" className="mt-3 h-32 w-full rounded-lg object-cover" />}
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