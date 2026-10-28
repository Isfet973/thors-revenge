/* ================================================================
   THOR: REVENGE — EXPANSÃO PRÉ-v2 · v1.3.0 "O PORTÃO DO INFERNO"
   ================================================================
   Módulo 100% ADITIVO. Nada do que existe é reescrito — o módulo
   se engancha no jogo pelos mesmos pontos que as fases antigas usam:

   · CATEGORIAS ELEMENTAIS — luz, escuridão, fogo, água, gelo, vento,
     raio e terra. Cada item pode carregar 1+ elementos; o sistema
     cresce bastando acrescentar entradas (sem tocar nas funções).
   · SINERGIAS — o jogo já tem PAIR_SYN/SETS; a expansão ACREScenta
     pares novos (fogo+água, água+gelo, água+raio, vento+fogo,
     terra+gelo) e sinergias de itens específicos, com efeitos que
     rodam por frame (__EXPANSION.frame) e são registradas no grimório.
   · BÊNÇÃOS/PACTOS/ARMAS NOVAS — empurradas em UPGRADES/PACT_IDS;
     6 armas novas selecionáveis na escolha inicial.
   · PROGRESSÃO NOVA — Penumbra (2 fases) → Penumbra Infernal
     (2 fases) → CAMINHO DO PORTÃO → CÉRBERO remasterizado (3 fases,
     cutscenes de entrada e saída) → GARGANTA VULCÂNICA → CORREDOR
     AZULADO → travessia de CARONTE → LIMBO (4 fases) → JUIZ SEM
     ROSTO. Os chefes antigos continuam todos no jogo.
   · DIFICULDADES — NORMAL/HARD existentes + PUNIÇÃO, KAIZO, ABISMO
     e PENITÊNCIA, com modificadores opcionais.
   · CORREÇÕES — cutscene curta (≤1s) nas portas/escadas (Thor E
     cervo), recomeçar na escola revive na escola, mensagem de morte
     que muda a cada morte (e vira "..." depois de muitas), latido
     da escola consertado (o ESPAÇO sempre soa).

   Tudo aqui usa exclusivamente ganchos expostos pelo próprio jogo
   (consts top-level compartilhados entre <script>s) — zero setTimeout.
   ================================================================ */
(function(){
'use strict';
if(window.__EXPANSION)return; /* nunca carrega duas vezes */

/* ================================================================
   0. UTILITÁRIOS — helpers próprios (nomes com prefixo x_ para
   nunca colidir com nada do jogo).
   ================================================================ */
const X={};
function x_clamp(v,a,b){return v<a?a:v>b?b:v;}
function x_dist(a,b,c,d){return Math.hypot(c-a,d-b);}
function x_ptInRoom(pad){ /* ponto aleatório dentro da sala atual */
  const rs=(game&&game.absRects)||[{x:0,y:0,w:W,h:H}];
  const rc=rs[Math.floor(Math.random()*rs.length)];
  const m=pad||40;
  return{x:x_clamp(rc.x+m+Math.random()*(rc.w-2*m),rc.x+m,rc.x+rc.w-m),
         y:x_clamp(rc.y+m+Math.random()*(rc.h-2*m),rc.y+m,rc.y+rc.h-m)};
}
function x_txt(t,x,y,size,c,align){try{txt(t,x,y,MONO,size,c,align||'center',4);}catch(e){}
 /* v1.3.3: o aviso TAMBÉM vira texto flutuante do jogo (antes durava 1 frame) */
 try{texts.push({x:x,y:y,txt:t,t:0,life:1.4,c:c,size:size||10,disp:true});}catch(e){}}
function x_sparks(x,y,c,n,spd,life,size){try{sparks(x,y,c,n,spd,life,size,true);}catch(e){}}
function x_dmgEnemy(e,dmg,fx){ /* dano respeitando invulnerabilidades do jogo */
  try{
    if(!e||e.dead||shadowInvuln(e))return false;
    e.hp-=dmg;e.flash=.12;
    if(fx)x_sparks(e.x,e.y,fx,4,140,.35,2.5);
    if(e.hp<=0)killEnemy(e);
    return true;
  }catch(err){return false;}
}
function x_roomClear(){return game.state==='play'&&enemies.length===0&&spawnMarks.length===0&&!boss.active;}
function x_up(id){return !!(game.up&&game.up[id]);}
function x_blessCount(){let n=0;for(const k in game.up)n+=(game.up[k]||0);return n;}

/* ================================================================
   1. CATEGORIAS ELEMENTAIS — Luz · Escuridão · Fogo · Água · Gelo ·
   Vento · Raio · Terra. Para AMPLIAR: acrescente uma chave aqui e
   (se quiser) uma especialização em SPEC_SETS. Nada mais muda.
   ================================================================ */
const ELEM={
  luz:      {c:'#ffd9a0',n:'LUZ'},
  sombra:   {c:'#9d6bb5',n:'ESCURIDÃO'},
  fogo:     {c:'#ff8f3d',n:'FOGO'},
  agua:     {c:'#7fb8ff',n:'ÁGUA'},
  gelo:     {c:'#cfe9ff',n:'GELO'},
  vento:    {c:'#bfd8e8',n:'VENTO'},
  raio:     {c:'#fff3c4',n:'RAIO'},
  terra:    {c:'#a89070',n:'TERRA'}
};
/* tags dos itens JÁ existentes (sem tocar nas entradas originais) */
const ELEM_EXTRA={
  gelo:['gelo'],presagelo:['gelo'],nova:['gelo'],estacas:['gelo','terra'],
  fogo:['fogo'],presafogo:['fogo'],explosao:['fogo'],presasismo:['terra','fogo'],
  lagrimas:['agua','gelo'],
  vento:['vento'],vendaval:['vento'],pressa:['vento'],furia:['vento','raio'],
  sede:['vento'],polvora:['fogo'],mercurio:['vento'],
  raio:['raio'],trovao:['raio'],storm:['raio'],mjolnir:['raio','terra'],iraodin:['raio','luz'],
  luz:['luz'],guarda:['luz'],onda:['luz','agua'],
  trevas:['sombra'],pesadelo:['sombra'],isolamento:['sombra'],mundo:['sombra'],mundo2:['sombra'],mundo3:['sombra'],mundo4:['sombra'],espelho:['sombra','luz'],
  sangue:['sangue','agua'],sanguepesado:['sangue','terra'],coracao:['sangue','luz'],coracaofalso:['sangue','sombra'],
  ima:['almas','luz'],pactovao:['almas','sombra'],ganancia:['almas','terra'],
  forca:['guerra','terra'],sanguefrio:['guerra','gelo'],olhogordo:['guerra','sombra'],vidro:['guerra','luz'],
  cargapedra:['terra','proj'],gross:['terra','defesa'],motoserra:['fera','fogo'],gram:['fera','fogo'],
  mjolnir2:['terra'],estrela:['luz','raio']
};
function elemsOf(u){
  if(!u)return[];
  if(u.el)return u.el;
  return ELEM_EXTRA[u.id]||[];
}
/* chips elementais para as cartas de bênção (HTML pequeno, discreto) */
function chips(u){
  const es=elemsOf(u);
  if(!es.length)return'';
  let h='<span style="display:inline-flex;gap:4px;margin-left:8px;vertical-align:middle">';
  for(const e of es){
    const d=ELEM[e];if(!d)continue;
    h+='<span title="'+d.n+'" style="width:8px;height:8px;border-radius:50%;background:'+d.c+';box-shadow:0 0 6px '+d.c+';display:inline-block"></span>';
  }
  return h+'</span>';
}

/* ================================================================
   2. NOVAS BÊNÇÃOS E PACTOS — 16 bênçãos + 11 pactos + evoluções de
   armas. Estrutura idêntica às existentes (id,q,glyph,name,max,
   desc,can,apply) — empurradas no fim da UPGRADES.
   ================================================================ */
const NOVOS_ITENS=[
/* ---------- BÊNÇÃOS ---------- */
{id:'solest',q:4,glyph:'light',el:['luz'],name:'SOL ESTILHAÇADO',max:1,
 desc:'a cada 9s, estilhaços de luz detonam ao seu redor: ferem os demônios e revelam o que está escondido perto.',
 can:function(){return!x_up('solest');},
 apply:function(){game.solest=true;game.solestT=9;}},
{id:'halopartido',q:4,glyph:'light',el:['luz','vento'],name:'HALO PARTIDO',max:1,
 desc:'a cada 4s, até 3 projéteis inimigos próximos se desfazem em fragmentos de luz que curam 2 de vida.',
 can:function(){return!x_up('halopartido');},
 apply:function(){game.halopartido=true;game.haloT=4;}},
{id:'centelha',q:4,glyph:'sky',el:['raio'],name:'ÚLTIMA CENTELHA',max:1,
 desc:'com menos de 25% de vida, sua fúria acorda: +40% cadência e um raio cai a cada 3s. só no limite.',
 can:function(){return!x_up('centelha');},
 apply:function(){game.centelha=true;game.centT=3;}},
{id:'corvazio',q:4,glyph:'dark',el:['escuridão' in ELEM?'sombra':'sombra'],name:'CORAÇÃO DO VAZIO',max:1,
 desc:'+35% de dano contra alvos ISOLADOS — o vazio recompensa quem caça sozinho.',
 can:function(){return!x_up('corvazio');},
 apply:function(){game.corvazio=true;}},
{id:'correntes',q:4,glyph:'dark',el:['sombra','terra'],name:'CORRENTES DO PECADO',max:1,
 desc:'seu golpe acorrenta o pecado: 25% do dano escorre para até 3 demônios próximos (recarga 1,2s).',
 can:function(){return!x_up('correntes');},
 apply:function(){game.correntes=true;game.corrCd=0;}},
{id:'reflexo',q:5,glyph:'dark',el:['sombra'],name:'REFLEXO QUE NÃO É SEU',max:1,
 desc:'a cada 14s, uma cópia sombria repete seu último ataque com força cheia. ela sorri de volta.',
 can:function(){return!x_up('reflexo');},
 apply:function(){game.reflexo=true;game.reflT=14;game.reflAtk=null;}},
{id:'brasa',q:3,glyph:'flame',el:['fogo'],name:'BRASA INSACIÁVEL',max:1,
 desc:'quem morre em chamas deixa o fogo faminto: a queimadura salta para até 2 vizinhos.',
 can:function(){return!x_up('brasa');},
 apply:function(){game.brasains=true;}},
{id:'lagrimasaq',q:3,glyph:'shard',el:['agua'],name:'LÁGRIMAS DO AQUERONTE',max:1,
 desc:'a cada 7s, o rio escorre por você: uma poça que desacelera quem pisar (-45%).',
 can:function(){return!x_up('lagrimasaq');},
 apply:function(){game.lagraq=true;game.laqT=7;}},
{id:'silenciog',q:4,glyph:'shard',el:['gelo'],name:'SILÊNCIO GLACIAL',max:1,
 desc:'seus golpes acumulam geada: 6 marcas congelam o demônio por 1,2s — atiradores têm o disparo engolido.',
 can:function(){return!x_up('silenciog');},
 apply:function(){game.silg=true;}},
{id:'pulmao',q:3,glyph:'wind',el:['vento'],name:'PULMÃO DO VENDAVAL',max:1,
 desc:'+12% velocidade — o vento dobra seus projéteis suavemente na direção dos demônios.',
 can:function(){return!x_up('pulmao');},
 apply:function(){P.speedMult*=1.12;game.pulmao=true;}},
{id:'nervos',q:4,glyph:'bolt',el:['raio'],name:'NERVOS DA TEMPESTADE',max:1,
 desc:'cada 6º golpe descarrega: um arco elétrico salta em 3 alvos com 60% do dano.',
 can:function(){return!x_up('nervos');},
 apply:function(){game.nervos=true;game.nervK=0;}},
{id:'cinzaspm',q:3,glyph:'blood',el:['terra'],name:'CINZAS DO PRIMEIRO MUNDO',max:1,
 desc:'resistência a empurrões; golpes de pedra (geysers, escombros) ferem 60% menos. o chão te reconhece.',
 can:function(){return!x_up('cinzaspm');},
 apply:function(){game.cinzaspm=true;}},
/* ----- 4 originais ----- */
{id:'ecosino',q:3,glyph:'light',el:['luz'],name:'ECO DA SINO',max:1,
 desc:'ao limpar uma sala, um sino dobra: cura 4 de vida e revela as bordas do mapa por um instante.',
 can:function(){return!x_up('ecosino');},
 apply:function(){game.ecosino=true;}},
{id:'pesocoroa',q:5,glyph:'crown',el:['terra','sombra'],name:'PESO DA COROA',max:1,
 desc:'+25% dano, -8% velocidade. coroas pesam — e ninguém empurra um rei.',
 can:function(){return!x_up('pesocoroa');},
 apply:function(){P.dmgMult*=1.25;P.speedMult*=.92;game.pesocoroa=true;}},
{id:'sanguedegelo',q:4,glyph:'shard',el:['gelo','agua'],name:'SANGUE DEGELO',max:1,
 desc:'congelar um demônio aquece você: +2 de vida (máx. 1 congelamento a cada 5s).',
 can:function(){return!x_up('sanguedegelo');},
 apply:function(){game.sdegelo=true;game.sdegCd=0;}},
{id:'passobrasa',q:4,glyph:'flame',el:['fogo','vento'],name:'PASSO DA BRASA',max:1,
 desc:'seu desvio deixa uma trilha em brasa que queima quem atravessar (1,2s).',
 can:function(){return!x_up('passobrasa');},
 apply:function(){game.passobrasa=true;}},
/* ---------- PACTOS — vantagem grande, preço real ---------- */
{id:'acougueiro',q:4,glyph:'fangs',el:['terra','fogo'],name:'PACTO DO AÇOUGUEIRO',max:1,
 desc:'PACTO — +55% dano e +30% alcance de mordida. corações curam METADE — e você sangra 3 de vida a cada 8s.',
 can:function(){return!x_up('acougueiro');},
 apply:function(){P.dmgMult*=1.55;P.biteRange*=1.3;game.pacAco=true;game.acoT=8;}},
{id:'horaroubada',q:4,glyph:'dark',el:['sombra','vento'],name:'PACTO DA HORA ROUBADA',max:1,
 desc:'PACTO — +35% cadência. a cada 60s, a hora é COBRADA: 6s de lentidão (você deve o tempo que usou).',
 can:function(){return!x_up('horaroubada');},
 apply:function(){P.rateMult*=1.35;game.pacHora=true;game.horaT=60;}},
{id:'barqueiro',q:4,glyph:'soulg',el:['agua'],name:'PACTO DO BARQUEIRO',max:1,
 desc:'PACTO — almas valem o DOBRO. a cada 60 almas, o pedágio: -5 de vida. o rio aceita sangue.',
 can:function(){return!x_up('barqueiro');},
 apply:function(){P.soulMult*=2;game.pacBarq=true;game.barqK=0;}},
{id:'testemunha',q:4,glyph:'eye',el:['luz'],name:'PACTO DA TESTEMUNHA',max:1,
 desc:'PACTO — +15% dano e elites não conseguem se esconder (brilham). mas ferido, ALGO acorre à cena.',
 can:function(){return!x_up('testemunha');},
 apply:function(){P.dmgMult*=1.15;game.pacTest=true;}},
{id:'falsorei',q:5,glyph:'crown',el:['sombra'],name:'PACTO DO FALSO REI',max:1,
 desc:'PACTO — +70% dano. a coroa mente: chefes andam 25% mais rápido e o trono cobra juros de sangue (-2 vida/10s).',
 can:function(){return!x_up('falsorei');},
 apply:function(){P.dmgMult*=1.7;game.pacFalsoRei=true;game.falsoT=10;}},
{id:'ultimapena',q:5,glyph:'wind',el:['vento','luz'],name:'PACTO DA ÚLTIMA PENA',max:1,
 desc:'PACTO — a 1ª morte de cada andar é desfeita (volta com 30% de vida). cada pena gasta custa -15% de dano permanente.',
 can:function(){return!x_up('ultimapena');},
 apply:function(){game.pacPena=true;game.penasUsadas=0;}},
{id:'pactodev',q:5,glyph:'burst',el:['raio','terra'],name:'PACTO DO DESENVOLVEDOR',max:1,
 desc:'PACTO — TUDO +18%. em troca, o jogo glitcha: a tela treme, erros falsos piscam e seu corpo vacila. absurdo é certo.',
 can:function(){return!x_up('pactodev');},
 apply:function(){P.dmgMult*=1.18;P.rateMult*=1.18;P.speedMult*=1.18;player.maxHp=Math.round(player.maxHp*1.18);player.hp=player.maxHp;game.pacDev=true;game.devGlT=0;}},
{id:'pacto404',q:7,glyph:'dark',el:['sombra'],name:'PACTO 404',max:1,
 desc:'PACTO SECRETO — a cada sala, um presente aleatório FORTE e uma maldição aleatória. ninguém sabe o que vem. nem o livro.',
 can:function(){return(META.e404||0)>=1&&!x_up('pacto404');},
 apply:function(){game.pac404=true;}},
{id:'divida',q:4,glyph:'soulg',el:['sombra'],name:'PACTO DA DÍVIDA INFINITA',max:1,
 desc:'PACTO — +100% de almas. ao começar cada andar, os juros: -10% da vida ATUAL. a dívida sempre cresce.',
 can:function(){return!x_up('divida');},
 apply:function(){P.soulMult*=2;game.pacDivida=true;}},
{id:'silencio',q:4,glyph:'dark',el:['sombra'],name:'PACTO DO SILÊNCIO',max:1,
 desc:'PACTO — +45% dano. o mundo fica MUDO: sons embacam e o silêncio esconde passos — inclusive OS DELE.',
 can:function(){return!x_up('silencio');},
 apply:function(){P.dmgMult*=1.45;game.pacSil=true;}},
{id:'pessimo',q:3,glyph:'soulg',el:['terra'],name:'PACTO DO PÉSSIMO NEGÓCIO',max:1,
 desc:'PACTO — tudo na loja custa METADE. cada compra desperta 2 demônios irritados. leitura de contrato: nenhuma.',
 can:function(){return!x_up('pessimo');},
 apply:function(){game.pacPessimo=true;}},
/* ---------- EVOLUÇÕES DE ARMAS NOVAS (mudam comportamento) ---------- */
{id:'absolvicao',q:4,glyph:'sword',el:['luz','terra'],name:'A ABSOLVIÇÃO',max:1,
 desc:'A SENTENÇA evolui: cada golpe deixa uma zona de juízo no chão que queima quem nela ficar.',
 can:function(){return x_up('sentenca')&&!x_up('absolvicao');},
 apply:function(){game.evoAbsol=true;}},
{id:'liturgia',q:4,glyph:'shot',el:['luz','raio'],name:'A LITURGIA',max:1,
 desc:'PISTOLAS DO ÚLTIMO PECADO evoluem: a janela perfeita alarga — e a cada 8 tiros perfeitos, um aleluia explode.',
 can:function(){return x_up('ultimopec')&&!x_up('liturgia');},
 apply:function(){game.evoLiturgia=true;}},
{id:'juros',q:4,glyph:'soulg',el:['sombra','terra'],name:'JUROS DE SANGUE',max:1,
 desc:'O CREDOR evolui: a corrente arrasta mais fundo e rouba 1 alma de cada elo. a dívida circula.',
 can:function(){return x_up('credor')&&!x_up('juros');},
 apply:function(){game.evoJuros=true;}},
{id:'sopa',q:4,glyph:'light',el:['luz'],name:'A SOPA DIVINA',max:1,
 desc:'COLHER COMICAMENTE GRANDE evolui: o raio divino a cada 13 colheradas agora salta em 3 demônios.',
 can:function(){return x_up('colher')&&!x_up('sopa');},
 apply:function(){game.evoSopa=true;}},
{id:'megalodon',q:4,glyph:'fangs',el:['agua'],name:'PEIXE APOCALÍPTICO',max:1,
 desc:'PEIXE DE GUERRA evolui: peixão, 4 quiques e respingo que machuca ao quicar. sério: é um peixe.',
 can:function(){return x_up('peixe')&&!x_up('megalodon');},
 apply:function(){game.evoMega=true;}},
{id:'layout',q:4,glyph:'burst',el:['raio'],name:'TEMPESTADE DE TECLAS',max:1,
 desc:'TECLADO DO PECADOR evolui: 10% dos disparos viram fileiras perfurantes de glifos. digite melhor.',
 can:function(){return x_up('teclado')&&!x_up('layout');},
 apply:function(){game.evoLayout=true;}}
];
try{for(const it of NOVOS_ITENS)UPGRADES.push(it);}catch(e){console.warn('[exp] upgrades',e);}
/* pactos novos entram na lista de pactos (altar, filtros e catálogo) */
try{for(const it of NOVOS_ITENS)if(it.desc.indexOf('PACTO')===0||it.desc.indexOf('PACTO SECRETO')===0)PACT_IDS.push(it.id);}catch(e){}
/* sets das armas novas + tags elementais (SET usado por PAIR_SYN/SPEC) */
try{
  UPG_SET.sentenca='guerra';UPG_SET.absolvicao='luz';
  UPG_SET.ultimopec='proj';UPG_SET.liturgia='luz';
  UPG_SET.credor='sombra';UPG_SET.juros='sombra';
  UPG_SET.colher='luz';UPG_SET.sopa='luz';
  UPG_SET.peixe='agua';UPG_SET.megalodon='agua';
  UPG_SET.teclado='raio';UPG_SET.layout='raio';
  UPG_SET.solest='luz';UPG_SET.halopartido='luz';UPG_SET.centelha='raio';UPG_SET.corvazio='sombra';
  UPG_SET.correntes='sombra';UPG_SET.reflexo='sombra';UPG_SET.brasa='fogo';UPG_SET.lagrimasaq='agua';
  UPG_SET.silenciog='gelo';UPG_SET.pulmao='vento';UPG_SET.nervos='raio';UPG_SET.cinzaspm='terra';
  UPG_SET.ecosino='luz';UPG_SET.pesocoroa='terra';UPG_SET.sanguedegelo='gelo';UPG_SET.passobrasa='fogo';
  UPG_SET.acougueiro='terra';UPG_SET.horaroubada='sombra';UPG_SET.barqueiro='agua';UPG_SET.testemunha='luz';
  UPG_SET.falsorei='sombra';UPG_SET.ultimapena='vento';UPG_SET.pactodev='raio';UPG_SET.pacto404='sombra';
  UPG_SET.divida='sombra';UPG_SET.silencio='sombra';UPG_SET.pessimo='terra';
}catch(e){}
/* especializações novas: ÁGUA e TERRA (basta existir aqui — checkSpecs varre) */
try{
  SPEC_SETS.agua={name:'COPA DO AQUERONTE',chant:'3 BÊNÇÃOS DA ÁGUA…',
    reward:'seus projéteis molham: molhados sofrem +25% de dano e conduzem o raio',
    apply:function(){game.specAgua=true;}};
  SPEC_SETS.terra={name:'OSSO DO MUNDO',chant:'3 BÊNÇÃOS DA TERRA…',
    reward:'empurrões não te movem e cada abate deixa 2 escombros que ferem quem pisar',
    apply:function(){game.specTerra=true;}};
}catch(e){}

/* ================================================================
   3. SINERGIAS — pares elementais novos + sinergias de itens.
   As de PAR entram na PAIR_SYN do jogo (banner/grimório nativos);
   os efeitos por frame rodam aqui (frameSyn). Descoberta persiste
   em META.psyn (para o grimório).
   ================================================================ */
const NOVOS_PARES=[
 {a:'fogo',b:'agua',key:'vaporesc',name:'VAPOR ESCALDANTE',sub:'fogo+água: o ar ferve — nuvens de vapor queimam quem respira perto de thor'},
 {a:'agua',b:'gelo',key:'prisaoaq',name:'PRISÃO DO AQUERONTE',sub:'água+gelo: congelados ficam PRESOS no gelo — duram mais e sofrem +30% de dano'},
 {a:'agua',b:'raio',key:'condutor',name:'CONDUTOR DOS CONDENADOS',sub:'água+raio: molhados conduzem a corrente — o raio salta em 1 alvo extra'},
 {a:'vento',b:'fogo',key:'incendioinf',name:'INCÊNDIO DO INFERNO',sub:'vento+fogo: o desvio deixa uma cortina de fogo atrás de thor'},
 {a:'terra',b:'gelo',key:'sepultura',name:'SEPULTURA GLACIAL',sub:'terra+gelo: congelado que morre explode em pedras gélidas que retardam'}
];
try{for(const p of NOVOS_PARES)PAIR_SYN.push(p);}catch(e){}
/* sinergias por ITEM específico (requisitos exatos do pedido) */
const EXP_SYN=[
 {key:'carniceiro',name:'CARNICEIRO',need:()=>x_up('garra')&&x_up('acougueiro'),
  sub:'garra de fera + açougueiro: a mordida sangra — 3 de vida por segundo por 2s'},
 {key:'madrugada',name:'MADRUGADA',need:()=>x_up('solest')&&x_up('halopartido'),
  sub:'sol estilhaçado + halo partido: a explosão de luz também desfaz projéteis em fragmentos'},
 {key:'cadeiaardente',name:'CADEIA ARDENTE',need:()=>x_up('correntes')&&x_up('brasa'),
  sub:'correntes do pecado + brasa insaciável: o dano acorrentado INFLAMA o alvo'},
 {key:'vendavalgelado',name:'VENDAVAL GELADO',need:()=>x_up('silenciog')&&x_up('pulmao'),
  sub:'silêncio glacial + pulmão do vendaval: o desvio emite um pulso de geada'},
 {key:'cobrador',name:'O COBRADOR',need:()=>x_up('corvazio')&&x_up('divida'),
  sub:'coração do vazio + dívida infinita: alvos isolados soltam o dobro de almas'},
 {key:'duplatestemunha',name:'DUPLA TESTEMUNHA',need:()=>x_up('reflexo')&&x_up('testemunha'),
  sub:'reflexo + testemunha: a cópia sombria também marcar os elites com luz'},
 {key:'parlatino',name:'TIRO PARLANTINO',need:()=>x_up('nervos')&&x_up('gemeas'),
  sub:'nervos da tempestade + pistolas gêmeas: cada projétil extra descarrega um arco'},
 {key:'maredebrasa',name:'MARÉ DE BRASA',need:()=>x_up('lagrimasaq')&&x_up('brasa'),
  sub:'lágrimas do aqueronte + brasa: as poças EVAPORAM em vapor que queima'}
];
function checkExpSyn(){
  for(const s of EXP_SYN){
    if(game.psyn[s.key])continue;
    let ok=false;try{ok=s.need();}catch(e){}
    if(!ok)continue;
    game.psyn[s.key]=1;
    META.psyn=META.psyn||{};META.psyn[s.key]=1;saveMeta();
    game.banner={type:'small',txt:'SINERGIA — '+s.name,sub:s.sub,t:0,dur:2.8};
    try{sfx.levelup();blip('sine',600,900,.25,.12);}catch(e){}
    x_sparks(player.x,player.y,'#ffd9a0',14,220,.6,3);
    conqTick();
  }
}
/* efeitos instantâneos quando a sinergia acorda (aplicados uma vez) */
function synInstant(){
  if(game.psyn.prisionaq)return;
}

/* ================================================================
   4. MENSAGENS DE MORTE — muda a cada morte (sem repetir), e depois
   de muitas mortes na sessão a besta desiste: só "...".
   ================================================================ */
const X_TAUNTS_EXTRA=[
 'O CÃO CAIU. DE NOVO.',
 'A DESCIDA TE CONHECE PELO NOME.',
 'TODAS AS VEZES IGUAIS. TODAS.',
 'NEM A PENA TE SALVA.'
];
let _xOrder=[],_xIdx=0,_xDeaths=0;
const X_DEATH_LIMIT=8; /* depois disso: "..." */
function deathPick(){
  _xDeaths++;
  if(_xDeaths>X_DEATH_LIMIT)return'...';
  if(!_xOrder.length){
    _xOrder=DEATH_TAUNTS.concat(X_TAUNTS_EXTRA).slice();
    for(let i=_xOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=_xOrder[i];_xOrder[i]=_xOrder[j];_xOrder[j]=t;}
    _xIdx=0;
  }
  const t=_xOrder[_xIdx%_xOrder.length];_xIdx++;
  return t;
}
window.__DEATH_PICK=deathPick;
window.__EXP_DEATHS=function(){return _xDeaths;};

/* ================================================================
   5. AS SEIS ARMAS NOVAS — selecionáveis na escolha inicial.
   Cada uma tem identidade própria (cadência, comportamento e
   evolução). Nada disso mexe nas armas antigas.
   ================================================================ */
const X_WEAPONS={
  sentenca:{name:'A SENTENÇA',cd:1.15,
    hint:'lâmina pesada de julgamento — lenta, larga, devastadora'},
  ultimopec:{name:'PISTOLAS DO ÚLTIMO PECADO',cd:.26,
    hint:'disparo alternado — o ritmo perfeito acelera a ira'},
  credor:{name:'O CREDOR',cd:1.5,
    hint:'chicote — esquerdo puxa o marcado · direito amarra e arremessa (até paredes)'},
  colher:{name:'COLHER COMICAMENTE GRANDE',cd:.5,
    hint:'é uma colher. comicamente grande.'}, /* v1.6.3: sem sermão — o nome já diz tudo */
  peixe:{name:'PEIXE DE GUERRA',cd:.72,
    hint:'arremesso com quiques exagerados — quica, respinga e afoga'},
  teclado:{name:'TECLADO DO PECADOR',cd:.2,
    hint:'dispara teclas — comportamento aleatório, mas CONTROLADO'}
};
/* estado de disparo por arma */
const wst={t:0,side:1,combo:0,lastShot:-9,colherK:0,fishK:0,teclaK:0,perfK:0,credor:null,forceA:null,bind:null,sweep:null,cx:null,cy:null,cxT:-9};
/* v1.3.4: CARGA DA COLHER — segurar o botão/mouse carrega a colherada */
const COLHER_CHARGE_MAX=1.15; /* segundos até a carga cheia */
wst.chg=null;          /* {t,a} enquanto segurando */
wst.colherCharge=0;    /* 0..1 consumido pela próxima colherada */
wst.chgPing=false;     /* o "CLANG" de carga cheia já tocou? */
/* trilhas/zonas persistentes das armas */
let julgZones=[];   /* ABSOLVIÇÃO */
let fogoTrail=[];   /* INCÊNDIO DO INFERNO / PASSO DA BRASA */
let poças=[];        /* LÁGRIMAS DO AQUERONTE */
let refx={t:0,active:0,x:0,y:0,ang:0,kind:null}; /* reflexo */
let correnteFx=[];  /* visual do credor */
function resetWeaponState(){wst.t=0;wst.side=1;wst.combo=0;wst.lastShot=-9;wst.colherK=0;wst.colherHits=0;wst.fishK=0;wst.teclaK=0;wst.perfK=0;wst.credor=null;wst.forceA=null;
  julgZones=[];fogoTrail=[];poças=[];refx.active=0;correnteFx=[];clearBind();wst.sweep=null;wst.cx=null;wst.cy=null;wst.anchor=null;player._whpVx=0;player._whpVy=0;player._whpImp=null;
  wst.chg=null;wst.colherCharge=0;wst.chgPing=false;colherFx=null; /* v1.3.4 */}
function isXWeapon(){return !!X_WEAPONS[game.weapon];}

/* tiro básico de projétil (mesma física das balas do jogo) */
function x_shot(x,y,ang,spd,dmg,opts){
  opts=opts||{};
  bullets.push({x:x,y:y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,r:opts.r||5,
    dmg:dmg,life:opts.life||.9,a:ang,elem:opts.elem||null,color:opts.color||'#e6dac4',
    fish:opts.fish||0,colher:opts.colher||0,tecla:opts.tecla||null,pierce:opts.pierce||0,wob:opts.wob||0,wobA:opts.wobA||0});
}
/* ---------- disparo de cada arma ---------- */
function fireWeapon(dt){
  /* v1.3.1: a recarga é decrementada no frameWeapons (roda sempre);
     aqui só o portão do cooldown */
  if(wst.t>0)return;
  const wd=X_WEAPONS[game.weapon];
  if(!wd)return;
  /* v1.3.1: o INPUT manda — ângulo imposto por clique/toque/setas; nada atira sozinho */
  const a=(wst.forceA!=null)?wst.forceA:((player.mvx||player.mvy)?Math.atan2(player.mvy,player.mvx):player.angle);
  wst.forceA=null;
  let cd=wd.cd;
  switch(game.weapon){
  case 'sentenca':{
    /* golpe pesado em arco: dano direto + visual de lâmina */
    cd=wd.cd;
    const range=150*P.reachMult,arc=1.35;
    let hit=0;
    for(const e of enemies){
      if(e.dead||e.spawnT<.5)continue;
      const d=x_dist(player.x,player.y,e.x,e.y);
      if(d>range+e.r)continue;
      let da=Math.abs(angDiff(Math.atan2(e.y-player.y,e.x-player.x),a));
      if(da>arc)continue;
      let dmg=46*P.dmgMult;
      if(x_up('corvazio')&&isIsolated(e))dmg*=1.35;
      x_dmgEnemy(e,dmg,'#ffd9a0');hit++;
      e.kb={x:Math.cos(a)*220,y:Math.sin(a)*220,t:.14}; /* empurrão */
    }
    if(hit){sfx.slash();markMeleeHit(null);}
    else sfx.throw();
    /* zona de juízo (ABSOLVIÇÃO) */
    if(game.evoAbsol)julgZones.push({x:player.x+Math.cos(a)*80,y:player.y+Math.sin(a)*80,t:0,life:1.6,r:64});
    x_sparks(player.x+Math.cos(a)*40,player.y+Math.sin(a)*40,'#ffd9a0',10,220,.4,3);
    game.meleeHitT=.16;
    break;}
  case 'ultimopec':{
    /* disparo alternado L/R — ritmo perfeito acelera */
    const now=game.t;
    const perfect=(now-wst.lastShot)<=.34+ (game.evoLiturgia?.14:0);
    if(perfect){wst.combo=Math.min(wst.combo+1,3);wst.perfK++;}else wst.combo=0;
    wst.lastShot=now;
    cd=wd.cd*(wst.combo>=1?(.78-wst.combo*.06):1);
    wst.side*=-1;
    const ox=Math.cos(a+Math.PI/2)*7*wst.side,oy=Math.sin(a+Math.PI/2)*7*wst.side;
    x_shot(player.x+ox,player.y+oy,a,880,9*P.dmgMult,{color:'#ffe9b8'});
    try{sfx.shotS();}catch(e){}
    /* aleluia a cada 8 perfeitos (LITURGIA) */
    if(game.evoLiturgia&&wst.perfK>=8){
      wst.perfK=0;
      shockwaves.push({x:player.x,y:player.y,r:22,vr:560,maxR:170,dmg:18*P.dmgMult,hit:new Set()});
      try{blip('sine',523,784,.4,.14);}catch(e){}
      x_txt('ALELUIA',player.x,player.y-40,11,'#ffe9b8');
    }
    break;}
  case 'credor':{
    /* v1.3.2: O CHICOTE DA DÍVIDA — 100% no mouse.
       ESQUERDO com inimigo perto do cursor (ou na linha do chicote): a corrente
       PRENDE e ARRASTA até a hitbox — golpe IMEDIATO e ARREMESSO (v1.3.1 intacto).
       ESQUERDO sem ninguém: o chicote ESTALA EM ÁREA (arco à frente).
       DIREITO: amarra inimigo ou objeto do mapa — arrasto físico pelo mouse. */
    if(wst.credor)break; /* uma cobrança por vez */
    if(wst.bind)break; /* o chicote está ocupado segurando a presa */
    const cfresh=(game.t-(wst.cxT||-9))<.25;
    const cx2=cfresh&&wst.cx!=null?wst.cx:player.x+Math.cos(a)*190;
    const cy2=cfresh&&wst.cy!=null?wst.cy:player.y+Math.sin(a)*190;
    const reach2=380*P.reachMult,ca2=Math.atan2(cy2-player.y,cx2-player.x);
    /* o alvo é o mais próximo do CURSOR ou da LINHA do chicote — dentro do alcance */
    let best=null,bd=132;
    for(const e of enemies){
      if(e.dead||e.spawnT<.5)continue;
      const dtc=x_dist(player.x,player.y,e.x,e.y);
      if(dtc>reach2+e.r)continue;
      const dc=x_dist(cx2,cy2,e.x,e.y);
      let dline=1e9;
      if(Math.abs(angDiff(Math.atan2(e.y-player.y,e.x-player.x),ca2))<.55)
        dline=Math.abs((e.x-player.x)*Math.sin(ca2)-(e.y-player.y)*Math.cos(ca2));
      const cost=Math.min(dc,dline+42);
      if(cost<bd){bd=cost;best=e;}
    }
    if(best){
      wst.credor={e:best,t:0};
      /* a dívida é dividida entre os presentes no momento da presa */
      for(const e of enemies){
        if(e.dead||e===best||e.spawnT<.5)continue;
        if(x_dist(best.x,best.y,e.x,e.y)<170){
          x_dmgEnemy(e,8*P.dmgMult,'#9d6bb5');
          if(game.evoJuros)gainSouls(1);
        }
      }
      correnteFx.push({x:player.x,y:player.y,tx:best.x,ty:best.y,t:0,life:.3});
      try{sfx.stake();}catch(e){}
    }else{
      /* ATAQUE EM ÁREA — o estalo do chicote corta um arco à frente */
      const range2=205*P.reachMult,arc2=1.75;let hit2=0;
      for(const e of enemies){
        if(e.dead||e.spawnT<.5)continue;
        const d2=x_dist(player.x,player.y,e.x,e.y);
        if(d2>range2+e.r)continue;
        if(Math.abs(angDiff(Math.atan2(e.y-player.y,e.x-player.x),a))>arc2)continue;
        x_dmgEnemy(e,13*P.dmgMult,'#9d6bb5');
        try{e.kb={x:Math.cos(a)*270,y:Math.sin(a)*270,t:.15};}catch(err){}
        hit2++;
      }
      wst.sweep={a:a,t:0};
      x_sparks(cx2,cy2,'#9d6bb5',9,220,.4,3);
      game.meleeHitT=.16;
      if(hit2){markMeleeHit(null);try{sfx.slash();}catch(e2){}}
      else{try{sfx.throw();}catch(e2){}}
      cd=.55; /* o estalo volta rápido */
    }
    break;}
  case 'colher':{
    /* v1.3.3: ARMA DE PERTO — a colherada arremessa quem leva LONGE.
       Sinergias: os elementos que thor carrega infundam o golpe — fogo
       queima, explosão detona, gelo congela, raio salta, água faz poça,
       vento arremessa mais longe, terra estremece, luz e escuridão cortam
       mais fundo. A cada 13 colheradas certas, O CÉU RESPONDE (A SOPA
       DIVINA faz o raio saltar em 3 demônios).
       v1.3.4: CARGA — segurar o botão/mouse carrega (até 1,15s): solta
       mais dano e ARREMESSA LONGE; inimigos de GRANDE PORTE (chefes,
       brutamontes, golem…) voam um pouco menos longe. */
    cd=wd.cd;
    const chg=wst.colherCharge||0;
    const range=(142*(1+.3*chg))*P.reachMult,arc=1.5+.45*chg;
    const syn=colherSyn();
    let hit=0;
    for(const e of enemies){
      if(e.dead||e.spawnT<.5)continue;
      const d=x_dist(player.x,player.y,e.x,e.y);
      if(d>range+e.r)continue;
      if(Math.abs(angDiff(Math.atan2(e.y-player.y,e.x-player.x),a))>arc)continue;
      let dmg=24*P.dmgMult*(1+1.5*chg)*(syn.luz?1.2:1)*(syn.sombra?1.15:1);
      if(x_up('corvazio')&&isIsolated(e))dmg*=1.35;
      x_dmgEnemy(e,dmg,syn.fogo?'#ff8f3d':syn.gelo?'#cfe9ff':'#ffe9b8');
      hit++;wst.colherHits++;
      if(!e.dead){
        /* v1.3.4: grande porte (chefes, br/gd/pg e os chefes-x) voa ~45% menos */
        const big=(e.xboss||e.r>=20)?.55:1;
        const kb=440*(1+1.35*chg)*big*(syn.vento?1.55:1);
        try{e.kb={x:Math.cos(a)*kb,y:Math.sin(a)*kb,t:.32+.1*chg};}catch(e2){}
      }
      colherSynHit(e,syn,dmg);
    }
    if(hit){
      try{sfx.slash();}catch(e2){}
      if(chg>=.99){try{noiseSfx(.22,.06,160,'lowpass');}catch(e2){}game.shake=Math.max(game.shake,6);}
      markMeleeHit(null);
      if(Math.floor(wst.colherHits/13)>Math.floor((wst.colherHits-hit)/13))colherDivina(a);
    }else{try{sfx.throw();}catch(e2){}}
    game.meleeHitT=.16;
    colherSwingFx(a,range,syn,chg);
    wst.colherCharge=0;
    break;}
  case 'peixe':{
    wst.fishK++;
    const big=game.evoMega;
    x_shot(player.x,player.y,a,540,11*P.dmgMult,{color:'#7fb8ff',fish:big?4:2,r:big?9:6});
    try{noiseSfx(.12,.05,300,'bandpass');}catch(e){}
    if(Math.random()<.25)x_txt('SPLASH!',player.x,player.y-34,10,'#7fb8ff');
    break;}
  case 'teclado':{
    wst.teclaK++;
    const KEYS=['A','S','D','W','X','Z','Q','E','F','CTRL','ESC','F5','TAB','Shift'];
    const k=pick(KEYS);
    let dmg=8*P.dmgMult;
    let opts={color:'#9fd8ff',tecla:k};
    let roll=Math.random();
    if(game.evoLayout&&roll<.10){opts.pierce=3;opts.r=6;}
    if(roll<.12&&!game.evoLayout){game.slowMoT=Math.max(game.slowMoT,.6);x_txt('[CTRL] TEMPO LENTO',player.x,player.y-40,10,'#9fd8ff');}
    else if(roll<.20&&roll>=.12){
      /* ESC apaga os 3 projéteis inimigos mais próximos */
      let n=0;
      ebullets.sort(function(p,q){return x_dist(player.x,player.y,p.x,p.y)-x_dist(player.x,player.y,q.x,q.y);});
      while(n<3&&ebullets.length){const b=ebullets.pop();x_sparks(b.x,b.y,'#9fd8ff',3,90,.3,2);n++;}
      x_txt('[ESC]',player.x,player.y-40,10,'#9fd8ff');
    }
    else if(roll<.28&&roll>=.20){x_shot(player.x,player.y,a+.14,840,dmg,opts);x_shot(player.x,player.y,a-.14,840,dmg,opts);}
    x_shot(player.x,player.y,a,840,dmg,opts);
    try{sfx.shotS();}catch(e){}
    break;}
  }
  wst.t=cd*(1/P.rateMult);
}
/* v1.3.1: O CREDOR — arrasto frame a frame, GOLPE na hitbox e ARREMESSO com
   dano de choque: o corpo voa, bate nos outros e todos se machucam */
function credorFrame(dt){
  const c=wst.credor;
  if(c){
    const e=c.e;
    if(!e||e.dead){wst.credor=null;}
    else{
      c.t+=dt;
      const d=x_dist(player.x,player.y,e.x,e.y);
      const grab=player.r+(e.r||12)+16;
      if(d>grab){
        const pa=Math.atan2(player.y-e.y,player.x-e.x);
        const sp=Math.min(d-grab,560*dt);
        e.x+=Math.cos(pa)*sp;e.y+=Math.sin(pa)*sp;
        try{e.slowT=Math.max(e.slowT,.4);}catch(err){}
        correnteFx.push({x:player.x,y:player.y,tx:e.x,ty:e.y,t:0,life:.14});
        if(c.t>1.4){wst.credor=null;try{e.slowT=Math.max(e.slowT,.8);}catch(err){}} /* falhou — solta */
      }else{
        /* CHEGOU NA HITBOX: golpe IMEDIATO + arremesso na direção de Thor */
        let dmg=20*P.dmgMult;
        if(x_up('corvazio')&&isIsolated(e))dmg*=1.35;
        x_dmgEnemy(e,dmg,'#c9a0ff');
        if(!e.dead){
          const ta=player.angle;
          e._thrown={vx:Math.cos(ta)*840,vy:Math.sin(ta)*840,t:.62,dmg:16*P.dmgMult,hits:0};
          try{e.kb={x:Math.cos(ta)*200,y:Math.sin(ta)*200,t:.12};}catch(err){}
          x_sparks(e.x,e.y,'#c9a0ff',12,260,.5,3);
          try{x_txt('DÍVIDA COBRADA',e.x,e.y-34,10,'#c9a0ff');}catch(err){}
        }
        game.meleeHitT=.16;markMeleeHit(null);
        try{sfx.slash();}catch(err){}
        wst.credor=null;
        try{wst.t=Math.min(wst.t,.5*(1/P.rateMult));}catch(err){} /* pronto cedo para a próxima cobrança */
      }
    }
  }
  /* v1.3.3: EMPURRÃO REAL — o campo e.kb (colherada, A SENTENÇA, o credor)
     agora empurra DE VERDADE: velocidade com atrito; parede segura o corpo */
  for(const e of enemies){
    if(e.dead||!e.kb||!(e.kb.t>0))continue;
    const kx2=e.kb.x,ky2=e.kb.y,ox2=e.x,oy2=e.y;
    e.x+=kx2*dt;e.y+=ky2*dt;
    try{clampArena(e,e.r||12);}catch(err){}
    if(Math.abs(e.x-ox2)<.01&&Math.abs(e.y-oy2)<.01){e.kb.t=Math.min(e.kb.t,.05);}
    const fr2=Math.max(0,1-3.6*dt);
    e.kb.x*=fr2;e.kb.y*=fr2;
    e.kb.t-=dt;
    if(Math.random()<dt*14)particles.push({x:e.x+rnd(-6,6),y:e.y+rnd(-6,6),vx:kx2*.12,vy:ky2*.12,life:.22,t:0,r:2.4,c:'#9d8f7c',drag:1});
  }
  /* corpos no ar: batem nos outros e TODOS recebem dano */
  for(const e of enemies){
    if(e.dead||!e._thrown)continue;
    const th=e._thrown;
    const ox=e.x,oy=e.y;
    e.x+=th.vx*dt;e.y+=th.vy*dt;
    th.vx*=.985;th.vy*=.985;
    try{clampArena(e,e.r||12);}catch(err){}
    if(Math.abs(e.x-ox)<.01&&Math.abs(e.y-oy)<.01){
      th.t=Math.min(th.t,.08);
      x_sparks(e.x,e.y,'#9d6bb5',6,160,.35,2.5);
    }
    for(const o of enemies){
      if(o===e||o.dead||o.spawnT<.5)continue;
      if(x_dist(e.x,e.y,o.x,o.y)<(e.r||12)+(o.r||12)){
        x_dmgEnemy(o,th.dmg,'#9d6bb5');
        try{o.kb={x:th.vx*.3,y:th.vy*.3,t:.15};}catch(err){}
        x_dmgEnemy(e,th.dmg*.5,'#9d6bb5');
        th.hits++;th.t=Math.min(th.t,.1);
        x_sparks((e.x+o.x)/2,(e.y+o.y)/2,'#c9a0ff',8,200,.4,3);
        try{noiseSfx(.12,.05,320,'bandpass');}catch(err){}
        if(th.hits>=2){th.t=0;break;}
      }
    }
    th.t-=dt;
    if(th.t<=0){e._thrown=null;try{e.slowT=Math.max(e.slowT,.6);}catch(err){}}
  }
  /* v1.3.2: a AMARRA (botão direito) — física do que está preso pelo chicote */
  credorBindFrame(dt);
  /* v1.5.0: a ÂNCORA de parede — pêndulo do Thor */
  credorAnchorFrame(dt);
  /* objetos do mapa arremessados: voam, ferem e PODEM QUEBRAR */
  decorThrownFrame(dt);
}
/* ================================================================
   v1.3.2: O CHICOTE DA DÍVIDA — AMARRA (botão direito, MOUSE).
   Inimigo ou objeto do mapa preso pela corrente: segue o mouse,
   machuca-se ao bater nas paredes, fere quem estiver no caminho e
   o movimento frenético acumula força para o ARREMESSO ao soltar.
   Objetos têm vida própria: podem QUEBRAR (deixam cair 1 alma).
   Segurança: a amarra se solta sozinha no limite — nunca prende
   para sempre; morreu/trocou de sala, solta na hora.
   ================================================================ */
const X_HEAVY=new Set(['column','statue','arch','doorframe','tomb','confessional','ruined_wall','tunnel_arch','deformed_statue','belfry','cathedral','chapel','altar','cross','holy_statue','archway','pews','candle_altar','stainedglass_window','vitrais']);
function clearBind(){
  const b=wst.bind;
  if(b&&b.o){try{if(b.kind==='e')b.o._bound=false;}catch(err){}}
  wst.bind=null;
}
/* ================================================================
   v1.5.0 (Parte 13): ÂNCORA DE PAREDE — o botão direito na parede
   planta a âncora: Thor pende da corda, balança com o impulso e,
   ao soltar, voa com a força acumulada do balanço. A corda recolhe
   devagar (o credor cobra o atalho). Segurança: solta sozinha no
   limite, ao morrer, ao trocar de sala — nunca prende para sempre.
   ================================================================ */
function credorWallAt(wx,wy){
  try{
    if(inRoomXY(wx,wy,10))return false; /* dentro da sala: não é parede */
    const R=ROOM;
    if(wx<R.x-60||wx>R.x+R.w+60||wy<R.y-60||wy>R.y+R.h+60)return false;
    const p=roomPt(wx,wy,30); /* ponto na borda do retângulo mais próximo */
    if(!inRoomXY(p.x,p.y,12))return false;
    wst._aPt=p;return true;
  }catch(e){return false;}
}
function credorReleaseAnchor(silent){
  const a=wst.anchor;if(!a)return;
  wst.anchor=null;
  const vx=player._whpVx||0,vy=player._whpVy||0;
  player._whpVx=0;player._whpVy=0;
  const sp=Math.hypot(vx,vy);
  if(sp>170){
    const v=Math.min(sp*1.55,860);
    player._whpImp={vx:vx/sp*v,vy:vy/sp*v,t:.42,dur:.42};
    if(!silent){try{x_txt('IMPULSO!',player.x,player.y-34,10,'#c9a0ff');}catch(e){}
      try{noiseSfx(.16,.06,300,'bandpass');}catch(e){}}
  }
}
function credorAnchorFrame(dt){
  const a=wst.anchor;if(!a)return;
  a.t+=dt;
  if(a.t>3.2||player.dead||game.fallK>=0||a.ri!==game.roomIdx){credorReleaseAnchor(true);return;}
  a.rope=Math.max(90,a.rope-210*dt); /* recolhe devagar */
  const dx=player.x-a.x,dy=player.y-a.y;
  const d=Math.hypot(dx,dy)||1;
  let vx=(player._whpVx||0),vy=(player._whpVy||0);
  /* a dívida puxa — aceleração em direção à âncora */
  const pull=760*dt;
  vx+=(-dx/d)*pull;vy+=(-dy/d)*pull;
  if(d>a.rope){
    const nx=dx/d,ny=dy/d;
    player.x=a.x+nx*a.rope;player.y=a.y+ny*a.rope;
    const vr=vx*nx+vy*ny;
    if(vr>0){vx-=vr*nx;vy-=vr*ny;} /* guarda só a tangente: pêndulo de verdade */
  }
  const fr=Math.max(0,1-1.1*dt);vx*=fr;vy*=fr;
  player._whpVx=vx;player._whpVy=vy;
  player.x+=vx*dt;player.y+=vy*dt;
  try{clampArena(player,player.r);}catch(err){}
  try{resolveDecorCollision(player,player.r);}catch(err){}
  correnteFx.push({x:player.x,y:player.y,tx:a.x,ty:a.y,t:0,life:.1});
  if(Math.random()<dt*10)x_sparks(a.x,a.y,'#c9a0ff',2,90,.3,2);
}
function credorRmbDown(wx,wy){
  try{
    if(game.weapon!=='credor')return false; /* não é o chicote → jogo segue (serra etc.) */
    if(game.paused||optionsOpen())return true;
    if(game.windowScene)return true;
    if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight')return false;
    if(player.dead||game.fallK>=0)return true;
    if(wst.bind||wst.credor)return true; /* o chicote está ocupado */
    const reach=380*P.reachMult;
    let best=null,bd=118,isObj=false;
    for(const e of enemies){
      if(e.dead||e.spawnT<.5)continue;
      if(x_dist(player.x,player.y,e.x,e.y)>reach+e.r)continue;
      const dc=x_dist(wx,wy,e.x,e.y);
      if(dc<bd){bd=dc;best=e;isObj=false;}
    }
    for(const d of game.decor){
      if(!d||d.t==='glyph')continue; /* a marca antiga é pista — nunca se amarra */
      if(x_dist(player.x,player.y,d.x,d.y)>reach+20)continue;
      const dc=x_dist(wx,wy,d.x,d.y);
      if(dc<bd){bd=dc;best=d;isObj=true;}
    }
    if(!best){
      /* v1.5.0: PAREDE — planta a âncora e balança (soltar = impulso) */
      if(credorWallAt(wx,wy)&&wst.bind==null&&wst.credor==null){
        const ap=wst._aPt;wst._aPt=null;
        wst.anchor={x:ap.x,y:ap.y,rope:Math.min(x_dist(player.x,player.y,ap.x,ap.y),reach*1.25),t:0,ri:game.roomIdx};
        correnteFx.push({x:player.x,y:player.y,tx:ap.x,ty:ap.y,t:0,life:.3});
        try{sfx.stake();}catch(e){}
        x_sparks(ap.x,ap.y,'#c9a0ff',6,150,.35,2.5);
        x_txt('ÂNCORA',ap.x,ap.y-24,10,'#9d6bb5');
        return true;
      }
      /* estalo no vazio */
      wst.sweep={a:Math.atan2(wy-player.y,wx-player.x),t:0};
      try{sfx.throw();}catch(e){}
      wst.t=Math.max(wst.t,.2*(1/P.rateMult));
      return true;
    }
    if(isObj){
      const heavy=X_HEAVY.has(best.t);
      best._whp=heavy?72:34;
      wst.bind={kind:'o',o:best,t:0,svx:0,svy:0,travel:0,hits:0,heavy:heavy,hitCd:0,wallCd:0};
    }else{
      best._bound=true;
      wst.bind={kind:'e',o:best,t:0,svx:0,svy:0,travel:0,hits:0,boss:!!(best.xboss||best.type==='mb'),hitCd:0,wallCd:0};
    }
    correnteFx.push({x:player.x,y:player.y,tx:best.x,ty:best.y,t:0,life:.3});
    try{sfx.stake();}catch(e){}
    x_sparks(best.x,best.y,'#9d6bb5',8,180,.4,3);
    x_txt('AMARRADO',best.x,best.y-30,10,'#c9a0ff');
    return true;
  }catch(e){return false;}
}
function credorRmbUp(){
  try{
    /* v1.5.0: soltou a âncora? IMPULSO do balanço */
    if(wst.anchor){credorReleaseAnchor();return;}
    const b=wst.bind;
    if(!b)return;
    const o=b.o;
    wst.bind=null;
    if(!o)return;
    const sp=Math.hypot(b.svx,b.svy);
    const ang=(sp>70)?Math.atan2(b.svy,b.svx):Math.atan2(o.y-player.y,o.x-player.x);
    const power=1+Math.min(b.travel/900,1.3); /* mexer frenético = voa mais longe */
    const v=clamp(Math.max(sp*1.25,430)*power,430,1250);
    if(b.kind==='e'){
      o._bound=false;
      if(!o.dead){
        o._thrown={vx:Math.cos(ang)*v,vy:Math.sin(ang)*v,t:Math.min(.5+.3*(power-1),.95),dmg:(15+9*(power-1))*P.dmgMult,hits:0};
        try{o.kb={x:Math.cos(ang)*220,y:Math.sin(ang)*220,t:.12};}catch(err){}
      }
    }else{
      o._thrown={vx:Math.cos(ang)*v,vy:Math.sin(ang)*v,t:.95,dmg:(13+11*(power-1))*P.dmgMult,hits:0,hitCd:0};
    }
    x_sparks(o.x,o.y,'#c9a0ff',10,240,.45,3);
    try{noiseSfx(.14,.06,300,'bandpass');blip('sine',420,180,.14,.07);}catch(e){}
    if(power>1.6)x_txt('DÍVIDA LANÇADA',o.x,o.y-34,10,'#c9a0ff');
  }catch(e){}
}
function breakObject(o){
  try{
    const i=game.decor.indexOf(o);
    if(i>=0)game.decor.splice(i,1);
    if(wst.bind&&wst.bind.o===o)wst.bind=null;
    o._thrown=null;
    x_sparks(o.x,o.y,'#c9a0ff',16,300,.55,4);
    try{noiseSfx(.22,.08,220,'lowpass');blip('square',190,60,.18,.08);}catch(e){}
    x_txt('QUEBROU',o.x,o.y-26,10,'#9d6bb5');
    gainSouls(1);
  }catch(e){}
}
function credorBindFrame(dt){
  const b=wst.bind;
  if(!b)return;
  const o=b.o;
  const gone=(b.kind==='e')?(!o||o.dead||o.hp<=0||enemies.indexOf(o)<0):(!o||game.decor.indexOf(o)<0);
  if(gone){clearBind();return;}
  b.t+=dt;
  b.hitCd-=dt;b.wallCd-=dt;
  /* a presa persegue o cursor do mouse */
  const cap=(b.kind==='o'?(b.heavy?640:1150):(b.boss?320:940));
  const dx=mouse.x-o.x,dy=mouse.y-o.y;
  const dd=Math.hypot(dx,dy);
  const ox=o.x,oy=o.y;
  if(dd>1){const st=Math.min(dd,cap*dt);o.x+=dx/dd*st;o.y+=dy/dd*st;}
  const ivx=(o.x-ox)/Math.max(dt,.001),ivy=(o.y-oy)/Math.max(dt,.001);
  b.svx=b.svx*.7+ivx*.3;b.svy=b.svy*.7+ivy*.3;
  b.travel+=Math.hypot(o.x-ox,o.y-oy);
  /* PAREDES: bater machuca o que está preso (0.3s de graça — a corrente
     ainda está ARRANCANDO a presa do lugar: o encaixe inicial não conta).
     v1.5.0: o dano só vale quando o corpo foi REALMENTE BLOQUEADO —
     compara o deslocamento com o que o frame QUERIA dar (min(dd,cap·dt)).
     Antes comparava com a distância total ao cursor e o objeto se gastava
     sozinho no meio da sala, sem parede nenhuma. */
  try{clampArena(o,b.kind==='e'?(o.r||12):16);}catch(err){}
  const moved=Math.hypot(o.x-ox,o.y-oy);
  const spd=Math.hypot(ivx,ivy);
  const want=Math.min(dd,cap*dt);
  const blocked=moved<want*.55;
  if(b.t>.3&&dd>26&&blocked&&spd>150&&b.wallCd<=0){
    const wdmg=spd*.032;
    if(b.kind==='e')x_dmgEnemy(o,wdmg,'#9d6bb5');
    else o._whp-=wdmg;
    x_sparks(o.x,o.y,'#9d6bb5',7,190,.4,3);
    try{noiseSfx(.12,.06,260,'bandpass');}catch(e){}
    if(Math.random()<.4)x_txt('CRAC!',o.x,o.y-26,10,'#c9a0ff');
    b.wallCd=.16;
    if(b.kind==='o'&&o._whp<=0){breakObject(o);return;}
  }
  /* INIMIGOS NO CAMINHO: o corpo preso fere quem tocar (e se gasta) */
  if(spd>150&&b.hitCd<=0){
    for(const q of enemies){
      if(q.dead||q===o||q.spawnT<.5)continue;
      if(x_dist(o.x,o.y,q.x,q.y)<(o.r||14)+(q.r||12)+4){
        const dmg2=(b.kind==='o'?14:11)*P.dmgMult*(1+Math.min(spd/900,.8));
        x_dmgEnemy(q,dmg2,'#9d6bb5');
        try{q.kb={x:ivx*.35,y:ivy*.35,t:.14};}catch(err){}
        if(b.kind==='o'){o._whp-=dmg2*.45;if(o._whp<=0){breakObject(o);return;}}
        else x_dmgEnemy(o,dmg2*.4,'#9d6bb5');
        x_sparks((o.x+q.x)/2,(o.y+q.y)/2,'#c9a0ff',7,200,.4,3);
        try{noiseSfx(.1,.05,340,'bandpass');}catch(e){}
        b.hitCd=.18;b.hits++;
        break;
      }
    }
  }
  if(b.kind==='e'){try{o.slowT=Math.max(o.slowT,.35);}catch(err){}}
  /* segurança: a amarra nunca prende para sempre */
  if(b.t>(b.kind==='e'?(b.boss?2.4:7):6.5))credorRmbUp();
}
function decorThrownFrame(dt){
  for(let i=game.decor.length-1;i>=0;i--){
    const d=game.decor[i];
    if(!d||!d._thrown)continue;
    const th=d._thrown;
    const ox=d.x,oy=d.y;
    d.x+=th.vx*dt;d.y+=th.vy*dt;
    th.vx*=.988;th.vy*=.988;
    try{clampArena(d,16);}catch(err){}
    const intended=Math.hypot(th.vx,th.vy)*dt;
    const moved=Math.hypot(d.x-ox,d.y-oy);
    if(intended>2.5&&moved<intended*.4){
      const spd=Math.hypot(th.vx,th.vy);
      d._whp=(d._whp!=null?d._whp:34)-spd*.045;
      x_sparks(d.x,d.y,'#9d6bb5',8,210,.4,3);
      try{noiseSfx(.14,.06,250,'bandpass');}catch(e){}
      th.vx*=-.32;th.vy*=-.32;th.t-=.12;
      if(d._whp<=0){breakObject(d);continue;}
    }
    th.hitCd=(th.hitCd||0)-dt;
    const spd2=Math.hypot(th.vx,th.vy);
    if(spd2>150&&th.hitCd<=0){
      for(const q of enemies){
        if(q.dead||q.spawnT<.5)continue;
        if(x_dist(d.x,d.y,q.x,q.y)<(q.r||12)+16){
          x_dmgEnemy(q,th.dmg,'#9d6bb5');
          try{q.kb={x:th.vx*.3,y:th.vy*.3,t:.14};}catch(err){}
          d._whp=(d._whp!=null?d._whp:34)-th.dmg*.5;
          th.hitCd=.22;th.hits=(th.hits||0)+1;
          th.vx*=.55;th.vy*=.55;
          x_sparks((d.x+q.x)/2,(d.y+q.y)/2,'#c9a0ff',7,200,.4,3);
          try{noiseSfx(.1,.05,330,'bandpass');}catch(e){}
          if(d._whp<=0){breakObject(d);break;}
          if(th.hits>=3){th.t=0;break;}
        }
      }
      if(game.decor[i]!==d)continue; /* quebrou no meio do loop */
    }
    th.t-=dt;
    if(th.t<=0)d._thrown=null;
  }
}
function isIsolated(e){
  for(const o of enemies){
    if(o===e||o.dead||o.spawnT<.5)continue;
    if(x_dist(e.x,e.y,o.x,o.y)<140)return false;
  }
  return true;
}
/* projéteis especiais das armas (quiques/ondulação/teclas) — roda no frame */
function updateXProjectiles(dt){
  for(const b of bullets){
    if(b.fish){
      b.wobA=(b.wobA||0)+dt*16;
      const s=Math.sin(b.wobA)*150*dt;
      b.x+=-b.vy/Math.hypot(b.vx,b.vy)*s;b.y+=b.vx/Math.hypot(b.vx,b.vy)*s;
      const m=game.absMain;
      if(b.x<m.x+8||b.x>m.x+m.w-8){b.vx*=-1;b.fish--;b.life+=.5;sparksplash(b);}
      if(b.y<m.y+8||b.y>m.y+m.h-8){b.vy*=-1;b.fish--;b.life+=.5;sparksplash(b);}
      if(b.fish<=0)b.life=Math.min(b.life,.05);
      if(game.evoMega&&b.fish<b.fish0){b.fish0=b.fish0||b.fish+1;/* dano em área ao quicar */
        for(const e of enemies){if(!e.dead&&x_dist(b.x,b.y,e.x,e.y)<80)x_dmgEnemy(e,6*P.dmgMult,'#7fb8ff');}}
    }
    if(b.colher){
      b.wobA+=dt*9;
      b.x+=-b.vy/Math.hypot(b.vx,b.vy)*Math.sin(b.wobA)*90*dt;
      b.y+=b.vx/Math.hypot(b.vx,b.vy)*Math.sin(b.wobA)*90*dt;
    }
  }
}
function sparksplash(b){try{sparks(b.x,b.y,'#7fb8ff',8,160,.4,2.5);}catch(e){}}
/* colherada divina: a cada 13 acertados (contados no kill/hit via bullets colher) */
let colherHits=0;
function colherHitCheck(e){
  /* chamado pelos ganchos de dano (frame) quando um projétil colher acerta */
}
/* ================================================================
   v1.3.3 — A COLHER COMICAMENTE GRANDE: arma de perto com sinergias.
   Os elementos que thor carrega infundam a colherada:
   fogo QUEIMA · explosão DETONA · gelo CONGELA · raio SALTA ·
   água POÇA · vento ARREMESSA LONGE · terra ESTREMECE ·
   luz/escuridão CORTAM MAIS FUNDO.
   ================================================================ */
let _colherTxtCd=0;
function colherSyn(){
 const s={};
 try{
  for(const id in game.up){
   if(!(game.up[id]>0))continue;
   const es=ELEM_EXTRA[id];
   if(es){for(const el of es){if(ELEM[el])s[el]=1;}continue;}
   const u=NOVOS_ITENS.find(function(n){return n.id===id;});
   if(u&&u.el){for(const el of u.el){if(ELEM[el])s[el]=1;}}
  }
 }catch(e){}
 return s;
}
function colherSynHit(e,s,dmg){
 try{
  let txt=null;
  if(s.fogo){e.burnT=Math.max(e.burnT||0,2.6);e.burnD=Math.max(e.burnD||0,3.2*P.dmgMult);x_sparks(e.x,e.y,'#ff8f3d',7,150,.4,2.5,true);txt='COLHERADA EM CHAMAS';}
  if(s.gelo){e.slowT=Math.max(e.slowT||0,2.2);x_sparks(e.x,e.y,'#cfe9ff',6,130,.4,2.5,true);txt='GELO NA COLHER';}
  if((game.up&&game.up.explosao)||(game.up&&game.up.polvora)){
   shockwaves.push({x:e.x,y:e.y,r:6,vr:560,maxR:118,t:0,dur:.4,c:'#ff8f3d',dmg:14*P.dmgMult,hit:new Set()});
   x_sparks(e.x,e.y,'#ff8f3d',12,240,.55,3,true);
   try{sfx.boom();}catch(e2){}
   txt='A COLHER EXPLODIU';
  }
  if(s.raio){
   let n=0;
   for(const o of enemies){
    if(o.dead||o===e||n>=2)continue;
    if(x_dist(e.x,e.y,o.x,o.y)<150){x_dmgEnemy(o,dmg*.55,'#fff3c4');n++;correnteFx.push({x:e.x,y:e.y,tx:o.x,ty:o.y,t:0,life:.18});}
   }
  }
  if(s.agua){poças.push({x:e.x,y:e.y,t:0,life:3.2,r:36});e.slowT=Math.max(e.slowT||0,1.4);}
  if(s.terra){game.shake=Math.max(game.shake,5);e.slowT=Math.max(e.slowT||0,.9);}
  if(s.luz)x_sparks(e.x,e.y,'#ffd9a0',5,140,.35,2.5,true);
  if(s.sombra)x_sparks(e.x,e.y,'#9d6bb5',5,140,.35,2.5,true);
  if(txt&&_colherTxtCd<=0){_colherTxtCd=1.4;try{x_txt(txt,e.x,e.y-36,10,s.fogo?'#ff8f3d':'#ffe9b8');}catch(e2){}}
 }catch(e){}
}
function colherDivina(a){
 /* o céu responde: um raio cai onde a colher aponta */
 const tx=player.x+Math.cos(a)*120,ty=player.y+Math.sin(a)*120;
 shockwaves.push({x:tx,y:ty,r:8,vr:520,maxR:128,t:0,dur:.5,c:'#ffd9a0',dmg:30*P.dmgMult,hit:new Set()});
 for(let i=0;i<16;i++)particles.push({x:tx+rnd(-14,14),y:ty+rnd(-40,10),vx:rnd(-20,20),vy:rnd(-160,-40),life:rnd(.4,.9),t:0,r:rnd(1.5,3.4),c:i%2?'#ffd9a0':'#fff3c4',drag:.96,glow:true});
 try{blip('sine',700,1200,.5,.12);}catch(e){}
 try{x_txt('O CÉU RESPONDE',tx,ty-48,11,'#ffd9a0');}catch(e){}
 if(x_up('sopa')){
  /* A SOPA DIVINA: o raio salta em 3 demônios */
  let n=0;
  const near=enemies.filter(function(o){return !o.dead&&o.spawnT>=.5&&x_dist(tx,ty,o.x,o.y)<260;}).sort(function(p,q){return x_dist(tx,ty,p.x,p.y)-x_dist(tx,ty,q.x,q.y);});
  for(const o of near){if(n>=3)break;x_dmgEnemy(o,22*P.dmgMult,'#ffd9a0');correnteFx.push({x:tx,y:ty,tx:o.x,ty:o.y,t:0,life:.25});n++;}
 }
}
let colherFx=null;
function colherSwingFx(a,range,syn,chg){
 chg=chg||0;
 colherFx={t:0,dur:.16+.1*chg,a:a,range:range,chg:chg,c:syn.fogo?'#ff8f3d':syn.gelo?'#cfe9ff':syn.raio?'#fff3c4':'#ffe9b8'};
}
/* ================================================================
   v1.3.4 — A COLHER NAS TELAS: sprite parado (colher.png) na mão do
   Thor, anel de carga enquanto SEGURA o botão/mouse e o sprite de
   ataque (colher-ataque.png) varrendo o arco na colherada. Sem os
   PNGs, um desenho vetorial de colher gigante entra no lugar.
   ================================================================ */
function colherSpr(name){ /* sprite das armas (assets/sprites/armas/) */
 try{if(typeof wpnGet==='function')return wpnGet(name);}catch(e){}
 return null;
}
function colherVec(x,y,ang,atk,ch){ /* fallback vetorial */
 ctx.save();ctx.translate(x,y);ctx.rotate(ang);
 const s=1+.18*(ch||0);
 ctx.scale(s,s);
 ctx.lineCap='round';
 /* cabo */
 ctx.strokeStyle='#c49c60';ctx.lineWidth=5;
 ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(2,0);ctx.stroke();
 ctx.strokeStyle='#8c683e';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-24,1.4);ctx.lineTo(2,1.4);ctx.stroke();
 /* boca */
 ctx.fillStyle='#d8d6c8';ctx.beginPath();ctx.ellipse(11,0,9.5,12.5,0,0,TAU);ctx.fill();
 ctx.fillStyle='#9e988a';ctx.beginPath();ctx.ellipse(12.4,0,6.6,9,0,0,TAU);ctx.fill();
 ctx.strokeStyle='#18120e';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(11,0,9.5,12.5,0,0,TAU);ctx.stroke();
 if(atk){ /* linhas de movimento */
  ctx.strokeStyle='rgba(230,218,196,.55)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,20,-1.1,.7);ctx.stroke();
 }
 ctx.restore();
}
function colherDrawSpr(name,x,y,ang,size,extra){
 /* desenha o sprite se existir; devolve false para o fallback vetorial */
 const im=colherSpr(name);
 if(!im)return false;
 try{
  const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
  if(!iw||!ih)return false;
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);
  if(extra&&extra.flip)ctx.scale(-1,1);
  if(extra&&extra.alpha!==undefined)ctx.globalAlpha*=extra.alpha;
  const kk=Math.min(size*1.28/Math.max(iw,ih),size/Math.min(iw,ih)); /* cabe no quadrado */
  ctx.drawImage(im,-iw*kk/2,-ih*kk/2,iw*kk,ih*kk);
  ctx.restore();
  return true;
 }catch(e){return false;}
}
function drawColher(){
 try{
  if(game.weapon!=='colher')return;
  if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight')return;
  if(player.dead||game.fallK>=0)return;
  const ch=wst.chg;
  const chN=ch?clamp(ch.t/COLHER_CHARGE_MAX,0,1):0;
  /* ---- COLHERADA: sprite de ataque varrendo o arco ---- */
  if(colherFx&&colherFx.t<colherFx.dur){
   colherFx.t+=1/60;
   const p=clamp(colherFx.t/colherFx.dur,0,1);
   const sweep=-1.15+2.3*p; /* de trás para frente */
   const ang=colherFx.a+sweep;
   const rr=30;
   const hx=player.x+Math.cos(ang)*rr,hy=player.y+Math.sin(ang)*rr;
   const ok=colherDrawSpr('colher-ataque',hx,hy,ang,58+(colherFx.chg||0)*26);
   if(!ok)colherVec(hx,hy,ang,true,colherFx.chg);
   /* rastro do arco */
   ctx.save();ctx.globalAlpha=(1-p)*.5;
   ctx.strokeStyle=colherFx.c;ctx.lineWidth=3.5*(1-p)+1;
   ctx.beginPath();ctx.arc(player.x,player.y,(34+30*p)*(1+(colherFx.chg||0)*.3),colherFx.a-1.15,ang);ctx.stroke();
   ctx.restore();
   if(p>=1)colherFx=null;
   return; /* durante a colherada a parada some (ela está no arco) */
  }
  /* ---- PARADA / CARGANDO ---- */
  const a=ch?ch.a:player.angle;
  const bob=Math.sin(game.t*2.2)*1.6;
  /* carregando: recua e inclina para trás; cheia: treme */
  const back=ch?-.55+.2*Math.sin(game.t*14)*chN:0;
  const ang=a+back;
  const off=ch?18:14;
  const hx=player.x+Math.cos(ang)*off,hy=player.y+Math.sin(ang)*off+bob;
  const size=48+chN*14;
  const ok=colherDrawSpr('colher',hx,hy,ang,size,{alpha:ch?.92:1});
  if(!ok)colherVec(hx,hy,ang,false,chN);
  /* anel de carga */
  if(ch){
   ctx.save();
   ctx.strokeStyle=chN>=1?'rgba(255,217,160,.95)':'rgba(255,233,184,.6)';
   ctx.lineWidth=chN>=1?3:2;
   ctx.beginPath();ctx.arc(player.x,player.y,26,-Math.PI/2,-Math.PI/2+TAU*chN);ctx.stroke();
   ctx.globalAlpha=.25+.35*chN;
   ctx.strokeStyle='#ffe9b8';ctx.lineWidth=1;
   ctx.beginPath();ctx.arc(player.x,player.y,26,0,TAU);ctx.stroke();
   if(chN>=1){ /* cheia: brilho pulsando */
    ctx.globalAlpha=.5+.4*Math.sin(game.t*18);
    ctx.strokeStyle='#ffd9a0';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(player.x,player.y,31+Math.sin(game.t*10)*2,0,TAU);ctx.stroke();
   }
   ctx.restore();
   /* partículas sendo puxadas para a colher */
   if(Math.random()<.35){
    const aa=rnd(TAU),dd=rnd(26,44);
    particles.push({x:player.x+Math.cos(aa)*dd,y:player.y+Math.sin(aa)*dd,vx:-Math.cos(aa)*60,vy:-Math.sin(aa)*60,life:.3,t:0,r:rnd(1,2),c:chN>=1?'#ffd9a0':'#ffe9b8',drag:1,glow:true});
   }
  }
 }catch(e){}
}
function colherChargeFrame(dt){
 /* v1.3.4: o tempo de carga anda no frame (nunca em setTimeout) */
 try{
  const ch=wst.chg;
  if(!ch)return;
  if(player.dead||game.fallK>=0||game.paused||optionsOpen()){wst.chg=null;return;}
  if(game.weapon!=='colher'){wst.chg=null;return;}
  ch.t+=dt;
  const chN=clamp(ch.t/COLHER_CHARGE_MAX,0,1);
  wst.colherCharge=chN;
  player.angle=ch.a;
  if(chN>=1&&!wst.chgPing){
   wst.chgPing=true;
   try{blip('sine',330,720,.22,.1);}catch(e){}
   x_sparks(player.x+Math.cos(ch.a)*24,player.y+Math.sin(ch.a)*24,'#ffd9a0',8,140,.4,2.5,true);
   try{x_txt('CARREGADA!',player.x,player.y-42,10,'#ffd9a0');}catch(e){}
  }
 }catch(e){wst.chg=null;}
}
function colherRelease(){
 /* v1.3.4: soltou o botão/mouse — a colherada desce com a carga acumulada */
 try{
  const ch=wst.chg;
  wst.chg=null;
  if(!ch)return;
  const chN=clamp(ch.t/COLHER_CHARGE_MAX,0,1);
  if(player.dead||game.fallK>=0)return;
  if(game.paused||optionsOpen())return;
  if(game.weapon!=='colher')return;
  if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight')return;
  wst.colherCharge=chN;
  wst.forceA=ch.a;
  player.angle=ch.a;
  fireWeapon(0);
 }catch(e){wst.chg=null;}
}
/* ================================================================
   6. ZONAS DA NOVA PROGRESSÃO
   PENUMBRA (fase 1 cinzenta · fase 2 morta) → PENUMBRA INFERNAL
   (fase 1 rachada · fase 2 vermelha) → CAMINHO DO PORTÃO → CÉRBERO
   → GARGANTA VULCÂNICA → CORREDOR AZULADO → CARONTE → LIMBO
   (fases 1-2 santas/cinzas, fases 3-4 infernais) → JUIZ SEM ROSTO.
   ================================================================ */
function limboPhase(){return game.limboPhase||((game.floor-(game.region==='limbo'?game.limboBase||4:0))+1);}
function zoneOf(){
  const r=game.region;
  if(r==='vulcan')return{z:'vulcan',ph:1,name:'A GARGANTA VULCÂNICA'};
  if(r==='limbo'){
    const p=game.limboPhase||1;
    if(p<=2)return{z:'limbo',ph:p,name:'O LIMBO — FASE '+p};
    return{z:'limbinf',ph:p-2,name:'O LIMBO INFERNAL — FASE '+(p-2)};
  }
  /* penumbra: andares 1-4 */
  const f=game.floor;
  if(f<=2)return{z:'penumbra',ph:f,name:'PENUMBRA DAS ALMAS — FASE '+f};
  return{z:'peninf',ph:f-2,name:'PENUMBRA INFERNAL — FASE '+(f-2)};
}
/* banners/legendas por zona (lidos por finishFloorEnter via __ZONE_LABEL) */
function zoneLabel(){
  const zn=zoneOf();
  const subs={
    penumbra1:'sombras, almas perdidas — a primeira descida',
    penumbra2:'a grama é cinza. as árvores, mortas. aqui já foi outro lugar',
    peninf1:'o chão racha. o que era sombra ganhou dentes',
    peninf2:'as paredes deformam — o portão aguarda no fundo',
    vulcan1:'cinzas, lava e ferreiros — quase nada respira',
    limbo1:'o falso paraíso — almas que não avançam nem desaparecem',
    limbo2:'as cores foram embora. restou a saudade',
    limbinf1:'o paraíso esquenta — as almas ganharam garras',
    limbinf2:'o último véu antes do fim da descida'
  };
  return{label:(zn.z==='vulcan'?'GARGANTA · FASE ':zn.z==='limbinf'?'LIMBO INFERNAL · FASE ':zn.z==='limbo'?'LIMBO · FASE ':zn.z==='peninf'?'PENUMBRA INFERNAL · FASE ':'PENUMBRA · FASE ')+roman(zn.ph),
         sub:subs[zn.z+zn.ph]||''};
}
window.__ZONE_LABEL=zoneLabel;
window.__MUSIC_ZONE=null;
function updateMusicZone(){
  const st=game.state;
  if(game.pacSil&&st==='play'){window.__MUSIC_ZONE='silencio';return;}
  if(st==='gatepath'){window.__MUSIC_ZONE='portao';return;}
  /* v1.5.7: o TEMA DO GUARDIÃO — "guardião do inferno" toca na luta do antigo
     (a cena já sobe o mesmo tema no snap; o modo cobre a luta inteira) */
  if(st==='play'&&game._cerbFight&&!game._rmSent&&boss.active){window.__MUSIC_ZONE='cerberus';return;}
  /* v1.3.1: a música ameaçadora do Cérbero sobe SÓ no snap — começa gradual */
  if(st==='cerbintro'){window.__MUSIC_ZONE=CI.snap?'cerberus':null;return;}
  if(st==='bluecorr'){window.__MUSIC_ZONE='azul';return;}
  if(st==='play'&&game.region==='vulcan'){window.__MUSIC_ZONE='vulcan';return;}
  window.__MUSIC_ZONE=null;
}

/* ---------- CAMINHO DO PORTÃO (sem inimigos) — v1.5.2 VULCÃO ----------
   Um mini mapa compacto de pedra vulcânica (marrom escuro + vermelho vivo):
   fissuras de lava respirando, poças incandescentes, basalto nas bordas —
   e no fim, O PORTÃO ENORME: ele NÃO abre sozinho. Chegue perto e aperte
   [Z] (ou o botão de interação do toque) para as folhas se abrirem e a luta
   do Cérbero começar. Quem tem 6+ bênçãos ainda cruza com O THOR QUE NÃO
   DESCEU no meio do caminho (secreto, intocado). */
const GP={t:0,gate:0,phase:'walk',seg:0,sthor:false,sthorDead:false,warned:false,seg2:false}; /* v1.3.3: seg = trecho do corredor */
/* v1.5.3: A LAJE DE PEDRA — o chão caminhável TERMINA no portão (nunca passa
   dele). Uma fonte só para desenhar a laje, clipar as fissuras e prender o Thor. */
/* v1.5.5: a LAJE agora ocupa a largura inteira (paredes dos dois lados) e o
   PORTÃO fica DE FRENTE, no alto — embutido na face norte do vulcão, como
   quem vai SUBIR e ENTRAR nele */
function gpFloorRect(){return {x:64,y:H*.60,r:W-64,b:H-64};}
function gpFloorBounds(){const f=gpFloorRect();return {l:f.x+34,r:f.r-30,t:f.y+34,b:f.b-30};}
function startGatePath(){
  game.state='gatepath';
  game._bcActive=false;
  game._arenaLock=false; /* v1.5.4: o corredor do portão nunca herda a trava da arena */
  game.region='vulcan'; /* v1.5.3: o caminho do portão é terra vulcânica */
  GP.t=0;GP.gate=0;GP.phase='walk';GP.seg=0;GP.sthor=false;GP.sthorDead=false;GP.warned=false;
  GP.sthorSpawned=false;GP.near=false;GP.waitT=0;GP.zReq=false;GP._opened=false;
  GP.sthorRef=null;GP.sthorT=0;GP.sthorFarT=0; /* v1.5.3: válvula do segredo */
  /* fissuras e poças geradas UMA vez (a sala não muda a cada olhar)
     v1.5.3: nascem DENTRO da laje de pedra */
  GP.cracks=[];GP.pools=[];
  const FR=gpFloorRect();
  let sd=97;const rr=function(){sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff;};
  for(let i=0;i<7;i++){
    const cx=FR.x+50+rr()*Math.max(60,(FR.r-FR.x)-120),cy=FR.y+50+rr()*Math.max(60,(FR.b-FR.y)-100);
    const pts=[[cx,cy]];
    let px=cx,py=cy;
    const n=3+Math.floor(rr()*4);
    for(let k=0;k<n;k++){px+=(rr()-.5)*180;py+=(rr()-.3)*90;pts.push([px,py]);}
    GP.cracks.push({pts,w:rr()<.4?2.4:1.4,ph:rr()*6});
  }
  for(let i=0;i<3;i++)GP.pools.push({x:FR.x+70+rr()*Math.max(60,(FR.r-FR.x)-160),y:FR.y+120+rr()*Math.max(40,(FR.b-FR.y)-170),rx:34+rr()*44,ry:9+rr()*10,ph:rr()*6});
  ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
  game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain=game.absRects[0];
  buildRoomFloor();
  game.doors=[];game.portal=null;game.decor=[];game.roomWindow=null;game.puzzle=null;game.penumbra=null;
  game.sacrificeAltar=null;game.keeper=null;game.shopNear=null;
  enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];texts=[];spawnMarks=[];
  thrownSaw=null;lightBeam=null;
  player.x=110;player.y=H*.66;player.mvx=0;player.mvy=0; /* v1.5.3: nasce DENTRO da laje */
  game.roomFade=1;
  try{sfx.rumble();sfx.echo();blip('sine',80,44,1.6,.1);}catch(e){}
  game.banner={type:'circle',txt:'O FIM DA PENUMBRA',name:'O CAMINHO DO PORTÃO',sub:'a terra arde. o portão espera no alto.',t:0,dur:3.4};
}
/* posição do PORTÃO ENORME (uma fonte só — desenho, colisão e prompt)
   v1.5.5: DE FRENTE no alto — centro x no meio da tela; a BASE da moldura
   (gh/2+16) pousa exatamente onde a face norte encontra a laje (H*.60),
   então o portão sobe do chão até o topo da tela: você sobe e ENTRA */
function gatePos(){return {x:W*.5,y:H*.60-211};}
/* v1.5.3: distância até a MOLDURA do portão (retângulo 282×422) — não ao centro:
   chegar perto EM QUALQUER altura da folha acende o prompt (antes, quem andava
   pela base da laje ficava a 361px do centro e o portão "não abria") */
function gateDist(px,py){
  const gp=gatePos();
  const dx=px<gp.x-141?gp.x-141-px:(px>gp.x+141?px-(gp.x+141):0);
  const dy=py<gp.y-211?gp.y-211-py:(py>gp.y+211?py-(gp.y+211):0);
  return Math.hypot(dx,dy);
}
/* [Z] / botão de interação: abre o portão se você estiver perto
   v1.5.3: também durante o segredo (phase sthor) — lutar é opção */
function gateInteract(){
  try{
    if(game.state!=='gatepath')return false;
    if(GP.phase!=='walk'&&GP.phase!=='sthor')return false;
    if(!GP.near)return false;
    GP.zReq=true;
    return true;
  }catch(e){return false;}
}
function updateGatePath(dt){
  GP.t+=dt;
  updateMusicZone();
  if(GP.phase==='walk'){
    /* caminhada livre — sem inimigos, sem dano */
    const ax=(held('right')?1:0)-(held('left')?1:0);
    const ay=(held('down')?1:0)-(held('up')?1:0);
    const l=Math.hypot(ax,ay);
    if(l){
      const spd=210;
      player.x+=ax/l*spd*dt;player.y+=ay/l*spd*dt;
      player.mvx=ax/l;player.mvy=ay/l;player.walkT+=dt*8;
      player.angle=Math.atan2(player.mvy,player.mvx);
    }
    /* v1.5.3: o Thor anda SÓ na laje — v1.5.5: a laje é a faixa entre a face norte e a borda de baixo */
    const FB=gpFloorBounds();
    player.x=x_clamp(player.x,FB.l,FB.r);player.y=x_clamp(player.y,FB.t,FB.b);
    /* v1.5.2: segredo mantido — THOR QUE NÃO DESCEU (builds com 6+ bênçãos)
       v1.5.3: nasce DENTRO da laje e fica VISÍVEL (drawGatePath desenha inimigos)
       v1.5.5: o gatilho acompanha a laje nova (largura inteira, portão no alto) */
    if(!GP.sthorSpawned&&x_blessCount()>=6&&player.x>W*.30&&!GP.sthorDead){
      const FBS=gpFloorBounds();
      GP.sthorSpawned=true;GP.sthor=true;GP.phase='sthor';GP.sthorT=0;GP.sthorFarT=0;
      /* v1.5.5: nasce na laje (que agora começa em H*.60) */
      GP.sthorRef=spawnEnemy('sthor',Math.min(FBS.r-60,(W*.5)),H*.74);
      game.banner={type:'boss',txt:'ALGO TE SEGUE',sub:'aquele que não desceu quer seu lugar na fila',t:0,dur:3.2};
      try{sfx.growl();sfx.static_();}catch(e){}
    }
  }else if(GP.phase==='sthor'){
    /* a luta acontece dentro do estado (gatepath não roda updatePlay;
       rodamos aqui o mínimo — as IAs dos chefes-x rodam via bossAI_hook) */
    GP.sthorT=(GP.sthorT||0)+dt;
    updatePlayer(dt);
    updateShot(dt);updateChainsaw(dt);updateSword(dt);updateNova(dt);updateStakes(dt);
    updateMagics(dt);updateShock(dt);updateThrownSaw(dt);updateHammers(dt);
    updateBullets(dt);updateVapers(dt);updateBeamShots(dt);updateLightning(dt);
    updateEnemies(dt);updateEBullets(dt);updatePickups(dt);
    frameWeapons(dt);
    frameSyn(dt);
    /* v1.5.3: VÁLVULA DO SEGREDO — a luta NUNCA prende o caminho: fique longe
       demais por 4s (ou 75s de luta) e ele desiste e volta para a fila; a
       recompensa é de quem vencer. O portão fica SEMPRE alcançável. */
    const sr=GP.sthorRef;
    if(sr&&!sr.dead){
      if(x_dist(player.x,player.y,sr.x,sr.y)>640)GP.sthorFarT=(GP.sthorFarT||0)+dt;else GP.sthorFarT=0;
      if(GP.sthorFarT>4||GP.sthorT>75){
        const ix=enemies.indexOf(sr);if(ix>=0)enemies.splice(ix,1);
        ebullets.length=0;
        GP.phase='walk';GP.sthorDead=true;GP.sthorRef=null;
        game.banner={type:'small',txt:'ELE VOLTOU PARA A FILA',sub:'o portão espera',t:0,dur:2.4};
      }
    }
    /* v1.5.3: o Thor também não sai da laje durante o segredo */
    {const FB2=gpFloorBounds();player.x=x_clamp(player.x,FB2.l,FB2.r);player.y=x_clamp(player.y,FB2.t,FB2.b);}
    if(!enemies.some(function(e){return e.xboss&&!e.dead;})){
      GP.phase='walk';GP.sthorDead=true;GP.sthorRef=null;
      game.banner={type:'small',txt:'ELE VOLTOU PARA A FILA',sub:'o portão espera',t:0,dur:2.4};
      {const FB3=gpFloorRect();dropRandomBlessing(FB3.r-140,H*.78);}
    }
  }else if(GP.phase==='opengate'){
    GP.gate=Math.min(1,GP.gate+dt/2.6); /* abre devagar (2.6s) */
    /* v1.5.4: a abertura COSPARA luz — chamas amarelo-alaranjadas ao redor e
       faíscas BRANCAS nascendo da fenda central */
    if(Math.random()<dt*16)particles.push({x:gatePos().x+rnd(-130,130),y:gatePos().y+rnd(-210,210),vx:rnd(-10,10),vy:rnd(-95,-30),life:rnd(.7,1.5),t:0,r:rnd(1.5,3.6),c:pick(['#fff6e0','#ffd9a0','#ff8f3d','#ffb347']),drag:1,glow:true});
    if(Math.random()<dt*11)particles.push({x:gatePos().x+rnd(-16,16),y:gatePos().y+rnd(-170,170),vx:rnd(-4,4),vy:rnd(-70,-22),life:rnd(.4,1),t:0,r:rnd(1,2.6),c:'#ffffff',drag:1,glow:true});
    if(GP.t>3.1){
      /* v1.5.5: abriu — agora o Thor ENTRA pelo portão (a cutscene antiga
         começa só quando ele entra) */
      GP.phase='enter';GP.t=0;GP.enterT=0;
    }
  }else if(GP.phase==='enter'){
    /* v1.5.5: MOVER O PERSONAGEM PARA ENTRAR — o Thor anda sozinho para dentro
       do vão aberto; o BRANCO total do interior o engole e, ao entrar, a
       CUTSCENE ANTIGA do Cérbero começa (relógio de segurança: nunca prende) */
    GP.enterT=(GP.enterT||0)+dt;
    const gpe=gatePos();
    const tx=gpe.x,ty=gpe.y+30; /* dentro do vão aberto */
    const ddx=tx-player.x,ddy=ty-player.y,dd=Math.hypot(ddx,ddy);
    if(dd>6){
      const spd=195;
      player.x+=ddx/dd*Math.min(spd*dt,dd);player.y+=ddy/dd*Math.min(spd*dt,dd);
      player.mvx=ddx/dd;player.mvy=ddy/dd;player.walkT+=dt*8;
      player.angle=Math.atan2(player.mvy,player.mvx);
    }else{player.mvx=0;player.mvy=0;}
    if(Math.random()<dt*14)particles.push({x:gpe.x+rnd(-120,120),y:gpe.y+rnd(-190,190),vx:rnd(-10,10),vy:rnd(-90,-30),life:rnd(.7,1.5),t:0,r:rnd(1.5,3.4),c:pick(['#fff6e0','#ffd9a0','#ff8f3d','#ffb347']),drag:1,glow:true});
    if(GP.enterT>4.5||dd<10||player.y<gpe.y+45){GP.phase='done';startCerbIntro();}
  }
  /* v1.5.3: O PORTÃO RESPONDE EM walk E sthor — lutar é opção, não prisão:
     mesmo com o segredo no seu encalço, chegue no portão e [Z] abre; ele
     desiste ao ver a folha ceder (ninguém fica preso — nem lutando) */
  if(GP.phase==='walk'||GP.phase==='sthor'){
    GP.near=gateDist(player.x,player.y)<210;
    if(GP.near){
      GP.waitT+=dt;
      /* v1.5.2 abre com [Z]; rede de segurança: encostado por 10s, o portão cede
         (progresso nunca fica preso — mesma filosofia da v1.5.1) */
      if(GP.zReq||held('interact')||GP.waitT>10){
        GP.zReq=false;GP.phase='opengate';GP.t=0;GP._opened=true;
        if(GP.sthorRef){const ix2=enemies.indexOf(GP.sthorRef);if(ix2>=0)enemies.splice(ix2,1);GP.sthorRef=null;ebullets.length=0;}
        GP.sthorDead=true;
        try{sfx.creak();sfx.rumble();}catch(e){}
        game.banner={type:'boss',txt:'O PORTÃO',sub:GP.waitT>10?'o calor o venceu — ele cede':'ele abre devagar — como sempre abriu',t:0,dur:2.6};
      }
    }else{GP.waitT=0;GP.zReq=false;}
  }
}
function drawGatePath(){
  /* ===== VULCÃO v1.5.5: FACE NORTE de basalto com o PORTÃO ENORME DE FRENTE
     no alto (você sobe e entra) + LAJE DE PEDRA de largura inteira com
     paredes dos dois lados — o Thor anda no chão, nunca "em cima do cenário" ===== */
  const gp=gatePos();
  const FR=gpFloorRect();
  /* ===== A FACE NORTE — o paredão fronteiro onde o portão está embutido
     (desce do topo da tela até a laje; é ele que você encara para entrar) ===== */
  {
    const wg=ctx.createLinearGradient(0,0,0,FR.y);
    wg.addColorStop(0,'#120704');wg.addColorStop(.55,'#22100a');wg.addColorStop(1,'#2a130a');
    ctx.fillStyle=wg;ctx.fillRect(0,0,W,FR.y);
    /* topos de colunas embutidos na face (determinísticos — nada tremula) */
    for(let k=0;k<7;k++){
      const cx=90+k*(W-180)/6,cy=52+((k*83)%90);
      ctx.fillStyle='#331609';ctx.fillRect(cx-13,cy,26,74);
      ctx.fillStyle='rgba(255,96,32,'+(.12+.09*Math.sin(game.t*2.1+cx*.013))+')';
      ctx.fillRect(cx-13,cy,26,3);
    }
    /* fissuras verticais de traçado fixo */
    ctx.strokeStyle='rgba(0,0,0,.32)';ctx.lineWidth=2;
    for(let k=0;k<6;k++){
      let cx=70+k*(W-140)/5,cy=40;
      ctx.beginPath();ctx.moveTo(cx,cy);
      for(let s=0;s<4;s++){cx+=((k*5+s*11)%15)-7;cy+=54+((k*3+s*7)%21);ctx.lineTo(cx,cy);}
      ctx.stroke();
    }
    /* a base da face pega a luz da lava da laje */
    ctx.fillStyle='rgba(255,106,40,.24)';ctx.fillRect(0,FR.y-3,W,3);
    ctx.fillStyle='rgba(255,170,90,.10)';ctx.fillRect(0,FR.y-7,W,4);
  }
  /* ===== A LAJE — o chão de pedra marrom-escura, de largura inteira ===== */
  const fg=ctx.createLinearGradient(0,FR.y,0,FR.b);
  fg.addColorStop(0,'#4a1e0c');fg.addColorStop(.45,'#31130a');fg.addColorStop(1,'#1d0a05');
  ctx.fillStyle=fg;ctx.fillRect(FR.x,FR.y,FR.r-FR.x,FR.b-FR.y);
  /* juntas de lajes grandes e irregulares (leitura de CHÃO, não de parede) */
  ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=1.5;
  let ri=0;
  for(let yy=FR.y+56;yy<FR.b;yy+=56,ri++){
    ctx.beginPath();ctx.moveTo(FR.x,yy);ctx.lineTo(FR.r,yy);ctx.stroke();
    for(let xx=FR.x+((ri%2)?80:20);xx<FR.r;xx+=160){
      ctx.beginPath();ctx.moveTo(xx,yy-56);ctx.lineTo(xx,yy);ctx.stroke();
    }
  }
  /* profundidade: a laje escurece ao longe (topo) e clareia perto do calor */
  const dp=ctx.createLinearGradient(0,FR.y,0,FR.y+120);
  dp.addColorStop(0,'rgba(10,3,2,.5)');dp.addColorStop(1,'rgba(10,3,2,0)');
  ctx.fillStyle=dp;ctx.fillRect(FR.x,FR.y,FR.r-FR.x,120);
  /* borda superior acesa pela lava (a base da face norte) */
  ctx.fillStyle='rgba(255,106,40,.55)';ctx.fillRect(FR.x,FR.y,FR.r-FR.x,3);
  ctx.fillStyle='rgba(255,170,90,.18)';ctx.fillRect(FR.x,FR.y+3,FR.r-FR.x,2);
  /* sombra interna nas bordas da laje */
  ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=6;
  ctx.strokeRect(FR.x+3,FR.y+3,FR.r-FR.x-6,FR.b-FR.y-6);
  /* ===== PAREDES laterais de basalto (dos DOIS lados — a laje não flutua) ===== */
  for(const sd of [{x:0,w:FR.x},{x:FR.r,w:W-FR.r}]){
    const wg2=ctx.createLinearGradient(sd.x,0,sd.x+sd.w,0);
    wg2.addColorStop(0,sd.w<70?'#1a0a05':'#1a0a05');wg2.addColorStop(1,'#241009');
    if(sd.x>0){wg2.addColorStop(0,'#241009');wg2.addColorStop(1,'#1a0a05');}
    ctx.fillStyle=wg2;ctx.fillRect(sd.x,FR.y-26,sd.w,H-FR.y+26);
    ctx.fillStyle='rgba(255,90,30,.22)';ctx.fillRect(sd.x+(sd.x>0?sd.w-2.5:0),FR.y-26,2.5,H-FR.y+26);
    /* topos de colunas embutidos na parede */
    for(let py=FR.y+40;py<FR.b-20;py+=150){
      const cx=sd.x+sd.w*.5;
      ctx.fillStyle='#3d1c0c';ctx.fillRect(cx-11,py,22,60);
      ctx.fillStyle='rgba(255,90,30,'+(.14+.10*Math.sin(game.t*2.4+py*.01))+')';
      ctx.fillRect(cx-11,py,22,3);
    }
  }
  /* faixa inferior de basalto (base da laje — o chão não flutua) */
  ctx.fillStyle='#180904';ctx.fillRect(0,FR.b,W,H-FR.b);
  ctx.fillStyle='rgba(255,90,30,.10)';ctx.fillRect(0,FR.b,W,2);
  /* fissuras de lava — pré-geradas, respiram devagar (CLIPADAS dentro da laje) */
  ctx.save();ctx.beginPath();ctx.rect(FR.x+2,FR.y+2,FR.r-FR.x-4,FR.b-FR.y-4);ctx.clip();
  for(const cr of GP.cracks||[]){
    const pul=.5+.5*Math.sin(game.t*1.8+cr.ph);
    ctx.strokeStyle='rgba(255,74,20,'+(.28+.4*pul)+')';
    ctx.lineWidth=cr.w;
    ctx.beginPath();
    for(let k=0;k<cr.pts.length;k++){
      const p=cr.pts[k];
      if(k===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
    }
    ctx.stroke();
    ctx.strokeStyle='rgba(255,196,90,'+(.14+.2*pul)+')';
    ctx.lineWidth=cr.w*.45;
    ctx.stroke();
  }
  /* poças de lava */
  for(const pl of GP.pools||[]){
    const pul=.6+.4*Math.sin(game.t*2.2+pl.ph);
    const lg=ctx.createRadialGradient(pl.x,pl.y,2,pl.x,pl.y,pl.rx*1.5);
    lg.addColorStop(0,'rgba(255,150,50,'+(.55*pul+.2)+')');
    lg.addColorStop(.55,'rgba(255,74,20,'+(.34*pul+.08)+')');
    lg.addColorStop(1,'rgba(255,74,20,0)');
    ctx.fillStyle=lg;
    ctx.beginPath();ctx.ellipse(pl.x,pl.y,pl.rx*1.5,pl.ry*1.9,0,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,214,120,'+(.5*pul+.15)+')';
    ctx.beginPath();ctx.ellipse(pl.x,pl.y,pl.rx*.55,pl.ry*.6,0,0,TAU);ctx.fill();
  }
  ctx.restore();
  /* brasas subindo */
  if(Math.random()<.5)particles.push({x:rnd(0,W),y:H-16,vx:rnd(-8,8),vy:rnd(-52,-18),life:rnd(1,2.2),t:0,r:rnd(1,2.6),c:Math.random()<.7?'#ff8f3d':'#ffd9a0',drag:1,glow:true});
  drawParticles();
  /* ===== O PORTÃO ENORME — de frente, no alto ===== */
  const gw=250,gh=390;
  ctx.save();
  /* aura de calor atrás do portão — v1.5.4: ao abrir, o miolo arde BRANCO */
  const aura=ctx.createRadialGradient(gp.x,gp.y,20,gp.x,gp.y,gw*.95);
  if(GP._opened){
    aura.addColorStop(0,'rgba(255,246,224,'+(.46+.14*Math.sin(game.t*5))+')');
    aura.addColorStop(.45,'rgba(255,176,64,'+(.30+.08*Math.sin(game.t*5))+')');
  }else{
    aura.addColorStop(0,'rgba(255,96,30,'+(.16+.05*Math.sin(game.t*2.6))+')');
  }
  aura.addColorStop(1,'rgba(255,96,30,0)');
  ctx.fillStyle=aura;ctx.fillRect(gp.x-gw,gp.y-gh,gw*2,gh*2);
  /* moldura de pedra escura (o portão é ENORME) */
  ctx.fillStyle='#241009';
  ctx.fillRect(gp.x-gw/2-16,gp.y-gh/2-16,gw+32,gh+32);
  ctx.strokeStyle='#4a2412';ctx.lineWidth=7;
  ctx.strokeRect(gp.x-gw/2-16,gp.y-gh/2-16,gw+32,gh+32);
  ctx.strokeStyle='#66300f';ctx.lineWidth=2.5;
  ctx.strokeRect(gp.x-gw/2-8,gp.y-gh/2-8,gw+16,gh+16);
  const open=GP.gate;
  const lw=(gw/2)*(1-open);
  /* v1.5.5: O DENTRO do portão — TOTALMENTE BRANCO com a luz já descrita:
     conforme as folhas recuam para FORA, o vão revelado é preenchido de
     branco pleno (com a bainha quente por trás) — não uma fenda fina */
  if(open>0){
    const rw=gw*open,rx=gp.x-rw/2;
    ctx.fillStyle='rgba(255,205,130,'+(.5*Math.min(1,open*1.2))+')';
    ctx.fillRect(rx-8,gp.y-gh/2,rw+16,gh);
    ctx.fillStyle='rgba(255,252,244,'+(.97*Math.min(1,open*1.5))+')';
    ctx.fillRect(rx,gp.y-gh/2,rw,gh);
  }
  /* duas folhas de pedra com bandas de ferro — v1.5.5: borda EXTERNA fixa, a
     folha recua para FORA (antes deslizava para o centro e parecia que FECHAVA) */
  for(const side of [-1,1]){
    if(lw<=0)break;
    const lx=side<0?gp.x-gw/2:gp.x+gw/2-lw; /* ancora de fora */
    ctx.fillStyle='#2f1509';
    ctx.fillRect(lx,gp.y-gh/2,lw,gh);
    ctx.strokeStyle='#5a2c12';ctx.lineWidth=3.5;
    ctx.strokeRect(lx,gp.y-gh/2,lw,gh);
    /* bandas de ferro */
    ctx.fillStyle='#1c0d06';
    for(let b=0;b<4;b++)ctx.fillRect(lx+2,gp.y-gh/2+24+b*(gh-40)/3,lw-4,7);
    ctx.strokeStyle='#7a3d16';ctx.lineWidth=1.5;
    ctx.strokeRect(lx+2,gp.y-gh/2+24,lw-4,(gh-40));
  }
  /* selo carmesim pulsante — se parte com a abertura (some rápido) */
  if(open<.22){
    const p=.5+.5*Math.sin(game.t*3.2);
    ctx.globalAlpha=(1-open/.22)*(.55+.35*p);
    ctx.fillStyle='#ff4a2a';ctx.font='16px IBM Plex Mono';ctx.textAlign='center';
    ctx.fillText('✕ ◈ ✕',gp.x,gp.y-gh/2+38);
    ctx.globalAlpha=1;
  }
  /* v1.5.4: A ABERTURA — no MEIO, branco brilhante; ao redor, amarelo alaranjado
     como chamas: a radiação inunda a tela a partir da fenda */
  if(GP._opened){
    const op=GP.phase==='opengate'?Math.max(.15,GP.gate):1;
    const rad=ctx.createRadialGradient(gp.x,gp.y,6,gp.x,gp.y,gw*(.55+.6*op));
    rad.addColorStop(0,'rgba(255,255,255,'+(.85*op)+')');
    rad.addColorStop(.26,'rgba(255,238,196,'+(.6*op)+')');
    rad.addColorStop(.52,'rgba(255,172,58,'+(.38*op)+')');
    rad.addColorStop(.78,'rgba(255,100,24,'+(.18*op)+')');
    rad.addColorStop(1,'rgba(255,100,24,0)');
    ctx.fillStyle=rad;
    ctx.fillRect(gp.x-gw*1.3,gp.y-gw*1.3,gw*2.6,gw*2.6);
  }
  /* línguas de chama nas beiradas INTERNAS das folhas (enquanto abre) —
     v1.5.5: seguem as novas bordas que recuam para fora */
  if(open>0&&open<1){
    const lw2=(gw/2)*(1-open);
    for(const side of [-1,1]){
      const ex=side<0?gp.x-gw/2+lw2:gp.x+gw/2-lw2;
      for(let k=0;k<3;k++){
        const fy=gp.y-gh/2+60+k*(gh-120)/2+Math.sin(game.t*7+k*2+side)*7;
        const fh=30+12*Math.sin(game.t*9+k*1.7+side*2);
        ctx.fillStyle='rgba(255,'+(150+k*32)+',40,'+(.5*open)+')';
        ctx.beginPath();
        ctx.moveTo(ex,fy+fh/2);
        ctx.quadraticCurveTo(ex+side*16,fy,ex+side*4,fy-fh/2);
        ctx.quadraticCurveTo(ex-side*7,fy,ex,fy+fh/2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  /* prompt de interação — logo abaixo da moldura (o portão está no alto) */
  if((GP.phase==='walk'||GP.phase==='sthor')&&GP.near){
    const p=.72+.28*Math.sin(game.t*5);
    txt(keyLabel(keybinds.interact[0])+' · ABRIR O PORTÃO',gp.x,gp.y+gh/2+46,MONO,12,'rgba(255,120,60,'+p+')','center',3);
  }
  /* v1.5.3: INIMIGOS VISÍVEIS — O THOR QUE NÃO DESCEU nunca mais é invisível
     (desenhado igual em qualquer sala: silhueta roxa + barra de vida) */
  for(const e of enemies)if(!e.dead)drawEnemy(e);
  drawPickups();
  if(!player.dead)drawPlayer();
  drawBullets();drawEBullets();
  x_txt((GP.phase==='walk'||GP.phase==='sthor')?(GP.near?'o portão te espera — interaja para abrir':(GP.phase==='sthor'?'ele te caça — lute, corra, ou abra o portão':'suba a laje — o portão espera no alto')):'',W/2,H-34,10,'#c98860');
  /* v1.5.5: o VÉU DE ENTRADA — o Thor entra no vão e o BRANCO total o engole
     (a cutscene antiga começa quando ele entra) */
  if(GP.phase==='enter'){
    const v=clamp((FR.y+70-player.y)/130,0,1);
    if(v>0){
      ctx.fillStyle='rgba(255,252,244,'+(.97*v)+')';ctx.fillRect(0,0,W,H);
    }
  }
  if(game.roomFade>0){ctx.fillStyle='rgba(3,2,4,'+clamp(game.roomFade,0,1)+')';ctx.fillRect(0,0,W,H);}
}

/* ---------- CUTSCENE DE ENTRADA DO CÉRBERO — v1.5.7 O GUARDIÃO DA PASSAGEM ----------
   O Thor SAI DO PORTÃO POR BAIXO — o vão fica no CHÃO da arena, ele emerge
   SUBINDO e fica LÁ EMBAIXO; assim o encontro é com o CÉRBERO NA FRENTE dele
   (centro-alto). NO FUNDO, o CÉRBERO ANTIGO DE VERDADE (o sprite real do
   boss) DORME — olhos fechados, cabeças recolhidas, roncando — e vai
   ACORDANDO BEM DEVAGAR enquanto o texto antigo aparece, letra por letra
   LENTO: "Cérbero, fera cruel e disforme, late como um cão com suas três
   goelas." Quando o texto acaba, A APRESENTAÇÃO entra (drawCerbCard): a tela
   escurece rápido, o som ambiente fica ABAFADO, a inscrição pequena surge,
   CERBERUS irrompe com impacto grave + expansão de luz + rugido, a linha
   carmesim revela o epíteto — e o nome some LENTO quando o chefe se move.
   Sem cortes, sem tela travada, relógio de segurança sempre. */
const CI={t:0,snap:false,slam:false};
const CERB_L1='Cérbero, fera cruel e disforme,';
const CERB_L2='late como um cão com suas três goelas.';
const CERB_WK=[3.0,5.2,7.4];   /* v1.5.7: cada cabeça ergue AINDA MAIS devagar */
const CERB_WK_RAMP=3.4;        /* v1.5.7: a subida em si é lenta (era 2.4) */
const CERB_TXT_T0=1.2;         /* v1.5.7: o texto antigo começa */
const CERB_TXT_RATE=8.5;       /* v1.5.7: letra por letra BEM MAIS LENTO (era 13) */
const CERB_TITLE_T=11.0;       /* v1.5.7: o texto termina → a apresentação entra */
const CERB_CARD_FIGHT=3.6;     /* v1.5.7: o nome some LENTO quando o chefe começa a se mover */
function startCerbIntro(){
  game.state='cerbintro';
  CI.t=0;CI.snap=false;CI.slam=false;CI._a=0;CI._snapAt=0;CI._titleAt=0;
  CI._w0=0;CI._w1=0;CI._w2=0;CI._sn=0;CI._imp=0;CI._impT=0;
  ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
  game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain=game.absRects[0];
  /* v1.5.4: a ARENA do Cérbero = o mesmo visual da PENUMBRA INFERNAL (bem lá
     em cima) — região penumbra + andar 4 fazem o chão nascer ebranquecido,
     queimando nas bordas (o mesmo buildRoomFloor do andar de cima) */
  game.region='penumbra';
  /* v1.5.4: blindagem — na arena NÃO existe escada de andar (a máquina de
     escadas da penumbra não pode recriá-la aqui no meio da luta) */
  game._arenaLock=true;game.floorStair=null;game.vulcStair=null;game._stairDescend=null;
  buildRoomFloor();
  game.doors=[];game.portal=null;game.decor=[];
  enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];texts=[];
  /* v1.5.7: o Thor EMERGE do vão POR BAIXO — sai do chão subindo e fica
     LÁ EMBAIXO (o Cérbero fica NA FRENTE dele, centro-alto da arena) */
  player.x=W*.5;player.y=H-96;player.mvx=0;player.mvy=0;player.angle=-Math.PI/2;
  game.roomFade=1;game.banner=null;
  /* v1.5.6: O CÉRBERO ANTIGO DE VERDADE — o sprite real do boss DORMINDO
     no fundo da arena (resetBoss + introLock: nenhum sistema dele acorda
     sozinho; a cena comanda o despertar cabeça por cabeça) */
  resetBoss();boss.active=true;boss.introLock=true;boss.dying=false;
  boss.scale=1;boss.fade=1;boss.barT=0;boss.phase2=false;
  boss.x=W*.5;boss.y=H*.40;boss.angle=Math.PI/2; /* v1.5.7: NA FRENTE do Thor */
  for(const h of boss.heads){
    const sl=boss.angle+h.baseAng;
    h.wake=0;h.howlT=0;h.flash=0;h.state='idle';h.t=0;h.cd=0;h.mouth=0;
    h.desp=false;h.alive=true;h.vx=0;h.vy=0;
    h.hx=boss.x+Math.cos(sl)*(boss.r*.4+14);
    h.hy=boss.y+Math.sin(sl)*(boss.r*.4+14)+62;
    h.face=Math.PI/2+.35;h.tx=h.hx;h.ty=h.hy;
  }
  try{noiseSfx(1.4,.05,90,'lowpass');}catch(e){}
}
const CERB_PT={x:0,y:0};
function updateCerbIntro(dt){
  CI.t+=dt;
  updateMusicZone();
  const t=CI.t;
  CERB_PT.x=W*.5;CERB_PT.y=H*.40;
  /* silêncio: só o portão rangendo e os RONCOS da fera dormindo */
  if(t>1.6&&!CI._a){CI._a=1;try{sfx.echo();}catch(e){}}
  if(t>1.0&&t<7.0&&(!CI._sn||t-CI._sn>1.05)){CI._sn=t;try{sfx.snore();}catch(e){}} /* v1.5.7: ronca o acordar longo */
  /* v1.5.7: o Thor SAI do vão de baixo SUBINDO — caminhada curta e SCRIPTED
     (a cena comanda; nenhum input exigido; nada prende); fica lá EMBAIXO */
  if(t<2.6&&player.y>H*.74){
    player.y=Math.max(H*.74,player.y-140*dt);
    player.mvx=0;player.mvy=-1;player.walkT+=dt*7;player.angle=-Math.PI/2;
  }else{player.mvx=0;player.mvy=0;}
  /* o portão se FECHA atrás de Thor — não tem mais volta */
  if(!CI.slam&&t>3.0){
    CI.slam=true;CI._snapAt=t;
    try{sfx.gate();sfx.rumble();}catch(e){}
    game.shake=Math.max(game.shake,10);
    texts.push({x:W/2,y:H*.15,txt:'o portão se fechou. não há mais volta.',t:0,life:2.6,c:'#6e6357',size:11,disp:true});
  }
  /* v1.5.7: ACORDAR BEM LENTO — o sprite antigo dorme e cada cabeça ergue no
     SEU tempo (h.wake abre os olhos devagar no drawHead; as poses são as
     mesmas fórmulas do intro clássico, agora com o relógio da cena) */
  for(let i=0;i<boss.heads.length;i++){
    const h=boss.heads[i];
    const w=smooth(ramp(t,CERB_WK[i],CERB_WK[i]+CERB_WK_RAMP));
    h.wake=w;
    const sl=boss.angle+h.baseAng;
    const sleepX=boss.x+Math.cos(sl)*(boss.r*.4+14);
    const sleepY=boss.y+Math.sin(sl)*(boss.r*.4+14)+62+Math.sin(game.t*.85+h.ph)*5;
    const upX=boss.x+Math.cos(sl)*175,upY=boss.y+Math.sin(sl)*175;
    h.tx=lerp(sleepX,upX,w);h.ty=lerp(sleepY,upY,w);
    h.vx+=((h.tx-h.hx)*60-h.vx*9)*dt;h.vy+=((h.ty-h.hy)*60-h.vy*9)*dt;
    h.hx+=h.vx*dt;h.hy+=h.vy*dt;
    const sleepFace=Math.PI/2+.35+Math.sin(game.t*.5+h.ph)*.12;
    const awakeFace=Math.atan2(player.y-h.hy,player.x-h.hx);
    h.face=lerpAngle(h.face,lerpAngle(sleepFace,awakeFace,w),1-Math.exp(-8*dt));
    h.mouth=(.04+.035*Math.sin(game.t*1.1+h.ph))*(1-w)+.12*w;
    if(w>.05&&w<1&&Math.random()<dt*10)particles.push({x:h.hx+rnd(-14,14),y:h.hy+rnd(-10,6),vx:0,vy:-30,life:.4,t:0,r:2,c:h.c,glow:true});
    if(t>CERB_WK[i]&&!CI['_w'+i]){CI['_w'+i]=1;try{sfx.growl();}catch(e){}}
  }
  /* v1.5.6: Zzz — o sono da fera é VISÍVEL (flutuam da cabeça central
     enquanto a maioria ainda dorme; servem nos dois modos, PNG e vetor) */
  const wavg=(boss.heads[0].wake+boss.heads[1].wake+boss.heads[2].wake)/3;
  if(wavg<.55){
    CI._zzT=(CI._zzT||0)+dt;
    if(CI._zzT>.55){CI._zzT=0;CI.zz=(CI.zz||[]).concat([{t:0,ph:rnd(6)}]);}
  }
  if(CI.zz)for(let i=CI.zz.length-1;i>=0;i--){CI.zz[i].t+=dt;if(CI.zz[i].t>2)CI.zz.splice(i,1);}
  /* FIM DO TEXTO → A APRESENTAÇÃO DO BOSS (v1.5.7: a tela escurece RÁPIDO,
     o som ambiente fica ABAFADO e o cartão entra pelo drawCerbCard) */
  if(!CI.snap&&t>CERB_TITLE_T){
    CI.snap=true;CI._titleAt=t;CI._imp=0;CI._impT=0;
    game.shake=Math.max(game.shake,8);
    try{window.__MUSIC_MUFFLE&&window.__MUSIC_MUFFLE(1);}catch(e){} /* som ambiente ABAFADO */
    game._cerbCard={mode:1,t:0}; /* o cartão assume a apresentação */
  }
  /* v1.5.7: O IMPACTO — o nome CERBERUS irrompe no centro: impacto sonoro
     grave + expansão de luz + ELE RUGINDO (o cartão desenha o clarão) */
  if(CI.snap&&!CI._imp&&t-CI._titleAt>1.05){
    CI._imp=1;CI._impT=t;
    try{sfx.roar();blip('sine',55,30,1.6,.2);noiseSfx(1.1,.08,90,'lowpass');blip('sine',110,55,.9,.12);}catch(e){}
    game.shake=Math.max(game.shake,14);
  }
  /* A LUTA COMEÇA — o nome revelado; o chefe se MOVE e o cartão some LENTO
     (relógio de segurança: mesmo que algo falhe, a luta abre em 18s) */
  if((CI.snap&&CI._titleAt&&t-CI._titleAt>CERB_CARD_FIGHT)||t>18){
    if(game._cerbCard)game._cerbCard.t=CERB_CARD_FIGHT; /* o fade lento começa exatamente quando o chefe se move */
    game._cerbFight=true;
    game._skipBossCine=true;
    game._cerbP1=1; /* o cartão vence — o banner da FASE I não o substitui */
    beginBossIntro();
    try{window.__MUSIC_MUFFLE&&window.__MUSIC_MUFFLE(0);}catch(e){} /* o som volta */
    try{sfx.howl();game.shake=14;}catch(e){}
  }
}
function drawCerbIntro(){
  const t=CI.t;
  /* v1.5.4: a arena = PENUMBRA INFERNAL — o mesmo chão ebranquecido queimando
     nas bordas do andar de cima (o roomFloor já nasce assim; nada de arena
     escura) */
  if(roomFloor)ctx.drawImage(roomFloor,ROOM.x,ROOM.y);
  else{ctx.fillStyle='#050307';ctx.fillRect(0,0,W,H);}
  /* v1.5.7: o PORTÃO ENORME fica POR BAIXO (no chão da arena) — abre devagar
     e se fecha de vez após o Thor sair; luz branca no miolo, âmbar ao redor */
  let open=clamp((t-.6)/2.2,0,1);
  if(CI.slam)open=Math.max(0,open-(t-CI._snapAt-1.2)*1.8);
  const gx=W*.5,gy=H-10,gw=190,gh=300;
  if(open>0){
    const gr=ctx.createRadialGradient(gx,gy,4,gx,gy,gw*1.1);
    gr.addColorStop(0,'rgba(255,255,255,'+(.7*open)+')');
    gr.addColorStop(.4,'rgba(255,190,90,'+(.34*open)+')');
    gr.addColorStop(1,'rgba(255,120,40,0)');
    ctx.fillStyle=gr;ctx.fillRect(gx-gw*1.2,gy-gh*2,gw*2.4,gh*2);
    /* o interior revelado é TOTALMENTE BRANCO — uma coluna de luz do chão */
    const rw=gw*open;
    ctx.fillStyle='rgba(255,252,244,'+(.9*open)+')';ctx.fillRect(gx-rw/2,gy-gh,rw,gh);
  }
  const lw=(gw/2)*(1-open);
  /* folhas ancoradas pela borda EXTERNA — recuam para FORA ao abrir */
  ctx.fillStyle='#241a30';
  ctx.fillRect(gx-gw/2-6,gy-gh,lw+6,gh); /* esquerda: borda externa fixa */
  ctx.fillRect(gx+gw/2-lw,gy-gh,lw+6,gh); /* direita: borda externa fixa */
  ctx.strokeStyle='#4a3a5a';ctx.lineWidth=4;
  ctx.strokeRect(gx-gw/2-6,gy-gh,lw+6,gh);ctx.strokeRect(gx+gw/2-lw,gy-gh,lw+6,gh);
  ctx.fillStyle='#6e6357';ctx.font='13px IBM Plex Mono';ctx.textAlign='center';
  ctx.fillText('✕ ◈ ✕',gx,gy-gh+34);
  /* v1.5.6: O CÉRBERO ANTIGO DE VERDADE — o sprite real do boss (corpo,
     pernas, cauda, pescoços e as três cabeças do drawHead) DORMINDO:
     wake=0 mantém os olhos FECHADOS e as cabeças recolhidas; conforme o
     updateCerbIntro ergue cada cabeça, os olhos abrem devagar. */
  drawBoss();
  const awake=CI.snap?1:0;
  /* brasas sobem — mais vivas depois do snap */
  if(Math.random()<.3+awake*.3)particles.push({x:rnd(W*.05,W*.75),y:H-10,vx:rnd(-6,6),vy:rnd(-34,-12),life:rnd(1,2),t:0,r:rnd(1,2.2),c:Math.random()<.5?'#ff8f3d':'#d9465a',drag:1,glow:true});
  drawParticles();
  if(!player.dead)drawPlayer();
  /* v1.5.6: os Zzz sobem da cabeça central enquanto a fera dorme */
  if(CI.zz&&CI.zz.length){
    const hc=boss.heads[1]||boss.heads[0];
    for(const z of CI.zz){
      const k=z.t/2;
      ctx.save();
      ctx.globalAlpha=(1-k)*.8;
      txt(k<.5?'z':'Z',hc.hx+34+Math.sin(z.ph+k*5)*10,hc.hy-26-k*58,MONO,13+k*7,'#9c8f7c','center',1);
      ctx.restore();
    }
  }
  /* v1.5.7: O TEXTO ANTIGO — máquina de escrever LENTA, duas linhas, caixa de
     legenda. Começa depois que a cena assenta e termina exatamente quando a
     APRESENTAÇÃO entra (CERB_TITLE_T) */
  if(t>CERB_TXT_T0&&t<CERB_TITLE_T+.4){
    const n=Math.floor((t-CERB_TXT_T0)*CERB_TXT_RATE);
    const full=CERB_L1.length+1+CERB_L2.length;
    const s1=CERB_L1.slice(0,Math.min(CERB_L1.length,n));
    const s2=n>CERB_L1.length+1?CERB_L2.slice(0,n-CERB_L1.length-1):'';
    const a=Math.min(clamp((t-CERB_TXT_T0)/.4,0,1),1-clamp((t-(CERB_TITLE_T-.5))/.5,0,1));
    const bw=620,bh=92,bx0=W/2-bw/2,by0=H-198;
    ctx.save();ctx.globalAlpha=a*.94;
    ctx.fillStyle='rgba(8,5,10,.86)';ctx.fillRect(bx0,by0,bw,bh);
    ctx.strokeStyle='rgba(230,218,196,.25)';ctx.lineWidth=1.5;ctx.strokeRect(bx0,by0,bw,bh);
    const cur=(n<full&&(game.t*2.6%1)<.55)?'\u258c':'';
    txt(s1+(n<=CERB_L1.length?cur:''),W/2,by0+32,MONO,15,'#e6dac4','center',.4);
    if(n>CERB_L1.length)txt(s2+cur,W/2,by0+60,MONO,15,'#e6dac4','center',.4);
    ctx.restore();
  }
  /* v1.5.7: a APRESENTAÇÃO (o cartão) é desenhada POR CIMA de tudo pelo
     render (hook global) — nada de título desenhado aqui dentro */
  if(game.roomFade>0){ctx.fillStyle='rgba(3,2,4,'+clamp(game.roomFade,0,1)+')';ctx.fillRect(0,0,W,H);}
}

/* ---------- A APRESENTAÇÃO DO BOSS — v1.5.7 O GUARDIÃO DA PASSAGEM ----------
   O cartão dramático que abre as DUAS lutas do Cérbero (antigo = mode 1 e
   remake = mode 2), desenhado POR CIMA de qualquer cena (cerbintro, bossintro
   e play) pelo hook do render:
   1) a tela escurece RÁPIDO e o som ambiente fica ABAFADO (mode 1);
   2) o pequeno título surge primeiro, quase como uma INSCRIÇÃO (só no antigo):
      "O GUARDIÃO DA PASSAGEM";
   3) CERBERUS irrompe no centro com impacto sonoro grave + breve expansão de
      luz + o rugido dele;
   4) a LINHA CARMESIM desenha-se e revela o EPÍTETO
      ("O CÃO DAS TRÊS SENTENÇAS" · no remake "O CÃO NEGRO DO JUÍZO CARMESIM");
   5) o nome desaparece LENTO quando o chefe começa a se mover.
   Fonte: IM FELL ENGLISH SC — a letra de pergaminho do guardião. */
function drawCerbCard(){
  const cc=game._cerbCard;if(!cc)return;
  /* relógio próprio pelo game.t (congela com a pausa; avança suave) */
  if(cc._lt===undefined)cc._lt=game.t;
  const dt=Math.max(0,Math.min(.1,game.t-cc._lt));cc._lt=game.t;cc.t+=dt;
  const t=cc.t;
  /* 5) o NOME some LENTO quando o chefe se move — fade longo, cartão morre */
  const fade0=cc.mode===1?CERB_CARD_FIGHT:3.9;
  const life=cc.mode===1?CERB_CARD_FIGHT+1.8:5.7;
  const a=t<fade0?1:1-clamp((t-fade0)/(life-fade0),0,1);
  if(t>=life){game._cerbCard=null;return;}
  /* 1) o VÉU — a tela escurece RÁPIDO (antigo) / BEM SUTIL (remake, o véu da
     transformação já escurece o cenário devagar em c3Draw) */
  const veil=cc.mode===1?clamp(t/.42,0,1)*.52:clamp(t/.9,0,1)*.14;
  ctx.save();
  ctx.fillStyle='rgba(4,2,6,'+(veil*a)+')';ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=a;
  /* 3) A EXPANSÃO DE LUZ — o clarão que acompanha o impacto do nome */
  const impT=cc.mode===1?1.05:0;
  const lt=t-impT;
  if(lt>=0&&lt<1.6){
    const lk=clamp(lt/1.6,0,1);
    const lr=60+lk*440, la=(1-lk)*.5;
    const lg=ctx.createRadialGradient(W/2,H*.42,4,W/2,H*.42,lr);
    lg.addColorStop(0,'rgba(255,251,240,'+(la*.9)+')');
    lg.addColorStop(.5,'rgba(255,224,170,'+(la*.4)+')');
    lg.addColorStop(1,'rgba(255,190,110,0)');
    ctx.fillStyle=lg;ctx.beginPath();ctx.arc(W/2,H*.42,lr,0,TAU);ctx.fill();
  }
  /* 2) A INSCRIÇÃO — o pequeno título surge primeiro, quase gravado em pedra */
  if(cc.mode===1){
    const ia=clamp((t-.15)/.7,0,1);
    if(ia>0){
      ctx.globalAlpha=a*ia*.9;
      txt('O GUARDIÃO DA PASSAGEM',W/2,H*.285,FELL,17,'#9c8f7c','center',7);
      ctx.globalAlpha=a*ia*.55;
      ctx.strokeStyle='rgba(156,143,124,.7)';ctx.lineWidth=1;
      const lw2=180*ia;
      ctx.beginPath();ctx.moveTo(W/2-lw2,H*.285+24);ctx.lineTo(W/2+lw2,H*.285+24);ctx.stroke();
    }
  }
  /* 3) O NOME — CERBERUS irrompe no centro (surge com peso e assenta) */
  const na=clamp((t-impT)/.38,0,1);
  if(na>0){
    const ns=1+.38*(1-clamp((t-impT)/.55,0,1));
    ctx.save();
    ctx.globalAlpha=a*na;
    ctx.translate(W/2,H*.42);ctx.scale(ns,ns);
    txt('CERBERUS',0,0,FELL,74,'#e6dac4','center',4);
    ctx.restore();
  }
  /* 4) A LINHA CARMESIM desenha-se — e revela o EPÍTETO */
  const lka=clamp((t-(impT+.9))/.55,0,1);
  if(lka>0){
    ctx.strokeStyle='rgba(165,42,58,'+(a*.95)+')';ctx.lineWidth=2;
    const lw3=210*lka;
    ctx.beginPath();ctx.moveTo(W/2-lw3,H*.42+58);ctx.lineTo(W/2+lw3,H*.42+58);ctx.stroke();
    const ea=clamp((t-(impT+1.25))/.55,0,1);
    if(ea>0){
      ctx.globalAlpha=a*ea;
      txt(cc.mode===1?'O CÃO DAS TRÊS SENTENÇAS':'O CÃO NEGRO DO JUÍZO CARMESIM',W/2,H*.42+94,FELL,25,'#d9465a','center',4);
    }
  }
  ctx.restore();
}

/* ---------- GARGANTA VULCÂNICA (a fase extra difícil) ---------- */
const VUL={pools:[],vents:[],t:0};
function startGarganta(){
  game.cerbSlain=true;
  /* v1.4.3 CORREÇÃO: o ending deixa playerAlpha=0 (Thor entra no portão
     desvanecendo) — e nada o restaurava. Thor ficava INVISÍVEL na Garganta,
     no corredor azul, no barco e no Limbo inteiro. */
  game.playerAlpha=1;
  /* v1.4.4 CORREÇÃO: a barra de vida do CÉRBERO aparecia na Garganta — o
     ending reativa o chefe antigo (boss.active=true) e nada o desligava. */
  boss.active=false;boss.barT=0;boss.frenzyActive=false;boss.phase2=false;
  try{if(window.__RM&&window.__RM.c3){window.__RM.c3=null;game._rmSent=0;}}catch(e){}
  game.region='vulcan';
  game.floor=5;
  game.limboPhase=0;
  game._ferreiroDead=0;game.vulcStair=null;game._stairDescend=null; /* v1.4.4: escada do frio zerada */
  game.usedMinis=[];
  game.portal=null;game.extraIdx=-1;game.rkP2=false;game.rkUlt=null;
  game.mapRooms=genMap();game.seenGlyphs=[];
  game.roomIdx=-1;game.roomFade=1;
  enemies=[];ebullets=[];bullets=[];pickups=[];particles=[];texts=[];
  game.state='play';
  enterRoom(0,null);
  const L=zoneLabel();
  game.banner={type:'circle',txt:'DEPOIS DO GUARDIÃO',name:'A GARGANTA VULCÂNICA',sub:L.sub,t:0,dur:4.4};
  try{sfx.rumble();sfx.roar();game.flash=.6;game.shake=16;}catch(e){}
  texts.push({x:W/2,y:H*.24,txt:'o calor te cospe para dentro',t:0,life:3,c:'#ff8f3d',size:12,disp:true});
}
function genVulcanRoom(){
  /* poças de lava e respiradouros — semeados pela sala (determinístico) */
  VUL.pools=[];VUL.vents=[];
  if(game.region!=='vulcan')return;
  const rs=game.absRects,m=game.absMain;
  const seed=(game.roomIdx+1)*97;
  const nr=2+(seed%2);
  for(let i=0;i<nr;i++){
    const p=x_ptInRoom(70);
    VUL.pools.push({x:p.x,y:p.y,r:34+(seed*7+i*31)%22,t:0});
  }
  VUL.vents.push({x:x_ptInRoom(60).x,y:x_ptInRoom(60).y,t:rnd(3,6),tel:0});
}
function updateVulcanHazards(dt){
  if(game.region!=='vulcan'||game.state!=='play'||player.dead)return;
  VUL.t+=dt;
  /* poças queimam devagar (justas: dano contínuo leve + telegrafia visual) */
  for(const p of VUL.pools){
    if(x_dist(player.x,player.y,p.x,p.y)<p.r&&player.inv<=0){
      hurtPlayer();player.slowT=Math.max(player.slowT,.4);
      try{noiseSfx(.2,.04,200,'lowpass');}catch(e){}
    }
  }
  /* erupções com aviso claro */
  for(const v of VUL.vents){
    v.t-=dt;
    if(v.t<=0&&v.tel<=0){v.tel=1.3;try{noiseSfx(.5,.05,120,'lowpass');}catch(e){}}
    if(v.tel>0){
      v.tel-=dt;
      if(v.tel<=0){
        /* ERUPÇÃO — coluna de brasas em área */
        shockwaves.push({x:v.x,y:v.y,r:10,vr:520,maxR:120,t:0,dur:.4,c:'#ff8f3d'});
        for(let i=0;i<22;i++)particles.push({x:v.x+rnd(-14,14),y:v.y,vx:rnd(-60,60),vy:rnd(-260,-90),life:rnd(.5,1),t:0,r:rnd(2,4),c:pick(['#ff8f3d','#d9465a','#ffd9a0']),drag:.94,glow:true});
        try{sfx.boom();}catch(e){}
        if(x_dist(player.x,player.y,v.x,v.y)<130)hurtPlayer();
        v.t=rnd(4,7);
      }
    }
  }
}
function drawVulcanHazards(){
  if(game.region!=='vulcan')return;
  for(const p of VUL.pools){
    const pul=.6+.4*Math.sin(game.t*2+p.x);
    ctx.save();
    ctx.globalAlpha=.85;
    const g=ctx.createRadialGradient(p.x,p.y,4,p.x,p.y,p.r);
    g.addColorStop(0,'#ffd9a0');g.addColorStop(.55,'#ff8f3d');g.addColorStop(1,'rgba(120,20,8,.0)');
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*pul,0,TAU);ctx.fill();
    ctx.restore();
  }
  for(const v of VUL.vents){
    if(v.tel>0){
      const k=1-v.tel/1.3;
      ctx.save();
      ctx.globalAlpha=.4+.5*Math.sin(game.t*18);
      ctx.strokeStyle='#ff8f3d';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(v.x,v.y,30+70*k,0,TAU);ctx.stroke();
      ctx.restore();
    }
  }
}

/* ---------- CORREDOR AZULADO → CARONTE ---------- */
const BC={t:0,phase:'walk',fog:0};
function startBlueCorr(){
  game.state='bluecorr';
  game._bcActive=true; /* o recusa de Caronte volta para cá */
  game._arenaLock=false; /* v1.5.4: saiu da arena do Cérbero — escadas voltam a existir */
  game.playerAlpha=1; /* v1.4.3: Thor visível no corredor (defesa em profundidade) */
  BC.t=0;BC.phase='walk';BC.fog=0;
  ROOM.x=0;ROOM.y=0;ROOM.w=W;ROOM.h=H;ROOM.inverted=false;
  game.absRects=[{x:0,y:0,w:W,h:H}];game.absMain=game.absRects[0];
  buildRoomFloor();
  game.doors=[];game.portal=null;game.decor=[];game.roomWindow=null;game.puzzle=null;
  enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];texts=[];
  player.x=70;player.y=H*.6;player.mvx=0;player.mvy=0;
  game.roomFade=1;
  try{sfx.echo();blip('sine',220,140,1.2,.08);}catch(e){}
  game.banner={type:'circle',txt:'O CALOR AINDA INSISTE',name:'O CORREDOR AZULADO',sub:'o vermelho da garganta se apaga devagar, passo a passo. ao fundo, um remo.',t:0,dur:3.6};
}
function updateBlueCorr(dt){
  BC.t+=dt;
  updateMusicZone();
  if(BC.phase==='walk'){
    const ax=(held('right')?1:0)-(held('left')?1:0);
    const ay=(held('down')?1:0)-(held('up')?1:0);
    const l=Math.hypot(ax,ay);
    if(l){
      const spd=200;
      player.x+=ax/l*spd*dt;player.y+=ay/l*spd*dt;
      player.mvx=ax/l;player.mvy=ay/l;player.walkT+=dt*7;
      player.angle=Math.atan2(player.mvy,player.mvx);
    }
    player.x=x_clamp(player.x,60,W-60);player.y=x_clamp(player.y,90,H-60);
    /* v1.4.5: o calor da Garganta INSISTE — o corredor começa visivelmente
       avermelhado e esfria LENTAMENTE (curva easeIn: o vermelho segura no
       começo e a névoa fria só toma conta perto do barco). */
    BC.fog=Math.pow(clamp(player.x/(W*.92),0,1),1.45);
    /* brasas residuais no começo — morrem conforme o corredor esfria */
    if(BC.fog<.8&&Math.random()<(1-BC.fog)*.5)particles.push({x:rnd(0,W*.7),y:rnd(H*.55,H-40),vx:rnd(-10,10),vy:rnd(-70,-24),life:rnd(.7,1.6),t:0,r:rnd(1,2.6),c:pick(['#ff8f3d','#d9465a','#ffd9a0']),drag:.96,glow:true});
    if(Math.random()<.4)particles.push({x:rnd(0,W),y:rnd(H*.2,H),vx:rnd(-8,8),vy:rnd(-6,6),life:rnd(1.5,3),t:0,r:rnd(2,5),c:'rgba(127,184,255,.12)',drag:.99,glow:false});
    /* findou o corredor — o barco */
    if(player.x>W*.78){
      BC.phase='boat';
      game.pendingLimboFloor=6; /* o LIMBO começa no andar 6 (4 fases: 6-9) */
      startCaronteEncounter();
    }
  }
}
function drawBlueCorr(){
  const f=BC.fog;
  /* v1.4.5: o vermelho da Garganta continua VIVO no começo do corredor
     (antes as cores iniciais eram quase pretas — o jogador não via o calor)
     e só esfria devagar até o azul do rio. */
  const top=lerpColor('#2c1014','#0a1016',f);
  const mid=lerpColor('#3b161a','#0e1a26',f);
  const bot=lerpColor('#4a1c1a','#12222e',f);
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,top);g.addColorStop(.55,mid);g.addColorStop(1,bot);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  /* paredes: quentes no começo, perdendo o calor com a passagem */
  const wa=lerpColor('#ff8f3d','#bed8e8',f);
  ctx.fillStyle='rgba('+wa.slice(4,-1)+','+(.14-(.09*f)).toFixed(3)+')';
  for(let i=0;i<8;i++){const x=60+i*(W-120)/7;ctx.fillRect(x-3,80,6,H-160);}
  /* névoa fria — só engrossa na segunda metade da caminhada */
  const fa=Math.max(0,f-.18)/.82;
  ctx.fillStyle='rgba(127,184,255,'+(.02+.13*fa)+')';
  ctx.fillRect(0,0,W,H);
  drawParticles();
  /* o barco de Caronte ao fundo */
  const bx=W*.86,by=H*.62;
  ctx.save();
  ctx.globalAlpha=.8;
  ctx.fillStyle='#0a0e14';
  ctx.beginPath();ctx.ellipse(bx,by,54,16,0,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(191,216,232,.4)';ctx.lineWidth=2;ctx.stroke();
  /* silhueta do barqueiro */
  ctx.fillStyle='#05070a';
  ctx.beginPath();ctx.arc(bx,by-26,10,0,TAU);ctx.fill();
  ctx.fillRect(bx-3,by-20,6,20);
  ctx.restore();
  if(!player.dead)drawPlayer();
  x_txt('[D] chegue ao barco',W/2,H-40,10,'rgba(191,216,232,.5)');
  if(game.roomFade>0){ctx.fillStyle='rgba(3,2,4,'+clamp(game.roomFade,0,1)+')';ctx.fillRect(0,0,W,H);}
}
/* ================================================================
   7. NOVOS CHEFES (xboss) — Juiz Sem Rosto (final do Limbo),
   Ferreiro das Almas (Garganta), Anjo Acorrentado, Serpente que
   Engole Estrelas (secreta), Thor que Não Desceu (secreto), e o
   Cervo Desfigurado (encontro de exploração, sem combate).
   Todos nascem por spawnEnemy com type próprio e rodam IA aqui.
   ================================================================ */
const XBOSS_TYPES=['juiz','ferreiro','anjo','serp','sthor'];
function setupXBoss(e,type){
  const c=game.threat||0;
  e.type=type;e.xboss=true;e.maxHp=e.maxHp||e.hp;
  if(type==='juiz'){
    e.r=44;e.hp=Math.round((game.hard?9200:6800)+c*160);e.maxHp=e.hp;e.sp=40;
    e.xst='idle';e.xt=0;e.pat=null;e.pats=['condena','bailios','gale','veredicto'];e.patIdx=-1;e.xdata=null;e.atkT=1.6;
  }else if(type==='ferreiro'){
    e.r=40;e.hp=Math.round((game.hard?6400:4600)+c*120);e.maxHp=e.hp;e.sp=34;
    e.xst='idle';e.xt=0;e.pats=['martelo','laminas','bigorna','turret'];e.patIdx=-1;e.xdata=null;e.atkT=1.8;e.forja=0;
  }else if(type==='anjo'){
    e.r=36;e.hp=Math.round((game.hard?5600:4000)+c*100);e.maxHp=e.hp;e.sp=30;
    e.xst='idle';e.xt=0;e.pats=['correntes','halo','julgamento'];e.patIdx=-1;e.xdata=null;e.atkT=2;
    e.chains=[null,null,null,null];e.chainsHp=4;
  }else if(type==='serp'){
    e.r=42;e.hp=Math.round((game.hard?7200:5400)+c*140);e.maxHp=e.hp;e.sp=46;
    e.xst='idle';e.xt=0;e.pats=['engolir','estrelas','constricao'];e.patIdx=-1;e.xdata=null;e.atkT=1.7;
    e.dark=0; /* a sala escurece conforme engole estrelas */
  }else if(type==='sthor'){
    /* cópia sombria: herda a AMEAÇA da build do jogador */
    e.r=20;e.hp=Math.round(2600+x_blessCount()*220);e.maxHp=e.hp;e.sp=120;
    e.xst='idle';e.xt=0;e.pats=['espelhar','investida','latido'];e.patIdx=-1;e.xdata=null;e.atkT=1.2;
  }
  return e;
}
/* fábrica — substitui o spawnEnemy para os tipos novos (envolve o original).
   spawnEnemy NÃO retorna o inimigo (só pusha) — pegamos o último do array. */
const _origSpawnEnemy=spawnEnemy;
/* v1.6.4: repassa o hpMul (A CORTE DUPLA — o gêmeo nasce com 80% da vida) */
spawnEnemy=function(type,x,y,kaizo,hpMul){
  if(XBOSS_TYPES.indexOf(type)>=0){
    try{if(!META.seen[type]){META.seen[type]=1;saveMeta();}}catch(e){}
    const before=enemies.length;
    _origSpawnEnemy('gz',x,y); /* corpo base (pusha no array) */
    const e=enemies.length>before?enemies[enemies.length-1]:null;
    if(!e)return null;
    return setupXBoss(e,type);
  }
  return _origSpawnEnemy(type,x,y,kaizo,hpMul);
};
/* ---- IA compartilhada ---- */
function xbossAI(e,dt,a,d,slowMul){
  const m=game.absMain;
  e.xt-=dt;
  /* flutuação padrão: orbita o jogador a distância média */
  const want=e.type==='sthor'?160:260;
  if(e.xst==='idle'||e.xst==='move'){
    const ang=Math.atan2(player.y-e.y,player.x-e.x);
    const spd=e.sp*slowMul*(d>want+60?1:(d<want-60?-.6:0));
    e.x+=Math.cos(ang)*spd*dt;e.y+=Math.sin(ang)*spd*dt;
    if(e.xt<=0){
      e.patIdx=(e.patIdx+1)%e.pats.length;
      e.pat=e.pats[e.patIdx];e.xst='tele';e.xt=.8;e.xdata={k:0};
    }
  }else if(e.xst==='tele'){
    if(e.xt<=0){e.xst='act';e.xt=actDurFor(e);doXAttack(e);}
  }else if(e.xst==='act'){
    xAttackTick(e,dt);
    if(e.xt<=0){e.xst='idle';e.xt=e.atkT*(game.hard?.75:1);e.pat=null;}
  }
  clampArena(e,e.r);
}
function actDurFor(e){
  switch(e.pat){
    case 'condena':return 1.9;case 'bailios':return 1.2;case 'gale':return 2.4;case 'veredicto':return 1.6;
    case 'martelo':return 1.5;case 'laminas':return 1.8;case 'bigorna':return 1.6;case 'turret':return 1.2;
    case 'correntes':return 1.4;case 'halo':return 2.0;case 'julgamento':return 1.5;
    case 'engolir':return 2.2;case 'estrelas':return 2.0;case 'constricao':return 1.8;
    case 'espelhar':return 1.6;case 'investida':return .9;case 'latido':return 1.0;
  }
  return 1.2;
}
function doXAttack(e){
  const d=x_dist(player.x,player.y,e.x,e.y),a=Math.atan2(player.y-e.y,player.x-e.x);
  const dm=game.hard?1.25:1;
  switch(e.pat){
  case 'condena':{ /* JUIZ — condena áreas da arena (retângulos telegrafados) */
    e.xdata.zones=[];
    for(let i=0;i<3;i++){
      const p=x_ptInRoom(60);
      e.xdata.zones.push({x:p.x,y:p.y,w:150,h:110,t:0,tel:1.1});
    }
    try{sfx.gate();}catch(e2){}
    break;}
  case 'bailios':{ /* invoca 2 meirinhos */
    for(let i=0;i<2;i++){const p=x_ptInRoom(70);_origSpawnEnemy('pn',p.x,p.y);}
    try{sfx.soul();}catch(e2){}
    break;}
  case 'gale':{ /* rosquinha de rostos */
    e.xdata.tick=0;
    break;}
  case 'veredicto':{ /* feixe varrendo */
    e.xdata.ang=a-Math.PI/2;e.xdata.dir=1;
    try{sfx.stake();}catch(e2){}
    break;}
  case 'martelo':{ /* FERREIRO — martelo: onda de choque no chão */
    shockwaves.push({x:e.x,y:e.y,r:12,vr:480,maxR:230,t:0,dur:.5,c:'#ff8f3d'});
    if(d<230)hurtPlayer();
    try{sfx.thud();}catch(e2){}
    break;}
  case 'laminas':{ /* joga lâminas em leque */
    for(let i=-2;i<=2;i++){
      const la=a+i*.28;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(la)*230,vy:Math.sin(la)*230,r:7,c:'#ff8f3d',dmg:14*dm});
    }
    break;}
  case 'bigorna':{ /* bigorna cai na posição do jogador (telegrafada) */
    e.xdata.anv={x:player.x,y:player.y,t:1.0};
    break;}
  case 'turret':{ /* planta uma torreta de forja */
    const p=x_ptInRoom(70);
    e.xdata.tur={x:p.x,y:p.y,cd:1.1,life:6};
    break;}
  case 'correntes':{ /* ANJO — âncoras de corrente que atiram */
    for(let i=0;i<4;i++){
      const ang=i*TAU/4+game.t;
      e.xdata.chain=e.xdata.chain||[];
      if(!e.xdata.chain[i])e.xdata.chain[i]={x:e.x+Math.cos(ang)*170,y:e.y+Math.sin(ang)*170,hp:30,cd:2};
    }
    break;}
  case 'halo':{
    for(let i=0;i<14;i++){
      const ang=i*TAU/14;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*180,vy:Math.sin(ang)*180,r:6,c:'#ffe9b8',dmg:12*dm});
    }
    break;}
  case 'julgamento':{
    for(let i=0;i<3;i++){
      const la=a+(i-1)*.3;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(la)*300,vy:Math.sin(la)*300,r:8,c:'#ffe9b8',dmg:16*dm});
    }
    break;}
  case 'engolir':{ /* SERPENTE — engole uma estrela: a sala escurece */
    e.dark=Math.min(1,(e.dark||0)+.22);
    game.flash=Math.max(game.flash,.3);
    try{sfx.echo();}catch(e2){}
    x_txt('ELA ENGOLIU OUTRA ESTRELA',W/2,H*.2,12,'#cfe9ff');
    for(let i=0;i<10;i++){
      const ang=rnd(TAU);
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*rnd(120,220),vy:Math.sin(ang)*rnd(120,220),r:5,c:'#cfe9ff',dmg:11*dm,home:1,homeT:2.4});
    }
    break;}
  case 'estrelas':{
    for(let i=0;i<5;i++){
      const la=a+(i-2)*.24;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(la)*260,vy:Math.sin(la)*260,r:6,c:'#fff3c4',dmg:12*dm});
    }
    break;}
  case 'constricao':{
    shockwaves.push({x:e.x,y:e.y,r:10,vr:420,maxR:260,t:0,dur:.55,c:'#cfe9ff'});
    if(d<250)hurtPlayer();
    break;}
  case 'espelhar':{ /* THOR SOMBRA — copia o ataque do jogador */
    const dmg=Math.max(10,10*P.dmgMult*.8);
    for(let i=0;i<(game.hasShot?3:1);i++){
      const la=a+(i-1)*.2;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(la)*300,vy:Math.sin(la)*300,r:6,c:'#9d6bb5',dmg:dmg});
    }
    try{sfx.shotS();}catch(e2){}
    break;}
  case 'investida':{
    e.xdata.ch={vx:Math.cos(a)*520,vy:Math.sin(a)*520,t:.5};
    break;}
  case 'latido':{
    shockwaves.push({x:e.x,y:e.y,r:14,vr:640,maxR:280,t:0,dur:.5,c:'#9d6bb5'});
    try{sfx.howl();}catch(e2){}
    break;}
  }
}
function xAttackTick(e,dt){
  const d=x_dist(player.x,player.y,e.x,e.y);
  if(e.pat==='condena'&&e.xdata&&e.xdata.zones){
    for(const z of e.xdata.zones){
      z.tel-=dt;
      if(z.tel<=0&&z.tel>-1){
        z.tel=-2; /* detonada */
        shockwaves.push({x:z.x+z.w/2,y:z.y+z.h/2,r:10,vr:420,maxR:130,t:0,dur:.35,c:'#d9465a'});
        if(player.x>z.x&&player.x<z.x+z.w&&player.y>z.y&&player.y<z.y+z.h)hurtPlayer();
        try{sfx.boom();}catch(e2){}
      }
    }
  }
  if(e.pat==='gale'&&e.xdata){
    e.xdata.tick=(e.xdata.tick||0)+dt;
    if(e.xdata.tick>.22){
      e.xdata.tick=0;
      e.xdata.ga=(e.xdata.ga||0)+.42;
      for(let i=0;i<2;i++){
        const ang=e.xdata.ga+i*Math.PI;
        ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*190,vy:Math.sin(ang)*190,r:5,c:'#c9a0ff',dmg:11});
      }
    }
  }
  if(e.pat==='veredicto'&&e.xdata){
    e.xdata.ang+=e.xdata.dir*dt*1.5;
    if(Math.abs(e.xdata.ang-Math.atan2(player.y-e.y,player.x-e.x))>Math.PI*.8)e.xdata.dir*=-1;
    e.xdata.beamT=(e.xdata.beamT||0)+dt;
    if(e.xdata.beamT>.09){
      e.xdata.beamT=0;
      const bx=e.x+Math.cos(e.xdata.ang)*40,by=e.y+Math.sin(e.xdata.ang)*40;
      ebullets.push({x:bx,y:by,vx:Math.cos(e.xdata.ang)*430,vy:Math.sin(e.xdata.ang)*430,r:7,c:'#ffe9b8',dmg:13});
      if(Math.random()<.5)particles.push({x:bx,y:by,vx:0,vy:0,life:.3,t:0,r:6,c:'rgba(255,233,184,.5)',drag:1,glow:true});
    }
  }
  if(e.pat==='bigorna'&&e.xdata&&e.xdata.anv){
    const v=e.xdata.anv;v.t-=dt;
    if(v.t<=0){
      shockwaves.push({x:v.x,y:v.y,r:8,vr:460,maxR:110,t:0,dur:.35,c:'#a89070'});
      if(x_dist(player.x,player.y,v.x,v.y)<110)hurtPlayer();
      try{sfx.thud();}catch(e2){}
      e.xdata.anv=null;
    }
  }
  if(e.pat==='turret'&&e.xdata&&e.xdata.tur){
    const t=e.xdata.tur;t.cd-=dt;t.life-=dt;
    if(t.cd<=0){
      t.cd=1.1;
      const a2=Math.atan2(player.y-t.y,player.x-t.x);
      ebullets.push({x:t.x,y:t.y,vx:Math.cos(a2)*240,vy:Math.sin(a2)*240,r:6,c:'#ff8f3d',dmg:11});
    }
    if(t.life<=0)e.xdata.tur=null;
  }
  /* investida do Thor sombra */
  if(e.xdata&&e.xdata.ch){
    const ch=e.xdata.ch;ch.t-=dt;
    e.x+=ch.vx*dt;e.y+=ch.vy*dt;
    if(x_dist(e.x,e.y,player.x,player.y)<e.r+player.r)hurtPlayer();
    if(ch.t<=0)e.xdata.ch=null;
  }
  /* FERREIRO — troca de forja por vida (muda os ataques) */
  if(e.type==='ferreiro'){
    const ratio=e.hp/e.maxHp;
    if(ratio<.66&&e.forja<1){e.forja=1;e.pats=['laminas','turret','martelo','bigorna'];e.patIdx=-1;
      game.banner={type:'small',txt:'A FORJA TROCA DE ARMA',sub:'o ferreiro resfria o aço em raiva',t:0,dur:2.4};try{sfx.anvil&&sfx.anvil();sfx.gate();}catch(e2){}}
    if(ratio<.33&&e.forja<2){e.forja=2;e.pats=['bigorna','martelo','laminas','turret'];e.patIdx=-1;e.atkT=1.3;
      game.banner={type:'small',txt:'O FERREIRO SE FERE',sub:'a última bigorna é a própria carne',t:0,dur:2.4};}
  }
  /* ANJO — correntes atiram e podem ser destruídas */
  if(e.type==='anjo'&&e.xdata&&e.xdata.chain){
    for(const c of e.xdata.chain){
      if(!c||c.hp<=0)continue;
      c.cd-=dt;
      if(c.cd<=0){
        c.cd=2.2;
        const a2=Math.atan2(player.y-c.y,player.x-c.x);
        ebullets.push({x:c.x,y:c.y,vx:Math.cos(a2)*250,vy:Math.sin(a2)*250,r:6,c:'#ffe9b8',dmg:11});
      }
    }
  }
}
/* colisão do jogador com as correntes-âncora (destrutíveis) — dano do jogador nelas */
function xbossBulletHit(e,b){
  /* retornos: false = dano normal no corpo; true = absorvido pelas âncoras */
  if(e.type==='anjo'&&e.xdata&&e.xdata.chain){
    for(const c of e.xdata.chain){
      if(!c||c.hp<=0)continue;
      if(x_dist(b.x,b.y,c.x,c.y)<26){
        c.hp-=b.dmg;x_sparks(c.x,c.y,'#ffe9b8',6,160,.4,3);
        if(c.hp<=0){x_sparks(c.x,c.y,'#fff',14,260,.6,4);try{sfx.headDie();}catch(e2){}
          game.banner={type:'small',txt:'CORRENTE PARTIDA',sub:'o anjo perde uma amarra',t:0,dur:1.6};}
        return true;
      }
    }
  }
  return false;
}
/* ---- desenho dos xbosses ---- */
function drawXBoss(e){
  const s=Math.min(1,e.spawnT||1);
  ctx.save();
  ctx.translate(e.x,e.y);ctx.scale(s,s);
  ctx.fillStyle='rgba(0,0,0,.3)';
  ctx.beginPath();ctx.ellipse(0,e.r*.6,e.r,e.r*.4,0,0,TAU);ctx.fill();
  const flash=e.flash>0;
  if(e.type==='juiz'){
    /* rosto sem rosto — um tribunal ambulante */
    const bob=Math.sin(game.t*1.4)*5;
    ctx.translate(0,bob);
    ctx.fillStyle=flash?'#fff':'#14101c';
    ctx.beginPath();ctx.moveTo(-40,-30);ctx.lineTo(40,-30);ctx.lineTo(52,40);ctx.lineTo(-52,40);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#9d6bb5';ctx.lineWidth=3;ctx.stroke();
    /* SEM rosto: apenas uma fenda */
    ctx.fillStyle='#d9465a';
    ctx.fillRect(-4,-6,8,26);
    /* martelo de sentença flutuando */
    const ha=Math.sin(game.t*2)*.3;
    ctx.save();ctx.translate(58,-30);ctx.rotate(ha);
    ctx.fillStyle='#3a3345';ctx.fillRect(-4,-22,8,44);
    ctx.fillStyle='#6e6357';ctx.fillRect(-14,-30,28,16);
    ctx.restore();
    /* zonas condenadas */
    if(e.xdata&&e.xdata.zones)for(const z of e.xdata.zones){
      if(z.tel>0){
        ctx.save();
        ctx.globalAlpha=.25+.35*Math.sin(game.t*14);
        ctx.fillStyle='#d9465a';
        ctx.fillRect(z.x-e.x,z.y-e.y,z.w,z.h);
        ctx.restore();
      }
    }
  }else if(e.type==='ferreiro'){
    const bob=Math.sin(game.t*2.2)*4;
    ctx.translate(0,bob);
    /* forja viva */
    ctx.fillStyle=flash?'#fff':'#241a14';
    ctx.beginPath();ctx.ellipse(0,0,e.r+8,e.r,0,0,TAU);ctx.fill();
    ctx.strokeStyle='#ff8f3d';ctx.lineWidth=3;ctx.stroke();
    /* olho-fornalha */
    const pul=.5+.5*Math.sin(game.t*4);
    ctx.fillStyle='rgba(255,143,61,'+(.5+.5*pul)+')';
    ctx.beginPath();ctx.arc(0,-6,10+pul*4,0,TAU);ctx.fill();
    /* martelo gigante */
    ctx.save();ctx.rotate(Math.sin(game.t*1.6)*.5);
    ctx.fillStyle='#3a2f22';ctx.fillRect(e.r-4,-38,10,76);
    ctx.fillStyle='#6e6357';ctx.fillRect(e.r-16,-48,34,26);
    ctx.restore();
  }else if(e.type==='anjo'){
    /* anjo acorrentado — asas cortadas, correntes radiais */
    ctx.fillStyle=flash?'#fff':'#1c1820';
    ctx.beginPath();ctx.ellipse(0,0,e.r,e.r*1.2,0,0,TAU);ctx.fill();
    ctx.strokeStyle='#ffe9b8';ctx.lineWidth=2.5;ctx.stroke();
    /* asas serradas */
    for(const sgn of[-1,1]){
      ctx.fillStyle='#26212e';
      ctx.beginPath();ctx.moveTo(sgn*10,-14);
      ctx.lineTo(sgn*(e.r+22),-46);ctx.lineTo(sgn*(e.r+6),-10);ctx.lineTo(sgn*(e.r+16),14);ctx.lineTo(sgn*10,14);
      ctx.closePath();ctx.fill();
    }
    /* auréola partida */
    ctx.strokeStyle='rgba(255,233,184,.7)';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,-e.r-14,14,Math.PI*.15,Math.PI*.95);ctx.stroke();
    if(e.xdata&&e.xdata.chain)for(const c of e.xdata.chain){
      if(!c||c.hp<=0)continue;
      ctx.strokeStyle='rgba(255,233,184,.55)';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(c.x-e.x,c.y-e.y);ctx.stroke();
      ctx.fillStyle='#ffe9b8';
      ctx.beginPath();ctx.arc(c.x-e.x,c.y-e.y,9,0,TAU);ctx.fill();
    }
  }else if(e.type==='serp'){
    /* serpente que engole estrelas — corpo em anéis, céu na boca */
    for(let i=5;i>=0;i--){
      const ang=game.t*(1.2-i*.13)+i*.7;
      const rx=Math.cos(ang)*i*13,ry=Math.sin(ang*.8)*i*8;
      ctx.fillStyle=i===0?(flash?'#fff':'#101623'):'rgba(127,184,255,'+(0.10+i*.05)+')';
      ctx.beginPath();ctx.arc(rx,ry,e.r-i*5,0,TAU);ctx.fill();
    }
    /* boca: um pedaço de céu com estrelas */
    ctx.save();
    ctx.fillStyle='#0a1020';
    ctx.beginPath();ctx.arc(0,-e.r*.2,e.r*.55,0,TAU);ctx.fill();
    ctx.fillStyle='#fff';
    for(let i=0;i<3;i++){
      const tw=.4+.6*Math.sin(game.t*3+i*2);
      ctx.globalAlpha=tw;
      ctx.fillRect(-8+i*7,-10,2,2);
    }
    ctx.restore();
  }else if(e.type==='sthor'){
    /* thor que não desceu — silhueta invertida do jogador */
    ctx.globalAlpha=.88;
    ctx.fillStyle='#0a0710';
    ctx.beginPath();ctx.arc(0,-6,player.r,0,TAU);ctx.fill();
    ctx.strokeStyle='#9d6bb5';ctx.lineWidth=2;ctx.stroke();
    /* olhos roxos */
    ctx.fillStyle='#c9a0ff';
    ctx.fillRect(-8,-12,4,4);ctx.fillRect(4,-12,4,4);
    ctx.globalAlpha=1;
  }
  ctx.restore();
  /* barra de vida dos xbosses */
  if(e.spawnT>=1){
    const bw=120;
    ctx.save();
    ctx.fillStyle='rgba(10,7,8,.7)';ctx.fillRect(e.x-bw/2,e.y-e.r-26,bw,7);
    ctx.fillStyle=e.type==='juiz'?'#9d6bb5':'#ff8f3d';
    ctx.fillRect(e.x-bw/2,e.y-e.r-26,bw*clamp(e.hp/e.maxHp,0,1),7);
    ctx.strokeStyle='rgba(230,218,196,.3)';ctx.lineWidth=1;ctx.strokeRect(e.x-bw/2,e.y-e.r-26,bw,7);
    ctx.restore();
  }
}
/* ---- vitória do JUIZ (fim da descida) ---- */
let juizDone=false;
function juizDefeated(){
  if(juizDone)return;
  juizDone=true;
  META.wins++;saveMeta();
  conqTick();
  try{game.flash=.7;game.shake=18;sfx.win();sfx.echo();}catch(e){}
  const wt=ov('winTitle');if(wt)wt.textContent='O JUIZ CAIU';
  const we=ov('winEyebrow');if(we)we.textContent='O LIMBO CONDENA';
  const ws=ov('winSub');if(ws)ws.textContent='o tribunal encerra o processo. nenhuma sentença foi cumprida — a sua.';
  const wstats=ov('winStats');
  if(wstats)wstats.innerHTML='ABATES <b>'+game.kills+'</b> · ALMAS <b>'+game.souls+'</b> · VIDA <b>'+player.hp+'/'+player.maxHp+'</b>';
  setTimeoutShowWin();
}
function setTimeoutShowWin(){
  /* sem setTimeout — usamos um estado de espera pelo próprio loop */
  game._winWait=1.6;
}
/* ---- CÉRBERO remasterizado v1.3.1 "TRÊS GARGANTAS" ----
   AGORA as fases RODAM durante a luta (o gancho antigo só existia no estado
   da intro — as fases nunca chegavam a ligar de verdade).
   FASE I — O CÃO QUE CAÇA: investida telegrafada (solo pulsando + seta).
   FASE II — A FOME DAS TRÊS BOCAS: leques conjuntos + pescoços que avançam
   (nova animação) + investidas mais frequentes.
   FASE III — O ÚLTIMO PORTÃO: arena escura, uivo que treme a tela, anéis do
   corpo e a janela VULNERÁVEL legível. O velho diálogo e a ALMA NEGRA do fim
   continuam intactos. */
let cerbPhase=0;
const CDASH={t:0,st:'idle',ang:0}; /* investida remaster (usa o bote antigo) */
function cerbHardReset(){cerbPhase=0;game._cerbP1=0;game._cerbVuln=0;game._cerbFight=false;CDASH.t=0;CDASH.st='idle';}
function frameCerberus(dt){
  if(!game._cerbFight)return; /* só o Cérbero do portão é remasterizado */
  if(!boss.active||boss.dying)return;
  if(game.state!=='bossintro'&&game.state!=='play')return;
  let hp=0,mx=0;
  for(const h of boss.heads){hp+=Math.max(0,h.hp);mx+=h.maxHp;}
  const r=mx?hp/mx:1;
  if(cerbPhase===0&&!game._cerbP1&&!boss.introLock){
    game._cerbP1=1;
    game.banner={type:'boss',txt:'FASE I — O CÃO QUE CAÇA',sub:'ele corre — não fique na frente do bote',t:0,dur:2.8};
  }
  if(r<=.66&&cerbPhase<1){
    cerbPhase=1;
    game.banner={type:'boss',txt:'FASE II — A FOME DAS TRÊS BOCAS',sub:'as cabeças caçam JUNTAS — e os pescoços esticam',t:0,dur:3.0};
    try{sfx.roar();game.shake=14;}catch(e){}
    boss.frenzyCd=Math.min(boss.frenzyCd,5);
    shockwaves.push({x:boss.x,y:boss.y,r:14,vr:460,maxR:220,t:0,dur:.45,c:'#a52a3a'});
  }
  if(r<=.33&&cerbPhase<2){
    cerbPhase=2;
    game.banner={type:'boss',txt:'FASE III — O ÚLTIMO PORTÃO',sub:'a arena escurece — ele entende que você não vai desistir',t:0,dur:3.2};
    try{sfx.howl();sfx.roar();game.shake=18;game.flash=.5;}catch(e){}
    boss.frenzyCd=3.6;
    for(const h of boss.heads)if(h.alive)h.baseCd=Math.max(2.2,h.baseCd*.72);
    /* micro-cutscene de fase: uivo + anéis de choque */
    shockwaves.push({x:boss.x,y:boss.y,r:20,vr:540,maxR:280,t:0,dur:.5,c:'#a52a3a'});
    shockwaves.push({x:boss.x,y:boss.y,r:8,vr:400,maxR:210,t:0,dur:.55,c:'#ff8f3d'});
  }
  /* INVESTIDA TELEGRAFADA — arma o bote que JÁ EXISTE (boss.dashing) */
  const dashCdMax=cerbPhase>=2?3.6:cerbPhase>=1?4.6:5.8;
  if(CDASH.st==='idle'){
    CDASH.t+=dt;
    if(CDASH.t>=dashCdMax&&!boss.dashing&&!boss.frenzyActive&&boss.recoverT<=0&&!player.dead){
      CDASH.st='tele';CDASH.t=0;
      CDASH.ang=Math.atan2(player.y-boss.y,player.x-boss.x);
      try{sfx.growl();}catch(e){}
    }
  }else if(CDASH.st==='tele'){
    CDASH.t+=dt;
    CDASH.ang=Math.atan2(player.y-boss.y,player.x-boss.x);
    if(CDASH.t>=.7){
      CDASH.st='cool';CDASH.t=0;
      boss.dashing=true;boss.dashT=.42;
      boss.dashAng=CDASH.ang;
      const v=920+80*cerbPhase;
      boss.dashVx=Math.cos(CDASH.ang)*v;boss.dashVy=Math.sin(CDASH.ang)*v;
      try{noiseSfx(.3,.06,120,'lowpass');sfx.dash();}catch(e){}
    }
  }else{ /* cool: espera o bote atual terminar */
    CDASH.t+=dt;
    if(!boss.dashing&&CDASH.t>.6){CDASH.st='idle';CDASH.t=0;}
  }
  /* FASE II+: cabeças atacam em conjunto + pescoços que avançam (animação nova) */
  if(cerbPhase>=1&&boss.recoverT<=0&&!boss.dashing&&Math.random()<dt*.28){
    let any=false;
    for(const h of boss.heads){
      if(!h.alive)continue;any=true;
      h.lungeT=.42;
      const a=Math.atan2(player.y-h.hy,player.x-h.hx);
      for(let i=-2;i<=2;i++){
        const la=a+i*.22;
        ebullets.push({x:h.hx,y:h.hy,vx:Math.cos(la)*230,vy:Math.sin(la)*230,r:6,c:h.c,dmg:12});
      }
    }
    if(any)try{sfx.spit();}catch(e){}
  }
  for(const h of boss.heads){if(h.lungeT>0)h.lungeT-=dt;}
  /* FASE III: janela de vulnerabilidade legível */
  if(cerbPhase>=2&&boss.recoverT>0){
    if(!game._cerbVuln){game._cerbVuln=1;x_txt('VULNERÁVEL — AGORA',boss.x,boss.y-140,15,'#ffd9a0');}
  }else game._cerbVuln=0;
}
/* FX visuais do remaster — desenhados por cima do boss antigo */
function drawCerberusFX(){
  if(!game._cerbFight)return;
  if(game.state!=='play'&&game.state!=='bossintro')return;
  if(!boss.active||boss.dying)return;
  /* telegráfo do bote: solo pulsando + seta da direção */
  if(CDASH.st==='tele'){
    const k=Math.min(1,CDASH.t/.7);
    ctx.save();
    ctx.globalAlpha=.22+.4*Math.abs(Math.sin(game.t*16));
    ctx.strokeStyle='#ff4040';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(boss.x,boss.y+34,boss.r+16+26*(1-k),0,TAU);ctx.stroke();
    ctx.globalAlpha=.55;
    ctx.strokeStyle='#ffd9a0';ctx.lineWidth=2.5;
    ctx.beginPath();
    ctx.moveTo(boss.x+Math.cos(CDASH.ang)*(boss.r+34),boss.y+Math.sin(CDASH.ang)*(boss.r+34));
    ctx.lineTo(boss.x+Math.cos(CDASH.ang)*(boss.r+76),boss.y+Math.sin(CDASH.ang)*(boss.r+76));
    ctx.stroke();
    ctx.restore();
  }
  /* pescoços que avançam: halo no focinho */
  for(const h of boss.heads){
    if(!h.alive||!(h.lungeT>0))continue;
    ctx.save();
    ctx.globalAlpha=clamp(h.lungeT/.42,0,1)*.45;
    ctx.fillStyle=h.c||'#a52a3a';
    ctx.beginPath();ctx.arc(h.hx,h.hy,26+12*(h.lungeT/.42),0,TAU);ctx.fill();
    ctx.restore();
  }
  /* FASE III: a arena escurece + brasas */
  if(cerbPhase>=2){
    const g=ctx.createRadialGradient(boss.x,boss.y,90,boss.x,boss.y,Math.max(W,H)*.6);
    g.addColorStop(0,'rgba(5,3,4,0)');g.addColorStop(1,'rgba(5,3,4,.4)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    if(Math.random()<.4)particles.push({x:rnd(0,W),y:H-8,vx:rnd(-8,8),vy:rnd(-90,-40),life:rnd(.8,1.6),t:0,r:rnd(1,2.6),c:Math.random()<.5?'#ff8f3d':'#d9465a',drag:.98,glow:true});
  }
  /* VULNERÁVEL: aura dourada pulsando */
  if(game._cerbVuln&&boss.recoverT>0){
    ctx.save();
    ctx.globalAlpha=.28+.24*Math.sin(game.t*10);
    ctx.strokeStyle='#ffd9a0';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(boss.x,boss.y+30,boss.r+24,0,TAU);ctx.stroke();
    ctx.restore();
  }
}
/* ---- CERVO DESFIGURADO — encontro de exploração (sem combate) ---- */
const CV={t:0,active:false,ghosts:[],real:null,done:false};
function maybeCervoEvent(){
  /* chamado ao entrar em sala VAZIA da penumbra — 12% */
  if(game.region!=='penumbra'||game.floor>4)return;
  if(CV.done||CV.active)return;
  if(game.roomKind!=='empty')return;
  if(Math.random()>=.12)return;
  CV.active=true;CV.t=0;CV.ghosts=[];CV.real=null;
  for(let i=0;i<3;i++){
    const p=x_ptInRoom(80);
    CV.ghosts.push({x:p.x,y:p.y,a:1,real:false,fade:0});
  }
  const p=x_ptInRoom(80);
  CV.real={x:p.x,y:p.y,a:0,real:true,drop:false};
  try{noiseSfx(1.2,.03,180,'lowpass');}catch(e){}
  texts.push({x:W/2,y:H*.2,txt:'algo desfigurado observa entre as árvores.',t:0,life:3,c:'#6e6357',size:11,disp:true});
}
function updateCervo(dt){
  if(!CV.active)return;
  CV.t+=dt;
  for(const g of CV.ghosts){
    g.fade=Math.min(1,g.fade+dt*.8);
    if(CV.t>2.6)g.a=Math.max(0,g.a-dt*.5);
  }
  if(CV.t>2)CV.real.a=Math.min(1,CV.real.a+dt*.4);
  /* o jogador achou o REAL (os fantasmas somem ao aproximar) */
  if(!CV.real.drop&&x_dist(player.x,player.y,CV.real.x,CV.real.y)<44){
    CV.real.drop=true;
    pickups.push({type:'soul',x:CV.real.x,y:CV.real.y,t:0,ph:rnd(TAU)});
    pickups.push({type:'heart',x:CV.real.x+16,y:CV.real.y-10,t:0,ph:rnd(TAU)});
    texts.push({x:CV.real.x,y:CV.real.y-30,txt:'A PENA DO CERVO',t:0,life:2,c:'#c9a44c',size:12,disp:true});
    try{sfx.soul();}catch(e){}
  }
  if(CV.t>7){CV.active=false;CV.done=true;}
}
function drawCervo(){
  if(!CV.active)return;
  for(const g of CV.ghosts){
    if(g.a<=0)continue;
    ctx.save();
    ctx.globalAlpha=g.a*.28;
    drawDeerShape(g.x,g.y,'#3a3345',game.t+g.x);
    ctx.restore();
  }
  if(CV.real&&CV.real.a>0){
    ctx.save();
    ctx.globalAlpha=CV.real.a*.8;
    drawDeerShape(CV.real.x,CV.real.y,'#9d6bb5',game.t);
    ctx.restore();
  }
}
function drawDeerShape(x,y,c,ph){
  const bob=Math.sin(ph*1.6)*3;
  ctx.save();ctx.translate(x,y+bob);
  ctx.fillStyle=c;
  ctx.beginPath();ctx.ellipse(0,0,20,30,0,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(0,-30,10,0,TAU);ctx.fill();
  /* chifres DESFIGURADOS (assimétricos, quebrados) */
  ctx.strokeStyle=c;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(-6,-36);ctx.lineTo(-14,-52);ctx.lineTo(-10,-58);ctx.stroke();
  ctx.beginPath();ctx.moveTo(6,-36);ctx.lineTo(16,-46);ctx.lineTo(22,-56);ctx.lineTo(18,-62);ctx.stroke();
  ctx.restore();
}
/* ================================================================
   8. LOOP PRINCIPAL DA EXPANSÃO — roda 1× por frame dentro do
   updatePlay (gancho de 1 linha). Nada aqui usa setTimeout.
   ================================================================ */
let _synT=0,_coordT=0,_devGlT=0,_falsoT=0,_acoT=0,_horaT=0;
function frameWeapons(dt){
  if(!isXWeapon())return;
  if(player.dead||game.fallK>=0)return;
  /* v1.3.1: a recarga corre SEMPRE (o clique não pode ficar preso numa
     recarga que nunca anda — bug achado no teste do Credor) */
  wst.t-=dt;
  credorFrame(dt);
  /* v1.3.4: a CARGA da colher anda aqui (frame real, nada de setTimeout) */
  colherChargeFrame(dt);
  /* v1.3.1: NADA atira sozinho — igual às armas antigas: SETAS seguradas
     atacam (mesmas teclas do updateShot); o clique/toque dispara pelo
     gancho no tryShootAt (game.js). WASD continua sendo só movimento.
     v1.3.4: com a colher CARREGANDO, as setas não disparam (o botão
     segurado manda; ao soltar, a colherada carregada desce). */
  if(wst.chg)return;
  const ax=(keys['ArrowRight']?1:0)-(keys['ArrowLeft']?1:0);
  const ay=(keys['ArrowDown']?1:0)-(keys['ArrowUp']?1:0);
  if(ax||ay){
    wst.forceA=Math.atan2(ay,ax);
    player.angle=wst.forceA;
    fireWeapon(dt);
  }
}
function frameSyn(dt){
  if(player.dead)return;
  /* ---- SINERGIAS DE PAR (elementais) ---- */
  if(game.psyn.vaporesc){
    game._vapT=(game._vapT||5)-dt;
    if(game._vapT<=0){
      game._vapT=5;
      shockwaves.push({x:player.x,y:player.y,r:14,vr:430,maxR:150,t:0,dur:.4,c:'#cfe9ff'});
      for(const e of enemies){if(!e.dead&&x_dist(player.x,player.y,e.x,e.y)<150)x_dmgEnemy(e,14*P.dmgMult,'#cfe9ff');}
      try{noiseSfx(.4,.05,600,'bandpass');}catch(e){}
    }
  }
  if(game.psyn.prisionaq){
    for(const e of enemies){
      if(e.dead||e.slowT<=0)continue;
      e.slowT=Math.min(e.slowT+dt*.5,4); /* o gelo segura mais */
      if(Math.random()<dt*2)x_sparks(e.x,e.y,'#cfe9ff',2,60,.3,2);
    }
  }
  if(game.psyn.condutor){
    game._condT=(game._condT||2.5)-dt;
    if(game._condT<=0){
      game._condT=2.5;
      const wet=enemies.filter(function(e){return !e.dead&&e.slowT>0;});
      if(wet.length){
        const t=wet[Math.floor(Math.random()*wet.length)];
        let src=t,dmg=16*P.dmgMult;
        for(let i=0;i<2+(game.specAgua?1:0);i++){
          bolts.push({x:src.x,y:src.y,t:0,life:.25,seed:rnd(10)});
          x_dmgEnemy(src,dmg,'#fff3c4');
          let nx=null,bd=200;
          for(const o of enemies){if(o.dead||o===src)continue;const dd=x_dist(src.x,src.y,o.x,o.y);if(dd<bd){bd=dd;nx=o;}}
          if(!nx)break;src=nx;dmg*=.6;
        }
        try{sfx.thunder();}catch(e){}
      }
    }
  }
  if(game.psyn.incendioinf||game.passobrasa){
    if(player.dashT>0){
      fogoTrail.push({x:player.x,y:player.y,t:0,life:1.2,r:26,strong:!!game.psyn.incendioinf});
    }
    for(let i=fogoTrail.length-1;i>=0;i--){
      const f=fogoTrail[i];f.t+=dt;
      if(f.t>=f.life){fogoTrail.splice(i,1);continue;}
      for(const e of enemies){
        if(e.dead)continue;
        if(x_dist(e.x,e.y,f.x,f.y)<f.r){
          x_dmgEnemy(e,(f.strong?9:5)*P.dmgMult*dt,'#ff8f3d');
          if(f.strong&&Math.random()<dt*2){e.burnT=Math.max(e.burnT||0,1);e.burnD=Math.max(e.burnD||0,2*P.dmgMult);}
        }
      }
    }
  }
  if(game.psyn.prisionaq&&game.psyn.sepultura)0; /* sepultura roda no onKill */
  /* ---- SINERGIAS DE ITENS ---- */
  if(game.psyn.vendavalgelado&&player.dashT>0&&!player._vgPulse){
    player._vgPulse=1;
    shockwaves.push({x:player.x,y:player.y,r:12,vr:420,maxR:130,t:0,dur:.4,c:'#cfe9ff'});
    for(const e of enemies){if(!e.dead&&x_dist(player.x,player.y,e.x,e.y)<130){e.slowT=Math.max(e.slowT,1.6);}}
  }
  if(player.dashT<=0)player._vgPulse=0;
  if(game.psyn.carniceiro){
    game._carnT=(game._carnT||2)-dt;
    if(game._carnT<=0){
      game._carnT=2;
      let near=null,bd=999;
      for(const e of enemies){if(e.dead)continue;const d=x_dist(player.x,player.y,e.x,e.y);if(d<bd){bd=d;near=e;}}
      if(near&&bd<180){near._bleed=2;near._bleedD=3*P.dmgMult;}
    }
    for(const e of enemies){
      if(e.dead||!e._bleed)continue;
      e._bleed-=dt;x_dmgEnemy(e,e._bleedD*dt,'#d9465a');
    }
  }
  if(game.psyn.maredebrasa){
    for(const p of poças){
      for(const e of enemies){
        if(e.dead)continue;
        if(x_dist(e.x,e.y,p.x,p.y)<p.r&&Math.random()<dt*2){e.burnT=Math.max(e.burnT||0,1);e.burnD=Math.max(e.burnD||0,2.2*P.dmgMult);}
      }
    }
  }
  if(game.psyn.parlatino){
    game._parT=(game._parT||5)-dt;
    if(game._parT<=0&&game.multi>0){
      game._parT=5;
      let t=null,bd=999;
      for(const e of enemies){if(e.dead)continue;const d=x_dist(player.x,player.y,e.x,e.y);if(d<bd){bd=d;t=e;}}
      if(t){bolts.push({x:t.x,y:t.y,t:0,life:.25,seed:rnd(10)});x_dmgEnemy(t,20*P.dmgMult,'#fff3c4');try{sfx.thunder();}catch(e){}}
    }
  }
  /* ---- BÊNÇÃOS com efeito ativo ---- */
  if(game.solest){
    game.solestT-=dt;
    if(game.solestT<=0){
      game.solestT=9;
      shockwaves.push({x:player.x,y:player.y,r:16,vr:520,maxR:190,t:0,dur:.45,c:'#ffd9a0'});
      for(const e of enemies){if(!e.dead&&x_dist(player.x,player.y,e.x,e.y)<190)x_dmgEnemy(e,16*P.dmgMult,'#ffd9a0');}
      /* revela o que está escondido: marca segredos próximos */
      for(const d of game.doors)if(d.hidden){d.hidden=false;d.secretReveal=6;}
      try{sfx.nova?0:0;blip('sine',700,1100,.3,.1);}catch(e){}
      /* MADRUGADA: também desfaz projéteis */
      if(game.psyn.madrugada){
        let n=0;
        for(let i=ebullets.length-1;i>=0&&n<6;i--){const b=ebullets[i];if(x_dist(player.x,player.y,b.x,b.y)<200){ebullets.splice(i,1);x_sparks(b.x,b.y,'#ffd9a0',3,90,.3,2);n++;}}
      }
      x_txt('SOL ESTILHAÇADO',player.x,player.y-44,11,'#ffd9a0');
    }
  }
  if(game.halopartido){
    game.haloT-=dt;
    if(game.haloT<=0){
      game.haloT=4;
      let n=0;
      for(let i=ebullets.length-1;i>=0&&n<3;i--){
        const b=ebullets[i];
        if(x_dist(player.x,player.y,b.x,b.y)<170){
          ebullets.splice(i,1);n++;
          particles.push({x:b.x,y:b.y,vx:0,vy:-30,life:.9,t:0,r:4,c:'#ffd9a0',drag:1,glow:true});
          if(player.hp<player.maxHp)player.hp=Math.min(player.maxHp,player.hp+2);
        }
      }
      if(n)try{blip('sine',600,900,.2,.08);}catch(e){}
    }
  }
  if(game.centelha&&player.hp<player.maxHp*.25){
    game.centT-=dt;
    if(game.centT<=0){
      game.centT=3;
      let t=null,bd=999;
      for(const e of enemies){if(e.dead)continue;const d=x_dist(player.x,player.y,e.x,e.y);if(d<bd){bd=d;t=e;}}
      if(t){bolts.push({x:t.x,y:t.y,t:0,life:.3,seed:rnd(10)});x_dmgEnemy(t,34*P.dmgMult,'#fff3c4');try{sfx.thunder();}catch(e){}}
      player.rateBoost=player.rateBoost||0;
    }
  }
  if(game.correntes){
    game.corrCd-=dt;
    if(game.corrCd<=0){
      game.corrCd=1.2;
      let n=0;
      for(const e of enemies){
        if(e.dead||n>=3)continue;
        if(x_dist(player.x,player.y,e.x,e.y)<220){
          x_dmgEnemy(e,6*P.dmgMult,'#9d6bb5');n++;
          if(game.psyn.cadeiaardente){e.burnT=Math.max(e.burnT||0,1.2);e.burnD=Math.max(e.burnD||0,2.2*P.dmgMult);}
          correnteFx.push({x:player.x,y:player.y,tx:e.x,ty:e.y,t:0,life:.22});
        }
      }
    }
  }
  if(game.reflexo){
    game.reflT-=dt;
    if(game.reflT<=0){
      game.reflT=14;
      refx.active=2.5;refx.x=player.x;refx.y=player.y;
      /* repete o ÚLTIMO ataque: dispara um leque igual ao da arma atual */
      const a=player.angle;
      if(game.hasShot||isXWeapon()){
        for(let i=-1;i<=1;i++)x_shot(refx.x,refx.y,a+i*.16,800,12*P.dmgMult,{color:'#9d6bb5'});
      }else{
        for(const e of enemies){if(!e.dead&&x_dist(refx.x,refx.y,e.x,e.y)<170)x_dmgEnemy(e,20*P.dmgMult,'#9d6bb5');}
      }
      if(game.psyn.duplatestemunha){for(const e of enemies){if(!e.dead&&e.elite){e._testGlow=2.5;}}}
      try{blip('sine',300,180,.4,.09);}catch(e){}
      x_txt('O REFLEXO ATACA',player.x,player.y-46,10,'#9d6bb5');
    }
    if(refx.active>0)refx.active-=dt;
  }
  if(game.lagraq){
    game.laqT-=dt;
    if(game.laqT<=0){
      game.laqT=7;
      poças.push({x:player.x,y:player.y,t:0,life:3.4,r:44});
      try{noiseSfx(.3,.03,400,'lowpass');}catch(e){}
    }
    for(let i=poças.length-1;i>=0;i--){const p=poças[i];p.t+=dt;if(p.t>=p.life)poças.splice(i,1);}
    for(const p of poças){
      for(const e of enemies){
        if(e.dead)continue;
        if(x_dist(e.x,e.y,p.x,p.y)<p.r)e.slowT=Math.max(e.slowT,.4);
      }
    }
  }
  if(game.silg){
    game._silgT=(game._silgT||.8)-dt;
    if(game._silgT<=0){
      game._silgT=.8;
      let near=null,bd=160;
      for(const e of enemies){if(e.dead)continue;const d=x_dist(player.x,player.y,e.x,e.y);if(d<bd){bd=d;near=e;}}
      if(near){
        near._frost=(near._frost||0)+1;
        if(near._frost>=6){
          near._frost=0;
          near.slowT=Math.max(near.slowT,1.2);
          if(near.shootT)near.shootT=Math.max(near.shootT,1.2); /* o disparo engole */
          if(game.sdegelo&&game.sdegCd<=0){game.sdegCd=5;player.hp=Math.min(player.maxHp,player.hp+2);}
          x_sparks(near.x,near.y,'#cfe9ff',8,140,.5,3);
          try{sfx.freeze();}catch(e){}
        }
      }
    }
    if(game.sdegCd>0)game.sdegCd-=dt;
  }
  if(game.nervos){
    game._nervT=(game._nervT||5)-dt;
    if(game._nervT<=0){
      game._nervT=5;
      const near=enemies.filter(function(e){return !e.dead&&x_dist(player.x,player.y,e.x,e.y)<300;}).slice(0,3);
      for(const e of near){bolts.push({x:e.x,y:e.y,t:0,life:.25,seed:rnd(10)});x_dmgEnemy(e,14*P.dmgMult,'#fff3c4');}
      if(near.length)try{sfx.thunder();}catch(e){}
    }
  }
  if(game.ecosino&&x_roomClear()&&!game._sinoRing){
    game._sinoRing=1;
    player.hp=Math.min(player.maxHp,player.hp+4);
    try{blip('sine',392,523,.6,.14);}catch(e){}
    x_txt('O SINO DOBRA +4',player.x,player.y-42,11,'#ffd9a0');
  }
  if(!x_roomClear())game._sinoRing=0;
  if(game.pulmao){
    /* projéteis curvam suavemente em direção ao demônio mais próximo */
    for(const b of bullets){
      let best=null,bd=240;
      for(const e of enemies){if(e.dead)continue;const d=x_dist(b.x,b.y,e.x,e.y);if(d<bd){bd=d;best=e;}}
      if(best){
        const a=Math.atan2(best.y-b.y,best.x-b.x);
        b.vx+=Math.cos(a)*260*dt;b.vy+=Math.sin(a)*260*dt;
      }
    }
  }
  /* ---- PACTOS: preços cobrados no relógio — v1.9.0: NENHUM tira vida mais ---- */
  if(game.pacAco){
    _acoT+=dt;
    if(_acoT>=8){_acoT=0;const _cob=Math.min(4,META.souls|0);if(_cob>0){META.souls-=_cob;}x_txt('O AÇOUGUEIRO COBRA -'+_cob+' almas',player.x,player.y-38,9,'#d9465a');}
  }
  if(game.pacHora){
    _horaT+=dt;
    if(_horaT>=60){_horaT=0;player.slowT=Math.max(player.slowT,6);x_txt('A HORA FOI COBRADA',player.x,player.y-38,11,'#9d6bb5');try{sfx.echo();}catch(e){}}
  }
  if(game.pacBarq){
    /* o pedágio conta em gainSouls (wrapper) */
  }
  if(game.pacFalsoRei){
    _falsoT+=dt;
    if(_falsoT>=10){_falsoT=0;const _cob=Math.min(3,META.souls|0);if(_cob>0){META.souls-=_cob;x_txt('O FALSO REI COBRA -'+_cob+' almas',player.x,player.y-38,9,'#9d6bb5');}}
  }
  if(game.pacDev){
    _devGlT+=dt;
    if(_devGlT>=20){
      _devGlT=0;
      game.glitchT=Math.max(game.glitchT||0,.7);
      game.shake=Math.max(game.shake,8);
      x_txt(pick(['ERR::THOR_NOT_FOUND','stack overflow na alma','TODO: consertar depois','[object Pecado]']),rnd(W*.2,W*.8),rnd(H*.2,H*.7),11,'#4ff5ff');
      try{sfx.glitch();}catch(e){}
    }
  }
  if(game.pacDivida)0; /* juros cobrados no início do andar (onEnterRoom) */
  /* teste de sinergias pendentes (barato, 2×/s) */
  _synT+=dt;
  if(_synT>=.5){_synT=0;checkExpSyn();}
}
/* gatilho pós-dano (gancho de 1 linha no hurtPlayer) */
function afterHurt(){
  try{
    if(game.mods&&game.mods.semmisericordia)player.inv=0;
    if(game.pacTest&&Math.random()<.3&&enemies.length<24){
      const p=x_ptInRoom(80);_origSpawnEnemy('sh',p.x,p.y);
      texts.push({x:p.x,y:p.y-20,txt:'A TESTEMUNHA CHAMOU',t:0,life:1.2,c:'#9d6bb5',size:10,disp:true});
    }
  }catch(e){}
}
/* ÚLTIMA PENA — desfez a morte (gancho no início do bloco de morte) */
function tryPena(){
  try{
    if(!game.pacPena||game._penaUsedFloor)return false;
    game._penaUsedFloor=true;
    game.penasUsadas++;
    P.dmgMult*=.85;
    player.dead=false;player.hp=Math.max(1,Math.round(player.maxHp*.3));
    player.inv=2.2;
    game.state='play';
    game.flash=.5;game.shake=14;
    try{sfx.levelup();blip('sine',700,300,.5,.12);}catch(e){}
    sparks(player.x,player.y,'#ffd9a0',26,300,.9,4,true);
    texts.push({x:player.x,y:player.y-46,txt:'A ÚLTIMA PENA TE SEGURA',t:0,life:2,c:'#ffd9a0',size:13,disp:true});
    return true;
  }catch(e){return false;}
}
/* abates — ganchos de sinergias (1 linha no killEnemy) */
function onKill(e){
  try{
    if(game.psyn.sepultura&&e.slowT>0){
      for(const o of enemies){
        if(o.dead||o===e)continue;
        if(x_dist(e.x,e.y,o.x,o.y)<120){o.slowT=Math.max(o.slowT,2);x_sparks(o.x,o.y,'#a89070',3,100,.3,2);}
      }
      x_sparks(e.x,e.y,'#a89070',10,200,.5,3);
    }
    if(game.psyn.cobrador&&isIsolated(e))gainSouls(2);
    if(game.brasains&&e.burnT>0){
      let n=0;
      for(const o of enemies){
        if(o.dead||o===e||n>=2)continue;
        if(x_dist(e.x,e.y,o.x,o.y)<130){o.burnT=Math.max(o.burnT||0,1.6);o.burnD=Math.max(o.burnD||0,2.4*P.dmgMult);n++;}
      }
    }
    if(e.type==='juiz')juizDefeated();
    if(e.xboss){META['xboss_'+e.type]=1;saveMeta();conqTick();}
    /* v1.4.4: o FERREIRO (boss da Garganta) caiu → a ESCADA DO FRIO desce no
       chão do salão. É ELA que leva ao corredor azulado (e ao Caronte). Nada
       de ficar preso na fase: a escada nasce ONDE ele morre. */
    if(e.type==='ferreiro'&&game.region==='vulcan'){
      game._ferreiroDead=1;
      const m=game.absMain;
      const sx=x_clamp(e.x,m.x+100,Math.max(m.x+101,m.x+m.w-100)),sy=x_clamp(e.y,m.y+80,Math.max(m.y+81,m.y+m.h-80));
      const rr2=game.mapRooms[game.roomIdx];
      if(rr2)rr2.stair={x:sx,y:sy};
      game.vulcStair={x:sx,y:sy,t:0};
      game._stairDescend=null;
      game.banner={type:'boss',txt:'A ESCADA DO FRIO',sub:'o calor recua — os degraus descem para o corredor azulado',t:0,dur:3.2};
      try{sfx.rumble();sfx.echo();}catch(err){}
      game.shake=Math.max(game.shake,10);game.flash=Math.max(game.flash,.25);
      for(let i=0;i<26;i++)particles.push({x:sx+rnd(-40,40),y:sy+rnd(-20,20),vx:rnd(-30,30),vy:rnd(-70,-10),life:rnd(.5,1.2),t:0,r:rnd(1.5,3),c:i%2?'#7fb8ff':'#cfe9ff',drag:.9,glow:i%2===0});
    }
    /* v1.3.3: o BOSS da Penumbra Infernal (andar 4) morto → a ESCADA PARA O
       FUNDO desce no chão do salão. Nada de varrer o andar inteiro. */
    if((e.type==='mb'||e.type==='ex'||e.type==='vi'||e.type==='gz')&&game.region==='penumbra'&&(game.floor||0)>=4){
      const m=game.absMain;
      const sx=x_clamp(e.x,m.x+100,Math.max(m.x+101,m.x+m.w-100)),sy=x_clamp(e.y,m.y+80,Math.max(m.y+81,m.y+m.h-80));
      const rr2=game.mapRooms[game.roomIdx];
      if(rr2)rr2.stair={x:sx,y:sy};
      game.floorStair={x:sx,y:sy,t:0};
      game._stairDescend=null;
      game.banner={type:'boss',txt:'A ESCADA PARA O FUNDO',sub:'os degraus desceram no salão — ela leva ao corredor do portão',t:0,dur:3.2};
      try{sfx.rumble();sfx.gate();}catch(err){}
      game.shake=Math.max(game.shake,10);game.flash=Math.max(game.flash,.25);
      for(let i=0;i<26;i++)particles.push({x:sx+rnd(-40,40),y:sy+rnd(-20,20),vx:rnd(-30,30),vy:rnd(-70,-10),life:rnd(.5,1.2),t:0,r:rnd(1.5,3),c:i%2?'#ff8f3d':'#c24a20',drag:.9,glow:i%2===0});
    }
  }catch(err){}
}
/* início do andar — juros e dívidas (via onEnterRoom sala 0) */
function floorStartFx(){
  try{
    if(game.pacDivida&&game.floor>1){
      /* v1.9.0: os juros caem sobre as ALMAS, nunca sobre a vida */
      const j=Math.min(40,Math.ceil((META.souls|0)*.15));
      if(j>0){META.souls-=j;texts.push({x:player.x,y:player.y-40,txt:'JUROS DA DÍVIDA -'+j+' almas',t:0,life:1.6,c:'#9d6bb5',size:12,disp:true});}
    }
    if(game.mods&&game.mods.dividasangue&&game.floor>1){
      const _ds=Math.min(10,META.souls|0);
      if(_ds>0){META.souls-=_ds;}
      texts.push({x:player.x,y:player.y-58,txt:'DÍVIDA DE SANGUE -'+_ds+' almas',t:0,life:1.6,c:'#d9465a',size:11,disp:true});
    }
    game._penaUsedFloor=false;
  }catch(e){}
}
/* ================================================================
   v1.3.3 — A ESCADA PARA O FUNDO (Penumbra Infernal, andar 4)
   Matar O BOSS faz a escada descer no salão. Pisé nela → fade curto →
   o CORREDOR DO PORTÃO (mais longo, portal de frente). Nada trava:
   a descida sempre conclui, com ou sem input.
   ================================================================ */
function frameStairGate(dt){
 try{
  if(game.state!=='play')return;
  if(game.region==='penumbra'&&(game.floor||0)>=4&&!game._arenaLock){
   const r=game.mapRooms[game.roomIdx];
   if(r&&r.stair&&!game.floorStair)game.floorStair={x:r.stair.x,y:r.stair.y,t:0};
  }
  /* v1.4.4: GARGANTA — se o Ferreiro já caiu e a escada sumiu (save/edge),
     ela renasce no centro da sala atual; nada de fase infinita */
  if(game.region==='vulcan'&&game._ferreiroDead&&!game.vulcStair&&!game._stairDescend){
   const m=game.absMain;
   game.vulcStair={x:m.x+m.w/2,y:m.y+m.h*.42,t:0};
   const rr3=game.mapRooms[game.roomIdx];if(rr3)rr3.stair={x:game.vulcStair.x,y:game.vulcStair.y};
  }
  if(game._stairDescend){
   game._stairDescend.t+=dt;
   if(game._stairDescend.t>=.55){
    const to=game._stairDescend.to||'gate';
    game._stairDescend=null;game.floorStair=null;game.vulcStair=null;
    if(to==='blue')startBlueCorr();else startGatePath();
   }
   return;
  }
  if(game.floorStair&&!player.dead&&game.fallK<0&&x_dist(player.x,player.y,game.floorStair.x,game.floorStair.y)<42){
   game._stairDescend={t:0,to:'gate'};
   try{sfx.rumble();blip('sine',90,46,1,.1);}catch(e){}
   game.banner={type:'small',txt:'DESCENDO',sub:'os degraus descem para o corredor do portão',t:0,dur:1.4};
  }
  /* v1.4.4: pisar na ESCADA DO FRIO desce para o corredor azulado */
  if(game.vulcStair&&!player.dead&&game.fallK<0&&x_dist(player.x,player.y,game.vulcStair.x,game.vulcStair.y)<42){
   game._stairDescend={t:0,to:'blue'};
   try{sfx.echo();blip('sine',300,140,1,.09);}catch(e){}
   game.banner={type:'small',txt:'DESCENDO',sub:'o calor fica para trás',t:0,dur:1.4};
  }
 }catch(e){}
}
function ensureFloorStair(){
 try{
  if(game.region!=='penumbra'||(game.floor||0)<4)return;
  if(game.mapRooms.some(function(r){return r.stair;}))return;
  const br=game.mapRooms.find(function(r){return r.kind==='miniboss'&&r.cleared;});
  if(!br)return;
  br.stair={x:br===game.mapRooms[game.roomIdx]?game.absMain.x+game.absMain.w/2:0,y:br===game.mapRooms[game.roomIdx]?game.absMain.y+game.absMain.h*.4:0};
  if(!br.stair.x){const m=game.absMain;br.stair.x=m.x+m.w/2;br.stair.y=m.y+m.h*.4;}
 }catch(e){}
}
function drawFloorStair(){
 try{
  if(game.state!=='play'||game._stairDescend)return;
  /* v1.4.4: a Garganta tem a própria escada (fria) — desenhada junto */
  if(game.region==='vulcan'&&game.vulcStair){
   const s2=game.vulcStair;s2.t=(s2.t||0)+1/60;
   ctx.save();ctx.translate(s2.x,s2.y);
   const w2=92,h2=56;
   ctx.fillStyle='#03060a';ctx.fillRect(-w2/2,-h2/2,w2,h2);
   for(let i=0;i<4;i++){
    const dw=w2-12-i*15;
    ctx.fillStyle='rgba(10,20,32,'+(.6+i*.13)+')';
    ctx.fillRect(-dw/2,-h2/2+7+i*11,dw,9);
   }
   ctx.strokeStyle='#3f6d9e';ctx.lineWidth=2;ctx.strokeRect(-w2/2,-h2/2,w2,h2);
   const p2=.5+.5*Math.sin(game.t*3);
   ctx.globalAlpha=.3+.3*p2;
   ctx.strokeStyle='#7fb8ff';ctx.lineWidth=1.5;
   ctx.strokeRect(-w2/2+4,-h2/2+4,w2-8,h2-8);
   ctx.globalAlpha=1;
   ctx.fillStyle='#a8d8ff';ctx.font='9px IBM Plex Mono';ctx.textAlign='center';
   ctx.fillText('A ESCADA · O CORREDOR',0,h2/2+13);
   ctx.restore();
   if(Math.random()<.12)particles.push({x:s2.x+rnd(-34,34),y:s2.y+rnd(-14,14),vx:rnd(-4,4),vy:rnd(-26,-8),life:rnd(.5,1),t:0,r:rnd(1,2),c:'#7fb8ff',drag:1,glow:true});
  }
  if(!game.floorStair)return;
  const s=game.floorStair;
  s.t=(s.t||0)+1/60;
  ctx.save();ctx.translate(s.x,s.y);
  const w=92,h=56;
  ctx.fillStyle='#060304';ctx.fillRect(-w/2,-h/2,w,h);
  for(let i=0;i<4;i++){
   const dw=w-12-i*15;
   ctx.fillStyle='rgba(26,14,10,'+(.6+i*.13)+')';
   ctx.fillRect(-dw/2,-h/2+7+i*11,dw,9);
  }
  ctx.strokeStyle='#c24a20';ctx.lineWidth=2;ctx.strokeRect(-w/2,-h/2,w,h);
  const p=.5+.5*Math.sin(game.t*3);
  ctx.globalAlpha=.3+.3*p;
  ctx.strokeStyle='#ff8f3d';ctx.lineWidth=1.5;
  ctx.strokeRect(-w/2+4,-h/2+4,w-8,h-8);
  ctx.globalAlpha=1;
  ctx.fillStyle='#ffb27a';ctx.font='9px IBM Plex Mono';ctx.textAlign='center';
  ctx.fillText('A ESCADA · DESÇA',0,h/2+13);
  ctx.restore();
  if(Math.random()<.12)particles.push({x:s.x+rnd(-34,34),y:s.y+rnd(-14,14),vx:rnd(-4,4),vy:rnd(-26,-8),life:rnd(.5,1),t:0,r:rnd(1,2),c:'#ff8f3d',drag:1,glow:true});
 }catch(e){}
}
/* entrada em sala — ganchos de zona/eventos (1 linha no enterRoom) */
function onEnterRoom(){
  try{
    CV.active=false; /* o cervo não atravessa salas */
    genVulcanRoom();
    if(game.roomIdx===0)floorStartFx();
    maybeCervoEvent();
    /* PACTO 404 — a cada sala: um presente forte e uma maldição */
    if(game.pac404&&!game.god){
      const buff=pick([
        function(){P.dmgMult*=1.3;return'+30% DANO';},
        function(){P.rateMult*=1.3;return'+30% CADÊNCIA';},
        function(){P.speedMult*=1.3;return'+30% VELOCIDADE';},
        function(){player.maxHp+=20;player.hp+=20;return'+20 VIDA MÁXIMA';},
        function(){P.soulMult*=1.5;return'+50% ALMAS';}
      ])();
      const curse=pick([
        function(){player.maxHp=Math.max(40,player.maxHp-10);return'-10 VIDA MÁXIMA';},
        function(){P.speedMult*=.92;return'-8% VELOCIDADE';},
        function(){player.hp=Math.max(1,player.hp-15);return'-15 DE VIDA AGORA';},
        function(){P.magnetMult=Math.max(0,P.magnetMult-.4);return'ALMAS MAIS DISTANTES';},
        function(){game.glitchT=1.2;return'O MUNDO GLITCHA';}
      ])();
      game.banner={type:'small',txt:'PACTO 404',sub:buff+' — MAS '+curse,t:0,dur:3.2};
      try{sfx.glitch();}catch(e){}
    }
    /* SALA DA SERPENTE (secreta) — salas secretas do Limbo */
    if((game.region==='limbo')&&game.roomKind==='secret'&&!enemies.length&&Math.random()<.5){
      const p=x_ptInRoom(110);
      texts.push({x:p.x,y:p.y-30,txt:'uma rachadura de estrelas no teto... [Z]',t:0,life:4,c:'#cfe9ff',size:12,disp:true});
      game.serpCrack=p;
    }
    /* ANJO ACORRENADO — raro no Limbo Infernal (fase 3+) */
    if(game.region==='limbo'&&(game.limboPhase||1)>=3&&game.roomKind==='combat'&&Math.random()<.14&&!enemies.length){
      spawnEnemy('anjo',game.absMain.x+game.absMain.w/2,game.absMain.y+game.absMain.h*.3);
      game.banner={type:'boss',txt:'O ANJO ACORRENADO',sub:'quebre as quatro amarras — depois ele fica livre',t:0,dur:3.2};
      try{sfx.roar();}catch(e){}
    }
    /* O INFERNO OBSERVA — olhos no chão da sala */
    if(game.mods&&game.mods.observado&&Math.random()<.6){
      game.hellEyes=game.hellEyes||[];
      for(let i=0;i<3;i++){const p=x_ptInRoom(60);game.hellEyes.push({x:p.x,y:p.y,t:0});}
    }
    /* PORTAS FECHADAS — nenhuma feira instala a barraaca */
    if(game.mods&&game.mods.portasfechadas){game.keeper=null;game.shopNear=null;game.shopItems=[];}
  }catch(e){}
}
/* ================================================================
   9. CUTSCENES DE TRANSIÇÃO (≤1s) — portas e escadas, para THOR e
   para a COISA DE CERVO. Thor: vinheta + batente + silhueta andando
   durante a queda já existente (0.85s). Cervo: quando ele atravessa
   uma porta perto de você, um clarão curto mostra a silhueta dele
   cruzando a fresta — sem bloquear o jogo, com pausa de 7s.
   ================================================================ */
let hTrans=null; /* cutscene do cervo */
let hTransCd=0;
function hunterDoorCross(prev,next){
  try{
    const h=SCHOOL.hunt;
    if(!h)return;
    if(h.state==='chase'||h.state==='finalchase')return; /* na caçada, nada de cutscene */
    if(hTransCd>0)return;
    /* audibilidade: perto da sala do jogador (mesma, vizinha) */
    const near=(next===SCHOOL.area||prev===SCHOOL.area||adjacent(next,SCHOOL.area));
    if(!near)return;
    hTransCd=7;
    hTrans={t:0,dur:.85,dir:Math.random()<.5?1:-1};
    try{noiseSfx(.5,.06,240,'lowpass');sfx.creak();}catch(e){}
  }catch(e){}
}
function drawTransitionOverlay(){
  /* THOR — durante a queda de porta/escada (escola e salas comuns) */
  if(game.fallK>=0&&game.fallTarget&&(game.fallTarget.school!==undefined||game.fallTarget.to!==undefined)){
    const k=smooth(x_clamp(game.fallK,0,1));
    const a=Math.sin(k*Math.PI); /* entra e sai */
    ctx.save();
    ctx.globalAlpha=a*.92;
    ctx.fillStyle='#050308';ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=a;
    /* fresta da porta abrindo */
    const dw=lerp(30,190,k);
    ctx.fillStyle='#161020';
    ctx.fillRect(W/2-dw/2-14,H*.22,14,H*.56);
    ctx.fillRect(W/2+dw/2,H*.22,14,H*.56);
    ctx.fillRect(W/2-dw/2-14,H*.22-10,dw+28,10);
    /* silhueta do thor andando (pernas alternando com k) */
    const px=W/2,py=H*.56;
    ctx.fillStyle='#0c0812';
    ctx.beginPath();ctx.arc(px,py-26,13,0,TAU);ctx.fill();
    ctx.fillRect(px-9,py-14,18,24);
    const sw=Math.sin(k*Math.PI*6);
    ctx.fillRect(px-9,py+10,7,16+sw*5);
    ctx.fillRect(px+2,py+10,7,16-sw*5);
    /* o cervo, se a caçada estiver viva: ele atravessa atrás */
    const h=SCHOOL&&SCHOOL.hunt;
    if(h&&h.state&&h.state!=='none'&&!h.gone){
      ctx.globalAlpha=a*.5;
      ctx.fillStyle='#000';
      drawDeerShape(W/2-dw/2+dw*k,py+4,'#050308',k*9);
    }
    ctx.restore();
  }
  /* COISA DE CERVO — fresta com a silhueta cruzando (não bloqueia) */
  if(hTrans){
    hTrans.t+=1/60;
    const k=hTrans.t/hTrans.dur;
    if(k>=1){hTrans=null;return;}
    const a=Math.sin(k*Math.PI);
    ctx.save();
    ctx.globalAlpha=a*.85;
    ctx.fillStyle='#030204';
    ctx.fillRect(0,0,W,H);
    /* a fresta de luz da porta */
    const sw2=lerp(8,26,Math.sin(k*Math.PI));
    ctx.globalAlpha=a;
    ctx.fillStyle='rgba(214,198,172,.5)';
    ctx.fillRect(W/2-sw2/2,H*.3,sw2,H*.4);
    /* a silhueta passa da esquerda para a direita (ou ao contrário) */
    const dx=lerp(-80,80,k)*hTrans.dir;
    drawDeerShape(W/2+dx,H*.5,'#020103',k*7);
    ctx.restore();
  }
}
/* ================================================================
   10. DIFICULDADES — PUNIÇÃO · KAIZO · ABISMO · PENITÊNCIA + 7
   modificadores. Os botões nascem DENTRO do seletor existente.
   ================================================================ */
const DIFFS={
  facil:{n:'FÁCIL',hint:'o combate de sempre — padrões antigos, arenas antigas, o anel com a brecha de sempre. o perfil legado, sem danmaku.'},
  normal:{n:'NORMAL',hint:'danmaku na medida: salas maiores, inimigos nos postos, círculos completos e X no lugar do anel com brecha.'},
  hard:{n:'HARD',hint:'bullet hell: mais projéteis por salva, intervalos menores e chefes com padrões extras.'},
  punicao:{n:'PUNIÇÃO',hint:'pressão total: salvas sobrepostas, trajetórias complexas e almas mais raras. o inferno cobra cada passo.'},
  kaizo:{n:'KAIZO',hint:'versões extremas dos padrões: sequências adicionais, alternância de direções e combinações que exigem domínio.'},
  abismo:{n:'ABISMO',hint:'os demônios caçam em grupo, elites multiplicam e os chefes ganham padrões extras.'},
  penitencia:{n:'PENITÊNCIA',hint:'economia estrangulada, pactos mais perigosos — só para quem concluiu o ABISMO.'}
};
const MODS=[
  {id:'instavel',n:'INFERNO INSTÁVEL',d:'brasas caem do teto'},
  {id:'semmisericordia',n:'SEM MISERICÓRDIA',d:'nenhuma invencibilidade após o golpe'},
  {id:'dividasangue',n:'DÍVIDA DE SANGUE',d:'-10 de vida ao descer, -5 por andar'},
  {id:'silencio',n:'SILÊNCIO ABSOLUTO',d:'a música morre — você joga no silêncio'},
  {id:'observado',n:'O INFERNO OBSERVA',d:'olhos brotam no chão e assistem'},
  {id:'portasfechadas',n:'PORTAS FECHADAS',d:'nenhuma feira abre na descida'},
  {id:'semsegunda',n:'SEM SEGUNDA CHANCE',d:'nenhum revive — nem de relíquia'}
];
function buildDiffUI(){
  try{
    const diffBox=document.querySelector('#weapons .diff');
    if(!diffBox||diffBox.dataset.exp)return;
    diffBox.dataset.exp='1';
    /* os botões novos (v1.5.0: FÁCIL entra na frente — é o perfil legado) */
    for(const key of['facil','punicao','kaizo','abismo','penitencia']){
      const b=document.createElement('button');
      b.className='diffBtn';b.id='dX_'+key;b.textContent=DIFFS[key].n;
      if(key==='penitencia'&&!penitUnlocked()){b.title='conclua o ABISMO para desbloquear';}
      b.addEventListener('click',function(){
        audio();
        if(key==='penitencia'&&!penitUnlocked()){x_txt('CONCLUA O ABISMO PRIMEIRO',W/2,H*.5,12,'#d9465a');try{sfx.thud();}catch(e){}return;}
        setDiff(key);
      });
      diffBox.appendChild(b);
    }
    /* v1.5.1: a ESCADA da dificuldade na ordem certa — FÁCIL primeiro (quem
       quer só conhecer), KAIZO por ÚLTIMO (o topo da fila, o proibido) */
    try{
      const ord=['dX_facil','dNorm','dHard','dX_punicao','dX_abismo','dX_penitencia','dX_kaizo'];
      for(const id of ord){const el=document.getElementById(id);if(el)diffBox.appendChild(el);}
    }catch(e2){}
    /* painel de modificadores */
    const row=document.createElement('div');
    row.id='xMods';
    row.style.cssText='display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px;max-width:640px';
    for(const m of MODS){
      const c=document.createElement('button');
      c.className='diffBtn';c.id='xmod_'+m.id;
      c.textContent=m.n;c.title=m.d;
      c.style.fontSize='8px';c.style.padding='5px 8px';c.style.opacity='.75';
      c.addEventListener('click',function(){
        audio();
        if(!game.xMods)game.xMods={};
        game.xMods[m.id]=!game.xMods[m.id];
        c.classList.toggle('sel',!!game.xMods[m.id]);
        c.style.opacity=game.xMods[m.id]?'1':'.75';
        try{blip('sine',400,600,.06,.05);}catch(e){}
      });
      row.appendChild(c);
    }
    diffBox.parentNode.insertBefore(row,diffBox.nextSibling);
    /* envolve setDiff para pintar os botões novos */
    const _sd=setDiff;
    setDiff=function(mode){
      _sd(mode);
      for(const key in DIFFS){
        const b=document.getElementById('dX_'+key);
        if(b)b.classList.toggle('sel',mode===key);
      }
      const hint=document.querySelector('.diffHint')||ov('diffHint');
      if(hint&&DIFFS[mode])hint.textContent=DIFFS[mode].hint;
      const pb=document.getElementById('dX_penitencia');
      if(pb){pb.style.opacity=penitUnlocked()?'1':'.45';}
    };
    setDiff(diffSel);
  }catch(e){}
}
function penitUnlocked(){return(META.abismoWins||0)>=1;}
/* wrappers de economia (PENITÊNCIA/PÉSSIMO NEGÓCIO/BARQUEIRO) */
const _origGainSouls=gainSouls;
gainSouls=function(n){
  try{
    if(diffSel==='penitencia'||(game.mods&&game.modsIsPen))n=Math.round(n*.65);
  }catch(e){}
  const got=_origGainSouls(n);
  try{
    if(game.pacBarq){
      game.barqK=(game.barqK||0)+n;
      if(game.barqK>=60){
        game.barqK-=60;
        /* v1.9.0: o pedágio agora é em almas — nunca em vida */
        const _ped=Math.min(15,n);
        if(_ped>0)META.souls=Math.max(0,(META.souls|0)-_ped);
        x_txt('O PEDÁGIO: -'+_ped+' almas',player.x,player.y-40,10,'#7fb8ff');
        try{noiseSfx(.3,.05,200,'lowpass');}catch(e){}
      }
    }
  }catch(e){}
  return got;
};
const _origShopPrice=shopPrice;
shopPrice=function(p,disc){
  let v=_origShopPrice(p,disc);
  try{
    if(game.pacPessimo)v=Math.ceil(v/2);
    if(diffSel==='penitencia')v=Math.ceil(v*1.4);
  }catch(e){}
  return v;
};
/* ================================================================
   11. GRIMÓRIO — aba SINERGIAS: combinações descobertas, pistas
   Rasuradas para as secretas. Persistente em META.psyn.
   ================================================================ */
function renderSynTab(){
  const body=ov('bookBody');if(!body)return;
  const ch=ov('grimChips');if(ch)ch.innerHTML='';
  let h='<div class="bkSect">SINERGIAS — OS PARES DO INFERNO</div>';
  h+='<div class="bkNote" style="color:#6e6357;font-size:10px;margin-bottom:8px">combinações de elementos e de itens. as páginas em branco esperam a descoberta.</div>';
  const all=PAIR_SYN.concat(EXP_SYN.map(function(s){return{key:s.key,name:s.name,sub:s.sub,exp:true};}));
  let found=0;
  for(const p of all){
    const got=(META.psyn&&META.psyn[p.key])||(game.psyn&&game.psyn[p.key]);
    if(got)found++;
    h+='<div class="bkRow" style="border-left:3px solid '+(got?'#ffd9a0':'#2a2430')+';padding:6px 10px;margin-bottom:6px;background:rgba(13,9,11,.6)">';
    if(got){
      h+='<b style="color:#ffd9a0">'+p.name+'</b><div style="color:#9c8f7c;font-size:10px">'+p.sub+'</div>';
    }else{
      /* página rasurada: só a dica dos elementos */
      let hint='?? ??';
      if(!p.exp&&p.a&&p.b){const A=ELEM[p.a],B=ELEM[p.b];hint=(A?A.n:'?')+' + '+(B?B.n:'?');}
      h+='<b style="color:#3a3345">█████ ████</b><div style="color:#3a3345;font-size:10px;font-style:italic">'+(p.exp?'dois itens que se conversam…':hint+' — as palavras foram rasuradas')+'</div>';
    }
    h+='</div>';
  }
  h+='<div class="bkNote" style="color:#6e6357;font-size:10px;margin-top:6px">descobertas: '+found+'/'+all.length+'</div>';
  /* categorias elementais */
  h+='<div class="bkSect" style="margin-top:12px">CATEGORIAS ELEMENTAIS</div>';
  for(const k in ELEM){
    h+='<span style="display:inline-block;margin:3px;padding:3px 8px;border:1px solid '+ELEM[k].c+'33;color:'+ELEM[k].c+';font-size:9px">'+ELEM[k].n+'</span>';
  }
  body.innerHTML=h;
}
/* ================================================================
   12. CONQUISTAS NOVAS + TEMAS DE MÚSICA NOVOS (sintetizados)
   ================================================================ */
try{
  CONQS.push(
    {id:'cerbportao',n:'O PORTÃO ABRIU',d:'atravesse o caminho sem almas e derrube o guardião das três gargantas',chk:function(m){return !!m.cerbSlain;}},
    {id:'ferreiro',n:'A FORJA SILENCIOU',d:'derrote o Ferreiro das Almas na Garganta Vulcânica',chk:function(m){return !!m.xboss_ferreiro;}},
    {id:'anjo',n:'AS AMARRAS PARTIDAS',d:'derrote o Anjo Acorrentado',chk:function(m){return !!m.xboss_anjo;}},
    {id:'serp',n:'A SERPENTE ENGASGOU',d:'encontre e derrote a Serpente que Engole Estrelas',chk:function(m){return !!m.xboss_serp;}},
    {id:'sthor',n:'O QUE NÃO DESCEU',d:'enfrente aquele que ficou na fila — e vença',chk:function(m){return !!m.xboss_sthor;}},
    {id:'juiz',n:'A SENTENÇA FINAL',d:'derrote o Juiz Sem Rosto no fim do Limbo',chk:function(m){return !!m.xboss_juiz;}},
    {id:'sin404',n:'PÁGINA 404',d:'selou o Pacto 404 e sobreviveu ao que veio depois',chk:function(m){return !!(m.acq&&m.acq.pacto404);}},
    {id:'sin5',n:'ALQUIMISTA DAS ALMAS',d:'desperte 5 sinergias diferentes',chk:function(m){return Object.keys(m.psyn||{}).length>=5;}},
    {id:'penit',n:'PENITENTE',d:'conclua a descida na PENITÊNCIA',chk:function(m){return(m.abismoWins||0)>=1&&!!m.penitWin;}}
  );
}catch(e){}
try{
  /* temas novos (16 passos, igual aos existentes) */
  THEME_SEQ.vulcan={step:.26,
    bass:[55,0,55,58.27,0,55,49,0,55,0,58.27,0,65.41,0,49,55],
    sub:[110,0,110,0,116.54,0,98,0,110,0,116.54,0,130.8,0,98,110],
    tick:[1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1]};
  THEME_SEQ.portao={step:.5,
    bass:[41.2,0,0,0,0,0,0,0,38.89,0,0,0,0,0,0,0],
    sub:[82.4,0,0,0,0,0,0,0,77.8,0,0,0,0,0,0,0],
    tick:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]};
  THEME_SEQ.cerberus={step:.34,
    bass:[36.7,0,36.7,0,38.89,0,36.7,0,43.65,0,0,0,36.7,0,32.7,0],
    sub:[73.4,0,0,73.4,77.8,0,0,0,87.3,0,0,0,73.4,0,65.4,0],
    tick:[1,0,0,1,0,0,1,0,1,0,1,0,1,1,0,1]};
  THEME_SEQ.azul={step:.6,
    bass:[49,0,0,0,0,0,0,0,46.2,0,0,0,0,0,0,0],
    sub:[98,0,0,0,92.5,0,0,0,0,0,0,0,0,0,0,0],
    tick:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]};
  THEME_SEQ.silencio={step:1e9,bass:[0],sub:[0],tick:[0]};
  THEME_SEQ['boss:juiz']={step:.3,
    bass:[49,0,49,0,46.2,0,49,0,41.2,0,49,0,46.2,0,43.65,0],
    sub:[98,0,0,98,92.5,0,0,98,82.4,0,0,98,92.5,0,87.3,0],
    tick:[1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,1]};
  THEME_SEQ['boss:ferreiro']=THEME_SEQ.boss;
  THEME_SEQ['boss:anjo']={step:.4,
    bass:[65.4,0,0,0,61.7,0,0,0,58.3,0,0,0,55,0,0,0],
    sub:[130.8,0,0,0,123.5,0,0,0,116.5,0,0,0,110,0,0,0],
    tick:[0,0,1,0,0,0,1,0,0,0,1,0,0,1,1,0]};
  THEME_SEQ['boss:serp']={step:.28,
    bass:[43.65,0,46.2,0,43.65,0,41.2,0,43.65,0,46.2,0,49,0,41.2,0],
    sub:[87.3,0,92.5,0,87.3,0,82.4,0,87.3,0,92.5,0,98,0,82.4,0],
    tick:[1,1,0,1,1,0,1,1,1,1,0,1,1,0,1,1]};
  THEME_SEQ['boss:sthor']={step:.24,
    bass:[55,0,0,55,0,0,55,0,58.27,0,0,58.27,0,0,49,0],
    sub:[110,0,0,0,110,0,0,0,116.5,0,0,0,98,0,0,0],
    tick:[1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1]};
}catch(e){}
/* ================================================================
   13. BOOT — ligar tudo: wrappers, cartas de arma, abas e binds.
   ================================================================ */
function bindWeaponCards(){
  try{
    for(const id in X_WEAPONS){
      const el=document.getElementById('w_'+id);
      if(!el)continue;
      (function(wid){
        el.addEventListener('click',function(){
          audio();try{sfx.blip?0:0;blip('sine',420,560,.08,.06);}catch(e){}
          startGame(wid);
        });
        el.addEventListener('mouseenter',function(){try{blip('sine',500,650,.05,.03);}catch(e){}});
      })(id);
    }
  }catch(e){}
}
/* interação com a rachadura da serpente (tecla Z na sala secreta) */
function serpInteract(){
  try{
    if(!game.serpCrack)return;
    if(x_dist(player.x,player.y,game.serpCrack.x,game.serpCrack.y)<90){
      spawnEnemy('serp',game.serpCrack.x,game.serpCrack.y);
      game.serpCrack=null;
      game.banner={type:'boss',txt:'A SERPENTE QUE ENGOLE ESTRELAS',sub:'ela tem fome do seu céu',t:0,dur:3.4};
      try{sfx.roar();sfx.echo();}catch(e){}
    }
  }catch(e){}
}
/* ---- API PÚBLICA (ganchos chamados pelo game.js/school.js) ---- */
window.__EXPANSION={
  /* loop do play — 1 gancho no fim do updatePlay */
  frame:function(dt){
    try{
      updateMusicZone();
      frameWeapons(dt);
      frameSyn(dt);
      updateXProjectiles(dt);
      updateVulcanHazards(dt);
      updateCervo(dt);
      frameCerberus(dt); /* v1.3.1: as fases do Cérbero rodam NA LUTA (estado play) */
      frameStairGate(dt); /* v1.3.3: a escada para o fundo (pisar = descer) */
      if(typeof frameLabStair==='function')frameLabStair(dt); /* v1.4.3: a escada da sala de testes */
      if(hTransCd>0)hTransCd-=dt;
      /* coordenção do ABISMO: os demônios caçam juntos */
      if((diffSel==='abismo'||diffSel==='penitencia')&&enemies.length>2){
        _coordT+=dt;
        if(_coordT>=4){
          _coordT=0;
          for(const e of enemies){
            if(e.dead||e.spawnT<1||e.xboss)continue;
            const a=Math.atan2(player.y-e.y,player.x-e.x);
            e.x+=Math.cos(a)*40;e.y+=Math.sin(a)*40;
            x_sparks(e.x,e.y,'#d9465a',2,80,.25,2);
          }
          try{noiseSfx(.25,.03,300,'lowpass');}catch(e){}
        }
      }
      /* SEM SEGUNDA CHANCE — nenhum revive */
      if(game.mods&&game.mods.semsegunda&&game.relicRevive)game.relicRevive=false;
      /* JUIZ derrotado — a tela de vitória espera um instante */
      if(game._winWait){
        game._winWait-=dt;
        if(game._winWait<=0){
          game._winWait=0;
          if(diffSel==='abismo'||diffSel==='penitencia'){META.abismoWins=(META.abismoWins||0)+1;}
          if(diffSel==='penitencia'){META.penitWin=1;}
          saveMeta();
          game.state='won';
          showOv('win');
          try{sfx.win();}catch(e){}
        }
      }
      /* correntes visuais do credor */
      for(let i=correnteFx.length-1;i>=0;i--){const c=correnteFx[i];c.t+=dt;if(c.t>=c.life)correnteFx.splice(i,1);}
    }catch(e){}
  },
  /* loop do bossintro (Cérbero) */
  frameBossIntro:function(dt){try{updateMusicZone();frameCerberus(dt);}catch(e){}},
  /* desenho no chão (antes das entidades) */
  drawFloor:function(){
    try{
      drawFloorStair(); /* v1.3.3: a escada para o fundo */
      if(typeof drawLabStair==='function')drawLabStair(); /* v1.4.3: a escada/laboratório da sala de testes */
      /* zonas da arma SENTENÇA + trilhas de fogo + poças */
      for(let i=julgZones.length-1;i>=0;i--){
        const z=julgZones[i];z.t+=1/60;
        if(z.t>=z.life){julgZones.splice(i,1);continue;}
        const a=(1-z.t/z.life)*.5;
        ctx.save();ctx.globalAlpha=a;
        ctx.strokeStyle='#ffd9a0';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();
        ctx.fillStyle='rgba(255,217,160,.12)';
        ctx.fill();
        ctx.restore();
        for(const e of enemies){if(!e.dead&&x_dist(e.x,e.y,z.x,z.y)<z.r)x_dmgEnemy(e,7*P.dmgMult*(1/60),'#ffd9a0');}
      }
      for(const f of fogoTrail){
        const a=(1-f.t/f.life)*.55;
        ctx.save();ctx.globalAlpha=a;
        const g=ctx.createRadialGradient(f.x,f.y,2,f.x,f.y,f.r);
        g.addColorStop(0,'#ffd9a0');g.addColorStop(1,'rgba(255,143,61,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,TAU);ctx.fill();
        ctx.restore();
      }
      for(const p of poças){
        const a=(1-p.t/p.life)*.4;
        ctx.save();ctx.globalAlpha=a;
        ctx.fillStyle='#3d6a8a';
        ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*.6,0,0,TAU);ctx.fill();
        ctx.fillStyle='rgba(127,184,255,.25)';
        ctx.beginPath();ctx.ellipse(p.x-4,p.y-2,p.r*.7,p.r*.4,0,0,TAU);ctx.fill();
        ctx.restore();
      }
      drawVulcanHazards();
      drawCervo();
      /* rachadura da serpente */
      if(game.serpCrack){
        const p=game.serpCrack;
        ctx.save();
        ctx.globalAlpha=.6+.4*Math.sin(game.t*3);
        ctx.strokeStyle='#cfe9ff';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(p.x-20,p.y);ctx.lineTo(p.x-6,p.y-8);ctx.lineTo(p.x+8,p.y+4);ctx.lineTo(p.x+22,p.y-4);ctx.stroke();
        ctx.restore();
      }
    }catch(e){}
  },
  /* overlay final (tint de zona + efeitos por cima) */
  draw:function(){
    try{
      const zn=zoneOf();
      if(game.state==='play'||game.state==='bossintro'){
        if(zn.z==='penumbra'&&zn.ph===2){
          /* v1.3.4: a Penumbra das Almas voltou ao NORMAL — bem escura,
             só o véu cinza de sempre (sem lavagem quente, sem brasas) */
          ctx.fillStyle='rgba(120,120,118,.09)';ctx.fillRect(0,0,W,H);
          /* árvores mortas nas laterais */
          ctx.fillStyle='rgba(20,18,16,.5)';
          for(let i=0;i<3;i++){
            const tx=90+i*(W-180)/2,sw=Math.sin(i*7)*30;
            ctx.fillRect(tx-2,140,4,H*.42);
            ctx.save();ctx.translate(tx,180);ctx.rotate(.5+sw*.01);ctx.fillRect(-1,-40,3,44);ctx.restore();
            ctx.save();ctx.translate(tx,H*.4);ctx.rotate(-.6);ctx.fillRect(-1,-36,3,40);ctx.restore();
          }
        }else if(zn.z==='peninf'||(zn.z==='limbinf'&&zn.ph<2)){ /* v1.6.2: o véu de fogo/fissuras morre na fase cinza (limbinf fase 2) — o fundo fica LISO */
          /* v1.3.5: o chão queimado já vem do wash — na Infernal, véu de calor
             geral + brasa subindo pelas laterais da tela; a limbinf mantém o
             véu leve de sempre */
          ctx.fillStyle='rgba(255,120,40,.045)';ctx.fillRect(0,0,W,H);
          if(zn.z==='peninf'){
          ctx.fillStyle='rgba(255,120,40,.028)';ctx.fillRect(0,0,W,H);
          const _wg=ctx.createLinearGradient(0,0,0,H);
          _wg.addColorStop(0,'rgba(255,96,26,0.12)');_wg.addColorStop(.26,'rgba(255,96,26,0)');
          _wg.addColorStop(.74,'rgba(255,96,26,0)');_wg.addColorStop(1,'rgba(255,96,26,0.12)');
          ctx.fillStyle=_wg;ctx.fillRect(0,0,W,H);
          }
          /* fissuras com brasa */
          ctx.strokeStyle='rgba(255,143,61,'+(.25+.15*Math.sin(game.t*2))+')';
          ctx.lineWidth=2;
          for(let i=0;i<4;i++){
            const fx=(i+1)*W/5;
            ctx.beginPath();ctx.moveTo(fx,H*.3);ctx.lineTo(fx+24,H*.44);ctx.lineTo(fx-10,H*.6);ctx.lineTo(fx+16,H*.75);ctx.stroke();
          }
          if(Math.random()<.2)particles.push({x:rnd(0,W),y:rnd(H*.3,H),vx:rnd(-4,4),vy:rnd(-30,-10),life:rnd(.6,1.2),t:0,r:rnd(1,2),c:'#ff8f3d',drag:1,glow:true});
        }else if(zn.z==='vulcan'){
          ctx.fillStyle='rgba(180,40,10,.08)';ctx.fillRect(0,0,W,H);
        }
      }
      /* v1.3.1: FX do CÉRBERO remasterizado (telegráfo/pescoços/escuridão) */
      if(boss.active)drawCerberusFX();
      /* correntes do credor */
      for(const c of correnteFx){
        const a=1-c.t/c.life;
        ctx.save();ctx.globalAlpha=a*.7;
        ctx.strokeStyle='#9d6bb5';ctx.lineWidth=2;
        ctx.setLineDash([6,4]);
        ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(c.tx,c.ty);ctx.stroke();
        ctx.restore();
      }
      /* v1.3.2: o chicote da dívida — corrente viva da amarra + estalo em arco + mira */
      if(game.weapon==='credor'&&(game.state==='play'||game.state==='bossintro'||game.state==='carontefight')&&!player.dead&&game.fallK<0){
        if(wst.bind&&wst.bind.o){
          const bo=wst.bind.o;
          ctx.save();
          ctx.strokeStyle='rgba(157,107,181,.85)';ctx.lineWidth=2.5;
          ctx.setLineDash([7,3]);
          ctx.beginPath();ctx.moveTo(player.x,player.y);
          ctx.quadraticCurveTo((player.x+bo.x)/2+Math.sin(game.t*9)*4,(player.y+bo.y)/2+Math.cos(game.t*9)*4,bo.x,bo.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle='rgba(201,160,255,.9)';ctx.lineWidth=1.2;
          ctx.beginPath();ctx.arc(bo.x,bo.y,(bo.r||16)+5+Math.sin(game.t*10)*2,0,TAU);ctx.stroke();
          ctx.restore();
        }
        if(wst.sweep&&wst.sweep.t<.2){
          wst.sweep.t+=1/60;
          const k2=wst.sweep.t/.2;
          ctx.save();ctx.globalAlpha=(1-k2)*.75;
          ctx.strokeStyle='#9d6bb5';ctx.lineWidth=3.5*(1-k2)+1;
          ctx.beginPath();ctx.arc(player.x,player.y,(60+240*k2)*P.reachMult,wst.sweep.a-1.75,wst.sweep.a+1.75);ctx.stroke();
          ctx.restore();
        }
        if(mouse.inCanvas&&!wst.bind){
          ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle='#9d6bb5';ctx.lineWidth=1;
          ctx.beginPath();ctx.arc(mouse.x,mouse.y,7+Math.sin(game.t*6)*1.5,0,TAU);ctx.stroke();
          ctx.beginPath();ctx.moveTo(mouse.x-11,mouse.y);ctx.lineTo(mouse.x-4,mouse.y);
          ctx.moveTo(mouse.x+4,mouse.y);ctx.lineTo(mouse.x+11,mouse.y);
          ctx.moveTo(mouse.x,mouse.y-11);ctx.lineTo(mouse.x,mouse.y-4);
          ctx.moveTo(mouse.x,mouse.y+4);ctx.lineTo(mouse.x,mouse.y+11);ctx.stroke();
          ctx.restore();
        }
      }
      /* o reflexo */
      if(refx.active>0){
        ctx.save();
        ctx.globalAlpha=refx.active/2.5*.7;
        ctx.fillStyle='#0a0710';
        ctx.beginPath();ctx.arc(refx.x,refx.y,player.r,0,TAU);ctx.fill();
        ctx.strokeStyle='#9d6bb5';ctx.stroke();
        ctx.restore();
      }
      /* testemunha: elites brilham */
      if(game.pacTest){
        for(const e of enemies){
          if(e.dead||!e.elite)continue;
          ctx.save();
          ctx.globalAlpha=.3+.2*Math.sin(game.t*5);
          ctx.strokeStyle='#ffd9a0';ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(e.x,e.y,e.r+8,0,TAU);ctx.stroke();
          ctx.restore();
        }
      }
      /* v1.3.3: fade da ESCADA para o fundo */
      if(game._stairDescend){ctx.fillStyle='rgba(3,2,4,'+clamp(game._stairDescend.t/.5,0,1)+')';ctx.fillRect(0,0,W,H);}
      /* vitória do juiz: escurecer suave */
      if(game._winWait){
        ctx.fillStyle='rgba(3,2,4,'+clamp(1-game._winWait/1.6,0,1)*.8+')';
        ctx.fillRect(0,0,W,H);
      }
    }catch(e){}
  },
  /* escola: cutscenes de transição (porta/escada — thor e cervo) */
  drawSchool:function(){
    try{
      drawTransitionOverlay();
    }catch(e){}
  },
  /* salas comuns: overlay durante a queda de porta */
  drawTransition:drawTransitionOverlay,
  /* início da run */
  onRunStart:function(){
    try{
      juizDone=false;hTrans=null;hTransCd=0;
      cerbHardReset(); /* v1.3.1: reset do remaster do Cérbero */
      game._skipBossCine=false;
      resetWeaponState();
      game.limboPhase=0;game.pendingLimboFloor=null;game.cerbSlain=false;
      game._winWait=0;game.serpCrack=null;
      game.xMods=game.xMods||{};
      /* modificadores escolhidos viram game.mods (imutáveis na run) */
      game.mods={};
      for(const m of MODS)if(game.xMods[m.id])game.mods[m.id]=true;
      /* DIFICULDADES — escalonamento além do hard */
      game.kaizoRun=false; /* v1.5.1: não vaza de uma run kaizo para a próxima */
      if(diffSel==='punicao'){game.threat=(game.threat||0)+2;game.punicao=true;}
      if(diffSel==='kaizo'){game.kaizoRun=true;}
      if(diffSel==='abismo'){game.threat=(game.threat||0)+3;game.abismoRun=true;}
      if(diffSel==='penitencia'){game.threat=(game.threat||0)+4;game.penitRun=true;game.modsIsPen=true;}
      if(diffSel==='hard'||diffSel==='punicao'||diffSel==='kaizo'||diffSel==='abismo'||diffSel==='penitencia')game.hard=true;
      if(diffSel!=='normal'){
        game.diffTitle=DIFFS[diffSel]?DIFFS[diffSel].n:'';
        game.banner={type:'small',txt:'DIFICULDADE — '+game.diffTitle,
          sub:diffSel==='kaizo'?'os chefes mudaram as regras':'o inferno ajustou o preço',t:0,dur:2.6};
      }
      if(game.mods&&game.mods.dividasangue)player.hp=Math.max(1,player.hp-10);
      if(game.mods&&game.mods.silencio)window.__MUSIC_ZONE='silencio';
      /* reset de resets */
      VUL.pools=[];VUL.vents=[];
      CV.active=false;CV.done=false;
      julgZones=[];fogoTrail=[];poças=[];correnteFx=[];
      CV.done=false;
      game._penaUsedFloor=false;
    }catch(e){}
  },
  /* entrada de sala / sala de chefe / intro do juiz */
  onEnterRoom:onEnterRoom,
  beginJuizIntro:function(){
    try{
      game.state='juizintro';
      game.juizIntroT=0;
      enemies=[];bullets=[];ebullets=[];pickups=[];particles=[];texts=[];
      player.x=W/2;player.y=H*.8;player.mvx=0;player.mvy=0;
      game.roomFade=1;
      window.__MUSIC_ZONE='boss:juiz';
      try{sfx.gate();sfx.echo();}catch(e){}
    }catch(e){}
  },
  updateJuizIntro:function(dt){
    try{
      game.juizIntroT+=dt;
      const t=game.juizIntroT;
      if(t>1.2&&!game._jzA){game._jzA=1;try{sfx.growl();}catch(e){}}
      if(t>2.4){
        game.state='play';
        spawnEnemy('juiz',W/2,H*.32);
        game.banner={type:'boss',txt:'O JUIZ SEM ROSTO',sub:'não há advogado. não há apelação.',t:0,dur:3.2};
        try{sfx.roar();game.shake=14;}catch(e){}
      }
    }catch(e){}
  },
  drawJuizIntro:function(){
    try{
      const t=game.juizIntroT||0;
      /* o tribunal se ergue: escala de pedra + portas altas */
      ctx.fillStyle='#08060c';ctx.fillRect(0,0,W,H);
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#0d0a14');g.addColorStop(1,'#050308');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      /* colunas do tribunal */
      for(let i=0;i<5;i++){
        const x=80+i*(W-160)/4;
        ctx.fillStyle='#141020';ctx.fillRect(x-18,60,36,H-120);
      }
      /* a balança de pedra flutuando */
      const bx=W/2,by=H*.34+Math.sin(game.t*1.2)*6;
      ctx.strokeStyle='rgba(157,107,181,.7)';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(bx-70,by);ctx.lineTo(bx+70,by);ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx,by-26);ctx.lineTo(bx,by+40);ctx.stroke();
      for(const s of[-1,1]){
        ctx.beginPath();ctx.moveTo(bx+s*70,by);ctx.lineTo(bx+s*70,by+16);ctx.stroke();
        ctx.beginPath();ctx.arc(bx+s*70,by+24,14,0,TAU);ctx.stroke();
      }
      /* a silhueta sem rosto subindo */
      const k=smooth(x_clamp(t/2.2,0,1));
      ctx.save();
      ctx.globalAlpha=k;
      ctx.fillStyle='#0c0914';
      ctx.beginPath();ctx.moveTo(bx-46,H*.75-60*k);ctx.lineTo(bx+46,H*.75-60*k);ctx.lineTo(bx+56,H*.78);ctx.lineTo(bx-56,H*.78);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(157,107,181,.5)';ctx.lineWidth=2.5;ctx.stroke();
      ctx.restore();
      if(Math.random()<.3)particles.push({x:rnd(W*.2,W*.8),y:H-20,vx:rnd(-6,6),vy:rnd(-40,-14),life:rnd(1,2),t:0,r:rnd(1,2.4),c:'#9d6bb5',drag:1,glow:true});
      drawParticles();
      drawPlayer();
      x_txt(t<1.2?'':t<2.4?'o tribunal se ergue.':'',W/2,H*.9,12,'#9d6bb5');
      if(game.roomFade>0){ctx.fillStyle='rgba(3,2,4,'+clamp(game.roomFade,0,1)+')';ctx.fillRect(0,0,W,H);}
    }catch(e){}
  },
  onKill:onKill,
  afterHurt:afterHurt,
  tryPena:tryPena,
  /* v1.3.1: armas da expansão respondem ao clique/toque (gancho no tryShootAt).
     Devolve true quando o clique É das armas novas (consumido).
     v1.3.4: a COLHER passa a CARREGAR enquanto o botão/dedo segura —
     o clique não dispara mais na hora; ao SOLTAR (lmbUp, gancho no
     releaseBeam) a colherada desce com a carga acumulada. */
  clickShot:function(wx,wy){
    try{
      if(!isXWeapon())return false;
      if(game.paused||optionsOpen())return true;
      if(game.windowScene)return true;
      if(game.state!=='play'&&game.state!=='bossintro'&&game.state!=='carontefight')return false;
      if(player.dead||game.fallK>=0)return true;
      const a=Math.atan2(wy-player.y,wx-player.x);
      player.angle=a;
      if(game.weapon==='colher'){
        /* já carregando: só atualiza a mira do golpe */
        if(wst.chg){wst.chg.a=a;return true;}
        /* na recarga: ignora (o clique não inicia carga no meio do cd) */
        if(wst.t>0)return true;
        wst.chg={t:0,a:a};
        wst.colherCharge=0;wst.chgPing=false;
        wst.cx=wx;wst.cy=wy;wst.cxT=game.t;
        try{blip('sine',180,260,.1,.05);}catch(e){}
        return true;
      }
      wst.forceA=a;wst.cx=wx;wst.cy=wy;wst.cxT=game.t;
      fireWeapon(0);
      return true;
    }catch(e){return false;}
  },
  /* v1.3.4: SOLTAR o botão esquerdo/toque — a colherada carregada desce
     (gancho no releaseBeam, que o mouseup e o toque já chamam). */
  lmbUp:function(){try{colherRelease();}catch(e){}},
  /* v1.3.4: a colher aparece — parada na pata, carregando (anel) e o
     sprite de ataque varrendo o arco (gancho junto do drawPistols). */
  drawColher:drawColher,
  /* v1.3.2: o chicote da dívida — botão direito amarra (mouse); devolve true
     quando consumiu o clique (o jogo não chama a serra). enemyBound congela
     a IA do inimigo amarrado (gancho no updateEnemies). */
  rmbDown:credorRmbDown,
  rmbUp:function(){try{credorRmbUp();}catch(e){}},
  /* v1.5.0: diagnósticos da âncora de parede (testes/depuração — sem efeito no jogo) */
  anchorState:function(){try{return{on:!!wst.anchor,rope:wst.anchor?Math.round(wst.anchor.rope):0};}catch(e){return{on:false};}},
  impulseState:function(){try{return{on:!!player._whpImp,v:player._whpImp?Math.round(Math.hypot(player._whpImp.vx,player._whpImp.vy)):0};}catch(e){return{on:false};}},
  enemyBound:function(e,dt){try{const b=wst.bind;return !!(b&&b.kind==='e'&&b.o===e);}catch(err){return false;}},
  hunterDoorCross:hunterDoorCross,
  /* chefes-x: IA e desenho (ganchos no updateEnemies/drawEnemy) */
  xbossAI:xbossAI,
  drawXBoss:drawXBoss,
  /* diagnóstico dos testes */
  debug:function(){return{pocas:poças.length,zonas:julgZones.length,fogo:fogoTrail.length,
    lava:VUL.pools.length,vents:VUL.vents.length,cerb:cerbPhase,cdash:CDASH.st,gp:GP.phase,seg:GP.seg||0,stair:game.floorStair?1:0,ci:CI.t,xb:enemies.filter(function(e){return e.xboss}).length,
    bd:(wst.bind?wst.bind.kind+(wst.bind.kind==='o'&&wst.bind.heavy?'h':''):null),bt:(wst.bind?Math.round(wst.bind.travel):0),sw:!!wst.sweep,wt:Math.round(wst.t*100)/100,cr:!!wst.credor,w:game.weapon,pa:window.__EXPANSION&&optionsOpen?optionsOpen():-1,
    chg:(wst.chg?Math.round(clamp(wst.chg.t/COLHER_CHARGE_MAX,0,1)*100):0),cc:(wst.colherCharge||0).toFixed(2)};},
  /* estados novos da progressão */
  startGatePath:startGatePath,
  ensureFloorStair:ensureFloorStair, /* v1.3.3 */
  updateGatePath:updateGatePath,
  drawGatePath:drawGatePath,
  gateInteract:gateInteract, /* v1.5.2: [Z] abre o PORTÃO ENORME */
  gateNear:function(){return !!GP.near;}, /* v1.5.2: diagnóstico/testes */
  startCerbIntro:startCerbIntro,
  updateCerbIntro:updateCerbIntro,
  drawCerbIntro:drawCerbIntro,
  drawCerbCard:drawCerbCard, /* v1.5.7: a apresentação do boss (cartão) desenhada por cima de qualquer cena */
  startBlueCorr:startBlueCorr,
  updateBlueCorr:updateBlueCorr,
  drawBlueCorr:drawBlueCorr,
  startGarganta:startGarganta,
  serpInteract:serpInteract,
  renderSyn:renderSynTab,
  fromBlueCorr:function(){return BC.phase==='boat'||game._bcActive===true;},
  /* v1.4.5: getter de diagnóstico/testes — a névoa (calor→frio) do corredor */
  bcFog:function(){return BC.fog;},
  backToBlueCorr:function(){
    try{
      game._bcActive=true;
      game.state='bluecorr';BC.phase='walk';
      player.x=W*.7;player.y=H*.6;
      game.banner={type:'small',txt:'O BARQUEIRO ESPERA',sub:'o remo continua batendo na água',t:0,dur:2.4};
    }catch(e){}
  },
  /* integração com o retry (correção: morreu na escola → recomeça na escola) */
  retry:function(){
    try{
      if(window.__DIED_IN_SCHOOL){
        window.__DIED_IN_SCHOOL=false;
        ['dead'].forEach(hideOv);
        game.paused=false;
        try{window.SCHOOL.startFromMenu();}catch(e){openWeaponSelect();}
        return;
      }
    }catch(e){}
    openWeaponSelect();
  }
};
/* retry: o bind do game.js aponta para __EXPANSION_RETRY (ver patch do game.js).
   RECOMEÇAR (pausa) nunca revive na escola — só TENTAR NOVAMENTE após morrer. */
window.__EXPANSION_RETRY=window.__EXPANSION.retry;
try{
  const rs=document.getElementById('restartBtn');
  if(rs)rs.addEventListener('click',function(){audio();window.__DIED_IN_SCHOOL=false;},true);
}catch(e){}
/* interação com a rachadura da serpente (tecla Z) */
try{
  window.addEventListener('keydown',function(e){
    if(e.code==='KeyZ'&&game.state==='play'&&game.serpCrack)serpInteract();
  });
  const mi=document.getElementById('mobileInteract');
  if(mi)mi.addEventListener('click',function(){if(game.state==='play'&&game.serpCrack)serpInteract();});
}catch(e){}
/* xboss no bestiário (nomes) */
try{
  MINI_NAMES.juiz='O JUIZ SEM ROSTO';MINI_NAMES.ferreiro='O FERREIRO DAS ALMAS';
  MINI_NAMES.anjo='O ANJO ACORRENTO';MINI_NAMES.serp='A SERPENTE QUE ENGOLE ESTRELAS';MINI_NAMES.sthor='O THOR QUE NÃO DESCEU';
}catch(e){}
/* boot: cartas + dificuldades + aba SINERGIAS do grimório */
try{
  buildDiffUI();bindWeaponCards();
  bind('bookTabSyn','click',function(){audio();game._bookTab='syn';renderSynTab();blip('sine',500,650,.05,.03);});
}catch(e){console.warn('[exp] boot',e);}
/* marca para diagnóstico */
window.__EXP_VERSION='1.9.2'; /* v1.4.0: remaster.js entra ao lado · v1.6.0 o conserto das salas (bênção mínima na secreta, rei fecha a sala, explosivo quebra porta de inimigo/puzzle, itens sem despawn, hitbox 4px, botão do limbo final) · v1.6.1 a besta tem rosto (besta.png na tela de morte) + encaixe total na resolução (sem barras de rolagem) · v1.6.2 o carrossel das armas + limbo sem travadas + fase cinza LISA · v1.6.3 os quatro feitiços (Grimório Rasgado, Investida Ricochete, Fios da Morte, Maré de Magma) + loja em destaque + drops fora das paredes + portal espera a bênção */
})(); /* fim da IIFE da expansão */
/*__CHUNK4B_END__*/
