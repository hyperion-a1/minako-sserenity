// Modelo de configuração da Minako exibido na dashboard.
// Espelha os módulos do bot (/minako-configurar, /sorteios, /minako-matchmaking, /tiktok)
// para que, ao conectar com o servidor real, os campos possam ser mapeados 1:1.
import { readGiveawayBlocks, type GiveawayBlock } from "./giveaway-message";

export type ModuleId =
  | "semana"
  | "canais"
  | "noturno"
  | "personalidade"
  | "cargos"
  | "matchmaking"
  | "sorteios"
  | "tiktok";

/** Mesmo texto padrão de giveawayCore.DEFAULT_THREAD_MESSAGE no bot. */
export const DEFAULT_GIVEAWAY_PRIVATE_MESSAGE = "Parabéns {users}! 🎉 Vocês ganharam **{giveaway}**. {host} vai combinar a entrega por aqui.";

export interface MinakoConfig {
  week: { startDay: number; startTime: string; timezone: string };
  channels: { moderation: string | null; publication: string | null };
  night: {
    enabled: boolean;
    start: string;
    end: string;
    categories: string[];
    affected: string[];
    immune: string[];
    notices: string[];
    noticeUrl: string;
  };
  seasonal: { halloween: boolean; natal: boolean; ano_novo: boolean };
  roles: { star: string | null; matchAdmins: string[]; giveawayCreators: string[] };
  matchmaking: {
    enabled: boolean;
    centralChannel: string | null;
    modes: string[];
    groupCapacity: number;
    proposalMinutes: number;
    reviewMatches: boolean;
  };
  giveaways: {
    enabled: boolean;
    name: string;
    winners: number;
    minParticipants: number;
    maxParticipants: number;
    duration: "1h" | "6h" | "12h" | "24h" | "3d" | "7d" | "custom";
    /** Fim personalizado (data e hora de Brasília, AAAA-MM-DDTHH:MM). */
    endDate: string;
    start: "immediate" | "scheduled";
    /** Início agendado (data e hora de Brasília, AAAA-MM-DDTHH:MM). */
    scheduledAt: string;
    channel: string | null;
    allowedRoles: string[];
    blockedRoles: string[];
    cooldownType: "none" | "giveaways" | "days";
    cooldownAmount: number;
    rulesScope: "local" | "global";
    pin: boolean;
    privateThread: boolean;
    privateMessage: string;
    message: string;
    messageBlocks: GiveawayBlock[];
    color: string;
  };
  tiktok: {
    enabled: boolean;
    channel: string | null;
    videoNotifications: boolean;
    liveAnnouncements: boolean;
    mentionCreator: boolean;
    pollMinutes: number;
    maxAccounts: number;
    accountCooldownSeconds: number;
    guildCooldownSeconds: number;
  };
}

export const DEFAULT_CONFIG: MinakoConfig = {
  week: { startDay: 1, startTime: "00:00", timezone: "America/Sao_Paulo" },
  channels: { moderation: null, publication: null },
  night: {
    enabled: false,
    start: "01:00",
    end: "05:00",
    categories: [],
    affected: [],
    immune: [],
    notices: [],
    noticeUrl: "",
  },
  seasonal: { halloween: true, natal: true, ano_novo: true },
  roles: { star: null, matchAdmins: [], giveawayCreators: [] },
  matchmaking: {
    enabled: true,
    centralChannel: null,
    modes: ["Clássico", "Ranqueada", "Casual"],
    groupCapacity: 5,
    proposalMinutes: 10,
    reviewMatches: true,
  },
  giveaways: {
    enabled: true,
    name: "Sorteio da comunidade",
    winners: 1,
    minParticipants: 2,
    maxParticipants: 100,
    duration: "24h",
    endDate: "",
    start: "immediate",
    scheduledAt: "",
    channel: null,
    allowedRoles: [],
    blockedRoles: [],
    cooldownType: "none",
    cooldownAmount: 1,
    rulesScope: "local",
    pin: false,
    privateThread: true,
    privateMessage: DEFAULT_GIVEAWAY_PRIVATE_MESSAGE,
    message: "🎁 Sorteio especial da comunidade!\nClique no botão para participar e boa sorte! ✨",
    messageBlocks: [],
    color: "#f6bd4b",
  },
  tiktok: {
    enabled: false,
    channel: null,
    videoNotifications: true,
    liveAnnouncements: false,
    mentionCreator: false,
    pollMinutes: 5,
    maxAccounts: 10,
    accountCooldownSeconds: 900,
    guildCooldownSeconds: 180,
  },
};

export function cloneConfig(config: MinakoConfig): MinakoConfig {
  return JSON.parse(JSON.stringify(config)) as MinakoConfig;
}

/** Mescla um objeto salvo (possivelmente antigo/incompleto) com os padrões. */
export function mergeWithDefaults(stored: unknown): MinakoConfig {
  const base = cloneConfig(DEFAULT_CONFIG);
  if (!stored || typeof stored !== "object") return base;
  const s = stored as Record<string, unknown>;
  for (const key of Object.keys(base) as (keyof MinakoConfig)[]) {
    const value = s[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      (base as unknown as Record<string, unknown>)[key] = { ...base[key], ...value };
    }
  }
  base.giveaways.messageBlocks = readGiveawayBlocks(base.giveaways.messageBlocks);
  if (typeof base.giveaways.privateMessage !== "string") base.giveaways.privateMessage = DEFAULT_GIVEAWAY_PRIVATE_MESSAGE;
  return base;
}

/* ---------- Dados de demonstração dos servidores ---------- */

export interface DemoChannel {
  id: string;
  name: string;
  kind: "text" | "announcement" | "forum" | "category";
  parent?: string | undefined;
}
export interface DemoRole {
  id: string;
  name: string;
  color: string;
}
export interface DemoGuild {
  id: string;
  name: string;
  emoji: string;
  members: number;
  channels: DemoChannel[];
  roles: DemoRole[];
}

export const DEMO_GUILDS: DemoGuild[] = [
  {
    id: "1100000000000000001",
    name: "Serenity HoK",
    emoji: "🌸",
    members: 1284,
    channels: [
      { id: "c-cat-geral", name: "Comunidade", kind: "category" },
      { id: "c-cat-jogos", name: "Jogatina", kind: "category" },
      { id: "c-cat-staff", name: "Equipe", kind: "category" },
      { id: "c-geral", name: "geral", kind: "text", parent: "c-cat-geral" },
      { id: "c-memes", name: "memes", kind: "text", parent: "c-cat-geral" },
      { id: "c-avisos", name: "avisos", kind: "announcement", parent: "c-cat-geral" },
      { id: "c-destaques", name: "destaques-da-semana", kind: "announcement", parent: "c-cat-geral" },
      { id: "c-central", name: "central-gamer", kind: "text", parent: "c-cat-jogos" },
      { id: "c-procura", name: "procura-de-time", kind: "forum", parent: "c-cat-jogos" },
      { id: "c-sorteios", name: "sorteios", kind: "text", parent: "c-cat-jogos" },
      { id: "c-tiktok", name: "tiktok-da-galera", kind: "text", parent: "c-cat-geral" },
      { id: "c-mod", name: "moderação", kind: "text", parent: "c-cat-staff" },
      { id: "c-boasvindas", name: "boas-vindas", kind: "text", parent: "c-cat-geral" },
    ],
    roles: [
      { id: "r-admin", name: "Administração", color: "oklch(0.63 0.19 28)" },
      { id: "r-mod", name: "Moderação", color: "oklch(0.7 0.12 245)" },
      { id: "r-estrela", name: "Estrela da Semana", color: "oklch(0.8 0.16 72)" },
      { id: "r-capitao", name: "Capitão de Partidas", color: "oklch(0.7 0.13 165)" },
      { id: "r-criador", name: "Criador de Conteúdo", color: "oklch(0.72 0.14 350)" },
      { id: "r-vip", name: "VIP", color: "oklch(0.75 0.12 300)" },
      { id: "r-membro", name: "Membro", color: "oklch(0.65 0.03 60)" },
      { id: "r-castigo", name: "De castigo", color: "oklch(0.55 0.02 60)" },
    ],
  },
  {
    id: "1100000000000000002",
    name: "Cantinho da Minako",
    emoji: "🧡",
    members: 342,
    channels: [
      { id: "k-cat-sala", name: "Sala de estar", kind: "category" },
      { id: "k-cat-jogos", name: "Jogos", kind: "category" },
      { id: "k-papo", name: "papo-livre", kind: "text", parent: "k-cat-sala" },
      { id: "k-fotos", name: "fotinhas", kind: "text", parent: "k-cat-sala" },
      { id: "k-anuncios", name: "anúncios", kind: "announcement", parent: "k-cat-sala" },
      { id: "k-partidas", name: "partidas", kind: "text", parent: "k-cat-jogos" },
      { id: "k-sorteios", name: "mimos-e-sorteios", kind: "text", parent: "k-cat-jogos" },
      { id: "k-staff", name: "staff", kind: "text", parent: "k-cat-sala" },
    ],
    roles: [
      { id: "kr-dona", name: "Dona da casa", color: "oklch(0.63 0.19 28)" },
      { id: "kr-ajudante", name: "Ajudante", color: "oklch(0.7 0.12 245)" },
      { id: "kr-estrela", name: "Estrelinha", color: "oklch(0.8 0.16 72)" },
      { id: "kr-gamer", name: "Gamer", color: "oklch(0.7 0.13 165)" },
      { id: "kr-visita", name: "Visitante", color: "oklch(0.65 0.03 60)" },
    ],
  },
];

export const WEEK_DAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília" },
  { value: "America/Manaus", label: "Manaus" },
  { value: "America/Boa_Vista", label: "Boa Vista" },
  { value: "America/Fortaleza", label: "Fortaleza" },
  { value: "America/Noronha", label: "Fernando de Noronha" },
  { value: "UTC", label: "UTC" },
];

export const GIVEAWAY_DURATIONS: { value: MinakoConfig["giveaways"]["duration"]; label: string }[] = [
  { value: "1h", label: "1 hora" },
  { value: "6h", label: "6 horas" },
  { value: "12h", label: "12 horas" },
  { value: "24h", label: "1 dia" },
  { value: "3d", label: "3 dias" },
  { value: "7d", label: "7 dias" },
  { value: "custom", label: "Personalizada" },
];

export function channelsByCategory(guild: DemoGuild): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const ch of guild.channels) {
    if (ch.parent) (map[ch.parent] ??= []).push(ch.id);
  }
  return map;
}
