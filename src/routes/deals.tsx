import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { AuthGate } from "@/components/AuthGate";
import { typeInfo } from "@/lib/quiz-data";
import { planTemplates, getPlanTemplate, planChapters, accentClasses } from "@/lib/plans-catalog";
import {
  store,
  computeStreak,
  type Checkin,
  type PlanProgress,
  type QuizResult,
  type Session,
} from "@/lib/storage";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Мои дела — DeloSdelano" },
      { name: "description", content: "Личный дашборд: прогресс, фокус, чек-ины и аналитика." },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <AuthGate title="Войдите, чтобы видеть свои дела">
          {(name) => <Dashboard name={name} />}
        </AuthGate>
      </div>
    </Shell>
  );
}

// ---------- helpers ----------
const isoDay = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const RU_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const RU_MONTH = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function formatToday(d = new Date()) {
  return `${d.getDate()} ${RU_MONTH[d.getMonth()]}, ${RU_WEEK[(d.getDay() + 6) % 7].toLowerCase()}`;
}

function greetingFor(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

// ---------- dashboard ----------
function Dashboard({ name }: { name: string }) {
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanProgress>>({});
  const [archive, setArchive] = useState<PlanProgress[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setQuiz(store.getQuiz());
    setSessions(store.getSessions());
    setCheckins(store.getCheckins());
    setPlans(store.getAllPlanProgress());
    setArchive(store.getArchive());
  }, [tick]);

  const now = new Date();
  const weekAgo = now.getTime() - 7 * 86400_000;
  const weekSessions = sessions.filter((s) => s.startedAt >= weekAgo);
  const avgMin = sessions.length
    ? Math.round(
        sessions.reduce((a, s) => a + Math.max(0, s.endedAt - s.startedAt), 0) /
          sessions.length /
          60000,
      )
    : 0;
  const streak = computeStreak(checkins);
  const totalCheckins = checkins.length;

  // Active plan preference: any in-progress, else most-recent
  const activePlanEntry = useMemo(() => {
    const entries = Object.entries(plans);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1].startedAt - a[1].startedAt);
    return entries[0];
  }, [plans]);

  return (
    <>
      {/* HERO */}
      <div className="flex items-baseline gap-3 font-mono text-xs uppercase tracking-[0.2em] text-terra">
        <span className="inline-block h-px w-8 bg-terra" />
        Мои дела · {formatToday(now)}
      </div>
      <h1 className="text-balance mt-4 font-editorial text-5xl leading-[1.02] md:text-6xl">
        {greetingFor(now)}, <span className="italic text-terra">{name}.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Тихая сводка: где вы сейчас, что стоит закрыть сегодня и что говорят цифры за неделю.
      </p>

      {/* QUICK GUIDE */}
      <div
        className="mt-8 grid gap-3 border border-border bg-paper-soft p-4 md:grid-cols-3"
        style={{ borderRadius: "var(--radius-soft)" }}
      >
        <GuideItem
          step="1"
          title="Начните с фокуса"
          text="Одна короткая сессия внизу справа — самое простое действие."
        />
        <GuideItem
          step="2"
          title="Ведите план"
          text="Открывайте главы по одной, они сохраняют прогресс."
        />
        <GuideItem
          step="3"
          title="Чек-ин вечером"
          text="Три строки о дне — из них рождается календарь и серия."
        />
      </div>

      {/* CTA + STATS */}
      <div className="mt-10 grid gap-6 md:grid-cols-[1.1fr_2fr]">
        <Link
          to="/focus"
          className="ink-glow group relative flex flex-col justify-between overflow-hidden border border-ink bg-ink p-6 text-primary-foreground transition-transform duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[2px]"
          style={{ borderRadius: "var(--radius-soft)", boxShadow: "var(--shadow-2)" }}
        >
          <div className="font-mono text-xs uppercase tracking-[0.2em] opacity-80">Один шаг</div>
          <div className="mt-6 font-editorial text-3xl leading-tight">
            Начать фокус-сессию
            <span
              aria-hidden
              className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1.5"
            >
              →
            </span>
          </div>
          <div className="mt-6 font-mono text-xs uppercase tracking-widest opacity-80">
            2 минуты · без давления
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="За неделю" value={weekSessions.length} suffix="сессий" />
          <Stat label="Средняя" value={avgMin} suffix="минут" />
          <Stat label="Серия" value={streak} suffix={streak === 1 ? "день" : "дней"} tone="terra" />
          <Stat label="Чек-инов" value={totalCheckins} suffix="всего" />
        </div>
      </div>

      {/* PLAN + TYPE */}
      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <ActivePlanCard entry={activePlanEntry} />
        <TypeCard quiz={quiz} />
      </section>

      {/* CALENDAR + CHECKIN */}
      <section className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <HeatmapCard sessions={sessions} checkins={checkins} />
        <CheckinCard
          existing={checkins.find((c) => c.date === isoDay(now))}
          onSaved={() => setTick((n) => n + 1)}
        />
      </section>

      {/* ARCHIVE */}
      {archive.length > 0 && (
        <section className="mt-14">
          <SectionHead eyebrow="Архив" title="Завершённые планы" />
          <div className="mt-4 flex flex-wrap gap-3">
            {archive.map((a, i) => {
              const t = getPlanTemplate(a.planId ?? "full");
              const a2 = accentClasses(t?.accent ?? "terra");
              return (
                <Link
                  key={i}
                  to="/plans/$planId"
                  params={{ planId: a.planId ?? "full" }}
                  className="warm-glow group border border-border bg-paper-soft px-4 py-3 transition-all duration-200 hover:-translate-y-[1px] hover:border-terra"
                  style={{ borderRadius: "var(--radius-soft)" }}
                >
                  <div className={`font-mono text-xs uppercase tracking-widest ${a2.text}`}>
                    {a.finishedAt ? new Date(a.finishedAt).toLocaleDateString("ru-RU") : "—"}
                  </div>
                  <div className="mt-1 font-editorial text-base">
                    {t?.title ?? "План"}
                    <span
                      aria-hidden
                      className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                    открыть снова
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

function GuideItem({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-terra font-mono text-xs text-terra">
        {step}
      </span>
      <div className="min-w-0">
        <div className="font-editorial text-base leading-tight">{title}</div>
        <div className="mt-0.5 text-sm text-ink-soft">{text}</div>
      </div>
    </div>
  );
}

// ---------- pieces ----------
function Stat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: "terra" | "sage" | "ink";
}) {
  const toneClass = tone === "terra" ? "text-terra" : tone === "sage" ? "text-sage" : "text-ink";
  return (
    <div
      className="border border-border bg-card p-4"
      style={{ borderRadius: "var(--radius-soft)" }}
    >
      <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">{label}</div>
      <div className={`mt-2 font-editorial text-4xl leading-none ${toneClass}`}>{value}</div>
      {suffix && (
        <div className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-soft">
          {suffix}
        </div>
      )}
    </div>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
        <span className="inline-block h-px w-8 bg-border" />
        {eyebrow}
      </div>
      <h2 className="mt-3 font-editorial text-3xl leading-tight md:text-4xl">{title}</h2>
    </>
  );
}

function ActivePlanCard({ entry }: { entry: [string, PlanProgress] | null }) {
  if (!entry) {
    return (
      <div
        className="border border-border bg-card p-6"
        style={{ borderRadius: "var(--radius-soft)" }}
      >
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
          Активный план
        </div>
        <div className="mt-3 font-editorial text-2xl leading-tight">Ещё не выбран</div>
        <p className="mt-2 text-sm text-ink-soft">
          Соберите себе маршрут: полный, короткий, про страх или про ритуал.
        </p>
        <Link to="/plans" className="btn-link mt-4 inline-block text-sm">
          Открыть каталог →
        </Link>
      </div>
    );
  }
  const [id, p] = entry;
  const t = getPlanTemplate(id) ?? planTemplates[0];
  const total = planChapters(id).length || 1;
  const done = p.completedChapters.length;
  const percent = Math.round((done / total) * 100);
  const a = accentClasses(t.accent);
  return (
    <div
      className="border border-border bg-card p-6"
      style={{ borderRadius: "var(--radius-soft)" }}
    >
      <div className={`font-mono text-xs uppercase tracking-[0.2em] ${a.text}`}>
        Активный план · {t.tag}
      </div>
      <div className="mt-3 font-editorial text-2xl leading-tight">{t.title}</div>
      <p className="mt-2 text-sm text-ink-soft">{t.subtitle}</p>
      <div className="mt-5 h-[6px] w-full overflow-hidden bg-paper-dark">
        <div
          className={`h-full ${a.bg} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between font-mono text-xs uppercase tracking-widest text-ink-soft">
        <span>
          {done} из {total} глав
        </span>
        <span>{percent}%</span>
      </div>
      <Link
        to="/plans/$planId"
        params={{ planId: id }}
        className="btn-link mt-5 inline-block text-sm"
      >
        Продолжить →
      </Link>
    </div>
  );
}

function TypeCard({ quiz }: { quiz: QuizResult | null }) {
  return (
    <div
      className="border border-border bg-card p-6"
      style={{ borderRadius: "var(--radius-soft)" }}
    >
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Ваш тип</div>
      {quiz ? (
        <>
          <div className="mt-3 font-editorial text-2xl leading-tight text-terra">
            {typeInfo[quiz.type].name}
          </div>
          <p className="mt-2 text-sm text-ink-soft">{typeInfo[quiz.type].trigger}</p>
          <div className="mt-5 flex items-baseline gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                Влияние
              </div>
              <div className="mt-1 font-editorial text-3xl">
                {quiz.impact}
                <span className="text-lg text-ink-soft">/7</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                Пройден
              </div>
              <div className="mt-1 font-mono text-sm">
                {new Date(quiz.takenAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/result" className="btn-link text-sm">
              Смотреть результат →
            </Link>
            <Link
              to="/quiz"
              className="font-mono text-xs uppercase tracking-widest text-ink-soft transition-colors hover:text-terra"
            >
              ↻ Пройти опрос заново
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 font-editorial text-2xl leading-tight text-ink-soft">—</div>
          <p className="mt-2 text-sm text-ink-soft">
            Восемь вопросов, чтобы понять, что именно вас тормозит.
          </p>
          <Link to="/quiz" className="btn-link mt-4 inline-block text-sm">
            Пройти опрос →
          </Link>
        </>
      )}
    </div>
  );
}

function HeatmapCard({ sessions, checkins }: { sessions: Session[]; checkins: Checkin[] }) {
  // 35-day trailing grid (5 weeks)
  const days = 35;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessionsByDay = new Map<string, number>();
  for (const s of sessions) {
    const k = isoDay(new Date(s.startedAt));
    sessionsByDay.set(k, (sessionsByDay.get(k) ?? 0) + 1);
  }
  const checkinDays = new Set(checkins.map((c) => c.date));

  const cells: { key: string; sessions: number; checkin: boolean; label: string; day: number }[] =
    [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = isoDay(d);
    cells.push({
      key,
      sessions: sessionsByDay.get(key) ?? 0,
      checkin: checkinDays.has(key),
      label: `${d.getDate()} ${RU_MONTH[d.getMonth()]}`,
      day: d.getDate(),
    });
  }

  const intensity = (n: number) => {
    if (n === 0) return "bg-paper-dark";
    if (n === 1) return "bg-sage/40";
    if (n === 2) return "bg-sage/70";
    return "bg-sage";
  };

  return (
    <div
      className="border border-border bg-card p-6"
      style={{ borderRadius: "var(--radius-soft)" }}
    >
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
        Календарь · 5 недель
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5 font-mono text-[11px] text-ink-soft">
        {["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map((d) => (
          <div key={d} className="text-center uppercase tracking-[0.15em]">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {cells.map((c) => (
          <div
            key={c.key}
            title={`${c.label} · ${c.sessions} сес.${c.checkin ? " · чек-ин" : ""}`}
            className={`relative aspect-square flex items-center justify-center font-mono text-2xl font-bold leading-none ${
              c.sessions > 1 ? "text-paper" : "text-ink-soft"
            } ${intensity(c.sessions)} transition-colors ${
              c.checkin ? "ring-2 ring-terra ring-offset-1 ring-offset-card" : ""
            }`}
            style={{ borderRadius: "4px" }}
          >
            {c.day}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 font-mono text-xs uppercase tracking-widest text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 bg-sage" style={{ borderRadius: "2px" }} />
          сессия
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 ring-2 ring-terra ring-offset-1 ring-offset-card"
            style={{ borderRadius: "2px" }}
          />
          чек-ин
        </span>
      </div>
    </div>
  );
}

function CheckinCard({ existing, onSaved }: { existing?: Checkin; onSaved: () => void }) {
  const [done, setDone] = useState(existing?.done ?? "");
  const [postponed, setPostponed] = useState(existing?.postponed ?? "");
  const [distractions, setDistractions] = useState((existing?.distractions ?? []).join(", "));
  const [savedFlash, setSavedFlash] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    store.addCheckin({
      date: isoDay(new Date()),
      done: done.trim(),
      postponed: postponed.trim(),
      distractions: distractions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setSavedFlash(true);
    onSaved();
    setTimeout(() => setSavedFlash(false), 1400);
  }

  return (
    <div
      className="border border-border bg-card p-6"
      style={{ borderRadius: "var(--radius-soft)" }}
    >
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-terra">
        Чек-ин · сегодня
      </div>
      <div className="mt-3 font-editorial text-2xl leading-tight">
        {existing ? "Обновить запись" : "Как прошёл день?"}
      </div>
      <form onSubmit={save} className="mt-5 space-y-4">
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            Что сделал(а)
          </span>
          <input
            value={done}
            onChange={(e) => setDone(e.target.value)}
            placeholder="Одно предложение"
            className="mt-1 w-full border-b border-ink/25 bg-transparent py-1.5 font-editorial text-lg outline-none focus:border-terra"
          />
        </label>
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            Что отложил(а)
          </span>
          <input
            value={postponed}
            onChange={(e) => setPostponed(e.target.value)}
            placeholder="Без осуждения"
            className="mt-1 w-full border-b border-ink/25 bg-transparent py-1.5 font-editorial text-lg outline-none focus:border-terra"
          />
        </label>
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            Что отвлекало (через запятую)
          </span>
          <input
            value={distractions}
            onChange={(e) => setDistractions(e.target.value)}
            placeholder="телефон, тревога, чат"
            className="mt-1 w-full border-b border-ink/25 bg-transparent py-1.5 font-editorial text-lg outline-none focus:border-terra"
          />
        </label>
        <div className="flex items-baseline gap-4">
          <button
            className="ink-glow inline-flex items-center gap-2 bg-ink px-5 py-2 font-editorial text-base text-primary-foreground transition-transform duration-200 hover:-translate-y-[1px]"
            style={{ borderRadius: "var(--radius-soft)", boxShadow: "var(--shadow-2)" }}
          >
            Сохранить
          </button>
          {savedFlash && (
            <span
              className="font-hand text-2xl text-sage"
              style={{ fontFamily: "var(--font-hand)" }}
            >
              — записано
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
