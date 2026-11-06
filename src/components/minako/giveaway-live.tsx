// Partes da página de Sorteios que conversam com o bot: modelos, publicar/agendar e a lista de sorteios.
import { BookmarkPlus, CalendarCheck, ListChecks, Rocket, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  applyGiveawayTemplate,
  cancelGiveaway,
  createGiveaway,
  deleteGiveawayTemplate,
  listLiveGiveaways,
  loadGiveawayPanel,
  saveGiveawayTemplate,
  type GiveawayTemplate,
  type LiveGiveaway,
} from "@/lib/minako/bot.functions";
import { useDashboard } from "@/lib/minako/store";
import { validateGiveawayLaunch, validateGiveawayMessage } from "@/lib/minako/validation";

import { SectionCard, TextField } from "./fields";
import { playSound } from "./use-sound";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Algo deu errado.");

const STATUS: Record<string, { label: string; emoji: string }> = {
  scheduled: { label: "Agendado", emoji: "🗓️" },
  starting: { label: "Publicando", emoji: "⏳" },
  active: { label: "Ativo", emoji: "🎉" },
  drawn: { label: "Sorteado", emoji: "🏆" },
};

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

export function GiveawayLive() {
  const { mode, guild, draft, update, loading: guildLoading } = useDashboard();
  const g = draft.giveaways;
  const [templates, setTemplates] = useState<GiveawayTemplate[]>([]);
  const [live, setLive] = useState<LiveGiveaway[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [messageV2, setMessageV2] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessageV2(false);
    try {
      const res = await loadGiveawayPanel({ data: { guildId: guild.id } });
      setTemplates(res.templates);
      setLive(res.giveaways);
      setMessageV2(res.messageV2);
    } catch (e) {
      setError(msg(e));
    } finally {
      setLoading(false);
    }
  }, [guild.id]);

  useEffect(() => {
    if (mode === "live" && !guildLoading) void refresh();
  }, [mode, guildLoading, refresh]);

  if (mode !== "live") {
    return (
      <SectionCard title="Modelos e sorteios no ar" icon={ListChecks} tone="bg-sky text-sky-foreground">
        <p className="text-sm text-muted-foreground">
          Entre com o Discord para salvar modelos, publicar ou agendar sorteios e ver os que estão no ar.
        </p>
      </SectionCard>
    );
  }

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      playSound("error");
      toast.error("Não deu certo 🥺", { description: msg(e) });
    } finally {
      setBusy(null);
    }
  };

  const launchErrors = validateGiveawayLaunch(g);
  const scheduled = g.start === "scheduled";
  const needsBotUpdate = g.messageBlocks.length > 0 && !messageV2;
  const channelName = (id: string | null) => guild.channels.find((c) => c.id === id)?.name;

  return (
    <>
      <SectionCard
        title="Modelos"
        description="Guarde a configuração atual para reutilizar depois, ou carregue um modelo salvo."
        icon={BookmarkPlus}
        tone="bg-mint text-mint-foreground"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField label="Nome do modelo" value={templateName} onChange={setTemplateName} maxLength={80} placeholder="Ex.: Sorteio semanal" />
          </div>
          <Button
            disabled={!templateName.trim() || busy !== null || needsBotUpdate || validateGiveawayMessage(g).length > 0}
            onClick={() =>
              run("save", async () => {
                const list = await saveGiveawayTemplate({ data: { guildId: guild.id, name: templateName, giveaways: g } });
                setTemplates(list);
                setTemplateName("");
                playSound("success");
                toast.success("Modelo guardado ✨");
              })
            }
          >
            <BookmarkPlus /> {busy === "save" ? "Salvando…" : "Salvar como modelo"}
          </Button>
        </div>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{loading ? "Carregando modelos…" : "Nenhum modelo salvo ainda."}</p>
        ) : (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-2xl border-2 border-border bg-background px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() =>
                    run(`apply-${t.id}`, async () => {
                      const next = await applyGiveawayTemplate({ data: { guildId: guild.id, id: t.id, current: g } });
                      update("giveaways", next);
                      playSound("pop");
                      toast.success(`Modelo "${t.name}" carregado`, { description: "Confira os campos e salve se quiser manter." });
                    })
                  }
                >
                  {busy === `apply-${t.id}` ? "…" : "Usar"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Excluir modelo ${t.name}`}
                  disabled={busy !== null}
                  onClick={() => {
                    if (!window.confirm(`Excluir o modelo "${t.name}"?`)) return;
                    void run(`del-${t.id}`, async () => {
                      setTemplates(await deleteGiveawayTemplate({ data: { guildId: guild.id, id: t.id } }));
                      playSound("off");
                    });
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title={scheduled ? "Agendar sorteio" : "Publicar sorteio"}
        description={
          scheduled
            ? "A Minako publica no horário escolhido (horário de Brasília)."
            : "A Minako publica no canal em até 15 segundos."
        }
        icon={Rocket}
        tone="bg-primary text-primary-foreground"
      >
        {needsBotUpdate && <p role="alert" className="text-sm font-semibold text-destructive">{loading ? "Verificando suporte a componentes V2…" : "A API do bot precisa ser atualizada para publicar e salvar modelos com esses blocos. Seu rascunho pode ser salvo no painel."}</p>}
        {launchErrors.length > 0 && (
          <ul className="space-y-1 text-sm font-semibold text-destructive">
            {launchErrors.map((e) => (
              <li key={e}>🥺 {e}</li>
            ))}
          </ul>
        )}
        <Button
          size="lg"
          disabled={launchErrors.length > 0 || busy !== null || needsBotUpdate}
          onClick={() =>
            run("launch", async () => {
              const res = await createGiveaway({ data: { guildId: guild.id, giveaways: g } });
              playSound("success");
              toast.success(res.scheduled ? "Sorteio agendado 🗓️" : "Sorteio enviado 🎉", { description: res.message });
              setLive(await listLiveGiveaways({ data: { guildId: guild.id } }));
            })
          }
        >
          {scheduled ? <CalendarCheck /> : <Rocket />}
          {busy === "launch" ? "Enviando…" : scheduled ? "Agendar sorteio" : "Publicar agora"}
        </Button>
      </SectionCard>

      <SectionCard title="Sorteios ativos e agendados" icon={ListChecks} tone="bg-sky text-sky-foreground">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" disabled={loading} onClick={() => void refresh()}>
            {loading ? "Atualizando…" : "Atualizar"}
          </Button>
        </div>
        {error && <p className="text-sm font-semibold text-destructive">🥺 {error}</p>}
        {live.length === 0 ? (
          <p className="text-sm text-muted-foreground">{loading ? "Buscando sorteios…" : "Nenhum sorteio ativo ou agendado."}</p>
        ) : (
          <ul className="space-y-2">
            {live.map((item) => {
              const st = STATUS[item.status] ?? { label: item.status, emoji: "🎁" };
              const ch = channelName(item.channelId);
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-border bg-background px-3 py-2.5">
                  <span className="text-lg">{st.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {st.label}
                      {ch ? ` · #${ch}` : ""}
                      {item.status === "scheduled" && when(item.startsAt) ? ` · começa ${when(item.startsAt)}` : ""}
                      {when(item.endsAt) ? ` · termina ${when(item.endsAt)}` : ""}
                    </p>
                  </div>
                  {item.status === "scheduled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy !== null}
                      onClick={() => {
                        if (!window.confirm(`Cancelar o sorteio agendado "${item.name}"?`)) return;
                        void run(`cancel-${item.id}`, async () => {
                          await cancelGiveaway({ data: { guildId: guild.id, id: item.id } });
                          setLive((l) => l.filter((x) => x.id !== item.id));
                          playSound("off");
                          toast("Agendamento cancelado.");
                        });
                      }}
                    >
                      {busy === `cancel-${item.id}` ? "…" : "Cancelar"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Sorteios já publicados são encerrados ou cancelados pelo comando /sorteios no Discord.
        </p>
      </SectionCard>
    </>
  );
}
