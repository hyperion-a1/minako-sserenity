import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_CONFIG, cloneConfig } from "@/lib/minako/config";

// Executa os handlers reais sem RPC/Discord: apenas sessão e rede são simuladas.
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate: ((input: unknown) => unknown) | undefined;
    const builder = {
      inputValidator: (fn: (input: unknown) => unknown) => { validate = fn; return builder; },
      handler: (fn: (args: { data: unknown }) => Promise<unknown>) =>
        (args?: { data: unknown }) => fn({ data: validate ? validate(args?.data) : args?.data }),
    };
    return builder;
  },
}));

const { readSession } = vi.hoisted(() => ({ readSession: vi.fn() }));
vi.mock("@/lib/minako/session.server", () => ({ readSession }));

import { createGiveaway, saveGiveawayTemplate } from "@/lib/minako/bot.functions";

describe("Contrato de envio dos sorteios à API do bot", () => {
  const guildId = "111111111111111111";
  const fallback = "Parabéns {users}! 🎉 Vocês ganharam **{giveaway}**. {host} vai combinar a entrega por aqui.";
  const fetchMock = vi.fn<typeof fetch>();
  const giveaways = () => ({ ...cloneConfig(DEFAULT_CONFIG).giveaways, channel: "222222222222222222", privateThread: true, privateMessage: "" });

  beforeEach(() => {
    vi.stubEnv("MINAKO_API_URL", "https://bot.example.test");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    readSession.mockResolvedValue({ token: "fake-test-token", user: { id: "333333333333333333" } });
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

  it.each(["immediate", "scheduled"] as const)("publicação %s envia texto privado não vazio no formato aceito pelo bot", async (start) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "Recebido", scheduled: start === "scheduled" }), { status: 201 }));
    const g = { ...giveaways(), start, scheduledAt: "2099-11-24T18:00" };
    const result = await createGiveaway({ data: { guildId, giveaways: g } });
    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error("A API não foi chamada");
    expect(call[0]).toBe("https://bot.example.test/api/dashboard/giveaways");
    expect(call[1]?.method).toBe("POST");
    const body = JSON.parse(String(call[1]?.body));
    expect(body.guildId).toBe(guildId);
    expect(body.config.giveawayPrivateThread).toBe(true);
    expect(body.config.giveawayPrivateMessage).toBe(fallback);
    expect(body.config.giveawayStart).toBe(start);
    expect(result.scheduled).toBe(start === "scheduled");
  });

  it("modelo salvo também envia o texto padrão em vez de gravar message vazio", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ templates: [{ id: "1", name: "Semanal" }] }), { status: 201 }));
    expect(await saveGiveawayTemplate({ data: { guildId, name: "Semanal", giveaways: giveaways() } })).toEqual([{ id: "1", name: "Semanal" }]);
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("A API não foi chamada");
    expect(call[0]).toBe("https://bot.example.test/api/dashboard/templates");
    const body = JSON.parse(String(call[1]?.body));
    expect(body.config.giveawayPrivateMessage).toBe(fallback);
    expect(body.name).toBe("Semanal");
  });

  it("recusa mensagem privada maior que 1800 caracteres sem enviar à API", async () => {
    await expect(createGiveaway({ data: { guildId, giveaways: { ...giveaways(), privateMessage: "a".repeat(1801) } } })).rejects.toThrow("1.800");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sessão ausente impede publicação e salvamento de modelos", async () => {
    readSession.mockResolvedValue(null);
    await expect(createGiveaway({ data: { guildId, giveaways: giveaways() } })).rejects.toThrow("Sua sessão expirou");
    await expect(saveGiveawayTemplate({ data: { guildId, name: "Semanal", giveaways: giveaways() } })).rejects.toThrow("Sua sessão expirou");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});