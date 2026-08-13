import { createServerFn } from "@tanstack/react-start";

const GLM_URL = "https://api.z.ai/api/paas/v4/chat/completions";
const MODEL = process.env.GLM_MODEL ?? "glm-4.6";

async function callGlm(system: string, user: string, wantJson = false) {
  const key = process.env.GLM_API_KEY;
  if (!key) throw new Error("GLM_API_KEY missing");
  const res = await fetch(GLM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.5,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(wantJson ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GLM ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export const decomposeTask = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (
      typeof input !== "object" ||
      input === null ||
      !isNonEmptyString((input as { task?: unknown }).task)
    ) {
      throw new Error("task required");
    }
    return { task: (input as { task: string }).task.slice(0, 500) };
  })
  .handler(async ({ data }) => {
    const system =
      'Ты помогаешь преодолеть прокрастинацию. Разбей задачу на 3 крошечных первых шага, каждый — конкретное физическое действие, которое можно сделать за 30-60 секунд. Первый шаг должен быть максимально лёгким (открыть файл, нажать кнопку). Отвечай ТОЛЬКО JSON вида {"steps":["...","...","..."]}. Без пояснений. По-русски. Каждый шаг не длиннее 60 символов.';
    const raw = await callGlm(system, `Задача: ${data.task}`, true);
    try {
      const parsed = JSON.parse(raw) as { steps?: unknown };
      const steps = Array.isArray(parsed.steps)
        ? parsed.steps.filter(isNonEmptyString).slice(0, 3)
        : [];
      while (steps.length < 3) steps.push("");
      return { steps };
    } catch {
      return { steps: ["", "", ""] };
    }
  });

export const summarizeSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const obj = (input ?? {}) as {
      task?: unknown;
      steps?: unknown;
      pauses?: unknown;
      completed?: unknown;
    };
    return {
      task: isNonEmptyString(obj.task) ? obj.task.slice(0, 500) : "",
      steps: Array.isArray(obj.steps) ? obj.steps.filter(isNonEmptyString).slice(0, 3) : [],
      pauses: Array.isArray(obj.pauses) ? obj.pauses.filter(isNonEmptyString).slice(0, 10) : [],
      completed: Boolean(obj.completed),
    };
  })
  .handler(async ({ data }) => {
    const system =
      "Ты коуч по борьбе с прокрастинацией. Дай короткий разбор фокус-сессии на русском. Формат ответа — ровно три коротких абзаца, каждый начинается с эмодзи-маркера и одной жирной фразой-темой:\n✅ **Что получилось** — 1 предложение.\n➡️ **Что дальше** — конкретный следующий шаг, 1 предложение.\n💡 **Совет** — один практичный приём под причины пауз, 1 предложение.\nБез вступлений и лишних слов.";
    const user = `Задача: ${data.task || "(не указана)"}\nШаги: ${
      data.steps.length ? data.steps.join("; ") : "(не заполнены)"
    }\nПаузы (причины): ${data.pauses.length ? data.pauses.join(", ") : "нет"}\nЗавершил таймер: ${data.completed ? "да" : "нет"}`;
    const text = await callGlm(system, user);
    return { text };
  });

export const kickstartTask = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const o = (input ?? {}) as { task?: unknown; steps?: unknown };
    return {
      task: isNonEmptyString(o.task) ? o.task.slice(0, 500) : "",
      steps: Array.isArray(o.steps) ? o.steps.filter(isNonEmptyString).slice(0, 3) : [],
    };
  })
  .handler(async ({ data }) => {
    const system =
      "Ты помогаешь начать работу. Напиши ОДНО конкретное первое физическое действие (открыть X, нажать Y, набрать первую строку Z), которое человек может сделать за 20 секунд. Максимум 100 символов. Только сама фраза, без вступлений. По-русски.";
    const user = `Задача: ${data.task}\nШаги: ${data.steps.join("; ") || "не заданы"}`;
    const text = await callGlm(system, user);
    return { text: text.replace(/^["«»']|["«»']$/g, "") };
  });

export const unstuckHelp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const o = (input ?? {}) as { task?: unknown; blocker?: unknown };
    return {
      task: isNonEmptyString(o.task) ? o.task.slice(0, 500) : "",
      blocker: isNonEmptyString(o.blocker) ? o.blocker.slice(0, 400) : "",
    };
  })
  .handler(async ({ data }) => {
    const system =
      "Ты помогаешь человеку выйти из ступора при работе над задачей. Дай ОДИН конкретный обходной шаг, который можно сделать сейчас. Максимум 2 короткие фразы. По-русски. Без воды.";
    const user = `Задача: ${data.task}\nЧто мешает: ${data.blocker || "не описано"}`;
    const text = await callGlm(system, user);
    return { text };
  });

export const chatTurn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const o = (input ?? {}) as { task?: unknown; message?: unknown; history?: unknown };
    const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(o.history)
      ? (o.history as unknown[])
          .filter(
            (m): m is { role: "user" | "assistant"; content: string } =>
              typeof m === "object" &&
              m !== null &&
              (["user", "assistant"] as const).includes(
                (m as { role?: unknown }).role as "user" | "assistant",
              ) &&
              isNonEmptyString((m as { content?: unknown }).content),
          )
          .slice(-10)
      : [];
    return {
      task: isNonEmptyString(o.task) ? o.task.slice(0, 500) : "",
      message: isNonEmptyString(o.message) ? o.message.slice(0, 1000) : "",
      history,
    };
  })
  .handler(async ({ data }) => {
    if (!data.message) return { text: "" };
    const key = process.env.GLM_API_KEY;
    if (!key) throw new Error("GLM_API_KEY missing");
    const model = process.env.GLM_MODEL ?? "glm-4.6";
    const messages = [
      {
        role: "system",
        content: `Ты ассистент внутри фокус-сессии. Помогаешь пользователю сдвинуться с задачи: "${data.task || "не указана"}". Отвечай коротко и по делу, максимум 3 предложения. Никакой воды, никаких вступлений. По-русски.`,
      },
      ...data.history,
      { role: "user", content: data.message },
    ];
    const res = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, temperature: 0.6, messages }),
    });
    if (!res.ok) throw new Error(`GLM ${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { text: json.choices?.[0]?.message?.content?.trim() ?? "" };
  });
