const CACHE_NAME = 'zk-chat-pwa-v13-newicon';
const APP_ICON = new URL('./icon-192.png?v=2', self.registration.scope).href;
const APP_BADGE = new URL('./icon-192.png?v=2', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(['./', './index.html', './manifest.json', './icon-192.png?v=2', './icon-512.png?v=2', './apple-touch-icon.png?v=2', './favicon-32.png?v=2']);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
  }
});
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (_) { data = { body: event.data ? event.data.text() : '你有一条新消息' }; }
  const title = data.title || '字卡聊天';
  const options = {
    body: data.body || data.message || '你有一条新消息',
    icon: APP_ICON,
    badge: APP_BADGE,
    image: new URL('./icon-512.png?v=2', self.registration.scope).href,
    tag: data.tag || 'zk-chat-message',
    renotify: !!data.renotify,
    data: { url: data.url || './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data && event.notification.data.url || './', self.registration.scope).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of wins) {
      if ('focus' in client) {
        // 已有页面时只聚焦，不对同一页面执行 navigate；navigate 会刷新网页，
        // 清掉内存中的来电状态，导致用户点通知回到网站后通话界面消失。
        await client.focus();
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
