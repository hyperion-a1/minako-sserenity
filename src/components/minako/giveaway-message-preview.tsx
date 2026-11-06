import { ImageOff } from "lucide-react";
import { useState } from "react";
import type { GiveawayBlock } from "@/lib/minako/giveaway-message";
import { isValidMediaUrl } from "@/lib/minako/validation";
import { cn } from "@/lib/utils";
import { DiscordMessage } from "./discord-message";

function Media({ url, thumbnail = false }: { url: string; thumbnail?: boolean }) {
  const [failed, setFailed] = useState(false);
  const className = thumbnail ? "h-20 w-20 shrink-0 rounded-md object-cover" : "aspect-video w-full rounded-md object-contain bg-night";
  if (!isValidMediaUrl(url) || failed) return <span className={cn(className, "grid place-items-center bg-night-soft")} aria-label="Mídia indisponível"><ImageOff className="h-6 w-6" /></span>;
  if (!thumbnail && /\.(mp4|webm|mov)(?:[?#]|$)/i.test(url)) return <video src={url} controls preload="metadata" className={className} aria-label="Vídeo do sorteio" onError={() => setFailed(true)} />;
  return <img src={url} alt={thumbnail ? "Miniatura da seção" : "Mídia do sorteio"} className={className} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

export function GiveawayMessagePreview({ blocks, resolve }: { blocks: GiveawayBlock[]; resolve: (text: string) => string }) {
  return <div className="space-y-3">{blocks.map((b, index) => {
    switch (b.type) {
      case "text": return <DiscordMessage key={index} text={resolve(b.content)} />;
      case "section": return <div key={index} className="flex items-start gap-3"><div className="min-w-0 flex-1"><DiscordMessage text={resolve(b.content)} /></div><Media key={b.thumbnail} url={b.thumbnail} thumbnail /></div>;
      case "gallery": return <div key={index} className={cn("grid gap-1.5", b.urls.length > 1 && "grid-cols-2")}>{b.urls.map((url, n) => <Media key={`${n}-${url}`} url={url} />)}</div>;
      case "separator": return <div key={index} className={b.spacing === "large" ? "py-3" : "py-1"}>{b.divider && <hr className="border-night-foreground/20" />}</div>;
    }
  })}</div>;
}