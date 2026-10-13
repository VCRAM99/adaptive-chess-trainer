import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { injectRouteMeta, type PublicRoute } from "./src/lib/siteMeta.ts";

const ROUTES: PublicRoute[] = ["discover", "app"];

function routeHtmlPlugin(): Plugin {
  const rewriteRouteHtml = (req: { url?: string }, _res: unknown, next: () => void) => {
    const pathname = req.url?.split("?")[0];

    if (pathname === "/discover" || pathname === "/app") {
      const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
      req.url = `${pathname}.html${query}`;
    }

    next();
  };

  return {
    name: "route-html",
    closeBundle() {
      const indexPath = resolve("dist/index.html");
      const html = readFileSync(indexPath, "utf8");

      for (const route of ROUTES) {
        writeFileSync(resolve("dist", `${route}.html`), injectRouteMeta(html, route));
      }

      writeFileSync(indexPath, injectRouteMeta(html, "app"));
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteRouteHtml);
    },
  };
}

// The app is served from the domain root. `/app` and `/discover` are client routes.
export default defineConfig({
  plugins: [react(), routeHtmlPlugin()],
});
