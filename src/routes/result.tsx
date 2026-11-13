import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { DoodleSquiggle, DoodleStar } from "@/components/Doodles";
import { Button } from "@/components/ui/button";
import { typeInfo } from "@/lib/quiz-data";
import { store, type QuizResult } from "@/lib/storage";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Результат — DeloSdelano" },
      { name: "description", content: "Ваш тип прокрастинации, триггер и оценка влияния." },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const [q, setQ] = useState<QuizResult | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setQ(store.getQuiz());
    setName(store.getUser()?.name ?? null);
  }, []);

  if (!q) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-6 py-20">
          <div className="eyebrow text-purple">Результат</div>
          <h1 className="mt-3 text-[36px] leading-tight font-light md:text-[44px]">
            Опрос не пройден
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-soft">
            Сначала ответьте на 8 вопросов, чтобы получить результат.
          </p>
          <Button asChild variant="hero" size="xl" className="mt-7">
            <Link to="/quiz">Начать опрос →</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const info = typeInfo[q.type];

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-purple">
          Диагностика · {new Date(q.takenAt).toLocaleDateString("ru-RU")}
          <DoodleStar className="h-5 w-5 text-purple/50" />
        </div>
        <h1 className="text-balance mt-4 text-[38px] leading-[1.1] font-light tracking-[-0.015em] md:text-[54px]">
          {name ? `${name}, твой тип — ` : "Ваш тип — "}
          <span className="text-purple">{info.name}</span>
        </h1>
        <DoodleSquiggle className="mt-4 h-5 w-32 text-purple/35" />

        <div className="mt-10 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-ink/10 bg-cream p-7 shadow-[var(--shadow-1)] md:p-9">
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">
              Ключевой триггер
            </div>
            <p className="mt-3 text-[24px] leading-snug font-light">{info.trigger}</p>
            <p className="mt-6 text-[14px] leading-[1.75] text-ink-soft">{info.description}</p>
          </div>

          <aside className="flex flex-col justify-between rounded-2xl bg-mint p-7 md:p-9">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink/70">Что дальше</div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
                Насколько сильно это влияет — вы оцените в главе III персонального плана.
              </p>
            </div>
            <Link
              to="/plans"
              className="mt-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-purple transition-colors hover:text-ink"
            >
              К персональному плану <span aria-hidden>→</span>
            </Link>
          </aside>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild variant="hero" size="xl">
            <Link to="/plans">Открыть персональный план →</Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link to="/quiz">Пройти заново</Link>
          </Button>
        </div>

        <p className="mt-16 border-t border-ink/10 pt-6 text-[13px] text-ink-soft">
          Это не диагноз. Это инструмент самопознания.
        </p>
      </div>
    </Shell>
  );
}
