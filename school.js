/* ============================================================
   THOR REVENGE — school.js v1
   A 4ª DESCIDA — ??? (a escola vazia)

   Fase isolada de terror/exploração. Não altera Penumbra, Limbo,
   bosses, saves ou sistemas existentes — é um sistema próprio que
   conversa com o motor por ganchos mínimos no game.js.

   FLUXO:
     selecionar ???  → intro (tela preta) → escola vazia
     explorar → fragmento 1 → "você não está sozinho"
     o CAÇADOR (cervo de caveira, manto preto, ossos por dentro)
     8 fragmentos → espelho → escola invertida → fragmento final
     ritual no pátio → o pátio inunda → afundar → 5º círculo (Caronte)

   EDITÁVEL FORA DO CÓDIGO:
     assets/sprites/escola/  — sprites desta fase (veja o .txt lá)
     os dados do mapa estão na seção "DADOS DO MAPA" abaixo.
   ============================================================ */
(function(){
'use strict';

/* ================= utilidades locais ================= */
function shash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function srng(seed){let a=seed>>>0;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function nowS(){return performance.now()/1000;}

/* ---- sprites trocáveis: assets/sprites/escola/<nome>.png ---- */
const SPR_DIR='assets/sprites/escola/';
const SPR_EXTS=['png','jpg','jpeg','webp','gif'];/* v1.2.0: + GIF animado (o cervo pode ser um gif!) */
const SPR={};
const SPR_PROBED={};
function sprGet(name){
  if(SPR[name])return SPR[name];
  if(SPR_PROBED[name])return null;
  SPR_PROBED[name]=true;
  let i=0;
  (function next(){
    if(i>=SPR_EXTS.length){SPR[name]=null;return;}
    const im=new Image();
    im.onload=function(){SPR[name]=im;};
    im.onerror=function(){i++;next();};
    im.src=SPR_DIR+name+'.'+SPR_EXTS[i];
  })();
  return null;
}
['cacador','cacador-cabeca','fragmento','espelho','cervo-caveira','rosto','estatica'].forEach(sprGet);
/* RE-ESCAN: sprites adicionados com a escola já rodando entram em ~15s */
function sprRescan(){
  for(const k in SPR){
    if(SPR[k]===null){delete SPR[k];delete SPR_PROBED[k];sprGet(k);}
  }
}
setInterval(function(){if(!document.hidden)sprRescan();},15000);
window.SCHOOL_RESCAN_SPRITES=sprRescan;

/* ============================================================
   DADOS DO MAPA — edite aqui para mudar a escola
   coll   : retângulos caminháveis (x,y,w,h)
   doors  : {x,y,to,side} — pares espelhados entre áreas
            side: de que parede a porta sai ('n','s','e','w')
            kind: 'porta' (padrão) | 'escada' | 'espelho'
            locked: exige item/condição (trancada até ter a chave)
   ============================================================ */
const SCHOOL_AREAS={
entrada:{name:'entrada',dark:.66,floor:'madeira',
 coll:[{x:400,y:150,w:480,h:420}],
 doors:[{x:884,y:360,to:'patio',side:'e'}]},
patio:{name:'pátio',dark:.5,floor:'patio',
 coll:[{x:70,y:80,w:1140,h:560}],
 doors:[{x:76,y:360,to:'entrada',side:'w'},
        {x:640,y:84,to:'corrA',side:'n'},
        {x:1204,y:360,to:'corrB',side:'e'},
        {x:640,y:636,to:'externo',side:'s'}]},
externo:{name:'fora',dark:.72,floor:'fora',
 coll:[{x:170,y:90,w:940,h:540}],
 doors:[{x:640,y:94,to:'patio',side:'n'}]},
corrA:{name:'estrutura A — térreo',dark:.7,floor:'corredor',
 coll:[{x:60,y:288,w:1160,h:144}],
 doors:[{x:620,y:428,to:'patio',side:'s'},
        {x:64,y:360,to:'salaA11',side:'w'},
        {x:1216,y:360,to:'salaA12',side:'e'},
        {x:760,y:292,to:'salaA13',side:'n'},
        {x:170,y:360,to:'corrA2',side:'w',kind:'escada'}]},
corrA2:{name:'estrutura A — andar de cima',dark:.74,floor:'corredor2',
 coll:[{x:60,y:288,w:1160,h:144}],
 doors:[{x:64,y:360,to:'salaA21',side:'w'},
        {x:1216,y:360,to:'salaA22',side:'e'},
        {x:400,y:292,to:'salaA23',side:'n'},
        /* v0.9.12: escada no MESMO lado de corrA (oeste) — antes chegava
           no lado leste e desorientava; A e B agora são consistentes */
        {x:170,y:360,to:'corrA',side:'w',kind:'escada'}]},
corrB:{name:'estrutura B — térreo',dark:.7,floor:'corredor',
 coll:[{x:60,y:288,w:1160,h:144}],
 doors:[{x:660,y:428,to:'patio',side:'s'},
        {x:64,y:360,to:'salaB11',side:'w'},
        {x:1216,y:360,to:'salaB12',side:'e'},
        {x:520,y:292,to:'salaB13',side:'n',locked:'chave'},
        {x:1150,y:360,to:'corrB2',side:'e',kind:'escada'}]},
corrB2:{name:'estrutura B — andar de cima',dark:.74,floor:'corredor2',
 coll:[{x:60,y:288,w:1160,h:144}],
 doors:[{x:64,y:360,to:'salaB21',side:'w'},
        {x:1216,y:360,to:'salaB22',side:'e'},
        {x:880,y:292,to:'salaB23',side:'n'},
        /* v0.9.12: escada no MESMO lado de corrB (leste) */
        {x:1110,y:360,to:'corrB',side:'e',kind:'escada'}]},
salaA11:{name:'sala de aula',dark:.76,floor:'sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:904,y:360,to:'corrA',side:'e'}]},
salaA12:{name:'biblioteca',dark:.78,floor:'sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:376,y:360,to:'corrA',side:'w'}]},
salaA13:{name:'banheiro',dark:.72,floor:'azulejo',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:640,y:554,to:'corrA',side:'s'}]},
salaA21:{name:'laboratório',dark:.78,floor:'sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:904,y:360,to:'corrA2',side:'e'}]},
salaA22:{name:'sala abandonada',dark:.84,floor:'sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:376,y:360,to:'corrA2',side:'w'}]},
salaA23:{name:'enfermaria',dark:.8,floor:'azulejo',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:640,y:554,to:'corrA2',side:'s'}]},
salaB11:{name:'depósito',dark:.94,floor:'sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:376,y:360,to:'corrB',side:'w'}]},
salaB12:{name:'sala administrativa',dark:.76,floor:'sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:904,y:360,to:'corrB',side:'e'}]},
salaB13:{name:'sala trancada',dark:.82,floor:'sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:640,y:554,to:'corrB',side:'s'}]},
salaB21:{name:'sala de aula II',dark:.78,floor:'sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:376,y:360,to:'corrB2',side:'w'}]},
salaB22:{name:'sala de música',dark:.8,floor:'sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:904,y:360,to:'corrB2',side:'e'}]},
salaB23:{name:'sala vazia',dark:.86,floor:'sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:640,y:554,to:'corrB2',side:'s'}]},
inv_patio:{name:'??',dark:.56,floor:'inv_patio',
 coll:[{x:70,y:80,w:1140,h:560}],
 doors:[{x:1216,y:360,to:'inv_corr',side:'e'},
        {x:76,y:360,to:'patio',side:'w',kind:'espelho'}]},
inv_corr:{name:'??',dark:.72,floor:'inv_corr',
 coll:[{x:60,y:288,w:1160,h:144}],
 doors:[{x:64,y:360,to:'inv_patio',side:'w'},
        {x:1216,y:360,to:'inv_sala1',side:'e'}]},
inv_sala1:{name:'??',dark:.8,floor:'inv_sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:376,y:360,to:'inv_corr',side:'w'},
        {x:640,y:174,to:'inv_professores',side:'n'}]},
inv_professores:{name:'??',dark:.78,floor:'inv_sala',
 coll:[{x:380,y:170,w:520,h:380}],
 doors:[{x:640,y:546,to:'inv_sala1',side:'s'}]}
};
/* adjacências (para a IA do caçador) */
const SCHOOL_ADJ={};
for(const id in SCHOOL_AREAS){
  SCHOOL_ADJ[id]=[];
  for(const d of SCHOOL_AREAS[id].doors)if(SCHOOL_ADJ[id].indexOf(d.to)<0)SCHOOL_ADJ[id].push(d.to);
}
function schoolBFS(from,to){
  if(from===to)return[from];
  const prev={},q=[from];prev[from]=null;
  while(q.length){
    const a=q.shift();
    for(const nb of SCHOOL_ADJ[a]||[]){
      if(nb in prev)continue;
      prev[nb]=a;
      if(nb===to){const path=[to];let c=to;while(prev[c]){c=prev[c];path.unshift(c);}return path;}
      q.push(nb);
    }
  }
  return[from];
}

/* ============================================================
   OS 8 FRAGMENTOS — condições espalhadas pela escola
   how descreve como cada um se libera (ver lógica em fragAvailable)
   ============================================================ */
const FRAG_DEFS=[
 {id:1,area:'salaA11',x:520,y:430,kind:'metal'},
 {id:2,area:'salaB13',x:640,y:290,kind:'tecido'},
 {id:3,area:'salaA12',x:640,y:250,kind:'simbolo'},
 {id:4,area:'salaB11',x:810,y:470,kind:'escuro'},
 {id:5,area:'salaA13',x:836,y:486,kind:'agua'},
 {id:6,area:'externo',x:1010,y:545,kind:'externo'},
 {id:7,area:'salaA22',x:640,y:300,kind:'engenho'},
 {id:8,area:'inv_professores',x:640,y:290,kind:'ultimo'}
];

/* ============================================================
   ESTADO
   ============================================================ */
const SCHOOL={
 active:false,area:'entrada',intro:null,fade:1,
 _cd:0, /* v1.2.3: cooldown anti-pêndulo de travessia */
 msgs:[],cine:null,mirrorCine:null,sink:null,
 ritual:null,flood:{level:0,t:0,ripple:0},
 /* v1.2.0: incêndio final, cinemática de fuga e VOCÊ MESMO */
 fire:null,escape:null,you:null,youDelay:0,
 amb:{t:6,next:26},fx:{stretch:0,lightDie:0,grain:0},
 mirrorFx:{lag:0,creepy:0},
 noise:{t:0,x:0,y:0,r:0},
 lightCache:{},floorCache:{},
 prog:null,hunt:null,cont:null,_customDeath:null,_hintT:0
};
const PROG_DEFAULT=function(){return{frags:[false,false,false,false,false,false,false,false],
 chave:false,valves:[false,false,false,false],books:[],clocks:[false,false,false],clockSeq:0,pad:false,shed:false,yourselfSeen:false,
 mirror:false,mirrorReady:false,mirrorSeen:false,mirrorClosed:false,mirrorTaps:0,unlocked:[],
 visits:0,ritualDone:false,flooded:false,area:'entrada'};};
function progLoad(){
  let p=null;
  try{if(META.school&&META.school.prog)p=JSON.parse(JSON.stringify(META.school.prog));}catch(e){}
  const d=PROG_DEFAULT();
  if(p)for(const k in d)if(p[k]!==undefined)d[k]=p[k];
  SCHOOL.prog=d;
}
function progSave(){
  /* v0.9.9: a escola-dentro-da-run não grava progresso (passagem única) */
  if(SCHOOL.fromRun)return;
  try{META.school={prog:JSON.parse(JSON.stringify(SCHOOL.prog))};saveMeta();}catch(e){}
}
function fragCount(){return SCHOOL.prog.frags.filter(Boolean).length;}
function hasFrag(i){return SCHOOL.prog.frags[i];}

/* condições de aparição de cada fragmento */
function fragAvailable(i){
  const p=SCHOOL.prog;
  if(p.frags[i])return false;
  switch(i){
    case 0:return true;                                  /* 1 — livre, na sala de aula */
    case 1:return true;                                  /* 2 — dentro da sala trancada */
    case 2:return p.books.length>=5&&p.booksOk===true;   /* 3 — ordem dos livros (5 na v1.2.0) */
    case 3:return true;                                  /* 4 — escondido no escuro */
    case 4:return p.valves.length>=4&&p.valves.every(function(v){return v;}); /* 5 — depois dos registros (4 agora) */
    case 5:return p.shed;                                /* 6 — abrigo do lado de fora */
    case 6:return p.pad;                                 /* 7 — código dos relógios */
    /* v1.2.0: o 8º só se revela depois de encarar VOCÊ MESMO */
    case 7:return p.mirror&&p.yourselfSeen;              /* 8 — escola invertida + encare-o */
  }
  return false;
}

/* ================= mensagens / cine ================= */
function msg(txt,dur,big){SCHOOL.msgs.push({txt:txt,t:0,dur:dur||2.4,big:!!big});}
function cine(lines,total,snd){SCHOOL.cine={t:0,lines:lines,total:total,snd:snd||null};}
function schoolSay(t){SCHOOL.msgs=[];cine([{txt:t,at:.4,dur:2.6}],3.4,null);}

/* ================= entrada na fase ================= */
function unlockOK(){
  if(new URLSearchParams(location.search).get('escola')==='1')return true;
  return (META.descidas||0)>=3;
}
/* v0.9.13: ARMAS REMOVIDAS NA ESCOLA — guardadas e devolvidas ao sair.
   Toda entrada na escola (menu, corredor, poça do Limbo, continuar) desarma. */
function stripWeapons(){
  if(!SCHOOL._weapSnap){
    SCHOOL._weapSnap={weapon:game.weapon,hasShot:game.hasShot,hasBite:game.hasBite,hasParry:game.hasParry,
      chainsaw:P.chainsaw,sword:P.sword,shotT:player.shotT,biteT:player.biteT};
  }
  game.weapon=null;game.hasShot=false;game.hasBite=false;game.hasParry=false;
  P.chainsaw=0;P.sword=0;player.shotT=0;player.biteT=0;player.sawThrowCd=0;
}
function restoreWeapons(){
  const s=SCHOOL._weapSnap;SCHOOL._weapSnap=null;
  if(!s)return;
  game.weapon=s.weapon;game.hasShot=s.hasShot;game.hasBite=s.hasBite;game.hasParry=s.hasParry;
  P.chainsaw=s.chainsaw;P.sword=s.sword;
  if(game.hasShot)player.shotT=.3;
  if(game.hasBite)player.biteT=.3;
}
function startFromMenu(){
  audio();
  ['menu','dead','win','pause','levelup','weapons','options','book','lab','saves','shop','cheatmenu','mythicChoice','circles','limboLoading'].forEach(hideOv);
  blurActive();
  resetAll();
  game.weapon='shot';game.hard=false;game.hasShot=true;game.hasBite=false;
  player.maxHp=100;player.hp=100;player.dead=false;
  stripWeapons();/* v0.9.13: escola desarma */
  SCHOOL._spdBase=P.speedMult||1;
  progLoad();
  SCHOOL.active=true;window.__SCHOOL_ACTIVE=true;
  SCHOOL.fromRun=false;
  SCHOOL.intro={t:0};
  SCHOOL.fade=1;SCHOOL.msgs=[];SCHOOL.cine=null;SCHOOL.mirrorCine=null;SCHOOL.sink=null;
  SCHOOL.ritual=null;SCHOOL.flood={level:0,t:0,ripple:0};SCHOOL.amb={t:6,next:26};
  SCHOOL.fire=null;SCHOOL.escape=null;SCHOOL.you=null;SCHOOL.youDelay=0;/* v1.2.0 */
  SCHOOL.fx={stretch:0,lightDie:0,grain:0};SCHOOL.mirrorFx={lag:0,creepy:0};
  SCHOOL.hunt=freshHunt();
  SCHOOL.hide=null;SCHOOL.scare=null;SCHOOL._ptrDown=false;SCHOOL._door=null;
  randomizePuzzles();
  if(SCHOOL.prog.frags[0])spawnHunter();
  SCHOOL.floorCache={};SCHOOL.lightCache={};
  game.state='schoolintro';
  try{blip('sine',52,30,2.6,.05);}catch(e){}
}
/* v0.9.9: A ESCOLA NO 4º ANDAR — quando desbloqueada, a descida natural
   (após Caronte) leva à escola em vez do Limbo, PRESERVANDO a run:
   vida, almas, bênçãos, arma e item ativo continuam. O progresso da escola
   do menu não é tocado (a escola da run é uma passagem, não um save). */
function startFromRun(){
  SCHOOL._spdBase=P.speedMult||1;
  SCHOOL.fromRun=true;
  const d=PROG_DEFAULT();
  SCHOOL.prog=d;
  applyUrlFrag(); /* v0.9.12: ?frag=N agora vale TAMBÉM na escola-da-run */
  SCHOOL.active=true;window.__SCHOOL_ACTIVE=true;
  stripWeapons();/* v0.9.13: entrar na escola REMOVE as armas temporariamente */
  SCHOOL.intro={t:0};
  SCHOOL.fade=1;SCHOOL.msgs=[];SCHOOL.cine=null;SCHOOL.mirrorCine=null;SCHOOL.sink=null;
  SCHOOL.ritual=null;SCHOOL.flood={level:0,t:0,ripple:0};SCHOOL.amb={t:6,next:26};
  SCHOOL.fire=null;SCHOOL.escape=null;SCHOOL.you=null;SCHOOL.youDelay=0;/* v1.2.0 */
  SCHOOL.fx={stretch:0,lightDie:0,grain:0};SCHOOL.mirrorFx={lag:0,creepy:0};
  SCHOOL.hunt=freshHunt();
  SCHOOL.hide=null;SCHOOL.scare=null;SCHOOL._ptrDown=false;SCHOOL._door=null;
  randomizePuzzles();
  if(SCHOOL.prog.frags[0])spawnHunter();
  SCHOOL.floorCache={};SCHOOL.lightCache={};
  game.floor=4; /* o 4º andar É a escola */
  game.state='schoolintro';
  try{blip('sine',52,30,2.6,.05);noiseSfx(1.4,.03,220,'lowpass');}catch(e){}
}
function startInto(opts){
  opts=opts||{};
  progLoad();
  SCHOOL.active=true;window.__SCHOOL_ACTIVE=true;
  SCHOOL.intro=null;SCHOOL.fade=1;SCHOOL.msgs=[];SCHOOL.cine=null;SCHOOL.mirrorCine=null;SCHOOL.sink=null;
  SCHOOL.ritual=null;SCHOOL.flood={level:0,t:0,ripple:0};SCHOOL.amb={t:6,next:26};
  SCHOOL.fire=null;SCHOOL.escape=null;SCHOOL.you=null;SCHOOL.youDelay=0;/* v1.2.0 */
  SCHOOL.fx={stretch:0,lightDie:0,grain:0};SCHOOL.mirrorFx={lag:0,creepy:0};
  SCHOOL.hunt=freshHunt();
  SCHOOL.hide=null;SCHOOL.scare=null;SCHOOL._ptrDown=false;SCHOOL._door=null;
  randomizePuzzles();
  SCHOOL.floorCache={};SCHOOL.lightCache={};
  if(SCHOOL.prog.frags[0])spawnHunter();
  game.state='schoolintro';
  SCHOOL.intro={t:0};
}
function beginPlay(){
  SCHOOL.intro=null;
  game.state='school';
  enterArea(SCHOOL.prog.area||'entrada',null,true);
  /* v0.9.13: aviso do desarmamento (uma vez por sessão) */
  if(SCHOOL._weapSnap&&!SCHOOL._disarmTold){SCHOOL._disarmTold=true;msg('suas armas... não estão mais com você.',3.2);}
}
/* troca de área — door side define onde o jogador aparece */
function enterArea(id,fromId,silent){
  const A=SCHOOL_AREAS[id];if(!A)return;
  SCHOOL.area=id;SCHOOL.prog.area=id;progSave();
  game.absRects=A.coll.map(r=>({x:r.x,y:r.y,w:r.w,h:r.h}));
  game.absMain=game.absRects[0];
  game.decor=[];game.doors=[];game.portal=null;
  bullets.length=0;ebullets.length=0;enemies.length=0;pickups.length=0;
  let px=null,py=null;
  if(fromId){
    const d=A.doors.find(d=>d.to===fromId);
    if(d){
      /* v1.2.3: pela escada você nasce 44px para dentro — longe o bastante para
         não re-encostar nela ao chegar (anti-pêndulo corrA↔corrA2). */
      const off=(d.kind==='escada'?{n:[0,44],s:[0,-44],e:[-44,0],w:[44,0]}:{n:[0,34],s:[0,-34],e:[-34,0],w:[34,0]})[d.side]||[0,0];
      px=d.x+off[0];py=d.y+off[1];
    }
  }
  if(px===null){px=A.coll[0].x+A.coll[0].w/2;py=A.coll[0].y+A.coll[0].h*.66;}
  player.x=px;player.y=py;player.mvx=0;player.mvy=0;
  clampArena(player,player.r);
  SCHOOL.fade=silent?1:.9;
  if(id==='patio'){
    SCHOOL.prog.visits=(SCHOOL.prog.visits||0)+1;progSave();
    if(!silent&&SCHOOL.prog.visits>=2&&!SCHOOL.prog.ritualDone)patioChange();
  }
  if(!silent){
    try{noiseSfx(.5,.02,300,'lowpass');}catch(e){}
    /* v1.2.3: cooldown anti-pêndulo (bloqueia re-disparo por 1.1s ao chegar) */
    SCHOOL._cd=1.1;
    /* v1.2.3: CONFIRMAÇÃO DO ANDAR — quem sobe a escada vê claramente que
       mudou de andar (antes os corredores idênticos davam a impressão de que
       "o jogo não progrediu"). */
    const dIn=fromId?A.doors.find(function(dd){return dd.to===fromId;}):null;
    if(dIn){
      SCHOOL._lastDoor={d:dIn,area:id}; /* histérese: muda até você se afastar */
      if(dIn.kind==='escada')msg(A.name+'.',2.1);
    }
  }
  SCHOOL.lightCache={};
}
/* pequenas mudanças ao revisitar o pátio — sutis, quase imperceptíveis */
function patioChange(){
  const n=(SCHOOL.prog.visits-2)%8;
  if(n===0)msg('uma das portas do pátio está entreaberta.',2.6);
  else if(n===1){try{blip('sine',900,500,.2,.02);}catch(e){}}
  else if(n===2)msg('o chão do pátio tem marcas novas.',2.6);
  else if(n===3){try{sfx.creak();}catch(e){}}
  else if(n===4)msg('algum banco mudou de lugar.',2.6);
  else if(n===5)msg('há uma sombra numa parede onde não há nada.',3);
  else if(n===6){try{noiseSfx(.8,.03,180,'lowpass');}catch(e){}}
  else msg('o pátio parece maior hoje.',2.8);
}
/* ================= INTRO (tela preta) ================= */
window.SCHOOL_updateIntro=function(dt){
  SCHOOL.intro.t+=dt;
  const t=SCHOOL.intro.t;
  if((t>2.2&&(held('interact')||held('active')))||t>=9.4)beginPlay();
};
window.SCHOOL_drawIntro=function(){
  ctx.fillStyle='#020103';ctx.fillRect(0,0,W,H);
  /* v1.2.0: CUTSCENE — coloque assets/sprites/cutscene.png|gif|mp4|webm
     e ela cobre a abertura da escola (vídeo toca; gif anima) */
  try{
    const cs=window.THOR_PNG&&window.THOR_PNG.getCutscene&&window.THOR_PNG.getCutscene();
    if(cs){
      const iw=cs.videoWidth||cs.naturalWidth,ih=cs.videoHeight||cs.naturalHeight;
      if(iw&&ih){
        const k=Math.max(W/iw,H/ih),dw=iw*k,dh=ih*k;
        ctx.globalAlpha=.9;ctx.drawImage(cs,(W-dw)/2,(H-dh)/2,dw,dh);ctx.globalAlpha=1;
      }
    }
  }catch(e){}
  const t=SCHOOL.intro.t;
  ctx.globalAlpha=1;
  const fadeIO=function(a,b,c,d){return ramp(t,a,b)*(1-ramp(t,c,d));};
  if(t>1.1)ctx.globalAlpha=fadeIO(1.1,1.8,2.7,3.3);
  if(t>1.1){txt('.  .  .',W/2,H*.46,MONO,15,'#5a5148','center',6);}
  ctx.globalAlpha=1;
  if(t>3.6){
    const a=fadeIO(3.6,4.6,8.2,9.2);
    ctx.globalAlpha=Math.max(0,a);
    txt('Você não consegue lembrar',W/2,H*.47,DISP,Math.round(W*.031),'#9c8f7c','center',1);
    txt('como chegou aqui.',W/2,H*.47+W*.036,DISP,Math.round(W*.031),'#9c8f7c','center',1);
  }
  ctx.globalAlpha=1;
  if(t>4.4&&Math.random()<.006)try{noiseSfx(.4,.012,150,'lowpass');}catch(e){}
};

/* ================= expondo para o game.js ================= */
window.SCHOOL={
  startFromMenu:function(){startFromMenu();},
  startFromRun:function(){startFromRun();},
  schoolUnlocked:function(){return unlockOK();},
  enterArea:function(id,from){SCHOOL.intro=null;game.state='school';enterArea(id,from,false);},
  musicMode:musicMode,
  interact:function(){schoolInteract();},
  bark:function(){schoolBark();},/* v0.9.13: ESPAÇO na escola = latido */
  refreshCircles:refreshCircles,
  beforeMenu:beforeMenu,
  clearContinue:clearContinue,
  refreshMenu:refreshMenu,
  resumeRun:resumeRun,
  isActive:function(){return SCHOOL.active;},
  debugFinish:function(){finishSchool();},
  debug:function(){return{area:SCHOOL.area,hunt:SCHOOL.hunt.state,frags:fragCount(),prog:SCHOOL.prog};}
};
function musicMode(){
  if(!SCHOOL.active)return null;
  if(SCHOOL.escape)return 'escola';
  if(SCHOOL.fire&&SCHOOL.fire.active)return 'escola:cacada';/* v1.2.0: a caçada final */
  if(SCHOOL.sink)return 'escola:inundacao';
  if(SCHOOL.ritual)return 'escola:ritual';
  if(SCHOOL.mirrorCine)return 'escola:espelho';
  if(SCHOOL.hunt&&SCHOOL.hunt.state==='chase')return 'escola:cacada';
  if(SCHOOL.area&&SCHOOL.area.indexOf('inv_')===0)return 'escola:espelho';
  if(SCHOOL.flood.level>0)return 'escola:inundacao';
  return 'escola';
}

/* ============================================================
   UPDATE PRINCIPAL
   ============================================================ */
window.SCHOOL_update=function(dt){
  if(SCHOOL.fade>0)SCHOOL.fade=Math.max(0,SCHOOL.fade-dt*1.3);
  for(let i=SCHOOL.msgs.length-1;i>=0;i--){const m=SCHOOL.msgs[i];m.t+=dt;if(m.t>=m.dur)SCHOOL.msgs.splice(i,1);}
  if(SCHOOL.fx.stretch>0)SCHOOL.fx.stretch-=dt;
  if(SCHOOL.fx.lightDie>0)SCHOOL.fx.lightDie-=dt;
  if(SCHOOL._lockT>0)SCHOOL._lockT-=dt;
  if(SCHOOL._cd>0)SCHOOL._cd-=dt; /* v1.2.3: anti-pêndulo */
  /* velocidade é afetada pela água (restaurada ao sair da fase) */
  if(SCHOOL._spdBase>0)P.speedMult=SCHOOL._spdBase*(SCHOOL.flood.level>0?(1-.42*SCHOOL.flood.level):1);
  /* cine: interrompe a jogabilidade por alguns segundos */
  if(SCHOOL.cine){
    const c=SCHOOL.cine;c.t+=dt;
    if(c.snd&&!c.sndDone&&c.t>=c.snd.at){c.sndDone=true;try{c.snd.fn();}catch(e){}}
    if(Math.random()<dt*2)particles.push({x:rnd(0,W),y:rnd(0,H),vx:rnd(-6,6),vy:rnd(-14,-4),life:rnd(1,2),t:0,r:rnd(1,2),c:'rgba(90,80,95,0.25)',drag:.99,glow:false});
    /* v0.9.13: a REVELAÇÃO anda MESMO durante a fala do 1º fragmento */
    if(SCHOOL.hunt&&SCHOOL.hunt.state==='reveal')updateHunter(dt);
    if(c.t>=c.total)SCHOOL.cine=null;
    return;
  }
  if(SCHOOL.mirrorCine){updateMirrorCine(dt);return;}
  if(SCHOOL.sink){updateSink(dt);return;}
  if(SCHOOL.ritual){updateRitual(dt);return;}
  /* v1.2.0: cinemática da fuga congela o mundo */
  if(SCHOOL.escape){updateEscape(dt);return;}
  /* v0.9.12: susto congela TUDO */
  if(SCHOOL.scare){updateScare(dt);return;}
  if(SCHOOL.hide){
    updateHide(dt);
    /* v1.2.1: o ruído antigo ainda precisa ESPIRAR (senão ele ouve pra sempre) */
    SCHOOL.noise.t-=dt;
    /* v1.2.1: o cervo NÃO congela — ele continua caçando, entrando em salas
       e seguindo rumo enquanto você prende a respiração dentro do armário */
    updateHunter(dt);
  }else{
    updatePlayer(dt);
    /* o jogador faz ruído — e algo escuta */
    SCHOOL.noise.t-=dt;
    if((player.mvx||player.mvy)&&SCHOOL.noise.t<=0){
      SCHOOL.noise.t=.42;
      SCHOOL.noise.x=player.x;SCHOOL.noise.y=player.y;
      /* v0.9.13: SHIFT = andar devagar — passos quase inaudíveis (raio 85) */
      SCHOOL.noise.r=(player.sneak?85:(player.dashT>0)?430:200);
    }
    schoolDoors(dt);
    schoolAuto();
    schoolFrags();
    updateHunter(dt);
    /* v1.2.0: VOCÊ MESMO + o incêndio final */
    if(SCHOOL.youDelay>0){SCHOOL.youDelay-=dt;if(SCHOOL.youDelay<=0)spawnYou();}
    if(SCHOOL.you)updateYou(dt);
    if(SCHOOL.fire)updateFire(dt);
    /* serra arremessada continua voando dentro da escola (v0.9.12) */
    if(thrownSaw)updateThrownSaw(dt);
  }
  updateAmbient(dt);
  if(SCHOOL.flood.level>0)updateFlood(dt);
  /* olhar: na escola invertida, SEGURE o mouse para encarar o cursor (v0.9.12) */
  if(!SCHOOL.hide&&SCHOOL.area.indexOf('inv_')===0&&SCHOOL._ptrDown&&mouse.inCanvas){
    const gx=(W-mouse.x)-player.x; /* a tela está espelhada */
    player.angle=Math.atan2(mouse.y-player.y,gx);
  }
  /* coração: acelera com a proximidade — som trocável em assets/audio/ */
  const h=SCHOOL.hunt;
  if(h&&h.state!=='none'&&h.area===SCHOOL.area&&h.state!=='gone'){
    const d=dist(player.x,player.y,h.x,h.y);
    h.beat-=dt;
    if(d<430&&h.beat<=0){h.beat=clamp(d/430*1.3,.26,1.3);heartbeatSound(d);}
  }
};
/* ---- portas da escola ---- */
function schoolDoors(dt){
  if(game.fallK>=0){SCHOOL._door=null;return;}
  /* v1.2.3: cooldown anti-pêndulo — logo APÓS uma travessia você não re-dispara
     a porta/escada de volta sem querer (tecla ainda pressionada ao chegar). */
  if(SCHOOL._cd>0){SCHOOL._door=null;return;}
  /* v1.2.3: anti-pêndulo ESTRUTURAL (histérese) — a porta que te TROUXE aqui
     fica muda enquanto você estiver no raio dela; só volta a funcionar depois
     que você se AFASTAR (48px) e re-encostar de propósito. Mata de vez o
     "sobe e desce sozinho" mesmo que você pare em cima da escada ao chegar. */
  if(SCHOOL._lastDoor){
    if(SCHOOL._lastDoor.area!==SCHOOL.area||dist(player.x,player.y,SCHOOL._lastDoor.d.x,SCHOOL._lastDoor.d.y)>48)SCHOOL._lastDoor=null;
  }
  const A=SCHOOL_AREAS[SCHOOL.area];
  /* v0.9.13: Thor ABRE a porta — demora um instante e FAZ BARULHO.
  Se a criatura estiver perto, ela ouve o rangido e vem ver. */
  if(SCHOOL._door){
    const d=SCHOOL._door.d;
    if(SCHOOL._door.area!==SCHOOL.area||dist(player.x,player.y,d.x,d.y)>48){SCHOOL._door=null;}
    else{
      SCHOOL._door.t+=dt;
      clampArena(player,player.r);
      if(SCHOOL._door.t>=.42){
        const dd=SCHOOL._door.d;SCHOOL._door=null;
        game.fallK=0;game.fallFrom={x:player.x,y:player.y};game.fallTo={x:dd.x,y:dd.y};
        game.fallTarget={school:dd.to,dir:SCHOOL.area};
        game.shake=Math.max(game.shake,3);
      }
      return;
    }
  }
  /* v1.2.0: A PORTA DA FUGA — parede oeste da entrada, acesa no incêndio */
  if(SCHOOL.fire&&SCHOOL.fire.escape&&SCHOOL.area==='entrada'&&dist(player.x,player.y,406,360)<34){
    startEscapeWin();
    return;
  }
  for(const d of A.doors){
    if(dist(player.x,player.y,d.x,d.y)<26){
      /* v1.2.3: a porta de CHEGADA não re-dispara (histérese — veja acima) */
      if(SCHOOL._lastDoor&&SCHOOL._lastDoor.d===d){clampArena(player,player.r);return;}
      if(d.locked==='chave'){
        /* v0.9.12 FIX: a destrava agora vive no PROGRESSO (prog.unlocked),
           NUNCA mais mutando SCHOOL_AREAS — antes d.locked=null furava o
           dado global e a porta nascia aberta pra sempre na sessão. */
        const dk=SCHOOL.area+'#'+d.x+','+d.y;
        if((SCHOOL.prog.unlocked||[]).indexOf(dk)>=0){/* já destrancada — abre e atravessa */}
        else{
          if(!SCHOOL.prog.chave){
            if(SCHOOL._lockT<=0){msg('trancada.',1.6);try{sfx.thud();}catch(e){}SCHOOL._lockT=2.6;}
            clampArena(player,player.r);return;
          }
          SCHOOL.prog.chave=false;
          if(!SCHOOL.prog.unlocked)SCHOOL.prog.unlocked=[];
          SCHOOL.prog.unlocked.push(dk);
          msg('a chave girou.',2);progSave();
          SCHOOL._unlockAnim=1.2;
          try{blip('sine',300,470,.2,.05);noiseSfx(.25,.05,700,'bandpass');}catch(e){}
          clampArena(player,player.r);return;
        }
      }
      if(d.kind==='espelho'){startMirrorReturn();return;}
      /* v1.2.3: A ESCADA É INSTANTÂNEA — pisou, sobe. Antes ela usava o mesmo
         timer cancelável da porta (0.42s): quem continuava andando (ou parava
         a 26–48px e voltava a andar) CANCELAVA a travessia sem perceber e
         passava reto — ia parar noutra sala (ex.: salaA11) ou parecia que a
         escada "não funcionava". Agora o contato dispara a queda na hora. */
      if(d.kind==='escada'){
        game.fallK=0;game.fallFrom={x:player.x,y:player.y};game.fallTo={x:d.x,y:d.y};
        game.fallTarget={school:d.to,dir:SCHOOL.area};
        game.shake=Math.max(game.shake,3);
        try{sfx.creak();noiseSfx(.3,.05,240,'lowpass');}catch(e){}
        SCHOOL.noise.t=.55;SCHOOL.noise.x=d.x;SCHOOL.noise.y=d.y;SCHOOL.noise.r=380;
        clampArena(player,player.r);
        return;
      }
      SCHOOL._door={d:d,t:0,area:SCHOOL.area};
      try{sfx.creak();noiseSfx(.4,.05,240,'lowpass');}catch(e){}
      SCHOOL.noise.t=.55;SCHOOL.noise.x=d.x;SCHOOL.noise.y=d.y;SCHOOL.noise.r=380;
      clampArena(player,player.r);
      return;
    }
  }
}
/* v0.9.13: visual da porta abrindo */
function drawDoorAnim(){
  if(!SCHOOL._door)return;
  const d=SCHOOL._door.d,k=clamp(SCHOOL._door.t/.42,0,1);
  ctx.save();
  ctx.strokeStyle='rgba(214,198,172,.75)';ctx.lineWidth=3;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(d.x,d.y,12+18*k,-Math.PI/2,-Math.PI/2+k*Math.PI*.96);ctx.stroke();
  ctx.restore();
}
/* ---- coletas automáticas (chave, fragmentos alcançáveis) ---- */
function schoolAuto(){
  const A=SCHOOL.area,p=SCHOOL.prog;
  if(A==='salaB12'&&!p.chave&&dist(player.x,player.y,700,300)<28){
    p.chave=true;progSave();
    msg('uma chave pequena e fria.',2.2);
    try{blip('sine',520,760,.25,.05);blip('sine',780,1040,.2,.035,.12);}catch(e){}
  }
}
function schoolFrags(){
  const A=SCHOOL.area,p=SCHOOL.prog;
  for(let i=0;i<FRAG_DEFS.length;i++){
    const f=FRAG_DEFS[i];
    if(f.area!==A||!fragAvailable(i))continue;
    if(dist(player.x,player.y,f.x,f.y)<28)pickupFragment(i);
  }
}
function pickupFragment(i){
  const p=SCHOOL.prog;
  p.frags[i]=true;progSave();
  try{blip('sine',600,860,.32,.05);blip('sine',300,210,.55,.04,.12);noiseSfx(.3,.02,500,'lowpass',.1);}catch(e){}
  const n=fragCount();
  /* v0.9.12: QUALQUER 1º fragmento ativa o caçador (antes só o da sala de aula) */
  if(n===1){
    /* v1.2.0: a PRIMEIRA aparição é uma ILUSÃO — translúcida, trepando.
       Alguns segundos depois ela se desfaz em estática... e a REAL nasce
       no pátio e caminha até você (startReveal). */
    if(!SCHOOL.hunt||!SCHOOL.hunt.state||SCHOOL.hunt.state==='none')SCHOOL.hunt=freshHunt();
    const hh=SCHOOL.hunt;
    hh.state='illusion';hh.area=SCHOOL.area;hh.ilT=0;
    hh.lure=null;hh.obs=null;hh.navTo=null;hh.pt=null;hh.rvStare=null;
    const AI=SCHOOL_AREAS[SCHOOL.area].coll[0];
    hh.x=clamp(player.x+(Math.random()<.5?-1:1)*rnd(150,230),AI.x+34,AI.x+AI.w-34);
    hh.y=clamp(player.y+(Math.random()<.5?-1:1)*rnd(110,180),AI.y+34,AI.y+AI.h-34);
    hh.ang=Math.atan2(player.y-hh.y,player.x-hh.x);hh.mv=false;
    cine([
      {txt:'um arrepio enorme se forma...',at:.7,dur:2.3},
      {txt:'você não está sozinho',at:3.2,dur:2.7},
      {txt:'...ainda.',at:5.6,dur:1.4}
    ],7.4,{at:3.2,fn:function(){
      try{noiseSfx(1.7,.05,180,'lowpass');blip('sine',46,27,2.1,.07);}catch(e){}
    }});
  }else if(n===7){
    p.mirrorReady=true;progSave();
    msg('falta uma.',2.4);
    try{blip('sine',220,140,.8,.04);}catch(e){}
  }else if(n===8){
    /* v0.9.12: o espelho fecha para sempre depois do final */
    p.mirrorReady=false;p.mirrorClosed=true;progSave();
    cine([{txt:'as partes estão completas.',at:.5,dur:2.9}],3.8,null);
    try{blip('sine',70,40,2.2,.06);}catch(e){}
    if(SCHOOL.hunt.state!=='chase'){
      /* v0.9.15: ela ATRAVESSOU para o mundo espelhado e CAMINHA até você */
      SCHOOL.hunt.state='search';SCHOOL.hunt.area='inv_corr';SCHOOL.hunt.searchRoom='inv_professores';
      SCHOOL.hunt.searchT=0;SCHOOL.hunt.tx=640;SCHOOL.hunt.ty=360;
      SCHOOL.hunt.navTo=null;SCHOOL.hunt.pt=null;
    }
  }else{
    msg('fragmento.',1.5);
  }
  /* v1.2.0: cada fragmento o deixa MAIS INSANO — do 3º em diante ele ouve o
     estalo do fragmento e corre para a sala: emboscada e surpresa constantes */
  if(n>=3&&SCHOOL.hunt&&SCHOOL.hunt.state&&SCHOOL.hunt.state!=='none'&&!SCHOOL.hunt.gone
     &&SCHOOL.hunt.state!=='illusion'&&SCHOOL.hunt.state!=='reveal'&&SCHOOL.hunt.state!=='finalchase'){
    const h3=SCHOOL.hunt;
    h3.state='search';h3.searchT=0;h3.searchRoom=SCHOOL.area;
    h3.tx=player.x;h3.ty=player.y;h3.burst=2.2;h3.navTo=null;h3.pt=null;
    if(n>=6)msg('ele está aprendendo. corra.',2.4);
    else if(n>=4)msg('algo passou CORRENDO pela escola.',2.4);
    else msg('algo correu pela escola.',2.2);
    try{noiseSfx(.5,.04,160,'lowpass');}catch(e){}
  }
}
/* v0.9.15→v1.2.0: nasce no PÁTIO e caminha até você — a REAL, desta vez */
function startReveal(){
  const hh=SCHOOL.hunt;
  hh.state='reveal';hh.area='patio';hh.rvT=0;hh.rvStare=null;hh.rvPause=0;hh.cool=10;
  hh.lure=null;hh.obs=null;hh.navTo=null;hh.pt=null;hh.ilT=0;hh.burst=0;
  hh.ambRoom=null;hh.ambPt=null;hh.ambT=0;
  const AP=SCHOOL_AREAS.patio.coll[0];
  hh.x=AP.x+AP.w*.5;hh.y=AP.y+AP.h*.5;hh.ang=Math.atan2(player.y-hh.y,player.x-hh.x);
}
/* ---- v0.9.13: LATIDO (ESPAÇO) — faz barulho e a criatura vem ao local exato ---- */
function schoolBark(){
  if(!SCHOOL.active||game.state!=='school')return;
  if(SCHOOL.cine||SCHOOL.mirrorCine||SCHOOL.sink||SCHOOL.ritual||SCHOOL.scare||SCHOOL.hide)return;
  const h=SCHOOL.hunt;
  /* v1.3.0 FIX DO LATIDO: o ESPAÇO estava MUDO antes da revelação (state
     'none') e depois que ela ia embora ('gone'/'illusion') — parecia bug.
     Agora o latido SEMPRE soa: som, partículas e mensagem. O ATRÁS-ELA
     só acontece se ela existe e pode ouvir (nunca com ilusões). */
  try{sfx.howl();noiseSfx(.5,.09,700,'bandpass');blip('square',420,90,.5,.12);}catch(e){}
  SCHOOL._bark={x:player.x,y:player.y,t:0};
  for(let i=0;i<3;i++)particles.push({x:player.x,y:player.y,vx:0,vy:0,life:.7+i*.2,t:0,r:10+i*7,c:'rgba(210,190,170,.35)',drag:1});
  if(h&&!h.gone&&h.state&&h.state!=='none'&&h.state!=='illusion'){
    h.lure={x:player.x,y:player.y,t:10,room:SCHOOL.area};
    /* v0.9.15: o latido atrai de QUALQUER sala — ela caminha até o local */
    if(h.state==='wander'||h.state==='investigate'){
      h.state='search';h.searchT=0;h.searchRoom=SCHOOL.area;h.tx=player.x;h.ty=player.y;h.invLook=0;
    }
    else if(h.state==='search'){h.searchRoom=SCHOOL.area;h.tx=player.x;h.ty=player.y;}
    msg('o latido ecoou. algo ouviu.',2.2);
  }else{
    msg('o latido ecoou. nada respondeu.',2.2);
  }
}
/* ---- interação (tecla Z / botão INTERAGIR) ---- */
const BOOK_GLYPHS=[2,0,3,1,4];     /* v1.2.0: CINCO livros — o enigma final cresceu */
/* v0.9.12: PUZZLES MAIS DIFÍCEIS — a ordem dos livros e as horas dos
   relógios SORTEADAS a cada entrada na escola (sem decoreba de wiki),
   e o 3º relógio mudou de sala: está no corredor de cima agora. */
let GLYPH_ORDER=[1,3,0,2,4];       /* ordem correta (o mural da entrada mostra isto) */
let CLOCK_HOURS=[4,9,2];
let CLOCK_ORDER=[0,1,2];           /* v1.2.0: os relógios exigem ORDEM (selos coloridos) */
const CLOCK_SPOTS=[{area:'salaA21',x:436,y:196},{area:'salaA21',x:640,y:196},{area:'corrA2',x:900,y:330}];
function randomizePuzzles(){
  GLYPH_ORDER=[0,1,2,3,4];
  for(let i=4;i>0;i--){const j=irnd(0,i);const t=GLYPH_ORDER[i];GLYPH_ORDER[i]=GLYPH_ORDER[j];GLYPH_ORDER[j]=t;}
  /* v1.2.0: a ordem dos relógios também é sorteada */
  CLOCK_ORDER=[0,1,2];
  for(let i=2;i>0;i--){const j=irnd(0,i);const t=CLOCK_ORDER[i];CLOCK_ORDER[i]=CLOCK_ORDER[j];CLOCK_ORDER[j]=t;}
  const hs=[];
  while(hs.length<3){const h=1+irnd(0,11);if(hs.indexOf(h)<0)hs.push(h);}
  CLOCK_HOURS=hs;
}
function schoolInteract(){
  if(!SCHOOL.active||player.dead||SCHOOL.cine||SCHOOL.mirrorCine||SCHOOL.sink||SCHOOL.ritual||SCHOOL.scare||SCHOOL.hide)return;
  const A=SCHOOL.area,p=SCHOOL.prog;
  const near=function(x,y,r){return dist(player.x,player.y,x,y)<(r||64);};
  if(A==='entrada'&&near(640,182)){
    SCHOOL.showGlyphs={t:4.2};
    msg('quatro sinais raspados na parede.',2.2);
    try{noiseSfx(.3,.02,1200,'bandpass');}catch(e){}
    return;
  }
  if(A==='salaA12'){
    for(let b=0;b<5;b++){
      const bx=452+b*62;
      if(near(bx,222,40)){
        const g=BOOK_GLYPHS[b];
        const exp=GLYPH_ORDER[p.books.length];
        if(g===exp){
          p.books.push(g);progSave();
          try{blip('sine',340+g*60,300+g*60,.2,.04);}catch(e){}
          if(p.books.length>=5){p.booksOk=true;progSave();msg('a estante inteira cede.',2.6);try{noiseSfx(.6,.05,220,'lowpass');sfx.creak();}catch(e){}}
        }else{
          if(p.books.length){msg('os livros voltam ao lugar sozinhos.',2.2);try{blip('sine',200,120,.4,.04);}catch(e){}}
          p.books=[];p.booksOk=false;progSave();
        }
        return;
      }
    }
  }
  if(A==='salaA13'){
    if(near(640,186,54)){mirrorInteract();return;}
    for(let v=0;v<p.valves.length;v++){
      if(!p.valves[v]&&near(432+v*46,222,34)){
        p.valves[v]=true;progSave();
        /* v1.2.0: girar registro faz BARULHO — a escola escuta */
        SCHOOL.noise.t=.5;SCHOOL.noise.x=432+v*46;SCHOOL.noise.y=222;SCHOOL.noise.r=300;
        try{blip('sine',260,180,.3,.04);noiseSfx(.4,.03,600,'lowpass');}catch(e){}
        if(p.valves.every(function(x){return x;}))try{noiseSfx(.7,.04,300,'lowpass',.3);}catch(e){}
        return;
      }
    }
  }
  /* v0.9.12: relógios espalhados (2 na sala de ciências + 1 no corredor de cima) */
  for(let c=0;c<CLOCK_SPOTS.length;c++){
    const cs=CLOCK_SPOTS[c];
    if(cs.area!==A||!near(cs.x,cs.y,42))continue;
    /* v1.2.0: os relógios exigem a ORDEM dos selos (marcada no compartimento) */
    if(!p.clocks[c]){
      const exp=CLOCK_ORDER[p.clockSeq||0];
      if(c===exp){
        p.clocks[c]=true;p.clockSeq=(p.clockSeq||0)+1;progSave();
        msg('parou às '+CLOCK_HOURS[c]+'. ('+(p.clockSeq)+'/3)',1.9);
        try{blip('sine',500,320,.18,.03);noiseSfx(.12,.02,4000,'highpass');}catch(e){}
      }else{
        p.clocks=[false,false,false];p.clockSeq=0;progSave();
        msg('os ponteiros giram de volta — a ordem dos selos era outra.',2.8);
        try{blip('sawtooth',200,90,.4,.08);}catch(e){}
      }
    }else{msg('parado.',1.2);}
    return;
  }
  /* v0.9.12: ARMÁRIOS — esconderijo. Se o caçador está ativo, esconder
     não salva: ele VIU onde você entrou. */
  for(const sp of HIDE_SPOTS){
    if(sp.area===A&&near(sp.x,sp.y,48)){tryHide(sp);return;}
  }
  if(A==='salaA22'&&near(640,186,50)){
    if(p.pad){msg('o compartimento já está aberto.',1.8);}
    else if(p.clocks[0]&&p.clocks[1]&&p.clocks[2]){
      p.pad=true;progSave();
      msg('os mostradores giram sozinhos: '+CLOCK_HOURS.join(' — ')+'.',3.2);
      try{blip('sine',400,600,.25,.05);noiseSfx(.5,.05,500,'lowpass',.2);sfx.creak();}catch(e){}
    }else{
      msg('três mostradores de números. não sei a combinação.',2.6);
      try{blip('sine',220,180,.25,.03);}catch(e){}
    }
    return;
  }
  if(A==='externo'&&!p.shed&&near(1010,566,52)){
    p.shed=true;progSave();
    msg('o abrigo abre.',1.6);
    try{sfx.creak();noiseSfx(.4,.04,320,'lowpass');}catch(e){}
    return;
  }
  if(A==='patio'&&near(640,360,66)){
    if(p.ritualDone){msg('o círculo já cumpriu o que veio fazer.',2.4);}
    else if(fragCount()>=8){startRitual();}
    else{msg('há marcas no chão. algo falta aqui.',2.4);try{blip('sine',150,110,.4,.03);}catch(e){}}
    return;
  }
  if(A.indexOf('inv_')===0&&near(640,360,120)&&!p.mirror&&A==='inv_patio'){
    /* nada — o espelho do pátio invertido é uma porta física */
  }
}
/* ---- espelho ---- */
function mirrorInteract(){
  const p=SCHOOL.prog;
  /* v0.9.12 FIX: depois do 8º fragmento o espelho FECHA — não dá mais
     pra entrar e sair da escola invertida à vontade */
  if(p.mirrorClosed){
    msg('o espelho não mostra mais nada.',2.6);
    try{blip('sine',170,140,.4,.02);}catch(e){}
    return;
  }
  /* v0.9.14: o mundo espelhado não abre de primeira — são necessárias 3
     interações [Z]. As duas primeiras o vidro range e cede (som, atraso,
     mensagem); na terceira ele finalmente deixa você atravessar. */
  /* v1.2.0: auto-reparo — com 7 fragmentos o espelho SEMPRE fica pronto */
  if(!p.mirrorReady&&fragCount()>=7){p.mirrorReady=true;progSave();}
  if(p.mirrorReady){
    /* v1.2.0: AGORA SÃO 6 TOQUES — o espelho resiste, sussurra e cede */
    p.mirrorTaps=(p.mirrorTaps||0)+1;progSave();
    if(p.mirrorTaps>=6){
      p.mirrorTaps=0;progSave();
      startMirrorEnter();
      return;
    }
    SCHOOL.mirrorFx.lag=Math.max(SCHOOL.mirrorFx.lag,8+p.mirrorTaps*4);
    const TAP=['o vidro range. seu reflexo não tremeu. (1/6)','a superfície ondula. uma vez a mais. (2/6)','atrás do vidro, algo respira devagar. (3/6)','o reflexo sorri quando você não sorri. (4/6)','sussurros — a sua própria voz, errada. (5/6)','falta uma só. algo do outro lado encostou no vidro.'][p.mirrorTaps-1];
    msg(TAP,2.9);
    try{blip('sine',210-p.mirrorTaps*8,140,.5,.05);noiseSfx(.4+p.mirrorTaps*.06,.03,700,'lowpass');sfx.creak();}catch(e){}
    if(p.mirrorTaps===5)try{noiseSfx(.9,.05,2400,'highpass');blip('sine',130,60,.9,.07);}catch(e){}
    return;
  }
  if(!p.mirrorSeen){
    p.mirrorSeen=true;progSave();
    SCHOOL.mirrorFx.lag=15;
    msg('seu reflexo demora um pouco a mais que você.',3);
    try{blip('sine',180,120,.6,.03);}catch(e){}
  }else if(Math.random()<.11){
    SCHOOL.mirrorFx.creepy=2.4;
    try{noiseSfx(.5,.04,2600,'highpass');blip('sine',120,58,.9,.05);}catch(e){}
  }else{
    try{blip('sine',240,205,.3,.02);}catch(e){}
  }
}
function startMirrorEnter(){
  SCHOOL.mirrorCine={t:0,mode:'in'};
  try{noiseSfx(1.2,.05,3000,'highpass');}catch(e){}
}
function startMirrorReturn(){
  SCHOOL.mirrorCine={t:0,mode:'out'};
  try{noiseSfx(1.2,.05,3000,'highpass');}catch(e){}
}
function updateMirrorCine(dt){
  const mc=SCHOOL.mirrorCine;mc.t+=dt;
  SCHOOL.fx.grain=1;
  if(mc.t>.4&&mc.t<2.1&&Math.random()<dt*10)try{blip('square',rnd(300,2000),rnd(60,400),.05,.04,rnd(.3));}catch(e){}
  if(mc.t>=2.1){
    SCHOOL.fx.grain=0;SCHOOL.mirrorCine=null;
    try{sfx.glitch();}catch(e){}
    if(mc.mode==='in'){
      SCHOOL.prog.mirror=true;progSave();
      enterArea('inv_patio',null,false);
      msg('a mesma escola. não exatamente.',3);
      if(!SCHOOL.prog.invScare1&&SCHOOL.hunt.state!=='none'){
        SCHOOL.prog.invScare1=true;progSave();
        SCHOOL.hunt.obs={area:'inv_corr',t:0,dur:0};
      }
      /* v1.2.0: VOCÊ MESMO entra em cena depois de alguns segundos */
      SCHOOL.youDelay=5+Math.random()*4;
    }else{
      enterArea('patio',null,false);
      despawnYou();/* v1.2.0: voltar dissolve o outro você */
    }
  }
}
/* ---- ritual ---- */
function startRitual(){
  SCHOOL.ritual={ph:'place',t:0,placed:0};
  SCHOOL.prog.ritualDone=false;progSave();
  const h=SCHOOL.hunt;
  /* v0.9.15: ela CAMINHA até o ponto de onde assiste ao ritual (sem tp) */
  if(h.state!=='none'&&!h.gone){h.state='watch';h.watchPt={x:250,y:190};h.navTo='patio';}
  try{noiseSfx(1.4,.04,140,'lowpass');}catch(e){}
}
function updateRitual(dt){
  const r=SCHOOL.ritual;r.t+=dt;
  /* v0.9.15: a criatura continua andando durante o ritual */
  if(SCHOOL.hunt&&SCHOOL.hunt.state==='watch')updateHunter(dt);
  if(r.ph==='place'){
    if(r.t>=r.placed*1.15+0.9){
      if(r.placed<8){
        r.placed++;
        try{blip('sine',90+r.placed*8,60,.5,.06);noiseSfx(.4,.03,240,'lowpass');}catch(e){}
        if(r.placed>=8){r.ph='wait';r.t=0;try{blip('sine',50,30,2.4,.08);}catch(e){}}
      }
    }
  }else if(r.ph==='wait'){
    if(r.t>=2.2){
      SCHOOL.ritual=null;
      /* v0.9.12 FIX: a água agora COMEÇA a subir (antes o nível ficava
         preso em 0 e a inundação nunca iniciava) */
      SCHOOL.flood={level:.015,t:0,ripple:0};
      msg('a água começou a subir.',3.2);
      try{noiseSfx(2,.06,120,'lowpass');blip('sine',40,24,3,.09);}catch(e){}
    }
  }
}
/* ---- inundação ---- */
function updateFlood(dt){
  const f=SCHOOL.flood;f.t+=dt;f.ripple+=dt;
  const prev=f.level;
  /* v1.2.0: a água sobe até dar rosto — e então a escola COMEÇA A QUEIMAR */
  f.level=clamp(f.level+dt/72,0,.35);
  if(f.level>=.345&&!SCHOOL.fire){startFire();return;}
  if(SCHOOL.hunt&&!SCHOOL.hunt.gone&&f.level>.7&&SCHOOL.hunt.state==='watch'){
    SCHOOL.hunt.gone=true;
    try{noiseSfx(1,.03,200,'lowpass');}catch(e){}
  }
  if(Math.random()<dt*1.4){
    particles.push({x:rnd(W*.15,W*.85),y:rnd(H*.2,H*.8),vx:0,vy:0,life:rnd(.6,1.2),t:0,r:rnd(3,9),c:'rgba(150,190,200,0.12)',drag:1});
  }
  if(prev<1&&f.level>=1){
    msg('o centro ficou fundo demais.',3);
    try{blip('sine',36,20,3,.09);}catch(e){}
  }
  /* o abismo: entrar no centro quando cheio */
  if(f.level>=.999&&dist(player.x,player.y,640,360)<62){
    SCHOOL.sink={t:0};
    try{noiseSfx(2.4,.07,160,'lowpass');blip('sine',44,22,3.4,.1);}catch(e){}
  }
}
function updateSink(dt){
  const s=SCHOOL.sink;s.t+=dt;
  if(s.t>2.2&&Math.random()<dt*3){
    particles.push({x:rnd(W*.3,W*.7),y:rnd(H*.3,H*.7),vx:rnd(-8,8),vy:rnd(-30,-8),life:rnd(1,2),t:0,r:rnd(1.5,3.5),c:'rgba(140,180,190,0.16)',drag:.99,glow:true});
  }
  if(s.t>4.6&&!s.snd2){s.snd2=true;try{noiseSfx(3,.05,110,'lowpass');blip('sine',60,26,3,.06,.4);}catch(e){}}
  if(s.t>=7.4)finishSchool();
}
function finishSchool(){
  SCHOOL.prog.ritualDone=true;SCHOOL.prog.flooded=true;
  SCHOOL.prog.mirrorReady=false;SCHOOL.prog.mirrorClosed=true; /* v0.9.12: espelho fecha no fim */
  progSave();
  const wasFromRun=SCHOOL.fromRun;
  SCHOOL.fromRun=false;
  schoolLeave();
  clearContinue();
  META.school=SOTA();saveMeta();
  META.schoolDone=true;saveMeta();/* v0.9.13: conquista RECREIO TERMINADO */
  if(typeof grantConq==='function')grantConq('escola');
  try{sfx.echo();}catch(e){}
  if(wasFromRun){
    /* v0.9.13: se Thor chegou aqui pela POÇA (fim do Limbo), a escola É o
    final — vence o jogo aqui em vez de descer mais um andar */
    if(game.postLimboSchool){
      game.postLimboSchool=false;
      game.schoolDone=true;
      game.state='play';
      META.wins++;saveMeta();
      if(typeof conqTick==='function')conqTick();
      game.state='won';
      setStat('stKillW',game.kills);setStat('stEmbW',game.souls);setStat('stHpW',player.hp);
      const wt2=ov('winTitle');if(wt2)wt2.textContent='VOCÊ AFUNDOU';
      const we2=ov('winEyebrow');if(we2)we2.textContent='A ESCOLA VAZIA';
      const ws2=ov('winSub');if(ws2)ws2.textContent='a poça te levou à escola — e a escola te deixou sair. por enquanto.';
      showOv('win');try{sfx.win();sfx.echo();}catch(e){}
      return;
    }
    /* v0.9.9: a escola ERA o 4º andar — a descida segue para a 5ª (o guardião) */
    game.schoolDone=true;
    game.state='play'; /* a escola podia ter sido encerrada ainda na intro */
    nextFloor();
    return;
  }
  startCaronteEncounter();
}
function SOTA(){try{return JSON.parse(JSON.stringify(META.school||{}));}catch(e){return META.school||{};}}
/* sair da fase — restaura o que foi emprestado */
function schoolLeave(){
  if(SCHOOL._spdBase>0){P.speedMult=SCHOOL._spdBase;SCHOOL._spdBase=0;}
  restoreWeapons();/* v0.9.13: devolve as armas que a escola tirou */
  SCHOOL.active=false;window.__SCHOOL_ACTIVE=false;
  SCHOOL.hunt={state:'none'};
  SCHOOL.cine=null;SCHOOL.mirrorCine=null;SCHOOL.sink=null;SCHOOL.ritual=null;
  SCHOOL.hide=null;SCHOOL.scare=null; /* v1.2.1: nunca deixar esconderijo zumbi (soft lock) */
  SCHOOL._lastDoor=null;SCHOOL._cd=0; /* v1.2.3: limpa anti-pêndulo */
}
/* morte dentro da escola */
function schoolDie(reason){
  const found=reason==='hunter'&&Math.random()<.62;
  /* v1.2.0: títulos de morte do ato final */
  if(reason==='fogo')SCHOOL._customDeath='AS CHAMAS TE ACHARAM';
  else if(reason==='yourself')SCHOOL._customDeath='VOCÊ MESMO';
  else SCHOOL._customDeath=found?'VOCÊ FOI ENCONTRADO':null;
  game.deadTaunt=found?'ele te achou.':'...';
  window.__DIED_IN_SCHOOL=true; /* v1.3.0: TENTAR NOVAMENTE revive na escola */
  schoolLeave();
  clearContinue();
  META.deaths++;saveMeta();
  player.hp=0;player.dead=true;game.state='dead';game.deadT=0;game.overlayShown=false;
  try{sfx.die();noiseSfx(.8,.06,300,'lowpass');}catch(e){}
}

/* ============================================================
   O CAÇADOR — cervo de caveira, manto preto, ossos por dentro
   Nunca tem nome. Nunca vira boss comum. O jogador foge.
   v0.9.15 — PERSEGUIDOR DE VERDADE: nada de teleporte. Ele
   CAMINHA de sala em sala (atravessando portas), VAGA
   aleatoriamente pela escola e ESCUTA barulhos (passos, portas,
   latido) para ir investigar. Sempre nasce no PÁTIO.
   ============================================================ */
function freshHunt(){
  return{state:'none',area:null,x:0,y:0,tx:0,ty:0,t:0,cool:10,visT:0,navT:0,losT:0,
    searchT:0,spd:0,gone:false,beat:0,step:0,obs:null,lure:null,memory:null,
    navTo:null,pt:null,pauseT:0,lookDir:1,searchRoom:null,invRoom:null,invT:0,invLook:0,watchPt:null,
    /* v1.2.0: insanidade — ilusão, emboscada e rajada de velocidade */
    ilT:0,burst:0,ambushCd:0,ambRoom:null,ambPt:null,ambT:0};
}
/* o caçador não usa espelho nem portas trancadas */
function doorUsable(d,fromArea){
  if(!d)return false;
  if(d.kind==='espelho')return false;
  if(d.locked)return (SCHOOL.prog.unlocked||[]).indexOf(fromArea+'#'+d.x+','+d.y)>=0;
  return true;
}
function roomOpen(id){
  for(const nid in SCHOOL_AREAS)for(const d of SCHOOL_AREAS[nid].doors){
    if(d.to!==id)continue;
    if(d.locked&&(SCHOOL.prog.unlocked||[]).indexOf(nid+'#'+d.x+','+d.y)<0)return false;
  }
  return true;
}
/* v0.9.15: nasce SEMPRE no PÁTIO — o coração da escola */
function spawnHunter(){
  const h=SCHOOL.hunt;
  h.state='wander';h.area='patio';h.gone=false;h.cool=0;
  const A=SCHOOL_AREAS.patio.coll[0];
  h.x=A.x+A.w*.5;h.y=A.y+A.h*.5;h.ang=Math.PI/2;
  h.navTo=null;h.pt=null;h.pauseT=0;h.lure=null;h.obs=null;
  pickWanderTarget();
}
function pickWanderTarget(){
  const h=SCHOOL.hunt;
  const inv=h.area.indexOf('inv_')===0;
  const opts=Object.keys(SCHOOL_AREAS).filter(function(id){
    if(inv)return id.indexOf('inv_')===0&&roomOpen(id);
    return id.indexOf('inv_')<0&&roomOpen(id);
  }).filter(function(id){return id!==h.area;});
  h.navTo=opts.length?pick(opts):null;
  h.pt=null;
}
/* atravessa a porta: aparece do OUTRO lado, na porta espelhada — sem salto */
function crossRoom(nextId){
  const h=SCHOOL.hunt,prev=h.area;
  if(!SCHOOL_AREAS[nextId]){h.area='patio';return;}
  const back=SCHOOL_AREAS[nextId].doors.find(function(dd){return dd.to===prev;});
  const off={n:[0,26],s:[0,-26],e:[-26,0],w:[26,0]}[back?back.side:'w']||[0,0];
  h.area=nextId;h.pt=null;h.mv=true;
  if(back){h.x=back.x+off[0];h.y=back.y+off[1];}
  clampHunter();
  if(window.__EXPANSION)window.__EXPANSION.hunterDoorCross(prev,nextId); /* v1.3.0: cutscene curta da coisa de cervo */
  if(h.state!=='chase'&&(nextId===SCHOOL.area||adjacent(nextId,SCHOOL.area))&&Math.random()<.5)hunterSound();
}
function clampHunter(){
  const h=SCHOOL.hunt,A=SCHOOL_AREAS[h.area].coll[0];
  h.x=clamp(h.x,A.x+12,A.x+A.w-12);
  h.y=clamp(h.y,A.y+12,A.y+A.h-12);
}
/* próxima porta no caminho até toId (respeita espelho/trancadas) */
function hunterNextDoor(toId){
  const h=SCHOOL.hunt;
  const path=schoolBFS(h.area,toId);
  if(path.length<2)return null;
  const next=path[1];
  const d=SCHOOL_AREAS[h.area].doors.find(function(dd){return dd.to===next;});
  if(!d||!doorUsable(d,h.area))return null;
  return{door:d,next:next};
}
/* v0.9.15: caminha até a porta e ATRAVESSA. As portas ficam NA PAREDE
   (fora da área andável) — ao encostar na borda já é hora de cruzar */
function hunterTraverse(nv,spd,dt){
  const h=SCHOOL.hunt;
  moveHunterTowards(nv.door.x,nv.door.y,spd,dt);
  if(dist(h.x,h.y,nv.door.x,nv.door.y)<32)crossRoom(nv.next);
}
function adjacent(a,b){return (SCHOOL_ADJ[a]||[]).indexOf(b)>=0;}
function hunterSound(){
  try{
    if(Math.random()<.5)noiseSfx(.09,.02,140,'lowpass');
    else blip('sine',120,85,.22,.016);
  }catch(e){}
}
function moveHunterTowards(tx,ty,spd,dt){
  const h=SCHOOL.hunt;
  const dx=tx-h.x,dy=ty-h.y,l=Math.hypot(dx,dy);
  if(l>2){h.x+=dx/l*spd*dt;h.y+=dy/l*spd*dt;h.mv=true;
    /* v0.9.13: a criatura tem DIREÇÃO — a visão dela é um CONE */
    const ta=Math.atan2(dy,dx);
    let da=ta-(h.ang===undefined?ta:h.ang);
    while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;
    h.ang=(h.ang===undefined?ta:h.ang)+da*Math.min(1,dt*6);
  }else h.mv=false;
  /* v0.9.15: limita pela SALA DO CAÇADOR (ele anda em salas onde você não está) */
  clampHunter();
}
/* v0.9.15: visão (cone ±76°) — usada por wander/investigate/search */
function hunterSees(){
  const h=SCHOOL.hunt;
  if(h.area!==SCHOOL.area)return false;
  if(SCHOOL.hide)return false; /* v1.2.1: dentro do armário ele não te enxerga */
  const detect=SCHOOL.area.indexOf('inv_')===0?540:430;
  const dS=dist(player.x,player.y,h.x,h.y);
  if(dS<95)return true;
  if(dS>=detect)return false;
  let da=Math.atan2(player.y-h.y,player.x-h.x)-(h.ang===undefined?Math.PI/2:h.ang);
  while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;
  return Math.abs(da)<1.32;
}
/* v0.9.15: AUDIÇÃO — passos (200) só na sala; portas (380) e corrida
   (430) atravessam paredes; SHIFT (85) é quase inaudível até do lado */
function hunterHears(){
  const h=SCHOOL.hunt,n=SCHOOL.noise;
  if(!(n.t>.22&&n.r>0))return null;
  const steps=schoolBFS(h.area,SCHOOL.area).length-1;
  /* v1.2.0: com cada fragmento ele OUVE mais longe (paredes vêm abaixo) */
  const mad=fragCount();
  let heard=false;
  if(steps===0)heard=n.r>=90;
  else if(steps===1)heard=n.r>=Math.max(240,300-mad*12);
  else if(steps===2)heard=n.r>=Math.max(330,420-mad*18);
  if(!heard)return null;
  return{room:SCHOOL.area,x:n.x,y:n.y};
}
/* v0.9.15: caminhada aleatória — porta a porta até h.navTo; chegando,
   fuça pontos da sala, para de vez em quando pra "escutar" */
function hunterWalk(dt,spd){
  const h=SCHOOL.hunt;
  if(h.pauseT>0){
    h.pauseT-=dt;h.mv=false;
    h.ang=(h.ang||0)+dt*.8*(h.lookDir||1);
    return;
  }
  let gx=null,gy=null,doorRef=null;
  if(h.navTo&&h.navTo!==h.area){
    const nv=hunterNextDoor(h.navTo);
    if(nv){gx=nv.door.x;gy=nv.door.y;doorRef=nv;}
    else h.navTo=null;
  }
  if(gx===null){
    if(!h.pt){
      const A=SCHOOL_AREAS[h.area].coll[0];
      h.pt={x:A.x+A.w*rnd(.12,.88),y:A.y+A.h*rnd(.12,.88)};
    }
    gx=h.pt.x;gy=h.pt.y;
  }
  moveHunterTowards(gx,gy,spd,dt);
  if(dist(h.x,h.y,gx,gy)<(doorRef?32:10)){ /* portas ficam na parede: limiar maior */
    if(doorRef){
      crossRoom(doorRef.next);
      if(Math.random()<.35){h.pauseT=.6+rnd()*1.1;h.lookDir=Math.random()<.5?-1:1;}
    }else{
      h.pt=null;
      if(Math.random()<.5)pickWanderTarget(); /* segue pra outra sala */
      if(Math.random()<.4){h.pauseT=.7+rnd()*1.3;h.lookDir=Math.random()<.5?-1:1;}
    }
  }
}
function startChase(){
  const h=SCHOOL.hunt;
  if(h.state==='chase')return;
  h.state='chase';h.losT=0;h.followT=0;h.lastArea=SCHOOL.area;
  try{sfx.growl();noiseSfx(.7,.06,320,'lowpass');blip('sine',64,30,1.1,.11);}catch(e){}
  game.shake=Math.max(game.shake,7);SCHOOL.fx.grain=1;
}
window.SCHOOL_updateHunter=updateHunter;
function updateHunter(dt){
  const h=SCHOOL.hunt;
  if(!h||!h.state||h.state==='none'||h.gone)return;
  /* v1.2.1: na aproximação/abertura do armário, quem move o cervo é o doom */
  if(SCHOOL.hide&&(SCHOOL.hide.phase==='approach'||SCHOOL.hide.phase==='open'))return;
  /* v1.2.0: INSANIDADE — cada fragmento o torna mais rápido, mais atento */
  const mad=fragCount();
  if(h.ambushCd>0)h.ambushCd-=dt;
  if(h.burst>0)h.burst-=dt;
  const bmul=h.burst>0?1.32:1;
  const inv=SCHOOL.area.indexOf('inv_')===0;
  const detect=(inv?540:430)+mad*14;
  const chaseSpd=(inv?268:255)+Math.min(22,mad*3); /* v1.9.0: um pouco mais lenta que Thor (285) — o terror agora vem da caça, não da velocidade bruta */
  if(h.lure){h.lure.t-=dt;if(h.lure.t<=0)h.lure=null;}
  /* aparição scripted (fim de corredor, reflexo, "já estava lá") */
  if(h.obs){
    h.obs.t+=dt;
    if(h.obs.area===SCHOOL.area){
      const A=SCHOOL_AREAS[h.obs.area].coll[0];
      if(h.obs.x===undefined){h.obs.x=A.x+A.w*.84;h.obs.y=A.y+A.h*.5;}
      h.x=h.obs.x;h.y=h.obs.y;
      if(dist(player.x,player.y,h.x,h.y)<225||h.obs.t>4.6){
        h.obs=null;
        try{noiseSfx(.28,.05,2800,'highpass');}catch(e){}
      }
    }else if(h.obs.t>6)h.obs=null;
  }
  switch(h.state){
    case 'wander':{
      /* v0.9.15: VAGA pela escola e ESCUTA. Barulho (passos, porta,
         latido) → vai investigar o local. Te viu no cone → persegue. */
      const heard=hunterHears();
      if(heard){
        h.state='investigate';h.invT=0;h.invLook=0;
        h.invRoom=heard.room;h.tx=heard.x;h.ty=heard.y;h.navTo=heard.room;h.pt=null;
        break;
      }
      if(hunterSees()){startChase();break;}
      hunterWalk(dt,118+mad*8);
      if(adjacent(h.area,SCHOOL.area)&&Math.random()<dt*.35)hunterSound();
      /* v1.2.0: EMBOSCADA — do 3º fragmento ele some no silêncio e espera
         atrás da porta da sala em que você vai entrar */
      if(mad>=3&&h.ambushCd<=0&&SCHOOL.area.indexOf('inv_')<0&&Math.random()<dt*.028*(mad-2)){
        let target=SCHOOL.area!==h.area?SCHOOL.area:null;
        if(!target){
          const adjs=(SCHOOL_ADJ[h.area]||[]).filter(function(id){return id.indexOf('inv_')<0&&roomOpen(id);});
          if(adjs.length)target=pick(adjs);
        }
        if(target){h.state='ambush';h.ambRoom=target;h.ambPt=null;h.ambT=0;break;}
      }
      break;
    }
    case 'investigate':{
      /* v0.9.15: foi ATRÁS do barulho — caminha até a sala e ao ponto exato */
      h.invT+=dt;
      if(h.invT>24){h.state='wander';pickWanderTarget();h.invLook=0;break;}
      const heard=hunterHears();
      if(heard){h.invRoom=heard.room;h.tx=heard.x;h.ty=heard.y;}
      if(hunterSees()){startChase();break;}
      if(h.invRoom&&h.area!==h.invRoom){
        const nv=hunterNextDoor(h.invRoom);
        if(nv)hunterTraverse(nv,158+mad*6,dt);
        else{h.state='wander';pickWanderTarget();h.invLook=0;}
      }else{
        if(h.invLook>0){
          h.invLook-=dt;h.mv=false;
          h.ang=(h.ang||0)+dt*1.1*(h.lookDir||1);
          if(h.invLook<=0){h.state='wander';pickWanderTarget();break;}
        }else if(!h.tx||dist(h.x,h.y,h.tx,h.ty)<16){
          h.invLook=2.4;h.lookDir=Math.random()<.5?-1:1;h.mv=false;
          if(Math.random()<.3)hunterSound();
        }else moveHunterTowards(h.tx,h.ty,158+mad*6,dt);
      }
      if(Math.random()<dt*.3)hunterSound();
      break;
    }
    case 'search':{
      h.searchT+=dt;
      SCHOOL.fx.grain=0;
      if(h.searchT>16){h.state='wander';pickWanderTarget();break;}
      if(hunterSees()){startChase();break;}
      /* o latido (ou um barulho) marca o ponto EXATO onde ela vai */
      if(h.lure){if(h.lure.room)h.searchRoom=h.lure.room;h.tx=h.lure.x;h.ty=h.lure.y;}
      else if(h.area===h.searchRoom&&SCHOOL.noise.t>.2&&SCHOOL.noise.r>0){h.tx=SCHOOL.noise.x;h.ty=SCHOOL.noise.y;}
      if(h.searchRoom&&h.area!==h.searchRoom){
        const nv=hunterNextDoor(h.searchRoom);
        if(nv)hunterTraverse(nv,168+mad*6,dt);
        else{h.state='wander';pickWanderTarget();}
      }else{
        if(!h.tx||dist(h.x,h.y,h.tx,h.ty)<34){
          const A=SCHOOL_AREAS[h.area].coll[0];
          h.tx=A.x+A.w*rnd(.15,.85);h.ty=A.y+A.h*rnd(.15,.85);
        }
        moveHunterTowards(h.tx,h.ty,168+mad*6,dt);
        if(Math.random()<dt*.5)hunterSound();
      }
      break;
    }
    /* v1.2.0: EMBOCADA — anda em silêncio até a sala, encara a porta e
       SALTAR em perseguição com rajada de velocidade quando você entrar */
    case 'ambush':{
      h.ambT+=dt;
      if(h.ambT>34){h.state='wander';pickWanderTarget();h.ambushCd=30;break;}
      if(h.area!==h.ambRoom){
        const nv=hunterNextDoor(h.ambRoom);
        if(nv)hunterTraverse(nv,150+mad*7,dt);
        else{h.state='wander';pickWanderTarget();h.ambushCd=26;break;}
      }else{
        if(!h.ambPt){
          const AA=SCHOOL_AREAS[h.ambRoom].coll[0];
          h.ambPt={x:AA.x+AA.w*.5,y:AA.y+AA.h*.5};
        }
        moveHunterTowards(h.ambPt.x,h.ambPt.y,150+mad*7,dt);
        if(dist(h.x,h.y,h.ambPt.x,h.ambPt.y)<12){
          h.mv=false;
          const dd=SCHOOL_AREAS[h.ambRoom].doors.find(function(d2){return d2.to===SCHOOL.area;})||SCHOOL_AREAS[h.ambRoom].doors[0];
          if(dd)h.ang=Math.atan2(dd.y-h.y,dd.x-h.x);
          if(SCHOOL.area===h.ambRoom&&dist(player.x,player.y,h.x,h.y)<250){
            h.burst=2.6;startChase();h.ambushCd=34;
          }
        }
      }
      break;
    }
    /* v1.2.0: ILUSÃO — translúcida e trêmula; se desfaz em estática e
       a real caminha do pátio até você */
    case 'illusion':{
      h.ilT+=dt;h.mv=false;
      h.ang=Math.atan2(player.y-h.y,player.x-h.x);
      if(h.ilT>3.8){
        try{noiseSfx(.55,.05,2800,'highpass');blip('square',900,80,.4,.1);}catch(e){}
        SCHOOL.fx.grain=1;
        startReveal();
      }
      break;
    }
    /* v1.2.0: A FUGA FINAL — ele SABE onde você está e corre na sua
       velocidade. Não perde o rastro. Não cansa. */
    case 'finalchase':{
      const pSpd=285*(P.speedMult||1)*(SCHOOL.flood.level>0?(1-.42*SCHOOL.flood.level):1);
      const spd=Math.max(120,pSpd)*.965;
      if(h.area!==SCHOOL.area){
        const nv=hunterNextDoor(SCHOOL.area);
        if(nv)hunterTraverse(nv,spd,dt);
        else{
          /* porta trancada no caminho: ARROMBA (ignora a trava) */
          let broke=false;
          const path=schoolBFS(h.area,SCHOOL.area);
          if(path.length>=2){
            const dd=SCHOOL_AREAS[h.area].doors.find(function(d2){return d2.to===path[1];});
            if(dd){
              moveHunterTowards(dd.x,dd.y,spd,dt);
              if(dist(h.x,h.y,dd.x,dd.y)<32){
                crossRoom(path[1]);
                if(dd.locked&&SCHOOL.prog.unlocked)SCHOOL.prog.unlocked.push(h.area+'#'+dd.x+','+dd.y);
              }
              broke=true;
            }
          }
          if(!broke){h.x+=rnd(-40,40);h.y+=rnd(-40,40);clampHunter();}
        }
        if(Math.random()<dt*1.1)hunterSound();
      }else{
        moveHunterTowards(player.x,player.y,spd,dt);
        /* v1.2.1: escondido, o toque não mata — o doom do esconderijo cuida */
        if(dist(player.x,player.y,h.x,h.y)<30&&!SCHOOL.hide){
          startScare(SCHOOL.area.indexOf('inv_')===0?'rosto':'cervo-caveira',function(){schoolDie('hunter');});
          return;
        }
        if(Math.random()<dt*1.4)hunterSound();
      }
      break;
    }
    case 'chase':{
      if(h.area!==SCHOOL.area){
        /* v0.9.15: perseguição SEM tp — ela CORRE até você de porta em porta */
        h.lastArea=SCHOOL.area;
        const nv=hunterNextDoor(SCHOOL.area);
        if(nv)hunterTraverse(nv,chaseSpd,dt);
        else{
          /* perdeu o rastro (espelho / porta trancada) */
          h.state='search';h.searchT=0;h.searchRoom=h.lastArea||h.area;
          h.tx=h.x;h.ty=h.y;
          try{noiseSfx(.5,.03,180,'lowpass');}catch(e){}
          break;
        }
        h.losT+=dt*.45; /* longe, segue pelo som dos seus passos */
        if(Math.random()<dt*.9)hunterSound();
      }else{
        h.lastArea=SCHOOL.area;
        moveHunterTowards(player.x,player.y,chaseSpd,dt);
        const d=dist(player.x,player.y,h.x,h.y);
        /* v1.2.1: escondido, o toque não mata — o doom do esconderijo cuida */
        if(d<30&&!SCHOOL.hide){
          /* v0.9.12: morte com SUSTO — a criatura na tela inteira antes do fim */
          startScare(inv?'rosto':'cervo-caveira',function(){schoolDie('hunter');});
          return;
        }
        if(d<detect)h.losT=0;else h.losT+=dt;
        if(Math.random()<dt*1.2)hunterSound();
      }
      if(h.losT>4.2){
        h.state='search';h.searchT=0;h.searchRoom=SCHOOL.area;h.tx=player.x;h.ty=player.y;
        SCHOOL.fx.grain=0;
        try{noiseSfx(.8,.03,220,'lowpass');}catch(e){}
      }
      break;
    }
    case 'reveal':{
      /* v0.9.15: no 1º fragmento ela vem ATÉ VOCÊ — mas nascendo no PÁTIO
      e atravessando a escola de porta em porta. Encara de perto e depois
      sai andando (não mata durante a apresentação, não some). */
      h.rvT=(h.rvT||0)+dt;
      if(h.area!==SCHOOL.area){
        const nv=hunterNextDoor(SCHOOL.area);
        if(nv)hunterTraverse(nv,205,dt);
        else{h.state='wander';pickWanderTarget();break;}
        if(Math.random()<dt*.9)hunterSound();
      }else if(!h.rvStare){
        const dR=dist(player.x,player.y,h.x,h.y);
        if(dR>150){
          moveHunterTowards(player.x,player.y,205,dt);
          if(Math.random()<dt*1.4)hunterSound();
        }else{
          h.rvStare=.9;h.mv=false;
        }
      }else{
        h.rvStare-=dt;h.mv=false;
        h.ang=Math.atan2(player.y-h.y,player.x-h.x);
        if(h.rvStare<=0){
          /* vira e SAI ANDANDO pela porta mais próxima — sem sumir */
          let bestD=null,bd=1e9;
          for(const d of SCHOOL_AREAS[h.area].doors){
            if(!doorUsable(d,h.area))continue;
            const dd=dist(h.x,h.y,d.x,d.y);
            if(dd<bd){bd=dd;bestD=d;}
          }
          h.rvStare=null;h.rvPause=0;
          try{noiseSfx(.5,.04,200,'lowpass');}catch(e){}
          if(bestD){h.state='wander';h.navTo=bestD.to;h.pt=null;}
          else{h.state='wander';pickWanderTarget();}
        }
      }
      if(h.rvT>45){h.state='wander';pickWanderTarget();h.rvStare=null;}
      break;
    }
    case 'watch':{
      /* v0.9.15: no ritual ela CAMINHA até o ponto de onde assiste */
      if(!h.watchPt)break;
      if(h.area!=='patio'){
        const nv=hunterNextDoor('patio');
        if(nv)hunterTraverse(nv,120,dt);
        else h.gone=true;
      }else{
        if(dist(h.x,h.y,h.watchPt.x,h.watchPt.y)>8)moveHunterTowards(h.watchPt.x,h.watchPt.y,120,dt);
        else h.mv=false;
      }
      break;
    }
  }
}
/* ============================================================
   v1.2.0 — O ATO FINAL: a escola ALAGA, PEGA FOGO e você FUGE.
   O RITUAL alaga até dar rosto; então tudo começa a queimar e o
   cervo persegue NA SUA VELOCIDADE. A porta da entrada se abre —
   corra, ou a escola te guarda para sempre.
   ============================================================ */
function startFire(){
  SCHOOL.fire={active:true,level:.02,t:0,escape:true};
  SCHOOL.flood={level:.35,t:SCHOOL.flood.t||0,ripple:SCHOOL.flood.ripple||0};
  msg('a água parou. o cheiro de queimado cresce.',3.4);
  try{noiseSfx(2.2,.05,2400,'highpass');blip('sine',70,38,2.4,.08);}catch(e){}
  game.banner={type:'small',txt:'FUJA DA ESCOLA',sub:'tudo vai pegar fogo — a porta da entrada se abriu',t:0,dur:4.2};
  const h=SCHOOL.hunt;
  if(h&&!h.gone&&h.state!=='none'&&h.state!=='illusion'){h.state='finalchase';h.navTo=null;h.pt=null;h.losT=0;}
  despawnYou();
  try{sfx.growl();}catch(e){}
}
function updateFire(dt){
  const f2=SCHOOL.fire;if(!f2)return;
  f2.t+=dt;
  f2.level=clamp(f2.level+dt/95,0,1);
  /* o calor: a escola inteira queima — ficar parado custa a vida */
  if(f2.level>.05){
    const dmg=(2.2+f2.level*7)*dt*(f2.level>.5?1.6:1);
    if(player.inv<=0)player.hp-=dmg;
    if(Math.random()<dt*3)particles.push({x:player.x+rnd(-14,14),y:player.y+rnd(-10,10),vx:rnd(-6,6),vy:rnd(-40,-14),life:rnd(.4,.9),t:0,r:rnd(1.5,3.5),c:'rgba(255,143,61,.5)',drag:.98,glow:true});
    if(player.hp<=0&&!player.dead){schoolDie('fogo');return;}
  }
  /* chamas brotando pela sala visível */
  if(Math.random()<dt*(8+f2.level*30)){
    const A=SCHOOL_AREAS[SCHOOL.area].coll[0];
    particles.push({x:A.x+A.w*Math.random(),y:A.y+A.h*Math.random(),vx:rnd(-4,4),vy:rnd(-46,-16),life:rnd(.6,1.4),t:0,r:rnd(2,5),c:Math.random()<.5?'rgba(255,143,61,.55)':'rgba(217,70,90,.4)',drag:.985,glow:true});
  }
}
/* a PORTA DA FUGA — parede oeste da entrada, acesa durante o incêndio */
function drawEscapeDoor(){
  const pul=.6+.4*Math.sin(game.t*4);
  ctx.save();
  ctx.globalAlpha=.75+.25*pul;
  const g=ctx.createRadialGradient(410,360,6,410,360,64);
  g.addColorStop(0,'rgba(255,220,150,.5)');g.addColorStop(1,'rgba(255,143,61,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(410,360,64,0,TAU);ctx.fill();
  ctx.globalAlpha=1;
  ctx.fillStyle='#ffdf9e';ctx.fillRect(402,318,7,84);
  ctx.globalAlpha=.9;
  txt('FUJA',428,352,MONO,12,'#ffdf9e','center',3);
  txt('[entre pela luz]',428,372,MONO,8,'rgba(255,223,158,.7)','center',2);
  ctx.restore();
}
/* vitória: recompensas únicas + cinemática + tela especial → menu */
function startEscapeWin(){
  if(SCHOOL.escape)return;
  SCHOOL.fire=null;
  SCHOOL.escape={t:0,ended:false};
  /* recompensas: conquistas + bênção/pacto/item únicos liberados */
  META.schoolChamas=true;META.schoolDone=true;saveMeta();
  if(typeof grantConq==='function'){grantConq('escolafogo');grantConq('escola');}
  if(typeof conqTick==='function')conqTick();
  SCHOOL.prog.ritualDone=true;SCHOOL.prog.flooded=true;progSave();
  try{sfx.win();sfx.echo();}catch(e){}
}
function updateEscape(dt){
  const e2=SCHOOL.escape;e2.t+=dt;
  if(Math.random()<dt*14)particles.push({x:rnd(0,W),y:rnd(0,H),vx:rnd(-8,8),vy:rnd(-60,-20),life:rnd(.5,1.4),t:0,r:rnd(1.5,4),c:'rgba(255,143,61,.5)',drag:.985,glow:true});
  if(e2.t>5&&!e2.ended){e2.ended=true;}
}
function exitVictory(){
  SCHOOL.escape=null;SCHOOL.fire=null;
  SCHOOL.flood={level:0,t:0,ripple:0};
  SCHOOL.fromRun=false;
  schoolLeave();
  clearContinue();
  META.school=SOTA();saveMeta();
  game.state='menu';showOv('menu');
  try{refreshMenu();}catch(e){}
  try{if(typeof refreshMenuDev==='function')refreshMenuDev();}catch(e){}
  try{sfx.echo();}catch(e){}
}
function drawEscape(){
  const e2=SCHOOL.escape,t=e2.t;
  const a=clamp(t/.9,0,1);
  /* fundo: a escola em chamas, vista de fora */
  ctx.fillStyle='#050203';ctx.fillRect(0,0,W,H);
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#1a0a08');sky.addColorStop(.55,'#3a120a');sky.addColorStop(1,'#0a0405');
  ctx.globalAlpha=a;ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  /* silhueta da escola queimando */
  ctx.fillStyle='#0c0507';
  ctx.beginPath();
  ctx.moveTo(W*.16,H*.78);ctx.lineTo(W*.16,H*.44);ctx.lineTo(W*.30,H*.44);ctx.lineTo(W*.30,H*.34);
  ctx.lineTo(W*.44,H*.34);ctx.lineTo(W*.44,H*.5);ctx.lineTo(W*.56,H*.5);ctx.lineTo(W*.56,H*.30);
  ctx.lineTo(W*.74,H*.30);ctx.lineTo(W*.74,H*.52);ctx.lineTo(W*.86,H*.52);ctx.lineTo(W*.86,H*.78);
  ctx.closePath();ctx.fill();
  /* janelas em chamas */
  for(let i=0;i<6;i++){
    const wx=W*(.2+i*.11),wy=H*(.4+(i%2)*.09);
    const fl=.5+.5*Math.sin(game.t*7+i*2.2);
    ctx.fillStyle='rgba(255,143,61,'+(.4+.5*fl)+')';
    ctx.fillRect(wx,wy,14,18);
  }
  /* brasas subindo */
  for(let i=0;i<26;i++){
    const px=(i*97.3+game.t*(14+i%5*8))%W;
    const py=H-((game.t*(26+i%7*10)+i*137)%H);
    ctx.fillStyle='rgba(255,'+(150+i%2*60)+',61,'+(.25+.35*Math.abs(Math.sin(i+game.t))).toFixed(2)+')';
    ctx.fillRect(px,py,2.5,2.5);
  }
  ctx.globalAlpha=1;
  /* texto */
  if(t>1.2){
    ctx.globalAlpha=clamp((t-1.2)/.8,0,1);
    txt('VOCÊ ESCAPOU',W/2,H*.24,DISP,Math.round(W*.045),'#ffdf9e','center',1);
    txt('a escola em chamas — e o cervo ficou lá dentro',W/2,H*.30,MONO,12,'#c9a0ff','center',1);
  }
  if(t>3.2){
    ctx.globalAlpha=clamp((t-3.2)/.8,0,1);
    txt('CONQUISTA — A ESCOLA EM CHAMAS',W/2,H*.62,MONO,12,'#ffd9a0','center',1);
    txt('BÊNÇÃO ÚNICA — CINZAS DO RITUAL · PACTO ÚNICO — O PACTO DA FUGA',W/2,H*.67,MONO,10,'#bfd8e8','center',1);
    txt('ITEM ÚNICO — SINO DA ESCOLA',W/2,H*.72,MONO,10,'#9fd8ff','center',1);
    txt('todos liberados para as próximas descidas',W/2,H*.77,MONO,9,'#9c8f7c','center',1);
  }
  if(t>5&&e2.ended){
    ctx.globalAlpha=.5+.4*Math.sin(game.t*3);
    txt('clique ou pressione [Z] para voltar ao menu',W/2,H*.88,MONO,11,'#e6dac4','center',1);
    ctx.globalAlpha=1;
  }
}
/* ============================================================
   v1.2.0 — VOCÊ MESMO: a criatura do mundo espelhado.
   Ele caça quando você NÃO olha. Encare-o DIRETO e ele para —
   encare-o o bastante e o 8º fragmento se revela.
   ============================================================ */
function spawnYou(){
  if(SCHOOL.you&&SCHOOL.you.active)return;
  const A=SCHOOL_AREAS[SCHOOL.area].coll[0];
  let best=null,bd=-1;
  for(let k=0;k<16;k++){
    const px=A.x+A.w*(.12+.76*Math.random()),py=A.y+A.h*(.12+.76*Math.random());
    const d=dist(px,py,player.x,player.y);
    if(d>bd){bd=d;best={x:px,y:py};}
  }
  SCHOOL.you={active:true,x:best.x,y:best.y,t:0,lookT:0,mv:false,ang:0,fade:0,frozenSnd:0};
  msg('alguém acabou de entrar na escola.',2.8);
  try{noiseSfx(.8,.04,2000,'highpass');blip('sine',300,150,.7,.05);}catch(e){}
}
function despawnYou(){
  if(SCHOOL.you&&SCHOOL.you.active){SCHOOL.you.active=false;SCHOOL.you.fade=.6;}
  SCHOOL.youDelay=0;
}
function playerLooksAt(x,y,tol){
  let da=Math.atan2(y-player.y,x-player.x)-player.angle;
  while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;
  return Math.abs(da)<(tol||.5);
}
function updateYou(dt){
  const y=SCHOOL.you;if(!y)return;
  if(y.fade>0){y.fade-=dt;if(y.fade<=0)SCHOOL.you=null;return;}
  if(!y.active)return;
  y.t+=dt;
  const inv=SCHOOL.area.indexOf('inv_')===0;
  if(!inv){despawnYou();return;}
  const d=dist(player.x,player.y,y.x,y.y);
  const seen=playerLooksAt(y.x,y.y,.5);
  if(seen){
    /* olhado: PARALISA — e aos poucos revela o fragmento final */
    y.mv=false;y.lookT+=dt;
    if(!y.frozenSnd){y.frozenSnd=1;try{blip('sine',1100,850,.25,.035);}catch(e){}}
    if(y.lookT>1.6&&!SCHOOL.prog.yourselfSeen){
      SCHOOL.prog.yourselfSeen=true;progSave();
      msg('o outro você aponta: o último fragmento está na sala dos professores.',3.6);
      try{noiseSfx(.6,.04,2000,'highpass');blip('sine',600,900,.3,.05);}catch(e){}
    }
  }else{
    y.frozenSnd=0;
    const spd=150+fragCount()*8;
    const dx=player.x-y.x,dy=player.y-y.y,l=Math.hypot(dx,dy)||1;
    if(l>30){y.x+=dx/l*spd*dt;y.y+=dy/l*spd*dt;y.mv=true;
      if(Math.random()<dt*.5)try{noiseSfx(.12,.015,600,'bandpass');}catch(e){}
    }
  }
  const A=SCHOOL_AREAS[SCHOOL.area].coll[0];
  y.x=clamp(y.x,A.x+14,A.x+A.w-14);y.y=clamp(y.y,A.y+14,A.y+A.h-14);
  if(d<26&&SCHOOL.hide==null){
    SCHOOL.you=null;
    startScare('rosto',function(){schoolDie('yourself');});
  }
}
function drawYou(){
  const y=SCHOOL.you;if(!y)return;
  const al=y.fade>0?clamp(y.fade/.6,0,1):(.8+.2*Math.sin(game.t*7));
  const seen=playerLooksAt(y.x,y.y,.5);
  const j=seen?0:(Math.random()-.5)*2.2;
  ctx.save();
  ctx.globalAlpha=al;
  drawPlayerSilhouette(y.x+j,y.y+j);
  /* olhos brancos — eles não piscam */
  const ea=.5+.45*Math.abs(Math.sin(game.t*2.4));
  ctx.fillStyle='rgba(240,240,235,'+ea+')';
  ctx.beginPath();ctx.arc(y.x-5,y.y-14,1.8,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(y.x+5,y.y-14,1.8,0,TAU);ctx.fill();
  if(seen){
    ctx.globalAlpha=.4;
    ctx.strokeStyle='rgba(220,225,235,.6)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(y.x,y.y-8,26,0,TAU);ctx.stroke();
  }
  ctx.restore();
}

/* ============================================================
   EVENTOS AMBIENTES — raros, com cooldown, quase só som
   ============================================================ */
function updateAmbient(dt){
  SCHOOL.amb.t+=dt;
  if(SCHOOL.amb.t>=SCHOOL.amb.next){SCHOOL.amb.t=0;SCHOOL.amb.next=24+rnd()*30;ambientEvent();}
}
function ambientEvent(){
  const n=fragCount(),inv=SCHOOL.area.indexOf('inv_')===0;
  const pool=['creak','wind','hall'];
  if(n>=1)pool.push('door','steps');
  if(n>=2)pool.push('drag','window','light');
  if(n>=4)pool.push('fall','runUp','stretch');
  if(n>=5||inv)pool.push('whisper');
  const ev=pick(pool);
  try{
    switch(ev){
      case 'creak':sfx.creak();break;
      case 'wind':noiseSfx(2.2,.018,240,'lowpass');break;
      case 'hall':blip('sine',160,120,.9,.016);blip('sine',160,118,1.2,.009,.5);break;
      case 'door':noiseSfx(.25,.05,180,'lowpass');blip('sine',90,60,.3,.04);break;
      case 'steps':{const k=3+irnd(0,2);for(let i=0;i<k;i++)noiseSfx(.07,.022,150,'lowpass',i*.42);break;}
      case 'drag':noiseSfx(1.1,.03,120,'lowpass');break;
      case 'window':noiseSfx(.2,.04,900,'bandpass');blip('sine',300,150,.2,.03,.05);break;
      case 'light':SCHOOL.fx.lightDie=7;noiseSfx(.15,.03,3000,'highpass');break;
      case 'fall':noiseSfx(.3,.045,400,'lowpass');blip('sine',140,70,.4,.05,.15);break;
      case 'runUp':for(let i=0;i<7;i++)noiseSfx(.06,.024,180,'lowpass',i*.19);break;
      case 'stretch':if(SCHOOL.area.indexOf('corr')===0)SCHOOL.fx.stretch=5;break;
      case 'whisper':noiseSfx(1.3,.012,900,'bandpass');blip('sine',310,270,1.1,.006);break;
    }
  }catch(e){}
}

/* ============================================================
   CONTINUAR — sair pelo menu sem morrer deixa retomar a partida
   ============================================================ */
const SNAP_SKIP=['t','paused','state','deadT','shake','flash','hitstop','hurtV','roomFade','fallK','fallFrom','fallTo','fallTarget','portal','doors','bossIntroT','overlayShown','waveT','waveState','spawnT','roomQueue','parryLock','glitchT','windowScene','roomEvent','e404T','e404Spawned','reiT','reiSpawned','rkP2','rkUlt','rkUltT','knightIntro','knightIntroT','knightSpawned','knightT','knightX','knightY','knightDead','knightTriunfo','knightHearts','knightTimer','knightHeartsCollected','knightHeartsNeeded','knightInvuln','endPhase','endT','playerAlpha','darkSoul','enterFrom','gateCreak','corridorT','corridorProg','limboLoadT','worldT','estrelaT','furiaT','furiaDur','novaT','stakeT','burstT','lightMagT','darkAng','shockT','parryCharge','activeCd','treasureOpen','shopItems','keeper','keeperNear','sacrificeAltar','puzzle','decor','penumbra','roomWindow','forceNext','meleeHitT','dev','builderLive','deadTaunt','deadFaceX','deadFaceY','fromCaronte','caronteReturn','futureBossMode','hellMode','limboPending','introFlags','soulTremor','knightDeathT'];
function clearContinue(){
  SCHOOL.cont=null;
  /* v0.9.13 FIX: o CONTINUAR agora mora em localStorage — sessionStorage morria
     ao fechar o navegador e o jogador PERDIA a partida ("o save sumiu") */
  try{localStorage.removeItem('thorCont'+activeSave);}catch(e){}
  try{sessionStorage.removeItem('thorCont'+activeSave);}catch(e){}
}
function beforeMenu(){
  try{
    if(player.dead){clearContinue();return;}
    if(game.state==='school'){
      schoolLeave(); /* devolve velocidade/estado emprestado */
      const snap={mode:'school',v:2,save:activeSave,t:Date.now(),
        weapon:game.weapon||'shot',hard:!!game.hard,
        player:{hp:player.hp,maxHp:player.maxHp},
        prog:JSON.parse(JSON.stringify(SCHOOL.prog)),
        fromRun:!!SCHOOL.fromRun,
        /* v0.9.12 FIX: CONTINUAR agora guarda e devolve a INUNDAÇÃO e o
           ritual no ponto exato — antes a água voltava pro zero */
        flood:SCHOOL.flood?SCHOOL.flood.level:0,
        ritual:SCHOOL.ritual?{ph:SCHOOL.ritual.ph,t:SCHOOL.ritual.t,placed:SCHOOL.ritual.placed}:null,
        /* v1.2.0: o incêndio e a caçada final sobrevivem ao CONTINUAR */
        fire:SCHOOL.fire?{level:SCHOOL.fire.level}:null};
      if(SCHOOL.fromRun){
        /* v0.9.9: escola dentro da run — guarda também o estado da descida
           para o CONTINUAR devolver exatamente onde estava */
        const g={};
        for(const k of Object.keys(game)){
          const v=game[k],ty=typeof v;
          if((ty==='number'||ty==='string'||ty==='boolean')&&SNAP_SKIP.indexOf(k)<0)g[k]=v;
        }
        g.hellMode=false;g.pendingRelicChoice=false;g.relicRoom=false;g.paused=false;
        snap.game=g;
        snap.P={dmgMult:P.dmgMult,rateMult:P.rateMult,reachMult:P.reachMult,lightning:P.lightning,speedMult:P.speedMult,biteMult:P.biteMult,biteRange:P.biteRange,magnetMult:P.magnetMult,dashCdMult:P.dashCdMult,invBonus:P.invBonus,soulMult:P.soulMult,parryRadius:P.parryRadius,chainsaw:P.chainsaw,sword:P.sword,nova:P.nova,stakes:P.stakes,burst:P.burst,dark:P.dark,light:P.light,explShot:P.explShot,shock:P.shock};
        snap.up=JSON.parse(JSON.stringify(game.up||{}));
        snap.elements={gelo:game.elements.gelo,fogo:game.elements.fogo,veneno:game.elements.veneno,trovao:game.elements.trovao};
      }
      SCHOOL.cont=snap;
      localStorage.setItem('thorCont'+activeSave,JSON.stringify(snap));/* v0.9.13: persistente */
      return;
    }
    if(game.state!=='play'&&game.state!=='bossintro')return; /* não sobrescreve snapshot válido */
    const g={};
    for(const k of Object.keys(game)){
      const v=game[k],ty=typeof v;
      if((ty==='number'||ty==='string'||ty==='boolean')&&SNAP_SKIP.indexOf(k)<0)g[k]=v;
    }
    g.hellMode=false;
    g.up=JSON.parse(JSON.stringify(game.up||{}));
    g.elements={gelo:game.elements.gelo,fogo:game.elements.fogo,veneno:game.elements.veneno,trovao:game.elements.trovao};
    const snap={mode:'run',v:2,save:activeSave,t:Date.now(),
      game:g,P:{dmgMult:P.dmgMult,rateMult:P.rateMult,reachMult:P.reachMult,lightning:P.lightning,speedMult:P.speedMult,biteMult:P.biteMult,biteRange:P.biteRange,magnetMult:P.magnetMult,dashCdMult:P.dashCdMult,invBonus:P.invBonus,soulMult:P.soulMult,parryRadius:P.parryRadius,chainsaw:P.chainsaw,sword:P.sword,nova:P.nova,stakes:P.stakes,burst:P.burst,dark:P.dark,light:P.light,explShot:P.explShot,shock:P.shock},
      player:{hp:player.hp,maxHp:player.maxHp},
      mapRooms:game.mapRooms.map(r=>({gx:r.gx,gy:r.gy,kind:r.kind,visited:r.visited,cleared:r.cleared,chestDropped:r.chestDropped,chestTaken:r.chestTaken,miniType:r.miniType,kaizo:r.kaizo,pzType:r.pzType,pzSolved:r.pzSolved,flavor:r.flavor,glyphSym:r.glyphSym,hasPortal:r.hasPortal,sbossKind:r.sbossKind})),
      usedMinis:[...(game.usedMinis||[])],facedMinis:[...(game.facedMinis||[])],roomIdx:game.roomIdx};
    SCHOOL.cont=snap;
    localStorage.setItem('thorCont'+activeSave,JSON.stringify(snap));/* v0.9.13: persistente */
  }catch(e){}
}
function resumeRun(){
  const s=SCHOOL.cont;if(!s)return;
  audio();
  ['menu','dead','win','pause','levelup','weapons','options','book','lab','saves','shop','cheatmenu','mythicChoice','circles','limboLoading'].forEach(hideOv);
  blurActive();
  if(s.mode==='school'){
    resetAll();
    if(s.fromRun&&s.game){
      /* v0.9.9: devolve a descida que estava em curso quando entrou na escola */
      const g=s.game||{};
      for(const k in g)game[k]=g[k];
      if(s.P)Object.assign(P,s.P);
      if(s.up)game.up=JSON.parse(JSON.stringify(s.up));
      if(s.elements)game.elements=Object.assign({gelo:0,fogo:0,veneno:0,trovao:0},s.elements);
      game.weapon=g.weapon||'shot';game.hasShot=g.weapon==='shot';game.hasBite=g.weapon==='bite';game.hard=!!g.hard;
      player.dead=false;player.inv=0;player.dashT=0;player.dashCd=0;
      SCHOOL.fromRun=true;
    }else{
      SCHOOL.fromRun=false;
      game.weapon=s.weapon||'shot';game.hasShot=true;game.hasBite=false;game.hard=!!s.hard;
    }
    player.maxHp=Math.max(100,s.player.maxHp||100);player.hp=Math.max(30,Math.min(player.maxHp,s.player.hp||100));
    SCHOOL._spdBase=P.speedMult||1;
    stripWeapons();/* v0.9.13: retomar dentro da escola continua desarmado */
    SCHOOL.prog=s.prog?JSON.parse(JSON.stringify(s.prog)):PROG_DEFAULT();
    SCHOOL.active=true;window.__SCHOOL_ACTIVE=true;
    SCHOOL.intro=null;SCHOOL.fade=1;SCHOOL.msgs=[];SCHOOL.cine=null;SCHOOL.mirrorCine=null;SCHOOL.sink=null;SCHOOL.ritual=null;
    SCHOOL.flood={level:0,t:0,ripple:0};SCHOOL.amb={t:8,next:30};SCHOOL.fx={stretch:0,lightDie:0,grain:0};SCHOOL.mirrorFx={lag:0,creepy:0};
    SCHOOL.fire=null;SCHOOL.escape=null;SCHOOL.you=null;SCHOOL.youDelay=0;/* v1.2.0 */
    /* v0.9.12 FIX: devolve a água e o ritual exatamente como estavam */
    if(s.flood>0){SCHOOL.flood={level:s.flood,t:0,ripple:0};msg('a água ainda sobe.',2.6);}
    if(s.ritual)SCHOOL.ritual={ph:s.ritual.ph,t:s.ritual.t,placed:s.ritual.placed};
    /* v1.2.0: se o CONTINUAR foi salvo durante o incêndio, a fuga recomeça */
    if(s.fire){SCHOOL.fire={active:true,level:s.fire.level,t:0,escape:true};msg('o fogo ainda queima.',2.6);}
    SCHOOL.hide=null;SCHOOL.scare=null;SCHOOL._ptrDown=false;SCHOOL._door=null;
    SCHOOL.hunt=freshHunt();
    if(SCHOOL.prog.frags[0])spawnHunter();
    SCHOOL.floorCache={};SCHOOL.lightCache={};
    game.state='school';
    enterArea(SCHOOL.prog.area||'entrada',null,true);
    game.banner={type:'small',txt:'',sub:game.state==='school'?'a escola te esperou.':'',t:0,dur:2.2};
  }else{
    resetAll();
    const g=s.game||{};
    for(const k in g)game[k]=g[k];
    if(s.P)Object.assign(P,s.P);
    game.weapon=g.weapon||'shot';game.hasShot=g.weapon==='shot';game.hasBite=g.weapon==='bite';game.hard=!!g.hard;
    player.maxHp=Math.max(100,s.player.maxHp||100);player.hp=Math.max(30,Math.min(player.maxHp,s.player.hp||100));
    player.dead=false;player.inv=0;player.dashT=0;player.dashCd=0;
    game.mapRooms=(s.mapRooms||[]).map(r=>Object.assign({},r,{shape:genRoomShape(r.kind),doors:{n:-1,e:-1,s:-1,w:-1},e404:false}));
    const grid={};game.mapRooms.forEach((r,i)=>{grid[r.gx+','+r.gy]=i;});
    const dv={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]};
    for(const r of game.mapRooms)for(const d in dv){const j=grid[(r.gx+dv[d][0])+','+(r.gy+dv[d][1])];if(j!==undefined)r.doors[d]=j;}
    game.usedMinis=s.usedMinis||[];
    game.facedMinis=s.facedMinis||[];/* v0.9.13: kaizo sobrevive ao CONTINUAR */
    if(game.mapRooms)game.mapRooms.forEach(function(r){if(r.miniType&&r.kind==='miniboss')r.kaizo=(game.facedMinis.indexOf(r.miniType)>=0);});
    game.portal=null;game.doors=[];game.roomFade=1;game.paused=false;game.playerAlpha=1;game.deadTaunt='';
    game.hellMode=!!META.hellMode;if(game.hellMode){game.hellEyesT=999;game.hellEyes=[];}
    if(game.activeItem&&typeof ACTIVE_ITEMS!=='undefined'&&ACTIVE_ITEMS[game.activeItem])game.activeMaxCd=ACTIVE_ITEMS[game.activeItem].cd;
    game.state='play';
    enterRoom(clamp(s.roomIdx|0,0,Math.max(0,game.mapRooms.length-1)),null);
    game.banner={type:'small',txt:'',sub:'de volta. o inferno notou a falta.',t:0,dur:2.2};
  }
}
/* ---- menu: card ??? + botão CONTINUAR ---- */
function refreshCircles(){
  const el=ov('circleEscola');if(!el)return;
  /* v1.1.1: POR ENQUANTO a porta da escola aparece SEMPRE nos CÍRCULOS —
     fase de teste (validar a escola fora da descida, sem depender de
     descidas). Ao encerrar o teste, voltar a:
     el.style.display=unlockOK()?'':'none'; */
  el.style.display='';
}
function refreshMenu(){
  const b=ov('continueBtn');if(!b)return;
  try{
    if(!SCHOOL.cont&&game.state==='menu'){
      const raw=localStorage.getItem('thorCont'+activeSave)||sessionStorage.getItem('thorCont'+activeSave);/* v0.9.13: localStorage */
      if(raw){const s=JSON.parse(raw);if(s&&s.v===2&&s.save===activeSave)SCHOOL.cont=s;}
    }
  }catch(e){}
  const show=!!(SCHOOL.cont&&SCHOOL.cont.save===activeSave&&!player.dead&&game.state==='menu');
  b.classList.toggle('hidden',!show);
}

/* ============================================================
   RENDER — pisos em cache, móveis, água, escuridão, HUD
   ============================================================ */
const lightCv=document.createElement('canvas');lightCv.width=W;lightCv.height=H;
const lctx=lightCv.getContext('2d');
const SCH_PAL={
 patio:{bg:'#131110',wall:'#0b090b'},
 fora:{bg:'#0d110e',wall:'#090b09'},
 madeira:{bg:'#161210',wall:'#0c0a0c'},
 sala:{bg:'#151216',wall:'#0c0a0d'},
 azulejo:{bg:'#13161a',wall:'#0b0d10'},
 corredor:{bg:'#131013',wall:'#0b090c'},
 corredor2:{bg:'#131014',wall:'#0b090c'},
 inv_patio:{bg:'#0f130f',wall:'#070b07'},
 inv_corr:{bg:'#0d110e',wall:'#060a07'},
 inv_sala:{bg:'#101207',wall:'#070a05'}
};
function drawFloorTexture(f,A,R,pal){
  const kind=A.floor;
  if(kind==='patio'||kind==='inv_patio'){
    /* rachaduras */
    f.strokeStyle='rgba(0,0,0,0.5)';f.lineWidth=1.2;
    for(let i=0;i<26;i++){
      let x=R()*W,y=R()*H;f.beginPath();f.moveTo(x,y);
      for(let s=0;s<5;s++){x+=(R()-.5)*70;y+=(R()-.5)*70;f.lineTo(x,y);}
      f.stroke();
    }
    /* manchas */
    for(let i=0;i<18;i++){
      f.fillStyle='rgba('+(R()<.5?'0,0,0,0.24':'40,34,28,0.18')+')';
      f.beginPath();f.ellipse(R()*W,R()*H,20+R()*70,12+R()*40,R()*3,0,TAU);f.fill();
    }
    /* vegetação nas bordas */
    f.strokeStyle=kind==='inv_patio'?'rgba(60,80,50,0.5)':'rgba(48,62,38,0.55)';f.lineWidth=1.2;
    for(let i=0;i<120;i++){
      const edge=R()*4|0;let gx,gy;
      if(edge===0){gx=R()*W;gy=86+R()*14;}else if(edge===1){gx=R()*W;gy=H-96-R()*14;}
      else if(edge===2){gx=76+R()*14;gy=R()*H;}else{gx=W-82-R()*14;gy=R()*H;}
      f.beginPath();f.moveTo(gx,gy);f.lineTo(gx+(R()-.5)*4,gy-4-R()*5);f.stroke();
    }
  }else if(kind==='madeira'){
    f.strokeStyle='rgba(0,0,0,0.32)';f.lineWidth=1;
    for(let y=A.coll[0].y+14;y<A.coll[0].y+A.coll[0].h;y+=26){
      f.beginPath();f.moveTo(A.coll[0].x,y);f.lineTo(A.coll[0].x+A.coll[0].w,y);f.stroke();
      for(let s=0;s<3;s++){const sx=A.coll[0].x+R()*A.coll[0].w;f.beginPath();f.moveTo(sx,y);f.lineTo(sx,y+26);f.stroke();}
    }
  }else if(kind==='azulejo'){
    f.strokeStyle='rgba(255,255,255,0.045)';f.lineWidth=1;
    for(let y=A.coll[0].y;y<A.coll[0].y+A.coll[0].h;y+=32){f.beginPath();f.moveTo(A.coll[0].x,y);f.lineTo(A.coll[0].x+A.coll[0].w,y);f.stroke();}
    for(let x=A.coll[0].x;x<A.coll[0].x+A.coll[0].w;x+=32){f.beginPath();f.moveTo(x,A.coll[0].y);f.lineTo(x,A.coll[0].y+A.coll[0].h);f.stroke();}
    for(let i=0;i<10;i++){f.fillStyle='rgba(0,0,0,0.3)';f.beginPath();f.ellipse(R()*W,R()*H,10+R()*30,6+R()*18,R()*3,0,TAU);f.fill();}
  }else if(kind==='fora'){
    f.strokeStyle='rgba(200,210,220,0.05)';f.lineWidth=2;
    for(let i=0;i<5;i++){f.beginPath();f.arc(W/2,H*.44,60+i*44,0,TAU);f.stroke();}
    f.beginPath();f.moveTo(W*.2,H*.44);f.lineTo(W*.8,H*.44);f.stroke();
    f.strokeStyle='rgba(0,0,0,0.4)';
    for(let i=0;i<40;i++){f.beginPath();const gx=R()*W,gy=R()*H;f.moveTo(gx,gy);f.lineTo(gx-2,gy-6);f.stroke();}
  }else if(kind==='inv_corr'){
    f.strokeStyle='rgba(90,110,80,0.14)';f.lineWidth=1;
    for(let x=A.coll[0].x;x<A.coll[0].x+A.coll[0].w;x+=46){
      f.beginPath();f.moveTo(x,A.coll[0].y);f.lineTo(x-30,A.coll[0].y+A.coll[0].h);f.stroke();
    }
  }else{
    /* salas e corredores: lajes com juntas */
    f.strokeStyle='rgba(255,255,255,0.03)';f.lineWidth=1;
    for(let y=A.coll[0].y;y<A.coll[0].y+A.coll[0].h;y+=44){f.beginPath();f.moveTo(A.coll[0].x,y);f.lineTo(A.coll[0].x+A.coll[0].w,y);f.stroke();}
    for(let x=A.coll[0].x;x<A.coll[0].x+A.coll[0].w;x+=64){f.beginPath();f.moveTo(x,A.coll[0].y);f.lineTo(x,A.coll[0].y+A.coll[0].h);f.stroke();}
  }
}
function drawFurniture(f,A,R,id){
  const dk='rgba(0,0,0,0.4)';
  function box(x,y,w,h,c,top){f.fillStyle=dk;f.fillRect(x+3,y+4,w,h);f.fillStyle=c||'#241d20';f.fillRect(x,y,w,h);if(top){f.fillStyle=top;f.fillRect(x+2,y+2,w-4,h-4);}}
  if(id==='salaA11'||id==='salaB21'){
    for(let r=0;r<3;r++)for(let c2=0;c2<5;c2++){
      const dx=A.coll[0].x+60+c2*92,dy=A.coll[0].y+90+r*96;
      box(dx,dy,58,34,'#221b1e','#2c2428');
      box(dx+10,dy-14,38,12,'#1c1618');
      if(id==='salaA11'&&r===1&&c2===2){/* a carteira virada — o fragmento fica perto */}
      if(id==='salaA11'&&r===2&&c2===4){f.save();f.translate(dx+29,dy+17);f.rotate(.5);f.fillStyle='#2c2428';f.fillRect(-29,-17,58,34);f.restore();}
    }
    box(A.coll[0].x+40,A.coll[0].y+8,150,16,'#1b1518');
  }else if(id==='salaA12'){
    for(let s2=0;s2<5;s2++){box(A.coll[0].x+18,A.coll[0].y+70+s2*62,120,44,'#1e171b','#241c22');}
    for(let s2=0;s2<5;s2++){box(A.coll[0].x+A.coll[0].w-138,A.coll[0].y+70+s2*62,120,44,'#1e171b','#241c22');}
    box(A.coll[0].x+A.coll[0].w*.5-90,A.coll[0].y+A.coll[0].h-110,180,54,'#221a1e','#2a2126');
  }else if(id==='salaA13'){
    for(let s2=0;s2<3;s2++){box(A.coll[0].x+30+s2*46,A.coll[0].y+26,40,26,'#1c2226','#232c31');}
    for(let s2=0;s2<4;s2++){box(A.coll[0].x+A.coll[0].w-56,A.coll[0].y+60+s2*78,44,66,'#1a1e22','#20262b');}
  }else if(id==='salaA21'){
    for(let s2=0;s2<2;s2++)for(let c2=0;c2<3;c2++)box(A.coll[0].x+50+c2*160,A.coll[0].y+120+s2*130,120,40,'#1c1a20','#242228');
  }else if(id==='salaA22'){
    for(let i2=0;i2<4;i2++){
      const sx=A.coll[0].x+40+i2*120,sy=A.coll[0].y+180+(i2%2)*90;
      f.fillStyle='#3a3733';f.fillRect(sx,sy,90,54);
      f.fillStyle='rgba(0,0,0,0.25)';f.fillRect(sx+6,sy+6,78,42);
    }
  }else if(id==='salaA23'){
    for(let s2=0;s2<3;s2++){box(A.coll[0].x+26,A.coll[0].y+60+s2*98,150,46,'#1c1e24','#232730');}
    f.fillStyle='rgba(160,170,180,0.07)';f.fillRect(A.coll[0].x+200,A.coll[0].y+40,120,A.coll[0].h-90);
  }else if(id==='salaB11'){
    for(let i2=0;i2<14;i2++){
      const bx=A.coll[0].x+30+R()*(A.coll[0].w-90),by=A.coll[0].y+50+R()*(A.coll[0].h-110);
      box(bx,by,50+R()*26,36+R()*22,'#201a16','#282019');
    }
  }else if(id==='salaB12'){
    for(let c2=0;c2<3;c2++)box(A.coll[0].x+40+c2*150,A.coll[0].y+150,110,44,'#20191c','#282024');
    box(A.coll[0].x+A.coll[0].w-70,A.coll[0].y+40,54,120,'#1c171a','#241d21');
  }else if(id==='salaB13'){
    f.strokeStyle='rgba(140,120,90,0.25)';f.lineWidth=2;
    f.beginPath();f.arc(A.coll[0].x+A.coll[0].w/2,A.coll[0].y+A.coll[0].h/2,66,0,TAU);f.stroke();
    f.beginPath();f.arc(A.coll[0].x+A.coll[0].w/2,A.coll[0].y+A.coll[0].h/2,40,0,TAU);f.stroke();
    for(let i2=0;i2<5;i2++){const a2=i2/5*TAU;f.beginPath();f.arc(A.coll[0].x+A.coll[0].w/2+Math.cos(a2)*90,A.coll[0].y+A.coll[0].h/2+Math.sin(a2)*90,4,0,TAU);f.fillStyle='rgba(90,70,50,0.5)';f.fill();}
    box(A.coll[0].x+60,A.coll[0].y+40,90,30,'#241c1f','#2c2327');
  }else if(id==='salaB22'){
    for(let i2=0;i2<6;i2++)box(A.coll[0].x+40+i2*70,A.coll[0].y+A.coll[0].h-80,8,44,'#1c1618');
    for(let i2=0;i2<6;i2++){f.fillStyle='#2a2024';f.fillRect(A.coll[0].x+34+i2*70,A.coll[0].y+A.coll[0].h-88,20,8);}
    box(A.coll[0].x+40,A.coll[0].y+40,140,34,'#1e171a','#261e22');
  }else if(id==='salaB23'){
    box(A.coll[0].x+A.coll[0].w-120,A.coll[0].y+80,44,44,'#221b1e','#2a2226');
  }else if(id==='entrada'){
    box(A.coll[0].x+A.coll[0].w/2-70,A.coll[0].y+8,140,20,'#1e171a');
    box(A.coll[0].x+30,A.coll[0].y+40,26,60,'#1c1518');
  }else if(id==='externo'){
    /* árvore morta */
    f.strokeStyle='#0d0b09';f.lineWidth=7;
    f.beginPath();f.moveTo(W*.24,H*.62);f.lineTo(W*.24,H*.4);f.stroke();f.lineWidth=3;
    f.beginPath();f.moveTo(W*.24,H*.48);f.lineTo(W*.24-30,H*.4);f.moveTo(W*.24,H*.44);f.lineTo(W*.24+26,H*.36);f.stroke();
    /* cerca */
    f.strokeStyle='rgba(0,0,0,0.5)';f.lineWidth=3;
    for(let x=W*.6;x<W*.85;x+=26){f.beginPath();f.moveTo(x,H*.7);f.lineTo(x,H*.84);f.stroke();}
    f.beginPath();f.moveTo(W*.58,H*.73);f.lineTo(W*.87,H*.73);f.stroke();
  }else if(id==='inv_patio'){
    for(let i2=0;i2<3;i2++)box(W*.72-(i2%2)*520,170+(i2*230),66,26,'#101a10','#16220f');
    for(let i2=0;i2<4;i2++){const lx2=i2<2?200:W-206,ly2=i2%2?160:H-160;f.fillStyle='#0a0f0a';f.beginPath();f.arc(lx2,ly2,7,0,TAU);f.fill();}
  }else if(id==='inv_corr'){
    f.strokeStyle='rgba(120,140,110,0.2)';f.lineWidth=2;
    for(let i2=0;i2<7;i2++){const dx2=A.coll[0].x+80+i2*150;f.strokeRect(dx2,A.coll[0].y+18,44,34);}
    f.strokeStyle='rgba(60,70,50,0.4)';
    for(let i2=0;i2<5;i2++){const rx2=A.coll[0].x+120+i2*210;f.beginPath();f.moveTo(rx2,A.coll[0].y+2);f.lineTo(rx2,A.coll[0].y+26+((i2*37)%22));f.stroke();}
  }else if(id==='inv_sala1'){
    for(let c2=0;c2<4;c2++)box(A.coll[0].x+50+c2*110,A.coll[0].y+16,54,30,'#131a0c','#1a240f');
    f.fillStyle='rgba(150,160,120,0.10)';
    f.font='16px monospace';f.textAlign='center';
    f.fillText('8  8',A.coll[0].x+A.coll[0].w/2,A.coll[0].y+A.coll[0].h-24);
  }else if(id==='inv_professores'){
    for(let r2=0;r2<2;r2++)for(let c2=0;c2<4;c2++){
      box(A.coll[0].x+40+c2*112,A.coll[0].y+90+r2*130,86,38,'#161a0e','#1e2412');
      f.fillStyle='rgba(200,210,170,0.10)';f.fillRect(A.coll[0].x+52+c2*112,A.coll[0].y+96+r2*130,60,8);
    }
  }
}
function areaFloor(A,id){
  if(SCHOOL.floorCache[id])return SCHOOL.floorCache[id];
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const f=c.getContext('2d');
  const R=srng(shash(id));
  const pal=SCH_PAL[A.floor]||SCH_PAL.sala;
  f.fillStyle='#040305';f.fillRect(0,0,W,H);
  for(const rc of A.coll){f.fillStyle=pal.bg;f.fillRect(rc.x,rc.y,rc.w,rc.h);}
  f.save();f.beginPath();
  for(const rc of A.coll)f.rect(rc.x,rc.y,rc.w,rc.h);
  f.clip();
  drawFloorTexture(f,A,R,pal);
  drawFurniture(f,A,R,id);
  f.restore();
  /* paredes */
  f.strokeStyle=pal.wall;f.lineWidth=13;
  for(const rc of A.coll)f.strokeRect(rc.x-6.5,rc.y-6.5,rc.w+13,rc.h+13);
  f.strokeStyle='rgba(255,255,255,0.035)';f.lineWidth=1;
  for(const rc of A.coll)f.strokeRect(rc.x-11,rc.y-11,rc.w+22,rc.h+22);
  /* vãos das portas */
  for(const d of A.doors){
    const horiz=(d.side==='n'||d.side==='s');
    f.fillStyle=pal.bg;
    if(horiz)f.fillRect(d.x-26,d.y-11,52,22);else f.fillRect(d.x-11,d.y-26,22,52);
    if(d.kind==='escada'){
      f.fillStyle='rgba(0,0,0,0.5)';
      for(let s2=0;s2<4;s2++){
        if(horiz)f.fillRect(d.x-22,d.y-8+s2*4.5,44,2.4);else f.fillRect(d.x-8+s2*4.5,d.y-22,2.4,44);
      }
      f.strokeStyle='#2e2730';f.lineWidth=2;
      if(horiz){f.strokeRect(d.x-26,d.y-11,52,22);}else{f.strokeRect(d.x-11,d.y-26,22,52);}
    }else{
      f.strokeStyle='#241d22';f.lineWidth=2.5;
      if(horiz){f.beginPath();f.moveTo(d.x-26,d.y-10);f.lineTo(d.x-26,d.y+10);f.moveTo(d.x+26,d.y-10);f.lineTo(d.x+26,d.y+10);f.stroke();}
      else{f.beginPath();f.moveTo(d.x-10,d.y-26);f.lineTo(d.x+10,d.y-26);f.moveTo(d.x-10,d.y+26);f.lineTo(d.x+10,d.y+26);f.stroke();}
    }
  }
  SCHOOL.floorCache[id]=c;
  return c;
}
/* glifos vetoriais (mural/livros/ritual) */
function drawGlyph(g,x,y,s,col){
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();
  if(g===0){ctx.arc(x,y,s*.5,0,TAU);}
  else if(g===1){ctx.moveTo(x,y-s*.55);ctx.lineTo(x+s*.5,y+s*.4);ctx.lineTo(x-s*.5,y+s*.4);ctx.closePath();}
  else if(g===2){ctx.moveTo(x-s*.5,y-s*.5);ctx.lineTo(x+s*.5,y+s*.5);ctx.moveTo(x+s*.5,y-s*.5);ctx.lineTo(x-s*.5,y+s*.5);}
  else{ctx.strokeRect(x-s*.45,y-s*.45,s*.9,s*.9);}
  ctx.stroke();
}
/* pontos de interação para a dica flutuante */
function interactPoints(){
  const A=SCHOOL.area,p=SCHOOL.prog,out=[];
  if(A==='entrada')out.push({x:640,y:196});
  if(A==='salaA12'&&!p.booksOk)for(let b=0;b<4;b++)out.push({x:452+b*62,y:236});
  if(A==='salaA13'){out.push({x:640,y:200});for(let v=0;v<3;v++)if(!p.valves[v])out.push({x:432+v*46,y:236});}
  if(A==='salaA21')for(let c2=0;c2<CLOCK_SPOTS.length;c2++){if(CLOCK_SPOTS[c2].area==='salaA21'&&!p.clocks[c2])out.push({x:CLOCK_SPOTS[c2].x,y:CLOCK_SPOTS[c2].y+14});}
  if(A==='corrA2')for(let c2=0;c2<CLOCK_SPOTS.length;c2++){if(CLOCK_SPOTS[c2].area==='corrA2'&&!p.clocks[c2])out.push({x:CLOCK_SPOTS[c2].x,y:CLOCK_SPOTS[c2].y+14});}
  if(A==='salaA22'&&!p.pad)out.push({x:640,y:200});
  if(A==='externo'&&!p.shed)out.push({x:1010,y:552});
  if(A==='patio'&&fragCount()>=8&&!p.ritualDone)out.push({x:640,y:360});
  return out;
}
/* ---- objetos dinâmicos ---- */
function drawDynProps(A){
  const id=SCHOOL.area,p=SCHOOL.prog,t=game.t;
  for(const d of A.doors){
    /* v0.9.12: a fechadura some quando a porta já foi destrancada */
    const stillLocked=d.locked==='chave'&&(p.unlocked||[]).indexOf(id+'#'+d.x+','+d.y)<0;
    if(stillLocked){
      const horiz=(d.side==='n'||d.side==='s');
      ctx.fillStyle='#221a1e';
      if(horiz)ctx.fillRect(d.x-24,d.y-9,48,18);else ctx.fillRect(d.x-9,d.y-24,18,48);
      ctx.strokeStyle='#3a2e33';ctx.lineWidth=1.5;
      if(horiz)ctx.strokeRect(d.x-24,d.y-9,48,18);else ctx.strokeRect(d.x-9,d.y-24,18,48);
    }
    if(d.kind==='espelho'){
      const glow=.5+.3*Math.sin(t*2);
      ctx.fillStyle='rgba(150,200,190,'+(.1*glow+.05)+')';
      ctx.beginPath();ctx.arc(d.x,d.y,34,0,TAU);ctx.fill();
      drawMirrorObject(d.x,d.y,true);
    }
  }
  if(id==='salaB12'&&!p.chave){
    const g=.6+.4*Math.sin(t*3);
    ctx.strokeStyle='rgba(220,210,180,'+g+')';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(700,298,5,0,TAU);ctx.moveTo(705,298);ctx.lineTo(714,298);ctx.moveTo(711,298);ctx.lineTo(711,304);ctx.stroke();
  }
  if(id==='entrada')for(let i=0;i<5;i++)drawGlyph(GLYPH_ORDER[i],600+i*22,186,8,'rgba(170,150,120,0.5)');/* v1.2.0: 5 */
  if(id==='salaA12')for(let b=0;b<4;b++){
    if(b>=5)continue;
    const done=p.books.indexOf(BOOK_GLYPHS[b])>=0;
    drawGlyph(BOOK_GLYPHS[b],452+b*62,220,6,done?'rgba(190,170,140,0.85)':'rgba(150,130,110,0.45)');
  }
  if(id==='salaA13')for(let v=0;v<p.valves.length;v++){
    ctx.strokeStyle=p.valves[v]?'rgba(140,180,190,0.8)':'rgba(120,120,120,0.4)';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(432+v*46,222,6,0,TAU);ctx.stroke();
    ctx.beginPath();ctx.moveTo(432+v*46,222);
    ctx.lineTo(432+v*46+(p.valves[v]?5:0),222-(p.valves[v]?5:6));ctx.stroke();
  }
  /* relógios — agora podem estar em qualquer área (CLOCK_SPOTS) */
  for(let c2=0;c2<CLOCK_SPOTS.length;c2++){
    const cs=CLOCK_SPOTS[c2];
    if(cs.area!==id)continue;
    const seen=p.clocks[c2];
    /* v1.2.0: selo colorido de cada relógio (a dica da ORDEM está no compartimento) */
    const SEAL=['#d9465a','#9fd8ff','#ffd9a0'];
    /* v1.2.3 FIX CRÍTICO: este bloco usava o contexto `f` (que só existe em
       areaFloor) em vez de `ctx` — desde a v1.2.0, ENTRAR numa sala com
       relógio (salaA21/corrA2) lançava ReferenceError e MATAVA O RENDER:
       a tela congelava (o update seguia por baixo, invisível) — o soft lock
       "ao subir a escada" (corrA2 tem um relógio em 900,330). */
    ctx.strokeStyle=SEAL[c2];ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(cs.x,cs.y+26,6,0,TAU);ctx.stroke();
    ctx.fillStyle=seen?SEAL[c2]:'rgba(0,0,0,0)';
    ctx.beginPath();ctx.arc(cs.x,cs.y+26,3,0,TAU);ctx.fill();
    ctx.strokeStyle=seen?'rgba(200,190,160,0.75)':'rgba(150,140,120,0.4)';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(cs.x,cs.y,13,0,TAU);ctx.stroke();
    const hr=CLOCK_HOURS[c2]/12*TAU-Math.PI/2;
    ctx.beginPath();ctx.moveTo(cs.x,cs.y);ctx.lineTo(cs.x+Math.cos(hr)*8,cs.y+Math.sin(hr)*8);ctx.stroke();
  }
  drawLockers(A);
  if(id==='salaA22'){
    /* v1.2.0: a ORDEM pedida aparece como selos sobre o compartimento */
    const SEAL2=['#d9465a','#9fd8ff','#ffd9a0'];
    for(let o=0;o<CLOCK_ORDER.length;o++){
      ctx.strokeStyle=SEAL2[CLOCK_ORDER[o]];ctx.lineWidth=2.5;
      ctx.beginPath();ctx.arc(604+o*36,232,7,0,TAU);ctx.stroke();
    }
    ctx.strokeStyle=p.pad?'rgba(180,200,170,0.8)':'rgba(140,130,120,0.4)';ctx.lineWidth=2;
    ctx.strokeRect(610,168,60,34);
    for(let d2=0;d2<3;d2++){ctx.beginPath();ctx.arc(624+d2*16,185,4,0,TAU);ctx.stroke();}
  }
  if(id==='externo'){
    ctx.fillStyle='#161512';ctx.fillRect(976,536,68,54);
    ctx.fillStyle='#1e1c18';ctx.fillRect(982,542,56,42);
    if(!p.shed){ctx.fillStyle='#242019';ctx.fillRect(976,536,68,14);}
  }
  if(id==='salaB21'){
    ctx.fillStyle='rgba(200,210,220,0.07)';
    ctx.font='12px monospace';ctx.textAlign='center';
    ctx.fillText('e l e   c o n t a   o s   q u e   e n t r a m',A.coll[0].x+A.coll[0].w/2,A.coll[0].y+34);
  }
  if(id==='salaA13')drawMirrorObject(640,186,p.mirrorReady);
  if(id==='patio'){
    /* bancos e postes */
    for(const b of [[300,280],[960,280],[320,540]]){
      ctx.fillStyle='#1c1614';ctx.fillRect(b[0]-30,b[1]-8,60,14);
      ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(b[0]-24,b[1]+6,6,8);ctx.fillRect(b[0]+18,b[1]+6,6,8);
    }
    for(const lp of [[200,160],[1080,160],[200,560],[1080,560]]){
      ctx.fillStyle='#121014';ctx.beginPath();ctx.arc(lp[0],lp[1],6,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(200,190,160,0.10)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(lp[0],lp[1]);ctx.lineTo(lp[0],lp[1]-40);ctx.stroke();
    }
    /* marcas do ritual */
    if(fragCount()>=8){
      const done=p.ritualDone;
      ctx.strokeStyle=done?'rgba(120,130,120,0.3)':'rgba(170,190,185,'+(.4+.18*Math.sin(t*2))+')';
      ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(640,360,62,0,TAU);ctx.stroke();
      for(let g2=0;g2<8;g2++){
        const a2=g2/8*TAU;
        drawGlyph(g2%4,640+Math.cos(a2)*62,360+Math.sin(a2)*62,7,done?'rgba(120,130,120,0.3)':'rgba(190,205,200,0.55)');
      }
      if(SCHOOL.ritual){
        const placed=SCHOOL.ritual.placed;
        for(let i2=0;i2<placed;i2++){
          const a3=i2/8*TAU;
          ctx.fillStyle='rgba(201,160,255,0.5)';
          ctx.beginPath();ctx.arc(640+Math.cos(a3)*40,360+Math.sin(a3)*40,4,0,TAU);ctx.fill();
        }
      }
    }
  }
}
/* ---- ESCONDERIJOS (v0.9.12 armários · v0.9.13 variações) ----
   armario = discrição (porta) · mesa = embaixo, meio óbvio · professor = óbvio demais.
   Quanto mais óbvio, mais rápido ele vem conferir. E se você esconder demais
   no MESMO lugar, ele APRENDE — mesmo de longe, vai direto naquele esconderijo. */
const HIDE_SPOTS=[
 {area:'entrada',x:474,y:236,type:'armario',obv:.4},{area:'corrA',x:340,y:336,type:'armario',obv:.4},
 {area:'corrA2',x:640,y:336,type:'armario',obv:.4},{area:'corrB',x:900,y:336,type:'armario',obv:.4},
 {area:'corrB2',x:520,y:336,type:'armario',obv:.4},{area:'salaB11',x:500,y:250,type:'armario',obv:.4},
 {area:'salaA22',x:520,y:270,type:'armario',obv:.4},{area:'patio',x:180,y:430,type:'armario',obv:.4},
 {area:'salaA21',x:560,y:250,type:'mesa',obv:.7},{area:'salaA12',x:620,y:250,type:'mesa',obv:.7},
 {area:'salaA23',x:520,y:430,type:'mesa',obv:.65},{area:'salaB21',x:620,y:430,type:'mesa',obv:.7},
 {area:'salaB23',x:660,y:270,type:'mesa',obv:.7},{area:'salaB12',x:600,y:290,type:'professor',obv:1}
];
function drawLockers(A){
  for(const sp of HIDE_SPOTS){
    if(sp.area!==SCHOOL.area)continue;
    const hid=SCHOOL.hide&&SCHOOL.hide.spot===sp;
    const shiver=hid?Math.sin(game.t*37)*.7:0;
    const ty=sp.type||'armario';
    ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(sp.x-18,sp.y+18,36,7);
    if(ty==='mesa'){
      /* v0.9.13: mesa de aluno — dá pra enfiar embaixo, mas fica vendo as pernas */
      ctx.fillStyle=hid?'#181218':'#241c22';
      ctx.fillRect(sp.x-24+shiver,sp.y-14,48,6);
      ctx.fillStyle='#171115';
      ctx.fillRect(sp.x-22+shiver,sp.y-8,4,26);ctx.fillRect(sp.x+18+shiver,sp.y-8,4,26);
      ctx.fillRect(sp.x-22+shiver,sp.y-8,40,3);
      ctx.fillStyle='#1d151b';
      ctx.fillRect(sp.x+14+shiver,sp.y+2,10,9);/* cadeira */
      ctx.fillRect(sp.x+18+shiver,sp.y+11,2,7);
    }else if(ty==='professor'){
      /* v0.9.13: mesa do professor — enorme, sem onde se cobrir direito */
      ctx.fillStyle=hid?'#191219':'#2a1f26';
      ctx.fillRect(sp.x-30+shiver,sp.y-18,60,10);
      ctx.fillStyle='#1b141a';
      ctx.fillRect(sp.x-28+shiver,sp.y-8,8,26);ctx.fillRect(sp.x+20+shiver,sp.y-8,8,26);
      ctx.fillRect(sp.x-16+shiver,sp.y-8,32,16);
      ctx.strokeStyle='#0e0a0d';ctx.lineWidth=1.5;
      ctx.strokeRect(sp.x-14+shiver,sp.y-6,12,5);ctx.strokeRect(sp.x+2+shiver,sp.y-6,12,5);
    }else{
      ctx.fillStyle=hid?'#191318':'#221b20';
      ctx.fillRect(sp.x-16+shiver,sp.y-34,32,52);
      ctx.fillStyle='rgba(255,255,255,0.045)';ctx.fillRect(sp.x-13+shiver,sp.y-31,26,46);
      ctx.strokeStyle='#131013';ctx.lineWidth=1.5;
      ctx.strokeRect(sp.x-16+shiver,sp.y-34,32,52);
      ctx.beginPath();ctx.moveTo(sp.x+shiver,sp.y-34);ctx.lineTo(sp.x+shiver,sp.y+18);ctx.stroke();
      for(let v=0;v<3;v++){
        ctx.strokeStyle='rgba(0,0,0,0.5)';
        ctx.beginPath();ctx.moveTo(sp.x-10+shiver,sp.y-27+v*5);ctx.lineTo(sp.x+10+shiver,sp.y-27+v*5);ctx.stroke();
      }
    }
    if(hid){
      const a=.35+.3*Math.sin(game.t*3.2);
      ctx.fillStyle='rgba(200,206,196,'+a+')';
      ctx.beginPath();ctx.arc(sp.x-5+shiver,sp.y+4,1.6,0,TAU);ctx.fill();
      ctx.beginPath();ctx.arc(sp.x+5+shiver,sp.y+4,1.6,0,TAU);ctx.fill();
    }
  }
}
function tryHide(sp){
  if(SCHOOL.hide||SCHOOL.scare)return;
  const h=SCHOOL.hunt;
  /* v1.2.1: ele te DETECTOU entrando? (perseguindo você OU na mesma sala
     na hora do fechamento do armário — o rangido entrega) */
  const seen=!!(h&&h.state&&h.state!=='none'&&!h.gone&&h.state!=='illusion'&&(h.state==='chase'||h.area===SCHOOL.area));
  const hunted=!!(h&&(h.state==='chase'||h.state==='search'));
  /* v0.9.13: MEMÓRIA — esconder demais no mesmo lugar ensina o caçador */
  const key=sp.area+'#'+Math.round(sp.x)+','+Math.round(sp.y);
  SCHOOL.hunt.memory=SCHOOL.hunt.memory||{};
  SCHOOL.hunt.memory[key]=(SCHOOL.hunt.memory[key]||0)+1;
  const mem=SCHOOL.hunt.memory[key];
  SCHOOL.hide={spot:sp,t:0,doomed:false,phase:null,pt:0,from:null,snd:false,obv:(sp.obv!==undefined?sp.obv:.4),mem:mem,key:key,seen:seen,seekT:0};
  player.x=sp.x;player.y=sp.y+10;player.mvx=0;player.mvy=0;player.dashT=0;
  let m2=seen?'ele sabe que foi AQUI que você entrou.':(hunted?'você se esconde. algo do outro lado parou de se mover.':'você se esconde. o silêncio fica maior.');
  if(mem>=2)m2+=' (ele já viu você entrar aqui '+mem+' vezes...)';
  msg(m2,2.8);
  try{noiseSfx(.3,.03,240,'lowpass');sfx.creak();}catch(e){}
}
function updateHide(dt){
  const hd=SCHOOL.hide;if(!hd)return;
  const h=SCHOOL.hunt,sp=hd.spot;
  hd.t+=dt;
  player.x=sp.x;player.y=sp.y+10;player.mvx=0;player.mvy=0;player.dashT=0;
  /* v1.2.1: SAIR é sempre possível — inclusive com ele a caminho (a não ser
     quando a porta do armário já está sendo arrancada). Trava de 0.8s fica. */
  if(hd.t>.8&&hd.phase!=='open'&&(held('interact')||held('active'))){
    SCHOOL.hide=null;
    msg('você sai do armário.',1.6);
    try{noiseSfx(.25,.025,300,'lowpass');}catch(e){}
    return;
  }
  if(hd.phase){updateHideDoom(dt);return;}
  if(!h||h.state==='none'||h.gone||h.state==='watch'||h.state==='reveal'||h.state==='illusion')return; /* seguro: nada acontece */
  /* v1.2.1: ele SÓ vem se VIU/OUVIU você entrar (mesma sala na hora) —
     ou é a caçada final (ele SABE onde você está). Ele entrou na sala
     DEPOIS, sem te ver? Ele fuça, procura... e vai embora. */
  if(hd.seen||h.state==='finalchase'){
    hd.doomed=true;hd.phase='wait';hd.pt=0;
    msg(h.state==='finalchase'?'...não adianta se esconder. ele sabe.':'...ele sabe onde você está.',2.8);
    try{blip('sine',60,38,1.2,.08);}catch(e){}
    return;
  }
  if(h.state==='wander'||h.state==='investigate'||h.state==='search'||h.state==='ambush'){
    /* v0.9.13/v1.2.1: esconderijo APRENDIDO (2+ vezes) é armadilha — ele lembra e vem */
    if(hd.mem>=2){
      hd.doomed=true;hd.phase='wait';hd.pt=0;
      msg('...ele lembra desse esconderijo.',2.8);
      try{blip('sine',60,38,1.2,.08);}catch(e){}
    }
    return;
  }
}
function updateHideDoom(dt){
  const hd=SCHOOL.hide,h=SCHOOL.hunt,sp=hd.spot;
  hd.pt+=dt;
  /* v0.9.13: óbvio = achado rápido; aprendido (3+ vezes) = quase imediato */
  const waitT=hd.mem>=3?.5:lerp(1.6,.6,hd.obv);
  const apprT=hd.mem>=3?1.2:lerp(2.4,1.3,hd.obv);
  if(hd.phase==='wait'){
    if(!h||h.gone||h.state==='none'){hd.phase=null;hd.doomed=false;return;}
    if(hd.pt>waitT){
      /* v1.2.1: SEM TELEPORTE — ele CAMINHA até o armário de porta em porta.
         Se estava te perseguindo, a perseguição já o traz; senão, vira busca. */
      hd.phase='seek';hd.pt=0;hd.seekT=0;
      if(h.state!=='finalchase'&&h.state!=='chase'){
        h.state='search';h.searchT=0;h.searchRoom=SCHOOL.area;
      }
      h.tx=sp.x;h.ty=sp.y;h.navTo=null;h.pt=null;h.obs=null;h.invRoom=null;
      h.lure={x:sp.x,y:sp.y,t:18,room:SCHOOL.area};
      try{noiseSfx(.4,.03,160,'lowpass');}catch(e){}
    }
  }else if(hd.phase==='seek'){
    hd.seekT=(hd.seekT||0)+dt;
    if(h&&h.area===SCHOOL.area&&dist(h.x,h.y,sp.x,sp.y)<170){
      hd.phase='approach';hd.pt=0;
      hd.from={x:h.x,y:h.y};
      if(dist(h.x,h.y,sp.x,sp.y)<44)hd.pt=apprT; /* já está em cima: arranca a porta */
    }else if(!h||h.gone||h.state==='none'||hd.seekT>20){
      /* v1.2.1: não conseguiu chegar (portas trancadas / sumiu) → DESISTE */
      hd.phase=null;hd.doomed=false;hd.seekT=0;hd.seen=false;
      if(h&&h.lure)h.lure=null;
      msg('...os passos foram embora.',2.6);
    }
  }else if(hd.phase==='approach'){
    const k=clamp(hd.pt/apprT,0,1);
    if(h){
      h.x=lerp(hd.from.x,sp.x,k);h.y=lerp(hd.from.y,sp.y+6,k);h.mv=true;
      h.ang=Math.atan2(sp.y+6-h.y,sp.x-h.x);
      if(Math.random()<dt*3)try{noiseSfx(.06,.028,140,'lowpass');}catch(e){}
    }
    if(k>=1){hd.phase='open';hd.pt=0;try{sfx.creak();}catch(e){}}
  }else if(hd.phase==='open'){
    if(h)h.mv=false;
    if(hd.pt>.9&&!hd.snd){hd.snd=true;try{noiseSfx(.5,.08,900,'bandpass');blip('sine',80,40,.8,.1);}catch(e){}}
    if(hd.pt>1.2){
      startScare(SCHOOL.area.indexOf('inv_')===0?'rosto':'cervo-caveira',function(){schoolDie('hunter');});
    }
  }
}
/* ---- SUSTO — tela inteira (v0.9.12) ----
   sprites trocáveis: assets/sprites/escola/cervo-caveira.png · rosto.png · estatica.png */
function startScare(imgName,after){
  SCHOOL.scare={t:0,dur:1.7,img:imgName,after:after||null};
  try{sfx.growl();noiseSfx(1.6,.09,1400,'highpass');blip('sine',900,55,1.4,.12);}catch(e){}
  game.shake=Math.max(game.shake,16);
}
function updateScare(dt){
  const s=SCHOOL.scare;if(!s)return;
  s.t+=dt;
  if(Math.random()<dt*22)try{noiseSfx(.05,.04,rnd(200,3000),'bandpass');}catch(e){}
  game.shake=Math.max(game.shake,6);
  if(s.t>=s.dur){SCHOOL.scare=null;const f=s.after;if(f)f();}
}
function drawScare(){
  const s=SCHOOL.scare;if(!s)return;
  const k=clamp(s.t/s.dur,0,1);
  const st=sprGet('estatica');
  ctx.globalAlpha=.42+.2*Math.sin(game.t*60);
  if(st)ctx.drawImage(st,rnd(-40,0),rnd(-40,0),W+80,H+80);
  else for(let i=0;i<130;i++){ctx.fillStyle=Math.random()<.5?'#000':'#c9ccc6';ctx.fillRect(rnd(-10,W),rnd(-10,H),rnd(20,140),rnd(1,3));}
  ctx.globalAlpha=1;
  const im=sprGet(s.img);
  const sc=H*(.3+k*.9);
  if(im)ctx.drawImage(im,W/2-sc/2,H/2-sc/2,sc,sc);
  else drawScareFace(s.img==='rosto',W/2,H/2,sc);
  for(let i=0;i<7;i++){const y=rnd(0,H);ctx.fillStyle='rgba(0,0,0,'+rnd(.25,.7)+')';ctx.fillRect(0,y,W,rnd(1,5));}
  ctx.fillStyle='rgba(120,8,14,'+(.12+.2*k)+')';ctx.fillRect(0,0,W,H);
}
/* fallback procedural do susto (caveira de cervo / o seu próprio rosto) */
function drawScareFace(isFace,cx,cy,s){
  ctx.save();
  const r=s*.5;
  if(isFace){
    ctx.fillStyle='#9aa4a0';ctx.beginPath();ctx.ellipse(cx,cy,r*.62,r,0,0,TAU);ctx.fill();
    ctx.fillStyle='#0a0a0c';
    ctx.beginPath();ctx.ellipse(cx-r*.24,cy-r*.18,r*.11,r*.16,0,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+r*.24,cy-r*.18,r*.11,r*.16,0,0,TAU);ctx.fill();
    ctx.strokeStyle='#101012';ctx.lineWidth=s*.02;
    for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(cx-r*.2,cy+r*.3+i*s*.035);ctx.lineTo(cx+r*.2,cy+r*.26+i*s*.035);ctx.stroke();}
  }else{
    ctx.fillStyle='#cfc4b0';ctx.beginPath();ctx.ellipse(cx,cy-r*.12,r*.5,r*.66,0,0,TAU);ctx.fill();
    ctx.fillStyle='#cfc4b0';ctx.fillRect(cx-r*.14,cy+r*.3,r*.28,r*.3);
    ctx.fillStyle='#14100d';
    ctx.beginPath();ctx.ellipse(cx-r*.2,cy-r*.18,r*.1,r*.13,0,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+r*.2,cy-r*.18,r*.1,r*.13,0,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx,cy+r*.34,r*.05,r*.16,0,0,TAU);ctx.fill();
    ctx.strokeStyle='#c6bba6';ctx.lineWidth=s*.022;ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(cx-r*.16,cy-r*.5);ctx.lineTo(cx-r*.5,cy-r*.95);ctx.lineTo(cx-r*.72,cy-r*1.12);
    ctx.moveTo(cx-r*.42,cy-r*.8);ctx.lineTo(cx-r*.4,cy-r*1.16);
    ctx.moveTo(cx+r*.16,cy-r*.5);ctx.lineTo(cx+r*.5,cy-r*.95);ctx.lineTo(cx+r*.72,cy-r*1.12);
    ctx.moveTo(cx+r*.42,cy-r*.8);ctx.lineTo(cx+r*.4,cy-r*1.16);
    ctx.stroke();
  }
  ctx.restore();
}
/* ---- batida do coração — troque por assets/audio/sfx/heartbeat.mp3 ---- */
const AUD={};
const AUD_EXTS=['mp3','ogg','wav','m4a'];
const AUD_DIRS=['assets/audio/sfx/','assets/audio/'];
function audGet(name){
  if(AUD[name]!==undefined)return AUD[name];
  AUD[name]=null;
  const tries=[];
  for(const dir of AUD_DIRS)for(const e of AUD_EXTS)tries.push(dir+name+'.'+e);
  let i=0;
  (function next(){
    if(i>=tries.length){AUD[name]=false;return;}
    const a=new Audio();
    a.addEventListener('error',function(){i++;next();},{once:true});
    a.addEventListener('canplaythrough',function(){if(AUD[name]===null)AUD[name]=a;},{once:true});
    a.src=tries[i];a.load();
  })();
  return AUD[name];
}
function heartbeatSound(){
  const a=audGet('heartbeat');
  if(a){try{const h=a.cloneNode();h.volume=.55;h.play().catch(function(){});}catch(e){}}
  else{try{sfx.heart();}catch(e){}}
}
/* ---- espelho do banheiro ---- */
function drawMirrorObject(x,y,active){
  const im=sprGet('espelho');
  if(im){ctx.drawImage(im,x-22,y-48,44,96);return;}
  ctx.fillStyle='#241d22';ctx.beginPath();ctx.ellipse(x,y,15,34,0,0,TAU);ctx.fill();
  const g=ctx.createLinearGradient(x-10,y-28,x+10,y+30);
  g.addColorStop(0,active?'rgba(150,200,185,0.34)':'rgba(140,150,160,0.22)');
  g.addColorStop(.5,active?'rgba(90,140,130,0.42)':'rgba(90,100,110,0.28)');
  g.addColorStop(1,'rgba(40,50,55,0.4)');
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,11,29,0,0,TAU);ctx.fill();
  if(active){
    ctx.strokeStyle='rgba(160,220,205,'+(.4+.25*Math.sin(game.t*2.6))+')';
    ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,15,34,0,0,TAU);ctx.stroke();
  }
  drawMirrorReflection(x,y);
}
function drawMirrorReflection(x,y){
  const fx=SCHOOL.mirrorFx;
  if(fx.lag<=0&&fx.creepy<=0)return;
  const trail=SCHOOL.mTrail||[];
  if(!trail.length)return;
  const back=fx.lag>0?30:18;
  const smp=trail[Math.max(0,trail.length-1-back)];
  if(!smp)return;
  const rx=clamp(640+(640-smp.x)*.5,596,684);
  ctx.save();ctx.globalAlpha=fx.creepy>0?.6:.45;
  drawPlayerSilhouette(rx,smp.y);
  if(fx.creepy>0){
    ctx.globalAlpha=.42;
    ctx.fillStyle='rgba(4,3,6,0.9)';
    ctx.beginPath();ctx.ellipse(rx,smp.y-30,10,26,0,0,TAU);ctx.fill();
    ctx.strokeStyle='#b9ae98';ctx.lineWidth=1.6;
    ctx.beginPath();
    ctx.moveTo(rx-5,smp.y-52);ctx.lineTo(rx-11,smp.y-64);ctx.moveTo(rx-8,smp.y-58);ctx.lineTo(rx-14,smp.y-60);
    ctx.moveTo(rx+5,smp.y-52);ctx.lineTo(rx+11,smp.y-64);ctx.moveTo(rx+8,smp.y-58);ctx.lineTo(rx+14,smp.y-60);
    ctx.stroke();
  }
  ctx.restore();
}
/* ---- fragmentos ---- */
function drawFragments(A){
  for(let i=0;i<FRAG_DEFS.length;i++){
    const fd=FRAG_DEFS[i];
    if(fd.area!==SCHOOL.area||!fragAvailable(i))continue;
    const g=.55+.3*Math.sin(game.t*2.4+i);
    const im=sprGet('fragmento');
    if(im){ctx.globalAlpha=.92;ctx.drawImage(im,fd.x-12,fd.y-14,24,28);ctx.globalAlpha=1;continue;}
    ctx.fillStyle='rgba(185,168,216,0.8)';
    ctx.beginPath();
    ctx.moveTo(fd.x,fd.y-9);ctx.lineTo(fd.x+6,fd.y);ctx.lineTo(fd.x+3,fd.y+9);ctx.lineTo(fd.x-5,fd.y+6);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(201,160,255,'+(g*.5)+')';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(fd.x,fd.y,12+2*Math.sin(game.t*3+i),0,TAU);ctx.stroke();
  }
}
/* ---- água da inundação ---- */
function drawWater(A){
  if(SCHOOL.area!=='patio'||SCHOOL.flood.level<=0)return;
  const L=SCHOOL.flood.level,rc=A.coll[0];
  ctx.fillStyle='rgba(26,48,58,'+(.34*L)+')';
  ctx.fillRect(rc.x,rc.y,rc.w,rc.h);
  ctx.lineWidth=1.2;
  for(let i=0;i<4;i++){
    const ph=(game.t*.05+i*.25)%1;
    ctx.strokeStyle='rgba(160,200,210,'+((1-ph)*.14*(.4+L))+')';
    ctx.beginPath();ctx.arc(640,360,40+ph*560*L,0,TAU);ctx.stroke();
  }
  for(let i=0;i<8;i++){
    const rx=rc.x+((i*173+Math.floor(game.t*.7)*37)%rc.w),ry=rc.y+((i*97)%rc.h);
    ctx.fillStyle='rgba(190,220,230,0.05)';
    ctx.fillRect(rx,ry,18+6*Math.sin(game.t*2+i),2);
  }
  if(L>.82){
    const ar=(L-.82)/.18;
    const grd=ctx.createRadialGradient(640,360,4,640,360,80*ar+30);
    grd.addColorStop(0,'rgba(0,2,4,0.95)');grd.addColorStop(1,'rgba(6,14,20,0)');
    ctx.fillStyle=grd;ctx.beginPath();ctx.arc(640,360,80*ar+30,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(120,170,180,0.12)';
    ctx.beginPath();ctx.arc(640,360,60+8*Math.sin(game.t*1.4),0,TAU);ctx.stroke();
  }
}
/* ---- O CAÇADOR ---- */
function drawHunter(){
  const h=SCHOOL.hunt;
  if(!h||!h.state||h.state==='none'||h.gone)return;
  const isObs=h.obs&&h.obs.area===SCHOOL.area;
  if(h.area!==SCHOOL.area&&!isObs)return;
  /* v0.9.12: na escola invertida o caçador é VOCÊ —
     mesma aparência do jogador, mais distorcido quanto mais perto.
     v1.2.0: enquanto VOCÊ MESMO caça ali, o caçador não divide a cena */
  if(SCHOOL.area.indexOf('inv_')===0){
    if(SCHOOL.you&&SCHOOL.you.active)return;
    drawYourself(h);return;
  }
  const isIll=h.state==='illusion';
  const flick=isIll?(.2+.2*Math.abs(Math.sin(game.t*13))):(isObs?(.5+.4*Math.abs(Math.sin(game.t*7))):1);
  const x=h.x+(isIll?(Math.random()-.5)*8:0),y=h.y+(isIll?(Math.random()-.5)*6:0);
  ctx.save();ctx.globalAlpha=flick;
  if(isIll&&Math.random()<.06){ctx.globalAlpha=0;}/* a ilusão falha por um instante */
  /* v0.9.13: CONE DE VISÃO — dá pra esgueirar por fora dele (±76°) */
  if((h.state==='search'||h.state==='reveal'||h.state==='wander'||h.state==='investigate')&&!isObs){
    const ca=(h.ang===undefined?0:h.ang);
    const cg=ctx.createRadialGradient(x,y-30,14,x,y-30,430);
    cg.addColorStop(0,'rgba(160,30,34,.15)');cg.addColorStop(1,'rgba(160,30,34,0)');
    ctx.fillStyle=cg;
    ctx.beginPath();ctx.moveTo(x,y-30);
    ctx.arc(x,y-30,430,ca-1.32,ca+1.32);
    ctx.closePath();ctx.fill();
  }
  ctx.fillStyle='rgba(0,0,0,0.5)';
  ctx.beginPath();ctx.ellipse(x,y+40,20,6,0,0,TAU);ctx.fill();
  const im=sprGet('cacador');
  if(im){ctx.drawImage(im,x-30,y-54,60,98);ctx.restore();return;}
  const sway=Math.sin(game.t*1.9)*3;
  /* manto */
  ctx.fillStyle='rgba(4,3,6,0.97)';
  ctx.beginPath();
  ctx.moveTo(x-15,y-48);
  ctx.quadraticCurveTo(x-25,y-8,x-21+sway,y+40);
  ctx.lineTo(x-10+sway,y+34);ctx.lineTo(x-2+sway,y+42);ctx.lineTo(x+7+sway,y+34);ctx.lineTo(x+14+sway,y+41);
  ctx.lineTo(x+21+sway,y+40);
  ctx.quadraticCurveTo(x+25,y-8,x+15,y-48);
  ctx.quadraticCurveTo(x,y-56,x-15,y-48);
  ctx.fill();
  /* ossos por dentro — visíveis quando se move */
  if(h.mv||h.state==='chase'){
    const ba=.3+.18*Math.sin(game.t*9);
    ctx.strokeStyle='rgba(176,164,140,'+ba+')';ctx.lineWidth=2;
    for(let r2=0;r2<3;r2++){
      ctx.beginPath();ctx.arc(x,y-20+r2*7,8-r2*1.5,-.5,Math.PI+.5);ctx.stroke();
    }
    ctx.beginPath();ctx.moveTo(x-7,y-2);ctx.lineTo(x+8,y+8);ctx.stroke();
  }
  /* caveira de cervo */
  const imh=sprGet('cacador-cabeca');
  if(imh){ctx.drawImage(imh,x-16,y-84,32,40);}
  else{
    ctx.fillStyle='#cfc4b0';
    ctx.beginPath();ctx.ellipse(x,y-56,7.5,10,0,0,TAU);ctx.fill();
    ctx.fillRect(x-3.5,y-50,7,9);
    ctx.fillStyle='#171310';
    ctx.beginPath();ctx.arc(x-3.2,y-58,2.1,0,TAU);ctx.fill();
    ctx.beginPath();ctx.arc(x+3.2,y-58,2.1,0,TAU);ctx.fill();
    if(h.state==='chase'||h.state==='reveal'){
      ctx.fillStyle='rgba(190,40,40,'+(.35+.25*Math.sin(game.t*10))+')';
      ctx.beginPath();ctx.arc(x-3.2,y-58,.9,0,TAU);ctx.fill();
      ctx.beginPath();ctx.arc(x+3.2,y-58,.9,0,TAU);ctx.fill();
    }
    /* chifres */
    ctx.strokeStyle='#c6bba6';ctx.lineWidth=2.4;ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(x-5,y-64);ctx.lineTo(x-12,y-78);ctx.lineTo(x-19,y-84);ctx.moveTo(x-12,y-78);ctx.lineTo(x-11,y-88);
    ctx.moveTo(x+5,y-64);ctx.lineTo(x+12,y-78);ctx.lineTo(x+19,y-84);ctx.moveTo(x+12,y-78);ctx.lineTo(x+11,y-88);
    ctx.stroke();
  }
  ctx.restore();
}
/* v0.9.12 — VOCÊ MESMO: na escola invertida a criatura tem a sua cara.
   Usa o MESMO render do jogador (PNG do thor incluso) e vai distorcendo
   com a proximidade: tremor, molas de escala, ecos fantasma e olhos. */
function drawYourself(h){
  const isObs=h.obs&&h.obs.area===SCHOOL.area;
  const flick=isObs?(.5+.4*Math.abs(Math.sin(game.t*7))):1;
  const d=dist(player.x,player.y,h.x,h.y);
  const k=1-clamp(d/420,0,1); /* 0 longe — 1 colado */
  const jx=(Math.random()-.5)*12*k,jy=(Math.random()-.5)*9*k;
  const px=player.x,py=player.y,pa=player.angle,pwt=player.walkT;
  player.x=h.x+jx;player.y=h.y+jy;
  player.angle=Math.atan2(py-player.y,px-player.x);
  if(h.mv)player.walkT=(pwt||0)+.22;
  const wob=1+.07*k*Math.sin(game.t*15);
  ctx.save();
  ctx.globalAlpha=flick;
  ctx.translate(player.x,player.y);ctx.scale(wob,2-wob);ctx.translate(-player.x,-player.y);
  drawPlayer();
  if(k>.5){ /* ecos fantasma perto demais */
    for(const o of[-1,1]){
      player.x=h.x+o*(4+10*k);player.y=h.y+jy;
      drawPlayer();
    }
  }
  ctx.restore();
  player.x=px;player.y=py;player.angle=pa;player.walkT=pwt;
  /* olhos vermelhos quando está perto de mais */
  if(k>.62){
    const a=(k-.62)/.38;
    ctx.fillStyle='rgba(190,30,34,'+(a*(.5+.3*Math.sin(game.t*9)))+')';
    ctx.beginPath();ctx.arc(h.x-4,h.y-46,1.7,0,TAU);ctx.fill();
    ctx.beginPath();ctx.arc(h.x+4,h.y-46,1.7,0,TAU);ctx.fill();
  }
}
/* ---- escuridão ---- */
function drawDarkness(A){
  let base=A.dark;
  const inv=SCHOOL.area.indexOf('inv_')===0;
  if(SCHOOL.fx.lightDie>0)base=Math.min(.97,base+.16);
  if(SCHOOL.flood.level>0)base=Math.max(.2,base-.05);
  if(SCHOOL.ritual)base=Math.min(.82,base+.08);
  /* v0.9.12: a escola invertida é MAIS escura e o véu agora é AZUL */
  if(inv)base=Math.min(.93,base+.08);
  lctx.clearRect(0,0,W,H);
  lctx.globalCompositeOperation='source-over';
  lctx.fillStyle='rgba(3,1,6,'+clamp(base,0,.97)+')';
  lctx.fillRect(0,0,W,H);
  lctx.globalCompositeOperation='destination-out';
  function hole(x,y,r,a){
    const g=lctx.createRadialGradient(x,y,r*.15,x,y,r);
    g.addColorStop(0,'rgba(0,0,0,'+(a===undefined?1:a)+')');
    g.addColorStop(1,'rgba(0,0,0,0)');
    lctx.fillStyle=g;lctx.beginPath();lctx.arc(x,y,r,0,TAU);lctx.fill();
  }
  const flick=1+.04*Math.sin(game.t*11)+.03*Math.sin(game.t*23);
  hole(player.x,player.y,(SCHOOL.area==='salaB11'?150:215)*flick,1);
  if(SCHOOL.area==='patio'){
    for(const lp of [[200,160],[1080,160],[200,560],[1080,560]])hole(lp[0],lp[1],64,.42);
    if(fragCount()>=8)hole(640,360,120,.5+.15*Math.sin(game.t*2));
  }
  if(SCHOOL.area==='salaA13')hole(640,186,84,SCHOOL.prog.mirrorReady?.7:.45);
  for(const fd of FRAG_DEFS)if(fd.area===SCHOOL.area&&fragAvailable(fd.id-1))hole(fd.x,fd.y,32,.6);
  const h=SCHOOL.hunt;
  if(h&&h.area===SCHOOL.area&&h.state!=='none'&&!h.gone)hole(h.x,h.y,46,.32);
  lctx.globalCompositeOperation='source-over';
  ctx.drawImage(lightCv,0,0);
  if(inv){
    ctx.fillStyle='rgba(24,48,96,0.16)';
    ctx.fillRect(0,0,W,H);
  }
}
/* ---- grão / vhs sutil ---- */
function drawGrain(){
  const g=SCHOOL.fx.grain;
  ctx.globalAlpha=.026+g*.05;
  for(let i=0;i<22;i++){
    ctx.fillStyle=Math.random()<.5?'#000':'#fff';
    ctx.fillRect(0,rnd(0,H),W,1);
  }
  ctx.globalAlpha=1;
  if(g>0&&Math.random()<.3){
    ctx.fillStyle='rgba(255,255,255,0.028)';
    ctx.fillRect(0,rnd(0,H),W,2);
  }
}
/* ---- HUD mínimo: FRAGMENTOS + dica Z ---- */
function drawSchoolHUD(){
  txt('FRAGMENTOS '+fragCount()+'/8',24,24,MONO,12,'#8a7d6c','left',2);
  let best=null,bd=70;
  for(const pt of interactPoints()){
    const d=dist(player.x,player.y,pt.x,pt.y);
    if(d<bd){bd=d;best=pt;}
  }
  if(best){
    ctx.globalAlpha=.5+.25*Math.sin(game.t*4);
    txt('Z',best.x,best.y-28,MONO,11,'#cfc4b0','center',1);
    ctx.globalAlpha=1;
  }
  const h=SCHOOL.hunt;
  if(h&&h.state==='chase'&&h.area===SCHOOL.area){
    const d=dist(player.x,player.y,h.x,h.y);
    const pu=.2+.12*Math.sin(game.t*8)*(1-clamp(d/520,0,1));
    const lg=ctx.createRadialGradient(W/2,H/2,H*.25,W/2,H/2,W*.62);
    lg.addColorStop(0,'rgba(120,10,20,0)');lg.addColorStop(1,'rgba(120,10,20,'+Math.max(0,pu)+')');
    ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);
  }
}
/* ---- mensagens / cine / transições ---- */
function drawMsgs(){
  let i=0;
  for(const m of SCHOOL.msgs){
    const a=Math.min(1,m.t*3)*Math.min(1,(m.dur-m.t)*2);
    ctx.globalAlpha=clamp(a,0,1)*.9;
    txt(m.txt,W/2,H*.8+i*22,MONO,13,'#b3a68f','center',1);
    ctx.globalAlpha=1;i++;
  }
  if(SCHOOL.showGlyphs){
    ctx.fillStyle='rgba(8,6,10,0.8)';
    ctx.fillRect(W/2-120,H*.3-40,240,80);
    ctx.strokeStyle='rgba(170,150,120,0.5)';ctx.lineWidth=1.5;
    ctx.strokeRect(W/2-120,H*.3-40,240,80);
    for(let g2=0;g2<5;g2++)drawGlyph(GLYPH_ORDER[g2],W/2-104+g2*52,H*.3,13,'#cfc4b0');/* v1.2.0: 5 */
  }
}
function drawCine(){
  const c=SCHOOL.cine;
  ctx.fillStyle='rgba(2,1,4,0.55)';ctx.fillRect(0,0,W,H);
  for(const l of c.lines){
    if(c.t<l.at)continue;
    const a=Math.min(1,(c.t-l.at)*1.4)*Math.min(1,Math.max(0,(l.at+l.dur-c.t))*1.2);
    if(a<=0)continue;
    ctx.globalAlpha=clamp(a,0,1);
    txt(l.txt,W/2,H*.44,DISP,Math.round(W*.028),'#d8cfc0','center',2);
    ctx.globalAlpha=1;
  }
}
function drawMirrorCine(){
  const mc=SCHOOL.mirrorCine,k=clamp(mc.t/2.1,0,1);
  ctx.fillStyle='rgba(5,8,7,'+(k*.85)+')';ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=.05+.12*k;
  for(let i=0;i<40;i++){
    ctx.fillStyle=Math.random()<.5?'#fff':'#9fe8d8';
    ctx.fillRect(rnd(0,W),rnd(0,H),rnd(30,160),1.5);
  }
  ctx.globalAlpha=1;
  const r=(1-k)*H*.75+30;
  ctx.fillStyle='rgba(1,2,2,0.96)';
  ctx.beginPath();ctx.rect(0,0,W,H);ctx.arc(W/2,H/2,r,0,TAU,true);ctx.fill();
}
function drawSink(){
  const s=SCHOOL.sink;
  const dark=clamp(s.t/4.6,0,1);
  ctx.fillStyle='rgba(1,3,6,'+(dark*.96)+')';ctx.fillRect(0,0,W,H);
  if(s.t>4.8){
    const a=ramp(s.t,4.8,6.4)*(1-ramp(s.t,7,7.4));
    ctx.globalAlpha=a*.8;
    ctx.fillStyle='#0a141c';
    ctx.beginPath();ctx.ellipse(W/2,H*.62,180,60,0,0,TAU);ctx.fill();
    ctx.globalAlpha=1;
    if(Math.random()<.3){
      ctx.fillStyle='rgba(160,200,210,0.08)';
      ctx.fillRect(W/2-80+rnd(0,160),H*.55+rnd(0,60),rnd(10,60),1.5);
    }
  }
}
function drawRitualFx(){
  const r=SCHOOL.ritual;if(!r)return;
  const k=r.ph==='place'?r.placed/8:1;
  ctx.strokeStyle='rgba(160,190,190,'+(0.12+.1*Math.sin(game.t*2))+')';
  ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(640,360,70+k*30,0,TAU);ctx.stroke();
}
/* ---- draw principal da escola ---- */
window.SCHOOL_draw=function(){
  const A=SCHOOL_AREAS[SCHOOL.area];
  ctx.fillStyle='#040305';ctx.fillRect(0,0,W,H);
  ctx.save();
  if(SCHOOL.fx.stretch>0){
    const k=1+.05*Math.sin(game.t*2.4)*(SCHOOL.fx.stretch/5);
    ctx.translate(W/2,H/2);ctx.scale(1,k);ctx.translate(-W/2,-H/2);
  }
  /* v0.9.12: escola invertida — o MUNDO INTEIRO aparece espelhado */
  const inv=SCHOOL.area.indexOf('inv_')===0;
  if(inv){ctx.translate(W,0);ctx.scale(-1,1);}
  ctx.drawImage(areaFloor(A,SCHOOL.area),0,0);
  drawDynProps(A);
  drawFragments(A);
  drawWater(A);
  /* v1.2.0: a porta da fuga brilha na entrada em chamas */
  if(SCHOOL.fire&&SCHOOL.fire.escape&&SCHOOL.area==='entrada')drawEscapeDoor();
  drawDoorAnim();/* v0.9.13: porta abrindo */
  drawHunter();
  if(SCHOOL.you&&(SCHOOL.you.active||SCHOOL.you.fade>0))drawYou();/* v1.2.0 */
  if(!player.dead&&!SCHOOL.hide)drawPlayer();
  drawParticles();
  /* v1.2.0: véu avermelhado quando a escola queima */
  if(SCHOOL.fire){
    const fa=clamp(.12+SCHOOL.fire.level*.4,0,.55);
    ctx.fillStyle='rgba(120,20,8,'+fa+')';ctx.fillRect(0,0,W,H);
  }
  drawDarkness(A);
  drawGrain();
  ctx.restore();
  if(SCHOOL.ritual)drawRitualFx();
  drawSchoolHUD();
  drawMsgs();
  if(SCHOOL.cine)drawCine();
  if(SCHOOL.mirrorCine)drawMirrorCine();
  if(SCHOOL.sink)drawSink();
  if(SCHOOL.scare)drawScare();
  if(SCHOOL.escape)drawEscape();/* v1.2.0: tela especial da fuga */
  if(SCHOOL.fade>0){ctx.fillStyle='rgba(3,2,4,'+clamp(SCHOOL.fade,0,1)+')';ctx.fillRect(0,0,W,H);}
  if(window.__EXPANSION)window.__EXPANSION.drawSchool(); /* v1.3.0: cutscenes de transição (≤1s) */
};

/* ============================================================
   INTEGRAÇÃO FINAL
   ============================================================ */
/* decaimentos que precisam de dt (rastro do espelho, glifos, fx) */
const _sUpd=window.SCHOOL_update;
window.SCHOOL_update=function(dt){
  if(SCHOOL.active){
    SCHOOL.mTrail=SCHOOL.mTrail||[];
    SCHOOL.mTrail.push({x:player.x,y:player.y});
    if(SCHOOL.mTrail.length>60)SCHOOL.mTrail.shift();
    if(SCHOOL.showGlyphs){SCHOOL.showGlyphs.t-=dt;if(SCHOOL.showGlyphs.t<=0)SCHOOL.showGlyphs=null;}
    if(SCHOOL.mirrorFx.lag>0)SCHOOL.mirrorFx.lag-=dt;
    if(SCHOOL.mirrorFx.creepy>0)SCHOOL.mirrorFx.creepy-=dt;
  }
  _sUpd(dt);
};
/* diagnóstico no console: window.__SCHOOL_INT.debug() */
window.__SCHOOL_INT=SCHOOL;
/* v1.2.0: ganchos de teste/depuração — o ato final inteiro inspecionável */
window.__SCHOOL_TEST={
  pickupFragment:pickupFragment,schoolInteract:schoolInteract,mirrorInteract:mirrorInteract,
  startRitual:startRitual,updateRitual:updateRitual,updateFlood:updateFlood,updateFire:updateFire,
  startFire:startFire,spawnYou:spawnYou,updateYou:updateYou,despawnYou:despawnYou,
  startEscapeWin:startEscapeWin,exitVictory:exitVictory,updateEscape:updateEscape,
  fragAvailable:fragAvailable,fragCount:fragCount,updateHunter:updateHunter,freshHunt:freshHunt,
  startReveal:startReveal,playerLooksAt:playerLooksAt,SCHOOL_AREAS:SCHOOL_AREAS,
  /* v1.2.1: acesso cru ao estado interno + sistema de esconderijo (testes) */
  S:function(){return SCHOOL;},tryHide:tryHide,updateHide:updateHide,updateHideDoom:updateHideDoom,
  HIDE_SPOTS:HIDE_SPOTS,startScare:startScare,updateScare:updateScare,schoolDie:schoolDie};
/* v0.9.12: olhar com o mouse na escola invertida — segure o botão pressionado */
window.addEventListener('pointerdown',function(e){if(game.state==='school'&&e.target===cv)SCHOOL._ptrDown=true;},true);
window.addEventListener('pointerup',function(){SCHOOL._ptrDown=false;},true);
window.addEventListener('pointercancel',function(){SCHOOL._ptrDown=false;},true);
window.addEventListener('blur',function(){SCHOOL._ptrDown=false;});
/* v1.2.0: tela especial de vitória — clique ou [Z] volta ao menu */
window.addEventListener('pointerdown',function(){
  if(SCHOOL.escape&&SCHOOL.escape.t>4.5)exitVictory();
},true);
window.addEventListener('keydown',function(e){
  if(SCHOOL.escape&&SCHOOL.escape.t>4.5&&(e.code==='KeyZ'||e.code==='Enter'||e.code==='Space'))exitVictory();
});
/* botão CONTINUAR */
const cbtn=ov('continueBtn');
if(cbtn)cbtn.addEventListener('click',function(){audio();resumeRun();});
try{
  /* v0.9.13: CONTINUAR persistente — localStorage (migra de sessionStorage) */
  let raw=null;
  try{raw=localStorage.getItem('thorCont'+activeSave);}catch(e){}
  if(!raw){try{raw=sessionStorage.getItem('thorCont'+activeSave);if(raw)localStorage.setItem('thorCont'+activeSave,raw);}catch(e){}}
  if(raw){const s=JSON.parse(raw);if(s&&s.v===2&&s.save===activeSave)SCHOOL.cont=s;}
}catch(e){}
/* debug por URL: ?escola=1 libera o card · ?frag=N pré-coleta fragmentos
   v0.9.12 FIX: ?frag=N agora também LIBERA AS CONDIÇÕES (livros, registros,
   relógios/pad, abrigo, espelho pronto, caçador ativo) e vale também na
   escola-dentro-da-run — antes era só visual e só no modo menu. */
try{
  const q=new URLSearchParams(location.search);
  SCHOOL._urlFrag=q.get('frag')!==null?clamp(parseInt(q.get('frag'),10)||0,0,8):null;
}catch(e){SCHOOL._urlFrag=null;}
function applyUrlFrag(){
  if(SCHOOL._urlFrag===null||SCHOOL._urlFrag===undefined||!SCHOOL.prog)return;
  const n=SCHOOL._urlFrag,p=SCHOOL.prog;
  for(let i=0;i<n&&i<8;i++)p.frags[i]=true;
  if(n>=3){p.books=[1,3,0,2,4];p.booksOk=true;}/* v1.2.0: 5 livros */
  if(n>=5){p.valves=[true,true,true,true];}
  if(n>=6){p.shed=true;}
  if(n>=7){p.clocks=[true,true,true];p.clockSeq=3;p.pad=true;p.mirrorReady=true;}
  if(n>=8){p.yourselfSeen=true;}/* v1.2.0 */
  if(SCHOOL.hunt&&!SCHOOL.hunt.state)SCHOOL.hunt=freshHunt();
  if(n>=1&&SCHOOL.hunt&&SCHOOL.hunt.state==='none')spawnHunter();
}
const _progLoad=progLoad;
progLoad=function(){
  _progLoad();
  applyUrlFrag();
};
/* título de morte especial da escola */
const _updDead=updateDead;
updateDead=function(dt){
  const h=ov('deadTitle');
  if(h)h.textContent=SCHOOL._customDeath||'VOCÊ CAIU';
  SCHOOL._customDeath=null;
  _updDead(dt);
};
/* botão CONTINUAR acompanha qualquer atualização do menu */
const _rmd=refreshMenuDev;
refreshMenuDev=function(){_rmd();try{refreshMenu();}catch(e){}};
/* começar uma run nova descarta o snapshot antigo */
const _startGame=startGame;
startGame=function(w){try{if(!SCHOOL.active)clearContinue();}catch(e){}_startGame(w);};
setInterval(function(){try{if(game.state==='menu')refreshMenu();}catch(e){}},600);
})();
