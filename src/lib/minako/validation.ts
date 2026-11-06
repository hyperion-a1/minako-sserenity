import type { MinakoConfig, ModuleId } from "./config";
import type { GiveawayBlock } from "./giveaway-message";

export interface Issue {
  module: ModuleId;
  field: string;
  message: string;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const NOTICE_URL_RE = /^https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

export function isValidNoticeUrl(value: string): boolean {
  return NOTICE_URL_RE.test(value);
}

/** Limites aceitos pelo módulo TikTok do bot (mesmos do esquema do banco). */
export const TIKTOK_LIMITS = {
  pollMinutes: [5, 60],
  maxAccounts: [1, 10],
  accountCooldownSeconds: [300, 3600],
  guildCooldownSeconds: [60, 1800],
} as const;

export const MATCHMAKING_LIMITS = {
  groupCapacity: [2, 10],
  proposalMinutes: [1, 60],
} as const;

function inRange(n: number, [min, max]: readonly [number, number]) {
  return Number.isInteger(n) && n >= min && n <= max;
}

export function validateConfig(c: MinakoConfig): Issue[] {
  const issues: Issue[] = [];
  const add = (module: ModuleId, field: string, message: string) =>
    issues.push({ module, field, message });

  // Semana
  if (!isValidTime(c.week.startTime))
    add("semana", "startTime", "O horário da virada precisa estar no formato HH:MM.");

  // Modo Noturno
  if (!isValidTime(c.night.start))
    add("noturno", "start", "O início do Modo Noturno precisa estar no formato HH:MM.");
  if (!isValidTime(c.night.end))
    add("noturno", "end", "O fim do Modo Noturno precisa estar no formato HH:MM.");
  if (c.night.start === c.night.end)
    add("noturno", "end", "O início e o fim do Modo Noturno não podem ser iguais.");
  if (c.night.noticeUrl.trim() && !isValidNoticeUrl(c.night.noticeUrl.trim()))
    add("noturno", "noticeUrl", "O link do aviso precisa ser um link de mensagem do Discord.");

  // Matchmaking
  if (c.matchmaking.enabled) {
    if (!inRange(c.matchmaking.groupCapacity, MATCHMAKING_LIMITS.groupCapacity))
      add("matchmaking", "groupCapacity", "A capacidade do grupo deve ficar entre 2 e 10 pessoas.");
    if (!inRange(c.matchmaking.proposalMinutes, MATCHMAKING_LIMITS.proposalMinutes))
      add("matchmaking", "proposalMinutes", "O prazo de resposta deve ficar entre 1 e 60 minutos.");
    if (c.matchmaking.modes.length === 0)
      add("matchmaking", "modes", "Adicione pelo menos um modo de jogo.");
  }

  // Sorteios
  const g = c.giveaways;
  if (g.enabled) {
    if (!g.name.trim()) add("sorteios", "name", "Dê um nome para o sorteio.");
    if (!Number.isInteger(g.winners) || g.winners < 1)
      add("sorteios", "winners", "O sorteio precisa de pelo menos 1 ganhador.");
    if (!Number.isInteger(g.minParticipants) || g.minParticipants < 0)
      add("sorteios", "minParticipants", "O mínimo de participantes não pode ser negativo.");
    if (g.maxParticipants > 0) {
      if (g.minParticipants > g.maxParticipants)
        add("sorteios", "maxParticipants", "O máximo de participantes não pode ser menor que o mínimo.");
      if (g.winners > g.maxParticipants)
        add("sorteios", "winners", "Não dá para ter mais ganhadores do que participantes.");
    }
    if (g.cooldownType !== "none" && (!Number.isInteger(g.cooldownAmount) || g.cooldownAmount < 1))
      add("sorteios", "cooldownAmount", "A quantidade do intervalo precisa ser 1 ou mais.");
    if (!HEX_RE.test(g.color)) add("sorteios", "color", "A cor precisa estar no formato #RRGGBB.");
    for (const message of validateGiveawayMessage(g)) add("sorteios", "messageBlocks", message);
  }

  // TikTok
  const t = c.tiktok;
  if (t.enabled) {
    if (!t.channel) add("tiktok", "channel", "Escolha o canal onde os avisos do TikTok vão aparecer.");
    if (!inRange(t.pollMinutes, TIKTOK_LIMITS.pollMinutes))
      add("tiktok", "pollMinutes", "O monitor de vídeos deve ficar entre 5 e 60 minutos.");
    if (!inRange(t.maxAccounts, TIKTOK_LIMITS.maxAccounts))
      add("tiktok", "maxAccounts", "O máximo de criadores deve ficar entre 1 e 10.");
    if (!inRange(t.accountCooldownSeconds, TIKTOK_LIMITS.accountCooldownSeconds))
      add("tiktok", "accountCooldownSeconds", "O intervalo por criador deve ficar entre 300 e 3600 segundos.");
    if (!inRange(t.guildCooldownSeconds, TIKTOK_LIMITS.guildCooldownSeconds))
      add("tiktok", "guildCooldownSeconds", "O intervalo do servidor deve ficar entre 60 e 1800 segundos.");
  }

  return issues;
}

/** Canais que o Modo Noturno realmente bloqueia (imunidade prevalece). */
export function resolveNightScope(
  night: MinakoConfig["night"],
  channelsByCategory: Record<string, string[]>,
): string[] {
  const fromCategories = night.categories.flatMap((id) => channelsByCategory[id] ?? []);
  const all = new Set([...fromCategories, ...night.affected]);
  for (const id of night.immune) all.delete(id);
  return [...all];
}

/** Hora de Brasília (UTC-3, sem horário de verão) de um campo AAAA-MM-DDTHH:MM, em milissegundos. */
export function brasiliaToMs(local: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  return Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]! + 3, +m[5]!);
}

/** Regras do bot para publicar/agendar um sorteio agora (giveawayCore.validateConfig). */
export function validateGiveawayLaunch(g: MinakoConfig["giveaways"], now = Date.now()): string[] {
  const errors: string[] = validateGiveawayMessage(g);
  if (!g.name.trim()) errors.push("Dê um nome para o sorteio.");
  if (!g.channel) errors.push("Escolha o canal do sorteio.");
  let startMs = now;
  if (g.start === "scheduled") {
    const s = brasiliaToMs(g.scheduledAt);
    if (s === null) errors.push("Escolha a data e hora de início do agendamento.");
    else if (s < now + 30_000) errors.push("A data de início precisa estar no futuro.");
    else startMs = s;
  }
  if (g.duration === "custom") {
    const e = brasiliaToMs(g.endDate);
    if (e === null) errors.push("Escolha a data e hora de encerramento.");
    else if (e < startMs + 60_000) errors.push("O encerramento precisa ser pelo menos 1 minuto depois do início.");
  }
  if (g.allowedRoles.some((r) => g.blockedRoles.includes(r)))
    errors.push("Um cargo não pode ser permitido e bloqueado ao mesmo tempo.");
  return errors;
}

export const GIVEAWAY_MESSAGE_LIMITS = { blocks: 12, text: 1500, totalText: 3000, gallery: 10, components: 32, url: 500 } as const;

export function isValidMediaUrl(value: string): boolean {
  const s = value.trim();
  if (!s || s.length > GIVEAWAY_MESSAGE_LIMITS.url || /[\s"'<>]/.test(s)) return false;
  try { return new URL(s).protocol === "https:"; } catch { return false; }
}

export function validateGiveawayMessage(g: Pick<MinakoConfig["giveaways"], "message" | "messageBlocks">): string[] {
  const blocks: GiveawayBlock[] = g.messageBlocks?.length ? g.messageBlocks : [{ type: "text", content: g.message }];
  const errors: string[] = [];
  if (blocks.length > GIVEAWAY_MESSAGE_LIMITS.blocks) errors.push("Use no máximo 12 blocos na mensagem.");
  let total = 0;
  let components = 0;
  blocks.forEach((b, index) => {
    const prefix = `Bloco ${index + 1}: `;
    components += b.type === "section" ? 3 : 1;
    if (b.type === "text" || b.type === "section") {
      total += b.content.length;
      if (!b.content.trim()) errors.push(prefix + "preencha o texto.");
      if (b.content.length > GIVEAWAY_MESSAGE_LIMITS.text) errors.push(prefix + "o texto pode ter até 1.500 caracteres.");
    }
    if (b.type === "section" && !isValidMediaUrl(b.thumbnail)) errors.push(prefix + "a miniatura precisa de um link HTTPS válido.");
    if (b.type === "gallery") {
      if (!b.urls.length || b.urls.length > GIVEAWAY_MESSAGE_LIMITS.gallery) errors.push(prefix + "a galeria precisa de 1 a 10 mídias.");
      if (b.urls.some((url) => !isValidMediaUrl(url))) errors.push(prefix + "cada mídia precisa de um link HTTPS válido.");
    }
  });
  if (total > GIVEAWAY_MESSAGE_LIMITS.totalText) errors.push("A mensagem pode ter até 3.000 caracteres de texto no total.");
  if (components > GIVEAWAY_MESSAGE_LIMITS.components) errors.push("A mensagem ultrapassa o limite de 32 componentes.");
  return errors;
}
