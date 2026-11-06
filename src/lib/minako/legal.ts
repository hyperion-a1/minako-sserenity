// Converte os textos dos Termos de Uso / Política de Privacidade em uma estrutura legível.

export type LegalBlock =
  | { type: "p"; label?: string | undefined; text: string }
  | { type: "list"; label?: string | undefined; intro: string; items: string[] }
  | { type: "callout"; text: string };

export interface LegalSection {
  id: string;
  number: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  title: string;
  meta: { label: string; value: string }[];
  intro: LegalBlock[];
  sections: LegalSection[];
  closing?: string | undefined;
}

const META_LABELS = [
  "Versão",
  "Data de elaboração",
  "Responsável pelo serviço",
  "Controlador",
  "Contato de privacidade",
  "Contato",
  "Servidor de suporte e comunidade",
];

const HEADING_RE = /^(\d+)\.\s+(.+)$/;
const ITEM_RE = /^(\d+\.\d+(?:\.\d+)?\.)\s+([\s\S]+)$/;

function isUpper(text: string) {
  return text === text.toLocaleUpperCase("pt-BR") && /[A-ZÀ-Ú]/.test(text);
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseMeta(text: string) {
  const pattern = new RegExp(`(${META_LABELS.join("|")}):\\s*`, "g");
  const parts = text.split(pattern).filter((p) => p !== "");
  const meta: { label: string; value: string }[] = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    const label = parts[i] ?? "";
    if (META_LABELS.includes(label)) meta.push({ label, value: (parts[i + 1] ?? "").trim() });
  }
  return meta;
}

function parseBlock(text: string): LegalBlock {
  if (/^IMPORTANTE\s/.test(text)) return { type: "callout", text: text.replace(/^IMPORTANTE\s+/, "") };
  let label: string | undefined;
  let body = text;
  const item = text.match(ITEM_RE);
  if (item) {
    label = item[1];
    body = item[2] ?? text;
  }
  const listStart = body.indexOf(": - ");
  if (listStart !== -1) {
    const intro = body.slice(0, listStart + 1);
    const items = body
      .slice(listStart + 4)
      .split(/\s+-\s+/)
      .map((s) => s.trim().replace(/[;.]$/, ""))
      .filter(Boolean);
    return { type: "list", label, intro, items };
  }
  return { type: "p", label, text: body };
}

export function parseLegal(raw: string): LegalDoc {
  const paragraphs = raw
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.split("\n").map((l) => l.trim()).join(" ").replace(/\s{2,}/g, " ").trim())
    .filter(Boolean);

  const title = paragraphs.shift() ?? "";
  const doc: LegalDoc = { title, meta: [], intro: [], sections: [] };
  if (paragraphs[0]?.startsWith("Versão:")) doc.meta = parseMeta(paragraphs.shift()!);

  let current: LegalSection | null = null;
  for (const p of paragraphs) {
    const heading = p.match(HEADING_RE);
    const hNum = heading?.[1] ?? "";
    const hTitle = heading?.[2] ?? "";
    if (heading && isUpper(hTitle) && hTitle.length < 140 && !ITEM_RE.test(p)) {
      const section: LegalSection = {
        id: slugify(`${hNum}-${hTitle}`),
        number: hNum,
        title: hTitle.trim(),
        blocks: [],
      };
      current = section;
      doc.sections.push(section);
      continue;
    }
    if (/^FIM D[AEO]S?\b/.test(p) && isUpper(p)) {
      doc.closing = p;
      continue;
    }
    const block = parseBlock(p);
    if (current) current.blocks.push(block);
    else doc.intro.push(block);
  }
  return doc;
}

/** Título com capitalização amigável a partir de um título em CAIXA ALTA. */
export function prettyTitle(text: string) {
  const small = new Set(["e", "de", "da", "do", "das", "dos", "a", "o", "em", "por", "para", "com", "ao", "aos"]);
  return text
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toLocaleUpperCase("pt-BR") + w.slice(1)))
    .join(" ");
}
