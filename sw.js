const CACHE="study-quest-v2";
const ASSETS=["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./assets/study-buddies-room.png", "./assets/bunny-sheet.png", "./assets/panda-sheet.png", "./assets/bunny-calm.png", "./assets/bunny-happy.png", "./assets/bunny-cheer.png", "./assets/bunny-worried.png", "./assets/panda-calm.png", "./assets/panda-happy.png", "./assets/panda-cheer.png", "./assets/panda-worried.png"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html'))));});
