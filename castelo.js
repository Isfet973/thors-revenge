/* ============================================================
   THOR REVENGE — castelo.js v1 (O CONVITE — o castelo do bruno)
   v0.9.10 · reconstrução data-driven da fase secreta

   COMO ENTRAR: no menu, digite  b r u n o  (em qualquer tela do menu).
   A casa aceita o nome. O castelo lembra de você.

   FLUXO:
     portão → salão → corredor → escadaria real → galeria
     → SACADA (a lua racha · o sem-rosto emerge · cai)
     → capela (a casa reage) → cripta (O SEM-ROSTO, boss)
     → "o castelo te deixa ir."

   ESCALADA GROTESCA (grot 0→1): as paredes respiram, as cores adoecem,
   o cervo aparece cada vez mais perto, o HUD se corrompe, a casa
   sussurra. Tudo indexado ao progresso — o fim é o pior.

   MÚSICA (assets/audio/music/):
     castelo.mp3 · castelo-luta.mp3 · castelo-sacada.mp3 · castelo-boss.mp3

   SPRITES (assets/sprites/castelo/): veja COLOQUE-SPRITES-AQUI.txt
   ============================================================ */
(function(){
'use strict';

/* ---------------- sprites trocáveis da pasta ---------------- */
const SPR_DIR='assets/sprites/castelo/';
const SPR_EXTS=['png','jpg','jpeg','webp'];
const SPR={};const SPR_PROBED={};
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
['cervo','monge','penitente','vigilante','sem-rosto','rosto','lua'].forEach(sprGet);
function sprRescan(){for(const k in SPR){if(SPR[k]===null){delete SPR[k];delete SPR_PROBED[k];sprGet(k);}}}
setInterval(function(){if(!document.hidden)sprRescan();},15000);
window.CASTELLO_RESCAN_SPRITES=sprRescan;

/* ============================================================
   DADOS DO MAPA — edite aqui para mudar o castelo
   coll  : retângulos caminháveis
   doors : {x,y,to,side} — pares espelhados entre áreas
   decor : {x,y,k,..} k ∈ cruz|cruzInv|mesa|banco|quadro|janela|
           candel|estatua|altar|hatch|carroca|portaFalsa|vespera
   grot  : nível de grotesco alvo da área (0..1)
   ============================================================ */
const CASTLE_AREAS={
  portao:{
    name:'O PORTÃO',
    grot:.05,
    coll:[{x:150,y:170,w:980,h:470}],
    doors:[{x:1130,y:400,to:'hall',side:'e'}],
    cervo:{x:330,y:250},
    decor:[
      {x:260,y:470,k:'cruz',a:-.16},{x:420,y:560,k:'cruz',a:.1},
      {x:610,y:500,k:'cruz',a:-.05},{x:760,y:590,k:'cruz',a:.22},
      {x:900,y:480,k:'cruz',a:-.3},{x:520,y:300,k:'cruz',a:.14},
      {x:820,y:280,k:'cruz',a:-.09},{x:990,y:560,k:'carroca'},
      {x:1080,y:340,k:'estatua'}
    ]
  },
  hall:{
    name:'O SALÃO',
    grot:.25,
    coll:[{x:70,y:200,w:1140,h:380}],
    doors:[
      {x:80,y:390,to:'portao',side:'w'},
      {x:1200,y:390,to:'corredor',side:'e'},
      {x:640,y:210,to:'capela',side:'n'}
    ],
    hatch:{x:980,y:520},
    decor:[
      {x:560,y:390,k:'mesa'},{x:410,y:330,k:'banco'},{x:410,y:450,k:'banco'},
      {x:700,y:330,k:'banco'},{x:700,y:450,k:'banco'},
      {x:250,y:230,k:'quadro',olhos:true},{x:890,y:230,k:'quadro'},
      {x:340,y:250,k:'candel'},{x:940,y:250,k:'candel'},
      {x:200,y:540,k:'portaFalsa'},{x:1130,y:520,k:'portaFalsa'}
    ]
  },
  corredor:{
    name:'O CORREDOR DOS CRIADOS',
    grot:.4,
    coll:[{x:60,y:312,w:1160,h:116}],
    doors:[
      {x:70,y:370,to:'hall',side:'w'},
      {x:640,y:322,to:'escada',side:'n'}
    ],
    decor:[
      {x:220,y:340,k:'quadro',olhos:true},{x:390,y:340,k:'quadro',olhos:true},
      {x:560,y:340,k:'quadro'},{x:860,y:340,k:'quadro',olhos:true},
      {x:1030,y:340,k:'quadro'},
      {x:300,y:412,k:'portaFalsa'},{x:760,y:412,k:'portaFalsa'}
    ]
  },
  escada:{
    name:'A ESCADARIA',
    grot:.5,
    coll:[{x:560,y:90,w:170,h:570}],
    doors:[
      {x:645,y:648,to:'corredor',side:'s'},
      {x:645,y:100,to:'andar2',side:'n'}
    ],
    stairs:{topY:150,botY:560},
    decor:[{x:600,y:360,k:'candel'},{x:690,y:300,k:'estatua',pequena:true}]
  },
  andar2:{
    name:'A GALERIA',
    grot:.6,
    coll:[{x:80,y:240,w:1120,h:290}],
    doors:[
      {x:645,y:520,to:'escada',side:'s'},
      {x:1190,y:385,to:'sacada',side:'e'}
    ],
    vigilante:{x:200,y:330},
    decor:[
      {x:200,y:260,k:'janela'},{x:420,y:260,k:'janela'},{x:640,y:260,k:'janela'},
      {x:860,y:260,k:'janela'},{x:1060,y:260,k:'janela'},
      {x:330,y:460,k:'banco'},{x:760,y:470,k:'banco'},
      {x:960,y:320,k:'quadro',olhos:true}
    ]
  },
  sacada:{
    name:'A SACADA',
    grot:.75,
    coll:[{x:420,y:320,w:440,h:280}],
    doors:[{x:430,y:400,to:'andar2',side:'w'}],
    moon:{x:640,y:150,r:96},
    decor:[]
  },
  capela:{
    name:'A CAPELA',
    grot:.85,
    coll:[{x:330,y:190,w:620,h:410}],
    doors:[{x:640,y:590,to:'hall',side:'s'}],
    altar:{x:640,y:250},
    decor:[
      {x:380,y:230,k:'cruz'},{x:440,y:225,k:'cruz'},{x:500,y:232,k:'cruz'},
      {x:560,y:226,k:'cruz'},{x:720,y:228,k:'cruz'},{x:780,y:232,k:'cruz'},
      {x:840,y:226,k:'cruz'},{x:900,y:230,k:'cruz'},
      {x:430,y:420,k:'banco'},{x:430,y:500,k:'banco'},
      {x:850,y:420,k:'banco'},{x:850,y:500,k:'banco'},
      {x:360,y:330,k:'candel'},{x:920,y:330,k:'candel'}
    ]
  },
  cripta:{
    name:'A CRIPTA',
    grot:1,
    coll:[{x:210,y:230,w:860,h:380}],
    doors:[{x:640,y:240,to:'hall',side:'n'}],
    cervo:{x:1020,y:300},
    decor:[
      {x:280,y:300,k:'caixao'},{x:1000,y:480,k:'caixao'},
      {x:330,y:520,k:'candel'},{x:950,y:260,k:'candel'},
      {x:640,y:270,k:'estatua'}
    ]
  }
};

/* estado da fase */
const CASTLE={
  active:false,intro:null,area:'portao',fade:1,
  prog:null,grot:.05,grotT:.05,
  msgs:[],texts:[],shots:[],puddles:[],
  moon:null,fightT:0,bossSpawned:false,bossDead:false,ending:null,
  cervo:null,whisperT:9,heartT:0,titleT:0,_titleWas:null,
  _spdBase:0,_died:true,_deathTitle:null,cleared:false
};

/* ---------------- helpers locais ---------------- */
function msg(t,dur){CASTLE.msgs.push({txt:t,t:0,dur:dur||2.6});}
function cine(lines,total,snd){CASTLE.cine={t:0,lines:lines,total:total,snd:snd||null,sndDone:false};}
function ftext(x,y,txt,c,size){CASTLE.texts.push({x:x,y:y,txt:txt,t:0,life:1.1,c:c||'#c9a0ff',size:size||13});}
function noise2(dur,vol,freq,tipo){try{noiseSfx(dur,vol,freq,tipo||'lowpass');}catch(e){}}
function blip2(f0,f1,dur,vol){try{blip('sine',f0,f1,dur,vol||.04);}catch(e){}}
function sfx2(n){try{sfx[n]();}catch(e){}}

/* ============================================================
   ENTRADA / SAÍDA
   ============================================================ */
function invite(){
  if(CASTLE.active||CASTLE.intro)return;
  try{audio();}catch(e){}
  sfx2('glitch');blip2(52,38,2.2,.09);
  game.flash=Math.max(game.flash||0,.5);game.shake=Math.max(game.shake||0,10);
  CASTLE.active=true;window.__CASTLE_ACTIVE=true;CASTLE._died=false;
  CASTLE.prog={moonDone:false,hallSeen:false,capelaSeen:false,capelaMoon:false,cervoScare:0,visits:0,corridorSeed:false};
  CASTLE.area='portao';CASTLE.grot=.05;CASTLE.grotT=.05;
  CASTLE.moon=null;CASTLE.bossSpawned=false;CASTLE.bossDead=false;CASTLE.ending=null;
  CASTLE.shots.length=0;CASTLE.puddles.length=0;CASTLE.msgs.length=0;CASTLE.texts.length=0;
  /* a casa empresta os dentes se você chegou sem arma */
  if(!game.weapon){game.weapon='bite';game.hasBite=true;game.hasShot=false;}
  try{bullets.length=0;ebullets.length=0;pickups.length=0;enemies.length=0;game.portal=null;}catch(e){}
  ['menu','dead','win','pause','levelup','weapons','options','book','lab','saves','shop','cheatmenu','limboLoading','circles'].forEach(hideOv);
  blurActive();
  CASTLE.intro={t:0};
  game.state='castleintro';
}
function beginPlay(){
  CASTLE.intro=null;
  game.state='castle';
  game.fallK=-1;player.inv=Math.max(player.inv,1);
  enterArea('portao',null,true);
}
function enterArea(id,fromId,silent){
  const A=CASTLE_AREAS[id];if(!A)return;
  CASTLE.area=id;CASTLE.prog.visits++;
  CASTLE.grotT=A.grot;
  game.absRects=A.coll.map(r=>({x:r.x,y:r.y,w:r.w,h:r.h}));
  game.absMain=game.absRects[0];
  game.decor=[];game.doors=[];game.portal=null;
  try{bullets.length=0;CASTLE.shots.length=0;enemies.length=0;ebullets.length=0;}catch(e){}
  CASTLE.puddles.length=0;
  let px=null,py=null;
  if(fromId){
    const d=A.doors.find(d=>d.to===fromId);
    if(d){const off={n:[0,34],s:[0,-34],e:[-34,0],w:[34,0]}[d.side]||[0,0];px=d.x+off[0];py=d.y+off[1];}
  }
  if(px===null){px=A.coll[0].x+A.coll[0].w/2;py=A.coll[0].y+A.coll[0].h*.68;}
  player.x=px;player.y=py;player.mvx=0;player.mvy=0;
  clampArena(player,player.r);
  CASTLE.fade=silent?1:.95;
  spawnAreaStuff(id);
  if(!silent)noise2(.5,.02,300);
  if(id==='hall'&&!CASTLE.prog.hallSeen){
    CASTLE.prog.hallSeen=true;
    if(!CASTLE.prog.moonDone){
      cine([
        {txt:'a casa está arrumada.',at:.6,dur:2.4},
        {txt:'alguém ainda a arruma.',at:3.1,dur:2.6}
      ],6.4,null);
    }
  }
  if(id==='sacada'&&!CASTLE.prog.moonDone&&!CASTLE.moon){
    CASTLE.moon={t:0,phase:0}; /* a sequência começa */
  }
  if(id==='sacada'&&CASTLE.prog.moonDone){
    msg('a lua ficou onde ela caiu.',3);
  }
  if(id==='capela'){
    if(!CASTLE.prog.capelaSeen){
      CASTLE.prog.capelaSeen=true;
      cine([
        {txt:'as cruzes estão de cabeça para baixo.',at:.8,dur:2.8},
        {txt:'não eram.',at:3.6,dur:2.2}
      ],7,null);
    }
    if(CASTLE.prog.moonDone&&!CASTLE.prog.capelaMoon){
      CASTLE.prog.capelaMoon=true;
      msg('as cruzes viraram enquanto você olhava.',3.2);
    }
    /* a casa reage: a capela é o covil depois da lua */
    if(CASTLE.prog.moonDone){
      spawnEnemyC('monge',480,430);
      spawnEnemyC('penitente',800,430);
    }
  }
  if(id==='cripta'&&!CASTLE.bossSpawned&&!CASTLE.bossDead){
    CASTLE.bossSpawned=true;
    cine([
      {txt:'a lua está aqui embaixo.',at:.7,dur:2.6},
      {txt:'ele caiu até aqui.',at:3.4,dur:2.8}
    ],7.4,{at:3.4,fn:function(){noise2(1.6,.05,120);blip2(46,30,2,.07);},onEnd:function(){if(CASTLE.area==='cripta'&&!CASTLE.bossDead)spawnEnemyC('semrosto',640,500);}});
  }
}
function castleLeave(){
  if(CASTLE._spdBase>0){P.speedMult=CASTLE._spdBase;CASTLE._spdBase=0;}
  CASTLE.active=false;window.__CASTLE_ACTIVE=false;
  CASTLE.moon=null;CASTLE.cine=null;CASTLE.ending=null;CASTLE._deathTitle=null;
  /* travessia de porta nunca fica congelada */
  try{game.fallK=-1;game.fallFrom=null;game.fallTo=null;game.fallTarget=null;}catch(e){}
  try{enemies.length=0;bullets.length=0;ebullets.length=0;pickups.length=0;}catch(e){}
}
function returnToMenu(){
  const cleared=CASTLE.cleared;
  castleLeave();
  game.paused=false;game.state='menu';
  ['menu','dead','win','pause','levelup','weapons','options','book','lab','saves','shop','cheatmenu','limboLoading','circles'].forEach(hideOv);
  showOv('menu');
  try{initAttract();refreshMenuDev();}catch(e){}
  if(cleared){
    const chip=ov('verChip')||document.querySelector('.ver');
    if(chip)chip.textContent='v0.9.10 · A CASA LEMBRA';
  }
}
function castleDie(reason){
  if(CASTLE._died)return;
  CASTLE._died=true;
  game.deadTaunt=reason==='boss'?'a casa guardou o que sobrou.':'você era convidado, não hóspede.';
  castleLeave();
  CASTLE._deathTitle='O CASTELO TE GUARDA'; /* depois do leave (leave reseta) */
  try{clearContinue();}catch(e){}
  if(!player.dead){
    META.deaths++;saveMeta();
    player.hp=0;player.dead=true;game.state='dead';game.deadT=0;game.overlayShown=false;
    try{sfx.die();noiseSfx(1,.07,240,'lowpass');}catch(e){}
  }
}

/* ============================================================
   INTRO (tela preta)
   ============================================================ */
window.CASTELLO_updateIntro=function(dt){
  CASTLE.intro.t+=dt;
  const t=CASTLE.intro.t;
  if((t>3&&(held('interact')||held('active')))||t>=9)beginPlay();
};
window.CASTELLO_drawIntro=function(){
  ctx.fillStyle='#020103';ctx.fillRect(0,0,W,H);
  const t=CASTLE.intro.t;
  const io=function(a,b,c,d){return ramp(t,a,b)*(1-ramp(t,c,d));};
  ctx.globalAlpha=io(.9,1.7,2.9,3.5);
  if(t>.9)txt('você digitou um nome que não era seu.',W/2,H*.44,MONO,14,'#5a5148','center',2);
  ctx.globalAlpha=io(3.4,4.2,6.4,7.2);
  if(t>3.4){txt('a casa aceitou.',W/2,H*.47,DISP,Math.round(W*.024),'#9c8f7c','center',1);noise2(.3,.012,180);}
  ctx.globalAlpha=io(5.2,6.2,8.6,9.4);
  if(t>5.2){
    txt('O CONVITE',W/2,H*.5,DISP,Math.round(W*.052),'#b8a888','center',6);
    txt('digite o nome dele de novo, se precisar',W/2,H*.58,MONO,11,'#4a4238','center',2);
  }
  ctx.globalAlpha=1;
  if(t>4&&Math.random()<.005)noise2(.4,.012,150);
};

/* ============================================================
   MÚSICA — a fase informa o próprio modo
   ============================================================ */
function musicMode(){
  if(!CASTLE.active)return null;
  if(CASTLE.ending)return 'castelo:sacada';               /* fim: quase silêncio */
  const boss=enemies.find?enemies.find(function(e){return e.type==='semrosto'&&!e.dead;}):null;
  if(CASTLE.bossSpawned&&boss)return 'castelo:boss';
  if(CASTLE.area==='sacada'&&CASTLE.moon&&!CASTLE.prog.moonDone)return 'castelo:sacada';
  if(CASTLE.fightT>0)return 'castelo:luta';
  return 'castelo';
}

/* ============================================================
   SPAWNS LOCAIS
   ============================================================ */
function spawnEnemyC(kind,x,y){
  const base={monge:{hp:120,r:17,spd:56},penitente:{hp:200,r:19,spd:44},
    vigilante:{hp:150,r:16,spd:250},semrosto:{hp:1100,r:46,spd:62}}[kind];
  const e={type:kind,x:x,y:y,r:base.r,hp:base.hp,maxHp:base.hp,spd:base.spd,
    seed:rnd(TAU),flash:0,spawnT:0,dead:false,
    atkCd:rnd(1,2.4),st:'idle',stT:0,face:0,vulnT:0,drag:0,
    vx:0,vy:0,teleT:0,screechT:0};
  enemies.push(e);
  return e;
}
function spawnAreaStuff(id){
  CASTLE.cervo=null;
  const A=CASTLE_AREAS[id];
  /* o cervo — cada vez mais perto (A② / B⑦) */
  if(A.cervo){
    CASTLE.cervo={x:A.cervo.x,y:A.cervo.y,tier:CASTLE.prog.cervoScare,fade:1,alive:true,blink:0};
  }
  /* inimigos por área/progresso */
  if(id==='corredor'&&!CASTLE.prog.moonDone){
    spawnEnemyC('monge',900,370);
  }
  if(id==='andar2'){
    spawnEnemyC('vigilante',A.vigilante?A.vigilante.x:200,A.vigilante?A.vigilante.y:330);
  }
  if(id==='hall'&&CASTLE.prog.moonDone){
    spawnEnemyC('penitente',300,420);
  }
  if(id==='cripta'&&CASTLE.bossSpawned&&!CASTLE.bossDead){
    /* o boss sobe do chão depois da cine */
    setTimeoutC(function(){if(CASTLE.area==='cripta'&&!CASTLE.bossDead)spawnEnemyC('semrosto',640,500);},2.4);
  }
}
const _timersC=[];
function setTimeoutC(fn,s){_timersC.push({fn:fn,t:s});}
function tickTimeoutC(dt){
  for(let i=_timersC.length-1;i>=0;i--){
    _timersC[i].t-=dt;
    if(_timersC[i].t<=0){const f=_timersC[i].fn;_timersC.splice(i,1);f();}
  }
}

/* ============================================================
   UPDATE PRINCIPAL
   ============================================================ */
window.CASTELLO_update=function(dt){
  /* o motor pode matar o jogador direto (hurtPlayer) — conclui a morte do castelo */
  if(player.dead){castleDie('castle');return;}
  if(CASTLE.fade>0)CASTLE.fade=Math.max(0,CASTLE.fade-dt*1.35);
  for(let i=CASTLE.msgs.length-1;i>=0;i--){const m=CASTLE.msgs[i];m.t+=dt;if(m.t>=m.dur)CASTLE.msgs.splice(i,1);}
  for(let i=CASTLE.texts.length-1;i>=0;i--){const t=CASTLE.texts[i];t.t+=dt;if(t.t>=t.life)CASTLE.texts.splice(i,1);}
  /* grotesco sobe devagar até o alvo da área */
  CASTLE.grot+=(CASTLE.grotT-CASTLE.grot)*Math.min(1,dt*.14);
  if(CASTLE.fightT>0)CASTLE.fightT-=dt;
  /* cine */
  if(CASTLE.cine){
    const c=CASTLE.cine;c.t+=dt;
    if(c.snd&&!c.sndDone&&c.t>=c.snd.at){c.sndDone=true;try{c.snd.fn();}catch(e){}}
    if(Math.random()<dt*2)particles.push({x:rnd(0,W),y:rnd(0,H),vx:rnd(-6,6),vy:rnd(-14,-4),life:rnd(1,2),t:0,r:1.5,c:'rgba(90,85,90,0.25)',drag:.99,glow:false});
    if(c.t>=c.total){CASTLE.cine=null;if(c.snd&&c.snd.onEnd){try{c.snd.onEnd();}catch(e){}}}
    return;
  }
  if(CASTLE.ending){updateEnding(dt);return;}
  if(CASTLE.moon){updateMoon(dt);}
  tickTimeoutC(dt);
  updatePlayer(dt);
  /* armas do motor funcionam contra os inimigos do castelo */
  updateShot(dt);
  if(game.hasBite)updateBite(dt);
  updateChainsaw(dt);
  updateNova(dt);
  updateStakes(dt);
  updateMagics(dt);
  updateShock(dt);
  updateHammers(dt);
  updateBullets(dt);
  updateLightning(dt);
  thrownSawCleanup();
  /* IA própria dos inimigos do castelo */
  updateCastleEnemies(dt);
  updateShots(dt);
  updatePuddles(dt);
  updatePickupsLocal(dt);
  castleDoors(dt);
  updateCervo(dt);
  /* lentidão na escadaria — escada DE VERDADE */
  const A=CASTLE_AREAS[CASTLE.area];
  if(A.stairs){
    const onStair=player.y>A.stairs.topY-10&&player.y<A.stairs.botY+10;
    const climbing=player.mvy<-0.1;
    if(CASTLE._spdBase<=0)CASTLE._spdBase=P.speedMult||1;
    P.speedMult=CASTLE._spdBase*(onStair?.45:1);
    if(onStair&&climbing){
      CASTLE._stepT=(CASTLE._stepT||0)-dt;
      if(CASTLE._stepT<=0){CASTLE._stepT=.34;noise2(.09,.018,220);if(Math.random()<.3)sfx2('creak');}
    }
  }else if(CASTLE._spdBase>0){P.speedMult=CASTLE._spdBase;CASTLE._spdBase=0;}
  /* poças do monge freadas */
  let onPuddle=false;
  for(const p of CASTLE.puddles)if(dist(player.x,player.y,p.x,p.y)<p.r)onPuddle=true;
  if(onPuddle&&CASTLE._spdBase>0)P.speedMult=CASTLE._spdBase*.55;
  /* atmosfera: batida do coração da casa (B⑦) */
  if(CASTLE.grot>.45){
    CASTLE.heartT-=dt;
    if(CASTLE.heartT<=0){
      CASTLE.heartT=1.5-CASTLE.grot*.85;
      blip2(58,44,.16,.028);setTimeoutC(function(){blip2(52,40,.14,.02);},.22);
    }
  }
  /* sussurros (A②) */
  CASTLE.whisperT-=dt;
  if(CASTLE.whisperT<=0){
    CASTLE.whisperT=14+rnd(0,16)-CASTLE.grot*6;
    whisper();
  }
  /* HUD corrompido pisca o título da janela (A②) */
  if(CASTLE.grot>.6&&Math.random()<dt*.02){
    CASTLE._titleWas=document.title;
    document.title=pick(['não olhe para a lua','ele está em casa','a casa lembra','thor']);
    CASTLE.titleT=2.2;
  }
  if(CASTLE.titleT>0){CASTLE.titleT-=dt;if(CASTLE.titleT<=0&&CASTLE._titleWas){document.title=CASTLE._titleWas;CASTLE._titleWas=null;}}
  if(player.dead&&game.state!=='dead')castleDie('fall');
};

function thrownSawCleanup(){if(thrownSaw){thrownSaw=null;}}

/* sussurros — texto errado em lugar errado (A②) */
const WHISPERS=['ele está em casa.','a casa lembra de você.','não olhe para a lua.',
  'os passos pararam com os seus.','algo se arrastou no andar de cima.',
  'a lua caiu uma vez.','o nome dele não é bruno.','você já esteve aqui.'];
function whisper(){
  noise2(.5,.014,rnd(120,320));
  if(Math.random()<.6)msg(pick(WHISPERS),3);
}

/* ============================================================
   PORTAS / ALÇAPÃO
   ============================================================ */
function castleDoors(dt){
  if(game.fallK>=0)return;
  const A=CASTLE_AREAS[CASTLE.area];
  /* alçapão do salão → cripta (abre depois da lua) */
  if(A.hatch&&CASTLE.prog.moonDone&&!CASTLE.bossDead){
    if(dist(player.x,player.y,A.hatch.x,A.hatch.y)<40&&!(CASTLE._hatchCd>0)){
      CASTLE._hatchCd=2;
      game.fallK=0;game.fallFrom={x:player.x,y:player.y};game.fallTo={x:A.hatch.x,y:A.hatch.y-40};
      game.fallTarget={castle:'cripta',dir:CASTLE.area};
      noise2(.8,.05,140);sfx2('thud');
      return;
    }
  }
  if(CASTLE._hatchCd>0)CASTLE._hatchCd-=dt;
  for(const d of A.doors){
    if(dist(player.x,player.y,d.x,d.y)<26){
      if(CASTLE.area==='sacada'&&d.to==='andar2'&&CASTLE.moon&&CASTLE.moon.phase<5&&!CASTLE.prog.moonDone){
        msg('a lua não terminou com você.',2.4);
        clampArena(player,player.r);return;
      }
      game.fallK=0;game.fallFrom={x:player.x,y:player.y};game.fallTo={x:d.x,y:d.y};
      game.fallTarget={castle:d.to,dir:CASTLE.area};
      sfx2('howl');
      return;
    }
  }
}

/* ============================================================
   A LUA — racha → o sem-rosto emerge → cai (B③)
   ============================================================ */
function updateMoon(dt){
  const m=CASTLE.moon;if(!m)return;
  m.t+=dt;
  const A=CASTLE_AREAS.sacada;
  if(m.phase===0){ /* silêncio antes */
    if(m.t>3.2){m.phase=1;m.t=0;noise2(.4,.02,900,'bandpass');}
  }else if(m.phase===1){ /* racha crescendo */
    if(Math.random()<dt*3)noise2(.06,.014,rnd(700,1600),'bandpass');
    game.shake=Math.max(game.shake,.6);
    if(m.t>3){m.phase=2;m.t=0;blip2(220,60,1.4,.05);noise2(.9,.04,220);}
  }else if(m.phase===2){ /* o sem-rosto emerge da racha */
    if(m.t>5){m.phase=3;m.t=0;whisper();}
  }else if(m.phase===3){ /* pende lá em cima, olha */
    if(Math.random()<dt*.5)noise2(.3,.008,500,'bandpass');
    if(m.t>4.6){m.phase=4;m.t=0;noise2(.2,.03,600,'highpass');}
  }else if(m.phase===4){ /* CAI da tela */
    game.shake=Math.max(game.shake,1.5);
    if(m.t>1.15){
      m.phase=5;m.t=0;
      game.shake=14;sfx2('boom');noise2(1.4,.06,110);blip2(40,26,1.6,.08);
    }
  }else if(m.phase===5){ /* silêncio... e o rugido longe */
    if(!m.roared&&m.t>2.6){
      m.roared=true;
      blip2(90,34,2.4,.06);noise2(2.2,.045,90);
      msg('algo caiu em algum lugar embaixo.',3.4);
    }
    if(m.t>4.8){
      CASTLE.moon=null;CASTLE.prog.moonDone=true;
      msg('o salão tem um alçapão aberto agora.',4);
    }
  }
}

/* ============================================================
   INIMIGOS DO CASTELO — IA própria (o motor só entrega o dano)
   ============================================================ */
function updateCastleEnemies(dt){
  const list=enemies.filter?enemies.filter(function(e){return !e.dead;}):[];
  for(const e of list){
    e.spawnT=Math.min(1,e.spawnT+dt*1.6);
    e.flash=Math.max(0,e.flash-dt*6);
    if(e.vulnT>0)e.vulnT-=dt;
    const dp=dist(player.x,player.y,e.x,e.y);
    if(e.type==='monge')upMonge(e,dt,dp);
    else if(e.type==='penitente')upPenitente(e,dt,dp);
    else if(e.type==='vigilante')upVigilante(e,dt,dp);
    else if(e.type==='semrosto')upBoss(e,dt,dp);
    /* morte (o motor já tirou o hp; killEnemy já rodou) */
  }
  /* limpa mortos e reage */
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(!e.dead)continue;
    if(e.type==='semrosto'&&!CASTLE.bossDead){
      CASTLE.bossDead=true;
      startEnding();
    }
    enemies.splice(i,1);
  }
}
function moveTowards(e,tx,ty,spd,dt){
  const a=Math.atan2(ty-e.y,tx-e.x);
  e.face=a;
  const nx=e.x+Math.cos(a)*spd*dt,ny=e.y+Math.sin(a)*spd*dt;
  const probe={x:nx,y:ny};
  clampArena(probe,e.r);
  e.x=probe.x;e.y=probe.y;
}
function contactHurt(e,dp){
  if(dp<e.r+player.r-4&&player.inv<=0&&player.dashT<=0){
    hurtPlayer();
    CASTLE.fightT=4;
    const a=Math.atan2(player.y-e.y,player.x-e.x);
    player.x+=Math.cos(a)*26;player.y+=Math.sin(a)*26;clampArena(player,player.r);
  }
}
/* MONGE AFOGADO — molhado, lento, cospe água, deixa poças */
function upMonge(e,dt,dp){
  if(dp>60)moveTowards(e,player.x,player.y,e.spd*(CASTLE.grot*.4+.8),dt);
  e.atkCd-=dt;
  if(e.atkCd<=0&&dp<440){
    e.atkCd=2.8;
    e.st='spit';e.stT=.5;
    const a=Math.atan2(player.y-e.y,player.x-e.x);
    for(let i=-1;i<=1;i++){
      const aa=a+i*.22;
      CASTLE.shots.push({x:e.x+Math.cos(aa)*18,y:e.y+Math.sin(aa)*18,
        vx:Math.cos(aa)*230,vy:Math.sin(aa)*230,r:7,c:'#7fb2c9',dmg:12,life:2.6,wet:true});
    }
    noise2(.25,.03,700,'bandpass');
  }
  if(e.st==='spit'){e.stT-=dt;if(e.stT<=0)e.st='idle';}
  /* poça ao parar */
  e.pudT=(e.pudT||rnd(2,4))-dt;
  if(e.pudT<=0){e.pudT=3;CASTLE.puddles.push({x:e.x,y:e.y,r:26,life:6,t:0});}
  contactHurt(e,dp);
}
/* O PENITENTE — arrasta correntes; chicoteia à frente; ajoelha depois */
function upPenitente(e,dt,dp){
  if(e.st==='idle'){
    moveTowards(e,player.x,player.y,e.spd*(CASTLE.grot*.3+.85),dt);
    if(dp<250&&e.atkCd<=0){e.st='tele';e.stT=.7;e.face=Math.atan2(player.y-e.y,player.x-e.x);sfx2('creak');}
    e.atkCd-=dt;
  }else if(e.st==='tele'){
    e.stT-=dt;
    if(e.stT<=0){
      e.st='kneel';e.stT=1.4;e.vulnT=1.4;e.atkCd=2.6;
      noise2(.3,.05,180);sfx2('slash');
      const d=dist(player.x,player.y,e.x,e.y);
      if(d<170&&Math.abs(angDiff(Math.atan2(player.y-e.y,player.x-e.x),e.face))<1.15){
        hurtPlayer();CASTLE.fightT=4;
      }
      /* marcou o chão */
      CASTLE.texts.push({x:e.x,y:e.y-46,txt:'-',t:0,life:.5,c:'#8a2a3a',size:20});
    }
  }else if(e.st==='kneel'){
    e.stT-=dt;if(e.stT<=0)e.st='idle';
  }
  contactHurt(e,dp);
}
/* A VIGILANTE — anjo de lapis: congela se olhada; avança se não */
function upVigilante(e,dt,dp){
  const looking=Math.abs(angDiff(Math.atan2(e.y-player.y,e.x-player.x),player.angle))<.6;
  if(e.st==='gone'){
    e.stT-=dt;
    if(e.stT<=0){
      const A=CASTLE_AREAS[CASTLE.area];
      e.x=A.coll[0].x+A.coll[0].w*rnd(.15,.85);
      e.y=A.coll[0].y+A.coll[0].h*rnd(.15,.85);
      e.st='idle';e.fade=0;
    }
    return;
  }
  if(looking&&dp>70){
    e.st='still';e.fade=Math.min(1,(e.fade||0)+dt*2);
    if(Math.random()<dt*.6)blip2(1200,1180,.05,.012);
  }else{
    e.st='walk';
    moveTowards(e,player.x,player.y,e.spd,dt);
    if(dp<44){
      hurtPlayer();CASTLE.fightT=4;
      noise2(.5,.06,900,'highpass');
      msg('ela segurou sua mão. fria.',2.6);
      e.st='gone';e.stT=3.5;
    }
  }
  contactHurt(e,dp);
}

/* balas do castelo (água/orbes) — colisão própria com o jogador */
function updateShots(dt){
  for(let i=CASTLE.shots.length-1;i>=0;i--){
    const s=CASTLE.shots[i];
    s.life-=dt;
    if(s.homing){
      const a=Math.atan2(player.y-s.y,player.x-s.x);
      const sp=Math.hypot(s.vx,s.vy);
      const ca=Math.atan2(s.vy,s.vx);
      const na=ca+angDiff(a,ca)*Math.min(1,s.homing*dt);
      s.vx=Math.cos(na)*sp;s.vy=Math.sin(na)*sp;
    }
    s.x+=s.vx*dt;s.y+=s.vy*dt;
    if(Math.random()<.3)particles.push({x:s.x,y:s.y,vx:rnd(-8,8),vy:rnd(-8,8),life:.3,t:0,r:1.5,c:s.c,glow:true});
    let kill=s.life<=0;
    for(const rc of game.absRects)if(s.x<rc.x+4||s.x>rc.x+rc.w-4||s.y<rc.y+4||s.y>rc.y+rc.h-4)kill=true;
    if(!kill&&dist(s.x,s.y,player.x,player.y)<s.r+player.r-4){
      if(player.inv<=0&&player.dashT<=0){hurtPlayer();CASTLE.fightT=4;}
      kill=true;
    }
    if(kill)CASTLE.shots.splice(i,1);
  }
}
function updatePuddles(dt){
  for(let i=CASTLE.puddles.length-1;i>=0;i--){
    const p=CASTLE.puddles[i];p.life-=dt;p.t+=dt;
    if(p.life<=0)CASTLE.puddles.splice(i,1);
  }
}
/* coleta simples de almas/corações derrubados pelos inimigos */
function updatePickupsLocal(dt){
  for(let i=pickups.length-1;i>=0;i--){
    const p=pickups[i];p.t=(p.t||0)+dt;
    if(dist(p.x,p.y,player.x,player.y)<30){
      if(p.type==='soul'){try{gainSouls(1);}catch(e){}}
      else if(p.type==='heart'){player.hp=Math.min(player.maxHp,player.hp+20);sfx2('heart');}
      else if(p.type==='chest'){pickups.splice(i,1);continue;}
      pickups.splice(i,1);
    }
  }
}

/* ============================================================
   O CERVO — testemunha (nunca ataca; sempre mais perto)
   ============================================================ */
function updateCervo(dt){
  const c=CASTLE.cervo;if(!c||!c.alive)return;
  c.blink-=dt;if(c.blink<-.12)c.blink=rnd(2,5);
  const dp=dist(player.x,player.y,c.x,c.y);
  const scareR=Math.max(120,190-c.tier*22);
  if(dp<scareR){
    c.alive=false;
    CASTLE.prog.cervoScare++;
    noise2(.4,.02,340);blip2(300,180,.3,.03);
    const msgsC=['o cervo atravessou a parede.','o cervo estava mais perto dessa vez.',
      'o cervo não usou a porta.','o cervo vai estar do outro lado.',
      'o cervo espera você descer.'];
    msg(msgsC[Math.min(msgsC.length-1,CASTLE.prog.cervoScare-1)],3.2);
    CASTLE.cervo.fade=0;
  }
}

/* ============================================================
   O SEM-ROSTO — boss da cripta (B③⑤: ele é o que caiu da lua)
   ============================================================ */
function upBoss(e,dt,dp){
  const ph=e.hp/e.maxHp>.62?1:(e.hp/e.maxHp>.3?2:3);
  e.ph=ph;
  if(e.st==='teleout'){
    e.teleT-=dt;
    if(e.teleT<=0){
      const a=player.angle+Math.PI;
      e.x=clamp(player.x+Math.cos(a)*130,game.absRects[0].x+60,game.absRects[0].x+game.absRects[0].w-60);
      e.y=clamp(player.y+Math.sin(a)*130,game.absRects[0].y+60,game.absRects[0].y+game.absRects[0].h-60);
      e.st='telein';e.stT=.32;
      noise2(.5,.05,1500,'highpass');sfx2('roar');
      if(ph>=2){
        const n=8;
        for(let i=0;i<n;i++){
          const aa=i/n*TAU;
          CASTLE.shots.push({x:e.x,y:e.y,vx:Math.cos(aa)*160,vy:Math.sin(aa)*160,
            r:9,c:'#cfd4d8',dmg:14,life:3.4,homing:.5});
        }
      }
    }
    return;
  }
  if(e.st==='telein'){e.stT-=dt;if(e.stT<=0)e.st='idle';return;}
  if(e.st==='swipe'){
    e.stT-=dt;
    if(e.stT<=0){
      e.st='idle';e.atkCd=Math.max(.8,2.3-ph*.5);
      const d=dist(player.x,player.y,e.x,e.y);
      if(d<150+e.r&&Math.abs(angDiff(Math.atan2(player.y-e.y,player.x-e.x),e.face))<1.2){
        hurtPlayer();CASTLE.fightT=4;
      }
      noise2(.25,.05,200);
    }
    return;
  }
  /* perseguir + puxão na fase 3 */
  moveTowards(e,player.x,player.y,e.spd*(1+(ph-1)*.45),dt);
  if(ph===3){
    const a=Math.atan2(e.y-player.y,e.x-player.x);
    player.x+=Math.cos(a)*26*dt;player.y+=Math.sin(a)*26*dt;
    clampArena(player,player.r);
  }
  e.atkCd-=dt;
  if(e.atkCd<=0){
    if(dp<190&&Math.random()<.55){
      e.st='swipe';e.stT=.55;e.face=Math.atan2(player.y-e.y,player.x-e.x);
      noise2(.15,.03,300,'bandpass');
    }else{
      e.atkCd=Math.max(.9,2.2-ph*.45);
      const base=Math.atan2(player.y-e.y,player.x-e.x);
      const n=ph===1?3:ph===2?5:7;
      for(let i=0;i<n;i++){
        const aa=base+(i-(n-1)/2)*.24;
        CASTLE.shots.push({x:e.x+Math.cos(aa)*30,y:e.y+Math.sin(aa)*30,
          vx:Math.cos(aa)*200,vy:Math.sin(aa)*200,r:8,c:'#cfd4d8',dmg:13,
          life:3.2,homing:ph===3?.9:.55});
      }
      noise2(.3,.03,420,'bandpass');
    }
  }
  if(ph===2&&Math.random()<dt*.14){e.st='teleout';e.teleT=.4;}
  contactHurt(e,dp);
}

/* ============================================================
   FIM — "o castelo te deixa ir."
   ============================================================ */
function startEnding(){
  CASTLE.ending={t:0};
  CASTLE.shots.length=0;
  sfx2('echo');blip2(120,60,2.4,.05);
  for(let i=0;i<26;i++)particles.push({x:640+rnd(-60,60),y:300+rnd(-40,40),vx:rnd(-40,40),vy:rnd(-70,-10),life:rnd(1.2,2.6),t:0,r:rnd(1,2.5),c:'#d8cfc0',drag:.985,glow:true});
}
function updateEnding(dt){
  const en=CASTLE.ending;en.t+=dt;
  if(en.t>6.4&&!en.done){
    en.done=true;
    CASTLE.cleared=true;
    META.casteloCleared=true;saveMeta();
  }
  if(en.t>8.2)returnToMenu();
}

/* ============================================================
   INTERAÇÃO (Z) — alçapão / altar
   ============================================================ */
function castleInteract(){
  if(!CASTLE.active||player.dead||CASTLE.cine||CASTLE.ending)return;
  const A=CASTLE_AREAS[CASTLE.area];
  if(A.altar&&dist(player.x,player.y,A.altar.x,A.altar.y)<70){
    msg('o altar está limpo. ninguém lavou.',2.8);
    noise2(.4,.015,260);return;
  }
  if(A.hatch&&CASTLE.prog.moonDone&&dist(player.x,player.y,A.hatch.x,A.hatch.y)<60){
    castleDoors(0); /* força a travessia */
  }
}
window.CASTELLO_interact=castleInteract;

/* ============================================================
   RENDER
   ============================================================ */
/* paleta que ADOECE com o grot (B⑦) */
function sick(c1,c2){return CASTLE.grot>.55?c2:c1;}
function drawAreaFloor(A){
  const rc=A.coll[0];
  const g=ctx.createLinearGradient(rc.x,rc.y,rc.x,rc.y+rc.h);
  const cols={portao:['#0c130d','#111a12'],hall:['#151016','#1c141c'],
    corredor:['#120e14','#191219'],escada:['#17141a','#1e1a20'],
    andar2:['#1a1014','#221518'],sacada:['#0e0f14','#141722'],
    capela:['#131118','#1a1520'],cripta:['#0c0b10','#131118']}[CASTLE.area]||['#12101a','#191520'];
  g.addColorStop(0,sick(cols[0],'#131611'));
  g.addColorStop(1,sick(cols[1],'#1a1e17'));
  ctx.fillStyle=g;ctx.fillRect(rc.x,rc.y,rc.w,rc.h);
  /* ladrilhos */
  ctx.strokeStyle='rgba(255,255,255,0.025)';ctx.lineWidth=1;
  for(let x=rc.x+40;x<rc.x+rc.w;x+=40){ctx.beginPath();ctx.moveTo(x,rc.y);ctx.lineTo(x,rc.y+rc.h);ctx.stroke();}
  for(let y=rc.y+40;y<rc.y+rc.h;y+=40){ctx.beginPath();ctx.moveTo(rc.x,y);ctx.lineTo(rc.x+rc.w,y);ctx.stroke();}
  /* sacada: céu + chão de pedra */
  if(CASTLE.area==='sacada'){
    const sky=ctx.createLinearGradient(0,0,0,H*.6);
    sky.addColorStop(0,'#04050c');sky.addColorStop(1,'#0b0d18');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H*.62);
  }
}
/* paredes que RESPIRAM (B⑦) */
function drawWalls(A){
  const rc=A.coll[0];
  const amp=1+3*CASTLE.grot;
  const t=game.t*(.5+CASTLE.grot*.9);
  const wob=function(v){return Math.sin(t+v)*amp;};
  ctx.strokeStyle=sick('#2e2836','#2c332a');ctx.lineWidth=6;
  ctx.beginPath();
  ctx.moveTo(rc.x+wob(0),rc.y+wob(1));
  ctx.lineTo(rc.x+rc.w+wob(2),rc.y+wob(3));
  ctx.lineTo(rc.x+rc.w+wob(4),rc.y+rc.h+wob(5));
  ctx.lineTo(rc.x+wob(6),rc.y+rc.h+wob(7));
  ctx.closePath();ctx.stroke();
  /* portas */
  for(const d of A.doors){
    ctx.save();ctx.translate(d.x,d.y);
    const horiz=d.side==='e'||d.side==='w';
    ctx.fillStyle='#060509';
    if(horiz)ctx.fillRect(-8,-26,16,52);else ctx.fillRect(-26,-8,52,16);
    ctx.strokeStyle=sick('#4a4152','#4a5244');ctx.lineWidth=2;
    if(horiz)ctx.strokeRect(-8,-26,16,52);else ctx.strokeRect(-26,-8,52,16);
    ctx.restore();
  }
}
function drawDecor(A){
  for(const d of A.decor){
    ctx.save();ctx.translate(d.x,d.y);
    if(d.k==='cruz'||d.k==='cruzInv'){
      const inv=d.k==='cruzInv'||(CASTLE.grot>.6&&Math.sin(d.x*7)<0);
      ctx.rotate(d.a||0);
      ctx.strokeStyle=sick('#6b6355','#7a4a44');ctx.lineWidth=7;
      ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(0,inv?22:16);ctx.moveTo(-12,inv?22:-6);ctx.lineTo(12,inv?22:-6);ctx.stroke();
      if(CASTLE.grot>.6&&Math.sin(game.t+d.x)<-.6){ /* sangra */
        ctx.strokeStyle='rgba(138,42,58,0.7)';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,18+Math.sin(game.t*2+d.x)*4);ctx.stroke();
      }
    }else if(d.k==='mesa'){
      ctx.fillStyle='#241a20';ctx.fillRect(-130,-14,260,28);
      ctx.strokeStyle='#3a2c34';ctx.lineWidth=2;ctx.strokeRect(-130,-14,260,28);
      ctx.fillStyle='#2e2228';ctx.fillRect(-100,-22,60,10);ctx.fillRect(40,-22,50,10);
    }else if(d.k==='banco'){
      ctx.fillStyle='#1e161c';ctx.fillRect(-34,-7,68,14);
      ctx.strokeStyle='#332630';ctx.lineWidth=1.5;ctx.strokeRect(-34,-7,68,14);
    }else if(d.k==='quadro'){
      ctx.fillStyle='#2a2130';ctx.fillRect(-22,-28,44,56);
      ctx.strokeStyle='#453850';ctx.lineWidth=2;ctx.strokeRect(-22,-28,44,56);
      if(d.olhos){ /* os olhos seguem (A②) */
        const a=Math.atan2(player.y-d.y,player.x-d.x);
        const ex=Math.cos(a)*3,ey=Math.sin(a)*3;
        ctx.fillStyle='#c9c2b4';
        ctx.beginPath();ctx.arc(-7,-6,3.4,0,TAU);ctx.arc(7,-6,3.4,0,TAU);ctx.fill();
        ctx.fillStyle='#14100e';
        ctx.beginPath();ctx.arc(-7+ex,-6+ey,1.6,0,TAU);ctx.arc(7+ex,-6+ey,1.6,0,TAU);ctx.fill();
      }
    }else if(d.k==='janela'){
      ctx.fillStyle='#0a0d16';ctx.fillRect(-24,-40,48,80);
      ctx.strokeStyle='#3c3546';ctx.lineWidth=3;ctx.strokeRect(-24,-40,48,80);
      ctx.beginPath();ctx.moveTo(0,-40);ctx.lineTo(0,40);ctx.moveTo(-24,0);ctx.lineTo(24,0);ctx.stroke();
      ctx.fillStyle='rgba(190,200,220,0.16)';
      ctx.beginPath();ctx.arc(0,-14,10,0,TAU);ctx.fill();
    }else if(d.k==='candel'){
      ctx.fillStyle='#3a3040';ctx.fillRect(-3,-4,6,16);
      const fl=.7+.3*Math.sin(game.t*9+d.x);
      ctx.fillStyle='rgba(255,200,120,'+(.75*fl)+')';
      ctx.beginPath();ctx.ellipse(0,-10,3.4,6.4,0,0,TAU);ctx.fill();
      ctx.fillStyle='rgba(255,170,60,'+(.18*fl)+')';
      ctx.beginPath();ctx.arc(0,-10,22,0,TAU);ctx.fill();
    }else if(d.k==='estatua'){
      const s=d.pequena?.7:1;
      ctx.scale(s,s);
      ctx.fillStyle='#2c2833';
      ctx.beginPath();ctx.ellipse(0,6,13,22,0,0,TAU);ctx.fill();
      ctx.beginPath();ctx.arc(0,-24,9,0,TAU);ctx.fill();
      ctx.fillStyle='#1a171f';ctx.beginPath();ctx.ellipse(0,26,16,6,0,0,TAU);ctx.fill();
    }else if(d.k==='carroca'){
      ctx.fillStyle='#211a1e';ctx.fillRect(-34,-14,68,20);
      ctx.strokeStyle='#3a2f36';ctx.lineWidth=2;ctx.strokeRect(-34,-14,68,20);
      ctx.beginPath();ctx.arc(-18,14,8,0,TAU);ctx.arc(18,14,8,0,TAU);ctx.fill();
    }else if(d.k==='portaFalsa'){
      ctx.fillStyle='#161018';ctx.fillRect(-20,-30,40,60);
      ctx.strokeStyle='#39303f';ctx.lineWidth=2;ctx.strokeRect(-20,-30,40,60);
      if(CASTLE.grot>.5){ /* entreaberta */
        ctx.fillStyle='#050308';ctx.fillRect(-20,-30,10+Math.sin(game.t*.7)*4,60);
      }
    }else if(d.k==='caixao'){
      ctx.fillStyle='#1c1418';
      ctx.beginPath();ctx.moveTo(0,-34);ctx.lineTo(20,-12);ctx.lineTo(12,36);ctx.lineTo(-12,36);ctx.lineTo(-20,-12);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#39303f';ctx.lineWidth=2;ctx.stroke();
    }
    ctx.restore();
  }
  /* alçapão do salão */
  if(A.hatch){
    ctx.save();ctx.translate(A.hatch.x,A.hatch.y);
    if(CASTLE.prog.moonDone){
      ctx.fillStyle='#050408';ctx.fillRect(-34,-22,68,44);
      ctx.strokeStyle=CASTLE.bossDead?'#3a4138':'#6a3040';ctx.lineWidth=2.5;
      ctx.strokeRect(-34,-22,68,44);
      ctx.strokeStyle='rgba(140,50,60,0.5)';
      ctx.beginPath();ctx.moveTo(-34,0);ctx.lineTo(34,0);ctx.stroke();
      txt(CASTLE.bossDead?' ':'Z',0,0,MONO,11,'#8a5560','center');
    }else{
      ctx.strokeStyle='#332c3a';ctx.lineWidth=2;ctx.strokeRect(-34,-22,68,44);
      ctx.strokeStyle='rgba(255,255,255,0.08)';
      ctx.beginPath();ctx.moveTo(-34,0);ctx.lineTo(34,0);ctx.moveTo(0,-22);ctx.lineTo(0,22);ctx.stroke();
    }
    ctx.restore();
  }
  /* altar da capela */
  if(A.altar){
    ctx.save();ctx.translate(A.altar.x,A.altar.y);
    ctx.fillStyle='#26202e';ctx.fillRect(-44,-12,88,24);
    ctx.strokeStyle='#423a4e';ctx.lineWidth=2;ctx.strokeRect(-44,-12,88,24);
    ctx.fillStyle='#e6dac4';
    ctx.beginPath();ctx.arc(0,-24,7,0,TAU);ctx.fill();
    ctx.restore();
  }
}
/* a lua + a sequência inteira (B③) */
function drawMoon(){
  if(CASTLE.prog.moonDone)return;          /* a lua caiu — o céu ficou vazio */
  const A=CASTLE_AREAS.sacada,M=A.moon;
  const imgL=sprGet('lua');
  const m=CASTLE.moon;
  if(m&&m.phase>=5)return;                 /* caindo/caída: nada no céu */
  let my=M.y,drop=0;
  if(m&&m.phase===4)drop=Math.pow(m.t/1.15,2)*(H-M.y+160);
  my+=drop;
  ctx.save();
  if(imgL){
    ctx.globalAlpha=.92;
    ctx.drawImage(imgL,M.x-imgL.width/2,my-imgL.height/2);
  }else{
    const g=ctx.createRadialGradient(M.x,my,10,M.x,my,M.r*2.2);
    g.addColorStop(0,'rgba(215,220,225,0.32)');g.addColorStop(1,'rgba(215,220,225,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(M.x,my,M.r*2.2,0,TAU);ctx.fill();
    ctx.fillStyle='#c9ced4';
    ctx.beginPath();ctx.arc(M.x,my,M.r,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(140,150,160,0.35)';
    ctx.beginPath();ctx.arc(M.x-30,my-20,16,0,TAU);ctx.arc(M.x+24,my+28,11,0,TAU);ctx.arc(M.x+38,my-34,7,0,TAU);ctx.fill();
  }
  /* a racha */
  if(m&&(m.phase===1||m.phase===2||m.phase===3)){
    const k=m.phase===1?m.t/3:1;
    ctx.strokeStyle='#10121a';ctx.lineWidth=4;ctx.lineCap='round';
    const cracks=[[0,-1,.9],[-.5,.3,1.4],[.55,.2,1.2],[-.2,.9,1],[.3,.85,1.3]];
    let i=0;
    for(const c of cracks){
      i++;
      if(m.phase===1&&k<i/cracks.length)continue;
      ctx.beginPath();
      let x=M.x+c[0]*20,y=my+c[1]*20;
      ctx.moveTo(x,y);
      for(let s=0;s<4;s++){x+=c[0]*18*(0.6+0.4*Math.sin(i*7+s*3));y+=c[1]*16+Math.sin(s*9+i)*6;ctx.lineTo(x,y);}
      ctx.stroke();
    }
  }
  /* o sem-rosto emerge / pende / cai */
  if(m&&(m.phase===2||m.phase===3||m.phase===4)){
    let fy;
    if(m.phase===2)fy=my-30-Math.min(1,m.t/5)*120;
    else if(m.phase===3)fy=my-150+Math.sin(m.t*1.1)*6;
    else fy=my-150+Math.pow(m.t/1.15,2)*(H*1.6);
    drawFaceless(M.x,fy,1,m.phase===3?Math.sin(m.t*1.4)*.2:0,.92);
  }
  ctx.restore();
}
function drawFaceless(x,y,sc,tilt,alpha){
  const img=sprGet('rosto')||sprGet('sem-rosto');
  if(img){
    ctx.save();ctx.globalAlpha=alpha;
    ctx.translate(x,y);ctx.rotate(tilt||0);
    ctx.drawImage(img,-img.width/2*sc,-img.height/2*sc,img.width*sc,img.height*sc);
    ctx.restore();return;
  }
  ctx.save();ctx.globalAlpha=alpha;
  ctx.translate(x,y);ctx.rotate(tilt||0);ctx.scale(sc,sc);
  /* corpo pálido comprido sem feições */
  ctx.fillStyle='#d5d2c8';
  ctx.beginPath();ctx.ellipse(0,34,20,44,0,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(0,-22,17,0,TAU);ctx.fill();
  /* braços longos demais */
  ctx.strokeStyle='#d5d2c8';ctx.lineWidth=7;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-16,10);ctx.lineTo(-30,58);ctx.moveTo(16,10);ctx.lineTo(30,58);ctx.stroke();
  /* a cabeça: lisa. nada. */
  ctx.fillStyle='rgba(20,18,24,0.12)';
  ctx.beginPath();ctx.ellipse(0,-24,9,12,0,0,TAU);ctx.fill();
  ctx.restore();
}
function drawCervo(){
  const c=CASTLE.cervo;if(!c)return;
  if(!c.alive&&c.fade<=0)return;
  const img=sprGet('cervo');
  const jit=CASTLE.grot*2.2;
  ctx.save();
  ctx.globalAlpha=c.alive?(c.fade!==undefined?c.fade:1):0;
  ctx.translate(c.x+rnd(-1,1)*jit,c.y+rnd(-1,1)*jit);
  if(img){
    ctx.drawImage(img,-img.width/2,-img.height/2);
  }else{
    /* silhueta: pernas longas demais, cabeça que acompanha */
    const la=Math.atan2(player.y-c.y,player.x-c.x);
    ctx.fillStyle=sick('#0d0b0e','#12110c');
    ctx.beginPath();ctx.ellipse(0,0,26,15,0,0,TAU);ctx.fill();
    ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=3.4;ctx.lineCap='round';
    for(const s of[-1,1]){
      ctx.beginPath();ctx.moveTo(s*12,8);ctx.lineTo(s*16,42);ctx.stroke();
      ctx.beginPath();ctx.moveTo(s*4,10);ctx.lineTo(s*2,44);ctx.stroke();
    }
    ctx.beginPath();ctx.moveTo(20,-4);ctx.lineTo(38+Math.cos(la)*6,-14+Math.sin(la)*4);ctx.stroke();
    ctx.beginPath();ctx.arc(42,-16,7,0,TAU);ctx.fill();
    /* galhadas tortas */
    ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(42,-22);ctx.lineTo(36,-38);ctx.moveTo(42,-22);ctx.lineTo(50,-36);ctx.stroke();
    /* olhos que piscam brancos */
    if(c.blink>0){
      ctx.fillStyle='#e6e2d4';
      ctx.beginPath();ctx.arc(45,-17,1.7,0,TAU);ctx.fill();
    }
  }
  ctx.restore();
}
/* ---- inimigos ---- */
function drawCastleEnemy(e){
  const s=Math.min(1,e.spawnT);
  const jit=(CASTLE.grot*(e.type==='semrosto'?1.4:2.6));
  const jx=rnd(-1,1)*jit,jy=rnd(-1,1)*jit;
  const img=sprGet(e.type==='semrosto'?'sem-rosto':e.type);
  ctx.save();ctx.translate(e.x+jx,e.y+jy);ctx.scale(s,s);
  if(img){
    if(e.flash>0){ctx.filter='brightness(2.2)';}
    ctx.drawImage(img,-img.width/2,-img.height/2);
    ctx.filter='none';
  }else{
    if(e.type==='monge')drawMongeVec(e);
    else if(e.type==='penitente')drawPenitenteVec(e);
    else if(e.type==='vigilante')drawVigilanteVec(e);
    else if(e.type==='semrosto')drawBossVec(e);
  }
  ctx.restore();
  /* flash de dano */
  if(e.flash>0){
    ctx.fillStyle='rgba(255,255,255,'+Math.min(.7,e.flash*6)+')';
    ctx.beginPath();ctx.arc(e.x,e.y,e.r+6,0,TAU);ctx.fill();
  }
  /* telegrafia do penitente */
  if(e.type==='penitente'&&e.st==='tele'){
    const k=1-e.stT/.7;
    ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.face);
    ctx.strokeStyle='rgba(200,80,90,'+(.3+.5*k)+')';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(170,-60);ctx.stroke();
    ctx.fillStyle='rgba(120,30,40,'+(.12+.2*k)+')';
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,170,e.face-1.15+Math.PI*0,e.face+1.15-0);ctx.closePath();
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,170,-1.15,1.15);ctx.closePath();ctx.fill();
    ctx.restore();
  }
  /* barra de vida do boss */
  if(e.type==='semrosto'){
    const w=340,x=W/2-w/2,y=36;
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(x-3,y-3,w+6,14);
    ctx.fillStyle='#5c1520';ctx.fillRect(x,y,w,8);
    ctx.fillStyle='#a52a3a';ctx.fillRect(x,y,w*Math.max(0,e.hp/e.maxHp),8);
    txt('O SEM-ROSTO',W/2,y-14,DISP,17,'#c9bfae','center',3);
  }
}
function drawMongeVec(e){
  ctx.fillStyle='#39424a';
  ctx.beginPath();ctx.ellipse(0,2,14,17,0,0,TAU);ctx.fill();
  ctx.fillStyle='#4a565e';
  ctx.beginPath();ctx.arc(0,-14,10,0,TAU);ctx.fill();
  ctx.fillStyle='#20262b';
  ctx.beginPath();ctx.ellipse(0,-11,7,4,0,0,TAU);ctx.fill(); /* capuz vazio */
  /* água escorrendo */
  ctx.strokeStyle='rgba(127,178,201,0.55)';ctx.lineWidth=2;
  const t=game.t*3;
  ctx.beginPath();ctx.moveTo(-6,8);ctx.quadraticCurveTo(-8+Math.sin(t)*2,16,-5,22);ctx.stroke();
  /* barra de hp */
  hpBar(e);
}
function drawPenitenteVec(e){
  const kneel=e.st==='kneel';
  ctx.save();if(kneel)ctx.translate(0,6);
  ctx.fillStyle='#2a2028';
  ctx.beginPath();ctx.ellipse(0,0,13,20,0,0,TAU);ctx.fill();
  ctx.fillStyle='#3a2c36';
  ctx.beginPath();ctx.arc(0,-18,9,0,TAU);ctx.fill();
  ctx.strokeStyle='#5a5260';ctx.lineWidth=2.4;
  ctx.beginPath();ctx.moveTo(10,-6);
  const dr=Math.sin(game.t*2+e.seed)*8;
  ctx.quadraticCurveTo(24,10+dr,20,26+dr*.5);ctx.stroke();
  ctx.fillStyle='#5a5260';
  ctx.beginPath();ctx.arc(20,29+dr*.5,5,0,TAU);ctx.fill();
  ctx.restore();
  hpBar(e);
}
function drawVigilanteVec(e){
  const still=e.st==='still';
  ctx.fillStyle=sillCol(e,still);
  ctx.beginPath();ctx.ellipse(0,4,10,22,0,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(0,-22,8,0,TAU);ctx.fill();
  /* cabelo comprido parado */
  ctx.fillStyle='#15121a';
  ctx.beginPath();ctx.moveTo(-8,-24);ctx.quadraticCurveTo(-11,10,-6,26);
  ctx.lineTo(6,26);ctx.quadraticCurveTo(11,10,8,-24);ctx.closePath();ctx.fill();
  /* os olhos nela: dois pontos claros, sempre em você */
  const a=Math.atan2(player.y-e.y,player.x-e.x);
  ctx.fillStyle='#d8d4c8';
  ctx.beginPath();ctx.arc(Math.cos(a)*2.4-2.6,-23+Math.sin(a)*1.6,1.5,0,TAU);
  ctx.arc(Math.cos(a)*2.4+2.6,-23+Math.sin(a)*1.6,1.5,0,TAU);ctx.fill();
  hpBar(e);
}
function sillCol(e,still){return still?'#3a3644':'#2c2834';}
function drawBossVec(e){
  const ph=e.ph||1;
  const breathe=1+Math.sin(game.t*1.3)*.02*(ph===3?2:1);
  ctx.save();ctx.scale(breathe,breathe);
  if(e.st==='teleout'||e.st==='telein'){
    ctx.globalAlpha=.35+.3*Math.sin(game.t*24);
  }
  ctx.fillStyle=ph===3?'#cfc9ba':'#d5d2c8';
  /* corpo massivo curvado */
  ctx.beginPath();ctx.ellipse(0,26,30,46,0,0,TAU);ctx.fill();
  /* cabeça lisa — a lua que caiu */
  ctx.beginPath();ctx.arc(0,-38,24,0,TAU);ctx.fill();
  /* braços longos */
  ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=10;ctx.lineCap='round';
  const sw=e.st==='swipe'?Math.sin((1-e.stT/.55)*Math.PI)*1.1:0;
  ctx.beginPath();ctx.moveTo(-24,10);ctx.lineTo(-44-sw*20,54);ctx.stroke();
  ctx.beginPath();ctx.moveTo(24,10);ctx.lineTo(44+sw*20,54);ctx.stroke();
  /* rachaduras luminosas na fase 3 */
  if(ph===3){
    ctx.strokeStyle='rgba(190,200,215,0.5)';ctx.lineWidth=2;
    for(let i=0;i<5;i++){
      const a=e.seed+i*1.3;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*10,-38+Math.sin(a)*10);
      ctx.lineTo(Math.cos(a)*24,-38+Math.sin(a)*24);ctx.stroke();
    }
  }
  ctx.restore();
}
function hpBar(e){
  if(e.hp>=e.maxHp)return;
  const w=e.r*2.2;
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(-w/2,-e.r-14,w,4);
  ctx.fillStyle=e.vulnT>0?'#d9465a':'#8a5560';
  ctx.fillRect(-w/2,-e.r-14,w*Math.max(0,e.hp/e.maxHp),4);
}
/* ---- balas/poças/efeitos ---- */
function drawCastleFx(){
  for(const p of CASTLE.puddles){
    ctx.fillStyle='rgba(90,130,150,'+(.16*Math.min(1,p.life))+')';
    ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*.55,0,0,TAU);ctx.fill();
  }
  for(const s of CASTLE.shots){
    ctx.fillStyle=s.c;
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.25)';
    ctx.beginPath();ctx.arc(s.x-s.r*.3,s.y-s.r*.3,s.r*.4,0,TAU);ctx.fill();
  }
}
/* ---- HUD ---- */
function hudName(){
  const A=CASTLE_AREAS[CASTLE.area];
  let n=A.name;
  if(CASTLE.grot>.5){
    const bad='#@%&/\\=?';
    n=n.split('').map(function(ch){return Math.random()<.05*CASTLE.grot?bad[Math.floor(rnd(bad.length))]:ch;}).join('');
  }
  return n;
}
function drawHud(){
  /* vida */
  const w=170,x=26,y=H-38;
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(x-3,y-3,w+6,16);
  ctx.fillStyle='#3a2028';ctx.fillRect(x,y,w,10);
  ctx.fillStyle='#7da462';ctx.fillRect(x,y,w*Math.max(0,player.hp/player.maxHp),10);
  txt(Math.max(0,Math.round(player.hp))+' / '+player.maxHp,x+w+8,y+5,MONO,11,'#8a9178','left');
  /* nome da área */
  txt(hudName(),W/2,H-24,DISP,20,'#6b6355','center',4);
  /* mensagens */
  let my=H-64;
  for(let i=CASTLE.msgs.length-1;i>=0;i--){
    const m=CASTLE.msgs[i];
    const a=Math.min(1,m.t*3)*Math.min(1,(m.dur-m.t)*2);
    ctx.globalAlpha=Math.max(0,a);
    txt(m.txt,W/2,my,MONO,13,'#a89c88','center',1);
    ctx.globalAlpha=1;my-=22;
  }
  /* dica de alçapão */
  const A=CASTLE_AREAS[CASTLE.area];
  if(A.hatch&&CASTLE.prog.moonDone&&!CASTLE.bossDead&&dist(player.x,player.y,A.hatch.x,A.hatch.y)<80){
    txt('[Z] DESCER À CRIPTA',A.hatch.x,A.hatch.y-40,MONO,11,'#8a5560','center',1);
  }
  if(CASTLE.area==='portao'&&!CASTLE.prog.hallSeen){
    txt('a porta do salão está aberta.',W/2,84,MONO,12,'#5a5148','center',1);
  }
}
/* ---- overlay grotesco + vinheta (B⑦) ---- */
function drawGrot(){
  const g=CASTLE.grot;
  if(g>.02){
    ctx.fillStyle='rgba(70,88,60,'+(g*.13)+')';
    ctx.fillRect(0,0,W,H);
  }
  const v=ctx.createRadialGradient(W/2,H/2,H*.34,W/2,H/2,H*.85);
  v.addColorStop(0,'rgba(0,0,0,0)');
  v.addColorStop(1,'rgba(2,2,4,'+(.55+g*.25)+')');
  ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  if(CASTLE.fade>0){
    ctx.fillStyle='rgba(2,1,3,'+CASTLE.fade+')';
    ctx.fillRect(0,0,W,H);
  }
}
window.CASTELLO_draw=function(){
  const A=CASTLE_AREAS[CASTLE.area]||CASTLE_AREAS.portao;
  drawAreaFloor(A);
  if(CASTLE.area==='sacada')drawMoon();
  drawWalls(A);
  drawDecor(A);
  drawCervo();
  for(const e of enemies){if(!e.dead)drawCastleEnemy(e);}
  /* jogador (com PNG trocável do thor) */
  drawPlayer();
  drawCastleFx();
  /* textos flutuantes locais */
  for(const t of CASTLE.texts){
    ctx.globalAlpha=Math.max(0,1-t.t/t.life);
    txt(t.txt,t.x,t.y-t.t*26,MONO,t.size,t.c,'center');
    ctx.globalAlpha=1;
  }
  drawParticles();
  /* cine de texto */
  if(CASTLE.cine){
    const c=CASTLE.cine;
    ctx.fillStyle='rgba(2,1,3,0.55)';ctx.fillRect(0,0,W,H);
    for(const L of c.lines){
      const a=ramp(c.t,L.at,L.at+.5)*(1-ramp(c.t,L.at+L.dur,L.at+L.dur+.4));
      if(a>0){
        ctx.globalAlpha=a;
        txt(L.txt,W/2,H*.5,DISP,Math.round(W*.024),'#b8ac96','center',1);
        ctx.globalAlpha=1;
      }
    }
  }
  /* encerramento */
  if(CASTLE.ending){
    const t=CASTLE.ending.t;
    const a=ramp(t,1.2,2.4)*(1-ramp(t,6,8));
    ctx.globalAlpha=Math.max(0,a);
    txt('o castelo te deixa ir.',W/2,H*.46,DISP,Math.round(W*.03),'#b8a888','center',2);
    ctx.globalAlpha=1;
    if(t>4){ctx.fillStyle='rgba(2,1,3,'+ramp(t,4,8)+')';ctx.fillRect(0,0,W,H);}
  }
  drawHud();
  drawGrot();
};

/* ============================================================
   EXPOSIÇÃO PARA O GAME.JS
   ============================================================ */
window.CASTELLO={
  invite:function(){invite();},
  enterArea:function(id,from){CASTLE.intro=null;game.state='castle';enterArea(id,from,false);},
  musicMode:musicMode,
  interact:castleInteract,
  beforeMenu:function(){if(CASTLE.active)castleLeave();CASTLE.intro=null;},
  isActive:function(){return CASTLE.active;},
  debug:function(){return{area:CASTLE.area,grot:CASTLE.grot,prog:CASTLE.prog,
    enemies:enemies.length,shots:CASTLE.shots.length,moon:CASTLE.moon?CASTLE.moon.phase:null};}
};

/* título de morte especial do castelo — roda DEPOIS da escola/engine,
   e em TODOS os frames (a escola reescreve 'VOCÊ CAIU' a cada frame) */
try{
  const _updDeadC=updateDead;
  updateDead=function(dt){
    _updDeadC(dt);
    if(CASTLE._deathTitle){
      const h=ov('deadTitle');
      if(h)h.textContent=CASTLE._deathTitle;
    }
  };
}catch(e){}

/* morte via engine (hurtPlayer) dentro do castelo — conclui a saída limpa */
try{
  const _hurtC=hurtPlayer;
  hurtPlayer=function(){
    _hurtC();
    if(player.dead&&CASTLE.active&&!CASTLE._died)castleDie('castle');
  };
}catch(e){}

/* atalho de teste: ?castelo=1 entra direto (igual ?escola=1) */
try{
  const q=new URLSearchParams(location.search);
  if(q.get('castelo')==='1')setTimeout(function(){invite();},400);
}catch(e){}

console.info('[CASTELLO] O CONVITE carregado — digite "bruno" no menu (ou ?castelo=1). Sprites: assets/sprites/castelo/');
})();
