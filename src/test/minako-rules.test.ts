import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG, cloneConfig } from "@/lib/minako/config";
import { parseLegal } from "@/lib/minako/legal";
import { resolveNightScope, validateConfig, validateGiveawayMessage } from "@/lib/minako/validation";
import type { GiveawayBlock } from "@/lib/minako/giveaway-message";

const fields = (c = cloneConfig(DEFAULT_CONFIG)) => validateConfig(c).map((i) => `${i.module}.${i.field}`);

describe("Regras de configuração da Minako", () => {
  it("aceita a configuração padrão", () => {
    expect(validateConfig(DEFAULT_CONFIG)).toEqual([]);
  });

  it("Modo Noturno não pode começar e terminar no mesmo horário", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.night.start = "02:00";
    c.night.end = "02:00";
    expect(fields(c)).toContain("noturno.end");
  });

  it("link do aviso noturno precisa ser link de mensagem do Discord", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.night.noticeUrl = "https://example.com/aviso";
    expect(fields(c)).toContain("noturno.noticeUrl");
    c.night.noticeUrl = "https://discord.com/channels/1/2/3";
    expect(fields(c)).not.toContain("noturno.noticeUrl");
  });

  it("TikTok: monitor de vídeos entre 5 e 60 minutos", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.tiktok.enabled = true;
    c.tiktok.channel = "c-tiktok";
    c.tiktok.pollMinutes = 4;
    expect(fields(c)).toContain("tiktok.pollMinutes");
    c.tiktok.pollMinutes = 60;
    expect(fields(c)).not.toContain("tiktok.pollMinutes");
  });

  it("TikTok: no máximo 10 criadores", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.tiktok.enabled = true;
    c.tiktok.channel = "c-tiktok";
    c.tiktok.maxAccounts = 11;
    expect(fields(c)).toContain("tiktok.maxAccounts");
  });

  it("TikTok: pausas por criador (300–3600 s) e por servidor (60–1800 s)", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.tiktok.enabled = true;
    c.tiktok.channel = "c-tiktok";
    c.tiktok.accountCooldownSeconds = 299;
    c.tiktok.guildCooldownSeconds = 1801;
    expect(fields(c)).toEqual(expect.arrayContaining(["tiktok.accountCooldownSeconds", "tiktok.guildCooldownSeconds"]));
  });

  it("TikTok ligado exige canal de avisos", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.tiktok.enabled = true;
    expect(fields(c)).toContain("tiktok.channel");
  });

  it("Sorteio não pode ter mais ganhadores que o máximo de participantes", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.giveaways.maxParticipants = 3;
    c.giveaways.winners = 4;
    expect(fields(c)).toContain("sorteios.winners");
  });

  it("Sorteio com máximo 0 significa sem limite", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.giveaways.maxParticipants = 0;
    c.giveaways.winners = 20;
    expect(fields(c)).not.toContain("sorteios.winners");
  });

  it("Canais imunes nunca são bloqueados pelo Modo Noturno", () => {
    const night = { ...DEFAULT_CONFIG.night, categories: ["cat"], affected: ["x"], immune: ["a", "x"] };
    expect(resolveNightScope(night, { cat: ["a", "b"] }).sort()).toEqual(["b"]);
  });
});

describe("Documentos legais", () => {
  const read = (f: string) => readFileSync(resolve(__dirname, "../content", f), "utf8");

  it("Termos de Uso têm 17 seções", () => {
    expect(parseLegal(read("termos-de-uso.txt")).sections).toHaveLength(17);
  });

  it("Política de Privacidade tem 17 seções e o contato de privacidade", () => {
    const doc = parseLegal(read("politica-de-privacidade.txt"));
    expect(doc.sections).toHaveLength(17);
    expect(doc.meta.find((m) => m.label === "Contato de privacidade")?.value).toBe("hyperion.vermilyon@gmail.com");
  });
});

describe("Mensagem V2 de sorteios", () => {
  const check = (messageBlocks: GiveawayBlock[]) => validateGiveawayMessage({ message: "Mensagem", messageBlocks });
  it("mensagem privada aceita 1800 caracteres e recusa 1801 antes de enviar ao bot", () => {
    const g = { ...cloneConfig(DEFAULT_CONFIG).giveaways, privateThread: true, privateMessage: "a".repeat(1800) };
    expect(validateGiveawayMessage(g)).toEqual([]);
    expect(validateGiveawayMessage({ ...g, privateMessage: "a".repeat(1801) })).toContain("A mensagem do tópico privado pode ter até 1.800 caracteres.");
  });
  it("mensagem privada vazia é permitida pois a conversão envia o padrão", () => {
    expect(validateGiveawayMessage({ ...DEFAULT_CONFIG.giveaways, privateThread: true, privateMessage: "" })).toEqual([]);
  });
  it("aceita os quatro tipos do bot", () => {
    expect(check([{ type: "text", content: "Prêmio" }, { type: "section", content: "Detalhes", thumbnail: "https://example.com/item.png" }, { type: "separator", divider: false, spacing: "large" }, { type: "gallery", urls: ["https://example.com/prize.png"] }])).toEqual([]);
  });
  it("limita a mensagem a 12 blocos", () => {
    const blocks: GiveawayBlock[] = Array.from({ length: 12 }, () => ({ type: "separator", divider: true, spacing: "small" }));
    expect(check(blocks)).toEqual([]);
    expect(check([...blocks, blocks[0] ?? { type: "text", content: "a" }])).toContain("Use no máximo 12 blocos na mensagem.");
  });
  it("limita cada texto a 1500 caracteres", () => {
    expect(check([{ type: "text", content: "a".repeat(1500) }])).toEqual([]);
    expect(check([{ type: "text", content: "a".repeat(1501) }])).toHaveLength(1);
  });
  it("limita o texto total a 3000 caracteres", () => {
    const blocks: GiveawayBlock[] = [{ type: "text", content: "a".repeat(1500) }, { type: "text", content: "b".repeat(1500) }];
    expect(check(blocks)).toEqual([]);
    expect(check([...blocks, { type: "text", content: "c" }])).toContain("A mensagem pode ter até 3.000 caracteres de texto no total.");
  });
  it("galerias contêm de 1 a 10 mídias", () => {
    expect(check([{ type: "gallery", urls: [] }])).toHaveLength(1);
    expect(check([{ type: "gallery", urls: Array(10).fill("https://example.com/a.png") }])).toEqual([]);
    expect(check([{ type: "gallery", urls: Array(11).fill("https://example.com/a.png") }])).toHaveLength(1);
  });
  it("galerias e miniaturas exigem HTTPS", () => {
    expect(check([{ type: "gallery", urls: ["javascript:alert(1)"] }])).toHaveLength(1);
    expect(check([{ type: "section", content: "a", thumbnail: "http://example.com/a.png" }])).toHaveLength(1);
  });
  it("seções contam como três componentes, máximo 32", () => {
    const sections: GiveawayBlock[] = Array.from({ length: 10 }, () => ({ type: "section", content: "a", thumbnail: "https://example.com/a.png" }));
    expect(check([...sections, { type: "separator", divider: true, spacing: "small" }, { type: "text", content: "b" }])).toEqual([]);
    expect(check([...sections, { type: "section", content: "b", thumbnail: "https://example.com/b.png" }])).toContain("A mensagem ultrapassa o limite de 32 componentes.");
  });
});
