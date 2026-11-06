import { useNavigate } from "@tanstack/react-router";
import { Heart, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useDashboard } from "@/lib/minako/store";

import { burstFrom } from "./effects";
import { NAV_ITEMS } from "./modules";
import { playSound } from "./use-sound";

export function SaveBar() {
  const { dirty, save, discard, issues, mode } = useDashboard();
  const navigate = useNavigate();
  const saveRef = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);

  if (!dirty) return null;

  const onSave = async () => {
    setSaving(true);
    const result = await save();
    setSaving(false);
    if (result.ok) {
      playSound("success");
      burstFrom(saveRef.current, 22);
      toast.success("Prontinho! Tudo salvo com carinho ✨", {
        description:
          mode === "live"
            ? "A Minako já recebeu as novas configurações."
            : "Modo demonstração: guardado só neste navegador.",
      });
    } else if ("error" in result) {
      playSound("error");
      toast.error("Não consegui salvar 🥺", { description: result.error });
    } else {
      playSound("error");
      const first = result.issues[0]!;
      const item = NAV_ITEMS.find((n) => n.id === first.module);
      toast.error("Opa, tem uma coisinha para ajustar 🥺", {
        description: `${item?.label ?? "Configuração"}: ${first.message}`,
      });
      if (item) navigate({ to: item.to });
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-[5.25rem] z-40 sm:inset-x-auto lg:bottom-3 sm:left-1/2 sm:w-[min(36rem,calc(100%-2rem))] sm:-translate-x-1/2 lg:left-[calc(50%+150px)]">
      <div className="mr-[4.25rem] flex animate-pop-in items-center gap-2 rounded-full border-2 border-primary-deep bg-card p-2 pl-4 shadow-glow sm:mr-0">
        <span className="hidden animate-heartbeat text-xl sm:inline">💌</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold">Alterações em rascunho</p>
          <p className="truncate text-xs text-muted-foreground">
            {issues.length ? `${issues.length} ajuste(s) pendente(s)` : "Salve para a Minako guardar"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Descartar alterações"
          onClick={() => {
            playSound("off");
            discard();
            toast("Rascunho descartado. Tudo como antes! 🍃");
          }}
        >
          <RotateCcw />
        </Button>
        <Button ref={saveRef} onClick={onSave} disabled={saving} className="px-4 sm:px-5">
          <Heart className="fill-current" /> {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
