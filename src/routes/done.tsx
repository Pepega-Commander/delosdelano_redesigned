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
      <section className="animate-fade-in flex min-h-[80vh] flex-col justify-center">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-purple/80">
          <span className="inline-block h-px w-8 bg-purple/60" />
          Финал
        </div>
        <h1 className="text-balance mt-4 text-[44px] leading-[1.04] font-light tracking-[-0.02em] md:text-[68px]">
          {name}, поздравляем.
          <br />
          <span className="text-purple">Дело сделано.</span>
        </h1>
        <p className="mt-6 max-w-lg text-[15px] leading-[1.75] text-ink-soft">
          Вы прошли все пять глав плана. Это уже не намерение — это факт.
        </p>

        <div className="mt-10 rounded-2xl border border-ink/10 bg-cream p-6 shadow-[var(--shadow-1)] md:p-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[9px] uppercase tracking-[0.16em] text-ink-soft">Начат</div>
              <div className="mt-1.5 text-[17px] font-light">
                {started ? new Date(started).toLocaleDateString("ru-RU") : "—"}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.16em] text-ink-soft">Завершён</div>
              <div className="mt-1.5 text-[17px] font-light">
                {finished ? new Date(finished).toLocaleDateString("ru-RU") : "—"}
              </div>
            </div>
            {days !== null && (
              <div>
                <div className="text-[9px] uppercase tracking-[0.16em] text-ink-soft">
                  Длительность
                </div>
                <div className="mt-1.5 text-[17px] font-light">{days} дн.</div>
              </div>
            )}
            <div>
              <div className="text-[9px] uppercase tracking-[0.16em] text-ink-soft">Глав</div>
              <div className="mt-1.5 text-[17px] font-light">
                {chapters.length} / {chapters.length}
              </div>
            </div>
          </div>

          <ul className="mt-7 space-y-2.5 border-t border-ink/10 pt-6">
            {chapters.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple text-on-dark">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="leading-snug">
                  {c.title} — <span className="text-ink-soft">{c.subtitle}</span>
                </span>
              </li>
            ))}
          </ul>

          {last?.letter && (
            <div className="mt-6 rounded-xl bg-mint/60 p-5">
              <div className="text-[9px] uppercase tracking-[0.16em] text-ink/55">Письмо себе</div>
              <p className="mt-2 text-[20px] leading-snug text-ink/85">«{last.letter}»</p>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <div className="text-[10px] uppercase tracking-[0.18em] text-purple/80">Сертификат</div>
          <p className="mx-auto mt-3 max-w-md text-[20px] leading-snug font-light">
            Вы получили сертификат на консультацию со специалистом
          </p>
          <button
            onClick={scrollToSpecialists}
            className="mx-auto mt-8 flex flex-col items-center gap-2 text-purple transition-opacity hover:opacity-75"
          >
            <span className="text-[10px] uppercase tracking-[0.16em]">Кто может помочь</span>
            <ChevronDown className="animate-bounce" size={34} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      <section id="specialists" className="mt-16 border-t border-ink/10 pt-16">
        <div className="text-[10px] uppercase tracking-[0.18em] text-purple/75">
          {quizType ? `Подобрано под ваш тип · ${quizType}` : "Специалисты"}
        </div>
        <h2 className="mt-3 text-[32px] leading-tight font-light md:text-[40px]">
          Кому можно довериться
        </h2>
        <p className="mt-3 text-[13.5px] text-ink-soft">
          Прокручивайте вниз — карточки появляются одна за другой.
        </p>

        <div className="mt-10 space-y-4">
          {list.map((s, i) => (
            <SpecialistCard key={s.name} s={s} index={i} />
          ))}
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-3">
          <Link to="/deals" className="btn-outline">
            Новое дело
          </Link>
          <Link to="/plans" className="btn-outline">
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
        "rounded-xl border border-ink/10 bg-cream p-6 transition-all duration-700",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      ].join(" ")}
      style={{ transitionDelay: `${(index % 3) * 100}ms` }}
    >
      <div className="flex items-start gap-5">
        <img
          src={s.photo}
          alt={s.name}
          className="h-24 w-24 shrink-0 rounded-xl bg-mint object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-[0.16em] text-purple/75">
            {s.category} · {s.role}
          </div>
          <div className="mt-1.5 text-[22px] leading-tight font-light">{s.name}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{s.approach}</p>
          <a
            href={s.link}
            className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-purple transition-colors hover:text-ink"
          >
            Записаться →
          </a>
        </div>
      </div>
    </div>
  );
}
