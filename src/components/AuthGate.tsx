import { useState, type ReactNode } from "react";

import { authErrorMessage, login, register } from "@/lib/auth-api";
import { endAuthSession, startAuthSession, useAuthUser } from "@/lib/auth-session";

export function AuthGate({
  children,
  title,
}: {
  children: (name: string) => ReactNode;
  title: string;
}) {
  const user = useAuthUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user) return <>{children(user.name)}</>;

  const isSignup = mode === "signup";
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const nameError = touched && isSignup && !trimmedName ? "Пожалуйста, введите имя" : null;
  const emailError =
    touched && (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      ? "Похоже, это не почта"
      : null;
  const passwordError =
    touched && (isSignup ? password.length < 8 : password.length === 0)
      ? isSignup
        ? "Минимум 8 символов"
        : "Введите пароль"
      : null;

  function selectMode(nextMode: "signin" | "signup") {
    if (pending) return;
    setMode(nextMode);
    setTouched(false);
    setFormError(null);
    setPassword("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    setTouched(true);
    setFormError(null);
    const invalid =
      (isSignup && !trimmedName) ||
      !trimmedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) ||
      (isSignup ? password.length < 8 : password.length === 0);
    if (invalid) return;

    setPending(true);
    try {
      const response = isSignup
        ? await register({ name: trimmedName, email: trimmedEmail, password })
        : await login({ email: trimmedEmail, password });
      startAuthSession(response);
      setPassword("");
    } catch (error) {
      endAuthSession();
      setFormError(authErrorMessage(error, isSignup ? "register" : "login"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16 md:py-20">
      <div className="relative rounded-2xl border border-ink/10 bg-cream p-8 shadow-[var(--shadow-3)] md:p-10">
        <div className="eyebrow flex items-center gap-3">
          <span className="inline-block h-px w-8 bg-purple/60" />
          {isSignup ? "Знакомство" : "С возвращением"}
        </div>

        <h1 className="text-balance mt-4 text-[34px] leading-[1.1] font-light md:text-[40px]">
          {title}
        </h1>

        <div
          role="tablist"
          className="mt-6 inline-flex rounded-full border border-ink/12 bg-paper-soft p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isSignup}
            disabled={pending}
            onClick={() => selectMode("signup")}
            className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors disabled:cursor-wait disabled:opacity-60 ${
              isSignup ? "bg-purple text-on-dark" : "text-ink-soft hover:text-ink"
            }`}
          >
            Регистрация
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isSignup}
            disabled={pending}
            onClick={() => selectMode("signin")}
            className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors disabled:cursor-wait disabled:opacity-60 ${
              !isSignup ? "bg-purple text-on-dark" : "text-ink-soft hover:text-ink"
            }`}
          >
            Вход
          </button>
        </div>

        <p className="mt-5 text-[13.5px] leading-[1.75] text-ink-soft">
          {isSignup
            ? "Создайте аккаунт: имя — для обращения, почта и пароль — для входа."
            : "Войдите по почте и паролю."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          {isSignup && (
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">Имя</span>
              <input
                autoFocus
                value={name}
                maxLength={60}
                disabled={pending}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Например: Ася"
                autoComplete="name"
                className={`auth-input mt-2 w-full min-w-0 py-2 text-xl transition-colors disabled:opacity-60 md:text-2xl ${
                  nameError ? "!border-b-[#a15c6a]" : ""
                }`}
              />
              {nameError && <span className="mt-2 block text-xs text-[#a15c6a]">{nameError}</span>}
            </label>
          )}

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">Почта</span>
            <input
              type="email"
              value={email}
              disabled={pending}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="you@example.com"
              autoComplete="email"
              className={`auth-input mt-2 w-full min-w-0 py-2 text-xl transition-colors disabled:opacity-60 md:text-2xl ${
                emailError ? "!border-b-[#a15c6a]" : ""
              }`}
            />
            {emailError && <span className="mt-2 block text-xs text-[#a15c6a]">{emailError}</span>}
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">Пароль</span>
            <input
              type="password"
              value={password}
              maxLength={isSignup ? 100 : undefined}
              disabled={pending}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={isSignup ? "Минимум 8 символов" : "••••••••"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className={`auth-input mt-2 w-full min-w-0 py-2 text-xl transition-colors disabled:opacity-60 md:text-2xl ${
                passwordError ? "!border-b-[#a15c6a]" : ""
              }`}
            />
            {passwordError && (
              <span className="mt-2 block text-xs text-[#a15c6a]">{passwordError}</span>
            )}
          </label>

          {formError && (
            <div role="alert" aria-live="polite" className="text-xs text-[#a15c6a]">
              {formError}
            </div>
          )}

          {!isSignup && (
            <div className="text-right">
              <button
                type="button"
                disabled={pending}
                onClick={() => setFormError("Восстановление пароля будет доступно позже.")}
                className="text-[10px] uppercase tracking-[0.16em] text-ink-soft underline underline-offset-4 hover:text-purple disabled:opacity-60"
              >
                Забыли пароль?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="btn-primary group w-full justify-between disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Подождите…" : isSignup ? "Создать" : "Войти"}
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5"
            >
              →
            </span>
          </button>
        </form>

        <p className="mt-8 border-t border-ink/10 pt-4 text-[9px] uppercase tracking-[0.18em] text-ink-soft">
          Имя · почта · пароль
        </p>
      </div>
    </div>
  );
}
