import { createServerFn } from "@tanstack/react-start";

import type { MinakoConfig } from "./config";

export interface PanelGuild {
  id: string;
  name: string;
  members: number;
}

class PanelError extends Error {}

async function session() {
  const { readSession } = await import("./session.server");
  const s = await readSession();
  if (!s) throw new PanelError("Sua sessão expirou. Entre com o Discord de novo.");
  return s;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Chama a API do bot. O bot confere a pessoa no Discord a cada pedido e o Discord limita essa
 * checagem (~1/s por token); quando ela falha por excesso, o bot responde "precisa ser membro"
 * ou "não foi possível verificar". Nesses casos, tenta de novo com uma pausa.
 */
async function bot<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const base = (process.env["MINAKO_API_URL"] ?? "").replace(/\/+$/, "");
  if (!base) throw new PanelError("O endereço do bot ainda não foi configurado.");
  let last = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt) await wait(1300 * attempt);
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) return body as T;
    last = body.error || `O bot respondeu com erro (${res.status}).`;
    const throttled = (res.status === 403 && /membro/i.test(last)) || (res.status === 502 && /verificar|HTTP 429|HTTP 5\d\d|timeout/i.test(last));
    if (!throttled) break;
  }
  throw new PanelError(last);
}

export const getPanelSession = createServerFn({ method: "GET" }).handler(async () => {
  const configured = Boolean(process.env["DISCORD_CLIENT_ID"] && process.env["SESSION_SECRET"] && process.env["MINAKO_API_URL"]);
  const { readSession } = await import("./session.server");
  const s = configured ? await readSession() : null;
  return { configured, user: s?.user ?? null };
});

export const logoutPanel = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSession } = await import("./session.server");
  clearSession();
  return { ok: true };
});

/** Servidores em que a pessoa é administradora (permissão Administrator). */
export const listPanelGuilds = createServerFn({ method: "GET" }).handler(async (): Promise<PanelGuild[]> => {
  const s = await session();
  const res = await fetch("https://discord.com/api/v10/users/@me/guilds?with_counts=true&limit=200", {
    headers: { Authorization: `Bearer ${s.token}` },
  });
  if (!res.ok) throw new PanelError("Não foi possível listar seus servidores do Discord.");
  const list = (await res.json()) as { id: string; name: string; permissions?: string; approximate_member_count?: number }[];
  return list
    .filter((g) => {
      try {
        return (BigInt(g.permissions ?? "0") & 8n) === 8n;
      } catch {
        return false;
      }
    })
    .map((g) => ({ id: g.id, name: g.name, members: g.approximate_member_count ?? 0 }));
});

const guildIdInput = (input: { guildId: string }) => {
  if (!/^\d{17,20}$/.test(String(input?.guildId))) throw new PanelError("Servidor inválido.");
  return { guildId: String(input.guildId) };
};

export const loadPanelGuild = createServerFn({ method: "GET" })
  .inputValidator(guildIdInput)
  .handler(async ({ data }) => {
    const s = await session();
    const q = `?guildId=${data.guildId}`;
    const dash = await bot<{ config: Record<string, unknown> }>(s.token, `/api/dashboard${q}`);
    await wait(1100);
    const guildData = await bot<import("./bot-mapping").BotGuildData>(s.token, `/api/dashboard/guild-data${q}`).catch(
      (e: Error) => ({ error: e.message }),
    );
    const { fromBotConfig } = await import("./bot-mapping");
    return { config: fromBotConfig(dash.config), guildData };
  });

export const savePanelGuild = createServerFn({ method: "POST" })
  .inputValidator((input: { guildId: string; config: MinakoConfig }) => {
    const { guildId } = guildIdInput(input);
    if (!input.config || typeof input.config !== "object") throw new PanelError("Configuração inválida.");
    return { guildId, config: input.config };
  })
  .handler(async ({ data }) => {
    const s = await session();
    const { toBotPayload, fromBotConfig } = await import("./bot-mapping");
    const res = await bot<{ config: Record<string, unknown> }>(s.token, "/api/dashboard", {
      method: "PUT",
      body: JSON.stringify({ guildId: data.guildId, config: toBotPayload(data.config) }),
    });
    return { config: fromBotConfig(res.config) };
  });

/* ---------- Sorteios: modelos, criação, agendamento e lista ---------- */

export interface GiveawayTemplate {
  id: string;
  name: string;
}
export interface LiveGiveaway {
  id: string;
  name: string;
  status: string;
  channelId: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

const idInput = (input: { guildId: string; id: string }) => {
  const { guildId } = guildIdInput(input);
  if (!/^\d{1,18}$/.test(String(input?.id))) throw new PanelError("Identificador inválido.");
  return { guildId, id: String(input.id) };
};
const giveawaysInput = (input: { guildId: string; giveaways: MinakoConfig["giveaways"]; name?: string }) => {
  const { guildId } = guildIdInput(input);
  if (!input.giveaways || typeof input.giveaways !== "object") throw new PanelError("Sorteio inválido.");
  return { guildId, giveaways: input.giveaways, name: String(input.name ?? "").trim().slice(0, 80) };
};

export const loadGiveawayPanel = createServerFn({ method: "GET" })
  .inputValidator(guildIdInput)
  .handler(async ({ data }) => {
    const s = await session();
    const q = `?guildId=${data.guildId}`;
    const dash = await bot<{ templates?: GiveawayTemplate[]; giveawayMessageV2?: boolean }>(s.token, `/api/dashboard${q}`);
    await wait(1100);
    const list = await bot<{ giveaways: LiveGiveaway[] }>(s.token, `/api/dashboard/giveaways${q}`);
    return { templates: dash.templates ?? [], giveaways: list.giveaways ?? [], messageV2: dash.giveawayMessageV2 === true };
  });

export const listLiveGiveaways = createServerFn({ method: "GET" })
  .inputValidator(guildIdInput)
  .handler(async ({ data }) => {
    const s = await session();
    return (await bot<{ giveaways: LiveGiveaway[] }>(s.token, `/api/dashboard/giveaways?guildId=${data.guildId}`)).giveaways ?? [];
  });

export const saveGiveawayTemplate = createServerFn({ method: "POST" })
  .inputValidator(giveawaysInput)
  .handler(async ({ data }) => {
    if (!data.name) throw new PanelError("Dê um nome para o modelo.");
    const s = await session();
    const { toBotGiveaway } = await import("./bot-mapping");
    const { validateGiveawayMessage } = await import("./validation");
    const errors = validateGiveawayMessage(data.giveaways);
    if (errors.length) throw new PanelError(errors.join(" · "));
    if (data.giveaways.messageBlocks?.length) {
      const capability = await bot<{ giveawayMessageV2?: boolean }>(s.token, `/api/dashboard?guildId=${data.guildId}`);
      if (!capability.giveawayMessageV2) throw new PanelError("Atualize a API do bot para salvar modelos com componentes V2.");
      await wait(1100);
    }
    const res = await bot<{ templates: GiveawayTemplate[] }>(s.token, "/api/dashboard/templates", {
      method: "POST",
      body: JSON.stringify({ guildId: data.guildId, name: data.name, config: toBotGiveaway(data.giveaways) }),
    });
    return res.templates;
  });

export const applyGiveawayTemplate = createServerFn({ method: "GET" })
  .inputValidator((input: { guildId: string; id: string; current: MinakoConfig["giveaways"] }) => ({
    ...idInput(input),
    current: input.current,
  }))
  .handler(async ({ data }) => {
    const s = await session();
    const res = await bot<{ config: Record<string, unknown> }>(
      s.token,
      `/api/dashboard/templates/${data.id}?guildId=${data.guildId}`,
    );
    const { fromBotGiveaway } = await import("./bot-mapping");
    return fromBotGiveaway(res.config, data.current);
  });

export const deleteGiveawayTemplate = createServerFn({ method: "POST" })
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const s = await session();
    const res = await bot<{ templates: GiveawayTemplate[] }>(
      s.token,
      `/api/dashboard/templates/${data.id}?guildId=${data.guildId}`,
      { method: "DELETE" },
    );
    return res.templates;
  });

export const createGiveaway = createServerFn({ method: "POST" })
  .inputValidator(giveawaysInput)
  .handler(async ({ data }) => {
    const s = await session();
    const { toBotGiveaway } = await import("./bot-mapping");
    const { validateGiveawayLaunch } = await import("./validation");
    const errors = validateGiveawayLaunch(data.giveaways);
    if (errors.length) throw new PanelError(errors.join(" · "));
    if (data.giveaways.messageBlocks?.length) {
      const capability = await bot<{ giveawayMessageV2?: boolean }>(s.token, `/api/dashboard?guildId=${data.guildId}`);
      if (!capability.giveawayMessageV2) throw new PanelError("Atualize a API do bot para publicar mensagens com componentes V2.");
      await wait(1100);
    }
    const res = await bot<{ message: string; scheduled: boolean }>(s.token, "/api/dashboard/giveaways", {
      method: "POST",
      body: JSON.stringify({ guildId: data.guildId, config: toBotGiveaway(data.giveaways) }),
    });
    return { message: res.message, scheduled: res.scheduled };
  });

export const cancelGiveaway = createServerFn({ method: "POST" })
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const s = await session();
    await bot(s.token, `/api/dashboard/giveaways/${data.id}/cancel?guildId=${data.guildId}`, { method: "POST" });
    return { ok: true };
  });
