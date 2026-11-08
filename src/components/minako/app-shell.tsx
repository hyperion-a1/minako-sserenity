import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, ScrollText, ShieldCheck, LifeBuoy, LogIn, LogOut } from "lucide-react";
import { useState, type ReactNode } from "react";

import mascot from "@/assets/minako-mascot.webp";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDashboard } from "@/lib/minako/store";
import { cn } from "@/lib/utils";

import { AudioControl } from "./audio-control";
import { BurstLayer, FloatingSky } from "./effects";
import { NAV_ITEMS, SUPPORT_URL } from "./modules";
import { BottomTabs, GroupedNav, SearchButton, SearchProvider } from "./navigator";
import { MascotReaction } from "./mascot-reaction";
import { SaveBar } from "./save-bar";
import { ScrollProgress } from "./scroll-progress";
import { playSound } from "./use-sound";

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to="/painel" className="group flex items-center gap-3" onClick={() => playSound("giggle")}>
      <span className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border-2 border-primary-deep bg-sunrise shadow-[var(--shadow-squish-primary)] transition-transform group-hover:-rotate-6">
        <img src={mascot} alt="" width={48} height={48} className="h-14 w-14 translate-y-2 object-cover object-top" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-xl font-bold">Minako</span>
        {!compact && <span className="text-xs font-semibold text-muted-foreground">painel aconchegante</span>}
      </span>
    </Link>
  );
}

function GuildSwitcher({ compact }: { compact?: boolean }) {
  const { guild, guilds, selectGuild, dirty } = useDashboard();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={() => playSound("tick")}
          className={cn(
            "flex w-full items-center gap-2 rounded-2xl border-2 border-border bg-card text-left shadow-squish-sm transition-transform hover:-translate-y-0.5",
            compact ? "px-2.5 py-1.5" : "px-3 py-2.5",
          )}
        >
          <span className="text-xl">{guild.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-sm font-semibold">{guild.name}</span>
            {!compact && (
              <span className="block text-xs text-muted-foreground">{guild.members} membros</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 rounded-2xl border-2 p-1.5">
        <DropdownMenuLabel className="font-display">Escolha o servidor</DropdownMenuLabel>
        {guilds.map((g) => (
          <DropdownMenuItem
            key={g.id}
            className="gap-2 rounded-xl py-2"
            onSelect={() => {
              if (g.id === guild.id) return;
              if (dirty && !window.confirm("Você tem alterações não salvas. Trocar mesmo assim?")) return;
              playSound("nav");
              selectGuild(g.id);
            }}
          >
            <span className="text-lg">{g.emoji}</span>
            <span className="font-semibold">{g.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountBox() {
  const { mode, user, loginAvailable, logout } = useDashboard();
  if (mode === "live" && user) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 py-2">
        {user.avatar ? (
          <img src={user.avatar} alt="" width={28} height={28} className="h-7 w-7 rounded-full" />
        ) : (
          <span className="text-lg">🙂</span>
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{user.name}</span>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Sair
        </button>
      </div>
    );
  }
  if (!loginAvailable) return null;
  return (
    <Button asChild className="w-full">
      <a href="/auth/login" target="_top">
        <LogIn /> Entrar com Discord
      </a>
    </Button>
  );
}

function StatusBanner() {
  const { mode, loginAvailable, loading, loadError, guildWarning } = useDashboard();
  const text = loadError
    ? `😿 ${loadError}`
    : guildWarning
      ? `⚠️ ${guildWarning}`
      : loading
        ? "🌙 Buscando as configurações com a Minako…"
        : mode === "demo"
          ? loginAvailable
            ? "🧸 Modo demonstração: entre com o Discord para mexer nos seus servidores de verdade."
            : "🧸 Modo demonstração: as mudanças ficam só neste navegador."
          : null;
  if (!text) return null;
  return (
    <p className="mb-5 rounded-2xl border-2 border-dashed border-border-strong/60 bg-card px-4 py-3 text-sm font-semibold text-muted-foreground">
      {text}
    </p>
  );
}


function LegalLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Link
        to="/termos"
        onClick={() => {
          playSound("pop");
          onNavigate?.();
        }}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ScrollText className="h-4 w-4" /> Termos de Uso
      </Link>
      <Link
        to="/privacidade"
        onClick={() => {
          playSound("pop");
          onNavigate?.();
        }}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ShieldCheck className="h-4 w-4" /> Política de Privacidade
      </Link>
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LifeBuoy className="h-4 w-4" /> Servidor de suporte
      </a>
    </div>
  );
}


export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLegal = pathname === "/termos" || pathname === "/privacidade";

  return (
    <SearchProvider>
    <div className="min-h-screen">
      <FloatingSky />
      <BurstLayer />
      <ScrollProgress />

      {/* Barra lateral (computador) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[300px] flex-col gap-5 overflow-y-auto border-r-2 border-border bg-sidebar/85 p-5 backdrop-blur lg:flex">
        <Brand />
        <GuildSwitcher />
        <AccountBox />
        <SearchButton />
        <GroupedNav />
        <div className="mt-auto rounded-3xl border-2 border-dashed border-border-strong/60 p-2">
          <LegalLinks />
        </div>
      </aside>

      {/* Topo (celular) */}
      <header className="sticky top-0 z-30 border-b-2 border-border bg-background/85 px-4 py-2.5 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <Brand compact />
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <div className="min-w-0 max-w-[10rem]">
              <GuildSwitcher compact />
            </div>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menu"
                  onClick={() => playSound("pop")}
                  className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-border bg-card shadow-squish-sm active:translate-y-0.5"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86%] max-w-sm overflow-y-auto border-r-2 bg-background p-5">
                <SheetTitle className="sr-only">Menu da Minako</SheetTitle>
                <div className="space-y-5">
                  <Brand />
                  <GuildSwitcher />
                  <AccountBox />
                  <GroupedNav onNavigate={() => setMenuOpen(false)} />
                  <div className="rounded-3xl border-2 border-dashed border-border-strong/60 p-2">
                    <LegalLinks onNavigate={() => setMenuOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="lg:pl-[300px]">
        <main key={pathname} className="mx-auto w-full max-w-5xl animate-rise px-4 pb-40 pt-5 sm:px-6 lg:px-10 lg:pt-10">
          {!isLegal && <StatusBanner />}
          {children}
        </main>

        <footer className="mx-auto max-w-5xl px-4 pb-28 sm:px-6 lg:px-10">
          <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border-strong/60 px-5 py-5 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
            <p>
              Feito com <span className="inline-block animate-heartbeat">🧡</span> para comunidades
              aconchegantes.
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-semibold">
              <Link to="/termos" className="hover:text-foreground hover:underline">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="hover:text-foreground hover:underline">
                Política de Privacidade
              </Link>
              <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="hover:text-foreground hover:underline">
                Suporte
              </a>
            </div>
          </div>
        </footer>
      </div>

      <div className="fixed bottom-[5.25rem] right-3 z-50 lg:bottom-5 lg:right-5">
        <AudioControl />
      </div>
      <MascotReaction />
      <SaveBar />
      <BottomTabs onMenu={() => setMenuOpen(true)} />
    </div>
    </SearchProvider>
  );
}
