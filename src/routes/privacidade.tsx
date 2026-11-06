import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { LegalPage } from "@/components/minako/legal-page";
import raw from "@/content/politica-de-privacidade.txt?raw";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Minako Aino" },
      { name: "description", content: "Saiba como a Minako Aino trata e protege os dados das pessoas nos servidores Discord." },
      { property: "og:title", content: "Política de Privacidade — Minako Aino" },
      { property: "og:description", content: "Como a Minako Aino cuida dos seus dados, com transparência." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      raw={raw}
      icon={ShieldCheck}
      tone="bg-mint text-mint-foreground"
      kicker="Documento oficial"
      other={{ to: "/termos", label: "Termos de Uso" }}
    />
  );
}
