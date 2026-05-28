import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/formas-pagamento")({
  component: () => (
    <PolicyPage title="Formas de Pagamento">
      <p>Aceitamos as seguintes formas de pagamento em Moçambique:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>M-Pesa</strong> — desconto de 8% aplicado automaticamente.</li>
        <li><strong>e-Mola</strong> — desconto de 8% aplicado automaticamente.</li>
        <li><strong>Visa</strong> — cartão de crédito ou débito.</li>
        <li><strong>WhatsApp</strong> — combinar diretamente com o atendimento.</li>
      </ul>
      <p className="rounded-md border border-gold/30 bg-gold/5 p-3 text-xs text-gold">
        Nota: nesta fase, os botões de pagamento servem apenas para indicar a
        forma escolhida. A confirmação do pagamento é feita via WhatsApp.
      </p>
    </PolicyPage>
  ),
  head: () => ({ meta: [{ title: "Formas de Pagamento — AURA SCENTRA" }] }),
});