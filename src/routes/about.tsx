import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { play } from "@/lib/sfx";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "О нас — DeloSdelano" },
      {
        name: "description",
        content:
          "Четверо, кто делает DeloSdelano: Константин, Ильгам, Фёдор и Закария. Досье команды.",
      },
      { property: "og:title", content: "О нас — DeloSdelano" },
      {
        property: "og:description",
        content: "Досье команды: тимлид-копирайтер, дизайнер, фронт и бэк.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

type Tone = "terra" | "sage" | "mustard" | "ink" | "pink";

interface Member {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: string;
  quote: string;
  bio: string;
  tone: Tone;
  rotate: string;
  offsetY: string;
  tapeOffset: string;
  fileNo: string;
}

const TEAM: Member[] = [
  {
    id: "konstantin",
    name: "Константин",
    initials: "КС",
    role: "Тимлид & копирайтер",
    status: "IN CHARGE",
    quote: "Слежу, чтобы код работал, а текст лечил, а не калечил.",
    bio: "Собирает команду, режиссирует голос продукта. Пишет так, чтобы после текста хотелось выдохнуть, а не оправдываться.",
    tone: "terra",
    rotate: "rotate-[-4deg]",
    offsetY: "md:mt-2",
    tapeOffset: "left-1/2 -translate-x-1/2 -top-3",
    fileNo: "№ 01",
  },
  {
    id: "ilgam",
    name: "Ильгам",
    initials: "ИЛ",
    role: "Дизайн",
    status: "VISUAL CODE",
    quote: "Делаю интерфейс, который обнимает визуально.",
    bio: "Отвечает за то, как продукт выглядит и как ощущается. Любит тёплую бумагу, честные цвета и паузы в композиции.",
    tone: "pink",
    rotate: "rotate-[3deg]",
    offsetY: "md:mt-10",
    tapeOffset: "left-4 -top-3 rotate-[-8deg]",
    fileNo: "№ 02",
  },
  {
    id: "fedor",
    name: "Фёдор",
    initials: "ФД",
    role: "Фронтенд",
    status: "UI REALIZATION",
    quote: "Оживляю пиксели Ильгама и заставляю кнопки летать.",
    bio: "Превращает макеты в интерфейс, который отвечает на клик. Верит, что микро-анимация — это забота, а не украшение.",
    tone: "sage",
    rotate: "rotate-[-2deg]",
    offsetY: "md:mt-6",
    tapeOffset: "right-6 -top-3 rotate-[6deg]",
    fileNo: "№ 03",
  },
  {
    id: "zakariya",
    name: "Закария",
    initials: "ЗК",
    role: "Бэкенд",
    status: "LOGIC & ARCHITECTURE",
    quote: "Всё скрытое и сложное работает здесь. Базы данных тоже имеют душу.",
    bio: "Строит невидимую часть: базы, API, надёжность. Считает, что хорошая архитектура — это когда её не замечают.",
    tone: "ink",
    rotate: "rotate-[4deg]",
    offsetY: "md:mt-0",
    tapeOffset: "left-1/3 -top-3 rotate-[-4deg]",
    fileNo: "№ 04",
  },
];

const TONE: Record<Tone, { bg: string; text: string; tape: string; chip: string }> = {
  terra: {
    bg: "bg-terra/15",
    text: "text-terra",
    tape: "var(--terra)",
    chip: "border-terra text-terra",
  },
  sage: { bg: "bg-sage/20", text: "text-sage", tape: "var(--sage)", chip: "border-sage text-sage" },
  mustard: {
    bg: "bg-mustard/25",
    text: "text-mustard",
    tape: "var(--mustard)",
    chip: "border-mustard text-mustard",
  },
  ink: { bg: "bg-ink/10", text: "text-ink", tape: "var(--ink)", chip: "border-ink text-ink" },
  pink: {
    bg: "[background-color:color-mix(in_oklab,#ec4899_18%,transparent)]",
    text: "[color:#d1477a]",
    tape: "#f9a8d4",
    chip: "[border-color:#d1477a] [color:#d1477a]",
  },
};

function AboutPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = TEAM.find((m) => m.id === openId) ?? null;

  return (
    <Shell showFooter>
      <section className="relative mx-auto w-full max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-terra">
            <span className="inline-block h-px w-8 bg-terra" />
            Досье · команда
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-soft">
            04 / 04 · Екатеринбург
          </div>
        </div>

        <h1 className="text-balance mt-8 font-editorial text-5xl leading-[0.98] md:text-[92px]">
          Четверо, кто делает
          <br />
          <span className="italic text-terra">DeloSdelano.</span>
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft md:text-xl">
          Разложили на столе: возьмите карточку — откроется досье. Ничего лишнего, только имена,
          роли и показания под протокол.
        </p>

        {/* Desk with polaroids */}
        <div
          className="relative mt-16 grid grid-cols-2 gap-x-6 gap-y-14 md:mt-24 md:grid-cols-4 md:gap-x-8"
          aria-label="Команда"
        >
          {TEAM.map((m) => (
            <Polaroid key={m.id} m={m} onOpen={() => setOpenId(m.id)} />
          ))}
        </div>

        <Timeline />

        <div className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 font-mono text-[11px] uppercase tracking-[0.24em] text-ink-soft md:flex-row md:items-center">
          <span>© DeloSdelano</span>
          <span
            className="font-hand text-2xl normal-case tracking-normal text-terra"
            style={{ fontFamily: "var(--font-hand)" }}
          >
            Клик по карточке — откроется досье.
          </span>
        </div>
      </section>

      {/* Dossier drawer */}
      <DossierDrawer member={open} onClose={() => setOpenId(null)} />
    </Shell>
  );
}

function Timeline() {
  const items: { year: string; text: string; tone: Tone }[] = [
    {
      year: "Февраль 2026",
      text: "Познакомились — оказались в одной команде, ещё не зная, что из этого выйдет.",
      tone: "terra",
    },
    {
      year: "Весна 2026",
      text: "Делали проект в рамках проектного практикума. Учились договариваться и слышать друг друга.",
      tone: "pink",
    },
    {
      year: "1 июля 2026",
      text: "Стартовала учебная практика — начали делать DeloSdelano. Уже по-настоящему.",
      tone: "sage",
    },
  ];
  return (
    <section aria-label="История команды" className="mt-24 md:mt-32">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-terra">
          <span className="inline-block h-px w-8 bg-terra" />
          Хронология
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-soft">
          прокрути →
        </div>
      </div>
      <div className="relative mt-8 -mx-6 md:-mx-10">
        <div className="flex snap-x snap-mandatory justify-center gap-6 overflow-x-auto px-6 pb-6 md:px-10 [scrollbar-width:thin]">
          {items.map((it, i) => {
            const t = TONE[it.tone];
            return (
              <article
                key={it.year}
                className="relative w-[280px] shrink-0 snap-start border-2 border-ink bg-paper p-5 md:w-[360px]"
                style={{
                  boxShadow: "6px 8px 0 -2px color-mix(in oklab, var(--ink) 15%, transparent)",
                }}
              >
                <div
                  className={`inline-block border-2 px-2 py-0.5 font-mono text-xs uppercase tracking-widest ${t.chip}`}
                >
                  этап {String(i + 1).padStart(2, "0")}
                </div>
                <div className={`mt-4 font-editorial text-6xl leading-none ${t.text}`}>
                  {it.year}
                </div>
                <p className="mt-4 font-serif text-base leading-snug text-ink-soft">{it.text}</p>
                <span
                  aria-hidden
                  className="absolute -top-2 left-6 h-4 w-10"
                  style={{ background: `color-mix(in oklab, ${t.tape} 70%, transparent)` }}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Polaroid({ m, onOpen }: { m: Member; onOpen: () => void }) {
  const t = TONE[m.tone];
  return (
    <button
      type="button"
      data-sfx="off"
      onPointerEnter={() => play("paper")}
      onClick={() => {
        play("open");
        onOpen();
      }}
      className={`group relative block w-full text-left transition-transform duration-300 hover:!rotate-0 hover:-translate-y-1 ${m.rotate} ${m.offsetY}`}
    >
      <div
        className="relative border border-ink bg-paper p-3 pb-6"
        style={{
          boxShadow:
            "8px 10px 0 -2px color-mix(in oklab, var(--ink) 12%, transparent), 0 20px 40px -20px color-mix(in oklab, var(--ink) 40%, transparent)",
        }}
      >
        {/* Tape */}
        <span
          aria-hidden
          className={`absolute z-10 h-5 w-16 ${m.tapeOffset}`}
          style={{
            background: `color-mix(in oklab, ${t.tape} 70%, transparent)`,
            boxShadow: "0 1px 0 color-mix(in oklab, var(--ink) 20%, transparent)",
          }}
        />
        {/* Photo area */}
        <div
          className={`relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden border border-ink/20 ${t.bg}`}
        >
          <span
            aria-hidden
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, var(--ink) 1px, transparent 1px), radial-gradient(circle at 80% 60%, var(--ink) 1px, transparent 1px)",
              backgroundSize: "18px 18px, 22px 22px",
            }}
          />
          <span className={`font-editorial text-6xl md:text-7xl ${t.text}`}>{m.initials}</span>
          <span className="absolute left-2 top-2 font-mono text-[9px] uppercase tracking-widest text-ink-soft">
            {m.fileNo}
          </span>
          <span className="absolute bottom-2 right-2 font-mono text-[9px] uppercase tracking-widest text-ink-soft">
            04·2026
          </span>
        </div>
        {/* Caption */}
        <div className="mt-4 flex flex-col gap-1 px-1">
          <span
            className="font-hand text-5xl leading-none text-ink"
            style={{ fontFamily: "var(--font-hand)" }}
          >
            {m.name}
          </span>
          <span className={`font-mono text-sm uppercase tracking-widest ${t.text}`}>{m.role}</span>
        </div>
        <div className="mt-2 px-1 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted-2 opacity-0 transition-opacity group-hover:opacity-100">
          Открыть досье →
        </div>
      </div>
    </button>
  );
}

function DossierDrawer({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const isOpen = !!member;
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!isOpen}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative flex max-h-[90vh] w-full max-w-lg flex-col border-2 border-ink bg-paper transition-all duration-300 ease-out ${
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          style={{
            boxShadow:
              "12px 14px 0 -2px color-mix(in oklab, var(--ink) 20%, transparent), 0 40px 80px -30px color-mix(in oklab, var(--ink) 50%, transparent)",
          }}
        >
          {member && <DossierContent key={member.id} m={member} onClose={onClose} />}
          {member && <ClassifiedStamp memberId={member.id} />}
        </div>
      </aside>
    </>
  );
}

function ClassifiedStamp({ memberId }: { memberId: string }) {
  const [phase, setPhase] = useState<"pre" | "hit" | "settled">("pre");
  const timers = useRef<number[]>([]);
  useEffect(() => {
    setPhase("pre");
    timers.current.forEach(clearTimeout);
    timers.current = [];
    timers.current.push(
      window.setTimeout(() => {
        play("stamp");
        setPhase("hit");
      }, 260),
    );
    timers.current.push(window.setTimeout(() => setPhase("settled"), 480));
    return () => timers.current.forEach(clearTimeout);
  }, [memberId]);
  const scale = phase === "pre" ? 2.4 : phase === "hit" ? 0.95 : 1;
  const opacity = phase === "pre" ? 0 : phase === "hit" ? 1 : 0.85;
  const rot = phase === "settled" ? -12 : -18;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-6 top-16 select-none"
      style={{
        transform: `rotate(${rot}deg) scale(${scale})`,
        opacity,
        transition: "transform 220ms cubic-bezier(0.2,1.6,0.4,1), opacity 220ms ease-out",
        transformOrigin: "center",
      }}
    >
      <div
        className="border-[3px] px-4 py-1.5 font-mono text-xl font-black uppercase tracking-[0.24em]"
        style={{
          borderColor: "#c8391f",
          color: "#c8391f",
          borderStyle: "double",
          background: "color-mix(in oklab, #c8391f 6%, transparent)",
        }}
      >
        СЕКРЕТНО
      </div>
    </div>
  );
}

function DossierContent({ m, onClose }: { m: Member; onClose: () => void }) {
  const t = TONE[m.tone];
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Top strip */}
      <div className="dossier-strip flex items-center justify-between border-b-2 border-ink bg-ink px-6 py-3 text-primary-foreground">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em]">
          Досье {m.fileNo} · для служебного пользования
        </div>
        <button
          data-sfx="off"
          onClick={() => {
            play("close");
            onClose();
          }}
          className="font-mono text-xs uppercase tracking-widest hover:text-highlight"
          aria-label="Закрыть досье"
        >
          ✕ закрыть
        </button>
      </div>

      <div className="relative flex-1 px-6 py-8 md:px-8">
        {/* Watermark */}
        <span
          aria-hidden
          className={`pointer-events-none absolute right-4 top-6 select-none font-editorial font-black leading-none ${t.text}`}
          style={{ fontSize: "8rem", opacity: 0.08 }}
        >
          {m.initials}
        </span>

        <div className="font-mono text-sm uppercase tracking-[0.24em] text-ink-soft">субъект</div>
        <h2 className="mt-2 font-editorial text-5xl leading-none md:text-6xl">{m.name}</h2>
        <div className={`mt-3 font-mono text-base uppercase tracking-widest ${t.text}`}>
          {m.role}
        </div>

        {/* Status stamp */}
        <div className="mt-6 inline-flex items-center gap-2">
          <span
            className={`inline-flex items-center border-2 px-4 py-1.5 font-mono text-sm uppercase tracking-[0.24em] ${t.chip}`}
            style={{
              transform: "rotate(-3deg)",
              borderStyle: "double",
            }}
          >
            статус · {m.status}
          </span>
        </div>

        {/* Meta table */}
        <dl className="mt-8 grid grid-cols-3 gap-y-3 border-y border-border py-4 font-mono text-sm uppercase tracking-widest">
          <dt className="text-ink-soft">локация</dt>
          <dd className="col-span-2 text-ink">Екатеринбург</dd>
        </dl>

        {/* Quote */}
        <div className="mt-8">
          <div className="font-mono text-sm uppercase tracking-[0.24em] text-ink-soft">
            показания
          </div>
          <blockquote
            className="mt-3 border-l-4 pl-4 font-editorial text-3xl italic leading-snug text-ink"
            style={{ borderColor: t.tape }}
          >
            «{m.quote}»
          </blockquote>
        </div>

        {/* Bio */}
        <div className="mt-8">
          <div className="font-mono text-sm uppercase tracking-[0.24em] text-ink-soft">
            заметка следователя
          </div>
          <p className="mt-3 font-serif text-lg leading-relaxed text-ink-soft">{m.bio}</p>
        </div>

        {/* Sign-off */}
        <div className="mt-10 flex items-end justify-between border-t border-dashed border-border pt-4">
          <span className="font-mono text-sm uppercase tracking-[0.24em] text-ink-soft">
            подписано
          </span>
          <span
            className="font-hand text-3xl text-terra"
            style={{ fontFamily: "var(--font-hand)" }}
          >
            DeloSdelano
          </span>
        </div>
      </div>
    </div>
  );
}
