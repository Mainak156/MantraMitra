import React,{useEffect,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import{motion}from"framer-motion";
import{Bot,CalendarDays,Home,Info,Languages,Pause,Play,Send,Settings,Music2,ExternalLink,ChevronRight,Square}from"lucide-react";
import{DEVOTIONAL}from"./devotional";
import"./styles.css";

const D=[
["Sunday","রবিবার","🌅","Surya · health, vision & success",[["Surya Mantra","ॐ घृणि सूर्याय नमः","Om Ghrini Suryaya Namaha","/audio/108x/surya-mantra.mp3"],["Surya Gayatri Mantra","ॐ भास्कराय विद्महे महातेजाय धीमहि तन्नो सूर्यः प्रचोदयात","Om Bhaskaraya Vidmahe Mahatejaya Dhimahi Tanno Suryah Prachodayat","/audio/108x/surya-gayatri.mp3"]]],
["Monday","সোমবার","🌙","Mahadev · peace & letting go",[["Shiva Mantra","ॐ नमঃ শিবায়","Om Namah Shivaya","/audio/108x/shiva-mantra.mp3"],["Maha Mrityunjaya Mantra","ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात्॥","Om Tryambakam Yajamahe","/audio/108x/maha-mrityunjaya.mp3"]]],
["Tuesday","মঙ্গলবার","🚩","Hanuman & Ganesha · courage & obstacles",[["Hanuman Mantra","ॐ हनुमते नमः","Om Hanumate Namaha","/audio/108x/hanuman-mantra.mp3"],["Ganesha Mantra","ॐ गं गणपतये नमः","Om Gam Ganapataye Namaha","/audio/108x/ganesha.mp3"]]],
["Wednesday","বুধবার","🦚","Krishna & Vishnu · wisdom & devotion",[["Hare Krishna","हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे। हरे राम हरे राम राम राम हरे हरे॥","Hare Krishna","/audio/108x/hare-krishna.mp3"],["Vishnu Mantra","ॐ नमो भगवते वासुदेवाय","Om Namo Bhagavate Vasudevaya","/audio/108x/vishnu-mantra.mp3"]]],
["Thursday","বৃহস্পতিবার","🪔","Vishnu & Guru · learning & growth",[["Vishnu Dhyaan Mantra","ॐ नमो नारायणाय","Om Namo Narayanaya","/audio/108x/vishnu-dhyaan.mp3"],["Guru Mantra","ॐ गुरवे नमः","Om Gurave Namaha","/audio/108x/guru-mantra.mp3"]]],
["Friday","শুক্রবার","🌸","Lakshmi · abundance & grace",[["Lakshmi Mantra","ॐ श्रीं ह्रीं क्लीं त्रिभुवन महालक्ष्म्यै अस्माकम् दारिद्र्य नाशय प्रचुर धन देहि देहि क्लीं ह्रीं श्रीं ॐ","Om Shreem Hreem Kleem","/audio/108x/lakshmi-mantra.mp3"],["Mahalakshmi Mantra","ॐ श्री महालक्ष्म्यै नमः","Om Shri Mahalakshmyai Namaha","/audio/108x/mahalakshmi.mp3"]]],
["Saturday","শনিবার","🪐","Shani · discipline & steadiness",[["Shani Mantra","ॐ शं शनैश्चराय नमः","Om Sham Shanaishcharaya Namaha","/audio/108x/shani.mp3"],["Shani Maha Mantra","ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः","Om Praam Preem Proum Sah","/audio/108x/shani-maha-mantra.mp3"]]]
];

const meaning="A traditional devotional mantra used for focused prayer, remembrance and a peaceful daily practice.";

function loadYouTubeAPI(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(window.__mantraMitraYT)return window.__mantraMitraYT;
  window.__mantraMitraYT=new Promise(resolve=>{
    const previous=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{previous?.();resolve(window.YT)};
    const script=document.createElement("script");
    script.src="https://www.youtube.com/iframe_api";script.async=true;document.head.appendChild(script);
  });
  return window.__mantraMitraYT;
}

const formatTime=s=>{
  if(!Number.isFinite(s)||s<0)return"0:00";
  const min=Math.floor(s/60),sec=Math.floor(s%60);
  return min+":"+String(sec).padStart(2,"0");
};

function App(){
  const[t,setT]=useState(new Date().getDay()),[mi,setMi]=useState(0),[tab,setTab]=useState("home"),
  [play,setPlay]=useState(false),[audioError,setAudioError]=useState(""),[q,setQ]=useState(""),
  [msg,setMsg]=useState([]),[loading,setLoading]=useState(false),[lang,setLang]=useState("বাংলা"),
  [songsOpen,setSongsOpen]=useState(false),[songBlocked,setSongBlocked]=useState(false),
  [songIndex,setSongIndex]=useState(0),[songPlaying,setSongPlaying]=useState(false),
  [songDuration,setSongDuration]=useState(0),[songCurrent,setSongCurrent]=useState(0),
  [mantraCurrent,setMantraCurrent]=useState(0),[mantraDuration,setMantraDuration]=useState(0),
  audio=useRef(null),yt=useRef(null),ytHost=useRef(null),pendingSongs=useRef(false),
  day=D[t],m=day[4][mi],devotional=DEVOTIONAL[day[0]];

  useEffect(()=>{
    if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{});
    loadYouTubeAPI().catch(()=>{});
    return()=>{if(yt.current){yt.current.destroy();yt.current=null}};
  },[]);

  useEffect(()=>{
    setMi(0);setSongIndex(0);setSongBlocked(false);setSongPlaying(false);setSongCurrent(0);setSongDuration(0);
    setTab("home");setSongsOpen(false);pendingSongs.current=false;
    if(yt.current){yt.current.destroy();yt.current=null}
  },[t]);

  useEffect(()=>{
    if(tab==="songs"){
      setSongsOpen(true);
      pendingSongs.current=true;
    }else{
      setSongsOpen(false);
    }
  },[tab]);

  useEffect(()=>{
    audio.current?.pause();
    if(audio.current){audio.current.currentTime=0;audio.current.load()}
    setPlay(false);setAudioError("");setMantraCurrent(0);setMantraDuration(0);
  },[mi,t]);

  useEffect(()=>{
    if(!play)return;
    const id=setInterval(()=>{
      if(audio.current){
        setMantraCurrent(audio.current.currentTime||0);
        setMantraDuration(audio.current.duration||0);
      }
    },250);
    return()=>clearInterval(id);
  },[play]);

  useEffect(()=>{
    if(!songPlaying)return;
    const id=setInterval(()=>{
      if(yt.current){
        setSongCurrent(yt.current.getCurrentTime?.()||0);
        setSongDuration(yt.current.getDuration?.()||0);
      }
    },250);
    return()=>clearInterval(id);
  },[songPlaying]);

  useEffect(()=>{
    if(!songsOpen||!ytHost.current)return;
    let cancelled=false;
    loadYouTubeAPI().then(()=>{
      if(cancelled||yt.current||!ytHost.current)return;
      yt.current=new window.YT.Player(ytHost.current,{
        width:"100%",height:"100%",
        playerVars:{playsinline:1,rel:0,controls:1,origin:window.location.origin},
        events:{
          onReady:e=>{
            if(pendingSongs.current)e.target.loadPlaylist(devotional.items.map(x=>x.id),0,0);
          },
          onStateChange:e=>{
            const s=e.data;
            if(s===window.YT.PlayerState.PLAYING){
              setSongPlaying(true);setSongBlocked(false);
              const index=e.target.getPlaylistIndex?.();
              if(Number.isInteger(index)&&index>=0)setSongIndex(index);
              setTimeout(()=>{setSongDuration(e.target.getDuration?.()||0)},100);
            }else if(s===window.YT.PlayerState.PAUSED||s===window.YT.PlayerState.CUED){
              setSongPlaying(false);
            }else if(s===window.YT.PlayerState.ENDED){
              setSongPlaying(false);setSongCurrent(0);
            }
          },
          onAutoplayBlocked:()=>{setSongBlocked(true);setSongPlaying(false)}
        }
      });
    }).catch(()=>setSongBlocked(true));
    return()=>{cancelled=true};
  },[songsOpen,t]);

  const openSongs=(auto=false)=>{
    setTab("songs");setSongsOpen(true);setSongBlocked(false);pendingSongs.current=auto;
  };

  const onMantraEnded=()=>{
    setPlay(false);setMantraCurrent(0);
    if(mi<day[4].length-1){setMi(mi+1);return}
    openSongs(true);
  };

  const toggle=async()=>{
    if(!audio.current)return;
    if(play){audio.current.pause();setPlay(false);return}
    try{
      setAudioError("");
      if(audio.current.readyState<2)audio.current.load();
      await audio.current.play();setPlay(true);
    }catch{setPlay(false);setAudioError("Audio could not be loaded. Refresh once if this continues.")}
  };

  const stopMantra=()=>{
    if(audio.current){audio.current.pause();audio.current.currentTime=0}
    setPlay(false);setMantraCurrent(0);
  };

  const seekMantra=e=>{
    const value=Number(e.target.value);
    if(audio.current&&Number.isFinite(value)){audio.current.currentTime=value;setMantraCurrent(value)}
  };

  const startSong=()=>{
    setSongBlocked(false);
    if(yt.current){
      yt.current.playVideo();setSongPlaying(true);
    }
  };
  const pauseSong=()=>{
    yt.current?.pauseVideo();setSongPlaying(false);
  };
  const stopSong=()=>{
    yt.current?.stopVideo();setSongPlaying(false);setSongCurrent(0);
  };
  const seekSong=e=>{
    const value=Number(e.target.value);
    if(yt.current&&Number.isFinite(value)){yt.current.seekTo(value,true);setSongCurrent(value)}
  };
  const chooseSong=i=>{
    setSongIndex(i);setSongBlocked(false);yt.current?.playVideoAt(i);setSongPlaying(true);
  };

  const ask=async()=>{
    let x=q.trim();if(!x||loading)return;
    setMsg(v=>[...v,{r:"u",x}]);setQ("");setLoading(true);
    try{
      let r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:x,mantra:{name:m[0],sanskrit:m[1],transliteration:m[2],meaning}}));
      let j=await r.json();if(!r.ok)throw 0;setMsg(v=>[...v,{r:"a",x:j.answer}]);
    }catch{setMsg(v=>[...v,{r:"a",x:meaning}])}finally{setLoading(false)}
  };

  const labels=lang==="বাংলা"
    ?{home:"হোম",week:"সপ্তাহ",ask:"জিজ্ঞাসা",songs:"ভক্তিগান",more:"আরও",play:"শুরু করুন",pause:"বিরতি",stop:"বন্ধ",today:"আজ",mantras:"আজকের মন্ত্র",startSongs:"ভক্তিগান শুরু করুন",online:"অনলাইন",offline:"অফলাইন"}
    :{home:"Home",week:"Week",ask:"Ask",songs:"Songs",more:"More",play:"Play",pause:"Pause",stop:"Stop",today:"TODAY",mantras:"Today's mantras",startSongs:"Start songs",online:"ONLINE",offline:"OFFLINE"};

  const mantraPercent=mantraDuration?Math.min(100,(mantraCurrent/mantraDuration)*100):0;
  const songPercent=songDuration?Math.min(100,(songCurrent/songDuration)*100):0;

  const Controls=({playing,onPlay,onPause,onStop})=><div className="mediaControls">
    <button className="mediaBtn primary" onClick={playing?onPause:onPlay}>{playing?<Pause size={18} fill="currentColor"/>:<Play size={18} fill="currentColor"/>}<span>{playing?labels.pause:labels.play}</span></button>
    <button className="mediaBtn stop" onClick={onStop}><Square size={16} fill="currentColor"/><span>{labels.stop}</span></button>
  </div>;

  return <div className="app">
    <header><div><div className="brand"><img src="/logo.svg" alt="MantraMitra logo"/><b>MantraMitra</b></div><small>নিত্য মন্ত্র • Daily prayer • শান্ত শ্রবণ</small></div><button className="langBtn" onClick={()=>setLang(lang==="বাংলা"?"English":"বাংলা")}><Languages size={19}/><span>{lang}</span></button></header>
    <main>
      {tab==="home"&&<>
        <section className="hero"><div><small>{labels.today} · {day[1]}</small><h1>{day[2]} {day[0]} <em>{day[1]}</em></h1><p>{day[3]}</p></div><span>✓ {labels.offline} 108×</span></section>
        <section className={"player "+(play?"on":"")}>
          <audio ref={audio} src={m[3]} preload="metadata" onLoadedMetadata={e=>setMantraDuration(e.currentTarget.duration||0)} onCanPlay={()=>setAudioError("")} onTimeUpdate={e=>{setMantraCurrent(e.currentTarget.currentTime||0);setMantraDuration(e.currentTarget.duration||0)}} onError={()=>{setPlay(false);setAudioError("Audio file failed to load.")}} onEnded={onMantraEnded}/>
          <div className="orbarea"><div className="orb">ॐ</div>{[1,2,3].map(i=><motion.i key={i} animate={{scale:play?[1,1.2,1]:1,opacity:play?[.2,.45,.08]:.08}} transition={{duration:2,repeat:Infinity}}/>)}</div>
          <div className="pill">{day[2]} {day[1]}</div><h2>{m[0]}</h2><div className="sanskrit">{m[1]}</div><div className="translit">{m[2]}</div>
          <div className="audio-note">🎙️ সম্পূর্ণ 108× Sanskrit recording · Full-length · Offline ready</div>{audioError&&<div className="audio-note">⚠️ {audioError}</div>}
          <Controls playing={play} onPlay={toggle} onPause={toggle} onStop={stopMantra}/>
          <div className="progressWrap"><div className="progressTimes"><span>{formatTime(mantraCurrent)}</span><span>{formatTime(mantraDuration)}</span></div><input aria-label="Mantra progress" type="range" min="0" max={mantraDuration||0} step="0.1" value={Math.min(mantraCurrent,mantraDuration||0)} onChange={seekMantra} style={{"--progress":mantraPercent+"%"}} disabled={!mantraDuration}/></div>
          <div className="progress-count">108× full recording</div><div className="bars">{Array.from({length:20},(_,i)=><motion.span key={i} animate={{height:play?[8,10+(i%7)*5,8]:8}} transition={{repeat:Infinity,duration:.6}}/>)}</div>
          <div className="meaning"><b><Info size={15}/> সহজ অর্থ · Simple meaning</b><p>{meaning}</p><button onClick={()=>setTab("ask")}>💬 এই মন্ত্র সম্পর্কে জিজ্ঞাসা করুন</button></div>
        </section>
        {mi===day[4].length-1&&<section className="songTeaser"><div><Music2 size={20}/><div><b>ভক্তিগানে চলুন</b><small>{devotional.title}</small></div></div><button onClick={()=>openSongs(false)}><Play size={17} fill="currentColor"/></button></section>}
        <h3 className="sect">{labels.mantras}<button onClick={()=>setTab("week")}>সপ্তাহ দেখুন · View week</button></h3>
        {day[4].map((x,i)=><button className={"row "+(i===mi?"sel":"")} key={x[0]} onClick={()=>{setMi(i);setPlay(false)}}><strong>{"0"+(i+1)}</strong><div><b>{x[0]}</b><small>{x[2]}</small></div><Play size={17}/></button>)}
      </>}

      {tab==="week"&&<><div className="section"><small>WEEKLY RHYTHM · সাপ্তাহিক প্রার্থনা</small><h2>Choose a day · দিন বেছে নিন</h2><p>সব রেকর্ডিং সম্পূর্ণ 108× এবং offline playback-এর জন্য প্রস্তুত।</p></div><div className="days">{D.map((x,i)=><button className={i===t?"sel":""} key={x[0]} onClick={()=>{setT(i);setTab("home")}}><span>{x[2]}</span><b>{x[1]}</b><small>{x[0]}</small><em>{x[4].length} mantras · 108×</em></button>)}</div></>}

      {tab==="songs"&&<div className="songPage"><section className="devotional">
        <div className="section songHeader"><div><small>{labels.online} · {labels.songs}</small><h2>{devotional.title}</h2><p>{devotional.subtitle}</p></div><span>🎵 {devotional.items.length} collection{devotional.items.length>1?"s":""}</span></div>
        <div className="ytFrame"><div ref={ytHost}/></div>
        <div className="songMeta"><div><b>{devotional.items[songIndex]?.title}</b><small>{devotional.items[songIndex]?.channel}</small></div><a href={"https://www.youtube.com/watch?v="+(devotional.items[songIndex]?.id||"")} target="_blank" rel="noreferrer"><ExternalLink size={16}/></a></div>
        {songBlocked&&<div className="autoplay"><b>▶ ভক্তিগান স্বয়ংক্রিয়ভাবে শুরু করা যায়নি</b><p>Browser autoplay rules blocked the online player. Tap below once to start.</p><button onClick={startSong}><Play size={16} fill="currentColor"/> {labels.startSongs}</button></div>}
        <Controls playing={songPlaying} onPlay={startSong} onPause={pauseSong} onStop={stopSong}/>
        <div className="progressWrap songProgress"><div className="progressTimes"><span>{formatTime(songCurrent)}</span><span>{formatTime(songDuration)}</span></div><input aria-label="Song progress" type="range" min="0" max={songDuration||0} step="0.1" value={Math.min(songCurrent,songDuration||0)} onChange={seekSong} style={{"--progress":songPercent+"%"}} disabled={!songDuration}/></div>
        <div className="songList">{devotional.items.map((x,i)=><button className={i===songIndex?"active":""} key={x.id} onClick={()=>chooseSong(i)}><strong>0{i+1}</strong><div><b>{x.title}</b><small>{x.channel}</small></div><ChevronRight size={17}/></button>)}</div>
        <small className="onlineNote">🌐 YouTube devotional music needs an internet connection. Your 108× mantra recordings remain offline.</small>
      </section></div>}

      {tab==="ask"&&<><div className="section"><small>ONLINE GUIDE · অনলাইন সহায়ক</small><h2>মন্ত্র সম্পর্কে জিজ্ঞাসা করুন</h2><p>সহজ বাংলায়, Hindi বা English-এ জিজ্ঞাসা করুন। AI guide is online-only.</p></div><div className="suggests">{["এই মন্ত্রের অর্থ কী?","কেন এই মন্ত্র জপ করা হয়?","How should I chant this mantra?"].map(x=><button key={x} onClick={()=>{setQ(x);setTimeout(ask,0)}}>{x}</button>)}</div><div className="chat">{msg.length?msg.map((x,i)=><div key={i} className={"bubble "+x.r}>{x.x}</div>):<div className="empty"><Bot size={36}/><p>Ask about <b>{m[0]}</b>.</p></div>}{loading&&<div className="bubble a">Thinking…</div>}</div><div className="input"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="বাংলা, Hindi or English-এ লিখুন…" disabled={loading}/><button disabled={loading} onClick={ask}><Send size={18}/></button></div></>}

      {tab==="more"&&<><div className="section"><small>MORE · আরও</small><h2>আপনার ঘরের জন্য</h2><p>Large controls, calm visuals and a Bengali-friendly devotional flow.</p></div><div className="info"><strong>🔊 Offline 108× audio</strong><p>আপনার দেওয়া সম্পূর্ণ 108× recordings-ই offline playback-এর জন্য ব্যবহার হয়।</p></div><div className="info"><strong>🎵 Online devotional songs</strong><p>YouTube-এর official embedded player দিয়ে devotional collections চালানো হয়। গান download বা app-এর ভিতরে রাখা হয় না।</p></div><div className="info"><strong>🤖 Online AI</strong><p>DeepSeek V4.1 Flash through a secure Vercel endpoint. The API key stays on the server.</p></div><div className="info"><strong>🌺 Bengali household mode</strong><p>রবিবার থেকে শনিবার পর্যন্ত deity-based flow, বাংলা day labels, এবং Bengali devotional traditions-এর জন্য প্রস্তুত structure.</p></div><div className="info"><strong>📱 Installable</strong><p>Use your browser's Add to Home Screen option.</p></div></>}
    </main>
    <nav><button className={tab==="home"?"on":""} onClick={()=>setTab("home")}><Home size={20}/>{labels.home}</button><button className={tab==="week"?"on":""} onClick={()=>setTab("week")}><CalendarDays size={20}/>{labels.week}</button><button className={tab==="ask"?"on":""} onClick={()=>setTab("ask")}><Bot size={20}/>{labels.ask}</button><button className={tab==="songs"?"on":""} onClick={()=>openSongs(false)}><Music2 size={20}/>{labels.songs}</button><button className={tab==="more"?"on":""} onClick={()=>setTab("more")}><Settings size={20}/>{labels.more}</button></nav>
  </div>
}

createRoot(document.getElementById("root")).render(<App/>);
