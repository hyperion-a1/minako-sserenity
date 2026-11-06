import { createFileRoute } from "@tanstack/react-router";
import { BellRing, FolderTree, Link2 } from "lucide-react";
import { useRef } from "react";

import sleeping from "@/assets/minako-sleeping.webp";
import { burstFrom } from "@/components/minako/effects";
import {
  ChannelPicker,
  MinakoTip,
  SectionCard,
  TextField,
  TimeField,
  useFieldError,
} from "@/components/minako/fields";
import { NAV_ITEMS } from "@/components/minako/modules";
import { PageHeader } from "@/components/minako/page-header";
import { playSound } from "@/components/minako/use-sound";
import { Switch } from "@/components/ui/switch";
import { channelsByCategory } from "@/lib/minako/config";
import { useDashboard } from "@/lib/minako/store";
import { resolveNightScope } from "@/lib/minako/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/noturno")({
  head: () => ({
    meta: [
      { title: "Modo Noturno — Minako Aino" },
      { name: "description", content: "Defina o horário em que a Minako coloca canais para descansar e quais canais ficam imunes." },
      { property: "og:title", content: "Modo Noturno — Minako Aino" },
      { property: "og:description", content: "Hora de dormir: horários, avisos e canais que descansam à noite." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NightPage,
});

function NightPage() {
  const { draft, update, guild } = useDashboard();
  const n = draft.night;
  const nav = NAV_ITEMS.find((x) => x.id === "noturno")!;
  const switchRef = useRef<HTMLButtonElement>(null);
  const startErr = useFieldError("noturno", "start");
  const endErr = useFieldError("noturno", "end");
  const urlErr = useFieldError("noturno", "noticeUrl");

  const resolved = resolveNightScope(n, channelsByCategory(guild));
  const overlap = n.immune.filter((id) => n.affected.includes(id));
  const nameOf = (id: string) => guild.channels.find((c) => c.id === id)?.name ?? "?";

  return (
    <div className="space-y-5">
      <PageHeader item={nav} subtitle="Na hora de dormir, a Minako fecha alguns canais com carinho e avisa todo mundo." />

      <section className="relative overflow-hidden rounded-[2rem] border-2 border-night-soft bg-night-sky p-6 text-night-foreground shadow-[0_5px_0_0_var(--night-soft)] sm:p-8">
        {["8%:18%", "22%:70%", "48%:12%", "64%:82%", "86%:28%", "92%:66%"].map((p, i) => {
          const [l, t] = p.split(":");
          return (
            <span
              key={p}
              aria-hidden
              className="absolute h-1.5 w-1.5 animate-twinkle rounded-full bg-night-foreground"
              style={{ left: l, top: t, animationDelay: `${i * 0.4}s` }}
            />
          );
        })}
        <div className="relative grid items-center gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="font-display text-sm font-semibold opacity-80">
              {n.enabled ? "Shhh… o Modo Noturno está ligado" : "O Modo Noturno está desligado"}
            </p>
            <p className="mt-1 font-display text-5xl font-bold tabular-nums">
              {n.start} <span className="opacity-60">→</span> {n.end}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Switch
                ref={switchRef}
                checked={n.enabled}
                aria-label="Ligar Modo Noturno"
                onCheckedChange={(v) => {
                  playSound(v ? "sparkle" : "off");
                  if (v) burstFrom(switchRef.current, 12);
                  update("night", { enabled: v });
                }}
              />
              <span className="font-display font-semibold">{n.enabled ? "Ligado" : "Desligado"}</span>
            </div>
          </div>
          <img
            src={sleeping}
            alt="Minako dormindo abraçada a uma estrelinha sobre a lua"
            width={640}
            height={640}
            loading="lazy"
            className={cn("mx-auto w-40 sm:w-52", n.enabled ? "animate-bob" : "opacity-70 grayscale-[40%]")}
          />
        </div>
      </section>

      <SectionCard title="Horários" description="Funciona mesmo quando atravessa a meia-noite." icon={nav.icon} tone={nav.tone}>
        <div className="grid gap-5 sm:grid-cols-2">
          <TimeField label="Começa às" value={n.start} onChange={(v) => update("night", { start: v })} error={startErr} />
          <TimeField label="Termina às" value={n.end} onChange={(v) => update("night", { end: v })} error={endErr} />
        </div>
      </SectionCard>

      <SectionCard
        title="Quais canais descansam"
        description="Escolha categorias inteiras ou canais avulsos. Canais imunes ficam sempre abertos."
        icon={FolderTree}
        tone="bg-sky text-sky-foreground"
        delay={60}
      >
        <ChannelPicker
          label="Categorias afetadas"
          kinds={["category"]}
          value={n.categories}
          onChange={(l) => update("night", { categories: l })}
          placeholder="Escolher categorias"
        />
        <ChannelPicker
          label="Canais afetados"
          value={n.affected}
          onChange={(l) => update("night", { affected: l })}
        />
        <ChannelPicker
          label="Canais imunes"
          value={n.immune}
          onChange={(l) => update("night", { immune: l })}
          hint="A imunidade sempre vence."
        />
        {overlap.length > 0 && (
          <MinakoTip>
            <strong>{overlap.map(nameOf).join(", ")}</strong> está como afetado e imune ao mesmo tempo. Fica
            valendo a imunidade, tá? 😉
          </MinakoTip>
        )}
        <div className="rounded-2xl bg-night px-4 py-3 text-sm text-night-foreground">
          <strong className="font-display text-base">{resolved.length} canal(is)</strong> vão descansar
          {resolved.length > 0 && <>: {resolved.slice(0, 6).map(nameOf).join(", ")}{resolved.length > 6 ? "…" : ""}</>}
        </div>
      </SectionCard>

      <SectionCard
        title="Avisos"
        description="Onde a Minako avisa que vai fechar e reabrir os canais."
        icon={BellRing}
        tone="bg-accent text-accent-foreground"
        delay={120}
      >
        <ChannelPicker
          label="Canais de comunicado"
          value={n.notices}
          onChange={(l) => update("night", { notices: l })}
        />
        <TextField
          label="Link da mensagem com os detalhes"
          value={n.noticeUrl}
          onChange={(v) => update("night", { noticeUrl: v })}
          placeholder="https://discord.com/channels/…/…/…"
          hint="Opcional. Um link de mensagem do Discord explicando o Modo Noturno."
          error={urlErr}
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" /> A Minako avisa 30 minutinhos antes de começar.
        </div>
      </SectionCard>
    </div>
  );
}
