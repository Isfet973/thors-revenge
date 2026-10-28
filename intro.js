/* ============================================================
   THOR: REVENGE — intro.js · v1.9.2 "A INTRODUÇÃO CINEMATOGRÁFICA"
   ============================================================
   A história proibida que se torna real: a cutscene de abertura
   (30–50s na primeira apresentação, PULÁVEL) que continua a
   abertura do livro do menu e mergulha no manuscrito.

   OS MOMENTOS (PROMPT do usuário, implementados como fases):
   0 ABISMO      — a prancha do grande abismo revelada pela folha
                   que vira; a tinta deixa de parecer apenas tinta.
   1 DESCIDA     — o Inferno registrado no manuscrito: estrutura
                   em camadas percorrida pela câmera (muralhas,
                   portas fechadas, silhuetas, fumaça), frases nas
                   margens; a câmera acha a região quase vazia com
                   uma pequena figura caída.
   2 THOR        — o cachorro morto-vivo acorda com peso: ergue a
                   cabeça, olha os próprios membros, silêncio, a
                   passagem surge ao fundo e ele caminha — pequeno
                   diante da imensidão.
   3 REGISTRO    — a câmera volta ao livro: a ilustração mudou
                   (Thor de pé diante da passagem) e uma anotação
                   antiga registra o destino.
   4 MARGEM      — Thor atravessa a entrada; a página fica quase
                   toda escuridão desenhada; uma marca de tinta
                   surge na margem e algo se escreve sozinho
                   (sem susto, sem explicação).
   5 TRAVESSIA   — a câmera atravessa a ilustração: o papel some,
                   os traços ganham volume e a paleta fria do jogo
                   assume; Thor entra na escuridão.
   6 FIM         — o quadro final (o corredor escuro) permanece e
                   a ENTRADA (THOR REVENGE + INICIAR) revela-se
                   sobre ele, como inscrição antiga.

   ARQUITETURA (desempenho em primeiro lugar):
   · UM único canvas fullscreen (#cineCv, dentro do #menu) com UM
     loop requestAnimationFrame próprio — dorme com a aba oculta,
     MORRE no fim/skip (zero loops sobrando).
   · Toda a arte é PRÉ-RENDERIZADA uma vez (prancha 1280×2000,
     chão, corredor, página escura, grão, vinheta, sprites) — por
     quadro só há blits, transform de câmera e o Thor vivo.
   · Palco lógico 1280×720 com cover-fit: funciona em qualquer
     resolução sem repintar nada (o resize só recalcula o mapa).
   · Duração por TEMPO (dt real, teto .25s) — com fps baixo a
     cena fica mais tosca, mas a duração e a ordem se mantêm.
   · Áudio: usa os primitivos do audio.js (blip/noiseSfx/
     noiseSweep/sfx) + um drone próprio ligado no musBus —
     respeita MÚSICA/SFX/EQUIVOCAR (mudo) e morre no fim.
   · Skip: qualquer clique/tecla/roda durante o modo intro (o
     mesmo caminho da abertura do livro — livro.js chama
     __CINE.abort()) → estado final idêntico ao natural.
   · NÃO toca no gameplay, nos handlers do game.js, nos saves nem
     nos sprites: o Thor da cutscene é um desenho a tinta próprio
     com a MESMA identidade visual (azul-acinzentado, olhos frios
     brilhantes, contorno escuro).

   Integração (livro.js):
   · __BOOK.beginCine()  — entra no modo intro e chama play(true)
     (depois da abertura do livro, ou no "rever a introdução").
   · __CINE.abort()      — chamado por forceIdle (skip/falha).
   · __BOOK.onCineEnd()  — chamado no fim natural: restaura o
     livro, marca visto e revela a ENTRADA em modo cine.
   · __CINE.release()    — chamado pelo INICIAR: funde o canvas.
   ============================================================ */
(function(){
'use strict';
if(window.__CINE)return;

/* ============ estado ============ */
var SW=1280,SH=720;                 /* palco lógico */
var C={on:false,ended:false,freed:false,phase:'-',idx:-1,t:0,gt:0,
       raf:0,last:0,cv:null,cx:null,vw:0,vh:0,sc:1,ox:0,oy:0,dpr:1,
       fast:false,scf:1,wd:0,startedAt:0,hidden:false};
var A={};                           /* arte pré-renderizada */
var PH=[];                          /* fases construídas no play */
var TOT=0;

/* ============ util ============ */
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function lerp(a,b,p){return a+(b-a)*p;}
function easeIO(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function easeO(t){return 1-Math.pow(1-t,3);}
function easeI(t){return t*t*t;}
function easeN(t){return t<0?0:t>1?1:t;} /* linear com trava */
function R(a,b){return a+Math.random()*(b-a);}
function $(id){return document.getElementById(id);}
function cineFast(){try{return localStorage.getItem('thorCineFast')==='1';}catch(e){return false;}}
function SC(){ /* multiplicador de duração (teste: thorCineFast) */
  if(C.fast)return .16;
  var a='full';
  try{a=(window.__BOOK&&__BOOK.state&&__BOOK.state().anim)||'full';}catch(e){}
  return a==='fast'?.6:1;
}
function lite(){try{return !!(window.__BOOK&&__BOOK.state&&__BOOK.state().lite);}catch(e){return false;}}

/* ============ áudio (primitivos do audio.js + drone próprio) ============ */
function audioOK(){
  try{
    if(window.muted)return false;
    if(typeof audioCtx==='undefined'||!audioCtx)return false;
    return audioCtx.state==='running';
  }catch(e){return false;}
}
function sWind(dur,vol,freq){try{if(audioOK())noiseSfx(dur,vol,freq||260,'lowpass');}catch(e){}}
function sSweep(dur,vol,f0,f1,tipo){try{if(audioOK())noiseSweep(dur,vol,f0,f1,tipo||'bandpass');}catch(e){}}
function sNoise(dur,vol,freq,tipo){try{if(audioOK())noiseSfx(dur,vol,freq,tipo);}catch(e){}}
function sBlip(type,f0,f1,dur,vol,dly){try{if(audioOK())blip(type,f0,f1,dur,vol,dly);}catch(e){}}
function sNamed(n){try{if(audioOK()&&sfx&&sfx[n])sfx[n]();}catch(e){}}
/* drone/tom próprio — liga no musBus (respeita o volume de MÚSICA) */
function makeDrone(f1,f2,lp){
  if(!audioOK())return null;
  try{
    var g=audioCtx.createGain();g.gain.value=0;
    var fl=audioCtx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp||300;fl.Q.value=.4;
    var o1=audioCtx.createOscillator(),o2=audioCtx.createOscillator();
    o1.type='sine';o2.type='sine';o1.frequency.value=f1;o2.frequency.value=f2;
    o1.connect(fl);o2.connect(fl);fl.connect(g);g.connect(musBus);
    var t0=audioCtx.currentTime;o1.start(t0);o2.start(t0);
    return {g:g,o1:o1,o2:o2,
      to:function(v,d){try{var t=audioCtx.currentTime;g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(v,t,d||1.6);}catch(e){}},
      stop:function(){try{var t=audioCtx.currentTime;g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(0,t,.9);o1.stop(t+4);o2.stop(t+4);}catch(e){}}};
  }catch(e){return null;}
}
function killDrone(d){if(d){try{d.stop();}catch(e){}}}

/* ============ sprites pequenos pré-renderizados ============ */
function mkCv(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function mkPuff(sz,col){ /* fumaça/névoa macia */
  var cv=mkCv(sz,sz),c=cv.getContext('2d');
  var g=c.createRadialGradient(sz/2,sz/2,2,sz/2,sz/2,sz/2);
  g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g;c.fillRect(0,0,sz,sz);return cv;
}
function mkGlow(sz,col){ /* brilho (olhos/luz distante) */
  var cv=mkCv(sz,sz),c=cv.getContext('2d');
  var g=c.createRadialGradient(sz/2,sz/2,1,sz/2,sz/2,sz/2);
  g.addColorStop(0,col);g.addColorStop(.35,col.replace(/[\d.]+\)$/,'0.35)'));g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g;c.fillRect(0,0,sz,sz);return cv;
}

/* ============ texto como canvas (frases das margens etc.) ============ */
function mkText(str,px,col,w,ital,ls){
  var f=(ital?'italic ':'')+px+'px "IM Fell English SC", Georgia, serif';
  var m=mkCv(8,8),mc=m.getContext('2d');
  mc.font=f;
  var wid=mc.measureText(str).width+(ls||0)*str.length+24;
  var cv=mkCv(Math.ceil(w||wid),Math.ceil(px*2.1)),c=cv.getContext('2d');
  c.font=f;c.fillStyle=col;c.textBaseline='middle';
  if(ls){ /* letter-spacing manual */
    var x=12;for(var i=0;i<str.length;i++){c.fillText(str[i],x,cv.height/2);x+=c.measureText(str[i]).width+ls;}
  }else c.fillText(str,12,cv.height/2);
  return cv;
}

/* ============================================================
   O DESENHO DE THOR — ilustração a tinta com a identidade real
   do protagonista (cachorro morto-vivo: azul-acinzentado, olhos
   frios brilhantes, contorno escuro). NÃO usa nem altera os
   sprites do jogo; combina com eles.
   pose: {curl:0..1, head:0..1, lookX:-1..1, stand:0..1, walk:0..1,
          back:bool, alpha, tremble}
   ============================================================ */
var THOR={body:'#8ba2ac',body2:'#6d838c',head:'#8ba2ac',muz:'#a7bcc4',line:'#14100e',eye:'#f4f8f5'};
/* O Thor da introdução agora usa primeiro o MESMO sprite que o gameplay.
   Sem PNG, o fallback reproduz as proporções e cores de drawPlayer() em game.js. */
function drawThor(c,x,y,s,pose,t){
  pose=pose||{};
  var stand=pose.stand===undefined?1:clamp(pose.stand,0,1);
  var curl=pose.curl===undefined?1-stand:clamp(pose.curl,0,1);
  var walk=pose.walk||0, alpha=pose.alpha===undefined?1:pose.alpha;
  var moving=!!pose.moving;
  var back=!!pose.back;
  var tremble=pose.tremble?Math.sin(t*23)*.7:0;
  var angle=back?-Math.PI/2:((pose.lookX||0)*.08)+((pose.dip||0)*.10);
  var sy=.72+.28*stand;
  if(curl>.5)angle+=.06*Math.sin(t*2.4);
  var bob=moving?Math.abs(Math.sin(walk*Math.PI*2))*1.3:Math.sin(t*2.2)*.25;
  c.save();
  c.translate(x+tremble,y+bob);
  c.globalAlpha=alpha;
  c.fillStyle='rgba(0,0,0,.34)';
  c.beginPath();c.ellipse(0,8,20*s,5*s,0,0,6.2832);c.fill();
  c.rotate(angle);
  c.scale(s,s*sy);

  /* Quando há sprites externos, use a mesma arte/direção do jogo. O
     wrapper mantém a escala cinematográfica sem modificar o sprite original. */
  var used=false;
  try{
    if(window.THOR_PNG&&typeof window.THOR_PNG.drawPlayer==='function'){
      used=window.THOR_PNG.drawPlayer(c,{x:0,y:0,angle:0,walkT:walk*6.2832},{t:t},1,1)===true;
    }
  }catch(e){used=false;}

  if(!used){
    /* Fallback equivalente ao drawPlayer() de game.js: vista superior,
       corpo compacto, focinho para a direita, orelhas, patas curtas e olhos claros. */
    var step=moving?Math.sin(walk*6.2832)*3.2:0;
    var wag=Math.sin(t*10)*.55;
    c.save();c.translate(-14,0);c.rotate(wag);
    c.strokeStyle=THOR.line;c.lineWidth=1.5;c.fillStyle='#6d838c';
    c.beginPath();c.ellipse(-4,0,7,3,0,0,6.2832);c.fill();c.stroke();c.restore();
    c.fillStyle='#5d7278';
    c.beginPath();c.ellipse(6,-8,4,2.6,0,0,6.2832);c.fill();
    c.beginPath();c.ellipse(6,8,4,2.6,0,0,6.2832);c.fill();
    c.beginPath();c.ellipse(-7,-7+step*.5,3.6,2.4,0,0,6.2832);c.fill();
    c.beginPath();c.ellipse(-7,7-step*.5,3.6,2.4,0,0,6.2832);c.fill();
    c.beginPath();c.ellipse(0,0,14,10.5,0,0,6.2832);
    c.fillStyle=THOR.body;c.fill();c.strokeStyle=THOR.line;c.lineWidth=2;c.stroke();
    c.beginPath();c.ellipse(-3,0,8.5,7,0,0,6.2832);c.fillStyle='#71898f';c.fill();
    c.fillStyle='#5d7278';
    for(var side=-1;side<=1;side+=2){
      c.beginPath();c.moveTo(7,side*5);c.lineTo(2,side*12);c.lineTo(-2,side*5);c.closePath();c.fill();
      c.strokeStyle=THOR.line;c.lineWidth=1.5;c.stroke();
    }
    c.beginPath();c.arc(10,0,8.5,0,6.2832);c.fillStyle=THOR.head;c.fill();
    c.strokeStyle=THOR.line;c.lineWidth=2;c.stroke();
    c.beginPath();c.ellipse(17,0,5.5,4,0,0,6.2832);c.fillStyle=THOR.muz;c.fill();
    c.strokeStyle=THOR.line;c.lineWidth=1.5;c.stroke();
    c.fillStyle=THOR.line;c.beginPath();c.ellipse(20.5,0,2,1.6,0,0,6.2832);c.fill();
    for(side=-1;side<=1;side+=2){
      c.fillStyle=THOR.eye;c.beginPath();c.arc(11,side*3.6,1.8,0,6.2832);c.fill();
      c.globalAlpha=alpha*(.3+.18*Math.sin(t*6+side));
      c.beginPath();c.arc(11,side*3.6,3.2,0,6.2832);c.fill();
      c.globalAlpha=alpha;
    }
  }
  /* O despertar tem movimento, mas sem mudar a anatomia do Thor: o corpo
     se comprime enquanto está caído, recupera a escala e dá uma leve olhada. */
  if(!used&&pose.dip){
    c.globalAlpha=alpha*.13;c.fillStyle='#e0edf0';
    c.beginPath();c.ellipse(12,-2,8,5,0,0,6.2832);c.fill();
  }
  c.restore();
}
/* ============================================================
   A PRANCHA — o manuscrito do Inferno (1280×2000), pintada 1×.
   Topo: o grande abismo (a boca). Meio: a estrutura em camadas
   (muralhas, portas fechadas, caminhos, precipícios). Fundo: a
   região quase vazia com a pequena figura caída (Thor).
   ============================================================ */
var INK='rgba(46,28,14,.9)',INK2='rgba(46,28,14,.55)',RUB='rgba(122,28,16,.8)';
function hatch(c,x,y,w,h,gap,ang,alpha){
  c.save();c.strokeStyle='rgba(46,28,14,'+(alpha||.3)+')';c.lineWidth=1;
  c.beginPath();
  for(var i=-h;i<w;i+=gap){c.moveTo(x+i,y);c.lineTo(x+i+h*Math.tan(ang||.6),y+h);}
  c.stroke();c.restore();
}
function roughLine(c,x1,y1,x2,y2,w,amp){
  c.strokeStyle=INK;c.lineWidth=w||1.6;
  c.beginPath();c.moveTo(x1,y1);
  var n=Math.max(3,Math.floor(Math.hypot(x2-x1,y2-y1)/26));
  for(var i=1;i<=n;i++){
    var p=i/n;
    c.lineTo(lerp(x1,x2,p)+Math.sin(p*9.7+x1)* (amp||2.2), lerp(y1,y2,p)+Math.cos(p*7.3+y1)*(amp||2.2));
  }
  c.stroke();
}
function paintPlate(){
  var cv=mkCv(1280,2000),c=cv.getContext('2d');
  /* papel */
  var g=c.createLinearGradient(0,0,1280,2000);
  g.addColorStop(0,'#cdb98d');g.addColorStop(.45,'#c2ad80');g.addColorStop(1,'#9c875c');
  c.fillStyle=g;c.fillRect(0,0,1280,2000);
  /* manchas e fibras */
  for(var i=0;i<26;i++){c.fillStyle='rgba(92,58,24,'+R(.04,.12)+')';
    c.beginPath();c.ellipse(R(0,1280),R(0,2000),R(20,90),R(12,50),R(0,3),0,6.2832);c.fill();}
  for(i=0;i<520;i++){c.fillStyle='rgba(60,40,18,'+R(.02,.08)+')';c.fillRect(R(0,1280),R(0,2000),1.2,1.2);}
  /* ---------- TOPO: a boca do abismo (y 40..700) ---------- */
  c.fillStyle='rgba(38,22,10,.28)';c.fillRect(0,40,1280,14);
  /* céu/paço superior com nuvens gravadas */
  hatch(c,80,70,500,120,7,.5,.14);
  hatch(c,760,60,440,100,8,-.5,.12);
  roughLine(c,40,205,620,190,2,3);roughLine(c,660,188,1240,205,2,3);
  /* a boca: cruz em ruínas + arco quebrado no alto */
  roughLine(c,214,236,214,392,3,2);roughLine(c,150,268,278,262,3,2);
  roughLine(c,1046,244,1050,392,3,2);roughLine(c,992,276,1112,270,3,2);
  /* as bordas da boca — penhascos em camadas */
  var cliffs=[[0,430,420,560],[300,470,560,640],[640,440,940,610],[900,480,1280,620]];
  for(i=0;i<cliffs.length;i++){
    var cl=cliffs[i];
    c.fillStyle='rgba(58,40,22,.5)';
    c.beginPath();c.moveTo(cl[0],cl[1]+90);
    c.lineTo(cl[0]+60,cl[1]+40);c.lineTo(cl[0]+150,cl[1]+70);
    c.lineTo(cl[0]+260,cl[1]+20);c.lineTo(cl[2],cl[1]+58);c.lineTo(cl[2],cl[3]);c.lineTo(cl[0],cl[3]);c.closePath();c.fill();
    hatch(c,cl[0],cl[1]+90,cl[2]-cl[0],cl[3]-cl[1]-90,6,.55,.3);
    roughLine(c,cl[0],cl[1]+90,cl[2],cl[1]+58,2.4,4);
  }
  /* a garganta — escura, descendo em espiral sugestiva (uma DICA, não um mapa) */
  var gr=c.createRadialGradient(830,540,20,830,540,240);
  gr.addColorStop(0,'rgba(16,9,4,.95)');gr.addColorStop(.6,'rgba(24,13,6,.72)');gr.addColorStop(1,'rgba(24,13,6,0)');
  c.fillStyle=gr;c.beginPath();c.ellipse(830,560,270,190,0,0,6.2832);c.fill();
  c.strokeStyle=INK;c.lineWidth=2.2;
  c.beginPath();
  for(var a2=0;a2<5.4;a2+=.08){var rr=214-a2*36;c.lineTo(830+Math.cos(a2+1.2)*rr*1.24,560+Math.sin(a2+1.2)*rr*.7);}
  c.stroke();
  /* escadinha e portinha no fundo da garganta (a ENTRADA, fechada) */
  c.strokeStyle=INK;c.lineWidth=2;
  for(i=0;i<5;i++)roughLine(c,806+i*12,682-i*9,820+i*12,682-i*9,1.6,1);
  c.strokeRect(846,636,44,52);hatch(c,846,636,44,52,5,.7,.5);
  /* legendas à mão */
  c.font='italic 21px "IM Fell English SC", Georgia, serif';c.fillStyle=INK2;
  c.fillText('aqui o chão acaba',96,486);c.fillText('e não nasce de novo',96,514);
  c.font='19px "IM Fell English SC", Georgia, serif';c.fillStyle=RUB;
  c.fillText('· o abismo ·',1156,448);
  /* ---------- MEIO: a estrutura em camadas (700..1450) ---------- */
  roughLine(c,0,730,1280,724,2.6,3);
  /* muralhas e portões FECHADOS em três patamares */
  var tiers=[[760,'as muralhas das almas sem enterro'],[1010,'os tribunais que nunca saem'],[1260,'o mercado das coisas roubadas']];
  for(i=0;i<tiers.length;i++){
    var ty=tiers[i][0];
    /* faixa de terra */
    c.fillStyle='rgba(74,52,28,.35)';c.fillRect(0,ty-26,1280,52);
    hatch(c,0,ty+8,1280,18,7,.2,.16);
    /* muralha com ameias */
    c.strokeStyle=INK;c.lineWidth=2;
    roughLine(c,0,ty-26,1280,ty-30,2.2,2);
    for(var m=60;m<1280;m+=160){
      c.strokeRect(m,ty-64,54,38);
      hatch(c,m,ty-64,54,38,5,.4,.38);
      /* porta fechada */
      c.beginPath();c.moveTo(m+16,ty-26);c.lineTo(m+16,ty-50);c.arc(m+27,ty-50,11,3.1416,0);c.lineTo(m+38,ty-26);c.stroke();
      c.strokeStyle=RUB;c.beginPath();c.moveTo(m+24,ty-38);c.lineTo(m+31,ty-31);c.stroke(); /* tranca */
      c.strokeStyle=INK;
    }
    c.font='italic 17px "IM Fell English SC", Georgia, serif';c.fillStyle=INK2;
    c.fillText(tiers[i][1],34,ty+42);
  }
  /* caminhos serpenteando entre os patamares */
  c.strokeStyle='rgba(46,28,14,.5)';c.lineWidth=1.6;
  var path=[[60,780],[300,830],[520,790],[760,860],[980,820],[1180,880]];
  c.beginPath();c.moveTo(path[0][0],path[0][1]);
  for(i=1;i<path.length;i++)c.quadraticCurveTo(path[i-1][0]+90,path[i][1]-40,path[i][0],path[i][1]);
  c.stroke();
  var path2=[[1180,1030],[930,1080],[700,1040],[430,1100],[210,1060]];
  c.beginPath();c.moveTo(path2[0][0],path2[0][1]);
  for(i=1;i<path2.length;i++)c.quadraticCurveTo(path2[i-1][0]-90,path2[i][1]+50,path2[i][0],path2[i][1]);
  c.stroke();
  var path3=[[110,1290],[380,1340],[640,1300],[900,1360],[1170,1320]];
  c.beginPath();c.moveTo(path3[0][0],path3[0][1]);
  for(i=1;i<path3.length;i++)c.quadraticCurveTo(path3[i-1][0]+90,path3[i][1]-50,path3[i][0],path3[i][1]);
  c.stroke();
  /* precipícios que descem entre os patamares */
  for(i=0;i<3;i++){
    var px2=200+i*420;
    c.fillStyle='rgba(20,11,5,.8)';
    c.beginPath();c.moveTo(px2,786);c.lineTo(px2+90,786);c.lineTo(px2+52,1044);c.lineTo(px2+18,1044);c.closePath();c.fill();
    hatch(c,px2,786,90,258,6,.15,.3);
  }
  /* ---------- FUNDO: a região quase vazia (1450..2000) ---------- */
  roughLine(c,0,1478,1280,1472,2.2,3);
  c.font='italic 18px "IM Fell English SC", Georgia, serif';c.fillStyle=INK2;
  c.fillText('...e adiante, quase nada. um chão de cinza.',60,1522);
  /* pedaços: estandes tombados, corrente, lascas */
  roughLine(c,180,1620,240,1600,2,2);roughLine(c,240,1600,252,1638,2,2);
  c.beginPath();c.arc(320,1668,9,0,6.2832);c.strokeStyle=INK;c.lineWidth=2.4;c.stroke();
  c.beginPath();c.arc(338,1672,9,0,6.2832);c.stroke();
  roughLine(c,980,1590,1060,1612,2,2);
  hatch(c,120,1690,180,40,7,.2,.14);
  /* A PEQUENA FIGURA CAÍDA — Thor encolhido, quase apagado */
  c.save();c.globalAlpha=.88;
  drawThor(c,700,1908,.92,{curl:1,head:.1,stand:0,alpha:.88},1.2);
  c.restore();
  c.font='italic 16px "IM Fell English SC", Georgia, serif';c.fillStyle='rgba(46,28,14,.45)';
  c.fillText('(algo está aqui há muito tempo)',806,1900);
  /* escuridão comendo as bordas de baixo */
  var dk=c.createLinearGradient(0,1700,0,2000);
  dk.addColorStop(0,'rgba(18,10,4,0)');dk.addColorStop(1,'rgba(12,6,2,.9)');
  c.fillStyle=dk;c.fillRect(0,1700,1280,300);
  /* vinheta da prancha */
  var vg=c.createRadialGradient(640,900,300,640,1000,1100);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(20,10,4,.4)');
  c.fillStyle=vg;c.fillRect(0,0,1280,2000);
  return cv;
}
/* fatias de página (o spread do livro real recebe estas imagens) */
function paintPageSlice(plate,sx,side){
  var cv=mkCv(628,752),c=cv.getContext('2d');
  c.drawImage(plate,sx,0,628,752,0,0,628,752);
  /* sombra da lombada na borda interna */
  var g=side==='L'?c.createLinearGradient(568,0,628,0):c.createLinearGradient(0,0,60,0);
  g.addColorStop(0,'rgba(30,16,6,0)');g.addColorStop(1,'rgba(30,16,6,.5)');
  c.fillStyle=g;c.fillRect(0,0,628,752);
  /* escurecimento das bordas de fora */
  var e=side==='L'?c.createLinearGradient(0,0,40,0):c.createLinearGradient(628,0,588,0);
  e.addColorStop(0,'rgba(40,22,8,.42)');e.addColorStop(1,'rgba(40,22,8,0)');
  c.fillStyle=e;c.fillRect(0,0,628,752);
  return cv;
}

/* ============================================================
   O CHÃO (momento 3) — a região sombria junto à entrada da
   jornada: cinza, rachaduras, corrente partida, lajotas tombadas
   (não é um cemitério comum). Duas camadas para paralaxe.
   ============================================================ */
function paintGround(){
  var back=mkCv(1280,720),b=back.getContext('2d');
  var g=b.createLinearGradient(0,0,0,720);
  g.addColorStop(0,'#0c0a10');g.addColorStop(.55,'#161018');g.addColorStop(1,'#1c141c');
  b.fillStyle=g;b.fillRect(0,0,1280,720);
  /* longínquo: formas colossais quase invisíveis */
  b.fillStyle='rgba(30,22,34,.5)';
  b.beginPath();b.moveTo(0,300);b.lineTo(140,210);b.lineTo(300,280);b.lineTo(430,230);b.lineTo(560,300);b.closePath();b.fill();
  b.beginPath();b.moveTo(760,290);b.lineTo(900,190);b.lineTo(1090,270);b.lineTo(1280,220);b.lineTo(1280,330);b.lineTo(760,330);b.closePath();b.fill();
  /* A PASSAGEM ao fundo — surge na frente do horizonte (o desenho
     entra por cima dela em tempo real com alpha) */
  b.strokeStyle='rgba(70,58,78,.9)';b.lineWidth=3;
  b.beginPath();b.moveTo(600,318);b.lineTo(614,238);b.lineTo(668,214);b.lineTo(722,240);b.lineTo(732,318);b.closePath();b.stroke();
  b.fillStyle='rgba(6,4,8,.95)';b.fill();
  /* front: o chão de cinza */
  var fr=mkCv(1280,720),f=fr.getContext('2d');
  var fg=f.createLinearGradient(0,430,0,720);
  fg.addColorStop(0,'rgba(30,22,28,0)');fg.addColorStop(.4,'rgba(38,28,34,.85)');fg.addColorStop(1,'rgba(22,16,22,1)');
  f.fillStyle=fg;f.fillRect(0,430,1280,290);
  /* rachaduras */
  f.strokeStyle='rgba(8,5,9,.8)';f.lineWidth=2;
  for(var i=0;i<9;i++){
    var rx=R(60,1220),ry=R(480,700);
    f.beginPath();f.moveTo(rx,ry);
    for(var k=0;k<5;k++)f.lineTo(rx+=R(18,52),ry+=R(-14,20));
    f.stroke();
  }
  /* cinza espalhada */
  for(i=0;i<260;i++){f.fillStyle='rgba(150,140,150,'+R(.015,.05)+')';f.fillRect(R(0,1280),R(460,718),R(1,2.4),R(1,2));}
  /* corrente partida + lajota tombada + marcas */
  f.strokeStyle='rgba(96,88,102,.6)';f.lineWidth=4;
  f.beginPath();f.arc(930,640,13,0,6.2832);f.stroke();
  f.beginPath();f.arc(958,648,13,0,6.2832);f.stroke();
  f.fillStyle='rgba(44,34,46,.9)';f.strokeStyle='rgba(10,7,12,.9)';f.lineWidth=2;
  f.beginPath();f.moveTo(180,640);f.lineTo(250,610);f.lineTo(300,648);f.lineTo(224,668);f.closePath();f.fill();f.stroke();
  /* marcas de passos antigas indo ao fundo */
  f.fillStyle='rgba(120,110,124,.14)';
  for(i=0;i<6;i++){f.beginPath();f.ellipse(640+Math.sin(i*1.7)*36,660-i*34,7-i*.7,4-i*.4,0,0,6.2832);f.fill();}
  return {back:back,front:fr};
}
/* ============================================================
   O CORREDOR (momentos 5–6) — o mesmo corredor desenhado ganha
   volume: pedra fria azul-acinzentada, luz pálida ao fundo — a
   paleta da entrada da jornada (a Penumbra).
   ============================================================ */
function paintCorridor(){
  var cv=mkCv(1280,720),c=cv.getContext('2d');
  var g=c.createLinearGradient(0,0,0,720);
  g.addColorStop(0,'#100d16');g.addColorStop(.6,'#18131e');g.addColorStop(1,'#0e0b12');
  c.fillStyle=g;c.fillRect(0,0,1280,720);
  /* paredes em fuga */
  c.fillStyle='#1e1726';
  c.beginPath();c.moveTo(0,0);c.lineTo(430,150);c.lineTo(430,560);c.lineTo(0,720);c.closePath();c.fill();
  c.beginPath();c.moveTo(1280,0);c.lineTo(850,150);c.lineTo(850,560);c.lineTo(1280,720);c.closePath();c.fill();
  /* fiadas de pedra */
  c.strokeStyle='rgba(8,6,12,.85)';c.lineWidth=2;
  for(var i=0;i<6;i++){
    var t2=i/5,yl=lerp(150,560,t2),yl2=lerp(560,720,t2),xl=lerp(430,0,t2),xr=lerp(850,1280,t2);
    c.beginPath();c.moveTo(xl,yl);c.lineTo(xr,yl);c.stroke();
    c.beginPath();c.moveTo(xl*.5,lerp(yl,yl2,.5));c.lineTo(640,lerp(yl,yl2,.5));c.stroke();
  }
  for(i=1;i<5;i++){var xp=lerp(430,0,i/5);c.beginPath();c.moveTo(xp,lerp(150,560,i/5));c.lineTo(xp*.4,720);c.stroke();
    var xp2=lerp(850,1280,i/5);c.beginPath();c.moveTo(xp2,lerp(150,560,i/5));c.lineTo(640+(xp2-640)*.6,720);c.stroke();}
  /* piso com brilho frio */
  var pf=c.createLinearGradient(0,560,0,720);
  pf.addColorStop(0,'#241c2e');pf.addColorStop(1,'#120e18');
  c.fillStyle=pf;c.beginPath();c.moveTo(430,560);c.lineTo(850,560);c.lineTo(1280,720);c.lineTo(0,720);c.closePath();c.fill();
  /* A LUZ pálida ao fundo */
  var lg2=c.createRadialGradient(640,300,6,640,320,300);
  lg2.addColorStop(0,'rgba(214,226,232,.5)');lg2.addColorStop(.4,'rgba(160,170,200,.14)');lg2.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=lg2;c.fillRect(0,0,1280,720);
  c.fillStyle='rgba(226,236,240,.75)';
  c.beginPath();c.ellipse(640,306,26,38,0,0,6.2832);c.fill();
  return cv;
}
/* ============================================================
   A PÁGINA ESCURA (momento 4→5) — quase toda escuridão desenhada
   com a margem à esquerda onde a marca de tinta vai aparecer.
   ============================================================ */
function paintDarkPage(){
  var cv=mkCv(1280,720),c=cv.getContext('2d');
  var g=c.createLinearGradient(0,0,1280,720);
  g.addColorStop(0,'#161009');g.addColorStop(.4,'#0d0906');g.addColorStop(1,'#060403');
  c.fillStyle=g;c.fillRect(0,0,1280,720);
  /* papel ainda presente nas bordas — o desenho engole a página */
  var e=c.createRadialGradient(640,360,220,640,360,760);
  e.addColorStop(0,'rgba(0,0,0,0)');e.addColorStop(1,'rgba(58,36,16,.5)');
  c.fillStyle=e;c.fillRect(0,0,1280,720);
  /* corredor desenhado a traços (ainda gravura) */
  c.strokeStyle='rgba(150,130,100,.3)';c.lineWidth=2;
  c.beginPath();c.moveTo(430,130);c.lineTo(470,190);c.lineTo(470,560);c.lineTo(430,640);c.stroke();
  c.beginPath();c.moveTo(850,130);c.lineTo(810,190);c.lineTo(810,560);c.lineTo(850,640);c.stroke();
  c.strokeStyle='rgba(160,140,105,.22)';
  for(var i=1;i<5;i++){var y=190+i*92;c.beginPath();c.moveTo(470,y);c.lineTo(810,y);c.stroke();}
  return cv;
}
/* a mini-ilustração do REGISTRO (momento 3): Thor de pé diante
   da passagem, na página direita do livro */
function paintMiniScene(){
  var cv=mkCv(360,240),c=cv.getContext('2d');
  var g=c.createLinearGradient(0,0,360,240);
  g.addColorStop(0,'#c8b489');g.addColorStop(1,'#a8956a');
  c.fillStyle=g;c.fillRect(0,0,360,240);
  for(var i=0;i<40;i++){c.fillStyle='rgba(92,58,24,'+R(.03,.09)+')';
    c.beginPath();c.ellipse(R(0,360),R(0,240),R(6,26),R(4,14),0,0,6.2832);c.fill();}
  /* a passagem desenhada */
  c.strokeStyle=INK;c.lineWidth=2.4;
  c.beginPath();c.moveTo(214,196);c.lineTo(226,116);c.lineTo(268,96);c.lineTo(310,118);c.lineTo(318,196);c.closePath();c.stroke();
  c.fillStyle='rgba(24,13,6,.92)';c.fill();
  hatch(c,214,96,104,26,4,.4,.4);
  /* chão de cinza a tinta */
  hatch(c,0,196,360,44,6,.2,.22);
  c.strokeStyle=INK;c.lineWidth=1.6;
  c.beginPath();c.moveTo(0,196);c.lineTo(360,192);c.stroke();
  /* THOR de pé diante da passagem (pequeno) */
  drawThor(c,150,196,.9,{curl:0,stand:1,head:.6,lookX:1},1);
  /* rubrica antiga ao lado */
  c.font='italic 15px "IM Fell English SC", Georgia, serif';c.fillStyle=INK2;
  c.fillText('ele se levanta',22,60);c.fillText('e o inferno espera',22,80);
  return cv;
}
/* vinheta + grão (por cima de tudo, blit barato) */
function paintVignette(){
  var cv=mkCv(1280,720),c=cv.getContext('2d');
  var g=c.createRadialGradient(640,360,240,640,360,780);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.72,'rgba(2,1,1,.42)');g.addColorStop(1,'rgba(1,0,0,.9)');
  c.fillStyle=g;c.fillRect(0,0,1280,720);return cv;
}
function paintGrain(){
  var cv=mkCv(640,360),c=cv.getContext('2d');
  for(var i=0;i<1000;i++){c.fillStyle='rgba(255,244,220,'+R(.015,.05)+')';c.fillRect(R(0,640),R(0,360),1,1);}
  return cv;
}

/* ============================================================
   A CONSTRUÇÃO — todos os recursos nascem UMA vez no play()
   (pré-renderizados: por quadro só há blits + câmera + Thor)
   ============================================================ */
var DR=null,TN=null; /* drone grave / tom frio */
function buildAssets(){
  A.eyeGlow=mkGlow(18,'rgba(244,248,245,.8)'); /* nasce PRIMEIRO: a prancha já usa os olhos */
  A.plate=paintPlate();
  A.pageL=paintPageSlice(A.plate,0,'L');
  A.pageR=paintPageSlice(A.plate,652,'R');
  try{A.pageLurl=A.pageL.toDataURL('image/png');A.pageRurl=A.pageR.toDataURL('image/png');}catch(e){A.pageLurl='';A.pageRurl='';}
  A.ground=paintGround();
  A.corridor=paintCorridor();
  A.dark=paintDarkPage();
  A.smoke=mkPuff(160,'rgba(30,18,8,.5)');
  A.mist=mkPuff(220,'rgba(212,192,150,.20)');
  A.wisp=mkPuff(200,'rgba(60,45,30,.16)');
  A.glow=mkGlow(120,'rgba(255,196,120,.5)');
  A.cglow=mkGlow(160,'rgba(200,220,235,.5)');
  A.mini=paintMiniScene();
  A.mock=paintBookMock();
  A.vig=paintVignette();
  A.grain=paintGrain();
  A.f1=mkText('Toda queda tem um começo.',27,'rgba(46,28,14,.92)',0,true);
  A.f2=mkText('Nem toda alma chega ao fim de sua jornada.',25,'rgba(46,28,14,.9)',0,true);
  A.ann=mkText('O corpo foi perdido. A vontade permaneceu.',23,'rgba(46,28,14,.95)',0,true);
  A.ann1=mkText('O corpo foi perdido.',23,'rgba(46,28,14,.95)',0,true);
  A.ann2=mkText('A vontade permaneceu.',23,'rgba(46,28,14,.95)',0,true);
  A.note=mkText('ele acordou.',22,'rgba(125,104,84,.85)',0,true);
}
function paintBookMock(){
  var cv=mkCv(1280,720),c=cv.getContext('2d');
  var g=c.createRadialGradient(640,330,60,640,360,760);
  g.addColorStop(0,'#2a1c10');g.addColorStop(.42,'#150d07');g.addColorStop(1,'#070403');
  c.fillStyle=g;c.fillRect(0,0,1280,720);
  mockPage(c,170,90,470,540);
  mockPage(c,640,90,470,540);
  /* lombada */
  var sp=c.createLinearGradient(600,0,680,0);
  sp.addColorStop(0,'rgba(20,10,4,0)');sp.addColorStop(.5,'rgba(20,10,4,.55)');sp.addColorStop(1,'rgba(20,10,4,0)');
  c.fillStyle=sp;c.fillRect(600,90,80,540);
  /* a ilustração nova na página direita */
  c.drawImage(A.mini,690,150,380,253);
  c.strokeStyle='rgba(46,28,14,.6)';c.lineWidth=2;c.strokeRect(690,150,380,253);
  /* anotações esparsas na página esquerda */
  c.strokeStyle='rgba(46,28,14,.35)';c.lineWidth=1.2;
  for(var i=0;i<7;i++){
    var ly=170+i*46;
    c.beginPath();c.moveTo(210,ly);
    for(var x=210;x<210+R(180,330);x+=22)c.lineTo(x,ly+Math.sin(x*.09+i)*2.2);
    c.stroke();
  }
  c.font='italic 19px "IM Fell English SC", Georgia, serif';c.fillStyle=INK2;
  c.fillText('folha do descido',210,120);
  return cv;
}
function mockPage(c,x,y,w,h){
  var g=c.createLinearGradient(x,y,x+w,y+h);
  g.addColorStop(0,'#c9b58a');g.addColorStop(1,'#a08c5e');
  c.fillStyle=g;c.fillRect(x,y,w,h);
  for(var i=0;i<8;i++){c.fillStyle='rgba(92,58,24,'+R(.03,.08)+')';
    c.beginPath();c.ellipse(x+R(20,w-20),y+R(20,h-20),R(10,42),R(6,22),R(0,3),0,6.2832);c.fill();}
  c.strokeStyle='rgba(40,22,8,.5)';c.lineWidth=2;c.strokeRect(x+1,y+1,w-2,h-2);
  var e=c.createLinearGradient(x,y,x+w*.25,y);
  e.addColorStop(0,'rgba(40,22,8,.3)');e.addColorStop(1,'rgba(40,22,8,0)');
  c.fillStyle=e;c.fillRect(x,y,w,h);
}
function drawBlot(c,x,y,a){
  c.save();c.globalAlpha=a;
  c.fillStyle='rgba(24,12,6,.9)';
  c.beginPath();c.ellipse(x,y,7,5.4,.3,0,6.2832);c.fill();
  c.beginPath();c.ellipse(x+9,y+7,3,2.2,.5,0,6.2832);c.fill();
  c.strokeStyle='rgba(24,12,6,.7)';c.lineWidth=1.6;
  c.beginPath();c.moveTo(x+2,y+5);c.quadraticCurveTo(x+4,y+18,x+1,y+30);c.stroke();
  c.restore();
}
/* câmera do palco */
function camOn(c,fx,fy,z){c.translate(SW/2,SH/2);c.scale(z,z);c.translate(-fx,-fy);}

/* ============ FASES ============ */
function buildPhases(){
  PH=[
  /* ---- 0 · O ABISMO (a tinta deixa de ser tinta) ---- */
  {n:'abismo',d:3.2,
    enter:function(){sWind(2.4,.02,260);},
    draw:function(c,t){
      var p=easeI(clamp((t-.45)/(this.d-.45),0,1));
      var z0=1305/628,z1=z0*1.8;
      var fx=lerp(314,178,p),fy=lerp(376,505,p),z=lerp(z0,z1,p);
      c.fillStyle='#0a0705';c.fillRect(0,0,SW,SH);
      c.save();camOn(c,fx,fy,z);
      c.drawImage(A.pageR,0,0);
      /* névoa viva na garganta */
      var m=Math.sin(C.gt*.5);
      c.globalAlpha=.5;var pw2=170;
      c.drawImage(A.mist,240+m*30,430+Math.sin(C.gt*.34)*18,pw2*1.6,pw2*.8);
      c.drawImage(A.mist,430-m*40,560,pw2*1.3,pw2*.65);
      c.globalAlpha=1;
      /* bordas da página escurecendo */
      var e=clamp(p*1.4,0,1);
      var gl=c.createLinearGradient(0,0,240,0);
      gl.addColorStop(0,'rgba(4,2,1,'+(.55*e)+')');gl.addColorStop(1,'rgba(4,2,1,0)');
      c.fillStyle=gl;c.fillRect(-500,-800,740,2400);
      var gr=c.createLinearGradient(628,0,388,0);
      gr.addColorStop(0,'rgba(4,2,1,'+(.55*e)+')');gr.addColorStop(1,'rgba(4,2,1,0)');
      c.fillStyle=gr;c.fillRect(628-240,-800,740,2400);
      c.restore();
      if(t>1.9){c.globalAlpha=clamp((t-1.9)/.8,0,1);c.drawImage(A.f1,84,634);c.globalAlpha=1;}
    }},
  /* ---- 1 · A DESCIDA (o inferno registrado) ---- */
  {n:'descida',d:7.2,
    enter:function(){
      DR=makeDrone(47,47.7,240);if(DR)DR.to(.045,3);
      sSweep(1.8,.018,700,240);
    },
    draw:function(c,t){
      var d=this.d;
      var q=easeIO(clamp(t/.8,0,1));
      var p1=easeIO(clamp(t/(d*.55),0,1));
      var p2=easeIO(clamp((t-d*.55)/(d*.45),0,1));
      var fx=lerp(830,640,p1),fy=lerp(540,1060,p1);
      fx=lerp(fx,700,p2);fy=lerp(fy,1850,p2);
      var z=lerp(1305/628,1.5,p1);z=lerp(z,2.05,p2);
      c.fillStyle='#0a0705';c.fillRect(0,0,SW,SH);
      c.save();camOn(c,fx,fy,z);
      c.drawImage(A.plate,0,0);
      /* nuvens/vento no alto */
      var w1=Math.sin(C.gt*.22);
      c.globalAlpha=.55;
      c.drawImage(A.wisp,240+w1*60,90,340,150);
      c.drawImage(A.wisp,760-w1*50,240,300,130);
      /* fumaça subindo das gargantas */
      for(var i2=0;i2<3;i2++){
        var sx=[300,950,560][i2],sy=[850,1150,1480][i2];
        var ph=(C.gt*.16+i2*.37)%1;
        c.globalAlpha=.3*(1-ph);
        var ss=90+ph*130;
        c.drawImage(A.smoke,sx-ss/2+Math.sin(C.gt*.7+i2*2)*22,sy-ph*160-ss/2,ss,ss);
      }
      /* silhuetas atravessando os caminhos */
      c.fillStyle='rgba(30,17,8,.85)';
      var wA=(C.gt*.055)%1;
      c.fillRect(lerp(300,980,wA),lerp(830,860,wA)-6,4,7);
      var wB=(C.gt*.04+ .5)%1;
      c.fillRect(lerp(1180,210,wB),lerp(1030,1060,wB)-6,4,7);
      /* forma distante sumindo atrás da fumaça */
      c.globalAlpha=.4+.3*Math.sin(C.gt*.4);
      c.fillRect(1046,1176,10,16);
      c.globalAlpha=1;
      c.restore();
      if(t>3.2){c.globalAlpha=clamp((t-3.2)/.9,0,1);c.drawImage(A.f2,SW-A.f2.width-70,96);c.globalAlpha=1;}
    }},
  /* ---- 2 · THOR (o despertar pesado) ---- */
  {n:'thor',d:9.4,
    enter:function(){this._st=0;},
    draw:function(c,t){
      var d=this.d,q=easeIO(clamp(t/.8,0,1)); /* prancha → chão */
      var zz=lerp(2.05,1.9,clamp(t/4,0,1));
      zz=lerp(zz,1.42,clamp((t-6)/3.4,0,1));
      var fxx=lerp(700,640,q),fyy=lerp(510,470,clamp((t-6)/3.4,0,1));
      c.fillStyle='#080609';c.fillRect(0,0,SW,SH);
      /* camada de transição: o último quadro da prancha */
      if(q<1){c.save();camOn(c,700,1850,2.05);c.globalAlpha=1-q;c.drawImage(A.plate,0,0);c.restore();}
      /* o chão */
      c.save();camOn(c,fxx,fyy,zz);
      c.globalAlpha=q;
      c.drawImage(A.ground.back,0,0);
      /* a passagem surge ao fundo */
      var pa=clamp((t-7.6)/1.4,0,1);
      if(pa>0){
        c.globalAlpha=q*pa;
        c.drawImage(A.glow,666-90,266-70,180,140);
        c.strokeStyle='rgba(150,132,150,.9)';c.lineWidth=3;
        c.beginPath();c.moveTo(600,318);c.lineTo(614,238);c.lineTo(668,214);c.lineTo(722,240);c.lineTo(732,318);c.closePath();c.stroke();
        c.fillStyle='rgba(5,3,8,.96)';c.fill();
      }
      c.drawImage(A.ground.front,0,0);
      /* poeira suspensa */
      for(var i=0;i<(lite()?4:8);i++){
        var dx=(i*173+C.gt*(6+i))%SW,dy=(i*97+Math.sin(C.gt*.4+i)*30+540)%720;
        c.fillStyle='rgba(190,180,190,.10)';
        c.fillRect(dx,dy,1.6,1.6);
      }
      /* THOR — a linha do tempo do despertar (MONOTÔNICA: uma vez de pé,
         fica de pé — o estado nunca regride entre os trechos) */
      var pose={curl:1,stand:0,head:.05+.04*Math.sin(C.gt*1.3),lookX:0,dip:0,tremble:false,alpha:q};
      if(t>=1.5){pose.head=Math.min(1,.05+.95*easeO(clamp((t-1.5)/1.6,0,1)));pose.tremble=(t-1.5)<.5;}
      if(t>=3.1&&t<4.3){pose.lookX=Math.sin((t-3.1)/1.2*6.2832)*.9;}
      if(t>=4.3){var st2=easeIO(clamp((t-4.3)/1.6,0,1));pose.stand=st2;pose.curl=1-st2;pose.tremble=(t-4.3)<1.5;pose.lookX=.4;}
      if(t>=5.9){pose.stand=1;pose.curl=0;}
      if(t>=5.9&&t<7.2){pose.dip=Math.sin(clamp((t-5.9)/1.3,0,1)*3.1416);}
      if(t>=8.3){pose.moving=true;pose.walk=(C.gt*1.05)%1;pose.lookX=1;pose.dip=0;
        var wp=easeIO(clamp((t-8.3)/1.1,0,1));pose._wx=wp;}
      if(t>=1.55&&t<3.15&&!this._st){this._st=1;sNamed('rumble');}
      if(t>=5.85&&!this._th){this._th=1;sNoise(.14,.05,150,'lowpass');sBlip('sine',66,40,.5,.045);}
      if(t>=7.7&&!this._ps){this._ps=1;sBlip('sine',170,110,.8,.02);sNamed('echo');}
      if(t>=8.4){var sn=Math.floor((t-8.4)/.46);if(sn>this._sn||this._sn===undefined){this._sn=sn;if(sn<5)sNoise(.07,.026,170,'lowpass');}}
      var thx=640,thy=560;
      if(pose._wx){thy=560-52*pose._wx;thx=640+22*pose._wx;}
      if(t>=7.0&&t<8.3&&DR)DR.to(.008,1.1); /* o silêncio deliberado */
      drawThor(c,thx,thy,1.62,pose,C.gt);
      c.restore();
    }},
  /* ---- 3 · O REGISTRO (a ilustração mudou) ---- */
  {n:'registro',d:4.2,
    enter:function(){sNoise(.3,.018,900,'bandpass');},
    draw:function(c,t){
      var q=easeIO(clamp(t/.8,0,1));
      var z=lerp(1.02,1.14,easeIO(clamp(t/this.d,0,1)));
      c.fillStyle='#070403';c.fillRect(0,0,SW,SH);
      c.save();camOn(c,lerp(640,780,q),360,z);
      c.globalAlpha=q;c.drawImage(A.mock,0,0);c.globalAlpha=1;
      /* a anotação se escreve — na MESMA página da ilustração, abaixo dela,
         em duas linhas (a câmera aproxima da página direita: tem de caber) */
      var wr=clamp((t-1.1)/1.7,0,1);
      if(wr>0){
        if(!this._sc&&wr>.05){this._sc=1;sNoise(.5,.016,2600,'bandpass');}
        var w1=A.ann1.width*clamp(wr*2,0,1),w2b=A.ann2.width*clamp(wr*2-.9,0,1);
        if(w1>0)c.drawImage(A.ann1,0,0,w1,A.ann1.height,688,436,w1,A.ann1.height);
        if(w2b>0)c.drawImage(A.ann2,0,0,w2b,A.ann2.height,688,468,w2b,A.ann2.height);
      }
      c.restore();
      if(q<1){c.save();camOn(c,700,1850,2.05);c.globalAlpha=(1-q)*.9;c.drawImage(A.plate,0,0);c.restore();}
    }},
  /* ---- 4 · A MARGEM (o livro percebe) ---- */
  {n:'margem',d:5.8,
    enter:function(){if(DR)DR.to(0,2.2);},
    draw:function(c,t){
      var d=this.d;
      var p=easeI(clamp(t/3.2,0,1));
      var fx=lerp(660,973,p),fy=lerp(340,308,p);
      var z=lerp(1.14,3.2,p);
      c.fillStyle='#070403';c.fillRect(0,0,SW,SH);
      c.save();camOn(c,fx,fy,z);
      c.drawImage(A.mock,0,0);
      /* Thor entra pela passagem desenhada */
      var wp=clamp((t-1.2)/2.2,0,1);
      if(wp>0&&wp<1){
        var mx=lerp(848,973,wp),my=lerp(357,318,wp);
        drawThor(c,mx,my,lerp(.95,.42,wp),{stand:1,head:.7,lookX:1,moving:true,walk:(C.gt*1.1)%1,alpha:1-wp*.25},C.gt);
      }
      /* a escuridão da entrada cresce */
      var dk=easeIO(clamp((t-2.6)/2,0,1));
      if(dk>0){
        var rg=c.createRadialGradient(973,308,30,973,308,lerp(140,920,dk));
        rg.addColorStop(0,'rgba(4,2,1,'+(.94*dk)+')');rg.addColorStop(1,'rgba(4,2,1,0)');
        c.fillStyle=rg;c.fillRect(-600,-600,2600,2000);
      }
      c.restore();
      /* a página escura assume */
      var qp=easeIO(clamp((t-3.6)/1.2,0,1));
      if(qp>0){c.globalAlpha=qp;c.drawImage(A.dark,0,0);c.globalAlpha=1;}
      /* a marca de tinta na margem — sem explicação */
      var ba=clamp((t-4.5)/.7,0,1);
      if(ba>0)drawBlot(c,152,386,ba*.9);
      var na=clamp((t-5.1)/.6,0,1);
      if(na>0){
        if(!this._ns){this._ns=1;sNoise(.5,.012,3000,'highpass');}
        c.globalAlpha=na*.55;c.drawImage(A.note,128,414);c.globalAlpha=1;
      }
      if(t>1.4&&!this._bl){this._bl=1;sBlip('sine',170,70,.3,.022);}
    }},
  /* ---- 5 · A TRAVESSIA (o desenho vira o mundo) ---- */
  {n:'travessia',d:4.8,
    enter:function(){
      TN=makeDrone(109,109.9,420);if(TN)TN.to(.02,2.5);
      sSweep(2.2,.016,240,760,'lowpass');
    },
    draw:function(c,t){
      var d=this.d;
      var q=easeIO(clamp(t/2.1,0,1));
      var z=lerp(1.0,1.12,easeIO(clamp(t/d,0,1)));
      c.fillStyle='#060404';c.fillRect(0,0,SW,SH);
      if(q<1){c.globalAlpha=1-q;c.drawImage(A.dark,0,0);c.globalAlpha=1;}
      c.save();camOn(c,640,360,z);
      c.globalAlpha=q;c.drawImage(A.corridor,0,0);c.globalAlpha=1;
      /* o brilho da luz pulsa discreto */
      c.globalAlpha=q*(.5+.12*Math.sin(C.gt*1.3));
      c.drawImage(A.cglow,640-120,300-90,240,180);
      c.globalAlpha=q;
      /* Thor de costas, indo embora — pequeno */
      var wp=clamp(t/d,0,1);
      drawThor(c,640,lerp(486,436,wp),lerp(.55,.34,wp),{back:true,walk:(C.gt*.9)%1,alpha:q*.9},C.gt);
      /* poeira fria */
      for(var i=0;i<6;i++){
        var dx=(i*211+C.gt*(4+i))%SW,dy=(i*137+C.gt*10)%720;
        c.fillStyle='rgba(200,214,222,.09)';c.fillRect(dx,dy,1.4,1.4);
      }
      c.restore();
      /* o papel desaparece */
      if(q>0){c.globalAlpha=(1-q)*.5;c.drawImage(A.grain,0,0,SW,SH);c.globalAlpha=1;}
    }},
  /* ---- 6 · O FIM (o quadro final para a ENTRADA) ---- */
  {n:'fim',d:1.3,
    enter:function(){
      sBlip('sine',58,34,1.4,.05);sNoise(1.3,.026,170,'lowpass');
      if(TN)TN.to(.012,1.6);
    },
    draw:function(c,t){
      c.drawImage(A.corridor,0,0);
      c.globalAlpha=.5+.12*Math.sin(C.gt*1.1);
      c.drawImage(A.cglow,640-120,300-90,240,180);
      c.globalAlpha=1;
    }}
  ];
  TOT=0;for(var i=0;i<PH.length;i++)TOT+=PH[i].d;
}

/* ============ loop ============ */
function tick(ts){
  C.raf=0;
  if(!C.on||!C.engaged)return;
  var dt=C.last?Math.min(.25,(ts-C.last)/1000):.016;
  C.last=ts;C.gt+=dt/(C.scf||1); /* v1.9.2: scf<1 comprime (a cena avança mais rápido que o relógio) */
  var acc=0,ph=PH[PH.length-1],lt=0;
  for(var i=0;i<PH.length;i++){
    if(C.gt<acc+PH[i].d||i===PH.length-1){ph=PH[i];lt=clamp(C.gt-acc,0,PH[i].d);break;}
    acc+=PH[i].d;
  }
  if(ph.n!==C.phase){C.phase=ph.n;try{ph.enter&&ph.enter();}catch(e){}}
  try{drawFrame(ph,lt);}catch(e){}
  if(C.gt>=TOT){finish();return;}
  C.raf=requestAnimationFrame(tick);
}
function drawFrame(ph,lt){
  var c=C.cx;if(!c)return;
  c.setTransform(C.dpr,0,0,C.dpr,0,0);
  c.fillStyle='#050303';c.fillRect(0,0,C.vw,C.vh);
  c.translate(C.ox,C.oy);c.scale(C.sc,C.sc);
  try{ph.draw(c,lt);}catch(e){}
  /* grão + vinheta (blits) */
  c.globalAlpha=.5;c.drawImage(A.grain,0,0,SW,SH);c.globalAlpha=1;
  c.drawImage(A.vig,0,0);
  /* dica discreta de skip */
  if(C.gt>2.5&&C.gt<TOT-1.5){
    c.globalAlpha=.28;
    c.font='10px "IBM Plex Mono", monospace';
    c.fillStyle='#e6dac4';c.textAlign='right';
    c.fillText('— clique para pular —',SW-26,SH-20);
    c.textAlign='left';c.globalAlpha=1;
  }
}

/* ============ ciclo de vida ============ */
function fit(){
  if(!C.cv)return;
  C.vw=window.innerWidth;C.vh=window.innerHeight;
  C.dpr=Math.min(1.1,window.devicePixelRatio||1);
  C.cv.width=Math.round(C.vw*C.dpr);C.cv.height=Math.round(C.vh*C.dpr);
  C.cv.style.width=C.vw+'px';C.cv.style.height=C.vh+'px';
  C.sc=Math.max(C.vw/SW,C.vh/SH);
  C.ox=(C.vw-SW*C.sc)/2;C.oy=(C.vh-SH*C.sc)/2;
}
function onRz(){if(C.on)fit();}
function onVis(){
  if(!C.on||!C.engaged)return;
  if(document.hidden){if(C.raf){cancelAnimationFrame(C.raf);C.raf=0;}}
  else if(!C.raf){C.last=0;C.raf=requestAnimationFrame(tick);}
}
function play(){
  if(C.on)return true;
  try{if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return false;}catch(e){}
  var menu=$('menu');if(!menu)return false;
  C.fast=cineFast();
  C.scf=SC();
  C.ended=false;C.freed=false;C.engaged=false;C.phase='-';C.gt=0;C.idx=-1;
  try{buildAssets();}catch(e){return false;}
  buildPhases();
  var cv=document.createElement('canvas');cv.id='cineCv';
  menu.appendChild(cv);
  C.cv=cv;C.cx=cv.getContext('2d');
  fit();
  C.on=true;C.startedAt=performance.now();
  window.addEventListener('resize',onRz);
  document.addEventListener('visibilitychange',onVis);
  if(C.wd)clearInterval(C.wd);
  C.wd=setInterval(function(){
    if(!C.on){clearInterval(C.wd);C.wd=0;return;}
    if(document.hidden)return;
    if(performance.now()-C.startedAt>(TOT*(C.scf||1)+26)*1000){try{finish();}catch(e){}}
  },5000);
  try{localStorage.setItem('thorCineSeen','1');}catch(e){}
  return true;
}
function engage(){
  if(!C.cv||C.engaged)return;
  C.engaged=true;
  try{
    C.cv.style.transition='opacity .9s ease-out';
    C.cv.style.opacity='1';
  }catch(e){}
  C.last=0;C.raf=requestAnimationFrame(tick);
}
function pageArt(){return {L:A.pageLurl||'',R:A.pageRurl||''};}
function stopEngine(){
  if(C.raf){cancelAnimationFrame(C.raf);C.raf=0;}
  if(C.wd){clearInterval(C.wd);C.wd=0;}
  killDrone(DR);DR=null;killDrone(TN);TN=null;
  window.removeEventListener('resize',onRz);
  document.removeEventListener('visibilitychange',onVis);
}
function finish(){
  if(!C.on||C.ended)return;
  C.ended=true;C.on=false;
  stopEngine(); /* o loop MORRE — o último quadro fica no canvas */
  try{window.__BOOK&&__BOOK.onCineEnd&&__BOOK.onCineEnd();}catch(e){
    try{if(C.cv)C.cv.style.opacity='0';}catch(e2){}
  }
}
function abort(){
  if(!C.on)return;
  C.on=false;C.engaged=false;
  stopEngine();
  var cv=C.cv;C.cv=null;C.cx=null;
  if(cv){
    try{cv.style.transition='opacity .45s ease-out';cv.style.opacity='0';}catch(e){}
    setTimeout(function(){try{cv.parentNode&&cv.parentNode.removeChild(cv);}catch(e){}},520);
  }
  A={};C.freed=true;
}
function release(){
  var cv=C.cv;C.cv=null;C.cx=null;
  if(!cv){A={};return;}
  try{cv.style.transition='opacity .42s ease-out';cv.style.opacity='0';}catch(e){}
  setTimeout(function(){try{cv.parentNode&&cv.parentNode.removeChild(cv);}catch(e){}A={};C.freed=true;},470);
}

/* ============ API ============ */
window.__CINE={
  version:'0.64.0',
  play:function(){return play();},
  engage:function(){engage();},
  abort:function(){abort();},
  release:function(){release();},
  pageArt:function(){return pageArt();},
  wanted:function(){
    try{if(localStorage.getItem('thorCineSeen')==='1')return false;}catch(e){return false;}
    var a='full';
    try{a=(window.__BOOK&&__BOOK.state&&__BOOK.state().anim)||'full';}catch(e){}
    if(a==='off')return false;
    return true;
  },
  active:function(){return C.on;},
  state:function(){
    return {on:C.on,engaged:C.engaged,phase:C.phase,t:+C.gt.toFixed(2),tot:+TOT.toFixed(2),
            ended:C.ended,fast:C.fast,canvas:!!C.cv};
  }
};
})();
