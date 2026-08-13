import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Menu, X } from "lucide-react";
import { store, type User } from "@/lib/storage";
import { SoundToggle } from "@/components/SoundToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Shell({
  children,
  showFooter = false,
}: {
  children: ReactNode;
  showFooter?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [quizType, setQuizType] = useState<string | null>(null);
  const [notifs, setNotifs] = useState<{ id: string; text: string; at: number; read: boolean }[]>(
    [],
  );
  const [scrolled, setScrolled] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    setUser(store.getUser());
    setQuizType(store.getQuiz()?.type ?? null);
    setNotifs(store.getNotifications());
  }, [menuOpen, notifOpen]);

  useEffect(() => {
    let ticking = false;
    let current = window.scrollY > 24;
    setScrolled(current);
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // hysteresis: enter at 24px, exit at 4px — prevents flicker at threshold
        const next = current ? y > 4 : y > 24;
        if (next !== current) {
          current = next;
          setScrolled(next);
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  function logout() {
    store.clearUser();
    setUser(null);
    setMenuOpen(false);
    nav({ to: "/" });
  }

  return (
    <div className="min-h-screen">
      <header
        className={`sticky top-0 z-40 border-b border-ink/15 bg-paper transition-shadow duration-300 ease-[var(--ease-out-soft)] ${scrolled ? "shadow-[var(--shadow-2)]" : ""}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold tracking-tight">DeloSdelano</span>
            <span
              className="hidden font-hand text-lg text-terra md:inline"
              style={{ fontFamily: "var(--font-hand)" }}
            >
              — дневник
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                aria-label="Уведомления"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (!notifOpen) store.markNotificationsRead();
                }}
                className="relative border border-border bg-card p-2 hover:border-terra"
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-terra px-1 font-mono text-xs text-primary-foreground">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 border border-border bg-card p-4 shadow-lg">
                  <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                    Уведомления
                  </div>
                  {notifs.length === 0 ? (
                    <p className="mt-3 text-sm text-ink-soft">Пока пусто.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {notifs.slice(0, 6).map((n) => (
                        <li key={n.id} className="border-b border-border pb-2 text-sm">
                          {n.text}
                          <div className="mt-1 font-mono text-xs text-ink-soft">
                            {new Date(n.at).toLocaleString("ru-RU")}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button
              aria-label="Меню"
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-2 border border-border bg-card p-1.5 pr-2 transition-colors hover:border-terra"
            >
              <Avatar user={user} size={24} />
              <Menu size={16} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm"
          style={{ background: "color-mix(in oklab, #000 55%, transparent)" }}
          onClick={() => setMenuOpen(false)}
        >
          <aside
            className="absolute right-0 top-0 flex h-full w-80 flex-col border-l border-border bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-xs uppercase tracking-widest text-terra">Меню</div>
              <button onClick={() => setMenuOpen(false)} aria-label="Закрыть">
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 border-b border-border pb-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <Avatar user={user} size={44} />
                  <div>
                    <div className="font-editorial text-xl leading-tight">Привет, {user.name}</div>
                    <button
                      onClick={logout}
                      className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-soft underline underline-offset-4 hover:text-terra"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
                    Вы не вошли
                  </div>
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="ink-glow group mt-3 inline-flex w-full items-center justify-between gap-2 bg-ink px-4 py-2.5 font-editorial text-base text-primary-foreground shadow-[var(--shadow-2)] transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-warm)]"
                    style={{ borderRadius: "var(--radius-soft)" }}
                  >
                    Войти
                    <span
                      aria-hidden
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </div>
              )}
            </div>

            <nav className="mt-6 flex flex-col gap-4 text-lg">
              {user && (
                <MenuLink to="/account" onClick={() => setMenuOpen(false)}>
                  Аккаунт
                </MenuLink>
              )}
              <MenuLink to="/deals" onClick={() => setMenuOpen(false)}>
                Мои дела
              </MenuLink>
              <MenuLink to="/focus" onClick={() => setMenuOpen(false)}>
                Фокус
              </MenuLink>
              {!quizType && (
                <Link
                  to="/quiz"
                  onClick={() => setMenuOpen(false)}
                  className="-mt-2 inline-block font-mono text-xs text-terra underline underline-offset-4"
                >
                  Пройти опрос →
                </Link>
              )}
              <MenuLink to="/plans" onClick={() => setMenuOpen(false)}>
                Планы
              </MenuLink>
              <MenuLink to="/contacts" onClick={() => setMenuOpen(false)}>
                Контакты
              </MenuLink>
              <div className="flex items-baseline gap-2 text-ink-soft">
                <span className="font-serif text-xl">Обсуждения</span>
                <span className="font-mono text-xs uppercase text-mustard">W.I.P.</span>
              </div>
              <MenuLink to="/about" onClick={() => setMenuOpen(false)}>
                О нас
              </MenuLink>
            </nav>

            <div
              className="mt-auto pt-6 font-hand text-xl text-terra"
              style={{ fontFamily: "var(--font-hand)" }}
            >
              Один шаг сегодня — больше, чем сто в планах.
            </div>
          </aside>
        </div>
      )}

      <main>{children}</main>

      {showFooter && (
        <footer id="footer" className="mt-24 bg-ink text-paper">
          <div className="h-2 w-full bg-highlight" />
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
            <div>
              <div className="font-display text-3xl font-black uppercase tracking-tight">
                DeloSdelano
              </div>
              <p className="mt-4 text-sm opacity-80">
                Тёплый инструмент самопознания. Без уведомлений и без давления.
              </p>
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-highlight">
                О нас
              </div>
              <p className="mt-4 text-sm opacity-80">
                Небольшая команда практикующих психологов и дизайнеров. Мы верим, что прокрастинация
                — не порок, а сигнал.
              </p>
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-highlight">
                Контакты
              </div>
              <ul className="mt-4 space-y-2 font-display text-lg font-bold uppercase tracking-tight">
                <li>hello@delosdelano.ru</li>
                <li>tg: @delosdelano</li>
                <li className="text-sm font-normal normal-case opacity-80">
                  Москва · Санкт-Петербург
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-paper/20 px-6 py-4 text-center font-mono text-xs opacity-60">
            © 2026 · Это не диагноз. Это инструмент самопознания.
          </div>
        </footer>
      )}
      <SoundToggle />
      <ThemeToggle />
    </div>
  );
}

function MenuLink({
  to,
  onClick,
  children,
}: {
  to: "/account" | "/deals" | "/focus" | "/plans" | "/about" | "/contacts";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="font-serif text-xl hover:text-terra"
      activeProps={{ className: "font-serif text-xl text-terra" }}
    >
      {children}
    </Link>
  );
}

function Avatar({ user, size }: { user: User | null; size: number }) {
  const initial = (user?.name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-paper-dark font-editorial text-ink-soft"
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-pill)",
        fontSize: Math.round(size * 0.42),
      }}
    >
      {user?.avatar ? (
        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
