// Sessão do Discord guardada num cookie cifrado (AES-GCM) — o navegador nunca lê o token.
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

export const SESSION_COOKIE = "minako_session";
export const STATE_COOKIE = "minako_oauth_state";

export interface WebSession {
  token: string;
  user: { id: string; name: string; avatar: string | null };
  exp: number;
}

const enc = new TextEncoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function key() {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET não configurado.");
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(`minako-panel:${secret}`));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function seal(data: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), enc.encode(JSON.stringify(data))));
  return `${b64(iv)}.${b64(ct)}`;
}

export async function unseal<T>(value: string): Promise<T | null> {
  try {
    const [iv, ct] = value.split(".");
    if (!iv || !ct) return null;
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await key(), unb64(ct));
    return JSON.parse(new TextDecoder().decode(pt)) as T;
  } catch {
    return null;
  }
}

const cookieOpts = (maxAge: number) => ({ httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge });

export async function readSession(): Promise<WebSession | null> {
  const raw = getCookie(SESSION_COOKIE);
  if (!raw) return null;
  const s = await unseal<WebSession>(raw);
  if (!s || s.exp < Date.now()) return null;
  return s;
}

export async function writeSession(s: WebSession) {
  setCookie(SESSION_COOKIE, await seal(s), cookieOpts(Math.floor((s.exp - Date.now()) / 1000)));
}

export function clearSession() {
  deleteCookie(SESSION_COOKIE, { path: "/" });
}
