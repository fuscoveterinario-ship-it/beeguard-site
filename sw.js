// Bee Guard no celular: funciona como app (ícone na tela inicial) e recebe as notificações de alerta.
const CACHE = "beeguard-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Sempre busca a versão nova; sem internet, mostra a última que abriu.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.search) return;
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
    return res;
  }).catch(async () => (await caches.match(req)) || new Response(
    "<meta charset=utf-8><meta name=viewport content='width=device-width'><p style='font:18px system-ui;padding:24px'>Sem internet. Tente de novo quando tiver sinal.</p>",
    { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data.json(); } catch { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Bee Guard", {
    body: d.body || "",
    icon: "icone.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,
    requireInteraction: !!d.urgent,
    vibrate: d.urgent ? [500, 200, 500, 200, 1000] : [200],
    data: { url: d.url || "painel.html" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "painel.html", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
    for (const j of janelas) if (j.url === url && "focus" in j) return j.focus();
    return self.clients.openWindow(url);
  }));
});
