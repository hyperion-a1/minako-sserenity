import { Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";

/* ---------- Céu de brilhinhos flutuando ao fundo ---------- */

// Posições fixas (sem aleatório) para não haver diferença entre servidor e navegador.
const FLOATIES = [
  { left: "6%", top: "14%", size: 18, delay: "0s", kind: "star" },
  { left: "88%", top: "10%", size: 14, delay: "1.2s", kind: "heart" },
  { left: "72%", top: "38%", size: 12, delay: "2.1s", kind: "star" },
  { left: "14%", top: "62%", size: 16, delay: "0.6s", kind: "heart" },
  { left: "94%", top: "70%", size: 18, delay: "1.8s", kind: "star" },
  { left: "42%", top: "86%", size: 12, delay: "2.6s", kind: "heart" },
  { left: "30%", top: "24%", size: 10, delay: "3.1s", kind: "dot" },
  { left: "58%", top: "8%", size: 8, delay: "1.5s", kind: "dot" },
  { left: "82%", top: "88%", size: 10, delay: "0.3s", kind: "dot" },
  { left: "4%", top: "92%", size: 9, delay: "2.3s", kind: "dot" },
] as const;

export function FloatingSky() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {FLOATIES.map((f, i) => (
        <span
          key={i}
          className={i % 2 ? "absolute animate-float" : "absolute animate-twinkle"}
          style={{ left: f.left, top: f.top, animationDelay: f.delay }}
        >
          {f.kind === "star" && (
            <Star className="fill-primary/70 text-primary/70" style={{ width: f.size, height: f.size }} />
          )}
          {f.kind === "heart" && (
            <Heart className="fill-ribbon/40 text-ribbon/40" style={{ width: f.size, height: f.size }} />
          )}
          {f.kind === "dot" && (
            <span className="block rounded-full bg-primary/50" style={{ width: f.size, height: f.size }} />
          )}
        </span>
      ))}
    </div>
  );
}

/* ---------- Explosão de corações e estrelas ---------- */

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  kind: "heart" | "star";
  hue: "ribbon" | "primary" | "accent";
  size: number;
}

let counter = 0;

/** Dispara uma explosãozinha fofa a partir de um ponto da tela (ou do centro). */
export function burst(origin?: { x: number; y: number }, amount = 16) {
  if (typeof window === "undefined") return;
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const particles: Particle[] = Array.from({ length: amount }, (_, i) => {
    const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.5;
    const dist = 60 + Math.random() * 90;
    return {
      id: ++counter,
      x,
      y,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 30,
      rot: (Math.random() - 0.5) * 140,
      kind: Math.random() > 0.45 ? "heart" : "star",
      hue: (["ribbon", "primary", "accent"] as const)[i % 3] ?? "primary",
      size: 12 + Math.random() * 12,
    };
  });
  window.dispatchEvent(new CustomEvent("minako:burst", { detail: particles }));
}

export function burstFrom(el: Element | null, amount?: number) {
  if (!el) return burst(undefined, amount);
  const r = el.getBoundingClientRect();
  burst({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, amount);
}

const HUE_CLASS = {
  ribbon: "fill-ribbon text-ribbon",
  primary: "fill-primary text-primary-deep",
  accent: "fill-accent text-accent-foreground",
};

export function BurstLayer() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const onBurst = (e: Event) => {
      const list = (e as CustomEvent<Particle[]>).detail;
      setParticles((p) => [...p, ...list]);
      const ids = new Set(list.map((p) => p.id));
      setTimeout(() => setParticles((p) => p.filter((x) => !ids.has(x.id))), 1200);
    };
    window.addEventListener("minako:burst", onBurst);
    return () => window.removeEventListener("minako:burst", onBurst);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      {particles.map((p) => {
        const Icon = p.kind === "heart" ? Heart : Star;
        return (
          <span
            key={p.id}
            className="absolute animate-burst"
            style={
              {
                left: p.x,
                top: p.y,
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
                "--rot": `${p.rot}deg`,
              } as React.CSSProperties
            }
          >
            <Icon className={HUE_CLASS[p.hue]} style={{ width: p.size, height: p.size }} />
          </span>
        );
      })}
    </div>
  );
}
