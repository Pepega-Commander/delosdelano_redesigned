import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Shell } from "@/components/Shell";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { chapters, specialists, type Specialist } from "@/lib/plan-data";
import { store, type PlanProgress } from "@/lib/storage";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

export const Route = createFileRoute("/done")({
  head: () => ({
    meta: [
      { title: "Дело сделано — DeloSdelano" },
      {
        name: "description",
        content: "Поздравляем с завершением плана и подбираем специалистов под ваш тип.",
      },
    ],
  }),
  component: DonePage,
});

function DonePage() {
  return (
    <Shell>
      <AuthGate title="Войдите, чтобы увидеть результат">
        {(name) => <Inner name={name} />}
      </AuthGate>
    </Shell>
  );
}

function Inner({ name }: { name: string }) {
  const [last, setLast] = useState<PlanProgress | null>(null);
  const [quizType, setQuizType] = useState<string | undefined>(undefined);

  useEffect(() => {
    const arch = store.getArchive();
    setLast(arch[arch.length - 1] ?? null);
    setQuizType(store.getQuiz()?.type);
  }, []);

  const started = last?.startedAt;
  const finished = last?.finishedAt;
  const days =
    started && finished
      ? Math.max(1, Math.round((finished - started) / (1000 * 60 * 60 * 24)))
      : null;

  const matched = quizType
    ? specialists.filter((s) => s.types.includes(quizType as Specialist["types"][number]))
    : specialists;
  const list = matched.length ? matched : specialists;

  function scrollToSpecialists() {
    document.getElementById("specialists")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <section className="min-h-[80vh] flex flex-col justify-center animate-fade-in">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-sage">
          <span className="inline-block h-px w-8 bg-sage" />
          Финал
        </div>
        <h1 className="text-balance mt-4 font-editorial text-5xl leading-[1.02] md:text-7xl">
          {name}, поздравляем.
          <br />
          <span className="italic text-terra">Дело сделано.</span>
        </h1>
        <p className="mt-6 text-lg text-ink-soft">
          Вы прошли все пять глав плана. Это уже не намерение — это факт.
        </p>

        <div className="mt-10 border border-border bg-card p-6">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">Начат</div>
              <div className="mt-1 font-serif text-lg">
                {started ? new Date(started).toLocaleDateString("ru-RU") : "—"}
              </div>
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                Завершён
              </div>
              <div className="mt-1 font-serif text-lg">
                {finished ? new Date(finished).toLocaleDateString("ru-RU") : "—"}
              </div>
            </div>
            {days !== null && (
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                  Длительность
                </div>
                <div className="mt-1 font-serif text-lg">{days} дн.</div>
              </div>
            )}
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">Глав</div>
              <div className="mt-1 font-serif text-lg">
                {chapters.length} / {chapters.length}
              </div>
            </div>
          </div>

          <ul className="mt-6 space-y-2">
            {chapters.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-primary-foreground">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="font-serif">
                  {c.title} — <span className="text-ink-soft italic">{c.subtitle}</span>
                </span>
              </li>
            ))}
          </ul>

          {last?.letter && (
            <div className="mt-6 border-t border-border pt-6">
              <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                Письмо себе
              </div>
              <p
                className="mt-3 font-hand text-2xl leading-snug"
                style={{ fontFamily: "var(--font-hand)" }}
              >
                «{last.letter}»
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <div className="font-mono text-xs uppercase tracking-widest text-terra">Сертификат</div>
          <p className="mt-3 font-serif text-2xl">
            Вы получили сертификат на консультацию со специалистом
          </p>
          <button
            onClick={scrollToSpecialists}
            className="mt-8 mx-auto flex flex-col items-center gap-2 text-terra hover:opacity-80"
          >
            <span className="font-mono text-xs uppercase tracking-widest">Кто может помочь</span>
            <ChevronDown className="animate-bounce" size={40} />
          </button>
        </div>
      </section>

      <section id="specialists" className="mt-16 pt-16 border-t border-border">
        <div className="font-mono text-xs uppercase tracking-widest text-terra">
          {quizType ? `Подобрано под ваш тип · ${quizType}` : "Специалисты"}
        </div>
        <h2 className="mt-3 font-serif text-4xl font-bold">Кому можно довериться</h2>
        <p className="mt-3 text-ink-soft">
          Прокручивайте вниз — карточки появляются одна за другой.
        </p>

        <div className="mt-10 space-y-6">
          {list.map((s, i) => (
            <SpecialistCard key={s.name} s={s} index={i} />
          ))}
        </div>

        <div className="mt-16 flex justify-center gap-3">
          <Link
            to="/deals"
            className="inline-flex items-center rounded-md border border-border bg-card px-5 py-3 font-serif text-sm hover:border-terra"
          >
            Новое дело
          </Link>
          <Link
            to="/plans"
            className="inline-flex items-center rounded-md border border-border bg-card px-5 py-3 font-serif text-sm hover:border-terra"
          >
            К архиву
          </Link>
        </div>
      </section>
    </div>
  );
}

function SpecialistCard({ s, index }: { s: Specialist; index: number }) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={[
        "border border-border bg-card p-6 transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
      style={{ transitionDelay: `${(index % 3) * 100}ms` }}
    >
      <div className="flex items-start gap-5">
        <img
          src={s.photo}
          alt={s.name}
          className="h-24 w-24 shrink-0 border border-border bg-paper-dark"
        />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs uppercase tracking-widest text-terra">
            {s.category} · {s.role}
          </div>
          <div className="mt-1 font-serif text-2xl font-bold">{s.name}</div>
          <p className="mt-2 text-sm text-ink-soft">{s.approach}</p>
          <a href={s.link} className="btn-link mt-3 inline-block text-sm">
            Записаться →
          </a>
        </div>
      </div>
    </div>
  );
}
