import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Nhoguista } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeftRight, Clock } from "lucide-react";

export function ModeSwitchButton({ n, onChanged }: { n: Nhoguista; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const current = n.tipo === "com_stock" ? "com_stock" : "sem_stock";
  const target: "sem_stock" | "com_stock" = current === "com_stock" ? "sem_stock" : "com_stock";
  const targetLabel = target === "com_stock" ? "Com stock" : "Sem stock";

  if (n.tipo_pendente) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-gold/40 bg-gold/5 px-3 py-2 text-xs text-gold">
        <Clock className="h-3.5 w-3.5" /> Pedido de troca para <span className="uppercase">{n.tipo_pendente}</span> aguarda admin
      </div>
    );
  }

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    const free = !!n.troca_aprovada;
    if (free) {
      const { error } = await supabase.from("nhoguistas").update({ tipo: target }).eq("id", n.id);
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success(`Modo alterado para ${targetLabel}`);
      onChanged();
      return;
    }
    // Primeira troca — exige aprovação do admin
    let { error } = await supabase.from("nhoguistas")
      .update({ tipo_pendente: target })
      .eq("id", n.id);
    if (error && /tipo_pendente|column/i.test(error.message)) {
      setBusy(false);
      return toast.error("Execute o SQL nhoguista_mode_switch.sql para activar a troca de modo.");
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Pedido de troca enviado — aguarde aprovação do admin");
    onChanged();
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-md border border-gold/40 bg-background/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gold transition hover:bg-gold/10 disabled:opacity-50"
    >
      <ArrowLeftRight className="h-3.5 w-3.5" />
      {busy ? "A processar…" : `Trocar para ${targetLabel}`}
    </button>
  );
}