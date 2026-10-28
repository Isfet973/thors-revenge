/* ============================================================
   THOR REVENGE — audio.js v2 (reconstruído + AUDIOS CUSTOMIZÁVEIS)
   Motor de áudio 100% sintetizado via WebAudio API + camada de
   DETECÇÃO DE ARQUIVOS: se você colocar seus próprios áudios em
     assets/audio/music/  (músicas: menu, fases, chefes, fase 2 do Rei)
     assets/audio/sfx/    (efeitos: os 37 nomes listados no README)
   o jogo detecta e toca SEUS arquivos automaticamente (mp3/ogg/wav).
   Se o arquivo não existir, usa o som sintetizado embutido — nunca
   quebra, nunca fica mudo.

   Contrato esperado pelo game.js (mantido):
     audio()                      — cria/retoma o AudioContext
     blip(type,f0,f1,dur,vol,dly) — bip com varredura de frequência
     noiseSfx(dur,vol,freq,tipo)  — rajada de ruído filtrado
     sfx.*                        — 37 efeitos nomeados (agora com override por arquivo)
     musicTick()                  — agendador de música (por frame)
     applyVolumes()               — aplica opts.sfx / opts.music do game.js
     muted / master               — usados pelo botão de mudo
   Extras:
     window.__AUDIO_DEBUG()       — diagnóstico: modo atual, arquivo em uso
   ============================================================ */
'use strict';
let audioCtx=null,master=null,sfxBus=null,musBus=null,musDip=null,muted=false;
let musLP=null,muffV=0; /* v1.5.7: o filtro que ABAFA o som ambiente (apresentação do guardião) */
let musicPhase=0,musicNext=0,musicStep=0;
/* fade degradável da derrota: toda a música de fundo (arquivo ou sintetizada)
   abaixa suavemente até o silêncio quando o jogador morre, como se fosse
   interrompida pela derrota; a música de game over (morte.mp3) só entra
   depois do fade, e é interrompida ao voltar pro menu/jogo */
let deathFade=1,deathFading=false,lastMusT=0;

function audio(){
  try{
    if(!audioCtx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      audioCtx=new AC();
      master=audioCtx.createGain();master.gain.value=.9;master.connect(audioCtx.destination);
      sfxBus=audioCtx.createGain();sfxBus.connect(master);
      musBus=audioCtx.createGain();
      /* v1.5.7: lowpass permanente na música — __MUSIC_MUFFLE(1) o fecha (~520Hz):
         "a tela escurece rapidamente, enquanto o som ambiente fica abafado" */
      musLP=audioCtx.createBiquadFilter();musLP.type='lowpass';musLP.frequency.value=18000;musLP.Q.value=.5;
      musDip=audioCtx.createGain();musDip.gain.value=1;
      musBus.connect(musLP);musLP.connect(musDip);musDip.connect(master);
      applyVolumes();
    }
    if(audioCtx.state==='suspended')audioCtx.resume();
  }catch(e){audioCtx=null;}
}
function applyVolumes(){
  try{
    if(!sfxBus||!musBus)return;
    const s=(typeof opts!=='undefined'&&typeof opts.sfx==='number')?opts.sfx:.8;
    const m=(typeof opts!=='undefined'&&typeof opts.music==='number')?opts.music:.5;
    sfxBus.gain.value=s;musBus.gain.value=m*.8*deathFade*deathFade;
    if(curEl){const tv=elVolTarget();if(!muted&&curEl.volume<tv)curEl.volume=Math.min(tv,curEl.volume+.1);}
  }catch(e){}
}
function applyDuck(){
  try{
    if(!musBus)return;
    const m=(typeof opts!=='undefined'&&typeof opts.music==='number')?opts.music:.5;
    musBus.gain.value=m*.8*deathFade*deathFade*(1-muffV*.45); /* v1.5.7: abafado também abaixa um pouco */
  }catch(e){}
}
/* v1.5.7: ABAFAR o som ambiente — a apresentação do guardião fecha o filtro
   da música (~520Hz, tipo rádio abafado em outro cômodo) e volta ao abrir */
window.__MUSIC_MUFFLE=function(v){
  try{
    muffV=(v===undefined||!v)?0:Math.min(1,Math.max(0,v));
    applyDuck();
    if(audioCtx&&musLP){
      const t=audioCtx.currentTime;
      musLP.frequency.cancelScheduledValues(t);
      musLP.frequency.setTargetAtTime(muffV>0?520:18000,t,.16);
    }
  }catch(e){}
};
/* ---- utilidades internas ---- */
function env(g,t,vol,dur,att){
  const a=att||.008;
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+a);
  g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(a+.02,dur));
}
function blip(type,f0,f1,dur,vol,dly){
  try{
    audio();if(!audioCtx)return;
    const t=audioCtx.currentTime+(dly||0);
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type||'sine';
    const sf=Math.max(1,f0||440),ef=Math.max(1,f1===undefined?f0:f1);
    o.frequency.setValueAtTime(sf,t);
    o.frequency.exponentialRampToValueAtTime(ef,t+Math.max(.02,dur||.1));
    env(g,t,vol===undefined?.07:vol,dur||.1);
    o.connect(g);g.connect(sfxBus);
    o.start(t);o.stop(t+(dur||.1)+.08);
  }catch(e){}
}
function noiseSfx(dur,vol,freq,tipo,dly){
  try{
    audio();if(!audioCtx)return;
    const t=audioCtx.currentTime+(dly||0);
    noiseAt(t,dur,vol,freq,tipo);
  }catch(e){}
}
function noiseAt(t,dur,vol,freq,tipo,bus){
  try{
    if(!audioCtx)return;
    const n=Math.max(1,Math.floor(audioCtx.sampleRate*(dur||.2)));
    const buf=audioCtx.createBuffer(1,n,audioCtx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const src=audioCtx.createBufferSource();src.buffer=buf;
    const f=audioCtx.createBiquadFilter();
    f.type=tipo||'lowpass';f.frequency.value=freq||800;f.Q.value=.9;
    const g=audioCtx.createGain();env(g,t,vol===undefined?.08:vol,dur||.2,.01);
    src.connect(f);f.connect(g);g.connect(bus||sfxBus);
    src.start(t);src.stop(t+(dur||.2)+.05);
  }catch(e){}
}
/* ruído com varredura de filtro (whoosh/explosões) */
function noiseSweep(dur,vol,f0,f1,tipo){
  try{
    audio();if(!audioCtx)return;
    const t=audioCtx.currentTime;
    const n=Math.max(1,Math.floor(audioCtx.sampleRate*(dur||.3)));
    const buf=audioCtx.createBuffer(1,n,audioCtx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const src=audioCtx.createBufferSource();src.buffer=buf;
    const f=audioCtx.createBiquadFilter();
    f.type=tipo||'bandpass';f.Q.value=1.1;
    f.frequency.setValueAtTime(Math.max(20,f0||400),t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20,f1||f0||400),t+(dur||.3));
    const g=audioCtx.createGain();env(g,t,vol||.1,dur||.3,.015);
    src.connect(f);f.connect(g);g.connect(sfxBus);
    src.start(t);src.stop(t+(dur||.3)+.05);
  }catch(e){}
}
/* ---- efeitos nomeados usados pelo game.js (sintetizados — fallback) ---- */
const SFX_SYNTH={
  glitch(){for(let i=0;i<7;i++)blip('square',rnd(200,2400),rnd(40,900),.06,.07,i*.045);noiseSfx(.25,.05,3000,'highpass');},
  levelup(){[262,330,392,523].forEach((f,i)=>blip('triangle',f,f*1.01,.22,.09,i*.09));},
  heart(){blip('sine',72,40,.16,.16);blip('sine',64,36,.2,.13,.19);},
  echo(){blip('sine',420,300,.5,.06);blip('sine',420,300,.6,.035,.28);blip('sine',420,300,.7,.02,.56);},
  rumble(){noiseSweep(1.2,.12,120,45,'lowpass');blip('sine',55,30,1.2,.14);},
  roar(){blip('sawtooth',180,55,.7,.13);noiseSweep(.6,.09,900,200,'bandpass');blip('sawtooth',90,38,.8,.1,.06);},
  gate(){blip('sawtooth',90,52,.85,.07);noiseSweep(.7,.045,300,90,'lowpass');},
  static_(){noiseSfx(.5,.09,4500,'highpass');noiseSfx(.3,.06,1200,'bandpass',.1);},
  creak(){blip('sawtooth',130,70,1.3,.05);blip('sawtooth',86,58,1.5,.045,.15);},
  growl(){blip('sawtooth',95,60,.9,.09);blip('sawtooth',63,44,1.1,.07,.12);},
  hurt(){blip('square',330,90,.18,.11);noiseSfx(.1,.05,1800,'highpass');},
  die(){blip('sawtooth',300,42,.9,.13);noiseSweep(.7,.08,700,120,'lowpass');},
  dash(){noiseSweep(.2,.08,600,2600,'bandpass');blip('sine',700,240,.14,.05);},
  throw(){noiseSweep(.18,.06,900,3200,'bandpass');},
  saw(){for(let i=0;i<5;i++)blip('square',rnd(180,260),rnd(140,300),.07,.05,i*.05);},
  howl(){blip('sine',220,660,.55,.09);blip('sine',660,330,.55,.07,.5);},
  parry(){blip('square',1200,1500,.1,.09);blip('triangle',1800,900,.24,.07,.03);},
  headDie(){[500,340,180].forEach((f,i)=>blip('sawtooth',f,f*.6,.3,.1,i*.12));noiseSfx(.35,.07,900,'lowpass',.1);},
  boom(){noiseSweep(.7,.3,900,60,'lowpass');blip('sine',90,28,.7,.24);},
  spit(){noiseSfx(.07,.07,2400,'bandpass');},
  shotS(){blip('square',1400,320,.12,.08);noiseSfx(.06,.04,3200,'highpass');},
  thunder(){noiseSweep(1.1,.2,2600,90,'lowpass');blip('sine',70,26,1.1,.18,.05);},
  freeze(){blip('triangle',900,2200,.3,.06);blip('triangle',1400,3000,.3,.045,.08);noiseSfx(.25,.03,6000,'highpass');},
  ehit(){blip('square',480,180,.08,.06);},
  bhit(){blip('triangle',260,90,.12,.09);noiseSfx(.05,.04,1000,'lowpass');},
  thud(){blip('sine',110,45,.16,.14);noiseSfx(.08,.05,300,'lowpass');},
  bite(){blip('square',700,180,.07,.08);blip('square',420,110,.09,.07,.06);noiseSfx(.06,.05,1600,'bandpass');},
  slash(){noiseSweep(.13,.09,3200,500,'bandpass');},
  nova(){blip('sawtooth',140,900,.5,.12);noiseSweep(.55,.12,300,2800,'bandpass');},
  stake(){blip('triangle',520,120,.14,.11);noiseSfx(.07,.05,700,'lowpass');},
  shock(){for(let i=0;i<6;i++)blip('square',rnd(900,3200),rnd(200,900),.045,.05,i*.032);},
  kill(){blip('square',420,70,.25,.09);noiseSfx(.2,.06,600,'lowpass',.04);},
  explode(){noiseSweep(.9,.28,1400,50,'lowpass');blip('sine',120,24,.9,.22);blip('square',300,40,.4,.1,.03);},
  win(){[392,494,587,784].forEach((f,i)=>blip('triangle',f,f,.32,.1,i*.13));blip('sine',196,196,.9,.07,.5);},
  soul(){blip('sine',880,1760,.28,.05);blip('sine',1320,2200,.24,.035,.07);},
  dust(){noiseSfx(.3,.035,500,'lowpass');},
  snore(){blip('sawtooth',68,44,1.1,.07);blip('sawtooth',60,40,1.2,.06,1.25);}
};
let sfx=SFX_SYNTH;

/* ============================================================
   CAMADA 1 — EFEITOS POR ARQUIVO (override)
   Coloque arquivos em  assets/audio/sfx/<nome>.mp3  (ou .ogg/.wav)
   com o mesmo nome do efeito (ex.: boom.mp3, roar.mp3, levelup.mp3).
   Detecção preguiçosa: na 1ª vez que um efeito toca, o jogo procura
   o arquivo; achou → seus arquivos passam a ser usados; não achou →
   som sintetizado, com NOVA tentativa automática depois (áudios
   adicionados com o jogo aberto também são detectados).
   ============================================================ */
const SFX_DIR='assets/audio/sfx/';
const SFX_EXTS=['mp3','ogg','wav'];
const sfxRes={},sfxProbing={},sfxResT={};

/* carrega um arquivo de áudio; ok(el) recebe o elemento ou null */
function loadAudioFile(src,ok){
  let el=null;
  try{el=new Audio();}catch(e){ok(null);return;}
  let done=false;
  const finish=function(v){
    if(done)return;done=true;
    clearTimeout(tm);
    try{el.onloadedmetadata=null;el.oncanplaythrough=null;el.onerror=null;}catch(e2){}
    ok(v?el:null);
  };
  const tm=setTimeout(function(){finish(false);},5000);
  el.onloadedmetadata=function(){finish(true);};
  el.oncanplaythrough=function(){finish(true);};
  el.onerror=function(){finish(false);};
  try{el.preload='auto';el.src=src;}catch(e2){finish(false);}
}
function sfxFile(name){
  if(sfxRes[name])return sfxRes[name];
  /* re-detecção: se o efeito não existia e um áudio NOVO foi colocado na
     pasta depois, tenta de novo (1 varredura a cada 12s por efeito) —
     antes o resultado negativo era guardado para sempre e novos arquivos
     nunca eram detectados sem recarregar a página */
  if(sfxRes[name]===null&&(sfxResT[name]||0)+12000>performance.now())return null;
  if(sfxProbing[name])return null;
  sfxProbing[name]=true;
  sfxResT[name]=performance.now();
  let i=0;
  (function next(){
    if(i>=SFX_EXTS.length){sfxProbing[name]=false;sfxRes[name]=null;return;}
    const src=SFX_DIR+name+'.'+SFX_EXTS[i++];
    loadAudioFile(src,function(el){
      if(el){sfxProbing[name]=false;sfxRes[name]=el;}
      else next();
    });
  })();
  return null;
}
function playFileSfx(name){
  const el=sfxFile(name);
  if(!el)return false;
  try{
    const c=el.cloneNode(true);
    const v=(typeof opts!=='undefined'&&typeof opts.sfx==='number')?opts.sfx:.8;
    c.volume=Math.max(0,Math.min(1,v*.9));
    const p=c.play();if(p&&p.catch)p.catch(function(){});
  }catch(e){return false;}
  return true;
}
/* proxy: cada chamada sfx.<nome>() tenta primeiro o arquivo do usuário */
sfx=new Proxy(SFX_SYNTH,{
  get:function(t,prop){
    if(typeof prop!=='string')return t[prop];
    const orig=t[prop];
    if(typeof orig!=='function')return orig;
    return function(){
      try{if(playFileSfx(prop))return;}catch(e){}
      return orig.apply(t,arguments);
    };
  }
});

/* ============================================================
   CAMADA 2 — MÚSICA POR ARQUIVO + MODOS COM DETECÇÃO AUTOMÁTICA
   Coloque suas músicas em  assets/audio/music/  (mp3/ogg/wav):

     menu.mp3                 — menu principal
     inferno.mp3              — gameplay normal (fases/corredores)
     chefe.mp3                — chefes em geral
     velho-rei.mp3            — O VELHO REI (fase I)
     velho-rei-fase2.mp3      — O VELHO REI (fase II — NOVO TEMA)
     cerbero.mp3, bruxo.mp3, carrasco.mp3, viuva.mp3, golem.mp3,
     erro-404.mp3, caronte.mp3, cavaleiro-branco.mp3,
     cavaleiro-vermelho.mp3, cavaleiro-preto.mp3,
     cavaleiro-descorado.mp3, observador.mp3   — chefes específicos
     vitoria.mp3              — tela de vitória
     morte.mp3                — tela de game over

   Sem arquivo → temas sintetizados embutidos (inclui o NOVO tema
   da fase II do Velho Rei: relógio de xadrez + espelhos dissonantes).
   ============================================================ */
const MUSIC_DIR='assets/audio/music/';
const MUSIC_EXTS=['mp3','ogg','wav'];
const BOSS_SLUGS={rk:'velho-rei',e404:'erro-404',cb:'cerbero',cerb:'cerbero',cerberus:'cerbero',boss:'cerbero',
  mb:'bruxo',ex:'carrasco',vi:'viuva',gz:'golem',cw1:'cavaleiro-branco',cw2:'cavaleiro-vermelho',
  cw3:'cavaleiro-preto',cw4:'cavaleiro-descorado',observer:'observador',caronte:'caronte'};
const BOSS_TYPES=['mb','ex','vi','gz','e404','cw1','cw2','cw3','cw4','observer','cb','cerb','cerberus'];
const srcCache={};
const musicEls={};        /* modo → elemento|null (null = já procurou, não achou) */
const musicResolving={},musicReT={};
let curMode='run',curEl=null,prevEl=null;

function slotNames(mode){
  if(mode==='menu')return['menu'];
  if(mode==='run')return['inferno','ambiente','fundo'];
  if(mode==='win')return['vitoria','win'];
  if(mode==='morte')return['morte','derrota'];
  if(mode==='rk2')return['velho-rei-fase2','velho-rei-fase-2'];
  if(mode==='boss')return['chefe','boss'];
  /* v1.5.7: OS DOIS TEMAS DO CÉRBERO — "guardião do inferno" (luta 1) e
     "juiz da sentença negra" (luta 2). Coloque os arquivos em
     assets/audio/music/ com um destes nomes e o jogo usa o SEU áudio;
     sem arquivo, os temas sintetizados embutidos tocam. */
  if(mode==='cerberus')return['guardiao-do-inferno','guardiao do inferno','guardião-do-inferno'];
  if(mode&&mode.indexOf('sentenca')===0)return['juiz-da-sentenca-negra','juiz da sentença negra','juiz-da-sentenca-negra'];
  if(mode.indexOf('boss:')===0){const s=mode.slice(5);return[BOSS_SLUGS[s]||s,'chefe','boss'];}
  /* ==== escola vazia (4ª descida — ???) ==== */
  if(mode==='escola')return['escola-ambiente','escola','school-ambient'];
  if(mode==='escola:cacada')return['escola-cacada','escola-perseguicao','escola-hunt'];
  if(mode==='escola:espelho')return['escola-espelho','escola-mirror','escola-invertida'];
  if(mode==='escola:ritual')return['escola-ritual','escola-ritual'];
  if(mode==='escola:inundacao')return['escola-inundacao','escola-agua','escola-flood'];
  /* ==== O CONVITE (castelo do bruno) — v0.9.10 ==== */
  if(mode==='castelo')return['castelo','castelo-ambiente'];
  if(mode==='castelo:luta')return['castelo-luta','castelo-luta'];
  if(mode==='castelo:sacada')return['castelo-sacada','castelo-varanda'];
  if(mode==='castelo:boss')return['castelo-boss','castelo-boss'];
  return[];
}
function resolveSlot(mode){
  if(mode in musicEls||musicResolving[mode])return;
  const names=slotNames(mode);
  if(!names.length)return;
  musicResolving[mode]=true;
  const queue=[];
  names.forEach(function(n){MUSIC_EXTS.forEach(function(x){queue.push(n+'.'+x);});});
  let i=0;
  (function next(){
    if(i>=queue.length){musicResolving[mode]=false;musicEls[mode]=null;return;}
    const src=MUSIC_DIR+queue[i++];
    if(src in srcCache){if(srcCache[src])musicEls[mode]=srcCache[src];else next();return;}
    loadAudioFile(src,function(el){
      srcCache[src]=el;
      if(el){musicResolving[mode]=false;musicEls[mode]=el;}
      else next();
    });
  })();
}
/* ---- detecção automática do modo, lendo o estado do jogo ---- */
function isBossEnemy(e){
  if(!e||e.dead)return false;
  if(e.type==='rkm')return false;
  if(e.type==='rk')return true;
  if(BOSS_TYPES.indexOf(e.type)>=0)return true;
  if(typeof e.maxHp==='number'&&e.maxHp>=1200)return true;
  return false;
}
function detectMode(){
  try{
    /* derrota tem prioridade: interrompe qualquer música de fundo */
    if(typeof player!=='undefined'&&player&&player.dead)return 'morte';
    /* v1.3.0: a expansão informa zonas/estados novos (vulcan, azul, portão,
       cerberus, juiz, silêncio absoluto…) */
    if(window.__MUSIC_ZONE)return window.__MUSIC_ZONE;
    /* ==== escola vazia (???) — a fase informa o próprio modo de música ==== */
    if(window.SCHOOL&&window.SCHOOL.musicMode){const sm=window.SCHOOL.musicMode();if(sm)return sm;}
    /* ==== O CONVITE (castelo) — a fase informa o próprio modo ==== */
    if(window.CASTELLO&&window.CASTELLO.musicMode){const cm=window.CASTELLO.musicMode();if(cm)return cm;}
    if(typeof game==='undefined'||!game)return curMode;
    const st=game.state;
    if(st==='dead')return 'morte';
    if(st==='menu')return 'menu';
    if(st==='ending')return 'win';
    if(st==='reiintro'||st==='reideath')return 'boss:rk';
    if(st==='e404intro')return 'boss:e404';
    if(st==='caronte'||st==='boatride'||st==='carontefight')return 'boss:caronte';
    if(typeof enemies!=='undefined'&&Array.isArray(enemies)){
      for(let i=0;i<enemies.length;i++){
        const e=enemies[i];
        if(!e||e.dead)continue;
        if(e.type==='rk')return e.p2?'rk2':'boss:rk';
        if(isBossEnemy(e))return 'boss:'+(BOSS_SLUGS[e.type]||e.type);
      }
    }
    if(st==='bossintro'||st==='knightintro'||st==='knightdeath')return 'boss';
  }catch(err){}
  return 'run';
}
function elVolTarget(){
  const m=(typeof opts!=='undefined'&&typeof opts.music==='number')?opts.music:.5;
  return Math.max(0,Math.min(1,m*.85))*deathFade*deathFade;
}
function updateEl(el){
  if(!el)return true;
  const tv=elVolTarget();
  try{
    if(muted||tv<=.001){
      if(!el.paused){
        el.volume=Math.max(0,el.volume-.09);
        if(el.volume<=.002){el.pause();return true;}
      }
      return el.paused;
    }
    if(el.paused){
      el.volume=0;
      const p=el.play();if(p&&p.catch)p.catch(function(){});
    }
    const d=tv-el.volume;
    el.volume+=Math.abs(d)<.02?d:d*.14;
    return false;
  }catch(e){return true;}
}
/* ---- temas sintetizados por modo ---- */
function tone(t,type,f,dur,vol,detune){
  try{
    if(!audioCtx)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.value=f;
    if(detune)o.detune.value=detune;
    env(g,t,vol,dur,.012);
    o.connect(g);g.connect(musBus);
    o.start(t);o.stop(t+dur+.1);
  }catch(e){}
}
/* drone ambiente — o clima clássico (menu/run/morte) */
function padDrone(t){
  const quiet=curMode==='menu'?.6:1;
  const base=(musicStep%2===0)?55:41.2;   /* A1 / E1 — drone do inferno */
  try{
    const o=audioCtx.createOscillator(),o2=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type='sine';o2.type='triangle';
    o.frequency.value=base;o2.frequency.value=base*2.005;
    const dur=4.5;
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(.05*quiet,t+1.4);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);o2.connect(g);g.connect(musBus);
    o.start(t);o2.start(t);o.stop(t+dur+.1);o2.stop(t+dur+.1);
    if(musicStep%3===1){
      const scale=[110,130.8,146.8,164.8,196,220];
      const f=scale[Math.floor(Math.random()*scale.length)];
      const mo=audioCtx.createOscillator(),mg=audioCtx.createGain();
      mo.type='triangle';mo.frequency.value=f;
      mg.gain.setValueAtTime(.0001,t+.8);
      mg.gain.exponentialRampToValueAtTime(.03*quiet,t+1.1);
      mg.gain.exponentialRampToValueAtTime(.0001,t+2.6);
      mo.connect(mg);mg.connect(musBus);
      mo.start(t+.8);mo.stop(t+2.8);
    }
  }catch(e){}
}
/* padrões de 16 passos dos novos temas (0 = pausa) */
const THEME_SEQ={
  /* chefes em geral — marcha tensa */
  boss:{step:.30,
    bass:[55,0,55,0,65.41,0,49,0,55,0,55,0,73.42,0,65.41,0],
    sub:[110,0,0,0,130.8,0,0,0,98,0,0,0,146.8,0,0,0],
    tick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0]},
  /* VELHO REI fase I — valsa lenta e majestosa do rei de xadrez */
  'boss:rk':{step:.42,
    bass:[55,0,0,0,43.65,0,0,0,49,0,0,0,41.2,0,0,0],
    arp:[220,0,0,261.6,0,0,329.6,0,0,293.7,0,0,261.6,0,0,0],
    tick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]},
  /* NOVO — VELHO REI fase II (Espehos das Sombras): relógio de xadrez
     acelerando + baixo cromático + arpejo de espelhos desafinados */
  rk2:{step:.21,
    bass:[55,0,55,58.27,0,55,0,51.91,55,0,55,58.27,61.74,0,58.27,0],
    arp:[440,523.25,659.25,493.88,440,587.33,659.25,415.3,440,523.25,659.25,493.88,698.46,659.25,587.33,493.88],
    tick:[1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1],
    mirror:true},
  /* vitória — arpejo maior calmo */
  win:{step:.32,
    arp:[523.25,659.25,783.99,1046.5,783.99,659.25,523.25,392,523.25,659.25,783.99,1046.5,783.99,659.25,523.25,392]},
  /* ==== v1.5.7 — OS DOIS TEMAS DO CÉRBERO ==== */
  /* CERBERUS 1 — "guardião do inferno": marcha ritual lenta em Sol menor,
     drone fundo, três latidos de serra (as três gargantas) e sinos longos */
  cerberus:{step:.46,
    bass:[49,0,0,0,0,0,49,0,46.2,0,0,0,0,0,43.65,0],
    sub:[98,0,0,0,0,0,98,0,92.5,0,0,0,0,0,87.3,0],
    arp:[293.7,0,0,0,0,0,349.2,0,0,0,311.1,0,0,0,0,0],
    horn:[0,0,0,0,110,0,110,0,0,0,110,0,0,0,0,0]},
  /* CERBERUS 2 — "juiz da sentença negra": a sentença em Am — martelo grave
     (Lá·Fá·Dó·Mi), arpejos de julgamento em 16 e o sino do veredito */
  sentenca0:{step:.30,
    bass:[55,0,0,0,43.65,0,0,0,65.41,0,0,0,41.2,0,49,0],
    sub:[110,0,0,0,87.3,0,0,0,130.8,0,0,0,82.4,0,98,0],
    arp:[440,523.25,659.25,880,349.2,440,523.25,698.5,523.25,659.25,784,1046.5,329.6,415.3,493.9,659.25],
    tick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0]},
  /* ==== escola vazia — quase silêncio. drone fundíssimo esparso ==== */
  escola:{step:6.4,
    bass:[0,0,0,0,0,0,0,0,41.2,0,0,0,0,0,0,0]},
  /* perseguição — pulso grave curto, desconfortável */
  'escola:cacada':{step:.52,
    bass:[46.25,0,0,0,0,0,43.65,0,46.25,0,0,0,0,0,41.2,0],
    tick:[0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0]},
  /* espelho / escola invertida — dois tons desafinados, raros */
  'escola:espelho':{step:2.8,
    bass:[0,0,0,0,55,0,0,0,0,0,0,0,51.9,0,0,0],
    arp:[0,0,0,0,0,0,233.1,0,0,0,0,0,0,0,220.5,0],
    mirror:true},
  /* ritual — drone que cresce */
  'escola:ritual':{step:3.2,
    bass:[36.7,0,0,0,38.9,0,0,0,36.7,0,0,0,34.6,0,0,0],
    sub:[73.4,0,0,0,0,0,0,0,77.8,0,0,0,0,0,0,0]},
  /* inundação — abafado, bolhas fundas */
  'escola:inundacao':{step:1.9,
    bass:[32.7,0,0,0,0,0,0,0,30.5,0,0,0,0,0,0,0]},
  /* ==== O CONVITE (castelo) — v0.9.10 ====
     castelo: sinos distantes e úmidos sobre drone de pedra
     luta: cordas arrastadas (a casa reage)
     sacada: quase nada — caixinha de música torta, vento
     boss: marcha de ossos com sino rachado */
  castelo:{step:2.6,
    bass:[49,0,0,0,0,0,0,0,46.2,0,0,0,0,0,0,0],
    arp:[196,0,0,0,233.1,0,0,0,174.6,0,0,0,0,0,0,0],
    sub:[98,0,0,0,0,0,0,0,92.5,0,0,0,0,0,0,0]},
  'castelo:luta':{step:.62,
    bass:[43.65,0,46.2,0,43.65,0,41.2,0,43.65,0,46.2,0,49,0,46.2,0],
    tick:[0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,1],
    mirror:true},
  'castelo:sacada':{step:4.4,
    arp:[0,0,830.6,0,0,0,0,0,0,0,780,0,0,0,0,0],
    bass:[0,0,0,0,0,0,0,0,36.7,0,0,0,0,0,0,0]},
  'castelo:boss':{step:.48,
    bass:[36.7,0,0,36.7,0,0,34.6,0,36.7,0,0,36.7,0,38.9,0,0],
    sub:[73.4,0,0,0,73.4,0,0,0,73.4,0,0,0,77.8,0,0,0],
    tick:[1,0,0,0,1,0,0,0,1,0,0,0,1,1,0,0]}
};
function themeFor(mode){
  if(THEME_SEQ[mode])return THEME_SEQ[mode];
  /* v1.5.7: as etapas da SENTENÇA aceleram o mesmo tema (juízo que se fecha) */
  if(mode==='sentenca1'||mode==='sentenca2'||mode==='sentenca3'){
    const S=Object.assign({},THEME_SEQ.sentenca0);
    if(mode==='sentenca1'){S.step=.26;S.mirror=true;}
    if(mode==='sentenca2'){S.step=.235;}
    if(mode==='sentenca3'){S.step=.215;S.mirror=true;S.tick=[1,0,1,0,1,0,0,0,1,0,1,0,1,1,1,0];}
    return S;
  }
  if(mode&&mode.indexOf('boss:')===0)return THEME_SEQ.boss;
  return null;
}
/* ---- agendador principal (chamado por frame pelo game.js) ---- */
function scheduleAt(t){
  const seq=themeFor(curMode);
  if(!seq){padDrone(t);musicNext=t+5.2;return;}
  const L=16,i=musicStep%L;
  try{
    const b=seq.bass?seq.bass[i]:0;
    if(b)tone(t,'triangle',b,seq.step*1.8,.055);
    const s=seq.sub?seq.sub[i]:0;
    if(s)tone(t,'square',s,seq.step*.6,.028);
    const a=seq.arp?seq.arp[i]:0;
    if(a){
      tone(t,'triangle',a,seq.step*1.7,.028);
      if(seq.mirror){tone(t,'triangle',a,seq.step*1.7,.02,9);tone(t,'sine',a*2,seq.step*1.2,.012,-9);}
    }
    /* v1.5.7: o LATIDO DE SERRA — as três gargantas do guardião (tema cerberus) */
    const hn=seq.horn?seq.horn[i]:0;
    if(hn){tone(t,'sawtooth',hn,hn,seq.step*2.1,.038);tone(t,'triangle',hn*.5,seq.step*2.4,.05);}
    if(seq.tick&&seq.tick[i])noiseAt(t,.03,.018,6000,'highpass',musBus);  /* tique-taque do relógio do rei */
  }catch(e){}
  musicNext=t+seq.step;
}
function musicTick(){
  if(!audioCtx||audioCtx.state!=='running')return;
  const now=audioCtx.currentTime;
  const mdt=Math.min(.05,Math.max(0,now-lastMusT));lastMusT=now;
  /* troca de modo (com detecção automática do estado do jogo) */
  const want=detectMode();
  if(want!==curMode){
    curMode=want;musicStep=0;
    deathFading=(curMode==='morte');       /* derrota: inicia fade degradável */
    if(!deathFading){deathFade=1;applyDuck();}  /* voltou ao menu/jogo: volume volta */
    if(prevEl&&prevEl!==curEl){try{prevEl.pause();}catch(e){}}
    prevEl=curEl;
    const el=musicEls[curMode];
    if(el&&el!==curEl&&!(curMode==='morte'&&deathFade>0)){curEl=el;el.loop=true;el.volume=0;}
    else if(!el){curEl=null;resolveSlot(curMode);}
  }
  /* fade degradável na derrota (e restauração suave ao sair da morte) */
  if(deathFading){
    deathFade=Math.max(0,deathFade-mdt/2.8);
    applyDuck();
  }else if(deathFade<1){
    deathFade=Math.min(1,deathFade+mdt*2);
    applyDuck();
  }
  /* revisita a procura de arquivo do modo atual (só se ainda não resolvido).
     se o slot ficou vazio, re-tenta a cada 25s — música nova colocada na
     pasta enquanto o jogo está aberto passa a ser detectada sozinha */
  if(!curEl&&musicEls[curMode]===null){
    if(!musicReT[curMode])musicReT[curMode]=now;
    else if(now-musicReT[curMode]>25){delete musicEls[curMode];delete musicReT[curMode];}
  }
  if(!curEl&&!(curMode in musicEls))resolveSlot(curMode);
  /* a música de game over só entra DEPOIS do fade da derrota terminar */
  if(!curEl&&deathFade<=0&&musicEls[curMode]){curEl=musicEls[curMode];curEl.loop=true;curEl.volume=0;}
  /* elementos de arquivo: fade in/out, mute, loop */
  if(prevEl&&prevEl!==curEl){if(updateEl(prevEl))prevEl=null;}
  if(curEl)updateEl(curEl);
  if(muted)return;
  if(now<musicNext)return;
  if(curMode==='morte'){
    /* derrota interrompeu a música de fundo: nada de tema sintetizado no game over */
    musicNext=now+.3;
    return;
  }
  if(musicNext<now)musicNext=now+.05;   /* re-sincroniza a grade se atrasou */
  scheduleAt(musicNext);
  musicStep++;
}
/* procura antecipada dos slots fixos assim que a página carrega */
['menu','run','boss','boss:rk','rk2','win','morte','escola','escola:cacada','escola:espelho','escola:ritual','escola:inundacao','castelo','castelo:luta','castelo:sacada','castelo:boss','cerberus','sentenca0'].forEach(function(m){resolveSlot(m);}); /* v1.5.7: os dois temas do Cérbero entram na procura cedo */

/* diagnóstico no console: window.__AUDIO_DEBUG() */
window.__AUDIO_DEBUG=function(){
  return{mode:curMode,file:curEl?curEl.src:null,vol:curEl?curEl.volume:0,
    ctx:audioCtx?audioCtx.state:null,muted:muted,duck:Math.round(deathFade*100)/100,
    muffle:muffV, /* v1.5.7: o som ambiente está abafado? */
    musGain:musBus?Math.round(musBus.gain.value*1000)/1000:0,slots:Object.keys(musicEls)};
};
/* re-escaneia as pastas de áudio na hora (console): window.__AUDIO_RESCAN() */
window.__AUDIO_RESCAN=function(){
  let n=0;
  for(const k in sfxRes)if(!sfxRes[k]){delete sfxRes[k];n++;}
  for(const k in sfxResT)delete sfxResT[k];
  for(const k in musicEls)if(!musicEls[k]){delete musicEls[k];n++;}
  for(const k in musicReT)delete musicReT[k];
  for(const k in srcCache)if(!srcCache[k])delete srcCache[k];
  for(const k in musicResolving)delete musicResolving[k];
  return '__AUDIO_RESCAN: '+n+' slot(s) vazio(s) serão procurados de novo';
};

/* v1.1.0: dip da música para o menu ocioso (a descida da câmera / CÍRCULO X) */
window.__musicDip=function(f){try{if(musDip&&audioCtx)musDip.gain.setTargetAtTime(f,audioCtx.currentTime,.5);}catch(e){}};
