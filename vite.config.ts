import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The app is served from the domain root. `/app` and `/discover` are client routes.
export default defineConfig({
  plugins: [react()],
});
