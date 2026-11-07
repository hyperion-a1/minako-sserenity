import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, ShieldHalf } from "lucide-react";

import { ChannelPicker, MinakoTip, SectionCard, single } from "@/components/minako/fields";
import { NAV_ITEMS } from "@/components/minako/modules";
import { PageHeader } from "@/components/minako/page-header";
import { useDashboard } from "@/lib/minako/store";

export const Route = createFileRoute("/painel/canais")({
  head: () => ({
    meta: [
      { title: "Canais gerais — Minako Aino" },
      { name: "description", content: "Escolha os canais de moderação e de publicação usados pela Minako Aino." },
      { property: "og:title", content: "Canais gerais — Minako Aino" },
      { property: "og:description", content: "Onde a Minako conversa com a equipe e com a comunidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChannelsPage,
});

function ChannelsPage() {
  const { draft, update } = useDashboard();
  const nav = NAV_ITEMS.find((n) => n.id === "canais")!;
  return (
    <div className="space-y-5">
      <PageHeader item={nav} subtitle="Onde a Minako conversa com a equipe e onde ela publica as novidades." />

      <SectionCard
        title="Moderação"
        description="Avisos internos, revisões e pedidos que precisam de alguém da equipe."
        icon={ShieldHalf}
        tone="bg-sky text-sky-foreground"
      >
        <ChannelPicker
          label="Canal de moderação"
          multiple={false}
          value={single.toList(draft.channels.moderation)}
          onChange={(l) => update("channels", { moderation: single.fromList(l) })}
          placeholder="Escolher canal"
        />
      </SectionCard>

      <SectionCard
        title="Publicação"
        description="Rankings, destaques da semana e anúncios para todo mundo ver."
        icon={Megaphone}
        tone="bg-primary text-primary-foreground"
        delay={80}
      >
        <ChannelPicker
          label="Canal de publicação"
          multiple={false}
          value={single.toList(draft.channels.publication)}
          onChange={(l) => update("channels", { publication: single.fromList(l) })}
          placeholder="Escolher canal"
        />
        <MinakoTip>Dica: um canal de anúncios deixa as novidades mais fáceis de encontrar! 📣</MinakoTip>
      </SectionCard>
    </div>
  );
}
