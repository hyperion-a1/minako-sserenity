import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LogIn, Sparkles } from "lucide-react";

import mascot from "@/assets/minako-mascot.webp";
import sleeping from "@/assets/minako-sleeping.webp";
import { CATEGORIES, NAV_ITEMS, SUPPORT_URL } from "@/components/minako/modules";
import { playSound } from "@/components/minako/use-sound";
import { useDashboard } from "@/lib/minako/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minako Aino — a bot mágica do seu servidor Discord" },
      { name: "description", content: "Conheça a Minako Aino: Modo Noturno, sorteios, matchmaking, avisos do TikTok e personalidade sazonal para o seu servidor Discord." },
      { property: "og:title", content: "Minako Aino — a bot mágica do seu servidor" },
      { property: "og:description", content: "Uma bot fofa e aconchegante, com painel feito para o celular." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = NAV_ITEMS.filter((n) => n.id !== "overview");

function Landing() {
  const { user, loginAvailable } = useDashboard();
  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-30 border-b-2 border-border bg-background/85 px-4 py-2.5 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border-2 border-primary-deep bg-magic">
            <img src={mascot} alt="" width={44} height={44} className="h-12 w-12 translate-y-1.5 object-cover object-top" />
          </span>
          <span className="font-display text-lg font-bold">Minako Aino</span>
          <Link to="/painel" onClick={() => playSound("nav")} className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-2xl bg-primary px-4 font-display text-sm font-semibold text-primary-foreground shadow-squish-sm active:translate-y-0.5">
            Painel <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        {/* Apresentação */}
        <section className="relative grid items-center gap-6 pt-8 sm:grid-cols-[1.2fr_1fr] sm:pt-14">
          <div className="animate-rise space-y-4 text-center sm:text-left">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-lilac px-3 py-1 text-xs font-bold text-lilac-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Em nome do amor e da comunidade!
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              A bot mágica que cuida do seu servidor 💫
            </h1>
            <p className="text-base text-muted-foreground">
              A Minako fecha canais à noite, organiza sorteios e partidas, avisa vídeos do TikTok e muda de humor nas festas. Tudo ajustável pelo celular.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {user ? (
                <Link to="/painel" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-display font-semibold text-primary-foreground shadow-squish-primary active:translate-y-1">
                  Abrir meu painel <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  {loginAvailable && (
                    <a href="/auth/login" target="_top" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-display font-semibold text-primary-foreground shadow-squish-primary active:translate-y-1">
                      <LogIn className="h-4 w-4" /> Entrar com Discord
                    </a>
                  )}
                  <Link to="/painel" className="inline-flex min-h-12 items-center justify-center rounded-2xl border-2 border-border bg-card px-5 font-display font-semibold shadow-squish-sm active:translate-y-0.5">
                    Ver demonstração
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="relative mx-auto w-56 sm:w-72">
            <span aria-hidden className="absolute inset-4 rounded-full bg-magic blur-2xl" />
            <span aria-hidden className="absolute left-2 top-4 animate-twinkle text-2xl">✨</span>
            <span aria-hidden className="absolute right-4 top-0 animate-twinkle text-xl [animation-delay:1s]">⭐</span>
            <span aria-hidden className="absolute bottom-6 right-0 animate-twinkle text-xl [animation-delay:2s]">💖</span>
            <img src={mascot} alt="Minako Aino acenando" width={288} height={288} className="relative animate-float drop-shadow-xl" />
          </div>
        </section>

        {/* Recursos reais */}
        <section className="mt-14 space-y-6">
          <h2 className="text-center font-display text-2xl font-bold">O que a Minako faz</h2>
          {CATEGORIES.filter((c) => c.id !== "inicio").map((c) => (
            <div key={c.id}>
              <p className="mb-2 font-display text-sm font-semibold text-muted-foreground">{c.emoji} {c.label}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {features.filter((f) => f.category === c.id).map((f) => (
                  <Link key={f.id} to={f.to} onClick={() => playSound("nav")} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-border bg-card px-3 py-2 shadow-squish-sm transition-transform active:translate-y-0.5">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${f.tone}`}><f.icon className="h-5 w-5" /></span>
                    <span className="min-w-0">
                      <span className="block font-display font-semibold">{f.label}</span>
                      <span className="block truncate text-sm text-muted-foreground">{f.description}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Como funciona */}
        <section className="mt-14 grid items-center gap-6 rounded-3xl bg-night-sky p-6 text-night-foreground sm:grid-cols-[auto_1fr]">
          <img src={sleeping} alt="Minako dormindo" width={140} height={140} className="mx-auto w-32 animate-bob" />
          <ol className="space-y-3">
            <li><b className="font-display">1.</b> Entre com a sua conta do Discord.</li>
            <li><b className="font-display">2.</b> Escolha o servidor em que a Minako já está.</li>
            <li><b className="font-display">3.</b> Ajuste os recursos e toque em salvar. A Minako aplica na hora.</li>
          </ol>
        </section>
      </main>

      <footer className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-5 gap-y-2 px-4 pb-10 text-sm font-semibold text-muted-foreground">
        <Link to="/termos" className="hover:text-foreground">Termos de Uso</Link>
        <Link to="/privacidade" className="hover:text-foreground">Política de Privacidade</Link>
        <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">Suporte</a>
      </footer>
    </div>
  );
}
