(function(){var n=["Vintage","Classic","Cosmos","Oxo","Hi5","Rooftop","Elite","C9","GreenDen","InnerPeace","O2","GreenTop","VelHeaven","AVM’sPride","Flames","Titans","Phoenix","Bodhi"],u=document.getElementById("ug"),i,l;for(i=0;i<n.length;i++){l=document.createElement("li");l.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9H3z"/><path d="M10 20v-6h4v6"/></svg>';l.appendChild(document.createTextNode(n[i]));u.appendChild(l)}})();

;
(function(){var sc=document.querySelector(".scene-sec");if("IntersectionObserver"in window){new IntersectionObserver(function(e,o){if(e[0].isIntersecting){sc.classList.add("go");o.disconnect()}},{threshold:.4}).observe(sc)}else{sc.classList.add("go")}
var ns="http://www.w3.org/2000/svg",w=document.getElementById("wins"),s=document.getElementById("stars"),i,r,c,e;
for(i=0;i<26;i++){e=document.createElementNS(ns,"circle");e.setAttribute("cx",Math.round(Math.random()*540+10));e.setAttribute("cy",Math.round(Math.random()*150+8));e.setAttribute("r",(Math.random()*1.3+.4).toFixed(1));e.setAttribute("class","star");e.style.animationDelay=(Math.random()*3).toFixed(1)+"s";s.appendChild(e)}
var n=0;
for(r=3;r>=0;r--)for(c=0;c<5;c++){if(r===3&&c===2)continue;
e=document.createElementNS(ns,"rect");e.setAttribute("x",168+c*48);e.setAttribute("y",108+r*44);e.setAttribute("width",28);e.setAttribute("height",28);e.setAttribute("rx",3);e.setAttribute("class","win");
e.style.animationDelay=(0.6+n*0.13+Math.random()*.3).toFixed(2)+"s";n++;w.appendChild(e)}
})();

;
(function(){
var d=document,nav=d.getElementById("nav"),btn=d.getElementById("menu"),prog=d.getElementById("prog"),nl=d.getElementById("navlogo"),lg=d.querySelector(".logo"),io="IntersectionObserver" in window;
if(nl&&lg)nl.src=lg.src;
function shut(){nav.classList.remove("open");btn.setAttribute("aria-expanded","false")}
btn.addEventListener("click",function(){var o=nav.classList.toggle("open");btn.setAttribute("aria-expanded",o?"true":"false")});
Array.prototype.forEach.call(d.querySelectorAll(".links a"),function(a){a.addEventListener("click",shut)});
d.addEventListener("keydown",function(e){if(e.key==="Escape")shut()});
function sc(){var h=d.documentElement,m=h.scrollHeight-h.clientHeight,y=window.pageYOffset||h.scrollTop;prog.style.width=(m>0?y/m*100:0)+"%"}
window.addEventListener("scroll",sc,{passive:true});sc();
var rv=d.querySelectorAll(".stats,.home,.kitchen,.units,.loc,.faq,main>h2");
Array.prototype.forEach.call(rv,function(e){e.classList.add("rv")});
if(io){var o1=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");o1.unobserve(x.target)}})},{threshold:.12});Array.prototype.forEach.call(rv,function(e){o1.observe(e)})}else{Array.prototype.forEach.call(rv,function(e){e.classList.add("in")})}
var links={};Array.prototype.forEach.call(d.querySelectorAll(".links a"),function(a){links[a.getAttribute("href").slice(1)]=a});
if(io){var o2=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){for(var k in links)links[k].classList.remove("act");if(links[x.target.id])links[x.target.id].classList.add("act")}})},{rootMargin:"-40% 0px -55% 0px"});["top","why","stays","kitchen","homes","help","find"].forEach(function(id){var t=d.getElementById(id);if(t)o2.observe(t)})}
var q=d.getElementById("uq"),lis=d.querySelectorAll("#ug li"),em=d.getElementById("uempty");
Array.prototype.forEach.call(lis,function(l,i){l.style.setProperty("--i",i)});
q.addEventListener("input",function(){var v=q.value.trim().toLowerCase(),c=0;Array.prototype.forEach.call(lis,function(l){var m=l.textContent.toLowerCase().indexOf(v)>-1;l.hidden=!m;if(m)c++});em.hidden=c>0});
})();

;
(function(){
var P=["<path d='M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'/><path d='M9 12l2 2 4-4'/>","<path d='M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z'/><path d='M2 11h20M9 3.5c0 1.5 1.5 1.5 1.5 3M14 3.5c0 1.5 1.5 1.5 1.5 3'/>","<path d='M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z'/>","<path d='M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0'/><circle cx='12' cy='19' r='1'/>","<path d='M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3'/>","<path d='M14 7a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3z'/>","<path d='M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5'/><circle cx='7' cy='11' r='1.5'/>"];
var C=[["CCTV","Locked gate","Visitor log","Warden on call"],["Your own menu","Your own time","Shared kitchen","Cleaning rota"],["Tank and sump","Pump timer","Inverter backup","Quarterly cleaning"],["Fibre line","Wi-Fi on each floor","Backup link"],["Daily checklist","Weekly deep clean","Monthly pest control","Sealed bins"],["One WhatsApp number","48-hour fix","Written rules","Clear terms"],["Google Maps listing","Real photos","Resident reviews","Referral offer"]];
var ds=document.querySelectorAll(".faq details");
Array.prototype.forEach.call(ds,function(d,i){var s=d.querySelector("summary"),t=s.textContent;s.innerHTML='<span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true">'+P[i]+'</svg></span><span class="st"></span>';s.lastChild.textContent=t;var u=document.createElement("ul");u.className="pts";C[i].forEach(function(x){var l=document.createElement("li");l.textContent=x;u.appendChild(l)});d.appendChild(u)});
})();

;
(function(){
var d=document,rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce) and (min-width: 99999px)").matches,fine=window.matchMedia&&matchMedia("(hover:hover) and (pointer:fine)").matches,io="IntersectionObserver" in window;
function each(l,f){Array.prototype.forEach.call(l,f)}
var sp=d.getElementById("sparks");
if(sp&&!rm){for(var i=0;i<16;i++){var s=d.createElement("i");s.style.setProperty("--x",(Math.random()*100).toFixed(1)+"%");s.style.setProperty("--s",(Math.random()*3+2).toFixed(1)+"px");s.style.setProperty("--t",(Math.random()*8+9).toFixed(1)+"s");s.style.setProperty("--d",(Math.random()*-12).toFixed(1)+"s");sp.appendChild(s)}}
var nums=d.querySelectorAll(".stats .n");
function cnt(el){var to=+el.getAttribute("data-to"),t0=null;function f(t){if(!t0)t0=t;var p=Math.min((t-t0)/1400,1);el.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)}
var st=d.querySelector(".stats");
if(io&&!rm&&st){each(nums,function(n){n.textContent="0"});var o=new IntersectionObserver(function(es){if(es[0].isIntersecting){each(nums,cnt);o.disconnect()}},{threshold:.4});o.observe(st)}
var rows=d.querySelectorAll(".cmp .h,.cmp .s");each(rows,function(e,k){e.style.setProperty("--r",Math.floor(k/2))});
if(fine){
each(d.querySelectorAll(".ug li,.flow li,.faq details,.cmp .s,.stats li,.loc"),function(e){e.classList.add("glow");e.addEventListener("pointermove",function(ev){var r=e.getBoundingClientRect();e.style.setProperty("--mx",(ev.clientX-r.left)+"px");e.style.setProperty("--my",(ev.clientY-r.top)+"px")})});
var hero=d.querySelector(".hero"),lw=d.querySelector(".logo-wrap");
if(hero&&lw&&!rm){hero.addEventListener("pointermove",function(ev){var r=hero.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;lw.style.transform="perspective(900px) rotateY("+(x*10).toFixed(2)+"deg) rotateX("+(-y*10).toFixed(2)+"deg)"});hero.addEventListener("pointerleave",function(){lw.style.transform=""})}
}
var nav=d.getElementById("nav"),last=0;
window.addEventListener("scroll",function(){var y=window.pageYOffset||0;if(window.innerWidth<=820&&!nav.classList.contains("open")){if(y>last+6&&y>160)nav.classList.add("hide");else if(y<last-6||y<160)nav.classList.remove("hide")}else nav.classList.remove("hide");last=y},{passive:true});
var u=d.getElementById("ug"),sh=d.getElementById("sheet"),wa=d.getElementById("sh-wa"),tt=d.getElementById("sh-t");
each(u.querySelectorAll("li"),function(l){l.setAttribute("tabindex","0");l.setAttribute("role","button")});
function openSheet(n){tt.textContent=n;wa.href="https://wa.me/919884444587?text="+encodeURIComponent("Hi, I am interested in the "+n+" home at Stay Confident PG Homes. Please share the details.");if(sh.showModal)sh.showModal();else sh.setAttribute("open","")}
u.addEventListener("click",function(e){var l=e.target.closest("li");if(l)(window.__openUnit?window.__openUnit(l):openSheet(l.textContent.trim()))});
u.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){var l=e.target.closest("li");if(l){e.preventDefault();(window.__openUnit?window.__openUnit(l):openSheet(l.textContent.trim()))}}});
function closeSheet(){if(sh.close)sh.close();else sh.removeAttribute("open")}
d.getElementById("sh-x").addEventListener("click",closeSheet);
sh.addEventListener("click",function(e){if(e.target===sh)closeSheet()});
})();

;
(function(){
var d=document,AC=window.AudioContext||window.webkitAudioContext,ac,mg,nb,started=false,stopped=false,muted=false,t0=0,off=0;
var A=[440,494,554.37,659.25,740,880,987.77,1108.7,1318.5,1480,1760,1975.5,2217.5];
function $(i){return d.getElementById(i)}
function when(T){return ac.currentTime+Math.max(0,T-off)}
function tone(f,T,dur,vol,atk,type){if(T<off-.03)return;var t=when(T),o=ac.createOscillator(),g=ac.createGain();o.type=type||"sine";o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(atk||.02));g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(mg);o.start(t);o.stop(t+dur+.1)}
function noise(T,dur,f0,f1,vol,fast,type){if(T+dur<off)return;var t=when(T),s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;f.type=type||"bandpass";f.Q.value=.9;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);if(fast){g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur)}else{g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+dur*.8);g.gain.exponentialRampToValueAtTime(.0001,t+dur)}s.connect(f);f.connect(g);g.connect(mg);s.start(t);s.stop(t+dur+.1)}
function dist(k){var n=1024,c=new Float32Array(n),i,x;for(i=0;i<n;i++){x=i*2/n-1;c[i]=(1+k)*x/(1+k*Math.abs(x))}return c}
function drone(){if(off>8)return;var s=when(0),a=when(1.2),b=when(4),e=when(8.6),fl=ac.createBiquadFilter(),g=ac.createGain();fl.type="lowpass";fl.frequency.setValueAtTime(160,s);fl.frequency.exponentialRampToValueAtTime(1300,b+.01);g.gain.setValueAtTime(.0001,s);g.gain.exponentialRampToValueAtTime(.16,a+.01);g.gain.exponentialRampToValueAtTime(.3,b+.01);g.gain.exponentialRampToValueAtTime(.0001,e);[[55,"sawtooth"],[55.4,"sawtooth"],[82.4,"triangle"],[110,"sine"]].forEach(function(p){var o=ac.createOscillator();o.type=p[1];o.frequency.value=p[0];o.connect(fl);o.start(s);o.stop(e+.1)});fl.connect(g);g.connect(mg)}
function timp(T,v){if(T<off-.03)return;var t=when(T),o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(58,t+.4);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+1.2);o.connect(g);g.connect(mg);o.start(t);o.stop(t+1.3)}
function boom(T){if(T<off-.05)return;var t=when(T),o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(32,t+1.4);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.95,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+2.4);o.connect(g);g.connect(mg);o.start(t);o.stop(t+2.5);noise(T,1.2,2500,120,.5,true,"lowpass")}
function braam(T){if(T+3<off)return;var t=when(Math.max(T,off)),f=ac.createBiquadFilter(),g=ac.createGain();f.type="lowpass";f.Q.value=2;f.frequency.setValueAtTime(1500,t);f.frequency.exponentialRampToValueAtTime(220,t+2.6);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.1,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+3);[55,82.4,110,138.6,165,220].forEach(function(fr){[-9,9].forEach(function(dt){var o=ac.createOscillator();o.type="sawtooth";o.frequency.value=fr;o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+3.1)})});f.connect(g);g.connect(mg)}
function sched(){
drone();
timp(.55,.5);timp(.85,.55);timp(1.05,.7);
noise(.5,.75,2000,8000,.12,false,"highpass");
timp(1.2,.9);
noise(3,1.1,500,6500,.34);
braam(4);boom(4);
[220,277.18,329.63,440,554.37,659.25].forEach(function(f){tone(f,4,3.4,.07,.12,"triangle")});
tone(1760,4.4,1.6,.05,.3);tone(2217.5,4.55,1.5,.04,.3);tone(2637,4.7,1.5,.035,.3);
for(var i=0;i<13;i++)tone(A[i],4.6+i*.07,.9,.06,.01);
tone(2637,5.1,1.4,.035,.5);tone(3520,5.25,1.3,.025,.5);
noise(6.6,1.4,3200,260,.18);
[220,330,440,554.37].forEach(function(f){tone(f,6.7,2.4,.045,.5,"triangle")});
}
function start(){
if(started||stopped||!AC||!t0)return;if(navigator.userActivation&&!navigator.userActivation.hasBeenActive)return;
var it=$("intro");if(!it||!d.documentElement.classList.contains("intro-on")||it.classList.contains("quick"))return;
if(!ac){try{ac=new AC()}catch(e){return}mg=ac.createGain();mg.gain.value=muted?0:.85;var cp=ac.createDynamicsCompressor();cp.threshold.value=-16;cp.knee.value=10;cp.ratio.value=8;cp.attack.value=.003;cp.release.value=.25;var lm=ac.createDynamicsCompressor();lm.threshold.value=-3;lm.knee.value=0;lm.ratio.value=20;lm.attack.value=.001;lm.release.value=.1;mg.connect(cp);cp.connect(lm);lm.connect(ac.destination);var cv=ac.createConvolver(),rl=ac.sampleRate*2.8,rb=ac.createBuffer(2,rl,ac.sampleRate),rg=ac.createGain();for(var ch=0;ch<2;ch++){var ra=rb.getChannelData(ch);for(var q=0;q<rl;q++)ra[q]=(Math.random()*2-1)*Math.pow(1-q/rl,2.6)}cv.buffer=rb;rg.gain.value=.22;mg.connect(rg);rg.connect(cv);cv.connect(cp);nb=ac.createBuffer(1,ac.sampleRate*3,ac.sampleRate);var a=nb.getChannelData(0);for(var i=0;i<a.length;i++)a[i]=Math.random()*2-1}
var p=ac.resume?ac.resume():null;
Promise.resolve(p).then(function(){if(ac.state!=="running"||started||stopped)return;started=true;off=(performance.now()-t0)/1000;sched();it.classList.add("snd-on")},function(){});
}
function stop(){if(stopped)return;stopped=true;if(ac&&mg){try{mg.gain.setTargetAtTime(0,ac.currentTime,.06)}catch(e){}setTimeout(function(){try{ac.close()}catch(e){}},600)}}
var clk=false;/* v29: sound only after a real click/tap */d.addEventListener("introgo",function(){t0=performance.now();if(clk)start();setTimeout(stop,10000)});
["click","keydown"].forEach(function(ev){d.addEventListener(ev,function(e){if(ev==="keydown"){if(e.key==="Escape")stop();return}clk=true;start()},{passive:true})});
var sk=$("skip");if(sk)sk.addEventListener("click",stop);
var sb=$("snd");if(sb)sb.addEventListener("click",function(){if(!started){start();return}muted=!muted;if(mg)mg.gain.setTargetAtTime(muted?0:.85,ac.currentTime,.05);sb.textContent=muted?"Sound: off":"Sound: on"});
})();

;
(function(){
var d=document,r=d.documentElement,it=d.getElementById("intro");
if(!it)return;
if(!r.classList.contains("intro-on")){it.parentNode.removeChild(it);return}
var ti=d.getElementById("ti"),img=d.getElementById("intro-logo"),src=d.querySelector(".logo"),n=0,done=false;
"STAY CONFIDENT".split(" ").forEach(function(w){var wd=d.createElement("span");wd.className="wd";w.split("").forEach(function(c){var s=d.createElement("span");s.className="ch";s.textContent=c;s.style.setProperty("--c",(4.6+n*.07).toFixed(2)+"s");n++;wd.appendChild(s)});ti.appendChild(wd)});
if(src)img.src=src.src;
function end(quick){if(done)return;done=true;r.classList.remove("intro-hold");if(quick)it.classList.add("quick");setTimeout(function(){r.classList.remove("intro-on");window.scrollTo(0,0);if(it.parentNode)it.parentNode.removeChild(it);},quick?520:150)}
function fly(){if(done)return;var nav=d.querySelector(".brand"),bl=d.querySelector(".bl"),lw=d.getElementById("lwrap"),tt=d.getElementById("ti");if(!nav||!bl||!lw||!tt||!lw.animate||!nav.children[1])return;var a=lw.getBoundingClientRect(),b=bl.getBoundingClientRect(),bt=nav.children[1].getBoundingClientRect(),c=tt.getBoundingClientRect();if(!b.width||!bt.width||!c.width)return;var o={duration:1100,easing:"cubic-bezier(.65,0,.2,1)",fill:"forwards"};lw.animate([{transform:"none"},{transform:"translate("+(b.left+b.width/2-a.left-a.width/2)+"px,"+(b.top+b.height/2-a.top-a.height/2)+"px) scale("+(b.width*1.3/a.width)+")"}],o);tt.animate([{transform:"none"},{transform:"translate("+(bt.left+bt.width/2-c.left-c.width/2)+"px,"+(bt.top+bt.height/2-c.top-c.height/2)+"px) scale("+Math.min(bt.width/c.width,1)+")"}],o)}
function go(){it.classList.add("go");d.dispatchEvent(new Event("introgo"));setTimeout(fly,6800);setTimeout(function(){if(!done){r.classList.remove("intro-hold")}},7000);setTimeout(function(){end(false)},8500)}
var ready=Promise.all([img.decode?img.decode():0,d.fonts&&d.fonts.load?d.fonts.load("800 40px Cinzel"):0]).catch(function(){});Promise.race([ready,new Promise(function(r){setTimeout(r,1800)})]).then(go);
d.getElementById("skip").addEventListener("click",function(){end(true)});
d.addEventListener("keydown",function(e){if(e.key==="Escape"&&!done)end(true)});
})();

;
(function(){
var d=document,r=d.documentElement,orb=d.getElementById("orb"),hint=d.getElementById("orbhint"),hd=d.getElementById("scene-h"),sc=d.getElementById("scene"),meta=d.querySelector('meta[name="theme-color"]'),rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce) and (min-width: 99999px)").matches;
if(!orb)return;
function apply(l){r.setAttribute("data-theme",l?"light":"dark");orb.setAttribute("aria-pressed",l?"true":"false");orb.setAttribute("aria-label",l?"Switch to dark mode":"Switch to light mode");hint.textContent=l?"Tap the sun to go back to night":"Tap the moon for light mode";hd.textContent=l?"A bright day at home":"Your home lights up";sc.setAttribute("aria-label",l?"Animated daytime view of a PG building in Chennai":"Animated night view of a PG building in Chennai with windows lighting up one by one");if(meta)meta.setAttribute("content",l?"#fdf8ee":"#021810");try{localStorage.setItem("sc-theme",l?"light":"dark")}catch(e){}}
function ding(l){try{var AC=window.AudioContext||window.webkitAudioContext,c=window.__scdc||(window.__scdc=new AC()),n=l?[784,1175,1568]:[1175,784,587];if(c.state==="suspended"&&c.resume)c.resume();n.forEach(function(f,i){var o=c.createOscillator(),g=c.createGain(),t=c.currentTime+i*.11;o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.1,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.6);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.7)});}catch(e){}}
function toggle(){var l=r.getAttribute("data-theme")!=="light",b=orb.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;ding(l);
if(d.startViewTransition&&!rm){var vt=d.startViewTransition(function(){apply(l)});vt.ready.then(function(){var R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));r.animate({clipPath:["circle(0px at "+x+"px "+y+"px)","circle("+R+"px at "+x+"px "+y+"px)"]},{duration:1000,easing:"cubic-bezier(.4,0,.2,1)",pseudoElement:"::view-transition-new(root)"})},function(){})}
else{r.classList.add("tx");apply(l);setTimeout(function(){r.classList.remove("tx")},800)}}
apply(r.getAttribute("data-theme")==="light");
orb.addEventListener("click",toggle);
orb.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle()}});
})();

;
(function(){
var d=document,om=d.getElementById("openmap"),ls=d.getElementById("locsheet"),st=d.getElementById("ls-s"),lo=d.getElementById("ls-open"),t1,t2,t3;
if(!om||!ls)return;
function clr(){clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)}
function openLoc(e,url){
if(!ls.showModal||ls.open)return;
e.preventDefault();clr();
st.textContent="Finding your way\u2026";lo.classList.remove("pulse");
ls.showModal();
t1=setTimeout(function(){st.textContent="Pinning Stay Confident PG Homes\u2026"},1600);
t2=setTimeout(function(){st.textContent="Opening Google Maps\u2026"},2500);
t3=setTimeout(function(){var w=null;try{w=window.open(url,"_blank")}catch(x){}
if(w){try{w.opener=null}catch(x){}st.textContent="Opened in a new tab. Tap below to open it again."}
else{st.textContent="Opening Google Maps\u2026";window.location.href=url}},3100)}
d.addEventListener("click",function(e){
if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
var a=e.target.closest&&e.target.closest("a[href]");
if(!a||ls.contains(a))return;
if(!/^https?:\/\/(www\.)?google\.[a-z.]+\/maps|^https?:\/\/maps\.google\.|^https?:\/\/maps\.app\.goo\.gl/i.test(a.href))return;
openLoc(e,a.href)});
function shut(){clr();if(ls.close)ls.close()}
d.getElementById("ls-x").addEventListener("click",shut);
ls.addEventListener("click",function(e){if(e.target===ls)shut()});
ls.addEventListener("close",clr);
})();

;
(function(){
var d=document,rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce) and (min-width: 99999px)").matches;
var T={
Vintage:["#3b2a1a","#8a6a3c","\u{1F570}\uFE0F","Timeless charm",["circle","sparkle"],"float",["#f0dca8","#c9a45c","#fff3cf"],10],
Classic:["#1c2a3a","#4a6380","\u{1F3DB}\uFE0F","Style that never fades",["diamond","sparkle"],"float",["#dfe7f0","#c9a45c","#ffffff"],9],
Cosmos:["#090920","#34207a","\u{1FA90}","Your own little universe",["star","sparkle","circle"],"float",["#ffffff","#b9a7ff","#ffd86b"],16],
Oxo:["#0d2b3a","#17707f","\u2B55","Simple. Smart. Yours.",["ring","diamond"],"float",["#7ff0e0","#f2b632","#ffffff"],9],
Hi5:["#5b1f78","#e0407a","\u{1F590}\uFE0F","High five, welcome home!",["confetti","star","circle"],"rise",["#ffd23f","#3ee6c4","#ff5d8f","#ffffff"],18],
Rooftop:["#0c1b3f","#f08a4b","\u{1F307}","Sunsets, sky and fresh air",["star","circle","sparkle"],"float",["#ffe9a8","#ffffff","#ffb86b"],12],
Elite:["#1a1200","#8a6200","\u{1F451}","A touch of class",["sparkle","diamond","star"],"float",["#ffe38a","#f2b632","#fff7d6"],16],
C9:["#4d94dc","#d6ecff","\u2601\uFE0F","Feel like cloud nine",["cloud"],"rise",["#ffffff","#eaf5ff"],6],
GreenDen:["#0b3d1e","#2f8f5a","\u{1F33F}","Your green little den",["leaf"],"fall",["#7bd88f","#2fbf71","#c9f7c8"],12],
InnerPeace:["#33275c","#7ea8cf","\u{1FAB7}","Calm mind, calm home",["petal","ring"],"fall",["#ffc2e0","#ffffff","#d7c6ff"],8],
O2:["#08385a","#47c3e8","\u{1FAE7}","Fresh air, fresh start",["bubble"],"rise",["#ffffff","#bdeeff"],14],
GreenTop:["#0f4d2a","#86c548","\u{1F333}","Green all the way up",["leaf","circle"],"rise",["#a8e063","#5fbf4a","#e3ffb3"],12],
VelHeaven:["#4a0e0e","#e0a010","\u{1FA94}","Heavenly peace, close to home",["sparkle","circle"],"rise",["#ffe38a","#ffb347","#fff3cf"],14],
"AVM\u2019sPride":["#0e2a55","#2e5aa8","\u{1F3C6}","The pride of the family",["star","confetti","sparkle"],"rise",["#ffd23f","#ffffff","#7fb2ff"],16],
Flames:["#3a0a00","#ff6a00","\u{1F525}","Warm, bright and full of fire",["flame","circle"],"rise",["#ffcf33","#ff7a1a","#ff3d00"],20],
Titans:["#0f1720","#3c4d5e","\u26A1","Strong. Solid. Built big.",["bolt","diamond"],"float",["#9fd8ff","#ffffff","#f2b632"],12],
Phoenix:["#3a0808","#ff9d00","\u{1F985}","Rise again, stronger",["flame","sparkle"],"rise",["#ffd23f","#ff6a00","#ffffff"],18],
Bodhi:["#2d4a1e","#c9d98a","\u{1F343}","Peace under the bodhi tree",["leaf","petal"],"fall",["#e6f2a8","#9ad06b","#ffffff"],8]
};
function cfg(n){var t=T[n]||["#0e4a2e","#2f8f5a","\u{1F3E0}","Your next home",["sparkle","circle"],"float",["#ffe38a","#ffffff"],10];return{c1:t[0],c2:t[1],em:t[2],line:t[3],shapes:t[4],mode:t[5],cols:t[6],rate:t[7]}}
function R(a,b){return a+Math.random()*(b-a)}
function poly(x,s,n,k){x.beginPath();for(var i=0;i<n*2;i++){var r=i%2?s*k:s,a=i*Math.PI/n-Math.PI/2;x.lineTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath();x.fill()}
function draw(x,p,al){x.save();x.globalAlpha=al;x.translate(p.x,p.y);x.rotate(p.rot);var s=p.s;x.fillStyle=x.strokeStyle=p.col;
switch(p.shape){
case"circle":x.beginPath();x.arc(0,0,s*.5,0,6.283);x.fill();break;
case"ring":x.lineWidth=2;x.beginPath();x.arc(0,0,s,0,6.283);x.stroke();break;
case"bubble":x.lineWidth=1.5;x.beginPath();x.arc(0,0,s,0,6.283);x.stroke();x.globalAlpha=al*.55;x.beginPath();x.arc(-s*.35,-s*.35,s*.22,0,6.283);x.fill();break;
case"star":poly(x,s,5,.45);break;
case"sparkle":poly(x,s*1.2,4,.2);break;
case"leaf":x.beginPath();x.moveTo(0,-s);x.quadraticCurveTo(s*.9,-s*.2,0,s);x.quadraticCurveTo(-s*.9,-s*.2,0,-s);x.fill();break;
case"petal":x.beginPath();x.ellipse(0,0,s*.45,s,0,0,6.283);x.fill();break;
case"flame":x.beginPath();x.moveTo(0,-s*1.3);x.bezierCurveTo(s*.9,-s*.3,s*.8,s*.7,0,s);x.bezierCurveTo(-s*.8,s*.7,-s*.9,-s*.3,0,-s*1.3);x.fill();break;
case"cloud":x.beginPath();x.arc(-s*.6,0,s*.5,0,6.283);x.arc(0,-s*.3,s*.65,0,6.283);x.arc(s*.6,0,s*.5,0,6.283);x.fill();break;
case"confetti":x.fillRect(-s*.5,-s*.25,s,s*.5);break;
case"diamond":x.beginPath();x.moveTo(0,-s);x.lineTo(s*.6,0);x.lineTo(0,s);x.lineTo(-s*.6,0);x.closePath();x.fill();break;
case"bolt":x.lineWidth=2.5;x.lineJoin="round";x.beginPath();x.moveTo(-s*.2,-s);x.lineTo(s*.3,-s*.1);x.lineTo(-s*.1,-s*.05);x.lineTo(s*.2,s);x.stroke();break}
x.restore()}
function Fx(cv){var ctx=cv.getContext("2d"),ps=[],c=null,raf=0,last=0,w=0,h=0,sp=0;
function size(){var r=cv.getBoundingClientRect(),k=Math.min(window.devicePixelRatio||1,2);w=r.width;h=r.height;cv.width=Math.round(w*k);cv.height=Math.round(h*k);ctx.setTransform(k,0,0,k,0,0)}
function mk(b,ox,oy){var sh=c.shapes[Math.floor(Math.random()*c.shapes.length)],p={shape:sh,col:c.cols[Math.floor(Math.random()*c.cols.length)],s:R(5,13),life:0,max:R(2.5,5),rot:sh==="flame"?0:R(0,6.28),vr:sh==="flame"?0:R(-1.5,1.5),ph:R(0,6.28),g:0,mode:b?"burst":c.mode};
if(sh==="cloud")p.s=R(12,22);
if(b){var a=R(0,6.28),v=R(120,420);p.x=ox;p.y=oy;p.vx=Math.cos(a)*v;p.vy=Math.sin(a)*v-90;p.g=260;p.max=R(1,2)}
else if(c.mode==="rise"){p.x=R(0,w);p.y=h+20;p.vx=0;p.vy=-R(35,95)}
else if(c.mode==="fall"){p.x=R(0,w);p.y=-20;p.vx=R(-12,12);p.vy=R(28,75)}
else{p.x=R(0,w);p.y=R(0,h);p.vx=R(-10,10);p.vy=R(-10,10);p.max=R(2,4)}
ps.push(p)}
function step(t){var dt=Math.min((t-last)/1000,.05),i,p,k,al;last=t;ctx.clearRect(0,0,w,h);sp+=dt*c.rate;while(sp>1){mk(false);sp--}
for(i=ps.length-1;i>=0;i--){p=ps[i];p.life+=dt;if(p.life>p.max){ps.splice(i,1);continue}p.vy+=p.g*dt;p.x+=(p.vx+(p.mode==="rise"||p.mode==="fall"?Math.sin(p.life*2+p.ph)*18:0))*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;k=p.life/p.max;al=k<.15?k/.15:k>.7?(1-k)/.3:1;draw(ctx,p,al)}
raf=requestAnimationFrame(step)}
return{start:function(cf){c=cf;size();ps=[];sp=0;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(step)},burst:function(n,x,y){if(!c)return;for(var i=0;i<n;i++)mk(true,x,y)},stop:function(){cancelAnimationFrame(raf);ctx.clearRect(0,0,w,h)},rect:function(){return cv.getBoundingClientRect()}}}
var sh=d.getElementById("sheet"),ucv=d.getElementById("ucv"),emb=d.getElementById("uemb"),ln=d.getElementById("sh-line"),tt=d.getElementById("sh-t"),wa=d.getElementById("sh-wa"),u=d.getElementById("ug");
if(!sh||!u)return;
Array.prototype.forEach.call(u.querySelectorAll("li"),function(l){var n=l.textContent.trim(),t=cfg(n),s=d.createElement("span");l.setAttribute("data-u",n);l.style.setProperty("--uc",t.cols[0]);s.className="em";s.setAttribute("aria-hidden","true");s.textContent=t.em;l.textContent="";l.appendChild(s);l.appendChild(d.createTextNode(n))});
var stage=null,page=null,busy=false;
if(!rm){stage=Fx(ucv);var pc=d.createElement("canvas");pc.setAttribute("aria-hidden","true");pc.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:150";d.body.appendChild(pc);page=Fx(pc)}
function fill(n,t){sh.style.setProperty("--c1",t.c1);sh.style.setProperty("--c2",t.c2);emb.firstChild.textContent=t.em;ln.textContent=t.line;tt.textContent="";tt.setAttribute("aria-label",n);n.split("").forEach(function(ch,i){var s=d.createElement("span");s.textContent=ch;s.style.setProperty("--k",i);s.setAttribute("aria-hidden","true");tt.appendChild(s)});wa.href="https://wa.me/919884444587?text="+encodeURIComponent("Hi, I am interested in the "+n+" home at Stay Confident PG Homes. Please share the details.")}
function show(n,t){fill(n,t);if(sh.showModal)sh.showModal();else sh.setAttribute("open","");if(stage){stage.start(t);var r=stage.rect();stage.burst(48,r.width/2,r.height/2)}}
window.__openUnit=function(l){if(busy)return;var n=l.getAttribute("data-u")||l.textContent.trim(),t=cfg(n);if(window.__unitSnd)window.__unitSnd.play(n);
if(rm||!page){show(n,t);return}
busy=true;var r=l.getBoundingClientRect(),pt=Object.assign({},t,{rate:0});l.classList.add("pop");setTimeout(function(){l.classList.remove("pop")},650);
page.start(pt);page.burst(80,r.left+r.width/2,r.top+r.height/2);
setTimeout(function(){busy=false;show(n,t)},450);setTimeout(function(){page.stop()},2300)};
window.__unitFx={cfg:cfg,Fx:Fx};sh.addEventListener("close",function(){if(stage)stage.stop();if(window.__unitSnd)window.__unitSnd.stop()});
})();

;
(function(){
var d=document,r=d.documentElement,rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce) and (min-width: 99999px)").matches,io="IntersectionObserver" in window,els=d.querySelectorAll(".rv2");
if(!els.length)return;
if(!rm&&io){r.classList.add("js");
var o=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){var e=x.target;e.classList.add("in2");o.unobserve(e);setTimeout(function(){e.classList.remove("rv2","in2")},1400)}})},{threshold:.15,rootMargin:"0px 0px -6% 0px"});
Array.prototype.forEach.call(els,function(e){o.observe(e)});
var n=d.querySelector(".n10");
if(n){n.textContent="0";var c=new IntersectionObserver(function(es){if(es[0].isIntersecting){c.disconnect();var t0=null;(function f(t){if(!t0)t0=t;var p=Math.min((t-t0)/1500,1);n.textContent=Math.round(10*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(performance.now())}},{threshold:.5});c.observe(n)}}
})();

;
(function(){
var d=document,dlg=d.getElementById("cisheet");
if(!dlg)return;
var FORM="https://surveyheart.com/form/646534367d1fcb53a0d5ea4f",cf=d.getElementById("ci-cf"),note=d.getElementById("ci-note"),cp=d.getElementById("ci-copy"),MSG=note?note.textContent:"";
var cols=["#f2b632","#3fd07a","#ffffff","#ff7a9c","#7fd4ff"],i,e,a,r;
for(i=0;i<26;i++){e=d.createElement("i");a=Math.random()*6.283;r=60+Math.random()*110;e.style.setProperty("--x",(Math.cos(a)*r).toFixed(0)+"px");e.style.setProperty("--y",(Math.sin(a)*r-30).toFixed(0)+"px");e.style.setProperty("--r",Math.round(Math.random()*720-360)+"deg");e.style.setProperty("--cc",cols[i%cols.length]);cf.appendChild(e)}
function say(t){if(note)note.textContent=t}
function open(ev){if(!dlg.showModal)return;ev.preventDefault();say(MSG);dlg.showModal();dlg.scrollTop=0}
Array.prototype.forEach.call(d.querySelectorAll("[data-ci]"),function(b){b.addEventListener("click",open)});
function shut(){if(dlg.close)dlg.close()}
d.getElementById("ci-x").addEventListener("click",shut);
dlg.addEventListener("click",function(ev){if(ev.target===dlg)shut()});
function fallback(){try{var t=d.createElement("textarea");t.value=FORM;t.setAttribute("readonly","");t.style.cssText="position:fixed;opacity:0";d.body.appendChild(t);t.select();var ok=d.execCommand("copy");d.body.removeChild(t);return ok}catch(x){return false}}
if(cp)cp.addEventListener("click",function(){
function good(){say("Link copied. Paste it in any browser.")}
function bad(){say("Could not copy. Please use the Start check-in button.")}
try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(FORM).then(good,function(){fallback()?good():bad()});return}}catch(x){}
fallback()?good():bad()});
})();

;
(function(){
var d=document,r=d.documentElement,bar=d.getElementById("tabbar"),mq=window.matchMedia("(max-width:820px), (max-height:500px) and (pointer:coarse)"),cur="";
if(!bar)return;
var btns=bar.querySelectorAll("button");
function each(l,f){Array.prototype.forEach.call(l,f)}
function jump(y){var s=r.style.scrollBehavior;r.style.scrollBehavior="auto";window.scrollTo(0,Math.max(0,y));r.style.scrollBehavior=s}
function show(t,fx){cur=t;r.setAttribute("data-page",t);each(d.querySelectorAll("[data-tab]"),function(p){var on=p.getAttribute("data-tab")===t;p.classList.toggle("tab-on",on);if(on&&fx){p.classList.remove("tab-fx");void p.offsetWidth;p.classList.add("tab-fx")}});each(btns,function(b){b.setAttribute("aria-current",b.getAttribute("data-go")===t?"true":"false")})}
function fromHash(){var id=(location.hash||"").slice(1),el=id&&d.getElementById(id),p=el&&el.closest("[data-tab]");return p?p.getAttribute("data-tab"):""}
function mode(){var on=mq.matches;r.classList.toggle("tabs-on",on);if(on)show(cur||fromHash()||"home",false)}
each(btns,function(b){b.addEventListener("click",function(){show(b.getAttribute("data-go"),true);jump(0)})});
d.addEventListener("click",function(e){
if(!r.classList.contains("tabs-on"))return;
var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;
var id=a.getAttribute("href").slice(1);
if(!id||id==="top"){e.preventDefault();show("home",true);jump(0);return}
var el=d.getElementById(id),p=el&&el.closest("[data-tab]");if(!p)return;
e.preventDefault();show(p.getAttribute("data-tab"),true);
requestAnimationFrame(function(){jump(el.getBoundingClientRect().top+window.pageYOffset-76)})});
if(mq.addEventListener)mq.addEventListener("change",mode);else if(mq.addListener)mq.addListener(mode);
mode();
})();

;
(function(){
var d=document,AC=window.AudioContext||window.webkitAudioContext,ac=null,mg=null,nb=null,bus=null,muted=false,cur="",errs=[];
function init(){if(ac)return true;if(!AC)return false;try{ac=new AC()}catch(e){return false}
mg=ac.createGain();mg.gain.value=1.4;var cp=ac.createDynamicsCompressor();cp.threshold.value=-14;cp.ratio.value=6;mg.connect(cp);cp.connect(ac.destination);
var n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),x=b.getChannelData(0),i;for(i=0;i<n;i++)x[i]=Math.random()*2-1;nb=b;return true}
function R(a,b){return a+Math.random()*(b-a)}
function env(g,t,a,dc,v){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dc)}
function tone(b,f,t,dc,v,type,f2,a){a=a||.01;var o=ac.createOscillator(),g=ac.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dc);env(g,t,a,dc,v);o.connect(g);g.connect(b);o.start(t);o.stop(t+a+dc+.05)}
function nz(b,t,dc,type,f0,f1,v,a,q){var s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;s.loop=true;f.type=type;f.Q.value=q||.8;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dc);env(g,t,a,dc-a,v);s.connect(f);f.connect(g);g.connect(b);s.start(t,Math.random()*1.5);s.stop(t+dc+.05)}
var L={
wind:function(b,t){nz(b,t,6,"bandpass",320,900,.4,2.2,.7);nz(b,t+.4,5.6,"bandpass",800,300,.25,2.4,.9)},
leaves:function(b,t){var i;for(i=0;i<42;i++)nz(b,t+.2+Math.random()*5.2,R(.07,.16),"bandpass",R(3200,6200),2600,R(.04,.15),.012,1.2)},
birds:function(b,t){var i,k,g,base,n;for(i=0;i<6;i++){g=t+.4+i*.85+Math.random()*.5;base=R(2100,3900);n=2+Math.floor(Math.random()*3);for(k=0;k<n;k++){tone(b,base,g+k*.13,.09,.07,"sine",base*1.5,.008);tone(b,base*1.6,g+k*.13+.05,.06,.045,"sine",base,.005)}}},
water:function(b,t){nz(b,t,6,"lowpass",650,1300,.3,1.6,.5);nz(b,t+.3,5.5,"bandpass",1200,2200,.08,1.8,.6)},
bubbles:function(b,t){var i,f;for(i=0;i<26;i++){f=R(450,1300);tone(b,f,t+.1+Math.random()*5.3,.1,.12,"sine",f*1.9,.005)}},
fire:function(b,t){var i;nz(b,t,6,"lowpass",340,240,.35,.8,.5);for(i=0;i<70;i++)nz(b,t+Math.random()*5.6,R(.03,.08),"highpass",R(1800,4300),5200,R(.12,.4),.003,.7)},
screech:function(b,t){tone(b,1400,t+1.1,.9,.06,"triangle",3300,.06);tone(b,1200,t+3.2,.8,.05,"triangle",2900,.06);nz(b,t+.8,2.4,"bandpass",400,1800,.25,.8,.8)},
thunder:function(b,t){nz(b,t+.1,.6,"highpass",1600,500,.35,.01,.8);nz(b,t+.3,5,"lowpass",280,70,.95,.3,.6);tone(b,62,t+.35,4,.45,"sine",34,.25);nz(b,t+3.4,2.4,"lowpass",220,60,.5,.4,.6)},
bell:function(b,t){var f=523.25,i,p=[1,2.756,5.404],v=[.2,.1,.05];for(i=0;i<3;i++)tone(b,f*p[i],t+.1,3.6,v[i],"sine",null,.005);for(i=0;i<3;i++)tone(b,f*.75*p[i],t+2.7,3.2,v[i]*.8,"sine",null,.005)},
bowl:function(b,t){var f=196,i,p=[1,2.71,5.1],v=[.16,.07,.03];for(i=0;i<3;i++)tone(b,f*p[i],t+.1,4.6,v[i],"sine",null,.5)},
chime:function(b,t){var n=[784,880,1046.5,1318.5,1568],i,f,tt;for(i=0;i<6;i++){f=n[Math.floor(Math.random()*n.length)];tt=t+.1+i*.42+Math.random()*.15;tone(b,f,tt,1.7,.07,"sine",null,.005);tone(b,f*2.01,tt,.9,.025,"sine",null,.005)}},
twinkle:function(b,t){var i;for(i=0;i<12;i++)tone(b,R(2000,4300),t+.3+Math.random()*5,.5,.03,"sine",null,.01)},
ping:function(b,t){tone(b,1320,t+.1,1.8,.08,"sine",null,.004);tone(b,1980,t+.25,1.4,.04,"sine",null,.004)},
tick:function(b,t){var i;for(i=0;i<9;i++)nz(b,t+.2+i*.55,.05,"bandpass",i%2?1800:2500,i%2?1500:2100,.4,.002,4)},
clap:function(b,t){var o=[.15,.55,.7,1.1],i,k;for(i=0;i<o.length;i++)for(k=0;k<3;k++)nz(b,t+o[i]+k*.012,.1,"bandpass",R(1300,1900),1100,.5,.003,1.4)},
cosmic:function(b,t){var f=[110,165,220,330.5],i;for(i=0;i<4;i++){tone(b,f[i],t,3.6,.05,"sine",null,2.2);tone(b,f[i]*1.005,t+.1,3.6,.04,"triangle",null,2.4)}},
fanfare:function(b,t){var n=[523.25,659.25,783.99,1046.5],i;for(i=0;i<4;i++)tone(b,n[i],t+.1+i*.18,.55,.1,"triangle",null,.01);for(i=0;i<4;i++)tone(b,n[i],t+.95,1.9,.055,"triangle",null,.02)}
};
var P={Vintage:["tick","chime"],Classic:["chime","wind"],Cosmos:["cosmic","twinkle"],Oxo:["water","ping"],Hi5:["clap","twinkle"],Rooftop:["wind","birds"],Elite:["twinkle","chime"],C9:["wind","chime"],GreenDen:["leaves","birds"],InnerPeace:["bowl","water","birds"],O2:["water","bubbles"],GreenTop:["wind","leaves","birds"],VelHeaven:["bell","chime"],"AVM\u2019sPride":["fanfare","twinkle"],Flames:["fire"],Titans:["thunder","wind"],Phoenix:["fire","screech"],Bodhi:["leaves","bowl","birds"]};
function stop(){var b=bus;bus=null;if(!ac||!b)return;try{b.gain.cancelScheduledValues(ac.currentTime);b.gain.setTargetAtTime(0,ac.currentTime,.12)}catch(e){}setTimeout(function(){try{b.disconnect()}catch(e){}},900)}
function play(n){cur=n;if(muted)return;if(!init())return;stop();try{if(ac.resume)ac.resume()}catch(e){}
bus=ac.createGain();bus.gain.value=.85;bus.connect(mg);var t=ac.currentTime+.05;
(P[n]||["chime"]).forEach(function(k){try{L[k](bus,t)}catch(e){errs.push(k+": "+e.message)}})}
window.__unitSnd={play:play,stop:stop,errs:errs};
var btn=d.getElementById("sh-snd"),sh=d.getElementById("sheet");
if(btn)btn.addEventListener("click",function(){muted=!muted;btn.textContent=muted?"\uD83D\uDD07":"\uD83D\uDD0A";btn.setAttribute("aria-pressed",muted?"true":"false");btn.setAttribute("aria-label",muted?"Turn nature sound on":"Mute nature sound");if(muted)stop();else if(cur)play(cur)});
d.addEventListener("visibilitychange",function(){if(d.hidden)stop()});
})();
(function(){
var d=document,r=d.documentElement,b=d.getElementById("fsbtn"),tm=0;
if(!b)return;
var can=!!(d.fullscreenEnabled||d.webkitFullscreenEnabled)&&!!(r.requestFullscreen||r.webkitRequestFullscreen),frame=false;
try{frame=window.self!==window.top}catch(e){frame=true}
function isFs(){return !!(d.fullscreenElement||d.webkitFullscreenElement)}
function sync(){var on=isFs();b.setAttribute("aria-pressed",on?"true":"false");b.setAttribute("aria-label",on?"Exit full screen":"Full screen");b.title=on?"Exit full screen":"Full screen"}
function toast(m){var t=d.querySelector(".fstoast");if(!t){t=d.createElement("div");t.className="fstoast";t.setAttribute("role","status");d.body.appendChild(t)}t.textContent=m;clearTimeout(tm);tm=setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},4200)}
function fallback(){if(frame&&/^https?:/.test(location.href)){var w=window.open(location.href,"_blank");if(w){try{w.opener=null}catch(e){}return}}toast("For full screen on iPhone: tap Share, then Add to Home Screen.")}
b.addEventListener("click",function(){
if(!can){fallback();return}
if(isFs()){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return}
try{var f=r.requestFullscreen||r.webkitRequestFullscreen,p=f.call(r,{navigationUI:"hide"});if(p&&p.catch)p.catch(fallback)}catch(e){fallback()}});
d.addEventListener("fullscreenchange",sync);d.addEventListener("webkitfullscreenchange",sync);sync();
})();

;
(function(){
var d=document,dlg=d.getElementById("washeet");
if(!dlg||!dlg.showModal)return;
var msg=d.getElementById("wa-msg"),note=d.getElementById("wa-note"),go=d.getElementById("wa-go"),bg=d.getElementById("wa-bg"),inn=d.getElementById("wa-in"),tm=0,href="";
var rm=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce) and (min-width:99999px)").matches);
var RE=/^(https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)(\/|\?|$)|whatsapp:\/\/)/i;
var i,e;for(i=0;i<9;i++){e=d.createElement("i");e.style.setProperty("--l",(Math.random()*92).toFixed(0)+"%");e.style.setProperty("--s",(18+Math.random()*34).toFixed(0)+"px");e.style.setProperty("--d",(Math.random()*3).toFixed(1)+"s");e.style.setProperty("--t",(4+Math.random()*3).toFixed(1)+"s");bg.appendChild(e)}
function txt(u){try{var m=/[?&]text=([^&#]*)/.exec(u);if(m){var s=decodeURIComponent(m[1].replace(/\+/g," "));if(s)return s.length>140?s.slice(0,137)+"...":s}}catch(x){}return"Hi, I would like to know about Stay Confident PG Homes"}
var wel=false,ttl=d.querySelector("#washeet .wa-t"),done=false,raf=0,t0=0,DUR=1600,bar=d.querySelector("#washeet .wa-bar i");
var mob=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||"")||(navigator.maxTouchPoints>1&&/Mac/i.test(navigator.platform||""));
function shut(){clearTimeout(tm);cancelAnimationFrame(raf);if(dlg.open)dlg.close()}
/* 1) loading: show progress while the animation plays */
function tick(){if(!dlg.open||done)return;var pc=Math.min(100,Math.round((performance.now()-t0)/DUR*100));
note.textContent=wel?(pc<100?"Loading your stay\u2026 "+pc+"%":"Welcome to Stay Confident!"):(pc<100?"Loading WhatsApp\u2026 "+pc+"%":"Ready! Opening WhatsApp\u2026");
if(pc<100)raf=requestAnimationFrame(tick)}
/* 2) only after loading finishes, open WhatsApp */
function launch(){if(done||!dlg.open)return;done=true;clearTimeout(tm);cancelAnimationFrame(raf);
if(wel){wel=false;note.textContent="Welcome to Stay Confident!";tm=setTimeout(shut,500);return}
go.classList.remove("wa-wait");
note.textContent="Opening WhatsApp\u2026";
var framed=false;try{framed=window.self!==window.top}catch(x){framed=true}
/* never navigate an embedded frame to WhatsApp: wa.me refuses to load inside frames ("This content is blocked") */
if(mob&&!framed){window.location.href=href;return}
var w=null;try{w=window.open(href,"_blank")}catch(x){w=null}
if(w){try{w.opener=null}catch(x){}note.textContent="WhatsApp is opening\u2026";tm=setTimeout(shut,900)}
else{go.classList.add("wa-pulse");if(framed){note.textContent="Tap Open WhatsApp to continue";try{window.top.location.href=href}catch(x){}}else{window.location.href=href}}}
function start(u){if(dlg.open)return;wel=false;if(ttl)ttl.textContent="Opening WhatsApp";done=false;href=u;msg.textContent=txt(u);go.href=u;go.classList.remove("wa-pulse");go.classList.add("wa-wait");
note.textContent="Loading WhatsApp\u2026 0%";dlg.showModal();clearTimeout(tm);t0=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
tm=setTimeout(launch,rm?600:DUR+500)}
if(bar)bar.addEventListener("animationend",function(){if(!dlg.open||done)return;clearTimeout(tm);tm=setTimeout(launch,rm?0:450)});
window.addEventListener("pageshow",function(ev){if(ev.persisted)shut()});
window.__scWA=function(u){start(u)};

d.addEventListener("click",function(ev){
if(ev.defaultPrevented||ev.button||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)return;
var a=ev.target.closest&&ev.target.closest("a[href]");
if(!a||a.hasAttribute("data-wa-go"))return;
if(!RE.test(a.href))return;
ev.preventDefault();start(a.href)});
go.addEventListener("click",function(){done=true;clearTimeout(tm);tm=setTimeout(shut,700)});
d.getElementById("wa-x").addEventListener("click",shut);
dlg.addEventListener("click",function(ev){if(ev.target===dlg||ev.target===inn||ev.target===bg)shut()});
dlg.addEventListener("close",function(){clearTimeout(tm);wel=false});
})();

;
(function(){
var d=document,F=d.getElementById("enqf");if(!F)return;
var $=function(i){return d.getElementById(i)},WAB="https://wa.me/919884444587",note=$("enq-note");
var ROOM={single:"Single Occupancy A/C Room",master:"Private A/C Master Bedroom",bhk:"Entire 2BHK Home"},SH={1:"single sharing",2:"double sharing",3:"triple sharing"},AC={ac:"A/C",non:"Non-A/C",any:"A/C or Non-A/C"};
var dt=$("enq-date");try{var n=new Date(),p=function(x){return(x<10?"0":"")+x};dt.min=n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate())}catch(e){}
function groups(){var daily=$("enq-type").value==="daily";Array.prototype.forEach.call(F.querySelectorAll(".enq-d"),function(e){e.hidden=!daily});Array.prototype.forEach.call(F.querySelectorAll(".enq-m"),function(e){e.hidden=daily})}
$("enq-type").addEventListener("change",groups);groups();
function err(id,m){var e=F.querySelector('.enq-e[data-for="'+id+'"]'),i=$(id);if(e)e.textContent=m||"";if(i)i.setAttribute("aria-invalid",m?"true":"false")}
function digits(v){var s=String(v||"").replace(/\D/g,"");if(s.length===12&&s.indexOf("91")===0)s=s.slice(2);if(s.length===11&&s.charAt(0)==="0")s=s.slice(1);return s}
function valid(){var ok=true,nm=$("enq-name").value.trim(),ph=digits($("enq-phone").value);
if(nm.length<2){err("enq-name","Please enter your name.");ok=false}else err("enq-name","");
if(!/^[6-9]\d{9}$/.test(ph)){err("enq-phone","Please enter a valid 10-digit mobile number.");ok=false}else err("enq-phone","");
return ok}
function fmtDate(v){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||"");if(!m)return"";var M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return parseInt(m[3],10)+" "+M[parseInt(m[2],10)-1]+" "+m[1]}
function build(){var t=$("enq-type").value,what;
if(t==="daily")what="Daily stay, "+ROOM[$("enq-room").value];
else what="Monthly stay, "+(t==="women"?"women":"men")+"\u2019s home, "+AC[$("enq-ac").value]+", "+SH[$("enq-share").value];
var l=["Hi, I would like to enquire about Stay Confident PG Homes.","Name: "+$("enq-name").value.trim(),"Mobile: "+digits($("enq-phone").value),"Looking for: "+what];
var dd=fmtDate(dt.value);if(dd)l.push("Move-in date: "+dd);
var nt=$("enq-notes").value.trim();if(nt)l.push("Notes: "+nt);
l.push("Please share availability and rent.");return l.join("\n")}
function say(m,bad){note.textContent=m;note.style.color=bad?"#ff8a8d":""}
function openWA(){var url=WAB+"?text="+encodeURIComponent(build()),w=null;
if(window.__scWA){window.__scWA(url);return true}
try{w=window.open(url,"_blank")}catch(x){w=null}
if(w){try{w.opener=null}catch(x){}return true}
try{window.location.href=url;return true}catch(x){}return false}
F.addEventListener("submit",function(e){e.preventDefault();say("");
if(!valid()){say("Please enter your name and a valid 10-digit mobile number, then tap Send on WhatsApp.",true);var bad=F.querySelector('[aria-invalid="true"]');if(bad)bad.focus();return}
if(openWA())say("Opening WhatsApp with your enquiry. Tap Send there to reach us.");
else say("Could not open WhatsApp. Tap Copy message and paste it to +91 98844 44587.",true)});
$("enq-copy").addEventListener("click",function(){if(!valid()){say("Please enter your name and a valid 10-digit mobile number first.",true);return}say("");var m=build();
try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(m).then(function(){note.textContent="Message copied. Paste it into WhatsApp or SMS to +91 98844 44587."},function(){note.textContent="Could not copy. Please use Send on WhatsApp."});return}}catch(x){}
note.textContent="Could not copy. Please use Send on WhatsApp."});
["enq-name","enq-phone"].forEach(function(i){$(i).addEventListener("input",function(){if($(i).getAttribute("aria-invalid")==="true")valid()})});
/* lets other scripts prefill the enquiry form */
window.__scEnquiry={prefill:function(p){if(!p)return;try{
if(p.term==="daily"||p.who==="family"||p.who==="trav"){$("enq-type").value="daily";if(p.room&&ROOM[p.room])$("enq-room").value=p.room}
else{$("enq-type").value=p.who==="woman"?"women":"men";if(p.share&&SH[p.share])$("enq-share").value=String(p.share);if(p.ac&&AC[p.ac])$("enq-ac").value=p.ac}
groups()}catch(e){}},focus:function(){try{$("enq-name").focus({preventScroll:true})}catch(e){}}};
})();

;
/* ============ UNIT PHOTO FILM ============
 ADD YOUR REAL PHOTOS HERE. Put image files in a folder next to this HTML file
 (for example "photos/Flames-1.jpg") and list them under the home's name.
 A photo can be just a path, or {src:"path",cap:"caption"}.
 Homes left empty show themed "photo coming soon" slides. */
window.UNIT_PHOTOS={
Vintage:[{"src": "images/homes/Vintage-1.jpg", "cap": "Vintage – Bright 2-bed room with curtains and fan"}, {"src": "images/homes/Vintage-2.jpg", "cap": "Vintage – Tidy 2-bed room with windows and ventilation"}, {"src": "images/homes/Vintage-3.jpg", "cap": "Vintage – Single bed room with built-in shelves"}],Classic:[{"src": "images/homes/Classic-1.jpg", "cap": "Classic – 2-bed room with AC, curtains and fan"}, {"src": "images/homes/Classic-2.jpg", "cap": "Classic – Large room with 3 beds and built-in shelves"}, {"src": "images/homes/Classic-3.jpg", "cap": "Classic – 2-bed room with curtains and wall shelves"}, {"src": "images/homes/Classic-4.jpg", "cap": "Classic – Self-cooking kitchen with gas stove and shelves"}, {"src": "images/homes/Classic-5.jpg", "cap": "Classic – Washing area with washing machine and water tank"}],Cosmos:[{"src": "images/homes/Cosmos-1.jpg", "cap": "Cosmos – 2-bed room with AC and fan"}, {"src": "images/homes/Cosmos-2.jpg", "cap": "Cosmos – Large room with 3 beds, shelves and fridge"}, {"src": "images/homes/Cosmos-3.jpg", "cap": "Cosmos – Single bed room with window and shelves"}, {"src": "images/homes/Cosmos-4.jpg", "cap": "Cosmos – Self-cooking kitchen with gas stove and shelves"}],Oxo:[{"src": "images/homes/Oxo-1.jpg", "cap": "Oxo – Bright, airy 2-bed room with curtains"}, {"src": "images/homes/Oxo-2.jpg", "cap": "Oxo – Room with 3 beds, wardrobe and open shelves"}, {"src": "images/homes/Oxo-3.jpg", "cap": "Oxo – Spacious 3-bed room with shelves and fan"}, {"src": "images/homes/Oxo-4.jpg", "cap": "Oxo – Self-cooking kitchen with granite counter and sink"}, {"src": "images/homes/Oxo-5.jpg", "cap": "Oxo – Washing machine and utility corner"}, {"src": "images/homes/Oxo-6.jpg", "cap": "Oxo – Clean wash area with window"}],Hi5:[],Rooftop:[{"src": "images/homes/Rooftop-1.jpg", "cap": "Rooftop \u2013 Open terrace with teal-painted rooms and AC units"}, {"src": "images/homes/Rooftop-2.jpg", "cap": "Rooftop \u2013 Large room with AC, wardrobe, TV and 2 beds"}, {"src": "images/homes/Rooftop-3.jpg", "cap": "Rooftop \u2013 Self-cooking kitchen with fridge, shelves and gas stove"}, {"src": "images/homes/Rooftop-4.jpg", "cap": "Rooftop \u2013 Bathroom with western toilet, geyser and washing machine"}],Elite:[],C9:[],GreenDen:[{"src": "images/homes/GreenDen-1.jpg", "cap": "GreenDen \u2013 2-bed room with curtains, fan and built-in shelves"}, {"src": "images/homes/GreenDen-2.jpg", "cap": "GreenDen \u2013 2-bed room with shelves, study table and fan"}, {"src": "images/homes/GreenDen-3.jpg", "cap": "GreenDen \u2013 Self-cooking kitchen with fridge, shelves and archway to bedroom"}, {"src": "images/homes/GreenDen-4.jpg", "cap": "GreenDen \u2013 Kitchen counter with induction stove, sink and washing machine"}, {"src": "images/homes/GreenDen-5.jpg", "cap": "GreenDen \u2013 Bathroom with Indian-style toilet and water heater"}],InnerPeace:[],
O2:[{"src": "images/homes/O2-1.jpg", "cap": "O2 \u2013 Entrance corridor with CCTV and polished flooring"}, {"src": "images/homes/O2-2.jpg", "cap": "O2 \u2013 Balcony corridor with sliding windows and bamboo blinds"}, {"src": "images/homes/O2-3.jpg", "cap": "O2 \u2013 Bright hall with ring light, wardrobe and fan"}, {"src": "images/homes/O2-4.jpg", "cap": "O2 \u2013 Spacious hall with AC, wardrobe and open kitchen"}, {"src": "images/homes/O2-5.jpg", "cap": "O2 \u2013 3-bed room with AC, curtains and fan"}, {"src": "images/homes/O2-6.jpg", "cap": "O2 \u2013 3-bed room with curtains and tube light"}, {"src": "images/homes/O2-7.jpg", "cap": "O2 \u2013 3-bed room with built-in shelves and curtains"}, {"src": "images/homes/O2-8.jpg", "cap": "O2 \u2013 2-bed room with arched shelves and wall art"}, {"src": "images/homes/O2-9.jpg", "cap": "O2 \u2013 Spacious room opening to more bedrooms"}, {"src": "images/homes/O2-10.jpg", "cap": "O2 \u2013 Self-cooking kitchen with cobalt cabinets and chimney"}, {"src": "images/homes/O2-11.jpg", "cap": "O2 \u2013 Open kitchen with island counter beside the hall"}, {"src": "images/homes/O2-12.jpg", "cap": "O2 \u2013 Simple kitchen with gas stove, sink and fridge"}, {"src": "images/homes/O2-13.jpg", "cap": "O2 \u2013 Washing area with washing machine and geyser"}, {"src": "images/homes/O2-14.jpg", "cap": "O2 \u2013 Utility corner with washing machine, AC unit and water heater"}, {"src": "images/homes/O2-15.jpg", "cap": "O2 \u2013 Spacious bathroom with geyser and western toilet"}, {"src": "images/homes/O2-16.jpg", "cap": "O2 \u2013 Bathroom with wash basin and Indian-style toilet"}, {"src": "images/homes/O2-17.jpg", "cap": "O2 \u2013 Bathroom with Indian-style toilet and tap"}, {"src": "images/homes/O2-18.jpg", "cap": "O2 \u2013 Covered terrace with terracotta flooring and plants"}, {"src": "images/homes/O2-19.jpg", "cap": "O2 \u2013 Open terrace garden with potted plants"}],GreenTop:[],VelHeaven:[],"AVM\u2019sPride":[],Flames:[],Titans:[],Phoenix:[],Bodhi:[]
};
(function(){
var d=document;
function $(i){return d.getElementById(i)}
var pv=$("pv"),btn=$("sh-ph");if(!pv||!btn)return;
var img=$("gv-img"),cap=$("gv-cap"),cnt=$("gv-cnt"),th=$("gv-thumbs"),nm=$("gv-name"),main=$("gv-main"),prev=$("pv-prev"),nxt=$("pv-next");
var LAB=[["\u{1F6CF}️","Your room"],["\u{1F6AA}","Bed and storage"],["\u{1F373}","Self-cooking kitchen"],["\u{1F6CB}️","Common area"],["\u{1F305}","Terrace and surroundings"]];
var idx=0,items=[],cfg=null,name="",sx=0,sy=0,gv=$("gv"),introT=0,running=false;
function mkItems(n){var p=(window.UNIT_PHOTOS&&window.UNIT_PHOTOS[n])||[],r=[],i;
for(i=0;i<p.length;i++){var s=typeof p[i]==="string"?{src:p[i]}:p[i];r.push({src:s.src,cap:s.cap||(n+" – photo "+(i+1))})}
if(!r.length)for(i=0;i<LAB.length;i++)r.push({ph:LAB[i],cap:LAB[i][1]});return r}
function bigNode(it){
if(it.src){var im=d.createElement("img");im.src=it.src;im.alt=it.cap;im.decoding="async";im.draggable=false;return im}
var c=d.createElement("div");c.className="gv-ph";c.style.background="linear-gradient(140deg,"+cfg.c1+","+cfg.c2+")";
c.innerHTML='<span class="e" aria-hidden="true"></span><b></b><small>Photo coming soon</small>';c.firstChild.textContent=cfg.em;c.childNodes[1].textContent=it.ph[1];return c}
function buildThumbs(){th.textContent="";
items.forEach(function(it,i){var b=d.createElement("button");b.type="button";b.className="gv-t";b.setAttribute("aria-label","Photo "+(i+1)+": "+it.cap);
if(it.src){var t=d.createElement("img");t.src=it.src;t.alt="";t.decoding="async";t.draggable=false;b.appendChild(t)}
else{b.style.background="linear-gradient(140deg,"+cfg.c1+","+cfg.c2+")";var e=d.createElement("span");e.textContent=it.ph[0];e.setAttribute("aria-hidden","true");b.appendChild(e)}
b.addEventListener("click",function(){show(i)});th.appendChild(b)})}
function show(i){
if(!items.length)return;
idx=(i+items.length)%items.length;
img.textContent="";img.appendChild(bigNode(items[idx]));
cap.textContent=items[idx].cap;cnt.textContent=(idx+1)+" / "+items.length;
Array.prototype.forEach.call(th.children,function(b,k){var on=k===idx;b.classList.toggle("on",on);b.setAttribute("aria-current",on?"true":"false");
if(on){var l=b.offsetLeft-(th.clientWidth-b.offsetWidth)/2;th.scrollLeft=Math.max(0,l)}})}
function begin(){clearTimeout(introT);if(running)return;running=true;gv.classList.add("gv-run");try{$("pv-x").focus({preventScroll:true})}catch(x){}}
function fit(){pv.style.height=window.innerHeight+"px";pv.style.width=d.documentElement.clientWidth+"px"}
btn.addEventListener("click",function(){
var t=$("sh-t");name=t.getAttribute("aria-label")||t.textContent.trim();
var F=window.__unitFx;cfg=F?F.cfg(name):{c1:"#0e4a2e",c2:"#2f8f5a",em:"\u{1F3E0}",cols:["#f2b632"],line:"Your next home"};
items=mkItems(name);
pv.style.setProperty("--c1",cfg.c1);pv.style.setProperty("--c2",cfg.c2);pv.style.setProperty("--gl",cfg.cols[0]);
nm.textContent=name;$("mv-wa").href=$("sh-wa").href;
var inm=$("gv-iname");inm.textContent="";inm.setAttribute("aria-label",name);
name.split("").forEach(function(ch,i){var sp=d.createElement("span");sp.textContent=ch;sp.style.setProperty("--k",i);sp.setAttribute("aria-hidden","true");inm.appendChild(sp)});
$("gv-iline").textContent=cfg.line||"";
clearTimeout(introT);running=false;gv.classList.remove("gv-run");
var many=items.length>1;prev.hidden=!many;nxt.hidden=!many;
buildThumbs();
if(pv.showModal)pv.showModal();else pv.setAttribute("open","");
fit();show(0);introT=setTimeout(begin,3600)});
window.addEventListener("resize",function(){if(pv.open)fit()});
window.addEventListener("orientationchange",function(){setTimeout(function(){if(pv.open)fit()},200)});
function close(){if(pv.close)pv.close();else pv.removeAttribute("open")}
$("pv-x").addEventListener("click",close);
prev.addEventListener("click",function(){show(idx-1)});
nxt.addEventListener("click",function(){show(idx+1)});
pv.addEventListener("close",function(){clearTimeout(introT);running=false;img.textContent="";th.textContent=""});
$("gv-intro").addEventListener("click",begin);
$("gv-intro").addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();begin()}});
pv.addEventListener("keydown",function(e){
if(!running){if(e.key==="ArrowRight"||e.key==="ArrowLeft"||e.key==="Enter"||e.key===" "){e.preventDefault();begin()}return}
if(e.key==="ArrowRight"){e.preventDefault();show(idx+1)}
else if(e.key==="ArrowLeft"){e.preventDefault();show(idx-1)}
else if(e.key==="Home"){e.preventDefault();show(0)}
else if(e.key==="End"){e.preventDefault();show(items.length-1)}});
main.addEventListener("pointerdown",function(e){sx=e.clientX;sy=e.clientY});
main.addEventListener("pointerup",function(e){
if(e.target.closest&&e.target.closest("button"))return;
var dx=e.clientX-sx,dy=e.clientY-sy;
if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)show(idx+(dx<0?1:-1))});
})();

;
(function(){
var r=document.documentElement,b=document.getElementById("fsb");if(!b)return;
var el=r,rq=el.requestFullscreen||el.webkitRequestFullscreen,ex=document.exitFullscreen||document.webkitExitFullscreen;
var ok=!!(rq&&ex)&&(document.fullscreenEnabled!==false);
if(ok)r.classList.add("fs-ok");
function isFs(){return !!(document.fullscreenElement||document.webkitFullscreenElement)}
function sync(){var on=isFs();r.classList.toggle("is-fs",on);b.setAttribute("aria-pressed",on?"true":"false");b.setAttribute("aria-label",on?"Exit full screen":"Full screen")}
function enter(){try{var p=rq.call(el,{navigationUI:"hide"});if(p&&p.catch)p.catch(function(){})}catch(e){}}
function leave(){try{var p=ex.call(document);if(p&&p.catch)p.catch(function(){})}catch(e){}}
b.addEventListener("click",function(){if(!ok)return;isFs()?leave():enter()});
document.addEventListener("fullscreenchange",sync);document.addEventListener("webkitfullscreenchange",sync);
var tb=document.getElementById("tabbar"),done=false;
try{done=sessionStorage.getItem("sc-fs")==="1"}catch(e){}
if(ok&&tb&&!done&&window.matchMedia&&matchMedia("(pointer:coarse)").matches){tb.addEventListener("click",function f(){tb.removeEventListener("click",f);try{sessionStorage.setItem("sc-fs","1")}catch(e){}if(r.classList.contains("tabs-on")&&!isFs())enter()})}
})();

;
(function(){
var d=document,sh=d.getElementById("sheet"),box=d.getElementById("uinfo");
if(!sh||!box)return;
var IC={
home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
bed:'<path d="M3 18V6"/><path d="M3 14h18v4"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
floor:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16"/>',
pin:'<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
pot:'<path d="M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M2 11h20M9 7c0-1.5 1.5-1.5 1.5-3M14 7c0-1.5 1.5-1.5 1.5-3"/>',
bath:'<path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M7 21l1-2M17 21l-1-2"/>',
flame:'<path d="M12 3s5 4.5 5 9.5a5 5 0 0 1-10 0c0-2 1-3.4 2-4.5 0 2 1 2.6 2 2.6C11 8.5 12 6 12 3z"/>',
car:'<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3z"/><path d="M6 11h12"/>',
wash:'<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><circle cx="12" cy="14" r="4.2"/><path d="M8 6h.01M11 6h.01"/>',
fridge:'<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/>',
drop:'<path d="M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z"/>',
spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4"/>',
users:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.8.8 3 2.6 3 4.7"/>',
snow:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
chat:'<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/>',
check:'<path d="M5 12.5l4.5 4.5L19 7"/>'
};
/* ---- home data. b=BHK, r=rent range, f=floor, rm=rooms (number=sharing, A=A/C, N=Non-A/C),
   ar=areas, st=stove (I induction / G gas), fr=fridge, bi/bw=Indian/Western bathrooms,
   pk=parking (C free+CCTV / F free / B free street + paid bike), wm=washing machine + iron station ---- */
var A3=["Ashok Nagar","Jafferkhanpet","Ekkatuthangal"],AN=["Ashok Nagar"];
var DATA={
"Vintage":{b:2,r:[4900,7900],f:"GF",rm:"1N 2N",ar:A3,st:"I",fr:1,bi:1,bw:1,pk:"C",wm:1},
"Classic":{b:2,r:[4900,8500],rm:"2A",ar:A3,st:"G",fr:1,bi:1,bw:1,pk:"C",wm:1},
"Cosmos":{b:2,r:[4900,9500],f:"FF",rm:"2A 1N 3N",ar:A3,st:"G",fr:1,bi:1,bw:1,pk:"C",wm:1},
"Oxo":{b:2,r:[4900,12500],f:"SF",rm:"1N 3N",ar:A3,st:"I",fr:1,bi:1,bw:0,pk:"C",wm:1},
"Hi5":{b:2,r:[4900,7500],f:"SF",rm:"3A 2N",ar:A3,st:"I",fr:1,bi:1,bw:0,pk:"C",wm:1},
"Rooftop":{b:2,r:[7900,11500],f:"TF",rm:"3A",ar:A3,st:"I",fr:1,bi:0,bw:1,pk:"C",wm:1},
"Elite":{b:2,r:[4900,8500],f:"GF",rm:"2A 3A 2N",ar:AN,st:"G",fr:1,bi:0,bw:2,pk:"C",wm:1},
"C9":{b:2,r:[21000,38000],f:"GF",rm:"1A 2A",ar:AN,st:"G",fr:1,bi:0,bw:2,pk:"C",wm:1},
"GreenDen":{b:2,r:[4500,6500],f:"GF",rm:"2N",ar:A3,st:"I",fr:1,bi:1,bw:0,pk:"F",wm:1},
"InnerPeace":{b:2,r:[4500,6500],f:"GF",rm:"2N",ar:A3,st:"I",fr:0,bi:1,bw:0,pk:"F",wm:1},
"O2":{b:2,r:[4900,8500],f:"GF",rm:"3A 3N",ar:AN,st:"G",fr:1,bi:2,bw:1,pk:"B",wm:1},
"GreenTop":{b:3,r:[8900,28500],f:"FF",rm:"3A",ar:AN,st:"I",fr:1,bi:1,bw:2,pk:"B",wm:1},
"VelHeaven":{b:2,r:[7900,10500],f:"GF",rm:"2A 3A",ar:["Chennai Central"],st:"I",fr:1,bi:1,bw:1,pk:"C",wm:1},
"AVM\u2019sPride":{b:2,r:[4900,8500],f:"GF",rm:"2A 3A 2N",ar:["MGR Nagar","Ramapuram"],st:"I",fr:1,bi:1,bw:1},
"Flames":{b:2,r:[4900,8500],f:"FF",rm:"2A 3N",ar:AN,st:"I",fr:1,bi:0,bw:1,pk:"C",wm:1},
"Titans":{b:2,r:[4900,14500],f:"FF",rm:"1A 2A 2N",ar:AN,st:"I",fr:1,bi:0,bw:1,pk:"F",wm:1},
"Phoenix":{b:3,r:[6500,8500],f:"FF",rm:"3A",ar:AN,st:"I",fr:1,bi:1,bw:0,pk:"F",wm:1},
"ParkView":{b:3,r:[4900,9500],f:"GF",rm:"2A 2N 3N",ar:AN,st:"I",fr:1,bi:1,bw:1,pk:"F",wm:1}
};
var FL={GF:["Ground","Ground floor"],FF:["First","First floor"],SF:["Second","Second floor"],TF:["Top","Top floor"]};
var SH={1:"Single sharing",2:"Double sharing",3:"Triple sharing"};
function money(n){return "\u20B9"+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,",")}
function build(x){
 var o={price:[money(x.r[0]),money(x.r[1])],stats:[],secs:[]},rooms=[],hasA=0,hasN=0;
 x.rm.split(" ").forEach(function(t){var n=+t.charAt(0),a=t.charAt(1)==="A";rooms.push({n:n,a:a});if(a)hasA=1;else hasN=1});
 rooms.sort(function(p,q){return (q.a-p.a)||(p.n-q.n)});
 o.stats.push({i:"home",v:x.b+" BHK",l:"Home type"});
 if(x.f)o.stats.push({i:"floor",v:FL[x.f][0],l:"Floor"});
 o.stats.push({i:hasA&&hasN?"snow":(hasA?"snow":"bed"),v:hasA&&hasN?"A/C + Non-A/C":(hasA?"A/C":"Non-A/C"),l:"Rooms"});
 o.secs.push({h:"Room options",chips:rooms.map(function(r){return {t:SH[r.n]+" \u00B7 "+(r.a?"A/C":"Non-A/C"),k:r.a?"a":"n",ic:r.a?"snow":"bed"}}),rm:1});
 o.secs.push({h:"Nearby areas",chips:x.ar,pin:1});
 var k=[x.st==="G"?"Gas stove":"Induction stove","Kettle"];if(x.fr)k.push("Fridge");k.push("RO drinking water");
 o.secs.push({h:"Kitchen",chips:k});
 var bs={h:"Bathrooms"},two=[];
 function bt(c,l){return {i:"bath",l:l,v:c+(c>1?" bathrooms":" bathroom")}}
 if(x.bi&&x.bw){two=[bt(x.bi,"Indian style"),bt(x.bw,"Western style")];bs.two=two;bs.rows=[{i:"flame",l:"Hot water",v:"With water heater"}]}
 else{var one=x.bi?bt(x.bi,"Indian style"):bt(x.bw,"Western style");one.v+=" \u00B7 with water heater";bs.rows=[one]}
 o.secs.push(bs);
 var rows=[];
 if(x.pk)rows.push({i:"car",l:"Parking",v:x.pk==="C"?"Free street parking with CCTV":(x.pk==="B"?"Free street parking \u00B7 Paid bike parking":"Free street parking")});
 if(x.wm)rows.push({i:"wash",l:"Laundry",v:"Semi-automatic top-load washing machine + iron station"});
 if(rows.length)o.secs.push({h:rows.length>1?"Parking & laundry":(x.pk?"Parking":"Laundry"),rows:rows});
 return o}
var COMMON={
 secs:[
  {h:"In every Stay Confident home",tiles:[{i:"pot",v:"Self-cooking kitchen"},{i:"fridge",v:"Refrigerator"},{i:"drop",v:"RO drinking water"},{i:"wash",v:"Washing machine"},{i:"spark",v:"Housekeeping support"},{i:"users",v:"Men\u2019s & women\u2019s homes"}]},
  {h:"Sharing options",chips:["Single sharing","Double sharing","Triple sharing","A/C & Non-A/C options"]}
 ],
 note:"Rent and room availability for this home: message us on WhatsApp below."
};
function svg(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(IC[k]||"")+'</svg>'}
function el(t,c,x){var e=d.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function ico(k,c){var e=el("div",c||"ui-ic");e.innerHTML=svg(k);return e}
function rowEl(x,k){var r=el("div","ui-row"),t=el("div","ui-t");r.style.setProperty("--i",k);r.appendChild(ico(x.i));t.appendChild(el("small",null,x.l));t.appendChild(el("span",null,x.v));r.appendChild(t);return r}
function render(n){
 var x=DATA[n],f=x?build(x):COMMON,k=0;box.textContent="";
 if(f.price){
  var h=el("div","ui-hero");h.appendChild(el("small",null,"Rent range"));
  var b=el("b",null,f.price[0]+" \u2013 "+f.price[1]);b.appendChild(el("span",null,"per month"));h.appendChild(b);
  var bar=el("div","ui-bar");bar.appendChild(el("i"));bar.appendChild(el("i"));h.appendChild(bar);
  var bl=el("div","ui-bl");bl.appendChild(el("span",null,"Starts "+f.price[0]));bl.appendChild(el("span",null,"Up to "+f.price[1]));h.appendChild(bl);
  box.appendChild(h)}
 if(f.stats){var g=el("div","ui-stats");g.style.setProperty("--n",f.stats.length);f.stats.forEach(function(s){var c=el("div","ui-s");c.style.setProperty("--i",k++);c.appendChild(ico(s.i));c.appendChild(el("b",null,s.v));c.appendChild(el("small",null,s.l));g.appendChild(c)});box.appendChild(g)}
 f.secs.forEach(function(s){
  box.appendChild(el("div","ui-h",s.h));
  if(s.chips){var w=el("div","ui-chips"+(s.pin?" pin":"")+(s.rm?" rm":""));s.chips.forEach(function(c){var o=typeof c==="string"?{t:c}:c,e=el("span",o.k||"");e.style.setProperty("--i",k++);e.innerHTML=svg(o.ic||(s.pin?"pin":"check"));e.appendChild(d.createTextNode(o.t));w.appendChild(e)});box.appendChild(w)}
  if(s.tiles){var w=el("div","ui-tiles");s.tiles.forEach(function(t){var c=el("div","ui-s");c.style.setProperty("--i",k++);c.appendChild(ico(t.i));c.appendChild(el("b",null,t.v));w.appendChild(c)});box.appendChild(w)}
  if(s.two){var w=el("div","ui-two");s.two.forEach(function(t){w.appendChild(rowEl(t,k++))});box.appendChild(w)}
  if(s.rows)s.rows.forEach(function(t){box.appendChild(rowEl(t,k++))})});
 if(!x&&f.note){var o=el("div","ui-note");o.appendChild(ico("chat"));o.appendChild(el("span",null,f.note));box.appendChild(o)}
 box.hidden=false;sh.classList.add("has-info");
}
var old=window.__openUnit;
window.__openUnit=function(l){
 var n=(l.getAttribute&&l.getAttribute("data-u"))||l.textContent.trim();
 try{render(n)}catch(e){box.hidden=true;sh.classList.remove("has-info")}
 if(old)return old(l)};
if(!old){var u=d.getElementById("ug");if(u)u.addEventListener("click",function(e){var l=e.target.closest("li");if(l)try{render(l.textContent.trim())}catch(x){}})}
})();

;
(function(){
var root=document.getElementById("story");if(!root)return;
var ALL=[];
function init(s,D,tIdx,opt){
var stg=s.querySelector(".stg"),sc=[].slice.call(stg.querySelectorAll(".sc")),segs=[].slice.call(s.querySelectorAll(".seg")),pp=s.querySelector(".pp");
var cur=-1,t=null,t0=0,left=0,playing=false,ended=false,auto=false,begun=false;
var vis=false,pend=false,shown=false,waiting=!!(opt&&opt.wait),api={};function others(){ALL.forEach(function(o){if(o!==api)o.yld()})}
var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var q=stg.querySelector(".q"),full=q?q.getAttribute("data-t"):"",qt=null;
var IC={pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="M7 4.5v15l12-7.5z"/>',replay:'<path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/>'};
var fr=false;function emit(){var f=fr;fr=false;try{s.dispatchEvent(new CustomEvent("stplay",{detail:{playing:playing,scene:cur,fresh:f}}))}catch(e){}}
function icon(n,l){pp.firstElementChild.innerHTML=IC[n];pp.setAttribute("aria-label",l)}
function typeIt(){if(!q)return;clearTimeout(qt);if(rm){q.textContent=full;return}q.textContent="";var i=0;qt=setTimeout(function f(){q.textContent=full.slice(0,++i);if(i<full.length)qt=setTimeout(f,75)},500)}
function show(i){
sc.forEach(function(e,k){
if(k===i){e.classList.remove("out");e.classList.remove("on");void e.offsetWidth;e.classList.add("on")}
else if(e.classList.contains("on")){e.classList.remove("on");e.classList.add("out");setTimeout(function(){e.classList.remove("out")},500)}
else e.classList.remove("out")});
segs.forEach(function(g,k){g.classList.remove("cur");g.classList.toggle("done",k<i);g.style.setProperty("--dur",D[k]+"ms")});
void stg.offsetWidth;segs[i].classList.add("cur");
cur=i;fr=true;if(i===tIdx)typeIt();emit()}
function schedule(ms){clearTimeout(t);left=ms;t0=Date.now();t=setTimeout(next,ms)}
function next(){if(cur<sc.length-1){show(cur+1);schedule(D[cur])}else end()}
function end(){playing=false;ended=true;clearTimeout(t);segs.forEach(function(g){g.classList.remove("cur");g.classList.add("done")});stg.classList.add("paused");icon("replay","Replay story");emit();if(opt&&opt.done){try{opt.done()}catch(x){}}}
function start(i){clearTimeout(t);begun=true;waiting=false;pend=false;others();ended=false;playing=true;stg.classList.remove("paused");icon("pause","Pause story");show(i);schedule(D[i])}
function pause(){if(!playing)return;playing=false;clearTimeout(t);left=Math.max(0,left-(Date.now()-t0));stg.classList.add("paused");icon("play","Play story");emit()}
function resume(){if(playing)return;if(ended){start(0);return}begun=true;waiting=false;pend=false;others();playing=true;stg.classList.remove("paused");icon("pause","Pause story");schedule(left);emit()}
pp.addEventListener("click",function(){auto=false;if(playing)pause();else resume()});
segs.forEach(function(g,k){g.addEventListener("click",function(){auto=false;start(k)})});
function idle(){show(0);icon("play","Play story");playing=false;left=D[0];stg.classList.add("paused")}
api.yld=function(){if(playing){auto=false;pause()}};
api.release=function(){if(begun||!waiting)return;if(!rm&&(vis||!("IntersectionObserver" in window)))start(0);else pend=true};
ALL.push(api);
if(rm){idle()}
if("IntersectionObserver" in window){
new IntersectionObserver(function(es){var v=es[0].isIntersecting;vis=v;
if(v&&!begun&&!rm){if(waiting){if(pend)start(0);else if(!shown){shown=true;idle()}}else start(0)}
else if(v&&auto){auto=false;resume()}
else if(!v&&playing){auto=true;pause()}},{threshold:.4}).observe(stg)}
else if(!rm){if(waiting)idle();else start(0)}
return api}
var c1=root.querySelector("#st1"),c2=root.querySelector("#st2");
var a2=null;
if(c1)init(c1,[8000,7500,8000,11000,9500,9500,9500,8500,9500,8000],2,{done:function(){if(a2)a2.release()}});
if(c2)a2=init(c2,[8400,8400,8400,9300,8400,8700,8400,8400,7800,8400,7800,8400,8400,9900,8400,9600,8400],-1,{wait:true});
var c3=root.querySelector("#st3");if(c3)init(c3,[5800,5600,5800,5600,5800,6400],-1);
})();

;
(function(){
var root=document.getElementById("story");if(!root)return;
var AC=window.AudioContext||window.webkitAudioContext;
var cols=[].slice.call(root.querySelectorAll(".stcol"));
var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var ICON={on:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',off:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>'};

/* ---------- moods: tempo, key, scale (Mohanam-style pentatonic), chords ---------- */
var M={
worry:{bpm:66,key:57,pent:[0,1,5,7,8],prog:[[0,"m"],[1,"M"],[0,"m"],[10,"M"]],perc:0,cut:1100},
calm:{bpm:64,key:57,pent:[0,3,5,7,10],prog:[[0,"m"],[8,"M"],[3,"M"],[10,"M"]],perc:0,cut:1600},
tender:{bpm:72,key:60,pent:[0,2,4,7,9],prog:[[0,"M"],[9,"m"],[5,"M"],[7,"M"]],perc:0,cut:2100},
hope:{bpm:84,key:60,pent:[0,2,4,7,9],prog:[[0,"M"],[7,"M"],[9,"m"],[5,"M"]],perc:1,cut:3000},
warm:{bpm:92,key:60,pent:[0,2,4,7,9],prog:[[0,"M"],[5,"M"],[9,"m"],[7,"M"]],perc:2,cut:3600},
festive:{bpm:108,key:62,pent:[0,2,4,7,9],prog:[[0,"M"],[5,"M"],[9,"m"],[7,"M"]],perc:3,cut:4600}
};
/* ---------- two themes. Numbers are scale steps, -1 is a rest. 16 slots = 2 bars ---------- */
var PH={
A:[4,-1,5,-1,7,-1,5,4, 3,-1,4,-1,2,-1,-1,-1],   /* Arun's theme: lonely in minor, then the same tune in major */
S:[4,-1,-1,-1,2,-1,-1,-1, 3,-1,-1,-1,0,-1,-1,-1], /* sparse: alone */
B:[2,4,5,4,7,-1,5,4, 5,7,9,7,5,4,2,-1],          /* the family theme: brighter and busier */
AB:[4,-1,5,-1,7,-1,5,4, 5,7,9,7,5,4,2,-1]         /* both themes joined in the last scene */
};
function typing(n){var a=[],i;for(i=0;i<n;i++)a.push([.5+i*.075,"key"]);return a}
function cat(){var r=[],i,a;for(i=0;i<arguments.length;i++){a=arguments[i];if(typeof a[0]==="number")r.push(a);else r=r.concat(a)}return r.sort(function(x,y){return x[0]-y[0]})}
function seq(name,start,gap,n,arg){var a=[],i;for(i=0;i<n;i++)a.push([start+i*gap,name,arg]);return a}
/* ---------- scene scores: mood, lead instrument, theme, ambience, tanpura drone, timed sound effects ---------- */
var S={
st1:[
/* 1 Arun leaves his village: bus, a flute and a tanpura */
{mood:"calm",lead:"flute",ph:"A",amb:"bus",tan:1,fx:[[.3,"horn"],[3.1,"horn"]]},
/* 2 He knows no one: empty city, lonely piano */
{mood:"calm",lead:"piano",ph:"S",amb:"city",fx:cat(seq("step",.55,.52,5),[3.3,"ask"])},
/* 3 He asks Google: typing and a search whoosh */
{mood:"tender",lead:"piano",ph:"S",amb:null,fx:cat(typing(21),[2.35,"whoosh"],[2.45,"pop"],[2.75,"pop"],[3.05,"pop"])},
/* 4 Most places feel wrong: a low worried pulse, a thud for each problem */
{mood:"worry",lead:"piano",ph:"S",amb:"city",pulse:1,fx:cat(seq("thud",.9,.6,10),[0.35,"coin"],[1.55,"coin"])},
/* 5 He finds Stay Confident: footsteps, the same tune now in major, ticks as the list appears */
{mood:"hope",lead:"flute",ph:"A",amb:null,fx:cat(seq("step",.55,.45,5),seq("tick",2.3,.2,6),[2.2,"bell",0],[3.9,"ding"])},
/* 6 Akka sweeps and mops his room: soft shuffles, a happy ding when it sparkles */
{mood:"tender",lead:"flute",ph:"A",amb:null,fx:cat(seq("shuffle",.5,.8,5),[2.6,"ding"],[3.5,"ding"])},
/* 7 Anna brings the water can: footsteps and a soft thud at every door */
{mood:"warm",lead:"piano",ph:"A",amb:null,fx:cat(seq("step",.5,.42,9),[1.2,"thud"],[2.2,"thud"],[3.3,"thud"],[4.3,"thud"],[5.0,"ding"])},
/* 8 Midnight: the group message, phones buzzing, everyone sees it */
{mood:"worry",lead:"piano",ph:"S",amb:"night",pulse:1,fx:cat([[.3,"ring"],[1.2,"pop"],[2.0,"pop"],[2.6,"pop"],[3.2,"pop"],[4.1,"tick"],[4.5,"tick"]])},
/* 9 Roommates rush to the hospital and donate blood */
{mood:"hope",lead:"flute",ph:"A",amb:null,fx:cat(seq("step",.5,.4,7),[3.8,"door"],[4.8,"ding"],[5.6,"bell",0])},
/* 10 He calls his mother: ring, pick up, rasam in the pan */
{mood:"tender",lead:"flute",ph:"A",amb:null,tan:1,fx:[[.2,"ring"],[1.15,"ring"],[2.15,"pick"],[3.5,"sizzle"],[4.6,"ding"]]}
],
st2:[
/* 1 Five places, one family: five bells, five people */
{mood:"hope",lead:"flute",ph:"B",amb:null,tan:1,fx:[[.5,"bell",0],[1.2,"bell",4],[1.9,"bell",7],[2.6,"bell",9],[3.3,"bell",12],[4.2,"ding"]]},
/* 2 Sunday is kitchen day */
{mood:"warm",lead:"veena",ph:"B",amb:"sizzle",fx:cat(seq("chop",.4,.32,5),[2.4,"sizzle"],[3.9,"whistle"],[4.7,"spoon"])},
/* 3 Movie night */
{mood:"tender",lead:"piano",ph:"B",amb:"hum",fx:cat(seq("pop",.5,.55,2,"corn"),[2.3,"pop","corn"],[3.1,"pop","corn"],[3.7,"pop","corn"],[4.4,"cheer"])},
/* 4 Cake at midnight: gongs, then clapping */
{mood:"festive",lead:"veena",ph:"B",amb:null,fx:cat([[.2,"gong"],[1.2,"gong"],[2.2,"gong"]],seq("clap",3.2,.28,6),[4.9,"cheer"])},
/* 5 Chai at 6 AM */
{mood:"tender",lead:"flute",ph:"B",amb:"birds",tan:1,fx:[[.5,"pour"],[1.7,"spoon"],[2.0,"spoon"],[3.4,"spoon"]]},
/* 6 Late shift, dinner waiting */
{mood:"tender",lead:"piano",ph:"S",amb:"night",fx:cat(seq("step",.4,.5,3),[2.1,"spoon"],[2.5,"spoon"],[4.0,"ding"])},
/* 7 Turf play: crowd, ball, whistle, goal */
{mood:"festive",lead:"veena",ph:"B",amb:"crowd",fx:[[.5,"whistle2"],[1.1,"ball"],[1.6,"ball"],[2.1,"ball"],[2.6,"ball"],[3.2,"cheer"],[3.25,"whistle2"]]},
/* 8 Cricket on the terrace: bowler, bat, a big hit, cheers */
{mood:"festive",lead:"veena",ph:"B",amb:"crowd",fx:[[.5,"whistle2"],[1.0,"ball"],[1.55,"slap"],[2.4,"cheer"],[3.3,"cheer"]]},
/* 9 Cards till late */
{mood:"warm",lead:"piano",ph:"B",amb:null,fx:[[.3,"shuffle"],[1.7,"slap"],[2.0,"slap"],[3.3,"shuffle"],[4.5,"slap"]]},
/* 9 Late-night bike ride */
{mood:"tender",lead:"flute",ph:"A",amb:"bike",fx:[[3.9,"spoon"],[4.2,"spoon"]]},
/* 10 Midnight dinner */
{mood:"tender",lead:"piano",ph:"S",amb:"night",fx:[[.2,"gong"],[1.1,"spoon"],[1.6,"spoon"],[2.5,"spoon"],[3.2,"spoon"]]},
/* 11 Festivals: nadaswaram, tabla, crackers, temple bell */
{mood:"festive",lead:"reed",ph:"B",amb:"festival",fx:cat([[.3,"temple"],[2.6,"temple"],[4.6,"temple"]],seq("cracker",.8,.17,6),seq("cracker",3.0,.2,5))},
/* 12 When Sourav fell ill: soft, a spoon in the soup, a knock at the door */
{mood:"tender",lead:"piano",ph:"A",amb:null,fx:[[1.6,"spoon"],[2.5,"spoon"],[3.9,"knock"],[4.9,"ding"]]},
/* 13 When Chennai floods: rain, thunder, then neighbours helping */
{mood:"tender",lead:"piano",ph:"A",amb:"rain",pulse:0,fx:[[.5,"thunder"],[2.9,"knock"],[3.9,"spoon"],[4.6,"ding"],[5.2,"bell",0]]},
/* 14 Interview tomorrow: a lift, an all the best at the door */
{mood:"hope",lead:"veena",ph:"B",amb:null,fx:[[1.3,"knock"],[3.6,"door"],[4.5,"ding"]]},
/* 15 Going home for Pongal */
{mood:"tender",lead:"flute",ph:"A",amb:"bus",fx:[[.3,"horn"],[3.7,"temple"]]},
/* 16 Not roommates. Family. Both themes together */
{mood:"warm",lead:"flute",ph:"AB",amb:null,tan:1,swell:1,fx:[[.2,"swell"],[2.9,"bell",0],[3.4,"bell",4],[3.9,"bell",7],[4.4,"bell",12],[5.0,"ding"]]}
]};

var ctx=null,master,bus,lp,fxb,rvIn,nbuf,timer=null,active=null,mood=M.calm,scn=null,NS=[],step=0,nextT=0,clock=0,lastTick=0,fxi=0,fxl=[],lastScene={},bed=null,ambBus,curKey="";
function mtof(m){return 440*Math.pow(2,(m-69)/12)}
function R(a,b){return a+Math.random()*(b-a)}
function setup(){
if(ctx)return true;if(!AC)return false;
try{ctx=new AC()}catch(e){ctx=null;return false}
try{
var comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=12;comp.ratio.value=5;comp.connect(ctx.destination);
master=ctx.createGain();master.gain.value=0;master.connect(comp);
lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=1800;lp.Q.value=.4;
bus=ctx.createGain();bus.gain.value=.9;bus.connect(lp);lp.connect(master);
fxb=ctx.createGain();fxb.gain.value=.9;fxb.connect(master);
ambBus=ctx.createGain();ambBus.gain.value=1;ambBus.connect(master);
var cv=ctx.createConvolver(),len=Math.floor(ctx.sampleRate*2.2),ir=ctx.createBuffer(2,len,ctx.sampleRate),c,i,d;
for(c=0;c<2;c++){d=ir.getChannelData(c);for(i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
cv.buffer=ir;rvIn=ctx.createGain();rvIn.gain.value=1;rvIn.connect(cv);cv.connect(master);
var send=ctx.createGain();send.gain.value=.36;lp.connect(send);send.connect(rvIn);
var fs=ctx.createGain();fs.gain.value=.16;fxb.connect(fs);fs.connect(rvIn);
nbuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);var nd=nbuf.getChannelData(0);for(i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
}catch(e){try{ctx.close()}catch(x){}ctx=null;return false}
return true}

/* ---------- building blocks ---------- */
function env(g,t,a,peak,dur){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(dur,a+.02))}
function T(t,f,dur,v,type,f2,atk,dest){var o=ctx.createOscillator(),g=ctx.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);env(g,t,atk||.004,v,dur);o.connect(g);g.connect(dest||fxb);o.start(t);o.stop(t+dur+.05)}
function N(t,dur,type,f0,f1,v,atk,q,dest){var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=nbuf;s.loop=true;f.type=type;f.Q.value=q||.8;f.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)f.frequency.exponentialRampToValueAtTime(f1,t+dur);env(g,t,atk||.004,v,dur);s.connect(f);f.connect(g);g.connect(dest||fxb);s.start(t,R(0,1.5));s.stop(t+dur+.05)}
function tone(type,f,t,a,peak,dur,det){var o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;env(g,t,a,peak,dur);o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.05)}

/* ---------- lead instruments ---------- */
function flute(t,m,dur){var f=mtof(m),o=ctx.createOscillator(),o2=ctx.createOscillator(),l=ctx.createOscillator(),lg=ctx.createGain(),g=ctx.createGain(),g2=ctx.createGain();
o.type="sine";o.frequency.value=f;o2.type="triangle";o2.frequency.value=f*2;g2.gain.value=.05;l.frequency.value=5.1;lg.gain.value=f*.007;l.connect(lg);lg.connect(o.frequency);
o.connect(g);o2.connect(g2);g2.connect(g);
g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.12,t+.09);g.gain.setValueAtTime(.1,t+Math.max(.1,dur-.1));g.gain.exponentialRampToValueAtTime(.0001,t+dur+.14);
g.connect(bus);[o,o2,l].forEach(function(s){s.start(t);s.stop(t+dur+.25)});
N(t,.18,"bandpass",f*2,f*2,.03,.03,5,bus)}
function veena(t,m){var f=mtof(m),o=ctx.createOscillator(),g=ctx.createGain();o.type="triangle";o.frequency.setValueAtTime(f*.944,t);o.frequency.exponentialRampToValueAtTime(f,t+.05);env(g,t,.008,.13,1.2);o.connect(g);g.connect(bus);o.start(t);o.stop(t+1.3);tone("sine",f*2,t,.006,.04,.5)}
function piano(t,m){var f=mtof(m);tone("sine",f,t,.006,.11,1.6);tone("sine",f*2,t,.006,.035,.9);tone("sine",f*3.01,t,.004,.012,.5);N(t,.04,"bandpass",2200,2200,.012,.002,1,bus)}
function reed(t,m,dur){var f=mtof(m),l=ctx.createOscillator(),lg=ctx.createGain(),bp=ctx.createBiquadFilter(),g=ctx.createGain(),a=ctx.createOscillator(),b=ctx.createOscillator();
a.type="sawtooth";b.type="sawtooth";a.frequency.value=f;b.frequency.value=f*1.004;bp.type="bandpass";bp.frequency.value=Math.min(f*3,2600);bp.Q.value=1.3;l.frequency.value=5.5;lg.gain.value=f*.01;l.connect(lg);lg.connect(a.frequency);lg.connect(b.frequency);
a.connect(bp);b.connect(bp);bp.connect(g);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.07,t+.05);g.gain.setValueAtTime(.06,t+Math.max(.06,dur-.1));g.gain.exponentialRampToValueAtTime(.0001,t+dur+.1);g.connect(bus);[a,b,l].forEach(function(s){s.start(t);s.stop(t+dur+.2)})}
function lead(k,t,m,dur){if(k==="flute")flute(t,m,dur);else if(k==="veena")veena(t,m);else if(k==="reed")reed(t,m,dur);else piano(t,m)}
function bell(t,m){tone("sine",mtof(m),t,.01,.09,2.2);tone("sine",mtof(m+7)*1.003,t,.01,.04,1.6)}
function hit(t,hp,peak,dur){N(t,dur,"highpass",hp,hp,peak,.003,.7,bus)}
function kick(t){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(45,t+.15);env(g,t,.004,.3,.26);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.3)}
function tabla(t,f){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(f*1.5,t);o.frequency.exponentialRampToValueAtTime(f,t+.07);env(g,t,.003,.13,.16);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.2)}
function tanpura(t,m){var o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type="sawtooth";o.frequency.value=mtof(m);f.type="lowpass";f.frequency.value=800;f.Q.value=3;env(g,t,.01,.045,2.6);o.connect(f);f.connect(g);g.connect(bus);o.start(t);o.stop(t+2.7)}

/* ---------- sound effects (relative to the start of a scene) ---------- */
var FX={
horn:function(t){var k;[349,440].forEach(function(f){var o=ctx.createOscillator(),fl=ctx.createBiquadFilter(),g=ctx.createGain();o.type="sawtooth";o.frequency.value=f;fl.type="lowpass";fl.frequency.value=1100;env(g,t,.03,.05,.5);o.connect(fl);fl.connect(g);g.connect(fxb);o.start(t);o.stop(t+.6)})},
step:function(t){N(t,.09,"lowpass",900,300,.09,.004,.7);T(t,85,.12,.1,"sine",45)},
ask:function(t){T(t,392,.5,.05,"sine",440,.05);T(t+.3,330,.7,.05,"sine",311,.05)},
key:function(t){N(t,.025,"bandpass",R(2400,3600),R(2400,3600),.05,.001,2);T(t,R(900,1300),.03,.012,"square")},
whoosh:function(t){N(t,.5,"bandpass",350,4200,.09,.15,.9)},
pop:function(t,a){if(a==="corn"){var i;for(i=0;i<4;i++){var tt=t+i*R(.05,.16);N(tt,.04,"bandpass",R(1500,3200),R(800,1400),.07,.001,1.2);T(tt,R(500,900),.05,.025,"sine",200)}}else T(t,640,.09,.08,"sine",260)},
thud:function(t){T(t,95,.3,.16,"sine",42);N(t,.08,"lowpass",600,200,.07)},
coin:function(t){T(t,1760,.35,.04,"sine");T(t+.07,2637,.45,.035,"sine")},
tick:function(t){T(t,1320,.12,.045,"sine");T(t+.06,1760,.18,.035,"sine")},
bell:function(t,a){bell(t,mood.key+24+(a||0))},
ding:function(t){[784,1175,1568].forEach(function(f,i){T(t+i*.11,f,.7,.05,"sine")})},
ring:function(t){var i;for(i=0;i<2;i++){var tt=t+i*.17;T(tt,440,.14,.04,"sine");T(tt,480,.14,.04,"sine")}},
pick:function(t){N(t,.03,"bandpass",1800,1800,.08,.001,1.5);T(t,300,.05,.04,"square")},
sizzle:function(t){N(t,1.4,"highpass",4500,6500,.11,.05,.7)},
chop:function(t){N(t,.05,"bandpass",1100,700,.11,.001,1.2);T(t,170,.07,.07,"sine",90)},
whistle:function(t){var o=ctx.createOscillator(),l=ctx.createOscillator(),lg=ctx.createGain(),g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(2500,t);o.frequency.linearRampToValueAtTime(2750,t+.8);l.frequency.value=34;lg.gain.value=110;l.connect(lg);lg.connect(o.frequency);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.035,t+.06);g.gain.setValueAtTime(.035,t+.7);g.gain.exponentialRampToValueAtTime(.0001,t+.9);o.connect(g);g.connect(fxb);o.start(t);l.start(t);o.stop(t+1);l.stop(t+1);N(t,.8,"bandpass",2600,2600,.03,.05,2)},
whistle2:function(t){var o=ctx.createOscillator(),l=ctx.createOscillator(),lg=ctx.createGain(),g=ctx.createGain();o.type="sine";o.frequency.value=3000;l.frequency.value=48;lg.gain.value=260;l.connect(lg);lg.connect(o.frequency);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.045,t+.02);g.gain.setValueAtTime(.045,t+.3);g.gain.exponentialRampToValueAtTime(.0001,t+.42);o.connect(g);g.connect(fxb);o.start(t);l.start(t);o.stop(t+.5);l.stop(t+.5)},
spoon:function(t){var b=R(2900,3500);T(t,b,.28,.04,"sine");T(t,b*1.51,.18,.02,"sine")},
pour:function(t){N(t,1.2,"bandpass",1600,2400,.06,.2,1.1)},
gong:function(t){T(t,196,2.6,.09,"sine",null,.01);T(t,196*2.76,1.8,.04,"sine",null,.01);T(t,196*5.4,1,.02,"sine",null,.01)},
clap:function(t){N(t,.07,"bandpass",1500,1100,.12,.001,.9);N(t+.012,.05,"bandpass",2100,1600,.07,.001,.9)},
cheer:function(t){N(t,1.6,"bandpass",900,1300,.1,.25,.6);N(t+.1,1.4,"bandpass",1700,2200,.05,.25,.6);T(t,330,1.2,.02,"sawtooth",440,.3)},
ball:function(t){T(t,150,.14,.17,"sine",60);N(t,.05,"lowpass",900,300,.08)},
shuffle:function(t){var i;for(i=0;i<14;i++)N(t+i*.035,.03,"highpass",3500,3500,.06,.002,.7)},
slap:function(t){N(t,.05,"bandpass",2000,1000,.11,.001,1);T(t,220,.06,.06,"sine",110)},
temple:function(t){tone("sine",mtof(mood.key+31),t,.005,.09,2.6);tone("sine",mtof(mood.key+31)*2.4,t,.005,.04,1.8)},
cracker:function(t){N(t,.12,"highpass",1800,1800,.16,.001,.6);T(t,120,.1,.08,"sine",50)},
thunder:function(t){N(t,2.6,"lowpass",420,70,.22,.12,.7);T(t,55,2,.12,"sine",34,.1)},
knock:function(t){var i;for(i=0;i<3;i++){T(t+i*.16,130,.1,.12,"sine",90);N(t+i*.16,.04,"lowpass",700,400,.06)}},
door:function(t){FX.knock(t);N(t+.55,.3,"bandpass",600,300,.06,.02,1);T(t+.75,70,.3,.08,"sine",50)},
swell:function(t){var i,tt=Math.max(0,t-ctx.currentTime);[0,4,7,12].forEach(function(iv){var o=ctx.createOscillator(),g=ctx.createGain();o.type="triangle";o.frequency.value=mtof(mood.key+iv);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.035,t+2.6);g.gain.exponentialRampToValueAtTime(.0001,t+5.2);o.connect(g);g.connect(bus);o.start(t);o.stop(t+5.3)})}
};
function runFx(name,t,a){var f=FX[name];if(f){try{f(t,a)}catch(e){}}}

/* ---------- ambience (a continuous bed per scene, plus small random events) ---------- */
function ln(dest,type,f,q,v){var s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=nbuf;s.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q||.7;g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(dest);s.start(0,R(0,1.5));return{s:s,f:fl,g:g}}
function osc(dest,type,f,v,lpf){var o=ctx.createOscillator(),g=ctx.createGain(),x=g;o.type=type;o.frequency.value=f;g.gain.value=v;if(lpf){var fl=ctx.createBiquadFilter();fl.type="lowpass";fl.frequency.value=lpf;o.connect(fl);fl.connect(g)}else o.connect(g);g.connect(dest);o.start();return{o:o,g:g}}
function lfo(param,rate,depth,L){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=rate;g.gain.value=depth;o.connect(g);g.connect(param);o.start();L.push(o)}
var BED={
bus:function(d,L){var a=ln(d,"lowpass",170,.7,.4),e=osc(d,"sawtooth",46,.09,140),w=ln(d,"bandpass",1100,.6,.022);L.push(a.s,e.o,w.s);lfo(e.g.gain,9,.035,L);lfo(w.f.frequency,.2,300,L)},
city:function(d,L){var a=ln(d,"lowpass",520,.5,.07),b=ln(d,"bandpass",1500,.4,.01);L.push(a.s,b.s);lfo(a.f.frequency,.13,150,L)},
night:function(d,L){var a=ln(d,"lowpass",300,.5,.03);L.push(a.s)},
birds:function(d,L){var a=ln(d,"bandpass",2500,.4,.008);L.push(a.s)},
crowd:function(d,L){var a=ln(d,"bandpass",750,.5,.07),b=ln(d,"bandpass",2000,.5,.02);L.push(a.s,b.s);lfo(a.g.gain,.4,.03,L)},
sizzle:function(d,L){var a=ln(d,"highpass",5200,.6,.03);L.push(a.s);lfo(a.g.gain,.7,.012,L)},
hum:function(d,L){var a=osc(d,"sine",100,.05,null),b=ln(d,"bandpass",260,1,.04);L.push(a.o,b.s);lfo(a.g.gain,24,.03,L)},
bike:function(d,L){var e=osc(d,"sawtooth",64,.1,320),w=ln(d,"bandpass",900,.5,.035);L.push(e.o,w.s);lfo(e.g.gain,17,.045,L);lfo(w.f.frequency,.25,350,L)},
rain:function(d,L){var a=ln(d,"highpass",3200,.6,.045),b=ln(d,"bandpass",1400,.5,.02);L.push(a.s,b.s)},
festival:function(d,L){var a=ln(d,"bandpass",800,.5,.04);L.push(a.s)}
};
function startBed(name){
stopBed();if(!name||!BED[name])return;
var d=ctx.createGain(),L=[];d.gain.setValueAtTime(.0001,ctx.currentTime);d.gain.linearRampToValueAtTime(1,ctx.currentTime+1.2);d.connect(ambBus);
try{BED[name](d,L)}catch(e){}
bed={g:d,L:L}}
function stopBed(){if(!bed)return;var b=bed;bed=null;try{b.g.gain.cancelScheduledValues(ctx.currentTime);b.g.gain.setTargetAtTime(0,ctx.currentTime,.25)}catch(e){}
setTimeout(function(){b.L.forEach(function(s){try{s.stop()}catch(e){}});try{b.g.disconnect()}catch(e){}},1500)}
function ambStep(n,t,si){var r=Math.random();
if(n==="city"){if(si===3&&r<.09)FX.horn(t)}
else if(n==="night"){if(r<.75){var k;for(k=0;k<3;k++)T(t+k*.07,4300,.04,.014,"sine")}}
else if(n==="birds"){if(r<.35){var b=R(2600,3600);T(t,b,.08,.03,"sine",b*1.3);T(t+.11,b*1.1,.07,.025,"sine",b*1.4);if(r<.15)T(t+.22,b*1.25,.08,.02,"sine",b*.9)}}
else if(n==="rain"){if(r<.7)T(t+R(0,.2),R(1800,3000),.03,.012,"sine")}
else if(n==="sizzle"){if(r<.6)N(t,.03,"highpass",3000,3000,.05,.001,.7)}
else if(n==="festival"){if(r<.3)FX.cracker(t);if(si===4&&r<.7)FX.temple(t)}
else if(n==="crowd"){if(r<.12)N(t,.7,"bandpass",1100,1500,.05,.1,.6)}
}

/* ---------- the score ---------- */
function chordOf(b){var c=mood.prog[b%4],r=c[0]>7?c[0]-12:c[0],iv=c[1]==="m"?[0,3,7]:[0,4,7];return{r:r,n:iv.map(function(i){return mood.key+r+i})}}
function notes(){var a=[],o;for(o=0;o<2;o++)mood.pent.forEach(function(i){a.push(mood.key+12+o*12+i)});return a}
function play(st,t,sd){
var si=st%8,bar=Math.floor(st/8),ch=chordOf(bar),per=mood.perc,P=PH[scn.ph];
if(si===0){ch.n.forEach(function(m,k){var f=mtof(m);tone("triangle",f,t,.7,.026,sd*8,k*4-4);tone("sine",f,t,.7,.026,sd*8,0)});tone("sine",mtof(mood.key+ch.r-24),t,.02,.12,sd*3.5)}
if(scn.tan){if(si===0)tanpura(t,mood.key-17);else if(si===2||si===4)tanpura(t,mood.key-12);else if(si===6)tanpura(t,mood.key-24)}
if(scn.pulse&&(si===0||si===4))FX.thud(t);
if(P){var n=P[st%16];if(n>=0){var len=1;while(P[(st+len)%16]<0&&len<6)len++;lead(scn.lead,t,NS[n],sd*len*.95)}}
if(per>=1)hit(t,6500,si%2?.018:.03,.05);
if(per>=2&&(si===0||si===4))kick(t);
if(per>=3){if(si===2||si===5)tabla(t,230);if(si===3||si===6)tabla(t,330)}
ambStep(scn.amb,t,si)}
function tick(){
if(!ctx||!active||!scn)return;
var now=ctx.currentTime;clock+=Math.max(0,now-lastTick);lastTick=now;
while(nextT<now+.25){var sd=60/mood.bpm/2;play(step,nextT,sd);nextT+=sd;step++}
while(fxi<fxl.length&&fxl[fxi][0]<=clock+.25){var f=fxl[fxi++];runFx(f[1],now+Math.max(0,f[0]-clock),f[2])}}
function go(){if(!ctx)return;if(ctx.resume){try{var p=ctx.resume();if(p&&p.catch)p.catch(function(){})}catch(e){}}
if(timer)return;nextT=ctx.currentTime+.08;lastTick=ctx.currentTime;master.gain.setTargetAtTime(.6,ctx.currentTime,.35);timer=setInterval(tick,40)}
function halt(){if(timer){clearInterval(timer);timer=null}if(ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.2)}
function scene(col,i,fresh){
var list=S[col.id]||[],sc=list[i]||list[list.length-1];if(!sc)return;
var key=col.id+":"+i;
if(!fresh&&key===curKey&&scn)return;
curKey=key;scn=sc;mood=M[sc.mood]||M.warm;NS=notes();
step=0;clock=0;fxi=0;fxl=sc.fx||[];
if(ctx){lp.frequency.setTargetAtTime(mood.cut,ctx.currentTime,.6);nextT=ctx.currentTime+.08;lastTick=ctx.currentTime;startBed(sc.amb)}}
function sync(){
if(!active||!ctx){halt();return}
var s=lastScene[active.id]||{scene:0,playing:false};
if(s.playing&&!document.hidden)go();else halt()}
function setBtn(col,on){var b=col._mu;b.classList.toggle("on",on);b.classList.remove("hint");b.setAttribute("aria-pressed",on?"true":"false");b.setAttribute("aria-label",on?"Turn soundtrack off":"Turn soundtrack on");b.title=on?"Soundtrack on":"Play soundtrack";b.firstElementChild.innerHTML=on?ICON.on:ICON.off;var l=b.querySelector("span");if(l)l.textContent=on?"Sound on":"Sound off"}
var userOff=false,auto=false;
function turnOn(col,isAuto){auto=!!isAuto;
if(!setup())return false;
cols.forEach(function(c){if(c._mu)setBtn(c,false)});
active=col;setBtn(col,true);
var s=lastScene[col.id]||{scene:0,playing:false};
scene(col,s.scene,true);sync();return true}
function turnOff(col){active=null;setBtn(col,false);stopBed();curKey="";sync()}
function userGesture(){return !navigator.userActivation||navigator.userActivation.hasBeenActive}
cols.forEach(function(col){
var ctl=col.querySelector(".ctl"),pp=col.querySelector(".pp");if(!ctl||!pp)return;
var b=document.createElement("button");b.type="button";b.className="mu"+(rm?"":" hint");b.setAttribute("aria-pressed","false");b.setAttribute("aria-label","Turn soundtrack on");b.title="Play soundtrack";
b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+ICON.off+'</svg><span>Sound off</span>';pp.after(b);col._mu=b;
if(!AC){b.hidden=true;return}
b.addEventListener("click",function(){
if(active===col){userOff=true;turnOff(col);return}
userOff=false;turnOn(col,false)});
col.addEventListener("stplay",function(e){
var d=e.detail;lastScene[col.id]=d;
if(active===col){
if(!d.playing&&auto){var o=cols.filter(function(c){return c!==col&&c._mu&&(lastScene[c.id]||{}).playing})[0];if(o){try{turnOn(o,true)}catch(x){}return}}
scene(col,d.scene,!!d.fresh);sync()}
else if(!userOff&&d.playing&&AC&&userGesture()&&(!active||!(lastScene[active.id]||{}).playing)){try{turnOn(col,true)}catch(x){}}})});
root.addEventListener("pointerup",function(e){
var col=e.target.closest&&e.target.closest(".stcol");
if(ctx&&ctx.state!=="running"&&ctx.resume){try{ctx.resume().catch(function(){})}catch(x){}}
if(!active&&!userOff&&col&&col._mu&&!e.target.closest(".mu")&&AC){var s=lastScene[col.id];if(s&&s.playing)turnOn(col,true)}},true);
document.addEventListener("visibilitychange",sync);
})();

;
/* ===== SCAI v1 (additive): Stay Confident AI assistant, reply engine + UI. Self-contained, no external requests. ===== */
(function(){
var B=(function(){
var NAME="Simha",WA="919884444587",PHONE="+91 98844 44587";
var NAMES=["Vintage","Classic","Cosmos","Oxo","Hi5","Rooftop","Elite","C9","GreenDen","InnerPeace","O2","GreenTop","VelHeaven","AVM\u2019sPride","Flames","Titans","Phoenix","Bodhi"];
var A3=["Ashok Nagar","Jafferkhanpet","Ekkatuthangal"],AN=["Ashok Nagar"];
var D={
"Vintage":{b:2,r:[4900,7900],f:"GF",rm:"1N 2N",ar:A3,st:"I",fr:1,pk:"C",wm:1},
"Classic":{b:2,r:[4900,8500],rm:"2A",ar:A3,st:"G",fr:1,pk:"C",wm:1},
"Cosmos":{b:2,r:[4900,9500],f:"FF",rm:"2A 1N 3N",ar:A3,st:"G",fr:1,pk:"C",wm:1},
"Oxo":{b:2,r:[4900,12500],f:"SF",rm:"1N 3N",ar:A3,st:"I",fr:1,pk:"C",wm:1},
"Hi5":{b:2,r:[4900,7500],f:"SF",rm:"3A 2N",ar:A3,st:"I",fr:1,pk:"C",wm:1},
"Rooftop":{b:2,r:[7900,11500],f:"TF",rm:"3A",ar:A3,st:"I",fr:1,pk:"C",wm:1},
"Elite":{b:2,r:[4900,8500],f:"GF",rm:"2A 3A 2N",ar:AN,st:"G",fr:1,pk:"C",wm:1},
"C9":{b:2,r:[21000,38000],f:"GF",rm:"1A 2A",ar:AN,st:"G",fr:1,pk:"C",wm:1},
"GreenDen":{b:2,r:[4500,6500],f:"GF",rm:"2N",ar:A3,st:"I",fr:1,pk:"F",wm:1},
"InnerPeace":{b:2,r:[4500,6500],f:"GF",rm:"2N",ar:A3,st:"I",fr:0,pk:"F",wm:1},
"O2":{b:2,r:[4900,8500],f:"GF",rm:"3A 3N",ar:AN,st:"G",fr:1,pk:"B",wm:1},
"GreenTop":{b:3,r:[8900,28500],f:"FF",rm:"3A",ar:AN,st:"I",fr:1,pk:"B",wm:1},
"VelHeaven":{b:2,r:[7900,10500],f:"GF",rm:"2A 3A",ar:["Chennai Central"],st:"I",fr:1,pk:"C",wm:1},
"AVM\u2019sPride":{b:2,r:[4900,8500],f:"GF",rm:"2A 3A 2N",ar:["MGR Nagar","Ramapuram"],st:"I",fr:1},
"Flames":{b:2,r:[4900,8500],f:"FF",rm:"2A 3N",ar:AN,st:"I",fr:1,pk:"C",wm:1},
"Titans":{b:2,r:[4900,14500],f:"FF",rm:"1A 2A 2N",ar:AN,st:"I",fr:1,pk:"F",wm:1},
"Phoenix":{b:3,r:[6500,8500],f:"FF",rm:"3A",ar:AN,st:"I",fr:1,pk:"F",wm:1}
};
var FL={GF:"ground",FF:"first",SF:"second",TF:"top"};
var SHN={1:"Single",2:"Double",3:"Triple"};
var AREAS=["Ashok Nagar","Jafferkhanpet","Ekkatuthangal","Chennai Central","MGR Nagar","Ramapuram"];

function money(n){return "\u20B9"+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,",")}
function norm(s){
 s=String(s||"").toLowerCase().replace(/[\u2018\u2019\u2032`]/g,"'");
 s=s.replace(/(\d),(\d{3})/g,"$1$2").replace(/(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/g,function(m,n){return String(Math.round(parseFloat(n)*1000))});
 s=s.replace(/a\s*\/\s*c/g,"ac").replace(/non[\s-]*ac\b/g,"nonac").replace(/\b(?:rs|inr)\.?\s*(?=\d)/g," ").replace(/\u20b9/g," ");
 s=s.replace(/'/g,"").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();
 return s}
function lev(a,b){var m=a.length,n=b.length,i,j,c,d=[];if(Math.abs(m-n)>2)return 9;
 for(i=0;i<=m;i++)d[i]=[i];for(j=1;j<=n;j++)d[0][j]=j;
 for(i=1;i<=m;i++)for(j=1;j<=n;j++){c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)}
 return d[m][n]}
function near(t,w){if(t===w||t===w+"s"||t+"s"===w)return 2;var L=w.length;if(L<5||t.length<4)return 0;return lev(t,w)<=(L>=8?2:1)?1:0}
function sc(tk,pad,kws,mul){var s=0;kws.forEach(function(k){
 if(k.indexOf(" ")>-1){if(pad.indexOf(" "+k+" ")>-1)s+=4*mul;return}
 var best=0;tk.forEach(function(t){var r=near(t,k);if(r>best)best=r});s+=best*1.5*mul});return s}

var INT={
greet:{k:["hi","hello","hey","hii","hai","vanakkam","namaste","good morning","good evening","good afternoon","\u0BB5\u0BA3\u0B95\u0BCD\u0B95\u0BAE\u0BCD"]},
thanks:{k:["thanks","thank","thankyou","thank you","nandri","tq","great","super","awesome","perfect"]},
bye:{k:["bye","goodbye","see you","later"]},
who:{k:["who are you","what are you","are you ai","are you human","are you a bot","are you real","your name","bot","chatgpt","simha","genie","what is your name","whats your name"]},
price:{k:["rent","price","cost","charge","fee","rate","tariff","budget","how much","cheap","cheapest","affordable","expensive","per month","evlo","evvalavu","evalo","kasu","\u0BB5\u0BBE\u0B9F\u0B95\u0BC8","\u0B8E\u0BB5\u0BCD\u0BB5\u0BB3\u0BB5\u0BC1","\u0BB5\u0BBF\u0BB2\u0BC8"]},
deposit:{k:["deposit","advance","caution","refundable","security deposit","notice period","notice","agreement","lock in","lockin","terms"]},
avail:{k:["available","availability","vacancy","vacancies","vacant","book","booking","reserve","any room","room available","bed available","join","move in","moving in","admission","empty","got room","have room","free room"]},
daily:{k:["daily","day stay","one day","short stay","short term","shortterm","tonight","weekend","interview","business trip","vacation","medical visit","family visit","few days","per day","per night","night stay","entire 2bhk","entire home","master bedroom","single occupancy","hotel","lodge","tomorrow"]},
monthly:{k:["monthly","long term","longterm","sharing","share","single sharing","double sharing","triple sharing","shared"],w:["mens","womens","gents","ladies","boys","girls","men","women"]},
homes:{k:["homes","houses","units","which home","all homes","properties","show homes","options","recommend","suggest","best home","which one","find","search","list","branches"],w:["home","room","rooms","pg"]},
facilities:{k:["facilities","facility","amenities","amenity","included","include","provided","fridge","refrigerator","ro water","geyser","water heater","hot water","housekeeping","what do i get","whats included","furniture","cupboard","mattress","induction","stove","bathroom","bathrooms","toilet","western","indian"]},
kitchen:{k:["kitchen","cook","cooking","self cooking","selfcooking","utensils","mess","meals","meal","food","tiffin","breakfast","lunch","dinner","veg","nonveg","non veg","restaurant","restaurants","canteen","home food","sapadu","saapadu"]},
laundry:{k:["laundry","washing machine","washing","wash","clothes","iron","ironing","dhobi"]},
parking:{k:["parking","park","bike","car","vehicle","scooter","two wheeler","twowheeler","bicycle"]},
wifi:{k:["wifi","wi fi","internet","broadband","fibre","fiber","network","work from home","wfh","speed"]},
power:{k:["water","power","current","power cut","powercut","inverter","generator","backup","tank","sump","shortage","electricity","eb","load shedding"]},
safety:{k:["safe","safety","secure","security","cctv","gate","warden","caretaker","late night","theft","women safety","lock"]},
rules:{k:["rules","rule","curfew","visitors","visitor","guests","guest","timing","timings","smoking","alcohol","drinking","pets","gate time","policy","allowed","house rules","restrictions"]},
checkin:{k:["checkin","check in","arrived","arrival","self check in","id","documents","document","kyc","guest form","registration","aadhaar","aadhar"]},
location:{k:["location","address","where","map","maps","direction","directions","route","reach","landmark","nearby","near","how to reach","enga","eppadi","pari nagar","cholan","find us","pincode","pin code","google maps","how far","\u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF"]},
contact:{k:["call","phone","number","whatsapp","contact","talk","speak","human","owner","manager","person","reach you","mobile","customer care","agent","executive","staff","talk to someone","someone"]},
about:{k:["about us","about you","about stay confident","story","why us","decade","years","experience","hostel","different","difference","not a hostel","unique","special","trust","reviews","review","rating","why stay confident"]},
problems:{k:["complaint","complaints","repair","repairs","fix","issue","problem","problems","maintenance","pest","cleaning","clean","cleanliness","dirty"]},
photos:{k:["photo","photos","pictures","picture","pics","images","video","see rooms","room photos","gallery","film","see the home"]},
enquire:{k:["enquire","enquiry","inquiry","apply","fill form","send details","callback","call back","contact me","register interest","interested"]},
compare:{k:["compare","comparison","versus","vs","difference between","which is better","better"]}
};

function homeKey(n){return n.toLowerCase().replace(/[^a-z0-9]/g,"")}
var HK={};NAMES.forEach(function(n){HK[homeKey(n)]=n});
var SPACED={greenden:["green den"],innerpeace:["inner peace"],greentop:["green top"],velheaven:["vel heaven"],avmspride:["avms pride","avm pride","avm"],hi5:["hi 5","hi five"]};
function findHomes(raw,tk){
 var out=[],pos={},pad=" "+norm(raw)+" ",flat=norm(raw).replace(/ /g,"");
 NAMES.forEach(function(n){var k=homeKey(n),hit=false,al=SPACED[k]||[];
  if(k.length<=3){hit=tk.indexOf(k)>-1||al.some(function(a){return pad.indexOf(" "+a+" ")>-1})}
  else{hit=flat.indexOf(k)>-1||al.some(function(a){return pad.indexOf(" "+a+" ")>-1});
   if(!hit&&k.length>=5&&NAMES.indexOf(n)>-1){tk.forEach(function(t){if(t.length>=5&&lev(t,k)<=1)hit=true})}}
  if(hit&&out.indexOf(n)<0){out.push(n);var p=flat.indexOf(k);if(p<0){al.forEach(function(a){var q=pad.indexOf(" "+a+" ");if(q>-1&&(p<0||q<p))p=q})}if(p<0)tk.forEach(function(t,i){if(lev(t,k)<=1&&p<0)p=i*6});pos[n]=p<0?999:p}});
 out.sort(function(a,b){return pos[a]-pos[b]});
 // "classic" etc are plain words: keep, but ignore generic uses like "best home"
 return out}

var OTHER=["guindy","t nagar","tnagar","saidapet","velachery","adyar","anna nagar","porur","vadapalani","kk nagar","kodambakkam","omr","tambaram","nungambakkam","mylapore","chromepet","perungudi","sholinganallur","thoraipakkam","egmore","koyambedu","ashok pillar","nandanam","teynampet","alwarpet","kilpauk","perambur","avadi","ambattur","medavakkam","pallavaram","thiruvanmiyur","besant nagar"];
function ents(raw,tk){
 var pad=" "+norm(raw)+" ",e={};
 e.homes=findHomes(raw,tk);
 var m,nums=[];norm(raw).replace(/\b(\d{4,6})\b/g,function(x,n){nums.push(+n);return x});
 if(nums.length&&(/ (under|below|within|upto|up to|max|maximum|budget|around|less than|rent|price|cost|afford|affordable|lakh|only|my|rupees|rupee|rs|inr|month|monthly|pm|per month|range|limit) /.test(pad)||/^\d{4,6}$/.test(norm(raw)))){var mx=Math.max.apply(null,nums);if(mx>=1000&&mx<=60000)e.budget=mx}
 if(nums.length&&/ (above|over|more than|greater than|higher than|beyond|exceed|exceeding|atleast|at least|minimum|premium|luxury|costlier|expensive) /.test(pad)){var mn=Math.min.apply(null,nums);if(mn>=1000&&mn<=60000){e.minb=mn;delete e.budget}}
 if(/ (single|1) (sharing|share|occupancy|bed|person)/.test(pad)||/ (alone|private) /.test(pad)||/ single /.test(pad))e.share=1;
 if(/ (double|twin|2|two) (sharing|share|bed|person|people)/.test(pad)||/ double /.test(pad)||/ twin /.test(pad))e.share=2;
 if(/ (triple|3|three) (sharing|share|bed|person|people)/.test(pad)||/ triple /.test(pad))e.share=3;
 if(/ nonac /.test(pad)||/ (without|no) ac /.test(pad)||/ fan room /.test(pad))e.ac="non";
 else if(/ ac /.test(pad)||/ air condition(ed|ing|er)? /.test(pad)||/ aircon /.test(pad))e.ac="ac";
 if(/ (women|womens|woman|girls|girl|ladies|lady|female) /.test(pad))e.gender="women";
 else if(/ (men|mens|man|boys|boy|gents|guys|male) /.test(pad))e.gender="men";
 AREAS.forEach(function(a){var f=a.toLowerCase();if(pad.indexOf(" "+f+" ")>-1||norm(raw).replace(/ /g,"").indexOf(f.replace(/ /g,""))>-1)e.area=a});
 if(/ jafferkhan ?pet /.test(pad))e.area="Jafferkhanpet";
 OTHER.forEach(function(a){if(!e.area&&pad.indexOf(" "+a+" ")>-1)e.other=a});
 if(/ (daily|day stay|one day|short stay|short term|tonight|weekend|per day|per night|few days) /.test(pad))e.daily=1;
 if(/ (any|reset|start over|clear|new search) /.test(pad)&&/ (reset|start over|clear|new search) /.test(pad))e.reset=1;
 return e}

function roomsOf(x){var o=[];x.rm.split(" ").forEach(function(t){o.push({n:+t.charAt(0),a:t.charAt(1)==="A"})});return o}
function roomLabel(r){return SHN[r.n]+" sharing "+(r.a?"A/C":"Non-A/C")}
/* ROOM RENT TABLE: add exact monthly rent per room type here, e.g. "Oxo":{"1N":12500,"3N":4900}  (A = A/C, N = Non-A/C; number = sharing).
   Homes listed here are filtered room by room. Homes not listed fall back to their lowest rent. */
var RR={};
function rkey(r){return r.n+(r.a?"A":"N")}
function rentOf(n,r){var t=RR[n];return(t&&t[rkey(r)]!=null)?+t[rkey(r)]:null}
function hasRR(n){var t=RR[n];return !!t&&Object.keys(t).length>0}
function matchRooms(n,c){var x=D[n];if(!x)return [];
 return roomsOf(x).filter(function(r){
  if(c.share&&r.n!==c.share)return false;
  if(c.ac&&(c.ac==="ac"?!r.a:r.a))return false;
  if(c.minb){var q=rentOf(n,r);if(q!=null){if(q<=c.minb)return false}else if(hasRR(n))return false;else if(x.r[1]<=c.minb)return false}
  if(c.budget){var p=rentOf(n,r);if(p!=null){if(p>c.budget)return false}else if(hasRR(n))return false;else if(x.r[0]>c.budget)return false}
  return true})}
function fits(n,c){var x=D[n];if(!x)return false;
 if(c.area&&x.ar.indexOf(c.area)<0)return false;
 return matchRooms(n,c).length>0}
function range(x){return money(x.r[0])+" \u2013 "+money(x.r[1])}
function stoveOf(x){return x.st==="G"?"gas stove":"induction stove"}
function parkOf(x){return x.pk==="C"?"free street parking with CCTV":x.pk==="B"?"free street parking, paid bike parking":x.pk==="F"?"free street parking":null}
function wa(text){return "https://wa.me/"+WA+"?text="+encodeURIComponent(text)}
function summary(c){
 var p=[];if(c.home)p.push("Home: "+c.home);
 if(c.daily)p.push("Looking for: daily stay");else if(c.gender)p.push("Looking for: "+c.gender+"'s home, monthly stay");
 if(c.share)p.push("Sharing: "+SHN[c.share].toLowerCase());
 if(c.ac)p.push(c.ac==="ac"?"A/C room":"Non-A/C room");
 if(c.budget)p.push("Budget: up to "+money(c.budget)+" per month");if(c.minb)p.push("Budget: above "+money(c.minb)+" per month");
 if(c.area)p.push("Area: "+c.area);
 return "Hi, I would like to know about Stay Confident PG Homes."+(p.length?" "+p.join(". ")+".":"")}
function waBtn(c,l){return {l:l||"Ask on WhatsApp",href:wa(summary(c)),cls:"wa"}}

var T=function(s){return {p:s}};
function chips(a){return {chips:a.map(function(x){return typeof x==="string"?{l:x}:x})}}
function card(n,c){c=(c&&typeof c==="object")?c:{};var x=D[n];
 if(!x)return{name:n,price:"Ask on WhatsApp",tags:["Details on request"]};
 var rooms=(c.budget||c.minb||c.share||c.ac)?matchRooms(n,c):roomsOf(x);
 var lines=rooms.filter(function(r){return rentOf(n,r)!=null}).sort(function(p,q){return rentOf(n,p)-rentOf(n,q)}).map(function(r){return{l:roomLabel(r),p:money(rentOf(n,r))}});
 var price=lines.length?"From "+lines[0].p:(c.budget?"Starts "+money(x.r[0]):range(x));
 var hasA=rooms.some(function(r){return r.a}),hasN=rooms.some(function(r){return!r.a});
 var tags=(c.budget?["Fits "+money(c.budget)]:c.minb?["Above "+money(c.minb)]:[x.b+" BHK"]).concat(hasA&&hasN?["A/C + Non-A/C"]:[hasA?"A/C":"Non-A/C"]).concat(x.ar.slice(0,2));
 return{name:n,price:price,tags:tags,lines:lines,btn:(c.budget||c.minb)?"View rooms":"Details"}}

function homeDetail(n,c){
 var x=D[n];if(!x)return [T("**"+n+"** is one of our 18 Stay Confident homes. I do not have its room and rent details here, so the quickest way is to ask the team. They reply on WhatsApp with rent and availability."),{btns:[waBtn(c)]}];
 var rooms=roomsOf(x).sort(function(p,q){return(q.a-p.a)||(p.n-q.n)}).map(roomLabel).join(", ");
 var s="**"+n+"** is a "+x.b+" BHK home"+(x.f?" on the "+FL[x.f]+" floor":"")+", near "+x.ar.join(", ")+". Rooms: "+rooms+". Rent range: "+range(x)+" per month, depending on the room you pick.";
 var k="Kitchen: "+stoveOf(x)+", "+(x.fr?"fridge, ":"")+"kettle and RO drinking water.";
 var ex=[];if(parkOf(x))ex.push("Parking: "+parkOf(x));if(x.wm)ex.push("Laundry: washing machine and iron station");
 return [T(s),T(k+(ex.length?" "+ex.join(". ")+".":"")),{btns:[{l:"Open full details",fn:"open",arg:n},waBtn(c)]},chips([{l:"Photos of "+n,q:"photos of "+n},{l:"Compare homes",q:"compare "+n+" with another home"}])]}

function find(c){
 var list=NAMES.filter(function(n){return D[n]&&fits(n,c)}).sort(function(a,b){return D[a].r[0]-D[b].r[0]});
 var desc=[];if(c.budget)desc.push("rooms at or under "+money(c.budget));if(c.minb)desc.push("rooms above "+money(c.minb));if(c.share)desc.push(SHN[c.share].toLowerCase()+" sharing");if(c.ac)desc.push(c.ac==="ac"?"A/C":"Non-A/C");if(c.area)desc.push("near "+c.area);
 var out=[];
 if(!list.length){
  var cheap=NAMES.filter(function(n){return D[n]}).sort(function(a,b){return D[a].r[0]-D[b].r[0]}).slice(0,3);
  out.push(T("I could not find a home that matches all of that ("+desc.join(", ")+"). Our lowest-priced rooms start at "+money(4500)+" per month. Here are the closest starting points, and the team can also tell you about rooms that just opened up."));
  out.push({cards:cheap.map(function(n){return card(n)})});out.push({btns:[waBtn(c,"Ask the team on WhatsApp")]});return out}
 out.push(T((desc.length?"Here are "+list.length+" home"+(list.length>1?"s":"")+" with "+desc.join(", ")+":":"All 18 homes are in Chennai. Here are the ones I have details for:")));
 out.push({cards:list.map(function(n){return card(n,c)})});
 out.push(T(c.minb?"Only rooms above "+money(c.minb)+" are shown, cheapest first. Tap **View rooms** on any home to open its rooms and facilities. The exact rent for each room type and what is free right now is confirmed on WhatsApp.":c.budget?"Only rooms at or under "+money(c.budget)+" are shown, cheapest first. Tap **View rooms** on any home to open its rooms and facilities. The exact rent for each room type and what is free right now is confirmed on WhatsApp.":"Rent shown is each home\u2019s range. Tap **Details** on any home to see its rooms. The exact rent for your room type and what is free right now is confirmed on WhatsApp."));
 out.push(chips(["Only A/C rooms","Only Non-A/C rooms","Double sharing"].concat((c.budget||c.minb)?["Under \u20B95,000","Under \u20B96,000","Under \u20B97,000","Under \u20B98,000","Under \u20B910,000","Above \u20B910,000"].filter(function(x){return x!==(c.minb?"Above ":"Under ")+"\u20B9"+String(c.minb||c.budget).replace(/\B(?=(\d{3})+(?!\d))/g,",")}):["Under \u20B96,000","Above \u20B910,000"]).concat([{l:"Clear filters",q:"reset filters"}])));
 out.push({btns:[waBtn(c)]});return out}

function priceGeneral(c){
 return [T("Rent depends on the home, the room type and how many share. Across our homes, most rooms fall between about "+money(4500)+" and "+money(14500)+" per month. A few larger A/C homes cost more, for example GreenTop and C9."),
 T("Tell me a budget, sharing type or area and I will narrow it down. For exact rent and what is free today, the team replies on WhatsApp."),
 chips(["Under \u20B95,000","Under \u20B96,000","Under \u20B97,000","Under \u20B98,000","Under \u20B910,000","Above \u20B910,000","A/C rooms"]),{btns:[waBtn(c)]}]}

function compare(a,b){
 function row(n){var x=D[n];if(!x)return "**"+n+"**: details on WhatsApp.";
  return "**"+n+"**: "+range(x)+" per month, "+x.b+" BHK"+(x.f?", "+FL[x.f]+" floor":"")+". Rooms: "+roomsOf(x).map(roomLabel).join(", ")+". Near "+x.ar.join(", ")+". "+stoveOf(x).replace(/^./,function(m){return m.toUpperCase()})+(parkOf(x)?", "+parkOf(x):"")+"."}
 return [T(row(a)),T(row(b)),T("In every home: self-cooking kitchen, refrigerator, RO drinking water, washing machine and housekeeping support.")]}



function reply(raw,ctx){
 var tk=norm(raw).split(" ").filter(Boolean),pad=" "+tk.join(" ")+" ";
 var e=ents(raw,tk),c=ctx;c.turn=(c.turn||0)+1;
 if(e.reset){["home","share","ac","budget","minb","gender","area","daily"].forEach(function(k){delete c[k]});return {blocks:[T("Done, I have cleared your filters. What would you like to know?"),chips(["Rent and budget","Daily stay","Find a home","Facilities"])]}}
 var scores={},top="",best=0,second=0;
 Object.keys(INT).forEach(function(id){var d=INT[id],s=sc(tk,pad,d.k,1)+(d.w?sc(tk,pad,d.w,.5):0);scores[id]=s;});
 Object.keys(scores).forEach(function(id){if(scores[id]>best){second=best;best=scores[id];top=id}else if(scores[id]>second)second=scores[id]});
 // update context from this message
 var isDaily=(top==="daily"||(e.daily&&top===""));
 if(e.homes.length){c.home=e.homes[0];c.homeTurn=c.turn}
 if(!isDaily)["share","ac","budget","gender","area"].forEach(function(k){if(e[k]!=null)c[k]=e[k]});if(e.minb!=null){c.minb=e.minb;delete c.budget}else if(e.budget!=null)delete c.minb;
 if(isDaily)c.daily=1;else if(top==="monthly"||top==="homes"||top==="avail"&&false||e.share||e.ac||e.budget||e.minb||e.area)delete c.daily;
 var hasFilter=e.budget||e.minb||e.share||e.ac||e.area;
 var cur=e.homes.length?e.homes[0]:null; // home named in THIS message
 var home=cur||((top==="price"||top==="facilities"||top==="kitchen"||top==="laundry"||top==="parking"||top==="photos"||top==="avail")&&c.home&&c.turn-(c.homeTurn||-9)<=2&&!hasFilter&&!e.gender&&!/ (cheap|cheapest|lowest|low|minimum|least|all|every|any) /.test(pad)?c.home:null);
 if(best<2&&!cur&&!hasFilter&&!e.gender&&!e.daily)top="";
 // strong filter wording beats a weak intent
 if(e.other&&!e.homes.length&&!e.area&&(top===""||top==="location"||top==="homes"||top==="avail"||top==="price"||top==="monthly"||top==="__find"))top="__other";
 if(!e.homes.length&&hasFilter&&top!=="__other"&&(top===""||top==="monthly"||top==="homes"||top==="price"||top==="avail"||top==="facilities"||top==="about"))top="__find";
 if(!e.homes.length&&!hasFilter&&top==="price"&&/ (cheap|cheapest|lowest|minimum|least|affordable) /.test(pad))top="__cheap";
 if(e.homes.length>=2&&(top==="compare"||/ vs | versus | compare /.test(pad)))top="compare";
 else if(cur&&(top===""||top==="homes"||top==="monthly"||top==="compare"||top==="about"||top==="avail"&&false))top="__home";
 if((top==="__find"||top==="homes")&&!e.homes.length)delete c.home;
 var out=[];
 switch(top){
 case "greet":out=[T("Vanakkam! Your wish is my command. I am **"+NAME+"**, the Stay Confident genie. Tell me what you need: homes, rent, daily stays, facilities, check-in or directions."),chips(["Rent and budget","Find a home","Daily stay","Facilities","Check-in","Location"])];break;
 case "thanks":out=[T("You are welcome! Anything else you would like to know?"),chips(["Find a home","Ask on WhatsApp"])];break;
 case "bye":out=[T("Take care! Whenever you are ready, we are one message away on WhatsApp."),{btns:[waBtn(c)]}];break;
 case "who":out=[T("I am **"+NAME+"**, the lion genie of Stay Confident. Simha means lion. I answer from the details on this site, so I am not a person. For anything I cannot see, like today\u2019s vacancies, the team on WhatsApp has the answer."),{btns:[waBtn(c,"Talk to the team")]}];break;
 case "price":
  if(home&&D[home]){out=[T("**"+home+"** rent range: **"+range(D[home])+"** per month. Which room you choose decides where in the range you land. Exact rent and availability are confirmed on WhatsApp."),{btns:[{l:"Open "+home,fn:"open",arg:home},waBtn(c)]}]}
  else if(hasFilter||c.budget||c.minb||c.share||c.ac||c.area){out=find(c)}
  else if(c.daily||e.daily){out=[T("Daily stay rates depend on the room and the number of nights, and are not listed on the site. The team shares the rate on WhatsApp."),{btns:[waBtn(c,"Ask daily rate")]}]}
  else out=priceGeneral(c);break;
 case "deposit":out=[T("Deposit, notice period and rent terms are written clearly in the agreement, and the team explains them before you commit. The exact amounts depend on the home and room, so please confirm them on WhatsApp."),{btns:[waBtn(c)]}];break;
 case "avail":
  out=[T("I cannot see live vacancies from here. The team replies on WhatsApp with what is free and the rent, usually the fastest way. I can pre-fill your message with what you told me."),{btns:[waBtn(c,"Check availability on WhatsApp"),{l:"Use enquiry form",fn:"form"}]}];break;
 case "daily":
  out=[T("Daily stays suit business trips, medical visits, interviews, family visits, vacations and any short-term stay. Options:"),T("\u2022 Single Occupancy A/C Room, a quiet room to yourself\n\u2022 Private A/C Master Bedroom, extra space and privacy\n\u2022 Entire 2BHK Home, the whole place for families"),T("Rates depend on the room and nights, so ask the team for today\u2019s price."),{btns:[waBtn(Object.assign({},c,{daily:1}),"Ask daily rate"),{l:"See daily stays",fn:"go",arg:"stays"}]}];break;
 case "monthly":
  out=[T("For monthly stays we have **men\u2019s shared homes** and **women\u2019s shared homes**, each with single, double and triple sharing, in A/C and Non-A/C options. Every home has a self-cooking kitchen, refrigerator, RO water, washing machine and housekeeping."),T("Tell me sharing type, A/C or Non-A/C, budget or area and I will shortlist homes."),chips(["Double sharing","A/C rooms","Under \u20B96,000","Near Ashok Nagar"])];break;
 case "homes":case "__find":
  out=(hasFilter||c.share||c.ac||c.budget||c.minb||c.area)?find(c):[T("We have **18 homes** in Chennai, around Ashok Nagar, Jafferkhanpet, Ekkatuthangal, Chennai Central, MGR Nagar and Ramapuram. What matters most to you?"),chips(["Under \u20B95,000","A/C rooms","Double sharing","Near Ashok Nagar","Show all homes"]),{btns:[{l:"Browse all homes",fn:"go",arg:"homes"}]}];
  if(/ (all|show all|every) /.test(pad)&&!hasFilter){out=[T("Here are the homes I have details for, cheapest first:"),{cards:NAMES.filter(function(n){return D[n]}).sort(function(a,b){return D[a].r[0]-D[b].r[0]}).map(function(n){return card(n)})},{btns:[{l:"Browse all homes",fn:"go",arg:"homes"}]}]}
  break;
 case "__other":out=[T("I do not see a Stay Confident home listed in **"+e.other.replace(/\b\w/g,function(m){return m.toUpperCase()})+"**. Our homes are around Ashok Nagar, Jafferkhanpet, Ekkatuthangal, Chennai Central, MGR Nagar and Ramapuram. The team can tell you which home is nearest to where you need to be."),chips(["Near Ashok Nagar","Show all homes"]),{btns:[waBtn(c,"Ask the team")]}];break;
 case "__home":out=homeDetail(cur,c);break;
 case "__cheap":out=[T("Our lowest-priced rooms start at **"+money(4500)+"** per month, in GreenDen and InnerPeace (double sharing, Non-A/C). Next come homes starting at "+money(4900)+"."),{cards:["GreenDen","InnerPeace","Vintage"].map(function(n){return card(n)})},T("Exact rent for your room type and today\u2019s availability is confirmed on WhatsApp."),{btns:[waBtn(c)]}];break;
 case "compare":
  if(e.homes.length>=2)out=compare(e.homes[0],e.homes[1]);
  else out=[T("Tell me two homes to compare, for example \u201CPhoenix vs Flames\u201D."),chips(["Phoenix vs Flames","Titans vs Elite"])];break;
 case "facilities":
  if(home&&D[home]&&/ (fridge|refrigerator) /.test(pad)&&D[home].fr===0)out=[T("**"+home+"** does not list a fridge in its kitchen. Please confirm with the team on WhatsApp, as things can change."),{btns:[{l:"Open "+home,fn:"open",arg:home},waBtn(c)]}];
  else if(home&&D[home])out=homeDetail(home,c);
  else out=[T("In every Stay Confident home: **self-cooking kitchen, refrigerator, RO drinking water, washing machine and housekeeping support**. Kitchens have an induction or gas stove and a kettle, and homes have Indian and Western bathrooms with water heaters."),chips(["Parking","Laundry","Wi-Fi","Kitchen"])];break;
 case "kitchen":
  out=[T("We do not serve fixed mess meals. You get a **self-cooking kitchen**: shop what you like, cook it your way, eat at your own time, and wipe down for the next person. Your menu, your time, your budget."),T("Prefer not to cook? Home food arrangements are available as an option, and there are restaurants and food outlets nearby."),{btns:[{l:"See the kitchen",fn:"go",arg:"kitchen"}]}];break;
 case "laundry":
  out=[T("Homes have a semi-automatic top-load washing machine and an iron station. Housekeeping support is included too. Ask on WhatsApp if a specific home has it."),chips(["Facilities","Parking"])];break;
 case "parking":
  if(home&&D[home]){var p=parkOf(D[home]);out=[T(p?"**"+home+"**: "+p+".":"Parking for **"+home+"** is best confirmed on WhatsApp."),{btns:[waBtn(c)]}]}
  else out=[T("Parking is on the street near each home, free of charge. Many homes have CCTV covering it, and a few offer paid bike parking. Tell me a home name for its exact parking."),chips(["Phoenix parking","O2 parking"])];break;
 case "wifi":
  out=[T("From our help section: fibre broadband with Wi-Fi on each floor and a backup link, with a simple rule against heavy downloads at peak hours. If you work from home, mention it on WhatsApp so the team can suggest a suitable home."),{btns:[waBtn(c)]}];break;
 case "power":
  out=[T("Water and power are planned for: overhead tanks plus a sump with a timed pump schedule, inverter or generator backup for lights, fans and Wi-Fi, and tank cleaning every quarter."),{btns:[waBtn(c)]}];break;
 case "safety":
  out=[T("Safety setup listed in our help section: CCTV on entrances and corridors, a locked main gate after a set hour, a visitor register, and a warden or caretaker on call, with emergency numbers shared on every floor. Our caretakers know every resident by name."),{btns:[waBtn(c)]}];break;
 case "rules":
  out=[T("We keep house rules simple and explain them kindly at check-in, with a written rule sheet. Rent, notice and deposit terms are clear in the agreement. For specific timings or visitor policy, please confirm with the team on WhatsApp."),{btns:[waBtn(c)]}];break;
 case "checkin":
  out=[T("Guest check-in is mandatory for every guest. Keep your photo ID handy, fill in your guest details on the quick self check-in form, and submit. That is all."),{btns:[{l:"Start check-in",fn:"ci"}]}];break;
 case "location":
  out=[T("**Stay Confident PG Homes**\nNew No: 8, T154, Cholan St, Pari Nagar, West Jafferkhanpet, Chennai, Tamil Nadu 600083."),T("Our homes are around Ashok Nagar, Jafferkhanpet, Ekkatuthangal, Chennai Central, MGR Nagar and Ramapuram."),{btns:[{l:"Open map",fn:"map"},{l:"Get directions",href:"https://www.google.com/maps/dir/?api=1&destination=13.0271934,80.2093516"}]}];break;
 case "contact":
  out=[T("You can reach the team directly. They reply on WhatsApp with availability and rent."),{btns:[waBtn(c,"WhatsApp")]}];break;
 case "about":
  out=[T("Stay Confident has helped people find simple, budget-friendly shared homes in Chennai for **over 10 years**. We run **18 homes** like a home, not a hostel: a caretaker who knows you by name, a self-cooking kitchen, simple house rules, quick answers on one number, and small celebrations together."),{btns:[{l:"Why Stay Confident",fn:"go",arg:"why"}]}];break;
 case "problems":
  out=[T("Complaints go to one WhatsApp number with a 48-hour fix promise. Homes follow a daily cleaning checklist, weekly bathroom deep clean, monthly pest control and sealed bins on each floor."),{btns:[waBtn(c,"Message the team")]}];break;
 case "photos":
  if(home&&D[home])out=[T("Open **"+home+"** and tap \u201CView photos\u201D to watch its photo film."),{btns:[{l:"Open "+home,fn:"open",arg:home}]}];
  else out=[T("Every home has a photo film. Pick a home and tap \u201CView photos\u201D in its details."),{btns:[{l:"Browse homes",fn:"go",arg:"homes"}]}];break;
 case "enquire":
  out=[T("I will take you to the enquiry form and fill in what you told me. Nothing is sent until you tap Send on WhatsApp."),{btns:[{l:"Open enquiry form",fn:"form"},waBtn(c,"Skip the form, WhatsApp")]}];break;
 default:
  if(e.gender||e.daily){out=top==="" && e.daily?[T("Daily stays: Single Occupancy A/C Room, Private A/C Master Bedroom or Entire 2BHK Home."),{btns:[waBtn(Object.assign({},c,{daily:1}),"Ask daily rate")]}]:[T("We have "+(e.gender?e.gender+"\u2019s":"")+" shared homes with single, double and triple sharing in A/C and Non-A/C. Share a budget or sharing type and I will shortlist homes."),chips(["Double sharing","Under \u20B96,000","A/C rooms"])]}
  else out=[T("That one is beyond my lamp. I can grant wishes about homes and rent, daily stays, facilities, check-in and directions. For anything else, the team on WhatsApp is the quickest."),chips(["Rent and budget","Find a home","Daily stay","Facilities","Location"]),{btns:[waBtn(c,"Ask the team")]}]}
 return {blocks:out,intent:top}}

function welcome(){return [T("Vanakkam! Your wish is my command. I am **"+NAME+"**, the lion genie of Stay Confident. Tell me the kind of home you wish for, and I will find it."),chips(["Rent and budget","Find a home","Daily stay","Facilities","Check-in","Location"])]}
return {name:NAME,reply:reply,welcome:welcome,norm:norm,ents:ents,D:D,NAMES:NAMES,summary:summary,wa:wa};
})();

/* ===== SCAI v1 (additive): UI ===== */
(function(){
var d=document,r=d.documentElement,fab,panel,log,inp,ctx={},booted=false,busy=false,logoSrc="";
function el(t,c,x){var e=d.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function rich(p,s){String(s).split("**").forEach(function(t,i){if(!t)return;if(i%2){p.appendChild(el("b",null,t))}else p.appendChild(d.createTextNode(t))})}
var IC={
 min:'<path d="M6 9l6 6 6-6"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 ref:'<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
 send:'<path d="M5 12h14M13 6l6 6-6 6"/>'};
function ic(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+IC[k]+'</svg>'}
function btn(c,k,label,a){var b=el("button",c);b.type="button";b.setAttribute("aria-label",label);b.title=label;if(a)b.setAttribute("data-a",a);b.innerHTML=ic(k);return b}

function setPad(){var h=panel?panel.offsetHeight:0;r.style.setProperty("--scai-pad",h+"px")}
function setState(open,min){
 r.classList.toggle("scai-open",open);r.classList.toggle("scai-min",!!(open&&min));
 if(panel)panel.setAttribute("aria-hidden",open?"false":"true");
 fab.setAttribute("aria-expanded",open?"true":"false");
 requestAnimationFrame(setPad)}
function isOpen(){return r.classList.contains("scai-open")}
function isMin(){return r.classList.contains("scai-min")}
function build(){
 if(panel)return;
 panel=el("section","scai");panel.id="scai";panel.setAttribute("role","dialog");panel.setAttribute("aria-label",B.name+", Stay Confident AI assistant");panel.setAttribute("aria-modal","false");
 var h=el("div","scai-h"),av=el("span","scai-av"),im=el("img");im.alt="";im.src=logoSrc;av.appendChild(im);
 var t=el("div","scai-t");t.appendChild(el("b",null,B.name));var sm=el("small");sm.appendChild(el("i"));sm.appendChild(d.createTextNode("Stay Confident genie \u00B7 online"));t.appendChild(sm);
 h.appendChild(av);h.appendChild(t);
 h.appendChild(btn("scai-ib","ref","New chat","new"));h.appendChild(btn("scai-ib","min","Minimise","min"));h.appendChild(btn("scai-ib","x","Close","close"));
 log=el("div","scai-log");log.setAttribute("role","log");log.setAttribute("aria-live","polite");log.tabIndex=0;
 var f=el("form","scai-f");f.setAttribute("autocomplete","off");f.noValidate=true;
 inp=el("input");inp.type="text";inp.placeholder="Ask about rent, homes, stays\u2026";inp.maxLength=200;inp.setAttribute("aria-label","Type your question");inp.enterKeyHint="send";
 var sd=btn("scai-send","send","Send");sd.type="submit";
 f.appendChild(inp);f.appendChild(sd);
 var nt=el("p","scai-note","Answers come from this website. Rent and vacancies are confirmed on WhatsApp.");
 panel.appendChild(h);panel.appendChild(log);panel.appendChild(f);panel.appendChild(nt);
 d.body.appendChild(panel);
 h.addEventListener("click",function(e){var b=e.target.closest("button");
  if(!b){if(isMin())setState(true,false);return}
  var a=b.getAttribute("data-a");
  if(a==="close")closeIt();else if(a==="min")setState(true,!isMin());else if(a==="new")reset()});
 f.addEventListener("submit",function(e){e.preventDefault();var v=inp.value.trim();if(!v||busy)return;inp.value="";ask(v)});
 log.addEventListener("click",function(e){
  var c=e.target.closest(".scai-chip");if(c&&!c.disabled){ask(c.getAttribute("data-q")||c.textContent,c.textContent);return}
  var cd=e.target.closest(".scai-card");if(cd&&!e.target.closest("[data-fn]")){var dt=cd.querySelector("[data-fn]");if(dt){act(dt.getAttribute("data-fn"),dt.getAttribute("data-arg"));return}}
  var b=e.target.closest("[data-fn]");if(b){e.preventDefault();act(b.getAttribute("data-fn"),b.getAttribute("data-arg"))}});
 panel.addEventListener("keydown",function(e){if(e.key==="Escape"){e.stopPropagation();closeIt()}});
 d.addEventListener("pointerdown",function(e){if(!isOpen())return;var t=e.target;if(!t||!t.closest)return;if(t.closest("#scai")||t.closest("#scai-fab")||t.closest("dialog"))return;setState(false,false)},true);
 if("ResizeObserver" in window)new ResizeObserver(function(){if(isOpen())setPad()}).observe(panel);
 if(window.visualViewport){var vv=window.visualViewport,upd=function(){var k=0;if(d.activeElement===inp)k=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);r.style.setProperty("--scai-kb",k+"px")};vv.addEventListener("resize",upd);vv.addEventListener("scroll",upd);inp.addEventListener("blur",function(){r.style.setProperty("--scai-kb","0px")})}
}
function scrollEnd(){log.scrollTop=log.scrollHeight}
function msg(cls,text){var m=el("div","scai-m "+cls);rich(m,text);log.appendChild(m);scrollEnd();return m}
function typing(){var t=el("div","scai-typ");t.setAttribute("aria-label","Assistant is typing");t.appendChild(el("i"));t.appendChild(el("i"));t.appendChild(el("i"));log.appendChild(t);scrollEnd();return t}
function mkBtn(b){
 var a;
 if(b.href){a=el("a","scai-b"+(b.cls==="wa"?" wa":(b.cls===undefined&&/^tel:|directions/.test(b.href)?" gh":"")),b.l);a.href=b.href;if(/^https?:/.test(b.href)){a.target="_blank";a.rel="noopener"}}
 else{a=el("button","scai-b"+(b.l.indexOf("form")>-1||b.l.indexOf("Browse")>-1||b.l.indexOf("See")>-1||b.l.indexOf("Why")>-1?" gh":""),b.l);a.type="button";a.setAttribute("data-fn",b.fn);if(b.arg)a.setAttribute("data-arg",b.arg)}
 return a}
function block(b){
 if(b.p){return msg("bot",b.p)}
 var w;
 if(b.chips){w=el("div","scai-chips");b.chips.forEach(function(c){var x=el("button","scai-chip",c.l);x.type="button";x.setAttribute("data-q",c.q||c.l);w.appendChild(x)})}
 else if(b.cards){w=el("div","scai-cards");b.cards.forEach(function(c){var k=el("div","scai-card"),i=el("div","scai-ci");i.appendChild(el("b",null,c.name));i.appendChild(el("span",null,c.price));(c.lines||[]).forEach(function(q){i.appendChild(el("em",null,q.l+" \u00B7 "+q.p))});i.appendChild(el("small",null,c.tags.join(" \u00B7 ")));k.appendChild(i);var o=el("button","scai-dt",c.btn||"Details");o.type="button";o.setAttribute("data-fn","open");o.setAttribute("data-arg",c.name);o.setAttribute("aria-label","Open details for "+c.name);k.appendChild(o);w.appendChild(k)})}
 else if(b.btns){w=el("div","scai-bs");b.btns.forEach(function(x){w.appendChild(mkBtn(x))})}
 if(w){log.appendChild(w);scrollEnd()}return w}
function lock(){Array.prototype.forEach.call(log.querySelectorAll(".scai-chip"),function(c){c.disabled=true})}
function play(blocks,i,done){
 if(i>=blocks.length){busy=false;if(done)done();return}
 try{block(blocks[i])}catch(e){}
 setTimeout(function(){play(blocks,i+1,done)},blocks[i].p?260:120)}
function ask(text,label){
 if(busy)return;busy=true;lock();msg("me",label||text);clearTimeout(ask.w);ask.w=setTimeout(function(){busy=false},9000);
 var t=typing(),res;
 try{res=B.reply(text,ctx)}catch(e){res={blocks:[{p:"Sorry, something went wrong on my side. Please try again, or message the team on WhatsApp."},{btns:[{l:"WhatsApp",href:B.wa(B.summary(ctx)),cls:"wa"}]}]}}
 var len=res.blocks.reduce(function(n,b){return n+(b.p?b.p.length:20)},0),wait=Math.min(380+len*3,1100);
 if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)wait=120;
 setTimeout(function(){t.remove();play(res.blocks,0)},wait)}
function hero(){var g=el("div","scai-hero"),i=el("img");i.alt="Simha, a golden lion genie rising from a magic lamp";i.src=logoSrc;g.appendChild(i);var k;for(k=0;k<9;k++){var sp=el("i","scai-spk");sp.style.setProperty("--x",(22+Math.random()*56).toFixed(0)+"%");sp.style.setProperty("--s",(3+Math.random()*4).toFixed(1)+"px");sp.style.setProperty("--d",(0.25+Math.random()*1.1).toFixed(2)+"s");sp.style.setProperty("--dx",((Math.random()-.5)*60).toFixed(0)+"px");g.appendChild(sp)}log.appendChild(g)}
function start(){log.textContent="";ctx={};busy=true;hero();var t=typing();setTimeout(function(){t.remove();play(B.welcome(),0)},450)}
function reset(){busy=false;start()}
/* actions that reuse what the page already has */
function go(id){
 setState(true,true);
 var a=d.createElement("a");a.href="#"+id;a.style.display="none";d.body.appendChild(a);a.click();a.remove()}
function openHome(n){
 var lis=d.querySelectorAll("#ug li"),i,hit=null,k=String(n).replace(/\s+/g,"").toLowerCase();
 for(i=0;i<lis.length;i++){var nm=(lis[i].getAttribute("data-u")||lis[i].textContent).replace(/\s+/g,"").toLowerCase();if(nm===k||nm.slice(-k.length)===k){hit=lis[i];break}}
 go("homes");
 if(hit)setTimeout(function(){try{hit.click()}catch(e){}},420)}
function setSel(id,v){var s=d.getElementById(id);if(!s)return;var i,ok=false;for(i=0;i<s.options.length;i++){if(s.options[i].value===v||s.options[i].text===v){s.selectedIndex=i;ok=true;break}}if(ok){s.dispatchEvent(new Event("change",{bubbles:true}));s.dispatchEvent(new Event("input",{bubbles:true}))}}
function fillForm(){
 setSel("enq-type",ctx.daily?"daily":(ctx.gender||"men"));
 if(!ctx.daily){if(ctx.share)setSel("enq-share",String(ctx.share));if(ctx.ac)setSel("enq-ac",ctx.ac==="ac"?"ac":"non")}
 var n=d.getElementById("enq-notes");if(n&&ctx.budget&&!n.value)n.value="Budget: up to \u20B9"+String(ctx.budget).replace(/\B(?=(\d{3})+(?!\d))/g,",")+" per month";else if(n&&ctx.minb&&!n.value)n.value="Budget: above \u20B9"+String(ctx.minb).replace(/\B(?=(\d{3})+(?!\d))/g,",")+" per month";
 go("enquire")}
function act(fn,arg){
 if(fn==="open")openHome(arg);
 else if(fn==="go")go(arg);
 else if(fn==="form")fillForm();
 else if(fn==="map"){var m=d.getElementById("openmap");if(m)m.click();else go("find")}
 else if(fn==="ci"){var c=d.querySelector("[data-ci]");if(c)c.click()}}
function openIt(){
 build();
 if(!booted){booted=true;start()}
 setState(true,false);
 if(window.matchMedia&&matchMedia("(pointer:fine)").matches)setTimeout(function(){inp.focus({preventScroll:true})},60)}
function closeIt(){setState(false,false);try{fab.focus({preventScroll:true})}catch(e){}}
function init(){
 logoSrc="images/logo.jpg";
 fab=el("button","scai-fab");fab.type="button";fab.id="scai-fab";fab.setAttribute("aria-label","Open "+B.name+", the Stay Confident AI genie");fab.setAttribute("aria-controls","scai");fab.setAttribute("aria-expanded","false");
 if(logoSrc){var im=el("img");im.alt="";im.src=logoSrc;fab.appendChild(im)}
 fab.appendChild(el("b",null,"AI"));["s1","s2","s3"].forEach(function(k){fab.appendChild(el("i","scai-st "+k))});
 var seen=false;try{seen=sessionStorage.getItem("scai-tip")==="1"}catch(e){}
 if(!seen){var tp=el("span","scai-tip","Rub the lamp");tp.setAttribute("aria-hidden","true");fab.appendChild(tp);var hide=function(){tp.remove();window.removeEventListener("scroll",hide);try{sessionStorage.setItem("scai-tip","1")}catch(e){}};setTimeout(hide,7500);window.addEventListener("scroll",hide,{passive:true,once:true});fab.addEventListener("click",hide)}
 fab.addEventListener("click",openIt);
 d.body.appendChild(fab)}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init);else init();
})();

})();

;
/* ===== HCR v1 (additive): scroll story + optional soundtrack ===== */
(function(){
"use strict";
var d=document,w=window,sec=d.getElementById("hidden-challenges"),sol=d.getElementById("hc-sol");
if(!sec||!sol)return;
var r=d.documentElement,rm=w.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function each(l,f){Array.prototype.forEach.call(l,f)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
/* ---- scroll reveal (shows everything if IntersectionObserver is missing) ---- */
var els=sec.querySelectorAll(".hc-r,.hc-art-ws");
if("IntersectionObserver" in w&&!rm){
r.classList.add("hc-js");
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){var e=x.target;e.classList.add("hc-in");io.unobserve(e);setTimeout(function(){e.classList.remove("hc-r")},1500)}})},{threshold:.12,rootMargin:"0px 0px -6% 0px"});
each(els,function(e){io.observe(e)});
}else{each(els,function(e){e.classList.add("hc-in")})}
/* ---- soundtrack: synthesised in the browser (no files, no downloads) ---- */
var AC=w.AudioContext||w.webkitAudioContext,ctx=null,on=true,unlocked=false,inSec=false,s=0,master,dark,bright,revIn,delayIn,noiseBuf,timer=null,nextT=0,step=0,idle=null,EIGHTH=60/92/2;
var btn=d.getElementById("hc-mt"),lab=d.getElementById("hc-mtl"),now=d.getElementById("hc-now");
function mtof(n){return 440*Math.pow(2,(n-69)/12)}
function build(){
ctx=new AC();ctx.onstatechange=function(){check();ui()};
var comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;
master=ctx.createGain();master.gain.value=0;master.connect(comp);comp.connect(ctx.destination);
dark=ctx.createGain();dark.gain.value=0;dark.connect(master);
bright=ctx.createGain();bright.gain.value=0;bright.connect(master);
var len=Math.floor(ctx.sampleRate*2.8),ir=ctx.createBuffer(2,len,ctx.sampleRate),c,i,a;
for(c=0;c<2;c++){a=ir.getChannelData(c);for(i=0;i<len;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.5)}
var cv=ctx.createConvolver();cv.buffer=ir;var wet=ctx.createGain();wet.gain.value=.5;revIn=ctx.createGain();revIn.connect(cv);cv.connect(wet);wet.connect(master);
dark.connect(revIn);bright.connect(revIn);
var dl=ctx.createDelay(1);dl.delayTime.value=EIGHTH*1.5;var fb=ctx.createGain();fb.gain.value=.34;var dlp=ctx.createBiquadFilter();dlp.type="lowpass";dlp.frequency.value=2800;
delayIn=ctx.createGain();delayIn.connect(dl);dl.connect(dlp);dlp.connect(fb);fb.connect(dl);dlp.connect(bright);
var nl=ctx.sampleRate,nb=ctx.createBuffer(1,nl,ctx.sampleRate),nd=nb.getChannelData(0);for(i=0;i<nl;i++)nd[i]=Math.random()*2-1;noiseBuf=nb;
/* iOS / Safari unlock */
try{var u=ctx.createBufferSource();u.buffer=ctx.createBuffer(1,1,22050);u.connect(ctx.destination);u.start(0)}catch(e){}
/* dark layer: A minor drone + pad, always running */
var lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=260;lp.Q.value=.7;var g=ctx.createGain();g.gain.value=.5;lp.connect(g);g.connect(dark);
[[55,"sawtooth",.15],[55.5,"sawtooth",.15],[82.4,"sine",.26],[110,"sine",.22]].forEach(function(v){var o=ctx.createOscillator();o.type=v[1];o.frequency.value=v[0];var og=ctx.createGain();og.gain.value=v[2];o.connect(og);og.connect(lp);o.start()});
var l=ctx.createOscillator();l.frequency.value=.07;var lg=ctx.createGain();lg.gain.value=110;l.connect(lg);lg.connect(lp.frequency);l.start();
var pl=ctx.createBiquadFilter();pl.type="lowpass";pl.frequency.value=700;var pg=ctx.createGain();pg.gain.value=.2;pl.connect(pg);pg.connect(dark);
[164.81,220,261.63,329.63].forEach(function(f,k){var o=ctx.createOscillator();o.type="triangle";o.frequency.value=f;o.detune.value=(k-1.5)*6;var og=ctx.createGain();og.gain.value=.2;o.connect(og);og.connect(pl);o.start();var t=ctx.createOscillator();t.frequency.value=.04+k*.013;var tg=ctx.createGain();tg.gain.value=.12;t.connect(tg);tg.connect(og.gain);t.start()});
}
function env(g,t,a,pk,dec){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec)}
function hit(t){var o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(68,t);o.frequency.exponentialRampToValueAtTime(36,t+1.2);o.connect(g);g.connect(dark);env(g,t,.03,.55,1.9);o.start(t);o.stop(t+2.2)}
function shimmer(t){var o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=880;o.connect(g);g.connect(dark);env(g,t,2.2,.05,2.6);o.start(t);o.stop(t+5.2)}
var CH=[[48,55,60,64,67,72,76],[43,55,59,62,67,71,74],[45,57,60,64,69,72,76],[41,53,57,60,65,69,72]],AP=[2,3,4,3,5,4,3,4];
function pad(t,ch,dur){var f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=1300;var g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.2,t+1.4);g.gain.linearRampToValueAtTime(0,t+dur+1.2);f.connect(g);g.connect(bright);
[ch[1],ch[2],ch[3],ch[4]].forEach(function(n,k){var o=ctx.createOscillator();o.type=k%2?"triangle":"sine";o.frequency.value=mtof(n);o.detune.value=(k-1.5)*5;o.connect(f);o.start(t);o.stop(t+dur+1.4)})}
function pluck(t,n){var o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain();o.type="triangle";o2.type="sine";o.frequency.value=mtof(n);o2.frequency.value=mtof(n+12);var g2=ctx.createGain();g2.gain.value=.25;o.connect(g);o2.connect(g2);g2.connect(g);g.connect(bright);g.connect(delayIn);env(g,t,.012,.13,.55);o.start(t);o2.start(t);o.stop(t+.7);o2.stop(t+.7)}
function bass(t,n){var o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=mtof(n);o.connect(g);g.connect(bright);env(g,t,.02,.26,1.3);o.start(t);o.stop(t+1.4)}
function hat(t){var n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();n.buffer=noiseBuf;f.type="highpass";f.frequency.value=7000;n.connect(f);f.connect(g);g.connect(bright);env(g,t,.003,.03,.07);n.start(t);n.stop(t+.12)}
function tick(){
if(!ctx||!on)return;
var cs=Math.cos(s*Math.PI/2),sn=Math.sin(s*Math.PI/2);
while(nextT<ctx.currentTime+.7){
var t=nextT,k=step%8,bar=Math.floor(step/8)%4,ch=CH[bar];
if(sn>.03){
if(k===0){pad(t,ch,EIGHTH*8-.2);bass(t,ch[0])}
if(k===4)bass(t,ch[0]+(bar===1?5:7));
pluck(t,ch[AP[k]]);
if(k%2===1)hat(t)}
if(cs>.05){if(step%32===0)hit(t);if(step%64===30)shimmer(t)}
nextT+=EIGHTH;step++}
}
function apply(){
if(!ctx)return;
var t=ctx.currentTime,act=on&&inSec;
master.gain.setTargetAtTime(act?.85:0,t,act?.7:.3);
dark.gain.setTargetAtTime(act?Math.cos(s*Math.PI/2)*.9:0,t,1.1);
bright.gain.setTargetAtTime(act?Math.sin(s*Math.PI/2)*1.05:0,t,1.1);
clearTimeout(idle);
if(act){if(ctx.state!=="running")ctx.resume();startSched()}
else{idle=setTimeout(function(){if(!(on&&inSec)){stopSched();if(ctx.state==="running")ctx.suspend()}},on?2600:1400)}
}
function startSched(){if(timer||!ctx)return;nextT=Math.max(nextT,ctx.currentTime+.08);timer=setInterval(tick,140)}
function stopSched(){clearInterval(timer);timer=null}
function ui(){
var txt=on?"Music On":"Music Off";
if(btn){btn.setAttribute("aria-pressed",on?"true":"false");btn.setAttribute("aria-label",on?"Background music on. Press to turn off":"Background music off. Press to turn on");if(lab)lab.textContent=txt}
if(now)now.textContent=!on?"Music is off · press the button to turn it on":(!unlocked?"Music starts automatically with your first tap or touch":(!inSec?"Music on · plays while you read this section":(s<.5?"Now playing: serious cinematic ambience":"Now playing: uplifting, inspiring score")))
}
function toggle(){
if(!AC){if(now)now.textContent="Sound is not supported on this browser.";return}
if(!on){
try{if(!ctx)build();ctx.resume();on=true;nextT=0;measure(true)}catch(e){on=false;if(now)now.textContent="Sound could not start on this device.";return}
}else{on=false}
apply();ui()
}
function measure(force){
var rc=sec.getBoundingClientRect(),vh=w.innerHeight||600,vis=rc.height>0&&rc.bottom>vh*.25&&rc.top<vh*.75,ns=0;
if(sol.offsetParent!==null&&rc.height>0){var sr=sol.getBoundingClientRect();ns=clamp((vh*.82-sr.top)/(vh*.46),0,1)}
sec.style.setProperty("--p",ns.toFixed(3));
if(force||vis!==inSec||Math.abs(ns-s)>.015){inSec=vis;s=ns;if(on)apply();ui()}
}
var raf=0;function onScroll(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;measure(false)})}
/* ---- automatic start: browsers only allow sound after a first tap/touch/key, so we start on that first gesture ---- */
var GEST=["pointerdown","touchend","mousedown","keydown","click"];
function check(){
if(unlocked||!ctx||ctx.state!=="running")return;
unlocked=true;
GEST.forEach(function(n){d.removeEventListener(n,unlock,true)});
apply();ui()
}
function unlock(){
if(unlocked||!on||!AC)return;
try{
if(!ctx)build();
nextT=0;measure(true);
var p=ctx.resume();
if(p&&p.then)p.then(check,function(){});else check();
apply();ui()
}catch(e){try{if(ctx&&ctx.close)ctx.close()}catch(_){}ctx=null}
}
GEST.forEach(function(n){d.addEventListener(n,unlock,true)});
btn.addEventListener("click",toggle);
w.addEventListener("scroll",onScroll,{passive:true});w.addEventListener("resize",onScroll);w.addEventListener("orientationchange",onScroll);
d.addEventListener("click",function(e){if(e.target.closest&&e.target.closest("[data-go],.tabbar"))setTimeout(onScroll,60)});
d.addEventListener("visibilitychange",function(){if(!ctx)return;if(d.hidden){if(ctx.state==="running")ctx.suspend()}else if(on&&inSec){ctx.resume()}});
w.addEventListener("pagehide",function(){if(ctx&&ctx.state==="running")ctx.suspend()});
setInterval(function(){if(!d.hidden)onScroll()},1500);
measure(true);ui();
try{if(navigator.getAutoplayPolicy&&navigator.getAutoplayPolicy("audiocontext")==="allowed")unlock()}catch(e){}
})();

/* ===== end HCR v1 script ===== */

;
(function(){var t=0,f=null;function away(){f=f||document.getElementById("scai-fab");if(!f)return;f.classList.add("away");clearTimeout(t);t=setTimeout(function(){f.classList.remove("away")},1300)}window.addEventListener("scroll",away,{passive:true})})();

;
(function(){
if(!("IntersectionObserver" in window))return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("offscr",!e.isIntersecting)})},{rootMargin:"150px 0px"});
Array.prototype.forEach.call(document.querySelectorAll("main section, main section > *, main section > * > *"),function(e){io.observe(e)})
})();

;
/* "Explore Our PG Homes": always open the Homes tab and land on the homes list */
(function(){
var a=document.querySelector(".hc-b2");if(!a)return;
a.addEventListener("click",function(e){
e.preventDefault();e.stopPropagation();
var h=document.getElementById("homes");if(!h)return;
if(document.documentElement.classList.contains("tabs-on")){var b=document.querySelector('.tabbar button[data-go="homes"]');if(b){b.click();return}}
h.scrollIntoView({behavior:"smooth",block:"start"})
})
})();

;
/* Guided flow: Home > Why us > Stays > Homes > Check-in, plus phone Back button steps through tabs */
(function(){
var d=document,r=d.documentElement,bar=d.getElementById("tabbar");if(!bar)return;
function tb(t){return bar.querySelector('button[data-go="'+t+'"]')}
d.addEventListener("click",function(e){
var b=e.target.closest&&e.target.closest("[data-next]");if(!b)return;
e.preventDefault();var t=tb(b.getAttribute("data-next"));if(t)t.click()});
var cur=r.getAttribute("data-page")||"home";
try{history.replaceState({sc:cur},"")}catch(x){}
function seen(){var p=r.getAttribute("data-page");if(!p||p===cur)return;cur=p;try{history.pushState({sc:p},"")}catch(x){}}
if(window.MutationObserver)new MutationObserver(seen).observe(r,{attributes:true,attributeFilter:["data-page"]});
window.addEventListener("popstate",function(e){
var t=e.state&&e.state.sc;if(!t||!r.classList.contains("tabs-on"))return;
var sh=d.querySelector("dialog[open]");if(sh&&sh.close)sh.close();
cur=t;var b=tb(t);if(b)b.click()});
})();

;
(function(){
var d=document,W="https://wa.me/919884444587?text=",$=function(i){return d.getElementById(i)},m=$("matcher");if(!m)return;
var S={dur:"month",who:"men",sh:"2",ac:"any",room:"single"};
var sh={1:"Single",2:"Double",3:"Triple"};
var AC={any:"A/C or Non-A/C",ac:"A/C",non:"Non-A/C"};
var DR={single:["Single Occupancy A/C Room","A quiet room to yourself, fully air-conditioned.","A/C"],master:["Private A/C Master Bedroom","Extra space and privacy for longer short stays.","A/C"],bhk:["Entire 2BHK Home","The whole place to yourselves, ideal for families.","Whole home"]};
var FAC=["Self-cooking shared kitchen","A caretaker who knows you by name","Simple house rules","Quick answers on one number","Small celebrations together"];
function msg(){return S.dur==="day"?"Hi, I would like a daily stay at Stay Confident PG Homes: "+DR[S.room][0]+". Please share availability and price.":"Hi, I am looking for a monthly stay at Stay Confident PG Homes: "+(S.who==="women"?"women":"men")+"\u2019s home, "+sh[S.sh]+" sharing, "+AC[S.ac]+". Please share available homes and price."}
function render(){
 var day=S.dur==="day";
 m.querySelector('[data-for="month"]').hidden=day;m.querySelector('[data-for="day"]').hidden=!day;
 [].forEach.call(m.querySelectorAll("[data-q]"),function(b){b.setAttribute("aria-pressed",S[b.dataset.q]===b.dataset.v?"true":"false")});
 var t,x,p;
 if(day){var r=DR[S.room];t=r[0];x=r[1];p=["Daily stay",r[2],"Business, medical, family visits"]}
 else{t=(S.who==="women"?"Women\u2019s":"Men\u2019s")+" shared home, "+sh[S.sh]+" sharing";x="Monthly stay, "+AC[S.ac]+". A/C and Non-A/C options are available, so we will match your preference.";p=FAC.slice()}
 $("mt-t").textContent=t;$("mt-d").textContent=x;var u=$("mt-p");u.textContent="";p.forEach(function(v){var l=d.createElement("li");l.textContent=v;u.appendChild(l)});
 $("mt-wa").href=W+encodeURIComponent(msg())}
m.addEventListener("click",function(e){var b=e.target.closest("[data-q]");if(!b)return;S[b.dataset.q]=b.dataset.v;render()});
function go(id){var l=d.createElement("a");l.href="#"+id;d.body.appendChild(l);l.click();l.remove()}
function setv(id,v){var e=$(id);if(e){e.value=v;e.dispatchEvent(new Event("change",{bubbles:true}))}}
function prefill(type,o){setv("enq-type",type);o=o||{};if(o.share)setv("enq-share",o.share);if(o.ac)setv("enq-ac",o.ac);if(o.room)setv("enq-room",o.room)}
$("mt-form").addEventListener("click",function(){
 if(S.dur==="day")prefill("daily",{room:S.room});else prefill(S.who,{share:S.sh,ac:S.ac});go("enquire")});
$("mt-share").addEventListener("click",function(){
 var n=$("mt-note"),data={title:"Stay Confident PG Homes, Chennai",text:"Stay Confident PG Homes, Chennai",url:location.href.split("#")[0]};
 if(navigator.share){navigator.share(data).catch(function(){})}
 else if(navigator.clipboard){navigator.clipboard.writeText(data.url).then(function(){n.textContent="Link copied."},function(){n.textContent=data.url})}
 else n.textContent=data.url});
/* hero preference chips */
d.addEventListener("click",function(e){var c=e.target.closest&&e.target.closest(".pf[data-pre]");if(!c)return;var k=c.dataset.pre;
 if(k==="men"||k==="women"){S.dur="month";S.who=k}else if(k==="monthly"){S.dur="month"}else if(k==="daily"){S.dur="day"}
 render();go("matcher")});
render();
})();

;
(function(){
var d=document,$=function(i){return d.getElementById(i)},K="sc_short",L=[];
try{L=JSON.parse(localStorage.getItem(K)||"[]")||[]}catch(e){L=[]}
function save(){try{localStorage.setItem(K,JSON.stringify(L))}catch(e){}}
/* fold long sections */
[["story","Read the full story"]].forEach(function(a){
 var e=a[0][0]==="."?d.querySelector(a[0]):$(a[0]);if(!e)return;e.classList.add("fold");
 var b=d.createElement("button");b.type="button";b.className="fold-b";b.textContent=a[1]+" \u25BE";b.setAttribute("aria-expanded","false");
 b.addEventListener("click",function(){var o=e.classList.toggle("open");b.setAttribute("aria-expanded",o);b.textContent=o?"Show less \u25B4":a[1]+" \u25BE";if(!o)e.scrollIntoView({block:"start"})});
 e.parentNode.insertBefore(b,e.nextSibling)});
/* open folded section if linked to */
d.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest('a[href="#help"],a[href="#story"],a[href="#hidden-challenges"]');if(!a)return;var t=d.querySelector(a.getAttribute("href")),f=t&&t.closest(".fold");if(f)f.classList.add("open")});
d.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".qa button");if(!b)return;var o=b.getAttribute("aria-expanded")==="true";b.setAttribute("aria-expanded",!o);b.nextElementSibling.hidden=o});
/* shortlist */
var ug=$("ug");
function mark(){[].forEach.call(ug.querySelectorAll("li"),function(l){var b=l.querySelector(".sl");if(b)b.setAttribute("aria-pressed",L.indexOf(l.dataset.sl)>-1?"true":"false")})}
function ui(){var n=L.length;$("sl-n").textContent=n;$("sl-fab").hidden=!n;mark();
 var ul=$("slp-l");ul.textContent="";L.forEach(function(h){var li=d.createElement("li"),sp=d.createElement("span"),b=d.createElement("button");sp.textContent=h;b.type="button";b.textContent="\u00D7";b.setAttribute("aria-label","Remove "+h);b.addEventListener("click",function(){tog(h)});li.appendChild(sp);li.appendChild(b);ul.appendChild(li)});
 $("slp-wa").href="https://wa.me/919884444587?text="+encodeURIComponent("Hi, I shortlisted these Stay Confident homes: "+L.join(", ")+". Please share availability and price.");
 if(!n)$("slp").hidden=true}
function tog(h){var i=L.indexOf(h);if(i>-1)L.splice(i,1);else L.push(h);save();ui()}
if(ug){[].forEach.call(ug.querySelectorAll("li"),function(l){var n=l.textContent.trim().replace(/^[^A-Za-z0-9]+/,'');l.dataset.sl=n;var b=d.createElement("button");b.type="button";b.className="sl";b.setAttribute("aria-label","Shortlist "+n);b.setAttribute("aria-pressed","false");
 b.addEventListener("click",function(e){e.stopPropagation();e.preventDefault();tog(n)});b.addEventListener("keydown",function(e){e.stopPropagation()});l.appendChild(b)})}
$("sl-fab").addEventListener("click",function(){$("slp").hidden=false});
$("slp-x").addEventListener("click",function(){$("slp").hidden=true});
$("slp-clear").addEventListener("click",function(){L=[];save();ui()});
ui();
/* back to top */
var tt=$("totop");function sc(){tt.hidden=(window.scrollY||0)<600}
addEventListener("scroll",sc,{passive:true});sc();
tt.addEventListener("click",function(){scrollTo({top:0,behavior:"smooth"})});
})();

;
(function(){
var d=document;
Array.prototype.forEach.call(d.querySelectorAll(".ow-form"),function(f){
f.addEventListener("submit",function(e){e.preventDefault();
var g=function(n){return(f.elements[n].value||"").trim()},err=f.querySelector(".ow-err");
if(!g("name")||!g("phone")||!g("area")){err.textContent="Please fill in your name, phone number and property location.";return}
if(g("phone").replace(/\D/g,"").length<8){err.textContent="Please enter a valid phone number.";return}
err.textContent="";
var t="Hello Stay Confident, I'm a property owner and I'd like to partner with you.\nName: "+g("name")+"\nPhone: "+g("phone")+"\nProperty location: "+g("area")+"\nSuited for: "+g("type")+(g("msg")?"\nNote: "+g("msg"):"");
var w=window.open("https://wa.me/"+f.getAttribute("data-wa")+"?text="+encodeURIComponent(t),"_blank");
if(w){try{w.opener=null}catch(x){}err.style.color="";err.textContent="Opened WhatsApp. Tap Send to share your details."}
else{location.href="https://wa.me/"+f.getAttribute("data-wa")+"?text="+encodeURIComponent(t)}})});
Array.prototype.forEach.call(d.querySelectorAll(".ow-faq .qa button"),function(b){});
})();
