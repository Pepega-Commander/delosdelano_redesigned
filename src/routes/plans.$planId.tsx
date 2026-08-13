import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Shell } from "@/components/Shell";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { getPlanTemplate, planChapters, accentClasses } from "@/lib/plans-catalog";
import type { ChapterMedia } from "@/lib/plan-data";
import { store, type PlanProgress } from "@/lib/storage";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export const Route = createFileRoute("/plans/$planId")({
  head: ({ params }) => {
    const t = getPlanTemplate(params.planId);
    return {
      meta: [
        { title: `${t?.title ?? "План"} — DeloSdelano` },
        { name: "description", content: t?.intro ?? "План из глав, чтобы сдвинуться." },
      ],
    };
  },
  loader: ({ params }) => {
    const t = getPlanTemplate(params.planId);
    if (!t) throw notFound();
    return { planId: params.planId };
  },
  notFoundComponent: () => (
    <Shell>
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-terra">404</div>
        <h1 className="mt-3 font-editorial text-4xl">Такого плана нет</h1>
        <Link to="/plans" className="btn-link mt-6 inline-block">
          К каталогу →
        </Link>
      </div>
    </Shell>
  ),
  errorComponent: ({ reset }) => (
    <Shell>
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-editorial text-3xl">Что-то пошло не так</h1>
        <button onClick={reset} className="btn-link mt-4">
          Попробовать снова
        </button>
      </div>
    </Shell>
  ),
  component: PlanReaderPage,
});

function PlanReaderPage() {
  const { planId } = Route.useParams();
  return (
    <Shell>
      <AuthGate title="Войдите, чтобы вести планы">
        {(name) => <Reader name={name} planId={planId} />}
      </AuthGate>
    </Shell>
  );
}

const IMPACT_SCALE: { value: number; size: number; tone: "sage" | "neutral" | "terra" }[] = [
  { value: 1, size: 56, tone: "sage" },
  { value: 2, size: 46, tone: "sage" },
  { value: 3, size: 38, tone: "sage" },
  { value: 4, size: 32, tone: "neutral" },
  { value: 5, size: 38, tone: "terra" },
  { value: 6, size: 46, tone: "terra" },
  { value: 7, size: 56, tone: "terra" },
];

const PROC_QUESTIONS: string[] = [
  "Я откладываю важные дела до последнего момента.",
  "Даже зная о дедлайне, я нахожу причины заняться чем-то другим.",
  "Мне сложно начать задачу, если она кажется большой или скучной.",
  "Я часто отвлекаюсь на соцсети, видео или мессенджеры вместо работы.",
  "Я говорю себе «сделаю завтра» и это повторяется несколько дней подряд.",
  "Из-за откладывания я испытываю тревогу, вину или стыд.",
  "Я жду «идеального момента» или «правильного настроения», чтобы начать.",
  "Мелкие задачи (письма, звонки, документы) копятся и давят.",
  "Я перестраиваю план и списки вместо того, чтобы делать саму задачу.",
  "Из-за прокрастинации страдают мои учёба, работа или отношения.",
];

function verdictFor(pct: number) {
  if (pct < 25)
    return {
      title: "Лёгкая прокрастинация",
      tone: "sage" as const,
      text: "Вы в целом справляетесь. Небольшие сбои случаются, но не мешают жить.",
    };
  if (pct < 50)
    return {
      title: "Умеренная прокрастинация",
      tone: "sage" as const,
      text: "Откладывание бывает регулярно, но вы возвращаетесь к делам. Стоит поработать со стартом задач.",
    };
  if (pct < 75)
    return {
      title: "Сильная прокрастинация",
      tone: "terra" as const,
      text: "Откладывание уже влияет на результаты и самочувствие. План из глав — как раз для вас.",
    };
  return {
    title: "Хроническая прокрастинация",
    tone: "terra" as const,
    text: "Похоже, прокрастинация мешает вам ежедневно. Идите главами по одной и не пропускайте самопроверку.",
  };
}

function Reader({ name, planId }: { name: string; planId: string }) {
  const nav = useNavigate();
  const tpl = getPlanTemplate(planId)!;
  const chapters = planChapters(planId);
  const acc = accentClasses(tpl.accent);
  const [ch, setCh] = useState(0);
  const [progress, setProgress] = useState<PlanProgress>({
    planId,
    startedAt: Date.now(),
    completedChapters: [],
  });
  const [letter, setLetter] = useState("");
  const [revealed, setRevealed] = useState(1);
  const [impact, setImpact] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>(() => Array(PROC_QUESTIONS.length).fill(0));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const q = store.getQuiz();
    if (q) {
      setImpact(q.impact ?? 0);
      if (Array.isArray(q.answers) && q.answers.length === PROC_QUESTIONS.length) {
        setAnswers(q.answers);
      }
    }
  }, []);

  useEffect(() => {
    const p = store.getPlanProgress(planId);
    if (p) setProgress(p);
    else
      store.setPlanProgress(planId, {
        planId,
        startedAt: Date.now(),
        completedChapters: [],
      });
  }, [planId]);

  const chapter = chapters[ch];
  const isNoticeChapter = chapter?.title.includes("Заметить") ?? false;

  function setAnswer(idx: number, value: number) {
    const next = answers.slice();
    next[idx] = value;
    setAnswers(next);
    const answered = next.filter((v) => v > 0);
    if (answered.length === next.length) {
      const sum = next.reduce((a, b) => a + b, 0);
      const pct = Math.round((sum / (next.length * 7)) * 100);
      const impactVal = Math.max(1, Math.min(10, Math.round(pct / 10)));
      setImpact(impactVal);
      const existing = store.getQuiz();
      store.setQuiz({
        type: existing?.type ?? "avoider",
        trigger: existing?.trigger ?? "",
        takenAt: Date.now(),
        answers: next,
        impact: impactVal,
      });
    }
  }

  const answeredCount = answers.filter((v) => v > 0).length;
  const allAnswered = answeredCount === PROC_QUESTIONS.length;
  const totalScore = answers.reduce((a, b) => a + b, 0);
  const procPercent = allAnswered
    ? Math.round((totalScore / (PROC_QUESTIONS.length * 7)) * 100)
    : 0;
  const verdict = verdictFor(procPercent);

  const percent = (progress.completedChapters.length / chapters.length) * 100;
  const isDone = progress.completedChapters.includes(ch);
  const allDone = progress.completedChapters.length === chapters.length;
  const totalBlocks = chapter?.body.length ?? 0;
  const allBlocksRevealed = revealed >= totalBlocks;

  useEffect(() => {
    setRevealed(1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [ch]);

  function mark() {
    if (isDone) return;
    const next: PlanProgress = {
      ...progress,
      planId,
      completedChapters: [...progress.completedChapters, ch],
    };
    setProgress(next);
    store.setPlanProgress(planId, next);
    store.addNotification(`${name}, глава «${chapter.title}» отмечена.`);
  }

  function nextBlock() {
    if (revealed < totalBlocks) setRevealed(revealed + 1);
  }

  function goNextChapter() {
    if (!isDone) mark();
    if (ch < chapters.length - 1) setCh(ch + 1);
  }

  function finish() {
    const done: PlanProgress = { ...progress, planId, finishedAt: Date.now(), letter };
    store.archivePlanProgress(planId, done);
    store.addNotification(`${name}, план «${tpl.title}» завершён. Так держать!`);
    nav({ to: "/done" });
  }

  if (!chapter) return null;

  return (
    <div
      className="mx-auto grid max-w-6xl gap-0 px-0"
      style={{ gridTemplateColumns: sidebarOpen ? "280px 1fr" : "0 1fr" }}
    >
      {/* Sidebar */}
      <aside
        className={[
          "border-r border-border bg-paper-dark/40 md:sticky md:top-[73px] md:h-[calc(100vh-73px)] md:overflow-y-auto transition-all duration-300",
          sidebarOpen
            ? "w-[280px] opacity-100"
            : "w-0 -translate-x-2 overflow-hidden opacity-0 pointer-events-none border-transparent",
        ].join(" ")}
        aria-hidden={!sidebarOpen}
      >
        <div className="px-6 py-8">
          <div className="mb-4 flex items-center justify-between">
            <Link
              to="/plans"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-terra"
            >
              <ChevronLeft size={12} /> Каталог
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Свернуть боковую панель"
              className="rounded-sm p-1 text-ink-soft transition-colors hover:bg-paper-dark hover:text-terra"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          <div className={`mt-6 font-mono text-xs uppercase tracking-widest ${acc.text}`}>
            {tpl.tag}
          </div>
          <div className="mt-2 font-editorial text-xl leading-tight">{tpl.title}</div>

          <div className="mt-5">
            <div className="h-1 w-full bg-paper-dark">
              <div
                className={`h-1 ${acc.bg} transition-all duration-500`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-2 font-mono text-xs text-ink-soft">
              {progress.completedChapters.length} / {chapters.length} пройдено
            </div>
          </div>

          <nav className="relative mt-8 flex flex-col gap-1 pl-4">
            <span aria-hidden className="absolute left-[10px] top-2 bottom-2 w-px bg-border" />
            <span
              aria-hidden
              className={`absolute left-[10px] top-2 w-px ${acc.bg} transition-all duration-500`}
              style={{ height: `calc(${percent}% - 4px)` }}
            />
            {chapters.map((c, i) => {
              const done = progress.completedChapters.includes(i);
              const active = i === ch;
              return (
                <button
                  key={i}
                  onClick={() => setCh(i)}
                  className={[
                    "group flex items-start gap-3 rounded-sm px-3 py-3 text-left transition-colors",
                    active
                      ? "bg-paper-dark text-ink"
                      : "text-ink-soft hover:bg-paper-dark/60 hover:text-ink",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                      done
                        ? "border-sage bg-sage text-primary-foreground"
                        : active
                          ? `${acc.border} ${acc.bg} text-primary-foreground`
                          : "border-border bg-card",
                    ].join(" ")}
                  >
                    {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="font-serif text-sm leading-snug">
                    {c.title.replace(/^Глава [IVX]+\.\s*/, "")}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative min-w-0 px-6 py-12 md:px-12 md:py-16">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Развернуть боковую панель"
            className="sticky top-[85px] z-20 -ml-2 mb-4 inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 font-mono text-xs uppercase tracking-widest text-ink-soft shadow-[var(--shadow-1)] transition-colors hover:border-terra hover:text-terra"
          >
            <PanelLeftOpen size={14} /> Оглавление
          </button>
        )}
        <div className="mx-auto max-w-2xl">
          <div key={`hdr-${ch}`} className="animate-fade-in relative">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-8 -left-2 select-none font-editorial font-black leading-none text-ink"
              style={{ fontSize: "clamp(9rem, 18vw, 15rem)", opacity: 0.05 }}
            >
              {ROMAN[ch] ?? ch + 1}
            </span>
            <div className={`relative font-mono text-xs uppercase tracking-widest ${acc.text}`}>
              {isNoticeChapter ? (
                <>Глава {ch + 1} · самопроверка</>
              ) : (
                <>
                  Глава {ch + 1} · {chapter.body.length} блок
                  {chapter.body.length === 1 ? "" : chapter.body.length < 5 ? "а" : "ов"}
                </>
              )}
            </div>
            <h1 className="text-balance relative mt-3 font-editorial text-4xl font-bold leading-[1.05] md:text-6xl">
              {chapter.title}
            </h1>
            <p className="text-pretty relative mt-3 font-serif text-lg italic text-ink-soft">
              {chapter.subtitle}
            </p>
          </div>

          <article className="mt-10 space-y-10">
            {chapter.heroMedia && !isNoticeChapter && (
              <ChapterMediaBlock media={chapter.heroMedia} />
            )}
            {!isNoticeChapter &&
              chapter.body.slice(0, revealed).map((p, i) => (
                <div key={`${ch}-${i}`} className="animate-reveal-block">
                  {i > 0 && (
                    <div
                      aria-hidden
                      className="mx-auto mb-10 flex items-center justify-center gap-3 text-ink-muted-2"
                    >
                      <span className="h-px w-16 bg-border" />
                      <span className="rotate-45 text-xs">◆</span>
                      <span className="h-px w-16 bg-border" />
                    </div>
                  )}
                  <p className="text-pretty text-lg leading-relaxed">{p}</p>
                  {chapter.media
                    ?.filter((m) => m.afterBlock === i)
                    .map((m, mi) => (
                      <ChapterMediaBlock key={`m-${ch}-${i}-${mi}`} media={m} />
                    ))}
                </div>
              ))}
          </article>

          {isNoticeChapter && (
            <section
              className="mt-12 border border-border bg-paper-soft p-6 md:p-8"
              style={{ borderRadius: "var(--radius-soft)" }}
            >
              <div className={`font-mono text-xs uppercase tracking-widest ${acc.text}`}>
                Самопроверка
              </div>
              <h2 className="text-balance mt-2 font-editorial text-2xl leading-snug md:text-3xl">
                Насколько сильно вы прокрастинируете?
              </h2>
              <p className="mt-3 text-sm text-ink-soft">
                Ответьте на {PROC_QUESTIONS.length} утверждений. Слева — «совсем не про меня»,
                справа — «это полностью я». В конце получите процент.
              </p>

              <div className="mt-6 h-1 w-full bg-paper-dark">
                <div
                  className={`h-1 ${acc.bg} transition-all duration-300`}
                  style={{ width: `${(answeredCount / PROC_QUESTIONS.length) * 100}%` }}
                />
              </div>
              <div className="mt-2 font-mono text-xs text-ink-soft">
                {answeredCount} / {PROC_QUESTIONS.length} отвечено
              </div>

              <ol className="mt-8 space-y-10">
                {PROC_QUESTIONS.map((q, qi) => {
                  const picked = answers[qi] ?? 0;
                  return (
                    <li
                      key={qi}
                      className="border-t border-border/60 pt-6 first:border-t-0 first:pt-0"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`font-mono text-xs ${acc.text} mt-1`}>
                          {String(qi + 1).padStart(2, "0")}
                        </span>
                        <p className="text-pretty font-serif text-lg leading-snug">{q}</p>
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-2 md:gap-4">
                        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-sage sm:block whitespace-nowrap">
                          не про меня
                        </span>
                        <div className="flex flex-1 items-center justify-center gap-2 md:gap-4">
                          {IMPACT_SCALE.map(({ value, size, tone }) => {
                            const isPicked = picked === value;
                            const toneColor =
                              tone === "sage"
                                ? "var(--color-sage)"
                                : tone === "terra"
                                  ? "var(--color-terra)"
                                  : "var(--color-border)";
                            return (
                              <button
                                key={value}
                                onClick={() => setAnswer(qi, value)}
                                aria-label={`Вопрос ${qi + 1}, оценка ${value} из 7`}
                                className={[
                                  "impact-dot flex shrink-0 items-center justify-center rounded-full border-2 bg-card transition-all duration-200",
                                  isPicked
                                    ? "scale-110 shadow-[var(--shadow-2)]"
                                    : "hover:scale-110",
                                ].join(" ")}
                                style={{
                                  width: size * 0.75,
                                  height: size * 0.75,
                                  borderColor: toneColor,
                                  background: isPicked ? toneColor : undefined,
                                  ["--dot-tone" as string]: toneColor,
                                }}
                              >
                                {isPicked && (
                                  <Check
                                    size={Math.round(size * 0.35)}
                                    strokeWidth={3}
                                    className={
                                      tone === "neutral" ? "text-ink" : "text-primary-foreground"
                                    }
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-terra sm:block whitespace-nowrap">
                          это я
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-soft sm:hidden">
                        <span className="text-sage">не про меня</span>
                        <span className="text-terra">это я</span>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {allAnswered && (
                <div
                  className="animate-fade-in mt-10 border p-6 md:p-8"
                  style={{
                    borderRadius: "var(--radius-soft)",
                    borderColor:
                      verdict.tone === "terra" ? "var(--color-terra)" : "var(--color-sage)",
                    background: "var(--card)",
                  }}
                >
                  <div
                    className={`font-mono text-xs uppercase tracking-widest ${verdict.tone === "terra" ? "text-terra" : "text-sage"}`}
                  >
                    Ваш результат
                  </div>
                  <div className="mt-3 flex items-end gap-3">
                    <div
                      className="font-editorial font-bold leading-none"
                      style={{
                        fontSize: "clamp(3.5rem, 10vw, 6rem)",
                        color:
                          verdict.tone === "terra" ? "var(--color-terra)" : "var(--color-sage)",
                      }}
                    >
                      {procPercent}%
                    </div>
                    <div className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-soft">
                      уровень прокрастинации
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-paper-dark overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${procPercent}%`,
                        background:
                          verdict.tone === "terra" ? "var(--color-terra)" : "var(--color-sage)",
                      }}
                    />
                  </div>
                  <h3 className="mt-6 font-editorial text-2xl">{verdict.title}</h3>
                  <p className="mt-2 font-serif text-base leading-relaxed text-ink-soft">
                    {verdict.text}
                  </p>
                </div>
              )}
            </section>
          )}

          {!isNoticeChapter && (
            <div className="mt-10 flex items-center gap-2">
              {chapter.body.map((_, i) => (
                <span
                  key={i}
                  className={[
                    "h-1.5 rounded-full transition-all duration-300",
                    i < revealed ? `w-6 ${acc.bg}` : "w-3 bg-paper-dark",
                  ].join(" ")}
                />
              ))}
              <span className="ml-3 font-mono text-xs text-ink-soft">
                {Math.min(revealed, totalBlocks)} / {totalBlocks}
              </span>
            </div>
          )}

          <div className="mt-10">
            {isNoticeChapter ? (
              <div className="flex flex-wrap items-center gap-3">
                {ch < chapters.length - 1 ? (
                  <button
                    onClick={goNextChapter}
                    disabled={!allAnswered}
                    className={`group inline-flex items-center gap-3 ${acc.bg} px-7 py-3.5 font-editorial text-base text-primary-foreground shadow-[var(--shadow-2)] transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-warm)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`}
                    style={{ borderRadius: "var(--radius-soft)" }}
                  >
                    {isDone ? "Следующая глава" : "Отметить и продолжить"}
                    <span
                      aria-hidden
                      className="inline-block transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5"
                    >
                      →
                    </span>
                  </button>
                ) : (
                  !isDone && (
                    <button
                      onClick={mark}
                      disabled={!allAnswered}
                      className={`inline-flex items-center gap-3 ${acc.bg} px-7 py-3.5 font-editorial text-base text-primary-foreground shadow-[var(--shadow-2)] transition-all disabled:opacity-40`}
                      style={{ borderRadius: "var(--radius-soft)" }}
                    >
                      Отметить главу прочитанной
                    </button>
                  )
                )}
                {!allAnswered && (
                  <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                    Ответьте на все вопросы, чтобы продолжить
                  </span>
                )}
                {isDone && (
                  <span className="inline-flex items-center gap-2 font-mono text-xs text-sage">
                    <Check size={14} strokeWidth={3} /> Глава пройдена
                  </span>
                )}
              </div>
            ) : !allBlocksRevealed ? (
              <button
                onClick={nextBlock}
                className={`group inline-flex items-center gap-3 ${acc.bg} px-7 py-3.5 font-editorial text-base text-primary-foreground shadow-[var(--shadow-2)] transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-warm)] active:translate-y-0`}
                style={{ borderRadius: "var(--radius-soft)" }}
              >
                Далее
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5"
                >
                  →
                </span>
              </button>
            ) : (
              <div key={`end-${ch}`} className="animate-fade-in space-y-6">
                {chapter.quote && (
                  <aside className="relative my-6 py-8 text-center">
                    <span aria-hidden className={`mx-auto mb-5 block h-px w-24 ${acc.bg}`} />
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 select-none font-editorial italic leading-none ${acc.text}`}
                      style={{ fontSize: "6rem", opacity: 0.18 }}
                    >
                      “
                    </span>
                    <p className="text-balance mx-auto max-w-xl font-editorial text-2xl italic leading-snug md:text-3xl">
                      {chapter.quote.text}
                    </p>
                    <div
                      className={`mt-4 font-hand text-xl ${acc.text}`}
                      style={{ fontFamily: "var(--font-hand)" }}
                    >
                      — {chapter.quote.author}
                    </div>
                    <span aria-hidden className={`mx-auto mt-6 block h-px w-24 ${acc.bg}`} />
                  </aside>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {chapter.action && (
                    <Link
                      to="/focus"
                      className="inline-flex items-center rounded-md border border-border bg-card px-5 py-3 font-serif text-sm hover:border-terra"
                    >
                      Запустить таймер
                    </Link>
                  )}
                  {ch < chapters.length - 1 ? (
                    <button
                      onClick={goNextChapter}
                      className={`group inline-flex items-center gap-3 ${acc.bg} px-7 py-3.5 font-editorial text-base text-primary-foreground shadow-[var(--shadow-2)] transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-warm)]`}
                      style={{ borderRadius: "var(--radius-soft)" }}
                    >
                      {isDone ? "Следующая глава" : "Отметить и продолжить"}
                      <span
                        aria-hidden
                        className="inline-block transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5"
                      >
                        →
                      </span>
                    </button>
                  ) : (
                    !isDone && (
                      <button
                        onClick={mark}
                        className={`group inline-flex items-center gap-3 ${acc.bg} px-7 py-3.5 font-editorial text-base text-primary-foreground shadow-[var(--shadow-2)] transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-warm)]`}
                        style={{ borderRadius: "var(--radius-soft)" }}
                      >
                        Отметить главу прочитанной
                      </button>
                    )
                  )}
                  {isDone && (
                    <span className="inline-flex items-center gap-2 font-mono text-xs text-sage">
                      <Check size={14} strokeWidth={3} /> Глава пройдена
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {allDone && (
            <section
              className="animate-fade-in mt-20 bg-card p-8 md:p-10"
              style={{
                transform: "rotate(-0.4deg)",
                boxShadow: "var(--shadow-3)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="font-mono text-xs uppercase tracking-widest text-sage">
                Финал плана
              </div>
              <h2 className="mt-2 font-editorial text-3xl font-bold md:text-4xl">
                {name}, письмо себе
              </h2>
              <div
                className="mt-6 bg-paper-soft p-5"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, color-mix(in oklab, var(--terra) 25%, transparent) 31px, color-mix(in oklab, var(--terra) 25%, transparent) 32px)",
                }}
              >
                <textarea
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  rows={6}
                  className="w-full resize-none border-none bg-transparent font-hand text-2xl leading-[32px] outline-none placeholder:text-ink-muted-2"
                  style={{ fontFamily: "var(--font-hand)" }}
                  placeholder="Дорогой я, помни, что…"
                />
              </div>
              <div className="mt-6">
                <Button variant="hero" size="xl" onClick={finish}>
                  Завершить дело →
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function ChapterMediaBlock({ media }: { media: ChapterMedia }) {
  const isVideo = media.type === "video";
  const isEmbed = isVideo && /(?:youtube\.com|youtu\.be|vimeo\.com|player\.)/i.test(media.url);
  return (
    <figure className="my-8">
      <div
        className="overflow-hidden border border-border bg-paper-soft"
        style={{ borderRadius: "var(--radius-soft)", boxShadow: "var(--shadow-1)" }}
      >
        {isVideo ? (
          isEmbed ? (
            <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                src={media.url}
                title={media.caption ?? "video"}
                className="absolute inset-0 h-full w-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video src={media.url} controls playsInline className="block h-auto w-full" />
          )
        ) : (
          <img
            src={media.url}
            alt={media.alt ?? media.caption ?? ""}
            loading="lazy"
            className="block h-auto w-full"
          />
        )}
      </div>
      {media.caption && (
        <figcaption className="mt-3 text-center font-serif text-sm italic text-ink-soft">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
}
