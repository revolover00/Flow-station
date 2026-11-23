import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handle } from "./server/api.js";
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const attach = (srv) => {
    srv.middlewares.use((req, res, next) => {
      if ((req.url || "").startsWith("/api/")) return handle(req, res, env);
      next();
    });
  };
  return {
    plugins: [
      react(),
      {
        name: "station-api",
        configureServer: attach,
        configurePreviewServer: attach,
      },
    ],
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        deny: [".env", ".env.*", "**/.git/**", "**/server/**", "**/api/**"],
      },
    },
    preview: { host: "0.0.0.0", allowedHosts: true },
    build: {
      rollupOptions: {
        input: { station: "index.html", calcios: "calcios/index.html" },
      },
    },
  };
});
