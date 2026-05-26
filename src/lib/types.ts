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
  telefone: string | null;
  avatar_url: string | null;
  is_admin: boolean;
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
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco: number;
  localizacao: string | null;
  produtos?: { nome: string } | null;
}

export interface Pedido {
  id: string;
  user_id?: string | null;
  nome_cliente: string;
  telefone: string | null;
  total: number;
  status: "pendente" | "confirmado" | "entregue" | "cancelado";
  nhoguista_codigo: string | null;
  created_at: string;
  pedido_itens?: PedidoItem[];
  /** @deprecated pedidos antigos com localizacao na tabela pedidos */
  localizacao?: string | null;
  /** @deprecated pedidos antigos com items em JSON */
  items?: Array<{ id: string; nome: string; qty: number; preco: number }>;
}

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  created_at: string;
}