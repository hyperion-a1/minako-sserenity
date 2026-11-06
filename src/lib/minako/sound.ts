// Sons da Minako: tudo sintetizado na hora com Web Audio (sem arquivos externos).
// Efeitos curtinhos e fofos + uma caixinha de música ambiente opcional.

export type SoundKind =
  | "pop"
  | "tick"
  | "on"
  | "off"
  | "nav"
  | "success"
  | "error"
  | "giggle"
  | "sparkle";

export interface AudioSettings {
  effects: boolean;
  music: boolean;
  effectsVolume: number;
  musicVolume: number;
}

const STORAGE_KEY = "minako.dashboard.audio.v1";
export const DEFAULT_AUDIO: AudioSettings = {
  effects: true,
  music: false,
  effectsVolume: 0.5,
  musicVolume: 0.35,
};

let settings: AudioSettings = { ...DEFAULT_AUDIO };
const listeners = new Set<(s: AudioSettings) => void>();

let ctx: AudioContext | null = null;
let fxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let nextNoteTime = 0;
let step = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    fxGain = ctx.createGain();
    fxGain.gain.value = settings.effects ? settings.effectsVolume * 0.6 : 0;
    fxGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(ctx.destination);
  }
  return ctx;
}

export function loadAudioSettings(): AudioSettings {
  if (typeof window === "undefined") return settings;
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    settings = {
      effects: raw.effects !== false,
      music: false, // música nunca liga sozinha ao abrir (política dos navegadores)
      effectsVolume: clamp(raw.effectsVolume, DEFAULT_AUDIO.effectsVolume),
      musicVolume: clamp(raw.musicVolume, DEFAULT_AUDIO.musicVolume),
    };
  } catch {
    settings = { ...DEFAULT_AUDIO };
  }
  listeners.forEach((l) => l(settings));
  return settings;
}

export function getAudioSettings() {
  return settings;
}

export function subscribeAudio(fn: (s: AudioSettings) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function updateAudioSettings(patch: Partial<AudioSettings>) {
  const prevMusic = settings.music;
  settings = { ...settings, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* armazenamento pode estar indisponível */
  }
  const c = getCtx();
  if (c && fxGain && musicGain) {
    fxGain.gain.setTargetAtTime(settings.effects ? settings.effectsVolume * 0.6 : 0, c.currentTime, 0.05);
    musicGain.gain.setTargetAtTime(settings.music ? settings.musicVolume * 0.5 : 0, c.currentTime, 0.6);
  }
  if (settings.music && !prevMusic) void startMusic();
  if (!settings.music && prevMusic) stopMusicSoon();
  listeners.forEach((l) => l(settings));
}

function clamp(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
}

interface ToneOpts {
  type?: OscillatorType | undefined;
  volume?: number | undefined;
  to?: number | undefined;
  attack?: number | undefined;
  release?: number | undefined;
  dest?: AudioNode | null | undefined;
}

function tone(freq: number, start: number, dur: number, o: ToneOpts = {}) {
  const c = ctx;
  const dest = o.dest ?? fxGain;
  if (!c || !dest) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(freq, start);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, o.to), start + dur);
  const vol = Math.max(0.0002, o.volume ?? 0.2);
  const attack = o.attack ?? 0.008;
  const release = o.release ?? 0.12;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur + release);
  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur + release + 0.05);
}

/** Sininho: fundamental + harmônico agudo, com decaimento suave. */
function bell(freq: number, start: number, volume = 0.18, dest?: AudioNode | null) {
  tone(freq, start, 0.05, { type: "sine", volume, release: 0.9, dest });
  tone(freq * 2, start, 0.03, { type: "sine", volume: volume * 0.35, release: 0.5, dest });
  tone(freq * 3.01, start, 0.02, { type: "triangle", volume: volume * 0.08, release: 0.25, dest });
}

export async function playSound(kind: SoundKind) {
  if (!settings.effects) return;
  const c = getCtx();
  if (!c) return;
  try {
    if (c.state === "suspended") await c.resume();
  } catch {
    return;
  }
  const t = c.currentTime + 0.005;
  switch (kind) {
    case "pop":
      tone(520, t, 0.07, { type: "sine", volume: 0.28, to: 880, release: 0.06 });
      break;
    case "tick":
      tone(1400, t, 0.02, { type: "triangle", volume: 0.08, release: 0.03 });
      break;
    case "on":
      tone(660, t, 0.06, { type: "sine", volume: 0.22, to: 990, release: 0.05 });
      bell(1318.5, t + 0.07, 0.12);
      break;
    case "off":
      tone(700, t, 0.08, { type: "sine", volume: 0.2, to: 420, release: 0.08 });
      break;
    case "nav":
      tone(392, t, 0.12, { type: "triangle", volume: 0.12, to: 784, release: 0.1 });
      bell(1568, t + 0.08, 0.06);
      break;
    case "sparkle":
      [1568, 1760, 2093, 2637].forEach((f, i) => bell(f, t + i * 0.055, 0.07));
      break;
    case "giggle":
      [880, 1046, 932, 1175, 1046].forEach((f, i) =>
        tone(f, t + i * 0.075, 0.05, { type: "sine", volume: 0.16, to: f * 1.12, release: 0.04 }),
      );
      break;
    case "success":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, t + i * 0.09, 0.17));
      bell(1567.98, t + 0.42, 0.1);
      break;
    case "error":
      tone(392, t, 0.12, { type: "triangle", volume: 0.18, to: 349, release: 0.06 });
      tone(330, t + 0.16, 0.18, { type: "triangle", volume: 0.16, to: 262, release: 0.1 });
      break;
  }
}

/* ---------- Música ambiente: caixinha de música aconchegante ---------- */

// Progressão Fmaj7 – Em7 – Dm7 – Cmaj7 (fá, mi, ré, dó), 76 bpm.
const CHORDS = [
  [174.61, 220.0, 261.63, 329.63],
  [164.81, 196.0, 246.94, 293.66],
  [146.83, 174.61, 220.0, 261.63],
  [130.81, 164.81, 196.0, 246.94],
];
// Melodia em pentatônica de dó (índices por compasso, 8 colcheias; 0 = pausa)
const MELODY = [
  [880, 0, 784, 659.25, 0, 698.46, 659.25, 0],
  [783.99, 0, 659.25, 0, 587.33, 0, 659.25, 783.99],
  [698.46, 0, 659.25, 587.33, 0, 523.25, 0, 587.33],
  [659.25, 0, 0, 523.25, 0, 783.99, 0, 0],
];
const EIGHTH = 60 / 76 / 2;

function scheduleStep(time: number) {
  const bar = Math.floor(step / 8) % 4;
  const beat = step % 8;
  const chord = CHORDS[bar] ?? CHORDS[0]!;
  if (beat === 0) {
    // pad suave e quentinho
    chord.forEach((f) =>
      tone(f, time, EIGHTH * 7, { type: "sine", volume: 0.05, attack: 0.5, release: 1.2, dest: musicGain }),
    );
    tone(chord[0]! / 2, time, EIGHTH * 3, { type: "triangle", volume: 0.07, attack: 0.05, release: 0.6, dest: musicGain });
  }
  if (beat === 4) {
    tone(chord[0]! / 2, time, EIGHTH * 2, { type: "triangle", volume: 0.05, attack: 0.05, release: 0.5, dest: musicGain });
  }
  // arpejo de caixinha de música
  if (beat % 2 === 1) bell(chord[(beat >> 1) % 4]! * 2, time, 0.045, musicGain);
  const note = MELODY[bar]?.[beat];
  if (note) bell(note, time, 0.08, musicGain);
  step += 1;
}

async function startMusic() {
  const c = getCtx();
  if (!c || !musicGain) return;
  try {
    if (c.state === "suspended") await c.resume();
  } catch {
    return;
  }
  musicGain.gain.setTargetAtTime(settings.musicVolume * 0.5, c.currentTime, 0.8);
  if (musicTimer) return;
  nextNoteTime = c.currentTime + 0.1;
  musicTimer = setInterval(() => {
    if (!ctx) return;
    while (nextNoteTime < ctx.currentTime + 0.25) {
      scheduleStep(nextNoteTime);
      nextNoteTime += EIGHTH;
    }
  }, 60);
}

function stopMusicSoon() {
  setTimeout(() => {
    if (settings.music) return;
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  }, 1800);
}
