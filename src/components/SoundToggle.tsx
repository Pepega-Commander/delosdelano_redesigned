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
      className="fixed bottom-5 left-5 z-[60] flex items-center gap-2 border-2 border-ink bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-[0.24em] shadow-[4px_4px_0_var(--brutal)] transition-transform hover:-translate-y-[1px] hover:-translate-x-[1px]"
    >
      {on ? <Volume2 size={14} /> : <VolumeX size={14} />}
      <span>звук · {on ? "on" : "off"}</span>
    </button>
  );
}
