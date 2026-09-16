'use strict';
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
addEventListener('resize',resize);resize();
/* ============ sala atual ============ */
const ROOM={x:0,y:0,w:W,h:H,inverted:false};
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
const DEFAULT_BINDS={up:['KeyW'],down:['KeyS'],left:['KeyA'],right:['KeyD'],dash:['Space'],parry:['Space'],interact:['KeyZ'],pause:['Escape','KeyP']};
const opts={sfx:.8,music:.5,shake:true,dmgNum:true,secret:1};
let keybinds=JSON.parse(JSON.stringify(DEFAULT_BINDS));
const touchState={up:false,down:false,left:false,right:false,dash:false,parry:false,interact:false,pause:false};
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
let penBuf='';
addEventListener('blur',function(){for(const k in keys)keys[k]=false;});
addEventListener('keydown',e=>{
if(rebindAction){e.preventDefault();captureKey(e.code);return;}
/* PENUMBRA: digitar no menu */
if(game.state==='menu'&&!optionsOpen()&&e.code.length===4&&e.code.startsWith('Key')){
penBuf=(penBuf+e.code[3].toLowerCase()).slice(-16);
if(penBuf.endsWith('penumbra')){
penBuf='';
game.dev=!game.dev;
audio();
if(game.dev){sfx.glitch();sfx.levelup();}
else blip('sine',400,200,.15,.07);
refreshMenuDev();
}
}
/* comandos do modo desenvolvedor */
if(game.dev&&!e.repeat&&(game.state==='play'||game.state==='cheat')){
if(e.code==='Digit3'){if(game.state==='cheat')closeCheatMenu();else openCheatMenu();return;}
if(game.state!=='play')return;
if(e.code==='Digit1'){gainSouls(25);texts.push({x:player.x,y:player.y-30,txt:'+25 ALMAS',t:0,life:.8,c:'#ffd9a0',size:13});}
else if(e.code==='Digit2'){player.hp=player.maxHp;sfx.heart();}
else if(e.code==='Digit4'){for(const en of enemies){if(en.type!=='rk')killEnemy(en);}}
else if(e.code==='Digit5'){nextFloor();}
else if(e.code==='Digit6'){devGoBoss();}
else if(e.code==='Digit7'){game.god=!game.god;blip('square',game.god?700:300,game.god?1100:150,.12,.09);}
else if(e.code==='Digit8'){gainSouls(100);texts.push({x:player.x,y:player.y-30,txt:'+100 ALMAS',t:0,life:.8,c:'#ffd9a0',size:13});}
else if(e.code==='Digit9'){game.hasShot=true;game.hasBite=true;player.shotT=.3;player.biteT=.3;sfx.levelup();}
}
if(game.dev&&!e.repeat&&e.code==='Digit0'&&(game.state==='play'||game.state==='labselect'||game.state==='builder'))toggleLab();
/* livro do cão [B] */
if(!e.repeat&&e.code==='KeyB'&&!rebindAction){
if(game.state==='book')toggleBook();
else if(game.state==='play')toggleBook();
}
const allBinds=keybinds.up.concat(keybinds.down,keybinds.left,keybinds.right,keybinds.dash,keybinds.parry,keybinds.interact,keybinds.pause);
if(allBinds.includes(e.code)||e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault();
if(!e.repeat&&keybinds.dash.includes(e.code))tryDash();
if(!e.repeat&&keybinds.interact.includes(e.code))tryInteract();
keys[e.code]=true;
if(!e.repeat&&keybinds.pause.includes(e.code)){
if(game.state==='shop'){closeShopOv();}
else if(game.state==='cheat'){closeCheatMenu();}
else if(game.state==='book')toggleBook();
else if(game.state==='labselect')toggleLab();
else if(game.state==='builder')toggleLab();
else if(game.state==='saves'){hideOv('saves');game.state='menu';refreshMenuDev();}
else if(optionsOpen())closeOptions();
else togglePause();
}
if(!e.repeat&&game.state==='builder'){
if(e.code==='Enter')builderTest();
else if(e.code==='KeyX'){game.builder.items=[];blip('square',300,140,.1,.07);}
}
if(e.code==='Enter'&&game.state==='menu'&&!optionsOpen())openWeaponSelect();
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
if(e.button===2){tryThrowSaw();return;}
if(e.button!==0)return;
const p=cvToWorld(e.clientX,e.clientY);
mouse.x=p.x;mouse.y=p.y;mouse.inCanvas=true;
tryShootAt(p.x,p.y);
});
cv.addEventListener('contextmenu',function(e){e.preventDefault();});
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
  if(book)book.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();pulse('book',function(){if(game.state==='book')toggleBook();else if(game.state==='play')toggleBook();});book.classList.add('active');},{passive:false});
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
  // Impede zoom/scroll acidental enquanto se joga.
  document.addEventListener('touchmove',function(e){if(game.state==='play'||game.state==='bossintro')e.preventDefault();},{passive:false});
  document.addEventListener('gesturestart',function(e){e.preventDefault();},{passive:false});
})();
/* ============ áudio ============ */
let AC=null,master=null,sfxGain=null,musicBus=null,muted=false,noiseBuf=null;
let dronesOn=false,beatT=0,beatN=0,musicTheme='limbo';
const AUDIO_NAMES={shotS:'Tiro',bite:'Mordida',saw:'Serra',slash:'Corte',throw:'Arremesso da Serra',parry:'Desvio',freeze:'Congelamento',nova:'Nova',stake:'Estaca',boom:'Impacto',shock:'Choque',snore:'Ronco',ehit:'Acerto no Inimigo',bhit:'Acerto no Chefe',thud:'Pancada',kill:'Morte do Inimigo',hurt:'Dano no Thor',dash:'Investida',spit:'Cuspe',soul:'Coleta de Alma',heart:'Coração',levelup:'Subida de Nível',thunder:'Trovão',growl:'Rosnado',roar:'Rugido',howl:'Uivo',explode:'Explosão',headDie:'Morte de Cabeça',rumble:'Tremor',creak:'Rangido',gate:'Portão',die:'Morte do Thor',dust:'Poeira',echo:'Eco',win:'Vitória',glitch:'Glitch',static_:'Estática'};
const MUSIC_NAMES={limbo:'Abismo — O Inferno Respira',cerberus:'Cérbero — Três Gargantas',miniboss:'Predador do Limbo',rei:'Velho Rei — Xeque-Mate',e404:'Erro 404 — Sala Impossível'};
function audio(){
if(!AC){
AC=new (window.AudioContext||window.webkitAudioContext)();
master=AC.createGain();master.gain.value=muted?0:.9;master.connect(AC.destination);
sfxGain=AC.createGain();sfxGain.gain.value=opts.sfx*.55;sfxGain.connect(master);
noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);
const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
ensureMusic();
}
if(AC.state==='suspended')AC.resume();
}
function applyVolumes(){if(sfxGain)sfxGain.gain.value=opts.sfx*.55;if(musicBus)musicBus.gain.value=opts.music*.5;}
function ensureMusic(){
if(!AC||dronesOn)return;dronesOn=true;
musicBus=AC.createGain();musicBus.gain.value=opts.music*.5;musicBus.connect(master);
const o1=AC.createOscillator();o1.type='sawtooth';o1.frequency.value=55;
const f1=AC.createBiquadFilter();f1.type='lowpass';f1.frequency.value=210;
const g1=AC.createGain();g1.gain.value=.15;o1.connect(f1);f1.connect(g1);g1.connect(musicBus);o1.start();
const o2=AC.createOscillator();o2.type='sine';o2.frequency.value=82.4;
const g2=AC.createGain();g2.gain.value=.055;o2.connect(g2);g2.connect(musicBus);o2.start();
const lfo=AC.createOscillator();lfo.type='sine';lfo.frequency.value=.08;
const lg=AC.createGain();lg.gain.value=.05;lfo.connect(lg);lg.connect(g1.gain);lfo.start();
beatT=AC.currentTime+.6;
}
function getMusicTheme(){
if(game.state==='knightintro'||game.state==='knightdeath'||knightAny())return'cerberus';
if(game.state==='e404intro'||game.state==='reideath'||game.state==='reiintro'||e404Any()||reiAny())return game.state==='e404intro'||e404Any()?'e404':'rei';
if((game.state==='bossintro'||boss.active&&!boss.dying)&&(game.state!=='menu'))return'cerberus';
if(miniBossAny())return'miniboss';
return'limbo';
}
function musicTick(){
if(!AC||!dronesOn)return;
const theme=getMusicTheme();
if(theme!==musicTheme){musicTheme=theme;beatN=0;beatT=AC.currentTime+.08;}
const data={limbo:{iv:.98,notes:[54,47],type:'sine'},miniboss:{iv:.78,notes:[48,38],type:'triangle'},cerberus:{iv:.62,notes:[42,31],type:'sawtooth'},rei:{iv:.7,notes:[62,49],type:'square'},e404:{iv:.46,notes:[90,53],type:'square'}}[theme];
if(beatT<AC.currentTime)beatT=AC.currentTime+.05;
while(beatT<AC.currentTime+.18){
const d=beatT-AC.currentTime,n=data.notes;
blip(data.type,n[0],n[0]*.92,.28,.055,d,musicBus);
blip(data.type,n[1],n[1]*.86,.22,.045,d+data.iv*.28,musicBus);
if(theme!=='limbo'&&beatN%2===0)noiseSfx(theme==='e404'?.035:.05,theme==='cerberus'?.09:.065,theme==='e404'?5200:3600,'highpass',d,musicBus);
if(theme==='rei'&&beatN%4===0)blip('sine',124,98,.16,.045,d+.1,musicBus);
if(theme==='e404'&&beatN%3===0)blip('square',1800,90,.12,.035,d+.05,musicBus);
beatN++;beatT+=data.iv;
}
}
function blip(type,f0,f1,dur,vol,delay,dest){
if(!AC)return;const t=AC.currentTime+(delay||0);
const o=AC.createOscillator(),g=AC.createGain();
o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(f1,1),t+dur);
g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
o.connect(g);g.connect(dest||sfxGain);o.start(t);o.stop(t+dur+0.03);
}
function noiseSfx(dur,vol,fq,type,delay,dest){
if(!AC)return;const t=AC.currentTime+(delay||0);
const s=AC.createBufferSource();s.buffer=noiseBuf;
const f=AC.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=fq;
const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
s.connect(f);f.connect(g);g.connect(dest||sfxGain);s.start(t);s.stop(t+dur+0.03);
}
/* NOMES DOS EFEITOS: AUDIO_NAMES. NOMES DAS TRILHAS: MUSIC_NAMES. */
const sfx={
shotS(){blip('sawtooth',620,210,0.07,0.05);noiseSfx(0.04,0.03,5000,'highpass');},
bite(){noiseSfx(0.08,0.12,3200,'highpass');blip('square',300,110,0.09,0.11);},
saw(){blip('sawtooth',85+rnd(30),70,0.05,0.028);},
slash(){noiseSfx(0.12,0.1,2200,'highpass');blip('square',220,80,0.1,0.08);},
throw(){noiseSfx(0.12,0.05,1800);blip('sawtooth',180,80,0.12,0.05);},
parry(){blip('square',900,1500,0.1,0.16);blip('square',1500,600,0.16,0.12,0.08);noiseSfx(0.1,0.08,4000,'highpass');},
freeze(){blip('sine',1200,700,0.12,0.06);},
nova(){blip('sine',300,140,0.3,0.1);noiseSfx(0.2,0.06,1800,'highpass');},
stake(){blip('sine',900,300,0.1,0.07);noiseSfx(0.06,0.05,3000,'highpass');},
boom(){noiseSfx(0.22,0.16,600,'lowpass');blip('triangle',140,40,0.22,0.12);},
shock(){noiseSfx(0.32,0.14,850,'lowpass');blip('triangle',190,55,0.3,0.1);},
snore(){blip('sawtooth',40,24,1.8,0.055);noiseSfx(1.6,0.02,150,'lowpass');},
ehit(){blip('square',160,90,0.06,0.05);},
bhit(){blip('triangle',260,150,0.05,0.05);},
thud(){blip('triangle',90,50,0.09,0.06);},
kill(){blip('square',200,55,0.12,0.08);noiseSfx(0.1,0.05,800);},
hurt(){blip('sawtooth',320,70,0.28,0.18);noiseSfx(0.16,0.12,900);},
dash(){noiseSfx(0.18,0.08,1400);},
spit(){noiseSfx(0.07,0.06,2600);blip('sawtooth',140,60,0.1,0.04);},
soul(){blip('sine',520,780,0.08,0.04);},
heart(){blip('sine',520,780,0.16,0.1);},
levelup(){blip('sine',330,330,.12,.1);blip('sine',415,415,.12,.1,.1);blip('sine',494,494,.12,.1,.2);blip('sine',660,660,.3,.12,.3);},
thunder(){noiseSfx(0.3,0.2,900,'highpass');blip('sawtooth',220,40,0.3,0.18);noiseSfx(0.5,0.1,250,'lowpass',0.05);},
growl(){blip('sawtooth',75,48,0.45,0.1);},
roar(){blip('sawtooth',110,38,0.8,0.22);blip('sawtooth',82,30,0.85,0.16,0.03);noiseSfx(0.5,0.09,300,'lowpass');},
howl(){blip('sine',300,720,0.35,0.12);blip('sine',720,180,0.45,0.1,0.35);},
explode(){noiseSfx(0.35,0.22,700,'lowpass');blip('triangle',120,35,0.3,0.14);},
headDie(){noiseSfx(0.6,0.28,500,'lowpass');blip('sawtooth',200,30,0.7,0.18);},
rumble(){noiseSfx(1.0,0.14,110,'lowpass');},
creak(){blip('triangle',48,85,1.1,0.09);noiseSfx(0.9,0.03,300);},
gate(){blip('sawtooth',60,28,0.6,0.2);noiseSfx(0.4,0.12,200,'lowpass');},
die(){blip('sawtooth',240,30,1.1,0.2);noiseSfx(0.6,0.12,400,'lowpass');},
dust(){noiseSfx(1.5,0.16,320,'lowpass');blip('sawtooth',150,28,1.3,0.09);},
echo(){blip('sine',170,36,2.4,0.1);noiseSfx(1.8,0.05,300,'lowpass');},
win(){blip('sine',262,262,0.16,0.12,0.7);blip('sine',330,330,0.16,0.12,0.9);blip('sine',392,392,0.16,0.12,1.1);blip('sine',523,523,0.4,0.14,1.3);},
glitch(){noiseSfx(.25,.16,rnd(400,6000),'bandpass');blip('square',rnd(80,2000),rnd(40,900),.12,.12);},
static_(){noiseSfx(.4,.08,2000,'highpass');}
};
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
let roomFloor=null;
function buildRoomFloor(){
roomFloor=document.createElement('canvas');roomFloor.width=Math.max(4,ROOM.w);roomFloor.height=Math.max(4,ROOM.h);
const f=roomFloor.getContext('2d');
const inv=ROOM.inverted,bg=inv?'#e9e7e0':'#0f0b0e';
const rects=game.absRects.map(r=>({x:r.x-ROOM.x,y:r.y-ROOM.y,w:r.w,h:r.h}));
for(const rc of rects){f.fillStyle=bg;f.fillRect(rc.x,rc.y,rc.w,rc.h);}
f.save();f.beginPath();
for(const rc of rects)f.rect(rc.x,rc.y,rc.w,rc.h);
f.clip();
const blobs=Math.round(70*(ROOM.w*ROOM.h)/(W*H))+8;
for(let i=0;i<blobs;i++){
f.save();f.translate(rnd(ROOM.w),rnd(ROOM.h));f.rotate(rnd(TAU));f.scale(1,rnd(.35,.8));
f.beginPath();f.arc(0,0,rnd(18,90),0,TAU);
f.fillStyle=inv?'rgba(20,16,22,0.06)':'rgba(0,0,0,0.16)';f.fill();f.restore();
}
f.strokeStyle=inv?'rgba(24,20,26,0.13)':'rgba(242,240,234,0.10)';f.lineWidth=1;
for(let x=56;x<ROOM.w;x+=56){f.beginPath();f.moveTo(x,0);f.lineTo(x,ROOM.h);f.stroke();}
for(let y=56;y<ROOM.h;y+=56){f.beginPath();f.moveTo(0,y);f.lineTo(ROOM.w,y);f.stroke();}
f.restore();
f.strokeStyle=inv?'#18141a':'#f2f0ea';f.lineWidth=3;f.lineCap='round';
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
if(on&&pOn){f.beginPath();f.moveTo(px,py);f.lineTo(x,y);f.stroke();}
pOn=on;px=x;py=y;
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
const EMPTY_META=()=>({kills:0,deaths:0,wins:0,e404:0,souls:0,rooms:0,done:{},seen:{},knights:{conquest:0,war:0,famine:0,death:0}});
let activeSave=1;
const META=EMPTY_META();
function normalizeMeta(d){const m=EMPTY_META();if(!d)return m;for(const k of ['kills','deaths','wins','e404','souls','rooms'])if(typeof d[k]==='number')m[k]=Math.max(0,d[k]);if(d.done&&typeof d.done==='object')m.done={...d.done};if(d.seen&&typeof d.seen==='object')m.seen={...d.seen};if(d.knights&&typeof d.knights==='object')m.knights={conquest:Math.max(0,d.knights.conquest|0),war:Math.max(0,d.knights.war|0),famine:Math.max(0,d.knights.famine|0),death:Math.max(0,d.knights.death|0)};return m;}
function copyMeta(src,dst){for(const k of ['kills','deaths','wins','e404','souls','rooms'])dst[k]=src[k];dst.done={...src.done};dst.seen={...src.seen};if(src.knights)dst.knights={...src.knights};}
function loadMeta(){try{activeSave=Math.max(1,Math.min(3,Number(localStorage.getItem('thorActiveSave'))||1));let d=JSON.parse(localStorage.getItem('thorSave'+activeSave));if(activeSave===1&&!d){const legacy=JSON.parse(localStorage.getItem('thorMeta'));if(legacy){d=legacy;localStorage.setItem('thorSave1',JSON.stringify(normalizeMeta(d)));}}copyMeta(normalizeMeta(d),META);for(const slot of [1,2,3]){if(!localStorage.getItem('thorSave'+slot))localStorage.setItem('thorSave'+slot,JSON.stringify(EMPTY_META()));}}catch(e){copyMeta(EMPTY_META(),META);}}
function saveMeta(){try{localStorage.setItem('thorSave'+activeSave,JSON.stringify(META));localStorage.setItem('thorActiveSave',String(activeSave));}catch(e){}}
function saveSlotData(slot){try{const d=localStorage.getItem('thorSave'+slot);return d?normalizeMeta(JSON.parse(d)):EMPTY_META();}catch(e){return EMPTY_META();}}
function slotExists(slot){try{return !!localStorage.getItem('thorSave'+slot);}catch(e){return false;}}
function loadSaveSlot(slot){if(slot<1||slot>3)return;saveMeta();const d=saveSlotData(slot);activeSave=slot;copyMeta(d,META);localStorage.setItem('thorActiveSave',String(slot));refreshMenuDev();renderSaveCards();blip('sine',slot===1?520:380,slot===1?760:520,.12,.06);}
function deleteSaveSlot(slot){if(slot<1||slot>3)return;if(!confirm('deletar o save '+slot+'? todo o progresso desse slot será perdido.'))return;try{localStorage.removeItem('thorSave'+slot);}catch(e){}if(activeSave===slot){activeSave=1;const d=saveSlotData(1);copyMeta(d,META);localStorage.setItem('thorActiveSave','1');}renderSaveCards();refreshMenuDev();}
function renderSaveCards(){const box=ov('saveCards');if(!box)return;box.innerHTML='';for(let i=1;i<=3;i++){const d=saveSlotData(i),exists=slotExists(i);const el=document.createElement('div');el.className='card';el.innerHTML='<h3>SAVE '+i+(i===activeSave?' · ATIVO':'')+'</h3><p>'+(exists?(i===1?'progresso normal':'save existente'):'ZERADO — primeira vez')+'</p><div class="lvl">ABATES '+d.kills+' · DESCIDAS '+d.deaths+' · VITÓRIAS '+d.wins+'</div><div style="margin-top:12px"><button class="mini useSave">'+(i===activeSave?'usar este':'carregar')+'</button> <button class="mini delSave">deletar</button></div>';el.querySelector('.useSave').addEventListener('click',()=>loadSaveSlot(i));el.querySelector('.delSave').addEventListener('click',()=>deleteSaveSlot(i));box.appendChild(el);}}
loadMeta();
const UNLOCKS=[
{id:'heart',name:'CORAÇÃO CINZENTO',desc:'+1 coração máximo inicial',need:'morra 3 vezes',chk:m=>m.deaths>=3,apply(){player.maxHp=5;player.hp=5;}},
{id:'fury',name:'FÚRIA ANTIGA',desc:'+10% de dano permanente',need:'500 abates no total',chk:m=>m.kills>=500,apply(){P.dmgMult*=1.1;}},
{id:'swift',name:'PATAS DE VENTO',desc:'+10% de velocidade',need:'derrote o Cérbero',chk:m=>m.wins>=1,apply(){P.speedMult*=1.1;}},
{id:'magnet',name:'ÍMÃ RÚNICO',desc:'atrai almas de muito mais longe',need:'colete 400 almas',chk:m=>m.souls>=400,apply(){P.magnetMult+=.8;}},
{id:'haggler',name:'REGATEADOR',desc:'-25% nos preços das lojas',need:'varra 16 salas',chk:m=>m.rooms>=16,apply(){}},
{id:'shard',name:'FRAGMENTO DO ERRO',desc:'+15% de almas coletadas',need:'deleto o ERRO 404',chk:m=>m.e404>=1,apply(){}}];
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
}
function metaListText(){
const n=UNLOCKS.filter(u=>u.chk(META)).length;
let s='RELÍQUIAS '+n+'/'+UNLOCKS.length+' — '+UNLOCKS.map(u=>u.chk(META)?('<b>'+u.name+'</b>'):u.name.replace(/./g,'·')).join(' · ')+'<br>abates totais '+META.kills+' · descidas '+META.deaths+' · vitórias '+META.wins;
if(game.dev)s+='<br><span class="pen">◆ PENUMBRA ATIVO — [1..9] cheats · [0] sala de testes</span>';
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
shopItems:[],roomEvent:null,e404T:0,e404Spawned:false,
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
elements:{gelo:0,fogo:0,veneno:0,trovao:0},elemCycle:0,multi:0,
parryCharge:0,parryLock:false,fome:false,fomeK:0,
ymir:false,incendio:false,berserk:false,storm:false,iraodin:false,heimdall:false,miasma:false,chain2:false,
biteFire:false,biteFrost:false,biteVenom:false,biteQuake:false,
novaT:2.5,stakeT:2.5,burstT:4,lightMagT:4,darkAng:0,shockT:2,
up:{},autoFire:false,soulAcc:0,keeper:null,
shake:0,hitstop:0,flash:0,hurtV:0,bossIntroT:0,introFlags:{},
lightT:3,deadT:0,overlayShown:false,
endPhase:null,endT:0,playerAlpha:1,darkSoul:null,enterFrom:null,gateCreak:0,
builder:{sel:'sh',items:[]},builderLive:false,deadTaunt:'',deadFaceX:0,deadFaceY:0};
const P={dmgMult:1,rateMult:1,reachMult:1,lightning:0,speedMult:1,biteMult:1,biteRange:1,
magnetMult:1,dashCdMult:1,invBonus:0,soulMult:1,parryRadius:110,
chainsaw:0,sword:0,nova:0,stakes:0,burst:0,dark:0,light:0,explShot:0,shock:0};
const DASH_CD=3,INV_DASH=1.0;
const frenzyDur=()=>game.hard?8:6;
let bullets=[],ebullets=[],enemies=[],pickups=[],particles=[],texts=[],bolts=[],arcs=[];
let hammers=[],biteFxs=[],swordFxs=[],novaFxs=[],stakeFxs=[];
let spawnMarks=[],geyserMarks=[],rings=[],shockwaves=[];
let thrownSaw=null,lightBeam=null;
let heartsPopT=0,heartsPopIdx=0;
const player={x:W/2,y:H*.75,r:11,hp:4,maxHp:4,inv:0,dashT:0,dashCd:0,dashAng:0,angle:-Math.PI/2,
shotT:0,biteT:0,slowT:0,walkT:0,dustT:0,dead:false,mvx:0,mvy:0,
sawT:0,swordT:0,sawAim:0,sawAnim:0,sawThrowCd:0};
/* ============ geração do mapa ============ */
const ROOM_SUBS=['as sombras se aglomeram','o cheiro de enxofre engrossa','algo se arrasta no escuro','os olhos acendem além das linhas','o silêncio pesa demais','os demônios aprenderam a esperar'];
const FLOOR_SUBS=['','o primeiro degrau da descida','as paredes trocaram de lugar','algo pesado ronda os corredores','o ar ficou grosso demais para respirar','a última descida — o guardião aguarda'];
function needsClear(kind){return kind==='combat'||kind==='challenge'||kind==='miniboss'||kind==='sboss';}
function countCleared(){return game.mapRooms.filter((r,i)=>r.cleared&&i!==game.extraIdx).length;}
function genRoomShape(kind){
if(kind==='boss')return{rects:[{x:0,y:0,w:W,h:H}],bw:W,bh:H};
if(kind==='start'){const w=640,h=430;return{rects:[{x:0,y:0,w:w,h:h}],bw:w,bh:h};}
const big=kind==='miniboss'||kind==='challenge';
const mw=big?irnd(640,760):irnd(540,700);
const mh=big?irnd(380,430):irnd(330,410);
const rects=[{x:0,y:0,w:mw,h:mh}];
const want=irnd(0,3);
const usedSides=[];
let tries=0,alc=0;
while(alc<want&&tries++<50){
const side=irnd(0,3);
if(usedSides.includes(side))continue;
if(side===0||side===2){
const aw=irnd(190,290),ah=irnd(110,155);
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
const aw=irnd(150,210),ah=irnd(150,235);
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
while((maxx-minx>1150||maxy-miny>556)&&rects.length>1){rects.pop();recompute();}
const rs=rects.map(r=>({x:r.x-minx,y:r.y-miny,w:r.w,h:r.h}));
return{rects:rs,bw:maxx-minx,bh:maxy-miny};
}
function genMap(){
 const rooms=[],grid={};
 const key=(x,y)=>x+','+y;
 function add(x,y,kind){
  const r={gx:x,gy:y,kind:kind,visited:false,cleared:false,e404:false,chestDropped:false,chestTaken:false,hasPortal:false,miniType:null,pzSolved:false,flavor:null,glyphSym:-1,pzType:null,shape:genRoomShape(kind),doors:{n:-1,e:-1,s:-1,w:-1}};
  rooms.push(r);grid[key(x,y)]=rooms.length-1;return r;
 }
 add(0,0,'start');
 const target=irnd(11,14)+Math.min(Math.floor(game.floor/2),2);
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
 if(far.length&&Math.random()<.55){takeFar().kind='treasure';}
 if(far.length>1){takeFar().kind='shop';}
 const miniPool=['mb','ex','vi','gz'].filter(t=>game.usedMinis.indexOf(t)<0);
 if(miniPool.length&&far.length>2){
  const t=pick(miniPool);game.usedMinis.push(t);
  const rm=takeFar();rm.kind='miniboss';rm.miniType=t;
 }
 if(Math.random()<Math.min(.45*secretMul(),.85)){const rm=takeFar();if(rm)rm.kind='challenge';}
 if(Math.random()<Math.min(.35*secretMul(),.85)){const rm=takeFar();if(rm)rm.kind='secret';}
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
  if(game.floor===1)rm.pzType=Math.random()<.7?'plates':'braziers';
  else rm.pzType=gi>=3?pick(['plates','braziers','braziers','echoes']):pick(['plates','braziers']);
 }
 const dv={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]};
 for(const r of rooms){
  for(const d in dv){
   const j=grid[key(r.gx+dv[d][0],r.gy+dv[d][1])];
   if(j!==undefined)r.doors[d]=j;
  }
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
player.x=W/2;player.y=H*.75;player.hp=4;player.maxHp=4;player.inv=0;player.dashT=0;player.dashCd=0;
player.dashAng=0;player.angle=-Math.PI/2;player.dead=false;player.shotT=0;player.biteT=0;player.slowT=0;
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
game.roomKind='combat';game.globalRoom=0;game.threat=1;game.portal=null;
game.doors=[];
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
game.fallK=-1;game.fallFrom=null;game.fallTo=null;game.fallTarget=null;
game.roomFade=0;game.treasureOpen=false;game.shopItems=[];game.keeper=null;game.keeperNear=false;game.roomEvent=null;game.e404T=0;game.e404Spawned=false;
game.builderLive=false;game.deadTaunt='';
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
heartsPopT=0;
P.dmgMult=1;P.rateMult=1;P.reachMult=1;P.lightning=0;P.speedMult=1;P.biteMult=1;P.biteRange=1;
P.magnetMult=1;P.dashCdMult=1;P.invBonus=0;P.soulMult=1;P.parryRadius=110;
P.chainsaw=0;P.sword=0;P.nova=0;P.stakes=0;P.burst=0;P.dark=0;P.light=0;P.explShot=0;P.shock=0;
resetBoss();
for(const u of UNLOCKS)if(u.chk(META)&&u.apply)u.apply();
}
function addHammer(){hammers.push({x:player.x,y:player.y,vx:0,vy:0,state:'idle',fireT:rnd(0.2,0.5),target:null,spin:rnd(TAU)});}
function setDiff(mode){
diffSel=mode;
const n=ov('dNorm'),h=ov('dHard'),hint=ov('diffHint');
if(n)n.classList.toggle('sel',mode==='normal');
if(h)h.classList.toggle('sel',mode==='hard');
if(hint)hint.textContent=mode==='hard'
?'bullet hell: mais atiradores, feitiços em dobro e chefes com padrões extras. o guardião espera na 5ª descida.'
:'a descida padrão. o inferno na medida.';
blip('sine',mode==='hard'?520:380,mode==='hard'?700:300,.08,.05);blurActive();
}
function openWeaponSelect(){
audio();game.paused=false;
['menu','dead','win','pause','levelup','weapons','options','book','lab','saves','shop','cheatmenu'].forEach(hideOv);
game.mapRooms=[];game.roomIdx=-1;game.extraIdx=-1;game.doors=[];
game.floor=1;game.usedMinis=[];game.portal=null;
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
buildRoomFloor();
game.fallK=-1;game.fallFrom=null;game.fallTo=null;game.fallTarget=null;
game.roomFade=0;game.treasureOpen=false;game.shopItems=[];game.keeper=null;game.keeperNear=false;game.roomEvent=null;game.e404T=0;game.e404Spawned=false;
game.builderLive=false;game.deadTaunt='';
game.reiT=0;game.reiSpawned=false;game.rkP2=false;game.rkUlt=null;
game.decor=[];game.roomWindow=null;game.windowScene=null;game.puzzle=null;game.seenGlyphs=[];game.penumbra=null;
game.parryCharge=0;game.parryLock=false;game.banner=null;game.headBanner=null;
showOv('weapons');
if(game.state!=='menu')game.state='select';
blurActive();
}
function startGame(weapon){
audio();game.weapon=weapon;game.hard=diffSel==='hard';
['menu','dead','win','pause','levelup','weapons','options','book','lab','saves','shop','cheatmenu'].forEach(hideOv);
blurActive();resetAll();
game.floor=1;game.usedMinis=[];
game.mapRooms=genMap();
game.state='play';
rollTitleFont();
game.banner={type:'circle',txt:'CÍRCULO 1',name:game.hard?'ABISMO':'LIMBO',sub:'derrote o chefe de cada mapa — cinco descidas até o guardião',t:0,dur:3.2};
blip('sine',180,120,0.3,0.08);
enterRoom(0,null);
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
for(const dir of ['n','e','s','w']){
const to=r.doors[dir];
if(to===undefined||to<0)continue;
const p=doorPos(dir);
game.doors.push({dir:dir,to:to,x:p.x,y:p.y,open:false,extra:game.extraIdx===to});
}
}
function openDoors(){
let opened=false;
for(const d of game.doors){if(!d.open){d.open=true;opened=true;}}
if(opened){sfx.gate();blip('sine',300,180,.2,.06);}
}
/* ---- decoração, janela e puzzle ---- */
const EMPTY_SUBS={
 silent:['nem o eco responde aqui','o vazio aqui tem gosto de pó','nada — e o nada retribui o olhar'],
 ruin:['isto já teve teto e propósito','as pedras lembram de mãos','o salão caiu antes de você chegar','não há nada para levar. nunca houve'],
 memory:['alguém acendeu velas aqui. há tempo','restos que ninguém veio buscar','a saudade ficou presa nas paredes','alguém rezava neste canto'],
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
 for(const d of game.doors)if(dist(x,y,d.x,d.y)<66)return false;
 const w=game.roomWindow;
 if(w&&Math.abs(x-w.x)<60&&Math.abs(y-w.y)<120)return false;
 for(const o of game.decor)if(dist(x,y,o.x,o.y)<48)return false;
 return true;
}
function buildDecor(r){
 game.decor=[];
 game.roomWindow=null;
 const area=game.absRects.reduce(function(s,rc){return s+rc.w*rc.h;},0);
 let srnd=((game.roomIdx+3)*13.7+game.floor*7.3+11)|0;
 const rf=function(){srnd=(srnd*16807)%2147483647;return srnd/2147483647;};
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
 /* decoração conforme o sabor da sala */
 let n=0;
 if(r.kind==='empty'){
  if(r.flavor==='silent')n=rf()<.5?1:0;
  else if(r.flavor==='ruin')n=2+Math.round(area/40000);
  else if(r.flavor==='memory')n=2+Math.round(area/52000);
  else n=1+Math.round(area/62000);
 }else if(r.kind==='puzzle')n=1+(rf()<.4?1:0);
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
 /* marca antiga (pista para o puzzle dos ecos) */
 if(r.glyphSym>=0){
  let p=null;
  for(let tr=0;tr<16;tr++){
   const q=randRoomPointM(rf,46);
   if(decorSpotOK(q.x,q.y,40)){p=q;break;}
  }
  if(p)game.decor.push({t:'glyph',x:p.x,y:p.y,s:1,f:rf(),sym:r.glyphSym,on:game.seenGlyphs.indexOf(r.glyphSym)>=0,lore:false,seen:true});
 }
}
function buildPuzzle(){
 const r=game.mapRooms[game.roomIdx];
 const type=r&&r.pzType?r.pzType:'plates';
 const diff=irnd(Math.min(2,Math.floor((game.floor+1)/2)),3);
 if(type==='braziers')buildBraziers(diff);
 else if(type==='echoes')buildEchoes();
 else buildPlates(diff);
 /* puzzles simples trancam as portas — a sala só abre quando resolver */
 const pz=game.puzzle;
 if(pz&&!pz.solved&&((pz.type==='plates'&&pz.diff<=1)||(pz.type==='braziers'&&pz.diff===0))){
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
 if(r){r.pzSolved=true;r.chestDropped=Math.random()<.72;}
 if(r&&r.chestDropped)pickups.push({type:'chest',x:m.x+m.w/2,y:m.y+m.h*.45,t:0,ph:rnd(TAU)});
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
 game.puzzle={type:'plates',plates:plates,need:1,numPlates:n,diff:diff,memoT:diff===0?1.5:diff===1?2.6:diff===2?3.2:3.8,failT:0,solved:false,showN:false};
 game.banner={type:'small',txt:'SALA DO PUZZLE',
  sub:'memorize a ordem e pise nas '+n+' placas numeradas'+(decoys?' — evite as '+decoys+' lousas falsas':''),
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
 game.puzzle={type:'braziers',braziers:braziers,order:order,hidden:hidden,diff:diff,prog:0,failT:0,solved:false};
 game.banner={type:'small',txt:'BRASEIROS APAGADOS',
  sub:diff===0?'acenda todos — passe por cima deles':diff===1?'memorize a ordem e acenda sem errar':diff===2?'a ordem tem uma lacuna — descubra o fogo ausente':'ordem longa, uma chama falsa e pouca margem para erro',
  t:0,dur:2.6};
 blip('sine',300,500,.2,.06);
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
 for(const b of pz.braziers){
  const near=dist(player.x,player.y,b.x,b.y)<26;
  if(near&&!b.near&&!b.lit){
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
 const show=pz.showN||pz.memoT>0||pz.failT>0;
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
  }else{
   ctx.strokeStyle=pz.solved?'#ffd9a0':'rgba(242,240,234,'+(.5+.25*Math.sin(game.t*3))+')';
  }
  ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();
  if(show&&!pl.pressed&&!pl.decoy)txt(''+pl.n,0,1,MONO,13,'#e6dac4');
  ctx.restore();
 }
}
function drawPzBraziers(pz){
 if(pz.diff>0){
  const m=game.absMain;
  const cx=m.x+m.w/2,cy=m.y+m.h*.5;
  const n=pz.order.length;
  const step=Math.min(46,(m.w-160)/n);
  ctx.save();
  ctx.globalAlpha=.9;
  ctx.fillStyle='rgba(18,13,18,.85)';
  ctx.strokeStyle='rgba(242,240,234,.2)';
  ctx.lineWidth=1.5;
  ctx.fillRect(cx-step*n/2-16,cy-24,step*n+32,48);
  ctx.strokeRect(cx-step*n/2-16,cy-24,step*n+32,48);
  for(let i=0;i<n;i++){
   const sx=cx-step*n/2+step*(i+.5);
   const done=i<pz.prog;
   if(i===pz.hidden){
    ctx.globalAlpha=.6+.35*Math.sin(game.t*7);
    txt('?',sx,cy+1,MONO,14,'#d9465a');
    ctx.strokeStyle='rgba(217,70,90,.6)';
    ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(sx-18,cy-20);ctx.lineTo(sx-8,cy-10);ctx.lineTo(sx-14,cy+2);
    ctx.stroke();
    ctx.globalAlpha=.9;
   }else drawSymbol(pz.order[i],sx,cy,9,done?'#ffd9a0':'#8a7d6c',.95);
  }
  ctx.restore();
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
  sfx.creak();blip('sine',80,40,1.4,.1);
 }
}
function enterRoom(i,fromDir){
 game.roomIdx=i;
 game.portal=null;
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
 game.roomEvent=null;game.shopItems=[];game.keeper=null;game.keeperNear=false;game.e404T=0;game.e404Spawned=false;
 bullets=[];ebullets=[];rings=[];geyserMarks=[];spawnMarks=[];shockwaves=[];enemies=[];
 thrownSaw=null;lightBeam=null;pickups=[];
 if(r.kind==='boss'){
  ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
  game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
  game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
  buildRoomFloor();buildDoors();
  player.x=W/2;player.y=H*.8;player.mvx=0;player.mvy=0;player.angle=-Math.PI/2;
  beginBossIntro();
  return;
 }
 const sh=r.shape;
 const ax=clamp(Math.round((W-sh.bw)/2+rnd(-50,50)),24,Math.max(24,W-24-sh.bw));
 const ay=clamp(Math.round((H-sh.bh)/2+12+rnd(-22,22)),58,Math.max(58,H-58-sh.bh));
 ROOM.x=ax;ROOM.y=ay;ROOM.w=sh.bw;ROOM.h=sh.bh;ROOM.inverted=false;
 game.absRects=sh.rects.map(rc=>({x:rc.x+ax,y:rc.y+ay,w:rc.w,h:rc.h}));
 game.absMain=game.absRects[0];
 buildRoomFloor();buildDoors();
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
   /* chefes secretos: viram SALA PRÓPRIA (ícone exclusivo no mapa) com cutscene */
   const roll404=Math.random()<Math.min(.01*secretMul(),.06);
   const rollRei=!game.reiFought&&Math.random()<Math.min(.014*secretMul(),.05);
   if(roll404||rollRei){
    r.kind='sboss';r.sbossKind=roll404?'e404':'rei';game.roomKind='sboss';
    startSecretBossIntro(r.sbossKind,r);
    return;
   }
   if(Math.random()<Math.min(.15*secretMul(),.45)){
    const ev=pick(['soulrain','frenzy','blood','void']);
    game.roomEvent={type:ev,t:0,acc:0};
    game.banner={type:'boss',txt:'EVENTO',sub:EVENT_LABEL[ev],t:0,dur:2};sfx.echo();
   }else game.banner={type:'small',txt:'SALA '+(i+1),sub:pick(ROOM_SUBS),t:0,dur:1.4};
   game.roomQueue=buildRoomQueue('combat');
  }else if(r.kind==='miniboss'){
   const t=r.miniType||'mb';
   spawnMarkAt(t,game.absMain.x+game.absMain.w/2,game.absMain.y+game.absMain.h*.3,true);
   game.banner={type:'boss',txt:MINI_NAMES[t],sub:'o chefe deste mapa',t:0,dur:2.2};
   sfx.roar();game.shake=10;
  }else if(r.kind==='challenge'){
   game.roomQueue=buildRoomQueue('challenge');
   game.banner={type:'boss',txt:'SALA DE DESAFIO',sub:'sobreviva — um tesouro espera',t:0,dur:2.2};
   sfx.roar();game.shake=8;
  }
 }else if(r.cleared){game.waveState='done';}
 if(r.kind==='sboss'&&!r.cleared){startSecretBossIntro(r.sbossKind,r);return;}
 if(!r.cleared&&!needsClear(r.kind)){r.cleared=true;game.waveState='done';}
 if(first){
  if(r.kind==='treasure'){
   if(Math.random()<.55){r.chestDropped=true;
   pickups.push({type:'chest',x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0,ph:rnd(TAU)});
   }
   game.banner={type:'small',txt:'SALA DO TESOURO',sub:r.chestDropped?'um baú pulsa no centro':'as pedras guardam apenas vazio',t:0,dur:1.8};
   blip('sine',600,900,.2,.07);
  }else if(r.kind==='shop'){
   buildShop();
   game.banner={type:'small',txt:'LOJA DO LIMBO',sub:'o errante troca almas por poder — aproxime-se e aperte [Z]',t:0,dur:2.4};
   blip('sine',600,900,.2,.07);
  }else if(r.kind==='secret'){
   if(Math.random()<.28){
    r.chestDropped=true;
    pickups.push({type:'chest',x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0,ph:rnd(TAU)});
   }
   for(let k=0;k<10;k++)pickups.push({type:'soul',x:game.absMain.x+game.absMain.w/2+rnd(-80,80),y:game.absMain.y+game.absMain.h*.6+rnd(-50,50),t:0,ph:rnd(TAU)});
   game.banner={type:'small',txt:'SALA SECRETA',sub:'as paredes estiveram rachadas todo esse tempo',t:0,dur:2.2};
   sfx.echo();
  }else if(r.kind==='start'&&game.floor===1){
   game.banner={type:'small',txt:'LIMBO — SALA INICIAL',sub:'aprenda os comandos antes de descer',t:0,dur:2.4};
   blip('sine',150,90,.25,.06);
  }
 }
 if(!first&&(r.kind==='treasure'||r.kind==='secret'||r.kind==='challenge'||r.kind==='puzzle')&&r.chestDropped&&!r.chestTaken){
  pickups.push({type:'chest',x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0,ph:rnd(TAU)});
 }
 if(r.hasPortal&&game.floor<5){
  game.portal={x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0};
 }
 if(r.cleared&&!(game.puzzle&&game.puzzle.lock&&!game.puzzle.solved))openDoors();
}
function checkFullSweep(){
if(!game.mapRooms.length)return;
if(game.builderLive)return;
if(game.floor<5){
if(!game.mapRooms.every(r=>r.cleared))return;
if(game.portal)return;
const r=game.mapRooms[game.roomIdx];
if(r)r.hasPortal=true;
game.portal={x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0};
game.banner={type:'boss',txt:'O MAPA FOI VARRIDO',sub:'o portal para a próxima descida se abriu',t:0,dur:2.8};
sfx.rumble();sfx.echo();game.shake=12;game.flash=.3;
return;
}
if(game.extraIdx>=0)return;
if(game.mapRooms.every(r=>r.cleared))openExtraRoom();
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
game.floor++;
game.portal=null;game.extraIdx=-1;
game.rkP2=false;game.rkUlt=null;
game.mapRooms=genMap();game.seenGlyphs=[];
game.roomIdx=-1;
game.roomFade=1;
enterRoom(0,null);
game.banner={type:'wave',txt:'DESCIDA '+roman(game.floor),sub:FLOOR_SUBS[clamp(game.floor,1,5)]||'',t:0,dur:2.4};
blip('sine',150,90,.3,.08);
sfx.rumble();
}
function devGoBoss(){
game.floor=5;
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
sfx.rumble();
}
/* ============ jogador ============ */
function tryInteract(){
 if(game.paused||optionsOpen()||player.dead)return;
 if(game.state==='shop'){closeShopOv();return;}
 if(game.state!=='play'&&game.state!=='bossintro')return;
 if(game.windowScene)return;
 /* NPC da loja — O ERRANTE */
 if(game.keeper&&game.keeperNear&&dist(player.x,player.y,game.keeper.x,game.keeper.y)<86){
  openShopOv();
  return;
 }
 const w=game.roomWindow;
 if(!w||w.used)return;
 if(enemies.length||spawnMarks.length||boss.active)return;
 if(dist(player.x,player.y,w.x,w.iy)<62){
  w.used=true;
  game.windowScene={t:0,dur:4.6,tree:w.tree};
  sfx.creak();
  blip('sine',120,70,.6,.07);
 }
}
function tryDash(){
 if(game.paused||optionsOpen())return;
 if(game.windowScene){return;}
 if(game.state!=='play'&&game.state!=='bossintro')return;
 if(player.dead||player.dashCd>0||!game.weapon)return;
 player.dashAng=(player.mvx||player.mvy)?Math.atan2(player.mvy,player.mvx):player.angle;
 player.dashT=.16;player.dashCd=DASH_CD*P.dashCdMult;
 player.inv=Math.max(player.inv,INV_DASH);sfx.dash();
}
function tryThrowSaw(){
 if(game.paused||optionsOpen())return;
 if(game.state!=='play'&&game.state!=='bossintro')return;
 if(game.windowScene)return;
 if(!P.chainsaw||player.dead||thrownSaw||player.sawThrowCd>0)return;
 const tgt=nearestTarget(520);let a=player.angle;
 if(tgt){const p=targetPos(tgt);if(p)a=Math.atan2(p.y-player.y,p.x-player.x);}
 thrownSaw={x:player.x,y:player.y,vx:Math.cos(a)*680,vy:Math.sin(a)*680,ang:a,spin:0,state:'out',dist:0};
 player.sawThrowCd=3.2;sfx.throw();sfx.saw();
}
function updatePlayer(dt){
if(player.dead)return;
if(game.fallK>=0){
game.fallK+=dt/0.85;
const k=smooth(Math.min(1,game.fallK));
player.x=lerp(game.fallFrom.x,game.fallTo.x,k);
player.y=lerp(game.fallFrom.y,game.fallTo.y,k);
if(Math.random()<.6)particles.push({x:player.x+rnd(-8,8),y:player.y+rnd(-8,8),vx:rnd(-25,25),vy:rnd(-70,-20),life:.4,t:0,r:rnd(1,2.5),c:game.fallTarget&&game.fallTarget.floor?'#c9a0ff':'#9d6bb5',drag:1,glow:true});
if(game.fallK>=1){
const t=game.fallTarget;
game.fallK=-1;game.fallFrom=null;game.fallTo=null;game.fallTarget=null;
game.roomFade=1;
if(t&&t.floor){nextFloor();return;}
enterRoom(t.to,t.dir);
}
return;
}
if(player.dashCd>0)player.dashCd-=dt;
if(player.sawThrowCd>0)player.sawThrowCd-=dt;
if(player.slowT>0)player.slowT-=dt;
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
const spd=285*P.speedMult*(player.slowT>0?.55:1);
if(l){
player.x+=ax/l*spd*dt;player.y+=ay/l*spd*dt;
player.mvx=ax/l;player.mvy=ay/l;player.walkT+=dt*9;
player.dustT-=dt;
if(player.dustT<=0){player.dustT=.28;particles.push({x:player.x+rnd(-4,4),y:player.y+8,vx:rnd(-10,10),vy:rnd(-14,-4),life:.5,t:0,r:2.5,c:'#2a2126',drag:1});}
}
player.angle=(player.mvx||player.mvy)?Math.atan2(player.mvy,player.mvx):player.angle;
clampArena(player,player.r);
resolveDecorCollision(player,player.r);
clampArena(player,player.r);
}
if(game.state==='play'){
if(game.portal&&dist(player.x,player.y,game.portal.x,game.portal.y)<40){
game.fallK=0;game.fallFrom={x:player.x,y:player.y};game.fallTo={x:game.portal.x,y:game.portal.y};
game.fallTarget={floor:true};
sfx.howl();sfx.echo();game.shake=Math.max(game.shake,8);
}else if(game.roomKind!=='boss'){
for(const d of game.doors){
if(!d.open)continue;
if(dist(player.x,player.y,d.x,d.y)<30){
game.fallK=0;game.fallFrom={x:player.x,y:player.y};game.fallTo={x:d.x,y:d.y};
game.fallTarget={to:d.to,dir:d.dir};
sfx.howl();game.shake=Math.max(game.shake,6);
break;
}
}
}
}
player.inv-=dt;
if(game.meleeHitT>0)game.meleeHitT-=dt;
}
/* PARRY (GUARDA DE DEUS): só funciona com armas de curta distância.
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
game.deadTaunt=pick(DEATH_TAUNTS);
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
/* Triunfo dos Cavaleiros: cão e cavaleiro imortais — qualquer dano normal é ignorado
   (apenas hitkills telegrafados ainda ferem) */
if(game.knightInvuln)return;
player.hp--;player.inv=1.15+P.invBonus;game.hurtV=1;game.shake=Math.max(game.shake,14);
game.hitstop=.09;heartsPopT=.6;heartsPopIdx=player.hp;
sparks(player.x,player.y,'#d9465a',10,220,.5,3,true);sfx.hurt();
if(player.hp<=0){
game.deadTaunt=pick(DEATH_TAUNTS);
player.hp=0;player.dead=true;game.state='dead';game.deadT=0;game.overlayShown=false;
META.deaths++;saveMeta();
game.shake=18;sfx.die();
for(let i=0;i<14;i++)particles.push({x:player.x+rnd(-8,8),y:player.y+rnd(-8,8),vx:rnd(-30,30),vy:rnd(-120,-50),life:rnd(.8,1.6),t:0,r:rnd(1.5,3.5),c:'#8fd0e8',drag:.5,glow:true});
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
}
/* ============ modo tiro (MANUAL — clique esquerdo / setas; automático só com o OLHO DO CAÇADOR) ============ */
const mouse={x:W/2,y:H*.4,inCanvas:false};
function cvToWorld(clientX,clientY){return{x:(clientX-view.ox)/view.s,y:(clientY-view.oy)/view.s};}
function fireShot(a){
if(player.shotT>0)return;
const reach=470*P.reachMult;
player.shotT=1/(1.9*P.rateMult);
const baseA=a;
const elems=ownedElems();
const n=1+game.multi;
for(let i=0;i<n;i++){
const off=(i-(n-1)/2)*.13;
const ang=baseA+off;
const elem=elems.length?elems[game.elemCycle++%elems.length]:null;
let mult=1;
if(elem)mult=ELEM_DATA[elem].mult*(1+.12*(game.elements[elem]-1));
bullets.push({x:player.x+Math.cos(ang)*16,y:player.y+Math.sin(ang)*16,vx:Math.cos(ang)*900,vy:Math.sin(ang)*900,r:5,dmg:7*P.dmgMult*mult,life:reach/900,a:ang,elem:elem});
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
if(t.kind==='enemy'){t.obj.hp-=d;t.obj.flash=.1;if(t.obj.hp<=0)killEnemy(t.obj);}else hitHead(t.obj,d);
}
}
}
}
function tryShootAt(wx,wy){
if(game.paused||optionsOpen())return;
if(game.windowScene)return;
if((game.state!=='play'&&game.state!=='bossintro')||player.dead||(!game.hasShot&&!game.hasBite))return;
const a=Math.atan2(wy-player.y,wx-player.x);
player.angle=a;
if(game.hasShot)fireShot(a);
if(game.hasBite)tryBite(a);
}
let arrowShotT=0;
function updateShot(dt){
player.shotT-=dt;
arrowShotT-=dt;
if(game.paused||player.dead)return;
/* setinhas do teclado: atacam na direção segurada (tiro e/ou mordida) */
let sx=0,sy=0;
if(keys['ArrowLeft'])sx--;if(keys['ArrowRight'])sx++;if(keys['ArrowUp'])sy--;if(keys['ArrowDown'])sy++;
if(sx||sy){
const a=Math.atan2(sy,sx);
player.angle=a;
if(game.hasShot)fireShot(a);
if(game.hasBite&&arrowShotT<=0){tryBite(a);arrowShotT=.12;}
return;
}
/* tiro automático — somente com a bênção rara OLHO DO CAÇADOR */
if(game.autoFire&&game.hasShot){
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
sparks(e.x,e.y,'#9fd8ff',3,100,.4,2.5,true);sfx.freeze();
}else if(elem==='fogo'){
e.burnT=2+.8*lvl;e.burnD=(1.8+1.2*lvl)*P.dmgMult;
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
const chainDmg=dmg*(.5+.15*lvl);
arcs.push({x1:e.x,y1:e.y,x2:bt.head?bt.head.hx:bt.x,y2:bt.head?bt.head.hy:bt.y,t:0,life:.18});
if(bt.head){
bt.head.hp-=chainDmg;bt.head.flash=.1;
if(bt.head.hp<=0)killHead(bt.head);
}else{
bt.hp-=chainDmg;
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
if(b.life<=0||!inRoomXY(b.x,b.y,8)){bullets.splice(i,1);continue;}
if(Math.random()<.4)particles.push({x:b.x,y:b.y,vx:rnd(-15,15),vy:rnd(-15,15),life:.2,t:0,r:1.5,c:b.elem?ELEM_DATA[b.elem].c:'#cfe9ff',glow:true});
let hit=false;
for(const e of enemies){
if(e.dead)continue;
if(dist(b.x,b.y,e.x,e.y)<e.r+b.r+2){
if(!shadowInvuln(e)){if(!knightRedirectHorse(e,b.dmg)){e.hp-=elemDmg(e,b.dmg);e.flash=.1;}}
hit=true;sfx.ehit();
sparks(b.x,b.y,b.elem?ELEM_DATA[b.elem].c:'#cfe9ff',3,150,.3,2,true);
if(b.elem)applyElem({kind:'enemy',obj:e},b.elem,b.dmg);
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
if(hit)bullets.splice(i,1);
}
}
/* ============ modo mordida (manual: vem junto do clique/setas) ============ */
function tryBite(a){
if(player.biteT>0)return;
player.biteT=1/(0.95*P.rateMult);
const range=112*P.biteRange*(0.72+0.28*P.reachMult);
const ang=a;
const berserkMul=(game.berserk&&player.hp<=1)?1.75:1;
const dmg=14*P.dmgMult*P.biteMult*berserkMul;
biteFxs.push({x:player.x+Math.cos(ang)*72,y:player.y+Math.sin(ang)*72,ang:ang,t:0,life:.22});
sfx.bite();game.shake=Math.max(game.shake,4);
for(const e of enemies){
if(e.dead)continue;
const d=dist(player.x,player.y,e.x,e.y);
if(d<range+e.r&&Math.abs(angDiff(Math.atan2(e.y-player.y,e.x-player.x),ang))<1.0){
if(!shadowInvuln(e)){if(!knightRedirectHorse(e,dmg)){e.hp-=elemDmg(e,dmg);e.flash=.12;}}
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
/* GUARDA DE DEUS: a mordida rebate os tiros que a hitbox acertar */
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
if(!shadowInvuln(e)){if(!knightRedirectHorse(e,dmg)){e.hp-=elemDmg(e,dmg);e.flash=.12;}}
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
/* ============ mjölnir ============ */
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
2:[['sh',3],['al',2],['sp',3],['fs',2],['br',1],['es',1],['cr',2],['vg',1]],
3:[['sh',2],['sp',3],['fs',2],['ru',2],['ce',1],['al',2],['es',1],['la',1],['br',1],['cr',2],['vg',1],['fa',1]],
4:[['sh',2],['sp',3],['fs',3],['ru',2],['ce',2],['gd',1],['es',1],['la',1],['al',1],['cr',2],['vg',1],['fa',1],['pg',1]],
5:[['sh',2],['sp',3],['fs',3],['ru',3],['ce',2],['gd',2],['es',2],['la',2],['cr',2],['vg',1],['fa',1],['pg',1]]};
const pool=pools[f];
let count=6+f*2+irnd(0,3);
if(kind==='challenge')count=Math.round(count*1.7);
if(game.hard)count=Math.round(count*1.25);
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
/* ============ bestiário ============ */
const BESTIARY={
sh:['SOMBRA DESPERTA','a alma mais comum do limbo. voa torto, morre fácil — e nunca vem sozinha.'],
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
pn:['PEÃO DO REI','soldado de xadrez do velho rei. marcha em fila.'],
puppy:['CÃOZINHO DO CÉRBERO','filhote cuspidor invocado pelo guardião.'],
mb:['O BRUXO DO LIMBO','chefe de mapa. dezesseis feitiços de bullet hell.'],
ex:['O CARRASCO DO LIMBO','chefe de mapa. machado, minas e investidas.'],
vi:['A VIÚVA DO LIMBO','chefe de mapa. oito pernas, teias e almas teleguiadas.'],
gz:['O GOLEM DE CINZAS','chefe de mapa. laser giratório e chuva de pedra.'],
rk:['O VELHO REI DO XADREZ','chefe secreto. conhece thor de outro tempo e joga com os mortos. na fase II, seis dele.'],
e404:['ERRO 404','a sala que não deveria existir. quinze movesets de glitch. deletá-lo desperta algo.']
};
/* ============ inimigos ============ */
function spawnMarkAt(type,x,y,big){
if(x===undefined){
const m=game.absMain;
x=lerp(m.x+70,m.x+m.w-70,Math.random());
y=lerp(m.y+70,m.y+m.h-70,Math.random());
}
const p=roomPt(x,y,36);
spawnMarks.push({x:p.x,y:p.y,type:type,t:0,dur:big?1.2:.75,big:big});
}
function spawnEnemy(type,x,y){
const c=game.threat;
if(!META.seen[type]){META.seen[type]=1;saveMeta();}
const e={x:x,y:y,type:type,flash:0,spawnT:0,ang:rnd(TAU),seed:rnd(10),hitT:0,dead:false,slowT:0,burnT:0,poisT:0,poisD:0,poisStack:0,burnD:0};
if(type==='sh'){e.r=13;e.hp=10+c*3;e.sp=(game.hard?132:118)+c*4;}
else if(type==='br'){e.r=24;e.hp=55+c*8;e.sp=(game.hard?64:55)+c*2;}
else if(type==='sp'){e.r=12;e.hp=16+c*3;e.sp=game.hard?95:82;e.shootT=rnd(1.4,2.6);e.charge=0;e.burst=0;}
else if(type==='fs'){e.r=13;e.hp=20+c*3;e.sp=game.hard?80:70;e.shootT=rnd(1.6,2.8);e.charge=0;e.burst=0;}
else if(type==='ru'){e.r=11;e.hp=14+c*3;e.sp=game.hard?106:95;e.dashCd=rnd(.5,1.5);e.teleT=0;e.dashT=0;e.dashA=0;}
else if(type==='ce'){e.r=17;e.hp=40+c*5;e.sp=game.hard?66:58;}
else if(type==='gd'){e.r=26;e.hp=70+c*8;e.sp=game.hard?46:38;}
else if(type==='al'){e.r=9;e.hp=8+c*2;e.sp=58+c*3;}
else if(type==='es'){e.r=15;e.hp=28+c*5;e.sp=44;e.tpT=rnd(2.2,3.6);}
else if(type==='la'){e.r=13;e.hp=24+c*4;e.sp=34;e.cryT=rnd(1.8,3);}
else if(type==='cr'){e.r=13;e.hp=12+c*2;e.sp=(game.hard?152:136)+c*2;}
else if(type==='crs'){e.r=7;e.hp=5+c;e.sp=(game.hard?190:168)+c*2;}
else if(type==='vg'){e.r=14;e.hp=26+c*4;e.sp=30;e.aimT=rnd(1.5,2.5);e.aimA=0;}
else if(type==='pg'){e.r=20;e.hp=75+c*9;e.sp=22;e.pulseT=rnd(2,3.2);}
else if(type==='fa'){e.r=12;e.hp=18+c*3;e.sp=60;e.restT=0;e.dashT=0;e.dashA=0;}
else if(type==='pn'){e.r=10;e.hp=14+c*3;e.sp=52+c*2;}
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
else{e.r=10;e.hp=10;e.sp=game.hard?245:210;}
if(type!=='e404'&&type!=='rk'&&type!=='rkm'&&type!=='cw1'&&type!=='cw2'&&type!=='cw3'&&type!=='cw4'){
const sm=1+(secretMul()-1)*.15;
if(sm!==1){e.hp=Math.max(1,Math.round(e.hp*sm));if(e.maxHp)e.maxHp=e.hp;}
}
if(game.roomEvent&&game.roomEvent.type==='frenzy')e.sp*=1.35;
enemies.push(e);
}
const MINI_NAMES={mb:'O BRUXO DO LIMBO',ex:'O CARRASCO DO LIMBO',vi:'A VIÚVA DO LIMBO',gz:'O GOLEM DE CINZAS'};
const MINI_COLORS={mb:'#cfd8dc',ex:'#e8455a',vi:'#9d6bb5',gz:'#ff8f3d'};
function killEnemy(e){
if(e.dead)return;
e.dead=true;game.kills++;META.kills++;
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
sfx.kill();
sparks(e.x,e.y,'#3a1a22',10,190,.55,3.5);
sparks(e.x,e.y,'#5a2430',5,120,.7,5);
let nS=(e.type==='br'||e.type==='ce')?3:(e.type==='sp'||e.type==='fs')?2:irnd(1,2);
if(e.type==='al')nS=3;
if(e.type==='es')nS=4;
if(e.type==='la')nS=3;
if(e.type==='cr'){nS=2;for(let i=0;i<2;i++)spawnMarkAt('crs',e.x+rnd(-18,18),e.y+rnd(-18,18));}
if(e.type==='crs')nS=1;
if(e.type==='vg')nS=2;
if(e.type==='fa')nS=2;
if(e.type==='pg')nS=4;
if(e.type==='pn')nS=1;
if(e.type==='gd'){
for(let i=0;i<(game.hard?3:2);i++)spawnMarkAt('sh',e.x+rnd(-30,30),e.y+rnd(-30,30));
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
if(Math.random()<.25)pickups.push({type:'chest',x:e.x,y:e.y-40,t:0,ph:rnd(TAU)});
}
if(e.type==='e404'){
nS=26;
game.shake=26;game.flash=.65;game.hitstop=.22;
META.e404++;saveMeta();
sfx.explode();sfx.headDie();sfx.roar();
sparks(e.x,e.y,'#f2f0ea',34,380,1,4,true);
sparks(e.x,e.y,'#ff4fd8',20,300,.85,3.5,true);
sparks(e.x,e.y,'#4ff5ff',12,240,.6,3,true);
game.banner={type:'small',txt:'ERRO 404 FOI DELETADO',sub:'algo novo desperta no vazio...',t:0,dur:2.6};
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
for(let i=0;i<nS;i++)pickups.push({type:'soul',x:e.x+rnd(-18,18),y:e.y+rnd(-18,18),t:0,ph:rnd(TAU)});
if(Math.random()<0.08*evDropMul()&&e.type!=='mb'&&e.type!=='ex'&&e.type!=='vi'&&e.type!=='gz'&&e.type!=='e404'&&game.roomKind!=='challenge')
pickups.push({type:'heart',x:e.x,y:e.y,t:0,ph:rnd(TAU)});
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
player.hp++;sfx.heart();
texts.push({x:player.x,y:player.y-30,txt:'+VIDA',t:0,life:1,c:'#d9465a',size:16,disp:true});
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
function updateEnemies(dt){
enemies=enemies.filter(e=>!e.dead);
for(const e of enemies){
e.flash-=dt;e.hitT-=dt;
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
if(Math.random()<dt*10)particles.push({x:e.x+rnd(-e.r,e.r),y:e.y+rnd(-e.r,e.r),vx:rnd(-8,8),vy:rnd(-60,-20),life:.5,t:0,r:2,c:'#a8c24f',drag:1,glow:true});
if(e.hp<=0){killEnemy(e);continue;}
}
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
}else{
e.dashT=.42;e.dashA=a;
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
if(!player.dead&&d<e.r+player.r-4){
hurtPlayer();
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
/* ============ o bruxo do limbo ============ */
const MB_PATS=['spiral','cross','crown','souls','blink','frost','wall','meteor','bounce','flower','snipe','swarm'];
const MB_HARD_PATS=['shotgun','rings','bothwalls','twin'];
const mbPats=()=>game.hard?MB_PATS.concat(MB_HARD_PATS):MB_PATS;
function miniBossAI(e,dt,a,d,slowMul){
e.stT+=dt;
if(e.st==='float'){
if(d>340){e.x+=Math.cos(a)*e.sp*slowMul*dt;e.y+=Math.sin(a)*e.sp*slowMul*dt;}
else if(d<240){e.x-=Math.cos(a)*e.sp*slowMul*dt;e.y-=Math.sin(a)*e.sp*slowMul*dt;}
else{const pp=Math.sin(game.t*.8+e.seed);e.x+=-Math.sin(a)*e.sp*.7*pp*dt;e.y+=Math.cos(a)*e.sp*.7*pp*dt;}
e.ang=lerpAngle(e.ang,a,1-Math.exp(-3*dt));
e.atkT-=dt;
if(e.atkT<=0){
const pats=mbPats();
e.patIdx=(e.patIdx+1)%pats.length;e.pat=pats[e.patIdx];
e.st='tele';e.stT=0;sfx.growl();
}
}else if(e.st==='tele'){
if(e.stT>=(game.hard?.5:.7)){e.st=e.pat;e.stT=0;mbActStart(e);}
}else mbActUpdate(e,dt);
clampArena(e,e.r);
if(!player.dead&&d<e.r+player.r-4)hurtPlayer();
}
function mbActStart(e){
if(e.pat==='spiral')e.data={spin:rnd(TAU),tick:0,dur:game.hard?3.4:2.6};
else if(e.pat==='cross')e.data={rot:rnd(TAU),salvoT:0,dur:game.hard?3.2:2.4};
else if(e.pat==='crown')e.data={waveT:0,waves:0};
else if(e.pat==='souls')e.data={fired:false};
else if(e.pat==='blink')e.data={moved:false,fired:false};
else if(e.pat==='frost')e.data={f1:false,f2:false};
else if(e.pat==='wall')e.data={w1:false,w2:false};
else if(e.pat==='meteor')e.data={salvoT:.1,s:0};
else if(e.pat==='shotgun')e.data={volleys:0,t:.15};
else if(e.pat==='rings')e.data={rings:0,ringT:.1,gap:rnd(TAU)};
else if(e.pat==='bothwalls')e.data={h:false,v:false,v2:false};
else if(e.pat==='twin')e.data={spin:rnd(TAU),tick:0,dur:game.hard?3.2:2.8};
else if(e.pat==='bounce')e.data={tick:.1,dur:game.hard?2.2:1.7};
else if(e.pat==='flower')e.data={rings:0,ringT:.1};
else if(e.pat==='snipe')e.data={shots:0,t:.1};
else if(e.pat==='swarm')e.data={fired:false};
}
function mbEnd(e){e.st='float';e.stT=0;e.atkT=game.hard?.55+rnd(.3):1.6+rnd(.6);}
function mbSpawnWall(dir){
const gapA=irnd(2,10),gapB=irnd(2,10),spd=game.hard?260:240;
for(let i=0;i<14;i++){
if(game.hard?(i===gapA||i===gapB):(i===gapA||i===gapA+1||i===gapB||i===gapB+1))continue;
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
if(e.pat==='spiral'){
e.data.tick-=dt;
if(e.data.tick<=0){
e.data.tick=game.hard?.05:.08;e.data.spin+=game.hard?.42:.3;
for(let k=0;k<(game.hard?4:2);k++){
const a=e.data.spin+k*Math.PI/(game.hard?2:1);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*175,vy:Math.sin(a)*175,r:5,c:'#cfd8dc'});
}
}
if(e.stT>=e.data.dur)mbEnd(e);
}else if(e.pat==='cross'){
e.data.salvoT-=dt;
if(e.data.salvoT<=0){
e.data.salvoT=game.hard?.28:.45;e.data.rot+=game.hard?.5:.35;
const m=game.hard?3:1;
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
const maxW=game.hard?5:3;
if(e.data.waveT<=0&&e.data.waves<maxW){
e.data.waves++;e.data.waveT=game.hard?.4:.6;
const n=game.hard?22:16,gapI=irnd(0,n-1),off=rnd(TAU);
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
const base=Math.atan2(pp.y-e.y,pp.x-e.x),n=game.hard?9:5;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.25;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,r:6,c:'#e6f0f2',home:game.hard?2.8:2.2,homeT:game.hard?4.5:3.4});
}
sfx.howl();
}
if(e.stT>=.9)mbEnd(e);
}else if(e.pat==='blink'){
if(e.stT>=.35&&!e.data.moved){
e.data.moved=true;
sparks(e.x,e.y,'#31242e',14,200,.5,5);
const ta=rnd(TAU),td=game.hard?190:230;
const pt=roomPt(pp.x+Math.cos(ta)*td,pp.y+Math.sin(ta)*td,40);
e.x=pt.x;e.y=pt.y;
sparks(e.x,e.y,'#cfd8dc',14,220,.5,4,true);
blip('sawtooth',80,40,.3,.14);game.shake=Math.max(game.shake,6);
}
if(e.stT>=.5&&!e.data.fired){
e.data.fired=true;
const base=Math.atan2(pp.y-e.y,pp.x-e.x),n=game.hard?12:7;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.13;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*330,vy:Math.sin(a)*330,r:5,c:'#cfd8dc'});
}
const nh=game.hard?4:2;
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
rings.push({x:e.x,y:e.y,r:30,vr:game.hard?330:300,th:14,gapA:rnd(TAU),gapW:game.hard?.7:1,c:'#9fd8ff',slow:true});
sfx.freeze();sfx.howl();
}
if(e.stT>=.6&&!e.data.f2){
e.data.f2=true;
rings.push({x:e.x,y:e.y,r:30,vr:game.hard?360:340,th:14,gapA:rnd(TAU),gapW:game.hard?.65:.95,c:'#9fd8ff',slow:true});
sfx.freeze();
}
if(game.hard&&e.stT>=.95&&!e.data.f3){
e.data.f3=true;
rings.push({x:e.x,y:e.y,r:30,vr:340,th:14,gapA:rnd(TAU),gapW:.65,c:'#9fd8ff',slow:true});
sfx.freeze();
}
if(e.stT>=(game.hard?1.5:1.1))mbEnd(e);
}else if(e.pat==='wall'){
if(!e.data.w1){e.data.w1=true;mbSpawnWall(Math.random()<.5?1:-1);}
if(e.stT>=.8&&!e.data.w2){e.data.w2=true;mbSpawnWall(Math.random()<.5?1:-1);}
if(game.hard&&e.stT>=1.2&&!e.data.w3){e.data.w3=true;mbSpawnWall(Math.random()<.5?1:-1);}
if(e.stT>=(game.hard?1.8:1.3))mbEnd(e);
}else if(e.pat==='meteor'){
e.data.salvoT-=dt;
if(e.data.salvoT<=0&&e.data.s<(game.hard?5:3)){
e.data.s++;e.data.salvoT=game.hard?.42:.6;
const nm=game.hard?6:3;
for(let i=0;i<nm;i++){
const a=rnd(TAU),dd=rnd(0,game.hard?180:130);
const pt=roomPt(pp.x+Math.cos(a)*dd,pp.y+Math.sin(a)*dd,50);
geyserMarks.push({x:pt.x,y:pt.y,t:0,dur:game.hard?.55:.75,phase:'mark',c:'#cfd8dc'});
}
blip('sawtooth',110,70,.3,.08);
}
if(e.data.s>=(game.hard?5:3)&&e.stT>=(game.hard?2.4:1.9))mbEnd(e);
}else if(e.pat==='shotgun'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.volleys<(game.hard?5:4)){
e.data.volleys++;e.data.t=.24;
const base=Math.atan2(pp.y-e.y,pp.x-e.x),n=game.hard?8:6;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.11;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*340,vy:Math.sin(a)*340,r:5,c:'#cfd8dc'});
}
sfx.spit();
}
if(e.data.volleys>=(game.hard?5:4)&&e.stT>=1.4)mbEnd(e);
}else if(e.pat==='rings'){
e.data.ringT-=dt;
if(e.data.ringT<=0&&e.data.rings<(game.hard?4:3)){
e.data.rings++;e.data.ringT=.5;e.data.gap+=1.1;
rings.push({x:e.x,y:e.y,r:26,vr:game.hard?330:300,th:13,gapA:e.data.gap,gapW:.85,c:'#cfd8dc'});
sfx.freeze();
}
if(e.data.rings>=(game.hard?4:3)&&e.stT>=1.8)mbEnd(e);
}else if(e.pat==='bothwalls'){
if(!e.data.h){e.data.h=true;mbSpawnWall(1);mbSpawnWall(-1);}
if(e.stT>=.7&&!e.data.v){e.data.v=true;mbSpawnWallV(Math.random()<.5?1:-1);}
if(game.hard&&e.stT>=1.1&&!e.data.v2){e.data.v2=true;mbSpawnWallV(Math.random()<.5?1:-1);}
if(e.stT>=(game.hard?1.6:1.4))mbEnd(e);
}else if(e.pat==='twin'){
e.data.tick-=dt;
if(e.data.tick<=0){
e.data.tick=game.hard?.08:.09;e.data.spin+=.38;
const arms=game.hard?3:2;
for(let k=0;k<arms;k++){
const a=e.data.spin+k*Math.PI/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*175,vy:Math.sin(a)*175,r:5,c:'#cfd8dc'});
const a2=-e.data.spin*1.15+k*Math.PI/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a2)*175,vy:Math.sin(a2)*175,r:5,c:'#e6f0f2'});
}
}
if(e.stT>=e.data.dur)mbEnd(e);
}else if(e.pat==='bounce'){
e.data.tick-=dt;
if(e.data.tick<=0){
e.data.tick=game.hard?.16:.22;
const n=game.hard?3:2;
for(let i=0;i<n;i++){
const a=rnd(TAU);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(game.hard?260:215),vy:Math.sin(a)*(game.hard?260:215),r:6,c:'#cfd8dc',bounce:true,bounces:game.hard?4:3});
}
sfx.spit();
}
if(e.stT>=e.data.dur)mbEnd(e);
}else if(e.pat==='flower'){
e.data.ringT-=dt;
const maxR=game.hard?4:3;
if(e.data.ringT<=0&&e.data.rings<maxR){
e.data.rings++;e.data.ringT=.42;
const n=game.hard?14:12,off=e.data.rings*.26;
for(let i=0;i<n;i++){
const a=off+i/n*TAU;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*185,vy:Math.sin(a)*185,r:5,c:'#cfd8dc'});
}
sfx.spit();sfx.growl();
}
if(e.data.rings>=maxR&&e.data.ringT<=-.1)mbEnd(e);
}else if(e.pat==='snipe'){
e.data.t-=dt;
if(e.data.t<=0&&e.data.shots<(game.hard?5:3)){
e.data.shots++;e.data.t=game.hard?.12:.17;
const a=Math.atan2(pp.y-e.y,pp.x-e.x);
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(game.hard?500:440),vy:Math.sin(a)*(game.hard?500:440),r:5,c:'#e6f0f2'});
blip('sawtooth',200,90,.08,.07);
}
if(e.data.shots>=(game.hard?5:3)&&e.stT>=.9)mbEnd(e);
}else if(e.pat==='swarm'){
if(!e.data.fired){
e.data.fired=true;
const n=game.hard?12:8;
for(let i=0;i<n;i++){
const a=i/n*TAU;
ebullets.push({x:e.x+Math.cos(a)*30,y:e.y+Math.sin(a)*30,vx:Math.cos(a)*(game.hard?130:105),vy:Math.sin(a)*(game.hard?130:105),r:6,c:'#e6f0f2',home:game.hard?2:1.6,homeT:5});
}
sfx.howl();
}
if(e.stT>=1)mbEnd(e);
}
}
/* ============ o carrasco do limbo ============ */
const EX_PATS=['axe','spin','quake','mines','charge','summon'];
function exEnd(e){e.st='float';e.stT=0;e.atkT=(game.hard?1.1:1.8)+rnd(.5);}
function exActStart(e){
if(e.pat==='axe')e.data={volleys:0,t:.1};
else if(e.pat==='spin')e.data={t:0};
else if(e.pat==='quake')e.data={salvo:0,t:.1};
else if(e.pat==='mines'){
const n=game.hard?9:6;
for(let i=0;i<n;i++){
const a=rnd(TAU),dd=rnd(90,240);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,50);
ebullets.push({x:pt.x,y:pt.y,vx:0,vy:0,r:9,c:'#e8455a',mine:true,armT:.6,life:game.hard?7:5});
}
sfx.growl();
}
else if(e.pat==='charge'){e.dashT=.5;e.dashA=Math.atan2(player.y-e.y,player.x-e.x);sfx.dash();sfx.roar();game.shake=8;}
else if(e.pat==='summon'){
const n=game.hard?3:2;
for(let i=0;i<n;i++){
const a=rnd(TAU),dd=rnd(110,170);
const pt=roomPt(e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd,60);
spawnMarks.push({x:pt.x,y:pt.y,type:game.hard?(Math.random()<.5?'ru':'sp'):'sh',t:0,dur:.75});
}
sfx.roar();
}
}
function exActUpdate(e,dt){
const pp=player;
if(e.pat==='axe'){
e.data.t-=dt;
const maxV=game.hard?4:3;
if(e.data.t<=0&&e.data.volleys<maxV){
e.data.volleys++;e.data.t=game.hard?.42:.5;
const base=Math.atan2(pp.y-e.y,pp.x-e.x),n=game.hard?4:3;
for(let i=0;i<n;i++){
const a=base+(i-(n-1)/2)*.16;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(game.hard?280:235),vy:Math.sin(a)*(game.hard?280:235),r:9,c:'#e8455a'});
}
sfx.spit();game.shake=Math.max(game.shake,3);
}
if(e.data.volleys>=maxV&&e.stT>=1.2)exEnd(e);
}else if(e.pat==='spin'){
e.data.t-=dt;
if(e.data.t<=0){
e.data.t=game.hard?.1:.13;
const arms=game.hard?6:5,base=e.stT*2.6;
for(let b=0;b<arms;b++){
const a=base+b*TAU/arms;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(game.hard?235:195),vy:Math.sin(a)*(game.hard?235:195),r:6,c:'#cfd8dc'});
}
if(Math.random()<.4)sfx.spit();
}
if(e.stT>=(game.hard?2.4:2))exEnd(e);
}else if(e.pat==='quake'){
e.data.t-=dt;
const maxS=game.hard?4:3;
if(e.data.t<=0&&e.data.salvo<maxS){
e.data.salvo++;e.data.t=game.hard?.65:.8;
const n=game.hard?6:5;
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
e.x+=Math.cos(e.dashA)*(game.hard?880:740)*dt;
e.y+=Math.sin(e.dashA)*(game.hard?880:740)*dt;
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
if(e.atkT<=0){e.patIdx=(e.patIdx+1)%EX_PATS.length;e.pat=EX_PATS[e.patIdx];e.st='tele';e.stT=0;sfx.growl();}
}else if(e.st==='tele'){
if(e.stT>=(game.hard?.5:.65)){e.st=e.pat;e.stT=0;exActStart(e);}
}else exActUpdate(e,dt);
clampArena(e,e.r);
if(!player.dead&&d<e.r+player.r-4)hurtPlayer();
}
/* ============ A VIÚVA DO LIMBO ============ */
const VI_PATS=['webspray','summon','dash','ring','snare'];
function viEnd(e){e.st='float';e.stT=0;e.atkT=(game.hard?.9:1.4)+rnd(.4);}
function viuvaAI(e,dt,a,d,slowMul){
e.stT+=dt;
if(e.st==='float'){
if(d>340){e.x+=Math.cos(a)*e.sp*slowMul*dt;e.y+=Math.sin(a)*e.sp*slowMul*dt;}
else if(d<240){e.x-=Math.cos(a)*e.sp*slowMul*dt;e.y-=Math.sin(a)*e.sp*slowMul*dt;}
else{const pp=Math.sin(game.t+e.seed);e.x+=-Math.sin(a)*e.sp*.8*pp*dt;e.y+=Math.cos(a)*e.sp*.8*pp*dt;}
e.ang=lerpAngle(e.ang,a,1-Math.exp(-3*dt));
e.atkT-=dt;
if(e.atkT<=0){e.patIdx=(e.patIdx+1)%VI_PATS.length;e.pat=VI_PATS[e.patIdx];e.st='tele';e.stT=0;sfx.growl();}
}else if(e.st==='tele'){
if(e.stT>=.55){e.st=e.pat;e.stT=0;viStart(e);}
}else viUpdate(e,dt);
clampArena(e,e.r);
if(!player.dead&&d<e.r+player.r-4)hurtPlayer();
}
function viStart(e){
if(e.pat==='webspray')e.data={n:0,t:.15};
else if(e.pat==='summon')e.data={f:false};
else if(e.pat==='dash')e.data={dashes:0,waitT:.3};
else if(e.pat==='ring')e.data={f:false};
else if(e.pat==='snare')e.data={f:false};
}
function viUpdate(e,dt){
const pp=player,hard=game.hard;
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
rings.push({x:e.x,y:e.y,r:26,vr:hard?300:270,th:13,gapA:rnd(TAU),gapW:hard?.7:.9,c:'#9d6bb5',slow:true});
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
function gzEnd(e){e.st='float';e.stT=0;e.atkT=(game.hard?1.3:1.9)+rnd(.5);e.data={};}
function golemAI(e,dt,a,d,slowMul){
e.stT+=dt;
if(e.st==='float'){
if(d>380){e.x+=Math.cos(a)*e.sp*slowMul*dt;e.y+=Math.sin(a)*e.sp*slowMul*dt;}
else{const pp=Math.sin(game.t*.6+e.seed);e.x+=-Math.sin(a)*e.sp*.6*pp*dt;e.y+=Math.cos(a)*e.sp*.6*pp*dt;}
e.ang=lerpAngle(e.ang,a,1-Math.exp(-2*dt));
e.atkT-=dt;
if(e.atkT<=0){e.patIdx=(e.patIdx+1)%GZ_PATS.length;e.pat=GZ_PATS[e.patIdx];e.st='tele';e.stT=0;sfx.growl();}
}else if(e.st==='tele'){
if(e.stT>=.7){e.st=e.pat;e.stT=0;gzStart(e);}
}else gzUpdate(e,dt);
clampArena(e,e.r);
if(!player.dead&&d<e.r+player.r-4)hurtPlayer();
}
function gzStart(e){
const hard=game.hard,pp=player;
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
const hard=game.hard,pp=player;
if(e.pat==='beam'){
const b=e.data.beam;
b.t+=dt;
if(b.t>=b.warm)b.ang+=dt*(hard?1.25:1.05);
const L=rayLen(e.x,e.y,b.ang);
const ex2=e.x+Math.cos(b.ang)*L,ey2=e.y+Math.sin(b.ang)*L;
if(b.t>=b.warm){
if(Math.random()<.8)particles.push({x:e.x+Math.cos(b.ang)*rnd(30,L),y:e.y+Math.sin(b.ang)*rnd(30,L),vx:rnd(-14,14),vy:rnd(-14,14),life:.25,t:0,r:2,c:'#ff8f3d',glow:true});
if(!player.dead&&segDist(player.x,player.y,e.x,e.y,ex2,ey2)<12+player.r)hurtPlayer();
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
rings.push({x:e.x,y:e.y,r:e.r,vr:hard?420:370,th:15,gapA:rnd(TAU),gapW:1.6,c:'#ff8f3d'});
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
if(e.type==='rk'&&!player.dead&&d<e.r+player.r-4)hurtPlayer();
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
if(!fake&&!player.dead&&segDist(player.x,player.y,e.x,e.y,ex2,ey2)<13+player.r)hurtPlayer();
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
rings.push({x:e.x,y:e.y,r:20,vr:hard?380:330,th:12,gapA:rnd(TAU),gapW:1.4,c:BC,fake:fake});
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
rings.push({x:e.x,y:e.y,r:26,vr:hard?360:320,th:13,gapA:rnd(TAU),gapW:hard?.7:.9,c:BC,fake:fake});
rings.push({x:e.x,y:e.y,r:26,vr:hard?300:270,th:12,gapA:rnd(TAU)+1,gapW:hard?.7:.9,c:BC2,fake:fake});
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
{t0:9.0,t1:12.4,txt:'como me encontrou? como atravessou o limbo sozinho?'},
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
if(!player.dead&&d<e.r+player.r-6)hurtPlayer();
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
rings.push({x:e.x,y:e.y,r:30,vr:hard?420:380,th:14,gapA:e.data.gap,gapW:hard?.65:.85,c:'#ff4fd8'});
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
if(!player.dead&&d<e.r+player.r-4)hurtPlayer();
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
const n=hard?10:7;
for(let i=0;i<n;i++){
const a=e.data.dashA+(i-(n-1)/2)*.16;
ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*280,vy:Math.sin(a)*280,r:6,c:acc});
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
rings.push({x:e.x,y:e.y,r:24,vr:hard?340:280,th:14,gapA:rnd(TAU),gapW:1.4,c:acc});
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
rings.push({x:e.x,y:e.y,r:24,vr:hard?380:320,th:14,gapA:rnd(TAU),gapW:1.6,c:col});
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
rings.push({x:e.x,y:e.y,r:24,vr:hard?340:280,th:14,gapA:rnd(TAU),gapW:1.1,c:acc,slow:true});
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
rings.push({x:e.x,y:e.y,r:24,vr:hard?380:320,th:14,gapA:rnd(TAU),gapW:1.4,c:col});
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
rings.push({x:e.x,y:e.y,r:30,vr:hard?380:320,th:14,gapA:rnd(TAU),gapW:1.4,c:'#d9465a'});
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
{id:'knight_death',name:'FOICE DO FIM',desc:'+100% dano · -1 coração máximo · a cada 8s, um golpe de perto executa inimigos com <30% HP',chk:m=>m.knights&&m.knights.death>=1,apply(){P.dmgMult*=2;player.maxHp=Math.max(2,player.maxHp-1);if(player.hp>player.maxHp)player.hp=player.maxHp;game.knightDeath=true;game.knightDeathT=0;}},
{id:'apocalypse',name:'SELO DO APOCALIPSE',desc:'+50% de tudo (dano, velocidade, taxa de tiro, magnetismo) · -1 coração máximo · você superou os 4 Cavaleiros',chk:m=>m.knights&&m.knights.conquest>=1&&m.knights.war>=1&&m.knights.famine>=1&&m.knights.death>=1,apply(){P.dmgMult*=1.5;P.speedMult*=1.5;P.rateMult*=1.5;P.magnetMult*=1.5;player.maxHp=Math.max(2,player.maxHp-1);if(player.hp>player.maxHp)player.hp=player.maxHp;game.apocalypse=true;}}
];
/* ============ puzzle, janela e cena da janela ============ */
function updatePuzzle(dt){
 const pz=game.puzzle;
 if(!pz||pz.solved||player.dead)return;
 if(pz.failT>0){pz.failT-=dt;return;}
 if(pz.type==='braziers')updateBraziers(dt);
 else if(pz.type==='echoes')updateEchoes(dt);
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
 else drawPzPlates(pz);
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
 for(const d of game.decor){
  const dr=decorRadius(d);
  if(!dr)continue;
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
const vmul=game.hard?1.22:1;
for(let i=ebullets.length-1;i>=0;i--){
const b=ebullets[i];
/* tiro mortal do Triunfo da Morte */
if(b.hitkill&&!b.fake&&!player.dead&&dist(b.x,b.y,player.x,player.y)<b.r+player.r){
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
if(b.armT<=0&&!b.fake&&!player.dead&&dist(b.x,b.y,player.x,player.y)<b.r+34+player.r){
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
if(!b.fake&&!player.dead&&dist(b.x,b.y,player.x,player.y)<b.r+player.r-2){
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
if(!b.fake&&!player.dead&&dist(b.x,b.y,player.x,player.y)<b.r+player.r-2){
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
b.x+=b.vx*vmul*dt;b.y+=b.vy*vmul*dt;
if(b.x<ROOM.x-44||b.x>ROOM.x+ROOM.w+44||b.y<ROOM.y-44||b.y>ROOM.y+ROOM.h+44){ebullets.splice(i,1);continue;}
if(!b.fake&&!player.dead&&dist(b.x,b.y,player.x,player.y)<b.r+player.r-2){
hurtPlayer();
if(b.c==='#9fd8ff'||b.slowShot)player.slowT=Math.max(player.slowT,.8);
sparks(b.x,b.y,b.c,5,160,.4,3,true);
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
if(!m.friendly&&!m.fake&&!player.dead&&dist(player.x,player.y,m.x,m.y)<42+player.r)hurtPlayer();
}else if(m.phase==='burst'&&m.t>.28)geyserMarks.splice(i,1);
}
}
function updateSpawnMarks(dt){
for(let i=spawnMarks.length-1;i>=0;i--){
const s=spawnMarks[i];
s.t+=dt*(game.hard?1.25:1);
if(s.t>=s.dur){
/* marcas falsas (sombras) só geram o efeito visual, sem inimigo real */
if(!s.fake)spawnEnemy(s.type,s.x,s.y);
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
if(relicUnlocked('shard'))n*=1.15;
n*=(P.soulMult||1);
game.soulAcc+=n;
const whole=Math.floor(game.soulAcc);
if(whole>0){game.souls+=whole;game.soulAcc-=whole;}
}
function updatePickups(dt){
const magnet=130*P.magnetMult;
for(let i=pickups.length-1;i>=0;i--){
const p=pickups[i];p.t+=dt;
if(p.t>11&&p.type!=='chest'&&p.type!=='kingsoul'){pickups.splice(i,1);continue;}
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
player.hp++;sfx.heart();
texts.push({x:player.x,y:player.y-30,txt:'+VIDA',t:0,life:1,c:'#d9465a',size:16,disp:true});
}else{
gainSouls(3);sfx.soul();
texts.push({x:player.x,y:player.y-30,txt:'+3 ALMAS',t:0,life:1,c:'#bfd8e8',size:14});
}
pickups.splice(i,1);continue;
}
}else if(p.type==='chest'&&!player.dead){
if(dist(p.x,p.y,player.x,player.y)<34){
pickups.splice(i,1);
const rr=game.mapRooms[game.roomIdx];
if(rr)rr.chestTaken=true;
sparks(p.x,p.y,'#ffd9a0',18,240,.7,3,true);
sparks(p.x,p.y,'#c9a44c',10,180,.6,3,true);
game.flash=Math.max(game.flash,.2);
openTreasure();
continue;
}
}else if(p.type==='kingsoul'&&!player.dead){
if(dist(p.x,p.y,player.x,player.y)<36){
pickups.splice(i,1);
player.maxHp++;player.hp=player.maxHp;
P.dmgMult*=1.25;
game.kingsoul=true;game.kingT=3;
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
}
}
}
/* ============ bênçãos ============ */
const QUAL_C=['#6e6357','#8a7d6c','#7fa8b8','#c9a44c','#d9465a','#ffd9a0'];
const QUAL_W=[100,55,24,9,3,1];
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
{id:'forca',q:1,glyph:'bolt',name:'FORÇA DE ODIN',max:99,desc:'todos os ataques batem com 15% mais força.',can:function(){return true;},apply:function(){P.dmgMult*=1.15;}},
{id:'sanguepesado',q:1,glyph:'blood',name:'SANGUE PESADO',max:3,desc:'+25% de dano — thor anda 8% mais lento.',can:function(){return(game.up.sanguepesado||0)<3;},apply:function(){P.dmgMult*=1.25;P.speedMult*=.92;}},
{id:'polvora',q:2,glyph:'shot',name:'PÓLVORA LEVE',max:2,desc:'tudo ataca 30% mais rápido — o dano cai 12%.',can:function(){return(game.up.polvora||0)<2;},apply:function(){P.rateMult*=1.3;P.dmgMult*=.88;}},
{id:'pactovao',q:2,glyph:'soulg',name:'PACTO DO VÃO',max:2,desc:'almas valem 40% mais — o dano cai 10%.',can:function(){return(game.up.pactovao||0)<2;},apply:function(){P.soulMult*=1.4;P.dmgMult*=.9;}},
{id:'furia',q:2,glyph:'sky',name:'FÚRIA DO TROVÃO',max:5,desc:'tudo ataca 18% mais rápido.',can:function(){return(game.up.furia||0)<5;},apply:function(){P.rateMult*=1.18;}},
{id:'mercurio',q:2,glyph:'wind',name:'PÉS DE MERCÚRIO',max:2,desc:'o desvio recarrega 25% mais rápido.',can:function(){return(game.up.mercurio||0)<2;},apply:function(){P.dashCdMult*=.75;}},
{id:'alcance',q:2,glyph:'reach',name:'BRAÇO DO TITÃ',max:3,desc:'golpes alcançam mais longe.',can:function(){return(game.up.alcance||0)<3;},apply:function(){P.reachMult*=1.3;}},
{id:'gemeas',q:2,glyph:'twin',name:'LÂMINAS GÊMEAS',max:3,desc:'cada disparo solta um projétil extra.',can:function(){return game.hasShot&&(game.up.gemeas||0)<3;},apply:function(){game.multi++;}},
{id:'sangue',q:2,glyph:'blood',name:'SANGUE FERVENTE',max:3,desc:'a mordida morde 25% mais fundo.',can:function(){return game.hasBite&&(game.up.sangue||0)<3;},apply:function(){P.biteMult*=1.25;}},
{id:'mandibula',q:2,glyph:'maw',name:'MANDÍBULA DO ABISMO',max:2,desc:'mais alcance e bote mais largo na mordida.',can:function(){return game.hasBite&&(game.up.mandibula||0)<2;},apply:function(){P.biteRange*=1.25;}},
{id:'gelo',q:3,glyph:'shard',name:'GELO DE NIFLHEIM',max:3,desc:'tiros de gelo congelam. 3 níveis: maestria (+40% em congelados).',can:function(){return game.hasShot&&game.elements.gelo<3;},apply:function(){elemLevelUp('gelo','DE GELO',function(){game.ymir=true;});}},
{id:'fogo',q:3,glyph:'flame',name:'FOGO DE MUSPELHEIM',max:3,desc:'tiros flamejantes incendeiam. 3 níveis: o fogo salta.',can:function(){return game.hasShot&&game.elements.fogo<3;},apply:function(){elemLevelUp('fogo','DE FOGO',function(){game.incendio=true;});}},
{id:'veneno',q:3,glyph:'venom',name:'VENENO DE JÖRMUNGANDR',max:3,desc:'tiros envenenados corroem. 3 níveis: a toxina se espalha.',can:function(){return game.hasShot&&game.elements.veneno<3;},apply:function(){elemLevelUp('veneno','DO VENENO',function(){game.miasma=true;});}},
{id:'raio',q:3,glyph:'sky',name:'IRA DO CÉU',max:3,desc:'relâmpagos caem sozinhos sobre os demônios.',can:function(){return(game.up.raio||0)<3;},apply:function(){P.lightning++;}},
{id:'fome',q:3,glyph:'fangs',name:'FOME DA FERA',max:1,desc:'a cada 10 demônios devorados, um coração retorna.',can:function(){return game.hasBite&&!game.fome;},apply:function(){game.fome=true;game.fomeK=0;}},
{id:'unlockShot',q:3,glyph:'shot',name:'TROVÃO À DISTÂNCIA',max:1,desc:'também dispara projéteis automáticos.',can:function(){return!game.hasShot;},apply:function(){game.hasShot=true;player.shotT=.3;}},
{id:'unlockBite',q:3,glyph:'fangs',name:'MORDIDA DA FERA',max:1,desc:'a fera desperta: mandíbulas despedaçam de perto.',can:function(){return!game.hasBite;},apply:function(){game.hasBite=true;player.biteT=.3;}},
{id:'nova',q:3,glyph:'nova',name:'NOVA DE NIFLHEIM',max:4,desc:'explosões gélidas irrompem de thor.',can:function(){return(game.up.nova||0)<4;},apply:function(){P.nova++;game.novaT=1.5;}},
{id:'presafogo',q:3,glyph:'flame',name:'PRESAS EM BRASA',max:1,desc:'SINERGIA — a mordida incendeia a vítima por dentro.',can:function(){return game.hasBite&&!game.biteFire;},apply:function(){game.biteFire=true;}},
{id:'presagelo',q:3,glyph:'shard',name:'PRESAS DE GELO',max:1,desc:'SINERGIA — a mordida congela quem for mordido.',can:function(){return game.hasBite&&!game.biteFrost;},apply:function(){game.biteFrost=true;}},
{id:'presaveneno',q:3,glyph:'venom',name:'PRESAS PEÇONHENTAS',max:1,desc:'SINERGIA — a mordida injeta veneno corrosivo.',can:function(){return game.hasBite&&!game.biteVeneno;},apply:function(){game.biteVenom=true;}},
{id:'presasismo',q:4,glyph:'burst',name:'MANDÍBULA SÍSMICA',max:1,desc:'SINERGIA — cada mordida detona em área.',can:function(){return game.hasBite&&!game.biteQuake;},apply:function(){game.biteQuake=true;}},
{id:'mjolnir',q:4,glyph:'hammer',name:'MJÖLNIR',max:3,desc:'o martelo orbita thor e caça sozinho.',can:function(){return(game.up.mjolnir||0)<3;},apply:function(){addHammer();}},
{id:'trovao',q:4,glyph:'bolt',name:'TROVÃO LONGÍNQUO',max:3,desc:'tiros viram trovão: +40% e o raio salta. 3 níveis: salta 2x.',can:function(){return game.hasShot&&game.elements.trovao<3;},apply:function(){elemLevelUp('trovao','DO TROVÃO',function(){game.chain2=true;});}},
{id:'gross',q:4,glyph:'blood',name:'SANGUE GROSSO',max:2,desc:'invencibilidade após golpe dura +0,5s.',can:function(){return(game.up.gross||0)<2;},apply:function(){P.invBonus+=.5;}},
{id:'motoserra',q:4,glyph:'saw',name:'MOTOSERRA',max:3,desc:'O som que todos demonios temem. Clique para lançá-la.',can:function(){return(game.up.motoserra||0)<3;},apply:function(){P.chainsaw++;}},
{id:'gram',q:4,glyph:'sword',name:'GRIMM, LÂMINA DRAGÃO',max:3,desc:'a espada corta num arco largo.',can:function(){return(game.up.gram||0)<3;},apply:function(){P.sword++;}},
{id:'estacas',q:4,glyph:'stake',name:'ESTACAS DE NIFLHEIM',max:4,desc:'estacas gélidas caem do céu.',can:function(){return(game.up.estacas||0)<4;},apply:function(){P.stakes++;}},
{id:'explosao',q:4,glyph:'burst',name:'EXPLOSÃO DE MUSPELHEIM',max:3,desc:'explosões telegrafadas incendeiam em área.',can:function(){return(game.up.explosao||0)<3;},apply:function(){P.burst++;game.burstT=1.5;}},
{id:'sismica',q:4,glyph:'burst',name:'BALAS SÍSMICAS',max:2,desc:'cada tiro detona ao acertar.',can:function(){return game.hasShot&&(game.up.sismica||0)<2;},apply:function(){P.explShot++;}},
{id:'trevas',q:4,glyph:'dark',name:'TREVAS DE HEL',max:3,desc:'crânios de éter orbitam thor e mordem.',can:function(){return(game.up.trevas||0)<3;},apply:function(){P.dark++;}},
{id:'luz',q:4,glyph:'light',name:'LUZ DE VALHALLA',max:3,desc:'feixe rotativo varre a sala ao redor de thor.',can:function(){return(game.up.luz||0)<3;},apply:function(){P.light++;game.lightMagT=2;}},
{id:'guarda',q:4,glyph:'shield',name:'GUARDA DE DEUS',max:1,desc:'parry: golpes de perto (mordida, serra, lâmina) rebatem os tiros que acertarem.',can:function(){return!game.hasParry;},apply:function(){game.hasParry=true;}},
{id:'onda',q:5,glyph:'wave',name:'ONDA DO ABISMO',max:3,desc:'ondas de choque queimam e desfazem feitiços.',can:function(){return(game.up.onda||0)<3;},apply:function(){P.shock++;game.shockT=1.2;}},
{id:'berserk',q:5,glyph:'fangs',name:'BERSERKER',max:1,desc:'com 1 coração, a mordida morde 75% mais fundo.',can:function(){return game.hasBite&&!game.berserk;},apply:function(){game.berserk=true;}},
{id:'storm',q:5,glyph:'sky',name:'TEMPESTADE ETERNA',max:1,desc:'a ira do céu cai 2x mais rápido.',can:function(){return P.lightning>0&&!game.storm;},apply:function(){game.storm=true;}},
{id:'sede',q:5,glyph:'fangs',name:'SEDE DE SANGUE',max:2,desc:'tudo ataca 22% mais rápido.',can:function(){return(game.up.sede||0)<2;},apply:function(){P.rateMult*=1.22;}},
{id:'pesadelo',q:5,glyph:'dark',name:'PESADELO CEGO',max:1,desc:'+45% de dano — o desvio recarrega 25% mais devagar.',can:function(){return!game.pesadelo;},apply:function(){game.pesadelo=true;P.dmgMult*=1.45;P.dashCdMult*=1.25;}},
{id:'iraodin',q:6,glyph:'crown',name:'IRA DE ODIN',max:1,desc:'todo o seu dano dobra.',can:function(){return!game.iraodin;},apply:function(){game.iraodin=true;P.dmgMult*=2;}},
{id:'heimdall',q:6,glyph:'eye',name:'OLHO DE HEIMDALL',max:1,desc:'os golpes de perto rebatem os tiros num raio muito maior.',can:function(){return game.hasParry&&!game.heimdall;},apply:function(){game.heimdall=true;P.parryRadius=260;}},
{id:'olho',q:6,glyph:'eye',name:'OLHO DO CAÇADOR',max:1,desc:'RARO — seu tiro dispara sozinho no demônio mais próximo.',can:function(){return game.hasShot&&!game.autoFire;},apply:function(){game.autoFire=true;player.shotT=.4;sfx.levelup();}}];
/* ============ poderes únicos: 3 bênçãos do mesmo tipo ============
   Ao empilhar 3 níveis de um mesmo elemento/arma, thor desperta um dom único
   com nome próprio — anunciado em banners. Ex.: 3x gelo = CÃO DO INVERNO. */
const SYNERGIES={
gelo:{name:'CÃO DO INVERNO',sub:'os congelados explodem em estilhaços ao morrer',apply:function(){game.synInverno=true;}},
fogo:{name:'CÃO DE MUSPELHEIM',sub:'os queimados detonam em fogo ao morrer',apply:function(){game.synMuspel=true;}},
veneno:{name:'CÃO DA SERPENTE',sub:'a toxina se espalha para os vivos ao redor',apply:function(){game.synSerpente=true;}},
trovao:{name:'FILHO DO TROVÃO',sub:'cada tiro pode chamar um relâmpago do céu',apply:function(){game.synTrovao=true;}},
explosao:{name:'CÃO VULCÃO',sub:'as explosões ficam 35% maiores e mais cruéis',apply:function(){game.synVulcao=true;}},
raio:{name:'TEMPESTADE VIVA',sub:'a ira do céu cai sem parar sobre os demônios',apply:function(){game.storm=true;}},
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
function rollUpgrades(){
const pool=UPGRADES.filter(function(u){return u.can();});
const out=[];
/* apenas 1 ou 2 escolhas por bênção — cada escolha pesa mais */
const nCho=Math.random()<.4?1:2;
while(out.length<nCho&&pool.length){
let tot=0;
const ws=pool.map(function(u){const w=QUAL_W[u.q-1];tot+=w;return w;});
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
const box=ov('cards');
if(!box){game.state='play';game.treasureOpen=false;return;}
box.innerHTML='';
const eb=ov('blessEyebrow');
if(eb)eb.textContent=fromTreasure?'TESOURO':'BÊNÇÃO';
const opts2=rollUpgrades();
for(let i=0;i<opts2.length;i++){
const u=opts2[i];
const col=QUAL_C[u.q-1];
const el=document.createElement('button');
el.className='card'+(u.q===6?' q6':'');
el.style.borderColor=col;
el.style.background='linear-gradient('+hexA(col,.09)+','+hexA(col,.02)+'), rgba(13,9,11,.94)';
const st=(game.up[u.id]||0);
el.innerHTML=GLYPHS[u.glyph]+'<h3>'+u.name+'</h3><p>'+u.desc+'</p><div class="lvl" style="color:'+col+'">QUALIDADE '+roman(u.q)+(st>0?' · GRAU '+roman(st+1):'')+'</div>';
el.addEventListener('click',function(){chooseUpgrade(u);});
el.addEventListener('mouseenter',function(){blip('sine',500,650,.05,.03);});
box.appendChild(el);
}
showOv('levelup');
}
function openTreasure(){
game.treasureOpen=true;
game.state='levelup';
game.parryCharge=0;game.parryLock=false;
buildUpgradeCards(true);
sfx.levelup();
}
function chooseUpgrade(u){
u.apply();
game.up[u.id]=(game.up[u.id]||0)+1;
checkTypeSynergy(u.id);
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
function renderBook(){
const body=ov('bookBody');
if(!body)return;
let h='';
h+='<div class="bkSec">— BÊNÇÃOS DESTA DESCIDA —</div>';
const got=UPGRADES.filter(u=>(game.up[u.id]||0)>0);
h+=got.length?got.map(u=>'<div class="bkRow"><div><b>'+u.name+'</b><em>'+u.desc+'</em></div><span>×'+game.up[u.id]+'</span></div>').join(''):'<div class="bkEmpty">nenhuma bênção ainda. as almas aguardam.</div>';
h+='<div class="bkSec">— PODERES ÚNICOS —</div>';
const syns=Object.keys(SYNERGIES).filter(k=>(game.up[k]||0)>=3);
h+=syns.length?syns.map(k=>'<div class="bkRow"><div><b>'+SYNERGIES[k].name+'</b><em>'+SYNERGIES[k].sub+'</em></div><span>★</span></div>').join(''):'<div class="bkEmpty">três bênçãos do mesmo tipo despertam um poder único.</div>';
h+='<div class="bkSec">— BESTIÁRIO —</div>';
const seen=Object.keys(META.seen);
h+=seen.length?seen.map(k=>{const b=BESTIARY[k]||['???',''];return '<div class="bkRow"><div><b>'+b[0]+'</b><em>'+b[1]+'</em></div></div>';}).join(''):'<div class="bkEmpty">as páginas em branco esperam os demônios.</div>';
body.innerHTML=h;
}
function toggleBook(){
if(game.state==='book'){hideOv('book');game.state='play';blurActive();return;}
if(game.state!=='play')return;
renderBook();
showOv('book');
game.state='book';
blurActive();
}
/* ============ sala de testes (PENUMBRA) ============ */
const LAB_ITEMS=[
{id:'mb',n:'O BRUXO'},{id:'ex',n:'O CARRASCO'},{id:'vi',n:'A VIÚVA'},{id:'gz',n:'O GOLEM'},
{id:'rk',n:'O VELHO REI'},{id:'e404',n:'ERRO 404'},{id:'boss',n:'O CÉRBERO'},{id:'puzzle',n:'PUZZLE NOVO'},
{id:'cw1',n:'CAVAL. BRANCO'},{id:'cw2',n:'CAVAL. VERMELHO'},{id:'cw3',n:'CAVAL. PRETO'},{id:'cw4',n:'CAVAL. DESCORADO'}];
function buildLabCards(){
const box=ov('labCards');
if(!box)return;
box.innerHTML='';
for(const it of LAB_ITEMS){
const el=document.createElement('button');
el.className='card';
el.innerHTML='<h3>'+it.n+'</h3><p>invoque na sala atual</p>';
el.addEventListener('click',function(){devSpawnBoss(it.id);});
el.addEventListener('mouseenter',function(){blip('sine',500,650,.05,.03);});
box.appendChild(el);
}
}
function devSpawnBoss(id){
hideOv('lab');blurActive();
game.state='play';
if(id==='boss'){devGoBoss();return;}
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
const ROOM_KIND_NAMES={start:'INICIAL',combat:'COMBATE',empty:'VAZIA',treasure:'TESOURO',shop:'LOJA',secret:'SECRETA',challenge:'DESAFIO',miniboss:'MINI-CHEFE',puzzle:'PUZZLE',boss:'CHEFE',sboss:'CHEFE SECRETO'};
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
const BUILDER_BOSSES=[['mb','O BRUXO'],['ex','O CARRASCO'],['vi','A VIÚVA'],['gz','O GOLEM'],['rk','O VELHO REI'],['e404','ERRO 404']];
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
const bossy=['mb','ex','vi','gz','rk','e404','cw1','cw2','cw3','cw4'].indexOf(it.t)>=0;
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
for(const a of ambient){a.y+=a.vy*dt;if(a.y<-12){a.y=H+12;a.x=rnd(W);}}
metaTick();
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
/* O Bruxo do Limbo (mb) */
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
if(alive===0)winStart();
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
rings.push({x:boss.x,y:boss.y,r:boss.r*.8,vr:rage?460:400,th:15,gapA:rnd(TAU),gapW:1.3,c:'#e8455a'});
if(game.hard)rings.push({x:boss.x,y:boss.y,r:boss.r*.5,vr:340,th:13,gapA:rnd(TAU),gapW:1.1,c:'#e8455a'});
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
rings.push({x:boss.x,y:boss.y,r:boss.r*.7,vr:330,th:14,gapA:rnd(TAU),gapW:1.25,c:'#ff8f3d'});
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
rings.push({x:boss.x,y:boss.y,r:boss.r*.7,vr:310,th:14,gapA:h.data.gap,gapW:.9,c:'#a8c24f'});
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
rings.push({x:h.hx,y:h.hy,r:24,vr:game.hard?400:340,th:13,gapA:rnd(TAU),gapW:1.1,c:'#ff8f3d'});
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
if(!player.dead&&segDist(player.x,player.y,h.hx,h.hy,ex2,ey2)<10+player.r)hurtPlayer();
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
rings.push({x:boss.x,y:boss.y,r:boss.r*.7,vr:380,th:14,gapA:rnd(TAU),gapW:1.1,c:'#ff8f3d'});
rings.push({x:boss.x,y:boss.y,r:boss.r*.5,vr:300,th:12,gapA:rnd(TAU),gapW:1.1,c:'#e8455a'});
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
if(!player.dead&&dist(boss.x,boss.y,player.x,player.y)<boss.r*.82+player.r)hurtPlayer();
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
const END_LINES=[
'você... não tem noção do que está fazendo, cachorrinho...',
'cada círculo que você atravessa... o mundo lá em cima apodrece um pouco mais.',
'o mundo pagará pelas suas escolhas... e eu estarei esperando... do outro lado.'];
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
if(game.endT>=3.4){game.endPhase='gate';game.endT=0;game.gateCreak=0;sfx.rumble();}
}else if(ph==='gate'){
updatePlayer(dt);
if(game.endT>.7&&game.endT<1.6)game.shake=Math.max(game.shake,1.2);
if(!game.gateCreak&&game.endT>=.65){game.gateCreak=1;sfx.creak();}
if(game.endT>.65&&Math.random()<.45)particles.push({x:GATE.x+rnd(-60,60),y:GATE.y+108,vx:rnd(-12,12),vy:rnd(-80,-30),life:rnd(.4,.9),t:0,r:rnd(1.5,3),c:'#ff8f3d',drag:1,glow:true});
if(game.endT>=2&&dist(player.x,player.y,GATE.x,GATE.y+30)<52){
game.endPhase='enter';game.endT=0;
game.enterFrom={x:player.x,y:player.y};
sfx.howl();
}
}else if(ph==='enter'){
const k=smooth(Math.min(1,game.endT/.85));
player.x=lerp(game.enterFrom.x,GATE.x,k);
player.y=lerp(game.enterFrom.y,GATE.y+34,k);
game.playerAlpha=1-k;
if(Math.random()<.5)particles.push({x:player.x+rnd(-8,8),y:player.y+rnd(-8,8),vx:rnd(-20,20),vy:rnd(-60,-20),life:.5,t:0,r:rnd(1,2.5),c:'#9d6bb5',drag:1,glow:true});
if(game.endT>=.9){game.endPhase='closing';game.endT=0;sfx.gate();}
}else if(ph==='closing'){
game.shake=Math.max(game.shake,2);
if(game.endT>=1.1){game.endPhase='closed';game.endT=0;sfx.echo();}
}else if(ph==='closed'){
if(game.endT>=3.6){
game.state='won';
META.wins++;saveMeta();
setStat('stKillW',game.kills);
setStat('stEmbW',game.souls);
setStat('stHpW',player.hp);
showOv('win');
sfx.win();
}
}
}
function takeDarkSoul(){
game.endPhase='bless';game.endT=0;game.darkSoul=null;
player.maxHp=5;player.hp=5;
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
/* ============ lógica da sala atual ============ */
function roomLogic(dt){
if(game.roomKind==='boss')return;
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
game.spawnT=clamp((game.hard?.85:1.15)-game.threat*.06,game.hard?.25:.38,game.hard?1.5:2);
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
if(hearts>0&&player.hp<player.maxHp){player.hp=Math.min(player.maxHp,player.hp+hearts);sfx.heart();}
pickups=pickups.filter(function(p){return p.type==='chest'||p.type==='kingsoul'||p.type==='knightrelic';});
if(souls>0)gainSouls(souls);
}
function roomCleared(){
const r=game.mapRooms[game.roomIdx];
if(r.cleared)return;
r.cleared=true;
game.waveState='done';
collectRoomPickups();
openDoors();
if(r.kind==='miniboss'&&game.floor<5){
r.hasPortal=true;
game.portal={x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0};
game.banner={type:'boss',txt:'O CHEFE DO MAPA CAIU',sub:'o portal para a descida '+roman(game.floor+1)+' se abriu',t:0,dur:2.8};
sfx.rumble();sfx.echo();sfx.growl();
game.shake=12;game.flash=.3;
}else if(r.kind==='challenge'){
if(Math.random()<.38){r.chestDropped=true;
pickups.push({type:'chest',x:game.absMain.x+game.absMain.w/2,y:game.absMain.y+game.absMain.h*.42,t:0,ph:rnd(TAU)});}
game.banner={type:'small',txt:'DESAFIO CONCLUÍDO',sub:r.chestDropped?'um baú foi liberado':'nenhum baú desta vez',t:0,dur:2.2};
}else if(r.kind==='sboss'){
game.banner={type:'small',txt:'A SALA SECRETA SILENCIA',sub:'o eco do chefe secreto se dissolve',t:0,dur:2.2};
}else{
game.banner={type:'small',txt:'SALA LIMPA',sub:'as portas se abriram',t:0,dur:1.6};
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
function shopPrice(p){return Math.round(p*(relicUnlocked('haggler')?.75:1));}
function buildShop(){
game.shopItems=[];
const cx=game.absMain.x+game.absMain.w/2,cy=game.absMain.y+game.absMain.h*.5;
game.keeper={x:cx,y:cy,ph:rnd(TAU)};
game.shopItems.push({name:'CORAÇÃO',desc:'recupera 1 coração — se estiver cheio, ganha um permanente',price:shopPrice(15),kind:'heart',bought:false});
const pool=UPGRADES.filter(u=>u.can()&&u.q<=3&&!u.id.startsWith('unlock'));
if(pool.length){const u=pick(pool);game.shopItems.push({name:u.name,desc:u.desc,price:shopPrice(30),kind:'upg',up:u,bought:false});}
const pool2=UPGRADES.filter(u=>u.can()&&u.q>=4&&u.id!=='olho');
if(pool2.length){const u=pick(pool2);game.shopItems.push({name:u.name,desc:u.desc,price:shopPrice(48),kind:'upg',up:u,bought:false});}
if(!game.hasShot){const u=UPGRADES.find(x=>x.id==='unlockShot');if(u)game.shopItems.push({name:'ARMA: TROVÃO À DISTÂNCIA',desc:'desbloqueia o tiro — projéteis que caçam à distância',price:shopPrice(65),kind:'upg',up:u,bought:false});}
if(!game.hasBite){const u=UPGRADES.find(x=>x.id==='unlockBite');if(u)game.shopItems.push({name:'ARMA: MORDIDA DA FERA',desc:'desbloqueia a mordida — mandíbulas que despedaçam de perto',price:shopPrice(65),kind:'upg',up:u,bought:false});}
}
function updateShop(dt){
if(!game.keeper)return;
game.keeperNear=dist(player.x,player.y,game.keeper.x,game.keeper.y)<86;
}
function shopBuy(s){
if(s.bought)return;
if(game.souls<s.price){
blip('sawtooth',180,90,.18,.08);
texts.push({x:player.x,y:player.y-40,txt:'FALTAM '+(s.price-game.souls)+' ALMAS',t:0,life:.8,c:'#d9465a',size:12,disp:true});
return;
}
game.souls-=s.price;s.bought=true;
if(s.kind==='heart'){
if(player.hp<player.maxHp)player.hp++;
else player.maxHp++;
sfx.heart();
}else{
s.up.apply();game.up[s.up.id]=(game.up[s.up.id]||0)+1;
checkTypeSynergy(s.up.id);
sfx.levelup();
}
sparks(player.x,player.y,'#ffd9a0',16,220,.6,3,true);
texts.push({x:player.x,y:player.y-30,txt:'COMPRADO',t:0,life:.9,c:'#ffd9a0',size:14,disp:true});
game.shake=Math.max(game.shake,4);
buildShopCards();
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
el.innerHTML='<h3>'+(s.kind==='heart'?'♥ ':'' )+s.name+'</h3><p>'+s.desc+'</p><div class="lvl" style="color:'+(s.bought?'#6e6357':afford?'#ffd9a0':'#d9465a')+'">'+(s.bought?'VENDIDO':s.price+' ALMAS')+'</div>';
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
{id:'heart',glyph:'blood',name:'+1 CORAÇÃO PERMANENTE',desc:'aumenta a vida máxima (e cura) em 1.',apply:function(){player.maxHp++;player.hp=player.maxHp;}},
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
el.innerHTML=GLYPHS[w.glyph]+'<span class="tag">ARMA</span><h3>'+w.name+'</h3><p>'+w.desc+'</p><div class="lvl" style="color:'+col+'">CLIQUE PARA OBTER</div>';
el.addEventListener('click',function(){audio();w.apply();sfx.levelup();sparks(player.x,player.y,'#ffd9a0',14,220,.6,3,true);buildCheatCards();});
el.addEventListener('mouseenter',function(){blip('sine',500,650,.05,.03);});
box.appendChild(el);
}
/* todas as bênçãos do UPGRADES */
for(const u of UPGRADES){
const el=document.createElement('button');
el.className='card';
const st=(game.up[u.id]||0);
const locked=!u.can();
const col=QUAL_C[u.q-1];
if(st>0)el.classList.add('taken');
if(locked)el.classList.add('locked');
el.style.borderColor=st>0?'#3a8a4f':col;
el.style.background='linear-gradient('+hexA(st>0?'#3a8a4f':col,.09)+','+hexA(st>0?'#3a8a4f':col,.02)+'), rgba(13,9,11,.94)';
const tag=u.q>=5?'RARO':u.q>=4?'ÉPICO':u.q===3?'SINERGIA':u.q===2?'ARMA':'BÁSICO';
el.innerHTML=GLYPHS[u.glyph]+'<span class="tag">'+tag+'</span><h3>'+u.name+'</h3><p>'+u.desc+'</p><div class="lvl" style="color:'+(st>0?'#3a8a4f':col)+'">'+(st>0?'OBTIDA · GRAU '+roman(st+1):locked?'INDISPONÍVEL':'QUALIDADE '+roman(u.q))+'</div>';
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
buildCheatCards();
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
'O LIMBO NÃO QUIS A SUA ALMA.',
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
const dtt=ov('deadTaunt');
if(dtt)dtt.textContent='"'+(game.deadTaunt||DEATH_TAUNTS[0])+'"';
const dr=ov('deadRelics');
if(dr)dr.innerHTML=metaListText();
showOv('dead');
}
}
function updatePlay(dt){
 if(game.windowScene){updateWindowScene(dt);return;}
 updatePlayer(dt);
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
 updateLightning(dt);
 updateEnemies(dt);
 if(boss.active)updateBoss(dt);
 updateEBullets(dt);
 updateRings(dt);
 updateGeyserMarks(dt);
 updateSpawnMarks(dt);
 updatePickups(dt);
 updateShop(dt);
 updateRoomEvent(dt);
 updatePuzzle(dt);
 updateDecor(dt);
 updatePenumbra(dt);
 updateRoomWindow(dt);
 roomLogic(dt);
}
function togglePause(){
if(game.state!=='play'&&game.state!=='bossintro')return;
if(optionsOpen())return;
game.paused=!game.paused;
game.parryCharge=0;game.parryLock=false;
toggleOv('pause',game.paused);
blurActive();
}
/* voltar ao menu direto do ESC durante o jogo */
function goToMenu(){
audio();
game.paused=false;game.state='menu';
hideOv('pause');hideOv('options');hideOv('book');hideOv('lab');hideOv('shop');
initAttract();
showOv('menu');
refreshMenuDev();
blurActive();
}
/* ============ render: texto ============ */
const DISP='"Pirata One", serif',MONO='"IBM Plex Mono", monospace';
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
if(game.state!=='play'&&game.state!=='bossintro')return;
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
if(game.state!=='play'&&game.state!=='bossintro')return;
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
/* ============ render: projéteis do jogador ============ */
function drawBullets(){
for(const b of bullets){
const c=b.elem?ELEM_DATA[b.elem].c:'#cfe9ff';
ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);
ctx.globalAlpha=.3;ctx.fillStyle=c;
ctx.beginPath();ctx.ellipse(-12,0,10,3,0,0,TAU);ctx.fill();
ctx.globalAlpha=1;
ctx.fillStyle=c;
ctx.beginPath();ctx.ellipse(0,0,9,3.5,0,0,TAU);ctx.fill();
if(P.explShot){ctx.fillStyle='#ffd9a0';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();}
ctx.fillStyle=b.parry?'#e6dac4':'#fff';
ctx.beginPath();ctx.ellipse(4,0,4,2,0,0,TAU);ctx.fill();
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
function drawEnemy(e){
const s=Math.min(1,e.spawnT);
ctx.fillStyle='rgba(0,0,0,0.3)';
ctx.beginPath();ctx.ellipse(e.x,e.y+e.r*.55,e.r*s,e.r*.4*s,0,0,TAU);ctx.fill();
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
for(const h of boss.heads)drawHead(h);
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
function drawGroundEmbers(){
for(const g of groundEmbers){
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
/* ============ render: portas ============ */
function drawDoors(){
if(game.state==='menu'||game.state==='select')return;
const bg=ROOM.inverted?'#e9e7e0':'#0f0b0e';
for(const d of game.doors){
const horiz=d.dir==='n'||d.dir==='s';
ctx.save();
ctx.translate(d.x,d.y);
ctx.fillStyle=bg;
if(horiz)ctx.fillRect(-38,-11,76,22);else ctx.fillRect(-11,-38,22,76);
if(!d.open){
ctx.strokeStyle=ROOM.inverted?'#18141a':'#f2f0ea';
ctx.lineWidth=3;
if(horiz){
ctx.strokeRect(-34,-8,68,16);
ctx.beginPath();ctx.moveTo(-34,-8);ctx.lineTo(34,8);ctx.moveTo(34,-8);ctx.lineTo(-34,8);ctx.stroke();
}else{
ctx.strokeRect(-8,-34,16,68);
ctx.beginPath();ctx.moveTo(-8,-34);ctx.lineTo(8,34);ctx.moveTo(8,-34);ctx.lineTo(-8,34);ctx.stroke();
}
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
ctx.strokeStyle=ROOM.inverted?'#18141a':'#f2f0ea';
ctx.lineWidth=3;
if(horiz){ctx.beginPath();ctx.moveTo(-38,-11);ctx.lineTo(-38,11);ctx.moveTo(38,-11);ctx.lineTo(38,11);ctx.stroke();}
else{ctx.beginPath();ctx.moveTo(-11,-38);ctx.lineTo(11,-38);ctx.moveTo(-11,38);ctx.lineTo(11,38);ctx.stroke();}
const oy=d.dir==='n'?-1:d.dir==='s'?1:0;
const ox=d.dir==='w'?-1:d.dir==='e'?1:0;
ctx.globalAlpha=.4+.3*Math.sin(game.t*4);
ctx.strokeStyle='#9d6bb5';
ctx.lineWidth=2.5;
for(let k=0;k<2;k++){
ctx.beginPath();
if(horiz){ctx.moveTo(-8,oy*(6+k*7));ctx.lineTo(0,oy*(12+k*7));ctx.lineTo(8,oy*(6+k*7));}
else{ctx.moveTo(ox*(6+k*7),-8);ctx.lineTo(ox*(12+k*7),0);ctx.lineTo(ox*(6+k*7),8);}
ctx.stroke();
}
ctx.globalAlpha=1;
}
ctx.restore();
}
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
txt('DESVIO',cx+96,cy+22,MONO,11,'#9c8f7c','center',2);
keycap(cx+240,cy-30,150,'← ↑ ↓ →');
txt('ATACAR (OU CLIQUE)',cx+240,cy+22,MONO,11,'#9c8f7c','center',2);
keycap(cx+240,cy+62,60,'Z');
txt('INTERAGIR',cx+240,cy+112,MONO,11,'#9c8f7c','center',2);
ctx.globalAlpha=.4+.15*Math.sin(game.t*2.5);
txt('limpe cada sala para abrir as portas — pise nelas para passar',cx,cy+104,MONO,11,'#9c8f7c','center',2);
txt('derrote o chefe do mapa para abrir o portal · cinco descidas até o guardião',cx,cy+128,MONO,10,'#6e6357','center',2);
txt('visite o ERRANTE nas lojas: almas compram bênçãos, armas e corações',cx,cy+176,MONO,10,'#ffd9a0','center',2);
ctx.globalAlpha=.4+.15*Math.sin(game.t*2.5+1);
txt('[B] livro do cão — bênçãos e bestiário',cx,cy+152,MONO,10,'#6e6357','center',2);
ctx.globalAlpha=1;
ctx.restore();
}
function drawShop(){
/* O ERRANTE — NPC vendedor do limbo */
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
if(game.keeperNear&&(game.state==='play')){
ctx.globalAlpha=.55+.4*Math.sin(game.t*5);
txt('[Z] NEGOCIAR ALMAS',0,44,MONO,10,game.souls>0?'#ffd9a0':'#9c8f7c','center',2);
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
const total=rooms.length-(game.extraIdx>=0?1:0);
txt('DESCIDA '+roman(game.floor)+' · SALAS '+countCleared()+'/'+total,MX+MW/2,MY-13,MONO,9,'#9c8f7c','center',2);
const cell=i=>({x:MX+(rooms[i].gx-minx)*cw+cw/2,y:MY+(rooms[i].gy-miny)*ch+ch/2});
const vis=rooms.map((r,i)=>r.visited||r.kind==='boss'||rooms.some(o=>o.visited&&Math.abs(o.gx-r.gx)+Math.abs(o.gy-r.gy)===1));
ctx.strokeStyle='rgba(242,240,234,.18)';ctx.lineWidth=1.5;
for(let i=0;i<rooms.length;i++){
if(!vis[i])continue;
const a=cell(i),b=rooms[i].doors.e,b2=rooms[i].doors.s;
if(b>=0&&vis[b]){const c=cell(b);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke();}
if(b2>=0&&vis[b2]){const c=cell(b2);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke();}
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
const sw=clamp(r.shape.bw/34,13,26),sh=clamp(r.shape.bh/30,10,19);
const cur=i===game.roomIdx,done=r.visited&&r.cleared;
const unknown=!r.visited&&r.kind==='secret';
const isBoss=r.kind==='boss';
ctx.strokeStyle=unknown?'rgba(157,107,181,.5)':roomKindColor(r.kind,done,r);
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
}else if(unknown){
txt('?',p.x,p.y+1,MONO,8,'#9d6bb5','center',0);
}else if(isBoss){
ctx.globalAlpha=.6+.4*Math.sin(game.t*6);
ctx.strokeStyle='#a52a3a';ctx.lineWidth=1.5;
ctx.strokeRect(p.x-5,p.y-5,10,10);
ctx.beginPath();ctx.arc(p.x,p.y-5,5,Math.PI,0);ctx.stroke();
ctx.globalAlpha=1;
}else if(r.kind==='sboss'){
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
for(let i=0;i<player.maxHp;i++){
let x=36+i*44;const y=H-44;
let s=30;
if(heartsPopT>0&&i===heartsPopIdx){s=30+heartsPopT*26;x+=rnd(-2,2)*heartsPopT*3;}
const filled=i<player.hp;
heartShape(x,y,s);
ctx.fillStyle=filled?'#d9465a':'#241b20';ctx.fill();
ctx.strokeStyle=filled?'#140b0e':'#3a2a2e';ctx.lineWidth=2.5;ctx.stroke();
if(filled){
ctx.fillStyle='rgba(255,255,255,.35)';
ctx.beginPath();ctx.arc(x-s*.14,y-s*.14,s*.09,0,TAU);ctx.fill();
}
}
}
function drawDashGauge(){
const cdMax=DASH_CD*P.dashCdMult;
const frac=1-clamp(player.dashCd/cdMax,0,1);
ctx.strokeStyle='#3a2f28';ctx.lineWidth=1;
ctx.strokeRect(36,H-19,64,5);
ctx.fillStyle=frac>=1?'#e6dac4':'#8a7d6c';
ctx.fillRect(37,H-18,62*frac,3);
const dashKey=keyLabel(keybinds.dash[0]);
txt(game.hasParry
?'DESVIO ['+dashKey+'] · PARRY: GOLPEIE OS TIROS DE PERTO'
:'DESVIO ['+dashKey+']',106,H-16,MONO,9,'#6e6357','left',1);
if(P.chainsaw){
const f=1-clamp(player.sawThrowCd/3.2,0,1);
ctx.strokeStyle='#3a2f28';ctx.lineWidth=1;
ctx.strokeRect(36,H-27,64,4);
ctx.fillStyle=f>=1?'#c9a44c':'#6e6357';
ctx.fillRect(37,H-26,62*f,2);
txt('LANÇAR SERRA = CLIQUE DIREITO',106,H-24,MONO,8,'#6e6357','left',1);
}
}
function drawBossBar(){
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
txt(MINI_NAMES[mb.type]||'MINI-CHEFE',W/2,y-12,MONO,10,MINI_COLORS[mb.type]||'#cfd8dc','center',4);
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
if(game.state==='ending')return;
const bx=80,bw=W-160,by=14;
if(boss.active&&game.state==='play'){
txt('CÉRBERO — GUARDIÃO DO INFERNO'+(boss.phase2?' · FASE II':''),W/2,by+2,MONO,11,'#a52a3a','center',3);
drawBossBar();
}else if(game.mapRooms.length){
txt('DESCIDA '+roman(game.floor)+'/V — '+(game.hard?'ABISMO':'PADRÃO')+' · SEGREDOS '+Math.round(opts.secret*100)+'%',W/2,by+2,MONO,10,game.hard?'#d9465a':'#8a7d6c','center',2);
if(e404Any())drawE404Bar();
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
txt('mova thor até o portão',W/2,H*.9,MONO,12,'#9c8f7c','center',4);
ctx.globalAlpha=1;
}else if(game.endPhase==='closed'&&t>.9){
ctx.globalAlpha=ramp(t,.9,1.7);
txt('o inferno aguarda de portas abertas.',W/2,H*.46,MONO,13,'#9c8f7c','center',4);
ctx.globalAlpha=1;
}
}
/* ============ render principal ============ */
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
ctx.fillStyle='#040304';ctx.fillRect(0,0,W,H);
if(roomFloor)ctx.drawImage(roomFloor,ROOM.x,ROOM.y);
drawGroundEmbers();
drawPenumbra();
drawDecor();
drawTutorial();
if(game.state==='bossintro')drawHellGate();
if(game.state==='ending'&&game.endPhase!=='dialog'&&game.endPhase!=='dust'&&game.endPhase!=='soul'&&game.endPhase!=='bless'){
const g=gateAnimE();
drawGate(GATE.x,GATE.y,g.a,g.o,g.f);
}
drawDoors();
drawGeyserMarks();
drawSpawnMarks();
drawPortal();
drawRoomWindow();
drawPuzzle();
drawRings();
drawShock();
if(boss.active&&!boss.introLock){
for(const h of boss.heads){
if(!h.alive||h.state!=='tele')continue;
if(h.pattern==='charge'||h.pattern==='snipe'||h.pattern==='pounce'){
const a=h.pattern==='charge'?boss.chargeAim:Math.atan2(player.y-h.hy,player.x-h.hx);
const p=.5+.5*Math.sin(game.t*16);
ctx.strokeStyle='rgba(232,69,90,'+(.3+.3*p)+')';ctx.lineWidth=3;
ctx.setLineDash([14,10]);
ctx.beginPath();ctx.moveTo(h.hx,h.hy);
ctx.lineTo(h.hx+Math.cos(a)*1000,h.hy+Math.sin(a)*1000);
ctx.stroke();ctx.setLineDash([]);
}
}
}
drawPickups();
drawShop();
drawDarkSoul();
drawBoss();
for(const e of enemies)drawEnemy(e);
drawPlayer();
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
drawArcs();
drawEBullets();
drawBolts();
drawParticles();
drawTexts();
drawRoomEventFx();
drawE404Glitch();
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
drawHUD();
drawBanners();
drawEndingUI();
if(game.state==='reideath')drawReiDeathUI();
if(game.state==='knightdeath')drawKnightDeathUI();
drawWindowScene();
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
'<div><b>[1]</b> +25 almas</div>'+
'<div><b>[2]</b> vida cheia</div>'+
'<div><b>[3]</b> arca do inferno (todas as bênçãos)</div>'+
'<div><b>[4]</b> limpar a sala</div>'+
'<div><b>[5]</b> pular p/ próxima descida</div>'+
'<div><b>[6]</b> guardião Cérbero agora</div>'+
'<div><b>[7]</b> modo deus liga/desliga</div>'+
'<div><b>[8]</b> +100 almas</div>'+
'<div><b>[9]</b> todas as armas</div>'+
'<div><b>[0]</b> sala de testes (lab)</div>'+
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
/* ============ laço principal ============ */
let last=performance.now(),metaTimer=0;
function frame(now){
requestAnimationFrame(frame);
let dt=Math.min(.033,(now-last)/1000);
last=now;
musicTick();
updateDevPanel();
if(game.paused){decayScreenFx(dt);render();return;}
if(game.hitstop>0){game.hitstop-=dt;dt=0;}
game.t+=dt;
updateFX(dt);
metaTimer+=dt;
if(metaTimer>2){metaTimer=0;metaTick();}
if(game.state==='menu')updateAttract(dt);
else if(game.state==='play')updatePlay(dt);
else if(game.state==='e404intro')updateE404Intro(dt);
else if(game.state==='reiintro')updateReiIntro(dt);
else if(game.state==='reideath')updateReiDeath(dt);
else if(game.state==='knightintro')updateKnightIntro(dt);
else if(game.state==='knightdeath')updateKnightDeath(dt);
else if(game.state==='bossintro'){
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
updateHammers(dt);updateBullets(dt);
updateBossIntro(dt);updatePickups(dt);updateEBullets(dt);
}
else if(game.state==='ending')updateEnding(dt);
else if(game.state==='dead')updateDead(dt);
render();
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
game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain={x:0,y:0,w:W,h:H};
ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
buildRoomFloor();
game.roomKind='combat';game.globalRoom=0;game.threat=1;
game.fallK=-1;game.fallFrom=null;game.fallTo=null;game.fallTarget=null;
game.roomFade=0;game.treasureOpen=false;game.shopItems=[];game.keeper=null;game.keeperNear=false;game.roomEvent=null;game.e404T=0;game.e404Spawned=false;
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
else hideOv('menu');
showOv('options');
syncOptUI();refreshKbBtns();
blurActive();
}
function closeOptions(){
hideOv('options');
rebindAction=null;
if(optionsFrom==='pause')showOv('pause');
else showOv('menu');
blurActive();
}
/* ============ inicialização ============ */
function setupGame(){
bind('muteBtn','click',function(){
audio();muted=!muted;if(master)master.gain.value=muted?0:.9;
const a=ov('icOn'),b=ov('icOff');
if(a)a.style.display=muted?'none':'';
if(b)b.style.display=muted?'':'none';
blurActive();
});
bind('startBtn','click',openWeaponSelect);
bind('optBtn','click',function(){openOptions('menu');});
bind('saveBtn','click',function(){audio();renderSaveCards();showOv('saves');game.state='saves';blurActive();});
bind('saveBack','click',function(){hideOv('saves');game.state='menu';refreshMenuDev();blurActive();});
bind('optBtn2','click',function(){openOptions('pause');});
bind('optBack','click',closeOptions);
bind('dNorm','click',function(){setDiff('normal');});
bind('dHard','click',function(){setDiff('hard');});
bind('wShot','click',function(){startGame('shot');});
bind('wBite','click',function(){startGame('bite');});
bind('retryBtn','click',openWeaponSelect);
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
hideOv('win');
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
