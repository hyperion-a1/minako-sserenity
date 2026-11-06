import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { History, House, LayoutGrid, Menu, Search } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getRecent, pushRecent, revealSection, slugify } from "@/lib/minako/sections";
import { cn } from "@/lib/utils";

import { CATEGORIES, NAV_ITEMS, type NavItem } from "./modules";
import { playSound } from "./use-sound";

const SearchCtx = createContext<{ open: () => void }>({ open: () => {} });
export const useSearch = () => useContext(SearchCtx);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (NAV_ITEMS.some((n) => n.to === pathname)) pushRecent(pathname);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("input, textarea, [contenteditable=true]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setRecent(getRecent());
  }, [open]);

  const go = (item: NavItem, section?: string) => {
    setOpen(false);
    playSound("nav");
    if (section) revealSection(item.to, slugify(section));
    if (pathname !== item.to) void navigate({ to: item.to });
    else if (!section) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const recentItems = recent
    .map((p) => NAV_ITEMS.find((n) => n.to === p))
    .filter((n): n is NavItem => !!n && n.to !== pathname);

  return (
    <SearchCtx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} filter={searchFilter}>
        <CommandInput placeholder="O que você quer ajustar? (ex.: sorteio, noite, cargo)" className="text-base" />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>Não achei nada com esse nome 🥺 Tente outra palavra.</CommandEmpty>
          {recentItems.length > 0 && (
            <CommandGroup heading="Visitados há pouco">
              {recentItems.map((n) => (
                <CommandItem key={`r-${n.id}`} value={`recente ${n.label}`} onSelect={() => go(n)} className="gap-3 py-2.5">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{n.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {CATEGORIES.map((c) => (
            <CommandGroup key={c.id} heading={`${c.emoji} ${c.label}`}>
              {NAV_ITEMS.filter((n) => n.category === c.id).flatMap((n) => {
                const Icon = n.icon;
                return [
                  <CommandItem
                    key={n.id}
                    value={`${n.label} ${n.description} ${n.keywords}`}
                    onSelect={() => go(n)}
                    className="gap-3 py-2.5"
                  >
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", n.tone)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display font-semibold">{n.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{n.description}</span>
                    </span>
                  </CommandItem>,
                  ...n.sections.map((s) => (
                    <CommandItem
                      key={`${n.id}-${s}`}
                      value={`${n.label} ${s} ${n.keywords} seção`}
                      onSelect={() => go(n, s)}
                      className="gap-3 py-2 pl-6"
                    >
                      <span className="text-muted-foreground">↳</span>
                      <span className="text-sm">
                        {s} <span className="text-xs text-muted-foreground">· {n.short}</span>
                      </span>
                    </CommandItem>
                  )),
                ];
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </SearchCtx.Provider>
  );
}

const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** Todas as palavras digitadas precisam aparecer (sem ligar para acentos). */
function searchFilter(value: string, search: string) {
  const v = norm(value);
  const words = norm(search).split(/\s+/).filter(Boolean);
  if (!words.every((w) => v.includes(w))) return 0;
  return words.some((w) => v.startsWith(w)) ? 1 : 0.5;
}

export function SearchButton({ className }: { className?: string }) {
  const { open } = useSearch();
  return (
    <button
      type="button"
      onClick={() => {
        playSound("pop");
        open();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 py-2.5 text-left text-sm font-semibold text-muted-foreground shadow-squish-sm transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <Search className="h-4 w-4" />
      <span className="flex-1">Buscar recurso…</span>
      <kbd className="rounded-md border border-border bg-muted px-1.5 text-[11px]">Ctrl K</kbd>
    </button>
  );
}

/** Lista de recursos agrupada por categoria. */
export function GroupedNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Módulos da Minako" className="space-y-4">
      {CATEGORIES.map((c) => (
        <div key={c.id}>
          {c.id !== "inicio" && (
            <p className="mb-1 px-2 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {c.emoji} {c.label}
            </p>
          )}
          <div className="space-y-1">
            {NAV_ITEMS.filter((n) => n.category === c.id).map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={() => {
                    if (!active) playSound("nav");
                    onNavigate?.();
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-12 items-center gap-3 rounded-2xl border-2 px-2.5 py-2 transition-all duration-200",
                    active
                      ? "border-primary-deep/40 bg-secondary shadow-squish-sm"
                      : "border-transparent hover:translate-x-1 hover:bg-secondary/60",
                  )}
                >
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-transform group-hover:rotate-6", item.tone)}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[15px] font-semibold">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/** Barra inferior fixa no celular. */
export function BottomTabs({ onMenu }: { onMenu: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { open } = useSearch();
  const [gridOpen, setGridOpen] = useState(false);
  const current = NAV_ITEMS.find((n) => n.to === pathname);
  const onModule = !!current && current.id !== "overview";

  const tab = "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] py-1.5 font-display text-[11px] font-semibold transition-all duration-300 active:scale-90 [&>svg]:transition-transform [&.bg-secondary>svg]:-translate-y-0.5 [&.bg-secondary>svg]:text-primary-deep [&.bg-secondary]:shadow-squish-sm";
  return (
    <>
      <nav
        aria-label="Navegação rápida"
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-md gap-1">
          <Link to="/" onClick={() => playSound("nav")} className={cn(tab, pathname === "/" ? "bg-secondary text-foreground" : "text-muted-foreground")}>
            <House className="h-5 w-5" /> Início
          </Link>
          <button type="button" onClick={() => { playSound("pop"); setGridOpen(true); }} className={cn(tab, onModule ? "bg-secondary text-foreground" : "text-muted-foreground")}>
            <LayoutGrid className="h-5 w-5" /> {onModule ? current.short : "Recursos"}
          </button>
          <button type="button" onClick={() => { playSound("pop"); open(); }} className={cn(tab, "text-muted-foreground")}>
            <Search className="h-5 w-5" /> Buscar
          </button>
          <button type="button" onClick={() => { playSound("pop"); onMenu(); }} className={cn(tab, "text-muted-foreground")}>
            <Menu className="h-5 w-5" /> Mais
          </button>
        </div>
      </nav>

      <Sheet open={gridOpen} onOpenChange={setGridOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[2rem] border-t-2 bg-background p-5 pb-8">
          <SheetTitle className="mb-4 font-display text-xl">Para onde vamos? ✨</SheetTitle>
          <div className="space-y-5">
            {CATEGORIES.filter((c) => c.id !== "inicio").map((c) => (
              <div key={c.id}>
                <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {c.emoji} {c.label}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {NAV_ITEMS.filter((n) => n.category === c.id).map((n) => {
                    const Icon = n.icon;
                    const active = n.to === pathname;
                    return (
                      <Link
                        key={n.id}
                        to={n.to}
                        onClick={() => { playSound("nav"); setGridOpen(false); }}
                        className={cn(
                          "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-2 text-center",
                          active ? "border-primary-deep bg-secondary" : "border-border bg-card",
                        )}
                      >
                        <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", n.tone)}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="font-display text-sm font-semibold leading-tight">{n.short}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
