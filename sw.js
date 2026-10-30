/* فلوسي — Service Worker: يخزن ملف التطبيق عشان يشتغل بدون نت.
   ما يتعامل مع أي بيانات شخصية؛ بياناتك في IndexedDB على جهازك فقط. */
var CACHE = 'flousi-v1';
var SHELL = ['./', './index.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// يعرض النسخة المحفوظة فوراً، ويحدّثها بالخلفية إذا فيه نت
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  var isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
  var key = isPage ? './index.html' : req;
  var network = fetch(req).then(function (res) {
    if (res && res.ok && res.type === 'basic' && !res.redirected) {
      var copy = res.clone();
      return caches.open(CACHE).then(function (c) { return c.put(key, copy); }).then(function () { return res; });
    }
    return res;
  });
  e.waitUntil(network.then(function () {}, function () {}));
  e.respondWith(caches.match(key, { ignoreSearch: true }).then(function (cached) {
    return cached || network.catch(function () { return caches.match('./index.html'); });
  }));
});
