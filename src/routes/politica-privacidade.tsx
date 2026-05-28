import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/politica-privacidade")({
  component: () => (
    <PolicyPage title="Política de Privacidade">
      <p>
        A AURA SCENTRA respeita a privacidade dos seus clientes. Os dados
        pessoais (nome, telefone, localização) são utilizados exclusivamente
        para processar pedidos e melhorar o serviço.
      </p>
      <p>
        <strong>Os seus dados não são vendidos nem partilhados com terceiros</strong>
        , salvo quando estritamente necessário para a entrega da encomenda.
      </p>
      <p>
        Pode, a qualquer momento, solicitar a remoção dos seus dados entrando
        em contacto connosco pela página de contactos.
      </p>
    </PolicyPage>
  ),
  head: () => ({ meta: [{ title: "Política de Privacidade — AURA SCENTRA" }] }),
});