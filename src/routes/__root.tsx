import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-10 text-center shadow-[var(--shadow-2)]">
        <div className="eyebrow text-purple/75">Страница не найдена</div>
        <h1 className="mt-4 text-[72px] leading-none font-light tracking-[-0.04em] text-purple">
          404
        </h1>
        <h2 className="mt-4 text-[22px] font-light text-foreground">Page not found</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mt-7">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-10 text-center shadow-[var(--shadow-2)]">
        <div className="eyebrow text-purple/75">Ошибка</div>
        <h1 className="mt-4 text-[26px] font-light tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-primary"
          >
            Try again
          </button>
          <a href="/" className="btn-outline">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DeloSdelano — разберитесь с прокрастинацией" },
      {
        name: "description",
        content:
          "Инструмент самопознания и работы с прокрастинацией: диагностика, план, дневник и таймер.",
      },
      { property: "og:title", content: "DeloSdelano" },
      {
        property: "og:description",
        content: "Прокрастинация — не лень. Это страх. Разберитесь с ним.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Comfortaa:wght@300..700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
