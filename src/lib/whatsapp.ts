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