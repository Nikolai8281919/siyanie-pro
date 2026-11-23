// Service worker: кэш для офлайна.
// Страница берётся из сети, а при отсутствии интернета из кэша.
// Запросы к базе данных (Supabase) и любым другим сайтам сюда НЕ попадают:
// данные заявок не кэшируются и всегда свежие.
var CACHE = "siyanie-v1";
var CORE = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "three.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var isThree = url.hostname === "cdnjs.cloudflare.com";
  if (!sameOrigin && !isThree) return; // Supabase и прочее идут напрямую в сеть
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match("index.html");
      });
    })
  );
});
