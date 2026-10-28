/* ============================================================
   THOR REVENGE — mods.js v5 (v1.8.0 "A MÁQUINA DAS ALMAS")
   ============================================================
   EDITOR DE MODS INTEGRADO AO JOGO — o conceito pedido:
   · GERENCIADOR DE MODS: criar/ativar/desativar/exportar/importar.
     Nada sobrescreve os arquivos originais — cada mod vive no
     localStorage e viaja como JSON.
   · EDITOR DE BALAS: forma, tamanho, cor, alpha, brilho, rastro,
     rotação e velocidade — com pré-visualização ao vivo (bala voando
     + GALERIA DOS 8 FORMATOS com o estilo atual). As balas do jogo
     mudam na hora quando o mod está ATIVADO.
   · EDITOR DE PADRÕES: desenhe a formação com o mouse (ou use
     espiral/anel/estrela/onda) e ajuste quantidade, velocidade,
     escala, rotação e cor.
   · PADRÕES DOS BOSSES (v1.7.1): o catálogo REAL dos padrões dos 4
     senhores — como cada um funciona, SIMULAÇÃO com a IA verdadeira
     do jogo na ÁREA DE TESTES e SUBSTITUIÇÃO de qualquer padrão
     nativo por um padrão do seu mod.
   · BUFF/NERF (v1.7.2): sliders de VELOCIDADE das balas e CADÊNCIA
     de re-ataque POR PADRÃO REAL — testa na hora na área de testes
     e salva no mod (data.tuning 'tipo|padrão' → {sp,cd}); vale no
     jogo quando o mod está ATIVADO (ganchos: tagBullets nos atos,
     tuneFor no updateEBullets, endTune nos fins).
   · EDITOR DE SPELL CARDS: sequência de padrões com atraso,
     intervalo, vezes e duração — FAÇA para um senhor (substitui
     todos os ataques), SUBSTITUA UM padrão específico dele, ou use
     só na ÁREA DE TESTES. Com a lista das SPELL CARDS DO JOGO e
     preview ao vivo de cada uma.
   · EDITOR DE SPRITES: pixel a pixel, com o sprite ORIGINAL como
     referência semitransparente (opacidade ajustável, lado a lado,
     desfazer, restaurar) — e agora COMO FICA NO JOGO (v1.7.2): o
     sprite desenhado na caixa REAL do motor, sobreposto ao original
     ou lado a lado, com SALVAR E VER NO JOGO (fecha o editor com o
     mod ativo).
   · ÁREA DE TESTES (v1.7.2: TUDO na sala real): a arena clássica
     660×400 se aposentou — os TRÊS modos rodam na MESMA escala do
     jogo (sala, paredes, Thor 240/120 px/s): TESTAR MINHA SPELL,
     CRIAR/EDITAR MEU PADRÃO (parâmetros editáveis ao vivo enquanto
     a arena dispara; + NOVO PADRÃO e ABRIR NO EDITOR) e SIMULAR
     PADRÃO REAL DE CHEFE (IA verdadeira, Fase II, BUFF/NERF).
     Pausar (P), passo a passo (.), reiniciar (R).
   · FORJA DO PADRÃO (v1.7.3): a bancada do modo CRIAR/EDITAR virou
     uma FORJA completa — TIPO DE FORMAÇÃO (desenho/espiral/anel/
     estrela/onda) com MINI-DESENHO ali mesmo, INTERVALO entre vagas,
     os 8 FORMATOS DE BALA com galeria ao vivo, BALA PERSONALIZADA
     (o padrão nasce com o estilo completo da aba BALAS — forma,
     brilho, rastro, alpha, rotação) e DUPLICAR. USAR NOS INIMIGOS:
     SUBSTITUA um padrão real de qualquer senhor pelo seu, ou TORNE-O
     A SPELL CARD do senhor (vale no jogo com o mod ATIVADO) — tudo
     direto da área de testes. Os 8 formatos agora FUNCIONAM em todo
     lugar: sim, previews e no jogo real (gancho drawEBullets → b.sh).
   · MÁQUINA DE BLOCOS (v1.8.0 — o núcleo do CREATIVE MOD STUDIO): o
     VISUAL LOGIC EDITOR — monte o ataque com BLOCOS conectados, sem
     programar: DISPARAR PADRÃO, ESPERAR, GIRAR FORMAÇÃO, VELOCIDADE,
     COR, DIVIDIR BALAS, ESPERAR VIDA DO CHEFE, REPETIR SEQUÊNCIA,
     ALEATÓRIO ENTRE DOIS RAMOS, SIMULTÂNEO, USAR OUTRA MÁQUINA (blocos
     reutilizáveis entre projetos) e ENCERRAR. Cada bloco tem seus
     próprios campos (clique e ajuste). A LINHA DO TEMPO mostra o
     ataque compilado no tempo (cor por tipo de bloco) e o ponteiro
     CORRENTE corre na arena enquanto a máquina roda. RODAR NA ÁREA DE
     TESTES (com a IA real) e TORNAR A SPELL DO SENHOR — a máquina roda
     NO JOGO REAL pelo mesmo trilho das spell cards. Aninhamento real:
     REPETIR/ALEATÓRIO/SIMULTÂNEO têm filhos (listas aninhadas).
   · SIMULADOR COM JOGADOR DE TESTE (v1.8.0): o Thor da arena ganhou
     piloto automático — PARADO, LATERAL (vai-e-volta), CIRCULAR,
     ROTA (pontos clicados na arena) e REPRODUZIR (grava o SEU
     movimento e repete para comparar versões A/B do mesmo ataque).
     + SIMULAR DANO −10% para adiantar os portões de vida.
   Diagnóstico no console: __MODS_DEBUG()
   ============================================================ */
(function(){
'use strict';
if(window.__MODS)return;

/* ============ constantes ============ */
var LSKEY='thor_mods_v1';
/* catálogo de balas do jogo (a COR identifica a família no motor) */
var BULLET_KEYS=[
 {c:'#cfd8dc',n:'sombra / paredes do bruxo'},
 {c:'#e6f0f2',n:'branco-claro (bruxo)'},
 {c:'#eef2f4',n:'branco-kaizo / cometas'},
 {c:'#e8455a',n:'carrasco (carmesim)'},
 {c:'#ff2450',n:'a pá (golpe de perto)'},
 {c:'#c25a7a',n:'morcego vampiro'},
 {c:'#9d6bb5',n:'viúva (roxo)'},
 {c:'#c9a0ff',n:'bruxo (lilás)'},
 {c:'#ff4fd8',n:'magenta (erro 404 / leitura dupla)'},
 {c:'#ff8f3d',n:'golem / fogo'},
 {c:'#ff6b2d',n:'maré de magma'},
 {c:'#8f8577',n:'nuvens de cinzas'},
 {c:'#5ad0a0',n:'sinal verde (zona segura)'},
 {c:'#4ff5ff',n:'ciano (glitch)'},
 {c:'#ffcf4d',n:'amarelo (sentença)'},
 {c:'#ffd9a0',n:'pergaminho'}];
var SHAPES=[['circle','círculo'],['diamond','diamante'],['star','estrela'],['ring','anel'],['arrow','seta'],['square','quadrado'],['cross','cruz'],['oval','oval']];
/* slots de sprite que o motor troca via THOR_PNG (mesmo mapa do sprites.js) */
var TYPE2SLOT={rk:'velho-rei',rkm:'espelho',e404:'erro-404',mb:'bruxo',ex:'carrasco',vi:'viuva',gz:'golem',cw1:'cavaleiro-branco',cw2:'cavaleiro-vermelho',cw3:'cavaleiro-preto',cw4:'cavaleiro-descorado',observer:'observador',pn:'peao',puppy:'filhote',sh:'sombra',br:'brutamonte',sp:'cuspedor',fs:'feiticeiro',ru:'espectro-veloz',ce:'ceifador',gd:'grao-de-ossos',al:'alma-perdida',es:'espectro',la:'lamentadora',cr:'corrupiao',crs:'corrupiao-menor',vg:'vigia',pg:'peregrino',fa:'faisca-fantasma',cb:'caronte',mf:'morcego'};
var SPRITE_SLOTS=[['thor','THOR (o jogador)'],['cerbero','CÉRBERO (inteiro)'],['cerbero-cabeca','CABEÇA DO CÉRBERO'],['caronte','CARONTE'],['besta','A BESTA (tela de morte)'],['fundo','PISO das salas'],['bruxo','O BRUXO'],['carrasco','O CARRASCO'],['viuva','A VIÚVA'],['golem','O GOLEM'],['velho-rei','O VELHO REI'],['erro-404','ERRO 404'],['espelho','O ESPELHO'],['sombra','SOMBRA'],['brutamonte','BRUTAMONTE'],['cuspedor','CUSPEDOR'],['feiticeiro','FEITICEIRO'],['espectro-veloz','ESPECTRO VELOZ'],['ceifador','CEIFADOR'],['grao-de-ossos','GRÃO DE OSSOS'],['alma-perdida','ALMA PERDIDA'],['espectro','ESPECTRO'],['lamentadora','LAMENTADORA'],['corrupiao','CORRUPÇÃO'],['vigia','VIGIA'],['peregrino','PEREGRINO'],['faisca-fantasma','FAÍSCA FANTASMA'],['peao','PEÃO'],['morcego','MORCEGO FLAMEJANTE'],['observador','O OBSERVADOR'],['cavaleiro-branco','CAVALEIRO BRANCO'],['cavaleiro-vermelho','CAVALEIRO VERMELHO'],['cavaleiro-preto','CAVALEIRO PRETO'],['cavaleiro-descorado','CAVALEIRO DESCORADO']];
var EXTForms=['png','jpg','jpeg','webp','gif'];

/* ============ estado + persistência ============ */
var state=null; /* {mods:[...], activeId} */
function uid(){return 'm'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);}
/* v1.7.2: data.tuning — BUFF/NERF por padrão real: 'tipo|padrão' → {sp:×velocidade, cd:×cadência}
   v1.8.0: data.logics — as MÁQUINAS DE BLOCOS (visual logic editor) */
function blankData(){return {bullets:{},patterns:{},spells:{},sprites:{},bossPats:{},tuning:{},logics:{}};}
function blankMod(name,desc){return {id:uid(),name:name||'NOVO MOD',desc:desc||'',ver:'1.0',active:false,created:Date.now(),data:blankData()};}
function save(){try{localStorage.setItem(LSKEY,JSON.stringify(state));}catch(e){}}
function load(){
  try{
    var raw=localStorage.getItem(LSKEY);
    if(raw){state=JSON.parse(raw);}
  }catch(e){state=null;}
  if(!state||!state.mods){state={mods:[],activeId:null};seedDefault();}
  sanitize();
}
function sanitize(){
  var changed=false;
  state.mods.forEach(function(m){
    if(!m.data){m.data=blankData();changed=true;}
    ['bullets','patterns','spells','sprites','bossPats','tuning','logics'].forEach(function(k){if(!m.data[k]){m.data[k]={};changed=true;}});
  });
  if(state.activeId&&!state.mods.some(function(m){return m.id===state.activeId;})){state.activeId=null;changed=true;}
  if(changed)save();
}
/* o mod de criação que JÁ VEM com o jogo (inativo até você ativar) */
function seedDefault(){
  var m=blankMod('CRIAÇÃO','o mod de criação que vem com o jogo — renomeie, edite e torne-o seu');
  m.name='CRIAÇÃO';
  m.data.patterns['espiral-exemplo']={id:'espiral-exemplo',name:'espiral exemplo',kind:'spiral',count:14,speed:150,spin:2.2,size:5,color:'#c9a0ff'};
  m.data.patterns['anel-exemplo']={id:'anel-exemplo',name:'anel exemplo',kind:'ring',count:20,speed:130,spin:0,size:5,color:'#e8455a'};
  m.data.spells['carta-exemplo']={id:'carta-exemplo',name:'A CARTA DE EXEMPLO',owner:'O ESTUDIOSO',diff:'★☆☆ — treino',bind:'none',
    phases:[{pattern:'espiral-exemplo',delay:.3,interval:.5,times:4,dur:.4},{pattern:'anel-exemplo',delay:.2,interval:.9,times:2,dur:.5}]};
  /* v1.8.0: a MÁQUINA DE EXEMPLO — a sequência pedida no conceito:
     iniciar ataque → espiral → esperar → aumentar a velocidade → girar
     → dividir as balas → anel → encerrar */
  m.data.logics['maquina-exemplo']={id:'maquina-exemplo',name:'A MÁQUINA DE EXEMPLO',steps:[
    {t:'fire',pat:'espiral-exemplo',times:3,interval:.45,at:'player'},
    {t:'wait',dur:.8},
    {t:'speed',mul:1.6},
    {t:'spin',deg:18,rate:26,dur:1.2},
    {t:'split',n:3,delay:.5,spread:.45},
    {t:'fire',pat:'anel-exemplo',times:2,interval:.9,at:'player'},
    {t:'wait',dur:.6},
    {t:'end'}]};
  state.mods.push(m);save();
}
function activeMod(){for(var i=0;i<state.mods.length;i++)if(state.mods[i].id===state.activeId&&state.mods[i].active)return state.mods[i];return null;}
function workMod(){ /* v1.9.1: o editor interno saiu do jogo — o "mod aberto"
  agora É o mod ATIVO (quem edita é o studio externo, mod-studio.html) */
  return activeMod();
}
function selMod(){var m=workMod();return m;}

/* ============ API pública (ganchos do game.js) ============ */
var MODS={
  on:function(){var m=activeMod();return !!(m&&m.active);},
  speedFor:function(c){
    var m=activeMod();if(!m)return 1;
    var st=m.data.bullets[c];if(!st||!st.speed)return 1;
    var v=parseFloat(st.speed);return isFinite(v)&&v>0?v:1;
  },
  hasBullet:function(c){
    var m=activeMod();if(!m)return false;
    return !!m.data.bullets[c];
  },
  /* v1.7.2: BUFF/NERF por padrão real — tuning do mod ATIVO: 'tipo|padrão' → {sp,cd}
     sp = ×velocidade das balas que o padrão soltou · cd = ×cadência do re-ataque */
  tuneFor:function(type,pat){
    var m=activeMod();if(!m||!m.data.tuning)return null;
    var t=m.data.tuning[type+'|'+pat];
    if(!t)return null;
    var sp=parseFloat(t.sp),cd=parseFloat(t.cd);
    return {sp:(isFinite(sp)&&sp>0)?sp:1,cd:(isFinite(cd)&&cd>0)?cd:1};
  },
  cdFor:function(type,pat){var t=this.tuneFor(type,pat);return t?t.cd:1;},
  /* v1.7.2: marca as balas que ACABARAM de nascer [from..fim) com o padrão de
     origem — chamado pelos wrappers dos atos dos senhores (e no sim) */
  tagBullets:function(arr,from,type,pat){
    if(!arr)return;
    for(var i=Math.max(0,from|0);i<arr.length;i++){var b=arr[i];if(b&&!b._tp){b._tp=pat;b._tt=type;}}
  },
  /* v1.7.2: cadência — chamado no fim de cada padrão (mbEnd/exEnd/viEnd/gzEnd) */
  endTune:function(e){
    if(!e||e.st!=='float'||typeof e.atkT!=='number'||!isFinite(e.atkT))return;
    var t=this.tuneFor(e.type,e.pat);
    if(t&&t.cd&&t.cd!==1)e.atkT=Math.max(.12,e.atkT*t.cd);
  },
  drawBullet:function(c,b){drawModBullet(c,b);},
  /* v1.7.3: os 8 FORMATOS em balas de padrões do mod (b.sh) —
     chamado pelo gancho do drawEBullets no jogo real, pelo sim e
     pelos previews. Guard typeof no chamador por segurança. */
  drawShapeBullet:function(c,b){drawShapeBullet(c,b);},
  /* v1.7.3: estilo de bala do mod ABERTO (mesmo INATIVO) — usado
     pela área de testes para prever a bala personalizada com fidelidade */
  styleFor:function(c){
    var m=activeMod()||workMod();return m&&m.data.bullets?m.data.bullets[c]||null:null;
  },
  sprite:function(slot){
    var m=activeMod();if(!m)return null;
    return m.data.sprites[slot]||null;
  },
  spellFor:function(type){
    var m=activeMod();if(!m)return null;
    for(var k in m.data.spells){var sp=m.data.spells[k];if(sp&&sp.bind===type)return sp;}
    return null;
  },
  /* v1.7.1: SUBSTITUIÇÃO — chamada pelos 4 AIs no sorteio de padrão.
     1) spell card vinculada ao chefe (todos os ataques) · 2) spell em modo
     'substituir UM padrão' · 3) padrão do mod no lugar do nativo (bossPats) */
  takeover:function(type,pat){
    var m=activeMod();if(!m)return null;
    for(var k in m.data.spells){var sp=m.data.spells[k];if(sp&&sp.bind===type)return sp;}
    for(var k2 in m.data.spells){var sp2=m.data.spells[k2];if(sp2&&sp2.mode==='replace'&&sp2.target===pat&&(!sp2.rboss||sp2.rboss===type))return sp2;}
    var pid=m.data.bossPats&&m.data.bossPats[type+'|'+pat];
    /* v1.7.3: o INTERVALO entre vagas agora vem do PRÓPRIO padrão
       (campo novo da forja) — antes era fixo .6 */
    if(pid&&m.data.patterns[pid])return {_synthetic:true,name:(m.data.patterns[pid].name||'padrão do mod').toUpperCase(),owner:'O SEU MOD',diff:'—',bind:type,phases:[{pattern:pid,delay:0,interval:(parseFloat(m.data.patterns[pid].interval)||.6),times:2,dur:.5}]};
    return null;
  },
  spellStart:function(e){return spellStartOn(e);},
  spellUpdate:function(e,dt){return spellTickOn(e,dt);},
  firePattern:function(name,x,y,baseAng,out,sizeMul){
    var m=activeMod()||selMod();if(!m)return 0;
    var pat=m.data.patterns[name];if(!pat)return 0;
    return firePatternData(pat,x,y,baseAng||0,out,sizeMul||1);
  },
  open:function(){openEditor();},
  list:function(){return state.mods;},
  reload:function(){load();}
};
window.__MODS=MODS;

/* ============ desenho de bala com estilo do mod ============ */
function shapePath(c,shape,r){
  var i,a;
  if(shape==='diamond'){c.beginPath();c.moveTo(0,-r);c.lineTo(r*.7,0);c.lineTo(0,r);c.lineTo(-r*.7,0);c.closePath();}
  else if(shape==='square'){c.beginPath();c.rect(-r*.85,-r*.85,r*1.7,r*1.7);}
  else if(shape==='oval'){c.beginPath();c.ellipse(0,0,r*.7,r*1.15,0,0,6.2832);}
  else if(shape==='star'){c.beginPath();for(i=0;i<10;i++){a=-1.5708+i*.6283;var rr=i%2?r*.45:r;c[i?'lineTo':'moveTo'](Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();}
  else if(shape==='cross'){c.beginPath();c.rect(-r*.28,-r,r*.56,r*2);c.rect(-r,-r*.28,r*2,r*.56);}
  else if(shape==='arrow'){c.beginPath();c.moveTo(0,-r*1.2);c.lineTo(r*.85,r*.8);c.lineTo(0,r*.3);c.lineTo(-r*.85,r*.8);c.closePath();}
  else if(shape==='ring'){c.beginPath();c.arc(0,0,r,0,6.2832);}
  else{c.beginPath();c.arc(0,0,r,0,6.2832);}
}
function drawModBullet(c,b){
  var m=activeMod();if(!m)return;
  var st=m.data.bullets[b.c];if(!st)return;
  var r=b.r*(parseFloat(st.size)||1);
  var col=st.color||b.c;
  var alpha=st.alpha===''||st.alpha==null?1:parseFloat(st.alpha);if(!isFinite(alpha)||alpha<=0)alpha=1;
  var spin=parseFloat(st.spin)||0;
  var rot=spin?b.x*.01+b.y*.013+game.t*spin:0;
  c.save();c.translate(b.x,b.y);
  if(st.trail){
    var va=Math.atan2(b.vy,b.vx);
    c.strokeStyle=col;c.globalAlpha=alpha*.4;c.lineWidth=r;
    c.beginPath();c.moveTo(-Math.cos(va)*r*3.2,-Math.sin(va)*r*3.2);c.lineTo(0,0);c.stroke();
  }
  if(st.glow){c.globalAlpha=alpha*.24;c.fillStyle=col;c.beginPath();c.arc(0,0,r*2.1,0,6.2832);c.fill();}
  c.rotate(rot);
  c.globalAlpha=alpha;c.fillStyle=col;
  shapePath(c,st.shape||'circle',r);
  if(st.shape==='ring'){c.lineWidth=Math.max(1.5,r*.5);c.strokeStyle=col;c.stroke();}
  else c.fill();
  if(st.shape!=='ring'){c.globalAlpha=alpha;c.fillStyle='#fff';c.beginPath();c.arc(0,0,Math.max(1,r*.35),0,6.2832);c.fill();}
  c.restore();
}

/* ============ fogo de padrão ============ */
function patternPoints(pat){
  var pts=[],i,n=Math.max(1,Math.round(pat.count||12));
  if(pat.kind==='drawn'&&pat.points&&pat.points.length){
    var src=pat.points;
    for(i=0;i<n;i++){
      var q=src[Math.floor(i*src.length/n)%src.length];
      pts.push([q[0],q[1]]);
    }
  }else if(pat.kind==='star'){
    for(i=0;i<n;i++){
      var a=-1.5708+i/n*6.2832,rr=i%2?0.45:1;
      pts.push([Math.cos(a)*rr,Math.sin(a)*rr]);
    }
  }else if(pat.kind==='wave'){
    for(i=0;i<n;i++){var u=i/(n-1)*2-1;pts.push([u,Math.sin(u*3.6)*.55]);}
  }else if(pat.kind==='spiral'){
    for(i=0;i<n;i++){var t=i/n*2.4;pts.push([Math.cos(t*3.2)*t/2.4,Math.sin(t*3.2)*t/2.4]);}
  }else{ /* ring / círculo */
    for(i=0;i<n;i++){var a2=i/n*6.2832;pts.push([Math.cos(a2),Math.sin(a2)]);}
  }
  return pts;
}
function firePatternData(pat,x,y,baseAng,out,sizeMul,over){
  var pts=patternPoints(pat);
  /* v1.8.0: a MÁQUINA pode multiplicar a VELOCIDADE (over.spd), trocar a
     COR (over.color) e GIRAR A FORMAÇÃO (over.rotExtra) das balas que
     nascem deste disparo — os 3 modificadores de bloco */
  var spd=(parseFloat(pat.speed)||150)*((over&&over.spd)||1);
  var r=(parseFloat(pat.size)||5)*(sizeMul||1);
  /* v1.7.3: BALA PERSONALIZADA — se o padrão escolheu uma bala do mod
     e o estilo ainda existe, a bala NASCE com a chave da família:
     todo desenho (jogo real, sim, previews) aplica o estilo COMPLETO
     da aba BALAS (forma, tamanho, cor, alpha, brilho, rastro, rotação) */
  var col=pat.color||'#cfd8dc';
  if(pat.bullet){
    var mb=MODS.styleFor(pat.bullet);
    if(mb)col=pat.bullet;
  }
  if(over&&over.color)col=over.color;
  /* v1.7.3: os 8 FORMATOS — a bala do padrão pode nascer com b.sh;
     só para balas SIMPLES (a bala personalizada usa o formato do estilo) */
  var sh=(pat.shape&&pat.shape!=='circle'&&!(pat.bullet&&MODS.styleFor(pat.bullet)))?pat.shape:null;
  var rot=(pat.rot!=null?pat.rot:(parseFloat(pat.spin)||0))+(over&&over.rotExtra?over.rotExtra:0);
  var fired=0;
  for(var i=0;i<pts.length;i++){
    var u=pts[i][0],v=pts[i][1];
    if(rot){var cs=Math.cos(rot),sn=Math.sin(rot);var nu=u*cs-v*sn,nv=u*sn+v*cs;u=nu;v=nv;}
    var dx=u*92,dy=v*92;
    var d=Math.hypot(dx,dy)||1;
    var vx=dx/d*spd+Math.cos(baseAng)*spd*.15,vy=dy/d*spd+Math.sin(baseAng)*spd*.15;
    var b={x:x+dx*.2,y:y+dy*.2,vx:vx,vy:vy,r:r,c:col,life:6};
    if(sh)b.sh=sh;
    if(out)out.push(b);else ebullets.push(b);
    fired++;
  }
  return fired;
}

/* ============ v1.7.3: os 8 FORMATOS em qualquer bala do mod ============
   Mesma linguagem visual do drawEBullets do jogo (rastro, halo, miolo
   branco) mas com o FORMATO escolhido — usada pelo jogo real (gancho
   com b.sh), pela área de testes e pelos previews. */
function drawShapeBullet(c,b){
  var col=b.c,r=b.r;
  c.save();c.translate(b.x,b.y);
  var a=Math.atan2(b.vy||1,b.vx||0);
  c.strokeStyle=col;c.globalAlpha=.35;c.lineWidth=r;
  c.beginPath();c.moveTo(-Math.cos(a)*r*2.2,-Math.sin(a)*r*2.2);c.lineTo(0,0);c.stroke();
  c.globalAlpha=.28;c.fillStyle=col;
  c.beginPath();c.arc(0,0,r*1.9,0,6.2832);c.fill();
  c.globalAlpha=1;c.fillStyle=col;
  shapePath(c,b.sh||'circle',r);
  if(b.sh==='ring'){c.lineWidth=Math.max(1.5,r*.5);c.strokeStyle=col;c.stroke();}
  else c.fill();
  c.fillStyle='#fff';
  c.beginPath();c.arc(0,0,Math.max(1,r*.4),0,6.2832);c.fill();
  c.restore();
}

/* ============================================================
   v1.8.0 — A MÁQUINA DAS ALMAS (VISUAL LOGIC EDITOR)
   Blocos conectados SEM programar. Cada máquina é uma árvore de
   blocos (data.logics). O interpretador roda a árvore por frames:
   REPETIR repete um corpo, ALEATÓRIO escolhe um ramo, SIMULTÂNEO
   empurra dois ramos ao mesmo tempo, USAR chama outra máquina.
   Modificadores (VELOCIDADE/COR/GIRAR/DIVIDIR) valem para os
   DISPAROS que vêm DEPOIS deles na mesma sequência — igual ao
   exemplo do conceito: espiral → esperar → acelerar → dividir → anel.
   ============================================================ */
var LG_BLOCKS=[['fire','DISPARAR PADRÃO'],['wait','ESPERAR'],['spin','GIRAR FORMAÇÃO'],['speed','VELOCIDADE DAS BALAS'],['color','COR DAS BALAS'],['split','DIVIDIR BALAS'],['hp','ESPERAR VIDA DO CHEFE'],['repeat','REPETIR SEQUÊNCIA'],['rand','ALEATÓRIO ENTRE DOIS'],['par','SIMULTÂNEO (DOIS RAMOS)'],['use','USAR OUTRA MÁQUINA'],['end','ENCERRAR ATAQUE']];
var LG_COLORS={fire:'#c9a0ff',wait:'#6a6a7a',spin:'#4ff5ff',speed:'#ffcf4d',color:'#ff4fd8',split:'#ff8f3d',hp:'#7fe08a',repeat:'#9d6bb5',rand:'#e6dac4',par:'#c25a7a',use:'#8f8577',end:'#d9465a'};
function lgNew(t){
  if(t==='fire')return {t:'fire',pat:'',times:1,interval:.4,at:'player'};
  if(t==='wait')return {t:'wait',dur:1};
  if(t==='spin')return {t:'spin',deg:0,rate:0,dur:0};
  if(t==='speed')return {t:'speed',mul:1.5};
  if(t==='color')return {t:'color',c:'#ff4fd8'};
  if(t==='split')return {t:'split',n:3,delay:.45,spread:.5};
  if(t==='hp')return {t:'hp',frac:.5};
  if(t==='repeat')return {t:'repeat',times:3,body:[]};
  if(t==='rand')return {t:'rand',a:[],b:[]};
  if(t==='par')return {t:'par',a:[],b:[]};
  if(t==='use')return {t:'use',lgId:''};
  return {t:'end'};
}
function lgFind(mod,id){return mod&&mod.data&&mod.data.logics?mod.data.logics[id]||null:null;}
/* contexto de execução — nasce no início do ataque, morre no ENCERRAR */
function lgCtx(mod,steps){
  return {mod:mod,useDepth:0,frames:[{steps:steps||[],i:-1,wait:0,gate:null,kind:'root',parent:null,reps:0,body:null}],
    timers:[],t:0,rot:0,spinRate:0,spinT:0,speedMul:1,color:null,split:null,batch:0,fired:0,lastPat:'',done:false};
}
function lgFrame(steps,kind,parent,reps){return {steps:steps||[],i:-1,wait:0,gate:null,kind:kind,parent:parent||null,reps:reps||0,body:steps||[]};}
function lgTick(ctx,e,dt){
  if(ctx.done)return;
  ctx.t+=dt;
  if(ctx.spinT>0){ctx.spinT-=dt;ctx.rot+=ctx.spinRate*dt;}
  var i;
  for(i=ctx.timers.length-1;i>=0;i--){var tm=ctx.timers[i];tm.t-=dt;if(tm.t<=0){ctx.timers.splice(i,1);try{tm.fn();}catch(err){}}}
  /* portões de vida: o frame fica parado até o chefe perder a vida pedida */
  for(i=0;i<ctx.frames.length;i++){var f0=ctx.frames[i];
    if(f0.gate&&f0.gate.hp!=null&&e&&e.maxHp>0&&e.hp/e.maxHp<=f0.gate.hp){f0.gate=null;f0.wait=0;}
  }
  var cur=ctx.frames.slice();
  for(i=0;i<cur.length;i++)lgFrameStep(ctx,e,cur[i],dt);
  ctx.frames=ctx.frames.filter(function(f){return !f._fin;});
  if(!ctx.frames.length)ctx.done=true;
  if(ctx.t>40)ctx.done=true;                 /* mesma trava de segurança das spell cards */
  if(ctx.timers.length>64)ctx.timers.length=64;
  if(ctx.frames.length>16){ctx.frames.length=1;ctx.done=true;}
}
function lgFrameStep(ctx,e,f,dt){
  if(f._fin)return;
  if(f.gate){f.wait=1e9;return;}            /* parado no portão (vida) ou esperando filho */
  if(f.wait>0){f.wait-=dt;if(f.wait>0)return;}
  f.i++;
  if(f.i>=f.steps.length){lgFinish(ctx,f);return;}
  var b=f.steps[f.i];
  if(!b||!b.t)return;
  switch(b.t){
    case 'fire':f.wait=lgFireBlock(ctx,e,b);break; /* v1.8.0: o DISPARAR OCUPA o frame pelas vagas dele (×vezes·intervalo) — a linha do tempo e o fim nunca comem uma vaga agendada */
    case 'wait':f.wait=Math.max(0,Math.min(20,parseFloat(b.dur)||0));break;
    case 'spin':ctx.rot+=(parseFloat(b.deg)||0)*Math.PI/180;
                if(b.rate){ctx.spinRate=(parseFloat(b.rate)||0)*Math.PI/180;ctx.spinT=Math.max(0,Math.min(20,parseFloat(b.dur)||0));}
                break;
    case 'speed':ctx.speedMul=Math.max(.2,Math.min(4,parseFloat(b.mul)||1));break;
    case 'color':ctx.color=b.c||null;break;
    case 'split':ctx.split={n:Math.max(2,Math.min(6,parseInt(b.n)||3)),delay:Math.max(.05,Math.min(3,parseFloat(b.delay)||.45)),spread:Math.max(.05,Math.min(2,parseFloat(b.spread)||.5))};break;
    case 'hp':f.gate={hp:Math.max(.05,Math.min(.95,parseFloat(b.frac)||.5))};f.wait=1e9;break;
    case 'repeat':{var reps=Math.max(1,Math.min(12,parseInt(b.times)||2));f.wait=1e9;
                   ctx.frames.push(lgFrame(b.body,'rep-child',f,reps));break;}
    case 'rand':{var br=Math.random()<.5?b.a:b.b;f.wait=1e9;
                 ctx.frames.push(lgFrame(br,'branch',f,0));break;}
    case 'par':f.wait=0; /* o pai SEGUE — os dois ramos correm ao mesmo tempo */
               ctx.frames.push(lgFrame(b.a,'branch',null,0));
               ctx.frames.push(lgFrame(b.b,'branch',null,0));break;
    case 'use':{var lg=lgFind(ctx.mod,b.lgId);
                if(lg&&ctx.useDepth<4){ctx.useDepth++;f.wait=1e9;
                  ctx.frames.push(lgFrame(lg.steps,'use-child',f,0));}
                break;}
    case 'end':ctx.done=true;break;
    default:break;
  }
}
function lgFinish(ctx,f){
  f._fin=true;
  if(f.parent&&!f.parent._fin){
    if(f.kind==='rep-child'){f.parent.reps--;
      if(f.parent.reps>0)ctx.frames.push(lgFrame(f.body,'rep-child',f.parent,f.parent.reps));
      else f.parent.wait=0;
    }else f.parent.wait=0;                   /* branch/rand/use: o pai continua */
    if(f.kind==='use-child')ctx.useDepth=Math.max(0,ctx.useDepth-1);
  }
}
/* DISPARAR — a vaga nasce AGORA; vagas extras (×vezes) caem no agendador e
   o frame fica OCUPADO até a última (o fim nunca come uma vaga). Retorna o
   tempo que o bloco ocupa. Os modificadores ATIVOS no momento do disparo
   valem (velocidade, cor, giro da formação) e o DIVIDIR agenda a divisão. */
function lgFireBlock(ctx,e,b){
  var m=ctx.mod,pat=m&&m.data.patterns?m.data.patterns[b.pat]:null;
  if(!pat||!e)return 0;
  var times=Math.max(1,Math.min(12,parseInt(b.times)||1));
  var itv=Math.max(.05,Math.min(3,parseFloat(b.interval)||.4));
  var base=b.at==='fixed'?(parseFloat(b.ang)||0):Math.atan2(player.y-e.y,player.x-e.x);
  var myBatch=++ctx.batch;
  for(var k=0;k<times;k++){
    if(k===0)lgFireOnce(ctx,e,pat,base,myBatch);
    else{(function(kk){ctx.timers.push({t:itv*kk,fn:function(){lgFireOnce(ctx,e,pat,base,myBatch);}});})(k);}
  }
  if(ctx.split){var sp2=ctx.split;ctx.timers.push({t:sp2.delay,fn:function(){lgSplitBullets(ctx,sp2);}});}
  try{sfx.spit();}catch(e2){}
  return (times-1)*itv;
}
function lgFireOnce(ctx,e,pat,base,batch){
  var over={spd:ctx.speedMul,rotExtra:ctx.rot};
  if(ctx.color)over.color=ctx.color;
  var n=firePatternData(pat,e.x,e.y,base,null,1,over);
  for(var i=Math.max(0,ebullets.length-n);i<ebullets.length;i++){var bb=ebullets[i];if(bb){bb._lgB=batch;if(ctx.split)bb._lgS=1;}}
  ctx.fired+=n;ctx.lastPat=pat.name||'padrão';
  return n;
}
/* DIVIDIR — cada bala do lote marca-se com _lgS ao nascer; quando o
   timer do bloco chega, cada uma vira N cópias em leque. Balas que já
   morreram simplesmente não dividem (a arena decide). */
function lgSplitBullets(ctx,sp){
  var arr=ebullets,cnt=0;
  for(var i=arr.length-1;i>=0&&cnt<160;i--){
    var b=arr[i];
    if(!b||!b._lgS||b._lgSplit)continue;
    b._lgSplit=1;
    var a0=Math.atan2(b.vy||0,b.vx||1),spd=Math.hypot(b.vx||0,b.vy||0);
    for(var k=1;k<sp.n;k++){
      var na=a0+(k-(sp.n-1)/2)*sp.spread;
      var nb={x:b.x,y:b.y,vx:Math.cos(na)*spd,vy:Math.sin(na)*spd,r:b.r,c:b.c,life:b.life!=null?b.life:6};
      if(b.sh)nb.sh=b.sh;
      arr.push(nb);cnt++;
    }
  }
}
/* o trilho das spell cards: a MÁQUINA roda NO JOGO REAL e no sim pelo
   MESMO caminho das spell cards — uma spell {_logic:true, lgId} */
function logicSpellStart(e,sp){
  /* no jogo real o mod tem de estar ATIVO (spellFor já garante); no sim
     o fallback selMod() deixa testar com o mod só aberto (mesma regra
     da v1.7.2 das spells) */
  var m=activeMod()||selMod();
  var lg=lgFind(m,sp.lgId)||{steps:[]};
  var ctx=lgCtx(m,lg.steps);
  e.data={sp:sp,lg:ctx};
  texts.push({x:e.x,y:e.y-e.r-30,txt:'MÁQUINA — '+((lg.name||sp.name||'SEM NOME').toUpperCase()),t:0,life:1.5,c:'#4ff5ff',size:12,disp:true});
  try{sfx.growl();}catch(e2){}
  return true;
}
function logicSpellTick(e,dt){
  var d=e.data,ctx=d.lg;
  if(!ctx){mbEnd(e);return;}
  lgTick(ctx,e,dt);
  if(ctx.done){d.lg=null;mbEnd(e);}
}
/* ---- LINHA DO TEMPO — compila a árvore em trechos de tempo estimados ----
   Cada bloco vira [t0,t1] com cor do tipo. REPETIR desdobra (até 12),
   ALEATÓRIO/SIMULTÂNEO medem o ramo MAIS LONGO. Portões de vida ficam
   marcados com '?' (dependem da luta). */
function lgTimeline(steps){
  var out=[];
  function walk(list,t0,depth){
    var t=t0;
    (list||[]).forEach(function(b){
      if(!b||!b.t)return;
      var d0=t;
      if(b.t==='fire'){var times=Math.max(1,Math.min(12,parseInt(b.times)||1));t+=times*(Math.max(.05,Math.min(3,parseFloat(b.interval)||.4)))*.9+.05;}
      else if(b.t==='wait')t+=Math.max(0,Math.min(20,parseFloat(b.dur)||0));
      else if(b.t==='spin')t+=Math.max(0,Math.min(20,parseFloat(b.dur)||0));
      else if(b.t==='hp')t+=1; /* estimado — marcado com ? */
      else if(b.t==='repeat'){var reps=Math.max(1,Math.min(12,parseInt(b.times)||2));
        for(var r=0;r<reps;r++){var w=walk(b.body,t,depth+1);t=w;}}
      else if(b.t==='rand'){var wa=walk(b.a,t,depth+1);var wb=walk(b.b,t,depth+1);t=Math.max(wa,wb);}
      else if(b.t==='par'){var pa=walk(b.a,t,depth+1);var pb=walk(b.b,t,depth+1);t=Math.max(pa,pb);}
      else if(b.t==='use')t+=1.5; /* estimado — marcado com ? */
      else if(b.t==='end'){out.push({t0:d0,t1:d0+.01,b:b,depth:depth});return;}
      else t+=0;
      out.push({t0:d0,t1:t,b:b,depth:depth,q:(b.t==='hp'||b.t==='use')});
    });
    return t;
  }
  walk(steps||[],0,0);
  return {segs:out,total:out.length?out[out.length-1].t1:0};
}
function lgSummary(b){
  var m=selMod();
  if(b.t==='fire'){var p=m&&m.data.patterns?m.data.patterns[b.pat]:null;var times=Math.max(1,Math.min(12,parseInt(b.times)||1));
    return 'DISPARAR “'+(p?p.name||b.pat:'?')+'” ×'+times;}
  if(b.t==='wait')return 'ESPERAR '+(parseFloat(b.dur)||0).toFixed(2)+'s';
  if(b.t==='spin')return 'GIRAR '+(parseFloat(b.deg)||0)+'°'+(b.rate?' + '+(parseFloat(b.rate)||0)+'°/s por '+(parseFloat(b.dur)||0)+'s':'');
  if(b.t==='speed')return 'VELOCIDADE ×'+(parseFloat(b.mul)||1).toFixed(2);
  if(b.t==='color')return 'COR DAS BALAS → '+((b.c||'#ffffff').toUpperCase());
  if(b.t==='split'){var n=Math.max(2,Math.min(6,parseInt(b.n)||3));return 'DIVIDIR cada bala em '+n+' (após '+(parseFloat(b.delay)||0).toFixed(2)+'s)';}
  if(b.t==='hp')return 'ESPERAR o chefe chegar a '+Math.round((parseFloat(b.frac)||.5)*100)+'% de vida';
  if(b.t==='repeat')return 'REPETIR ×'+(parseInt(b.times)||2);
  if(b.t==='rand')return 'ALEATÓRIO: ramo A ou ramo B';
  if(b.t==='par')return 'SIMULTÂNEO: dois ramos ao mesmo tempo';
  if(b.t==='use'){var lg=m&&m.data.logics?m.data.logics[b.lgId]:null;return 'USAR A MÁQUINA “'+(lg?lg.name||b.lgId:'?')+'”';}
  if(b.t==='end')return 'ENCERRAR O ATAQUE';
  return '?';
}

/* ============ spell card rodando num chefe (bind) ============ */
function spellStartOn(e){
  var sp=e._modSpell||MODS.spellFor(e.type);if(!sp)return false;
  /* v1.8.0: spell-MÁQUINA — {_logic:true, lgId} roda o VISUAL LOGIC EDITOR */
  if(sp._logic)return logicSpellStart(e,sp);
  e.data={sp:sp,pi:-1,pt:0,t:0,started:false,acc:0,fired:0,rot:0};
  texts.push({x:e.x,y:e.y-e.r-30,txt:'SPELL CARD — '+(sp.name||'SEM NOME').toUpperCase(),t:0,life:1.5,c:'#c9a0ff',size:12,disp:true});
  sfx.growl();
  return true;
}
function spellTickOn(e,dt){
  var d=e.data;if(!d||!d.sp){mbEnd(e);return;}
  /* v1.8.0: contexto da MÁQUINA — o interpretador de blocos assume o tick */
  if(d.lg){logicSpellTick(e,dt);return;}
  var sp=d.sp;
  d.t+=dt;d.pt+=dt;
  if(d.pi<0){
    d.pi=0;var p0=sp.phases&&sp.phases[0];
    if(!p0){d.wait=(d.wait||0)+dt;if(d.wait>.6){mbEnd(e);}return;}
    d.pt=-Math.max(0,parseFloat(p0.delay)||0);d.started=false;d.acc=0;d.fired=0;
  }
  var ph=sp.phases[d.pi];
  if(!ph){d.wait=(d.wait||0)+dt;if(d.wait>.6)mbEnd(e);return;}
  if(!d.started&&d.pt>=0){d.started=true;d.acc=parseFloat(ph.interval)||.5;d.fired=0;}
  if(d.started&&d.fired<(Math.round(parseFloat(ph.times))||1)){
    d.acc+=dt;
    if(d.acc>=Math.max(.05,parseFloat(ph.interval)||.5)){
      d.acc=0;d.fired++;
      /* v1.7.2: ||selMod() — na ÁREA DE TESTES a spell/padrão do mod roda
         mesmo com o mod INATIVO (o takeover no jogo real continua exigindo
         o mod ativo, então aqui o fallback só vale dentro do sim) */
      var m=activeMod()||selMod();
      var pat=m&&m.data.patterns[ph.pattern];
      if(pat){
        var ang=Math.atan2(player.y-e.y,player.x-e.x);
        d.rot+=.35;
        firePatternData(pat,e.x,e.y,ang,null,1);
        /* rotação da formação acumula entre vagas (spin do padrão) */
        pat._rot=(pat._rot||0)+(parseFloat(pat.spin)||0);
        pat.rot=pat._rot;
        sfx.spit();
      }
    }
  }else if(d.started){
    d.acc+=dt;
    if(d.acc>=Math.max(0,parseFloat(ph.dur)||0)){
      d.pi++;d.pt=0;d.started=false;d.acc=0;d.fired=0;
      var nx=sp.phases[d.pi];
      if(nx)d.pt=-Math.max(0,parseFloat(nx.delay)||0);
    }
  }
  if(d.t>40)mbEnd(e);
}
/* ============ sprites: envolve o THOR_PNG ============ */
var modImgCache={};
function modImage(slot){
  var url=MODS.sprite(slot);
  if(!url)return null;
  if(modImgCache[slot]&&modImgCache[slot].url===url)return modImgCache[slot].img;
  var im=new Image();
  im.src=url;
  modImgCache[slot]={url:url,img:im};
  return im;
}
function fitModImg(c,img,cx,cy,bw,bh,alpha){
  if(!img||!img.width)return false;
  var sc=Math.min(bw/img.width,bh/img.height);
  var w=img.width*sc,h=img.height*sc;
  c.save();c.globalAlpha=alpha==null?1:alpha;
  var ok=false;
  try{c.drawImage(img,cx-w/2,cy-h/2,w,h);ok=true;}catch(e){}
  c.restore();return ok;
}
(function wireSprites(){
  if(!window.THOR_PNG)return;
  var FIXED={drawPlayer:'thor',drawBossSprite:'cerbero',drawBossHead:'cerbero-cabeca',drawCaronte:'caronte',drawBesta:'besta',drawFloor:'fundo'};
  function slotFor(fn,a){
    if(fn==='drawEnemy'||fn==='drawParadise'){try{return TYPE2SLOT[a[1].type];}catch(e){return null;}}
    return FIXED[fn]||null;
  }
  function drawFor(fn,c,img,a){
    if(fn==='drawPlayer'){var p=a[1];return fitModImg(c,img,p.x,p.y,52,58,a[3]);}
    if(fn==='drawEnemy'||fn==='drawParadise'){var e2=a[1];return fitModImg(c,img,e2.x,e2.y,e2.r*3,e2.r*3,1);}
    if(fn==='drawBossSprite'){var bo=a[1];return fitModImg(c,img,bo.x,bo.y,bo.r*3.4,bo.r*3.4,1);}
    if(fn==='drawBossHead'){var h=a[1];return fitModImg(c,img,h.hx,h.hy,52,58,1);}
    if(fn==='drawCaronte'){var cb=a[1];return fitModImg(c,img,cb.x,cb.y,cb.r*4,cb.r*4,1);}
    if(fn==='drawBesta'){return fitModImg(c,img,a[1],a[2]-30,340,400,(a[3]&&a[3].alpha)||1);}
    if(fn==='drawFloor'){
      var rects=a[2]||[a[1]];
      for(var i=0;i<rects.length;i++){var rc=rects[i];try{c.drawImage(img,rc.x,rc.y,rc.w,rc.h);}catch(e3){}}
      return true;
    }
    return false;
  }
  ['drawPlayer','drawEnemy','drawParadise','drawBossSprite','drawBossHead','drawCaronte','drawBesta','drawFloor'].forEach(function(fn){
    var orig=window.THOR_PNG[fn];
    if(typeof orig!=='function')return;
    window.THOR_PNG[fn]=function(){
      var a=arguments;
      try{
        var m=activeMod();
        if(m&&m.active){
          var slot=slotFor(fn,a);
          if(slot){
            var img=modImage(slot);
            if(img&&img.complete&&img.width){
              if(drawFor(fn,a[0],img,a))return true;
            }
          }
        }
      }catch(e){}
      return orig.apply(null,arguments);
    };
  });
})();
/* ============ v1.7.2: ganchos de BUFF/NERF por padrão ============
   Os 8 atos dos senhores (start+update de Bruxo/Carrasco/Viúva/Golem) são
   embrulhados: cada bala que NASCE durante o padrão recebe _tp (o padrão de
   origem) e _tt (o chefe) — é isso que deixa o tuning do mod acertar SÓ as
   balas daquele padrão (velocidade no updateEBullets do motor; cadência aqui
   embaixo, nos 4 fins). Funciona no jogo real E na área de testes, porque
   ambos passam pelas mesmas funções. */
(function wireTuning(){
  function tagWrap(name){
    var orig=window[name];
    if(typeof orig!=='function')return;
    window[name]=function(){
      var l0=ebullets.length,r=orig.apply(null,arguments);
      try{var e0=arguments[0];if(e0&&window.__MODS)__MODS.tagBullets(ebullets,l0,e0.type,e0.pat);}catch(_e){}
      return r;
    };
  }
  ['mbActStart','exActStart','viStart','gzStart','mbActUpdate','exActUpdate','viUpdate','gzUpdate'].forEach(tagWrap);
  function endWrap(name){
    var orig=window[name];
    if(typeof orig!=='function')return;
    window[name]=function(){
      var r=orig.apply(null,arguments);
      try{if(window.__MODS)__MODS.endTune(arguments[0]);}catch(_e){}
      return r;
    };
  }
  ['mbEnd','exEnd','viEnd','gzEnd'].forEach(endWrap);
})();
/* ============================================================
   v1.9.2 — O GERENCIADOR (o editor de mods saiu do jogo)
   A FORJA agora mora FORA: mod-studio.html cria balas, padrões,
   máquinas de blocos e spell cards, e exporta o JSON que é
   IMPORTADO aqui. O jogo continua RODANDO os mods importados
   (ativar, desativar, excluir, exportar de volta) — e nenhum
   arquivo original do jogo é sobrescrito, como sempre.
   ============================================================ */
var ov=null,els={};
function el(tag,st,txt,cls){
  var d=document.createElement(tag);
  if(st)for(var k in st){try{d.style[k]=st[k];}catch(e){}}
  if(txt!=null)d.textContent=txt;
  if(cls)d.className=cls;
  return d;
}
function btn(label,fn,st,title){
  var b=el('button',{background:'rgba(24,18,24,.9)',border:'1px solid #4a3a5a',color:'#e6dac4',font:'600 10px "IBM Plex Mono",monospace',letterSpacing:'.1em',padding:'7px 12px',cursor:'pointer',borderRadius:'3px'},label);
  if(st)for(var k in st)b.style[k]=st[k];
  if(title)b.title=title;
  b.onclick=function(e){e.stopPropagation();try{fn&&fn(b);}catch(err){}};
  b.onmouseenter=function(){b.style.borderColor='#c9a0ff';};
  b.onmouseleave=function(){b.style.borderColor=(st&&st.border)||'#4a3a5a';};
  return b;
}
function mHead(txt,sub){
  var w=el('div',{marginBottom:'10px'});
  w.appendChild(el('div',{font:'700 15px "IM Fell English SC",serif',letterSpacing:'.24em',color:'#c9a0ff'},txt));
  if(sub)w.appendChild(el('div',{font:'10px "IBM Plex Mono",monospace',color:'#9c8f7c',marginTop:'2px',lineHeight:'1.7'},sub));
  return w;
}
function impMsg(txt,col){
  var m=els.impMsg;if(!m)return;
  m.textContent=txt;m.style.color=col||'#9c8f7c';
}
/* importação compartilhada (caixa + arquivo) — aceita PACOTE {mods:[...]}
   ou mod ÚNICO {name,data:{...}} (o formato que o STUDIO EXTERNO exporta) */
function importJSONText(txt){
  try{
    var obj=JSON.parse(txt);
    var list=obj&&obj.mods?obj.mods:(obj&&obj.data?[obj]:null);
    if(!list)throw new Error('formato não reconhecido');
    var n=0;
    list.forEach(function(m){
      if(!m||typeof m!=='object'||!m.name)return;
      var mm=blankMod(String(m.name).slice(0,40),String(m.desc||'').slice(0,120));
      if(m.data){['bullets','patterns','spells','sprites','bossPats','tuning','logics'].forEach(function(k){if(m.data[k])mm.data[k]=m.data[k];});}
      if(m.ver)mm.ver=String(m.ver).slice(0,12);
      state.mods.push(mm);n++;
    });
    if(!n)throw new Error('nenhum mod válido no JSON');
    save();renderModList();
    impMsg(n+' mod(s) importado(s) com sucesso','#7fe08a');
    try{sfx.blip?sfx.blip('sine',600,900,.16,.06):blip('sine',600,900,.16,.06);}catch(e){}
  }catch(e){
    impMsg('ERRO na importação: '+e.message,'#d9465a');
  }
}
function buildUI(){
  ov=el('div',{position:'fixed',inset:'0',zIndex:'58',display:'none',alignItems:'center',justifyContent:'center',background:'rgba(4,2,4,.78)',padding:'16px'});
  ov.id='modsPanel';
  var pan=el('div',{position:'relative',width:'min(620px,94vw)',maxHeight:'88vh',overflowY:'auto',background:'linear-gradient(160deg,rgba(22,14,20,.98),rgba(10,6,10,.99))',border:'1px solid #4a3a5a',borderRadius:'8px',padding:'18px 18px 14px',boxShadow:'0 24px 70px rgba(0,0,0,.7)'});
  pan.appendChild(mHead('O GERENCIADOR DE MODS','o editor saiu do jogo — a FORJA agora é o STUDIO EXTERNO (mod-studio.html): crie lá, exporte o JSON e IMPORTe aqui. O jogo continua rodando os mods ativados.'));
  var top=el('div',{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'12px'});
  top.appendChild(btn('ABRIR STUDIO EXTERNO',function(){
    try{
      var w=window.open('mod-studio.html','_blank');
      if(!w)impMsg('o navegador bloqueou a janela — abra mod-studio.html direto na pasta do jogo','#ffd9a0');
      else impMsg('o STUDIO EXTERNO abriu numa aba — crie lá e volte com o JSON para IMPORTAR','#c9a0ff');
    }catch(e){impMsg('abra o arquivo mod-studio.html direto na pasta do jogo','#ffd9a0');}
  },{border:'#4a3a6a',color:'#c9a0ff'}));
  top.appendChild(btn('EXPORTAR TUDO',function(){
    var a=el('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(state));a.download='thor-mods.json';document.body.appendChild(a);a.click();a.remove();
  }));
  top.appendChild(btn('FECHAR',closeEditor,{border:'#4a2430',color:'#d9465a'}));
  pan.appendChild(top);
  els.modList=el('div',{display:'flex',flexDirection:'column',gap:'8px'});els.modList.id='modsModList';
  pan.appendChild(els.modList);
  var imp=el('div',{marginTop:'14px',padding:'10px',border:'1px dashed #4a3a5a',borderRadius:'4px'});
  imp.appendChild(el('div',{font:'700 10px "IBM Plex Mono",monospace',letterSpacing:'.16em',color:'#9c8f7c',marginBottom:'6px'},'IMPORTAR (cole o JSON exportado pelo STUDIO)'));
  els.impTA=el('textarea');els.impTA.rows=3;els.impTA.id='modsImpTA';
  els.impTA.style.cssText='width:100%;box-sizing:border-box;background:rgba(8,6,8,.9);border:1px solid #3a332c;color:#9fd8ff;font:10px "IBM Plex Mono",monospace;padding:6px;border-radius:3px';
  imp.appendChild(els.impTA);
  var row=el('div',{display:'flex',gap:'8px',marginTop:'6px',alignItems:'center',flexWrap:'wrap'});
  els.impFile=el('input');els.impFile.type='file';els.impFile.accept='.json,application/json';els.impFile.style.display='none';els.impFile.id='modsImpFile';
  els.impFile.onchange=function(){
    var f=els.impFile.files&&els.impFile.files[0];if(!f)return;
    var r=new FileReader();
    r.onload=function(){els.impTA.value=String(r.result||'');importJSONText(els.impTA.value);};
    r.readAsText(f);
  };
  row.appendChild(els.impFile);
  row.appendChild(btn('ABRIR ARQUIVO…',function(){els.impFile.click();}));
  row.appendChild(btn('IMPORTAR',function(){importJSONText(els.impTA.value);},{border:'#3a5a3a',color:'#7fe08a'}));
  els.impMsg=el('span',{font:'9px "IBM Plex Mono",monospace',color:'#9c8f7c'});els.impMsg.id='modsImpMsg';
  row.appendChild(els.impMsg);
  imp.appendChild(row);
  pan.appendChild(imp);
  ov.appendChild(pan);
  ov.addEventListener('mousedown',function(e){if(e.target===ov)closeEditor();});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&ov&&ov.style.display==='flex'){e.stopPropagation();closeEditor();}
  },true);
  document.body.appendChild(ov);
}
function renderModList(){
  var L=els.modList;if(!L)return;
  L.innerHTML='';
  if(!state.mods.length){
    L.appendChild(el('div',{font:'9px "IBM Plex Mono",monospace',color:'#9c8f7c',lineHeight:'1.6',marginTop:'6px'},'nenhum mod importado ainda — abra o STUDIO EXTERNO, crie (ou deixe ele criar) e IMPORTe o JSON aqui'));
    return;
  }
  state.mods.forEach(function(m){
    var row=el('div',{display:'flex',gap:'10px',alignItems:'center',padding:'9px 12px',border:'1px solid '+(m.id===state.activeId?'#c9a0ff':'#3a332c'),borderRadius:'4px',background:m.active?'rgba(46,88,56,.22)':'rgba(18,13,18,.7)',flexWrap:'wrap'});
    var info=el('div',{flex:'1',minWidth:'150px'});
    info.appendChild(el('div',{font:'700 12px "IBM Plex Mono",monospace',color:m.active?'#7fe08a':'#e6dac4'},m.name+(m.active?'  ·  ATIVADO':'')));
    info.appendChild(el('div',{font:'9px "IBM Plex Mono",monospace',color:'#9c8f7c'},(m.desc||'sem descrição')+' · ver '+m.ver+' · '+Object.keys(m.data.bullets).length+' balas · '+Object.keys(m.data.patterns).length+' padrões · '+Object.keys(m.data.spells).length+' spells · '+Object.keys(m.data.logics).length+' máquinas · '+Object.keys(m.data.sprites).length+' sprites'));
    row.appendChild(info);
    row.appendChild(btn(m.active?'DESATIVAR':'ATIVAR',function(){
      m.active=!m.active;
      if(m.active){state.mods.forEach(function(o){if(o!==m)o.active=false;});state.activeId=m.id;}
      save();renderModList();
    },{border:m.active?'#5a2430':'#3a5a3a',color:m.active?'#d9465a':'#7fe08a'}));
    row.appendChild(btn('EXPORTAR',function(){
      var a=el('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(m));a.download=m.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.json';document.body.appendChild(a);a.click();a.remove();
    }));
    row.appendChild(btn('EXCLUIR',function(){
      if(!confirm('excluir o mod "'+m.name+'"? isso não pode ser desfeito.'))return;
      state.mods=state.mods.filter(function(o){return o!==m;});
      if(state.activeId===m.id)state.activeId=null;
      save();renderModList();
    },{border:'#5a2430',color:'#d9465a'}));
    L.appendChild(row);
  });
}
function openEditor(){
  if(!ov)buildUI();
  ov.style.display='flex';
  renderModList();
  try{sfx.blip?sfx.blip('sine',240,140,.2,.08):blip('sine',240,140,.2,.08);}catch(e){try{blip('sine',240,140,.2,.08);}catch(e2){}}
}
function closeEditor(){if(ov)ov.style.display='none';}
function toggleEditor(){if(ov&&ov.style.display==='flex')closeEditor();else openEditor();}

/* ============ boot ============ */
load();
function bindMenu(){
  var b=document.getElementById('modsBtn');
  if(b&&!b.__modsWired){b.__modsWired=1;b.addEventListener('click',function(e){e.stopPropagation();toggleEditor();});}
  setTimeout(bindMenu,1200);
}
bindMenu();
window.__MODS_TEST=function(){return null;}; /* v1.9.1: a área de testes saiu junto com o editor — quem testa é o studio externo */
window.__MODS_DEBUG=function(){
  var m=activeMod();
  return {mods:state.mods.map(function(x){return {name:x.name,active:x.active,balas:Object.keys(x.data.bullets).length,padroes:Object.keys(x.data.patterns).length,spells:Object.keys(x.data.spells).length,maquinas:Object.keys(x.data.logics).length,sprites:Object.keys(x.data.sprites).length};}),
    selecionado:m?m.name:null,ativado:MODS.on()};
};
})();
