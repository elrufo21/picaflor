import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mkcert(),

    VitePWA({
      registerType: "autoUpdate",

      workbox: {
        navigateFallback: "/index.html",

        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,

        runtimeCaching: [
          // 🔥 HTML → siempre fresco
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              expiration: {
                maxEntries: 1,
              },
            },
          },

          // 🔁 JS / CSS
          {
            urlPattern: ({ request }) =>
              request.destination === "script" ||
              request.destination === "style",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "assets-cache",
            },
          },

          // 🚫 API → NUNCA cachear
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api"),
            handler: "NetworkOnly",
          },
        ],
      },

      manifest: {
        name: "Picaflor",
        short_name: "Picaflor",
        start_url: "/",
        display: "standalone",
        theme_color: "#0F0F0F",
        background_color: "#ffffff",
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
