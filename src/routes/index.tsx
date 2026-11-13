import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import {
  DoodleArrow,
  DoodleFlourish,
  DoodleLoop,
  DoodleSquiggle,
  DoodleStar,
  DoodleUnderline,
} from "@/components/Doodles";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";
import { specialists } from "@/lib/plan-data";
import { store, type ProcType } from "@/lib/storage";
import { typeInfo } from "@/lib/quiz-data";
import heroine from "@/assets/heroine.png";
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
    image: heroine,
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
    sub: "Мы собираем истории людей, которые нашли, как с этим жить — и делимся ими.",
    image: slide4,
  },
];

const QUIZ_ORDER: ProcType[] = ["perfectionist", "avoider", "rebel", "anxious"];

function Index() {
  const [slide, setSlide] = useState(0);
  const [quizType, setQuizType] = useState<ProcType | null>(null);

  useEffect(() => {
    setQuizType(store.getQuiz()?.type ?? null);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, []);

  const s = slides[slide];

  return (
    <Shell showFooter>
      {/* HERO */}
      <section className="mx-auto max-w-[1360px] px-5 pb-10 pt-8 md:px-8 md:pb-12 md:pt-12">
        <div className="relative">
          <DoodleFlourish className="-ml-1 mb-4 h-24 w-28 text-ink/45 md:-ml-3 md:h-28 md:w-32" />
          <DoodleStar className="absolute top-1 right-2 hidden h-10 w-10 text-purple/45 md:block" />

          <div className="eyebrow">{s.tag}</div>

          <div className="mt-8 grid items-center gap-10 md:mt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div className="relative">
              <h1 className="max-w-[650px] text-[40px] leading-[1.07] font-light tracking-[-0.015em] text-ink sm:text-[48px] md:text-[56px] lg:text-[62px]">
                {s.title}
                <span className="mt-5 block w-fit rounded-[10px] bg-purple px-5 py-3 text-[0.82em] leading-[1.08] text-on-dark shadow-[5px_5px_0_var(--deep)] sm:px-6 sm:py-3.5">
                  {s.accent}
                </span>
              </h1>

              {s.sub && (
                <p className="mt-6 max-w-[500px] text-[14px] leading-[1.75] text-ink-soft">
                  {s.sub}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link to="/quiz" className="btn-soft">
                  Пройти опрос
                  <ArrowUpRight size={16} strokeWidth={1.8} />
                </Link>
                <Link to="/focus" className="btn-ghost">
                  Прокрастинирую сейчас
                  <ArrowUpRight size={15} strokeWidth={1.8} />
                </Link>
              </div>

              <DoodleUnderline className="mt-5 h-9 w-36 text-ink/45" />
            </div>

            <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-cream sm:aspect-[5/6] lg:aspect-[1/1]">
                {slides.map((sl, i) => (
                  <img
                    key={i}
                    src={sl.image}
                    alt=""
                    width={1200}
                    height={1500}
                    loading={i === 0 ? "eager" : "lazy"}
                    aria-hidden={i !== slide}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-[var(--ease-out-soft)] ${
                      i === slide ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ filter: "saturate(0.92) contrast(0.98)" }}
                  />
                ))}

                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full bg-cream/85 px-4 py-2.5 backdrop-blur-sm">
                  <div className="pl-2 text-[11px] tracking-[0.14em] text-ink/70">
                    {String(slide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Предыдущий"
                      onClick={() => setSlide((slide - 1 + slides.length) % slides.length)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-lav/70 text-ink transition hover:bg-lav"
                    >
                      <ChevronLeft size={16} strokeWidth={1.8} />
                    </button>
                    <button
                      aria-label="Следующий"
                      onClick={() => setSlide((slide + 1) % slides.length)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-lav/70 text-ink transition hover:bg-lav"
                    >
                      <ChevronRight size={16} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hairline mt-12 flex items-center justify-between gap-6 pt-4">
            <DoodleSquiggle className="h-5 w-24 text-purple/40 md:w-32" />
            <a
              href="#facts"
              className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/65 transition-colors hover:text-purple"
            >
              Листайте дальше ↓
            </a>
          </div>
        </div>
      </section>

      {/* FACTS */}
      <section
        id="facts"
        className="relative mx-auto max-w-[1360px] px-5 pb-16 pt-12 md:px-8 md:pb-20 md:pt-14"
      >
        <DoodleLoop className="absolute right-6 top-8 hidden h-12 w-24 text-ink/35 lg:block" />
        <div className="eyebrow">— что мы знаем —</div>
        <h2 className="mt-4 text-[34px] leading-[1.12] font-light text-ink md:text-[48px]">
          Прокрастинация в цифрах
        </h2>
        <DoodleSquiggle className="mt-4 h-5 w-28 text-purple/40" />

        <div className="mt-9 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <FactCard
            number="20%"
            title="Хроническая"
            desc="Каждый пятый взрослый — хронический прокрастинатор. Это не привычка, а устойчивая стратегия избегания."
            tone="dark"
          />
          <FactCard
            number="88%"
            title="Студентов"
            desc="Признают, что регулярно откладывают учебные задачи."
            tone="cream"
          />
          <FactCard
            number="×2"
            title="Стресс"
            desc="Уровень кортизола у прокрастинаторов почти вдвое выше в дни дедлайнов."
            tone="cream"
          />
          <FactCard
            number="15′"
            title="Правило"
            desc="15 минут работы над «страшной» задачей снижают её сложность на 40%."
            tone="mint"
          />
        </div>
      </section>

      {/* QUIZ TEASER */}
      <section className="relative overflow-hidden bg-mint" aria-label="Приглашение к опросу">
        <DoodleArrow className="absolute bottom-4 right-6 hidden h-14 w-16 text-ink/30 lg:block" />
        <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[1fr_0.92fr]">
          <div>
            <div className="eyebrow">Опрос</div>
            <h2 className="mt-4 max-w-[520px] text-[34px] leading-[1.1] font-light text-ink md:text-[50px]">
              Узнайте свой тип прокрастинации
            </h2>
            <p className="mt-5 max-w-[460px] text-[13.5px] leading-[1.8] text-ink/80">
              8 коротких вопросов. Ответьте честно — получите план, который работает именно для
              вашего типа.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-6">
              <Link to="/quiz" className="btn-primary">
                Начать опрос
                <ArrowUpRight size={16} strokeWidth={1.8} />
              </Link>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] font-medium uppercase tracking-[0.16em] text-ink/65">
                <span>Анонимно</span>
                <span aria-hidden>·</span>
                <span>Без регистрации</span>
                <span aria-hidden>·</span>
                <span>~2 минуты</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {QUIZ_ORDER.map((type) => {
              const active = quizType === type;
              return (
                <Link
                  key={type}
                  to="/quiz"
                  className={`group flex items-center justify-between rounded-[8px] px-5 py-4 text-[16px] transition-colors ${
                    active ? "bg-purple text-on-dark" : "bg-cream text-ink hover:bg-cream/70"
                  }`}
                >
                  <span>{typeInfo[type].name}</span>
                  <ArrowRight
                    size={17}
                    strokeWidth={1.5}
                    className={
                      active
                        ? "text-on-dark/80"
                        : "text-ink/55 transition-transform duration-300 group-hover:translate-x-1"
                    }
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* STORIES */}
      <StoriesSection />

      {/* SPECIALISTS */}
      <SpecialistsSection />
    </Shell>
  );
}

function FactCard({
  number,
  title,
  desc,
  tone,
}: {
  number: string;
  title: string;
  desc: string;
  tone: "dark" | "cream" | "mint";
}) {
  const tones = {
    dark: "bg-purple text-on-dark",
    cream: "bg-cream text-ink",
    mint: "bg-mint text-ink",
  };
  return (
    <div
      className={`flex min-h-[230px] flex-col justify-between rounded-[10px] p-6 ${tones[tone]}`}
    >
      <div className="text-[54px] leading-none font-light tracking-[-0.02em] md:text-[58px]">
        {number}
      </div>
      <div className="mt-8">
        <div className="text-[12.5px] font-medium">{title}</div>
        <p className="mt-2 text-[11.5px] leading-[1.7] opacity-85">{desc}</p>
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
}: {
  photo: string;
  name: string;
  type: string;
  quote: string;
  result: string;
}) {
  return (
    <article className="flex gap-5 rounded-[10px] bg-cream p-5">
      <img
        src={photo.replace(/backgroundColor=[^&]+/, "backgroundColor=CADBD3")}
        alt={name}
        loading="lazy"
        className="h-[122px] w-[100px] shrink-0 rounded-[7px] bg-mint object-cover"
      />
      <div className="flex min-w-0 flex-col">
        <div className="text-[17px] leading-tight text-ink">{name}</div>
        <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-purple">
          {type}
        </div>
        <p className="mt-3 text-[12.5px] leading-[1.7] text-ink/85">«{quote}»</p>
        <div className="mt-auto pt-3 text-[10.5px] leading-relaxed text-ink/65">— {result}</div>
      </div>
    </article>
  );
}

function StoriesSection() {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();
  return (
    <section className="bg-cream/45">
      <div
        ref={ref}
        className={`reveal-on-scroll mx-auto max-w-[1360px] px-5 py-16 md:px-8 md:py-20 ${visible ? "is-visible" : ""}`}
      >
        <div className="flex items-center gap-4">
          <div className="eyebrow">Истории</div>
          <DoodleStar className="h-6 w-6 text-purple/50" />
        </div>
        <h2 className="mt-4 max-w-[760px] text-[34px] leading-[1.1] font-light text-ink md:text-[48px]">
          Люди, которые нашли, как жить с этим.
        </h2>

        <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2">
          <StoryCard
            photo="https://api.dicebear.com/9.x/notionists/svg?seed=Nastya&backgroundColor=E5D8C2"
            name="Настя, 29, редактор"
            type="Перфекционист"
            quote="Три года не могла закончить книгу, потому что каждый абзац казался недостаточно хорошим. Помогло правило «плохой первый черновик»."
            result="Книга вышла. Она несовершенна. Я жива."
          />
          <StoryCard
            photo="https://api.dicebear.com/9.x/notionists/svg?seed=Dima&backgroundColor=CADBD3"
            name="Дима, 34, разработчик"
            type="Избегающий"
            quote="Каждое утро я открывал ноутбук и залипал в новости. Помогло странное: класть на стол один лист с одной задачей на день."
            result="Полгода без просрочек по клиентам."
          />
        </div>
      </div>
    </section>
  );
}

function SpecialistsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const update = () => {
      setCanPrev(el.scrollLeft > 8);
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function move(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-specialist-card]");
    const step = card ? card.offsetWidth + 14 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <section className="relative overflow-hidden mx-auto max-w-[1360px] px-5 py-16 md:px-8 md:py-20">
      <DoodleLoop className="absolute right-8 top-10 hidden h-14 w-28 text-ink/35 lg:block" />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <div className="eyebrow">Специалисты</div>
            <DoodleStar className="h-6 w-6 text-purple/50" />
          </div>
          <h2 className="mt-4 max-w-[700px] text-[34px] leading-[1.1] font-light text-ink md:text-[48px]">
            Когда пора обратиться к человеку
          </h2>
          <p className="mt-4 max-w-[620px] text-[13.5px] leading-[1.8] text-ink/75">
            Если прокрастинация тянется месяцами и влияет на здоровье, работу или отношения —
            техники не заменят разговор со специалистом.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 pb-1">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={!canPrev}
            aria-label="Предыдущие специалисты"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-lav text-ink transition-colors hover:bg-purple hover:text-on-dark disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-lav disabled:hover:text-ink"
          >
            <ChevronLeft size={18} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={!canNext}
            aria-label="Следующие специалисты"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-lav text-ink transition-colors hover:bg-purple hover:text-on-dark disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-lav disabled:hover:text-ink"
          >
            <ChevronRight size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-smooth py-1"
        aria-label="Специалисты"
      >
        {specialists.map((sp) => (
          <article
            key={sp.name}
            data-specialist-card
            className="group flex w-[82%] shrink-0 snap-start flex-col rounded-[10px] bg-cream p-3.5 transition-transform duration-300 hover:-translate-y-1 sm:w-[47%] lg:w-[calc((100%-1.75rem)/3)] xl:w-[calc((100%-2.625rem)/4)]"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-[7px] bg-mint">
              <img
                src={sp.photo}
                alt={sp.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
              <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-ink/65">
                {sp.category} · {sp.role}
              </div>
              <h3 className="mt-2 text-[19px] leading-tight font-normal text-ink">{sp.name}</h3>
              <p className="mt-2 text-[11.5px] leading-[1.65] text-ink/75">{sp.approach}</p>
              <a
                href={sp.link}
                className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-purple transition-opacity hover:opacity-65"
              >
                Записаться
                <ArrowUpRight size={13} strokeWidth={1.8} />
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-[8px] bg-mint px-5 py-4 text-[11.5px] leading-relaxed text-ink/80">
        <span className="mr-2 text-[9px] font-medium uppercase tracking-[0.16em] text-ink/65">
          Дисклеймер ·
        </span>
        Мы не оказываем психологических услуг и не даём медицинских рекомендаций. Карточки
        специалистов приведены для ориентации. Всегда проверяйте квалификацию самостоятельно.
      </div>
    </section>
  );
}
