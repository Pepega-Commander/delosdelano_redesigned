import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Shell } from "@/components/Shell";
import { AuthGate } from "@/components/AuthGate";
import { planTemplates, accentClasses, type PlanTemplate } from "@/lib/plans-catalog";
import { store, type PlanProgress } from "@/lib/storage";

export const Route = createFileRoute("/plans/")({
  head: () => ({
    meta: [
      { title: "Планы — DeloSdelano" },
      { name: "description", content: "Каталог планов и архив пройденных." },
    ],
  }),
  component: PlansIndex,
});

function PlansIndex() {
  return (
    <Shell>
      <AuthGate title="Войдите, чтобы вести планы">{(name) => <Inner name={name} />}</AuthGate>
    </Shell>
  );
}

type PlanStatus =
  | { kind: "new" }
  | { kind: "active"; progress: number; done: number; total: number }
  | { kind: "finished"; times: number };

function Inner({ name }: { name: string }) {
  const [progress, setProgress] = useState<Record<string, PlanProgress>>({});
  const [archive, setArchive] = useState<PlanProgress[]>([]);

  useEffect(() => {
    setProgress(store.getAllPlanProgress());
    setArchive(store.getArchive());
  }, []);

  function statusFor(tpl: PlanTemplate): PlanStatus {
    const active = progress[tpl.id];
    if (active) {
      const total = tpl.chapterIndices.length;
      const done = active.completedChapters.length;
      return { kind: "active", progress: total ? done / total : 0, done, total };
    }
    const times = archive.filter((a) => (a.planId ?? "full") === tpl.id).length;
    if (times > 0) return { kind: "finished", times };
    return { kind: "new" };
  }

  const activeCount = Object.keys(progress).length;
  const finishedCount = archive.length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Editorial hero */}
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-terra">
        <span className="inline-block h-px w-8 bg-terra" />
        Каталог планов
      </div>
      <h1 className="text-balance mt-4 font-editorial text-5xl leading-[1.02] md:text-7xl">
        {name}, выберите план,
        <br />
        <span className="italic text-terra">с которым сегодня по пути.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-ink-soft">
        Каждый план — короткая книга из глав. Можно вести несколько параллельно, возвращаться к
        пройденным и начинать заново.
      </p>

      {/* Meta row */}
      <div className="mt-10 flex flex-wrap items-center gap-6 border-y border-border py-4 font-mono text-xs uppercase tracking-widest text-ink-soft">
        <span>
          Всего <span className="text-ink">{planTemplates.length}</span>
        </span>
        <span>·</span>
        <span>
          В процессе <span className="text-terra">{activeCount}</span>
        </span>
        <span>·</span>
        <span>
          Пройдено <span className="text-sage">{finishedCount}</span>
        </span>
      </div>

      {/* Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {planTemplates.map((tpl, idx) => (
          <PlanCard key={tpl.id} tpl={tpl} status={statusFor(tpl)} index={idx} />
        ))}
      </div>

      {finishedCount > 0 && (
        <section className="mt-20 border-t border-border pt-10">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-sage">Архив</div>
          <h2 className="mt-3 font-editorial text-3xl leading-tight md:text-4xl">
            Планы, которые вы уже прошли
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {archive
              .slice()
              .reverse()
              .map((p, i) => {
                const tpl = planTemplates.find((t) => t.id === (p.planId ?? "full"));
                return (
                  <li key={i}>
                    <Link
                      to="/plans/$planId"
                      params={{ planId: p.planId ?? "full" }}
                      className="warm-glow group block border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-[1px] hover:border-terra"
                      style={{ boxShadow: "var(--shadow-1)", borderRadius: "var(--radius-soft)" }}
                    >
                      <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                        Завершён{" "}
                        {p.finishedAt ? new Date(p.finishedAt).toLocaleDateString("ru-RU") : "—"}
                      </div>
                      <div className="mt-2 font-editorial text-lg leading-tight">
                        {tpl?.title ?? "План"}
                        <span
                          aria-hidden
                          className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </div>
                      {p.letter && (
                        <p
                          className="mt-3 font-hand text-lg leading-snug text-ink-soft"
                          style={{ fontFamily: "var(--font-hand)" }}
                        >
                          «{p.letter}»
                        </p>
                      )}
                      <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                        открыть снова
                      </div>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </div>
  );
}

function PlanCard({
  tpl,
  status,
  index,
}: {
  tpl: PlanTemplate;
  status: PlanStatus;
  index: number;
}) {
  const acc = accentClasses(tpl.accent);
  const total = tpl.chapterIndices.length;
  const pct =
    status.kind === "active"
      ? Math.round(status.progress * 100)
      : status.kind === "finished"
        ? 100
        : 0;

  const badge =
    status.kind === "active"
      ? { text: `В процессе · ${status.done}/${status.total}`, tone: "text-terra border-terra" }
      : status.kind === "finished"
        ? {
            text: status.times > 1 ? `Пройден ×${status.times}` : "Пройден",
            tone: "text-sage border-sage",
          }
        : { text: "Не начат", tone: "text-ink-soft border-border" };

  const cta =
    status.kind === "active"
      ? "Продолжить"
      : status.kind === "finished"
        ? "Пройти снова"
        : "Начать";

  return (
    <Link
      to="/plans/$planId"
      params={{ planId: tpl.id }}
      className="warm-glow group relative flex flex-col justify-between border border-border bg-card p-6 transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[2px] hover:border-terra"
      style={{
        boxShadow: "var(--shadow-1)",
        borderRadius: "var(--radius-soft)",
      }}
    >
      {/* Accent bar */}
      <span aria-hidden className={`absolute inset-x-0 top-0 h-[3px] ${acc.bg}`} />

      {/* Head */}
      <div>
        <div className="flex items-center justify-between">
          <div className={`font-mono text-xs uppercase tracking-widest ${acc.text}`}>{tpl.tag}</div>
          <span
            className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-xs uppercase tracking-widest ${badge.tone}`}
          >
            {status.kind === "finished" && <Check size={10} strokeWidth={3} />}
            {badge.text}
          </span>
        </div>

        {/* Decorative index */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-4 top-8 select-none font-editorial font-black leading-none text-ink"
          style={{ fontSize: "5.5rem", opacity: 0.05 }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        <h3 className="text-balance relative mt-6 font-editorial text-2xl leading-[1.1] md:text-[26px]">
          {tpl.title}
        </h3>
        <p className="mt-2 text-sm italic text-ink-soft">{tpl.subtitle}</p>
        <p className="mt-4 text-sm text-ink-soft">{tpl.intro}</p>
      </div>

      {/* Meta + progress */}
      <div className="mt-8">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-ink-soft">
          <span>
            {total} {total === 1 ? "глава" : total < 5 ? "главы" : "глав"}
          </span>
          <span>~{tpl.minutes} мин</span>
        </div>
        <div className="mt-3 h-[3px] w-full bg-paper-dark">
          <div
            className={`h-[3px] transition-all duration-500 ${acc.bg}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className={`font-editorial text-lg ${acc.text}`}>{cta}</span>
          <span
            aria-hidden
            className={`text-lg ${acc.text} transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5`}
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
