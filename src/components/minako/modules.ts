import {
  CalendarHeart,
  Clapperboard,
  Crown,
  Gamepad2,
  Gift,
  House,
  MessagesSquare,
  MoonStar,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { ModuleId } from "@/lib/minako/config";

export interface NavItem {
  id: ModuleId | "overview";
  to:
    | "/"
    | "/semana"
    | "/canais"
    | "/noturno"
    | "/personalidade"
    | "/cargos"
    | "/matchmaking"
    | "/sorteios"
    | "/tiktok";
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  /** classes do "bolinho" colorido do ícone */
  tone: string;
  category: CategoryId;
  /** títulos das seções da página (para busca e modo foco) */
  sections: string[];
  /** palavras extras para a busca */
  keywords: string;
}

export type CategoryId = "inicio" | "basico" | "comunidade" | "clima";

export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: "inicio", label: "Início", emoji: "🏠" },
  { id: "basico", label: "Ferramentas básicas", emoji: "🧰" },
  { id: "comunidade", label: "Comunidade e eventos", emoji: "🎉" },
  { id: "clima", label: "Clima e personalidade", emoji: "🌙" },
];

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", to: "/", label: "Visão geral", short: "Início", description: "Resumo de tudo", icon: House, tone: "bg-primary text-primary-foreground" },
  { id: "semana", to: "/semana", label: "Semana e ciclo", short: "Semana", description: "Virada semanal e horário", icon: CalendarHeart, tone: "bg-secondary text-secondary-foreground" },
  { id: "canais", to: "/canais", label: "Canais gerais", short: "Canais", description: "Moderação e publicações", icon: MessagesSquare, tone: "bg-sky text-sky-foreground" },
  { id: "noturno", to: "/noturno", label: "Modo Noturno", short: "Noturno", description: "Horários e canais que descansam", icon: MoonStar, tone: "bg-night text-night-foreground" },
  { id: "personalidade", to: "/personalidade", label: "Personalidade sazonal", short: "Sazonal", description: "Falas de Halloween, Natal e Ano Novo", icon: Sparkles, tone: "bg-accent text-accent-foreground" },
  { id: "cargos", to: "/cargos", label: "Cargos e permissões", short: "Cargos", description: "Estrela da Semana e equipe", icon: Crown, tone: "bg-primary text-primary-foreground" },
  { id: "matchmaking", to: "/matchmaking", label: "Matchmaking", short: "Partidas", description: "Central, grupos e prazos", icon: Gamepad2, tone: "bg-mint text-mint-foreground" },
  { id: "sorteios", to: "/sorteios", label: "Sorteios", short: "Sorteios", description: "Regras e anúncio dos sorteios", icon: Gift, tone: "bg-ribbon text-ribbon-foreground" },
  { id: "tiktok", to: "/tiktok", label: "Avisos do TikTok", short: "TikTok", description: "Vídeos e lives dos criadores", icon: Clapperboard, tone: "bg-sky text-sky-foreground" },
];

export const MINAKO_PHRASES = [
  "Oiê! Tudo em seu lugar, sem transformar o painel numa caça ao tesouro. ✨",
  "Eu guardo tudo em rascunho até você apertar Salvar. Promessa de estrela! ⭐",
  "Hoje é um ótimo dia para organizar o servidor… e tomar um chocolate quente. ☕",
  "Psiu… o Modo Noturno ajuda todo mundo a dormir cedo. Ou quase todo mundo. 🌙",
  "Se precisar de mim, é só cutucar! Com carinho, tá? 🧡",
  "Sorteio bom é sorteio com regras claras. E muito confete! 🎉",
  "Quem organiza o servidor ganha um biscoitinho imaginário. 🍪",
];

export const SUPPORT_URL = "https://discord.gg/sserenity-hok";
export const CONTACT_EMAIL = "hyperion.vermilyon@gmail.com";
