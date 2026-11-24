import { describe, expect, it } from "vitest";

import { botWeekDay, fromBotConfig, toBotPayload } from "@/lib/minako/bot-mapping";
import { DEFAULT_CONFIG, DEFAULT_GIVEAWAY_PRIVATE_MESSAGE, cloneConfig, mergeWithDefaults } from "@/lib/minako/config";

describe("Conversão painel ↔ bot", () => {
  it("o bot só aceita domingo, segunda ou sábado como início da semana", () => {
    expect(botWeekDay(0)).toBe("sunday");
    expect(botWeekDay(6)).toBe("saturday");
    expect(botWeekDay(3)).toBe("monday");
  });

  it("listas de IDs viram texto separado por vírgula, como o bot espera", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.night.affected = ["111111111111111111", "222222222222222222"];
    expect(toBotPayload(c)["nightAffectedChannels"]).toBe("111111111111111111, 222222222222222222");
  });

  it("ida e volta preserva as configurações", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.channels.moderation = "333333333333333333";
    c.roles.matchAdmins = ["444444444444444444"];
    c.seasonal.natal = false;
    c.week.startDay = 6;
    expect(fromBotConfig(toBotPayload(c))).toEqual(c);
  });

  it("o que está no banco do bot vence o rascunho guardado", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    const payload = { ...toBotPayload(c), starRole: "555555555555555555" };
    expect(fromBotConfig(payload).roles.star).toBe("555555555555555555");
  });
});

import { fromBotGiveaway, toBotGiveaway } from "@/lib/minako/bot-mapping";
import { brasiliaToMs, validateGiveawayLaunch } from "@/lib/minako/validation";

describe("Sorteios", () => {
  const base = () => ({ ...cloneConfig(DEFAULT_CONFIG).giveaways, channel: "666666666666666666" });
  const now = Date.UTC(2026, 10, 6, 12, 0); // 09:00 em Brasília

  it("modelo vai e volta sem perder campos", () => {
    const g = { ...base(), duration: "custom" as const, endDate: "2026-11-10T20:00", start: "scheduled" as const, scheduledAt: "2026-11-09T18:30" };
    expect(fromBotGiveaway(toBotGiveaway(g), base())).toEqual(g);
  });
  it("modelo preserva galeria, texto, seção e separador", () => {
    const g = base();
    g.messageBlocks = [{ type: "text", content: "<:premio:123456789012345678>" }, { type: "gallery", urls: ["https://example.com/a.png"] }, { type: "section", content: "Regras", thumbnail: "https://example.com/b.png" }, { type: "separator", divider: false, spacing: "large" }];
    expect(toBotGiveaway(g)["giveawayMessageBlocks"]).toEqual(g.messageBlocks);
    expect(fromBotGiveaway(toBotGiveaway(g), base())).toEqual(g);
  });
  it("modelo antigo remove os blocos do rascunho anterior", () => {
    const current = { ...base(), messageBlocks: [{ type: "text" as const, content: "Rascunho" }] };
    expect(fromBotGiveaway({ giveawayMessage: "Antigo" }, current).messageBlocks).toEqual([]);
  });

  it.each(["", "   \n\t"])("tópico privado com mensagem %j envia o texto padrão, nunca vazio", (privateMessage) => {
    const payload = toBotGiveaway({ ...base(), privateThread: true, privateMessage });
    expect(payload["giveawayPrivateThread"]).toBe(true);
    expect(payload["giveawayPrivateMessage"]).toBe("Parabéns {users}! 🎉 Vocês ganharam **{giveaway}**. {host} vai combinar a entrega por aqui.");
  });

  it("mensagem privada personalizada vai e volta no modelo sem perder placeholders", () => {
    const g = { ...base(), privateThread: true, privateMessage: "Oi {users}! Falem com {host} sobre {giveaway}." };
    expect(toBotGiveaway(g)["giveawayPrivateMessage"]).toBe(g.privateMessage);
    expect(fromBotGiveaway(toBotGiveaway(g), base())).toEqual(g);
  });

  it.each([{}, { giveawayPrivateMessage: "" }, { giveawayPrivateMessage: " \n " }])("modelo sem mensagem privada usa o padrão, não o texto do modelo anterior", (input) => {
    expect(fromBotGiveaway(input, { ...base(), privateMessage: "Texto anterior" }).privateMessage).toBe(DEFAULT_GIVEAWAY_PRIVATE_MESSAGE);
  });

  it("rascunhos antigos recebem a mensagem privada padrão ao carregar", () => {
    expect(mergeWithDefaults({ giveaways: { privateThread: true } }).giveaways.privateMessage).toBe(DEFAULT_GIVEAWAY_PRIVATE_MESSAGE);
  });

  it("rascunho completo salvo preserva mensagem personalizada", () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.giveaways.privateMessage = "Entrega de {giveaway} com {host}.";
    expect(fromBotConfig(toBotPayload(c)).giveaways.privateMessage).toBe(c.giveaways.privateMessage);
  });

  it("horário de Brasília é UTC-3", () => {
    expect(brasiliaToMs("2026-11-06T09:00")).toBe(now);
  });

  it("agendamento precisa estar no futuro", () => {
    const g = { ...base(), start: "scheduled" as const, scheduledAt: "2026-11-06T08:00" };
    expect(validateGiveawayLaunch(g, now)).toContain("A data de início precisa estar no futuro.");
  });

  it("fim personalizado precisa ser pelo menos 1 minuto depois do início", () => {
    const g = { ...base(), duration: "custom" as const, endDate: "2026-11-06T09:00" };
    expect(validateGiveawayLaunch(g, now)).toContain("O encerramento precisa ser pelo menos 1 minuto depois do início.");
    expect(validateGiveawayLaunch({ ...g, endDate: "2026-11-06T10:00" }, now)).toEqual([]);
  });

  it("sem canal não dá para publicar", () => {
    expect(validateGiveawayLaunch({ ...base(), channel: null }, now)).toContain("Escolha o canal do sorteio.");
  });
});
