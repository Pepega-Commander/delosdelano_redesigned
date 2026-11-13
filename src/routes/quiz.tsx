import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { DoodleStar } from "@/components/Doodles";
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
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
          {/* Left rail */}
          <aside className="lg:pt-10">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-purple">
              Опрос · тип прокрастинации
              <DoodleStar className="h-5 w-5 text-purple/50" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-[64px] leading-none font-light tracking-[-0.03em] text-ink md:text-[76px]">
                {String(currentIdx + 1).padStart(2, "0")}
              </span>
              <span className="text-[22px] font-light text-ink/55">
                / {String(total).padStart(2, "0")}
              </span>
            </div>
            <p className="mt-5 max-w-[260px] text-[13.5px] leading-[1.7] text-ink-soft">
              8 коротких вопросов. Ответьте честно — получите план, который работает именно для
              вашего типа.
            </p>
            <div className="mt-8 hidden text-[9px] uppercase tracking-[0.16em] text-ink-muted-2 lg:block">
              Анонимно · без регистрации
            </div>
            <p className="mt-3 hidden max-w-[240px] text-[12px] leading-relaxed text-ink-soft lg:block">
              Это не диагноз. Это инструмент самопознания.
            </p>
          </aside>

          {/* Question column */}
          <div>
            <div className="flex items-center gap-1.5">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={[
                    "h-1.5 flex-1 rounded-full transition-all",
                    answers[i] !== undefined
                      ? "bg-purple"
                      : i === currentIdx
                        ? "bg-purple/35"
                        : "bg-lav/25",
                  ].join(" ")}
                />
              ))}
            </div>

            <div
              key={currentIdx}
              className="animate-fade-in mt-6 rounded-2xl border border-ink/10 bg-cream p-6 shadow-[var(--shadow-1)] md:p-10"
            >
              <div className="flex items-baseline justify-between">
                <div className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                  Вопрос {String(currentIdx + 1).padStart(2, "0")} /{" "}
                  {String(total).padStart(2, "0")}
                </div>
                <div className="hidden text-[9px] uppercase tracking-[0.16em] text-ink-muted-2 md:block">
                  Клавиши 1–4
                </div>
              </div>
              <p className="text-balance mt-4 text-[24px] leading-[1.35] font-light md:text-[30px]">
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
                        "group flex items-start gap-4 rounded-xl border px-4 py-4 text-left transition-all",
                        isSel
                          ? "border-purple bg-mint"
                          : "border-ink/10 bg-paper-soft hover:border-purple/35 hover:bg-mint/25",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm uppercase",
                          isSel
                            ? "border-purple bg-purple text-on-dark"
                            : "border-ink/15 bg-cream text-ink-soft group-hover:border-purple/50",
                        ].join(" ")}
                      >
                        {o.key}
                      </span>
                      <span className="pt-1 text-[14.5px] leading-snug md:text-[15.5px]">
                        {o.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                onClick={goPrev}
                disabled={currentIdx === 0}
                className="text-[10px] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-purple disabled:cursor-not-allowed disabled:opacity-30"
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
        </div>
      </div>
    </Shell>
  );
}
