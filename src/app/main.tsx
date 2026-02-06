import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import App from "./App.tsx";
import { Toaster } from "sonner";

const CLEANUP_VERSION_KEY = "sw-cleaned-version";
const APP_VERSION =
  import.meta.env.VITE_APP_VERSION ??
  import.meta.env.npm_package_version ??
  "0";

async function unregisterClients() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
  }
}

async function clearCaches() {
  const cacheKeys = await caches.keys();
  for (const key of cacheKeys) {
    await caches.delete(key);
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const cleanedVersion = sessionStorage.getItem(CLEANUP_VERSION_KEY);
      if (cleanedVersion === APP_VERSION) {
        return;
      }

      await unregisterClients();
      await clearCaches();

      sessionStorage.setItem(CLEANUP_VERSION_KEY, APP_VERSION);
      window.location.reload();
    } catch (err) {
      console.warn("SW cleanup failed", err);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" richColors />
  </StrictMode>,
);
