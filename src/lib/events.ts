import { supabase } from "./supabase";

export type EventType =
  | "view_produto"
  | "click_produto"
  | "click_compra"
  | "click_whatsapp"
  | "click_finalizar"
  | "click_carrinho"
  | "share_link";

export function track(tipo: EventType, produto_id?: string | null, nhoguista_codigo?: string | null) {
  // Fire-and-forget. Failures are silent (table may not exist yet).
  try {
    void supabase
      .from("eventos")
      .insert({ tipo, produto_id: produto_id ?? null, nhoguista_codigo: nhoguista_codigo ?? null })
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    /* noop */
  }
}