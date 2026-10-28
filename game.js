'use strict';
/* ============================================================
   CORREÇÃO DE BUG (v0.9.7-fix1): REDE DE SEGURANÇA DE ÁUDIO.
   O index.html carrega audio.js antes do game.js. Se esse arquivo
   estiver ausente/corrompido, TODA chamada a audio()/blip()/sfx.*
   lançava ReferenceError — os botões do menu morriam no clique
   (openWeaponSelect chama audio() na 1ª linha) e o loop frame()
   morria em musicTick() antes do render() → tela escura.
   Este bloco só é ativado se o audio.js NÃO tiver carregado,
   garantindo que o jogo sempre funcione (com sons simplificados).
   ============================================================ */
(function(){
if(typeof audio!=='undefined'&&typeof blip!=='undefined'&&typeof sfx!=='undefined'&&typeof musicTick!=='undefined'&&typeof applyVolumes!=='undefined')return;
var __fbCtx=null,__fbMaster=null;
function fbEnsure(){
  try{
    if(!__fbCtx){
      var AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return false;
      __fbCtx=new AC();
      __fbMaster=__fbCtx.createGain();
      __fbMaster.gain.value=.9;
      __fbMaster.connect(__fbCtx.destination);
      window.master=__fbMaster; /* usado pelo botão de mudo */
    }
    if(__fbCtx.state==='suspended')__fbCtx.resume();
    return true;
  }catch(e){return false;}
}
window.audio=function(){fbEnsure();};
window.blip=function(type,f0,f1,dur,vol,dly){
  if(!fbEnsure()||muted)return;
  try{
    var t=__fbCtx.currentTime+(dly||0);
    var o=__fbCtx.createOscillator(),g=__fbCtx.createGain();
    o.type=type||'sine';
    var sf=Math.max(1,f0||440),ef=Math.max(1,f1===undefined?f0:f1);
    o.frequency.setValueAtTime(sf,t);
    o.frequency.exponentialRampToValueAtTime(ef,t+Math.max(.02,dur||.1));
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol===undefined?.07:vol),t+.008);
    g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.03,dur||.1));
    o.connect(g);g.connect(__fbMaster);
    o.start(t);o.stop(t+(dur||.1)+.08);
  }catch(e){}
};
window.noiseSfx=function(dur,vol,freq,tipo,dly){blip('square',freq||800,(freq||800)*.4,dur||.15,vol===undefined?.05:vol,dly);};
var __FB_MAP={
  levelup:['triangle',300,880,.4,.1],roar:['sawtooth',170,55,.7,.12],rumble:['sine',58,30,1.1,.14],
  echo:['sine',420,300,.55,.06],gate:['sawtooth',90,52,.8,.07],heart:['sine',72,40,.2,.15],
  glitch:['square',1600,300,.3,.07],static_:['square',2400,900,.4,.06],creak:['sawtooth',130,70,1.2,.05],
  growl:['sawtooth',95,60,.9,.09],hurt:['square',330,90,.18,.11],die:['sawtooth',300,42,.9,.13],
  dash:['sine',700,240,.14,.06],howl:['sine',220,660,.5,.09],parry:['square',1200,1500,.12,.09],
  boom:['sine',90,28,.7,.22],thud:['sine',110,45,.16,.14],shotS:['square',1400,320,.12,.08],
  thunder:['sine',70,26,1.1,.18],freeze:['triangle',900,2200,.3,.06],ehit:['square',480,180,.08,.06],
  bhit:['triangle',260,90,.12,.09],bite:['square',700,180,.09,.08],slash:['sawtooth',2600,600,.13,.08],
  nova:['sawtooth',140,900,.5,.12],stake:['triangle',520,120,.14,.11],shock:['square',2600,700,.16,.06],
  kill:['square',420,70,.25,.09],explode:['sine',120,24,.9,.22],win:['triangle',392,784,.35,.1],
  soul:['sine',880,1760,.28,.05],dust:['sine',300,120,.25,.04],snore:['sawtooth',68,44,1.1,.07],
  headDie:['sawtooth',500,150,.4,.1],spit:['square',900,500,.06,.06],saw:['square',220,180,.2,.05],
  throw:['sine',900,320,.15,.05]};
window.sfx=new Proxy({},{get:function(t,k){
  return function(){
    var p=__FB_MAP[String(k)]||['sine',400,300,.12,.06];
    blip(p[0],p[1],p[2],p[3],p[4]);
  };
}});
window.musicTick=function(){};
window.applyVolumes=function(){};
window.muted=false;
})();
/* ============ utilidades ============ */
const TAU=Math.PI*2;
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const irnd=(a,b)=>Math.floor(rnd(a,b+1));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(ax,ay,bx,by)=>Math.hypot(bx-ax,by-ay);
const ramp=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const smooth=t=>t*t*(3-2*t);
function angDiff(a,b){let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;}
function lerpAngle(a,b,t){return a+angDiff(b,a)*t;}
const quad=(a,c,b,t)=>(1-t)*(1-t)*a+2*(1-t)*t*c+t*t*b;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
const roman=n=>ROMAN[clamp(n-1,0,14)];
function hexA(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return 'rgba('+r+','+g+','+b+','+a+')';}
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;const L2=dx*dx+dy*dy||1;let t=((px-ax)*dx+(py-ay)*dy)/L2;t=clamp(t,0,1);return Math.hypot(px-(ax+dx*t),py-(ay+dy*t));}
function rayLen(x,y,ang){const c=Math.cos(ang),s=Math.sin(ang);let L=1400;if(c>1e-6)L=Math.min(L,(ROOM.x+ROOM.w-x)/c);else if(c<-1e-6)L=Math.min(L,(ROOM.x-x)/c);if(s>1e-6)L=Math.min(L,(ROOM.y+ROOM.h-y)/s);else if(s<-1e-6)L=Math.min(L,(ROOM.y-y)/s);return L;}
/* ============ DOM ============ */
function ov(id){return document.getElementById(id);}
function showOv(id){const el=ov(id);if(el)el.classList.remove('hidden');}
function hideOv(id){const el=ov(id);if(el)el.classList.add('hidden');}
function toggleOv(id,v){const el=ov(id);if(el)el.classList.toggle('hidden',!v);}
function setStat(id,v){const el=ov(id);if(el)el.textContent=v;}
function blurActive(){const el=document.activeElement;if(el&&el.blur&&el!==document.body)el.blur();}
function bind(id,ev,fn){const el=ov(id);if(el)el.addEventListener(ev,fn);else console.warn('elemento ausente: #'+id);}
function optionsOpen(){const el=ov('options');return el&&!el.classList.contains('hidden');}
/* ============ canvas ============ */
const cv=ov('cv'),ctx=cv.getContext('2d'),W=1280,H=720;
const view={s:1,ox:0,oy:0,dpr:1};
function resize(){view.dpr=Math.min(window.devicePixelRatio||1,2);cv.width=innerWidth*view.dpr;cv.height=innerHeight*view.dpr;cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';view.s=Math.min(innerWidth/W,innerHeight/H);view.ox=(innerWidth-W*view.s)/2;view.oy=(innerHeight-H*view.s)/2;}
addEventListener('resize',resize);
/* v1.6.1: ENCAIXE TOTAL — o jogo inteiro acompanha QUALQUER resolução sem
   barra de rolagem: além do resize clássico, re-encaixa na rotação do celular,
   ao entrar/sair da tela cheia (F11), no visualViewport (zoom/barras do
   sistema) e com um segundo passe atrasado (navegadores assentam o layout
   tarde). Tudo idempotente: chamar de novo não quebra nada. */
addEventListener('orientationchange',resize);
addEventListener('fullscreenchange',resize);
if(screen.orientation&&screen.orientation.addEventListener){try{screen.orientation.addEventListener('change',resize);}catch(e){}}
if(window.visualViewport){try{visualViewport.addEventListener('resize',resize);}catch(e){}}
let __rszT=null;
addEventListener('resize',function(){if(__rszT)clearTimeout(__rszT);__rszT=setTimeout(resize,260);});
resize();
/* ============ sala atual ============ */
const ROOM={x:0,y:0,w:W,h:H,inverted:false};
/* v1.6.2: paredes espelhadas do Falso Paraíso — PRÉ-CALCULADAS. A versão
   antiga varria as bordas e criava 2 gradientes + clip POR SEGMENTO POR
   FRAME (era a travada do Limbo); agora os segmentos externos nascem na
   construção da sala e a parte estática fica numa camada em cache. */
let paradiseSegs=[],paradiseWallsCache=null,paradiseWallsKey='';
/* ============================================================
   v1.5.0 "OS SALÕES DO DANMAKU" — portão do novo combate.
   dmk(): FÁCIL = perfil LEGADO (padrões antigos, arenas antigas,
   anel com brecha antigo, surgimento por ondas). Todo o resto
   (normal/hard/punicao/kaizo/abismo/penitencia) = perfil DANMAKU:
   salas maiores com câmera, inimigos pré-posicionados, círculos
   completos e X no lugar do anel com brecha única.
   ============================================================ */
function dmk(){return diffSel!=='facil';}
function dmkTier(){return diffSel==='normal'?1:diffSel==='hard'?2:(diffSel==='punicao'||diffSel==='abismo')?3:4;}
/* multiplicadores danmaku por tier — [densidade, intervalo, velocidade] */
const DMK_DEN=[1,1.12,1.28,1.5,1.75],DMK_IV=[1,1,.9,.8,.68],DMK_SP=[1,1.05,1.12,1.2,1.3];
function dmkDen(){return DMK_DEN[dmkTier()];}
function dmkIv(){return DMK_IV[dmkTier()];}
function dmkSp(){return DMK_SP[dmkTier()];}
/* câmera do mundo — só anda quando a sala é maior que a tela
   (game.camX/camY nascem junto do objeto game, lá embaixo) */
function camMinX(){return Math.min(0,ROOM.x);}
function camMaxX(){return Math.max(0,ROOM.x+ROOM.w-W);}
function camMinY(){return Math.min(0,ROOM.y);}
function camMaxY(){return Math.max(0,ROOM.y+ROOM.h-H);}
function updateCamera(dt,inst){
  /* v1.5.0: estados que NÃO são o mundo do roguelite (escola, castelo, rio,
     corredores, cutscenes) usam a tela inteira — câmera zerada, o mouse
     volta a mapear 1:1 (cvToWorld sem deslocamento) */
  const ws=game.state;
  const world=ws==='play'||ws==='bossintro'||ws==='dead'||ws==='ending'||ws==='vsintro'||ws==='reideath'||ws==='knightdeath'||!!game.slide;
  if(!world){game.camX=0;game.camY=0;return;}
  let tx=game.camX,ty=game.camY;
  /* CÉRBERO — A SENTENÇA FINAL: a arena dela é o próprio palco, câmera presa ao centro */
  if(window.__RM&&window.__RM.c3&&window.__RM.c3.ph==='fight'){
    tx=camMinX()+(camMaxX()-camMinX())*.5;ty=camMinY()+(camMaxY()-camMinY())*.5;
  }else{
    tx=clamp(player.x-W/2,camMinX(),camMaxX());
    ty=clamp(player.y-H*.52,camMinY(),camMaxY());
  }
  if(inst){game.camX=tx;game.camY=ty;return;}
  const k=Math.min(1,dt*7);
  game.camX+=(tx-game.camX)*k;game.camY+=(ty-game.camY)*k;
}
/* ============================================================
   v1.5.0 (Parte 4): TRANSIÇÃO DESLIZANTE ENTRE SALAS.
   Atravessou a porta → a sala antiga desliza para fora, a nova
   entra pelo lado correspondente, já com os inimigos nos postos.
   Sem tela preta, sem teleporte. HUD não desliza (é desenhado
   por cima, fixo). Duração configurável (0.32s — faixa 0.25-0.40).
   ============================================================ */
const snapCv=document.createElement('canvas');snapCv.width=W;snapCv.height=H;
const snapCtx=snapCv.getContext('2d');
const SLIDE_DUR=.32;
function slideOff(dir){return dir==='n'?[0,-H]:dir==='s'?[0,H]:dir==='e'?[W,0]:[-W,0];}
function startSlide(to,dir){
  /* 1. retrato LIMPO da sala atual (mundo sem HUD) para deslizar para fora */
  try{
    snapCtx.setTransform(view.dpr,0,0,view.dpr,0,0);
    snapCtx.fillStyle='#040304';snapCtx.fillRect(0,0,W,H);
    snapCtx.save();
    snapCtx.translate(view.ox,view.oy);snapCtx.scale(view.s,view.s);
    snapCtx.translate(-game.camX,-game.camY);
    drawWorld(snapCtx);
    snapCtx.restore();
  }catch(e){}
  /* 2. monta a sala nova — Thor nasce na entrada correspondente */
  game.slide={t:0,dur:SLIDE_DUR,dir:dir};
  enterRoom(to,dir);
  try{sfx.gate();}catch(e){}
}
function finishSlide(){
  game.slide=null;
  updateCamera(0,true);
  /* apresentação VS pendente (mini-chefe sem cena própria) */
  if(game._vsPending&&game.state==='play')startVS();
}
function updateSlide(dt){
  const s=game.slide;if(!s)return;
  s.t+=dt;
  if(s.t>=s.dur)finishSlide();
}
/* ============================================================
   v1.5.0 (Parte 7): APRESENTAÇÃO "THOR — VS — MINI-CHEFE".
   Só para quem NÃO tem cena própria (os 4 mini-chefes do mapa).
   Chefes com intro própria (Cérbero, Erro 404, Velho Rei,
   Cavaleiros, xbosses) continuam com as entradas de sempre.
   ============================================================ */
function startVS(){
  const p=game._vsPending;game._vsPending=null;
  if(!p||game.state!=='play')return;
  game._vs={t:0,dur:1.15,info:p};
  game.state='vsintro';
  try{blip('sine',200,420,.16,.07);}catch(e){}
}
function vsK(){const v=game._vs;return v?clamp(v.t/.38,0,1):1;}
function finishVS(){
  const v=game._vs;if(!v)return;
  game._vs=null;game.state='play';
  /* o ritual de surgimento do mini-chefe acontece agora, como sempre */
  const t=v.info.type;
  spawnMarkAt(t,game.absMain.x+game.absMain.w/2,game.absMain.y+game.absMain.h*.3,true,!!v.info.kaizo);
  /* v1.6.4: A CORTE DUPLA — o gêmeo acorda junto (5% das salas, 80% da vida) */
  if(v.info.twin){
    spawnMarkAt(t,game.absMain.x+game.absMain.w*.32,game.absMain.y+game.absMain.h*.64,true,!!v.info.kaizo,.8);
    texts.push({x:W/2,y:H*.32,txt:'A CORTE DUPLA',t:0,life:2,c:'#ff2450',size:15,disp:true});
  }
  try{sfx.roar();}catch(e){}
}
/* retrato do mini-chefe para a apresentação (objeto temporário só de desenho) */
function drawVSPortrait(e,px,py,s){
  ctx.save();
  ctx.translate(px,py);ctx.scale(s,s);
  try{drawEnemy(e);}
  catch(err){
    ctx.fillStyle='#2a2430';ctx.beginPath();ctx.arc(0,0,e.r,0,TAU);ctx.fill();
    ctx.fillStyle=MINI_COLORS[e.type]||'#cfd8dc';ctx.beginPath();ctx.arc(0,0,e.r*.55,0,TAU);ctx.fill();
  }
  ctx.restore();
}
function drawVS(){
  const v=game._vs;if(!v)return;
  const k=vsK();
  const ke=1-Math.pow(1-k,3);
  ctx.save();
  ctx.fillStyle='rgba(4,2,3,'+(.8*Math.min(1,game._vs.t/.22))+')';
  ctx.fillRect(0,0,W,H);
  /* faixas de confronto */
  ctx.fillStyle='rgba(255,217,160,.06)';
  ctx.fillRect(0,H*.18,W,2);ctx.fillRect(0,H*.82,W,2);
  /* THOR entra pela esquerda */
  const px=W*.26-(1-ke)*260;
  ctx.save();ctx.translate(px,H*.47);ctx.scale(2.2,2.2);ctx.translate(-player.x,-player.y);
  try{drawPlayer();}catch(e){}
  ctx.restore();
  /* MINI-CHEFE entra pela direita */
  const p=game._vs._pe||(game._vs._pe=makeVSMob(v.info.type));
  const mx=W*.74+(1-ke)*260;
  if(p)drawVSPortrait(p,mx,H*.47,2.2);
  /* VS no centro — o soco de letra */
  const punch=k<.999?1:1+.12*Math.max(0,1-(game._vs.t-.38)*6);
  const vsCol=v.info.kaizo?'#eef2f4':'#ffd9a0';
  ctx.textAlign='center';
  txt('VS',W/2,H*.47-10,DISP,Math.round(74*punch),vsCol,'center',6);
  txt('— '+miniDisplayName(v.info.type,!!v.info.kaizo,!!v.info.neo)+' —',W/2,H*.47+64,MONO,12,'#9c8f7c','center',3);
  ctx.textAlign='left';
  ctx.restore();
}
/* mob temporário só para o retrato (nunca entra no array de inimigos) */
function makeVSMob(type){
  try{
    const proto={type:type,r:26,seed:3.7,ang:0,spawnT:1,flash:0,hitT:0,dead:false,
      st:'float',stT:0,pat:null,data:null,dashT:0,dashA:0,hp:1,maxHp:1,slowT:0,burnT:0,poisT:0,
      x:0,y:0,mouth:0,ph:0,c:MINI_COLORS[type]||'#cfd8dc',kaizo:false,wake:1};
    return proto;
  }catch(e){return null;}
}
if(document.fonts&&document.fonts.load){document.fonts.load('64px "Pirata One"');document.fonts.load('12px "IBM Plex Mono"');}
let LS=true;try{ctx.letterSpacing='0px';}catch(e){LS=false;}
function inRoomXY(x,y,pad){
for(const rc of game.absRects){if(x>rc.x+pad&&x<rc.x+rc.w-pad&&y>rc.y+pad&&y<rc.y+rc.h-pad)return true;}
return false;
}
function roomPt(x,y,pad){
if(inRoomXY(x,y,pad))return{x:x,y:y};
let best={x:x,y:y},bd=1e18;
for(const rc of game.absRects){
const cx=clamp(x,rc.x+pad,rc.x+rc.w-pad),cy=clamp(y,rc.y+pad,rc.y+rc.h-pad);
const d=(x-cx)*(x-cx)+(y-cy)*(y-cy);
if(d<bd){bd=d;best={x:cx,y:cy};}
}
return best;
}
function clampArena(o,r){
let inside=false;
for(const rc of game.absRects){if(o.x>rc.x+r&&o.x<rc.x+rc.w-r&&o.y>rc.y+r&&o.y<rc.y+rc.h-r){inside=true;break;}}
if(inside)return;
let bx=o.x,by=o.y,bd=1e18;
for(const rc of game.absRects){
const cx=clamp(o.x,rc.x+r,rc.x+rc.w-r),cy=clamp(o.y,rc.y+r,rc.y+rc.h-r);
const d=(o.x-cx)*(o.x-cx)+(o.y-cy)*(o.y-cy);
if(d<bd){bd=d;bx=cx;by=cy;}
}
o.x=bx;o.y=by;
}
/* ============ opções & controles ============ */
const DEFAULT_BINDS={up:['KeyW'],down:['KeyS'],left:['KeyA'],right:['KeyD'],dash:['ShiftLeft','ShiftRight'],active:['Space'],interact:['KeyZ'],pause:['Escape','KeyP']};
const opts={sfx:.8,music:.5,shake:true,dmgNum:true,secret:1};
let keybinds=JSON.parse(JSON.stringify(DEFAULT_BINDS));
const touchState={up:false,down:false,left:false,right:false,dash:false,active:false,interact:false,pause:false};
let rebindAction=null,optionsFrom='menu';
function saveOpts(){try{localStorage.setItem('thorOpts',JSON.stringify({sfx:opts.sfx,music:opts.music,shake:opts.shake,dmgNum:opts.dmgNum,secret:opts.secret,binds:keybinds}));}catch(e){}}
function loadOpts(){try{const d=JSON.parse(localStorage.getItem('thorOpts'));if(!d)return;if(typeof d.sfx==='number')opts.sfx=d.sfx;if(typeof d.music==='number')opts.music=d.music;if(typeof d.shake==='boolean')opts.shake=d.shake;if(typeof d.dmgNum==='boolean')opts.dmgNum=d.dmgNum;if(typeof d.secret==='number')opts.secret=clamp(d.secret,.1,3);if(d.binds)for(const k in DEFAULT_BINDS)if(Array.isArray(d.binds[k])&&d.binds[k].length)keybinds[k]=d.binds[k].slice();}catch(e){}}
loadOpts();
function secretMul(){return clamp(opts.secret,.1,3);}
function held(a){
  // Teclado + controles de toque. O joystick escreve em touchState,
  // então ele precisa participar da mesma função usada pelo movimento.
  if(touchState[a])return true;
  const arr=keybinds[a]||[];
  for(let i=0;i<arr.length;i++)if(keys[arr[i]])return true;
  return false;
}
function keyLabel(code){
if(!code)return '—';
const m={Space:'ESPAÇO',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',ShiftLeft:'SHIFT',ShiftRight:'SHIFT DIR',ControlLeft:'CTRL',ControlRight:'CTRL DIR',AltLeft:'ALT',AltRight:'ALT GR',Tab:'TAB',CapsLock:'CAPS',Enter:'ENTER',Backspace:'BACKSPACE',Escape:'ESC'};
if(m[code])return m[code];
if(code.startsWith('Key'))return code.slice(3);
if(code.startsWith('Digit'))return code.slice(5);
if(code.startsWith('Numpad'))return 'NUM '+code.slice(6);
return code;
}
/* ============ título: fonte sorteada a cada início de jogo ============ */
const TITLE_FONTS=[
'"Pirata One", serif','"Cinzel", serif','"MedievalSharp", cursive','"Uncial Antiqua", cursive',
'"Metal Mania", cursive','"Nosifer", cursive','"Creepster", cursive','"Eater", cursive',
'"Rubik Moonrocks", cursive','"IM Fell English SC", serif','"Grenze Gotisch", serif',
'"Metamorphous", cursive','"Caesar Dressing", cursive','"Special Elite", cursive',
'"Rock Salt", cursive','"Monoton", cursive','"Fiber", cursive'];
function rollTitleFont(){
const el=ov('gameTitle');if(!el)return;
el.style.fontFamily=pick(TITLE_FONTS);
el.style.transform=Math.random()<.05?'rotate(180deg)':'';
}
/* ============ entrada ============ */
const keys={};let diffSel='normal';
let penBuf='';let bruBuf='';let penSeq=0;/* v1.1.4: penSeq = senha em andamento (1=espera penumbra, 2=espera TransMiranda) */
addEventListener('blur',function(){for(const k in keys)keys[k]=false;});
/* v1.1.0: [Q] — dispara a FAGULHA EXPLOSIVA (tiro normal, só que detona) */
addEventListener('keydown',function(e){
if(e.code!=='KeyQ'||e.repeat)return;
if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight')return;
if(game.paused||player.dead||game.windowScene)return;
fireFagulha();
});
addEventListener('keydown',e=>{
if(rebindAction){e.preventDefault();captureKey(e.code);return;}
/* v0.9.14: MODO NERDCIRNO67 — digite "NerdCirno67" no menu (letras E números) */
const _penKey=e.code.length===4&&e.code.startsWith('Key');
const _penDig=e.code.length===6&&e.code.startsWith('Digit')&&e.code[5]>='0'&&e.code[5]<='9';
if(game.state==='menu'&&!optionsOpen()&&(_penKey||_penDig)){
penBuf=(penBuf+(_penKey?e.code[3].toLowerCase():e.code[5])).slice(-16);
/* v0.9.10: O CONVITE — digitar bruno no menu abre o castelo */
if(_penKey)bruBuf=(bruBuf+e.code[3].toLowerCase()).slice(-8);
if(bruBuf.endsWith('bruno')){bruBuf='';if(window.CASTELLO)CASTELLO.invite();}
if(penBuf.endsWith('nerdcirno67')){
penBuf='';
/* v0.9.13→14: o MODO NERDCIRNO67 só abre com TODAS as conquistas — e nele
   nenhum pacto é concedido (runs começadas com ele ativo).
   v1.1.4: sem todas as conquistas, a senha CONTINUA — penumbra → TransMiranda */
if(conqCount()<CONQS.length&&!game.dev){
  game.dev=false;
  penSeq=1;
  _penMsg=Date.now();
  try{blip('sawtooth',220,70,.35,.1);noiseSfx(.4,.05,300,'lowpass');}catch(e){}
}else{
  game.dev=!game.dev;
  penSeq=0;
  audio();
  if(game.dev){sfx.glitch();sfx.levelup();}
  else blip('sine',400,200,.15,.07);
}
refreshMenuDev();
}
/* v1.1.4 — SENHA SECRETA: nerdcirno67 → penumbra → TransMiranda destrava o
   modo dev SEM precisar das conquistas, com o recado: "ou vc pode ser um chato
   que nn quer as conquistas...faça oque quiser" (maiúsculas não importam) */
if(penSeq===1&&penBuf.endsWith('penumbra')){
penBuf='';penSeq=2;
try{blip('sine',260,150,.4,.05);}catch(e){}
}else if(penSeq===2&&penBuf.endsWith('transmiranda')){
penBuf='';penSeq=0;
game.dev=true;audio();
try{sfx.glitch();sfx.levelup();}catch(e){}
_penCheat=Date.now();
refreshMenuDev();
}
}
/* comandos do modo desenvolvedor */
if(game.dev&&!e.repeat&&(game.state==='play'||game.state==='cheat')){
if(e.code==='Digit3'){
  /* v0.9.2: tecla 3 abre/fecha a arca do inferno (lista de pactos) */
  if(game.state==='cheat'){
    closeCheatMenu();
  }else{
    openCheatMenu();
  }
  return;
}
if(game.state!=='play')return;
if(e.code==='Digit1'){
  /* v0.9.0: tecla 1 no modo NERDCIRNO67 (dev) dá TODAS as magias e upgrades */
  devGiveAllUpgrades();
  texts.push({x:player.x,y:player.y-30,txt:'TODAS AS MAGIAS E UPGRADES',t:0,life:1.2,c:'#c9a0ff',size:14,disp:true});
}
else if(e.code==='Digit2'){player.hp=player.maxHp;sfx.heart();}
else if(e.code==='Digit4'){for(const en of enemies){if(en.type!=='rk')killEnemy(en);}}
else if(e.code==='Digit5'){nextFloor();}
else if(e.code==='Digit6'){devGoBoss();}
else if(e.code==='Digit7'){game.god=!game.god;blip('square',game.god?700:300,game.god?1100:150,.12,.09);}
else if(e.code==='Digit8'){gainSouls(100);texts.push({x:player.x,y:player.y-30,txt:'+100 ALMAS',t:0,life:.8,c:'#ffd9a0',size:13});}
else if(e.code==='Digit9'){game.hasShot=true;game.hasBite=true;player.shotT=.3;player.biteT=.3;sfx.levelup();}
else if(e.code==='KeyC'){
  /* v0.9.2: tecla C no modo dev — invoca encontro com Caronte (pacífico) */
  startCaronteEncounter();
  texts.push({x:W/2,y:H*.3,txt:'PENUMBRA — ENCONTRO COM CARONTE',t:0,life:1.6,c:'#ffd9a0',size:14});
}
else if(e.code==='KeyV'){
  /* v0.9.2: tecla V no modo dev — invoca boss fight contra Caronte */
  startCaronteBossFight();
  texts.push({x:W/2,y:H*.3,txt:'PENUMBRA — BOSS CARONTE',t:0,life:1.6,c:'#ffd9a0',size:14});
}
}
/* v0.9.2: no modo cheat (arca do inferno), tecla 3 também fecha, e setas rolam a lista */
if(game.dev&&!e.repeat&&game.state==='cheat'){
  if(e.code==='Digit3'){closeCheatMenu();return;}
  /* seta para baixo / PageDown rolam a lista de bênçãos */
  if(e.code==='ArrowDown'||e.code==='PageDown'){
    const box=ov('cheatCards');
    if(box)box.scrollBy(0,80);
    blip('sine',500,650,.05,.03);
    e.preventDefault();
    return;
  }
  if(e.code==='ArrowUp'||e.code==='PageUp'){
    const box=ov('cheatCards');
    if(box)box.scrollBy(0,-80);
    blip('sine',400,500,.05,.03);
    e.preventDefault();
    return;
  }
}
/* v0.9.3: itens ativos agora são ativados pela tecla configurada (padrão Espaço) */
/* v1.4.3: a SALA DE TESTES virou lugar físico — [0] abre uma ESCADA no chão;
   pisar nela desce para a GRANDE ARENA de testes. Dentro da arena, [0] abre
   o laboratório (bosses · montar salas · arca) como sempre. */
if(game.dev&&!e.repeat&&e.code==='Digit0'){
if(game.state==='play')toggleLabStair();
else if(game.state==='labselect'||game.state==='builder')toggleLab();
}
/* livro do cão [B] */
if(!e.repeat&&e.code==='KeyB'&&!rebindAction){
if(game.state==='book')toggleBook();
else if(game.state==='play')toggleBook();
else if(game.state==='school')toggleBook();
}
const allBinds=keybinds.up.concat(keybinds.down,keybinds.left,keybinds.right,keybinds.dash,keybinds.active,keybinds.interact,keybinds.pause);
if(allBinds.includes(e.code)||e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault();
/* v1.4.6: SHIFT deixou de ser o desvio — agora é FOCO (hitbox visível + andar
   devagar, lido via held('dash') no updatePlayer). O desvio virou TOQUE DUPLO
   rápido nas teclas de movimento (bem estilo Touhou). O botão de desvio do
   touch continua funcionando — chama tryDash() direto. */
if(!e.repeat&&(keybinds.left.includes(e.code)||keybinds.right.includes(e.code)||keybinds.up.includes(e.code)||keybinds.down.includes(e.code))){
  const now=performance.now();
  if(game._tapDir&&game._tapDir.code===e.code&&now-game._tapDir.t<270&&!window.__SCHOOL_ACTIVE){
    const dir=keybinds.left.includes(e.code)?Math.PI:keybinds.right.includes(e.code)?0:keybinds.up.includes(e.code)?-Math.PI/2:Math.PI/2;
    tryDash(dir);game._tapDir=null;
  }else game._tapDir={code:e.code,t:now};
}
if(!e.repeat&&keybinds.interact.includes(e.code))tryInteract();
/* v0.9.3: tecla do item ativo (configurável, padrão Espaço) */
if(!e.repeat&&keybinds.active.includes(e.code)){
  /* v0.9.13: na ESCOLA o ESPAÇO é o LATIDO — a criatura vai ao local exato */
  if(game.state==='school'&&window.SCHOOL&&window.SCHOOL.bark){window.SCHOOL.bark();}
  else if(game.state==='play'||game.state==='carontefight'||game.state==='bossintro'){
    tryActiveItem();
  }
}
keys[e.code]=true;
if(!e.repeat&&keybinds.pause.includes(e.code)){
if(game.state==='shop'){closeShopOv();}
else if(game.state==='cheat'){closeCheatMenu();}
else if(game.state==='book')toggleBook();
else if(game.state==='labselect')toggleLab();
else if(game.state==='builder')toggleLab();
else if(game.state==='saves'){hideOv('saves');game.state='menu';refreshMenuDev();}
else if(game.state==='conqs'){closeConqMenu();}
else if(optionsOpen())closeOptions();
else togglePause();
}
if(!e.repeat&&game.state==='builder'){
if(e.code==='Enter')builderTest();
else if(e.code==='KeyX'){game.builder.items=[];blip('square',300,140,.1,.07);}
}
/* v1.6.2: no CARROSSEL de armas — ◀/▶ (setas) trocam o lado,
   ENTER/ESPAÇO confirma a arma da frente. Só com o overlay aberto. */
try{
if(!e.repeat&&!optionsOpen()){
  const _wo=ov('weapons');
  if(_wo&&!_wo.classList.contains('hidden')&&window.wCarMove){
    if(e.code==='ArrowLeft'){e.preventDefault();window.wCarMove(-1);}
    else if(e.code==='ArrowRight'){e.preventDefault();window.wCarMove(1);}
    else if((e.code==='Enter'||e.code==='Space')&&(game.state==='select'||game.state==='menu')){
      e.preventDefault();
      if(window.wCarConfirm)window.wCarConfirm();
      return;
    }
  }
}
}catch(_e){}
if(e.code==='Enter'&&game.state==='menu'&&!optionsOpen()&&!_entryShown()&&!(window.__BOOK&&window.__BOOK.introBusy&&window.__BOOK.introBusy()))openWeaponSelect(); /* v1.9.1: na ENTRADA o Enter é do INICIAR — e durante a cutscene do livro nada abre por baixo */
});
addEventListener('keyup',e=>{keys[e.code]=false;});
function captureKey(code){
if(code==='Escape'){rebindAction=null;refreshKbBtns();return;}
keybinds[rebindAction][0]=code;rebindAction=null;saveOpts();refreshKbBtns();blip('sine',600,820,.07,.05);
}
if(cv){
cv.addEventListener('mousemove',function(e){const p=cvToWorld(e.clientX,e.clientY);mouse.x=p.x;mouse.y=p.y;mouse.inCanvas=true;});
cv.addEventListener('mouseleave',function(){mouse.inCanvas=false;});
cv.addEventListener('mousedown',function(e){
audio();
if(game.state==='builder'){
const p=cvToWorld(e.clientX,e.clientY);
builderClick(p.x,p.y,e.button===2);
return;
}
if(e.button===2){const rp=cvToWorld(e.clientX,e.clientY);if(window.__EXPANSION&&window.__EXPANSION.rmbDown&&window.__EXPANSION.rmbDown(rp.x,rp.y))return;tryThrowSaw();return;}
if(e.button!==0)return;
mouseHeld=true;
const p=cvToWorld(e.clientX,e.clientY);
mouse.x=p.x;mouse.y=p.y;mouse.inCanvas=true;
tryShootAt(p.x,p.y);
});
cv.addEventListener('contextmenu',function(e){e.preventDefault();});
/* v1.0.0: soltar o botão do feixe — mouse solto dispara a carga */
addEventListener('mouseup',function(e){
if(e.button===2){if(window.__EXPANSION&&window.__EXPANSION.rmbUp)window.__EXPANSION.rmbUp();return;}
if(e.button!==0)return;
mouseHeld=false;
releaseBeam();
});
}
/* ============ toque / mobile ============ */
(function setupMobileControls(){
  const root=document.getElementById('mobileControls');
  if(!root)return;
  const btn=(id)=>document.getElementById(id);
  const joy=document.getElementById('mobileJoystick'), knob=document.getElementById('joyKnob');
  let joyPointer=null;
  function setAction(a,v){touchState[a]=!!v;}
  function pulse(a,fn){
    audio();
    if(fn)fn();
    if(navigator.vibrate)try{navigator.vibrate(12);}catch(e){}
  }
  function setBtn(id,a,oneShot){
    const el=btn(id);if(!el)return;
    const down=function(e){e.preventDefault();e.stopPropagation();el.classList.add('active');if(oneShot){pulse(a);if(a==='dash')tryDash();else if(a==='interact')tryInteract();else if(a==='pause'){if(game.state==='book')toggleBook();else if(game.state==='labselect')toggleLab();else if(game.state==='saves'){hideOv('saves');game.state='menu';refreshMenuDev();}else if(optionsOpen())closeOptions();else togglePause();}}else{pulse(a);setAction(a,true);}};
    const up=function(e){e.preventDefault();e.stopPropagation();el.classList.remove('active');if(!oneShot)setAction(a,false);};
    el.addEventListener('pointerdown',down,{passive:false});el.addEventListener('pointerup',up,{passive:false});el.addEventListener('pointercancel',up,{passive:false});el.addEventListener('pointerleave',function(e){if(!oneShot&&e.buttons===0)up(e);},{passive:false});
  }
  setBtn('mobileDash','dash',true);
  setBtn('mobileInteract','interact',true);
  const pause=btn('mobilePause');
  if(pause)pause.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();pulse('pause',function(){if(game.state==='book')toggleBook();else if(game.state==='labselect')toggleLab();else if(game.state==='saves'){hideOv('saves');game.state='menu';refreshMenuDev();}else if(optionsOpen())closeOptions();else togglePause();});pause.classList.add('active');},{passive:false});
  if(pause)pause.addEventListener('pointerup',function(e){e.preventDefault();pause.classList.remove('active');},{passive:false});
  const book=btn('mobileBook');
  if(book)book.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();pulse('book',function(){if(game.state==='book')toggleBook();else if(game.state==='play')toggleBook();else if(game.state==='school')toggleBook();});book.classList.add('active');},{passive:false});
  if(book)book.addEventListener('pointerup',function(){book.classList.remove('active');});
  const saw=btn('mobileSaw');
  if(saw)saw.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();pulse('saw',tryThrowSaw);saw.classList.add('active');},{passive:false});
  if(saw)saw.addEventListener('pointerup',function(){saw.classList.remove('active');});
  function updateJoy(clientX,clientY){
    const r=joy.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    let dx=clientX-cx,dy=clientY-cy;const max=r.width*.34;const d=Math.hypot(dx,dy)||1;
    if(d>max){dx=dx/d*max;dy=dy/d*max;}
    knob.style.transform=`translate(${dx}px,${dy}px)`;
    const nx=dx/max,ny=dy/max;
    setAction('left',nx<-.25);setAction('right',nx>.25);setAction('up',ny<-.25);setAction('down',ny>.25);
  }
  function resetJoy(){joyPointer=null;knob.style.transform='translate(0,0)';setAction('left',false);setAction('right',false);setAction('up',false);setAction('down',false);}
  joy.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();joyPointer=e.pointerId;try{joy.setPointerCapture(e.pointerId);}catch(x){}updateJoy(e.clientX,e.clientY);audio();},{passive:false});
  joy.addEventListener('pointermove',function(e){
    if(e.pointerId!==joyPointer)return;
    e.preventDefault();
    updateJoy(e.clientX,e.clientY);
  },{passive:false});
  joy.addEventListener('pointerup',function(e){
    if(e.pointerId===joyPointer)resetJoy();
  },{passive:false});
  joy.addEventListener('pointercancel',function(e){
    if(e.pointerId===joyPointer)resetJoy();
  },{passive:false});

  // Alguns WebViews Android deixam de enviar pointermove para o elemento
  // quando o dedo ultrapassa a borda. Continuamos acompanhando no documento.
  document.addEventListener('pointermove',function(e){
    if(e.pointerId!==joyPointer)return;
    e.preventDefault();
    updateJoy(e.clientX,e.clientY);
  },{passive:false});
  document.addEventListener('pointerup',function(e){
    if(e.pointerId===joyPointer)resetJoy();
  },{passive:false});
  document.addEventListener('pointercancel',function(e){
    if(e.pointerId===joyPointer)resetJoy();
  },{passive:false});
  addEventListener('pointerup',function(e){
    if(joyPointer!==null&&!e.pressure)resetJoy();
  });
  addEventListener('blur',resetJoy);
  // Toque no campo de jogo: tiro manual na direção do toque (desktop usa o mouse).
  cv.addEventListener('pointerdown',function(e){
    if(e.pointerType==='touch' && !e.isPrimary)return;
    if(e.pointerType==='touch'){
      const t=e.target;
      if(t===cv){audio();const p=cvToWorld(e.clientX,e.clientY);tryShootAt(p.x,p.y);}
    }
  },{passive:false});
  /* v1.0.0: toque solto — release do feixe no mobile */
  cv.addEventListener('pointerup',function(e){
    if(e.pointerType==='touch')releaseBeam();
  },{passive:false});
  cv.addEventListener('pointercancel',function(e){
    if(e.pointerType==='touch')releaseBeam();
  },{passive:false});
  // Impede zoom/scroll acidental enquanto se joga.
  document.addEventListener('touchmove',function(e){if(game.state==='play'||game.state==='bossintro')e.preventDefault();},{passive:false});
  document.addEventListener('gesturestart',function(e){e.preventDefault();},{passive:false});
})();
/* ============ vinheta ============ */
let vignette;const groundEmbers=[],ambient=[];
function initFloor(){
vignette=document.createElement('canvas');vignette.width=W;vignette.height=H;
const v=vignette.getContext('2d');
const g=v.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.62);
g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0.55)');
v.fillStyle=g;v.fillRect(0,0,W,H);
for(let i=0;i<24;i++)ambient.push({x:rnd(W),y:rnd(H),vy:rnd(-14,-30),ph:rnd(TAU),r:rnd(1.2,2.4)});
}
initFloor();
/* v1.3.3: lavagem de zona do chão — v1.3.5: a PENUMBRA INFERNAL segue a
   referência: centro quase BRANCO PURO queimando em LARANJA VIVO → VERMELHO
   PROFUNDO nas bordas de cada retângulo, com textura de brasa; a Penumbra
   das Almas segue NORMAL (bem escura, sem lavagem). */
function applyZoneWash(f,zp,rects){
f.save();f.beginPath();
for(const rc of rects)f.rect(rc.x,rc.y,rc.w,rc.h);
f.clip();
/* v1.3.5: como na referência — centro quase BRANCO PURO; nas 4 bordas de
   cada retângulo queima em faixas: vermelho profundo → laranja vivo → branco */
f.save();f.globalCompositeOperation='screen';
f.fillStyle='rgb(250,247,240)';for(const rc of rects)f.fillRect(rc.x,rc.y,rc.w,rc.h); /* v1.3.5: BRANCO QUASE PURO sobre qualquer base (inclusive o fundo.png do usuário) */
f.restore();
for(const rc of rects){
const bh=Math.min(rc.h*.46,96),bw=Math.min(rc.w*.38,132);
const bands=[
[rc.x,rc.y,rc.x,rc.y+bh],[rc.x,rc.y+rc.h,rc.x,rc.y+rc.h-bh],
[rc.x,rc.y,rc.x+bw,rc.y],[rc.x+rc.w,rc.y,rc.x+rc.w-bw,rc.y]];
for(const B of bands){
const lg=f.createLinearGradient(B[0],B[1],B[2],B[3]);
lg.addColorStop(0,'rgba(122,14,6,0.85)');
lg.addColorStop(.3,'rgba(196,38,12,0.7)');
lg.addColorStop(.6,'rgba(247,96,22,0.55)');
lg.addColorStop(.84,'rgba(255,150,52,0.34)');
lg.addColorStop(1,'rgba(255,190,90,0)');
f.fillStyle=lg;f.fillRect(rc.x,rc.y,rc.w,rc.h);
}
/* textura de brasa: manchas irregulares de fogo sobre as faixas */
const per=2*(rc.w+rc.h);
const nEmb=Math.round(per/8);
for(let i2=0;i2<nEmb;i2++){
const t=Math.random()*per;let ex,ey;
if(t<rc.w){ex=rc.x+t;ey=rc.y+Math.random()*bh;}
else if(t<rc.w*2){ex=rc.x+(t-rc.w);ey=rc.y+rc.h-Math.random()*bh;}
else if(t<rc.w*2+rc.h){ex=rc.x+Math.random()*bw;ey=rc.y+(t-rc.w*2);}
else{ex=rc.x+rc.w-Math.random()*bw;ey=rc.y+(t-rc.w*2-rc.h);}
const rr=2+Math.random()*6.5,cP=Math.random();
const cA=cP<.4?'255,122,26':(cP<.76?'216,44,14':'255,190,84');
const eg=f.createRadialGradient(ex,ey,0,ex,ey,rr);
eg.addColorStop(0,'rgba('+cA+',0.5)');eg.addColorStop(1,'rgba('+cA+',0)');
f.fillStyle=eg;f.beginPath();f.arc(ex,ey,rr,0,TAU);f.fill();
}
/* linha de brasa profunda rente à borda */
f.strokeStyle='rgba(140,20,6,0.8)';f.lineWidth=3;
f.strokeRect(rc.x+1.5,rc.y+1.5,rc.w-3,rc.h-3);
}
f.fillStyle='rgba(120,90,66,0.12)'; /* v1.3.5: poeira clara sobre o branco */
const nFleck=Math.round(46*(ROOM.w*ROOM.h)/(W*H))+10;
for(let i=0;i<nFleck;i++){
const rc=rects[Math.floor(Math.random()*rects.length)];
f.fillRect(rc.x+rnd(10,Math.max(11,rc.w-10)),rc.y+rnd(10,Math.max(11,rc.h-10)),rnd(1,2.4),rnd(1,2.4));
}
f.strokeStyle='rgba(150,70,40,0.10)';f.lineWidth=1; /* v1.3.5 */
for(let i=0;i<4;i++){
let cx=rnd(ROOM.w),cy=rnd(ROOM.h);f.beginPath();f.moveTo(cx,cy);
for(let s=0;s<4;s++){cx+=rnd(-34,34);cy+=rnd(-24,24);f.lineTo(cx,cy);}
f.stroke();
}
f.restore();
}
let roomFloor=null;
/* v1.3.5: pontos expostos da borda do chão (chamas tremulam por cima) */
const peninfEdgePts=[];
function buildRoomFloor(){
roomFloor=document.createElement('canvas');roomFloor.width=Math.max(4,ROOM.w);roomFloor.height=Math.max(4,ROOM.h);
const f=roomFloor.getContext('2d');
peninfEdgePts.length=0;game.outerFires=null; /* v1.3.5 */
const inv=ROOM.inverted;
const paradise=isParadiseFloor()&&!inv;
/* v1.6.2: A FASE CINZA — no último véu do Limbo (fase 4+) o paraíso acabou:
   chão CINZA LISO, sem estrutura nenhuma (sem grama, pedras, flores,
   rachaduras, paredes espelhadas ou pólen) e o fundo lá fora segue liso. */
const limboGray=paradise&&(game.limboPhase||1)>=4;
if(!paradise){paradiseSegs=[];paradiseWallsCache=null;paradiseWallsKey='';}
/* v1.3.3: paletas por zona — v1.3.4: só a PENUMBRA INFERNAL tem paleta
   própria (chão EBRANQUIÇADO queimando nas bordas); a Penumbra das Almas
   voltou ao piso ESCURO de sempre. Demais regiões intactas. */
let zonePal=null;
if(!inv&&!paradise&&(game.region||'penumbra')==='penumbra'&&(game.floor||1)>2){
zonePal={id:'peninf',bg:'#e9e3d6',grid:'rgba(92,42,20,0.10)',edge:'#a33417'};
}
const zp=zonePal;
const bg=inv?'#e9e7e0':(paradise?(limboGray?'#4a4741':'#3c5a2a'):(zp?zp.bg:'#0f0b0e'));
const rects=game.absRects.map(r=>({x:r.x-ROOM.x,y:r.y-ROOM.y,w:r.w,h:r.h}));
for(const rc of rects){f.fillStyle=bg;f.fillRect(rc.x,rc.y,rc.w,rc.h);}
f.save();f.beginPath();
for(const rc of rects)f.rect(rc.x,rc.y,rc.w,rc.h);
f.clip();
if(paradise){
  /* ===== gramado do Falso Paraíso =====
     base verde com variações tonais para dar volume ao terreno,
     tufos de grama espalhados, manchas de terra, pequenas pedras e
     ocasionalmente flores brancas — tudo muito espaçado.
     v1.6.2: FASE CINZA (fase 4+ do Limbo) — nada disto existe: o chão
     é SÓ o cinza liso, sem estrutura nenhuma. */
  if(!limboGray){
  const distort=paradiseDistort();
  /* variações tonais do terreno — manchas de grama mais clara/escura */
  const nPatches=Math.round(60*(ROOM.w*ROOM.h)/(W*H))+10;
  for(let i=0;i<nPatches;i++){
    f.save();
    f.translate(rnd(ROOM.w),rnd(ROOM.h));
    f.rotate(rnd(TAU));
    f.scale(1,rnd(.4,.85));
    f.beginPath();f.arc(0,0,rnd(22,90),0,TAU);
    const tone=rnd(0,1);
    if(tone<.4)f.fillStyle='rgba(78,108,52,0.32)';
    else if(tone<.75)f.fillStyle='rgba(118,148,82,0.22)';
    else f.fillStyle='rgba(52,82,38,0.28)';
    f.fill();f.restore();
  }
  /* tufos de grama — pequenos traços verdes */
  const nTufts=Math.round(420*(ROOM.w*ROOM.h)/(W*H))+120;
  f.lineWidth=1.1;f.lineCap='round';
  for(let i=0;i<nTufts;i++){
    const gx=rnd(ROOM.w),gy=rnd(ROOM.h);
    const base=rnd(0,1);
    const col=base<.5?'rgba(72,100,46,0.85)':'rgba(96,128,62,0.85)';
    f.strokeStyle=col;
    f.beginPath();f.moveTo(gx,gy);f.lineTo(gx-1.6,gy-5.2);f.stroke();
    f.beginPath();f.moveTo(gx,gy);f.lineTo(gx+1.4,gy-6);f.stroke();
    f.beginPath();f.moveTo(gx,gy);f.lineTo(gx-0.2,gy-6.6);f.stroke();
  }
  /* manchas de terra (caminhos de pedra quebrados aparecem aqui como áreas mais escuras) */
  const nDirt=Math.round(8*(ROOM.w*ROOM.h)/(W*H))+3;
  for(let i=0;i<nDirt;i++){
    f.save();
    f.translate(rnd(ROOM.w),rnd(ROOM.h));
    f.rotate(rnd(TAU));
    f.beginPath();
    f.ellipse(0,0,rnd(28,72),rnd(16,42),0,0,TAU);
    f.fillStyle='rgba(82,66,46,0.34)';
    f.fill();
    f.restore();
  }
  /* pequenas pedras */
  const nStones=Math.round(20*(ROOM.w*ROOM.h)/(W*H))+8;
  for(let i=0;i<nStones;i++){
    const sx=rnd(ROOM.w),sy=rnd(ROOM.h),sr=rnd(1.6,4);
    f.fillStyle='rgba(168,160,148,0.7)';
    f.beginPath();f.ellipse(sx,sy,sr,sr*.7,0,0,TAU);f.fill();
    f.fillStyle='rgba(120,112,100,0.55)';
    f.beginPath();f.ellipse(sx+sr*.3,sy+sr*.3,sr*.6,sr*.4,0,0,TAU);f.fill();
  }
  /* flores brancas — raras e perturbadoramente perfeitas */
  const nFlowers=Math.round(4*(ROOM.w*ROOM.h)/(W*H))+1;
  for(let i=0;i<nFlowers;i++){
    const fx=rnd(ROOM.w),fy=rnd(ROOM.h);
    f.fillStyle='rgba(255,250,235,0.92)';
    for(let p=0;p<5;p++){
      const a=p/5*TAU;
      f.beginPath();f.ellipse(fx+Math.cos(a)*2.4,fy+Math.sin(a)*2.4,1.8,1.2,a,0,TAU);f.fill();
    }
    f.fillStyle='rgba(255,217,160,0.9)';
    f.beginPath();f.arc(fx,fy,1.2,0,TAU);f.fill();
  }
  /* pequenas elevações no terreno — contornos suaves de nível */
  f.strokeStyle='rgba(56,82,38,0.18)';f.lineWidth=1.2;
  const nHills=2+Math.floor(ROOM.w*ROOM.h/(W*H)*3);
  for(let i=0;i<nHills;i++){
    f.save();
    f.translate(rnd(ROOM.w),rnd(ROOM.h));
    f.beginPath();
    f.ellipse(0,0,rnd(60,140),rnd(20,50),rnd(0,Math.PI),0,TAU);
    f.stroke();
    f.restore();
  }
  /* distorção progressiva — rachaduras finas no chão a partir do andar 3 */
  if(distort>.3){
    f.strokeStyle='rgba(40,30,18,'+(distort*.5)+')';
    f.lineWidth=.8;
    const nCracks=Math.floor(distort*14);
    for(let i=0;i<nCracks;i++){
      let cx=rnd(ROOM.w),cy=rnd(ROOM.h);
      f.beginPath();f.moveTo(cx,cy);
      const segs=3+Math.floor(rnd(2,5));
      for(let s=0;s<segs;s++){
        cx+=rnd(-22,22);cy+=rnd(-22,22);
        f.lineTo(cx,cy);
      }
      f.stroke();
    }
  }
  /* manchas escuras perturbadoras — buracos discretos a partir do andar 4 */
  if(distort>.6){
    const nDark=Math.floor((distort-.5)*8);
    for(let i=0;i<nDark;i++){
      const dx=rnd(ROOM.w),dy=rnd(ROOM.h),dr=rnd(8,22);
      const dg=f.createRadialGradient(dx,dy,1,dx,dy,dr);
      dg.addColorStop(0,'rgba(8,4,10,0.7)');
      dg.addColorStop(1,'rgba(8,4,10,0)');
      f.fillStyle=dg;
      f.beginPath();f.arc(dx,dy,dr,0,TAU);f.fill();
    }
  }
  } /* v1.6.2: fim do if(!limboGray) — na fase cinza NADA foi desenhado no chão */
  f.restore();
  /* NÃO desenha as linhas brancas sólidas — as paredes espelhadas
     são desenhadas dinamicamente por drawParadiseWalls() a cada frame.
     v1.6.2: na fase cinza elas NEM EXISTEM (drawParadiseWalls volta cedo). */
  groundEmbers.length=0;
  if(!limboGray){
  /* partículas ambientais do paraíso: pólen dourado flutuando */
  const m=rects[0];
  const nAmbient=Math.round(14*(ROOM.w*ROOM.h)/(W*H))+6;
  for(let i=0;i<nAmbient;i++)groundEmbers.push({x:ROOM.x+rnd(30,m.w-30),y:ROOM.y+rnd(30,m.h-30),ph:rnd(TAU),paradise:true});
  /* v1.6.2: segmentos externos das paredes espelhadas PRÉ-CALCULADOS aqui
     (1× por sala) + camada estática pintada numa camada em cache — o frame
     inteiro vira 1 drawImage + brilhos baratos. Era aqui que o Limbo travava. */
  buildParadiseSegs();
  }else{
  /* v1.6.2: FASE CINZA — a única marca no piso é a borda de sempre, num
     traço cinza-escuro; sem paredes espelhadas e sem pólen: tudo liso */
  f.strokeStyle='#242220';f.lineWidth=3;f.lineCap='round';
  for(const rc of rects)f.strokeRect(rc.x+1.5,rc.y+1.5,rc.w-3,rc.h-3);
  paradiseSegs=[];paradiseWallsCache=null;paradiseWallsKey='';
  }
  return;
}
/* v1.3.5: sem as manchas escuras no chão de zona própria (o branco da
   Infernal fica UNIFORME, como na referência) */
if(!zp){
const blobs=Math.round(70*(ROOM.w*ROOM.h)/(W*H))+8;
for(let i=0;i<blobs;i++){
f.save();f.translate(rnd(ROOM.w),rnd(ROOM.h));f.rotate(rnd(TAU));f.scale(1,rnd(.35,.8));
f.beginPath();f.arc(0,0,rnd(18,90),0,TAU);
f.fillStyle=inv?'rgba(20,16,22,0.06)':'rgba(0,0,0,0.16)';f.fill();f.restore();
}}
f.strokeStyle=inv?'rgba(24,20,26,0.13)':(zp?zp.grid:'rgba(242,240,234,0.10)');f.lineWidth=1;
for(let x=56;x<ROOM.w;x+=56){f.beginPath();f.moveTo(x,0);f.lineTo(x,ROOM.h);f.stroke();}
for(let y=56;y<ROOM.h;y+=56){f.beginPath();f.moveTo(0,y);f.lineTo(ROOM.w,y);f.stroke();}
f.restore();
/* PNG EDITION: cenário substituível — desenha assets/sprites/fundo.png
   sobre o piso das salas (recortado ao formato delas, bordas/paredes preservadas) */
try{if(window.THOR_PNG_MODE&&window.THOR_PNG&&window.THOR_PNG.drawFloor)window.THOR_PNG.drawFloor(f,ROOM,rects,inv);}catch(e){}
/* v1.3.3: lavagem de zona por cima do piso (e do PNG opcional do usuário) */
if(zp&&!inv)applyZoneWash(f,zp,rects);
f.strokeStyle=inv?'#18141a':(zp?zp.edge:'#f2f0ea');f.lineWidth=3;f.lineCap='round';
for(const rc of rects){
const edges=[[rc.x,rc.y,rc.x+rc.w,rc.y],[rc.x+rc.w,rc.y,rc.x+rc.w,rc.y+rc.h],[rc.x+rc.w,rc.y+rc.h,rc.x,rc.y+rc.h],[rc.x,rc.y+rc.h,rc.x,rc.y]];
for(const E of edges){
const L=Math.hypot(E[2]-E[0],E[3]-E[1]);const n=Math.max(2,Math.round(L/7));
let pOn=false,px=0,py=0;
for(let i=0;i<=n;i++){
const t=i/n,x=E[0]+(E[2]-E[0])*t,y=E[1]+(E[3]-E[1])*t;
let covered=false;
for(const o of rects){
if(o===rc)continue;
if(x>o.x+3&&x<o.x+o.w-3&&y>o.y+3&&y<o.y+o.h-3){covered=true;break;}
}
const on=!covered;
/* v1.3.5: amostra pontos expostos da borda (normal p/ fora do retângulo) */
if(zp&&on&&peninfEdgePts.length<150&&(i%2===0)){
const dx=E[2]-E[0],dy=E[3]-E[1],el=Math.hypot(dx,dy)||1;
let nx=-dy/el,ny=dx/el;
if(((E[0]+dx/2)-(rc.x+rc.w/2))*nx+((E[1]+dy/2)-(rc.y+rc.h/2))*ny<0){nx=-nx;ny=-ny;}
peninfEdgePts.push({x:x+ROOM.x,y:y+ROOM.y,ox:nx,oy:ny});
}
if(on&&pOn){f.beginPath();f.moveTo(px,py);f.lineTo(x,y);f.stroke();}
pOn=on;px=x;py=y;
}
}
}
/* v1.3.5: ÀS VEZES um FOGO queima FORA do cenário — no vazio, junto às paredes */
game.outerFires=null;
if(zp&&!inv){
game.outerFires=[];
if(peninfEdgePts.length&&Math.random()<.62){
const nF=1+Math.floor(Math.random()*3),picks=[];
let tries=0;
while(picks.length<nF&&tries++<24){
const p=peninfEdgePts[Math.floor(Math.random()*peninfEdgePts.length)];
if(picks.some(q=>Math.abs(q.x-p.x)<80&&Math.abs(q.y-p.y)<80))continue;
picks.push(p);
const dst=16+Math.random()*30;
game.outerFires.push({x:p.x+p.ox*dst,y:p.y+p.oy*dst,s:9+Math.random()*8,ph:rnd(TAU)});
}
}
}
groundEmbers.length=0;
if(!inv){
const m=rects[0];
for(let i=0;i<10;i++)groundEmbers.push({x:ROOM.x+rnd(30,m.w-30),y:ROOM.y+rnd(30,m.h-30),ph:rnd(TAU)});
}
}
/* ============ meta-progressão ============ */
/* v0.9.13: META ganhou name (nome do save), conq (conquistas) e flags de
   conquistas — todos preservados no normalizeMeta (nada mais é descartado) */
const EMPTY_META=()=>({kills:0,deaths:0,wins:0,e404:0,souls:0,rooms:0,caronteKills:0,done:{},seen:{},knights:{conquest:0,war:0,famine:0,death:0},hellMode:false,descidas:0,school:null,name:'',conq:{},schoolDone:false,hellSeen:false,kingsoul:false,casteloCleared:false,acq:{},sinFound:{},psyn:{},abismoWins:0,cerbSlain:0}); /* v1.3.0 */
let activeSave=1;
const META=EMPTY_META();
function normalizeMeta(d){const m=EMPTY_META();if(!d)return m;for(const k of ['kills','deaths','wins','e404','souls','rooms','caronteKills','descidas'])if(typeof d[k]==='number')m[k]=Math.max(0,d[k]);if(d.done&&typeof d.done==='object')m.done={...d.done};if(d.seen&&typeof d.seen==='object')m.seen={...d.seen};if(d.knights&&typeof d.knights==='object')m.knights={conquest:Math.max(0,d.knights.conquest|0),war:Math.max(0,d.knights.war|0),famine:Math.max(0,d.knights.famine|0),death:Math.max(0,d.knights.death|0)};if(typeof d.hellMode==='boolean')m.hellMode=d.hellMode;if(d.school&&typeof d.school==='object')m.school={...d.school};if(typeof d.name==='string')m.name=d.name.slice(0,16);if(d.conq&&typeof d.conq==='object')m.conq={...d.conq};if(d.acq&&typeof d.acq==='object')m.acq={...d.acq};if(d.sinFound&&typeof d.sinFound==='object')m.sinFound={...d.sinFound};m.schoolDone=!!d.schoolDone;m.hellSeen=!!d.hellSeen;m.kingsoul=!!d.kingsoul;m.casteloCleared=!!d.casteloCleared;
/* v0.9.13 FIX: campos desconhecidos NUNCA mais são descartados —
   saves antigos (e futuros) não perdem nenhum dado ao carregar */
try{for(const k in d)if(!(k in m))m[k]=d[k];}catch(e){}
return m;}
function copyMeta(src,dst){for(const k of ['kills','deaths','wins','e404','souls','rooms','caronteKills','descidas'])dst[k]=src[k];dst.done={...(src.done||{})};dst.seen={...(src.seen||{})};dst.knights=src.knights?{...src.knights}:{conquest:0,war:0,famine:0,death:0};dst.hellMode=!!src.hellMode;dst.school=src.school?{...src.school}:null;dst.name=src.name||'';dst.conq={...(src.conq||{})};dst.acq={...(src.acq||{})};dst.sinFound={...(src.sinFound||{})};dst.psyn={...(src.psyn||{})};dst.abismoWins=src.abismoWins||0;dst.cerbSlain=src.cerbSlain||0; /* v1.3.0 */dst.schoolDone=!!src.schoolDone;dst.hellSeen=!!src.hellSeen;dst.kingsoul=!!src.kingsoul;dst.casteloCleared=!!src.casteloCleared;}
function loadMeta(){try{activeSave=Math.max(1,Math.min(3,Number(localStorage.getItem('thorActiveSave'))||1));let d=JSON.parse(localStorage.getItem('thorSave'+activeSave));if(activeSave===1&&!d){const legacy=JSON.parse(localStorage.getItem('thorMeta'));if(legacy){d=legacy;localStorage.setItem('thorSave1',JSON.stringify(normalizeMeta(d)));}}copyMeta(normalizeMeta(d),META);for(const slot of [1,2,3]){if(!localStorage.getItem('thorSave'+slot))localStorage.setItem('thorSave'+slot,JSON.stringify(EMPTY_META()));}}catch(e){copyMeta(EMPTY_META(),META);}}
function saveMeta(){try{localStorage.setItem('thorSave'+activeSave,JSON.stringify(META));localStorage.setItem('thorActiveSave',String(activeSave));}catch(e){}}
function saveSlotData(slot){try{const d=localStorage.getItem('thorSave'+slot);return d?normalizeMeta(JSON.parse(d)):EMPTY_META();}catch(e){return EMPTY_META();}}
function slotExists(slot){try{return !!localStorage.getItem('thorSave'+slot);}catch(e){return false;}}
function loadSaveSlot(slot){if(slot<1||slot>3)return;saveMeta();const d=saveSlotData(slot);activeSave=slot;copyMeta(d,META);localStorage.setItem('thorActiveSave',String(slot));refreshMenuDev();renderSaveCards();blip('sine',slot===1?520:380,slot===1?760:520,.12,.06);}
/* ==== v0.9.13: save não desaparece mais — backup automático ao deletar,
   renomear saves, exportar/importar arquivo e restaurar backup ==== */
function backupKey(i){return 'thorBackup'+i;}
function backupExists(i){try{return !!localStorage.getItem(backupKey(i));}catch(e){return false;}}
function stashBackup(i){try{const d=localStorage.getItem('thorSave'+i);if(d)localStorage.setItem(backupKey(i),d);}catch(e){}}
function restoreBackup(i){if(!backupExists(i))return;if(!confirm('restaurar o backup do save '+i+'? o conteúdo atual desse slot será substituído.'))return;try{const d=localStorage.getItem(backupKey(i));localStorage.setItem('thorSave'+i,d);}catch(e){}if(activeSave===i){const dd=saveSlotData(i);copyMeta(dd,META);}renderSaveCards();refreshMenuDev();blip('sine',300,520,.14,.06);}
function renameSaveSlot(i){const cur=saveSlotData(i).name||'';const nm=prompt('nome deste save (ex.: bruno):',cur);if(nm===null)return;const clean=(nm||'').trim().slice(0,16);try{const raw=localStorage.getItem('thorSave'+i);const d=raw?JSON.parse(raw):EMPTY_META();d.name=clean;localStorage.setItem('thorSave'+i,JSON.stringify(d));}catch(e){}if(activeSave===i){META.name=clean;saveMeta();}renderSaveCards();refreshMenuDev();blip('sine',420,600,.1,.05);}
function exportSaves(){try{const out={v:3,game:'thor-revenge',date:new Date().toISOString(),activeSave:activeSave,slots:{}};for(let i=1;i<=3;i++)out.slots[i]=saveSlotData(i);try{out.opts=JSON.parse(localStorage.getItem('thorOpts')||'null');}catch(e){out.opts=null;}
const blob=new Blob([JSON.stringify(out,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='thor-saves-'+out.date.slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(function(){try{URL.revokeObjectURL(a.href);a.remove();}catch(e){}},400);blip('sine',520,760,.14,.06);}catch(e){}}
function importSavesFile(file){if(!file)return;const rd=new FileReader();rd.onload=function(){try{const d=JSON.parse(rd.result);if(!d||d.game!=='thor-revenge'||!d.slots)throw 0;for(let i=1;i<=3;i++){if(d.slots[i])localStorage.setItem('thorSave'+i,JSON.stringify(normalizeMeta(d.slots[i])));}if(d.opts)localStorage.setItem('thorOpts',JSON.stringify(d.opts));if(d.activeSave)localStorage.setItem('thorActiveSave',String(clamp(d.activeSave|0,1,3)));const dd=saveSlotData(activeSave);copyMeta(dd,META);try{loadOpts();}catch(e){}renderSaveCards();refreshMenuDev();conqTick();alert('saves importados com sucesso!');blip('sine',600,900,.16,.06);}catch(e){alert('arquivo de saves inválido.');}};rd.readAsText(file);}
function deleteSaveSlot(slot){if(slot<1||slot>3)return;if(!confirm('deletar o save '+slot+'? todo o progresso desse slot será perdido.'))return;stashBackup(slot);/* v0.9.13: sempre guarda um backup antes de apagar */try{localStorage.removeItem('thorSave'+slot);}catch(e){}if(activeSave===slot){activeSave=1;const d=saveSlotData(1);copyMeta(d,META);localStorage.setItem('thorActiveSave','1');}renderSaveCards();refreshMenuDev();}
/* v1.1.0: LIVRO DOS CONDENADOS — cada save é uma folha: condição,
   última descida, karma e estado da alma. A folha queimada só existe
   para quem já foi convidado. */
function renderSaveCards(){
const box=ov('saveCards');if(!box)return;
box.innerHTML='';
const stateName=function(k){return k>=6?'PESADA DE PECADO':k>=4?'MARCADA':'INDETERMINADO';};
for(let i=1;i<=3;i++){
const d=saveSlotData(i),exists=slotExists(i);
const bk=backupExists(i);
const el=document.createElement('div');
el.className='card page'+(exists?'':' empty');
const nm=d.name?('«'+d.name+'»'):'(sem nome)';
const karma=clamp(2+Math.floor((d.kills||0)/150)+(d.wins?2:0)-Math.floor((d.deaths||0)/5),0,8);
const bar='█'.repeat(karma)+'░'.repeat(8-karma);
const desc=d.schoolDone?'ALÉM DO RIO':((d.descidas||0)>0?'CÍRCULO '+roman(1+Math.min(3,d.descidas))+'?':'???');
el.innerHTML='<h3>FOLHA '+i+(i===activeSave?' · EM CHAMAS':'')+'</h3><p class="pgName">'+nm+'</p>'
+'<div class="pgRow">Condição: '+(exists?'em julgamento':'desconhecida')+'</div>'
+'<div class="pgRow">Última descida: '+desc+'</div>'
+'<div class="pgRow">Karma: <span class="kbar">'+bar+'</span></div>'
+'<div class="pgRow">Estado da alma: '+stateName(karma)+'</div>'
+'<div class="pgRow dim">abates '+(d.kills||0)+' · almas '+(d.souls||0)+' · descidas '+(d.descidas||0)+' · vitórias '+(d.wins||0)+'</div>'
+'<div style="margin-top:12px"><button class="mini useSave">'+(i===activeSave?'seguir desta folha':'carregar folha')+'</button> <button class="mini renSave">renomear</button> <button class="mini delSave">queimar</button></div>'
+(bk?'<div style="margin-top:6px"><button class="mini rstSave">restaurar cinza (backup)</button></div>':'');
el.querySelector('.useSave').addEventListener('click',()=>loadSaveSlot(i));
el.querySelector('.renSave').addEventListener('click',()=>renameSaveSlot(i));
el.querySelector('.delSave').addEventListener('click',()=>deleteSaveSlot(i));
const rb=el.querySelector('.rstSave');if(rb)rb.addEventListener('click',()=>restoreBackup(i));
box.appendChild(el);
}
if(META.casteloCleared){
const el=document.createElement('div');
el.className='card page burned';
el.innerHTML='<h3>FOLHA QUEIMADA</h3><p class="pgName" style="text-decoration:line-through;color:#a52a3a">BRUNO</p>'
+'<div class="pgRow">Condição: ele está em casa</div>'
+'<div class="pgRow">Última descida: a casa lembra</div>'
+'<div class="pgRow">Karma: <span class="kbar">████░░░░</span></div>'
+'<div class="pgRow">Estado da alma: NÃO INTERROGUE A FOLHA</div>';
box.appendChild(el);
}
}
loadMeta();
/* v0.9.9: RELÍQUIAS REFEITAS — muito mais fortes e diversas (nada de "só vida"),
   e NÃO acumulam mais: com 2+, a sala inicial vira a SALA DAS RELÍQUIAS e você
   escolhe exatamente UMA por descida. Difíceis de escolher de propósito. */
const UNLOCKS=[
{id:'heart',name:'CORAÇÃO CINZENTO',desc:'+2 corações máximos e cura total · a primeira morte da descida é desfeita — você volta com metade da vida',need:'morra 3 vezes',chk:m=>m.deaths>=3,apply(){player.maxHp+=50;player.hp=player.maxHp;game.relicRevive=true;}},
{id:'fury',name:'FÚRIA ANTIGA',desc:'+35% de dano · relâmpagos caem sozinhos sobre os demônios sem parar (grau II)',need:'500 abates no total',chk:m=>m.kills>=500,apply(){P.dmgMult*=1.35;P.lightning=Math.max(P.lightning,2);}},
{id:'swift',name:'PATAS DE VENTO',desc:'+25% de velocidade · o desvio recarrega 40% mais rápido — você quase não é alcançável',need:'derrote o Cérbero',chk:m=>m.wins>=1,apply(){P.speedMult*=1.25;P.dashCdMult*=.6;}},
{id:'magnet',name:'ÍMÃ DO VÓRTICE',desc:'almas voam até você de longe e valem +50% — a riqueza vira poder nas lojas',need:'colete 400 almas',chk:m=>m.souls>=400,apply(){P.magnetMult+=1.4;P.soulMult*=1.5;}},
{id:'haggler',name:'REGATEADOR',desc:'-30% nos preços · a primeira compra de cada loja vem com um pacto grátis do ERRANTE',need:'varra 16 salas',chk:m=>m.rooms>=16,apply(){game.relicHaggler=true;}},
{id:'shard',name:'FRAGMENTO DO ERRO',desc:'+25% de almas · um escudo de glitch anula o próximo golpe que for tomar — reergue a cada 25 abates',need:'delete o ERRO 404',chk:m=>m.e404>=1,apply(){P.soulMult*=1.25;game.relicShard=true;game.relicShieldUp=true;game.relicShieldK=0;}}];
function relicUnlocked(id){const u=UNLOCKS.find(x=>x.id===id);return u?u.chk(META):false;}
function metaTick(){
let changed=false;
for(const u of UNLOCKS){
if(!META.done[u.id]&&u.chk(META)){
META.done[u.id]=1;changed=true;
if(game.state==='play')game.banner={type:'small',txt:'RELÍQUIA DESBLOQUEADA',sub:u.name+' — '+u.desc,t:0,dur:3.2};
}
}
if(changed)saveMeta();
conqTick();/* v0.9.13: conquistas checadas junto das relíquias */
}
/* ============ v0.9.13: CONQUISTAS ============
   Completar TODAS libera o MODO NERDCIRNO67 (que não concede pactos).
   v1.0.0: as descrições viraram DICAS abrangentes — nada de passo a passo;
   o jogador monta a própria teoria de como desbloquear. */
const CONQS=[
{id:'sangue',n:'PRIMEIRO SANGUE',d:'todo veredito começa com um primeiro nome riscado',chk:m=>m.kills>=1,p:m=>[Math.min(m.kills,1),1]},
{id:'matador',n:'MATADOR',d:'o Inferno anota cada alma que você colhe',chk:m=>m.kills>=250,p:m=>[Math.min(m.kills,250),250]},
{id:'genocida',n:'GENOCIDA',d:'há números que os grimórios não têm página para escrever',chk:m=>m.kills>=1500,p:m=>[Math.min(m.kills,1500),1500]},
{id:'descida1',n:'A PRIMEIRA DESCIDA',d:'há um fundo. dizem que você já o viu',chk:m=>m.wins>=1,p:m=>[Math.min(m.wins,1),1]},
{id:'descida3',n:'HÁBITO FÚNEBRE',d:'a descida vira hábito para quem não tem mais para onde voltar',chk:m=>m.wins>=3,p:m=>[Math.min(m.wins,3),3]},
{id:'barqueiro',n:'PAGUE O PEDÁGIO',d:'o pedágio do rio pode ser cobrado à força',chk:m=>(m.caronteKills||0)>=1,p:m=>[Math.min(m.caronteKills||0,1),1]},
{id:'erro',n:'DELETADO',d:'o que os registros apagaram ainda pode ser apagado de vez',chk:m=>(m.e404||0)>=1,p:m=>[Math.min(m.e404||0,1),1]},
{id:'cavaleiros',n:'APOCALIPSE',d:'quatro nomes antigos, quatro montarias — uma única sentença',chk:m=>m.knights&&m.knights.conquest>=1&&m.knights.war>=1&&m.knights.famine>=1&&m.knights.death>=1,p:m=>{const k=m.knights||{};return [[['conquest'],['war'],['famine'],['death']].filter(x=>(k[x[0]]||0)>=1).length,4];}},
{id:'rei',n:'XAQUE-MATE',d:'o velho jogador guarda a última peça do próprio tabuleiro',chk:m=>!!m.kingsoul},
{id:'escola',n:'RECREIO TERMINADO',d:'há um lugar dos vivos esquecido dentro do Inferno — sobreviva a ele',chk:m=>!!m.schoolDone},
  {id:'escolafogo',n:'A ESCOLA EM CHAMAS',d:'colocou os 8 fragmentos no pentagrama, sobreviveu ao ritual e fugiu da escola em chamas',chk:m=>!!m.schoolChamas},
{id:'castelo',n:'O CONVITE',d:'um convite nunca é recusado — nem deixado inacabado',chk:m=>!!m.casteloCleared},
{id:'inferno',n:'PELO INFERNO',d:'existe uma forma mais funda e mais vermelha de descer',chk:m=>!!m.hellSeen},
{id:'reliquias',n:'COLECIONADOR',d:'os pilares antigos reconhecem quem os desperta todos',chk:m=>UNLOCKS.every(u=>u.chk(m)),p:m=>[UNLOCKS.filter(u=>u.chk(m)).length,UNLOCKS.length]},
{id:'zoologico',n:'ZOOLÓGICO DO INFERNO',d:'o grimório tem páginas em branco esperando por nomes',chk:m=>Object.keys(m.seen||{}).length>=20,p:m=>[Math.min(Object.keys(m.seen||{}).length,20),20]},
/* v0.9.16: forja de builds */
{id:'kaizo1',n:'FORMA BRANCA',d:'o que voltou branco do Abismo não é mais o que era',chk:m=>(m.kaizoKills||0)>=1,p:m=>[Math.min(m.kaizoKills||0,1),1]},
{id:'kaizo5',n:'CAÇADOR DE KAIZO',d:'os proibidos têm nome — cole as sentenças',chk:m=>(m.kaizoKills||0)>=5,p:m=>[Math.min(m.kaizoKills||0,5),5]},
{id:'syn3',n:'ALQUIMISTA',d:'pactos de naturezas distintas deixam marcas no ar',chk:m=>(m.synFound||0)>=3,p:m=>[Math.min(m.synFound||0,3),3]},
{id:'syn8',n:'GRIMÓRIO DAS MARCAS',d:'o grimório das marcas aceita tinta nova',chk:m=>(m.synFound||0)>=8,p:m=>[Math.min(m.synFound||0,8),8]},
{id:'spec1',n:'ESCOLHIDO',d:'três pactos da mesma natureza sussurram um nome seu',chk:m=>(m.specs||0)>=1,p:m=>[Math.min(m.specs||0,1),1]},
{id:'spec5',n:'PANTEÃO',d:'há mais vozes do que uma esperando por três sinais iguais',chk:m=>(m.specs||0)>=5,p:m=>[Math.min(m.specs||0,5),5]},
{id:'arsenal',n:'ARSENAL PESSOAL',d:'carregue, use, troque — o Inferno não gosta de mãos vazias',chk:m=>(m.actUses||0)>=10,p:m=>[Math.min(m.actUses||0,10),10]},
{id:'milalmas',n:'MIL ALMAS',d:'uma bolsa pesando mil almas muda a forma de andar',chk:m=>(m.bestSouls||0)>=1000,p:m=>[Math.min(m.bestSouls||0,1000),1000]}
/* v1.4.7: MÃOS VAZIAS — 14 registros novos para o acervo. Como sempre: o nome
   só aparece depois de conquistado; antes disso o jogador recebe APENAS UMA
   DICA (e a régua, quando existe número). Nada de passo a passo. */
,{id:'mortal',n:'ALUNO DA MORTE',d:'voltar já não é acontecimento — é rotina',chk:m=>(m.deaths||0)>=25,p:m=>[Math.min(m.deaths||0,25),25]}
,{id:'veterano',n:'OFÍCIO DE DESCER',d:'a escada que só desce já reconhece seus passos de cima',chk:m=>(m.wins||0)>=10,p:m=>[Math.min(m.wins||0,10),10]}
,{id:'matanca',n:'O NÚMERO NÃO CABE',d:'há contagens que transbordam a página — a sua transbordou',chk:m=>(m.kills||0)>=3000,p:m=>[Math.min(m.kills||0,3000),3000]}
,{id:'peregrino',n:'PEREGRINO SEM FÉ',d:'o caminho é sempre o mesmo; o que muda é o que você carrega — ou deixa de carregar',chk:m=>(m.descidas||0)>=25,p:m=>[Math.min(m.descidas||0,25),25]}
,{id:'cartografo',n:'CARTÓGRAFO DO ABISMO',d:'você desenha com os pés o mapa que o Inferno esconde',chk:m=>(m.rooms||0)>=100,p:m=>[Math.min(m.rooms||0,100),100]}
,{id:'usurario',n:'O BRILHO QUE NÃO SAI',d:'moeda que passa demais pela mão acaba ficando na pele',chk:m=>(m.souls||0)>=2500,p:m=>[Math.min(m.souls||0,2500),2500]}
,{id:'travessa',n:'O PEDÁGIO DE SEMPRE',d:'o barqueiro já não olha nos seus olhos — ele reconhece quem volta para cobrar',chk:m=>(m.caronteKills||0)>=3,p:m=>[Math.min(m.caronteKills||0,3),3]}
,{id:'limpeza',n:'LIMPEZA PROFUNDA',d:'há registros que insistem em voltar — e alguém que insiste em apagar',chk:m=>(m.e404||0)>=3,p:m=>[Math.min(m.e404||0,3),3]}
,{id:'cavalo',n:'PRIMEIRA MONTARIA',d:'quatro montarias esperam no fim do caminho; uma delas já conheceu o chão',chk:m=>{const k=m.knights||{};return(k.conquest||0)>=1||(k.war||0)>=1||(k.famine||0)>=1||(k.death||0)>=1;}}
,{id:'vozdorio',n:'A VOZ NO RIO',d:'alguns recebem uma voz do rio — e aprendem a temê-la',chk:m=>!!m.darkSoul}
,{id:'catalogo',n:'O CATÁLOGO DA CARNE',d:'o acervo se preenche com tudo aquilo que você já foi um dia',chk:m=>Object.keys(m.acq||{}).length>=50,p:m=>[Math.min(Object.keys(m.acq||{}).length,50),50]}
,{id:'dedos',n:'DEDOS QUEIMADOS',d:'o segredo nunca foi segurar — foi usar até doer',chk:m=>(m.actUses||0)>=50,p:m=>[Math.min(m.actUses||0,50),50]}
,{id:'bolsa',n:'A BOLSA ENFORCA',d:'há um peso que a alma agradece — até doer a costura',chk:m=>(m.bestSouls||0)>=2000,p:m=>[Math.min(m.bestSouls||0,2000),2000]}
,{id:'coro',n:'O CÔRO COMPLETO',d:'todos os nomes já sussurraram o seu, ao mesmo tempo',chk:m=>(m.specs||0)>=10,p:m=>[Math.min(m.specs||0,10),10]}
];
function conqCount(){return META.conq?CONQS.filter(c=>META.conq[c.id]).length:0;}
/* v0.9.16: notificação de TROFÉU — visual dourado distinto das mensagens comuns */
function grantConq(id){if(!META.conq)META.conq={};if(META.conq[id])return;const c=CONQS.find(x=>x.id===id);if(!c)return;META.conq[id]=1;saveMeta();
conqToast(c);
try{sfx.levelup();blip('sine',784,1319,.4,.12);}catch(e){}}
function conqToast(c){
/* toast em canvas + brilho: desenho em drawBanner type 'trophy' */
game.banner={type:'trophy',txt:c.n,sub:c.d,t:0,dur:3.0};
sparks(player.x,player.y-30,'#ffd9a0',18,260,.8,3.5,true);
}
function conqTick(){let hit=false;for(const c of CONQS){try{if(!(META.conq&&META.conq[c.id])&&c.chk(META)){META.conq=META.conq||{};META.conq[c.id]=1;hit=true;if(game.state==='play'||game.state==='school')conqToast(c);}}catch(e){}}if(hit){saveMeta();refreshMenuDev();}}
conqTick();/* v0.9.13: conquistas retroativas ao carregar o save */
let _penMsg=null;let _penCheat=null;/* v1.1.4: recado da senha secreta */
function metaListText(){
const n=UNLOCKS.filter(u=>u.chk(META)).length;
const nc=conqCount();
let s='RELÍQUIAS '+n+'/'+UNLOCKS.length+' — '+UNLOCKS.map(u=>u.chk(META)?('<b>'+u.name+'</b>'):u.name.replace(/./g,'·')).join(' · ')+'<br>abates totais '+META.kills+' · descidas '+META.deaths+' · vitórias '+META.wins;
s+='<br>CONQUISTAS <b>'+nc+'/'+CONQS.length+'</b>'+(nc>=CONQS.length?' — <span style="color:#c9a0ff">MODO NERDCIRNO67 LIBERADO</span>':' — complete todas para liberar o modo nerdcirno67');
if(game.dev)s+='<br><span class="pen">◆ NERDCIRNO67 ATIVO — [1..9] cheats · [0] sala de testes · runs sem pactos</span>';
if(_penMsg&&Date.now()-_penMsg<5200)s+='<br><span style="color:#d9465a">MODO NERDCIRNO67 BLOQUEADO — conquistas '+nc+'/'+CONQS.length+'</span>';
if(_penCheat&&Date.now()-_penCheat<9000)s+='<br><span style="color:#c9a0ff">ou vc pode ser um chato que nn quer as conquistas...faça oque quiser</span>';
return s;
}
function refreshMenuDev(){const ml=ov('metaList');if(ml)ml.innerHTML=metaListText();}
/* ============ estado ============ */
const game={state:'menu',paused:false,t:0,waveT:0,waveState:'intro',
spawnT:0,banner:null,headBanner:null,kills:0,souls:0,
floor:1,usedMinis:[],mapRooms:[],roomIdx:-1,extraIdx:-1,roomKind:'combat',globalRoom:0,threat:1,portal:null,
doors:[],absRects:[{x:0,y:0,w:W,h:H}],absMain:{x:0,y:0,w:W,h:H},
decor:[],roomWindow:null,windowScene:null,puzzle:null,seenGlyphs:[],penumbra:null,forceNext:null,meleeHitT:0,meleeHitRk:false,
fallK:-1,fallFrom:null,fallTo:null,fallTarget:null,roomFade:0,treasureOpen:false,
corridorT:0,corridorProg:0,corridorW:260,corridorLen:0,
shopItems:[],shopNear:null,roomEvent:null,e404T:0,e404Spawned:false,
reiT:0,reiX:0,reiY:0,reiSpawned:false,reiFought:false,kingsoul:false,kingT:8,
rkP2:false,rkUltT:0,rkUlt:null,
/* Cavaleiros do Apocalipse — cutscene + estado de triumfo */
knightIntro:null,knightIntroT:0,knightSpawned:false,
knightDeath:null,knightT:0,knightX:0,knightY:0,knightDead:null,knightTriunfo:null,
knightHearts:[],knightTimer:0,knightHeartsCollected:0,knightHeartsNeeded:0,
knightInvuln:false,
dev:false,god:false,
roomQueue:[],
weapon:null,hard:false,hasShot:false,hasBite:false,hasParry:false,
/* v0.9.3: sistema unificado de itens ativos — apenas 1 por run */
activeItem:null,activeCd:0,activeMaxCd:0,
/* efeitos temporários dos itens ativos */
estrelaT:0,furiaT:0,furiaDur:0,
/* v0.9.6: novos itens e debuffs */
bloodShots:false,tearShots:false,fomeDrain:false,falseHeart:false,glassBody:false,blindHaste:false,isolation:false,endlessHunger:false,hungerT:0,
region:'penumbra',postCerberusFloors:0,limboPending:false,limboLoadT:0,limboLoadDur:2.6,gatePending:false, /* v1.5.3: TESTE — porta direta para o caminho do portão (v1.5.9: botão de volta) */
/* ==== v0.9.1: O MUNDO — magia de parar o tempo ==== */
hasWorld:false,worldT:0,worldDur:3,worldLevel:0,
elements:{gelo:0,fogo:0,veneno:0,trovao:0},elemCycle:0,multi:0,
parryCharge:0,parryLock:false,fome:false,fomeK:0,
ymir:false,incendio:false,berserk:false,storm:false,iraodin:false,heimdall:false,miasma:false,chain2:false,
biteFire:false,biteFrost:false,biteVenom:false,biteQuake:false,
novaT:2.5,stakeT:2.5,burstT:4,lightMagT:4,darkAng:0,shockT:2,
up:{},autoFire:false,soulAcc:0,keeper:null,
shake:0,hitstop:0,flash:0,hurtV:0,bossIntroT:0,introFlags:{},
lightT:3,deadT:0,overlayShown:false,
endPhase:null,endT:0,playerAlpha:1,darkSoul:null,enterFrom:null,gateCreak:0,
builder:{sel:'sh',items:[]},builderLive:false,deadTaunt:'',deadFaceX:0,deadFaceY:0,
/* v0.9.7: O OBSERVADOR — inferno / glitch / olhos */
hellMode:false,hellEyesT:0,glitchT:0,hellEyes:[],
/* ==== v0.9.16: FORJA DE BUILDS ==== */
slowMoT:0,slowMoDur:0,           /* AMPULHETA — tempo dilatado dos inimigos (loop-safe) */
shieldHits:0,shieldT:0,          /* ÉGIDE — bloqueia N hits */
regenT:0,regenDur:0,regenAcc:0,  /* SEMENTE DA VIDA — cura contínua */
fragilT:0,fragilDur:0,           /* DECRETO — inimigos recebem +40% dano */
decoyT:0,decoyDur:0,             /* IMAGEM ESPELHADA — chama os inimigos */
etShotT:0,etShotDur:0,           /* MUNIÇÃO ÉTERICA — tiros perfurantes */
transfT:0,transfDur:0,           /* FORMA DA FERA — transformação */
specs:{},psyn:{},                /* especializações ativas / sinergias de par descobertas */
actUses:0,kaizoKills:0,synFound:0,
actMinionSeq:0};
const P={dmgMult:1,rateMult:1,reachMult:1,lightning:0,speedMult:1,biteMult:1,biteRange:1,
magnetMult:1,dashCdMult:1,invBonus:0,soulMult:1,parryRadius:110,
chainsaw:0,sword:0,nova:0,stakes:0,burst:0,dark:0,light:0,explShot:0,shock:0};
const DASH_CD=3,INV_DASH=1.0;
const frenzyDur=()=>game.hard?8:6;
let bullets=[],ebullets=[],enemies=[],pickups=[],particles=[],texts=[],bolts=[],arcs=[];
let vapers=[],beamShots=[],mouseHeld=false;/* v1.0.0: vapor do pacto, feixe carregado, estado do mouse */
let hammers=[],biteFxs=[],swordFxs=[],novaFxs=[],stakeFxs=[];
let spawnMarks=[],geyserMarks=[],rings=[],shockwaves=[];
/* v0.9.16: TELEGRÁFICOS — zonas de aviso dos ataques KAIZO (e marcas de perigo).
   Cada entrada: {x,y,r,t,dur,c,shape:'circle'|'line'|'cross',ang,cb} — quando t>=dur,
   executa cb() (a explosão/rajada). Congelados durante O MUNDO (justo — o aviso espera). */
let telegraphs=[];
/* v0.9.16: minions temporários de itens ativos (corvos, imagem espelhada) */
let actMinions=[];
let thrownSaw=null,lightBeam=null;
let heartsPopT=0,heartsPopIdx=0;
/* v1.4.6: HITBOX DE VERDADE — player.hitR é a hitbox de DANO. O r:11 continua
para movimento/portas/itens; qualquer dano recebido usa hitR — aperte SHIFT
para ver o circulo. v1.6.0: hitbox menor ainda — 4px (era 5px): um tiro
agora passa raspando onde antes acertava. O ponto carmesim SÓ aparece
com SHIFT segurado (FOCO) — igual sempre foi, agora explícito. */
const player={x:W/2,y:H*.75,r:11,hitR:4,hp:100,maxHp:100,inv:0,dashT:0,dashCd:0,dashAng:0,angle:-Math.PI/2,
shotT:0,biteT:0,slowT:0,walkT:0,dustT:0,dead:false,mvx:0,mvy:0,
sawT:0,swordT:0,sawAim:0,sawAnim:0,sawThrowCd:0};
/* v1.5.0: câmera do mundo + estado da transição deslizante/apresentação VS */
game.camX=0;game.camY=0;game.slide=null;game._vsPending=null;game._vs=null;
/* ============ geração do mapa ============ */
const ROOM_SUBS=['as sombras se aglomeram','o cheiro de enxofre engrossa','algo se arrasta no escuro','os olhos acendem além das linhas','o silêncio pesa demais','os demônios aprenderam a esperar'];
const FLOOR_SUBS=['','o primeiro degrau da descida','as paredes trocaram de lugar','algo pesado ronda os corredores','o ar ficou grosso demais para respirar','a última descida — o guardião aguarda'];
/* ==== FALSO PARAÍSO — legendas dos andares 2+ ==== */
const FLOOR_SUBS_PARADISE=['','o primeiro degrau da descida',
  'a luz parecia sagrada — parecia',
  'o paraíso tem rachaduras finas',
  'as estátuas já não são o que pareciam',
  'as criptas respiram junto com você',
  'o céu branco já não é céu',
  'o altar já não espera por orações',
  'o guardião veste roupas de santo'
];
/* == interpolação de cores hex (#rrggbb) — usada pelo corredor e paredes espelhadas == */
function lerpColor(a,b,t){
  t=clamp(t,0,1);
  const ar=parseInt(a.slice(1,3),16),ag=parseInt(a.slice(3,5),16),ab=parseInt(a.slice(5,7),16);
  const br=parseInt(b.slice(1,3),16),bg=parseInt(b.slice(3,5),16),bb=parseInt(b.slice(5,7),16);
  const r=Math.round(lerp(ar,br,t)),g=Math.round(lerp(ag,bg,t)),bl=Math.round(lerp(ab,bb,t));
  return 'rgb('+r+','+g+','+bl+')';
}
function needsClear(kind){return kind==='combat'||kind==='challenge'||kind==='miniboss'||kind==='sboss';}
function countCleared(){return game.mapRooms.filter((r,i)=>r.cleared&&i!==game.extraIdx).length;}
function genRoomShape(kind){
/* v1.5.0: DANMAKU = salas efetivamente maiores (~1.35×largura · ~1.25×altura).
   FÁCIL mantém as dimensões de sempre (perfil legado). */
const SC=dmk()?{w:1.35,h:1.25}:{w:1,h:1};
if(kind==='boss'){
  const bw=Math.round(W*SC.w),bh=Math.round(H*SC.h);
  return{rects:[{x:0,y:0,w:bw,h:bh}],bw:bw,bh:bh,dmk:SC.w>1};
}
if(kind==='start'){const w=Math.round(640*SC.w),h=Math.round(430*SC.h);return{rects:[{x:0,y:0,w:w,h:h}],bw:w,bh:h,dmk:SC.w>1};}
const big=kind==='miniboss'||kind==='challenge';
const mw=Math.round((big?irnd(640,760):irnd(540,700))*SC.w);
const mh=Math.round((big?irnd(380,430):irnd(330,410))*SC.h);
const rects=[{x:0,y:0,w:mw,h:mh}];
const want=irnd(0,3);
const usedSides=[];
let tries=0,alc=0;
while(alc<want&&tries++<50){
const side=irnd(0,3);
if(usedSides.includes(side))continue;
if(side===0||side===2){
const aw=Math.round(irnd(190,290)*SC.w),ah=Math.round(irnd(110,155)*SC.h);
if(aw>mw-220)continue;
let ax=-1;
for(let t=0;t<14;t++){
const c=irnd(26,mw-aw-26);
if(c+aw<mw/2-100||c>mw/2+100){ax=c;break;}
}
if(ax<0)continue;
rects.push(side===0?{x:ax,y:-ah+26,w:aw,h:ah}:{x:ax,y:mh-26,w:aw,h:ah});
usedSides.push(side);alc++;
}else{
const aw=Math.round(irnd(150,210)*SC.w),ah=Math.round(irnd(150,235)*SC.h);
if(ah>mh-200)continue;
let ay=-1;
for(let t=0;t<14;t++){
const c=irnd(24,mh-ah-24);
if(c+ah<mh/2-80||c>mh/2+80){ay=c;break;}
}
if(ay<0)continue;
rects.push(side===3?{x:-aw+26,y:ay,w:aw,h:ah}:{x:mw-26,y:ay,w:aw,h:ah});
usedSides.push(side);alc++;
}
}
let minx=0,miny=0,maxx=mw,maxy=mh;
const recompute=()=>{minx=0;miny=0;maxx=mw;maxy=mh;for(const r of rects){minx=Math.min(minx,r.x);miny=Math.min(miny,r.y);maxx=Math.max(maxx,r.x+r.w);maxy=Math.max(maxy,r.y+r.h);}};
recompute();
/* v1.5.0: o teto do bounding acompanha o escalonamento (danmaku cabe mais sala) */
const CAPW=Math.round(1150*SC.w),CAPH=Math.round(556*SC.h);
while((maxx-minx>CAPW||maxy-miny>CAPH)&&rects.length>1){rects.pop();recompute();}
const rs=rects.map(r=>({x:r.x-minx,y:r.y-miny,w:r.w,h:r.h}));
return{rects:rs,bw:maxx-minx,bh:maxy-miny,dmk:SC.w>1};
}
function genMap(){
 const rooms=[],grid={};
 const key=(x,y)=>x+','+y;
 function add(x,y,kind){
  const r={gx:x,gy:y,kind:kind,visited:false,cleared:false,e404:false,chestDropped:false,chestTaken:false,hasPortal:false,miniType:null,pzSolved:false,flavor:null,glyphSym:-1,pzType:null,shape:genRoomShape(kind),doors:{n:-1,e:-1,s:-1,w:-1}};
  rooms.push(r);grid[key(x,y)]=rooms.length-1;return r;
 }
 add(0,0,'start');
 const target=game.floor===1?irnd(6,8):irnd(11,14)+Math.min(Math.floor(game.floor/2),2);
 const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
 let guard=0;
 while(rooms.length<target&&guard++<900){
  const base=pick(rooms);
  const d=pick(dirs);
  const nx=base.gx+d[0],ny=base.gy+d[1];
  if(grid[key(nx,ny)]!==undefined)continue;
  if(Math.abs(nx)>3||ny<-2||ny>2)continue;
  let nb=0;for(const dd of dirs)if(grid[key(nx+dd[0],ny+dd[1])]!==undefined)nb++;
  if(nb>1&&Math.random()<.7)continue;
  add(nx,ny,'combat');
 }
 const combat=rooms.filter(r=>r.kind==='combat');
 for(let i=combat.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=combat[i];combat[i]=combat[j];combat[j]=t;}
 const isAdj=r=>Math.abs(r.gx)+Math.abs(r.gy)===1;
 const far=combat.filter(r=>!isAdj(r));
 let fi=0;
 const takeFar=()=>fi<far.length?far[fi++]:null;
 /* v0.9.9: RECOMPENSA GARANTIDA por andar — antes a sala de tesouro era 55%
    e o boss do mapa podia faltar no andar 1 (far.length>2).
    Andar 1: UMA sala do baú dando 1 item de raridade aleatória (raros = mais raros).
    Andar 2+: o item mora numa SALA DE DESAFIO garantida — complete-a para levar. */
 const takeAnyFar=()=>{const rm=takeFar();if(rm)return rm;const rest=rooms.filter(r=>r.kind==='combat');return rest.length?rest[Math.floor(Math.random()*rest.length)]:null;};
 if(game.floor===1){const rm=takeAnyFar();if(rm)rm.kind='treasure';}
 if(far.length>1){takeFar().kind='shop';}
 /* boss do mapa em TODO andar — inclusive no primeiro.
    v1.3.3: a sala do boss é a ÚLTIMA do andar — um BECO SEM SAÍDA com uma
    única entrada; nada existe além dela (nenhuma porta para outro cômodo). */
 {
  const miniPool=['mb','ex','vi','gz'].filter(t=>game.usedMinis.indexOf(t)<0);
  const nbCount=(x,y)=>{let n=0;for(const dd of dirs)if(grid[key(x+dd[0],y+dd[1])]!==undefined)n++;return n;};
  const leaves=combat.filter(r=>r.kind==='combat'&&nbCount(r.gx,r.gy)===1);
  leaves.sort((a,b)=>(Math.abs(b.gx)+Math.abs(b.gy))-(Math.abs(a.gx)+Math.abs(a.gy)));
  let rm=leaves.find(r=>!isAdj(r))||leaves[0]||null;
  /* v1.3.3 (fix): a sala escolhida SAI da fila takeFar — sem isso o fallback
     da sala secreta/sacrifício podia recebê-la e sobrescrever o kind */
  if(rm){const fi2=far.indexOf(rm);if(fi2>=0)far.splice(fi2,1);}
  if(!rm){
   /* nenhuma folha livre: cria uma célula nova com exatamente 1 vizinho */
   let best=null,bd=-1;
   for(let gx=-4;gx<=4;gx++)for(let gy=-3;gy<=3;gy++){
    if(grid[key(gx,gy)]!==undefined)continue;
    if(nbCount(gx,gy)!==1)continue;
    const dd=Math.abs(gx)+Math.abs(gy);
    if(dd>bd){bd=dd;best={gx,gy};}
   }
   if(best)rm=add(best.gx,best.gy,'combat');
  }
  if(rm){const t=(game.region==='vulcan')?'ferreiro':(miniPool.length?pick(miniPool):pick(['mb','ex','vi','gz']));game.usedMinis.push(t);rm.kind='miniboss';rm.miniType=t; /* v1.3.0: a Garganta tem o FERREIRO das Almas */
    /* v0.9.13: KAIZO — boss que você JÁ enfrentou nesta run reaparece na versão
       dificil: nome KAIZO, textura branca e status inflados.
       v1.5.1: no MODO KAIZO TODOS os bosses nascem kaizo de cara (é a proposta
       do modo) — e o que REPETE vira a versão NEO (ataques quase contínuos). */
    const _rep=(game.facedMinis||[]).indexOf(t)>=0;
    rm.kaizo=!!game.kaizoRun||_rep;
    rm._neo=_rep;
    game.facedMinis.push(t);
  }
 }
 /* sala de desafio: garantida do andar 2 em diante (fonte do item); no 1º fica opcional */
 if(game.floor>1){const rm=takeAnyFar();if(rm)rm.kind='challenge';}
 else if(Math.random()<Math.min(.45*secretMul(),.85)){const rm=takeFar();if(rm)rm.kind='challenge';}
 /* v1.3.3: SALA SECRETA ISOLADA — um cômodo solto no mapa, NÃO conectado a
    NENHUMA sala: entra-se pela parede rachada do cômodo vizinho (fagulha) e
    de dentro não existe outra porta — só o caminho de volta. Conteúdo: uma
    coisa só (item, mais vida ou o velho rei). */
 if(Math.random()<Math.min(.35*secretMul(),.85)){
  const nbS=(x,y)=>{let n=0;for(const dd of dirs)if(grid[key(x+dd[0],y+dd[1])]!==undefined)n++;return n;};
  const bossRoomS=rooms.find(r=>r.kind==='miniboss');
  const DIRNAME={'0,-1':'n','1,0':'e','0,1':'s','-1,0':'w'};
  const cells=[];
  for(const r of rooms){
   if(r===bossRoomS||r.isolated)continue;
   for(const dd of dirs){
    const nx=r.gx+dd[0],ny=r.gy+dd[1];
    if(grid[key(nx,ny)]!==undefined)continue;
    if(Math.abs(nx)>4||ny<-3||ny>3)continue;
    if(nbS(nx,ny)!==1)continue;
    let touchBoss=false;
    if(bossRoomS)for(const d2 of dirs){const b=grid[key(nx+d2[0],ny+d2[1])];if(b!==undefined&&rooms[b]===bossRoomS)touchBoss=true;}
    if(touchBoss)continue;
    cells.push({r,d:dd,nx,ny});
   }
  }
  if(cells.length){
   const c=pick(cells);
   const sr=add(c.nx,c.ny,'secret');
   sr.isolated=true;
   sr.hostIdx=rooms.indexOf(c.r);
   sr.hostDir=DIRNAME[c.d[0]+','+c.d[1]];
   sr.secretGift=null;
  }else{const rm=takeFar();if(rm&&rm.kind==='combat')rm.kind='secret';} /* fallback raro: esquema antigo */
 }
 /* v0.9.6: sala de sacrifício — altar de sangue */
 if(Math.random()<.30){const rm=takeFar();if(rm&&rm.kind==='combat')rm.kind='sacrifice';}
 /* — ritmo: o vazio também é design — */
 let rem=combat.filter(r=>r.kind==='combat');
 const remFar=rem.filter(r=>Math.abs(r.gx)+Math.abs(r.gy)>1);
 const pool=remFar.length>=4?remFar:rem;
 const FLAV=[['ruin',3],['memory',3],['souls',2],['silent',2]];
 const nEmpty=clamp(Math.round(pool.length*rnd(.2,.38)),1,3);
 for(let i=0;i<nEmpty&&pool.length;i++){
  const idx=Math.floor(Math.random()*pool.length);
  const rm=pool.splice(idx,1)[0];
  rm.kind='empty';
  let tot=0;for(const f of FLAV)tot+=f[1];
  let rr=rnd(tot),fl='ruin';
  for(const f of FLAV){rr-=f[1];if(rr<=0){fl=f[0];break;}}
  rm.flavor=fl;
 }
 /* marcas antigas — pistas para o puzzle dos ecos */
 const gs=[0,1,2,3,4,5];
 for(let i=gs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=gs[i];gs[i]=gs[j];gs[j]=t;}
 let gi=0;
 for(const rm of rooms)if(rm.kind==='empty'&&rm.flavor!=='silent')rm.glyphSym=gs[gi++];
 const rest=rooms.filter(r=>r.kind==='combat'&&r.glyphSym<0);
 while(gi<3&&rest.length){
  const rm=rest.splice(Math.floor(Math.random()*rest.length),1)[0];
  rm.glyphSym=gs[gi++];
 }
 /* salas de puzzle — nem toda sala sem inimigo vira enigma */
 const rem2=combat.filter(r=>r.kind==='combat');
 const nPz=Math.min(irnd(1,2),Math.max(0,rem2.length-2));
 for(let i=0;i<nPz&&rem2.length;i++){
  const idx=Math.floor(Math.random()*rem2.length);
  const rm=rem2.splice(idx,1)[0];
  rm.kind='puzzle';
  if(game.floor===1)rm.pzType=pick(['plates','braziers','cores','box','box']);/* v1.2.0: CORES entra na rotação */
  else rm.pzType=gi>=3?pick(['plates','braziers','cores','box','echoes']):pick(['plates','braziers','cores','box']);
  if(Math.random()<.12)rm.pzType='quiz'; /* o enigma do saber é raro */
 }
 const dv={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]};
 for(const r of rooms){
  if(r.isolated)continue;
  for(const d in dv){
   const j=grid[key(r.gx+dv[d][0],r.gy+dv[d][1])];
   if(j!==undefined&&!rooms[j].isolated)r.doors[d]=j;
  }
 }
 /* v1.3.3: o único elo da sala secreta isolada — a rachadura no cômodo vizinho */
 for(const r of rooms){
  if(r.isolated&&r.hostIdx!=null&&r.hostDir)rooms[r.hostIdx].doors[r.hostDir]=rooms.indexOf(r);
 }
 return rooms;
}
/* ============ o Cérbero ============ */
const HEAD_DEFS=[
{name:'IGNIS',el:'fogo',c:'#ff8f3d',bone:'#d8c2a8',baseAng:-0.62,ph:0,pats:['fan','spiral','pulse','meteor','wave','pounce','volley','crosshair','nova'],baseCd:4.6,ears:'point'},
{name:'UMBRA',el:'sombra',c:'#e8455a',bone:'#d6cec2',baseAng:0,ph:2.1,pats:['charge','howl','curtain','blink','orbit','pounce','whirl','beam','fountain'],baseCd:5.4,ears:'horns'},
{name:'MORTEM',el:'morte',c:'#a8c24f',bone:'#c2c6a6',baseAng:0.62,ph:4.2,pats:['geyser','summon','mines','souls','snipe','pounce','chain','aura','rain'],baseCd:4.9,ears:'droop'}];
const HARD_HEAD_PATS={IGNIS:['wall'],UMBRA:['cross'],MORTEM:['ring']};
const boss={active:false,introLock:false,dying:false,phase2:false,
x:W/2,y:H*.32,r:80,angle:Math.PI/2,scale:0,fade:1,barT:0,bodyWob:0,
dashing:false,dashT:0,dashVx:0,dashVy:0,dashAng:0,recoverT:0,chargeAim:0,
frenzyActive:false,frenzyT:0,frenzyCd:7,frenzyPause:0,heads:[],activeHeadIdx:0,headTurn:0};
function resetBoss(){
boss.active=false;boss.introLock=false;boss.dying=false;boss.phase2=false;
boss.x=W/2;boss.y=H*.32;boss.angle=Math.PI/2;boss.scale=0;boss.fade=1;
boss.barT=0;boss.bodyWob=rnd(10);boss.dashing=false;boss.recoverT=0;boss.chargeAim=Math.PI/2;
boss.frenzyActive=false;boss.frenzyT=0;boss.frenzyCd=7;boss.frenzyPause=0;
boss.activeHeadIdx=0;boss.headTurn=0;
/* Cérbero mais duro: ~67% mais vida que antes */
const hhp=Math.round((game.hard?2500:1500)*1.0);
boss.heads=HEAD_DEFS.map(d=>({name:d.name,el:d.el,c:d.c,bone:d.bone,baseAng:d.baseAng,ph:d.ph,
pats:game.hard?d.pats.concat(HARD_HEAD_PATS[d.name]):d.pats,baseCd:d.baseCd,ears:d.ears,
hp:hhp,maxHp:hhp,alive:true,state:'idle',t:0,cd:0,patIdx:-1,pattern:null,recDur:.6,actDur:0,data:null,mouth:0,face:Math.PI/2,
desp:false,wake:1,howlT:0,hx:boss.x+Math.cos(boss.angle+d.baseAng)*175,hy:boss.y+Math.sin(boss.angle+d.baseAng)*175,
vx:0,vy:0,flash:0,deadT:0,mjolT:0,r:25}));
}
/* ============ reset / início ============ */
function resetAll(){
player.x=W/2;player.y=H*.75;player.hp=100;player.maxHp=100;player.inv=0;player.dashT=0;player.dashCd=0;
player.dashAng=0;player.angle=-Math.PI/2;player.dead=false;player.shotT=0;player.biteT=0;player.pistolT=0;player.slowT=0;
/* v1.0.0: armas novas e feixe — reset por descida */
game.hasPistols=false;game.hasBeam=false;game.pistolBeam=false;
game.beamCharge=0;game.beamCharging=false;game.beamFull=false;game.beamA=0;
player.mvx=0;player.mvy=0;player.sawT=0;player.swordT=0;player.sawAim=0;player.sawAnim=0;player.sawThrowCd=0;
bullets=[];ebullets=[];enemies=[];pickups=[];particles=[];texts=[];bolts=[];arcs=[];
hammers=[];biteFxs=[];swordFxs=[];novaFxs=[];stakeFxs=[];
spawnMarks=[];geyserMarks=[];rings=[];shockwaves=[];thrownSaw=null;lightBeam=null;
game.kills=0;game.souls=0;game.soulAcc=0;game.up={};game.autoFire=false;
game.elements={gelo:0,fogo:0,veneno:0,trovao:0};game.elemCycle=0;game.multi=0;
game.parryCharge=0;game.parryLock=false;game.fome=false;game.fomeK=0;
game.ymir=false;game.incendio=false;game.berserk=false;game.storm=false;
game.synInverno=false;game.synMuspel=false;game.synSerpente=false;game.synTrovao=false;game.synVulcao=false;game.synCarrasco=false;game.pesadelo=false;
game.iraodin=false;game.heimdall=false;game.miasma=false;game.chain2=false;
game.biteFire=false;game.biteFrost=false;game.biteVenom=false;game.biteQuake=false;
game.hasParry=false;game.novaT=2.5;game.stakeT=2.5;game.burstT=4;game.lightMagT=4;game.darkAng=0;game.shockT=2;
game.lightT=3;game.shake=0;game.hitstop=0;game.flash=0;game.hurtV=0;
game.banner=null;game.headBanner=null;game.overlayShown=false;game.paused=false;
game.deadT=0;game.bossIntroT=0;game.introFlags={};
game.endPhase=null;game.endT=0;game.playerAlpha=1;game.darkSoul=null;game.enterFrom=null;game.gateCreak=0;
game.floor=1;game.usedMinis=[];game.mapRooms=[];game.roomIdx=-1;game.extraIdx=-1;
game.labArena=false;game.labStair=null;game.labExit=null;game._labDescend=null;game._labExitDescend=null;game._labReturn=null;game._labStairRoom=null; /* v1.4.3: a arena de testes não atravessa runs */
game.roomKind='combat';game.globalRoom=0;game.threat=1;game.portal=null;
game.doors=[];
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
game.fallK=-1;game.fallFrom=null;game.fallTo=null;game.fallTarget=null;
game.roomFade=0;game.treasureOpen=false;game.shopItems=[];game.shopNear=null;game.keeper=null;game.keeperNear=false;game.roomEvent=null;game.e404T=0;game.e404Spawned=false;
game.builderLive=false;game.deadTaunt='';
game.facedMinis=[];game.postLimboSchool=false;game.noBless=false;game.manto=false;game.endPool=null;/* v0.9.13 */
game.fagulha=0;/* v1.0.0: fagulhas não atravessam descidas */
/* v0.9.16: forja de builds — zera efeitos temporários dos ativos, sinergias e especializações */
game.slowMoT=0;game.slowMoDur=0;game.shieldHits=0;game.shieldT=0;
game.regenT=0;game.regenDur=0;game.regenAcc=0;game.fragilT=0;game.fragilDur=0;
game.decoyT=0;game.decoyDur=0;game.etShotT=0;game.etShotDur=0;game.transfT=0;game.transfDur=0;
game.specs={};game.psyn={};telegraphs=[];actMinions=[];game.actUses=0;
game.reiT=0;game.reiX=0;game.reiY=0;game.reiSpawned=false;game.reiFought=false;game.kingsoul=false;game.kingT=8;
game.rkP2=false;game.rkUltT=0;game.rkUlt=null;
/* reset Cavaleiros do Apocalipse */
game.knightIntro=null;game.knightIntroT=0;game.knightSpawned=false;
game.knightDead=null;game.knightT=0;game.knightX=0;game.knightY=0;game.knightTriunfo=null;
game.knightHearts=[];game.knightTimer=0;game.knightHeartsCollected=0;game.knightHeartsNeeded=0;
game.knightInvuln=false;
game.decor=[];game.roomWindow=null;game.windowScene=null;game.puzzle=null;game.seenGlyphs=[];game.penumbra=null;
game.forceNext=null;game.meleeHitT=0;game.meleeHitRk=false;
game.roomQueue=[];
game.hasShot=game.weapon==='shot';game.hasBite=game.weapon==='bite';
/* ==== v0.9.0: reset de variáveis da expansão ==== */
game.region='penumbra';game.postCerberusFloors=0;
game.limboPending=false;game.limboLoadT=0;game.gatePending=false; /* v1.5.3 */
game._arenaLock=false; /* v1.5.4: a trava de escada da arena do Cérbero nunca atravessa runs */
game.caronteBoss=null;game.carontePhase=0;game.caronteDialogIdx=0;game.caronteDialogT=0;game.caronteFightT=0;
game.caronteT=0;game.caronteChant=0;game.caronteAccepted=false;
game.boatT=0;game.boatPhase=null;
game.fromCaronte=false;game.caronteReturn=false;
game.futureBossMode=false;
/* v0.9.3: reset do sistema de itens ativos */
game.activeItem=null;game.activeCd=0;game.activeMaxCd=0;
game.estrelaT=0;game.furiaT=0;game.furiaDur=0;
game.bloodShots=false;game.tearShots=false;game.fomeDrain=false;game.falseHeart=false;game.glassBody=false;game.blindHaste=false;game.isolation=false;game.endlessHunger=false;game.hungerT=0;
game.sacrificeAltar=null;
game.soulTremor=0;
game.hasWorld=false;game.worldT=0;game.worldDur=3;game.worldLevel=0;
/* v0.9.7: reset O OBSERVADOR — inferno / glitch / olhos */
game.hellMode=false;game.hellEyesT=0;game.glitchT=0;game.hellEyes=[];
heartsPopT=0;
P.dmgMult=1;P.rateMult=1;P.reachMult=1;P.lightning=0;P.speedMult=1;P.biteMult=1;P.biteRange=1;
P.magnetMult=1;P.dashCdMult=1;P.invBonus=0;P.soulMult=1;P.parryRadius=110;
P.chainsaw=0;P.sword=0;P.nova=0;P.stakes=0;P.burst=0;P.dark=0;P.light=0;P.explShot=0;P.shock=0;
/* v0.9.9: reset das relíquias escolhidas e flags derivadas */
game.pendingRelicChoice=false;game.relicRoom=false;game.relicChoiceDone=false;game._maosVazias=false; /* v1.4.7: o aviso de MÃOS VAZIAS mostra uma vez por descida */
game.relicRevive=false;game.relicHaggler=false;game.relicShard=false;
game.relicShieldUp=false;game.relicShieldK=0;game.shopLuck=false;game.shopGiftDone=false;
game.schoolDone=false; /* v0.9.9: a escola aparece uma vez por descida */
resetBoss();
/* v0.9.9: relíquias NÃO acumulam mais — com 1 desbloqueada, aplica sozinha;
   com 2+, a sala inicial vira a SALA DAS RELÍQUIAS (escolha UMA para descer) */
const unlockedRelics=UNLOCKS.filter(u=>u.chk(META));
if(unlockedRelics.length>=2){game.pendingRelicChoice=true;}
else if(unlockedRelics.length===1&&unlockedRelics[0].apply)unlockedRelics[0].apply();
}
function addHammer(){hammers.push({x:player.x,y:player.y,vx:0,vy:0,state:'idle',fireT:rnd(0.2,0.5),target:null,spin:rnd(TAU)});}
function setDiff(mode){
diffSel=mode;
const n=ov('dNorm'),h=ov('dHard'),hint=document.querySelector('.diffHint')||ov('diffHint');
if(n)n.classList.toggle('sel',mode==='normal');
if(h)h.classList.toggle('sel',mode==='hard');
if(hint)hint.textContent=mode==='hard'
?'bullet hell: mais atiradores, feitiços em dobro e chefes com padrões extras. o guardião espera na 5ª descida.'
:'a descida padrão. o inferno na medida.';
blip('sine',mode==='hard'?520:380,mode==='hard'?700:300,.08,.05);blurActive();
}
function openWeaponSelect(){
audio();game.paused=false;
['menu','dead','win','pause','levelup','weapons','options','book','lab','saves','shop','cheatmenu','descer'].forEach(hideOv);
game.mapRooms=[];game.roomIdx=-1;game.extraIdx=-1;game.doors=[];
game.floor=1;game.usedMinis=[];game.portal=null;
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
buildRoomFloor();
game.fallK=-1;game.fallFrom=null;game.fallTo=null;game.fallTarget=null;
game.roomFade=0;game.treasureOpen=false;game.shopItems=[];game.shopNear=null;game.keeper=null;game.keeperNear=false;game.roomEvent=null;game.e404T=0;game.e404Spawned=false;
game.builderLive=false;game.deadTaunt='';
game.reiT=0;game.reiSpawned=false;game.rkP2=false;game.rkUlt=null;
game.decor=[];game.roomWindow=null;game.windowScene=null;game.puzzle=null;game.seenGlyphs=[];game.penumbra=null;
game.parryCharge=0;game.parryLock=false;game.banner=null;game.headBanner=null;
showOv('weapons');
if(game.state!=='menu')game.state='select';
blurActive();
}
/* ============================================================
   v0.9.5: SISTEMA DE ITENS MÍTICOS — 6 pilares no início da run.
   Desbloqueados ao derrotar bosses específicos. O jogador escolhe 1.
   ============================================================ */
const MYTHIC_ITEMS=[
  {id:'cerberus_heart',name:'CORAÇÃO DO CÉRBERO',desc:'+50% dano · relâmpagos triplos · +20 HP máximo',
   unlock:'derrote o Cérbero',boss:'cerberus',
   apply(){P.dmgMult*=1.5;P.lightning=Math.max(P.lightning,3);player.maxHp+=20;player.hp=player.maxHp;}},
  {id:'caronte_soul',name:'ALMA NEGRA DE CARONTE',desc:'desbloqueia o item ativo LATIDO INFERNAL',
   unlock:'derrote Caronte',boss:'caronte',
   apply(){pickupActiveItem('latido');}},
  {id:'rei_crown',name:'COROA DO VELHO REI',desc:'+1 coração máximo · +25% dano · o rei joga por você',
   unlock:'derrote o Velho Rei',boss:'rk',
   apply(){player.maxHp+=25;player.hp=player.maxHp;P.dmgMult*=1.25;game.kingsoul=true;game.kingT=3;}},
  {id:'e404_fragment',name:'FRAGMENTO DO ERRO',desc:'+15% almas coletadas · algo glitchy protege você',
   unlock:'delete o Erro 404',boss:'e404',
   apply(){P.soulMult*=1.15;game.apocalypse=false;}},
  {id:'knight_conquest',name:'BANDEIRA DA CONQUISTA',desc:'+30% velocidade · +20% velocidade de ataque',
   unlock:'derrote o Cavaleiro da Conquista',boss:'cw1',
   apply(){P.speedMult*=1.3;P.rateMult*=1.2;}},
  {id:'knight_death',name:'FOICE DA MORTE',desc:'+100% dano · -25 HP máximo · executa inimigos com <30% HP',
   unlock:'derrote o Cavaleiro da Morte',boss:'cw4',
   apply(){P.dmgMult*=2;player.maxHp=Math.max(50,player.maxHp-25);if(player.hp>player.maxHp)player.hp=player.maxHp;game.knightDeath=true;game.knightDeathT=0;}}
];
function isMythicUnlocked(mi){
  if(mi.boss==='cerberus')return META.wins>=1;
  if(mi.boss==='caronte')return META.caronteKills>=1;
  if(mi.boss==='rk')return META.done&&META.done.rk>=1;
  if(mi.boss==='e404')return META.e404>=1;
  if(mi.boss==='cw1')return META.knights&&META.knights.conquest>=1;
  if(mi.boss==='cw4')return META.knights&&META.knights.death>=1;
  return false;
}
/* verifica se deve mostrar a mensagem de tremor na alma */
function checkSoulTremor(){
  /* ao morrer 3+ vezes, mostra a mensagem pela primeira vez */
  if(META.deaths>=3&&!META.soulTremorShown){
    META.soulTremorShown=true;saveMeta();
    showSoulTremor();
  }
}
function showSoulTremor(){
  /* mostra fumaça negra + mensagem por 4 segundos */
  game.soulTremor=4.0;
  sfx.echo();sfx.rumble();
  blip('sine',60,30,2,.1);
  /* partículas de fumaça negra */
  for(let i=0;i<30;i++){
    particles.push({x:rnd(0,W),y:rnd(0,H),vx:rnd(-15,15),vy:rnd(-30,-10),life:rnd(2,4),t:0,r:rnd(3,8),c:'rgba(20,10,20,0.5)',drag:.97,glow:false});
  }
}
/* ============================================================
   v0.9.5: OVERLAY DE ESCOLHA DE ITEM MÍTICO — aparece ao iniciar run
   ============================================================ */
function showMythicChoice(){
  /* v1.4.7: MÃOS VAZIAS — a descida nova não leva NADA de uma run para outra,
     nem a ALMA NEGRA: thor desce ZERADO, e a única ajuda que atravessa o rio é
     a RELÍQUIA (Sala das Relíquias). O acervo mítico segue aqui embaixo, intacto,
     mas deixou de ser oferecido no começo — quem quer o latido de novo, desce e
     derrota o Caronte na própria descida. */
  const unlocked=MYTHIC_ITEMS.filter(isMythicUnlocked);
  if(unlocked.length>0&&!game._maosVazias){
    game._maosVazias=true;
    try{texts.push({x:W/2,y:H*.16,txt:'MÃOS VAZIAS — SÓ AS RELÍQUIAS ATRAVESSAM O RIO',t:0,life:3.2,c:'#9c8f7c',size:11,disp:true});}catch(e){}
  }
  return false;
  const unlocked0=unlocked; /* preservado: o corpo antigo fica abaixo, intocado */
  if(unlocked0.length===0)return false; /* nenhum desbloqueado */
  /* v0.9.9: a escolha de relíquia tem prioridade — o mítico espera a vez dele */
  if(game.pendingRelicChoice)return true;
  game.state='mythicselect';
  showOv('mythicChoice');
  const box=ov('mythicCards');
  if(!box)return true;
  box.innerHTML='';
  for(const mi of unlocked){
    const el=document.createElement('div');
    el.className='card';
    el.style.cursor='pointer';
    el.style.borderColor='#ffd9a0';
    el.innerHTML='<h3 style="color:#ffd9a0">'+mi.name+'</h3><p>'+mi.desc+'</p><div class="lvl" style="color:#ffd9a0">ITEM MÍTICO</div>';
    el.addEventListener('click',function(){
      audio();
      mi.apply();
      sfx.levelup();sfx.roar();
      sparks(player.x,player.y,'#ffd9a0',30,300,.9,4,true);
      hideOv('mythicChoice');
      game.state='play';
      game.banner={type:'circle',txt:'ITEM MÍTICO',name:mi.name,sub:mi.desc,t:0,dur:3.0};
      /* v0.9.5: tremor na alma ao pegar item mítico */
      showSoulTremor();
      blurActive();
    });
    box.appendChild(el);
  }
  return true;
}
function startGame(weapon){
audio();game.weapon=weapon;game.hard=(diffSel!=='normal'&&diffSel!=='facil'); /* v1.3.0 · v1.5.0: FÁCIL é o perfil legado */
/* v1.5.0: entrou no jogo de novo → a página de Dante vira (e para de novo).
   A rotação mora no escopo do menu — o gancho global __danteEnter faz a ponte. */
if(window.__danteEnter)window.__danteEnter();
['menu','dead','win','pause','levelup','weapons','options','book','lab','saves','shop','cheatmenu','limboLoading','descer'].forEach(hideOv);
/* salva limboPending antes de resetAll (que o resetaria para false) */
const wasLimboPending=game.limboPending;
const wasGatePending=game.gatePending; /* v1.5.3: TESTE — caminho do portão direto (v1.5.9: de volta a pedido do usuário) */
const wasLimboTest=game.limboTestPending; /* v1.6.0: TESTE — última fase do Limbo direto */
blurActive();resetAll();
if(window.__EXPANSION)window.__EXPANSION.onRunStart(); /* v1.3.0: dificuldade/modificadores */
/* v0.9.13→14: MODO NERDCIRNO67 — runs começadas com ele ativo NÃO concedem bênçãos */
game.noBless=!!game.dev;
if(game.noBless)texts.push({x:W/2,y:H*.16,txt:'MODO NERDCIRNO67 — NENHUMA BÊNÇÃO SERÁ CONCEDIDA',t:0,life:3.4,c:'#c9a0ff',size:13,disp:true});
/* ==== v0.9.0: se limboPending estiver ativo, o jogo começa no corredor do Limbo
   em vez da Penumbra das Almas. O jogador escolheu a arma e o modo, mas spawna
   no corredor escuro que leva ao Limbo (falso paraíso). ==== */
if(wasLimboPending){
  game.limboPending=false;
  game.hard=(diffSel!=='normal'&&diffSel!=='facil'); /* v1.3.0 · v1.5.0: FÁCIL é o perfil legado */
  game.floor=2;
  game.region='limbo';
  game.postCerberusFloors=0;
  game.usedMinis=[];
  game.state='corridor';
  paradiseOutsideCache=null;
  game.fromCaronte=true; /* marca que deve entrar no Limbo oficialmente ao fim do corredor */
  game.activeItem=null;game.activeCd=0;game.activeMaxCd=0;
  game.corridorT=0;
  game.corridorLen=H;
  game.corridorW=260;
  game.corridorProg=0;
  ROOM.x=Math.round((W-game.corridorW)/2);
  ROOM.y=0;
  ROOM.w=game.corridorW;
  ROOM.h=H;
  ROOM.inverted=false;
  game.absRects=[{x:ROOM.x,y:ROOM.y,w:ROOM.w,h:ROOM.h}];
  game.absMain=game.absRects[0];
  player.x=W/2;
  player.y=H-90;
  player.mvx=0;player.mvy=-1;player.angle=-Math.PI/2;
  game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
  game.doors=[];game.portal=null;
  game.roomFade=1;
  enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];texts=[];
  thrownSaw=null;lightBeam=null;
  /* re-aplica a arma escolhida após resetAll */
  game.hasShot=game.weapon==='shot';
  game.hasBite=game.weapon==='bite';
  if(game.hasShot)player.shotT=.3;
  if(game.hasBite)player.biteT=.3;
  sfx.rumble();sfx.echo();
  blip('sine',120,80,.5,.1);
  texts.push({x:W/2,y:H*.18,txt:'O CORREDOR — CAMINHO AO ABISMO',t:0,life:3.0,c:'#bfd8e8',size:14,disp:true});
  texts.push({x:W/2,y:H*.23,txt:'a penumbra ficou para trás. suba em direção à luz.',t:0,life:3.0,c:'#9fc0c9',size:11});
  return;
}
game.floor=1;game.usedMinis=[];
game.region='penumbra'; /* v0.9.0 — começa na Penumbra das Almas */
/* ==== v1.5.3: TESTE — gatePending pula a descida inteira: arma escolhida →
   direto para O CAMINHO DO PORTÃO (o corredor vulcânico com o portão [Z]) ==== */
if(wasGatePending){
  game.gatePending=false;
  game.region='vulcan';game.floor=4;game.postCerberusFloors=0;
  game.hard=(diffSel!=='normal'&&diffSel!=='facil');
  if(window.__EXPANSION&&window.__EXPANSION.startGatePath){
    window.__EXPANSION.startGatePath();
  }else{game.state='play';game.mapRooms=genMap();enterRoom(0,null);}
  rollTitleFont();
  return;
}
/* ==== v1.6.0: TESTE — limboTestPending pula TUDO: arma escolhida → direto
   para A ÚLTIMA FASE DO LIMBO (fase 4 — O LIMBO INFERNAL — FASE 2, andar 9,
   onde a descida cinza termina no Juiz Sem Rosto). ==== */
if(wasLimboTest){
  game.limboTestPending=false;
  game.hard=(diffSel!=='normal'&&diffSel!=='facil');
  game.region='limbo';game.limboPhase=4;game.floor=9;game.postCerberusFloors=0;
  game.usedMinis=[];game.portal=null;game.extraIdx=-1;game.rkP2=false;game.rkUlt=null;
  game._bcActive=false;game.pendingLimboFloor=9;
  game.seenGlyphs=[];paradiseOutsideCache=null;
  game.mapRooms=genMap();
  game.state='play';rollTitleFont();
  game.roomIdx=-1;
  enterRoom(0,null);
  game.banner={type:'circle',txt:'TESTE — FASE FINAL',name:'O LIMBO INFERNAL — FASE 2',sub:'o último véu antes do fim da descida — varra o mapa e o Juiz desperta',t:0,dur:4.4};
  sfx.levelup();sfx.echo();blip('sine',220,440,1.2,.12);
  game.flash=.5;
  return;
}
game.postCerberusFloors=0;
/* v0.9.8: ativa o modo Inferno ANTES de enterRoom para garantir que
   o render já mostre o vermelho/olhos desde o primeiro frame */
if(META.hellMode){game.hellMode=true;game.hellEyesT=999;}
game.mapRooms=genMap();
game.state='play';
rollTitleFont();
game.banner={type:'circle',txt:'CÍRCULO 1',name:'PENUMBRA DAS ALMAS',sub:'cinco descidas de selo em selo — o guardião aguarda no fundo',t:0,dur:3.2};
blip('sine',180,120,0.3,0.08);
enterRoom(0,null);
/* v0.9.5: se há itens míticos desbloqueados, oferece a escolha após entrar na sala */
const mythicShown=showMythicChoice();
}
/* ============ portas e troca de sala ============ */
function doorPos(dir){
const m=game.absMain;
if(dir==='n')return{x:m.x+m.w/2,y:m.y+10};
if(dir==='s')return{x:m.x+m.w/2,y:m.y+m.h-10};
if(dir==='w')return{x:m.x+10,y:m.y+m.h/2};
return{x:m.x+m.w-10,y:m.y+m.h/2};
}
function buildDoors(){
game.doors=[];
const r=game.mapRooms[game.roomIdx];
if(!r||r.kind==='boss')return;
/* v1.3.3: dentro da sala secreta ISOLADA não existe OUTRA porta — só a
   rachadura aberta de volta para o cômodo por onde se entrou */
if(r.isolated){
 if((r.blasted||r.visited)&&r.hostIdx!=null&&r.hostIdx>=0&&r.hostDir){
  const opp={n:'s',s:'n',e:'w',w:'e'};
  const od=opp[r.hostDir]||'s';
  const p=doorPos(od);
  game.doors.push({dir:od,to:r.hostIdx,x:p.x,y:p.y,open:!(r.kind==='sboss'&&r.sbossKind==='rei'&&!r.cleared),extra:false,hidden:false});
 }
 return;
}
for(const dir of ['n','e','s','w']){
const to=r.doors[dir];
if(to===undefined||to<0)continue;
const p=doorPos(dir);
const tgt=game.mapRooms[to];
/* v1.0.0: a porta da SALA SECRETA não existe para o olho — vira uma parede
   rachada, invisível no mapa, que só detona com uma FAGULHA EXPLOSIVA.
   Depois de explodida (tgt.blasted), ela volta a ser porta de verdade. */
game.doors.push({dir:dir,to:to,x:p.x,y:p.y,open:!!(r.doorBlown&&r.doorBlown[dir]),extra:game.extraIdx===to,
hidden:!!(tgt&&tgt.kind==='secret'&&!tgt.blasted)});
}
}
function openDoors(){
let opened=false;
/* v1.0.0: openDoors NUNCA abre a porta escondida — ela só cede à fagulha */
for(const d of game.doors){if(!d.open&&!d.hidden){d.open=true;opened=true;}}
if(opened){sfx.gate();blip('sine',300,180,.2,.06);}
}
/* ---- decoração, janela e puzzle ---- */
const EMPTY_SUBS={
 silent:['nem o eco responde aqui','o vazio aqui tem gosto de pó','nada — e o nada retribui o olhar'],
 ruin:['isto já teve teto e propósito','as pedras lembram de mãos','o salão caiu antes de você chegar','não há nada para levar. nunca houve','alguém contou aqui os degraus até o Trono Cinza'],
 memory:['alguém acendeu velas aqui. há tempo','restos que ninguém veio buscar','a saudade ficou presa nas paredes','alguém rezava neste canto','um nome foi raspado desta parede com as unhas'],
 souls:['há presenças aqui. não hostis','algo respira no canto mais escuro','as almas passam rente ao chão','o ar pesa como água parada']
};
const DECOR_LORE={
 statue:['a estátua perdeu o rosto','alguém a esculpiu com medo'],
 bones:['restos pequenos demais para um demônio','alguém dormiu aqui pela última vez'],
 doorframe:['a porta caiu antes de trancar algo','ninguém a abriu de novo'],
 arch:['o que passava por aqui não voltou'],
 chains:['presas ao chão. soltas há muito tempo'],
 candles:['alguém acendeu estas velas. não faz muito'],
 broken:['a coluna caiu de lado. ninguém a ergueu'],
 rubble:['pedras empilhadas por mãos que já eram pó'],
 column:['marcas de garras até onde o braço alcança']
};
function randRoomPointM(rand,margin){
 let tot=0;
 for(const rc of game.absRects)tot+=rc.w*rc.h;
 let rr=rand()*tot;
 for(const rc of game.absRects){
  rr-=rc.w*rc.h;
  if(rr<=0)return{x:lerp(rc.x+margin,rc.x+rc.w-margin,rand()),y:lerp(rc.y+margin,rc.y+rc.h-margin,rand())};
 }
 const m=game.absMain;
 return{x:m.x+m.w/2,y:m.y+m.h/2};
}
function placeWindow(rf){
 let T=game.absRects[0];
 for(const rc of game.absRects)if(rc.y<T.y||(rc.y===T.y&&rc.w*rc.h>T.w*T.h))T=rc;
 if(T.w<170)return null;
 const r=game.mapRooms[game.roomIdx];
 const lo=T.x+50,hi=T.x+T.w-50;
 let x=lerp(lo,hi,rf());
 if(r&&r.doors.n>=0){
  const doorX=game.absMain.x+game.absMain.w/2;
  let tries=0;
  while(Math.abs(x-doorX)<100&&tries++<14)x=lerp(lo,hi,rf());
  if(Math.abs(x-doorX)<90&&hi-lo<200)return null;
 }
 return{x:x,y:T.y-18};
}
function decorSpotOK(x,y,pad){
 if(!inRoomXY(x,y,pad||30))return false;
 const m=game.absMain;
 if(dist(x,y,m.x+m.w/2,m.y+m.h*.5)<150)return false;
 if(dist(x,y,player.x,player.y)<80)return false;
 for(const d of game.doors)if(dist(x,y,d.x,d.y)<100)return false; /* v1.5.1: era 66 — arco/estátua grande nascido a 66px fechava a porta */
 const w=game.roomWindow;
 if(w&&Math.abs(x-w.x)<60&&Math.abs(y-w.y)<120)return false;
 for(const o of game.decor)if(dist(x,y,o.x,o.y)<48)return false;
 return true;
}
/* v1.5.1: A SALA NÃO MUDA MAIS — a primeira vez que a decorcação de uma sala
   é gerada, ela fica GUARDADA na sala (r._decorSave). Saiu e voltou? A MESMA
   composição está lá, na MESMA posição. Nada de re-sortear a cada entrada. */
function buildDecor(r){
 if(r&&r._decorSave){
  game.decor=r._decorSave.map(function(o){return Object.assign({},o);});
  game.roomWindow=r._winSave?Object.assign({},r._winSave):null;
  for(const d of game.decor)if(d.t==='glyph')d.on=game.seenGlyphs.indexOf(d.sym)>=0;
  return;
 }
 buildDecorGen(r);
 if(r){
  r._decorSave=game.decor.map(function(o){return Object.assign({},o);});
  r._winSave=game.roomWindow?Object.assign({},game.roomWindow):null;
 }
}
function buildDecorGen(r){
 game.decor=[];
 game.roomWindow=null;
 const area=game.absRects.reduce(function(s,rc){return s+rc.w*rc.h;},0);
 let srnd=((game.roomIdx+3)*13.7+game.floor*7.3+11)|0;
 const rf=function(){srnd=(srnd*16807)%2147483647;return srnd/2147483647;};
 /* ==== FALSO PARAÍSO — decoração com estruturas religiosas ==== */
 if(isParadiseFloor()&&!ROOM.inverted){
  buildParadiseDecor(r,rf,area);
  return;
 }
 /* janela interativa — a árvore é rara de propósito */
 let winC=0;
 if(r.kind==='empty')winC=r.flavor==='silent'?0:.10;
 else if(r.kind==='puzzle')winC=.055;
 else if(r.kind==='combat'||r.kind==='challenge')winC=.028;
 else if(r.kind==='treasure')winC=.045;
 else if(r.kind==='secret')winC=.035;
 else if(r.kind==='start')winC=.05;
 if(rf()<winC){
  const wp=placeWindow(rf);
  if(wp)game.roomWindow={x:wp.x,y:wp.y,iy:wp.y+44,used:false,tree:rf()<Math.min(.15+.05*(secretMul()-1),.2)};
 }
 /* ============================================================
    v1.5.0 (Parte 5): COMPOSIÇÕES PREDEFINIDAS COM VARIAÇÕES.
    Nada de espalhar estruturas no dado: a sala escolhe um MODELO
    compatível com o tipo dela (e o anti-repetição evita o mesmo
    modelo em sequência). Cada slot tem posição planejada (fração
    da sala) e variação própria de forma/escala — a aleatoriedade
    escolhe ENTRE composições, não solta objetos sem critério.
    Um slot que falhar na validação é pulado (nunca repositionado
    fora do lugar) — portas, janela e centro ficam sempre livres.
    ============================================================ */
 if(pickDecorComposition(r,rf)){placeGlyph(r,rf);return;}
 /* fallback legado (também é o arquivo do FÁCIL se tudo falhar) */
 let n=0;
 if(r.kind==='empty'){
  if(r.flavor==='silent')n=rf()<.5?1:0;
  else if(r.flavor==='ruin')n=2+Math.round(area/40000);
  else if(r.flavor==='memory')n=2+Math.round(area/52000);
  else n=1+Math.round(area/62000);
 }else if(r.kind==='puzzle')n=0;/* v1.1.0: enigmas limpos — apenas o mecanismo */
 else if(r.kind==='combat'||r.kind==='challenge')n=rf()<.35?1:0;
 else if(r.kind==='treasure'||r.kind==='secret')n=1+(rf()<.5?1:0);
 else if(r.kind==='start')n=rf()<.6?1:0;
 const SETS={
  ruin:['broken','rubble','column','doorframe','chains','marks','broken','rubble'],
  memory:['candles','bones','statue','arch','marks','candles','bones'],
  souls:['candles','bones','marks','statue','arch']
 };
 for(let i=0;i<n;i++){
  let t;
  if(r.kind==='empty'&&SETS[r.flavor])t=SETS[r.flavor][Math.floor(rf()*SETS[r.flavor].length)];
  else t=['column','broken','statue','bones','candles','arch','rubble','chains','marks'][Math.floor(rf()*9)];
  let p=null;
  for(let tr=0;tr<14;tr++){
   const q=randRoomPointM(rf,58);
   if(decorSpotOK(q.x,q.y,62)){p=q;break;}
  }
  if(p)game.decor.push({t:t,x:p.x,y:p.y,s:1.45+rf()*.75,f:rf(),sym:-1,lore:rf()<.45,seen:false});
 }
 placeGlyph(r,rf);
}
/* marca antiga (pista para o puzzle dos ecos) — extraída para as duas rotas */
function placeGlyph(r,rf){
 if(!r||r.glyphSym<0)return;
 for(let tr=0;tr<16;tr++){
  const q=randRoomPointM(rf,46);
  if(decorSpotOK(q.x,q.y,40)){
   game.decor.push({t:'glyph',x:q.x,y:q.y,s:1,f:rf(),sym:r.glyphSym,on:game.seenGlyphs.indexOf(r.glyphSym)>=0,lore:false,seen:true});
   return;
  }
 }
}
/* as composições — cada uma é um pequeno "cenário construído".
   slot: t = tipo (string ou lista de variações), x/y = fração da sala,
   s = escala [min,max]. Tipos grandes (column/arch/statue) ancoram
   corredores e ilhas; pequenos (bones/candles/rubble/marks) vestem. */
const DECOR_COMPS=[
 {id:'corredor_de_estatuas',kinds:['combat','challenge','empty'],slots:[
   {t:['statue','broken'],x:.18,y:.30,s:[1.5,2.0]},{t:['statue','broken'],x:.82,y:.30,s:[1.5,2.0]},
   {t:'rubble',x:.5,y:.62,s:[1.0,1.4]}]},
 {id:'ilha_de_colunas',kinds:['combat','challenge','miniboss'],slots:[
   {t:'column',x:.32,y:.32,s:[1.7,2.2]},{t:'column',x:.68,y:.32,s:[1.7,2.2]},
   {t:'column',x:.32,y:.68,s:[1.7,2.2]},{t:'column',x:.68,y:.68,s:[1.7,2.2]},
   {t:'marks',x:.5,y:.5,s:[.9,1.2]}]},
 {id:'altar_em_ruinas',kinds:['combat','empty'],flavors:['ruin'],slots:[
   {t:'arch',x:.5,y:.24,s:[1.4,1.8]},{t:'broken',x:.38,y:.66,s:[1.3,1.7]},
   {t:['rubble','chains'],x:.62,y:.70,s:[1.0,1.5]},{t:'marks',x:.5,y:.46,s:[.9,1.2]}]},
 {id:'canto_de_velas',kinds:['combat','treasure','secret','start'],slots:[
   {t:'candles',x:.16,y:.72,s:[1.1,1.5]},{t:'bones',x:.80,y:.28,s:[1.0,1.4]},
   {t:['rubble','marks'],x:.24,y:.26,s:[.9,1.3]}]},
 {id:'portal_desmoronado',kinds:['empty'],flavors:['ruin'],slots:[
   {t:'doorframe',x:.5,y:.22,s:[1.5,1.9]},{t:'broken',x:.30,y:.56,s:[1.2,1.6]},
   {t:'rubble',x:.70,y:.60,s:[1.1,1.6]},{t:'chains',x:.5,y:.78,s:[1.0,1.3]}]},
 {id:'memoria_alguem',kinds:['empty'],flavors:['memory'],slots:[
   {t:'statue',x:.24,y:.34,s:[1.5,1.9]},{t:'candles',x:.24,y:.52,s:[1.1,1.5]},
   {t:'bones',x:.76,y:.66,s:[1.0,1.4]},{t:'marks',x:.6,y:.3,s:[.9,1.2]}]},
 {id:'presencas_silenciosas',kinds:['empty'],flavors:['souls'],slots:[
   {t:'candles',x:.5,y:.3,s:[1.1,1.5]},{t:'bones',x:.34,y:.68,s:[1.0,1.3]},
   {t:'marks',x:.66,y:.62,s:[.9,1.2]}]},
 {id:'arena_com_obstaculos',kinds:['challenge','miniboss'],slots:[
   {t:'column',x:.5,y:.28,s:[1.7,2.1]},{t:['broken','rubble'],x:.2,y:.6,s:[1.2,1.6]},
   {t:['broken','rubble'],x:.8,y:.6,s:[1.2,1.6]},{t:'chains',x:.5,y:.74,s:[1.0,1.3]}]},
 {id:'recepcao_do_andar',kinds:['start'],slots:[
   {t:['statue','arch'],x:.22,y:.3,s:[1.5,1.9]},{t:'candles',x:.78,y:.34,s:[1.1,1.4]}]},
 {id:'guardia_do_tesouro',kinds:['treasure'],slots:[
   {t:['statue','column'],x:.3,y:.6,s:[1.5,1.9]},{t:['statue','column'],x:.7,y:.6,s:[1.5,1.9]}]}
];
function pickDecorComposition(r,rf){
 if(!r||r.kind==='puzzle')return false;
 const m=game.absMain;
 if(!m||m.w<300)return false;
 const cands=DECOR_COMPS.filter(function(c){
  if(c.kinds.indexOf(r.kind)<0)return false;
  if(c.flavors&&r.flavor&&c.flavors.indexOf(r.flavor)<0)return false;
  if(c.flavors&&!r.flavor)return false;
  return true;
 });
 if(!cands.length)return false;
 /* anti-repetição: evita o mesmo modelo em sequência (história por descida) */
 if(!game._compRecent)game._compRecent=[];
 let pool=cands.filter(c=>game._compRecent.indexOf(c.id)<0);
 if(!pool.length){game._compRecent=[];pool=cands;}
 const comp=pool[Math.floor(rf()*pool.length)];
 game._compRecent.push(comp.id);
 while(game._compRecent.length>3)game._compRecent.shift();
 let placed=0;
 for(const sl of comp.slots){
  const t=Array.isArray(sl.t)?sl.t[Math.floor(rf()*sl.t.length)]:sl.t;
  const x=m.x+m.w*sl.x,y=m.y+m.h*sl.y;
  if(!decorSpotOK(x,y,62))continue;
  const sMin=sl.s?sl.s[0]:1.2,sMax=sl.s?sl.s[1]:1.7;
  game.decor.push({t:t,x:x,y:y,s:sMin+rf()*(sMax-sMin),f:rf(),sym:-1,lore:rf()<.4,seen:false,comp:comp.id});
  placed++;
 }
 return placed>0;
}
/* ==== buildParadiseDecor: gera as estruturas religiosas do Falso Paraíso.
   A quantidade e a complexidade aumentam com o andar (paradiseDistort()). ==== */
function buildParadiseDecor(r,rf,area){
 const distort=paradiseDistort();
 /* conjunto de estruturas religiosas — a probabilidade de cada uma muda conforme o andar */
 /* estruturas "santas" mais comuns no andar 2, "perturbadoras" mais comuns nos andares seguintes */
 const holySet=['cathedral','chapel','altar','cross','column','holy_statue','archway','pews','candle_altar','stainedglass_window','vitrais'];
 const strangeSet=['tomb','confessional','ruined_wall','tunnel_arch','deformed_statue','belfry'];
 const allSet=holySet.concat(strangeSet);
 /* número de estruturas — aumenta com o andar e com a área da sala */
 let n=0;
 if(r.kind==='start')n=2+Math.round(distort*2);
 else if(r.kind==='empty')n=3+Math.round(area/30000)+Math.round(distort*3);
 else if(r.kind==='puzzle')n=0;/* v1.1.0: enigmas limpos — apenas o mecanismo */
 else if(r.kind==='combat'||r.kind==='challenge')n=1+Math.round(distort*2);
 else if(r.kind==='treasure'||r.kind==='secret')n=2+Math.round(distort*2);
 else if(r.kind==='boss')n=3+Math.round(distort*3);
 else n=2+Math.round(distort*2);
 /* garante pelo menos uma estrutura grande nas salas grandes */
 if(area>W*H*.6&&rf()<.7)n++;
 /* coloca cada estrutura */
 for(let i=0;i<n;i++){
  let t;
  const roll=rf();
  if(roll<.6-hdistort()*0.3){
    /* estruturas santas mais prováveis no início */
    t=holySet[Math.floor(rf()*holySet.length)];
  }else if(roll<.85){
    /* estruturas estranhas/perturbadoras mais prováveis com o andar */
    t=strangeSet[Math.floor(rf()*strangeSet.length)];
  }else{
    /* qualquer estrutura */
    t=allSet[Math.floor(rf()*allSet.length)];
  }
  /* estruturas grandes (cathedral, belfry) precisam de mais espaço */
  const big=t==='cathedral'||t==='belfry'||t==='archway';
  let p=null;
  for(let tr=0;tr<24;tr++){
   const q=randRoomPointM(rf,big?90:60);
   if(decorSpotOK(q.x,q.y,big?110:62)){p=q;break;}
  }
  if(p){
   const s=big?(1.0+rf()*.4):(0.85+rf()*.7);
   game.decor.push({t:t,x:p.x,y:p.y,s:s,f:rf(),sym:-1,lore:rf()<.4,seen:false,paradise:true});
  }
 }
 /* cruzes espalhadas pelo campo — símbolos religiosos repetidos em excesso */
 const nCrosses=Math.floor(2+distort*4+area/(W*H)*4);
 for(let i=0;i<nCrosses;i++){
  let p=null;
  for(let tr=0;tr<8;tr++){
   const q=randRoomPointM(rf,40);
   if(decorSpotOK(q.x,q.y,40)){p=q;break;}
  }
  if(p)game.decor.push({t:'cross',x:p.x,y:p.y,s:0.6+rf()*.5,f:rf(),sym:-1,lore:false,seen:false,paradise:true});
 }
 /* altares pequenos espalhados */
 const nAltars=Math.floor(distort*3+1);
 for(let i=0;i<nAltars;i++){
  let p=null;
  for(let tr=0;tr<10;tr++){
   const q=randRoomPointM(rf,46);
   if(decorSpotOK(q.x,q.y,52)){p=q;break;}
  }
  if(p)game.decor.push({t:'candle_altar',x:p.x,y:p.y,s:0.85+rf()*.5,f:rf(),sym:-1,lore:false,seen:false,paradise:true});
 }
 /* marca antiga (pista para o puzzle dos ecos) — mantém a mecânica original */
 if(r.glyphSym>=0){
  let p=null;
  for(let tr=0;tr<16;tr++){
   const q=randRoomPointM(rf,46);
   if(decorSpotOK(q.x,q.y,40)){p=q;break;}
  }
  if(p)game.decor.push({t:'glyph',x:p.x,y:p.y,s:1,f:rf(),sym:r.glyphSym,on:game.seenGlyphs.indexOf(r.glyphSym)>=0,lore:false,seen:true});
 }
}
/* helper: nível de deformação para construção de decoração */
function hdistort(){return paradiseDistort();}
function buildPuzzle(){
 const r=game.mapRooms[game.roomIdx];
 const type=r&&r.pzType?r.pzType:'plates';
 const diff=irnd(Math.min(2,Math.floor((game.floor+1)/2)),3);
 if(type==='braziers')buildBraziers(diff);
 else if(type==='cores')buildCores();/* v1.2.0 */
 else if(type==='echoes')buildEchoes();
 else if(type==='box')buildBox();
 else if(type==='quiz')buildQuiz();
 else buildPlates(diff);
 /* puzzles simples trancam as portas — a sala só abre quando resolver.
    v0.9.9: a caixa e o quiz também trancam (o quiz é a prova do saber). */
 const pz=game.puzzle;
 if(pz&&!pz.solved&&((pz.type==='plates'&&pz.diff<=1)||(pz.type==='braziers'&&pz.diff===0)||pz.type==='box'||pz.type==='quiz')){
  pz.lock=true;
  for(const d of game.doors)d.open=false;
  game.banner={type:'small',txt:'PORTAS TRANCADAS',sub:'resolva o puzzle para abrir as saídas',t:0,dur:2.6};
  blip('sawtooth',140,80,.25,.08);
 }
}
function shuffle6(){const a=[0,1,2,3,4,5];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function drawSymbol(i,x,y,s,col,alpha){
 ctx.save();
 ctx.translate(x,y);
 ctx.globalAlpha=alpha;
 ctx.strokeStyle=col;
 ctx.lineWidth=Math.max(1.4,s*.18);
 ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();
 if(i===0)ctx.arc(0,0,s,0,TAU);
 else if(i===1){ctx.moveTo(0,-s);ctx.lineTo(s*.9,s*.62);ctx.lineTo(-s*.9,s*.62);ctx.closePath();}
 else if(i===2){ctx.moveTo(0,-s);ctx.lineTo(s*.78,0);ctx.lineTo(0,s);ctx.lineTo(-s*.78,0);ctx.closePath();}
 else if(i===3){ctx.moveTo(-s*.8,-s*.8);ctx.lineTo(s*.8,s*.8);ctx.moveTo(s*.8,-s*.8);ctx.lineTo(-s*.8,s*.8);}
 else if(i===4)ctx.arc(0,0,s,Math.PI*.3,Math.PI*1.7);
 else{ctx.moveTo(-s,-s*.25);ctx.quadraticCurveTo(-s*.5,-s*.85,0,-s*.25);ctx.quadraticCurveTo(s*.5,.35*s,s,-s*.25);}
 ctx.stroke();
 ctx.restore();
}
function solvePuzzle(){
 const pz=game.puzzle;
 if(!pz||pz.solved)return;
 pz.solved=true;
 const m=game.absMain;
 const r=game.mapRooms[game.roomIdx];
 /* v1.0.0: enigma mais duro (sem indicação) merece recompensa garantida —
    TODO puzzle resolvido materializa um baú, sempre. */
 if(r){r.pzSolved=true;r.chestDropped=true;}
 if(r)pickups.push({type:'chest',x:m.x+m.w/2,y:m.y+m.h*.45,t:0,ph:rnd(TAU)});
 game.banner={type:'small',txt:'PUZZLE RESOLVIDO',sub:pz.lock?'as portas trancadas se abriram':'um baú se revela entre as pedras',t:0,dur:2};
 if(pz.lock)openDoors();
 sfx.levelup();game.flash=.3;
 sparks(m.x+m.w/2,m.y+m.h*.45,'#ffd9a0',10,160,.6,2.5,true);
}
function buildPlates(diff){
 const m=game.absMain;
 /* FIX: máximo de 8 botões no total (numeradas + iscas) e ordem sempre aleatória.
    Antes a condição de vitória contava as placas-isca, exigindo mais passos
    do que placas numeradas existiam — o puzzle ficava impossível. */
 let n=diff===0?5:diff===1?6:diff===2?7:8;
 const decoys=diff>=2?Math.min(diff-1,8-n):0;
 const cx=m.x+m.w/2,cy=m.y+m.h*.45;
 const R=Math.max(95,Math.min(m.w,m.h)*.3);
 const order=[];
 for(let i=0;i<n;i++)order.push(i+1);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=order[i];order[i]=order[j];order[j]=t;}
 const plates=[];
 const spots=n+decoys;
 for(let i=0;i<spots;i++){
  const a=-Math.PI/2+i/spots*TAU;
  plates.push({x:clamp(cx+Math.cos(a)*R,m.x+50,m.x+m.w-50),y:clamp(cy+Math.sin(a)*R*.8,m.y+50,m.y+m.h-50),n:i<n?order[i]:0,pressed:false,near:false,decoy:i>=n});
 }
 /* v1.0.0: SEM INDICAÇÃO — nada de números nas placas. No início a sequência
    pulsa uma vez (Simon) e depois é só memória. Resolver sempre abre um baú. */
 game.puzzle={type:'plates',plates:plates,need:1,numPlates:n,diff:diff,memoT:diff===0?1.2:diff===1?2.1:diff===2?2.6:3.1,memoDur:diff===0?1.2:diff===1?2.1:diff===2?2.6:3.1,failT:0,solved:false,showN:false};/* v1.2.0: memo mais curto */
 game.banner={type:'small',txt:'SALA DO PUZZLE',
  sub:'a sequência pulsa uma única vez — grave a ordem e pise nas '+n+' placas'+(decoys?', evite as lousas falsas':''),
  t:0,dur:2.6};
 blip('sine',300,500,.2,.06);
}
function buildBraziers(diff){
 const m=game.absMain;
 const n=diff===0?6:diff===1?7:8;
 const syms=shuffle6().slice(0,n);
 const cx=m.x+m.w/2,cy=m.y+m.h*.5;
 const braziers=[];
 let tries=0;
 while(braziers.length<n&&tries++<220){
  const p=randRoomPointM(Math.random,56);
  if(dist(p.x,p.y,cx,cy)<150)continue;
  if(dist(p.x,p.y,player.x,player.y)<95)continue;
  let ok=true;
  for(const b of braziers)if(dist(p.x,p.y,b.x,b.y)<110){ok=false;break;}
  for(const d of game.doors)if(dist(p.x,p.y,d.x,d.y)<70){ok=false;break;}
  for(const o of game.decor)if(dist(p.x,p.y,o.x,o.y)<52){ok=false;break;}
  if(ok)braziers.push({x:p.x,y:p.y,sym:syms[braziers.length],lit:false,near:false,fl:rnd(TAU)});
 }
 while(braziers.length<n){
  const a=braziers.length/n*TAU-Math.PI/2;
  const rr=Math.min(m.w,m.h)*.33;
  braziers.push({x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr*.8,sym:syms[braziers.length],lit:false,near:false,fl:rnd(TAU)});
 }
 const order=syms.slice();
 for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=order[i];order[i]=order[j];order[j]=t;}
 let hidden=-1;
 if(diff>=2)hidden=1+Math.floor(Math.random()*(order.length-2));
 /* v1.0.0: SEM INDICAÇÃO — a barra com a ordem de símbolos foi removida.
    A sequência pulsa uma vez no chão (o furo da lacuna NÃO pulsa) e depois
    é memória pura. Erro apaga tudo — dificuldade de verdade, baú garantido. */
 const introDur=n*.38+.55;/* v1.2.0: o pulso ficou mais rápido — memória sob pressão */
 game.puzzle={type:'braziers',braziers:braziers,order:order,hidden:hidden,diff:diff,prog:0,failT:0,solved:false,introT:introDur,introDur:introDur};
 game.banner={type:'small',txt:'BRASEIROS APAGADOS',
  sub:diff===0?'acenda todos — passe por cima deles':diff===1?'as chamas mostram a ordem uma única vez — grave':diff===2?'a ordem pulsa uma única vez — mas há um fogo que se esconde':'ordem longa, um fogo falso e pouquíssima margem',
  t:0,dur:2.8};
 blip('sine',300,500,.2,.06);
}
/* ==== v1.2.0: PUZZLE DAS CORES — a cor certa, cinco vezes seguidas ==== */
const CORE_COLORS=['#d9465a','#9fd8ff','#a8c24f','#ffd9a0','#c9a0ff'];
const CORE_NAMES=['VERMELHO','AZUL','VERDE','DOURADO','ROXO'];
function buildCores(){
 const m=game.absMain;
 const cx=m.x+m.w/2,cy=m.y+m.h*.45;
 const R=Math.max(105,Math.min(m.w,m.h)*.32);
 const peds=[];
 for(let i=0;i<5;i++){
  const a=-Math.PI/2+i/5*TAU;
  peds.push({x:clamp(cx+Math.cos(a)*R,m.x+52,m.x+m.w-52),y:clamp(cy+Math.sin(a)*R*.82,m.y+52,m.y+m.h-52),c:irnd(0,4),cool:0,near:false,fl:rnd(TAU)});
 }
 game.puzzle={type:'cores',peds:peds,hits:0,needHits:5,target:-1,cool:0,failT:0,solved:false,t:0};
 rollCoreTarget();
 game.banner={type:'small',txt:'O CÍRCULO DAS CORES',sub:'pise na cor pedida — 5 vezes seguidas, sem errar',t:0,dur:2.8};
 blip('sine',300,500,.2,.06);
}
function rollCoreTarget(){
 const pz=game.puzzle;
 const used=pedsCoreColors();
 let c=irnd(0,4);
 for(let k=0;k<8;k++){if(pz.peds.some(function(p){return p.c===c;}))break;c=irnd(0,4);}
 pz.target=c;
}
function pedsCoreColors(){return game.puzzle&&game.puzzle.peds?game.puzzle.peds.map(function(p){return p.c;}):[];}
function updateCores(dt){
 const pz=game.puzzle;
 pz.t+=dt;
 if(pz.cool>0)pz.cool-=dt;
 for(const pd of pz.peds)if(pd.cool>0)pd.cool-=dt;
 if(pz.cool>0)return;
 for(const pd of pz.peds){
  const near=dist(player.x,player.y,pd.x,pd.y)<26;
  pd.near=near;
  /* v1.2.0: o toque conta na ENTRADA do pedestal — não mantendo contato */
  if(near&&!pd.wasIn&&pd.cool<=0){
   pd.wasIn=true;
   pd.cool=.6;
   if(pd.c===pz.target){
    pz.hits++;
    blip('sine',360+pz.hits*90,480+pz.hits*90,.14,.07);
    sparks(pd.x,pd.y,CORE_COLORS[pd.c],10,150,.5,2.5,true);
    if(pz.hits>=pz.needHits){solvePuzzle();return;}
    /* reembaralha as cores e sorteia a próxima pedida */
    for(const q of pz.peds)q.c=irnd(0,4);
    rollCoreTarget();
    pz.cool=.5;
    texts.push({x:pd.x,y:pd.y-30,txt:CORE_NAMES[pz.target]+' ('+pz.hits+'/'+pz.needHits+')',t:0,life:1,c:'#e6dac4',size:10,disp:true});
   }else{
    /* ERRO — a contagem volta a zero */
    pz.hits=0;pz.failT=.8;
    blip('sawtooth',170,60,.25,.1);
    game.shake=Math.max(game.shake,4);
    sparks(pd.x,pd.y,'#3a2f33',12,170,.5,2.5,true);
    rollCoreTarget();
    texts.push({x:pd.x,y:pd.y-30,txt:'ERRADO — '+CORE_NAMES[pz.target],t:0,life:1,c:'#d9465a',size:10,disp:true});
    pz.cool=.7;
   }
   return;
  }
  if(!near)pd.wasIn=false;
 }
}
function drawPzCores(pz){
 for(const pd of pz.peds){
  const isT=pd.c===pz.target;
  const pul=.6+.4*Math.sin(game.t*5+pd.fl);
  ctx.save();
  ctx.globalAlpha=pz.failT>0?.5:1;
  /* pedestal */
  ctx.fillStyle='rgba(12,9,12,.9)';
  ctx.beginPath();ctx.ellipse(pd.x,pd.y+8,17,7,0,0,TAU);ctx.fill();
  ctx.fillStyle=CORE_COLORS[pd.c];
  ctx.globalAlpha=(isT?.95:.8)*(pz.failT>0?.4:1);
  ctx.beginPath();ctx.arc(pd.x,pd.y-6,13,0,TAU);ctx.fill();
  if(isT){
   ctx.globalAlpha=pul*.5;
   ctx.strokeStyle=CORE_COLORS[pd.c];ctx.lineWidth=3;
   ctx.beginPath();ctx.arc(pd.x,pd.y-6,19+3*pul,0,TAU);ctx.stroke();
   ctx.globalAlpha=pul;
   ctx.fillStyle='#fff';
   ctx.beginPath();ctx.arc(pd.x,pd.y-10,3,0,TAU);ctx.fill();
  }
  ctx.restore();
 }
 /* contador de acertos */
 ctx.save();
 ctx.globalAlpha=.9;
 txt(CORE_NAMES[pz.target]+'  '+'●'.repeat(pz.hits)+'○'.repeat(pz.needHits-pz.hits),game.absMain.x+game.absMain.w/2,game.absMain.y+44,MONO,11,CORE_COLORS[pz.target],'center',2);
 ctx.restore();
}
function buildEchoes(){
 const m=game.absMain;
 const cx=m.x+m.w/2,cy=m.y+m.h*.45;
 game.puzzle={type:'echoes',waiting:game.seenGlyphs.length<3,need:[],plates:[],prog:0,failT:0,solved:false,stone:{x:cx,y:cy}};
 if(!game.puzzle.waiting)setupEchoPlates();
 game.banner={type:'small',txt:'A PEDRA QUE LEMBRA',
  sub:game.puzzle.waiting?'a pedra dorme — desperte quatro marcas da descida':'repita quatro marcas na ordem em que despertaram',
  t:0,dur:2.6};
 blip('sine',300,500,.2,.06);
}
function setupEchoPlates(){
 const pz=game.puzzle;
 const count=Math.min(4+Math.floor(game.floor/2),Math.max(4,game.seenGlyphs.length));
 pz.need=game.seenGlyphs.slice(0,count);
 pz.plates=[];
 pz.prog=0;
 const m=game.absMain;
 const cx=m.x+m.w/2,cy=m.y+m.h*.45;
 const R=Math.max(95,Math.min(m.w,m.h)*.3);
 const idx=Array.from({length:pz.need.length},(_,i)=>i);
 for(let i=idx.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=idx[i];idx[i]=idx[j];idx[j]=t;}
 for(let k=0;k<pz.need.length;k++){
  const a=-Math.PI/2+idx[k]/pz.need.length*TAU;
  pz.plates.push({x:clamp(cx+Math.cos(a)*R,m.x+50,m.x+m.w-50),y:clamp(cy+Math.sin(a)*R*.8,m.y+50,m.y+m.h-50),sym:pz.need[k],near:false});
 }
 sparks(cx,cy,'#bfd8e8',10,140,.7,2.5,true);
 blip('sine',420,560,.3,.06);
}
function updatePlates(dt){
 const pz=game.puzzle;
 if(pz.memoT>0){pz.memoT-=dt;return;}
 for(const pl of pz.plates){
  const near=dist(player.x,player.y,pl.x,pl.y)<24;
  if(near&&!pl.near&&!pl.pressed){
   if(pl.n===pz.need){
    pl.pressed=true;pz.need++;
    blip('sine',400+pz.need*80,500+pz.need*80,.1,.06);
    sparks(pl.x,pl.y,'#ffd9a0',5,120,.4,2.5,true);
    if(pz.need>pz.numPlates)solvePuzzle();
   }else{
    pz.failT=.7;
    for(const q of pz.plates)q.pressed=false;
    pz.need=1;
    if(pz.diff>=2)pz.memoT=2.0+pz.diff*.35;
    blip('sawtooth',160,60,.2,.1);
    game.shake=Math.max(game.shake,3);
   }
  }
  pl.near=near;
 }
}
function updateBraziers(dt){
 const pz=game.puzzle;
 /* v1.0.0: fase de demonstração — a ordem pulsa uma vez, sem input */
 if(pz.introT>0)pz.introT-=dt;
 for(const b of pz.braziers){
  const near=dist(player.x,player.y,b.x,b.y)<26;
  if(near&&!b.near&&!b.lit&&pz.introT<=0){
   if(pz.diff===0){
    b.lit=true;
    blip('sine',260+b.sym*40,340+b.sym*40,.15,.07);
    sparks(b.x,b.y-14,'#ff8f3d',6,110,.5,2.5,true);
    if(pz.braziers.every(x=>x.lit))solvePuzzle();
   }else if(b.sym===pz.order[pz.prog]){
    b.lit=true;pz.prog++;
    blip('sine',260+b.sym*40,340+b.sym*40,.15,.07);
    sparks(b.x,b.y-14,'#ff8f3d',6,110,.5,2.5,true);
    if(pz.prog>=pz.order.length)solvePuzzle();
   }else{
    pz.failT=.8;
    for(const q of pz.braziers)q.lit=false;
    pz.prog=0;
    blip('sawtooth',160,60,.2,.1);
    game.shake=Math.max(game.shake,3);
    texts.push({x:b.x,y:b.y-34,txt:'a chama recusa',t:0,life:.9,c:'#d9465a',size:11});
   }
  }
  b.near=near;
 }
}
function updateEchoes(dt){
 const pz=game.puzzle;
 if(pz.waiting){
  if(game.seenGlyphs.length>=4){
   pz.waiting=false;
   setupEchoPlates();
   game.banner={type:'small',txt:'A PEDRA ACORDOU',sub:'três marcas pulsam na pedra',t:0,dur:1.8};
  }
  return;
 }
 for(const pl of pz.plates){
  const near=dist(player.x,player.y,pl.x,pl.y)<24;
  if(near&&!pl.near){
   if(pl.sym===pz.need[pz.prog]){
    pz.prog++;
    blip('sine',300+pz.prog*140,420+pz.prog*140,.16,.07);
    sparks(pl.x,pl.y,'#bfd8e8',6,120,.5,2.5,true);
    if(pz.prog>=pz.need.length)solvePuzzle();
   }else{
    pz.failT=.8;pz.prog=0;
    blip('sawtooth',160,60,.2,.1);
    game.shake=Math.max(game.shake,3);
    texts.push({x:pl.x,y:pl.y-28,txt:'a pedra se apaga',t:0,life:.9,c:'#d9465a',size:11});
   }
  }
  pl.near=near;
 }
}
function drawPzPlates(pz){
 /* v1.0.0: SEM NÚMEROS — durante a fase inicial a ordem pulsa uma vez (Simon);
    depois disso é memória pura. Nada é revelado em erro. */
 const memoDur=pz.memoDur||1.5;
 const flashN=pz.memoT>0?Math.min(pz.numPlates,Math.floor((memoDur-pz.memoT)/.45)+1):-1;
 for(const pl of pz.plates){
  ctx.save();
  ctx.translate(pl.x,pl.y);
  const R=18;
  if(pl.pressed){
   ctx.fillStyle='rgba(255,217,160,.3)';
   ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
   ctx.strokeStyle='#ffd9a0';
  }else if(pz.failT>0){
   ctx.strokeStyle='rgba(217,70,90,'+(.5+.4*Math.sin(game.t*20))+')';
  }else if(!pl.decoy&&flashN>0&&pl.n===flashN){
   /* a placa da vez pulsa — a única dica que o enigma dá */
   const pul=.5+.5*Math.sin(game.t*18);
   ctx.fillStyle='rgba(255,217,160,'+(.22+.2*pul)+')';
   ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
   ctx.strokeStyle='#ffd9a0';
   ctx.lineWidth=3.5;
   ctx.beginPath();ctx.arc(0,0,R+5+pul*3,0,TAU);ctx.stroke();
  }else{
   ctx.strokeStyle=pz.solved?'#ffd9a0':'rgba(242,240,234,'+(.5+.25*Math.sin(game.t*3))+')';
  }
  ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();
  ctx.restore();
 }
}
function drawPzBraziers(pz){
 /* v1.0.0: a barra de símbolos (indicação) saiu. Durante a intro, o braseiro
    da vez pulsa no chão; a lacuna escondida permanece escura. */
 if(pz.diff>0&&pz.introT>0){
  const step=Math.min(pz.order.length-1,Math.floor((pz.introDur-pz.introT)/.55));
  if(step!==pz.hidden){
   const target=pz.braziers.find(b=>b.sym===pz.order[step]);
   if(target){
    const pul=.5+.5*Math.sin(game.t*16);
    ctx.save();
    ctx.globalAlpha=.35+.35*pul;
    ctx.fillStyle='#ff8f3d';
    ctx.beginPath();ctx.arc(target.x,target.y,26+pul*8,0,TAU);ctx.fill();
    ctx.restore();
   }
  }
 }
 for(const b of pz.braziers)drawBrazier(b,pz);
}
function drawBrazier(b,pz){
 ctx.save();
 ctx.translate(b.x,b.y);
 ctx.fillStyle='rgba(0,0,0,.35)';
 ctx.beginPath();ctx.ellipse(0,10,15,5,0,0,TAU);ctx.fill();
 ctx.fillStyle='#241b16';
 ctx.strokeStyle='#4a3a2c';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-10,-2);ctx.lineTo(10,-2);ctx.lineTo(7,10);ctx.lineTo(-7,10);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#3a2c20';ctx.fillRect(-3,-14,6,12);
 if(b.lit){
  const fl=.7+.3*Math.sin(game.t*9+b.fl);
  ctx.globalAlpha=.15+.1*fl;
  ctx.fillStyle='#ff8f3d';
  ctx.beginPath();ctx.arc(0,-16,20,0,TAU);ctx.fill();
  ctx.globalAlpha=1;
  ctx.fillStyle='rgba(255,143,61,'+(.55*fl)+')';
  ctx.beginPath();ctx.ellipse(0,-17,5,9*fl,0,0,TAU);ctx.fill();
  ctx.fillStyle='rgba(255,243,196,'+(.85*fl)+')';
  ctx.beginPath();ctx.arc(0,-15,2.6,0,TAU);ctx.fill();
 }
 if(pz.diff>=1)drawSymbol(b.sym,0,-32,7,b.lit?'#ffd9a0':'#9c8f7c',.9);
 else if(!pz.solved&&dist(player.x,player.y,b.x,b.y)<130){
  ctx.globalAlpha=.45+.3*Math.sin(game.t*3+b.fl);
  txt('acender',0,-30,MONO,8,'#9c8f7c','center',2);
 }
 ctx.restore();
}
function drawPzEchoes(pz){
 const st=pz.stone;
 ctx.save();
 ctx.translate(st.x,st.y);
 ctx.fillStyle='rgba(16,12,18,.95)';
 ctx.strokeStyle='rgba(159,216,255,.35)';ctx.lineWidth=2;
 ctx.beginPath();
 ctx.moveTo(-16,16);ctx.lineTo(-12,-16);ctx.lineTo(0,-26);ctx.lineTo(12,-16);ctx.lineTo(16,16);ctx.lineTo(0,22);ctx.closePath();
 ctx.fill();ctx.stroke();
 for(let i=0;i<3;i++){
  const on=i<pz.prog;
  ctx.fillStyle=on?'#ffd9a0':(i<game.seenGlyphs.length?'rgba(191,216,232,.55)':'rgba(191,216,232,.3)');
  ctx.beginPath();ctx.arc((i-1)*11,-8,3,0,TAU);ctx.fill();
 }
 ctx.restore();
 if(pz.waiting){
  ctx.globalAlpha=.5+.25*Math.sin(game.t*3);
  txt('a pedra dorme — '+Math.min(game.seenGlyphs.length,3)+'/3 marcas',st.x,st.y+46,MONO,10,'#8fa8b8','center',2);
  txt('desperte-as nas salas por onde você desceu',st.x,st.y+64,MONO,9,'#6e6357','center',2);
  ctx.globalAlpha=1;
  return;
 }
 for(let i=0;i<pz.plates.length;i++){
  const pl=pz.plates[i];
  const lit=i<pz.prog;
  ctx.save();
  ctx.translate(pl.x,pl.y);
  ctx.strokeStyle=lit?'#ffd9a0':'rgba(191,216,232,'+(.4+.25*Math.sin(game.t*2.5+i))+')';
  ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,16,0,TAU);ctx.stroke();
  if(lit){ctx.fillStyle='rgba(255,217,160,.14)';ctx.beginPath();ctx.arc(0,0,16,0,TAU);ctx.fill();}
  drawSymbol(pl.sym,0,0,7,lit?'#ffd9a0':'#bfd8e8',.9);
  ctx.restore();
 }
}
/* — salas secretas de chefe: O VELHO REI e ERRO 404 têm sala própria no mapa — */
function startSecretBossIntro(kind,r){
 if(kind==='e404'){
  r.e404=true;
  ROOM.inverted=true;buildRoomFloor();
  game.penumbra=null;
  game.roomQueue=[];
  game.state='e404intro';game.e404T=0;game.e404Spawned=false;
  sfx.static_();blip('square',60,1200,.8,.14);
 }else{
  game.roomQueue=[];
  game.state='reiintro';game.reiT=0;game.reiSpawned=false;
  /* v1.6.0: O REI FECHA A SALA — entrou na sala secreta dele, não existe
     volta: TODAS as portas se fecham (inclusive a rachadura da sala
     isolada) até o rei cair. A morte dele reabre (updateReiDeath →
     openDoors), como sempre fez. */
  for(const d of game.doors)d.open=false;
  game.shake=Math.max(game.shake,6);
  sfx.creak();blip('sine',80,40,1.4,.1);
 }
}
function enterRoom(i,fromDir){
 /* v1.6.0: guarda a origem da sala ATUAL antes de trocar — os itens no chão
    (bênçãos, pactos, almas, vida, fagulhas, itens únicos) vão ser guardados
    NA SALA que estamos deixando, e voltam ao reentrar. Nada some. */
 const prevRoom=game.mapRooms[game.roomIdx];const prevOX=ROOM.x,prevOY=ROOM.y;
 game.roomIdx=i;
 game.portal=null;game._blessGateHint=false; /* v1.6.3: dica da bênção vale por sala */
 game._kzRush=false; /* v1.6.4: A ENXURRADA — só salas kaizo aceleram as balas */
 game.reiT=0;game.reiSpawned=false;
 game.rkP2=false;game.rkUlt=null;game.rkUltT=0;
 game.windowScene=null;
 const r=game.mapRooms[i];
 /* PENUMBRA: cheat de sala moldada — a próxima sala NOVA entra como o tipo escolhido */
 if(game.forceNext&&!r.visited&&r.kind!=='start'){
  const conv={combat:'combat',boss:'boss',secret:'secret',shop:'shop',srei:'sboss',se404:'sboss'}[game.forceNext];
  if(conv){
   r.kind=conv;r.pzType=null;r.flavor=null;r.miniType=null;
   if(game.forceNext==='srei')r.sbossKind='rei';
   if(game.forceNext==='se404')r.sbossKind='e404';
   const nm={combat:'SALA DE INIMIGOS',boss:'SALA DO CHEFE',secret:'SALA SECRETA',shop:'LOJA',srei:'SALA SECRETA — O VELHO REI',se404:'SALA SECRETA — ERRO 404'}[game.forceNext];
   game.forceNext=null;buildLabRooms();
   texts.push({x:W/2,y:H*.26,txt:'PENUMBRA — '+nm,t:0,life:1.9,c:'#ffd9a0',size:13,disp:true});
  }
 }
 const first=!r.visited;
 if(first){r.visited=true;game.globalRoom++;META.rooms=Math.max(META.rooms,game.globalRoom);saveMeta();}
 game.roomKind=r.kind;
 game.threat=clamp(Math.round(game.floor*2+countCleared()*.7),1,18);
 game.waveT=0;game.waveState='intro';game.spawnT=.3;game.roomQueue=[];
 game.roomEvent=null;game.shopItems=[];game.shopNear=null;game.keeper=null;game.keeperNear=false;game.e404T=0;game.e404Spawned=false;
 /* v0.9.6/v0.9.7: sala de sacrifício e de loja são mutuamente excludentes —
    ao trocar de sala, sempre limpa o altar da sala anterior. */
 game.sacrificeAltar=null;
 /* v0.9.7: ao SAIR do modo inferno (transição de sala), dispara o glitch de 2s. */
 if(game.hellMode&&fromDir){
  game.glitchT=2.0;
  game.hellMode=false;
  game.hellEyes=[]; /* limpa os olhos do chão */
  META.hellMode=false;saveMeta();
 }
 bullets=[];ebullets=[];rings=[];geyserMarks=[];spawnMarks=[];shockwaves=[];enemies=[];
 telegraphs=[];actMinions=[];/* v0.9.16: limpa avisos/minions ao trocar de sala */
 thrownSaw=null;lightBeam=null;
 /* v1.6.0: SEM DESPAWN AO SAIR DA SALA — em vez de apagar tudo, os itens do
    chão são guardados na sala que ficamos (menos baús, que têm o próprio
    sistema de re-push). Ao reentrar, eles voltam exatamente onde estavam. */
 if(prevRoom&&pickups.length){
  const keepPk=pickups.filter(function(p){return p.type!=='chest';});
  if(keepPk.length)prevRoom.savedPk={ox:prevOX,oy:prevOY,items:keepPk};
 }
 pickups=[];
 if(r.kind==='boss'){
  /* v1.5.0: a arena do chefe usa a FORMA da sala (danmaku = arena maior,
     ~1.69× a área; FÁCIL = tela cheia de sempre), centrada no mundo */
  const bs=r.shape||{bw:W,bh:H};
  const bx=Math.round((W-bs.bw)/2),by=Math.round((H-bs.bh)/2);
  ROOM.x=bx;ROOM.y=by;ROOM.w=bs.bw;ROOM.h=bs.bh;ROOM.inverted=false;
  game.absRects=[{x:bx,y:by,w:bs.bw,h:bs.bh}];game.absMain={x:bx,y:by,w:bs.bw,h:bs.bh};
  game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
  buildRoomFloor();buildDoors();
  player.x=W/2;player.y=Math.min(by+bs.bh*.8,H*.8);player.mvx=0;player.mvy=0;player.angle=-Math.PI/2;
  updateCamera(0,true);
  beginBossIntro();
  return;
 }
 const sh=r.shape;
 /* v1.5.0: sala maior que a tela = CENTRALIZADA no mundo (pode nascer com
    coordenada negativa — a câmera cuida do resto). Sala que cabe = regras antigas. */
 let ax,ay;
 if(sh.bw>W-48||sh.bh>H-96){
  ax=Math.round((W-sh.bw)/2)+Math.round(rnd(-1,1)*Math.min(30,(sh.bw-W)*.18+30));
  ay=Math.round((H-sh.bh)/2)+Math.round(rnd(-1,1)*Math.min(18,(sh.bh-H)*.2+18));
 }else{
  ax=clamp(Math.round((W-sh.bw)/2+rnd(-50,50)),24,Math.max(24,W-24-sh.bw));
  ay=clamp(Math.round((H-sh.bh)/2+12+rnd(-22,22)),58,Math.max(58,H-58-sh.bh));
 }
 ROOM.x=ax;ROOM.y=ay;ROOM.w=sh.bw;ROOM.h=sh.bh;ROOM.inverted=false;
 game.absRects=sh.rects.map(rc=>({x:rc.x+ax,y:rc.y+ay,w:rc.w,h:rc.h}));
 game.absMain=game.absRects[0];
 buildRoomFloor();buildDoors();
 /* v1.6.0: DEVOLVE os itens guardados desta sala — deslocados pela
    diferença da nova origem (o layout re-sorteia o deslocamento a cada
    visita). Baús ficam com o sistema antigo. */
 if(r.savedPk){
  const sdx=ROOM.x-r.savedPk.ox,sdy=ROOM.y-r.savedPk.oy;
  for(const q of r.savedPk.items){q.x+=sdx;q.y+=sdy;pickups.push(q);}
  r.savedPk=null;
 }
 const opp={n:'s',s:'n',e:'w',w:'e'};
 if(fromDir&&r.doors[opp[fromDir]]>=0){
  const dp=doorPos(opp[fromDir]);
  const iv={n:[0,44],s:[0,-44],e:[-44,0],w:[44,0]}[opp[fromDir]];
  player.x=dp.x+iv[0];player.y=dp.y+iv[1];
 }else{
  player.x=ROOM.x+ROOM.w/2;player.y=ROOM.y+ROOM.h*.72;
 }
 player.mvx=0;player.mvy=0;player.angle=-Math.PI/2;
 clampArena(player,player.r);
 updateCamera(0,true);
 /* decoração, janela, penumbra e puzzle */
 buildDecor(r);
 buildPenumbra(r);
 game.puzzle=null;
 if(r.kind==='puzzle'&&!r.pzSolved)buildPuzzle();
 if(!r.cleared&&first){
  if(r.kind==='sboss'){startSecretBossIntro(r.sbossKind,r);return;}
  if(r.kind==='empty'){
   const fl=r.flavor||'ruin';
   game.banner={type:'small',txt:fl==='silent'?'SALA SILENCIOSA':fl==='souls'?'O AR PESA AQUI':fl==='memory'?'RESTOS DE ALGUÉM':'SALÃO EM RUÍNAS',
    sub:pick(EMPTY_SUBS[fl]||EMPTY_SUBS.ruin),t:0,dur:2};
   if(fl==='souls'){blip('sine',170,45,2.2,.05);noiseSfx(1.8,.03,300,'lowpass');}
   else if(fl!=='silent')blip('sine',200,140,.2,.05);
   /* recompensa rara pela curiosidade */
   if(fl!=='silent'){
    if(Math.random()<.3){
     const p=randRoomPointM(Math.random,60);
     pickups.push({type:'soul',x:p.x,y:p.y,t:0,ph:rnd(TAU)});
     pickups.push({type:'soul',x:p.x+rnd(-24,24),y:p.y+rnd(-18,18),t:0,ph:rnd(TAU)});
    }
    if(fl==='memory'&&Math.random()<.1)pickups.push({type:'heart',x:game.absMain.x+game.absMain.w*.5+rnd(-60,60),y:game.absMain.y+game.absMain.h*.3,t:0,ph:rnd(TAU)});
   }
  }
  if(r.kind==='combat'){
   /* chefes secretos: Erro 404 NUNCA aparece naturalmente — precisa explodir a janela.
      Velho Rei ainda pode aparecer. */
   const roll404=false; /* v0.9.6: 0% de chance — só via janela explodida */
   /* v1.1.0: o VELHO REI abandonou os corredores — agora só caça SALAS SECRETAS (1%) */
   const rollRei=false;
   if(roll404||rollRei){
    r.kind='sboss';r.sbossKind=roll404?'e404':'rei';game.roomKind='sboss';
    startSecretBossIntro(r.sbossKind,r);
    return;
   }
   if(Math.random()<Math.min(.15*secretMul(),.45)){
    const ev=pick(['soulrain','frenzy','blood','void']);
    game.roomEvent={type:ev,t:0,acc:0};
    game.banner={type:'boss',txt:'EVENTO',sub:EVENT_LABEL[ev],t:0,dur:2};sfx.echo();
   }else game.banner={type:'small',txt:'',sub:pick(ROOM_SUBS),t:0,dur:1.0};
   game.roomQueue=buildRoomQueue('combat');
  }else if(r.kind==='miniboss'){
   const t=r.miniType||'mb';
   /* v1.6.4: A CORTE DUPLA — 5% das salas de chefe acordam DOIS senhores de uma vez */
   if(!r._twinRolled){r._twinRolled=true;if(Math.random()<.05)r._twin=true;}
   game._kzRush=!!r.kaizo; /* v1.6.4: balas 30% mais rápidas na sala kaizo */
   /* v1.5.0: APRESENTAÇÃO VS (Thor — VS — Mini-Chefe) na primeira visita;
      o ritual de surgimento dele acontece logo depois, como sempre fez */
   if(!r._vsDone){r._vsDone=true;game._vsPending={type:t,kaizo:!!r.kaizo,neo:!!r._neo,twin:!!r._twin};}
   else{
     spawnMarkAt(t,game.absMain.x+game.absMain.w/2,game.absMain.y+game.absMain.h*.3,true,!!r.kaizo);
     if(r._twin){spawnMarkAt(t,game.absMain.x+game.absMain.w*.32,game.absMain.y+game.absMain.h*.64,true,!!r.kaizo,.8);
       texts.push({x:W/2,y:H*.32,txt:'A CORTE DUPLA',t:0,life:2,c:'#ff2450',size:15,disp:true});}
   }
   game.banner={type:'boss',txt:miniDisplayName(t,!!r.kaizo,!!r._neo),sub:r._twin?'a corte dupla — DOIS senhores numa sala só':r._neo?'a forma acelerada — ataques quase contínuos':r.kaizo?'a forma branca do abismo — padrões que você nunca viu':'o chefe deste mapa',t:0,dur:2.2};
   sfx.roar();game.shake=10;
  }else if(r.kind==='challenge'){
   game.roomQueue=buildRoomQueue('challenge');
   game.banner={type:'boss',txt:'SALA DE DESAFIO',sub:'sobreviva — um tesouro espera',t:0,dur:2.2};
   sfx.roar();game.shake=8;
  }
 }else if(r.cleared){game.waveState='done';}
 /* v1.5.0: DANMAKU — inimigos JÁ ESTÃO na sala quando Thor entra (sem ondas,
    sem surgimento artificial). A reinicialização de sala não limpa continua
    valendo: reentrou sem limpar, a guarnição volta aos postos. */
 if(dmk()&&!r.cleared&&(r.kind==='combat'||r.kind==='challenge')&&game.roomQueue.length){
  preSpawnRoom();
 }
 if(r.kind==='sboss'&&!r.cleared){startSecretBossIntro(r.sbossKind,r);return;}
 if(!r.cleared&&!needsClear(r.kind)){r.cleared=true;game.waveState='done';}
 /* v0.9.9: altar de sacrifício recriado a CADA entrada na sala (uso múltiplo).
    Antes existia só na 1ª visita e era anulado ao trocar de sala — o jogador
    voltava e o altar tinha desaparecido (era isso que "não aparecia"). */
 if(r.kind==='sacrifice'){
  game.keeper=null;game.keeperNear=false;
  game.sacrificeAltar={x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,used:false};
 }
 if(first){
  if(r.kind==='treasure'){
   /* v0.9.9: sala de tesouro = UMA sala do baú. O baú dá 1 item de qualquer
      raridade — quanto mais raro, mais difícil de aparecer. Sem mais pedestal
      enganoso nem bênção invisível/inegável. */
   r.chestDropped=true;
   pickups.push({type:'chest',x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0,ph:rnd(TAU),curve:'peito'});
   game.banner={type:'small',txt:'TESOURO',sub:'um baú aguarda no pedestal',t:0,dur:1.4};
   blip('sine',600,900,.2,.07);
  }else if(r.kind==='shop'){
   buildShop();
   r.shopSaved=game.shopItems;r.shopLuck=game.shopLuck;
   game.banner={type:'small',txt:'LOJA',sub:(game.shopLuck?'SORTE DO ERRANTE — 30% mais barato · ':'')+'mercadorias no chão — chegue perto e pressione [Z]',t:0,dur:game.shopLuck?3:2.2};
   blip('sine',600,900,.2,.07);
  }else if(r.kind==='secret'){
   /* v1.3.3: a sala secreta dá APENAS UMA coisa — um item, mais vida ou
      o velho rei. Isolada no mapa; de dentro só existe o caminho de volta. */
   if(first){
    if(!game.reiFought&&Math.random()<.14){
     r.kind='sboss';r.sbossKind='rei';game.roomKind='sboss';
     startSecretBossIntro('rei',r);
     return;
    }
    if(Math.random()<.5){
     r.chestDropped=true;
     dropRandomBlessing(game.absMain.x+game.absMain.w/2,game.absMain.y+game.absMain.h*.42);
     game.banner={type:'small',txt:'SALA SECRETA',sub:'algo esquecido foi deixado aqui',t:0,dur:2.6};
    }else{
     player.maxHp+=4;player.hp=Math.min(player.maxHp,player.hp+4);
     sparks(player.x,player.y,'#d9465a',18,240,.8,4,true);
     game.banner={type:'small',txt:'SALA SECRETA',sub:'+4 de vida máxima — o lugar te reconhece',t:0,dur:2.6};
    }
    blip('sine',480,720,.3,.07);
   }
   /* v1.6.0: A CHANCE MÍNIMA — TODA entrada numa sala secreta (inclusive
      revisitas) tem 10% de revelar uma BÊNÇÃO ALEATÓRIA extra. Se a visita
      já deixou uma bênção no chão, ela não duplica. */
   if(!pickups.some(function(q){return q.type==='blessing_drop';})&&Math.random()<.10){
    dropRandomBlessing(game.absMain.x+game.absMain.w/2+rnd(-30,30),game.absMain.y+game.absMain.h*.42+rnd(-18,18));
    texts.push({x:player.x,y:player.y-56,txt:'algo brilhou entre os escombros...',t:0,life:2,c:'#ffd9a0',size:11,disp:true});
    blip('sine',760,1140,.25,.08);
   }
   sfx.echo();
  }else if(r.kind==='sacrifice'){
   /* v0.9.9: sala de sacrifício — altar de sangue no centro, recriado a CADA
      visita (antes só na 1ª, e era apagado ao trocar de sala = altar invisível
      e uso único). Agora pode sacrificar várias vezes: uma por visita. */
   game.keeper=null;game.keeperNear=false;
   game.sacrificeAltar={x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,used:false};
   game.banner={type:'small',txt:'SACRIFÍCIO',sub:'um altar de sangue aguarda',t:0,dur:1.2};
   blip('sine',200,100,.3,.07);
  }else if(r.kind==='start'&&game.floor===1){
   if(game.pendingRelicChoice){
    /* v0.9.9: SALA DAS RELÍQUIAS — a sala inicial fica TRANCADA até escolher UMA */
    game.relicRoom=true;
    for(const d of game.doors)d.open=false;
    game.banner={type:'small',txt:'A SALA DAS RELÍQUIAS',sub:'escolha UMA relíquia para prosseguir',t:0,dur:3};
    showRelicChoice();
   }else{
    game.banner={type:'small',txt:'',sub:'',t:0,dur:.1};
   }
   blip('sine',150,90,.25,.06);
  }
 }
 /* v1.1.0: O ERRANTE não abandona o posto — ao voltar, ele está lá,
    com o mesmo estoque (o que foi comprado segue comprado) */
 if(r.kind==='shop'){
  const ckx=game.absMain.x+game.absMain.w/2,cky=game.absMain.y+game.absMain.h*.5;
  game.keeper={x:ckx,y:cky,ph:rnd(TAU)};
  if(r.shopSaved)game.shopItems=r.shopSaved;
  if(r.shopLuck!=null)game.shopLuck=r.shopLuck;
  layoutShopFloor();
  game.keeperNear=false;
 }
 if(!first&&(r.kind==='treasure'||r.kind==='secret'||r.kind==='challenge'||r.kind==='puzzle')&&r.chestDropped&&!r.chestTaken){
  pickups.push({type:'chest',x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0,ph:rnd(TAU),curve:'peito'});
 }
 if(r.hasPortal&&(game.floor<4||(game.region==='limbo'&&(game.limboPhase||1)<4))){ /* v1.3.0: zonas */
  game.portal={x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0};
 }
 if(r.cleared&&!game.relicRoom&&!(game.puzzle&&game.puzzle.lock&&!game.puzzle.solved))openDoors();
 if(window.__EXPANSION)window.__EXPANSION.onEnterRoom(); /* v1.3.0: zonas/eventos */
}
/* ============ v0.9.9: SALA DAS RELÍQUIAS — escolha de UMA relíquia ============ */
function showRelicChoice(){
const unlocked=UNLOCKS.filter(u=>u.chk(META));
if(unlocked.length<2)return false;
game.state='relicselect';
showOv('relicChoice');
const box=ov('relicCards');
if(!box)return true;
box.innerHTML='';
for(const u of unlocked){
 const el=document.createElement('div');
 el.className='card';
 el.style.cursor='pointer';
 el.style.borderColor='#9fd8ff';
 el.innerHTML='<h3 style="color:#9fd8ff">'+u.name+'</h3><p>'+u.desc+'</p><div class="lvl" style="color:#9fd8ff">RELÍQUIA · escolha única</div>';
 el.addEventListener('click',function(){
  audio();
  if(!game.pendingRelicChoice)return;
  game.pendingRelicChoice=false;game.relicRoom=false;game.relicChoiceDone=true;
  if(u.apply)u.apply();
  META.done[u.id]=1;saveMeta();
  sfx.levelup();sfx.roar();
  sparks(player.x,player.y,'#9fd8ff',30,300,.9,4,true);
  hideOv('relicChoice');
  openDoors();
  game.banner={type:'circle',txt:'RELÍQUIA ESCOLHIDA',name:u.name,sub:u.desc+' — as outras dormem até a próxima descida',t:0,dur:3.6};
  blurActive();
  /* itens míticos (se desbloqueados) aparecem logo após a relíquia */
  if(!showMythicChoice())game.state='play';
 });
 box.appendChild(el);
}
return true;
}
function checkFullSweep(){
if(!game.mapRooms.length)return;
if(game.builderLive)return;
/* ==== v1.3.0: ZONAS — portal, caminho do portão, corredor azul ou sala do
   chefe decide-se pela REGIÃO/FASE: Penumbra 1-3 → portal · Penumbra
   Infernal (andar 4) → CAMINHO DO PORTÃO (Cérbero) · Garganta Vulcânica →
   CORREDOR AZULADO (Caronte) · Limbo fases 1-3 → portal · Limbo fase 4 →
   sala do JUIZ SEM ROSTO ==== */
const reg=game.region;
if(reg==='penumbra'&&game.floor<4){
if(!game.mapRooms.every(r=>r.cleared||r.isolated))return;
if(game.portal)return;
/* v1.6.3: A BÊNÇÃO PRIMEIRO — se a bênção que o chefe derrubou ainda está no
   chão, o portal NÃO nasce: ele espera você pegá-la. No instante em que a
   bênção é coletada, o varredor roda de novo e abre o portal na hora. */
if(pickups.some(q=>q.type==='blessing_drop')){
if(!game._blessGateHint){game._blessGateHint=true;
texts.push({x:W/2,y:H*.3,txt:'A BÊNÇÃO AGUARDA — O PORTAL NASCE QUANDO VOCÊ A PEGAR',t:0,life:2.8,c:'#ffd9a0',size:12,disp:true});
sfx.echo();}
return;
}
const r=game.mapRooms[game.roomIdx];
if(r)r.hasPortal=true;
game.portal={x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0};
game.banner={type:'boss',txt:'O MAPA FOI VARRIDO',sub:'o portal para a próxima descida se abriu',t:0,dur:2.8};
sfx.rumble();sfx.echo();game.shake=12;game.flash=.3;
return;
}
if(reg==='penumbra'&&game.floor>=4){
/* v1.3.3: NÃO é preciso varrer o andar — matar O BOSS faz a escada descer
   no salão (é ela que leva ao corredor do portão). Nada automático aqui. */
return;
}
if(reg==='vulcan'){
/* v1.4.4: o fim da Garganta NÃO é mais automático — matar o FERREIRO faz a
   ESCADA DO FRIO descer (onKill), e é pisando nela que se chega ao corredor
   azulado. Se a escada ainda não nasceu (sala marcada limpa por outra via),
   o varredor a faz nascer no salão atual. Nada de fase infinita. */
if(!game.mapRooms.every(r=>r.cleared||r.isolated))return;
if(!game.vulcStair&&!game._stairDescend){
 const m=game.absMain;
 game.vulcStair={x:m.x+m.w/2,y:m.y+m.h*.42,t:0};
 const rv=game.mapRooms[game.roomIdx];if(rv)rv.stair={x:game.vulcStair.x,y:game.vulcStair.y};
 game._ferreiroDead=1;
 game.banner={type:'boss',txt:'A ESCADA DO FRIO',sub:'o calor recua — os degraus descem para o corredor azulado',t:0,dur:3.2};
 try{sfx.rumble();sfx.echo();}catch(e){}
}
return;
}
if(reg==='limbo'&&(game.limboPhase||1)<4){
if(!game.mapRooms.every(r=>r.cleared||r.isolated))return;
if(game.portal)return;
/* v1.6.3: idem no Limbo — a bênção no chão segura o portal */
if(pickups.some(q=>q.type==='blessing_drop')){
if(!game._blessGateHint){game._blessGateHint=true;
texts.push({x:W/2,y:H*.3,txt:'A BÊNÇÃO AGUARDA — O PORTAL NASCE QUANDO VOCÊ A PEGAR',t:0,life:2.8,c:'#ffd9a0',size:12,disp:true});
sfx.echo();}
return;
}
const r=game.mapRooms[game.roomIdx];
if(r)r.hasPortal=true;
game.portal={x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0};
game.banner={type:'boss',txt:'O MAPA FOI VARRIDO',sub:'o portal para a próxima fase se abriu',t:0,dur:2.8};
sfx.rumble();sfx.echo();game.shake=12;game.flash=.3;
return;
}
if(game.extraIdx>=0)return;
if(game.mapRooms.every(r=>r.cleared||r.isolated))openExtraRoom();
}
function openExtraRoom(){
const dv={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]};
const dirs=['n','e','s','w'];
let cand=null;
if(game.roomIdx>=0){
for(const d of dirs){if(game.mapRooms[game.roomIdx].doors[d]===-1){cand={from:game.roomIdx,dir:d};break;}}
}
if(!cand){
loop1:for(let i=0;i<game.mapRooms.length;i++){
for(const d of dirs){if(game.mapRooms[i].doors[d]===-1){cand={from:i,dir:d};break loop1;}}
}
}
if(!cand){
game.banner={type:'boss',txt:'O GUARDIÃO DESPERTA',sub:'não havia para onde fugir',t:0,dur:2.5};
sfx.roar();
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
buildRoomFloor();
beginBossIntro();
return;
}
const from=game.mapRooms[cand.from];
const extra={gx:from.gx+dv[cand.dir][0],gy:from.gy+dv[cand.dir][1],kind:'boss',visited:false,cleared:false,e404:false,chestDropped:false,chestTaken:false,hasPortal:false,miniType:null,pzSolved:false,flavor:null,glyphSym:-1,pzType:null,
  shape:{rects:[{x:0,y:0,w:W,h:H}],bw:W,bh:H},doors:{n:-1,e:-1,s:-1,w:-1}};
game.mapRooms.push(extra);
const bi=game.mapRooms.length-1;
from.doors[cand.dir]=bi;
const opp={n:'s',s:'n',e:'w',w:'e'};
extra.doors[opp[cand.dir]]=cand.from;
game.extraIdx=bi;
game.banner={type:'boss',txt:'O QUARTO EXTRA SE ABRIU',sub:'o portal do guardião revelou-se no mapa',t:0,dur:3};
sfx.rumble();sfx.roar();sfx.echo();game.shake=14;game.flash=.35;
if(cand.from===game.roomIdx){buildDoors();openDoors();}
}
function nextFloor(){
const prevFloor=game.floor;
/* andar concluído (chefe derrotado + portal) = uma descida completa.
   ao somar 3 descidas completas, a 4ª opção do seletor — ??? — se revela */
META.descidas=(META.descidas||0)+1;saveMeta();
game.floor++;
if(window.__RM)window.__RM.onDescend(); /* v1.4.0: dízimo/chave por descida */
if(game.region==='limbo')game.limboPhase=(game.limboPhase||1)+1; /* v1.3.0: 4 fases do Limbo */
game.usedMinis=[]; /* v0.9.9: todo andar tem seu boss do mapa */
game.portal=null;game.extraIdx=-1;
game.rkP2=false;game.rkUlt=null;
/* v0.9.7: ao descer de andar saindo do modo inferno, dispara o glitch de 2s */
if(game.hellMode){
  META.hellSeen=true;saveMeta();/* v0.9.13: conquista PELO INFERNO */
  conqTick();
  game.glitchT=2.0;
  game.hellMode=false;
  game.hellEyes=[]; /* limpa os olhos do chão */
  META.hellMode=false;saveMeta();
}
/* ==== v0.9.1: a transição para o Limbo (andar 4) acontece através do
   encontro com Caronte no andar 3 (cutscene do barco + corredor).
   O nextFloor() normal apenas desce mais um andar da Penumbra ou do Limbo. ==== */
finishFloorEnter();
}
function finishFloorEnter(){
game.mapRooms=genMap();game.seenGlyphs=[];
game.roomIdx=-1;
game.roomFade=1;
enterRoom(0,null);
/* label conforme a região */
/* v1.3.0: legendas por ZONA (Penumbra/Penumbra Infernal/Garganta/Limbo) */
let label,sub;
if(window.__EXPANSION&&window.__ZONE_LABEL){const L=window.__ZONE_LABEL();label=L.label;sub=L.sub;}
else{const inLimbo=game.region==='limbo';label=inLimbo?'ABISMO · DESCIDA ':'PENUMBRA · DESCIDA ';sub=inLimbo?(FLOOR_SUBS_PARADISE[clamp(game.floor,1,8)]||''):(FLOOR_SUBS[clamp(game.floor,1,5)]||'');}
/* v1.4.4: ENTRADAS DE ZONA ganham banner GRANDE — o nome da zona aparece em
   placa de círculo na hora em que você a alcança: PENUMBRA INFERNAL ao acabar
   a penumbra normal (andar 3) e O LIMBO INFERNAL ao passar da fase 2 do Limbo */
if(game.region==='penumbra'&&game.floor===3){
 game.banner={type:'circle',txt:'O CHÃO RACHA',name:'PENUMBRA INFERNAL',sub:sub,t:0,dur:4};
}else if(game.region==='limbo'&&(game.limboPhase||1)===3){
 game.banner={type:'circle',txt:'O PARAÍSO ESQUENTA',name:'O LIMBO INFERNAL',sub:sub,t:0,dur:4};
}else{
 game.banner={type:'wave',txt:label,sub:sub,t:0,dur:2.4};
}
blip('sine',150,90,.3,.08);
sfx.rumble();
}
/* == helper: andar atual usa estética de falso paraíso? == */
/* v0.9.0: o Limbo (falso paraíso) só é ativado após atravessar o corredor pós-Caronte */
function isParadiseFloor(){return game.region==='limbo';}
/* == helper: nível de deformação do paraíso (0=sagrado, 1=estranho, 2=distorcido, 3=perturbador) == */
function paradiseDistort(){
  if(game.floor<=1)return 0;
  if(game.floor===2)return 0.25;
  if(game.floor===3)return 0.55;
  if(game.floor===4)return 0.85;
  return 1.0;
}
/* ==== CORREDOR DE TRANSIÇÃO — Falso Paraíso ====
   Corredor longo e relativamente estreito conectado ao final do Andar 1.
   A iluminação começa tão escura quanto o Andar 1 e aumenta gradualmente,
   dando a sensação de estar saindo da escuridão e entrando em algo celestial. */
function startParadiseCorridor(){
game.state='corridor';
game.corridorT=0;
game.corridorLen=H; /* comprimento vertical (do bottom ao top da tela) */
game.corridorW=260; /* largura relativamente estreita */
game.corridorProg=0; /* 0 a 1, progresso do jogador ao longo do corredor */
ROOM.x=Math.round((W-game.corridorW)/2);
ROOM.y=0;
ROOM.w=game.corridorW;
ROOM.h=H;
ROOM.inverted=false;
game.absRects=[{x:ROOM.x,y:ROOM.y,w:ROOM.w,h:ROOM.h}];
game.absMain=game.absRects[0];
player.x=W/2;
player.y=H-90;
player.mvx=0;player.mvy=0;player.angle=-Math.PI/2;
player.mvx=0;player.mvy=-1;player.angle=-Math.PI/2;
game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
game.doors=[];game.portal=null;
game.roomFade=1;
enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];texts=[];
thrownSaw=null;lightBeam=null;
sfx.rumble();sfx.echo();
blip('sine',120,80,.5,.1);
texts.push({x:W/2,y:H*.18,txt:'DESCIDA II — O FALSO PARAÍSO',t:0,life:3.6,c:'#bfd8e8',size:14,disp:true});
texts.push({x:W/2,y:H*.23,txt:'a luz cresce adiante...',t:0,life:3.6,c:'#9fc0c9',size:11});
}
function updateCorridor(dt){
game.corridorT+=dt;
/* movimento do jogador dentro do corredor */
const ax=(held('right')?1:0)-(held('left')?1:0);
const ay=(held('down')?1:0)-(held('up')?1:0);
const l=Math.hypot(ax,ay);
const spd=215;
if(l){
  player.x+=(ax/l)*spd*dt;
  player.y+=(ay/l)*spd*dt;
  player.mvx=ax/l;player.mvy=ay/l;
  player.walkT+=dt*9;
  player.angle=Math.atan2(player.mvy,player.mvx);
}
/* limites do corredor */
const half=game.corridorW/2-26;
player.x=clamp(player.x,W/2-half,W/2+half);
player.y=clamp(player.y,90,H-50);
/* progresso do corredor: começa em y=H-90, termina em y=120 */
game.corridorProg=clamp((H-90-player.y)/((H-90)-120),0,1);
/* partículas de luz crescente conforme avança */
const pp=game.corridorProg;
const baseRate=.18+pp*.55;
if(Math.random()<baseRate){
  const xMin=ROOM.x+18,xMax=ROOM.x+ROOM.w-18;
  const lx=lerp(80,260,pp); /* distância que viaja */
  const col=pp<.35?'rgba(122,138,154,':pp<.7?'rgba(191,216,232,':'rgba(255,243,196,';
  particles.push({
    x:rnd(xMin,xMax),
    y:rnd(0,H*.4),
    vx:rnd(-6,6),
    vy:rnd(8,22),
    life:lx/22,
    t:0,
    r:rnd(.8,2.4),
    c:col+'.9)',
    drag:.96,
    glow:true
  });
}
/* emite partículas de poeira dourada descendo do alto */
if(pp>.4&&Math.random()<.3){
  particles.push({x:rnd(ROOM.x+20,ROOM.x+ROOM.w-20),y:-10,vx:rnd(-3,3),vy:rnd(12,28),life:2.2,t:0,r:rnd(.6,1.6),c:'rgba(255,243,196,.7)',drag:.99,glow:true});
}
/* pequenas fontes de luz no chão conforme avança — aparecem gradualmente */
if(Math.random()<.05+pp*.12){
  const fy=rnd(H*.3,H-100);
  particles.push({x:rnd(ROOM.x+30,ROOM.x+ROOM.w-30),y:fy,vx:0,vy:-rnd(15,32),life:.9,t:0,r:rnd(1,2),c:'rgba(255,217,160,.9)',drag:.92,glow:true});
}
/* chegou ao fim do corredor? */
if(player.y<=140){
  game.state='play';
  game.roomFade=1;
  game.flash=.4;
  sfx.gate();
  blip('sine',520,720,.5,.12);
  if(game.fromCaronte){
    /* veio da cutscene do barco */
    game.fromCaronte=false;
    /* v1.1.1: a ESCOLA saiu da descida — é opcional, acessada só pelo menu
       CÍRCULOS (porta de teste). O 4º andar volta a revelar o LIMBO, como antes. */
    enterLimboOfficial();
  }else{
    finishFloorEnter();
  }
}
}
/* ============================================================
   enterLimboOfficial — introdução cinematográfica do LIMBO.
   Chamada quando o jogador atravessa o corredor vindo de Caronte.
   ============================================================ */
function enterLimboOfficial(){
/* v1.4.5 BLINDAGEM: qualquer caminho que chegue aqui PRECISA sair do estado de
   cutscene — o limbo é um mapa jogável (enterRoom não troca o state). */
game.state='play';
/* define o andar 4 — ativa a estética do falso paraíso (Limbo) */
/* v1.3.0: o Limbo começa onde a travessia deixar (run normal: andar 6 —
   escola: andar 4) e dura QUATRO fases (2 do Limbo + 2 do Limbo Infernal) */
game.floor=game.pendingLimboFloor||4;
game.region='limbo'; /* v0.9.1: marca que estamos oficialmente no Limbo */
game.limboPhase=1;game._bcActive=false;
game.portal=null;game.extraIdx=-1;
game.rkP2=false;game.rkUlt=null;
game.mapRooms=genMap();game.seenGlyphs=[];
game.roomIdx=-1;
/* limpa o cache do exterior paraíso — força redraw com o novo andar */
paradiseOutsideCache=null;
enterRoom(0,null);
/* banner cinematográfico */
game.banner={type:'circle',txt:'O LIMBO',name:'O LIMBO — FASE 1',sub:'o falso paraíso se revela — almas presas que não avançam nem desaparecem',t:0,dur:4.4};
sfx.levelup();sfx.echo();
blip('sine',220,440,1.2,.12);
game.flash=.6;
}
function drawCorridor(){
const pp=game.corridorProg;
/* === céu/fundo: gradiente que clareia conforme avança === */
const skyTop=lerpColor('#0a0608','#cfe8f5',smooth(pp));
const skyMid=lerpColor('#150e1a','#e8f3fa',smooth(pp));
const skyBot=lerpColor('#1c1422','#fff3c4',smooth(pp));
const g=ctx.createLinearGradient(0,0,0,H);
g.addColorStop(0,skyTop);
g.addColorStop(.55,skyMid);
g.addColorStop(1,skyBot);
ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
/* === grama que começa a surgir no chão === */
if(pp>.25){
  const ga=smooth(clamp((pp-.25)/.5,0,1));
  ctx.globalAlpha=ga;
  const groundH=lerp(60,200,ga);
  const gg=ctx.createLinearGradient(0,H-groundH,0,H);
  gg.addColorStop(0,'rgba(140,168,108,0)');
  gg.addColorStop(.6,'rgba(150,178,118,'+(.7*ga)+')');
  gg.addColorStop(1,'rgba(98,128,72,'+ga+')');
  ctx.fillStyle=gg;
  ctx.fillRect(ROOM.x,H-groundH,ROOM.w,groundH);
  /* tufos de grama */
  ctx.strokeStyle='rgba(86,118,58,'+ga+')';
  ctx.lineWidth=1.4;
  for(let i=0;i<26;i++){
    const gx=ROOM.x+18+((i*37+game.corridorT*8)%(ROOM.w-36));
    const gy=H-12-((i*7)%40);
    ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx-2,gy-6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+2,gy-7);ctx.stroke();
  }
  ctx.globalAlpha=1;
}
/* === chão do corredor === */
const floorCol=lerpColor('#0f0b0e','#3a4a2e',smooth(pp));
ctx.fillStyle=floorCol;
ctx.fillRect(ROOM.x,H-50,ROOM.w,50);
ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;
for(let x=ROOM.x+30;x<ROOM.x+ROOM.w;x+=34){
  ctx.beginPath();ctx.moveTo(x,H-50);ctx.lineTo(x+10,H);ctx.stroke();
}
/* === pequenas fontes de luz no chão e paredes === */
const nLights=Math.floor(pp*8);
for(let i=0;i<nLights;i++){
  const ph=(game.corridorT*.5+i*.6)%1;
  const ly=H-ph*H;
  const side=i%2===0?-1:1;
  const lx=W/2+side*(game.corridorW/2-18);
  const a=.4+.3*Math.sin(game.corridorT*4+i*1.7);
  ctx.fillStyle='rgba(255,243,196,'+(a*.6)+')';
  ctx.beginPath();ctx.arc(lx,ly,5,0,TAU);ctx.fill();
  ctx.globalAlpha=a*.25;
  const lg=ctx.createRadialGradient(lx,ly,2,lx,ly,42);
  lg.addColorStop(0,'rgba(255,243,196,.7)');
  lg.addColorStop(1,'rgba(255,243,196,0)');
  ctx.fillStyle=lg;
  ctx.beginPath();ctx.arc(lx,ly,42,0,TAU);ctx.fill();
  ctx.globalAlpha=1;
}
/* === paredes do corredor: começam escuras, viram superfícies espelhadas === */
const wallA=lerp(0,1,smooth(clamp((pp-.3)/.6,0,1)));
if(wallA<.99){
  ctx.globalAlpha=1-wallA;
  ctx.fillStyle='#0c0a0e';
  ctx.fillRect(0,0,ROOM.x,H);
  ctx.fillRect(ROOM.x+ROOM.w,0,W-ROOM.x-ROOM.w,H);
  ctx.globalAlpha=1;
}
if(wallA>0){
  ctx.globalAlpha=wallA;
  drawParadiseWall(0,0,ROOM.x,H,pp);
  drawParadiseWall(ROOM.x+ROOM.w,0,W-ROOM.x-ROOM.w,H,pp);
  ctx.globalAlpha=1;
}
/* === contornos das paredes do corredor === */
ctx.strokeStyle='rgba(255,243,196,'+(.3+.3*pp)+')';
ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(ROOM.x,0);ctx.lineTo(ROOM.x,H);ctx.stroke();
ctx.beginPath();ctx.moveTo(ROOM.x+ROOM.w,0);ctx.lineTo(ROOM.x+ROOM.w,H);ctx.stroke();
/* === brilho crescente no final do corredor === */
if(pp>.5){
  const endA=smooth(clamp((pp-.5)/.5,0,1));
  const eg=ctx.createRadialGradient(W/2,0,30,W/2,0,H*.7);
  eg.addColorStop(0,'rgba(255,250,220,'+endA*.85+')');
  eg.addColorStop(.4,'rgba(255,243,196,'+endA*.4+')');
  eg.addColorStop(1,'rgba(255,243,196,0)');
  ctx.fillStyle=eg;
  ctx.fillRect(0,0,W,H);
}
/* === silhueta de uma estrutura religiosa ao longe (aparece no fim) === */
if(pp>.65){
  const sa=smooth(clamp((pp-.65)/.35,0,1));
  ctx.globalAlpha=sa*.75;
  ctx.fillStyle='rgba(255,250,220,'+sa+')';
  /* catedral simples ao fundo */
  const cx=W/2,cy=80;
  ctx.beginPath();
  ctx.moveTo(cx-80,cy+30);
  ctx.lineTo(cx-80,cy-10);
  ctx.lineTo(cx-50,cy-30);
  ctx.lineTo(cx-20,cy-50);
  ctx.lineTo(cx,cy-66);
  ctx.lineTo(cx+20,cy-50);
  ctx.lineTo(cx+50,cy-30);
  ctx.lineTo(cx+80,cy-10);
  ctx.lineTo(cx+80,cy+30);
  ctx.closePath();
  ctx.fill();
  /* cruz no topo */
  ctx.fillRect(cx-2,cy-92,4,28);
  ctx.fillRect(cx-9,cy-82,18,4);
  ctx.globalAlpha=1;
}
/* === jogador e partículas === */
drawParticles();
drawPlayer();
drawPistols();/* v1.2.0: as pistolas agora APARECEM (com sprite se houver) */
drawChainsaw();
/* === overlay de fade === */
if(game.roomFade>0){ctx.fillStyle='rgba(4,2,3,'+game.roomFade+')';ctx.fillRect(0,0,W,H);}
/* === instruções === */
if(game.corridorT<4){
  ctx.globalAlpha=clamp(2-game.corridorT,0,1)*.85;
  txt('SUBA EM DIREÇÃO À LUZ',W/2,H-30,MONO,12,'#bfd8e8','center',2);
  ctx.globalAlpha=1;
}
/* vignette */
ctx.drawImage(vignette,0,0);
}
function devGoBoss(){
game.floor=5;
game.region='penumbra'; /* v0.9.0 — dev mode: direto ao Cérbero na Penumbra */
game.postCerberusFloors=0;
game.portal=null;game.extraIdx=-1;
game.mapRooms=genMap();game.seenGlyphs=[];
for(const r of game.mapRooms)r.cleared=true;
game.roomIdx=0;
game.roomFade=1;
game.rkP2=false;game.rkUlt=null;game.windowScene=null;
openExtraRoom();
if(game.extraIdx>=0){
enterRoom(game.extraIdx,null);
texts.push({x:W/2,y:H*.3,txt:'PENUMBRA — DIRETO AO GUARDIÃO',t:0,life:1.6,c:'#ffd9a0',size:14});
}
}
function beginBossIntro(){
/* v1.3.0: no LIMBO a sala extra pertence ao JUIZ SEM ROSTO — o Cérbero
   mudou para o portão, depois da Penumbra Infernal */
if(game.region==='limbo'&&window.__EXPANSION){window.__EXPANSION.beginJuizIntro();return;}
/* v0.9.8: O Observador não é mais um boss normal — apenas invocável na sala de testes */
game.state='bossintro';game.bossIntroT=0;game.introFlags={};
game.introFlags.snoreT=1;
let gained=0;const keep=[];
for(const p of pickups){if(p.type==='soul')gained++;else keep.push(p);}
if(gained>0)gainSouls(gained);pickups=keep;
resetBoss();boss.active=true;boss.introLock=true;boss.scale=.8;
boss.x=W/2;boss.y=H*.42;boss.angle=Math.PI/2;
for(const h of boss.heads){
h.wake=0;const a=boss.angle+h.baseAng;
h.hx=boss.x+Math.cos(a)*(boss.r*.4+14);h.hy=boss.y+Math.sin(a)*(boss.r*.4+14)+62;h.face=Math.PI/2;
}
if(dist(player.x,player.y,W/2,H*.42)<340)player.y=H*.8;
game.banner=null;game.headBanner=null;
/* v1.3.1: entrada remasterizada do CÉRBERO — a cutscene nova (cerbintro) já
   contou o despertar; o velho sono de 14s é pulado e a luta começa logo. */
if(game._skipBossCine){
game._skipBossCine=false;
game.state='play';boss.introLock=false;boss.scale=1;boss.y=H*.40; /* v1.5.7: o Cérbero segue NA FRENTE do Thor (o salto para H*.32 sumiu) */
for(const h of boss.heads){h.cd=h.baseCd*rnd(.6,.9);h.wake=1;h.howlT=0;}
return;
}
sfx.rumble();
}
/* v0.9.7: O OBSERVADOR — boss secreto que aparece no andar 5 com 30% de chance.
   Quando o jogador morre para ele, o jogo fecha e abre um link do YouTube.
   Ao reiniciar, o jogador vê o "inferno" (vermelho, olhos, mensagem) até sair da sala. */
function startObserverBoss(){
game.state='play';
game.futureBossMode=false;
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
buildRoomFloor();
game.doors=[];game.portal=null;
game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
game.sacrificeAltar=null;game.keeper=null;game.keeperNear=false;game.shopNear=null;
player.x=W/2;player.y=H*.78;player.mvx=0;player.mvy=0;
enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];
thrownSaw=null;lightBeam=null;
/* spawn the observer as a special enemy */
spawnEnemy('observer',W/2,H*.3);
game.banner={type:'boss',txt:'O OBSERVADOR',sub:'ele vê tudo. ele sabe tudo.',t:0,dur:3.0};
sfx.rumble();sfx.growl();
}
/* ============ jogador ============ */
function tryInteract(){
 if(game.paused||optionsOpen()||player.dead)return;
 if(game.state==='shop'){closeShopOv();return;}
 /* a escola vazia tem o próprio sistema de interação */
 if(game.state==='school'&&window.SCHOOL){SCHOOL.interact();return;}
 /* o castelo do bruno tem o próprio sistema de interação */
 if(game.state==='castle'&&window.CASTELLO){CASTELLO.interact();return;}
 /* v1.5.2: O PORTÃO ENORME — [Z] (ou botão de interação do toque) abre a
    passagem para o Cérbero; a expansão decide se você está perto o bastante */
 if(game.state==='gatepath'&&window.__EXPANSION&&window.__EXPANSION.gateInteract){
  if(window.__EXPANSION.gateInteract())return;
 }
 /* v0.9.2: encontro com Caronte — interagir abre as escolhas SIM/NÃO */
 if(game.state==='caronte'){
  if(game.caronteInteractable&&!game.caronteChoicesOpen){
    game.caronteChoicesOpen=true;
    showOv('caronte');
    sfx.creak();
    blip('sine',220,180,.4,.08);
  }
  return;
 }
 if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight')return;
 if(game.windowScene)return;
 /* v0.9.6: altar de sacrifício */
 if(game.sacrificeAltar&&!game.sacrificeAltar.used&&dist(player.x,player.y,game.sacrificeAltar.x,game.sacrificeAltar.y)<70){
  sacrificeAtAltar();
  return;
 }
 /* NPC da loja — O ERRANTE: v1.1.2 a feira é no CHÃO (chegue perto e [Z]) */
 if(game.shopNear&&(game.state==='play')){
  shopBuy(game.shopNear);
  return;
 }
 const w=game.roomWindow;
 if(!w||w.used)return;
 if(enemies.length||spawnMarks.length||boss.active)return;
 if(dist(player.x,player.y,w.x,w.iy)<62){
  /* v0.9.6: se a janela estiver quebrada (via tiro bomba), atravessa para o Erro 404 */
  if(w.broken){
   w.used=true;
   startE404ViaWindow();
   return;
  }
  w.used=true;
  game.windowScene={t:0,dur:4.6,tree:w.tree};
  sfx.creak();
  blip('sine',120,70,.6,.07);
 }
}
/* v0.9.6: sacrifício no altar de sangue — perde 10% do HP atual por uma chance
   de receber algo bom. Quanto menos vida, maior a chance. */
function sacrificeAtAltar(){
const alt=game.sacrificeAltar;
if(!alt||alt.used)return;
/* v1.1.0: o altar EXIGIA 10 corações (a vida inteira). v1.1.4 — SANGUE BARATO:
   o pacto custa apenas 10 DE VIDA — um beliscão no sangue. Sem sorteio,
   sem engano: sangue no prato, um PACTO no mercurinho. Repetível: depois
   de selar, o altar se rearma e aceita outro sacrifício na mesma sala. */
const COST=30+(alt.uses||0)*10; /* v1.9.0: pactos são mais difíceis — o altar cobra 30 e escala +10 a cada uso na mesma sala */
if(player.hp<=COST){
texts.push({x:alt.x,y:alt.y-38,txt:'O ALTAR EXIGE '+COST+' DE VIDA',t:0,life:1.6,c:'#d9465a',size:12,disp:true});
texts.push({x:alt.x,y:alt.y-22,txt:'volte com sangue suficiente',t:0,life:1.6,c:'#9c8f7c',size:10,disp:true});
blip('square',160,80,.2,.07);
return;
}
alt.used=true;alt.cd=.9;alt.uses=(alt.uses||0)+1;
player.hp-=COST;
game.flash=.45;game.shake=12;
sparks(alt.x,alt.y,'#d9465a',26,260,.8,3.5,true);
sfx.hurt();sfx.echo();
texts.push({x:alt.x,y:alt.y-30,txt:'-'+COST+' DE VIDA SACRIFICADAS',t:0,life:1.5,c:'#d9465a',size:12,disp:true});
const pactos=UPGRADES.filter(function(u){return PACT_IDS.indexOf(u.id)>=0&&u.can();});
if(pactos.length){
const u=pick(pactos);
pickups.push({type:'blessing_drop',dropType:'upgrade',dropId:u.id,rarity:'pacto',x:alt.x,y:alt.y-46,t:0,ph:rnd(TAU),isPact:true});
texts.push({x:alt.x,y:alt.y-62,txt:u.name,t:0,life:1.8,c:'#9d6bb5',size:13,disp:true});
texts.push({x:alt.x,y:alt.y-78,txt:'O PACTO FOI SELADO',t:0,life:1.4,c:'#c9a0ff',size:10,disp:true});
sfx.levelup();
}else dropRandomBlessing(alt.x,alt.y-46);
/* se o sacrifício matou o jogador, mata agora */
if(player.hp<=0){
  game.deadTaunt=window.__DEATH_PICK?window.__DEATH_PICK():pick(DEATH_TAUNTS); /* v1.3.0 */
  player.hp=0;player.dead=true;game.state='dead';game.deadT=0;game.overlayShown=false;
  META.deaths++;saveMeta();
  game.shake=18;sfx.die();
}
}
/* v0.9.6: inicia a luta contra o Erro 404 através da janela quebrada */
function startE404ViaWindow(){
game.state='e404intro';
game.e404T=0;
game.e404Spawned=false;
ROOM.inverted=true;buildRoomFloor();
game.penumbra=null;
game.roomQueue=[];
sfx.static_();blip('square',60,1200,.8,.14);
texts.push({x:W/2,y:H*.3,txt:'A JANELA SE QUEBROU',t:0,life:2.5,c:'#4ff5ff',size:14,disp:true});
texts.push({x:W/2,y:H*.35,txt:'algo do outro lado te puxa...',t:0,life:2.5,c:'#ff4fd8',size:11});
}
function tryDash(dir){ /* v1.4.6: direção opcional (toque duplo aponta o desvio) */
 if(game.paused||optionsOpen())return;
 if(game.windowScene){return;}
 /* v0.9.13: na escola o SHIFT vira ANDAR DEVAGAR — o desvio fica desativado */
 if(window.__SCHOOL_ACTIVE)return;
 if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight'&&game.state!=='school'&&!window.__CASTLE_ACTIVE)return;
 if(player.dead||player.dashCd>0||!game.weapon)return;
 player.dashAng=dir!=null?dir:((player.mvx||player.mvy)?Math.atan2(player.mvy,player.mvx):player.angle);
 player.dashT=.16*(window.__RM_dashMul?window.__RM_dashMul():1);player.dashCd=DASH_CD*P.dashCdMult; /* v1.4.0 */
 player.inv=Math.max(player.inv,INV_DASH);sfx.dash();
 /* v1.2.0: INSTINTO DE PANTERA — o desvio deixa intocável por um instante */
 if(game.pantera){player.inv=Math.max(player.inv,.65);particles.push({x:player.x,y:player.y,vx:0,vy:0,life:.5,t:0,r:16,c:'rgba(159,216,255,.4)',drag:1,glow:true});}
 /* v0.9.16: DANÇARINO DO VENTO — o desvio corta quem estiver no caminho */
 if(game.specVento){
 const dmg=30*P.dmgMult;
 for(const e of enemies){
 if(e.dead||e.spawnT<.5)continue;
 const ex=e.x-player.x,ey=e.y-player.y;
 const along=ex*Math.cos(player.dashAng)+ey*Math.sin(player.dashAng);
 const off=Math.abs(-ex*Math.sin(player.dashAng)+ey*Math.cos(player.dashAng));
 if(along>0&&along<210&&off<44){
 if(!shadowInvuln(e)&&!knightRedirectHorse(e,dmg)){e.hp-=dmg;e.flash=.2;if(e.hp<=0)killEnemy(e);}
 sparks(e.x,e.y,'#bfd8e8',5,140,.4,3,true);
 }
 }
 blip('sine',700,1100,.12,.08);
 }
}
function tryThrowSaw(){
 if(game.paused||optionsOpen())return;
 /* v0.9.13: na escola as armas estão REMOVIDAS — a serra não pode ser lançada */
 if(window.__SCHOOL_ACTIVE)return;
 if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight'&&game.state!=='school')return;
 if(game.windowScene)return;
 if(!P.chainsaw||player.dead||thrownSaw||player.sawThrowCd>0)return;
 const tgt=nearestTarget(520);let a=player.angle;
 if(tgt){const p=targetPos(tgt);if(p)a=Math.atan2(p.y-player.y,p.x-player.x);}
 else if(window.__SCHOOL_ACTIVE){a=Math.atan2(mouse.y-player.y,mouse.x-player.x);} /* na escola mira o mouse */
 thrownSaw={x:player.x,y:player.y,vx:Math.cos(a)*680,vy:Math.sin(a)*680,ang:a,spin:0,state:'out',dist:0};
 player.sawThrowCd=3.2;sfx.throw();sfx.saw();
}
function updatePlayer(dt){
if(player.dead)return;
if(game.fallK>=0){
/* v1.2.2: RELÓGIO DA QUEDA — a travessia dura 0.85s; se o progresso ficar
   preso (exceção/estado zumbi), força a conclusão em vez de soft lock eterno */
if(game._fallSnap===undefined||game.fallK<game._fallSnap){game._fallSnap=game.fallK;game._fallWatch=0;}
game._fallWatch=(game._fallWatch||0)+dt;
if(game._fallWatch>4){game.fallK=1;game._fallSnap=undefined;game._fallWatch=0;}
else if(game.fallK-game._fallSnap>0.08){game._fallSnap=game.fallK;game._fallWatch=0;}
game.fallK+=dt/0.85;
const k=smooth(Math.min(1,game.fallK));
player.x=lerp(game.fallFrom.x,game.fallTo.x,k);
player.y=lerp(game.fallFrom.y,game.fallTo.y,k);
if(Math.random()<.6)particles.push({x:player.x+rnd(-8,8),y:player.y+rnd(-8,8),vx:rnd(-25,25),vy:rnd(-70,-20),life:.4,t:0,r:rnd(1,2.5),c:game.fallTarget&&game.fallTarget.floor?'#c9a0ff':'#9d6bb5',drag:1,glow:true});
if(game.fallK>=1){
const t=game.fallTarget;
game.fallK=-1;game.fallFrom=null;game.fallTo=null;game.fallTarget=null;
game._fallSnap=undefined;game._fallWatch=0;
game.roomFade=1;
if(t&&t.floor){nextFloor();return;}
if(t&&t.school&&window.SCHOOL){SCHOOL.enterArea(t.school,t.dir);return;}
if(t&&t.castle&&window.CASTELLO){CASTELLO.enterArea(t.castle,t.dir);return;} /* v0.9.10: O CONVITE */
if(t&&t.caronte){startCaronteEncounter();return;} /* v0.9.1: encontro pacífico com Caronte no andar 3 */
if(t&&t.caronteReturn){game.caronteReturn=false;startCaronteEncounter();return;}
if(t&&t.limboQuick){/* entrada direta pelo seletor de círculos */}
enterRoom(t.to,t.dir);
}
return;
}
if(player.dashCd>0)player.dashCd-=dt;
if(player.sawThrowCd>0)player.sawThrowCd-=dt;
if(player.slowT>0)player.slowT-=dt;
if(game.activeCd>0)game.activeCd-=dt;
if(game.estrelaT>0)game.estrelaT-=dt;
if(game.furiaT>0){
  game.furiaT-=dt;
  if(game.furiaT<=0){
    /* reverte o bônus de Fúria Berserker */
    if(game._furiaBaseRate){P.rateMult=game._furiaBaseRate;game._furiaBaseRate=null;}
    if(game._furiaBaseDmg){P.dmgMult=game._furiaBaseDmg;game._furiaBaseDmg=null;}
  }
}
if(player.dashT>0){
player.dashT-=dt;
player.x+=Math.cos(player.dashAng)*860*dt;player.y+=Math.sin(player.dashAng)*860*dt;
clampArena(player,player.r);
resolveDecorCollision(player,player.r);
clampArena(player,player.r);
particles.push({x:player.x,y:player.y,vx:0,vy:0,life:.22,t:0,r:11,c:'#9fc0c9',drag:0,alpha:.3});
}else{
const ax=(held('right')?1:0)-(held('left')?1:0);
const ay=(held('down')?1:0)-(held('up')?1:0);
const l=Math.hypot(ax,ay);
/* v0.9.13: SHIFT na escola = andar devagar — os passos quase não fazem barulho */
player.sneak=!!(window.__SCHOOL_ACTIVE&&held('dash')&&player.dashT<=0);
/* v1.4.6: FOCO — segurar SHIFT mostra a hitbox (4px desde a v1.6.0) e faz o Thor
   andar devagar (estilo Touhou). Na escola o SHIFT continua sendo o sneak.
   O ponto carmesim só existe com SHIFT pressionado — soltou, some. */
player.focus=!!(held('dash')&&!window.__SCHOOL_ACTIVE&&player.dashT<=0);
const spd=285*P.speedMult*(player.slowT>0?.55:1)*(player.sneak?.5:1)*(player.focus?.42:1);
if(l){
player.x+=ax/l*spd*dt;player.y+=ay/l*spd*dt;
player.mvx=ax/l;player.mvy=ay/l;player.walkT+=dt*(player.sneak?4.5:9);
player.dustT-=dt;
if(player.dustT<=0&&!player.sneak){player.dustT=.28;particles.push({x:player.x+rnd(-4,4),y:player.y+8,vx:rnd(-10,10),vy:rnd(-14,-4),life:.5,t:0,r:2.5,c:'#2a2126',drag:1});}
}
player.angle=(player.mvx||player.mvy)?Math.atan2(player.mvy,player.mvx):player.angle;
clampArena(player,player.r);
resolveDecorCollision(player,player.r);
clampArena(player,player.r);
/* v1.5.0: IMPULSO do balanço do chicote (âncora de parede — O CREDOR) */
if(player._whpImp){
  const wi=player._whpImp;
  player.x+=wi.vx*dt;player.y+=wi.vy*dt;
  wi.t-=dt;if(wi.t<=0)player._whpImp=null;
  if(Math.random()<dt*22)particles.push({x:player.x+rnd(-6,6),y:player.y+rnd(-6,6),vx:-wi.vx*.1,vy:-wi.vy*.1,life:.24,t:0,r:2.6,c:'#c9a0ff',drag:1,glow:true});
}
if(player._whpVx){const wf=Math.max(0,1-8*dt);player._whpVx*=wf;player._whpVy*=wf;}
}
if(game.state==='play'){
if(game.portal&&dist(player.x,player.y,game.portal.x,game.portal.y)<40){
game.fallK=0;game.fallFrom={x:player.x,y:player.y};game.fallTo={x:game.portal.x,y:game.portal.y};
/* ==== v0.9.1:
   - Andar 3: o portal leva ao encontro pacífico com Caronte (cutscene → Limbo)
   - Andar 5: o portal leva ao Cérbero (boss final, via openExtraRoom)
   - Se caronteReturn estiver ativo, o portal leva de volta ao encontro pacífico
   - Caso contrário, desce para o próximo andar ==== */
if(game.caronteReturn){
  game.fallTarget={caronteReturn:true};
}else{
  /* v1.3.0: Caronte agora espera DEPOIS da Garganta Vulcânica (corredor azul) */
  game.fallTarget={floor:true};
}
sfx.howl();sfx.echo();game.shake=Math.max(game.shake,8);
}else if(game.roomKind!=='boss'){
for(const d of game.doors){
if(!d.open)continue;
if(dist(player.x,player.y,d.x,d.y)<30){
/* v1.5.0: TRANSIÇÃO DESLIZANTE — a sala antiga desliza para fora e a nova
   entra pelo lado da porta; sem tela preta, sem teleporte. O mergulho
   antigo (fallK) continua existindo para portal/escada/andar. */
startSlide(d.to,d.dir);
break;
}
}
}
}
player.inv-=dt;
if(game.meleeHitT>0)game.meleeHitT-=dt;
/* v0.9.6: FOME INSCIÁVEL — v1.9.0: a fome agora consome ALMAS, nunca vida
   (drenagem passiva de HP removida do jogo por completo) */
if(game.endlessHunger&&!player.dead){
  game.hungerT=(game.hungerT||0)+dt;
  if(game.hungerT>=10){
    game.hungerT=0;
    const _fome=Math.min(5,META.souls|0);
    if(_fome>0){META.souls-=_fome;sparks(player.x,player.y,'#a8c24f',6,160,.4,2.5,true);
    texts.push({x:player.x,y:player.y-25,txt:'-'+_fome+' almas (fome)',t:0,life:.8,c:'#a8c24f',size:11,disp:true});}
    else {texts.push({x:player.x,y:player.y-25,txt:'a fome rangendo de vazio...',t:0,life:.8,c:'#a8c24f',size:10,disp:true});}
  }
}
/* v0.9.6: PACTO DA FOME — v1.9.0: a drenagem de 5 HP/s FOI REMOVIDA.
   A contrapartida agora é dano recebido +25% (tratado no grimório). */
}
/* PARRY (GUARDA PROFANA): só funciona com armas de curta distância.
   Nada de segurar espaço — basta a hitbox do golpe (mordida, serra, lâmina)
   acertar os tiros para rebatê-los de volta. */
let lastParryTxtT=-9;
function parrySweep(cx,cy,ang,arc,range){
if(!game.hasParry||player.dead)return 0;
const R=range+P.parryRadius*.5;let n=0;
for(let i=ebullets.length-1;i>=0;i--){
const b=ebullets[i];
const d=dist(b.x,b.y,cx,cy);
if(d>R+14)continue;
if(Math.abs(angDiff(Math.atan2(b.y-cy,b.x-cx),ang))>arc)continue;
const tgt=nearestTarget(900);let a;
const tp=tgt?targetPos(tgt):null;
if(tp)a=Math.atan2(tp.y-b.y,tp.x-b.x);
else a=Math.atan2(-b.vy,-b.vx);
bullets.push({x:b.x,y:b.y,vx:Math.cos(a)*720,vy:Math.sin(a)*720,r:6,dmg:16*P.dmgMult,life:1.3,a:a,elem:null,parry:true});
sparks(b.x,b.y,'#e6dac4',5,180,.4,3,true);
ebullets.splice(i,1);n++;
}
if(n){
player.inv=Math.max(player.inv,.4);
game.flash=Math.max(game.flash,.18);game.shake=Math.max(game.shake,7);
/* v0.9.16: AURORA PROFANA — o parry cura 5 de vida */
if(game.specLuz&&!player.dead&&player.hp<player.maxHp){
player.hp=Math.min(player.maxHp,player.hp+5);
texts.push({x:cx,y:cy-46,txt:'+5 AURORA',t:0,life:.9,c:'#9fd8ff',size:10,disp:true});
}
sfx.parry();sparks(cx,cy,'#cfe9ff',10,260,.5,3,true);
if(game.t-lastParryTxtT>.4){lastParryTxtT=game.t;
texts.push({x:cx,y:cy-30,txt:'REBATEU!',t:0,life:.8,c:'#e6dac4',size:15,disp:true});}
}
return n;
}
/* marca que um golpe de perto acertou (o ultimate do rei lê isso) */
function markMeleeHit(e){game.meleeHitT=.16;game.meleeHitRk=!!(e&&e.type==='rk');}
function killPlayerInstant(cause){
if(player.dead)return;
if(game.god){return;}
game.deadTaunt=window.__DEATH_PICK?window.__DEATH_PICK():pick(DEATH_TAUNTS); /* v1.3.0 */
player.hp=0;player.inv=0;
player.dead=true;game.state='dead';game.deadT=0;game.overlayShown=false;
game.shake=22;game.flash=.6;game.hitstop=.25;
sfx.die();sfx.headDie();
texts.push({x:player.x,y:player.y-44,txt:cause,t:0,life:2,c:'#d9465a',size:17,disp:true});
sparks(player.x,player.y,'#d9465a',26,320,.9,4,true);
META.deaths++;saveMeta();
}
function hurtPlayer(){
if(game.god)return;
if(player.inv>0||player.dashT>0||player.dead)return;
if(game.knightInvuln)return;
/* v0.9.9: FRAGMENTO DO ERRO — o escudo de glitch anula o golpe */
if(game.relicShard&&game.relicShieldUp){
game.relicShieldUp=false;game.relicShieldK=0;
player.inv=Math.max(player.inv,1);
game.flash=Math.max(game.flash,.25);
sfx.parry();sfx.static_();
sparks(player.x,player.y,'#4ff5ff',16,240,.6,3,true);
texts.push({x:player.x,y:player.y-34,txt:'ESCUDO DE GLITCH!',t:0,life:1.1,c:'#4ff5ff',size:13,disp:true});
return;
}
/* v0.9.16: ÉGIDE DO PACTO — bloqueia os próximos golpes enquanto durar */
if(game.shieldHits>0){
game.shieldHits--;
player.inv=Math.max(player.inv,1.1);
game.flash=Math.max(game.flash,.22);
sfx.parry();blip('sine',700,300,.16,.14);
sparks(player.x,player.y,'#ffd9a0',14,220,.6,3,true);
texts.push({x:player.x,y:player.y-34,txt:'ÉGIDE! ('+game.shieldHits+' restantes)',t:0,life:1.0,c:'#ffd9a0',size:12,disp:true});
return;
}
/* v0.9.6: debuffs de bênçãos enganosas */
let dmg=game.up.olhogordo?30:20; /* OLHO GORDO: +50% dano recebido */
if(game.falseHeart)dmg*=2; /* Coração Falso: dobra o dano recebido (legado) */
if(game.glassBody)dmg=50; /* Corpo de Vidro: 50 HP por hit */
/* ESPELHO QUEBRADO: 15% de chance de acerto crítico (50 dano extra) */
if(game.up.espelho&&Math.random()<0.15){
  player.hp-=50;
  texts.push({x:player.x,y:player.y-30,txt:'CRÍTICO!',t:0,life:1,c:'#ff0000',size:18,disp:true});
  sparks(player.x,player.y,'#ff0000',8,200,.4,3,true);
}
if(window.__RM)dmg=window.__RM.hurtDmg(dmg); /* v1.4.0 */
if(window.__GRI)dmg=window.__GRI.hurtDmg(dmg); /* v1.9.0: contrapeso, pele de sal, contratos do grimório */
player.hp-=dmg;player.inv=1.15+P.invBonus;game.hurtV=1;game.shake=Math.max(game.shake,14);
if(window.__EXPANSION)window.__EXPANSION.afterHurt(); /* v1.3.0 */
/* v1.1.0: SENTENÇA DA IRA — ferido, a fúria detona em chamas */
if(game.sinIra)explodeAt(player.x,player.y,110,34*P.dmgMult);
game.hitstop=Math.min(.09,game.hitstop+.09);heartsPopT=.6;heartsPopIdx=player.hp;
sparks(player.x,player.y,'#d9465a',10,220,.5,3,true);sfx.hurt();
texts.push({x:player.x,y:player.y-30,txt:'-'+dmg,t:0,life:.8,c:'#ff4040',size:16,disp:true});
if(player.hp<=0){
/* v1.3.0: ÚLTIMA PENA — a 1ª morte do andar é desfeita (o pacto cobra -15% dano) */
if(window.__EXPANSION&&window.__EXPANSION.tryPena())return;
/* v1.4.0: A ÚLTIMA TESTEMUNHA — a 1ª morte da descida é recusada (o pacto se desfaz) */
if(window.__RM&&window.__RM.tryWitness())return;
/* v0.9.9: CORAÇÃO CINZENTO — a primeira morte da descida é desfeita */
if(game.relicRevive){
game.relicRevive=false;
player.hp=Math.max(1,Math.round(player.maxHp/2));
player.inv=Math.max(player.inv,2);
game.flash=.5;game.shake=16;
sfx.levelup();sfx.heart();
sparks(player.x,player.y,'#d8cfc0',24,280,.8,4,true);
texts.push({x:player.x,y:player.y-40,txt:'O CORAÇÃO CINZENTO RECUSA A MORTE',t:0,life:2,c:'#e6dac4',size:13,disp:true});
return;
}
/* v0.9.8: se o Observador estiver na arena quando Thor morrer,
   abre o link do YouTube, fecha o jogo e ativa o modo Inferno */
const obs=observerAny();
if(obs&&!obs.dead){
  game.deadTaunt='O OBSERVADOR TE VIU.';
  player.hp=0;player.dead=true;game.state='dead';game.deadT=0;game.overlayShown=false;
  META.deaths++;META.hellMode=true;saveMeta();
  game.shake=18;sfx.die();
  for(let i=0;i<14;i++)particles.push({x:player.x+rnd(-8,8),y:player.y+rnd(-8,8),vx:rnd(-30,30),vy:rnd(-120,-50),life:rnd(.8,1.6),t:0,r:rnd(1.5,3.5),c:'#8fd0e8',drag:.5,glow:true});
  /* abre o YouTube e tenta fechar o jogo */
  try{window.open('https://www.youtube.com/watch?v=4J9Y1d5Zxcg','_blank');}catch(e){}
  setTimeout(function(){try{window.close();}catch(e){}},800);
  return;
}
game.deadTaunt=window.__DEATH_PICK?window.__DEATH_PICK():pick(DEATH_TAUNTS); /* v1.3.0 */
player.hp=0;player.dead=true;game.state='dead';game.deadT=0;game.overlayShown=false;
META.deaths++;saveMeta();
game.shake=18;sfx.die();
for(let i=0;i<14;i++)particles.push({x:player.x+rnd(-8,8),y:player.y+rnd(-8,8),vx:rnd(-30,30),vy:rnd(-120,-50),life:rnd(.8,1.6),t:0,r:rnd(1.5,3.5),c:'#8fd0e8',drag:.5,glow:true});
checkSoulTremor();
}
}
/* ============ alvo mais próximo ============ */
function nearestTarget(maxD){
let best=null,bd=maxD;
for(const e of enemies){
if(e.spawnT<.5||e.dead)continue;
const d=dist(player.x,player.y,e.x,e.y);
if(d<bd){bd=d;best={kind:'enemy',obj:e};}
}
if(boss.active&&!boss.dying&&boss.scale>0.98&&!boss.introLock){
for(const h of boss.heads){
if(!h.alive)continue;
const d=dist(player.x,player.y,h.hx,h.hy);
if(d<bd){bd=d;best={kind:'head',obj:h};}
}
}
return best;
}
function targetPos(t){
if(!t)return null;
if(t.kind==='enemy')return(t.obj.hp>0&&!t.obj.dead)?{x:t.obj.x,y:t.obj.y}:null;
return t.obj.alive?{x:t.obj.hx,y:t.obj.hy}:null;
}
function elemDmg(e,base){
let m=(e.slowT>0&&game.ymir)?1.4:1;
if(game.roomEvent&&game.roomEvent.type==='blood')m*=2;
/* v0.9.16: DECRETO DO ABISMO — inimigos frágeis recebem +40% */
if(game.fragilT>0)m*=1.4;
/* v0.9.16 sinergia GRANIZO (gelo+projéteis): congelados sofrem +15% de tudo */
if(game.psyn.granizo&&e.slowT>0)m*=1.15;
/* v0.9.16 sinergia CINZA (sangue+fogo): em chamas E sangrando? +20% */
if(game.psyn.cinza&&e.slowT<=0&&e.burnT>0&&(e.bleeding||e.poisT>0))m*=1.2;
return base*m;
}
/* sombra do rei (rkm) é invulnerável durante a fase 2 — ataques passam direto */
function shadowInvuln(e){return e&&e.type==='rkm'&&game.rkP2;}
/* cavaleiro montado: dano vai para o cavalo primeiro, não para o cavaleiro.
   Retorna true se o dano foi redirecionado (já aplicado ao cavalo). */
function knightRedirectHorse(e,dmg){
if(!e)return false;
if(!['cw1','cw2','cw3','cw4'].includes(e.type))return false;
/* Triunfo da Morte: conta 1 hit cada vez que acertam o cavaleiro */
if(e.triunfo&&e.type==='cw4'){
if(game.knightHeartsCollected<game.knightHeartsNeeded)game.knightHeartsCollected++;
e.flash=.2;
sparks(e.x,e.y,'#c9a44c',6,180,.4,3,true);
return true;
}
/* outros triunfos: cavaleiro imortal */
if(e.invuln||e.triunfo)return true;
if(e.p2||!e.horseHp||e.horseHp<=0)return false;
/* dano real ao cavalo */
e.horseHp-=dmg;
e.flash=Math.max(e.flash||0,.15);
sparks(e.x,e.y-30,'#ff8f3d',4,140,.4,2.5,true);
if(e.horseHp<=0){
/* cavalo morre — dispara transição de fase na IA */
e.horseHp=0;
}
return true;
}
/* cor falsa usada pelos projéteis das sombras — para o jogador distinguir
   qual rei está jogando na cor "certa" (a real) versus a cor errada (sombras). */
const RKM_FAKE_COLOR='#7a5b8a';
const RKM_FAKE_COLOR_2='#5a4a55';
function rkmBulletColor(realColor){
return game.rkP2?RKM_FAKE_COLOR:realColor;
}
/* números de dano FRENÉTICOS: cor e tamanho completamente aleatórios,
   com pop de escala, giro, gravidade e brilho — cada número é único */
const DMG_COLORS=['#e6dac4','#ffd9a0','#d9465a','#ff8f3d','#9fd8ff','#a8c24f','#c9a44c','#9d6bb5','#4ff5ff','#ff4fd8','#f2f0ea','#ffe066','#ff5a3d','#8fd0e8','#e8455a','#baffc9','#ff9db0','#d9c2ff'];
function dmgText(x,y,d,c){
if(!opts.dmgNum)return;
texts.push({x:x+rnd(-7,7),y:y+rnd(-7,7),txt:''+Math.round(d),t:0,life:rnd(.45,.95),
c:pick(DMG_COLORS),size:(Math.random()<.5?'600 ':'')+Math.round(rnd(9,27)),dmg:true,
vx:rnd(-70,70),vy:rnd(-150,-30),rot:rnd(-.4,.4),rotV:rnd(-3,3),pop:true});
}
function hitHead(h,dmg,c){
h.hp-=dmg;h.flash=.12;
dmgText(h.hx+rnd(-10,10),h.hy-18,dmg,c);
if(h.hp<=0)killHead(h);
}
/* ============ elementos ============ */
const ELEM_DATA={gelo:{c:'#9fd8ff',mult:1},fogo:{c:'#ff8f3d',mult:1.2},veneno:{c:'#a8c24f',mult:.9},trovao:{c:'#cfe9ff',mult:1.4}};
function ownedElems(){return Object.keys(game.elements).filter(k=>game.elements[k]>0);}
function elemLevelUp(k,label,masteryFn){
game.elements[k]=(game.elements[k]||0)+1;
if(game.elements[k]>=3){
masteryFn();
game.banner={type:'small',txt:'MAESTRIA '+label,sub:'',t:0,dur:2};
sfx.levelup();sparks(player.x,player.y,'#e6dac4',16,240,.7,3,true);
}
}
function explodeAt(x,y,r,dmg){
for(const e of enemies){
if(e.dead)continue;
if(dist(x,y,e.x,e.y)<r+e.r){
if(!shadowInvuln(e)){if(!knightRedirectHorse(e,dmg)){e.hp-=elemDmg(e,dmg);e.flash=.15;}}
sparks(e.x,e.y,'#ff8f3d',3,140,.3,2.5,true);
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>.98){
for(const h of boss.heads){
if(!h.alive)continue;
if(dist(x,y,h.hx,h.hy)<r+h.r){
h.hp-=dmg;h.flash=.15;
dmgText(h.hx+rnd(-10,10),h.hy-18,dmg);
if(h.hp<=0)killHead(h);
}
}
}
sparks(x,y,'#ff8f3d',8,200,.4,3,true);sparks(x,y,'#ffd9a0',4,260,.3,2,true);
game.shake=Math.max(game.shake,3);sfx.boom();
/* v1.6.0: EXPLOSIVO × PORTA TRANCADA — bomba (PORTA DAS SOMBRAS), tiro
   explosivo (PÓLVORA) e FAGULHA [Q] quebram portas FECHADAS por inimigos
   (sala de combate/desafio varrida pela metade) ou por enigma (puzzle não
   resolvido): a explosão destrói a porta e libera a saída. NÃO funciona
   em sala de CHEFE, MINI-CHEFE ou chefe secreto — essas trancas são
   sagradas. A porta destruída NASCE aberta se você voltar depois. */
if(!game.futureBossMode&&game.state==='play'){
const rk=game.mapRooms[game.roomIdx];
const blastOK=rk&&(rk.kind==='combat'||rk.kind==='challenge'||(rk.kind==='puzzle'&&game.puzzle&&game.puzzle.lock&&!game.puzzle.solved));
if(blastOK){
for(const d of game.doors){
if(d.open||d.hidden)continue;
if(dist(x,y,d.x,d.y)<r+26){
d.open=true;d.broken=true;
rk.doorBlown=rk.doorBlown||{};rk.doorBlown[d.dir]=true;
sparks(d.x,d.y,'#ff8f3d',22,320,.75,4,true);
sparks(d.x,d.y,'#ffd9a0',12,240,.6,3.5,true);
shockwaves.push({x:d.x,y:d.y,r:0,vr:640,maxR:120,t:0,dur:.45,c:'#ff8f3d'});
game.shake=Math.max(game.shake,12);game.flash=Math.max(game.flash,.25);
sfx.gate();sfx.boom();
texts.push({x:d.x,y:d.y-28,txt:'A PORTA EXPLODIU',t:0,life:1.6,c:'#ff8f3d',size:12,disp:true});
game.banner={type:'small',txt:'A PORTA EXPLODIU',sub:'os escombros liberam a passagem',t:0,dur:2};
break;
}
}
}
}
}
/* ============ modo tiro (MANUAL — clique esquerdo / setas; automático só com o OLHO DO CAÇADOR) ============ */
const mouse={x:W/2,y:H*.4,inCanvas:false};
function cvToWorld(clientX,clientY){return{x:(clientX-view.ox)/view.s+(game.camX||0),y:(clientY-view.oy)/view.s+(game.camY||0)};}
function fireShot(a){
if(player.shotT>0)return;
/* v0.9.6: PRESSA CEGA — 25% de chance do tiro errar */
if(game.blindHaste&&Math.random()<.25){player.shotT=1/(1.9*P.rateMult);sfx.spit();return;}
/* v1.0.0: SINERGIA VAPOR — fogo + gelo juntos MATAM o tiro. O que sai é
   fumaça fervente de alcance curto que queima quem tocar nela. */
if(game.psyn.vapor&&game.elements.fogo>0&&game.elements.gelo>0){
player.shotT=1/(1.9*P.rateMult);
spawnVaper(player.x+Math.cos(a)*24,player.y+Math.sin(a)*24,a);
sfx.spit();noiseSfx(.22,.08,500,'bandpass');
return;
}
const reach=470*P.reachMult;
player.shotT=1/(1.9*P.rateMult);
const baseA=a;
const elems=ownedElems();
/* v0.9.6: LÁGRIMAS — tiro duplo perpendicular (lentidão) */
if(game.tearShots){
  const perpA=baseA+Math.PI/2;
  const offset=8;
  for(let s=-1;s<=1;s+=2){
    const ang=baseA;
    const ox=Math.cos(perpA)*offset*s;
    const oy=Math.sin(perpA)*offset*s;
    const elem=elems.length?elems[game.elemCycle++%elems.length]:null;
    let mult=1;
    if(elem)mult=ELEM_DATA[elem].mult*(1+.12*(game.elements[elem]-1));
    const bDmg=11*P.dmgMult*mult;
    /* se o jogador também tem Coração, as lágrimas sangram */
    const bleed=!!game.bloodShots;
    bullets.push({x:player.x+Math.cos(ang)*16+ox,y:player.y+Math.sin(ang)*16+oy,vx:Math.cos(ang)*900,vy:Math.sin(ang)*900,r:5,dmg:bDmg,life:reach/900,a:ang,elem:elem,tear:true,slowShot:true,bleed:bleed,color:'#9fd8ff'});
  }
  sparks(player.x+Math.cos(baseA)*16,player.y+Math.sin(baseA)*16,'#9fd8ff',2,120,.2,2,true);
  sfx.shotS();
  /* sinergia FILHO DO TROVÃO */
  if(game.synTrovao&&Math.random()<.3){
    const t=nearestTarget(reach);
    if(t){const p2=targetPos(t);
    if(p2){const d=elemDmg(t.kind==='enemy'?t.obj:{slowT:0},8*P.dmgMult);
    bolts.push({x:p2.x,y:p2.y,t:0,life:.2,seed:rnd(10)});
    sparks(p2.x,p2.y,'#cfe9ff',6,200,.45,3,true);sfx.thunder();
    if(t.kind==='enemy'){t.obj.hp-=d;t.obj.flash=.1;volatilCheck(t.obj);if(t.obj.hp<=0)killEnemy(t.obj);}else hitHead(t.obj,d);
    }
    }
  }
  return;
}
const n=1+game.multi;
for(let i=0;i<n;i++){
const off=(i-(n-1)/2)*.13;
const ang=baseA+off;
const elem=elems.length?elems[game.elemCycle++%elems.length]:null;
let mult=1;
if(elem)mult=ELEM_DATA[elem].mult*(1+.12*(game.elements[elem]-1));
/* v0.9.6: Coração = tiros de sangue causam sangramento (bleed) */
const isBlood=game.bloodShots;
const bColor=isBlood?'#d9465a':'#cfe9ff';
const bDmg=11*P.dmgMult*mult*((game.sinSoberba&&player.hp>=player.maxHp-1)?1.3:1);
bullets.push({x:player.x+Math.cos(ang)*16,y:player.y+Math.sin(ang)*16,vx:Math.cos(ang)*900,vy:Math.sin(ang)*900,r:5,dmg:bDmg,life:reach/900,a:ang,elem:elem,bleed:isBlood,color:bColor});
}
sparks(player.x+Math.cos(baseA)*16,player.y+Math.sin(baseA)*16,'#cfe9ff',2,120,.2,2,true);
sfx.shotS();
/* sinergia FILHO DO TROVÃO: cada tiro pode chamar um relâmpago menor */
if(game.synTrovao&&Math.random()<.3){
const t=nearestTarget(reach);
if(t){const p2=targetPos(t);
if(p2){const d=elemDmg(t.kind==='enemy'?t.obj:{slowT:0},8*P.dmgMult);
bolts.push({x:p2.x,y:p2.y,t:0,life:.2,seed:rnd(10)});
sparks(p2.x,p2.y,'#cfe9ff',6,200,.45,3,true);sfx.thunder();
if(t.kind==='enemy'){t.obj.hp-=d;t.obj.flash=.1;volatilCheck(t.obj);if(t.obj.hp<=0)killEnemy(t.obj);}else hitHead(t.obj,d);
}
}
}
}
function tryShootAt(wx,wy){
if(game.paused||optionsOpen())return;
if(game.windowScene)return;
/* v1.3.1: armas da expansão atacam no clique/toque — e NUNCA sozinhas */
if(window.__EXPANSION&&window.__EXPANSION.clickShot&&window.__EXPANSION.clickShot(wx,wy))return;
if((game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight')||player.dead||(!game.hasShot&&!game.hasBite&&!game.hasPistols&&!game.hasBeam))return;
const a=Math.atan2(wy-player.y,wx-player.x);
player.angle=a;
/* v1.0.0: O FEIXE — segurar começa a carga; soltar (mouseup) dispara.
   Mudança real de dinâmica: enquanto carrega, o tiro normal não sai. */
if(game.hasPistols&&!game.beamCharging)firePistols(a);
if(game.hasBeam){game.beamCharging=true;game.beamA=a;}
if(game.hasShot&&!game.hasBeam)fireShot(a);
if(game.hasBite)tryBite(a);
}
/* v1.0.0: PISTOLAS GÊMEAS — dois canos, cadência rápida, bala leve */
function firePistols(a){
if(player.pistolT>0)return;
/* v1.1.0: as gêmeas voltaram a cuspir bala quando NÃO estão carregando o feixe */
if(game.beamCharging)return;
player.pistolT=.34/Math.max(.4,P.rateMult*.9);
const reach=470*P.reachMult;
const elems=ownedElems();
for(let s=-1;s<=1;s+=2){
const perp=a+Math.PI/2,off=7*s;
const ang=a+rnd(-.035,.035);
const elem=elems.length?elems[game.elemCycle++%elems.length]:null;
let mult=1;
if(elem)mult=ELEM_DATA[elem].mult*(1+.12*(game.elements[elem]-1));
bullets.push({x:player.x+Math.cos(a)*14+Math.cos(perp)*off,y:player.y+Math.sin(a)*14+Math.sin(perp)*off,vx:Math.cos(ang)*980,vy:Math.sin(ang)*980,r:4,dmg:8*P.dmgMult*mult*((game.sinSoberba&&player.hp>=player.maxHp-1)?1.3:1),life:reach/980,a:ang,elem:elem,bleed:!!game.bloodShots,color:elem?ELEM_DATA[elem].c:'#ffd9a0',pistol:true});
}
sparks(player.x+Math.cos(a)*14,player.y+Math.sin(a)*14,'#ffd9a0',3,140,.3,2.5,true);
sfx.shotS();
}
/* v1.1.0: soltar o botão/seta — se a barra encheu, o feixe sai (+ bônus das gêmeas) */
function releaseBeam(){
if(window.__EXPANSION&&window.__EXPANSION.lmbUp)window.__EXPANSION.lmbUp(); /* v1.3.4: soltou o botão/toque — a colherada carregada desce */
if(!game.beamCharging)return;
game.beamCharging=false;
if(game.beamCharge>=1){
fireBeam(game.beamA,{gold:!!game.pistolasDuplas});/* v1.2.0: com as DUPLAS o feixe real nasce dourado */
/* v1.1.0: GÊMEAS DO FEIXE — soltou cheio: a outra pistola dispara um feixe mais forte */
if(game.pistolBeam)fireBeam(game.beamA,{dmgMul:1.4,side:-(game._miniSide||1),gold:true});
}
else if(game.beamCharge>.15)sparks(player.x+Math.cos(game.beamA)*20,player.y+Math.sin(game.beamA)*20,'#fff3c4',4,90,.4,2,true);
game.beamCharge=0;game.beamFull=false;game._miniT=0;
}
/* v1.1.0: FAGULHA EXPLOSIVA virou ARMA — [Q] dispara a brasa como um tiro
   normal, só que detona: estoura em área nos demônios e racha paredes escondidas */
function fireFagulha(){
if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight')return;
if(game.paused||player.dead||game.windowScene)return;
if(!game.fagulha||game.fagulha<=0){
texts.push({x:player.x,y:player.y-34,txt:'SEM FAGULHAS — laranjas e o ERRANTE fornecem',t:0,life:1.4,c:'#ff8f3d',size:11,disp:true});
blip('square',180,90,.12,.06);return;
}
if((player.fagT||0)>0)return;
player.fagT=.5;
game.fagulha--;
const a=player.angle;
bullets.push({x:player.x+Math.cos(a)*16,y:player.y+Math.sin(a)*16,vx:Math.cos(a)*640,vy:Math.sin(a)*640,r:6,dmg:30*P.dmgMult,life:560/640,a:a,elem:null,color:'#ff8f3d',fag:true});
sfx.shotS();blip('sawtooth',300,90,.18,.08);
sparks(player.x+Math.cos(a)*18,player.y+Math.sin(a)*18,'#ff8f3d',6,160,.4,3,true);
}
/* v1.1.0: O FEIXE — raio carregado que AGORA obedece aos multiplicadores:
   tiros extras (LÂMINAS GÊMEAS etc.) viram feixes em leque, e os elementos
   aceitos (gelo/fogo/veneno/trovão) aplicam seus efeitos em quem for atingido.
   opts: {mini:true} = mini-feixe das gêmeas (rápido, fraco, sem elemento);
   {dmgMul,side} = feixe bônus deslocado (pistola gêmea no soltar cheio). */
function fireBeam(a,opts){
opts=opts||{};
const mini=!!opts.mini;
const len=(mini?420:560)*P.reachMult;
const w=mini?9:26;
const sm=(game.sinSoberba&&player.hp>=player.maxHp-1)?1.3:1;
const base=(mini?9:58)*P.dmgMult*(opts.dmgMul||1)*sm;
const rays=mini?1:1+game.multi;
const elems=ownedElems();
for(let ri=0;ri<rays;ri++){
const ang=a+(mini?0:(ri-(rays-1)/2)*.13);
const perp=ang+Math.PI/2;
const off=mini?(game._miniSide||1)*9:(opts.side?opts.side*10:0);
const ox=Math.cos(perp)*off,oy=Math.sin(perp)*off;
const ca=Math.cos(ang),sa=Math.sin(ang);
const elem=(!mini&&elems.length)?elems[game.elemCycle++%elems.length]:null;
let mult=1;
if(elem)mult=ELEM_DATA[elem].mult*(1+.12*(game.elements[elem]-1));
const rdmg=base*mult;
beamShots.push({x:player.x+ox,y:player.y+oy,a:ang,t:0,life:mini?.16:.42,len:len,w:w});
const hitLine=(ex,ey,er)=>{
const dx=ex-(player.x+ox),dy=ey-(player.y+oy);
const proj=dx*ca+dy*sa;
if(proj<-er||proj>len+er)return false;
return Math.abs(-dx*sa+dy*ca)<=w*.5+er*.7;
};
for(const e of enemies){
if(e.dead||e.spawnT<.3)continue;
if(hitLine(e.x,e.y,e.r)){
if(!shadowInvuln(e)&&!knightRedirectHorse(e,rdmg)){e.hp-=elemDmg(e,rdmg);e.flash=.18;}
if(elem)applyElem({kind:'enemy',obj:e},elem,rdmg);
volatilCheck(e);
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>.98){
for(const h of boss.heads){
if(!h.alive)continue;
if(hitLine(h.hx,h.hy,h.r)){h.hp-=rdmg;h.flash=.15;dmgText(h.hx,h.hy-18,rdmg);if(h.hp<=0)killHead(h);}
}
}
if(game.caronteBoss&&game.carontePhase===1){
const cb=game.caronteBoss;
if(hitLine(cb.x,cb.y,cb.r))damageCaronte(rdmg);
}
if(!mini)sparks(player.x+ox+ca*30,player.y+oy+sa*30,'#fff3c4',10,300,.55,4,true);
}
if(mini){sfx.shotS();blip('sawtooth',900,300,.1,.08);}
else{
game.flash=Math.max(game.flash,.35);game.shake=Math.max(game.shake,10);
blip('sawtooth',1400,240,.4,.3);noiseSfx(.3,.2,900,'highpass');
}
}
/* v1.0.0: REAÇÃO VOLÁTIL — raio sobre um inimigo em chamas detona */
function volatilCheck(e){
if(!game.psyn.detonacao||!e||e.dead)return;
if(!(e.burnT>0))return;
if(game.t-(e._volT||-9)<.8)return;
e._volT=game.t;
explodeAt(e.x,e.y,88,24*P.dmgMult);
for(let i=0;i<8;i++)particles.push({x:e.x+rnd(-10,10),y:e.y+rnd(-10,10),vx:rnd(-170,170),vy:rnd(-170,170),life:.4,t:0,r:rnd(2,4),c:'#cfe9ff',drag:.9,glow:true});
texts.push({x:e.x,y:e.y-26,txt:'REAÇÃO VOLÁTIL',t:0,life:.8,c:'#cfe9ff',size:10,disp:true});
}
/* v1.0.0: VAPOR — fumaça curta, do pacto fogo+gelo */
function spawnVaper(x,y,a){
vapers.push({x:x,y:y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,t:0,life:2.2,r:16,seed:rnd(10)});
}
function updateVapers(dt){
for(let i=vapers.length-1;i>=0;i--){
const v=vapers[i];v.t+=dt;
if(v.t>=v.life){vapers.splice(i,1);continue;}
v.vx*=Math.pow(.25,dt);v.vy*=Math.pow(.25,dt);
v.x+=v.vx*dt;v.y+=v.vy*dt;
if(!inRoomXY(v.x,v.y,20)){vapers.splice(i,1);continue;}
v.r=Math.min(58,v.r+34*dt);
for(const e of enemies){
if(e.dead||e.spawnT<.4)continue;
if(dist(v.x,v.y,e.x,e.y)<v.r+e.r*.6){
e.burnT=Math.max(e.burnT||0,.4);e.burnD=Math.max(e.burnD||0,2*P.dmgMult);
const d=16*P.dmgMult*dt;
if(!shadowInvuln(e)&&!knightRedirectHorse(e,d)){e.hp-=elemDmg(e,d);}
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>.98){
for(const h of boss.heads){
if(h.alive&&dist(v.x,v.y,h.hx,h.hy)<v.r+h.r){h.hp-=16*P.dmgMult*dt;h.flash=.06;if(h.hp<=0)killHead(h);}
}
}
}
}
function updateBeamShots(dt){
for(let i=beamShots.length-1;i>=0;i--){const s=beamShots[i];s.t+=dt;if(s.t>=s.life)beamShots.splice(i,1);}
}
/* v1.0.0: desenhos do vapor, do feixe e da barra de carga */
function drawVapers(){
for(const v of vapers){
const k=v.t/v.life;
const a=(1-k)*.32;
ctx.save();
for(let i=0;i<3;i++){
const ph=game.t*1.7+i*2.1+v.seed;
const ox=Math.cos(ph)*v.r*.24,oy=Math.sin(ph*1.3)*v.r*.18;
ctx.globalAlpha=a*(1-i*.22);
ctx.fillStyle=i===2?'#f2f0ea':'#cfd4d8';
ctx.beginPath();ctx.arc(v.x+ox,v.y+oy-i*5,v.r*(.62+i*.22),0,TAU);ctx.fill();
}
ctx.restore();
}
ctx.globalAlpha=1;
}
function drawBeamShots(){
for(const s of beamShots){
const k=s.t/s.life;
const a=1-k;
const len=s.len*(.55+.45*Math.min(1,k*6));
ctx.save();
ctx.translate(s.x,s.y);
ctx.rotate(s.a);
/* v1.2.0: feixe refeito — aura larga, corpo e miolo branco-quente */
ctx.globalAlpha=a*.28;
ctx.fillStyle=s.blue?'#9fd4ff':s.gold?'#ffe9a0':'#c9a0ff';
ctx.fillRect(0,-s.w*.72*a,len,s.w*1.44*a);
ctx.globalAlpha=a*.55;
ctx.fillStyle=s.blue?'#7fb8ff':s.gold?'#ffd9a0':'#e6d8ff';
ctx.fillRect(0,-s.w*.42*a,len,s.w*.84*a);
ctx.globalAlpha=a*.95;
ctx.fillStyle=s.blue?'#eaf6ff':'#fff8e0';
ctx.fillRect(0,-s.w*.2*a,len,s.w*.4*a);
ctx.globalAlpha=a;
ctx.fillStyle='#ffffff';
ctx.fillRect(0,-s.w*.07*a*(.8+.2*Math.sin(s.t*40)),len,s.w*.14*a);
ctx.restore();
}
ctx.globalAlpha=1;
}
function drawBeamCharge(){
if(!game.hasBeam||!game.beamCharging||player.dead)return;
const c=game.beamCharge||0;
const px=player.x,py=player.y-34;
/* brilho na boca da arma enquanto carrega */
ctx.save();
ctx.globalAlpha=.25+.55*c;
ctx.fillStyle='#fff3c4';
ctx.beginPath();ctx.arc(player.x+Math.cos(player.angle)*20,player.y+Math.sin(player.angle)*20,3+9*c,0,TAU);ctx.fill();
ctx.restore();
/* barra da carga acima do cão */
ctx.save();
ctx.globalAlpha=.9;
ctx.fillStyle='rgba(10,7,8,.7)';
ctx.fillRect(px-26,py-4,52,7);
ctx.strokeStyle='rgba(255,243,196,.5)';ctx.lineWidth=1;
ctx.strokeRect(px-26,py-4,52,7);
ctx.fillStyle=c>=1?'#ffd9a0':'#fff3c4';
ctx.fillRect(px-24,py-2,48*c,3);
if(c>=1){ctx.globalAlpha=.5+.5*Math.sin(game.t*14);ctx.strokeStyle='#ffd9a0';ctx.strokeRect(px-28,py-6,56,11);}
ctx.restore();
}
let arrowShotT=0;
function updateShot(dt){
player.shotT-=dt;
player.pistolT=(player.pistolT||0)-dt;
player.fagT=(player.fagT||0)-dt;
arrowShotT-=dt;
if(game.paused||player.dead)return;
/* v1.0.0: carga do FEIXE — sobe enquanto segura; sem botão/seta, dispara */
if(game.beamCharging&&game.hasBeam){
game.beamCharge=Math.min(1,(game.beamCharge||0)+dt/.85);
if(!game.beamFull&&game.beamCharge>=1){game.beamFull=true;blip('sine',1100,1500,.12,.12);}
/* v1.1.0: GÊMEAS DO FEIXE — enquanto carrega, a outra pistola cospe mini-feixes rápidos */
if(game.pistolBeam){
game._miniT=(game._miniT||0)-dt;
if(game._miniT<=0){game._miniT=.09;game._miniSide=-(game._miniSide||1);fireBeam(game.beamA,{mini:true});}
}
const arrowsHeld=keys['ArrowLeft']||keys['ArrowRight']||keys['ArrowUp']||keys['ArrowDown'];
if(!mouseHeld&&!arrowsHeld)releaseBeam();
}
/* setinhas do teclado: atacam na direção segurada (tiro e/ou mordida) */
let sx=0,sy=0;
if(keys['ArrowLeft'])sx--;if(keys['ArrowRight'])sx++;if(keys['ArrowUp'])sy--;if(keys['ArrowDown'])sy++;
if(sx||sy){
const a=Math.atan2(sy,sx);
player.angle=a;
if(game.hasBeam){
/* v1.1.0: com o feixe, segurar seta = carregar; no 1º frame as gêmeas atiram bala */
if(!game.beamCharging)firePistols(a);
game.beamCharging=true;game.beamA=a;
}else{
if(game.hasShot)fireShot(a);
if(game.hasPistols)firePistols(a);
}
if(game.hasBite&&arrowShotT<=0){tryBite(a);arrowShotT=.12;}
return;
}
/* tiro automático — somente com a bênção rara OLHO DO CAÇADOR */
if(game.autoFire&&game.hasShot&&!game.beamCharging){
const reach=470*P.reachMult;
const tgt=nearestTarget(reach);
if(tgt){
const p=targetPos(tgt);
if(p)fireShot(Math.atan2(p.y-player.y,p.x-player.x));
}
}
}
function applyElem(tgt,elem,dmg){
if(tgt.kind==='head')return;
const e=tgt.obj,lvl=game.elements[elem]||1;
if(elem==='gelo'){
e.slowT=1.2+.7*lvl;
/* v0.9.16: BRUXA DO GELO — congelados ficam presos 60% mais tempo */
if(game.specGelo)e.slowT*=1.6;
sparks(e.x,e.y,'#9fd8ff',3,100,.4,2.5,true);sfx.freeze();
}else if(elem==='fogo'){
e.burnT=2+.8*lvl;e.burnD=(1.8+1.2*lvl)*P.dmgMult;
/* v0.9.16 sinergia VAPOR CORTANTE — fogo em congelados estoura em vapor */
if(game.psyn.vapor&&e.slowT>0){
sparks(e.x,e.y,'#dfe7ee',14,220,.6,4,true);
const steamD=18*P.dmgMult;
for(const o of enemies){
if(o===e||o.dead||o.spawnT<.5)continue;
if(dist(e.x,e.y,o.x,o.y)<95){
if(!shadowInvuln(o)&&!knightRedirectHorse(o,steamD)){o.hp-=steamD;o.flash=.2;if(o.hp<=0)killEnemy(o);}
}
}
shockwaves.push({x:e.x,y:e.y,r:0,vr:560,maxR:100,t:0,dur:.35,c:'#dfe7ee'});
blip('sine',900,300,.2,.1);
}
}else if(elem==='veneno'){
e.poisT=3.5+1.5*lvl;e.poisD=(1.2+.7*lvl)*P.dmgMult;
e.poisStack=Math.min(1+lvl,(e.poisStack||0)+1);
}else if(elem==='trovao'){
let bt=null,bd=110+45*lvl;
for(const o of enemies){
if(o===e||o.dead||o.spawnT<.5)continue;
const d=dist(e.x,e.y,o.x,o.y);
if(d<bd){bd=d;bt=o;}
}
if(boss.active&&!boss.dying&&boss.scale>0.98&&!boss.introLock){
for(const h of boss.heads){
if(!h.alive)continue;
const d=dist(e.x,e.y,h.hx,h.hy);
if(d<bd){bd=d;bt={head:h};}
}
}
if(bt){
/* v0.9.16 sinergia ESTÁTICA DO VENTO — a cadeia fere 30% mais fundo */
let chainDmg=dmg*(.5+.15*lvl);
if(game.psyn.estatica)chainDmg*=1.3;
arcs.push({x1:e.x,y1:e.y,x2:bt.head?bt.head.hx:bt.x,y2:bt.head?bt.head.hy:bt.y,t:0,life:.18});
if(bt.head){
bt.head.hp-=chainDmg;bt.head.flash=.1;
if(bt.head.hp<=0)killHead(bt.head);
}else{
/* v0.9.16 sinergia SUPERCONDUTOR — o raio congela quem toca */
if(game.psyn.supercondutor)bt.slowT=Math.max(bt.slowT||0,1.5);
bt.hp-=chainDmg;
volatilCheck(bt);/* v1.0.0: REAÇÃO VOLÁTIL — raio em queimado detona */
if(bt.hp<=0)killEnemy(bt);
}
if(game.chain2){
const fx=bt.head?bt.head.hx:bt.x,fy=bt.head?bt.head.hy:bt.y;
let c2=null,cd=140;
for(const o of enemies){
if(o.dead||o===e||o===bt)continue;
const d=dist(fx,fy,o.x,o.y);
if(d<cd){cd=d;c2=o;}
}
if(boss.active&&!boss.dying&&boss.scale>0.98&&!boss.introLock){
for(const h of boss.heads){
if(!h.alive||h===bt.head)continue;
const d=dist(fx,fy,h.hx,h.hy);
if(d<cd){cd=d;c2={head:h};}
}
}
if(c2){
arcs.push({x1:fx,y1:fy,x2:c2.head?c2.head.hx:c2.x,y2:c2.head?c2.head.hy:c2.y,t:0,life:.18});
if(c2.head){
c2.head.hp-=chainDmg;c2.head.flash=.1;
if(c2.head.hp<=0)killHead(c2.head);
}else{
c2.hp-=chainDmg;
if(c2.hp<=0)killEnemy(c2);
}
}
}
}
}
}
function updateBullets(dt){
for(let i=bullets.length-1;i>=0;i--){
const b=bullets[i];b.life-=dt;
b.x+=b.vx*dt;b.y+=b.vy*dt;
if(b.life<=0||!inRoomXY(b.x,b.y,8)){
if(b.fag&&!b._fagBoom){b._fagBoom=true;explodeAt(b.x,b.y,64,14*P.dmgMult);}
bullets.splice(i,1);continue;}
if(Math.random()<.4)particles.push({x:b.x,y:b.y,vx:rnd(-15,15),vy:rnd(-15,15),life:.2,t:0,r:1.5,c:b.elem?ELEM_DATA[b.elem].c:'#cfe9ff',glow:true});
let hit=false;
for(const e of enemies){
if(e.dead)continue;
if(dist(b.x,b.y,e.x,e.y)<e.r+b.r+2){
if(!shadowInvuln(e)){if(!knightRedirectHorse(e,b.dmg)){e.hp-=elemDmg(e,window.__RM?window.__RM.hitDmg(e,b.dmg,b):b.dmg);e.flash=.1;}} /* v1.4.0 */
hit=true;sfx.ehit();
const bcol=b.color||(b.elem?ELEM_DATA[b.elem].c:'#cfe9ff');
sparks(b.x,b.y,bcol,3,150,.3,2,true);
/* v0.9.6: Coração — tiros de sangue causam sangramento (reusa burn) */
if(b.bleed){e.burnT=3;e.burnD=4*P.dmgMult;sparks(e.x,e.y,'#d9465a',4,120,.35,2.5,true);}
/* v0.9.6: Lágrimas — tiros de lágrima causam lentidão */
if(b.tear||b.slowShot){e.slowT=Math.max(e.slowT,1.5);sparks(e.x,e.y,'#9fd8ff',4,120,.35,2.5,true);}
if(b.elem)applyElem({kind:'enemy',obj:e},b.elem,b.dmg);
if(window.__GRI)window.__GRI.playerHit(e,b); /* v1.9.0: ganchos do grimório (marcas, dente do veredito, sinergias) */
/* v1.1.0: FAGULHA EXPLOSIVA — o tiro que detona: estoura em área ao ferir */
if(b.fag&&!b._fagBoom){b._fagBoom=true;explodeAt(b.x,b.y,74,26*P.dmgMult);sparks(b.x,b.y,'#ffd9a0',12,240,.5,3,true);}
if(e.hp<=0)killEnemy(e);
break;
}
}
if(hit&&P.explShot)explodeAt(b.x,b.y,48+16*P.explShot,b.dmg*(.45+.3*(P.explShot-1)));
if(!hit){
for(let j=ebullets.length-1;j>=0;j--){
const m=ebullets[j];
if(m.mine&&dist(b.x,b.y,m.x,m.y)<m.r+b.r+2){
sparks(m.x,m.y,m.c,6,150,.4,3,true);blip('sine',400,180,.1,.06);
ebullets.splice(j,1);hit=true;break;
}
}
}
if(!hit&&boss.active&&!boss.dying&&boss.scale>0.98){
for(const h of boss.heads){
if(!h.alive)continue;
if(dist(b.x,b.y,h.hx,h.hy)<h.r+b.r+6){
hit=true;sfx.bhit();
sparks(b.x,b.y,b.elem?ELEM_DATA[b.elem].c:'#cfe9ff',4,180,.4,2.5,true);
const pre=b.dmg;h.hp-=pre;h.flash=.12;
dmgText(h.hx+rnd(-10,10),h.hy-18,pre);
if(P.explShot)explodeAt(b.x,b.y,48+16*P.explShot,pre*(.45+.3*(P.explShot-1)));
if(h.hp<=0)killHead(h);
break;
}
}
if(!hit&&dist(b.x,b.y,boss.x,boss.y)<boss.r*.9+b.r){hit=true;sfx.thud();sparks(b.x,b.y,'#57504e',3,90,.3,2);}
}
/* ==== Caronte boss — bala colide com o corpo dele ==== */
if(!hit&&game.caronteBoss&&game.carontePhase===1){
const cb=game.caronteBoss;
if(dist(b.x,b.y,cb.x,cb.y)<cb.r+b.r+4){
  hit=true;sfx.bhit();
  sparks(b.x,b.y,b.elem?ELEM_DATA[b.elem].c:'#9d6bb5',5,200,.4,3,true);
  damageCaronte(b.dmg);
  if(P.explShot)explodeAt(b.x,b.y,48+16*P.explShot,b.dmg*(.45+.3*(P.explShot-1)));
}
}
/* v0.9.6: tiro com explosão (explShot) OU A FAGULHA [Q] atinge a janela e a
   quebra — acesso ao Erro 404 (v1.4.4: a fagulha agora também abre o 404) */
if(!hit&&(P.explShot||b.fag)&&game.roomWindow&&!game.roomWindow.used&&!game.roomWindow.broken){
  const w=game.roomWindow;
  if(dist(b.x,b.y,w.x,w.y+33)<40){
    w.broken=true;
    hit=true;
    sparks(w.x,w.y+33,'#cfe9ff',12,200,.5,3,true);
    sparks(w.x,w.y+33,'#ff4fd8',8,160,.4,3,true);
    sfx.glitch();sfx.static_();
    game.shake=Math.max(game.shake,10);
    explodeAt(w.x,w.y+33,60,0);
    texts.push({x:w.x,y:w.y,txt:'JANELA QUEBRADA',t:0,life:2,c:'#4ff5ff',size:12,disp:true});
    texts.push({x:w.x,y:w.y+20,txt:'interagir para atravessar',t:0,life:2,c:'#ff4fd8',size:10});
  }
}
/* v0.9.16: MUNIÇÃO ÉTERICA — o primeiro inimigo é atravessado (bala ganha
   marca _et e segue; no SEGUNDO contato ela some. Dano reduzido 40% na passagem) */
if(hit&&game.etShotT>0&&!b._et){
  b._et=true;b.dmg*=.6;hit=false;
  /* re-procura alvos atrás do primeiro para o resto do frame? Não — segue voando */
}
/* v1.1.0: FAGULHA EXPLOSIVA × PORTA ESCONDIDA — só o TIRO DE FAGULHA [Q]
   detona a parede rachada; tiros normais não gastam mais a fagulha */
if(!hit&&b.fag&&!b._fagBoom){
for(const d of game.doors){
if(!d.hidden||d.open)continue;
if(dist(b.x,b.y,d.x,d.y)<36){
b._fagBoom=true;
const tgt=game.mapRooms[d.to];if(tgt)tgt.blasted=true;
d.open=true;d.blastT=0;hit=true;
explodeAt(d.x,d.y,52,10*P.dmgMult);
sparks(d.x,d.y,'#ff8f3d',26,320,.8,4,true);
sparks(d.x,d.y,'#ffd9a0',14,240,.7,3.5,true);
shockwaves.push({x:d.x,y:d.y,r:0,vr:640,maxR:130,t:0,dur:.45,c:'#ff8f3d'});
game.shake=Math.max(game.shake,14);game.flash=Math.max(game.flash,.3);
sfx.explode();sfx.gate();
game.banner={type:'small',txt:'A PAREDE CEDEU',sub:'uma passagem escondida se abriu',t:0,dur:2.4};
break;
}
}
}
if(hit)bullets.splice(i,1);
}
}
/* ============ modo mordida (manual: vem junto do clique/setas) ============ */
function tryBite(a){
if(player.biteT>0)return;
player.biteT=1/(0.95*P.rateMult);
/* v0.9.1: alcance da mordida aumentado de 112 para 145 */
const range=145*P.biteRange*(0.72+0.28*P.reachMult);
const ang=a;
const berserkMul=(game.berserk&&player.hp<=1)?1.75:1;
/* v0.9.1: dano base da mordida aumentado de 14 para 22 */
const dmg=22*P.dmgMult*P.biteMult*berserkMul*((game.sinSoberba&&player.hp>=player.maxHp-1)?1.3:1);
biteFxs.push({x:player.x+Math.cos(ang)*72,y:player.y+Math.sin(ang)*72,ang:ang,t:0,life:.22});
sfx.bite();game.shake=Math.max(game.shake,4);
for(const e of enemies){
if(e.dead)continue;
const d=dist(player.x,player.y,e.x,e.y);
if(d<range+e.r&&Math.abs(angDiff(Math.atan2(e.y-player.y,e.x-player.x),ang))<1.0){
if(!shadowInvuln(e)){if(!knightRedirectHorse(e,dmg)){e.hp-=elemDmg(e,window.__RM?window.__RM.hitDmg(e,dmg,{bite:1,ice:game.biteFrost}):dmg);e.flash=.12;}} /* v1.4.0 */
markMeleeHit(e);
const kb=Math.atan2(e.y-player.y,e.x-player.x);
e.x+=Math.cos(kb)*44;e.y+=Math.sin(kb)*44;
sparks(e.x,e.y,'#d9465a',6,220,.45,3,true);
if(game.biteFire){e.burnT=2.4;e.burnD=3*P.dmgMult;sparks(e.x,e.y,'#ff8f3d',3,120,.35,2.5,true);}
if(game.biteFrost){e.slowT=Math.max(e.slowT||0,1.6);sparks(e.x,e.y,'#9fd8ff',3,120,.35,2.5,true);}
if(game.biteVenom){e.poisT=3.5;e.poisD=2.2*P.dmgMult;e.poisStack=(e.poisStack||0)+1;sparks(e.x,e.y,'#a8c24f',3,120,.35,2.5,true);}
if(game.biteQuake)explodeAt(e.x,e.y,60,dmg*.5);
if(e.hp<=0)killEnemy(e);
}
}
for(let i=ebullets.length-1;i>=0;i--){
const m=ebullets[i];
if(m.mine&&dist(player.x,player.y,m.x,m.y)<range+20){
sparks(m.x,m.y,m.c,6,150,.4,3,true);ebullets.splice(i,1);
}
}
/* GUARDA PROFANA: a mordida rebate os tiros que a hitbox acertar */
parrySweep(player.x,player.y,ang,1.05,range);
if(boss.active&&!boss.dying&&boss.scale>0.98){
for(const h of boss.heads){
if(!h.alive)continue;
const d=dist(player.x,player.y,h.hx,h.hy);
if(d<range+h.r&&Math.abs(angDiff(Math.atan2(h.hy-player.y,h.hx-player.x),ang))<1.0){
sparks(h.hx,h.hy,h.c,7,220,.45,3,true);hitHead(h,dmg);markMeleeHit(null);
}
}
}
}
function updateBite(dt){
player.biteT-=dt;
}
/* ============ motoserra ============ */
function updateChainsaw(dt){
if(!P.chainsaw)return;
const range=102+14*P.chainsaw;
const tgt=nearestTarget(range+40);
let active=false,aim=player.angle;
if(tgt){const p=targetPos(tgt);aim=Math.atan2(p.y-player.y,p.x-player.x);active=true;}
player.sawAim=lerpAngle(player.sawAim,aim,1-Math.exp(-10*dt));
player.sawAnim+=dt*(active?26:6);
if(!active)return;
player.sawT-=dt;
if(player.sawT>0)return;
player.sawT=.1;
const synC=game.synCarrasco?1.5:1;
const dmg=(7+4*P.chainsaw)*synC*P.dmgMult;
for(const e of enemies){
if(e.dead)continue;
const d=dist(player.x,player.y,e.x,e.y);
if(d<range+e.r&&Math.abs(angDiff(Math.atan2(e.y-player.y,e.x-player.x),player.sawAim))<1.0){
if(!shadowInvuln(e)){if(!knightRedirectHorse(e,dmg)){e.hp-=elemDmg(e,dmg);e.flash=.08;}}
markMeleeHit(e);
sparks(e.x,e.y,'#d9465a',2,160,.3,2.5,true);
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>0.98){
for(const h of boss.heads){
if(!h.alive)continue;
const d=dist(player.x,player.y,h.hx,h.hy);
if(d<range+h.r&&Math.abs(angDiff(Math.atan2(h.hy-player.y,h.hx-player.x),player.sawAim))<1.0){
h.hp-=dmg;h.flash=.08;sfx.bhit();markMeleeHit(null);
sparks(h.hx,h.hy,h.c,2,160,.3,2.5,true);
if(h.hp<=0)killHead(h);
}
}
}
/* GUARDA DE DEUS: a serra segurada também rebate o que a hitbox pegar */
parrySweep(player.x,player.y,player.sawAim,1.05,range);
sfx.saw();
}
function updateThrownSaw(dt){
if(!thrownSaw)return;
const s=thrownSaw;
s.spin+=dt*30;
if(s.state==='out'){
s.x+=s.vx*dt;s.y+=s.vy*dt;s.dist+=Math.hypot(s.vx,s.vy)*dt;
if(s.dist>320+40*P.chainsaw||!inRoomXY(s.x,s.y,24))s.state='back';
}else{
const a=Math.atan2(player.y-s.y,player.x-s.x);
s.x+=Math.cos(a)*820*dt;s.y+=Math.sin(a)*820*dt;
if(dist(s.x,s.y,player.x,player.y)<26){thrownSaw=null;return;}
}
if(Math.random()<.7)particles.push({x:s.x+rnd(-6,6),y:s.y+rnd(-6,6),vx:rnd(-25,25),vy:rnd(-25,25),life:.25,t:0,r:1.6,c:'#cfd8dc',glow:true});
const dmg=(6+3.5*P.chainsaw)*P.dmgMult;
for(const e of enemies){
if(e.dead||e.hitT>0)continue;
if(dist(s.x,s.y,e.x,e.y)<20+e.r){
if(shadowInvuln(e)){e.hitT=.28;e.flash=.1;sfx.ehit();}
else if(!knightRedirectHorse(e,dmg)){e.hp-=elemDmg(e,dmg);e.hitT=.28;e.flash=.1;sfx.ehit();}
sparks(s.x,s.y,'#d9465a',3,170,.3,2.5,true);
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>0.98&&!boss.introLock){
for(const h of boss.heads){
if(!h.alive||h.mjolT>0)continue;
if(dist(s.x,s.y,h.hx,h.hy)<20+h.r){
h.mjolT=.3;sfx.bhit();
sparks(s.x,s.y,h.c,4,180,.35,2.5,true);
dmgText(h.hx+rnd(-10,10),h.hy-18,dmg);
if(h.hp<=0)killHead(h);
}
}
}
}
/* ============ gram ============ */
function updateSword(dt){
if(!P.sword)return;
player.swordT-=dt;
if(player.swordT>0)return;
const range=140+20*P.sword;
const tgt=nearestTarget(range+30);
if(!tgt)return;
player.swordT=1.3-.16*P.sword;
const p=targetPos(tgt);
const a=Math.atan2(p.y-player.y,p.x-player.x);
const dmg=(15+9*P.sword)*P.dmgMult;
swordFxs.push({ang:a,t:0,life:.28,range:range});
sfx.slash();game.shake=Math.max(game.shake,3);
for(const e of enemies){
if(e.dead)continue;
const d=dist(player.x,player.y,e.x,e.y);
if(d<range+e.r&&Math.abs(angDiff(Math.atan2(e.y-player.y,e.x-player.x),a))<1.2){
if(!shadowInvuln(e)){if(!knightRedirectHorse(e,dmg)){e.hp-=elemDmg(e,window.__RM?window.__RM.hitDmg(e,dmg,{sword:1}):dmg);e.flash=.12;}} /* v1.4.0 */
markMeleeHit(e);
sparks(e.x,e.y,'#e6dac4',5,200,.4,3,true);
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>0.98){
for(const h of boss.heads){
if(!h.alive)continue;
const d=dist(player.x,player.y,h.hx,h.hy);
if(d<range+h.r&&Math.abs(angDiff(Math.atan2(h.hy-player.y,h.hx-player.x),a))<1.2){
sparks(h.hx,h.hy,h.c,6,200,.45,3,true);hitHead(h,dmg);markMeleeHit(null);
}
}
}
/* GUARDA DE DEUS: o arco largo da LÂMINA DRAGÃO corta os tiros no caminho */
parrySweep(player.x,player.y,a,1.25,range);
}
/* ============ magias ============ */
function updateNova(dt){
if(!P.nova)return;
game.novaT-=dt;
if(game.novaT>0)return;
game.novaT=Math.max(2,4.6-.65*(P.nova-1));
const radius=130+28*P.nova;
const dmg=(9+7*P.nova)*P.dmgMult;
novaFxs.push({t:0,life:.5,r:radius});
sfx.nova();sfx.freeze();game.shake=Math.max(game.shake,4);
sparks(player.x,player.y,'#9fd8ff',14,240,.5,3,true);
for(const e of enemies){
if(e.dead)continue;
if(dist(player.x,player.y,e.x,e.y)<radius+e.r){
if(!shadowInvuln(e)){if(!knightRedirectHorse(e,dmg)){e.hp-=dmg;e.flash=.1;}}
e.slowT=2.2;
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>0.98){
for(const h of boss.heads){
if(!h.alive)continue;
if(dist(player.x,player.y,h.hx,h.hy)<radius+h.r)hitHead(h,dmg,'#9fd8ff');
}
}
}
function updateStakes(dt){
if(!P.stakes)return;
game.stakeT-=dt;
if(game.stakeT>0)return;
game.stakeT=Math.max(1.7,3.9-.55*(P.stakes-1));
const targets=[];
for(const e of enemies)if(!e.dead&&e.spawnT>.5)targets.push({kind:'enemy',obj:e});
if(boss.active&&!boss.dying&&boss.scale>0.98&&!boss.introLock){
for(const h of boss.heads)if(h.alive)targets.push({kind:'head',obj:h});
}
if(!targets.length)return;
const n=1+P.stakes;
const dmg=(11+5*P.stakes)*P.dmgMult;
for(let i=0;i<n;i++){
const t=pick(targets),p=targetPos(t);
if(!p)continue;
stakeFxs.push({x:p.x,y:p.y,t:0,life:.4});
sfx.stake();sparks(p.x,p.y,'#9fd8ff',6,180,.4,2.5,true);
if(t.kind==='enemy'){
t.obj.hp-=dmg;t.obj.flash=.1;t.obj.slowT=Math.max(t.obj.slowT||0,1.8);
if(t.obj.hp<=0)killEnemy(t.obj);
}else hitHead(t.obj,dmg,'#9fd8ff');
}
}
function updateShock(dt){
if(P.shock>0&&!player.dead&&(game.state==='play'||game.state==='bossintro')){
game.shockT-=dt;
if(game.shockT<=0){
game.shockT=Math.max(2.4,4.6-.7*(P.shock-1));
shockwaves.push({x:player.x,y:player.y,r:22,vr:560,maxR:300+70*P.shock,dmg:(9+6*P.shock)*P.dmgMult,hit:new Set()});
sfx.shock();game.shake=Math.max(game.shake,3);
sparks(player.x,player.y,'#ffd9a0',6,180,.35,3,true);
}
}
for(let i=shockwaves.length-1;i>=0;i--){
const w=shockwaves[i];
/* v0.9.5: proteção contra shockwaves inválidas (sem vr ou r NaN) */
if(isNaN(w.r)||w.vr===undefined){shockwaves.splice(i,1);continue;}
/* v0.9.16 FIX DO TRAVAMENTO: shockwaves VISUAIS (latido, O MUNDO, ativos,
   telegráficos KAIZO) não têm hit Set nem dmg — antes, w.hit.has(e) lançava
   exceção DENTRO do frame e congelava o jogo inteiro. Agora ondas sem dmg
   são só visual: expandem e somem, sem tocar na lógica de dano. */
if(!w.hit||w.dmg===undefined){w.r+=w.vr*dt;if(w.r>w.maxR)shockwaves.splice(i,1);continue;}
w.r+=w.vr*dt;
for(const e of enemies){
if(e.dead||w.hit.has(e))continue;
if(Math.abs(dist(e.x,e.y,w.x,w.y)-w.r)<26+e.r){
w.hit.add(e);
if(!shadowInvuln(e)){if(!knightRedirectHorse(e,w.dmg)){e.hp-=elemDmg(e,w.dmg);e.flash=.12;}}
sparks(e.x,e.y,'#ffd9a0',4,160,.35,3,true);
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>0.98&&!boss.introLock){
for(const h of boss.heads){
if(!h.alive||w.hit.has(h))continue;
if(Math.abs(dist(h.hx,h.hy,w.x,w.y)-w.r)<26+h.r){w.hit.add(h);hitHead(h,w.dmg,'#ffd9a0');}
}
}
for(let j=ebullets.length-1;j>=0;j--){
const b=ebullets[j];
if(Math.abs(dist(b.x,b.y,w.x,w.y)-w.r)<20+b.r){
sparks(b.x,b.y,'#ffd9a0',3,120,.3,2.5,true);ebullets.splice(j,1);
}
}
if(w.r>w.maxR)shockwaves.splice(i,1);
}
}
function updateMagics(dt){
if(player.dead)return;
if(P.dark>0){
game.darkAng+=dt*1.7;
const dmg=(7+4*P.dark)*P.dmgMult;
for(let i=0;i<P.dark;i++){
const a=game.darkAng+i*TAU/P.dark;
const ox=player.x+Math.cos(a)*58,oy=player.y+Math.sin(a)*58;
for(const e of enemies){
if(e.dead||e.hitT>0)continue;
if(dist(ox,oy,e.x,e.y)<16+e.r){
if(shadowInvuln(e)){e.hitT=.35;e.flash=.1;}
else if(!knightRedirectHorse(e,dmg)){e.hp-=elemDmg(e,dmg);e.hitT=.35;e.flash=.1;}
sparks(ox,oy,'#9d6bb5',3,140,.3,2.5,true);
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>0.98&&!boss.introLock){
for(const h of boss.heads){
if(!h.alive||h.mjolT>0)continue;
if(dist(ox,oy,h.hx,h.hy)<16+h.r){
h.mjolT=.35;h.hp-=dmg;h.flash=.1;
sparks(ox,oy,'#9d6bb5',3,140,.3,2.5,true);
if(h.hp<=0)killHead(h);
}
}
}
}
}
if(P.burst>0){
game.burstT-=dt;
if(game.burstT<=0){
const t=nearestTarget(720);
if(t){
const p=targetPos(t);
geyserMarks.push({x:p.x,y:p.y,t:0,dur:.7,phase:'mark',c:'#ff8f3d',friendly:true,dmg:(13+7*P.burst)*(game.synVulcao?1.2:1)*P.dmgMult,rad:(85+22*P.burst)*(game.synVulcao?1.35:1)});
blip('sawtooth',160,70,.15,.06);
game.burstT=Math.max(3,5.6-.8*(P.burst-1));
}else game.burstT=.8;
}
}
if(P.light>0){
if(lightBeam){
lightBeam.t+=dt;lightBeam.ang+=dt*3.4;
const reach=250+40*P.light,dmg=(6+3*P.light)*P.dmgMult;
for(const e of enemies){
if(e.dead||e.hitT>0)continue;
const d=dist(player.x,player.y,e.x,e.y);
if(d<reach+e.r&&Math.abs(angDiff(Math.atan2(e.y-player.y,e.x-player.x),lightBeam.ang))<.1){
if(shadowInvuln(e)){e.hitT=.25;e.flash=.1;}
else if(!knightRedirectHorse(e,dmg)){e.hp-=elemDmg(e,dmg);e.hitT=.25;e.flash=.1;}
sparks(e.x,e.y,'#fff3c4',2,120,.25,2,true);
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>0.98&&!boss.introLock){
for(const h of boss.heads){
if(!h.alive||h.mjolT>0)continue;
const d=dist(player.x,player.y,h.hx,h.hy);
if(d<reach+h.r&&Math.abs(angDiff(Math.atan2(h.hy-player.y,h.hx-player.x),lightBeam.ang))<.1){
h.mjolT=.25;h.hp-=dmg;h.flash=.1;
if(Math.random()<.4)dmgText(h.hx+rnd(-10,10),h.hy-18,dmg,'#fff3c4');
if(h.hp<=0)killHead(h);
}
}
}
if(lightBeam.t>=lightBeam.dur)lightBeam=null;
}else{
game.lightMagT-=dt;
if(game.lightMagT<=0){
lightBeam={ang:rnd(TAU),t:0,dur:1.25};
game.lightMagT=Math.max(3.5,6.5-.9*(P.light-1));
blip('sine',700,1100,.25,.08);sfx.howl();
sparks(player.x,player.y,'#fff3c4',10,200,.5,3,true);
}
}
}
}
/* ============ o VEREDICTO (martelo executor) ============ */
function updateHammers(dt){
const reach=340*P.reachMult;
for(let hi=0;hi<hammers.length;hi++){
const h=hammers[hi];
h.spin+=dt*(h.state==='idle'?6:14);
if(h.state==='idle'){
const a=game.t*2.4+hi*TAU/hammers.length;
h.x=player.x+Math.cos(a)*42;h.y=player.y+Math.sin(a)*42;
h.fireT-=dt;
const tgt=nearestTarget(reach);
if(h.fireT<=0&&tgt){
h.state='out';h.target=tgt;
const p=targetPos(tgt);
const aa=Math.atan2(p.y-h.y,p.x-h.x);
h.vx=Math.cos(aa)*620;h.vy=Math.sin(aa)*620;
sfx.throw();
}
}else{
if(h.state==='out'){
const p=targetPos(h.target);
if(p){
const want=Math.atan2(p.y-h.y,p.x-h.x);
const cur=Math.atan2(h.vy,h.vx);
const aa=lerpAngle(cur,want,1-Math.exp(-5*dt));
h.vx=Math.cos(aa)*620;h.vy=Math.sin(aa)*620;
}
h.x+=h.vx*dt;h.y+=h.vy*dt;
if(dist(h.x,h.y,player.x,player.y)>reach)h.state='back';
}else{
const aa=Math.atan2(player.y-h.y,player.x-h.x);
h.x+=Math.cos(aa)*780*dt;h.y+=Math.sin(aa)*780*dt;
if(dist(h.x,h.y,player.x,player.y)<28){h.state='idle';h.fireT=1/P.rateMult;}
}
if(Math.random()<.6)particles.push({x:h.x+rnd(-4,4),y:h.y+rnd(-4,4),vx:rnd(-20,20),vy:rnd(-20,20),life:.3,t:0,r:1.5,c:'#8fd0e8',glow:true});
for(const e of enemies){
if(e.dead||e.hitT>0)continue;
if(dist(h.x,h.y,e.x,e.y)<e.r+15){
if(shadowInvuln(e)){e.hitT=.3;e.flash=.1;sfx.ehit();}
else if(!knightRedirectHorse(e,7*P.dmgMult)){e.hp-=elemDmg(e,7*P.dmgMult);e.hitT=.3;e.flash=.1;sfx.ehit();}
sparks(h.x,h.y,'#8fd0e8',3,150,.3,2,true);
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>0.98){
for(const hd of boss.heads){
if(!hd.alive||hd.mjolT>0)continue;
if(dist(h.x,h.y,hd.hx,hd.hy)<hd.r+15){
hd.mjolT=.35;sfx.bhit();
sparks(h.x,h.y,hd.c,4,180,.4,2.5,true);
hitHead(hd,7*P.dmgMult);
}
}
}
}
}
}
/* ============ trovão ============ */
function updateLightning(dt){
if(P.lightning<=0)return;
game.lightT-=dt;
if(game.lightT>0)return;
game.lightT=Math.max(1,(3.6-0.55*(P.lightning-1))*(game.storm?.5:1));
const targets=[];
for(const e of enemies)if(!e.dead&&e.spawnT>.5)targets.push({kind:'enemy',obj:e});
if(boss.active&&!boss.dying&&boss.scale>0.98&&!boss.introLock){
for(const h of boss.heads)if(h.alive)targets.push({kind:'head',obj:h});
}
if(!targets.length)return;
for(let i=0;i<P.lightning;i++){
const t=pick(targets),p=targetPos(t);
if(!p)continue;
const d=elemDmg(t.kind==='enemy'?t.obj:{slowT:0},10*P.dmgMult);
bolts.push({x:p.x,y:p.y,t:0,life:.22,seed:rnd(10)});
sparks(p.x,p.y,'#8fd0e8',8,220,.5,3,true);
game.shake=Math.max(game.shake,4);game.flash=Math.max(game.flash,.05);
sfx.thunder();
if(t.kind==='enemy'){
t.obj.hp-=d;t.obj.flash=.1;
volatilCheck(t.obj);/* v1.0.0: REAÇÃO VOLÁTIL */
if(t.obj.hp<=0)killEnemy(t.obj);
}else hitHead(t.obj,d);
}
}
/* ============ fila de inimigos por sala ============ */
function buildRoomQueue(kind){
const q=[];
const f=clamp(game.floor,1,5);
const pools={
1:[['sh',5],['al',3],['br',1],['sp',2],['cr',1]],
2:[['sh',3],['al',2],['sp',3],['fs',2],['br',1],['es',1],['cr',2],['vg',1]], /* v1.5.1: o MORCEGO FLAMEJANTE só caça a partir da PENUMBRA INFERNAL (andar 3+) */
3:[['sh',2],['sp',3],['fs',2],['ru',2],['ce',1],['al',2],['es',1],['la',1],['br',1],['cr',2],['vg',1],['fa',1],['mf',2]],
4:[['sh',2],['sp',3],['fs',3],['ru',2],['ce',2],['gd',1],['es',1],['la',1],['al',1],['cr',2],['vg',1],['fa',1],['pg',1],['mf',2]],
5:[['sh',2],['sp',3],['fs',3],['ru',3],['ce',2],['gd',2],['es',2],['la',2],['cr',2],['vg',1],['fa',1],['pg',1],['mf',2]]};
const pool=(kind==='challenge'&&game.floor>=2)?pools[Math.min(5,f+1)]:pools[f];
/* v0.9.1: menos inimigos por sala no começo */
let count=4+f*2+irnd(0,2);
/* v0.9.9: desafio escala MUITO por andar — mais inimigos, tipos mais duros e
   vida inflada (ver spawnEnemy). é a fonte do item do andar. */
if(kind==='challenge')count=Math.min(34,Math.round(count*(1.55+.18*(game.floor-1))));
if(game.hard)count=Math.round(count*1.2);
for(let i=0;i<count;i++){
let tot=0;for(const p of pool)tot+=p[1];
let r=rnd(tot);
for(const p of pool){r-=p[1];if(r<=0){q.push(p[0]);break;}}
}
if(game.hard){
for(let i=0;i<q.length;i++){
const t=q[i];
if(t==='sh'&&Math.random()<.5)q[i]='sp';
else if(t==='br'&&Math.random()<.6)q[i]=Math.random()<.5?'fs':'ce';
else if(t==='gd'&&Math.random()<.4)q[i]='fs';
}
}
return q;
}
/* ============================================================
   v1.5.0 — EMISSORES DANMAKU COMPARTILHADOS (Partes 9/10/18).
   Círculo completo, X, leque — reutilizados por vários inimigos.
   Nada disso substitui a identidade: cada chefe escolhe
   quantidades, ritmos e combinações próprias.
   Teto de segurança: se a arena está no limite, o emissor
   reduz a salva em vez de estourar o desempenho.
   ============================================================ */
function dmkRoom(){return game.absMain;}
function dmkCap(){return 500;}
function dmkFull(margin){return ebullets.length>dmkCap()-(margin||0);}
function dmkB(x,y,ang,spd,o){
  o=o||{};
  if(dmkFull(12))return null;
  const b={x:x,y:y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,
    r:o.r||5,c:o.c||'#e6dac4',dmg:o.dmg||11,life:o.life||6};
  if(o.slow)b.slowShot=true;
  if(o.fake)b.fake=true;
  if(o.home){b.home=o.home;b.homeT=o.homeT||3;}
  ebullets.push(b);
  return b;
}
/* CÍRCULO COMPLETO — projéteis distribuídos nos 360°, sem brecha fixa.
   n = quantidade, off = rotação inicial, spd = velocidade base */
function dmkCircle(x,y,n,spd,o){
  o=o||{};
  n=Math.max(6,Math.round(n));
  const step=TAU/n;
  for(let i=0;i<n;i++){
    const a=(o.off||0)+i*step;
    /* círculo alternado: velocidades em camadas */
    const sp=spd*(o.alt?(i%2?o.alt:1):1);
    dmkB(x,y,a,sp,o);
  }
  if(!o.quiet){try{sfx.spit();}catch(e){}}
}
/* X — duas diagonais cruzadas (4 braços a 45° do ângulo dado).
   nPerArm = projéteis por braço; gap central opcional (startDist) */
function dmkX(x,y,ang,nPerArm,spd,o){
  o=o||{};
  const arms=[ang,ang+Math.PI/2,ang+Math.PI,ang+3*Math.PI/2];
  for(const aa of arms){
    for(let i=0;i<nPerArm;i++){
      const d=(o.startDist||0)+i*(o.stepDist||26);
      dmkB(x+Math.cos(aa)*d,y+Math.sin(aa)*d,aa,spd,o);
    }
  }
  if(!o.quiet){try{sfx.spit();}catch(e){}}
}
/* LEQUE angular — salva direcionada com abertura configurável */
function dmkFan(x,y,ang,spread,n,spd,o){
  o=o||{};
  n=Math.max(1,Math.round(n));
  for(let i=0;i<n;i++){
    const a=n===1?ang:ang+spread*((i/(n-1))-.5);
    dmkB(x,y,a,spd,o);
  }
  if(!o.quiet){try{sfx.spit();}catch(e){}}
}
/* v1.5.0 (Parte 3): a guarnição JÁ ESTÁ NA SALA — todos os inimigos da
   fila nascem de uma vez em postos compostos (anéis/canteiros), já com
   spawnT completo. Nada de marca de surgimento nem atraso de entrada. */
function preSpawnRoom(){
  const m=game.absMain;
  const q=game.roomQueue;
  const n=q.length;
  if(!n)return;
  const cx=m.x+m.w/2,cy=m.y+m.h/2;
  const rx=Math.max(90,m.w*.36),ry=Math.max(70,m.h*.36);
  /* postos: anel externo + cruz interna — composição legível, longe da entrada */
  const spots=[];
  const ringN=Math.min(n,Math.max(6,Math.round(n*.65)));
  for(let i=0;i<ringN;i++){
    const a=i/ringN*TAU+.4;
    spots.push({x:clamp(cx+Math.cos(a)*rx,m.x+70,m.x+m.w-70),y:clamp(cy+Math.sin(a)*ry,m.y+64,m.y+m.h-64)});
  }
  const innN=n-ringN;
  for(let i=0;i<innN;i++){
    const a=i/Math.max(1,innN)*TAU+1.1;
    spots.push({x:clamp(cx+Math.cos(a)*rx*.45,m.x+70,m.x+m.w-70),y:clamp(cy+Math.sin(a)*ry*.45,m.y+64,m.y+m.h-64)});
  }
  for(let i=0;i<n;i++){
    const type=q.pop();
    if(!type)break;
    const s=spots[i];
    /* nunca no colo do Thor: empurra postos que caíram perto da entrada */
    let px=s.x,py=s.y;
    if(dist(px,py,player.x,player.y)<170){
      const a=Math.atan2(py-cy,px-cx);
      px=clamp(cx+Math.cos(a)*rx*1.05,m.x+70,m.x+m.w-70);
      py=clamp(cy+Math.sin(a)*ry*1.05,m.y+64,m.y+m.h-64);
    }
    const before=enemies.length;
    spawnEnemy(type,px,py);
    if(enemies.length>before){const e=enemies[enemies.length-1];e.spawnT=1;e.x=px;e.y=py;}
  }
  game.waveState='clearing';game.spawnT=99;
  try{noiseSfx(.5,.04,240,'lowpass');}catch(e){}
}
/* ============ bestiário ============ */
const BESTIARY={
sh:['SOMBRA DESPERTA','a alma mais comum da penumbra. voa torto, morre fácil — e nunca vem sozinha.'],
br:['BRUTAMONTE','carne densa do primeiro círculo. lento, mas um tapa dele atravessa cachorro.'],
sp:['CUSPEDOR','cospe brasas à distância e recua quando thor chega perto.'],
fs:['FEITICEIRO DE GELO','ergue cristais e atira estilhaços gelados. gosta de flutuar longe.'],
ru:['ESPECTRO VELOZ','teleporta e investe em linha reta. pisca antes de partir.'],
ce:['CEIFADOR','ceifa almas com a foice curva. ao cair, solta uma roda de brasas.'],
gd:['GRÃO-DE-OSSOS','o mais duro dos comuns. vomita sombras ao morrer.'],
al:['ALMA PERDIDA','chama pálida que só quer um abraço. queima quem abraça.'],
es:['ESPECTRO','aparece do nada perto de thor e cospe uma alma que persegue.'],
la:['LAMENTADORA','chora anéis de lágrimas geladas. nunca para de se mover.'],
cr:['CORRUPIÃO','enxame de almas sujas. ao cair, divide-se em dois.'],
crs:['CORRUPIÃO-MENOR','fragmento veloz do enxame. pouco, mas incansável.'],
vg:['VIGIA','olho flutuante. mira com linha dourada e dispara três tiros.'],
pg:['PEREGRINO CINZENTO','tanque lento com uma lanterna acesa. pulsa anéis de fogo.'],
fa:['FAISCA-FANTASMA','esquiva em linha reta, deixando brasas no rastro.'],
mf:['MORCEGO FLAMEJANTE','ninhada que nasceu onde o chão rachou. o clarão telegrafa o bote — e ele cospe brasa de longe.'],
pn:['PEÃO DO REI','soldado de xadrez do velho rei. marcha em fila.'],
puppy:['CÃOZINHO DO CÉRBERO','filhote cuspidor invocado pelo guardião.'],
mb:['O BRUXO DA PENUMBRA','senhor de mapa. dezesseis feitiços e um pacto antigo com os espelhos.'],
ex:['O CARRASCO DA PENUMBRA','senhor de mapa. o machado dele já cumpriu sentenças mais antigas que os círculos.'],
vi:['A VIÚVA DA PENUMBRA','senhora de mapa. tece com as almas que nunca pagaram o pedágio.'],
gz:['O GOLEM DE CINZAS','senhor de mapa. cinza viva dos corpos fundidos no Primeiro Fogo.'],
rk:['O VELHO REI DO XADREZ','sentença secreta. conhece thor de outro tempo e joga com os mortos. na fase II, seis dele.'],
e404:['ERRO 404','anomalia anterior à hierarquia. nem os demônios sabem o nome dele. deletá-lo desperta algo.'],
/* ==== v0.9.13: variações de elite — mais bullet hell nos círculos ==== */
shE:['SOMBRA ANCIÃ','uma sombra que já morreu antes. maior, mais rápida e não sabe parar.'],
brE:['BRUTAMONTE PODRE','carne em decomposição que insiste. o tapa dele agora atravessa dois cachorros.'],
spE:['CUSPEDOR CEGO','cospe sem mirar — e por isso cospe o tempo inteiro.'],
fsE:['FEITICEIRO RASGADO','o manto rasgado solta estilhaços quase sem pausa.'],
ceE:['CEIFA NEGRA','a foice curva ronca no ar. ao cair, o anel de brasas dobra.'],
gdE:['OSSO-SANTO','relicário ambulante. vomita mais sombras do que deveria existir.'],
vgE:['VIGIA TRIPLO','não pisca. não espera. os três tiros vêm cedo demais.'],
crE:['ENXAME ABISSAL','quando se divide, são três fomes em vez de duas.']
};
/* ============ inimigos ============ */
/* v0.9.16: KAIZO é um TÍTULO, não o nome — "KAIZO — [nome real do boss]" */
function miniDisplayName(t,kaizo,neo){return neo?('NEO — '+(MINI_NAMES[t]||'MINI-CHEFE')):kaizo?('KAIZO — '+(MINI_NAMES[t]||'MINI-CHEFE')):(MINI_NAMES[t]||'MINI-CHEFE');}
function miniDisplayColor(t,kaizo,neo){return(neo||kaizo)?'#eef2f4':(MINI_COLORS[t]||'#cfd8dc');}
function spawnMarkAt(type,x,y,big,kaizo,hpMul){
if(x===undefined){
const m=game.absMain;
x=lerp(m.x+70,m.x+m.w-70,Math.random());
y=lerp(m.y+70,m.y+m.h-70,Math.random());
}
const p=roomPt(x,y,36);
spawnMarks.push({x:p.x,y:p.y,type:type,t:0,dur:big?1.2:.75,big:big,kaizo:!!kaizo,_hpMul:hpMul||1});
}
function spawnEnemy(type,x,y,kaizo,hpMul){
const c=game.threat;
if(!META.seen[type]){META.seen[type]=1;saveMeta();}
const e={x:x,y:y,type:type,flash:0,spawnT:0,ang:rnd(TAU),seed:rnd(10),hitT:0,dead:false,slowT:0,burnT:0,poisT:0,poisD:0,poisStack:0,burnD:0};
/* v0.9.1: inimigos normais do começo com menos vida e spawn */
if(type==='sh'){e.r=13;e.hp=7+c*2;e.sp=(game.hard?124:112)+c*4;} /* v1.9.0: menos velocidade bruta */
else if(type==='br'){e.r=24;e.hp=38+c*6;e.sp=(game.hard?64:55)+c*2;}
else if(type==='sp'){e.r=12;e.hp=11+c*2;e.sp=game.hard?95:82;e.shootT=rnd(1.4,2.6);e.charge=0;e.burst=0;}
else if(type==='fs'){e.r=13;e.hp=14+c*2;e.sp=game.hard?80:70;e.shootT=rnd(1.6,2.8);e.charge=0;e.burst=0;}
else if(type==='ru'){e.r=11;e.hp=10+c*2;e.sp=game.hard?106:95;e.dashCd=rnd(.5,1.5);e.teleT=0;e.dashT=0;e.dashA=0;}
else if(type==='ce'){e.r=17;e.hp=28+c*4;e.sp=game.hard?66:58;}
else if(type==='gd'){e.r=26;e.hp=50+c*6;e.sp=game.hard?46:38;}
else if(type==='al'){e.r=9;e.hp=6+c;e.sp=58+c*3;}
else if(type==='es'){e.r=15;e.hp=20+c*4;e.sp=44;e.tpT=rnd(2.2,3.6);}
else if(type==='la'){e.r=13;e.hp=17+c*3;e.sp=34;e.cryT=rnd(1.8,3);}
else if(type==='cr'){e.r=13;e.hp=8+c*2;e.sp=(game.hard?136:124)+c*2;} /* v1.9.0: perseguidores menos velozes, mais legíveis */
else if(type==='crs'){e.r=7;e.hp=4+c;e.sp=(game.hard?168:150)+c*2;} /* v1.9.0: os menores também respiram */
else if(type==='vg'){e.r=14;e.hp=18+c*3;e.sp=30;e.aimT=rnd(1.5,2.5);e.aimA=0;}
else if(type==='pg'){e.r=20;e.hp=55+c*7;e.sp=22;e.pulseT=rnd(2,3.2);}
else if(type==='fa'){e.r=12;e.hp=13+c*2;e.sp=60;e.restT=0;e.dashT=0;e.dashA=0;}
else if(type==='mf'){e.r=14;e.hp=18+c*3;e.sp=game.hard?100:88;e.restT=rnd(.8,1.6);e.diveT=0;e.diveA=0;e.wob=rnd(TAU);e.spitT=rnd(2.2,3.4);e.teleT=0;} /* v1.3.3: MORCEGO FLAMEJANTE */
else if(type==='pn'){e.r=10;e.hp=10+c*2;e.sp=52+c*2;}
else if(type==='mb'){e.r=26;e.hp=game.hard?700:420;e.maxHp=e.hp;e.sp=game.hard?92:74;e.st='float';e.stT=0;e.atkT=game.hard?1.2:2;e.patIdx=-1;e.pat=null;e.data=null;}
else if(type==='ex'){e.r=28;e.hp=game.hard?880:520;e.maxHp=e.hp;e.sp=game.hard?70:52;e.st='float';e.stT=0;e.atkT=2;e.patIdx=-1;e.pat=null;e.data=null;e.dashT=0;e.dashA=0;}
else if(type==='vi'){e.r=25;e.hp=Math.round((game.hard?620:380)+c*20);e.maxHp=e.hp;e.sp=game.hard?96:82;e.st='float';e.stT=0;e.atkT=1.6;e.patIdx=-1;e.pat=null;e.data=null;e.dashT=0;e.dashA=0;}
else if(type==='gz'){e.r=32;e.hp=Math.round((game.hard?980:600)+c*30);e.maxHp=e.hp;e.sp=game.hard?44:36;e.st='float';e.stT=0;e.atkT=2;e.patIdx=-1;e.pat=null;e.data=null;e.dashT=0;e.dashA=0;}
else if(type==='rk'){
e.r=34;e.hp=Math.round((game.hard?1.55:1)*(3400+c*80));e.maxHp=e.hp;e.p2=false;
e.sp=game.hard?52:40;e.st='float';e.stT=0;e.atkT=1.8;e.patIdx=-1;e.pat=null;e.data=null;e.dashT=0;e.dashA=0;
e.pats=RK_PATS.slice();
}
else if(type==='rkm'){
e.r=30;e.hp=Math.round((game.hard?460:300)+c*8);e.maxHp=e.hp;
e.sp=(game.hard?78:64);e.st='float';e.stT=0;e.atkT=rnd(1.2,2.2);e.patIdx=-1;e.pat=null;e.data=null;e.dashT=0;e.dashA=0;
e.pats=['peoes','bispo','rainha','grade','damas'];
}
else if(type==='e404'){
e.r=40;e.hp=Math.round((game.hard?1.35:1)*(6800+c*190));e.maxHp=e.hp;e.sp=game.hard?142:124;
e.st='float';e.stT=0;e.atkT=1.6;e.patIdx=-1;e.pat=null;e.data=null;e.dashT=0;e.dashA=0;
e.pats=E404_PATS.slice();
}
/* ==== CAVALEIROS DO APOCALIPSE — bosses secretos do endgame ==== */
else if(type==='cw1'){
/* CAVALEIRO BRANCO — CONQUISTA. Muito HP, duas fases, Triunfo de coletar corações. */
e.r=38;e.hp=Math.round(8200+c*180);e.maxHp=e.hp;e.sp=game.hard?94:78;
e.st='float';e.stT=0;e.atkT=1.4;e.patIdx=-1;e.pat=null;e.data=null;e.dashT=0;e.dashA=0;
e.p2=false;e.weapon='sword';e.weaponSwapT=0;e.horseHp=Math.round(2200+c*40);e.horseMaxHp=e.horseHp;
e.pats=CW1_PATS.slice();
}
else if(type==='cw2'){
/* CAVALEIRO VERMELHO — GUERRA. Foco em projéteis e armas invocadas. */
e.r=40;e.hp=Math.round(8600+c*200);e.maxHp=e.hp;e.sp=game.hard?88:72;
e.st='float';e.stT=0;e.atkT=1.2;e.patIdx=-1;e.pat=null;e.data=null;e.dashT=0;e.dashA=0;
e.p2=false;e.horseHp=Math.round(2400+c*44);e.horseMaxHp=e.horseHp;
e.pats=CW2_PATS.slice();
}
else if(type==='cw3'){
/* CAVALEIRO PRETO — FOME. Mecânica de Devoração (engole Thor e copia poderes). */
e.r=42;e.hp=Math.round(9000+c*220);e.maxHp=e.hp;e.sp=game.hard?86:70;
e.st='float';e.stT=0;e.atkT=1.5;e.patIdx=-1;e.pat=null;e.data=null;e.dashT=0;e.dashA=0;
e.p2=false;e.horseHp=Math.round(2600+c*50);e.horseMaxHp=e.horseHp;
e.copied=[];e.devourT=0;e.scaleAng=0;e.pats=CW3_PATS.slice();
}
else if(type==='cw4'){
/* CAVALEIRO DESCORADO — MORTE. O mais difícil. Hitkills com sinais claros. */
e.r=40;e.hp=Math.round(9800+c*240);e.maxHp=e.hp;e.sp=game.hard?110:90;
e.st='float';e.stT=0;e.atkT=1.0;e.patIdx=-1;e.pat=null;e.data=null;e.dashT=0;e.dashA=0;
e.p2=false;e.horseHp=Math.round(2800+c*60);e.horseMaxHp=e.horseHp;
e.pats=CW4_PATS.slice();
}
/* v0.9.7: O OBSERVADOR — boss secreto do andar 5. Olho gigante que teletransporta
   e dispara padrões de projéteis. Quando mata o jogador, o jogo fecha e abre um link. */
else if(type==='observer'){
e.r=44;e.hp=Math.round((game.hard?14000:10000)+c*200);e.maxHp=e.hp;
e.sp=game.hard?60:48;e.st='idle';e.stT=0;e.atqT=2;e.patIdx=-1;e.pat=null;e.data=null;e.bobPh=rnd(TAU);
e.flash=0;
e.pats=['eye_stare','eye_barrage','eye_teleport','eye_rain','eye_laser','eye_mines'];
}
else{e.r=10;e.hp=10;e.sp=game.hard?245:210;}
/* ==== v0.9.14: KAIZO = a versão do MODO ABISMO. O boss de mapa que repete na
   run vem, mesmo em run normal, com os STATS BASE do hardmode — e por cima
   ganha +60% vida, +18% velocidade e ataques 28% mais rápidos. ==== */
if(kaizo&&(type==='mb'||type==='ex'||type==='vi'||type==='gz')){
e.kaizo=true;
/* v1.5.1: a versão NEO — o boss que REPETIU na run. Ataques quase spam:
   cadência curta, tiros 30% mais rápidos, encadeamento de padrões. */
const _rm=game.mapRooms&&game.mapRooms[game.roomIdx];
e._neo=!!(_rm&&_rm.kind==='miniboss'&&_rm.miniType===type&&_rm._neo);
if(!game.hard){
if(type==='mb'){e.hp=700;e.sp=92;if(e.atkT)e.atkT=1.2;}
else if(type==='ex'){e.hp=880;e.sp=70;}
else if(type==='vi'){e.hp=Math.round(620+c*20);e.sp=96;}
else{e.hp=Math.round(980+c*30);e.sp=44;}
if(e.maxHp)e.maxHp=e.hp;
}
e.hp=Math.round(e.hp*1.6);e.sp=Math.round(e.sp*1.18);
if(e.maxHp)e.maxHp=e.hp;
if(e.atkT)e.atkT*=.72;
if(e._neo){e.hp=Math.round(e.hp*1.15);if(e.maxHp)e.maxHp=e.hp;e.sp=Math.round(e.sp*1.1);if(e.atkT)e.atkT*=.55;}
}
/* v1.6.4: A CORTE DUPLA — o gêmeo nasce com 80% da vida (dois senhores na mesma arena) */
if(hpMul&&e.hp){e.hp=Math.max(1,Math.round(e.hp*hpMul));if(e.maxHp)e.maxHp=e.hp;}
/* ==== v0.9.13: VARIAÇÕES DE INIMIGOS (elites) — mais bullet hell nos círculos.
   Elites entram no bestiário com chave tipo+'E', disparam mais rápido
   (timers menores) e têm vida/velocidade/tamanho maiores. ==== */
if(!kaizo&&(type==='sh'||type==='br'||type==='sp'||type==='fs'||type==='ce'||type==='gd'||type==='vg'||type==='cr')){
const eliteCh=(game.floor>=2?.16:.08)+(game.hard?.08:0);
if(Math.random()<eliteCh){
e.elite=true;e.hp=Math.round(e.hp*2.2);e.sp=Math.round(e.sp*1.18);e.r=Math.round(e.r*1.18);
if(e.shootT)e.shootT*=.55;
if(e.aimT)e.aimT*=.6;
if(e.cryT)e.cryT*=.55;
if(e.pulseT)e.pulseT*=.6;
if(!META.seen[type+'E']){META.seen[type+'E']=1;saveMeta();}
}
}
/* ==== v1.0.0: RAROS DA DESCIDA — aparições raras com recompensa garantida.
   VERMELHOS dropam vida na certa; LARANJAS dropam a FAGULHA EXPLOSIVA.
   Nunca aparecem como elite nem em versão kaizo. ==== */
if(!kaizo&&!e.elite&&(type==='sh'||type==='br'||type==='sp'||type==='fs'||type==='ru'||type==='ce'||type==='gd'||type==='al'||type==='es'||type==='la'||type==='cr'||type==='vg'||type==='pg'||type==='fa'||type==='mf')){
const rr=Math.random();
if(rr<.025){e.rare='vida';e.hp=Math.round(e.hp*1.3);if(e.maxHp)e.maxHp=e.hp;}
else if(rr<.05){e.rare='fagulha';e.hp=Math.round(e.hp*1.15);if(e.maxHp)e.maxHp=e.hp;}
}
if(type!=='e404'&&type!=='rk'&&type!=='rkm'&&type!=='cw1'&&type!=='cw2'&&type!=='cw3'&&type!=='cw4'&&type!=='observer'){
const sm=1+(secretMul()-1)*.15;
if(sm!==1){e.hp=Math.max(1,Math.round(e.hp*sm));if(e.maxHp)e.maxHp=e.hp;}
}
if(game.roomEvent&&game.roomEvent.type==='frenzy')e.sp*=1.35;
/* v0.9.6: VENDAVAL — inimigos 30% mais rápidos */
if(game.up.vendaval)e.sp*=1.3;
/* v0.9.6: GANÂNCIA — inimigos têm 40% mais vida */
if(game.greed){e.hp=Math.round(e.hp*1.4);if(e.maxHp)e.maxHp=e.hp;}
/* v0.9.9: salas de desafio ficam MUITO mais difíceis por andar (+22% vida/andar) */
if(game.roomKind==='challenge'&&!e.maxHp&&e.hp){e.hp=Math.round(e.hp*(1+.22*(game.floor-1)));}
enemies.push(e);
}
const MINI_NAMES={mb:'O BRUXO DA PENUMBRA',ex:'O CARRASCO DA PENUMBRA',vi:'A VIÚVA DA PENUMBRA',gz:'O GOLEM DE CINZAS'};
const MINI_COLORS={mb:'#cfd8dc',ex:'#e8455a',vi:'#9d6bb5',gz:'#ff8f3d'};
/* v0.9.3: dropa uma bênção/upgrade aleatória com raridade variável.
   v0.9.9: curve='peito' (baús) — itens bons são mais raros, mas o baú SEMPRE
   materializa algo (cai um tier se o pool estiver vazio ou não couber). */
function dropRandomBlessing(x,y,curve){
  /* v0.9.13: MODO PENUMBRA — nenhuma bênção cai; almas no lugar */
  if(game.noBless){
    const nP=12+irnd(0,10);
    for(let i=0;i<nP;i++)pickups.push({type:'soul',x:x+rnd(-26,26),y:y+rnd(-26,26),t:0,ph:rnd(TAU)});
    texts.push({x:x,y:y-20,txt:'O PACTO SE DISSOLVE — ALMAS',t:0,life:1.4,c:'#c9a0ff',size:11,disp:true});
    sfx.echo();
    return;
  }
  const roll=Math.random()*(window.__RM_lieBias?window.__RM_lieBias():1); /* v1.4.0: FAVOR DA MENTIRA */
  const T=curve==='peito'?[.40,.72,.92]:[.50,.80,.95];
  let dropType,dropId,rarity;
  const tryTier=(minQ,maxQ)=>{const pool=UPGRADES.filter(u=>u.q>=minQ&&u.q<=maxQ&&u.can());if(pool.length){let _pl=window.__GRI&&window.__GRI.dropOk?pool.filter(u=>window.__GRI.dropOk(u,minQ)):pool;const u=pick(_pl.length?_pl:pool);dropType='upgrade';dropId=u.id;rarity=minQ>=5?'épico':minQ>=3?'raro':'comum';return true;}return false;}; /* v1.9.0: pactos raros no chão, feixes só no épico+ */
  if(roll<T[0]){
    /* comum (q1-2) */
    if(!tryTier(1,2))tryTier(3,4)||tryTier(5,6);
  }else if(roll<T[1]){
    /* raro (q3-4) */
    if(!tryTier(3,4))tryTier(5,6)||tryTier(1,2);
  }else if(roll<T[2]){
    /* épico (q5-6) */
    if(!tryTier(5,6))tryTier(3,4)||tryTier(1,2);
  }else{
    /* lendário — item ativo aleatório; se não couber, cai para épico/raro */
    const activeIds=Object.keys(ACTIVE_ITEMS);
    if(activeIds.length&&(!game.activeItem||Math.random()<.5)){
      dropType='active';dropId=pick(activeIds);rarity='lendário';
    }else if(!tryTier(5,6))tryTier(3,4)||tryTier(1,2);
  }
  if(dropType){
    pickups.push({type:'blessing_drop',dropType:dropType,dropId:dropId,rarity:rarity,x:x,y:y,t:0,ph:rnd(TAU)});
    /* v0.9.13: no chão aparece o NOME do item com a cor da raridade */
    const dn=dropType==='active'?(ACTIVE_ITEMS[dropId]?ACTIVE_ITEMS[dropId].name:'ITEM ATIVO'):((UPGRADES.find(u=>u.id===dropId)||{}).name||'BÊNÇÃO');
    texts.push({x:x,y:y-20,txt:dn,t:0,life:1.6,c:rarity==='pacto'?'#9d6bb5':rarity==='lendário'?'#c9a0ff':rarity==='épico'?'#ffd9a0':rarity==='raro'?'#bfd8e8':'#e6dac4',size:12,disp:true});
    sfx.echo();
  }
}
/* ==== v1.2.0: BUTIM DO BAÚ — só fagulha, coração ou almas (sem bênção) ==== */
function dropChestLoot(x,y){
const roll=Math.random();
const nP=10+irnd(0,9);
for(let i=0;i<nP;i++)pickups.push({type:'soul',x:x+rnd(-30,30),y:y+rnd(-24,24),t:0,ph:rnd(TAU)});
if(roll<.38){
pickups.push({type:'heart',x:x+rnd(-14,14),y:y-20,t:0,ph:rnd(TAU)});
texts.push({x:x,y:y-40,txt:'CORAÇÃO',t:0,life:1.2,c:'#d9465a',size:12,disp:true});
}else if(roll<.74){
game.fagulha=(game.fagulha||0)+1;
texts.push({x:x,y:y-40,txt:'FAGULHA ×'+game.fagulha+' · [Q]',t:0,life:1.3,c:'#ff8f3d',size:12,disp:true});
sparks(x,y,'#ff8f3d',12,180,.6,3,true);
}else{
for(let i=0;i<12;i++)pickups.push({type:'soul',x:x+rnd(-34,34),y:y+rnd(-28,28),t:0,ph:rnd(TAU)});
texts.push({x:x,y:y-40,txt:'CHUVA DE ALMAS',t:0,life:1.2,c:'#bfd8e8',size:12,disp:true});
}
try{sfx.soul();sfx.levelup();}catch(e){}
game.flash=Math.max(game.flash,.18);
}
function killEnemy(e){
if(e.dead)return;
/* v1.1.0: SENTENÇAS — a GULA cresce comendo; a INVEJA toma almas alheias */
if(game.sinGula){game.sinGulaK=(game.sinGulaK||0)+1;
if(game.sinGulaK>=15&&(game.sinGulaHp||0)<75){game.sinGulaK=0;game.sinGulaHp=(game.sinGulaHp||0)+5;player.maxHp+=5;player.hp+=5;}}
if(game.sinInvidia)gainSouls(3);
e.dead=true;game.kills++;META.kills++;conqTick();
if(window.__EXPANSION)window.__EXPANSION.onKill(e); /* v1.3.0 */
if(window.__GRI)window.__GRI.onKill(e); /* v1.9.0: O GRIMÓRIO DAS CEM ALMAS */
/* v0.9.16: contagem de KAIZO para conquistas */
if(e.kaizo){game.kaizoKills++;META.kaizoKills=(META.kaizoKills||0)+1;saveMeta();}
/* ===== v0.9.16: ESPECIALIZAÇÕES — efeitos no momento do abate ===== */
if(!e._noSpecFx){
/* BRUXA DO GELO: congelado morre → estilhaços gélidos retardam os vizinhos */
if(game.specGelo&&e.slowT>0){
sparks(e.x,e.y,'#cfe9ff',16,260,.7,4,true);sfx.freeze();
for(const o of enemies){
if(o.dead||o===e||o.spawnT<.5)continue;
if(dist(e.x,e.y,o.x,o.y)<120){o.slowT=Math.max(o.slowT,2.2);sparks(o.x,o.y,'#9fd8ff',4,120,.4,2.5,true);}
}
}
/* FILHO DAS CHAMAS: queimado morre → detona e incendeia os vizinhos */
if(game.specFogo&&e.burnT>0){
sparks(e.x,e.y,'#ff8f3d',18,300,.8,4,true);sfx.boom();
for(const o of enemies){
if(o.dead||o===e||o.spawnT<.5)continue;
if(dist(e.x,e.y,o.x,o.y)<110){o.burnT=Math.max(o.burnT||0,2);o.burnD=Math.max(o.burnD||0,2.6*P.dmgMult);}
}
}
/* CÁLICE DA PESTE: envenenado morre → nuvem tóxica contamina os vivos */
if(game.specVeneno&&e.poisT>0){
for(let i=0;i<10;i++)particles.push({x:e.x+rnd(-20,20),y:e.y+rnd(-14,14),vx:rnd(-24,24),vy:rnd(-50,-14),life:rnd(.5,.9),t:0,r:rnd(3,6),c:'rgba(168,194,79,.55)',drag:1.1,glow:true});
for(const o of enemies){
if(o.dead||o===e||o.spawnT<.5)continue;
if(dist(e.x,e.y,o.x,o.y)<115){o.poisT=Math.max(o.poisT||0,3);o.poisD=Math.max(o.poisD||0,1.6*P.dmgMult);o.poisStack=(o.poisStack||0)+1;}
}
}
/* MIASMA PROFUNDO (sinergia veneno+trevas): idem, menor */
if(game.psyn.miasma2&&e.poisT>0&&!game.specVeneno){
for(const o of enemies){
if(o.dead||o===e||o.spawnT<.5)continue;
if(dist(e.x,e.y,o.x,o.y)<85){o.poisT=Math.max(o.poisT||0,2.2);o.poisD=Math.max(o.poisD||0,1.2*P.dmgMult);}
}
}
/* VOZ DA TEMPESTADE: cada abate chama um relâmpago */
if(game.specRaio&&!e._brood){
bolts.push({x:e.x,y:e.y,t:0,life:.28,seed:rnd(10)});
const ld=42*P.dmgMult;
for(const o of enemies){
if(o.dead||o===e||o.spawnT<.5)continue;
if(dist(e.x,e.y,o.x,o.y)<90){
if(!shadowInvuln(o)&&!knightRedirectHorse(o,ld)){o.hp-=ld;o.flash=.15;volatilCheck(o);if(o.hp<=0)killEnemy(o);}
}
}
sfx.thunder();
}
/* SENHOR DO SANGUE: abates curam 2 */
if(game.specSangue&&!player.dead&&player.hp<player.maxHp){
player.hp=Math.min(player.maxHp,player.hp+2);
}
/* FILHO DA FERA: devorar restaura vida aos poucos */
if(game.specFera&&game.hasBite&&!player.dead&&player.hp<player.maxHp){
player.hp=Math.min(player.maxHp,player.hp+1);
}
/* CAMPEÃO DA GUERRA: a cada 15 abates, +4% de dano */
if(game.specGuerra){
game.warK=(game.warK||0)+1;
if(game.warK>=15){
game.warK=0;P.dmgMult*=1.04;
texts.push({x:player.x,y:player.y-36,txt:'A GUERRA TE FORJA +4%',t:0,life:1.0,c:'#d9465a',size:11,disp:true});
}
}
}
/* v0.9.9: FRAGMENTO DO ERRO — escudo reergue a cada 25 abates */
if(game.relicShard&&!game.relicShieldUp){
game.relicShieldK++;
if(game.relicShieldK>=25){
game.relicShieldK=0;game.relicShieldUp=true;
texts.push({x:player.x,y:player.y-38,txt:'ESCUDO REERGUOU',t:0,life:1.2,c:'#4ff5ff',size:11,disp:true});
sfx.levelup();
}
}
if(e.type==='rk'){
sfx.kill();
game.shake=22;game.flash=.5;game.hitstop=.18;
sfx.explode();sfx.headDie();
sparks(e.x,e.y,'#d8cfc0',30,320,.9,4,true);
sparks(e.x,e.y,'#ffd9a0',18,260,.7,3,true);
game.reiFought=true;
for(const o of enemies)if(o.type==='rkm')o.dead=true;
game.rkP2=false;game.rkUlt=null;
game.state='reideath';game.reiT=0;game.reiX=e.x;game.reiY=e.y;
bullets=[];ebullets=[];rings=[];geyserMarks=[];spawnMarks=[];shockwaves=[];enemies=[];
thrownSaw=null;lightBeam=null;
for(let i=0;i<12;i++)pickups.push({type:'soul',x:e.x+rnd(-30,30),y:e.y+rnd(-30,30),t:0,ph:rnd(TAU)});
return;
}
/* ==== Cavaleiros do Apocalipse: ao cair, saltam para a cutscene de morte ==== */
if(e.type==='cw1'||e.type==='cw2'||e.type==='cw3'||e.type==='cw4'){
const which={cw1:'conquest',cw2:'war',cw3:'famine',cw4:'death'}[e.type];
sfx.kill();sfx.explode();sfx.headDie();
game.shake=28;game.flash=.7;game.hitstop=.3;
const col={cw1:'#e6dac4',cw2:'#d9465a',cw3:'#5a4a55',cw4:'#c9a44c'}[e.type];
sparks(e.x,e.y,col,40,360,1.0,5,true);
sparks(e.x,e.y,'#ffd9a0',24,280,.7,3.5,true);
game.knightDead=which;game.knightX=e.x;game.knightY=e.y;game.knightT=0;game.knightTriunfo=e.triunfo;
META.knights[which]++;saveMeta();
game.state='knightdeath';
bullets=[];ebullets=[];rings=[];geyserMarks=[];spawnMarks=[];shockwaves=[];enemies=[];
thrownSaw=null;lightBeam=null;
for(let i=0;i<20;i++)pickups.push({type:'soul',x:e.x+rnd(-40,40),y:e.y+rnd(-40,40),t:0,ph:rnd(TAU)});
return;
}
/* ==== v0.9.7: O OBSERVADOR — ao cair, abre um portal para a próxima descida ==== */
if(e.type==='observer'){
sfx.kill();sfx.explode();sfx.headDie();
game.shake=24;game.flash=.6;game.hitstop=.22;
sparks(e.x,e.y,'#ff4fd8',36,360,1.0,5,true);
sparks(e.x,e.y,'#c9a0ff',24,300,.8,4,true);
sparks(e.x,e.y,'#f2f0ea',18,260,.7,3.5,true);
ebullets=[];
game.banner={type:'boss',txt:'O OBSERVADOR FOI DESTRUÍDO',sub:'o olho fechou. um portal se abre.',t:0,dur:3.0};
pickups.push({type:'heart',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
pickups.push({type:'heart',x:e.x+34,y:e.y+12,t:0,ph:rnd(TAU)});
for(let i=0;i<20;i++)pickups.push({type:'soul',x:e.x+rnd(-40,40),y:e.y+rnd(-40,40),t:0,ph:rnd(TAU)});
/* abre um portal no centro da arena — leva à próxima descida */
game.portal={x:W/2,y:H*.42,t:0};
return;
}
sfx.kill();
sparks(e.x,e.y,'#3a1a22',10,190,.55,3.5);
sparks(e.x,e.y,'#5a2430',5,120,.7,5);
let nS=(e.type==='br'||e.type==='ce')?3:(e.type==='sp'||e.type==='fs')?2:irnd(1,2);
if(e.type==='al')nS=3;
if(e.type==='es')nS=4;
if(e.type==='la')nS=3;
if(e.type==='cr'){nS=2;const nCr=e.elite?3:2;for(let i=0;i<nCr;i++)spawnMarkAt('crs',e.x+rnd(-18,18),e.y+rnd(-18,18));}
if(e.type==='crs')nS=1;
if(e.type==='vg')nS=2;
if(e.type==='fa')nS=2;
if(e.type==='mf')nS=2;
if(e.type==='pg')nS=4;
if(e.type==='pn')nS=1;
if(e.type==='gd'){
const nSh=(game.hard?3:2)+(e.elite?2:0);
for(let i=0;i<nSh;i++)spawnMarkAt('sh',e.x+rnd(-30,30),e.y+rnd(-30,30));
nS=5;
}
if(e.type==='ce'){
const nb=game.hard?16:10,vs=game.hard?230:175;
for(let i=0;i<nb;i++){const a=i/nb*TAU;ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*vs,vy:Math.sin(a)*vs,r:5,c:'#cfd8dc'});}
sfx.spit();
}
if(e.type==='mb'||e.type==='ex'||e.type==='vi'||e.type==='gz'){
nS=14;
game.shake=18;game.flash=.4;game.hitstop=.15;
sfx.explode();sfx.roar();
sparks(e.x,e.y,MINI_COLORS[e.type]||'#cfd8dc',30,340,1,4,true);
pickups.push({type:'heart',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
/* v0.9.3: dropa uma bênção/upgrade aleatória ao derrotar um miniboss */
dropRandomBlessing(e.x,e.y-40);
if(Math.random()<.25)pickups.push({type:'chest',x:e.x,y:e.y-80,t:0,ph:rnd(TAU)});
}
if(e.type==='e404'){
nS=26;
game.shake=26;game.flash=.65;game.hitstop=.22;
META.e404++;saveMeta();
sfx.explode();sfx.headDie();sfx.roar();
sparks(e.x,e.y,'#f2f0ea',34,380,1,4,true);
sparks(e.x,e.y,'#ff4fd8',20,300,.85,3.5,true);
sparks(e.x,e.y,'#4ff5ff',12,240,.6,3,true);
game.banner={type:'small',txt:'ERRO 404 FOI DELETADO',sub:'aquilo que os registros apagaram desperta no vazio...',t:0,dur:2.6};
pickups.push({type:'heart',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
pickups.push({type:'heart',x:e.x+34,y:e.y+12,t:0,ph:rnd(TAU)});
if(Math.random()<.22)pickups.push({type:'chest',x:e.x,y:e.y-44,t:0,ph:rnd(TAU)});
}
nS=Math.round(nS*evDropMul());
/* poderes únicos (3 bênçãos do mesmo tipo) */
if(game.synInverno&&e.slowT>0){
sparks(e.x,e.y,'#9fd8ff',16,250,.6,3.5,true);sfx.freeze();game.flash=Math.max(game.flash,.14);
for(const o of enemies){
if(o.dead||o===e||o.spawnT<.5)continue;
if(dist(e.x,e.y,o.x,o.y)<88+e.r){
o.hp-=9*P.dmgMult;o.flash=.12;o.slowT=Math.max(o.slowT,1.2);
sparks(o.x,o.y,'#9fd8ff',4,140,.4,2.5,true);
if(o.hp<=0)killEnemy(o);
}
}
}
if(game.synMuspel&&e.burnT>0){
sparks(e.x,e.y,'#ff8f3d',14,240,.55,3.5,true);sfx.explode();
explodeAt(e.x,e.y,88,8*P.dmgMult);
}
if(game.synSerpente&&e.poisT>0){
let sn=0;
for(const o of enemies){
if(o.dead||o===e||o.spawnT<.5||o.poisT>0)continue;
if(dist(e.x,e.y,o.x,o.y)<130){
o.poisT=3.5;o.poisD=2.2*P.dmgMult;sn++;
sparks(o.x,o.y,'#a8c24f',5,130,.45,2.5,true);
if(sn>=3)break;
}
}
}
/* v0.9.6: drops de almas mais escassos e variados — só inimigos normais.
   25% coração+almas, 25% só almas (reduzidas), 25% só coração, 25% nada.
   Bosses mantêm o comportamento antigo. */
const isBoss=e.type==='mb'||e.type==='ex'||e.type==='vi'||e.type==='gz'||e.type==='e404'||e.type==='rkm';
const dropRoll=Math.random();
if(isBoss){
  /* bosses mantêm o comportamento antigo (15% coração, 45% almas, 40% nada) */
  if(dropRoll<.15){
    pickups.push({type:'heart',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
  }else if(dropRoll<.60){
    const reducedNS=Math.max(1,Math.round(nS*0.6));
    for(let i=0;i<reducedNS;i++)pickups.push({type:'soul',x:e.x+rnd(-18,18),y:e.y+rnd(-18,18),t:0,ph:rnd(TAU)});
  }
}else{
  /* v1.0.0: drops refeitos — a vida ficou MAIS RARA no chão (50% → ~16%), e os
     RAROS garantem o deles: vermelhos soltam coração, laranjas soltam a
     FAGULHA EXPLOSIVA. Almas continuam como fonte principal. */
  const reducedNS=Math.max(1,Math.round(nS*0.6));
  if(e.rare==='vida'){
    pickups.push({type:'heart',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
    for(let i=0;i<reducedNS;i++)pickups.push({type:'soul',x:e.x+rnd(-18,18),y:e.y+rnd(-18,18),t:0,ph:rnd(TAU)});
    texts.push({x:e.x,y:e.y-30,txt:'RARO — VIDA',t:0,life:1.2,c:'#d9465a',size:11,disp:true});
  }else if(e.rare==='fagulha'){
    pickups.push({type:'fagulha',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
    for(let i=0;i<reducedNS;i++)pickups.push({type:'soul',x:e.x+rnd(-18,18),y:e.y+rnd(-18,18),t:0,ph:rnd(TAU)});
    texts.push({x:e.x,y:e.y-30,txt:'RARO — FAGULHA',t:0,life:1.2,c:'#ff8f3d',size:11,disp:true});
  }else if(dropRoll<.08){
    /* 8% — coração + almas */
    pickups.push({type:'heart',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
    for(let i=0;i<reducedNS;i++)pickups.push({type:'soul',x:e.x+rnd(-18,18),y:e.y+rnd(-18,18),t:0,ph:rnd(TAU)});
  }else if(dropRoll<.48){
    /* 40% — só almas (reduzidas) */
    for(let i=0;i<reducedNS;i++)pickups.push({type:'soul',x:e.x+rnd(-18,18),y:e.y+rnd(-18,18),t:0,ph:rnd(TAU)});
  }else if(dropRoll<.56){
    /* 8% — só coração */
    pickups.push({type:'heart',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
  }
  /* 44% — nada extra */
}
/* v1.0.0: coração extra ficou mais raro (4% → 2.5%); 2% de fagulha solta em
   inimigos normais — a porta escondida precisa ser descoberta por acaso às vezes */
if(!isBoss&&e.type!=='pn'&&e.type!=='crs'&&e.type!=='puppy'&&game.roomKind!=='challenge'){
if(Math.random()<0.025*evDropMul())pickups.push({type:'heart',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
else if(Math.random()<0.02*evDropMul())pickups.push({type:'fagulha',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
}
if(game.incendio&&e.burnT>0){
let n=0;
for(const o of enemies){
if(o.dead||o===e||o.burnT>0)continue;
if(dist(e.x,e.y,o.x,o.y)<120){
o.burnT=2;o.burnD=e.burnD;n++;
sparks(o.x,o.y,'#ff8f3d',4,120,.4,3,true);
if(n>=2)break;
}
}
}
if(game.miasma&&e.poisT>0){
let bt=null,bd=150;
for(const o of enemies){
if(o.dead||o===e||o.poisT>0)continue;
const d=dist(e.x,e.y,o.x,o.y);
if(d<bd){bd=d;bt=o;}
}
if(bt){bt.poisT=3;bt.poisD=e.poisD;bt.poisStack=2;sparks(bt.x,bt.y,'#a8c24f',5,140,.4,3,true);}
}
if(game.fome&&!player.dead){
game.fomeK++;
if(game.fomeK>=10){
game.fomeK=0;
if(player.hp<player.maxHp){
player.hp=Math.min(player.maxHp,player.hp+25);sfx.heart();
texts.push({x:player.x,y:player.y-30,txt:'+25 HP',t:0,life:1,c:'#d9465a',size:16,disp:true});
}else{
gainSouls(3);
texts.push({x:player.x,y:player.y-30,txt:'+3 ALMAS',t:0,life:1,c:'#bfd8e8',size:14});
}
}
}
}
function fireEnemyShots(e,n,spread,vel,c,r){
const base=Math.atan2(player.y-e.y,player.x-e.x);
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*spread;
ebullets.push({x:e.x+Math.cos(a)*e.r,y:e.y+Math.sin(a)*e.r,vx:Math.cos(a)*vel,vy:Math.sin(a)*vel,r:r,c:c});
}
sfx.spit();
}
/* ========== v0.9.7: O OBSERVADOR — IA e padrões de ataque ========== */
function observerAI(e,dt,a,d,slowMul){
e.bobPh+=dt*1.5;
e.atqT-=dt;
e.flash=Math.max(0,e.flash-dt*4);
e.stT+=dt;
/* flutua lentamente pela arena */
const tx=lerp(W*.25,W*.75,clamp((Math.sin(game.t*.3)+1)*.5,0,1));
const ty=H*.3+Math.sin(game.t*.6)*40;
e.x+=(tx-e.x)*dt*.4;
e.y+=(ty-e.y)*dt*.4;
if(e.st==='idle'&&e.atqT<=0){
  e.patIdx=(e.patIdx+1)%e.pats.length;
  e.pat=e.pats[e.patIdx];
  e.st='tele';e.stT=0;e.data=null;
}
if(e.st==='tele'){
  if(e.stT>=.6){e.st='act';e.stT=0;observerActStart(e);}
}else if(e.st==='act'){
  observerActUpdate(e,dt);
  if(e.stT>=1.8){e.st='idle';e.stT=0;e.atqT=game.hard?1.0:1.6;}
}
/* colisão corpo a corpo */
if(!player.dead&&d<e.r+(player.hitR||player.r)-8){ /* v1.4.6 hitR */
  hurtPlayer();
}
}
/* inicia um padrão de ataque do observador */
function observerActStart(e){
const pat=e.pat;
if(pat==='eye_stare'){
  /* OLHAR FIXO — anel de balas em direção ao jogador */
  e.data={fired:0,ang:Math.atan2(player.y-e.y,player.x-e.x)};
}else if(pat==='eye_barrage'){
  /* BARRAGEM — rajada rápida em leque */
  e.data={fired:0,baseAng:Math.atan2(player.y-e.y,player.x-e.x)};
}else if(pat==='eye_teleport'){
  /* TELEPORTE — some e reaparece perto do jogador, avança em dash */
  e.data={phase:0,tpX:0,tpY:0,dashAng:0,dashT:0,dashVx:0,dashVy:0};
}else if(pat==='eye_rain'){
  /* CHUVA — balas caem do topo mirando o jogador */
  e.data={fired:0};
}else if(pat==='eye_laser'){
  /* LASER — linha de aviso depois feixe de balas */
  e.data={phase:0,ang:Math.atan2(player.y-e.y,player.x-e.x),t:0};
}else if(pat==='eye_mines'){
  /* MINAS — balas lentas que persistem e explodem */
  e.data={fired:0};
}
}
/* atualiza um padrão de ataque do observador */
function observerActUpdate(e,dt){
if(!e.data)return;
const pat=e.pat;
const hard=game.hard;
if(pat==='eye_stare'){
  /* anel de 16 balas mirado no jogador */
  if(e.data.fired===0&&e.stT>=.2){
    e.data.fired=1;
    const n=16;
    const base=e.data.ang;
    for(let i=0;i<n;i++){
      const ang=base+(i/n)*TAU;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*220,vy:Math.sin(ang)*220,r:6,c:'#ff4fd8',dmg:14});
    }
    sfx.spit();game.shake=Math.max(game.shake,5);
    sparks(e.x,e.y,'#ff4fd8',12,200,.4,3,true);
  }
}else if(pat==='eye_barrage'){
  /* 5 rajadas em leque */
  e.data.fired=Math.floor(e.stT/.25);
  const target=hard?7:5;
  if(e.data.fired<=target&&e.stT>=.25*e.data.fired&&e.data.fired>0&&!e.data['s'+e.data.fired]){
    e.data['s'+e.data.fired]=true;
    const n=hard?5:4;
    for(let i=0;i<n;i++){
      const ang=e.data.baseAng+(i-(n-1)/2)*.18;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*300,vy:Math.sin(ang)*300,r:5,c:'#c9a0ff',dmg:11});
    }
    sfx.spit();
  }
}else if(pat==='eye_teleport'){
  if(e.data.phase===0&&e.stT>=.3){
    e.data.phase=1;
    const ang=rnd(TAU);
    e.data.tpX=clamp(player.x+Math.cos(ang)*120,80,W-80);
    e.data.tpY=clamp(player.y+Math.sin(ang)*120,80,H-80);
    sparks(e.x,e.y,'#ff4fd8',20,260,.6,3,true);
    e.x=e.data.tpX;e.y=e.data.tpY;
    sparks(e.x,e.y,'#ff4fd8',20,260,.6,3,true);
    sfx.echo();
  }
  if(e.data.phase===1&&e.stT>=.7){
    e.data.phase=2;
    e.data.dashAng=Math.atan2(player.y-e.y,player.x-e.x);
    e.data.dashVx=Math.cos(e.data.dashAng)*420;
    e.data.dashVy=Math.sin(e.data.dashAng)*420;
    e.data.dashT=.35;
    sfx.roar();
    for(let i=0;i<3;i++){
      const ang2=e.data.dashAng+(i-1)*.1;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang2)*260,vy:Math.sin(ang2)*260,r:5,c:'#ff4fd8',dmg:13});
    }
  }
  if(e.data.dashT>0){
    e.data.dashT-=dt;
    e.x+=e.data.dashVx*dt;e.y+=e.data.dashVy*dt;
    e.x=clamp(e.x,80,W-80);e.y=clamp(e.y,80,H-80);
  }
}else if(pat==='eye_rain'){
  /* chuva de balas do topo — 6 ondas */
  const wave=Math.floor(e.stT/.3);
  if(wave>e.data.fired&&wave<6){
    e.data.fired=wave;
    const count=hard?5:4;
    for(let i=0;i<count;i++){
      const sx=clamp(player.x+rnd(-160,160),40,W-40);
      ebullets.push({x:sx,y:-10,vx:rnd(-30,30),vy:280+rnd(0,60),r:5,c:'#4ff5ff',dmg:12});
    }
    sfx.spit();
  }
}else if(pat==='eye_laser'){
  e.data.t+=dt;
  if(e.data.phase===0&&e.data.t>=.7){
    e.data.phase=1;
    /* dispara feixe de balas na direção travada */
    const n=14;
    for(let i=0;i<n;i++){
      const ang=e.data.ang;
      const sp=300+i*40;
      ebullets.push({x:e.x+Math.cos(ang)*i*22,y:e.y+Math.sin(ang)*i*22,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:5,c:'#ff4fd8',dmg:13});
    }
    sfx.roar();game.shake=Math.max(game.shake,8);
    sparks(e.x,e.y,'#ff4fd8',16,240,.5,3,true);
  }
}else if(pat==='eye_mines'){
  /* 8 minas lentas — balas de movimento lento que explodem ao contato */
  const wave=Math.floor(e.stT/.4);
  if(wave>e.data.fired&&wave<4){
    e.data.fired=wave;
    const n=2;
    for(let i=0;i<n;i++){
      const ang=rnd(TAU);
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*80,vy:Math.sin(ang)*80,r:7,c:'#c9a0ff',dmg:10,slowShot:true});
    }
    sfx.spit();
  }
}
}
function updateEnemies(dt){
game._neoOn=false; /* v1.5.1: NEO — recalculado por frame */
enemies=enemies.filter(e=>!e.dead);
for(const e of enemies){
e.flash-=dt;e.hitT-=dt;
/* v1.5.1: NEO — qualquer mini-chefe repetido: tiros 30% mais rápidos
   (vmul no updateEBullets) e cadência sempre ≤0,62s (quase spam), para TODAS
   as IAs (bruxo, carrasco, viúva, golem) — o cap fala mais alto que o cooldown */
if(e._neo){game._neoOn=true;if(e.atkT>.62)e.atkT=.62;}
if(e.slowT>0)e.slowT-=dt;
if(e.burnT>0){
e.burnT-=dt;
if(!shadowInvuln(e)){e.hp-=e.burnD*dt;}
if(Math.random()<dt*14)particles.push({x:e.x+rnd(-e.r,e.r),y:e.y+rnd(-e.r,e.r),vx:rnd(-10,10),vy:rnd(-90,-40),life:.4,t:0,r:rnd(1.5,3),c:'#ff8f3d',drag:1,glow:true});
if(e.hp<=0){killEnemy(e);continue;}
}
if(e.poisT>0){
e.poisT-=dt;
if(!shadowInvuln(e)){e.hp-=e.poisD*e.poisStack*dt;}
/* v0.9.16 sinergia PRAGA ÍGNEA — a toxina incendeia o corpo por dentro */
if(game.psyn.praga&&e.burnT<=0&&Math.random()<dt*1.6){
e.burnT=1.8;e.burnD=2.2*P.dmgMult;
sparks(e.x,e.y,'#ff8f3d',4,120,.35,2.5,true);
}
if(Math.random()<dt*10)particles.push({x:e.x+rnd(-e.r,e.r),y:e.y+rnd(-e.r,e.r),vx:rnd(-8,8),vy:rnd(-60,-20),life:.5,t:0,r:2,c:'#a8c24f',drag:1,glow:true});
if(e.hp<=0){killEnemy(e);continue;}
}
/* v1.3.2: presa do chicote (credor) — congelada enquanto dura a amarra */
if(window.__EXPANSION&&window.__EXPANSION.enemyBound&&window.__EXPANSION.enemyBound(e,dt))continue;
const slowMul=e.slowT>0?.45:1;
if(e.spawnT<1){e.spawnT+=dt*3.4;continue;}
const a=Math.atan2(player.y-e.y,player.x-e.x);
const d=dist(e.x,e.y,player.x,player.y);
let mx=0,my=0;
if(e.type==='mb'){miniBossAI(e,dt,a,d,slowMul);continue;}
if(e.type==='ex'){carrascoAI(e,dt,a,d,slowMul);continue;}
if(e.type==='vi'){viuvaAI(e,dt,a,d,slowMul);continue;}
if(e.type==='gz'){golemAI(e,dt,a,d,slowMul);continue;}
if(e.type==='rk'||e.type==='rkm'){reiAI(e,dt,a,d,slowMul);continue;}
if(e.type==='e404'){e404AI(e,dt,a,d,slowMul);continue;}
/* v0.9.7: O OBSERVADOR — IA própria */
if(e.type==='observer'){observerAI(e,dt,a,d,slowMul);continue;}
/* v1.3.0: chefes da expansão (Juiz/Ferreiro/Anjo/Serpente/Thor Sombra) */
if(e.xboss&&window.__EXPANSION){window.__EXPANSION.xbossAI(e,dt,a,d,slowMul);continue;}
if(e.type==='cw1'||e.type==='cw2'||e.type==='cw3'||e.type==='cw4'){
cwKnightAI(e,dt,a,d,slowMul);
/* checa triunfo ativo */
const k=knightAny2();
if(k)updateKnightTriumph(dt,k);
continue;
}
if(e.type==='al'){
const wv=Math.sin(game.t*2.2+e.seed)*.7;
mx=Math.cos(a)-Math.sin(a)*wv;my=Math.sin(a)+Math.cos(a)*wv;
if(Math.random()<dt*4)particles.push({x:e.x+rnd(-6,6),y:e.y+rnd(-6,6),vx:rnd(-8,8),vy:rnd(-30,-10),life:.5,t:0,r:1.4,c:'#bfd8e8',glow:true});
}else if(e.type==='es'){
e.tpT-=dt;
if(e.tpT<=0){
e.tpT=rnd(2.4,3.8);
sparks(e.x,e.y,'#bfd8e8',10,160,.5,3,true);
const ang=rnd(TAU),dd=rnd(150,230);
const pt=roomPt(player.x+Math.cos(ang)*dd,player.y+Math.sin(ang)*dd,30);
e.x=pt.x;e.y=pt.y;
sparks(e.x,e.y,'#e6f0f2',12,180,.5,3,true);
blip('sine',700,200,.25,.09);
const ba=Math.atan2(player.y-e.y,player.x-e.x);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*150,vy:Math.sin(ba)*150,r:6,c:'#e6f0f2',home:2,homeT:3});
}
const wv=Math.sin(game.t*1.4+e.seed)*.5;
mx=Math.cos(a)*.8-Math.sin(a)*wv;my=Math.sin(a)*.8+Math.cos(a)*wv;
}else if(e.type==='la'){
if(d>300){mx=Math.cos(a);my=Math.sin(a);}
else if(d<200){mx=-Math.cos(a);my=-Math.sin(a);}
else{const pp=Math.sin(game.t*1.1+e.seed);mx=-Math.sin(a)*pp;my=Math.cos(a)*pp;}
e.cryT-=dt;
if(e.cryT<=0&&d<560){
e.cryT=rnd(2.2,3.2);
const n=7;
for(let i=0;i<n;i++){
const aa=i/n*TAU+rnd(.2);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*130,vy:Math.sin(aa)*130,r:5,c:'#bfd8e8',slowShot:true});
}
sfx.howl();
}
if(Math.random()<dt*3)particles.push({x:e.x+rnd(-4,4),y:e.y+e.r*.6,vx:rnd(-4,4),vy:rnd(20,50),life:.6,t:0,r:1.6,c:'#9fd8ff',glow:true});
}else if(e.type==='cr'||e.type==='crs'){
const wv=Math.sin(game.t*3.5+e.seed*2)*1.1;
mx=Math.cos(a)-Math.sin(a)*wv;my=Math.sin(a)+Math.cos(a)*wv;
if(Math.random()<dt*3)particles.push({x:e.x+rnd(-8,8),y:e.y+rnd(-8,8),vx:rnd(-10,10),vy:rnd(-16,-4),life:.4,t:0,r:1.3,c:'#e6f0f2',glow:true});
}else if(e.type==='vg'){
if(d>360){mx=Math.cos(a);my=Math.sin(a);}
else if(d<240){mx=-Math.cos(a);my=-Math.sin(a);}
else{const pp=Math.sin(game.t*.9+e.seed);mx=-Math.sin(a)*pp;my=Math.cos(a)*pp;}
if(e.aimT>0.75)e.aimA=Math.atan2(player.y-e.y,player.x-e.x);
e.aimT-=dt;
if(e.aimT<=0){
for(let i=-1;i<=1;i++){
const aa=(e.aimA||a)+i*.06;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*(game.hard?470:420),vy:Math.sin(aa)*(game.hard?470:420),r:4,c:'#ffcf4d'});
}
blip('sawtooth',260,120,.07,.05);
e.aimT=rnd(1.9,2.9);
}
}else if(e.type==='pg'){
mx=Math.cos(a);my=Math.sin(a);
e.pulseT-=dt;
if(e.pulseT<=0&&d<640){
e.pulseT=rnd(2.6,3.6);
const n=game.hard?12:9;
for(let i=0;i<n;i++){
const aa=i/n*TAU+rnd(.2);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*115,vy:Math.sin(aa)*115,r:5,c:'#ffd9a0'});
}
sfx.howl();
}
if(Math.random()<dt*2)particles.push({x:e.x+rnd(-6,6),y:e.y+rnd(-10,4),vx:0,vy:rnd(-24,-10),life:.6,t:0,r:1.6,c:'#ffd9a0',glow:true});
}else if(e.type==='fa'){
if(e.dashT>0){
e.dashT-=dt;
e.x+=Math.cos(e.dashA)*520*dt;
e.y+=Math.sin(e.dashA)*520*dt;
e.ang=e.dashA;
if(Math.random()<dt*22)ebullets.push({x:e.x+rnd(-4,4),y:e.y+rnd(-4,4),vx:rnd(-20,20),vy:rnd(-20,20),r:4,c:'#ff8f3d'});
if(e.dashT<=0)e.restT=rnd(1.4,2.2);
}else if(e.restT>0){
e.restT-=dt;
if(d>280){mx=Math.cos(a);my=Math.sin(a);}
else if(d<200){mx=-Math.cos(a);my=-Math.sin(a);}
else{const pp=Math.sin(game.t*2+e.seed);mx=-Math.sin(a)*pp;my=Math.cos(a)*pp;}
if(e.restT<=0){e.dashT=.42;e.dashA=Math.atan2(player.y-e.y,player.x-e.x);sfx.dash();}
}}else if(e.type==='mf'){
/* v1.3.3: MORCEGO FLAMEJANTE — voa errático, brilha ao TELEGRAFAR,
   MERGULHA em chamas deixando brasas e cospe brasa de longe */
if(e.teleT>0){
e.teleT-=dt;
if(Math.random()<dt*26)particles.push({x:e.x+rnd(-8,8),y:e.y+rnd(-8,8),vx:rnd(-10,10),vy:rnd(-36,-8),life:.35,t:0,r:rnd(1.4,2.6),c:'#ff8f3d',drag:1,glow:true});
if(e.teleT<=0){e.diveT=.52;e.diveA=Math.atan2(player.y-e.y,player.x-e.x);sfx.dash();}
}else if(e.diveT>0){
e.diveT-=dt;
e.x+=Math.cos(e.diveA)*(game.hard?560:470)*dt;
e.y+=Math.sin(e.diveA)*(game.hard?560:470)*dt;
e.ang=e.diveA;
if(Math.random()<dt*30)particles.push({x:e.x+rnd(-6,6),y:e.y+rnd(-6,6),vx:rnd(-14,14),vy:rnd(-40,-6),life:rnd(.25,.6),t:0,r:rnd(1.4,2.8),c:Math.random()<.5?'#ff8f3d':'#ffd9a0',drag:1,glow:true});
if(e.diveT<=0)e.restT=rnd(1,1.7);
}else{
e.restT-=dt;
e.wob+=dt*5;
mx=Math.cos(a+Math.sin(e.wob)*1.2)*.85;my=Math.sin(a+Math.sin(e.wob)*1.2)*.85;
e.spitT-=dt;
if(e.spitT<=0&&d<430){
e.spitT=rnd(2.4,3.8);
const ea=Math.atan2(player.y-e.y,player.x-e.x);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(ea)*175,vy:Math.sin(ea)*175,r:5,c:'#ff8f3d'});
sfx.spit();
}
if(e.restT<=0&&d>70&&d<400)e.teleT=game.hard?.32:.42;
}
}else if(e.type==='ru'){
if(e.teleT>0){
e.teleT-=dt;
if(e.teleT<=0){e.dashT=.32;e.dashA=Math.atan2(player.y-e.y,player.x-e.x);sfx.dash();}
}else if(e.dashT>0){
e.dashT-=dt;
e.x+=Math.cos(e.dashA)*(game.hard?760:620)*dt;
e.y+=Math.sin(e.dashA)*(game.hard?760:620)*dt;
e.ang=e.dashA;
particles.push({x:e.x,y:e.y,vx:0,vy:0,life:.25,t:0,r:8,c:'#d9cfc0',alpha:.25,drag:0});
}else{
e.dashCd-=dt;mx=Math.cos(a);my=Math.sin(a);
if(e.dashCd<=0&&d>110&&d<280){e.teleT=game.hard?.3:.35;e.dashCd=game.hard?1.3:1.8;blip('sawtooth',120,70,.2,.05);}
}
}else if(e.type==='sp'){
if(e.charge>0){
e.charge-=dt;
if(e.charge<=0&&d<640){
fireEnemyShots(e,game.hard?2:1,game.hard?.14:0,game.hard?280:250,'#ff8f3d',5);
if(e.burst>0){e.burst--;e.charge=.3;}
else{e.shootT=game.hard?1.7+rnd(0,.5):2.4+rnd(0,.9);if(game.hard){if(Math.random()<.6)e.burst=2;}else if(Math.random()<.25)e.burst=1;}
}
}else{
if(d>340){mx=Math.cos(a);my=Math.sin(a);}
else if(d<230){mx=-Math.cos(a);my=-Math.sin(a);}
else{const pp=Math.sin(game.t*1.5+e.seed);mx=-Math.sin(a)*pp;my=Math.cos(a)*pp;}
e.shootT-=dt;
if(e.shootT<=0&&d<560)e.charge=.45;
}
}else if(e.type==='fs'){
if(e.charge>0){
e.charge-=dt;
if(e.charge<=0&&d<640){
fireEnemyShots(e,game.hard?2:1,game.hard?.18:0,200,'#9fd8ff',7);
if(e.burst>0){e.burst--;e.charge=.3;}
else{e.shootT=game.hard?2+rnd(0,.5):2.8+rnd(0,.8);e.burst=game.hard?2:1;}
}
}else{
if(d>380){mx=Math.cos(a);my=Math.sin(a);}
else if(d<260){mx=-Math.cos(a);my=-Math.sin(a);}
else{const pp=Math.sin(game.t*1.2+e.seed);mx=-Math.sin(a)*pp;my=Math.cos(a)*pp;}
e.shootT-=dt;
if(e.shootT<=0&&d<580)e.charge=.5;
}
}else{
const wob=e.type==='br'?.1:.35*Math.sin(game.t*4+e.seed);
mx=Math.cos(a)-Math.sin(a)*wob;my=Math.sin(a)+Math.cos(a)*wob;
}
const l=Math.hypot(mx,my)||1;
e.x+=mx/l*e.sp*slowMul*dt;e.y+=my/l*e.sp*slowMul*dt;
e.ang=lerpAngle(e.ang,Math.atan2(my,mx),1-Math.exp(-6*dt));
resolveDecorCollision(e,e.r);
clampArena(e,e.r);
if(!player.dead&&d<e.r+(player.hitR||player.r)-4){ /* v1.4.6 hitR */
hurtPlayer();
if(window.__GRI)window.__GRI.contactHit(e); /* v1.9.0: contato aplica efeitos (coroa de espinhos, queimadura, veneno) */
e.x-=Math.cos(a)*26;e.y-=Math.sin(a)*26;
}
}
for(let i=0;i<enemies.length;i++){
for(let j=i+1;j<enemies.length;j++){
const a=enemies[i],b=enemies[j];
if(a.type==='mb'||a.type==='ex'||a.type==='vi'||a.type==='gz'||a.type==='e404'||a.type==='rk'||a.type==='rkm'||b.type==='mb'||b.type==='ex'||b.type==='vi'||b.type==='gz'||b.type==='e404'||b.type==='rk'||b.type==='rkm')continue;
const dx=b.x-a.x,dy=b.y-a.y,dd=Math.hypot(dx,dy)||.01,min=(a.r+b.r)*.9;
if(dd<min){
const push=(min-dd)/2,nx=dx/dd,ny=dy/dd;
a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;
}
}
}
}
/* ============ o bruxo da penumbra ============ */
const MB_PATS=['spiral','cross','crown','souls','blink','frost','wall','meteor','bounce','flower','snipe','swarm'];
const MB_HARD_PATS=['shotgun','rings','bothwalls','twin'];
/* v0.9.14: kzH(e) — o boss age como hardmode se o MODO da run é abismo OU se
   ele é KAIZO (repetido). É isso que faz o kaizo ser o boss do hardmode no normal. */
const kzH=e=>game.hard||!!(e&&e.kaizo);
const mbPats=e=>kzH(e)?MB_PATS.concat(MB_HARD_PATS):MB_PATS;
function miniBossAI(e,dt,a,d,slowMul){
e.stT+=dt;
/* v0.9.16: KAIZO FASE II — aos 50% de vida o boss desperta: mais rápido,
   padrões exclusivos mais frequentes e COMBOS (encadeamento). Aviso claro. */
if(e.kaizo&&!e.kzP2&&e.hp<=e.maxHp*.5&&!e.dead){
e.kzP2=true;
game.flash=.5;game.shake=16;game.hitstop=.14;
sfx.roar();sfx.growl();
for(const b of ebullets)sparks(b.x,b.y,'#eef2f4',3,120,.4,2,true);
ebullets=[];
sparks(e.x,e.y,'#eef2f4',40,420,1.1,5,true);
texts.push({x:e.x,y:e.y-e.r-24,txt:'FASE II',t:0,life:1.6,c:'#eef2f4',size:16,disp:true});
game.banner={type:'small',txt:miniDisplayName(e.type,true,e._neo)+' — FASE II',sub:({mb:'os feitiços encadeiam em sequências geométricas',ex:'as investidas voltam em cadeia',vi:'os fios da morte tensionam o campo',gz:'o chão queimado fica perigoso'})[e.type]||'a forma branca desperta',t:0,dur:2.2};
e.sp*=1.15;
}
if(e.st==='float'){
if(d>340){e.x+=Math.cos(a)*e.sp*slowMul*dt;e.y+=Math.sin(a)*e.sp*slowMul*dt;}
else if(d<240){e.x-=Math.cos(a)*e.sp*slowMul*dt;e.y-=Math.sin(a)*e.sp*slowMul*dt;}
else{const pp=Math.sin(game.t*.8+e.seed);e.x+=-Math.sin(a)*e.sp*.7*pp*dt;e.y+=Math.cos(a)*e.sp*.7*pp*dt;}
e.ang=lerpAngle(e.ang,a,1-Math.exp(-3*dt));
e.atkT-=dt;
if(e.atkT<=0){
/* v0.9.16: KAIZO sorteia também entre os padrões EXCLUSIVOS do boss
   (peso maior na Fase II); não-kaizo mantém o ciclo antigo intacto.
   v1.6.3: na Fase II o FEITIÇO ASSINATURA do boss (Grimório Rasgado,
   Investida Ricochete, Fios da Morte, Maré de Magma) domina o sorteio. */
if(e.kaizo){
/* v1.7.0: EDITOR DE MODS — a spell card vinculada ao chefe substitui o sorteio */
if(window.__MODS&&__MODS.on()&&__MODS.spellFor(e.type)){e.pat='kz_mod';}
else{
const ex=_kzPatsMap[e.type]||[];
const base=mbPats(e);
const exW=e.kzP2?.62:.4;
e.pat=Math.random()<exW&&ex.length?ex[irnd(0,ex.length-1)]:base[irnd(0,base.length-1)];
if(e.kzP2&&_kzSignature[e.type]&&Math.random()<.45)e.pat=_kzSignature[e.type];
}
}else{
const pats=mbPats(e);
e.patIdx=(e.patIdx+1)%pats.length;e.pat=pats[e.patIdx];
}
/* v1.7.1: EDITOR DE MODS — substituição de padrão (spell do mod / padrão do mod) */
if(window.__MODS&&__MODS.on()&&e.pat!=='kz_mod'){const _ms=__MODS.takeover(e.type,e.pat);if(_ms){e._modSpell=_ms;e.pat='kz_mod';}}
e.st='tele';e.stT=0;sfx.growl();
/* telegráfo do cast — o jogador VÊ que algo vem (justo e previsível) */
if(e.kaizo)kzTeleMark(e);
}
}else if(e.st==='tele'){
/* v1.5.1: NEO — o aviso é curto (quase spam) */
if(e.stT>=((kzH(e)?(e.kzP2?.4:.5):.7)*(e._neo?.6:1))){e.st=e.pat;e.stT=0;mbActStart(e);}
}else mbActUpdate(e,dt);
clampArena(e,e.r);
if(!player.dead&&d<e.r+(player.hitR||player.r)-4)hurtPlayer();
}
function mbActStart(e){
/* v1.7.0: EDITOR DE MODS — despacho da spell card do mod */
if(e.pat==='kz_mod'&&window.__MODS){__MODS.spellStart(e);return;}
/* v0.9.16: padrões exclusivos KAIZO — despachados por tipo de boss */
if(e.pat&&e.pat.indexOf('kz_')===0){(_kzStartMap[e.type]||function(){})(e);return;}
if(e.pat==='spiral')e.data={spin:rnd(TAU),tick:0,dur:kzH(e)?3.4:2.6};
else if(e.pat==='cross')e.data={rot:rnd(TAU),salvoT:0,dur:kzH(e)?3.2:2.4};
else if(e.pat==='crown')e.data={waveT:0,waves:0};
else if(e.pat==='souls')e.data={fired:false};
else if(e.pat==='blink')e.data={moved:false,fired:false};
else if(e.pat==='frost')e.data={f1:false,f2:false};
else if(e.pat==='wall')e.data={w1:false,w2:false};
else if(e.pat==='meteor')e.data={salvoT:.1,s:0};
else if(e.pat==='shotgun')e.data={volleys:0,t:.15};
else if(e.pat==='rings')e.data={rings:0,ringT:.1,gap:rnd(TAU)};
else if(e.pat==='bothwalls')e.data={h:false,v:false,v2:false};
else if(e.pat==='twin')e.data={spin:rnd(TAU),tick:0,dur:kzH(e)?3.2:2.8};
else if(e.pat==='bounce')e.data={tick:.1,dur:kzH(e)?2.2:1.7};
else if(e.pat==='flower')e.data={rings:0,ringT:.1};
else if(e.pat==='snipe')e.data={shots:0,t:.1};
else if(e.pat==='swarm')e.data={fired:false};
}
function mbEnd(e){
/* v0.9.16: KAIZO FASE II — 45% de chance de ENCADEAR outro padrão logo
   (combos anti-decoração), cooldowns mais curtos; normal volta a flutuar.
   v1.5.1: NEO encadeia ainda mais (55%) e o intervalo cai pela metade. */
e.st='float';e.stT=0;
if(e.kaizo&&(e.kzP2||e._neo)&&Math.random()<(e._neo?.55:.45)&&!e._chained){
  e._chained=true;
  e.st='tele';e.stT=0;sfx.growl();
  return;
}
e._chained=false;
e.atkT=kzH(e)?(.42+rnd(.26))*(e.kzP2?.72:1):1.6+rnd(.6); /* v1.6.4: kaizo volta ao ataque 24% mais rápido */
if(e._neo)e.atkT*=.5;
}
/* ============================================================
   v0.9.16: PADRÕES EXCLUSIVOS KAIZO — cada boss tem os seus.
   Dificuldade por COMPLEXIDADE (telegráficos justos, teto de balas,
   brechas reais), não por vida/dano exagerados.
   ============================================================ */
function kzWarn(x,y,r,dur,cb,c,shape,ang){
telegraphs.push({x:x,y:y,r:r,t:0,dur:dur,cb:cb,c:c||'#eef2f4',shape:shape||'circle',ang:ang||0});
}
function kzDetonate(x,y,r,dmg,c){
/* explosão de ataque KAIZO — atinge o JOGADOR (com telegráfo prévio), nunca os inimigos */
if(!player.dead&&dist(x,y,player.x,player.y)<r+(player.hitR||player.r)-2)hurtPlayer(); /* v1.4.6 hitR */
sparks(x,y,c||'#eef2f4',16,280,.7,4,true);
shockwaves.push({x:x,y:y,r:0,vr:620,maxR:r+24,t:0,dur:.4,c:c||'#eef2f4'});
game.shake=Math.max(game.shake,7);sfx.boom();
}
/* marca de aviso do estado 'tele' — círculo branco nos pés do boss */
function kzTeleMark(e){
telegraphs.push({x:e.x,y:e.y,r:e.r+16,t:0,dur:Math.max(.5,e.stT||.5),c:'#eef2f4',shape:'circle',cb:null,mark:true});
}
/* ---- O BRUXO: sigilos, espelhos, cometas ---- */
function kzActStart(e){
/* v1.7.0: EDITOR DE MODS — despacho da spell card do mod */
if(e.pat==='kz_mod'&&window.__MODS){__MODS.spellStart(e);return;}
if(e.pat==='kz_runes'){e.data={cast:0,shots:0};}
else if(e.pat==='kz_mirrors'){e.data={t:0,fired:0};kzWarn(e.x,e.y,e.r+20,.6,null,'#c9a0ff');}
else if(e.pat==='kz_comets'){e.data={wave:0,waveT:.35};}
else if(e.pat==='kz_grimoire'){e.data={t:0,stage:0};texts.push({x:e.x,y:e.y-e.r-30,txt:'SPELL CARD — GRIMÓRIO RASGADO',t:0,life:1.5,c:'#c9a0ff',size:12,disp:true});}
}
function kzActUpdate(e,dt){
const kz2=e.kzP2;
/* v1.7.0: EDITOR DE MODS — despacho da spell card do mod */
if(e.pat==='kz_mod'&&window.__MODS){__MODS.spellUpdate(e,dt);return;}
if(e.pat==='kz_runes'){
  /* SIGILOS DA PENUMBRA — 4 (6 na fase II) sigilos nascem perto do jogador e detonam */
  e.data.cast+=dt;
  if(e.data.shots<(kz2?9:6)&&e.data.cast>.2){ /* v1.6.4: 9/6 sigilos (era 6/4) */
    e.data.cast=0;e.data.shots++;
    const a=rnd(TAU),d=rnd(60,150);
    const rx=clamp(player.x+Math.cos(a)*d,ROOM.x+40,ROOM.x+ROOM.w-40);
    const ry=clamp(player.y+Math.sin(a)*d,ROOM.y+40,ROOM.y+ROOM.h-40);
    kzWarn(rx,ry,64,.95,function(){
      kzDetonate(rx,ry,64,26,'#c9a0ff');
      for(let k=0;k<8;k++){ /* v1.6.4: 8 estilhaços por sigilo (era 6) */
        const ba=k/8*TAU+rnd(.4);
        ebullets.push({x:rx,y:ry,vx:Math.cos(ba)*240,vy:Math.sin(ba)*240,r:5,c:'#c9a0ff'});
      }
    },'#c9a0ff');
    blip('square',520,240,.14,.09);
  }
  if(e.data.shots>=(kz2?9:6)&&e.data.cast>1.1)mbEnd(e);
}else if(e.pat==='kz_mirrors'){
  /* ESPELHOS DO BRUXO — 2 fantasmas disparam leques e se desfazem */
  e.data.t+=dt;
  if(!e.data.fired&&e.data.t>.6){
    e.data.fired=1;
    for(let g=0;g<2;g++){
      const gx=clamp(e.x+(g?1:-1)*120,ROOM.x+40,ROOM.x+ROOM.w-40);
      const gy=e.y;
      const base=Math.atan2(player.y-gy,player.x-gx),n=kz2?7:5; /* v1.6.4: leque maior */
      for(let i=0;i<n;i++){
        const ba=base+(i-(n-1)/2)*.19;
        ebullets.push({x:gx,y:gy,vx:Math.cos(ba)*270,vy:Math.sin(ba)*270,r:5,c:'#c9a0ff'});
      }
      sparks(gx,gy,'#c9a0ff',14,220,.6,4,true);
    }
    sfx.spit();
  }
  if(e.data.t>1.15)mbEnd(e);
}else if(e.pat==='kz_comets'){
  /* COMETAS — 3 (4) vagas de projéteis que perseguem levemente (homing fraco) */
  e.data.waveT-=dt;
  if(e.data.waveT<=0&&e.data.wave<(kz2?6:4)){ /* v1.6.4: 6/4 vagas (era 4/3) */
    e.data.wave++;e.data.waveT=.42;
    for(let k=0;k<4;k++){ /* v1.6.4: 4 cometas por vaga (era 3) */
      const a=e.data.wave*.95+k*1.57+e.seed;
      /* home/homeT: perseguição fraca e CURTA (2s) — dá para despistar */
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*205,vy:Math.sin(a)*205,r:6,c:'#eef2f4',home:1.1,homeT:2.2,life:4.2});
    }
    sfx.spit();blip('sine',300,140,.3,.12);
  }
  if(e.data.wave>=(kz2?6:4)&&e.data.waveT<=-.3)mbEnd(e);
}else if(e.pat==='kz_grimoire'){
  /* ===== v1.6.3: GRIMÓRIO RASGADO (feitiço assinatura do Bruxo) =====
     O Bruxo rasga o grimório: linhas mágicas ATRAVESSAM a arena, cada uma
     pisca em roxo e cospe uma FILEIRA de projéteis perpendicular à linha.
     Sempre existe rota segura: cada fileira tem uma brecha de 2 vagas.
     FASE II: o feitiço vira LEITURA DUPLA — primeiro as linhas HORIZONTAIS,
     depois as DIAGONAIS, e a segunda sequência tem aviso visual PRÓPRIO
     (magenta claro). Raciocínio espacial: observar o sinal e atravessar a
     linha antes dela disparar. */
  e.data.t+=dt;
  const stages=kz2?2:1;
  if(e.data.stage<stages&&e.data.t>.3){
    e.data.t=0;e.data.stage++;
    const diag=e.data.stage===2; /* 2ª leitura = diagonal (só na Fase II) */
    const ang=diag?(Math.random()<.5?Math.PI/4:-Math.PI/4):0;
    const col=diag?'#ff9ff3':'#c9a0ff'; /* aviso visual próprio da 2ª leitura */
    for(let i=0;i<3;i++){
      const off=(i+1)/4;
      const cy=ROOM.y+40+off*(ROOM.h-80),cx=ROOM.x+ROOM.w/2;
      const perp=ang+Math.PI/2; /* a fileira avança perpendicular à linha */
      kzWarn(cx,cy,0,diag?.8:1.0,function(){
        const n=15,gap=irnd(1,n-3); /* brecha de 2 vagas — rota garantida · v1.6.4: fileira de 15 (era 13) */
        const step=(ROOM.w*.92)/(n-1);
        for(let k=0;k<n;k++){
          if(k===gap||k===gap+1)continue;
          const px=clamp(cx+Math.cos(ang)*step*(k-(n-1)/2),ROOM.x+14,ROOM.x+ROOM.w-14);
          const py=clamp(cy+Math.sin(ang)*step*(k-(n-1)/2),ROOM.y+14,ROOM.y+ROOM.h-14);
          ebullets.push({x:px,y:py,vx:Math.cos(perp)*(diag?280:250),vy:Math.sin(perp)*(diag?280:250),r:5,c:col}); /* v1.6.4: mais rápidas */
        }
        sfx.spit();blip('square',diag?480:420,180,.2,.1);
      },col,'line',ang);
    }
    sfx.growl();blip('sine',240,110,.5,.12);
  }
  if(e.data.stage>=stages&&e.data.t>1.6)mbEnd(e);
}
}
/* ---- O CARRASCO: guilhotinas, corrente, execução ---- */
function kzActStartEx(e){
const kz2=e.kzP2; /* v1.6.3: os cards novos usam a fase no Start */
/* v1.7.0: EDITOR DE MODS — despacho da spell card do mod */
if(e.pat==='kz_mod'&&window.__MODS){__MODS.spellStart(e);return;}
if(e.pat==='kz_guillotine'){e.data={lockX:player.x,t:0,done:0};}
else if(e.pat==='kz_chain'){e.data={spin:rnd(TAU),t:0};}
else if(e.pat==='kz_execute'){e.data={cx:player.x,cy:player.y,t:0,fired:0};}
else if(e.pat==='kz_ricochet'){e.data={t:0,phase:'aim',charges:0,max:kz2?3:2,aimed:false,lastA:null,aimA:0};texts.push({x:e.x,y:e.y-e.r-30,txt:'SPELL CARD — INVESTIDA RICOCHETE',t:0,life:1.5,c:'#e8455a',size:12,disp:true});}
/* v1.6.4: AVANÇO TRIPLO — três investidas marcadas; a 3ª termina com o GOLPE DA PÁ de perto */
else if(e.pat==='kz_avanco'){e.data={t:0,phase:'aim',charges:0,max:3,aimed:false,lastA:null,aimA:0};texts.push({x:e.x,y:e.y-e.r-30,txt:'SPELL CARD — AVANÇO TRIPLO',t:0,life:1.5,c:'#e8455a',size:12,disp:true});}
/* v1.6.4: ENXAME VAMPIRO — morcegos que perseguem o Thor; CADA morcego que acerta CURA o Carrasco */
else if(e.pat==='kz_morcegos'){e.data={t:0,fired:false,waves:0,waveT:0};texts.push({x:e.x,y:e.y-e.r-30,txt:'SPELL CARD — ENXAME VAMPIRO',t:0,life:1.5,c:'#c25a7a',size:12,disp:true});}
}
function kzActUpdateEx(e,dt){
const kz2=e.kzP2;
/* v1.7.0: EDITOR DE MODS — despacho da spell card do mod */
if(e.pat==='kz_mod'&&window.__MODS){__MODS.spellUpdate(e,dt);return;}
if(e.pat==='kz_guillotine'){
  /* GUILHOTINAS — linhas verticais piscam no chão, depois as lâminas caem */
  e.data.t+=dt;
  if(e.data.done<(kz2?4:3)&&e.data.t>.28){ /* v1.6.4: 4/3 guilhotinas (era 3/2) */
    e.data.t=0;e.data.done++;
    const lx=clamp(player.x+(e.data.done%2?-70:70)*rnd(.6,1.4),ROOM.x+50,ROOM.x+ROOM.w-50);
    kzWarn(lx,ROOM.y+ROOM.h/2,0,1.0,function(){
      for(let k=0;k<9;k++){ /* v1.6.4: 9 lâminas por coluna (era 7) */
        ebullets.push({x:lx+rnd(-8,8),y:ROOM.y+30+k*(ROOM.h-60)/8,vx:0,vy:255,r:6,c:'#e8455a'}); /* v1.6.4: mais rápidas */
      }
      kzDetonate(lx,player.y,44,24,'#e8455a');
    },'#e8455a','line',Math.PI/2);
    sfx.growl();
  }
  if(e.data.done>=(kz2?4:3)&&e.data.t>1.1)mbEnd(e);
}else if(e.pat==='kz_chain'){
  /* CORRENTE — leque giratório: varre 300° com brecha visível */
  e.data.t+=dt;
  if(e.data.t>.4&&e.data.t<2.3){
    e.data.spin+=dt*3.1;
    e.chainTick=(e.chainTick||0)-dt;
    if(e.chainTick<=0){
      e.chainTick=kz2?.07:.10; /* v1.6.4: varredura mais densa */
      for(let k=-1;k<=1;k++){
        const a=e.data.spin+k*.15;
        ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*300,vy:Math.sin(a)*300,r:5,c:'#e8455a'}); /* v1.6.4: 300 (era 250) */
      }
    }
  }
  if(e.data.t>2.5)mbEnd(e);
}else if(e.pat==='kz_execute'){
  /* EXECUÇÃO — cruz travada na posição do jogador; braços detonam em sequência */
  e.data.t+=dt;
  if(!e.data.fired&&e.data.t>.35){
    e.data.fired=1;
    const cx=e.data.cx,cy=e.data.cy;
    for(let k=0;k<4;k++){
      const ang=k*Math.PI/2;
      kzWarn(cx,cy,0,.95+k*.12,function(){
        for(let s=60;s<=330;s+=42){ /* v1.6.4: 8 tiros por braço (era 6) */
          ebullets.push({x:cx+Math.cos(ang)*s,y:cy+Math.sin(ang)*s,vx:Math.cos(ang)*200,vy:Math.sin(ang)*200,r:5,c:'#e8455a'}); /* v1.6.4: 200 (era 160) */
        }
        if(k===0||k===2)kzDetonate(cx,cy,50,26,'#e8455a');
      },'#e8455a','line',ang);
    }
    sfx.growl();blip('square',200,90,.4,.16);
  }
  if(e.data.t>2.1)mbEnd(e);
}else if(e.pat==='kz_ricochet'){
  /* ===== v1.6.3: INVESTIDA RICOCHETE (feitiço assinatura do Carrasco) =====
     O Carrasco atravessa a arena, BATE na parede (zona de impacto + estilhaços
     com brecha) e prepara OUTRA investida num ângulo diferente — a direção de
     cada uma aparece NO CHÃO antes do movimento. FASE II: três investidas em
     cadeia, com pausas curtas. Punição a movimento previsível: quem encosta na
     parede com o Carrasco em cima leva a sentença. */
  e.data.t+=dt;
  const ph=e.data.phase;
  if(ph==='aim'){
    if(!e.data.aimed){
      e.data.aimed=true;
      let a;
      if(e.data.lastA==null)a=Math.atan2(player.y-e.y,player.x-e.x); /* 1ª: em direção ao Thor */
      else a=-e.data.lastA+rnd(-.55,.55); /* ricochete: reflexo + desvio */
      e.data.aimA=a;
      /* a direção aparece NO CHÃO: linha tracejada vermelha na rota da investida */
      kzWarn(e.x+Math.cos(a)*260,e.y+Math.sin(a)*260,0,.5,null,'#e8455a','line',a);
      sfx.growl();
    }
    if(e.data.t>.5){e.data.phase='dash';e.data.dashT=1.5;e.data.t=0;sfx.dash();sfx.roar();game.shake=Math.max(game.shake,6);}
  }else if(ph==='dash'){
    const sp=kz2?830:760; /* v1.6.4: investida mais veloz */
    e.x+=Math.cos(e.data.aimA)*sp*dt;e.y+=Math.sin(e.data.aimA)*sp*dt;
    e.ang=e.data.aimA;
    if(Math.random()<dt*40)sparks(e.x,e.y,'#e8455a',2,70,.25,2,true);
    const m=e.r+3;
    if(e.data.t>=.12&&(e.x<=ROOM.x+m||e.x>=ROOM.x+ROOM.w-m||e.y<=ROOM.y+m||e.y>=ROOM.y+ROOM.h+m||e.data.dashT<=0)){
      e.data.phase='impact';e.data.t=0;
      /* ZONA DE IMPACTO na parede + estilhaços com brecha de 2 vagas */
      kzDetonate(e.x,e.y,52,kz2?24:20,'#e8455a');
      const n=kz2?18:13,gap=irnd(0,n-1); /* v1.6.4: 18/13 estilhaços (era 14/10) */
      for(let k=0;k<n;k++){
        if(k===gap||k===(gap+1)%n)continue;
        const ba=k/n*TAU;
        ebullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*260,vy:Math.sin(ba)*260,r:5,c:'#e8455a'}); /* v1.6.4: 260 (era 220) */
      }
      sfx.boom();game.shake=Math.max(game.shake,9);
    }
  }else if(ph==='impact'){
    if(e.data.t>.42){ /* pausa curta entre as investidas da cadeia */
      e.data.charges++;e.data.aimed=false;e.data.lastA=e.data.aimA;e.data.t=0;
      e.data.phase=e.data.charges>=e.data.max?'done':'aim';
    }
  }else if(ph==='done'){
    if(e.data.t>.3)mbEnd(e);
  }
}else if(e.pat==='kz_avanco'){
  /* ===== v1.6.4 · CORRIGIDO na v1.7.2: AVANÇO TRIPLO =====
     Ele avança EM DIREÇÃO AO JOGADOR TRÊS VEZES: cada investida mira ONDE O
     THOR ESTÁ (a rota aparece no chão como linha carmesim tracejada) e cada
     batida na parede espalha estilhaços. NA TERCEIRA investida, QUANDO ELE SE
     APROXIMA do Thor (~150px), desfere O ATAQUE DA PÁ ali mesmo: anel de
     aviso 132px, 0.5s para sair do anel, depois o estouro com brechas. Se o
     Thor despistar e ele só achar a parede, o golpe sai do mesmo jeito.
     FASE II: avanços mais rápidos e o golpe cospe um anel extra com brechas. */
  e.data.t+=dt;
  const ph=e.data.phase;
  if(ph==='aim'){
    if(!e.data.aimed){
      e.data.aimed=true;
      /* v1.7.2: TODAS as investidas perseguem o Thor — mira ATUALIZADA a cada avanço */
      const a=Math.atan2(player.y-e.y,player.x-e.x);
      e.data.aimA=a;
      kzWarn(e.x+Math.cos(a)*260,e.y+Math.sin(a)*260,0,.5,null,'#e8455a','line',a);
      sfx.growl();
    }
    if(e.data.t>.45){e.data.phase='dash';e.data.dashT=1.5;e.data.t=0;sfx.dash();game.shake=Math.max(game.shake,6);}
  }else if(ph==='dash'){
    const sp=e.kzP2?800:720;
    e.x+=Math.cos(e.data.aimA)*sp*dt;e.y+=Math.sin(e.data.aimA)*sp*dt;
    e.ang=e.data.aimA;
    if(Math.random()<dt*40)sparks(e.x,e.y,'#e8455a',2,70,.25,2,true);
    const m=e.r+3;
    /* v1.7.2: no 3º avanço, CHEGAR PERTO do Thor dispara O GOLPE DA PÁ na hora
       (a rota de fuga continua sendo SAIR DO ANEL — 0.5s de aviso) */
    const pd=Math.hypot(player.x-e.x,player.y-e.y);
    const paNow=e.data.charges>=e.data.max-1&&e.data.t>=.12&&pd<150;
    if(paNow||(e.data.t>=.12&&(e.x<=ROOM.x+m||e.x>=ROOM.x+ROOM.w-m||e.y<=ROOM.y+m||e.y>=ROOM.y+ROOM.h+m||e.data.dashT<=0))){
      e.data.charges++;
      if(!paNow){ /* de parede: estilhaços; de perto: o golpe da pá já avisa por si */
        kzDetonate(e.x,e.y,46,18,'#e8455a');
        game.shake=Math.max(game.shake,9);
      }
      if(e.data.charges>=e.data.max){
        /* o ATAQUE DA PÁ — de perto, com aviso ao redor dele */
        e.data.phase='pa';e.data.t=0;
        kzWarn(e.x,e.y,132,.5,null,'#ff2450');
        sfx.roar();
      }else{
        e.data.phase='aim';e.data.aimed=false;e.data.lastA=e.data.aimA;e.data.t=0;
      }
    }
  }else if(ph==='pa'){
    /* o golpe da pá desce — quem estiver perto leva; a rota de fuga é SAIR DO ANEL */
    if(e.data.t>.5&&!e.data.paDone){
      e.data.paDone=true;
      kzDetonate(e.x,e.y,132,e.kzP2?30:26,'#ff2450');
      const n=e.kzP2?18:14,gap=irnd(0,n-1);
      for(let k=0;k<n;k++){
        if(k===gap||k===(gap+1)%n||k===(gap+2)%n)continue;
        const ba=k/n*TAU+rnd(.2);
        ebullets.push({x:e.x+Math.cos(ba)*18,y:e.y+Math.sin(ba)*18,vx:Math.cos(ba)*(e.kzP2?300:265),vy:Math.sin(ba)*(e.kzP2?300:265),r:6,c:'#e8455a'});
      }
      /* a lâmina da pá varre na direção que ele estava olhando */
      const fa=e.ang;
      for(let k=-2;k<=2;k++){
        const ba=fa+k*.2;
        ebullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*360,vy:Math.sin(ba)*360,r:7,c:'#ff2450'});
      }
      sfx.boom();game.shake=Math.max(game.shake,13);game.flash=Math.max(game.flash,.16);
    }
    if(e.data.t>.95){e.data.paDone=false;mbEnd(e);}
  }
}else if(e.pat==='kz_morcegos'){
  /* ===== v1.6.4: ENXAME VAMPIRO (morcegos que CURAM o Carrasco) =====
     Ele solta morcegos que perseguem o Thor. CADA morcego que ACERTA devolve
     vida ao Carrasco (o número verde em cima dele mostra a cura). Os morcegos
     podem ser DERRUBADOS a tiro — abater o enxame é negar a cura. FASE II:
     duas vagas e morcegos que curam mais. */
  e.data.t+=dt;
  const kz2=e.kzP2;
  if(!e.data.fired){
    e.data.fired=true;e.data.waveT=.1;
    sfx.howl();blip('sawtooth',180,70,.5,.14);
  }
  e.data.waveT-=dt;
  if(e.data.waveT<=0&&e.data.waves<(kz2?2:1)){
    e.data.waves++;e.data.waveT=1.0;
    const n=kz2?7:5;
    for(let k=0;k<n;k++){
      const a=(k/n)*TAU+e.seed;
      ebullets.push({x:e.x+Math.cos(a)*24,y:e.y+Math.sin(a)*24,vx:Math.cos(a)*120,vy:Math.sin(a)*120,r:7,c:'#c25a7a',home:2.2,homeT:6.5,life:6.5,bat:true,heal:kz2?26:18,owner:e});
    }
    sparks(e.x,e.y,'#c25a7a',14,220,.6,4,true);sfx.spit();
  }
  if(e.data.waves>=(kz2?2:1)&&e.data.t>2.6)mbEnd(e);
  if(e.data.t>4.2)mbEnd(e);
}
}
/* ---- A VIÚVA: teias, cria, laço ---- */
function kzActStartVi(e){
/* v1.7.0: EDITOR DE MODS — despacho da spell card do mod */
if(e.pat==='kz_mod'&&window.__MODS){__MODS.spellStart(e);return;}
if(e.pat==='kz_web'){e.data={t:0,webs:[],cast:0};}
else if(e.pat==='kz_brood'){e.data={t:0,done:false};}
else if(e.pat==='kz_snare'){e.data={t:0,px:player.x,py:player.y,fired:0};}
else if(e.pat==='kz_threads'){e.data={t:0,built:false,threads:[]};texts.push({x:e.x,y:e.y-e.r-30,txt:'SPELL CARD — FIOS DA MORTE',t:0,life:1.5,c:'#dfe7ee',size:12,disp:true});}
}
function kzActUpdateVi(e,dt){
const kz2=e.kzP2;
/* v1.7.0: EDITOR DE MODS — despacho da spell card do mod */
if(e.pat==='kz_mod'&&window.__MODS){__MODS.spellUpdate(e,dt);return;}
if(e.pat==='kz_web'){
  /* TEIAS — zonas que prendem o chão (lentidão no jogador) e caem com o tempo */
  e.data.t+=dt;e.data.cast-=dt;
  if(e.data.webs.length<(kz2?4:3)&&e.data.cast<=0){
    e.data.cast=.3;
    const wx=clamp(player.x+rnd(-160,160),ROOM.x+50,ROOM.x+ROOM.w-50);
    const wy=clamp(player.y+rnd(-120,120),ROOM.y+50,ROOM.y+ROOM.h-50);
    const web={x:wx,y:wy,r:78,life:5};
    e.data.webs.push(web);
    kzWarn(wx,wy,78,.5,null,'#dfe7ee');
  }
  for(let i=e.data.webs.length-1;i>=0;i--){
    const w=e.data.webs[i];
    w.life-=dt;
    if(!player.dead&&dist(w.x,w.y,player.x,player.y)<w.r){
      player.slowT=Math.max(player.slowT,.3);
      if(Math.random()<dt*8)particles.push({x:player.x+rnd(-8,8),y:player.y+rnd(-8,8),vx:0,vy:8,life:.4,t:0,r:2,c:'rgba(223,231,238,.5)',drag:1});
    }
    if(w.life<=0)e.data.webs.splice(i,1);
  }
  if(e.data.t>2.2&&e.data.webs.length===0)mbEnd(e);
  if(e.data.t>3.4)mbEnd(e);
}else if(e.pat==='kz_brood'){
  /* NINHADA — invoca cria pequena (com teto, para não virar enxame injusto) */
  e.data.t+=dt;
  if(!e.data.done&&e.data.t>.5){
    e.data.done=true;
    const n=enemies.filter(o=>!o.dead&&!o._brood).length;
    if(n<(kz2?5:4)){ /* v1.6.4: teto maior para a ninhada maior */
      for(let k=0;k<(kz2?4:3);k++){ /* v1.6.4: 4/3 crias (era 3/2) */
        spawnEnemy('sh',e.x+rnd(-60,60),e.y+rnd(-50,50));
        const b=enemies[enemies.length-1];
        if(b&&!b.dead){b._brood=true;b.hp*=.55;b.maxHp*=.55;b.r*=.8;}
      }
      sparks(e.x,e.y,'#9d6bb5',18,240,.7,4,true);sfx.spit();
    }
  }
  if(e.data.t>1.2)mbEnd(e);
}else if(e.pat==='kz_snare'){
  /* LAÇO — anel que fecha com 2 brechas claras, centrado onde você estava */
  e.data.t+=dt;
  if(!e.data.fired&&e.data.t>.4){
    e.data.fired=1;
    const n=kz2?32:26,gap=irnd(0,n-1),spd=kz2?190:165; /* v1.6.4: anel de 32/26 (era 26/20) */
    for(let i=0;i<n;i++){
      if(i===gap||(i+1)%n===gap||i===(gap+n-1)%n)continue;
      const a=i/n*TAU;
      ebullets.push({x:e.data.px+Math.cos(a)*380,y:e.data.py+Math.sin(a)*380,vx:-Math.cos(a)*spd,vy:-Math.sin(a)*spd,r:5,c:'#9d6bb5',life:4});
    }
    sfx.spit();
  }
  if(e.data.t>1.6)mbEnd(e);
}else if(e.pat==='kz_threads'){
  /* ===== v1.6.3: FIOS DA MORTE (feitiço assinatura da Viúva) =====
     A Viúva tece fios entre âncoras fixas da arena: primeiro aparecem como
     LINHAS FINAS, depois TENSIONAM e passam a CORTAR o espaço entre elas.
     FASE II: os fios ativam EM SEQUÊNCIA formando triângulo e diagonais, os
     já ativos CONTINUAM visíveis até acabar — e um lado da arena fica sempre
     aberto (regra da casa: nunca fechar todas as rotas de fuga). */
  e.data.t+=dt;
  if(!e.data.built){
    e.data.built=true;
    const P=[[.12,.14],[.88,.14],[.12,.86],[.88,.86]];
    const anchors=P.map(q=>({x:ROOM.x+q[0]*ROOM.w,y:ROOM.y+q[1]*ROOM.h}));
    /* Fase I: 3 fios (topo, base, diagonal) — laterais sempre abertas.
       Fase II: 4 fios em sequência (triângulo + diagonal) — lado esquerdo aberto. */
    const pairs=kz2?[[0,1],[1,3],[2,3],[0,3]]:[[0,1],[2,3],[0,3]];
    e.data.threads=pairs.map((pr,i)=>{
      const a=anchors[pr[0]],b=anchors[pr[1]];
      const th={ax:a.x,ay:a.y,bx:b.x,by:b.y,cut:false,warn:.45+i*(kz2?.4:.3),life:0};
      /* fase FINA: linha fina e pálida — o aviso de onde vai cortar */
      telegraphs.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,r:0,t:0,dur:.5,c:'#dfe7ee',shape:'line',ang:Math.atan2(b.y-a.y,b.x-a.x),cb:null,tlen:dist(a.x,a.y,b.x,b.y)});
      return th;
    });
    sfx.growl();blip('sine',320,90,.6,.1);
  }
  let cutting=0,alive=0;
  for(const th of e.data.threads){
    if(!th.cut){
      th.warn-=dt;
      if(th.warn<=0){th.cut=true;th.life=kz2?2.4:1.7;sparks((th.ax+th.bx)/2,(th.ay+th.by)/2,'#dfe7ee',10,150,.45,2,true);sfx.freeze();blip('sawtooth',700,200,.18,.1);}
    }else{
      th.life-=dt;if(th.life>0)alive++;
      if(th.life>0){
        cutting++;
        /* o fio esticado CORTA: quem cruza o segmento leva o golpe */
        if(!player.dead&&segDist(player.x,player.y,th.ax,th.ay,th.bx,th.by)<11+(player.hitR||player.r)*.5)hurtPlayer(); /* v1.4.6 hitR */
        if(Math.random()<dt*10)particles.push({x:lerp(th.ax,th.bx,Math.random()),y:lerp(th.ay,th.by,Math.random()),vx:rnd(-8,8),vy:rnd(-8,8),life:.35,t:0,r:1.6,c:'rgba(223,231,238,.6)',drag:1});
      }
    }
  }
  if(e.data.t>1.4&&alive===0)mbEnd(e);
  if(e.data.t>5.4)mbEnd(e);
}
}
function kzActStartGz(e){
const kz2=e.kzP2; /* v1.6.3: os cards novos usam a fase no Start */
/* v1.7.0: EDITOR DE MODS — despacho da spell card do mod */
if(e.pat==='kz_mod'&&window.__MODS){__MODS.spellStart(e);return;}
if(e.pat==='kz_fissure'){e.data={rows:0,t:0};}
else if(e.pat==='kz_ashstorm'){e.data={t:0,cast:false};}
else if(e.pat==='kz_core'){e.data={t:0,v:0};}
else if(e.pat==='kz_magma'){e.data={t:0,wave:0,launched:false,fired:false,sub:0,subT:0,max:kz2?2:1,gaps:[],horiz:true,dir:1,tag:'mz'+irnd(0,1e9)};texts.push({x:e.x,y:e.y-e.r-30,txt:'SPELL CARD — MARÉ DE MAGMA',t:0,life:1.5,c:'#ff8f3d',size:12,disp:true});}
}
function kzActUpdateGz(e,dt){
const kz2=e.kzP2;
/* v1.7.0: EDITOR DE MODS — despacho da spell card do mod */
if(e.pat==='kz_mod'&&window.__MODS){__MODS.spellUpdate(e,dt);return;}
if(e.pat==='kz_fissure'){
  /* FISSURAS — 3 linhas horizontais (na sua altura e vizinhas) cuspidas de fogo */
  e.data.t+=dt;
  if(e.data.rows<(kz2?4:3)&&e.data.t>.32){ /* v1.6.4: 4/3 fissuras (era 3/2) */
    e.data.t=0;e.data.rows++;
    const ly=clamp(ROOM.y+40+(e.data.rows%2?(ROOM.h-80)*.5:0)+(e.data.rows>2?(ROOM.h-80)*.75:0),ROOM.y+40,ROOM.y+ROOM.h-40);
    if(e.data.rows===1)ly=clamp(player.y,ROOM.y+40,ROOM.y+ROOM.h-40);
    kzWarn(ROOM.x+ROOM.w/2,ly,0,1.05,function(){
      for(let k=0;k<13;k++){ /* v1.6.4: 13 cusparadas por linha (era 10) */
        const fx=ROOM.x+50+k*(ROOM.w-100)/12;
        ebullets.push({x:fx,y:ly+rnd(-6,6),vx:rnd(-30,30),vy:rnd(-165,-115),r:7,c:'#ff8f3d',life:2.6}); /* v1.6.4: mais rápidas */
      }
      sfx.explode();game.shake=Math.max(game.shake,10);
    },'#ff8f3d','line',0);
    sfx.growl();
  }
  if(e.data.rows>=(kz2?4:3)&&e.data.t>1.2)mbEnd(e);
}else if(e.pat==='kz_ashstorm'){
  /* TEMPESTADE DE CINZAS — nuvens em serpentina atravessam a sala */
  e.data.t+=dt;
  if(!e.data.cast&&e.data.t>.4){
    e.data.cast=true;
    const n=kz2?14:10; /* v1.6.4: 14/10 nuvens (era 10/7) */
    for(let k=0;k<n;k++){
      const side=k%2?1:-1;
      ebullets.push({x:side>0?ROOM.x-30:ROOM.x+ROOM.w+30,y:ROOM.y+60+k*(ROOM.h-120)/Math.max(1,n-1),vx:side*rnd(150,190),vy:0,r:8,c:'#8f8577',sine:k,life:7}); /* v1.6.4: mais rápidas */
    }
    sfx.rumble();noiseSfx(.8,.2,300,'lowpass');
  }
  if(e.data.t>1.7)mbEnd(e);
}else if(e.pat==='kz_core'){
  /* NÚCLEO FUNDIDO — carrega 0.9s (glow) e explode em espiral tripla com brechas */
  e.data.t+=dt;
  if(e.data.t>.9&&e.data.v<(kz2?4:3)){ /* v1.6.4: 4/3 vagas de espiral (era 3/2) */
    e.data.v++;
    e.data.t=.9-.15;
    const off=rnd(TAU);
    for(let k=0;k<24;k++){ /* v1.6.4: 24 na volta (era 18) */
      if(k%6===5)continue; /* brecha fixa a cada volta */
      const a=off+k/24*TAU+e.data.v*.35;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*235,vy:Math.sin(a)*235,r:6,c:'#ff8f3d'}); /* v1.6.4: 235 (era 190) */
    }
    sfx.boom();game.shake=Math.max(game.shake,8);
  }
  if(e.data.v>=(kz2?4:3)&&e.data.t>.75)mbEnd(e);
}else if(e.pat==='kz_magma'){
  /* ===== v1.6.3: MARÉ DE MAGMA (feitiço assinatura do Golem) =====
     Uma onda de magma atravessa a arena de uma extremidade à outra. Antes de
     avançar, SINAIS LUMINOSOS revelam a direção e as posições das zonas
     seguras (faixas verdes). FASE II: uma SEGUNDA onda vem de outra direção
     DEPOIS que a primeira desaparece — e algumas zonas seguras mudam de lugar.
     Ela muda o ritmo da luta: enfrentar o ambiente, não só o chefe. */
  e.data.t+=dt;
  const d0=e.data;
  if(!d0.launched&&d0.wave<d0.max&&d0.t>.35){
    d0.launched=true;d0.t=0;
    d0.horiz=d0.wave===0; /* 1ª onda horizontal · 2ª (Fase II) vertical */
    d0.dir=Math.random()<.5?1:-1;
    const slots=14,gaps=[]; /* v1.6.4: 14 vagas (era 12) */
    while(gaps.length<(kz2?3:2)){
      const g=irnd(1,slots-2);
      if(gaps.indexOf(g)<0&&gaps.indexOf(g-1)<0&&gaps.indexOf(g+1)<0)gaps.push(g);
    }
    d0.gaps=gaps;d0.slots=slots;d0.sub=0;d0.subT=0;d0.fired=false;
    /* SINAIS: as zonas seguras no chão (faixas verde-musgo) + a borda de onde a maré nasce */
    const band=(d0.horiz?ROOM.h-60:ROOM.w-60)/slots;
    for(const g of gaps){
      const p0=(g+.5)/slots;
      const mx=d0.horiz?ROOM.x+ROOM.w/2:ROOM.x+30+p0*(ROOM.w-60);
      const my=d0.horiz?ROOM.y+30+p0*(ROOM.h-60):ROOM.y+ROOM.h/2;
      kzWarn(mx,my,band*.62,1.15,null,'#5ad0a0');
    }
    kzWarn(d0.horiz?(d0.dir>0?ROOM.x+16:ROOM.x+ROOM.w-16):ROOM.x+ROOM.w/2,
           d0.horiz?ROOM.y+ROOM.h/2:(d0.dir>0?ROOM.y+16:ROOM.y+ROOM.h-16),
           0,1.15,null,'#ff8f3d','line',d0.horiz?Math.PI/2:0);
    sfx.rumble();noiseSfx(.9,.22,240,'lowpass');
  }
  if(d0.launched&&!d0.fired){
    d0.subT+=dt;
    /* a maré avança em 3 cristas (mesmas brechas — as faixas seguras valem para todas) */
    if(d0.subT>.25&&d0.sub<4){ /* v1.6.4: 4 cristas (eram 3) */
      d0.subT=0;d0.sub++;
      const spd=d0.wave===0?(kz2?295:265):(kz2?375:340); /* v1.6.4: maré mais rápida */
      d0.spd=spd;
      for(let k=0;k<d0.slots;k++){
        if(d0.gaps.indexOf(k)>=0)continue;
        const p0=(k+.5)/d0.slots;
        let bx,by,vx,vy;
        if(d0.horiz){bx=d0.dir>0?ROOM.x-26:ROOM.x+ROOM.w+26;by=ROOM.y+30+p0*(ROOM.h-60);vx=d0.dir*spd;vy=0;}
        else{by=d0.dir>0?ROOM.y-26:ROOM.y+ROOM.h+26;bx=ROOM.x+30+p0*(ROOM.w-60);vx=0;vy=d0.dir*spd;}
        ebullets.push({x:bx,y:by,vx:vx,vy:vy,r:7,c:'#ff6b2d',life:8,tid:d0.tag});
      }
      if(d0.sub===1){sfx.explode();game.shake=Math.max(game.shake,11);game.flash=Math.max(game.flash,.14);}
      else sfx.spit();
    }
    if(d0.sub>=3&&d0.subT>.25){d0.fired=true;d0.t=0;}
  }
  if(d0.fired){
    /* FASE II: a 2ª onda SÓ nasce depois que a 1ª desaparece (contagem por tag) */
    let left=0;for(const b of ebullets)if(b.tid===d0.tag)left++;
    if(left===0||d0.t>7){
      d0.wave++;d0.launched=false;d0.fired=false;d0.t=0;
      if(d0.wave>=d0.max){mbEnd(e);}
    }
  }
  if(e.data.t>13)mbEnd(e);
}
}
/* ---- despachantes dos padrões exclusivos (por tipo de boss) ---- */
const _kzStartMap={mb:kzActStart,ex:kzActStartEx,vi:kzActStartVi,gz:kzActStartGz};
const _kzUpdateMap={mb:kzActUpdate,ex:kzActUpdateEx,vi:kzActUpdateVi,gz:kzActUpdateGz};
const _kzPatsMap={
mb:['kz_runes','kz_mirrors','kz_comets','kz_grimoire'],
ex:['kz_guillotine','kz_chain','kz_execute','kz_ricochet','kz_avanco','kz_morcegos'],
vi:['kz_web','kz_brood','kz_snare','kz_threads'],
gz:['kz_fissure','kz_ashstorm','kz_core','kz_magma']};
/* v1.6.3: OS QUATRO FEITIÇOS — o card ASSINATURA de cada miniboss:
   Bruxo → GRIMÓRIO RASGADO · Carrasco → INVESTIDA RICOCHETE ·
   Viúva → FIOS DA MORTE · Golem → MARÉ DE MAGMA.
   A Fase II dá a cada um a transformação mecânica própria (o card muda de
   comportamento aos 50% de vida) e o feitiço assinatura domina o sorteio. */
const _kzSignature={mb:'kz_grimoire',ex:'kz_ricochet',vi:'kz_threads',gz:'kz_magma'};
const _kzSigName={mb:'GRIMÓRIO RASGADO',ex:'INVESTIDA RICOCHETE',vi:'FIOS DA MORTE',gz:'MARÉ DE MAGMA'};
function mbSpawnWall(dir,e){
const gapA=irnd(2,10),gapB=irnd(2,10),spd=kzH(e)?320:295; /* v1.6.4: parede de bala mais rápida */
for(let i=0;i<14;i++){
if(kzH(e)?(i===gapA||i===gapB):(i===gapA||i===gapA+1||i===gapB||i===gapB+1))continue;
const y=ROOM.y+40+i*(ROOM.h-80)/13;
ebullets.push({x:dir>0?ROOM.x-30:ROOM.x+ROOM.w+30,y:y,vx:dir*spd,vy:0,r:6,c:'#cfd8dc'});
}
sfx.spit();sfx.growl();
}
function mbSpawnWallV(dir){
const gapA=irnd(2,10),gapB=irnd(2,10);
for(let i=0;i<14;i++){
if(i===gapA||i===gapA+1||i===gapB||i===gapB+1)continue;
const x=ROOM.x+40+i*(ROOM.w-80)/13;
ebullets.push({x:x,y:dir>0?ROOM.y-30:ROOM.y+ROOM.h+30,vx:0,vy:dir*240,r:6,c:'#cfd8dc'});
}
sfx.spit();sfx.growl();
}
function mbActUpdate(e,dt){
const pp=player;
/* v1.7.0: EDITOR DE MODS — despacho da spell card do mod */
if(e.pat==='kz_mod'&&window.__MODS){__MODS.spellUpdate(e,dt);return;}
/* v0.9.16: padrões exclusivos KAIZO — despachados por tipo de boss */
if(e.pat&&e.pat.indexOf('kz_')===0){(_kzUpdateMap[e.type]||function(){})(e,dt);return;}
if(e.pat==='spiral'){
e.data.tick-=dt;
if(e.data.tick<=0){
e.data.tick=kzH(e)?.04:.08;e.data.spin+=kzH(e)?.42:.3;
for(let k=0;k<(kzH(e)?5:2);k++){ /* v1.6.4: 5 braços no kaizo (eram 4) */
const a=e.data.spin+k*Math.PI/(kzH(e)?2.5:1);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*205,vy:Math.sin(a)*205,r:5,c:'#cfd8dc'}); /* v1.6.4: 205 (era 175) */
}
}
if(e.stT>=e.data.dur)mbEnd(e);
}else if(e.pat==='cross'){
e.data.salvoT-=dt;
if(e.data.salvoT<=0){
e.data.salvoT=kzH(e)?.28:.45;e.data.rot+=kzH(e)?.5:.35;
const m=kzH(e)?3:1;
for(let b=0;b<4;b++){
const base=e.data.rot+b*Math.PI/2;
for(let i=-m;i<=m;i++){
const a=base+i*.12;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*240,vy:Math.sin(a)*240,r:5,c:'#cfd8dc'});
}
}
sfx.spit();
}
if(e.stT>=e.data.dur)mbEnd(e);
}else if(e.pat==='crown'){
e.data.waveT-=dt;
const maxW=kzH(e)?5:3;
if(e.data.waveT<=0&&e.data.waves<maxW){
e.data.waves++;e.data.waveT=kzH(e)?.4:.6;
const n=kzH(e)?22:16,gapI=irnd(0,n-1),off=rnd(TAU);
for(let i=0;i<n;i++){
if(i===gapI||i===(gapI+1)%n)continue;
const a=off+i/n*TAU;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*215,vy:Math.sin(a)*215,r:5,c:'#cfd8dc'});
}
sfx.spit();sfx.growl();
}
if(e.data.waves>=maxW&&e.data.waveT<=-.1)mbEnd(e);
}else if(e.pat==='souls'){
if(!e.data.fired){
e.data.fired=true;
const base=Math.atan2(pp.y-e.y,pp.x-e.x),n=kzH(e)?9:5;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.25;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,r:6,c:'#e6f0f2',home:kzH(e)?2.8:2.2,homeT:kzH(e)?4.5:3.4});
}
sfx.howl();
}
if(e.stT>=.9)mbEnd(e);
}else if(e.pat==='blink'){
if(e.stT>=.35&&!e.data.moved){
e.data.moved=true;
sparks(e.x,e.y,'#31242e',14,200,.5,5);
const ta=rnd(TAU),td=kzH(e)?190:230;
const pt=roomPt(pp.x+Math.cos(ta)*td,pp.y+Math.sin(ta)*td,40);
e.x=pt.x;e.y=pt.y;
sparks(e.x,e.y,'#cfd8dc',14,220,.5,4,true);
blip('sawtooth',80,40,.3,.14);game.shake=Math.max(game.shake,6);
}
if(e.stT>=.5&&!e.data.fired){
e.data.fired=true;
const base=Math.atan2(pp.y-e.y,pp.x-e.x),n=kzH(e)?12:7;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.13;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*330,vy:Math.sin(a)*330,r:5,c:'#cfd8dc'});
}
const nh=kzH(e)?4:2;
for(let i=0;i<nh;i++){
const a=rnd(TAU);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*140,vy:Math.sin(a)*140,r:6,c:'#e6f0f2',home:2.2,homeT:3.2});
}
sfx.spit();sfx.howl();
}
if(e.stT>=.9)mbEnd(e);
}else if(e.pat==='frost'){
if(!e.data.f1){
e.data.f1=true;
if(dmk()){
/* v1.5.0: CÍRCULO COMPLETO congelante — camada 1 (sem brecha fixa) */
dmkCircle(e.x,e.y,Math.round((kzH(e)?20:15)*dmkDen()),(kzH(e)?240:215)*dmkSp(),{c:'#9fd8ff',slow:true,alt:.72});
}else{
rings.push({x:e.x,y:e.y,r:30,vr:kzH(e)?330:300,th:14,gapA:rnd(TAU),gapW:kzH(e)?.7:1,c:'#9fd8ff',slow:true});
}
sfx.freeze();sfx.howl();
}
if(e.stT>=.6&&!e.data.f2){
e.data.f2=true;
if(dmk()){
/* círculo rotativo: a camada 2 nasce girada — desenho em espiral de gelo */
dmkCircle(e.x,e.y,Math.round((kzH(e)?22:17)*dmkDen()),(kzH(e)?265:240)*dmkSp(),{c:'#9fd8ff',slow:true,alt:.72,off:.23});
}else{
rings.push({x:e.x,y:e.y,r:30,vr:kzH(e)?360:340,th:14,gapA:rnd(TAU),gapW:kzH(e)?.65:.95,c:'#9fd8ff',slow:true});
}
sfx.freeze();
}
if(kzH(e)&&e.stT>=.95&&!e.data.f3){
e.data.f3=true;
if(dmk()){
/* círculo + X: a geada fecha em cruz */
dmkCircle(e.x,e.y,Math.round(20*dmkDen()),255*dmkSp(),{c:'#9fd8ff',slow:true,alt:.75,off:.11});
dmkX(e.x,e.y,rnd(TAU),2,200*dmkSp(),{c:'#cfe9ff',slow:true,startDist:36});
}else{
rings.push({x:e.x,y:e.y,r:30,vr:340,th:14,gapA:rnd(TAU),gapW:.65,c:'#9fd8ff',slow:true});
}
sfx.freeze();
}
if(e.stT>=(kzH(e)?1.5:1.1))mbEnd(e);
}else if(e.pat==='wall'){
if(!e.data.w1){e.data.w1=true;mbSpawnWall(Math.random()<.5?1:-1,e);}
if(e.stT>=.8&&!e.data.w2){e.data.w2=true;mbSpawnWall(Math.random()<.5?1:-1,e);}
if(kzH(e)&&e.stT>=1.2&&!e.data.w3){e.data.w3=true;mbSpawnWall(Math.random()<.5?1:-1,e);}
if(e.stT>=(kzH(e)?1.8:1.3))mbEnd(e);
}else if(e.pat==='meteor'){
e.data.salvoT-=dt;
if(e.data.salvoT<=0&&e.data.s<(kzH(e)?6:3)){ /* v1.6.4: 6 salvos no kaizo (eram 5) */
e.data.s++;e.data.salvoT=kzH(e)?.36:.6;
const nm=kzH(e)?7:3; /* v1.6.4: 7 meteoros por salvo (eram 6) */
for(let i=0;i<nm;i++){
const a=rnd(TAU),dd=rnd(0,kzH(e)?180:130);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:kzH(e)?.55:.75,phase:'mark',c:'#cfd8dc'});
}
blip('sawtooth',110,70,.3,.08);
}
if(e.data.s>=(kzH(e)?6:3)&&e.stT>=(kzH(e)?2.4:1.9))mbEnd(e); /* v1.6.4: acompanha o novo teto de salvos */
}else if(e.pat==='shotgun'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.volleys<(kzH(e)?6:4)){ /* v1.6.4: 6 rajadas no kaizo (eram 5) */
e.data.volleys++;e.data.t=.2;
const base=Math.atan2(pp.y-e.y,pp.x-e.x),n=kzH(e)?10:6; /* v1.6.4: 10 chumbinhos (eram 8) */
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.10;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*385,vy:Math.sin(a)*385,r:5,c:'#cfd8dc'}); /* v1.6.4: 385 (era 340) */
}
sfx.spit();
}
if(e.data.volleys>=(kzH(e)?6:4)&&e.stT>=1.4)mbEnd(e);
}else if(e.pat==='rings'){
e.data.ringT-=dt;
if(e.data.ringT<=0&&e.data.rings<(kzH(e)?5:3)){ /* v1.6.4: 5 coroas no kaizo (eram 4) */
e.data.rings++;e.data.ringT=.44;e.data.gap+=1.1;
if(dmk()){
/* círculos consecutivos rotativos — o espelho cospe coroas cheias */
dmkCircle(e.x,e.y,Math.round((kzH(e)?22:14)*dmkDen()),(kzH(e)?330:270)*dmkSp(),{c:'#cfd8dc',off:e.data.gap,alt:.8}); /* v1.6.4: 22 balas (eram 18) */
}else{
rings.push({x:e.x,y:e.y,r:26,vr:kzH(e)?360:300,th:13,gapA:e.data.gap,gapW:.85,c:'#cfd8dc'}); /* v1.6.4: anel mais rápido */
}
sfx.freeze();
}
if(e.data.rings>=(kzH(e)?5:3)&&e.stT>=1.8)mbEnd(e);
}else if(e.pat==='bothwalls'){
if(!e.data.h){e.data.h=true;mbSpawnWall(1,e);mbSpawnWall(-1,e);}
if(e.stT>=.7&&!e.data.v){e.data.v=true;mbSpawnWallV(Math.random()<.5?1:-1);}
if(kzH(e)&&e.stT>=1.1&&!e.data.v2){e.data.v2=true;mbSpawnWallV(Math.random()<.5?1:-1);}
if(e.stT>=(kzH(e)?1.6:1.4))mbEnd(e);
}else if(e.pat==='twin'){
e.data.tick-=dt;
if(e.data.tick<=0){
e.data.tick=kzH(e)?.065:.09;e.data.spin+=.38; /* v1.6.4: gêmeo mais rápido */
const arms=kzH(e)?3:2;
for(let k=0;k<arms;k++){
const a=e.data.spin+k*Math.PI/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*205,vy:Math.sin(a)*205,r:5,c:'#cfd8dc'}); /* v1.6.4: 205 (era 175) */
const a2=-e.data.spin*1.15+k*Math.PI/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a2)*205,vy:Math.sin(a2)*205,r:5,c:'#e6f0f2'});
}
}
if(e.stT>=e.data.dur)mbEnd(e);
}else if(e.pat==='bounce'){
e.data.tick-=dt;
if(e.data.tick<=0){
e.data.tick=kzH(e)?.13:.22; /* v1.6.4: rebotes mais frequentes no kaizo */
const n=kzH(e)?4:2; /* v1.6.4: 4 bolas que quicam (eram 3) */
for(let i=0;i<n;i++){
const a=rnd(TAU);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(kzH(e)?295:215),vy:Math.sin(a)*(kzH(e)?295:215),r:6,c:'#cfd8dc',bounce:true,bounces:kzH(e)?4:3}); /* v1.6.4: 295 (era 260) */
}
sfx.spit();
}
if(e.stT>=e.data.dur)mbEnd(e);
}else if(e.pat==='flower'){
e.data.ringT-=dt;
const maxR=kzH(e)?5:3; /* v1.6.4: 5 coroas no kaizo (eram 4) */
if(e.data.ringT<=0&&e.data.rings<maxR){
e.data.rings++;e.data.ringT=.4;
const n=kzH(e)?17:12,off=e.data.rings*.26; /* v1.6.4: 17 pétalas (eram 14) */
for(let i=0;i<n;i++){
const a=off+i/n*TAU;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*215,vy:Math.sin(a)*215,r:5,c:'#cfd8dc'}); /* v1.6.4: 215 (era 185) */
}
sfx.spit();sfx.growl();
}
if(e.data.rings>=maxR&&e.data.ringT<=-.1)mbEnd(e);
}else if(e.pat==='snipe'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.shots<(kzH(e)?5:3)){
e.data.shots++;e.data.t=kzH(e)?.12:.17;
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(kzH(e)?500:440),vy:Math.sin(a)*(kzH(e)?500:440),r:5,c:'#e6f0f2'});
blip('sawtooth',200,90,.08,.07);
}
if(e.data.shots>=(kzH(e)?5:3)&&e.stT>=.9)mbEnd(e);
}else if(e.pat==='swarm'){
if(!e.data.fired){
e.data.fired=true;
const n=kzH(e)?16:8; /* v1.6.4: 16 perseguidores no kaizo (eram 12) */
for(let i=0;i<n;i++){
const a=i/n*TAU;
ebullets.push({x:e.x+Math.cos(a)*30,y:e.y+Math.sin(a)*30,vx:Math.cos(a)*(kzH(e)?160:105),vy:Math.sin(a)*(kzH(e)?160:105),r:6,c:'#e6f0f2',home:kzH(e)?2:1.6,homeT:5}); /* v1.6.4: 160 (era 130) */
}
sfx.howl();
}
if(e.stT>=1)mbEnd(e);
}
}
/* ============ o carrasco da penumbra ============ */
const EX_PATS=['axe','spin','quake','mines','charge','summon'];
function exEnd(e){e.st='float';e.stT=0;e.atkT=(kzH(e)?.85:1.8)+rnd(.5);} /* v1.6.4: kaizo re-ataca 23% mais rápido */
function exActStart(e){
/* v1.6.3: despacho dos padrões exclusivos kaizo (antes nunca eram lançados) */
if(e.pat&&e.pat.indexOf('kz_')===0){(_kzStartMap[e.type]||function(){})(e);return;}
if(e.pat==='axe')e.data={volleys:0,t:.1};
else if(e.pat==='spin')e.data={t:0};
else if(e.pat==='quake')e.data={salvo:0,t:.1};
else if(e.pat==='mines'){
const n=kzH(e)?9:6;
for(let i=0;i<n;i++){
const a=rnd(TAU),dd=rnd(90,240);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,50);
ebullets.push({x:pt.x,y:pt.y,vx:0,vy:0,r:9,c:'#e8455a',mine:true,armT:.6,life:kzH(e)?7:5});
}
sfx.growl();
}
else if(e.pat==='charge'){e.dashT=.5;e.dashA=Math.atan2(player.y-e.y,player.x-e.x);sfx.dash();sfx.roar();game.shake=8;}
else if(e.pat==='summon'){
const n=kzH(e)?3:2;
for(let i=0;i<n;i++){
const a=rnd(TAU),dd=rnd(110,170);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,60);
spawnMarks.push({x:pt.x,y:pt.y,type:kzH(e)?(Math.random()<.5?'ru':'sp'):'sh',t:0,dur:.75});
}
sfx.roar();
}
}
function exActUpdate(e,dt){
const pp=player;
/* v1.6.3: despacho dos padrões exclusivos kaizo */
if(e.pat&&e.pat.indexOf('kz_')===0){(_kzUpdateMap[e.type]||function(){})(e,dt);return;}
if(e.pat==='axe'){
e.data.t-=dt;
const maxV=kzH(e)?4:3;
if(e.data.t<=0&&e.data.volleys<maxV){
e.data.volleys++;e.data.t=kzH(e)?.42:.5;
const base=Math.atan2(pp.y-e.y,pp.x-e.x),n=kzH(e)?4:3;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.16;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(kzH(e)?280:235),vy:Math.sin(a)*(kzH(e)?280:235),r:9,c:'#e8455a'});
}
sfx.spit();game.shake=Math.max(game.shake,3);
}
if(e.data.volleys>=maxV&&e.stT>=1.2)exEnd(e);
}else if(e.pat==='spin'){
e.data.t-=dt;
if(e.data.t<=0){
e.data.t=kzH(e)?.1:.13;
const arms=kzH(e)?6:5,base=e.stT*2.6;
for(let b=0;b<arms;b++){
const a=base+b*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(kzH(e)?235:195),vy:Math.sin(a)*(kzH(e)?235:195),r:6,c:'#cfd8dc'});
}
if(Math.random()<.4)sfx.spit();
}
if(e.stT>=(kzH(e)?2.4:2))exEnd(e);
}else if(e.pat==='quake'){
e.data.t-=dt;
const maxS=kzH(e)?4:3;
if(e.data.t<=0&&e.data.salvo<maxS){
e.data.salvo++;e.data.t=kzH(e)?.65:.8;
const n=kzH(e)?6:5;
for(let i=0;i<n;i++){
const a=i/n*TAU+rnd(.4),dd=rnd(70,150);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:.75,phase:'mark',c:'#e8455a'});
}
geyserMarks.push({x:pp.x,y:pp.y,t:0,dur:.9,phase:'mark',c:'#e8455a'});
blip('sawtooth',110,60,.3,.09);game.shake=Math.max(game.shake,4);
}
if(e.data.salvo>=maxS&&e.stT>=1.4)exEnd(e);
}else if(e.pat==='mines'){
if(e.stT>=.6)exEnd(e);
}else if(e.pat==='charge'){
if(e.dashT>0){
e.dashT-=dt;
e.x+=Math.cos(e.dashA)*(kzH(e)?880:740)*dt;
e.y+=Math.sin(e.dashA)*(kzH(e)?880:740)*dt;
e.ang=e.dashA;
particles.push({x:e.x,y:e.y,vx:0,vy:0,life:.25,t:0,r:10,c:'#d9cfc0',alpha:.25,drag:0});
clampArena(e,e.r);
}else exEnd(e);
}else if(e.pat==='summon'){
if(e.stT>=.6)exEnd(e);
}
}
function carrascoAI(e,dt,a,d,slowMul){
e.stT+=dt;
if(e.st==='float'){
if(d>380){e.x+=Math.cos(a)*e.sp*slowMul*dt;e.y+=Math.sin(a)*e.sp*slowMul*dt;}
else if(d<260){e.x-=Math.cos(a)*e.sp*slowMul*dt;e.y-=Math.sin(a)*e.sp*slowMul*dt;}
else{const pp=Math.sin(game.t*.7+e.seed);e.x+=-Math.sin(a)*e.sp*.7*pp*dt;e.y+=Math.cos(a)*e.sp*.7*pp*dt;}
e.ang=lerpAngle(e.ang,a,1-Math.exp(-3*dt));
e.atkT-=dt;
if(e.atkT<=0){
/* v1.6.3: os padrões EXCLUSIVOS kaizo agora entram no ciclo de TODOS os
   minibosses — antes só o Bruxo sorteava os dele: o Carrasco, a Viúva e o
   Golem tinham feitiços exclusivos prontos, mas NUNCA os lançavam. */
if(e.kaizo){
/* v1.7.0: EDITOR DE MODS — a spell card vinculada substitui o sorteio */
if(window.__MODS&&__MODS.on()&&__MODS.spellFor(e.type)){e.pat='kz_mod';}
else{
const ex=_kzPatsMap[e.type]||[],exW=e.kzP2?.62:.4;
e.pat=(Math.random()<exW&&ex.length)?ex[irnd(0,ex.length-1)]:EX_PATS[irnd(0,EX_PATS.length-1)];
if(e.kzP2&&_kzSignature[e.type]&&Math.random()<.45)e.pat=_kzSignature[e.type];
}
}else{e.patIdx=(e.patIdx+1)%EX_PATS.length;e.pat=EX_PATS[e.patIdx];}
/* v1.7.1: EDITOR DE MODS — substituição de padrão (spell do mod / padrão do mod) */
if(window.__MODS&&__MODS.on()&&e.pat!=='kz_mod'){const _ms=__MODS.takeover(e.type,e.pat);if(_ms){e._modSpell=_ms;e.pat='kz_mod';}}
e.st='tele';e.stT=0;sfx.growl();if(e.kaizo)kzTeleMark(e);
}
}else if(e.st==='tele'){
if(e.stT>=((kzH(e)?.5:.65)*(e._neo?.6:1))){e.st=e.pat;e.stT=0;exActStart(e);}
}else exActUpdate(e,dt);
clampArena(e,e.r);
if(!player.dead&&d<e.r+(player.hitR||player.r)-4)hurtPlayer();
}
/* ============ A VIÚVA DA PENUMBRA ============ */
const VI_PATS=['webspray','summon','dash','ring','snare'];
function viEnd(e){e.st='float';e.stT=0;e.atkT=(kzH(e)?.7:1.4)+rnd(.4);} /* v1.6.4: kaizo re-ataca 22% mais rápido */
function viuvaAI(e,dt,a,d,slowMul){
e.stT+=dt;
if(e.st==='float'){
if(d>340){e.x+=Math.cos(a)*e.sp*slowMul*dt;e.y+=Math.sin(a)*e.sp*slowMul*dt;}
else if(d<240){e.x-=Math.cos(a)*e.sp*slowMul*dt;e.y-=Math.sin(a)*e.sp*slowMul*dt;}
else{const pp=Math.sin(game.t+e.seed);e.x+=-Math.sin(a)*e.sp*.8*pp*dt;e.y+=Math.cos(a)*e.sp*.8*pp*dt;}
e.ang=lerpAngle(e.ang,a,1-Math.exp(-3*dt));
e.atkT-=dt;
if(e.atkT<=0){
/* v1.6.3: idem — a Viúva agora também sorteia os feitiços exclusivos kaizo */
if(e.kaizo){
/* v1.7.0: EDITOR DE MODS — a spell card vinculada substitui o sorteio */
if(window.__MODS&&__MODS.on()&&__MODS.spellFor(e.type)){e.pat='kz_mod';}
else{
const ex=_kzPatsMap[e.type]||[],exW=e.kzP2?.62:.4;
e.pat=(Math.random()<exW&&ex.length)?ex[irnd(0,ex.length-1)]:VI_PATS[irnd(0,VI_PATS.length-1)];
if(e.kzP2&&_kzSignature[e.type]&&Math.random()<.45)e.pat=_kzSignature[e.type];
}
}else{e.patIdx=(e.patIdx+1)%VI_PATS.length;e.pat=VI_PATS[e.patIdx];}
/* v1.7.1: EDITOR DE MODS — substituição de padrão (spell do mod / padrão do mod) */
if(window.__MODS&&__MODS.on()&&e.pat!=='kz_mod'){const _ms=__MODS.takeover(e.type,e.pat);if(_ms){e._modSpell=_ms;e.pat='kz_mod';}}
e.st='tele';e.stT=0;sfx.growl();if(e.kaizo)kzTeleMark(e);
}
}else if(e.st==='tele'){
if(e.stT>=(.55*(e._neo?.6:1))){e.st=e.pat;e.stT=0;viStart(e);}
}else viUpdate(e,dt);
clampArena(e,e.r);
if(!player.dead&&d<e.r+(player.hitR||player.r)-4)hurtPlayer();
}
function viStart(e){
/* v1.6.3: despacho dos padrões exclusivos kaizo (antes nunca eram lançados) */
if(e.pat&&e.pat.indexOf('kz_')===0){(_kzStartMap[e.type]||function(){})(e);return;}
if(e.pat==='webspray')e.data={n:0,t:.15};
else if(e.pat==='summon')e.data={f:false};
else if(e.pat==='dash')e.data={dashes:0,waitT:.3};
else if(e.pat==='ring')e.data={f:false};
else if(e.pat==='snare')e.data={f:false};
}
function viUpdate(e,dt){
const pp=player,hard=kzH(e);
/* v1.6.3: despacho dos padrões exclusivos kaizo */
if(e.pat&&e.pat.indexOf('kz_')===0){(_kzUpdateMap[e.type]||function(){})(e,dt);return;}
if(e.pat==='webspray'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.n<(hard?3:2)){
e.data.n++;e.data.t=.55;
const base=Math.atan2(pp.y-e.y,pp.x-e.x),n=hard?9:7;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.17;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*185,vy:Math.sin(a)*185,r:6,c:'#9d6bb5',slowShot:true});
}
sfx.spit();
}
if(e.data.n>=(hard?3:2)&&e.stT>=1)viEnd(e);
}else if(e.pat==='summon'){
if(!e.data.f){
e.data.f=true;
const n=hard?4:3;
for(let i=0;i<n;i++){
const a=rnd(TAU),dd=rnd(100,200);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,60);
spawnMarks.push({x:pt.x,y:pt.y,type:'sh',t:0,dur:.8});
}
sfx.roar();
}
if(e.stT>=.7)viEnd(e);
}else if(e.pat==='dash'){
if(e.dashT>0){
e.dashT-=dt;
const v=hard?720:620;
e.x+=Math.cos(e.dashA)*v*dt;e.y+=Math.sin(e.dashA)*v*dt;
e.ang=e.dashA;
for(let k=0;k<2;k++)
ebullets.push({x:e.x+rnd(-8,8),y:e.y+rnd(-8,8),vx:rnd(-40,40),vy:rnd(-40,40),r:5,c:'#9d6bb5',slowShot:true});
clampArena(e,e.r);
if(e.dashT<=0)e.data.waitT=.4;
}else{
e.data.waitT-=dt;
if(e.data.waitT<=0){
if(e.data.dashes<(hard?3:2)){
e.data.dashes++;e.dashT=.4;
e.dashA=Math.atan2(pp.y-e.y,pp.x-e.x);
sfx.dash();sfx.growl();
}else viEnd(e);
}
}
}else if(e.pat==='ring'){
if(!e.data.f){
e.data.f=true;
if(dmk()){
/* v1.5.0: a Viúva tece — círculo rotativo + X cruzando o centro */
dmkCircle(e.x,e.y,Math.round((hard?20:15)*dmkDen()),(hard?300:270)*dmkSp(),{c:'#9d6bb5',slow:true,off:rnd(TAU),alt:.75});
dmkX(e.x,e.y,Math.atan2(pp.y-e.y,pp.x-e.x),2,(hard?250:225)*dmkSp(),{c:'#c9a0ff',slow:true,startDist:34});
}else{
rings.push({x:e.x,y:e.y,r:26,vr:hard?300:270,th:13,gapA:rnd(TAU),gapW:hard?.7:.9,c:'#9d6bb5',slow:true});
}
sfx.howl();
}
if(e.stT>=.8)viEnd(e);
}else if(e.pat==='snare'){
if(!e.data.f){
e.data.f=true;
const n=hard?7:5;
for(let i=0;i<n;i++){
const a=i/n*TAU,dd=rnd(60,170);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,40);
ebullets.push({x:pt.x,y:pt.y,vx:0,vy:0,r:9,c:'#9d6bb5',mine:true,armT:.7,life:hard?6:5});
}
sfx.growl();
}
if(e.stT>=.7)viEnd(e);
}
}
/* ============ O GOLEM DE CINZAS ============ */
const GZ_PATS=['beam','slam','rocks','charge','orbit'];
function gzEnd(e){e.st='float';e.stT=0;e.atkT=(kzH(e)?1.0:1.9)+rnd(.5);e.data={};} /* v1.6.4: kaizo re-ataca 23% mais rápido */
function golemAI(e,dt,a,d,slowMul){
e.stT+=dt;
if(e.st==='float'){
if(d>380){e.x+=Math.cos(a)*e.sp*slowMul*dt;e.y+=Math.sin(a)*e.sp*slowMul*dt;}
else{const pp=Math.sin(game.t*.6+e.seed);e.x+=-Math.sin(a)*e.sp*.6*pp*dt;e.y+=Math.cos(a)*e.sp*.6*pp*dt;}
e.ang=lerpAngle(e.ang,a,1-Math.exp(-2*dt));
e.atkT-=dt;
if(e.atkT<=0){
/* v1.6.3: idem — o Golem agora também sorteia os feitiços exclusivos kaizo */
if(e.kaizo){
/* v1.7.0: EDITOR DE MODS — a spell card vinculada substitui o sorteio */
if(window.__MODS&&__MODS.on()&&__MODS.spellFor(e.type)){e.pat='kz_mod';}
else{
const ex=_kzPatsMap[e.type]||[],exW=e.kzP2?.62:.4;
e.pat=(Math.random()<exW&&ex.length)?ex[irnd(0,ex.length-1)]:GZ_PATS[irnd(0,GZ_PATS.length-1)];
if(e.kzP2&&_kzSignature[e.type]&&Math.random()<.45)e.pat=_kzSignature[e.type];
}
}else{e.patIdx=(e.patIdx+1)%GZ_PATS.length;e.pat=GZ_PATS[e.patIdx];}
/* v1.7.1: EDITOR DE MODS — substituição de padrão (spell do mod / padrão do mod) */
if(window.__MODS&&__MODS.on()&&e.pat!=='kz_mod'){const _ms=__MODS.takeover(e.type,e.pat);if(_ms){e._modSpell=_ms;e.pat='kz_mod';}}
e.st='tele';e.stT=0;sfx.growl();if(e.kaizo)kzTeleMark(e);
}
}else if(e.st==='tele'){
if(e.stT>=(.7*(e._neo?.6:1))){e.st=e.pat;e.stT=0;gzStart(e);}
}else gzUpdate(e,dt);
clampArena(e,e.r);
if(!player.dead&&d<e.r+(player.hitR||player.r)-4)hurtPlayer();
}
function gzStart(e){
const hard=kzH(e),pp=player;
/* v1.6.3: despacho dos padrões exclusivos kaizo (antes nunca eram lançados) */
if(e.pat&&e.pat.indexOf('kz_')===0){(_kzStartMap[e.type]||function(){})(e);return;}
if(e.pat==='beam')e.data={beam:{ang:Math.atan2(pp.y-e.y,pp.x-e.x),t:0,dur:hard?2.8:2.2,warm:.6}};
else if(e.pat==='slam')e.data={jumped:false,fell:false};
else if(e.pat==='rocks')e.data={s:0,t:.1};
else if(e.pat==='charge'){e.dashT=.8;e.dashA=Math.atan2(pp.y-e.y,pp.x-e.x);sfx.dash();sfx.roar();game.shake=8;}
else if(e.pat==='orbit'){
const n=hard?14:10;
for(let i=0;i<n;i++)
ebullets.push({orbit:true,cx:e.x,cy:e.y,ang:i/n*TAU,orbR0:66,orbSpd:hard?2.4:1.9,orbT:0,orbDur:1.25,speed:hard?280:230,r:6,c:'#ff8f3d'});
sfx.howl();
}
}
function gzUpdate(e,dt){
const hard=kzH(e),pp=player;
/* v1.6.3: despacho dos padrões exclusivos kaizo */
if(e.pat&&e.pat.indexOf('kz_')===0){(_kzUpdateMap[e.type]||function(){})(e,dt);return;}
if(e.pat==='beam'){
const b=e.data.beam;
b.t+=dt;
if(b.t>=b.warm)b.ang+=dt*(hard?1.25:1.05);
const L=rayLen(e.x,e.y,b.ang);
const ex2=e.x+Math.cos(b.ang)*L,ey2=e.y+Math.sin(b.ang)*L;
if(b.t>=b.warm){
if(Math.random()<.8)particles.push({x:e.x+Math.cos(b.ang)*rnd(30,L),y:e.y+Math.sin(b.ang)*rnd(30,L),vx:rnd(-14,14),vy:rnd(-14,14),life:.25,t:0,r:2,c:'#ff8f3d',glow:true});
if(!player.dead&&segDist(player.x,player.y,e.x,e.y,ex2,ey2)<12+(player.hitR||player.r))hurtPlayer(); /* v1.4.6 hitR */
if(Math.random()<dt*6)blip('sawtooth',180,90,.06,.03);
}
if(b.t>=b.dur)gzEnd(e);
}else if(e.pat==='slam'){
if(!e.data.jumped){
e.data.jumped=true;
sparks(e.x,e.y,'#57504e',12,200,.5,4);
const pt=roomPt(pp.x,pp.y,70);
e.x=pt.x;e.y=pt.y;
sfx.roar();game.shake=Math.max(game.shake,10);
}
if(e.stT>=.75&&!e.data.fell){
e.data.fell=true;
if(dmk()){
/* v1.5.0: o impacto expulsa salvas radiais COMPLETAS (sem brecha) */
dmkCircle(e.x,e.y,Math.round((hard?22:16)*dmkDen()),(hard?330:290)*dmkSp(),{c:'#ff8f3d'});
}else{
rings.push({x:e.x,y:e.y,r:e.r,vr:hard?420:370,th:15,gapA:rnd(TAU),gapW:1.6,c:'#ff8f3d'});
}
sfx.explode();game.shake=Math.max(game.shake,14);
const n=hard?10:7;
for(let i=0;i<n;i++){
const a=i/n*TAU;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*230,vy:Math.sin(a)*230,r:6,c:'#ff8f3d'});
}
}
if(e.stT>=1.2)gzEnd(e);
}else if(e.pat==='rocks'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.s<(hard?7:5)){
e.data.s++;e.data.t=.3;
const nm=hard?3:2;
for(let i=0;i<nm;i++){
const a=rnd(TAU),dd=rnd(0,hard?230:170);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:.6,phase:'mark',c:'#ff8f3d'});
}
blip('sawtooth',110,60,.25,.08);
}
if(e.data.s>=(hard?7:5)&&e.stT>=1.3)gzEnd(e);
}else if(e.pat==='charge'){
if(e.dashT>0){
e.dashT-=dt;
e.x+=Math.cos(e.dashA)*(hard?560:470)*dt;
e.y+=Math.sin(e.dashA)*(hard?560:470)*dt;
e.ang=e.dashA;
particles.push({x:e.x,y:e.y,vx:0,vy:0,life:.3,t:0,r:12,c:'#57504e',alpha:.3,drag:0});
clampArena(e,e.r);
}else{
const n=hard?12:8;
for(let i=0;i<n;i++){
const a=i/n*TAU+rnd(.3);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*210,vy:Math.sin(a)*210,r:6,c:'#ff8f3d'});
}
sfx.spit();game.shake=Math.max(game.shake,8);
gzEnd(e);
}
}else if(e.pat==='orbit'){
if(e.stT>=1)gzEnd(e);
}
}
/* ============ O VELHO REI DO XADREZ — boss secreto ============ */
const RK_PATS=['peoes','torre','bispo','cavalo','rainha','xeque','grade','damas','roque','coroacao','cavalaria'];
function reiAny(){return enemies.find(function(e){return e.type==='rk'&&!e.dead;});}
function reiEnd(e){e.st='float';e.stT=0;e.atkT=(e.type==='rkm'?(game.hard?.7:1.5):(game.hard?.8:1.6))+rnd(.4);}
function reiAI(e,dt,a,d,slowMul){
e.stT+=dt;
if(e.type==='rk'&&!e.p2&&e.hp<=e.maxHp*.5){
e.p2=true;e.hp=Math.max(e.hp,1);
game.rkP2=true;game.rkUltT=game.hard?28:40;game.rkUlt=null;
for(let i=0;i<(game.hard?8:6);i++){
const aa=i/6*TAU+rnd(.4),dd=rnd(150,230);
const pt=roomPt(e.x+Math.cos(aa)*dd,e.y+Math.sin(aa)*dd,40);
spawnEnemy('rkm',pt.x,pt.y);
}
game.banner={type:'boss',txt:'FASE II — ESPELHOS DAS SOMBRAS',sub:'sombras não ferem nem morrem — só o rei verdadeiro ataca na cor certa',t:0,dur:3.6};
sfx.roar();sfx.howl();sfx.echo();
game.flash=.5;game.shake=18;
sparks(e.x,e.y,'#d8cfc0',24,300,.8,4,true);
}
if(e.st==='float'){
const sp2=(e.type==='rk'&&e.p2)?(game.hard?1.9:1.5):1;
if(d>380){e.x+=Math.cos(a)*e.sp*sp2*slowMul*dt;e.y+=Math.sin(a)*e.sp*sp2*slowMul*dt;}
else if(d<240){e.x-=Math.cos(a)*e.sp*sp2*slowMul*dt;e.y-=Math.sin(a)*e.sp*sp2*slowMul*dt;}
else{const pp=Math.sin(game.t*.7+e.seed);e.x+=-Math.sin(a)*e.sp*.7*pp*dt;e.y+=Math.cos(a)*e.sp*.7*pp*dt;}
e.atkT-=dt;
if(e.atkT<=0){
const pats=e.pats||RK_PATS;
e.patIdx=(e.patIdx+1)%pats.length;e.pat=pats[e.patIdx];
e.st='tele';e.stT=0;blip('sine',140,90,.3,.08);
}
}else if(e.st==='tele'){
if(e.stT>=(e.type==='rkm'?(game.hard?.42:.55):(game.hard?.5:.7))){e.st=e.pat;e.stT=0;rkStart(e);}
}else rkUpdate(e,dt);
clampArena(e,e.r);
/* Sombras (rkm) não causam dano de contato — apenas o rei verdadeiro (rk) fere. */
if(e.type==='rk'&&!player.dead&&d<e.r+(player.hitR||player.r)-4)hurtPlayer();
}
function rkStart(e){
if(e.pat==='peoes')e.data={f:false};
else if(e.pat==='torre')e.data={beams:{ang:Math.atan2(player.y-e.y,player.x-e.x),t:0,dur:game.hard?3.4:2.8,warm:.7}};
else if(e.pat==='bispo')e.data={volleys:0,t:.2};
else if(e.pat==='cavalo'||e.pat==='cavalaria')e.data={jumps:0,tele:false,jumped:false};
else if(e.pat==='rainha')e.data={spin:rnd(TAU),tick:0,dur:game.hard?3:2.4};
else if(e.pat==='xeque')e.data={waves:0,wt:.1};
else if(e.pat==='grade')e.data={rows:0,t:.15};
else if(e.pat==='damas')e.data={f:false};
else if(e.pat==='roque')e.data={f:false,f2:false};
else if(e.pat==='coroacao')e.data={s:0,t:.15};
}
function rkUpdate(e,dt){
const hard=game.hard,pp=player;
/* Sombras (rkm) jogam ataques com cor "errada" (falsa) — assim o jogador
pode distinguir qual rei está atacando na cor certa (o verdadeiro). */
const fake=shadowInvuln(e);
const BC=fake?RKM_FAKE_COLOR:'#ffd9a0';
const BC2=fake?RKM_FAKE_COLOR_2:'#e6dac4';
if(e.pat==='peoes'){
if(!e.data.f){
e.data.f=true;
const n=hard?8:5;
for(let i=0;i<n;i++){
const a=rnd(TAU),dd=rnd(110,200);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,50);
/* sombras invocam somente a marca visual — sem pn real para não ferir o jogador */
if(!fake)spawnMarks.push({x:pt.x,y:pt.y,type:'pn',t:0,dur:.8});
else spawnMarks.push({x:pt.x,y:pt.y,type:'pn',t:0,dur:.8,fake:true});
}
sfx.roar();
}
if(e.stT>=.8)reiEnd(e);
}else if(e.pat==='torre'){
const b=e.data.beams;b.t+=dt;
if(b.t>=b.warm)b.ang+=dt*(hard?1.05:.85);
if(b.t>=b.warm){
for(let k=0;k<4;k++){
const ba=b.ang+k*Math.PI/2;
const L=rayLen(e.x,e.y,ba);
const ex2=e.x+Math.cos(ba)*L,ey2=e.y+Math.sin(ba)*L;
if(Math.random()<.6)particles.push({x:e.x+Math.cos(ba)*rnd(30,L),y:e.y+Math.sin(ba)*rnd(30,L),vx:rnd(-12,12),vy:rnd(-12,12),life:.25,t:0,r:2,c:BC,glow:true});
/* sombras não causam dano — seu beam é só visual/mentira */
if(!fake&&!player.dead&&segDist(player.x,player.y,e.x,e.y,ex2,ey2)<13+(player.hitR||player.r))hurtPlayer(); /* v1.4.6 hitR */
}
if(Math.random()<dt*5)blip('sawtooth',180,90,.06,.03);
}
if(b.t>=b.dur)reiEnd(e);
}else if(e.pat==='bispo'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.volleys<(hard?4:3)){
e.data.volleys++;e.data.t=.6;
for(let k=0;k<4;k++){
const a=Math.PI/4+k*Math.PI/2;
for(let i=-1;i<=1;i++){
const aa=a+i*.1;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*(hard?230:195),vy:Math.sin(aa)*(hard?230:195),r:6,c:BC,fake:fake});
}
}
sfx.spit();
}
if(e.data.volleys>=(hard?4:3)&&e.stT>=1.2)reiEnd(e);
}else if(e.pat==='cavalo'||e.pat==='cavalaria'){
if(!e.data.tele){
e.data.tele=true;
sparks(e.x,e.y,'#d8cfc0',8,160,.4,3);
e.data.tx=clamp(pp.x+rnd(-70,70),ROOM.x+60,ROOM.x+ROOM.w-60);
e.data.ty=clamp(pp.y+rnd(-70,70),ROOM.y+60,ROOM.y+ROOM.h-60);
}
if(e.stT>=.55&&!e.data.jumped){
e.data.jumped=true;
sparks(e.x,e.y,'#d8cfc0',10,180,.4,3);
e.x=e.data.tx;e.y=e.data.ty;
sparks(e.x,e.y,BC,14,220,.5,3,true);
sfx.thud();game.shake=Math.max(game.shake,8);
if(dmk()){
/* v1.5.0: a cavalgada parte em X — quatro diagonais do salto */
dmkX(e.x,e.y,Math.atan2(pp.y-e.y,pp.x-e.x),Math.round((e.pat==='cavalaria'?3:2)*dmkDen()),(hard?330:290)*dmkSp(),{c:BC,fake:fake,startDist:30});
}else{
rings.push({x:e.x,y:e.y,r:20,vr:hard?380:330,th:12,gapA:rnd(TAU),gapW:1.4,c:BC,fake:fake});
}
const n=e.pat==='cavalaria'?12:8;
for(let i=0;i<n;i++){const a=i/n*TAU;ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*190,vy:Math.sin(a)*190,r:5,c:BC,fake:fake});}
e.data.jumps++;
if(e.data.jumps<(hard?3:2)){e.data.tele=false;e.data.jumped=false;e.stT=0;}
}
if(e.data.jumps>=(hard?3:2)&&e.stT>=.6)reiEnd(e);
}else if(e.pat==='rainha'){
e.data.tick-=dt;
if(e.data.tick<=0){
e.data.tick=hard?.07:.09;e.data.spin+=.4;
const arms=hard?3:2;
for(let k=0;k<arms;k++){
const a=e.data.spin+k*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*200,vy:Math.sin(a)*200,r:5,c:BC2,fake:fake});
const a2=-e.data.spin*1.2+k*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a2)*160,vy:Math.sin(a2)*160,r:5,c:BC,fake:fake});
}
if(Math.random()<.4)sfx.spit();
}
if(e.stT>=e.data.dur)reiEnd(e);
}else if(e.pat==='xeque'){
e.data.wt-=dt;
if(e.data.wt<=0&&e.data.waves<2){
e.data.waves++;e.data.wt=1.1;
const cell=95;
for(let gx=ROOM.x+50;gx<ROOM.x+ROOM.w-40;gx+=cell){
for(let gy=ROOM.y+50;gy<ROOM.y+ROOM.h-40;gy+=cell){
const parity=Math.floor(gx/cell)+Math.floor(gy/cell);
if((parity+e.data.waves)%2===0){
const pt=roomPt(gx,gy,30);
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:.8,phase:'mark',c:BC,fake:fake});
}
}
}
blip('sawtooth',120,60,.3,.09);game.shake=Math.max(game.shake,5);
}
if(e.data.waves>=2&&e.stT>=2)reiEnd(e);
}else if(e.pat==='grade'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.rows<(hard?3:2)){
e.data.rows++;e.data.t=.7;
const horiz=e.data.rows%2===1;
const n=12,gap=irnd(0,n-1);
for(let i=0;i<n;i++){
if(i===gap||i===(gap+1)%n)continue;
if(horiz){
const y=ROOM.y+46+i*(ROOM.h-92)/(n-1);
ebullets.push({x:ROOM.x-30,y:y,vx:250,vy:0,r:6,c:BC,fake:fake});
}else{
const x=ROOM.x+46+i*(ROOM.w-92)/(n-1);
ebullets.push({x:x,y:ROOM.y-30,vx:0,vy:250,r:6,c:BC2,fake:fake});
}
}
sfx.spit();sfx.growl();
}
if(e.data.rows>=(hard?3:2)&&e.stT>=1.6)reiEnd(e);
}else if(e.pat==='damas'){
if(!e.data.f){
e.data.f=true;
const n=hard?10:7;
for(let i=0;i<n;i++){
const a=i/n*TAU;
const pt=roomPt(e.x+Math.cos(a)*(e.r+40),e.y+Math.sin(a)*(e.r+40),30);
if(!fake)spawnMarks.push({x:pt.x,y:pt.y,type:'pn',t:0,dur:.7+i*.06});
else spawnMarks.push({x:pt.x,y:pt.y,type:'pn',t:0,dur:.7+i*.06,fake:true});
}
sfx.roar();
}
if(e.stT>=.9)reiEnd(e);
}else if(e.pat==='roque'){
if(!e.data.f){
e.data.f=true;
sparks(e.x,e.y,'#d8cfc0',10,160,.4,3);
const pt=roomPt(pp.x+rnd(-160,160),pp.y+rnd(-120,120),40);
e.x=pt.x;e.y=pt.y;
sparks(e.x,e.y,BC,16,240,.5,3,true);
blip('sine',200,90,.25,.09);
sfx.thud();game.shake=Math.max(game.shake,7);
}
if(e.stT>=.6&&!e.data.f2){
e.data.f2=true;
if(dmk()){
/* v1.5.0: o roque coroa o tabuleiro — dois círculos em camadas + X de bispo */
dmkCircle(e.x,e.y,Math.round(18*dmkDen()),(hard?320:290)*dmkSp(),{c:BC,fake:fake,off:rnd(TAU)});
dmkCircle(e.x,e.y,Math.round(14*dmkDen()),(hard?250:230)*dmkSp(),{c:BC2,fake:fake,off:rnd(TAU)+.31,alt:.72});
dmkX(e.x,e.y,Math.PI/4,2,(hard?230:210)*dmkSp(),{c:BC,fake:fake,startDist:40,quiet:true});
}else{
rings.push({x:e.x,y:e.y,r:26,vr:hard?360:320,th:13,gapA:rnd(TAU),gapW:hard?.7:.9,c:BC,fake:fake});
rings.push({x:e.x,y:e.y,r:26,vr:hard?300:270,th:12,gapA:rnd(TAU)+1,gapW:hard?.7:.9,c:BC2,fake:fake});
}
sfx.howl();
}
if(e.stT>=1.1)reiEnd(e);
}else if(e.pat==='coroacao'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.s<(hard?6:4)){
e.data.s++;e.data.t=.28;
const nm=hard?4:3;
for(let i=0;i<nm;i++){
const a=rnd(TAU),dd=rnd(0,220);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:.6,phase:'mark',c:BC,fake:fake});
}
blip('sawtooth',120,60,.25,.08);
}
if(e.data.s>=(hard?6:4)&&e.stT>=1.2)reiEnd(e);
}
}
/* ultimate: o xeque-mate absoluto (hitkill se não rebater) */
function updateReiUltimate(dt){
if(!game.rkP2)return;
const r=enemies.find(e=>e.type==='rk'&&!e.dead);
if(!r){game.rkP2=false;game.rkUlt=null;return;}
if(game.rkUlt){
const u=game.rkUlt;
u.t+=dt;
if(u.phase==='charge'){
game.shake=Math.max(game.shake,3);
if(u.t>=u.dur){u.phase='window';u.t=0;u.hold=0;sfx.howl();}
}else if(u.phase==='window'){
/* novo parry: golpeie o rei com armas de curta distância para rebater o ultimate */
if(game.meleeHitT>0&&game.meleeHitRk){
u.hold=Math.min(.7,u.hold+.36);
game.meleeHitT=0;
game.flash=Math.max(game.flash,.22);game.shake=Math.max(game.shake,9);
sfx.parry();sparks(r.x,r.y,'#ffd9a0',12,260,.5,3,true);
}else u.hold=Math.max(0,u.hold-dt*.35);
if(u.hold>=.7){
game.rkUlt=null;
game.rkUltT=Math.max(game.rkUltT,25);
r.st='recover';r.t=0;r.recDur=4;
game.flash=.5;game.shake=16;
sfx.parry();sfx.roar();
sparks(r.x,r.y,'#ffd9a0',26,300,.8,4,true);
game.banner={type:'small',txt:'ULTIMATE REBATIDO!',sub:'o rei vacilou — golpie-o',t:0,dur:2};
}else if(u.t>=1.5){
game.rkUlt=null;
killPlayerInstant('XEQUE-MATE ABSOLUTO');
}
}
}else{
game.rkUltT-=dt;
if(game.rkUltT<=0){
game.rkUlt={t:0,phase:'charge',dur:2.4,hold:0};
sfx.roar();game.flash=.3;
}
}
}
function drawReiUltimate(){
if(!game.rkUlt)return;
const r=enemies.find(e=>e.type==='rk'&&!e.dead);
if(!r)return;
const u=game.rkUlt;
if(u.phase==='charge'){
const p=u.t/u.dur;
ctx.save();
ctx.globalAlpha=.25+.2*Math.sin(game.t*16);
ctx.strokeStyle='#ffd9a0';ctx.lineWidth=6;
ctx.beginPath();ctx.arc(r.x,r.y,60+p*420,0,TAU);ctx.stroke();
ctx.globalAlpha=.8;
ctx.setLineDash([16,12]);
ctx.strokeStyle='#d9465a';ctx.lineWidth=3;
ctx.beginPath();ctx.arc(r.x,r.y,60+p*420,0,TAU);ctx.stroke();
ctx.setLineDash([]);
ctx.globalAlpha=Math.min(1,p*1.4);
txt('XEQUE-MATE ABSOLUTO',W/2,H*.16,DISP,52,'#d9465a');
ctx.globalAlpha=1;
ctx.restore();
}else if(u.phase==='window'){
const f=u.hold/.7;
ctx.save();
ctx.fillStyle='rgba(5,3,4,.35)';ctx.fillRect(0,0,W,H);
txt('GOLPEIE O REI !!!',W/2,H*.2+rnd(-2,2),MONO,34,'#ffd9a0','center',6);
txt('MORDIDA · SERRA · LÂMINA — ACERTE A HITBOX NELE',W/2,H*.24,MONO,12,'#9c8f7c','center',3);
ctx.strokeStyle='#ffd9a0';ctx.lineWidth=8;
ctx.beginPath();ctx.arc(W/2,H*.3,60,-Math.PI/2,-Math.PI/2+TAU*Math.max(.01,f));ctx.stroke();
ctx.globalAlpha=.3;
ctx.beginPath();ctx.arc(W/2,H*.3,72,0,TAU);ctx.stroke();
ctx.restore();
}
}
/* cutscene única do rei */
const REI_LINES=[
{t0:1.0,t1:4.4,txt:'o cão...mesmo eu me escondendo me achou...'},
{t0:5.0,t1:8.4,txt:'mas isso não irá acontecer novamente.'},
{t0:9.0,t1:12.4,txt:'como me encontrou? como atravessou a penumbra sozinho?'},
{t0:13.0,t1:16.4,txt:'pereça cão.'}];
const REI_TOTAL=19.5;
function updateReiIntro(dt){
game.reiT+=dt;
const t=game.reiT;
if(Math.random()<dt*3)blip('sine',rnd(90,160),rnd(60,110),.4,.05);
if(t>16&&t<17.5)game.shake=Math.max(game.shake,2);
if(!game.reiSpawned&&t>=17){
game.reiSpawned=true;game.flash=.5;game.shake=16;
sfx.roar();
}
if(t>=REI_TOTAL){
game.state='play';
spawnMarkAt('rk',game.absMain.x+game.absMain.w/2,game.absMain.y+game.absMain.h*.32,true);
game.banner={type:'boss',txt:'O VELHO REI DO XADREZ',sub:'xeque ao cachorro',t:0,dur:2.4};
}
}
function drawKingPiece(x,y,s,col,alpha){
ctx.save();
ctx.translate(x,y);ctx.scale(s,s);
if(alpha!==undefined)ctx.globalAlpha=alpha;
ctx.fillStyle=col;ctx.strokeStyle='#241b16';ctx.lineWidth=2.4;
ctx.beginPath();ctx.moveTo(-17,42);ctx.lineTo(17,42);ctx.lineTo(12,28);ctx.lineTo(-12,28);ctx.closePath();ctx.fill();ctx.stroke();
ctx.beginPath();ctx.moveTo(-12,28);ctx.bezierCurveTo(-13,10,-7,6,-6,2);ctx.lineTo(6,2);ctx.bezierCurveTo(7,6,13,10,12,28);ctx.closePath();ctx.fill();ctx.stroke();
ctx.fillRect(-10,-2,20,6);ctx.strokeRect(-10,-2,20,6);
ctx.beginPath();ctx.arc(0,-12,9,0,TAU);ctx.fill();ctx.stroke();
ctx.fillRect(-2,-27,4,8);ctx.strokeRect(-2,-27,4,8);
ctx.fillRect(-6,-24.5,12,3);ctx.strokeRect(-6,-24.5,12,3);
ctx.restore();
}
/* o corpo negro do rei */
function drawReiBody(x,y,r,mirror,alpha){
const pz=game.puzzle;const runeCount=pz&&Array.isArray(pz.need)?pz.need.length:3;
ctx.save();
ctx.translate(x,y);
if(mirror)ctx.scale(-1,1);
if(alpha!==undefined)ctx.globalAlpha=alpha;
const sway=Math.sin(game.t*1.2)*3;
ctx.globalAlpha=(alpha!==undefined?alpha:1)*(.2+.08*Math.sin(game.t*3));
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(0,0,r+38,0,TAU);ctx.fill();
ctx.globalAlpha=alpha!==undefined?alpha:1;
ctx.beginPath();
ctx.moveTo(-r*1.05,r*1.15);
ctx.quadraticCurveTo(-r*1.15,-r*.2,-r*.55,-r*.55+sway);
ctx.quadraticCurveTo(0,-r*.95,r*.55,-r*.55-sway);
ctx.quadraticCurveTo(r*1.15,-r*.2,r*1.05,r*1.15);
ctx.quadraticCurveTo(0,r*.85,-r*1.05,r*1.15);
ctx.closePath();
ctx.fillStyle='#0a0810';
ctx.fill();
ctx.strokeStyle='#2a2030';ctx.lineWidth=2.5;
ctx.stroke();
ctx.strokeStyle='#1a1420';ctx.lineWidth=2;
for(let k=0;k<6;k++){
const a=-Math.PI*.85+k*.24;
ctx.beginPath();
ctx.moveTo(Math.cos(a)*r*1.02,Math.sin(a)*r*.9);
ctx.lineTo(Math.cos(a)*r*1.02+rnd(-2,2),Math.sin(a)*r*.9+rnd(8,16));
ctx.stroke();
}
/* caveiras negras bordadas */
for(let k=0;k<runeCount;k++){
const sx=(-.45+k*.45)*r,sy=(-.1+((k%2)?.28:-.12))*r;
ctx.save();ctx.translate(sx,sy);
ctx.fillStyle='#1c1c22';
ctx.beginPath();ctx.arc(0,0,6.5,0,TAU);ctx.fill();
ctx.fillStyle='#3a3a44';
ctx.beginPath();ctx.moveTo(-4,4);ctx.lineTo(-3,8);ctx.lineTo(-1.5,4);ctx.closePath();ctx.fill();
ctx.beginPath();ctx.moveTo(4,4);ctx.lineTo(3,8);ctx.lineTo(1.5,4);ctx.closePath();ctx.fill();
ctx.fillStyle='#57504e';
ctx.beginPath();ctx.arc(-2.3,-1.5,1.5,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(2.3,-1.5,1.5,0,TAU);ctx.fill();
ctx.restore();
}
/* cabeça humana vermelha */
const hy=-r*.62;
ctx.beginPath();
ctx.ellipse(0,hy,r*.42,r*.5,0,0,TAU);
ctx.fillStyle='#a01828';
ctx.fill();
ctx.strokeStyle='#5e0e1a';ctx.lineWidth=2;
ctx.stroke();
ctx.strokeStyle='#5e0e1a';ctx.lineWidth=1.6;
ctx.beginPath();ctx.moveTo(-r*.18,hy-r*.2);ctx.lineTo(-r*.08,hy-r*.22);ctx.stroke();
ctx.beginPath();ctx.moveTo(r*.18,hy-r*.2);ctx.lineTo(r*.08,hy-r*.22);ctx.stroke();
ctx.beginPath();ctx.moveTo(-r*.14,hy+r*.16);ctx.quadraticCurveTo(0,hy+r*.24,r*.14,hy+r*.16);ctx.stroke();
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.ellipse(-r*.16,hy-r*.05,r*.08,r*.045,0,0,TAU);ctx.fill();
ctx.beginPath();ctx.ellipse(r*.16,hy-r*.05,r*.08,r*.045,0,0,TAU);ctx.fill();
ctx.fillStyle='#fff';
ctx.beginPath();ctx.arc(-r*.17,hy-r*.05,1.6,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(r*.17,hy-r*.05,1.6,0,TAU);ctx.fill();
/* cobras saindo da cabeça */
for(let k=0;k<8;k++){
const ba=-Math.PI*.9+k*(Math.PI*.8/7)+Math.sin(game.t*2.2+k)*.16;
let cx=0,cy=hy-r*.3;
let px=cx,py=cy;
const segs=5;
for(let s2=1;s2<=segs;s2++){
const t2=s2/segs;
const wig=Math.sin(game.t*4+k*1.7+s2)*(.28*(1-t2)+.12);
const aa=ba+wig;
const len=r*.34*(1-t2*.35);
cx+=Math.cos(aa)*len*.55;
cy+=Math.sin(aa)*len*.55-r*.05;
ctx.strokeStyle='#161020';ctx.lineWidth=Math.max(1.2,4.4*(1-t2*.6));
ctx.lineCap='round';
ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(cx,cy);ctx.stroke();
px=cx;py=cy;
}
ctx.fillStyle='#7e1626';
ctx.beginPath();ctx.arc(px,py,3.2,0,TAU);ctx.fill();
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(px-1,py-.6,.9,0,TAU);ctx.fill();
}
ctx.restore();
}
function drawReiIntro(){
const t=game.reiT;
ctx.fillStyle='rgba(3,2,3,.88)';ctx.fillRect(0,0,W,H);
const ck=ramp(t,0,1.6)*.5;
if(ck>0){
const cs=80;
for(let gx=0;gx<W;gx+=cs)for(let gy=0;gy<H;gy+=cs){
const par=(Math.floor(gx/cs)+Math.floor(gy/cs))&1;
ctx.fillStyle=par?'rgba(216,207,192,'+(ck*.10)+')':'rgba(10,8,10,'+(ck*.22)+')';
ctx.fillRect(gx,gy,cs,cs);
}
}
if(t<6&&Math.random()<.5)particles.push({x:rnd(W),y:-20,vx:rnd(-10,10),vy:rnd(120,260),life:2.2,t:0,r:3,c:'#d8cfc0',drag:0});
for(const L of REI_LINES){
const a=ramp(t,L.t0,L.t0+.6)*(1-ramp(t,L.t1-.4,L.t1));
if(a<=0)continue;
ctx.globalAlpha=a;
txt(L.txt,W/2+rnd(-1,1),H*.3,MONO,16,'#e6dac4','center',2);
ctx.globalAlpha=a*.4;
txt(L.txt,W/2+2,H*.3+2,MONO,16,'#ffd9a0','center',2);
ctx.globalAlpha=1;
}
if(t>5){
const mat=ramp(t,5,16.5);
drawReiBody(W/2,H*.62,(.5+mat*.9)*34,false,mat);
}
if(t>=17){
const a=ramp(t,17,17.6);
ctx.globalAlpha=a;
txt('O VELHO REI DO XADREZ',W/2+rnd(-2,2),H*.22,DISP,68,'#e6dac4');
ctx.globalAlpha=a*.5;
txt('O VELHO REI DO XADREZ',W/2+4,H*.22+3,DISP,68,'#ffd9a0');
ctx.globalAlpha=a;
txt('ELE JOGA COM OS MORTOS',W/2,H*.22+60,MONO,13,'#ffd9a0','center',7);
ctx.globalAlpha=1;
}
}
/* despedida do rei */
const REI_DEATH_LINES=[
{t0:.8,t1:3.2,txt:'...não... espere...'},
{t0:3.6,t1:6.4,txt:'quem é você? eu não me lembro....'},
{t0:6.8,t1:9.0,txt:'até nos vermos novamente...'},
{t0:9.4,t1:11.2,txt:'...adeus...'}];
const REI_DEATH_TOTAL=13.5;
function updateReiDeath(dt){
game.reiT+=dt;
updatePlayer(dt);
const t=game.reiT;
if(t>2&&Math.random()<dt*10){
particles.push({x:game.reiX+rnd(-26,26),y:game.reiY+rnd(-60,40),vx:rnd(-30,30),vy:rnd(-140,-40),life:rnd(.8,1.6),t:0,r:rnd(2,4),c:Math.random()<.5?'#d8cfc0':'#8b8581',drag:.8});
}
if(t>=REI_DEATH_TOTAL){
pickups.push({type:'kingsoul',x:game.reiX,y:game.reiY,t:0,ph:rnd(TAU)});
const rr=game.mapRooms[game.roomIdx];
if(rr&&!rr.cleared){rr.cleared=true;game.waveState='done';openDoors();checkFullSweep();}
if(window.__RM)window.__RM.onRoomClear(rr); /* v1.4.0 */
game.state='play';
game.banner={type:'small',txt:'ELE DEIXOU ALGO PARA TRÁS',sub:'a alma do rei antigo pulsa no chão',t:0,dur:2.4};
sfx.echo();
}
}
function drawReiDeathUI(){
const t=game.reiT;
ctx.fillStyle='rgba(3,2,3,.62)';ctx.fillRect(0,0,W,H);
const al=1-ramp(t,9,11.5);
if(al>0)drawReiBody(game.reiX,game.reiY,34,false,al);
for(const L of REI_DEATH_LINES){
const a=ramp(t,L.t0,L.t0+.5)*(1-ramp(t,L.t1-.3,L.t1));
if(a<=0)continue;
ctx.globalAlpha=a;
txt(L.txt,W/2,H*.62,MONO,17,'#e6dac4','center',2);
ctx.globalAlpha=1;
}
}
/* alma do rei antigo */
function updateKingSoul(dt){
if(!game.kingsoul||player.dead)return;
game.kingT-=dt;
if(game.kingT>0)return;
game.kingT=8;
let tx=null,ty=null;
const alive=enemies.filter(e=>!e.dead&&e.spawnT>.5);
if(alive.length){const e2=pick(alive);tx=e2.x;ty=e2.y;}
else if(boss.active&&!boss.dying&&boss.scale>.98&&!boss.introLock){
const hs=boss.heads.filter(h=>h.alive);
if(hs.length){const h2=pick(hs);tx=h2.hx;ty=h2.hy;}
}
if(tx===null)return;
geyserMarks.push({x:tx,y:ty,t:0,dur:.75,phase:'mark',c:'#ffd9a0',friendly:true,dmg:(38+game.floor*8)*P.dmgMult,rad:75});
blip('sine',600,180,.2,.07);
texts.push({x:tx,y:ty-34,txt:'XEQUE',t:0,life:.7,c:'#ffd9a0',size:13,disp:true});
}
/* ============ ERRO 404 ============ */
const E404_PATS=['espiral','muros','cruz','flor','sniper','almas','minas','meteoro','blink','investida','aneis','orbita','cortina','clones','glitch'];
function e404Any(){return enemies.find(function(e){return e.type==='e404'&&!e.dead;});}
function e404End(e){e.st='float';e.stT=0;e.atkT=(game.hard?.32:.55)+rnd(.2);}
function e404AI(e,dt,a,d,slowMul){
e.stT+=dt;
if(e.st==='float'){
if(d>380){e.x+=Math.cos(a)*e.sp*slowMul*dt;e.y+=Math.sin(a)*e.sp*slowMul*dt;}
else if(d<250){e.x-=Math.cos(a)*e.sp*slowMul*dt;e.y-=Math.sin(a)*e.sp*slowMul*dt;}
else{const pp=Math.sin(game.t*.9+e.seed);e.x+=-Math.sin(a)*e.sp*.8*pp*dt;e.y+=Math.cos(a)*e.sp*.8*pp*dt;}
e.ang=lerpAngle(e.ang,a,1-Math.exp(-3*dt));
e.atkT-=dt;
if(e.atkT<=0){
e.patIdx=(e.patIdx+1)%e.pats.length;e.pat=e.pats[e.patIdx];
e.st='tele';e.stT=0;
blip('square',rnd(200,900),rnd(60,400),.12,.08);
}
}else if(e.st==='tele'){
if(e.stT>=.42){e.st=e.pat;e.stT=0;e404Start(e);}
}else e404Update(e,dt);
clampArena(e,e.r);
if(!player.dead&&d<e.r+(player.hitR||player.r)-6)hurtPlayer();
}
function e404Start(e){
const hard=game.hard;
if(e.pat==='espiral')e.data={spin:rnd(TAU),tick:0,dur:hard?3.6:2.9};
else if(e.pat==='muros')e.data={n:0,t:.15,alt:Math.random()<.5};
else if(e.pat==='cruz')e.data={rot:rnd(TAU),tick:0,dur:hard?3:2.5};
else if(e.pat==='flor')e.data={rings:0,rt:.15};
else if(e.pat==='sniper')e.data={shots:0,t:.12};
else if(e.pat==='almas')e.data={fired:false};
else if(e.pat==='minas')e.data={f:false};
else if(e.pat==='meteoro')e.data={s:0,t:.12};
else if(e.pat==='blink')e.data={n:0,waitT:.2,fired:false};
else if(e.pat==='investida')e.data={dashes:0,waitT:.4};
else if(e.pat==='aneis')e.data={rings:0,rt:.12,gap:rnd(TAU)};
else if(e.pat==='orbita')e.data={f:false};
else if(e.pat==='cortina')e.data={tick:0,dur:hard?2.8:2.4};
else if(e.pat==='clones')e.data={f:false};
else if(e.pat==='glitch')e.data={n:0,waitT:.1,fired:false};
}
function e404WallH(dir){
const gap=irnd(1,12),n=14,spd=game.hard?345:305;
for(let i=0;i<n;i++){
if(Math.abs(i-gap)<=1)continue;
const y=ROOM.y+46+i*(ROOM.h-92)/(n-1);
ebullets.push({x:dir>0?ROOM.x-30:ROOM.x+ROOM.w+30,y:y,vx:dir*spd,vy:0,r:6,c:'#e6f0f2'});
}
sfx.spit();sfx.growl();
}
function e404WallV(dir){
const gap=irnd(1,12),n=14,spd=game.hard?330:295;
for(let i=0;i<n;i++){
if(Math.abs(i-gap)<=1)continue;
const x=ROOM.x+46+i*(ROOM.w-92)/(n-1);
ebullets.push({x:x,y:dir>0?ROOM.y-30:ROOM.y+ROOM.h+30,vx:0,vy:dir*spd,r:6,c:'#ff4fd8'});
}
sfx.spit();sfx.growl();
}
function e404Update(e,dt){
const pp=player,hard=game.hard,vm=hard?1.26:1;
if(e.pat==='espiral'){
e.data.tick-=dt;
if(e.data.tick<=0){
e.data.tick=hard?.036:.05;e.data.spin+=hard?.56:.47;
const arms=hard?5:4;
for(let k=0;k<arms;k++){
const a=e.data.spin+k*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*232*vm,vy:Math.sin(a)*232*vm,r:5,c:k%2?'#ff4fd8':'#e6f0f2'});
}
}
if(e.stT>=e.data.dur)e404End(e);
}else if(e.pat==='muros'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.n<(hard?5:4)){
e.data.n++;e.data.t=.62;
if(e.data.alt)e404WallH(Math.random()<.5?1:-1);
else e404WallV(Math.random()<.5?1:-1);
e.data.alt=!e.data.alt;
}
if(e.data.n>=(hard?5:4)&&e.stT>=1.1)e404End(e);
}else if(e.pat==='cruz'){
e.data.tick-=dt;
if(e.data.tick<=0){
e.data.tick=hard?.15:.21;e.data.rot+=hard?.74:.6;
for(let b=0;b<4;b++){
const base=e.data.rot+b*Math.PI/2;
for(let i=-1;i<=1;i++){
const a=base+i*.15;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*292*vm,vy:Math.sin(a)*292*vm,r:5,c:'#e6f0f2'});
}
}
sfx.spit();
}
if(e.stT>=e.data.dur)e404End(e);
}else if(e.pat==='flor'){
e.data.rt-=dt;
const maxR=hard?6:5;
if(e.data.rt<=0&&e.data.rings<maxR){
e.data.rings++;e.data.rt=.36;
const n=hard?22:18,off=e.data.rings*.3;
for(let i=0;i<n;i++){
const a=off+i/n*TAU;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*224*vm,vy:Math.sin(a)*224*vm,r:5,c:i%4===0?'#ff4fd8':'#e6f0f2'});
}
sfx.spit();sfx.growl();
}
if(e.data.rings>=maxR&&e.data.rt<=-.15)e404End(e);
}else if(e.pat==='sniper'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.shots<(hard?12:9)){
e.data.shots++;e.data.t=hard?.06:.09;
const a=Math.atan2(pp.y-e.y,pp.x-e.x)+rnd(-.05,.05);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*600*vm,vy:Math.sin(a)*600*vm,r:5,c:'#ff4fd8'});
blip('sawtooth',320,120,.06,.05);
}
if(e.data.shots>=(hard?12:9)&&e.stT>=.8)e404End(e);
}else if(e.pat==='almas'){
if(!e.data.fired){
e.data.fired=true;
const base=Math.atan2(pp.y-e.y,pp.x-e.x),n=hard?15:12;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.2;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*176,vy:Math.sin(a)*176,r:6,c:'#e6f0f2',home:hard?3:2.6,homeT:hard?5:4});
}
sfx.howl();
}
if(e.stT>=1)e404End(e);
}else if(e.pat==='minas'){
if(!e.data.f){
e.data.f=true;
const n=hard?18:14;
for(let i=0;i<n;i++){
const a=rnd(TAU),dd=rnd(80,260);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,40);
ebullets.push({x:pt.x,y:pt.y,vx:0,vy:0,r:9,c:'#ff4fd8',mine:true,armT:.5,life:hard?8.5:6.5});
}
sfx.growl();
}
if(e.stT>=.7)e404End(e);
}else if(e.pat==='meteoro'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.s<(hard?8:6)){
e.data.s++;e.data.t=hard?.42:.55;
const nm=hard?6:4;
for(let i=0;i<nm;i++){
const a=rnd(TAU),dd=rnd(0,hard?220:160);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:.55,phase:'mark',c:'#ff4fd8'});
}
geyserMarks.push({x:pp.x,y:pp.y,t:0,dur:.68,phase:'mark',c:'#e6f0f2'});
blip('sawtooth',130,60,.25,.08);
}
if(e.data.s>=(hard?8:6)&&e.stT>=1.2)e404End(e);
}else if(e.pat==='blink'){
if(e.data.waitT>0)e.data.waitT-=dt;
else if(!e.data.fired){
e.data.fired=true;
sparks(e.x,e.y,'#ff4fd8',14,240,.5,4,true);
const ta=rnd(TAU),td=hard?170:210;
const pt=roomPt(pp.x+Math.cos(ta)*td,pp.y+Math.sin(ta)*td,40);
e.x=pt.x;e.y=pt.y;
sparks(e.x,e.y,'#e6f0f2',16,260,.5,4,true);
blip('square',1200,80,.2,.12);
game.shake=Math.max(game.shake,7);
const n=hard?20:15;
for(let i=0;i<n;i++){
const a=i/n*TAU+rnd(.2);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*365*vm,vy:Math.sin(a)*365*vm,r:5,c:i%3?'#e6f0f2':'#ff4fd8'});
}
sfx.spit();
}
if(e.stT>=(hard?1.3:1.05)){
if(e.data.n<(hard?3:2)){e.data.n++;e.data.fired=false;e.data.waitT=hard?.25:.42;e.stT=0;}
else e404End(e);
}
}else if(e.pat==='investida'){
if(e.dashT>0){
e.dashT-=dt;
e.x+=Math.cos(e.dashA)*(hard?1080:940)*dt;
e.y+=Math.sin(e.dashA)*(hard?1080:940)*dt;
e.ang=e.dashA;
ebullets.push({x:e.x+rnd(-10,10),y:e.y+rnd(-10,10),vx:rnd(-55,55),vy:rnd(-55,55),r:5,c:'#ff4fd8'});
clampArena(e,e.r);
if(e.dashT<=0)e.data.waitT=.42;
}else{
e.data.waitT-=dt;
if(e.data.waitT<=0){
if(e.data.dashes<(hard?4:3)){
e.data.dashes++;e.dashT=.38;
e.dashA=Math.atan2(pp.y-e.y,pp.x-e.x);
sfx.dash();sfx.growl();game.shake=Math.max(game.shake,6);
}else e404End(e);
}
}
}else if(e.pat==='aneis'){
e.data.rt-=dt;
if(e.data.rt<=0&&e.data.rings<(hard?5:4)){
e.data.rings++;e.data.rt=.5;e.data.gap+=1.2;
if(dmk()){
/* v1.5.0: círculos consecutivos rotativos — o glitch coroa o vazio */
dmkCircle(e.x,e.y,Math.round((hard?22:18)*dmkDen()),(hard?330:300)*dmkSp(),{c:'#ff4fd8',off:e.data.gap,alt:.75});
}else{
rings.push({x:e.x,y:e.y,r:30,vr:hard?420:380,th:14,gapA:e.data.gap,gapW:hard?.65:.85,c:'#ff4fd8'});
}
sfx.howl();
}
if(e.data.rings>=(hard?5:4)&&e.stT>=1.3)e404End(e);
}else if(e.pat==='orbita'){
if(!e.data.f){
e.data.f=true;
const n=hard?18:14;
for(let i=0;i<n;i++)
ebullets.push({orbit:true,cx:e.x,cy:e.y,ang:i/n*TAU,orbR0:60,orbSpd:hard?3.1:2.5,orbT:0,orbDur:1.35,speed:hard?360:305,r:6,c:i%2?'#ff4fd8':'#e6f0f2'});
sfx.howl();
}
if(e.stT>=.9)e404End(e);
}else if(e.pat==='cortina'){
e.data.tick-=dt;
if(e.data.tick<=0){
e.data.tick=hard?.06:.08;
const arms=hard?9:7,base=e.stT*3.1;
for(let b=0;b<arms;b++){
const a=base+b*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*252*vm,vy:Math.sin(a)*252*vm,r:5,c:b%2?'#e6f0f2':'#ff4fd8'});
}
}
if(e.stT>=e.data.dur)e404End(e);
}else if(e.pat==='clones'){
if(!e.data.f){
e.data.f=true;
const n=hard?8:5;
for(let i=0;i<n;i++){
const a=rnd(TAU),dd=rnd(120,220);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,60);
spawnMarks.push({x:pt.x,y:pt.y,type:Math.random()<.5?'ru':'sp',t:0,dur:.8});
}
sfx.roar();
}
if(e.stT>=.8)e404End(e);
}else if(e.pat==='glitch'){
e.data.waitT-=dt;
if(e.data.waitT<=0&&!e.data.fired){
e.data.fired=true;
sparks(e.x,e.y,'#4ff5ff',12,240,.4,4,true);
const pt=roomPt(lerp(ROOM.x+90,ROOM.x+ROOM.w-90,Math.random()),lerp(ROOM.y+90,ROOM.y+ROOM.h-90,Math.random()),60);
e.x=pt.x;e.y=pt.y;
sparks(e.x,e.y,'#ff4fd8',16,280,.5,4,true);
const n=hard?28:22;
for(let i=0;i<n;i++){
const a=i/n*TAU;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*410*vm,vy:Math.sin(a)*410*vm,r:5,c:i%2?'#ff4fd8':'#e6f0f2'});
}
game.flash=Math.max(game.flash,.16);game.shake=Math.max(game.shake,8);
blip('square',rnd(200,1600),rnd(60,400),.15,.1);
sfx.spit();
}
if(e.stT>=(hard?.55:.7)){
if(e.data.n<(hard?5:4)){e.data.n++;e.data.fired=false;e.data.waitT=hard?.1:.2;e.stT=0;}
else e404End(e);
}
}
}
/* ============ cutscene do ERRO 404 ============ */
const E404_LINES=[
{t0:1.0,t1:3.4,txt:'ERRRRRROOOOOOOOOOOO.'},
{t0:3.8,t1:6.2,txt:'EXISTIR.'},
{t0:6.6,t1:9.0,txt:'ABANDONA EM BAIXO... ME ALIMENTA.'},
{t0:9.4,t1:11.4,txt:'ALMA NÃO ENCONTRADA.'}];
const E404_TOTAL=14.2;
function updateE404Intro(dt){
game.e404T+=dt;
const t=game.e404T;
if(Math.random()<dt*8)blip('square',rnd(60,2200),rnd(30,900),.1,.09);
if(Math.random()<dt*4)noiseSfx(.15,.09,rnd(800,6000),'highpass');
if(t>11.4&&t<12.2)game.shake=Math.max(game.shake,2.5);
if(!game.e404Spawned&&t>=12.2){
game.e404Spawned=true;
game.flash=.7;game.shake=20;game.hitstop=.2;
sfx.roar();sfx.headDie();sfx.glitch();
}
if(t>=E404_TOTAL){
game.state='play';
spawnMarkAt('e404',game.absMain.x+game.absMain.w/2,game.absMain.y+game.absMain.h*.32,true);
game.banner={type:'boss',txt:'ERRO 404',sub:'ele te encontrou primeiro',t:0,dur:2.4};
}
}
function drawE404Intro(){
const t=game.e404T;
ctx.fillStyle='rgba(4,3,4,.92)';ctx.fillRect(0,0,W,H);
const gi=Math.min(1,t/1.2);
if(Math.random()<.75*gi){
for(let i=0;i<14;i++){
ctx.globalAlpha=rnd(.04,.22);
ctx.fillStyle=Math.random()<.5?'#ff4fd8':'#4ff5ff';
if(Math.random()<.5)ctx.fillRect(0,rnd(H),W,rnd(2,14));
else ctx.fillRect(rnd(W),rnd(H),rnd(20,180),rnd(2,10));
}
ctx.globalAlpha=1;
}
for(const L of E404_LINES){
const a=ramp(t,L.t0,L.t0+.5)*(1-ramp(t,L.t1-.4,L.t1));
if(a<=0)continue;
ctx.globalAlpha=a;
const jx=rnd(-2,2)*(Math.random()<.2?3:1);
txt(L.txt,W/2+jx,H*.3+rnd(-1,1),MONO,17,'#f2f0ea','center',3);
ctx.globalAlpha=a*.35;
txt(L.txt,W/2+3,H*.3+2,MONO,17,'#ff4fd8','center',3);
ctx.globalAlpha=1;
}
if(t>7){
const mat=ramp(t,7,11.8);
const cx=W/2,cy=H*.58,s=26+mat*46;
if(Math.random()<mat){
const a=rnd(TAU),d=rnd(90,340)*(1-mat*.6);
particles.push({x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d*.7,vx:-Math.cos(a)*90,vy:-Math.sin(a)*63,life:.4,t:0,r:2.2,c:Math.random()<.5?'#ff4fd8':'#4ff5ff',glow:true});
}
ctx.save();
ctx.translate(cx,cy);
ctx.rotate(Math.sin(game.t*2)*.04*(1-mat)+Math.sin(game.t*9)*.02);
ctx.globalAlpha=mat;
ctx.fillStyle='#0b0a0d';ctx.fillRect(-s,-s,s*2,s*2);
ctx.strokeStyle='#f2f0ea';ctx.lineWidth=2.5;
ctx.strokeRect(-s,-s,s*2,s*2);
if(Math.random()<.4){
ctx.globalAlpha=mat*.6;
ctx.fillStyle=Math.random()<.5?'#ff4fd8':'#4ff5ff';
ctx.fillRect(-s+rnd(0,s*2),-s+rnd(0,s),rnd(6,s),rnd(2,5));
}
ctx.globalAlpha=mat;
txt('404',0,2,MONO,Math.round(s*.7),Math.floor(game.t*6)%2?'#ff4fd8':'#4ff5ff','center',2);
ctx.restore();
ctx.globalAlpha=1;
}
if(t>=12.2){
const a=ramp(t,12.2,12.8);
ctx.globalAlpha=a;
txt('ERRO 404',W/2+rnd(-4,4),H*.24+rnd(-2,2),DISP,110,'#f2f0ea');
ctx.globalAlpha=a*.5;
txt('ERRO 404',W/2+5,H*.24+4,DISP,110,'#ff4fd8');
ctx.globalAlpha=a;
txt('ELE SEMPRE ESTEVE AQUI',W/2,H*.24+86,MONO,13,'#9c8f7c','center',6);
ctx.globalAlpha=1;
}
}
/* ===================================================================== *
 *  CAVALEIROS DO APOCALIPSE — 4 bosses secretos do endgame
 *  cw1=Conquista(Branco) cw2=Guerra(Vermelho) cw3=Fome(Preto) cw4=Morte(Descorado)
 *  Cada um: 2 fases (montado/desmontado), Triunfo (ultimate), drop exclusivo.
 * ===================================================================== */
const KNIGHT_DATA={
cw1:{name:'CAVALEIRO BRANCO',concept:'CONQUISTA',col:'#e6dac4',accent:'#c9a44c',dropId:'knight_conquest',
introLines:[{t:1.0,t1:4.4,txt:'o cão aventureiro ousou escalar o cavalo de branco.'},{t:5.0,t1:8.4,txt:'tudo que ele toca... converge.'},{t:9.0,t1:12.4,txt:'a conquista não pede permissão.'},{t:13.0,t1:16.4,txt:'suba, se ousar.'}],
introTotal:19.5,
deathLines:[{t:.8,t1:3.2,txt:'...então... conquistado...?'},{t:3.6,t1:6.4,txt:'a coroa... ainda pesa.'},{t:6.8,t1:9.0,txt:'até nos vermos de novo, cachorro.'}],deathTotal:11.0},
cw2:{name:'CAVALEIRO VERMELHO',concept:'GUERRA',col:'#d9465a',accent:'#8a1c2c',dropId:'knight_war',
introLines:[{t:1.0,t1:4.4,txt:'o cão cheira pólvora... ou é só sangue?'},{t:5.0,t1:8.4,txt:'guerra não escolhe lado. escolhe vítima.'},{t:9.0,t1:12.4,txt:'cada arma que eu carrego... já matou um deus.'},{t:13.0,t1:16.4,txt:'vem, cachorro. vem para a frente.'}],
introTotal:19.5,
deathLines:[{t:.8,t1:3.2,txt:'a guerra... nunca acaba... só descansa.'},{t:3.6,t1:6.4,txt:'guarde minha arma. use-a bem.'},{t:6.8,t1:9.0,txt:'até a próxima batalha.'}],deathTotal:11.0},
cw3:{name:'CAVALEIRO PRETO',concept:'FOME',col:'#3a2f3a',accent:'#7a5b8a',dropId:'knight_famine',
introLines:[{t:1.0,t1:4.4,txt:'o cão tem fome de vingança. eu tenho fome de tudo.'},{t:5.0,t1:8.4,txt:'não destruo o que comoo. transformo.'},{t:9.0,t1:12.4,txt:'seu poder... será meu por um tempo.'},{t:13.0,t1:16.4,txt:'a balança pesa tua alma.'}],
introTotal:19.5,
deathLines:[{t:.8,t1:3.2,txt:'fome... saciada...?'},{t:3.6,t1:6.4,txt:'o peso do que carreguei... agora é teu.'},{t:6.8,t1:9.0,txt:'devora o mundo por mim.'}],deathTotal:11.0},
cw4:{name:'CAVALEIRO DESCORADO',concept:'MORTE',col:'#c9a44c',accent:'#5e5036',dropId:'knight_death',
introLines:[{t:1.0,t1:4.4,txt:'o cão... finalmente chegou ao fim do caminho.'},{t:5.0,t1:8.4,txt:'eu sou o último peso na balança.'},{t:9.0,t1:12.4,txt:'não há走廊 sem fim. só eu.'},{t:13.0,t1:16.4,txt:'fica quieto, cachorro. a morte escuta.'}],
introTotal:19.5,
deathLines:[{t:.8,t1:3.2,txt:'...impossível...'}, {t:3.6,t1:6.4,txt:'a morte... morre?'},{t:6.8,t1:9.0,txt:'a coroa amarela agora é tua.'}],deathTotal:11.5}
};
/* padrões dos 4 cavaleiros — Fase 1 (montado) */
const CW1_PATS=['sword','lance','axe','bow','charge','combo'];
const CW2_PATS=['barrage','cannons','rain','zone','charge','spread'];
const CW3_PATS=['scale','scarcity','devour','weight','charge','hunger'];
const CW4_PATS=['plague','chase','wither','charge','scythe','pestilence'];
/* padrões Fase 2 (desmontado) — overrides do pats[] */
const CW1_P2=['multiweapon','whirl','arrowstorm','lunge'];
const CW2_P2=['armory','bombardment','bulletstorm','carpet'];
const CW3_P2=['absorb','mirror','empty','staving'];
const CW4_P2=['blink','falsecut','deathmark','reaper'];
/* helper: nome bonito do cavaleiro para cutscene */
function knightAny(){return enemies.find(e=>['cw1','cw2','cw3','cw4'].includes(e.type)&&!e.dead);}
function knightEntryID(){return game.knightIntro;}
/* ====== intro dos cavaleiros — estados: 'knightintroN' onde N é cw1..cw4 ====== */
function startKnightIntro(id){
game.knightIntro=id;game.knightIntroT=0;game.knightSpawned=false;
game.state='knightintro';
}
function updateKnightIntro(dt){
game.knightIntroT+=dt;
const t=game.knightIntroT;
const id=game.knightIntro;
const kd=KNIGHT_DATA[id];
if(!kd)return;
/* ambiência sonora por conceito */
if(Math.random()<dt*2.4){
if(id==='cw1')blip('sine',rnd(180,260),rnd(120,180),.5,.06);
else if(id==='cw2')blip('sawtooth',rnd(80,140),rnd(50,90),.4,.08);
else if(id==='cw3')blip('sine',rnd(60,100),rnd(40,80),.6,.1);
else blip('triangle',rnd(40,80),rnd(30,60),.8,.12);
}
const totalIntro=kd.introTotal;
if(t>totalIntro-2.5&&t<totalIntro-1)game.shake=Math.max(game.shake,2);
if(!game.knightSpawned&&t>=totalIntro-2.5){
game.knightSpawned=true;game.flash=.6;game.shake=20;
sfx.roar();sfx.howl();
}
if(t>=totalIntro){
game.state='play';
spawnMarkAt(id,game.absMain.x+game.absMain.w/2,game.absMain.y+game.absMain.h*.32,true);
game.banner={type:'boss',txt:kd.name,sub:kd.concept+' — Cavaleiro do Apocalipse',t:0,dur:3};
sfx.roar();
}
}
function drawKnightIntro(){
const t=game.knightIntroT;
const id=game.knightIntro;
const kd=KNIGHT_DATA[id];if(!kd)return;
/* fundo escurecido, cor temática pulsando */
ctx.fillStyle='rgba(2,1,3,.92)';ctx.fillRect(0,0,W,H);
const baseA=.06+.04*Math.sin(game.t*1.6);
ctx.fillStyle=kd.col;ctx.globalAlpha=baseA;
ctx.fillRect(0,0,W,H);
ctx.globalAlpha=1;
/* linhas de diálogo */
for(const L of kd.introLines){
const a=ramp(t,L.t0,L.t0+.7)*(1-ramp(t,L.t1-.5,L.t1));
if(a<=0)continue;
ctx.globalAlpha=a;
txt(L.txt,W/2+rnd(-1,1),H*.3,MONO,16,kd.col,'center',2);
ctx.globalAlpha=a*.35;
txt(L.txt,W/2+2,H*.3+2,MONO,16,kd.accent,'center',2);
ctx.globalAlpha=1;
}
/* cavaleiro materializando-se no centro */
if(t>5){
const mat=ramp(t,5,kd.introTotal-2);
drawKnightBody(id,W/2,H*.6,(.4+mat*1.1)*38,mat);
}
/* banner final */
if(t>=kd.introTotal-2.5){
const a=ramp(t,kd.introTotal-2.5,kd.introTotal-1.9);
ctx.globalAlpha=a;
txt(kd.name,W/2+rnd(-2,2),H*.22,DISP,84,kd.col);
ctx.globalAlpha=a*.55;
txt(kd.name,W/2+5,H*.22+4,DISP,84,kd.accent);
ctx.globalAlpha=a;
txt('CAVALEIRO DO APOCALIPSE — '+kd.concept,W/2,H*.22+74,MONO,12,kd.accent,'center',6);
ctx.globalAlpha=1;
}
}
/* ====== morte do cavaleiro ====== */
function updateKnightDeath(dt){
game.knightT+=dt;
updatePlayer(dt);
const t=game.knightT;
const id=game.knightDead;
const kd=KNIGHT_DATA[id];if(!kd)return;
if(t>1&&Math.random()<dt*12){
particles.push({x:game.knightX+rnd(-30,30),y:game.knightY+rnd(-60,40),vx:rnd(-30,30),vy:rnd(-140,-40),life:rnd(.8,1.8),t:0,r:rnd(2,4),c:Math.random()<.5?kd.col:kd.accent,drag:.8,glow:Math.random()<.3});
}
if(t>=kd.deathTotal){
const rr=game.mapRooms[game.roomIdx];
if(rr&&!rr.cleared){rr.cleared=true;game.waveState='done';openDoors();}
if(window.__RM)window.__RM.onRoomClear(rr); /* v1.4.0 */
/* drop exclusivo do cavaleiro */
pickups.push({type:'knightrelic',x:game.knightX,y:game.knightY,t:0,ph:rnd(TAU),relicId:kd.dropId,relicColor:kd.col,relicGlow:kd.accent});
/* se derrotou os 4 cavaleiros, drop bônus extra */
const k=META.knights;
if(k.conquest>=1&&k.war>=1&&k.famine>=1&&k.death>=1&&!META.done.apocalypse){
pickups.push({type:'knightrelic',x:game.knightX,y:game.knightY+50,t:0,ph:rnd(TAU),relicId:'apocalypse',relicColor:'#ffd9a0',relicGlow:'#d9465a'});
game.banner={type:'circle',txt:'OS QUATRO CAVALOS DESCERAM',name:'CAVALEIROS DO APOCALIPSE',sub:'o círculo se fecha. o cão enfrentou o fim e voltou.',t:0,dur:5};
META.done.apocalypse=1;saveMeta();
sfx.levelup();sfx.roar();sfx.win();
sparks(game.knightX,game.knightY,'#ffd9a0',40,360,.9,5,true);
sparks(game.knightX,game.knightY,'#d9465a',24,260,.7,3.5,true);
game.flash=.7;
} else {
game.banner={type:'small',txt:'CAVALEIRO CAIU',sub:'um artefato restos no chão',t:0,dur:2.4};
}
game.state='play';
sfx.echo();
}
}
function drawKnightDeathUI(){
const t=game.knightT;
const id=game.knightDead;
const kd=KNIGHT_DATA[id];if(!kd)return;
ctx.fillStyle='rgba(2,1,3,.88)';ctx.fillRect(0,0,W,H);
/* pulso de fundo */
ctx.globalAlpha=.08+.06*Math.sin(game.t*4);
ctx.fillStyle=kd.col;ctx.fillRect(0,0,W,H);
ctx.globalAlpha=1;
/* corpo do cavaleiro em despedida */
drawKnightBody(id,game.knightX,game.knightY,38,Math.max(0,1-t/4));
/* linhas de morte */
for(const L of kd.deathLines){
const a=ramp(t,L.t0,L.t0+.5)*(1-ramp(t,L.t1-.4,L.t1));
if(a<=0)continue;
ctx.globalAlpha=a;
txt(L.txt,W/2,H*.78,MONO,15,kd.col,'center',2);
ctx.globalAlpha=1;
}
/* se todos os 4 caíram, mostra a conquista */
const k=META.knights;
if(k.conquest>=1&&k.war>=1&&k.famine>=1&&k.death>=1&&t>4){
const a=ramp(t,4,5);
ctx.globalAlpha=a;
txt('O APOCALIPSE PASSOU',W/2,H*.5,DISP,46,'#ffd9a0');
ctx.globalAlpha=a*.6;
txt('O APOCALIPSE PASSOU',W/2+3,H*.5+3,DISP,46,'#d9465a');
ctx.globalAlpha=a;
txt('conquista · guerra · fome · morte',W/2,H*.55,MONO,12,'#c9a44c','center',4);
ctx.globalAlpha=1;
}
}
/* ====== desenho do corpo do cavaleiro (cavalo opcional) ====== */
function drawKnightBody(type,x,y,s,alpha){
if(alpha<=0)return;
const kd=KNIGHT_DATA[type];
if(!kd)return;
ctx.save();
ctx.translate(x,y);
ctx.scale(s/38,s/38);
ctx.globalAlpha=alpha;
/* cavalo se vivo */
const showHorse=type==='cw1'?true:type==='cw2'?true:type==='cw3'?true:type==='cw4'?true:false;
/* desenho do cavalo grande atrás */
if(showHorse){
const hcol=kd.col;
ctx.globalAlpha=alpha*.55;
ctx.fillStyle='#1a1418';
ctx.beginPath();ctx.ellipse(0,80,46,22,0,0,TAU);ctx.fill();
ctx.globalAlpha=alpha;
ctx.fillStyle='#0c0a0d';
/* corpo do cavalo */
ctx.beginPath();ctx.ellipse(0,40,38,28,0,0,TAU);ctx.fill();
/* pernas */
for(const off of[-22,-7,7,22]){
ctx.fillStyle='#0c0a0d';
ctx.fillRect(off-4,40,8,52);
ctx.fillStyle=hcol;ctx.globalAlpha=alpha*.4;
ctx.fillRect(off-3,40,2,52);
ctx.globalAlpha=alpha;
}
/* pescoço e cabeça do cavalo */
ctx.fillStyle='#0c0a0d';
ctx.beginPath();
ctx.moveTo(28,15);ctx.quadraticCurveTo(50,2,52,-30);ctx.quadraticCurveTo(60,-44,52,-50);ctx.quadraticCurveTo(38,-46,30,-30);ctx.quadraticCurveTo(22,-12,28,15);
ctx.closePath();ctx.fill();
/* juba/crina */
ctx.strokeStyle=hcol;ctx.lineWidth=4;ctx.lineCap='round';
for(let i=0;i<6;i++){
const a=-.6+i*.22;
ctx.beginPath();ctx.moveTo(28+Math.cos(a)*22,-30+Math.sin(a)*22);ctx.lineTo(28+Math.cos(a)*32,-30+Math.sin(a)*32);ctx.stroke();
}
/* olhos vermelhos */
ctx.fillStyle='#d9465a';
ctx.beginPath();ctx.arc(44,-36,2,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(52,-36,2,0,TAU);ctx.fill();
}
/* cavaleiro: armadura + capa */
ctx.translate(0,-58);
/* capa esvoaçante */
ctx.fillStyle=kd.accent;ctx.globalAlpha=alpha*.7;
ctx.beginPath();
ctx.moveTo(-12,4);ctx.quadraticCurveTo(-34,32,-22,52);ctx.quadraticCurveTo(0,42,22,52);ctx.quadraticCurveTo(34,32,12,4);
ctx.closePath();ctx.fill();
ctx.globalAlpha=alpha;
/* peitoral da armadura */
ctx.fillStyle=kd.col;
ctx.beginPath();ctx.moveTo(-16,-2);ctx.lineTo(16,-2);ctx.lineTo(14,32);ctx.lineTo(-14,32);ctx.closePath();ctx.fill();
ctx.strokeStyle='#1a1418';ctx.lineWidth=2;ctx.stroke();
/* detalhe central */
ctx.fillStyle=kd.accent;
ctx.beginPath();
ctx.moveTo(0,-2);ctx.lineTo(4,8);ctx.lineTo(0,18);ctx.lineTo(-4,8);ctx.closePath();ctx.fill();
/* ombros */
for(const s of[-1,1]){
ctx.fillStyle=kd.col;
ctx.beginPath();ctx.arc(s*16,2,8,0,TAU);ctx.fill();
ctx.stroke();
}
/* cabeça com elmo */
ctx.fillStyle=kd.col;
ctx.beginPath();ctx.arc(0,-22,12,0,TAU);ctx.fill();
ctx.strokeStyle='#1a1418';ctx.lineWidth=2;ctx.stroke();
/* viseira/fenda */
ctx.fillStyle='#0c0a0d';
ctx.fillRect(-8,-24,16,4);
/* brilho dos olhos */
ctx.fillStyle=kd.accent;
ctx.beginPath();ctx.arc(-3,-23,1.5,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(3,-23,1.5,0,TAU);ctx.fill();
/* coroa (para o Branco) */
if(type==='cw1'){
ctx.fillStyle='#c9a44c';
for(let i=0;i<5;i++){
const a=-Math.PI/2+(i-2)*.35;
const cx=Math.cos(a)*13,cy=-22+Math.sin(a)*13;
ctx.beginPath();ctx.moveTo(cx-2,cy+4);ctx.lineTo(cx,cy-6);ctx.lineTo(cx+2,cy+4);ctx.closePath();ctx.fill();
}
ctx.fillRect(-13,-9,26,3);
}
/* balança (para o Preto) */
if(type==='cw3'){
ctx.strokeStyle=kd.accent;ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(0,-22);ctx.stroke();
ctx.beginPath();ctx.moveTo(-14,-14);ctx.lineTo(14,-14);ctx.stroke();
for(const s of[-1,1]){
ctx.beginPath();ctx.arc(s*14,-14,5,0,TAU);ctx.stroke();
ctx.beginPath();ctx.arc(s*14,-14,5,0,Math.PI);ctx.stroke();
}
}
/* arco (para o Branco) */
if(type==='cw1'){
ctx.strokeStyle=kd.accent;ctx.lineWidth=2;
ctx.beginPath();ctx.arc(20,-22,18,-Math.PI*.7,-Math.PI*.3);ctx.stroke();
}
/* arma variante para os outros (vermelho = espada, preto = balança já feita, descorado = foice) */
if(type==='cw2'){
ctx.strokeStyle=kd.accent;ctx.lineWidth=3;
ctx.beginPath();ctx.moveTo(18,-22);ctx.lineTo(36,-30);ctx.stroke();
}
if(type==='cw4'){
/* foice curva */
ctx.strokeStyle=kd.accent;ctx.lineWidth=3;
ctx.beginPath();ctx.arc(28,-22,14,Math.PI*.4,Math.PI*1.2);ctx.stroke();
}
ctx.restore();
}
/* ============ IA dos Cavaleiros ============ */
function cwKnightAI(e,dt,a,d,slowMul){
e.stT+=dt;
e.spawnT=Math.min(1,e.spawnT+dt*1.6);
/* troca de fase quando cavalo cai */
if(!e.p2&&e.horseHp<=0){
e.p2=true;
e.hp=Math.max(e.hp,e.maxHp*.35);
const kd=KNIGHT_DATA[e.type];
game.banner={type:'boss',txt:kd.name+' — FASE II',sub:'o cavalo tombou — o cavaleiro desce',t:0,dur:2.8};
sfx.roar();sfx.howl();game.flash=.5;game.shake=22;
sparks(e.x,e.y,kd.col,30,320,.9,4,true);
sparks(e.x,e.y,kd.accent,18,260,.7,3.5,true);
e.r*=1.05;e.sp*=1.3;
/* troca para os padrões da fase 2 */
if(e.type==='cw1')e.pats=CW1_P2.slice();
if(e.type==='cw2')e.pats=CW2_P2.slice();
if(e.type==='cw3')e.pats=CW3_P2.slice();
if(e.type==='cw4')e.pats=CW4_P2.slice();
e.patIdx=-1;
}
/* dano ao cavalo? se montado, o cavalo recebe parte do dano primeiro.
isso já é tratado no updateBullets/exActUpdate verificando e.horseHp. */
/* FLUTUAÇÃO no estado idle */
if(e.st==='float'){
const sp2=e.p2?1.4:1;
if(d>380){e.x+=Math.cos(a)*e.sp*sp2*slowMul*dt;e.y+=Math.sin(a)*e.sp*sp2*slowMul*dt;}
else if(d<240){e.x-=Math.cos(a)*e.sp*sp2*slowMul*dt;e.y-=Math.sin(a)*e.sp*sp2*slowMul*dt;}
else{const pp=Math.sin(game.t*.7+e.seed);e.x+=-Math.sin(a)*e.sp*.7*pp*dt;e.y+=Math.cos(a)*e.sp*.7*pp*dt;}
e.ang=lerpAngle(e.ang,a,1-Math.exp(-3*dt));
e.atkT-=dt;
if(e.atkT<=0){
e.patIdx=(e.patIdx+1)%e.pats.length;e.pat=e.pats[e.patIdx];
e.st='tele';e.stT=0;blip('sine',140,90,.3,.08);
}
}else if(e.st==='tele'){
const teleDur=e.p2?.45:.65;
if(e.stT>=teleDur){e.st=e.pat;e.stT=0;cwKnightStart(e);}
}else cwKnightUpdate(e,dt);
clampArena(e,e.r);
if(!player.dead&&d<e.r+(player.hitR||player.r)-4)hurtPlayer();
}
/* ====== cwKnightStart: setup do padrão atual ====== */
function cwKnightStart(e){
const hard=game.hard,pp=player;
const kd=KNIGHT_DATA[e.type];
if(e.pat==='sword'){e.data={volleys:0,t:.1};e.recDur=.7;}
else if(e.pat==='lance'){e.data={dashT:.6,dashA:Math.atan2(pp.y-e.y,pp.x-e.x),fired:false};e.recDur=.7;}
else if(e.pat==='axe'){e.data={slams:0,t:.3};e.recDur=.8;}
else if(e.pat==='bow'){e.data={arrows:0,t:.1};e.recDur=.7;}
else if(e.pat==='charge'){e.data={charging:false,cdT:.4,dashed:false};e.recDur=.7;}
else if(e.pat==='combo'){e.data={step:0,t:0};e.recDur=1.0;}
else if(e.pat==='barrage'){e.data={volleys:0,t:.1};e.recDur=.8;}
else if(e.pat==='cannons'){e.data={cannons:0,t:.3};e.recDur=.8;}
else if(e.pat==='rain'){e.data={markT:0,salvos:0};e.recDur=1.0;}
else if(e.pat==='zone'){e.data={marks:0,t:.2};e.recDur=.7;}
else if(e.pat==='spread'){e.data={fired:false};e.recDur=.7;}
else if(e.pat==='scale'){e.data={spin:0,t:0};e.recDur=.9;}
else if(e.pat==='scarcity'){e.data={marks:0,t:.2};e.recDur=.7;}
else if(e.pat==='devour'){e.data={phase:'windup',t:0};e.recDur=1.5;}
else if(e.pat==='weight'){e.data={applied:false};e.recDur=.6;}
else if(e.pat==='hunger'){e.data={fired:false};e.recDur=.7;}
else if(e.pat==='plague'){e.data={marks:0,t:.1};e.recDur=1.0;}
else if(e.pat==='chase'){e.data={dashT:.5,dashA:Math.atan2(pp.y-e.y,pp.x-e.x)};e.recDur=.7;}
else if(e.pat==='wither'){e.data={rings:0,t:.2};e.recDur=.8;}
else if(e.pat==='scythe'){e.data={arc:0,t:0};e.recDur=.7;}
else if(e.pat==='pestilence'){e.data={clouds:0,t:.1};e.recDur=1.0;}
/* Fase 2 padrões */
else if(e.pat==='multiweapon'){e.data={step:0,t:0};e.recDur=1.2;}
else if(e.pat==='whirl'){e.data={spin:0,t:0};e.recDur=1.0;}
else if(e.pat==='arrowstorm'){e.data={arrows:0,t:.08};e.recDur=1.2;}
else if(e.pat==='lunge'){e.data={jumps:0,t:.2,tele:false};e.recDur=1.0;}
else if(e.pat==='armory'){e.data={spawned:0,t:.15};e.recDur=1.0;}
else if(e.pat==='bombardment'){e.data={shots:0,t:.1};e.recDur=1.0;}
else if(e.pat==='bulletstorm'){e.data={bursts:0,t:.2};e.recDur=1.2;}
else if(e.pat==='carpet'){e.data={fired:false};e.recDur=1.0;}
else if(e.pat==='absorb'){e.data={phase:'windup',t:0};e.recDur=2.0;}
else if(e.pat==='mirror'){e.data={fired:false};e.recDur=1.0;}
else if(e.pat==='empty'){e.data={marks:0,t:.2};e.recDur=.8;}
else if(e.pat==='staving'){e.data={spin:0,t:0};e.recDur=1.0;}
else if(e.pat==='blink'){e.data={jumps:0,tele:false,fired:false};e.recDur=1.0;}
else if(e.pat==='falsecut'){e.data={fakes:0,fired:false};e.recDur=1.2;}
else if(e.pat==='deathmark'){e.data={markT:0,fired:false};e.recDur=1.0;}
else if(e.pat==='reaper'){e.data={arc:0,t:0};e.recDur=1.2;}
e.actDur=0;e.data=e.data||{};
}
/* ====== cwKnightUpdate: executa o padrão atual ====== */
function cwKnightUpdate(e,dt){
const hard=game.hard,pp=player;
const kd=KNIGHT_DATA[e.type];
const col=kd.col,acc=kd.accent;
const isP2=e.p2;
/* cada padrão é executado em um branch. e.data carrega o estado. */
if(e.pat==='sword'){
e.data.t-=dt;
const maxV=hard?4:3;
if(e.data.t<=0&&e.data.volleys<maxV){
e.data.volleys++;e.data.t=hard?.32:.4;
const base=Math.atan2(pp.y-e.y,pp.x-e.x);
const n=hard?6:4;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.18;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*240,vy:Math.sin(a)*240,r:7,c:col});
}
/* slash arco */
for(let k=0;k<3;k++){
const a=base+Math.PI+(k-1)*.3;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,r:5,c:acc});
}
sfx.spit();
}
if(e.data.volleys>=maxV&&e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='lance'){
if(e.data.dashT>0){
e.data.dashT-=dt;
e.x+=Math.cos(e.data.dashA)*(hard?700:580)*dt;e.y+=Math.sin(e.data.dashA)*(hard?700:580)*dt;
e.ang=e.data.dashA;
particles.push({x:e.x,y:e.y,vx:0,vy:0,life:.25,t:0,r:8,c:col,alpha:.3,drag:0});
if(!player.dead&&dist(e.x,e.y,pp.x,pp.y)<e.r+pp.r)hurtPlayer();
clampArena(e,e.r);
}else if(!e.data.fired){
e.data.fired=true;
/* lança detona em arco de estilhaços */
if(dmk()){
/* v1.5.0: a lança detona em leque + círculo de estilhaços */
dmkFan(e.x,e.y,e.data.dashA,.9,Math.round(9*dmkDen()),280*dmkSp(),{c:acc});
dmkCircle(e.x,e.y,Math.round(12*dmkDen()),240*dmkSp(),{c:col,quiet:true});
}else{
const n=hard?10:7;
for(let i=0;i<n;i++){
const a=e.data.dashA+(i-(n-1)/2)*.16;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*280,vy:Math.sin(a)*280,r:6,c:acc});
}
}
sfx.explode();
}
if(e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='axe'){
e.data.t-=dt;
const maxS=hard?3:2;
if(e.data.t<=0&&e.data.slams<maxS){
e.data.slams++;e.data.t=hard?.6:.8;
/* machado arremessado em arco + onda de choque */
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*220,vy:Math.sin(a)*220,r:9,c:acc,boomerang:true,bx:e.x,by:e.y});
if(dmk()){
/* v1.5.0: o machado cai e o aço respinga em círculo cheio */
dmkCircle(e.x,e.y,Math.round(14*dmkDen()),(hard?300:270)*dmkSp(),{c:acc});
}else{
rings.push({x:e.x,y:e.y,r:24,vr:hard?340:280,th:14,gapA:rnd(TAU),gapW:1.4,c:acc});
}
sfx.thud();game.shake=Math.max(game.shake,7);
}
if(e.data.slams>=maxS&&e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='bow'){
e.data.t-=dt;
const maxA=hard?5:4;
if(e.data.t<=0&&e.data.arrows<maxA){
e.data.arrows++;e.data.t=hard?.18:.24;
const a=Math.atan2(pp.y-e.y,pp.x-e.x)+rnd(-.08,.08);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(hard?440:380),vy:Math.sin(a)*(hard?440:380),r:5,c:acc,home:1.8,homeT:3});
sfx.spit();
}
if(e.data.arrows>=maxA&&e.stT>=.7)cwKnightEnd(e);
}
else if(e.pat==='charge'){
if(!e.data.charging&&e.data.cdT>0){e.data.cdT-=dt;}
if(!e.data.charging&&e.data.cdT<=0){
e.data.charging=true;e.data.dashT=.7;
e.data.dashA=Math.atan2(pp.y-e.y,pp.x-e.x);
sfx.dash();sfx.roar();game.shake=Math.max(game.shake,10);
}
if(e.data.charging){
e.data.dashT-=dt;
const v=hard?700:580;
e.x+=Math.cos(e.data.dashA)*v*dt;e.y+=Math.sin(e.data.dashA)*v*dt;
if(!player.dead&&dist(e.x,e.y,pp.x,pp.y)<e.r+pp.r+8){
/* atropelamento do cavalo: dano forte */
hurtPlayer();
if(game.hard){
/* no hard, segundo hit */
e.data.dashA+=Math.PI;e.data.dashT=.3;
}
}
particles.push({x:e.x+rnd(-10,10),y:e.y+rnd(-10,10),vx:rnd(-30,30),vy:rnd(-30,30),life:.3,t:0,r:5,c:'#3a2b2e',drag:1});
clampArena(e,e.r);
if(e.data.dashT<=0){e.data.charging=false;e.data.dashed=true;}
}
if(e.data.dashed&&e.stT>=.8)cwKnightEnd(e);
}
else if(e.pat==='combo'){
e.data.t+=dt;
if(e.data.step===0&&e.data.t>.15){
e.data.step=1;
/* investida em Z */
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
for(let i=0;i<4;i++){
const ang=a+(i-1.5)*.2;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*200,vy:Math.sin(ang)*200,r:5,c:col});
}
}
if(e.data.step===1&&e.data.t>.6){
e.data.step=2;
/* rotação */
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
for(let i=0;i<6;i++){
const ang=i/6*TAU+a;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*220,vy:Math.sin(ang)*220,r:5,c:acc});
}
sfx.spit();
}
if(e.data.step===2&&e.data.t>1.0){
e.data.step=3;
/* golpe final pesado */
if(dmk()){
/* v1.5.0: o golpe final pesado irradia em coroa cheia */
dmkCircle(e.x,e.y,Math.round(19*dmkDen()),(hard?340:300)*dmkSp(),{c:col});
}else{
rings.push({x:e.x,y:e.y,r:24,vr:hard?380:320,th:14,gapA:rnd(TAU),gapW:1.6,c:col});
}
sfx.thud();game.shake=Math.max(game.shake,8);
}
if(e.data.step>=3&&e.stT>=1.2)cwKnightEnd(e);
}
else if(e.pat==='barrage'){
e.data.t-=dt;
const maxV=hard?5:4;
if(e.data.t<=0&&e.data.volleys<maxV){
e.data.volleys++;e.data.t=hard?.2:.26;
const base=Math.atan2(pp.y-e.y,pp.x-e.x);
const n=hard?8:6;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.12;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,r:6,c:acc});
}
}
if(e.data.volleys>=maxV&&e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='cannons'){
e.data.t-=dt;
const maxC=hard?4:3;
if(e.data.t<=0&&e.data.cannons<maxC){
e.data.cannons++;e.data.t=hard?.5:.6;
/* 3 cannons disparam simultâneo do cavaleiro em angulo aleatório */
const base=Math.atan2(pp.y-e.y,pp.x-e.x);
for(let k=-1;k<=1;k++){
const ba=base+k*.4;
const sx=e.x+Math.cos(ba)*40,sy=e.y+Math.sin(ba)*40;
for(let i=0;i<3;i++){
const a=ba+(i-1)*.08;
ebullets.push({x:sx,y:sy,vx:Math.cos(a)*230,vy:Math.sin(a)*230,r:7,c:acc});
}
sparks(sx,sy,acc,4,80,.3,2,true);
}
sfx.growl();
}
if(e.data.cannons>=maxC&&e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='rain'){
e.data.markT-=dt;
const maxS=hard?5:4;
if(e.data.markT<=0&&e.data.salvos<maxS){
e.data.salvos++;e.data.markT=hard?.4:.5;
const n=hard?8:5;
for(let i=0;i<n;i++){
const a=rnd(TAU),dd=rnd(60,260);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:hard?.55:.7,phase:'mark',c:acc});
}
geyserMarks.push({x:pp.x,y:pp.y,t:0,dur:.65,phase:'mark',c:col});
blip('sawtooth',120,60,.25,.08);
}
if(e.data.salvos>=maxS&&e.stT>=1.2)cwKnightEnd(e);
}
else if(e.pat==='zone'){
e.data.t-=dt;
const maxM=hard?6:4;
if(e.data.t<=0&&e.data.marks<maxM){
e.data.marks++;e.data.t=hard?.4:.5;
const a=rnd(TAU),dd=rnd(80,260);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,50);
ebullets.push({x:pt.x,y:pt.y,vx:0,vy:0,r:14,c:acc,mine:true,armT:.6,life:hard?8:6});
}
if(e.data.marks>=maxM&&e.stT>=.8)cwKnightEnd(e);
}
else if(e.pat==='spread'){
if(!e.data.fired){
e.data.fired=true;
const n=hard?16:12;
const off=rnd(TAU);
for(let i=0;i<n;i++){
const a=off+i/n*TAU;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*230,vy:Math.sin(a)*230,r:6,c:col});
}
sfx.spit();sfx.growl();
}
if(e.stT>=.7)cwKnightEnd(e);
}
else if(e.pat==='scale'){
e.data.t-=dt;
if(e.data.t<=0){
e.data.t=hard?.18:.22;
e.data.spin+=.4;
/* dois pratos da balança: dupla espiral cruzada */
const arms=hard?4:3;
for(let k=0;k<arms;k++){
const a=e.data.spin+k*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*200,vy:Math.sin(a)*200,r:5,c:acc});
const a2=-e.data.spin*1.3+k*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a2)*180,vy:Math.sin(a2)*180,r:5,c:col});
}
}
if(e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='scarcity'){
e.data.t-=dt;
const maxM=hard?6:4;
if(e.data.t<=0&&e.data.marks<maxM){
e.data.marks++;e.data.t=hard?.4:.5;
/* área onde recursos somem (simulado por marcas que explodem em silêncio) */
const a=rnd(TAU),dd=rnd(80,300);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:.8,phase:'mark',c:'#5a4a55',silent:true});
}
if(e.data.marks>=maxM&&e.stT>=.8)cwKnightEnd(e);
}
else if(e.pat==='devour'){
e.data.t+=dt;
if(e.data.phase==='windup'&&e.data.t>.6){
e.data.phase='pull';e.data.t=0;
sfx.howl();game.shake=Math.max(game.shake,8);
sparks(e.x,e.y,acc,14,200,.4,4,true);
}
if(e.data.phase==='pull'){
/* puxa jogador em direção ao cavaleiro */
const dx=e.x-pp.x,dy=e.y-pp.y,D=Math.hypot(dx,dy)||1;
pp.x+=dx/D*120*dt;pp.y+=dy/D*120*dt;
clampArena(pp,pp.r);
/* se chegar perto: engolido */
if(D<50){
e.data.phase='devoured';e.data.t=0;
sfx.explode();game.flash=.5;game.shake=14;
sparks(pp.x,pp.y,'#5a4a55',18,260,.5,4,true);
}
}
if(e.data.phase==='devoured'){
/* o cavaleiro fica parado por 1.5s "engolindo" — jogador teleporta para perto dele e fica imobilizado */
if(e.data.t<1.5){
pp.x=lerp(pp.x,e.x+60,1-Math.exp(-3*dt));
pp.y=lerp(pp.y,e.y+60,1-Math.exp(-3*dt));
/* copia um poder do Thor se tiver */
if(e.data.t<.1){
const powers=[];
if(game.hasShot)powers.push('shot');
if(game.hasBite)powers.push('bite');
if(game.ymir)powers.push('ice');
if(game.incendio)powers.push('fire');
if(game.miasma)powers.push('poison');
if(game.hasParry)powers.push('parry');
if(powers.length){
const taken=pick(powers);
if(!e.copied)e.copied=[];
if(e.copied.length<5)e.copied.push(taken);
texts.push({x:pp.x,y:pp.y-30,txt:'FOME ABSORVEU: '+taken.toUpperCase(),t:0,life:1.4,c:'#7a5b8a',size:14,disp:true});
}
}
}else{
e.data.phase='release';e.data.t=0;
/* cospe o jogador para longe */
const ang=Math.atan2(pp.y-e.y,pp.x-e.x);
pp.x=e.x+Math.cos(ang)*200;pp.y=e.y+Math.sin(ang)*200;
sparks(pp.x,pp.y,'#5a4a55',12,200,.5,4,true);
clampArena(pp,pp.r);
sfx.spit();
}
}
if(e.data.phase==='release'&&e.data.t>.4)cwKnightEnd(e);
}
else if(e.pat==='weight'){
if(!e.data.applied){
e.data.applied=true;
/* aplica peso: Thor fica lento por 3s */
pp.slowT=Math.max(pp.slowT,3);
texts.push({x:pp.x,y:pp.y-30,txt:'SOB PESO',t:0,life:1,c:acc,size:14,disp:true});
sparks(pp.x,pp.y,acc,8,150,.4,3,true);
}
if(e.stT>=.6)cwKnightEnd(e);
}
else if(e.pat==='hunger'){
if(!e.data.fired){
e.data.fired=true;
const base=Math.atan2(pp.y-e.y,pp.x-e.x);
const n=hard?10:7;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.18;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*200,vy:Math.sin(a)*200,r:6,c:acc,home:1.6,homeT:4});
}
sfx.howl();
}
if(e.stT>=.7)cwKnightEnd(e);
}
else if(e.pat==='plague'){
e.data.t-=dt;
const maxM=hard?6:5;
if(e.data.t<=0&&e.data.marks<maxM){
e.data.marks++;e.data.t=hard?.3:.4;
/* nuvens de peste que perseguem lentas */
for(let i=0;i<2;i++){
const a=rnd(TAU),dd=rnd(60,200);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,50);
ebullets.push({x:pt.x,y:pt.y,vx:0,vy:0,r:14,c:acc,mine:true,armT:.4,life:hard?10:7,plague:true});
}
}
if(e.data.marks>=maxM&&e.stT>=1.2)cwKnightEnd(e);
}
else if(e.pat==='chase'){
if(e.data.dashT>0){
e.data.dashT-=dt;
const v=hard?900:780;
e.x+=Math.cos(e.data.dashA)*v*dt;e.y+=Math.sin(e.data.dashA)*v*dt;
particles.push({x:e.x,y:e.y,vx:0,vy:0,life:.3,t:0,r:8,c:acc,alpha:.4,drag:0});
/* hitkill visual: telegrafa com linha de aviso */
if(!player.dead&&dist(e.x,e.y,pp.x,pp.y)<e.r+pp.r){
/* HITKILL — mas o jogador viu o aviso antes */
killPlayerInstant('INVESTIDA DA MORTE');
}
clampArena(e,e.r);
}
if(e.data.dashT<=0&&e.stT>=.7)cwKnightEnd(e);
}
else if(e.pat==='wither'){
e.data.t-=dt;
const maxR=hard?4:3;
if(e.data.t<=0&&e.data.rings<maxR){
e.data.rings++;e.data.t=hard?.5:.6;
if(dmk()){
dmkCircle(e.x,e.y,Math.round(15*dmkDen()),(hard?300:270)*dmkSp(),{c:acc,slow:true,alt:.78});
}else{
rings.push({x:e.x,y:e.y,r:24,vr:hard?340:280,th:14,gapA:rnd(TAU),gapW:1.1,c:acc,slow:true});
}
sfx.howl();
}
if(e.data.rings>=maxR&&e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='scythe'){
e.data.t+=dt;
e.data.arc+=dt*4;
/* foice girando: arco amplo de balas */
if(Math.random()<dt*8){
const a=e.data.arc;
for(let i=0;i<5;i++){
const aa=a+i*.16-Math.PI/4;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*220,vy:Math.sin(aa)*220,r:5,c:acc});
}
}
if(e.stT>=.8)cwKnightEnd(e);
}
else if(e.pat==='pestilence'){
e.data.t-=dt;
const maxC=hard?6:4;
if(e.data.t<=0&&e.data.clouds<maxC){
e.data.clouds++;e.data.t=hard?.2:.3;
const a=rnd(TAU),dd=rnd(40,260);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
ebullets.push({x:pt.x,y:pt.y,vx:0,vy:0,r:18,c:acc,mine:true,armT:.5,life:hard?9:7});
}
if(e.data.clouds>=maxC&&e.stT>=1.2)cwKnightEnd(e);
}
/* ====== FASE 2 padrões ====== */
else if(e.pat==='multiweapon'){
/* usa várias armas simultaneamente */
e.data.t+=dt;
if(e.data.step===0&&e.data.t>.2){
e.data.step=1;
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
const n=hard?6:4;
for(let i=0;i<n;i++){
const aa=a+(i-(n-1)/2)*.18;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*250,vy:Math.sin(aa)*250,r:6,c:acc});
}
/* arco simultâneo */
for(let i=0;i<3;i++){
const aa=a+Math.PI+(i-1)*.2;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*220,vy:Math.sin(aa)*220,r:5,c:col});
}
}
if(e.data.step===1&&e.data.t>.7){
e.data.step=2;
if(dmk()){
dmkCircle(e.x,e.y,Math.round(17*dmkDen()),(hard?320:290)*dmkSp(),{c:col});
dmkX(e.x,e.y,Math.atan2(pp.y-e.y,pp.x-e.x),2,(hard?250:225)*dmkSp(),{c:acc,startDist:32,quiet:true});
}else{
rings.push({x:e.x,y:e.y,r:24,vr:hard?380:320,th:14,gapA:rnd(TAU),gapW:1.4,c:col});
}
sfx.thud();game.shake=Math.max(game.shake,8);
}
if(e.data.step>=2&&e.stT>=1.2)cwKnightEnd(e);
}
else if(e.pat==='whirl'){
e.data.t-=dt;
if(e.data.t<=0){
e.data.t=hard?.07:.09;
e.data.spin+=hard?.42:.36;
const arms=hard?6:5;
for(let k=0;k<arms;k++){
const a=e.data.spin+k*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*230,vy:Math.sin(a)*230,r:6,c:col});
const a2=-e.data.spin*1.2+k*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a2)*200,vy:Math.sin(a2)*200,r:5,c:acc});
}
}
if(e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='arrowstorm'){
e.data.t-=dt;
const maxA=hard?14:10;
if(e.data.t<=0&&e.data.arrows<maxA){
e.data.arrows++;e.data.t=hard?.08:.1;
const a=Math.atan2(pp.y-e.y,pp.x-e.x)+rnd(-.15,.15);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*380,vy:Math.sin(a)*380,r:5,c:acc,home:1.4,homeT:2.5});
}
if(e.data.arrows>=maxA&&e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='lunge'){
e.data.t+=dt;
if(!e.data.tele&&e.data.t>.15){
e.data.tele=true;
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
e.data.tx=clamp(pp.x+Math.cos(a)*60,ROOM.x+60,ROOM.x+ROOM.w-60);
e.data.ty=clamp(pp.y+Math.sin(a)*60,ROOM.y+60,ROOM.y+ROOM.h-60);
sparks(e.x,e.y,col,8,160,.4,3);
}
if(e.data.tele&&e.data.t>.6&&!e.data.jumped){
e.data.jumped=true;
e.x=e.data.tx;e.y=e.data.ty;
sparks(e.x,e.y,acc,14,220,.5,3,true);
sfx.thud();game.shake=Math.max(game.shake,8);
const n=hard?12:8;
for(let i=0;i<n;i++){
const a=i/n*TAU;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*220,vy:Math.sin(a)*220,r:6,c:col});
}
}
if(e.data.jumped&&e.data.t>1.0)cwKnightEnd(e);
}
else if(e.pat==='armory'){
e.data.t-=dt;
const maxS=hard?8:5;
if(e.data.t<=0&&e.data.spawned<maxS){
e.data.spawned++;e.data.t=hard?.15:.2;
const a=rnd(TAU),dd=rnd(60,200);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,50);
ebullets.push({x:pt.x,y:pt.y,vx:0,vy:0,r:14,c:acc,mine:true,armT:.4,life:hard?8:6});
}
if(e.data.spawned>=maxS&&e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='bombardment'){
e.data.t-=dt;
const maxS=hard?12:8;
if(e.data.t<=0&&e.data.shots<maxS){
e.data.shots++;e.data.t=hard?.08:.1;
const a=Math.atan2(pp.y-e.y,pp.x-e.x)+rnd(-.2,.2);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*280,vy:Math.sin(a)*280,r:6,c:acc});
}
if(e.data.shots>=maxS&&e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='bulletstorm'){
e.data.t-=dt;
const maxB=hard?5:3;
if(e.data.t<=0&&e.data.bursts<maxB){
e.data.bursts++;e.data.t=hard?.25:.3;
const n=hard?14:10;
const off=rnd(TAU);
for(let i=0;i<n;i++){
const a=off+i/n*TAU;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*240,vy:Math.sin(a)*240,r:6,c:col});
}
sfx.spit();sfx.growl();
}
if(e.data.bursts>=maxB&&e.stT>=1.2)cwKnightEnd(e);
}
else if(e.pat==='carpet'){
if(!e.data.fired){
e.data.fired=true;
/* chuva pesada cobrindo metade da tela */
const n=hard?20:14;
const dir=Math.random()<.5;
for(let i=0;i<n;i++){
const x=dir?ROOM.x+rnd(0,ROOM.w*.5):ROOM.x+ROOM.w*.5+rnd(0,ROOM.w*.5);
const y=ROOM.y-30;
const a=Math.PI/2+rnd(-.15,.15);
ebullets.push({x:x,y:y,vx:Math.cos(a)*220,vy:Math.sin(a)*220,r:6,c:acc});
}
sfx.howl();game.shake=Math.max(game.shake,8);
}
if(e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='absorb'){
e.data.t+=dt;
if(e.data.phase==='windup'&&e.data.t>.5){
e.data.phase='pull';e.data.t=0;
sfx.howl();game.shake=Math.max(game.shake,8);
}
if(e.data.phase==='pull'){
const dx=e.x-pp.x,dy=e.y-pp.y,D=Math.hypot(dx,dy)||1;
pp.x+=dx/D*180*dt;pp.y+=dy/D*180*dt;
clampArena(pp,pp.r);
if(D<40){
e.data.phase='absorbed';e.data.t=0;
sfx.explode();game.flash=.6;game.shake=18;
sparks(pp.x,pp.y,acc,18,260,.5,4,true);
}
}
if(e.data.phase==='absorbed'&&e.data.t<2.0){
pp.x=lerp(pp.x,e.x+50,1-Math.exp(-4*dt));
pp.y=lerp(pp.y,e.y+50,1-Math.exp(-4*dt));
if(e.data.t<.1){
/* absorve TODOS os elementos atuais do Thor de uma vez */
if(game.hasShot)e.copied=e.copied||[];if(game.hasShot&&!e.copied.includes('shot'))e.copied.push('shot');
if(game.hasBite&&!e.copied.includes('bite'))e.copied.push('bite');
if(game.ymir&&!e.copied.includes('ice'))e.copied.push('ice');
if(game.incendio&&!e.copied.includes('fire'))e.copied.push('fire');
if(game.miasma&&!e.copied.includes('poison'))e.copied.push('poison');
texts.push({x:pp.x,y:pp.y-30,txt:'FOME ABSORVEU TUDO',t:0,life:1.6,c:'#7a5b8a',size:16,disp:true});
}
}else if(e.data.phase==='absorbed'&&e.data.t>=2.0){
e.data.phase='release';e.data.t=0;
const ang=Math.atan2(pp.y-e.y,pp.x-e.x);
pp.x=e.x+Math.cos(ang)*250;pp.y=e.y+Math.sin(ang)*250;
clampArena(pp,pp.r);
sfx.spit();
}
if(e.data.phase==='release'&&e.data.t>.4)cwKnightEnd(e);
}
else if(e.pat==='mirror'){
if(!e.data.fired){
e.data.fired=true;
/* usa poderes copiados em rajada — atira projéteis que parecem tiros do Thor */
const n=hard?14:10;
const off=rnd(TAU);
for(let i=0;i<n;i++){
const a=off+i/n*TAU;
/* cor mímica do tiro do cão (#cfe9ff) */
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*230,vy:Math.sin(a)*230,r:5,c:'#cfe9ff'});
}
sfx.shotS();sfx.spit();
/* se copiou mordida: também detona em área */
if(e.copied&&e.copied.includes('bite')){
if(dmk()){
dmkCircle(e.x,e.y,Math.round(19*dmkDen()),(hard?320:290)*dmkSp(),{c:'#d9465a'});
dmkFan(e.x,e.y,Math.atan2(pp.y-e.y,pp.x-e.x),.8,Math.round(5*dmkDen()),300*dmkSp(),{c:'#5e5036',quiet:true});
}else{
rings.push({x:e.x,y:e.y,r:30,vr:hard?380:320,th:14,gapA:rnd(TAU),gapW:1.4,c:'#d9465a'});
}
sfx.bite();
}
}
if(e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='empty'){
e.data.t-=dt;
const maxM=hard?6:4;
if(e.data.t<=0&&e.data.marks<maxM){
e.data.marks++;e.data.t=hard?.3:.4;
const a=rnd(TAU),dd=rnd(80,260);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
/* vazio: marca que explode em silêncio e devora almas próximas */
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:.8,phase:'mark',c:'#5a4a55',silent:true});
}
if(e.data.marks>=maxM&&e.stT>=.8)cwKnightEnd(e);
}
else if(e.pat==='staving'){
e.data.t-=dt;
if(e.data.t<=0){
e.data.t=hard?.1:.13;
e.data.spin+=hard?.42:.36;
const arms=hard?7:5;
for(let k=0;k<arms;k++){
const a=e.data.spin+k*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*200,vy:Math.sin(a)*200,r:6,c:acc});
const a2=a+Math.PI;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a2)*180,vy:Math.sin(a2)*180,r:5,c:col});
}
}
if(e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='blink'){
e.data.t+=dt;
if(!e.data.tele&&e.data.t>.2){
e.data.tele=true;
sparks(e.x,e.y,col,10,180,.4,4);
const a=rnd(TAU),dd=rnd(120,200);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
e.data.tx=pt.x;e.data.ty=pt.y;
}
if(e.data.tele&&e.data.t>.55&&!e.data.fired){
e.data.fired=true;
e.x=e.data.tx;e.y=e.data.ty;
sparks(e.x,e.y,acc,16,260,.5,4,true);
sfx.thud();game.shake=Math.max(game.shake,10);
const n=hard?16:12;
for(let i=0;i<n;i++){
const a=i/n*TAU;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*230,vy:Math.sin(a)*230,r:6,c:acc});
}
}
if(e.data.fired&&e.data.t>1.0){e.data.jumps++;if(e.data.jumps<(hard?3:2)){e.data.tele=false;e.data.fired=false;e.data.t=0;}else cwKnightEnd(e);}
}
else if(e.pat==='falsecut'){
e.data.t+=dt;
if(!e.data.fakes){e.data.fakes=0;}
if(e.data.t>.3&&e.data.fakes<2&&!e.data.fired){
e.data.fakes++;
e.data.t=0;
/* finta: 50% chance de disparar falso (sem dano) */
if(Math.random()<.5){
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
const n=4;
for(let i=0;i<n;i++){
const aa=a+(i-(n-1)/2)*.18;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*220,vy:Math.sin(aa)*220,r:5,c:'#5e5036',fake:true});
}
sfx.spit();
}else{
/* golpe real */
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
const n=hard?6:4;
for(let i=0;i<n;i++){
const aa=a+(i-(n-1)/2)*.14;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*280,vy:Math.sin(aa)*280,r:6,c:acc});
}
sfx.growl();
}
}
if(e.data.fakes>=2&&e.stT>=1.2)cwKnightEnd(e);
}
else if(e.pat==='deathmark'){
/* HITKILL telegrafado: marca o chão, depois explode em linha mortal */
if(!e.data.fired){
e.data.markT+=dt;
if(e.data.markT<.6){
/* linha telegrafada do cavaleiro até o jogador */
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
ctx.save();
ctx.setLineDash([10,8]);
ctx.strokeStyle='rgba(201,164,76,'+(.5+.3*Math.sin(game.t*18))+')';
ctx.lineWidth=4;
ctx.beginPath();ctx.moveTo(e.x,e.y);
ctx.lineTo(e.x+Math.cos(a)*1200,e.y+Math.sin(a)*1200);
ctx.stroke();ctx.setLineDash([]);
ctx.restore();
}else{
e.data.fired=true;
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
/* HITKILL — aviso claro dado acima */
const L=1400;
const ex2=e.x+Math.cos(a)*L,ey2=e.y+Math.sin(a)*L;
if(!player.dead&&segDist(pp.x,pp.y,e.x,e.y,ex2,ey2)<24+pp.r){
killPlayerInstant('MARCA DA MORTE');
}
/* efeito visual */
for(let i=0;i<8;i++){
const t=i/8;
const px=lerp(e.x,ex2,t),py=lerp(e.y,ey2,t);
sparks(px,py,acc,5,160,.4,3,true);
}
sfx.explode();game.shake=Math.max(game.shake,10);
}
}
if(e.data.fired&&e.stT>=1.0)cwKnightEnd(e);
}
else if(e.pat==='reaper'){
e.data.t+=dt;
e.data.arc+=dt*5;
if(Math.random()<dt*12){
const a=e.data.arc;
for(let i=0;i<6;i++){
const aa=a+i*.2-Math.PI/3;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*240,vy:Math.sin(aa)*240,r:5,c:acc});
}
}
if(e.stT>=1.2)cwKnightEnd(e);
}
}
function cwKnightEnd(e){
e.st='float';e.stT=0;e.atkT=(game.hard?.7:1.1)+rnd(.4);
}
/* Triunfo: Última Conquista do Cavaleiro Branco.
   Por 60s, ambos ficam imortais e os golpes do cavaleiro hitkillam.
   Corações caem pelo campo — o jogador precisa coletar todos. */
function startConquestTriumph(e){
e.triunfo=true;e.triumphT=60;e.invuln=true;game.knightInvuln=true;
game.knightHearts=[];game.knightHeartsCollected=0;
game.knightHeartsNeeded=8;
game.banner={type:'boss',txt:'TRIUNFO — ÚLTIMA CONQUISTA',sub:'cavaleiro e cão imortais. colete os corações!',t:0,dur:3.6};
sfx.levelup();sfx.roar();game.flash=.6;game.shake=22;
}
function updateConquestTriumph(dt,e){
e.triumphT-=dt;
/* dropa um coração a cada ~4s */
if(Math.random()<dt*.25){
const a=rnd(TAU),dd=rnd(80,260);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,40);
game.knightHearts.push({x:pt.x,y:pt.y,t:0,life:12});
}
/* coleta */
game.knightHearts=game.knightHearts.filter(h=>{
const d=dist(player.x,player.y,h.x,h.y);
if(d<40){
game.knightHeartsCollected++;
sparks(player.x,player.y,'#ffd9a0',10,200,.5,3,true);
sfx.heart();
return false;
}
h.t+=dt;
return h.t<h.life;
});
/* se coletou todos: cavaleiro morre */
if(game.knightHeartsCollected>=game.knightHeartsNeeded){
e.invuln=false;
e.hp=1;
e.triunfo=false;game.knightInvuln=false;
texts.push({x:e.x,y:e.y-60,txt:'CONQUISTA COMPLETA',t:0,life:2,c:'#ffd9a0',size:18,disp:true});
}
if(e.triumphT<=0){
/* tempo acabou — jogador perde a luta mas não é game over comum */
e.invuln=false;
e.hp=Math.max(e.hp,e.maxHp*.15);
e.triunfo=false;game.knightInvuln=false;
game.flash=.5;
texts.push({x:e.x,y:e.y-60,txt:'O TEMPO ESGOTOU',t:0,life:2,c:'#d9465a',size:18,disp:true});
}
}
/* Triunfo: Guerra Sem Fim do Cavaleiro Vermelho.
   Arena chove armas por 45s — sobreviver + quebrar as armas (5 spawns). */
function startWarTriumph(e){
e.triunfo=true;e.triumphT=45;e.invuln=true;game.knightInvuln=true;
game.knightHearts=[];game.knightHeartsCollected=0;
game.knightHeartsNeeded=5;
game.banner={type:'boss',txt:'TRIUNFO — GUERRA SEM FIM',sub:'armas chovem. destrua as 5 armas invocadas!',t:0,dur:3.6};
sfx.levelup();sfx.roar();game.flash=.6;game.shake=22;
}
function updateWarTriumph(dt,e){
e.triumphT-=dt;
if(Math.random()<dt*1.2){
/* invoca "arma" — marcador que vira inimigo frágil que precisa ser destruído */
const a=rnd(TAU),dd=rnd(80,260);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,40);
/* representado como um ebullet-mine que precisa ser "destruído" pelo jogador */
ebullets.push({x:pt.x,y:pt.y,vx:0,vy:0,r:18,c:'#d9465a',mine:true,armT:0,life:8,triumphWeapon:true,hp:5});
}
/* conta quantas armas o jogador já destruiu (ao acertar um ebullet com triumphWeapon) */
/* incrementado em updateBullets quando acertado */
if(game.knightHeartsCollected>=game.knightHeartsNeeded){
e.invuln=false;e.hp=1;e.triunfo=false;game.knightInvuln=false;
texts.push({x:e.x,y:e.y-60,txt:'GUERRA VENCIDA',t:0,life:2,c:'#ffd9a0',size:18,disp:true});
}
if(e.triumphT<=0){
e.invuln=false;e.hp=Math.max(e.hp,e.maxHp*.15);e.triunfo=false;game.knightInvuln=false;
texts.push({x:e.x,y:e.y-60,txt:'A GUERRA NÃO TERMINOU',t:0,life:2,c:'#d9465a',size:18,disp:true});
}
}
/* Triunfo: Banquete do Fim do Cavaleiro Preto.
   A arena vai encolhendo por 30s — sobreviver + durar até o fim. */
function startFamineTriumph(e){
e.triunfo=true;e.triumphT=30;e.invuln=true;game.knightInvuln=true;
game.knightHearts=[];game.knightHeartsCollected=0;
game.knightHeartsNeeded=1;
game.banner={type:'boss',txt:'TRIUNFO — BANQUETE DO FIM',sub:'a arena é devorada. sobreviva até o fim.',t:0,dur:3.6};
sfx.levelup();sfx.roar();game.flash=.6;game.shake=22;
}
function updateFamineTriumph(dt,e){
e.triumphT-=dt;
/* efeito visual: a arena encolhe — represented by removing decorativos */
if(Math.random()<dt*8){
particles.push({x:rnd(W),y:rnd(H),vx:0,vy:0,life:.4,t:0,r:rnd(20,60),c:'#5a4a55',alpha:.3,drag:1});
}
/* atira projéteis em direção ao centro */
if(Math.random()<dt*4){
const a=rnd(TAU);
ebullets.push({x:e.x+Math.cos(a)*200,y:e.y+Math.sin(a)*200,vx:-Math.cos(a)*120,vy:-Math.sin(a)*120,r:6,c:'#7a5b8a'});
}
if(e.triumphT<=0){
/* sobreviveu — o banquete termina */
e.invuln=false;e.hp=1;e.triunfo=false;game.knightInvuln=false;
game.knightHeartsCollected=1;
texts.push({x:e.x,y:e.y-60,txt:'A FOME SE CURVOU',t:0,life:2,c:'#ffd9a0',size:18,disp:true});
}
}
/* Triunfo: O Fim do Cavaleiro Descorado.
   25s de batalha com hitkill absoluto em ambos os lados.
   Condição: causar 3 "marcas" (acertar o cavaleiro 3x com qualquer arma). */
function startDeathTriumph(e){
e.triunfo=true;e.triumphT=25;e.invuln=true;e.triumphHits=0;game.knightInvuln=true;
game.knightHeartsNeeded=3;game.knightHeartsCollected=0;
game.banner={type:'boss',txt:'TRIUNFO — O FIM',sub:'silêncio. cada golpe mata. acerte-o 3x.',t:0,dur:3.6};
sfx.levelup();sfx.echo();game.flash=.5;game.shake=14;
/* silêncio visual: zera decoração e penumbra brevemente */
}
function updateDeathTriumph(dt,e){
e.triumphT-=dt;
/* o cavaleiro se teleporta e atira — o jogador precisa acertar 3x */
if(Math.random()<dt*2){
const a=rnd(TAU),dd=rnd(150,300);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,50);
sparks(e.x,e.y,'#c9a44c',10,200,.4,3,true);
e.x=pt.x;e.y=pt.y;
sparks(e.x,e.y,'#5e5036',14,240,.5,4,true);
sfx.thud();
}
/* atira foice mortal */
if(Math.random()<dt*3){
const a=Math.atan2(player.y-e.y,player.x-e.x);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*380,vy:Math.sin(a)*380,r:8,c:'#c9a44c',hitkill:true});
}
/* o contador de hits é incrementado em updateBullets ao acertar o cavaleiro */
if(game.knightHeartsCollected>=game.knightHeartsNeeded){
e.invuln=false;e.hp=1;e.triunfo=false;game.knightInvuln=false;
texts.push({x:e.x,y:e.y-60,txt:'A MORTE MORREU',t:0,life:2,c:'#ffd9a0',size:18,disp:true});
}
if(e.triumphT<=0){
e.invuln=false;e.hp=Math.max(e.hp,e.maxHp*.15);e.triunfo=false;game.knightInvuln=false;
texts.push({x:e.x,y:e.y-60,txt:'O FIM NÃO VEIO',t:0,life:2,c:'#d9465a',size:18,disp:true});
}
}
/* handler genérico: ativa triunfo quando HP < 12% e ainda não ativou */
function cwCheckTriumph(e){
if(e.triunfo)return;
if(e.hp>Math.max(1,e.maxHp*.12))return;
if(e.type==='cw1')startConquestTriumph(e);
else if(e.type==='cw2')startWarTriumph(e);
else if(e.type==='cw3')startFamineTriumph(e);
else if(e.type==='cw4')startDeathTriumph(e);
}
/* atualiza o triunfo ativo do cavaleiro */
function updateKnightTriumph(dt,e){
if(!e.triunfo)return;
if(e.type==='cw1')updateConquestTriumph(dt,e);
else if(e.type==='cw2')updateWarTriumph(dt,e);
else if(e.type==='cw3')updateFamineTriumph(dt,e);
else if(e.type==='cw4')updateDeathTriumph(dt,e);
}
/* checa e ativa o triunfo a cada update */
function knightAny2(){return enemies.find(e=>['cw1','cw2','cw3','cw4'].includes(e.type)&&!e.dead);}
/* ====== desenho do cavaleiro no campo (chamado de drawEnemy) ====== */
function drawKnight(e){
const s=Math.min(1,e.spawnT);
ctx.fillStyle='rgba(0,0,0,0.3)';
ctx.beginPath();ctx.ellipse(e.x,e.y+e.r*.55,e.r*s,e.r*.4*s,0,0,TAU);ctx.fill();
/* PNG EDITION: inimigos normais podem ser trocados por PNG sem tocar na lógica.
   Bosses, glitches e a camada do Falso Paraíso continuam vetoriais/dinâmicos. */
if(window.THOR_PNG_MODE&&window.THOR_PNG&&window.THOR_PNG.drawEnemy){
  if(window.THOR_PNG.drawEnemy(ctx,e,game,s)){
    /* PNG EDITION: aura de triunfo continua sobre o sprite externo */
    if(e.triunfo){ctx.globalAlpha=.3+.2*Math.sin(game.t*5);ctx.strokeStyle=KNIGHT_DATA[e.type].accent;ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,e.r+34,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
    return;
  }
}
ctx.save();
ctx.translate(e.x,e.y);ctx.scale(s,s);ctx.translate(-e.x,-e.y);
const kd=KNIGHT_DATA[e.type];
ctx.globalAlpha=.15+.1*Math.sin(game.t*3+e.seed);
ctx.fillStyle=kd.col;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+22,0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.translate(0,0);
drawKnightBody(e.type,e.x,e.y,e.r,1);
/* aura de triunfo ativo */
if(e.triunfo){
ctx.globalAlpha=.3+.2*Math.sin(game.t*5);
ctx.strokeStyle=kd.accent;ctx.lineWidth=4;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+34,0,TAU);ctx.stroke();
ctx.globalAlpha=1;
/* anel rotativo interno */
ctx.save();ctx.translate(e.x,e.y);ctx.rotate(game.t*2);
ctx.strokeStyle=kd.accent;ctx.lineWidth=2;
for(let k=0;k<6;k++){
const a=k/6*TAU;
ctx.beginPath();
ctx.moveTo(Math.cos(a)*(e.r+24),Math.sin(a)*(e.r+24));
ctx.lineTo(Math.cos(a)*(e.r+34),Math.sin(a)*(e.r+34));
ctx.stroke();
}
ctx.restore();
}
/* telegrafia do ataque (assina visual) */
if(e.st==='tele'){
const sk=sigKeyForKnight(e);
const dur=e.p2?.45:.65;
const prog=clamp(e.stT/dur,0,1);
drawAttackSig(e.x,e.y,e.r+22,sk,prog,kd.accent);
}
/* HP flutuante: barra extra do cavalo se ainda montado */
if(e.flash>0){
ctx.fillStyle='rgba(255,240,210,'+Math.min(.85,e.flash*7)+')';
ctx.beginPath();ctx.arc(e.x,e.y,e.r+10,0,TAU);ctx.fill();
}
ctx.restore();
}
/* mapeia padrões dos cavaleiros para chaves em ATTACK_SIG (algumas colidem) */
function sigKeyForKnight(e){
const t=e.type,p=e.pat;
if(t==='cw1'){
if(p==='charge')return'cw_charge';
if(p==='combo')return'cw_combo';
return'cw_'+p;
}
if(t==='cw2'){
if(p==='charge')return'cw_charge';
return'cw2_'+p;
}
if(t==='cw3'){
if(p==='charge')return'cw_charge';
return'cw3_'+p;
}
if(t==='cw4'){
if(p==='chase')return'cw4_chase';
return'cw4_'+p;
}
return p;
}
/* ===== drops exclusivos (reliquias) ===== */
const KNIGHT_DROPS=[
{id:'knight_conquest',name:'COROA DO CONQUISTADOR',desc:'-15% velocidade · +50% dano · o cone de mordida fica 30% maior e cada mordida rejeita 1 projetil do inimigo',chk:m=>m.knights&&m.knights.conquest>=1,apply(){P.dmgMult*=1.5;P.speedMult*=.85;P.biteRange*=1.3;game.knightConquest=true;}},
{id:'knight_war',name:'ARSENAL DE GUERRA',desc:'+60% dano de projéteis · -25% velocidade de tiro · invoca uma serra orbital a cada 12s',chk:m=>m.knights&&m.knights.war>=1,apply(){P.dmgMult*=1.6;P.rateMult*=.75;game.knightWar=true;}},
{id:'knight_famine',name:'BALANÇA VAZIA',desc:'+30% dano · -25% magnetismo de almas · mordida tem 25% de roubar 1 alma extra do inimigo',chk:m=>m.knights&&m.knights.famine>=1,apply(){P.dmgMult*=1.3;P.magnetMult*=.75;game.knightFamine=true;}},
{id:'knight_death',name:'FOICE DO FIM',desc:'+100% dano · -1 coração máximo · a cada 8s, um golpe de perto executa inimigos com <30% HP',chk:m=>m.knights&&m.knights.death>=1,apply(){P.dmgMult*=2;player.maxHp=Math.max(50,player.maxHp-25);if(player.hp>player.maxHp)player.hp=player.maxHp;game.knightDeath=true;game.knightDeathT=0;}},
{id:'apocalypse',name:'SELO DO APOCALIPSE',desc:'+50% de tudo (dano, velocidade, taxa de tiro, magnetismo) · -1 coração máximo · você superou os 4 Cavaleiros',chk:m=>m.knights&&m.knights.conquest>=1&&m.knights.war>=1&&m.knights.famine>=1&&m.knights.death>=1,apply(){P.dmgMult*=1.5;P.speedMult*=1.5;P.rateMult*=1.5;P.magnetMult*=1.5;player.maxHp=Math.max(50,player.maxHp-25);if(player.hp>player.maxHp)player.hp=player.maxHp;game.apocalypse=true;}}
];
/* ============ puzzle, janela e cena da janela ============ */
function updatePuzzle(dt){
 const pz=game.puzzle;
 if(!pz||pz.solved||player.dead)return;
 if(pz.failT>0){pz.failT-=dt;return;}
 if(pz.type==='braziers')updateBraziers(dt);
 else if(pz.type==='echoes')updateEchoes(dt);
 else if(pz.type==='box')updateBox(dt);
 else if(pz.type==='quiz')updateQuiz(dt);
 else if(pz.type==='cores')updateCores(dt);/* v1.2.0 */
 else updatePlates(dt);
}
function updateRoomWindow(dt){
 if(game.windowScene)return;
 const w=game.roomWindow;
 if(!w||w.used||player.dead)return;
 if(enemies.length||spawnMarks.length||boss.active)return;
 w.near=dist(player.x,player.y,w.x,w.iy)<62;
}
function updateWindowScene(dt){
 if(!game.windowScene)return;
 const sc=game.windowScene;
 sc.t+=dt;
 if(sc.tree&&!sc.treeSnd&&sc.t>=2){
  sc.treeSnd=true;
  blip('sine',55,38,2.2,.06);
 }
 const moving=held('up')||held('down')||held('left')||held('right');
 if(sc.t>.35&&moving){
  game.windowScene=null;
  blip('sine',220,150,.15,.05);
 }
}
/* ============ penumbra das almas ============ */
function buildPenumbra(r){
 const area=game.absRects.reduce(function(s,rc){return s+rc.w*rc.h;},0);
 let lvl=0;
 if(r.kind==='empty'){
  if(r.flavor==='souls')lvl=2;
  else if(r.flavor!=='silent')lvl=Math.random()<.55?1:0;
 }else if(r.kind==='challenge'&&Math.random()<.4)lvl=1;
 else if(area>245000&&Math.random()<.45)lvl=1;
 else if((r.kind==='treasure'||r.kind==='secret')&&Math.random()<.25)lvl=1;
 else if(r.kind==='puzzle'&&Math.random()<.3)lvl=1;
 game.penumbra={lvl:lvl,t:0,wisps:[],fog:[],shades:[],shadeT:rnd(5,12)};
 if(!lvl)return;
 const nw=lvl===2?irnd(6,9):irnd(3,5);
 for(let i=0;i<nw;i++){
  const p=randRoomPointM(Math.random,40);
  game.penumbra.wisps.push({x:p.x,y:p.y,ph:rnd(TAU),sp:rnd(3,8),a:rnd(TAU),r:rnd(1.2,2.3),seed:rnd(10)});
 }
 const nf=lvl===2?irnd(4,6):irnd(2,3);
 for(let i=0;i<nf;i++){
  const p=randRoomPointM(Math.random,70);
  game.penumbra.fog.push({x:p.x,y:p.y,w:rnd(90,180),h:rnd(24,42),vx:rnd(-7,7),ph:rnd(TAU),a:rnd(.045,.085)});
 }
}
function shadeSpot(){
 let best=null,bd=-1;
 for(let i=0;i<26;i++){
  const p=randRoomPointM(Math.random,64);
  let wall=1e9;
  for(const rc of game.absRects)wall=Math.min(wall,p.x-rc.x,rc.x+rc.w-p.x,p.y-rc.y,rc.y+rc.h-p.y);
  if(wall>95)continue;
  const d=dist(p.x,p.y,player.x,player.y);
  if(d>bd){bd=d;best=p;}
 }
 if(!best||bd<220)return null;
 return best;
}
function spawnShade(){
 const p=shadeSpot();
 if(!p){game.penumbra.shadeT=rnd(6,10);return;}
 game.penumbra.shades.push({x:p.x,y:p.y,phase:'in',t:0,t2:0,t3:0,life:rnd(16,28),ph:rnd(TAU),h:rnd(50,68)});
 blip('sine',85,55,2.5,.02);
}
function dissolveShade(s){
 for(let k=0;k<10;k++)particles.push({x:s.x+rnd(-9,9),y:s.y-rnd(0,s.h*.8),vx:rnd(-16,16),vy:rnd(-52,-14),life:rnd(.6,1.4),t:0,r:rnd(1,2.3),c:k%3?'#3d4450':'#bfd8e8',drag:.6,glow:k%3===2});
 blip('sine',320,120,.5,.035);
}
function updatePenumbra(dt){
 const pn=game.penumbra;
 if(!pn||!pn.lvl||ROOM.inverted)return;
 pn.t+=dt;
 for(const w of pn.wisps){
  w.a+=Math.sin(game.t*.5+w.seed)*dt*.5;
  w.x+=Math.cos(w.a)*w.sp*dt;
  w.y+=Math.sin(w.a)*w.sp*dt;
  if(!inRoomXY(w.x,w.y,20)){const p=randRoomPointM(Math.random,40);w.x=p.x;w.y=p.y;}
 }
 for(const f of pn.fog){
  f.x+=f.vx*dt;
  if(!inRoomXY(f.x,f.y,90)){const p=randRoomPointM(Math.random,80);f.x=p.x;f.y=p.y;}
 }
 if(!pn.shades.length&&pn.lvl>=2){
  pn.shadeT-=dt;
  if(pn.shadeT<=0){spawnShade();pn.shadeT=rnd(24,42);}
 }
 for(let i=pn.shades.length-1;i>=0;i--){
  const s=pn.shades[i];
  if(s.phase==='in'){s.t+=dt;if(s.t>=4.2){s.phase='stay';s.t2=0;}}
  if(s.phase==='stay'){s.t2+=dt;if(s.t2>=s.life){s.phase='out';s.t3=0;}}
  if(s.phase==='out'){
   s.t3+=dt;
   if(s.t3>=1.8){pn.shades.splice(i,1);continue;}
  }
  if(!player.dead&&s.phase!=='out'&&dist(player.x,player.y,s.x,s.y)<150){
   dissolveShade(s);
   pn.shades.splice(i,1);
  }
 }
}
function drawPenumbra(){
 const pn=game.penumbra;
 if(!pn||!pn.lvl||ROOM.inverted)return;
 if(pn.fog.length){
  ctx.save();
  ctx.beginPath();
  for(const rc of game.absRects)ctx.rect(rc.x,rc.y,rc.w,rc.h);
  ctx.clip();
  for(const f of pn.fog){
   const a=f.a*(.65+.35*Math.sin(game.t*.4+f.ph));
   ctx.globalAlpha=a;
   ctx.fillStyle='#aeb8cc';
   ctx.beginPath();ctx.ellipse(f.x,f.y,f.w,f.h,0,0,TAU);ctx.fill();
   ctx.globalAlpha=a*.55;
   ctx.beginPath();ctx.ellipse(f.x-f.w*.32,f.y+5,f.w*.5,f.h*.55,0,0,TAU);ctx.fill();
   ctx.beginPath();ctx.ellipse(f.x+f.w*.3,f.y-3,f.w*.42,f.h*.5,0,0,TAU);ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha=1;
 }
 for(const s of pn.shades)drawShade(s);
 for(const w of pn.wisps){
  const pul=.5+.5*Math.sin(game.t*1.6+w.ph);
  ctx.globalAlpha=.2+.28*pul;
  ctx.fillStyle='#bfd8e8';
  ctx.beginPath();ctx.arc(w.x,w.y,w.r,0,TAU);ctx.fill();
  ctx.globalAlpha=.09+.1*pul;
  ctx.beginPath();ctx.arc(w.x,w.y,w.r*3.2,0,TAU);ctx.fill();
 }
 ctx.globalAlpha=1;
}
function drawShade(s){
 let a=0;
 if(s.phase==='in')a=.5*ramp(s.t,2.8,4.2);
 else if(s.phase==='stay')a=.5*(.88+.12*Math.sin(game.t*1.3+s.ph));
 else a=.5*(1-ramp(s.t3,0,1.6));
 if(a<=.015)return;
 const sway=Math.sin(game.t*.7+s.ph)*2;
 ctx.save();
 ctx.translate(s.x+sway*.4,s.y);
 ctx.globalAlpha=a*.4;
 ctx.fillStyle='#000';
 ctx.beginPath();ctx.ellipse(0,3,15,5,0,0,TAU);ctx.fill();
 ctx.globalAlpha=a;
 ctx.fillStyle='#08070c';
 ctx.beginPath();
 ctx.moveTo(-8,2);
 ctx.bezierCurveTo(-10,-s.h*.5,-6,-s.h*.62,-4,-s.h*.7);
 ctx.quadraticCurveTo(0,-s.h*.82,4,-s.h*.7);
 ctx.bezierCurveTo(6,-s.h*.62,10,-s.h*.5,8,2);
 ctx.quadraticCurveTo(0,7,-8,2);
 ctx.closePath();
 ctx.fill();
 ctx.beginPath();
 ctx.arc(sway*.6,-s.h*.8,s.h*.12,0,TAU);
 ctx.fill();
 ctx.globalAlpha=a*.28;
 ctx.strokeStyle='#7e8a99';
 ctx.lineWidth=1;
 ctx.beginPath();
 ctx.arc(sway*.6,-s.h*.8,s.h*.12,0,TAU);
 ctx.stroke();
 ctx.restore();
 ctx.globalAlpha=1;
}
function drawPuzzle(){
 const pz=game.puzzle;
 if(!pz)return;
 if(pz.type==='braziers')drawPzBraziers(pz);
 else if(pz.type==='echoes')drawPzEchoes(pz);
 else if(pz.type==='box')drawPzBox(pz);
 else if(pz.type==='quiz')drawPzQuiz(pz);
 else if(pz.type==='cores')drawPzCores(pz);/* v1.2.0 */
 else drawPzPlates(pz);
}
/* ============ v0.9.9: PUZZLE DA CAIXA — empurre até a marca ============
   Simples e físico: ande contra a caixa para empurrá-la (ela desliza até
   bater na parede/decoração). Trancada até resolver; se a caixa enrolar
   demais num canto, ela "respira" e volta ao lugar de origem. */
function buildBox(){
 const m=game.absMain;
 const cx=m.x+m.w/2,cy=m.y+m.h*.45;
 /* v0.9.11: caixa e alvo nascem NO MESMO RETÂNGULO do chão — antes podiam cair
    em retângulos ligados por um corredor estreito e o empurrão nunca cruzava a
    emenda (roomPt com pad 26 cria uma zona morta maior que a própria emenda).
    Escolhemos um retângulo por área e sorteamos os dois pontos dentro dele. */
 const rects=game.absRects.slice();
 let tot=0;for(const rc of rects)tot+=rc.w*rc.h;
 function pickRect(){
  let rr=Math.random()*tot;
  for(const rc of rects){rr-=rc.w*rc.h;if(rr<=0)return rc;}
  return m;
 }
 let box=null,target=null,tries=0,R=pickRect();
 while(tries++<300&&!box){
  const p=randRoomPointM(Math.random,80);
  if(rects.length>1&&!(p.x>R.x+80&&p.x<R.x+R.w-80&&p.y>R.y+80&&p.y<R.y+R.h-80))continue;
  if(dist(p.x,p.y,cx,cy)<100)continue;
  if(dist(p.x,p.y,player.x,player.y)<100)continue;
  let ok=true;
  for(const d of game.doors)if(dist(p.x,p.y,d.x,d.y)<90){ok=false;break;}
  for(const o of game.decor)if(o.solid!==false&&dist(p.x,p.y,o.x,o.y)<70){ok=false;break;}
  if(ok)box={x:p.x,y:p.y};
 }
 if(!box)box={x:cx,y:cy+70};
 tries=0;
 while(tries++<300&&!target){
  const p=randRoomPointM(Math.random,80);
  if(rects.length>1&&!(p.x>R.x+80&&p.x<R.x+R.w-80&&p.y>R.y+80&&p.y<R.y+R.h-80))continue;
  if(dist(p.x,p.y,cx,cy)<90)continue;
  if(dist(p.x,p.y,box.x,box.y)<170)continue;
  let ok=true;
  for(const d of game.doors)if(dist(p.x,p.y,d.x,d.y)<90){ok=false;break;}
  for(const o of game.decor)if(o.solid!==false&&dist(p.x,p.y,o.x,o.y)<70){ok=false;break;}
  if(ok)target={x:p.x,y:p.y};
 }
 if(!target)target=roomPt(box.x+180,box.y,60);
 game.puzzle={type:'box',box:box,home:{x:box.x,y:box.y},target:target,solved:false,cool:0,stuckT:0,ph:rnd(TAU)};
 game.banner={type:'small',txt:'A CAIXA E O PONTO',sub:'empurre a caixa até a marca no chão — ela desliza',t:0,dur:2.6};
 blip('sine',240,300,.2,.06);
}
function updateBox(dt){
 const pz=game.puzzle;
 const b=pz.box,t=pz.target;
 if(pz.cool>0)pz.cool-=dt;
 /* já em cima do ponto? */
 if(dist(b.x,b.y,t.x,t.y)<22){
  b.x=t.x;b.y=t.y;
  sparks(t.x,t.y,'#ffd9a0',14,200,.6,3,true);
  solvePuzzle();
  return;
 }
 /* empurrão: jogador encostado e andando em direção à caixa.
    v0.9.11: a teimosia (stuckT) agora acumula TAMBÉM durante o cool e quando
    a caixa não se move (parede/decoração) — antes, caixa encostada na parede
    refrescava o cool a cada tentativa e o resgate "volta ao lugar" nunca
    disparava (puzzle ficava sem solução). */
 let __dx=0,__dy=0;
 if(Math.abs(player.mvx)>Math.abs(player.mvy)){__dx=player.mvx>0?1:(player.mvx<0?-1:0);}
 else{__dy=player.mvy>0?1:(player.mvy<0?-1:0);}
 const __near=dist(player.x,player.y,b.x,b.y)<44;
 const __approach=__dx?(b.x-player.x)*__dx>0:((b.y-player.y)*__dy>0);
 const __pushing=__near&&__approach&&(__dx||__dy);
 if(__pushing&&pz.cool<=0){
  const __ox=b.x,__oy=b.y;
  b.x+=__dx*135*dt;b.y+=__dy*135*dt;
  /* parede da sala — pad 10: o enough p/ a caixa cruzar emendas estreitas
     entre retângulos do chão (pad 26 criava zona morta e a caixa travava). */
  const cl=roomPt(b.x,b.y,10);
  if(Math.abs(cl.x-b.x)>0.1||Math.abs(cl.y-b.y)>0.1){b.x=cl.x;b.y=cl.y;pz.cool=.12;}
  /* decoração sólida */
  resolveDecorCollision(b,20);
  /* empurrou e a caixa não andou NADA = teimosia em dobro */
  if(Math.abs(b.x-__ox)<.01&&Math.abs(b.y-__oy)<.01)pz.stuckT+=dt*2;
  else pz.stuckT+=dt;
  if(Math.random()<.3)particles.push({x:b.x+rnd(-12,12),y:b.y+14,vx:rnd(-20,20),vy:rnd(-30,-6),life:.4,t:0,r:2,c:'#4a3527',drag:1});
  if(Math.random()<.12)blip('square',90,70,.06,.04);
 }else if(__pushing){
  /* tentando empurrar mas no cool (encostada na parede) — também é teimosia */
  pz.stuckT+=dt;
 }else{
  /* não está empurrando agora — reseta o contador de teimosia devagar */
  pz.stuckT=Math.max(0,pz.stuckT-dt*2);
 }
 /* v0.9.11: o jogador NUNCA atravessa a caixa — anti-sobreposição roda SEMPRE
    (antes só dentro do bloco de empurrão: quando a caixa pausava no cool,
    o jogador atravessava e o empurrão quebrava para sempre).
    FIX REAL: a fórmula antiga era b.x - (player-b)/pd*30 — um ESPELHO através
    da caixa (teleportava o jogador para o lado OPOSTO em vez de empurrar para
    fora). Era isso que deixava atravessar e travar o empurrão. Agora empurra
    para FORA, na direção em que o jogador já está. */
 {
  const pd=dist(player.x,player.y,b.x,b.y);
  if(pd<30&&pd>0.01){
   player.x=b.x+(player.x-b.x)/pd*30;
   player.y=b.y+(player.y-b.y)/pd*30;
   clampArena(player,player.r);
  }
 }
 /* caixa teimando num canto longe do alvo: volta à origem */
 if(pz.stuckT>9&&dist(b.x,b.y,t.x,t.y)>90){
  b.x=pz.home.x;b.y=pz.home.y;pz.stuckT=0;pz.cool=.6;
  texts.push({x:b.x,y:b.y-36,txt:'a caixa respira e volta ao lugar',t:0,life:1.8,c:'#9c8f7c',size:11,disp:true});
  sfx.creak();
 }
}
function drawPzBox(pz){
 const b=pz.box,t=pz.target;
 /* marca no chão */
 const pl=1+.1*Math.sin(game.t*4);
 ctx.save();
 ctx.globalAlpha=.75;
 ctx.strokeStyle='#ffd9a0';ctx.lineWidth=2.4;
 ctx.beginPath();ctx.arc(t.x,t.y,20*pl,0,TAU);ctx.stroke();
 ctx.globalAlpha=.45;
 ctx.beginPath();ctx.arc(t.x,t.y,11*pl,0,TAU);ctx.stroke();
 ctx.globalAlpha=.85;
 ctx.fillStyle='rgba(255,217,160,.14)';
 ctx.beginPath();ctx.arc(t.x,t.y,20*pl,0,TAU);ctx.fill();
 txt('O PONTO',t.x,t.y-32,MONO,9,'#ffd9a0','center',2);
 /* linha sutil de guia */
 ctx.globalAlpha=.14+.08*Math.sin(game.t*2);
 ctx.setLineDash([5,9]);ctx.strokeStyle='#ffd9a0';ctx.lineWidth=1.4;
 ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(t.x,t.y);ctx.stroke();ctx.setLineDash([]);
 /* a caixa */
 ctx.globalAlpha=1;
 const wob=Math.sin(game.t*3+pz.ph)*.04;
 ctx.translate(b.x,b.y);ctx.rotate(wob);
 ctx.fillStyle='#6b4a2f';
 ctx.fillRect(-20,-20,40,40);
 ctx.fillStyle='#7d5738';
 ctx.fillRect(-20,-20,40,8);
 ctx.strokeStyle='#14100e';ctx.lineWidth=2.4;
 ctx.strokeRect(-20,-20,40,40);
 ctx.beginPath();ctx.moveTo(-20,-20);ctx.lineTo(20,20);ctx.moveTo(20,-20);ctx.lineTo(-20,20);ctx.stroke();
 ctx.restore();
}
/* ============ v0.9.9: PUZZLE DO SABER (raro) — a pedra pergunta ============
   Uma pergunta sobre o próprio jogo. Três pedestais de resposta — pise no
   certo. Errar desperta sombras e a pedra recusa. */
const QUIZ_BANK=[
 {q:'quem conduz a barca no rio escuro?',a:['CARONTE','O ERRANTE','O VELHO REI'],c:0},
 {q:'quantas cabeças tem o guardião do último selo?',a:['TRÊS','DUAS','SETE'],c:0},
 {q:'quem negocia pactos por almas?',a:['O ERRANTE','O VELHO REI','CARONTE'],c:0},
 {q:'qual é a moeda do Inferno?',a:['ALMAS','OURO','OSSOS'],c:0},
 {q:'o que abre a descida para o próximo círculo?',a:['DERROTAR O SENHOR DO MAPA','PAGAR EM ALMAS','ACENDER OS BRASEIROS'],c:0},
 {q:'qual destes é um mini-chefe?',a:['A VIÚVA','A LAMENTADORA','O CUSPEDOR'],c:0},
 {q:'quebrar a janela atrai...',a:['O ERRO 404','CHUVA DE ALMAS','NADA'],c:0},
 {q:'qual bênção congela os demônios?',a:['A BÊNÇÃO DO GELO','A BÊNÇÃO DA CHAMA','A BÊNÇÃO DA PEÇONHA'],c:0},
 {q:'o rei que joga xadrez com os mortos é...',a:['O VELHO REI','O REI SEM FACE','O REI BRANCO'],c:0},
 {q:'o martelo que orbita e caça se chama...',a:['O VEREDICTO','A FOICE DO FIM','O SELO QUEBRADO'],c:0},
 {q:'o livro do cão guarda...',a:['PACTOS E BESTIÁRIO','MAPAS ANTIGOS','FEITIÇOS PROIBIDOS'],c:0},
 {q:'quem executa inimigos com menos de 30% de vida?',a:['A FOICE DO FIM','A BALANÇA VAZIA','O SELO DO FIM'],c:0},
 {q:'antes dos demônios, havia...',a:['O PRIMEIRO FRIO E A PRIMEIRA CHAMA','SÓ LUZ','O VELHO REI'],c:0},
 {q:'o que os registros do Inferno apagaram?',a:['O ERRO 404','O RIO','O PEDÁGIO'],c:0},
 {q:'os Sete Selos prendem...',a:['OS ARQUIDEMÔNIOS','ANJOS','NADA'],c:0}
];
function buildQuiz(){
 const m=game.absMain;
 const cx=m.x+m.w/2,cy=m.y+m.h*.45;
 const qz=pick(QUIZ_BANK);
 const spots=[];let tries=0;
 while(spots.length<3&&tries++<300){
  const p=randRoomPointM(Math.random,70);
  if(dist(p.x,p.y,cx,cy)<130)continue;
  if(dist(p.x,p.y,player.x,player.y)<95)continue;
  let ok=true;
  for(const s of spots)if(dist(p.x,p.y,s.x,s.y)<150){ok=false;break;}
  for(const d of game.doors)if(dist(p.x,p.y,d.x,d.y)<90){ok=false;break;}
  for(const o of game.decor)if(o.solid!==false&&dist(p.x,p.y,o.x,o.y)<70){ok=false;break;}
  if(ok)spots.push(p);
 }
 while(spots.length<3){const a=spots.length/3*TAU-Math.PI/2;spots.push({x:cx+Math.cos(a)*190,y:cy+Math.sin(a)*150});}
 const order=[0,1,2];
 for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=order[i];order[i]=order[j];order[j]=t;}
 game.puzzle={type:'quiz',q:qz.q,opts:order.map((oi,i)=>({txt:qz.a[oi],x:spots[i].x,y:spots[i].y,correct:oi===qz.c,near:false})),stone:{x:cx,y:cy},solved:false,failT:0};
 game.banner={type:'small',txt:'A PEDRA QUE PERGUNTA',sub:'responda com os pés — pise na resposta certa',t:0,dur:2.8};
 blip('sine',320,420,.25,.06);
}
function updateQuiz(dt){
 const pz=game.puzzle;
 for(const o of pz.opts){
  const near=dist(player.x,player.y,o.x,o.y)<28;
  if(near&&!o.near&&!o.bad){
   if(o.correct){
    sparks(o.x,o.y,'#ffd9a0',16,220,.6,3,true);
    solvePuzzle();
    return;
   }
   o.bad=true;pz.failT=1;
   game.shake=Math.max(game.shake,7);
   blip('sawtooth',160,60,.28,.1);
   texts.push({x:o.x,y:o.y-34,txt:'a pedra recusa — e algo desperta',t:0,life:1.4,c:'#d9465a',size:11,disp:true});
   spawnMarkAt('sh',o.x+rnd(-50,50),o.y+rnd(-50,50));
   spawnMarkAt('sh',o.x+rnd(-50,50),o.y+rnd(-50,50));
  }
  o.near=near;
 }
}
function drawPzQuiz(pz){
 const s=pz.stone;
 ctx.save();
 /* a pedra-mestra */
 ctx.globalAlpha=1;
 ctx.strokeStyle='#bfd8e8';ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(s.x,s.y,15,0,TAU);ctx.stroke();
 ctx.fillStyle='#1a2228';
 ctx.beginPath();ctx.arc(s.x,s.y,11,0,TAU);ctx.fill();
 drawSymbol(0,s.x,s.y,5,'#bfd8e8',.9);
 /* pergunta, quebrada em até 2 linhas */
 const q=pz.q;
 let l1=q,l2='';
 if(q.length>40){const cut=q.lastIndexOf(' ',40);if(cut>18){l1=q.slice(0,cut);l2=q.slice(cut+1);}}
 ctx.globalAlpha=.9;
 txt(l1,s.x,s.y-40,MONO,12,'#e6dac4','center',3);
 if(l2)txt(l2,s.x,s.y-24,MONO,12,'#e6dac4','center',3);
 /* pedestais de resposta */
 for(const o of pz.opts){
  const col=o.bad?'#6e6357':o.correct&&pz.solved?'#ffd9a0':o.near?'#9fd8ff':'rgba(191,216,232,.75)';
  ctx.globalAlpha=.85;
  ctx.fillStyle='rgba(15,11,14,.9)';
  ctx.beginPath();ctx.ellipse(o.x,o.y+10,24,8,0,0,TAU);ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(o.x,o.y-4,17,0,TAU);ctx.stroke();
  if(o.bad){ctx.beginPath();ctx.moveTo(o.x-8,o.y-12);ctx.lineTo(o.x+8,o.y+4);ctx.stroke();}
  else{ctx.fillStyle='rgba(191,216,232,.10)';ctx.beginPath();ctx.arc(o.x,o.y-4,17,0,TAU);ctx.fill();}
  ctx.globalAlpha=o.bad?.45:.92;
  txt(o.txt,o.x,o.y-34,MONO,9,o.bad?'#6e6357':'#e6dac4','center',2);
 }
 ctx.globalAlpha=1;
 ctx.restore();
}
function updateDecor(dt){
 if(player.dead)return;
 for(const d of game.decor){
  if(d.t==='glyph'){
   if(d.on)continue;
   if(dist(player.x,player.y,d.x,d.y)<42){
    d.on=true;
    if(game.seenGlyphs.indexOf(d.sym)<0){
     game.seenGlyphs.push(d.sym);
     texts.push({x:d.x,y:d.y-26,txt:'uma marca antiga desperta',t:0,life:1.8,c:'#8fa8b8',size:11});
     sparks(d.x,d.y,'#bfd8e8',7,90,.7,2,true);
     blip('sine',360,520,.5,.05);
    }
   }
   continue;
  }
  if(d.lore&&!d.seen&&DECOR_LORE[d.t]&&dist(player.x,player.y,d.x,d.y)<44){
   d.seen=true;
   texts.push({x:d.x,y:d.y-30,txt:pick(DECOR_LORE[d.t]),t:0,life:2.2,c:'#6e6357',size:10});
  }
 }
}


function drawRoomWindow(){
 const w=game.roomWindow;
 if(!w||game.windowScene)return;
 const wx=w.x,wy=w.y;
 if(w.broken){
  /* v0.9.6: janela quebrada — vidro estilhaçado com glitch */
  ctx.strokeStyle='rgba(79,245,255,.6)';ctx.lineWidth=2.5;
  ctx.strokeRect(wx-24,wy,48,66);
  /* estilhaços de vidro */
  ctx.fillStyle='rgba(79,245,255,.15)';
  ctx.fillRect(wx-21,wy+3,42,60);
  ctx.strokeStyle='rgba(255,79,216,.5)';ctx.lineWidth=1;
  for(let k=0;k<6;k++){
   const ax=wx+rnd(-18,18),ay=wy+rnd(5,60);
   ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+rnd(-8,8),ay+rnd(-8,8));ctx.stroke();
  }
  /* brilho glitch */
  const g=Math.floor(game.t*8)%2;
  ctx.fillStyle=g?'rgba(79,245,255,.2)':'rgba(255,79,216,.2)';
  ctx.fillRect(wx-21,wy+3,42,60);
  /* prompt de atravessar */
  if(!player.dead&&dist(player.x,player.y,wx,w.iy)<70&&enemies.length===0){
   ctx.globalAlpha=.5+.4*Math.sin(game.t*4);
   txt(keyLabel(keybinds.interact[0])+' · ATRAVESSAR',wx,w.iy+38,MONO,9,'#4ff5ff','center',3);
   ctx.globalAlpha=1;
  }
  return;
 }
 ctx.strokeStyle='rgba(242,240,234,.75)';ctx.lineWidth=2.5;
 ctx.strokeRect(wx-24,wy,48,66);
 ctx.lineWidth=1.2;
 ctx.beginPath();ctx.moveTo(wx,wy);ctx.lineTo(wx,wy+66);ctx.moveTo(wx-24,wy+33);ctx.lineTo(wx+24,wy+33);ctx.stroke();
 ctx.fillStyle='rgba(2,2,3,.92)';ctx.fillRect(wx-21,wy+3,42,60);
 for(let k=0;k<2;k++){
  const ph=(game.t*.12+k*.5)%1;
  ctx.globalAlpha=.2*(1-ph);
  ctx.fillStyle='#8a8a92';
  ctx.beginPath();
  ctx.arc(wx-8+k*16,wy+60-ph*46,3+ph*5,0,TAU);
  ctx.fill();
 }
 ctx.globalAlpha=1;
 if(!player.dead&&dist(player.x,player.y,wx,w.iy)<70&&enemies.length===0){
  ctx.globalAlpha=.5+.4*Math.sin(game.t*4);
  txt(keyLabel(keybinds.interact[0])+' · olhar',wx,w.iy+38,MONO,9,'#9c8f7c','center',3);
  ctx.globalAlpha=1;
 }
}
function drawWindowScene(){
 const sc=game.windowScene;const pz=game.puzzle;const runeCount=pz&&Array.isArray(pz.need)?pz.need.length:3;
 if(!sc)return;
 const a=ramp(sc.t,0,.5)*(1-ramp(sc.t,sc.dur-.6,sc.dur));
 ctx.fillStyle='rgba(3,2,3,'+(.93*a)+')';ctx.fillRect(0,0,W,H);
 const wx=W/2,wy=H*.4,ww=300,wh=380;
 ctx.strokeStyle='rgba(242,240,234,'+(.9*a)+')';ctx.lineWidth=5;
 ctx.strokeRect(wx-ww/2,wy-wh/2,ww,wh);
 ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(wx,wy-wh/2);ctx.lineTo(wx,wy+wh/2);ctx.moveTo(wx-ww/2,wy);ctx.lineTo(wx+ww/2,wy);ctx.stroke();
 ctx.fillStyle='rgba(2,2,3,'+a+')';ctx.fillRect(wx-ww/2+5,wy-wh/2+5,ww-10,wh-10);
 ctx.save();
 ctx.beginPath();ctx.rect(wx-ww/2+5,wy-wh/2+5,ww-10,wh-10);ctx.clip();
 if(sc.tree){
  const ta=a*ramp(sc.t,2,3.4)*(1-ramp(sc.t,sc.dur-.7,sc.dur-.3));
  if(ta>0)drawTreeSil(wx+34,wy+wh/2-20,1.5,ta*.55);
 }
 for(let k=0;k<runeCount;k++){
  const fx=wx-ww/2+40+k*(ww-80)/2;
  for(let j=0;j<4;j++){
   const ph=(sc.t*.13+j*.25+k*.13)%1;
   const fy=wy+wh/2-14-ph*(wh*.66);
   ctx.globalAlpha=a*.22*(1-ph);
   ctx.fillStyle='#8a8a92';
   ctx.beginPath();ctx.arc(fx+Math.sin(ph*9+k)*8,fy,5+ph*11,0,TAU);ctx.fill();
  }
 }
 ctx.restore();
 ctx.globalAlpha=1;
 drawThorBack(wx,wy+wh/2+46,a);
 if(sc.t>.7){
  const ta=.85;
  ctx.globalAlpha=ta*a;
  txt('THOR OLHA',W/2,H*.84,MONO,10,'#6e6357','center',2);
  txt('mova-se para sair',W/2,H*.88,MONO,13,'#c9a44c','center',1);
  ctx.globalAlpha=1;
 }
 if(sc.t>1.7){
  const ta=ramp(sc.t,1.7,2.3);
  ctx.globalAlpha=ta*a;
  txt('“tão escuro que eu não veria nem minhas patas”',W/2,H*.9,MONO,15,'#9c8f7c','center',1);
  ctx.globalAlpha=1;
 }
}
function drawTreeSil(x,y,s,alpha){
ctx.save();
ctx.translate(x,y);
ctx.scale(s,s);
ctx.globalAlpha=alpha;
ctx.fillStyle='#060608';
ctx.strokeStyle='rgba(242,240,234,'+alpha+')';
ctx.lineWidth=1.8;
ctx.beginPath();
ctx.moveTo(-6,60);
ctx.lineTo(-3,-10);
ctx.lineTo(3,-10);
ctx.lineTo(6,60);
ctx.closePath();ctx.fill();ctx.stroke();
const br=[[-3,-8,-26,-34,-30,-20],[3,-8,26,-34,30,-20],[-3,-20,-22,-48,-14,-40],[3,-20,22,-48,14,-40],[0,-34,0,-62,-3,-52],[0,-34,0,-62,3,-52]];
ctx.lineWidth=1.4;
for(const b of br){
ctx.beginPath();
ctx.moveTo(b[0],b[1]);
ctx.quadraticCurveTo(b[2],b[3],b[4],b[5]);
ctx.stroke();
}
ctx.restore();
}

function drawThorBack(x,y,a){
ctx.save();
ctx.globalAlpha=a;
ctx.translate(x,y);
const br=Math.sin(game.t*1.5)*1.2;
ctx.fillStyle='#141014';
ctx.beginPath();ctx.ellipse(0,br*.4,34,26,0,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(0,-26+br,15,0,TAU);ctx.fill();
ctx.beginPath();ctx.moveTo(-12,-34+br);ctx.lineTo(-7,-46+br);ctx.lineTo(-2,-35+br);ctx.closePath();ctx.fill();
ctx.beginPath();ctx.moveTo(12,-34+br);ctx.lineTo(7,-46+br);ctx.lineTo(2,-35+br);ctx.closePath();ctx.fill();
ctx.strokeStyle='#141014';ctx.lineWidth=6;ctx.lineCap='round';
ctx.beginPath();ctx.moveTo(24,4);ctx.quadraticCurveTo(34,20,30,38);ctx.stroke();
ctx.restore();
}

/* ============ estruturas decorativas ============ */
/* ============ estruturas decorativas ============ */
function decorSolid(d){
 return d&&(d.t==='column'||d.t==='broken'||d.t==='statue'||d.t==='arch'||d.t==='rubble'||d.t==='doorframe');
}
function decorRadius(d){
 if(!decorSolid(d))return 0;
 const base={column:31,broken:32,statue:40,arch:50,rubble:32,doorframe:45}[d.t]||32;
 return base*(d.s||1);
}
function resolveDecorCollision(o,r){
 if(!game.decor||!game.decor.length)return;
 /* v1.5.1: PROGRESSO ACIMA DE DECORAÇÃO — nenhuma estrutura pode fechar uma
    porta, a escada para o fundo ou o portal. Perto deles o raio de colisão
    encolhe (e vira 0 se precisar), então o caminho SEMPRE existe. Era isso
    que travava a ida ao Cérbero: um arco/estátua nascia a 66px da porta e o
    raio dele (+ o do Thor) empurrava o jogador para longe do gatilho. */
 const _ds=game.doors,_st=game.floorStair||game.vulcStair,_po=game.portal;
 for(const d of game.decor){
  let dr=decorRadius(d);
  if(!dr)continue;
  if(_ds&&_ds.length){for(const dd of _ds){if(!dd.open)continue;const dq=dist(d.x,d.y,dd.x,dd.y)-44;if(dq<dr)dr=Math.max(0,dq);}}
  if(_st){const dq=dist(d.x,d.y,_st.x,_st.y)-52;if(dq<dr)dr=Math.max(0,dq);}
  if(_po){const dq=dist(d.x,d.y,_po.x,_po.y)-52;if(dq<dr)dr=Math.max(0,dq);}
  if(dr<=0)continue;
  const min=dr+r;
  let dx=o.x-d.x,dy=o.y-d.y,dd=Math.hypot(dx,dy);
  if(dd<min){
   if(dd<.001){dx=1;dy=0;dd=1;}
   o.x=d.x+dx/dd*min;
   o.y=d.y+dy/dd*min;
  }
 }
}
function drawDecor(){
 for(const d of game.decor){
  /* decorações do Falso Paraíso — estruturas religiosas */
  if(d.paradise){
   drawReligiousStructure(d);
   continue;
  }
  ctx.save();
  ctx.translate(d.x,d.y);
  ctx.scale(d.s,d.s);
  const LC='rgba(242,240,234,';
  if(d.t==='glyph'){
   const on=d.on;
   ctx.strokeStyle=on?'#bfd8e8':'rgba(191,216,232,.4)';
   ctx.globalAlpha=on?(.55+.2*Math.sin(game.t*2+d.f*7)):(.3+.12*Math.sin(game.t*1.2+d.f*7));
   ctx.lineWidth=1.6;
   ctx.beginPath();ctx.arc(0,0,15,0,TAU);ctx.stroke();
   ctx.globalAlpha=1;
   drawSymbol(d.sym,0,0,7,on?'#bfd8e8':'#8a7d6c',on?.9:.42);
   if(on){
    ctx.globalAlpha=.08+.05*Math.sin(game.t*2+d.f*7);
    ctx.fillStyle='#bfd8e8';
    ctx.beginPath();ctx.arc(0,0,25,0,TAU);ctx.fill();
    ctx.globalAlpha=1;
   }
  }else if(d.t==='column'){
   ctx.fillStyle='rgba(20,16,20,.9)';
   ctx.strokeStyle=LC+'.5)';ctx.lineWidth=2;
   ctx.fillRect(-14,-10,28,70);
   ctx.strokeRect(-14,-10,28,70);
   ctx.fillRect(-18,-14,36,7);ctx.strokeRect(-18,-14,36,7);
   ctx.fillRect(-18,62,36,8);ctx.strokeRect(-18,62,36,8);
   ctx.strokeStyle=LC+'.18)';
   for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(k*7,-6);ctx.lineTo(k*7,60);ctx.stroke();}
  }else if(d.t==='broken'){
   ctx.fillStyle='rgba(20,16,20,.9)';
   ctx.strokeStyle=LC+'.45)';ctx.lineWidth=2;
   ctx.beginPath();
   ctx.moveTo(-14,60);ctx.lineTo(-14,10);
   ctx.lineTo(-8,2);ctx.lineTo(-2,12);ctx.lineTo(4,4);ctx.lineTo(10,10);ctx.lineTo(14,6);
   ctx.lineTo(14,60);ctx.closePath();
   ctx.fill();ctx.stroke();
   ctx.fillRect(-18,54,36,8);ctx.strokeRect(-18,54,36,8);
  }else if(d.t==='statue'){
   ctx.fillStyle='rgba(20,16,20,.95)';
   ctx.strokeStyle=LC+'.5)';ctx.lineWidth=2;
   ctx.fillRect(-22,44,44,16);ctx.strokeRect(-22,44,44,16);
   ctx.fillRect(-14,20,28,26);ctx.strokeRect(-14,20,28,26);
   if(d.f<.45){
    ctx.beginPath();ctx.arc(2,52,9,0,TAU);ctx.fill();ctx.stroke();
    ctx.strokeStyle=LC+'.25)';
    ctx.beginPath();ctx.moveTo(-6,24);ctx.lineTo(-16,34);ctx.lineTo(-13,38);ctx.lineTo(-5,30);ctx.stroke();
   }else{
    ctx.beginPath();ctx.arc(0,10,9,0,TAU);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-6,24);ctx.lineTo(-16,34);ctx.lineTo(-13,38);ctx.lineTo(-5,30);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(6,24);ctx.lineTo(16,34);ctx.lineTo(13,38);ctx.lineTo(5,30);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=LC+'.3)';
    ctx.beginPath();ctx.moveTo(-4,10);ctx.lineTo(-1,10);ctx.moveTo(1,10);ctx.lineTo(4,10);ctx.stroke();
   }
  }else if(d.t==='bones'){
   ctx.strokeStyle=LC+'.4)';ctx.lineWidth=2.5;ctx.lineCap='round';
   for(let k=0;k<4;k++){
    ctx.beginPath();
    ctx.arc(-10+k*7,4+(k%2)*6,7,Math.PI*.15,Math.PI*.85);
    ctx.stroke();
   }
   ctx.strokeStyle=LC+'.55)';
   ctx.beginPath();ctx.arc(12,-6,8,0,TAU);ctx.stroke();
   ctx.fillStyle=LC+'.5)';
   ctx.beginPath();ctx.arc(9,-7,1.6,0,TAU);ctx.fill();
   ctx.beginPath();ctx.arc(15,-7,1.6,0,TAU);ctx.fill();
   ctx.beginPath();ctx.moveTo(8,-1);ctx.lineTo(16,-1);ctx.stroke();
  }else if(d.t==='candles'){
   for(let k=0;k<3+Math.floor(d.f*3);k++){
    const cx=(k-1)*12,ch=14+d.f*8;
    ctx.fillStyle='rgba(230,218,196,.75)';
    ctx.fillRect(cx-2.5,-ch,5,ch);
    const fl=.6+.4*Math.sin(game.t*9+k*2.3+d.f*7);
    ctx.fillStyle='rgba(255,217,160,'+(.7*fl)+')';
    ctx.beginPath();ctx.ellipse(cx,-ch-5,2.2,4.5*fl,0,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,243,196,'+(.8*fl)+')';
    ctx.beginPath();ctx.arc(cx,-ch-4.5,1.3,0,TAU);ctx.fill();
   }
  }else if(d.t==='arch'){
   ctx.strokeStyle=LC+'.4)';ctx.lineWidth=9;
   ctx.beginPath();
   ctx.moveTo(-34,60);
   ctx.lineTo(-34,-6);
   ctx.quadraticCurveTo(0,-46,34,-6);
   ctx.stroke();
   ctx.strokeStyle=LC+'.2)';ctx.lineWidth=2;
   ctx.beginPath();
   ctx.moveTo(-28,60);ctx.lineTo(-28,-8);
   ctx.quadraticCurveTo(0,-42,28,-8);
   ctx.stroke();
   if(d.f<.5){
    ctx.strokeStyle=LC+'.25)';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(-34,-2);ctx.lineTo(-34,10+Math.sin(game.t*1.4)*3);ctx.stroke();
   }
  }else if(d.t==='rubble'){
   ctx.fillStyle='rgba(26,20,26,.95)';
   ctx.strokeStyle=LC+'.25)';
   ctx.lineWidth=1.5;
   const st=[[-17,4,9,.4],[-5,10,6,1.2],[8,2,8,2.1],[17,9,5,.6],[-9,-3,5,1.8],[3,-6,4,.9]];
   for(const s2 of st){
    ctx.beginPath();
    ctx.ellipse(s2[0],s2[1],s2[2],s2[2]*.72,s2[3],0,TAU);
    ctx.fill();ctx.stroke();
   }
  }else if(d.t==='chains'){
   ctx.strokeStyle='rgba(154,143,124,.45)';ctx.lineWidth=2;
   const pts=[];
   for(let j=0;j<=8;j++){
    const t=j/8;
    pts.push([quad(-34,8,30,t),quad(-6,10+d.f*8,26,t)]);
   }
   for(let j=0;j<8;j++){
    ctx.beginPath();
    ctx.ellipse((pts[j][0]+pts[j+1][0])/2,(pts[j][1]+pts[j+1][1])/2,4,2.4,Math.atan2(pts[j+1][1]-pts[j][1],pts[j+1][0]-pts[j][0]),0,TAU);
    ctx.stroke();
   }
   ctx.strokeStyle=LC+'.35)';
   ctx.beginPath();ctx.ellipse(-38,10,7,3.5,0,0,TAU);ctx.stroke();
   ctx.beginPath();ctx.ellipse(34,26,6,3,0,0,TAU);ctx.stroke();
  }else if(d.t==='doorframe'){
   ctx.fillStyle='rgba(12,9,12,.9)';
   ctx.strokeStyle=LC+'.4)';ctx.lineWidth=2;
   ctx.fillRect(-26,-12,52,28);
   ctx.strokeRect(-26,-12,52,28);
   ctx.fillStyle='rgba(5,3,5,.95)';
   ctx.fillRect(-17,-8,34,22);
   ctx.strokeStyle=LC+'.2)';
   ctx.strokeRect(-17,-8,34,22);
   ctx.save();
   ctx.rotate(.45+d.f*.4);
   ctx.fillStyle='rgba(38,28,24,.9)';
   ctx.fillRect(-30,14,58,7);ctx.strokeRect(-30,14,58,7);
   ctx.fillStyle='rgba(32,23,20,.9)';
   ctx.fillRect(-22,24,44,6);ctx.strokeRect(-22,24,44,6);
   ctx.restore();
  }else if(d.t==='marks'){
   ctx.strokeStyle=LC+'.22)';ctx.lineWidth=2;ctx.lineCap='round';
   for(let k=0;k<4;k++){
    const a=d.f*6+k*.85;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*13,Math.sin(a)*7);
    ctx.lineTo(Math.cos(a)*13+Math.sin(a+1)*14,Math.sin(a)*7+Math.cos(a+1)*12);
    ctx.stroke();
   }
  }
  ctx.restore();
 }
}
/* ============ projéteis inimigos ============ */
function updateEBullets(dt){
const vmul=(game.hard?1.22:1)*(window.__RM_ebslow?window.__RM_ebslow():1)*(game._neoOn?1.3:1)*(game._kzRush?1.3:1); /* v1.4.0 · v1.5.1: NEO — tiros 30% mais rápidos · v1.6.4: A ENXURRADA — salas kaizo com balas 30% mais rápidas */
for(let i=ebullets.length-1;i>=0;i--){
const b=ebullets[i];
/* tiro mortal do Triunfo da Morte */
if(b.hitkill&&!b.fake&&!player.dead&&dist(b.x,b.y,player.x,player.y)<b.r+(player.hitR||player.r)){ /* v1.4.6 hitR */
killPlayerInstant('FOICE DO FIM');
}
if(b.mine){
/* armas do Triunfo da Guerra: contam como 1 hit para a condição */
if(b.triumphWeapon){
b.life-=dt;
if(b.life<=0){
if(game.knightHeartsCollected<game.knightHeartsNeeded)game.knightHeartsCollected++;
sparks(b.x,b.y,b.c,12,200,.5,3,true);
ebullets.splice(i,1);
}
continue;
}
b.armT-=dt;b.life-=dt;
if(b.life<=0){sparks(b.x,b.y,b.c,3,60,.3,2);ebullets.splice(i,1);continue;}
if(b.armT<=0&&!b.fake&&!player.dead&&dist(b.x,b.y,player.x,player.y)<b.r+34+(player.hitR||player.r)){ /* v1.4.6 hitR */
hurtPlayer();
sparks(b.x,b.y,b.c,10,220,.5,3,true);
blip('sawtooth',150,40,.25,.14);
ebullets.splice(i,1);
}
continue;
}
if(b.orbit){
b.orbT+=dt;b.ang+=b.orbSpd*dt;
const R=b.orbR0+70*(b.orbT/b.orbDur);
b.x=b.cx+Math.cos(b.ang)*R;b.y=b.cy+Math.sin(b.ang)*R;
if(b.orbT>=b.orbDur){
b.vx=Math.cos(b.ang)*b.speed;b.vy=Math.sin(b.ang)*b.speed;
b.orbit=false;
}else{
if(!b.fake&&!player.dead&&dist(b.x,b.y,player.x,player.y)<b.r+(player.hitR||player.r)-2){
hurtPlayer();sparks(b.x,b.y,b.c,5,160,.4,3,true);ebullets.splice(i,1);
}
continue;
}
}
if(b.bounce){
b.x+=b.vx*vmul*dt;b.y+=b.vy*vmul*dt;
if((b.x<ROOM.x+12&&b.vx<0)||(b.x>ROOM.x+ROOM.w-12&&b.vx>0)){b.vx*=-1;b.bounces--;blip('square',300,180,.05,.03);}
if((b.y<ROOM.y+12&&b.vy<0)||(b.y>ROOM.y+ROOM.h-12&&b.vy>0)){b.vy*=-1;b.bounces--;blip('square',300,180,.05,.03);}
if(b.bounces<=0)b.bounce=false;
if(!b.fake&&!player.dead&&dist(b.x,b.y,player.x,player.y)<b.r+(player.hitR||player.r)-2){
hurtPlayer();sparks(b.x,b.y,b.c,5,160,.4,3,true);ebullets.splice(i,1);continue;
}
if(b.bounce)continue;
}
if(b.home&&b.homeT>0){
b.homeT-=dt;
const want=Math.atan2(player.y-b.y,player.x-b.x);
const cur=Math.atan2(b.vy,b.vx);
const na=lerpAngle(cur,want,Math.min(1,b.home*dt));
const sp=Math.hypot(b.vx,b.vy);
b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp;
}
/* v1.7.0: EDITOR DE MODS — speedMul da bala (aplica 1× por bala) */
if(!b._mk&&window.__MODS&&__MODS.on()){b._mk=1;const _sm=__MODS.speedFor(b.c);if(_sm&&_sm!==1){b.vx*=_sm;b.vy*=_sm;}}
/* v1.7.2: EDITOR DE MODS — BUFF/NERF por padrão (aplica 1× por bala): a bala
   nasce marcada com _tp (o padrão que a soltou, via tagBullets) e recebe UMA
   vez o multiplicador de velocidade do tuning do mod ativo */
if(!b._tk&&b._tp&&window.__MODS&&__MODS.on()){b._tk=1;const _tn=__MODS.tuneFor(b._tt,b._tp);if(_tn&&_tn.sp&&_tn.sp!==1){b.vx*=_tn.sp;b.vy*=_tn.sp;}}
b.x+=b.vx*vmul*dt;b.y+=b.vy*vmul*dt;
/* v1.4.3: as balas da SENTENÇA (b.rm) NÃO são cortadas pelos limites da sala —
   quando o Cérbero novo alcança a parte escura fora do mapa, os pescoços
   continuam nas bordas e os tiros morriam ao nascer (ele "ficava sem atirar").
   Essas balas já expiram sozinhas pelo life próprio. */
if(!b.rm&&(b.x<ROOM.x-44||b.x>ROOM.x+ROOM.w+44||b.y<ROOM.y-44||b.y>ROOM.y+ROOM.h+44)){ebullets.splice(i,1);continue;}
if(!b.fake&&!player.dead&&dist(b.x,b.y,player.x,player.y)<b.r+(player.hitR||player.r)-2){
const _pi=player.inv; /* v1.6.4: a cura do morcego só vale se o golpe acertou de verdade */
hurtPlayer();
if(b.c==='#9fd8ff'||b.slowShot)player.slowT=Math.max(player.slowT,.8);
if(window.__GRI)window.__GRI.bulletHit(b); /* v1.9.0: balas inimigas aplicam efeitos ao Thor (queimadura/veneno) + selo da vigília */
sparks(b.x,b.y,b.c,5,160,.4,3,true);
/* v1.6.4: ENXAME VAMPIRO — morcego acertou o Thor? O Carrasco se CURA */
if(b.heal&&b.owner&&!b.owner.dead&&_pi<=0&&player.inv>_pi){
b.owner.hp=Math.min(b.owner.maxHp,b.owner.hp+b.heal);
texts.push({x:b.owner.x,y:b.owner.y-b.owner.r-14,txt:'+'+b.heal,t:0,life:.9,c:'#7fe08a',size:11,disp:true});
sparks(b.owner.x,b.owner.y,'#7fe08a',10,180,.55,3,true);
}
ebullets.splice(i,1);
}
}
}
function updateRings(dt){
for(let i=rings.length-1;i>=0;i--){
const r=rings[i];
r.r+=r.vr*(game.hard?1.15:1)*dt;
if(!r.fake&&!player.dead){
const d=dist(player.x,player.y,r.x,r.y);
if(Math.abs(d-r.r)<r.th/2+player.r){
const a=Math.atan2(player.y-r.y,player.x-r.x);
if(Math.abs(angDiff(a,r.gapA))>r.gapW/2){
hurtPlayer();
if(r.slow)player.slowT=Math.max(player.slowT,1.0);
}
}
}
if(r.r>Math.max(ROOM.w,ROOM.h)+200)rings.splice(i,1);
}
}
function updateGeyserMarks(dt){
for(let i=geyserMarks.length-1;i>=0;i--){
const m=geyserMarks[i];
m.t+=dt*(game.hard?1.25:1);
if(m.phase==='mark'&&m.t>=m.dur){
m.phase='burst';m.t=0;sfx.explode();
game.shake=Math.max(game.shake,6);
const R=m.rad||42;
for(let k=0;k<12;k++)particles.push({x:m.x+rnd(-20,20),y:m.y+rnd(-8,8),vx:rnd(-40,40),vy:rnd(-360,-140),life:rnd(.4,.8),t:0,r:rnd(2,4.5),c:m.c,drag:1.2,glow:true});
if(m.dmg){
for(const e of enemies){
if(e.dead)continue;
if(dist(m.x,m.y,e.x,e.y)<R+e.r){
if(!shadowInvuln(e)){e.hp-=m.dmg;e.flash=.15;}
if(e.hp<=0)killEnemy(e);
}
}
if(boss.active&&!boss.dying&&boss.scale>.98){
for(const h of boss.heads){
if(!h.alive)continue;
if(dist(m.x,m.y,h.hx,h.hy)<R+h.r){
h.hp-=m.dmg;h.flash=.15;
dmgText(h.hx+rnd(-10,10),h.hy-18,m.dmg);
if(h.hp<=0)killHead(h);
}
}
}
sparks(m.x,m.y,m.c,12,240,.5,3,true);
}
if(!m.friendly&&!m.fake&&!player.dead&&dist(player.x,player.y,m.x,m.y)<42+(player.hitR||player.r))hurtPlayer(); /* v1.4.6 hitR */
}else if(m.phase==='burst'&&m.t>.28)geyserMarks.splice(i,1);
}
}
function updateSpawnMarks(dt){
for(let i=spawnMarks.length-1;i>=0;i--){
const s=spawnMarks[i];
s.t+=dt*(game.hard?1.25:1);
if(s.t>=s.dur){
/* marcas falsas (sombras) só geram o efeito visual, sem inimigo real */
if(!s.fake)spawnEnemy(s.type,s.x,s.y,s.kaizo,s._hpMul);
sparks(s.x,s.y,'#5a2430',8,170,.5,3.5);
sparks(s.x,s.y,'#ff8f3d',5,200,.4,2.5,true);
blip('sawtooth',70,40,0.18,0.06);
spawnMarks.splice(i,1);
}
}
}
/* ============ almas, corações, baú & alma do rei ============ */
function gainSouls(n){
if(game.roomEvent&&game.roomEvent.type==='void')n*=2;
/* v0.9.9: FRAGMENTO DO ERRO agora é relíquia escolhida (+25%) */
if(game.relicShard)n*=1.25;
n*=(P.soulMult||1);
game.soulAcc+=n;
const whole=Math.floor(game.soulAcc);
if(whole>0){
game.souls+=whole;game.soulAcc-=whole;
/* v0.9.16: recorde de almas numa descida (conquista MIL ALMAS) */
if(game.souls>(META.bestSouls||0)){META.bestSouls=game.souls;saveMeta();}
}
}
function updatePickups(dt){
const magnet=130*P.magnetMult;
for(let i=pickups.length-1;i>=0;i--){
const p=pickups[i];p.t+=dt;if(p.noPickT>0)p.noPickT-=dt; /* v1.3.1: janela sem coleta */
/* FIX v0.9.9: bênções/itens no chão NÃO expiram mais (era 11s — o pedestal
   da sala de tesouro sumia antes de poder pegar). v1.6.0: ALMAS E VIDA
   TAMBÉM NÃO expiram mais — nada no chão desaparece pelo tempo. */
if(p.t>11&&p.type!=='chest'&&p.type!=='kingsoul'&&p.type!=='knightrelic'&&p.type!=='blessing_drop'&&p.type!=='active_drop'&&p.type!=='fagulha'&&p.type!=='soul'&&p.type!=='heart'){pickups.splice(i,1);continue;}
/* v1.6.3: NADA EM CIMA DA PAREDE — bênção, pacto, coração, almas, fagulha...
   se o drop nascer ou acabar DENTRO da parede, ele desliza sozinho de volta
   para o chão jogável; se estiver totalmente FORA do mapa, retorna ao MEIO
   da sala. Roda todo quadro: nenhum item fica perdido onde a mão não alcança. */
if(!inRoomXY(p.x,p.y,24)){
let nd=1e18;
for(const rc of game.absRects){
const cx=clamp(p.x,rc.x,rc.x+rc.w),cy=clamp(p.y,rc.y,rc.y+rc.h);
nd=Math.min(nd,(p.x-cx)*(p.x-cx)+(p.y-cy)*(p.y-cy));
}
if(nd>3600){const mm=game.absMain;if(mm){p.x=mm.x+mm.w/2;p.y=mm.y+mm.h/2;}}
else{const np=roomPt(p.x,p.y,24);p.x=np.x;p.y=np.y;}
}
if(p.type==='soul'&&!player.dead){
const dx=player.x-p.x,dy=player.y-p.y,d=Math.hypot(dx,dy);
if(d<magnet&&d>1){const sp=60+(magnet-d)*8;p.x+=dx/d*sp*dt;p.y+=dy/d*sp*dt;}
if(d<22){
gainSouls(1);META.souls++;sfx.soul();
sparks(p.x,p.y,'#bfd8e8',3,90,.3,2,true);
pickups.splice(i,1);continue;
}
}else if(p.type==='heart'&&!player.dead){
if(dist(p.x,p.y,player.x,player.y)<26){
if(player.hp<player.maxHp){
player.hp=Math.min(player.maxHp,player.hp+25);sfx.heart();
texts.push({x:player.x,y:player.y-30,txt:'+25 HP',t:0,life:1,c:'#d9465a',size:16,disp:true});
}else{
gainSouls(3);sfx.soul();
texts.push({x:player.x,y:player.y-30,txt:'+3 ALMAS',t:0,life:1,c:'#bfd8e8',size:14});
}
pickups.splice(i,1);continue;
}
}else if(p.type==='fagulha'&&!player.dead){
/* v1.0.0: FAGULHA EXPLOSIVA — consumível que detona paredes escondidas
   e dá faíscas explosivas aos seus tiros enquanto durar */
if(dist(p.x,p.y,player.x,player.y)<28){
pickups.splice(i,1);
game.fagulha=(game.fagulha||0)+1;
sfx.levelup();blip('sine',900,1400,.14,.1);
texts.push({x:player.x,y:player.y-30,txt:'FAGULHA ×'+game.fagulha+' · [Q]',t:0,life:1.3,c:'#ff8f3d',size:12,disp:true});
sparks(p.x,p.y,'#ff8f3d',12,180,.6,3,true);
continue;
}
}else if(p.type==='chest'&&!player.dead){
if(dist(p.x,p.y,player.x,player.y)<34){
pickups.splice(i,1);
const rr=game.mapRooms[game.roomIdx];
if(rr)rr.chestTaken=true;
sparks(p.x,p.y,'#ffd9a0',18,240,.7,3,true);
sparks(p.x,p.y,'#c9a44c',10,180,.6,3,true);
game.flash=Math.max(game.flash,.2);
/* v0.9.6: todo baú dropa uma bênção/item — sem mais o openTreasure.
   v0.9.9: baús de tesouro/desafio usam a curva de raridade 'peito' */
/* v1.2.0: baús entregam APENAS o sustento — almas, coração ou fagulha */
dropChestLoot(p.x,p.y);
if(window.__RM)window.__RM.onChest(p); /* v1.4.0: PORTA FECHADA */
continue;
}
}else if(p.type==='kingsoul'&&!player.dead){
if(dist(p.x,p.y,player.x,player.y)<36){
pickups.splice(i,1);
player.maxHp+=25;player.hp=player.maxHp;
P.dmgMult*=1.25;
game.kingsoul=true;game.kingT=3;
META.kingsoul=true;saveMeta();conqTick();/* v0.9.13: conquista XAQUE-MATE */
game.flash=.6;game.shake=14;
sfx.levelup();sfx.howl();
sparks(p.x,p.y,'#ffd9a0',26,300,.9,4,true);
sparks(p.x,p.y,'#d8cfc0',14,220,.7,3,true);
game.banner={type:'circle',txt:'ITEM ÚNICO',name:'ALMA DO REI ANTIGO',sub:'+1 coração · +25% de dano · o rei joga por você',t:0,dur:3.4};
continue;
}
}else if(p.type==='knightrelic'&&!player.dead){
if(dist(p.x,p.y,player.x,player.y)<40){
pickups.splice(i,1);
const def=KNIGHT_DROPS.find(d=>d.id===p.relicId);
if(def){
META.done[def.id]=1;saveMeta();
if(def.apply)def.apply();
game.flash=.7;game.shake=18;sfx.levelup();sfx.roar();
sparks(player.x,player.y,p.relicColor||'#ffd9a0',30,300,.9,4,true);
sparks(player.x,player.y,p.relicGlow||'#d9465a',18,260,.7,3.5,true);
game.banner={type:'circle',txt:'RELÍQUIA DO CAVALEIRO',name:def.name,sub:def.desc,t:0,dur:4};
}else{
/* fallback — coração cheio + almas */
player.hp=player.maxHp;gainSouls(50);
}
continue;
}
}else if(p.type==='blessing_drop'&&!player.dead){
/* FIX v0.9.9: este ramo estava encadeado ao if interno da relíquia (código morto)
   — bênçãos no chão nunca eram coletadas. Agora coleta de verdade. */
  if(dist(p.x,p.y,player.x,player.y)<32){
    pickups.splice(i,1);
    sparks(p.x,p.y,'#ffd9a0',18,240,.7,3,true);
    game.flash=Math.max(game.flash,.2);
    game._blessGateHint=false;
    checkFullSweep(); /* v1.6.3: pegou a bênção → o portal pode nascer agora */
    if(p.dropType==='upgrade'){
      const u=UPGRADES.find(x=>x.id===p.dropId);
      if(u&&u.can()){
        u.apply();
        game.up[u.id]=(game.up[u.id]||0)+1;
        if(!META.acq)META.acq={};if(!META.acq[u.id]){META.acq[u.id]=1;saveMeta();}
        onBlessingAcquired(u.id);/* v0.9.16: sinergias + especializações */
        sfx.levelup();
        texts.push({x:player.x,y:player.y-40,txt:'PACTO: '+u.name,t:0,life:1.6,c:'#ffd9a0',size:12,disp:true});
      }else{
        /* já no máximo — converte em almas para nunca desperdiçar */
        gainSouls(25);sfx.soul();
        texts.push({x:player.x,y:player.y-40,txt:'BÊNÇÃO RECUSADA +25 ALMAS',t:0,life:1.4,c:'#bfd8e8',size:11,disp:true});
      }
    }else if(p.dropType==='active'){
      pickupActiveItem(p.dropId);
    }
    continue;
  }
}else if(p.type==='active_drop'&&!player.dead){
/* FIX v0.9.9: idem — itens ativos no chão agora são coletáveis
   v1.3.1: respeita a janela de 2s do item que ACABOU de ser dropado */
  if(dist(p.x,p.y,player.x,player.y)<32&&!(p.noPickT>0)){
    pickups.splice(i,1);
    pickupActiveItem(p.activeId);
    continue;
  }
}
}
}
/* ============ bênçãos ============ */
const QUAL_C=['#6e6357','#8a7d6c','#7fa8b8','#c9a44c','#d9465a','#ffd9a0'];
const QUAL_W=[100,55,24,9,3,1];
/* ==== v1.1.3: A FACE DO PACTO — arte (sprite) das bênçãos/pactos e itens ====
   COLOQUE UM ARQUIVO EM  assets/sprites/drops/  com o ID do item:
     forca.png, iraodin.png, mjolnir.png, latido.png, motoserra.png …
   OU com o NOME do item (sem acentos; espaço vira "-"):
     forca-do-pacto.png, ira-do-soberano.png, latido-infernal.png …
   Formatos: .png .jpg .jpeg .webp (maiúsculas/minúsculas tanto faz).
   Aparece NA CARTA da bênção, NO DROP do baú, NA FEIRA do Errante,
   no drop de item ativo e nas miniaturas do grimório/arca (tecla 3).
   SEM ARQUIVO, o jogo usa o glifo/nome de sempre — nada quebra.
   Trocou o arquivo com o jogo rodando? Itens visíveis re-leem a pasta
   a cada ~6s; __DROPS_RESCAN() força, __DROPS_DEBUG() diagnostica. ==== */
const DROP_IMG={},DROP_Q={},DROP_WAIT={},DROP_LAST={},DROP_BUST={},DROP_CANDS={},DROP_DONE={},DROP_SEEN={};
const DROP_EXTS=['png','jpg','jpeg','webp'];
function dropNorm(s){
  return String(s).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[_\s]+/g,'-').replace(/-+/g,'-')
    .replace(/[^a-z0-9\-]/g,'');
}
function dropCands(id){
  if(DROP_CANDS[id])return DROP_CANDS[id];
  const out=[String(id)];
  let def=null;
  try{def=UPGRADES.find(function(u){return u.id===id;})||(typeof ACTIVE_ITEMS!=='undefined'?ACTIVE_ITEMS[id]:null);}catch(e){def=null;}
  if(def&&def.name){const n=dropNorm(def.name);if(n&&out.indexOf(n)<0)out.push(n);}
  DROP_CANDS[id]=out;
  return out;
}
function flushDropWait(id){
  const ws=DROP_WAIT[id];if(!ws||!ws.length)return;
  DROP_WAIT[id]=[];
  ws.forEach(function(f){try{f(DROP_IMG[id]);}catch(e){}});
}
function dropNext(id){
  const q=DROP_Q[id];if(!q)return;
  if(DROP_LAST[id]&&Date.now()-DROP_LAST[id]<60)return;
  DROP_LAST[id]=Date.now();
  (function next(){
    if(!q.length){DROP_Q[id]=null;DROP_DONE[id]=true;return;}
    const raw=q.shift();
    const im=new Image();
    im.onload=function(){DROP_IMG[id]=im;flushDropWait(id);};
    im.onerror=next;
    im.src='assets/sprites/drops/'+raw+(DROP_BUST[id]?'?r='+DROP_BUST[id]:'');
  })();
}
function dropProbe(id){
  if(DROP_DONE[id])return;
  if(!DROP_Q[id]){
    DROP_Q[id]=[];
    dropCands(id).forEach(function(c){
      DROP_EXTS.forEach(function(x){DROP_Q[id].push(c+'.'+x);});
    });
  }
  dropNext(id);
}
function dropImg(id,cb){
  if(!id)return null;
  DROP_SEEN[id]=Date.now();
  if(DROP_IMG[id]){if(cb)try{cb(DROP_IMG[id]);}catch(e){}return DROP_IMG[id];}
  if(cb){
    if(!DROP_WAIT[id])DROP_WAIT[id]=[];
    if(DROP_WAIT[id].indexOf(cb)<0)DROP_WAIT[id].push(cb);
  }
  dropProbe(id);
  return DROP_IMG[id]||null;
}
/* re-leitura periódica — pega arquivo adicionado/trocado com o jogo rodando */
setInterval(function(){
  if(document.hidden)return;
  const now=Date.now();
  Object.keys(DROP_WAIT).forEach(function(id){
    if(DROP_IMG[id]){flushDropWait(id);return;}
    if(!DROP_WAIT[id].length)return;
    if(now-(DROP_SEEN[id]||0)>4000)return; /* item não está mais na tela */
    DROP_BUST[id]=now;DROP_Q[id]=null;DROP_DONE[id]=false;dropProbe(id);
  });
  Object.keys(DROP_SEEN).forEach(function(id){
    if(DROP_IMG[id])return;
    if(DROP_WAIT[id]&&DROP_WAIT[id].length)return;
    if(now-DROP_SEEN[id]>4000)return; /* só o que está visível AGORA */
    DROP_BUST[id]=now;DROP_Q[id]=null;DROP_DONE[id]=false;dropProbe(id);
  });
},6000);
function dropsDbg(){
  const found=[],missing=[],waiting=[];
  Object.keys(DROP_IMG).forEach(function(k){(DROP_IMG[k]?found:missing).push(k);});
  Object.keys(DROP_WAIT).forEach(function(k){if(DROP_WAIT[k]&&DROP_WAIT[k].length)waiting.push(k);});
  return{encontrados:found,ausentes:missing,aguardando:waiting,
    pasta:'assets/sprites/drops/',
    dica:'PNG/JPG/WEBP com o ID (forca.png) ou o nome (forca-do-pacto.png). __DROPS_RESCAN() força releitura.'};
}
window.__DROPS_DEBUG=dropsDbg;
window.__DROPS_RESCAN=function(){
  Object.keys(DROP_CANDS).forEach(function(id){
    if(DROP_IMG[id])return;
    DROP_BUST[id]=Date.now();DROP_Q[id]=null;DROP_DONE[id]=false;dropProbe(id);
  });
  return dropsDbg();
};
/* v1.1.3: aplica a arte numa carta/linha DOM — troca o glifo pelo sprite
   (carta: .glyphSlot vira <img>; miniatura: o próprio .bkArt recebe <img>) */
function applyDropArt(el,id,cls){
  if(!el||!id)return;
  dropImg(id,function(im){
    if(!el.isConnected)return;
    const slot=el.querySelector('.glyphSlot')||el;
    const img=document.createElement('img');
    img.className=(cls===undefined?'blessArt':cls);
    img.src=im.src;img.alt='';
    slot.innerHTML='';
    slot.appendChild(img);
    slot.classList.add('hasArt');
  });
}
/* liga todas as miniaturas .bkArt[data-dropid] de um painel já renderizado */
function bindDropArts(root){
  if(!root||!root.querySelectorAll)return;
  const sp=root.querySelectorAll('.bkArt[data-dropid]');
  for(let i=0;i<sp.length;i++)applyDropArt(sp[i],sp[i].getAttribute('data-dropid'),'');
}
const GLYPHS={
hammer:'<svg viewBox="0 0 24 24" fill="#e6dac4"><path d="M7 3 h10 v6 h-3.5 v12 h-3 V9 H7 Z"/></svg>',
bolt:'<svg viewBox="0 0 24 24" fill="#e6dac4"><path d="M13 2 L6 13 h5 l-2 9 L18 9 h-6 Z"/></svg>',
shard:'<svg viewBox="0 0 24 24" fill="#9fd8ff"><path d="M12 2 L18 10 L12 22 L6 10 Z"/></svg>',
flame:'<svg viewBox="0 0 24 24" fill="#ff8f3d"><path d="M12 2 C14 7 18 8 18 13 A6 6 0 0 1 6 13 C6 10 9 8 9 5 C10 7 11 8 12 2 Z"/></svg>',
venom:'<svg viewBox="0 0 24 24" fill="#a8c24f"><path d="M12 2 C17 8 19 12 19 15 A7 7 0 0 1 5 15 C5 12 7 8 12 2 Z"/></svg>',
shot:'<svg viewBox="0 0 24 24" fill="#e6dac4"><path d="M2 12 L15 5 L11.5 12 L15 19 Z M17 5 L22 12 L17 19 L19 12 Z"/></svg>',
fangs:'<svg viewBox="0 0 24 24" fill="none" stroke="#e6dac4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8 l3 4 3-4 3 4 3-4 3 4 3-4 M3 16 l3-4 3 4 3-4 3 4 3-4 3 4 3-4"/></svg>',
twin:'<svg viewBox="0 0 24 24" fill="#e6dac4"><path d="M2 6 h7 v4 h-2 v10 h-3 V10 H2 Z M15 6 h7 v4 h-2 v10 h-3 V10 h-2 Z"/></svg>',
reach:'<svg viewBox="0 0 24 24" fill="none" stroke="#e6dac4" stroke-width="2" stroke-linecap="round"><path d="M3 12 H18 M13 6 l6 6 -6 6"/></svg>',
sky:'<svg viewBox="0 0 24 24" fill="#e6dac4"><path d="M8 2 L4 9 h3 l-1.5 5 L11 6 H7.5 Z M17 8 L13 15 h3 l-1.5 6 L20 12 h-3.5 Z"/></svg>',
wind:'<svg viewBox="0 0 24 24" fill="none" stroke="#e6dac4" stroke-width="2" stroke-linecap="round"><path d="M3 8 h11 a3 3 0 1 0 -3 -4 M3 13 h15 a3 3 0 1 1 -3 4 M3 18 h8"/></svg>',
blood:'<svg viewBox="0 0 24 24" fill="none" stroke="#d9465a" stroke-width="2" stroke-linecap="round"><path d="M12 3 C12 3 5 12 5 16 A7 7 0 0 0 19 16 C19 12 12 3 12 3 Z"/></svg>',
maw:'<svg viewBox="0 0 24 24" fill="none" stroke="#e6dac4" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M5 8 l2 3 -2 3 M19 8 l-2 3 2 3 M9 5 l3 2 3 -2 M9 19 l3 -2 3 2"/></svg>',
soulg:'<svg viewBox="0 0 24 24" fill="#bfd8e8"><path d="M12 2 C16 6 18 9 18 13 A6 6 0 0 1 6 13 C6 9 8 6 12 2 Z"/></svg>',
eye:'<svg viewBox="0 0 24 24" fill="none" stroke="#e6dac4" stroke-width="2"><path d="M2 12 C5 6 9 4 12 4 C15 4 19 6 22 12 C19 18 15 20 12 20 C9 20 5 18 2 12 Z"/><circle cx="12" cy="12" r="3" fill="#e6dac4"/></svg>',
crown:'<svg viewBox="0 0 24 24" fill="#ffd9a0"><path d="M3 18 L3 8 L7 12 L12 4 L17 12 L21 8 L21 18 Z"/></svg>',
valhalla:'<svg viewBox="0 0 24 24" fill="#e6dac4"><path d="M12 21 C5 15 2 11 2 7.5 C2 4.5 4.5 3 7 3 C9 3 11 4.5 12 6.5 C13 4.5 15 3 17 3 C19.5 3 22 4.5 22 7.5 C22 11 19 15 12 21 Z"/></svg>',
saw:'<svg viewBox="0 0 24 24" fill="#e6dac4"><path d="M2 9 h12 v6 h-12 z"/><path d="M14 8 l3 2 -3 2 3 2 -3 2 3 2 -3 2 z"/><rect x="4" y="12" width="5" height="9"/></svg>',
sword:'<svg viewBox="0 0 24 24" fill="#e6dac4"><path d="M12 1 L14 14 L12 11 L10 14 Z"/><path d="M7 15 h10 v2 h-10 z"/><path d="M11 17 h2 v5 h-2 z"/></svg>',
nova:'<svg viewBox="0 0 24 24" fill="none" stroke="#9fd8ff" stroke-width="2"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8" opacity=".6"/><circle cx="12" cy="12" r="11" opacity=".3"/></svg>',
stake:'<svg viewBox="0 0 24 24" fill="#9fd8ff"><path d="M12 1 L15 12 L12 23 L9 12 Z"/></svg>',
shield:'<svg viewBox="0 0 24 24" fill="#e6dac4"><path d="M12 2 L21 5 V11 C21 17 17 21 12 22 C7 21 3 17 3 11 V5 Z"/></svg>',
burst:'<svg viewBox="0 0 24 24" fill="#ff8f3d"><path d="M12 3 L13.8 8.4 L19 6.5 L16 11.4 L21.5 13 L16 14.6 L18 20 L13.5 17 L12 22 L10.5 17 L6 20 L8 14.6 L2.5 13 L8 11.4 L5 6.5 L10.2 8.4 Z"/></svg>',
wave:'<svg viewBox="0 0 24 24" fill="none" stroke="#ffd9a0" stroke-width="2" stroke-linecap="round"><path d="M2 12 q3 -6 6 0 t6 0 t6 0"/><path d="M2 17 q3 -4 6 0 t6 0 t6 0" opacity=".5"/></svg>',
dark:'<svg viewBox="0 0 24 24" fill="#241731" stroke="#9d6bb5" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><circle cx="9.5" cy="10.5" r="1.5" fill="#e6f0f2" stroke="none"/><circle cx="14.5" cy="10.5" r="1.5" fill="#e6f0f2" stroke="none"/></svg>',
light:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff3c4" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4" fill="#fff3c4"/><path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M19.1 4.9L17 7 M7 17l-2.1 2.1"/></svg>'};
const UPGRADES=[
{id:'vento',q:1,glyph:'wind',name:'PASSO DO VENTO',max:3,desc:'thor se move 15% mais rápido.',can:function(){return(game.up.vento||0)<3;},apply:function(){P.speedMult*=1.15;}},
{id:'ima',q:1,glyph:'soulg',name:'ÍMÃ DE ALMAS',max:2,desc:'almas são atraídas de muito mais longe.',can:function(){return(game.up.ima||0)<2;},apply:function(){P.magnetMult+=.9;}},
{id:'forca',q:1,glyph:'bolt',name:'FORÇA DO PACTO',max:99,desc:'todos os ataques batem com 15% mais força.',can:function(){return true;},apply:function(){P.dmgMult*=1.15;}},
{id:'sanguepesado',q:1,glyph:'blood',name:'SANGUE PESADO',max:3,desc:'+25% de dano — thor anda 8% mais lento.',can:function(){return(game.up.sanguepesado||0)<3;},apply:function(){P.dmgMult*=1.25;P.speedMult*=.92;}},
{id:'polvora',q:2,glyph:'shot',name:'PÓLVORA LEVE',max:2,desc:'tudo ataca 30% mais rápido — o dano cai 12%.',can:function(){return(game.up.polvora||0)<2;},apply:function(){P.rateMult*=1.3;P.dmgMult*=.88;}},
{id:'pactovao',q:2,glyph:'soulg',name:'PACTO DO VÃO',max:2,desc:'almas valem 40% mais — o dano cai 10%.',can:function(){return(game.up.pactovao||0)<2;},apply:function(){P.soulMult*=1.4;P.dmgMult*=.9;}},
{id:'furia',q:2,glyph:'sky',name:'FÚRIA DO TROVÃO',max:5,desc:'tudo ataca 18% mais rápido — thor fica 5% mais lento.',can:function(){return(game.up.furia||0)<5;},apply:function(){P.rateMult*=1.18;P.speedMult*=.95;}},
{id:'sanguefrio',q:3,glyph:'shard',name:'SANGUE FRIO',max:1,desc:'+30% de dano — thor perde 1 coração máximo (25 HP).',can:function(){return!game.up.sanguefrio;},apply:function(){P.dmgMult*=1.3;player.maxHp=Math.max(50,player.maxHp-25);if(player.hp>player.maxHp)player.hp=player.maxHp;game.up.sanguefrio=1;}},
{id:'ferroada',q:3,glyph:'venom',name:'FERROADA DUPLA',max:1,desc:'+50% velocidade de ataque — -25% de dano.',can:function(){return!game.up.ferroada;},apply:function(){P.rateMult*=1.5;P.dmgMult*=.75;game.up.ferroada=1;}},
{id:'mercurio',q:2,glyph:'wind',name:'PÉS DE MERCÚRIO',max:2,desc:'o desvio recarrega 25% mais rápido.',can:function(){return(game.up.mercurio||0)<2;},apply:function(){P.dashCdMult*=.75;}},
{id:'alcance',q:2,glyph:'reach',name:'BRAÇO DO TITÃ',max:3,desc:'golpes alcançam mais longe.',can:function(){return(game.up.alcance||0)<3;},apply:function(){P.reachMult*=1.3;}},
{id:'gemeas',q:2,glyph:'twin',name:'LÂMINAS GÊMEAS',max:3,desc:'cada disparo solta um projétil extra.',can:function(){return game.hasShot&&(game.up.gemeas||0)<3;},apply:function(){game.multi++;}},
{id:'sangue',q:2,glyph:'blood',name:'SANGUE FERVENTE',max:3,desc:'a mordida morde 25% mais fundo.',can:function(){return game.hasBite&&(game.up.sangue||0)<3;},apply:function(){P.biteMult*=1.25;}},
{id:'mandibula',q:2,glyph:'maw',name:'MANDÍBULA DO ABISMO',max:2,desc:'mais alcance e bote mais largo na mordida.',can:function(){return game.hasBite&&(game.up.mandibula||0)<2;},apply:function(){P.biteRange*=1.25;}},
{id:'gelo',q:3,glyph:'shard',name:'GELO DO PRIMEIRO FRIO',max:3,desc:'tiros de gelo congelam. 3 níveis: maestria (+40% em congelados).',can:function(){return game.hasShot&&game.elements.gelo<3;},apply:function(){elemLevelUp('gelo','DE GELO',function(){game.ymir=true;});}},
{id:'fogo',q:3,glyph:'flame',name:'FOGO DA PRIMEIRA CHAMA',max:3,desc:'tiros flamejantes incendeiam. 3 níveis: o fogo salta.',can:function(){return game.hasShot&&game.elements.fogo<3;},apply:function(){elemLevelUp('fogo','DE FOGO',function(){game.incendio=true;});}},
{id:'veneno',q:3,glyph:'venom',name:'PEÇONHA DA SERPENTE',max:3,desc:'tiros envenenados corroem. 3 níveis: a toxina se espalha.',can:function(){return game.hasShot&&game.elements.veneno<3;},apply:function(){elemLevelUp('veneno','DO VENENO',function(){game.miasma=true;});}},
{id:'raio',q:3,glyph:'sky',name:'IRA DA TEMPESTADE',max:3,desc:'relâmpagos caem sozinhos sobre os demônios.',can:function(){return(game.up.raio||0)<3;},apply:function(){P.lightning++;}},
{id:'fome',q:3,glyph:'fangs',name:'FOME DA FERA',max:1,desc:'a cada 10 demônios devorados, um coração retorna.',can:function(){return game.hasBite&&!game.fome;},apply:function(){game.fome=true;game.fomeK=0;}},
{id:'unlockShot',q:3,glyph:'shot',name:'TROVÃO À DISTÂNCIA',max:1,desc:'também dispara projéteis automáticos.',can:function(){return!game.hasShot;},apply:function(){game.hasShot=true;player.shotT=.3;}},
{id:'unlockBite',q:3,glyph:'fangs',name:'MORDIDA DA FERA',max:1,desc:'a fera desperta: mandíbulas despedaçam de perto.',can:function(){return!game.hasBite;},apply:function(){game.hasBite=true;player.biteT=.3;}},
{id:'nova',q:3,glyph:'nova',name:'NOVA GÉLIDA',max:4,desc:'explosões gélidas irrompem de thor.',can:function(){return(game.up.nova||0)<4;},apply:function(){P.nova++;game.novaT=1.5;}},
{id:'presafogo',q:3,glyph:'flame',name:'PRESAS EM BRASA',max:1,desc:'a mordida incendeia a vítima por dentro.',can:function(){return game.hasBite&&!game.biteFire;},apply:function(){game.biteFire=true;}},
{id:'presagelo',q:3,glyph:'shard',name:'PRESAS DE GELO',max:1,desc:'a mordida congela quem for mordido.',can:function(){return game.hasBite&&!game.biteFrost;},apply:function(){game.biteFrost=true;}},
{id:'presaveneno',q:3,glyph:'venom',name:'PRESAS PEÇONHENTAS',max:1,desc:'a mordida injeta veneno corrosivo.',can:function(){return game.hasBite&&!game.biteVeneno;},apply:function(){game.biteVenom=true;}},
{id:'presasismo',q:4,glyph:'burst',name:'MANDÍBULA SÍSMICA',max:1,desc:'cada mordida detona em área.',can:function(){return game.hasBite&&!game.biteQuake;},apply:function(){game.biteQuake=true;}},
{id:'mjolnir',q:4,glyph:'hammer',name:'O VEREDICTO',max:3,desc:'o martelo orbita thor e caça sozinho.',can:function(){return(game.up.mjolnir||0)<3;},apply:function(){addHammer();}},
{id:'trovao',q:4,glyph:'bolt',name:'TROVÃO LONGÍNQUO',max:3,desc:'tiros viram trovão: +40% e o raio salta. 3 níveis: salta 2x.',can:function(){return game.hasShot&&game.elements.trovao<3;},apply:function(){elemLevelUp('trovao','DO TROVÃO',function(){game.chain2=true;});}},
{id:'gross',q:4,glyph:'blood',name:'SANGUE GROSSO',max:2,desc:'invencibilidade após golpe dura +0,5s.',can:function(){return(game.up.gross||0)<2;},apply:function(){P.invBonus+=.5;}},
{id:'motoserra',q:4,glyph:'saw',name:'MOTOSERRA',max:3,desc:'O som que todos demonios temem. Clique para lançá-la.',can:function(){return(game.up.motoserra||0)<3;},apply:function(){P.chainsaw++;}},
{id:'gram',q:4,glyph:'sword',name:'GRIMM, LÂMINA DRAGÃO',max:3,desc:'a espada corta num arco largo.',can:function(){return(game.up.gram||0)<3;},apply:function(){P.sword++;}},
{id:'estacas',q:4,glyph:'stake',name:'ESTACAS DE GELO ETERNO',max:4,desc:'estacas gélidas caem do céu.',can:function(){return(game.up.estacas||0)<4;},apply:function(){P.stakes++;}},
{id:'explosao',q:4,glyph:'burst',name:'EXPLOSÃO DE ENXOFRE',max:3,desc:'explosões telegrafadas incendeiam em área.',can:function(){return(game.up.explosao||0)<3;},apply:function(){P.burst++;game.burstT=1.5;}},
{id:'sismica',q:4,glyph:'burst',name:'BALAS SÍSMICAS',max:2,desc:'cada tiro detona ao acertar.',can:function(){return game.hasShot&&(game.up.sismica||0)<2;},apply:function(){P.explShot++;}},
{id:'trevas',q:4,glyph:'dark',name:'TREVAS DO VÉU',max:3,desc:'crânios de éter orbitam thor e mordem.',can:function(){return(game.up.trevas||0)<3;},apply:function(){P.dark++;}},
{id:'luz',q:4,glyph:'light',name:'LUZ DA ACUSAÇÃO',max:3,desc:'feixe rotativo varre a sala ao redor de thor.',can:function(){return(game.up.luz||0)<3;},apply:function(){P.light++;game.lightMagT=2;}},
{id:'guarda',q:4,glyph:'shield',name:'GUARDA PROFANA',max:1,desc:'golpes de perto (mordida, serra, lâmina) rebatem tiros.',can:function(){return!game.hasParry;},apply:function(){game.hasParry=true;}},
{id:'onda',q:5,glyph:'wave',name:'ONDA DO ABISMO',max:3,desc:'ondas de choque queimam e desfazem feitiços.',can:function(){return(game.up.onda||0)<3;},apply:function(){P.shock++;game.shockT=1.2;}},
{id:'berserk',q:5,glyph:'fangs',name:'FRENESI',max:1,desc:'com 1 coração, a mordida morde 75% mais fundo.',can:function(){return game.hasBite&&!game.berserk;},apply:function(){game.berserk=true;}},
{id:'storm',q:5,glyph:'sky',name:'TEMPESTADE ETERNA',max:1,desc:'a ira da tempestade cai 2x mais rápido.',can:function(){return P.lightning>0&&!game.storm;},apply:function(){game.storm=true;}},
{id:'sede',q:5,glyph:'fangs',name:'SEDE DE SANGUE',max:2,desc:'tudo ataca 22% mais rápido.',can:function(){return(game.up.sede||0)<2;},apply:function(){P.rateMult*=1.22;}},
{id:'pesadelo',q:5,glyph:'dark',name:'PESADELO CEGO',max:1,desc:'+45% de dano — o desvio recarrega 25% mais devagar.',can:function(){return!game.pesadelo;},apply:function(){game.pesadelo=true;P.dmgMult*=1.45;P.dashCdMult*=1.25;}},
{id:'iraodin',q:6,glyph:'crown',name:'IRA DO SOBERANO',max:1,desc:'todo o seu dano dobra.',can:function(){return!game.iraodin;},apply:function(){game.iraodin=true;P.dmgMult*=2;}},
{id:'heimdall',q:6,glyph:'eye',name:'OLHO DO VIGIA',max:1,desc:'os golpes de perto rebatem os tiros num raio muito maior.',can:function(){return game.hasParry&&!game.heimdall;},apply:function(){game.heimdall=true;P.parryRadius=260;}},
{id:'olho',q:6,glyph:'eye',name:'OLHO DO CAÇADOR',max:1,desc:'RARO — seu tiro dispara sozinho no demônio mais próximo.',can:function(){return game.hasShot&&!game.autoFire;},apply:function(){game.autoFire=true;player.shotT=.4;sfx.levelup();}},
/* ==== v1.0.0: NOVAS ARMAS — pistolas gêmeas e o feixe de carga ==== */
/* v1.2.0: PISTOLAS DUPLAS — a arma pode ser pega DE NOVO: com o 2º pegar
   nasce o quarteto e a sinergia completa com O FEIXE se torna possível */
{id:'pistolas',q:2,glyph:'twin',name:'PISTOLAS GÊMEAS',max:2,desc:'duas pistolas infernais em par: cadência rápida, projéteis leves. pegue DE NOVO para empunhar as PISTOLAS DUPLAS.',can:function(){return(game.up.pistolas||0)<2;},apply:function(){if(!game.hasPistols){game.hasPistols=true;player.pistolT=.2;}else if(!game.pistolasDuplas){game.pistolasDuplas=true;game.flash=.55;game.shake=12;try{sfx.levelup();sfx.glitch();}catch(e){}sparks(player.x,player.y,'#fff3c4',22,260,.8,4,true);texts.push({x:player.x,y:player.y-52,txt:'PISTOLAS DUPLAS',t:0,life:2,c:'#fff3c4',size:14,disp:true});texts.push({x:player.x,y:player.y-36,txt:'o quarteto completo — agora O FEIXE desperta',t:0,life:2,c:'#c9a0ff',size:11,disp:true});}}},
{id:'feixe',q:2,glyph:'light',name:'O FEIXE',max:1,desc:'segure o disparo para carregar a marca; solte com a barra cheia e o feixe perfura tudo na linha.',can:function(){return!game.hasBeam;},apply:function(){game.hasBeam=true;}},
/* ==== v1.2.0: GARRA DE FERA · FEIXE DO REI (ativa) · INSTINTO DE PANTERA ==== */
{id:'garra',q:3,glyph:'fangs',name:'GARRA DE FERA',max:1,desc:'+40% de dano da mordida e 25% mais alcance — a fera em você estende as garras.',can:function(){return game.hasBite&&!game.up.garra;},apply:function(){P.biteMult*=1.4;P.biteRange*=1.25;game.up.garra=1;}},
{id:'feixedorei',q:5,glyph:'light',name:'FEIXE DO REI',max:1,desc:'ATIVA — um feixe real AZUL atravessa tudo na sua frente (recarga 30s). ocupa o slot do item ativo.',can:function(){return game.hasShot&&!game.up.feixedorei;},apply:function(){game.up.feixedorei=1;pickupActiveItem('feixedorei');}},
{id:'pantera',q:4,glyph:'reach',name:'INSTINTO DE PANTERA',max:1,desc:'+30% velocidade — e o desvio te deixa intocável: 0.65s sem tomar dano depois de fugir.',can:function(){return!game.up.pantera;},apply:function(){P.speedMult*=1.3;game.pantera=true;}},
/* ==== v1.2.0: RECOMPENSAS ÚNICAS DA ESCOLA EM CHAMAS — liberadas ao
   vencer o ritual e fugir (META.schoolChamas). Elas nasceram ali. ==== */
{id:'cinzas',q:5,glyph:'blood',name:'CINZAS DO RITUAL',max:1,desc:'ÚNICA DA ESCOLA — +25% dano e +1 coração máximo: você caminhou pelas chamas e elas te reconhecem.',can:function(){return!!META.schoolChamas&&!game.up.cinzas;},apply:function(){P.dmgMult*=1.25;player.maxHp+=25;player.hp=Math.min(player.maxHp,player.hp+25);game.up.cinzas=1;}},
{id:'fuga',q:4,glyph:'reach',name:'O PACTO DA FUGA',max:1,desc:'PACTO ÚNICO DA ESCOLA — +35% velocidade e desvio 20% mais rápido: custa 15 de vida máxima. a fuga sempre cobra algo.',can:function(){return!!META.schoolChamas&&!game.up.fuga;},apply:function(){P.speedMult*=1.35;P.dashCdMult*=.8;player.maxHp=Math.max(50,player.maxHp-15);if(player.hp>player.maxHp)player.hp=player.maxHp;game.up.fuga=1;}},
/* ==== v0.9.1: O MUNDO — magia de parar o tempo (tecla 2) ==== */
{id:'mundo',q:5,glyph:'dark',name:'O MUNDO',max:1,desc:'RARO — pare o tempo por 3 segundos. inimigos e balas congelam, Thor não.',can:function(){return game.worldLevel<1;},apply:function(){pickupActiveItem('mundo');game.worldDur=3;game.worldLevel=1;sfx.levelup();}},
{id:'mundo2',q:6,glyph:'dark',name:'O MUNDO · TEMPUS',max:1,desc:'O MUNDO dura +2s (5s total). cooldown reduzido.',can:function(){return game.worldLevel===1;},apply:function(){game.worldDur=5;game.worldLevel=2;}},
{id:'mundo3',q:6,glyph:'dark',name:'O MUNDO · AETERNUM',max:1,desc:'O MUNDO dura +2s (7s total). cooldown reduzido.',can:function(){return game.worldLevel===2;},apply:function(){game.worldDur=7;game.worldLevel=3;}},
{id:'mundo4',q:6,glyph:'dark',name:'O MUNDO · INFINITUM',max:1,desc:'O MUNDO dura +2s (9s total — máximo). cooldown reduzido.',can:function(){return game.worldLevel===3;},apply:function(){game.worldDur=9;game.worldLevel=4;}},
/* v0.9.6: novos itens — Coração e Lágrimas */
{id:'coracao',q:4,glyph:'blood',name:'CORAÇÃO',max:1,desc:'coração, falso ou não...? — tiros causam sangramento',can:function(){return game.hasShot&&!game.up.coracao;},apply:function(){game.up.coracao=1;game.bloodShots=true;}},
{id:'lagrimas',q:4,glyph:'shard',name:'LÁGRIMAS',max:1,desc:'troca o tiro por duas gotas de lágrima — tiro duplo com lentidão',can:function(){return game.hasShot&&!game.up.lagrimas;},apply:function(){game.up.lagrimas=1;game.tearShots=true;}},
/* v0.9.6: bênçãos enganosas/muito ruins — algumas bem enganosas */
{id:'coracaofalso',q:3,glyph:'blood',name:'CORAÇÃO FALSO',max:1,desc:'+40% dano — mas você perde 10 HP a cada sala limpa.',can:function(){return!game.up.coracaofalso;},apply:function(){P.dmgMult*=1.4;game.up.coracaofalso=1;}},
{id:'vendaval',q:2,glyph:'wind',name:'VENDAVAL',max:1,desc:'+50% velocidade — mas inimigos também são 30% mais rápidos.',can:function(){return!game.up.vendaval;},apply:function(){P.speedMult*=1.5;game.up.vendaval=1;}},
{id:'olhogordo',q:3,glyph:'eye',name:'OLHO GORDO',max:1,desc:'+60% dano — mas você toma 50% mais dano.',can:function(){return!game.up.olhogordo;},apply:function(){P.dmgMult*=1.6;game.up.olhogordo=1;}},
{id:'pactofome',q:4,glyph:'fangs',name:'PACTO DA FOME',max:1,desc:'dano triplica — mas você recebe 25% mais dano. a fome agora morde de volta (v1.9.0: nunca mais drena vida).',can:function(){return game.hasBite&&!game.up.pactofome;},apply:function(){P.dmgMult*=3;game.up.pactofome=1;game.gri_fomeDmg=1;}},
{id:'cargapedra',q:2,glyph:'reach',name:'CARGA DE PEDRA',max:1,desc:'+50% alcance — mas você é 20% mais lento e desvio 40% mais devagar.',can:function(){return!game.up.cargapedra;},apply:function(){P.reachMult*=1.5;P.speedMult*=0.8;P.dashCdMult*=1.4;game.up.cargapedra=1;}},
{id:'espelho',q:5,glyph:'dark',name:'ESPELHO QUEBRADO',max:1,desc:'parece bom: +30% dano. realidade: cada hit inimigo tem 15% chance de ser crítico (50 dano).',can:function(){return!game.up.espelho;},apply:function(){P.dmgMult*=1.3;game.up.espelho=1;}},
/* v0.9.6: outras bênçãos enganosas */
{id:'ganancia',q:2,glyph:'soulg',name:'GANÂNCIA',max:1,desc:'+60% de almas — mas inimigos têm 40% mais vida. o preço da cobiça.',can:function(){return!game.greed;},apply:function(){game.greed=true;P.soulMult*=1.6;}},
{id:'vidro',q:3,glyph:'shard',name:'CORPO DE VIDRO',max:1,desc:'+70% de dano — mas você morre em 2 hits (cada hit tira 50 HP).',can:function(){return!game.glassBody;},apply:function(){game.glassBody=true;P.dmgMult*=1.7;}},
{id:'pressa',q:2,glyph:'wind',name:'PRESSA CEGA',max:1,desc:'+35% velocidade de ataque — mas seus tiros erram 25% do tempo.',can:function(){return!game.blindHaste;},apply:function(){game.blindHaste=true;P.rateMult*=1.35;}},
{id:'isolamento',q:4,glyph:'dark',name:'ISOLAMENTO',max:1,desc:'+50% de dano — mas almas não são mais atraídas. você está só.',can:function(){return!game.isolation;},apply:function(){game.isolation=true;P.dmgMult*=1.5;P.magnetMult=0;}},
{id:'fomeinsaciavel',q:3,glyph:'fangs',name:'FOME INSCIÁVEL',max:1,desc:'+30% de dano — mas a fome devora 5 almas a cada 10 segundos (nunca vida).',can:function(){return!game.endlessHunger;},apply:function(){game.endlessHunger=true;P.dmgMult*=1.3;game.hungerT=0;}}
];
/* ============ poderes únicos: 3 bênçãos do mesmo tipo ============
   Ao empilhar 3 níveis de um mesmo elemento/arma, thor desperta um dom único
   com nome próprio — anunciado em banners. Ex.: 3x gelo = CÃO DO INVERNO. */
const SYNERGIES={
gelo:{name:'CÃO DO INVERNO',sub:'os congelados explodem em estilhaços ao morrer',apply:function(){game.synInverno=true;}},
fogo:{name:'CÃO DE ENXOFRE',sub:'os queimados detonam em fogo ao morrer',apply:function(){game.synMuspel=true;}},
veneno:{name:'CÃO DA SERPENTE',sub:'a toxina se espalha para os vivos ao redor',apply:function(){game.synSerpente=true;}},
trovao:{name:'FILHO DO TROVÃO',sub:'cada tiro pode chamar um relâmpago do céu',apply:function(){game.synTrovao=true;}},
explosao:{name:'CÃO VULCÃO',sub:'as explosões ficam 35% maiores e mais cruéis',apply:function(){game.synVulcao=true;}},
raio:{name:'TEMPESTADE VIVA',sub:'a ira da tempestade cai sem parar sobre os demônios',apply:function(){game.storm=true;}},
motoserra:{name:'O CARRASCO SUPREMO',sub:'as serras giram 50% mais forte',apply:function(){game.synCarrasco=true;}}
};
function checkTypeSynergy(id){
const sy=SYNERGIES[id];
if(!sy)return;
if((game.up[id]||0)>=3){
sy.apply();
game.banner={type:'circle',txt:'PODER ÚNICO DESPERTADO',name:sy.name,sub:sy.sub,t:0,dur:3.2};
sfx.levelup();sfx.roar();game.flash=.35;game.shake=10;
sparks(player.x,player.y,'#ffd9a0',22,280,.8,3.5,true);
}
}
/* ============================================================
   v0.9.16: FORJA DE BUILDS — ESPECIALIZAÇÕES E SINERGIAS
   Cada bênção pertence a um SET (gelo, fogo, raio...). 3+ bênçãos do
   mesmo set ativam uma ESPECIALIZAÇÃO exclusiva (mensagem única +
   recompensa que MUDA a mecânica). Pares de sets distintos despertam
   SINERGIAS de par com efeitos reais no combate. Tudo aditivo.
   ============================================================ */
const UPG_SET={
vento:'vento',vendaval:'vento',pressa:'vento',furia:'vento',sede:'vento',polvora:'vento',
ima:'almas',pactovao:'almas',ganancia:'almas',
forca:'guerra',sanguefrio:'guerra',olhogordo:'guerra',vidro:'guerra',iraodin:'guerra',
sanguepesado:'sangue',sangue:'sangue',coracao:'sangue',coracaofalso:'sangue',
mercurio:'defesa',gross:'defesa',heimdall:'defesa',
alcance:'proj',gemeas:'proj',sismica:'proj',olho:'proj',cargapedra:'proj',unlockShot:'proj',
mandibula:'fera',fome:'fera',unlockBite:'fera',pactofome:'fera',
fomeinsaciavel:'fera',berserk:'fera',presasismo:'fera',motoserra:'fera',gram:'fera',
gelo:'gelo',presagelo:'gelo',nova:'gelo',estacas:'gelo',lagrimas:'gelo',
fogo:'fogo',presafogo:'fogo',explosao:'fogo',
veneno:'veneno',presaveneno:'veneno',ferroada:'veneno',
raio:'raio',trovao:'raio',storm:'raio',mjolnir:'raio',
trevas:'sombra',pesadelo:'sombra',isolamento:'sombra',mundo:'sombra',mundo2:'sombra',mundo3:'sombra',mundo4:'sombra',espelho:'sombra',
pistolas:'pistolset',feixe:'feixeset',
luz:'luz',guarda:'luz',onda:'luz'};
/* ============================================================
   v1.1.0: BÊNÇÃO × PACTO — bênção é o poder comum; PACTO é o acordo
   que SEMPRE cobra um preço (buff + nerf na mesma moeda). A sala de
   sacrifício paga em corações e sela sempre um pacto.
   ============================================================ */
const PACT_IDS=['sanguepesado','polvora','pactovao','furia','sanguefrio','ferroada','pactofome','coracaofalso','vendaval','olhogordo','cargapedra','espelho','ganancia','vidro','pressa','isolamento','fomeinsaciavel','pesadelo','fuga'];/* v1.2.0: + o pacto da fuga */
/* v1.1.0: OS SETE PECADOS CAPITAIS — 3 bênçãos/pactos do mesmo pecado
   rendem a SENTENÇA do pecado: um buff único, temático e permanente. */
const SIN_SETS={
gula:{name:'A GULA',items:['coracao','fome','fomeinsaciavel'],sub:'devorar é crescer: a cada 15 abates, +5 de vida máxima (até +75)',apply:function(){game.sinGula=true;game.sinGulaK=0;game.sinGulaHp=0;}},
avaricia:{name:'A AVAREZA',items:['ganancia','ima','pactovao'],sub:'almas valem +50% — e o ERRANTE cobra 20% menos de quem acumula',apply:function(){P.soulMult*=1.5;game.sinDesconto=.2;}},
ira:{name:'A IRA',items:['iraodin','olhogordo','sede'],sub:'ferido, a fúria detona: cada golpe sofrido explode em chamas ao seu redor',apply:function(){game.sinIra=true;}},
soberba:{name:'A SOBERBA',items:['espelho','pesadelo','vidro'],sub:'impecável e intocado: com a vida cheia, todo o seu dano cresce +30%',apply:function(){game.sinSoberba=true;}},
invidia:{name:'A INVEJA',items:['olho','heimdall','isolamento'],sub:'o que os outros têm vira seu: cada alma ceifada rende +3 almas tomadas',apply:function(){game.sinInvidia=true;}},
acidia:{name:'A PREGUIÇA',items:['gross','sanguepesado','cargapedra'],sub:'parado por 1s, a carne repousa: cura 2 de vida por segundo',apply:function(){game.sinAcidia=true;game._acT=0;}},
luxuria:{name:'A LUXÚRIA',items:['lagrimas','coracaofalso','vendaval'],sub:'quem chega perto hesita: demônios num raio curto ficam 25% mais lentos',apply:function(){game.sinLuxuria=true;}}};
function checkSins(){
for(const k in SIN_SETS){
const s=SIN_SETS[k];
if(game['sin_'+k])continue;
let n=0;
for(const id of s.items)if(game.up[id])n++;
if(n>=3){
game['sin_'+k]=true;
META.sinFound=META.sinFound||{};META.sinFound[k]=1;saveMeta();
s.apply();
game.banner={type:'circle',txt:'A SENTENÇA DO PECADO',name:s.name,sub:s.sub,t:0,dur:4.2};
sfx.levelup();sfx.roar();game.flash=.4;game.shake=12;
sparks(player.x,player.y,'#d9465a',26,300,.8,3.5,true);
texts.push({x:player.x,y:player.y-52,txt:s.name+' — A SENTENÇA ESTÁ DADA',t:0,life:2.2,c:'#d9465a',size:13,disp:true});
}
}
}
const SPEC_SETS={
gelo:{name:'BRUXA DO GELO',chant:'3 BÊNÇÃOS DE GELO…',
 reward:'congelados duram 60% mais, explodem em estilhaços gélidos ao morrer',
 apply:function(){game.specGelo=true;}},
fogo:{name:'FILHO DAS CHAMAS',chant:'3 BÊNÇÃOS DE FOGO…',
 reward:'queimados detonam em chamas ao morrer, incendiando os vizinhos',
 apply:function(){game.specFogo=true;}},
raio:{name:'VOZ DA TEMPESTADE',chant:'3 BÊNÇÃOS DO TROVÃO…',
 reward:'cada abate chama um relâmpago do céu sobre os demônios',
 apply:function(){game.specRaio=true;}},
sangue:{name:'SENHOR DO SANGUE',chant:'3 BÊNÇÃOS DE SANGUE…',
 reward:'abates curam 2 de vida — abaixo da metade, +30% de dano',
 apply:function(){game.specSangue=true;}},
veneno:{name:'CÁLICE DA PESTE',chant:'3 BÊNÇÃOS DO VENENO…',
 reward:'envenenados liberam nuvem tóxica ao morrer, contaminando os vivos',
 apply:function(){game.specVeneno=true;}},
sombra:{name:'COROA DAS TREVAS',chant:'3 BÊNÇÃOS DAS TREVAS…',
 reward:'+2 crânios de éter orbitando thor',
 apply:function(){P.dark+=2;game.specSombra=true;}},
luz:{name:'AURORA PROFANA',chant:'3 BÊNÇÃOS DA LUZ…',
 reward:'o feixe rotativo ganha 1 nível — e o parry cura 5 de vida',
 apply:function(){P.light+=1;game.lightMagT=2;game.specLuz=true;}},
vento:{name:'DANÇARINO DO VENTO',chant:'3 BÊNÇÃOS DO VENTO…',
 reward:'o desvio recarrega 30% mais rápido e corta quem passa pelo caminho',
 apply:function(){P.dashCdMult*=.7;game.specVento=true;}},
fera:{name:'FILHO DA FERA',chant:'3 BÊNÇÃOS DA FERA…',
 reward:'a mordida bota 40% mais largo — devorar restaura vida aos poucos',
 apply:function(){P.biteRange*=1.4;game.specFera=true;}},
guerra:{name:'CAMPEÃO DA GUERRA',chant:'3 BÊNÇÃOS DA GUERRA…',
 reward:'a cada 15 abates, seu dano cresce +4% — a guerra te forja',
 apply:function(){game.specGuerra=true;game.warK=0;}},
almas:{name:'VÓRTICE DAS ALMAS',chant:'3 BÊNÇÃOS DO VÃO…',
 reward:'almas voam de muito mais longe e valem +25%',
 apply:function(){P.magnetMult+=1.2;P.soulMult*=1.25;game.specAlmas=true;}},
proj:{name:'CHUVA DE AÇO',chant:'3 BÊNÇÃOS DE PROJÉTEIS…',
 reward:'+1 projétil e +20% de alcance de golpe',
 apply:function(){if(game.hasShot)game.multi++;P.reachMult*=1.2;game.specProj=true;}},
defesa:{name:'PUNHO DO VEREDICTO',chant:'3 BÊNÇÃOS DA GUARDA…',
 reward:'parry num raio muito maior e invencibilidade +0,15s após cada golpe',
 apply:function(){P.parryRadius=Math.max(P.parryRadius,170);P.invBonus+=.15;game.specDefesa=true;}}};
/* pares de sets → sinergias (efeitos reais em applyElem/killEnemy/elemDmg) */
const PAIR_SYN=[
{a:'gelo',b:'fogo',key:'vapor',name:'VAPOR FERVENTE',sub:'fogo+gelo: o tiro morre e vira fumaça fervente que queima de perto'},
{a:'gelo',b:'raio',key:'supercondutor',name:'SUPERCONDUTOR',sub:'o raio em cadeia congela quem ele toca'},
{a:'gelo',b:'proj',key:'granizo',name:'GRANIZO PESADO',sub:'congelados recebem +15% de todo dano'},
{a:'fogo',b:'raio',key:'detonacao',name:'REAÇÃO VOLÁTIL',sub:'raio sobre um inimigo em chamas detona em explosão'},
{a:'fogo',b:'veneno',key:'praga',name:'PRAGA ÍGNEA',sub:'a toxina incendeia o corpo por dentro'},
{a:'fogo',b:'sangue',key:'cinza',name:'FERVURA DO SANGUE',sub:'queimados e envenenados sofrem +20% de dano'},
{a:'raio',b:'vento',key:'estatica',name:'ESTÁTICA DO VENTO',sub:'o raio em cadeia fere 30% mais fundo'},
{a:'luz',b:'sombra',key:'eclipse',name:'ECLIPSE',sub:'luz e trevas acordam: +12% de dano'},
{a:'luz',b:'sangue',key:'luzvital',name:'LUZ VITAL',sub:'corações no chão curam o dobro'},
{a:'veneno',b:'sombra',key:'miasma2',name:'MIASMA PROFUNDO',sub:'envenenados exalam névoa corrosiva ao morrer'},
{a:'vento',b:'proj',key:'ventocorte',name:'VENTO CORTANTE',sub:'tudo ataca 8% mais rápido'},
{a:'pistolset',b:'feixeset',key:'pistolbeam',name:'GÊMEAS DO FEIXE',sub:'TRANSFORMAÇÃO — pistolas DUPLAS + feixe: na carga, mini-feixes; no soltar cheio, o feixe duplo e mais forte',need:function(){return!!game.pistolasDuplas;}}];
function setCount(k){let n=0;for(const id in UPG_SET)if(UPG_SET[id]===k)n+=(game.up[id]||0);return n;}
function hasCat(k){return setCount(k)>0;}
function specBanner(key){
/* mensagem única em 2 atos — NADA de setTimeout: processada por updateActiveFx */
game.specMsg={key:key,t:0};
sfx.levelup();
}
function processSpecMsg(dt){
const m=game.specMsg;
if(!m)return;
m.t+=dt;
const sp=SPEC_SETS[m.key];
if(!sp){game.specMsg=null;return;}
if(m.t<.05&&!m.started){
m.started=true;
/* v1.0.0 FIX: headBanner precisa nascer com t:0 — sem isso o t fica undefined,
   vira NaN no t+=dt e a mensagem "3 PACTOS DE X…" NUNCA expira (bug do banner
   eterno). Agora o canto some em ~2s e o banner circular em ~4s: nada fica
   preso na tela para sempre. */
game.headBanner={txt:sp.chant,c:'#bfd8e8',t:0};
blip('sine',392,523,.5,.16);blip('sine',523,659,.5,.14,.3);
}
if(m.t>=1.7&&!m.applied){
m.applied=true;
sp.apply();
game.specs[m.key]=1;
META.specs=(META.specs||0)+1;saveMeta();
/* v1.0.0: mensagem some sozinha em ~4s (pedido do usuário — nada de banner eterno) */
game.banner={type:'circle',txt:'ESPECIALIZAÇÃO DESPERTADA',name:sp.name,sub:sp.reward,t:0,dur:4.2};
sfx.levelup();sfx.roar();game.flash=.45;game.shake=12;
sparks(player.x,player.y,'#e6dac4',34,340,1.0,4.5,true);
conqTick();
}
if(m.t>=1.9)game.specMsg=null;
}
function checkSpecs(){
for(const k in SPEC_SETS){
if(!game.specs[k]&&setCount(k)>=3)specBanner(k);
}
}
function checkPairSyn(){
let found=false;
for(const p of PAIR_SYN){
if(game.psyn[p.key])continue;
if(hasCat(p.a)&&hasCat(p.b)&&(!p.need||p.need())){
game.psyn[p.key]=1;
META.synFound=(META.synFound||0)+1;saveMeta();
game.banner={type:'small',txt:'SINERGIA — '+p.name,sub:p.sub,t:0,dur:2.6};
sfx.levelup();blip('sine',600,900,.25,.12);
sparks(player.x,player.y,'#ffd9a0',14,220,.6,3,true);
found=true;conqTick();
}
}
if(found)refreshMenuDev();
}
function applyPairOnAcquire(){
/* efeitos instantâneos de sinergias que alteram status na hora */
if(game.psyn.eclipse&&!game._ecl){game._ecl=1;P.dmgMult*=1.12;}
if(game.psyn.ventocorte&&!game._vc){game._vc=1;P.rateMult*=1.08;}
/* v1.2.0: dica — pistolas + feixe sem as DUPLAS ainda não desperta */
if(!game.psyn.pistolbeam&&!game._pistolHint&&hasCat('pistolset')&&hasCat('feixeset')&&!game.pistolasDuplas){game._pistolHint=1;game.banner={type:'small',txt:'AS GÊMEAS QUEREM MAIS UMA',sub:'encontre as PISTOLAS GÊMEAS de novo para acordar o feixe',t:0,dur:3.2};try{sfx.echo();}catch(e){}}
/* v1.0.0: TRANSFORMAÇÃO — pistolas DUPLAS + feixe = pistolas que atiram o feixe */
if(game.psyn.pistolbeam&&!game.pistolBeam){
game.pistolBeam=true;
texts.push({x:player.x,y:player.y-46,txt:'GÊMEAS DO FEIXE — mini-feixes na carga; no soltar cheio, o feixe duplo e mais forte',t:0,life:2.6,c:'#fff3c4',size:12,disp:true});
}
}
/* chamado depois de CADA bênção adquirida (carta ou drop no chão) */
function onBlessingAcquired(id){
checkTypeSynergy(id);
checkSpecs();
checkSins();/* v1.1.0: os sete pecados observam cada bênção aceita */
checkPairSyn();
applyPairOnAcquire();
}
function rollUpgrades(){
const pool=UPGRADES.filter(function(u){try{return u.can();}catch(e){return false;}}); /* v1.4.2: item com can() quebrada nunca derruba o sorteio */
const out=[];
/* apenas 1 ou 2 escolhas por bênção — cada escolha pesa mais */
const nCho=Math.random()<.4?1:2;
while(out.length<nCho&&pool.length){
let tot=0;
const ws=pool.map(function(u){let w=QUAL_W[u.q-1]||1;if(window.__GRI&&window.__GRI.pactW)w*=window.__GRI.pactW(u);tot+=w;return w;}); /* v1.4.2: q fora da tabela (PACTO 404 q7) pesa 1 · v1.9.0: pactos bem mais raros, feixes controlados pelo grimório */
let r=rnd(tot),idx=0;
for(;idx<pool.length;idx++){r-=ws[idx];if(r<=0)break;}
idx=Math.min(idx,pool.length-1);
out.push(pool.splice(idx,1)[0]);
}
const fallback=UPGRADES.find(function(u){return u.id==='forca';});
while(out.length<1)out.push(fallback);
return out;
}
function buildUpgradeCards(fromTreasure){
/* v0.9.12 FIX: o HTML tem #upgradeCards (não #cards) — as cartas de
   bênção/tesouro apareciam vazias porque o getElementById voltava null */
const box=ov('upgradeCards');
if(!box){game.state='play';game.treasureOpen=false;return;}
box.innerHTML='';
const eb=ov('blessEyebrow');
if(eb)eb.textContent=fromTreasure?'TESOURO':'BÊNÇÃO';
let opts2=[];try{opts2=rollUpgrades()||[];}catch(e){opts2=[];console.warn('[bencoes]',e);} /* v1.4.2: a tela de bênção NUNCA deixa o jogador preso */
for(let i=0;i<opts2.length;i++){
const u=opts2[i];
const col=QUAL_C[u.q-1]||QUAL_C[5]; /* v1.4.2: q fora da tabela cai na cor lendária */
const el=document.createElement('button');
el.className='card'+(u.q===6?' q6':'');
el.style.borderColor=col;
el.style.background='linear-gradient('+hexA(col,.09)+','+hexA(col,.02)+'), rgba(13,9,11,.94)';
const st=(game.up[u.id]||0);
/* v1.1.3: glifo dentro de .glyphSlot — se existir arte em
   assets/sprites/drops/<id>.png, applyDropArt troca pelo sprite */
el.innerHTML='<span class="glyphSlot">'+GLYPHS[u.glyph]+'</span><h3>'+u.name+'</h3><p>'+u.desc+'</p><div class="lvl" style="color:'+col+'">'+(PACT_IDS.indexOf(u.id)>=0?'PACTO · ':'BÊNÇÃO · ')+'QUALIDADE '+roman(u.q)+(st>0?' · GRAU '+roman(st+1):'')+'</div>';
el.addEventListener('click',function(){chooseUpgrade(u);});
el.addEventListener('mouseenter',function(){blip('sine',500,650,.05,.03);});
box.appendChild(el);
applyDropArt(el,u.id);
}
showOv('levelup');
}
function openTreasure(){
/* v0.9.13→14: MODO NERDCIRNO67 — a sala de tesouro vira almas, sem cartas de bênção */
if(game.noBless){
gainSouls(80);sfx.soul();
texts.push({x:player.x,y:player.y-40,txt:'+80 ALMAS (NERDCIRNO67)',t:0,life:1.5,c:'#c9a0ff',size:12,disp:true});
game.flash=Math.max(game.flash,.25);
return;
}
game.treasureOpen=true;
game.state='levelup';
game.parryCharge=0;game.parryLock=false;
buildUpgradeCards(true);
sfx.levelup();
}
function chooseUpgrade(u){
u.apply();
game.up[u.id]=(game.up[u.id]||0)+1;
/* v1.0.0: registra no grimório — descrições de pactos/armas só se revelam
   no bestiário depois de selados numa descida anterior */
if(!META.acq)META.acq={};if(!META.acq[u.id]){META.acq[u.id]=1;saveMeta();}
onBlessingAcquired(u.id);/* v0.9.16: sinergias + especializações + poderes únicos */
/* v0.9.4: animação de level-up — flash dourado + partículas + shake */
game.flash=.4;game.shake=Math.max(game.shake,8);
sparks(player.x,player.y,'#ffd9a0',20,280,.8,3.5,true);
sparks(player.x,player.y,u.glyph?GLYPHS[u.glyph]?'#ffd9a0':'#e6dac4':'#e6dac4',10,200,.6,3,true);
texts.push({x:player.x,y:player.y-40,txt:u.name,t:0,life:1.4,c:'#ffd9a0',size:13,disp:true});
if(game.treasureOpen){
game.treasureOpen=false;
hideOv('levelup');blurActive();
game.banner={type:'small',txt:'TESOURO: '+u.name,sub:'',t:0,dur:2.4};
game.state='play';
return;
}
hideOv('levelup');blurActive();
game.state='play';
}
/* ============ livro do cão ============ */
/* v0.9.13: BESTIÁRIO COM IMAGEM, DANO E DESCRIÇÃO + catálogo de pactos/itens
   + conquistas. Retratos gerados num canto do canvas e copiados antes do
   render do frame — invisível ao jogador. */
const _bestiaryCache={};
function bestiaryBaseType(k){return k.endsWith('E')?k.slice(0,-1):k;}
function bestiaryStats(k){
if(_bestiaryCache[k])return _bestiaryCache[k];
const base=bestiaryBaseType(k);
const out={hp:'?',sp:'?',dmg:20,img:null};
/* stats reais — spawn temporário num array descartável */
try{
const saved=enemies.splice(0,enemies.length);
spawnEnemy(base,-9999,-9999);
const e0=enemies[enemies.length-1];
if(e0){out.hp=e0.hp;out.sp=Math.round(e0.sp);}
enemies.length=0;
for(const s2 of saved)enemies.push(s2);
}catch(e){}
/* retrato: enfileira para desenhar no próximo frame */
if(window.__bestQueue){
const c2=document.createElement('canvas');c2.width=64;c2.height=64;
window.__bestQueue.push({base:base,cv:c2});
out._cv=c2;
}
_bestiaryCache[k]=out;
return out;
}
function processBestiaryQueue(){
if(!window.__bestQueue||!window.__bestQueue.length)return;
const q=window.__bestQueue.splice(0,window.__bestQueue.length);
ctx.save();ctx.setTransform(1,0,0,1,0,0);
for(const job of q){
try{
ctx.clearRect(0,0,80,80);
const fe={type:job.base,x:40,y:44,r:12,hp:10,sp:0,flash:0,spawnT:1,ang:0,seed:2,hitT:0,dead:false,slowT:0,burnT:0,poisT:0,poisD:0,poisStack:0,burnD:0,st:'float',stT:0,atkT:9,p2:false,mv:false,maxHp:10,dashT:0,shootT:9,elite:false,kaizo:false};
drawEnemy(fe);
const c2=job.cv.getContext('2d');
c2.clearRect(0,0,64,64);
c2.drawImage(cv,0,0,80,80,0,0,64,64);
for(const k in _bestiaryCache)if(_bestiaryCache[k]._cv===job.cv){_bestiaryCache[k].img=job.cv.toDataURL();delete _bestiaryCache[k]._cv;}
}catch(e){}
}
ctx.restore();
ctx.clearRect(0,0,80,80);
}
/* v1.1.0: CÓDICE com duas metades — INVENTÁRIO (o que você carrega nesta
   descida) e GRIMÓRIO (demonologia: demônios, bosses, entidades, pactos,
   bênçãos, maldições, círculos e fragmentos de um livro mais antigo
   que o Inferno — e que já descreve lugares que você não visitou). */
const GRIM_CATS=[['demonios','DEMÔNIOS'],['bosses','BOSSES'],['entidades','ENTIDADES'],['pactos','PACTOS'],['bencoes','BÊNÇÕES'],['maldicoes','MALDIÇÕES'],['circulos','CÍRCULOS'],['fragmentos','FRAGMENTOS']];
const DEMON_KEYS=['sh','br','sp','fs','ru','ce','gd','al','es','la','cr','crs','vg','pg','fa','puppy'];
const BOSS_KEYS=['mb','ex','vi','gz'];
const GRIM_MALDICOES=[
['A QUEIMADURA','o fogo mora dentro da carne e segue queimando depois do golpe'],
['O VENENO','a toxina rói por dentro — e se espalha para os que tocam o caído'],
['O CONGELAMENTO','o frio do Primeiro Frio prende: quem congela, demora'],
['O SANGRAMENTO','o coração aceito cobra: cada golpe de sangue abre a ferida'],
['A MARCA DO ESPELHO','às vezes o golpe do demônio volta crítico — o espelho quebra e devolve'],
['A FOME','o pacto que nunca se sacia: o corpo paga 5 de vida por segundo'],
['O VÉU','isolado, você não atrai almas — o Inferno gosta de quem caminha só']];
const GRIM_CIRCULOS=[
['PARAÍSO','luz que ninguém deveria ver de onde você está',true],
['???','as páginas foram rasgadas — o que havia aqui não se lê mais',true],
['IX — TRAIÇÃO','o último círculo. quem chega lá não volta igual',true],
['VIII — FRAUDE','mentiras dentro de mentiras — os demônios daqui falam bonito',true],
['VII — VIOLÊNCIA','rio de sangue fervente e floresta de enforcados',true],
['VI — HERESIA','túmulos quentes para os que juraram falsos juramentos',true],
['V — FÚRIA','os irados batem na lama escura para sempre, gritando contra o céu',true],
['IV — AVAREZA','acumuladores e gastadores empurram pesos opostos, contando almas',true],
['III — FOME','cérberos, chuva, lodo — e Cérbero acima de tudo, uivando',true],
['II — DESEJO','ventos que carregam almas como folhas — nada de paraquedas',true],
['I — ABISMO','o falso paraíso: catedrais sob um céu que não é céu',false],
['LIMBO','a penumbra onde você começa — as almas esperam sem esperança',false]];
const GRIM_FRAGMENTOS=[
['FRAGMENTO I','"…nel mezzo del cammin, a porta foi aberta por algo que não tinha mãos…"'],
['FRAGMENTO II','"os nomes raspados nas paredes não foram vandalizados. foram apagados por ordem."'],
['FRAGMENTO III','"o Trono está vazio há séculos. e ainda assim, alguém assina os decretos."'],
['FRAGMENTO IV','"os Sete Selos não prendem o Inferno dentro. prendem alguma coisa fora."'],
['FRAGMENTO V','"o livro descreve lugares que você ainda não visitou. verifique a tinta. está fresca."'],
['FRAGMENTO VI','"o Primeiro Frio veio antes do Primeiro Fogo. pergunte a qualquer cinza."'],
['FRAGMENTO VII','"o erro que a hierarquia apagou não obedece círculos. não obedece nada."'],
['FRAGMENTO VIII','"Dante escreveu sobre este Inferno. ou alguém escreveu sobre Dante. a caligrafia é a mesma."']];
function grimFicha(k,nat,circ){
const b=BESTIARY[k]||['???',''];
const st=bestiaryStats(k);
const img=st.img?'<img src="'+st.img+'" width="46" height="46" style="border:1px solid #3a2f2a;background:#0c0a0c;flex:0 0 auto">':'';
return '<div class="bkRow ficha"><div style="display:flex;align-items:center;gap:10px">'+img+'<div><b>'+b[0]+'</b><em>'+b[1]+'</em><em style="color:#7fa8b8">STATUS: vida '+st.hp+' · velocidade '+st.sp+' · dano '+st.dmg+'<br>CÍRCULO: '+circ+' · NATUREZA: '+nat+'</em></div></div></div>';
}
function grimStatic(nm,lore,status,circ,nat){
return '<div class="bkRow ficha"><div><b style="color:#e6dac4">'+nm+'</b><em>'+(lore||'')+'</em><em style="color:#7fa8b8">STATUS: '+status+' · CÍRCULO: '+circ+' · NATUREZA: '+nat+'</em></div></div>';
}
function syncBookTabs(){
const ti=ov('bookTabInv'),tg=ov('bookTabGrim'),ch=ov('grimChips');
if(ti)ti.classList.toggle('sel',game._bookTab!=='grim');
if(tg)tg.classList.toggle('sel',game._bookTab==='grim');
if(ch){
ch.style.display=game._bookTab==='grim'?'flex':'none';
if(game._bookTab==='grim'&&!ch.dataset.built){
ch.dataset.built='1';
ch.innerHTML=GRIM_CATS.map(function(c){return '<button class="chip" data-cat="'+c[0]+'">'+c[1]+'</button>';}).join('');
ch.addEventListener('click',function(e){const b=e.target.closest('.chip');if(!b)return;game._grimCat=b.dataset.cat;renderBook();blip('sine',500,650,.05,.03);});
}
if(game._bookTab==='grim'){const cs=ch.querySelectorAll('.chip');for(const b of cs)b.classList.toggle('sel',b.dataset.cat===(game._grimCat||'demonios'));}
}
}
function renderGrimorio(body){
const cat=game._grimCat||'demonios';
let h='';
if(cat==='demonios'){
h+='<div class="bkSec">— DEMÔNIOS — os comuns da descida —</div>';
const seen=Object.keys(META.seen).filter(function(k){return DEMON_KEYS.indexOf(bestiaryBaseType(k))>=0;});
h+=seen.length?seen.map(function(k){return grimFicha(k,'Demoníaca','I — ABISMO · PENUMBRA');}).join(''):'<div class="bkEmpty">as páginas em branco esperam os demônios.</div>';
}else if(cat==='bosses'){
h+='<div class="bkSec">— BOSSES — senhores de mapa —</div>';
const seen=Object.keys(META.seen).filter(function(k){return BOSS_KEYS.indexOf(bestiaryBaseType(k))>=0;});
h+=seen.length?seen.map(function(k){return grimFicha(k,'Infernal Superior','???');}).join(''):'<div class="bkEmpty">nenhum senhor de mapa foi visto de perto. ainda.</div>';
h+='<div class="bkRow ficha" style="margin-top:8px"><div><b style="color:#e6dac4">KAIZO</b><em>bosses que já caíram voltam brancos e mais fortes — padrões que você nunca viu. a forma proibida.</em><em style="color:#7fa8b8">STATUS: a segunda chance do Inferno · CÍRCULO: todos · NATUREZA: Proibida</em></div></div>';
}else if(cat==='entidades'){
h+='<div class="bkSec">— ENTIDADES — o que não se encaixa —</div>';
h+=grimStatic('O ERRANTE','vendedor de poder nas lojas. cobra em almas, mente nos preços — mas nunca abandona o posto.','comerciante de almas','???','Errante — sem círculo');
h+=grimStatic('CARONTE','o barqueiro do rio escuro. cobra o pedágio, canta baixo, rema mesmo assim.','barqueiro do rio','O RIO','Entidade ancestral');
if(META.kingsoul||(META.seen&&META.seen.rk))h+=grimStatic('O VELHO REI DO XADREZ','sentença secreta. conhece thor de outro tempo e joga com os mortos. agora só caça salas secretas — 1% delas.','jogador sentenciado','???','Anômala');
if((META.e404||0)>0)h+=grimStatic('ERRO 404','não pertence a nenhum círculo. nasceu errada, antes da hierarquia. os registros foram apagados — e os demônios também têm medo.','erro da criação','FORA DO MAPA','Anomalia');
if(META.wins)h+=grimStatic('CÉRBERO','três cabeças, três elementos. guardião de portão — e de apetite.','guardião','PORTÃO DO INFERNO','Demoníaca — mito antigo');
if(META.casteloCleared)h+=grimStatic('O CONVIDADO','a casa lembra. não olhe para a lua. ele está em casa.','???','A CASA','Indeterminada');
}else if(cat==='pactos'){
h+='<div class="bkSec">— PACTOS — bênçãos que sempre cobram um preço —</div>';
h+=PACT_IDS.map(function(id){
const u=UPGRADES.find(function(x){return x.id===id;});
if(!u)return'';
const known=META.acq&&META.acq[u.id];
if(known)return '<div class="bkRow"><div><span class="bkArt" data-dropid="'+u.id+'"></span><b style="color:#9d6bb5">'+u.name+'</b><em>'+shortDesc(u.desc)+'</em></div><span style="color:#9d6bb5">PACTO</span></div>';
return '<div class="bkRow" style="opacity:.55"><div><b style="color:#574f45">???</b><em style="color:#574f45">pacto ainda não selado — o preço permanece oculto</em></div><span style="color:#574f45">—</span></div>';
}).join('');
h+='<div class="bkEmpty" style="margin-top:8px">o altar de sacrifício paga 10 de vida por um pacto. sempre. e quantas vezes você aguentar.</div>';
}else if(cat==='bencoes'){
h+='<div class="bkSec">— CATÁLOGO DE BÊNÇÕES —</div>';
h+=UPGRADES.map(function(u){
const col=QUAL_C[u.q-1]||QUAL_C[5]; /* v1.4.2: q fora da tabela (PACTO 404) não apaga o catálogo */
const known=META.acq&&META.acq[u.id];
if(known){return '<div class="bkRow"><div><span class="bkArt" data-dropid="'+u.id+'"></span><b style="color:'+col+'">'+(PACT_IDS.indexOf(u.id)>=0?'PACTO — ':'')+u.name+'</b><em>'+shortDesc(u.desc)+'</em></div><span style="color:'+col+'">Q'+u.q+'</span></div>';}
return '<div class="bkRow" style="opacity:.55"><div><b style="color:#574f45">???</b><em style="color:#574f45">bênção ainda não aceita — seus termos permanecem ocultos</em></div><span style="color:#574f45">—</span></div>';
}).join('');
}else if(cat==='maldicoes'){
h+='<div class="bkSec">— MALDIÇÕES — o que o corpo paga —</div>';
h+=GRIM_MALDICOES.map(function(m){return '<div class="bkRow"><div><b style="color:#d9465a">'+m[0]+'</b><em>'+m[1]+'</em></div></div>';}).join('');
}else if(cat==='circulos'){
h+='<div class="bkSec">— OS NOVE CÍRCULOS — e o que os cerca —</div>';
h+=GRIM_CIRCULOS.map(function(c){
return '<div class="bkRow" style="'+(c[2]?'opacity:.5':'')+'"><div><b style="color:'+(c[2]?'#4a3f33':'#e6dac4')+'">'+c[0]+'</b><em>'+(c[2]?'<span style="color:#574f45;text-decoration:line-through">'+c[1]+'</span>':c[1])+'</em></div></div>';
}).join('');
}else if(cat==='fragmentos'){
h+='<div class="bkSec">— FRAGMENTOS — páginas soltas de um livro mais antigo —</div>';
h+=GRIM_FRAGMENTOS.map(function(f){return '<div class="bkRow ficha"><div><b style="color:#c9b08a">'+f[0]+'</b><em style="font-style:italic;color:#8a7a5e">'+f[1]+'</em></div></div>';}).join('');
h+='<div class="bkEmpty">algumas páginas estão rasgadas. outras ainda estão sendo escritas.</div>';
}
body.innerHTML=h;
}
/* v1.4.4: descrições resumidas — o livro e a arca mostram o essencial (a
   frase inteira continua nos dados e nas cartas de escolha do jogo) */
function shortDesc(d,n){
 try{
  n=n||86;d=String(d||'');
  let cut=d.split(/ — |;\s*|\.\s+/)[0].trim();
  if(cut.length<24){const parts=d.split(' · ');if(parts.length>1)cut=parts.slice(0,2).join(' ·').trim();}
  let s=cut;
  if(s.length>n)s=s.slice(0,n-1).replace(/\s+\S*$/,'')+'…';
  return s;
 }catch(e){return String(d||'');}
}
/* v1.4.4: ficha de combate dos itens ativos — dano/alcance/tiros no menu.
   O HUD mostra só SPC; a ficha completa vive aqui. */
const ACTIVE_STATS={
sino:'ATORDOA 2,5s · ÁREA 560',
feixedorei:'DANO 120×dano · ALCANCE 760 · PERFURA',
latido:'DANO 40–80 · ÁREA 260 · EMPURRA',
mundo:'TEMPO PARADO 3s · TELA TODA',
estrela:'INVULNERÁVEL 5s · AURA DE DANO',
trovao:'RELÂMPAGOS EM TODOS · TELA TODA',
furia:'+90% CADÊNCIA · +50% DANO · 6s',
cura:'CURA TOTAL · +1 CORAÇÃO MÁXIMO',
nevasca:'CONGELA 4s · ANEL AO REDOR',
ampulheta:'LENDA 40% · 6s · TELA TODA',
portal:'TELEPORTE · BOMBA DE SOMBRA',
corvos:'2 CORVOS · CAÇAM POR 8s',
escudo:'BLOQUEIA 3 GOLPES · 12s',
girassol:'REGENERA 40% · 5s',
piroclismo:'3 ONDAS · DANO EM ÁREA · INCÊNDIO',
decreto:'+40% DANO SOBRE ELES · 8s',
imagem:'ECO ATRAI INIMIGOS · 5s',
municao:'TIROS PERFURAM O 1º · 8s',
forma:'+40% VEL · MORDIDA +60% · 6s',
meteoro:'4 METEOROS · DANO EM ÁREA'
};
function renderInvBody(body){
let h='';
h+='<div class="bkSec">— BÊNÇÕES DESTA DESCIDA —</div>';
const got=UPGRADES.filter(u=>(game.up[u.id]||0)>0);
h+=got.length?got.map(u=>'<div class="bkRow"><div><span class="bkArt" data-dropid="'+u.id+'"></span><b>'+u.name+'</b><em>'+shortDesc(u.desc)+'</em></div><span>×'+game.up[u.id]+'</span></div>').join(''):'<div class="bkEmpty">nenhuma bênção ainda. as almas aguardam.</div>';
if(game.manto)h+='<div class="bkRow"><div><span class="bkArt" data-dropid="manto"></span><b style="color:#bfd8e8">MANTO DAS ALMAS</b><em>pacto único de Caronte — +35% almas · +15% dano · +1 coração</em></div><span>★</span></div>';
/* v1.1.0: sentenças dos pecados aceitos nesta descida */
h+='<div class="bkSec">— SENTENÇAS DOS PECADOS —</div>';
const sinGot=Object.keys(SIN_SETS).filter(k=>game['sin_'+k]);
h+=sinGot.length?sinGot.map(k=>'<div class="bkRow"><div><b style="color:#d9465a">'+SIN_SETS[k].name+'</b><em>'+SIN_SETS[k].sub+'</em></div><span>✝</span></div>').join(''):'<div class="bkEmpty">três bênçãos/pactos do mesmo pecado rendem a sentença dele.</div>';
h+='<div class="bkSec">— PODERES ÚNICOS —</div>';
const syns=Object.keys(SYNERGIES).filter(k=>(game.up[k]||0)>=3);
h+=syns.length?syns.map(k=>'<div class="bkRow"><div><b>'+SYNERGIES[k].name+'</b><em>'+SYNERGIES[k].sub+'</em></div><span>★</span></div>').join(''):'<div class="bkEmpty">três bênçãos do mesmo tipo despertam um poder único.</div>';
h+='<div class="bkSec">— ESPECIALIZAÇÕES (3 BÊNÇÃOS DO MESMO TIPO) —</div>';
const specGot=Object.keys(game.specs||{}).filter(k=>game.specs[k]&&SPEC_SETS[k]);
h+=specGot.length?specGot.map(k=>'<div class="bkRow"><div><b style="color:#ffd9a0">'+SPEC_SETS[k].name+'</b><em>'+SPEC_SETS[k].reward+'</em></div><span>★</span></div>').join(''):'<div class="bkEmpty">junte 3 bênçãos do mesmo tipo — gelo, fogo, sangue… — e desperte.</div>';
h+='<div class="bkSec">— SINERGIAS DE PAR —</div>';
const psGot=PAIR_SYN.filter(p=>game.psyn[p.key]);
h+=psGot.length?psGot.map(p=>'<div class="bkRow"><div><b style="color:#9d6bb5">'+p.name+'</b><em>'+p.sub+'</em></div><span>✦</span></div>').join(''):'<div class="bkEmpty">bênçãos de naturezas diferentes podem formar marcas: fogo+gelo, raio+gelo…</div>';
h+='<div class="bkSec">— ITENS ATIVOS — O EQUIPADO E TODOS OS OUTROS —</div>';
/* v1.4.4: o HUD mostra só SPC — aqui fica a ficha completa: o item equipado
   (com o estado da partida) e TODOS os outros, com dano, alcance e tiros */
const _aiKeys=Object.keys(ACTIVE_ITEMS);
for(const _ak of _aiKeys){
 const ai=ACTIVE_ITEMS[_ak];if(!ai)continue;
 const eq=game.activeItem===_ak;
 const col=eq?'#c9a0ff':'#8a7f92';
 const inRun=(game.state==='play'||game.state==='bossintro'||game.state==='carontefight');
 const st=eq?(inRun?(game.activeCd>0?'NA PARTIDA · recarga '+Math.ceil(game.activeCd)+'s':'NA PARTIDA · PRONTO [SPC]'):('recarga '+ai.cd+'s')):('recarga '+ai.cd+'s');
 h+='<div class="bkRow" style="'+(eq?'':'opacity:.62')+'"><div><span class="bkArt" data-dropid="'+_ak+'"></span><b style="color:'+col+'">'+ai.name+(eq?' (EQUIPADO)':'')+'</b><em>'+shortDesc(ai.desc,70)+'</em><em style="color:#7fa8b8">'+(ACTIVE_STATS[_ak]?ACTIVE_STATS[_ak]+' · ':'')+st+'</em></div><span style="color:'+col+'">'+(eq?'◆':'◇')+'</span></div>';
}
/* a FAGULHA [Q] na mesma ficha — com quantos tiros restam na partida */
h+='<div class="bkRow" style="opacity:.9"><div><b style="color:#ff8f3d">FAGULHA EXPLOSIVA · [Q]</b><em>brasa que detona: fere em área, racha paredes escondidas e quebra a janela do ERRO 404</em><em style="color:#7fa8b8">DANO 30×dano · EXPLOSIVA · '+(game.fagulha>0?'NA PARTIDA ×'+game.fagulha+' tiro'+(game.fagulha>1?'s':''):'sem estoque nesta partida')+'</em></div><span style="color:#ff8f3d">✦</span></div>';
body.innerHTML=h;
}
function renderBook(){
const body=ov('bookBody');
if(!body)return;
game._bookTab=game._bookTab||'inv';
syncBookTabs();
if(game._bookTab==='grim')renderGrimorio(body);
else renderInvBody(body);
bindDropArts(body);/* v1.1.3: miniaturas das artes em assets/sprites/drops/ */
/* retratos chegam no próximo frame — redesenha uma vez */
if(window.__bestQueue&&window.__bestQueue.length)setTimeout(function(){if(game.state==='book')renderBook();},160);
}
function toggleBook(){
/* v0.9.12 FIX: o LIVRO agora abre dentro da escola também — e lembra
   para onde voltar (antes fechava sempre para 'play', jogando o estado
   da escola fora) */
if(game.state==='book'){hideOv('book');game.state=game._bookBack||'play';blurActive();return;}
if(game.state!=='play'&&game.state!=='school')return;
game._bookBack=game.state;
renderBook();
showOv('book');
game.state='book';
blurActive();
}
/* ============ v1.4.3: A ESCADA DA SALA DE TESTES ============
   [0] no modo dev abre uma escada roxa no chão (perto de Thor). Pisar nela
   desce (fade curto, sempre conclui) para a GRANDE ARENA — uma sala de tela
   cheia, sem portas, feita só para testar bosses. Dentro dela [0] abre o
   laboratório como antes, e uma escada no topo devolve à sala anterior. */
function toggleLabStair(){
if(game.labArena){toggleLab();return;}
if(game.labStair){
game.labStair=null;
texts.push({x:player.x,y:player.y-44,txt:'a escada se fecha',t:0,life:1.2,c:'#9c8f7c',size:11,disp:true});
blip('sine',260,150,.2,.05);
return;
}
const sx=clamp(player.x,ROOM.x+70,ROOM.x+ROOM.w-70);
const sy=clamp(player.y+84,ROOM.y+72,ROOM.y+ROOM.h-72);
game.labStair={x:sx,y:sy,t:0};
game._labStairRoom=game.roomIdx;
game.banner={type:'small',txt:'UMA ESCADA SE ABRE NO CHÃO',sub:'pise nela para descer à sala de testes',t:0,dur:2.4};
blip('sine',330,190,.3,.06);sfx.rumble();
}
function enterLabArena(){
game.labArena=true;
game._labReturn={roomIdx:game.roomIdx};
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain=game.absRects[0];
buildRoomFloor();buildDoors();
game.doors=[];game.portal=null;game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
game.sacrificeAltar=null;game.keeper=null;game.keeperNear=false;game.shopNear=null;
game.roomKind='lab';game.roomQueue=[];game.waveState='done';game.waveT=0;game.spawnT=99;game.roomEvent=null;
enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];texts=[];rings=[];geyserMarks=[];spawnMarks=[];shockwaves=[];
thrownSaw=null;lightBeam=null;hammers=[];telegraphs=[];actMinions=[];
game.labStair=null;game._labStairRoom=null;
game.labExit={x:W/2,y:118,t:0};
player.x=W/2;player.y=H*.78;player.mvx=0;player.mvy=0;player.angle=-Math.PI/2;
clampArena(player,player.r);
game.roomFade=1;
game.banner={type:'circle',txt:'SALA DE TESTES',name:'A GRANDE ARENA',sub:'[0] abre o laboratório · a escada no topo devolve',t:0,dur:3.4};
blip('sine',220,330,.4,.06);sfx.rumble();
toggleLab(); /* o laboratório já abre descida — bosses à vista */
}
function exitLabArena(){
game.labArena=false;
const back=(game._labReturn&&game._labReturn.roomIdx>=0&&game.mapRooms[game._labReturn.roomIdx])?game._labReturn.roomIdx:0;
game._labReturn=null;game.labExit=null;
game.roomFade=1;
enemies=[];ebullets=[];bullets=[];rings=[];shockwaves=[];spawnMarks=[];geyserMarks=[];
game.banner={type:'small',txt:'VOCÊ SOBE A ESCADA',sub:'os laboratórios ficam para trás',t:0,dur:1.8};
enterRoom(back,null);
blip('sine',190,300,.3,.06);
}
function frameLabStair(dt){
try{
if(game.state!=='play')return;
/* a escada aberta pertence à sala onde nasceu — trocou de sala, some */
if(game.labStair&&game._labStairRoom!==game.roomIdx&&!game.labArena){game.labStair=null;}
if(game._labDescend){
game._labDescend.t+=dt;
if(game._labDescend.t>=.55){game._labDescend=null;enterLabArena();}
return;
}
if(game._labExitDescend){
game._labExitDescend.t+=dt;
if(game._labExitDescend.t>=.55){game._labExitDescend=null;exitLabArena();}
return;
}
if(game.labStair&&!player.dead&&game.fallK<0&&dist(player.x,player.y,game.labStair.x,game.labStair.y)<42){
game._labDescend={t:0};
try{sfx.rumble();blip('sine',90,46,1,.1);}catch(e){}
game.banner={type:'small',txt:'DESCENDO',sub:'os degraus descem para a sala de testes',t:0,dur:1.4};
return;
}
if(game.labArena&&game.labExit&&!player.dead&&game.fallK<0&&dist(player.x,player.y,game.labExit.x,game.labExit.y)<46){
if(boss.active||(window.__RM&&window.__RM.c3)||(window.__EXPANSION&&game._cerbFight)){
texts.push({x:player.x,y:player.y-44,txt:'termine a luta antes de subir',t:0,life:1.4,c:'#ffd9a0',size:11,disp:true});
}else{
game._labExitDescend={t:0};
try{sfx.rumble();blip('sine',120,200,.8,.08);}catch(e){}
game.banner={type:'small',txt:'SUBINDO',sub:'a arena fica para trás',t:0,dur:1.4};
}
}
}catch(e){}
}
function drawLabStair(){
try{
if(game.state!=='play')return;
if(game._labDescend||game._labExitDescend)return;
let s=null,label='',c1='#9d6bb5',c2='#c9a0ff';
if(game.labStair){s=game.labStair;label='SALA DE TESTES · DESÇA';}
else if(game.labArena&&game.labExit){s=game.labExit;label='SUBIR · SAIR DA ARENA';c1='#8b8581';c2='#e6dac4';}
if(!s)return;
s.t=(s.t||0)+1/60;
ctx.save();ctx.translate(s.x,s.y);
const w=92,h=56;
ctx.fillStyle='#060304';ctx.fillRect(-w/2,-h/2,w,h);
for(let i=0;i<4;i++){
const dw=w-12-i*15;
ctx.fillStyle='rgba(22,14,26,'+(.6+i*.13)+')';
ctx.fillRect(-dw/2,-h/2+7+i*11,dw,9);
}
ctx.strokeStyle=c1;ctx.lineWidth=2;ctx.strokeRect(-w/2,-h/2,w,h);
const p=.5+.5*Math.sin(game.t*3);
ctx.globalAlpha=.3+.3*p;
ctx.strokeStyle=c2;ctx.lineWidth=1.5;
ctx.strokeRect(-w/2+4,-h/2+4,w-8,h-8);
ctx.globalAlpha=1;
ctx.fillStyle=c2;ctx.font='9px IBM Plex Mono';ctx.textAlign='center';
ctx.fillText(label,0,h/2+13);
ctx.restore();
if(Math.random()<.12)particles.push({x:s.x+rnd(-34,34),y:s.y+rnd(-14,14),vx:rnd(-4,4),vy:rnd(-26,-8),life:rnd(.5,1),t:0,r:rnd(1,2),c:c2,drag:1,glow:true});
}catch(e){}
}
/* ============ sala de testes (PENUMBRA) ============ */
const LAB_ITEMS=[
{id:'mb',n:'O BRUXO'},{id:'ex',n:'O CARRASCO'},{id:'vi',n:'A VIÚVA'},{id:'gz',n:'O GOLEM'},
{id:'rk',n:'O VELHO REI'},{id:'e404',n:'ERRO 404'},{id:'boss',n:'O CÉRBERO'},{id:'cerb_rm',n:'CÉRBERO NOVO',sub:'a sentença final — bullet hell'}, /* v1.4.2: a forma remasterizada, SEPARADA do antigo */
{id:'puzzle',n:'PUZZLE NOVO'},
{id:'cw1',n:'CAVAL. BRANCO'},{id:'cw2',n:'CAVAL. VERMELHO'},{id:'cw3',n:'CAVAL. PRETO'},{id:'cw4',n:'CAVAL. DESCORADO'},
{id:'observer',n:'O OBSERVADOR'},{id:'caronte',n:'CARONTE'}];
function buildLabCards(){
const box=ov('labCards');
if(!box){console.error('buildLabCards: labCards element not found!');return;}
box.innerHTML='';
for(const it of LAB_ITEMS){
const el=document.createElement('div');
el.className='labChip';
el.style.cssText='width:160px;padding:16px 12px;background:rgba(13,9,11,.94);border:1px solid #574f45;cursor:pointer;text-align:center;font-family:IBM Plex Mono,monospace;color:#e6dac4;font-size:13px;font-weight:600;letter-spacing:1px;transition:.16s';
el.innerHTML='<div style="font-family:Pirata One,serif;font-size:18px;color:'+(it.id==='cerb_rm'?'#ff8fa0':'#e6dac4')+';margin-bottom:6px">'+it.n+'</div><div style="font-size:9px;color:#9c8f7c">'+(it.sub||'invoque na sala')+'</div>'; /* v1.4.2: sub próprio + tom carmesim no Cérbero novo */
el.addEventListener('mouseenter',function(){this.style.borderColor='#a52a3a';this.style.transform='translateY(-3px)';blip('sine',500,650,.05,.03);});
el.addEventListener('mouseleave',function(){this.style.borderColor='#574f45';this.style.transform='';});
el.addEventListener('click',function(){audio();devSpawnBoss(it.id);});
box.appendChild(el);
}
console.log('buildLabCards: created',LAB_ITEMS.length,'boss cards');
}
function devSpawnBoss(id){
hideOv('lab');blurActive();
game.state='play';
if(id==='boss'){
/* v1.4.2: mesma blindagem do BOSSES FUTUROS — o antigo NUNCA herda a flag da
   sentença (se um CÉRBERO NOVO lutou antes no lab, matar as 3 cabeças do antigo
   continuaria indo para a sentença em vez do winStart, como sempre foi) */
game._cerbFight=false;
if(window.__RM&&window.__RM.c3){window.__RM.c3=null;game._rmSent=0;
  for(let i=ebullets.length-1;i>=0;i--)if(ebullets[i].rm)ebullets.splice(i,1);}
devGoBoss();return;}
/* v1.4.2: CÉRBERO NOVO — a SENTENÇA FINAL convocada direto na sala de testes,
   separada do antigo (que continua via devGoBoss como sempre) */
if(id==='cerb_rm'){convocaCerbNovo();return;}
enemies=[];ebullets=[];rings=[];geyserMarks=[];spawnMarks=[];shockwaves=[];bullets=[];
thrownSaw=null;lightBeam=null;game.rkP2=false;game.rkUlt=null;game.windowScene=null;
if(id==='puzzle'){
game.puzzle=null;
buildPuzzle();
return;
}
if(id==='rk'){game.reiFought=false;}
/* Cavaleiros do Apocalipse: em vez de spawn direto, dispara a cutscene de intro */
if(id==='cw1'||id==='cw2'||id==='cw3'||id==='cw4'){
startKnightIntro(id);
return;
}
/* v0.9.8: Observador e Caronte como bosses invocáveis na sala de testes */
if(id==='observer'){
startObserverBoss();
return;
}
if(id==='caronte'){
startCaronteBossFight();
return;
}
const m=game.absMain;
spawnMarkAt(id,m.x+m.w/2,m.y+m.h*.32,true);
const it=LAB_ITEMS.find(x=>x.id===id);
game.banner={type:'boss',txt:it?it.n:'',sub:'penumbra — sala de testes',t:0,dur:1.8};
sfx.growl();
}
function toggleLab(){
if(game.state==='labselect'||game.state==='builder'){hideOv('lab');game.state='play';blurActive();return;}
if(!game.dev||game.state!=='play')return;
buildLabCards();buildLabRooms();buildLabBuild();showLabTab('boss');showOv('lab');game.state='labselect';blurActive();
}
/* v1.4.2: convoca a SENTENÇA FINAL (Cérbero novo) nos laboratórios do modo dev —
   mesma coreografia do seletor BOSSES FUTUROS (v1.4.1): a silhueta antiga entra
   VENCIDA, derrete em luz branca e os três pescoços sobem. Se uma sentença
   anterior estiver em andamento, ela é revogada em silêncio (nunca duas juntas). */
function convocaCerbNovo(x,y){
if(typeof x!=='number')x=W/2;
if(typeof y!=='number')y=H*.42;
resetBoss();boss.active=false;
boss.x=x;boss.y=y;boss.angle=Math.PI/2;
if(window.__RM&&window.__RM.c3){window.__RM.c3=null;game._rmSent=0;}
for(let i=ebullets.length-1;i>=0;i--)if(ebullets[i].rm)ebullets.splice(i,1);
if(window.__RM&&window.__RM.startSentenca(x,y)){
/* startSentenca zera os banners — repõe o do laboratório; aos 4,4s o banner da sentença assume */
game.banner={type:'boss',txt:'CÉRBERO NOVO',sub:'a sentença final — a transformação começa',t:0,dur:2.6};
sfx.rumble();
}
}
/* ============ penumbra: abas do laboratório ============ */
function showLabTab(which){
const tabs={boss:'labTabBoss',rooms:'labTabRooms',build:'labTabBuild'};
for(const k in tabs){
const b=document.getElementById(tabs[k]);if(b)b.classList.toggle('sel',k===which);
}
const cards=ov('labCards'),rooms=ov('labRooms'),build=ov('labBuild');
if(cards)cards.style.display=which==='boss'?'':'none';
if(rooms)rooms.style.display=which==='rooms'?'':'none';
if(build)build.style.display=which==='build'?'':'none';
}
/* — cheat de escolha de sala: escolhe o TIPO e a próxima sala nova entra como ele — */
const ROOM_KIND_NAMES={start:'INICIAL',combat:'COMBATE',empty:'VAZIA',treasure:'TESOURO',shop:'LOJA',secret:'SECRETA',challenge:'DESAFIO',miniboss:'MINI-CHEFE',puzzle:'PUZZLE',boss:'CHEFE',sboss:'CHEFE SECRETO',sacrifice:'SACRIFÍCIO'};
const FORCE_ROOMS=[
{id:'combat',n:'INIMIGOS NORMAIS',d:'uma sala de combate comum, cheia de demônios'},
{id:'boss',n:'CHEFE',d:'a sala do guardião do mapa, com portão e intro'},
{id:'secret',n:'SECRETA',d:'sala secreta — almas e talvez um baú'},
{id:'shop',n:'LOJA',d:'o ERRANTE espera com almas por poder'},
{id:'srei',n:'SECRETA: O VELHO REI',d:'a sala secreta do rei — cutscene e tudo'},
{id:'se404',n:'SECRETA: ERRO 404',d:'a sala onde ele te encontra primeiro — cutscene e tudo'}];
function buildLabRooms(){
const box=ov('labRooms');
if(!box)return;
box.innerHTML='';
const hint=document.createElement('p');
hint.className='sub';hint.style.fontSize='10px';hint.style.marginBottom='4px';
hint.textContent='escolha um tipo — a PRÓXIMA sala nova que você entrar pela porta vira essa sala (com cutscene e tudo).';
box.appendChild(hint);
const grid=document.createElement('div');grid.className='labGrid';
for(const f of FORCE_ROOMS){
const b=document.createElement('button');
b.className='labChip'+(game.forceNext===f.id?' sel':'');
b.textContent=f.n;b.title=f.d;
b.addEventListener('click',function(){
game.forceNext=(game.forceNext===f.id)?null:f.id;
buildLabRooms();blip('sine',560,760,.07,.05);
});
grid.appendChild(b);
}
const cancel=document.createElement('button');
cancel.className='labChip act';cancel.textContent='CANCELAR ESCOLHA';
cancel.addEventListener('click',function(){game.forceNext=null;buildLabRooms();blip('square',300,140,.09,.07);});
grid.appendChild(cancel);
box.appendChild(grid);
const st=document.createElement('p');
st.className='sub';st.style.fontSize='9px';
st.textContent=game.forceNext?('armado: '+(FORCE_ROOMS.find(f=>f.id===game.forceNext)||{n:game.forceNext}).n+' — entre em uma porta'):'nada armado no momento.';
box.appendChild(st);
}
/* — montador de salas: coloque demônios, chefes e itens e teste — */
const BUILDER_ENEMIES=[['sh','SOMBRA'],['br','BRUTO'],['sp','CUSPIDOR'],['fs','FORJA VIVA'],['ru','ESFOLIADOR'],['ce','CÃO ESPECTRAL'],['gd','GUARDA NEGRA'],['al','ALMA RASTEJANTE'],['es','ESPECTRO'],['la','LAMENTADORA'],['cr','CARNICEIRO'],['vg','VESPA DO GELO'],['pg','PAINEIRA'],['fa','FANTASMA'],['pn','PEÃO DO REI']];
const BUILDER_BOSSES=[['mb','O BRUXO'],['ex','O CARRASCO'],['vi','A VIÚVA'],['gz','O GOLEM'],['rk','O VELHO REI'],['e404','ERRO 404'],['cerb_rm','CÉRBERO NOVO']]; /* v1.4.2: a sentença final também é montável */
const BUILDER_ITEMS=[['soul','ALMA'],['heart','CORAÇÃO'],['chest','BAÚ']];
function builderLabel(t){
const all=BUILDER_ENEMIES.concat(BUILDER_BOSSES,BUILDER_ITEMS);
const f=all.find(a=>a[0]===t);
return f?f[1]:t.toUpperCase();
}
function buildLabBuild(){
const box=ov('labBuild');
if(!box)return;
box.innerHTML='';
const mkCat=function(title,list){
const h=document.createElement('div');h.className='bkSec';h.textContent=title;box.appendChild(h);
const grid=document.createElement('div');grid.className='labGrid';
for(const it of list){
const b=document.createElement('button');
b.className='labChip'+(game.builder.sel===it[0]?' sel':'');
b.textContent=it[1];
b.addEventListener('click',function(){game.builder.sel=it[0];buildLabBuild();blip('sine',520,680,.06,.04);});
grid.appendChild(b);
}
box.appendChild(grid);
};
mkCat('— DEMÔNIOS —',BUILDER_ENEMIES);
mkCat('— CHEFES —',BUILDER_BOSSES);
mkCat('— ITENS —',BUILDER_ITEMS);
const h2=document.createElement('div');h2.className='bkSec';h2.textContent='— AÇÕES —';box.appendChild(h2);
const acts=document.createElement('div');acts.className='labGrid';
const mkAct=function(label,fn){
const b=document.createElement('button');b.className='labChip act';b.textContent=label;
b.addEventListener('click',fn);acts.appendChild(b);
};
mkAct('MONTAR NA SALA',function(){
hideOv('lab');blurActive();
game.state='builder';game.builderLive=false;
bullets=[];ebullets=[];enemies=[];pickups=[];spawnMarks=[];rings=[];geyserMarks=[];shockwaves=[];
game.banner={type:'small',txt:'MONTADOR DE SALA',sub:'clique para colocar · botão direito remove · ENTER testa',t:0,dur:2.6};
blip('sine',420,620,.1,.05);
});
mkAct('TESTAR AGORA',function(){hideOv('lab');blurActive();game.state='play';builderTest();});
mkAct('LIMPAR TUDO',function(){game.builder.items=[];buildLabBuild();blip('square',300,140,.1,.07);});
box.appendChild(acts);
const note=document.createElement('p');note.className='sub';note.style.fontSize='10px';
note.textContent='o que você monta fica salvo na sala atual para testar de novo.';
box.appendChild(note);
}
function builderClick(x,y,remove){
const bl=game.builder;
if(remove){
let bi=-1,bd=46;
for(let i=0;i<bl.items.length;i++){const d=dist(x,y,bl.items[i].x,bl.items[i].y);if(d<bd){bd=d;bi=i;}}
if(bi>=0){bl.items.splice(bi,1);blip('square',300,140,.08,.07);}
return;
}
if(!inRoomXY(x,y,44)){blip('sawtooth',140,80,.1,.07);return;}
if(bl.items.length>=40){
texts.push({x:x,y:y-20,txt:'SALA CHEIA (40)',t:0,life:.8,c:'#d9465a',size:11,disp:true});
return;
}
bl.items.push({t:bl.sel,x:Math.round(x),y:Math.round(y)});
blip('sine',420,560,.07,.05);
}
function builderTest(){
const bl=game.builder;
if(!bl.items.length){
game.banner={type:'small',txt:'SALA VAZIA',sub:'clique para colocar demônios antes de testar',t:0,dur:2};
return;
}
game.state='play';game.roomFade=1;
bullets=[];ebullets=[];enemies=[];pickups=[];rings=[];geyserMarks=[];shockwaves=[];
spawnMarks=[];thrownSaw=null;lightBeam=null;
game.waveState='done';game.roomQueue=[];game.builderLive=true;
const r=game.mapRooms[game.roomIdx];
if(r){
r.customBuild=bl.items.map(it=>({t:it.t,x:it.x,y:it.y}));
if(!needsClear(r.kind))r.cleared=true;
}
const BIG=['mb','ex','vi','gz','rk','e404','cw1','cw2','cw3','cw4'];
for(const it of bl.items){
if(it.t==='soul'||it.t==='heart'||it.t==='chest')pickups.push({type:it.t,x:it.x,y:it.y,t:0,ph:rnd(TAU)});
else if(it.t==='cerb_rm')convocaCerbNovo(it.x,it.y); /* v1.4.2: o Cérbero novo sobe ONDE FOI COLOCADO */
else spawnMarkAt(it.t,it.x,it.y,BIG.indexOf(it.t)>=0);
}
openDoors();
game.banner={type:'boss',txt:'TESTE DA SALA',sub:bl.items.length+' entidades invocadas — [0] edita de novo',t:0,dur:2.2};
sfx.roar();game.shake=8;
}
function drawBuilderUI(){
if(game.state!=='builder')return;
const bl=game.builder;
ctx.save();
/* grade sutil */
ctx.strokeStyle='rgba(242,240,234,.05)';ctx.lineWidth=1;
for(let gx=ROOM.x+40;gx<ROOM.x+ROOM.w;gx+=56){ctx.beginPath();ctx.moveTo(gx,ROOM.y);ctx.lineTo(gx,ROOM.y+ROOM.h);ctx.stroke();}
for(let gy=ROOM.y+40;gy<ROOM.y+ROOM.h;gy+=56){ctx.beginPath();ctx.moveTo(ROOM.x,gy);ctx.lineTo(ROOM.x+ROOM.w,gy);ctx.stroke();}
/* itens já colocados */
for(const it of bl.items){
const bossy=['mb','ex','vi','gz','rk','e404','cw1','cw2','cw3','cw4','cerb_rm'].indexOf(it.t)>=0; /* v1.4.2: marcador carmesim do Cérbero novo */
const item=it.t==='soul'||it.t==='heart'||it.t==='chest';
ctx.globalAlpha=.85;
if(item){
ctx.fillStyle=it.t==='soul'?'#bfd8e8':it.t==='heart'?'#d9465a':'#c9a44c';
ctx.beginPath();ctx.arc(it.x,it.y,it.t==='chest'?10:7,0,TAU);ctx.fill();
}else{
ctx.strokeStyle=bossy?'#e8455a':'#e6dac4';
ctx.lineWidth=bossy?2.5:1.5;
ctx.beginPath();ctx.arc(it.x,it.y,bossy?16:10,0,TAU);ctx.stroke();
ctx.beginPath();ctx.arc(it.x,it.y,2,0,TAU);ctx.stroke();
}
ctx.globalAlpha=1;
}
/* fantasma do cursor */
if(mouse.inCanvas&&inRoomXY(mouse.x,mouse.y,44)){
ctx.globalAlpha=.5;
ctx.strokeStyle='#ffd9a0';ctx.setLineDash([6,5]);ctx.lineWidth=1.5;
ctx.beginPath();ctx.arc(mouse.x,mouse.y,12,0,TAU);ctx.stroke();
ctx.setLineDash([]);ctx.globalAlpha=1;
}
/* painel inferior */
const PW=560,PH=54,PX=W/2-PW/2,PY=H-PH-14;
ctx.fillStyle='rgba(6,4,5,.82)';
ctx.fillRect(PX,PY,PW,PH);
ctx.strokeStyle='rgba(242,240,234,.2)';ctx.strokeRect(PX,PY,PW,PH);
txt('MONTADOR — SELECIONADO: '+builderLabel(bl.sel),W/2,PY-8,MONO,10,'#ffd9a0','center',3);
txt('CLIQUE: COLOCAR · DIREITO: REMOVER · ENTER: TESTAR · X: LIMPAR · [0]: VOLTAR',W/2,PY+PH+11,MONO,8,'#9c8f7c','center',2);
txt(bl.items.length+' / 40 ENTIDADES',PX+10,PY+18,MONO,9,'#e6dac4','left',1);
txt('SALA '+(game.roomIdx+1)+' · SALVO NESTA SALA',PX+PW-10,PY+18,MONO,8,'#6e6357','right',1);
ctx.restore();
}
/* ============ partículas & textos ============ */
function sparks(x,y,c,n,sp,life,r,glow){
for(let i=0;i<n;i++){
const a=rnd(TAU),v=rnd(.25,1)*(sp||180);
particles.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:(life||.5)*rnd(.6,1.2),t:0,r:(r||3)*rnd(.6,1.4),c:c,drag:3,glow:glow||false});
}
}
function updateParticles(dt){
for(let i=particles.length-1;i>=0;i--){
const p=particles[i];p.t+=dt;
if(p.t>=p.life){particles.splice(i,1);continue;}
p.x+=p.vx*dt;p.y+=p.vy*dt;
if(p.drag){const k=Math.max(0,1-p.drag*dt);p.vx*=k;p.vy*=k;}
}
if(particles.length>600)particles.splice(0,particles.length-600);
}
function updateTexts(dt){
for(let i=texts.length-1;i>=0;i--){
const t=texts[i];t.t+=dt;
if(t.dmg){
t.x+=(t.vx||0)*dt;t.vy=(t.vy||0)+360*dt;t.y+=t.vy*dt;
t.rot=(t.rot||0)+(t.rotV||0)*dt;
}else t.y-=34*dt;
if(t.t>=t.life)texts.splice(i,1);
}
}
function ageList(list,dt){
for(let i=list.length-1;i>=0;i--){
list[i].t+=dt;
if(list[i].t>list[i].life)list.splice(i,1);
}
}
function decayScreenFx(dt){
game.shake=Math.max(0,game.shake-dt*38);
game.flash=Math.max(0,game.flash-dt*2.4);
game.hurtV=Math.max(0,game.hurtV-dt*1.6);
heartsPopT=Math.max(0,heartsPopT-dt);
}
function updateFX(dt){
updateParticles(dt);updateTexts(dt);
ageList(biteFxs,dt);ageList(swordFxs,dt);ageList(novaFxs,dt);ageList(stakeFxs,dt);
ageList(bolts,dt);ageList(arcs,dt);
if(game.banner){game.banner.t+=dt;if(game.banner.t>game.banner.dur)game.banner=null;}
if(game.headBanner){game.headBanner.t+=dt;if(game.headBanner.t>1.9)game.headBanner=null;}
decayScreenFx(dt);
if(game.portal)game.portal.t+=dt;
game.roomFade=Math.max(0,game.roomFade-dt*1.5);
/* v0.9.7: decrementa o timer do glitch do Observador */
if(game.glitchT>0)game.glitchT=Math.max(0,game.glitchT-dt);
for(const a of ambient){a.y+=a.vy*dt;if(a.y<-12){a.y=H+12;a.x=rnd(W);}}
/* v1.9.1 DESEMPENHO: metaTick SAIU daqui — rodava ~60x/s (loop de relíquias
   + conquistas por frame). O timer de 2s do laço principal cobre tudo. */
}
/* ============ IA do Cérbero ============ */
const TELE_DUR={fan:.75,spiral:.9,charge:.85,howl:.7,geyser:.6,summon:.65,pulse:.7,meteor:.8,curtain:.8,blink:.6,mines:.7,souls:.7,wall:.85,cross:.9,ring:.7,pounce:.55,wave:.8,orbit:.9,snipe:.7,volley:.85,crosshair:.75,nova:.7,whirl:.9,beam:.95,fountain:.7,chain:.75,aura:.9,rain:.8};
/* ============ ASSINATURA VISUAL DE CADA ATAQUE ============
   Cada padrão tem uma assinatura sutil e única (cor + forma) exibida
   durante o estado 'tele' (antes do golpe). Nem tão óbvia quanto um
   marcador de chão vermelho — mas perceptível a quem observa.
   style: 'ring' | 'square' | 'triangle' | 'cross' | 'spikes' | 'pulse' | 'arc' | 'arrow' | 'beam' | 'drop' */
const ATTACK_SIG={
/* Cérbero — IGNIS (fogo) */
fan:{c:'#ff8f3d',style:'spikes',n:8},
spiral:{c:'#ff8f3d',style:'arc'},
pulse:{c:'#ffd9a0',style:'ring'},
meteor:{c:'#ff8f3d',style:'drop'},
wave:{c:'#ff8f3d',style:'arc'},
pounce:{c:'#ff8f3d',style:'arrow'},
volley:{c:'#ff8f3d',style:'cross'},
crosshair:{c:'#ffd9a0',style:'cross'},
nova:{c:'#ff8f3d',style:'pulse'},
wall:{c:'#ff8f3d',style:'arrow'},
/* Cérbero — UMBRA (sombra) */
charge:{c:'#e8455a',style:'arrow'},
howl:{c:'#e8455a',style:'pulse'},
curtain:{c:'#e8455a',style:'arc'},
blink:{c:'#31242e',style:'square'},
orbit:{c:'#e8455a',style:'spikes',n:6},
whirl:{c:'#e8455a',style:'spikes',n:5},
beam:{c:'#e8455a',style:'beam'},
fountain:{c:'#e8455a',style:'spikes',n:4},
cross:{c:'#e8455a',style:'cross'},
/* Cérbero — MORTEM (morte) */
geyser:{c:'#a8c24f',style:'drop'},
summon:{c:'#a8c24f',style:'spikes',n:5},
mines:{c:'#a8c24f',style:'ring'},
souls:{c:'#a8c24f',style:'spikes',n:6},
snipe:{c:'#a8c24f',style:'arrow'},
ring:{c:'#a8c24f',style:'pulse'},
chain:{c:'#a8c24f',style:'spikes',n:5},
aura:{c:'#a8c24f',style:'ring'},
rain:{c:'#a8c24f',style:'drop'},
/* O Bruxo da Penumbra (mb) */
spiral:{c:'#cfd8dc',style:'arc'},
cross:{c:'#cfd8dc',style:'cross'},
crown:{c:'#cfd8dc',style:'spikes',n:5},
souls_mb:{c:'#e6f0f2',style:'spikes',n:5},
blink_mb:{c:'#31242e',style:'square'},
frost:{c:'#9fd8ff',style:'pulse'},
wall_mb:{c:'#cfd8dc',style:'arrow'},
meteor_mb:{c:'#cfd8dc',style:'drop'},
shotgun:{c:'#cfd8dc',style:'arrow'},
rings:{c:'#cfd8dc',style:'ring'},
bothwalls:{c:'#cfd8dc',style:'cross'},
twin:{c:'#cfd8dc',style:'arc'},
bounce:{c:'#cfd8dc',style:'spikes',n:6},
flower:{c:'#cfd8dc',style:'spikes',n:7},
snipe_mb:{c:'#cfd8dc',style:'arrow'},
swarm:{c:'#e6f0f2',style:'spikes',n:5},
/* O Carrasco (ex) */
axe:{c:'#e8455a',style:'cross'},
spin:{c:'#cfd8dc',style:'arc'},
quake:{c:'#e8455a',style:'drop'},
mines_ex:{c:'#e8455a',style:'ring'},
charge_ex:{c:'#e8455a',style:'arrow'},
summon_ex:{c:'#e8455a',style:'spikes',n:3},
/* A Viúva (vi) */
webspray:{c:'#9d6bb5',style:'spikes',n:5},
summon_vi:{c:'#9d6bb5',style:'spikes',n:4},
dash:{c:'#9d6bb5',style:'arrow'},
ring_vi:{c:'#9d6bb5',style:'pulse'},
snare:{c:'#9d6bb5',style:'ring'},
/* O Golem (gz) */
beam_gz:{c:'#ff8f3d',style:'beam'},
slam:{c:'#ff8f3d',style:'pulse'},
rocks:{c:'#ff8f3d',style:'drop'},
charge_gz:{c:'#ff8f3d',style:'arrow'},
orbit_gz:{c:'#ff8f3d',style:'spikes',n:6},
/* Velho Rei (rk/rkm) */
peoes:{c:'#ffd9a0',style:'spikes',n:5},
torre:{c:'#ffd9a0',style:'cross'},
bispo:{c:'#ffd9a0',style:'spikes',n:4},
cavalo:{c:'#ffd9a0',style:'arrow'},
cavalaria:{c:'#ffd9a0',style:'arrow'},
rainha:{c:'#ffd9a0',style:'arc'},
xeque:{c:'#ffd9a0',style:'square'},
grade:{c:'#ffd9a0',style:'square'},
damas:{c:'#ffd9a0',style:'spikes',n:6},
roque:{c:'#ffd9a0',style:'arrow'},
coroacao:{c:'#ffd9a0',style:'drop'},
/* ERRO 404 */
espiral:{c:'#4ff5ff',style:'arc'},
muros:{c:'#4ff5ff',style:'arrow'},
cruz_e404:{c:'#4ff5ff',style:'cross'},
flor:{c:'#4ff5ff',style:'spikes',n:6},
sniper:{c:'#ff4fd8',style:'arrow'},
almas:{c:'#e6f0f2',style:'spikes',n:5},
minas_e404:{c:'#ff4fd8',style:'ring'},
meteoro:{c:'#ff4fd8',style:'drop'},
blink_e404:{c:'#4ff5ff',style:'square'},
investida:{c:'#ff4fd8',style:'arrow'},
aneis:{c:'#ff4fd8',style:'pulse'},
orbita:{c:'#4ff5ff',style:'spikes',n:6},
cortina:{c:'#4ff5ff',style:'arc'},
clones:{c:'#4ff5ff',style:'spikes',n:5},
glitch:{c:'#4ff5ff',style:'square'}
};
/* desenha a assinatura visual ao redor de um chefe durante o 'tele'.
   x,y=posição do chefe; r=raio base; pat=nome do padrão; t=progresso 0..1;
   extra=cor alternativa opcional (usada pelas sombras do rei, que mentem a cor). */
function drawAttackSig(x,y,r,pat,t,altColor){
const sig=ATTACK_SIG[pat];if(!sig)return;
const c=altColor||sig.c;
const pulse=.5+.5*Math.sin(game.t*16);
const grow=r*(1.15+t*.4);
ctx.save();
ctx.globalAlpha=.4+.35*t;
ctx.strokeStyle=c;ctx.lineWidth=2.5;
ctx.fillStyle=hexA(c,.18);
switch(sig.style){
case 'ring':
ctx.beginPath();ctx.arc(x,y,grow,0,TAU);ctx.stroke();
ctx.beginPath();ctx.arc(x,y,grow-6,0,TAU);ctx.stroke();
break;
case 'square':
ctx.save();ctx.translate(x,y);ctx.rotate(game.t*1.4);
ctx.strokeRect(-grow,-grow,grow*2,grow*2);
ctx.fillRect(-grow,-grow,grow*2,grow*2);
ctx.restore();
break;
case 'triangle':
ctx.save();ctx.translate(x,y);ctx.rotate(game.t*1.2);
ctx.beginPath();ctx.moveTo(0,-grow);ctx.lineTo(grow*.87,grow*.5);ctx.lineTo(-grow*.87,grow*.5);ctx.closePath();ctx.stroke();ctx.fill();
ctx.restore();
break;
case 'cross':
ctx.save();ctx.translate(x,y);ctx.rotate(game.t*1.6);
ctx.beginPath();
ctx.moveTo(-grow,0);ctx.lineTo(grow,0);
ctx.moveTo(0,-grow);ctx.lineTo(0,grow);
ctx.stroke();
ctx.beginPath();ctx.arc(0,0,grow*.4,0,TAU);ctx.stroke();
ctx.restore();
break;
case 'spikes':{
const n=sig.n||5;
ctx.save();ctx.translate(x,y);ctx.rotate(game.t*1.8);
for(let k=0;k<n;k++){
const a=k/n*TAU;
ctx.beginPath();
ctx.moveTo(Math.cos(a)*(grow-4),Math.sin(a)*(grow-4));
ctx.lineTo(Math.cos(a)*(grow+12),Math.sin(a)*(grow+12));
ctx.stroke();
}
ctx.beginPath();ctx.arc(0,0,grow-2,0,TAU);ctx.stroke();
ctx.restore();
break;
}
case 'pulse':
ctx.beginPath();ctx.arc(x,y,grow,0,TAU);ctx.fill();ctx.stroke();
ctx.globalAlpha=.25+.25*pulse;
ctx.beginPath();ctx.arc(x,y,grow+10*pulse,0,TAU);ctx.stroke();
break;
case 'arc':
ctx.save();ctx.translate(x,y);
ctx.beginPath();ctx.arc(0,0,grow,game.t*2,game.t*2+Math.PI*.75);ctx.stroke();
ctx.beginPath();ctx.arc(0,0,grow,game.t*2+Math.PI,game.t*2+Math.PI+Math.PI*.75);ctx.stroke();
ctx.restore();
break;
case 'arrow':{
const a=Math.atan2(player.y-y,player.x-x);
ctx.save();ctx.translate(x,y);ctx.rotate(a);
ctx.beginPath();
ctx.moveTo(grow,0);ctx.lineTo(grow+18,-7);ctx.lineTo(grow+12,0);ctx.lineTo(grow+18,7);ctx.closePath();
ctx.stroke();ctx.fill();
ctx.restore();
break;
}
case 'beam':{
const a=Math.atan2(player.y-y,player.x-x);
ctx.save();ctx.setLineDash([8,12]);
ctx.strokeStyle=c;ctx.lineWidth=3;
ctx.beginPath();ctx.moveTo(x,y);
ctx.lineTo(x+Math.cos(a)*900,y+Math.sin(a)*900);ctx.stroke();
ctx.setLineDash([]);ctx.restore();
break;
}
case 'drop':{
ctx.save();
for(let k=0;k<5;k++){
const a=k/5*TAU+game.t;
const dx=Math.cos(a)*grow,dy=Math.sin(a)*grow;
ctx.beginPath();ctx.arc(x+dx,y+dy,4+2*pulse,0,TAU);ctx.stroke();
}
ctx.restore();
break;
}
}
ctx.restore();
}
/* mapeia padrões de chefes não-Cérbero para a chave em ATTACK_SIG (alguns nomes colidem) */
function sigKeyFor(e){
if(e.type==='mb'){
if(e.pat==='souls')return'souls_mb';
if(e.pat==='blink')return'blink_mb';
if(e.pat==='wall')return'wall_mb';
if(e.pat==='meteor')return'meteor_mb';
if(e.pat==='snipe')return'snipe_mb';
return e.pat;
}
if(e.type==='ex'){
if(e.pat==='mines')return'mines_ex';
if(e.pat==='charge')return'charge_ex';
if(e.pat==='summon')return'summon_ex';
return e.pat;
}
if(e.type==='vi'){
if(e.pat==='summon')return'summon_vi';
if(e.pat==='ring')return'ring_vi';
return e.pat;
}
if(e.type==='gz'){
if(e.pat==='beam')return'beam_gz';
if(e.pat==='charge')return'charge_gz';
if(e.pat==='orbit')return'orbit_gz';
return e.pat;
}
if(e.type==='e404'){
if(e.pat==='cruz')return'cruz_e404';
if(e.pat==='minas')return'minas_e404';
if(e.pat==='blink')return'blink_e404';
return e.pat;
}
return e.pat;
}
function killHead(h){
h.alive=false;h.hp=0;h.state='dead';h.deadT=0;h.mouth=.45;
game.hitstop=.2;game.shake=26;game.flash=.55;
sfx.headDie();
sparks(h.hx,h.hy,h.c,26,320,.9,4,true);
sparks(h.hx,h.hy,'#8b8581',14,240,.8,3.5);
game.headBanner={txt:h.name+' TOMBOU',c:h.c,t:0};
const alive=boss.heads.filter(x=>x.alive).length;
/* se a cabeça que caiu era a ativa, passa a vez para a próxima viva */
if(!boss.heads[boss.activeHeadIdx]||!boss.heads[boss.activeHeadIdx].alive){
advanceActiveHead();
}
if(alive===2&&!boss.phase2){
boss.phase2=true;
boss.frenzyCd=2.5;
game.banner={type:'boss',txt:'FASE II — FÚRIA DO GUARDIÃO',sub:'as cabeças restantes despertam — turnos rotativos',t:0,dur:2.6};
sfx.roar();sfx.howl();
game.flash=.4;game.shake=18;
for(const hd of boss.heads)if(hd.alive)hd.cd=Math.min(hd.cd,1.2);
}
if(alive===0&&!(window.__RM&&window.__RM.cerbDown&&window.__RM.cerbDown()))winStart(); /* v1.4.0: a SENTENÇA FINAL assume */
}
function headAI(h,dt,phase){
h.t+=dt;
if(h.state==='idle'){
if(!h.desp&&h.hp<h.maxHp*.25){
h.desp=true;h.state='desp';h.t=0;h.pattern='desp';
despStart(h);
game.banner={type:'small',txt:'GOLPE FINAL — '+h.name,sub:'',t:0,dur:2};
sfx.roar();game.flash=.3;game.shake=14;
return;
}
const a=boss.angle+h.baseAng+Math.sin(game.t*1.2+h.ph)*.2;
h.tx=boss.x+Math.cos(a)*175;h.ty=boss.y+Math.sin(a)*175;
h.mouth=Math.max(.05,h.mouth-dt*3);
/* ALTERNÂNCIA: apenas a cabeça ativa decrementa cooldown.
As outras ficam em idle, expectantes — turnos rotativos. */
const isActiveHead=boss.heads[boss.activeHeadIdx]===h;
if(!isActiveHead){
h.cd=Math.max(h.cd,.6);
return;
}
const p2=boss.phase2?.75:1;
const cdMul=phase===3?(game.hard?.7:.85):phase===2?(game.hard?.5:.6)*p2:(game.hard?.34:.42)*p2;
h.cd-=dt*cdMul;
if(h.cd<=0){
h.patIdx=(h.patIdx+1)%h.pats.length;
h.pattern=h.pats[h.patIdx];
h.state='tele';h.t=0;sfx.growl();
}
}else if(h.state==='tele'){
const dur=TELE_DUR[h.pattern]||.7;
if(h.pattern==='fan'||h.pattern==='spiral'||h.pattern==='volley'||h.pattern==='crosshair'||h.pattern==='nova'){
const a=Math.atan2(h.hy-boss.y,h.hx-boss.x);
h.tx=boss.x+Math.cos(a)*88;h.ty=boss.y+Math.sin(a)*88;
h.mouth=Math.min(1,h.mouth+dt*2.6);
if(Math.random()<dt*26)particles.push({x:h.hx+rnd(-30,30),y:h.hy+rnd(-30,30),vx:0,vy:0,life:.25,t:0,r:2,c:h.c,glow:true});
}else if(h.pattern==='charge'){
if(h.t<dur-.25)boss.chargeAim=Math.atan2(player.y-boss.y,player.x-boss.x);
h.tx=boss.x+Math.cos(boss.chargeAim)*(boss.r+70);
h.ty=boss.y+Math.sin(boss.chargeAim)*(boss.r+70);
h.mouth=Math.min(1,h.mouth+dt*3);
}else if(h.pattern==='blink'||h.pattern==='fountain'){
h.tx=boss.x+Math.cos(boss.angle+h.baseAng)*150;
h.ty=boss.y+Math.sin(boss.angle+h.baseAng)*150;
h.mouth=Math.min(1,h.mouth+dt*2);
if(Math.random()<dt*30)particles.push({x:boss.x+rnd(-60,60),y:boss.y+rnd(-60,60),vx:0,vy:rnd(-40,-10),life:.4,t:0,r:rnd(3,6),c:'#31242e',drag:1});
}else if(h.pattern==='pounce'){
const a2=boss.angle+h.baseAng;
h.tx=boss.x+Math.cos(a2)*boss.r*.6;h.ty=boss.y+Math.sin(a2)*boss.r*.6;
h.mouth=Math.min(1,h.mouth+dt*3);
if(Math.random()<dt*20)particles.push({x:h.hx+rnd(-20,20),y:h.hy+rnd(-20,20),vx:0,vy:0,life:.2,t:0,r:2,c:h.c,glow:true});
}else{
h.tx=boss.x+Math.cos(boss.angle+h.baseAng)*125;
h.ty=boss.y+Math.sin(boss.angle+h.baseAng)*125;
h.mouth=Math.min(1,h.mouth+dt*2);
}
if(h.t>=dur){h.state='act';h.t=0;actStart(h,phase);}
}else if(h.state==='act'){
actUpdate(h,dt,phase);
}else if(h.state==='desp'){
despUpdate(h,dt);
}else if(h.state==='recover'){
const a=boss.angle+h.baseAng;
h.tx=boss.x+Math.cos(a)*150;h.ty=boss.y+Math.sin(a)*150;
h.mouth=Math.max(.05,h.mouth-dt*2);
if(h.t>=h.recDur){
h.state='idle';h.t=0;h.cd=h.baseCd*rnd(.85,1.25)*(boss.phase2?.6:1);h.pattern=null;
/* ALTERNÂNCIA: ao terminar um padrão, passa a vez para a próxima cabeça viva */
advanceActiveHead();
}
}
}
function advanceActiveHead(){
const alive=boss.heads.filter(function(x){return x.alive;});
if(alive.length<=1)return;
let idx=-1;
for(let i=1;i<=boss.heads.length;i++){
const k=(boss.activeHeadIdx+i)%boss.heads.length;
if(boss.heads[k].alive){idx=k;break;}
}
if(idx>=0){
boss.activeHeadIdx=idx;
boss.headTurn++;
/* visual: pulso breve na cabeça que ficou ativa */
const h=boss.heads[idx];
if(h){sparks(h.hx,h.hy,h.c,8,180,.4,3,true);}
}
}
function actStart(h,phase){
const rage=phase===1;
if(h.pattern==='fan'){h.data={bursts:0,burstT:0,n:(rage?7:5)+(game.hard?3:0)};h.recDur=game.hard?.45:.6;}
else if(h.pattern==='spiral'){h.data={spin:Math.atan2(player.y-h.hy,player.x-h.hx),tick:0};h.actDur=(rage?2.8:2.4)+(game.hard?.5:0);h.recDur=.7;}
else if(h.pattern==='pulse'){h.data={ringT:0,rings:0};h.recDur=.7;}
else if(h.pattern==='meteor'){h.data={markT:0};h.actDur=game.hard?3.1:2.6;h.recDur=.7;}
else if(h.pattern==='curtain'){h.data={tick:0};h.actDur=game.hard?3:2.5;h.recDur=.7;}
else if(h.pattern==='blink'){h.data={phase:'fade',fired:false};h.actDur=1.6;h.recDur=.8;}
else if(h.pattern==='mines'){
for(let i=0;i<(game.hard?10:6);i++){
const a=rnd(TAU),d=rnd(140,320);
ebullets.push({x:clamp(boss.x+Math.cos(a)*d,60,W-60),y:clamp(boss.y+Math.sin(a)*d,60,H-60),vx:0,vy:0,r:9,c:'#a8c24f',mine:true,armT:.6,life:game.hard?7:5});
}
for(let i=0;i<(game.hard?6:4);i++){
const a=rnd(TAU),d=rnd(90,240);
ebullets.push({x:clamp(player.x+Math.cos(a)*d,60,W-60),y:clamp(player.y+Math.sin(a)*d,60,H-60),vx:0,vy:0,r:9,c:'#a8c24f',mine:true,armT:.6,life:game.hard?7:5});
}
sfx.growl();h.recDur=.7;
}
else if(h.pattern==='souls'){
const base=Math.atan2(player.y-h.hy,player.x-h.hx);
const n=(rage?8:6)+(game.hard?4:0);
for(let i=0;i<n;i++){
const a=base+(i-n/2)*.2;
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a)*165,vy:Math.sin(a)*165,r:6,c:'#a8c24f',home:1.9,homeT:game.hard?4:3.2});
}
sfx.howl();h.recDur=.7;
}
else if(h.pattern==='charge'){
boss.dashing=true;boss.dashT=.5;boss.dashAng=boss.chargeAim;
const v=(rage?1050:900)+(game.hard?120:0);
boss.dashVx=Math.cos(boss.dashAng)*v;boss.dashVy=Math.sin(boss.dashAng)*v;
sfx.dash();sfx.roar();game.shake=10;h.recDur=1;
}
else if(h.pattern==='howl'){
if(dmk()){
/* v1.5.0: o uivo expulsa coroas completas em camadas */
dmkCircle(boss.x,boss.y,Math.round((rage?26:20)*dmkDen()),(rage?360:320)*dmkSp(),{c:'#e8455a'});
dmkCircle(boss.x,boss.y,Math.round(14*dmkDen()),260*dmkSp(),{c:'#e8455a',alt:.7,quiet:true});
}else{
rings.push({x:boss.x,y:boss.y,r:boss.r*.8,vr:rage?460:400,th:15,gapA:rnd(TAU),gapW:1.3,c:'#e8455a'});
if(game.hard)rings.push({x:boss.x,y:boss.y,r:boss.r*.5,vr:340,th:13,gapA:rnd(TAU),gapW:1.1,c:'#e8455a'});
}
sfx.howl();game.shake=8;h.actDur=.35;h.recDur=.5;
}
else if(h.pattern==='geyser'){h.data={salvo:0,salvoT:0};h.actDur=game.hard?3.4:2.9;h.recDur=.6;}
else if(h.pattern==='summon'){
const n=(rage?4:3)+(game.hard?2:0);
for(let i=0;i<n;i++){
const a=rnd(TAU),d=rnd(120,190);
spawnMarks.push({x:clamp(boss.x+Math.cos(a)*d,70,W-70),y:clamp(boss.y+Math.sin(a)*d,70,H-70),type:'puppy',t:0,dur:.75});
}
sfx.roar();h.actDur=.5;h.recDur=.4;
}
else if(h.pattern==='wall'){h.data={walls:0,t:0};h.actDur=2.6;h.recDur=.8;}
else if(h.pattern==='cross'){h.data={rot:Math.atan2(player.y-boss.y,player.x-boss.x),tick:0};h.actDur=2.6;h.recDur=.8;}
else if(h.pattern==='ring'){h.data={rings:0,ringT:0,gap:rnd(TAU),soulsT:0};h.actDur=2.4;h.recDur=.8;}
else if(h.pattern==='pounce'){
const a=Math.atan2(player.y-h.hy,player.x-h.hx);
h.data={tx:clamp(player.x+Math.cos(a)*46,60,W-60),ty:clamp(player.y+Math.sin(a)*46,60,H-60)};
h.actDur=game.hard?.5:.55;h.recDur=.85;
sfx.dash();sfx.growl();game.shake=Math.max(game.shake,6);
}
else if(h.pattern==='wave'){h.data={base:Math.atan2(player.y-h.hy,player.x-h.hx),tick:0};h.actDur=game.hard?2.8:2.3;h.recDur=.7;}
else if(h.pattern==='orbit'){
const n=game.hard?12:9;
for(let i=0;i<n;i++)
ebullets.push({orbit:true,cx:boss.x,cy:boss.y,ang:i/n*TAU,orbR0:70,orbSpd:game.hard?2.6:2.1,orbT:0,orbDur:1.25,speed:game.hard?300:250,r:6,c:'#e8455a'});
sfx.howl();h.actDur=.6;h.recDur=.7;
}
else if(h.pattern==='snipe'){h.data={shots:0,t:0};h.actDur=1;h.recDur=.8;}
/* NOVOS PADRÕES — IGNIS (fogo) */
else if(h.pattern==='volley'){h.data={volleys:0,t:.1};h.actDur=game.hard?2.6:2.2;h.recDur=.7;}
else if(h.pattern==='crosshair'){h.data={ang:Math.atan2(player.y-h.hy,player.x-h.hx),perp:0,tick:0,salvo:0};h.actDur=game.hard?2.4:2;h.recDur=.75;}
else if(h.pattern==='nova'){h.data={rings:0,ringT:.1};h.actDur=game.hard?1.6:1.3;h.recDur=.7;}
/* NOVOS PADRÕES — UMBRA (sombra) */
else if(h.pattern==='whirl'){h.data={spin:rnd(TAU),tick:0,arms:game.hard?5:4};h.actDur=game.hard?3:2.6;h.recDur=.75;}
else if(h.pattern==='beam'){h.data={ang:Math.atan2(player.y-h.hy,player.x-h.hx),t:0,warm:.7,dur:game.hard?2.2:1.8};h.actDur=h.data.dur;h.recDur=.8;}
else if(h.pattern==='fountain'){h.data={fired:false};h.actDur=1.4;h.recDur=.75;}
/* NOVOS PADRÕES — MORTEM (morte) */
else if(h.pattern==='chain'){h.data={shots:0,t:.1,targets:[]};h.actDur=game.hard?2:1.6;h.recDur=.75;}
else if(h.pattern==='aura'){h.data={spin:0,t:0};h.actDur=game.hard?3:2.5;h.recDur=.8;}
else if(h.pattern==='rain'){h.data={markT:0,salvos:0};h.actDur=game.hard?3:2.5;h.recDur=.7;}
}
function bossWall(dir){
const gapA=irnd(2,10),gapB=irnd(2,10);
for(let i=0;i<14;i++){
if(i===gapA||i===gapA+1||i===gapB||i===gapB+1)continue;
const y=60+i*(H-120)/13;
ebullets.push({x:dir>0?-30:W+30,y:y,vx:dir*260,vy:0,r:6,c:'#ff8f3d'});
}
sfx.spit();sfx.growl();
}
function actUpdate(h,dt,phase){
const rage=phase===1;
if(h.pattern==='fan'){
h.data.burstT-=dt;
const total=(rage?4:3)+(game.hard?1:0);
if(h.data.burstT<=0&&h.data.bursts<total){
h.data.bursts++;h.data.burstT=game.hard?.34:.42;
const base=Math.atan2(player.y-h.hy,player.x-h.hx);
const n=h.data.n;
const mx=h.hx+Math.cos(h.face)*30,my=h.hy+Math.sin(h.face)*30;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.15,v=rage?320:275;
ebullets.push({x:mx,y:my,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:7,c:'#ff8f3d'});
}
h.vx-=Math.cos(h.face)*150;h.vy-=Math.sin(h.face)*150;
sfx.spit();sparks(mx,my,'#ff8f3d',5,160,.35,3,true);
}
if(h.data.bursts>=total&&h.data.burstT<-.2){h.state='recover';h.t=0;}
}else if(h.pattern==='spiral'){
h.data.tick-=dt;
const rate=(rage?.08:.095)*(game.hard?.8:1),vel=rage?195:185;
if(h.data.tick<=0){
h.data.tick=rate;h.data.spin+=.34;
const mx=h.hx+Math.cos(h.face)*30,my=h.hy+Math.sin(h.face)*30;
for(let k=0;k<(game.hard?3:2);k++){
const a=h.data.spin+k*Math.PI;
ebullets.push({x:mx,y:my,vx:Math.cos(a)*vel,vy:Math.sin(a)*vel,r:6,c:'#ff8f3d'});
}
if(Math.random()<.5)sfx.spit();
}
const oa=game.t*.8+h.ph;
h.tx=boss.x+Math.cos(oa)*120;h.ty=boss.y+Math.sin(oa)*120;
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='pulse'){
h.data.ringT-=dt;
const maxR=game.hard?5:3;
if(h.data.ringT<=0&&h.data.rings<maxR){
h.data.rings++;h.data.ringT=game.hard?.45:.55;
if(dmk()){
dmkCircle(boss.x,boss.y,Math.round(16*dmkDen()),290*dmkSp(),{c:'#ff8f3d'});
}else{
rings.push({x:boss.x,y:boss.y,r:boss.r*.7,vr:330,th:14,gapA:rnd(TAU),gapW:1.25,c:'#ff8f3d'});
}
sfx.howl();game.shake=Math.max(game.shake,6);
h.mouth=1;
}
h.mouth=Math.max(.2,h.mouth-dt*1.5);
if(h.data.rings>=maxR&&h.data.ringT<-.2){h.state='recover';h.t=0;}
}else if(h.pattern==='meteor'){
h.data.markT-=dt;
if(h.data.markT<=0){
h.data.markT=game.hard?.26:.35;
geyserMarks.push({x:player.x,y:player.y,t:0,dur:game.hard?.6:.8,phase:'mark',c:'#ff8f3d'});
geyserMarks.push({x:clamp(player.x+rnd(-180,180),60,W-60),y:clamp(player.y+rnd(-140,140),60,H-60),t:0,dur:game.hard?.7:.95,phase:'mark',c:'#ff8f3d'});
if(game.hard)geyserMarks.push({x:clamp(player.x+rnd(-260,260),60,W-60),y:clamp(player.y+rnd(-200,200),60,H-60),t:0,dur:.8,phase:'mark',c:'#ff8f3d'});
}
h.mouth=.8;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='curtain'){
h.data.tick-=dt;
const arms=game.hard?6:4;
if(h.data.tick<=0){
h.data.tick=game.hard?.11:.12;
const base=game.t*1.6+h.ph;
for(let b=0;b<arms;b++){
const a=base+b*Math.PI*2/arms;
ebullets.push({x:boss.x,y:boss.y,vx:Math.cos(a)*210,vy:Math.sin(a)*210,r:6,c:'#e8455a'});
}
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='blink'){
if(h.data.phase==='fade'){
if(Math.random()<dt*30)particles.push({x:boss.x+rnd(-70,70),y:boss.y+rnd(-70,70),vx:rnd(-20,20),vy:rnd(-50,-10),life:.5,t:0,r:rnd(3,7),c:'#31242e',drag:1});
if(h.t>=.5){
sparks(boss.x,boss.y,'#31242e',18,220,.6,5);
const ta=rnd(TAU);
boss.x=clamp(player.x+Math.cos(ta)*260,120,W-120);
boss.y=clamp(player.y+Math.sin(ta)*260,120,H-120);
sparks(boss.x,boss.y,'#e8455a',18,260,.6,4,true);
sfx.explode();game.shake=12;
h.data.phase='burst';
}
}else if(!h.data.fired){
h.data.fired=true;
const base=Math.atan2(player.y-boss.y,player.x-boss.x);
const n=game.hard?11:7;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.14;
ebullets.push({x:boss.x,y:boss.y,vx:Math.cos(a)*300,vy:Math.sin(a)*300,r:6,c:'#e8455a'});
}
sfx.spit();sfx.roar();
}
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='charge'){
h.tx=boss.x+Math.cos(boss.dashAng)*(boss.r+90);
h.ty=boss.y+Math.sin(boss.dashAng)*(boss.r+90);
if(!boss.dashing&&h.t>.15){h.state='recover';h.t=0;h.recDur=1;}
}else if(h.pattern==='howl'){
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='geyser'){
h.data.salvoT-=dt;
if(h.data.salvoT<=0&&h.data.salvo<3){
h.data.salvo++;h.data.salvoT=game.hard?.7:.95;
const n=(rage?7:5)+(game.hard?3:0);
const pts=[{x:player.x,y:player.y},{x:player.x+player.mvx*95,y:player.y+player.mvy*95}];
for(let i=2;i<n;i++)pts.push({x:clamp(player.x+rnd(-210,210),60,W-60),y:clamp(player.y+rnd(-160,160),60,H-60)});
for(const p of pts)geyserMarks.push({x:p.x,y:p.y,t:0,dur:game.hard?.65:.85,phase:'mark',c:'#a8c24f'});
blip('sawtooth',110,70,.3,.08);
}
h.mouth=.8;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='summon'){
if(h.t>=.5){h.state='recover';h.t=0;}
}else if(h.pattern==='wall'){
h.data.t-=dt;
if(h.data.t<=0&&h.data.walls<3){
h.data.walls++;h.data.t=.8;
bossWall(Math.random()<.5?1:-1);
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='cross'){
h.data.tick-=dt;
if(h.data.tick<=0){
h.data.tick=.28;h.data.rot+=.5;
for(let b=0;b<4;b++){
const base=h.data.rot+b*Math.PI/2;
for(let i=-1;i<=1;i++){
const a=base+i*.14;
ebullets.push({x:boss.x,y:boss.y,vx:Math.cos(a)*200,vy:Math.sin(a)*200,r:6,c:'#e8455a'});
}
}
sfx.spit();
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='ring'){
h.data.ringT-=dt;
if(h.data.ringT<=0&&h.data.rings<3){
h.data.rings++;h.data.ringT=.6;h.data.gap+=1.15;
if(dmk()){
/* v1.5.0: círculos rotativos + almas teleguiadas (identidade MORTEM) */
dmkCircle(boss.x,boss.y,Math.round(18*dmkDen()),280*dmkSp(),{c:'#a8c24f',off:h.data.gap,alt:.8});
}else{
rings.push({x:boss.x,y:boss.y,r:boss.r*.7,vr:310,th:14,gapA:h.data.gap,gapW:.9,c:'#a8c24f'});
}
sfx.howl();
}
h.data.soulsT-=dt;
if(h.data.soulsT<=0){
h.data.soulsT=.9;
const a=rnd(TAU);
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a)*130,vy:Math.sin(a)*130,r:6,c:'#a8c24f',home:2.2,homeT:3});
sfx.howl();
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='pounce'){
h.tx=h.data.tx;h.ty=h.data.ty;h.mouth=1;
if(Math.random()<dt*30)particles.push({x:h.hx+rnd(-14,14),y:h.hy+rnd(-14,14),vx:rnd(-20,20),vy:rnd(-20,20),life:.25,t:0,r:2.5,c:h.c,glow:true});
if(h.t>=h.actDur){
if(game.hard&&!h.data.second){
h.data.second=true;h.t=0;
const a=Math.atan2(player.y-h.hy,player.x-h.hx);
h.data.tx=clamp(player.x+Math.cos(a)*46,60,W-60);
h.data.ty=clamp(player.y+Math.sin(a)*46,60,H-60);
sfx.dash();sfx.growl();
}else{h.state='recover';h.t=0;}
}
}else if(h.pattern==='wave'){
h.data.tick-=dt;
if(h.data.tick<=0){
h.data.tick=game.hard?.08:.1;
const sw=Math.sin(h.t*4.5)*.55;
for(let k=-1;k<=1;k++){
const a=h.data.base+sw+k*.24;
ebullets.push({x:h.hx+Math.cos(h.face)*24,y:h.hy+Math.sin(h.face)*24,vx:Math.cos(a)*(game.hard?240:205),vy:Math.sin(a)*(game.hard?240:205),r:6,c:'#ff8f3d'});
}
if(Math.random()<.4)sfx.spit();
}
h.mouth=.9;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='orbit'){
h.mouth=.8;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}else if(h.pattern==='snipe'){
h.data.t-=dt;
if(h.data.t<=0&&h.data.shots<(game.hard?4:3)){
h.data.shots++;h.data.t=game.hard?.14:.18;
const a=Math.atan2(player.y-h.hy,player.x-h.hx);
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a)*(game.hard?470:420),vy:Math.sin(a)*(game.hard?470:420),r:6,c:'#a8c24f'});
sfx.spit();
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}
/* NOVOS PADRÕES — IGNIS */
else if(h.pattern==='volley'){
/* três camadas de fan simultâneo — forma um "V" grosso de balas */
h.data.t-=dt;
const maxV=game.hard?5:4;
if(h.data.t<=0&&h.data.volleys<maxV){
h.data.volleys++;h.data.t=game.hard?.32:.4;
const base=Math.atan2(player.y-h.hy,player.x-h.hx);
const n=game.hard?7:5;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.13;
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a)*300,vy:Math.sin(a)*300,r:7,c:'#ff8f3d'});
}
/* duas camadas extras perpendiculares — parece uma estrela de 3 pontas */
for(const s of[-1,1]){
const a2=base+s*Math.PI/2;
for(let i=-1;i<=1;i++){
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a2+i*.08)*240,vy:Math.sin(a2+i*.08)*240,r:6,c:'#ffd9a0'});
}
}
sfx.spit();
sparks(h.hx,h.hy,'#ff8f3d',5,160,.35,3,true);
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}
else if(h.pattern==='crosshair'){
/* mira em cruz — dois eixos perpendiculares que rodam */
h.data.tick-=dt;
if(h.data.tick<=0){
h.data.tick=game.hard?.28:.34;
h.data.ang+=game.hard?.6:.5;
const ba=h.data.ang;
for(const s of[0,Math.PI/2]){
const a=ba+s;
for(let i=-2;i<=2;i++){
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a+i*.07)*260,vy:Math.sin(a+i*.07)*260,r:6,c:'#ff8f3d'});
}
}
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}
else if(h.pattern==='nova'){
/* explosão concêntrica de anéis curtos + 4 relances radiais */
h.data.ringT-=dt;
const maxR=game.hard?4:3;
if(h.data.ringT<=0&&h.data.rings<maxR){
h.data.rings++;h.data.ringT=game.hard?.4:.5;
if(dmk()){
dmkCircle(h.hx,h.hy,Math.round(14*dmkDen()),(game.hard?330:290)*dmkSp(),{c:'#ff8f3d'});
}else{
rings.push({x:h.hx,y:h.hy,r:24,vr:game.hard?400:340,th:13,gapA:rnd(TAU),gapW:1.1,c:'#ff8f3d'});
}
sfx.howl();game.shake=Math.max(game.shake,6);
const n=game.hard?12:9;
for(let i=0;i<n;i++){
const a=i/n*TAU+h.data.rings*.2;
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a)*220,vy:Math.sin(a)*220,r:6,c:'#ffd9a0'});
}
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}
/* NOVOS PADRÕES — UMBRA */
else if(h.pattern==='whirl'){
/* redemoinho: balas em órbita que se expandem e giram — tipo furacão de sombra */
h.data.tick-=dt;
if(h.data.tick<=0){
h.data.tick=game.hard?.07:.09;h.data.spin+=.32;
const arms=h.data.arms;
for(let k=0;k<arms;k++){
const a=h.data.spin+k*TAU/arms;
const r=70+h.t*70;
const sx=h.hx+Math.cos(a)*30,sy=h.hy+Math.sin(a)*30;
ebullets.push({x:sx,y:sy,vx:Math.cos(a+h.t*1.5)*200,vy:Math.sin(a+h.t*1.5)*200,r:6,c:'#e8455a'});
}
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}
else if(h.pattern==='beam'){
/* feixe fino e longo que rotaciona como um varredor de radar */
const d=h.data;
d.t+=dt;
if(d.t<d.warm){
/* aquecimento: ponteiro visual no render() — sem dano aqui */
h.mouth=Math.min(1,h.mouth+dt*3);
}else{
/* feixe ativo — dano aplicado via segDist no render overlay */
const ba=d.ang+(d.t-d.warm)*1.1;
const L=1400;
const ex2=h.hx+Math.cos(ba)*L,ey2=h.hy+Math.sin(ba)*L;
if(!player.dead&&segDist(player.x,player.y,h.hx,h.hy,ex2,ey2)<10+(player.hitR||player.r))hurtPlayer(); /* v1.4.6 hitR */
if(Math.random()<dt*8)particles.push({x:h.hx+Math.cos(ba)*rnd(60,L*.5),y:h.hy+Math.sin(ba)*rnd(60,L*.5),vx:rnd(-20,20),vy:rnd(-20,20),life:.3,t:0,r:2.5,c:'#e8455a',glow:true});
d.ang=ba;
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}
else if(h.pattern==='fountain'){
/* fonte: joga 3 salvas verticais de balas que se espalham em leque para cima/baixo */
if(!h.data.fired){
h.data.fired=true;
const dirY=-1;
const n=game.hard?16:12;
for(let s=0;s<3;s++){
for(let i=0;i<n;i++){
const a=-Math.PI/2+(i-(n-1)/2)*.18+s*.04;
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a)*(260+s*30),vy:Math.sin(a)*(260+s*30),r:6,c:s%2?'#e8455a':'#31242e'});
}
}
sfx.howl();game.shake=Math.max(game.shake,8);
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}
/* NOVOS PADRÕES — MORTEM */
else if(h.pattern==='chain'){
/* tiros teleguiados que "encadeiam" — um após o outro em direção ao jogador */
h.data.t-=dt;
if(h.data.t<=0&&h.data.shots<(game.hard?7:5)){
h.data.shots++;h.data.t=game.hard?.18:.22;
const a=Math.atan2(player.y-h.hy,player.x-h.hx)+rnd(-.1,.1);
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a)*190,vy:Math.sin(a)*190,r:6,c:'#a8c24f',home:2.6,homeT:3.5});
sfx.howl();
}
h.mouth=1;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}
else if(h.pattern==='aura'){
/* aura: anel rotativo de "raios" (balas direcionais) que rotaciona */
h.data.t-=dt;
if(h.data.t<=0){
h.data.t=game.hard?.1:.13;h.data.spin+=game.hard?.45:.38;
const arms=game.hard?8:6;
for(let k=0;k<arms;k++){
const a=h.data.spin+k*TAU/arms;
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a)*185,vy:Math.sin(a)*185,r:6,c:'#a8c24f'});
const a2=a+Math.PI;
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a2)*165,vy:Math.sin(a2)*165,r:5,c:'#c2c6a6'});
}
}
h.mouth=.9;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}
else if(h.pattern==='rain'){
/* chuva de estrelas cadentes — várias marcas perseguindo o jogador de longe */
h.data.markT-=dt;
const maxS=game.hard?5:4;
if(h.data.markT<=0&&h.data.salvos<maxS){
h.data.salvos++;h.data.markT=game.hard?.5:.6;
const n=game.hard?6:4;
for(let i=0;i<n;i++){
const a=rnd(TAU),dd=rnd(140,260);
const pt=roomPt(clamp(player.x+Math.cos(a)*dd,60,W-60),clamp(player.y+Math.sin(a)*dd,60,H-60),50);
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:game.hard?.55:.7,phase:'mark',c:'#a8c24f'});
}
geyserMarks.push({x:player.x,y:player.y,t:0,dur:.65,phase:'mark',c:'#c2c6a6'});
blip('sawtooth',110,55,.25,.08);
}
h.mouth=.8;
if(h.t>=h.actDur){h.state='recover';h.t=0;}
}
}

function despStart(h){
if(h.name==='IGNIS')h.data={tick:0,spin:rnd(TAU),endBurst:false};
else if(h.name==='UMBRA')h.data={dashes:0,waitT:.5};
else h.data={markT:0,homeT:0};
h.mouth=1;
}
function despUpdate(h,dt){
if(h.name==='IGNIS'){
h.data.tick-=dt;
if(h.data.tick<=0){
h.data.tick=game.hard?.055:.07;h.data.spin+=.42;
const na=game.hard?4:3;
for(let b=0;b<na;b++){
const a=h.data.spin+b*TAU/na;
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a)*185,vy:Math.sin(a)*185,r:6,c:'#ff8f3d'});
}
}
if(h.t>2.6&&!h.data.endBurst){
h.data.endBurst=true;
if(dmk()){
dmkCircle(boss.x,boss.y,Math.round(20*dmkDen()),320*dmkSp(),{c:'#ff8f3d'});
dmkCircle(boss.x,boss.y,Math.round(14*dmkDen()),250*dmkSp(),{c:'#e8455a',alt:.72,quiet:true});
}else{
rings.push({x:boss.x,y:boss.y,r:boss.r*.7,vr:380,th:14,gapA:rnd(TAU),gapW:1.1,c:'#ff8f3d'});
rings.push({x:boss.x,y:boss.y,r:boss.r*.5,vr:300,th:12,gapA:rnd(TAU),gapW:1.1,c:'#e8455a'});
}
sfx.howl();
}
if(h.t>=3){h.state='recover';h.t=0;h.recDur=1.2;}
}else if(h.name==='UMBRA'){
if(!boss.dashing){
h.data.waitT-=dt;
if(h.data.waitT<=0&&h.data.dashes<(game.hard?4:3)){
h.data.dashes++;h.data.waitT=.45;
boss.dashing=true;boss.dashT=.42;
boss.dashAng=Math.atan2(player.y-boss.y,player.x-boss.x);
const v=game.hard?1080:980;
boss.dashVx=Math.cos(boss.dashAng)*v;boss.dashVy=Math.sin(boss.dashAng)*v;
sfx.dash();sfx.growl();
}
}
if(h.data.dashes>=(game.hard?4:3)&&!boss.dashing&&h.t>.6){h.state='recover';h.t=0;h.recDur=1.4;}
}else{
h.data.markT-=dt;
if(h.data.markT<=0){
h.data.markT=game.hard?.3:.38;
for(let i=0;i<3;i++){
const a=rnd(TAU),d=rnd(40,150);
geyserMarks.push({x:clamp(player.x+Math.cos(a)*d,60,W-60),y:clamp(player.y+Math.sin(a)*d,60,H-60),t:0,dur:.7,phase:'mark',c:'#a8c24f'});
}
}
h.data.homeT-=dt;
if(h.data.homeT<=0){
h.data.homeT=1.1;
for(let i=0;i<(game.hard?3:2);i++){
const a=rnd(TAU);
ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(a)*140,vy:Math.sin(a)*140,r:6,c:'#a8c24f',home:2.4,homeT:3.5});
}
sfx.howl();
}
if(h.t>=3.2){h.state='recover';h.t=0;h.recDur=1.4;}
}
h.mouth=1;
}
function deadHeadSway(h,dt){
const a=boss.angle+h.baseAng;
h.tx=boss.x+Math.cos(a)*boss.r*.5;
h.ty=boss.y+Math.sin(a)*boss.r*.5+90+Math.sin(game.t*1.5+h.ph)*6;
h.vx+=((h.tx-h.hx)*30-h.vx*6)*dt;h.vy+=((h.ty-h.hy)*30-h.vy*6)*dt;
h.hx+=h.vx*dt;h.hy+=h.vy*dt;
h.face=lerpAngle(h.face,Math.PI/2+Math.sin(game.t*.9+h.ph)*.3,1-Math.exp(-3*dt));
}
function endingHeadPose(h,dt,lift){
const a=boss.angle+h.baseAng;
const sway=Math.sin(game.t*1.5+h.ph)*6;
const downX=boss.x+Math.cos(a)*boss.r*.5,downY=boss.y+Math.sin(a)*boss.r*.5+90+sway;
const upX=boss.x+Math.cos(a)*160,upY=boss.y+Math.sin(a)*160-34;
h.tx=lerp(downX,upX,lift);h.ty=lerp(downY,upY,lift);
h.vx+=((h.tx-h.hx)*20-h.vx*5)*dt;h.vy+=((h.ty-h.hy)*20-h.vy*5)*dt;
h.hx+=h.vx*dt;h.hy+=h.vy*dt;
const fa=Math.atan2(player.y-h.hy,player.x-h.hx)+.15*(1-lift);
h.face=lerpAngle(h.face,fa,1-Math.exp(-2.5*dt));
}
function updateBoss(dt){
if(!boss.active)return;
boss.bodyWob+=dt;
if(!boss.introLock)boss.barT=Math.min(1,boss.barT+dt*1.6);
if(boss.dying){boss.fade=Math.max(0,boss.fade-dt*.55);return;}
const phase=boss.heads.filter(function(h){return h.alive;}).length;
if(!boss.introLock)boss.scale=Math.min(1,boss.scale+dt*2.4);
const p2m=boss.phase2?1.35:1;
const spd=(phase===3?(game.hard?30:24):phase===2?(game.hard?42:34):(game.hard?58:48))*p2m;
if(phase===1&&!boss.introLock&&!boss.frenzyActive){
boss.frenzyCd-=dt;
if(boss.frenzyCd<=0){
boss.frenzyActive=true;boss.frenzyT=0;boss.frenzyPause=0;boss.dashing=false;
game.banner={type:'small',txt:'FRENESI DO GUARDIÃO',sub:'',t:0,dur:1.5};
sfx.roar();sfx.howl();game.flash=.25;game.shake=16;
}
}
if(boss.frenzyActive){
boss.frenzyT+=dt;
if(!boss.dashing){
boss.frenzyPause-=dt;
if(boss.frenzyPause<=0){
boss.dashing=true;boss.dashT=.38;
boss.dashAng=Math.atan2(player.y-boss.y,player.x-boss.x);
const v=game.hard?1260:1080;
boss.dashVx=Math.cos(boss.dashAng)*v;boss.dashVy=Math.sin(boss.dashAng)*v;
sfx.dash();sfx.growl();
}
}
if(boss.frenzyT>=frenzyDur()){
boss.frenzyActive=false;boss.frenzyCd=game.hard?7:9;boss.frenzyT=0;
boss.dashing=false;boss.recoverT=1.6;
game.banner={type:'small',txt:'O GUARDIÃO ESTÁ EXAUSTO',sub:'',t:0,dur:1.5};
sfx.explode();game.shake=20;
sparks(boss.x,boss.y,'#31242e',22,280,.7,5);
}
}
if(boss.dashing){
boss.dashT-=dt;
boss.x+=boss.dashVx*dt;boss.y+=boss.dashVy*dt;
game.shake=Math.max(game.shake,5);
particles.push({x:boss.x+rnd(-40,40),y:boss.y+rnd(-40,40),vx:rnd(-30,30),vy:rnd(-30,30),life:.4,t:0,r:rnd(3,7),c:'#241b22',drag:1});
if(!player.dead&&dist(boss.x,boss.y,player.x,player.y)<boss.r*.82+(player.hitR||player.r))hurtPlayer(); /* v1.4.6 hitR */
const m=boss.r+30;
if(boss.x<m||boss.x>W-m||boss.y<m||boss.y>H-m||boss.dashT<=0){
boss.dashing=false;
boss.recoverT=boss.frenzyActive?.12:.85;
game.shake=Math.max(game.shake,boss.frenzyActive?10:18);
sfx.explode();
sparks(boss.x,boss.y,'#31242e',16,260,.6,5);
}
clampArena(boss,boss.r*.6);
}else if(!boss.frenzyActive){
boss.recoverT-=dt;
if(boss.recoverT<=0&&!boss.introLock){
const a=Math.atan2(player.y-boss.y,player.x-boss.x);
boss.angle=lerpAngle(boss.angle,a,1-Math.exp(-2.5*dt));
boss.x+=Math.cos(boss.angle)*spd*dt;boss.y+=Math.sin(boss.angle)*spd*dt;
}else if(boss.recoverT>0){
boss.angle+=Math.sin(game.t*6)*.012;
}
clampArena(boss,boss.r*.6);
}else{
clampArena(boss,boss.r*.6);
}
if(!boss.introLock){
const d=dist(boss.x,boss.y,player.x,player.y),min=boss.r*.85+player.r;
if(d<min&&d>0){
const a=Math.atan2(player.y-boss.y,player.x-boss.x);
player.x=boss.x+Math.cos(a)*min;player.y=boss.y+Math.sin(a)*min;
clampArena(player,player.r);
}
}
for(const h of boss.heads){
h.flash-=dt;h.mjolT-=dt;
if(!h.alive){deadHeadSway(h,dt);continue;}
if(boss.introLock){
const t=game.bossIntroT,i=boss.heads.indexOf(h);
const w=smooth(ramp(t,WK[i],WK[i]+1.8));
const howl=ramp(t,HOWL_T,HOWL_T+.35)*(1-ramp(t,11.1,11.5));
h.wake=w;h.howlT=howl;
const sl=boss.angle+h.baseAng;
const sleepX=boss.x+Math.cos(sl)*(boss.r*.4+14);
const sleepY=boss.y+Math.sin(sl)*(boss.r*.4+14)+62+Math.sin(game.t*.85+h.ph)*5;
const upX=boss.x+Math.cos(sl)*175,upY=boss.y+Math.sin(sl)*175;
let tx=lerp(sleepX,upX,w),ty=lerp(sleepY,upY,w);
if(howl>0){tx=boss.x+Math.cos(sl)*150;ty=boss.y+Math.sin(sl)*150-14;}
h.tx=tx;h.ty=ty;
h.vx+=((h.tx-h.hx)*60-h.vx*9)*dt;h.vy+=((h.ty-h.hy)*60-h.vy*9)*dt;
h.hx+=h.vx*dt;h.hy+=h.vy*dt;
const sleepFace=Math.PI/2+.35+Math.sin(game.t*.5+h.ph)*.12;
const awakeFace=Math.atan2(player.y-h.hy,player.x-h.hx);
let fa=lerpAngle(sleepFace,awakeFace,w);
if(howl>0)fa=-Math.PI/2+Math.sin(game.t*9+i)*.06;
h.face=lerpAngle(h.face,fa,1-Math.exp(-8*dt));
h.mouth=howl>0?1:(.04+.035*Math.sin(game.t*1.1+h.ph))*(1-w)+.12*w;
if(w>0&&w<1&&Math.random()<dt*10)particles.push({x:h.hx+rnd(-14,14),y:h.hy+rnd(-10,6),vx:0,vy:-30,life:.4,t:0,r:2,c:h.c,glow:true});
if(howl>0&&Math.random()<dt*24)particles.push({x:h.hx+Math.cos(h.face)*30,y:h.hy+Math.sin(h.face)*30,vx:rnd(-30,30),vy:-rnd(60,140),life:.5,t:0,r:rnd(1.5,3),c:h.c,glow:true});
continue;
}
if(boss.frenzyActive){
const a=boss.angle+h.baseAng;
h.tx=boss.x+Math.cos(a)*(boss.r+40);h.ty=boss.y+Math.sin(a)*(boss.r+40);
h.vx+=((h.tx-h.hx)*70-h.vx*10)*dt;h.vy+=((h.ty-h.hy)*70-h.vy*10)*dt;
h.hx+=h.vx*dt;h.hy+=h.vy*dt;
h.face=lerpAngle(h.face,boss.dashing?boss.dashAng:Math.atan2(player.y-h.hy,player.x-h.hx),1-Math.exp(-9*dt));
h.mouth=1;
if(!player.dead&&dist(h.hx,h.hy,player.x,player.y)<h.r+player.r-6)hurtPlayer();
continue;
}
headAI(h,dt,phase);
h.vx+=((h.tx-h.hx)*70-h.vx*10)*dt;h.vy+=((h.ty-h.hy)*70-h.vy*10)*dt;
h.hx+=h.vx*dt;h.hy+=h.vy*dt;
let fa=boss.dashing?boss.dashAng:Math.atan2(player.y-h.hy,player.x-h.hx);
if(h.pattern==='spiral'&&h.state==='act'&&h.data)fa=h.data.spin;
h.face=lerpAngle(h.face,fa,1-Math.exp(-9*dt));
if(!player.dead&&dist(h.hx,h.hy,player.x,player.y)<h.r+player.r-6)hurtPlayer();
}
}
function updateAttract(dt){
boss.bodyWob+=dt;
for(const h of boss.heads){
const a=boss.angle+h.baseAng+Math.sin(game.t*1.1+h.ph)*.22;
h.tx=boss.x+Math.cos(a)*180;h.ty=boss.y+Math.sin(a)*180;
h.vx+=((h.tx-h.hx)*70-h.vx*10)*dt;h.vy+=((h.ty-h.hy)*70-h.vy*10)*dt;
h.hx+=h.vx*dt;h.hy+=h.vy*dt;
h.face=lerpAngle(h.face,Math.PI/2+Math.sin(game.t*.7+h.ph)*.5,1-Math.exp(-3*dt));
h.mouth=.08+.04*Math.sin(game.t+h.ph);
}
}
/* ============ vitória ============ */
/* Após a v0.9.0, derrotar o Cérbero NÃO encerra o jogo.
   Ele concede a BÊNÇÃO FINAL (como antes), mas em vez de mostrar a tela "won",
   o jogo continua a progressão rumo à PENUMBRA PROFUNDA — uma sequência curta
   de fases difíceis (máx. 5) que culmina no encontro com CARONTE, barqueiro do
   rio que separa a Penumbra do verdadeiro LIMBO. */
const END_LINES=[
'você... não tem noção do que está fazendo, cachorrinho...',
'cada círculo que você atravessa... o mundo lá em cima apodrece um pouco mais.',
'o mundo pagará pelas suas escolhas... e eu estarei esperando... do outro lado.'];
/* contador de fases de transição após Cérbero — quando chega em 5, Caronte aparece */
const TRANSITION_FLOORS_BEFORE_CARONTE=5;
function winStart(){
if(player.dead||game.state==='ending')return;
game.state='ending';game.endPhase='dialog';game.endT=0;game.overlayShown=false;
game.playerAlpha=1;game.darkSoul=null;game.enterFrom=null;game.gateCreak=0;
boss.dying=true;game.banner=null;game.headBanner=null;
bullets=[];ebullets=[];enemies=[];rings=[];geyserMarks=[];spawnMarks=[];hammers=[];shockwaves=[];
thrownSaw=null;lightBeam=null;
sfx.growl();
}
function updateEnding(dt){
game.endT+=dt;
const ph=game.endPhase;
if(ph==='dialog'){
boss.bodyWob+=dt;
const lift=ramp(game.endT,.6,2)*(1-ramp(game.endT,10.2,11.2));
for(const h of boss.heads)if(!h.alive)endingHeadPose(h,dt,lift);
game.shake=Math.max(game.shake,.8);
updatePlayer(dt);
if(game.endT>=11.4){game.endPhase='dust';game.endT=0;sfx.dust();}
}else if(ph==='dust'){
boss.bodyWob+=dt;
const lift=Math.max(0,1-game.endT*2.5);
for(const h of boss.heads)if(!h.alive)endingHeadPose(h,dt,lift);
boss.fade=Math.max(0,1-game.endT/2.2);
if(boss.fade>0){
for(let i=0;i<7;i++){
const h=pick(boss.heads),k=rnd();
particles.push({x:lerp(boss.x,h.hx,k)+rnd(-18,18),y:lerp(boss.y,h.hy,k)+rnd(-18,18),vx:rnd(-25,25),vy:rnd(-120,-40),life:rnd(.8,1.8),t:0,r:rnd(1.5,4),c:Math.random()<.55?pick(['#57504e','#3a2b33','#241b20']):(Math.random()<.5?h.c:'#9d6bb5'),drag:.8,glow:Math.random()<.25});
}
}
if(game.endT>=2.3){
game.endPhase='soul';game.endT=0;
game.darkSoul={x:W/2,y:H*.42,t:0};
sfx.echo();
}
}else if(ph==='soul'){
game.darkSoul.t+=dt;
if(Math.random()<dt*8)particles.push({x:W/2+rnd(-14,14),y:H*.42+rnd(-10,10),vx:rnd(-12,12),vy:rnd(-55,-20),life:rnd(.5,1),t:0,r:rnd(1,2.5),c:'#9d6bb5',drag:1,glow:true});
updatePlayer(dt);
if(dist(player.x,player.y,W/2,H*.42)<32)takeDarkSoul();
}else if(ph==='bless'){
updatePlayer(dt);
if(game.endT>=3.4){
/* v1.1.1: a ESCOLA saiu da descida — o fim do Limbo volta a levar ao
   PORTÃO, como antes. A POÇA "afoga-se" não existe mais e o jogo segue
   para o guardião final. A escola é opcional, acessada só pelo menu
   CÍRCULOS (porta de teste). */
game.endPhase='gate';game.endT=0;game.gateCreak=0;sfx.rumble();
}
}else if(ph==='gate'){
updatePlayer(dt);
if(game.endT>.7&&game.endT<1.6)game.shake=Math.max(game.shake,1.2);
if(!game.gateCreak&&game.endT>=.65){game.gateCreak=1;sfx.creak();}
/* v1.5.4: A SEGUNDA DESCIDA — no lugar do portão do inferno, uma ESCADA fria
   abriu na arena; fumaça azulada sobe dela (a descida continua) */
if(game.endT>.65&&Math.random()<.42)particles.push({x:GATE.x+rnd(-70,70),y:GATE.y+110+rnd(-28,28),vx:rnd(-8,8),vy:rnd(-48,-14),life:rnd(.5,1.3),t:0,r:rnd(1.5,3),c:Math.random()<.6?'#7fb8ff':'#bfd8e8',drag:1,glow:true});
/* v1.5.4: o gatilho arma em .4s e a zona é generosa (raio 64) — a escada está
   a 67px do ponto onde Thor fica após a alma: andando direto ele chega em
   ~.32s; com o atraso antigo de 1s ele PASSAVA reto e tinha de voltar */
if(game.endT>=.4&&dist(player.x,player.y,GATE.x,GATE.y+110)<64){
game.endPhase='enter';game.endT=0;
game.enterFrom={x:player.x,y:player.y};
sfx.howl();
}
}else if(ph==='enter'){
/* v1.5.4: o Thor desce os degraus — entra na escada e some nela */
const k=smooth(Math.min(1,game.endT/.85));
player.x=lerp(game.enterFrom.x,GATE.x,k);
player.y=lerp(game.enterFrom.y,GATE.y+110,k);
game.playerAlpha=1-k;
if(Math.random()<.5)particles.push({x:player.x+rnd(-8,8),y:player.y+rnd(-8,8),vx:rnd(-16,16),vy:rnd(-50,-16),life:.5,t:0,r:rnd(1,2.5),c:Math.random()<.5?'#7fb8ff':'#bfd8e8',drag:1,glow:true});
if(game.endT>=.9){game.endPhase='closing';game.endT=0;sfx.rumble();sfx.echo();}
}else if(ph==='closing'){
/* v1.5.4: os degraus engolem o Thor — sem portão fechando */
game.shake=Math.max(game.shake,2);
if(game.endT>=1.1){game.endPhase='closed';game.endT=0;sfx.echo();}
}else if(ph==='closed'){
if(game.endT>=3.6){
  /* ==== v1.5.4: A SEGUNDA DESCIDA — vencido o guardião (antigo + a SENTENÇA),
     uma escada fria desce da arena direto para o CORREDOR AZULADO; ao
     atravessá-lo vem CARONTE, depois o LIMBO em 4 fases e o Juiz Sem Rosto.
     O portão do inferno do fim saiu deste caminho. ==== */
  META.cerbSlain=1;saveMeta();conqTick();
  if(window.__EXPANSION){game.cerbSlain=true;window.__EXPANSION.startBlueCorr();return;}
  /* ==== v0.9.1: Cérbero é novamente o BOSS FINAL. Derrotá-lo encerra o jogo
     com a vitória padrão. ==== */
  META.wins++;saveMeta();
  giveCerberusBlessing();
  game.state='won';
  setStat('stKillW',game.kills);
  setStat('stEmbW',game.souls);
  setStat('stHpW',player.hp);
  /* atualiza overlay de vitória */
  const wt=ov('winTitle');if(wt)wt.textContent='O CÉRBERO CAIU';
  const we=ov('winEyebrow');if(we)we.textContent='O GUARDIÃO DO INFERNO';
  const ws=ov('winSub');if(ws)ws.textContent='o inferno foi varrido. o guardião das três gargantas silenciou.';
  const wstats=ov('winStats');
  if(wstats){
    wstats.innerHTML='ABATES <b>'+game.kills+'</b> · ALMAS <b>'+game.souls+'</b> · VIDA <b>'+player.hp+'/'+player.maxHp+'</b>';
  }
  showOv('win');
  sfx.win();
}
}
}
/* BÊNÇÃO DO CÉRBERO — concede os mesmos poderes de antes, sem encerrar o jogo */
function giveCerberusBlessing(){
player.maxHp=Math.max(player.maxHp,120);
player.hp=player.maxHp;
P.dmgMult*=1.5;
P.lightning=Math.max(P.lightning,3);
game.flash=.7;game.shake=14;game.hitstop=.12;
sfx.levelup();sfx.win();
sparks(player.x,player.y,'#9d6bb5',26,300,.9,4,true);
sparks(player.x,player.y,'#c9a0ff',14,220,.7,3,true);
game.banner={type:'circle',txt:'BÊNÇÃO FINAL',name:'ALMA DO CÉRBERO',sub:'dano +50% · relâmpagos triplos · um coração a mais · o inferno não terminou',t:0,dur:3.4};
}
/* ============================================================
   CARONTE — O BARQUEIRO
   Encontro especial no fim da Penumbra Profunda.
   Estado 'caronte'   → diálogo com cantarola + interagir para escolhas SIM/NÃO.
   Estado 'boatride'  → cutscene do barco navegando pelo rio escuro.
   Estado 'corridor'  → corredor escuro que leva ao verdadeiro Abismo.
   Estado 'carontefight' → batalha final contra Caronte no Limbo.
   ============================================================ */
/* frases aleatórias que Caronte cantarola durante o encontro — inaudíveis/incompreensíveis */
const CARONTE_CHANTS=[
  '...lala laa... hmm mmm...',
  '...o rio... leva... todos...',
  '...moeda... na boca... esquecida...',
  '...la la la... não ouvem... não ouvem...',
  '...remo... remo... a água... corta...',
  '...hmmmm... quem paga... passa...',
  '...alma... na proa... pesa... pesa...',
  '...laaa... a margem... nunca... chega...',
  '...o barco... sabe... o nome... de cada... um...',
  '...mmmm... silêncio... no fundo... do rio...',
  '...la la... quem não paga... fica...',
  '...a névoa... canta... comigo...',
  '...remo... remo... os mortos... remam...',
  '...hmmm... a travessia... tem... preço...',
  '...o Inferno... respira... no fundo...'
];
/* começa o encontro com Caronte — chamado quando o jogador completa as fases
   de transição após derrotar o Cérbero, OU ao chegar no andar 3 via portal. */
function startCaronteEncounter(){
game.state='caronte';
game.playerAlpha=1; /* v1.4.3: Thor visível no encontro (defesa em profundidade) */
game.caronteT=0;
game.caronteChant=0;
game.caronteAccepted=false;
/* v0.9.2: sistema de cantarola + diálogos aleatórios + exigir interação */
game.caronteChantT=0;
game.caronteChantInterval=2.2; /* nova frase a cada ~2.2s */
game.caronteCurrentChant=CARONTE_CHANTS[Math.floor(Math.random()*CARONTE_CHANTS.length)];
game.caronteChantDisplay=0; /* tempo que a frase atual fica visível */
game.caronteInteractable=false; /* fica true quando o jogador se aproxima */
game.caronteChoicesOpen=false; /* fica true quando o overlay SIM/NÃO aparece */
game.caronteDialogQueue=[]; /* fila de frases a exibir */
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
game.doors=[];game.portal=null;
game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];texts=[];
thrownSaw=null;lightBeam=null;
/* Thor começa à esquerda; Caronte está à direita no barco */
player.x=W*.18;player.y=H*.72;player.mvx=0;player.mvy=0;
game.roomFade=1;
sfx.rumble();sfx.echo();
blip('sine',80,40,1.4,.1);
texts.push({x:W/2,y:H*.14,txt:'O RIO ESCURO',t:0,life:3.6,c:'#bfd8e8',size:14,disp:true});
texts.push({x:W/2,y:H*.19,txt:'alguém cantarola no barco... aproxime-se',t:0,life:3.6,c:'#9fc0c9',size:11});
/* NÃO mostra o overlay ainda — o jogador precisa se aproximar e interagir */
}
/* loop de update do encontro com Caronte */
function updateCaronteEncounter(dt){
game.caronteT+=dt;
game.caronteChant+=dt;
/* v0.9.2: sistema de cantarola — frases aleatórias periódicas */
game.caronteChantT+=dt;
game.caronteChantDisplay+=dt;
if(game.caronteChantT>=game.caronteChantInterval){
  game.caronteChantT=0;
  /* chance de dizer várias frases seguidas (cantarola mais intensa) */
  const nPhrases=Math.random()<.3?2:1;
  for(let i=0;i<nPhrases;i++){
    game.caronteCurrentChant=CARONTE_CHANTS[Math.floor(Math.random()*CARONTE_CHANTS.length)];
  }
  game.caronteChantDisplay=0;
  /* atualiza o texto do overlay se estiver aberto */
  const ce=ov('caronteChant');
  if(ce&&game.caronteChoicesOpen)ce.textContent='...... '+game.caronteCurrentChant.replace(/\.\.\./g,'').trim()+' ......';
  /* som de cantarola abafado */
  blip('sine',rnd(70,140),rnd(50,110),rnd(.3,.7),.015);
}
/* permite mover o jogador para se aproximar de Caronte */
if(!game.caronteChoicesOpen){
  const ax=(held('right')?1:0)-(held('left')?1:0);
  const ay=(held('down')?1:0)-(held('up')?1:0);
  const l=Math.hypot(ax,ay);
  const spd=200;
  if(l){
    player.x+=(ax/l)*spd*dt;
    player.y+=(ay/l)*spd*dt;
    player.mvx=ax/l;player.mvy=ay/l;
    player.walkT+=dt*9;
    player.angle=Math.atan2(player.mvy,player.mvx);
  }
  /* limita a área de movimento */
  player.x=clamp(player.x,40,W-40);
  player.y=clamp(player.y,H*.5,H-40);
}
/* verifica se o jogador está perto de Caronte (barco à direita) */
const caronteX=W*.65,caronteY=H*.7;
const d=dist(player.x,player.y,caronteX,caronteY);
game.caronteInteractable=d<180&&!game.caronteChoicesOpen;
/* partículas de névoa e almas perdidas no rio */
if(Math.random()<.4){
  particles.push({x:rnd(0,W),y:rnd(H*.3,H),vx:rnd(-6,6),vy:rnd(-12,-4),life:rnd(2,4),t:0,r:rnd(1,3),c:'rgba(180,170,200,'+rnd(.15,.4)+')',drag:.99,glow:true});
}
/* sons de cantilação inaudível — blips aleatórios abafados */
if(Math.random()<.06){
  blip('sine',rnd(70,140),rnd(50,110),rnd(.3,.7),.015);
}
/* pequenas ondulações no rio */
if(Math.random()<.3){
  particles.push({x:rnd(W*.2,W*.8),y:rnd(H*.6,H*.9),vx:0,vy:0,life:.8,t:0,r:rnd(8,18),c:'rgba(100,90,140,0.12)',drag:1});
}
}
/* render da tela de Caronte (atrás do overlay HTML) */
function drawCaronteScene(){
const t=game.caronteT;
/* céu/régião superior — escuridão profunda com leve brilho púrpura */
const sg=ctx.createLinearGradient(0,0,0,H);
sg.addColorStop(0,'#06050a');
sg.addColorStop(.5,'#0a0814');
sg.addColorStop(1,'#04030a');
ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);
/* rio escuro — gradiente horizontal */
const rg=ctx.createLinearGradient(0,H*.55,0,H);
rg.addColorStop(0,'#0a0814');
rg.addColorStop(.5,'#080612');
rg.addColorStop(1,'#040208');
ctx.fillStyle=rg;ctx.fillRect(0,H*.55,W,H*.45);
/* reflexos no rio — linhas finas que ondulam */
ctx.strokeStyle='rgba(120,100,160,0.18)';ctx.lineWidth=1;
for(let i=0;i<14;i++){
  const yy=H*.6+i*12;
  const off=Math.sin(t*.6+i*.5)*8;
  ctx.beginPath();
  ctx.moveTo(0,yy);
  for(let x=0;x<=W;x+=40){
    ctx.lineTo(x,yy+Math.sin(t*.8+x*.01+i)*2+off*.2);
  }
  ctx.stroke();
}
/* névoa rasteira */
ctx.fillStyle='rgba(60,50,90,0.18)';
for(let i=0;i<6;i++){
  const fx=(i*W/6+t*15)%(W+200)-100;
  const fy=H*.7+Math.sin(t*.4+i)*20;
  ctx.beginPath();ctx.ellipse(fx,fy,140,28,0,0,TAU);ctx.fill();
}
/* === o barco com Caronte === */
const bx=W*.65,by=H*.7;
/* sombra do barco na água */
ctx.fillStyle='rgba(0,0,0,0.5)';
ctx.beginPath();ctx.ellipse(bx,by+22,180,12,0,0,TAU);ctx.fill();
/* casco do barco — forma alongada escura */
ctx.fillStyle='#1a1218';
ctx.strokeStyle='#3a2a3a';ctx.lineWidth=2;
ctx.beginPath();
ctx.moveTo(bx-160,by);
ctx.quadraticCurveTo(bx-180,by+22,bx-140,by+30);
ctx.lineTo(bx+140,by+30);
ctx.quadraticCurveTo(bx+180,by+22,bx+160,by);
ctx.closePath();
ctx.fill();ctx.stroke();
/* proa e popa levantadas */
ctx.beginPath();
ctx.moveTo(bx-160,by);ctx.quadraticCurveTo(bx-180,by-20,bx-150,by-26);
ctx.lineTo(bx-140,by);ctx.closePath();ctx.fill();ctx.stroke();
ctx.beginPath();
ctx.moveTo(bx+160,by);ctx.quadraticCurveTo(bx+180,by-10,bx+170,by-18);
ctx.lineTo(bx+150,by);ctx.closePath();ctx.fill();ctx.stroke();
/* lanterna na proa — única fonte de luz forte */
const lx=bx-150,ly=by-12;
const lg=ctx.createRadialGradient(lx,ly,2,lx,ly,160);
lg.addColorStop(0,'rgba(255,217,160,0.85)');
lg.addColorStop(.4,'rgba(255,200,140,0.35)');
lg.addColorStop(1,'rgba(255,200,140,0)');
ctx.fillStyle=lg;ctx.fillRect(lx-160,ly-160,320,320);
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(lx,ly,5,0,TAU);ctx.fill();
/* post da lanterna */
ctx.strokeStyle='#3a2a2a';ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(bx-150,by-2);ctx.lineTo(lx,ly);ctx.stroke();
/* === Caronte — figura encapuzada no barco === */
const cx=bx+10,cy=by-30;
const bob=Math.sin(t*1.2)*1.5;
/* corpo/capuz */
ctx.fillStyle='#0a0810';
ctx.strokeStyle='#3a2a4a';ctx.lineWidth=1.5;
ctx.beginPath();
ctx.moveTo(cx-22,cy+30+bob);
ctx.quadraticCurveTo(cx-30,cy-5,cx-18,cy-25+bob);
ctx.quadraticCurveTo(cx,cy-40,cx+18,cy-25+bob);
ctx.quadraticCurveTo(cx+30,cy-5,cx+22,cy+30+bob);
ctx.closePath();ctx.fill();ctx.stroke();
/* capuz cobre o rosto — apenas escuridão visível */
ctx.fillStyle='#000';
ctx.beginPath();
ctx.moveTo(cx-12,cy-22+bob);
ctx.quadraticCurveTo(cx,cy-30,cx+12,cy-22+bob);
ctx.lineTo(cx+8,cy-10+bob);ctx.lineTo(cx-8,cy-10+bob);
ctx.closePath();ctx.fill();
/* olhos brilhantes — únicos traços visíveis */
const eyeA=.6+.4*Math.sin(t*3);
ctx.fillStyle='rgba(180,160,220,'+eyeA+')';
ctx.beginPath();ctx.arc(cx-4,cy-18+bob,1.4,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(cx+4,cy-18+bob,1.4,0,TAU);ctx.fill();
/* braço segurando a vara */
ctx.strokeStyle='#0a0810';ctx.lineWidth=4;
ctx.beginPath();
ctx.moveTo(cx+18,cy+5+bob);
ctx.quadraticCurveTo(cx+50,cy-15+bob,cx+70,cy-25+bob);
ctx.stroke();
/* vara longa (remo) */
ctx.strokeStyle='#3a2a2a';ctx.lineWidth=2.5;
ctx.beginPath();
ctx.moveTo(cx+60,cy-15+bob);
ctx.lineTo(cx+120,cy+18+bob);
ctx.stroke();
/* partículas de canto — pequenas notas "murmurando" saindo do barqueiro */
if(Math.random()<.25){
  particles.push({x:cx+rnd(-12,12),y:cy-30+bob,vx:rnd(-8,8),vy:rnd(-22,-8),life:1.2,t:0,r:rnd(1,2),c:'rgba(180,160,220,0.6)',drag:.96,glow:true});
}
/* Thor à esquerda esperando */
if(game.playerAlpha===undefined)game.playerAlpha=1;
drawPlayer();
/* v0.9.3: Caronte só fala quando conversado — sem balão de cantarola aqui */
/* prompt de interação — "interagir [Z]" quando perto */
if(game.caronteInteractable&&!game.caronteChoicesOpen){
  const pa=.5+.5*Math.sin(game.t*4);
  ctx.globalAlpha=pa;
  txt(keyLabel(keybinds.interact[0])+' · FALAR COM CARONTE',W*.4,H*.5,MONO,11,'#bfd8e8','center',2);
  ctx.globalAlpha=1;
}
/* partículas gerais */
drawParticles();
/* vinheta */
ctx.drawImage(vignette,0,0);
/* overlay de fade */
if(game.roomFade>0){ctx.fillStyle='rgba(2,1,4,'+game.roomFade+')';ctx.fillRect(0,0,W,H);}
}
/* jogador escolhe SIM — inicia a cutscene do barco */
function caronteAccept(){
hideOv('caronte');
game.state='boatride';
game.boatT=0;
game.boatPhase='approach'; /* approach → board → sail → arrive */
game.roomFade=1;
/* v0.9.6: Caronte diz algo aleatório APENAS ao aceitar a travessia —
   popup de texto único. Nada de chant durante a cutscene do barco. */
const chant=pick(CARONTE_CHANTS);
texts.push({x:W/2,y:H*.42,txt:'CARONTE: '+chant,t:0,life:3.2,c:'#9fc0c9',size:11,disp:true});
sfx.gate();
blip('sine',220,180,.6,.1);
}
/* jogador escolhe NÃO — volta a explorar a área anterior.
   O jogador pode retornar a Caronte a qualquer momento: basta limpar o mapa
   atual (derrotar o miniboss) e o portal o levará de volta ao encontro. */
function caronteRefuse(){
hideOv('caronte');
if(window.__EXPANSION&&game._bcActive){window.__EXPANSION.backToBlueCorr();return;} /* v1.3.0: corredor azul */
game.state='play';
game.roomFade=1;
game.caronteReturn=true; /* marca: o próximo portal leva de volta a Caronte */
game.banner={type:'small',txt:'VOCÊ RECUOU',sub:'o barqueiro aguarda — limpe este mapa para voltar a ele',t:0,dur:3.0};
blip('sine',220,140,.3,.08);
/* gera nova fase da penumbra profunda para o jogador explorar */
game.floor++;
game.portal=null;game.extraIdx=-1;
game.mapRooms=genMap();game.seenGlyphs=[];
game.roomIdx=-1;
game.roomFade=1;
enterRoom(0,null);
}
/* loop de update da cutscene do barco */
function updateBoatride(dt){
game.boatT+=dt;
const ph=game.boatPhase;
if(ph==='approach'){
  /* Thor caminha em direção ao barco */
  const targetX=W*.55,targetY=H*.72;
  const k=Math.min(1,game.boatT/2.2);
  player.x=lerp(W*.3,targetX,smooth(k));
  player.y=lerp(H*.7,targetY,smooth(k));
  player.mvx=1;player.mvy=0;player.angle=0;
  if(game.boatT>=2.4){game.boatPhase='board';game.boatT=0;sfx.creak();}
}else if(ph==='board'){
  /* Thor entra no barco lentamente */
  const k=Math.min(1,game.boatT/1.8);
  player.x=lerp(W*.55,W*.62,smooth(k));
  player.y=lerp(H*.72,H*.68,smooth(k));
  if(game.boatT>=2.0){game.boatPhase='sail';game.boatT=0;sfx.rumble();}
}else if(ph==='sail'){
  /* o barco navega pelo rio escuro — Thor como passageiro */
  if(game.boatT>=8.0){game.boatPhase='arrive';game.boatT=0;sfx.echo();}
}else if(ph==='arrive'){
  /* chegada ao corredor — Thor desce do barco */
  const k=Math.min(1,game.boatT/1.8);
  player.x=lerp(W*.62,W*.5,smooth(k));
  player.y=lerp(H*.68,H*.85,smooth(k));
  if(game.boatT>=2.0){
    /* v1.3.0: o barco atraca direto no LIMBO — o corredor azulado ficou ANTES do rio */
    /* v1.4.5 CORREÇÃO CRÍTICA: enterRoom NÃO troca o game.state — no caminho
       antigo (corredor) o estado já era 'play' antes de chamar
       enterLimboOfficial, mas aqui o estado ficava PRESO em 'boatride' para
       sempre: a cena do barco continuava eternamente e, em arrive>1.5s, Thor
       nem é desenhado — ele "sumia" e o LIMBO nunca chegava. O estado sai de
       'boatride' ANTES de montar o limbo (mesma ordem do caminho do corredor). */
    game.state='play';
    enterLimboOfficial();
  }
}
/* partículas de névoa e água durante a viagem */
if(Math.random()<.5){
  particles.push({x:rnd(0,W),y:rnd(H*.5,H),vx:rnd(-4,4),vy:rnd(-8,-2),life:rnd(2,4),t:0,r:rnd(1,2.5),c:'rgba(140,120,180,'+rnd(.1,.3)+')',drag:.99,glow:true});
}
}
/* render da cutscene do barco */
function drawBoatride(){
const t=game.boatT;
const ph=game.boatPhase;
/* fundo: escuridão profunda com céu quase preto */
const sg=ctx.createLinearGradient(0,0,0,H);
sg.addColorStop(0,'#020104');
sg.addColorStop(.5,'#050308');
sg.addColorStop(1,'#020104');
ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);
/* rio escuro com reflexos púrpuras */
const rg=ctx.createLinearGradient(0,H*.55,0,H);
rg.addColorStop(0,'#080612');
rg.addColorStop(1,'#020104');
ctx.fillStyle=rg;ctx.fillRect(0,H*.55,W,H*.45);
/* estrelas distantes — poucas e fracas */
ctx.fillStyle='rgba(200,200,220,0.4)';
for(let i=0;i<20;i++){
  const sx=((i*113)%W);
  const sy=((i*71)%(H*.5));
  const a=.3+.3*Math.sin(t+i);
  ctx.globalAlpha=a;
  ctx.beginPath();ctx.arc(sx,sy,1,0,TAU);ctx.fill();
}
ctx.globalAlpha=1;
/* reflexos do rio — ondulando */
ctx.strokeStyle='rgba(120,100,160,0.2)';ctx.lineWidth=1;
for(let i=0;i<16;i++){
  const yy=H*.6+i*10;
  ctx.beginPath();
  ctx.moveTo(0,yy);
  for(let x=0;x<=W;x+=30){
    ctx.lineTo(x,yy+Math.sin(t*.7+x*.012+i*.7)*2);
  }
  ctx.stroke();
}
/* posição do barco conforme a fase */
let bx=W*.5,by=H*.7;
if(ph==='approach'){
  bx=W*.65;
}else if(ph==='board'){
  bx=W*.6;
}else if(ph==='sail'){
  /* o barco se move lentamente para a direita e some */
  const k=clamp(game.boatT/8,0,1);
  bx=lerp(W*.6,W*.4,smooth(k));
  /* leve ondulação */
  by=H*.7+Math.sin(game.boatT*1.2)*4;
}else if(ph==='arrive'){
  /* barco para no destino final */
  bx=W*.5;
  by=H*.7;
}
/* sombra do barco */
ctx.fillStyle='rgba(0,0,0,0.5)';
ctx.beginPath();ctx.ellipse(bx,by+22,180,12,0,0,TAU);ctx.fill();
/* casco do barco */
ctx.fillStyle='#1a1218';
ctx.strokeStyle='#3a2a3a';ctx.lineWidth=2;
ctx.beginPath();
ctx.moveTo(bx-160,by);
ctx.quadraticCurveTo(bx-180,by+22,bx-140,by+30);
ctx.lineTo(bx+140,by+30);
ctx.quadraticCurveTo(bx+180,by+22,bx+160,by);
ctx.closePath();
ctx.fill();ctx.stroke();
/* proa e popa */
ctx.beginPath();
ctx.moveTo(bx-160,by);ctx.quadraticCurveTo(bx-180,by-20,bx-150,by-26);
ctx.lineTo(bx-140,by);ctx.closePath();ctx.fill();ctx.stroke();
ctx.beginPath();
ctx.moveTo(bx+160,by);ctx.quadraticCurveTo(bx+180,by-10,bx+170,by-18);
ctx.lineTo(bx+150,by);ctx.closePath();ctx.fill();ctx.stroke();
/* lanterna na proa — brilho único */
const lx=bx-150,ly=by-12;
const lg=ctx.createRadialGradient(lx,ly,2,lx,ly,180);
lg.addColorStop(0,'rgba(255,217,160,0.7)');
lg.addColorStop(.5,'rgba(255,200,140,0.2)');
lg.addColorStop(1,'rgba(255,200,140,0)');
ctx.fillStyle=lg;ctx.fillRect(lx-180,ly-180,360,360);
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(lx,ly,5,0,TAU);ctx.fill();
/* Carone no barco — figura encapuzada */
const cx=bx+10,cy=by-30;
const bob=Math.sin(t*1.2)*1.5;
ctx.fillStyle='#0a0810';
ctx.strokeStyle='#3a2a4a';ctx.lineWidth=1.5;
ctx.beginPath();
ctx.moveTo(cx-22,cy+30+bob);
ctx.quadraticCurveTo(cx-30,cy-5,cx-18,cy-25+bob);
ctx.quadraticCurveTo(cx,cy-40,cx+18,cy-25+bob);
ctx.quadraticCurveTo(cx+30,cy-5,cx+22,cy+30+bob);
ctx.closePath();ctx.fill();ctx.stroke();
ctx.fillStyle='#000';
ctx.beginPath();
ctx.moveTo(cx-12,cy-22+bob);
ctx.quadraticCurveTo(cx,cy-30,cx+12,cy-22+bob);
ctx.lineTo(cx+8,cy-10+bob);ctx.lineTo(cx-8,cy-10+bob);
ctx.closePath();ctx.fill();
const eyeA=.6+.4*Math.sin(t*3);
ctx.fillStyle='rgba(180,160,220,'+eyeA+')';
ctx.beginPath();ctx.arc(cx-4,cy-18+bob,1.4,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(cx+4,cy-18+bob,1.4,0,TAU);ctx.fill();
/* vara de remo */
ctx.strokeStyle='#3a2a2a';ctx.lineWidth=2.5;
ctx.beginPath();
ctx.moveTo(cx+60,cy-15+bob);
ctx.lineTo(cx+120,cy+18+bob);
ctx.stroke();
/* rastro do barco na água */
if(ph==='sail'){
  ctx.strokeStyle='rgba(180,160,220,0.2)';ctx.lineWidth=1.5;
  for(let i=0;i<6;i++){
    const tx=bx+180+i*30;
    const ty=by+15+Math.sin(t*2+i)*3;
    ctx.beginPath();
    ctx.moveTo(tx,ty);
    ctx.quadraticCurveTo(tx+15,ty+8,tx+30,ty);
    ctx.stroke();
  }
}
/* Thor — sentado no barco durante a viagem, caminhando nas outras fases */
if(ph==='sail'){
  /* Thor sentado em cima do barco — posição relativa ao barco */
  const sitX=bx-30,sitY=by-8;
  ctx.save();
  ctx.globalAlpha=game.playerAlpha||1;
  /* sombra de Thor sentado */
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath();ctx.ellipse(sitX,sitY+10,14,4,0,0,TAU);ctx.fill();
  /* corpo sentado — menor e mais compacto */
  ctx.translate(sitX,sitY);
  ctx.fillStyle='#6d838c';
  /* corpo (tronco sentado) */
  ctx.beginPath();ctx.ellipse(0,2,12,9,0,0,TAU);ctx.fill();
  ctx.strokeStyle='#14100e';ctx.lineWidth=1.5;ctx.stroke();
  /* cabeça */
  ctx.fillStyle='#8ba2ac';
  ctx.beginPath();ctx.arc(0,-8,7,0,TAU);ctx.fill();
  ctx.stroke();
  /* orelhas pontudas */
  ctx.fillStyle='#5d7278';
  ctx.beginPath();ctx.moveTo(-6,-10);ctx.lineTo(-8,-14);ctx.lineTo(-4,-11);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(6,-10);ctx.lineTo(8,-14);ctx.lineTo(4,-11);ctx.closePath();ctx.fill();
  /* focinho */
  ctx.fillStyle='#a7bcc4';
  ctx.beginPath();ctx.ellipse(3,-6,4,3,0,0,TAU);ctx.fill();
  ctx.fillStyle='#14100e';
  ctx.beginPath();ctx.ellipse(5,-6,1.5,1.2,0,0,TAU);ctx.fill();
  /* olhos */
  ctx.fillStyle='#f4f8f5';
  ctx.beginPath();ctx.arc(1,-9,1.8,0,TAU);ctx.fill();
  ctx.fillStyle='#14100e';
  ctx.beginPath();ctx.arc(1.5,-9,1,0,TAU);ctx.fill();
  /* patas dianteiras relaxadas */
  ctx.fillStyle='#5d7278';
  ctx.beginPath();ctx.ellipse(8,6,4,3,-.3,0,TAU);ctx.fill();
  ctx.beginPath();ctx.ellipse(-6,6,4,3,.3,0,TAU);ctx.fill();
  /* cauda enrolada */
  ctx.beginPath();ctx.arc(-10,0,3,0,TAU);ctx.fill();
  ctx.restore();
}else{
  /* Thor caminhando nas fases approach/board/arrive — v1.4.5: no arrive ele
     também é desenhado (descendo do barco); antes ele sumia nos últimos 0,5s */
  drawPlayer();
}
/* partículas */
drawParticles();
/* vinheta */
ctx.drawImage(vignette,0,0);
/* overlay de fade */
if(game.roomFade>0){ctx.fillStyle='rgba(2,1,4,'+game.roomFade+')';ctx.fillRect(0,0,W,H);}
/* v0.9.6: o chant de Caronte agora aparece apenas como popup de texto
   ao aceitar a travessia (em caronteAccept). Nada de chant na cutscene. */
if(ph==='sail'&&game.boatT>2&&game.boatT<7){
  const a=Math.min(1,game.boatT-2)*Math.min(1,7-game.boatT);
  ctx.globalAlpha=a*.5;
  txt('O RIO SEPARA O QUE ERAS DO QUE SERÁS',W/2,H*.45,MONO,11,'#bfd8e8','center',2);
  ctx.globalAlpha=1;
}
}
/* inicia o corredor que leva ao Limbo — reutiliza o estado 'corridor'
   existente, mas agora ele termina revelando o LIMBO oficialmente */
function startLimboCorridor(){
game.state='corridor';
game.corridorT=0;
game.corridorLen=H;
game.corridorW=260;
game.corridorProg=0;
game.fromCaronte=true; /* marca que veio do encontro com Caronte */
ROOM.x=Math.round((W-game.corridorW)/2);
ROOM.y=0;
ROOM.w=game.corridorW;
ROOM.h=H;
ROOM.inverted=false;
game.absRects=[{x:ROOM.x,y:ROOM.y,w:ROOM.w,h:ROOM.h}];
game.absMain=game.absRects[0];
player.x=W/2;
player.y=H-90;
player.mvx=0;player.mvy=-1;player.angle=-Math.PI/2;
game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
game.doors=[];game.portal=null;
game.roomFade=1;
enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];texts=[];
thrownSaw=null;lightBeam=null;
sfx.rumble();sfx.echo();
blip('sine',120,80,.5,.1);
texts.push({x:W/2,y:H*.18,txt:'O CORREDOR',t:0,life:3.0,c:'#bfd8e8',size:14,disp:true});
texts.push({x:W/2,y:H*.23,txt:'algo aguarda adiante...',t:0,life:3.0,c:'#9fc0c9',size:11});
}
/* ============================================================
   CARONTE — BOSS FINAL DO LIMBO
   Batalha numa arena junto ao rio. Após derrotá-lo, dropa ALMA NEGRA
   que desbloqueia a magia LATIDO INFERNAL (tecla 1).
   ============================================================ */
const CARONTE_HP=Math.round(9500+(game.hard?1.4:1));
/* v0.9.3: padrões de ataque totalmente novos — tema "barqueiro das almas do rio" */
const CARONTE_PATS=['lantern_beam','soul_whisper','oar_strike','river_grasp','spectral_chase','abyss_stare','ferry_sweep'];
const CARONTE_INTRO_LINES=[
'cão que cruzou a penumbra e viu meu rio parado,',
'seias a morte, não te daria a mão;',
'mas queres ceifar-me — e o dever é meu:',
'não cruzarás. te afogarás no chão.'
];
/* diálogo da 2ª fase — quando Caronte afoga Thor e a luta vai para debaixo d'água */
const CARONTE_PHASE2_LINES=[
'o rio te quer. eu apenas obedeço.',
'desce, cão. desce ao fundo onde os esquecidos cantam.',
'aqui embaixo meu remo é lei. minha pá é sentença.'
];
function startCaronteBossFight(){
game.state='carontefight';
game.caronteFightT=0;
game.carontePhase=0; /* 0=intro/dialog, 1=fight fase1, 1.5=transition(drown), 2=defeated */
/* v0.9.2: fase 2 debaixo d'água */
game.carontePhase2=false;
game.carontePhase2T=0;
game.caronteUnderwater=false; /* true quando a luta está debaixo d'água */
game.caronteDialogIdx=0;
game.caronteDialogT=0;
game.caronteBoss={
  x:W/2,y:H*.35,r:46,hp:CARONTE_HP,maxHp:CARONTE_HP,
  ang:0,flash:0,atqT:1.5,st:'idle',stT:0,pat:null,patIdx:-1,data:null,
  bobPh:rnd(TAU),dead:false,dyingT:0,defeated:false
};
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
game.doors=[];game.portal=null;
game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];
thrownSaw=null;lightBeam=null;
player.x=W/2;player.y=H*.78;player.mvx=0;player.mvy=0;player.angle=-Math.PI/2;
game.roomFade=1;
sfx.rumble();sfx.growl();
blip('sine',60,30,1.5,.1);
game.banner={type:'boss',txt:'O BARQUEIRO',sub:'caronte, o guardião do rio',t:0,dur:3.0};
}
function updateCaronteFight(dt){
/* v0.9.4: null check — se caronteBoss não existe, volta ao menu */
const cb=game.caronteBoss;
if(!cb){game.state='menu';showOv('menu');return;}
game.caronteFightT+=dt;
if(game.carontePhase===0){
  /* diálogo introdutório */
  game.caronteDialogT+=dt;
  if(game.caronteDialogT>=3.5){
    game.caronteDialogT=0;
    game.caronteDialogIdx++;
    if(game.caronteDialogIdx>=CARONTE_INTRO_LINES.length){
      game.carontePhase=1;
      game.banner={type:'boss',txt:'A TRAVESSIA É NEGADA',sub:'caronte empunha a vara',t:0,dur:2.2};
      sfx.roar();
    }
  }
  /* permite mover durante o diálogo */
  updatePlayer(dt);
  return;
}
if(game.carontePhase===2){
  /* Caronte derrotado — animação de morte */
  cb.dyingT+=dt;
  updatePlayer(dt);
  if(cb.dyingT>=2.4){
    finishCaronteFight();
  }
  return;
}
/* fase 1: batalha ativa */
/* v0.9.4: O MUNDO — tempo parado durante a luta contra Caronte
   (v0.9.16: worldT decrementa só no frame() — aqui só lemos) */
const worldActive=game.worldT>0;
if(game.activeCd>0)game.activeCd-=dt;
updatePlayer(dt);
updateShot(dt);
if(game.hasBite)updateBite(dt);
updateChainsaw(dt);
updateSword(dt);
updateNova(dt);
updateStakes(dt);
updateMagics(dt);
updateShock(dt);
updateThrownSaw(dt);
updateHammers(dt);
updateBullets(dt);
updateVapers(dt);updateBeamShots(dt);/* v1.0.0: vapor e feixe vivos na luta do Caronte */
if(!worldActive){
updateEBullets(dt);
updatePickups(dt);
/* atualiza Caronte — só se o tempo não estiver parado */
cb.bobPh+=dt*1.2;
cb.atqT-=dt;
cb.flash=Math.max(0,cb.flash-dt*4);
cb.stT+=dt;
/* movimento: flutua lentamente perseguindo o jogador */
const targetX=lerp(W*.3,W*.7,clamp((Math.sin(game.t*.4)+1)*.5,0,1));
const targetY=H*.35+Math.sin(game.t*.8)*30;
cb.x+=(targetX-cb.x)*dt*.6;
cb.y+=(targetY-cb.y)*dt*.6;
cb.ang=Math.atan2(player.y-cb.y,player.x-cb.x);
/* ataques */
if(cb.st==='idle'&&cb.atqT<=0){
  cb.patIdx=(cb.patIdx+1)%CARONTE_PATS.length;
  cb.pat=CARONTE_PATS[cb.patIdx];
  cb.st='tele';
  cb.stT=0;
  cb.data=null;
}
if(cb.st==='tele'){
  const dur=.65;
  if(cb.stT>=dur){
    cb.st='act';
    cb.stT=0;
    caronteActStart(cb);
  }
}else if(cb.st==='act'){
  caronteActUpdate(cb,dt);
  if(cb.stT>=1.6){
    cb.st='idle';
    cb.stT=0;
    cb.atqT=game.hard?0.8:1.2;
  }
}
/* checa derrota OU transição para fase 2 */
if(cb.hp<=0&&cb.defeated===false){
  cb.defeated=true;
  game.carontePhase=2;
  cb.dyingT=0;
  game.flash=.6;game.shake=20;
  sfx.explode();sfx.headDie();
  bullets=[];ebullets=[];rings=[];geyserMarks=[];spawnMarks=[];
}else if(cb.hp<=cb.maxHp*0.5&&!game.carontePhase2&&game.carontePhase===1){
  /* v0.9.2: transição para fase 2 — Caronte afoga Thor, luta vai para debaixo d'água */
  game.carontePhase2=true;
  game.carontePhase2T=0;
  game.caronteUnderwater=true;
  game.flash=.8;game.shake=30;
  sfx.rumble();sfx.roar();sfx.echo();
  /* limpa projéteis */
  ebullets=[];bullets=[];
  /* empurra Thor para o centro (afogando) */
  player.x=W/2;player.y=H/2;
  /* Caronte sobe acima da água */
  cb.x=W/2;cb.y=H*.3;
  cb.st='idle';cb.atqT=2;
  game.banner={type:'boss',txt:'O RIO TE ENGOLE',sub:'Caronte te arrasta para o fundo — a luta continua debaixo d\'água',t:0,dur:3.4};
  /* bolhas de afogamento */
  for(let i=0;i<20;i++){
    particles.push({x:rnd(0,W),y:rnd(0,H),vx:rnd(-10,10),vy:rnd(-30,-10),life:rnd(1,2),t:0,r:rnd(2,5),c:'rgba(150,200,255,0.5)',drag:.98,glow:true});
  }
}
/* colisão corpo a corpo com o jogador */
if(!player.dead&&dist(cb.x,cb.y,player.x,player.y)<cb.r+player.r-6){
  hurtPlayer();
}
} /* fim do if(!worldActive) */
}
/* v0.9.3: padrões de ataque totalmente novos do Caronte — "barqueiro das almas" */
function caronteActStart(cb){
if(cb.pat==='lantern_beam'){
  /* FEIXE DA LANTERNA — lanterna de Caronte rastreia Thor e dispara feixe contínuo */
  cb.data={t:0,beamT:0,fired:0,ang:Math.atan2(player.y-cb.y,player.x-cb.x)};
}else if(cb.pat==='soul_whisper'){
  /* SUSSURRO DE ALMAS — almas espectrais saem do rio e perseguem Thor */
  cb.data={t:0,summoned:0};
}else if(cb.pat==='oar_strike'){
  /* GOLPE DO REMO — avança com o remo erguido, aviso prévio, depois golpe em arco */
  cb.data={t:0,ang:Math.atan2(player.y-cb.y,player.x-cb.x),charged:false,swung:false};
}else if(cb.pat==='river_grasp'){
  /* GARRAS DO RIO — mãos espectrais surgem do chão e agarram Thor (zonas de dano) */
  cb.data={t:0,fired:0,zones:[]};
}else if(cb.pat==='spectral_chase'){
  /* PERSEGUIÇÃO ESPECTRAL — Caronte some e reaparece atrás de Thor, golpe rápido */
  cb.data={t:0,phase:0,tpX:0,tpY:0,dashAng:0};
}else if(cb.pat==='abyss_stare'){
  /* OLHAR DO ABISMO — olhos brilham e dispara anéis concêntricos de projéteis */
  cb.data={t:0,fired:0};
}else if(cb.pat==='ferry_sweep'){
  /* VARREDURA DA BALSAS — remo varre a arena inteira horizontalmente, precisa pular/esquivar */
  cb.data={t:0,phase:0,sweepY:0};
}
}
function caronteActUpdate(cb,dt){
/* v0.9.4: null check robusto — se data for null, volta para idle */
if(!cb.data){cb.st='idle';cb.stT=0;cb.atqT=1.5;return;}
cb.data.t+=dt;
if(cb.pat==='lantern_beam'){
  /* FEIXE DA LANTERNA — rastreia Thor por 1.5s, depois dispara 3 pulsos */
  if(cb.data.t<1.0){
    /* rastreia Thor lentamente */
    const targetAng=Math.atan2(player.y-cb.y,player.x-cb.x);
    cb.data.ang=lerpAngle(cb.data.ang,targetAng,dt*2);
  }else if(cb.data.fired<3){
    if(cb.data.t>1.0+cb.data.fired*.3){
      cb.data.fired++;
      /* dispara feixe de projéteis na direção travada */
      for(let i=0;i<8;i++){
        const a=cb.data.ang+(i-3.5)*.04;
        ebullets.push({x:cb.x,y:cb.y,vx:Math.cos(a)*384,vy:Math.sin(a)*384,r:5,c:'#ffd9a0',dmg:16});
      }
      sfx.spit();
      game.shake=Math.max(game.shake,6);
    }
  }
}else if(cb.pat==='soul_whisper'){
  /* invoca 4 almas do rio que perseguem Thor */
  if(cb.data.summoned<4&&cb.data.t>(cb.data.summoned*.4)){
    cb.data.summoned++;
    /* alma sai das bordas da arena */
    const side=Math.floor(rnd(4));
    const sx=side===0?rnd(0,W):side===2?rnd(0,W):(side===1?W:0);
    const sy=side===1?rnd(0,H):side===3?rnd(0,H):(side===0?0:H);
    enemies.push({
      x:sx,y:sy,
      type:'sh',r:13,hp:25,sp:50,flash:0,spawnT:0,ang:0,seed:rnd(10),hitT:0,dead:false,slowT:0,burnT:0,poisT:0,poisD:0,poisStack:0,burnD:0,
      caronteSoul:true
    });
    sfx.soul();
    sparks(sx,sy,'#9d6bb5',8,160,.4,3,true);
  }
}else if(cb.pat==='oar_strike'){
  /* GOLPE DO REMO — aviso crescente, depois avança e golpeia em arco */
  if(!cb.data.charged&&cb.data.t>.7){
    cb.data.charged=true;
    cb.data.ang=Math.atan2(player.y-cb.y,player.x-cb.x);
    sfx.roar();
  }
  if(cb.data.charged&&!cb.data.swung&&cb.data.t>1.2){
    cb.data.swung=true;
    cb.data.dashVx=Math.cos(cb.data.ang)*360;
    cb.data.dashVy=Math.sin(cb.data.ang)*360;
    cb.data.dashT=.3;
    sfx.thud();
    /* golpe em arco largo com o remo */
    for(let i=-4;i<=4;i++){
      const a=cb.data.ang+i*.15;
      ebullets.push({x:cb.x,y:cb.y,vx:Math.cos(a)*264,vy:Math.sin(a)*264,r:7,c:'#7e6ab8',dmg:19});
    }
    game.shake=Math.max(game.shake,14);
  }
  if(cb.data.dashT!==undefined&&cb.data.dashT>0){
    cb.data.dashT-=dt;
    cb.x+=cb.data.dashVx*dt;cb.y+=cb.data.dashVy*dt;
    cb.x=clamp(cb.x,80,W-80);cb.y=clamp(cb.y,80,H-80);
  }
}else if(cb.pat==='river_grasp'){
  /* GARRAS DO RIO — cria zonas de dano no chão que explodem */
  cb.data.fired++;
  if(cb.data.fired<=5){
    const gx=player.x+rnd(-80,80);
    const gy=player.y+rnd(-80,80);
    cb.data.zones.push({x:gx,y:gy,t:0,dur:1.2});
    /* marca visual */
    for(let i=0;i<6;i++){
      particles.push({x:gx+rnd(-20,20),y:gy+rnd(-20,20),vx:rnd(-10,10),vy:rnd(-30,-10),life:.8,t:0,r:rnd(1.5,3),c:'rgba(100,80,140,0.6)',drag:.95,glow:true});
    }
    sfx.rumble();
  }
  /* atualiza zonas existentes — explodem e viram projéteis */
  for(let i=cb.data.zones.length-1;i>=0;i--){
    const z=cb.data.zones[i];
    z.t+=dt;
    if(z.t>=z.dur){
      /* explosão de projéteis */
      for(let j=0;j<8;j++){
        const a=j/8*TAU;
        ebullets.push({x:z.x,y:z.y,vx:Math.cos(a)*216,vy:Math.sin(a)*216,r:6,c:'#7e6ab8',dmg:15,slowShot:true});
      }
      sparks(z.x,z.y,'#9d6bb5',10,200,.5,3,true);
      cb.data.zones.splice(i,1);
    }
  }
}else if(cb.pat==='spectral_chase'){
  /* PERSEGUIÇÃO ESPECTRAL — teleporta atrás de Thor e golpeia */
  if(cb.data.phase===0&&cb.data.t>.4){
    cb.data.phase=1;
    /* teleporta para perto de Thor */
    const ang=rnd(TAU);
    cb.data.tpX=clamp(player.x+Math.cos(ang)*100,80,W-80);
    cb.data.tpY=clamp(player.y+Math.sin(ang)*100,80,H-80);
    /* efeito de desaparecer */
    sparks(cb.x,cb.y,'#9d6bb5',20,260,.6,3,true);
    cb.x=cb.data.tpX;cb.y=cb.data.tpY;
    sparks(cb.x,cb.y,'#9d6bb5',20,260,.6,3,true);
    sfx.echo();
  }
  if(cb.data.phase===1&&cb.data.t>.8){
    cb.data.phase=2;
    /* golpe rápido em direção a Thor */
    cb.data.dashAng=Math.atan2(player.y-cb.y,player.x-cb.x);
    cb.data.dashVx=Math.cos(cb.data.dashAng)*500;
    cb.data.dashVy=Math.sin(cb.data.dashAng)*500;
    cb.data.dashT=.25;
    sfx.roar();
    /* projéteis em linha */
    for(let i=0;i<3;i++){
      const a=cb.data.dashAng+(i-1)*.1;
      ebullets.push({x:cb.x,y:cb.y,vx:Math.cos(a)*336,vy:Math.sin(a)*336,r:6,c:'#9d6bb5',dmg:18});
    }
  }
  if(cb.data.dashT!==undefined&&cb.data.dashT>0){
    cb.data.dashT-=dt;
    cb.x+=cb.data.dashVx*dt;cb.y+=cb.data.dashVy*dt;
    cb.x=clamp(cb.x,80,W-80);cb.y=clamp(cb.y,80,H-80);
  }
}else if(cb.pat==='abyss_stare'){
  /* OLHAR DO ABISMO — anéis concêntricos de projéteis expandindo */
  cb.data.fired++;
  if(cb.data.fired<=4){
    const count=12+cb.data.fired*4;
    for(let i=0;i<count;i++){
      const a=i/count*TAU+cb.data.fired*.15;
      ebullets.push({x:cb.x,y:cb.y,vx:Math.cos(a)*(168+cb.data.fired*24),vy:Math.sin(a)*(168+cb.data.fired*24),r:6,c:'#c9a0ff',dmg:14});
    }
    sfx.spit();
    game.shake=Math.max(game.shake,8);
    /* flash dos olhos */
    sparks(cb.x,cb.y-20,'#c9a0ff',12,200,.5,3,true);
  }
}else if(cb.pat==='ferry_sweep'){
  /* VARREDURA DA BALSAS — remo varre horizontalmente, precisa esquivar */
  if(cb.data.phase===0&&cb.data.t>.5){
    cb.data.phase=1;
    cb.data.sweepY=player.y;
    sfx.roar();
  }
  if(cb.data.phase===1){
    /* dispara projéteis horizontais em toda a largura na altura do sweepY */
    if(Math.random()<.3){
      for(let dir of[-1,1]){
        ebullets.push({x:dir<0?-20:W+20,y:cb.data.sweepY,vx:dir*336,vy:0,r:8,c:'#7e6ab8',dmg:18,slowShot:true});
      }
    }
    /* move o sweep verticalmente */
    cb.data.sweepY+=Math.sin(game.t*3)*60*dt;
    cb.data.sweepY=clamp(cb.data.sweepY,80,H-80);
  }
}
}
/* aplica dano ao Caronte */
function damageCaronte(dmg){
const cb=game.caronteBoss;
if(!cb||cb.hp<=0||game.carontePhase!==1)return;
if(isNaN(dmg)||dmg<=0)return;
cb.hp-=dmg;
cb.flash=.6;
sfx.bhit();
if(opts.dmgNum)texts.push({x:cb.x+rnd(-20,20),y:cb.y-30,txt:Math.round(dmg),t:0,life:.7,c:'#ffd9a0',size:13,disp:true});
}
/* render da batalha contra Caronte */
function drawCaronteFight(){
const cb=game.caronteBoss;
if(!cb){ctx.fillStyle='#0a0a14';ctx.fillRect(0,0,W,H);return;}
/* v0.9.2: fase 2 — tudo debaixo d'água. Visual completamente diferente. */
if(game.caronteUnderwater){
  /* fundo: água profunda azul-esverdeada escura */
  const wg=ctx.createLinearGradient(0,0,0,H);
  wg.addColorStop(0,'#0a2030');
  wg.addColorStop(.5,'#08222e');
  wg.addColorStop(1,'#04141c');
  ctx.fillStyle=wg;ctx.fillRect(0,0,W,H);
  /* raios de luz penetrando a água */
  ctx.globalAlpha=.06;
  for(let i=0;i<5;i++){
    const rx=(i*W/5+game.t*15)%(W+100)-50;
    const rg2=ctx.createLinearGradient(rx,0,rx+80,H);
    rg2.addColorStop(0,'rgba(150,220,255,0.8)');
    rg2.addColorStop(1,'rgba(150,220,255,0)');
    ctx.fillStyle=rg2;
    ctx.beginPath();
    ctx.moveTo(rx,0);ctx.lineTo(rx+60,0);ctx.lineTo(rx+120,H);ctx.lineTo(rx+40,H);
    ctx.closePath();ctx.fill();
  }
  ctx.globalAlpha=1;
  /* bolhas subindo continuamente */
  if(Math.random()<.3){
    particles.push({x:rnd(0,W),y:H+10,vx:rnd(-4,4),vy:rnd(-30,-12),life:rnd(2,4),t:0,r:rnd(1.5,4),c:'rgba(180,220,255,0.5)',drag:.99,glow:true});
  }
  /* plantas aquáticas no fundo */
  ctx.strokeStyle='rgba(40,80,60,0.4)';ctx.lineWidth=2;
  for(let i=0;i<8;i++){
    const px=(i*W/8+30);
    const sway=Math.sin(game.t*.8+i)*8;
    ctx.beginPath();
    ctx.moveTo(px,H);
    ctx.quadraticCurveTo(px+sway*.5,H-40,px+sway,H-80);
    ctx.stroke();
  }
  /* overlay azul-water */
  ctx.fillStyle='rgba(40,120,180,0.08)';
  ctx.fillRect(0,0,W,H);
}else{
  /* fase 1 — arena do Limbo à beira do rio */
  if(paradiseOutsideCache&&isParadiseFloor())ctx.drawImage(paradiseOutsideCache,0,0);
  else{ctx.fillStyle='#1a1a2a';ctx.fillRect(0,0,W,H);}
  /* rio ao fundo — faixa horizontal escura */
  const rg=ctx.createLinearGradient(0,H*.6,0,H);
  rg.addColorStop(0,'rgba(20,16,30,0.5)');
  rg.addColorStop(1,'rgba(8,4,16,0.8)');
  ctx.fillStyle=rg;ctx.fillRect(0,H*.6,W,H*.4);
  /* reflexos do rio */
  ctx.strokeStyle='rgba(120,100,160,0.25)';ctx.lineWidth=1;
  for(let i=0;i<10;i++){
    const yy=H*.7+i*8;
    ctx.beginPath();
    ctx.moveTo(0,yy);
    for(let x=0;x<=W;x+=40)ctx.lineTo(x,yy+Math.sin(game.t*.8+x*.01+i)*2);
    ctx.stroke();
  }
  /* chão gramado do Limbo (topo) */
  if(!paradiseOutsideCache){
    ctx.fillStyle='rgba(80,110,60,0.5)';
    ctx.fillRect(0,0,W,H*.6);
  }
}
/* === Caronte === */
if(cb){
  const bob=Math.sin(cb.bobPh)*4;
  const ey=cb.y+bob;
  /* sombra */
  ctx.fillStyle='rgba(0,0,0,0.5)';
  ctx.beginPath();ctx.ellipse(cb.x,cb.y+cb.r*.7,cb.r*.9,cb.r*.3,0,0,TAU);ctx.fill();
  /* aura sombria */
  const auraA=.4+.2*Math.sin(game.t*3);
  const ag=ctx.createRadialGradient(cb.x,ey,5,cb.x,ey,cb.r+50);
  ag.addColorStop(0,'rgba(80,60,140,'+auraA*.6+')');
  ag.addColorStop(1,'rgba(80,60,140,0)');
  ctx.fillStyle=ag;
  ctx.beginPath();ctx.arc(cb.x,ey,cb.r+50,0,TAU);ctx.fill();
  /* PNG EDITION: Caronte pode ser trocado por sprite externo */
  const __cpng=window.THOR_PNG_MODE&&window.THOR_PNG&&window.THOR_PNG.drawCaronte?window.THOR_PNG.drawCaronte(ctx,cb,game,ey):false;
  if(!__cpng){
  /* corpo/capuz grande */
  ctx.fillStyle='#0a0810';
  ctx.strokeStyle=cb.flash>0?'#fff':'#4a3a5a';ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(cb.x-cb.r,ey+cb.r*.7);
  ctx.quadraticCurveTo(cb.x-cb.r*1.3,ey-cb.r*.2,cb.x-cb.r*.8,ey-cb.r*.8);
  ctx.quadraticCurveTo(cb.x,ey-cb.r*1.4,cb.x+cb.r*.8,ey-cb.r*.8);
  ctx.quadraticCurveTo(cb.x+cb.r*1.3,ey-cb.r*.2,cb.x+cb.r,ey+cb.r*.7);
  ctx.closePath();
  ctx.fill();ctx.stroke();
  /* capuz cobrindo o rosto */
  ctx.fillStyle='#000';
  ctx.beginPath();
  ctx.moveTo(cb.x-cb.r*.5,ey-cb.r*.7);
  ctx.quadraticCurveTo(cb.x,ey-cb.r*1.1,cb.x+cb.r*.5,ey-cb.r*.7);
  ctx.lineTo(cb.x+cb.r*.4,ey-cb.r*.3);ctx.lineTo(cb.x-cb.r*.4,ey-cb.r*.3);
  ctx.closePath();ctx.fill();
  /* olhos brilhantes — púrpuras intensos */
  const eyeA=.7+.3*Math.sin(game.t*5);
  ctx.fillStyle='rgba(200,180,255,'+eyeA+')';
  ctx.beginPath();ctx.arc(cb.x-cb.r*.18,ey-cb.r*.6,3,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(cb.x+cb.r*.18,ey-cb.r*.6,3,0,TAU);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,'+eyeA*.7+')';
  ctx.beginPath();ctx.arc(cb.x-cb.r*.18,ey-cb.r*.6,1.4,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(cb.x+cb.r*.18,ey-cb.r*.6,1.4,0,TAU);ctx.fill();
  }
  /* vara/remo gigante (continua vetorial — leitura do ataque) */
  ctx.strokeStyle='#3a2a3a';ctx.lineWidth=4;
  ctx.save();
  ctx.translate(cb.x,ey);
  ctx.rotate(cb.ang-Math.PI/2);
  ctx.beginPath();ctx.moveTo(0,cb.r);ctx.lineTo(0,cb.r+80);ctx.stroke();
  /* lâmina na ponta — foice */
  ctx.strokeStyle='#5a4a6a';ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(0,cb.r+80);ctx.quadraticCurveTo(20,cb.r+70,18,cb.r+55);
  ctx.stroke();
  ctx.restore();
  /* telegraf do ataque */
  if(cb.st==='tele'){
    const g=.4+.3*Math.sin(game.t*16);
    ctx.strokeStyle='rgba(157,107,181,'+g+')';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(cb.x,ey,cb.r+18,0,TAU);ctx.stroke();
  }
  /* v0.9.3: aviso prévio para oar_strike e spectral_chase — linha tracejada + anel */
  if(cb.st==='act'&&(cb.pat==='oar_strike'||cb.pat==='spectral_chase')&&cb.data&&(!cb.data.swung&&cb.data.phase<2)){
    const warnProg=clamp(cb.data.t/(cb.pat==='oar_strike'?1.2:.8),0,1);
    const ang=cb.data.ang||Math.atan2(player.y-cb.y,player.x-cb.x);
    ctx.strokeStyle='rgba(255,100,100,'+(0.4+0.4*warnProg)+')';
    ctx.lineWidth=2;
    ctx.setLineDash([12,8]);
    ctx.beginPath();
    ctx.moveTo(cb.x,cb.y);
    ctx.lineTo(cb.x+Math.cos(ang)*600,cb.y+Math.sin(ang)*600);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle='rgba(255,80,80,'+(0.5+0.3*Math.sin(game.t*12))+')';
    ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(cb.x,ey,cb.r+10+warnProg*30,0,TAU);ctx.stroke();
    if(warnProg>.5){
      txt('!',cb.x,ey-cb.r-20,MONO,22,'#ff5050','center',2);
    }
  }
  /* v0.9.3: aviso para river_grasp — zonas de dano no chão */
  if(cb.st==='act'&&cb.pat==='river_grasp'&&cb.data&&cb.data.zones){
    for(const z of cb.data.zones){
      const prog=clamp(z.t/z.dur,0,1);
      ctx.strokeStyle='rgba(157,107,181,'+(0.4+0.4*prog)+')';
      ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(z.x,z.y,30+prog*15,0,TAU);ctx.stroke();
      /* mira */
      ctx.strokeStyle='rgba(157,107,181,0.5)';ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(z.x-15,z.y);ctx.lineTo(z.x+15,z.y);
      ctx.moveTo(z.x,z.y-15);ctx.lineTo(z.x,z.y+15);
      ctx.stroke();
    }
  }
  /* v0.9.3: aviso para lantern_beam — linha de mira da lanterna */
  if(cb.st==='act'&&cb.pat==='lantern_beam'&&cb.data&&cb.data.t<1.0){
    const ang=cb.data.ang;
    ctx.strokeStyle='rgba(255,217,160,'+(0.2+0.15*Math.sin(game.t*12))+')';
    ctx.lineWidth=2;
    ctx.setLineDash([6,6]);
    ctx.beginPath();
    ctx.moveTo(cb.x,cb.y);
    ctx.lineTo(cb.x+Math.cos(ang)*700,cb.y+Math.sin(ang)*700);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  /* v0.9.3: aviso para ferry_sweep — linha horizontal mostrando o sweep */
  if(cb.st==='act'&&cb.pat==='ferry_sweep'&&cb.data&&cb.data.phase===1){
    ctx.strokeStyle='rgba(126,106,184,'+(0.3+0.2*Math.sin(game.t*8))+')';
    ctx.lineWidth=2;
    ctx.setLineDash([10,6]);
    ctx.beginPath();
    ctx.moveTo(0,cb.data.sweepY);ctx.lineTo(W,cb.data.sweepY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  /* fase de derrota — dissolve em partículas */
  if(game.carontePhase===2){
    const dk=clamp(cb.dyingT/2.4,0,1);
    ctx.globalAlpha=1-dk;
    if(Math.random()<.6){
      particles.push({x:cb.x+rnd(-cb.r,cb.r),y:ey+rnd(-cb.r,cb.r),vx:rnd(-30,30),vy:rnd(-80,-20),life:rnd(.8,1.6),t:0,r:rnd(1.5,4),c:Math.random()<.5?'#9d6bb5':'#5a4a8a',drag:.85,glow:true});
    }
  }
}
/* projéteis, inimigos, etc. */
drawEBullets();
for(const e of enemies)drawEnemy(e);
drawPlayer();
drawBullets();
drawVapers();drawBeamShots();drawBeamCharge();/* v1.0.0: vapor/feixe na cena do Caronte */
drawParticles();
/* barra de vida do chefe */
if(cb&&game.carontePhase===1){
  const bw=460,bh=14,bx=W/2-bw/2,by=22;
  ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(bx-2,by-2,bw+4,bh+4);
  ctx.fillStyle='#1a1a24';ctx.fillRect(bx,by,bw,bh);
  const hpc=clamp(cb.hp/cb.maxHp,0,1);
  ctx.fillStyle='#9d6bb5';ctx.fillRect(bx,by,bw*hpc,bh);
  ctx.strokeStyle='#e6dac4';ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,bh);
  txt('CARONTE · O BARQUEIRO',W/2,by-12,MONO,10,'#bfd8e8','center',2);
}
/* diálogo introdutório */
if(game.carontePhase===0&&game.caronteDialogIdx<CARONTE_INTRO_LINES.length){
  const line=CARONTE_INTRO_LINES[game.caronteDialogIdx];
  const a=Math.min(1,game.caronteDialogT*.8)*Math.min(1,(3.5-game.caronteDialogT)*.8);
  if(a>0){
    ctx.globalAlpha=clamp(a,0,1);
    /* caixa de texto inferior */
    ctx.fillStyle='rgba(8,5,12,0.85)';
    ctx.fillRect(60,H-110,W-120,60);
    ctx.strokeStyle='#7e6ab8';ctx.lineWidth=1.5;
    ctx.strokeRect(60,H-110,W-120,60);
    txt('CARONTE',W/2,H-95,MONO,10,'#bfd8e8','center',2);
    txt(line,W/2,H-72,MONO,14,'#e6dac4','center',1);
    ctx.globalAlpha=1;
  }
}
/* vinheta */
ctx.drawImage(vignette,0,0);
/* fade */
if(game.roomFade>0){ctx.fillStyle='rgba(4,2,8,'+game.roomFade+')';ctx.fillRect(0,0,W,H);}
}
/* termina a batalha contra Caronte — dropa ALMA NEGRA, desbloqueia magia, mostra vitória */
function finishCaronteFight(){
game.carontePhase=3;
game.state='won';
META.caronteKills=(META.caronteKills||0)+1;
saveMeta();
/* v0.9.13: BÊNÇÃO ÚNICA DE CARONTE — só ele concede o MANTO DAS ALMAS */
game.manto=true;
P.soulMult*=1.35;P.dmgMult*=1.15;
player.maxHp=Math.max(player.maxHp,player.maxHp+25);
player.hp=player.maxHp;
/* dropa ALMA NEGRA — desbloqueia o item ativo LATIDO INFERNAL */
pickupActiveItem('latido');
/* dá Alma Negra como item permanente no livro */
META.darkSoul=true;
saveMeta();
/* estatísticas de vitória */
setStat('stKillW',game.kills);
setStat('stEmbW',game.souls);
setStat('stHpW',player.hp);
/* atualiza overlay de vitória */
const wt=ov('winTitle');if(wt)wt.textContent='CARONTE DERROTADO';
const we=ov('winEyebrow');if(we)we.textContent='O BARQUEIRO CAIU';
const ws=ov('wsSub')||ov('winSub');if(ws)ws.textContent='o rio está livre. a alma negra pulsa em você — pressione [1] para soltar o LATIDO INFERNAL.';
const wstats=ov('winStats');
if(wstats){
  wstats.innerHTML='ABATES <b>'+game.kills+'</b> · ALMAS <b>'+game.souls+'</b> · VIDA <b>'+player.hp+'/'+player.maxHp+'</b><br><span style="color:#9d6bb5">ALMA NEGRA ABSORVIDA — LATIDO INFERNAL DESBLOQUEADO</span><br><span style="color:#bfd8e8">BÊNÇÃO ÚNICA: MANTO DAS ALMAS — +35% almas · +15% dano · +1 coração</span>';
}
showOv('win');
sfx.win();sfx.levelup();sfx.echo();
sparks(player.x,player.y,'#9d6bb5',40,320,.9,4,true);
sparks(player.x,player.y,'#c9a0ff',24,240,.7,3,true);
}
/* ============================================================
   ITENS ATIVOS — sistema unificado (v0.9.3)
   O jogador pode segurar apenas 1 item ativo por run.
   Pegar outro item ativo faz o atual dropar no chão.
   Ativado pela tecla configurada em "ITEM ATIVO" (padrão: Espaço).
   ============================================================ */
const ACTIVE_ITEMS={
  /* v1.2.0: SINO DA ESCOLA — o item único do ato final. Um toque que
     atordoa TUDO na sala por 2.5s: o tempo da escola parou junto. */
  sino:{
    name:'SINO DA ESCOLA',desc:'um toque que atordoa todos os inimigos por 2.5s',
    cd:28,maxLv:1,
    activate:function(){
      shockwaves.push({x:player.x,y:player.y,r:0,vr:700,maxR:560,t:0,dur:.9,c:'#cfe9ff'});
      game.shake=Math.max(game.shake,10);game.flash=.35;
      try{sfx.gate();blip('sine',660,140,1.1,.22);blip('sine',330,70,1.4,.16,.12);}catch(e){}
      texts.push({x:player.x,y:player.y-54,txt:'SINO DA ESCOLA',t:0,life:1.2,c:'#cfe9ff',size:14,disp:true});
      for(const e of enemies){
        if(e.dead)continue;
        const d=dist(player.x,player.y,e.x,e.y);
        if(d<560){
          /* atordoado: 45% da velocidade e sem atirar enquanto o toque ecoa */
          e.slowT=Math.max(e.slowT||0,2.5);
          if(e.shootT!==undefined)e.shootT=Math.max(e.shootT,2.5);
          if(e.chargeT!==undefined)e.chargeT=Math.max(e.chargeT,1.5);
          e.flash=.5;
          sparks(e.x,e.y-14,'#cfe9ff',5,120,.5,2.5,true);
        }
      }
    }
  },
  /* v1.2.0→v1.2.1: FEIXE DO REI — a bênção ativa do rei caído. Um feixe real e
     AZUL atravessa TUDO à frente de Thor (inimigos, chefes, cabeças). */
  feixedorei:{
    name:'FEIXE DO REI',desc:'feixe real azul atravessa tudo à frente',
    cd:30,maxLv:1,
    activate:function(){
      const a=player.angle,LEN=760,dx=Math.cos(a),dy=Math.sin(a);
      const D=120*P.dmgMult;
      beamShots.push({x:player.x+dx*18,y:player.y+dy*18,a:a,len:LEN,w:30,t:0,life:.55,blue:true});
      beamShots.push({x:player.x+dx*18,y:player.y+dy*18,a:a,len:LEN*.6,w:46,t:.08,life:.7,blue:true});
      shockwaves.push({x:player.x,y:player.y,r:0,vr:900,maxR:260,t:0,dur:.5,c:'#a8d8ff'});
      game.shake=Math.max(game.shake,14);game.flash=.55;game.hitstop=.05;
      try{sfx.thunder();sfx.nova();blip('sawtooth',140,50,.7,.3);noiseSfx(.5,.3,900,'bandpass');}catch(e){}
      texts.push({x:player.x,y:player.y-56,txt:'FEIXE DO REI',t:0,life:1.2,c:'#a8d8ff',size:15,disp:true});
      for(const e of enemies){
        if(e.dead||e.spawnT<.4)continue;
        const ex=e.x-player.x,ey=e.y-player.y;
        const t=ex*dx+ey*dy;
        if(t<0||t>LEN)continue;
        const perp=Math.abs(-ex*dy+ey*dx);
        if(perp<34+(e.r||12)){
          if(!shadowInvuln(e)){
            if(!knightRedirectHorse(e,D)){e.hp-=D;e.flash=.9;e.hitT=.3;volatilCheck(e);if(e.hp<=0)killEnemy(e);}
            sparks(e.x,e.y,'#9fd4ff',10,240,.6,3.5,true);
          }
        }
      }
      if(boss.active&&!boss.dying&&!boss.introLock){
        for(const h of boss.heads){
          if(!h.alive)continue;
          const hx=h.hx-player.x,hy=h.hy-player.y;
          const t=hx*dx+hy*dy;
          if(t>0&&t<LEN&&Math.abs(-hx*dy+hy*dx)<40){hitHead(h,D*.8);h.flash=1;sparks(h.hx,h.hy,'#9fd4ff',10,220,.6,3.5,true);}
        }
      }
    }
  },
  latido:{
    name:'LATIDO INFERNAL',desc:'onda de impacto que empurra inimigos',
    cd:8,maxLv:1,
    activate:function(){
      const r=260;
      sparks(player.x,player.y,'#9d6bb5',30,380,1.2,5,true);
      sparks(player.x,player.y,'#c9a0ff',20,300,.9,4,true);
      shockwaves.push({x:player.x,y:player.y,r:0,vr:600,maxR:r,t:0,dur:.6,c:'#9d6bb5'});
      game.shake=Math.max(game.shake,18);game.flash=.5;game.hitstop=.06;
      blip('sawtooth',220,60,.5,.4);blip('square',90,40,.5,.3,.05);noiseSfx(.5,.4,800,'lowpass');
      texts.push({x:player.x,y:player.y-50,txt:'LATIDO INFERNAL',t:0,life:1.0,c:'#c9a0ff',size:14,disp:true});
      for(const e of enemies){
        if(e.dead)continue;
        const d=dist(player.x,player.y,e.x,e.y);
        if(d<r){
          const a=Math.atan2(e.y-player.y,e.x-player.x);
          const force=lerp(680,280,d/r);
          e.x+=Math.cos(a)*force*.16;e.y+=Math.sin(a)*force*.16;
          const before={x:e.x,y:e.y};clampArena(e,e.r);
          const wallHit=dist(before.x,before.y,e.x,e.y)>8;
          if(!shadowInvuln(e)){
            const dmg=wallHit?80:40;
            if(!knightRedirectHorse(e,dmg)){e.hp-=dmg;e.flash=.8;e.hitT=.3;if(e.hp<=0)killEnemy(e);}
          }
          if(wallHit){sparks(e.x,e.y,'#9d6bb5',10,260,.7,3,true);game.shake=Math.max(game.shake,8);}
        }
      }
      if(boss.active&&!boss.dying&&!boss.introLock){
        const d=dist(player.x,player.y,boss.x,boss.y);
        if(d<r){const a=Math.atan2(boss.y-player.y,boss.x-player.x);
          boss.x+=Math.cos(a)*120*.16;boss.y+=Math.sin(a)*120*.16;
          for(const h of boss.heads){if(!h.alive)continue;const hd=dist(player.x,player.y,h.hx,h.hy);if(hd<r){hitHead(h,30);h.flash=1;}}
        }
      }
    }
  },
  mundo:{
    name:'O MUNDO',desc:'pare o tempo por 3 segundos',
    cd:25,maxLv:1,
    activate:function(){
      /* v0.9.16: teto de segurança de 12s — o tempo parado é mecânica de jogo,
         nunca um travamento do motor. Tick único e centralizado no frame(). */
      game.worldT=Math.min(12,game.worldDur||3);
      sparks(player.x,player.y,'#ffd9a0',40,460,1.6,6,true);
      sparks(player.x,player.y,'#c9a0ff',30,380,1.2,5,true);
      shockwaves.push({x:player.x,y:player.y,r:0,vr:800,maxR:900,t:0,dur:1.0,c:'#ffd9a0'});
      game.shake=Math.max(game.shake,24);game.flash=.7;game.hitstop=.12;
      blip('sawtooth',180,40,1.2,.45);blip('square',1200,1600,.6,.18,.08);noiseSfx(.6,.35,400,'lowpass');
      texts.push({x:player.x,y:player.y-60,txt:'O MUNDO',t:0,life:1.4,c:'#ffd9a0',size:20,disp:true});
      texts.push({x:W/2,y:H*.28,txt:'O TEMPO PAROU',t:0,life:1.8,c:'#c9a0ff',size:16,disp:true});
    }
  },
  estrela:{
    name:'ESTRELA DA MANHÃ',desc:'invulnerabilidade + aura de dano por 5s',
    cd:30,maxLv:1,
    activate:function(){
      game.estrelaT=5;game.estrelaDur=5;
      player.inv=Math.max(player.inv,5);
      sparks(player.x,player.y,'#ffd9a0',36,340,1.4,5,true);
      shockwaves.push({x:player.x,y:player.y,r:0,vr:500,maxR:300,t:0,dur:.8,c:'#ffd9a0'});
      game.flash=.6;game.shake=14;
      blip('sine',440,880,.8,.3);blip('sine',880,1320,.6,.2,.3);
      texts.push({x:player.x,y:player.y-50,txt:'ESTRELA DA MANHÃ',t:0,life:1.2,c:'#ffd9a0',size:13,disp:true});
    }
  },
  trovao:{
    name:'TROVÃO DO JUÍZO',desc:'relâmpagos atingem todos os inimigos na tela',
    cd:20,maxLv:1,
    activate:function(){
      const n=Math.min(enemies.length,12);
      for(let i=0;i<n;i++){
        const e=enemies[i];if(e.dead)continue;
        bolts.push({x:e.x,y:e.y,t:0,life:.3,seed:rnd(10)});
        const dmg=80*P.dmgMult;
        if(!shadowInvuln(e)){if(!knightRedirectHorse(e,dmg)){e.hp-=dmg;e.flash=.15;volatilCheck(e);if(e.hp<=0)killEnemy(e);}}
        sparks(e.x,e.y,'#cfe9ff',8,220,.5,3,true);
      }
      if(boss.active&&!boss.dying){
        for(const h of boss.heads){if(!h.alive)continue;bolts.push({x:h.hx,y:h.hy,t:0,life:.3,seed:rnd(10)});hitHead(h,60*P.dmgMult);}
      }
      sfx.thunder();game.shake=Math.max(game.shake,16);game.flash=.5;
      blip('sawtooth',200,60,.6,.3);
      texts.push({x:player.x,y:player.y-50,txt:'TROVÃO DO JUÍZO',t:0,life:1.0,c:'#cfe9ff',size:14,disp:true});
    }
  },
  furia:{
    name:'FÚRIA DO POSSESSO',desc:'velocidade de ataque +90% e dano +50% por 6s',
    cd:28,maxLv:1,
    activate:function(){
      game.furiaT=6;game.furiaDur=6;
      /* salva os valores base e aplica os bônus */
      if(!game._furiaBaseRate)game._furiaBaseRate=P.rateMult;
      if(!game._furiaBaseDmg)game._furiaBaseDmg=P.dmgMult;
      P.rateMult*=1.9;P.dmgMult*=1.5;
      sparks(player.x,player.y,'#ff4f4f',30,320,1.2,5,true);
      game.flash=.5;game.shake=12;
      blip('sawtooth',150,300,.8,.3);
      texts.push({x:player.x,y:player.y-50,txt:'FÚRIA BERSERKER',t:0,life:1.0,c:'#ff4f4f',size:14,disp:true});
    }
  },
  cura:{
    name:'LÁGRIMA DA PECADORA',desc:'cura completa + 1 coração máximo permanente',
    cd:35,maxLv:1,
    activate:function(){
      player.hp=player.maxHp;
      player.maxHp+=25;
      player.hp=player.maxHp;
      sparks(player.x,player.y,'#9fd8ff',36,300,1.2,5,true);
      sparks(player.x,player.y,'#ffffff',16,220,.8,4,true);
      game.flash=.4;sfx.heart();sfx.levelup();
      blip('sine',523,659,.4,.2);blip('sine',659,784,.4,.2,.2);
      texts.push({x:player.x,y:player.y-50,txt:'LÁGRIMA DA PECADORA',t:0,life:1.2,c:'#9fd8ff',size:13,disp:true});
      game.banner={type:'small',txt:'CORAÇÃO PLENO',sub:'+1 coração máximo — a lágrima cura tudo',t:0,dur:2};
    }
  },
  /* ==== v0.9.16: FORJA DE BUILDS — 12 novos itens ativos ==== */
  nevasca:{
    name:'ANEL DO INVERNO ETERNO',desc:'onda gélida congela todos os inimigos próximos por 4s',
    cd:22,maxLv:1,
    activate:function(){
      const r=340;
      shockwaves.push({x:player.x,y:player.y,r:0,vr:520,maxR:r,t:0,dur:.7,c:'#9fd8ff'});
      sparks(player.x,player.y,'#9fd8ff',26,300,.9,4,true);
      blip('sine',900,180,.7,.25);noiseSfx(.5,.2,600,'highpass');
      for(const e of enemies){
        if(e.dead)continue;
        if(dist(player.x,player.y,e.x,e.y)<r){
          e.slowT=Math.max(e.slowT,4);e.flash=.3;
          sparks(e.x,e.y,'#cfe9ff',6,160,.5,3,true);
        }
      }
      texts.push({x:player.x,y:player.y-50,txt:'ANEL DO INVERNO ETERNO',t:0,life:1.1,c:'#9fd8ff',size:14,disp:true});
    }
  },
  ampulheta:{
    name:'AMPULHETA QUEBRADA',desc:'dilata o tempo: inimigos e balas andam a 40% por 6s',
    cd:26,maxLv:1,
    activate:function(){
      /* v0.9.16: tempo DILATADO (não parado) — integrado ao laço, sem travar */
      game.slowMoT=6;game.slowMoDur=6;
      shockwaves.push({x:player.x,y:player.y,r:0,vr:700,maxR:900,t:0,dur:.9,c:'#c9a0ff'});
      sparks(player.x,player.y,'#c9a0ff',34,420,1.2,5,true);
      blip('sine',300,1400,.9,.25);blip('sine',1400,300,.9,.2,.4);
      texts.push({x:W/2,y:H*.28,txt:'O TEMPO DILA',t:0,life:1.6,c:'#c9a0ff',size:16,disp:true});
      texts.push({x:player.x,y:player.y-50,txt:'AMPULHETA QUEBRADA',t:0,life:1.2,c:'#c9a0ff',size:13,disp:true});
    }
  },
  portal:{
    name:'PORTA DAS SOMBRAS',desc:'teleporta thor na direção do olhar e deixa uma bomba de sombra',
    cd:14,maxLv:1,
    activate:function(){
      const a=player.angle;
      const ox=player.x,oy=player.y;
      const tx=clamp(player.x+Math.cos(a)*290,ROOM.x+30,ROOM.x+ROOM.w-30);
      const ty=clamp(player.y+Math.sin(a)*290,ROOM.y+30,ROOM.y+ROOM.h-30);
      sparks(ox,oy,'#9d6bb5',18,240,.7,4,true);
      /* bomba de sombra: telegraph que detona no local de origem */
      telegraphs.push({x:ox,y:oy,r:96,t:0,dur:.75,c:'#9d6bb5',shape:'circle',cb:function(){
        explodeAt(ox,oy,96,60*P.dmgMult);
        for(const e of enemies){if(!e.dead&&dist(ox,oy,e.x,e.y)<96){e.slowT=Math.max(e.slowT,1.4);}}
        shockwaves.push({x:ox,y:oy,r:0,vr:520,maxR:110,t:0,dur:.4,c:'#9d6bb5'});
        game.shake=Math.max(game.shake,9);sfx.explode();
      }});
      player.x=tx;player.y=ty;player.inv=Math.max(player.inv,.6);
      sparks(tx,ty,'#c9a0ff',18,240,.7,4,true);
      blip('sawtooth',700,120,.35,.25);noiseSfx(.25,.18,900,'bandpass');
      texts.push({x:tx,y:ty-36,txt:'PORTA DAS SOMBRAS',t:0,life:.9,c:'#c9a0ff',size:12,disp:true});
    }
  },
  corvos:{
    name:'MURMÚRIO DOS CORVOS',desc:'invoca 2 corvos espirituais que caçam por 8s',
    cd:30,maxLv:1,
    activate:function(){
      for(let i=0;i<2;i++){
        actMinions.push({kind:'crow',x:player.x+rnd(-30,30),y:player.y+rnd(-30,30),t:0,life:8,atkT:0,ang:rnd(TAU),ph:rnd(TAU)});
      }
      sparks(player.x,player.y,'#8a7d6c',20,260,.8,4,true);
      blip('sawtooth',180,420,.5,.2);blip('sawtooth',150,380,.5,.15,.15);
      texts.push({x:player.x,y:player.y-50,txt:'MURMÚRIO DOS CORVOS',t:0,life:1.1,c:'#8a7d6c',size:13,disp:true});
    }
  },
  escudo:{
    name:'ÉGIDE DO PACTO',desc:'bloqueia os próximos 3 golpes durante 12s',
    cd:26,maxLv:1,
    activate:function(){
      game.shieldHits=3;game.shieldT=12;
      shockwaves.push({x:player.x,y:player.y,r:0,vr:420,maxR:200,t:0,dur:.5,c:'#ffd9a0'});
      sparks(player.x,player.y,'#ffd9a0',22,260,.8,4,true);
      sfx.parry();blip('sine',520,780,.3,.2);
      texts.push({x:player.x,y:player.y-50,txt:'ÉGIDE DO PACTO',t:0,life:1.1,c:'#ffd9a0',size:13,disp:true});
    }
  },
  girassol:{
    name:'SEMENTE DA VIDA',desc:'regenera 40% do coração máximo ao longo de 5s',
    cd:24,maxLv:1,
    activate:function(){
      game.regenT=5;game.regenDur=5;game.regenAcc=0;
      game.regenTotal=Math.max(1,Math.round(player.maxHp*.4));
      sparks(player.x,player.y,'#a8c24f',24,280,.9,4,true);
      blip('sine',523,784,.5,.18);blip('sine',659,988,.5,.14,.25);
      texts.push({x:player.x,y:player.y-50,txt:'SEMENTE DA VIDA',t:0,life:1.1,c:'#a8c24f',size:13,disp:true});
    }
  },
  piroclismo:{
    name:'PIROCLASMO',desc:'três ondas flamejantes incendeiam tudo ao redor',
    cd:18,maxLv:1,
    activate:function(){
      for(let i=0;i<3;i++){
        const delay=i*.28;
        telegraphs.push({x:player.x,y:player.y,r:130+i*90,t:delay,dur:delay+.45,c:'#ff8f3d',shape:'circle',cb:function(){
          explodeAt(player.x,player.y,130+i*90,(46+i*18)*P.dmgMult);
          for(const e of enemies){if(!e.dead&&dist(player.x,player.y,e.x,e.y)<130+i*90){e.burnT=Math.max(e.burnT||0,2.5);e.burnD=Math.max(e.burnD||0,3*P.dmgMult);}}
          shockwaves.push({x:player.x,y:player.y,r:0,vr:600,maxR:130+i*90,t:0,dur:.45,c:'#ff8f3d'});
          sfx.boom();game.shake=Math.max(game.shake,12);
        }});
      }
      game.flash=Math.max(game.flash,.4);game.shake=Math.max(game.shake,14);
      blip('sawtooth',220,60,.7,.3);noiseSfx(.6,.25,500,'lowpass');
      texts.push({x:player.x,y:player.y-50,txt:'PIROCLASMO',t:0,life:1.1,c:'#ff8f3d',size:14,disp:true});
    }
  },
  decreto:{
    name:'DECRETO DO ABISMO',desc:'inimigos na sala ficam frágeis — recebem +40% de dano por 8s',
    cd:28,maxLv:1,
    activate:function(){
      game.fragilT=8;game.fragilDur=8;
      shockwaves.push({x:player.x,y:player.y,r:0,vr:640,maxR:900,t:0,dur:.8,c:'#5a4a55'});
      for(const e of enemies){if(!e.dead)e.flash=.4;}
      blip('sawtooth',110,55,.8,.3);noiseSfx(.7,.3,300,'lowpass');
      texts.push({x:W/2,y:H*.28,txt:'DECRETO DO ABISMO',t:0,life:1.5,c:'#b892c9',size:15,disp:true});
    }
  },
  imagem:{
    name:'IMAGEM ESPELHADA',desc:'um eco seu atrai os demônios por 5s enquanto você desaparece',
    cd:22,maxLv:1,
    activate:function(){
      game.decoyT=5;game.decoyDur=5;
      actMinions.push({kind:'decoy',x:player.x,y:player.y,t:0,life:5});
      sparks(player.x,player.y,'#cfe9ff',20,280,.7,4,true);
      blip('sine',800,400,.4,.2);blip('sine',400,800,.4,.14,.2);
      texts.push({x:player.x,y:player.y-50,txt:'IMAGEM ESPELHADA',t:0,life:1.1,c:'#cfe9ff',size:13,disp:true});
    }
  },
  municao:{
    name:'MUNIÇÃO ÉTERICA',desc:'por 8s seus tiros atravessam o primeiro inimigo',
    cd:20,maxLv:1,
    activate:function(){
      game.etShotT=8;game.etShotDur=8;
      sparks(player.x,player.y,'#4ff5ff',20,260,.7,4,true);
      blip('sine',1200,600,.35,.18);blip('sine',600,1200,.35,.14,.18);
      texts.push({x:player.x,y:player.y-50,txt:'MUNIÇÃO ÉTERICA',t:0,life:1.1,c:'#4ff5ff',size:13,disp:true});
    }
  },
  forma:{
    name:'FORMA DA FERA',desc:'transformação: 6s de +40% velocidade e mordida 60% mais forte',
    cd:30,maxLv:1,
    activate:function(){
      game.transfT=6;game.transfDur=6;
      if(!game._transfSpd){game._transfSpd=P.speedMult;game._transfDmg=P.dmgMult;}
      P.speedMult=game._transfSpd*1.4;P.dmgMult=game._transfDmg*1.35;
      sparks(player.x,player.y,'#ff4f4f',34,360,1.1,5,true);
      sfx.roar();game.shake=Math.max(game.shake,16);game.flash=.45;
      blip('sawtooth',90,220,.8,.35);blip('sawtooth',120,280,.8,.25,.1);
      texts.push({x:W/2,y:H*.28,txt:'A FERA DESPERTA',t:0,life:1.6,c:'#ff4f4f',size:17,disp:true});
    }
  },
  meteoro:{
    name:'CHAMADO DO PRIMEIRO FOGO',desc:'marca o chão e chama 4 meteoros sobre os demônios',
    cd:24,maxLv:1,
    activate:function(){
      let n=0;
      for(const e of enemies){
        if(e.dead||n>=4)continue;
        n++;
        const mx=e.x,my=e.y;
        telegraphs.push({x:mx,y:my,r:90,t:0,dur:.8,c:'#ff8f3d',shape:'circle',meteor:true,cb:function(){
          explodeAt(mx,my,90,95*P.dmgMult);
          for(const o of enemies){if(!o.dead&&dist(mx,my,o.x,o.y)<90){o.burnT=Math.max(o.burnT||0,2.4);o.burnD=Math.max(o.burnD||0,3.2*P.dmgMult);}}
          for(let i=0;i<14;i++)particles.push({x:mx+rnd(-30,30),y:my-260,vx:rnd(-30,30),vy:rnd(300,520),life:.5,t:0,r:rnd(2,4),c:'#ff8f3d',drag:.98,glow:true});
          sfx.boom();game.shake=Math.max(game.shake,10);
        }});
      }
      if(!n){texts.push({x:player.x,y:player.y-40,txt:'não há demônios para chamar',t:0,life:.9,c:'#9c8f7c',size:11,disp:true});return;}
      sfx.thunder();game.flash=Math.max(game.flash,.3);
      texts.push({x:player.x,y:player.y-50,txt:'CHAMADO DO PRIMEIRO FOGO',t:0,life:1.2,c:'#ff8f3d',size:13,disp:true});
    }
  }
};
/* tenta ativar o item ativo atual */
function tryActiveItem(){
  if(!game.activeItem||player.dead)return;
  const item=ACTIVE_ITEMS[game.activeItem];
  if(!item)return;
  if(game.activeCd>0)return;
  game.activeCd=item.cd;
  game.actUses++;/* v0.9.16: contagem para conquista */
  META.actUses=(META.actUses||0)+1;
  item.activate();
}
/* ============================================================
   v0.9.16: MOTOR DE EFEITOS DOS ATIVOS + TELEGRÁFICOS + MINIONS
   Tudo integrado ao laço principal (updatePlay chama a cada frame).
   Nada aqui usa setTimeout — duração controlada por contadores dt.
   ============================================================ */
function updateActiveFx(dt){
/* v1.1.0: altar de sacrifício rearma sozinho — sacrifício repetível na mesma sala */
if(game.sacrificeAltar&&game.sacrificeAltar.used){
game.sacrificeAltar.cd=(game.sacrificeAltar.cd||0)-dt;
if(game.sacrificeAltar.cd<=0)game.sacrificeAltar.used=false;
}
/* v1.1.0: SENTENÇA DA LUXÚRIA — quem se aproxima do pecador hesita */
if(game.sinLuxuria){
for(let _i=0;_i<enemies.length;_i++){const en=enemies[_i];if(!en.dead&&dist(en.x,en.y,player.x,player.y)<190)en.slowT=Math.max(en.slowT||0,.25);}
}
/* v1.1.0: SENTENÇA DA PREGUIÇA — imóvel por 1s, a carne repousa e cura */
if(game.sinAcidia&&!player.dead){
const imovel=!keys['KeyW']&&!keys['KeyA']&&!keys['KeyS']&&!keys['KeyD']&&!keys['ArrowLeft']&&!keys['ArrowRight']&&!keys['ArrowUp']&&!keys['ArrowDown']&&Math.abs(player.mvx||0)+Math.abs(player.mvy||0)<.01;
game._acT=imovel?(game._acT||0)+dt:0;
if(game._acT>1)player.hp=Math.min(player.maxHp,player.hp+2*dt);
}
/* v0.9.16: mensagem de especialização em 2 atos (nunca setTimeout) */
if(game.specMsg)processSpecMsg(dt);
/* ÉGIDE — expira */
if(game.shieldT>0){
  game.shieldT-=dt;
  if(game.shieldT<=0)game.shieldHits=0;
}
/* SEMENTE DA VIDA — regeneração contínua */
if(game.regenT>0){
  game.regenT-=dt;
  game.regenAcc+=dt*(game.regenTotal||40)/(game.regenDur||5);
  if(game.regenAcc>=1){
    const heal=Math.floor(game.regenAcc);game.regenAcc-=heal;
    if(player.hp<player.maxHp&&!player.dead){
      player.hp=Math.min(player.maxHp,player.hp+heal);
      if(Math.random()<.3)sparks(player.x+rnd(-10,10),player.y+rnd(-10,10),'#a8c24f',2,60,.4,2,true);
    }
  }
  if(game.regenT<=0)game.regenAcc=0;
}
/* DECRETO DO ABISMO */
if(game.fragilT>0)game.fragilT-=dt;
/* IMAGEM ESPELHADA */
if(game.decoyT>0)game.decoyT-=dt;
/* MUNIÇÃO ÉTERICA */
if(game.etShotT>0)game.etShotT-=dt;
/* FORMA DA FERA — devolve os multiplicadores ao expirar */
if(game.transfT>0){
  game.transfT-=dt;
  if(game.transfT<=0&&game._transfSpd){
    P.speedMult=game._transfSpd;P.dmgMult=game._transfDmg;
    game._transfSpd=0;game._transfDmg=0;
    sparks(player.x,player.y,'#ff4f4f',12,200,.6,3,true);
    texts.push({x:player.x,y:player.y-40,txt:'a fera adormece',t:0,life:.9,c:'#9c8f7c',size:10,disp:true});
  }
}
}
/* telegráficos: aviso visual + som antes da detonação — congelam com O MUNDO */
function updateTelegraphs(dt){
for(let i=telegraphs.length-1;i>=0;i--){
  const tg=telegraphs[i];
  if(dt>0)tg.t+=dt;
  if(!tg.warned&&tg.t>=tg.dur*.45){tg.warned=true;blip('square',680,240,.12,.08);}
  if(tg.t>=tg.dur){
    telegraphs.splice(i,1);
    if(tg.cb){try{tg.cb();}catch(e){}}
  }
}
}
/* minions temporários (corvos / imagem espelhada) */
function updateActMinions(dt){
for(let i=actMinions.length-1;i>=0;i--){
  const m=actMinions[i];
  m.t+=dt;m.life-=dt;m.atkT-=dt;
  if(m.life<=0||player.dead){sparks(m.x,m.y,'#c9a0ff',8,160,.5,3,true);actMinions.splice(i,1);continue;}
  if(m.kind==='crow'){
    /* caça o inimigo vivo mais próximo */
    let tgt=null,bd=1e9;
    for(const e of enemies){if(e.dead)continue;const d=dist(m.x,m.y,e.x,e.y);if(d<bd){bd=d;tgt=e;}}
    if(boss.active&&!boss.dying&&boss.heads[0]&&boss.heads[0].alive){const h=boss.heads[0];const d=dist(m.x,m.y,h.hx,h.hy);if(d<bd){bd=d;tgt={x:h.hx,y:h.hy,head:h,r:h.r};}}
    if(tgt){
      const tx=tgt.x,ty=tgt.y;
      const a=Math.atan2(ty-m.y,tx-m.x);
      m.ang=lerpAngle(m.ang,a,1-Math.exp(-6*dt));
      m.x+=Math.cos(m.ang)*300*dt;m.y+=Math.sin(m.ang)*300*dt;
      if(bd<24&&m.atkT<=0){
        m.atkT=.5;
        const dmg=26*P.dmgMult;
        if(tgt.head){tgt.head.hp-=dmg;tgt.head.flash=.15;dmgText(tx+rnd(-8,8),ty-16,dmg);if(tgt.head.hp<=0)killHead(tgt.head);}
        else if(!shadowInvuln(tgt)&&!knightRedirectHorse(tgt,dmg)){tgt.hp-=dmg;tgt.flash=.15;if(tgt.hp<=0)killEnemy(tgt);}
        sparks(tx,ty,'#8a7d6c',5,140,.4,3,true);blip('sawtooth',420,200,.08,.07);
      }
    }else{
      /* sem alvo: orbita thor */
      m.ph+=dt*2.2;
      m.x=lerp(m.x,player.x+Math.cos(m.ph)*70,1-Math.exp(-3*dt));
      m.y=lerp(m.y,player.y+Math.sin(m.ph)*70,1-Math.exp(-3*dt));
    }
    if(Math.random()<dt*6)particles.push({x:m.x,y:m.y,vx:rnd(-8,8),vy:rnd(-4,4),life:.3,t:0,r:2,c:'rgba(138,125,108,.6)',drag:1,glow:true});
  }else if(m.kind==='decoy'){
    /* puxa inimigos próximos para o eco */
    for(const e of enemies){
      if(e.dead)continue;
      const d=dist(m.x,m.y,e.x,e.y);
      if(d<300&&d>40){
        const a=Math.atan2(m.y-e.y,m.x-e.x);
        e.x+=Math.cos(a)*60*dt;e.y+=Math.sin(a)*60*dt;
      }
    }
    if(Math.random()<dt*10)particles.push({x:m.x+rnd(-14,14),y:m.y+rnd(-14,14),vx:0,vy:rnd(-20,-8),life:.4,t:0,r:2,c:'rgba(207,233,255,.5)',drag:1,glow:true});
  }
}
}
/* tenta pegar um item ativo — se já tem um, dropa o atual no chão */
function pickupActiveItem(id){
  if(!ACTIVE_ITEMS[id])return;
  /* se já tem um item ativo diferente, dropa o atual */
  if(game.activeItem&&game.activeItem!==id){
    /* v1.3.1: o item dropado é ARREMESSADO para fora do corpo (fora do raio
       de coleta) e fica 2 SEGUNDOS sem poder ser repégado —
       o loop de "pegou muitas vezes" morreu aqui. */
    const ta=(player.mvx||player.mvy)?Math.atan2(player.mvy,player.mvx):player.angle;
    pickups.push({type:'active_drop',activeId:game.activeItem,x:player.x+Math.cos(ta)*46+rnd(-8,8),y:player.y+Math.sin(ta)*46+rnd(-8,8),t:0,ph:rnd(TAU),noPickT:2});
    texts.push({x:player.x,y:player.y-40,txt:'DROP: '+ACTIVE_ITEMS[game.activeItem].name,t:0,life:1.2,c:'#d9465a',size:11,disp:true});
  }
  game.activeItem=id;
  game.activeCd=0;
  game.activeMaxCd=ACTIVE_ITEMS[id].cd;
  /* notificação */
  texts.push({x:player.x,y:player.y-50,txt:'ITEM ATIVO: '+ACTIVE_ITEMS[id].name,t:0,life:1.6,c:'#ffd9a0',size:12,disp:true});
  sfx.levelup();sparks(player.x,player.y,'#ffd9a0',14,220,.6,3,true);
}
/* ============================================================
   BOSSES FUTUROS — sala de testes para bosses de círculos vindouros.
   Acessível pelo botão BOSSES FUTUROS na tela de vitória do Caronte.
   Não faz parte da progressão normal.
   ============================================================ */
const FUTURE_BOSSES=[
  {id:'cerberus',name:'CÉRBERO',desc:'três cabeças, três gargantas. o antigo guardião — movido da progressão final.'},
  {id:'cerberus_rm',name:'CÉRBERO — A SENTENÇA FINAL',desc:'a forma branca do Cérbero remasterizado: transformação, três pescoços e bullet hell carmesim em 4 etapas.'},
  {id:'cw1',name:'CAVALEIRO DA CONQUISTA',desc:'cavaleiro branco do apocalipse — conteúdo futuro.'},
  {id:'cw2',name:'CAVALEIRO DA GUERRA',desc:'cavaleiro vermelho — projéteis e armas invocadas.'},
  {id:'cw3',name:'CAVALEIRO DA FOME',desc:'cavaleiro negro — devora e copia poderes.'},
  {id:'cw4',name:'CAVALEIRO DA MORTE',desc:'cavaleiro descorado — o mais difícil. hitkills com sinais.'},
  {id:'rk',name:'O VELHO REI',desc:'chefe de xadrez secreto — seis dele na fase II.'},
  {id:'e404',name:'ERRO 404',desc:'a sala que não deveria existir — glitch puro.'},
  {id:'caronte',name:'CARONTE',desc:'reviver a batalha contra o barqueiro.'},
  {id:'observer',name:'O OBSERVADOR',desc:'ele vê tudo. ele sabe tudo. olhos que julgam.'}
];
function openFutureBosses(){
audio();
hideOv('win');
showOv('futureBosses');
const box=ov('futureBossesCards');
if(!box){console.error('openFutureBosses: futureBossesCards not found!');return;}
box.innerHTML='';
for(const b of FUTURE_BOSSES){
  const el=document.createElement('div');
  el.className='card';
  el.style.cssText='width:170px;padding:16px 12px 14px;background:rgba(13,9,11,.94);border:1px solid #574f45;cursor:pointer;text-align:center;font-family:IBM Plex Mono,monospace;transition:.16s';
  el.innerHTML='<div style="font-family:Pirata One,serif;font-size:16px;color:#e6dac4;margin-bottom:6px">'+b.name+'</div><div style="font-size:9px;color:#9c8f7c;line-height:1.5;margin-bottom:8px">'+b.desc+'</div><div style="font-size:8px;color:#9d6bb5;letter-spacing:.2em">CLIQUE PARA INVOCAR</div>';
  el.addEventListener('mouseenter',function(){this.style.borderColor='#9d6bb5';this.style.transform='translateY(-4px)';});
  el.addEventListener('mouseleave',function(){this.style.borderColor='#574f45';this.style.transform='';});
  el.addEventListener('click',function(){
    audio();
    invokeFutureBoss(b.id);
  });
  box.appendChild(el);
}
}
function invokeFutureBoss(id){
hideOv('futureBosses');
game.state='play';
game.futureBossMode=true;
/* prepara a arena */
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
buildRoomFloor();buildDoors();
game.doors=[];game.portal=null;
game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
player.x=W/2;player.y=H*.8;player.mvx=0;player.mvy=0;player.angle=-Math.PI/2;
enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];texts=[];
thrownSaw=null;lightBeam=null;
game.banner={type:'boss',txt:'LABORATÓRIO DE BOSSES',sub:'conteúdo futuro — derrotar não avança a progressão',t:0,dur:2.6};
sfx.rumble();
if(id==='cerberus'){
  /* v1.4.1: no laboratório o Cérbero antigo continua EXATAMENTE como sempre —
     a flag _cerbFight fica FORA para a SENTENÇA FINAL nunca assumir aqui
     (protege contra flag que sobra de uma sentença anterior no lab) */
  game._cerbFight=false;
  /* v1.4.1: defesa simétrica — se uma SENTENÇA estivesse em andamento, ela é
     revogada em silêncio (nunca duas formas lutando juntas no lab) */
  if(window.__RM&&window.__RM.c3){window.__RM.c3=null;game._rmSent=0;
    for(let i=ebullets.length-1;i>=0;i--)if(ebullets[i].rm)ebullets.splice(i,1);}
  resetBoss();boss.active=true;boss.introLock=false;boss.scale=1;
  boss.x=W/2;boss.y=H*.35;boss.angle=Math.PI/2;
  for(const h of boss.heads){
    h.wake=1;const a=boss.angle+h.baseAng;
    h.hx=boss.x+Math.cos(a)*175;h.hy=boss.y+Math.sin(a)*175;h.face=Math.PI/2;
  }
  game.state='bossintro';
}else if(id==='cerberus_rm'){
  /* v1.4.1: o CÉRBERO remasterizado direto no laboratório — a silhueta antiga
     derrete em luz branca (5,4s) e A SENTENÇA FINAL assume com o bullet hell */
  resetBoss();boss.active=false;
  boss.x=W/2;boss.y=H*.42;boss.angle=Math.PI/2;
  for(let i=ebullets.length-1;i>=0;i--)if(ebullets[i].rm)ebullets.splice(i,1);
  if(window.__RM&&window.__RM.startSentenca&&window.__RM.startSentenca(W/2,H*.42)){
    game.banner={type:'boss',txt:'LABORATÓRIO DE BOSSES',sub:'conteúdo futuro — derrotar não avança a progressão',t:0,dur:2.6};
  }
}else if(id==='caronte'){
  startCaronteBossFight();
}else if(id==='observer'){
  startObserverBoss();
}else{
  /* spawn como inimigo */
  spawnEnemy(id,W/2,H*.35);
}
}
function takeDarkSoul(){
game.endPhase='bless';game.endT=0;game.darkSoul=null;
player.maxHp=Math.max(player.maxHp,120);
player.hp=player.maxHp;
P.dmgMult*=1.5;
P.lightning=Math.max(P.lightning,3);
game.flash=.7;game.shake=14;game.hitstop=.12;
sfx.levelup();sfx.win();
sparks(player.x,player.y,'#9d6bb5',26,300,.9,4,true);
sparks(player.x,player.y,'#c9a0ff',14,220,.7,3,true);
game.banner={type:'circle',txt:'BÊNÇÃO FINAL',name:'ALMA DO CÉRBERO',sub:'dano +50% · relâmpagos triplos · um coração a mais',t:0,dur:3.2};
}
function gateAnimE(){
const t=game.endT,ph=game.endPhase;
if(ph==='gate')return{a:smooth(ramp(t,0,.65)),o:ramp(t,.65,1.7),f:1};
if(ph==='enter')return{a:1,o:1,f:1};
if(ph==='closing')return{a:1,o:1-ramp(t,0,1),f:1};
return{a:1,o:0,f:1-ramp(t,0,.8)};
}
/* v1.5.4: A SEGUNDA DESCIDA — no fim da arena, no lugar do portão do inferno,
   uma ESCADA fria e grande desce para o corredor azulado (→ Caronte → Limbo).
   Irmã maior da escada do frio da Garganta: mesmo desenho, escala de arena. */
function drawDescentStairE(){
const t=game.endT,ph=game.endPhase;
if(ph!=='gate'&&ph!=='enter'&&ph!=='closing'&&ph!=='closed')return;
let a=1,f=1;
if(ph==='gate')a=smooth(ramp(t,0,.65));
if(ph==='closing')f=1-ramp(t,0,1);
if(ph==='closed')f=Math.max(0,1-ramp(t,0,.8));
if(a<=0||f<=0)return;
const x=GATE.x,y=GATE.y+110,w=176,h=104;
ctx.save();ctx.globalAlpha=f;ctx.translate(x,y);ctx.scale(a,a);
/* o vão da escada — escuridão fria descendo */
ctx.fillStyle='#02050c';ctx.fillRect(-w/2,-h/2,w,h);
for(let i=0;i<6;i++){
 const dw=w-16-i*22;
 ctx.fillStyle='rgba(8,18,34,'+(.55+i*.09)+')';
 ctx.fillRect(-dw/2,-h/2+8+i*14,dw,11);
}
/* os degraus somem no escuro do fundo */
const dg=ctx.createLinearGradient(0,-h/2,0,h/2);
dg.addColorStop(0,'rgba(0,0,0,0)');dg.addColorStop(1,'rgba(1,3,8,.94)');
ctx.fillStyle=dg;ctx.fillRect(-w/2,-h/2,w,h);
ctx.strokeStyle='#3f6d9e';ctx.lineWidth=3;ctx.strokeRect(-w/2,-h/2,w,h);
const p=.5+.5*Math.sin(game.t*3);
ctx.globalAlpha=f*(.3+.3*p);
ctx.strokeStyle='#7fb8ff';ctx.lineWidth=2;
ctx.strokeRect(-w/2+5,-h/2+5,w-10,h-10);
ctx.globalAlpha=f;
ctx.fillStyle='#bfd8e8';ctx.font='10px IBM Plex Mono';ctx.textAlign='center';
ctx.fillText('A SEGUNDA DESCIDA',0,h/2+15);
ctx.restore();
}
/* ============ lógica da sala atual ============ */
function roomLogic(dt){
if(game.roomKind==='boss')return;
if(game.futureBossMode)return; /* v0.9.0: laboratório de bosses — sem lógica de sala */
const r=game.mapRooms[game.roomIdx];
if(!r||!needsClear(r.kind)||r.cleared)return;
game.waveT+=dt;
if(game.waveState==='intro'){
if(game.waveT>1.0)game.waveState='spawning';
}else if(game.waveState==='spawning'){
const hold=miniBossAny()||e404Any()||reiAny()||knightAny();
if(!hold){
game.spawnT-=dt;
if(game.spawnT<=0&&game.roomQueue.length){
/* v0.9.1: spawn mais lento — menos inimigos por sala no começo */
game.spawnT=clamp((game.hard?1.05:1.45)-game.threat*.05,game.hard?.35:.48,game.hard?1.8:2.4);
spawnMarkAt(game.roomQueue.pop());
}
}
if(!game.roomQueue.length)game.waveState='clearing';
}else if(game.waveState==='clearing'){
if(!enemies.length&&!spawnMarks.length&&!miniBossAny()&&!e404Any()&&!reiAny()&&!knightAny())roomCleared();
}
}
function collectRoomPickups(){
let souls=0,hearts=0;
for(const p of pickups){if(p.type==='soul')souls++;else if(p.type==='heart')hearts++;}
/* v0.9.16 sinergia LUZ VITAL — corações curam o dobro */
const heartMul=game.psyn.luzvital?2:1;
if(hearts>0&&player.hp<player.maxHp){player.hp=Math.min(player.maxHp,player.hp+hearts*25*heartMul);sfx.heart();}
/* v1.6.0: A VARREDURA NÃO APAGA MAIS ITENS — bênçãos, pactos (itens ativos),
   fagulhas e a própria alma/vida continuam no chão quando a sala limpa.
   Baú, alma do rei e relíquia do cavaleiro seguem como eram. */
pickups=pickups.filter(function(p){return p.type==='chest'||p.type==='kingsoul'||p.type==='knightrelic'||p.type==='blessing_drop'||p.type==='active_drop'||p.type==='fagulha'||p.type==='soul'||p.type==='heart';});
if(souls>0)gainSouls(souls);
}
function roomCleared(){
const r=game.mapRooms[game.roomIdx];
if(!r||r.cleared)return;
r.cleared=true;
game.waveState='done';
collectRoomPickups();
openDoors();
/* v0.9.6: CORAÇÃO FALSO — v1.9.0: nunca mais tira vida. Agora ele PESA:
   cadência reduzida por 4s a cada sala limpa (drenagem removida). */
if(game.up.coracaofalso){
  game.gri_falsoT=4;
  texts.push({x:player.x,y:player.y-30,txt:'o coração falso pesa (cadência -33% · 4s)',t:0,life:1,c:'#d9465a',size:11,disp:true});
}
/* ==== v0.9.0: se o jogador recusou Caronte antes, o portal do miniboss
   o leva de volta ao encontro com o barqueiro. ==== */
if(game.caronteReturn&&r.kind==='miniboss'){
r.hasPortal=true;
game.portal={x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0};
game.banner={type:'boss',txt:'O PORTAL CHAMA',sub:'o rio escuro aguarda — Caronte está de volta',t:0,dur:2.8};
sfx.rumble();sfx.echo();sfx.growl();
game.shake=12;game.flash=.3;
}else if(r.kind==='miniboss'&&(game.caronteReturn||(game.region==='limbo'?(game.limboPhase||1)<4:(game.region==='penumbra'&&game.floor<4)))){ /* v1.3.1: sem portal fantasma na Penumbra Infernal/Garganta — o fim dessas zonas é a varredura */
r.hasPortal=true;
game.portal={x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0};
/* v0.9.1: mensagem diferente no andar 3 (Caronte aguarda) */
if(game.floor===3){
  game.banner={type:'boss',txt:'O RIO ESCURO AGUARDA',sub:'o portal chama — Caronte espera no barco',t:0,dur:2.8};
}else{
  game.banner={type:'boss',txt:'O CHEFE DO MAPA CAIU',sub:'o portal para a descida '+roman(game.floor+1)+' se abriu',t:0,dur:2.8};
}
sfx.rumble();sfx.echo();sfx.growl();
game.shake=12;game.flash=.3;
}else if(r.kind==='challenge'){
/* v0.9.9: completar a sala de desafio GARANTE o item do andar (do 2º em diante) —
   um baú com curva de raridade; no andar 1 fica o bônus probabilístico */
/* v1.2.0: o desafio SEMPRE paga — baú de butim + uma bênção/item à vista */
r.chestDropped=true;
pickups.push({type:'chest',x:game.absMain.x+game.absMain.w/2-34,y:game.absMain.y+game.absMain.h*.42,t:0,ph:rnd(TAU),curve:'peito'});
dropRandomBlessing(game.absMain.x+game.absMain.w/2+34,game.absMain.y+game.absMain.h*.42,'peito');
/* v0.9.5: menos mensagens ao trocar de sala */
game.banner={type:'small',txt:'',sub:'',t:0,dur:.1};
}else if(r.kind==='sboss'){
game.banner={type:'small',txt:'',sub:'',t:0,dur:.1};
}else{
/* sala limpa — sem mensagem, apenas abre as portas */
game.banner=null;
}
game.shake=Math.max(game.shake,5);
checkFullSweep();
}
function enemyCount(){return game.roomQueue.length+spawnMarks.length+enemies.length;}
function miniBossAny(){return enemies.find(function(e){return(e.type==='mb'||e.type==='ex'||e.type==='vi'||e.type==='gz')&&!e.dead;});}
/* ============ loja & eventos ============ */
/* LOJA DO ERRANTE — NPC vendedor: aproxime-se e aperte INTERAGIR [Z].
   Vende corações, bênçãos, armas e itens por ALMAS (a nova moeda). */
const EVENT_LABEL={soulrain:'CHUVA DE ALMAS',frenzy:'DEMÔNIOS ENFURECIDOS',blood:'PACTO DE SANGUE',void:'O VÃO'};
function shopPrice(p,disc){/* v0.9.9: REGATEADOR -30% · v1.1.0: SENTENÇA DA AVAREZA -20% */return Math.round(p*(game.relicHaggler?.7:1)*(1-(game.sinDesconto||0))*(disc||1));}
function buildShop(){
game.shopItems=[];
const cx=game.absMain.x+game.absMain.w/2,cy=game.absMain.y+game.absMain.h*.5;
game.keeper={x:cx,y:cy,ph:rnd(TAU)};
/* v0.9.9: SORTE DO ERRANTE — o desconto agora existe SÓ dentro da loja, com sorte
   (25%). nada de "evento de preço" fora dela: eventos de sala seguem sendo só de
   combate (soulrain/frenzy/blood/void) e o desconto é exclusivo do ERRANTE. */
game.shopLuck=Math.random()<.25;
game.shopGiftDone=false;
const disc=game.shopLuck?.7:1;
/* v0.9.13→14: O ERRANTE — o básico continua barato e fraco, mas se ele
   oferecer algo FORTE (bênção rara q3 ou uma arma inteira), o preço em
   almas é BEM caro. */
game.shopItems.push({name:'CORAÇÃO',desc:'recupera 1 coração — se estiver cheio, ganha um permanente',price:shopPrice(12,disc),kind:'heart',bought:false});
/* v1.0.0: a FAGULHA EXPLOSIVA entra no estoque do ERRANTE — a porta rachada
   exige uma. Errar a compra é ficar fora dos segredos da descida. */
game.shopItems.push({name:'FAGULHA EXPLOSIVA',desc:'brasa explosiva — dispare com [Q]',price:shopPrice(16,disc),kind:'fagulha',bought:false});
const pool=UPGRADES.filter(u=>u.can()&&u.q<=2&&!u.id.startsWith('unlock')&&PACT_IDS.indexOf(u.id)<0); /* v1.9.0: pactos saíram do básico da feira */
for(let si=0;si<3&&pool.length;si++){
const u=pick(pool);pool.splice(pool.indexOf(u),1);
game.shopItems.push({name:u.name,desc:u.desc,price:shopPrice(14+si*4,disc),kind:'upg',up:u,bought:false});
}
const pool2=UPGRADES.filter(u=>u.can()&&u.q===3&&u.id!=='olho'&&(PACT_IDS.indexOf(u.id)<0||Math.random()<.25)); /* v1.9.0: pacto raro na feira só 25% das vezes */
/* v0.9.14: bênção RARA do ERRANTE — forte, então MUITO cara (90–135 almas) */
if(pool2.length&&Math.random()<.7){const u=pick(pool2);game.shopItems.push({name:u.name,desc:u.desc,price:shopPrice(90+irnd(0,45),disc),kind:'upg',up:u,strong:true,bought:false});}
if(!game.hasShot){const u=UPGRADES.find(x=>x.id==='unlockShot');if(u)game.shopItems.push({name:'ARMA: TROVÃO À DISTÂNCIA',desc:'desbloqueia o tiro — projéteis que caçam à distância',price:shopPrice(140,disc),kind:'upg',up:u,strong:true,bought:false});}
/* v0.9.14: armas do ERRANTE — desbloqueiam um poder inteiro, preço pesado (140) */
if(!game.hasBite){const u=UPGRADES.find(x=>x.id==='unlockBite');if(u)game.shopItems.push({name:'ARMA: MORDIDA DA FERA',desc:'desbloqueia a mordida — mandíbulas que despedaçam de perto',price:shopPrice(140,disc),kind:'upg',up:u,strong:true,bought:false});}
/* v1.1.2: A FEIRA DO ERRANTE — cada mercadoria ganha um lugar no CHÃO */
layoutShopFloor();
}
/* v1.1.2: distribui as mercadorias num arco rente ao ERRANTE (não é um círculo
   completo, não fica espalhado e nada muito longe — uma feira ao redor dele) */
function layoutShopFloor(){
const k=game.keeper;if(!k)return;
const MA=game.absMain;if(!MA)return;
const n=game.shopItems.length,SP=44,Rc=150;
for(let i=0;i<n;i++){
const s=game.shopItems[i];
const dx=(i-(n-1)/2)*SP;
let x=k.x+dx,y=k.y+38+(dx*dx)/(2*Rc);
x=Math.max(MA.x+46,Math.min(MA.x+MA.w-46,x));
y=Math.max(MA.y+46,Math.min(MA.y+MA.h-46,y));
s.x=x;s.y=y;s.ph=rnd(TAU);
}
}
function updateShop(dt){
if(!game.keeper)return;
game.keeperNear=dist(player.x,player.y,game.keeper.x,game.keeper.y)<86;
/* v1.1.2: mercadoria mais próxima do jogador — [Z] compra no chão */
game.shopNear=null;
if(game.state!=='play')return;
let best=46;
for(const s of game.shopItems){
if(s.bought||s.x==null)continue;
const d=dist(player.x,player.y,s.x,s.y);
if(d<best){best=d;game.shopNear=s;}
}
}
function shopBuy(s){
if(s.bought)return;
if(game.souls<s.price){
blip('sawtooth',180,90,.18,.08);
texts.push({x:player.x,y:player.y-40,txt:'FALTAM '+(s.price-game.souls)+' ALMAS',t:0,life:.8,c:'#d9465a',size:12,disp:true});
return;
}
game.souls-=s.price;s.bought=true;
/* v0.9.9: REGATEADOR — a primeira compra de cada loja vem com pacto grátis.
   v1.1.2: o presente vem DIRETO — comprar não derruba item no chão */
if(game.relicHaggler&&!game.shopGiftDone){
game.shopGiftDone=true;
texts.push({x:player.x,y:player.y-52,txt:'PRESENTE DO ERRANTE',t:0,life:1.6,c:'#9fd8ff',size:12,disp:true});
const pool=UPGRADES.filter(u=>u.q>=1&&u.q<=2&&u.can()&&!u.id.startsWith('unlock'));
if(pool.length){const u=pick(pool);
u.apply();game.up[u.id]=(game.up[u.id]||0)+1;
if(!META.acq)META.acq={};if(!META.acq[u.id]){META.acq[u.id]=1;saveMeta();}
checkTypeSynergy(u.id);
texts.push({x:player.x,y:player.y-66,txt:u.name,t:0,life:1.8,c:'#9fd8ff',size:11,disp:true});
}
}
if(s.kind==='heart'){
if(player.hp<player.maxHp)player.hp=Math.min(player.maxHp,player.hp+25);
else player.maxHp+=25;
sfx.heart();
}else if(s.kind==='fagulha'){
/* v1.0.0: compra de fagulha */
game.fagulha=(game.fagulha||0)+1;
sfx.levelup();
texts.push({x:player.x,y:player.y-48,txt:'FAGULHA ×'+game.fagulha+' · [Q]',t:0,life:1.3,c:'#ff8f3d',size:12,disp:true});
}else{
s.up.apply();game.up[s.up.id]=(game.up[s.up.id]||0)+1;
if(!META.acq)META.acq={};if(!META.acq[s.up.id]){META.acq[s.up.id]=1;saveMeta();}
checkTypeSynergy(s.up.id);
sfx.levelup();
}
sparks(player.x,player.y,'#ffd9a0',16,220,.6,3,true);
texts.push({x:player.x,y:player.y-30,txt:'COMPRADO',t:0,life:.9,c:'#ffd9a0',size:14,disp:true});
game.shake=Math.max(game.shake,4);
}
function buildShopCards(){
const box=ov('shopCards');
if(!box)return;
box.innerHTML='';
const soulsEl=ov('shopSouls');
if(soulsEl)soulsEl.textContent=game.souls;
if(!game.shopItems.length){box.innerHTML='<div class="bkEmpty">o errante não tem mais nada — suas almas não o interessam mais.</div>';return;}
for(const s of game.shopItems){
const el=document.createElement('button');
el.className='card'+(s.bought?' ':'');
el.style.opacity=s.bought?.35:1;
const afford=game.souls>=s.price;
const _st=s.strong?' <span style="color:#c9a0ff;font-size:9px;letter-spacing:.16em">◆ RARO</span>':'';
el.innerHTML='<h3>'+(s.kind==='heart'?'♥ ':'' )+s.name+_st+'</h3><p>'+s.desc+'</p><div class="lvl" style="color:'+(s.bought?'#6e6357':afford?(s.strong?'#c9a0ff':'#ffd9a0'):'#d9465a')+'">'+(s.bought?'VENDIDO':s.price+' ALMAS')+'</div>';
el.addEventListener('click',function(){audio();shopBuy(s);});
el.addEventListener('mouseenter',function(){blip('sine',500,650,.05,.03);});
box.appendChild(el);
}
}
function openShopOv(){
if(game.state!=='play')return;
audio();
game.state='shop';
game.parryCharge=0;game.parryLock=false;
buildShopCards();
showOv('shop');
blip('sine',480,660,.14,.06);
blurActive();
}
function closeShopOv(){
if(game.state!=='shop')return;
hideOv('shop');blurActive();
game.state='play';
blip('sine',420,300,.1,.05);
}
/* ============ ARCA DO INFERNO (cheat [3]) — menu com TODAS as bênçãos e armas ============ */
const CHEAT_WEAPON_DEFS=[
{id:'shot',glyph:'shot',name:'TROVÃO À DISTÂNCIA',desc:'desbloqueia o tiro — projéteis que caçam à distância.',apply:function(){game.hasShot=true;player.shotT=.3;}},
{id:'bite',glyph:'fangs',name:'MORDIDA DA FERA',desc:'desbloqueia a mordida — mandíbulas que despedaçam de perto.',apply:function(){game.hasBite=true;player.biteT=.3;}},
{id:'heart',glyph:'blood',name:'+1 CORAÇÃO PERMANENTE',desc:'aumenta a vida máxima (e cura) em 1.',apply:function(){player.maxHp+=25;player.hp=player.maxHp;}},
{id:'soul100',glyph:'soulg',name:'+100 ALMAS',desc:'bônus imediato de 100 almas — clique quantas vezes quiser.',apply:function(){gainSouls(100);}}
];
function buildCheatCards(){
const box=ov('cheatCards');
if(!box)return;
box.innerHTML='';
/* armas e atalhos especiais primeiro */
for(const w of CHEAT_WEAPON_DEFS){
const el=document.createElement('button');
el.className='card';
const col='#c9a44c';
el.style.borderColor=col;
el.style.background='linear-gradient('+hexA(col,.09)+','+hexA(col,.02)+'), rgba(13,9,11,.94)';
el.innerHTML=GLYPHS[w.glyph]+'<span class="tag">ARMA</span><h3>'+w.name+'</h3><p>'+shortDesc(w.desc,110)+'</p><div class="lvl" style="color:'+col+'">CLIQUE PARA OBTER</div>';
el.addEventListener('click',function(){audio();w.apply();sfx.levelup();sparks(player.x,player.y,'#ffd9a0',14,220,.6,3,true);buildCheatCards();});
el.addEventListener('mouseenter',function(){blip('sine',500,650,.05,.03);});
box.appendChild(el);
}
/* todas as bênçãos do UPGRADES */
for(const u of UPGRADES){
const el=document.createElement('button');
el.className='card';
const st=(game.up[u.id]||0);
let locked=false;try{locked=!u.can();}catch(e){locked=true;} /* v1.4.2: can() quebrada vira carta INDISPONÍVEL, não tela vazia */
const col=QUAL_C[u.q-1]||QUAL_C[5]; /* v1.4.2: q fora da tabela (PACTO 404 q7) cai na cor lendária */
if(st>0)el.classList.add('taken');
if(locked)el.classList.add('locked');
el.style.borderColor=st>0?'#3a8a4f':col;
el.style.background='linear-gradient('+hexA(st>0?'#3a8a4f':col,.09)+','+hexA(st>0?'#3a8a4f':col,.02)+'), rgba(13,9,11,.94)';
const tag=u.q>=5?'RARO':u.q>=4?'ÉPICO':u.q===3?'SINERGIA':u.q===2?'ARMA':'BÁSICO';
el.innerHTML=GLYPHS[u.glyph]+'<span class="tag">'+tag+'</span><h3>'+u.name+'</h3><p>'+shortDesc(u.desc,110)+'</p><div class="lvl" style="color:'+(st>0?'#3a8a4f':col)+'">'+(st>0?'OBTIDA · GRAU '+roman(st+1):locked?'INDISPONÍVEL':'QUALIDADE '+roman(u.q))+'</div>';
if(!locked){
el.addEventListener('click',function(){audio();chooseUpgrade(u);sfx.levelup();sparks(player.x,player.y,'#ffd9a0',14,220,.6,3,true);buildCheatCards();});
el.addEventListener('mouseenter',function(){blip('sine',500,650,.05,.03);});
}
box.appendChild(el);
}
}
function openCheatMenu(){
if(!game.dev)return;
if(game.state!=='play')return;
audio();
game.state='cheat';
game.parryCharge=0;game.parryLock=false;
try{buildCheatCards();}catch(e){console.warn('[arca]',e);} /* v1.4.2: a arca ABRE mesmo se uma carta falhar — nunca mais tela vazia/travada */
showOv('cheatmenu');
blip('sine',520,720,.18,.08);
blurActive();
}
function closeCheatMenu(){
if(game.state!=='cheat')return;
hideOv('cheatmenu');blurActive();
game.state='play';
blip('sine',440,300,.1,.05);
}
function updateRoomEvent(dt){
const ev=game.roomEvent;
if(!ev)return;
ev.t+=dt;
if(ev.type==='soulrain'){
ev.acc-=dt;
if(ev.acc<=0&&ev.t<12){
ev.acc=.35;
const p=roomPt(lerp(ROOM.x+40,ROOM.x+ROOM.w-40,Math.random()),lerp(ROOM.y+40,ROOM.y+ROOM.h-40,Math.random()),30);
pickups.push({type:'soul',x:p.x,y:p.y,t:0,ph:rnd(TAU)});
particles.push({x:p.x,y:ROOM.y+20,vx:rnd(-10,10),vy:rnd(20,60),life:.5,t:0,r:2,c:'#bfd8e8',glow:true});
}
}
}
function evDropMul(){return game.roomEvent?(game.roomEvent.type==='frenzy'?2:(game.roomEvent.type==='void'?2:1)):1;}
/* ============ intro do boss ============ */
const GATE={x:W/2,y:H*.36};
const WK=[3.2,5.4,7.6],HOWL_T=10.2,GATEC=10.6,PLATE_T=11.4,FIGHT_T=14.6;
function updateBossIntro(dt){
game.bossIntroT+=dt;
const t=game.bossIntroT,F=game.introFlags;
if(t<9.5)game.shake=Math.max(game.shake,.35);
if(t>=FIGHT_T){
game.state='play';boss.introLock=false;boss.scale=1;boss.y=H*.32;
for(const h of boss.heads){h.cd=h.baseCd*rnd(.6,.9);h.wake=1;h.howlT=0;}
return;
}
boss.scale=.8+.2*smooth(ramp(t,8.6,10.2));
boss.y=lerp(H*.42,H*.32,smooth(ramp(t,8.6,10.2)));
if(t>=WK[0]&&!F.w0){F.w0=1;sfx.growl();}
if(t>=WK[1]&&!F.w1){F.w1=1;sfx.growl();}
if(t>=WK[2]&&!F.w2){F.w2=1;sfx.growl();}
F.snoreT-=dt;
if(t>1&&t<9&&F.snoreT<=0){F.snoreT=2.4;sfx.snore();}
if(t>=HOWL_T&&!F.howl){
F.howl=1;
sfx.howl();blip('sine',280,700,.55,.14,.15);blip('sine',300,760,.55,.13,.32);
sfx.roar();
game.shake=12;game.flash=.25;
}
if(t>=GATEC&&!F.gclose){F.gclose=1;sfx.gate();game.shake=Math.max(game.shake,10);}
if(t>=HOWL_T&&t<11.6)game.shake=Math.max(game.shake,5);
if(t>=PLATE_T+.6&&!F.plate){F.plate=1;game.flash=.5;game.shake=8;}
updateBoss(dt);
}
function drawGate(x,y,appear,open,fade){
const pz=game.puzzle;const runeCount=pz&&Array.isArray(pz.need)?pz.need.length:3;
if(appear<=0||fade<=0)return;
ctx.save();
ctx.globalAlpha=fade;
ctx.translate(x,y);
ctx.scale(appear,appear);
ctx.fillStyle='#0a0506';
ctx.fillRect(-48,-105,96,212);
const glows=[[85,.08+open*.22],[58,.13+open*.32],[32,.18+open*.5]];
for(const g of glows){
ctx.globalAlpha=fade*g[1];ctx.fillStyle='#ff8f3d';
ctx.beginPath();ctx.arc(0,10,g[0],0,TAU);ctx.fill();
}
ctx.globalAlpha=fade;
const slide=open*78;
for(const s of[-1,1]){
ctx.fillStyle='#1a1014';
const dx=s===-1?-48-slide:slide;
ctx.fillRect(dx,-105,48,210);
ctx.strokeStyle='#31242e';ctx.lineWidth=2;
ctx.strokeRect(dx,-105,48,210);
ctx.strokeStyle='#57504e';
ctx.beginPath();
ctx.moveTo(s*22-s*slide,-90);ctx.lineTo(s*22-s*slide,95);
ctx.stroke();
}
for(const s of[-1,1]){
const px=s*70;
ctx.fillStyle='#241b20';
ctx.fillRect(px-22,-118,44,232);
ctx.strokeStyle='#3a2b33';ctx.lineWidth=3;
ctx.strokeRect(px-22,-118,44,232);
ctx.strokeStyle='rgba(255,120,60,'+(.2+.15*Math.sin(game.t*3+s))+')';
ctx.lineWidth=2;
ctx.beginPath();
ctx.moveTo(px-10,-90);ctx.lineTo(px+8,-50);ctx.lineTo(px-6,-10);
ctx.moveTo(px+12,20);ctx.lineTo(px-8,60);
ctx.stroke();
for(let k=0;k<runeCount;k++){
const ry=-70+k*70;
ctx.strokeStyle='rgba(232,69,90,'+(.45+.35*Math.sin(game.t*5+k*2+s))+')';
ctx.lineWidth=2;
ctx.beginPath();
ctx.moveTo(px-8,ry-7);ctx.lineTo(px+8,ry);ctx.lineTo(px-8,ry+7);
ctx.stroke();
}
}
ctx.beginPath();
ctx.ellipse(0,-102,94,44,0,Math.PI,TAU);
ctx.lineTo(94,-100);ctx.lineTo(-94,-100);
ctx.closePath();
ctx.fillStyle='#241b20';ctx.fill();
ctx.strokeStyle='#3a2b33';ctx.lineWidth=3;ctx.stroke();
ctx.strokeStyle='rgba(255,120,60,'+(.18+.12*Math.sin(game.t*2.4))+')';
ctx.lineWidth=2;
ctx.beginPath();
ctx.ellipse(0,-102,78,32,0,Math.PI*1.15,Math.PI*1.85);
ctx.stroke();
ctx.restore();
}
function drawHellGate(){
const t=game.bossIntroT;
const appear=smooth(ramp(t,.15,.7));
const open=t<GATEC?1:1-ramp(t,GATEC,11.8);
const fade=1-ramp(t,12.6,14);
drawGate(GATE.x,GATE.y,appear,open,fade);
}
function drawBossIntroTexts(){
const t=game.bossIntroT;
const dark=Math.min(.55,t*1.2)*(t<14.2?1:Math.max(0,1-(t-14.2)/.4));
if(dark>0){ctx.fillStyle='rgba(5,3,4,'+dark+')';ctx.fillRect(0,0,W,H);}
const a1=ramp(t,.8,1.5)*(1-ramp(t,3.4,4));
if(a1>0){
ctx.globalAlpha=a1;
txt('algo enorme dorme diante do portão...',W/2,H*.2,MONO,13,'#9c8f7c','center',4);
ctx.globalAlpha=1;
}
const a2=ramp(t,5.4,6)*(1-ramp(t,8.8,9.4));
if(a2>0){
ctx.globalAlpha=a2;
txt('as três cabeças guardam a saída do círculo',W/2,H*.2,MONO,13,'#9c8f7c','center',4);
ctx.globalAlpha=1;
}
const ty=H*.23;
const ap=ramp(t,PLATE_T,PLATE_T+.6)*(1-ramp(t,14,14.5));
if(ap>0){
ctx.globalAlpha=ap;
txt('CÉRBERO',W/2+rnd(-1.4,1.4),ty+rnd(-.7,.7),DISP,96,'#e6dac4');
txt('GUARDIÃO DO INFERNO',W/2,ty+64,MONO,15,'#a52a3a','center',9);
ctx.strokeStyle='#a52a3a';ctx.lineWidth=1;
ctx.beginPath();
ctx.moveTo(W/2-190,ty+92);ctx.lineTo(W/2-16,ty+92);
ctx.moveTo(W/2+16,ty+92);ctx.lineTo(W/2+190,ty+92);
ctx.stroke();
ctx.save();ctx.translate(W/2,ty+92);ctx.rotate(Math.PI/4);
ctx.fillStyle='#a52a3a';ctx.fillRect(-3.5,-3.5,7,7);ctx.restore();
for(let i=0;i<boss.heads.length;i++){
const h=boss.heads[i];
const ta=ramp(t,PLATE_T+.7+i*.32,PLATE_T+1+i*.32);
if(ta>0){
ctx.globalAlpha=ap*ta;
txt(h.name,W/2+(i-1)*180,ty+120,MONO,17,h.c,'center',5);
}
}
ctx.globalAlpha=ap;
txt('AS CABEÇAS SANGRAM — A CARNE, NÃO',W/2,ty+156,MONO,13,'#9c8f7c','center',3);
ctx.globalAlpha=1;
}
}
/* ============ estados ============ */
/* a cara preta com chifres — a bestia que zomba da morte de thor */
const DEATH_TAUNTS=[
'VOCÊ NUNCA VAI CONSEGUIR',
'TENTE OUTRA VEZ, E MORRA NOVAMENTE',
'O FRIO TE CASTIGA OUTRA VEZ.',
'SEM COMIDA PRA VOCÊ HOJE.',
'A PENUMBRA NÃO QUIS A SUA ALMA.',
'SEUS OSSOS FAZEM BOM RANGO.',
'AQUI MORREM OS MELHORES. VOCÊ QUASE FOI UM.',
'NEM OS DEUSES TORCERAM POR VOCÊ.',
'SEU CHEIRO CHEGOU ANTES DE VOCÊ.',
'A SERRA NÃO SALVOU OS OUTROS.',
'O ABISMO RIU. EU ANOTEI TUDO.',
'CORRE, CÃO. A MORTE JÁ SABE SEU NOME.'];
function drawDeadFace(){
const t=game.deadT;
if(t<.25)return;
const a=ramp(t,.25,1.1);
const bob=Math.sin(game.t*1.6)*6;
const cx=W/2,cy=H*.36+bob;
ctx.save();
ctx.globalAlpha=a;
/* v1.6.1: A BESTA TEM ROSTO — se existir assets/sprites/besta.png (ou
   besta-das-trevas.png, fera.png…), a arte do usuário substitui a besta
   vetorial INTEIRA (chifres + cabeça + olhos em brasa + sorriso). O texto
   de provação e a assinatura seguem logo abaixo. Sem o arquivo, o desenho
   original vale — nada quebra, nunca fica invisível. */
const __bp=window.THOR_PNG_MODE&&window.THOR_PNG&&window.THOR_PNG.drawBesta?window.THOR_PNG.drawBesta(ctx,cx,cy,{alpha:a,bob:bob}):false;
if(!__bp){
/* chifres curvos */
for(const s of[-1,1]){
ctx.beginPath();
ctx.moveTo(cx+s*58,cy-40);
ctx.quadraticCurveTo(cx+s*148,cy-118+bob*.4,cx+s*92,cy-176);
ctx.quadraticCurveTo(cx+s*116,cy-94,cx+s*32,cy-64);
ctx.closePath();
ctx.fillStyle='#0d0a12';ctx.fill();
ctx.strokeStyle='rgba(230,218,196,.28)';ctx.lineWidth=2.5;ctx.stroke();
}
/* cabeça negra */
ctx.beginPath();
ctx.ellipse(cx,cy,96,112,0,0,TAU);
ctx.fillStyle='#07050a';ctx.fill();
ctx.strokeStyle='rgba(230,218,196,.22)';ctx.lineWidth=3;ctx.stroke();
/* olhos em brasa */
const eg=.55+.45*Math.sin(game.t*3.4);
for(const s of[-1,1]){
ctx.save();
ctx.shadowColor='#ff2038';ctx.shadowBlur=26*eg;
ctx.fillStyle='#d9465a';
ctx.beginPath();ctx.ellipse(cx+s*36,cy-18,15,9,s*.22,0,TAU);ctx.fill();
ctx.restore();
ctx.fillStyle='#ff8d9c';
ctx.beginPath();ctx.arc(cx+s*36,cy-18,4.2,0,TAU);ctx.fill();
}
/* sorriso serrilhado */
ctx.strokeStyle='#d9465a';ctx.lineWidth=3;
ctx.beginPath();
const mw=64;
for(let i=0;i<=10;i++){
const px=cx-mw+2*mw*i/10;
const py=cy+52+(i%2?10:0);
if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
}
ctx.stroke();
}/* fim besta vetorial — com besta.png, a arte do usuário entrou no lugar */
/* frase da bestia */
const taunt=game.deadTaunt||DEATH_TAUNTS[0];
const n=Math.floor(clamp((t-.7)/.5,0,1)*taunt.length);
ctx.globalAlpha=a*ramp(t,.7,1);
txt(taunt.slice(0,n),W/2+rnd(-1,1),H*.66,MONO,20,'#d9465a','center',4);
ctx.globalAlpha=a*.6;
txt('— A BESTA DO ABISMO —',W/2,H*.71,MONO,10,'#6e6357','center',2);
ctx.restore();
}
function updateDead(dt){
game.deadT+=dt;
if((game.deadT>1.5||game.deadT>2.5)&&!game.overlayShown){
game.overlayShown=true;
setStat('stWaveD',game.floor);
setStat('stKillD',game.kills);
setStat('stEmbD',game.souls);
const dtt=ov('deadTaunt')||ov('deadTauntTxt');
if(dtt)dtt.textContent='"'+(game.deadTaunt||DEATH_TAUNTS[0])+'"';
const dr=ov('deadRelics');
if(dr)dr.innerHTML=metaListText();
showOv('dead');
}
}
function updatePlay(dt){
 if(game.windowScene){updateWindowScene(dt);return;}
 /* ==== v0.9.1: O MUNDO — tempo parado. Thor e seus projéteis continuam,
    mas inimigos, balas inimigas e bosses ficam congelados. ====
    v0.9.16: o decremento de worldT/slowMoT agora é ÚNICO, no frame() —
    aqui apenas lemos os flags. AMPULHETA: inimigos não param — se movem
    em câmera lenta (dt*0.4). TELEGRÁFICOS KAIZO atualizam aqui. ==== */
 const worldActive=game.worldT>0;
 const slowMo=game.slowMoT>0?0.4:1;
 const eDt=dt*(worldActive?0:slowMo);
 if(game.soulTremor>0)game.soulTremor-=dt;
 updatePlayer(dt);
 /* v0.9.16: efeitos temporários de itens ativos — sempre vivos, nunca travam */
 updateActiveFx(dt);
 updateShot(dt);
 if(game.hasBite)updateBite(dt);
 updateChainsaw(dt);
 updateSword(dt);
 updateNova(dt);
 updateStakes(dt);
 updateMagics(dt);
 updateKingSoul(dt);
 updateReiUltimate(dt);
 /* checa ativação do Triunfo dos Cavaleiros do Apocalipse */
 {const k=knightAny2();if(k&&!k.triunfo)cwCheckTriumph(k);}
 updateShock(dt);
 updateThrownSaw(dt);
 updateHammers(dt);
 updateBullets(dt);
 updateVapers(dt);updateBeamShots(dt);/* v1.0.0: vapor e feixe */
 updateLightning(dt);
 /* durante O MUNDO, inimigos/boss/balas inimigas ficam congelados;
    com a AMPULHETA, apenas em câmera lenta */
 if(!worldActive){
 updateEnemies(eDt);
 if(boss.active)updateBoss(eDt);
 updateEBullets(eDt);
 }
 updateRings(dt);
 updateGeyserMarks(eDt);
 updateSpawnMarks(dt);
 updateTelegraphs(worldActive?0:dt);
 updateActMinions(dt);
 updatePickups(dt);
 updateShop(dt);
 updateRoomEvent(dt);
 updatePuzzle(dt);
 updateDecor(dt);
 updatePenumbra(dt);
 updateRoomWindow(dt);
 if(window.__EXPANSION)window.__EXPANSION.frame(dt); /* v1.3.0: expansão — armas/sinergias/zonas */
 if(!worldActive)roomLogic(eDt);
}
function togglePause(){
if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight'&&game.state!=='school'&&game.state!=='castle'&&game.state!=='gatepath'&&game.state!=='bluecorr'&&game.state!=='juizintro')return;
if(optionsOpen())return;
game.paused=!game.paused;
game.parryCharge=0;game.parryLock=false;
toggleOv('pause',game.paused);
blurActive();
}
/* voltar ao menu direto do ESC durante o jogo */
function goToMenu(){
audio();
if(window.SCHOOL)SCHOOL.beforeMenu(); /* guarda a partida para o botão CONTINUAR */
if(window.CASTELLO)CASTELLO.beforeMenu(); /* v0.9.10: sair do castelo pelo menu limpa a fase */
game.paused=false;game.state='menu';
/* FIX: esconde TODAS as telas (inclusive 'dead'/'win') — antes, os botões
   da tela de morte ficavam interceptando cliques do menu invisivelmente */
['menu','dead','win','pause','levelup','weapons','options','book','lab','saves','shop','cheatmenu','limboLoading','circles','descer'].forEach(hideOv);
initAttract();
showOv('menu');
refreshMenuDev();
blurActive();
}
/* ============ render: texto ============ */
const DISP='"Pirata One", serif',MONO='"IBM Plex Mono", monospace',FELL='"IM Fell English SC", Georgia, serif'; /* v1.5.7: FELL = a letra de pergaminho do GUARDIÃO DA PASSAGEM */
/* v1.5.7: a fonte do guardião entra na memória cedo — o cartão da apresentação não pode nascer com fallback */
try{if(document.fonts&&document.fonts.load){document.fonts.load('74px "IM Fell English SC"','CERBERUS O GUARDIÃO DA PASSAGEM');document.fonts.load('25px "IM Fell English SC"','O CÃO DAS TRÊS SENTENÇAS');}}catch(e){}
function txt(s,x,y,font,size,col,align,ls){
ctx.font=size+'px '+font;ctx.fillStyle=col;
ctx.textAlign=align||'center';ctx.textBaseline='middle';
if(LS)ctx.letterSpacing=(ls||0)+'px';
ctx.fillText(s,x,y);
if(LS)ctx.letterSpacing='0px';
}
/* ============ render: thor ============ */
function drawPlayer(){
if(game.state==='menu'||game.state==='e404intro'||game.state==='reiintro')return;
const p=player,pa=game.playerAlpha;
const flick=(p.inv>0&&p.dashT<=0&&Math.floor(game.t*18)%2===0)?.4:1;
const fs=game.fallK>=0?1-smooth(Math.min(1,game.fallK)):1;
if(fs<=0)return;
ctx.save();
ctx.globalAlpha=pa*flick;
ctx.fillStyle='rgba(0,0,0,0.35)';
ctx.beginPath();ctx.ellipse(p.x,p.y+10,15*fs,5*fs,0,0,TAU);ctx.fill();
/* v1.4.6: FOCO (SHIFT segurado) — a hitbox de verdade aparece: um círculo de
   4px (v1.6.0) com o ponto carmesim no centro. Só com SHIFT — sem ele, nada
   de círculo. Andar fica lento. */
if(p.focus&&!p.dead){
ctx.save();ctx.globalAlpha=Math.max(.35,pa);
ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=1.4;
ctx.beginPath();ctx.arc(p.x,p.y,p.hitR||5,0,TAU);ctx.stroke();
ctx.strokeStyle='rgba(255,46,85,.5)';ctx.lineWidth=1;
ctx.beginPath();ctx.arc(p.x,p.y,(p.hitR||5)+3.5,0,TAU);ctx.stroke();
ctx.fillStyle='#ff2e55';
ctx.beginPath();ctx.arc(p.x,p.y,1.8,0,TAU);ctx.fill();
ctx.restore();
}
/* PNG EDITION: o Thor vivo usa um sprite externo editável.
   O Canvas continua como fallback caso o PNG ainda esteja carregando.
   v0.9.10 FIX: restore() antes do return — o save() de cima vazava o
   estado do canvas (globalAlpha 0.4 do flicker vazava p/ o resto do
   frame e a pilha de save() crescia 1 por frame enquanto o PNG ativo) */
if(!p.dead&&window.THOR_PNG_MODE&&window.THOR_PNG&&window.THOR_PNG.drawPlayer){
  if(window.THOR_PNG.drawPlayer(ctx,p,game,pa*flick,fs)){ctx.restore();return;}
}
ctx.translate(p.x,p.y);
ctx.scale(fs,fs);
if(p.dead){
ctx.globalAlpha=.9*pa;
ctx.rotate(p.angle);
ctx.fillStyle='#71878f';
ctx.beginPath();ctx.ellipse(0,2,16,9,0,0,TAU);ctx.fill();
ctx.strokeStyle='#14100e';ctx.lineWidth=2;ctx.stroke();
ctx.fillStyle='#5d7278';
ctx.beginPath();ctx.ellipse(6,8,6,3,.6,0,TAU);ctx.fill();
ctx.restore();return;
}
ctx.rotate(p.angle);
const step=Math.sin(p.walkT)*5;
const wag=Math.sin(game.t*10)*.55;
ctx.fillStyle='#6d838c';
ctx.save();ctx.translate(-14,0);ctx.rotate(wag);
ctx.beginPath();ctx.ellipse(-4,0,7,3,0,0,TAU);ctx.fill();
ctx.restore();
ctx.fillStyle='#5d7278';
ctx.beginPath();ctx.ellipse(6,-8,4,2.6,0,0,TAU);ctx.fill();
ctx.beginPath();ctx.ellipse(6,8,4,2.6,0,0,TAU);ctx.fill();
ctx.beginPath();ctx.ellipse(-7,-7+step*.5,3.6,2.4,0,0,TAU);ctx.fill();
ctx.beginPath();ctx.ellipse(-7,7-step*.5,3.6,2.4,0,0,TAU);ctx.fill();
ctx.beginPath();ctx.ellipse(0,0,14,10.5,0,0,TAU);
ctx.fillStyle='#8ba2ac';ctx.fill();
ctx.strokeStyle='#14100e';ctx.lineWidth=2;ctx.stroke();
ctx.beginPath();ctx.ellipse(-3,0,8.5,7,0,0,TAU);
ctx.fillStyle='#71898f';ctx.fill();
ctx.fillStyle='#5d7278';
for(const s of[-1,1]){
ctx.beginPath();
ctx.moveTo(7,s*5);ctx.lineTo(2,s*12);ctx.lineTo(-2,s*5);
ctx.closePath();ctx.fill();
ctx.strokeStyle='#14100e';ctx.lineWidth=1.5;ctx.stroke();
}
ctx.beginPath();ctx.arc(10,0,8.5,0,TAU);
ctx.fillStyle='#8ba2ac';ctx.fill();
ctx.strokeStyle='#14100e';ctx.lineWidth=2;ctx.stroke();
ctx.beginPath();ctx.ellipse(17,0,5.5,4,0,0,TAU);
ctx.fillStyle='#a7bcc4';ctx.fill();
ctx.strokeStyle='#14100e';ctx.lineWidth=1.5;ctx.stroke();
ctx.fillStyle='#14100e';
ctx.beginPath();ctx.ellipse(20.5,0,2,1.6,0,0,TAU);ctx.fill();
for(const s of[-1,1]){
ctx.fillStyle='#f4f8f5';
ctx.beginPath();ctx.arc(11,s*3.6,1.8,0,TAU);ctx.fill();
ctx.globalAlpha=pa*flick*(.3+.25*Math.sin(game.t*6+s));
ctx.beginPath();ctx.arc(11,s*3.6,3.6,0,TAU);ctx.fill();
ctx.globalAlpha=pa*flick;
}
ctx.restore();
}
function drawChainsaw(){
if(!P.chainsaw||player.dead||game.state==='menu'||game.state==='e404intro'||game.state==='reiintro')return;
if(thrownSaw)return;
const sawOne=function(ox,oy,rot,scale){
ctx.save();
ctx.translate(ox,oy);ctx.rotate(rot);ctx.scale(scale,scale);
ctx.fillStyle='#3a3129';
ctx.fillRect(4,-6,15,12);
ctx.strokeStyle='#14100e';ctx.lineWidth=2;
ctx.strokeRect(4,-6,15,12);
ctx.fillStyle='#a52a3a';
ctx.fillRect(7,-3,6,6);
const len=26+P.chainsaw*6;
ctx.fillStyle='#b9c2c9';
ctx.fillRect(19,-4,len,8);
ctx.strokeStyle='#1d2b33';ctx.lineWidth=1.5;
ctx.strokeRect(19,-4,len,8);
ctx.fillStyle='#e6dac4';
const off=(player.sawAnim*8)%8;
for(let x=19+off;x<19+len-2;x+=8){
ctx.beginPath();ctx.moveTo(x,-4);ctx.lineTo(x+4,-10);ctx.lineTo(x+8,-4);ctx.closePath();ctx.fill();
ctx.beginPath();ctx.moveTo(x,4);ctx.lineTo(x+4,10);ctx.lineTo(x+8,4);ctx.closePath();ctx.fill();
}
ctx.restore();
};
ctx.save();
ctx.globalAlpha=game.playerAlpha;
if(P.chainsaw>=2){
/* duas serras — uma em cada pata dianteira */
ctx.translate(player.x,player.y);
ctx.rotate(player.angle);
const rel=angDiff(player.sawAim,player.angle);
sawOne(6,-11,rel-.42,1);
sawOne(6,11,rel+.42,1);
if(P.chainsaw>=3){
/* a terceira serra mora na cabeça de thor */
sawOne(8,0,rel+.15,1.05);
}
}else{
ctx.translate(player.x,player.y);
ctx.rotate(player.sawAim);
sawOne(0,0,0,1);
}
ctx.restore();
}
function drawThrownSaw(){
if(!thrownSaw)return;
const s=thrownSaw;
ctx.save();
ctx.translate(s.x,s.y);
ctx.globalAlpha=game.playerAlpha;
ctx.fillStyle='rgba(207,216,220,0.18)';
ctx.beginPath();ctx.arc(0,0,26,0,TAU);ctx.fill();
ctx.rotate(s.spin);
const len=30+P.chainsaw*7;
ctx.fillStyle='#3a3129';ctx.fillRect(-7,-5,14,10);
ctx.fillStyle='#b9c2c9';ctx.fillRect(7,-4,len,8);
ctx.strokeStyle='#1d2b33';ctx.lineWidth=1.5;ctx.strokeRect(7,-4,len,8);
ctx.fillStyle='#e6dac4';
for(let x=7;x<7+len-2;x+=8){
ctx.beginPath();ctx.moveTo(x,-4);ctx.lineTo(x+4,-10);ctx.lineTo(x+8,-4);ctx.closePath();ctx.fill();
ctx.beginPath();ctx.moveTo(x,4);ctx.lineTo(x+4,10);ctx.lineTo(x+8,4);ctx.closePath();ctx.fill();
}
ctx.restore();
}
function drawDarkOrbs(){
if(P.dark<=0||player.dead)return;
if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight')return;
for(let i=0;i<P.dark;i++){
const a=game.darkAng+i*TAU/P.dark;
const x=player.x+Math.cos(a)*58,y=player.y+Math.sin(a)*58;
ctx.globalAlpha=game.playerAlpha*.25;
ctx.fillStyle='#4a2a5e';
ctx.beginPath();ctx.arc(x,y,13,0,TAU);ctx.fill();
ctx.globalAlpha=game.playerAlpha;
ctx.fillStyle='#241731';
ctx.beginPath();ctx.arc(x,y,7,0,TAU);ctx.fill();
ctx.strokeStyle='#0d0812';ctx.lineWidth=1.5;ctx.stroke();
ctx.fillStyle='#e6f0f2';
ctx.beginPath();ctx.arc(x-2.2,y-1,1.2,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(x+2.2,y-1,1.2,0,TAU);ctx.fill();
}
ctx.globalAlpha=1;
}
function drawLightBeam(){
if(!lightBeam)return;
if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight')return;
const reach=250+40*P.light;
const a=clamp(1-lightBeam.t/lightBeam.dur,0,1);
ctx.save();
ctx.translate(player.x,player.y);
ctx.rotate(lightBeam.ang);
ctx.globalAlpha=a*.25*game.playerAlpha;
ctx.fillStyle='#fff3c4';
ctx.beginPath();
ctx.moveTo(0,-5);ctx.lineTo(reach,-30);ctx.lineTo(reach,30);ctx.lineTo(0,5);
ctx.closePath();ctx.fill();
ctx.globalAlpha=a*.85*game.playerAlpha;
ctx.strokeStyle='#fff8dc';ctx.lineWidth=4;ctx.lineCap='round';
ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(reach,0);ctx.stroke();
ctx.globalAlpha=a*.4*game.playerAlpha;ctx.lineWidth=12;
ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(reach,0);ctx.stroke();
ctx.restore();
ctx.globalAlpha=1;
}
function drawShock(){
for(const w of shockwaves){
const a=1-w.r/w.maxR;
ctx.strokeStyle='#ffd9a0';
ctx.globalAlpha=a*.8;ctx.lineWidth=10;
ctx.beginPath();ctx.arc(w.x,w.y,w.r,0,TAU);ctx.stroke();
ctx.globalAlpha=a*.35;ctx.lineWidth=22;
ctx.beginPath();ctx.arc(w.x,w.y,w.r,0,TAU);ctx.stroke();
}
ctx.globalAlpha=1;
}
/* ============ v0.9.16: telegráficos (avisos de perigo) e minions de ativos ============ */
function drawTelegraphs(){
for(const tg of telegraphs){
const prog=clamp(tg.t/tg.dur,0,1);
const blink=.35+.45*Math.abs(Math.sin(game.t*(4+prog*14)));
ctx.save();
if(tg.shape==='line'||tg.shape==='cross'){
  ctx.globalAlpha=blink*.75;
  ctx.strokeStyle=tg.c;ctx.lineWidth=3;
  ctx.setLineDash([10,7]);
  const L=tg.tlen||1400; /* v1.6.3: fios da morte usam segmentos com comprimento próprio */
  if(tg.shape==='cross'){
    for(const k of [0,Math.PI/2]){
      ctx.beginPath();
      ctx.moveTo(tg.x-Math.cos(tg.ang+k)*L,tg.y-Math.sin(tg.ang+k)*L);
      ctx.lineTo(tg.x+Math.cos(tg.ang+k)*L,tg.y+Math.sin(tg.ang+k)*L);
      ctx.stroke();
    }
  }else{
    ctx.beginPath();
    ctx.moveTo(tg.x-Math.cos(tg.ang)*L,tg.y-Math.sin(tg.ang)*L);
    ctx.lineTo(tg.x+Math.cos(tg.ang)*L,tg.y+Math.sin(tg.ang)*L);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}else{
  /* círculo pulsante que fecha conforme o tempo passa */
  const rr=tg.r*(1.15-.15*prog);
  ctx.globalAlpha=blink*.5;
  ctx.fillStyle=tg.c;
  ctx.beginPath();ctx.arc(tg.x,tg.y,rr,0,TAU);ctx.fill();
  ctx.globalAlpha=.85;
  ctx.strokeStyle=tg.c;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(tg.x,tg.y,tg.r,0,TAU);ctx.stroke();
  /* arco de progresso */
  ctx.globalAlpha=.9;ctx.lineWidth=4;ctx.strokeStyle='#fff8dc';
  ctx.beginPath();ctx.arc(tg.x,tg.y,tg.r+5,-Math.PI/2,-Math.PI/2+prog*TAU);ctx.stroke();
  if(tg.meteor){
    ctx.globalAlpha=prog*.9;
    ctx.fillStyle='#ff8f3d';
    ctx.beginPath();ctx.arc(tg.x,tg.y-260*(1-prog),10,0,TAU);ctx.fill();
  }
}
ctx.restore();
}
ctx.globalAlpha=1;
}
function drawActMinions(){
for(const m of actMinions){
ctx.save();ctx.translate(m.x,m.y);
const fade=Math.min(1,m.life*2)*(.85+.15*Math.sin(game.t*8+m.ph));
ctx.globalAlpha=fade;
if(m.kind==='crow'){
  ctx.rotate(Math.sin(game.t*7+m.ph)*.25);
  ctx.fillStyle='#2e2620';
  ctx.beginPath();ctx.ellipse(0,0,11,7,0,0,TAU);ctx.fill();
  ctx.strokeStyle='#2e2620';ctx.lineWidth=2.5;
  const w=Math.sin(game.t*16+m.ph)*8;
  ctx.beginPath();ctx.moveTo(-4,-2);ctx.lineTo(-14,-6-w);ctx.stroke();
  ctx.beginPath();ctx.moveTo(4,-2);ctx.lineTo(14,-6-w);ctx.stroke();
  ctx.fillStyle='#c9a0ff';
  ctx.beginPath();ctx.arc(4,-2,1.6,0,TAU);ctx.fill();
}else if(m.kind==='decoy'){
  ctx.globalAlpha=fade*.5;
  ctx.fillStyle='#cfe9ff';
  ctx.beginPath();ctx.arc(0,0,11,0,TAU);ctx.fill();
  ctx.globalAlpha=fade*.3;
  ctx.beginPath();ctx.arc(0,0,18+Math.sin(game.t*5)*3,0,TAU);ctx.fill();
  ctx.globalAlpha=fade*.9;
  ctx.strokeStyle='#cfe9ff';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(0,0,11,0,TAU);ctx.stroke();
}
ctx.restore();
}
ctx.globalAlpha=1;
}
/* ============ render: projéteis do jogador ============ */
function drawBullets(){
/* v1.5.1: na PENUMBRA INFERNAL o chão branco engolia os tiros — halo escuro
   embaixo de cada tiro do Thor para o traço ler em qualquer fundo */
const _piB=game.region==='penumbra'&&game.floor>=3;
for(const b of bullets){
const c=b.color||(b.elem?ELEM_DATA[b.elem].c:'#cfe9ff');
ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);
if(_piB){ctx.globalAlpha=.55;ctx.fillStyle='#1a0b10';ctx.beginPath();ctx.ellipse(-3,0,15,6.5,0,0,TAU);ctx.fill();ctx.globalAlpha=1;}
ctx.globalAlpha=.3;ctx.fillStyle=c;
ctx.beginPath();ctx.ellipse(-12,0,10,3,0,0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.fillStyle=c;
ctx.beginPath();ctx.ellipse(0,0,9,3.5,0,0,TAU);ctx.fill();
if(P.explShot){ctx.fillStyle='#ffd9a0';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();}
/* v0.9.6: Coração = gota de sangue; Lágrimas = gota de lágrima */
if(b.blood){ctx.fillStyle='#ff6080';ctx.beginPath();ctx.arc(0,0,3,0,TAU);ctx.fill();}
if(b.tear){ctx.fillStyle='#a0e0ff';ctx.beginPath();ctx.arc(0,0,3,0,TAU);ctx.fill();}
ctx.fillStyle=b.parry?'#e6dac4':'#fff';
ctx.beginPath();ctx.ellipse(4,0,4,2,0,0,TAU);ctx.fill();
if(_piB){ctx.strokeStyle='rgba(255,70,40,.8)';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,10.5,4.8,0,0,TAU);ctx.stroke();}
ctx.restore();
}
}
function drawArcs(){
for(const a of arcs){
const al=1-a.t/a.life;
ctx.globalAlpha=al;
ctx.strokeStyle='#cfe9ff';ctx.lineWidth=2.5;ctx.lineCap='round';
ctx.beginPath();ctx.moveTo(a.x1,a.y1);
const mx=(a.x1+a.x2)/2+rnd(-10,10),my=(a.y1+a.y2)/2+rnd(-10,10);
ctx.quadraticCurveTo(mx,my,a.x2,a.y2);
ctx.stroke();
ctx.globalAlpha=al*.3;ctx.lineWidth=6;ctx.stroke();
}
ctx.globalAlpha=1;
}
function drawBites(){
for(const f of biteFxs){
const p=1-f.t/f.life;
const open=(1-p)*1.0;
ctx.save();
ctx.translate(f.x,f.y);ctx.rotate(f.ang);
ctx.globalAlpha=p*.9;
for(const s of[-1,1]){
const cy=s*(open*26+9);
const tooth=-s*11;
ctx.beginPath();
ctx.moveTo(-30,cy);
ctx.lineTo(-30,cy-s*9);
ctx.lineTo(44,cy-s*7);
ctx.lineTo(44,cy);
for(let i=5;i>=0;i--){
ctx.lineTo(-30+i*11+5.5,cy+tooth);
ctx.lineTo(-30+i*11,cy);
}
ctx.closePath();
ctx.fillStyle='#efe6d6';ctx.fill();
ctx.strokeStyle='#140b0e';ctx.lineWidth=2;ctx.stroke();
}
if(p<.5){
ctx.globalAlpha=(1-p*2)*.6;
ctx.fillStyle='#d9465a';
ctx.beginPath();ctx.arc(0,0,14,0,TAU);ctx.fill();
}
ctx.restore();
}
ctx.globalAlpha=1;
}
/* ==== v1.2.0: SPRITES DAS ARMAS — solte PNGs em assets/sprites/armas/ ====
   pistolas.png (o par), tiro.png (pistola única), feixe.png (carga),
   serra.png (serra), espada.png, mordida.png — sem arquivo, o desenho
   vetorial de sempre é usado. Re-sonda a cada 15s. */
const WPN_DIR='assets/sprites/armas/';
const WPN_EXTS=['png','jpg','jpeg','webp','gif'];
const WPN_SPR={};const WPN_PROBED={};
function wpnGet(name){
 if(WPN_SPR[name])return WPN_SPR[name];
 if(WPN_PROBED[name])return null;
 WPN_PROBED[name]=true;
 let i=0;
 (function next(){
  if(i>=WPN_EXTS.length){WPN_SPR[name]=null;return;}
  const im=new Image();
  im.onload=function(){WPN_SPR[name]=im;};
  im.onerror=function(){i++;next();};
  im.src=WPN_DIR+name+'.'+WPN_EXTS[i];
 })();
 return null;
}
['pistolas','tiro','feixe','serra','espada','mordida','colher','colher-ataque'].forEach(wpnGet); /* v1.3.4: a colher gigante ganhou sprites (parada + ataque) */
setInterval(function(){if(document.hidden)return;for(const k in WPN_SPR){if(WPN_SPR[k]===null){delete WPN_SPR[k];delete WPN_PROBED[k];wpnGet(k);}}},15000);
function wpnDraw(name,x,y,ang,w,h,flip,alpha){
 const im=wpnGet(name);
 if(!im)return false;
 try{
  ctx.save();
  ctx.translate(x,y);ctx.rotate(ang||0);
  if(flip)ctx.scale(-1,1);
  if(alpha!==undefined)ctx.globalAlpha*=alpha;
  const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
  if(iw&&ih){const k=Math.min(w/iw,h/ih);ctx.drawImage(im,-iw*k/2,-ih*k/2,iw*k,ih*k);}
  ctx.restore();
  return true;
 }catch(e){return false;}
}
/* v1.1.0: PISTOLAS GÊMEAS — duas armas de verdade, uma em cada pata
   v1.2.0: AGORA ELAS APARECEM (a chamada faltava no render) e usam o
   sprite pistolas.png se existir; pistola única usa tiro.png */
function drawPistols(){
if(player.dead||game.state==='menu'||game.state==='e404intro'||game.state==='reiintro')return;
if(game.hasPistols){
 const flash=(player.pistolT||0)>.24;
 for(const s of[-1,1]){
const a=player.angle,perp=a+Math.PI/2;
const ox=Math.cos(perp)*8*s,oy=Math.sin(perp)*8*s;
const px=player.x+Math.cos(a)*10+ox,py=player.y+Math.sin(a)*10+oy;
if(wpnDraw('pistolas',px,py,a,30,18,s<0)){
 if(flash){ctx.save();ctx.globalAlpha=.75;ctx.fillStyle='#ffd9a0';ctx.beginPath();ctx.arc(px+Math.cos(a)*20,py+Math.sin(a)*20,3.6,0,TAU);ctx.fill();ctx.restore();}
}else{
ctx.save();
ctx.translate(px,py);ctx.rotate(a);
ctx.fillStyle='#2e2823';ctx.fillRect(-3,-2.5,13,5);
ctx.fillStyle='#4a4038';ctx.fillRect(8,-1.5,7,3);
ctx.fillStyle='#1d1916';ctx.fillRect(-3,1.5,4,5);
ctx.strokeStyle='#14100e';ctx.lineWidth=1;ctx.strokeRect(-3,-2.5,13,5);
if(flash){ctx.fillStyle='rgba(255,217,160,'+(.45+.5*Math.random()).toFixed(2)+')';ctx.beginPath();ctx.arc(17,0,3.4,0,TAU);ctx.fill();}
ctx.restore();
}
}
}else{
/* v1.2.0: pistola única — sprite tiro.png na pata, se fornecido */
if(game.hasShot){
 const a1=player.angle;
 wpnDraw('tiro',player.x+Math.cos(a1)*13,player.y+Math.sin(a1)*13+6,a1,26,15,false);
}
}
}
function drawSwords(){
for(const f of swordFxs){
const p=f.t/f.life;
const sweep=smooth(Math.min(1,p*1.4));
const al=1-p;
ctx.save();
ctx.translate(player.x,player.y);
ctx.lineCap='round';
ctx.strokeStyle='#e6dac4';
ctx.globalAlpha=al*.85;ctx.lineWidth=7;
ctx.beginPath();ctx.arc(0,0,f.range-10,f.ang-1.2+sweep*2.4,f.ang-1.2+sweep*2.4+.9);ctx.stroke();
ctx.globalAlpha=al*.4;ctx.lineWidth=3;
ctx.beginPath();ctx.arc(0,0,f.range-24,f.ang-1.2+sweep*2.4,f.ang-1.2+sweep*2.4+1.2);ctx.stroke();
ctx.restore();
}
ctx.globalAlpha=1;
}
function drawNovas(){
for(const f of novaFxs){
const p=f.t/f.life;
const al=1-p;
const r=f.r*smooth(p);
ctx.strokeStyle='#9fd8ff';
ctx.globalAlpha=al*.7;ctx.lineWidth=8;
ctx.beginPath();ctx.arc(player.x,player.y,r,0,TAU);ctx.stroke();
ctx.globalAlpha=al*.35;ctx.lineWidth=3;
ctx.beginPath();ctx.arc(player.x,player.y,r*.8,0,TAU);ctx.stroke();
ctx.globalAlpha=al*.25;ctx.lineWidth=14;
ctx.beginPath();ctx.arc(player.x,player.y,r,0,TAU);ctx.stroke();
}
ctx.globalAlpha=1;
}
function drawStakes(){
for(const f of stakeFxs){
const p=f.t/f.life;
const al=1-p;
const drop=smooth(Math.min(1,p*2));
ctx.save();
ctx.translate(f.x,f.y);
ctx.globalAlpha=al;
const h=110*(1-drop*.15);
ctx.fillStyle='#9fd8ff';
ctx.beginPath();
ctx.moveTo(0,0);
ctx.lineTo(-7,-h*.55);
ctx.lineTo(-4,-h);
ctx.lineTo(4,-h);
ctx.lineTo(7,-h*.55);
ctx.closePath();ctx.fill();
ctx.strokeStyle='#e6f4ff';ctx.lineWidth=1.5;ctx.stroke();
ctx.globalAlpha=al*.5;
ctx.beginPath();ctx.arc(0,0,26*drop+4,0,TAU);
ctx.strokeStyle='#9fd8ff';ctx.lineWidth=2;ctx.stroke();
ctx.restore();
}
ctx.globalAlpha=1;
}
function drawHammer(h){
ctx.save();ctx.translate(h.x,h.y);
ctx.fillStyle='rgba(143,208,232,0.16)';
ctx.beginPath();ctx.arc(0,0,22,0,TAU);ctx.fill();
ctx.rotate(h.spin);
ctx.fillStyle='#6b4a2f';ctx.fillRect(-1.5,3,3,15);
ctx.fillStyle='#b9c2c9';ctx.fillRect(-10,-9,20,12);
ctx.strokeStyle='#1d2b33';ctx.lineWidth=2;ctx.strokeRect(-10,-9,20,12);
ctx.fillStyle='rgba(207,233,255,0.55)';ctx.fillRect(-10,-9,20,3.5);
ctx.restore();
}
/* ============ render: demônios ============ */
function blob(x,y,r,seed,amp){
ctx.beginPath();
const N=10;
for(let i=0;i<=N;i++){
const a=i/N*TAU;
const rr=r*(.9+amp*Math.sin(a*3+game.t*6+seed));
const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;
if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
}
ctx.closePath();
}
function drawHorns(e,len,curve,col){
const fx=Math.cos(e.ang),fy=Math.sin(e.ang);
ctx.strokeStyle=col||'#b9a68f';ctx.lineWidth=len*.28;ctx.lineCap='round';
for(const s of[-1,1]){
const bx=e.x+fx*e.r*.7-fy*s*e.r*.5,by=e.y+fy*e.r*.7+fx*s*e.r*.5;
ctx.beginPath();ctx.moveTo(bx,by);
ctx.quadraticCurveTo(bx+fx*len*.4-fy*s*len*curve,by+fy*len*.4+fx*s*len*curve,bx+fx*len-fy*s*len*.5,by+fy*len+fx*s*len*.5);
ctx.stroke();
}
}
/* ============================================================
   FALSO PARAÍSO — render dos inimigos como almas/espirituais.
   Cada inimigo é desenhado como uma entidade etérea flutuante
   com aparência inicial angelical mas com características perturbadoras:
   corpo translúcido, aura celestial, olhos brilhantes, sombra que
   não corresponde à luz, e distorções sutis no corpo.
   ============================================================ */
function drawParadiseEnemy(e){
const s=Math.min(1,e.spawnT);
/* PNG EDITION: sprite externo com tratamento espectral (assets/sprites/) */
if(window.THOR_PNG_MODE&&window.THOR_PNG&&window.THOR_PNG.drawParadise){
  if(window.THOR_PNG.drawParadise(ctx,e,game,s,paradiseDistort()))return;
}
const distort=paradiseDistort();
const bob=Math.sin(game.t*1.4+e.seed)*3; /* flutuação lenta */
const ey=e.y+bob;
/* === sombra que não corresponde à iluminação — offset proposital === */
ctx.fillStyle='rgba(20,16,28,'+(0.3+distort*0.2)+')';
const shadowOff=8+Math.sin(game.t+e.seed)*4; /* se move de forma estranha */
ctx.beginPath();ctx.ellipse(e.x+shadowOff,e.y+e.r*.55+8,e.r*s*.8,e.r*.3*s,0,0,TAU);ctx.fill();
/* === aura celestial — halo dourado/azulado ao redor === */
const haloA=.32+.18*Math.sin(game.t*2+e.seed);
const haloR=e.r+14;
const halo=ctx.createRadialGradient(e.x,ey,2,e.x,ey,haloR);
/* cores angelicais que ficam perturbadoras com o andar */
const haloIn=distort<.5?'rgba(255,250,220,'+(haloA)+')':'rgba(220,200,180,'+(haloA*0.8)+')';
const haloOut=distort<.5?'rgba(255,243,196,0)':'rgba(180,140,140,0)';
halo.addColorStop(0,haloIn);
halo.addColorStop(.6,distort<.5?'rgba(255,243,196,'+(haloA*.4)+')':'rgba(200,160,160,'+(haloA*.4)+')');
halo.addColorStop(1,haloOut);
ctx.fillStyle=halo;
ctx.beginPath();ctx.arc(e.x,ey,haloR,0,TAU);ctx.fill();
/* === corpo espectral — silhueta translúcida vestida de branco === */
ctx.save();
ctx.translate(e.x,ey);ctx.scale(s,s);ctx.translate(-e.x,-ey);
/* corpo principal — vestes brancas translúcidas */
ctx.globalAlpha=.55+.15*Math.sin(game.t*1.8+e.seed);
/* manto/veste — forma de gota invertida */
ctx.fillStyle=distort<.5?'rgba(248,244,228,0.85)':'rgba(220,210,200,0.85)';
ctx.beginPath();
const r=e.r;
ctx.moveTo(e.x-r*.7,ey+r*.8);
ctx.quadraticCurveTo(e.x-r*.9,ey+r*.2,e.x-r*.6,ey-r*.3);
ctx.quadraticCurveTo(e.x-r*.4,ey-r*.7,e.x,ey-r*.85);
ctx.quadraticCurveTo(e.x+r*.4,ey-r*.7,e.x+r*.6,ey-r*.3);
ctx.quadraticCurveTo(e.x+r*.9,ey+r*.2,e.x+r*.7,ey+r*.8);
ctx.quadraticCurveTo(e.x,ey+r,e.x-r*.7,ey+r*.8);
ctx.closePath();ctx.fill();
/* dobras do manto */
ctx.strokeStyle='rgba(200,190,170,0.4)';ctx.lineWidth=1.2;
ctx.beginPath();ctx.moveTo(e.x-r*.3,ey-r*.2);ctx.quadraticCurveTo(e.x-r*.2,ey+r*.3,e.x-r*.4,ey+r*.7);ctx.stroke();
ctx.beginPath();ctx.moveTo(e.x+r*.3,ey-r*.2);ctx.quadraticCurveTo(e.x+r*.2,ey+r*.3,e.x+r*.4,ey+r*.7);ctx.stroke();
ctx.beginPath();ctx.moveTo(e.x,ey-r*.5);ctx.lineTo(e.x,ey+r*.7);ctx.stroke();
/* === cabeça — rosto pouco definido === */
ctx.fillStyle=distort<.5?'rgba(248,244,228,0.9)':'rgba(220,210,200,0.9)';
ctx.beginPath();ctx.arc(e.x,ey-r*.65,r*.35,0,TAU);ctx.fill();
/* véu/capuz cobrindo parte do rosto */
ctx.fillStyle='rgba(220,210,190,0.6)';
ctx.beginPath();
ctx.moveTo(e.x-r*.4,ey-r*.6);
ctx.quadraticCurveTo(e.x-r*.5,ey-r*.9,e.x,ey-r*.95);
ctx.quadraticCurveTo(e.x+r*.5,ey-r*.9,e.x+r*.4,ey-r*.6);
ctx.lineTo(e.x+r*.3,ey-r*.3);
ctx.lineTo(e.x-r*.3,ey-r*.3);
ctx.closePath();ctx.fill();
/* === olhos brilhantes — única parte bem definida === */
const eyeY=ey-r*.65;
const eyeA=.7+.3*Math.sin(game.t*5+e.seed);
const eyeCol=distort<.4?'rgba(255,243,196,':'rgba(255,180,160,';
/* brilho grande atrás dos olhos */
ctx.fillStyle=eyeCol+(eyeA*.3)+')';
ctx.beginPath();ctx.arc(e.x-r*.15,eyeY,r*.18,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(e.x+r*.15,eyeY,r*.18,0,TAU);ctx.fill();
/* olhos propriamente */
ctx.fillStyle=eyeCol+eyeA+')';
ctx.beginPath();ctx.arc(e.x-r*.15,eyeY,r*.09,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(e.x+r*.15,eyeY,r*.09,0,TAU);ctx.fill();
/* núcleo brilhante */
ctx.fillStyle='rgba(255,255,255,'+eyeA+')';
ctx.beginPath();ctx.arc(e.x-r*.15,eyeY,r*.04,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(e.x+r*.15,eyeY,r*.04,0,TAU);ctx.fill();
/* === detalhes perturbadores que aparecem com o andar === */
if(distort>.4){
  /* boca fina torta */
  ctx.strokeStyle='rgba(60,30,30,0.7)';ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(e.x-r*.1,eyeY+r*.18);
  ctx.quadraticCurveTo(e.x,eyeY+r*.22+(distort-.5)*4,e.x+r*.1,eyeY+r*.18);
  ctx.stroke();
}
if(distort>.6){
  /* corpo parcialmente desaparecendo — partes transparentes */
  ctx.globalAlpha=.2;
  ctx.fillStyle='rgba(20,16,18,0.7)';
  ctx.beginPath();
  ctx.arc(e.x+r*.3,ey+r*.2,r*.25,0,TAU);ctx.fill();
  ctx.beginPath();
  ctx.arc(e.x-r*.4,ey-r*.1,r*.2,0,TAU);ctx.fill();
  ctx.globalAlpha=1;
}
if(distort>.7){
  /* distorção no corpo — membros extras */
  ctx.globalAlpha=.5;
  ctx.fillStyle='rgba(248,244,228,0.5)';
  ctx.beginPath();
  ctx.arc(e.x+r*.6+rnd(-2,2),ey+r*.4,r*.15,0,TAU);ctx.fill();
  ctx.globalAlpha=1;
}
ctx.globalAlpha=1;
ctx.restore();
/* === brilho pulsante ao redor da cabeça (auréola) === */
if(distort<.6){
  const auraA=.15+.1*Math.sin(game.t*3+e.seed);
  ctx.strokeStyle='rgba(255,250,220,'+auraA+')';
  ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(e.x,ey-r*.85,r*.5,0,TAU);ctx.stroke();
}
/* === partículas de luz descendo do inimigo === */
if(Math.random()<.08){
  particles.push({x:e.x+rnd(-r*.5,r*.5),y:ey-rnd(0,r*.5),vx:rnd(-3,3),vy:rnd(8,16),life:1.2,t:0,r:rnd(.6,1.4),c:'rgba(255,243,196,0.7)',drag:.96,glow:true});
}
/* === flash de dano — mantém o efeito original === */
if(e.flash>0){
  ctx.fillStyle='rgba(255,255,255,'+Math.min(.8,e.flash*7)+')';
  ctx.beginPath();ctx.arc(e.x,ey,r+4,0,TAU);ctx.fill();
}
/* === status — lentidão/veneno sobrepostos === */
let hasStatus=false;
if(e.slowT>0)hasStatus=true;
if(e.poisT>0)hasStatus=true;
if(hasStatus){
  ctx.save();ctx.translate(e.x,ey);
  if(e.slowT>0){ctx.fillStyle='rgba(159,216,255,0.3)';ctx.beginPath();ctx.arc(0,0,r+2,0,TAU);ctx.fill();}
  if(e.poisT>0){ctx.fillStyle='rgba(168,194,79,0.25)';ctx.beginPath();ctx.arc(0,0,r+2,0,TAU);ctx.fill();}
  ctx.restore();
}
/* === assinatura de ataque telegrafada — mantém a mecânica === */
if(e.st==='tele'){
  const g=.35+.3*Math.sin(game.t*20);
  ctx.strokeStyle='rgba(255,243,196,'+g+')';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(e.x,ey,r+12,0,TAU);ctx.stroke();
  const sk=sigKeyFor(e);
  const prog=clamp(e.stT/.55,0,1);
  drawAttackSig(e.x,ey,r+16,sk,prog);
}
}
function drawEnemy(e){
/* v1.0.0: aura dos RAROS — desenhada antes de tudo: vermelho = vida garantida,
   laranja = fagulha garantida. Brilho pulsante impossível de ignorar. */
if(e.rare){
const rc=e.rare==='vida'?'#d9465a':'#ff8f3d';
const pul=.5+.5*Math.sin(game.t*5+e.seed);
ctx.save();
ctx.globalAlpha=.16+.12*pul;
ctx.fillStyle=rc;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+9+pul*5,0,TAU);ctx.fill();
ctx.globalAlpha=.5+.3*pul;
ctx.strokeStyle=rc;ctx.lineWidth=2;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+6+pul*4,0,TAU);ctx.stroke();
ctx.restore();
if(Math.random()<.05)particles.push({x:e.x+rnd(-e.r,e.r),y:e.y-e.r,vx:rnd(-10,10),vy:rnd(-40,-14),life:.5,t:0,r:1.6,c:rc,drag:.95,glow:true});
}
/* ==== FALSO PARAÍSO — inimigos espirituais/angelicais perturbadores ====
   No Andar 2+, todos os inimigos não-boss são redenrizados como almas flutuantes:
   corpos parcialmente transparentes, aura celestial, olhos brilhantes,
   sombras que não correspondem à luz real, e flutuação lenta. O desenho
   original do inimigo é reaproveitado mas passa por um "filtro espectral". */
const isParadise=isParadiseFloor()&&!ROOM.inverted;
const isBossType=e.type==='mb'||e.type==='ex'||e.type==='vi'||e.type==='gz'||e.type==='rk'||e.type==='rkm'||e.type==='e404'||e.type==='cw1'||e.type==='cw2'||e.type==='cw3'||e.type==='cw4';
if(isParadise&&!isBossType){
  drawParadiseEnemy(e);
  return;
}
/* v1.3.0: chefes da expansão */
if(e.xboss&&window.__EXPANSION){window.__EXPANSION.drawXBoss(e);return;}
const s=Math.min(1,e.spawnT);
ctx.fillStyle='rgba(0,0,0,0.3)';
ctx.beginPath();ctx.ellipse(e.x,e.y+e.r*.55,e.r*s,e.r*.4*s,0,0,TAU);ctx.fill();
/* PNG EDITION: qualquer inimigo pode usar sprite externo (assets/sprites/).
   Sem PNG para o tipo, o desenho vetorial original é usado normalmente. */
if(window.THOR_PNG_MODE&&window.THOR_PNG&&window.THOR_PNG.drawEnemy){
  if(window.THOR_PNG.drawEnemy(ctx,e,game,s))return;
}
ctx.save();ctx.translate(e.x,e.y);ctx.scale(s,s);ctx.translate(-e.x,-e.y);
if(e.type==='e404'){
const jx=Math.random()<.14?rnd(-6,6):0,jy=Math.random()<.14?rnd(-4,4):0;
ctx.translate(jx,jy);
ctx.globalAlpha=.16+.08*Math.sin(game.t*7);
ctx.fillStyle='#ff4fd8';
ctx.beginPath();ctx.arc(e.x,e.y,e.r+26,0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.save();
ctx.translate(e.x,e.y);
ctx.rotate(Math.sin(game.t*1.4)*.06);
ctx.fillStyle='#0b0a0d';
ctx.fillRect(-e.r,-e.r,e.r*2,e.r*2);
ctx.strokeStyle='#f2f0ea';ctx.lineWidth=2.5;
ctx.strokeRect(-e.r,-e.r,e.r*2,e.r*2);
ctx.strokeStyle='rgba(242,240,234,.22)';ctx.lineWidth=1;
for(let sy=-e.r+5;sy<e.r;sy+=7){ctx.beginPath();ctx.moveTo(-e.r+4,sy);ctx.lineTo(e.r-4,sy);ctx.stroke();}
txt('404',0,2,MONO,24,Math.floor(game.t*6)%2?'#ff4fd8':'#4ff5ff','center',2);
ctx.strokeStyle=Math.floor(game.t*8)%2?'#ff4fd8':'#4ff5ff';ctx.lineWidth=2.5;
for(const cx of[-1,1])for(const cy of[-1,1]){
ctx.beginPath();
ctx.moveTo(cx*e.r-(cx*10),cy*e.r);
ctx.lineTo(cx*e.r,cy*e.r-(cy*10));
ctx.stroke();
}
ctx.restore();
if(e.st==='tele'){
const g=.35+.35*Math.sin(game.t*20);
ctx.strokeStyle='rgba(255,79,216,'+g+')';ctx.lineWidth=3;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+14,0,TAU);ctx.stroke();
/* assinatura visual do ataque (e404) */
const sk=sigKeyFor(e);
const dur=e.pat?(.42):.42;
const prog=clamp(e.stT/dur,0,1);
drawAttackSig(e.x,e.y,e.r+18,sk,prog);
}
if(e.flash>0){
ctx.fillStyle='rgba(255,255,255,'+Math.min(.8,e.flash*7)+')';
ctx.fillRect(e.x-e.r,e.y-e.r,e.r*2,e.r*2);
}
ctx.restore();
return;
}
if(e.type==='rk'||e.type==='rkm'){
const mirror=e.type==='rkm';
const alpha=mirror?.8:1;
drawReiBody(e.x,e.y,e.r,mirror,alpha);
/* sombra: aura arroxeada/acinzentada distinguível do rei verdadeiro */
if(mirror&&game.rkP2){
ctx.globalAlpha=.18+.12*Math.sin(game.t*4+e.seed);
ctx.fillStyle=RKM_FAKE_COLOR;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+12,0,TAU);ctx.fill();
ctx.globalAlpha=.45;
ctx.strokeStyle=RKM_FAKE_COLOR_2;ctx.lineWidth=2;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+8,0,TAU);ctx.stroke();
ctx.globalAlpha=1;
}
if(e.p2){
ctx.globalAlpha=.3+.2*Math.sin(game.t*10);
ctx.strokeStyle='#d8cfc0';ctx.lineWidth=2.5;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+16,0,TAU);ctx.stroke();
ctx.globalAlpha=1;
}
if(e.st==='tele'){
const g=.35+.3*Math.sin(game.t*16);
const tcol=mirror&&game.rkP2?'rgba(122,91,138,':'rgba(255,217,160,';
ctx.strokeStyle=tcol+g+')';ctx.lineWidth=3;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+16,0,TAU);ctx.stroke();
ctx.save();ctx.translate(e.x,e.y);ctx.rotate(game.t*2);
ctx.strokeStyle=tcol+(g*.8)+')';ctx.lineWidth=2;
ctx.strokeRect(-e.r-8,-e.r-8,(e.r+8)*2,(e.r+8)*2);
ctx.restore();
/* assinatura visual do ataque do rei (sombra usa cor falsa) */
const sk=sigKeyFor(e);
const dur=(e.type==='rkm'?(game.hard?.42:.55):(game.hard?.5:.7));
const prog=clamp(e.stT/dur,0,1);
const altCol=(e.type==='rkm'&&game.rkP2)?RKM_FAKE_COLOR_2:null;
drawAttackSig(e.x,e.y,e.r+22,sk,prog,altCol);
}
if(e.flash>0){
ctx.fillStyle='rgba(255,240,210,'+Math.min(.75,e.flash*6)+')';
ctx.beginPath();ctx.arc(e.x,e.y,e.r+12,0,TAU);ctx.fill();
}
ctx.restore();
return;
}
if(e.type==='cw1'||e.type==='cw2'||e.type==='cw3'||e.type==='cw4'){
drawKnight(e);
ctx.restore();
return;
}
/* v0.9.7: O OBSERVADOR — olho gigante flutuante */
if(e.type==='observer'){
const bob=Math.sin(game.t*1.5+e.bobPh)*6;
/* aura vermelha pulsante */
ctx.globalAlpha=.18+.1*Math.sin(game.t*4+e.bobPh);
ctx.fillStyle='#ff4fd8';
ctx.beginPath();ctx.arc(e.x,e.y+bob,e.r+22,0,TAU);ctx.fill();
ctx.globalAlpha=1;
/* tentáculos de sombra embaixo */
ctx.strokeStyle='rgba(20,8,14,0.85)';ctx.lineWidth=3;ctx.lineCap='round';
for(let k=0;k<8;k++){
const aa=k/8*TAU+game.t*.6;
const len=e.r*1.6+Math.sin(game.t*3+k)*4;
ctx.beginPath();
ctx.moveTo(e.x+Math.cos(aa)*e.r*.6,e.y+bob+Math.sin(aa)*e.r*.6);
ctx.quadraticCurveTo(
  e.x+Math.cos(aa)*len*.8,e.y+bob+Math.sin(aa)*len*.8+10,
  e.x+Math.cos(aa)*len,e.y+bob+Math.sin(aa)*len+8
);
ctx.stroke();
}
/* corpo do olho (branco) */
ctx.fillStyle='#f2f0ea';
ctx.beginPath();ctx.arc(e.x,e.y+bob,e.r,0,TAU);ctx.fill();
ctx.strokeStyle='#0b0a0d';ctx.lineWidth=2.5;
ctx.stroke();
/* íris vermelha — segue o jogador */
const pa=Math.atan2(player.y-(e.y+bob),player.x-e.x);
const ix=e.x+Math.cos(pa)*e.r*.35,iy=e.y+bob+Math.sin(pa)*e.r*.35;
ctx.fillStyle='#a52a3a';
ctx.beginPath();ctx.arc(ix,iy,e.r*.45,0,TAU);ctx.fill();
ctx.fillStyle='#ff4fd8';
ctx.beginPath();ctx.arc(ix,iy,e.r*.32,0,TAU);ctx.fill();
/* pupila preta */
ctx.fillStyle='#0b0a0d';
ctx.beginPath();ctx.arc(ix,iy,e.r*.16,0,TAU);ctx.fill();
/* brilho */
ctx.fillStyle='rgba(255,255,255,0.7)';
ctx.beginPath();ctx.arc(ix-e.r*.12,iy-e.r*.12,e.r*.08,0,TAU);ctx.fill();
/* sangramento vermelho saindo do olho */
if(Math.random()<.4)particles.push({x:e.x+rnd(-e.r*.4,e.r*.4),y:e.y+bob+e.r*.5,vx:rnd(-12,12),vy:rnd(20,60),life:.8,t:0,r:rnd(1.5,3),c:'#a52a3a',drag:1,glow:true});
/* anel de aviso quando vai atacar */
if(e.st==='tele'){
const g=.35+.3*Math.sin(game.t*20);
ctx.strokeStyle='rgba(255,79,216,'+g+')';ctx.lineWidth=3;
ctx.beginPath();ctx.arc(e.x,e.y+bob,e.r+14,0,TAU);ctx.stroke();
}
if(e.flash>0){
ctx.fillStyle='rgba(255,255,255,'+Math.min(.85,e.flash*7)+')';
ctx.beginPath();ctx.arc(e.x,e.y+bob,e.r,0,TAU);ctx.fill();
}
ctx.restore();
return;
}
if(e.type==='pn'){
const bob=Math.sin(game.t*4+e.seed)*2;
ctx.save();
ctx.translate(e.x,e.y+bob);
ctx.fillStyle='#d8cfc0';ctx.strokeStyle='#241b16';ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(-8,12);ctx.lineTo(8,12);ctx.lineTo(6,6);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.stroke();
ctx.beginPath();ctx.moveTo(-6,6);ctx.quadraticCurveTo(-6,-2,-4,-4);ctx.lineTo(4,-4);ctx.quadraticCurveTo(6,-2,6,6);ctx.closePath();ctx.fill();ctx.stroke();
ctx.beginPath();ctx.arc(0,-9,4.5,0,TAU);ctx.fill();ctx.stroke();
ctx.fillStyle='#241b16';
ctx.beginPath();ctx.arc(-1.8,-9,.9,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(1.8,-9,.9,0,TAU);ctx.fill();
ctx.restore();
let hasStatus=false;
if(e.slowT>0)hasStatus=true;
if(e.poisT>0)hasStatus=true;
if(e.flash>0)hasStatus=true;
if(hasStatus){
blob(e.x,e.y,e.r,e.seed,.13);
if(e.slowT>0){ctx.fillStyle='rgba(159,216,255,0.3)';ctx.fill();}
if(e.poisT>0){ctx.fillStyle='rgba(168,194,79,0.25)';ctx.fill();}
if(e.flash>0){ctx.fillStyle='rgba(255,240,230,'+Math.min(.85,e.flash*8)+')';ctx.fill();}
}
ctx.restore();
return;
}
if(e.type==='vi'){
ctx.save();
ctx.translate(e.x,e.y);
ctx.strokeStyle='#241a20';ctx.lineWidth=3;ctx.lineCap='round';
for(let k=0;k<8;k++){
const a=k/8*TAU+Math.sin(game.t*3+k)*0.12;
const l=e.r*1.7;
ctx.beginPath();
ctx.moveTo(Math.cos(a)*e.r*.5,Math.sin(a)*e.r*.5);
ctx.quadraticCurveTo(Math.cos(a-.25)*l*.7,Math.sin(a-.25)*l*.7,Math.cos(a)*l,Math.sin(a)*l*.8);
ctx.stroke();
}
blob(0,0,e.r,e.seed,.08);
ctx.fillStyle='#1a1218';ctx.fill();
ctx.strokeStyle='#3d2438';ctx.lineWidth=2;ctx.stroke();
ctx.fillStyle='#e8455a';
for(let k=0;k<4;k++){
const a=e.ang+(k-1.5)*.22;
ctx.beginPath();ctx.arc(Math.cos(a)*e.r*.45,Math.sin(a)*e.r*.45,2.4,0,TAU);ctx.fill();
}
ctx.restore();
/* v1.6.3: FIOS DA MORTE — os fios ficam visíveis: finos antes de tensionar,
   esticados e brilhando enquanto CORTAM, sumindo quando a vida acaba */
if(e.st==='kz_threads'&&e.data&&e.data.threads){
for(const th of e.data.threads){
  if(!th.cut){
    ctx.globalAlpha=.55;ctx.strokeStyle='#dfe7ee';ctx.lineWidth=1.2;
    ctx.setLineDash([5,6]);
    ctx.beginPath();ctx.moveTo(th.ax,th.ay);ctx.lineTo(th.bx,th.by);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=1;
  }else if(th.life>0){
    const fade=clamp(th.life/.5,0,1);
    ctx.globalAlpha=.4*fade;ctx.strokeStyle='#f2f6fa';ctx.lineWidth=6;
    ctx.beginPath();ctx.moveTo(th.ax,th.ay);ctx.lineTo(th.bx,th.by);ctx.stroke();
    ctx.globalAlpha=.9*fade;ctx.strokeStyle='#f2f6fa';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(th.ax,th.ay);ctx.lineTo(th.bx,th.by);ctx.stroke();
    ctx.globalAlpha=1;
  }
}
}
if(e.st==='tele'){
const g=.35+.3*Math.sin(game.t*20);
ctx.strokeStyle='rgba(157,107,181,'+g+')';ctx.lineWidth=2.5;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+12,0,TAU);ctx.stroke();
/* assinatura visual do ataque (viúva) */
const sk=sigKeyFor(e);
const prog=clamp(e.stT/.55,0,1);
drawAttackSig(e.x,e.y,e.r+16,sk,prog);
}
if(e.flash>0){
blob(e.x,e.y,e.r,e.seed,.08);
ctx.fillStyle='rgba(255,240,230,'+Math.min(.8,e.flash*7)+')';ctx.fill();
}
ctx.restore();
return;
}
if(e.type==='gz'){
ctx.save();
ctx.translate(e.x,e.y);
ctx.rotate(Math.sin(game.t*.8+e.seed)*.03);
ctx.fillStyle='#332e2a';
ctx.fillRect(-e.r,-e.r*.9,e.r*2,e.r*1.8);
ctx.strokeStyle='#57504e';ctx.lineWidth=3;
ctx.strokeRect(-e.r,-e.r*.9,e.r*2,e.r*1.8);
ctx.strokeStyle='#241b20';ctx.lineWidth=1.5;
ctx.beginPath();
ctx.moveTo(-e.r*.6,-e.r*.9);ctx.lineTo(-e.r*.3,e.r*.1);ctx.lineTo(-e.r*.5,e.r*.9);
ctx.moveTo(e.r*.7,-e.r*.2);ctx.lineTo(e.r*.3,e.r*.3);
ctx.stroke();
ctx.fillStyle='#ff8f3d';
ctx.beginPath();ctx.arc(0,-e.r*.15,e.r*.22,0,TAU);ctx.fill();
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(0,-e.r*.15,e.r*.1,0,TAU);ctx.fill();
ctx.restore();
if(e.st==='act'&&e.pat==='beam'&&e.data&&e.data.beam){
const b=e.data.beam;
const L=rayLen(e.x,e.y,b.ang);
const ex2=e.x+Math.cos(b.ang)*L,ey2=e.y+Math.sin(b.ang)*L;
if(b.t<b.warm){
ctx.strokeStyle='rgba(255,143,61,'+(.25+.25*Math.sin(game.t*20))+')';
ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(ex2,ey2);ctx.stroke();
}else{
ctx.strokeStyle='rgba(255,143,61,.3)';ctx.lineWidth=18;
ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(ex2,ey2);ctx.stroke();
ctx.strokeStyle='#ff8f3d';ctx.lineWidth=7;
ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(ex2,ey2);ctx.stroke();
ctx.strokeStyle='#fff3c4';ctx.lineWidth=2.5;
ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(ex2,ey2);ctx.stroke();
}
}
if(e.st==='tele'){
const g=.35+.3*Math.sin(game.t*20);
ctx.strokeStyle='rgba(255,143,61,'+g+')';ctx.lineWidth=3;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+14,0,TAU);ctx.stroke();
/* assinatura visual do ataque (golem) */
const sk=sigKeyFor(e);
const prog=clamp(e.stT/.7,0,1);
drawAttackSig(e.x,e.y,e.r+18,sk,prog);
}
if(e.flash>0){
ctx.fillStyle='rgba(255,240,230,'+Math.min(.8,e.flash*7)+')';
ctx.fillRect(e.x-e.r,e.y-e.r*.9,e.r*2,e.r*1.8);
}
ctx.restore();
return;
}
if(e.type==='al'){
const pul=1+.12*Math.sin(game.t*5+e.seed);
ctx.globalAlpha=.3;ctx.fillStyle='#bfd8e8';
ctx.beginPath();ctx.arc(e.x,e.y,e.r*2*pul,0,TAU);ctx.fill();
ctx.globalAlpha=.85;ctx.fillStyle='#e6f0f2';
blob(e.x,e.y,e.r,e.seed,.18);ctx.fill();
ctx.fillStyle='#fff';
ctx.beginPath();ctx.arc(e.x,e.y-2,e.r*.5,0,TAU);ctx.fill();
ctx.fillStyle='#2a3a44';
ctx.beginPath();ctx.arc(e.x-2.5,e.y-3,1,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(e.x+2.5,e.y-3,1,0,TAU);ctx.fill();
}else if(e.type==='es'){
ctx.globalAlpha=.75;
const gw=e.r,gh=e.r*1.35;
ctx.beginPath();
ctx.moveTo(e.x-gw,e.y-gh*.2);
ctx.quadraticCurveTo(e.x-gw,e.y-gh,e.x,e.y-gh);
ctx.quadraticCurveTo(e.x+gw,e.y-gh,e.x+gw,e.y-gh*.2);
for(let i=0;i<=4;i++){
const xx=e.x+gw-(2*gw)*(i/4);
const yy=e.y+gh*.55+((i%2)?6:-4)+Math.sin(game.t*6+i)*2;
ctx.lineTo(xx,yy);
}
ctx.closePath();
ctx.fillStyle='#cfdce2';ctx.fill();
ctx.strokeStyle='#e6f0f2';ctx.lineWidth=2;ctx.stroke();
ctx.globalAlpha=1;
ctx.fillStyle='#22262b';
ctx.beginPath();ctx.arc(e.x-e.r*.35,e.y-e.r*.3,2.2,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(e.x+e.r*.35,e.y-e.r*.3,2.2,0,TAU);ctx.fill();
}else if(e.type==='la'){
ctx.beginPath();
ctx.moveTo(e.x,e.y+e.r*1.15);
ctx.bezierCurveTo(e.x-e.r*1.05,e.y+e.r*.35,e.x-e.r*.95,e.y-e.r*.75,e.x,e.y-e.r*.85);
ctx.bezierCurveTo(e.x+e.r*.95,e.y-e.r*.75,e.x+e.r*1.05,e.y+e.r*.35,e.x,e.y+e.r*1.15);
ctx.fillStyle='#bcd3dc';ctx.fill();
ctx.strokeStyle='#e6f0f2';ctx.lineWidth=2;ctx.stroke();
ctx.strokeStyle='#2a3a44';ctx.lineWidth=1.8;
ctx.beginPath();ctx.arc(e.x-3.5,e.y-2,2.4,.2,Math.PI-.2);ctx.stroke();
ctx.beginPath();ctx.arc(e.x+3.5,e.y-2,2.4,.2,Math.PI-.2);ctx.stroke();
}else if(e.type==='cr'||e.type==='crs'){
const n=e.type==='cr'?6:3,rr=e.r*.75;
ctx.globalAlpha=.22;ctx.fillStyle='#bfd8e8';
ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.6,0,TAU);ctx.fill();
ctx.globalAlpha=.9;ctx.fillStyle='#e6f0f2';
for(let k=0;k<n;k++){
const aa=k/n*TAU+game.t*(2.2+e.seed*.1);
ctx.beginPath();ctx.arc(e.x+Math.cos(aa)*rr,e.y+Math.sin(aa)*rr,e.type==='cr'?3.4:2.2,0,TAU);ctx.fill();
}
ctx.globalAlpha=1;
ctx.fillStyle='#2a3a44';
ctx.beginPath();ctx.arc(e.x-3,e.y,1.2,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(e.x+3,e.y,1.2,0,TAU);ctx.fill();
}else if(e.type==='vg'){
if(e.aimT<0.75&&e.aimA){
ctx.strokeStyle='rgba(255,207,77,'+(.22+.28*Math.sin(game.t*18))+')';
ctx.lineWidth=2;
ctx.setLineDash([10,8]);
ctx.beginPath();ctx.moveTo(e.x,e.y);
ctx.lineTo(e.x+Math.cos(e.aimA)*640,e.y+Math.sin(e.aimA)*640);
ctx.stroke();ctx.setLineDash([]);
}
ctx.globalAlpha=.28;ctx.fillStyle='#9fd8ff';
ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.7,0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.fillStyle='#1e2430';
ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,TAU);ctx.fill();
ctx.strokeStyle='#4a5a68';ctx.lineWidth=2;ctx.stroke();
const pa=Math.atan2(player.y-e.y,player.x-e.x);
ctx.fillStyle='#ffcf4d';
ctx.beginPath();ctx.arc(e.x+Math.cos(pa)*3.5,e.y+Math.sin(pa)*3.5,e.r*.42,0,TAU);ctx.fill();
ctx.fillStyle='#14100e';
ctx.beginPath();ctx.arc(e.x+Math.cos(pa)*5,e.y+Math.sin(pa)*5,e.r*.18,0,TAU);ctx.fill();
ctx.strokeStyle='#4a5a68';ctx.lineWidth=2;ctx.lineCap='round';
for(const sd of[-1,1]){
const fa2=Math.PI/2+sd*.7+Math.sin(game.t*3+sd)*.15;
ctx.beginPath();
ctx.moveTo(e.x+Math.cos(fa2)*e.r,e.y+Math.sin(fa2)*e.r);
ctx.lineTo(e.x+Math.cos(fa2)*(e.r+7),e.y+Math.sin(fa2)*(e.r+7));
ctx.stroke();
}
}else if(e.type==='pg'){
const bob=Math.sin(game.t*1.4+e.seed)*2;
ctx.save();ctx.translate(e.x,e.y+bob);
ctx.beginPath();
ctx.moveTo(-e.r*.8,e.r);
ctx.lineTo(-e.r*.55,-e.r*.9);
ctx.quadraticCurveTo(0,-e.r*1.25,e.r*.55,-e.r*.9);
ctx.lineTo(e.r*.8,e.r);
ctx.closePath();
ctx.fillStyle='#23272c';ctx.fill();
ctx.strokeStyle='#4a5258';ctx.lineWidth=2;ctx.stroke();
ctx.fillStyle='#0d0f12';
ctx.beginPath();ctx.ellipse(0,-e.r*.45,e.r*.4,e.r*.28,0,0,TAU);ctx.fill();
const lx=e.r*.75,ly=e.r*.15+Math.sin(game.t*2+e.seed)*2;
ctx.strokeStyle='#4a5258';ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(lx*.6,-e.r*.1);ctx.lineTo(lx,ly-6);ctx.stroke();
ctx.globalAlpha=.35+.15*Math.sin(game.t*4+e.seed);
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(lx,ly,10,0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(lx,ly,4,0,TAU);ctx.fill();
ctx.restore();
}else if(e.type==='fa'){
const flick=1+.15*Math.sin(game.t*12+e.seed);
ctx.globalAlpha=.25;ctx.fillStyle='#ff8f3d';
ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.8*flick,0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.ang);
ctx.beginPath();
ctx.moveTo(e.r*1.2,0);
ctx.quadraticCurveTo(e.r*.2,-e.r*.9,-e.r*.7,-e.r*.35);
ctx.quadraticCurveTo(-e.r*1.1,0,-e.r*.7,e.r*.35);
ctx.quadraticCurveTo(e.r*.2,e.r*.9,e.r*1.2,0);
ctx.closePath();
ctx.fillStyle='#ff8f3d';ctx.fill();
ctx.strokeStyle='#ffd9a0';ctx.lineWidth=1.5;ctx.stroke();
ctx.fillStyle='#fff3c4';
ctx.beginPath();ctx.arc(e.r*.15,0,e.r*.3,0,TAU);ctx.fill();
ctx.restore();
ctx.fillStyle='#2a1408';
ctx.beginPath();ctx.arc(e.x-2,e.y-2,1.2,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(e.x+2,e.y-2,1.2,0,TAU);ctx.fill();
}else if(e.type==='mf'){
/* v1.3.3: MORCEGO FLAMEJANTE — asas em brasa, corpo de carvão, olhos de fogo;
   o telegrafo acende o bicho todo */
const fl2=.5+.5*Math.sin(game.t*(e.teleT>0?22:9)+e.seed);
ctx.globalAlpha=.3;ctx.fillStyle=e.teleT>0?'#ffd9a0':'#ff8f3d';
ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1.7+.5*fl2),0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.save();ctx.translate(e.x,e.y);
const flap=Math.sin(game.t*13+e.seed)*.5;
for(const s2 of [-1,1]){
ctx.save();ctx.scale(s2,1);ctx.rotate(flap*.35);
ctx.fillStyle='#3a1410';
ctx.beginPath();
ctx.moveTo(e.r*.2,0);
ctx.quadraticCurveTo(e.r*1.5,-e.r*(1.1+flap*.3),e.r*2.3,-e.r*.25);
ctx.quadraticCurveTo(e.r*1.7,.1,e.r*1.55,.35);
ctx.quadraticCurveTo(e.r*1.15,.25,e.r*.9,.5);
ctx.quadraticCurveTo(e.r*.55,.2,e.r*.2,.35);
ctx.closePath();ctx.fill();
ctx.strokeStyle=e.teleT>0?'#ffd9a0':'#ff6a20';ctx.lineWidth=1.4;ctx.stroke();
ctx.restore();
}
ctx.fillStyle='#241009';
ctx.beginPath();ctx.ellipse(0,0,e.r*.62,e.r*.85,0,0,TAU);ctx.fill();
ctx.strokeStyle='#ff6a20';ctx.lineWidth=1.2;ctx.stroke();
ctx.beginPath();ctx.moveTo(-e.r*.4,-e.r*.6);ctx.lineTo(-e.r*.55,-e.r*1.25);ctx.lineTo(-e.r*.12,-e.r*.75);ctx.closePath();
ctx.moveTo(e.r*.4,-e.r*.6);ctx.lineTo(e.r*.55,-e.r*1.25);ctx.lineTo(e.r*.12,-e.r*.75);ctx.closePath();
ctx.fillStyle='#241009';ctx.fill();ctx.stroke();
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(-e.r*.24,-e.r*.15,1.6,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(e.r*.24,-e.r*.15,1.6,0,TAU);ctx.fill();
if(Math.random()<.12)particles.push({x:e.x+rnd(-e.r,e.r),y:e.y+e.r,vx:rnd(-8,8),vy:rnd(10,34),life:rnd(.3,.7),t:0,r:rnd(1,2),c:'#ff8f3d',drag:1,glow:true});
ctx.restore();
}else{
let fill='#33121a';
if(e.type==='br')fill='#2a1118';
else if(e.type==='sp')fill='#1e141d';
else if(e.type==='fs')fill='#1e2430';
else if(e.type==='ru')fill='#26222a';
else if(e.type==='ce')fill='#1c141a';
else if(e.type==='gd')fill='#2c1a26';
else if(e.type==='mb')fill='#232a2e';
else if(e.type==='ex')fill='#2b2320';
else if(e.type==='puppy')fill='#1c1618';
if(e.type==='sh'){
const flap=Math.sin(game.t*14+e.seed)*.5;
ctx.fillStyle='#220d13';
for(const sd of[-1,1]){
ctx.save();ctx.translate(e.x+sd*e.r*.9,e.y-e.r*.3);ctx.rotate(sd*(.5+flap));
ctx.beginPath();ctx.ellipse(0,0,e.r*.7,e.r*.32,0,0,TAU);ctx.fill();ctx.restore();
}
}
if(e.type==='fs'){
ctx.fillStyle='#9fd8ff';
const fx=Math.cos(e.ang+Math.PI),fy=Math.sin(e.ang+Math.PI);
for(let k=-1;k<=1;k++){
const bx=e.x+fx*e.r*.6-fy*k*e.r*.5,by=e.y+fy*e.r*.6+fx*k*e.r*.5;
ctx.beginPath();ctx.moveTo(bx-4,by);ctx.lineTo(bx,by-11);ctx.lineTo(bx+4,by);
ctx.closePath();ctx.fill();
}
}
if(e.type==='ru'&&e.teleT>0){
ctx.fillStyle='rgba(230,218,196,'+(.2+.3*Math.sin(game.t*25))+')';
ctx.beginPath();ctx.arc(e.x,e.y,e.r+8,0,TAU);ctx.fill();
}
blob(e.x,e.y,e.r,e.seed,(e.type==='br'||e.type==='gd'||e.type==='ex')?.06:.13);
ctx.fillStyle=fill;ctx.fill();
ctx.strokeStyle='#4a1f26';ctx.lineWidth=2;ctx.stroke();
const fx=Math.cos(e.ang),fy=Math.sin(e.ang);
if(e.type==='br')drawHorns(e,22,.8);
else if(e.type==='sh')drawHorns(e,10,.5);
else if(e.type==='gd'){
ctx.fillStyle='#4a2536';
for(let k=0;k<5;k++){
const a=e.seed+k*TAU/5;
ctx.beginPath();ctx.arc(e.x+Math.cos(a)*e.r*.6,e.y+Math.sin(a)*e.r*.6,4,0,TAU);ctx.fill();
}
}else if(e.type==='sp'){
ctx.strokeStyle='#b9a68f';ctx.lineWidth=3;ctx.lineCap='round';
const bx=e.x+fx*e.r*.8,by=e.y+fy*e.r*.8;
ctx.beginPath();ctx.moveTo(bx,by);
ctx.quadraticCurveTo(bx+fx*10-fy*8,by+fy*10+fx*8,bx+fx*16-fy*12,by+fy*16+fx*12);
ctx.stroke();
}else if(e.type==='ce'){
ctx.save();ctx.translate(e.x+fx*e.r*1.1,e.y+fy*e.r*1.1);
ctx.rotate(e.ang+Math.sin(game.t*2.5+e.seed)*.3);
ctx.fillStyle='#51432c';ctx.fillRect(-2,-3,4,26);
ctx.fillStyle='#c9c2b8';
ctx.beginPath();ctx.moveTo(-2,20);ctx.quadraticCurveTo(-20,20,-17,4);
ctx.quadraticCurveTo(-9,12,-2,10);ctx.closePath();ctx.fill();
ctx.strokeStyle='#14100e';ctx.lineWidth=2;ctx.stroke();
ctx.restore();
ctx.fillStyle='#31373d';
ctx.beginPath();ctx.arc(e.x,e.y,e.r*.95,e.ang+Math.PI*.6,e.ang+Math.PI*1.4);
ctx.closePath();ctx.fill();
}else if(e.type==='mb'){
ctx.fillStyle='#31373d';
ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.05,e.ang+Math.PI*.62,e.ang+Math.PI*1.38);
ctx.closePath();ctx.fill();
ctx.strokeStyle='#14100e';ctx.lineWidth=2;ctx.stroke();
const oa=game.t*1.6+e.seed;
const sx=e.x+Math.cos(oa)*(e.r+22),sy=e.y+Math.sin(oa)*(e.r+22)-8;
ctx.strokeStyle='#51432c';ctx.lineWidth=3.5;
ctx.beginPath();ctx.moveTo(sx,sy+14);ctx.lineTo(sx,sy-12);ctx.stroke();
ctx.fillStyle='#cfd8dc';ctx.globalAlpha=.25;
ctx.beginPath();ctx.arc(sx,sy-16,12,0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.beginPath();ctx.arc(sx,sy-16,5,0,TAU);ctx.fill();
if(e.st==='tele'){
const g=.3+.3*Math.sin(game.t*20);
ctx.strokeStyle='rgba(207,216,220,'+g+')';ctx.lineWidth=2.5;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+12,0,TAU);ctx.stroke();
/* assinatura visual do ataque (bruxo) */
const sk=sigKeyFor(e);
const prog=clamp(e.stT/(game.hard?.5:.7),0,1);
drawAttackSig(e.x,e.y,e.r+16,sk,prog);
}
}else if(e.type==='ex'){
ctx.fillStyle='#31373d';
ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.05,e.ang+Math.PI*.62,e.ang+Math.PI*1.38);
ctx.closePath();ctx.fill();
ctx.strokeStyle='#14100e';ctx.lineWidth=2;ctx.stroke();
ctx.fillStyle='#151013';
ctx.beginPath();ctx.arc(e.x,e.y-2,e.r*.88,Math.PI*1.05,Math.PI*1.95);ctx.closePath();ctx.fill();
const oa=game.t*2.2+e.seed;
const ax=e.x+Math.cos(oa)*(e.r+26),ay=e.y+Math.sin(oa)*(e.r+26);
ctx.strokeStyle='#51432c';ctx.lineWidth=4;ctx.lineCap='round';
ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(ax,ay);ctx.stroke();
ctx.save();ctx.translate(ax,ay);ctx.rotate(oa+Math.PI/2);
ctx.fillStyle='#b9c2c9';
ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(11,-3);ctx.lineTo(0,-1);ctx.closePath();ctx.fill();
ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(-11,-3);ctx.lineTo(0,-1);ctx.closePath();ctx.fill();
ctx.strokeStyle='#1d2b33';ctx.lineWidth=1.5;ctx.stroke();
ctx.restore();
if(e.st==='tele'){
const g=.3+.3*Math.sin(game.t*20);
ctx.strokeStyle='rgba(232,69,90,'+g+')';ctx.lineWidth=2.5;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+12,0,TAU);ctx.stroke();
if(e.pat==='charge'){
ctx.strokeStyle='rgba(232,69,90,.45)';ctx.lineWidth=3;
ctx.setLineDash([12,9]);
ctx.beginPath();ctx.moveTo(e.x,e.y);
ctx.lineTo(e.x+Math.cos(e.ang)*900,e.y+Math.sin(e.ang)*900);
ctx.stroke();ctx.setLineDash([]);
}
/* v1.6.3: INVESTIDA RICOCHETE — a rota da investida continua desenhada no chão durante o avanço */
if(e.pat==='kz_ricochet'&&e.data&&e.data.phase==='dash'){
ctx.strokeStyle='rgba(232,69,90,.5)';ctx.lineWidth=3.5;
ctx.setLineDash([14,10]);
ctx.beginPath();ctx.moveTo(e.x,e.y);
ctx.lineTo(e.x+Math.cos(e.data.aimA)*900,e.y+Math.sin(e.data.aimA)*900);
ctx.stroke();ctx.setLineDash([]);
}
/* assinatura visual do ataque (carrasco) */
const sk=sigKeyFor(e);
const prog=clamp(e.stT/(game.hard?.5:.65),0,1);
drawAttackSig(e.x,e.y,e.r+16,sk,prog);
}
}
if(e.type==='br'){
ctx.fillStyle='#cfc3b1';
for(const sd of[-1,1]){
ctx.beginPath();
ctx.moveTo(e.x+fx*e.r*.9-fy*sd*e.r*.3,e.y+fy*e.r*.9+fx*sd*e.r*.3);
ctx.lineTo(e.x+fx*(e.r+8)-fy*sd*e.r*.42,e.y+fy*(e.r+8)+fx*sd*e.r*.42);
ctx.lineTo(e.x+fx*e.r*.9-fy*sd*e.r*.48,e.y+fy*e.r*.9+fx*sd*e.r*.48);
ctx.closePath();ctx.fill();
}
}
if((e.type==='sp'||e.type==='fs')&&e.charge>0){
const g=1-e.charge/.5;
const cc=e.type==='fs'?'#9fd8ff':'#ff8f3d';
ctx.fillStyle=cc;ctx.globalAlpha=.25+.55*g;
ctx.beginPath();ctx.arc(e.x+fx*e.r,e.y+fy*e.r,4+8*g,0,TAU);ctx.fill();
ctx.globalAlpha=1;
}
let eyeC='#ffcf4d';
if(e.type==='puppy')eyeC='#a8c24f';
else if(e.type==='sp')eyeC='#ff8f3d';
else if(e.type==='fs')eyeC='#9fd8ff';
else if(e.type==='ru')eyeC='#e6dac4';
else if(e.type==='ce')eyeC='#cfd8dc';
else if(e.type==='mb')eyeC='#e6f0f2';
else if(e.type==='ex')eyeC='#e8455a';
ctx.fillStyle=eyeC;
const eyeR=(e.type==='mb'||e.type==='ex')?3:2.2;
const nPairs=e.type==='puppy'?3:(e.type==='gd'?2:1);
for(let k=0;k<nPairs;k++){
const off=(k-(nPairs-1)/2)*7;
const cx=e.x+fx*4+fy*off,cy=e.y+fy*4-fx*off;
ctx.beginPath();ctx.arc(cx-fy*4,cy+fx*4,eyeR,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(cx+fy*4,cy-fx*4,eyeR,0,TAU);ctx.fill();
}
}
let hasStatus=false;
if(e.slowT>0)hasStatus=true;
if(e.poisT>0)hasStatus=true;
if(e.flash>0)hasStatus=true;
if(hasStatus){
blob(e.x,e.y,e.r,e.seed,.13);
if(e.slowT>0){ctx.fillStyle='rgba(159,216,255,0.3)';ctx.fill();}
if(e.poisT>0){ctx.fillStyle='rgba(168,194,79,0.25)';ctx.fill();}
if(e.flash>0){ctx.fillStyle='rgba(255,240,230,'+Math.min(.85,e.flash*8)+')';ctx.fill();}
}
ctx.restore();
}
/* ============ render: o Cérbero ============ */
function bodyPath(){
ctx.beginPath();
const N=18,wob=boss.bodyWob;
for(let i=0;i<=N;i++){
const a=i/N*TAU;
const rr=boss.r*(.95+.08*Math.sin(a*4+wob*1.7)+.05*Math.sin(a*7-wob*2.3));
const px=boss.x+Math.cos(a)*rr,py=boss.y+Math.sin(a)*rr;
if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
}
ctx.closePath();
}
function drawTail(){
if(boss.scale<=0.02)return;
ctx.save();
ctx.translate(boss.x,boss.y);
ctx.scale(boss.scale,boss.scale);
ctx.translate(-boss.x,-boss.y);
const ex=boss.x+Math.cos(boss.angle+Math.PI+Math.sin(game.t*1.6)*.45)*135;
const ey=boss.y+Math.sin(boss.angle+Math.PI+Math.sin(game.t*1.6)*.45)*135;
const bx=boss.x+Math.cos(boss.angle+Math.PI)*boss.r*.75;
const by=boss.y+Math.sin(boss.angle+Math.PI)*boss.r*.75;
const dx=ex-bx,dy=ey-by,L=Math.hypot(dx,dy)||1;
const bend=Math.sin(game.t*2.3)*40;
const cx=(bx+ex)/2-dy/L*bend,cy=(by+ey)/2+dx/L*bend;
const passes=[{pad:3.5,col:'#3a2b33'},{pad:0,col:'#241a16'}];
for(const pass of passes){
ctx.fillStyle=pass.col;
for(let i=0;i<=12;i++){
const t=i/12,r=lerp(15,4,t)+pass.pad;
ctx.beginPath();ctx.arc(quad(bx,cx,ex,t),quad(by,cy,ey,t),r,0,TAU);ctx.fill();
}
}
const nx=-dy/L,ny=dx/L;
ctx.strokeStyle='#171017';ctx.lineWidth=1.5;
for(let i=1;i<9;i++){
const t=i/9,px=quad(bx,cx,ex,t),py=quad(by,cy,ey,t);
const l=5+7*(1-t);
for(const s of[-1,1]){
ctx.beginPath();
ctx.moveTo(px+nx*s*5,py+ny*s*5);
ctx.lineTo(px+nx*s*(5+l),py+ny*s*(5+l));
ctx.stroke();
}
}
ctx.fillStyle='#8b8581';
const fx=ex-bx,fy=ey-by,fl=Math.hypot(fx,fy)||1;
ctx.beginPath();
ctx.moveTo(ex+fx/fl*12,ey+fy/fl*12);
ctx.lineTo(ex-dy/fl*7,ey+dx/fl*7);
ctx.lineTo(ex+dy/fl*7,ey-dx/fl*7);
ctx.closePath();ctx.fill();
ctx.restore();
}
function drawBossLegs(){
if(boss.scale<=0.02)return;
ctx.save();
ctx.translate(boss.x,boss.y);
ctx.scale(boss.scale,boss.scale);
ctx.translate(-boss.x,-boss.y);
const r=boss.r*.92;
const dx=Math.cos(boss.angle),dy=Math.sin(boss.angle);
const offs=[44,28,-24,-42];
for(let i=0;i<4;i++){
const o=offs[i],fore=i<2;
const drop=Math.sqrt(Math.max(4,r*r-o*o));
const ax=boss.x+dx*o,ay=boss.y+dy*o;
const sway=Math.sin(game.t*(fore?2.6:2)+i*1.9+boss.bodyWob*.25)*(fore?8:6);
const fx=ax+sway,fy=ay+drop*.5+(fore?46:44);
ctx.lineCap='round';
ctx.strokeStyle='#17121a';ctx.lineWidth=18;
ctx.beginPath();ctx.moveTo(ax,ay+drop*.25);ctx.lineTo(fx,fy);ctx.stroke();
ctx.strokeStyle='#33262e';ctx.lineWidth=12;
ctx.beginPath();ctx.moveTo(ax,ay+drop*.25);ctx.lineTo(fx,fy);ctx.stroke();
ctx.fillStyle='#100c12';
ctx.beginPath();ctx.ellipse(fx,fy+5,11,7,0,0,TAU);ctx.fill();
ctx.fillStyle='#b9a68f';
for(let k=-1;k<=1;k++){
ctx.beginPath();
ctx.moveTo(fx+k*6-2.5,fy+7);ctx.lineTo(fx+6*k,fy+15);ctx.lineTo(fx+k*6+2.5,fy+7);
ctx.closePath();ctx.fill();
}
}
ctx.restore();
}
function drawNeck(h){
const bx=boss.x+Math.cos(boss.angle+h.baseAng)*boss.r*.7;
const by=boss.y+Math.sin(boss.angle+h.baseAng)*boss.r*.7;
const hx=h.hx,hy=h.hy;
const dx=hx-bx,dy=hy-by,L=Math.hypot(dx,dy)||1;
const bendAmt=(h.alive?1:.55)*(20+14*Math.sin(game.t*.9+h.ph));
const bend=Math.sin(game.t*1.6+h.ph)*bendAmt;
const cx=(bx+hx)/2-dy/L*bend,cy=(by+hy)/2+dx/L*bend;
const rBase=(h.alive?30:22),rHead=(h.alive?13:9);
const passes=[{pad:2.5,col:'#3a2b33'},{pad:0,col:'#241a16'}];
for(const pass of passes){
ctx.fillStyle=pass.col;
for(let i=0;i<=11;i++){
const t=i/11,r=(lerp(rBase,rHead,t)+pass.pad)*boss.scale;
ctx.beginPath();ctx.arc(quad(bx,cx,hx,t),quad(by,cy,hy,t),Math.max(0,r),0,TAU);ctx.fill();
}
}
}
function headPath(){
ctx.beginPath();
ctx.moveTo(38,0);
ctx.bezierCurveTo(32,-13,16,-19,2,-19);
ctx.bezierCurveTo(-14,-19,-24,-10,-24,0);
ctx.bezierCurveTo(-24,10,-14,19,2,19);
ctx.bezierCurveTo(16,19,32,13,36,0);
ctx.closePath();
}
function drawShepEars(h,bone,dark,dead){
const torn=h.name==='UMBRA',rag=h.name==='MORTEM';
for(const s of[-1,1]){
ctx.beginPath();
ctx.moveTo(0,s*10);
ctx.lineTo(-5,s*20);
if(torn){ctx.lineTo(-10,s*17);ctx.lineTo(-12,s*25);}
ctx.lineTo(-22,s*28);
ctx.lineTo(-17,s*11);
ctx.closePath();
ctx.fillStyle=dead?'#4a4542':bone;
ctx.fill();
ctx.strokeStyle=dark;ctx.lineWidth=2;ctx.stroke();
if(!dead){
ctx.globalAlpha=.45;ctx.fillStyle=h.c;
ctx.beginPath();
ctx.moveTo(-6,s*15);ctx.lineTo(-10,s*22);ctx.lineTo(-16,s*20);ctx.lineTo(-13,s*14);
ctx.closePath();ctx.fill();
ctx.globalAlpha=1;
if(rag){
ctx.fillStyle=dark;
ctx.beginPath();ctx.arc(-13,s*22,2.2,0,TAU);ctx.fill();
}
}
}
}
function drawHead(h){
const dead=!h.alive;
ctx.save();
ctx.translate(h.hx,h.hy);ctx.rotate(h.face);ctx.scale(boss.scale,boss.scale);
const bone=dead?'#57504e':h.bone,dark=dead?'#332e2c':'#181218';
const wake=(h.wake===undefined||dead)?1:h.wake;
/* aura sutil — assinatura visual do ataque prestes a sair */
if(h.state==='tele'&&!dead){
const dur=TELE_DUR[h.pattern]||.7;
const prog=clamp(h.t/dur,0,1);
ctx.save();ctx.scale(1/boss.scale,1/boss.scale);
drawAttackSig(0,0,h.r+10,h.pattern,prog,h.c);
ctx.restore();
}
if(h.state==='tele'&&!dead){
const g=.35+.3*Math.sin(game.t*20);
const glows=[[16,.1],[10,.2],[5,.45]];
for(const gdata of glows){
ctx.globalAlpha=gdata[1]*g;ctx.fillStyle=h.c;
ctx.beginPath();ctx.arc(34,0,gdata[0],0,TAU);ctx.fill();
}
ctx.globalAlpha=1;
}
drawShepEars(h,bone,dark,dead);
headPath();
ctx.fillStyle=bone;ctx.fill();
ctx.strokeStyle=dark;ctx.lineWidth=2.5;ctx.stroke();
ctx.beginPath();
ctx.moveTo(14,-12);
ctx.bezierCurveTo(25,-10,33,-5,37,-1);
ctx.lineTo(37,1);
ctx.bezierCurveTo(33,5,25,10,14,12);
ctx.bezierCurveTo(10,5,10,-5,14,-12);
ctx.closePath();
ctx.fillStyle=dead?'#332e2c':'#241a16';
ctx.fill();
ctx.strokeStyle=dark;ctx.lineWidth=1.5;
for(const s of[-1,1]){
ctx.beginPath();
ctx.moveTo(-13,s*16);ctx.lineTo(-19,s*20);
ctx.moveTo(-8,s*17);ctx.lineTo(-12,s*22);
ctx.stroke();
}
const m=h.mouth;
if(m>.03){
ctx.fillStyle='#140b0e';
ctx.beginPath();ctx.moveTo(36,0);ctx.lineTo(24,-(3+12*m));ctx.lineTo(24,(3+12*m));
ctx.closePath();ctx.fill();
ctx.fillStyle=dead?'#8b8581':'#efe6d6';
for(const s of[-1,1]){
ctx.beginPath();
ctx.moveTo(26,s*(2+11*m));ctx.lineTo(34,s*(4+12*m));ctx.lineTo(27,s*(6+12.5*m));
ctx.closePath();ctx.fill();
}
}
ctx.fillStyle=dark;
ctx.beginPath();ctx.arc(29,-3.4,1.6,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(29,3.4,1.6,0,TAU);ctx.fill();
if(!dead){
if(wake<=.06){
ctx.strokeStyle='#2c2724';ctx.lineWidth=2;
for(const s of[-1,1]){
ctx.beginPath();
ctx.moveTo(2,s*7);
ctx.quadraticCurveTo(7,s*10,12,s*7);
ctx.stroke();
}
}else{
ctx.strokeStyle=h.c;ctx.globalAlpha=.6*wake;ctx.lineWidth=1.6;
for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(0,s*6);ctx.lineTo(7,s*9);ctx.stroke();}
ctx.globalAlpha=1;
for(const s of[-1,1]){
ctx.globalAlpha=.3*wake;ctx.fillStyle=h.c;
ctx.beginPath();ctx.arc(7,s*8,6,0,TAU);ctx.fill();
ctx.globalAlpha=wake;ctx.fillStyle='#fff';
ctx.beginPath();ctx.arc(7,s*8,2.4,0,TAU);ctx.fill();
ctx.globalAlpha=1;
}
}
}else{
ctx.strokeStyle='#2c2724';ctx.lineWidth=2;
for(const s of[-1,1]){
ctx.beginPath();ctx.moveTo(4,s*6);ctx.lineTo(10,s*10);
ctx.moveTo(10,s*6);ctx.lineTo(4,s*10);ctx.stroke();
}
}
if(h.state==='desp'){
ctx.globalAlpha=.25+.2*Math.sin(game.t*16);
ctx.strokeStyle=h.c;ctx.lineWidth=3;
headPath();ctx.stroke();
ctx.globalAlpha=1;
}
if(h.flash>0){
headPath();
ctx.fillStyle='rgba(255,235,220,'+Math.min(.85,h.flash*7)+')';ctx.fill();
}
ctx.restore();
}
function drawBoss(){
if(!boss.active)return;
if(boss.fade<=0)return;
if(boss.scale<.02&&boss.introLock)return;
ctx.save();
ctx.globalAlpha=boss.fade;
ctx.fillStyle='rgba(0,0,0,0.4)';
ctx.beginPath();ctx.ellipse(boss.x,boss.y+boss.r*.3,boss.r*1.1,boss.r*.5,0,0,TAU);ctx.fill();
/* PNG EDITION: Cérbero pode ser trocado por sprite externo inteiro */
const __bossPng=window.THOR_PNG_MODE&&window.THOR_PNG&&window.THOR_PNG.drawBossSprite?window.THOR_PNG.drawBossSprite(ctx,boss,game):false;
if(!__bossPng){
drawTail();
drawBossLegs();
for(const h of boss.heads)drawNeck(h);
bodyPath();
ctx.fillStyle='#241a16';ctx.fill();
ctx.strokeStyle=boss.phase2?'#e8455a':'#3a2b33';
ctx.lineWidth=boss.phase2?4:3;
ctx.stroke();
if(boss.phase2){
ctx.globalAlpha=.3+.2*Math.sin(game.t*8);
ctx.strokeStyle='#e8455a';ctx.lineWidth=2;
bodyPath();ctx.stroke();
ctx.globalAlpha=boss.fade;
}
ctx.save();ctx.clip();
ctx.fillStyle='#0d0a0c';
ctx.beginPath();
ctx.moveTo(boss.x-boss.r-4,boss.y-boss.r-4);
ctx.lineTo(boss.x+boss.r+4,boss.y-boss.r-4);
ctx.lineTo(boss.x+boss.r+4,boss.y-16);
for(let k=7;k>=-7;k--){
ctx.lineTo(boss.x+k*(boss.r/7),boss.y-16+((k&1)?10:-2));
}
ctx.lineTo(boss.x-boss.r-4,boss.y-16);
ctx.closePath();ctx.fill();
ctx.fillStyle='rgba(122,61,29,0.5)';
ctx.beginPath();ctx.ellipse(boss.x,boss.y+boss.r*.62,boss.r*.72,boss.r*.4,0,0,TAU);ctx.fill();
for(let k=0;k<5;k++){
const a=k/5*TAU+boss.bodyWob*.1;
ctx.beginPath();
ctx.moveTo(boss.x+Math.cos(a)*boss.r*.9,boss.y+Math.sin(a)*boss.r*.9);
ctx.lineTo(boss.x+Math.cos(a+.5)*boss.r*.5,boss.y+Math.sin(a+.5)*boss.r*.5);
ctx.lineTo(boss.x+Math.cos(a+.2)*boss.r*.15,boss.y+Math.sin(a+.2)*boss.r*.15);
ctx.strokeStyle='rgba(255,120,60,'+(.13+.1*Math.sin(game.t*3+k*2))+')';
ctx.lineWidth=2.5;ctx.stroke();
}
ctx.restore();
ctx.fillStyle='#191218';
for(let k=-1.5;k<=1.5;k++){
const a=boss.angle+Math.PI+k*.3;
const bx=boss.x+Math.cos(a)*boss.r*.95,by=boss.y+Math.sin(a)*boss.r*.95;
ctx.beginPath();
ctx.moveTo(bx-Math.sin(a)*8,by+Math.cos(a)*8);
ctx.lineTo(bx+Math.cos(a)*24,by+Math.sin(a)*24);
ctx.lineTo(bx+Math.sin(a)*8,by-Math.cos(a)*8);
ctx.closePath();ctx.fill();
}
}
for(const h of boss.heads){
if(!__bossPng&&!(window.THOR_PNG_MODE&&window.THOR_PNG&&window.THOR_PNG.drawBossHead&&window.THOR_PNG.drawBossHead(ctx,h,boss,game)))drawHead(h);
}
/* render do beam da UMBRA — visual do feixe ativo */
for(const h of boss.heads){
if(!h.alive)continue;
if(h.state==='act'&&h.pattern==='beam'&&h.data){
const d=h.data;
if(d.t>=d.warm){
const ba=d.ang;
const L=1400;
const ex2=h.hx+Math.cos(ba)*L,ey2=h.hy+Math.sin(ba)*L;
ctx.save();
ctx.strokeStyle='rgba(232,69,90,.35)';ctx.lineWidth=24;
ctx.beginPath();ctx.moveTo(h.hx,h.hy);ctx.lineTo(ex2,ey2);ctx.stroke();
ctx.strokeStyle='#e8455a';ctx.lineWidth=8;
ctx.beginPath();ctx.moveTo(h.hx,h.hy);ctx.lineTo(ex2,ey2);ctx.stroke();
ctx.strokeStyle='#fff3c4';ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(h.hx,h.hy);ctx.lineTo(ex2,ey2);ctx.stroke();
ctx.restore();
}else{
/* pré-aquecimento: linha pontilhada fina */
const L=1400;
const ex2=h.hx+Math.cos(d.ang)*L,ey2=h.hy+Math.sin(d.ang)*L;
ctx.save();
ctx.setLineDash([8,12]);
ctx.strokeStyle='rgba(232,69,90,'+(.3+.2*Math.sin(game.t*18))+')';ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(h.hx,h.hy);ctx.lineTo(ex2,ey2);ctx.stroke();
ctx.setLineDash([]);
ctx.restore();
}
}
}
ctx.restore();
}
/* ============ render: efeitos ============ */
function drawEBullets(){
for(const b of ebullets){
if(b.bat){
/* v1.6.4: MORCEGO VAMPIRO — asas batendo; se acertar o Thor, CURA o dono */
const fl=Math.sin(game.t*18+b.x*.13)*.9;
const ba=Math.atan2(b.vy,b.vx);
ctx.save();ctx.translate(b.x,b.y);ctx.rotate(ba+Math.PI/2);
ctx.fillStyle=b.c;ctx.globalAlpha=.92;
ctx.beginPath();ctx.ellipse(0,0,b.r*.62,b.r*.85,0,0,TAU);ctx.fill();
ctx.beginPath();
ctx.moveTo(0,-b.r*.2);
ctx.quadraticCurveTo(-b.r*1.6,-b.r*(1.1+fl*.4),-b.r*2.1,b.r*.1+fl*2.2);
ctx.quadraticCurveTo(-b.r*1.2,b.r*.45,0,b.r*.5);
ctx.quadraticCurveTo(b.r*1.2,b.r*.45,b.r*2.1,b.r*.1+fl*2.2);
ctx.quadraticCurveTo(b.r*1.6,-b.r*(1.1+fl*.4),0,-b.r*.2);
ctx.fill();
ctx.globalAlpha=1;ctx.fillStyle='#ff2450';
ctx.beginPath();ctx.arc(-b.r*.26,-b.r*.35,1.6,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(b.r*.26,-b.r*.35,1.6,0,TAU);ctx.fill();
ctx.restore();
continue;
}
/* v1.7.0: EDITOR DE MODS — bala redesenhada pelo estilo do mod */
if(window.__MODS&&__MODS.on()&&__MODS.hasBullet(b.c)){__MODS.drawBullet(ctx,b);continue;}
/* v1.7.3: EDITOR DE MODS — os 8 FORMATOS nas balas dos padrões do mod
   (b.sh só existe em balas nascidas da forja — balas nativas nunca têm) */
if(window.__MODS&&b.sh&&__MODS.drawShapeBullet){__MODS.drawShapeBullet(ctx,b);continue;}
if(b.mine){
const pulse=.6+.4*Math.sin(game.t*8);
ctx.strokeStyle=b.c;ctx.globalAlpha=.35*pulse;ctx.lineWidth=2;
ctx.beginPath();ctx.arc(b.x,b.y,12,0,TAU);ctx.stroke();
ctx.globalAlpha=.5*pulse;
ctx.fillStyle=b.c;
for(let k=0;k<6;k++){
const a=k/6*TAU+game.t*1.5;
ctx.beginPath();
ctx.moveTo(b.x+Math.cos(a)*10,b.y+Math.sin(a)*10);
ctx.lineTo(b.x+Math.cos(a+.25)*16,b.y+Math.sin(a+.25)*16);
ctx.lineTo(b.x+Math.cos(a-.25)*16,b.y+Math.sin(a-.25)*16);
ctx.closePath();ctx.fill();
}
ctx.globalAlpha=1;
ctx.fillStyle=b.armT>0?'#5a6a3a':b.c;
ctx.beginPath();ctx.arc(b.x,b.y,5,0,TAU);ctx.fill();
continue;
}
const a=Math.atan2(b.vy,b.vx);
ctx.strokeStyle=b.c;ctx.globalAlpha=.35;ctx.lineWidth=b.r;
ctx.beginPath();ctx.moveTo(b.x-Math.cos(a)*16,b.y-Math.sin(a)*16);
ctx.lineTo(b.x,b.y);ctx.stroke();
ctx.globalAlpha=.28;ctx.fillStyle=b.c;
ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.9,0,TAU);ctx.fill();
ctx.globalAlpha=1;ctx.fillStyle=b.c;
ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();
ctx.fillStyle='#fff';
ctx.beginPath();ctx.arc(b.x,b.y,b.r*.4,0,TAU);ctx.fill();
if(b.home||b.slowShot){
ctx.strokeStyle=b.c;ctx.globalAlpha=.4;ctx.lineWidth=1.5;
ctx.beginPath();ctx.arc(b.x,b.y,b.r*2.4,game.t*6,game.t*6+2);ctx.stroke();
ctx.globalAlpha=1;
}
if(b.bounce){
ctx.strokeStyle='#fff';ctx.globalAlpha=.5;ctx.lineWidth=1;
ctx.beginPath();ctx.arc(b.x,b.y,b.r+2,0,TAU);ctx.stroke();
ctx.globalAlpha=1;
}
}
}
function drawRings(){
for(const r of rings){
const a0=r.gapA+r.gapW/2,a1=r.gapA+TAU-r.gapW/2;
ctx.strokeStyle=r.c;ctx.globalAlpha=.16;ctx.lineWidth=r.th+9;
ctx.beginPath();ctx.arc(r.x,r.y,r.r,a0,a1);ctx.stroke();
ctx.globalAlpha=.85;ctx.lineWidth=r.th;
ctx.beginPath();ctx.arc(r.x,r.y,r.r,a0,a1);ctx.stroke();
ctx.globalAlpha=1;
}
}
function drawGeyserMarks(){
const pz=game.puzzle;const runeCount=pz&&Array.isArray(pz.need)?pz.need.length:3;
for(const m of geyserMarks){
const R=m.rad||34;
if(m.phase==='mark'){
const p=m.t/m.dur;
ctx.strokeStyle=m.c;ctx.globalAlpha=.5+.3*Math.sin(game.t*12);ctx.lineWidth=2;
ctx.beginPath();ctx.arc(m.x,m.y,R,0,TAU);ctx.stroke();
ctx.globalAlpha=.15;ctx.fillStyle=m.c;
ctx.beginPath();ctx.arc(m.x,m.y,R*p,0,TAU);ctx.fill();
ctx.globalAlpha=.6;ctx.lineWidth=2.5;
for(let k=0;k<runeCount;k++){
const a=game.t*1.2+k*TAU/3;
ctx.beginPath();ctx.moveTo(m.x+Math.cos(a)*10,m.y+Math.sin(a)*10);
ctx.lineTo(m.x+Math.cos(a)*(R*.75),m.y+Math.sin(a)*(R*.75));ctx.stroke();
}
}else{
const f=1-m.t/.28;
ctx.globalAlpha=.5*f;ctx.fillStyle=m.c;
ctx.beginPath();ctx.arc(m.x,m.y,(m.rad||36),0,TAU);ctx.fill();
}
ctx.globalAlpha=1;
}
}
function drawSpawnMarks(){
for(const s of spawnMarks){
const p=s.t/s.dur;
const R=s.big?34:21;
ctx.save();
ctx.translate(s.x,s.y);
ctx.rotate(game.t*.8);
const pulse=.6+.4*Math.sin(game.t*10);
ctx.strokeStyle='rgba(230,60,60,'+((.35+.45*p)*pulse)+')';
ctx.lineWidth=s.big?3:2;
ctx.beginPath();ctx.arc(0,0,R,0,TAU*p);ctx.stroke();
const pts=[];
for(let k=0;k<5;k++){
const a=-Math.PI/2+k*TAU*2/5;
pts.push([Math.cos(a)*R,Math.sin(a)*R]);
}
ctx.strokeStyle='rgba(230,60,60,'+((.5+.5*p)*pulse)+')';
ctx.lineWidth=s.big?3:2.2;
ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
for(let k=1;k<=5;k++){const q=pts[(k*2)%5];ctx.lineTo(q[0],q[1]);}
ctx.stroke();
ctx.restore();
ctx.fillStyle='rgba(255,143,61,'+(.3+.5*p)+')';
ctx.beginPath();ctx.arc(s.x,s.y,(2+9*p)*(s.big?1.6:1),0,TAU);ctx.fill();
if(!game.paused&&Math.random<.3)particles.push({x:s.x+rnd(-8,8),y:s.y+rnd(-8,8),vx:rnd(-15,15),vy:rnd(-70,-30),life:.5,t:0,r:1.8,c:'#ff8f3d',drag:1,glow:true});
}
}
function heartShape(x,y,s){
ctx.beginPath();
ctx.moveTo(x,y+s*.55);
ctx.bezierCurveTo(x+s*.5,y+s*.1,x+s*.45,y-s*.45,x,y-s*.15);
ctx.bezierCurveTo(x-s*.45,y-s*.45,x-s*.5,y+s*.1,x,y+s*.55);
ctx.closePath();
}
function drawPickups(){
for(const p of pickups){
const bob=Math.sin(game.t*4+p.ph)*4;
const fade=p.t>9?(p.type==='chest'||p.type==='kingsoul'||p.type==='knightrelic'?1:.4+.4*Math.sin(game.t*14)):1;
ctx.globalAlpha=fade;
if(p.type==='soul'){
/* v1.5.1: na PENUMBRA INFERNAL (chão branco) a alma antiga sumia — agora é
   vermelho/azul FORTES com brilho, alternando por alma; fora dali segue igual */
const _pi=game.region==='penumbra'&&game.floor>=3;
if(_pi){
 const sc=(p.ph%2)<1?'#ff2450':'#2e6bff';
 ctx.globalAlpha=fade*(.34+.12*Math.sin(game.t*8+p.ph));
 ctx.fillStyle=sc;
 ctx.beginPath();ctx.arc(p.x,p.y+bob,15,0,TAU);ctx.fill();
 ctx.globalAlpha=fade;
 ctx.strokeStyle='rgba(18,8,14,.75)';ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(p.x,p.y+bob,8.5,0,TAU);ctx.stroke();
 ctx.fillStyle=sc;
 ctx.beginPath();ctx.arc(p.x,p.y+bob,8,0,TAU);ctx.fill();
 ctx.beginPath();
 ctx.moveTo(p.x,p.y+bob-7);
 ctx.bezierCurveTo(p.x+5,p.y+bob-2,p.x+4,p.y+bob+4,p.x,p.y+bob+6);
 ctx.bezierCurveTo(p.x-4,p.y+bob+4,p.x-5,p.y+bob-2,p.x,p.y+bob-7);
 ctx.fill();
 ctx.fillStyle='#fff';
 ctx.beginPath();ctx.arc(p.x,p.y+bob-1,2.4,0,TAU);ctx.fill();
}else{
ctx.globalAlpha=fade*(.2+.15*Math.sin(game.t*8+p.ph));
ctx.fillStyle='#bfd8e8';
ctx.beginPath();ctx.arc(p.x,p.y+bob,8,0,TAU);ctx.fill();
ctx.globalAlpha=fade;
ctx.beginPath();
ctx.moveTo(p.x,p.y+bob-7);
ctx.bezierCurveTo(p.x+5,p.y+bob-2,p.x+4,p.y+bob+4,p.x,p.y+bob+6);
ctx.bezierCurveTo(p.x-4,p.y+bob+4,p.x-5,p.y+bob-2,p.x,p.y+bob-7);
ctx.fill();
ctx.fillStyle='#fff';
ctx.beginPath();ctx.arc(p.x,p.y+bob-1,1.8,0,TAU);ctx.fill();
}
}else if(p.type==='fagulha'){
/* v1.0.0: a fagulha pulsa como uma brasa viva — impossível confundir */
const bobF=Math.sin(game.t*3.4+p.ph)*3;
ctx.globalAlpha=.28+.14*Math.sin(game.t*6+p.ph);
ctx.fillStyle='#ff8f3d';
ctx.beginPath();ctx.arc(p.x,p.y+bobF,20,0,TAU);ctx.fill();
ctx.globalAlpha=fade;
ctx.save();
ctx.translate(p.x,p.y+bobF);
ctx.rotate(game.t*2.2+p.ph);
ctx.fillStyle='#ffb054';
ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(4.5,0);ctx.lineTo(0,9);ctx.lineTo(-4.5,0);ctx.closePath();ctx.fill();
ctx.fillStyle='#fff3c4';
ctx.beginPath();ctx.arc(0,0,2.6,0,TAU);ctx.fill();
ctx.restore();
if(Math.random()<.12)particles.push({x:p.x+rnd(-6,6),y:p.y+bobF+rnd(-6,6),vx:rnd(-14,14),vy:rnd(-46,-16),life:rnd(.3,.7),t:0,r:rnd(1,2),c:'#ff8f3d',drag:.9,glow:true});
}else if(p.type==='chest'){
const bobC=Math.sin(game.t*2.5+p.ph)*4;
ctx.globalAlpha=.2+.1*Math.sin(game.t*5);
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(p.x,p.y+bobC,30,0,TAU);ctx.fill();
ctx.globalAlpha=.13+.07*Math.sin(game.t*3);
ctx.beginPath();
ctx.moveTo(p.x-14,p.y+bobC-12);ctx.lineTo(p.x-24,p.y+bobC-96);
ctx.lineTo(p.x+24,p.y+bobC-96);ctx.lineTo(p.x+14,p.y+bobC-12);
ctx.closePath();ctx.fill();
ctx.globalAlpha=fade;
ctx.fillStyle='#6b4a2f';
ctx.fillRect(p.x-16,p.y+bobC-6,32,18);
ctx.fillStyle='#c9a44c';
ctx.fillRect(p.x-16,p.y+bobC-12,32,8);
ctx.strokeStyle='#14100e';ctx.lineWidth=2;
ctx.strokeRect(p.x-16,p.y+bobC-12,32,24);
ctx.fillStyle='#ffd9a0';
ctx.fillRect(p.x-3,p.y+bobC-6,6,7);
ctx.globalAlpha=.6+.3*Math.sin(game.t*4);
txt('TESOURO',p.x,p.y+bobC-46,MONO,10,'#ffd9a0','center',4);
}else if(p.type==='kingsoul'){
const bobK=Math.sin(game.t*2+p.ph)*5;
ctx.globalAlpha=.25+.12*Math.sin(game.t*3);
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(p.x,p.y+bobK,36,0,TAU);ctx.fill();
ctx.globalAlpha=fade;
drawKingPiece(p.x,p.y+bobK,.85,'#d8cfc0');
ctx.globalAlpha=.6+.3*Math.sin(game.t*3);
txt('ALMA DO REI ANTIGO',p.x,p.y+bobK-56,MONO,10,'#ffd9a0','center',3);
}else if(p.type==='knightrelic'){
const bobR=Math.sin(game.t*2.4+p.ph)*5;
const col=p.relicColor||'#ffd9a0',glow=p.relicGlow||'#d9465a';
ctx.globalAlpha=.3+.15*Math.sin(game.t*3);
ctx.fillStyle=glow;
ctx.beginPath();ctx.arc(p.x,p.y+bobR,42,0,TAU);ctx.fill();
ctx.globalAlpha=fade;
/* núcleo pulsante */
const pulse=1+.1*Math.sin(game.t*6);
ctx.fillStyle=col;
ctx.beginPath();ctx.arc(p.x,p.y+bobR,16*pulse,0,TAU);ctx.fill();
ctx.strokeStyle=glow;ctx.lineWidth=2.5;
ctx.beginPath();ctx.arc(p.x,p.y+bobR,22*pulse,0,TAU);ctx.stroke();
/* estrela central */
ctx.fillStyle=glow;
ctx.save();ctx.translate(p.x,p.y+bobR);ctx.rotate(game.t*1.2);
for(let i=0;i<5;i++){
const a=i/5*TAU-Math.PI/2;
ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*8,Math.sin(a)*8);ctx.lineTo(Math.cos(a+.18)*4,Math.sin(a+.18)*4);ctx.closePath();ctx.fill();
}
ctx.restore();
ctx.globalAlpha=.7+.3*Math.sin(game.t*4);
txt('RELÍQUIA',p.x,p.y+bobR-46,MONO,10,col,'center',3);
}else if(p.type==='blessing_drop'){
/* v0.9.13: drop do baú mostra APENAS o NOME do item com a cor da raridade
   (sem textura procedural). Para usar uma imagem própria coloque em
   assets/sprites/drops/<id-do-item>.png — ex.: forca.png, iraodin.png */
const bobB=Math.sin(game.t*2.6+p.ph)*5;
const rc=p.rarity==='lendário'?'#c9a0ff':p.rarity==='épico'?'#ffd9a0':p.rarity==='raro'?'#bfd8e8':'#e6dac4';
const dnm=p.dropType==='active'?(ACTIVE_ITEMS[p.dropId]?ACTIVE_ITEMS[p.dropId].name:'ITEM ATIVO'):((UPGRADES.find(u=>u.id===p.dropId)||{}).name||'PACTO');
const dim=dropImg(p.dropId);
ctx.globalAlpha=.16+.10*Math.sin(game.t*3.4+p.ph);
ctx.fillStyle=rc;
ctx.beginPath();ctx.arc(p.x,p.y+bobB,30,0,TAU);ctx.fill();
ctx.globalAlpha=fade;
if(dim){const ds=44;ctx.drawImage(dim,p.x-ds/2,p.y+bobB-ds/2,ds,ds);}
ctx.globalAlpha=.85+.15*Math.sin(game.t*4);
txt(dnm,p.x,p.y+bobB-26,MONO,11,rc,'center',4);
txt((p.rarity||'comum').toUpperCase(),p.x,p.y+bobB+24,MONO,8,rc,'center',3);
}else if(p.type==='active_drop'){
/* v0.9.9: item ativo no chão — orbe violeta pulsante */
const bobA=Math.sin(game.t*2.2+p.ph)*5;
const nm=(typeof ACTIVE_ITEMS!=='undefined'&&ACTIVE_ITEMS[p.activeId])?ACTIVE_ITEMS[p.activeId].name:'ITEM ATIVO';
ctx.globalAlpha=.26+.14*Math.sin(game.t*3.2+p.ph);
ctx.fillStyle='#c9a0ff';
ctx.beginPath();ctx.arc(p.x,p.y+bobA,30,0,TAU);ctx.fill();
ctx.globalAlpha=fade;
/* v1.1.3: item ativo também usa a arte de assets/sprites/drops/<id>.png */
const dimA=dropImg(p.activeId);
if(dimA){const ds=44;ctx.drawImage(dimA,p.x-ds/2,p.y+bobA-ds/2,ds,ds);}
else{
const pl2=1+.1*Math.sin(game.t*5+p.ph);
ctx.fillStyle='#3a2450';
ctx.beginPath();ctx.arc(p.x,p.y+bobA,13*pl2,0,TAU);ctx.fill();
ctx.strokeStyle='#c9a0ff';ctx.lineWidth=2.2;
ctx.beginPath();ctx.arc(p.x,p.y+bobA,13*pl2,0,TAU);ctx.stroke();
ctx.fillStyle='#c9a0ff';
ctx.save();ctx.translate(p.x,p.y+bobA);
ctx.beginPath();ctx.moveTo(-4,-6);ctx.lineTo(2,-6);ctx.lineTo(-1,-1);ctx.lineTo(4,-1);ctx.lineTo(-3,7);ctx.lineTo(0,0);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();
ctx.restore();
}
ctx.globalAlpha=.72+.28*Math.sin(game.t*4);
txt(nm,p.x,p.y+bobA-32,MONO,9,'#c9a0ff','center',3);
}else{
const pulse=1+.08*Math.sin(game.t*6+p.ph);
ctx.globalAlpha=fade*(.2+.12*Math.sin(game.t*8+p.ph));
ctx.fillStyle='#d9465a';
ctx.beginPath();ctx.arc(p.x,p.y+bob,16*pulse,0,TAU);ctx.fill();
ctx.globalAlpha=fade;
heartShape(p.x,p.y+bob,18*pulse);
ctx.fillStyle='#d9465a';ctx.fill();
ctx.strokeStyle='#140b0e';ctx.lineWidth=2;ctx.stroke();
}
ctx.globalAlpha=1;
}
}
function drawDarkSoul(){
if(!game.darkSoul||game.endPhase!=='soul')return;
const bob=Math.sin(game.t*2.2)*6;
const pulse=1+.06*Math.sin(game.t*5);
const x=game.darkSoul.x,y=game.darkSoul.y+bob;
ctx.globalAlpha=.22+.12*Math.sin(game.t*4);
ctx.fillStyle='#7a4d9e';
ctx.beginPath();ctx.arc(x,y,28*pulse,0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.beginPath();
ctx.moveTo(x,y-17);
ctx.bezierCurveTo(x+13,y-5,x+11,y+9,x,y+14);
ctx.bezierCurveTo(x-11,y+9,x-13,y-5,x,y-17);
ctx.closePath();
ctx.fillStyle='#171019';ctx.fill();
ctx.strokeStyle='#9d6bb5';ctx.lineWidth=2.5;ctx.stroke();
ctx.fillStyle='#c9a0ff';
ctx.beginPath();ctx.arc(x,y-2,3.2,0,TAU);ctx.fill();
txt('ALMA ESCURA',x,y-42,MONO,11,'#9d6bb5','center',4);
ctx.globalAlpha=.55+.3*Math.sin(game.t*2.5);
txt('ela sussurra o seu nome',x,y+36,MONO,10,'#6b5a75','center',3);
ctx.globalAlpha=1;
}
function drawParticles(){
for(const p of particles){
const a=Math.max(0,1-p.t/p.life)*(p.alpha!==undefined?p.alpha:1);
if(p.glow){
ctx.globalAlpha=a*.22;ctx.fillStyle=p.c;
ctx.beginPath();ctx.arc(p.x,p.y,p.r*2.3,0,TAU);ctx.fill();
}
ctx.globalAlpha=a;ctx.fillStyle=p.c;
ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();
}
ctx.globalAlpha=1;
}
function drawTexts(){
for(const t of texts){
const a=Math.max(0,1-t.t/t.life);
ctx.globalAlpha=a;
if(t.dmg){
const sc=t.pop?(1+1.15*(1-Math.min(1,t.t/.14))):1;
ctx.save();
ctx.translate(t.x,t.y);ctx.rotate(t.rot||0);ctx.scale(sc,sc);
ctx.shadowColor=t.c;ctx.shadowBlur=9;
txt(t.txt,0,0,MONO,t.size,t.c);
ctx.shadowBlur=0;
ctx.restore();
}else txt(t.txt,t.x,t.y,t.disp?DISP:MONO,t.size,t.c);
}
ctx.globalAlpha=1;
}
function drawBolts(){
for(const b of bolts){
const a=1-b.t/b.life;
const pts=[];
for(let i=0;i<=7;i++){
const yy=-20+(b.y+20)*i/7;
const xx=b.x+Math.sin(i*2.3+b.seed)*16*(i/7);
pts.push([xx,yy]);
}
ctx.lineCap='round';
const lws=[[8,.15],[3.5,.9]];
for(const lw of lws){
ctx.globalAlpha=lw[1]*a;ctx.strokeStyle='#cfe9ff';ctx.lineWidth=lw[0];
ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
ctx.stroke();
}
ctx.globalAlpha=.4*a;ctx.fillStyle='#cfe9ff';
ctx.beginPath();ctx.arc(b.x,b.y,20*a+6,0,TAU);ctx.fill();
ctx.globalAlpha=1;
}
}
/* ============================================================
   FALSO PARAÍSO — render do exterior (campo infinito),
   paredes espelhadas e estruturas religiosas.
   ============================================================ */
/* ==== drawParadiseOutside: pinta toda a tela de grama + céu + silhuetas
   distantes de catedrais para que o exterior da sala pareça um campo infinito
   e não um vazio sem textura. ==== */
let paradiseOutsideCache=null,paradiseOutsideFloor=0;
function drawParadiseOutside(){
/* v1.6.2: FASE CINZA — lá fora é o MESMO cinza liso, um tom abaixo do chão:
   sem céu, sem catedrais, sem árvores, sem grama, sem brilho animado.
   Nenhuma estrutura no fundo, e nada para recalcular por frame. */
if((game.limboPhase||1)>=4){
  ctx.fillStyle='#3a3833';
  ctx.fillRect(game.camX-4,game.camY-4,W+8,H+8);
  return;
}
if(!paradiseOutsideCache||paradiseOutsideFloor!==game.floor){
  /* cacheia o exterior por andar — silhuetas distantes não mudam a cada frame */
  paradiseOutsideFloor=game.floor;
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const f=c.getContext('2d');
  const distort=paradiseDistort();
  /* céu: começa azul-claro e fica perturbadoramente branco/amarelado conforme avança */
  const skyTop=lerpColor('#a8c8e0','#e8e4d0',distort);
  const skyMid=lerpColor('#cfe0e8','#f0ebd8',distort);
  const skyBot=lerpColor('#dde8d0','#d8d4c0',distort);
  const sg=f.createLinearGradient(0,0,0,H);
  sg.addColorStop(0,skyTop);sg.addColorStop(.5,skyMid);sg.addColorStop(1,skyBot);
  f.fillStyle=sg;f.fillRect(0,0,W,H);
  /* grama do exterior — bem densa, se estende para longe */
  const grassTop=lerpColor('#5a7a3a','#8a8a52',distort);
  const grassBot=lerpColor('#385224','#5e6034',distort);
  const gg=f.createLinearGradient(0,H*.35,0,H);
  gg.addColorStop(0,grassTop);gg.addColorStop(1,grassBot);
  f.fillStyle=gg;f.fillRect(0,H*.35,W,H*.65);
  /* tufos de grama distantes — pequenos e mais densos no horizonte */
  f.lineWidth=1;f.lineCap='round';
  for(let i=0;i<800;i++){
    const gy=rnd(H*.35,H);
    const perspective=(gy-H*.35)/(H*.65);
    const gx=rnd(0,W);
    const fade=.3+perspective*.7;
    f.strokeStyle='rgba('+(60+perspective*40)+','+(85+perspective*40)+','+(40+perspective*30)+','+fade+')';
    const hgt=2+perspective*5;
    f.beginPath();f.moveTo(gx,gy);f.lineTo(gx-1,gy-hgt);f.stroke();
    f.beginPath();f.moveTo(gx,gy);f.lineTo(gx+1,gy-hgt*1.2);f.stroke();
  }
  /* silhuetas distantes de catedrais no horizonte */
  const nCath=3+Math.floor(distort*2);
  for(let i=0;i<nCath;i++){
    const cx=rnd(W*.1,W*.9);
    const cy=H*.4+rnd(-12,12);
    const scale=rnd(.5,1);
    drawDistantCathedral(f,cx,cy,scale,distort);
  }
  /* árvores muito espaçadas no horizonte */
  for(let i=0;i<5;i++){
    const tx=rnd(0,W),ty=H*.42+rnd(-6,6),ts=rnd(.5,1);
    f.fillStyle='rgba(48,68,38,0.55)';
    f.beginPath();f.arc(tx,ty-12*ts,14*ts,0,TAU);f.fill();
    f.fillRect(tx-1.5*ts,ty-12*ts,3*ts,16*ts);
  }
  /* brilho difuso no céu */
  const eg=f.createRadialGradient(W*.6,H*.15,30,W*.6,H*.15,W*.5);
  eg.addColorStop(0,'rgba(255,250,220,0.45)');
  eg.addColorStop(1,'rgba(255,250,220,0)');
  f.fillStyle=eg;f.fillRect(0,0,W,H*.5);
  /* distorção: rachaduras no céu a partir do andar 4 */
  if(distort>.6){
    f.strokeStyle='rgba(20,16,28,'+((distort-.5)*.5)+')';
    f.lineWidth=1.2;
    for(let i=0;i<Math.floor((distort-.5)*14);i++){
      let cx=rnd(0,W),cy=rnd(0,H*.4);
      f.beginPath();f.moveTo(cx,cy);
      const segs=2+Math.floor(rnd(2,4));
      for(let s=0;s<segs;s++){cx+=rnd(-30,30);cy+=rnd(-12,12);f.lineTo(cx,cy);}
      f.stroke();
    }
  }
  paradiseOutsideCache=c;
}
/* v1.5.0: com a câmera, o campo infinito cobre TODO o retângulo visível do mundo */
ctx.drawImage(paradiseOutsideCache,0,0);
{
const __px0=Math.floor(game.camX/W)*W,__py0=Math.floor(game.camY/H)*H;
for(let __px=__px0;__px<game.camX+W;__px+=W)
  for(let __py=__py0;__py<game.camY+H;__py+=H)
    if(__px!==0||__py!==0)ctx.drawImage(paradiseOutsideCache,__px,__py);
}
/* brilho animado no céu (não cacheado) */
const eg=ctx.createRadialGradient(W*.6+Math.sin(game.t*.2)*30,H*.15,30,W*.6,H*.15,W*.5);
eg.addColorStop(0,'rgba(255,250,220,0.18)');
eg.addColorStop(1,'rgba(255,250,220,0)');
ctx.fillStyle=eg;ctx.fillRect(0,0,W,H*.5);
}
/* silhueta distante de uma catedral — usada no fundo infinito */
function drawDistantCathedral(f,cx,cy,scale,distort){
const s=scale;
f.fillStyle='rgba(60,72,58,'+(0.55+distort*0.1)+')';
/* corpo principal */
f.fillRect(cx-30*s,cy-30*s,60*s,30*s);
/* torres laterais */
f.fillRect(cx-32*s,cy-50*s,10*s,50*s);
f.fillRect(cx+22*s,cy-50*s,10*s,50*s);
/* torre central (mais alta) */
f.fillRect(cx-7*s,cy-66*s,14*s,66*s);
/* ápices das torres — triângulos */
f.beginPath();
f.moveTo(cx-32*s,cy-50*s);f.lineTo(cx-27*s,cy-58*s);f.lineTo(cx-22*s,cy-50*s);f.closePath();f.fill();
f.beginPath();
f.moveTo(cx+22*s,cy-50*s);f.lineTo(cx+27*s,cy-58*s);f.lineTo(cx+32*s,cy-50*s);f.closePath();f.fill();
f.beginPath();
f.moveTo(cx-7*s,cy-66*s);f.lineTo(cx,cy-78*s);f.lineTo(cx+7*s,cy-66*s);f.closePath();f.fill();
/* cruz no topo da torre central */
f.fillRect(cx-1*s,cy-86*s,2*s,10*s);
f.fillRect(cx-4*s,cy-82*s,8*s,2*s);
/* janelas finas (vitrais) — pontos leves */
f.fillStyle='rgba(220,210,180,'+(0.4-distort*0.2)+')';
for(let i=-2;i<=2;i++){
  f.fillRect(cx+i*10*s-1*s,cy-20*s,2*s,12*s);
}
/* distorção: rachaduras nas torres a partir do andar 3 */
if(distort>.4){
  f.strokeStyle='rgba(20,16,18,0.5)';
  f.lineWidth=0.8;
  f.beginPath();
  f.moveTo(cx-27*s,cy-46*s);f.lineTo(cx-25*s,cy-30*s);
  f.moveTo(cx+27*s,cy-46*s);f.lineTo(cx+25*s,cy-32*s);
  f.stroke();
}
}
/* ==== drawParadiseWall: desenha uma seção de parede espelhada
   em uma região retangular (x,y,w,h). O reflexo é uma versão borrada e
   invertida do que está ao redor — para simular uma barreira sobrenatural
   em vez de um espelho doméstico. ==== */
function drawParadiseWall(x,y,w,h,intensity){
if(w<=0||h<=0)return;
intensity=intensity===undefined?1:intensity;
const distort=paradiseDistort();
ctx.save();
ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
/* base: gradiente "leitoso" vertical — parece branco mas com profundidade */
const bg=ctx.createLinearGradient(x,y,x,y+h);
bg.addColorStop(0,'rgba(245,242,232,'+(0.88*intensity)+')');
bg.addColorStop(.5,'rgba(232,228,212,'+(0.92*intensity)+')');
bg.addColorStop(1,'rgba(212,206,188,'+(0.86*intensity)+')');
ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);
/* reflexo vertical invertido do céu e grama — simula espelho do ambiente */
const refl=ctx.createLinearGradient(x,y,x,y+h);
refl.addColorStop(0,'rgba(168,200,224,'+(0.35*intensity)+')');
refl.addColorStop(.4,'rgba(208,228,212,'+(0.32*intensity)+')');
refl.addColorStop(.6,'rgba(150,178,118,'+(0.28*intensity)+')');
refl.addColorStop(1,'rgba(72,100,46,'+(0.22*intensity)+')');
ctx.fillStyle=refl;ctx.fillRect(x,y,w,h);
/* linhas finas verticais — sensação de painéis de espelho */
ctx.strokeStyle='rgba(255,250,235,'+(0.18*intensity)+')';
ctx.lineWidth=1;
const step=64;
for(let lx=x+step;lx<x+w;lx+=step){
  ctx.beginPath();ctx.moveTo(lx,y);ctx.lineTo(lx,y+h);ctx.stroke();
}
/* brilho diagonal — simulando reflexo de luz */
const sx=x+w*(.3+Math.sin(game.t*.15)*.1);
const sg=ctx.createLinearGradient(sx-40,y,sx+40,y+h);
sg.addColorStop(0,'rgba(255,250,220,0)');
sg.addColorStop(.5,'rgba(255,250,220,'+(0.22*intensity*(0.5+0.5*Math.sin(game.t*.4)))+')');
sg.addColorStop(1,'rgba(255,250,220,0)');
ctx.fillStyle=sg;ctx.fillRect(x,y,w,h);
/* reflexo dos personagens e inimigos próximos — silhuetas espectrais */
const reflectRange=240;
/* jogador */
if(player&&!player.dead){
  const dx=player.x-x, dy=player.y;
  if(dx>-reflectRange&&dx<w+reflectRange){
    const t=clamp(1-Math.abs(dx-w/2)/(reflectRange),0,1);
    if(t>0){
      ctx.globalAlpha=t*0.35*intensity;
      ctx.save();
      /* reflexo horizontalmente invertido + levemente deslocado */
      const rx=x+(w-dx);
      ctx.translate(rx,player.y);
      ctx.scale(-1,1);
      ctx.translate(-rx,-player.y);
      drawPlayerSilhouette(rx,player.y);
      ctx.restore();
      ctx.globalAlpha=1;
    }
  }
}
/* inimigos */
for(const e of enemies){
  if(e.dead)continue;
  const dx=e.x-x;
  if(dx<-reflectRange||dx>w+reflectRange)continue;
  const t=clamp(1-Math.abs(dx-w/2)/(reflectRange),0,1);
  if(t<=0)continue;
  ctx.globalAlpha=t*0.28*intensity;
  ctx.save();
  const rx=x+(w-dx);
  ctx.translate(rx,e.y);
  ctx.scale(-1,1);
  ctx.translate(-rx,-e.y);
  drawEnemySilhouette(rx,e.y,e.r);
  ctx.restore();
  ctx.globalAlpha=1;
}
/* distorção: rachaduras finas e distorções no espelho a partir do andar 3 */
if(distort>.3){
  ctx.strokeStyle='rgba(20,16,28,'+(distort*0.4)+')';
  ctx.lineWidth=0.8;
  const nC=Math.floor(distort*8);
  for(let i=0;i<nC;i++){
    const cy=y+rnd(0,h);
    ctx.beginPath();
    ctx.moveTo(x+rnd(0,w*0.4),cy);
    let cx=x+rnd(0,w*0.4);
    for(let s=0;s<3;s++){cx+=rnd(-12,12);ctx.lineTo(cx,cy+rnd(-4,4));}
    ctx.stroke();
  }
}
/* contorno sutil */
ctx.strokeStyle='rgba(255,250,235,'+(0.4*intensity)+')';
ctx.lineWidth=2;
ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
ctx.restore();
}
/* ==== drawParadiseWalls: percorre todas as bordas das salas e desenha
   as superfícies espelhadas apenas nos segmentos visíveis (externos). ==== */
/* v1.6.2: as paredes espelhadas NÃO são mais varridas por frame. Os
   segmentos externos nascem uma vez em buildParadiseSegs() (chamado na
   construção da sala do paraíso) e a parte estática — gradientes leitoso,
   reflexo difuso, rachaduras — fica pintada numa CAMADA EM CACHE; o frame
   inteiro é 1 drawImage + os brilhos pulsantes (traços baratos, sem
   gradiente, sem clip). Era exatamente aqui que o Limbo travava: cada
   segmento criava 2 gradientes + save/clip/restore a cada quadro. */
function buildParadiseSegs(){
paradiseSegs=[];
const rects=game.absRects;
for(const rc of rects){
  const edges=[
    {x1:rc.x,y1:rc.y,x2:rc.x+rc.w,y2:rc.y},
    {x1:rc.x+rc.w,y1:rc.y,x2:rc.x+rc.w,y2:rc.y+rc.h},
    {x1:rc.x+rc.w,y1:rc.y+rc.h,x2:rc.x,y2:rc.y+rc.h},
    {x1:rc.x,y1:rc.y+rc.h,x2:rc.x,y2:rc.y}
  ];
  for(const E of edges){
    const L=Math.hypot(E.x2-E.x1,E.y2-E.y1);
    const n=Math.max(2,Math.round(L/7));
    let run=null; /* início do trecho externo em andamento */
    for(let i=0;i<=n;i++){
      const t=i/n;
      const x=E.x1+(E.x2-E.x1)*t,y=E.y1+(E.y2-E.y1)*t;
      let covered=false;
      for(const o of rects){
        if(o===rc)continue;
        if(x>o.x+3&&x<o.x+o.w-3&&y>o.y+3&&y<o.y+o.h-3){covered=true;break;}
      }
      const on=!covered;
      if(on&&!run)run={x1:x,y1:y};
      else if(!on&&run){
        if(Math.hypot(x-run.x1,y-run.y1)>3)paradiseSegs.push({x1:run.x1,y1:run.y1,x2:x,y2:y});
        run=null;
      }
    }
    if(run)paradiseSegs.push({x1:run.x1,y1:run.y1,x2:E.x2,y2:E.y2});
  }
}
/* camada estática em cache — os gradientes/rachaduras desenhados 1× por sala */
const key=rects.map(r=>r.x+','+r.y+','+r.w+','+r.h).join(';')+'|'+Math.round(paradiseDistort()*20);
if(paradiseWallsKey!==key){
  paradiseWallsKey=key;
  let ox=Infinity,oy=Infinity,mx=-Infinity,my=-Infinity;
  for(const s of paradiseSegs){
    ox=Math.min(ox,s.x1,s.x2);oy=Math.min(oy,s.y1,s.y2);
    mx=Math.max(mx,s.x1,s.x2);my=Math.max(my,s.y1,s.y2);
  }
  if(paradiseSegs.length&&mx>ox){
    ox-=10;oy-=10;mx+=10;my+=10;
    const c=document.createElement('canvas');
    c.width=Math.max(2,Math.ceil(mx-ox));c.height=Math.max(2,Math.ceil(my-oy));
    const f=c.getContext('2d');
    const distort=paradiseDistort();
    for(const s of paradiseSegs)paintMirrorStrip(f,s,ox,oy,distort);
    paradiseWallsCache={c,ox,oy};
  }else paradiseWallsCache=null;
}
}
function drawParadiseWalls(){
if(!isParadiseFloor()||ROOM.inverted)return;
/* v1.6.2: FASE CINZA — o último véu não tem paredes espelhadas: o fundo é liso */
if((game.limboPhase||1)>=4)return;
if(!paradiseWallsCache)return;
const pw=paradiseWallsCache;
ctx.drawImage(pw.c,pw.ox,pw.oy);
/* brilho pulsante — o único traço vivo que sobrou, barato */
for(let i=0;i<paradiseSegs.length;i++){
  const s=paradiseSegs[i];
  const shine=.5+.5*Math.sin(game.t*.8+(s.x1+s.y1)*.01);
  ctx.strokeStyle='rgba(255,250,220,'+(0.4*shine)+')';
  ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
}
}
/* pinta UMA faixa espelhada na camada em cache (f = contexto do cache,
   ox/oy = origem do cache no mundo) — antes isto rodava por frame por
   segmento; agora é 1× por sala. */
function paintMirrorStrip(f,s,ox,oy,distort){
const dx=s.x2-s.x1,dy=s.y2-s.y1;
const L=Math.hypot(dx,dy);
if(L<1)return;
const nx=-dy/L,ny=dx/L;
const thickness=6;
const ax=s.x1+nx*thickness,ay=s.y1+ny*thickness;
const bx=s.x2+nx*thickness,by=s.y2+ny*thickness;
const cx=s.x2-nx*thickness,cy=s.y2-ny*thickness;
const dx2=s.x1-nx*thickness,dy2=s.y1-ny*thickness;
const kxs=[ax,bx,cx,dx2],kys=[ay,by,cy,dy2];
const minX=Math.min.apply(null,kxs)-ox,minY=Math.min.apply(null,kys)-oy;
const w=Math.max.apply(null,kxs)-Math.min.apply(null,kxs)+1;
const h=Math.max.apply(null,kys)-Math.min.apply(null,kys)+1;
f.save();
f.beginPath();
f.moveTo(ax-ox,ay-oy);f.lineTo(bx-ox,by-oy);f.lineTo(cx-ox,cy-oy);f.lineTo(dx2-ox,dy2-oy);f.closePath();
f.clip();
const mx=(s.x1+s.x2)/2-ox,my=(s.y1+s.y2)/2-oy;
/* gradiente leitoso na direção da normal */
const g=f.createLinearGradient(mx-nx*thickness,my-ny*thickness,mx+nx*thickness,my+ny*thickness);
g.addColorStop(0,'rgba(255,250,235,0.95)');
g.addColorStop(.5,'rgba(232,228,212,0.9)');
g.addColorStop(1,'rgba(212,206,188,0.85)');
f.fillStyle=g;
f.fillRect(minX,minY,w,h);
/* reflexo difuso */
const refl=f.createLinearGradient(mx-nx*thickness,my-ny*thickness,mx+nx*thickness,my+ny*thickness);
refl.addColorStop(0,'rgba(168,200,224,0.3)');
refl.addColorStop(.5,'rgba(208,228,212,0.25)');
refl.addColorStop(1,'rgba(150,178,118,0.22)');
f.fillStyle=refl;
f.fillRect(minX,minY,w,h);
/* distorção: rachaduras estáticas (antes nasciam aleatórias TODO frame) */
if(distort>.4){
  f.strokeStyle='rgba(20,16,28,'+(distort*0.5)+')';
  f.lineWidth=0.7;
  const nCr=2+Math.round(L/70);
  for(let i=0;i<nCr;i++){
    const t=Math.random();
    const sx=s.x1+(s.x2-s.x1)*t-ox,sy=s.y1+(s.y2-s.y1)*t-oy;
    f.beginPath();f.moveTo(sx,sy);
    f.lineTo(sx+nx*rnd(-4,4),sy+ny*rnd(-4,4));
    f.stroke();
  }
}
f.restore();
}
/* (v1.6.1 e antes) desenha uma faixa espelhada fina ao redor de um segmento —
   mantida para referência; o desenho por frame agora usa a camada em cache */
function drawMirrorSegment(x1,y1,x2,y2){
const dx=x2-x1,dy=y2-y1;
const L=Math.hypot(dx,dy);
if(L<1)return;
/* vetor normal (aponta para fora, mas tanto faz — espelho é simétrico) */
const nx=-dy/L,ny=dx/L;
const thickness=6;
/* o retângulo espelhado é construído em torno da linha */
const ax=x1+nx*thickness,ay=y1+ny*thickness;
const bx=x2+nx*thickness,by=y2+ny*thickness;
const cx=x2-nx*thickness,cy=y2-ny*thickness;
const dx2=x1-nx*thickness,dy2=y1-ny*thickness;
const minX=Math.min(ax,bx,cx,dx2),minY=Math.min(ay,by,cy,dy2);
const w=Math.abs(Math.max(ax,bx,cx,dx2)-minX),h=Math.abs(Math.max(ay,by,cy,dy2)-minY);
/* renderiza em uma área retangular mínima que cobre o segmento */
ctx.save();
ctx.beginPath();
ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(cx,cy);ctx.lineTo(dx2,dy2);ctx.closePath();
ctx.clip();
const distort=paradiseDistort();
/* gradiente leitoso na direção da normal */
const g=ctx.createLinearGradient(
  (x1+x2)/2-nx*thickness,(y1+y2)/2-ny*thickness,
  (x1+x2)/2+nx*thickness,(y1+y2)/2+ny*thickness
);
g.addColorStop(0,'rgba(255,250,235,0.95)');
g.addColorStop(.5,'rgba(232,228,212,0.9)');
g.addColorStop(1,'rgba(212,206,188,0.85)');
ctx.fillStyle=g;
ctx.fillRect(minX,minY,w+1,h+1);
/* reflexo difuso */
const refl=ctx.createLinearGradient(
  (x1+x2)/2-nx*thickness,(y1+y2)/2-ny*thickness,
  (x1+x2)/2+nx*thickness,(y1+y2)/2+ny*thickness
);
refl.addColorStop(0,'rgba(168,200,224,0.3)');
refl.addColorStop(.5,'rgba(208,228,212,0.25)');
refl.addColorStop(1,'rgba(150,178,118,0.22)');
ctx.fillStyle=refl;
ctx.fillRect(minX,minY,w+1,h+1);
/* brilho pulsante */
const shine=0.5+0.5*Math.sin(game.t*.8+(x1+y1)*0.01);
ctx.strokeStyle='rgba(255,250,220,'+(0.4*shine)+')';
ctx.lineWidth=1.5;
ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
/* distorção: pequenas rachaduras */
if(distort>.4){
  ctx.strokeStyle='rgba(20,16,28,'+(distort*0.5)+')';
  ctx.lineWidth=0.7;
  for(let i=0;i<2;i++){
    const t=Math.random();
    const sx=x1+(x2-x1)*t,sy=y1+(y2-y1)*t;
    ctx.beginPath();
    ctx.moveTo(sx,sy);
    ctx.lineTo(sx+nx*rnd(-4,4),sy+ny*rnd(-4,4));
    ctx.stroke();
  }
}
ctx.restore();
}
/* silhueta simples do jogador para o reflexo */
function drawPlayerSilhouette(x,y){
ctx.fillStyle='rgba(40,30,20,0.7)';
ctx.beginPath();ctx.ellipse(x,y,player.r*0.9,player.r*0.7,0,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(x,y-player.r*0.4,player.r*0.55,0,TAU);ctx.fill();
}
/* silhueta simples de um inimigo para o reflexo */
function drawEnemySilhouette(x,y,r){
ctx.fillStyle='rgba(40,30,20,0.6)';
ctx.beginPath();ctx.arc(x,y,r*0.9,0,TAU);ctx.fill();
}
/* ============================================================
   ESTRUTURAS RELIGIOSAS — desenho das decorações do Falso Paraíso.
   Cada função assume que o contexto já está transladado/rotacionado
   para a posição da decoração. Distort = 0 (sagrado) -> 1 (perturbador).
   ============================================================ */
function drawReligiousStructure(d){
const distort=paradiseDistort();
ctx.save();
ctx.translate(d.x,d.y);
ctx.scale(d.s,d.s);
const LC='rgba(242,238,222,';
const SC='rgba(232,228,212,'; /* stone color */
const SD='rgba(40,32,28,';    /* stone dark / shadow */
const t=d.t;
if(t==='cathedral'){
  /* catedral grande — corpo, torres, vitrais, porta central */
  const w=120,h=120;
  /* sombra */
  ctx.fillStyle='rgba(20,30,14,0.32)';
  ctx.beginPath();ctx.ellipse(0,h*.42,w*.6,12,0,0,TAU);ctx.fill();
  /* corpo principal */
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=2;
  ctx.fillRect(-w/2,-h*.2,w,h*.6);
  ctx.strokeRect(-w/2,-h*.2,w,h*.6);
  /* torres laterais */
  ctx.fillRect(-w/2-6,-h*.5,16,h*.9);
  ctx.strokeRect(-w/2-6,-h*.5,16,h*.9);
  ctx.fillRect(w/2-10,-h*.5,16,h*.9);
  ctx.strokeRect(w/2-10,-h*.5,16,h*.9);
  /* torre central */
  ctx.fillRect(-10,-h*.62,20,h*.72);
  ctx.strokeRect(-10,-h*.62,20,h*.72);
  /* ápices das torres */
  ctx.fillStyle=SC+'.95)';
  ctx.beginPath();ctx.moveTo(-w/2-6,-h*.5);ctx.lineTo(-w/2+2,-h*.6);ctx.lineTo(-w/2+10,-h*.5);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(w/2-10,-h*.5);ctx.lineTo(w/2-2,-h*.6);ctx.lineTo(w/2+6,-h*.5);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-10,-h*.62);ctx.lineTo(0,-h*.74);ctx.lineTo(10,-h*.62);ctx.closePath();ctx.fill();ctx.stroke();
  /* cruz no topo */
  ctx.fillStyle=SD+'.85)';
  ctx.fillRect(-1.5,-h*.82,3,14);
  ctx.fillRect(-6,-h*.78,12,3);
  /* vitrais — três círculos coloridos */
  const vitralCols=['#c95a4f','#4f6ec9','#7e9c5a'];
  for(let i=-1;i<=1;i++){
    const vx=i*22;
    const broken=distort>.4&&Math.random()<.5;
    const vc=vitralCols[i+1];
    ctx.fillStyle=vc;
    ctx.beginPath();ctx.arc(vx,-h*.05,7,0,TAU);ctx.fill();
    ctx.strokeStyle=SD+'.8)';ctx.lineWidth=1.5;
    ctx.stroke();
    /* arco em volta */
    ctx.beginPath();ctx.arc(vx,-h*.05,9,Math.PI,0);ctx.stroke();
    /* vitral quebrado — rachaduras */
    if(broken){
      ctx.strokeStyle='rgba(20,16,18,0.85)';
      ctx.lineWidth=1;
      for(let k=0;k<3;k++){
        ctx.beginPath();
        ctx.moveTo(vx,0);
        ctx.lineTo(vx+rnd(-6,6),-h*.05+rnd(-6,6));
        ctx.stroke();
      }
      /* pedaço faltando */
      ctx.fillStyle=SD+'.4)';
      ctx.beginPath();ctx.arc(vx+rnd(-3,3),-h*.05+rnd(-3,3),4,0,TAU);ctx.fill();
    }
  }
  /* porta central */
  ctx.fillStyle=SD+'.85)';
  ctx.beginPath();
  ctx.moveTo(-8,h*.4);ctx.lineTo(-8,h*.05);ctx.quadraticCurveTo(0,-h*.05,8,h*.05);ctx.lineTo(8,h*.4);ctx.closePath();
  ctx.fill();
  ctx.strokeStyle=SD+'.95)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,h*.05);ctx.lineTo(0,h*.4);ctx.stroke();
  /* distorção: estátuas deformes nas laterais */
  if(distort>.3){
    drawDeformedStatue(-w/2-2,h*.2,0.7,distort);
    drawDeformedStatue(w/2+2,h*.2,0.7,distort);
  }else{
    /* estátuas santas normais */
    drawHolyStatue(-w/2-2,h*.2,0.6);
    drawHolyStatue(w/2+2,h*.2,0.6);
  }
}
else if(t==='chapel'){
  /* capela menor — uma torre com cruz */
  const w=60,h=70;
  ctx.fillStyle='rgba(20,30,14,0.3)';
  ctx.beginPath();ctx.ellipse(0,h*.42,w*.55,8,0,0,TAU);ctx.fill();
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=2;
  ctx.fillRect(-w/2,-h*.2,w,h*.6);
  ctx.strokeRect(-w/2,-h*.2,w,h*.6);
  /* telhado triangular */
  ctx.beginPath();ctx.moveTo(-w/2-2,-h*.2);ctx.lineTo(0,-h*.45);ctx.lineTo(w/2+2,-h*.2);ctx.closePath();
  ctx.fill();ctx.stroke();
  /* torre pequena */
  ctx.fillRect(-6,-h*.55,12,h*.35);
  ctx.strokeRect(-6,-h*.55,12,h*.35);
  ctx.beginPath();ctx.moveTo(-6,-h*.55);ctx.lineTo(0,-h*.65);ctx.lineTo(6,-h*.55);ctx.closePath();ctx.fill();ctx.stroke();
  /* cruz */
  ctx.fillStyle=SD+'.85)';
  ctx.fillRect(-1.5,-h*.75,3,12);
  ctx.fillRect(-5,-h*.71,10,3);
  /* porta */
  ctx.fillStyle=SD+'.85)';
  ctx.beginPath();
  ctx.moveTo(-6,h*.4);ctx.lineTo(-6,h*.1);ctx.quadraticCurveTo(0,0,6,h*.1);ctx.lineTo(6,h*.4);ctx.closePath();
  ctx.fill();
  /* vitral pequeno */
  const vc=['#c95a4f','#4f6ec9','#7e9c5a'][Math.floor(d.f*3)%3];
  ctx.fillStyle=vc;
  ctx.beginPath();ctx.arc(0,-h*.05,4,0,TAU);ctx.fill();
  ctx.strokeStyle=SD+'.7)';ctx.lineWidth=1.2;
  ctx.stroke();
  if(distort>.5&&Math.random()<.5){
    /* vitral quebrado */
    ctx.strokeStyle='rgba(20,16,18,0.85)';ctx.lineWidth=0.9;
    for(let k=0;k<2;k++){
      ctx.beginPath();ctx.moveTo(0,-h*.05);ctx.lineTo(rnd(-4,4),rnd(-8,2));ctx.stroke();
    }
  }
}
else if(t==='altar'){
  /* altar de pedra com tochas */
  const w=46,h=20;
  ctx.fillStyle='rgba(20,30,14,0.3)';
  ctx.beginPath();ctx.ellipse(0,h*.5,w*.6,5,0,0,TAU);ctx.fill();
  /* base do altar */
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=2;
  ctx.fillRect(-w/2,-h*.5,w,h);
  ctx.strokeRect(-w/2,-h*.5,w,h);
  /* topo */
  ctx.fillRect(-w/2-3,-h*.5-4,w+6,5);
  ctx.strokeRect(-w/2-3,-h*.5-4,w+6,5);
  /* cruz no topo do altar */
  ctx.fillStyle=SD+'.8)';
  ctx.fillRect(-1.5,-h*.5-18,3,14);
  ctx.fillRect(-5,-h*.5-14,10,2);
  /* tochas dos lados */
  for(const sx of[-w/2-6,w/2+6]){
    ctx.fillStyle=SD+'.7)';
    ctx.fillRect(sx-2,-h*.5-12,4,12);
    const fl=.7+.3*Math.sin(game.t*9+sx);
    ctx.fillStyle='rgba(255,217,160,'+(.85*fl)+')';
    ctx.beginPath();ctx.ellipse(sx,-h*.5-15,2.4,5*fl,0,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,243,196,'+(.9*fl)+')';
    ctx.beginPath();ctx.arc(sx,-h*.5-14,1.3,0,TAU);ctx.fill();
  }
  /* distorção: sangue/sombra no altar */
  if(distort>.4){
    ctx.fillStyle='rgba(80,16,20,'+(distort*0.6)+')';
    ctx.beginPath();
    ctx.moveTo(-w*.3,h*.5);ctx.quadraticCurveTo(0,0,w*.3,h*.5);
    ctx.fill();
  }
}
else if(t==='cross'){
  /* cruz altaisolada no campo */
  const h=64;
  ctx.fillStyle='rgba(20,30,14,0.3)';
  ctx.beginPath();ctx.ellipse(0,h*.45,12,4,0,0,TAU);ctx.fill();
  /* poste */
  ctx.fillStyle=SD+'.8)';
  ctx.strokeStyle=SD+'.95)';ctx.lineWidth=1;
  ctx.fillRect(-2,-h*.5,4,h);
  ctx.strokeRect(-2,-h*.5,4,h);
  /* braço horizontal */
  ctx.fillRect(-12,-h*.3,24,4);
  ctx.strokeRect(-12,-h*.3,24,4);
  /* placa no topo */
  if(distort<.5){
    ctx.fillStyle=SD+'.6)';
    ctx.fillRect(-5,-h*.42,10,3);
  }
  /* distorção: cruz torta */
  if(distort>.5){
    ctx.fillStyle='rgba(80,16,20,'+((distort-.4)*0.5)+')';
    ctx.fillRect(-2,-h*.5,4,8);
  }
}
else if(t==='column'){
  /* coluna alta de pedra — estilo capitel clássico */
  const h=80,w=22;
  ctx.fillStyle='rgba(20,30,14,0.3)';
  ctx.beginPath();ctx.ellipse(0,h*.45,w*.8,5,0,0,TAU);ctx.fill();
  /* base */
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=1.8;
  ctx.fillRect(-w/2-3,h*.32,w+6,8);
  ctx.strokeRect(-w/2-3,h*.32,w+6,8);
  /* fuste */
  ctx.fillRect(-w/2,-h*.4,w,h*.72);
  ctx.strokeRect(-w/2,-h*.4,w,h*.72);
  /* caneluras */
  ctx.strokeStyle=SD+'.3)';ctx.lineWidth=1;
  for(let k=-1;k<=1;k++){
    ctx.beginPath();ctx.moveTo(k*6,-h*.38);ctx.lineTo(k*6,h*.3);ctx.stroke();
  }
  /* capitel */
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=1.8;
  ctx.fillRect(-w/2-4,-h*.45,w+8,6);
  ctx.strokeRect(-w/2-4,-h*.45,w+8,6);
  ctx.fillRect(-w/2-6,-h*.5,w+12,5);
  ctx.strokeRect(-w/2-6,-h*.5,w+12,5);
  /* distorção: rachaduras na coluna */
  if(distort>.3){
    ctx.strokeStyle='rgba(20,16,18,'+(distort*0.5)+')';
    ctx.lineWidth=1;
    for(let i=0;i<Math.floor(distort*3);i++){
      ctx.beginPath();
      ctx.moveTo(rnd(-w/2,w/2),-h*.3);
      ctx.lineTo(rnd(-w/2,w/2),h*.2);
      ctx.stroke();
    }
  }
}
else if(t==='archway'){
  /* arco grande de pedra — entrada para uma área sagrada */
  const w=90,h=70;
  ctx.fillStyle='rgba(20,30,14,0.3)';
  ctx.beginPath();ctx.ellipse(0,h*.4,w*.5,6,0,0,TAU);ctx.fill();
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=2.5;
  /* pilares */
  ctx.fillRect(-w/2,-h*.4,12,h*.8);
  ctx.strokeRect(-w/2,-h*.4,12,h*.8);
  ctx.fillRect(w/2-12,-h*.4,12,h*.8);
  ctx.strokeRect(w/2-12,-h*.4,12,h*.8);
  /* arco superior */
  ctx.beginPath();
  ctx.moveTo(-w/2,-h*.4);
  ctx.lineTo(-w/2,-h*.55);
  ctx.quadraticCurveTo(0,-h*.85,w/2,-h*.55);
  ctx.lineTo(w/2,-h*.4);
  ctx.stroke();
  ctx.lineWidth=8;ctx.strokeStyle=SC+'.95)';
  ctx.beginPath();
  ctx.moveTo(-w/2,-h*.55);
  ctx.quadraticCurveTo(0,-h*.85,w/2,-h*.55);
  ctx.stroke();
  ctx.lineWidth=2;ctx.strokeStyle=SD+'.6)';
  ctx.beginPath();
  ctx.moveTo(-w/2+3,-h*.55);
  ctx.quadraticCurveTo(0,-h*.82,w/2-3,-h*.55);
  ctx.stroke();
  /* cruz no topo do arco */
  ctx.fillStyle=SD+'.85)';
  ctx.fillRect(-1.5,-h*.92,3,10);
  ctx.fillRect(-5,-h*.88,10,2);
  /* distorção: arco trincado */
  if(distort>.4){
    ctx.strokeStyle='rgba(20,16,18,'+(distort*0.6)+')';
    ctx.lineWidth=1.2;
    ctx.beginPath();
    ctx.moveTo(-w/4,-h*.7);ctx.lineTo(-w/4+3,-h*.4);
    ctx.moveTo(w/4,-h*.7);ctx.lineTo(w/4-3,-h*.4);
    ctx.stroke();
  }
}
else if(t==='tomb'){
  /* túmulo de pedra — lápide inclinada */
  ctx.fillStyle='rgba(20,30,14,0.3)';
  ctx.beginPath();ctx.ellipse(0,8,18,4,0,0,TAU);ctx.fill();
  /* base/caixão */
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=1.5;
  ctx.fillRect(-14,0,28,8);
  ctx.strokeRect(-14,0,28,8);
  /* lápide */
  ctx.save();
  const tilt=distort>.5?rnd(-0.15,0.15):0;
  ctx.translate(0,0);ctx.rotate(tilt);
  ctx.fillRect(-10,-22,20,22);
  ctx.strokeRect(-10,-22,20,22);
  /* topo arredondado */
  ctx.beginPath();ctx.arc(0,-22,10,Math.PI,0);ctx.fill();ctx.stroke();
  /* cruz na lápide */
  ctx.fillStyle=SD+'.7)';
  ctx.fillRect(-1,-18,2,10);
  ctx.fillRect(-4,-14,8,2);
  ctx.restore();
  /* distorção: rachaduras ou terra revolvida */
  if(distort>.3){
    ctx.strokeStyle='rgba(20,16,18,'+(distort*0.6)+')';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-6,-16);ctx.lineTo(2,-8);ctx.stroke();
    if(distort>.6){
      ctx.fillStyle='rgba(60,40,28,'+(distort*0.5)+')';
      ctx.beginPath();ctx.ellipse(0,12,18,4,0,0,TAU);ctx.fill();
    }
  }
}
else if(t==='pews'){
  /* bancos de igreja em fileira */
  for(let row=0;row<3;row++){
    const y=row*16-12;
    ctx.fillStyle=SD+'.7)';
    ctx.strokeStyle=SD+'.9)';ctx.lineWidth=1;
    ctx.fillRect(-24,y,48,4);
    ctx.strokeRect(-24,y,48,4);
    /* encosto */
    ctx.fillRect(-24,y-6,48,2);
    /* pés */
    ctx.fillRect(-22,y+4,2,4);
    ctx.fillRect(20,y+4,2,4);
  }
  /* distorção: bancos tortos/virados */
  if(distort>.5){
    ctx.fillStyle='rgba(60,40,28,0.4)';
    ctx.fillRect(-26,16,52,2);
  }
}
else if(t==='confessional'){
  /* confessionário de madeira */
  const w=44,h=56;
  ctx.fillStyle='rgba(20,30,14,0.3)';
  ctx.beginPath();ctx.ellipse(0,h*.45,w*.5,5,0,0,TAU);ctx.fill();
  /* corpo do confessionário */
  ctx.fillStyle='#5a4230';
  ctx.strokeStyle=SD+'.85)';ctx.lineWidth=2;
  ctx.fillRect(-w/2,-h*.4,w,h*.8);
  ctx.strokeRect(-w/2,-h*.4,w,h*.8);
  /* porta central com cortina */
  ctx.fillStyle='#3a2a1c';
  ctx.fillRect(-7,-h*.3,14,h*.6);
  /* janela gradeada no topo */
  ctx.strokeStyle=SD+'.9)';ctx.lineWidth=1;
  for(let k=-1;k<=1;k++){
    ctx.beginPath();ctx.moveTo(k*5-1,-h*.35);ctx.lineTo(k*5-1,-h*.25);ctx.stroke();
  }
  /* teto pontiagudo */
  ctx.fillStyle='#5a4230';
  ctx.beginPath();
  ctx.moveTo(-w/2-2,-h*.4);ctx.lineTo(0,-h*.55);ctx.lineTo(w/2+2,-h*.4);ctx.closePath();
  ctx.fill();ctx.stroke();
  /* cruz no topo */
  ctx.fillStyle=SD+'.85)';
  ctx.fillRect(-1,-h*.65,2,8);
  ctx.fillRect(-4,-h*.62,8,2);
  /* distorção: sombra perturbadora atrás da cortina */
  if(distort>.5){
    ctx.fillStyle='rgba(20,8,16,'+(distort*0.6)+')';
    ctx.beginPath();ctx.arc(0,0,5,0,TAU);ctx.fill();
    /* olho brilhante */
    ctx.fillStyle='rgba(255,200,160,'+(0.5+0.5*Math.sin(game.t*4))+')';
    ctx.beginPath();ctx.arc(0,-2,1.2,0,TAU);ctx.fill();
  }
}
else if(t==='vitrais'){
  /* vitral grande isolado — janela em pé */
  const w=44,h=70;
  /* moldura de pedra */
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=2;
  ctx.fillRect(-w/2-3,-h/2,w+6,h);
  ctx.strokeRect(-w/2-3,-h/2,w+6,h);
  /* vidro colorido — padrão de cruz com formas geométricas */
  const broken=distort>.4&&d.f<.5;
  const cols=['#c95a4f','#4f6ec9','#7e9c5a','#d4a83a','#7e5ac9'];
  /* fundo do vitral */
  ctx.fillStyle=cols[Math.floor(d.f*cols.length)%cols.length];
  ctx.fillRect(-w/2,-h/2+3,w,h-6);
  /* arco superior */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-w/2,-h/2+3);
  ctx.quadraticCurveTo(0,-h/2-12,w/2,-h/2+3);
  ctx.lineTo(w/2,h/2-3);ctx.lineTo(-w/2,h/2-3);ctx.closePath();
  ctx.clip();
  /* padrão em cruz */
  ctx.fillStyle=cols[Math.floor(d.f*cols.length+1)%cols.length];
  ctx.fillRect(-w/2,-3,w,6);
  ctx.fillRect(-3,-h/2,6,h);
  /* padrão geométrico — quadrantes com cores diferentes */
  const cols2=cols[Math.floor(d.f*cols.length+2)%cols.length];
  ctx.fillStyle=cols2;
  ctx.beginPath();ctx.arc(-w/4,-h/4,8,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(w/4,-h/4,8,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(-w/4,h/4,8,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(w/4,h/4,8,0,TAU);ctx.fill();
  ctx.restore();
  /* moldura interna */
  ctx.strokeStyle=SD+'.8)';ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-w/2,-h/2+3);
  ctx.quadraticCurveTo(0,-h/2-12,w/2,-h/2+3);
  ctx.stroke();
  /* vitral quebrado */
  if(broken){
    ctx.strokeStyle='rgba(20,16,18,0.85)';
    ctx.lineWidth=1.2;
    for(let k=0;k<5;k++){
      ctx.beginPath();
      const sx=rnd(-w/2,w/2),sy=rnd(-h/2+3,h/2-3);
      ctx.moveTo(sx,sy);
      ctx.lineTo(sx+rnd(-12,12),sy+rnd(-12,12));
      ctx.stroke();
    }
    /* pedaço faltando */
    ctx.fillStyle=SD+'.4)';
    ctx.beginPath();ctx.arc(rnd(-w/4,w/4),rnd(-h/4,h/4),6,0,TAU);ctx.fill();
  }
}
else if(t==='stainedglass_window'){
  /* vitral menor, mais simples — usado como decoração lateral */
  const r=14;
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(0,0,r+3,0,TAU);ctx.fill();ctx.stroke();
  /* vidro */
  const cols=['#c95a4f','#4f6ec9','#7e9c5a','#d4a83a'];
  ctx.fillStyle=cols[Math.floor(d.f*cols.length)%cols.length];
  ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
  /* cruz no centro */
  ctx.fillStyle=cols[(Math.floor(d.f*cols.length)+1)%cols.length];
  ctx.fillRect(-1.5,-r,3,r*2);
  ctx.fillRect(-r/2,-1.5,r,3);
  /* contorno */
  ctx.strokeStyle=SD+'.7)';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
  /* brilho pulsante */
  ctx.fillStyle='rgba(255,250,220,'+(0.15+0.1*Math.sin(game.t*2+d.f*7))+')';
  ctx.beginPath();ctx.arc(0,0,r+8,0,TAU);ctx.fill();
}
else if(t==='candle_altar'){
  /* altar com muitas velas — tipo altar lateral de igreja */
  const w=36,h=24;
  ctx.fillStyle='rgba(20,30,14,0.3)';
  ctx.beginPath();ctx.ellipse(0,h*.5,w*.6,4,0,0,TAU);ctx.fill();
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=1.5;
  ctx.fillRect(-w/2,-h*.3,w,h*.8);
  ctx.strokeRect(-w/2,-h*.3,w,h*.8);
  /* tochas/velas em cima */
  const nCandles=3+Math.floor(d.f*3);
  for(let i=0;i<nCandles;i++){
    const cx=(i-(nCandles-1)/2)*8;
    ctx.fillStyle='rgba(230,218,196,.85)';
    ctx.fillRect(cx-1.5,-h*.3-8,3,8);
    const fl=.6+.4*Math.sin(game.t*9+i*2.3+d.f*7);
    ctx.fillStyle='rgba(255,217,160,'+(.85*fl)+')';
    ctx.beginPath();ctx.ellipse(cx,-h*.3-11,2,4*fl,0,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,243,196,'+(.9*fl)+')';
    ctx.beginPath();ctx.arc(cx,-h*.3-10,1.1,0,TAU);ctx.fill();
  }
}
else if(t==='belfry'){
  /* campanário isolado — torre com sino */
  const w=40,h=110;
  ctx.fillStyle='rgba(20,30,14,0.3)';
  ctx.beginPath();ctx.ellipse(0,h*.45,w*.55,6,0,0,TAU);ctx.fill();
  /* fuste da torre */
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=2;
  ctx.fillRect(-w/2,-h*.4,w,h*.85);
  ctx.strokeRect(-w/2,-h*.4,w,h*.85);
  /* câmara do sino — abertura arqueada */
  ctx.fillStyle=SD+'.8)';
  ctx.fillRect(-w/2+4,-h*.35,w-8,h*.25);
  /* sino */
  ctx.fillStyle='#7a6a4a';
  ctx.beginPath();
  ctx.moveTo(-7,-h*.32);ctx.lineTo(7,-h*.32);ctx.lineTo(5,-h*.22);ctx.lineTo(-5,-h*.22);ctx.closePath();
  ctx.fill();
  ctx.strokeStyle=SD+'.85)';ctx.lineWidth=1;ctx.stroke();
  /* badalo */
  ctx.fillStyle=SD+'.85)';
  ctx.fillRect(-1,-h*.24,2,4);
  /* telhado pontudo */
  ctx.fillStyle=SC+'.95)';
  ctx.beginPath();
  ctx.moveTo(-w/2-3,-h*.4);ctx.lineTo(0,-h*.6);ctx.lineTo(w/2+3,-h*.4);ctx.closePath();
  ctx.fill();ctx.stroke();
  /* cruz no topo */
  ctx.fillStyle=SD+'.85)';
  ctx.fillRect(-1.5,-h*.7,3,10);
  ctx.fillRect(-5,-h*.66,10,2);
  /* tijolos visíveis */
  ctx.strokeStyle=SD+'.3)';ctx.lineWidth=0.8;
  for(let yy=-h*.35;yy<h*.4;yy+=8){
    ctx.beginPath();ctx.moveTo(-w/2+2,yy);ctx.lineTo(w/2-2,yy);ctx.stroke();
  }
  /* distorção: rachadura na torre */
  if(distort>.4){
    ctx.strokeStyle='rgba(20,16,18,'+(distort*0.6)+')';
    ctx.lineWidth=1.2;
    ctx.beginPath();
    ctx.moveTo(-w/4,-h*.35);ctx.lineTo(-w/4+4,h*.3);
    ctx.stroke();
  }
}
else if(t==='holy_statue'){
  /* estátua santa isolada */
  drawHolyStatue(0,0,1);
  /* distorção: estátua deformada */
  if(distort>.3){
    drawDeformOverlay(0,0,1,distort);
  }
}
else if(t==='deformed_statue'){
  /* estátua já deformada por padrão — aparece nos andares mais profundos */
  drawDeformedStatue(0,0,1,distort);
}
else if(t==='ruined_wall'){
  /* parede parcialmente destruída */
  const w=80,h=50;
  ctx.fillStyle='rgba(20,30,14,0.3)';
  ctx.beginPath();ctx.ellipse(0,h*.45,w*.5,5,0,0,TAU);ctx.fill();
  ctx.fillStyle=SC+'.95)';
  ctx.strokeStyle=SD+'.6)';ctx.lineWidth=2;
  /* parede com pedaços faltando */
  ctx.beginPath();
  ctx.moveTo(-w/2,h*.4);ctx.lineTo(-w/2,-h*.3);
  ctx.lineTo(-w*.3,-h*.4);ctx.lineTo(-w*.1,-h*.25);
  ctx.lineTo(w*.2,-h*.4);ctx.lineTo(w*.4,-h*.2);
  ctx.lineTo(w/2,-h*.3);ctx.lineTo(w/2,h*.4);
  ctx.closePath();
  ctx.fill();ctx.stroke();
  /* tijolos */
  ctx.strokeStyle=SD+'.4)';ctx.lineWidth=0.8;
  for(let yy=-h*.3;yy<h*.4;yy+=8){
    ctx.beginPath();
    let xx=-w/2;
    while(xx<w/2){
      const nx=Math.min(xx+16,w/2);
      ctx.moveTo(xx,yy);ctx.lineTo(nx,yy);
      xx=nx;
    }
    ctx.stroke();
  }
}
else if(t==='tunnel_arch'){
  /* arco de túnel — entrada para passagem secreta */
  const w=50,h=44;
  ctx.fillStyle='rgba(20,16,14,0.85)'; /* escuridão no centro */
  ctx.beginPath();
  ctx.moveTo(-w/2,h*.4);ctx.lineTo(-w/2,-h*.1);
  ctx.quadraticCurveTo(0,-h*.5,w/2,-h*.1);
  ctx.lineTo(w/2,h*.4);ctx.closePath();
  ctx.fill();
  /* moldura de pedra */
  ctx.strokeStyle=SC+'.95)';ctx.lineWidth=4;
  ctx.beginPath();
  ctx.moveTo(-w/2-2,h*.4);ctx.lineTo(-w/2-2,-h*.1);
  ctx.quadraticCurveTo(0,-h*.55,w/2+2,-h*.1);
  ctx.lineTo(w/2+2,h*.4);
  ctx.stroke();
  ctx.strokeStyle=SD+'.7)';ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-w/2+2,h*.4);ctx.lineTo(-w/2+2,-h*.1);
  ctx.quadraticCurveTo(0,-h*.45,w/2-2,-h*.1);
  ctx.lineTo(w/2-2,h*.4);
  ctx.stroke();
}
ctx.restore();
}
/* estátua santa normal — figura feminina (tipo Virgem Maria) com braços abertos */
function drawHolyStatue(x,y,s){
ctx.save();ctx.translate(x,y);ctx.scale(s,s);
const SC='rgba(232,228,212,0.95)';
const SD='rgba(40,32,28,0.7)';
/* pedestal */
ctx.fillStyle=SC;ctx.strokeStyle=SD;ctx.lineWidth=1.5;
ctx.fillRect(-10,16,20,6);ctx.strokeRect(-10,16,20,6);
/* corpo (manto) */
ctx.beginPath();
ctx.moveTo(-8,16);ctx.lineTo(-6,-4);ctx.lineTo(-3,-8);ctx.lineTo(3,-8);ctx.lineTo(6,-4);ctx.lineTo(8,16);
ctx.closePath();ctx.fill();ctx.stroke();
/* cabeça */
ctx.beginPath();ctx.arc(0,-14,5,0,TAU);ctx.fill();ctx.stroke();
/* véu */
ctx.beginPath();
ctx.moveTo(-6,-12);ctx.quadraticCurveTo(-7,-4,-8,8);
ctx.lineTo(-3,4);ctx.lineTo(-2,-10);ctx.closePath();
ctx.fillStyle='rgba(218,212,196,0.95)';ctx.fill();ctx.stroke();
ctx.beginPath();
ctx.moveTo(6,-12);ctx.quadraticCurveTo(7,-4,8,8);
ctx.lineTo(3,4);ctx.lineTo(2,-10);ctx.closePath();
ctx.fill();ctx.stroke();
/* braços abertos */
ctx.strokeStyle=SD;ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(-5,-2);ctx.lineTo(-12,4);ctx.stroke();
ctx.beginPath();ctx.moveTo(5,-2);ctx.lineTo(12,4);ctx.stroke();
ctx.restore();
}
/* estátua deformada — usada para perturbar progressivamente */
function drawDeformedStatue(x,y,s,distort){
ctx.save();ctx.translate(x,y);ctx.scale(s,s);
const SC='rgba(232,228,212,0.92)';
const SD='rgba(40,32,28,0.75)';
/* pedestal torto */
ctx.fillStyle=SC;ctx.strokeStyle=SD;ctx.lineWidth=1.5;
ctx.save();ctx.rotate(distort*.15);
ctx.fillRect(-10,16,20,6);ctx.strokeRect(-10,16,20,6);
ctx.restore();
/* corpo assimétrico */
ctx.beginPath();
ctx.moveTo(-8,16);ctx.lineTo(-7+distort*2,-4);ctx.lineTo(-3+distort*1.5,-8);ctx.lineTo(3-distort*1.5,-8);ctx.lineTo(7-distort*2,-4);ctx.lineTo(8,16);
ctx.closePath();ctx.fillStyle=SC;ctx.fill();ctx.strokeStyle=SD;ctx.stroke();
/* cabeça torta — rosto com olhos perturbadores */
ctx.save();ctx.rotate(distort*.2);
ctx.beginPath();ctx.arc(0,-14,5,0,TAU);ctx.fill();ctx.stroke();
/* olhos — buracos pretos brilhantes */
ctx.fillStyle='rgba(20,8,10,0.95)';
ctx.beginPath();ctx.arc(-2,-14,1.2,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(2,-14,1.2,0,TAU);ctx.fill();
if(distort>.6){
  ctx.fillStyle='rgba(255,180,160,'+(0.5+0.5*Math.sin(game.t*3))+')';
  ctx.beginPath();ctx.arc(-2,-14,.6,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(2,-14,.6,0,TAU);ctx.fill();
}
/* boca torta */
if(distort>.5){
  ctx.strokeStyle='rgba(20,8,10,0.8)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-2,-11);ctx.lineTo(2,-12);ctx.stroke();
}
ctx.restore();
/* braços — posições erradas */
ctx.strokeStyle=SD;ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(-5,-2);ctx.lineTo(-14,distort>.5?8:2);ctx.stroke();
ctx.beginPath();ctx.moveTo(5,-2);ctx.lineTo(14,distort>.5?-2:6);ctx.stroke();
/* rachaduras */
if(distort>.4){
  ctx.strokeStyle='rgba(20,16,18,'+(distort*0.6)+')';ctx.lineWidth=0.9;
  ctx.beginPath();ctx.moveTo(-3,-6);ctx.lineTo(2,12);ctx.stroke();
}
ctx.restore();
}
/* overlay de deformação para estátuas santas — transforma-as gradualmente */
function drawDeformOverlay(x,y,s,distort){
ctx.save();ctx.translate(x,y);ctx.scale(s,s);
/* sombra nos olhos */
ctx.fillStyle='rgba(20,8,10,'+(distort*0.7)+')';
ctx.beginPath();ctx.arc(-2,-14,1.2,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(2,-14,1.2,0,TAU);ctx.fill();
if(distort>.5){
  ctx.fillStyle='rgba(255,180,160,'+(0.4+0.4*Math.sin(game.t*3))+')';
  ctx.beginPath();ctx.arc(-2,-14,.6,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(2,-14,.6,0,TAU);ctx.fill();
}
/* rachadura */
if(distort>.4){
  ctx.strokeStyle='rgba(20,16,18,'+(distort*0.5)+')';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(-3,-6);ctx.lineTo(2,12);ctx.stroke();
}
ctx.restore();
}
function drawGroundEmbers(){
for(const g of groundEmbers){
  if(g.paradise){
    /* pólen dourado flutuante do Falso Paraíso */
    const a=.22+.18*Math.sin(game.t*1.4+g.ph);
    ctx.globalAlpha=a;ctx.fillStyle='#fff3c4';
    ctx.beginPath();ctx.arc(g.x,g.y,1.6,0,TAU);ctx.fill();
    ctx.globalAlpha=a*.4;ctx.fillStyle='#ffd9a0';
    ctx.beginPath();ctx.arc(g.x,g.y,4.2,0,TAU);ctx.fill();
    continue;
  }
const a=.18+.14*Math.sin(game.t*1.7+g.ph);
ctx.globalAlpha=a;ctx.fillStyle='#e8455a';
ctx.beginPath();ctx.arc(g.x,g.y,2,0,TAU);ctx.fill();
ctx.globalAlpha=a*.35;
ctx.beginPath();ctx.arc(g.x,g.y,5.5,0,TAU);ctx.fill();
}
for(const a of ambient){
ctx.globalAlpha=.12+.1*Math.sin(game.t*2+a.ph);
ctx.fillStyle='#ff8f3d';
ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,TAU);ctx.fill();
}
ctx.globalAlpha=1;
}
/* ============ v1.3.5: PENUMBRA INFERNAL — borda que tremula + FOGO FORA do cenário ============ */
function infernalZoneOn(){
return !ROOM.inverted&&(game.region||'penumbra')==='penumbra'&&(game.floor||1)>2&&(game.state==='play'||game.state==='bossintro');
}
function drawInfernalFires(){
if(!infernalZoneOn())return;
/* línguas de chama tremulando na borda queimada do chão (subconjunto por frame) */
const tick=(game.t*9)|0;
for(let i=0;i<peninfEdgePts.length;i++){
if((i*7+tick)%17>=6)continue;
const p=peninfEdgePts[i];
const fl=2.2+2.6*Math.abs(Math.sin(game.t*4.1+i*1.7));
ctx.globalAlpha=.42;
ctx.fillStyle='#ff7a1e';
ctx.beginPath();ctx.ellipse(p.x,p.y-.5,2.2,fl,0,0,TAU);ctx.fill();
ctx.globalAlpha=.55;
ctx.fillStyle='#ffd27a';
ctx.beginPath();ctx.ellipse(p.x,p.y-.2,1,fl*.5,0,0,TAU);ctx.fill();
}
ctx.globalAlpha=1;
/* o FOGO queimando FORA do cenário, no vazio junto às paredes */
for(const fr of (game.outerFires||[])){
const sway=Math.sin(game.t*2.6+fr.ph)*.13;
const h=fr.s*(1+.15*Math.sin(game.t*3.7+fr.ph*2));
const glow=ctx.createRadialGradient(fr.x,fr.y,2,fr.x,fr.y,fr.s*2.8);
glow.addColorStop(0,'rgba(255,140,40,0.42)');glow.addColorStop(.5,'rgba(220,60,18,0.18)');glow.addColorStop(1,'rgba(120,20,8,0)');
ctx.fillStyle=glow;ctx.beginPath();ctx.arc(fr.x,fr.y,fr.s*2.8,0,TAU);ctx.fill();
ctx.save();ctx.translate(fr.x,fr.y);ctx.rotate(sway);
for(let t2=0;t2<3;t2++){
const off=(t2-1)*fr.s*.6;
const hh=h*(t2===1?1.3:.78)*(1+.2*Math.sin(game.t*(3.1+t2)+fr.ph+t2*2));
ctx.fillStyle=t2===1?'#ffb347':'#ff6a1c';
ctx.beginPath();
ctx.moveTo(off-fr.s*.32,0);
ctx.quadraticCurveTo(off-fr.s*.18,-hh*.55,off+Math.sin(game.t*(2.2+t2*1.3)+fr.ph)*fr.s*.16,-hh);
ctx.quadraticCurveTo(off+fr.s*.18,-hh*.55,off+fr.s*.32,0);
ctx.closePath();ctx.fill();
}
ctx.fillStyle='rgba(255,236,170,0.8)';
ctx.beginPath();ctx.ellipse(0,-h*.14,fr.s*.26,fr.s*.42,0,0,TAU);ctx.fill();
ctx.restore();
/* brasas subindo do fogo */
if(Math.random()<.08)particles.push({x:fr.x+(Math.random()*12-6),y:fr.y-(4+Math.random()*10),vx:Math.random()*16-8,vy:-(26+Math.random()*26),life:.7+Math.random()*.7,t:0,r:1+Math.random(),c:'#ff9a3d',drag:1,glow:true});
}
}
/* ============ render: portas ============ */
/* v1.5.2: cor do CHÃO sob a porta — a porta deixa de ser uma folha pintada
   e vira apenas uma PASSAGEM aberta na parede, da mesma cor do piso.
   (amostra o próprio piso desenhado da sala; a escola e o castelo têm
   renderizadores próprios e continuam com as portas deles, intocadas) */
function doorFloorColor(d){
try{
  const horiz=d.dir==='n'||d.dir==='s';
  if(d._fc&&(d._fcT===undefined||game.t-d._fcT<.5))return d._fc;
  let fc=null;
  if(roomFloor&&roomFloor.width>2){
    const g=roomFloor.getContext('2d');
    const m=game.absMain;
    let sx=d.x-ROOM.x,sy=d.y-ROOM.y;
    if(horiz)sy+=(Math.sign((m.y+m.h/2)-d.y)||1)*30;
    else sx+=(Math.sign((m.x+m.w/2)-d.x)||1)*30;
    sx=clamp(Math.round(sx),0,roomFloor.width-1);sy=clamp(Math.round(sy),0,roomFloor.height-1);
    const px=g.getImageData(sx,sy,1,1).data;
    fc='rgb('+px[0]+','+px[1]+','+px[2]+')';
  }
  if(!fc)fc=ROOM.inverted?'#e9e7e0':((game.region||'penumbra')==='penumbra'&&(game.floor||1)>2?'#e9e3d6':'#0f0b0e');
  d._fc=fc;d._fcT=game.t;
  return fc;
}catch(e){return ROOM.inverted?'#e9e7e0':'#0f0b0e';}
}
function drawDoors(){
if(game.state==='menu'||game.state==='select')return;
for(const d of game.doors){
/* v1.0.0: porta escondida — desenho próprio de parede rachada (ou vazio
   explodido); o jogador precisa NOTAR a rachadura */
if(d.hidden){drawCrackedDoor(d);continue;}
const horiz=d.dir==='n'||d.dir==='s';
ctx.save();
ctx.translate(d.x,d.y);
/* v1.5.2: PASSAGEM da cor do chão — aberta ou trancada, é só um vão */
ctx.fillStyle=doorFloorColor(d);
if(horiz)ctx.fillRect(-38,-11,76,22);else ctx.fillRect(-11,-38,22,76);
if(!d.open){
/* trancada: o vão escurece e uma costura fina marca o bloqueio —
   continua parecendo passagem, só que "emperrada" */
ctx.fillStyle='rgba(0,0,0,.32)';
if(horiz)ctx.fillRect(-38,-11,76,22);else ctx.fillRect(-11,-38,22,76);
ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=2.5;
ctx.beginPath();
if(horiz){ctx.moveTo(0,-11);ctx.lineTo(0,11);}
else{ctx.moveTo(-11,0);ctx.lineTo(11,0);}
ctx.stroke();
ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;
ctx.beginPath();
if(horiz){ctx.moveTo(-30,-11);ctx.lineTo(-30,11);ctx.moveTo(30,-11);ctx.lineTo(30,11);}
else{ctx.moveTo(-11,-30);ctx.lineTo(11,-30);ctx.moveTo(-11,30);ctx.lineTo(11,30);}
ctx.stroke();
}else if(d.extra){
const p=.5+.5*Math.sin(game.t*5);
ctx.strokeStyle='#a52a3a';ctx.lineWidth=4;
if(horiz)ctx.strokeRect(-34,-10,68,20);else ctx.strokeRect(-10,-34,20,68);
ctx.globalAlpha=.3+.3*p;
ctx.fillStyle='#a52a3a';
if(horiz)ctx.fillRect(-30,-6,60,12);else ctx.fillRect(-6,-30,12,60);
ctx.globalAlpha=1;
ctx.globalAlpha=.6+.4*p;
txt('PORTAL',0,horiz?(d.dir==='n'?-26:26):0,MONO,9,'#e8455a','center',3);
ctx.globalAlpha=1;
}else{
/* aberta: respiração sutil de luz no vão — convite discreto à travessia */
const p=.10+.08*Math.sin(game.t*3.4);
ctx.fillStyle='rgba(255,238,214,'+p+')';
if(horiz)ctx.fillRect(-38,-11,76,22);else ctx.fillRect(-11,-38,22,76);
}
ctx.restore();
}
}
/* v1.0.0: a parede rachada que esconde a sala secreta — sutil de propósito */
function drawCrackedDoor(d){
const horiz=d.dir==='n'||d.dir==='s';
ctx.save();
ctx.translate(d.x,d.y);
if(d.open){
/* explodida: passagem escura respirando */
ctx.fillStyle='#0a0709';
if(horiz)ctx.fillRect(-34,-9,68,18);else ctx.fillRect(-9,-34,18,68);
const p=.4+.3*Math.sin(game.t*3);
ctx.globalAlpha=p;
ctx.strokeStyle='#9d6bb5';ctx.lineWidth=1.5;
if(horiz)ctx.strokeRect(-34,-9,68,18);else ctx.strokeRect(-9,-34,18,68);
ctx.globalAlpha=1;
}else{
ctx.fillStyle='#141014';
if(horiz)ctx.fillRect(-34,-9,68,18);else ctx.fillRect(-9,-34,18,68);
ctx.strokeStyle='rgba(88,78,84,.5)';
ctx.lineWidth=1;
ctx.beginPath();
if(horiz){ctx.moveTo(-30,2);ctx.lineTo(-14,-3);ctx.lineTo(-6,4);ctx.lineTo(8,-4);ctx.lineTo(20,2);ctx.lineTo(30,-2);}
else{ctx.moveTo(2,-30);ctx.lineTo(-3,-14);ctx.lineTo(4,-6);ctx.lineTo(-4,8);ctx.lineTo(2,20);ctx.lineTo(-2,30);}
ctx.stroke();
if(Math.random()<.02)particles.push({x:d.x+rnd(-22,22),y:d.y+rnd(-9,9),vx:rnd(-6,6),vy:rnd(-14,-4),life:rnd(.4,.9),t:0,r:1,c:'#574f45',drag:.96});
}
ctx.restore();
}
/* ============ portal de descida ============ */
function drawPortal(){
if(!game.portal)return;
const pz=game.puzzle;const runeCount=pz&&Array.isArray(pz.need)?pz.need.length:3;
const p=game.portal;
const pr=Math.min(1,p.t/.7);
const R=56*pr;
ctx.save();
ctx.translate(p.x,p.y);
if(Math.random()<.7){
const a=rnd(TAU),d=rnd(R*.4,R*1.4);
particles.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d*.6,vx:-Math.cos(a)*60,vy:-Math.sin(a)*36,life:.5,t:0,r:2,c:pick(['#9d6bb5','#e6dac4','#c9a0ff']),drag:0,glow:true});
}
ctx.fillStyle='#000';
ctx.beginPath();ctx.ellipse(0,0,R,R*.64,0,0,TAU);ctx.fill();
for(let k=0;k<runeCount;k++){
ctx.save();
ctx.rotate(game.t*(1.2+k*.5)+k);
ctx.strokeStyle=k%2?'#c9a0ff':'#e6dac4';
ctx.globalAlpha=.5+.3*Math.sin(game.t*4+k*2);
ctx.lineWidth=2.5-k*.5;
ctx.beginPath();ctx.ellipse(0,0,R+k*8,R*.64+k*5,0,0,TAU);ctx.stroke();
ctx.restore();
}
ctx.globalAlpha=1;
ctx.restore();
ctx.globalAlpha=.6+.35*Math.sin(game.t*4);
txt('DESCER — DESCIDA '+roman(game.floor+1),p.x,p.y-84,MONO,12,'#c9a0ff','center',4);
ctx.globalAlpha=1;
}
/* ============ sala inicial: comandos ============ */
function drawTutorial(){
if(game.roomKind!=='start'||game.floor!==1)return;
const m=game.absMain;
const cx=m.x+m.w/2,cy=m.y+m.h*.45;
ctx.save();
/* v0.9.9: a SALA DAS RELÍQUIAS substitui os comandos quando há 2+ relíquias */
if(game.relicRoom){
 ctx.globalAlpha=.8;
 txt('A SALA DAS RELÍQUIAS',cx,cy-172,MONO,16,'#9fd8ff','center',6);
 ctx.globalAlpha=.5;
 txt('escolha UMA — as portas dormem até a escolha',cx,cy-148,MONO,10,'#9c8f7c','center',2);
 const rel=UNLOCKS.filter(u=>u.chk(META));
 const n=rel.length||1;
 const R=Math.min(210,m.w*.34);
 for(let i=0;i<n;i++){
  const a=-Math.PI/2+i/n*TAU;
  const px=cx+Math.cos(a)*R,py=cy+Math.sin(a)*R*.72;
  const u=rel[i];
  const chosen=game.relicChoiceDone;
  const glow=.5+.3*Math.sin(game.t*2.4+i*1.3);
  ctx.globalAlpha=chosen?.28:glow;
  ctx.fillStyle='rgba(15,11,14,.9)';
  ctx.beginPath();ctx.ellipse(px,py+16,20,7,0,0,TAU);ctx.fill();
  ctx.fillStyle=chosen?'#3a3430':'#1a1418';
  ctx.strokeStyle=chosen?'rgba(242,240,234,.4)':'#9fd8ff';
  ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(px-12,py+14);ctx.lineTo(px-7,py-14);ctx.lineTo(px+7,py-14);ctx.lineTo(px+12,py+14);ctx.closePath();
  ctx.fill();ctx.stroke();
  /* gema da relíquia */
  ctx.fillStyle=chosen?'#4a423c':'#bfd8e8';
  ctx.globalAlpha=chosen?.3:1;
  ctx.beginPath();ctx.moveTo(px,py-26);ctx.lineTo(px+8,py-16);ctx.lineTo(px,py-8);ctx.lineTo(px-8,py-16);ctx.closePath();ctx.fill();
  ctx.globalAlpha=chosen?.3:.85;
  txt(u.name,px,py+34,MONO,9,'#e6dac4','center',2);
 }
 ctx.globalAlpha=.5+.2*Math.sin(game.t*2.5);
 txt('as demais relíquia dormem — a escolha é para a descida inteira',cx,cy+168,MONO,10,'#6e6357','center',2);
 ctx.globalAlpha=1;
 ctx.restore();
 return;
}
ctx.globalAlpha=.55;
txt('COMANDOS BÁSICOS',cx,cy-140,MONO,15,'#e6dac4','center',6);
function keycap(x,y,w,label){
ctx.fillStyle='rgba(15,11,14,.9)';
ctx.fillRect(x-w/2,y-22,w,44);
ctx.strokeStyle='rgba(242,240,234,.7)';
ctx.lineWidth=2;
ctx.strokeRect(x-w/2,y-22,w,44);
txt(label,x,y,MONO,16,'#f2f0ea','center',1);
}
keycap(cx-54,cy-60,44,'W');
keycap(cx-104,cy,44,'A');
keycap(cx-54,cy,44,'S');
keycap(cx-4,cy,44,'D');
txt('MOVER',cx-54,cy+48,MONO,11,'#9c8f7c','center',3);
keycap(cx+96,cy-30,120,'ESPAÇO');
txt('ITEM ATIVO',cx+96,cy+22,MONO,11,'#9c8f7c','center',2);
keycap(cx+240,cy-30,150,'← ↑ ↓ →');
txt('ATACAR (OU CLIQUE)',cx+240,cy+22,MONO,11,'#9c8f7c','center',2);
keycap(cx+240,cy+62,60,'Z');
txt('INTERAGIR',cx+240,cy+112,MONO,11,'#9c8f7c','center',2);
/* v1.4.6: SHIFT = FOCO (hitbox visível + passo lento) · desvio = toque duplo */
keycap(cx+96,cy+62,120,'SHIFT');
txt('FOCO · DESVIO 2×',cx+96,cy+112,MONO,11,'#9c8f7c','center',2);
ctx.globalAlpha=.4+.15*Math.sin(game.t*2.5);
txt('limpe cada sala para abrir as portas — pise nelas para passar',cx,cy+104,MONO,11,'#9c8f7c','center',2);
txt('derrote o chefe do mapa para abrir o portal · cinco descidas até o guardião',cx,cy+128,MONO,10,'#6e6357','center',2);
txt('visite o ERRANTE nas lojas: almas compram bênçãos, armas e corações',cx,cy+176,MONO,10,'#ffd9a0','center',2);
ctx.globalAlpha=.4+.15*Math.sin(game.t*2.5+1);
txt('[B] códice — bênçãos e grimório',cx,cy+152,MONO,10,'#6e6357','center',2);
ctx.globalAlpha=1;
ctx.restore();
}
/* ============ v0.9.9: altar de sacrifício — AGORA VISÍVEL na sala ============
   (antes só existia no minimapa; o jogador entrava e não via nada) */
function drawSacrificeAltar(){
if(!game.sacrificeAltar)return;
const a=game.sacrificeAltar;
const bob=Math.sin(game.t*2.2)*2;
const near=dist(player.x,player.y,a.x,a.y)<70;
ctx.save();
/* aura de sangue */
ctx.globalAlpha=a.used?.10:.22+.1*Math.sin(game.t*3);
ctx.fillStyle='#a52a3a';
ctx.beginPath();ctx.arc(a.x,a.y,54,0,TAU);ctx.fill();
/* círculo ritual no chão — selo do Abismo */
ctx.globalAlpha=a.used?.25:.5+.2*Math.sin(game.t*2);
ctx.strokeStyle='#d9465a';ctx.lineWidth=2;
ctx.beginPath();ctx.arc(a.x,a.y,38,0,TAU);ctx.stroke();
ctx.setLineDash([6,8]);
ctx.beginPath();ctx.arc(a.x,a.y,46,game.t*.4,game.t*.4+TAU);ctx.stroke();
ctx.setLineDash([]);
/* pedestal de pedra */
ctx.globalAlpha=1;
ctx.fillStyle='#241a1e';
ctx.beginPath();ctx.ellipse(a.x,a.y+14,26,10,0,0,TAU);ctx.fill();
ctx.fillStyle='#3a2a30';
ctx.fillRect(a.x-18,a.y-16+bob,36,28);
ctx.fillStyle='#2a1c22';
ctx.fillRect(a.x-22,a.y-20+bob,44,8);
ctx.strokeStyle='#14100e';ctx.lineWidth=2;
ctx.strokeRect(a.x-18,a.y-16+bob,36,28);
/* sangue escorrendo */
ctx.globalAlpha=a.used?.3:.85;
ctx.fillStyle='#a52a3a';
ctx.fillRect(a.x-14,a.y-8+bob,28,4);
ctx.beginPath();ctx.moveTo(a.x-6,a.y-4+bob);ctx.lineTo(a.x-2,a.y+12+bob);ctx.lineTo(a.x+2,a.y+12+bob);ctx.lineTo(a.x+6,a.y-4+bob);ctx.closePath();ctx.fill();
/* braseiro/crinaça no topo */
if(!a.used){
 const fp=.6+.4*Math.sin(game.t*7);
 ctx.globalAlpha=.5*fp;
 ctx.fillStyle='#ff6b3d';
 ctx.beginPath();ctx.arc(a.x,a.y-26+bob,9,0,TAU);ctx.fill();
 ctx.globalAlpha=.9*fp;
 ctx.fillStyle='#ffd9a0';
 ctx.beginPath();ctx.arc(a.x,a.y-24+bob,4,0,TAU);ctx.fill();
}
ctx.globalAlpha=1;
/* hint de interação */
if(!a.used&&near&&game.state==='play'){
 ctx.globalAlpha=.6+.4*Math.sin(game.t*5);
 txt('[Z] SACRIFICAR 10 DE VIDA',a.x,a.y-58+bob,MONO,10,'#d9465a','center',3);
}else if(a.used){
 ctx.globalAlpha=.4;
 txt('o altar descansou — volte depois',a.x,a.y-54,MONO,8,'#6e6357','center',2);
}
ctx.globalAlpha=1;
ctx.restore();
}
/* v1.1.2: as mercadorias no chão — a feira ao redor do ERRANTE */
function drawShopFloor(){
if(!game.shopItems.length)return;
for(const s of game.shopItems){
if(s.x==null)continue;
const t=game.t,near=(game.shopNear===s);
const bob=Math.sin(t*2+(s.ph||0))*1.5;
/* sombra + tapetinho de feira */
ctx.save();ctx.translate(s.x,s.y);
ctx.fillStyle='rgba(0,0,0,.35)';
ctx.beginPath();ctx.ellipse(0,9,15,5,0,0,TAU);ctx.fill();
ctx.globalAlpha=.9;
ctx.strokeStyle=s.bought?'rgba(110,99,87,.45)':(near?'rgba(255,217,160,.95)':'rgba(201,164,76,.5)');
ctx.lineWidth=near?2:1.2;
ctx.beginPath();ctx.ellipse(0,2,14,6,0,0,TAU);ctx.stroke();
if(near&&!s.bought){ctx.globalAlpha=.35+.3*Math.sin(t*5);ctx.beginPath();ctx.ellipse(0,2,20,9,0,0,TAU);ctx.stroke();}
ctx.globalAlpha=s.bought?.35:1;
ctx.translate(0,bob);
if(s.kind==='heart'){
ctx.fillStyle='#c9405a';
ctx.beginPath();ctx.moveTo(0,6);
ctx.bezierCurveTo(-9,-2,-5,-9,0,-4);
ctx.bezierCurveTo(5,-9,9,-2,0,6);ctx.fill();
}else if(s.kind==='fagulha'){
const g=.6+.4*Math.sin(t*4+(s.ph||0));
ctx.fillStyle='rgba(255,143,61,'+g.toFixed(3)+')';
ctx.beginPath();ctx.arc(0,-1,4.5,0,TAU);ctx.fill();
ctx.fillStyle='rgba(255,224,150,.95)';
ctx.beginPath();ctx.arc(0,-1,2,0,TAU);ctx.fill();
}else{
/* v1.1.3: bênção/pacto à venda mostra a arte (assets/sprites/drops/<id>.png) */
const dimS=s.up?dropImg(s.up.id):null;
if(dimS){const ds=26;ctx.drawImage(dimS,-ds/2,-ds/2,ds,ds);}
else{
const sc=s.strong?7:5.5;
ctx.fillStyle=s.strong?'#c9a0ff':'#ffd9a0';
ctx.beginPath();ctx.moveTo(0,-sc);ctx.lineTo(sc*.72,0);ctx.lineTo(0,sc);ctx.lineTo(-sc*.72,0);ctx.closePath();ctx.fill();
if(s.strong){ctx.strokeStyle='rgba(201,160,255,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-sc-3);ctx.lineTo(sc*.72+3,0);ctx.lineTo(0,sc+3);ctx.lineTo(-sc*.72-3,0);ctx.closePath();ctx.stroke();}
}
}
ctx.restore();
/* preço (e nome quando é a mercadoria mais próxima) */
ctx.save();ctx.translate(s.x,s.y);
if(near&&!s.bought){
/* v1.6.3: DESTAQUE TOTAL — a bênção selecionada ganha uma placa clara com o
   NOME em AZUL-ESCURO, bem legível de ler (antes era um texto pequeno cor de
   pergaminho que sumia no chão escuro) */
ctx.font='700 11px '+MONO;
const nw=ctx.measureText(s.name).width,bw=nw+18;
ctx.fillStyle='rgba(233,236,242,.95)';
ctx.strokeStyle='#2c5fb8';ctx.lineWidth=1.5;
ctx.fillRect(-bw/2,-32,bw,18);
ctx.strokeRect(-bw/2,-32,bw,18);
ctx.fillStyle='#0c2d6b';ctx.textAlign='center';ctx.fillText(s.name,0,-19);
}
const afford=game.souls>=s.price;
ctx.globalAlpha=s.bought?.55:1;
txt(s.bought?'VENDIDO':(s.price+' ALMAS'),0,20,MONO,8,s.bought?'#6e6357':afford?(s.strong?'#c9a0ff':'#ffd9a0'):'#d9465a','center',1);
if(near&&!s.bought){ctx.globalAlpha=.55+.45*Math.sin(t*5);txt('[Z] COMPRAR',0,32,MONO,9,'#e6dac4','center',2);}
ctx.restore();
}
}
function drawShop(){
/* v1.1.2: primeiro a feira no chão, depois o ERRANTE */
drawShopFloor();
/* O ERRANTE — NPC vendedor da penumbra */
if(!game.keeper)return;
const k=game.keeper;
const bob=Math.sin(game.t*2+k.ph)*2.5;
ctx.save();
ctx.translate(k.x,k.y);
/* tapete do negociante */
ctx.globalAlpha=.5;
ctx.fillStyle='#241b20';
ctx.beginPath();ctx.ellipse(0,16,52,16,0,0,TAU);ctx.fill();
ctx.strokeStyle='rgba(201,164,76,.4)';ctx.lineWidth=1.5;
ctx.beginPath();ctx.ellipse(0,16,44,12,0,0,TAU);ctx.stroke();
ctx.globalAlpha=1;
/* sombra */
ctx.fillStyle='rgba(0,0,0,.4)';
ctx.beginPath();ctx.ellipse(0,14,22,6,0,0,TAU);ctx.fill();
ctx.translate(0,bob);
/* manto (capuz longo) */
ctx.fillStyle='#181018';
ctx.strokeStyle='#3a2b33';ctx.lineWidth=2;
ctx.beginPath();
ctx.moveTo(-16,12);
ctx.bezierCurveTo(-19,-14,-10,-30,0,-30);
ctx.bezierCurveTo(10,-30,19,-14,16,12);
ctx.quadraticCurveTo(0,18,-16,12);
ctx.closePath();ctx.fill();ctx.stroke();
/* capuz */
ctx.fillStyle='#241b20';
ctx.beginPath();
ctx.arc(0,-22,11,Math.PI*.95,Math.PI*2.05);
ctx.quadraticCurveTo(0,-8,-10.6,-19.4);
ctx.closePath();ctx.fill();ctx.stroke();
/* olhos brilhando dentro do capuz */
const eg=.6+.4*Math.sin(game.t*3+k.ph);
ctx.fillStyle='rgba(255,217,160,'+eg+')';
ctx.beginPath();ctx.arc(-3.6,-21,1.7,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(3.6,-21,1.7,0,TAU);ctx.fill();
/* lanterna flutuante */
const lx=Math.sin(game.t*1.4+k.ph)*4,ly=-8+Math.cos(game.t*1.1+k.ph)*3;
ctx.strokeStyle='rgba(201,164,76,.6)';ctx.lineWidth=1;
ctx.beginPath();ctx.moveTo(14,-14);ctx.lineTo(19+lx,ly-8);ctx.stroke();
ctx.globalAlpha=.16+.08*eg;
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(19+lx,ly,14,0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.fillStyle='#c9a44c';
ctx.fillRect(16+lx,ly-5,6,10);
ctx.fillStyle='rgba(255,243,196,'+(.75*eg)+')';
ctx.fillRect(17.5+lx,ly-3,3,6);
ctx.restore();
/* etiqueta + dica de interação */
ctx.save();
ctx.translate(k.x,k.y);
txt('O ERRANTE',0,-46,MONO,10,'#ffd9a0','center',3);
if(game.keeperNear&&(game.state==='play')&&!game.shopNear){
const anyLeft=game.shopItems.some(function(s){return !s.bought;});
ctx.globalAlpha=.5+.35*Math.sin(game.t*4);
txt(anyLeft?'as mercadorias estão no chão':'não tenho mais nada para você',0,44,MONO,9,'#9c8f7c','center',2);
ctx.globalAlpha=1;
}
ctx.restore();
}
function drawRoomEventFx(){
const ev=game.roomEvent;
if(!ev)return;
if(ev.type==='void'){
const g=ctx.createRadialGradient(player.x,player.y,90,player.x,player.y,520);
g.addColorStop(0,'rgba(0,0,0,0)');
g.addColorStop(1,'rgba(2,1,3,.72)');
ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
if(ev.type==='soulrain'&&Math.random()<.5)
particles.push({x:lerp(ROOM.x+20,ROOM.x+ROOM.w-20,Math.random()),y:ROOM.y+10,vx:rnd(-8,8),vy:rnd(40,110),life:.7,t:0,r:1.8,c:'#bfd8e8',drag:0,glow:true});
if(ev.type==='blood'){
ctx.globalAlpha=.06+.03*Math.sin(game.t*3);
ctx.fillStyle='#a42030';
ctx.fillRect(ROOM.x,ROOM.y,ROOM.w,ROOM.h);
ctx.globalAlpha=1;
}
if(ev.type==='frenzy'&&Math.random()<.2)
particles.push({x:lerp(ROOM.x,ROOM.x+ROOM.w,Math.random()),y:lerp(ROOM.y,ROOM.y+ROOM.h,Math.random()),vx:rnd(-30,30),vy:rnd(-30,30),life:.3,t:0,r:2,c:'#e8455a',glow:true});
}
function drawE404Glitch(){
const r=game.mapRooms[game.roomIdx];
if(!r||!r.e404||!e404Any())return;
if(Math.random()<.4){
ctx.globalAlpha=rnd(.03,.1);
ctx.fillStyle=Math.random()<.5?'#ff4fd8':'#4ff5ff';
if(Math.random()<.5)ctx.fillRect(rnd(W),rnd(H),rnd(60,300),rnd(2,8));
else ctx.fillRect(rnd(W),rnd(H),rnd(2,8),rnd(20,120));
ctx.globalAlpha=1;
}
}
/* ============ render: HUD + mapa ============ */
function roomKindColor(kind,done,r){
if(kind==='sboss')return r&&r.sbossKind==='e404'?'#4ff5ff':'#ffd9a0';
if(kind==='treasure')return done?'#8a6d2f':'#c9a44c';
if(kind==='shop')return done?'#8a6d2f':'#ffd9a0';
if(kind==='challenge')return done?'#7e2634':'#ff8f3d';
if(kind==='secret')return '#9d6bb5';
if(kind==='miniboss')return done?'#7e2634':'#e8455a';
if(kind==='empty')return done?'rgba(154,143,124,.5)':'rgba(154,143,124,.4)';
if(kind==='puzzle')return done?'#8a6d2f':'#9fd8ff';
if(kind==='boss')return '#a52a3a';
if(kind==='start')return done?'rgba(242,240,234,.4)':'#e6dac4';
if(kind==='sacrifice')return done?'#7e2634':'#a52a3a';
return done?'rgba(242,240,234,.5)':'rgba(242,240,234,.35)';
}
function drawRoomMap(){
if(game.state==='menu'||game.state==='select'||game.state==='won'||game.state==='e404intro'||game.state==='reiintro')return;
const rooms=game.mapRooms;
if(!rooms.length)return;
let minx=0,maxx=0,miny=0,maxy=0;
for(const r of rooms){minx=Math.min(minx,r.gx);maxx=Math.max(maxx,r.gx);miny=Math.min(miny,r.gy);maxy=Math.max(maxy,r.gy);}
const gw=maxx-minx+1,gh=maxy-miny+1;
const MX=26,MY=54;
const cw=Math.min(46,Math.floor(300/gw)),ch=Math.min(34,Math.floor(210/gh));
const MW=gw*cw,MH=gh*ch;
ctx.save();
ctx.fillStyle='rgba(6,4,5,.6)';
ctx.fillRect(MX-10,MY-26,MW+20,MH+66);
ctx.strokeStyle='rgba(242,240,234,.14)';ctx.lineWidth=1;
ctx.strokeRect(MX-10,MY-26,MW+20,MH+66);
const total=rooms.length-(game.extraIdx>=0?1:0)-rooms.filter(r=>r.isolated&&!r.visited).length;
txt('DESCIDA '+roman(game.floor)+' · SALAS '+countCleared()+'/'+total,MX+MW/2,MY-13,MONO,9,'#9c8f7c','center',2);
const cell=i=>({x:MX+(rooms[i].gx-minx)*cw+cw/2,y:MY+(rooms[i].gy-miny)*ch+ch/2});
const vis=rooms.map((r,i)=>r.visited||r.kind==='boss'||rooms.some(o=>o.visited&&Math.abs(o.gx-r.gx)+Math.abs(o.gy-r.gy)===1));
ctx.strokeStyle='rgba(242,240,234,.18)';ctx.lineWidth=1.5;
for(let i=0;i<rooms.length;i++){
if(!vis[i])continue;
const a=cell(i),b=rooms[i].doors.e,b2=rooms[i].doors.s;
if(b>=0&&vis[b]&&!rooms[b].isolated&&!(rooms[b].kind==='secret'&&!rooms[b].visited)){const c=cell(b);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke();}
if(b2>=0&&vis[b2]&&!rooms[b2].isolated&&!(rooms[b2].kind==='secret'&&!rooms[b2].visited)){const c=cell(b2);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke();}
}
if(game.extraIdx>=0){
const src=game.mapRooms.findIndex(r=>r.doors.n===game.extraIdx||r.doors.s===game.extraIdx||r.doors.e===game.extraIdx||r.doors.w===game.extraIdx);
if(src>=0){
const a=cell(src),c=cell(game.extraIdx);
ctx.strokeStyle='rgba(165,42,58,.7)';
ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke();
}
}
for(let i=0;i<rooms.length;i++){
if(!vis[i])continue;
const r=rooms[i],p=cell(i);
/* v1.0.0: salas secretas NÃO existem no mapa até serem descobertas — nem
   desenho, nem "?". A parede rachada é a única pista física. */
/* v1.3.3: a sala secreta ISOLADA aparece no mapa — um recuo solto, sem
   nenhuma linha de ligação, pulsando em roxo: ache-a no mapa */
if(r.kind==='secret'&&!r.visited){
if(!r.isolated)continue;
ctx.save();
ctx.globalAlpha=.5+.5*Math.sin(game.t*5);
ctx.strokeStyle='#9d6bb5';ctx.lineWidth=1.5;
ctx.strokeRect(p.x-9,p.y-7,18,14);
ctx.fillStyle='#9d6bb5';ctx.font='9px IBM Plex Mono';ctx.textAlign='center';
ctx.fillText('?',p.x,p.y+3);
ctx.restore();
continue;
}
const sw=clamp(r.shape.bw/34,13,26),sh=clamp(r.shape.bh/30,10,19);
const cur=i===game.roomIdx,done=r.visited&&r.cleared;
const isBoss=r.kind==='boss';
ctx.strokeStyle=roomKindColor(r.kind,done,r);
ctx.lineWidth=cur?2.5:1.5;
if(!r.visited&&!isBoss)ctx.globalAlpha=.5+.5*Math.sin(game.t*6);
if(cur){ctx.fillStyle='rgba(242,240,234,.16)';ctx.fillRect(p.x-sw/2,p.y-sh/2,sw,sh);}
ctx.strokeRect(p.x-sw/2,p.y-sh/2,sw,sh);
ctx.globalAlpha=1;
if(cur){
ctx.fillStyle='#ffd9a0';
ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillRect(-3,-3,6,6);ctx.restore();
if(game.portal){
ctx.globalAlpha=.6+.4*Math.sin(game.t*5);
ctx.strokeStyle='#c9a0ff';ctx.lineWidth=1.5;
ctx.beginPath();ctx.ellipse(p.x,p.y-9,6,4,0,0,TAU);ctx.stroke();
ctx.globalAlpha=1;
}
}else if(isBoss){
ctx.globalAlpha=.6+.4*Math.sin(game.t*6);
ctx.strokeStyle='#a52a3a';ctx.lineWidth=1.5;
ctx.strokeRect(p.x-5,p.y-5,10,10);
ctx.beginPath();ctx.arc(p.x,p.y-5,5,Math.PI,0);ctx.stroke();
ctx.globalAlpha=1;
}else if(r.kind==='sboss'){
ctx.fillStyle='#ffd9a0';
/* ícones exclusivos dos chefes secretos */
if(r.sbossKind==='e404'){
if(Math.random()>.12){
ctx.save();
ctx.translate(p.x,p.y);
ctx.rotate(rnd(-.06,.06));
ctx.strokeStyle='#4ff5ff';ctx.lineWidth=1.5;
ctx.strokeRect(-6,-6,12,12);
ctx.fillStyle='#ff4fd8';
ctx.fillRect(-6+rnd(-1,1),-6,rnd(4,7),3);
ctx.fillRect(6-rnd(3,6),3,rnd(3,6),3);
ctx.fillStyle=Math.floor(game.t*8)%2?'#ff4fd8':'#f2f0ea';
ctx.font='700 8px '+MONO;ctx.textAlign='center';ctx.textBaseline='middle';
ctx.fillText('404',0,.5);
ctx.restore();
}
}else{
const gl=.7+.3*Math.sin(game.t*4);
ctx.save();
ctx.globalAlpha=gl;
ctx.fillStyle='#ffd9a0';
ctx.beginPath();
ctx.moveTo(p.x-6,p.y+4);ctx.lineTo(p.x-6,p.y-2);ctx.lineTo(p.x-3,p.y+1);
ctx.lineTo(p.x,p.y-5);ctx.lineTo(p.x+3,p.y+1);ctx.lineTo(p.x+6,p.y-2);
ctx.lineTo(p.x+6,p.y+4);ctx.closePath();ctx.fill();
ctx.fillStyle='#a52a3a';
ctx.fillRect(p.x-5,p.y+1.5,10,1.6);
ctx.restore();
}
}else if(r.kind==='treasure'){
ctx.fillStyle='#c9a44c';ctx.fillRect(p.x-5,p.y-4,10,7);
ctx.fillStyle='#6b4a2f';ctx.fillRect(p.x-5,p.y-1,10,4);
}else if(r.kind==='shop'){
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,TAU);ctx.fill();
ctx.strokeStyle='#6b4a2f';ctx.lineWidth=1.5;
ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,TAU);ctx.stroke();
}else if(r.kind==='sacrifice'){
/* v0.9.7: altar de sacrifício — losango vermelho (gota de sangue) */
ctx.fillStyle='#a52a3a';
ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);
ctx.fillRect(-4,-4,8,8);
ctx.restore();
ctx.fillStyle='#d9465a';
ctx.beginPath();ctx.arc(p.x,p.y-3.5,1.6,0,TAU);ctx.fill();
}else if(r.kind==='challenge'){
ctx.strokeStyle='#ff8f3d';ctx.lineWidth=1.5;
ctx.beginPath();ctx.moveTo(p.x-4,p.y-4);ctx.lineTo(p.x+4,p.y+4);ctx.moveTo(p.x+4,p.y-4);ctx.lineTo(p.x-4,p.y+4);ctx.stroke();
}else if(r.kind==='empty'){
ctx.fillStyle='rgba(154,143,124,.6)';
ctx.beginPath();ctx.arc(p.x-3,p.y,1.5,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(p.x+2,p.y+2,1.5,0,TAU);ctx.fill();
}else if(r.kind==='puzzle'){
ctx.strokeStyle='#9fd8ff';ctx.lineWidth=1.5;
ctx.beginPath();ctx.arc(p.x,p.y,4,0,TAU);ctx.stroke();
ctx.beginPath();ctx.arc(p.x,p.y,1,0,TAU);ctx.stroke();
}else if(r.kind==='miniboss'){
ctx.strokeStyle='#e8455a';ctx.lineWidth=1.5;
ctx.beginPath();ctx.arc(p.x,p.y,5,0,TAU);ctx.stroke();
ctx.fillStyle='#e8455a';
ctx.beginPath();ctx.arc(p.x-2,p.y-1,1.6,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(p.x+2,p.y-1,1.6,0,TAU);ctx.fill();
}else if(r.kind==='start'){
ctx.fillStyle='#e6dac4';
ctx.beginPath();ctx.moveTo(p.x,p.y-4);ctx.lineTo(p.x+4,p.y+3);ctx.lineTo(p.x-4,p.y+3);ctx.closePath();ctx.fill();
}else{
ctx.fillStyle='rgba(242,240,234,.35)';
ctx.beginPath();ctx.arc(p.x-3,p.y,1.5,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(p.x+1,p.y+2,1.5,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(p.x+4,p.y-2,1.5,0,TAU);ctx.fill();
}
}
const ny=MY+MH+18;
if(game.portal){
ctx.globalAlpha=.6+.4*Math.sin(game.t*5);
txt('PORTAL ABERTO — DESCIDA '+roman(game.floor+1),MX+MW/2,ny,MONO,9,'#c9a0ff','center',2);
ctx.globalAlpha=1;
}else if(game.extraIdx>=0){
ctx.globalAlpha=.6+.4*Math.sin(game.t*5);
txt('PORTAL DO GUARDIÃO ABERTO',MX+MW/2,ny,MONO,9,'#e8455a','center',2);
ctx.globalAlpha=1;
}
ctx.restore();
}
function drawHeartRow(){
/* v0.9.4: barra de vida de 100 HP substitui os corações */
const bx=36,by=H-52,bw=220,bh=18;
/* fundo */
ctx.fillStyle='rgba(20,12,14,0.85)';
ctx.fillRect(bx-2,by-2,bw+4,bh+4);
ctx.fillStyle='#1a0e10';
ctx.fillRect(bx,by,bw,bh);
/* preenchimento — cor muda com HP */
const hpc=clamp(player.hp/player.maxHp,0,1);
let barCol='#d9465a';
if(hpc<.3)barCol='#ff3030';
else if(hpc<.6)barCol='#d9465a';
else barCol='#3a8a4f';
ctx.fillStyle=barCol;
ctx.fillRect(bx,by,bw*hpc,bh);
/* brilho superior */
ctx.fillStyle='rgba(255,255,255,0.15)';
ctx.fillRect(bx,by,bw*hpc,bh*.4);
/* borda */
ctx.strokeStyle='#3a2a2e';ctx.lineWidth=1.5;
ctx.strokeRect(bx,by,bw,bh);
/* texto HP */
txt(Math.ceil(player.hp)+' / '+player.maxHp,bx+bw/2,by+bh/2,MONO,10,'#e6dac4','center',1);
/* animação de dano — flash */
if(heartsPopT>0){
  ctx.fillStyle='rgba(255,80,80,'+(heartsPopT*.4)+')';
  ctx.fillRect(bx,by,bw,bh);
}
}
function drawDashGauge(){
const cdMax=DASH_CD*P.dashCdMult;
const frac=1-clamp(player.dashCd/cdMax,0,1);
ctx.strokeStyle='#3a2f28';ctx.lineWidth=1;
ctx.strokeRect(36,H-19,64,5);
ctx.fillStyle=frac>=1?'#e6dac4':'#8a7d6c';
ctx.fillRect(37,H-18,62*frac,3);
/* v1.4.6: a dica do desvio ensina o toque duplo e o foco */
txt(game.hasParry
?'DESVIO: 2× A DIREÇÃO · FOCO: SEGURE SHIFT · PARRY: GOLPEIE OS TIROS DE PERTO'
:'DESVIO: 2× A DIREÇÃO · FOCO: SEGURE SHIFT',106,H-16,MONO,9,'#6e6357','left',1);
if(P.chainsaw){
const f=1-clamp(player.sawThrowCd/3.2,0,1);
ctx.strokeStyle='#3a2f28';ctx.lineWidth=1;
ctx.strokeRect(36,H-27,64,4);
ctx.fillStyle=f>=1?'#c9a44c':'#6e6357';
ctx.fillRect(37,H-26,62*f,2);
txt('LANÇAR SERRA = CLIQUE DIREITO',106,H-24,MONO,8,'#6e6357','left',1);
}
/* ==== Item Ativo — gauge no canto inferior esquerdo do canvas ==== */
if(game.activeItem){
const item=ACTIVE_ITEMS[game.activeItem];
const af=1-clamp((game.activeCd||0)/(item.cd||8),0,1);
ctx.strokeStyle='#3a2f28';ctx.lineWidth=1;
ctx.strokeRect(36,H-35,64,4);
ctx.fillStyle=af>=1?'#ffd9a0':'#7e6ab8';
ctx.fillRect(37,H-34,62*af,2);
const activeKey=keyLabel(keybinds.active[0]);
txt(item.name+' ['+activeKey+']',106,H-32,MONO,7,af>=1?'#ffd9a0':'#6e6357','left',1);
}
/* ==== efeitos visuais temporários dos itens ativos ==== */
if(game.estrelaT>0){
  /* aura dourada ao redor de Thor */
  const ea=.3+.15*Math.sin(game.t*8);
  const eg=ctx.createRadialGradient(player.x,player.y,10,player.x,player.y,80);
  eg.addColorStop(0,'rgba(255,217,160,'+ea+')');
  eg.addColorStop(1,'rgba(255,217,160,0)');
  ctx.fillStyle=eg;
  ctx.beginPath();ctx.arc(player.x,player.y,80,0,TAU);ctx.fill();
  /* dano de aura aos inimigos próximos */
  if(Math.random()<.1){
    for(const e of enemies){
      if(e.dead)continue;
      if(dist(player.x,player.y,e.x,e.y)<80){
        if(!shadowInvuln(e)){e.hp-=5*P.dmgMult;e.flash=.1;if(e.hp<=0)killEnemy(e);}
      }
    }
  }
}
if(game.furiaT>0){
  /* aura vermelha ao redor de Thor */
  const fa=.2+.15*Math.sin(game.t*10);
  ctx.fillStyle='rgba(255,80,80,'+fa+')';
  ctx.beginPath();ctx.arc(player.x,player.y,40,0,TAU);ctx.fill();
}
/* ==== v0.9.16: visuais dos novos ativos ==== */
if(game.transfT>0){
  /* FORMA DA FERA — pelagem vermelha pulsante + olhos brilhantes */
  const ta=.3+.2*Math.sin(game.t*12);
  ctx.fillStyle='rgba(255,60,60,'+ta+')';
  ctx.beginPath();ctx.arc(player.x,player.y,34+Math.sin(game.t*9)*4,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,90,90,'+(.5+.3*Math.sin(game.t*10))+')';
  ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(player.x,player.y,40,0,TAU);ctx.stroke();
  if(Math.random()<.3)particles.push({x:player.x+rnd(-12,12),y:player.y+rnd(-12,12),vx:rnd(-20,20),vy:rnd(-40,-10),life:.4,t:0,r:rnd(1.5,3),c:'#ff4f4f',drag:1,glow:true});
}
if(game.shieldHits>0){
  /* ÉGIDE — anéis dourados = golpes restantes */
  const sa=.4+.2*Math.sin(game.t*5);
  for(let k=0;k<game.shieldHits;k++){
    ctx.strokeStyle='rgba(255,217,160,'+(sa-k*.1)+')';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(player.x,player.y,20+k*7+Math.sin(game.t*4+k)*1.5,0,TAU);ctx.stroke();
  }
}
if(game.slowMoT>0){
  /* AMPULHETA — vinheta violeta no mundo */
  ctx.fillStyle='rgba(157,107,181,'+(.06+.03*Math.sin(game.t*3))+')';
  ctx.fillRect(0,0,W,H);
}
if(game.etShotT>0){
  /* MUNIÇÃO ÉTERICA — brilho ciano sob thor */
  ctx.fillStyle='rgba(79,245,255,'+(.14+.06*Math.sin(game.t*7))+')';
  ctx.beginPath();ctx.arc(player.x,player.y,26,0,TAU);ctx.fill();
}
}
function drawBossBar(){
/* v1.5.6: a barra dorme com o antigo — enquanto barT=0 (pó / intro), nada
   de barra vazia pendurada no topo da tela */
if(boss.barT<=0)return;
const t=smooth(boss.barT);
const y=40*t;
const total=640,x0=W/2-total/2,h=13,gap=14,segW=(total-2*gap)/3;
for(let i=0;i<boss.heads.length;i++){
const hdata=boss.heads[i];
const x=x0+i*(segW+gap);
ctx.strokeStyle='rgba(230,218,196,0.5)';ctx.lineWidth=1;
ctx.strokeRect(x,y,segW,h);
if(hdata.alive){
ctx.globalAlpha=.9;ctx.fillStyle=hdata.c;
ctx.fillRect(x+1.5,y+1.5,Math.max(0,(segW-3)*hdata.hp/hdata.maxHp),h-3);
ctx.globalAlpha=1;
}else{
ctx.fillStyle='#221a20';ctx.fillRect(x+1.5,y+1.5,segW-3,h-3);
ctx.strokeStyle='#57504e';ctx.lineWidth=1.5;
ctx.beginPath();ctx.moveTo(x+3,y+h-3);ctx.lineTo(x+segW-3,y+3);ctx.stroke();
}
txt(hdata.name,x+segW/2,y-11,MONO,10,hdata.alive?hdata.c:'#5c5450','center',3);
}
if(boss.phase2){
txt('FASE II — FÚRIA',W/2,y+24,MONO,10,Math.floor(game.t*8)%2?'#e8455a':'#e6dac4','center',5);
}
if(boss.frenzyActive){
const left=1-clamp(boss.frenzyT/frenzyDur(),0,1);
const fy=y+(boss.phase2?40:24);
txt('FRENESI',W/2,fy-8,MONO,10,Math.floor(game.t*8)%2?'#e8455a':'#e6dac4','center',5);
ctx.strokeStyle='rgba(232,69,90,0.6)';ctx.lineWidth=1;
ctx.strokeRect(W/2-160,fy,320,6);
ctx.fillStyle='#e8455a';
ctx.fillRect(W/2-159,fy+1,318*left,4);
}
}
function drawMiniBossBar(){
const mb=miniBossAny();
if(!mb)return;
const total=460,x0=W/2-total/2,y=38,h=12;
txt(miniDisplayName(mb.type,mb.kaizo,mb._neo)||'MINI-CHEFE',W/2,y-12,MONO,10,miniDisplayColor(mb.type,mb.kaizo,mb._neo),'center',4);
ctx.strokeStyle='rgba(207,216,220,0.5)';ctx.lineWidth=1;
ctx.strokeRect(x0,y,total,h);
ctx.fillStyle=MINI_COLORS[mb.type]||'#cfd8dc';
ctx.fillRect(x0+1.5,y+1.5,Math.max(0,(total-3)*mb.hp/mb.maxHp),h-3);
}
function drawReiBar(){
const r=reiAny();
if(!r)return;
const total=560,x0=W/2-total/2,y=38,h=12;
txt(r.p2?'O VELHO REI — ESPELHOS DAS SOMBRAS':'O VELHO REI DO XADREZ',W/2,y-12,MONO,10,r.p2?'#d8cfc0':'#ffd9a0','center',3);
ctx.strokeStyle='rgba(255,217,160,0.6)';ctx.lineWidth=1;
ctx.strokeRect(x0,y,total,h);
ctx.fillStyle=r.p2?'#d8cfc0':'#ffd9a0';
ctx.fillRect(x0+1.5,y+1.5,Math.max(0,(total-3)*r.hp/r.maxHp),h-3);
if(r.p2&&!game.rkUlt){
const left=clamp(game.rkUltT/40,0,1);
const fy=y+22;
txt('XEQUE-MATE EM '+Math.ceil(game.rkUltT)+'s',W/2,fy-7,MONO,10,Math.floor(game.t*4)%2?'#d9465a':'#ffd9a0','center',4);
ctx.strokeStyle='rgba(217,70,90,.6)';ctx.lineWidth=1;
ctx.strokeRect(W/2-140,fy,280,5);
ctx.fillStyle='#d9465a';
ctx.fillRect(W/2-139,fy+1,278*left,3);
}
}
function drawE404Bar(){
const e4=e404Any();
if(!e4)return;
const total=700,x0=W/2-total/2,y=38,h=13;
txt('ERRO 404 — A SALA QUE NÃO EXISTE',W/2,y-12,MONO,11,Math.floor(game.t*4)%2?'#ff4fd8':'#4ff5ff','center',4);
ctx.strokeStyle='rgba(242,240,234,0.6)';ctx.lineWidth=1;
ctx.strokeRect(x0,y,total,h);
ctx.fillStyle=Math.floor(game.t*4)%2?'#ff4fd8':'#4ff5ff';
ctx.fillRect(x0+1.5,y+1.5,Math.max(0,(total-3)*e4.hp/e4.maxHp),h-3);
}
/* v0.9.7: barra de vida do Observador */
function observerAny(){return enemies.find(function(e){return e.type==='observer'&&!e.dead;});}
function drawObserverBar(){
const o=observerAny();
if(!o)return;
const total=700,x0=W/2-total/2,y=38,h=13;
txt('O OBSERVADOR — ELE VÊ TUDO',W/2,y-12,MONO,11,Math.floor(game.t*4)%2?'#ff4fd8':'#a52a3a','center',4);
ctx.strokeStyle='rgba(165,42,58,0.7)';ctx.lineWidth=1;
ctx.strokeRect(x0,y,total,h);
ctx.fillStyle=Math.floor(game.t*4)%2?'#ff4fd8':'#a52a3a';
ctx.fillRect(x0+1.5,y+1.5,Math.max(0,(total-3)*o.hp/o.maxHp),h-3);
}
function drawKnightBar(){
const k=knightAny();
if(!k)return;
const kd=KNIGHT_DATA[k.type];if(!kd)return;
const total=660,x0=W/2-total/2,y=38,h=13;
const phaseLbl=k.p2?' — FASE II · '+kd.concept:' — '+kd.concept+(k.horseHp>0?' · CAVALO':'');
txt(kd.name+phaseLbl+(k.triunfo?' · TRIUNFO '+Math.ceil(k.triumphT)+'s':''),W/2,y-12,MONO,11,kd.col,'center',4);
ctx.strokeStyle=kd.accent;ctx.lineWidth=1;
ctx.strokeRect(x0,y,total,h);
ctx.fillStyle=kd.col;
ctx.fillRect(x0+1.5,y+1.5,Math.max(0,(total-3)*k.hp/k.maxHp),h-3);
/* se montado: barra extra do cavalo */
if(!k.p2&&k.horseMaxHp>0){
const hy=y+22;
txt('CAVALO',W/2-hy,y-12,MONO,9,kd.accent,'center',3);
ctx.strokeStyle='rgba(140,28,44,.5)';ctx.lineWidth=1;
ctx.strokeRect(x0+60,hy,total-120,5);
ctx.fillStyle=kd.accent;
ctx.fillRect(x0+61,hy+1,Math.max(0,(total-122)*k.horseHp/k.horseMaxHp),3);
}
/* Triunfo: barra de progresso da condição especial */
if(k.triunfo){
const ty=y+(k.p2?0:22)+12;
const left=clamp(game.knightHeartsCollected/Math.max(1,game.knightHeartsNeeded),0,1);
const tleft=clamp(k.triumphT/(k.type==='cw1'?60:k.type==='cw2'?45:k.type==='cw3'?30:25),0,1);
const lbl={cw1:'CORAÇÕES',cw2:'ARMAS QUEBRADAS',cw3:'SOBREVIVENDO',cw4:'GOLPES'}[k.type];
txt(lbl+' '+game.knightHeartsCollected+'/'+game.knightHeartsNeeded,W/2,ty-12,MONO,9,kd.accent,'center',3);
ctx.strokeStyle='rgba(201,164,76,.5)';ctx.lineWidth=1;
ctx.strokeRect(W/2-160,ty,320,5);
ctx.fillStyle=kd.accent;
ctx.fillRect(W/2-159,ty+1,318*left,3);
/* tempo */
txt('TEMPO '+Math.ceil(k.triumphT)+'s',W/2,ty+12,MONO,9,'#d9465a','center',3);
ctx.strokeStyle='rgba(217,70,90,.5)';ctx.lineWidth=1;
ctx.strokeRect(W/2-160,ty+22,320,4);
ctx.fillStyle='#d9465a';
ctx.fillRect(W/2-159,ty+23,318*tleft,2);
}
}
function drawHUD(){
if(game.state==='menu'||game.state==='select'||game.state==='won')return;
drawRoomMap();
drawHeartRow();
drawDashGauge();
/* v0.9.4: aviso de HP baixo — borda vermelha pulsante na tela */
if(player.hp>0&&player.hp/player.maxHp<.3&&game.state==='play'){
  const pulse=.15+.1*Math.sin(game.t*6);
  const lg=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.6);
  lg.addColorStop(0,'rgba(200,30,30,0)');
  lg.addColorStop(1,'rgba(200,30,30,'+pulse+')');
  ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);
}
if(game.state==='ending')return;
const bx=80,bw=W-160,by=14;
if(boss.active&&game.state==='play'&&boss.barT>0){ /* v1.5.6: o pó não mostra barra */
txt('CERBERUS — O GUARDIÃO DA PASSAGEM'+(boss.phase2?' · FASE II':''),W/2,by+2,MONO,11,'#a52a3a','center',3); /* v1.5.7: o nome da apresentação */
drawBossBar();
}else if(game.mapRooms.length){
txt('DESCIDA '+roman(game.floor)+'/V — '+(game.hard?'ABISMO':'PADRÃO')+' · SEGREDOS '+Math.round(opts.secret*100)+'%',W/2,by+2,MONO,10,game.hard?'#d9465a':'#8a7d6c','center',2);
if(e404Any())drawE404Bar();
else if(observerAny())drawObserverBar();
else if(reiAny())drawReiBar();
else if(knightAny())drawKnightBar();
else if(miniBossAny())drawMiniBossBar();
else if(game.roomEvent)txt('EVENTO: '+EVENT_LABEL[game.roomEvent.type],W/2,by+20,MONO,10,'#c9a0ff','center',2);
else txt('DEMÔNIOS '+enemyCount(),W/2,by+20,MONO,10,'#6e6357','center',2);
}
const parts=[];
if(game.hasShot)parts.push('TIRO');
if(game.hasBite)parts.push('MORDIDA');
if(P.chainsaw)parts.push('MOTOSERRA');
if(P.sword)parts.push('GRAM');
if(P.nova)parts.push('NOVA');
if(P.stakes)parts.push('ESTACAS');
if(P.burst)parts.push('EXPLOSÃO');
if(P.explShot)parts.push('SÍSMICA');
if(P.shock)parts.push('ONDA');
if(P.dark)parts.push('TREVAS');
if(P.light)parts.push('LUZ');
if(game.kingsoul)parts.push('ALMA DO REI');
txt(parts.join(' + '),W-24,H-38,MONO,9,'#9c8f7c','right',1);
txt('ALMAS '+game.souls,W-24,H-18,MONO,12,'#6e6357','right',1);
/* v1.0.0: contador de fagulhas (esquerda) — o jogador precisa saber quantas
tem antes de gastar uma na parede rachada */
if(game.fagulha>0)txt('FAGULHAS ×'+game.fagulha+'  [Q]',24,H-18,MONO,11,'#ff8f3d','left',1);
const elems=ownedElems();
for(let i=0;i<elems.length;i++){
ctx.fillStyle=ELEM_DATA[elems[i]].c;
ctx.beginPath();ctx.arc(W-160+i*14,H-52,4,0,TAU);ctx.fill();
}
if(game.dev){
ctx.save();
ctx.globalAlpha=.85;
txt('◆ PENUMBRA'+(game.god?' · DEUS ON':'')+' · [B] livro · [0] testes',W/2,H-64,MONO,9,'#ffd9a0','center',3);
ctx.restore();
}
}
function drawBanner(b){
const a=ramp(b.t,0,.25)*(1-ramp(b.t,b.dur-.5,b.dur));
ctx.globalAlpha=a;
if(b.type==='trophy'){
/* v0.9.16: TROFÉU — notificação dourada de conquista, distinta das comuns */
const cy=H*.19;
ctx.save();
/* brilho pulsante */
const glow=.5+.5*Math.sin(game.t*6);
ctx.globalAlpha=a*.35*glow;
const grd=ctx.createRadialGradient(W/2,cy,10,W/2,cy,190);
grd.addColorStop(0,'rgba(255,217,160,.8)');grd.addColorStop(1,'rgba(255,217,160,0)');
ctx.fillStyle=grd;ctx.fillRect(W/2-200,cy-70,400,140);
/* medalha */
ctx.globalAlpha=a;
ctx.translate(W/2,cy-26);ctx.rotate(Math.sin(game.t*2)*.08);
ctx.fillStyle='#ffd9a0';
ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();
ctx.fillStyle='#a52a3a';
ctx.beginPath();ctx.arc(0,0,9.5,0,TAU);ctx.fill();
ctx.fillStyle='#ffd9a0';
ctx.font='bold 11px IBM Plex Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';
ctx.fillText('★',0,1);
ctx.restore();
ctx.globalAlpha=a;
txt('CONQUISTA DESBLOQUEADA',W/2,cy+6,MONO,10,'#ffd9a0','center',6);
txt(b.txt,W/2,cy+28,DISP,30,'#e6dac4','center',5);
if(b.sub)txt(b.sub,W/2,cy+50,MONO,11,'#9c8f7c','center',3);
ctx.globalAlpha=1;
return;
}
if(b.type==='circle'){
txt(b.txt,W/2,H*.27,MONO,15,'#a52a3a','center',8);
txt(b.name,W/2,H*.33,DISP,74,'#e6dac4');
ctx.strokeStyle='#a52a3a';ctx.lineWidth=1;
ctx.beginPath();
ctx.moveTo(W/2-170,H*.33+44);ctx.lineTo(W/2-16,H*.33+44);
ctx.moveTo(W/2+16,H*.33+44);ctx.lineTo(W/2+170,H*.33+44);
ctx.stroke();
ctx.save();ctx.translate(W/2,H*.33+44);ctx.rotate(Math.PI/4);
ctx.fillStyle='#a52a3a';ctx.fillRect(-3.5,-3.5,7,7);ctx.restore();
if(b.sub)txt(b.sub,W/2,H*.33+64,MONO,13,'#9c8f7c','center',4);
}else if(b.type==='boss'){
txt('CUIDADO',W/2,H*.27,MONO,13,'#a52a3a','center',8);
txt(b.txt,W/2,H*.33,DISP,54,'#e6dac4');
if(b.sub)txt(b.sub,W/2,H*.33+38,MONO,13,'#9c8f7c','center',4);
}else{
txt(b.txt,W/2,H*.31,DISP,b.type==='small'?44:54,'#e6dac4');
if(b.sub)txt(b.sub,W/2,H*.31+38,MONO,13,'#9c8f7c','center',4);
}
ctx.globalAlpha=1;
}
function drawBanners(){
if(game.banner)drawBanner(game.banner);
if(game.headBanner){
const b=game.headBanner;
const a=ramp(b.t,0,.15)*(1-ramp(b.t,1.5,1.9));
ctx.globalAlpha=a;
txt(b.txt,W/2,H*.3,DISP,56,b.c);
ctx.globalAlpha=1;
}
if(game.state==='bossintro')drawBossIntroTexts();
}
function drawEndingUI(){
if(game.state!=='ending')return;
const t=game.endT;
if(game.endPhase==='dialog'){
ctx.fillStyle='rgba(5,3,4,.45)';
ctx.fillRect(0,0,W,H);
const li=Math.min(END_LINES.length-1,Math.floor(t/3.8));
const tl=t-li*3.8;
const line=END_LINES[li];
const n=Math.floor(clamp(tl/1.6,0,1)*line.length);
const a=ramp(tl,.15,.5)*(1-ramp(tl,3.45,3.8));
ctx.globalAlpha=a;
txt('CÉRBERO',W/2+rnd(-1.2,1.2),H*.55,MONO,12,'#a52a3a','center',7);
txt(line.slice(0,n),W/2,H*.62,MONO,17,'#e6dac4','center',1);
ctx.globalAlpha=1;
}else if(game.endPhase==='gate'&&t>2.1){
ctx.globalAlpha=.5+.35*Math.sin(game.t*4);
txt('mova thor até a escada',W/2,H*.9,MONO,12,'#9c8f7c','center',4);
ctx.globalAlpha=1;
}else if(game.endPhase==='pool'||game.endPhase==='drown'){
/* v0.9.13: a POÇA do fim do Limbo — "afoga-se" */
if(game.endPool){
const px2=game.endPool.x,py2=game.endPool.y;
const pulse=1+.06*Math.sin(game.t*3);
const rw=95*pulse,rh=30*pulse;
const g2=ctx.createRadialGradient(px2,py2,4,px2,py2,rw);
g2.addColorStop(0,'rgba(24,58,74,.95)');g2.addColorStop(.7,'rgba(14,34,46,.85)');g2.addColorStop(1,'rgba(10,22,32,0)');
ctx.fillStyle=g2;
ctx.beginPath();ctx.ellipse(px2,py2,rw,rh,0,0,TAU);ctx.fill();
for(let i2=0;i2<3;i2++){
const k2=((game.t*.45+i2/3)%1);
ctx.globalAlpha=(1-k2)*.5;
ctx.strokeStyle='rgba(150,200,215,.6)';ctx.lineWidth=1;
ctx.beginPath();ctx.ellipse(px2,py2,rw*k2,rh*k2,0,0,TAU);ctx.stroke();
}
ctx.globalAlpha=1;
ctx.strokeStyle='rgba(140,190,205,'+(.4+.2*Math.sin(game.t*2.4))+')';ctx.lineWidth=1.5;
ctx.beginPath();ctx.ellipse(px2,py2,rw*.72,rh*.72,0,0,TAU);ctx.stroke();
txt('afoga-se',px2,py2-58,DISP,26,'#bfd8e8','center',5);
}
if(game.endPhase==='pool'&&game.endT>.8){
ctx.globalAlpha=.5+.35*Math.sin(game.t*4);
txt('entre na poça',W/2,H*.9,MONO,12,'#9c8f7c','center',4);
ctx.globalAlpha=1;
}
if(game.endPhase==='drown'){
const k3=clamp(game.endT/2.4,0,1);
ctx.fillStyle='rgba(8,20,30,'+(k3*.85)+')';
ctx.fillRect(0,0,W,H);
}
}else if(game.endPhase==='closed'&&t>.9){
ctx.globalAlpha=ramp(t,.9,1.7);
txt('a descida continua — o corredor azul espera.',W/2,H*.46,MONO,13,'#9c8f7c','center',4);
ctx.globalAlpha=1;
}
}
/* ============ render principal ============ */
function drawWorld(g){
/* v1.5.0: o MUNDO inteiro (sala, portas, corpos, balas, textos) desenha em
   coordenadas de mundo — a câmera é aplicada fora, uma única vez. */
/* == Falso Paraíso: o exterior da sala é um campo infinito == */
if(isParadiseFloor()&&!ROOM.inverted){
  drawParadiseOutside();
}
if(roomFloor)g.drawImage(roomFloor,ROOM.x,ROOM.y);
drawGroundEmbers();
drawInfernalFires(); /* v1.3.5: borda tremulando + fogo fora do cenário */
if(window.__EXPANSION)window.__EXPANSION.drawFloor(); /* v1.3.0: zonas/trilhas/lava */
drawPenumbra();
drawDecor();
drawParadiseWalls();
drawTutorial();
if(game.state==='bossintro')drawHellGate();
if(game.state==='ending'&&game.endPhase!=='dialog'&&game.endPhase!=='dust'&&game.endPhase!=='soul'&&game.endPhase!=='bless'&&game.endPhase!=='pool'&&game.endPhase!=='drown'){
/* v1.5.4: no fim NÃO existe mais portão do inferno — a SEGUNDA DESCIDA */
drawDescentStairE();
}
drawDoors();
drawGeyserMarks();
drawSpawnMarks();
drawPortal();
drawRoomWindow();
drawSacrificeAltar();
drawPuzzle();
drawRings();
drawShock();
/* v0.9.16: telegráficos KAIZO/ativos + minions espirituais */
drawTelegraphs();
drawActMinions();
if(boss.active&&!boss.introLock){
for(const h of boss.heads){
if(!h.alive||h.state!=='tele')continue;
if(h.pattern==='charge'||h.pattern==='snipe'||h.pattern==='pounce'){
const a=h.pattern==='charge'?boss.chargeAim:Math.atan2(player.y-h.hy,player.x-h.hx);
const p=.5+.5*Math.sin(game.t*16);
g.strokeStyle='rgba(232,69,90,'+(.3+.3*p)+')';g.lineWidth=3;
g.setLineDash([14,10]);
g.beginPath();g.moveTo(h.hx,h.hy);
g.lineTo(h.hx+Math.cos(a)*1000,h.hy+Math.sin(a)*1000);
g.stroke();g.setLineDash([]);
}
}
}
drawPickups();
drawShop();
drawDarkSoul();
drawBoss();
for(const e of enemies)drawEnemy(e);
drawPlayer();
drawPistols();/* v1.2.0 */
if(window.__EXPANSION&&window.__EXPANSION.drawColher)window.__EXPANSION.drawColher();/* v1.3.4: a colher gigante na pata (parada/carga/colherada) */
if(window.__RM&&window.__RM.drawOver)window.__RM.drawOver();/* v1.4.0: órbitas, pato, cópia, canhão, CÉRBERO — A SENTENÇA FINAL */
drawChainsaw();
drawThrownSaw();
drawDarkOrbs();
drawLightBeam();
for(const h of hammers)drawHammer(h);
drawSwords();
drawNovas();
drawStakes();
drawBites();
drawBullets();
drawVapers();drawBeamShots();drawBeamCharge();/* v1.0.0: vapor/feixe */
drawArcs();
drawEBullets();
drawBolts();
drawParticles();
drawTexts();
drawRoomEventFx();
}

function render(){
ctx.setTransform(view.dpr,0,0,view.dpr,0,0);
ctx.fillStyle='#050304';ctx.fillRect(0,0,innerWidth,innerHeight);
const sh=opts.shake?game.shake:0;
ctx.save();
ctx.translate(view.ox+rnd(-1,1)*sh,view.oy+rnd(-1,1)*sh);
ctx.scale(view.s,view.s);
if(game.state==='e404intro'){
if(roomFloor)ctx.drawImage(roomFloor,ROOM.x,ROOM.y);
drawParticles();
drawE404Intro();
ctx.restore();
return;
}
if(game.state==='schoolintro'){SCHOOL_drawIntro();ctx.restore();return;}
if(game.state==='school'){SCHOOL_draw();ctx.restore();return;}
if(game.state==='castleintro'){CASTELLO_drawIntro();ctx.restore();return;} /* v0.9.10 */
if(game.state==='castle'){CASTELLO_draw();ctx.restore();return;} /* v0.9.10 */
if(game.state==='corridor'){
drawCorridor();
ctx.restore();
return;
}
/* v1.3.0: estados da expansão */
if(game.state==='gatepath'&&window.__EXPANSION){window.__EXPANSION.drawGatePath();ctx.restore();return;}
if(game.state==='cerbintro'&&window.__EXPANSION){window.__EXPANSION.drawCerbIntro();if(window.__EXPANSION.drawCerbCard)window.__EXPANSION.drawCerbCard(); /* v1.5.7: a apresentação POR CIMA da cena */ctx.restore();return;}
if(game.state==='bluecorr'&&window.__EXPANSION){window.__EXPANSION.drawBlueCorr();ctx.restore();return;}
if(game.state==='juizintro'){if(roomFloor)ctx.drawImage(roomFloor,ROOM.x,ROOM.y);drawParticles();if(window.__EXPANSION)window.__EXPANSION.drawJuizIntro();ctx.restore();return;}
if(game.state==='limboload'){
drawLimboLoad();
ctx.restore();
return;
}
if(game.state==='caronte'){
drawCaronteScene();
ctx.restore();
return;
}
if(game.state==='boatride'){
drawBoatride();
ctx.restore();
return;
}
if(game.state==='carontefight'){
drawCaronteFight();
ctx.restore();
return;
}
if(game.state==='reiintro'){
if(roomFloor)ctx.drawImage(roomFloor,ROOM.x,ROOM.y);
drawParticles();
drawReiIntro();
ctx.restore();
return;
}
if(game.state==='knightintro'){
if(roomFloor)ctx.drawImage(roomFloor,ROOM.x,ROOM.y);
drawParticles();
drawKnightIntro();
ctx.restore();
return;
}
/* v1.5.0: TRANSIÇÃO DESLIZANTE — sala antiga saindo + sala nova entrando */
if(game.slide){
const k=clamp(game.slide.t/game.slide.dur,0,1);
const e=1-Math.pow(1-k,3);
const SO=slideOff(game.slide.dir);
ctx.fillStyle='#040304';ctx.fillRect(0,0,W,H);
ctx.drawImage(snapCv,-SO[0]*e,-SO[1]*e);
ctx.save();
ctx.translate(SO[0]*(1-e),SO[1]*(1-e));
ctx.translate(-game.camX,-game.camY);
drawWorld(ctx);
ctx.restore();
ctx.restore();
drawHUD();drawBanners();
return;
}
/* v1.5.0: APRESENTAÇÃO VS — o mundo parado por trás, o confronto por cima */
if(game.state==='vsintro'&&game._vs){
ctx.save();
ctx.translate(-game.camX,-game.camY);
drawWorld(ctx);
ctx.restore();
drawVS();
ctx.restore();
drawHUD();
return;
}
ctx.fillStyle='#040304';ctx.fillRect(0,0,W,H);
/* v1.5.0: CÂMERA — o mundo desloca; HUD/vinheta/efeitos de tela ficam fixos */
ctx.save();
ctx.translate(-game.camX,-game.camY);
drawWorld(ctx);
ctx.restore();
if(window.__GRI)window.__GRI.drawWorld(ctx,-game.camX,-game.camY); /* v1.9.0: feixes, marcas, lente, luz e Magika por cima do mundo */
drawE404Glitch(); /* glitch de tela — espaço de tela, fora da câmera */
drawReiUltimate();
if(game.state==='dead')drawDeadFace();
if(game.state==='builder')drawBuilderUI();
ctx.drawImage(vignette,0,0);
if(game.hurtV>0){
const g=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.62);
g.addColorStop(0,'rgba(164,32,48,0)');
g.addColorStop(1,'rgba(164,32,48,'+(game.hurtV*.4)+')');
ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
if(game.flash>0){ctx.fillStyle='rgba(255,244,230,'+game.flash+')';ctx.fillRect(0,0,W,H);}
/* ==== v0.9.1: O MUNDO — overlay visual quando o tempo está parado ==== */
if(game.worldT>0){
  /* tinta amarelo-alaranjada pulsante cobrindo a tela */
  const wa=clamp(game.worldT/(game.worldDur||3),0,1);
  ctx.fillStyle='rgba(255,217,160,'+(0.08+0.05*Math.sin(game.t*8))+')';
  ctx.fillRect(0,0,W,H);
  /* borda dourada pulsante */
  ctx.strokeStyle='rgba(255,217,160,'+(0.5*wa)+')';
  ctx.lineWidth=8;
  ctx.strokeRect(4,4,W-8,H-8);
  /* texto no topo */
  ctx.globalAlpha=wa;
  txt('O MUNDO · '+game.worldT.toFixed(1)+'s',W/2,28,MONO,14,'#ffd9a0','center',3);
  ctx.globalAlpha=1;
}
/* v0.9.16: AMPULHETA — tempo dilatado, HUD violeta (jogo nunca para de rodar) */
if(game.slowMoT>0&&game.worldT<=0){
  const sa=clamp(game.slowMoT/(game.slowMoDur||6),0,1);
  ctx.fillStyle='rgba(157,107,181,'+(0.05+0.03*Math.sin(game.t*4))+')';
  ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(201,160,255,'+(0.4*sa)+')';
  ctx.lineWidth=6;
  ctx.strokeRect(4,4,W-8,H-8);
  ctx.globalAlpha=sa;
  txt('O TEMPO DILA · '+game.slowMoT.toFixed(1)+'s',W/2,28,MONO,13,'#c9a0ff','center',3);
  ctx.globalAlpha=1;
}
/* v0.9.5: tremor na alma — fumaça negra + mensagem */
if(game.soulTremor>0){
  const sa=clamp(game.soulTremor/4,0,1);
  /* fumaça negra cobrindo a tela */
  ctx.fillStyle='rgba(10,5,15,'+(0.3*sa)+')';
  ctx.fillRect(0,0,W,H);
  /* texto central */
  ctx.globalAlpha=sa*clamp((4-game.soulTremor)*2,0,1);
  txt('você sente um certo tremor em sua alma,',W/2,H*.42,MONO,14,'#9d6bb5','center',2);
  txt('sem que ao menos soubesse, algo lhe ajuda...',W/2,H*.48,MONO,14,'#c9a0ff','center',2);
  ctx.globalAlpha=1;
  /* partículas de fumaça extras */
  if(Math.random()<.3){
    particles.push({x:rnd(0,W),y:H+10,vx:rnd(-8,8),vy:rnd(-20,-5),life:rnd(2,4),t:0,r:rnd(4,10),c:'rgba(15,8,18,0.4)',drag:.98,glow:false});
  }
}
drawHUD();
drawBanners();
drawEndingUI();
if(game.state==='reideath')drawReiDeathUI();
if(game.state==='knightdeath')drawKnightDeathUI();
drawWindowScene();
/* v0.9.8: O OBSERVADOR — modo inferno com chão de olhos + mensagem spam */
if(game.hellMode){
  /* tinta vermelho-sangue carmesim escuro sobre tudo — sensação de terror */
  const hg=ctx.createRadialGradient(W/2,H/2,50,W/2,H/2,W*.8);
  hg.addColorStop(0,'rgba(100,0,0,0.45)');
  hg.addColorStop(.4,'rgba(60,0,0,0.5)');
  hg.addColorStop(.7,'rgba(30,0,0,0.55)');
  hg.addColorStop(1,'rgba(10,0,0,0.65)');
  ctx.fillStyle=hg;
  ctx.fillRect(0,0,W,H);

  /* chão de carne viva — textura vermelho carmesim misturado com preto */
  ctx.globalAlpha=.15;
  for(let i=0;i<40;i++){
    const tx=rnd(0,W),ty=rnd(0,H),tr=rnd(30,90);
    const tg=ctx.createRadialGradient(tx,ty,1,tx,ty,tr);
    const shade=Math.random();
    if(shade<.4){
      tg.addColorStop(0,'rgba(80,0,0,0.6)');
      tg.addColorStop(1,'rgba(20,0,0,0)');
    }else if(shade<.7){
      tg.addColorStop(0,'rgba(120,10,10,0.4)');
      tg.addColorStop(1,'rgba(40,0,0,0)');
    }else{
      tg.addColorStop(0,'rgba(40,0,0,0.5)');
      tg.addColorStop(1,'rgba(10,0,0,0)');
    }
    ctx.fillStyle=tg;
    ctx.beginPath();ctx.arc(tx,ty,tr,0,TAU);ctx.fill();
  }
  ctx.globalAlpha=1;

  /* chão de olhos — grid de olhos realistas que se fecham quando o jogador caminha sobre eles */
  if(!game.hellEyes)game.hellEyes=[];
  if(game.hellEyes.length===0){
    const spacing=65;
    for(let ex=spacing/2;ex<W;ex+=spacing){
      for(let ey=spacing/2;ey<H;ey+=spacing){
        game.hellEyes.push({
          x:ex+rnd(-12,12),y:ey+rnd(-12,12),
          r:rnd(16,24),
          open:1,
          phase:rnd(TAU),
          jitter:rnd(0,.5),
          bloodVessels:Math.floor(rnd(3,6))
        });
      }
    }
  }
  /* desenha cada olho do chão — estilo realista */
  for(const eye of game.hellEyes){
    const d=dist(player.x,player.y,eye.x,eye.y);
    const targetOpen=d>60?1:0;
    eye.open+=(targetOpen-eye.open)*0.12;
    const op=eye.open;
    if(op<0.02)continue;

    const wobble=Math.sin(game.t*2.5+eye.phase)*1.2*op;
    const ex2=eye.x+wobble;
    const ey2=eye.y+wobble*0.5;

    /* fundo de carne ao redor do olho — vermelho carmesim escuro */
    ctx.fillStyle='rgba(50,0,0,0.7)';
    ctx.beginPath();ctx.arc(ex2,ey2,eye.r+5,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(80,5,5,0.5)';
    ctx.beginPath();ctx.arc(ex2,ey2,eye.r+3,0,TAU);ctx.fill();

    /* esclera — branco amarelado/infectado, com veias vermelhas */
    const scleraR=op>0.5?'rgba(220,200,180,':'rgba(160,60,50,';
    ctx.fillStyle=scleraR+op+')';
    ctx.beginPath();ctx.ellipse(ex2,ey2,eye.r,eye.r*op,0,0,TAU);ctx.fill();

    /* veias vermelhas na esclera */
    if(op>0.3){
      ctx.strokeStyle='rgba(180,0,0,'+(op*0.5)+')';
      ctx.lineWidth=0.7;
      for(let v=0;v<eye.bloodVessels;v++){
        const va=(v/eye.bloodVessels)*TAU+eye.phase;
        const vr=eye.r*(0.7+Math.random()*0.3);
        ctx.beginPath();
        ctx.moveTo(ex2+Math.cos(va)*eye.r*0.3,ey2+Math.sin(va)*eye.r*0.3*op);
        ctx.quadraticCurveTo(
          ex2+Math.cos(va+0.3)*eye.r*0.6+rnd(-3,3),
          ey2+Math.sin(va+0.3)*eye.r*0.6*op+rnd(-3,3),
          ex2+Math.cos(va)*vr,ey2+Math.sin(va)*vr*op
        );
        ctx.stroke();
      }
    }

    /* íris — vermelho carmesim profundo */
    if(op>0.15){
      const irisGrad=ctx.createRadialGradient(ex2,ey2,1,ex2,ey2,eye.r*0.55);
      irisGrad.addColorStop(0,'rgba(200,30,30,'+op+')');
      irisGrad.addColorStop(0.6,'rgba(140,10,10,'+op+')');
      irisGrad.addColorStop(1,'rgba(80,0,0,'+op+')');
      ctx.fillStyle=irisGrad;
      ctx.beginPath();ctx.ellipse(ex2,ey2,eye.r*0.55,eye.r*0.55*op,0,0,TAU);ctx.fill();

      /* pupila preta — rastreia o jogador, vertical como gato */
      const pdx=player.x-ex2,pdy=player.y-ey2;
      const pd=Math.hypot(pdx,pdy)||1;
      const px=ex2+(pdx/pd)*eye.r*0.2;
      const py=ey2+(pdy/pd)*eye.r*0.2*op;
      ctx.fillStyle='rgba(0,0,0,'+op+')';
      ctx.beginPath();ctx.ellipse(px,py,eye.r*0.3,eye.r*0.4*op,0,0,TAU);ctx.fill();

      /* brilho vermelho no olho (reflexo úmido) */
      ctx.fillStyle='rgba(255,180,180,'+(op*0.35)+')';
      ctx.beginPath();ctx.arc(px-eye.r*0.12,py-eye.r*0.1*op,eye.r*0.07,0,TAU);ctx.fill();

      /* anel externo da íris — mais escuro */
      ctx.strokeStyle='rgba(60,0,0,'+(op*0.6)+')';
      ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(ex2,ey2,eye.r*0.55,eye.r*0.55*op,0,0,TAU);ctx.stroke();
    }else{
      /* olho fechando — pálpebra com linha de sangue */
      ctx.strokeStyle='rgba(100,10,10,0.9)';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(ex2-eye.r,ey2);
      ctx.quadraticCurveTo(ex2,ey2-eye.r*0.3,ex2+eye.r,ey2);
      ctx.stroke();
      /* linha de sangue saindo da pálpebra fechada */
      ctx.strokeStyle='rgba(120,0,0,0.5)';
      ctx.lineWidth=0.8;
      ctx.beginPath();
      ctx.moveTo(ex2+rnd(-3,3),ey2);
      ctx.lineTo(ex2+rnd(-5,5),ey2+rnd(4,10));
      ctx.stroke();
    }
  }

  /* olhos flutuantes no ar — maiores, mais perturbadores, vermelho */
  for(let i=0;i<8;i++){
    const fx=(i*211+game.t*22)%W;
    const fy=(i*137+game.t*13+Math.sin(game.t+i)*30)%H;
    const fa=.12+.08*Math.sin(game.t*1.5+i*1.3);
    ctx.globalAlpha=fa;
    /* esclera flutuante infectada */
    ctx.fillStyle='rgba(180,30,30,0.7)';
    ctx.beginPath();ctx.arc(fx,fy,20,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(200,200,190,0.5)';
    ctx.beginPath();ctx.arc(fx,fy,15,0,TAU);ctx.fill();
    /* íris vermelha */
    const irisG=ctx.createRadialGradient(fx,fy,1,fx,fy,9);
    irisG.addColorStop(0,'rgba(200,20,20,0.8)');
    irisG.addColorStop(1,'rgba(100,0,0,0.8)');
    ctx.fillStyle=irisG;
    ctx.beginPath();ctx.arc(fx,fy,9,0,TAU);ctx.fill();
    /* pupila rastreando */
    const pdx=player.x-fx,pdy=player.y-fy,pd=Math.hypot(pdx,pdy)||1;
    ctx.fillStyle='rgba(0,0,0,0.9)';
    ctx.beginPath();ctx.ellipse(fx+(pdx/pd)*4,fy+(pdy/pd)*4,4,5,0,0,TAU);ctx.fill();
    /* brilho */
    ctx.fillStyle='rgba(255,200,200,0.3)';
    ctx.beginPath();ctx.arc(fx-3,fy-3,2,0,TAU);ctx.fill();
  }
  ctx.globalAlpha=1;

  /* mensagem "EU ESTOU NO INFERNO" — SPAM agressivo em múltiplas posições */
  const spamCount=5;
  for(let i=0;i<spamCount;i++){
    const sx=rnd(30,W-30);
    const sy=rnd(H*.05,H*.95);
    const sa=.2+.5*Math.random();
    const ss=8+Math.random()*24;
    ctx.globalAlpha=sa;
    txt('EU ESTOU NO INFERNO',sx,sy,MONO,ss,Math.random()<.5?'#cc0000':'#ff0000','center',1);
  }
  /* mensagem principal grande e pulsante no centro */
  const ta=.6+.4*Math.sin(game.t*5);
  ctx.globalAlpha=ta;
  txt('EU ESTOU NO INFERNO',W/2,H*.48,MONO,36,'#ff0000','center',3);
  /* segunda e terceira linha — tremendo */
  txt('EU ESTOU NO INFERNO',W/2+Math.sin(game.t*9)*8,H*.55,MONO,22,'#cc0000','center',2);
  txt('EU ESTOU NO INFERNO',W/2+Math.sin(game.t*11)*12,H*.62,MONO,16,'#990000','center',2);
  ctx.globalAlpha=1;

  /* distorção de tela — linhas vermelhas tremendo */
  ctx.globalAlpha=.04;
  for(let i=0;i<25;i++){
    ctx.fillStyle='#ff0000';
    ctx.fillRect(0,rnd(0,H),W,rnd(1,3));
  }
  ctx.globalAlpha=1;

  /* grão de filme — estática sutil vermelha */
  ctx.globalAlpha=.03;
  for(let i=0;i<60;i++){
    ctx.fillStyle='#ff0000';
    ctx.fillRect(rnd(0,W),rnd(0,H),1,1);
  }
  ctx.globalAlpha=1;
}
/* v0.9.7: O OBSERVADOR — glitch de 2s ao sair do modo inferno */
if(game.glitchT>0){
  /* quadrados coloridos aleatórios */
  for(let i=0;i<8;i++){
    const gx=rnd(0,W),gy=rnd(0,H),gw=rnd(20,80),gh=rnd(10,40);
    ctx.fillStyle=Math.random()<.5?'#ff0000':'#00ff00';
    ctx.globalAlpha=.4;
    ctx.fillRect(gx,gy,gw,gh);
  }
  /* linhas de estática */
  ctx.globalAlpha=.1;
  for(let i=0;i<30;i++){
    ctx.fillStyle=Math.random()<.5?'#fff':'#000';
    ctx.fillRect(0,rnd(0,H),W,1);
  }
  ctx.globalAlpha=1;
  /* texto glitch */
  if(Math.floor(game.t*20)%2){
    txt('ERRO',rnd(W*.2,W*.8),rnd(H*.2,H*.8),MONO,rnd(20,60),'#ff4fd8','center',2);
  }
}
if((game.state==='ending'&&game.endPhase==='closed')||game.state==='won'){
ctx.fillStyle='rgba(5,3,4,'+(ramp(game.endT,.2,1.4)*.92)+')';
ctx.fillRect(0,0,W,H);
}
/* mira (crosshair) — desktop */
if((game.state==='play'||game.state==='bossintro')&&!player.dead&&mouse.inCanvas&&!touchState.up&&!touchState.down&&!touchState.left&&!touchState.right){
const r=9;
ctx.strokeStyle='rgba(230,218,196,.85)';ctx.lineWidth=1.5;
ctx.beginPath();ctx.arc(mouse.x,mouse.y,r,0,TAU);ctx.stroke();
ctx.beginPath();
for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){
ctx.moveTo(mouse.x+d[0]*(r+3),mouse.y+d[1]*(r+3));
ctx.lineTo(mouse.x+d[0]*(r+8),mouse.y+d[1]*(r+8));
}
ctx.stroke();
ctx.fillStyle='#e8455a';
ctx.beginPath();ctx.arc(mouse.x,mouse.y,1.6,0,TAU);ctx.fill();
}
if(window.__EXPANSION&&(game.state==='play'||game.state==='bossintro'))window.__EXPANSION.draw(); /* v1.3.0 */
if(window.__EXPANSION&&window.__EXPANSION.drawCerbCard&&(game.state==='play'||game.state==='bossintro'))window.__EXPANSION.drawCerbCard(); /* v1.5.7: o nome some LENTO quando o chefe começa a se mover */
const fadeA=clamp(Math.max(game.roomFade,game.fallK>=0?game.fallK:0),0,1);
if(fadeA>0&&game.state!=='won'){ctx.fillStyle='rgba(4,2,3,'+fadeA+')';ctx.fillRect(0,0,W,H);}
ctx.restore();
}
/* ============ painel de cheats do modo PENUMBRA ============
   Aparece ao lado da tela durante o jogo enquanto o modo dev estiver ativo,
   listando todos os cheats e como ativar cada um. */
let devPanelVisible=null;
function buildDevPanel(){
const p=document.getElementById('devPanel');
if(!p)return;
p.innerHTML='<h4>PENUMBRA — CHEATS</h4>'+
'<div><b>[1]</b> TODAS as magias e upgrades</div>'+
'<div><b>[2]</b> vida cheia</div>'+
'<div><b>[3]</b> arca do inferno (lista de pactos) · ↑↓ rolam</div>'+
'<div><b>[4]</b> limpar a sala</div>'+
'<div><b>[5]</b> pular p/ próxima descida</div>'+
'<div><b>[6]</b> guardião Cérbero agora</div>'+
'<div><b>[7]</b> modo deus liga/desliga</div>'+
'<div><b>[8]</b> +100 almas</div>'+
'<div><b>[9]</b> todas as armas</div>'+
'<div><b>[C]</b> encontro com Caronte (pacífico)</div>'+
'<div><b>[V]</b> boss fight contra Caronte</div>'+
'<div><b>[0]</b> sala de testes (lab) · O OBSERVADOR disponível na lista</div>'+
'<div class="dpSep">ativar o modo: digite <b>P-E-N-U-M-B-R-A</b> no menu — teclar de novo desliga</div>'+
'<div class="dpSep">lab: <b>CHEFES</b> invoca na hora · <b>SALAS</b> molda a próxima sala · <b>MONTAR</b> constrói a sua</div>'+
'<div class="dpSep"><i>easter egg: o F5 troca a fonte do título (5% de cabeça para baixo)</i></div>';
}
function updateDevPanel(){
const p=document.getElementById('devPanel');
if(!p)return;
const show=game.dev&&(game.state==='play'||game.state==='bossintro'||game.state==='labselect'||game.state==='builder');
if(show===devPanelVisible)return;
devPanelVisible=show;
p.style.display=show?'':'none';
if(show&&game.state==='builder'){
p.innerHTML='<h4>PENUMBRA — MONTADOR</h4>'+
'<div><b>CLIQUE</b> coloca a entidade</div>'+
'<div><b>DIREITO</b> remove</div>'+
'<div><b>[ENTER]</b> testar a montagem</div>'+
'<div><b>[X]</b> limpar tudo</div>'+
'<div><b>[0]</b> voltar ao lab</div>';
}else if(show){
buildDevPanel();
}
}
/* ==== HUD v0.9.0 — atualiza o círculo atual e o cooldown do Latido ====
   v1.9.1 DESEMPENHO: só escreve no DOM quando o valor MUDA (antes eram
   escritas de display/textContent todo quadro, mesmo sem mudar nada) */
let _hudVBtn=null,_hudCircle=null,_hudHudOn=null,_hudBiOn=null,_hudBiLbl=null,_hudBiNm=null,_hudBiTag=null,_hudBiKey=null,_hudBiPct=-1;
function updateVersionHUD(){
/* v0.9.6: o botão de versão só aparece no menu principal */
const vbtn=ov('versionBtn');
if(vbtn){
  const want=game.state==='menu'?'':'none';
  if(_hudVBtn!==want){_hudVBtn=want;vbtn.style.display=want;}
}
/* indicador do círculo atual */
const hud=ov('circleHud');
const hudName=ov('circleHudName');
if(hud&&hudName){
  const inGame=game.state==='play'||game.state==='bossintro'||game.state==='corridor'||game.state==='carontefight'||game.state==='caronte'||game.state==='boatride';
  if(inGame){
    if(_hudHudOn!==1){_hudHudOn=1;hud.style.display='';}
    let circle='PENUMBRA DAS ALMAS';
    if(game.floor>=2)circle='LIMBO';
    if(game.state==='carontefight'||game.state==='caronte'||game.state==='boatride')circle='RIO DE CARONTE';
    if(_hudCircle!==circle){_hudCircle=circle;hudName.textContent=circle;}
  }else if(_hudHudOn!==0){_hudHudOn=0;hud.style.display='none';}
}
/* indicador do Item Ativo — v0.9.16: HUD própria do ativo (roxo/dourado,
   nome completo, tag ATIVO) — distinta de bênçãos passivas e do latido da escola */
const bi=ov('barkIndicator');
if(bi){
  const inSchool=game.state==='school';
  if((game.activeItem&&(game.state==='play'||game.state==='carontefight'||game.state==='bossintro'))||inSchool){
    if(_hudBiOn!==1){_hudBiOn=1;bi.style.display='';}
    const item=ACTIVE_ITEMS[game.activeItem];
    const cd=game.activeCd||0;
    const max=item?item.cd||8:8;
    const ready=cd<=0;
    bi.classList.toggle('ready',ready);
    /* v0.9.16: na escola é o LATIDO (roxo); no jogo é o ATIVO (dourado) */
    bi.classList.toggle('schoolBark',inSchool);
    const cdEl=bi.querySelector('.barkCd');
    if(cdEl){
      const pct=Math.round(clamp(1-cd/max,0,1)*100);
      if(_hudBiPct!==pct){_hudBiPct=pct;cdEl.style.setProperty('--cd',pct+'%');}
    }
    const lbl=bi.querySelector('.barkLabel');
    /* v1.4.4: o HUD mostra só "SPC" — sem o nome do item (a ficha completa
       ficou no livro, na seção ITENS ATIVOS) */
    const wantLbl=inSchool?'LATIDO':(ready?'SPC':(Math.ceil(cd)+'s'));
    if(lbl&&_hudBiLbl!==wantLbl){_hudBiLbl=wantLbl;lbl.textContent=wantLbl;}
    const nm=bi.querySelector('.barkName');
    if(nm){const wantNm=inSchool?'\u00a0':'';if(_hudBiNm!==wantNm){_hudBiNm=wantNm;nm.textContent=wantNm;}}
    const tagEl=bi.querySelector('.barkTag');
    if(tagEl){const wantTag=inSchool?'ESC':'ATIVO';if(_hudBiTag!==wantTag){_hudBiTag=wantTag;tagEl.textContent=wantTag;}}
    const keyEl=bi.querySelector('.barkKey');
    if(keyEl){const wantKey=keyLabel(keybinds.active[0]);if(_hudBiKey!==wantKey){_hudBiKey=wantKey;keyEl.textContent=wantKey;}}
  }else if(_hudBiOn!==0){_hudBiOn=0;bi.style.display='none';}
}
}
/* ============ laço principal ============ */
let last=performance.now(),metaTimer=0;
function frame(now){
requestAnimationFrame(frame);
let dt=Math.min(.033,(now-last)/1000);
last=now;
musicTick();
updateDevPanel();
updateVersionHUD();
if(game.paused){
/* v1.9.1 DESEMPENHO: com o mundo CONGELADO, re-renderizar a cena inteira a
   60fps é queima seca — pinta um quadro ao entrar na pausa (e enquanto houver
   efeito de tela vivo: tremer, flash, dano); estático = não renderiza. */
decayScreenFx(dt);
const _live=game.shake>0||game.flash>0||game.hurtV>0||heartsPopT>0;
if(_live||!game._pauseClean){render();game._pauseClean=!_live;}
return;
}
game._pauseClean=false;
if(game.hitstop>0){game.hitstop-=dt;dt=0;}
/* v1.5.0: TRANSIÇÃO DESLIZANTE — o mundo congela 0.32s enquanto as salas deslizam */
if(game.slide){game.t+=dt;updateSlide(dt);updateFX(dt);render();return;}
/* v1.5.0: APRESENTAÇÃO VS — Thor e o mini-chefe se encaram antes da luta */
if(game._vs){game.t+=dt;game._vs.t+=dt;updateFX(dt);if(game._vs.t>=game._vs.dur)finishVS();render();return;}
/* v0.9.16 FIX DEFINITIVO DO TEMPO: O MUNDO (e a AMPULHETA) agora decrementam
   AQUI, no nível do laço — em TODOS os estados (play, bossintro, carontefight,
   corridor, cutscenes). Antes, ativar o efeito num estado que não decrementava
   worldT deixava os inimigos congelados para sempre ao voltar (jogo "travado").
   Nada usa setTimeout; tudo é integrado ao laço e limitado por teto de segurança. */
if(game.worldT>0)game.worldT=Math.max(0,game.worldT-dt);
if(game.slowMoT>0)game.slowMoT=Math.max(0,game.slowMoT-dt);
game.t+=dt;
updateFX(dt);
metaTimer+=dt;
if(metaTimer>2){metaTimer=0;metaTick();}
processBestiaryQueue();/* v0.9.13: retratos do bestiário (invisível — antes do render) */
if(game.state==='menu')updateAttract(dt);
else if(game.state==='saves'){/* v1.9.1: o REGISTRO DAS ALMAS cobre o livro — o mundo atrás não é simulado nem desenhado */}
else if(game.state==='play')updatePlay(dt);
else if(game.state==='corridor')updateCorridor(dt);
/* v1.3.0: estados da expansão */
else if(game.state==='gatepath'&&window.__EXPANSION)window.__EXPANSION.updateGatePath(dt);
else if(game.state==='cerbintro'&&window.__EXPANSION)window.__EXPANSION.updateCerbIntro(dt);
else if(game.state==='bluecorr'&&window.__EXPANSION)window.__EXPANSION.updateBlueCorr(dt);
else if(game.state==='juizintro'&&window.__EXPANSION)window.__EXPANSION.updateJuizIntro(dt);
else if(game.state==='limboload')updateLimboLoad(dt);
else if(game.state==='caronte')updateCaronteEncounter(dt);
else if(game.state==='boatride')updateBoatride(dt);
else if(game.state==='carontefight')updateCaronteFight(dt);
else if(game.state==='e404intro')updateE404Intro(dt);
else if(game.state==='reiintro')updateReiIntro(dt);
else if(game.state==='reideath')updateReiDeath(dt);
else if(game.state==='knightintro')updateKnightIntro(dt);
else if(game.state==='knightdeath')updateKnightDeath(dt);
else if(game.state==='schoolintro')SCHOOL_updateIntro(dt);
else if(game.state==='school')SCHOOL_update(dt);
else if(game.state==='castleintro')CASTELLO_updateIntro(dt);
else if(game.state==='castle')CASTELLO_update(dt);
else if(game.state==='bossintro'){
/* v0.9.16: durante O MUNDO as balas inimigas também congelam aqui */
{const _wa=game.worldT>0;
updatePlayer(dt);
updateShot(dt);
if(game.hasBite)updateBite(dt);
updateChainsaw(dt);
updateSword(dt);
updateNova(dt);
updateStakes(dt);
updateMagics(dt);
updateShock(dt);
updateThrownSaw(dt);
updateHammers(dt);updateBullets(dt);updateVapers(dt);updateBeamShots(dt);
updateBossIntro(dt);updatePickups(dt);if(!_wa)updateEBullets(dt);if(window.__EXPANSION)window.__EXPANSION.frameBossIntro(dt);}
}
else if(game.state==='ending')updateEnding(dt);
else if(game.state==='dead')updateDead(dt);
updateCamera(dt);
/* v1.9.1 DESEMPENHO: no menu (e no registro das almas dentro do livro), o
   livro cobre a tela inteira — renderizar o mundo atrás é CPU/GPU queimada
   a 60fps. O canvas mantém o último quadro (invisível); ao sair do menu o
   desenho recomeça no mesmo tick. A regra respeita as telas
   SEMI-TRANSPARENTES (grimório/novidades/saves têm fundo com bleed): com
   qualquer uma delas aberta, o render continua normal. */
if((game.state==='menu'||game.state==='saves')&&!_menuHidden()&&!_entryShown()&&!_menuTranslucent())return;
render();
}
function _menuHidden(){const m=document.getElementById('menu');return !m||m.classList.contains('hidden');}
function _entryShown(){const el=document.getElementById('entry');return !!el&&!el.classList.contains('hidden');} /* v1.9.1: a tela de entrada cobre tudo — nada de renderizar atrás */
function _menuTranslucent(){
/* telas por cima do menu cujo fundo DEIXA o mundo aparecer */
const ids=['book','versionInfo','saves'];
for(const i of ids){const el=document.getElementById(i);if(el&&!el.classList.contains('hidden'))return true;}
return false;
}
/* ============ menu / vitrine ============ */
function initAttract(){
bullets=[];ebullets=[];enemies=[];pickups=[];particles=[];texts=[];bolts=[];arcs=[];
hammers=[];biteFxs=[];swordFxs=[];novaFxs=[];stakeFxs=[];
spawnMarks=[];geyserMarks=[];rings=[];shockwaves=[];
thrownSaw=null;lightBeam=null;
resetBoss();
boss.active=true;boss.scale=1;
boss.x=W/2;boss.y=H*.46;boss.angle=Math.PI/2;
for(const h of boss.heads){
h.hx=boss.x+Math.cos(boss.angle+h.baseAng)*180;
h.hy=boss.y+Math.sin(boss.angle+h.baseAng)*180;
}
game.mapRooms=[];game.roomIdx=-1;game.extraIdx=-1;game.doors=[];
game.floor=1;game.usedMinis=[];game.portal=null;
game.region='penumbra';game.postCerberusFloors=0;
game.limboPending=false;game.limboLoadT=0;game.gatePending=false; /* v1.5.3 */
game.limboTestPending=false; /* v1.6.0: TESTE — última fase do Limbo */
game._arenaLock=false; /* v1.5.4: a trava de escada da arena do Cérbero nunca atravessa runs */
game.caronteBoss=null;game.carontePhase=0;game.caronteReturn=false;game.fromCaronte=false;
game.futureBossMode=false;
game.activeItem=null;game.activeCd=0;game.activeMaxCd=0;
game.estrelaT=0;game.furiaT=0;game.furiaDur=0;
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
buildRoomFloor();
game.roomKind='combat';game.globalRoom=0;game.threat=1;
game.fallK=-1;game.fallFrom=null;game.fallTo=null;game.fallTarget=null;
game.roomFade=0;game.treasureOpen=false;game.shopItems=[];game.shopNear=null;game.keeper=null;game.keeperNear=false;game.roomEvent=null;game.e404T=0;game.e404Spawned=false;
game.builderLive=false;game.deadTaunt='';
game.reiT=0;game.reiSpawned=false;game.reiFought=false;game.kingsoul=false;game.kingT=8;
game.rkP2=false;game.rkUlt=null;game.rkUltT=0;
game.decor=[];game.roomWindow=null;game.windowScene=null;game.puzzle=null;game.seenGlyphs=[];game.penumbra=null;
game.roomQueue=[];
game.state='menu';
game.endPhase=null;game.endT=0;game.playerAlpha=1;game.darkSoul=null;game.enterFrom=null;game.gateCreak=0;
refreshMenuDev();
}
/* ============ opções ============ */
function syncOptUI(){
const s=ov('oSfx'),m=ov('oMus');
if(s){s.value=Math.round(opts.sfx*100);const v=ov('oSfxV');if(v)v.textContent=s.value;}
if(m){m.value=Math.round(opts.music*100);const v=ov('oMusV');if(v)v.textContent=m.value;}
const sh=ov('oShake');
if(sh){sh.textContent=opts.shake?'LIGADO':'DESLIGADO';sh.classList.toggle('sel',opts.shake);}
const dm=ov('oDmg');
if(dm){dm.textContent=opts.dmgNum?'LIGADO':'DESLIGADO';dm.classList.toggle('sel',opts.dmgNum);}
const sc=ov('oSecret');
if(sc){sc.value=Math.round(opts.secret*100);const v=ov('oSecretV');if(v)v.textContent=sc.value;}
}
function refreshKbBtns(){
const btns=document.querySelectorAll('.kbBtn');
btns.forEach(function(el){
const a=el.dataset.kb;
if(rebindAction===a){el.textContent='PRESSIONE...';el.classList.add('waiting');}
else{el.textContent=keyLabel(keybinds[a][0]);el.classList.remove('waiting');}
});
}
function openOptions(from){
audio();
optionsFrom=from;
if(from==='pause')hideOv('pause');
else if(window.__BOOK&&__BOOK.asPage)__BOOK.asPage('options'); /* v1.9.1: o livro fica na mesa — a página de ajustes pousa sobre ele */
else hideOv('menu');
showOv('options');
syncOptUI();refreshKbBtns();
blurActive();
}
function closeOptions(){
hideOv('options');
rebindAction=null;
if(optionsFrom==='pause')showOv('pause');
else if(window.__BOOK&&__BOOK.unPage)__BOOK.unPage('options'); /* v1.9.1: a folha volta e o livro retorna à posição anterior */
else showOv('menu');
blurActive();
}
/* ============ inicialização ============ */
/* ==== devGiveAllUpgrades: dá TODAS as magias e upgrades ao jogador.
   Usado pela tecla 1 no modo PENUMBRA (dev). Aplica cada upgrade ao máximo
   de níveis possível, mas limita upgrades de dano cumulativo (como 'forca'
   com max:99) a 5 níveis para evitar overflow numérico. ==== */
function devGiveAllUpgrades(){
/* primeiro, garante as duas armas básicas */
game.hasShot=true;player.shotT=.3;
game.hasBite=true;player.biteT=.3;
/* percorre todos os upgrades e aplica até o máximo de níveis */
for(const u of UPGRADES){
  /* limita upgrades com max muito alto (como 'forca' max:99) a 5 níveis */
  const max=Math.min(u.max||1,5);
  for(let i=0;i<max;i++){
    /* só aplica se ainda puder (respeita dependências como hasShot/hasBite) */
    if(u.can()){
      u.apply();
      game.up[u.id]=(game.up[u.id]||0)+1;
      onBlessingAcquired(u.id);
    }
  }
}
/* garante um item ativo também (Latido Infernal) */
if(!game.activeItem)pickupActiveItem('latido');
/* garante vida cheia */
player.hp=player.maxHp;
sfx.levelup();sfx.roar();
game.flash=.5;game.shake=10;
sparks(player.x,player.y,'#c9a0ff',30,300,.9,4,true);
sparks(player.x,player.y,'#ffd9a0',20,240,.7,3,true);
}
/* ==== startLimboDirect: acesso direto ao LIMBO pelo menu/seletor de círculos.
   PULA TOTALMENTE a Penumbra das Almas — mostra uma tela de loading curta,
   depois a seleção de arma/dificuldade como se fosse o início do jogo no Limbo,
   e finalmente spawna o jogador no corredor escuro que leva ao Limbo. ==== */
function startLimboDirect(){
/* esconde o menu e mostra a tela de loading */
['menu','circles','weapons','dead','win','pause'].forEach(hideOv);
game.state='limboload';
game.limboLoadT=0;
game.limboLoadDur=2.6; /* duração do loading em segundos */
game.limboLoadPhase='load'; /* 'load' → 'weapons' */
showOv('limboLoading');
const lt=ov('loadingTitle');if(lt)lt.textContent='ENTRANDO NO LIMBO';
const le=ov('loadingEyebrow');if(le)le.textContent='TRAVESSIA';
const ls=ov('loadingSub');if(ls)ls.textContent='atravessando o rio escuro em direção ao falso paraíso...';
const lb=ov('loadingBar');if(lb)lb.style.width='0%';
const lp=ov('loadingPct');if(lp)lp.textContent='0%';
audio();
sfx.rumble();sfx.echo();
blip('sine',80,40,1.2,.1);
}
/* ==== v1.5.3: TESTE TEMPORÁRIO — PORTÃO DO CÉRBERUS direto do menu.
   Escolhe a arma e spawna JÁ no corredor vulcânico (O CAMINHO DO PORTÃO)
   para testar o [Z] sem descer andar nenhum. v1.5.9: DE VOLTA a pedido
   do usuário (ele vai testar a luta do Cérbero). ==== */
function startGateDirect(){
  audio();
  game.gatePending=true;
  ['menu','circles','dead','win','pause','limboLoading','descer'].forEach(hideOv);
  openWeaponSelect();
  const wt=ov('weaponsTitle');if(wt)wt.textContent='O PORTÃO DO CÉRBERUS';
  const we=ov('weaponsEyebrow')||ov('weapons').querySelector('.lu-eyebrow');
  if(we)we.textContent='TESTE — ACESSO DIRETO';
  const ws=ov('weaponsSub');if(ws)ws.textContent='escolha uma arma — você vai direto para o caminho do portão';
  blip('sine',140,90,.4,.08);
}
/* ==== v1.6.0: TESTE TEMPORÁRIO — LIMBO, ÚLTIMA FASE, direto do menu.
   Escolhe a arma e spawna JÁ na FASE 4 do Limbo (O LIMBO INFERNAL —
   FASE 2, andar 9) para conferir o fim da descida cinza sem jogar do
   começo: varreu o mapa → o Juiz desperta. Temporário — sai quando
   aprovado, como o botão do portão. ==== */
function startLimboTestDirect(){
  audio();
  game.limboTestPending=true;
  ['menu','circles','dead','win','pause','limboLoading','descer'].forEach(hideOv);
  openWeaponSelect();
  const wt=ov('weaponsTitle');if(wt)wt.textContent='O LIMBO — FASE FINAL';
  const we=ov('weaponsEyebrow')||ov('weapons').querySelector('.lu-eyebrow');
  if(we)we.textContent='TESTE — ACESSO DIRETO';
  const ws=ov('weaponsSub');if(ws)ws.textContent='escolha uma arma — você vai direto para a última fase do Limbo (4/4)';
  blip('sine',140,90,.4,.08);
}
/* loop de update da tela de loading do Limbo */
function updateLimboLoad(dt){
game.limboLoadT+=dt;
const k=clamp(game.limboLoadT/game.limboLoadDur,0,1);
const lb=ov('loadingBar');
const lp=ov('loadingPct');
if(lb)lb.style.width=Math.round(k*100)+'%';
if(lp)lp.textContent=Math.round(k*100)+'%';
/* mensagens rotativas conforme o progresso */
const ls=ov('loadingSub');
if(ls){
  if(k<.25)ls.textContent='atravessando o rio escuro em direção ao falso paraíso...';
  else if(k<.5)ls.textContent='a névoa se abre. algo brilha adiante...';
  else if(k<.75)ls.textContent='o barqueiro murmura. suas palavras não fazem sentido...';
  else ls.textContent='o corredor se revela. a luz cresce...';
}
/* partículas decorativas no canvas durante o loading */
if(Math.random()<.5){
  particles.push({x:rnd(0,W),y:rnd(0,H),vx:rnd(-8,8),vy:rnd(-20,-4),life:rnd(1.5,3),t:0,r:rnd(.8,2.5),c:'rgba(157,107,181,'+rnd(.2,.5)+')',drag:.98,glow:true});
}
/* quando termina o loading, mostra seleção de arma */
if(game.limboLoadT>=game.limboLoadDur){
  hideOv('limboLoading');
  openLimboWeaponSelect();
}
}
/* render do canvas durante o loading do Limbo */
function drawLimboLoad(){
/* fundo escuro com gradiente púrpura */
const g=ctx.createLinearGradient(0,0,0,H);
g.addColorStop(0,'#040208');
g.addColorStop(.5,'#0a0612');
g.addColorStop(1,'#06030a');
ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
/* reflexos de rio ao fundo */
ctx.strokeStyle='rgba(120,100,160,0.15)';ctx.lineWidth=1;
for(let i=0;i<12;i++){
  const yy=H*.5+i*14;
  ctx.beginPath();
  ctx.moveTo(0,yy);
  for(let x=0;x<=W;x+=40){
    ctx.lineTo(x,yy+Math.sin(game.t*.6+x*.01+i)*2);
  }
  ctx.stroke();
}
/* brilho central pulsante */
const k=clamp(game.limboLoadT/game.limboLoadDur,0,1);
const cx=W/2,cy=H/2;
const eg=ctx.createRadialGradient(cx,cy,10,cx,cy,W*.4*(.5+k*.5));
eg.addColorStop(0,'rgba(157,107,181,'+(.2+.15*Math.sin(game.t*2))+')');
eg.addColorStop(.5,'rgba(122,90,160,0.1)');
eg.addColorStop(1,'rgba(80,60,120,0)');
ctx.fillStyle=eg;ctx.fillRect(0,0,W,H);
/* partículas */
drawParticles();
/* vinheta */
ctx.drawImage(vignette,0,0);
}
/* ==== openLimboWeaponSelect: mostra a seleção de arma adaptada para o Limbo.
   Como se fosse o início do jogo, mas na região do Limbo. ==== */
function openLimboWeaponSelect(){
audio();game.paused=false;
['menu','dead','win','pause','levelup','weapons','options','book','lab','saves','shop','cheatmenu','limboLoading','descer'].forEach(hideOv);
/* prepara o estado como se fosse o início do jogo, mas na região do Limbo */
game.weapon=null;
game.hard=(diffSel!=='normal'&&diffSel!=='facil'); /* v1.3.0 · v1.5.0: FÁCIL é o perfil legado */
game.mapRooms=[];game.roomIdx=-1;game.extraIdx=-1;game.doors=[];
game.floor=2;
game.region='limbo';
game.postCerberusFloors=0;
game.usedMinis=[];
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
buildRoomFloor();
game.fallK=-1;game.fallFrom=null;game.fallTo=null;game.fallTarget=null;
game.roomFade=0;game.treasureOpen=false;game.shopItems=[];game.shopNear=null;game.keeper=null;game.keeperNear=false;game.roomEvent=null;game.e404T=0;game.e404Spawned=false;
game.builderLive=false;game.deadTaunt='';
game.reiT=0;game.reiSpawned=false;game.rkP2=false;game.rkUlt=null;
game.decor=[];game.roomWindow=null;game.windowScene=null;game.puzzle=null;game.seenGlyphs=[];game.penumbra=null;
game.parryCharge=0;game.parryLock=false;game.banner=null;game.headBanner=null;
/* atualiza o título e subtítulo do overlay de armas para refletir o Limbo */
const wt=ov('weaponsTitle');if(wt)wt.textContent='LIMBO';
const we=ov('weaponsEyebrow')||ov('weapons').querySelector('.lu-eyebrow');
if(we)we.textContent='O FALSO PARAÍSO';
const ws=ov('weaponsSub');if(ws)ws.textContent='escolha sua arma inicial — o Limbo aguarda';
/* mostra o overlay de armas */
showOv('weapons');
game.state='select';
game.limboPending=true; /* marca: após escolher arma, ir para o corredor do Limbo */
blurActive();
}
/* ==== buildVersionInfo: preenche o overlay com tudo de novo na v0.9.0 ==== */
function buildVersionInfo(){
const box=ov('versionInfoBody');
if(!box)return;
box.innerHTML=
'<div style="color:#bfd8e8;letter-spacing:.3em;margin-bottom:8px;border-bottom:1px solid #4a3a5a;padding-bottom:6px">— A GRANDE EXPANSÃO DO INFERNO —</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">1. NOVA ESTRUTURA DE PROGRESSÃO</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O Cérbero deixou de ser o boss final. Ele ainda existe como boss importante, mas agora o jogo continua após derrotá-lo. Após a morte do Cérbero, o jogador desce mais 5 fases na <b style="color:#9fc0c9">Penumbra Profunda</b> antes de encontrar Caronte.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">2. PENUMBRA DAS ALMAS</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A primeira etapa da descida se chama <b style="color:#9fc0c9">PENUMBRA DAS ALMAS</b> — sombras, almas perdidas e o primeiro selo.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">3. ENCONTRO COM CARONTE</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Caronte, o barqueiro, aguarda em seu barco num rio escuro. Ele murmurara algo <b style="color:#9fc0c9">inaudível e incompreensível</b>. O jogador escolhe <b style="color:#bfd8e8">ACEITAR (SIM)</b> ou <b style="color:#a8c24f">RECUSAR (NÃO)</b> a travessia.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">4. CUTSCENE DO BARCO</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Ao aceitar, Thor entra no barco e Caronte conduz pelo rio escuro, distante e silencioso. Ao final, Thor desce sozinho diante de um corredor escuro.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">5. O CORREDOR</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Passagem longa e silenciosa. A iluminação clareia gradualmente, elementos surgem, o vazio aumenta. Sensação sobrenatural.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">6. INTRODUÇÃO OFICIAL DO ABISMO</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Após atravessar o corredor, surge o título cinematográfico: <b style="color:#bfd8e8">ABISMO</b> — o falso paraíso. Grama, catedrais, estátuas, vitrais, paredes espelhadas sobrenaturais.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">7. INIMIGOS DO ABISMO</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Almas e entidades espirituais com aparência quase angelical — translúcidas, flutuantes, olhos brilhantes, sombras erradas. Beleza perturbadora.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">8. BOSS FINAL DO ABISMO — CARONTE</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Após todas as fases do Abismo, Caronte reaparece como boss final. Diálogo curto, formal, solene e <b style="color:#bfd8e8">rimado</b> antes da batalha, na arena junto ao rio.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">9. DERROTA DE CARONTE — ALMA NEGRA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Ao derrotar Caronte, ele dropa a <b style="color:#9d6bb5">ALMA NEGRA</b> — item permanente que desbloqueia a magia ativa <b style="color:#c9a0ff">LATIDO INFERNAL</b>.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">10. LATIDO INFERNAL (TECLA 1)</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Onda sonora sobrenatural de impacto. Empurra inimigos com força, podendo atirá-los contra as paredes da arena (causando dano extra). Cooldown de 8 segundos.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">11. SALA "BOSSES FUTUROS"</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Após derrotar Caronte, surge o botão <b style="color:#9d6bb5">BOSSES FUTUROS</b>. Sala experimental para invocar bosses dos próximos círculos: Cérbero, os 4 Cavaleiros do Apocalipse, o Velho Rei, Erro 404 e o próprio Caronte.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">12. SELETOR DE CÍRCULOS</div>'+
'<div style="margin-left:14px;margin-bottom:10px">No menu principal, o botão <b style="color:#bfd8e8">CÍRCULOS DO INFERNO</b> abre o seletor. Apenas <b>Penumbra das Almas</b> e <b>Abismo</b> estão disponíveis — os demais círculos aparecem bloqueados. Ao selecionar o Limbo diretamente, o jogador <b style="color:#d9465a">NÃO carrega itens, buffs ou progressão</b>.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">13. POLIMENTO E COERÊNCIA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Menus, textos e cutscenes refletem a descida pelos círculos do Inferno — e o Inferno agora tem hierarquia, selos e apetite. A sensação é de descoberta progressiva dos verdadeiros círculos do Inferno.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">14. v0.9.13 — AFOGA-SE · KAIZO · CONQUISTAS · PENUMBRA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O fim do Abismo abre uma <b style="color:#bfd8e8">POÇA — "afoga-se"</b> que despeja Thor na escola <b>sem armas</b>. Caronte concede o pacto único <b>MANTO DAS ALMAS</b>. Bosses repetidos na run voltam como <b>KAIZO</b> (brancos, mais fortes). Elites novos nos círculos (mais bullet hell). Bestiário com retrato, dano e descrição + catálogo de pactos/itens. <b>Conquistas</b> liberam o MODO PENUMBRA — e nele nenhum pacto é concedido. Escola: visão em cone, portas que rangem, SHIFT andar devagar, ESPAÇO latido que atrai a criatura, esconderijos novos (mesas, mesa do professor) com memória do caçador, e no 1º fragmento ela vem te ver. Saves com nome, backup automático e exportar/importar.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">15. v0.9.14 — KAIZO DO ABISMO · NERDCIRNO67 · ERRANTE CARO · ESPELHO</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O <b>KAIZO</b> virou a versão do MODO ABISMO: bosses de mapa repetidos usam stats e padrões do hardmode <b>mesmo em runs normais</b>. O modo secreto agora se chama <b>NERDCIRNO67</b> — digite isso no menu (com todas as conquistas). O ERRANTE aprendeu o valor das coisas: o básico segue barato, mas pacto raro (90–135 almas) e armas (140) custam <b>bem caro</b>. E o espelho da escola só abre o mundo espelhado depois de <b>3 interações [Z]</b>.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">16. v0.9.15 — O PERSEGUIDOR</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A criatura da escola <b>não teleporta mais</b>. Ela <b>CAMINHA de sala em sala</b>, atravessando portas de verdade, e <b>sempre nasce no PÁTIO</b>. Passou a vaga pela escola ouvindo tudo: passos normais atraem na sala, portas rangendo e corrida atravessam paredes, e <b>SHIFT é quase inaudível</b>. Ouviu algo? Vai até o local, fuça e fica olhando. Te viu no cone de visão? Persegue <b>de verdade</b> — correndo atrás de você porta a porta, e te perde se você quebrar a linha de visão. No ritual, ela anda até o ponto de onde assiste. No 1º fragmento, ela atravessa a escola inteira pra te encontrar.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">17. v0.9.16 — A FORJA DE BUILDS</div>'+
'<div style="margin-left:14px;margin-bottom:10px"><b style="color:#eef2f4">KAIZO virou título</b>: a barra mostra <b>KAIZO — [nome do boss]</b>. Cada boss kaizo ganhou <b>3 padrões exclusivos</b> (sigilos/espelhos/cometas do Bruxo, guilhotinas/corrente/execução do Carrasco, teias/ninhada/laço da Viúva, fissuras/tempestade/núcleo do Golem) com <b>telegráficos visuais e sonoros</b>, <b>FASE II aos 50%</b> de vida e <b>combos encadeados</b> anti-decoração. <b style="color:#c9a0ff">Só 1 item ativo</b> equipado: pegar outro dropa o antigo no chão — HUD nova identifica o ativo. <b>12 ativos novos</b> (ampulheta, portal, corvos, égide, semente, piroclasmo, decreto, imagem, munição éterica, forma da fera, meteoro, anel do inverno eterno). <b style="color:#ffd9a0">3 pactos do mesmo tipo despertam especializações</b> — BRUXA DO GELO, FILHO DAS CHAMAS, VOZ DA TEMPESTADE, SENHOR DO SANGUE e mais — cada uma <b>muda mecânicas</b>, não só números. Pares de tipos formam <b>sinergias</b> (VAPOR, SUPERCONDUTOR, GRANIZO, PRAGA ÍGNEA…). <b>Menu CONQUISTAS</b> com dica de desbloqueio, progresso e notificação de troféu. E o <b style="color:#9fd8ff">tempo parado foi reconstruído</b>: decremento único no laço, teto de segurança, funciona em todos os estados — o jogo <b>nunca mais trava</b>.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">18. v1.0.0 — A QUEDA DOS PACTOS (conversão infernal)</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O jogo foi <b style="color:#eef2f4">reformulado tematicamente</b>: nada de mitologia antiga — agora o universo é <b>demonológico</b>. O protagonista é <b style="color:#ffd9a0">THOR</b>, o cão-executor forjado no Trono Cinza, descendo para cobrar o pacto quebrado pelos Arquidemônios. <b>Pactos no lugar de bênçãos</b> — e o catálogo do grimório só revela termos de pactos <b>já selados</b> em descidas anteriores. <b>Enigmas sem indicação</b>: placas sem números e braseiros sem ordem escrita (a sequência pulsa uma única vez) — resolver sempre abre um baú. <b>Salas secretas reais</b>: saíram do mapa — agora existem apenas como <b style="color:#ff8f3d">paredes rachadas</b> que só cedem à <b style="color:#ff8f3d">FAGULHA EXPLOSIVA</b> (drop de inimigos laranjas, raridade comum e loja). <b>Raros da descida</b>: inimigos <b style="color:#d9465a">vermelhos</b> garantem vida; <b style="color:#ff8f3d">laranjas</b> garantem fagulha — e vida em geral caiu bem menos. <b style="color:#cfe9ff">Sinergias novas</b>: VAPOR FERVENTE (fogo+gelo mata o tiro e vira fumaça que queima), REAÇÃO VOLÁTIL (raio em queimado detona) e a transformação <b>GÊMEAS DO FEIXE</b> — duas pistolas novas que, com <b>O FEIXE</b> (segure para carregar, solte para disparar), passam a cuspir raios gêmeos. Conquistas agora dão <b>dicas abrangentes</b> (nada de passo a passo) e a mensagem de especialização <b>se apaga sozinha</b> — nada de banner eterno. A hierarquia infernal existe: Sete Selos, Arquidemônios, o Trono Cinza — e uma anomalia que os registros apagaram.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">19. v1.1.0 — O LIVRO DOS CONDENADOS</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O nome de batismo volta a ser <b style="color:#ffd9a0">THOR: REVENGE</b> — Thor desce igual, cobrando o pacto quebrado. <b>Menu infernal</b>: a porta de pedra respira e se desloca com o mouse; os botões contam a história — <b>DESCER</b> abre o mapa vertical dos círculos (a maioria riscada), <b>RETORNAR</b> abre o <b>LIVRO DOS CONDENADOS</b> (folhas com condição, karma e estado da alma), <b>ALMAS</b> guarda os registros — os não revelados aparecem como <b>[REGISTRO CORROMPIDO]</b> — e o <b>GRIMÓRIO</b> ganhou 8 categorias: demônios, bosses, entidades, pactos, bênçãos, maldições, círculos e <b>fragmentos</b> de um livro que já descreve lugares que você não visitou. Trechos em italiano surgem no menu; fique parado alguns segundos e a câmera desce com o Inferno — e, por um instante, <b style="color:#d9465a">CÍRCULO X</b>. <b>Gameplay</b>: a FAGULHA EXPLOSIVA virou arma (<b>[Q]</b> — tiro normal que detona), salas secretas não aparecem conectadas no mapa, enigmas ficaram sem estruturas, o altar de sacrifício exige <b>10 corações</b> — sempre, e repetível — e paga com um <b>PACTO</b> (bênção cura, pacto cobra). O <b>FEIXE</b> agora recebe multiplicadores de tiros e de elementos; as <b>PISTOLAS GÊMEAS</b> têm duas armas desenhadas e, na transformação GÊMEAS DO FEIXE, cuspidam mini-feixes durante a carga e um feixe reforçado no soltar cheio. O <b>VELHO REI</b> só caça salas secretas (1%), o <b>ERRANTE</b> nunca mais abandona o posto — e os <b style="color:#d9465a">SETE PECADOS CAPITAIS</b> observam: 3 bênçãos/pactos do mesmo pecado dão a <b>SENTENÇA</b> única dele.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">20. v1.1.1 — A ESCOLA ESQUECIDA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A escola vazia <b>saiu da descida</b>: o fim do Limbo volta a levar direto ao <b>PORTÃO</b> como antes — a POÇA "afoga-se" não existe mais, e o 4º andar revela o LIMBO de novo. A escola virou <b style="color:#ffd9a0">opcional</b>: uma porta de teste no menu <b>CÍRCULOS</b> — por enquanto sempre aberta, sem exigir descidas — para validar cada sala, fragmento e o caçador fora da descida.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">21. v1.1.2 — A FEIRA DO ERRANTE</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A loja do ERRANTE agora é uma <b style="color:#ffd9a0">feira no chão</b>: cada mercadoria fica exposta ao redor dele, num arco rente, com o <b>preço em almas</b> — <b>caminhe até o item e pressione [Z]</b> para comprar. Comprar <b>não derruba nada</b>: o efeito é imediato, e o presente do <b>REGATEADOR</b> vem direto na mão. Fora da feira: o <b>Cérbero não vaga mais atrás da escolha de arma</b> e nenhum texto do menu fica atrás da porta de pedra.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">22. v1.1.3 — A FACE DO PACTO</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Bênçãos, pactos e itens ativos agora têm <b style="color:#ffd9a0">rosto</b>: coloque um PNG (ou JPG/WEBP) em <b>assets/sprites/drops/</b> com o ID do item (ex.: <b>forca.png</b>, <b>iraodin.png</b>, <b>latido.png</b>) ou com o nome dele (<b>forca-do-pacto.png</b> — sem acentos, espaços viram "-") e a arte aparece <b>NA CARTA</b> da escolha, <b>NO DROP</b> do baú, <b>NA FEIRA</b> do Errante, no drop de item ativo e nas <b>miniaturas do grimório e da arca</b> [3]. A lista completa dos 46+18+1 nomes está no COLOQUE-SPRITES-AQUI.txt da pasta. Sem arquivo, o glifo/nome de sempre é usado — nada quebra; trocou o arquivo com o jogo rodando? Itens na tela re-leem a pasta a cada ~6s (__DROPS_RESCAN() força, __DROPS_DEBUG() diagnostica).</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">23. v1.1.4 — SANGUE BARATO</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O pacto do altar ficou <b style="color:#ffd9a0">barato</b>: em vez de sugar os <b>10 corações</b> inteiros, o sacrifício cobra apenas <b style="color:#d9465a">10 DE VIDA</b> — um beliscão por um pacto selado (continua repetível, um por visita). E para quem não quer caçar as conquistas: no menu, digite <b>nerdcirno67</b>, depois <b>penumbra</b> e por fim <b>TransMiranda</b> — o <b style="color:#c9a0ff">MODO NERDCIRNO67</b> destrava na hora, com o recado: <i>"ou vc pode ser um chato que nn quer as conquistas...faça oque quiser"</i>.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">24. v1.2.0 — A ESCOLA EM CHAMAS</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A escola virou o <b style="color:#ff8f3d">ato final</b>: os últimos enigmas existem — <b>8 fragmentos</b> são possíveis. A <b style="color:#cfe9ff">PRIMEIRA aparição do cervo é uma ilusão</b> — alguns segundos depois, ele vem de verdade. Cada fragmento o torna <b>mais insano</b>: mais rápido, ouve mais longe e arma <b style="color:#d9465a">EMBOCADAS</b>. O <b>ESPELHO</b> agora pede <b>6 toques [Z]</b> para abrir o mundo espelhado — onde <b>VOCÊ MESMO</b> caça: olhe DIRETO para ele e ele não segue; encare-o o bastante e o último fragmento se revela. Com os 8, o <b style="color:#c9a0ff">RITUAL</b> no pátio alaga a escola e <b style="color:#ff8f3d">tudo pega fogo</b>: FUJA pela entrada enquanto o cervo persegue na sua velocidade. Venceu? <b>Conquista única</b> + <b style="color:#ffd9a0">CINZAS DO RITUAL</b> (bênção), <b style="color:#9d6bb5">O PACTO DA FUGA</b> e o <b style="color:#cfe9ff">SINO DA ESCOLA</b> (item) liberados — com tela especial de fuga. Fora dela: as <b>PISTOLAS GÊMEAS</b> aparecem (com sprite em <b>assets/sprites/armas/</b>) e viram <b>PISTOLAS DUPLAS</b> ao serem pegas DE NOVO — aí sim, com O FEIXE, a transformação completa. Novas bênçãos: <b style="color:#d9465a">GARRA DE FERA</b>, <b style="color:#cfe9ff">FEIXE DO REI</b> (ativa) e <b style="color:#9fd8ff">INSTINTO DE PANTERA</b>. Baús agora dão só <b>fagulha, coração ou almas</b>; salas de desafio <b>sempre</b> pagam com item/bênção; puzzles do jogo comum ficaram mais difíceis e ganharam o <b>CÍRCULO DAS CORES</b> (acerte a cor certa 5 vezes). Sprites direcionais (<b>thor_frente/tras/lado.png</b>, <b>&lt;inimigo&gt;_frente/tras/lado.png</b>) e <b>GIF/vídeo</b> (mp4/webm) detectados na pasta.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">25. v1.2.1 — OLHOS NO ESCURO</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Correções da caçada. O <b style="color:#cfe9ff">FEIXE DO REI</b> agora é <b style="color:#7fb8ff">AZUL</b> (o dourado ficou só para o feixe das <b>PISTOLAS DUPLAS</b>). E o <b style="color:#d9465a">cervo</b> foi consertado de verdade: ele <b>NÃO congela mais</b> enquanto você está escondido — continua caçando, entra na sala, fuça e <b>vai embora</b>. Escondido <b>sem ele ver</b>, ele não te acha: ele só vem se <b>VIU/OUVIU você entrar</b> no armário (mesma sala na hora), se é a <b>CAÇADA FINAL</b> ou se <b>aprendeu</b> o esconderijo (2+ vezes no mesmo lugar). <b>Nada de teleporte</b>: ele <b>caminha de porta em porta</b> até o esconderijo — saiu no meio do caminho? Ele chega num armário vazio, procura e parte. <b>Sair do armário é sempre possível</b> (só não dá mais quando a porta já está sendo arrancada); se ele <b>não consegue chegar</b> (portas trancadas), <b>desiste</b>. E a morte dele <b>não trava mais o jogo</b> — tela de morte e botões sempre respondem.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">27. v1.2.3 — ANDAR DE CIMA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A escada FINALMENTE leva ao andar de cima. Três consertos de verdade: <b style="color:#d9465a">(1) O RELÓGIO DA SALA DE CIMA</b> — um erro antigo (desde a v1.2.0) fazia <b>entrar em corrA2/salaA21 quebrar o DESENHO do jogo em silêncio</b>: a tela congelava (o jogo continuava rodando por baixo, invisível) — era o soft lock de subir a escada. Consertado: o relógio agora desenha. <b style="color:#ff8f3d">(2) A ESCADA É INSTANTÂNEA</b> — antes ela usava o timer cancelável de porta (0.42s): quem continuava andando (ou parava perto e voltava a andar) CANCELAVA a travessia sem perceber e passava reto, parando noutra sala. Agora é <b>pisou, sobe</b>. <b style="color:#7fb8ff">(3) ANTI-PÊNDULO</b> — ao chegar no andar de cima, a escada de volta fica <b>muda</b> (histérese + cooldown) até você se AFASTAR dela e re-encostar de propósito: <b>não desce mais sozinho</b> com a tecla ainda pressionada, e parar em cima dela não dispara nada. E ao usar qualquer escada aparece o <b style="color:#cfe9ff">nome do andar</b> (<i>estrutura A — andar de cima.</i>) — você SABE que progrediu. Bônus do workspace: os scripts agora carregam com <b>?v=</b> — o navegador nunca mais mistura arquivos antigos do cache com os novos.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">26. v1.2.2 — TRAVESSIA LIVRE</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O <b style="color:#ff8f3d">fim do congelamento</b>. A causa do <b>travamento ao passar de sala</b> (subir a escada, atravessar portas) foi encontrada: o jogo fazia pedidos de rede <b style="color:#d9465a">SÍNCRONOS</b> — a thread inteira do jogo ficava <b>presa até a resposta chegar</b> — a cada <b>15 segundos</b> e a cada vez que a janela ganhava foco. No disco local isso era instantâneo (por isso nunca aparecia), mas através de <b>preview/proxy</b> eram <b>segundos de congelamento</b> de cada vez. Agora <b>tudo é assíncrono</b>: nada bloqueia mais o jogo, em lugar nenhum. A varredura de sprites também parou de disparar <b>mais de 1.000 pedidos</b> por ciclo quando a pasta não tem listagem (agora <b>1 pedido</b> resolve). E um <b style="color:#cfe9ff">relógio de segurança</b> na transição: se uma queda entre salas ficar presa por qualquer motivo, ela <b>se conclui sozinha</b> — soft lock de travessia, nunca mais. Bônus do workspace: sprites próprios soltos na pasta agora são <b>detectados de verdade</b> nele (a listagem funciona) — o PNG entra em ~15s como no jogo local. E no <b>STANDALONE</b>, os sprites embutidos <b>voltaram a funcionar</b> — um nome de arquivo com espaço (<i>Velho Rei.PNG</i>) quebrava o script interno em silêncio.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">28. v1.3.0 — O PORTÃO DO INFERNO (expansão pré-v2)</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A EXPANSÃO chegou — aditiva, sem apagar nada. <b style="color:#ffd9a0">PROGRESSÃO NOVA</b>: Penumbra das Almas (fases 1-2) → <b>PENUMBRA INFERNAL</b> (fases 1-2, chão rachado e brasas) → <b style="color:#cfe9ff">CAMINHO DO PORTÃO</b> (sem inimigos) → <b style="color:#d9465a">CÉRBERO remasterizado</b> (cutscene de entrada com o portão abrindo devagar, as três cabeças observando e se virando juntas; 3 FASES: A FOME DAS TRÊS BOCAS, O ÚLTIMO PORTÃO) → <b style="color:#ff8f3d">GARGANTA VULCÂNICA</b> (lava, erupções telegrafadas e o <b>FERREIRO DAS ALMAS</b>) → <b style="color:#7fb8ff">CORREDOR AZULADO</b> (o vermelho morre, a névoa fria toma conta) → travessia de <b>CARONTE</b> → <b>O LIMBO em 4 FASES</b> → <b style="color:#9d6bb5">O JUIZ SEM ROSTO</b> no tribunal final. <b style="color:#ffd9a0">ELEMENTOS E SINERGIAS</b>: 8 categorias (Luz, Escuridão, Fogo, Água, Gelo, Vento, Raio, Terra) com chips nas cartas, pares novos (VAPOR ESCALDANTE, PRISÃO DO AQUERONTE, CONDUTOR DOS CONDENADOS, INCÊNDIO DO INFERNO, SEPULTURA GLACIAL) e sinergias de itens (CARNICEIRO, MADRUGADA, CADEIA ARDENTE, VENDAVAL GELADO, O COBRADOR, DUPLA TESTEMUNHA, TIRO PARLANTINO, MARÉ DE BRASA) — tudo registrado no <b>grimório, aba SINERGIAS</b> (páginas rasuradas até descobrir). <b style="color:#ffd9a0">16 BÊNÇÃOS + 11 PACTOS NOVOS</b> (Sol Estilhaçado, Halo Partido, Correntes do Pecado, Reflexo que Não É Seu… Pacto do Açougueiro, da Hora Roubada, do Barqueiro, do Desenvolvedor, o secreto PACTO 404…). <b style="color:#ffd9a0">6 ARMAS NOVAS</b> na escolha inicial: <b>A SENTENÇA</b>, <b>PISTOLAS DO ÚLTIMO PECADO</b>, <b>O CREDOR</b>, <b>COLHER DE MADEIRA DIVINA</b>, <b>PEIXE DE GUERRA</b> e <b>TECLADO DO PECADOR</b> — cada uma com evolução própria. <b style="color:#ffd9a0">CHEFES E ENCONTROS</b>: Juiz Sem Rosto (final), Ferreiro das Almas (Garganta), Anjo Acorrentado (correntes destrutíveis), a secreta Serpente que Engole Estrelas (salas secretas do Limbo), o Thor que Não Desceu (aparece no portão para builds de 6+ bênçãos) e o <b>CERVO DESFIGURADO</b> (aparições silenciosas na Penumbra). <b style="color:#ffd9a0">DIFICULDADES</b>: <b>PUNIÇÃO</b>, <b>KAIZO</b> (título), <b>ABISMO</b> (caçada em grupo) e <b>PENITÊNCIA</b> (desbloqueia ao concluir o Abismo) + 7 modificadores (Inferno Instável, Sem Misericórdia, Dívida de Sangue, Silêncio Absoluto, O Inferno Observa, Portas Fechadas, Sem Segunda Chance). <b style="color:#ffd9a0">CORREÇÕES</b>: <b style="color:#cfe9ff">cutscene curta (≤1s)</b> ao passar de porta/escada — para Thor E para a coisa de cervo (quando ele atravessa perto, você vê a fresta e a silhueta); <b style="color:#cfe9ff">TENTAR NOVAMENTE depois de morrer na escola revive na escola</b>; a <b style="color:#cfe9ff">mensagem de morte muda a cada morte</b> (e depois de muitas, a besta desiste: só "..." e o jogo começa normal); e o <b style="color:#cfe9ff">LATIDO DA ESCOLA FOI CONSERTADO</b> — o ESPAÇO estava mudo antes da revelação e depois que ela ia embora; agora o latido SEMPRE soa (o atrair-ela continua funcionando como sempre). Música nova por zona (vulcão, corredor azul, portão, juiz) e 9 conquistas novas.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">29. v1.3.1 — TRÊS GARGANTAS</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Correções da expansão + o <b style="color:#d9465a">CÉRBERO remasterizado</b>. <b style="color:#ffd9a0">ITENS ATIVOS</b>: pegar um novo com outro equipado ARREMESSA o antigo para fora do corpo e ele fica <b>2 segundos impossível de repégar</b> — o bug de "pegou muitas vezes" morreu (e pegar sempre foi só passar por cima). <b style="color:#ffd9a0">AS ARMAS NOVAS NÃO ATACAM MAIS SOZINHAS</b>: agora obedecem ao comando, igual às antigas — <b>clique/toque</b> dispara na hora e <b>setas seguradas</b> atacam contínuo. <b style="color:#9d6bb5">O CREDOR refeito</b>: a corrente PRENDE o devedor, ARRASTA até você e, <b>na hitbox, o golpe vem imediato e ARREMESSA o corpo</b> — ele voa, se choca com os outros demônios e <b>todos no choque recebem dano</b>. A COLHER DE MADEIRA DIVINA assume o nome verdadeiro: <b style="color:#ffe9b8">COLHER COMICAMENTE GRANDE</b>. <b style="color:#ff8f3d">PENUMBRA INFERNAL consertada</b>: o portal fantasma do andar 4 não existe mais — varreu as duas fases, vem a <b>FASE ÚNICA</b>: uma caminhada curta até o <b>PORTÃO ENORME</b>, que abre devagar direto para a arena nova do Cérbero (o velho sono congelado de 14s <b>saiu do caminho</b>). <b style="color:#d9465a">ENTRADA REMASTERIZADA</b>: o portão abre devagar, Cérbero imóvel, as três cabeças observam direções diferentes, a central te acompanha — e <b>quando você se aproxima</b> as três se viram juntas; a música sobe aos poucos e o nome chega na hora certa, sem interromper a ação. <b style="color:#d9465a">A LUTA</b>: as 3 fases agora <b>LIGAM de verdade</b> (o gancho antigo só vivia na intro e nunca rodava) — <b>FASE I — O CÃO QUE CAÇA</b> (bote telegrafado: solo pulsando e seta no chão), <b>FASE II — A FOME DAS TRÊS BOCAS</b> (leques conjuntos e pescoços que avançam), <b>FASE III — O ÚLTIMO PORTÃO</b> (arena escura, uivo, anéis e a janela <b>VULNERÁVEL</b>). O diálogo antigo pós-luta e a <b>ALMA NEGRA</b> continuam lá, intocados.</div>'+
'<div style="color:#ffd9a0;font-size:13px;margin:10px 0">64. v1.9.2 — A INTRODUÇÃO CINEMATOGRÁFICA</div>'+'<div style="margin-left:14px;margin-bottom:10px">A história proibida que se torna real: depois da abertura do livro, a câmera <b style="color:#ffd9a0">mergulha no manuscrito</b> — a prancha do grande abismo, o Inferno registrado em camadas (muralhas, portas fechadas, silhuetas atravessando caminhos, fumaça), frases nas margens ("Toda queda tem um começo." / "Nem toda alma chega ao fim de sua jornada."), e a região quase vazia onde <b style="color:#9fc0c9">Thor — o cachorro morto-vivo — acorda com peso</b>: ergue a cabeça, olha os próprios membros, silêncio, e caminha para a passagem ao fundo. A câmera volta ao livro (a ilustração mudou; a anotação registra: <i>"O corpo foi perdido. A vontade permaneceu."</i>), uma <b style="color:#ffd9a0">marca de tinta aparece na margem sozinha</b> ("ele acordou.") e o desenho vira o mundo: o papel some, os traços ganham volume e a paleta fria da Penumbra assume. O THOR REVENGE revela-se sobre o corredor final e o INICIAR vem abaixo — a mesma porta de sempre, agora com cinema. <b style="color:#cfe9ff">~45s na primeira apresentação, PULÁVEL</b> (clique/tecla/roda, dica discreta no canto), não repete automaticamente (o convite "rever a introdução" fica na ENTRADA), respeita ANIMAÇÕES DO LIVRO=DESLIGADAS e prefers-reduced-motion, respeita os volumes de música/efeitos, dorme com a aba oculta e <b>morre no fim: zero loops, zero canvas, zero áudio sobrando</b>. Zero mudança em gameplay, saves, lousa e handlers.</div>'+
'<div style="color:#ffd9a0;font-size:13px;margin:10px 0">63. v1.9.1 — O LIVRO VIVO · A LOUSA</div>'+'<div style="margin-left:14px;margin-bottom:10px"><b style="color:#ffd9a0">O LIVRO ACORDOU</b>: o menu é um manuscrito físico sobre uma mesa de carvalho, à luz de duas velas — capa com lombada que abre com peso e o conteúdo <b style="color:#cfe9ff">JÁ ESCRITO</b> quando as páginas aparecem (clique para pular; da 2ª visita em diante a abertura fica curta). <b style="color:#cfe9ff">CADA OPÇÃO TEM CENA PRÓPRIA</b>: DESCER vira a página do mapa desenhado a tinta e a câmera entra nele; RETORNAR volta uma folha até o REGISTRO DAS ALMAS — os saves viram inscrições (carregar, renomear, queimar, restaurar cinza ali mesmo) com zoom da câmera na folha escolhida; OPÇÕES pousa a página "Das Marcas e Ajustes" com os controles escritos no papel; CÍRCULOS/ALMAS/INVENTÁRIO/GRIMÓRIO ganham folha rápida com pousada de câmera própria; MODS entra como folha solta; ABANDONAR fecha o livro devagar (e reabre com a despedida). <b style="color:#cfe9ff">ENGENHARIA</b>: câmera 3D por transform (GPU), folha com sombra e dobra, curvas de aceleração, UMA transição por vez — cliques durante a cena são ignorados e um watchdog devolve o controle (o menu NUNCA fica travado); teclado intacto (Tab + Enter atravessam o livro). <b style="color:#cfe9ff">DESEMPENHO</b>: mesa pintada UMA vez por resize, velas a 11 fps em canvases minúsculos, poeira limitada (16 motas, a cada 2 quadros), UM loop rAF para tudo que DORME quando o menu sai da tela ou a aba é ocultada; nada de blur/filter caro por quadro. <b style="color:#cfe9ff">ANIMAÇÕES DO LIVRO</b>: nova opção (completas/leves/desligadas) nas OPÇÕES; a abertura respeita prefers-reduced-motion. <b style="color:#cfe9ff">O EDITOR DE MODS SAIU DO JOGO</b> (como decidido): a forja é o mod-studio.html, FORA da tela; dentro do jogo ficou só O GERENCIADOR (abrir studio, importar o JSON, ativar/desativar/exportar/excluir) — e o motor continua rodando os mods importados inteiro: balas, os 8 formatos, padrões, spell cards, máquinas de blocos, sprites e buff/nerf. O botão do menu agora se chama MODS · O GERENCIADOR. <b style="color:#ffd9a0">v1.9.1 — A CARTOGRAFIA DO INFERNO</b>: a cutscene do livro abre o jogo e o botão INICIAR (THOR REVENGE em cima, INICIAR logo abaixo) aparece DEPOIS dela — o mesmo clique/Enter que pula a abertura não aperta o INICIAR. CÍRCULOS fecha o livro e revela a LOUSA: "A DESCIDA — CARTOGRAFIA DO INFERNO" — os nove anéis a giz (I fora → IX no fundo) com número, nome e símbolo de cada região (o portal do Abismo, as fitas do Desejo, a boca da Fome, a moeda rachada, a rachadura da Fúria, o sarcófago, a arma partida, o labirinto, a chave quebrada), o caminho pontilhado da descida com setas à mão e o abismo lacrado no centro — e a PENUMBRA DAS ALMAS FORA dos círculos, à direita: contorno aberto, traço fino e frio, ligada por uma anotação lateral descontínua (nunca um décimo anel). Passar o giz mostra a inscrição no espaço reservado; clicar aproxima a região antes de entrar. Estados REAIS do save: risco de confirmação nas descidas feitas, selos nos caminhos lacrados, legenda manuscrita. Ao sair, o livro reabre sozinho. E o MENU FICOU MAIS LEVE: a sombra do livro virou poça estática (o drop-shadow que re-filtrava o livro INTEIRO a cada repaint saiu — viradas, hover e respiração do idle custam zero), metaTick saiu do loop de 60fps (unlocks a cada 2s), o REGISTRO DAS ALMAS e a PAUSA não desenham mais o mundo atrás (quadro estático no canvas), e o HUD escreve no DOM só quando o valor muda.</div>'+'<div style="color:#ffd9a0;font-size:13px;margin:10px 0">62. v1.9.0 — O GRIMÓRIO DAS CEM ALMAS</div>'+'<div style="margin-left:14px;margin-bottom:10px"><b style="color:#ffd9a0">CEM ALMAS NOVAS</b>: 34 bênçãos, 33 pactos e 33 armas — todas com efeito real, sem cópia disfarçada. <b style="color:#cfe9ff">FEIXES</b> (Feixe do Primeiro Pecado · Raio do Último Julgamento): raríssimos, dano por TICK a cada 5 quadros (temporizador acumulado, independente do FPS), o dano NUNCA acumula por permanecer no alvo, e cada alvo alinhado recebe independentemente — com 8 sinergias exclusivas de feixe. <b style="color:#cfe9ff">PACTOS MAIS DIFÍCEIS</b>: peso ×0.35 nas cartas, 15% no chão, fora do básico da feira, e o altar de sangue agora cobra 30 de vida (+10 a cada uso na mesma sala). <b style="color:#cfe9ff">INIMIGOS APLICAM EFEITOS</b>: balas de fogo queimam, verdes envenenam, gélidas congelam (como sempre) — e contato com faíscas/morcegos queima, corrupções e almas envenenam. Nenhum efeito mata sozinho: para em 1 de vida. <b style="color:#cfe9ff">IA MAIS ESPERTA</b>: cuspedores/feiticeiros/vigias antecipam sua posição (com erro humano), perseguidores tentam fechar os seus lados, sh/cr/crs mais lentos, e a Coisa de Cervo agora corre a 255 (você corre 285) — o terror é a caça, não a velocidade. <b style="color:#cfe9ff">ZERO DRENAGEM</b>: auditoria completa — Pacto da Fome (5 HP/s), Fome Insciável (5 HP/10s), Coração Falso (10 HP/sala), Açougueiro, Falso Rei, Barqueiro, Dívida Infinita e Dívida de Sangue foram reescritos: agora cobram ALMAS, cadência ou dano recebido — nunca mais vida com o tempo. <b style="color:#cfe9ff">SINERGIAS REAIS</b>: registro central de 15 combinações entre itens novos (ativam e desativam sozinhas, descobertas ficam no grimório) + as 8 de feixe. <b style="color:#cfe9ff">MAGIKA</b>: cada descida sorteia um valor e 1-2 eventos estranhos (luz, mensagens, aparições, paleta, silêncio) — arquitetura pronta para novos eventos. <b style="color:#cfe9ff">O LIVRO</b>: menu renovado como um grimório antigo de duas páginas, com abertura animada (capa 3D, tinta que revela) — pulável com um clique, e nunca prende o menu. <b style="color:#cfe9ff">MOD STUDIO EXTERNO</b>: mod-studio.html abre FORA do jogo — cria balas, padrões, máquinas de blocos e testa na arena própria; exporta o JSON que o EDITOR DE MODS importa de volta. O estúdio interno continua intacto.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">61. v1.8.0 — A MÁQUINA DAS ALMAS</div>'+'<div style="margin-left:14px;margin-bottom:10px">O núcleo do <b style="color:#c9a0ff">CREATIVE MOD STUDIO</b> chegou — e é uma máquina. <b style="color:#cfe9ff">MÁQUINA DE BLOCOS (nova aba)</b>: o VISUAL LOGIC EDITOR — monte o ataque com blocos conectados SEM programar. DISPARAR PADRÃO (mira no jogador ou ângulo fixo, ×vezes com intervalo), ESPERAR, GIRAR FORMAÇÃO (graus + giro contínuo), VELOCIDADE DAS BALAS (×), COR DAS BALAS, DIVIDIR BALAS (cada bala vira N em leque, após Xs), ESPERAR VIDA DO CHEFE (o ataque pausa até o chefe chegar a X%), REPETIR SEQUÊNCIA (com CORPO aninhado), ALEATÓRIO ENTRE DOIS RAMOS, SIMULTÂNEO (os dois ramos ao mesmo tempo), USAR OUTRA MÁQUINA (a sequência salva vira bloco reutilizável entre projetos) e ENCERRAR ATAQUE. Cada bloco tem seus próprios campos — mexeu, salvou. <b style="color:#cfe9ff">LINHA DO TEMPO</b>: o ataque compilado no tempo, cada bloco na cor do tipo, total estimado — e o PONTEIRO corre numa faixa no pé da arena enquanto a máquina roda. <b style="color:#cfe9ff">NO JOGO REAL</b>: TORNAR A SPELL DO SENHOR — a máquina roda pelo mesmo trilho das spell cards (zero mudança no motor, arquivos originais intactos). <b style="color:#cfe9ff">SIMULADOR COM JOGADOR DE TESTE</b>: o Thor da área de testes ganhou PILOTO AUTOMÁTICO — PARADO, LATERAL (vai-e-volta), CIRCULAR, ROTA (clique pontos na arena e ele faz o circuito) e REPRODUZIR (grava o SEU movimento a 30 Hz e repete em laço — compare versões A/B do mesmo ataque). SIMULAR DANO −10% adianta os portões de vida. O mod CRIAÇÃO já vem com A MÁQUINA DE EXEMPLO: espiral → esperar → acelerar → girar → dividir → anel → encerrar.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">60. v1.7.3 — A FORJA DAS BALAS</div>'+'<div style="margin-left:14px;margin-bottom:10px">O modo CRIAR/EDITAR MEU PADRÃO da área de testes virou a <b style="color:#c9a0ff">FORJA DO PADRÃO</b> — criar os padrões dos inimigos AGORA É ALI. <b style="color:#cfe9ff">CRIAÇÃO COMPLETA</b>: tipo de formação (desenho — com MINI-TELA DE DESENHO dentro da própria área de testes, espiral, anel, estrela, onda), balas por vaga, velocidade, tamanho, rotação por vaga, INTERVALO entre vagas (a cadência das vagas é sua também) e cor — tudo editável AO VIVO enquanto a arena dispara, salvo no mod na hora. <b style="color:#cfe9ff">OS 8 FORMATOS DE BALA FUNCIONAM</b>: seletor FORMATO DA BALA (círculo, diamante, estrela, anel, seta, quadrado, cruz, oval) com GALERIA ao vivo mostrando os 8 com a cor/tamanho do padrão — o formato viaja com a bala e vale no sim, nos previews e NO JOGO REAL (gancho novo nas balas do motor). <b style="color:#cfe9ff">BALA PERSONALIZADA</b>: o padrão pode nascer com uma bala SUA da aba BALAS — o estilo completo (forma, tamanho, cor, transparência, brilho, rastro, rotação) é aplicado na hora na arena, nos previews e no jogo com o mod ativo. <b style="color:#cfe9ff">USAR NOS INIMIGOS</b>: escolha o senhor + o padrão nativo dele e SUBSTITUA pelo padrão da forja (vira o ataque real dele com o mod ativo), ou TORNE-O A SPELL CARD do senhor (todos os ataques viram ele) — com REMOVER dos dois e um painel mostrando tudo que o seu mod já substituiu/vinculou. <b style="color:#cfe9ff">DUPLICAR ESTE</b>: copie qualquer padrão para mexer sem perder o original — na forja e no editor de padrões, que também ganhou intervalo, formato e bala personalizada.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">59. v1.7.2 — A OFICINA VIVA</div>'+'<div style="margin-left:14px;margin-bottom:10px">A área de testes do estúdio virou <b style="color:#c9a0ff">a sala do jogo de verdade</b>. <b style="color:#cfe9ff">SALA REAL PARA TUDO</b>: a arena clássica 660×400 se aposentou — os três modos (TESTAR MINHA SPELL, CRIAR/EDITAR MEU PADRÃO e SIMULAR PADRÃO REAL) rodam na MESMA escala da sala, com as mesmas paredes e o mesmo Thor (240 px/s, 120 no foco); testar longe do jogo enganava. <b style="color:#cfe9ff">CRIAR/EDITAR MEU PADRÃO AO VIVO</b>: um novo modo onde o boneco dispara um padrão SEU sem parar — mexa em balas por vaga, velocidade, tamanho, rotação e cor DURANTE o teste (a próxima vaga já nasce com o novo valor e já fica salvo no mod), com <b>+ NOVO PADRÃO</b> para criar ali mesmo e <b>ABRIR NO EDITOR DE PADRÕES</b> para o desenho à mão. <b style="color:#cfe9ff">BUFF / NERF nos padrões do jogo</b>: no modo chefe real, dois sliders (VELOCIDADE das balas ×0.4-2.5 e CADÊNCIA de re-ataque ×0.4-2) mudam SÓ o padrão escolhido daquele senhor — o efeito aparece na hora no sim e fica salvo no mod (data.tuning), valendo na luta real quando o mod está ATIVADO (botão ATIVAR ESTE MOD ali mesmo; REMOVER AJUSTE desfaz). <b style="color:#cfe9ff">COMO FICA NO JOGO (sprites)</b>: o editor de sprites ganhou a pré-visualização na caixa REAL que o motor usa para cada slot (Thor 52×58, inimigos r×3, senhores r×3-3.4, o piso esticado na sala) — SOBREPOSTO NO JOGO (original a X% por baixo do seu) ou LADO A LADO NO JOGO, e o botão <b>SALVAR E VER NO JOGO</b> salva, ativa o mod e fecha o editor para você ver o sprite na luta. <b style="color:#cfe9ff">AVANÇO TRIPLO CORRIGIDO</b>: o Carrasco agora avança EM DIREÇÃO AO JOGADOR nas três investidas (cada uma mira onde o Thor está, com a rota carmesim no chão) e, na terceira, QUANDO CHEGA PERTO, desfere o golpe da pá ali mesmo — anel de aviso 132px, 0.5s para sair; se você despistar, o golpe sai na parede do mesmo jeito.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">58. v1.7.1 — O ENSAIO DOS SENHORES</div>'+'<div style="margin-left:14px;margin-bottom:10px">O ESTÚDIO DAS ALMAS agora <b style="color:#c9a0ff">mostra tudo que ele promete</b>. <b style="color:#cfe9ff">PRÉ-VISUALIZAÇÕES CONSERTADAS</b>: as previews de balas e padrões morriam ao abrir o jogo — agora andam de verdade: a bala voa pelo caminho com o estilo ATUAL dos campos (sem precisar salvar) e ao lado a <b>GALERIA DOS 8 FORMATOS</b> (círculo, diamante, estrela, anel, seta, quadrado, cruz, oval) redesenha na hora a cada ajuste de cor/tamanho/brilho. <b style="color:#cfe9ff">NOVA ABA — PADRÕES DOS BOSSES</b>: o catálogo REAL dos padrões dos 4 senhores (Bruxo, Carrasco, Viúva, Golem — clássicos, exclusivos kaizo e as SPELL CARDS assinatura) com a descrição de <b>como cada um funciona</b>, o botão <b>SIMULAR NA ÁREA DE TESTES</b> (com Fase II ligável) e a <b>SUBSTITUIÇÃO</b>: escolha um padrão SEU para entrar no lugar de qualquer padrão nativo quando o chefe sortear ele. <b style="color:#cfe9ff">SPELL CARDS DO JOGO</b>: a aba de spell cards agora lista os feitiços reais (Grimório Rasgado, Investida Ricochete, Avanço Triplo, Enxame Vampiro, Fios da Morte, Maré de Magma) com <b>VER AO VIVO</b> — e o modo de uso virou escolha: <b>FAZER PARA O BOSS</b> (substitui TODOS os ataques) ou <b>SUBSTITUIR UM padrão específico</b> dele (o resto do moveset continua). <b style="color:#cfe9ff">ÁREA DE TESTES COM CHEFE REAL</b>: além de testar a sua spell contra o Thor, o estúdio agora SIMULA o padrão real de qualquer senhor com a <b>IA verdadeira do jogo</b> — telegráfos, minas, fios da morte, maré de magma, cura do morcego, Fase II — e nada disso toca a run real (a simulação troca os cenários do motor num try/finally e devolve tudo). No console: __MODS.simBoss(&quot;gz&quot;,&quot;kz_magma&quot;) pula direto para a simulação.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">57. v1.7.0 — O ESTÚDIO DAS ALMAS</div>'+'<div style="margin-left:14px;margin-bottom:10px">O jogo virou PLATAFORMA DE CRIAÇÃO — o <b style="color:#c9a0ff">EDITOR DE MODS</b> agora mora no menu principal, sem download nenhum e sem conhecimento de programação. <b style="color:#ffd9a0">GERENCIADOR</b>: crie quantos mods quiser, ative/desative quando quiser, exporte/importe como JSON (arquivo ou copiar/colar) — os arquivos originais do jogo NUNCA são sobrescritos; o mod de criação <b>CRIAÇÃO</b> já vem instalado de brinde, com exemplos prontos. <b style="color:#cfe9ff">EDITOR DE BALAS</b>: escolha qualquer família de bala do jogo pela cor e mude forma (círculo, diamante, estrela, anel, seta, quadrado, cruz, oval), tamanho, cor, transparência, brilho, rastro, rotação e VELOCIDADE — com pré-visualização ao vivo; com o mod ATIVADO, as balas reais do jogo mudam na hora. <b style="color:#cfe9ff">EDITOR DE PADRÕES</b>: desenhe a formação COM O MOUSE (o traço vira balas) ou use espiral/anel/estrela/onda — quantidade, velocidade, rotação por vaga, tamanho e cor. <b style="color:#cfe9ff">EDITOR DE SPELL CARDS</b>: encadeie padrões em fases (atraso, intervalo, vezes, segura), dê nome, dono e dificuldade — e VINCLE a um senhor de mapa (Bruxo, Carrasco, Viúva ou Golem): com o mod ativo, o chefe lança a SUA spell card em vez dos padrões normais, com placa SPELL CARD. <b style="color:#cfe9ff">EDITOR DE SPRITES</b>: Thor, os quatro senhores, Cérbero, cabeças, Caronte, a Besta, o piso e mais — desenhe pixel a pixel (lápis, borracha, balde, conta-gotas, desfazer) com o sprite ORIGINAL como referência semitransparente (opacidade ajustável, lado a lado, dimensões e nome do arquivo à vista). <b style="color:#cfe9ff">ÁREA DE TESTES</b>: arena com Thor controlável (WASD/setas, SHIFT para o foco com a hitbox pequena) contra a sua spell card — pausar (P), passo a passo (.), reiniciar (R). <b style="color:#9c8f7c">O Editor de Mapas completo fica para uma versão futura</b> — o resto do estúdio já está de pé.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">56. v1.6.4 — A CORTE DUPLA</div>'+'<div style="margin-left:14px;margin-bottom:10px">A ENXURRADA CHEGOU AOS SENHORES DE MAPA — e o Carrasco da Penumbra aprendeu DOIS movesets novos, pedidos seus. <b style="color:#e8455a">O AVANÇO TRIPLO</b>: ele atravessa a arena, BATE NA PAREDE e a direção do PRÓXIMO avanço aparece no chão (linha carmesim tracejada) — e assim três vezes; na TERCEIRA investida ele usa <b>O ATAQUE DA PÁ</b>: um anel de aviso se abre ao redor dele e o golpe desce de perto (anel de estilhaços com brecha + a lâmina varrendo na direção que ele olha). Ler o chão é sobreviver — a rota de cada avanço é visível. <b style="color:#c25a7a">O ENXAME VAMPIRO</b>: ele solta morcegos de asas roxas que perseguem o Thor — e <b>CADA morcego que ACERTA CURA a vida do Carrasco</b> (o número verde em cima dele mostra a cura); os morcegos podem ser DERRUBADOS a tiro — abater o enxame é negar a cura. Na FASE II: duas vagas de morcegos e cura maior. <b style="color:#ff2450">A CORTE DUPLA</b>: <b>5% das salas de chefe acordam DOIS senhores de uma vez</b> — o gêmeo nasce com 80% da vida, e o aviso A CORTE DUPLA entra na tela. <b style="color:#ffd9a0">E OS PADRÕES KAIZO FICARAM MAIS RÁPIDOS E MAIS CHEIOS</b>: em sala kaizo <b>TODAS as balas voam 30% mais rápido</b> (a ENXURRADA), os padrões exclusivos e clássicos soltam MUITO mais projéteis (sigilos 9/6, leques 7/5, cometas 6/4 vagas, fileiras do Grimório 15, guilhotinas 9 lâminas × 4/3 colunas, estilhaços 18/13, anéis de 24-32, maré de 4 cristas e 14 vagas…), e todos os senhores re-atacam ~23% mais rápido no modo kaizo. As brechas continuam garantidas: nenhuma onda fecha todas as rotas de fuga.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">55. v1.6.3 — OS QUATRO FEITIÇOS</div>'+'<div style="margin-left:14px;margin-bottom:10px">Os quatro senhores de mapa ganharam o <b>SEU feitiço assinatura</b> — e a Fase II de cada um virou transformação mecânica de verdade. <b style="color:#c9a0ff">O BRUXO rasga o GRIMÓRIO</b>: linhas mágicas atravessam a arena, piscam em roxo e cospem FILEIRAS de projéteis — cada fileira tem uma brecha de duas vagas, então sempre existe rota segura; na <b>FASE II</b> o grimório faz LEITURA DUPLA: primeiro as linhas HORIZONTAIS, depois as DIAGONAIS, com aviso visual próprio (magenta claro, pisca mais rápido). <b style="color:#e8455a">O CARRASCO aprendeu a INVESTIDA RICOCHETE</b>: atravessa a arena, BATE na parede (zona de impacto + estilhaços com brecha) e prepara OUTRA investida num ângulo diferente — a direção de cada uma aparece NO CHÃO antes do movimento; na <b>FASE II</b> são TRÊS investidas em cadeia, com pausas curtas. <b style="color:#dfe7ee">A VIÚVA tece os FIOS DA MORTE</b>: fios finos nascem entre âncoras fixas, depois TENSIONAM e passam a CORTAR quem cruza o segmento; na <b>FASE II</b> eles ativam em sequência formando triângulo e diagonais, os já ativos continuam visíveis até acabar — e um lado da arena fica sempre aberto (nenhuma combinação fecha todas as rotas de fuga). <b style="color:#ff8f3d">O GOLEM solta a MARÉ DE MAGMA</b>: sinais luminosos verdes mostram a direção e as posições das zonas seguras ANTES de a onda atravessar a arena em três cristas; na <b>FASE II</b> uma SEGUNDA onda vem de outra direção DEPOIS que a primeira desaparece — e algumas zonas seguras mudam de lugar. Cada card entra com a placa SPELL CARD e domina o sorteio na Fase II. <b style="color:#ffd9a0">E um conserto de anos-luz</b>: o Carrasco, a Viúva e o Golem tinham feitiços exclusivos kaizo PRONTOS desde a v0.9.16 — mas NUNCA os lançavam (só o Bruxo sorteava os dele). Agora os quatro minibosses sorteiam os exclusivos, com a marca branca de aviso no chão.</div>'+'<div style="margin-left:14px;margin-bottom:10px"><b style="color:#9fd8ff">A LOJA DO ERRANTE acende a bênção selecionada</b>: na feira do chão, o nome da mercadoria mais próxima ganha uma PLACA clara com moldura azul e letras AZUL-ESCURAS, bem legíveis de ler (era um texto pequeno cor de pergaminho que sumia no chão); na loja aberta (Z), a carta sob o mouse/toque acende num fundo claro com o NOME em azul-escuro. <b style="color:#ffd9a0">NADA MAIS FICA EM CIMA DA PAREDE</b>: bênção, pacto, coração, almas, fagulha — se um drop nascer ou parar DENTRO da parede, ele desliza sozinho de volta ao chão jogável; se cair totalmente FORA do mapa, retorna ao MEIO da sala (conferido a cada quadro — nada fica perdido onde a mão não alcança). <b style="color:#d9465a">O PORTAL ESPERA A BÊNÇÃO</b>: derrotou o senhor de mapa e a bênção dele está no chão? O portal NÃO nasce — ele aparece no instante em que você a pega (na primeira vez, um aviso explica). E a <b style="color:#ffe9b8">COLHER COMICAMENTE GRANDE</b> ficou sem sermão de vez: a descrição agora diz só <i>é uma colher. comicamente grande.</i></div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">54. v1.6.2 — O CARROSSEL DAS ARMAS</div>'+'<div style="margin-left:14px;margin-bottom:10px">Três pedidos seus, todos dentro. <b style="color:#cfe9ff">A ESCOLHA DE ARMAS VIROU CARROSSEL</b> — em vez da parede de 8 cartas, agora é <b>UMA ARMA POR VEZ</b>: os botões <b style="color:#ffd9a0">◀ ▶ nas laterais</b> (ou as <b>SETAS ← → do teclado</b>) trocam de lado, a carta desliza devagarinho, e <b style="color:#fffdf4">ENTER ou ESPAÇO confirma a arma da frente</b>; os <b>pontos embaixo</b> pulam direto para qualquer arma (o NORMAL/HARD e o VOLTAR ficaram onde sempre estiveram). Funciona em todos os caminhos que abrem a escolha — descida de verdade, portão e teste do Limbo. <b style="color:#d9465a">E O LIMBO PAROU DE TRAVAR</b> — a causa era a <b>parede espelhada</b>: a varredura das bordas e os DOIS gradientes com recorte de CADA segmento rodavam <b>a cada quadro</b>, dezenas de vezes por segundo. Agora os trechos externos são <b>pré-calculados na construção da sala</b> (com corridas mescladas) e a parte estática — brilho leitoso, reflexo, rachaduras — fica pintada <b>numa camada em cache</b>: o quadro inteiro virou <b>1 cópia de imagem + traços baratos</b>. As rachaduras das paredes agora nascem fixas por sala (antes piscavam). <b style="color:#9c8f7c">A FASE CINZA DO LIMBO FICOU LISA</b> — no último véu (O LIMBO INFERNAL — FASE 2), o paraíso acaba de vez: o chão é <b>cinza liso, sem estrutura nenhuma</b> — sem grama, pedras, flores, rachaduras, <b>sem paredes espelhadas</b>, sem pólen dourado — e lá fora é o mesmo cinza, um tom abaixo: <b>sem céu, sem catedrais, sem árvores</b>. A única marca no piso é a borda de sempre, num traço cinza-escuro. O véu de fogo e as fissuras com brasa morreram nessa fase (seguem na fase anterior, que continua queimando). O teste rápido do menu (LIMBO · FASE FINAL · TESTE) cai direto nela.</div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">53. v1.6.1 — A BESTA TEM ROSTO</div>'+'<div style="margin-left:14px;margin-bottom:10px">Dois pedidos seus, dentro. <b style="color:#d9465a">A BESTA DA MORTE ACEITA A SUA ARTE</b>: coloque um PNG (ou JPG/WEBP/GIF) na pasta <b>assets/sprites/</b> com o nome <b>besta.png</b> (também vale <b>besta-das-trevas.png</b>, <b>fera.png</b>, <b>besta-do-abismo.png</b>… — a lista completa no COLOQUE-SPRITES-AQUI.txt) e, na tela de morte, a SUA besta entra no lugar da vetorial — chifres, cabeça, olhos em brasa e sorriso saem; o texto de provação e a assinatura <i>— A BESTA DO ABISMO —</i> continuam. Detecta sozinho, com o jogo rodando (re-escaneia a cada ~15s e a cada foco da janela), e sem o arquivo nada muda. <b style="color:#cfe9ff">E O JOGO INTEIRO AGORA SE ENCAIXA NA SUA RESOLUÇÃO</b> — 1080p, 1440p, 4K, notebook, celular — preenchendo a janela inteira <b>sem barra de rolagem</b>: a janela mudou (F11, girar o aparelho, arrastar a borda)? O jogo re-encaixa na hora, com um segundo passe atrasado para navegadores teimosos. De quebra: em janelas onde os menus não cabem, os painéis agora rolam POR DENTRO — nenhum botão fica cortado; em monitores que cabem tudo, nada muda.</div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">52. v1.6.0 — O CONSERTO DAS SALAS</div>'+'<div style="margin-left:14px;margin-bottom:10px">Um pacote de consertos pedidos por você, todos dentro das salas. <b style="color:#ffd9a0">SALAS SECRETAS</b>: <b style="color:#cfe9ff">TODA entrada agora tem 10% de revelar uma BÊNÇÃO ALEATÓRIA</b> — inclusive revisitas (se a visita já deixou uma bênção no chão, ela não duplica). E <b style="color:#d9465a">se o VELHO REI estiver esperando na sala secreta, A SALA SE FECHA</b> — as portas e a rachadura trancam atrás de você e <b>não existe volta até o rei cair</b> (a despedida dele reabre tudo, como sempre fez). <b style="color:#ff8f3d">PORTAS AGORA CEDEM À EXPLOSÃO</b>: a bomba (Porta das Sombras), o tiro explosivo (Pólvora) e a <b>FAGULHA [Q]</b> destroem portas trancadas <b>por inimigos</b> (combate/desafio varrido pela metade) ou <b>por enigma</b> (puzzle não resolvido) — a explosão abre a passagem e a porta destruída nasce aberta se você voltar. <b style="color:#cfe9ff">CHEFE, MINI-CHEFE e chefe secreto continuam sagrados</b> — essas trancas nenhuma bomba quebra. <b style="color:#bfd8e8">NADA MAIS DESAPARECE</b>: bênçãos, pactos (itens ativos), almas, vida e fagulhas no chão <b>não expiram mais pelo tempo</b> (a regra dos 11 segundos morreu) e <b>não somem mais ao sair da sala</b> — os itens ficam guardados na sala e voltam exatamente onde estavam quando você reentra. <b style="color:#e6dac4">A HITBOX DO THOR FICOU MENOR</b> — de 5px para <b>4px</b> (um tiro agora passa raspando onde antes acertava) — e o <b style="color:#ff2e55">ponto carmesim segue aparecendo SÓ com SHIFT segurado</b> (FOCO): soltou, some. No escolhidor de armas, <b>as descrições do O CREDOR e da COLHER COMICAMENTE GRANDE ficaram curtas</b> — o essencial, sem sermão. E de quebra: <b style="color:#c9a0ff">botão LIMBO · FASE FINAL · TESTE no menu</b> — escolha a arma e caia direto na fase 4 do Limbo (O LIMBO INFERNAL — FASE 2, andar 9) para conferir o fim da descida sem jogar do começo (temporário, igual ao botão do portão).</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">51. v1.5.9 — O ATALHO DE VOLTA</div>'+'<div style="margin-left:14px;margin-bottom:10px">Correção de rota, pedida por você. <b style="color:#c9a0ff">O botão PORTÃO DO CÉRBERUS · TESTE está DE VOLTA no menu</b> — a remoção da v1.5.8 foi longe demais: você vai testar a luta do Cérbero agora, e o atalho continua sendo o caminho mais rápido (escolha a arma e caia direto no caminho do portão, sem descer andar nenhum). <b style="color:#cfe9ff">Os sprites de teste CONTINUAM FORA</b> — a pasta COLOQUE SPRITES AQUI segue limpa para a SUA arte, e o jogo segue desenhando a <b style="color:#ffd9a0">ARTE VETORIAL original</b> em todo mundo. <b style="color:#9c8f7c">NADA mecânico mudou</b>: a cutscene da fera dormindo, o texto lento, a apresentação em IM Fell English SC, o pó, a mensagem vermelha, o remake com a vida se regenerando e os dois temas do Cérbero seguem exatamente como estavam.</div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">50. v1.5.8 — O PALCO ESTÁ PRONTO</div>'+'<div style="margin-left:14px;margin-bottom:10px">Os ensaios acabaram — o palco ficou limpo. <b style="color:#cfe9ff">OS SPRITES DE TESTE SAÍRAM</b>: as doze artes de teste que moravam na raiz da pasta assets/sprites (thor, cérbero, caronte, vigia, morcego, velho rei, feiticeiro, peão, sombra, piso, lamentadora e a cópia com espaço no nome) foram removidas — a pasta <b>COLOQUE SPRITES AQUI</b> está limpa para a SUA arte e o jogo volta a desenhar a <b style="color:#ffd9a0">ARTE VETORIAL original</b> em todo mundo (colou um PNG seu lá? ele entra sozinho, como sempre — e sem arquivo nada quebra, nunca fica invisível). E o <b style="color:#c9a0ff">botão temporário PORTÃO DO CÉRBERUS · TESTE saiu do menu</b> — o portão está aprovado, e o caminho até ele volta a ser <b>a descida de verdade</b>. <b style="color:#9c8f7c">NADA mecânico mudou</b>: a cutscene da fera dormindo, o texto lento, a apresentação em IM Fell English SC, o pó, a mensagem vermelha, o remake com a vida se regenerando e os dois temas do Cérbero seguem exatamente como estavam.</div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">49. v1.5.7 — O GUARDIÃO DA PASSAGEM</div>'+'<div style="margin-left:14px;margin-bottom:10px">O encontro com o guardião ganhou CERIMÔNIA. <b style="color:#cfe9ff">O THOR AGORA SAI DO PORTÃO POR BAIXO</b> — o vão fica no CHÃO da arena, ele emerge SUBINDO e fica lá embaixo, e o <b style="color:#fffdf4">CÉRBERO fica NA FRENTE dele</b> — o encontro é de frente, olho a olho. O <b style="color:#9c8f7c">texto antigo ficou MAIS LENTO</b> (letra por letra, sem pressa) e a fera acorda AINDA MAIS DEVAGAR — cada cabeça ergue no seu tempo. E a luta abre com <b style="color:#ffd9a0">A APRESENTAÇÃO DO BOSS</b>, na fonte de pergaminho <b>IM Fell English SC</b>: <b style="color:#cfe9ff">a tela escurece rápido</b>, <b>o som ambiente fica abafado</b>, a inscrição pequena <i>O GUARDIÃO DA PASSAGEM</i> surge primeiro — aí <b style="color:#fffdf4">CERBERUS irrompe no centro</b> com impacto sonoro grave, breve expansão de luz e ele RUGINDO; a <b style="color:#ff2e55">linha carmesim</b> desenha-se e revela o epíteto <i>O CÃO DAS TRÊS SENTENÇAS</i> — e o nome <b>desaparece LENTO quando o chefe começa a se mover</b>. <b style="color:#d9465a">NO REMAKE, A MESMA CERIMÔNIA</b>: o cenário escurece BEM SUTILMENTE até a transformação completar, a criatura emite LUZ BRANCA, e a segunda apresentação entra quando ele se transforma — <i>CERBERUS · O CÃO NEGRO DO JUÍZO CARMESIM</i> — o momento em que a luta muda de escala. E a pasta de músicas ganhou os DOIS temas: <b style="color:#ffd9a0">guardião do inferno</b> (Cérbero 1) e <b style="color:#ffd9a0">juiz da sentença negra</b> (Cérbero 2) em assets/audio/music — colocou o arquivo, ele toca; sem arquivo, os temas sintetizados embutidos seguem.</div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">48. v1.5.6 — A FERA DORME</div>'+'<div style="margin-left:14px;margin-bottom:10px">A cutscene antiga do Cérbero finalmente existe de verdade. <b style="color:#fffdf4">O SPRITE ANTIGO DO CÉRBERO — o de verdade, corpo, pernas, cauda e as três cabeças — DORME no fundo da arena</b>: olhos fechados, cabeças recolhidas, roncando, enquanto o Thor desce do vão sozinho e o portão se fecha atrás dele. E ele vai <b style="color:#cfe9ff">ACORDANDO LENTO</b> — cada cabeça ergue no seu tempo, os olhos abrindo devagar — enquanto o texto antigo aparece na tela, letra por letra: <i>“Cérbero, fera cruel e disforme, late como um cão com suas três goelas.”</i> <b style="color:#ffd9a0">Quando o texto acaba, o TÍTULO ÚNICO DO BOSS entra e a luta começa</b>. E a morte do antigo mudou: <b style="color:#9c8f7c">ele APENAS VIRA PÓ — sem nada</b>; o corpo fica na cena se desfazendo em pó cinza, sem cura na hora, sem aviso, sem música. <b style="color:#ff2e55">Poucos segundos depois, a mensagem vermelha entra na tela: “oh cão, voce cometeu um grave erro”</b> — e aí sim a cutscene do REMAKE começa, com <b style="color:#ffd9a0">a vida de Thor se regenerando sozinha</b> enquanto o Cérbero novo desperta o diálogo — cheia antes do primeiro padrão da sentença.</div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">47. v1.5.5 — O PORTÃO DE FRENTE</div>'+'<div style="margin-left:14px;margin-bottom:10px">O portão virou a cara do vulcão. <b style="color:#ff8f3d">ELE ESTÁ DE FRENTE, NO ALTO</b> — embutido na FACE NORTE de basalto que ocupa o horizonte inteiro do Caminho do Portão: a laje vulcânica agora atravessa a tela de parede a parede e você SOBE até a moldura como quem vai entrar de verdade. E a abertura foi consertada: <b style="color:#d9465a">as folhas estavam deslizando para o centro — parecia que o portão se FECHAVA</b>; agora as bordas externas ficam presas e as folhas recuam para FORA, abrindo de verdade, com o selo carmesim se partindo no início. <b style="color:#fffdf4">O DENTRO do portão ficou TOTALMENTE BRANCO</b> — o vão revelado é preenchido por luz plena (a bainha amarelo-alaranjada e as chamas continuam ao redor), não mais uma fenda fina. E a entrada virou cena: <b style="color:#cfe9ff">aberto o portão, o Thor anda sozinho e ENTRA pelo vão</b> — o branco o engole — e <b style="color:#ff2e55">AO ENTRAR a cutscene antiga do Cérbero começa</b> (portão da arena, as três cabeças, o snap, a luta), exatamente antes do combate — nada de trocar isso. Na cutscene, o portão também abriu de verdade (mesma correção das folhas).</div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">46. v1.5.4 — A SEGUNDA DESCIDA</div>'+'<div style="margin-left:14px;margin-bottom:10px">O portão mudou de lugar e a descida mudou de fim. <b style="color:#ff8f3d">O PORTÃO agora fica NO MEIO da tela</b>, embutido num PAREDÃO de basalto que desce do céu ao chão e ocupa a metade direita — a laje vulcânica termina exatamente nele, sem vão nenhum. E a abertura virou um clarão: <b style="color:#fffdf4">no MEIO, um BRANCO BRILHANTE</b>; <b style="color:#ff8f3d">ao redor, chamas amarelo-alaranjadas</b> — faíscas brancas nascendo da fenda, línguas de fogo nas beiradas das folhas e a radiação inundando a tela. <b style="color:#ff2e55">A ARENA do Cérbero ficou com o MESMO VISUAL da PENUMBRA INFERNAL</b> — o chão ebranquecido queimando nas bordas, tremulando, com fogo fora do cenário — desde a cutscene antiga de entrada (ela segue EXATAMENTE como era: portão abrindo devagar, as três cabeças, o snap) até a luta e o fim. E o final da vitória trocou: <b style="color:#7fb8ff">NÃO existe mais portão do inferno no fim</b> — no lugar dele abre <b style="color:#7fb8ff">A SEGUNDA DESCIDA</b>, uma escada fria e grande que desce da arena direto para o <b>CORREDOR AZULADO</b>; atravessou, vem <b>CARONTE</b>, depois o LIMBO em 4 fases e o Juiz Sem Rosto. O segredo do corredor (O Thor que Não Desceu) acompanhou o portão para o centro da laje, e nenhuma escada de andar pode nascer no meio da luta.</div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">45. v1.5.3 — O PORTÃO RESPONDE</div>'+'<div style="margin-left:14px;margin-bottom:10px">O portão parou de enganar: <b style="color:#ff8f3d">A CAUSA era um visitante invisível</b> — O THOR QUE NÃO DESCEU caía sobre o corredor sem nunca ser desenhado, e enquanto ele resistia o portão não respondia. Agora ele <b>aparece de verdade</b> (silhueta roxa + barra de vida), nasce no meio da laje e ganhou uma <b>válvula: fuja dele por 4 segundos (ou sobreviva 75s) e ele desiste e volta para a fila</b> — o portão fica SEMPRE alcançável. E o cenário parou de engolir o Thor: <b style="color:#d9465a">O CAMINHO DO PORTÃO ganhou uma LAJE DE PEDRA de verdade</b> — juntas de lajes, borda acesa pela lava, paredes de basalto dos dois lados e um limite duro: <b>o chão TERMINA antes do portão</b>; não existe mais andar por cima das colunas nem atravessar a moldura. De quebra, um <b style="color:#c9a0ff">BOTÃO DE TESTE no menu (PORTÃO DO CÉRBERUS · TESTE)</b> — escolha a arma e caia direto no corredor para conferir o [Z] sem descer andar nenhum (temporário — sai quando aprovado).</div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">44. v1.5.2 — O PORTÃO QUE ESPERA UMA MÃO</div>'+'<div style="margin-left:14px;margin-bottom:10px">A ida ao Cérbero virou lugar de verdade. <b style="color:#ff8f3d">O CAMINHO DO PORTÃO virou um MINI MAPA VULCÂNICO</b>: chão de pedra marrom-escura sob um céu vermelho vivo, fissuras de lava respirando, poças incandescentes, colunas de basalto e brasas subindo — e no fim dele, <b style="color:#d9465a">O PORTÃO ENORME</b>: nada de abrir sozinho — <b>chegue perto e aperte [Z]</b> (ou o botão de interação do toque) e as duas folhas de pedra se abrem devagar para a arena do Cérbero. Encostou sem apertar por 10 segundos? O calor o vence e ele cede — <b>ninguém fica preso</b>. <b style="color:#ff2e55">VENCEU O ANTIGO? A SENTENÇA ASSUME NA HORA</b> — derrubou as três cabeças do guardião e a forma remasterizada desperta de imediato, agora com aviso claro (<i>O GUARDIÃO TOMBOU — a sentença desperta das três bocas</i>). E as <b style="color:#cfe9ff">PORTAS deixaram de ser portas</b>: em toda a descida elas são apenas <b>passagens da cor do chão</b> — o vão pintado com o próprio piso da sala (trancada, uma costura fina marca o bloqueio; aberta, uma luz discreta convida) — <b>só a escola mantém as portas dela</b>, como sempre foi.</div>'+'<div style="color:#e6dac4;font-size:13px;margin:10px 0">43. v1.5.1 — AS PORTAS SE ABREM</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A GRANDE DESTRAVA. <b style="color:#d9465a">A PORTA PARA O CÉRBERO NUNCA MAIS TRAVA</b>: a causa era a decoração nova — um arco/estátua grande podia nascer colado numa porta, e o raio de colisão dele (+ o corpo do Thor) empurrava você para longe do gatilho; como a sala re-sorteava as estruturas a cada entrada, a porta podia "fechar" do nada. Agora <b>progresso acima de decoração</b>: perto de portas abertas, da escada para o fundo e do portal, o raio das estruturas <b>encolhe sozinho</b> (e vira caminho livre se precisar) — e as composições novas já nascem com o dobro da folga das portas. <b style="color:#ffd9a0">A SALA NÃO MUDA MAIS</b>: a primeira composição de estruturas de cada sala fica <b>guardada</b> — saiu e voltou, tudo no mesmo lugar, no mesmo tamanho (a janela inclusive). <b style="color:#cfe9ff">O SELETOR DE DIFICULDADE virou uma escada</b>: <b>FÁCIL primeiro</b> e <b>KAIZO por último</b> (FÁCIL · NORMAL · HARD · PUNIÇÃO · ABISMO · PENITÊNCIA · KAIZO) — e no modo KAIZO <b>todos os bosses do mapa nascem kaizo de cara</b>, é a proposta do modo. <b style="color:#eef2f4">O BOSS QUE REPETE virou NEO</b>: nome <b>NEO —</b>, ataques <b>quase contínuos</b> (encadeia padrões com 55% de chance, aviso 40% mais curto, intervalo pela metade) e <b>tiros 30% mais rápidos</b> — rápido de ler, rápido de desviar. <b style="color:#ff2450">PENUMBRA INFERNAL legível</b>: as almas agora nascem em <b>vermelho/azul muito fortes</b> com brilho e contorno (o chão branco as engolia) e os tiros do Thor ganharam <b>halo escuro + borda de brasa</b>. E o <b style="color:#ff8f3d">MORCEGO FLAMEJANTE só caça a partir da Penumbra Infernal</b> (andar 3+).</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">42. v1.5.0 — OS SALÕES DO DANMAKU</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O inferno foi reformado por dentro. <b style="color:#ffd9a0">SALAS MAIORES DE VERDADE</b> (~1,35× a largura, ~1,25× a altura — as arenas de chefe ~1,69× a área) com <b style="color:#cfe9ff">câmera que acompanha o Thor</b> pelos limites da sala — HUD, vinheta e efeitos de tela continuam fixos. <b style="color:#ffd9a0">TRANSIÇÃO DESLIZANTE</b>: atravessou a porta, a sala antiga sai deslizando e a nova entra pelo lado certo, já com <b>os inimigos NOS SEUS POSTOS</b> — nada de ondas surgindo do nada nas dificuldades novas. <b style="color:#ffe9b8">OS SALÕES FICARAM HABITADOS</b>: estruturas nascem de <b>composições predefinidas</b> (corredores de estátuas, ilhas de colunas, altares em ruínas…) com variações e anti-repetição — nada de espalhar objetos no dado. <b style="color:#eef2f4">APRESENTAÇÃO VS</b>: Thor encara o mini-chefe de um lado ao outro da tela antes da luta — só para quem NÃO tinha cena própria. <b style="color:#d9465a">O ANEL COM BRECHA ÚNICA se aposentou</b> no Normal e acima: a Viúva, o Golem, o Rei, o Erro 404, os Cavaleiros e as cabeças do Cérbero agora cospem <b>CÍRCULOS COMPLETOS</b> (rotativos, consecutivos, alternados) e <b>PADRÕES EM X</b> (duplos, combinados com círculo) — densidade e velocidade escalando até o Kaizo. <b style="color:#9d6bb5">O CREDOR aprendeu a balançar</b>: botão direito na PAREDE planta a âncora — pende da corda, balança e solta para voar com o impulso. <b style="color:#ff8f3d">NOVO MODO FÁCIL</b>: o combate de sempre, com os padrões antigos, as arenas antigas e o anel com a brecha de sempre — o perfil legado preservado. E a citação de Dante no menu só vira a página quando você entra no jogo de novo.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">41. v1.4.7 — MÃOS VAZIAS</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A descida nova não lembra mais nada: <b style="color:#ffd9a0">THOR DESCE ZERADO</b> — sem bênçãos, sem pactos, sem itens acumulados e <b style="color:#9d6bb5">ATÉ A ALMA NEGRA fica no rio</b>: os itens míticos (a ALMA NEGRA DE CARONTE, o Coração do Cérbero, a Foice da Morte…) <b>deixaram de ser oferecidos no começo de cada run</b>. Quem quer o latido de novo, desce e derrota o Caronte <b>na própria descida</b> — como sempre foi dentro dela. A única ajuda que atravessa o rio entre uma descida e outra é a <b style="color:#9fd8ff">RELÍQUIA</b>: a Sala das Relíquias continua inteira (com 2+ desbloqueadas, você escolhe UMA para descer). E o menu de <b style="color:#ffd9a0">CONQUISTAS ganhou 14 registros novos</b> — todos no formato de sempre: enquanto não conquista, você vê <b>APENAS UMA DICA</b> (e a régua, quando existe número) — do ALUNO DA MORTE ao O CÔRO COMPLETO, passando por A VOZ NO RIO.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">40. v1.4.6 — OITO BARRAS, UM ALVO</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A sentença virou <b style="color:#ff2e55">8 SPELL CARDS = 8 BARRAS DE VIDA</b>: cada barra é uma card, <b>nesta ordem</b> — Rosário, Cruz, Espiral, Caçada, Eclipse, Chuva, Três Sentenças e o <b style="color:#ff2e55">Vermelho Absoluto</b> — esvaziou a barra, a card <b>QUEBRA</b> (aviso na tela + faixa carmesim marcada na barra), pausa de no máximo <b>2 segundos</b> e a próxima sobe com a barra cheia. A oitava barra zerada é a única morte. Dentro da card ele <b>ataca sem parar</b> (o padrão recomeça sozinho) — e onde uma cabeça atacava sozinha, agora <b>AS TRÊS ATIRAM AO MESMO TEMPO</b>: rajadas, leques de 17, espirais e a chuva lateral saem das três bocas juntas. A <b>hitbox dela cresceu de novo</b> (corpo 118 + tronco 95, cabeças 32, contato 84) e <b style="color:#d9465a">ELE SEMPRE TOMA DANO</b>: ritual, descanso, salto e até a <b>transformação</b> (depois do clarão) — nenhum momento da luta mais engole tiros. E o Thor virou <b style="color:#cfe9ff">alvo de Touhou</b>: a hitbox de dano dele agora tem <b style="color:#cfe9ff">o tamanho de um tiro</b> (5px — o corpo visual continua para portas e itens) e <b style="color:#ffd9a0">segurar SHIFT mostra o círculo</b> branco com o ponto carmesim — mas deixa o passo lento. O <b style="color:#ff8f3d">DESVIO mudou de tecla</b>: agora é <b>TOQUE DUPLO rápido</b> na direção (←←, →→, ↑↑, ↓↓) — o botão de desvio do toque continua igual.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">39. v1.4.5 — O RIO FINALMENTE LEVA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A travessia que travava <b style="color:#7fb8ff">morreu de vez</b>: o <b style="color:#cfe9ff">BUG DO THOR INVISÍVEL após aceitar o Caronte</b> era o estado do barco preso para sempre — o limbo montava por baixo mas a cena do barco nunca saía, e nos últimos instantes Thor nem era desenhado: ele "sumia" e o LIMBO nunca chegava. Agora o barco atraca de verdade — Thor desce do barco VISÍVEL e o LIMBO abre na hora. E o <b style="color:#ff8f3d">corredor voltou a esquentar</b>: ele começa <b style="color:#d9465a">vermelho de verdade</b> — o calor da Garganta insiste nas paredes e brasas sobem do chão — e só <b>esfria devagar</b>, passo a passo, até a névoa fria tomar conta perto do barco (as cores antigas eram tão escuras que o vermelho era invisível). E o <b style="color:#ff2e55">CÉRBERO recebeu a especificação COMPLETA das spell cards — sem piedade</b>: o Rosário agora são anéis TRIPLOS com lacunas determinísticas + <b>dentes laterais persistentes</b> (arcos da esquerda, linhas diagonais da direita) + fechamento com divisão ±18°; a Cruz ganhou o <b>leque central de 13 a 70°</b>, a <b>cruz diagonal de 11</b> (2ª execução invertendo) e a <b>cruz quebrada</b> migrando; a Espiral roda <b>correntes + serpente dupla + nó carmesim</b> com espiral final que se divide; a Caçada agora usa <b>HISTÓRICO DE POSIÇÕES</b> (atual · -0,25s · -0,5s) com 6 salvas atrasadas, <b>pinças triplas</b> e marcas onde a do meio FALHA de propósito; o Eclipse empilha 28/36/44 posições + lua partida + anel final de abertura mínima; a Chuva tem <b>8 posições com corredores que migram</b> (na difícil, sobra UM), linhas laterais, impacto central com colunas fechando e chuva diagonal final; as Três Sentenças viraram <b>5 rajadas + leques de 17 + espiral de 2,5s + veredito</b> em 3 velocidades; e o Vermelho Absoluto rodou os <b>7 eventos do registro</b> — firmamento, corredor condenado, espiral tripla, tempestade das três bocas, o círculo se fecha, última sentença e 4 combinações finais. Por cima de tudo: <b>teto de 500 balas</b>, <b>densidade e duração escalando pela tabela de dificuldade</b> e o tempo máximo de cada spell card cortando a execução — quanto pior o modo, menos tempo você tem.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">38. v1.4.4 — AS SPELL CARDS DO JUÍZO CARMESIM</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A terceira fase do Cérbero virou <b style="color:#ff2e55">danmaku de verdade</b>: cada um dos 8 padrões agora é uma <b>SPELL CARD</b> — ritual de ativação (o disparo anterior se interrompe, pontos carmesins acendem no ar, os três pescoços se erguem, um <b>sino distante</b> toca) e a <b>placa SPELL CARD no canto superior direito</b>, com moldura fina de registro ritualístico, entrada deslizante e o nome completo — <b>Cão Branco 「Rosário dos Trinta e Três Dentes」</b>, 「Cruz da Matilha」, 「Espiral da Serpente」, 「Caçada Sem Rastro」, 「Eclipse Carmesim」, 「Chuva do Último Círculo」, 「Três Sentenças」 e o <b style="color:#ff2e55">「Vermelho Absoluto」</b> — discreto durante o ataque e apagando quando o padrão termina. A criatura <b>voltou a ser BRANCA</b> na luta real (a arena escura e a clareira sob Thor ficam): corpo luminoso com os detalhes lavados e <b>fissuras carmesins na boca e nos olhos</b> quando a spell card chega — no laboratório a obsidiana fica, para ler no chão branco. E as correções pedidas: <b style="color:#ff8f3d">derrotou o FERREIRO na Garganta? A ESCADA DO FRIO desce onde ele caiu</b> — pisou nela e você desce para o corredor azulado (→ Caronte → Limbo); <b>nunca mais fase infinita</b> (e se a escada sumir por qualquer motivo, ela renasce); a <b>barra do CÉRBERO não aparece mais na Garganta</b>; os rótulos de fase corrigidos — <b style="color:#7fb8ff">LIMBO INFERNAL</b> deixa de mostrar "LIMBO · FASE", e as entradas de zona agora anunciam <b>PENUMBRA INFERNAL</b> (ao acabar a penumbra normal) e <b>O LIMBO INFERNAL</b> em placa grande; a <b style="color:#ff8f3d">FAGULHA agora quebra a JANELA do ERRO 404</b> (tiro explosivo de verdade) com textos mínimos — só o [Q] na tela; o <b>HUD do item ativo mostra só SPC</b> — a ficha completa (o equipado, TODOS os outros, dano · alcance · tiros e a fagulha ×N da partida) ficou no livro; e as <b>descrições do livro e da arca foram resumidas</b>.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">37. v1.4.3 — A ESCADA E A FÚRIA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A <b style="color:#9d6bb5">SALA DE TESTES virou lugar físico</b>: apertar <b>[0]</b> no modo dev agora <b>abre uma ESCADA roxa no chão</b> — pise nela e você <b>desce para a GRANDE ARENA</b>, uma sala de tela cheia sem portas feita só para testar bosses; o laboratório (bosses · montar salas · arca) já abre junto, e a escada no topo devolve para a sala onde você estava ([0] de novo fecha a escada). E a <b style="color:#d9465a">SENTENÇA FINAL ficou MUITO mais difícil</b>: <b style="color:#ff2e55">a janela VULNERÁVEL deixou de existir</b> — os 8 padrões se encadeiam sem descanso, com só um respiro curto e um salto telegrafado entre eles; a <b>hitbox cresceu</b> (corpo 50→86, cabeças 15→22), o teto de balas subiu para 320, e as dificuldades apertaram de verdade — o <b style="color:#ff2e55">KAIZO</b> agora roda com densidade 4 (anéis maiores, colunas que derivam mais, sentenças extra, anéis do corpo no Vermelho Absoluto) e a vida da sentença escala com a dificuldade escolhida. A <b style="color:#ffd9a0">SEGUNDA LUTA começa justa</b>: ao derrubar o Cérbero antigo, a vida de Thor é <b>restaurada por inteiro</b> antes da transformação. E a <b style="color:#171019">forma nova trocou o branco pela OBSIDIANA</b>: corpo, braços e as três serpentes agora são escuros com <b style="color:#ff2e55">contorno e brasa carmesins</b> — e <b>fora do laboratório</b> a arena <b>INVERTE as cores só na segunda fase</b>: o chão branco afunda na escuridão, com a clareira de luz sob Thor. <b style="color:#cfe9ff">CORREÇÕES</b>: os tiros da sentença <b>não somem mais</b> quando o Cérbero alcança a parte escura fora do mapa (ele ficava sem atirar); e o <b>fantasma pós-Cérbero morreu</b> — Thor estava <b>INVISÍVEL</b> na Garganta Vulcânica, no corredor azul, no barco e no Limbo inteiro (a opacidade do ending nunca voltava a 1).</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">36. v1.4.2 — A SENTENÇA NO LABORATÓRIO</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O <b style="color:#d9465a">CÉRBERO NOVO chegou aos laboratórios do modo dev</b>: na <b>sala de testes</b> ([0]) a aba de bosses ganhou a carta <b style="color:#ff8fa0">CÉRBERO NOVO — a sentença final</b>, separada do <b>O CÉRBERO</b> antigo (que segue intacto); no <b>MONTADOR DE SALAS</b> ele agora é um chefe montável — coloque no chão e a sentença sobe <b>onde você o plantou</b>. E o bug da <b style="color:#ffd9a0">ARCA [3]</b> morreu: ela abria <b>VAZIA</b> (ou nem abria) por dois erros em cadeia — o PACTO 404 pedia uma qualidade que não existe na tabela de cores, e os 60 itens do remaster perguntavam por uma função que <b>estava trancada dentro de outro arquivo</b>. Consertado na raiz: a arca lista tudo de novo, as <b>cartas de bênção</b> rolam, os <b>baús</b> dropam, a <b>loja</b> e o <b>altar</b> ofertam — e nenhuma tela dessas trava mais o jogo, mesmo se um item futuro nascer quebrado.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">35. v1.4.1 — A SENTENÇA CONVOCADA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O <b style="color:#9d6bb5">BOSSES FUTUROS</b> ganhou o Cérbero novo: o seletor agora tem a carta <b style="color:#d9465a">CÉRBERO — A SENTENÇA FINAL</b> — clicou, a silhueta antiga <b>derrete em luz branca</b> (5,4s de transformação) e o Cérbero remasterizado assume na hora, com os <b>três pescoços de serpente</b> e os <b style="color:#ff2e55">8 padrões de bullet hell carmesim</b> nas 4 etapas — sem precisar derrubar as três cabeças primeiro. A carta antiga <b>CÉRBERO</b> continua exatamente como sempre: o guardião de três bocas, intocado. Tanto faz a ordem — o laboratório não deixa flag sobrando de uma sentença para contaminar a outra.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">34. v1.4.0 — A SENTENÇA FINAL</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A maior expansão até agora — <b style="color:#ffd9a0">60 ITENS NOVOS</b> (24 bênçãos · 20 pactos · 16 armas que mudam o FORMATO do ataque), <b style="color:#cfe9ff">15 SINERGIAS</b> em três níveis (leves, fortes e as ESPECIAIS com nome próprio: O ESPELHO QUE DEVOLVE, O SERMÃO DUPLADO, O SILÊNCIO ARMADO e o inútil de propósito O PATO REFLETIDO), tudo entrando nos drops, na loja e no altar com raridade própria. E o <b style="color:#d9465a">CÉRBERO ganhou a TERCEIRA FASE</b>: ao derrubar as três cabeças, ele <b>brilha até ficar branco</b>, se ergue humanoide e agachado com <b>três pescoços de serpente</b> — <b style="color:#ff2e55">CERBERUS — A SENTENÇA FINAL</b>, uma barra nova, <b>8 padrões de bullet hell carmesim</b> (Rosário de 33 Dentes, Cruz da Matilha, Espiral da Serpente, Caçada sem Rastro, Eclipse Carmesim, Chuva do Último Círculo, Três Sentenças e o <b style="color:#ff2e55">Vermelho Absoluto</b>), 4 etapas por vida (Despertar → Perseguição → Três Sentenças → Vermelho Absoluto), janelas VULNERÁVEL com silêncio próprio, trilha que cresce em camadas, tudo escalado pelas dificuldades (NORMAL 1,0× → KAIZO 1,24×). Ao vencer, os projéteis somem na hora e a cena antiga (diálogo + ALMA NEGRA) segue intacta. Bênçãos com identidade: Halo Quebrado, Última Vela, Ossos em Órbita, Ampulheta, Coroa de Espinhos, o PATO HEREGE… Pactos que cobram caro: Contrato de Sangue, A Última Testemunha, Pacto do Enxame… Armas: Lamento, Espingarda do Sacrilégio, Dente de Cérbero, Canhão de Excomunhão…</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">33. v1.3.5 — O CHÃO QUE QUEIMA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O visual da <b style="color:#ff8f3d">PENUMBRA INFERNAL</b> ficou como na referência: o chão é quase <b style="color:#fffdf4">BRANCO PURO</b> no centro e queima nas bordas em faixas de <b style="color:#ff8f3d">LARANJA VIVO</b> e <b style="color:#d9465a">VERMELHO PROFUNDO</b> — com textura de brasa e linha de brasa rente à parede. A borda queimada <b>TREMULA</b> (línguas de fogo vivas) e, <b>às vezes</b>, um <b style="color:#ff8f3d">FOGO queima FORA do cenário</b> — no vazio junto às paredes, com clarão, chamas e brasas subindo. A <b>Penumbra das Almas</b> segue NORMAL (bem escura) e nada mais mudou.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">32. v1.3.4 — A COLHERADA CARREGADA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">A <b style="color:#ffe9b8">COLHER COMICAMENTE GRANDE ganhou corpo</b>: sprites próprios (<b>colher.png</b> parada e <b>colher-ataque.png</b> na colherada, em <b>assets/sprites/armas/</b>) — ela agora APARECE na pata do Thor, enorme, e varre o arco no golpe. E aprendeu a <b style="color:#ffd9a0">CARREGAR</b>: <b>segure o botão do mouse (ou o dedo na tela)</b> e a colherada se carrega — anel enchendo ao redor do Thor, partículas sendo puxadas e um <b>CARREGADA!</b> quando enche (1,15s). <b>Soltou, desce o porrada</b>: até <b>2,5× de dano</b> e um arremesso muito mais longe — e quem é de <b style="color:#d9465a">GRANDE PORTE</b> (chefes, brutamontes, grão-de-ossos, peregrinos…) <b>voa um pouco menos longe</b>, como deve ser. Um toque rápido continua sendo a colherada rápida de sempre; as setas seguradas atacam contínuo como sempre. E a <b style="color:#9d6bb5">PENUMBRA DAS ALMAS voltou ao NORMAL</b>: bem escura, como antes — sem tom infernal, sem brasas (a <b>Penumbra Infernal</b> continua com o chão esbranquiçado queimando laranja e vermelho nas pontas).</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">31. v1.3.3 — A ESCADA QUE DESCE</div>'+
'<div style="margin-left:14px;margin-bottom:10px">Correções de progressão e um toque infernal. <b style="color:#d9465a">CHEGAR AO CÉRBERO NÃO EXIGE MAIS VARRER O ANDAR</b>: mate <b>o boss</b> da Penumbra Infernal e uma <b style="color:#ff8f3d">ESCADA DESCE no chão do salão</b> — pisou, desce para o corredor do portão, que ficou <b>mais longo</b> (dois trechos) e ganhou um <b style="color:#9d6bb5">PORTAL DE FRENTE</b> no meio do caminho, atravessado a pé, antes do portão enorme. <b style="color:#c9a0ff">SALA SECRETA de verdade</b>: um cômodo <b>isolado</b> — sem ligação com NENHUMA sala — que aparece no mapa como um recuo solto pulsando em roxo; entra-se pela parede rachada do vizinho (fagulha) e de dentro <b>não existe outra porta</b> — só o caminho de volta. Ela dá <b>uma coisa só</b>: um item, <b>+4 de vida máxima</b> ou <b style="color:#ffd9a0">o VELHO REI</b>. <b style="color:#e8455a">A SALA DO BOSS virou a última do andar</b>: beco sem saída, uma única entrada, nada além dela. <b style="color:#ffe9b8">A COLHER COMICAMENTE GRANDE virou arma de perto</b>: a colherada <b>arremessa os demônios longe</b> e absorve o que você carrega — <b style="color:#ff8f3d">fogo queima, explosão detona</b>, <b style="color:#cfe9ff">gelo congela</b>, raio salta, água faz poça, vento arremessa mais longe, terra estremece, luz e escuridão cortam mais fundo — e a cada <b>13 colheradas</b> o céu responde (com <b>A SOPA DIVINA</b>, o raio salta em 3 demônios). <b style="color:#ff8f3d">VISUAL</b>: o chão da <b>Penumbra Infernal</b> ficou <b>esbranquiçado, queimando laranja e vermelho nas bordas</b>; a <b>Penumbra das Almas</b> ganhou um tom mais infernal (carvão quente, brasas subindo). Um inimigo novo ronda os andares: o <b style="color:#ff8f3d">MORCEGO FLAMEJANTE</b> — voa errático, telegrafa o bote com um clarão, mergulha em chamas e cospe brasas de longe (sprite novo em <b>assets/sprites/</b>). E os títulos de meme saíram das cartas das armas.</div>'+
'<div style="color:#e6dac4;font-size:13px;margin:10px 0">30. v1.3.2 — O CHICOTE DA DÍVIDA</div>'+
'<div style="margin-left:14px;margin-bottom:10px">O <b style="color:#9d6bb5">CREDOR virou um chicote 100% jogável no mouse</b>. <b>BOTÃO ESQUERDO</b>: com um inimigo perto do cursor (ou na linha do chicote), a corrente o <b>PRENDE e ARRASTA</b> até você — golpe imediato e arremesso, como antes; <b>sem ninguém perto</b>, o chicote <b>ESTALA EM ÁREA</b>, cortando um arco à frente com recarga rápida. <b>BOTÃO DIREITO</b>: <b>AMARRA</b> um inimigo — ou um <b>OBJETO DO MAPA</b> (ossos, velas, entulho, correntes, estátuas…). A presa amarrada <b>segue o seu mouse</b>: esfregue-a <b>nas paredes</b> para machucá-la, <b>arraste-a pelos inimigos</b> para ferir quem estiver no caminho (o objeto também se gasta) e <b>mexa freneticamente</b> para acumular força — ao soltar o botão ela <b>VOA MAIS LONGE</b>, e o corpo arremessado continua ferindo todo mundo no choque. Os objetos têm vida própria e <b>PODEM QUEBRAR</b> nas paredes ou no abuso (deixam cair uma alma). O inimigo amarrado <b>não age</b> enquanto dura a amarra (chefes resistem mais) e ela <b>se solta sozinha</b> no limite — nunca prende para sempre. Mira nova no cursor, corrente viva e o estalo desenhado no arco.</div>'+
'<div style="color:#a52a3a;font-size:11px;letter-spacing:.2em;margin-top:14px;border-top:1px solid #4a3a5a;padding-top:8px">v1.5.0 · OS SALÕES DO DANMAKU · CLIQUE EM QUALQUER LUGAR PARA FECHAR</div>';
}
/* ===================== v0.9.16: MENU DE CONQUISTAS (escopo global) ===================== */
function renderConqMenu(){
const grid=ov('conqGrid'),sum=ov('conqSummary');
if(!grid)return;
const nc=conqCount();
const ns=META.sinFound?Object.keys(META.sinFound).length:0;
if(sum)sum.textContent='ALMAS REGISTRADAS '+nc+' / '+CONQS.length+' · PECADOS CONHECIDOS '+ns+' / 7'+(nc>=CONQS.length?' — MODO NERDCIRNO67 LIBERADO':'');
let h='';
for(const c of CONQS){
const ok=META.conq&&META.conq[c.id];
const col=ok?'#ffd9a0':'#6e6357';
let prog='';
if(!ok&&c.p){
try{const pr=c.p(META);prog='<div style="height:5px;background:#241d1a;border:1px solid #3a332c;margin-top:7px"><div style="height:100%;width:'+Math.round(100*clamp(pr[0]/Math.max(1,pr[1]),0,1))+'%;background:linear-gradient(90deg,#8a7d6c,#ffd9a0)"></div></div><div style="font-size:8px;color:#9c8f7c;margin-top:3px;letter-spacing:.1em">'+pr[0]+' / '+pr[1]+'</div>';}catch(e){}
}
h+='<div style="border:1px solid '+(ok?'#8a6d3a':'#332b27')+';background:'+(ok?'linear-gradient(135deg,rgba(255,217,160,.07),rgba(13,9,11,.94))':'rgba(13,9,11,.94)')+';padding:11px 13px;text-align:left">'
+'<div style="display:flex;align-items:center;gap:9px">'
+'<div style="flex:0 0 auto;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:'+(ok?'#ffd9a0':'#241d1a')+';color:'+(ok?'#a52a3a':'#574f45')+';font-weight:700;font-size:13px">'+(ok?'★':'☆')+'</div>'
+'<div><div style="font-family:IBM Plex Mono,monospace;font-weight:700;font-size:11px;letter-spacing:.08em;color:'+col+'">'+(ok?c.n:'[REGISTRO CORROMPIDO]')+'</div>'
+'<div style="font-family:IBM Plex Mono,monospace;font-size:9px;color:#9c8f7c;line-height:1.55;margin-top:2px">'+c.d+'</div></div></div>'
+prog+'</div>';
}
grid.innerHTML=h;
}
function openConqMenu(){
audio();
renderConqMenu();
showOv('conquistas');
game._conqBack=game.state==='menu'?'menu':'menu';
game.state='conqs';
blurActive();
}
function closeConqMenu(){
hideOv('conquistas');
game.state='menu';
blurActive();
}
function setupGame(){
bind('muteBtn','click',function(){
audio();muted=!muted;if(master)master.gain.value=muted?0:.9;
const a=ov('icOn'),b=ov('icOff');
if(a)a.style.display=muted?'none':'';
if(b)b.style.display=muted?'':'none';
blurActive();
});
/* ===================== v1.1.0: MENU INFERNAL ===================== */
/* DESCER abre o mapa vertical dos círculos — não vai direto ao seletor */
bind('startBtn','click',function(){audio();showOv('descer');blurActive();});
bind('dPenumbra','click',function(){audio();hideOv('descer');openWeaponSelect();});
bind('dLimbo','click',function(){audio();hideOv('descer');startLimboDirect();});
bind('descerBack','click',function(){audio();hideOv('descer');blurActive();});
bind('bookTabInv','click',function(){audio();game._bookTab='inv';renderBook();blip('sine',500,650,.05,.03);});
bind('bookTabGrim','click',function(){audio();game._bookTab='grim';renderBook();blip('sine',500,650,.05,.03);});
bind('grimBtn','click',function(){audio();game._bookTab='grim';renderBook();showOv('book');game._bookBack='menu';game.state='book';blurActive();});
/* ABANDONAR O INFERNO — a porta fecha; se o navegador não deixar, fica a despedida */
bind('quitBtn','click',function(){
audio();blip('sine',140,60,1.2,.06);
const m=ov('menu');if(m)m.classList.add('fading');
setTimeout(function(){
try{window.close();}catch(e){}
const m2=ov('menu');
if(m2&&!m2.classList.contains('hidden')){
m2.classList.remove('fading');
const t=ov('gameTitle');if(t)t.textContent='O INFERNO GUARDA O SEU LUGAR.';
const s=m2.querySelector('.dante');if(s)s.textContent='“chi esce con l\'inferno, non esce mai.”';
}
},900);
});
/* Dante em pessoa: trechos do livro antigo, uma página a cada tanto */
const DANTE_QUOTES=[
"Lasciate ogne speranza, voi ch'intrate.",
"Per me si va ne la città dolente.",
"Per me si va tra la perduta gente.",
"Nel mezzo del cammin di nostra vita…",
"…mi ritrovai per una selva oscura.",
"…che la diritta via era smarrita.",
"Tanto è amara, che poco è più morte;",
"…e vidi gente più ch'altrove troppa.",
"…o livro já falava de lugares que você ainda não visitou."];
let danteIdx=0;window.danteIdx=0; /* v1.5.0: o índice fica no window */
/* v1.5.0: a citação de Dante NÃO muda mais sozinha — ela escolhe uma página
   quando o jogo abre e só passa para a próxima quando você ENTRA no jogo
   de novo (descida nova). Enquanto você navega pelo menu, ela fica parada. */
function danteShow(){
const el=ov('danteLine');
if(!el)return;
el.textContent='« '+DANTE_QUOTES[(window.danteIdx||0)%DANTE_QUOTES.length]+' »';
el.classList.add('on');
}
danteShow();
window.__danteEnter=function(){window.danteIdx=(window.danteIdx||0)+1;danteShow();};
setInterval(function(){
const el=ov('danteLine');
if(!el)return;
if(game.state!=='menu'){el.classList.remove('on');return;}
if(!el.classList.contains('on'))el.classList.add('on'); /* fica aceso, parado */
},7000);
/* a porta de pedra respira: parallax do mouse + abertura parcial ao escolher */
(function(){
const m=ov('menu'),gate=ov('gateScene');
if(!m||!gate)return;
m.addEventListener('mousemove',function(e){
game.menuIdle=0;
const cx=(e.clientX/window.innerWidth-.5),cy=(e.clientY/window.innerHeight-.5);
gate.style.transform='translate('+(-cx*14).toFixed(1)+'px,'+(-cy*10).toFixed(1)+'px)';
});
m.addEventListener('mouseleave',function(){gate.style.transform='';});
m.addEventListener('click',function(){
m.classList.add('gate-open');
setTimeout(function(){m.classList.remove('gate-open');},900);
});
})();
function resetMenuIdle(){
game.menuIdle=0;game._circXdone=false;
const m=ov('menu');
if(m)m.classList.remove('menu-idle');
try{if(window.__musicDip)__musicDip(1);}catch(e){}
}
addEventListener('mousemove',function(){if(game.state==='menu')resetMenuIdle();});
addEventListener('keydown',function(){if(game.state==='menu')resetMenuIdle();});
addEventListener('pointerdown',function(){if(game.state==='menu')resetMenuIdle();});
/* ocioso no menu: a câmera desce, a música baixa — e CÍRCULO X pisca uma vez.
   Depois ninguém explica o que foi. */
setInterval(function(){
if(game.state!=='menu'){game._circXdone=false;return;}
game.menuIdle=(game.menuIdle||0)+1;
const m=ov('menu');
if(!m)return;
if(game.menuIdle>=32){m.classList.add('menu-idle');try{if(window.__musicDip)__musicDip(.3);}catch(e){}}
if(game.menuIdle>=52&&!game._circXdone){
game._circXdone=true;
const cx=ov('circX');
if(cx){cx.classList.add('on');setTimeout(function(){cx.classList.remove('on');},560);}
}
if(game.menuIdle>=80){resetMenuIdle();}
},250);
bind('menuLimboBtn','click',function(){audio();startLimboDirect();});
/* v1.5.3: TESTE — botão temporário do portão no menu (v1.5.9: de volta) */
bind('gateTestBtn','click',function(){audio();startGateDirect();});
/* v1.6.0: TESTE — botão temporário da última fase do Limbo no menu */
bind('limboTestBtn','click',function(){audio();startLimboTestDirect();});
bind('optBtn','click',function(){openOptions('menu');});
bind('saveBtn','click',function(){audio();renderSaveCards();showOv('saves');game.state='saves';blurActive();});
bind('saveBack','click',function(){hideOv('saves');game.state='menu';refreshMenuDev();blurActive();});
/* ==== v0.9.13: bestiário no menu + exportar/importar saves ==== */
bind('bestBtn','click',function(){audio();game._bookTab='inv';renderBook();showOv('book');game._bookBack='menu';game.state='book';blurActive();});
/* ===================== v0.9.16: MENU DE CONQUISTAS ===================== */
bind('conqBtn','click',function(){openConqMenu();});
bind('conqClose','click',function(){if(game.state==='conqs')closeConqMenu();});
/* v1.5.0: as NOVIDADES da versão de volta ao menu — a linha do rodapé abre o registro completo */
bind('menuNews','click',function(){audio();showOv('versionInfo');buildVersionInfo();blurActive();});
bind('saveExport','click',function(){audio();exportSaves();});
bind('saveImport','click',function(){audio();const f=ov('saveFile');if(f){f.value='';f.click();}});
const _sf=ov('saveFile');
if(_sf)_sf.addEventListener('change',function(){importSavesFile(this.files&&this.files[0]);});
/* === seletor de círculos === */
bind('circleBtn','click',function(){audio();showOv('circles');if(window.SCHOOL)SCHOOL.refreshCircles();blurActive();});
bind('circlesBack','click',function(){hideOv('circles');blurActive();});
bind('circlePenumbra','click',function(){audio();hideOv('circles');openWeaponSelect();});
bind('circleLimbo','click',function(){audio();hideOv('circles');startLimboDirect();});
bind('circleEscola','click',function(){audio();if(window.SCHOOL){hideOv('circles');SCHOOL.startFromMenu();}});
/* === Caronte diálogo === */
bind('caronteYes','click',function(){audio();caronteAccept();});
bind('caronteNo','click',function(){audio();caronteRefuse();});
/* === Botão BOSSES FUTUROS na tela de vitória === */
bind('futureBossesBtn','click',openFutureBosses);
bind('futureBossesBack','click',function(){audio();hideOv('futureBosses');showOv('win');blurActive();});
/* === Botão v0.9.0 no canto inferior direito === */
const vb=ov('versionBtn');
if(vb)vb.addEventListener('click',function(){audio();showOv('versionInfo');buildVersionInfo();blurActive();});
const vbc=ov('versionInfoClose');
if(vbc)vbc.addEventListener('click',function(){audio();hideOv('versionInfo');blurActive();});
/* === seleção de arma === */
bind('wBack','click',function(){audio();hideOv('weapons');showOv('menu');game.state='menu';game.limboPending=false;game.gatePending=false;game.limboTestPending=false;refreshMenuDev();blurActive();});
bind('deadMenuBtn','click',goToMenu);
bind('optBtn2','click',function(){openOptions('pause');});
bind('optBack','click',closeOptions);
bind('dNorm','click',function(){setDiff('normal');});
bind('dHard','click',function(){setDiff('hard');});
bind('wShot','click',function(){startGame('shot');});
bind('wBite','click',function(){startGame('bite');});
/* ===== v1.6.2: CARROSSEL DE ARMAS — uma arma por vez. As 8 cartas continuam
   no DOM com os cliques de sempre (game.js e expansão intactos); o carrossel
   só decide QUAL delas aparece. ◀ ▶ na tela, SETAS no teclado, pontos que
   pulam direto, e a carta desliza de ladinho ao trocar. ===== */
const WCAROUSEL=['wShot','wBite','w_sentenca','w_ultimopec','w_credor','w_colher','w_peixe','w_teclado'];
let wCarIdx=0;
function wCarApply(dir){
  for(let i=0;i<WCAROUSEL.length;i++){
    const el=ov(WCAROUSEL[i]);
    if(el)el.classList.toggle('cur',i===wCarIdx);
  }
  const dots=ov('wDots');
  if(dots&&!dots.dataset.built){
    dots.dataset.built='1';
    for(let i=0;i<WCAROUSEL.length;i++){
      const d=document.createElement('button');
      d.className='wDot';
      const card=ov(WCAROUSEL[i]);
      const h3=card?card.querySelector('h3'):null;
      d.title=(h3?h3.textContent:WCAROUSEL[i])+' ('+(i+1)+'/'+WCAROUSEL.length+')';
      (function(idx){d.addEventListener('click',function(){audio();wCarGo(idx,0);});})(i);
      dots.appendChild(d);
    }
  }
  if(dots){for(let i=0;i<dots.children.length;i++)dots.children[i].classList.toggle('cur',i===wCarIdx);}
  if(dir){
    const el=ov(WCAROUSEL[wCarIdx]);
    if(el){
      el.style.setProperty('--wdir',(dir>0?18:-18)+'px');
      el.style.animation='none';void el.offsetWidth;el.style.animation='';
    }
  }
}
function wCarGo(i,dir){wCarIdx=(i+WCAROUSEL.length)%WCAROUSEL.length;wCarApply(dir);blip('sine',330+wCarIdx*24,410+wCarIdx*24,.06,.045);}
function wCarMove(d){wCarGo(wCarIdx+d,d);}
/* v1.6.2: o teclado (e os testes) falam com o carrossel por meio do window —
   este bloco mora dentro de setupGame(), então as funções locais não são
   visíveis fora dele; a ponte global mantém o handler do keydown (top-level)
   funcionando. */
window.wCarMove=wCarMove;
window.wCarGo=wCarGo;
window.wCarConfirm=function(){const _c=ov(WCAROUSEL[wCarIdx]);if(_c)_c.click();};
window.wCarCur=function(){return WCAROUSEL[wCarIdx];};
(function wCarBoot(){
  const wo=ov('weapons');
  if(wo&&!wo.classList.contains('carousel'))wo.classList.add('carousel');
  wCarApply(0);
})();
bind('wPrev','click',function(){audio();wCarMove(-1);blurActive();});
bind('wNext','click',function(){audio();wCarMove(1);blurActive();});
bind('retryBtn','click',function(){audio();if(window.__EXPANSION_RETRY)window.__EXPANSION_RETRY();else openWeaponSelect();}); /* v1.3.0: revive na escola */
bind('resumeBtn','click',togglePause);
bind('restartBtn','click',openWeaponSelect);
bind('pauseMenuBtn','click',goToMenu);
bind('bookClose','click',function(){if(game.state==='book')toggleBook();});
bind('labClose','click',function(){if(game.state==='labselect')toggleLab();});
bind('labTabBoss','click',function(){showLabTab('boss');blip('sine',500,650,.05,.03);});
bind('labTabRooms','click',function(){buildLabRooms();showLabTab('rooms');blip('sine',500,650,.05,.03);});
bind('labTabBuild','click',function(){buildLabBuild();showLabTab('build');blip('sine',500,650,.05,.03);});
bind('shopClose','click',closeShopOv);
bind('cheatClose','click',closeCheatMenu);
bind('menuBtn','click',function(){
/* FIX: esconde também a tela de morte — ficava interceptando o menu */
['dead','win','pause','limboLoading','circles'].forEach(hideOv);
initAttract();
showOv('menu');
blurActive();
});
const sfxS=ov('oSfx');
if(sfxS)sfxS.addEventListener('input',function(){
opts.sfx=sfxS.value/100;
const v=ov('oSfxV');if(v)v.textContent=sfxS.value;
applyVolumes();saveOpts();
});
const musS=ov('oMus');
if(musS)musS.addEventListener('input',function(){
opts.music=musS.value/100;
const v=ov('oMusV');if(v)v.textContent=musS.value;
applyVolumes();saveOpts();
blip('sine',520,700,.08,.05);
});
const secS=ov('oSecret');
if(secS)secS.addEventListener('input',function(){
opts.secret=secS.value/100;
const v=ov('oSecretV');if(v)v.textContent=secS.value;
saveOpts();
blip('sine',300+secS.value*2,400+secS.value*2,.07,.05);
});
const shk=ov('oShake');
if(shk)shk.addEventListener('click',function(){
opts.shake=!opts.shake;syncOptUI();saveOpts();
if(opts.shake)game.shake=Math.max(game.shake,6);
});
const dmg=ov('oDmg');
if(dmg)dmg.addEventListener('click',function(){
opts.dmgNum=!opts.dmgNum;syncOptUI();saveOpts();
});
const kbBtns=document.querySelectorAll('.kbBtn');
kbBtns.forEach(function(el){
el.addEventListener('click',function(){
audio();
rebindAction=el.dataset.kb;
refreshKbBtns();
blip('sine',400,520,.06,.04);
});
});
const rst=ov('oRestore');
if(rst)rst.addEventListener('click',function(){
keybinds=JSON.parse(JSON.stringify(DEFAULT_BINDS));
saveOpts();refreshKbBtns();
blip('sine',520,380,.09,.05);
});
initAttract();
rollTitleFont(); /* primeira roupa do título */
buildDevPanel();
requestAnimationFrame(frame);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupGame);
else setupGame();
/* ==== v0.9.13: fila de retratos do bestiário ==== */
window.__bestQueue=window.__bestQueue||[];
/* ==== v0.9.13: KAIZO (branco) e ELITES (aura) — camada visual por cima do sprite.
   drawEnemy é reenvolvido no fim do script para valer para todas as chamadas. ==== */
const _drawEnemy_v13=drawEnemy;
drawEnemy=function(e){
_drawEnemy_v13(e);
if(e&&!e.dead&&(e.kaizo||e.elite)){
ctx.save();
if(e.kaizo){
ctx.globalAlpha=.34+.08*Math.sin(game.t*5);
ctx.fillStyle='#eef2f4';
ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.26,0,TAU);ctx.fill();
ctx.globalAlpha=.8;ctx.strokeStyle='#f4f7f8';ctx.lineWidth=2;
ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.34+Math.sin(game.t*4)*1.5,0,TAU);ctx.stroke();
/* v0.9.16: FASE II — anel vermelho duplo pulsando sobre a aura branca */
if(e.kzP2){
ctx.globalAlpha=.55+.25*Math.sin(game.t*9);
ctx.strokeStyle='#e8455a';ctx.lineWidth=2.5;
ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.5+Math.sin(game.t*7)*3,0,TAU);ctx.stroke();
ctx.globalAlpha=.35;
ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.72,0,TAU);ctx.stroke();
}
}
if(e.elite){
ctx.globalAlpha=.55;ctx.strokeStyle='rgba(255,72,84,.85)';ctx.lineWidth=2;
ctx.beginPath();ctx.arc(e.x,e.y,e.r+5+Math.sin(game.t*6)*1.5,0,TAU);ctx.stroke();
}
ctx.restore();
}
};
