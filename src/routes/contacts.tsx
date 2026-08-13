import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Shell } from "@/components/Shell";

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
        <div className="flex items-baseline gap-3 font-mono text-xs uppercase tracking-[0.2em] text-terra">
          <span className="inline-block h-px w-8 bg-terra" />
          Контакты
        </div>
        <h1 className="text-balance mt-6 font-editorial text-4xl leading-[1.05] md:text-6xl">
          Наши психологи — <span className="italic text-terra">живые люди</span>, к которым можно
          прийти.
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft">
          Если приложение помогло заметить, но одному разобраться сложно — вот те, кому мы доверяем.
          Пока принимают только в Екатеринбурге.
        </p>

        {/* Filters */}
        <div
          className="mt-10 flex flex-col gap-4 border border-border bg-paper-soft p-4 md:flex-row md:items-center md:p-5"
          style={{ borderRadius: "var(--radius-soft)" }}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">Город</span>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={
                    "border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors " +
                    (city === c
                      ? "ink-glow border-ink bg-ink text-primary-foreground"
                      : "warm-glow border-border bg-card text-ink-soft hover:border-terra hover:text-terra")
                  }
                  style={{ borderRadius: "var(--radius-pill)" }}
                >
                  {c}
                </button>
              ))}
              <span
                className="border border-dashed border-border px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-ink-muted-2"
                style={{ borderRadius: "var(--radius-pill)" }}
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
              className="w-full border border-border bg-card py-2 pl-9 pr-3 font-serif text-sm outline-none transition-colors placeholder:text-ink-muted-2 focus:border-terra"
              style={{ borderRadius: "var(--radius-soft)" }}
            />
          </div>
        </div>

        <div className="mt-4 font-mono text-xs uppercase tracking-widest text-ink-soft">
          Найдено: <span className="text-ink">{list.length}</span>
        </div>

        {/* Grid */}
        {list.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {list.map((p, i) => (
              <PsyCard key={p.id} p={p} rotate={i % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"} />
            ))}
          </div>
        ) : (
          <div
            className="mt-6 border border-dashed border-border bg-paper-soft p-10 text-center"
            style={{ borderRadius: "var(--radius-soft)" }}
          >
            <div className="font-editorial text-2xl">Ничего не нашлось</div>
            <p className="mt-2 font-serif text-ink-soft">
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
    bg: "bg-terra/10",
    text: "text-terra",
    ring: "hover:border-terra",
    tape: "var(--terra)",
  },
  sage: { bg: "bg-sage/15", text: "text-sage", ring: "hover:border-sage", tape: "var(--sage)" },
  mustard: {
    bg: "bg-mustard/15",
    text: "text-mustard",
    ring: "hover:border-mustard",
    tape: "var(--mustard)",
  },
  ink: { bg: "bg-ink/10", text: "text-ink", ring: "hover:border-ink", tape: "var(--ink)" },
} as const;

function PsyCard({ p, rotate = "" }: { p: Psy; rotate?: string }) {
  const t = TONE[p.tone];
  return (
    <article
      className={`group relative border-2 border-ink bg-paper p-6 pt-8 transition-transform duration-300 hover:rotate-0 ${rotate}`}
      style={{ borderRadius: "var(--radius-soft)", boxShadow: "var(--shadow-1)" }}
    >
      <span
        className="tape"
        aria-hidden="true"
        style={{ background: `color-mix(in oklab, ${t.tape} 85%, transparent)` }}
      />
      <div className="flex gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border ${t.bg} font-editorial text-2xl ${t.text}`}
        >
          {p.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-editorial text-xl leading-tight">{p.name}</div>
          <div className={`mt-0.5 font-mono text-xs uppercase tracking-widest ${t.text}`}>
            {p.role}
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
            {p.city} · {p.district}
          </div>
        </div>
      </div>

      <p className="mt-4 font-serif text-[15px] leading-relaxed text-ink-soft">{p.bio}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {p.focus.map((f) => (
          <span
            key={f}
            className="border border-border bg-paper-soft px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-ink-soft"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            {f}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="font-mono text-xs uppercase tracking-widest text-ink">{p.price}</div>
        {p.contact.telegram && (
          <a
            href={`https://t.me/${p.contact.telegram.replace(/^@/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="ink-glow inline-flex items-center gap-1.5 bg-ink px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-[1px]"
            style={{ borderRadius: "var(--radius-pill)" }}
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
