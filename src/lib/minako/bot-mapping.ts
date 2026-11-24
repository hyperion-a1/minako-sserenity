// Converte entre o formato do painel (MinakoConfig) e o formato que a API do bot
// (activity/server.mjs → /api/dashboard) aceita. O painel inteiro também é enviado em
// `panel`, que o bot guarda como está e devolve no próximo carregamento.
import { DEFAULT_GIVEAWAY_PRIVATE_MESSAGE, mergeWithDefaults, type DemoChannel, type DemoGuild, type DemoRole, type MinakoConfig } from "./config";
import { readGiveawayBlocks } from "./giveaway-message";

export type BotConfig = Record<string, unknown>;

const csv = (ids: string[]) => ids.join(", ");
const parseCsv = (v: unknown) =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** O bot só entende domingo, segunda e sábado como início da semana. */
export function botWeekDay(day: number): "sunday" | "monday" | "saturday" {
  if (day === 0) return "sunday";
  if (day === 6) return "saturday";
  return "monday";
}
const dayFromBot = (v: unknown) => (v === "sunday" ? 0 : v === "saturday" ? 6 : 1);

export function toBotPayload(c: MinakoConfig): BotConfig {
  return {
    panel: c,
    weekStartDay: botWeekDay(c.week.startDay),
    weekStartTime: c.week.startTime,
    timezone: c.week.timezone,
    moderationChannel: c.channels.moderation ?? "",
    publicationChannel: c.channels.publication ?? "",
    nightEnabled: c.night.enabled,
    nightStart: c.night.start,
    nightEnd: c.night.end,
    nightCategories: csv(c.night.categories),
    nightAffectedChannels: csv(c.night.affected),
    nightImmuneChannels: csv(c.night.immune),
    nightNoticeChannels: csv(c.night.notices),
    nightNoticeUrl: c.night.noticeUrl,
    seasonal: { halloween: c.seasonal.halloween, christmas: c.seasonal.natal, newYear: c.seasonal.ano_novo },
    starRole: c.roles.star ?? "",
    matchAdminRoles: csv(c.roles.matchAdmins),
    centralChannel: c.matchmaking.centralChannel ?? "",
    matchModes: c.matchmaking.modes.join(", "),
  };
}

/** Dados que o bot guarda no próprio banco têm prioridade sobre o rascunho salvo do painel. */
type BotIn = Partial<Record<"panel" | "weekStartDay" | "weekStartTime" | "timezone" | "moderationChannel" | "publicationChannel" | "nightEnabled" | "nightStart" | "nightEnd" | "nightCategories" | "nightAffectedChannels" | "nightImmuneChannels" | "nightNoticeChannels" | "nightNoticeUrl" | "seasonal" | "starRole" | "matchAdminRoles" | "centralChannel" | "matchModes", unknown>>;

export function fromBotConfig(input: BotConfig): MinakoConfig {
  const b = input as BotIn;
  const c = mergeWithDefaults(b.panel);
  const botDay = dayFromBot(b.weekStartDay);
  if (botWeekDay(c.week.startDay) !== botWeekDay(botDay)) c.week.startDay = botDay;
  if (str(b.weekStartTime)) c.week.startTime = str(b.weekStartTime);
  if (str(b.timezone)) c.week.timezone = str(b.timezone);
  c.channels = { moderation: str(b.moderationChannel) || null, publication: str(b.publicationChannel) || null };
  c.night = {
    ...c.night,
    enabled: Boolean(b.nightEnabled),
    start: str(b.nightStart) || c.night.start,
    end: str(b.nightEnd) || c.night.end,
    categories: parseCsv(b.nightCategories),
    affected: parseCsv(b.nightAffectedChannels),
    immune: parseCsv(b.nightImmuneChannels),
    notices: parseCsv(b.nightNoticeChannels),
    noticeUrl: str(b.nightNoticeUrl),
  };
  const s = (b.seasonal ?? {}) as { halloween?: unknown; christmas?: unknown; newYear?: unknown };
  c.seasonal = { halloween: s.halloween !== false, natal: s.christmas !== false, ano_novo: s.newYear !== false };
  c.roles = { ...c.roles, star: str(b.starRole) || null, matchAdmins: parseCsv(b.matchAdminRoles) };
  c.matchmaking = {
    ...c.matchmaking,
    centralChannel: str(b.centralChannel) || null,
    modes: parseCsv(b.matchModes).length ? parseCsv(b.matchModes) : c.matchmaking.modes,
  };
  return c;
}

export interface BotGuildData {
  channels: { id: string; name: string; type: number; parentId: string | null }[];
  roles: { id: string; name: string; color: string | null; managed: boolean }[];
}

const KIND: Record<number, DemoChannel["kind"]> = { 0: "text", 5: "announcement", 15: "forum", 4: "category" };

export function guildFromDiscord(
  meta: { id: string; name: string; members: number },
  data: BotGuildData,
): DemoGuild {
  const channels: DemoChannel[] = data.channels
    .filter((ch) => KIND[ch.type])
    .map((ch) => ({ id: ch.id, name: ch.name, kind: KIND[ch.type]!, parent: ch.parentId ?? undefined }));
  const roles: DemoRole[] = data.roles
    .filter((r) => !r.managed)
    .map((r) => ({ id: r.id, name: r.name, color: r.color ?? "oklch(0.65 0.03 60)" }));
  return { id: meta.id, name: meta.name, emoji: "🌸", members: meta.members, channels, roles };
}

/* ---------- Sorteios ---------- */

type Giveaways = MinakoConfig["giveaways"];
const DURATIONS = ["1h", "6h", "12h", "24h", "3d", "7d", "custom"] as const;

/** Formato de sorteio/modelo que o bot aceita (campos giveaway* do /api/dashboard). */
export function toBotGiveaway(g: Giveaways): Record<string, unknown> {
  return {
    giveawayName: g.name,
    giveawayMin: g.minParticipants,
    giveawayMax: g.maxParticipants,
    giveawayWinners: g.winners,
    giveawayDuration: g.duration,
    giveawayEndDate: g.duration === "custom" ? g.endDate : "",
    giveawayAllowedRoles: csv(g.allowedRoles),
    giveawayBlockedRoles: csv(g.blockedRoles),
    giveawayAllowedMembers: "",
    giveawayBlockedMembers: "",
    giveawayRulesScope: g.rulesScope,
    giveawayCooldownType: g.cooldownType,
    giveawayCooldownAmount: g.cooldownAmount,
    giveawayStart: g.start,
    giveawayScheduledAt: g.start === "scheduled" ? g.scheduledAt : "",
    giveawayChannel: g.channel ?? "",
    giveawayPin: g.pin,
    giveawayPrivateThread: g.privateThread,
    giveawayPrivateMessage: str(g.privateMessage).trim() ? g.privateMessage : DEFAULT_GIVEAWAY_PRIVATE_MESSAGE,
    giveawayMessage: g.message,
    giveawayMessageBlocks: g.messageBlocks,
    giveawayColor: g.color,
  };
}

/** Lê um modelo devolvido pelo bot de volta para o formato do painel. */
export function fromBotGiveaway(input: Record<string, unknown>, current: Giveaways): Giveaways {
  const b = input as Partial<Record<string, unknown>>;
  const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const dur = DURATIONS.find((d) => d === b["giveawayDuration"]) ?? current.duration;
  const cd = b["giveawayCooldownType"];
  return {
    ...current,
    name: str(b["giveawayName"]) || current.name,
    minParticipants: num(b["giveawayMin"], current.minParticipants),
    maxParticipants: num(b["giveawayMax"], current.maxParticipants),
    winners: num(b["giveawayWinners"], current.winners),
    duration: dur,
    endDate: str(b["giveawayEndDate"]),
    start: b["giveawayStart"] === "scheduled" ? "scheduled" : "immediate",
    scheduledAt: str(b["giveawayScheduledAt"]),
    allowedRoles: parseCsv(b["giveawayAllowedRoles"]),
    blockedRoles: parseCsv(b["giveawayBlockedRoles"]),
    rulesScope: b["giveawayRulesScope"] === "global" ? "global" : "local",
    cooldownType: cd === "giveaways" || cd === "days" ? cd : "none",
    cooldownAmount: num(b["giveawayCooldownAmount"], current.cooldownAmount),
    channel: str(b["giveawayChannel"]) || null,
    pin: Boolean(b["giveawayPin"]),
    privateThread: Boolean(b["giveawayPrivateThread"]),
    privateMessage: str(b["giveawayPrivateMessage"]).trim() ? str(b["giveawayPrivateMessage"]) : DEFAULT_GIVEAWAY_PRIVATE_MESSAGE,
    message: str(b["giveawayMessage"]) || current.message,
    messageBlocks: readGiveawayBlocks(b["giveawayMessageBlocks"]),
    color: str(b["giveawayColor"]) || current.color,
  };
}
