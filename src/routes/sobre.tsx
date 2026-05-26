import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/sobre")({ component: () => (
  <div className="mx-auto max-w-3xl px-4 py-20">
    <h1 className="font-display text-5xl text-gold">Sobre a AURA SCENTRA</h1>
    <p className="mt-6 leading-relaxed text-muted-foreground">
      Somos uma loja premium de perfumes em Moçambique. Selecionamos fragrâncias originais
      das melhores marcas para oferecer momentos inesquecíveis a cada cliente. Acreditamos que
      um perfume é mais que um aroma — é a sua assinatura.
    </p>
  </div>
)});