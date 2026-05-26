import { supabase } from "./supabase";
import type { Nhoguista } from "./types";

export const NHOGUISTA_STATUS_LABEL: Record<Nhoguista["status"], string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export function normalizeNhoguistaStatus(status: unknown): Nhoguista["status"] {
  const s = String(status ?? "pendente").toLowerCase().trim();
  if (s === "aprovado" || s === "aprovada" || s === "approved") return "aprovado";
  if (s === "rejeitado" || s === "rejeitada" || s === "rejected") return "rejeitado";
  return "pendente";
}

export function parseNhoguista(row: Nhoguista | null): Nhoguista | null {
  if (!row) return null;
  return { ...row, status: normalizeNhoguistaStatus(row.status) };
}

/** Só códigos de nhoguistas com candidatura aprovada podem ser usados na loja */
export async function isCodigoNhoguistaAprovado(codigo: string): Promise<boolean> {
  const trimmed = codigo.trim();
  if (!trimmed) return false;
  const { data, error } = await supabase
    .from("nhoguistas")
    .select("status")
    .eq("codigo", trimmed)
    .maybeSingle();
  if (error || !data) return false;
  return normalizeNhoguistaStatus(data.status) === "aprovado";
}
