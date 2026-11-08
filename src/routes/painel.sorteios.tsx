import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarClock, Gift, Megaphone, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import {
  ChannelPicker,
  DateTimeField,
  FieldShell,
  NumberField,
  RolePicker,
  SectionCard,
  Segmented,
  TextAreaField,
  TextField,
  ToggleRow,
  single,
  useFieldError,
} from "@/components/minako/fields";
import { GiveawayLive } from "@/components/minako/giveaway-live";
import { DiscordMessage } from "@/components/minako/discord-message";
import { GiveawayMessageEditor } from "@/components/minako/giveaway-message-editor";
import { GiveawayMessagePreview } from "@/components/minako/giveaway-message-preview";
import { NAV_ITEMS } from "@/components/minako/modules";
import { PageHeader } from "@/components/minako/page-header";
import { playSound } from "@/components/minako/use-sound";
import { GIVEAWAY_DURATIONS } from "@/lib/minako/config";
import { useDashboard } from "@/lib/minako/store";
import { onReveal, openSection, slugify } from "@/lib/minako/sections";
import { cn } from "@/lib/utils";

const PATH = "/painel/sorteios";
const STEPS = [
  { label: "Básico", emoji: "🎁", sections: ["O básico"] },
  { label: "Quando", emoji: "🗓️", sections: ["Quando e onde"] },
  { label: "Quem", emoji: "🛡️", sections: ["Quem pode participar"] },
  { label: "Anúncio", emoji: "📣", sections: ["Anúncio"] },
  { label: "Publicar", emoji: "🚀", sections: [] as string[] },
];
/** Em qual passo fica a seção (as do bot ficam no último). */
const stepOf = (slug: string) => {
  const i = STEPS.findIndex((st) => st.sections.some((t) => slugify(t) === slug));
  return i === -1 ? STEPS.length - 1 : i;
};

export const Route = createFileRoute("/painel/sorteios")({
  head: () => ({
    meta: [
      { title: "Sorteios — Minako Aino" },
      { name: "description", content: "Monte os sorteios da Minako: ganhadores, duração, regras de participação e o anúncio." },
      { property: "og:title", content: "Sorteios — Minako Aino" },
      { property: "og:description", content: "Regras claras, anúncio bonito e muito confete." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiveawaysPage,
});

const SWATCHES = ["#f6bd4b", "#f08a5d", "#e85d75", "#7fc8a9", "#6fa8dc", "#b48ead"];

function GiveawaysPage() {
  const { draft, update, guild } = useDashboard();
  const g = draft.giveaways;
  const nav = NAV_ITEMS.find((n) => n.id === "sorteios");
  const set = (patch: Partial<typeof g>) => update("giveaways", patch);
  const err = {
    name: useFieldError("sorteios", "name"),
    winners: useFieldError("sorteios", "winners"),
    min: useFieldError("sorteios", "minParticipants"),
    max: useFieldError("sorteios", "maxParticipants"),
    cd: useFieldError("sorteios", "cooldownAmount"),
    color: useFieldError("sorteios", "color"),
    blocks: useFieldError("sorteios", "messageBlocks"),
  };
  const channelName = guild.channels.find((c) => c.id === g.channel)?.name;
  const fmt = (v: string) => (v ? v.replace(/^(\d{4})-(\d{2})-(\d{2})T/, "$3/$2 ") : "");
  const durationLabel =
    g.duration === "custom"
      ? g.endDate
        ? `até ${fmt(g.endDate)}`
        : "fim personalizado"
      : GIVEAWAY_DURATIONS.find((d) => d.value === g.duration)?.label;

  const resolve = (text: string) => text.replace(/\{([a-z]+)\}/g, (whole, key: string) => {
    const values: Record<string, string> = { giveaway: g.name, winners: String(g.winners), participants: "0", min: String(g.minParticipants), max: g.maxParticipants ? String(g.maxParticipants) : "∞", channel: channelName ? `#${channelName}` : "#sorteios", host: "@organizador", endrelative: durationLabel || "em breve", start: g.start === "scheduled" ? fmt(g.scheduledAt) : "Ao publicar", end: g.duration === "custom" ? fmt(g.endDate) : durationLabel || "", users: "@ganhadores" };
    return values[key] ?? whole;
  });
  const [step, setStep] = useState(0);
  useEffect(() => onReveal((path, slug) => {
    if (path === PATH) setStep(stepOf(slug));
  }), []);
  useEffect(() => {
    const t = setTimeout(() => openSection(PATH, slugify("O básico")), 0);
    return () => clearTimeout(t);
  }, []);
  const go = (i: number) => {
    playSound("nav");
    setStep(i);
    const first = STEPS[i]!.sections[0];
    if (first) openSection(PATH, slugify(first));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const stepErr = [err.name || err.winners || err.min || err.max, "", err.cd, err.blocks || err.color, ""];
  if (!nav) return null;
  return (
    <div className="space-y-5">
      <PageHeader item={nav} subtitle="Prepare o sorteio do jeitinho que a comunidade merece." />

      <ToggleRow
        big
        emoji="🎁"
        label="Sorteios ligados"
        hint="Quando desligado, ninguém consegue criar sorteios novos."
        checked={g.enabled}
        onChange={(v) => set({ enabled: v })}
      />

      <div className={cn("space-y-5", !g.enabled && "pointer-events-none opacity-50")}>
        <nav aria-label="Passos do sorteio" className="sticky top-[4.4rem] z-20 -mx-1 rounded-3xl border-2 border-border bg-background/90 p-1.5 backdrop-blur lg:top-3">
          <ol className="grid grid-cols-5 gap-1">
            {STEPS.map((st, i) => (
              <li key={st.label}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={step === i ? "step" : undefined}
                  className={cn(
                    "relative flex min-h-12 w-full flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-bold transition-all active:translate-y-0.5",
                    step === i ? "bg-magic text-foreground shadow-squish-sm" : i < step ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className={cn("text-lg leading-none transition-transform", step === i && "scale-125")}>{i < step ? "✅" : st.emoji}</span>
                  <span className="mt-0.5 truncate">{st.label}</span>
                  {stepErr[i] && <span aria-label="tem erro" className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-destructive" />}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div hidden={step !== 0}>
        <SectionCard title="O básico" description="Nome, ganhadores e participantes." icon={Gift} tone={nav.tone}>
          <TextField label="Nome do sorteio" value={g.name} onChange={(v) => set({ name: v })} maxLength={80} error={err.name} />
          <div className="grid gap-5 sm:grid-cols-3">
            <NumberField label="Ganhadores" value={g.winners} min={1} max={50} onChange={(v) => set({ winners: v })} error={err.winners} />
            <NumberField label="Mínimo" value={g.minParticipants} min={0} max={10000} onChange={(v) => set({ minParticipants: v })} suffix="pessoas" error={err.min} />
            <NumberField label="Máximo" value={g.maxParticipants} min={0} max={10000} step={10} onChange={(v) => set({ maxParticipants: v })} suffix="pessoas" hint="0 = sem limite" error={err.max} />
          </div>
        </SectionCard>
        </div>

        <div hidden={step !== 1}>
        <SectionCard title="Quando e onde" icon={CalendarClock} tone="bg-sky text-sky-foreground" delay={60}>
          <Segmented
            label="Começa"
            options={[
              { value: "immediate", label: "Assim que publicar" },
              { value: "scheduled", label: "Agendado" },
            ]}
            value={g.start}
            onChange={(v) => set({ start: v })}
          />
          {g.start === "scheduled" && (
            <DateTimeField
              label="Data e hora de início"
              value={g.scheduledAt}
              onChange={(v) => set({ scheduledAt: v })}
              hint="Horário de Brasília."
            />
          )}
          <Segmented label="Duração" options={GIVEAWAY_DURATIONS} value={g.duration} onChange={(v) => set({ duration: v })} />
          {g.duration === "custom" && (
            <DateTimeField
              label="Data e hora de encerramento"
              value={g.endDate}
              onChange={(v) => set({ endDate: v })}
              hint="Horário de Brasília. Precisa ser pelo menos 1 minuto depois do início."
            />
          )}
          <ChannelPicker
            label="Canal do sorteio"
            multiple={false}
            value={single.toList(g.channel)}
            onChange={(l) => set({ channel: single.fromList(l) })}
            placeholder="Escolher canal"
          />
          <ToggleRow emoji="📌" label="Fixar o anúncio no canal" checked={g.pin} onChange={(v) => set({ pin: v })} />
          <ToggleRow
            emoji="💌"
            label="Tópico privado para os ganhadores"
            hint="Um cantinho para combinar a entrega do prêmio."
            checked={g.privateThread}
            onChange={(v) => set({ privateThread: v })}
          />
        </SectionCard>
        </div>

        <div hidden={step !== 2}>
        <SectionCard title="Quem pode participar" icon={ShieldCheck} tone="bg-mint text-mint-foreground" delay={120}>
          <RolePicker label="Cargos permitidos" value={g.allowedRoles} onChange={(l) => set({ allowedRoles: l })} hint="Vazio = todo mundo pode." />
          <RolePicker label="Cargos bloqueados" value={g.blockedRoles} onChange={(l) => set({ blockedRoles: l })} hint="Bloqueio vence permissão." />
          <Segmented
            label="Essas regras valem para"
            options={[
              { value: "local", label: "Só este sorteio" },
              { value: "global", label: "Todos os sorteios" },
            ]}
            value={g.rulesScope}
            onChange={(v) => set({ rulesScope: v })}
          />
          <Segmented
            label="Quem ganhou pode participar de novo?"
            options={[
              { value: "none", label: "Pode sim" },
              { value: "giveaways", label: "Depois de X sorteios" },
              { value: "days", label: "Depois de X dias" },
            ]}
            value={g.cooldownType}
            onChange={(v) => set({ cooldownType: v })}
          />
          {g.cooldownType !== "none" && (
            <NumberField
              label={g.cooldownType === "days" ? "Quantos dias" : "Quantos sorteios"}
              value={g.cooldownAmount}
              min={1}
              max={365}
              onChange={(v) => set({ cooldownAmount: v })}
              error={err.cd}
            />
          )}
        </SectionCard>
        </div>

        <div hidden={step !== 3}>
        <SectionCard title="Anúncio" description="Como o sorteio aparece no Discord." icon={Megaphone} tone="bg-primary text-primary-foreground" delay={180}>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              {g.messageBlocks.length === 0 && <TextAreaField label="Mensagem" value={g.message} onChange={(v) => set({ message: v })} rows={5} maxLength={1500} />}
              <GiveawayMessageEditor blocks={g.messageBlocks} message={g.message} onChange={(messageBlocks) => set({ messageBlocks })} />
              {err.blocks && <p role="alert" className="text-sm font-semibold text-destructive">{err.blocks}</p>}
              <FieldShell label="Cor de destaque" error={err.color}>
                <div className="flex flex-wrap items-center gap-2">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Cor ${c}`}
                      onClick={() => {
                        playSound("pop");
                        set({ color: c });
                      }}
                      className={cn(
                        "h-9 w-9 rounded-full border-4 transition-transform hover:scale-110",
                        g.color.toLowerCase() === c ? "scale-110 border-foreground" : "border-card",
                      )}
                      style={{ background: c }}
                    />
                  ))}
                  <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-border-strong">
                    <span className="sr-only">Escolher outra cor</span>
                    <input
                      type="color"
                      value={/^#[0-9a-f]{6}$/i.test(g.color) ? g.color : "#f6bd4b"}
                      onChange={(e) => set({ color: e.target.value })}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <span className="grid h-full place-items-center text-sm">🎨</span>
                  </label>
                </div>
              </FieldShell>
            </div>

            {/* Prévia */}
            <div>
              <p className="mb-2 font-display text-sm font-semibold">Prévia</p>
              <div className="rounded-2xl bg-night p-4 text-night-foreground">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-lg">🧡</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-bold">Minako Aino</span>
                      <span className="ml-1.5 rounded bg-sky px-1 text-[10px] font-bold text-sky-foreground">APP</span>
                      <span className="ml-2 text-xs opacity-60">hoje</span>
                    </p>
                    <div className="mt-2 rounded-lg border-l-4 bg-night-soft/60 p-3" style={{ borderColor: g.color }}>
                      <p className="font-display font-semibold">{g.name || "Sorteio sem nome"}</p>
                      <div className="mt-2">{g.messageBlocks.length ? <GiveawayMessagePreview blocks={g.messageBlocks} resolve={resolve} /> : <DiscordMessage text={resolve(g.message)} />}</div>
                      <p className="mt-3 text-xs opacity-70">
                        🏆 {g.winners} ganhador(es) · ⏳ {durationLabel}
                        {channelName ? ` · #${channelName}` : ""}
                      </p>
                    </div>
                    <span
                      className="mt-2 inline-block rounded-md px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                      style={{ background: g.color }}
                    >
                      🎉 Participar
                    </span>
                    <span className="ml-1 mt-2 inline-block rounded-md bg-night-soft px-3 py-1.5 text-sm">Sair</span>
                    <span className="ml-1 mt-2 inline-block rounded-md bg-night-soft px-3 py-1.5 text-sm">Participantes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
        </div>

        <div hidden={step !== 4} className="space-y-5">
          <GiveawayLive />
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card font-display font-semibold shadow-squish-sm active:translate-y-0.5">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button type="button" onClick={() => go(step + 1)} className="inline-flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary font-display font-semibold text-primary-foreground shadow-squish-primary active:translate-y-1">
              Próximo: {STEPS[step + 1]!.label} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
