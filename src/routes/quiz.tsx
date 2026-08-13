import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { questions, typeInfo, type OptionKey } from "@/lib/quiz-data";
import { store, type ProcType } from "@/lib/storage";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Опрос — DeloSdelano" },
      { name: "description", content: "8 вопросов, чтобы определить тип прокрастинации." },
    ],
  }),
  component: QuizPage,
});

// Персональный план по типу — сразу открывается после опроса.
const TYPE_TO_PLAN: Record<ProcType, string> = {
  perfectionist: "fear",
  anxious: "fear",
  avoider: "full",
  rebel: "full",
};

const HOTKEY_TO_KEY: Record<string, OptionKey> = {
  "1": "а",
  "2": "б",
  "3": "в",
  "4": "г",
  a: "а",
  b: "б",
  v: "в",
  g: "г",
};

function QuizPage() {
  const nav = useNavigate();
  // answers[i] = выбранная буква (а/б/в/г) → добавляет 1 очко соответствующему типу
  const [answers, setAnswers] = useState<Record<number, OptionKey>>({});
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Тизер с главной: подставляем выбранный тип в первый вопрос, где он есть.
    const first = sessionStorage.getItem("ap.firstAnswer") as ProcType | null;
    if (first) {
      sessionStorage.removeItem("ap.firstAnswer");
      const idx = questions.findIndex((q) => q.options.some((o) => o.type === first));
      if (idx >= 0) {
        const opt = questions[idx].options.find((o) => o.type === first);
        if (opt) {
          setAnswers({ [idx]: opt.key });
          setStep(idx);
        }
      }
    }
  }, []);

  const answered = Object.keys(answers).length;
  const total = questions.length;
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;

  const currentIdx = Math.min(step, total - 1);
  const currentQ = questions[currentIdx];
  const currentSelected = answers[currentIdx];

  function pick(qIndex: number, key: OptionKey) {
    setAnswers((prev) => ({ ...prev, [qIndex]: key }));
  }

  function goNext() {
    if (currentIdx < total - 1) setStep(currentIdx + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goPrev() {
    if (currentIdx > 0) setStep(currentIdx - 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Клавиатурные хоткеи 1..4 → варианты а/б/в/г для текущего вопроса.
  const pickForCurrent = useCallback(
    (key: OptionKey) => {
      pick(currentIdx, key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIdx, answers],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const mapped = HOTKEY_TO_KEY[e.key.toLowerCase()];
      if (!mapped) return;
      pickForCurrent(mapped);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickForCurrent]);

  function finish() {
    const counts: Record<ProcType, number> = {
      perfectionist: 0,
      avoider: 0,
      rebel: 0,
      anxious: 0,
    };
    Object.entries(answers).forEach(([k, key]) => {
      const q = questions[Number(k)];
      const opt = q.options.find((o) => o.key === key);
      if (opt) counts[opt.type] += 1;
    });
    const winner = (Object.keys(counts) as ProcType[]).reduce((a, b) =>
      counts[a] >= counts[b] ? a : b,
    );
    store.setQuiz({
      type: winner,
      trigger: typeInfo[winner].trigger,
      impact: 0, // определяется отдельно на шкале в главе III
      answers: [],
      takenAt: Date.now(),
    });
    const name = store.getUser()?.name;
    if (name)
      store.addNotification(`${name}, ты прошёл опрос! Твой тип — ${typeInfo[winner].name}.`);
    // Сразу открываем персональный план — без промежуточного экрана и без каталога.
    nav({ to: "/plans/$planId", params: { planId: TYPE_TO_PLAN[winner] } });
  }

  return (
    <Shell>
      {/* Hairline top progress line across the whole viewport */}
      <div
        aria-hidden
        className="fixed left-0 right-0 top-[73px] z-40 h-[2px] bg-terra transition-[width] duration-500 ease-[var(--ease-out-soft)]"
        style={{ width: `${progress}%` }}
      />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="sticky top-[73px] z-10 -mx-6 flex items-baseline justify-between border-b border-border bg-paper/85 px-6 py-3 backdrop-blur">
          <div className="font-mono text-xs uppercase tracking-widest text-terra">
            Опрос · тип прокрастинации
          </div>
          <div className="font-mono text-xs tabular-nums text-ink-soft">
            {String(currentIdx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-1.5">
          {questions.map((_, i) => (
            <span
              key={i}
              className={[
                "h-1 flex-1 rounded-full transition-all",
                answers[i] !== undefined
                  ? "bg-terra"
                  : i === currentIdx
                    ? "bg-terra/40"
                    : "bg-paper-dark",
              ].join(" ")}
            />
          ))}
        </div>

        <div
          key={currentIdx}
          className="animate-fade-in mt-10 border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-warm)]"
        >
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-xs uppercase tracking-widest text-terra">
              Вопрос {String(currentIdx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </div>
            <div className="hidden font-mono text-xs uppercase tracking-widest text-ink-muted-2 md:block">
              Клавиши 1–4
            </div>
          </div>
          <p className="text-balance mt-4 font-editorial text-2xl leading-snug md:text-3xl">
            {currentQ.question}
          </p>

          <div className="mt-8 grid gap-2">
            {currentQ.options.map((o) => {
              const isSel = currentSelected === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => pick(currentIdx, o.key)}
                  className={[
                    "group flex items-start gap-4 border px-4 py-4 text-left transition-all",
                    isSel
                      ? "border-terra bg-terra/10"
                      : "border-border bg-paper hover:border-terra/60 hover:bg-paper-dark/40",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm uppercase",
                      isSel
                        ? "border-terra bg-terra text-primary-foreground"
                        : "border-border bg-card text-ink-soft group-hover:border-terra/60",
                    ].join(" ")}
                  >
                    {o.key}
                  </span>
                  <span className="pt-1 font-serif text-base leading-snug md:text-lg">
                    {o.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="font-mono text-xs uppercase tracking-widest text-ink-soft transition-colors hover:text-terra disabled:cursor-not-allowed disabled:opacity-30"
          >
            ← Назад
          </button>
          {currentIdx < total - 1 ? (
            <Button
              variant="hero"
              size="xl"
              disabled={currentSelected === undefined}
              onClick={goNext}
            >
              Дальше →
            </Button>
          ) : (
            <Button variant="hero" size="xl" disabled={!allAnswered} onClick={finish}>
              {allAnswered
                ? "Открыть персональный план →"
                : `Ответьте на все (${answered}/${total})`}
            </Button>
          )}
        </div>
      </div>
    </Shell>
  );
}
