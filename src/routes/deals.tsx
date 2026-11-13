import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { DoodleStar } from "@/components/Doodles";
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
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-purple">
        <span className="inline-block h-px w-8 bg-purple/60" />
        Мои дела · {formatToday(now)}
        <DoodleStar className="h-5 w-5 text-purple/50" />
      </div>
      <h1 className="text-balance mt-4 text-[42px] leading-[1.04] font-light tracking-[-0.015em] md:text-[56px]">
        {greetingFor(now)}, <span className="text-purple">{name}.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
        Тихая сводка: где вы сейчас, что стоит закрыть сегодня и что говорят цифры за неделю.
      </p>

      {/* QUICK GUIDE */}
      <div className="mt-8 grid gap-3 rounded-2xl border border-ink/10 bg-cream p-5 md:grid-cols-3">
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
          className="ink-glow group relative flex flex-col justify-between overflow-hidden rounded-xl bg-purple p-6 text-on-dark transition-transform duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[2px]"
          style={{ boxShadow: "var(--shadow-2)" }}
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-on-dark/85">Один шаг</div>
          <div className="mt-6 text-[28px] leading-tight font-light">
            Начать фокус-сессию
            <span
              aria-hidden
              className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1.5"
            >
              →
            </span>
          </div>
          <div className="mt-6 text-[9px] uppercase tracking-[0.16em] text-on-dark/80">
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
                  className="warm-glow group rounded-xl border border-ink/10 bg-cream px-4 py-3 transition-all duration-200 hover:-translate-y-[1px] hover:border-purple/40"
                >
                  <div className={`text-[9px] uppercase tracking-[0.14em] ${a2.text}`}>
                    {a.finishedAt ? new Date(a.finishedAt).toLocaleDateString("ru-RU") : "—"}
                  </div>
                  <div className="mt-1 text-[15px]">
                    {t?.title ?? "План"}
                    <span
                      aria-hidden
                      className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                  <div className="mt-1 text-[9px] uppercase tracking-[0.14em] text-ink-soft">
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
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-purple/30 text-[11px] text-purple">
        {step}
      </span>
      <div className="min-w-0">
        <div className="text-[14px] leading-tight">{title}</div>
        <div className="mt-1 text-[12px] leading-relaxed text-ink-soft">{text}</div>
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
  const toneClass = tone === "terra" ? "text-purple" : tone === "sage" ? "text-lav" : "text-ink";
  return (
    <div className="rounded-xl border border-ink/10 bg-cream p-4">
      <div className="text-[9px] uppercase tracking-[0.14em] text-ink-soft">{label}</div>
      <div className={`mt-2 text-[34px] leading-none font-light ${toneClass}`}>{value}</div>
      {suffix && (
        <div className="mt-1.5 text-[9px] uppercase tracking-[0.14em] text-ink-soft">{suffix}</div>
      )}
    </div>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-ink-soft">
        <span className="inline-block h-px w-8 bg-ink/20" />
        {eyebrow}
      </div>
      <h2 className="mt-3 text-[28px] leading-tight font-light md:text-[34px]">{title}</h2>
    </>
  );
}

function ActivePlanCard({ entry }: { entry: [string, PlanProgress] | null }) {
  if (!entry) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-cream p-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">Активный план</div>
        <div className="mt-3 text-[22px] leading-tight font-light">Ещё не выбран</div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          Соберите себе маршрут: полный, короткий, про страх или про ритуал.
        </p>
        <Link to="/plans" className="btn-link mt-4 inline-block text-[13px]">
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
    <div className="rounded-2xl border border-ink/10 bg-cream p-6">
      <div className={`text-[10px] uppercase tracking-[0.2em] ${a.text}`}>
        Активный план · {t.tag}
      </div>
      <div className="mt-3 text-[22px] leading-tight font-light">{t.title}</div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{t.subtitle}</p>
      <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-mint/70">
        <div
          className={`h-full rounded-full ${a.bg} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between text-[9px] uppercase tracking-[0.14em] text-ink-soft">
        <span>
          {done} из {total} глав
        </span>
        <span>{percent}%</span>
      </div>
      <Link
        to="/plans/$planId"
        params={{ planId: id }}
        className="btn-link mt-5 inline-block text-[13px]"
      >
        Продолжить →
      </Link>
    </div>
  );
}

function TypeCard({ quiz }: { quiz: QuizResult | null }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-cream p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">Ваш тип</div>
      {quiz ? (
        <>
          <div className="mt-3 text-[22px] leading-tight font-light text-purple">
            {typeInfo[quiz.type].name}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
            {typeInfo[quiz.type].trigger}
          </p>
          <div className="mt-5 flex items-baseline gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-ink-soft">Влияние</div>
              <div className="mt-1 text-[28px] leading-none font-light">
                {quiz.impact}
                <span className="text-[16px] text-ink-soft">/7</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[9px] uppercase tracking-[0.14em] text-ink-soft">Пройден</div>
              <div className="mt-1.5 text-[13px]">
                {new Date(quiz.takenAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/result" className="btn-link text-[13px]">
              Смотреть результат →
            </Link>
            <Link
              to="/quiz"
              className="text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-purple"
            >
              ↻ Пройти опрос заново
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 text-[22px] leading-tight font-light text-ink-soft">—</div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
            Восемь вопросов, чтобы понять, что именно вас тормозит.
          </p>
          <Link to="/quiz" className="btn-link mt-4 inline-block text-[13px]">
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
    if (n === 0) return "bg-mint/40";
    if (n === 1) return "bg-lav/35";
    if (n === 2) return "bg-lav/65";
    return "bg-lav";
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-cream p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
        Календарь · 5 недель
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5 text-[10px] text-ink-soft">
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
            className={`relative aspect-square flex items-center justify-center rounded-lg text-[18px] leading-none font-light ${
              c.sessions > 1 ? "text-on-dark" : "text-ink-soft"
            } ${intensity(c.sessions)} transition-colors ${
              c.checkin ? "ring-2 ring-purple ring-offset-1 ring-offset-cream" : ""
            }`}
          >
            {c.day}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-[9px] uppercase tracking-[0.14em] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-lav" />
          сессия
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded ring-2 ring-purple ring-offset-1 ring-offset-cream" />
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
    <div className="rounded-2xl border border-ink/10 bg-cream p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-purple">Чек-ин · сегодня</div>
      <div className="mt-3 text-[22px] leading-tight font-light">
        {existing ? "Обновить запись" : "Как прошёл день?"}
      </div>
      <form onSubmit={save} className="mt-5 space-y-4">
        <label className="block">
          <span className="text-[9px] uppercase tracking-[0.14em] text-ink-soft">
            Что сделал(а)
          </span>
          <input
            value={done}
            onChange={(e) => setDone(e.target.value)}
            placeholder="Одно предложение"
            className="auth-input mt-1 w-full py-1.5 text-lg"
          />
        </label>
        <label className="block">
          <span className="text-[9px] uppercase tracking-[0.14em] text-ink-soft">
            Что отложил(а)
          </span>
          <input
            value={postponed}
            onChange={(e) => setPostponed(e.target.value)}
            placeholder="Без осуждения"
            className="auth-input mt-1 w-full py-1.5 text-lg"
          />
        </label>
        <label className="block">
          <span className="text-[9px] uppercase tracking-[0.14em] text-ink-soft">
            Что отвлекало (через запятую)
          </span>
          <input
            value={distractions}
            onChange={(e) => setDistractions(e.target.value)}
            placeholder="телефон, тревога, чат"
            className="auth-input mt-1 w-full py-1.5 text-lg"
          />
        </label>
        <div className="flex items-baseline gap-4">
          <button className="btn-primary">Сохранить</button>
          {savedFlash && (
            <span className="text-[10px] uppercase tracking-[0.14em] text-purple">— записано</span>
          )}
        </div>
      </form>
    </div>
  );
}
