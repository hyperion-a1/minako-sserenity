import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { guildFromDiscord, type BotGuildData } from "./bot-mapping";
import {
  getPanelSession,
  listPanelGuilds,
  loadPanelGuild,
  logoutPanel,
  savePanelGuild,
  type PanelGuild,
} from "./bot.functions";
import {
  DEMO_GUILDS,
  DEFAULT_CONFIG,
  cloneConfig,
  mergeWithDefaults,
  type DemoGuild,
  type MinakoConfig,
} from "./config";
import { validateConfig, type Issue } from "./validation";

const STORAGE_KEY = "minako.dashboard.config.v1";
const LIVE_GUILD_KEY = "minako.dashboard.liveGuild";

type Saved = Record<string, MinakoConfig>;
export type SaveResult = { ok: true } | { ok: false; issues: Issue[] } | { ok: false; error: string };

export interface PanelUser {
  id: string;
  name: string;
  avatar: string | null;
}

interface DashboardState {
  ready: boolean;
  /** "demo" = sem login, salva no navegador; "live" = conectado ao bot. */
  mode: "demo" | "live";
  loginAvailable: boolean;
  user: PanelUser | null;
  loading: boolean;
  loadError: string | null;
  guildWarning: string | null;
  guild: DemoGuild;
  guilds: DemoGuild[];
  selectGuild: (id: string) => void;
  draft: MinakoConfig;
  saved: MinakoConfig;
  dirty: boolean;
  issues: Issue[];
  update: <K extends keyof MinakoConfig>(section: K, patch: Partial<MinakoConfig[K]>) => void;
  save: () => Promise<SaveResult>;
  discard: () => void;
  resetGuild: () => void;
  logout: () => Promise<void>;
  lastSavedAt: number | null;
}

const DashboardContext = createContext<DashboardState | null>(null);

function readStorage(): { saved: Saved; guildId?: string; savedAt?: Record<string, number> } {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    const saved: Saved = {};
    for (const [id, cfg] of Object.entries(raw.saved ?? {})) saved[id] = mergeWithDefaults(cfg);
    return { saved, guildId: raw.guildId, savedAt: raw.savedAt ?? {} };
  } catch {
    return { saved: {} };
  }
}

const emptyGuild = (g: PanelGuild): DemoGuild => ({ id: g.id, name: g.name, emoji: "🌸", members: g.members, channels: [], roles: [] });
const msg = (e: unknown) => (e instanceof Error ? e.message : "Algo deu errado.");

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [loginAvailable, setLoginAvailable] = useState(false);
  const [user, setUser] = useState<PanelUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [guildWarning, setGuildWarning] = useState<string | null>(null);
  const [guildList, setGuildList] = useState<DemoGuild[]>(DEMO_GUILDS);
  const [guildId, setGuildId] = useState(DEMO_GUILDS[0]!.id);
  const [saved, setSaved] = useState<Saved>({});
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<MinakoConfig>(() => cloneConfig(DEFAULT_CONFIG));

  const persistDemo = useCallback((next: Saved, nextGuild: string, nextSavedAt: Record<string, number>) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ saved: next, guildId: nextGuild, savedAt: nextSavedAt }));
    } catch {
      /* armazenamento indisponível */
    }
  }, []);

  const loadLive = useCallback(async (id: string, meta: DemoGuild) => {
    setLoading(true);
    setLoadError(null);
    setGuildWarning(null);
    try {
      const res = await loadPanelGuild({ data: { guildId: id } });
      const cfg = res.config;
      if ("error" in res.guildData) {
        setGuildWarning(`A Minako não conseguiu ler os canais e cargos deste servidor. Ela está no servidor? (${res.guildData.error})`);
      } else {
        const full = guildFromDiscord(meta, res.guildData as BotGuildData);
        setGuildList((list) => list.map((g) => (g.id === id ? full : g)));
      }
      setSaved((s) => ({ ...s, [id]: cfg }));
      setDraft(cloneConfig(cfg));
    } catch (e) {
      setLoadError(msg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Descobre se há login; sem login, usa o modo demonstração no navegador.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getPanelSession();
        if (!alive) return;
        setLoginAvailable(s.configured);
        if (s.user) {
          setUser(s.user);
          setMode("live");
          const list = (await listPanelGuilds()).map(emptyGuild);
          if (!alive) return;
          setGuildList(list);
          const remembered = window.localStorage.getItem(LIVE_GUILD_KEY);
          const first = list.find((g) => g.id === remembered) ?? list[0];
          if (first) {
            setGuildId(first.id);
            setReady(true);
            await loadLive(first.id, first);
          } else {
            setLoadError("Você não é administrador de nenhum servidor do Discord.");
            setReady(true);
          }
          return;
        }
      } catch (e) {
        if (alive && user) setLoadError(msg(e));
      }
      if (!alive) return;
      const stored = readStorage();
      const id = DEMO_GUILDS.some((g) => g.id === stored.guildId) ? stored.guildId! : DEMO_GUILDS[0]!.id;
      setSaved(stored.saved);
      setSavedAt(stored.savedAt ?? {});
      setGuildId(id);
      setDraft(cloneConfig(stored.saved[id] ?? DEFAULT_CONFIG));
      setReady(true);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savedConfig = saved[guildId] ?? DEFAULT_CONFIG;
  const dirty = ready && !loading && JSON.stringify(savedConfig) !== JSON.stringify(draft);
  const issues = useMemo(() => validateConfig(draft), [draft]);

  const update = useCallback<DashboardState["update"]>((section, patch) => {
    setDraft((d) => ({ ...d, [section]: { ...d[section], ...patch } }));
  }, []);

  const save = useCallback(async (): Promise<SaveResult> => {
    const found = validateConfig(draft);
    if (found.length) return { ok: false, issues: found };
    if (mode === "live") {
      try {
        const res = await savePanelGuild({ data: { guildId, config: draft } });
        const cfg = res.config;
        setSaved((s) => ({ ...s, [guildId]: cfg }));
        setDraft(cloneConfig(cfg));
        setSavedAt((a) => ({ ...a, [guildId]: Date.now() }));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: msg(e) };
      }
    }
    const next = { ...saved, [guildId]: cloneConfig(draft) };
    const nextAt = { ...savedAt, [guildId]: Date.now() };
    setSaved(next);
    setSavedAt(nextAt);
    persistDemo(next, guildId, nextAt);
    return { ok: true };
  }, [draft, mode, saved, savedAt, guildId, persistDemo]);

  const discard = useCallback(() => setDraft(cloneConfig(savedConfig)), [savedConfig]);

  const selectGuild = useCallback(
    (id: string) => {
      setGuildId(id);
      if (mode === "live") {
        window.localStorage.setItem(LIVE_GUILD_KEY, id);
        const meta = guildList.find((g) => g.id === id);
        if (meta) void loadLive(id, meta);
        return;
      }
      setDraft(cloneConfig(saved[id] ?? DEFAULT_CONFIG));
      persistDemo(saved, id, savedAt);
    },
    [mode, guildList, loadLive, saved, savedAt, persistDemo],
  );

  const resetGuild = useCallback(() => setDraft(cloneConfig(DEFAULT_CONFIG)), []);

  const logout = useCallback(async () => {
    await logoutPanel();
    window.location.href = "/";
  }, []);

  const guild = guildList.find((g) => g.id === guildId) ?? guildList[0] ?? DEMO_GUILDS[0]!;

  const value: DashboardState = {
    ready,
    mode,
    loginAvailable,
    user,
    loading,
    loadError,
    guildWarning,
    guild,
    guilds: guildList,
    selectGuild,
    draft,
    saved: savedConfig,
    dirty,
    issues,
    update,
    save,
    discard,
    resetGuild,
    logout,
    lastSavedAt: savedAt[guildId] ?? null,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard precisa estar dentro de DashboardProvider");
  return ctx;
}
