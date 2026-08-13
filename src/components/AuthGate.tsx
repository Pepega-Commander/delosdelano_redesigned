import { useEffect, useState, type ReactNode } from "react";
import { store, type User } from "@/lib/storage";

export function AuthGate({
  children,
  title,
}: {
  children: (name: string) => ReactNode;
  title: string;
}) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => setUser(store.getUser()), []);

  if (user === undefined) return null;

  if (!user) {
    const isSignup = mode === "signup";
    const trimmed = name.trim();
    const emailTrim = email.trim();
    const nameError = touched && !trimmed ? "Пожалуйста, введите имя" : null;
    const emailInvalid = touched && emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
    const emailError = emailInvalid ? "Похоже, это не почта" : null;
    const passError =
      touched && password.length > 0 && password.length < 6 ? "Минимум 6 символов" : null;

    function submit(e: React.FormEvent) {
      e.preventDefault();
      setTouched(true);
      setFormError(null);
      if (!trimmed) return;
      if (emailInvalid) return;
      if (password && password.length < 6) return;
      const next: User = {
        name: trimmed,
        email: emailTrim || undefined,
        password: password || undefined,
      };
      store.setUser(next);
      store.addNotification(
        isSignup ? `Добро пожаловать, ${trimmed}!` : `С возвращением, ${trimmed}.`,
      );
      setUser(next);
    }

    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <div
          className="relative border border-border bg-card p-8 md:p-10"
          style={{ boxShadow: "var(--shadow-3)", borderRadius: "var(--radius-soft)" }}
        >
          {/* Accent stripe */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-terra" />

          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-terra">
            <span className="inline-block h-px w-8 bg-terra" />
            {isSignup ? "Знакомство" : "С возвращением"}
          </div>

          <h1 className="text-balance mt-4 font-editorial text-3xl leading-tight md:text-4xl">
            {title}
          </h1>

          {/* Tabs */}
          <div
            role="tablist"
            className="mt-6 inline-flex border border-border bg-paper-soft p-1"
            style={{ borderRadius: "var(--radius-soft)" }}
          >
            <button
              role="tab"
              aria-selected={isSignup}
              onClick={() => setMode("signup")}
              className={`px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                isSignup ? "bg-ink text-primary-foreground" : "text-ink-soft hover:text-ink"
              }`}
              style={{ borderRadius: "calc(var(--radius-soft) - 2px)" }}
            >
              Регистрация
            </button>
            <button
              role="tab"
              aria-selected={!isSignup}
              onClick={() => setMode("signin")}
              className={`px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                !isSignup ? "bg-ink text-primary-foreground" : "text-ink-soft hover:text-ink"
              }`}
              style={{ borderRadius: "calc(var(--radius-soft) - 2px)" }}
            >
              Вход
            </button>
          </div>

          <p className="mt-5 text-sm text-ink-soft">
            {isSignup
              ? "Создайте аккаунт: ник — им мы будем к вам обращаться, почта и пароль — для входа."
              : "Войдите по нику и паролю."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">Ник</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Например: Ася"
                className={`mt-2 w-full min-w-0 border-b bg-transparent py-2 font-editorial text-xl outline-none transition-colors md:text-2xl ${
                  nameError ? "border-terra" : "border-border focus:border-terra"
                }`}
              />
              {nameError && (
                <span className="mt-2 block font-mono text-xs text-terra">{nameError}</span>
              )}
            </label>

            {isSignup && (
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                  Почта
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`mt-2 w-full min-w-0 border-b bg-transparent py-2 font-editorial text-xl outline-none transition-colors md:text-2xl ${
                    emailError ? "border-terra" : "border-border focus:border-terra"
                  }`}
                />
                {emailError && (
                  <span className="mt-2 block font-mono text-xs text-terra">{emailError}</span>
                )}
              </label>
            )}

            <label className="block">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                Пароль
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder={isSignup ? "Минимум 6 символов" : "••••••"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className={`mt-2 w-full min-w-0 border-b bg-transparent py-2 font-editorial text-xl outline-none transition-colors md:text-2xl ${
                  passError ? "border-terra" : "border-border focus:border-terra"
                }`}
              />
              {passError && (
                <span className="mt-2 block font-mono text-xs text-terra">{passError}</span>
              )}
              {isSignup && !passError && (
                <span className="mt-2 block font-mono text-xs text-ink-soft">
                  Можно оставить пустым — задать позже в аккаунте.
                </span>
              )}
            </label>

            {formError && <div className="font-mono text-xs text-terra">{formError}</div>}

            {!isSignup && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setFormError("Восстановление пароля будет доступно позже.")}
                  className="font-mono text-xs uppercase tracking-widest text-ink-soft underline underline-offset-4 hover:text-terra"
                >
                  Забыли пароль?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="ink-glow group inline-flex items-center gap-3 bg-ink px-7 py-3 font-editorial text-base text-primary-foreground shadow-[var(--shadow-2)] transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-warm)]"
              style={{ borderRadius: "var(--radius-soft)" }}
            >
              {isSignup ? "Создать" : "Войти"}
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5"
              >
                →
              </span>
            </button>
          </form>

          <p className="mt-8 border-t border-border pt-4 font-mono text-xs uppercase tracking-widest text-ink-soft">
            Ник · почта · пароль
          </p>
        </div>
      </div>
    );
  }

  return <>{children(user.name)}</>;
}
