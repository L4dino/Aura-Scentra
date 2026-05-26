import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Categoria, Produto, Nhoguista, Pedido, Tag } from "@/lib/types";
import { normalizeNhoguistaStatus, parseNhoguista } from "@/lib/nhoguista";
import { formatMZN } from "@/lib/format";
import { toast } from "sonner";
import { Pencil, Plus, RefreshCw, X } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: Admin });

const TAG_OPTIONS: { value: Tag; label: string }[] = [
  { value: null, label: "Nenhuma" },
  { value: "novo", label: "Novo" },
  { value: "promocao", label: "Promoção" },
  { value: "mais_vendido", label: "Mais vendido" },
  { value: "queima_stock", label: "Queima de stock" },
];

type ProdutoForm = {
  nome: string;
  marca: string;
  preco: string;
  categoria: Categoria;
  imagem_url: string;
  descricao: string;
  destaque: boolean;
  tag: Tag;
  avaliacao: string;
  comissao_valor: string;
  stock: string;
};

const emptyForm = (): ProdutoForm => ({
  nome: "",
  marca: "",
  preco: "",
  categoria: "masculino",
  imagem_url: "",
  descricao: "",
  destaque: false,
  tag: null,
  avaliacao: "",
  comissao_valor: "",
  stock: "0",
});

function produtoToForm(p: Produto): ProdutoForm {
  return {
    nome: p.nome,
    marca: p.marca ?? "",
    preco: String(p.preco),
    categoria: p.categoria ?? "masculino",
    imagem_url: p.imagem_url ?? "",
    descricao: p.descricao ?? "",
    destaque: p.destaque,
    tag: p.tag,
    avaliacao: p.avaliacao != null ? String(p.avaliacao) : "",
    comissao_valor: String(p.comissao_valor ?? 0),
    stock: String(p.stock ?? 0),
  };
}

function formToPayload(form: ProdutoForm) {
  return {
    nome: form.nome.trim(),
    marca: form.marca.trim() || null,
    preco: Number(form.preco),
    categoria: form.categoria,
    imagem_url: form.imagem_url.trim() || null,
    descricao: form.descricao.trim() || null,
    destaque: form.destaque,
    tag: form.tag,
    avaliacao: form.avaliacao ? Number(form.avaliacao) : null,
    comissao_valor: form.comissao_valor ? Number(form.comissao_valor) : 0,
    stock: form.stock ? Number(form.stock) : 0,
  };
}

function Admin() {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<"produtos" | "nhoguistas" | "pedidos">("produtos");
  if (loading) return <div className="p-20 text-center text-muted-foreground">A carregar…</div>;
  if (!profile?.is_admin) return <div className="p-20 text-center text-muted-foreground">Acesso restrito.</div>;

  const tabs = [
    { id: "produtos" as const, label: "Produtos" },
    { id: "nhoguistas" as const, label: "Candidaturas Nhoguista" },
    { id: "pedidos" as const, label: "Pedidos" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-4xl">Admin</h1>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm uppercase tracking-widest ${tab === t.id ? "border-b-2 border-gold text-gold" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "produtos" && <Produtos />}
        {tab === "nhoguistas" && <Nhogs />}
        {tab === "pedidos" && <Pedidos />}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded border border-border bg-background px-3 py-2 text-sm";

function ProdutoFormPanel({
  title,
  form,
  setForm,
  onSave,
  onCancel,
  saveLabel,
  formRef,
}: {
  title: string;
  form: ProdutoForm;
  setForm: React.Dispatch<React.SetStateAction<ProdutoForm>>;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
  formRef: React.RefObject<HTMLDivElement | null>;
}) {
  const upload = async (file: File) => {
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("produtos").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("produtos").getPublicUrl(path);
    setForm((f) => ({ ...f, imagem_url: data.publicUrl }));
    toast.success("Imagem enviada");
  };

  return (
    <div ref={formRef} className="scroll-mt-24 rounded-xl border border-gold/30 bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">{title}</h3>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome">
          <input className={inputCls} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </Field>
        <Field label="Marca">
          <input className={inputCls} value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
        </Field>
        <Field label="Preço (MZN)">
          <input className={inputCls} type="number" min="0" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
        </Field>
        <Field label="Stock">
          <input className={inputCls} type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </Field>
        <Field label="Categoria">
          <select className={inputCls} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="unissex">Unissex</option>
          </select>
        </Field>
        <Field label="Tag">
          <select className={inputCls} value={form.tag ?? ""} onChange={(e) => setForm({ ...form, tag: (e.target.value || null) as Tag })}>
            {TAG_OPTIONS.map((o) => (
              <option key={o.label} value={o.value ?? ""}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Avaliação (0–5)">
          <input className={inputCls} type="number" min="0" max="5" step="0.1" value={form.avaliacao} onChange={(e) => setForm({ ...form, avaliacao: e.target.value })} />
        </Field>
        <Field label="Comissão nhoguista (MZN)">
          <input className={inputCls} type="number" min="0" value={form.comissao_valor} onChange={(e) => setForm({ ...form, comissao_valor: e.target.value })} />
        </Field>
        <Field label="Destaque na homepage">
          <label className="flex items-center gap-2 pt-2">
            <input type="checkbox" checked={form.destaque} onChange={(e) => setForm({ ...form, destaque: e.target.checked })} className="rounded" />
            <span className="text-sm">Mostrar em destaque</span>
          </label>
        </Field>
      </div>
      <Field label="Descrição">
        <textarea className={inputCls} rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
      </Field>
      <Field label="URL da imagem">
        <input className={inputCls} placeholder="URL ou faça upload abaixo" value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} />
      </Field>
      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="w-full text-xs text-muted-foreground" />
      {form.imagem_url && <img src={form.imagem_url} alt="" className="h-24 w-24 rounded object-cover" />}
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} className="flex-1 rounded bg-gold py-2 text-sm font-semibold uppercase tracking-widest text-primary-foreground">
          {saveLabel}
        </button>
        <button onClick={onCancel} className="rounded border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Produtos() {
  const [items, setItems] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProdutoForm>(emptyForm);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showForm) {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [showForm, editingId]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("produtos").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Produto[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (p: Produto) => {
    setEditingId(p.id);
    setForm(produtoToForm(p));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const save = async () => {
    if (!form.nome.trim() || !form.preco) {
      toast.error("Nome e preço são obrigatórios");
      return;
    }
    const payload = formToPayload(form);
    if (editingId) {
      const { error } = await supabase.from("produtos").update(payload).eq("id", editingId);
      if (error) return toast.error(error.message);
      toast.success("Produto atualizado");
    } else {
      const { error } = await supabase.from("produtos").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Produto criado");
    }
    closeForm();
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Apagar este produto?")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto apagado");
    if (editingId === id) closeForm();
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{items.length} produto(s)</p>
        {!showForm && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded bg-gold px-4 py-2 text-sm font-semibold uppercase tracking-widest text-primary-foreground">
            <Plus className="h-4 w-4" /> Adicionar novo produto
          </button>
        )}
      </div>

      {showForm && (
        <ProdutoFormPanel
          formRef={formRef}
          title={editingId ? "Editar produto" : "Novo produto"}
          form={form}
          setForm={setForm}
          onSave={save}
          onCancel={closeForm}
          saveLabel={editingId ? "Guardar alterações" : "Criar produto"}
        />
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar produtos…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum produto. Clique em &quot;Adicionar novo produto&quot;.</p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3">
              {p.imagem_url && <img src={p.imagem_url} alt="" className="h-16 w-16 shrink-0 rounded object-cover" />}
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{p.nome}</p>
                <p className="text-xs text-muted-foreground">{p.marca} • {formatMZN(p.preco)} • Stock: {p.stock ?? 0}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {p.destaque && <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] uppercase text-gold">Destaque</span>}
                  {p.tag && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">{p.tag}</span>}
                  {p.avaliacao != null && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">★ {p.avaliacao}</span>
                  )}
                  {p.comissao_valor > 0 && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Comissão {formatMZN(p.comissao_valor)}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button onClick={() => del(p.id)} className="text-xs text-destructive hover:underline">Apagar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Nhogs() {
  const [items, setItems] = useState<(Nhoguista & { profiles?: { nome: string | null } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todos" | "pendente" | "aprovado" | "rejeitado">("pendente");

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from("nhoguistas").select("*, profiles(nome)").order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      toast.error(`Erro ao carregar candidaturas: ${err.message}`);
    }
    setItems(((data ?? []) as Nhoguista[]).map((row) => parseNhoguista(row)!));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: Nhoguista["status"]) => {
    const normalized = normalizeNhoguistaStatus(status);
    const { data, error } = await supabase
      .from("nhoguistas")
      .update({ status: normalized })
      .eq("id", id)
      .select("id, status")
      .maybeSingle();
    if (error) return toast.error(error.message);
    if (!data) return toast.error("Não foi possível actualizar. Verifique permissões (RLS) no Supabase.");
    toast.success(normalized === "aprovado" ? "Candidatura aprovada" : "Candidatura rejeitada");
    load();
  };

  const filtered = filter === "todos" ? items : items.filter((n) => n.status === filter);
  const pendentes = items.filter((n) => n.status === "pendente").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Candidaturas para o programa Nhoguista
          {pendentes > 0 && <span className="ml-2 text-gold">({pendentes} pendente{pendentes !== 1 ? "s" : ""})</span>}
        </p>
        <button onClick={load} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["pendente", "aprovado", "rejeitado", "todos"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded border px-3 py-1 text-xs uppercase tracking-widest ${filter === f ? "border-gold text-gold" : "border-border text-muted-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>
      {error && <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar candidaturas…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {filter === "pendente" ? "Nenhuma candidatura pendente." : `Nenhuma candidatura com estado «${filter}».`}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div key={n.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card p-4 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{n.profiles?.nome ?? "Utilizador"}</p>
                <p className="text-xs text-muted-foreground">Código: {n.codigo}</p>
                <p className="text-xs text-muted-foreground">{n.provincia ?? "—"} • {n.telefone ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-MZ")}</p>
              </div>
              <span className={`text-xs uppercase tracking-widest ${n.status === "pendente" ? "text-gold" : n.status === "aprovado" ? "text-green-600" : "text-destructive"}`}>
                {n.status}
              </span>
              {n.status === "pendente" && (
                <>
                  <button onClick={() => setStatus(n.id, "aprovado")} className="rounded border border-gold/40 px-3 py-1 text-xs text-gold hover:bg-gold/10">
                    Aprovar
                  </button>
                  <button onClick={() => setStatus(n.id, "rejeitado")} className="rounded border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10">
                    Rejeitar
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PEDIDO_STATUS: Pedido["status"][] = ["pendente", "confirmado", "entregue", "cancelado"];

function pedidoLocalizacao(p: Pedido) {
  return p.pedido_itens?.[0]?.localizacao ?? p.localizacao ?? "—";
}

function formatPedidoItens(p: Pedido) {
  if (p.pedido_itens?.length) {
    return p.pedido_itens
      .map((i) => `${i.produtos?.nome ?? "Produto"} ×${i.quantidade}`)
      .join(", ");
  }
  if (p.items?.length) {
    return p.items.map((i) => `${i.nome} ×${i.qty}`).join(", ");
  }
  return "—";
}

function Pedidos() {
  const [items, setItems] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("pedidos")
      .select("*, pedido_itens(id, quantidade, preco, localizacao, produto_id, produtos(nome))")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      toast.error(`Erro ao carregar pedidos: ${err.message}`);
    }
    setItems((data ?? []) as Pedido[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: Pedido["status"]) => {
    const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Estado atualizado");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Pedidos de compra enviados pelo carrinho ({items.length})</p>
        <button onClick={load} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>
      {error && <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar pedidos…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum pedido registado. Os pedidos aparecem aqui quando um cliente finaliza o carrinho.</p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="rounded-lg border border-border/60 bg-card p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{p.nome_cliente}</p>
                  <p className="text-xs text-muted-foreground">{pedidoLocalizacao(p)} • {p.telefone ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-MZ")}</p>
                </div>
                <span className="text-lg font-medium text-gold">{formatMZN(p.total)}</span>
              </div>
              <p className="mt-2 text-xs">{formatPedidoItens(p)}</p>
              {p.nhoguista_codigo && <p className="mt-1 text-xs text-gold">Ref. nhoguista: {p.nhoguista_codigo}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Estado:</span>
                <select
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                  value={p.status ?? "pendente"}
                  onChange={(e) => updateStatus(p.id, e.target.value as Pedido["status"])}
                >
                  {PEDIDO_STATUS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
