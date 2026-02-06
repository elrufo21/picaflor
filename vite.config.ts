import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mkcert(),
  ],

  server: {
    host: true,
    https: true,
    port: 5173,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
