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
      <div className="mx-auto max-w-lg px-6 py-16 md:py-20">
        <div className="relative rounded-2xl border border-ink/10 bg-cream p-8 shadow-[var(--shadow-3)] md:p-10">
          <div className="eyebrow flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-purple/60" />
            {isSignup ? "Знакомство" : "С возвращением"}
          </div>

          <h1 className="text-balance mt-4 text-[34px] leading-[1.1] font-light md:text-[40px]">
            {title}
          </h1>

          {/* Tabs */}
          <div
            role="tablist"
            className="mt-6 inline-flex rounded-full border border-ink/12 bg-paper-soft p-1"
          >
            <button
              role="tab"
              aria-selected={isSignup}
              onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                isSignup ? "bg-purple text-on-dark" : "text-ink-soft hover:text-ink"
              }`}
            >
              Регистрация
            </button>
            <button
              role="tab"
              aria-selected={!isSignup}
              onClick={() => setMode("signin")}
              className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                !isSignup ? "bg-purple text-on-dark" : "text-ink-soft hover:text-ink"
              }`}
            >
              Вход
            </button>
          </div>

          <p className="mt-5 text-[13.5px] leading-[1.75] text-ink-soft">
            {isSignup
              ? "Создайте аккаунт: ник — им мы будем к вам обращаться, почта и пароль — для входа."
              : "Войдите по нику и паролю."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">Ник</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Например: Ася"
                className={`auth-input mt-2 w-full min-w-0 py-2 text-xl transition-colors md:text-2xl ${
                  nameError ? "!border-b-[#a15c6a]" : ""
                }`}
              />
              {nameError && <span className="mt-2 block text-xs text-[#a15c6a]">{nameError}</span>}
            </label>

            {isSignup && (
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">Почта</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`auth-input mt-2 w-full min-w-0 py-2 text-xl transition-colors md:text-2xl ${
                    emailError ? "!border-b-[#a15c6a]" : ""
                  }`}
                />
                {emailError && (
                  <span className="mt-2 block text-xs text-[#a15c6a]">{emailError}</span>
                )}
              </label>
            )}

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder={isSignup ? "Минимум 6 символов" : "••••••"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className={`auth-input mt-2 w-full min-w-0 py-2 text-xl transition-colors md:text-2xl ${
                  passError ? "!border-b-[#a15c6a]" : ""
                }`}
              />
              {passError && (
                <span className="mt-2 block text-xs text-[#a15c6a]">{passError}</span>
              )}
              {isSignup && !passError && (
                <span className="mt-2 block text-[11px] text-ink-soft">
                  Можно оставить пустым — задать позже в аккаунте.
                </span>
              )}
            </label>

            {formError && <div className="text-xs text-[#a15c6a]">{formError}</div>}

            {!isSignup && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setFormError("Восстановление пароля будет доступно позже.")}
                  className="text-[10px] uppercase tracking-[0.16em] text-ink-soft underline underline-offset-4 hover:text-purple"
                >
                  Забыли пароль?
                </button>
              </div>
            )}

            <button type="submit" className="btn-primary group w-full justify-between">
              {isSignup ? "Создать" : "Войти"}
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5"
              >
                →
              </span>
            </button>
          </form>

          <p className="mt-8 border-t border-ink/10 pt-4 text-[9px] uppercase tracking-[0.18em] text-ink-soft">
            Ник · почта · пароль
          </p>
        </div>
      </div>
    );
  }

  return <>{children(user.name)}</>;
}
