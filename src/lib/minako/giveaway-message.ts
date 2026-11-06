export type GiveawayBlock =
  | { type: "text"; content: string }
  | { type: "section"; content: string; thumbnail: string }
  | { type: "separator"; divider: boolean; spacing: "small" | "large" }
  | { type: "gallery"; urls: string[] };

export function newGiveawayBlock(type: GiveawayBlock["type"]): GiveawayBlock {
  switch (type) {
    case "text": return { type, content: "" };
    case "section": return { type, content: "", thumbnail: "" };
    case "separator": return { type, divider: true, spacing: "small" };
    case "gallery": return { type, urls: [""] };
  }
}

/** Accept only the bot's four supported block shapes, keeping invalid fields for validation. */
export function readGiveawayBlocks(input: unknown): GiveawayBlock[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((raw): GiveawayBlock[] => {
    if (!raw || typeof raw !== "object") return [];
    const b = raw as Record<string, unknown>;
    const content = typeof b["content"] === "string" ? b["content"] : "";
    switch (b["type"]) {
      case "text": return [{ type: "text", content }];
      case "section": return [{ type: "section", content, thumbnail: typeof b["thumbnail"] === "string" ? b["thumbnail"] : "" }];
      case "separator": return [{ type: "separator", divider: b["divider"] !== false, spacing: b["spacing"] === "large" ? "large" : "small" }];
      case "gallery": return [{ type: "gallery", urls: Array.isArray(b["urls"]) ? b["urls"].filter((v): v is string => typeof v === "string") : [] }];
      default: return [];
    }
  });
}