import { useSyncExternalStore } from "react";

/** Estado de seções recolhidas e atalhos recentes, guardados no navegador. */

const COLLAPSE_KEY = "minako:collapsed";
const RECENT_KEY = "minako:recent";

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

let collapsed: Record<string, true> = {};
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    collapsed = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "{}");
  } catch {
    collapsed = {};
  }
}
function emit() {
  try {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed));
  } catch {
    /* sem espaço */
  }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

export const sectionKey = (path: string, slug: string) => `${path}#${slug}`;

export function useCollapsed(key: string) {
  return useSyncExternalStore(
    subscribe,
    () => !!collapsed[key],
    () => false,
  );
}

export function setCollapsed(key: string, value: boolean) {
  load();
  collapsed = { ...collapsed };
  if (value) collapsed[key] = true;
  else delete collapsed[key];
  emit();
}

/** Recolhe ou abre todas as seções da página. */
export function setAll(path: string, slugs: string[], value: boolean) {
  load();
  collapsed = { ...collapsed };
  for (const s of slugs) {
    const k = sectionKey(path, s);
    if (value) collapsed[k] = true;
    else delete collapsed[k];
  }
  emit();
}

/* ---------- Modo foco (ligado por padrão) ---------- */

const FOCUS_KEY = "minako:focus";
let focusOn = true;
let focusLoaded = false;
const focusListeners = new Set<() => void>();
function loadFocus() {
  if (focusLoaded || typeof window === "undefined") return;
  focusLoaded = true;
  try {
    focusOn = localStorage.getItem(FOCUS_KEY) !== "off";
  } catch {
    focusOn = true;
  }
}
export function isFocusMode() {
  loadFocus();
  return focusOn;
}
export function useFocusMode() {
  return useSyncExternalStore(
    (l) => {
      loadFocus();
      focusListeners.add(l);
      return () => focusListeners.delete(l);
    },
    () => focusOn,
    () => true,
  );
}
export function setFocusMode(value: boolean) {
  loadFocus();
  focusOn = value;
  try {
    localStorage.setItem(FOCUS_KEY, value ? "on" : "off");
  } catch {
    /* ok */
  }
  focusListeners.forEach((l) => l());
}

/** Seções presentes na tela, por página (na ordem em que aparecem). */
const registered = new Map<string, string[]>();
export function registerSection(path: string, slug: string) {
  const list = registered.get(path) ?? [];
  if (!list.includes(slug)) list.push(slug);
  registered.set(path, list);
  return () => {
    const l = registered.get(path);
    if (l) registered.set(path, l.filter((s) => s !== slug));
  };
}
export const registeredSections = (path: string) => registered.get(path) ?? [];

/** Com o modo foco ligado, deixa só uma seção aberta ao entrar na página. */
export function enforceFocus(path: string) {
  if (!isFocusMode()) return;
  load();
  const slugs = registeredSections(path);
  const open = slugs.filter((s) => !collapsed[sectionKey(path, s)]);
  if (open.length <= 1) return;
  const keep = pending?.startsWith(`${path}#`) ? pending.split("#")[1]! : open[0]!;
  focusOnly(path, slugs, keep);
}

/** Abre uma seção; no modo foco, as outras se fecham sozinhas. */
export function openSection(path: string, slug: string) {
  if (isFocusMode()) focusOnly(path, registeredSections(path), slug);
  else setCollapsed(sectionKey(path, slug), false);
}

/** Modo foco: só a seção escolhida fica aberta. */
export function focusOnly(path: string, slugs: string[], slug: string) {
  load();
  collapsed = { ...collapsed };
  for (const s of slugs) {
    const k = sectionKey(path, s);
    if (s === slug) delete collapsed[k];
    else collapsed[k] = true;
  }
  emit();
}

let pending: string | null = null;
/** Abre a seção e rola até ela (agora ou quando a página montar). */
export function revealSection(path: string, slug: string) {
  openSection(path, slug);
  pending = sectionKey(path, slug);
  setTimeout(() => scrollToPending(path), 60);
}
export function scrollToPending(path: string) {
  if (!pending || !pending.startsWith(`${path}#`)) return;
  const el = document.getElementById(`secao-${pending.split("#")[1]}`);
  if (!el) return;
  pending = null;
  const y = el.getBoundingClientRect().top + window.scrollY - (window.innerWidth < 1024 ? 84 : 24);
  window.scrollTo({ top: y, behavior: "smooth" });
  el.classList.add("animate-pop-in");
}

/* ---------- Recentes ---------- */

export function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}
export function pushRecent(path: string) {
  if (typeof window === "undefined") return;
  const next = [path, ...getRecent().filter((p) => p !== path)].slice(0, 4);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ok */
  }
}
