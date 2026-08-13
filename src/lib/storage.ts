export type ProcType = "perfectionist" | "avoider" | "rebel" | "anxious";

export interface Session {
  id: string;
  task: string;
  steps: string[];
  startedAt: number;
  endedAt: number;
  pauses: { at: number; reason: string }[];
  completed: boolean;
}

export interface QuizResult {
  type: ProcType;
  trigger: string;
  impact: number; // 1-10
  answers: number[];
  takenAt: number;
}

export interface PlanProgress {
  planId?: string; // set for all new records; legacy records default to 'full'
  startedAt: number;
  completedChapters: number[]; // chapter indices within the selected plan
  finishedAt?: number;
  letter?: string;
}

export interface User {
  name: string;
  avatar?: string; // dataURL, stored locally
  email?: string;
  password?: string; // stored locally in-browser only
}

export interface Checkin {
  date: string; // YYYY-MM-DD
  done: string;
  postponed: string;
  distractions: string[];
}

const KEYS = {
  sessions: "ap.sessions",
  quiz: "ap.quiz",
  plan: "ap.plan", // legacy single active plan
  plans: "ap.plans", // Record<planId, PlanProgress>
  archive: "ap.archive",
  checkins: "ap.checkins",
  user: "ap.user",
  notifications: "ap.notifications",
  onboarded: "ap.onboarded",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

let migrated = false;
function migrate() {
  if (migrated || typeof window === "undefined") return;
  migrated = true;
  const plans = read<Record<string, PlanProgress>>(KEYS.plans, {});
  const legacy = read<PlanProgress | null>(KEYS.plan, null);
  if (legacy && !plans["full"]) {
    plans["full"] = { planId: "full", ...legacy };
    write(KEYS.plans, plans);
    try {
      localStorage.removeItem(KEYS.plan);
    } catch {
      /* noop */
    }
  }
  const arch = read<PlanProgress[]>(KEYS.archive, []);
  if (arch.some((a) => !a.planId)) {
    write(
      KEYS.archive,
      arch.map((a) => ({ planId: a.planId ?? "full", ...a })),
    );
  }
}

export const store = {
  getSessions: () => read<Session[]>(KEYS.sessions, []),
  addSession: (s: Session) => write(KEYS.sessions, [...read<Session[]>(KEYS.sessions, []), s]),

  getQuiz: () => read<QuizResult | null>(KEYS.quiz, null),
  setQuiz: (q: QuizResult) => write(KEYS.quiz, q),

  // Per-plan progress (new API).
  getAllPlanProgress: (): Record<string, PlanProgress> => {
    migrate();
    return read<Record<string, PlanProgress>>(KEYS.plans, {});
  },
  getPlanProgress: (id: string): PlanProgress | null => {
    migrate();
    const all = read<Record<string, PlanProgress>>(KEYS.plans, {});
    return all[id] ?? null;
  },
  setPlanProgress: (id: string, p: PlanProgress) => {
    migrate();
    const all = read<Record<string, PlanProgress>>(KEYS.plans, {});
    all[id] = { ...p, planId: id };
    write(KEYS.plans, all);
  },
  archivePlanProgress: (id: string, p: PlanProgress) => {
    migrate();
    const arch = read<PlanProgress[]>(KEYS.archive, []);
    write(KEYS.archive, [...arch, { ...p, planId: id }]);
    const all = read<Record<string, PlanProgress>>(KEYS.plans, {});
    delete all[id];
    write(KEYS.plans, all);
  },
  // Legacy aliases keep old callers working (they operate on the "full" plan).
  getPlan: (): PlanProgress | null => {
    migrate();
    const all = read<Record<string, PlanProgress>>(KEYS.plans, {});
    return all["full"] ?? null;
  },
  setPlan: (p: PlanProgress) => {
    migrate();
    const all = read<Record<string, PlanProgress>>(KEYS.plans, {});
    all["full"] = { ...p, planId: "full" };
    write(KEYS.plans, all);
  },
  archivePlan: (p: PlanProgress) => {
    migrate();
    const arch = read<PlanProgress[]>(KEYS.archive, []);
    write(KEYS.archive, [...arch, { ...p, planId: p.planId ?? "full" }]);
    const all = read<Record<string, PlanProgress>>(KEYS.plans, {});
    delete all[p.planId ?? "full"];
    write(KEYS.plans, all);
  },
  getArchive: (): PlanProgress[] => {
    migrate();
    return read<PlanProgress[]>(KEYS.archive, []);
  },

  getCheckins: () => read<Checkin[]>(KEYS.checkins, []),
  addCheckin: (c: Checkin) => {
    const all = read<Checkin[]>(KEYS.checkins, []).filter((x) => x.date !== c.date);
    write(KEYS.checkins, [...all, c]);
  },

  getUser: () => read<User | null>(KEYS.user, null),
  setUser: (u: User) => write(KEYS.user, u),
  clearUser: () => {
    if (typeof window !== "undefined") localStorage.removeItem(KEYS.user);
  },

  getNotifications: () =>
    read<{ id: string; text: string; at: number; read: boolean }[]>(KEYS.notifications, []),
  addNotification: (text: string) => {
    const list = read<{ id: string; text: string; at: number; read: boolean }[]>(
      KEYS.notifications,
      [],
    );
    write(KEYS.notifications, [
      { id: crypto.randomUUID(), text, at: Date.now(), read: false },
      ...list,
    ]);
  },
  markNotificationsRead: () => {
    const list = read<{ id: string; text: string; at: number; read: boolean }[]>(
      KEYS.notifications,
      [],
    );
    write(
      KEYS.notifications,
      list.map((n) => ({ ...n, read: true })),
    );
  },

  isOnboarded: () => read<boolean>(KEYS.onboarded, false),
  setOnboarded: () => write(KEYS.onboarded, true),
};

export function computeStreak(checkins: Checkin[]): number {
  if (!checkins.length) return 0;
  const days = new Set(checkins.map((c) => c.date));
  let streak = 0;
  const d = new Date();
  // If no check-in today, start counting from yesterday
  const iso = (dt: Date) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  if (!days.has(iso(d))) d.setDate(d.getDate() - 1);
  while (days.has(iso(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
