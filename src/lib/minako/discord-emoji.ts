export function discordEmojiUrl(id: string, animated = false): string | null {
  if (!/^\d{17,20}$/.test(id)) return null;
  return `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "webp"}?size=48&quality=lossless`;
}

type Node = { type: string; value?: string; children?: Node[]; url?: string; alt?: string };

/** Only text nodes are replaced; code blocks and inline code keep their literal contents. */
export function remarkDiscordEmoji() {
  return (tree: Node) => {
    const walk = (node: Node) => {
      if (!node.children) return;
      node.children = node.children.flatMap((child): Node[] => {
        if (child.type !== "text" || !child.value) {
          walk(child);
          return [child];
        }
        const nodes: Node[] = [];
        let last = 0;
        for (const match of child.value.matchAll(/<(a?):([A-Za-z0-9_]+):(\d{17,20})>/g)) {
          const index = match.index ?? 0;
          const url = discordEmojiUrl(match[3] ?? "", match[1] === "a");
          if (!url) continue;
          if (index > last) nodes.push({ type: "text", value: child.value.slice(last, index) });
          nodes.push({ type: "image", url, alt: `:${match[2]}:` });
          last = index + match[0].length;
        }
        if (!nodes.length) return [child];
        if (last < child.value.length) nodes.push({ type: "text", value: child.value.slice(last) });
        return nodes;
      });
    };
    walk(tree);
  };
}