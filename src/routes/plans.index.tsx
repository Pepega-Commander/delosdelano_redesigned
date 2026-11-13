import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Shell } from "@/components/Shell";
import { AuthGate } from "@/components/AuthGate";
import { DoodleSquiggle, DoodleStar } from "@/components/Doodles";
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
    <div className="relative mx-auto max-w-6xl px-6 py-16">
      <DoodleStar className="absolute right-6 top-12 hidden h-10 w-10 text-purple/40 md:block" />
      {/* Editorial hero */}
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-purple">
        <span className="inline-block h-px w-8 bg-purple/60" />
        Каталог планов
      </div>
      <h1 className="text-balance mt-4 text-[42px] leading-[1.06] font-light tracking-[-0.015em] md:text-[64px]">
        {name}, выберите план,
        <br />
        <span className="text-purple">с которым сегодня по пути.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-ink-soft">
        Каждый план — короткая книга из глав. Можно вести несколько параллельно, возвращаться к
        пройденным и начинать заново.
      </p>
      <DoodleSquiggle className="mt-4 h-5 w-28 text-purple/35" />

      {/* Meta row */}
      <div className="mt-10 flex flex-wrap items-center gap-6 rounded-xl border border-ink/10 bg-cream px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-ink-soft">
        <span>
          Всего <span className="text-ink">{planTemplates.length}</span>
        </span>
        <span className="text-ink/20">·</span>
        <span>
          В процессе <span className="text-purple">{activeCount}</span>
        </span>
        <span className="text-ink/20">·</span>
        <span>
          Пройдено <span className="text-ink">{finishedCount}</span>
        </span>
      </div>

      {/* Grid */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {planTemplates.map((tpl, idx) => (
          <PlanCard key={tpl.id} tpl={tpl} status={statusFor(tpl)} index={idx} />
        ))}
      </div>

      {finishedCount > 0 && (
        <section className="mt-20 border-t border-ink/10 pt-10">
          <div className="text-[10px] uppercase tracking-[0.2em] text-purple">Архив</div>
          <h2 className="mt-3 text-[30px] leading-tight font-light md:text-[36px]">
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
                      className="warm-glow group block rounded-xl border border-ink/10 bg-cream p-5 transition-all duration-200 hover:-translate-y-[1px] hover:border-purple/40"
                      style={{ boxShadow: "var(--shadow-1)" }}
                    >
                      <div className="text-[9px] uppercase tracking-[0.14em] text-ink-soft">
                        Завершён{" "}
                        {p.finishedAt ? new Date(p.finishedAt).toLocaleDateString("ru-RU") : "—"}
                      </div>
                      <div className="mt-2 text-[17px] leading-tight">
                        {tpl?.title ?? "План"}
                        <span
                          aria-hidden
                          className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </div>
                      {p.letter && (
                        <p className="mt-3 text-[14px] leading-snug text-ink-soft">«{p.letter}»</p>
                      )}
                      <div className="mt-2 text-[9px] uppercase tracking-[0.14em] text-purple">
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
      ? {
          text: `В процессе · ${status.done}/${status.total}`,
          tone: "text-purple border-purple/40 bg-purple/5",
        }
      : status.kind === "finished"
        ? {
            text: status.times > 1 ? `Пройден ×${status.times}` : "Пройден",
            tone: "text-ink border-lav/60 bg-lav/15",
          }
        : { text: "Не начат", tone: "text-ink-soft border-ink/12 bg-paper-soft" };

  const cta =
    status.kind === "active"
      ? "Продолжить"
      : status.kind === "finished"
        ? "Пройти снова"
        : "Начать";

  const isActive = status.kind === "active";
  const bandText = tpl.accent === "terra" || tpl.accent === "ink" ? "text-on-dark" : "text-ink";
  const band = isActive ? "bg-purple text-on-dark" : `${acc.bg} ${bandText}`;
  const main = isActive ? "bg-deep text-on-dark" : "bg-cream";
  const muted = isActive ? "text-on-dark/80" : "text-ink-soft";
  const subtitleTone = isActive ? "text-mint" : "text-purple";
  const divider = isActive ? "border-on-dark/20" : "border-ink/10";

  return (
    <Link
      to="/plans/$planId"
      params={{ planId: tpl.id }}
      className="warm-glow group relative flex overflow-hidden rounded-xl border border-ink/10 transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[2px] hover:border-purple/40"
      style={{ boxShadow: "var(--shadow-1)" }}
    >
      {/* Left band with the plan index */}
      <div
        className={`flex w-[58px] shrink-0 flex-col justify-between p-4 md:w-[76px] md:p-5 ${band}`}
      >
        <span className="text-[24px] leading-none font-light md:text-[32px]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          aria-hidden
          className={`text-[22px] leading-none transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1 ${
            isActive ? "text-on-dark/85" : "text-ink/65"
          }`}
        >
          →
        </span>
      </div>

      {/* Main content */}
      <div className={`flex flex-1 flex-col p-6 md:p-7 ${main}`}>
        <div className="flex items-start justify-between gap-3">
          <div
            className={`text-[9px] uppercase tracking-[0.16em] ${isActive ? "text-mint/80" : acc.text}`}
          >
            {tpl.tag}
          </div>
          <span
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] ${
              isActive
                ? "border-on-dark/25 text-on-dark/80"
                : status.kind === "finished"
                  ? "border-purple/40 text-purple"
                  : "border-ink/12 text-ink-soft"
            }`}
          >
            {status.kind === "finished" && <Check size={10} strokeWidth={3} />}
            {badge.text}
          </span>
        </div>

        <h3 className="text-balance mt-5 text-[24px] leading-[1.15] font-light md:text-[27px]">
          {tpl.title}
        </h3>
        <p className={`mt-2 text-[12.5px] leading-snug ${subtitleTone}`}>{tpl.subtitle}</p>
        <p className={`mt-4 text-[12.5px] leading-[1.7] ${muted}`}>{tpl.intro}</p>

        <div className="mt-auto pt-6">
          <div
            className={`flex items-center justify-between border-t pt-3 text-[9px] uppercase tracking-[0.12em] ${divider} ${muted}`}
          >
            <span>
              {total} {total === 1 ? "глава" : total < 5 ? "главы" : "глав"}
            </span>
            <span>~{tpl.minutes} мин</span>
          </div>
          {pct > 0 && (
            <div
              className={`mt-3 h-1 w-full overflow-hidden rounded-full ${isActive ? "bg-on-dark/20" : "bg-mint/70"}`}
            >
              <div
                className={`h-1 rounded-full transition-all duration-500 ${isActive ? "bg-mint" : acc.bg}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-[11px] transition-colors ${
                isActive
                  ? "border-mint/60 text-mint group-hover:bg-mint group-hover:text-deep"
                  : "border-ink/15 text-ink group-hover:border-purple/40 group-hover:text-purple"
              }`}
            >
              {cta} <span aria-hidden>↗</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
