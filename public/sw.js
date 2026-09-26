const CACHE="mantra-mitra-v6";
const AUDIO=["surya-mantra","surya-gayatri","shiva-mantra","maha-mrityunjaya","hanuman-mantra","ganesha","hare-krishna","vishnu-mantra","vishnu-dhyaan","guru-mantra","lakshmi-mantra","mahalakshmi","shani","shani-maha-mantra"].map(x=>"/audio/108x/"+x+".mp3");
const CORE=["/","/index.html","/manifest.webmanifest","/logo.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(async c=>{
  await c.addAll(CORE);
  await Promise.all(AUDIO.map(async u=>{try{const r=await fetch(u,{cache:"no-store"});if(r.ok)await c.put(u,r)}catch{}}));
  await self.skipWaiting();
})));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const url=new URL(e.request.url);
  if(url.pathname.startsWith("/audio/108x/")){
    e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request).then(r=>{
      if(r.ok){const y=r.clone();caches.open(CACHE).then(c=>c.put(e.request,y))}
      return r;
    })));
    return;
  }
  e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request).then(r=>{
    const y=r.clone();caches.open(CACHE).then(c=>c.put(e.request,y));return r
  }).catch(()=>caches.match("/index.html"))))
});