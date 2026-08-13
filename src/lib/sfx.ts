// Tiny procedural sound engine (Web Audio). No assets, no network.
// Global on/off is stored in localStorage under "sfx:on".

type SfxName = "click" | "hover" | "open" | "close" | "stamp" | "paper";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let hydrated = false;

export function hydrateEnabled(): boolean {
  if (hydrated || typeof window === "undefined") return enabled;
  hydrated = true;
  const v = window.localStorage.getItem("sfx:on");
  enabled = v === null ? true : v === "1";
  return enabled;
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      (window.AudioContext as typeof AudioContext | undefined) ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.14;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.5,
  slideTo?: number,
) {
  const c = ensureCtx();
  if (!c || !master) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + duration);
  }
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g).connect(master);
  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
}

function noise(
  duration: number,
  gain = 0.3,
  filterHz = 2000,
  filterType: BiquadFilterType = "bandpass",
  q = 1,
) {
  const c = ensureCtx();
  if (!c || !master) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  const filt = c.createBiquadFilter();
  filt.type = filterType;
  filt.frequency.value = filterHz;
  filt.Q.value = q;
  src.connect(filt).connect(g).connect(master);
  src.start();
  src.stop(c.currentTime + duration);
}

export function play(name: SfxName) {
  if (!enabled) return;
  switch (name) {
    case "click":
      // soft muted paper tap — a very short low-mid noise pop, no tonal ping
      noise(0.045, 0.28, 900, "lowpass", 0.4);
      break;
    case "hover":
      // soft muted wooden "tock" — quiet, warm, no hiss
      noise(0.025, 0.12, 1500, "bandpass", 3);
      break;
    case "open":
      // page turn: quick swoosh, warm and dry
      noise(0.22, 0.22, 2200, "bandpass", 0.6);
      noise(0.09, 0.14, 800, "lowpass", 0.4);
      break;
    case "close":
      // soft folder close — muted low thump
      noise(0.12, 0.24, 500, "lowpass", 0.5);
      break;
    case "stamp":
      // wooden stamp: dry knock + tiny paper crunch
      noise(0.06, 0.55, 220, "lowpass", 0.5);
      noise(0.05, 0.18, 4200, "highpass", 0.4);
      break;
    case "paper":
      noise(0.12, 0.11, 5600, "highpass", 0.4);
      break;
  }
}

export function isEnabled(): boolean {
  return enabled;
}

export function setEnabled(v: boolean) {
  enabled = v;
  hydrated = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("sfx:on", v ? "1" : "0");
    window.dispatchEvent(new CustomEvent("sfx:toggle", { detail: v }));
  }
  if (v) {
    // "boot" click so browser unlocks the audio context on the toggle gesture
    play("click");
  }
}

// Install a global delegated listener so every <button>/<a>/[role=button]
// gets a subtle click without wiring each component.
let installed = false;
export function installGlobalSfx() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const clickable = (t: EventTarget | null) => {
    if (!(t instanceof Element)) return null;
    return t.closest(
      'button, a[href], [role="button"], input[type="submit"], input[type="button"]',
    );
  };
  window.addEventListener(
    "pointerdown",
    (e) => {
      const el = clickable(e.target);
      if (!el) return;
      if (el.getAttribute("data-sfx") === "off") return;
      play("click");
    },
    { capture: true },
  );
}
