import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Play, Pause, RotateCcw, Plus } from "lucide-react";
import { Shell } from "@/components/Shell";
import { DoodleStar } from "@/components/Doodles";
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
      <div className="font-comfortaa mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-ink/12 pb-4">
          <div className="flex items-end gap-4">
            <h1 className="text-[36px] leading-none font-light text-ink md:text-[44px]">
              Фокус-режим
            </h1>
            <DoodleStar className="mb-1 h-6 w-6 text-purple/45" />
          </div>
          <span className="stamp hidden md:inline-block">
            {running ? "В работе" : done ? "Готово" : "Готов"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px_320px]">
          {/* LEFT: task & steps */}
          <div className="card-brutal relative rounded-xl p-6">
            <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
              <span
                className={`inline-block h-2 w-2 rounded-full ${running ? "bg-purple" : done ? "bg-lav" : "bg-ink/25"}`}
              />
              {running ? "Сессия идёт" : done ? "Завершена" : "Готов начать"}
            </div>
            <input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Что делаем?"
              className="w-full border-none bg-transparent p-0 text-[26px] leading-tight font-light text-ink outline-none placeholder:text-ink/50"
            />
            <input
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Зачем? (одна строка)"
              className="mt-2 w-full border-none bg-transparent p-0 text-[13px] text-ink-soft outline-none placeholder:text-ink/50"
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
              <div className="mb-4 rounded-lg bg-mint px-3.5 py-3 text-[13px] leading-relaxed text-ink">
                <div className="mb-1 text-[9px] uppercase tracking-[0.16em] text-ink/70">
                  Первый шаг
                </div>
                {kickstart}
              </div>
            )}
            {aiError && (
              <div className="mb-4 rounded-lg bg-[#f0dfe2] px-3.5 py-3 text-[12px] text-[#7d3f4a]">
                {aiError}
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">Шаги</span>
              <span className="text-[11px] text-ink-soft">
                {stepsDone}/{stepsTotal || steps.length}
              </span>
            </div>

            <div className="space-y-2">
              {steps.map((s, i) => {
                const active = i === activeIdx;
                return (
                  <div
                    key={i}
                    className={`group relative rounded-lg border p-3 transition-all ${
                      active
                        ? "border-purple/45 bg-mint/55"
                        : s.done
                          ? "border-ink/10 bg-paper-soft opacity-60"
                          : "border-ink/12 bg-paper-soft"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStep(i)}
                        className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md border transition-colors ${
                          s.done
                            ? "border-purple bg-purple text-on-dark"
                            : active
                              ? "border-purple bg-cream"
                              : "border-ink/25 bg-cream hover:border-purple"
                        }`}
                        aria-label={s.done ? "Отметить не сделанным" : "Отметить сделанным"}
                      >
                        {s.done && (
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6l3 3 5-6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        {!s.done && active && <span className="h-2 w-2 rounded-full bg-purple" />}
                      </button>
                      <input
                        value={s.text}
                        onChange={(e) => editStep(i, e.target.value)}
                        placeholder={`Шаг ${i + 1}`}
                        className={`flex-1 border-none bg-transparent p-0 text-[14px] outline-none placeholder:text-ink/50 ${
                          s.done ? "text-ink-soft line-through" : "text-ink"
                        }`}
                      />
                      {active && (
                        <span className="rounded-full bg-purple px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-on-dark">
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
              className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-purple"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить шаг
            </button>

            <div className="mt-8 border-t border-ink/10 pt-5">
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                <span aria-hidden className="text-sm leading-none">
                  ¶
                </span>
                Заметки сессии
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Мысли, идеи, вопросы к себе…"
                className="min-h-[80px] w-full resize-none rounded-lg border border-ink/12 bg-paper-soft p-3 text-[13.5px] text-ink outline-none placeholder:text-ink/50 focus:border-purple"
              />
            </div>
          </div>

          {/* MIDDLE: timer */}
          <div className="card-brutal flex flex-col items-center justify-start rounded-xl p-6">
            <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              Хронометр
            </div>
            <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => pickPreset(m)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-[0.08em] transition-all ${
                    totalSecs === m * 60
                      ? "bg-purple text-on-dark"
                      : "bg-paper-soft text-ink hover:bg-mint"
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
                  stroke="var(--lav)"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                  strokeDasharray="2 3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={done ? "var(--lav)" : "var(--purple)"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="z-10 text-center">
                <div className="text-[56px] leading-none font-light tabular-nums tracking-[-0.02em] text-ink">
                  {fmt(secs)}
                </div>
                <div className="mt-3 text-[9px] uppercase tracking-[0.3em] text-ink-soft">
                  {done ? "Готово" : running ? "Фокус" : "Пауза"}
                </div>
              </div>
            </div>

            <div className="mt-8 w-full space-y-2">
              {!running && !done ? (
                <button onClick={start} className="btn-primary w-full py-3.5">
                  <Play className="h-4 w-4 fill-current" />
                  Старт
                </button>
              ) : running ? (
                <button onClick={pause} className="btn-primary w-full py-3.5">
                  <Pause className="h-4 w-4 fill-current" />
                  Пауза
                </button>
              ) : (
                <button onClick={() => extend(5)} className="btn-soft w-full py-3.5">
                  +5 минут в потоке
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => extend(5)}
                  className="flex-1 rounded-lg border border-ink/10 bg-paper-soft py-2.5 text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-mint"
                >
                  +5 мин
                </button>
                <button
                  onClick={reset}
                  className="flex-1 rounded-lg border border-ink/10 bg-paper-soft py-2.5 text-ink transition-colors hover:bg-mint"
                >
                  <RotateCcw className="mx-auto h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {askReason && (
              <div className="mt-6 w-full rounded-xl bg-mint/55 p-4">
                <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                  Что сбило?
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => pickReason(r)}
                      className="rounded-full border border-ink/12 bg-cream px-3 py-1 text-[10px] uppercase tracking-[0.06em] text-ink transition-colors hover:bg-purple hover:text-on-dark"
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {pauseNudge && (
                  <div className="mt-3 border-t border-ink/10 pt-3 text-[12.5px] leading-relaxed text-ink">
                    💡 {pauseNudge}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center gap-6 border-t border-ink/10 pt-4">
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-[0.16em] text-ink-soft">Паузы</div>
                <div className="mt-1 text-lg font-light text-ink">{pauses.length}</div>
              </div>
              <div className="h-8 w-px bg-ink/10" />
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-[0.16em] text-ink-soft">Всего</div>
                <div className="mt-1 text-lg font-light text-ink">{fmt(totalSecs)}</div>
              </div>
            </div>

            <div className="mt-4 text-center text-[9px] uppercase tracking-[0.14em] text-ink-soft">
              Space — старт/пауза · Esc — сброс
            </div>
          </div>

          {/* RIGHT: assistant */}
          <div className="card-brutal flex flex-col overflow-hidden rounded-xl p-0">
            <div className="border-b border-ink/10 bg-mint/60 px-5 py-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-ink">
                <span aria-hidden className="text-sm leading-none">
                  ✳
                </span>
                ИИ-ассистент
              </div>
              <div className="mt-1.5 text-[12px] text-ink/65">Спроси что угодно про задачу.</div>
            </div>

            <div ref={chatScrollRef} className="min-h-[280px] flex-1 space-y-3 overflow-y-auto p-4">
              {chat.length === 0 && (
                <div className="text-[13px] leading-relaxed text-ink-soft">
                  Начни диалог — я помогу двинуть задачу, не покидая фокус.
                </div>
              )}
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    m.role === "user" ? "ml-6 bg-mint/70 text-ink" : "mr-6 bg-paper-soft text-ink"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {chatLoading && (
                <div className="mr-6 rounded-xl border border-dashed border-ink/15 bg-paper-soft px-3.5 py-2.5 text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                  печатает…
                </div>
              )}
            </div>

            <div className="border-t border-ink/10 bg-cream p-3">
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
                  className="max-h-24 flex-1 resize-none rounded-lg border border-ink/12 bg-paper-soft p-2.5 text-[13px] text-ink outline-none placeholder:text-ink/50 focus:border-purple"
                />
                <button
                  onClick={() => void sendChat()}
                  disabled={!chatInput.trim() || chatLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-purple text-on-dark transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-2)] disabled:opacity-40"
                >
                  <span aria-hidden className="text-lg leading-none">
                    ↑
                  </span>
                </button>
              </div>
            </div>
          </div>

          {done && (
            <div className="card-brutal relative mt-1 rounded-xl p-8 lg:col-span-3">
              <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                <span className="inline-block h-2 w-2 rounded-full bg-purple" />
                Сессия завершена
              </div>
              <h2 className="text-[28px] leading-tight font-light text-ink">
                {name ? `${name}, разбор сессии` : "Разбор сессии"}
              </h2>
              <div className="mt-4 min-h-[80px] whitespace-pre-line rounded-xl bg-paper-soft p-4 text-[13.5px] leading-relaxed text-ink">
                {summarizing && (
                  <span className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    ИИ разбирает сессию…
                  </span>
                )}
                {!summarizing && aiSummary}
                {!summarizing && !aiSummary && <span className="text-ink-soft">Нет разбора.</span>}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={save} className="btn-primary">
                  Сохранить в дневник
                </button>
                <button onClick={reset} className="btn-outline">
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
