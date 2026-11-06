import { createFileRoute } from "@tanstack/react-router";
import { CalendarHeart, Globe2 } from "lucide-react";

import { MinakoTip, SectionCard, Segmented, TimeField, useFieldError } from "@/components/minako/fields";
import { NAV_ITEMS } from "@/components/minako/modules";
import { PageHeader } from "@/components/minako/page-header";
import { TIMEZONES, WEEK_DAYS } from "@/lib/minako/config";
import { useDashboard } from "@/lib/minako/store";

export const Route = createFileRoute("/semana")({
  head: () => ({
    meta: [
      { title: "Semana e ciclo — Minako Aino" },
      { name: "description", content: "Escolha o dia e o horário em que a Minako vira a semana dos rankings e da Estrela da Semana." },
      { property: "og:title", content: "Semana e ciclo — Minako Aino" },
      { property: "og:description", content: "Defina quando começa a nova semana do seu servidor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeekPage,
});

function WeekPage() {
  const { draft, update } = useDashboard();
  const w = draft.week;
  const timeError = useFieldError("semana", "startTime");
  const nav = NAV_ITEMS.find((n) => n.id === "semana")!;

  return (
    <div className="space-y-5">
      <PageHeader item={nav} subtitle="Quando começa uma nova semana para rankings, quadros e a Estrela da Semana." />

      <SectionCard title="Dia da virada" description="O dia em que o ciclo semanal recomeça." icon={CalendarHeart}>
        <Segmented
          options={WEEK_DAYS.map((d, i) => ({ value: i, label: d.replace("-feira", "") }))}
          value={w.startDay}
          onChange={(v) => update("week", { startDay: v })}
        />
      </SectionCard>

      <SectionCard title="Horário e fuso" icon={Globe2} tone="bg-sky text-sky-foreground" delay={80}>
        <div className="grid gap-5 sm:grid-cols-2">
          <TimeField
            label="Horário da virada"
            value={w.startTime}
            onChange={(v) => update("week", { startTime: v })}
            hint="Formato 24 horas."
            error={timeError}
          />
          <Segmented
            label="Fuso horário"
            options={TIMEZONES.slice(0, 4).map((t) => ({ value: t.value, label: t.label }))}
            value={w.timezone}
            onChange={(v) => update("week", { timezone: v })}
          />
        </div>
        <MinakoTip>
          A nova semana começa <strong>{(WEEK_DAYS[w.startDay] ?? "").toLowerCase()}</strong> às{" "}
          <strong>{w.startTime}</strong>. Nesse momento eu fecho o ranking e anuncio a nova Estrela! ⭐
        </MinakoTip>
      </SectionCard>
    </div>
  );
}
