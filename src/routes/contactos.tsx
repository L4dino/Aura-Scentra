import { createFileRoute } from "@tanstack/react-router";
import { WHATSAPP_NUMBER } from "@/lib/supabase";
export const Route = createFileRoute("/contactos")({ component: () => (
  <div className="mx-auto max-w-3xl px-4 py-20">
    <h1 className="font-display text-5xl text-gold">Contactos</h1>
    <div className="mt-8 space-y-3 text-sm text-muted-foreground">
      <p>WhatsApp: <a className="text-gold" href={`https://wa.me/${WHATSAPP_NUMBER}`}>+{WHATSAPP_NUMBER}</a></p>
      <p>Entrega em todo Moçambique</p>
    </div>
  </div>
)});