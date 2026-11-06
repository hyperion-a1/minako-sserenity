import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ScrollText, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";

import mascot from "@/assets/minako-mascot.webp";
import { burstFrom } from "@/components/minako/effects";
import { MINAKO_PHRASES, NAV_ITEMS, type NavItem } from "@/components/minako/modules";
import { playSound } from "@/components/minako/use-sound";
import { Switch } from "@/components/ui/switch";
import { WEEK_DAYS } from "@/lib/minako/config";
import { useDashboard } from "@/lib/minako/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minako Aino — Painel de configurações" },
      {
        name: "description",
        content: "Ligue, desligue e ajuste os recursos da Minako Aino no seu servidor: Modo Noturno, sorteios, matchmaking, TikTok e muito mais.",
      },
      { property: "og:title", content: "Minako Aino — Painel de configurações" },
      {
        property: "og:description",
        content: "Um painel fofo e aconchegante para cuidar da Minako no seu servidor Discord.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

const item = (id: NavItem["id"]) => NAV_ITEMS.find((n) => n.id === id)!;

function Overview() {
  const { draft, update, guild } = useDashboard();
  const [phrase, setPhrase] = useState(0);
  const [wiggle, setWiggle] = useState(false);
  const mascotRef = useRef<HTMLButtonElement>(null);

  const seasonalOn = Object.values(draft.seasonal).some(Boolean);
  const features: {
    nav: NavItem;
    emoji: string;
    on: boolean;
    status: string;
    toggle: (v: boolean) => void;
  }[] = [
    {
      nav: item("noturno"),
      emoji: "🌙",
      on: draft.night.enabled,
      status: draft.night.enabled ? `${draft.night.start} → ${draft.night.end}` : "Canais sempre abertos",
      toggle: (v) => update("night", { enabled: v }),
    },
    {
      nav: item("matchmaking"),
      emoji: "🎮",
      on: draft.matchmaking.enabled,
      status: `${draft.matchmaking.modes.length} modo(s) · grupos de ${draft.matchmaking.groupCapacity}`,
      toggle: (v) => update("matchmaking", { enabled: v }),
    },
    {
      nav: item("sorteios"),
      emoji: "🎁",
      on: draft.giveaways.enabled,
      status: `${draft.giveaways.winners} ganhador(es) · ${draft.giveaways.name || "sem nome"}`,
      toggle: (v) => update("giveaways", { enabled: v }),
    },
    {
      nav: item("tiktok"),
      emoji: "🎬",
      on: draft.tiktok.enabled,
      status: draft.tiktok.enabled ? `Verifica a cada ${draft.tiktok.pollMinutes} min` : "Sem avisos de vídeos",
      toggle: (v) => update("tiktok", { enabled: v }),
    },
    {
      nav: item("personalidade"),
      emoji: "✨",
      on: seasonalOn,
      status: `${Object.values(draft.seasonal).filter(Boolean).length} de 3 pacotes ativos`,
      toggle: (v) => update("seasonal", { halloween: v, natal: v, ano_novo: v }),
    },
  ];
  const activeCount = features.filter((f) => f.on).length;

  const tools: { nav: NavItem; status: string }[] = [
    { nav: item("semana"), status: `${WEEK_DAYS[draft.week.startDay]}, às ${draft.week.startTime}` },
    {
      nav: item("canais"),
      status:
        [draft.channels.moderation, draft.channels.publication].filter(Boolean).length + " de 2 canais definidos",
    },
    {
      nav: item("cargos"),
      status: draft.roles.star ? "Estrela da Semana definida" : "Estrela da Semana sem cargo",
    },
  ];

  const pokeMinako = () => {
    playSound("giggle");
    burstFrom(mascotRef.current, 14);
    setPhrase((p) => (p + 1) % MINAKO_PHRASES.length);
    setWiggle(true);
    setTimeout(() => setWiggle(false), 650);
  };

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      <section className="relative overflow-hidden rounded-[2rem] border-2 border-primary-deep bg-sunrise p-6 shadow-[var(--shadow-squish-primary)] sm:p-8">
        <div className="dotted-paper absolute inset-0 opacity-40" aria-hidden />
        <div className="relative grid items-center gap-4 sm:grid-cols-[1fr_auto]">
          <div className="order-2 sm:order-1">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
              {guild.emoji} {guild.name}
            </p>
            <h1 className="mt-1 text-4xl font-bold leading-[1.05] text-primary-foreground sm:text-5xl">
              Oiê! Vamos deixar o servidor quentinho?
            </h1>
            <div
              key={phrase}
              className="relative mt-5 max-w-md animate-pop-in rounded-3xl border-2 border-primary-deep/40 bg-card px-5 py-4 text-sm font-semibold text-card-foreground shadow-squish-sm"
            >
              <span
                aria-hidden
                className="absolute -top-2 right-10 hidden h-4 w-4 rotate-45 border-l-2 border-t-2 border-primary-deep/40 bg-card sm:-right-2 sm:top-6 sm:block sm:rotate-[135deg]"
              />
              {MINAKO_PHRASES[phrase]}
            </div>
          </div>
          <button
            ref={mascotRef}
            type="button"
            onClick={pokeMinako}
            aria-label="Cutucar a Minako"
            className="order-1 mx-auto w-40 sm:order-2 sm:w-56"
          >
            <img
              src={mascot}
              alt="Minako Aino acenando com um coração"
              width={640}
              height={640}
              className={cn(
                "w-full drop-shadow-[0_12px_18px_oklch(0.5_0.12_50/0.35)]",
                wiggle ? "animate-wiggle" : "animate-bob",
              )}
            />
          </button>
        </div>
      </section>

      {/* Resumo rápido */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Recursos ligados", value: `${activeCount}/${features.length}`, emoji: "💡" },
          { label: "Virada da semana", value: (WEEK_DAYS[draft.week.startDay] ?? "").split("-")[0] ?? "", emoji: "📅" },
          { label: "Membros", value: guild.members.toLocaleString("pt-BR"), emoji: "🫶" },
        ].map((s, i) => (
          <div
            key={s.label}
            className="squish-card animate-rise px-3 py-4 text-center sm:px-5"
            style={{ animationDelay: `${80 + i * 70}ms` }}
          >
            <div className="text-2xl">{s.emoji}</div>
            <div className="mt-1 font-display text-xl font-bold sm:text-2xl">{s.value}</div>
            <div className="text-xs font-semibold text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Recursos */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">Recursos</h2>
            <p className="text-sm text-muted-foreground">Ligue e desligue com um toque. Depois é só salvar!</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          {features.map((f, i) => {
            const Icon = f.nav.icon;
            return (
              <article
                key={f.nav.id}
                className={cn(
                  "squish-card group flex min-w-0 animate-rise items-center gap-3 rounded-[1.4rem] py-2.5 pl-2.5 pr-3 transition-colors duration-300",
                  f.on ? "border-primary/60" : "opacity-95",
                )}
                style={{ animationDelay: `${150 + i * 60}ms` }}
              >
                <Link
                  to={f.nav.to}
                  onClick={() => playSound("nav")}
                  aria-label={`Configurar ${f.nav.label}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-transform group-hover:-rotate-6 group-active:scale-90", f.nav.tone)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 font-display text-[15px] font-semibold leading-tight">
                      <span className="truncate">{f.nav.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary-deep opacity-60 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{f.status}</span>
                  </span>
                </Link>
                <ToggleWithFx checked={f.on} onChange={f.toggle} label={f.nav.label} />
              </article>
            );
          })}
        </div>
      </section>

      {/* Ferramentas */}
      <section>
        <h2 className="text-2xl font-bold">Ferramentas</h2>
        <p className="mb-4 text-sm text-muted-foreground">O básico que deixa tudo funcionando direitinho.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {tools.map((t, i) => {
            const Icon = t.nav.icon;
            return (
              <Link
                key={t.nav.id}
                to={t.nav.to}
                onClick={() => playSound("nav")}
                className="squish-card squish-press flex animate-rise items-center gap-3 p-4"
                style={{ animationDelay: `${300 + i * 60}ms` }}
              >
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", t.nav.tone)}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-semibold">{t.nav.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t.status}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Documentos */}
      <section className="rounded-[2rem] border-2 border-dashed border-border-strong/70 bg-card/60 p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Combinados importantes 📜</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Antes de usar a Minako, vale dar uma lidinha nos documentos oficiais.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/termos"
            onClick={() => playSound("pop")}
            className="squish-card squish-press flex items-center gap-3 p-4"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <ScrollText className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display font-semibold">Termos de Uso</span>
              <span className="block text-xs text-muted-foreground">Regras para usar a Minako</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/privacidade"
            onClick={() => playSound("pop")}
            className="squish-card squish-press flex items-center gap-3 p-4"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-mint-foreground">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display font-semibold">Política de Privacidade</span>
              <span className="block text-xs text-muted-foreground">Como seus dados são cuidados</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Modo demonstração: as alterações ficam salvas apenas neste navegador.
      </p>
    </div>
  );
}

function ToggleWithFx({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <Switch
      ref={ref}
      checked={checked}
      aria-label={`Ligar ou desligar ${label}`}
      onCheckedChange={(v) => {
        playSound(v ? "on" : "off");
        if (v) burstFrom(ref.current, 10);
        onChange(v);
      }}
    />
  );
}
