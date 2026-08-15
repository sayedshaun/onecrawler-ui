import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Plain-object config (no function form) would read process.env.* before
// Vite has loaded .env into it, so both proxy targets would silently resolve
// to undefined for anyone running `npm run dev` directly on the host (only
// docker-compose's env_file sets real OS env vars early enough to work by
// coincidence). loadEnv() here loads .env explicitly, before we read it —
// and leaves already-set OS/docker env vars taking precedence.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      watch: {
        // Docker Desktop on Windows doesn't reliably forward inotify events
        // across the bind-mounted volume, so chokidar's default watcher can
        // miss host-side file edits entirely. Polling guarantees changes are
        // picked up inside the container.
        usePolling: true,
      },
      proxy: {
        "/api": {
          target: env.API_PROXY_TARGET,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
