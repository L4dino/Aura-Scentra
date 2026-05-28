import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/trocas-devolucoes")({
  component: () => (
    <PolicyPage title="Trocas e Devoluções">
      <p>
        Na AURA SCENTRA prezamos pela sua satisfação. O cliente pode solicitar
        a troca ou devolução de um produto no prazo de até <strong>7 dias</strong>
        após a entrega, desde que o item esteja em perfeitas condições, na
        embalagem original e sem indícios de uso.
      </p>
      <p>
        Para iniciar o processo, contacte-nos pelo WhatsApp ou pela página de
        contactos com o número do pedido e o motivo. A nossa equipa irá
        orientá-lo nos passos seguintes.
      </p>
      <p className="text-xs text-muted-foreground">
        Esta política poderá ser actualizada. Versão preliminar.
      </p>
    </PolicyPage>
  ),
  head: () => ({ meta: [{ title: "Trocas e Devoluções — AURA SCENTRA" }] }),
});