const CACHE="study-quest-v10-sheetsync";
const ASSETS=["./", "./index.html", "./styles-v9.css", "./app-v9.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/studyquest-icon-v2-180.png", "./assets/study-buddies-room.png", "./assets/bunny-sheet.png", "./assets/panda-sheet.png", "./assets/bunny-calm.png", "./assets/bunny-happy.png", "./assets/bunny-cheer.png", "./assets/bunny-worried.png", "./assets/panda-calm.png", "./assets/panda-happy.png", "./assets/panda-cheer.png", "./assets/panda-worried.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.origin===self.location.origin&&(u.pathname.endsWith("/index.html")||u.pathname.endsWith("/styles-v9.css")||u.pathname.endsWith("/app-v9.js"))){
    e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
