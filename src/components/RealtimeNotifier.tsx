import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { Pedido, Requisicao } from "@/lib/types";

export function RealtimeNotifier() {
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (profile?.is_admin) {
      const ch = supabase.channel("admin-realtime")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos" }, (payload) => {
          const p = payload.new as Pedido;
          toast.success(`🛒 Novo pedido — ${p.nome_cliente}`, {
            description: `ID: ${p.id.slice(0, 8).toUpperCase()}`,
            duration: 10000,
            action: { label: "Ver pedido", onClick: () => router.navigate({ to: "/admin" }) },
          });
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "requisicoes" }, (payload) => {
          const r = payload.new as Requisicao;
          toast.success(`📦 Nova requisição ${r.codigo}`, {
            description: `Revendedor: ${r.nome_revendedor ?? "—"}`,
            duration: 10000,
            action: { label: "Ver", onClick: () => router.navigate({ to: "/admin" }) },
          });
        })
        .subscribe();
      channels.push(ch);
    }

    const my = supabase.channel("my-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos", filter: `user_id=eq.${user.id}` }, (payload) => {
        const p = payload.new as Pedido;
        toast(`Pedido actualizado — ${p.status}`, {
          description: `ID: ${p.id.slice(0, 8).toUpperCase()}`,
          duration: 8000,
          action: { label: "Ver", onClick: () => router.navigate({ to: "/conta" }) },
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "requisicoes", filter: `user_id=eq.${user.id}` }, (payload) => {
        const r = payload.new as Requisicao;
        toast(`Requisição ${r.codigo} — ${r.status}`, {
          duration: 8000,
          action: { label: "Ver", onClick: () => router.navigate({ to: "/nhoguista" }) },
        });
      })
      .subscribe();
    channels.push(my);

    return () => { channels.forEach((c) => supabase.removeChannel(c)); };
  }, [user, profile?.is_admin, router]);

  return null;
}