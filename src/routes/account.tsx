import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Eye, EyeOff, X, User as UserIcon, Mail, Lock, LogOut } from "lucide-react";
import { Shell } from "@/components/Shell";
import { AuthGate } from "@/components/AuthGate";
import { store, type User } from "@/lib/storage";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Аккаунт — DeloSdelano" },
      { name: "description", content: "Ваш ник, почта и пароль." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<"profile" | "email" | "password">("profile");

  // Email
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [emailConfirmPass, setEmailConfirmPass] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // Password
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // Forgot-password modal
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    const u = store.getUser();
    setUser(u);
    setName(u?.name ?? "");
    setAvatar(u?.avatar);
    setEmail(u?.email ?? "");
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const isNew = !user;
    const next: User = { name: n, avatar };
    store.setUser(next);
    setUser(next);
    setSaved(true);
    if (isNew) store.addNotification(`Добро пожаловать, ${n}!`);
    setTimeout(() => setSaved(false), 1500);
  }

  function logout() {
    store.clearUser();
    setUser(null);
    setName("");
    setAvatar(undefined);
    setEmail("");
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
    nav({ to: "/" });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Файл больше 2 МБ. Выберите поменьше.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setAvatar(dataUrl);
    if (user) {
      const next: User = { ...user, avatar: dataUrl };
      store.setUser(next);
      setUser(next);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeAvatar() {
    setAvatar(undefined);
    if (user) {
      const next: User = { name: user.name };
      store.setUser(next);
      setUser(next);
    }
  }

  function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setEmailMsg({ tone: "err", text: "Сначала сохраните ник." });
      return;
    }
    const v = email.trim();
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setEmailMsg({ tone: "err", text: "Похоже, это не почта." });
      return;
    }
    if (v && v !== emailConfirm.trim()) {
      setEmailMsg({ tone: "err", text: "Почта не совпадает — проверьте повтор." });
      return;
    }
    if (user.password) {
      if (!emailConfirmPass) {
        setEmailMsg({ tone: "err", text: "Введите пароль для подтверждения." });
        return;
      }
      if (emailConfirmPass !== user.password) {
        setEmailMsg({ tone: "err", text: "Пароль не совпадает." });
        return;
      }
    }
    const next: User = { ...user, email: v || undefined };
    store.setUser(next);
    setUser(next);
    setEmailConfirmPass("");
    setEmailConfirm("");
    setEmailMsg({ tone: "ok", text: v ? "Почта обновлена." : "Почта удалена." });
    setTimeout(() => setEmailMsg(null), 2000);
  }

  function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setPassMsg({ tone: "err", text: "Сначала сохраните ник." });
      return;
    }
    if (user.password && currentPass !== user.password) {
      setPassMsg({ tone: "err", text: "Текущий пароль не совпадает." });
      return;
    }
    if (newPass.length < 6) {
      setPassMsg({ tone: "err", text: "Минимум 6 символов." });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ tone: "err", text: "Пароли не совпадают." });
      return;
    }
    const next: User = { ...user, password: newPass };
    store.setUser(next);
    setUser(next);
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
    setPassMsg({ tone: "ok", text: "Пароль обновлён." });
    setTimeout(() => setPassMsg(null), 2000);
  }

  const initial = (name || user?.name || "?").trim().charAt(0).toUpperCase();

  if (!user) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-6 py-12">
          <AuthGate title="Войдите или создайте аккаунт">
            {() => <AfterAuth onReady={() => setUser(store.getUser())} />}
          </AuthGate>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Compact hero: avatar + name + quick facts */}
        <div
          className="relative flex items-center gap-6 overflow-hidden border border-border bg-card p-6 md:p-8"
          style={{ borderRadius: "var(--radius-soft)", boxShadow: "var(--shadow-2)" }}
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-terra" />
          <div className="relative">
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden border border-border bg-paper-dark md:h-24 md:w-24"
              style={{ borderRadius: "var(--radius-pill)", boxShadow: "var(--shadow-1)" }}
            >
              {avatar ? (
                <img src={avatar} alt="Аватар" className="h-full w-full object-cover" />
              ) : (
                <span className="font-editorial text-4xl text-ink-soft">{initial}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Загрузить аватар"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center border border-ink bg-paper text-ink transition-transform hover:-translate-y-[1px] hover:bg-terra hover:text-primary-foreground"
              style={{ borderRadius: "var(--radius-pill)" }}
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              className="hidden"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-terra">Аккаунт</div>
            <h1 className="mt-1 truncate font-editorial text-3xl leading-tight md:text-4xl">
              Привет, {user.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={12} /> {user.email ?? "почта не указана"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock size={12} /> {user.password ? "пароль установлен" : "без пароля"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="hidden shrink-0 items-center gap-1.5 border border-border bg-paper px-3 py-2 font-mono text-xs uppercase tracking-widest text-ink-soft hover:border-terra hover:text-terra md:inline-flex"
            style={{ borderRadius: "var(--radius-soft)" }}
          >
            <LogOut size={12} /> Выйти
          </button>
        </div>

        {/* Tabs */}
        <div role="tablist" className="mt-8 flex items-center gap-1 border-b border-border">
          <TabBtn
            active={tab === "profile"}
            onClick={() => setTab("profile")}
            icon={<UserIcon size={14} />}
          >
            Профиль
          </TabBtn>
          <TabBtn
            active={tab === "email"}
            onClick={() => setTab("email")}
            icon={<Mail size={14} />}
          >
            Почта
          </TabBtn>
          <TabBtn
            active={tab === "password"}
            onClick={() => setTab("password")}
            icon={<Lock size={14} />}
          >
            Пароль
          </TabBtn>
        </div>

        {/* Panels — только один открытый за раз */}
        <div className="mt-8">
          {tab === "profile" && (
            <PanelCard accent="terra" className="animate-fade-in space-y-6">
              <FormHeader
                title="Ник и аватар"
                sub={`Ник используется в текстах приложения: «Молодец, ${name || "имя"}, ты справился!».`}
              />
              <form onSubmit={save} className="space-y-6">
                <FieldLabel label="Ник">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full border-b border-border bg-transparent py-2 font-editorial text-2xl outline-none focus:border-terra"
                    placeholder="Например: Ася"
                  />
                </FieldLabel>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <PrimaryBtn>Сохранить</PrimaryBtn>
                  {avatar && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-terra"
                    >
                      <Trash2 size={12} /> Убрать аватар
                    </button>
                  )}
                  {saved && <SavedMark />}
                  <button
                    type="button"
                    onClick={logout}
                    className="ml-auto inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-ink-soft underline underline-offset-4 hover:text-terra md:hidden"
                  >
                    <LogOut size={12} /> Выйти
                  </button>
                </div>
              </form>
            </PanelCard>
          )}

          {tab === "email" && (
            <PanelCard accent="sage" className="animate-fade-in space-y-6">
              <FormHeader
                title="Почта"
                sub="Используется для входа и восстановления доступа. Для смены — введите текущий пароль."
              />
              <form onSubmit={saveEmail} className="space-y-5">
                <FieldLabel label="Почта">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full border-b border-border bg-transparent py-2 font-editorial text-2xl outline-none focus:border-terra"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </FieldLabel>
                <FieldLabel label="Повторите почту">
                  <input
                    type="email"
                    value={emailConfirm}
                    onChange={(e) => setEmailConfirm(e.target.value)}
                    className="mt-2 w-full border-b border-border bg-transparent py-2 font-editorial text-2xl outline-none focus:border-terra"
                    placeholder="ещё раз, чтобы не ошибиться"
                    autoComplete="email"
                  />
                </FieldLabel>
                {user?.password && (
                  <FieldLabel label="Текущий пароль">
                    <input
                      type="password"
                      value={emailConfirmPass}
                      onChange={(e) => setEmailConfirmPass(e.target.value)}
                      className="mt-2 w-full border-b border-border bg-transparent py-2 font-editorial text-2xl outline-none focus:border-terra"
                      autoComplete="current-password"
                      placeholder="Подтвердите паролем"
                    />
                  </FieldLabel>
                )}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <PrimaryBtn>Сохранить изменения</PrimaryBtn>
                  {user?.password && (
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="font-mono text-xs uppercase tracking-widest text-ink-soft underline underline-offset-4 hover:text-terra"
                    >
                      Забыли пароль?
                    </button>
                  )}
                  {emailMsg && <Msg tone={emailMsg.tone}>{emailMsg.text}</Msg>}
                </div>
              </form>
            </PanelCard>
          )}

          {tab === "password" && (
            <PanelCard accent="ink" className="animate-fade-in space-y-6">
              <FormHeader
                title={user?.password ? "Изменить пароль" : "Добавить пароль"}
                sub={
                  user?.password
                    ? "Для смены нужен текущий пароль. Забыли — восстановите по почте."
                    : "Минимум 6 символов. Понадобится для входа в аккаунт."
                }
              />
              <form onSubmit={savePassword} className="space-y-5">
                {user?.password && (
                  <FieldLabel label="Текущий пароль">
                    <input
                      type={showPass ? "text" : "password"}
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      className="mt-2 w-full border-b border-border bg-transparent py-2 font-editorial text-2xl outline-none focus:border-terra"
                      autoComplete="current-password"
                    />
                  </FieldLabel>
                )}
                <FieldLabel label="Новый пароль">
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="mt-2 w-full border-b border-border bg-transparent py-2 font-editorial text-2xl outline-none focus:border-terra"
                    autoComplete="new-password"
                  />
                </FieldLabel>
                <FieldLabel label="Повторите пароль">
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="mt-2 w-full border-b border-border bg-transparent py-2 font-editorial text-2xl outline-none focus:border-terra"
                    autoComplete="new-password"
                  />
                </FieldLabel>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <PrimaryBtn>Сохранить изменения</PrimaryBtn>
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-terra"
                  >
                    {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showPass ? "Скрыть" : "Показать"}
                  </button>
                  {user?.password && (
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="font-mono text-xs uppercase tracking-widest text-ink-soft underline underline-offset-4 hover:text-terra"
                    >
                      Забыли пароль?
                    </button>
                  )}
                  {passMsg && <Msg tone={passMsg.tone}>{passMsg.text}</Msg>}
                </div>
              </form>
            </PanelCard>
          )}
        </div>
      </div>

      {forgotOpen && (
        <ForgotPasswordModal
          defaultEmail={user?.email ?? ""}
          onClose={() => setForgotOpen(false)}
        />
      )}
    </Shell>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "relative -mb-px inline-flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors",
        active ? "text-terra" : "text-ink-soft hover:text-ink",
      ].join(" ")}
    >
      {icon}
      {children}
      <span
        aria-hidden
        className={[
          "absolute inset-x-2 bottom-0 h-[2px] transition-colors",
          active ? "bg-terra" : "bg-transparent",
        ].join(" ")}
      />
    </button>
  );
}

function FormHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <header>
      <h2 className="font-editorial text-2xl leading-tight md:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-ink-soft">{sub}</p>
    </header>
  );
}

function PanelCard({
  accent,
  className,
  children,
}: {
  accent: "terra" | "sage" | "ink";
  className?: string;
  children: React.ReactNode;
}) {
  const color =
    accent === "terra"
      ? "var(--color-terra)"
      : accent === "sage"
        ? "var(--color-sage)"
        : "var(--color-ink)";
  return (
    <section
      className={[
        "relative border border-dashed border-border bg-card p-6 md:p-8",
        className ?? "",
      ].join(" ")}
      style={{ borderRadius: "var(--radius-soft)", boxShadow: "var(--shadow-1)" }}
    >
      {/* corner brackets — follow the card's rounded border */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[-1px] top-[-1px] m-0 h-4 w-4 border-l-2 border-t-2"
        style={{ borderColor: color, borderTopLeftRadius: "var(--radius-soft)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-[-1px] top-[-1px] m-0 h-4 w-4 border-r-2 border-t-2"
        style={{ borderColor: color, borderTopRightRadius: "var(--radius-soft)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[-1px] left-[-1px] m-0 h-4 w-4 border-b-2 border-l-2"
        style={{ borderColor: color, borderBottomLeftRadius: "var(--radius-soft)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[-1px] right-[-1px] m-0 h-4 w-4 border-b-2 border-r-2"
        style={{ borderColor: color, borderBottomRightRadius: "var(--radius-soft)" }}
      />
      {/* accent tape */}
      <span
        aria-hidden
        className="absolute -top-3 left-6 rotate-[-2deg] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-paper"
        style={{ background: color }}
      >
        · · ·
      </span>
      {children}
    </section>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function PrimaryBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="ink-glow group inline-flex items-center gap-2 bg-ink px-6 py-2.5 font-editorial text-base text-primary-foreground shadow-[var(--shadow-2)] transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-warm)]"
      style={{ borderRadius: "var(--radius-soft)" }}
    >
      {children}
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </button>
  );
}

function SavedMark() {
  return (
    <span className="font-hand text-2xl text-sage" style={{ fontFamily: "var(--font-hand)" }}>
      — сохранено
    </span>
  );
}

function Msg({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  return (
    <span
      className="font-hand text-2xl"
      style={{
        fontFamily: "var(--font-hand)",
        color: tone === "ok" ? "var(--color-sage)" : "var(--color-terra)",
      }}
    >
      — {children}
    </span>
  );
}

function AfterAuth({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ForgotPasswordModal({
  defaultEmail,
  onClose,
}: {
  defaultEmail: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setErr("Введите почту, на которую отправить ссылку.");
      return;
    }
    setErr(null);
    setSent(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md border border-border bg-paper p-8"
        style={{ borderRadius: "var(--radius-soft)", boxShadow: "var(--shadow-3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-terra" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-ink-soft hover:text-terra"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-terra">
          <span className="inline-block h-px w-8 bg-terra" />
          Восстановление
        </div>
        <h3 className="mt-3 font-editorial text-3xl leading-tight">
          {sent ? "Проверьте почту" : "Забыли пароль?"}
        </h3>

        {sent ? (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              Мы отправили ссылку на восстановление на <span className="text-ink">{email}</span>.
              Перейдите по ней, чтобы задать новый пароль.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="ink-glow mt-6 inline-flex items-center gap-2 bg-ink px-5 py-2 font-editorial text-base text-primary-foreground transition-transform hover:-translate-y-[1px]"
              style={{ borderRadius: "var(--radius-soft)", boxShadow: "var(--shadow-2)" }}
            >
              Понятно
            </button>
          </>
        ) : (
          <form onSubmit={send} className="mt-5 space-y-4">
            <p className="text-sm text-ink-soft">
              Введите почту от аккаунта — пришлём ссылку для сброса пароля.
            </p>
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                Почта
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                placeholder="you@example.com"
                className="mt-2 w-full border-b border-ink/25 bg-transparent py-2 font-editorial text-2xl outline-none focus:border-terra"
              />
              {err && <span className="mt-2 block font-mono text-xs text-terra">{err}</span>}
            </label>
            <div className="flex items-baseline gap-4 pt-2">
              <button
                type="submit"
                className="ink-glow inline-flex items-center gap-2 bg-ink px-5 py-2 font-editorial text-base text-primary-foreground transition-transform hover:-translate-y-[1px]"
                style={{ borderRadius: "var(--radius-soft)", boxShadow: "var(--shadow-2)" }}
              >
                Отправить ссылку
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-xs uppercase tracking-widest text-ink-soft underline underline-offset-4 hover:text-terra"
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
