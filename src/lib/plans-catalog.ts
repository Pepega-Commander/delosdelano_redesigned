import { chapters, type Chapter } from "./plan-data";

export type PlanAccent = "terra" | "sage" | "mustard" | "ink";

export interface PlanTemplate {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  accent: PlanAccent;
  chapterIndices: number[];
  minutes: number;
  intro: string;
}

export const planTemplates: PlanTemplate[] = [
  {
    id: "full",
    title: "Пять глав, чтобы сдвинуться",
    subtitle: "Основной план: от признания до помощи",
    tag: "Основной",
    accent: "terra",
    chapterIndices: [0, 1, 2, 3, 4],
    minutes: 40,
    intro: "Полный маршрут: пять глав, каждая — как бережный разговор.",
  },
  {
    id: "mini",
    title: "Мини-план на три шага",
    subtitle: "Быстрый вход: признать, уменьшить, заметить",
    tag: "Короткий",
    accent: "sage",
    chapterIndices: [0, 1, 2],
    minutes: 20,
    intro: "Если долго откладывали — начните с трёх коротких глав.",
  },
  {
    id: "fear",
    title: "Про страх",
    subtitle: "Работа с тревогой и внутренним критиком",
    tag: "Тема · Тревога",
    accent: "mustard",
    chapterIndices: [0, 2, 4],
    minutes: 25,
    intro: "Три главы, которые помогают, когда страх сильнее задачи.",
  },
  {
    id: "ritual",
    title: "Ритуал вместо мотивации",
    subtitle: "Как перестать полагаться на настроение",
    tag: "Тема · Практика",
    accent: "ink",
    chapterIndices: [1, 3],
    minutes: 18,
    intro: "Две главы про ежедневную опору: маленький шаг и ритуал.",
  },
];

export function getPlanTemplate(id: string): PlanTemplate | null {
  return planTemplates.find((p) => p.id === id) ?? null;
}

export function planChapters(id: string): Chapter[] {
  const t = getPlanTemplate(id);
  if (!t) return [];
  return t.chapterIndices.map((i) => chapters[i]).filter(Boolean);
}

export function accentClasses(accent: PlanAccent) {
  switch (accent) {
    case "terra":
      return { bg: "bg-purple", text: "text-purple", border: "border-purple" };
    case "sage":
      return { bg: "bg-lav", text: "text-ink", border: "border-lav" };
    case "mustard":
      return { bg: "bg-mint", text: "text-ink", border: "border-mint" };
    case "ink":
      return { bg: "bg-deep", text: "text-deep", border: "border-deep" };
  }
}
