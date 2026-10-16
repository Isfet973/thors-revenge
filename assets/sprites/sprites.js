/* ============================================================
   THOR REVENGE — sprites.js v4 (SPRITES 100% TROCAMÁVEIS POR PASTA)
   ============================================================
   COMO USAR:
   1. Salve o seu PNG/JPG/WEBP em  assets/sprites/  com um dos nomes
      aceitos (lista completa em COLOQUE-SPRITES-AQUI.txt).
   2. Pronto. O jogo detecta sozinho — mesmo com o jogo já rodando
      (re-escaneia a pasta a cada ~15s e sempre que a janela ganha foco).
   3. Nomes aceitos ficam MAIS fáceis na v4:
        - maiúsculas/minúsculas tanto faz   (VELHO-REI.png ok)
        - acentos tanto faz                 (corrupião.png ok)
        - espaço ou "_" no lugar do "-"     ("velho rei.png" ok)
        - .png .jpg .jpeg .webp (maiúsculo ou minúsculo)
   4. Opcional — arquivo de manifesto  assets/sprites/sprites.txt
      (uma linha por sprite, '#' comenta):
        velho-rei = minha-arte-do-rei.png
        sombra: sombra_custom.jpg
   5. Diagnóstico no console (F12):
        __SPRITES_DEBUG()   — o que foi encontrado / o que falta
        __SPRITES_RESCAN()  — força nova varredura da pasta

   SEM O ARQUIVO, O DESENHO ORIGINAL DO JOGO É USADO — nada quebra,
   nunca fica invisível. Efeitos de combate (flash de dano, veneno,
   lentidão, telegrafia) continuam aparecendo sobre o seu sprite.

   Ganchos usados pelo game.js (já instalados no motor):
     THOR_PNG.drawPlayer(...)       — Thor
     THOR_PNG.drawEnemy(...)        — TODOS os inimigos (incl. cavaleiros)
     THOR_PNG.drawParadise(...)     — inimigos no Limbo (Falso Paraíso)
     THOR_PNG.drawBossSprite(...)   — CÉRBERO inteiro
     THOR_PNG.drawBossHead(...)     — cada cabeça do CÉRBERO
     THOR_PNG.drawCaronte(...)      — Caronte na batalha do rio
     THOR_PNG.drawFloor(...)        — piso das salas (fundo.png)
   ============================================================ */
(function(){
'use strict';
const DIR='assets/sprites/';
const EXTS=['png','jpg','jpeg','webp','gif'];/* v1.2.0: + GIF animado */
const EXTS_UP=['PNG','JPG','JPEG','WEBP','GIF'];
const VID_EXTS=['mp4','webm','mov'];/* v1.2.0: vídeo para animações/cutscenes */
function isVideoFile(f){return VID_EXTS.some(function(e){return f.toLowerCase().endsWith('.'+e);});}
const TAU=Math.PI*2;

/* ---- normalização: minúsculas, sem acentos, espaço/_ viram "-" ---- */
function norm(s){
  return String(s).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[_\s]+/g,'-').replace(/-+/g,'-')
    .replace(/[^a-z0-9\-]/g,'');
}

/* ---- slot → apelidos aceitos (o 1º arquivo que existir vence) ----
   NÃO precisa decorar: qualquer apelido desta lista funciona.       */
const SLOTS={
  /* protagonista e cenário */
  thor:['thor','thor-cachorro','player','cachorro','dog'],
  fundo:['fundo','cenario','background','bg','piso','chão'],
  /* chefes */
  'velho-rei':['velho-rei','velho rei','rei','rk','old-king'],
  espelho:['espelho','espelho-do-rei','reflexo','rkm','sombra-do-rei'],
  'erro-404':['erro-404','e404','404','erro'],
  bruxo:['bruxo','mb','bruxo-da-penumbra'],
  carrasco:['carrasco','ex','carrasco-da-penumbra'],
  viuva:['viúva','viuva','vi','viuva-da-penumbra','viúva-da-penumbra'],
  golem:['golem','gz','golem-de-cinzas'],
  cerbero:['cérbero','cerbero','cerberus','guardião','guardiao'],
  'cerbero-cabeca':['cérbero-cabeça','cerbero-cabeca','cabeça','cabeca'],
  caronte:['caronte','barqueiro'],
  'cavaleiro-branco':['cavaleiro-branco','cw1','conquista'],
  'cavaleiro-vermelho':['cavaleiro-vermelho','cw2','guerra'],
  'cavaleiro-preto':['cavaleiro-preto','cw3','fome'],
  'cavaleiro-descorado':['cavaleiro-descorado','cw4','morte'],
  /* inimigos comuns */
  sombra:['sombra','sh','sombra-desperta'],
  brutamonte:['brutamonte','br'],
  cuspedor:['cuspedor','sp'],
  feiticeiro:['feiticeiro','fs','feiticeiro-de-gelo'],
  'espectro-veloz':['espectro-veloz','ru','espectro veloz'],
  ceifador:['ceifador','ce'],
  'grão-de-ossos':['grão-de-ossos','grao-de-ossos','gd'],
  'alma-perdida':['alma-perdida','al'],
  espectro:['espectro','es'],
  lamentadora:['lamentadora','la'],
  corrupiao:['corrupião','corrupiao','cr','enxame'],
  'corrupiao-menor':['corrupião-menor','corrupiao-menor','crs'],
  vigia:['vigia','vg'],
  peregrino:['peregrino','pg','peregrino-cinzento'],
  'faísca-fantasma':['faísca-fantasma','faisca-fantasma','fa','faísca'],
  observador:['observador','observer'],
  peao:['peão','peao','pn','peão-do-rei','peao-do-rei'],
  filhote:['filhote','puppy','cãozinho','caozinho','cão'],
  /* v1.3.3: MORCEGO FLAMEJANTE */
  morcego:['morcego','morcego-flamejante','bat','morcego flamejante'],
  /* v1.2.0: DIRECIONAIS de Thor — o jogo escolhe sozinho pela direção */
  'thor-frente':['thor-frente','thor_frente','thor-frente'],
  'thor-tras':['thor-tras','thor_tras'],
  'thor-lado':['thor-lado','thor_lado'],
  /* v1.2.0: CUTSCENE — png/gif/vídeo tocado na abertura da escola */
  'cutscene':['cutscene','cutscene-escola','abertura','abertura-escola']
};
/* tipo interno do inimigo → slot (o resto cai no slot com o próprio nome) */
const TYPE2SLOT={rk:'velho-rei',rkm:'espelho',e404:'erro-404',mb:'bruxo',ex:'carrasco',
  vi:'viuva',gz:'golem',cw1:'cavaleiro-branco',cw2:'cavaleiro-vermelho',cw3:'cavaleiro-preto',
  cw4:'cavaleiro-descorado',observer:'observador',pn:'peao',puppy:'filhote',
  sh:'sombra',br:'brutamonte',sp:'cuspedor',fs:'feiticeiro',ru:'espectro-veloz',
  ce:'ceifador',gd:'grao-de-ossos',al:'alma-perdida',es:'espectro',la:'lamentadora',
  cr:'corrupiao',crs:'corrupiao-menor',vg:'vigia',pg:'peregrino',fa:'faisca-fantasma',
  cb:'caronte',mf:'morcego'}; /* v1.3.3: mf → morcego */

const cache={};         /* slot → Image|null (null = confirmado ausente) */
const probing={};       /* slot → true enquanto procura */
const queues={};        /* slot → fila de candidatos (fallback sem listagem) */
const failed=new Set(); /* URLs 404 conhecidas (só usado sem listagem) */
let manifestFile=null;  /* nome do manifesto detectado (p/ debug) */
const manifestMap={};   /* slot → arquivo exato declarado no manifesto */
let dirFiles=null;      /* Set com arquivos da pasta (listagem do servidor) */
let dirNorm={};         /* nome-base normalizado → nome real do arquivo */

/* ---- monta a lista de candidatos do slot (com variantes) ---- */
function candidatesFor(slot){
  if(queues[slot])return queues[slot];
  const aliases=(SLOTS[slot]&&(SLOTS[slot].length?SLOTS[slot]:[slot]))||[slot];
  const out=[];
  aliases.forEach(function(a){
    const forms=[a,norm(a)];
    forms.forEach(function(f){
      if(out.indexOf(f)<0&&f)out.push(f);
      if(f.indexOf('-')>=0){
        const sp=f.replace(/-/g,' ');
        if(out.indexOf(sp)<0)out.push(sp);
      }
    });
  });
  queues[slot]=out;
  return out;
}

/* ---- manifesto opcional: assets/sprites/sprites.txt (ou lista.txt) ----
   v1.2.2 "TRAVESSIA LIVRE": o XHR era SÍNCRONO — congelava a thread INTEIRA
   do jogo até responder. Em disco local eram 1-5ms (invisível), mas através
   de proxy/preview eram SEGUNDOS, a cada 15s e a cada foco da janela — era
   o "jogo travado" ao passar de sala. Agora é assíncrono: chega quando chegar. */
let manifestBusy=false;
function loadManifest(){
  if(manifestBusy)return;
  manifestBusy=true;
  let pend=2;
  const fin=function(){pend--;if(pend<=0)manifestBusy=false;};
  ['sprites.txt','lista.txt'].forEach(function(f){
    try{
      const xhr=new XMLHttpRequest();
      xhr.open('GET',DIR+f+'?t='+Date.now(),true); /* v1.2.2: assíncrono */
      xhr.onload=function(){
        try{
          /* status 200 (http) ou 0 (file:// em navegadores que permitem) */
          if(xhr.status===200||xhr.status===0){
            const txt=String(xhr.responseText||'');
            if(txt){
              manifestFile=f;
              txt.split(/\r?\n/).forEach(function(line){
                line=line.trim();
                if(!line||line.charAt(0)==='#')return;
                const m=line.match(/^([^=:]+?)[ \t]*[=:][ \t]*(.+)$/);
                if(!m)return;
                const slot=norm(String(m[1]).trim());
                const file=m[2].trim().replace(/^\.\//,'');
                if(slot&&file)manifestMap[slot]=file;
              });
            }
          }
        }catch(e){}
        fin();
      };
      xhr.onerror=fin;
      xhr.send();
    }catch(e){fin();/* file:// bloqueado — sem manifesto, só nomes padrão */}
  });
}

/* ---- listagem de diretório (1 requisição por varredura, zero 404) ----
   v1.2.2 "TRAVESSIA LIVRE": era XHR SÍNCRONO (open(...,false)) — a thread do
   jogo ficava PRESA até a resposta chegar. Local: rápido demais pra notar.
   Via proxy/preview: a cada 15s (e a cada foco) o jogo congelava por
   segundos — o soft lock ao passar de sala. Agora: assíncrono com callback;
   o retorno imediato é só o estado ATUAL da listagem (sem bloquear NUNCA). */
let dirListBusy=false;
function tryDirList(cb){
  const done=function(ok){if(cb){try{cb(ok);}catch(e2){}}return ok;};
  if(dirListBusy)return done(dirFiles?true:false);
  dirListBusy=true;
  try{
    const xhr=new XMLHttpRequest();
    xhr.open('GET',DIR+'?t='+Date.now(),true); /* v1.2.2: assíncrono */
    xhr.onload=function(){
      dirListBusy=false;
      try{
        if(xhr.status!==200&&xhr.status!==0)return void done(false);
        const txt=String(xhr.responseText||'');
        if(!/href\s*=/i.test(txt))return void done(false);
    const re=/href\s*=\s*"([^"#?]+)"/gi;
    const files=new Set();let m;
    while((m=re.exec(txt))){
      let f;
      try{f=decodeURIComponent(m[1]);}catch(e2){f=m[1];}
      f=f.replace(/^\.\//,'');
      if(!f||f.charAt(0)==='/'||f.indexOf('/')>=0||f.charAt(f.length-1)==='/')continue;
      files.add(f);
    }
    if(files.size===0)return false;
    /* validação: a listagem tem que ser DESTA pasta (sprites.js sempre existe) */
    const EXTS2=EXTS.concat(VID_EXTS);
    function extScore(f){
      const m=f.match(/\.([A-Za-z0-9]+)$/);const e=m?m[1]:'';
      const i=EXTS2.indexOf(e.toLowerCase());
      if(i<0)return 99;
      return (e===e.toLowerCase()?0:10)+i; /* minúscula vence; png primeiro */
    }
    const bases={};
    files.forEach(function(f){
      const n=norm(f.replace(/\.[A-Za-z0-9]+$/,''));
      if(!n)return;
      if(!(n in bases)||extScore(f)<extScore(bases[n]))bases[n]=f;
    });
        if(!bases['spritesjs']&&!bases['coloque-sprites-aqui']&&!bases['sprites-txt'])return void done(false);
        dirFiles=files;dirNorm=bases;
        return void done(true);
      }catch(e){return void done(false);}
    };
    xhr.onerror=function(){dirListBusy=false;done(false);};
    xhr.send();
  }catch(e){dirListBusy=false;return done(false);}
  return dirFiles?true:false;
}

/* procura o arquivo de um slot na listagem (ordem de apelidos = prioridade) */
function dirResolve(slot){
  if(!dirFiles)return null;
  const cands=candidatesFor(slot);
  for(let i=0;i<cands.length;i++){
    const f=dirNorm[cands[i]];
    if(f)return f;
  }
  return null;
}

/* carrega o arquivo do slot; mantém o sprite antigo se o novo falhar.
   bust=true → cache-busting (?r=...) para re-ler do disco um arquivo
   TROCADO com o mesmo nome (funciona em http:// e file://) */
function probeFile(slot,file,bust){
  probing[slot]=true;
  const old=cache[slot]||null;
  let url=(DIR+file).split('/').map(encodeURIComponent).join('/');
  if(bust)url+='?r='+Date.now();
  /* v1.2.0: VÍDEO — <video> mudo em laço serve de sprite (anima de verdade) */
  if(isVideoFile(file)){
    const v=document.createElement('video');
    v.muted=true;v.loop=true;v.autoplay=true;v.setAttribute('playsinline','');
    v.oncanplay=function(){probing[slot]=false;cache[slot]=v;v.__file=file;try{v.play();}catch(e){}};
    v.onerror=function(){probing[slot]=false;if(!old)cache[slot]=null;};
    v.src=url;
    return;
  }
  const im=new Image();
  im.onload=function(){probing[slot]=false;cache[slot]=im;im.__file=file;};
  im.onerror=function(){probing[slot]=false;if(!old)cache[slot]=null;};
  im.src=url;
}

/* 1ª resolução de um slot (cache vazio) */
function probeSlot(slot){
  if(slot in cache||probing[slot])return;
  const f=manifestMap[slot]||dirResolve(slot);
  if(f){probeFile(slot,f);return;}
  if(dirFiles){cache[slot]=null;return;} /* listagem confirma ausência */
  /* fallback sem listagem (file://): fila sequencial de nomes × extensões */
  probing[slot]=true;
  const cands=candidatesFor(slot);
  const queue=[];
  cands.forEach(function(n){EXTS.forEach(function(x){queue.push(n+'.'+x);});});
  if(cands[0])EXTS_UP.forEach(function(x){queue.push(cands[0]+'.'+x);});
  let i=0;
  (function next(){
    while(i<queue.length&&failed.has(DIR+queue[i]))i++; /* pula 404 conhecidos */
    if(i>=queue.length){probing[slot]=false;cache[slot]=null;return;}
    const raw=DIR+queue[i++];
    const im=new Image();
    im.onload=function(){probing[slot]=false;cache[slot]=im;im.__file=raw.slice(DIR.length);};
    im.onerror=function(){failed.add(raw);next();};
    im.src=raw.split('/').map(encodeURIComponent).join('/');
  })();
}

/* ---- inicialização: manifesto → listagem → sondagem de todos os slots ----
   v1.2.2: a sondagem espera a listagem assíncrona (chegar OU falhar).
   Com listagem: 1 request por slot. Sem ela (file://): a fila de fallback
   roda UMA vez, como antes — e nunca mais ~1.000 requests por varredura. */
loadManifest();
tryDirList(function(){Object.keys(SLOTS).forEach(probeSlot);});

/* ---- RE-ESCAN: pega arquivos adicionados/trocados com o jogo rodando ----
   Com listagem: re-resolve tudo em 1 requisição (troca de arquivo ao vivo!).
   Sem listagem (file://): force=true re-sonda os vazios (ex.: foco/manual). */
function rescan(force){
  loadManifest();
  /* v1.2.2: o trabalho roda NO CALLBACK da listagem (que agora é assíncrona).
     Nada mais bloqueia a thread; o tick de 15s sem listagem NÃO dispara mais
     a fila de fallback (era ~1.000 requests — afogava a rede via proxy). */
  tryDirList(function(listed){
  if(listed){
    const touch=function(k){
      if(probing[k])return;
      const f=manifestMap[k]||dirResolve(k);
      if(!f){
        /* listagem autoritativa e sem manifesto: arquivo sumiu → vetor */
        if(dirFiles&&cache[k]&&!manifestMap[k])cache[k]=null;
        return;
      }
      if(cache[k]&&cache[k].__file===f){
        /* v0.9.10: mesmo arquivo, mas rescan manual/foco → pode ter sido
           TROCADO (mesmo nome, outra arte): re-lê com cache-busting */
        if(force)probeFile(k,f,true);
        return;
      }
      probeFile(k,f);
    };
    Object.keys(SLOTS).forEach(touch);
    Object.keys(cache).forEach(function(k){if(!(k in SLOTS))touch(k);});
  }else if(force){
    /* sem listagem (file://): re-sonda vazios E re-lê os carregados
       (troca de arte com o mesmo nome agora atualiza ao voltar o foco) */
    Object.keys(cache).forEach(function(k){
      if(probing[k])return;
      if(cache[k])probeFile(k,cache[k].__file||candidatesFor(k)[0]+'.png',true);
      else if(cache[k]===null){delete cache[k];probeSlot(k);}
    });
  }
  });
}
setInterval(function(){if(!document.hidden)rescan(false);},15000);
window.addEventListener('focus',function(){rescan(true);});
document.addEventListener('visibilitychange',function(){if(!document.hidden)rescan(true);});

function imgFor(slot){
  if(slot in cache)return cache[slot];
  if(!probing[slot])probeSlot(slot);
  return null;
}
function imgForType(type){
  const slot=TYPE2SLOT[type]||norm(type)||type;
  if(slot in cache)return cache[slot];
  if(!probing[slot])probeSlot(slot);
  return null;
}
/* v1.2.0: DIRECIONAIS — escolhe frente/tras/lado pela direção do olhar.
   Só ativa se PELO MENOS UM variante existir; senão o desenho antigo vale.
   frente = olhando para baixo (câmera), tras = para cima, lado = perfil
   (espelhado automaticamente para a esquerda). */
function dirPick(base,ang){
  const fr=imgFor(base+'-frente'),tr=imgFor(base+'-tras'),ld=imgFor(base+'-lado');
  if(!fr&&!tr&&!ld)return null;
  let a=((ang||0)%TAU+TAU)%TAU;
  let pick,flip=false;
  if(a>Math.PI*.25&&a<Math.PI*.75){pick=fr||ld||tr;flip=false;}
  else if(a>Math.PI*1.25&&a<Math.PI*1.75){pick=tr||ld||fr;flip=false;}
  else if(a>=Math.PI*.75&&a<=Math.PI*1.25){pick=ld||fr||tr;flip=true;}
  else{pick=ld||fr||tr;flip=false;}
  if(!pick)return null;
  return{img:pick,flip:flip};
}
function dirDraw(c,pick,cx,cy,bw,bh,alpha,rot){
  try{
    c.save();
    c.translate(cx,cy);
    if(rot)c.rotate(rot);
    if(pick.flip)c.scale(-1,1);
    fitDraw(c,pick.img,0,0,bw,bh,alpha);
    c.restore();
    return true;
  }catch(e){return false;}
}
/* desenha a imagem cabendo na caixa (preserva proporção, centraliza) */
function fitDraw(c,img,cx,cy,bw,bh,alpha){
  const iw=img.naturalWidth||img.videoWidth||img.width,ih=img.naturalHeight||img.videoHeight||img.height;
  if(!iw||!ih)return;
  const k=Math.min(bw/iw,bh/ih);
  const w=iw*k,h=ih*k;
  if(alpha!==undefined)c.globalAlpha=alpha;
  c.drawImage(img,cx-w/2,cy-h/2,w,h);
  if(alpha!==undefined)c.globalAlpha=1;
}
/* raio efetivo p/ overlays de status */
function boxR(e){return Math.max(12,(e.r||14)*1.5);}

/* ---- overlays de combate sobre o PNG (legibilidade preservada) ---- */
function statusOverlays(c,e,g,ey){
  const cy=(ey!==undefined?ey:e.y),r=boxR(e);
  if(e.flash>0){
    c.fillStyle='rgba(255,255,255,'+Math.min(.8,e.flash*7)+')';
    c.beginPath();c.arc(e.x,cy,r+4,0,TAU);c.fill();
  }
  if(e.slowT>0||e.poisT>0){
    c.save();c.translate(e.x,cy);
    if(e.slowT>0){c.fillStyle='rgba(159,216,255,0.3)';c.beginPath();c.arc(0,0,r+2,0,TAU);c.fill();}
    if(e.poisT>0){c.fillStyle='rgba(168,194,79,0.25)';c.beginPath();c.arc(0,0,r+2,0,TAU);c.fill();}
    c.restore();
  }
  if(e.st==='tele'){
    const gl=.35+.3*Math.sin(g.t*20);
    c.strokeStyle='rgba(255,243,196,'+gl+')';c.lineWidth=2.5;
    c.beginPath();c.arc(e.x,cy,r+12,0,TAU);c.stroke();
  }
}

/* ---- expõe os ganchos que o game.js chama ---- */
window.THOR_PNG={
  /* Thor vivo — arte olhando para a DIREITA (o jogo gira conforme a mira) */
  drawPlayer:function(c,p,g,alpha,fs){
    const img=imgFor('thor');
    if(!img)return false;
    /* v1.2.0: thor_frente/tras/lado.png — o jogo troca sozinho pela direção */
    const dp=dirPick('thor',p.angle);
    if(dp){
      try{
        c.save();
        c.translate(p.x,p.y);
        c.scale(fs||1,fs||1);
        dirDraw(c,dp,0,0,46,50,alpha,false);
        c.restore();
        return true;
      }catch(e){/* cai no modo girado */}
    }
    try{
      c.save();
      c.translate(p.x,p.y);
      c.rotate(p.angle||0);
      c.scale(fs||1,fs||1);
      fitDraw(c,img,0,0,46,50,alpha);
      c.restore();
    }catch(e){return false;}
    return true;
  },
  /* QUALQUER inimigo — sem PNG → desenho original; com PNG + overlays */
  drawEnemy:function(c,e,g,s){
    const img=imgForType(e.type);
    if(!img)return false;
    try{
      const box=Math.max(24,(e.r||14)*3);
      /* v1.2.0: <inimigo>_frente/tras/lado.png — ex. cavaleiro_branco_tras.png */
      const slot=TYPE2SLOT[e.type]||norm(e.type)||e.type;
      const dp=dirPick(slot,(e.ang===undefined?0:e.ang));
      if(dp){
        c.save();
        c.translate(e.x,e.y);
        c.scale(s||1,s||1);
        dirDraw(c,dp,0,0,box,box,e.type==='rkm'?.55:undefined,false);
        c.restore();
        statusOverlays(c,e,g);
        return true;
      }
      c.save();
      c.translate(e.x,e.y);
      c.scale(s||1,s||1);
      fitDraw(c,img,0,0,box,box,e.type==='rkm'?.55:undefined);
      c.restore();
      statusOverlays(c,e,g);
    }catch(e2){return false;}
    return true;
  },
  /* inimigos do Falso Paraíso (Limbo) — PNG com tratamento espectral */
  drawParadise:function(c,e,g,s,distort){
    const img=imgForType(e.type);
    if(!img)return false;
    try{
      const bob=Math.sin(g.t*1.4+(e.seed||0))*3,ey=e.y+bob;
      /* sombra que não corresponde à iluminação — offset proposital */
      c.fillStyle='rgba(20,16,28,'+(0.3+distort*0.2)+')';
      const so=8+Math.sin(g.t+(e.seed||0))*4;
      c.beginPath();c.ellipse(e.x+so,e.y+(e.r||14)*.55+8,(e.r||14)*s*.8,(e.r||14)*.3*s,0,0,TAU);c.fill();
      /* aura celestial que fica perturbadora com o andar */
      const haloA=.32+.18*Math.sin(g.t*2+(e.seed||0)),haloR=(e.r||14)+14;
      const halo=c.createRadialGradient(e.x,ey,2,e.x,ey,haloR);
      halo.addColorStop(0,distort<.5?'rgba(255,250,220,'+haloA+')':'rgba(220,200,180,'+(haloA*.8)+')');
      halo.addColorStop(.6,distort<.5?'rgba(255,243,196,'+(haloA*.4)+')':'rgba(200,160,160,'+(haloA*.4)+')');
      halo.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=halo;c.beginPath();c.arc(e.x,ey,haloR,0,TAU);c.fill();
      /* corpo espectral = PNG translúcido flutuando */
      const box=Math.max(24,(e.r||14)*3);
      c.save();
      c.translate(e.x,ey);c.scale(s||1,s||1);
      fitDraw(c,img,0,0,box,box,.72+.14*Math.sin(g.t*1.8+(e.seed||0)));
      c.restore();
      statusOverlays(c,e,g,ey);
    }catch(e2){return false;}
    return true;
  },
  /* CÉRBERO inteiro (se cerbero.png existir, corpo vetorial é pulado
     mas os feixes/ataques continuam desenhados pelo motor)
     v1.5.6: A FERA DORME — na cutscene de entrada o sprite PNG também
     DORME: afundado no chão, mais largo (deitado), respirando devagar e
     ESCURECIDO; acorda LENTO conforme as cabeças erguem (média de h.wake),
     esticando, erguendo e clareando de volta ao normal */
  drawBossSprite:function(c,b,g){
    const img=imgFor('cerbero');
    if(!img)return false;
    try{
      c.save();
      c.globalAlpha=(b.fade===undefined?1:b.fade);
      const box=Math.max(60,b.r*2.9);
      let wk=1;
      if(g&&g.state==='cerbintro'&&b.heads&&b.heads.length){
        wk=0;for(const h of b.heads)wk+=(h.wake===undefined?1:h.wake);
        wk=Math.max(0,Math.min(1,wk/b.heads.length));
      }
      const bh=box*1.25*(1-.20*(1-wk));      /* dormindo: mais baixo (deitado) */
      const bw=box*(1+.10*(1-wk));           /* dormindo: mais largo */
      const bob=Math.sin(g.t*1.05)*3*(1-wk); /* respiração lenta do sono */
      const cy=b.y+(box*1.25-bh)*.62+bob;    /* fundo ancorado no chão */
      fitDraw(c,img,b.x,cy,bw,bh,undefined);
      if(wk<1){
        /* v1.5.6: o véu do sono cobre EXATAMENTE o retângulo desenhado
           (mesma matemática do fitDraw — nada de círculo sobrando) */
        const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
        if(iw&&ih){
          const k=Math.min(bw/iw,bh/ih),dw=iw*k,dh=ih*k;
          c.globalAlpha=(b.fade===undefined?1:b.fade)*.34*(1-wk);
          c.fillStyle='#0d0710';
          c.fillRect(b.x-dw/2,cy-dh/2,dw,dh);
        }
      }
      c.restore();
    }catch(e){return false;}
    return true;
  },
  /* cada cabeça do CÉRBERO (usada se não houver cerbero.png inteiro) */
  drawBossHead:function(c,h,b,g){
    const img=imgFor('cerbero-cabeca');
    if(!img)return false;
    try{
      c.save();
      const box=Math.max(30,(h.r||22)*2.6);
      fitDraw(c,img,h.hx||h.x,h.hy||h.y,box,box,undefined);
      c.restore();
    }catch(e){return false;}
    return true;
  },
  /* CARONTE na batalha do rio (o remo continua desenhado pelo motor) */
  drawCaronte:function(c,cb,g,ey){
    const img=imgFor('caronte');
    if(!img)return false;
    try{
      c.save();
      const box=Math.max(60,cb.r*2.8);
      fitDraw(c,img,cb.x,ey,box,box*1.25,undefined);
      if(cb.flash>0){
        c.fillStyle='rgba(255,255,255,'+Math.min(.8,cb.flash*7)+')';
        c.beginPath();c.arc(cb.x,ey,box*.45,0,TAU);c.fill();
      }
      c.restore();
    }catch(e){return false;}
    return true;
  },
  /* piso da sala — PNG esticado sobre o chão (paredes continuam) */
  drawFloor:function(f,ROOM,rects,inv){
    const img=imgFor('fundo');
    if(!img)return false;
    try{
      f.save();
      f.beginPath();
      for(const rc of rects)f.rect(rc.x,rc.y,rc.w,rc.h);
      f.clip();
      f.globalAlpha=inv?.9:1;
      f.drawImage(img,0,0,ROOM.w,ROOM.h);
      f.restore();
    }catch(e){return false;}
    return true;
  },
  /* v1.2.0: cutscene da abertura (img/gif/vídeo) — usada pela escola */
  getCutscene:function(){return imgFor('cutscene');}
};
/* os ganchos só entram de fato se algum PNG existir (economia por frame) */
window.THOR_PNG_MODE=true;

/* ---- diagnóstico no console ---- */
function dbg(){
  const found=[],empty=[],looking=[];
  Object.keys(cache).forEach(function(k){
    if(cache[k])found.push(k+' → '+(cache[k].__file||'?'));
    else empty.push(k);
  });
  Object.keys(probing).forEach(function(k){if(probing[k])looking.push(k);});
  return{encontrados:found,faltando:empty,procurando:looking,pasta:DIR,
    manifesto:manifestFile||'nenhum (opcional: assets/sprites/sprites.txt)',
    mapaManifesto:manifestMap,
    dica:'Nomes aceitos em COLOQUE-SPRITES-AQUI.txt — acentos, maiúsculas, espaços e _ valem. __SPRITES_RESCAN() força nova varredura.'};
}
window.__SPRITES_DEBUG=dbg;
window.__SPRITES_RESCAN=function(){rescan(true);return dbg();};
console.info('[SPRITES v4] pasta: '+DIR+' — troque sprites sem tocar em código. Diagnóstico: __SPRITES_DEBUG()');
})();
