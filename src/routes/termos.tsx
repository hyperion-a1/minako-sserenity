import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";

import { LegalPage } from "@/components/minako/legal-page";
import raw from "@/content/termos-de-uso.txt?raw";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Minako Aino" },
      { name: "description", content: "Leia os Termos de Uso da Minako Aino, bot para comunidades no Discord." },
      { property: "og:title", content: "Termos de Uso — Minako Aino" },
      { property: "og:description", content: "As regras e combinados para usar a Minako Aino no Discord." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      raw={raw}
      icon={ScrollText}
      tone="bg-secondary text-secondary-foreground"
      kicker="Documento oficial"
      other={{ to: "/privacidade", label: "Política de Privacidade" }}
    />
  );
}
