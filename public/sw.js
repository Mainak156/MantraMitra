const CACHE="mantra-mitra-v7";
const LEGACY=["mantra-mitra-v6"];
const CORE=["/","/index.html","/manifest.webmanifest","/logo.svg"];

const findCached=async request=>{
  const names=[CACHE,...LEGACY];
  for(const name of names){
    const c=await caches.open(name);
    const hit=await c.match(request,{ignoreVary:true});
    if(hit)return hit;
  }
  return null;
};

const cacheOne=async url=>{
  const cache=await caches.open(CACHE);
  const existing=await cache.match(url,{ignoreVary:true});
  if(existing)return true;
  try{
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok)throw new Error("HTTP "+response.status);
    await cache.put(url,response.clone());
    return true;
  }catch{return false}
};

self.addEventListener("install",e=>e.waitUntil(
  caches.open(CACHE)
    .then(c=>c.addAll(CORE))
    .then(()=>self.skipWaiting())
));

self.addEventListener("activate",e=>e.waitUntil(
  caches.open(CACHE).then(async cache=>{
    for(const name of LEGACY){
      const old=await caches.open(name);
      const keys=await old.keys();
      for(const request of keys){
        if(request.url.includes("/audio/108x/")&&!await cache.match(request,{ignoreVary:true})){
          const response=await old.match(request,{ignoreVary:true});
          if(response)try{await cache.put(request,response.clone())}catch{}
        }
      }
    }
  }).then(()=>self.clients.claim())
));

self.addEventListener("message",e=>{
  const data=e.data||{};
  if(data.type!=="CACHE_URLS"||!Array.isArray(data.urls))return;
  e.waitUntil((async()=>{
    let saved=0;
    for(const url of data.urls){
      if(await cacheOne(url))saved++;
      const clients=await self.clients.matchAll({type:"window",includeUncontrolled:true});
      clients.forEach(c=>c.postMessage({type:"OFFLINE_PROGRESS",saved,total:data.urls.length,url}));
    }
  })());
});

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const url=new URL(e.request.url);

  if(url.pathname.startsWith("/audio/108x/")){
    const range=e.request.headers.get("range");

    if(range){
      e.respondWith((async()=>{
        const cached=await findCached(new Request(e.request.url,{method:"GET"}));
        if(!cached)return fetch(e.request);

        const buffer=await cached.arrayBuffer();
        const total=buffer.byteLength;
        const match=/bytes=(\\d*)-(\\d*)/i.exec(range);
        if(!match)return new Response(buffer,{status:200,headers:{
          "Content-Type":cached.headers.get("content-type")||"audio/mpeg",
          "Content-Length":String(total),
          "Accept-Ranges":"bytes"
        }});

        let start=match[1]?Number(match[1]):0;
        let end=match[2]?Number(match[2]):total-1;
        if(!match[1]&&match[2]){
          const suffix=Number(match[2]);
          start=Math.max(0,total-suffix);end=total-1;
        }
        start=Math.max(0,Math.min(start,total-1));
        end=Math.max(start,Math.min(end,total-1));

        return new Response(buffer.slice(start,end+1),{status:206,headers:{
          "Content-Type":cached.headers.get("content-type")||"audio/mpeg",
          "Content-Length":String(end-start+1),
          "Content-Range":`bytes ${start}-${end}/${total}`,
          "Accept-Ranges":"bytes",
          "Cache-Control":"public, max-age=31536000, immutable"
        }});
      })());
      return;
    }

    e.respondWith((async()=>{
      const cached=await findCached(e.request);
      if(cached)return cached;
      try{
        const response=await fetch(e.request);
        if(response.ok){
          const cache=await caches.open(CACHE);
          try{await cache.put(e.request,response.clone())}catch{}
        }
        return response;
      }catch{
        return new Response("Offline audio is not cached on this device.",{status:503});
      }
    })());
    return;
  }

  e.respondWith(
    caches.match(e.request,{ignoreVary:true})
      .then(x=>x||fetch(e.request).then(r=>{
        if(r.ok&&url.origin===location.origin){
          const y=r.clone();caches.open(CACHE).then(c=>c.put(e.request,y)).catch(()=>{});
        }
        return r;
      }))
      .catch(()=>caches.match("/index.html"))
  );
});