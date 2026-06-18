import { WHATSAPP_NUMBER } from "./supabase";
import { formatMZN } from "./format";
import type { CartItem } from "./types";

export interface CheckoutInfo {
  nome: string;
  localizacao: string;
  telefone?: string;
  ref?: string | null;
  pagamento?: string;
  desconto?: number;
  total?: number;
}

export function buildWhatsAppMessage(items: CartItem[], info: CheckoutInfo): string {
  const linhas = items.map(
    (i) =>
      `• ${i.produto.nome} (x${i.qty}) — ${formatMZN(i.produto.preco * i.qty)}${
        i.por_encomenda ? "  ⚠️ POR ENCOMENDA" : ""
      }`,
  );
  const encomendas = items.filter((i) => i.por_encomenda);
  const subtotal = items.reduce((s, i) => s + i.produto.preco * i.qty, 0);
  const total = info.total ?? subtotal;
  const partes = [
    `Olá AURA SCENTRA, quero fazer um pedido:`,
    ``,
    ...linhas,
    ``,
    `Subtotal: ${formatMZN(subtotal)}`,
  ];
  if (info.desconto && info.desconto > 0) partes.push(`Desconto: -${formatMZN(info.desconto)}`);
  partes.push(`Total: ${formatMZN(total)}`, ``);
  partes.push(`Nome: ${info.nome}`);
  partes.push(`Localização: ${info.localizacao}`);
  if (info.telefone) partes.push(`Telefone: ${info.telefone}`);
  if (info.pagamento) partes.push(`Pagamento: ${info.pagamento}`);
  if (info.ref) partes.push(`Ref. Nhoguista: ${info.ref}`);
  if (encomendas.length > 0) {
    partes.push(
      ``,
      `⚠️ ITENS POR ENCOMENDA (sem stock imediato):`,
      ...encomendas.map((i) => `  - ${i.produto.nome} x${i.qty}`),
    );
  }
  return partes.join("\n");
}

export function whatsappLink(message: string, phone: string = WHATSAPP_NUMBER): string {
  const num = phone.replace(/\D/g, "");
  const full = num.startsWith("258") ? num : `258${num}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

export interface RequisicaoInfo {
  codigo: string;
  nomeRevendedor: string;
  telefone?: string | null;
  status: string;
  observacao?: string | null;
}

export interface RequisicaoLinha {
  nome: string;
  qty: number;
  preco_revendedor?: number | null;
  observacao?: string | null;
}

export function buildRequisicaoMessage(items: RequisicaoLinha[], info: RequisicaoInfo): string {
  const linhas = items.map((i) => {
    const sub = i.preco_revendedor ? ` — ${formatMZN(i.preco_revendedor * i.qty)}` : "";
    const obs = i.observacao ? `\n    obs: ${i.observacao}` : "";
    return `• ${i.nome} (x${i.qty})${sub}${obs}`;
  });
  const total = items.reduce((s, i) => s + (Number(i.preco_revendedor ?? 0) * i.qty), 0);
  const partes = [
    `📦 NOVA REQUISIÇÃO ${info.codigo}`,
    ``,
    `Revendedor: ${info.nomeRevendedor}`,
    info.telefone ? `Telefone: ${info.telefone}` : "",
    `Status: ${info.status.toUpperCase()}`,
    ``,
    `Produtos:`,
    ...linhas,
    ``,
    total > 0 ? `Total estimado: ${formatMZN(total)}` : "",
    info.observacao ? `\nObservação: ${info.observacao}` : "",
  ].filter(Boolean);
  return partes.join("\n");
}

export function whatsappPedidoLink(nomeCliente: string, pedidoId: string, phone: string): string {
  const msg = `Olá ${nomeCliente}, falo da AURA SCENTRA sobre o seu pedido #${pedidoId.slice(0, 8).toUpperCase()}.`;
  return whatsappLink(msg, phone);
}