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