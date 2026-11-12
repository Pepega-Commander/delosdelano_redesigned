import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { hydrateEnabled, installGlobalSfx, setEnabled } from "@/lib/sfx";

export function SoundToggle() {
  const [mounted, setMounted] = useState(false);
  const [on, setOn] = useState<boolean>(false);

  useEffect(() => {
    setOn(hydrateEnabled());
    setMounted(true);
    installGlobalSfx();
    const sync = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    window.addEventListener("sfx:toggle", sync);
    return () => window.removeEventListener("sfx:toggle", sync);
  }, []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      data-sfx="off"
      onClick={() => {
        const next = !on;
        setOn(next);
        setEnabled(next);
      }}
      aria-label={on ? "Выключить звук" : "Включить звук"}
      aria-pressed={on}
      className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full border border-ink/15 bg-cream/90 px-3.5 py-2 text-[9px] uppercase tracking-[0.2em] text-ink/70 backdrop-blur-sm transition-colors hover:border-ink/30 hover:text-ink md:bottom-5 md:left-5"
    >
      {on ? <Volume2 size={14} /> : <VolumeX size={14} />}
      <span>звук · {on ? "on" : "off"}</span>
    </button>
  );
}
