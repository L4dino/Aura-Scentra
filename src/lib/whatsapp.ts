import { WHATSAPP_NUMBER } from "./supabase";
import { formatMZN } from "./format";
import type { CartItem } from "./types";

export interface CheckoutInfo {
  nome: string;
  localizacao: string;
  telefone?: string;
  ref?: string | null;
}

export function buildWhatsAppMessage(items: CartItem[], info: CheckoutInfo): string {
  const linhas = items.map(
    (i) => `• ${i.produto.nome} (x${i.qty}) — ${formatMZN(i.produto.preco * i.qty)}`,
  );
  const total = items.reduce((s, i) => s + i.produto.preco * i.qty, 0);
  const partes = [
    `Olá AURA SCENTRA, quero fazer um pedido:`,
    ``,
    ...linhas,
    ``,
    `Total: ${formatMZN(total)}`,
    ``,
    `Nome: ${info.nome}`,
    `Localização: ${info.localizacao}`,
  ];
  if (info.telefone) partes.push(`Telefone: ${info.telefone}`);
  if (info.ref) partes.push(`Ref: ${info.ref}`);
  return partes.join("\n");
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}