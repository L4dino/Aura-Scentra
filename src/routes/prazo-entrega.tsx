import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/prazo-entrega")({
  component: () => (
    <PolicyPage title="Prazo de Entrega">
      <p>
        O prazo de entrega depende da localização do cliente dentro de
        Moçambique e será combinado após a confirmação da compra.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Cidade de Maputo e Matola:</strong> normalmente no mesmo dia ou no dia seguinte.</li>
        <li><strong>Outras províncias:</strong> 2 a 5 dias úteis, conforme a transportadora.</li>
      </ul>
      <p>
        Após o seu pedido, entraremos em contacto pelo WhatsApp para confirmar
        o endereço, a forma de envio e o prazo exacto.
      </p>
    </PolicyPage>
  ),
  head: () => ({ meta: [{ title: "Prazo de Entrega — AURA SCENTRA" }] }),
});