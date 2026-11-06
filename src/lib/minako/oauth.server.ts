import { deleteCookie, getCookie } from "@tanstack/react-start/server";

import { STATE_COOKIE, writeSession } from "./session.server";

export function readSessionState() {
  const v = getCookie(STATE_COOKIE) ?? "";
  deleteCookie(STATE_COOKIE, { path: "/" });
  return v;
}

export async function finishLogin(code: string, redirectUri: string) {
  const res = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env["DISCORD_CLIENT_ID"] ?? "",
      client_secret: process.env["DISCORD_CLIENT_SECRET"] ?? "",
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  const token = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!res.ok || !token.access_token) throw new Error(`Troca do código falhou [${res.status}]`);
  const me = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const user = (await me.json().catch(() => ({}))) as { id?: string; username?: string; global_name?: string; avatar?: string };
  if (!me.ok || !user.id) throw new Error(`Leitura do usuário falhou [${me.status}]`);
  const ttl = Math.min(Number(token.expires_in) || 604800, 604800);
  await writeSession({
    token: token.access_token,
    user: {
      id: user.id,
      name: user.global_name || user.username || "Você",
      avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : null,
    },
    exp: Date.now() + ttl * 1000,
  });
}
