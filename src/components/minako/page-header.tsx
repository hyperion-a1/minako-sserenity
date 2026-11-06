import { ChevronsDownUp, ChevronsUpDown, Focus } from "lucide-react";
import type { ReactNode } from "react";

import { focusOnly, revealSection, sectionKey, setAll, setFocusMode, slugify, useCollapsed, useFocusMode } from "@/lib/minako/sections";
import { cn } from "@/lib/utils";

import type { NavItem } from "./modules";
import { playSound } from "./use-sound";

export function PageHeader({
  item,
  title,
  subtitle,
  aside,
}: {
  item: NavItem;
  title?: string | undefined;
  subtitle?: ReactNode | undefined;
  aside?: ReactNode | undefined;
}) {
  const Icon = item.icon;
  return (
    <div className="mb-5 sm:mb-8">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <span
          className={cn(
            "grid h-12 w-12 shrink-0 animate-pop-in place-items-center rounded-2xl border-2 border-card shadow-squish sm:h-16 sm:w-16 sm:rounded-3xl",
            item.tone,
          )}
        >
          <Icon className="h-6 w-6 animate-bob sm:h-8 sm:w-8" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-deep sm:text-xs">
            Configurações do servidor
          </p>
          <h1 className="text-2xl font-bold leading-tight sm:text-4xl">{title ?? item.label}</h1>
        </div>
        {aside}
      </div>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      {item.sections.length > 1 && <SectionTools item={item} />}
    </div>
  );
}

function SectionChip({ item, title }: { item: NavItem; title: string }) {
  const slug = slugify(title);
  const collapsed = useCollapsed(sectionKey(item.to, slug));
  return (
    <button
      type="button"
      onClick={() => {
        playSound("tick");
        revealSection(item.to, slug);
      }}
      className={cn(
        "shrink-0 rounded-full border-2 px-3 py-1.5 font-display text-sm font-semibold transition-colors",
        collapsed ? "border-dashed border-border bg-transparent text-muted-foreground" : "border-border bg-card text-foreground",
      )}
    >
      {title}
    </button>
  );
}

/** Atalhos para pular, focar ou recolher as seções da página. */
function SectionTools({ item }: { item: NavItem }) {
  const slugs = item.sections.map(slugify);
  const btn =
    "flex shrink-0 items-center gap-1.5 rounded-full border-2 border-border bg-secondary px-3 py-1.5 font-display text-sm font-semibold text-secondary-foreground";
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Ir para a seção:</p>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {item.sections.map((s) => (
          <SectionChip key={s} item={item} title={s} />
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <button type="button" className={btn} onClick={() => { playSound("off"); setAll(item.to, slugs, true); }}>
          <ChevronsDownUp className="h-4 w-4" /> Recolher tudo
        </button>
        <button type="button" className={btn} onClick={() => { playSound("on"); setAll(item.to, slugs, false); }}>
          <ChevronsUpDown className="h-4 w-4" /> Abrir tudo
        </button>
        <FocusButton item={item} slugs={slugs} />
      </div>
    </div>
  );
}

function FocusButton({ item, slugs }: { item: NavItem; slugs: string[] }) {
  const on = useFocusMode();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      title="Com o modo foco, abrir uma seção fecha as outras sozinhas"
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 font-display text-sm font-semibold transition-all active:scale-95",
        on
          ? "border-primary-deep/50 bg-primary text-primary-foreground shadow-[var(--shadow-squish-primary)]"
          : "border-dashed border-border bg-transparent text-muted-foreground",
      )}
      onClick={() => {
        const next = !on;
        setFocusMode(next);
        playSound(next ? "on" : "off");
        if (!next) return;
        // escolhe a seção mais próxima do topo da tela
        let best = slugs[0]!;
        let bestDist = Infinity;
        for (const s of slugs) {
          const el = document.getElementById(`secao-${s}`);
          if (!el) continue;
          const d = Math.abs(el.getBoundingClientRect().top - 120);
          if (d < bestDist) {
            bestDist = d;
            best = s;
          }
        }
        focusOnly(item.to, slugs, best);
      }}
    >
      <Focus className="h-4 w-4" /> Modo foco: {on ? "ligado" : "desligado"}
    </button>
  );
}
