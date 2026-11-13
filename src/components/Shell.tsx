import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Menu, X } from "lucide-react";
import { store, type User } from "@/lib/storage";
import { SoundToggle } from "@/components/SoundToggle";

const NAV_ITEMS = [
  { to: "/", label: "Главная" },
  { to: "/deals", label: "Мои дела" },
  { to: "/focus", label: "Фокус" },
  { to: "/plans", label: "Каталог планов" },
  { to: "/contacts", label: "Контакты" },
  { to: "/about", label: "О нас" },
] as const;

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
        className={`font-comfortaa sticky top-0 z-40 bg-lav text-ink transition-shadow duration-300 ease-[var(--ease-out-soft)] ${scrolled ? "shadow-[var(--shadow-2)]" : ""}`}
      >
        <div className="mx-auto flex h-[58px] max-w-[1360px] items-center gap-4 px-5 md:px-8">
          <Link
            to="/"
            className="shrink-0 text-[21px] leading-none tracking-[-0.01em] transition-opacity hover:opacity-75"
          >
            DeloSdelano
          </Link>

          <nav className="ml-4 hidden flex-1 items-center justify-center gap-4 text-[10px] leading-none font-medium tracking-[0.14em] uppercase lg:flex xl:gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="whitespace-nowrap rounded-full px-3 py-2 text-deep transition-colors hover:bg-deep/10 hover:text-deep"
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="relative ml-auto flex items-center gap-4">
            <button
              aria-label="Уведомления"
              onClick={() => {
                setNotifOpen((v) => !v);
                if (!notifOpen) store.markNotificationsRead();
              }}
              className="flex items-center gap-2.5 transition-opacity hover:opacity-75"
            >
              <Bell size={18} strokeWidth={1.6} />
              {unread > 0 && (
                <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-mint px-1 text-[11px] leading-none text-ink">
                  {unread}
                </span>
              )}
            </button>

            <button
              aria-label="Меню"
              onClick={() => setMenuOpen(true)}
              className="transition-opacity hover:opacity-75"
            >
              <Menu size={22} strokeWidth={1.6} />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-[42px] w-[320px] rounded-xl border border-ink/15 bg-cream p-5 text-ink shadow-[var(--shadow-3)]">
                <div className="eyebrow">Уведомления</div>
                {notifs.length === 0 ? (
                  <p className="mt-3 text-[13px] text-ink-soft">Пока пусто.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {notifs.slice(0, 6).map((n) => (
                      <li key={n.id} className="border-b border-ink/10 pb-2.5 text-[13px]">
                        {n.text}
                        <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-ink/65">
                          {new Date(n.at).toLocaleString("ru-RU")}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-deep/45 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
        >
          <aside
            className="absolute right-0 top-0 flex h-full w-[360px] max-w-[92vw] flex-col rounded-l-2xl bg-cream p-7 text-ink shadow-[var(--shadow-4)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="eyebrow">Меню</div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Закрыть"
                className="text-ink/70 transition-opacity hover:opacity-50"
              >
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>

            <div className="mt-7 border-b border-ink/12 pb-6">
              {user ? (
                <div className="flex items-center gap-3.5">
                  <Avatar user={user} size={46} />
                  <div>
                    <div className="text-[19px] leading-tight">Привет, {user.name}</div>
                    <button
                      onClick={logout}
                      className="mt-1 text-[11px] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-purple"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                    Вы не вошли
                  </div>
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="btn-primary mt-4 w-full justify-between"
                  >
                    Войти
                    <span aria-hidden>↗</span>
                  </Link>
                </div>
              )}
            </div>

            <nav className="mt-7 flex flex-col gap-[18px] text-[20px] leading-none">
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
                  className="inline-block text-[12px] uppercase tracking-[0.16em] text-purple underline decoration-purple/30 underline-offset-4"
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
                <span>Обсуждения</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-purple">W.I.P.</span>
              </div>
              <MenuLink to="/about" onClick={() => setMenuOpen(false)}>
                О нас
              </MenuLink>
            </nav>

            <div className="mt-auto pt-8 text-[13px] leading-relaxed text-ink-soft">
              Один шаг сегодня — больше, чем сто в планах.
            </div>
          </aside>
        </div>
      )}

      <main>{children}</main>

      {showFooter && (
        <footer id="footer" className="font-comfortaa mt-24 bg-deep text-on-dark">
          <div className="mx-auto grid max-w-[1360px] gap-10 px-6 py-16 md:grid-cols-3 md:px-8">
            <div>
              <div className="text-[25px] leading-none">DeloSdelano</div>
              <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-on-dark/85">
                Тёплый инструмент самопознания. Без уведомлений и без давления.
              </p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-mint/80">О нас</div>
              <p className="mt-4 max-w-[340px] text-[13px] leading-relaxed text-on-dark/85">
                Небольшая команда практикующих психологов и дизайнеров. Мы верим, что прокрастинация
                — не порок, а сигнал.
              </p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-mint/80">Контакты</div>
              <ul className="mt-4 space-y-2 text-[15px] leading-relaxed">
                <li>hello@delosdelano.ru</li>
                <li>tg: @delosdelano</li>
                <li className="text-[12px] text-on-dark/80">Москва · Санкт-Петербург</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-on-dark/20 px-6 py-5 text-center text-[10px] uppercase tracking-[0.16em] text-on-dark/75">
            © 2026 · Это не диагноз. Это инструмент самопознания.
          </div>
        </footer>
      )}
      <SoundToggle />
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
      className="w-fit transition-colors hover:text-purple"
      activeProps={{ className: "text-purple" }}
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
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/15 bg-mint text-ink"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
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
