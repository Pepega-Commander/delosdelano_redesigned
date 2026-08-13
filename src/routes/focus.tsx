import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Play, Pause, RotateCcw, Plus } from "lucide-react";
import { Shell } from "@/components/Shell";
import { store } from "@/lib/storage";
import {
  decomposeTask,
  summarizeSession,
  kickstartTask,
  unstuckHelp,
  chatTurn,
} from "@/lib/glm.functions";

export const Route = createFileRoute("/focus")({
  head: () => ({
    meta: [
      { title: "Фокус-режим — DeloSdelano" },
      { name: "description", content: "Рабочая консоль: таймер, шаги задачи и ИИ-помощник." },
    ],
  }),
  component: FocusPage,
});

const PRESETS = [2, 15, 25, 45] as const;
const REASONS = ["Соцсети", "Усталость", "Звонок", "Отвлёкся", "Другое"];

type ChatMsg = { role: "user" | "assistant"; content: string };
type Step = { text: string; done: boolean };

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function FocusPage() {
  const navigate = useNavigate();
  const [task, setTask] = useState("");
  const [why, setWhy] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { text: "", done: false },
    { text: "", done: false },
    { text: "", done: false },
  ]);
  const [totalSecs, setTotalSecs] = useState(25 * 60);
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [pauses, setPauses] = useState<{ at: number; reason: string }[]>([]);
  const [askReason, setAskReason] = useState(false);
  const [pauseNudge, setPauseNudge] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [notes, setNotes] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [decomposing, setDecomposing] = useState(false);
  const [kickstart, setKickstart] = useState<string | null>(null);
  const [kickstartLoading, setKickstartLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const startRef = useRef<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const decomposeFn = useServerFn(decomposeTask);
  const summarizeFn = useServerFn(summarizeSession);
  const kickstartFn = useServerFn(kickstartTask);
  const unstuckFn = useServerFn(unstuckHelp);
  const chatFn = useServerFn(chatTurn);

  useEffect(() => setName(store.getUser()?.name ?? null), []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          setRunning(false);
          setDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chat]);

  const progress = totalSecs > 0 ? 1 - secs / totalSecs : 0;
  const CIRC = 2 * Math.PI * 46;

  const stepsDone = steps.filter((s) => s.text.trim() && s.done).length;
  const stepsTotal = steps.filter((s) => s.text.trim()).length;

  const latestRef = useRef({ task, steps, pauses, notes });
  latestRef.current = { task, steps, pauses, notes };

  useEffect(() => {
    if (!done) return;
    let cancelled = false;
    const snap = latestRef.current;
    setSummarizing(true);
    summarizeFn({
      data: {
        task: snap.task,
        steps: snap.steps
          .filter((s) => s.text.trim())
          .map((s) => (s.done ? `[✓] ${s.text}` : s.text)),
        pauses: snap.pauses.map((p) => p.reason),
        completed: true,
      },
    })
      .then((r) => {
        if (!cancelled) setAiSummary(r.text || null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setAiError(e instanceof Error ? e.message : "Ошибка ИИ");
      })
      .finally(() => {
        if (!cancelled) setSummarizing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [done, summarizeFn]);

  // Hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.code === "Space") {
        e.preventDefault();
        setRunning((r) => !r);
      }
      if (e.code === "Escape") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickPreset(min: number) {
    setTotalSecs(min * 60);
    setSecs(min * 60);
    setRunning(false);
    setDone(false);
  }
  function extend(min: number) {
    setTotalSecs((t) => t + min * 60);
    setSecs((s) => s + min * 60);
    setDone(false);
  }
  function start() {
    if (!startRef.current) startRef.current = Date.now();
    setAskReason(false);
    setRunning(true);
  }
  function pause() {
    setRunning(false);
    setAskReason(true);
  }
  const reset = useCallback(() => {
    setRunning(false);
    setSecs(totalSecs);
    setPauses([]);
    startRef.current = null;
    setDone(false);
    setAskReason(false);
    setPauseNudge(null);
    setAiSummary(null);
    setAiError(null);
  }, [totalSecs]);

  async function pickReason(r: string) {
    setPauses((p) => [...p, { at: Date.now(), reason: r }]);
    setAskReason(false);
    setPauseNudge("…");
    try {
      const res = await unstuckFn({ data: { task, blocker: `Пауза: ${r}` } });
      setPauseNudge(res.text);
    } catch {
      setPauseNudge(null);
    }
  }

  async function handleDecompose() {
    if (!task.trim() || decomposing) return;
    setDecomposing(true);
    setAiError(null);
    try {
      const r = await decomposeFn({ data: { task } });
      setSteps([
        { text: r.steps[0] ?? "", done: false },
        { text: r.steps[1] ?? "", done: false },
        { text: r.steps[2] ?? "", done: false },
      ]);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Ошибка ИИ");
    } finally {
      setDecomposing(false);
    }
  }

  async function handleKickstart() {
    if (!task.trim() || kickstartLoading) return;
    setKickstartLoading(true);
    setAiError(null);
    try {
      const r = await kickstartFn({
        data: { task, steps: steps.map((s) => s.text).filter(Boolean) },
      });
      setKickstart(r.text);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Ошибка ИИ");
    } finally {
      setKickstartLoading(false);
    }
  }

  async function handleUnstuck() {
    const msg = "Я застрял. Что мне сделать прямо сейчас?";
    setChat((c) => [...c, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const res = await unstuckFn({ data: { task, blocker: notes || msg } });
      setChat((c) => [...c, { role: "assistant", content: res.text }]);
    } catch (e) {
      setChat((c) => [
        ...c,
        { role: "assistant", content: e instanceof Error ? e.message : "Ошибка ИИ" },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function sendChat() {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    const nextHistory = [...chat, { role: "user" as const, content: msg }];
    setChat(nextHistory);
    setChatLoading(true);
    try {
      const res = await chatFn({
        data: { task, message: msg, history: chat },
      });
      setChat((c) => [...c, { role: "assistant", content: res.text || "…" }]);
    } catch (e) {
      setChat((c) => [
        ...c,
        { role: "assistant", content: e instanceof Error ? e.message : "Ошибка ИИ" },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function toggleStep(i: number) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, done: !s.done } : s)));
  }
  function editStep(i: number, text: string) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, text } : s)));
  }
  function addStep() {
    setSteps((prev) => [...prev, { text: "", done: false }]);
  }

  function save() {
    store.addSession({
      id: crypto.randomUUID(),
      task,
      steps: steps.map((s) => s.text).filter(Boolean),
      startedAt: startRef.current ?? Date.now(),
      endedAt: Date.now(),
      pauses,
      completed: true,
    });
    if (name) store.addNotification(`Молодец, ${name}, ты справился!`);
    navigate({ to: "/deals" });
  }

  const activeIdx = useMemo(() => steps.findIndex((s) => s.text.trim() && !s.done), [steps]);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-ink pb-4">
          <div>
            <h1 className="font-editorial text-4xl leading-none text-ink md:text-5xl">
              Фокус-режим
            </h1>
          </div>
          <span className="stamp hidden md:inline-block">
            {running ? "В работе" : done ? "Готово" : "Готов"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px_320px]">
          {/* LEFT: task & steps */}
          <div className="card-brutal relative p-6">
            <div className="mb-4 flex items-center gap-2 font-mono text-[14px] font-bold uppercase tracking-[0.2em] text-ink-soft">
              <span
                className={`inline-block h-2 w-2 rounded-full ${running ? "bg-sage" : done ? "bg-terra" : "bg-ink/30"}`}
              />
              {running ? "Сессия идёт" : done ? "Завершена" : "Готов начать"}
            </div>
            <input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Что делаем?"
              className="w-full border-none bg-transparent p-0 font-editorial text-3xl leading-tight text-ink outline-none placeholder:text-ink/30"
            />
            <input
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Зачем? (одна строка)"
              className="mt-2 w-full border-none bg-transparent p-0 font-serif text-base italic text-ink-soft outline-none placeholder:text-ink/30"
            />

            <div className="mt-5 mb-4 flex flex-wrap items-center gap-2">
              <button
                onClick={handleDecompose}
                disabled={!task.trim() || decomposing}
                className="focus-chip"
              >
                <span aria-hidden className="font-mono text-sm leading-none">
                  ✳
                </span>
                {decomposing ? "Разбивает…" : "Разбить на шаги"}
              </button>
              <button
                onClick={handleKickstart}
                disabled={!task.trim() || kickstartLoading}
                className="focus-chip"
              >
                <span aria-hidden className="font-mono text-sm leading-none">
                  →
                </span>
                {kickstartLoading ? "…" : "С чего начать"}
              </button>
              <button onClick={handleUnstuck} className="focus-chip">
                <span aria-hidden className="font-mono text-sm leading-none">
                  ?
                </span>
                Я застрял
              </button>
            </div>

            {kickstart && (
              <div className="mb-4 border-2 border-ink bg-highlight/40 p-3 text-sm text-ink">
                <div className="mb-1 font-mono text-[14px] font-bold uppercase tracking-widest text-ink">
                  Первый шаг
                </div>
                {kickstart}
              </div>
            )}
            {aiError && (
              <div className="mb-4 border-2 border-terra bg-terra-soft p-3 font-mono text-[14px] text-ink">
                {aiError}
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[14px] font-bold uppercase tracking-[0.2em] text-ink-soft">
                Шаги
              </span>
              <span className="font-mono text-[14px] text-ink-soft">
                {stepsDone}/{stepsTotal || steps.length}
              </span>
            </div>

            <div className="space-y-2">
              {steps.map((s, i) => {
                const active = i === activeIdx;
                return (
                  <div
                    key={i}
                    className={`group relative border-2 p-3 transition-all ${
                      active
                        ? "border-ink bg-highlight/25 shadow-[3px_3px_0_var(--brutal)]"
                        : s.done
                          ? "border-ink/30 bg-paper-dark/60 opacity-60"
                          : "border-ink/60 bg-paper-soft"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStep(i)}
                        className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center border-2 transition-colors ${
                          s.done
                            ? "border-ink bg-sage text-ink"
                            : active
                              ? "border-ink bg-paper"
                              : "border-ink/50 bg-paper hover:border-ink"
                        }`}
                        aria-label={s.done ? "Отметить не сделанным" : "Отметить сделанным"}
                      >
                        {s.done && (
                          <svg className="h-3 w-3 text-ink" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6l3 3 5-6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        {!s.done && active && <span className="h-2 w-2 rounded-full bg-terra" />}
                      </button>
                      <input
                        value={s.text}
                        onChange={(e) => editStep(i, e.target.value)}
                        placeholder={`Шаг ${i + 1}`}
                        className={`flex-1 border-none bg-transparent p-0 font-serif text-base outline-none placeholder:text-ink/30 ${
                          s.done ? "text-ink-soft line-through" : "text-ink"
                        }`}
                      />
                      {active && (
                        <span className="bg-terra px-2 py-0.5 font-mono text-[14px] font-bold uppercase tracking-widest text-primary-foreground">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={addStep}
              className="mt-4 flex items-center gap-2 font-mono text-[14px] uppercase tracking-widest text-ink-soft transition-colors hover:text-terra"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить шаг
            </button>

            <div className="mt-8 border-t-2 border-dashed border-ink/30 pt-5">
              <div className="mb-2 flex items-center gap-2 font-mono text-[14px] font-bold uppercase tracking-[0.2em] text-ink-soft">
                <span aria-hidden className="font-mono text-sm leading-none">
                  ¶
                </span>
                Заметки сессии
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Мысли, идеи, вопросы к себе…"
                className="min-h-[80px] w-full resize-none border-2 border-ink/40 bg-paper-soft p-3 font-serif text-base text-ink outline-none placeholder:text-ink/30 focus:border-ink"
              />
            </div>
          </div>

          {/* MIDDLE: timer */}
          <div className="card-brutal flex flex-col items-center justify-start p-6">
            <div className="mb-3 font-mono text-[14px] font-bold uppercase tracking-[0.25em] text-ink-soft">
              Хронометр
            </div>
            <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => pickPreset(m)}
                  className={`border-2 border-ink px-3 py-1 font-mono text-[14px] font-bold uppercase transition-all ${
                    totalSecs === m * 60
                      ? "bg-ink text-paper"
                      : "bg-paper-soft text-ink hover:bg-highlight"
                  }`}
                >
                  {m}м
                </button>
              ))}
            </div>

            <div className="relative flex h-60 w-60 items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="var(--ink)"
                  strokeOpacity="0.2"
                  strokeWidth="2"
                  strokeDasharray="2 3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={done ? "var(--sage)" : "var(--terra)"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="z-10 text-center">
                <div className="font-mono text-6xl font-bold tabular-nums tracking-tight text-ink">
                  {fmt(secs)}
                </div>
                <div className="mt-2 font-mono text-[14px] font-bold uppercase tracking-[0.3em] text-ink-soft">
                  {done ? "Готово" : running ? "Фокус" : "Пауза"}
                </div>
              </div>
            </div>

            <div className="mt-8 w-full space-y-2">
              {!running && !done ? (
                <button
                  onClick={start}
                  className="flex w-full items-center justify-center gap-2 border-2 border-ink bg-terra py-3 font-mono text-[15px] font-bold uppercase tracking-widest text-primary-foreground warm-glow shadow-[4px_4px_0_var(--brutal)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_var(--brutal)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--brutal)]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Старт
                </button>
              ) : running ? (
                <button
                  onClick={pause}
                  className="flex w-full items-center justify-center gap-2 border-2 border-ink bg-ink py-3 font-mono text-[15px] font-bold uppercase tracking-widest text-paper warm-glow shadow-[4px_4px_0_var(--brutal)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <Pause className="h-4 w-4 fill-current" />
                  Пауза
                </button>
              ) : (
                <button
                  onClick={() => extend(5)}
                  className="flex w-full items-center justify-center gap-2 border-2 border-ink bg-sage py-3 font-mono text-[15px] font-bold uppercase tracking-widest text-ink warm-glow shadow-[4px_4px_0_var(--brutal)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px]"
                >
                  +5 минут в потоке
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => extend(5)}
                  className="flex-1 border-2 border-ink bg-paper-soft py-2.5 font-mono text-[14px] font-bold uppercase tracking-widest text-ink transition-colors hover:bg-highlight"
                >
                  +5 мин
                </button>
                <button
                  onClick={reset}
                  className="flex-1 border-2 border-ink bg-paper-soft py-2.5 text-ink transition-colors hover:bg-highlight"
                >
                  <RotateCcw className="mx-auto h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {askReason && (
              <div className="mt-6 w-full border-2 border-ink bg-paper-soft p-4">
                <div className="mb-2 font-mono text-[14px] font-bold uppercase tracking-widest text-ink-soft">
                  Что сбило?
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => pickReason(r)}
                      className="border-2 border-ink bg-paper px-3 py-1 font-mono text-[14px] font-bold uppercase text-ink transition-colors hover:bg-terra hover:text-primary-foreground"
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {pauseNudge && (
                  <div className="mt-3 border-t-2 border-dashed border-ink/30 pt-3 font-serif text-base text-ink">
                    💡 {pauseNudge}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center gap-6 border-t-2 border-dashed border-ink/30 pt-4">
              <div className="text-center">
                <div className="font-mono text-[14px] font-bold uppercase tracking-widest text-ink-soft">
                  Паузы
                </div>
                <div className="font-mono text-lg font-bold text-ink">{pauses.length}</div>
              </div>
              <div className="h-8 w-px bg-ink/30" />
              <div className="text-center">
                <div className="font-mono text-[14px] font-bold uppercase tracking-widest text-ink-soft">
                  Всего
                </div>
                <div className="font-mono text-lg font-bold text-ink">{fmt(totalSecs)}</div>
              </div>
            </div>

            <div className="mt-4 text-center font-mono text-[14px] uppercase tracking-widest text-ink-soft">
              Space — старт/пауза · Esc — сброс
            </div>
          </div>

          {/* RIGHT: assistant */}
          <div className="card-brutal flex flex-col p-0">
            <div className="border-b-2 border-ink bg-highlight/50 px-5 py-3 dark:bg-paper-dark">
              <div className="flex items-center gap-2 font-mono text-[14px] font-bold uppercase tracking-[0.2em] text-ink">
                <span aria-hidden className="font-mono text-sm leading-none">
                  ✳
                </span>
                ИИ-ассистент
              </div>
              <div className="mt-1 font-serif text-base italic text-ink-soft">
                Спроси что угодно про задачу.
              </div>
            </div>

            <div ref={chatScrollRef} className="min-h-[280px] flex-1 space-y-3 overflow-y-auto p-4">
              {chat.length === 0 && (
                <div className="font-serif text-base italic text-ink-soft">
                  Начни диалог — я помогу двинуть задачу, не покидая фокус.
                </div>
              )}
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`border-2 border-ink px-3 py-2 font-serif text-base ${
                    m.role === "user"
                      ? "ml-6 bg-highlight/40 text-ink dark:bg-paper-dark"
                      : "mr-6 bg-paper-soft text-ink"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {chatLoading && (
                <div className="mr-6 border-2 border-dashed border-ink/40 bg-paper-soft px-3 py-2 font-mono text-[14px] uppercase tracking-widest text-ink-soft">
                  печатает…
                </div>
              )}
            </div>

            <div className="border-t-2 border-ink bg-paper-dark/50 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendChat();
                    }
                  }}
                  placeholder="Спросить у ИИ…"
                  rows={1}
                  className="max-h-24 flex-1 resize-none border-2 border-ink bg-paper p-2 font-serif text-base text-ink outline-none placeholder:text-ink/30 focus:bg-paper-soft"
                />
                <button
                  onClick={() => void sendChat()}
                  disabled={!chatInput.trim() || chatLoading}
                  className="warm-glow flex h-10 w-10 items-center justify-center border-2 border-ink bg-terra text-primary-foreground shadow-[2px_2px_0_var(--brutal)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] disabled:opacity-40"
                >
                  <span aria-hidden className="font-mono text-lg leading-none">
                    ↑
                  </span>
                </button>
              </div>
            </div>
          </div>

          {done && (
            <div className="card-brutal relative mt-6 p-8 lg:col-span-3">
              <span className="tape" />
              <div className="mb-4 flex items-center gap-2 font-mono text-[14px] font-bold uppercase tracking-[0.2em] text-ink-soft">
                <span className="inline-block h-2 w-2 rounded-full bg-sage" />
                Сессия завершена
              </div>
              <h2 className="font-editorial text-3xl text-ink">
                {name ? `${name}, разбор сессии` : "Разбор сессии"}
              </h2>
              <div className="mt-4 min-h-[80px] whitespace-pre-line border-2 border-ink bg-paper-soft p-4 font-serif text-base leading-relaxed text-ink">
                {summarizing && (
                  <span className="font-mono text-[14px] uppercase tracking-widest text-ink-soft">
                    ИИ разбирает сессию…
                  </span>
                )}
                {!summarizing && aiSummary}
                {!summarizing && !aiSummary && <span className="text-ink-soft">Нет разбора.</span>}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={save}
                  className="border-2 border-ink bg-terra px-6 py-3 font-mono text-[15px] font-bold uppercase tracking-widest text-primary-foreground warm-glow shadow-[4px_4px_0_var(--brutal)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_var(--brutal)]"
                >
                  Сохранить в дневник
                </button>
                <button
                  onClick={reset}
                  className="border-2 border-ink bg-paper-soft px-6 py-3 font-mono text-[15px] font-bold uppercase tracking-widest text-ink transition-colors hover:bg-highlight"
                >
                  Ещё сессия
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
