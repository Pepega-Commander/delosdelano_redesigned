import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";
import { specialists } from "@/lib/plan-data";
import slide1 from "@/assets/slide-1.jpg";
import slide2 from "@/assets/slide-2.jpg";
import slide3 from "@/assets/slide-3.jpg";
import slide4 from "@/assets/slide-4.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeloSdelano — разберитесь со страхом, а не с ленью" },
      {
        name: "description",
        content:
          "Определите свой тип прокрастинации, получите план и слушайте истории тех, кто справился. Без регистрации.",
      },
      { property: "og:title", content: "DeloSdelano" },
      {
        property: "og:description",
        content: "Прокрастинация — не лень. Это страх. Разберитесь с ним.",
      },
    ],
  }),
  component: Index,
});

const slides = [
  {
    tag: "Выпуск №1",
    title: "Перестань откладывать.",
    accent: "Начни сейчас.",
    sub: "",
    image: slide1,
  },
  {
    tag: "О проекте · 01",
    title: "Мы не продаём мотивацию.",
    accent: "Мы разбираемся в причинах.",
    sub: "Четыре типа прокрастинации. Каждый — со своим триггером и своим планом.",
    image: slide2,
  },
  {
    tag: "О проекте · 02",
    title: "Без давления и напоминаний.",
    accent: "Только мягкий дневник.",
    sub: "Тихий ритм: короткие сессии, честные заметки, никакого шума уведомлений.",
    image: slide3,
  },
  {
    tag: "О проекте · 03",
    title: "Инструмент, а не диагноз.",
    accent: "Свидетельства, а не рецепты.",
    sub: "Мы собираем истории людей, которые нашли, как жить с этим — и делимся ими.",
    image: slide4,
  },
];

function Index() {
  const [slide, setSlide] = useState(0);
  const quizSectionRef = useRef<HTMLElement | null>(null);
  const specRailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, []);

  const s = slides[slide];

  return (
    <Shell showFooter>
      {/* SECTION 1 — HERO SLIDER */}
      <section className="relative h-[85vh] min-h-[520px] overflow-hidden bg-paper">
        {slides.map((sl, i) => (
          <div
            key={i}
            aria-hidden={i !== slide}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-[var(--ease-out-soft)] ${i === slide ? "opacity-100" : "opacity-0"}`}
          >
            <img
              key={`img-${i}-${i === slide ? slide : "idle"}`}
              src={sl.image}
              alt=""
              width={1920}
              height={1280}
              loading={i === 0 ? "eager" : "lazy"}
              className={`h-full w-full object-cover ${i === slide ? "animate-ken-burns" : ""}`}
              style={{ filter: "sepia(0.25) saturate(0.85) contrast(0.95)" }}
            />
            {/* Paper-toned wash + left-side gradient for text legibility */}
            <div className="absolute inset-0 bg-paper/45 mix-blend-multiply" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, var(--paper) 0%, color-mix(in oklab, var(--paper) 85%, transparent) 45%, transparent 75%)",
              }}
            />
            {/* Dotted grid — poster feel */}
            <div
              className="pointer-events-none absolute inset-0 opacity-55"
              style={{
                backgroundImage:
                  "radial-gradient(circle, color-mix(in oklab, var(--ink) 35%, transparent) 1px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            />
            {/* Subtle grain overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.18 0 0 0 0 0.16 0 0 0 0 0.14 0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              }}
            />
          </div>
        ))}

        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-6">
          <div
            key={slide}
            className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-ink-soft">
              {s.tag}
            </div>
            <h1 className="mt-6 font-display text-[2.25rem] font-black uppercase leading-[0.95] tracking-tight text-ink break-words sm:text-5xl md:text-7xl md:leading-[0.9]">
              {s.title}
              <br />
              <span className="marker mt-4 inline-block">{s.accent}</span>
            </h1>
            <div className="mt-8 h-[6px] w-24 bg-ink" />
            {s.sub && <p className="mt-6 max-w-xl text-lg text-ink-soft md:text-xl">{s.sub}</p>}
            {slide === 0 && (
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/focus" className="btn-link text-lg">
                  Прокрастинирую сейчас →
                </Link>
                <Link to="/quiz" className="btn-link text-lg">
                  Пройти опрос →
                </Link>
              </div>
            )}
          </div>
        </div>

        <button
          aria-label="Предыдущий"
          onClick={() => setSlide((slide - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 border border-border bg-paper/70 p-2 backdrop-blur-sm transition-all duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-[calc(50%+2px)] hover:border-terra hover:bg-paper/90"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          aria-label="Следующий"
          onClick={() => setSlide((slide + 1) % slides.length)}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 border border-border bg-paper/70 p-2 backdrop-blur-sm transition-all duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-[calc(50%+2px)] hover:border-terra hover:bg-paper/90"
        >
          <ChevronRight size={20} />
        </button>
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
          {slides.map((_, i) => {
            const active = i === slide;
            return (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Слайд ${i + 1}`}
                className={`relative h-[3px] overflow-hidden bg-ink/15 transition-all duration-500 ease-[var(--ease-out-soft)] ${active ? "w-14" : "w-6 hover:bg-ink/30"}`}
              >
                {active && (
                  <span
                    key={`fill-${slide}`}
                    className="animate-slide-progress absolute inset-0 block bg-terra"
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 2 — FACT CARDS (bento, brutal) */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-lg italic text-terra" style={{ fontFamily: "var(--font-editorial)" }}>
          — что мы знаем —
        </div>
        <h2 className="mt-3 font-display text-4xl font-black uppercase tracking-tight md:text-6xl">
          Прокрастинация в цифрах
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-4 md:grid-rows-2">
          <FactCard
            number="20%"
            title="Хроническая"
            desc="Каждый пятый взрослый — хронический прокрастинатор. Это не привычка, а устойчивая стратегия избегания."
            className="md:col-span-2 md:row-span-2"
            bg="bg-highlight"
            big
          />
          <FactCard
            number="88%"
            title="Студентов"
            desc="Признают, что регулярно откладывают учебные задачи."
            className="md:col-span-2"
            bg="bg-paper"
          />
          <FactCard
            number="×2"
            title="Стресс"
            desc="Уровень кортизола у прокрастинаторов почти вдвое выше в дни дедлайнов."
            className="md:col-span-1"
            bg="bg-paper-dark"
            tilt="-rotate-1"
          />
          <FactCard
            number="15′"
            title="Правило"
            desc="15 минут работы над «страшной» задачей снижают её сложность на 40%."
            className="md:col-span-1"
            bg="bg-ink text-paper"
          />
        </div>
      </section>

      {/* SECTION 3 — QUIZ TEASER */}
      <section
        ref={quizSectionRef}
        className="border-y-2 border-ink bg-paper-dark"
        aria-label="Приглашение к опросу"
      >
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-terra">Опрос</div>
          <h2
            className="mt-6 max-w-4xl text-5xl uppercase leading-[0.9] tracking-[-0.02em] text-ink md:text-8xl"
            style={{ fontFamily: "var(--font-archivo)" }}
          >
            Узнайте свой тип
            <br />
            прокрастинации
          </h2>
          <p className="mt-8 max-w-xl text-lg text-ink-soft md:text-xl">
            8 коротких вопросов. Ответьте честно — получите план, который работает именно для вашего
            типа.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-8">
            <Link
              to="/quiz"
              className="sun-glow group relative inline-flex items-center gap-4 border-2 border-ink bg-highlight px-10 py-6 transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px]"
              style={{
                boxShadow: "8px 8px 0 var(--brutal)",
                fontFamily: "var(--font-archivo)",
              }}
            >
              <span className="text-3xl uppercase tracking-[-0.01em] text-ink md:text-4xl">
                Начать опрос
              </span>
              <span
                aria-hidden
                className="text-3xl text-ink transition-transform duration-150 group-hover:translate-x-1 md:text-4xl"
              >
                →
              </span>
            </Link>

            <div className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
              Анонимно
              <br />
              Без регистрации
              <br />
              ~2&nbsp;минуты
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — STORIES (polaroid + tape) */}
      <StoriesSection />

      {/* SECTION 5 — SPECIALISTS (horizontal card rail) */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div
              className="text-sm uppercase tracking-[0.3em] text-terra"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              Специалисты
            </div>
            <h2
              className="mt-3 text-4xl uppercase leading-[0.95] tracking-[-0.02em] md:text-7xl"
              style={{ fontFamily: "var(--font-archivo)" }}
            >
              Когда пора обратиться
              <br />
              к&nbsp;человеку
            </h2>
          </div>
          <div className="hidden gap-2 md:flex">
            <button
              aria-label="Назад"
              onClick={() => specRailRef.current?.scrollBy({ left: -360, behavior: "smooth" })}
              className="border-2 border-ink bg-highlight p-3 transition-transform hover:-translate-y-[2px]"
              style={{ boxShadow: "3px 3px 0 var(--brutal)" }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              aria-label="Вперёд"
              onClick={() => specRailRef.current?.scrollBy({ left: 360, behavior: "smooth" })}
              className="border-2 border-ink bg-highlight p-3 transition-transform hover:-translate-y-[2px]"
              style={{ boxShadow: "3px 3px 0 var(--brutal)" }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Если прокрастинация тянется месяцами и влияет на здоровье, работу или отношения — техники
          не заменят разговор со специалистом.
        </p>

        <div
          ref={specRailRef}
          className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
        >
          {specialists.map((s) => (
            <article
              key={s.name}
              className="group flex w-[85%] shrink-0 snap-start flex-col border-2 border-ink bg-card sm:w-[340px]"
              style={{ boxShadow: "6px 6px 0 var(--brutal)" }}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden border-b-2 border-ink bg-paper-dark">
                <img
                  src={s.photo}
                  alt={s.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 border-2 border-ink bg-highlight px-2 py-0.5 font-mono text-xs uppercase tracking-widest text-ink">
                  {s.role}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                  {s.category} <span className="mx-1 opacity-40">|</span> Специалист
                </div>
                <h3
                  className="mt-3 text-2xl font-bold leading-tight"
                  style={{ fontFamily: "var(--font-editorial)" }}
                >
                  {s.name}
                </h3>
                <p className="mt-3 text-sm text-ink-soft">{s.approach}</p>
                <a
                  href={s.link}
                  className="mt-6 inline-flex items-center gap-2 self-start border-b-2 border-ink pb-1 font-mono text-xs uppercase tracking-widest text-ink hover:text-terra"
                >
                  Записаться <span aria-hidden>→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 border border-mustard bg-paper-dark p-5 text-sm text-ink-soft">
          <span className="font-mono text-xs uppercase tracking-widest text-terra">
            Дисклеймер ·{" "}
          </span>
          Мы не оказываем психологических услуг и не даём медицинских рекомендаций. Карточки
          специалистов приведены для ориентации. Всегда проверяйте квалификацию самостоятельно.
        </div>
      </section>
    </Shell>
  );
}

function FactCard({
  number,
  title,
  desc,
  className = "",
  bg = "bg-card",
  tilt = "",
  big = false,
}: {
  number: string;
  title: string;
  desc: string;
  className?: string;
  bg?: string;
  tilt?: string;
  big?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col justify-between border-2 border-ink p-6 ${bg} ${tilt} ${className}`}
      style={{ boxShadow: "6px 6px 0 var(--brutal)" }}
    >
      <div
        className={`font-display font-black leading-none tracking-tighter ${
          big ? "text-[8rem] md:text-[11rem]" : "text-6xl md:text-7xl"
        }`}
      >
        {number}
      </div>
      <div className="mt-6">
        <div className="font-display text-xl font-black uppercase tracking-tight">{title}</div>
        <p className="mt-2 text-sm opacity-80">{desc}</p>
      </div>
    </div>
  );
}

function StoryCard({
  photo,
  name,
  type,
  quote,
  result,
  rotate = "",
}: {
  photo: string;
  name: string;
  type: string;
  quote: string;
  result: string;
  rotate?: string;
}) {
  return (
    <article
      className={`relative border-2 border-ink bg-paper p-6 pt-8 transition-transform duration-300 hover:rotate-0 ${rotate}`}
    >
      <span className="tape" aria-hidden="true" />
      <img src={photo} alt={name} className="mx-auto h-40 w-40 border-2 border-ink bg-paper-dark" />
      <div className="mt-5 text-center">
        <div className="text-xl font-bold" style={{ fontFamily: "var(--font-editorial)" }}>
          {name}
        </div>
        <div className="mt-1 font-mono text-xs uppercase tracking-widest text-terra">{type}</div>
      </div>
      <p className="mt-5 font-serif text-lg italic leading-snug">«{quote}»</p>
      <div
        className="mt-5 border-t border-dashed border-ink pt-4 font-hand text-2xl text-terra"
        style={{ fontFamily: "var(--font-hand)" }}
      >
        — {result}
      </div>
    </article>
  );
}

// Asymmetric editorial stories layout: one big feature, one smaller side card.
function StoriesSection() {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();
  return (
    <section className="border-y-2 border-ink bg-paper-dark">
      <div
        ref={ref}
        className={`reveal-on-scroll mx-auto max-w-6xl px-6 py-24 ${visible ? "is-visible" : ""}`}
      >
        <div className="font-mono text-xs uppercase tracking-widest text-terra">Истории</div>
        <h2
          className="text-balance mt-4 text-5xl uppercase leading-[0.95] tracking-[-0.02em] md:text-8xl"
          style={{ fontFamily: "var(--font-archivo)" }}
        >
          Люди, которые нашли,
          <br />
          как жить с этим.
        </h2>

        {/* Two identical polaroid cards, mirrored tilts */}
        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2">
          <StoryCard
            photo="https://api.dicebear.com/9.x/notionists/svg?seed=Nastya&backgroundColor=D4A857"
            name="Настя, 29, редактор"
            type="Перфекционист"
            quote="Три года не могла закончить книгу, потому что каждый абзац казался недостаточно хорошим. Помогло правило «плохой первый черновик»."
            result="Книга вышла. Она несовершенна. Я жива."
            rotate="rotate-[-1deg]"
          />
          <StoryCard
            photo="https://api.dicebear.com/9.x/notionists/svg?seed=Dima&backgroundColor=6B8F71"
            name="Дима, 34, разработчик"
            type="Избегающий"
            quote="Каждое утро я открывал ноутбук и залипал в новости. Помогло странное: класть на стол один лист с одной задачей на день."
            result="Полгода без просрочек по клиентам."
            rotate="rotate-[1deg]"
          />
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();
  return (
    <section className="bg-paper">
      <div
        ref={ref}
        className={`reveal-on-scroll mx-auto max-w-4xl px-6 py-28 text-center md:py-36 ${visible ? "is-visible" : ""}`}
      >
        <span aria-hidden className="mx-auto mb-8 block h-px w-24 bg-terra" />
        <p className="text-balance font-editorial text-3xl italic leading-[1.15] md:text-5xl">
          Прокрастинация — не приговор, а сигнал. Начните с одного маленького шага сегодня.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/quiz"
            className="ink-glow group inline-flex items-center gap-3 bg-ink px-8 py-4 font-editorial text-lg text-primary-foreground shadow-[var(--shadow-3)] transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lift)]"
            style={{ borderRadius: "var(--radius-soft)" }}
          >
            Пройти опрос
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5"
            >
              →
            </span>
          </Link>
          <Link to="/focus" className="story-link font-editorial text-lg">
            Или запустить таймер сейчас
          </Link>
        </div>
        <span aria-hidden className="mx-auto mt-10 block h-px w-24 bg-terra" />
      </div>
    </section>
  );
}
