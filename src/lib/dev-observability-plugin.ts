/**
 * Dev-only Vite plugin that emits structured JSON logs for lifecycle events
 * that commonly precede a 502 in the preview:
 *   - server_start        : dev server boot
 *   - server_restart      : full restart (config/plugin change)
 *   - config_change       : file that triggered a restart
 *   - route_tree_regen    : src/routeTree.gen.ts rewritten (TanStack Router)
 *   - route_file_change   : add/change/unlink under src/routes/**
 *   - ws_error            : HMR websocket error
 *   - close               : server closing
 *
 * Logs go to stdout (picked up by the sandbox daemon log) AND to
 * /tmp/dev-server-logs/vite-events.log for grep-friendly forensics.
 */
import type { Plugin, ViteDevServer } from "vite";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

type EventName =
  | "server_start"
  | "server_restart"
  | "config_change"
  | "route_tree_regen"
  | "route_file_change"
  | "ws_error"
  | "close";

const LOG_FILE = "/tmp/dev-server-logs/vite-events.log";

function emit(event: EventName, payload: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    scope: "vite",
    event,
    ...payload,
  });
  // Tagged stdout line — easy to grep in daemon_logs.
  // eslint-disable-next-line no-console
  console.log(`[vite-observability] ${line}`);
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true });
    appendFileSync(LOG_FILE, line + "\n");
  } catch {
    // best-effort; never crash dev server over logging
  }
}

export function devObservabilityPlugin(): Plugin {
  let startedAt = 0;
  return {
    name: "lovable:dev-observability",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      startedAt = Date.now();
      emit("server_start", {
        mode: server.config.mode,
        root: server.config.root,
      });

      server.watcher.on("change", (file) => {
        if (file.endsWith("routeTree.gen.ts")) {
          emit("route_tree_regen", { file });
        } else if (file.includes("/src/routes/")) {
          emit("route_file_change", { file, kind: "change" });
        }
      });
      server.watcher.on("add", (file) => {
        if (file.includes("/src/routes/")) {
          emit("route_file_change", { file, kind: "add" });
        }
      });
      server.watcher.on("unlink", (file) => {
        if (file.includes("/src/routes/")) {
          emit("route_file_change", { file, kind: "unlink" });
        }
      });

      server.ws.on("error", (err: Error) => {
        emit("ws_error", { message: err.message });
      });

      const originalRestart = server.restart.bind(server);
      server.restart = async (forceOptimize?: boolean) => {
        emit("server_restart", {
          forceOptimize: Boolean(forceOptimize),
          uptimeMs: Date.now() - startedAt,
        });
        return originalRestart(forceOptimize);
      };

      server.httpServer?.once("close", () => emit("close", {}));
    },
    handleHotUpdate(ctx) {
      // Vite calls this for every changed module; only record config-adjacent
      // files that typically cause a full restart.
      const f = ctx.file;
      if (
        f.endsWith("vite.config.ts") ||
        f.endsWith("vite.config.js") ||
        f.endsWith("tsconfig.json") ||
        f.endsWith(".env") ||
        f.endsWith(".env.local")
      ) {
        emit("config_change", { file: f });
      }
      return undefined;
    },
  };
}
