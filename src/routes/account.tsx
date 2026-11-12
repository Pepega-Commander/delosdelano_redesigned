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
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="text-[10px] uppercase tracking-[0.2em] text-purple/75">Аккаунт</div>
        {/* Compact hero: avatar + name + quick facts */}
        <div className="relative mt-4 flex flex-col gap-5 overflow-hidden rounded-2xl bg-deep p-6 text-on-dark shadow-[var(--shadow-2)] sm:flex-row sm:items-center md:gap-6 md:p-8">
          <div className="relative w-fit">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-mint md:h-24 md:w-24">
              {avatar ? (
                <img src={avatar} alt="Аватар" className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-light text-deep/70">{initial}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Загрузить аватар"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-purple text-on-dark shadow-[var(--shadow-1)] transition-transform hover:-translate-y-[1px]"
            >
              <Camera size={14} />
            </button>
            <div className="mt-2 flex items-center justify-center gap-1 text-[9px] uppercase tracking-[0.12em] text-on-dark/55">
              <Camera size={10} /> Загрузить
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              className="hidden"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[30px] leading-tight font-light md:text-[38px]">
              Привет, {user.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-on-dark/65">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={12} /> {user.email ?? "почта не указана"}
              </span>
              <span className="text-on-dark/25">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Lock size={12} /> {user.password ? "пароль установлен" : "без пароля"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-on-dark/30 px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-on-dark/85 transition-colors hover:bg-on-dark hover:text-deep sm:self-center"
          >
            <LogOut size={12} /> Выйти <span aria-hidden>↗</span>
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          {/* Tabs */}
          <div role="tablist" className="flex flex-wrap items-start gap-1 lg:flex-col">
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
          <div>
            {tab === "profile" && (
              <PanelCard className="animate-fade-in space-y-6">
                <FormHeader
                  title="Ник и аватар"
                  sub={`Ник используется в текстах приложения: «Молодец, ${name || "имя"}, ты справился!».`}
                />
              <form onSubmit={save} className="space-y-6">
                <FieldLabel label="Ник">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="account-input mt-2 w-full px-4 py-3 text-[16px]"
                    placeholder="Например: Ася"
                  />
                </FieldLabel>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <PrimaryBtn>Сохранить</PrimaryBtn>
                  {avatar && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-purple"
                    >
                      <Trash2 size={12} /> Убрать аватар
                    </button>
                  )}
                  {saved && <SavedMark />}
                  <button
                    type="button"
                    onClick={logout}
                    className="ml-auto inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-soft underline underline-offset-4 transition-colors hover:text-purple md:hidden"
                  >
                    <LogOut size={12} /> Выйти
                  </button>
                </div>
              </form>
            </PanelCard>
          )}

          {tab === "email" && (
            <PanelCard className="animate-fade-in space-y-6">
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
                    className="account-input mt-2 w-full px-4 py-3 text-[16px]"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </FieldLabel>
                <FieldLabel label="Повторите почту">
                  <input
                    type="email"
                    value={emailConfirm}
                    onChange={(e) => setEmailConfirm(e.target.value)}
                    className="account-input mt-2 w-full px-4 py-3 text-[16px]"
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
                      className="account-input mt-2 w-full px-4 py-3 text-[16px]"
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
                      className="text-[10px] uppercase tracking-[0.14em] text-ink-soft underline underline-offset-4 transition-colors hover:text-purple"
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
            <PanelCard className="animate-fade-in space-y-6">
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
                      className="account-input mt-2 w-full px-4 py-3 text-[16px]"
                      autoComplete="current-password"
                    />
                  </FieldLabel>
                )}
                <FieldLabel label="Новый пароль">
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="account-input mt-2 w-full px-4 py-3 text-[16px]"
                    autoComplete="new-password"
                  />
                </FieldLabel>
                <FieldLabel label="Повторите пароль">
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="account-input mt-2 w-full px-4 py-3 text-[16px]"
                    autoComplete="new-password"
                  />
                </FieldLabel>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <PrimaryBtn>Сохранить изменения</PrimaryBtn>
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-purple"
                  >
                    {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showPass ? "Скрыть" : "Показать"}
                  </button>
                  {user?.password && (
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-[10px] uppercase tracking-[0.14em] text-ink-soft underline underline-offset-4 transition-colors hover:text-purple"
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
        "relative inline-flex w-auto items-center gap-2.5 rounded-lg px-4 py-2.5 text-left text-[11px] transition-colors lg:w-full lg:gap-3 lg:px-4 lg:py-3 lg:text-[12px]",
        active ? "bg-mint text-ink" : "text-ink-soft hover:bg-cream hover:text-ink",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function FormHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <header>
      <h2 className="text-[26px] leading-tight font-light md:text-[30px]">{title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{sub}</p>
    </header>
  );
}

function PanelCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={[
        "relative rounded-xl border border-ink/10 bg-cream p-6 shadow-[var(--shadow-1)] md:p-8",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function PrimaryBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="btn-primary group">
      {children}
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </button>
  );
}

function SavedMark() {
  return <span className="text-[11px] uppercase tracking-[0.14em] text-ink-soft">— сохранено</span>;
}

function Msg({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  return (
    <span
      className="text-[11px] uppercase tracking-[0.14em]"
      style={{ color: tone === "ok" ? "var(--purple)" : "#a15c6a" }}
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
        className="relative w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-8 shadow-[var(--shadow-4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-mint hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-purple/75">
          <span className="inline-block h-px w-8 bg-purple/50" />
          Восстановление
        </div>
        <h3 className="mt-3 text-[28px] leading-tight font-light">
          {sent ? "Проверьте почту" : "Забыли пароль?"}
        </h3>

        {sent ? (
          <>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
              Мы отправили ссылку на восстановление на <span className="text-ink">{email}</span>.
              Перейдите по ней, чтобы задать новый пароль.
            </p>
            <button type="button" onClick={onClose} className="btn-primary mt-6">
              Понятно
            </button>
          </>
        ) : (
          <form onSubmit={send} className="mt-5 space-y-4">
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Введите почту от аккаунта — пришлём ссылку для сброса пароля.
            </p>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">Почта</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                placeholder="you@example.com"
                className="account-input mt-2 w-full px-4 py-3 text-[16px]"
              />
              {err && <span className="mt-2 block text-xs text-[#a15c6a]">{err}</span>}
            </label>
            <div className="flex items-baseline gap-4 pt-2">
              <button type="submit" className="btn-primary">
                Отправить ссылку
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] uppercase tracking-[0.14em] text-ink-soft underline underline-offset-4 transition-colors hover:text-purple"
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
