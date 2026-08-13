import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function readTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(t: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const t = readTheme();
    setTheme(t);
    applyTheme(t);
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const dark = theme === "dark";

  return (
    <button
      type="button"
      data-sfx="off"
      onClick={() => {
        const next: "light" | "dark" = dark ? "light" : "dark";
        setTheme(next);
        applyTheme(next);
        window.localStorage.setItem("theme", next);
      }}
      aria-label={dark ? "Светлая тема" : "Тёмная тема"}
      aria-pressed={dark}
      className="fixed bottom-5 left-[152px] z-[60] flex items-center gap-2 border-2 border-ink bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-[0.24em] shadow-[4px_4px_0_var(--brutal)] transition-transform hover:-translate-y-[1px] hover:-translate-x-[1px]"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
      <span>{dark ? "свет" : "тьма"}</span>
    </button>
  );
}
