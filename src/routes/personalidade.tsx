import { createFileRoute } from "@tanstack/react-router";
import { MessageCircleHeart } from "lucide-react";
import { useRef } from "react";

import { burstFrom } from "@/components/minako/effects";
import { SectionCard } from "@/components/minako/fields";
import { NAV_ITEMS } from "@/components/minako/modules";
import { PageHeader } from "@/components/minako/page-header";
import { playSound } from "@/components/minako/use-sound";
import { Switch } from "@/components/ui/switch";
import type { MinakoConfig } from "@/lib/minako/config";
import { useDashboard } from "@/lib/minako/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/personalidade")({
  head: () => ({
    meta: [
      { title: "Personalidade sazonal — Minako Aino" },
      { name: "description", content: "Ative os pacotes de falas temáticas da Minako para Halloween, Natal e Ano Novo." },
      { property: "og:title", content: "Personalidade sazonal — Minako Aino" },
      { property: "og:description", content: "Falas especiais para as datas mais divertidas do ano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SeasonalPage,
});

const PACKAGES: {
  id: keyof MinakoConfig["seasonal"];
  name: string;
  emoji: string;
  when: string;
  sample: string;
  tone: string;
}[] = [
  {
    id: "halloween",
    name: "Halloween",
    emoji: "🎃",
    when: "Fim de outubro",
    sample: "30 minutos para o Modo Noturno. Hora de guardar a capa de vampiro e fingir que amanhã você vai dormir cedo. 🦇",
    tone: "bg-secondary",
  },
  {
    id: "natal",
    name: "Natal",
    emoji: "🎄",
    when: "Dezembro",
    sample: "Os canais vão descansar para o Papai Noel passar sem tropeçar em ninguém. Boa noite e muitos biscoitinhos! 🍪",
    tone: "bg-mint",
  },
  {
    id: "ano_novo",
    name: "Ano Novo",
    emoji: "🎆",
    when: "Virada do ano",
    sample: "Contagem regressiva para a Lua pedir silêncio! Que o novo ciclo venha cheio de brilho. ✨",
    tone: "bg-sky",
  },
];

function SeasonalPage() {
  const { draft, update } = useDashboard();
  const nav = NAV_ITEMS.find((n) => n.id === "personalidade")!;
  return (
    <div className="space-y-5">
      <PageHeader item={nav} subtitle="Pacotes de falas temáticas que a Minako usa nas datas especiais." />
      <div className="grid gap-4 md:grid-cols-3">
        {PACKAGES.map((p, i) => (
          <PackageCard
            key={p.id}
            pkg={p}
            index={i}
            on={draft.seasonal[p.id]}
            onChange={(v) => update("seasonal", { [p.id]: v })}
          />
        ))}
      </div>
      <SectionCard
        title="Como funciona"
        icon={MessageCircleHeart}
        tone="bg-accent text-accent-foreground"
        delay={240}
      >
        <p className="text-sm text-muted-foreground">
          Fora das datas, a Minako usa as falas normais dela. Quando um pacote está ligado e a data chega, ela
          mistura as falas temáticas aos avisos do Modo Noturno e às mensagens da semana — sem repetir a mesma
          frase duas vezes seguidas.
        </p>
      </SectionCard>
    </div>
  );
}

function PackageCard({
  pkg,
  on,
  onChange,
  index,
}: {
  pkg: (typeof PACKAGES)[number];
  on: boolean;
  onChange: (v: boolean) => void;
  index: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <article
      className={cn("squish-card flex animate-rise flex-col p-5 transition-all duration-300", !on && "saturate-50")}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid h-16 w-16 place-items-center rounded-3xl text-4xl", pkg.tone, on && "animate-bob")}>
          {pkg.emoji}
        </span>
        <Switch
          ref={ref}
          checked={on}
          aria-label={`Pacote ${pkg.name}`}
          onCheckedChange={(v) => {
            playSound(v ? "sparkle" : "off");
            if (v) burstFrom(ref.current, 12);
            onChange(v);
          }}
        />
      </div>
      <h2 className="mt-4 text-xl font-bold">{pkg.name}</h2>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{pkg.when}</p>
      <blockquote className="mt-4 flex-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm italic text-muted-foreground">
        “{pkg.sample}”
      </blockquote>
    </article>
  );
}
