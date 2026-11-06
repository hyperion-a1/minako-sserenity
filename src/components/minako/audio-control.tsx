import { Music, Music2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { playSound, useAudioSettings } from "./use-sound";

export function AudioControl({ className }: { className?: string }) {
  const [s, update] = useAudioSettings();
  const [open, setOpen] = useState(false);
  const Icon = s.music ? Music2 : s.effects ? Volume2 : VolumeX;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Sons e música"
          onClick={() => playSound("pop")}
          className={cn(
            "relative grid h-14 w-14 place-items-center rounded-full border-2 border-primary-deep bg-primary text-primary-foreground shadow-[var(--shadow-squish-primary)] transition-transform duration-200 hover:-translate-y-1 active:translate-y-1 active:shadow-none",
            className,
          )}
        >
          <Icon className={cn("h-6 w-6", s.music && "animate-bob")} />
          {s.music && (
            <span className="absolute -right-1 -top-1 grid h-5 w-5 animate-heartbeat place-items-center rounded-full bg-ribbon text-[10px] text-ribbon-foreground">
              ♪
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-72 rounded-3xl border-2 p-5">
        <p className="font-display text-base font-semibold">Sons da Minako 🎶</p>
        <p className="mb-4 text-xs text-muted-foreground">Tudo é tocado aqui mesmo, sem baixar nada.</p>

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Volume2 className="h-4 w-4" /> Efeitos fofinhos
              </span>
              <Switch
                checked={s.effects}
                onCheckedChange={(v) => {
                  update({ effects: v });
                  if (v) playSound("on");
                }}
                aria-label="Efeitos sonoros"
              />
            </div>
            <Slider
              value={[Math.round(s.effectsVolume * 100)]}
              max={100}
              step={5}
              disabled={!s.effects}
              aria-label="Volume dos efeitos"
              onValueChange={([v]) => update({ effectsVolume: (v ?? 0) / 100 })}
              onValueCommit={() => playSound("pop")}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Music className="h-4 w-4" /> Caixinha de música
              </span>
              <Switch
                checked={s.music}
                onCheckedChange={(v) => update({ music: v })}
                aria-label="Música ambiente"
              />
            </div>
            <Slider
              value={[Math.round(s.musicVolume * 100)]}
              max={100}
              step={5}
              disabled={!s.music}
              aria-label="Volume da música"
              onValueChange={([v]) => update({ musicVolume: (v ?? 0) / 100 })}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
