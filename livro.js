/* ============================================================
   THOR: REVENGE — livro.js · v1.9.2 "O LIVRO VIVO · A INTRODUÇÃO"
   ============================================================
   O menu vira um objeto físico: um manuscrito antigo sobre uma
   mesa de carvalho, à luz de duas velas. A capa abre com peso,
   as páginas JÁ ESTÃO ESCRITAS quando aparecem, e cada opção do
   menu tem uma interação própria com o livro (virar folha,
   aproximar a câmera, fechar o livro, consultar registros).
   v1.9.1: CÍRCULOS FECHA o livro e mostra a LOUSA (os nove
   círculos a giz + a PENUMBRA DAS ALMAS fora do desenho), cada
   opção vira uma folha com aproximação de câmera própria e o
   menu ficou mais LEVE (velas/poeira dormem quando outra tela
   cobre o livro; capa sem filtro caro por quadro).

   ARQUITETURA (desempenho em primeiro lugar):
   · A cena da mesa (madeira, vinheta, clarão) é pintada UMA vez
     num canvas estático — zero custo por quadro.
   · Velas: 2 mini-canvases (40×56) redesenhados a 11 fps.
   · Poeira: 1 canvas pequeno, 12 partículas, a cada 3 quadros.
   · Quando outra tela cobre o livro (lousa, mapa, opções,
     lista…), velas e poeira DORMEM — nada é animado às cegas.
   · UM único loop requestAnimationFrame para tudo, e ele DORME
     quando o menu não está na tela (jogo rodando / aba oculta).
   · Câmera e folhas: transforms CSS 3D (GPU) movidos por um
     mini motor de tweens com easing — nada de blur/filter caro
     por quadro (a capa agora usa uma classe CSS de sombra).
   · Máquina de estados com transição única: cliques durante uma
     animação são ignorados, e um watchdog devolve o controle
     mesmo se algo falhar — o menu nunca fica travado.

   Os IDs/botões do menu NÃO mudam: livro.js intercepta os
   cliques, executa a interação do livro e REAPLICA o clique
   original (os handlers do game.js continuam mandando).
   ============================================================ */
(function(){
'use strict';
if(window.__BOOK)return;

/* ============ estado global do livro ============ */
var ST={
  mode:'boot',      /* boot | intro | idle | busy */
  busy:false,
  menuOn:true,
  replay:false,     /* o próximo clique interceptado passa direto (replay do handler original) */
  abort:false,      /* cancela cadeias de tween (pular intro) */
  anim:'full',      /* full | fast | off — opção ANIMAÇÕES DO LIVRO */
  lite:false,       /* máquina fraca: menos poeira, vela parada */
  vert:false,       /* livro empilhado (<860px): folhas viram crossfade */
  seen:false,       /* já assistiu a abertura completa */
  spread:null,      /* 'map' | 'saves' | 'set' — spread atualmente visível */
  entryGo:false,    /* v1.9.1: o INICIAR da entrada já foi apertado (guarda duplo clique) */
  entryPending:false,/* v1.9.1: a cutscene do livro está a caminho do fim — a ENTRADA aparece quando ela terminar */
  skipAt:0,         /* v1.9.1: instante do último skip (o mesmo Enter não pode pular E apertar INICIAR) */
  swallow:false,    /* v1.9.1: o clique que pulou a intro é engolido (não ativa botão por baixo) */
  entryCine:false   /* v1.9.2: a ENTRADA deve surgir em MODO CINE (sobre o quadro final da introdução) */
};
var WDs=[]; /* watchdogs ativos */

/* ============ util ============ */
function $(id){return document.getElementById(id);}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function easeIO(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function easeO(t){return 1-Math.pow(1-t,3);}
function easeI(t){return t*t*t;}
function easeQuint(t){return t<.5?16*t*t*t*t*t:1-Math.pow(-2*t+2,5)/2;}
function easeBack(t){var c=1.35;return 1+ (c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);}
function D(mult){ /* multiplicador de duração conforme a opção de animação */
  if(ST.anim==='off')return .2*(mult||1);
  if(ST.anim==='fast')return .55*(mult||1);
  return (mult||1);
}
function animOff(){return ST.anim==='off';}

/* ============ mini motor de tweens (UM loop para tudo) ============ */
var TWS=[],raf=0,_last=0,cndAcc=0,dustSkip=0,idleStill=false;
/* telas que cobrem o livro por inteiro — enquanto qualquer uma
   estiver aberta (e o livro não estiver animando), velas e poeira
   dormem: nada de animar às cegas atrás de um overlay opaco */
var COVER_IDS=['descer','circles','conquistas','book','versionInfo','saves','weapons'];
function menuCovered(){
  for(var i=0;i<COVER_IDS.length;i++){var el=document.getElementById(COVER_IDS[i]);if(el&&!el.classList.contains('hidden'))return true;}
  return false;
}
function tw(o){o._t=0;o.ease=o.ease||easeIO;TWS.push(o);startLoop();return o;}
function stepTweens(dt){
  for(var i=TWS.length-1;i>=0;i--){
    var w=TWS[i];w._t+=dt/w.dur;
    var p=w._t>=1?1:w.ease(clamp(w._t,0,1));
    try{w.step(p);}catch(e){}
    if(w._t>=1){TWS.splice(i,1);try{w.done&&w.done();}catch(e){}}
  }
}
function chain(list,onDone){
  var i=0,dead=false;
  function next(){
    if(dead||ST.abort)return;
    if(i>=list.length){try{onDone&&onDone();}catch(e){}return;}
    var st=list[i++];
    if(st.w){WDs.push(setTimeout(next,st.w*1000/D()));return;}
    tw({dur:Math.max(.05,st.d*D()),ease:st.e,step:st.s,done:function(){try{st.done&&st.done();}catch(e){}next();}});
  }
  next();
  return {kill:function(){dead=true;}};
}
function startLoop(){
  if(raf||!ST.menuOn)return;
  _last=0;
  raf=requestAnimationFrame(tick);
}
function tick(ts){
  raf=0;
  if(!ST.menuOn){return;}
  var dt=_last?Math.min(.25,(ts-_last)/1000):.016;_last=ts; /* dt REAL (teto .25s): tweens acompanham o relógio mesmo com fps baixo */
  stepTweens(dt);
  /* ambiente (velas/poeira): só quando o livro está VISTO — se outra
     tela cobriu o menu e não há tween do livro rodando, durme */
  var ambient=!(ST.mode==='idle'&&!TWS.length&&menuCovered());
  if(ambient){
    /* velas: 11 fps — faíscas de luz baratas */
    cndAcc+=dt;
    if(cndAcc>=1/11){cndAcc=0;if(!animOff()&&!ST.lite)drawFlames();}
    /* poeira: a cada 3 quadros, canvas pequeno */
    if(!animOff()&&!ST.lite&&(dustSkip=(dustSkip+1)%3)===0)stepDust(dt*3);
  }
  raf=requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange',function(){
  if(document.hidden){if(raf){cancelAnimationFrame(raf);raf=0;}}
  else if(ST.menuOn)startLoop();
});

/* ============================================================
   A CENA — mesa de carvalho, velas, poeira (elementos estáticos)
   ============================================================ */
var scene={},CAM={x:0,y:0,s:1,r:0},COV={r:-174},covEl=null,leafEl=null,lfF=null,lfB=null,lfSh=null;
var mapURL=null;

function buildScene(){
  var menu=$('menu');if(!menu)return;
  ST.vert=window.matchMedia&&window.matchMedia('(max-width:860px)').matches;
  ST.lite=(navigator.deviceMemory&&navigator.deviceMemory<4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2)||false;
  try{ST.seen=localStorage.getItem('thor_intro_v20')==='1';}catch(e){}
  try{var a=localStorage.getItem('thorBookAnim');ST.anim=(a==='fast'||a==='off')?a:'full';}catch(e){}

  /* ---- 1. a mesa (pintada uma vez) ---- */
  var sc=document.createElement('div');sc.id='tableScene';
  var cv=document.createElement('canvas');cv.id='tableCv';
  sc.appendChild(cv);
  /* velas — o clarão é CSS (estático); só a chama é canvas */
  ['cl','cr'].forEach(function(c,k){
    var d=document.createElement('div');d.className='candle '+c;
    d.innerHTML='<div class="cglass"></div><canvas class="cflame" width="40" height="58"></canvas><div class="cwax"></div><div class="chold"></div>';
    sc.appendChild(d);
  });
  var dust=document.createElement('canvas');dust.id='dustCv';
  sc.appendChild(dust);
  menu.insertBefore(sc,menu.firstChild);

  /* ---- 2. o palco 3D: stage > cam > unit > (livro real) ---- */
  var stage=document.createElement('div');stage.id='bookStage';
  var cam=document.createElement('div');cam.id='bookCam';
  var unit=document.createElement('div');unit.id='bookUnit';
  var bm=$('bookMenu');
  if(!bm)return;
  menu.insertBefore(stage,bm);
  stage.appendChild(cam);cam.appendChild(unit);
  unit.appendChild(bm); /* move o livro — listeners preservados */

  /* contracapa + canto da pilha de páginas (o livro tem ESPESURA) */
  var back=document.createElement('div');back.id='bkBack';unit.insertBefore(back,bm);
  var stR=document.createElement('div');stR.id='bkStackR';unit.insertBefore(stR,bm);
  var stB=document.createElement('div');stB.id='bkStackB';unit.insertBefore(stB,bm);

  /* ---- 3. o spread (conteúdo sob a folha que vira) ---- */
  var sp=document.createElement('div');sp.id='bkSpread';
  sp.innerHTML='<div class="pg spL"><div class="pgIn" id="spLIn"></div></div>'+
    '<div class="fold" aria-hidden="true"></div>'+
    '<div class="pg spR"><div class="pgIn" id="spRIn"></div></div>';
  unit.appendChild(sp);

  /* ---- 4. a FOLHA que vira ---- */
  leafEl=document.createElement('div');leafEl.id='bkLeaf';
  leafEl.style.display='none';
  leafEl.style.pointerEvents='none';
  lfF=document.createElement('div');lfF.className='lf lfF';
  lfB=document.createElement('div');lfB.className='lf lfB';
  lfSh=document.createElement('div');lfSh.className='lfSh';
  leafEl.appendChild(lfB);leafEl.appendChild(lfF);leafEl.appendChild(lfSh);
  unit.appendChild(leafEl);

  /* ---- 5. a CAPA ---- */
  covEl=document.createElement('div');covEl.id='bkCover';
  covEl.innerHTML='<div class="cvIn"><div class="cvSym">✠</div><div class="cvT">THOR</div><div class="cvT2">REVENGE</div>'+
    '<div class="cvSub">penumbra das almas</div></div>'+
    '<div class="cvSpine"></div><div class="cvWear"></div>';
  unit.appendChild(covEl);
  covEl.style.zIndex='40';
  covEl.style.pointerEvents='none'; /* v2.0.0: a capa é cenário — cliques passam reto */

  /* ---- 6. o véu da abertura ---- */
  var dim=document.createElement('div');dim.id='bkDim';menu.appendChild(dim);

  scene.cv=cv;scene.dust=dust;scene.dim=dim;scene.spread=sp;
  scene.spL=$('spLIn');scene.spR=$('spRIn');
  scene.unit=unit;scene.cam=cam;scene.stage=stage;
  scene.uw=unit.offsetWidth||1000; /* largura em cache — nada de layout read por clique */

  applyCam();applyCover();
  paintTable();
  initFlames();initDust();
  buildMapArt();

  /* botão da opção de animações nas OPÇÕES */
  addAnimOption();

  window.addEventListener('resize',function(){
    clearTimeout(scene._rz);
    scene._rz=setTimeout(function(){
      ST.vert=window.matchMedia&&window.matchMedia('(max-width:860px)').matches;
      scene.uw=unit.offsetWidth||1000;
      paintTable();
    },280);
  });
}

/* transform da capa */
function applyCam(){
  if(!scene.cam)return;
  scene.cam.style.transform='translate3d('+CAM.x.toFixed(1)+'px,'+CAM.y.toFixed(1)+'px,0) rotate('+CAM.r.toFixed(2)+'deg) scale('+CAM.s.toFixed(4)+')';
}
function camTo(nx,ny,ns,nr,dur,ease,done){
  var fx=CAM.x,fy=CAM.y,fs=CAM.s,fr=CAM.r;
  if(animOff()||dur<=0){CAM.x=nx;CAM.y=ny;CAM.s=ns;CAM.r=nr;applyCam();done&&done();return;}
  tw({dur:dur*D(),ease:ease||easeIO,step:function(p){
    CAM.x=fx+(nx-fx)*p;CAM.y=fy+(ny-fy)*p;CAM.s=fs+(ns-fs)*p;CAM.r=fr+(nr-fr)*p;applyCam();
  },done:done});
}
function camHome(dur,done){camTo(0,0,1,0,dur,easeIO,done);}
function unitW(){return scene.uw||(scene.unit?scene.unit.offsetWidth:1000)||1000;}
function focusPage(side,dur,done){ /* side: 'L'|'R' — aproxima da página escolhida */
  if(ST.vert){camTo(0,0,1.08,0,dur,easeIO,done);return;}
  var w=unitW();
  var x=side==='R'?-w*.085:w*.085;
  camTo(x,w*.02,1.2,side==='R'?-1.1:1.1,dur,easeIO,done);
}
/* POSES DE CÂMERA — cada opção pousa do seu jeito (v1.9.1):
   aproximação curta e própria, nada de zoom genérico */
var POSES={
  conq:{x:.055,y:.03,s:1.16,r:-1.2},   /* ALMAS — página direita, mais perto */
  best:{x:.07,y:.015,s:1.09,r:1.0},    /* INVENTÁRIO — página direita, longe */
  grim:{x:-.06,y:.025,s:1.19,r:-1.0},  /* GRIMÓRIO — página esquerda */
  cont:{x:-.05,y:.035,s:1.3,r:-1.3},   /* CONTINUAR — mergulha na página marcada */
  mods:{x:0,y:.012,s:.955,r:0}         /* MODS — recua: a folha solta é maior que o livro */
};
function poseCam(ps,dur,done){
  if(ST.vert){camTo(0,0,1.06,0,dur,easeIO,done);return;}
  var w=unitW();
  camTo(w*ps.x,w*ps.y,ps.s,ps.r,dur,easeIO,done);
}
/* sombra da capa em movimento — classe CSS (1 escrita, nada de
   filter re-paint por quadro como antes) */
var _lift=false;
function coverLift(on){
  if(on===_lift)return;_lift=on;
  if(covEl)covEl.classList.toggle('bkLift',on);
}
/* transform da capa */
function applyCover(){
  if(!covEl)return;
  covEl.style.transform='rotateY('+COV.r+'deg)';
  covEl.style.zIndex=COV.r<-90?'8':'40';
}
function coverTo(nr,dur,ease,done){
  var fr=COV.r;
  if(animOff()||dur<=0){COV.r=nr;applyCover();done&&done();return;}
  coverLift(true);
  tw({dur:dur*D(),ease:ease,step:function(p){
    COV.r=fr+(nr-fr)*p;applyCover();
  },done:function(){coverLift(false);done&&done();}});
}

/* ============================================================
   MESA: madeira pintada 1× (repintada só no resize, com debounce)
   ============================================================ */
function paintTable(){
  var cv=scene.cv;if(!cv)return;
  var w=Math.max(320,cv.clientWidth||window.innerWidth),h=Math.max(240,cv.clientHeight||window.innerHeight);
  var dpr=Math.min(1.3,window.devicePixelRatio||1);
  cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
  cv.style.width=w+'px';cv.style.height=h+'px';
  var c=cv.getContext('2d');if(!c)return;
  c.setTransform(dpr,0,0,dpr,0,0);
  /* base */
  c.fillStyle='#150e08';c.fillRect(0,0,w,h);
  /* tábuas horizontais */
  var plankH=Math.max(64,Math.round(h/9));
  for(var y=0;y<h;y+=plankH){
    var t=.5+Math.random()*.5;
    c.fillStyle='rgba('+(46+Math.round(26*t))+','+(30+Math.round(16*t))+','+(18+Math.round(10*t))+',.55)';
    c.fillRect(0,y,w,plankH);
    c.fillStyle='rgba(0,0,0,.55)';c.fillRect(0,y+plankH-2,w,2);
    c.fillStyle='rgba(255,210,150,.03)';c.fillRect(0,y+1,w,1);
    /* veios */
    c.strokeStyle='rgba(0,0,0,.16)';c.lineWidth=1;
    for(var v=0;v<5;v++){
      c.beginPath();var gy=y+4+Math.random()*(plankH-8);c.moveTo(0,gy);
      for(var x=0;x<=w;x+=60)c.lineTo(x,gy+Math.sin(x*.01+v)*2.4);
      c.stroke();
    }
  }
  /* nós */
  for(var k=0;k<4;k++){
    var kx=Math.random()*w,ky=Math.random()*h;
    for(var r=9;r>2;r-=2.4){
      c.strokeStyle='rgba(10,5,2,'+(.16-r*.012)+')';c.lineWidth=1.4;
      c.beginPath();c.ellipse(kx,ky,r*1.7,r,0,0,6.2832);c.stroke();
    }
  }
  /* risco/arranhões claros */
  c.strokeStyle='rgba(255,220,170,.045)';c.lineWidth=1;
  for(var s2=0;s2<7;s2++){
    c.beginPath();var ax=Math.random()*w,ay=Math.random()*h;
    c.moveTo(ax,ay);c.lineTo(ax+(Math.random()-.5)*220,ay+(Math.random()-.5)*60);c.stroke();
  }
  /* poeira de sujeira: pontinhos */
  for(var n=0;n<380;n++){
    c.fillStyle='rgba(0,0,0,'+(Math.random()*.12)+')';
    c.fillRect(Math.random()*w,Math.random()*h,1.3,1.3);
  }
  /* poça de luz quente ao centro (a vela ilumina o livro) */
  var g=c.createRadialGradient(w/2,h*.46,10,w/2,h*.46,Math.max(w,h)*.42);
  g.addColorStop(0,'rgba(255,196,120,.13)');g.addColorStop(.5,'rgba(180,110,60,.05)');g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g;c.fillRect(0,0,w,h);
  /* vinheta pesada — quarto escuro */
  var v=c.createRadialGradient(w/2,h*.44,Math.min(w,h)*.24,w/2,h*.5,Math.max(w,h)*.74);
  v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(.62,'rgba(2,1,1,.42)');v.addColorStop(1,'rgba(1,0,0,.88)');
  c.fillStyle=v;c.fillRect(0,0,w,h);
}

/* ============ velas: 2 chamas a 11fps ============ */
var flames=[];
function initFlames(){
  var list=document.querySelectorAll('#tableScene .cflame');
  for(var i=0;i<list.length;i++){
    flames.push({cv:list[i],c:list[i].getContext('2d'),ph:Math.random()*6.28});
    if(ST.lite||animOff())drawFlame(flames[i],0); /* máquina fraca: chama estática */
  }
}
function drawFlames(){for(var i=0;i<flames.length;i++)drawFlame(flames[i],performance.now()/1000);}
function drawFlame(f,t){
  var c=f.c;if(!c)return;
  var w=f.cv.width,h=f.cv.height;
  c.clearRect(0,0,w,h);
  var sway=Math.sin(t*6.2+f.ph)*2.2+Math.sin(t*11.7+f.ph*2)*1.1;
  var len=1+Math.sin(t*8.3+f.ph)*.12;
  /* halo */
  var g0=c.createRadialGradient(w/2+sway*.4,h*.62,2,w/2,h*.6,h*.62);
  g0.addColorStop(0,'rgba(255,190,110,.5)');g0.addColorStop(1,'rgba(255,150,60,0)');
  c.fillStyle=g0;c.fillRect(0,0,w,h);
  /* chama externa */
  c.fillStyle='rgba(255,150,52,.85)';
  c.beginPath();
  c.moveTo(w/2+sway,h*.16*len+6);
  c.bezierCurveTo(w*.30+sway*.5,h*.55,w*.24,h*.82,w/2,h*.9);
  c.bezierCurveTo(w*.76,h*.82,w*.70+sway*.5,h*.55,w/2+sway,h*.16*len+6);
  c.fill();
  /* núcleo claro */
  c.fillStyle='rgba(255,236,170,.95)';
  c.beginPath();
  c.moveTo(w/2+sway*.55,h*.4);
  c.bezierCurveTo(w*.4,h*.66,w*.42,h*.84,w/2,h*.88);
  c.bezierCurveTo(w*.58,h*.84,w*.6,h*.66,w/2+sway*.55,h*.4);
  c.fill();
  /* pavio */
  c.fillStyle='rgba(20,8,2,.9)';c.fillRect(w/2-1.2,h*.88,2.4,h*.1);
}

/* ============ poeira suspensa: 12 motas, 1 canvas pequeno ============ */
var dust=[],dctx=null;
function initDust(){
  var cv=scene.dust;if(!cv)return;
  dctx=cv.getContext('2d');
  var N=ST.lite?7:12;
  for(var i=0;i<N;i++)dust.push({
    x:Math.random(),y:Math.random(),
    r:.6+Math.random()*1.1,
    vx:(Math.random()-.5)*.006,vy:-(.004+Math.random()*.012),
    a:.04+Math.random()*.1,ph:Math.random()*6.28
  });
  sizeDust();
  window.addEventListener('resize',sizeDust);
}
function sizeDust(){
  var cv=scene.dust;if(!cv||!dctx)return;
  cv.width=Math.round(window.innerWidth*.55);cv.height=Math.round(window.innerHeight*.5); /* v1.9.1: canvas menor — mesma poeira, menos pixels limpos por quadro */
}
function stepDust(dt){
  var cv=scene.dust;if(!cv||!dctx)return;
  var w=cv.width,h=cv.height;
  dctx.clearRect(0,0,w,h);
  for(var i=0;i<dust.length;i++){
    var d=dust[i];
    d.x+=d.vx*dt*60*.016;d.y+=d.vy*dt*60*.016;
    if(d.y<-.03){d.y=1.02;d.x=Math.random();}
    if(d.x<-.03)d.x=1.02;if(d.x>1.03)d.x=-.02;
    var tw2=.6+.4*Math.sin(performance.now()/1000*1.1+d.ph);
    dctx.fillStyle='rgba(255,232,190,'+(d.a*tw2).toFixed(3)+')';
    dctx.beginPath();dctx.arc(d.x*w,d.y*h,d.r,0,6.2832);dctx.fill();
  }
}

/* ============================================================
   A ARTE DO MAPA — desenhada a tinta 1× (a página que o DESCER vira)
   ============================================================ */
function buildMapArt(){
  try{
    var cv=document.createElement('canvas');cv.width=340;cv.height=440;
    var c=cv.getContext('2d');
    /* pergaminho igual às páginas */
    var g=c.createLinearGradient(0,0,340,440);
    g.addColorStop(0,'#d3c197');g.addColorStop(.5,'#c3ae82');g.addColorStop(1,'#a8915f');
    c.fillStyle=g;c.fillRect(0,0,340,440);
    c.fillStyle='rgba(92,58,24,.14)';
    c.beginPath();c.ellipse(280,60,40,26,0,0,6.2832);c.fill();
    c.beginPath();c.ellipse(60,380,30,20,0,0,6.2832);c.fill();
    var ink='rgba(52,32,16,.85)';
    function txt2(s,x,y,size,fam,al){c.font=size+'px '+(fam||'IM Fell English SC, Georgia, serif');c.fillStyle=ink;c.textAlign=al||'center';c.fillText(s,x,y);}
    function line(x1,y1,x2,y2,w2){c.strokeStyle=ink;c.lineWidth=w2||1.4;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
    txt2('· O CAMINHO DA DESCIDA ·',170,42,15);
    line(60,54,280,54,1);
    txt2('PARAÍSO',170,80,12,'IM Fell English SC, Georgia, serif','center');
    line(170,92,170,112,1.2);
    var circles=['IX — TRAIÇÃO','VIII — FRAUDE','VII — VIOLÊNCIA','VI — HERESIA','V — FÚRIA','IV — AVAREZA','III — FOME','II — DESEJO'];
    for(var i=0;i<circles.length;i++){
      var y=134+i*26;
      c.globalAlpha=.55;
      txt2(circles[i],170,y,12);
      c.globalAlpha=.5;
      line(96,y+5,244,y+5,1);
      c.globalAlpha=1;
    }
    line(170,134+8*26-8,170,134+8*26+12,1.2);
    txt2('I — ABISMO',170,134+8*26+30,13);
    c.strokeStyle='rgba(122,28,16,.9)';c.lineWidth=2;
    c.strokeRect(72,134+8*26+42,196,34);
    txt2('PENUMBRA DAS ALMAS',170,134+8*26+63,13);
    c.strokeStyle=ink;c.lineWidth=1.2;
    c.strokeRect(72,134+8*26+88,196,30);
    txt2('LIMBO — sem levar nada',170,134+8*26+107,11.5);
    txt2('(as páginas que falavam',60,400,10.5,'IM Fell English SC, Georgia, serif','left');
    txt2('dos outros círculos foram rasgadas)',60,414,10.5,'IM Fell English SC, Georgia, serif','left');
    mapURL=cv.toDataURL('image/png');
  }catch(e){mapURL=null;}
}

/* ============================================================
   A FOLHA — virar página com sombra e dobra (deformação por
   gradientes; a rotação é transform 3D puro, GPU)
   ============================================================ */
function setLeaf(dir){ /* dir 1 = frente (direita→esquerda) · -1 = trás */
  var fwd=dir>0;
  leafEl.style.display='block';
  leafEl.style.left=fwd?'50%':'0';
  leafEl.style.width='50%';
  leafEl.style.transformOrigin=fwd?'left center':'right center';
  leafEl.style.zIndex='30';
}
function leafRot(r){leafEl.style.transform='rotateY('+r+'deg)';}
function leafShadow(p){
  if(lfSh)lfSh.style.opacity=(Math.sin(Math.PI*clamp(p,0,1))*.5).toFixed(3);
}
function faceInk(el,url){ /* conteúdo desenhado na face da folha */
  if(!el)return;
  if(url){el.style.backgroundImage='url('+url+')';el.style.backgroundSize='cover';el.style.backgroundPosition='center';}
  else{el.style.backgroundImage='';}
}
/* vira a folha. `out` esmaece na 1ª metade, `ins` acende na 2ª —
   a troca de conteúdo fica SEMPRE escondida atrás da folha */
function flip(dir,opts){
  opts=opts||{};
  var dur=animOff()?0:(opts.dur||.9);
  var out=opts.out,ins=opts.ins;
  if(ins)ins.style.opacity='0';
  if(animOff()||ST.vert||dur<=0){
    /* modo simples: crossfade curto, sem 3D */
    tw({dur:.16,step:function(p){
      if(out)out.style.opacity=String(1-p);
      if(ins)ins.style.opacity=String(p);
    },done:function(){
      if(out&&out!==$('bookMenu'))out.style.display='none';
      ST.spread=opts.spread||null;
      try{opts.done&&opts.done();}catch(e){}
    }});
    leafEl.style.display='none';
    return;
  }
  setLeaf(dir);
  faceInk(lfB,opts.backArt);
  tw({dur:dur,ease:easeIO,step:function(p){
    leafRot(dir>0?-p*178:(-178+p*178));
    leafShadow(p);
    if(out)out.style.opacity=String(clamp(1-p/.45,0,1));
    if(ins&&p>=.5)ins.style.opacity=String((p-.5)/.5);
  },done:function(){
    leafEl.style.display='none';leafRot(0);leafShadow(0);
    if(out){out.style.opacity='0';if(out!==$('bookMenu'))out.style.display='none';}
    if(ins)ins.style.opacity='1';
    ST.spread=opts.spread||null;
    try{opts.done&&opts.done();}catch(e){}
  }});
  try{noiseSfx(.13,.05,1900,'bandpass');}catch(e){}
}

/* prepara o spread (mostra com opacity 0 — a folha acende ele) */
function showSpread(which){
  var sp=scene.spread,bm=$('bookMenu');
  if(!sp||!bm)return;
  sp.style.display='flex';
  sp.style.opacity='0';
  bm.style.pointerEvents='none';
  ST.spread=which;
}
function hideSpread(){
  var sp=scene.spread,bm=$('bookMenu');
  if(!sp||!bm)return;
  sp.style.display='none';
  sp.style.opacity='1';
  bm.style.opacity='1';
  bm.style.pointerEvents='';
  ST.spread=null;
}

/* ============================================================
   O REGISTRO DAS ALMAS — os saves como inscrições no manuscrito
   (usa os SISTEMAS REAIS: saveSlotData/loadSaveSlot/rename/…)
   ============================================================ */
function karmaOf(d){return clamp(2+Math.floor((d.kills||0)/150)+(d.wins?2:0)-Math.floor((d.deaths||0)/5),0,8);}
function stateName(k){return k>=6?'PESADA DE PECADO':k>=4?'MARCADA':'INDETERMINADO';}
function descOf(d){
  if(d.schoolDone)return 'ALÉM DO RIO';
  return ((d.descidas||0)>0?'CÍRCULO '+(1+Math.min(3,d.descidas))+'?':'???');
}
function buildSavesSpread(){
  var L=scene.spL,R=scene.spR;if(!L||!R)return;
  L.innerHTML='';R.innerHTML='';
  var head=document.createElement('div');head.className='spHead';
  head.textContent='· REGISTRO DAS ALMAS ·';
  R.appendChild(head);
  var sub=document.createElement('div');sub.className='spSub';
  sub.textContent='as folhas do manuscrito — cada alma tem a sua linha';
  R.appendChild(sub);
  /* as 3 folhas, à esquerda, como inscrições */
  for(var i=1;i<=3;i++){
    (function(i){
      var d=saveSlotData(i),ex=slotExists(i),bk=false;
      try{bk=!!localStorage.getItem('thorBackup'+i);}catch(e){}
      var el2=document.createElement('div');
      el2.className='soulRec'+(i===activeSave?' cur':'')+(!ex?' empty':'');
      el2.id='soulRec'+i;
      var nm=d.name?('«'+d.name+'»'):'(sem nome)';
      var bar='█'.repeat(karmaOf(d))+'░'.repeat(8-karmaOf(d));
      el2.innerHTML='<div class="srName">FOLHA '+i+(i===activeSave?' · EM CHAMAS':'')+' — '+nm+'</div>'+
        '<div class="srRow">condição: '+(ex?'em julgamento':'desconhecida')+'</div>'+
        '<div class="srRow">última descida: '+descOf(d)+'</div>'+
        '<div class="srRow">karma: <span class="srK">'+bar+'</span></div>'+
        '<div class="srRow">estado da alma: '+stateName(karmaOf(d))+'</div>'+
        '<div class="srRow dim">abates '+(d.kills||0)+' · almas '+(d.souls||0)+' · descidas '+(d.descidas||0)+' · vitórias '+(d.wins||0)+'</div>'+
        '<div class="srBtns"></div>'+
        (bk?'<div class="srBtns"><button class="srB rst">restaurar cinza</button></div>':'');
      var bb=el2.querySelector('.srBtns');
      var bUse=document.createElement('button');bUse.className='srB';
      bUse.textContent=(i===activeSave?'seguir desta folha':'carregar folha');
      bUse.addEventListener('click',function(ev){
        ev.stopPropagation();
        loadSaveSlot(i);
        buildSavesSpread();
        zoomToSoul(i);
        try{blip('sine',520,760,.14,.06);}catch(e){}
      });
      var bRen=document.createElement('button');bRen.className='srB';bRen.textContent='renomear';
      bRen.addEventListener('click',function(ev){ev.stopPropagation();renameSaveSlot(i);buildSavesSpread();});
      var bDel=document.createElement('button');bDel.className='srB bad';bDel.textContent='queimar';
      bDel.addEventListener('click',function(ev){ev.stopPropagation();deleteSaveSlot(i);buildSavesSpread();});
      bb.appendChild(bUse);bb.appendChild(bRen);bb.appendChild(bDel);
      var rb=el2.querySelector('.rst');
      if(rb)rb.addEventListener('click',function(ev){ev.stopPropagation();restoreBackup(i);buildSavesSpread();});
      L.appendChild(el2);
    })(i);
  }
  /* a folha queimada, para quem já foi convidado */
  try{
    if(META&&META.casteloCleared){
      var b=document.createElement('div');b.className='soulRec burned';
      b.innerHTML='<div class="srName" style="text-decoration:line-through;color:#a52a3a">FOLHA QUEIMADA — BRUNO</div>'+
        '<div class="srRow">condição: ele está em casa</div>'+
        '<div class="srRow">última descida: a casa lembra</div>'+
        '<div class="srRow">estado da alma: NÃO INTERROGUE A FOLHA</div>';
      L.appendChild(b);
    }
  }catch(e){}
  /* margem direita: exportar/importar + voltar */
  var bEx=document.createElement('button');bEx.className='srB wide';bEx.textContent='exportar as folhas (.json)';
  bEx.addEventListener('click',function(){try{exportSaves();}catch(e){}});
  R.appendChild(bEx);
  var bIm=document.createElement('button');bIm.className='srB wide';bIm.textContent='colar folhas de outro livro';
  bIm.addEventListener('click',function(){var f=$('saveFile');if(f){f.value='';f.click();}});
  R.appendChild(bIm);
  var note=document.createElement('div');note.className='spNote';
  note.textContent='dica: exporte um backup depois de progresso importante — o arquivo pode ser aberto em qualquer navegador.';
  R.appendChild(note);
  var back=document.createElement('button');back.className='srB wide';back.id='soulBack';back.textContent='voltar às opções';
  back.addEventListener('click',function(){goSavesBack();});
  R.appendChild(back);
  var f=$('saveFile');
  if(f&&!f.__bkW){f.__bkW=1;f.addEventListener('change',function(){
    try{if(typeof importSavesFile==='function'&&f.files&&f.files[0])importSavesFile(f.files[0]);}catch(e){}
    setTimeout(buildSavesSpread,400);
  });}
}
function zoomToSoul(i){
  var el2=$('soulRec'+i);if(!el2||animOff())return;
  try{el2.scrollIntoView({block:'nearest',behavior:'smooth'});}catch(e){}
  var u=scene.unit,w=unitW();
  var box=el2.getBoundingClientRect(),ub=u.getBoundingClientRect();
  var dx=((box.left+box.width/2)-(ub.left+ub.width*.25))*-(CAM.s*.14);
  var dy=((box.top+box.height/2)-(ub.top+ub.height/2))*-(CAM.s*.14);
  camTo(dx,dy,1.34,-.4,.34,easeO,function(){
    setTimeout(function(){camHome(.5);},420);
  });
}

/* ============================================================
   A PÁGINA DOS AJUSTES — anotações onde as OPÇÕES pousam
   ============================================================ */
function buildSetSpread(){
  var L=scene.spL,R=scene.spR;if(!L||!R)return;
  L.innerHTML='';R.innerHTML='';
  var h=document.createElement('div');h.className='spHead';h.textContent='· DAS MARCAS E AJUSTES ·';
  R.appendChild(h);
  var s=document.createElement('div');s.className='spSub';
  s.textContent='as marcas que o dono do livro deixou entrelinhadas';
  R.appendChild(s);
  var n1=document.createElement('div');n1.className='spNote ink';
  n1.innerHTML='"o som acordou o inferno uma vez.<br>abaixe a voz se for descer."';
  L.appendChild(n1);
  var n2=document.createElement('div');n2.className='spNote ink';
  n2.innerHTML='"os números de dano são tinta:<br>gasta com parcimônia."';
  L.appendChild(n2);
  var n3=document.createElement('div');n3.className='spNote';
  n3.textContent='— os controles ficam escritos na página ao lado. quem erra a tecla, erra a descida.';
  L.appendChild(n3);
  var n4=document.createElement('div');n4.className='spNote scrap';
  n4.textContent='(uma linha foi riscada aqui. ninguém consegue lê-la.)';
  L.appendChild(n4);
}

/* ============================================================
   AS INTERAÇÕES — cada opção do menu com a sua cena
   (todas terminam com REPLAY do clique original: os handlers do
   game.js seguem mandando em tudo)
   ============================================================ */
function begin(act){
  ST.mode='busy';ST.busy=true;
  armWatchdog(act);
}
function end(){
  clearWatchdogs();
  ST.busy=false;ST.mode='idle';
}
function armWatchdog(act){
  var durs={descer:4200,continue:3000,saves:4200,options:4200,circle:3400,conq:2600,best:2600,grim:2600,news:1800,mods:2200,quit:5200,test:1600};
  var ms;
  if(act==='intro'){
    /* v1.9.2: quando a INTRODUÇÃO CINEMATOGRÁFICA vai tocar (ou está tocando),
       o watchdog cobre a sequência inteira — não pode cortar a cine no meio */
    var cine=false;
    try{cine=!!window.__CINE&&((__CINE.active&&__CINE.active())||(__CINE.wanted&&__CINE.wanted()));}catch(e){}
    ms=cine?80000:((ST.anim==='full'&&!ST.seen)?12000:4500);
  }
  else ms=(durs[act]||3000)+1500;
  WDs.push(setTimeout(function(){try{forceIdle();}catch(e){}},ms));
}
function clearWatchdogs(){WDs.forEach(function(id){clearTimeout(id);});WDs=[];}

/* DESCER — vira a página do mapa, a câmera entra no desenho */
function goDescer(b){
  b=b||$('startBtn');
  begin('descer');
  showSpread('map');
  focusPage('R',.3);
  flip(1,{dur:.95,spread:'map',backArt:mapURL,
    out:$('bookMenu'),ins:scene.spread,
    done:function(){
      camTo(0,(scene.unit?scene.unit.offsetHeight:400)*.04,1.24,-1.6,.6,easeIO,function(){
        ST.replay=true;
        try{(b||$('startBtn')).click();}catch(e){}
        end();
      });
    }});
}

/* CONTINUAR — vira a folha marcada e a câmera MERGULHA nela */
function goContinue(b){
  b=b||$('continueBtn');
  begin('continue');
  if(ST.vert||animOff()){ST.replay=true;try{b.click();}catch(e){}end();return;}
  focusPage('L',.24,function(){
    flip(1,{dur:.68,done:function(){
      poseCam(POSES.cont,.44,easeIO,function(){
        ST.replay=true;
        try{(b||$('continueBtn')).click();}catch(e){}
        end();
      });
    }});
  });
}

/* atalhos de teste — velocidade importa: só um sopro de som */
function goTest(b){
  b=b||$('gateTestBtn');
  begin('test');
  try{noiseSfx(.08,.03,1200,'bandpass');}catch(e){}
  ST.replay=true;
  try{b.click();}catch(e){}
  end();
}

/* RETORNAR — o livro volta UMA página: o registro das almas */
function goSaves(b){
  begin('saves');
  buildSavesSpread();
  showSpread('saves');
  try{game.state='saves';}catch(e){} /* mesmo estado do caminho antigo */
  if(ST.vert||animOff()){
    flip(1,{dur:0,spread:'saves',out:$('bookMenu'),ins:scene.spread,done:function(){end();}});
    return;
  }
  focusPage('L',.28,function(){
    flip(-1,{dur:.95,spread:'saves',
      out:$('bookMenu'),ins:scene.spread,
      done:function(){end();}});
  });
}
function goSavesBack(){
  if(ST.busy)return;
  begin('saves');
  if(ST.vert||animOff()){
    hideSpread();
    var bm0=$('bookMenu');if(bm0)bm0.style.opacity='1';
    camHome(.2);try{game.state='menu';refreshMenuDev();}catch(e){}
    end();return;
  }
  camHome(.28,function(){
    flip(1,{dur:.85,
      out:scene.spread,ins:$('bookMenu'),
      done:function(){hideSpread();try{game.state='menu';refreshMenuDev();}catch(e){}end();}});
  });
}

/* VOLTAR do mapa: a folha do desenho volta ao lugar (retorno natural) */
function returnFromMap(){
  if(ST.busy||ST.spread!=='map')return;
  if(ST.vert||animOff()){
    hideSpread();camHome(.2);return;
  }
  begin('descer');
  camHome(.28,function(){
    flip(1,{dur:.85,
      out:scene.spread,ins:$('bookMenu'),
      done:function(){hideSpread();end();}});
  });
}
/* vigias dos overlays: quando uma tela fecha, o livro volta à posição anterior;
   quando a LOUSA abre, os estados reais (save) são anotados na pedra */
function wireOverlayWatchers(){
  ['descer','circles','conquistas','book','versionInfo'].forEach(function(id){
    var el2=$(id);if(!el2)return;
    var last=el2.classList.contains('hidden');
    try{
      var mo=new MutationObserver(function(){
        var hid=el2.classList.contains('hidden');
        if(hid===last)return;
        last=hid;
        if(!hid){ /* abriu */
          if(id==='circles'){
            refreshLousa();
            var w=document.querySelector('#circles .lousaWrap');
            if(w&&!ST.vert){w.classList.remove('reveal');void w.offsetWidth;w.classList.add('reveal');}
          }
          return;
        }
        /* fechou */
        if(id==='descer'&&ST.spread==='map'){returnFromMap();return;}
        if(id==='circles'){reopenFromLousa();return;}
        if(ST.mode==='idle'&&!ST.busy&&!ST.spread)camHome(.45);
      });
      mo.observe(el2,{attributes:true,attributeFilter:['class']});
    }catch(e){}
  });
}

/* OPÇÕES — a câmera desliza até a página de ajustes */
function goOptions(b){
  b=b||$('optBtn');
  begin('options');
  focusPage('R',.34,function(){
    ST.replay=true;
    try{(b||$('optBtn')).click();}catch(e){}
    end();
  });
}
function asPageOptions(){
  buildSetSpread();
  showSpread('set');
  var m=$('menu'),op=$('options');
  var finish=function(){
    if(op)op.classList.add('asPage');
    if(m)m.classList.add('book-dim');
  };
  if(ST.vert||animOff()){finish();return;}
  flip(1,{dur:.8,spread:'set',
    out:$('bookMenu'),ins:scene.spread,
    done:finish});
}
function unPageOptions(){
  var m=$('menu'),op=$('options');
  if(op)op.classList.remove('asPage');
  if(m)m.classList.remove('book-dim');
  if(ST.spread!=='set')return;
  if(ST.vert||animOff()){
    hideSpread();
    var bm0=$('bookMenu');if(bm0)bm0.style.opacity='1';
    camHome(.2);end();return;
  }
  begin('options');
  flip(1,{dur:.8,
    out:scene.spread,ins:$('bookMenu'),
    done:function(){hideSpread();camHome(.3);end();}});
}

/* CÍRCULOS — v1.9.1: o livro se FECHA devagar e a LOUSA espera atrás.
   Os nove círculos a giz + a PENUMBRA DAS ALMAS fora do desenho.
   Ao sair da lousa, o livro REABRE (e a câmera volta pra casa). */
function goCircles(b){
  b=b||$('circleBtn');
  begin('circle');
  if(ST.vert||animOff()){
    ST.replay=true;try{b.click();}catch(e){}end();return;
  }
  focusPage('R',.26,function(){
    camTo(0,8,.95,0,.4,easeIO,function(){
      coverTo(0,.95,easeIO,function(){
        try{blip('sine',72,44,.3,.05);noiseSfx(.18,.04,420,'lowpass');}catch(e){}
        ST.replay=true;
        try{b.click();}catch(e){}
        end();
      });
    });
  });
}
/* a lousa fechou — o livro volta à mesa aberto */
function reopenFromLousa(){
  if(ST.busy||ST.vert||animOff())return;
  if(COV.r>-90){ /* capa fechada: reabrir com peso */
    begin('circle');
    coverTo(-174,.95,easeIO,function(){
      try{noiseSfx(.14,.04,1500,'bandpass');}catch(e){}
      camHome(.4);end();
    });
  }else if(CAM.s!==1||CAM.x!==0){camHome(.4);}
}

/* ALMAS / INVENTÁRIO / GRIMÓRIO — folha rápida com POSE PRÓPRIA:
   cada opção aproxima do seu lado, do seu jeito (o overlay abre
   por cima; quando ele fecha, o vigia devolve a câmera pra casa) */
function goOverlay(act,b){
  b=b||$(act==='conq'?'conqBtn':act==='best'?'bestBtn':act==='grim'?'grimBtn':'versionBtn');
  begin(act);
  if(animOff()){
    ST.replay=true;try{b.click();}catch(e){}end();return;
  }
  var pose=POSES[act];
  if(pose&&!ST.vert)poseCam(pose,.26);
  flip(1,{dur:.6,done:function(){
    ST.replay=true;
    try{b.click();}catch(e){}
    end();
  }});
}

/* MODS — uma folha solta entra na mesa (a câmera RECUA: o papel é maior) */
function goMods(b){
  b=b||$('modsBtn');
  begin('mods');
  if(animOff()){ST.replay=true;try{b.click();}catch(e){}end();return;}
  if(!ST.vert)poseCam(POSES.mods,.3);
  flip(1,{dur:.55,done:function(){
    ST.replay=true;
    try{b.click();}catch(e){}
    end();
  }});
}

/* ABANDONAR — o livro se fecha devagar; se o navegador deixar, adeus */
function goQuit(b){
  b=b||$('quitBtn');
  begin('quit');
  var replay=function(){
    ST.replay=true;
    try{b.click();}catch(e){}
  };
  var reopen=function(){
    setTimeout(function(){
      var m=$('menu');
      if(m&&!m.classList.contains('hidden')){
        camTo(0,10,.94,0,.2,easeIO);
        coverTo(-174,1.0,easeIO,function(){camHome(.6);end();});
      }else end();
    },1050);
  };
  if(ST.vert||animOff()){
    coverTo(0,.3,easeIO,function(){
      replay();
      setTimeout(function(){
        var m=$('menu');
        if(m&&!m.classList.contains('hidden'))coverTo(-174,.4,easeIO,function(){end();});
        else end();
      },900);
    });
    return;
  }
  focusPage('R',.3,function(){
    camTo(0,10,.94,0,.5,easeIO,function(){
      coverTo(0,1.15,easeIO,function(){
        try{blip('sine',72,44,.34,.06);noiseSfx(.2,.05,420,'lowpass');}catch(e){}
        replay();
        reopen();
      });
    });
  });
}

/* NOVIDADES — a anotação do rodapé se levanta */
function goNews(b){
  b=b||$('menuNews');
  begin('news');
  var n=$('menuNews');
  if(!n||animOff()){ST.replay=true;try{b.click();}catch(e){}end();return;}
  tw({dur:.26,ease:easeO,step:function(p){
    n.style.transform='translateY('+(-5*p).toFixed(1)+'px) scale('+(1+.03*p).toFixed(3)+')';
  },done:function(){
    ST.replay=true;
    try{b.click();}catch(e){}
    end();
    tw({dur:.4,ease:easeO,step:function(p){
      n.style.transform='translateY('+(-5*(1-p)).toFixed(1)+'px) scale('+(1.03-.03*p).toFixed(3)+')';
    },done:function(){n.style.transform='';}});
  }});
}

/* ============================================================
   A LOUSA VIVA — estados reais do save anotados na pedra + a
   informação reservada + o zoom curto de seleção (câmera).
   Nada de loops: tudo reage a abrir/sobrevoar/clicar.
   ============================================================ */
var LOUSA_INFO_DEF='<span class="liTag">passe o giz pelas inscrições — o que estiver lacrado não cede.</span>';
var LOUSA_INFO={
  circlePenumbra:['PENUMBRA DAS ALMAS','a primeira descida — o inferno se divide e você escolhe o caminho.'],
  circleLimbo:['I — ABISMO','limbo: descer direto ao ABISMO, sem levar nada.'],
  circleEscola:['??? — A ESCOLA','há um lugar dos vivos esquecido dentro do inferno — uma página que não deveria estar no livro.']
};
function refreshLousa(){
  var n=0,sd=false;
  try{n=(META&&META.descidas)||0;}catch(e){}
  try{sd=!!(META&&META.schoolDone);}catch(e){}
  var pen=$('circlePenumbra');
  if(pen){
    pen.classList.toggle('done',n>0); /* risco de confirmação à mão */
    var s=$('lousaPenState');
    if(s)s.textContent=n>0?('risco de confirmação — '+n+' descida'+(n>1?'s':'')+' anotada'+(n>1?'s':'')+''):'a descida começa aqui';
  }
  var esc=$('circleEscola');
  if(esc)esc.classList.toggle('done',sd);
  var info=$('lousaInfo');
  if(info)info.innerHTML=LOUSA_INFO_DEF;
}
function wireLousaInfo(){
  var info=$('lousaInfo');if(!info)return;
  for(var id in LOUSA_INFO){(function(id){
    var b=$(id);if(!b)return;
    b.addEventListener('mouseenter',function(){
      var d=LOUSA_INFO[id],extra='';
      if(id==='circlePenumbra'){var n=0;try{n=(META&&META.descidas)||0;}catch(e){}if(n>0)extra=' <span class="liTag">· descidas anotadas: '+n+'</span>';}
      info.innerHTML='<span class="liName">'+d[0]+'</span> — '+d[1]+extra;
    });
    b.addEventListener('mouseleave',function(){info.innerHTML=LOUSA_INFO_DEF;});
  })(id);}
}
/* zoom de seleção: o clique na lousa aproxima a região ANTES de navegar;
   depois que a tela troca, a classe sai e o enquadramento geral volta */
function wireLousaZoom(){
  var ovel=$('circles');if(!ovel)return;
  ovel.addEventListener('click',function(e){
    var t=e.target;
    if(!t||!t.closest)return;
    var b=t.closest('#circlePenumbra,#circleLimbo,#circleEscola');
    if(!b)return;
    if(ST.replay){ST.replay=false;return;} /* clique sintético: segue para o handler real */
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
    var wrap=document.querySelector('#circles .lousa');
    var cls=b.id==='circlePenumbra'?'zPen':b.id==='circleLimbo'?'zLim':'zEsc';
    b.classList.remove('chosen');void b.offsetWidth;b.classList.add('chosen');
    try{noiseSfx(.1,.03,900,'bandpass');}catch(e2){}
    if(wrap&&!ST.vert&&!animOff())wrap.classList.add('zooming',cls);
    setTimeout(function(){
      ST.replay=true;
      try{b.click();}catch(e2){}
      setTimeout(function(){if(wrap)wrap.classList.remove('zooming','zPen','zLim','zEsc');},700);
    },(wrap&&!ST.vert&&!animOff())?260:60);
  },true);
}

/* ============================================================
   A ABERTURA — capa com peso, luz que acorda, conteúdo JÁ escrito
   ============================================================ */
function forceIdle(quick){
  ST.abort=true;clearWatchdogs();
  TWS.length=0;
  /* v1.9.2: se a introdução cinematográfica estiver viva, ela morre AQUI —
     o estado final é o mesmo do fim natural (livro em casa + entrada) */
  try{window.__CINE&&__CINE.abort&&__CINE.abort();}catch(e){}
  /* estado final: livro aberto, câmera em casa, véu fora, folha fora */
  CAM.x=0;CAM.y=0;CAM.s=1;CAM.r=0;applyCam();
  COV.r=-174;applyCover();coverLift(false);
  if(covEl)covEl.style.filter='none';
  if(leafEl){leafEl.style.display='none';leafRot(0);leafShadow(0);}
  if(scene.dim)scene.dim.style.opacity='0';
  hideSpread();
  var bm=$('bookMenu');if(bm){bm.style.opacity='1';bm.style.pointerEvents='';}
  ST.busy=false;ST.mode='idle';ST.abort=false;
  /* v1.9.1: se a cutscene acabou (ou foi abortada), a ENTRADA surge —
     o INICIAR vem sempre DEPOIS da cutscene do livro */
  if(ST.entryPending)showEntry();
  if(quick)try{noiseSfx(.1,.04,1600,'bandpass');}catch(e){}
}

/* a ENTRADA (THOR REVENGE + INICIAR) surge quando a cutscene termina.
   v1.9.2: em MODO CINE ela revela-se sobre o quadro final da introdução
   (fundo transparente, título como inscrição antiga que aparece). */
function showEntry(){
  ST.entryPending=false;
  var en=$('entry');if(!en)return;
  if(!en.classList.contains('hidden'))return;
  en.classList.toggle('cineMode',!!ST.entryCine);
  en.classList.remove('hidden');
  /* reanima a revelação do título (sem acumular classes antigas) */
  var t=en.querySelector('.entryTitle');
  if(t&&ST.entryCine){t.style.animation='none';void t.offsetWidth;t.style.animation='';}
  var b=$('entryBtn');
  if(b&&!ST.entryCine){try{b.focus({preventScroll:true});}catch(e){}}
}

function playIntro(){
  var dim=scene.dim;if(!dim)return;
  ST.mode='intro';ST.busy=true;
  ST.entryPending=true; /* v1.9.1: a ENTRADA surge quando a cutscene terminar */
  var fast=ST.seen||ST.anim!=='full';
  /* ponto de partida: quarto no escuro, livro fechado na mesa */
  dim.style.opacity=fast?'.5':'.97';
  if(fast){
    COV.r=-174;applyCover();
    CAM.x=0;CAM.y=14;CAM.s=1.06;CAM.r=0;applyCam();
    chain([
      {w:.25},
      {d:.55,s:function(p){dim.style.opacity=(.5*(1-p)).toFixed(3);},e:easeO},
      {d:.6,s:function(p){CAM.y=14*(1-p);CAM.s=1.06-.06*p;applyCam();},e:easeO}
    ],function(){dim.style.opacity='0';end();saveSeen();cineNext();});
    armWatchdog('intro');
    return;
  }
  if(animOff()){forceIdle();saveSeen();return;}
  CAM.x=0;CAM.y=Math.round((scene.unit?scene.unit.offsetHeight:400)*.10);CAM.s=1.3;CAM.r=0;applyCam();
  COV.r=0;applyCover();
  armWatchdog('intro');
  chain([
    {w:.3},
    /* a luz acorda: véu clareia (o conteúdo já está escrito lá embaixo) */
    {d:1.5,e:easeIO,s:function(p){dim.style.opacity=(.97-.42*p).toFixed(3);}},
    /* o livro se aproxima da câmera, devagar */
    {d:1.9,e:easeO,s:function(p){
      CAM.y=Math.round((scene.unit?scene.unit.offsetHeight:400)*.10)*(1-p);
      CAM.s=1.3-(.3*p);applyCam();
    },done:function(){try{noiseSfx(.25,.03,300,'lowpass');}catch(e){}}},
    /* peso de mão: o livro afunda um dedo e assenta */
    {d:.24,e:easeO,s:function(p){CAM.y=Math.round(7*p);applyCam();}},
    {d:.34,e:easeBack,s:function(p){CAM.y=Math.round(7*(1-p)+2*p);applyCam();},done:function(){CAM.y=2;applyCam();}},
    /* a capa abre — com ritmo de manuscrito real */
    {d:.15,s:function(p){},done:function(){try{blip('sine',88,52,.4,.045);}catch(e){}}},
    {d:1.9,e:easeQuint,s:function(p){coverTo2(-174*p);}},
    /* assentamento: um pequeno balanço de peso */
    {d:.4,e:easeO,s:function(p){CAM.r=-.6*(1-p);CAM.y=2-2*p;applyCam();}},
    {d:.45,e:easeIO,s:function(p){CAM.r=.35*Math.sin(Math.PI*p);applyCam();},done:function(){CAM.r=0;applyCam();}},
    /* a primeira folha vira — e as páginas JÁ ESTÃO ESCRITAS */
    {w:.12},
    {d:.12,s:function(p){},done:function(){
      flip(1,{dur:.95,out:null,ins:null,done:function(){try{noiseSfx(.1,.03,1500,'bandpass');}catch(e){}}});
    }},
    {w:.55},
    /* véu sai de vez, câmera volta ao enquadramento do menu */
    {d:1.0,e:easeIO,s:function(p){dim.style.opacity=(.55*(1-p)).toFixed(3);}},
    {d:1.0,e:easeO,s:function(p){CAM.s=1+.06*p;CAM.y=0;applyCam();}}
  ],function(){dim.style.opacity='0';end();saveSeen();cineNext();});
}
/* v1.9.2: o que vem DEPOIS da abertura do livro — a introdução
   cinematográfica (uma vez) ou a ENTRADA direto */
function cineNext(){
  if(window.__CINE&&__CINE.wanted&&__CINE.wanted()){__BOOK.beginCine();return;}
  showEntry();
}
/* coverTo com zero duração (o chain já controla o tempo) */
function coverTo2(nr){
  COV.r=nr;applyCover();
  coverLift(nr>4&&nr<170);
}
function saveSeen(){try{localStorage.setItem('thor_intro_v20','1');}catch(e){}ST.seen=true;}

/* pular: clique/tecla/roda durante a abertura. O INICIAR aparece na hora
   (a cutscene acabou de terminar) — e o MESMO input não pode apertá-lo */
function skipIntro(swallow){
  if(ST.mode!=='intro')return;
  ST.skipAt=performance.now();
  ST.swallow=swallow?performance.now():0; /* só o clique do pulo morre (0.7s) */
  try{audio();}catch(e){}
  forceIdle(true);saveSeen();
}

/* ============================================================
   v1.9.2 — A INTRODUÇÃO CINEMATOGRÁFICA (intro.js): o mergulho
   O livro vivo continua: a câmera aproxima da página direita, uma
   folha vira revelando A PRANCHA DO ABISMO (pintada por intro.js),
   a câmera afunda até a página ENCHER a tela e o canvas da cine
   assume (engaged) — dali em frente a cutscene é desenhada lá.
   Qualquer falha devolve o estado limpo com a ENTRADA (nunca trava).
   ============================================================ */
function beginCine(){
  if(ST.busy||ST.mode==='intro')return;
  var ok=false;
  try{ok=window.__CINE&&__CINE.play&&__CINE.play();}catch(e){ok=false;}
  if(!ok){showEntry();return;}
  ST.mode='intro';ST.busy=true;ST.entryPending=true;ST.entryCine=false;
  var en=$('entry');
  if(en){en.classList.add('hidden');en.classList.remove('cineMode');}
  var urls={L:'',R:''};
  try{urls=__CINE.pageArt()||urls;}catch(e){}
  if(!urls.R){try{__CINE.abort();}catch(e){}showEntry();return;}
  buildCineSpread(urls);
  showSpread('cine');
  armWatchdog('intro');
  focusPage('R',.34,function(){
    flip(1,{dur:1.05,spread:'cine',backArt:urls.R,
      out:$('bookMenu'),ins:scene.spread,
      done:function(){try{noiseSfx(.12,.03,1500,'bandpass');}catch(e){}diveIntoPage();}});
  });
}
function buildCineSpread(urls){
  var L=scene.spL,R=scene.spR;if(!L||!R)return;
  var img=function(u){return '<img src="'+u+'" alt="" style="width:100%;height:100%;object-fit:fill;display:block">';};
  L.innerHTML=img(urls.L||urls.R);
  R.innerHTML=img(urls.R);
}
function diveIntoPage(){
  var spR=scene.spR,dim=scene.dim;
  if(!spR){cineHandoff();return;}
  if(dim&&!animOff())tw({dur:2.3,ease:easeIO,step:function(p){dim.style.opacity=(.42*p).toFixed(3);}});
  if(ST.vert||animOff()){cineHandoff();return;}
  var w=unitW();
  camTo(-w*.06,w*.02,1.5,-.8,.95,easeIO,function(){
    /* 2ª perna: a página ENCHE a tela (medida real do retângulo) */
    var r=spR.getBoundingClientRect(),vw=window.innerWidth,vh=window.innerHeight;
    if(!r||!r.width){cineHandoff();return;}
    var k=(vw*1.02)/r.width,s2=CAM.s*k;
    var cx=r.left+r.width/2,cy=r.top+r.height/2;
    var nx=CAM.x-(cx-vw/2)*k,ny=CAM.y-(cy-vh/2)*k;
    camTo(nx,ny,s2,0,1.5,easeI,function(){
      setTimeout(cineHandoff,320);
    });
  });
}
function cineHandoff(){
  try{
    window.__CINE.engage();
  }catch(e){
    /* qualquer falha: estado limpo + entrada — o jogo NUNCA fica preso */
    try{window.__CINE&&__CINE.abort&&__CINE.abort();}catch(e2){}
    forceIdle();
  }
}

/* ============================================================
   INTERCEPTAÇÃO DOS CLIQUES — o handler original continua mandando;
   livro.js só executa a cena do livro ANTES do replay.
   (listener na fase de captura do document: roda ANTES dos
   handlers do botão, e o replay é um clique sintético que passa)
   ============================================================ */
var INTERCEPT={
  startBtn:function(b){goDescer(b);},
  continueBtn:function(b){goContinue(b);},
  saveBtn:function(b){goSaves(b);},
  optBtn:function(b){goOptions(b);},
  quitBtn:function(b){goQuit(b);},
  menuNews:function(b){goNews(b);},
  circleBtn:function(b){goCircles(b);},
  conqBtn:function(b){goOverlay('conq',b);},
  bestBtn:function(b){goOverlay('best',b);},
  grimBtn:function(b){goOverlay('grim',b);},
  modsBtn:function(b){goMods(b);},
  menuLimboBtn:function(b){goTest(b);},
  gateTestBtn:function(b){goTest(b);},
  limboTestBtn:function(b){goTest(b);},
  versionBtn:function(b){goOverlay('news',b);}
};
function wireIntercept(){
  document.addEventListener('click',function(e){
    /* v1.9.1: o clique que PULOU a intro morre aqui — mas só por ~0.7s
       (pointerdown→click); depois o menu volta a receber cliques normal */
    if(ST.swallow){
      if(performance.now()-ST.swallow<700){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();return;}
      ST.swallow=0;
    }
    var t=e.target;
    if(!t||!t.closest)return;
    var b=t.closest('#menu button,#menuNews,#versionBtn');
    if(!b||!b.id)return;
    var fn=INTERCEPT[b.id];
    if(!fn)return;
    if(ST.replay){ST.replay=false;return;} /* replay sintético: passa ao handler original */
    if(ST.busy||ST.mode==='intro'){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();return;}
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
    try{fn(b);}catch(err){ST.replay=false;end();}
  },true);
}

/* ============================================================
   O MENU ABRE E FECHA — observador: nada de intro repetida,
   nada de loop rodando com o menu fora da tela
   ============================================================ */
function wireObserver(){
  var m=$('menu');if(!m)return;
  try{
    var lastHidden=m.classList.contains('hidden');
    var mo=new MutationObserver(function(){
      var hidden=m.classList.contains('hidden');
      if(hidden===lastHidden)return; /* só a TRANSIÇÃO importa (gate-open etc. não mexem) */
      lastHidden=hidden;
      ST.menuOn=!hidden;
      if(hidden){
        if(raf){cancelAnimationFrame(raf);raf=0;}
        if(ST.mode==='intro')forceIdle();
        else if(ST.busy||ST.spread)forceIdle();
      }else{
        if(ST.mode!=='intro'&&(ST.busy||ST.spread))forceIdle(); /* volta ao menu: estado limpo, sem replay */
        startLoop();
      }
    });
    mo.observe(m,{attributes:true,attributeFilter:['class']});
  }catch(e){}
}

/* ============================================================
   OPÇÃO "ANIMAÇÕES DO LIVRO" — completas / leves / desligadas
   ============================================================ */
function addAnimOption(){
  var panel=document.querySelector('#options .optPanel');
  if(!panel||$('oBookAnim'))return;
  var row=document.createElement('div');row.className='optRow bookRow';
  var lbl=document.createElement('span');lbl.className='optLbl';lbl.textContent='ANIMAÇÕES DO LIVRO';
  var b=document.createElement('button');b.className='optChk sel';b.id='oBookAnim';
  var names={full:'COMPLETAS',fast:'LEVES',off:'DESLIGADAS'};
  b.textContent=names[ST.anim]||'COMPLETAS';
  b.addEventListener('click',function(){
    ST.anim=ST.anim==='full'?'fast':ST.anim==='fast'?'off':'full';
    b.textContent=names[ST.anim];
    try{localStorage.setItem('thorBookAnim',ST.anim);}catch(e){}
    try{blip('sine',420,300,.1,.05);}catch(e){}
  });
  row.appendChild(lbl);row.appendChild(b);
  var restore=$('oRestore');
  if(restore&&restore.parentNode===panel)panel.insertBefore(row,restore);
  else panel.appendChild(row);
}

/* ============================================================
   A ENTRADA — THOR REVENGE + INICIAR (v1.9.1)
   A porta da frente do jogo: o título em cima e o INICIAR logo
   abaixo. v1.9.1: a cutscene do livro vem PRIMEIRO (o boot roda
   a abertura); quando ela termina, o INICIAR aparece. Ao apertar,
   destaque + saída curta — o livro já está aberto atrás.
   NUNCA repete: a entrada só existe no boot, e o guard ST.entryGo
   impede clique/tecla duplicados.
   ============================================================ */
function wireEntry(){
  var en=$('entry'),btn=$('entryBtn');if(!en||!btn)return;
  var go=function(){
    if(ST.entryGo)return;ST.entryGo=true;
    try{audio();}catch(e){}
    try{blip('sine',392,587,.14,.06);}catch(e){}
    try{noiseSfx(.14,.04,760,'lowpass');}catch(e){}
    btn.classList.add('go'); /* destaque da inscrição */
    setTimeout(function(){
      en.classList.add('hidden');   /* a entrada sai (fade .4s) — o livro já está aberto atrás */
      en.classList.remove('cineMode');
      try{window.__CINE&&__CINE.release&&__CINE.release();}catch(e){} /* v1.9.2: o canvas da cine funde junto */
      ST.menuOn=true;startLoop();
    },340);
  };
  btn.addEventListener('click',go);
  /* v1.9.2: REVER A INTRODUÇÃO — o convite discreto sob o INICIAR */
  var again=$('entryAgain');
  if(again&&!again.__w){again.__w=1;again.addEventListener('click',function(ev){
    ev.stopPropagation();
    if(ST.busy||ST.mode==='intro')return;
    try{audio();}catch(e){}
    try{blip('sine',300,220,.12,.04);}catch(e){}
    ST.entryGo=false; /* a entrada volta a poder ser usada depois */
    en.classList.add('hidden');en.classList.remove('cineMode');
    __BOOK.beginCine();
  });}
  /* teclado: Enter/Espaço na entrada (o foco pode estar no body).
     O MESMO Enter que pulou a cutscene não aperta o INICIAR: guard ST.skipAt */
  document.addEventListener('keydown',function(ev){
    if(en.classList.contains('hidden'))return;
    if(performance.now()-ST.skipAt<450)return;
    var k=ev.key,c=ev.code;
    if(k!=='Enter'&&k!==' '&&c!=='Enter'&&c!=='Space')return;
    var t=ev.target;
    if(t&&t.id==='muteBtn')return;               /* mudo segue com o clique nativo */
    if(t&&t.closest&&t.closest('#entry'))return; /* o botão trata sozinho */
    ev.preventDefault();ev.stopPropagation();go();
  },true);
}

/* ============================================================
   BOTÃO DE BOOT
   ============================================================ */
function bootBook(){
  try{
    if(!$('bookMenu'))return;
    buildScene();
    wireIntercept();
    wireObserver();
    wireOverlayWatchers();
    wireLousaZoom();
    wireLousaInfo();
    var m=$('menu');
    /* v1.9.1: o fluxo agora é — cutscene do livro PRIMEIRO, INICIAR DEPOIS.
       O menu fica visível (o conteúdo já está escrito) e a abertura toca
       no boot; quando ela termina, a ENTRADA (THOR REVENGE + INICIAR) surge. */
    var en=$('entry');
    if(en)en.classList.add('hidden');
    if(m)m.classList.remove('hidden');
    ST.menuOn=true;
    wireEntry();
    refreshLousa();
    /* pular com qualquer input durante a abertura */
    document.addEventListener('pointerdown',function(){if(ST.mode==='intro')skipIntro(true);},true);
    document.addEventListener('wheel',function(){if(ST.mode==='intro')skipIntro(true);},{passive:true});
    window.addEventListener('keydown',function(ev){
      if(ST.mode==='intro'){
        var k=ev.key;
        if(k==='Tab'||k==='Shift'||k==='Control'||k==='Alt'||k==='Meta')return;
        skipIntro(false);
      }
    },true);
    playIntro();
  }catch(e){
    /* qualquer falha: o menu fica utilizável do jeito antigo */
    try{forceIdle();}catch(e2){}
    var en2=$('entry');if(en2)en2.classList.add('hidden');
    var m2=$('menu');if(m2)m2.classList.remove('hidden');
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootBook);
else bootBook();

/* ============ API mínima (game.js usa __BOOK.asPage/unPage) ============ */
window.__BOOK={
  version:'1.9.2',
  introBusy:function(){return ST.mode==='intro'||ST.busy;},
  asPage:function(name){if(name==='options')asPageOptions();},
  unPage:function(name){if(name==='options')unPageOptions();},
  beginCine:function(){ /* v1.9.2: entra no modo intro e mergulha na introdução */
    if(ST.busy||ST.mode==='intro')return;
    ST.entryGo=false;
    beginCine();
  },
  onCineEnd:function(){ /* v1.9.2: fim natural da introdução — livro em casa + ENTRADA em modo cine */
    ST.entryCine=true;
    forceIdle();
  },
  state:function(){return {mode:ST.mode,busy:ST.busy,anim:ST.anim,lite:ST.lite,spread:ST.spread,seen:ST.seen,tweens:TWS.length,cover:Math.round(COV.r),covered:menuCovered(),entryPending:ST.entryPending,entryCine:ST.entryCine,cam:{x:Math.round(CAM.x),y:Math.round(CAM.y),s:+CAM.s.toFixed(3),r:+CAM.r.toFixed(3)},menuOn:ST.menuOn};},
  forceIdle:function(){forceIdle();},
  openSettingsSpread:function(){asPageOptions();}
};
})();
