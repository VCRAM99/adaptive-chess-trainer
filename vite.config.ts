import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const PRODUCTION_BASE = "/chesstrainer/app/";

// Production builds and `vite preview` use the public app path.
// `vite dev` and Vitest keep the app at `/`.
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? PRODUCTION_BASE : "/",
  plugins: [react()],
}));
