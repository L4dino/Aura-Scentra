export type Categoria = "masculino" | "feminino" | "unissex";
export type Tag = "novo" | "promocao" | "mais_vendido" | "queima_stock" | null;

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  marca: string | null;
  preco: number;
  imagem_url: string | null;
  categoria: Categoria | null;
  avaliacao: number | null;
  num_avaliacoes: number | null;
  tag: Tag;
  destaque: boolean;
  comissao_valor: number;
  stock: number;
  provincias: string[] | string | null;
  created_at: string;
  preco_revendedor?: number | null;
  preco_venda_sugerido?: number | null;
  qty_minima_revenda?: number | null;
  disponivel_com_stock?: boolean | null;
  disponivel_sem_stock?: boolean | null;
}

export interface Banner {
  id: string;
  imagem_url: string;
  titulo: string | null;
  subtitulo: string | null;
  link: string | null;
  ordem: number;
  ativo: boolean;
}

export interface Profile {
  id: string;
  nome: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  provincia?: string | null;
  bairro?: string | null;
  distrito?: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at?: string;
  last_login?: string | null;
}

export interface Nhoguista {
  id: string;
  user_id: string;
  codigo: string;
  telefone: string | null;
  provincia: string | null;
  status: "pendente" | "aprovado" | "rejeitado";
  created_at: string;
  tipo?: "sem_stock" | "com_stock" | null;
  troca_aprovada?: boolean | null;
  tipo_pendente?: "sem_stock" | "com_stock" | null;
}

export interface CartItem {
  produto: Produto;
  qty: number;
  por_encomenda?: boolean;
}

export interface PedidoItem {
  id?: string;
  nome: string;
  qty: number;
  preco?: number;
  por_encomenda?: boolean;
}

export type PedidoStatus = "pendente" | "processando" | "concluido" | "a_caminho" | "entregue" | "cancelado";

export interface Pedido {
  id: string;
  user_id: string | null;
  nome_cliente: string;
  telefone: string | null;
  localizacao: string | null;
  items: PedidoItem[] | string | null;
  total: number;
  status: PedidoStatus;
  nhoguista_codigo: string | null;
  created_at: string;
}

export function normalizePedidoItems(value: unknown): PedidoItem[] {
  const raw = typeof value === "string" ? safeJson(value) : value;
  if (!Array.isArray(raw)) return [];
  const normalized: PedidoItem[] = [];
  raw.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const row = item as Record<string, unknown>;
      const nome = typeof row.nome === "string" ? row.nome : "Produto";
      const qty = Number(row.qty ?? row.quantidade ?? 1) || 1;
      const preco = row.preco === undefined ? undefined : Number(row.preco) || 0;
      normalized.push({
        id: typeof row.id === "string" ? row.id : undefined,
        nome,
        qty,
        preco,
        por_encomenda: Boolean(row.por_encomenda),
      });
    });
  return normalized;
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  created_at: string;
}

export type RequisicaoStatus = "pendente" | "aprovada" | "entregue" | "cancelada";

export interface RequisicaoItem {
  produto_id: string;
  nome: string;
  qty: number;
  preco_revendedor?: number | null;
  preco_venda_sugerido?: number | null;
  observacao?: string | null;
}

export interface Requisicao {
  id: string;
  codigo: string;
  nhoguista_id?: string | null;
  nhoguista_codigo?: string | null;
  user_id?: string | null;
  nome_revendedor: string | null;
  telefone: string | null;
  items: RequisicaoItem[] | string | null;
  total_estimado: number;
  observacao: string | null;
  status: RequisicaoStatus;
  created_at: string;
}

export function normalizeRequisicaoItems(value: unknown): RequisicaoItem[] {
  const raw = typeof value === "string" ? safeJsonReq(value) : value;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
    .map((it) => ({
      produto_id: String(it.produto_id ?? ""),
      nome: typeof it.nome === "string" ? it.nome : "Produto",
      qty: Number(it.qty ?? 1) || 1,
      preco_revendedor: it.preco_revendedor === undefined ? null : Number(it.preco_revendedor) || 0,
      preco_venda_sugerido: it.preco_venda_sugerido === undefined ? null : Number(it.preco_venda_sugerido) || 0,
      observacao: typeof it.observacao === "string" ? it.observacao : null,
    }));
}

function safeJsonReq(value: string): unknown {
  try { return JSON.parse(value); } catch { return null; }
}