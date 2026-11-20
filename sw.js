const CACHE_NAME = 'zk-chat-pwa-v24-lt';
const APP_ICON = new URL('./icon-192.png?v=2', self.registration.scope).href;
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
// 服务端推送（以后接真正的 Web Push 时用）：标题=昵称，正文=「from ID」+ 消息内容，无大图
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (_) { data = { body: event.data ? event.data.text() : '你有一条新消息' }; }
  const title = data.nickname || data.name || data.title || '字卡聊天';
  const info = String(data.info || data.message || data.body || '你有一条新消息');
  const from = data.from || data.uid || '';
  const body = from && !info.startsWith('from ') ? `from ${from}\n${info}` : info;
  event.waitUntil(self.registration.showNotification(title, {
    body, icon: APP_ICON, badge: APP_ICON, tag: data.tag || undefined, data: { url: data.url || './' }
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data && event.notification.data.url || './', self.registration.scope).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of wins) {
      // 只聚焦不 navigate，避免刷新页面丢掉内存里的来电状态
      if ('focus' in client) { await client.focus(); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
