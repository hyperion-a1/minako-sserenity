import { useEffect, useRef, useState } from "react";

/** Barrinha lateral fofa que mostra o quanto da página já foi rolado e some sozinha. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 8) return;
      setProgress(Math.min(1, Math.max(0, window.scrollY / max)));
      setVisible(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setVisible(false), 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed right-1 top-1/2 z-50 h-[38vh] w-1.5 -translate-y-1/2 rounded-full bg-border/70 transition-all duration-500 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0"
      }`}
    >
      <div
        className="absolute inset-x-0 top-0 rounded-full bg-sunrise transition-[height] duration-150 ease-out"
        style={{ height: `${progress * 100}%` }}
      />
      <span
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] leading-none drop-shadow transition-[top] duration-150 ease-out"
        style={{ top: `${progress * 100}%` }}
      >
        🧡
      </span>
    </div>
  );
}
