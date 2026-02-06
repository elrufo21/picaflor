import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import App from "./App.tsx";
import { Toaster } from "sonner";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        await registration.unregister();
      }

      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        await caches.delete(key);
      }

      // Forzar recarga limpia solo una vez
      if (!sessionStorage.getItem("sw-cleaned")) {
        sessionStorage.setItem("sw-cleaned", "true");
        window.location.reload();
      }
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
