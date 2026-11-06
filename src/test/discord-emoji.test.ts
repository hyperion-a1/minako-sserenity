import { expect, it } from "vitest";
import { discordEmojiUrl, remarkDiscordEmoji } from "@/lib/minako/discord-emoji";

it("emojis estáticos e animados usam o formato correto do Discord", () => {
  expect(discordEmojiUrl("123456789012345678")).toBe("https://cdn.discordapp.com/emojis/123456789012345678.webp?size=48&quality=lossless");
  expect(discordEmojiUrl("123456789012345678", true)).toBe("https://cdn.discordapp.com/emojis/123456789012345678.gif?size=48&quality=lossless");
  expect(discordEmojiUrl("bad/path")).toBeNull();
});

it("substitui emojis em texto sem alterar código", () => {
  const tree = { type: "root", children: [{ type: "text", value: "Prêmio <:premio:123456789012345678>!" }, { type: "inlineCode", value: "<:premio:123456789012345678>" }] };
  remarkDiscordEmoji()(tree);
  expect(tree.children).toEqual([{ type: "text", value: "Prêmio " }, { type: "image", url: discordEmojiUrl("123456789012345678"), alt: ":premio:" }, { type: "text", value: "!" }, { type: "inlineCode", value: "<:premio:123456789012345678>" }]);
});