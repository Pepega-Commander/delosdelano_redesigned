import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
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
          <h1 className="font-serif text-4xl font-bold">Опрос не пройден</h1>
          <p className="mt-3 text-ink-soft">
            Сначала ответьте на 8 вопросов, чтобы получить результат.
          </p>
          <Button asChild variant="hero" size="xl" className="mt-6">
            <Link to="/quiz">Начать опрос →</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const info = typeInfo[q.type];

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="font-mono text-xs uppercase tracking-widest text-terra">
          Диагностика · {new Date(q.takenAt).toLocaleDateString("ru-RU")}
        </div>
        <h1 className="mt-3 font-serif text-5xl font-bold leading-tight md:text-6xl">
          {name ? `${name}, твой тип — ` : "Ваш тип — "}
          <span className="italic text-terra">{info.name}</span>
        </h1>

        <div className="mt-10">
          <div className="paper-card">
            <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
              Ключевой триггер
            </div>
            <p className="mt-2 font-serif text-2xl">{info.trigger}</p>
            <p className="mt-6 text-ink-soft">{info.description}</p>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink-soft">
              Насколько сильно это влияет — вы оцените в главе III персонального плана.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild variant="hero" size="xl">
            <Link to="/plans">Открыть персональный план →</Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link to="/quiz">Пройти заново</Link>
          </Button>
        </div>

        <p
          className="mt-16 border-t border-border pt-6 font-hand text-xl text-ink-soft"
          style={{ fontFamily: "var(--font-hand)" }}
        >
          Это не диагноз. Это инструмент самопознания.
        </p>
      </div>
    </Shell>
  );
}
