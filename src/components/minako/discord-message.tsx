import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkDiscordEmoji } from "@/lib/minako/discord-emoji";

function EmojiImage({ src, alt }: { src?: string | undefined; alt?: string | undefined }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return <span>{alt}</span>;
  return <img src={src} alt={alt ?? "Emoji"} title={alt} className="inline-block h-6 w-6 align-middle object-contain" loading="lazy" onError={() => setFailed(true)} />;
}

export function DiscordMessage({ text }: { text: string }) {
  return (
    <div className="space-y-2 break-words text-sm [&_p]:whitespace-pre-wrap [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-night [&_pre]:p-2 [&_code]:bg-night [&_a]:text-sky [&_a]:underline">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkDiscordEmoji]} components={{
        img: ({ src, alt }) => src?.startsWith("https://cdn.discordapp.com/emojis/") ? <EmojiImage key={src} src={src} alt={alt} /> : <span>{alt}</span>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
      }}>{text}</ReactMarkdown>
    </div>
  );
}