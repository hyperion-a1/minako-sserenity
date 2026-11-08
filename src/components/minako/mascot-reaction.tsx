import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import mascot from "@/assets/minako-mascot.webp";
import sleeping from "@/assets/minako-sleeping.webp";
import { useDashboard } from "@/lib/minako/store";
import { cn } from "@/lib/utils";

import { playSound } from "./use-sound";

type Mood = "happy" | "worried" | "busy" | "sleepy" | "curious";

/** Minako pequenininha no canto do painel, reagindo ao que acontece. */
export function MascotReaction() {
  const { loading, loadError, guildWarning, mode, dirty, lastSavedAt } = useDashboard();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [bubble, setBubble] = useState<{ text: string; mood: Mood } | null>(null);
  const [hop, setHop] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const firstSave = useRef(lastSavedAt);

  const say = (text: string, mood: Mood, ms = 4200) => {
    setBubble({ text, mood });
    setHop((h) => h + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setBubble(null), ms);
  };

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (loading) say("Um instantinho, estou buscando tudo… 🌙", "busy", 8000);
  }, [loading]);
  useEffect(() => {
    if (loadError) say("Ai, não consegui falar com o bot. Tenta de novo? 🥺", "worried", 6000);
  }, [loadError]);
  useEffect(() => {
    if (guildWarning) say("Não achei os canais e cargos deste servidor. Dá uma olhada no aviso! 💦", "worried", 6000);
  }, [guildWarning]);
  useEffect(() => {
    if (lastSavedAt && lastSavedAt !== firstSave.current) {
      firstSave.current = lastSavedAt;
      say("Salvei! Em nome do amor, tudo pronto! ✨", "happy");
    }
  }, [lastSavedAt]);
  useEffect(() => {
    if (dirty) say("Ooh, mudanças novas! Não esquece de salvar 💖", "curious", 3500);
  }, [dirty]);
  useEffect(() => {
    if (pathname === "/painel/noturno") say("Hora de descansar os canais… zzz 💤", "sleepy");
  }, [pathname]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (mode === "demo") say("Oi! Isto é uma demonstração, pode mexer à vontade 🧸", "happy", 5000);
    }, 1200);
    return () => clearTimeout(t);
  }, [mode]);

  const mood = bubble?.mood ?? (loading ? "busy" : loadError ? "worried" : "happy");
  const img = mood === "sleepy" ? sleeping : mascot;

  return (
    <div data-hide-typing className={cn("pointer-events-none fixed left-3 z-40 flex items-end gap-2 transition-[bottom] duration-300 lg:left-[316px]", dirty ? "bottom-[10.5rem] lg:bottom-24" : "bottom-[5.25rem] lg:bottom-5")}>
      <button
        type="button"
        aria-label="Falar com a Minako"
        onClick={() => {
          playSound("giggle");
          say(dirty ? "Tem mudança esperando para ser salva! 💖" : "Estou aqui cuidando de tudo! ⭐", "happy", 3000);
        }}
        className="pointer-events-auto grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-primary-deep bg-magic shadow-squish-sm active:translate-y-0.5"
      >
        <img
          key={hop}
          src={img}
          alt=""
          width={56}
          height={56}
          className={cn(
            "h-16 w-16 translate-y-2 object-cover object-top motion-safe:animate-pop-in",
            mood === "worried" && "motion-safe:animate-wiggle",
            mood === "busy" && "motion-safe:animate-bob",
          )}
        />
      </button>
      {bubble && (
        <p
          role="status"
          className="pointer-events-auto mb-2 max-w-[13rem] animate-pop-in rounded-2xl rounded-bl-sm border-2 border-border bg-card px-3 py-2 text-sm font-semibold shadow-squish-sm"
        >
          {bubble.text}
        </p>
      )}
    </div>
  );
}
