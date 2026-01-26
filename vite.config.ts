import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon-picaflor.svg",
        "images/picaflorIcono.png",
        "images/favicon-picaflor.png",
      ],
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      manifest: {
        name: "Picaflor",
        short_name: "Picaflor",
        description: "Control diario de caja y conciliación para Picaflor.",
        theme_color: "#0F0F0F",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "images/favicon-picaflor.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "images/favicon-picaflor.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
