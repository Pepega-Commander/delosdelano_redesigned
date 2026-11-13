import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Shell } from "@/components/Shell";
import { DoodleSquiggle, DoodleStar } from "@/components/Doodles";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Наши психологи — DeloSdelano" },
      {
        name: "description",
        content:
          "Практикующие психологи, с которыми можно поработать вживую. Пока принимают в Екатеринбурге.",
      },
      { property: "og:title", content: "Наши психологи — DeloSdelano" },
      {
        property: "og:description",
        content: "Команда бережных специалистов. Поиск по городу.",
      },
    ],
  }),
  component: ContactsPage,
});

interface Psy {
  id: string;
  name: string;
  initials: string;
  role: string;
  focus: string[];
  city: string;
  district: string;
  bio: string;
  price: string;
  contact: { telegram?: string; phone?: string; email?: string };
  tone: "terra" | "sage" | "mustard" | "ink";
}

const PSY: Psy[] = [
  {
    id: "meshcherskaya",
    name: "Анна Мещерская",
    initials: "АМ",
    role: "Клинический психолог",
    focus: ["тревога", "прокрастинация", "выгорание"],
    city: "Екатеринбург",
    district: "Центр · ул. Малышева",
    bio: "Работает в интегративном подходе, ведёт группы поддержки для тех, кто «всё откладывает».",
    price: "от 3500 ₽ / 50 мин",
    contact: { telegram: "@meshch_anna", phone: "+7 (343) 000-01-02" },
    tone: "terra",
  },
  {
    id: "kotov",
    name: "Илья Котов",
    initials: "ИК",
    role: "КПТ-терапевт",
    focus: ["панические атаки", "самокритика", "перфекционизм"],
    city: "Екатеринбург",
    district: "Втузгородок",
    bio: "Помогает разбирать автоматические мысли и мягко возвращать чувство опоры.",
    price: "от 3000 ₽ / 50 мин",
    contact: { telegram: "@ilya_kotov", email: "ilya@delosdelano.ru" },
    tone: "sage",
  },
  {
    id: "voronina",
    name: "Мария Воронина",
    initials: "МВ",
    role: "Гештальт-терапевт",
    focus: ["отношения", "границы", "внутренний ребёнок"],
    city: "Екатеринбург",
    district: "Автовокзал",
    bio: "Ведёт индивидуальные встречи и парные консультации. Любит тихие темы, которые трудно назвать.",
    price: "от 3800 ₽ / 60 мин",
    contact: { telegram: "@voronina_gestalt", phone: "+7 (343) 000-03-04" },
    tone: "mustard",
  },
  {
    id: "sokolov",
    name: "Даниил Соколов",
    initials: "ДС",
    role: "Психолог-консультант",
    focus: ["карьера", "решения", "смыслы"],
    city: "Екатеринбург",
    district: "Онлайн + Уралмаш",
    bio: "Помогает разобрать «застрял и не двигаюсь» — от учёбы до смены профессии.",
    price: "от 2800 ₽ / 50 мин",
    contact: { telegram: "@dsokolov_psy", email: "daniil@delosdelano.ru" },
    tone: "ink",
  },
];

const CITIES = ["Екатеринбург"] as const;

function ContactsPage() {
  const [city, setCity] = useState<(typeof CITIES)[number]>("Екатеринбург");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PSY.filter((p) => p.city === city).filter((p) => {
      if (!query) return true;
      const hay = [p.name, p.role, p.district, p.bio, ...p.focus].join(" ").toLowerCase();
      return hay.includes(query);
    });
  }, [city, q]);

  return (
    <Shell showFooter>
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        {/* Hero */}
        <div className="eyebrow flex items-center gap-3 !text-purple">
          <span className="inline-block h-px w-8 bg-purple/60" />
          Контакты
          <DoodleStar className="h-5 w-5 text-purple/50" />
        </div>
        <h1 className="text-balance mt-5 text-[38px] leading-[1.08] font-light tracking-[-0.015em] md:text-[56px]">
          Наши психологи — <span className="text-purple">живые люди</span>, к которым можно прийти.
        </h1>
        <p className="mt-5 max-w-2xl text-[14px] leading-[1.75] text-ink-soft">
          Если приложение помогло заметить, но одному разобраться сложно — вот те, кому мы доверяем.
          Пока принимают только в Екатеринбурге.
        </p>
        <DoodleSquiggle className="mt-5 h-5 w-32 text-purple/35" />

        {/* Filters */}
        <div className="mt-9 flex flex-col gap-4 rounded-2xl border border-ink/10 bg-cream p-4 md:flex-row md:items-center md:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[9px] uppercase tracking-[0.18em] text-ink-soft">Город</span>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={
                    "rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors " +
                    (city === c
                      ? "bg-purple text-on-dark"
                      : "border border-ink/12 bg-paper-soft text-ink-soft hover:border-purple/40 hover:text-purple")
                  }
                >
                  {c}
                </button>
              ))}
              <span
                className="rounded-full border border-dashed border-ink/15 px-4 py-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-muted-2"
                title="Скоро добавим другие города"
              >
                другие · скоро
              </span>
            </div>
          </div>
          <div className="relative flex-1 md:ml-auto md:max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted-2"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск: тревога, район, имя…"
              className="w-full rounded-lg border border-ink/12 bg-paper-soft py-2.5 pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-ink-muted-2 focus:border-purple"
            />
          </div>
        </div>

        <div className="mt-4 text-[10px] uppercase tracking-[0.16em] text-ink-soft">
          Найдено: <span className="text-ink">{list.length}</span>
        </div>

        {/* Grid */}
        {list.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {list.map((p) => (
              <PsyCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-paper-soft p-10 text-center">
            <div className="text-2xl font-light">Ничего не нашлось</div>
            <p className="mt-2 text-[13px] text-ink-soft">
              Попробуйте другой запрос — или напишите нам, и мы подберём кого-то вручную.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}

const TONE = {
  terra: {
    bg: "bg-purple/10",
    text: "text-purple",
    ring: "hover:border-purple/40",
  },
  sage: {
    bg: "bg-lav/20",
    text: "text-ink",
    ring: "hover:border-lav/60",
  },
  mustard: {
    bg: "bg-mint",
    text: "text-ink",
    ring: "hover:border-mint",
  },
  ink: {
    bg: "bg-deep/10",
    text: "text-deep",
    ring: "hover:border-deep/40",
  },
} as const;

function PsyCard({ p }: { p: Psy }) {
  const t = TONE[p.tone];
  return (
    <article
      className={`group relative rounded-xl border border-ink/10 bg-cream p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-2)] ${t.ring}`}
    >
      <div className="flex gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${t.bg} text-2xl font-light ${t.text}`}
        >
          {p.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xl leading-tight">{p.name}</div>
          <div className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${t.text}`}>{p.role}</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.14em] text-ink-soft">
            {p.city} · {p.district}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[13.5px] leading-[1.7] text-ink-soft">{p.bio}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {p.focus.map((f) => (
          <span
            key={f}
            className="rounded-full border border-ink/10 bg-paper-soft px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-ink-soft"
          >
            {f}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink">{p.price}</div>
        {p.contact.telegram && (
          <a
            href={`https://t.me/${p.contact.telegram.replace(/^@/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-purple px-3.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-on-dark transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-2)]"
          >
            <TelegramIcon />
            TG
          </a>
        )}
      </div>
    </article>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M9.78 15.36l-.4 3.86c.58 0 .83-.25 1.13-.55l2.72-2.58 5.64 4.11c1.03.57 1.77.27 2.03-.95L23.94 3.4c.35-1.55-.56-2.16-1.57-1.79L1.5 9.44c-1.5.6-1.48 1.46-.25 1.85l5.42 1.69L18.35 5.4c.59-.36 1.13-.16.68.2z" />
    </svg>
  );
}
