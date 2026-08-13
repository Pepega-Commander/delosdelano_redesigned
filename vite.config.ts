import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  server: { host: "::", port: 8080 },
  // Use Lightning CSS in dev too, so the dev preview matches the built output.
  css: { transformer: "lightningcss" },
  resolve: {
    // Guard against duplicate React/TanStack copies in the bundle.
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    // server.entry redirects TanStack Start's server entry to src/server.ts (SSR error wrapper).
    tanstackStart({ server: { entry: "server" } }),
    // Nitro packages the server output (build only).
    ...(command === "build" ? [nitro()] : []),
    viteReact(),
  ],
}));
