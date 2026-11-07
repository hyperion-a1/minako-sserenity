import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Gauge } from "lucide-react";

import {
  ChannelPicker,
  MinakoTip,
  NumberField,
  SectionCard,
  ToggleRow,
  single,
  useFieldError,
} from "@/components/minako/fields";
import { NAV_ITEMS } from "@/components/minako/modules";
import { PageHeader } from "@/components/minako/page-header";
import { useDashboard } from "@/lib/minako/store";
import { TIKTOK_LIMITS } from "@/lib/minako/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/painel/tiktok")({
  head: () => ({
    meta: [
      { title: "Avisos do TikTok — Minako Aino" },
      { name: "description", content: "Configure os avisos de vídeos novos e lives dos criadores do servidor no TikTok." },
      { property: "og:title", content: "Avisos do TikTok — Minako Aino" },
      { property: "og:description", content: "A Minako avisa quando os criadores do servidor postam ou entram ao vivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TikTokPage,
});

function TikTokPage() {
  const { draft, update } = useDashboard();
  const t = draft.tiktok;
  const nav = NAV_ITEMS.find((n) => n.id === "tiktok")!;
  const set = (patch: Partial<typeof t>) => update("tiktok", patch);
  const err = {
    channel: useFieldError("tiktok", "channel"),
    poll: useFieldError("tiktok", "pollMinutes"),
    max: useFieldError("tiktok", "maxAccounts"),
    acc: useFieldError("tiktok", "accountCooldownSeconds"),
    guild: useFieldError("tiktok", "guildCooldownSeconds"),
  };

  return (
    <div className="space-y-5">
      <PageHeader item={nav} subtitle="A Minako avisa quando os criadores do servidor postam vídeo novo ou entram ao vivo." />

      <ToggleRow
        big
        emoji="🎬"
        label="Avisos do TikTok ligados"
        hint="Os criadores conectam a conta pelo comando /tiktok no Discord."
        checked={t.enabled}
        onChange={(v) => set({ enabled: v })}
      />

      <div className={cn("space-y-5", !t.enabled && "pointer-events-none opacity-50")}>
        <SectionCard title="Onde e o quê" icon={BellRing} tone={nav.tone}>
          <ChannelPicker
            label="Canal dos avisos"
            multiple={false}
            kinds={["text"]}
            value={single.toList(t.channel)}
            onChange={(l) => set({ channel: single.fromList(l) })}
            placeholder="Escolher canal"
            error={err.channel}
          />
          <ToggleRow emoji="📹" label="Vídeos novos" checked={t.videoNotifications} onChange={(v) => set({ videoNotifications: v })} />
          <ToggleRow
            emoji="🔴"
            label="Anúncios de live"
            hint="O criador anuncia a própria live com um comando."
            checked={t.liveAnnouncements}
            onChange={(v) => set({ liveAnnouncements: v })}
          />
          <ToggleRow emoji="🙋" label="Mencionar o criador no aviso" checked={t.mentionCreator} onChange={(v) => set({ mentionCreator: v })} />
          <MinakoTip>Por segurança, menções em massa (@everyone/@here) nunca são usadas. 🫶</MinakoTip>
        </SectionCard>

        <SectionCard title="Intervalos e limites" icon={Gauge} tone="bg-secondary text-secondary-foreground" delay={60}>
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              label="Procurar vídeos a cada"
              value={t.pollMinutes}
              min={TIKTOK_LIMITS.pollMinutes[0]}
              max={TIKTOK_LIMITS.pollMinutes[1]}
              onChange={(v) => set({ pollMinutes: v })}
              suffix="min"
              hint="Entre 5 e 60 minutos."
              error={err.poll}
            />
            <NumberField
              label="Máximo de criadores"
              value={t.maxAccounts}
              min={TIKTOK_LIMITS.maxAccounts[0]}
              max={TIKTOK_LIMITS.maxAccounts[1]}
              onChange={(v) => set({ maxAccounts: v })}
              hint="Entre 1 e 10."
              error={err.max}
            />
            <NumberField
              label="Pausa entre lives do mesmo criador"
              value={t.accountCooldownSeconds}
              min={TIKTOK_LIMITS.accountCooldownSeconds[0]}
              max={TIKTOK_LIMITS.accountCooldownSeconds[1]}
              step={60}
              onChange={(v) => set({ accountCooldownSeconds: v })}
              suffix="seg"
              hint="Entre 300 e 3600 segundos."
              error={err.acc}
            />
            <NumberField
              label="Pausa entre lives no servidor"
              value={t.guildCooldownSeconds}
              min={TIKTOK_LIMITS.guildCooldownSeconds[0]}
              max={TIKTOK_LIMITS.guildCooldownSeconds[1]}
              step={30}
              onChange={(v) => set({ guildCooldownSeconds: v })}
              suffix="seg"
              hint="Entre 60 e 1800 segundos."
              error={err.guild}
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
