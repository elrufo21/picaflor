self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", async () => {
  try {
    await self.registration.unregister();

    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }

    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) {
      client.navigate(client.url);
    }
  } catch (e) {}
});
