import { createFileRoute } from "@tanstack/react-router";
import { Plus, Timer, Users, X } from "lucide-react";
import { useState } from "react";

import {
  ChannelPicker,
  FieldShell,
  NumberField,
  SectionCard,
  ToggleRow,
  single,
  useFieldError,
} from "@/components/minako/fields";
import { NAV_ITEMS } from "@/components/minako/modules";
import { PageHeader } from "@/components/minako/page-header";
import { playSound } from "@/components/minako/use-sound";
import { useDashboard } from "@/lib/minako/store";
import { MATCHMAKING_LIMITS } from "@/lib/minako/validation";

export const Route = createFileRoute("/matchmaking")({
  head: () => ({
    meta: [
      { title: "Matchmaking — Minako Aino" },
      { name: "description", content: "Configure a Central de Matchmaking da Minako: modos de jogo, tamanho dos grupos e prazos." },
      { property: "og:title", content: "Matchmaking — Minako Aino" },
      { property: "og:description", content: "Seu próximo time começa aqui: grupos, modos e prazos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchmakingPage,
});

function MatchmakingPage() {
  const { draft, update } = useDashboard();
  const m = draft.matchmaking;
  const nav = NAV_ITEMS.find((n) => n.id === "matchmaking")!;
  const [newMode, setNewMode] = useState("");
  const capErr = useFieldError("matchmaking", "groupCapacity");
  const propErr = useFieldError("matchmaking", "proposalMinutes");
  const modesErr = useFieldError("matchmaking", "modes");

  const addMode = () => {
    const name = newMode.trim();
    if (!name || m.modes.some((x) => x.toLowerCase() === name.toLowerCase())) return;
    playSound("pop");
    update("matchmaking", { modes: [...m.modes, name] });
    setNewMode("");
  };

  return (
    <div className="space-y-5">
      <PageHeader item={nav} subtitle="A Minako junta a galera disponível e monta grupos para jogar junto." />

      <ToggleRow
        big
        emoji="🎮"
        label="Matchmaking ligado"
        hint="Quando desligado, a Central fica fechadinha."
        checked={m.enabled}
        onChange={(v) => update("matchmaking", { enabled: v })}
      />

      <div className={m.enabled ? "space-y-5" : "pointer-events-none space-y-5 opacity-50"}>
        <SectionCard title="Central de Matchmaking" description="O canal onde fica o painel da Central." icon={nav.icon} tone={nav.tone}>
          <ChannelPicker
            label="Canal da Central"
            multiple={false}
            value={single.toList(m.centralChannel)}
            onChange={(l) => update("matchmaking", { centralChannel: single.fromList(l) })}
            placeholder="Escolher canal"
          />
          <FieldShell label="Modos de jogo" error={modesErr} hint="Ex.: Clássico, Ranqueada, Casual.">
            <div className="flex flex-wrap gap-2">
              {m.modes.map((mode) => (
                <span
                  key={mode}
                  className="inline-flex animate-pop-in items-center gap-1 rounded-full border-2 border-mint-foreground/30 bg-mint py-1 pl-3 pr-1 font-display text-sm font-semibold text-mint-foreground"
                >
                  {mode}
                  <button
                    type="button"
                    aria-label={`Remover ${mode}`}
                    onClick={() => {
                      playSound("off");
                      update("matchmaking", { modes: m.modes.filter((x) => x !== mode) });
                    }}
                    className="grid h-5 w-5 place-items-center rounded-full bg-card/70 hover:bg-card"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newMode}
                maxLength={40}
                onChange={(e) => setNewMode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMode())}
                placeholder="Novo modo…"
                aria-label="Novo modo de jogo"
                className="w-full rounded-2xl border-2 border-input bg-background px-4 py-2.5 text-sm font-semibold outline-none focus:border-ring"
              />
              <button
                type="button"
                onClick={addMode}
                aria-label="Adicionar modo"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-squish-primary)] active:translate-y-1 active:shadow-none"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </FieldShell>
        </SectionCard>

        <SectionCard title="Grupos e prazos" icon={Users} tone="bg-sky text-sky-foreground" delay={60}>
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              label="Pessoas por grupo"
              value={m.groupCapacity}
              min={MATCHMAKING_LIMITS.groupCapacity[0]}
              max={MATCHMAKING_LIMITS.groupCapacity[1]}
              onChange={(v) => update("matchmaking", { groupCapacity: v })}
              suffix="pessoas"
              error={capErr}
            />
            <NumberField
              label="Prazo para responder"
              value={m.proposalMinutes}
              min={MATCHMAKING_LIMITS.proposalMinutes[0]}
              max={MATCHMAKING_LIMITS.proposalMinutes[1]}
              onChange={(v) => update("matchmaking", { proposalMinutes: v })}
              suffix="min"
              hint="Tempo para aceitar um convite de partida."
              error={propErr}
            />
          </div>
          <ToggleRow
            emoji="🔍"
            label="Revisar partidas antes de contar"
            hint="Alguém da equipe confirma o resultado antes de ir para o ranking."
            checked={m.reviewMatches}
            onChange={(v) => update("matchmaking", { reviewMatches: v })}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" /> Convites sem resposta expiram sozinhos.
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
