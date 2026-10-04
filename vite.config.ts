import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base: "./" keeps the production bundle openable from the filesystem (file://)
// as well as from any static host, which is what the local-only target needs.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
  },
});