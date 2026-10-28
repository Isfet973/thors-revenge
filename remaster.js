/* ================================================================
   THOR REVENGE — REMASTER v1.4.0 "A SENTENÇA FINAL" · correção v1.4.2
   60 novos itens (24 bênçãos + 20 pactos + 16 armas) · sinergias ·
   CÉRBERO REMASTER — terceira fase de bullet hell.
   Arquivo 100% ADITIVO: nada do jogo antigo é reescrito.
   ================================================================ */
(function(){
'use strict';
if(window.__RM)return; /* idempotência */
const RM={v:'1.9.2'}; /* v1.6.3: os quatro feitiços — sem mudança no remake (véu sutil, luz branca, 2ª apresentação seguem) */ /* v1.6.2: o carrossel das armas — sem mudança no remake (véu sutil, luz branca, 2ª apresentação seguem) */
window.__RM=RM;
/* v1.4.2 CORREÇÃO CRÍTICA: x_up vivia DENTRO da IIFE da expansão (expansion.js) —
   nunca foi global. Toda can() dos itens rm lançava "x_up is not defined",
   o que quebrava em cadeia: a ARCA [3], as cartas de bênção (rollUpgrades),
   os baús, a loja e o altar — qualquer tela que perguntasse "posso cair?".
   Cópia local com a MESMA semântica da original (lê game.up). */
function x_up(id){return !!(game&&game.up&&game.up[id]);}

/* ---------------- helpers locais ---------------- */
const TAUx=Math.PI*2;
function D(a,b,c,d){return Math.hypot(c-a,d-b);}
function angN(a){while(a>Math.PI)a-=TAUx;while(a<-Math.PI)a+=TAUx;return a;}
function rmTxt(t,x,y,size,c){try{txt(t,x,y,MONO,size,c,'center',4);}catch(e){}
  try{texts.push({x:x,y:y-16,txt:t,t:0,life:1.5,c:c,size:size,disp:true});}catch(e){}}
function rmSparks(x,y,c,n,spd,life,size){try{sparks(x,y,c,n,spd,life,size,true);}catch(e){}}

/* ================================================================
   PARTE 6 — DIFICULDADE (usa as categorias JÁ EXISTENTES):
   normal→NORMAL · hard→DIFÍCIL · punicao/abismo→INFERNAL ·
   kaizo/penitencia→KAIZO. spd=intervalo entre salvas (maior=rápido).
   ================================================================ */
function rmTier(){
  const d=typeof diffSel!=='undefined'?diffSel:'normal';
  /* v1.4.3: a SENTENÇA apertou — salvas mais rápidas (spd), intervalos menores
     (int), mais densidade (cx alimenta anéis/colunas/leques) e o modo mais
     difícil finalmente assusta: KAIZO com cx 4 é um bullet hell de verdade.
     v1.4.5 ESPEC §16: coluna de DENSIDADE (den 1.00/1.05/1.10/1.12) e a
     DURAÇÃO MÁXIMA das spell cards caindo com a dificuldade (durM).
     SEM PIEDADE: velocidade e intervalo ficam AINDA mais apertados que a
     tabela do spec — os eventos completos entram por cima disso. */
  if(d==='kaizo'||d==='penitencia')return{name:'KAIZO',spd:1.42,int:.6,cx:4,vuln:.7,stage:3,den:1.12,durM:.84};
  if(d==='punicao'||d==='abismo')return{name:'INFERNAL',spd:1.3,int:.7,cx:3,vuln:.8,stage:2,den:1.1,durM:.9};
  if(d==='hard')return{name:'DIFÍCIL',spd:1.2,int:.8,cx:2,vuln:1,stage:1,den:1.05,durM:.95};
  return{name:'NORMAL',spd:1.08,int:.9,cx:0,vuln:1.3,stage:0,den:1,durM:1};
}
/* v1.4.3: vida da SENTENÇA escala com a dificuldade escolhida */
function c3hpTier(){
  const n=rmTier().name;
  return n==='KAIZO'?1.3:n==='INFERNAL'?1.18:n==='DIFÍCIL'?1.08:1;
}
RM.tier=rmTier;
/* lentidão global de projéteis (AMPULHETA DO ÚLTIMO SEGUNDO) */
RM._ebSlow=1;
window.__RM_ebslow=function(){return RM._ebSlow;};

/* ================================================================
   PARTE 1 — 60 NOVOS ITENS
   Bênçãos: utilidades próprias. Pactos: poder por um preço real.
   Armas: modificam o FORMATO dos ataques (estilo Isaac — entram no
   mesmo UPGRADES, caem como drops, entram na loja/altar).
   ================================================================ */
const I={}; /* registro id→def pós-push */
function defs(list){for(const u of list)I[u.id]=u;}
const BLESS=[
/* ---- A. BÊNÇÃOS (24) ---- */
{id:'rm_olho_sacrista',q:2,glyph:'eye',name:'OLHO DO SACRISTÃO',max:1,
 desc:'revela o que o inferno esconde: rachaduras de salas secretas brilham em dourado e salas especiais pulsam no mapa.',
 can:function(){return!x_up('rm_olho_sacrista');},
 apply:function(){game.rm_olho=1;}},
{id:'rm_halo_quebrado',q:3,glyph:'light',name:'HALO QUEBRADO',max:1,
 desc:'projéteis inimigos que passam perto de você perdem força — a esquiva fica justa, não impossível.',
 can:function(){return!x_up('rm_halo_quebrado');},
 apply:function(){game.rm_halo=1;}},
{id:'rm_ultima_vela',q:3,glyph:'flame',name:'ÚLTIMA VELA',max:1,
 desc:'uma vez por sala, com pouca vida, a chama sopra: uma onda varre os projéteis próximos. não devolve vida — devolve espaço.',
 can:function(){return!x_up('rm_ultima_vela');},
 apply:function(){game.rm_vela=1;game.rm_velaRoom='';}},
{id:'rm_dente_veredito',q:3,glyph:'fangs',name:'DENTE DO VEREDITO',max:1,
 desc:'cada acerto no MESMO demônio deixa uma marca. na 6ª, o veredito cai: dano dobrado e as marcas se apagam.',
 can:function(){return!x_up('rm_dente_veredito');},
 apply:function(){game.rm_veredito=1;}},
{id:'rm_chave_purgatorio',q:4,glyph:'soulg',name:'CHAVE DO PURGATÓRIO',max:1,
 desc:'pressione [R] perto de uma oferta de bênção para TROCÁ-LA — uma vez por descida, por 40 almas.',
 can:function(){return!x_up('rm_chave_purgatorio');},
 apply:function(){game.rm_chave=1;game.rm_chaveFloor=-1;}},
{id:'rm_cinza_inc',q:3,glyph:'flame',el:['fogo'],name:'CINZA INCANDESCENTE',max:1,
 desc:'a cada 3 projéteis, um deixa brasas no chão que queimam quem parar em cima (dano contínuo).',
 can:function(){return!x_up('rm_cinza_inc');},
 apply:function(){game.rm_cinza=1;RM.zEmber=RM.zEmber||[];}},
{id:'rm_ossos_orbita',q:4,glyph:'shard',name:'OSSOS EM ÓRBITA',max:1,
 desc:'três fragmentos giram ao seu redor: ferem por contato e quebram projéteis pequenos no caminho.',
 can:function(){return!x_up('rm_ossos_orbita');},
 apply:function(){game.rm_ossos=1;RM.orb=[{a:0},{a:TAUx/3},{a:TAUx*2/3}];}},
{id:'rm_coracao_emp',q:4,glyph:'blood',name:'CORAÇÃO EMPRESTADO',max:1,
 desc:'+30 de vida máxima por 60s. o coração não é seu — e o dono cobra de volta.',
 can:function(){return!x_up('rm_coracao_emp');},
 apply:function(){game.rm_coracaoT=60;player.maxHp+=30;player.hp=Math.min(player.maxHp,player.hp+10);}},
{id:'rm_estilhaco_refl',q:4,glyph:'light',name:'ESTILHAÇO DE REFLEXO',max:1,
 desc:'projéteis inimigos pequenos que chegam perto têm 12% de chance de virar espectro e voltar contra eles (máx. 3/s).',
 can:function(){return!x_up('rm_estilhaco_refl');},
 apply:function(){game.rm_reflexo=1;}},
{id:'rm_sino_ausentes',q:3,glyph:'light',name:'SINO DOS AUSENTES',max:1,
 desc:'18% de chance de um presente extra ao limpar uma sala. os que partiram ainda dão esmola. (nunca em chefes)',
 can:function(){return!x_up('rm_sino_ausentes');},
 apply:function(){game.rm_sino=1;}},
{id:'rm_pena_carbonizada',q:2,glyph:'wind',el:['vento','fogo'],name:'PENA CARBONIZADA',max:1,
 desc:'+8% velocidade. escapar por pouco de um projétil acende a pena: recarga do desvio e um impulso breve.',
 can:function(){return!x_up('rm_pena_carbonizada');},
 apply:function(){P.speedMult*=1.08;game.rm_penaC=1;}},
{id:'rm_turibulo_vazio',q:3,glyph:'shard',el:['sombra'],name:'TURÍBULO VAZIO',max:1,
 desc:'demônios derrotados deixam uma fumaça sagrada: projéteis que a atravessam ficam lentos por um instante.',
 can:function(){return!x_up('rm_turibulo_vazio');},
 apply:function(){game.rm_turibulo=1;RM.zSmoke=RM.zSmoke||[];}},
{id:'rm_pupila_ruina',q:4,glyph:'eye',name:'PUPILA DA RUÍNA',max:1,
 desc:'+35% de dano contra quem JÁ ESTÁ ferido. contra vida cheia, a pupila não vê nada.',
 can:function(){return!x_up('rm_pupila_ruina');},
 apply:function(){game.rm_pupila=1;}},
{id:'rm_ampulheta',q:4,glyph:'shard',name:'AMPULHETA DO ÚLTIMO SEGUNDO',max:1,
 desc:'ao sofrer dano, a areia vira: os projéteis da sala ficam lentos por 2,2s. recarga interna de 12s.',
 can:function(){return!x_up('rm_ampulheta');},
 apply:function(){game.rm_ampulheta=1;game.rm_ampCd=0;}},
{id:'rm_coroa_espinhos',q:4,glyph:'crown',el:['terra'],name:'COROA DE ESPINHOS',max:1,
 desc:'sofrer dano libera uma coroa de espinhos: empurra e fere quem estiver colado em você.',
 can:function(){return!x_up('rm_coroa_espinhos');},
 apply:function(){game.rm_espinhos=1;}},
{id:'rm_rosario_contas',q:4,glyph:'light',name:'ROSÁRIO SEM CONTAS',max:1,
 desc:'cada chefe derrotado fortalece você para sempre nesta descida: +4% de dano. contas repetidas não contam duas vezes.',
 can:function(){return!x_up('rm_rosario_contas');},
 apply:function(){game.rm_rosario=1;game.rm_rosBoss={};}},
{id:'rm_mascara_test',q:3,glyph:'eye',name:'MÁSCARA DA TESTEMUNHA',max:1,
 desc:'ficar 1,6s sem atacar prepara a testemunha: seu próximo disparo causa +80% de dano.',
 can:function(){return!x_up('rm_mascara_test');},
 apply:function(){game.rm_mascara=1;game.rm_mascT=0;game.rm_mascArmed=0;}},
{id:'rm_evangelho',q:4,glyph:'light',name:'EVANGELHO RASURADO',max:1,
 desc:'a cada 8 demônios, o próximo disparo ganha um dom rasurado: perfuração, ricochete ou caça ao alvo.',
 can:function(){return!x_up('rm_evangelho');},
 apply:function(){game.rm_evangelho=1;game.rm_evK=0;game.rm_evArmed=0;}},
{id:'rm_ima_almas',q:2,glyph:'soulg',name:'ÍMÃ DE ALMAS',max:1,
 desc:'almas e recursos voam até você de muito mais longe. nenhum demônio sente o puxão — só os mortos respondem.',
 can:function(){return!x_up('rm_ima_almas');},
 apply:function(){P.magnetMult*=1.8;}},
{id:'rm_frio_abismo',q:4,glyph:'shard',el:['gelo'],name:'FRIO DE ABISMO',max:1,
 desc:'golpes gelados acumulam geada: 5 marcas congelam um demônio comum por 1,1s. chefes só sentem o peso do frio.',
 can:function(){return!x_up('rm_frio_abismo');},
 apply:function(){game.rm_frio=1;}},
{id:'rm_pena_condenados',q:3,glyph:'wind',name:'PENA DOS CONDENADOS',max:1,
 desc:'limpar uma sala SEM sofrer dano deixa uma pena: um escudo te protege do primeiro golpe da sala seguinte.',
 can:function(){return!x_up('rm_pena_condenados');},
 apply:function(){game.rm_penaCond=1;}},
{id:'rm_relogio_pecado',q:3,glyph:'bolt',name:'RELÓGIO DO PECADO',max:1,
 desc:'derrotar demônios em sequência acelera seu ataque (até +30%) até o fim da sala. levar dano zera o relógio.',
 can:function(){return!x_up('rm_relogio_pecado');},
 apply:function(){game.rm_relogio=1;game.rm_relK=0;game.rm_relT=0;}},
{id:'rm_coroa_ultimo',q:3,glyph:'crown',name:'COROA DO ÚLTIMO',max:1,
 desc:'quando sobra UM demônio comum na sala, ele sente: +40% de dano contra o último da fila. chefes não entram nessa.',
 can:function(){return!x_up('rm_coroa_ultimo');},
 apply:function(){game.rm_ultimo=1;}},
{id:'rm_pato_herege',q:7,glyph:'sky',el:['agua'],name:'PATO HEREGE',max:1,
 desc:'ITEM DE MEME — de vez em quando um patinho atravessa a sala e da uma bicada fraca em alguém. o som dele é alegre DEMAIS para este lugar.',
 can:function(){return!x_up('rm_pato_herege');},
 apply:function(){game.rm_pato=1;game.rm_patoT=9;RM.duck=null;}}
];
const PACT=[
/* ---- B. PACTOS (20) — poder por um preço real ---- */
{id:'rm_credor_almas',q:4,glyph:'soulg',name:'PACTO: CREDOR DAS ALMAS',max:1,
 desc:'PACTO — almas valem +60%. mas cada golpe recebido derrama 25% das almas carregadas. o credor cobra na dor.',
 can:function(){return!x_up('rm_credor_almas');},
 apply:function(){P.soulMult*=1.6;game.rm_credorA=1;}},
{id:'rm_porta_fechada',q:4,glyph:'dark',name:'PACTO: PORTA FECHADA',max:1,
 desc:'PACTO — baús entregam o dobro. mas abrir um convoca uma onda extra de demônios. nada é de graça no inferno.',
 can:function(){return!x_up('rm_porta_fechada');},
 apply:function(){game.rm_portaF=1;}},
{id:'rm_segunda_voz',q:4,glyph:'dark',name:'PACTO: SEGUNDA VOZ',max:1,
 desc:'PACTO — seu item ativo repete o efeito 0,8s depois com 55% da força. em troca a recarga fica 35% mais longa. algo responde por você.',
 can:function(){return!x_up('rm_segunda_voz');},
 apply:function(){game.rm_segVoz=1;}},
{id:'rm_ultima_cinza',q:4,glyph:'flame',el:['fogo'],name:'PACTO: ÚLTIMA CINZA',max:1,
 desc:'PACTO — com pouca vida você queima +45% de dano. mas a cinza pesa: -10% de velocidade. o fim te deixa forte e lento.',
 can:function(){return!x_up('rm_ultima_cinza');},
 apply:function(){P.speedMult*=.9;game.rm_ultimaCinza=1;}},
{id:'rm_contrato_sangue',q:4,glyph:'blood',name:'PACTO: CONTRATO DE SANGUE',max:1,
 desc:'PACTO — +65% de dano. a tinta é sua: -25% de vida máxima (nunca abaixo do mínimo para continuar de pé).',
 can:function(){return!x_up('rm_contrato_sangue');},
 apply:function(){const cut=Math.min(Math.max(player.maxHp-50,0),Math.round(player.maxHp*.25));player.maxHp-=Math.max(cut,1);player.maxHp=Math.max(player.maxHp,50);player.hp=Math.min(player.hp,player.maxHp);P.dmgMult*=1.65;game.rm_sangue=1;}},
{id:'rm_dizimo_inferno',q:4,glyph:'soulg',name:'PACTO: DÍZIMO DO INFERNO',max:1,
 desc:'PACTO — chefes entregam bênção extra. a cada descida, o dízimo cobra 30 almas: sem pagamento, você desce fraco (6s penalizado).',
 can:function(){return!x_up('rm_dizimo_inferno');},
 apply:function(){game.rm_dizimo=1;}},
{id:'rm_divida_crescente',q:4,glyph:'soulg',name:'PACTO: DÍVIDA CRESCENTE',max:1,
 desc:'PACTO — cada sala limpa sem tomar dano soma +6% de dano (até +48%). ser tocado apaga a dívida inteira.',
 can:function(){return!x_up('rm_divida_crescente');},
 apply:function(){game.rm_divida=1;game.rm_divSt=0;}},
{id:'rm_pacto_silencio',q:4,glyph:'dark',name:'PACTO: DO SILÊNCIO',max:1,
 desc:'PACTO — ficar IMÓVEL 1,1s faz seus disparos doerem +50% enquanto você não se mexer. parado no meio do inferno. boa sorte.',
 can:function(){return!x_up('rm_pacto_silencio');},
 apply:function(){game.rm_silencio=1;game.rm_silT=0;}},
{id:'rm_maos_famintas',q:4,glyph:'fangs',name:'PACTO: MÃOS FAMINTAS',max:1,
 desc:'PACTO — coleta e mordida alcançam muito mais longe. em troca seu desvio encurta: as mãos chegam antes dos pés.',
 can:function(){return!x_up('rm_maos_famintas');},
 apply:function(){P.magnetMult*=1.6;P.biteRange*=1.35;game.rm_maos=1;}},
{id:'rm_juros_compostos',q:4,glyph:'soulg',name:'PACTO: JUROS COMPOSTOS',max:1,
 desc:'PACTO — cada bênção adquirida acelera seu ataque +4%. a cada 3 bênçãos, o inferno desconta 6 de vida máxima. matemática cruel.',
 can:function(){return!x_up('rm_juros_compostos');},
 apply:function(){game.rm_juros=1;game.rm_jurosN=contagens();}},
{id:'rm_favor_mentira',q:4,glyph:'dark',name:'PACTO: FAVOR DA MENTIRA',max:1,
 desc:'PACTO — recompensas raras aparecem 15% mais. mas 30% das ofertas se revelam migalhas (só almas). a mentira tem bom gosto.',
 can:function(){return!x_up('rm_favor_mentira');},
 apply:function(){game.rm_mentira=1;}},
{id:'rm_aposta_carrasco',q:4,glyph:'fangs',name:'PACTO: APOSTA DO CARRASCO',max:1,
 desc:'PACTO — +55% de dano contra CHEFES. os comuns ficam 18% mais rápidos. o carrasco adora uma plateia correndo.',
 can:function(){return!x_up('rm_aposta_carrasco');},
 apply:function(){game.rm_carrasco=1;}},
{id:'rm_contrato_espelhos',q:5,glyph:'dark',name:'PACTO: CONTRATO DE ESPELHOS',max:1,
 desc:'PACTO — uma cópia espectral repete seus disparos 0,55s depois com 55% da força. ela não erra onde você errou.',
 can:function(){return!x_up('rm_contrato_espelhos');},
 apply:function(){game.rm_espelhos=1;RM.mirror={q:[],x:0,y:0};}},
{id:'rm_altar_invertido',q:5,glyph:'crown',name:'PACTO: ALTAR INVERTIDO',max:1,
 desc:'PACTO — o altar aceita carne: -20% de vida máxima (mínimo garantido) e uma BÊNÇÃO aleatória na hora.',
 can:function(){return!x_up('rm_altar_invertido');},
 apply:function(){player.maxHp=Math.max(50,Math.round(player.maxHp*.8));player.hp=Math.min(player.hp,player.maxHp);rmSorteioBlessing();}},
{id:'rm_nome_apagado',q:4,glyph:'dark',name:'PACTO: NOME APAGADO',max:1,
 desc:'PACTO — seu nome foi riscado: demônios demoram a notar você (1,2s hesitam ao nascer). mas as salas especiais ficam menos confiáveis.',
 can:function(){return!x_up('rm_nome_apagado');},
 apply:function(){game.rm_nome=1;}},
{id:'rm_promessa_quebrada',q:4,glyph:'dark',name:'PACTO: PROMESSA QUEBRADA',max:1,
 desc:'PACTO — o primeiro golpe de cada sala fere 55% menos. em troca, corações curam 40% menos. promessa antiga, juros eternos.',
 can:function(){return!x_up('rm_promessa_quebrada');},
 apply:function(){game.rm_promessa=1;game.rm_promOk=1;}},
{id:'rm_coroa_ganancia',q:5,glyph:'crown',name:'PACTO: COROA DE GANÂNCIA',max:1,
 desc:'PACTO — cada chefe morto abre direito a uma bênção extra na sala seguinte. até lá, os comuns pagam menos almas (-30%).',
 can:function(){return!x_up('rm_coroa_ganancia');},
 apply:function(){game.rm_ganancia=1;game.rm_greedDrop=0;}},
{id:'rm_pacto_enxame',q:5,glyph:'burst',name:'PACTO: DO ENXAME',max:1,
 desc:'PACTO — cada disparo vira três, cada um com 35% menos força. o céu fica cheio. o dano, magro. enxames não precisam de mira.',
 can:function(){return!x_up('rm_pacto_enxame');},
 apply:function(){game.rm_enxame=1;}},
{id:'rm_preco_pressa',q:4,glyph:'wind',name:'PACTO: PREÇO DA PRESSA',max:1,
 desc:'PACTO — atacando em movimento: +22% de cadência. atacando parado: -20% de dano. o inferno pune a preguiça.',
 can:function(){return!x_up('rm_preco_pressa');},
 apply:function(){game.rm_pressa=1;}},
{id:'rm_ultima_testemunha',q:5,glyph:'eye',name:'PACTO: A ÚLTIMA TESTEMUNHA',max:1,
 desc:'PACTO — a primeira morte desta descida é recusada: você fica de pé com quase nada de vida. e o pacto se desfaz para sempre.',
 can:function(){return!game._rmTestUsed&&!x_up('rm_ultima_testemunha');},
 apply:function(){game.rm_testemunha=1;}}
];
/* contagem de bênçãos (JUROS COMPOSTOS) */
function contagens(){let n=0;for(const id in game.up)if(game.up[id]>0){const u=UPGRADES.find(function(x){return x.id===id;});if(u&&(u.desc||'').indexOf('PACTO')!==0)n++;}return n;}
function rmSorteioBlessing(){
  try{
    const pool=UPGRADES.filter(function(u){return u.can()&&u.q<=4&&u.id!=='rm_altar_invertido'&&(u.desc||'').indexOf('PACTO')!==0;});
    if(!pool.length)return;
    const u=pick(pool);
    game.up[u.id]=(game.up[u.id]||0)+1;u.apply();
    rmTxt('O ALTAR ENTREGOU: '+u.name,W/2,H*.24,13,'#ffd9a0');
    try{blip('sine',392,659,.5,.1);}catch(e){}
    RM.onPickup(u);
  }catch(e){}
}
RM.sorteio=rmSorteioBlessing;
defs(BLESS);defs(PACT);
try{for(const it of BLESS)UPGRADES.push(it);for(const it of PACT){UPGRADES.push(it);PACT_IDS.push(it.id);}}catch(e){console.warn('[rm] upgrades',e);}

/* ---- C. ARMAS (16) — itens que mudam o FORMATO do ataque ---- */
const WEAP=[
{id:'rm_lamento',q:4,glyph:'shard',el:['agua'],name:'LAMENTO',max:1,
 desc:'seus disparos viram lágrimas espectrais que ATRAVESSAM demônios (2 perfurações), perdendo força a cada atravessada.',
 can:function(){return!x_up('rm_lamento');},
 apply:function(){game.rm_lamento=1;}},
{id:'rm_rosario_balas',q:4,glyph:'burst',name:'ROSÁRIO DE BALAS',max:1,
 desc:'a cada 6 disparos, um rosário explode: 10 balas giram em círculo. de perto, o rosário inteiro morde junto.',
 can:function(){return!x_up('rm_rosario_balas');},
 apply:function(){game.rm_rosB=1;}},
{id:'rm_espingarda',q:4,glyph:'burst',name:'ESPINGARDA DO SACRILÉGIO',max:1,
 desc:'a cada 5 disparos, um estouro: 5 fragmentos em leque. perto ela despedaça — longe é só pó.',
 can:function(){return!x_up('rm_espingarda');},
 apply:function(){game.rm_espingarda=1;}},
{id:'rm_agulha',q:4,glyph:'shard',name:'AGULHA DA PENITÊNCIA',max:1,
 desc:'a cada 7 disparos, a agulha: um projétil fino e rápido que atravessa fileiras inteiras. a penitência é lenta e certa.',
 can:function(){return!x_up('rm_agulha');},
 apply:function(){game.rm_agulha=1;}},
{id:'rm_incensario',q:4,glyph:'flame',el:['fogo'],name:'INCENSÁRIO',max:1,
 desc:'a cada 8 disparos, uma esfera de brasa balança para a frente deixando fumaça que fere quem atravessar.',
 can:function(){return!x_up('rm_incensario');},
 apply:function(){game.rm_incensario=1;RM.zSmoke2=RM.zSmoke2||[];}},
{id:'rm_dente_cerb',q:4,glyph:'fangs',name:'DENTE DE CÉRBERO',max:1,
 desc:'a cada 5 disparos, três dentes saem em sequência — o terceiro CAÇA quem foi mordido pelos dois primeiros.',
 can:function(){return!x_up('rm_dente_cerb');},
 apply:function(){game.rm_denteC=1;}},
{id:'rm_vela_funeral',q:4,glyph:'flame',el:['fogo'],name:'VELA DE FUNERAL',max:1,
 desc:'a cada 6 disparos, uma chama curta que EXPLODE ao tocar um demônio — ou no fim da pavio, em silêncio.',
 can:function(){return!x_up('rm_vela_funeral');},
 apply:function(){game.rm_velaF=1;}},
{id:'rm_sermao',q:4,glyph:'light',name:'SERMÃO QUEBRADO',max:1,
 desc:'a cada 7 disparos, o sermão: uma onda em linha — horizontal e vertical alternadas. a palavra corta nos dois eixos.',
 can:function(){return!x_up('rm_sermao');},
 apply:function(){game.rm_sermao=1;game.rm_sermaoV=0;}},
{id:'rm_espelho_faminto',q:4,glyph:'dark',name:'ESPELHO FAMINTO',max:1,
 desc:'seus projéteis ricocheteiam 2 vezes nas paredes. o espelho devolve tudo que você atira — faminto por mais.',
 can:function(){return!x_up('rm_espelho_faminto');},
 apply:function(){game.rm_espF=1;}},
{id:'rm_coroa_balistica',q:5,glyph:'crown',name:'COROA BALÍSTICA',max:1,
 desc:'a cada 5s, 3 cargas orbitam você por um instante e saem voando contra os demônios mais próximos.',
 can:function(){return!x_up('rm_coroa_balistica');},
 apply:function(){game.rm_bOrb=1;RM.bOrb={t:3,orbs:[]};}},
{id:'rm_cravo_abismo',q:4,glyph:'shard',name:'CRAVO DO ABISMO',max:1,
 desc:'a cada 9 disparos, um cravo pesado que perfura e fica PREGADO no demônio, sangrando dano por um tempo.',
 can:function(){return!x_up('rm_cravo_abismo');},
 apply:function(){game.rm_cravo=1;}},
{id:'rm_liturgia',q:4,glyph:'light',name:'LITURGIA DE ESTILHAÇOS',max:1,
 desc:'a cada 4 disparos, o tiro se parte em 3 estilhaços no meio do caminho. a liturgia se espalha.',
 can:function(){return!x_up('rm_liturgia');},
 apply:function(){game.rm_liturgia=1;}},
{id:'rm_mordida_dupla',q:4,glyph:'fangs',name:'MORDIDA DUPLA',max:1,
 desc:'a cada 5 disparos, duas presas que se afastam e VOLTAM — o que ficar entre elas apanha das duas pontas.',
 can:function(){return!x_up('rm_mordida_dupla');},
 apply:function(){game.rm_mordidaD=1;}},
{id:'rm_arco_herege',q:4,glyph:'wind',name:'ARCO DO HEREGE',max:1,
 desc:'seus projéteis curvam suavemente na direção do demônio mais próximo. a heresia não mira — ela desliza.',
 can:function(){return!x_up('rm_arco_herege');},
 apply:function(){game.rm_arcoH=1;}},
{id:'rm_calice_vazio',q:5,glyph:'soulg',name:'CÁLICE VAZIO',max:1,
 desc:'a cada 10s, um cálice se abre por 1,2s e BEBE projéteis inimigos pequenos — e cospe uma rajada do tamanho da gula. ataques de chefe são grandes demais para o cálice.',
 can:function(){return!x_up('rm_calice_vazio');},
 apply:function(){game.rm_calice=1;RM.calice={t:10,win:0,n:0};}},
{id:'rm_canhao_excom',q:5,glyph:'burst',name:'CANHÃO DE EXCOMUNHÃO',max:1,
 desc:'a cada 9s, o canhão carrega (você fica pesado) e cospe um projétil ENORME que atravessa tudo. a excomunhão não discute.',
 can:function(){return!x_up('rm_canhao_excom');},
 apply:function(){game.rm_canhao=1;RM.canhao={t:9,chg:0};}}
];
defs(WEAP);
try{for(const it of WEAP)UPGRADES.push(it);}catch(e){console.warn('[rm] armas',e);}
RM.items=I;

/* ================================================================
   PARTE 2A — PIPELINE DE DANO (hitDmg)
   Ganchos de 1 linha no game.js canalizam TODO dano do jogador
   por aqui: bala, mordida e x_dmgEnemy (wrapper abaixo).
   Modificadores de % acumulam com multiplicação — sem recursão.
   ================================================================ */
RM.hitDmg=function(e,base,src){
  let m=1;
  const isBoss=e&&(e.xboss||(e.type==='mb')||(e.type==='ex')||(e.type==='vi')||e.maxHp>=600);
  /* PUPILA DA RUÍNA — feridos recebem mais */
  if(game.rm_pupila&&e.maxHp&&e.hp<e.maxHp*.4)m*=1.35;
  /* COROA DO ÚLTIMO — sobra um comum */
  if(game.rm_ultimo&&!isBoss){
    let alive=0;for(const o of enemies)if(!o.dead&&!o.xboss&&o.spawnT>.5)alive++;
    if(alive===1)m*=1.4;
  }
  /* ÚLTIMA CINZA — pouca vida queima */
  if(game.rm_ultimaCinza&&player.hp<=player.maxHp*.35)m*=1.45;
  /* DÍVIDA CRESCENTE */
  if(game.rm_divida&&game.rm_divSt)m*=1+game.rm_divSt;
  /* APOSTA DO CARRASCO — chefes pagam mais */
  if(game.rm_carrasco&&isBoss)m*=1.55;
  /* DENTE DO VEREDITO — marcas no mesmo alvo */
  if(game.rm_veredito&&e&&!e.dead){
    e._vd=(e._vd||0)+1+((src&&src._vdBonus)||0);
    if(e._vd>=6){e._vd=0;m*=2;rmSparks(e.x,e.y,'#ffd9a0',10,220,.5,3);try{blip('square',740,180,.22,.1);}catch(err){}}
  }
  /* FRIO DE ABISMO — geada acumula (só em golpes de gelo) */
  if(game.rm_frio&&src&&(src._ice||src.elem==='gelo')&&e&&!e.dead){
    e._frost=(e._frost||0)+1;
    if(!isBoss){
      if(e._frost>=5){e._frost=0;e.slowT=Math.max(e.slowT||0,1.1);e._frozenFx=.4;rmSparks(e.x,e.y,'#9fd8ff',8,140,.5,2.5);try{blip('triangle',900,220,.3,.07);}catch(err){}}
      else e.slowT=Math.max(e.slowT||0,.6);
    }else e.slowT=Math.max(e.slowT||0,.45);
  }
  /* PREÇO DA PRESSA — atacar parado dói menos (aplicado na bala, não aqui) */
  return base*m;
};
/* janela de performance: marca de congelamento some */
/* ================================================================
   PARTE 2B — CONTADOR DE DISPAROS + MODIFICADORES DE PROJÉTEIS
   Novas balas do jogador são detectadas por flag _rmSeen e recebem
   as propriedades das 16 ARMAS + pactos de disparo (uma vez só).
   ================================================================ */
RM.shots=0;RM._meleeCounted=0;RM._lastHitEnemy=null;
function newShotPass(){
  let fresh=0,dmgMul=1,props={};
  /* MÁSCARA DA TESTEMUNHA — preparada */
  if(game.rm_mascara&&game.rm_mascArmed){props.masc=1;game.rm_mascArmed=0;}
  /* PACTO DO SILÊNCIO — parado carrega */
  if(game.rm_silencio&&game.rm_silT>=1.1)props.sil=1;
  /* PREÇO DA PRESSA */
  if(game.rm_pressa)props.pressa=(player.mvx||player.mvy)?1:-1;
  /* EVANGELHO RASURADO — dom preparado */
  if(game.rm_evangelho&&game.rm_evArmed){props.ev=game.rm_evProp||'pierce';game.rm_evArmed=0;}
  /* RELÓGIO DO PECADO — bônus de cadência drena recarga (frame) */
  for(const b of bullets){
    if(b._rmSeen)continue;b._rmSeen=1;
    if(b.mine)continue; /* minas do jogo não são disparos */
    fresh++;if(fresh>6)continue; /* limite de segurança */
    /* — armamento do disparo — */
    let d=1;
    if(props.masc){d*=(game.rm_mascBoost||1.8);}
    if(props.sil){d*=1.5;}
    if(props.pressa>0){d*=1.0;/* cadência é no frame */}else if(props.pressa<0){d*=.8;}
    b.dmg*=d;
    /* FRIO: marcar balas de gelo (elemento) */
    if(b.elem==='gelo')b._ice=1;
    /* LAMENTO — sempre perfura 2 */
    if(game.rm_lamento){b._rmPierce=Math.max(b._rmPierce||0,2);b._lamento=1;b.color='#9fd8ff';
      if(game._rmSynFrioLam)b._ice=1; /* sinergia: a lágrima carrega geada */}
    /* ESPELHO FAMINTO — ricocheteia 2× */
    if(game.rm_espF&&!b._rmClone)b._rmBounce=Math.max(b._rmBounce||0,2);
    /* ARCO DO HEREGE — curva suave */
    if(game.rm_arcoH&&!b._rmClone){b._rmHome=Math.max(b._rmHome||0,.55);b._rmHomeT=.4;}
    /* EVANGELHO — propriedade rasurada */
    if(props.ev&&!b._rmClone){
      if(props.ev==='pierce')b._rmPierce=Math.max(b._rmPierce||0,2);
      else if(props.ev==='bounce')b._rmBounce=Math.max(b._rmBounce||0,2);
      else{b._rmHome=Math.max(b._rmHome||0,.8);b._rmHomeT=.8;}
      rmSparks(b.x,b.y,'#ffd9a0',4,120,.3,2);
    }
    if(b._rmClone)continue; /* clones não disparam efeitos em cadeia */
    RM.shots++;
    /* PACTO DO ENXAME — cada disparo vira três */
    if(game.rm_enxame&&bullets.length<85){
      const sp=Math.hypot(b.vx,b.vy)||600,a0=Math.atan2(b.vy,b.vx);
      const n=game._rmSynEnxLit?3:2,dm=game._rmSynEnxLit?.55:.65;
      for(let k=1;k<=n;k++){
        const aa=a0+(k%2?1:-1)*Math.ceil(k/2)*.13;
        bullets.push({x:b.x,y:b.y,vx:Math.cos(aa)*sp,vy:Math.sin(aa)*sp,r:b.r*.9,dmg:b.dmg*dm,life:b.life,a:aa,elem:b.elem,color:b.color,tear:b.tear,slowShot:b.slowShot,_rmSeen:1,_rmClone:1});
      }
    }
    /* ARMAS DE CONTAGEM */
    const S=RM.shots;
    if(game.rm_rosB&&S%6===0){ /* ROSÁRIO DE BALAS */
      const n=10,bd=b.dmg*.6;
      for(let k=0;k<n;k++){const aa=k/n*TAUx;
        bullets.push({x:player.x,y:player.y,vx:Math.cos(aa)*430,vy:Math.sin(aa)*430,r:5,dmg:bd,life:.55,a:aa,color:'#ffd9a0',_rmSeen:1,_rmClone:1});}
      try{blip('sine',660,880,.14,.07);}catch(e){}
    }
    if(game.rm_espingarda&&S%5===0){ /* ESPINGARDA DO SACRILÉGIO */
      const a0=props.ang!=null?props.ang:Math.atan2(b.vy,b.vx);
      for(let k=-2;k<=2;k++){const aa=a0+k*.16;
        bullets.push({x:player.x,y:player.y,vx:Math.cos(aa)*780,vy:Math.sin(aa)*780,r:4.5,dmg:b.dmg*.5,life:.3,a:aa,color:'#e6dac4',_rmSeen:1,_rmClone:1});}
      try{noiseSfx(.14,.05,900,'highpass');}catch(e){}
    }
    if(game.rm_agulha&&S%7===0){ /* AGULHA DA PENITÊNCIA */
      const aa=Math.atan2(b.vy,b.vx);
      bullets.push({x:player.x,y:player.y,vx:Math.cos(aa)*1350,vy:Math.sin(aa)*1350,r:3,dmg:b.dmg*2.2,life:.9,a:aa,color:'#cfe9ff',_rmSeen:1,_rmClone:1,_rmPierce:3,_needle:1});
      try{blip('square',1500,900,.1,.06);}catch(e){}
    }
    if(game.rm_incensario&&S%8===0){ /* INCENSÁRIO */
      const aa=Math.atan2(b.vy,b.vx);
      bullets.push({x:player.x,y:player.y,vx:Math.cos(aa)*210,vy:Math.sin(aa)*210,r:9,dmg:b.dmg*1.4,life:1.5,a:aa,color:'#c9a44c',_rmSeen:1,_rmClone:1,_rmIncenso:1});
      try{blip('sine',300,180,.3,.05);}catch(e){}
    }
    if(game.rm_denteC&&S%5===0){ /* DENTE DE CÉRBERO */
      const aa=Math.atan2(b.vy,b.vx);
      bullets.push({x:player.x,y:player.y,vx:Math.cos(aa)*900,vy:Math.sin(aa)*900,r:6,dmg:b.dmg*.9,life:.9,a:aa,color:'#e8455a',_rmSeen:1,_rmClone:1,_vdBonus:game._rmSynVerCerb?1:0});
      bullets.push({x:player.x,y:player.y,vx:Math.cos(aa+.09)*900,vy:Math.sin(aa+.09)*900,r:6,dmg:b.dmg*.9,life:.9,a:aa,color:'#e8455a',_rmSeen:1,_rmClone:1,_vdBonus:game._rmSynVerCerb?1:0});
      RM._cerb3={t:.24,ang:aa,dmg:b.dmg*1.1};
      try{blip('sawtooth',200,140,.16,.07);}catch(e){}
    }
    if(game.rm_velaF&&S%6===0){ /* VELA DE FUNERAL */
      const aa=Math.atan2(b.vy,b.vx);
      bullets.push({x:player.x,y:player.y,vx:Math.cos(aa)*520,vy:Math.sin(aa)*520,r:6,dmg:b.dmg*.8,life:.62,a:aa,color:'#ff8f3d',_rmSeen:1,_rmClone:1,_rmVela:1});
      try{blip('triangle',500,240,.18,.05);}catch(e){}
    }
    if(game.rm_sermao&&S%7===0){ /* SERMÃO QUEBRADO */
      game.rm_sermaoV^=1;
      const _sermA=Math.atan2(b.vy,b.vx);
      const vert=game.rm_sermaoV,aa=Math.atan2(b.vy,b.vx),bd=b.dmg*.7;
      for(let k=-3;k<=3;k++){
        let vx,vy;
        if(vert){vx=Math.cos(aa)*520+Math.cos(aa+Math.PI/2)*k*0;vy=Math.sin(aa)*520;const px=player.x+Math.cos(aa+Math.PI/2)*k*26,py=player.y+Math.sin(aa+Math.PI/2)*k*26;
          bullets.push({x:px,y:py,vx:Math.cos(aa)*560,vy:Math.sin(aa)*560,r:5,dmg:bd,life:1.1,a:aa,color:'#ffe9b8',_rmSeen:1,_rmClone:1});}
        else{const pa=aa+k*.11;bullets.push({x:player.x,y:player.y,vx:Math.cos(pa)*560,vy:Math.sin(pa)*560,r:5,dmg:bd,life:1.1,a:pa,color:'#ffe9b8',_rmSeen:1,_rmClone:1});}
      }
      if(game._rmSynMirSer){if(RM.mirror)RM.mirror.q.length=0;RM.queueMirrorWave(_sermA,560,b.dmg*.7);}
      try{blip('square',420,620,.16,.06);}catch(e){}
    }
    if(game.rm_cravo&&S%9===0){ /* CRAVO DO ABISMO */
      const aa=Math.atan2(b.vy,b.vx);
      bullets.push({x:player.x,y:player.y,vx:Math.cos(aa)*430,vy:Math.sin(aa)*430,r:8,dmg:b.dmg*1.6,life:1.4,a:aa,color:'#8b8581',_rmSeen:1,_rmClone:1,_rmPierce:1,_rmCravo:1});
      try{blip('sine',150,80,.2,.09);}catch(e){}
    }
    if(game.rm_liturgia&&S%4===0){ /* LITURGIA DE ESTILHAÇOS */
      b._rmSplitAt=130;b._rmSplitN=game._rmSynEnxLit?5:3;
    }
    if(game.rm_mordidaD&&S%5===0){ /* MORDIDA DUPLA */
      const aa=Math.atan2(b.vy,b.vx);
      let pi=0;
      for(const s of[-1,1]){
        const ex={x:player.x,y:player.y,vx:Math.cos(aa+s*.5)*560,vy:Math.sin(aa+s*.5)*560,r:6,dmg:b.dmg*.85,life:1.2,a:aa+s*.5,color:'#d9465a',_rmSeen:1,_rmClone:1,_rmConv:{ax:aa,s:s,t:.42}};
        /* sinergia EVANGELHO+MORDIDA DUPLA: cada presa ganha um dom próprio */
        if(game._rmSynEvDupla){if(pi===0)ex._rmPierce=2;else ex._rmBounce=2;}
        bullets.push(ex);pi++;
      }
      try{blip('triangle',340,520,.12,.05);}catch(e){}
    }
  }
  /* TERCEIRO DENTE DE CÉRBERO — caça o último mordido */
  if(RM._cerb3){
    RM._cerb3.t-=1/60;
    if(RM._cerb3.t<=0){
      const tgt=RM._lastHitEnemy&&!RM._lastHitEnemy.dead?RM._lastHitEnemy:nearestEnemy();
      let aa=RM._cerb3.ang;
      if(tgt)aa=Math.atan2(tgt.y-player.y,tgt.x-player.x);
      bullets.push({x:player.x,y:player.y,vx:Math.cos(aa)*760,vy:Math.sin(aa)*760,r:6,dmg:RM._cerb3.dmg,life:1.1,a:aa,color:'#ff6b8a',_rmSeen:1,_rmClone:1,_rmHome:1.4,_rmHomeT:1.0});
      RM._cerb3=null;
    }
  }
  /* MÁSCARA — relógio de preparação */
  if(game.rm_mascara){
    if(fresh>0)game.rm_mascT=0;
    else{game.rm_mascT+=1/60;if(game.rm_mascT>=1.6&&!game.rm_mascArmed){game.rm_mascArmed=1;rmSparks(player.x,player.y,'#cfe9ff',6,140,.4,2);}}
  }
  return fresh>0?props:null;
}
function nearestEnemy(){
  let best=null,bd=1e9;
  for(const e of enemies){if(e.dead||e.spawnT<.5)continue;const d=D(player.x,player.y,e.x,e.y);if(d<bd){bd=d;best=e;}}
  return best;
}
/* passiva por-bala (roda depois do updateBullets do jogo) */
function bulletFramePass(dt){
  const m=game.absMain;
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];
    /* ARCO DO HEREGE — caça suave */
    if(b._rmHome&&b._rmHomeT>0&&!b._rmClone||b._rmHome&&b._rmClone&&b._rmHomeT>0){
      b._rmHomeT-=dt;
      const tgt=nearestEnemy();
      if(tgt){
        const want=Math.atan2(tgt.y-b.y,tgt.x-b.x),cur=Math.atan2(b.vy,b.vx);
        const na=cur+angN(want-cur)*Math.min(1,b._rmHome*dt*4);
        const sp=Math.hypot(b.vx,b.vy);
        b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp;
      }
    }
    /* ESPELHO FAMINTO — quique nas paredes */
    if(b._rmBounce>0){
      if(b.x<m.x+10&&b.vx<0||b.x>m.x+m.w-10&&b.vx>0){b.vx*=-1;b._rmBounce--;try{blip('square',320,220,.05,.03);}catch(e){}}
      if(b.y<m.y+10&&b.vy<0||b.y>m.y+m.h-10&&b.vy>0){b.vy*=-1;b._rmBounce--;try{blip('square',320,220,.05,.03);}catch(e){}}
    }
    /* MORDIDA DUPLA — convergência */
    if(b._rmConv){
      b._rmConv.t-=dt;
      const c=b._rmConv;
      const sp=Math.hypot(b.vx,b.vy),cur=Math.atan2(b.vy,b.vx);
      const na=cur+angN(c.ax-cur)*dt*(c.t>0?-2.6:5.2)*(-c.s);
      b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp;
      if(c.t<=-0.02)delete b._rmConv;
    }
    /* LITURGIA — divisão no meio do caminho */
    if(b._rmSplitAt){
      b._rmTrav=(b._rmTrav||0)+Math.hypot(b.vx,b.vy)*dt;
      if(b._rmTrav>=b._rmSplitAt&&bullets.length<100){
        const aa=Math.atan2(b.vy,b.vx),sp=Math.hypot(b.vx,b.vy),n=b._rmSplitN||3;
        for(let k=0;k<n;k++){const pa=aa+(k-(n-1)/2)*.3;
          bullets.push({x:b.x,y:b.y,vx:Math.cos(pa)*sp*.9,vy:Math.sin(pa)*sp*.9,r:4,dmg:b.dmg*.45,life:.6,a:pa,color:'#ffe9b8',_rmSeen:1,_rmClone:1});}
        rmSparks(b.x,b.y,'#ffe9b8',6,150,.35,2);bullets.splice(i,1);continue;
      }
    }
    /* CINZA INCANDESCENTE — brasas no chão */
    if(game.rm_cinza&&!b._rmClone){
      b._rmCin=(b._rmCin||0)+1;
      if(b._rmCin%3===0&&RM.zEmber.length<24)RM.zEmber.push({x:b.x,y:b.y,r:26,t:0,life:2.6});
    }
    /* INCENSÁRIO — trilha de fumaça */
    if(b._rmIncenso&&RM.zSmoke2.length<20)RM.zSmoke2.push({x:b.x,y:b.y,r:24,t:0,life:1.8,emb:!!game._rmSynIncCin});
    /* CRAVO — pregado sangrando */
    if(b._rmCravo&&!b._cravoDone){
      for(const e of enemies){
        if(e.dead||e.spawnT<.5)continue;
        if(D(b.x,b.y,e.x,e.y)<e.r+b.r){
          e._nailT=1.2;e._nailD=b.dmg*.28;b._cravoDone=1;rmSparks(e.x,e.y,'#8b8581',6,150,.4,2.5);break;
        }
      }
    }
  }
}

/* ================================================================
   PARTE 2C — FRAME CENTRAL (passivas, armas-item, pato, zonas…)
   Roda 1× por frame dentro do __EXPANSION.frame (wrap).
   ================================================================ */
RM.onPickup=function(u){
  try{
    /* sinergias checam novas aquisições */
    synScan(u);
    /* JUROS COMPOSTOS — bênções pagam juros */
    if(game.rm_juros&&(u.desc||'').indexOf('PACTO')!==0){
      game.rm_jurosN=(game.rm_jurosN||0)+1;
      if(game.rm_jurosN%3===0){player.maxHp=Math.max(40,player.maxHp-6);player.hp=Math.min(player.hp,player.maxHp);rmTxt('JUROS COBRADOS -6 VIDA',player.x,player.y-46,11,'#d9465a');}
    }
    /* COROA DE GANÂNCIA marca a próxima sala */
  }catch(e){}
};
RM.onKill=function(e){
  try{
    /* EVANGELHO RASURADO — contagem para o dom */
    if(game.rm_evangelho&&!e.xboss){game.rm_evK++;if(game.rm_evK>=8){game.rm_evK=0;game.rm_evArmed=1;
      game.rm_evProp=pick(['pierce','bounce','home']);rmTxt('EVANGELHO: '+game.rm_evProp.toUpperCase(),player.x,player.y-40,10,'#ffe9b8');}}
    /* RELÓGIO DO PECADO — cadeia de mortes */
    if(game.rm_relogio){
      if(game.t-game.rm_relT<2.2)game.rm_relK++;else game.rm_relK=1;
      game.rm_relT=game.t;
    }
    /* TURÍBULO VAZIO — fumaça sagrada na morte */
    if(game.rm_turibulo&&RM.zSmoke.length<14)RM.zSmoke.push({x:e.x,y:e.y,r:56,t:0,life:4.5});
    /* ROSÁRIO SEM CONTAS — chefes únicos por andar */
    if(game.rm_rosario&&e.maxHp>=600){
      const key=game.floor+'_'+(e.type||'?');
      if(!game.rm_rosBoss[key]){game.rm_rosBoss[key]=1;P.dmgMult*=1.04;rmTxt('ROSÁRIO +4% DANO',e.x,e.y-30,10,'#ffd9a0');}
    }
    /* COROA DE GANÂNCIA — chefes abrem a sala da bênção extra */
    if(game.rm_ganancia&&e.maxHp>=600){game.rm_greedDrop=1;rmTxt('A COROA EXIGE O TRIBUTO',e.x,e.y-46,11,'#ffd9a0');}
    /* LAMENTO/AGULHA — último alvo atingido (dente 3 de Cérbero) */
  }catch(e){}
};
RM.afterHurt=function(){
  try{
    /* CREDOR DAS ALMAS — a dor derrama almas */
    if(game.rm_credorA&&game.souls>0){const perde=Math.floor(game.souls*.25);if(perde>0){game.souls-=perde;rmTxt('-'+perde+' ALMAS (O CREDOR COBROU)',player.x,player.y-52,11,'#9d6bb5');}}
    /* AMPULHETA DO ÚLTIMO SEGUNDO */
    if(game.rm_ampulheta&&game.rm_ampCd<=0){game.rm_ampCd=12;RM._ebSlow=.55;RM._ampT=2.2;rmTxt('A AREIA VIROU',player.x,player.y-52,12,'#cfe9ff');try{blip('sine',800,200,.7,.09);}catch(e){}}
    /* COROA DE ESPINHOS — retaliação */
    if(game.rm_espinhos){
      shockwaves.push({x:player.x,y:player.y,r:14,vr:520,maxR:110,dmg:18*P.dmgMult,hit:new Set()});
      for(const e of enemies){if(e.dead)continue;const d=D(player.x,player.y,e.x,e.y);
        if(d<130){const a=Math.atan2(e.y-player.y,e.x-player.x);e.x+=Math.cos(a)*54;e.y+=Math.sin(a)*54;}}
      rmSparks(player.x,player.y,'#d9465a',14,260,.5,3);try{sfx.thud();}catch(e){}
    }
    /* RELÓGIO DO PECADO — dano zera */
    if(game.rm_relogio)game.rm_relK=0;
    /* DÍVIDA CRESCENTE — dano apaga */
    if(game.rm_divida&&game.rm_divSt>0){game.rm_divSt=0;rmTxt('A DÍVIDA FOI APAGADA',player.x,player.y-52,10,'#6e6357');}
    /* marca que a sala foi manchada (PENA DOS CONDENADOS / DÍVIDA / VELA) */
    game._rmRoomDmg=1;
    /* PENA CARBONIZADA — nada aqui */
  }catch(e){}
};
RM.hurtDmg=function(dmg){
  try{
    /* PROMESSA QUEBRADA — o primeiro golpe da sala dói menos */
    if(game.rm_promessa&&game.rm_promOk){game.rm_promOk=0;rmTxt('A PROMESSA AMORTECEU O GOLPE',player.x,player.y-56,10,'#9d6bb5');return Math.max(5,Math.round(dmg*.45));}
  }catch(e){}
  return dmg;
};
RM.tryWitness=function(){
  try{
    if(game.rm_testemunha&&!game._rmTestUsed&&player.hp<=0){
      game._rmTestUsed=1;game.rm_testemunha=0;game.up['rm_ultima_testemunha']=0;
      player.hp=Math.max(1,Math.round(player.maxHp*.06));
      player.inv=2.6;game.flash=.5;game.shake=16;
      sfx.levelup();sfx.echo();
      rmSparks(player.x,player.y,'#cfe9ff',26,300,.9,4);
      rmTxt('A ÚLTIMA TESTEMUNHA RECUSOU O FIM',W/2,H*.3,15,'#cfe9ff');
      game.banner={type:'small',txt:'A TESTEMUNHA VIGIOU',sub:'o pacto se desfaz — não há segunda vez',t:0,dur:2.6};
      return true;
    }
  }catch(e){}
  return false;
};
/* ---------- ganchos de sala ---------- */
RM.onRoomClear=function(rr){
  try{
    if(!rr)return;
    const limpo=!game._rmRoomDmg;
    /* PENA DOS CONDENADOS — sala limpa sem dano = escudo */
    if(game.rm_penaCond&&limpo){game.shieldHits=(game.shieldHits||0)+1;rmTxt('PENA: ESCUDO PARA A PRÓXIMA SALA',player.x,player.y-48,10,'#cfe9ff');}
    /* DÍVIDA CRESCENTE — soma */
    if(game.rm_divida&&limpo&&game.rm_divSt<8){game.rm_divSt++;rmTxt('DÍVIDA: +6% DANO',player.x,player.y-44,9,'#9d6bb5');}
    /* SINO DOS AUSENTES — presente extra (nunca em sala de chefe) */
    if(game.rm_sino&&rr.kind!=='boss'&&rr.kind!=='miniboss'&&Math.random()<.18){
      pickups.push({type:'soul',x:player.x+rnd(-30,30),y:player.y-30,t:0,ph:rnd(TAU)});
      pickups.push({type:'soul',x:player.x+rnd(-30,30),y:player.y-10,t:0,ph:rnd(TAU)});
      if(Math.random()<.45){
        const pool=UPGRADES.filter(function(u){return u.can()&&u.q>=3&&u.q<=4;});
        if(pool.length){const u=pick(pool);pickups.push({type:'blessing_drop',x:player.x,y:player.y-60,t:0,ph:rnd(TAU),dropType:'upgrade',dropId:u.id,rarity:'raro'});}
      }
      try{blip('sine',784,1046,.5,.08);}catch(e){}
      rmTxt('O SINO DOS AUSENTES DOBROU',player.x,player.y-62,11,'#ffd9a0');
    }
    /* COROA DE GANÂNCIA — entrega da bênção extra */
    if(game.rm_ganancia&&game.rm_greedDrop&&rr.kind!=='boss'){
      game.rm_greedDrop=0;
      const pool=UPGRADES.filter(function(u){return u.can()&&u.q>=4;});
      if(pool.length){const u=pick(pool);
        pickups.push({type:'blessing_drop',x:player.x+34,y:player.y-40,t:0,ph:rnd(TAU),dropType:'upgrade',dropId:u.id,rarity:'épico'});}
      rmTxt('TRIBUTO DA COROA ENTREGUE',player.x,player.y-64,11,'#ffd9a0');
    }
    /* ÚLTIMA VELA — recarrega a cada sala */
    game._rmRoomDmg=0;game.rm_promOk=1;game.rm_velaRoom='';
    if(game.rm_relogio){game.rm_relK=0;}
  }catch(e){}
};
RM.onChest=function(){
  try{
    if(!game.rm_portaF)return;
    /* PORTA FECHADA — dobro do baú + onda extra */
    setTimeout(function(){try{if(game.state!=='play')return;dropChestLoot(player.x,player.y+20);}catch(e){}},420);
    setTimeout(function(){
      try{
        if(game.state!=='play')return;
        const m=game.absMain,tipos=['sh','sh','sp','cr','fs'];
        const n=3+irnd(0,2);
        for(let k=0;k<n;k++){
          const a=rnd(TAUx),d=rnd(120,190);
          const ex=clamp(player.x+Math.cos(a)*d,m.x+40,m.x+m.w-40),ey=clamp(player.y+Math.sin(a)*d,m.y+40,m.y+m.h-40);
          spawnEnemy(pick(tipos),ex,ey);
        }
        rmTxt('A PORTA COBROU O PEDÁGIO',W/2,H*.3,13,'#d9465a');
        try{sfx.growl();game.shake=10;}catch(e){}
      }catch(e){}
    },650);
  }catch(e){}
};
RM.onDescend=function(){
  try{
    /* CHAVE DO PURGATÓRIO — recarrega por descida */
    if(game.rm_chave)game.rm_chaveFloor=-1;
    /* DÍZIMO DO INFERNO — cobrança */
    if(game.rm_dizimo){
      if(game.souls>=30){game.souls-=30;rmTxt('DÍZIMO PAGO: 30 ALMAS',W/2,H*.2,12,'#9d6bb5');game._rmDizPen=0;}
      else{game._rmDizPen=1;game._rmDizT=6;rmTxt('O DÍZIMO NÃO FOI PAGO — VOCÊ DEVE',W/2,H*.2,13,'#d9465a');try{sfx.growl();}catch(e){}}
    }
  }catch(e){}
};
/* troca de oferta (CHAVE DO PURGATÓRIO) */
function chaveTroca(){
  try{
    if(!game.rm_chave)return;
    if(game.rm_chaveFloor===game.floor){rmTxt('A CHAVE JÁ FOI USADA NESTA DESCIDA',player.x,player.y-50,10,'#6e6357');return;}
    if(game.souls<40){rmTxt('A CHAVE PEDE 40 ALMAS',player.x,player.y-50,10,'#d9465a');return;}
    /* oferta de bênção mais próxima */
    let best=null,bd=86;
    for(const p of pickups){
      if(p.type!=='blessing_drop'||p.dropType!=='upgrade')continue;
      const d=D(player.x,player.y,p.x,p.y);if(d<bd){bd=d;best=p;}
    }
    if(!best){rmTxt('NENHUMA OFERTA PERTO',player.x,player.y-50,10,'#6e6357');return;}
    const qualidade=game._rmSynChaveFav?Math.min(5,(UPGRADES.find(function(u){return u.id===best.dropId;})||{}).q||3)+1:0;
    game.souls-=40;game.rm_chaveFloor=game.floor;
    const pool=UPGRADES.filter(function(u){return u.can()&&u.q>=(qualidade||1)&&u.q<=Math.max(4,qualidade);});
    if(!pool.length){game.souls+=40;return;}
    const nu=pick(pool);
    best.dropId=nu.id;best.rarity=nu.q>=5?'épico':nu.q>=3?'raro':'comum';
    rmTxt('A CHAVE TROCOU A OFERTA: '+nu.name,player.x,player.y-56,11,'#ffd9a0');
    try{blip('sine',523,784,.4,.09);sfx.echo();}catch(e){}
  }catch(e){}
}
RM.chaveTroca=chaveTroca;
/* ---------- frame central ---------- */
RM.frame=function(dt){
  try{
    /* AMPULHETA — relógio */
    if(RM._ampT>0){RM._ampT-=dt;if(RM._ampT<=0)RM._ebSlow=1;}
    if(game.rm_ampulheta&&game.rm_ampCd>0)game.rm_ampCd-=dt;
    /* DÍZIMO — penalidade temporária */
    if(game._rmDizPen){game._rmDizT-=dt;if(game._rmDizT<=0)game._rmDizPen=0;}
    /* CERBERUS fase 3 tem frame próprio — mas os disparos do jogador
       continuam recebendo os modificadores das armas-item */
    if(game._rmSent){c3Frame(dt);const _p=newShotPass();bulletFramePass(dt);return;}
    /* SILÊNCIO — relógio de imobilidade */
    if(game.rm_silencio){
      if(Math.abs(player.vx||0)>4||Math.abs(player.vy||0)>4||player.mvx||player.mvy)game.rm_silT=0;
      else game.rm_silT+=dt;
    }
    /* ÚLTIMA VELA — uma vez por sala, pouca vida */
    if(game.rm_vela&&player.hp<=player.maxHp*.3&&game.rm_velaRoom!==game.roomIdx){
      game.rm_velaRoom=game.roomIdx;
      for(let i=ebullets.length-1;i>=0;i--){
        const b=ebullets[i];
        if(b.mine)continue;
        if(D(b.x,b.y,player.x,player.y)<230){ebullets.splice(i,1);rmSparks(b.x,b.y,'#ffd9a0',3,90,.3,2);}
      }
      shockwaves.push({x:player.x,y:player.y,r:12,vr:700,maxR:230,t:0,dur:.4,c:'#ffd9a0'});
      /* sinergia ÚLTIMA VELA + CONTRATO DE SANGUE: a onda queima mais forte */
      if(game._rmSynVelaSangue&&player.hp<=player.maxHp*.35)
        shockwaves.push({x:player.x,y:player.y,r:16,vr:620,maxR:200,dmg:26*P.dmgMult,hit:new Set()});
      rmTxt('A ÚLTIMA VELA SOPROU',player.x,player.y-56,12,'#ffd9a0');
      try{noiseSfx(.4,.07,300,'lowpass');blip('sine',300,90,.5,.1);}catch(e){}
    }
    /* CORAÇÃO EMPRESTADO — o dono cobra */
    if(game.rm_coracaoT>0){
      game.rm_coracaoT-=dt;
      if(game.rm_coracaoT<=0){
        game.rm_coracaoT=0;
        player.maxHp=Math.max(40,player.maxHp-30);
        player.hp=Math.min(player.hp,player.maxHp);
        rmTxt('O CORAÇÃO EMPRESTADO VOLTOU AO DONO',player.x,player.y-56,11,'#9d6bb5');
        try{sfx.thud();}catch(e){}
      }
    }
    /* OSSOS EM ÓRBITA */
    if(game.rm_ossos&&RM.orb){
      const acel=RM._orbBoost>0?2.1:1;
      if(RM._orbBoost>0)RM._orbBoost-=dt;
      for(const o of RM.orb){
        o.a+=dt*2.4*acel;
        o.x=player.x+Math.cos(o.a)*46;o.y=player.y+Math.sin(o.a)*46;
        for(const e of enemies){
          if(e.dead||e.spawnT<.5||(e._orbCd>0))continue;
          if(D(o.x,o.y,e.x,e.y)<e.r+9){x_dmgEnemy(e,9*P.dmgMult,'#e6dac4');e._orbCd=.5;}
        }
      }
      for(const e of enemies)if(e._orbCd>0)e._orbCd-=dt;
      /* bloquear projéteis pequenos */
      for(let i=ebullets.length-1;i>=0;i--){
        const b=ebullets[i];
        if(b.mine||b.r>8||b.rm)continue;
        for(const o of RM.orb){
          if(D(o.x,o.y,b.x,b.y)<b.r+9){ebullets.splice(i,1);rmSparks(b.x,b.y,'#e6dac4',3,120,.3,2);break;}
        }
      }
    }
    /* PENA CARBONIZADA — graça por quase-esquiva */
    if(game.rm_penaC&&game._rmGrazaCd>0)game._rmGrazaCd-=dt;
    /* ESTILHAÇO DE REFLEXO — chance limitada */
    if(game.rm_reflexo){
      RM._reflCd=Math.max(0,(RM._reflCd||0)-dt);
      if(RM._reflCd<=0){
        for(let i=ebullets.length-1;i>=0;i--){
          const b=ebullets[i];
          if(b.mine||b.fake||b.rm||b.r>9)continue;
          if(D(b.x,b.y,player.x,player.y)<92&&Math.random()<(RM._synRefl?.22:.12)){
            ebullets.splice(i,1);
            const a=Math.atan2(b.vy,b.vx);
            bullets.push({x:b.x,y:b.y,vx:Math.cos(a)*640,vy:Math.sin(a)*640,r:6,dmg:14*P.dmgMult,life:1.1,a:a,color:'#cfe9ff',_rmSeen:1,_rmClone:1});
            rmSparks(b.x,b.y,'#cfe9ff',6,180,.4,2.5);
            RM._reflCd=.34;
            break;
          }
        }
      }
    }
    /* CÁLICE VAZIO — beber e cuspir */
    if(game.rm_calice&&RM.calice){
      const c=RM.calice;
      if(c.win>0){
        c.win-=dt;
        for(let i=ebullets.length-1;i>=0;i--){
          const b=ebullets[i];
          if(b.mine||b.fake||b.rm||b.dmg>16||c.n>=8)continue;
          if(D(b.x,b.y,player.x,player.y)<74){ebullets.splice(i,1);c.n++;rmSparks(b.x,b.y,'#9d6bb5',3,120,.3,2);}
        }
        if(c.win<=0){
          for(let k=0;k<c.n;k++){
            const a=rnd(TAUx);
            bullets.push({x:player.x,y:player.y,vx:Math.cos(a)*620,vy:Math.sin(a)*620,r:5,dmg:12*P.dmgMult,life:1.2,a:a,color:'#c9a0ff',_rmSeen:1,_rmClone:1,_rmHome:.9,_rmHomeT:1});
          }
          if(c.n>0){rmTxt('O CÁLICE COSPOU '+c.n,player.x,player.y-46,10,'#c9a0ff');try{blip('sine',300,900,.4,.09);}catch(e){}}
          c.n=0;c.t=10;
        }
      }else{
        c.t-=dt;
        if(c.t<=0){c.win=1.2;rmTxt('O CÁLICE SE ABRE',player.x,player.y-44,10,'#c9a0ff');try{blip('triangle',600,300,.3,.06);}catch(e){}}
      }
    }
    /* CANHÃO DE EXCOMUNHÃO */
    if(game.rm_canhao&&RM.canhao){
      const c=RM.canhao;
      if(c.chg>0){
        c.chg-=dt;
        if(c.chg<=0){
          const a=(player.mvx||player.mvy)?Math.atan2(player.mvy,player.mvx):player.angle;
          bullets.push({x:player.x,y:player.y,vx:Math.cos(a)*760,vy:Math.sin(a)*760,r:14,dmg:55*P.dmgMult,life:1.5,a:a,color:'#e8455a',_rmSeen:1,_rmClone:1,_rmPierce:99,_canhao:1});
          game.shake=12;try{noiseSfx(.4,.1,150,'lowpass');blip('sine',120,50,.5,.14);}catch(e){}
          rmTxt('EXCOMUNHÃO',player.x,player.y-52,13,'#e8455a');
        }
      }else{
        c.t-=dt;
        if(c.t<=0){c.chg=.9;c.t=9;rmTxt('O CANHÃO CARREGA…',player.x,player.y-44,10,'#e8455a');try{blip('sawtooth',90,220,.6,.07);}catch(e){}}
      }
    }
    /* COROA BALÍSTICA */
    if(game.rm_bOrb&&RM.bOrb){
      const B=RM.bOrb;
      if(B.orbs.length===0){
        B.t-=dt;
        const pressa=game.rm_pressa&&(player.mvx||player.mvy)?1.5:1;
        if(game._rmSynPressOrb)B.t-=dt*.8*(Math.hypot(player.mvx||0,player.mvy||0)?1:0);
        if(B.t<=0){
          for(let k=0;k<3;k++)B.orbs.push({a:k/3*TAUx,t:0,launched:false});
          B.t=5.2;try{blip('triangle',500,700,.2,.05);}catch(e){}
        }
      }
      for(let k=B.orbs.length-1;k>=0;k--){
        const o=B.orbs[k];o.t+=dt;o.a+=dt*3.2;
        if(!o.launched){
          if(o.t>=1.4){
            o.launched=true;
            const tgt=nearestEnemy();
            const aa=tgt?Math.atan2(tgt.y-player.y,tgt.x-player.x):o.a;
            o.vx=Math.cos(aa)*(620*(game._rmSynPressOrb?1.35:1));o.vy=Math.sin(aa)*(620*(game._rmSynPressOrb?1.35:1));
            o.x=player.x+Math.cos(o.a)*52;o.y=player.y+Math.sin(o.a)*52;
          }
        }else{
          o.x+=o.vx*dt;o.y+=o.vy*dt;o.life=(o.life||0)+dt;
          for(const e of enemies){
            if(e.dead||e.spawnT<.5)continue;
            if(D(o.x,o.y,e.x,e.y)<e.r+10){x_dmgEnemy(e,16*P.dmgMult,'#ffd9a0');B.orbs.splice(k,1);rmSparks(o.x,o.y,'#ffd9a0',6,180,.4,2.5);break;}
          }
          if(o.life>1.4)B.orbs.splice(k,1);
        }
      }
    }
    /* OSSOS aceleram com espingarda (sinergia) */
    if(game._rmSynOssosEsp&&RM.orb){/* aplicado no disparo abaixo */}
    /* pato herege */
    if(game.rm_pato)duckFrame(dt);
    /* zonas: brasas / fumaças */
    zoneFrame(dt);
    /* passada de balas (modificadores por disparo + passivas) */
    const props=newShotPass();
    bulletFramePass(dt);
    /* espingarda acelera ossos (sinergia 10) */
    if(props&&game._rmSynOssosEsp&&RM.orb)RM._orbBoost=1.2;
    /* cópia espectral (CONTRATO DE ESPELHOS) */
    if(game.rm_espelhos)mirrorFrame(dt);
    /* PENALIDADE DO DÍZIMO — lento e fraco */
    if(game._rmDizPen&&game._rmDizPenT!==1){/* aplicado via mult no frame de dano (simples: slowT leve) */
      player.slowT=Math.max(player.slowT||0,.2);
    }
    /* FABULOSA — nada */ 
  }catch(e){if(window.__RM_VERBOSE)console.warn('[rm] frame:',e.message);}
};
/* zonas de chão (brasas/fumaça) */
function zoneFrame(dt){
  for(let i=(RM.zEmber||[]).length-1;i>=0;i--){
    const z=RM.zEmber[i];z.t+=dt;
    if(z.t>=z.life){RM.zEmber.splice(i,1);continue;}
    if(Math.random()<dt*8)particles.push({x:z.x+rnd(-z.r,z.r)*.6,y:z.y+rnd(-z.r,z.r)*.6,vx:0,vy:rnd(-40,-15),life:.5,t:0,r:rnd(1,2),c:'#ff8f3d',drag:1,glow:true});
    for(const e of enemies){
      if(e.dead||e.spawnT<.5)continue;
      if(D(e.x,e.y,z.x,z.y)<z.r+e.r*.5)x_dmgEnemy(e,4.5*P.dmgMult*dt,'#ff8f3d');
    }
  }
  for(const key of['zSmoke','zSmoke2']){
    for(let i=(RM[key]||[]).length-1;i>=0;i--){
      const z=RM[key][i];z.t+=dt;
      if(z.t>=z.life){RM[key].splice(i,1);continue;}
      /* fumaça do turíbulo: só lentidão; fumaça do incensário: dano (+brasas na sinergia) */
      if(key==='zSmoke2'&&z.emb&&Math.random()<dt*5)RM.zEmber.push({x:z.x,y:z.y,r:18,t:0,life:1.8});
      if(key==='zSmoke2'){
        for(const e of enemies){if(e.dead||e.spawnT<.5)continue;if(D(e.x,e.y,z.x,z.y)<z.r+e.r*.5)x_dmgEnemy(e,3.5*P.dmgMult*dt,'#c9a44c');}
      }
    }
  }
  /* lentidão de projéteis nas fumaças + halo quebrado (método de compensação) */
  const vm=(typeof game!=='undefined'&&game.hard)?1.22:1;
  for(const b of ebullets){
    if(b.mine||b.fake)continue;
    let f=0;
    if(game.rm_halo&&D(b.x,b.y,player.x,player.y)<130)f=Math.max(f,.22);
    for(const z of(RM.zSmoke||[]))if(D(b.x,b.y,z.x,z.y)<z.r)f=Math.max(f,.45);
    if(f>0&&b.vx!==undefined){
      const mult=window.__RM_ebslow?window.__RM_ebslow():1;
      b.x-=b.vx*vm*mult*dt*f;b.y-=b.vy*vm*mult*dt*f;
    }
  }
  /* PENA CARBONIZADA — quase-esquiva */
  if(game.rm_penaC&&(!game._rmGrazaCd||game._rmGrazaCd<=0)){
    for(const b of ebullets){
      if(b.mine||b.fake)continue;
      const d=D(b.x,b.y,player.x,player.y);
      if(d<30&&d>player.r+b.r-2){
        game._rmGrazaCd=1.2;
        player.dashCd=Math.max(0,player.dashCd*.6);
        game._grazaT=.6;
        rmSparks(player.x,player.y,'#ffd9a0',5,140,.3,2);
        break;
      }
    }
  }
}
/* ---------- CÓPIA ESPECTRAL ---------- */
function mirrorFrame(dt){
  const M=RM.mirror;if(!M)return;
  /* guarda o último disparo (cluster por frame) */
  for(const b of bullets){
    if(b._rmClone||b._mirr)continue;
    if(b._rmSeen&&!b._mirrQueued){
      b._mirrQueued=1;
      M.q.push({x:b.x,y:b.y,ang:Math.atan2(b.vy,b.vx),dmg:b.dmg*.55,r:b.r||5,t:.55,home:game._rmSynMirSer?1:0});
      if(M.q.length>3)M.q.shift();
    }
  }
  if(game._rmSynMirSer&&M.waveQ){
    M.waveQ.t-=dt;
    if(M.waveQ.t<=0){
      const w=M.waveQ;
      for(let k=-3;k<=3;k++){const pa=w.ang+k*.11;
        bullets.push({x:M.x,y:M.y,vx:Math.cos(pa)*w.sp,vy:Math.sin(pa)*w.sp,r:5,dmg:w.dmg,life:1.1,a:pa,color:'#9d6bb5',_rmSeen:1,_rmClone:1,_mirr:1});}
      M.waveQ=null;
      try{blip('triangle',300,420,.2,.05);}catch(e){}
    }
  }
  for(let i=M.q.length-1;i>=0;i--){
    const s=M.q[i];s.t-=dt;
    if(s.t<=0){
      M.x=s.x;M.y=s.y;
      bullets.push({x:s.x,y:s.y,vx:Math.cos(s.ang)*700,vy:Math.sin(s.ang)*700,r:s.r,dmg:s.dmg,life:.9,a:s.ang,color:'#9d6bb5',_rmSeen:1,_rmClone:1,_mirr:1,_rmHome:s.home?.9:0,_rmHomeT:s.home?.8:0});
      M.q.splice(i,1);
      try{blip('sine',400,320,.12,.04);}catch(e){}
    }
  }
  M.ghostT=(M.ghostT||0)+dt;
}
/* dispara fila de onda para a cópia (sinergia sermão+espelhos) */
RM.queueMirrorWave=function(ang,sp,dmg){
  try{if(RM.mirror)RM.mirror.waveQ={ang:ang,sp:sp,dmg:dmg*.55,t:.55};}catch(e){}
};
/* ---------- PATO HEREGE ---------- */
function duckFrame(dt){
  game.rm_patoT-=dt;
  if(!RM.duck&&game.rm_patoT<=0){
    game.rm_patoT=rnd(9,15);
    const m=game.absMain,dir=Math.random()<.5?1:-1;
    RM.duck={x:dir>0?m.x-20:m.x+m.w+20,y:clamp(player.y+rnd(-90,90),m.y+40,m.y+m.h-40),vx:dir*rnd(150,210),t:0,bob:rnd(TAUx),hit:false};
    try{blip('sawtooth',640,420,.1,.08);blip('sawtooth',720,470,.1,.08);}catch(e){}
  }
  const d=RM.duck;
  if(d){
    d.t+=dt;d.bob+=dt*9;d.x+=d.vx*dt;d.y+=Math.sin(d.bob)*22*dt;
    const m=game.absMain;
    if(!d.hit){
      for(const e of enemies){
        if(e.dead||e.spawnT<.5)continue;
        if(D(d.x,d.y,e.x,e.y)<e.r+12){
          d.hit=true;x_dmgEnemy(e,5*P.dmgMult,'#ffe9b8');
          rmTxt('QUACK!',e.x,e.y-34,14,'#ffe9b8');
          try{blip('sawtooth',700,500,.09,.09);blip('sine',900,1200,.12,.07);}catch(e){}
          break;
        }
      }
    }
    if(d.x<m.x-60||d.x>m.x+m.w+60)RM.duck=null;
  }
}

/* ================================================================
   PARTE 3 — SINERGIAS
   Propriedades compartilhadas (tags) em vez de pares manuais.
   Níveis: LEVE / FORTE / ESPECIAL (banner próprio + som).
   ================================================================ */
const TAGS={
  /* — bênçãos — */
  rm_olho_sacrista:['secret'],
  rm_halo_quebrado:['slow'],
  rm_ultima_vela:['def','wave'],
  rm_dente_veredito:['mark'],
  rm_chave_purgatorio:['reroll'],
  rm_cinza_inc:['fire','ground'],
  rm_ossos_orbita:['orbit'],
  rm_coracao_emp:['life'],
  rm_estilhaco_refl:['reflect'],
  rm_sino_ausentes:['reward'],
  rm_pena_carbonizada:['speed'],
  rm_turibulo_vazio:['slow','ground'],
  rm_pupila_ruina:['exec'],
  rm_ampulheta:['slow','def'],
  rm_coroa_espinhos:['def','retaliate'],
  rm_rosario_contas:['boss'],
  rm_mascara_test:['charge','dmg'],
  rm_evangelho:['proc'],
  rm_ima_almas:['magnet'],
  rm_frio_abismo:['ice'],
  rm_pena_condenados:['def','shield'],
  rm_relogio_pecado:['rate'],
  rm_coroa_ultimo:['exec'],
  rm_pato_herege:['meme','duck'],
  /* — pactos — */
  rm_credor_almas:['souls'],
  rm_porta_fechada:['reward','risk'],
  rm_segunda_voz:['copy'],
  rm_ultima_cinza:['dmg','fire'],
  rm_contrato_sangue:['dmg','life'],
  rm_dizimo_inferno:['souls','boss'],
  rm_divida_crescente:['dmg'],
  rm_pacto_silencio:['charge','dmg'],
  rm_maos_famintas:['magnet','melee'],
  rm_juros_compostos:['rate','life'],
  rm_favor_mentira:['reward'],
  rm_aposta_carrasco:['dmg','boss'],
  rm_contrato_espelhos:['copy','shoot'],
  rm_altar_invertido:['life','reward'],
  rm_nome_apagado:['stealth'],
  rm_promessa_quebrada:['def','heal'],
  rm_coroa_ganancia:['reward','souls'],
  rm_pacto_enxame:['split','shoot'],
  rm_preco_pressa:['rate','speed'],
  rm_ultima_testemunha:['def'],
  /* — armas — */
  rm_lamento:['pierce','shoot','ice2'],
  rm_rosario_balas:['shoot','ring'],
  rm_espingarda:['shoot','spread'],
  rm_agulha:['pierce','shoot'],
  rm_incensario:['fire','ground','shoot'],
  rm_dente_cerb:['homing','mark','shoot'],
  rm_vela_funeral:['fire','explosion','shoot'],
  rm_sermao:['wave','shoot'],
  rm_espelho_faminto:['bounce','shoot'],
  rm_coroa_balistica:['orbit','shoot'],
  rm_cravo_abismo:['pierce','shoot'],
  rm_liturgia:['split','shoot'],
  rm_mordida_dupla:['shoot','converge'],
  rm_arco_herege:['homing','shoot'],
  rm_calice_vazio:['def','shoot'],
  rm_canhao_excom:['pierce','explosion','shoot']
};
/* tags herdadas de itens antigos (aproveita o que já existe) */
const TAGS_OLD={
  brasa:['fire'],passobrasa:['fire','ground'],silenciog:['ice'],lagrimasaq:['water','slow'],
  solest:['light'],halopartido:['def','light'],centelha:['bolt'],corvazio:['dmg'],
  correntes:['copy'],reflexo:['copy'],nervos:['bolt'],acougueiro:['melee','dmg'],
  barqueiro:['souls'],falsorei:['dmg','boss'],pesocoroa:['dmg'],sanguedegelo:['ice'],
  pulmao:['speed'],ecosino:['reward'],horaroubada:['rate'],testemunha:['dmg'],
  ultimapena:['def'],pactodev:['dmg'],divida:['souls'],pacto404:['meme'],
  fagulha:['explosion','fire']
};
function tagsOf(id){return TAGS[id]||TAGS_OLD[id]||[];}
/* os 15 combos pedidos — nível e efeito */
const SYN_COMBOS=[
 {a:'rm_espelho_faminto',b:'rm_estilhaco_refl',lvl:'especial',n:'O ESPELHO QUE DEVOLVE',
  fx:function(){RM._synRefl=1;}},
 {a:'rm_frio_abismo',b:'rm_lamento',lvl:'forte',n:'GEADA PERFURANTE',
  fx:function(){game._rmSynFrioLam=1;}},
 {a:'rm_pacto_enxame',b:'rm_liturgia',lvl:'forte',n:'ENXAME DE ESTILHAÇOS',
  fx:function(){game._rmSynEnxLit=1;}},
 {a:'rm_preco_pressa',b:'rm_coroa_balistica',lvl:'forte',n:'BALÍSTICA APRESSADA',
  fx:function(){game._rmSynPressOrb=1;}},
 {a:'rm_ultima_vela',b:'rm_contrato_sangue',lvl:'forte',n:'VELA EM CHAMAS',
  fx:function(){game._rmSynVelaSangue=1;}},
 {a:'rm_incensario',b:'rm_cinza_inc',lvl:'forte',n:'FUMAÇA EM BRASA',
  fx:function(){game._rmSynIncCin=1;}},
 {a:'rm_contrato_espelhos',b:'rm_sermao',lvl:'especial',n:'O SERMÃO DUPLADO',
  fx:function(){game._rmSynMirSer=1;}},
 {a:'rm_pupila_ruina',b:'rm_agulha',lvl:'leve',n:'PUPILA FINA',
  fx:function(){}},
 {a:'rm_coracao_emp',b:'rm_promessa_quebrada',lvl:'leve',n:'EMPRÉSTIMO QUEBRADO',
  fx:function(){game._rmSynCoracaoProm=1;}},
 {a:'rm_ossos_orbita',b:'rm_espingarda',lvl:'forte',n:'OSSOS DISPARADOS',
  fx:function(){game._rmSynOssosEsp=1;}},
 {a:'rm_evangelho',b:'rm_mordida_dupla',lvl:'forte',n:'EVANGELHO DUPLADO',
  fx:function(){game._rmSynEvDupla=1;}},
 {a:'rm_dente_veredito',b:'rm_dente_cerb',lvl:'forte',n:'VEREDITO DE TRÊS DENTES',
  fx:function(){game._rmSynVerCerb=1;}},
 {a:'rm_pacto_silencio',b:'rm_mascara_test',lvl:'especial',n:'O SILENCIO ARMADO',
  fx:function(){game._rmSynSilMasc=1;}},
 {a:'rm_chave_purgatorio',b:'rm_favor_mentira',lvl:'leve',n:'CHAVE DA MENTIRA',
  fx:function(){game._rmSynChaveFav=1;}},
 {a:'rm_pato_herege',b:'rm_contrato_espelhos',lvl:'especial',n:'O PATO REFLETIDO (INÚTIL)',
  fx:function(){game._rmSynPatoEsp=1;}}
];
RM._synFound=RM._synFound||{};
function synScan(novo){
  try{
    const tem=function(id){return x_up(id);};
    for(const c of SYN_COMBOS){
      if(RM._synFound[c.n])continue;
      if(tem(c.a)&&tem(c.b)){
        RM._synFound[c.n]=1;
        if(c.fx)c.fx();
        const cores={leve:'#cfe9ff',forte:'#ffd9a0',especial:'#ff2e55'};
        game.banner={type:'circle',txt:'SINERGIA — '+c.lvl.toUpperCase(),name:c.n,
          sub:c.lvl==='especial'?'a combinação tem nome próprio':'as peças se encaixaram',
          t:0,dur:3.2};
        try{
          if(c.lvl==='especial'){blip('sine',392,784,.5,.1);blip('sine',784,1568,.7,.08);noiseSfx(.5,.04,400,'bandpass');}
          else blip('sine',523,880,.4,.08);
        }catch(e){}
        rmSparks(player.x,player.y,cores[c.lvl]||'#ffd9a0',18,260,.8,3);
      }
    }
    /* sinergia ESPECIAL silêncio+máscara: disparo preparado ainda mais forte */
    if(game._rmSynSilMasc&&game.rm_mascara)game.rm_mascBoost=2.2;
  }catch(e){}
}
/* aplica a máscara com sinergia (usada no newShotPass via props.masc) */
const _origMasc=1.8;
/* SINERGIA dente veredito + dente cerb: os 3 dentes contam como marcas extras
   (implementado no hitDmg via _rmSynVerCerb — marcas +1 por dentada) */
/* SINERGIA evangelho + mordida dupla: cada presa ganha propriedade própria */
/* aplicado na criação das presas (rm_part2 lê game._rmSynEvDupla) */
/* SINERGIA coração emprestado + promessa: a vida temporária conta para a
   amortização (as duas flags já conversam naturalmente no hurtDmg) */
RM.synCount=function(){return Object.keys(RM._synFound).length;};
RM.synList=function(){return Object.keys(RM._synFound);};

/* ================================================================
   PARTE 4 — CÉRBERO REMASTER: A SENTENÇA FINAL (fase 3 de bullet hell)
   Gatilho: killHead derruba a 3ª cabeça → RM.cerbDown() assume.
   boss.active=false adormece TODOS os sistemas antigos do boss
   (updateBoss/drawBoss/frameCerberus/drawCerberusFX se auto-guardam).
   No fim, winStart() original roda intacta (diálogo + ALMA NEGRA).
   v1.5.6 — A MORTE DO ANTIGO AGORA É EM DOIS TEMPOS:
   1) o antigo APENAS VIRA PÓ — sem nada: o corpo fica na cena se
      desfazendo (boss.dying faz o fade pelo updateBoss; o pó nasce no
      c3Frame), sem cura, sem aviso, sem música nova;
   2) poucos segundos depois a mensagem VERMELHA entra na tela
      ("oh cão, voce cometeu um grave erro") e a cutscene do REMAKE
      (transform) começa — com a vida de Thor se regenerando sozinha
      enquanto o diálogo da sentença desperta.
   ================================================================ */
RM.c3=null;
RM.cerbDown=function(){
  try{
    if(!game._cerbFight||game._rmSent||RM.c3)return false;
    /* só assume se as 3 cabeças caíram de verdade (luta do portão) */
    const vivas=boss.heads.filter(function(h){return h.alive;}).length;
    if(vivas>0)return false;
    game._rmSent=1;
    /* v1.5.6: o corpo antigo fica em cena se desfazendo — boss.dying faz o
       fade pelo updateBoss (introLock congela a barra/escala: nada mais
       dele se move); os baldes dele somem (o momento é de silêncio) */
    boss.dying=true;boss.introLock=true;boss.barT=0;
    boss.dashing=false;boss.frenzyActive=false;
    bullets=bullets.filter(function(b){return !b.rm;});
    ebullets=[];
    RM.c3={
      ph:'dust',t:0,
      x:boss.x,y:boss.y,hopX:boss.x,hopY:boss.y,hopT:0,
      hp:Math.round((2200+(game.threat||0)*120)*c3hpTier()),
      stage:-1,pat:null,patT:0,patStep:0,vuln:0,vulnMax:0,rest:0,lab:0,
      necks:[
        {i:0,rise:2.6,base:0,a:Math.PI/2,g:0,sp:0,hx:boss.x,hy:boss.y-160,mouth:0},  /* central */
        {i:1,rise:3.1,base:-.85,a:Math.PI/2-.85,g:0,sp:0,hx:boss.x-90,hy:boss.y-130,mouth:0}, /* esquerda */
        {i:2,rise:3.6,base:.85,a:Math.PI/2+.85,g:0,sp:0,hx:boss.x+90,hy:boss.y-130,mouth:0}  /* direita */
      ],
      marks:[],cols:[],ringFx:[],touchCd:0,meleeSeen:0,biteSeen:0,
      invul:true,glow:0,hop:0,
      avisoT:0,avisoDur:3.0,_aviso:0,_gone:0,_healed:0
    };
    RM.c3.maxHp=RM.c3.hp;
    /* v1.4.6: 8 BARRAS também na luta do portão (mesma regra do laboratório) */
    RM.c3.bars=8;RM.c3.barIdx=0;
    RM.c3.barMax=Math.max(140,Math.round(RM.c3.maxHp/8));
    RM.c3.hp=RM.c3.barMax;
    game.banner=null;game.headBanner=null;
    return true;
  }catch(e){return false;}
};
/* v1.4.1 — INVOCAÇÃO DIRETA (laboratório de bosses): A SENTENÇA FINAL sem
   passar pela luta das cabeças. Mesma construção de cerbDown, mas a forma
   antiga já entra vencida (cabeças caem em silêncio) e a transformação
   começa de imediato: silhueta derrete → 3 pescoços → bullet hell. */
RM.startSentenca=function(x,y){
  try{
    if(RM.c3||game._rmSent)return false;
    x=(typeof x==='number')?x:W*.5;y=(typeof y==='number')?y:H*.42;
    game._cerbFight=1;game._rmSent=1;
    boss.active=false;boss.dashing=false;boss.frenzyActive=false;
    try{for(const h of boss.heads){h.alive=false;h.hp=0;h.state='dead';}}catch(e){}
    bullets=bullets.filter(function(b){return !b.rm;});
    /* v1.4.3: invocar a sentença também cura Thor — teste começa justo */
    try{
      player.hp=player.maxHp;
      sparks(player.x,player.y,'#ffd9a0',20,250,.8,3,true);
      texts.push({x:player.x,y:player.y-56,txt:'VIDA RESTAURADA',t:0,life:2,c:'#ffd9a0',size:12,disp:true});
      sfx.heart();
    }catch(e){}
    RM.c3={
      ph:'transform',t:0,
      x:x,y:y,hopX:x,hopY:y,hopT:0,hop:0,
      hp:Math.round((2200+(game.threat||0)*120)*c3hpTier()),
      stage:-1,pat:null,patT:0,patStep:0,patData:{},patShown:{},
      vuln:0,vulnMax:0,rest:0,lab:1,
      necks:[
        {i:0,rise:2.6,base:0,a:Math.PI/2,g:0,sp:0,hx:x,hy:y-160,mouth:0,tele:0},   /* central */
        {i:1,rise:3.1,base:-.85,a:Math.PI/2-.85,g:0,sp:0,hx:x-90,hy:y-130,mouth:0,tele:0}, /* esquerda */
        {i:2,rise:3.6,base:.85,a:Math.PI/2+.85,g:0,sp:0,hx:x+90,hy:y-130,mouth:0,tele:0}   /* direita */
      ],
      marks:[],cols:[],ringFx:[],touchCd:0,meleeSeen:0,biteSeen:0,
      invul:true,glow:0,lastPat:null
    };
    RM.c3.maxHp=RM.c3.hp;
    /* v1.4.6: 8 BARRAS — a vida total vira 8 barras (uma por spell card) */
    RM.c3.bars=8;RM.c3.barIdx=0;
    RM.c3.barMax=Math.max(140,Math.round(RM.c3.maxHp/8));
    RM.c3.hp=RM.c3.barMax;
    try{
      window.__MUSIC_ZONE='sentenca0';
      noiseSfx(2.4,.09,60,'lowpass');blip('sine',55,28,2.6,.15);
      sfx.echo();
    }catch(e){}
    game.banner=null;game.headBanner=null;
    return true;
  }catch(e){return false;}
};
/* v1.4.6: a ETAPA agora vem da BARRA (1-2 despertar · 3-4 perseguição ·
   5-6 três sentenças · 7-8 vermelho absoluto) */
function c3Stage(){
  const c=RM.c3;if(!c)return 0;
  return Math.min(3,Math.floor((c.barIdx||0)/2));
}
const STAGE_NAMES=['DESPERTAR','PERSEGUIÇÃO','TRÊS SENTENÇAS','VERMELHO ABSOLUTO'];
/* ---- disparo carmesim legível ---- */
function c3Shoot(x,y,ang,spd,opts){
  opts=opts||{};
  if(ebullets.length>500)return; /* v1.4.5 ESPEC §6.5: limite 320→500 */
  ebullets.push({x:x,y:y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,
    r:opts.r||6,c:opts.c||'#ff2e55',dmg:opts.dmg||12,rm:1,life:opts.life||9,
    rmSplit:opts.split||0,rmT:0});
}
function c3Gap(n,gapN,gapW,off){
  /* ângulos com lacunas — devolve lista de ângulos */
  const out=[];
  for(let k=0;k<n;k++){
    const a=off+k/n*TAUx;
    let gap=false;
    for(let g=0;g<gapN;g++){const ga=off+((g*2+1)/(gapN*2))*TAUx;if(Math.abs(angN(a-ga))<gapW)gap=true;}
    if(!gap)out.push(a);
  }
  return out;
}
function c3NeckFire(nk,spd,opts){
  c3Shoot(nk.hx,nk.hy,nk.a+angN(nk.aim||0),spd,opts);
}
/* ---- padrões (cada um com preparação, duração e rota de esquiva) ---- */
/* v1.4.4: os 8 padrões viraram SPELL CARDS — nome completo de danmaku, ritual
   de ativação (pausa + pontos carmesins + sino distante) e placa fixa no canto
   superior direito enquanto o ataque acontece. */
const SPELL_NAMES={
  rosario:'Cão Branco 「Rosário dos Trinta e Três Dentes」',
  cruz:'Cão Branco 「Cruz da Matilha」',
  espiral:'Cão Branco 「Espiral da Serpente」',
  cacada:'Cão Branco 「Caçada Sem Rastro」',
  eclipse:'Cão Branco 「Eclipse Carmesim」',
  chuva:'Cão Branco 「Chuva do Último Círculo」',
  sentencas:'Cão Branco 「Três Sentenças」',
  vermelho:'Cão Branco 「Vermelho Absoluto」'
};
/* v1.4.5 ESPEC §4.2: duração máxima individual de cada spell card (§7-§14);
   estourou o tempo, a card encerra e avança — sem dano em Thor, sem penalidade. */
const SPELL_DUR={rosario:18,cruz:18,espiral:20,cacada:18,eclipse:20,chuva:18,sentencas:20,vermelho:24};
/* v1.4.6: AS 8 BARRAS — cada barra de vida É uma spell card, nesta ordem (a do
   txt): esvaziou a barra, a card quebra, pausa curtíssima (≤2s) e a próxima
   card começa com a barra cheia. A oitava barra (VERMELHO ABSOLUTO) é a última:
   zerou, a sentença morre. */
const SPELL_ORDER=['rosario','cruz','espiral','cacada','eclipse','chuva','sentencas','vermelho'];
function patStart(id){
  const c=RM.c3,T=rmTier();
  c.pat=id;c.patT=0;c.patStep=0;c.patData={};
  const nomes=SPELL_NAMES;
  c.patName=nomes[id];
  /* v1.4.5 ESPEC §16: a duração máxima cai com a dificuldade (19/18/17/16s) */
  c.patMax=(SPELL_DUR[id]||18)*T.durM;
  if(!c.patShown)c.patShown={};
  if(!c.patShown[id])c.patShown[id]=1;
  /* v1.4.4: RITUAL DA SPELL CARD — interrupção breve do disparo anterior.
     O nome é revelado no canto superior direito, pontos carmesins acendem no
     ar, os pescoços se erguem — e só então o ataque começa. */
  c.cast=.55;c.spell={name:nomes[id]||id,t:0};
  for(const nk of c.necks)nk.tele=Math.max(nk.tele||0,.55);
  for(let i=0;i<12;i++)particles.push({x:c.x+rnd(-70,70),y:c.y-rnd(20,150),vx:rnd(-14,14),vy:rnd(-46,-14),life:rnd(.5,1.1),t:0,r:rnd(1.2,2.6),c:i%3?'#ff2e55':'#ff8fa0',drag:.97,glow:true});
  /* sino distante + cue sonoro por categoria */
  try{
    blip('square',1480,960,.18,.05);blip('sine',2240,1780,.34,.035,.03);
    if(id==='rosario'||id==='cruz')blip('square',1250,1850,.09,.05);
    if(id==='espiral')blip('sawtooth',260,880,.55,.05);
    if(id==='chuva'){blip('sine',95,38,.5,.13);noiseSfx(.4,.07,120,'lowpass');}
    if(id==='cacada')blip('triangle',300,520,.3,.06);
    if(id==='eclipse')blip('sine',400,120,.8,.07);
    if(id==='vermelho'){sfx.roar();blip('square',180,640,.6,.09);}
    if(id==='sentencas')blip('square',900,1400,.12,.05);
  }catch(e){}
}
function patFrame(dt){
  const c=RM.c3,T=rmTier(),cx=T.cx;
  /* v1.4.5 ESPEC §4.2: tempo máximo da spell card — estourou, encerra e avança */
  if(c.patT>=(c.patMax||999)){patEnd();return;}
  c.patT+=dt;
  const iv=T.int; /* intervalo entre salvas (multiplicador) */
  const spd=T.spd;
  const P0=c.patData;
  switch(c.pat){
  case 'rosario':{
    /* v1.4.5 ESPEC §7 COMPLETO — SEM PIEDADE:
       A = 3 salvas (4ª em cx>=1) de anéis TRIPLOS (central rápido · secundário
           médio · externo lento), lacunas alternando em sequência determinística;
       B = dentes laterais persistentes: arcos da esquerda + linhas diagonais
           pequenas e mais rápidas da direita;
       C = fechamento: 3 anéis a .78s com divisão ±18° nos anéis finais. */
    const den=1+cx*.06;
    /* EVENTO A — anéis triplos com lacunas que alternam (determinístico) */
    const salvas=[0,1.2*iv,2.4*iv];
    if(cx>=1)salvas.push(3.6*iv);
    for(let s=0;s<salvas.length;s++){
      if(c.patT>=salvas[s]&&!P0['s'+s]){
        P0['s'+s]=1;
        const gapOff=s*1.9+Math.floor(s/2)*.8;
        /* anel central RÁPIDO */
        const ring1=c3Gap(Math.round(16*den),2,.5,gapOff);
        for(const a of ring1)c3Shoot(c.x,c.y-60,a,205*spd,{});
        /* anel secundário MÉDIO — lacuna em outro lugar */
        const ring2=c3Gap(Math.round(22*den),2,.55,gapOff+2.1);
        for(const a of ring2)c3Shoot(c.x,c.y-60,a,165*spd,{c:'#ff8fa0'});
        /* anel externo LENTO */
        const ring3=c3Gap(Math.round(28*den),3,.5,gapOff+4.2);
        for(const a of ring3)c3Shoot(c.x,c.y-60,a,120*spd,{r:5,c:'#ff5a78'});
        try{blip('square',1100,1700,.08,.045);}catch(e){}
      }
    }
    /* EVENTO B — dentes laterais (1.4s→6.4s) */
    if(c.patT>=1.4&&c.patT<6.4){
      P0.bAcc=(P0.bAcc||0)+dt;
      /* cabeça esquerda: ARCO de projéteis médios a cada .85*iv */
      if(P0.bAcc>=.85*iv){P0.bAcc=0;
        const esq=c.necks[1];
        const a0=Math.atan2(player.y-esq.hy,player.x-esq.hx);
        for(let k=-3;k<=3;k++)c3Shoot(esq.hx,esq.hy,a0+k*.17,175*spd,{c:'#ff8fa0'});
        esq.g=.5;
        try{blip('square',1250,1750,.08,.04);}catch(e){}
      }
      /* cabeça direita: LINHAS DIAGONAIS pequenas, intervalo menor (spec) */
      P0.dAcc=(P0.dAcc||0)+dt;
      if(P0.dAcc>=.48*iv){P0.dAcc=0;
        const dir=c.necks[2];
        P0.dFlip=!P0.dFlip;
        const base=P0.dFlip?Math.PI*.78:Math.PI*.22;
        for(let k=0;k<5;k++)c3Shoot(dir.hx,dir.hy,base+(k-2)*.06,235*spd,{r:4,c:'#ff5a78'});
        dir.g=.4;
        try{blip('square',1500,2100,.06,.035);}catch(e){}
      }
    }
    /* EVENTO C — fechamento do rosário: 3 anéis a .78*iv, divisão nos finais */
    for(let s=0;s<3;s++){
      if(c.patT>=6.6+s*.78*iv&&!P0['c'+s]){
        P0['c'+s]=1;
        const ring=c3Gap(Math.round(26*den),2,.52,1.1+s*1.7);
        for(const a of ring)c3Shoot(c.x,c.y-60,a,150*spd,{split:s===2?1:0,r:5,c:'#ff2e55'});
        try{blip('square',1000,1500,.09,.05);}catch(e){}
      }
    }
    if(c.patT>=6.6+2*.78*iv+2.2)patEnd();
    break;}
  case 'cruz':{
    /* v1.4.5 ESPEC §8 COMPLETO — SEM PIEDADE:
       A = leque central de 13 a ~70°, rápido, ângulo oscilando por salva;
       B = cruz diagonal: 11 por salva lateral a ~90°, cabeças defasadas .55s,
           a 2ª execução INVERTE a ordem;
       C = cruz quebrada: leque central estreito + dois laterais largos, com a
           abertura migrando para perto do centro (3 combinações). */
    const den=1+cx*.05;
    /* EVENTO A — leque central */
    const salvas=[0,.9*iv,1.8*iv];
    if(cx>=1)salvas.push(2.7*iv);
    for(let s=0;s<salvas.length;s++){
      if(c.patT>=salvas[s]&&!P0['s'+s]){
        P0['s'+s]=1;
        const ap=Math.atan2(player.y-c.y,player.x-c.x);
        const base=ap+(s===1?.3:s===2?-.2:0); /* pequena alteração por salva */
        const central=c.necks[0];
        central.aim=0;
        const nF=Math.round(13*den)+(cx>=2?2:0);
        const sp=.102; /* ~70° de abertura total */
        for(let k=0;k<nF;k++)c3Shoot(central.hx,central.hy,base-(nF-1)/2*sp+k*sp,225*spd,{});
        central.g=.5;
        try{blip('square',1300,1900,.09,.05);}catch(e){}
      }
    }
    /* EVENTO B — cruz diagonal (esq→dir, depois dir→esq: inverte) — v1.4.6:
       as TRÊS CABEÇAS atiram o leque de ~90° AO MESMO TEMPO */
    const eb=[1.1*iv,1.65*iv,2.75*iv,3.3*iv];
    const ebWho=[1,2,2,1];
    for(let s=0;s<4;s++){
      if(c.patT>=eb[s]&&!P0['e'+s]){
        P0['e'+s]=1;
        const nk=c.necks[ebWho[s]];
        /* leque esquerdo mira baixo-direita; direito mira baixo-esquerda */
        const tx=player.x+(ebWho[s]===1?70:-70),ty=player.y+110;
        const a0=Math.atan2(ty-nk.hy,tx-nk.hx);
        const nS=Math.round(11*den),spread=1.57; /* ~90° */
        for(let k=0;k<nS;k++)c3Shoot(nk.hx,nk.hy,a0-spread/2+k*(spread/(nS-1)),195*spd,{c:'#ff8fa0'});
        /* as outras duas cabeças respondem JUNTAS (leques espelhados em Thor) */
        for(const other of c.necks){
          if(other===nk)continue;
          const ob=Math.atan2(player.y-other.hy,player.x-other.hx);
          for(let k=0;k<Math.round(7*den);k++)c3Shoot(other.hx,other.hy,ob-.45+k*(.9/Math.max(1,Math.round(7*den)-1)),185*spd,{c:'#ff5a78'});
          other.g=.5;
        }
        nk.g=.5;
        try{blip('square',1250,1850,.09,.05);}catch(e){}
      }
    }
    /* EVENTO C — cruz quebrada: 3 combinações, abertura migra para o centro */
    const combos=[4.2*iv,5.15*iv,6.1*iv];
    for(let s=0;s<3;s++){
      if(c.patT>=combos[s]&&!P0['q'+s]){
        P0['q'+s]=1;
        const ap=Math.atan2(player.y-c.y,player.x-c.x);
        const dOff=.85-s*.3; /* abertura lateral → perto do centro */
        const central=c.necks[0];
        for(let k=-3;k<=3;k++)c3Shoot(central.hx,central.hy,ap+k*.11,235*spd,{});
        for(const pair of [[1,1],[2,-1]]){
          const nk=c.necks[pair[0]];
          const a0=ap+pair[1]*dOff;
          for(let k=0;k<13;k++)c3Shoot(nk.hx,nk.hy,a0-.78+k*.13,185*spd,{c:'#ff8fa0'});
        }
        c.necks[1].g=c.necks[2].g=.5;
        try{blip('square',1200,1800,.1,.05);}catch(e){}
      }
    }
    if(c.patT>=6.1*iv+1.9)patEnd();
    break;}
  case 'espiral':{
    /* v1.4.5 ESPEC §9 COMPLETO — SEM PIEDADE:
       A = 3 correntes independentes a ~.10s por 2,4s (rotações em sentidos
           opostos, ~11° por disparo);
       B = serpente dupla 2×: a central pausa e cospe 3 rápidos direcionados;
       C = nó carmesim: as correntes recomeçam cruzando o centro, rajada central
           e espiral final que se divide em duas correntes (sem recursão). */
    if(!P0.t0){P0.t0=1;P0.a0=[0,rnd(TAUx),rnd(TAUx)];P0.dirs=[1,-1,cx>=1?-1:1];}
    const cad=.105*iv;
    /* EVENTO A — correntes independentes */
    if(c.patT>=.7&&c.patT<3.1){
      P0.acc=(P0.acc||0)+dt;
      if(P0.acc>=cad){
        P0.acc=0;
        for(let k=0;k<3;k++){
          const nk=c.necks[k];
          P0.a0[k]+=P0.dirs[k]*(.2+cx*.02);
          c3Shoot(nk.hx,nk.hy,P0.a0[k],(k===1?140:175)*spd,{r:k===2?4:6,c:k===2?'#ff5a78':'#ff2e55'});
        }
      }
    }
    /* EVENTO B — serpente dupla: a central pausa e responde 3 rápidos (2×) */
    const bT=[3.3,5.2];
    for(let s=0;s<2;s++){
      if(c.patT>=bT[s]&&!P0['b'+s]){P0['b'+s]=1;P0.bN=3;P0.bT=.42;P0.bA=Math.atan2(player.y-c.y,player.x-c.x);}
    }
    if(P0.bN>0){P0.bT-=dt;
      if(P0.bT<=0){P0.bT=.16;P0.bN--;
        c3Shoot(c.necks[0].hx,c.necks[0].hy,P0.bA+(P0.bN-1)*.12,320*spd,{});
        try{blip('square',1400,2000,.07,.04);}catch(e){}
      }
    }
    /* EVENTO C — nó carmesim: correntes cruzando o centro (5.4→7.2s) */
    if(c.patT>=5.4&&c.patT<7.2){
      P0.cAcc=(P0.cAcc||0)+dt;
      if(P0.cAcc>=cad){
        P0.cAcc=0;
        for(let k=0;k<3;k++){
          const nk=c.necks[k];
          P0.a0[k]+=P0.dirs[k]*.24;
          const aC=Math.atan2(H/2-nk.hy,W/2-nk.hx);
          c3Shoot(nk.hx,nk.hy,aC+Math.sin(P0.a0[k])*.5,160*spd,{});
        }
      }
    }
    if(c.patT>=7.4&&!P0.burst2){P0.burst2=1;P0.bN=3;P0.bT=0;P0.bA=Math.atan2(player.y-c.y,player.x-c.x);}
    /* espiral final (8→10s) que se divide em duas correntes menores */
    if(c.patT>=8&&c.patT<10){
      P0.fAcc=(P0.fAcc||0)+dt;
      if(P0.fAcc>=cad){
        P0.fAcc=0;P0.fA=(P0.fA||0)+.26;
        c3Shoot(c.x,c.y-60,P0.fA,150*spd,{split:1,c:'#ff8fa0'});
        c3Shoot(c.x,c.y-60,P0.fA+Math.PI,150*spd,{split:1,c:'#ff8fa0'});
      }
    }
    if(c.patT>=10.6)patEnd();
    break;}
  case 'cacada':{
    /* v1.4.5 ESPEC §10 COMPLETO — SEM PIEDADE:
       A = 6 salvas de 3 direcionadas ao HISTÓRICO de posições (atual · -0,25s ·
           -0,5s), a .55s;
       B = pinça 3×: a esquerda atira para onde você ESTEVE (0,5s), a direita
           para onde você ESTÁ, a central entre as duas;
       C = 3 marcas telegrafadas de 0,45s — a do meio DESAPARECE sem disparar
           (ordem determinística) + pinça curta final. */
    const hist=function(ago){
      const want=c.t-ago;let best={x:player.x,y:player.y};
      const H2=c.hist||[];
      for(let i=0;i<H2.length;i++){if(H2[i].t<=want)best=H2[i];else break;}
      return best;
    };
    /* EVENTO A — disparo atrasado (6 salvas) — v1.4.6: TODAS AS CABEÇAS ao
       mesmo tempo (cada uma mira o histórico pela própria posição) */
    for(let s=0;s<6;s++){
      if(c.patT>=s*.55*iv&&!P0['a'+s]){
        P0['a'+s]=1;
        const alvo=hist(s%3===0?0:s%3===1?.25:.5);
        for(const nk of c.necks){
          const a=Math.atan2(alvo.y-nk.hy,alvo.x-nk.hx);
          for(let k=-1;k<=1;k++)c3Shoot(nk.hx,nk.hy,a+k*.09,310*spd,{});
          nk.g=.5;
        }
        try{blip('triangle',300,520,.3,.06);}catch(e){}
      }
    }
    /* EVENTO B — pinça (3 repetições: esq no passado, centro ENTRE as duas, dir no presente) */
    for(let r=0;r<3;r++){
      const t0=3.6*iv+r*1.5*iv;
      const pin=[{t:t0,w:1,ago:.5},{t:t0+.15*iv,w:0,ago:.25},{t:t0+.3*iv,w:2,ago:0}];
      for(let s=0;s<3;s++){
        if(c.patT>=pin[s].t&&!P0['p'+r+'_'+s]){
          P0['p'+r+'_'+s]=1;
          const alvo=hist(pin[s].ago);
          const nk=c.necks[pin[s].w];
          const a=Math.atan2(alvo.y-nk.hy,alvo.x-nk.hx);
          for(let k=-1;k<=1;k++)c3Shoot(nk.hx,nk.hy,a+k*.1,290*spd,{});
          nk.g=.6;
        }
      }
    }
    /* EVENTO C — marcas de perseguição (a 2ª falha — determinístico) */
    const marcas=[8.2*iv,8.9*iv,9.6*iv];
    if(cx>=1)marcas.push(10.3*iv);
    for(let s=0;s<marcas.length;s++){
      if(c.patT>=marcas[s]&&!P0['m'+s]){
        P0['m'+s]=1;
        c.marks.push({x:player.x,y:player.y,t:1.15,max:1.15,burst:0,fail:s===1,old:cx>=2&&s===0});
        try{blip('triangle',300,520,.3,.06);}catch(e){}
      }
    }
    for(const m of c.marks){
      m.t-=dt;
      if(m.t<=0&&!m.burst){
        m.burst=1;
        if(m.fail)continue; /* a marca do meio some sem disparar (spec §10) */
        const central=c.necks[0];
        const a=Math.atan2(m.y-central.hy,m.x-central.hx);
        const spread=cx>=2?2:1;
        for(let k=-spread;k<=spread;k++)c3Shoot(central.hx,central.hy,a+k*.1,300*spd,{});
        central.g=.6;
        shockwaves.push({x:m.x,y:m.y,r:8,vr:420,maxR:70,t:0,dur:.35,c:'#ff2e55'});
        try{blip('sine',700,220,.2,.09);}catch(e){}
      }
    }
    c.marks=c.marks.filter(function(m){return m.t>-.6;});
    if(c.patT>=marcas[marcas.length-1]+2.4)patEnd();
    break;}
  case 'eclipse':{
    /* v1.4.5 ESPEC §11 COMPLETO — SEM PIEDADE:
       A = sombra orbital: 3 anéis (28/36/44 posições) a .70s, aberturas
           alternando em SENTIDOS OPOSTOS (determinístico), velocidades distintas;
       B = lua partida: arcos das duas laterais + 8 pequenos rápidos do centro,
           2 combinações com ângulos alterados;
       C = dispersão: os externos dividem em ±18° na borda (mecânica global);
       D = eclipse total: 2 conjuntos de arcos + anel final RÁPIDO de abertura
           pequena — atravessar pelas aberturas em movimento. */
    if(!P0.t0){P0.t0=1;c.eclipseV=1;}
    const den=1+cx*.05;
    /* EVENTO A — sombra orbital */
    const ondas=[{t:.4,sp:135,n:28,gap:.55,dir:1},{t:1.1*iv,sp:185,n:36,gap:.5,dir:-1},{t:1.8*iv,sp:235,n:44,gap:.45,dir:1}];
    if(cx>=1)ondas.push({t:2.5*iv,sp:290,n:36,gap:.5,dir:-1});
    for(let s=0;s<ondas.length;s++){
      if(c.patT>=ondas[s].t&&!P0['o'+s]){
        P0['o'+s]=1;
        /* aberturas alternam em sentidos opostos — sem aleatório */
        const off=(s%2?1:-1)*(1.2+s*1.1);
        const angs=c3Gap(Math.round(ondas[s].n*Math.min(den,1.2)),2,ondas[s].gap,off);
        for(const a of angs)c3Shoot(c.x,c.y-70,a,ondas[s].sp*spd,{split:s>=1?1:0,c:s>=2?'#ff5a78':'#ff2e55'});
        try{blip('sine',420,140,.5,.08);}catch(e){}
      }
    }
    /* EVENTO B — lua partida (2 combinações) */
    const lb=[3.2*iv,4.6*iv];
    for(let s=0;s<2;s++){
      if(c.patT>=lb[s]&&!P0['l'+s]){
        P0['l'+s]=1;
        const flip=s%2===1;
        for(const pair of [[1,1],[2,-1]]){
          const nk=c.necks[pair[0]];
          const sgn=flip?-pair[1]:pair[1];
          const a0=Math.atan2(player.y-nk.hy,player.x-nk.hx)+sgn*.5;
          /* arco em sequência de ângulos (trajetória em leque varrendo) */
          for(let k=0;k<9;k++)c3Shoot(nk.hx,nk.hy,a0+sgn*k*.13,(150+k*10)*spd,{c:'#ff8fa0',r:5});
        }
        const nk0=c.necks[0];
        const a8=Math.atan2(player.y-nk0.hy,player.x-nk0.hx);
        for(let k=0;k<8;k++)c3Shoot(nk0.hx,nk0.hy,a8-.42+k*.12,265*spd,{r:4,c:'#ff5a78'});
        try{blip('square',900,1400,.12,.05);}catch(e){}
      }
    }
    /* EVENTO D — eclipse total */
    const fin=[6.2*iv,7.1*iv];
    for(let s=0;s<2;s++){
      if(c.patT>=fin[s]&&!P0['f'+s]){
        P0['f'+s]=1;
        /* v1.4.6: eclipse total — as TRÊS CABEÇAS ao mesmo tempo (as laterais
           em arcos espelhados + a central com um leque rápido) */
        for(const pair of [[1,-1],[2,1]]){
          const nk=c.necks[pair[0]];
          const a0=Math.atan2(player.y-nk.hy,player.x-nk.hx)+pair[1]*.7;
          for(let k=0;k<7;k++)c3Shoot(nk.hx,nk.hy,a0+pair[1]*k*.15,(170+k*12)*spd,{c:'#ff8fa0',r:5});
          nk.g=.5;
        }
        const cN=c.necks[0];
        const aC2=Math.atan2(player.y-cN.hy,player.x-cN.hx);
        for(let k=-2;k<=2;k++)c3Shoot(cN.hx,cN.hy,aC2+k*.11,300*spd,{r:4,c:'#ff5a78'});
        cN.g=.5;
      }
    }
    if(c.patT>=8.2*iv&&!P0.z){P0.z=1;
      /* anel de abertura pequena e velocidade superior às anteriores */
      const angs=c3Gap(Math.round(30*den),2,.34,rnd(TAUx));
      for(const a of angs)c3Shoot(c.x,c.y-70,a,340*spd,{c:'#ff2e55'});
      try{sfx.roar();}catch(e){}
    }
    if(c.patT>=8.2*iv+2.6){c.eclipseV=0;patEnd();}
    break;}
  case 'chuva':{
    /* v1.4.5 ESPEC §12 COMPLETO — SEM PIEDADE:
       A = 8 posições possíveis, 6 chovem por salva, 2 corredores que MIGRAM a
           cada salva (3 salvas por ciclo, 3 ciclos, a .78s);
       B = deslocamento lateral: 3 salvas horizontais de 10 da esquerda, altura
           mudando a cada uma, enquanto a chuva continua;
       C = impacto central: o chefe salta ao centro, onda circular com
           aberturas + duas colunas laterais LENTAS fechando;
       D = última chuva: 3 salvas diagonais escalonadas em velocidades distintas. */
    if(!P0.t0){
      P0.t0=1;
      game.shake=16;try{blip('sine',120,40,.4,.14);noiseSfx(.35,.08,90,'lowpass');}catch(e){}
      c.hopX=W*.5+(Math.random()<.5?-1:1)*W*.3;c.hopY=H*.5;c.x=c.hopX;c.y=c.hopY;
    }
    /* EVENTO A — chuva em salvas: 6 das 8 posições, corredores migrando */
    for(let cyc=0;cyc<3;cyc++){
      for(let sv=0;sv<3;sv++){
        const t0=cyc*2.6*iv+sv*.78*iv;
        if(c.patT>=t0&&!P0['s'+cyc+'_'+sv]){
          P0['s'+cyc+'_'+sv]=1;
          /* os corredores livres mudam de lugar a cada salva (determinístico);
             nas altas dificuldades sobra UM corredor só */
          const l1=(cyc*2+sv)%8,l2=(cyc*2+sv+3)%8;
          const nlv=cx>=2?1:2;
          for(let i=0;i<8;i++){
            if(i===l1||(nlv===2&&i===l2))continue;
            const x=60+(i+.5)*((W-120)/8);
            const big=(i+sv+cyc)%3===0;
            c3Shoot(x,-12,Math.PI/2,(big?230:300)*spd,{r:big?8:5,c:big?'#ff2e55':'#ff5a78'});
          }
          try{blip('sine',140,60,.16,.06);}catch(e){}
        }
      }
    }
    /* EVENTO B — deslocamento lateral (3 salvas horizontais, altura muda) */
    const lat=[2.2*iv,3.1*iv,4.0*iv];
    for(let s=0;s<3;s++){
      if(c.patT>=lat[s]&&!P0['l'+s]){
        P0['l'+s]=1;
        /* v1.4.6: a chuva lateral vem das TRÊS CABEÇAS ao mesmo tempo —
           leques espelhados + a central cravando uma linha em Thor */
        const esq=c.necks[1];
        const ty=H*(.4+s*.12); /* altura gradualmente diferente */
        const a0=Math.atan2(ty-esq.hy,W*.2-esq.hx);
        for(let k=0;k<10;k++)c3Shoot(esq.hx,esq.hy,a0+(k-4.5)*.05,205*spd,{c:'#ff8fa0'});
        const dirH=c.necks[2];
        const a0d2=Math.atan2(ty-dirH.hy,(W*.8)-dirH.hx);
        for(let k=0;k<10;k++)c3Shoot(dirH.hx,dirH.hy,a0d2-(k-4.5)*.05,205*spd,{c:'#ff8fa0'});
        const cenH=c.necks[0];
        const a0c=Math.atan2(player.y-cenH.hy,player.x-cenH.hx);
        for(let k=-1;k<=1;k++)c3Shoot(cenH.hx,cenH.hy,a0c+k*.07,240*spd,{});
        esq.g=dirH.g=cenH.g=.5;
        try{blip('square',1100,1600,.1,.05);}catch(e){}
      }
    }
    /* EVENTO C — impacto central (5.2s): salto → onda + colunas fechando */
    if(c.patT>=5.2&&!P0.imp){P0.imp=1;c.hopX=W*.5;c.hopY=H*.52;c.x=c.hopX;c.y=c.hopY;c.hop=.5;}
    if(c.patT>=5.9&&!P0.imp2){
      P0.imp2=1;
      shockwaves.push({x:c.x,y:c.y+40,r:10,vr:520,maxR:130,t:0,dur:.4,c:'#ff2e55'});
      const angs=c3Gap(26,2,.5,rnd(TAUx));
      for(const a of angs)c3Shoot(c.x,c.y-40,a,190*spd,{});
      /* duas colunas laterais que se aproximam lentamente do centro */
      c3Shoot(30,H*.5,0,120*spd,{r:9,c:'#ff2e55'});
      c3Shoot(W-30,H*.5,Math.PI,120*spd,{r:9,c:'#ff2e55'});
      try{blip('sine',95,38,.5,.13);noiseSfx(.4,.07,120,'lowpass');}catch(e){}
    }
    /* EVENTO D — última chuva: 3 salvas diagonais escalonadas */
    const diag=[7.4,8.0,8.6];
    const dAng=[-.62,-Math.PI/2,-2.5];
    for(let s=0;s<3;s++){
      if(c.patT>=diag[s]&&!P0['d'+s]){
        P0['d'+s]=1;
        for(let k=0;k<9;k++)c3Shoot(60+k*((W-120)/8),-14,dAng[s]+(k-4)*.07,(240+s*30)*spd,{r:5,c:'#ff5a78'});
        try{blip('square',900,1400,.1,.05);}catch(e){}
      }
    }
    if(c.patT>=9.4){c.cols=[];patEnd();}
    break;}
  case 'sentencas':{
    /* v1.4.5 ESPEC §13 COMPLETO — SEM PIEDADE:
       A = sentença central: 5 rajadas de 3 a .40s, rápidas, ângulo mudando;
       B = sentença esquerda: 3 leques de 17 a ~80°, a .80s, cada um seguido de
           rajada central de 3;
       C = sentença direita: espiral de 2,50s;
       D = a sequência alterna as três cabeças (+ extras em cx);
       E = veredito: 3 grupos em velocidades diferentes + salva central final. */
    if(!P0.t0){P0.t0=1;P0.seq=['centro','esq','dir','esq','centro','dir'];}
    const dur=1.5*iv;
    const seq=P0.seq;
    for(let s=0;s<seq.length;s++){
      if(c.patT>=s*dur&&!P0['x'+s]){
        P0['x'+s]=1;P0.cur=s;
        const which=seq[s];
        if(which==='centro'){
          const nk=c.necks[0];nk.g=1;nk.tele=.55;
          P0.bursts=5;P0.bT=0; /* spec: 5 rajadas de 3 a .40s */
        }else if(which==='esq'){
          const nk=c.necks[1];nk.g=1;nk.tele=.55;
          P0.fans=3;P0.fT=0; /* spec: 3 leques de 17 a .80s */
        }else{
          const nk=c.necks[2];nk.g=1;nk.tele=.55;
          P0.spT=2.5; /* spec: espiral de 2,50s */
        }
        try{blip('square',900,1400,.12,.05);}catch(e){}
      }
    }
    /* rajadas — 5 salvas de 3, .40s — v1.4.6: TODAS AS CABEÇAS AO MESMO TEMPO */
    if(P0.bursts>0){P0.bT-=dt;
      if(P0.bT<=0){P0.bT=.4;P0.bursts--;
        const j=(P0.bJ=(P0.bJ||0)+1)*.06;
        for(const nk of c.necks){
          const a=Math.atan2(player.y-nk.hy,player.x-nk.hx);
          for(let k=0;k<3;k++)c3Shoot(nk.hx,nk.hy,a+(k-1)*.13+j,310*spd,{});
          nk.g=.6;
        }
        try{blip('square',1400,2000,.07,.04);}catch(e){}
      }}
    /* leques — 17 projéteis a ~80°, .80s — v1.4.6: AS TRÊS CABEÇAS JUNTAS,
       cada uma com seu leque espelhado, e a resposta central de 3 */
    if(P0.fans>0){P0.fT-=dt;
      if(P0.fT<=0){P0.fT=.8;P0.fans--;
        const nF=Math.round(17*(1+cx*.04));
        for(const nk of c.necks){
          const a=Math.atan2(player.y-nk.hy,player.x-nk.hx);
          for(let k=0;k<nF;k++)c3Shoot(nk.hx,nk.hy,a-.7+k*(1.4/(nF-1)),185*spd,{c:'#ff8fa0'});
          nk.g=.6;
        }
        /* após cada leque, a resposta de 3 */
        P0.afterB=3;P0.afterT=.25;
        try{blip('square',1100,1600,.1,.05);}catch(e){}
      }
    }
    if(P0.afterB>0){P0.afterT-=dt;
      if(P0.afterT<=0){P0.afterT=.18;P0.afterB--;
        const nk=c.necks[0],a=Math.atan2(player.y-nk.hy,player.x-nk.hx);
        for(let k=0;k<3;k++)c3Shoot(nk.hx,nk.hy,a+(k-1)*.12,300*spd,{});
      }}
    /* espiral persistente — v1.4.6: AS TRÊS CABEÇAS ESPIRALAM JUNTAS
       (fases defasadas, sentidos alternados) */
    if(P0.spT>0){P0.spT-=dt;P0.spA=(P0.spA||0)+dt*4.6;
      P0.spAcc=(P0.spAcc||0)+dt;
      if(P0.spAcc>=(cx>=1?.115:.13)){P0.spAcc=0;
        for(let i=0;i<3;i++){
          const nk=c.necks[i];
          c3Shoot(nk.hx,nk.hy,P0.spA+i*(Math.PI*2/3)+(i===1?-1:1)*.4,155*spd,{c:i===2?'#ff5a78':'#ff2e55'});
          nk.g=.4;
        }
      }}
    /* EVENTO E — veredito: 3 grupos em velocidades diferentes + salva central */
    const verT=seq.length*dur+.4*iv;
    if(c.patT>=verT&&!P0.ver){
      P0.ver=1;
      /* grupo 1: rápido */
      const a1=Math.atan2(player.y-c.y,player.x-c.x);
      for(let k=-2;k<=2;k++)c3Shoot(c.x,c.y-60,a1+k*.12,330*spd,{});
      /* grupo 2: persistente — anel lento que fica */
      const angs=c3Gap(18,2,.55,rnd(TAUx));
      for(const a of angs)c3Shoot(c.x,c.y-60,a,120*spd,{c:'#ff8fa0'});
      /* grupo 3: médio, atravessando o espaço dos anteriores (retardatário) */
      P0.verB=2;P0.verT=.9;
      try{blip('square',900,1500,.14,.06);}catch(e){}
    }
    if(P0.verB>0){P0.verT-=dt;
      if(P0.verT<=0){P0.verT=.5;P0.verB--;
        const a=Math.atan2(player.y-c.y,player.x-c.x);
        for(let k=-1;k<=1;k++)c3Shoot(c.x,c.y-60,a+k*.1,240*spd,{});
      }}
    if(c.patT>=verT+2.6)patEnd();
    break;}
  case 'vermelho':{
    /* v1.4.5 ESPEC §14 COMPLETO — a culminação REUTILIZA os padrões, sem piedade:
       A = firmamento carmesim: 3 arcos (central pequeno-rápido, esquerda médio
           largo, direita grande-lento) a .45s, 2 rodadas com ângulos alterados;
       B = corredor condenado: linha central de pequenos + leques laterais
           CONVERGINDO para o centro, 2 passagens em posições diferentes;
       C = espiral tripla + salva central depois de 1,5s (KAIZO: anéis do corpo);
       D = tempestade das três bocas: sequência composta apertada (2 centrais →
           leque → espiral → central → outro leque);
       E = o círculo se fecha: 3 anéis com lacunas alternadas + miúdo entre eles;
       F = última sentença: pausa de .6s → leque → espiral → linha convergente;
       G = vermelho absoluto: 4 combinações crescentes + 3 arcos finais. */
    if(!P0.t0){P0.t0=1;P0.a1=rnd(TAUx);P0.a2=rnd(TAUx);P0.a3=rnd(TAUx);}
    const den=1+cx*.05;
    /* EVENTO A — firmamento carmesim (2 rodadas × 3 arcos a .45*iv) */
    for(let r=0;r<2;r++){
      const arcs=[[0,5,235,'#ff2e55',4],[1,9,180,'#ff8fa0',6],[2,6,125,'#ff5a78',8]];
      for(let s=0;s<3;s++){
        if(c.patT>=r*2.2*iv+s*.45*iv&&!P0['a'+r+s]){
          P0['a'+r+s]=1;
          const cf=arcs[s],nk=c.necks[cf[0]];
          const a0=Math.atan2(player.y-nk.hy,player.x-nk.hx)+(r?.4:-.4);
          for(let k=0;k<cf[1];k++)c3Shoot(nk.hx,nk.hy,a0-.7+k*(1.4/(cf[1]-1)),cf[2]*spd,{r:cf[4],c:cf[3]});
          nk.g=.5;
          try{blip('square',1200,1800,.1,.05);}catch(e){}
        }
      }
    }
    /* EVENTO B — corredor condenado (2 passagens) */
    for(let p=0;p<2;p++){
      if(c.patT>=(3.6+p*2.1)*iv&&!P0['b'+p]){
        P0['b'+p]=1;
        P0.lineA=Math.atan2(player.y-c.y,player.x-c.x)+(p?.35:-.35); /* a linha muda de lugar */
        P0.lineN=6;P0.lineT=0;
        P0.cvF=3;P0.cvT=.3;P0.cvA=P0.lineA;
      }
    }
    if(P0.lineN>0){P0.lineT-=dt;
      if(P0.lineT<=0){P0.lineT=.14;P0.lineN--;
        c3Shoot(c.x,c.y-60,P0.lineA,340*spd,{r:4,c:'#ff5a78'});}}
    if(P0.cvF>0){P0.cvT-=dt;
      if(P0.cvT<=0){P0.cvT=.5;P0.cvF--;
        const dOff=1.1-P0.cvF*.25; /* os leques deslocam-se para o centro */
        for(const pair of [[1,1],[2,-1]]){
          const nk=c.necks[pair[0]];
          for(let k=0;k<9;k++)c3Shoot(nk.hx,nk.hy,P0.cvA+pair[1]*dOff-.7+k*(1.4/8),185*spd,{c:'#ff8fa0'});
        }
        try{blip('square',1100,1600,.1,.05);}catch(e){}
      }}
    /* EVENTO C — espiral tripla (6.4→10*iv) + salva central após 1,5s */
    if(c.patT>=6.4*iv&&c.patT<10*iv){P0.acc=(P0.acc||0)+dt;
      if(P0.acc>=(cx>=1?.105:.115)){P0.acc=0;P0.a1+=.4;P0.a2-=.4;P0.a3-=.33;
        c3Shoot(c.necks[1].hx,c.necks[1].hy,P0.a1,160*spd,{c:'#ff8fa0'});
        c3Shoot(c.necks[2].hx,c.necks[2].hy,P0.a2,160*spd,{c:'#ff8fa0'});
        c3Shoot(c.necks[0].hx,c.necks[0].hy,P0.a3,175*spd,{});
        /* KAIZO: o corpo também cospe anéis durante a espiral (v1.4.3) */
        if(cx>=3){P0.ringAcc=(P0.ringAcc||0)+.105;
          if(P0.ringAcc>=.9){P0.ringAcc=0;
            const rangs=c3Gap(14,2,.55,rnd(TAUx));
            for(const a of rangs)c3Shoot(c.x,c.y-60,a,170*spd,{});}}
      }}
    if(c.patT>=7.9*iv&&!P0.cB){P0.cB=1;P0.cbN=3;P0.cbT=0;}
    if(P0.cbN>0){P0.cbT-=dt;
      if(P0.cbT<=0){P0.cbT=.16;P0.cbN--;
        const nk=c.necks[0],a=Math.atan2(player.y-nk.hy,player.x-nk.hx);
        for(let k=-1;k<=1;k++)c3Shoot(nk.hx,nk.hy,a+k*.12,320*spd,{});
      }}
    /* EVENTO D — tempestade das três bocas (10.8*iv): 6 passos apertados */
    if(c.patT>=10.8*iv&&!P0.d0){P0.d0=1;P0.st=0;P0.stT=0;}
    if(P0.d0&&P0.st<6){P0.stT-=dt;
      if(P0.stT<=0){P0.stT=.42*iv;
        const a=Math.atan2(player.y-c.y,player.x-c.x);
        switch(P0.st++){
          case 0:case 1: /* duas salvas centrais */
            for(let k=-2;k<=2;k++)c3Shoot(c.x,c.y-60,a+k*.13+(P0.st===1?.09:0),300*spd,{});
            break;
          case 2:{const nk=c.necks[1],na=Math.atan2(player.y-nk.hy,player.x-nk.hx);
            for(let k=0;k<11;k++)c3Shoot(nk.hx,nk.hy,na-.75+k*.15,190*spd,{c:'#ff8fa0'});nk.g=.5;}break;
          case 3:{const nk=c.necks[2];
            for(let k=0;k<10;k++)c3Shoot(nk.hx,nk.hy,(P0.stA=(P0.stA||0)+.37),165*spd,{c:'#ff5a78'});nk.g=.5;}break;
          case 4:
            for(let k=-1;k<=1;k++)c3Shoot(c.x,c.y-60,a+k*.1,330*spd,{});
            break;
          case 5:{const nk=c.necks[2],na=Math.atan2(player.y-nk.hy,player.x-nk.hx);
            for(let k=0;k<11;k++)c3Shoot(nk.hx,nk.hy,na-.6+k*.12,200*spd,{c:'#ff8fa0'});nk.g=.5;}break;
        }
        try{blip('square',1200,1800,.08,.04);}catch(e){}
      }}
    /* EVENTO E — o círculo se fecha (14.6*iv): 3 anéis + miúdo entre eles */
    if(c.patT>=14.6*iv&&!P0.e0){
      P0.e0=1;
      const cfgs=[[22,150,.5],[28,200,.45],[34,255,.4]];
      for(let s=0;s<3;s++){
        const cf=cfgs[s];
        const off=(s%2?1:-1)*(1.1+s*.9); /* sentidos das aberturas alternados */
        const angs=c3Gap(Math.round(cf[0]*Math.min(den,1.15)),2,cf[2],off);
        for(const a of angs)c3Shoot(c.x,c.y-60,a,cf[1]*spd,{r:5,c:s===2?'#ff5a78':'#ff2e55'});
      }
      /* projéteis menores entre os anéis, SEM preencher as lacunas */
      const fill=c3Gap(12,3,.5,rnd(TAUx));
      for(const a of fill)c3Shoot(c.x,c.y-60,a,120*spd,{r:4,c:'#ff8fa0'});
      try{blip('sine',420,140,.5,.08);}catch(e){}
    }
    /* EVENTO F — última sentença (17*iv): pausa .6s → leque → espiral → linha */
    if(c.patT>=17*iv&&!P0.f0){P0.f0=1;P0.fPh=0;P0.fT=.6;}
    if(P0.f0&&P0.fPh<3){P0.fT-=dt;
      if(P0.fT<=0){
        if(P0.fPh===0){ /* leque */
          const nk=c.necks[1],a=Math.atan2(player.y-nk.hy,player.x-nk.hx);
          for(let k=0;k<13;k++)c3Shoot(nk.hx,nk.hy,a-.65+k*(1.3/12),210*spd,{c:'#ff8fa0'});nk.g=.6;
          P0.fT=.5;
        }else if(P0.fPh===1){ /* espiral */
          P0.spN=14;P0.fT=1.1;
        }else{ /* linha convergente de projéteis rápidos */
          P0.lcA=Math.atan2(player.y-c.y,player.x-c.x);
          P0.lcN=7;P0.lcT=0;P0.fT=.3;
        }
        P0.fPh++;
      }
    }
    if(P0.spN>0){P0.spT2=(P0.spT2||0)-dt;
      if(P0.spT2<=0){P0.spT2=.11;P0.spN--;
        P0.spA2=(P0.spA2||0)+.33;
        c3Shoot(c.necks[2].hx,c.necks[2].hy,P0.spA2,170*spd,{c:'#ff5a78'});}}
    if(P0.lcN>0){P0.lcT-=dt;
      if(P0.lcT<=0){P0.lcT=.12;P0.lcN--;
        c3Shoot(c.x,c.y-60,P0.lcA,350*spd,{r:4,c:'#ff5a78'});}}
    /* EVENTO G — vermelho absoluto: 4 combinações de complexidade crescente */
    for(let s=0;s<4;s++){
      if(c.patT>=(20+s*1.1)*iv&&!P0['g'+s]){
        P0['g'+s]=1;
        const a=Math.atan2(player.y-c.y,player.x-c.x);
        /* central: salvas curtas direcionadas (crescem) */
        const cw=s>=2?2:1;
        for(let k=-cw;k<=cw;k++)c3Shoot(c.x,c.y-60,a+k*.12,320*spd,{});
        /* esquerda: leques que alteram o ângulo a cada sequência */
        const nk1=c.necks[1];
        const a1=Math.atan2(player.y-nk1.hy,player.x-nk1.hx)+(s%2?.35:-.35);
        const nG=9+s*2;
        for(let k=0;k<nG;k++)c3Shoot(nk1.hx,nk1.hy,a1-.6+k*(1.2/(nG-1)),195*spd,{c:'#ff8fa0'});
        /* direita: espiral com velocidade progressiva */
        const nk2=c.necks[2];
        for(let k=0;k<6+s*2;k++)c3Shoot(nk2.hx,nk2.hy,(P0.gA=(P0.gA||0)+.31),(150+s*20)*spd,{c:'#ff5a78'});
        nk1.g=nk2.g=.5;
        try{blip('square',1200,1800,.1,.05);}catch(e){}
      }
    }
    /* a última combinação: 3 arcos carmesins em velocidades diferentes */
    if(c.patT>=25.4*iv&&!P0.gf){P0.gf=1;
      const arcs=[[0,340,'#ff2e55',4],[1,210,'#ff8fa0',6],[2,130,'#ff5a78',8]];
      for(const cf of arcs){
        const nk=c.necks[cf[0]];
        const a0=Math.atan2(player.y-nk.hy,player.x-nk.hx);
        for(let k=0;k<11;k++)c3Shoot(nk.hx,nk.hy,a0-.75+k*(1.5/10),cf[1]*spd,{r:cf[3],c:cf[2]});
      }
      try{sfx.roar();}catch(e){}
    }
    if(c.patT>=25.4*iv+2.6)patEnd();
    break;}
  default:patEnd();
  }
}
function patEnd(){
  const c=RM.c3,T=rmTier();
  c.pat=null;
  /* v1.4.3: SEM VULNERABILIDADE — a sentença não descansa mais. No lugar da
     janela vulnerável de 2.6s, um respiro curto (telegrafado pelo propio ritmo)
     e o próximo padrão já começa: é um bullet hell de verdade agora. */
  c.vuln=0;c.vulnMax=0;
  c.rest=Math.max(.3,.66*T.int);
  try{window.__MUSIC_ZONE='sentenca'+Math.max(0,c3Stage());}catch(e){}
}
/* escolha do padrão por etapa */
function nextPattern(){
  const c=RM.c3,st=c.stage;
  let pool;
  if(st===0)pool=['rosario','cruz','espiral'];
  else if(st===1)pool=['rosario','cruz','espiral','cacada','eclipse'];
  else if(st===2)pool=['cruz','cacada','eclipse','chuva','sentencas','espiral'];
  else pool=['sentencas','vermelho','eclipse','chuva','cacada','rosario'];
  let id=pick(pool);
  if(id===c.lastPat&&pool.length>1)id=pick(pool);
  c.lastPat=id;
  return id;
}
/* ---- frame da fase 3 ---- */
function c3Frame(dt){
  const c=RM.c3;if(!c)return;
  c.t+=dt;
  /* v1.5.7: a mensagem vermelha decresce em TODAS as fases — na v1.5.6 ela
     congelava quando a transformação começava (avisoT só descia no dust) e
     ficava pendurada sobre a luta nova */
  if(c.avisoT>0)c.avisoT=Math.max(0,c.avisoT-dt);
  /* morte/avanço por vida zerada (checagem por frame — não só no dano) */
  if(c.ph==='fight'&&c.hp<=0){barAdvanceOrDeath();if(!RM.c3||RM.c3.ph!=='fight')return;}
  /* música por etapa (durante luta) */
  if(c.ph==='fight'){
    const st=c3Stage();
    if(st!==c.stage){
      c.stage=st;
      if(st>0){
        game.banner={type:'boss',txt:'ETAPA '+(st+1)+' — '+STAGE_NAMES[st],
          sub:['anéis, leques e espirais separados','ele caça onde você esteve','as três sentenças alternam','a tempestade carmesim'][st],t:0,dur:2.8};
        try{sfx.roar();game.shake=12;}catch(e){}
      }
    }
    window.__MUSIC_ZONE='sentenca'+Math.max(0,c.stage);
  }
  /* ----- v1.5.6: O PÓ — o antigo apenas se desfaz (sem nada) ----- */
  if(c.ph==='dust'){
    /* silêncio total — nem música, nem aviso: só o corpo indo embora */
    window.__MUSIC_ZONE=null;
    /* o fade do corpo termina (~1,8s) — desliga o chefe antigo de vez */
    if(c.t>=2.3&&!c._gone){c._gone=1;boss.active=false;}
    /* pó subindo do corpo e das cabeças enquanto ele existe */
    if(boss.active&&Math.random()<.9){
      particles.push({x:boss.x+rnd(-95,95),y:boss.y+rnd(-40,45),vx:rnd(-14,14),vy:rnd(-70,-18),life:rnd(1,2.2),t:0,r:rnd(1.4,3.4),c:pick(['#8b8581','#3a3230','#574f4c']),drag:.98});
      const hd=boss.heads[(Math.random()*3)|0];
      if(hd)particles.push({x:hd.hx+rnd(-16,16),y:hd.hy+rnd(-10,10),vx:rnd(-10,10),vy:rnd(-60,-15),life:rnd(.8,1.8),t:0,r:rnd(1,2.6),c:'#8b8581',drag:.98});
    }
    /* poucos segundos depois — A MENSAGEM VERMELHA na tela */
    if(c.t>=3.2&&!c._aviso){
      c._aviso=1;c.avisoT=c.avisoDur;
      try{noiseSfx(1.2,.07,70,'lowpass');blip('sine',92,40,1.4,.15);sfx.echo();}catch(e){}
      game.flash=.32;game.shake=10;
    }
    /* v1.5.7: o decremento global lá em cima cobre o dust (a mensagem vive
       os 3,0s completos e SOME antes do remake despertar) */
    if(c.t>=5.2){
      c.ph='transform';c.t=0;c.glow=0;
      try{window.__MUSIC_ZONE='sentenca0';noiseSfx(2.4,.09,60,'lowpass');blip('sine',55,28,2.6,.15);sfx.echo();}catch(e){}
    }
    return;
  }
  /* ----- TRANSFORMAÇÃO ----- */
  if(c.ph==='transform'){
    window.__MUSIC_ZONE='sentenca0';
    const t=c.t;
    c.glow=Math.min(1,t/2.2);
    /* v1.5.6: a VIDA SE REGENERA sozinha enquanto o Cérbero novo começa o
       diálogo (a sentença desperta) — cura contínua até encher, com uma
       única “VIDA RESTAURADA” no instante em que enche */
    if(player.hp<player.maxHp){
      player.hp=Math.min(player.maxHp,player.hp+player.maxHp*dt/4.2);
      if(Math.random()<dt*9)particles.push({x:player.x+rnd(-14,14),y:player.y+rnd(-10,14),vx:0,vy:-46,life:.55,t:0,r:1.8,c:'#ffd9a0',glow:true});
    }else if(!c._healed){
      c._healed=1;
      try{sparks(player.x,player.y,'#ffd9a0',20,250,.8,3,true);sfx.heart();}catch(e){}
      texts.push({x:player.x,y:player.y-56,txt:'VIDA RESTAURADA',t:0,life:2,c:'#ffd9a0',size:12,disp:true});
    }
    /* as três cabeças "olham" para Thor em momentos diferentes (pescoços sobem) */
    for(const nk of c.necks)if(t>=nk.rise)nk.rise=Math.min(nk.rise,100);/* já ergueu */
    /* v1.5.7: a CRIATURA EMITE LUZ BRANCA — brasas claras nascem do corpo em transformação */
    if(Math.random()<dt*16)particles.push({x:c.x+rnd(-boss.r*.8,boss.r*.8),y:c.y+rnd(-70,20),vx:rnd(-10,10),vy:rnd(-64,-20),life:rnd(.5,1.1),t:0,r:rnd(1.2,2.6),c:Math.random()<.6?'#fffdf4':'#ffe9b8',drag:.97,glow:true});
    if(t>=2.2&&!c._flash){c._flash=1;game.flash=.75;game.shake=16;try{blip('sine',220,880,1.6,.07);noiseSfx(1.2,.06,200,'bandpass');}catch(e){}
      /* v1.5.7: A SEGUNDA APRESENTAÇÃO — a criatura emite luz branca e o
         cartão entra no clarão: CERBERUS · O CÃO NEGRO DO JUÍZO CARMESIM
         (mesma fonte do primeiro; o jogador percebe que a luta mudou de escala) */
      game._cerbCard={mode:2,t:0};
      try{sfx.roar();blip('sine',55,30,1.8,.2);noiseSfx(1.2,.09,80,'lowpass');}catch(e){}
    }
    if(t>=4.4&&!c._banner){c._banner=1;
      /* v1.5.7: SEM banner — a apresentação própria (o cartão mode 2) é a fachada */
      game.banner=null;
    }
    if(t>=5.4){
      c.ph='fight';c.invul=false;c.stage=-1;
      c.hop=0;
      /* v1.4.6: a primeira spell card é a da BARRA atual (dano na transformação
         pode ter adiantado a fila) */
      patStart(SPELL_ORDER[Math.min(7,c.barIdx||0)]||'rosario'); /* anéis lentos e separados (com telegrafia) */
    }
    /* v1.4.6: “faça ele sempre tomar dano” — a partir do clarão (t≥2.2) a
       silhueta em transformação já sangra: atirar nela SEMPRE conta */
    if(t>=2.2)c3BulletDamage();
    /* círculo de luz sob Thor + arena escura: desenhado em rmDrawOver */
    return;
  }
  /* ----- MORTE ----- */
  if(c.ph==='dying'){
    window.__MUSIC_ZONE=null;
    c.t+=0;
    for(const nk of c.necks){nk.g=0;nk.mouth=0;}
    c.glow=Math.max(0,c.glow-dt*.8);
    if(c.t>=2.6&&!c._end){
      c._end=1;
      RM.c3=null;game._rmSent=0;
      /* devolve o chefe antigo para a cena final (intacta) */
      boss.active=true;boss.fade=1;boss.dying=false;boss.barT=1;boss.scale=1;
      game._cerbFight=true;
      try{window.__MUSIC_ZONE=null;}catch(e){}
      winStart();
    }
    return;
  }
  /* ----- LUTA ----- */
  /* v1.4.3: SEM VULNERABILIDADE — no lugar da janela vulnerável existe só um
     respiro curto (rest) e, da etapa 1 em diante, um salto telegrafado.
     Os padrões se encadeiam sem pausa digna de um chefe de Touhou. */
  if(c.rest>0){
    c.rest-=dt;
    if(c.rest<=0&&c.stage>=1&&Math.random()<.5){
      /* salto para nova posição (telegrafado pela sombra) */
      const m={x:130,y:150,w:W-260,h:H-260};
      c.hopX=clamp(m.x+Math.random()*m.w,m.x,m.x+m.w);
      c.hopY=clamp(m.y+Math.random()*m.h,m.y,m.y+m.h);
      c.hop=.8;
    }
  }
  if(c.rest<=0&&!c.pat&&!(c.hop>0)){
    /* v1.4.6: a spell card é a da BARRA — quando o padrão da card acaba, ele
       RECOMEÇA (sempre atacando); a card só troca quando a barra esvazia */
    patStart(SPELL_ORDER[Math.min(7,c.barIdx||0)]||nextPattern());
  }
  /* v1.4.5 ESPEC §10: histórico curto das posições de Thor (atual · ~0,25s
     atrás · ~0,5s atrás) — a CAÇADA SEM RASTRO atira para onde você esteve.
     Reinicializado a cada luta (nasce vazio junto com RM.c3). */
  c.hist=c.hist||[];
  c.histAcc=(c.histAcc||0)+dt;
  if(c.histAcc>=.05){c.histAcc=0;c.hist.push({x:player.x,y:player.y,t:c.t});if(c.hist.length>30)c.hist.shift();}
  if(c.hop>0){
    c.hop-=dt;
    if(c.hop<=0){
      shockwaves.push({x:c.x,y:c.y+40,r:10,vr:520,maxR:130,t:0,dur:.4,c:'#ff8fa0'});
      game.shake=Math.max(game.shake,10);
      try{blip('sine',120,60,.3,.12);noiseSfx(.25,.06,100,'lowpass');}catch(e){}
    }
  }
  const hk=Math.max(0,1-Math.max(0,c.hop)/0.8);
  if(c.hop>0){c.x=c.x+(c.hopX-c.x)*Math.min(1,dt*6);c.y=c.y+(c.hopY-c.y)*Math.min(1,dt*6);}
  /* pescoços: central acompanha Thor; laterais observam */
  for(const nk of c.necks){
    if(nk.tele>0)nk.tele-=dt;
    if(nk.g>0)nk.g=Math.max(0,nk.g-dt*.8);
    if(nk.i===0){
      const want=Math.atan2(player.y-c.y,player.x-c.x);
      nk.a+=angN(want-nk.a)*Math.min(1,dt*3.4);
    }else{
      nk.a+=Math.sin(c.t*(1.1+nk.i*.23)+nk.i*2)*dt*.5;
    }
    const len=130+nk.i*14+Math.sin(c.t*1.7+nk.i)*12;
    const tx=c.x+Math.cos(nk.a)*len*.9,ty=c.y-70+Math.sin(nk.a)*len*.5;
    nk.hx+=(tx-nk.hx)*Math.min(1,dt*5);nk.hy+=(ty-nk.hy)*Math.min(1,dt*5);
    nk.mouth=nk.g>.1||nk.tele>0?.5:Math.max(0,nk.mouth-dt*2);
  }
  /* padrão em curso — v1.4.4: o ritual da spell card segura o ataque por
     um instante (patT só começa a contar quando o cast termina) */
  if(c.cast>0){
    c.cast-=dt;c.patT=0;
    c.glow=Math.min(1,c.glow+dt*1.4);
    if(Math.random()<.35)particles.push({x:c.x+rnd(-70,70),y:c.y-rnd(20,150),vx:rnd(-10,10),vy:rnd(-40,-10),life:rnd(.4,.9),t:0,r:rnd(1,2.2),c:Math.random()<.5?'#ff2e55':'#ff8fa0',drag:.97,glow:true});
  }
  else if(c.pat)patFrame(dt);
  /* colunas (chuva): projéteis caem do topo */
  /* (spawn em patFrame) */
  /* divisão do eclipse ao alcançar 65% da arena */
  for(let i=ebullets.length-1;i>=0;i--){
    const b=ebullets[i];
    if(b.rm){
      b.rmT+=dt;
      if(b.life!==undefined){b.life-=dt;if(b.life<=0){ebullets.splice(i,1);continue;}}
      if(b.rmSplit&&!b._split){
        const dx=b.x-W/2,dy=b.y-H/2;
        if(Math.hypot(dx,dy)>Math.min(W,H)*.42){
          b._split=1;
          const a=Math.atan2(b.vy,b.vx);
          /* v1.4.5 ESPEC §7/§11: a divisão vira DOIS projéteis menores com
             desvio de ±18° (~0,32 rad), uma única ocorrência por projétil */
          c3Shoot(b.x,b.y,a-.32,150,{r:4,c:'#ff8fa0',dmg:8});
          c3Shoot(b.x,b.y,a+.32,150,{r:4,c:'#ff8fa0',dmg:8});
          ebullets.splice(i,1);continue;
        }
      }
    }
  }
  /* dano do jogador — v1.4.6: HITBOX ENORME e SEM NENHUMA JANELA SEM DANO.
     Corpo 118 (+95 no tronco baixo), cabeças 32. A sentença toma dano SEMPRE:
     ritual, descanso, salto e até a transformação (depois do clarão) — nenhum
     momento da luta mais engole tiros. */
  c3BulletDamage();
  /* corpo a corpo: colher/sentença (meleeHitT) e mordida (biteT) */
  if(game.meleeHitT>0&&!c.meleeSeen){
    c.meleeSeen=1;
    if(D(player.x,player.y,c.x,c.y-40)<205&&!c.invul){
      const d=26*P.dmgMult;
      c.hp-=d;dmgText(c.x,c.y-84,Math.round(d));
      rmSparks(c.x,c.y-40,'#ffd9a0',10,220,.5,3);
      try{sfx.slash();}catch(e){}
      if(c.hp<=0){barAdvanceOrDeath();return;}
    }
  }
  if(!(game.meleeHitT>0))c.meleeSeen=0;
  if(player.biteT>0&&!c.biteSeen){
    c.biteSeen=1;
    if(D(player.x,player.y,c.x,c.y-40)<190&&!c.invul){
      const d=22*P.dmgMult;
      c.hp-=d;dmgText(c.x,c.y-84,Math.round(d));
      if(c.hp<=0){barAdvanceOrDeath();return;}
    }
  }
  if(!(player.biteT>0))c.biteSeen=0;
  /* contato com o corpo — v1.4.6: corpo enorme também esmaga mais (72→84) */
  c.touchCd-=dt;
  if(c.touchCd<=0&&!player.dead&&D(player.x,player.y,c.x,c.y-30)<84+(player.hitR||player.r)){hurtPlayer();c.touchCd=.8;}
  /* marcas da caçada: explosão visual */
  /* (em patFrame) */
}
/* v1.4.6: a BARRA quebrou — se ainda há spell cards pela frente, a próxima
   card sobe com a barra cheia depois de uma pausa curtíssima (1.1s + ritual
   de .55s = ~1.65s, dentro dos 2s pedidos). Foi a última barra: morte. */
function barAdvanceOrDeath(){
  const c=RM.c3;if(!c)return;
  if((c.barIdx||0)>=7){c3Death();return;}
  barUp();
}
function barUp(){
  const c=RM.c3;if(!c)return;
  c.barIdx=Math.min(7,(c.barIdx||0)+1);
  c.hp=c.barMax;
  c.pat=null;c.patData={};
  c.marks=[];c.cols=[];c.ringFx=[];
  c.rest=1.1; /* pausa entre cards — nunca maior que 2s */
  c.patShown={};
  rmTxt('SPELL CARD '+((c.barIdx||0)+1)+'/8',c.x,c.y-186,15,'#ff2e55');
  rmTxt('a barra quebrou — a próxima sentença chega',c.x,c.y-166,9,'#ffd9a0');
  game.shake=Math.max(game.shake,10);game.flash=Math.max(game.flash,.22);
  try{blip('square',1700,640,.34,.09);noiseSfx(.3,.07,300,'bandpass');sfx.ehit();}catch(e){}
}
/* dano por BALAS — função própria para poder rodar TAMBÉM na transformação:
   v1.4.6 “faça ele sempre tomar dano” — nenhum momento engole tiros */
function c3BulletDamage(){
  const c=RM.c3;if(!c||c.ph==='dying')return;
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];
    if(b.mine)continue;
    let hit=false,dmul=1;
    if(D(b.x,b.y,c.x,c.y-40)<118+b.r||D(b.x,b.y,c.x,c.y+8)<95+b.r){hit=true;}
    else for(const nk of c.necks)if(D(b.x,b.y,nk.hx,nk.hy)<32+b.r){hit=true;dmul=1.15;break;}
    if(hit){
      const d=b.dmg*dmul;
      c.hp-=d;
      dmgText(c.x+rnd(-16,16),c.y-70-rnd(0,20),Math.round(d));
      rmSparks(b.x,b.y,'#fdfbf4',4,150,.35,2.5);
      try{sfx.bhit();}catch(e){}
      bullets.splice(i,1);
      /* v1.4.6 FIX: a barra só avança quando a vida REALMENTE esvazia —
         cada acerto derruba o hp, mas só o esvaziar quebra a card */
      if(c.hp<=0){barAdvanceOrDeath();if(!RM.c3||RM.c3.ph==='dying')return;}
    }
  }
}
function c3Death(){
  const c=RM.c3;if(!c)return;
  c.ph='dying';c.t=0;c.pat=null;c.vuln=0;
  c.invul=true;
  /* os projéteis desaparecem IMEDIATAMENTE */
  for(let i=ebullets.length-1;i>=0;i--)if(ebullets[i].rm)ebullets.splice(i,1);
  c.marks=[];c.cols=[];
  game.shake=18;game.flash=.5;
  try{sfx.roar();noiseSfx(1.4,.08,80,'lowpass');blip('sine',300,60,1.4,.1);}catch(e){}
  window.__MUSIC_ZONE=null;
  rmTxt('A SENTENÇA… REVOGADA',W/2,H*.3,16,'#ffd9a0');
  /* hitstop dramático */
  game.hitstop=Math.max(game.hitstop,.3);
}
RM.c3Frame=c3Frame;

/* ================================================================
   PARTE 5 — TRILHA DA FASE 3 (camadas que se acumulam) + cues
   Usa o THEME_SEQ do audio.js (acessível no escopo global).
   Nenhum arquivo novo é necessário — síntese própria.
   ================================================================ */
try{
  /* transformação: a trilha morre — só um ruído grave raro */
  THEME_SEQ['sentenca0']={step:1.35,
    bass:[41.2,0,0,0,0,0,0,0,0,0,0,0,36.7,0,0,0],
    sub:[0,0,0,0,0,0,0,0,32.7,0,0,0,0,0,0,0]};
  /* etapa 1 — despertar: pulso + baixo carmesim */
  THEME_SEQ['sentenca']={step:.27,
    bass:[43.65,0,0,43.65,0,0,41.2,0,43.65,0,0,43.65,0,49,0,41.2],
    sub:[87.3,0,0,0,82.4,0,0,0,87.3,0,0,0,98,0,0,0],
    tick:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0]};
  /* etapa 2 — perseguição: camada de arpejo */
  THEME_SEQ['sentenca1']={step:.25,
    bass:[43.65,0,41.2,0,43.65,0,49,0,43.65,0,41.2,0,46.2,0,41.2,0],
    sub:[87.3,0,0,0,87.3,0,0,0,92.5,0,0,0,98,0,0,0],
    arp:[261.6,0,311.1,0,349.2,0,311.1,0,261.6,0,293.7,0,349.2,0,392,0],
    tick:[1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0]};
  /* etapa 3 — três sentenças: espelhos desafinados */
  THEME_SEQ['sentenca2']={step:.23,
    bass:[43.65,0,41.2,43.65,0,46.2,0,41.2,43.65,0,49,0,46.2,0,41.2,43.65],
    sub:[87.3,0,0,87.3,0,0,82.4,0,87.3,0,0,98,0,0,92.5,0],
    arp:[349.2,415.3,523.3,466.2,349.2,415.3,523.3,587.3,349.2,415.3,523.3,466.2,392,466.2,587.3,523.3],
    tick:[1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1],
    mirror:true};
  /* etapa 4 — vermelho absoluto: tudo junto, mais rápido */
  THEME_SEQ['sentenca3']={step:.2,
    bass:[43.65,43.65,0,41.2,43.65,0,49,41.2,43.65,43.65,0,46.2,41.2,0,49,0],
    sub:[87.3,0,87.3,0,92.5,0,87.3,0,98,0,87.3,0,82.4,0,87.3,0],
    arp:[523.3,0,622.3,523.3,0,466.2,523.3,0,698.5,622.3,523.3,466.2,392,466.2,523.3,622.3],
    tick:[1,1,0,1,1,0,1,1,1,1,0,1,1,1,1,1],
    mirror:true};
  /* janela vulnerável: o breve silêncio que ensina */
  THEME_SEQ['sentenca_v']={step:4.8,
    bass:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    arp:[0,0,0,0,0,0,0,0,1046.5,0,0,0,0,0,0,0]};
}catch(e){console.warn('[rm] temas',e);}

/* ================================================================
   PARTE 6 — DESENHO (por cima das entidades)
   Forma branca · pescoços-serpente · barra própria · pato · zonas.
   ================================================================ */
function rmDrawFloor(){
  try{
    /* brasas / fumaças no chão */
    for(const z of(RM.zEmber||[])){
      const a=(1-z.t/z.life)*.5;
      ctx.save();ctx.globalAlpha=a;
      const g=ctx.createRadialGradient(z.x,z.y,2,z.x,z.y,z.r);
      g.addColorStop(0,'rgba(255,143,61,.5)');g.addColorStop(1,'rgba(217,70,90,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAUx);ctx.fill();ctx.restore();
    }
    for(const key of['zSmoke','zSmoke2']){
      for(const z of(RM[key]||[])){
        const a=(1-z.t/z.life)*(key==='zSmoke2'?.4:.28);
        ctx.save();ctx.globalAlpha=a;
        const g=ctx.createRadialGradient(z.x,z.y,4,z.x,z.y,z.r);
        g.addColorStop(0,key==='zSmoke2'?'rgba(201,164,76,.55)':'rgba(157,107,181,.5)');
        g.addColorStop(1,'rgba(60,40,70,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAUx);ctx.fill();ctx.restore();
      }
    }
    /* marcas da caçada (sob tudo) */
    if(RM.c3)for(const m of RM.c3.marks){
      if(m.t<=0)continue;
      const k=1-m.t/m.max;
      ctx.save();
      ctx.globalAlpha=.35+.4*Math.abs(Math.sin(game.t*14));
      ctx.strokeStyle='#ff2e55';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(m.x,m.y,26+10*k,0,TAUx);ctx.stroke();
      ctx.globalAlpha=.16;ctx.fillStyle='#ff2e55';ctx.fill();
      ctx.restore();
    }
    /* colunas da chuva: telegrafia em faixa vertical */
    if(RM.c3)for(const col of RM.c3.cols){
      if(col.tele>0){
        ctx.save();
        ctx.globalAlpha=.16+.2*Math.abs(Math.sin(game.t*16));
        ctx.fillStyle='#ff2e55';
        ctx.fillRect(col.x-16,0,32,H);
        ctx.restore();
      }
    }
  }catch(e){}
}
/* v1.4.4: A PLACA DA SPELL CARD — canto superior direito, moldura fina de
   registro ritualístico, entrada deslizante e nome fixo (sem piscar) enquanto
   o padrão dura; ao terminar, o nome perde o brilho junto com o respiro. */
function rmDrawSpellCard(){
  try{
    const c=RM.c3;if(!c||!c.spell)return;
    const cast=clamp((.55-(c.cast||0))/.55,0,1);
    c.spell.t=(c.spell.t||0)+1/60;
    const inK=clamp(c.spell.t/.35,0,1);
    const rest=c.pat?1:clamp((c.rest||0)/.4,0,1);
    const a=(.3+.7*inK)*(.9*rest);
    if(a<=0.01)return;
    const off=(1-inK)*230;
    const nm=String(c.spell.name||'');
    ctx.save();
    ctx.font='14px '+DISP;
    const wName=ctx.measureText(nm).width;
    const w=Math.min(460,Math.max(252,wName+62));
    const x=W-w-26+off,y=64;
    ctx.globalAlpha=a;
    ctx.fillStyle='rgba(10,6,8,.74)';ctx.fillRect(x,y,w,54);
    ctx.strokeStyle='rgba(255,143,160,'+(.5+.3*cast)+')';ctx.lineWidth=1;
    ctx.strokeRect(x+.5,y+.5,w-1,53);
    /* linha carmesim que varre a placa na entrada */
    if(inK<1){ctx.strokeStyle='rgba(255,46,85,.85)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x+2,y+52-inK*50);ctx.lineTo(x+w-2,y+52-inK*50);ctx.stroke();}
    /* losangos rituais nas laterais */
    ctx.fillStyle='#ff2e55';
    for(const dx of[10,w-10]){ctx.save();ctx.translate(x+dx,y+27);ctx.rotate(Math.PI/4);ctx.fillRect(-2.4,-2.4,4.8,4.8);ctx.restore();}
    txt('SPELL CARD ' +((c.barIdx||0)+1)+'/8',x+26,y+16,MONO,9,'#ff8fa0','left',2);
    txt(nm,x+26,y+38,DISP,14,'#fdfbf4','left',3);
    ctx.restore();
  }catch(e){}
}
function rmDrawSentBar(){
  try{
    const c=RM.c3;if(!c)return;
    const y=40,t=1;
    const total=640,x0=W/2-total/2,h=13;
    txt('CERBERUS — O CÃO NEGRO DO JUÍZO CARMESIM',W/2,y-11,MONO,11,'#ff8fa0','center',3); /* v1.5.7: o nome da segunda apresentação */
    txt(STAGE_NAMES[Math.max(0,c3Stage())]+'  ·  CARD '+((c.barIdx||0)+1)+'/8',W/2,y+26,MONO,9,c.stage>=3?'#ff2e55':'#e6dac4','center',3);
    ctx.strokeStyle='rgba(255,143,160,.6)';ctx.lineWidth=1.5;
    ctx.strokeRect(x0,y,total,h);
    /* v1.4.6: a barra mostra a spell card ATUAL (cada card = 1 barra cheia);
       8 divisões marcam as 8 barras da sentença */
    const r=clamp(c.hp/(c.barMax||c.maxHp),0,1);
    const g=ctx.createLinearGradient(x0,0,x0+total,0);
    g.addColorStop(0,'#ff2e55');g.addColorStop(1,'#ff8fa0');
    ctx.fillStyle=g;ctx.fillRect(x0+1.5,y+1.5,Math.max(0,(total-3)*r),h-3);
    /* divisões das 8 barras — a atual brilha, as quebradas ficam apagadas */
    for(let s=1;s<8;s++){
      const sx=x0+total*s/8;
      ctx.fillStyle='rgba(10,7,8,.85)';ctx.fillRect(sx,y+1.5,2,h-3);
    }
    /* barras já vencidas: risco carmesim escuro por cima (memória do juízo) */
    for(let s=0;s<Math.min(8,c.barIdx||0);s++){
      const sx0=x0+total*s/8+2,sw=total/8-4;
      ctx.fillStyle='rgba(120,22,42,.55)';ctx.fillRect(sx0,y+h-3.5,sw,2);
    }
  }catch(e){}
}
function c3Draw(){
  const c=RM.c3;if(!c)return;
  const T=c.t;
  ctx.save();
  /* v1.5.6: PÓ — nada da sentença é desenhado ainda (o corpo antigo se
     desfaz sozinho pela via do updateBoss/drawBoss) */
  if(c.ph==='dust'){ctx.restore();return;}
  /* ----- transformação: silhueta antiga ganha luz ----- */
  if(c.ph==='transform'){
    /* v1.4.3: no laboratório o véu é leve (teste legível); na luta real o
       BRANCO da arena INVERTE para escuro já na transformação da sentença */
    /* v1.5.7: o cenário escurece BEM SUTILMENTE até a transformação completar
       (era um véu .62 que caía em ~2,5s — agora sobe lento, ~5,4s, e bem leve) */
    const vMax=c.lab?.24:.38;
    const g=ctx.createRadialGradient(player.x,player.y,30,player.x,player.y,240);
    g.addColorStop(0,'rgba(255,250,240,.13)');g.addColorStop(1,'rgba(5,3,4,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(player.x,player.y,240,0,TAUx);ctx.fill();
    ctx.fillStyle='rgba(5,3,4,'+Math.min(vMax,T*(vMax/5.4))+')';ctx.fillRect(0,0,W,H);
    /* corpo antigo derretendo em luz branca */
    const gl=c.glow;
    /* v1.4.3→v1.4.4: nos últimos instantes (4.4s→5.4s) a forma ENDURECE —
       no laboratório a luz esfria para a obsidiana (legível no chão branco);
       na luta real ela fixa no BRANCO intenso da criatura do juízo */
    const hard=clamp((T-4.4)/1,0,1);
    const tR=c.lab?23:253,tG=c.lab?16:251,tB=c.lab?25:244;
    const cr=Math.round((36+219*gl)+((tR)-255)*hard);
    const cg=Math.round((26+225*gl)+((tG)-251)*hard);
    const cb=Math.round((22+222*gl)+((tB)-244)*hard);
    ctx.save();
    ctx.globalAlpha=1;
    /* v1.5.7: A CRIATURA EMITE LUZ BRANCA — halo amplo atrás da silhueta */
    const halo=ctx.createRadialGradient(c.x,c.y-40,10,c.x,c.y-40,boss.r*2.1);
    halo.addColorStop(0,'rgba(255,252,244,'+(.34*gl)+')');
    halo.addColorStop(.55,'rgba(255,244,220,'+(.16*gl)+')');
    halo.addColorStop(1,'rgba(255,230,180,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(c.x,c.y-40,boss.r*2.1,0,TAUx);ctx.fill();
    if(hard>0){ctx.shadowColor='rgba(255,46,85,'+(hard*.9)+')';ctx.shadowBlur=30*gl*hard;}
    else{ctx.shadowColor='rgba(253,251,244,'+gl+')';ctx.shadowBlur=30*gl;}
    ctx.fillStyle='rgb('+cr+','+cg+','+cb+')';
    ctx.beginPath();ctx.ellipse(c.x,c.y+10,boss.r*.9,boss.r*.62,0,0,TAUx);ctx.fill();
    /* pescoços subindo como serpentes, um por vez */
    for(const nk of c.necks){
      const rise=clamp((T-nk.rise+.4)/.9,0,1);
      if(rise<=0)continue;
      const bx=c.x+(nk.i-1)*24,by=c.y-20;
      const hh=nk.hx,hy2=c.y-70-rise*120;
      ctx.strokeStyle='rgb('+cr+','+cg+','+cb+')';
      ctx.lineWidth=16;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(bx,by);
      ctx.quadraticCurveTo(bx+(nk.i-1)*40,by-60-rise*40,hh,hy2);ctx.stroke();
      ctx.beginPath();ctx.arc(hh,hy2,13,0,TAUx);ctx.fill();
    }
    ctx.restore();
    ctx.restore();
    return;
  }
  /* ----- morte: a luz carmesim se apaga e o corpo esfria ----- */
  if(c.ph==='dying'){
    const k=clamp(c.t/2.6,0,1);
    /* v1.4.3: na luta real, o véu escuro se ergue com a morte (a volta ao branco) */
    /* v1.5.4→v1.5.7: na luta real, o véu sutil se ergue com a morte (a volta ao branco) */
    if(!c.lab){ctx.fillStyle='rgba(5,3,4,'+(.38*(1-k))+')';ctx.fillRect(0,0,W,H);}
    ctx.globalAlpha=1;
    ctx.shadowColor='rgba(255,46,85,'+(1-k)*.8+')';ctx.shadowBlur=26*(1-k);
    /* v1.4.4: o corpo branco esfria para cinza (no lab, a obsidiana vira cinza) */
    ctx.fillStyle=c.lab?'rgb('+Math.round(23+120*k)+','+Math.round(16+125*k)+','+Math.round(25+130*k)+')'
                       :'rgb('+Math.round(253-131*k)+','+Math.round(251-133*k)+','+Math.round(244-130*k)+')';
    const sq=1-k*.25;
    ctx.beginPath();ctx.ellipse(c.x,c.y+10,54*sq,36*sq,0,0,TAUx);ctx.fill();
    for(const nk of c.necks){
      ctx.lineWidth=15;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(c.x+(nk.i-1)*20,c.y-10);
      ctx.quadraticCurveTo(c.x+(nk.i-1)*30,c.y-40,(c.x+(nk.i-1)*40)*.9+nk.hx*.1,c.y-30+20*k);ctx.stroke();
    }
    ctx.restore();
    return;
  }
  /* ----- LUTA: forma humanoide agachada ----- */
  const hopK=c.hop>0?clamp(c.hop/.8,0,1):0;
  const bob=Math.sin(T*7)*3;
  const bx=c.x,by=c.y+bob*(1-hopK);
  /* v1.4.3: FORA DO LABORATÓRIO a arena INVERTE — o branco vira escuridão
     apenas na segunda fase (a sentença). No lab, a arena branca fica. */
  if(!c.lab){
    ctx.fillStyle='rgba(5,3,4,.62)';ctx.fillRect(0,0,W,H);
    /* círculo de luz sob Thor: a única clareira na escuridão */
    const g2=ctx.createRadialGradient(player.x,player.y,30,player.x,player.y,240);
    g2.addColorStop(0,'rgba(255,250,240,.13)');g2.addColorStop(1,'rgba(5,3,4,0)');
    ctx.fillStyle=g2;ctx.beginPath();ctx.arc(player.x,player.y,240,0,TAUx);ctx.fill();
  }
  /* sombra do salto */
  ctx.globalAlpha=.4;
  ctx.fillStyle='rgba(0,0,0,.5)';
  ctx.beginPath();ctx.ellipse(c.x,c.y+44,52*(1-hopK*.4),20*(1-hopK*.4),0,0,TAUx);ctx.fill();
  ctx.globalAlpha=1;
  /* v1.4.4: A FORMA BRANCA — o txt da sentença pede a criatura luminosa sobre
     a arena escura, com fissuras carmesins na boca e nos olhos; no laboratório
     (chão branco) a obsidiana fica, para o corpo continuar legível */
  const bodyC=c.lab?'#171019':'#fdfbf4';
  const glowC=c.lab?'rgba(255,46,85,.9)':'rgba(253,251,244,.95)';
  ctx.shadowColor=glowC;ctx.shadowBlur=(c.cast>0?34:22)+8*Math.sin(T*5);
  ctx.fillStyle=bodyC;
  /* corpo agachado: costas arqueadas, centro de gravidade baixo */
  ctx.beginPath();
  ctx.moveTo(bx-44,by+38);
  ctx.quadraticCurveTo(bx-52,by-6,bx-20,by-26);   /* costas arqueadas */
  ctx.quadraticCurveTo(bx,by-38,bx+24,by-24);      /* ombros */
  ctx.quadraticCurveTo(bx+50,by-2,bx+44,by+38);    /* frente */
  ctx.quadraticCurveTo(bx,by+52,bx-44,by+38);      /* base */
  ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(255,95,120,.5)';ctx.lineWidth=2;ctx.stroke();
  /* braços longos apoiados no chão */
  ctx.strokeStyle=bodyC;ctx.lineWidth=13;ctx.lineCap='round';
  ctx.shadowColor=glowC;ctx.shadowBlur=10;
  for(const s of[-1,1]){
    ctx.beginPath();
    ctx.moveTo(bx+s*26,by-14);
    ctx.quadraticCurveTo(bx+s*58,by+6,bx+s*54,by+44);
    ctx.stroke();
    ctx.beginPath();ctx.arc(bx+s*54,by+46,8,0,TAUx);ctx.fill();
  }
  /* pés */
  ctx.beginPath();ctx.arc(bx-30,by+46,7,0,TAUx);ctx.fill();
  ctx.beginPath();ctx.arc(bx+30,by+46,7,0,TAUx);ctx.fill();
  ctx.shadowBlur=0;
  /* sinais carmesins: olhos/boca brilham antes dos disparos */
  /* três pescoços-serpente — v1.4.4: brancos na luta real; a brasa carmesim
     corre pelo pescoço quando vão disparar (o telegrafo segue legível) */
  for(const nk of c.necks){
    const seg=10;
    const sx=bx+(nk.i-1)*10,sy=by-18;
    ctx.shadowBlur=0;
    ctx.strokeStyle=nk.g>0||nk.tele>0?(c.lab?'#3a1a22':'#c9a2ab'):(c.lab?'#1d1418':'#e9e2d2');
    ctx.lineWidth=13-nk.i*1.5;
    ctx.beginPath();ctx.moveTo(sx,sy);
    /* serpenteia: curva com ondulação própria */
    const mx=sx+(nk.hx-sx)*.5+Math.sin(T*2.2+nk.i*2.1)*22;
    const my=sy+(nk.hy-sy)*.55-Math.sin(T*1.8+nk.i)*16-20;
    ctx.quadraticCurveTo(mx,my,nk.hx,nk.hy);
    ctx.stroke();
    /* brasa fina correndo pelo pescoço quando carregado */
    if(nk.g>0||nk.tele>0){
      ctx.strokeStyle='rgba(255,46,85,'+(.35+.4*Math.abs(Math.sin(T*10)))+')';
      ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(sx,sy);
      ctx.quadraticCurveTo(mx,my,nk.hx,nk.hy);
      ctx.stroke();
    }
    /* cabeça de cachorro reconhecível */
    const fa=nk.a;
    ctx.save();
    ctx.translate(nk.hx,nk.hy);ctx.rotate(Math.sin(T*2+nk.i)*.12);
    ctx.fillStyle=bodyC;
    ctx.shadowColor=glowC;ctx.shadowBlur=8;
    ctx.beginPath();ctx.ellipse(0,0,13,10,0,0,TAUx);ctx.fill();       /* crânio */
    ctx.beginPath();ctx.ellipse(11,2,8,5.5,0,0,TAUx);ctx.fill();      /* focinho */
    /* orelhas */
    ctx.beginPath();ctx.moveTo(-4,-8);ctx.lineTo(-9,-18);ctx.lineTo(2,-10);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(4,-8);ctx.lineTo(1,-17);ctx.lineTo(9,-9);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;
    /* olho e boca carmesins — as fissuras que anunciam a spell card */
    ctx.fillStyle=nk.g>0||nk.tele>0?'#ff2e55':(c.lab?'#8f1c36':'#b3243f');
    ctx.beginPath();ctx.arc(4,-3,2.6,0,TAUx);ctx.fill();
    if(nk.mouth>0.05){ctx.fillRect(9,5,9,2.6*nk.mouth*2);}
    ctx.restore();
  }
  ctx.restore();
}
function rmDrawOver(){
  try{
    if(RM.c3)c3Draw();
    /* v1.5.6: A MENSAGEM VERMELHA — “oh cão, voce cometeu um grave erro” —
       pulsa sobre a cena (fase-independent: acompanha o início do remake) */
    if(RM.c3&&RM.c3.avisoT>0){
      const av=RM.c3,mt=av.avisoDur-av.avisoT;
      /* v1.5.6: entra em .35s, fica, e sai nos últimos .45s de vida
         (a versão anterior tinha o fade-out INVERTIDO — a mensagem
         só aparecia no respiro final e sumia o resto do tempo) */
      const al=Math.min(clamp(mt/.35,0,1),clamp(av.avisoT/.45,0,1));
      const tr=(1-clamp(mt/1.1,0,1))*2.4;
      const ox=Math.sin(game.t*43)*tr,oy=Math.cos(game.t*37)*tr;
      ctx.save();
      ctx.fillStyle='rgba(70,0,10,'+(.38*al)+')';ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=al;
      txt('oh cão, voce cometeu um grave erro',W/2+ox,H*.40+oy,DISP,30,'#ff2e55','center',5);
      ctx.restore();
    }
    /* barra própria da fase 3 (v1.5.6: o PÓ não mostra barra — só a luta) */
    if(RM.c3&&RM.c3.ph!=='transform'&&RM.c3.ph!=='dust')rmDrawSentBar();
    /* v1.4.4: placa da spell card — canto superior direito (barra e HUD seguem visíveis) */
    if(RM.c3&&RM.c3.ph==='fight'&&RM.c3.spell&&(RM.c3.pat||RM.c3.rest>0))rmDrawSpellCard();
    /* ossos em órbita */
    if(game.rm_ossos&&RM.orb){
      for(const o of RM.orb){
        ctx.save();
        ctx.translate(o.x||player.x,o.y||player.y);ctx.rotate(game.t*3);
        ctx.fillStyle='#e6dac4';ctx.strokeStyle='#8b8581';ctx.lineWidth=1.4;
        ctx.fillRect(-2,-7,4,14);ctx.beginPath();ctx.arc(-2,-8,3,0,TAUx);ctx.arc(2,-8,3,0,TAUx);ctx.arc(-2,8,3,0,TAUx);ctx.arc(2,8,3,0,TAUx);ctx.fill();
        ctx.restore();
      }
    }
    /* coroa balística orbitando */
    if(game.rm_bOrb&&RM.bOrb){
      for(const o of RM.bOrb.orbs){
        if(o.launched){
          ctx.save();ctx.fillStyle='#ffd9a0';ctx.shadowColor='#ffd9a0';ctx.shadowBlur=8;
          ctx.beginPath();ctx.arc(o.x,o.y,6,0,TAUx);ctx.fill();ctx.restore();
        }else{
          const ox=player.x+Math.cos(o.a)*52,oy=player.y+Math.sin(o.a)*52;
          ctx.save();ctx.globalAlpha=.85;ctx.fillStyle='#ffd9a0';
          ctx.beginPath();ctx.arc(ox,oy,5.5,0,TAUx);ctx.fill();ctx.restore();
        }
      }
    }
    /* canhão: anel de carga */
    if(game.rm_canhao&&RM.canhao&&RM.canhao.chg>0){
      const k=1-RM.canhao.chg/.9;
      ctx.save();
      ctx.strokeStyle='#e8455a';ctx.lineWidth=3;
      ctx.globalAlpha=.7;
      ctx.beginPath();ctx.arc(player.x,player.y,24+8*(1-k),0,TAUx*k);ctx.stroke();
      ctx.restore();
    }
    /* cálice: campo de absorção */
    if(game.rm_calice&&RM.calice&&RM.calice.win>0){
      ctx.save();
      ctx.globalAlpha=.25+.15*Math.sin(game.t*12);
      ctx.strokeStyle='#c9a0ff';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(player.x,player.y,74,0,TAUx);ctx.stroke();
      ctx.restore();
    }
    /* cópia espectral */
    if(game.rm_espelhos&&RM.mirror&&(RM.mirror.q.length||RM.mirror.waveQ)){
      const M=RM.mirror;
      ctx.save();
      ctx.globalAlpha=.34+.1*Math.sin(game.t*4);
      ctx.fillStyle='#9d6bb5';
      const gx=player.x+26,gy=player.y-6+Math.sin(game.t*2.4)*4;
      ctx.beginPath();ctx.arc(gx,gy-6,7,0,TAUx);ctx.fill();
      ctx.fillRect(gx-6,gy+1,12,13);
      ctx.restore();
    }
    /* pato herege */
    if(RM.duck){
      const d=RM.duck;
      ctx.save();
      ctx.translate(d.x,d.y+Math.sin(d.bob)*3);
      if(d.vx<0)ctx.scale(-1,1);
      ctx.fillStyle='#ffe066';
      ctx.beginPath();ctx.ellipse(0,2,9,6.5,0,0,TAUx);ctx.fill();
      ctx.beginPath();ctx.arc(6,-6,4.5,0,TAUx);ctx.fill();
      ctx.fillStyle='#ff9f43';
      ctx.beginPath();ctx.moveTo(9,-6);ctx.lineTo(15,-4.5);ctx.lineTo(9,-3);ctx.closePath();ctx.fill();
      ctx.fillStyle='#231a10';
      ctx.beginPath();ctx.arc(7,-7,1,0,TAUx);ctx.fill();
      ctx.restore();
    }
    /* marca da graça (pena carbonizada) */
    if(game._grazaT>0){
      game._grazaT-=1/60;
      ctx.save();ctx.globalAlpha=game._grazaT*1.4;
      ctx.strokeStyle='#ffd9a0';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(player.x,player.y,26,0,TAUx);ctx.stroke();ctx.restore();
    }
    /* fumaça da penalidade do dízimo */
  }catch(e){}
}
RM.drawFloor=rmDrawFloor;
RM.drawOver=rmDrawOver;

/* ================================================================
   PARTE 7 — FIAÇÃO (wraps aditivos nos hooks que já existem)
   Nada do jogo é reescrito: os wrappers chamam o original primeiro.
   ================================================================ */
RM.resetRun=function(){
  try{
    RM.c3=null;game._rmSent=0;RM._ebSlow=1;RM._ampT=0;
    RM.zEmber=[];RM.zSmoke=[];RM.zSmoke2=[];
    RM.duck=null;RM.orb=null;RM.bOrb=null;RM.canhao=null;RM.calice=null;
    RM.mirror=null;RM._cerb3=null;RM._reflCd=0;RM._orbBoost=0;
    RM.shots=0;RM._meleeCounted=0;
    RM._synFound={};
  }catch(e){}
};
(function wire(){
  const E=window.__EXPANSION;if(!E)return;
  /* frame principal */
  const _f=E.frame;
  E.frame=function(dt){_f(dt);RM.frame(dt);};
  /* mortes de inimigos */
  if(E.onKill){const _ok=E.onKill;E.onKill=function(e){_ok(e);RM.onKill(e);};}
  /* dano recebido (depois do golpe) */
  if(E.afterHurt){const _ah=E.afterHurt;E.afterHurt=function(){_ah();RM.afterHurt();};}
  /* início de run */
  if(E.onRunStart){const _ors=E.onRunStart;E.onRunStart=function(){_ors();RM.resetRun();};}
  /* camada de chão */
  if(E.drawFloor){const _df=E.drawFloor;E.drawFloor=function(){_df();rmDrawFloor();};}
})();
/* spawn: nome apagado + aposta do carrasco
   v1.6.4: repassa o hpMul (A CORTE DUPLA — o gêmeo nasce com 80% da vida) */
(function wireSpawn(){
  if(typeof spawnEnemy!=='function')return;
  const _se=spawnEnemy;
  spawnEnemy=function(type,x,y,kaizo,hpMul){
    const e=_se(type,x,y,kaizo,hpMul);
    try{
      if(e){
        if(game.rm_nome)e._nome=1.2;
        if(game.rm_carrasco&&!e.xboss&&e.maxHp<600&&e.maxHp!==undefined){e.sp=(e.sp||60)*1.18;e._carBoost=1;}
      }
    }catch(_){}
    return e;
  };
})();
/* hesitação do NOME APAGADO (lenta ao nascer) */
RM._nomeT=0;
/* helpers globais consumidos por ganchos de 1 linha no game.js */
window.__RM_dashMul=function(){try{return game.rm_maos?.8:1;}catch(e){return 1;}};
window.__RM_lieBias=function(){
  try{
    if(!game.rm_mentira)return 1;
    /* FAVOR DA MENTIRA: 70% empurra para raro (roll maior), 30% vira migalha */
    return Math.random()<.7?1.22:.55;
  }catch(e){return 1;}
};
/* tecla R — CHAVE DO PURGATÓRIO */
document.addEventListener('keydown',function(e){
  try{
    if(e.code!=='KeyR'||e.repeat)return;
    if(typeof game==='undefined'||!game||game.state!=='play'||player.dead)return;
    RM.chaveTroca();
  }catch(err){}
});
/* SINERGIA pato + espelhos: o pato fantasma (inútil de propósito) */
/* (desenhado junto do pato no drawOver via RM.duckGhost) */

/* ================================================================
   PARTE 8 — DIAGNÓSTICO E TESTES
   ================================================================ */
window.__RM_DEBUG=function(){
  return{v:RM.v,sent:game._rmSent?1:0,
    c3:RM.c3?{ph:RM.c3.ph,hp:Math.round(RM.c3.hp),max:RM.c3.maxHp,stage:RM.c3.stage,pat:RM.c3.pat,vuln:Math.round(RM.c3.vuln*10)/10,t:Math.round(RM.c3.t*10)/10}:null,
    tier:rmTier().name,spd:rmTier().spd,int:rmTier().int,cx:rmTier().cx,
    shots:RM.shots,eb:ebullets.length,bl:bullets.length,
    syn:RM.synList(),synN:RM.synCount(),
    rmItems:Object.keys(game.up||{}).filter(function(id){return id.indexOf('rm_')===0&&game.up[id]>0;})};
};
RM.debug=window.__RM_DEBUG;
window.__RM_TEST={
  force:function(id){
    const u=UPGRADES.find(function(x){return x.id===id;});
    if(!u)return'noitem';
    game.up[id]=(game.up[id]||0)+1;
    try{u.apply();}catch(e){return'applyerr:'+e.message;}
    RM.onPickup(u);
    return'ok';
  },
  killHeads:function(){
    try{for(const h of boss.heads)if(h.alive){h.hp=0;killHead(h);}}catch(e){return'err:'+e.message;}
    return'ok';
  },
  /* fase 3 direto (sem transformação) para testes de padrões */
  startPhase3:function(){
    try{
      if(RM.c3)return'already';
      game._cerbFight=1;game._rmSent=1;boss.active=false;
      RM.c3={ph:'fight',t:0,x:W*.68,y:H*.46,hopX:W*.68,hopY:H*.46,hop:0,
        hp:2200,maxHp:2200,stage:-1,pat:null,patT:0,patStep:0,patData:{},patShown:{},
        vuln:0,vulnMax:1,
        necks:[{i:0,rise:0,base:0,a:Math.PI/2,g:0,sp:0,hx:W*.68,hy:H*.46-160,mouth:0,tele:0},
               {i:1,rise:0,base:-.85,a:Math.PI/2-.85,g:0,sp:0,hx:W*.68-90,hy:H*.46-130,mouth:0,tele:0},
               {i:2,rise:0,base:.85,a:Math.PI/2+.85,g:0,sp:0,hx:W*.68+90,hy:H*.46-130,mouth:0,tele:0}],
        marks:[],cols:[],ringFx:[],touchCd:0,meleeSeen:0,biteSeen:0,invul:false,glow:1,lastPat:null};
      window.__MUSIC_ZONE='sentenca';
      return'ok';
    }catch(e){return'err:'+e.message;}
  },
  c3hp:function(n){if(RM.c3){RM.c3.hp=n;return'ok';}return'noc3';},
  c3pat:function(id){if(RM.c3&&RM.c3.ph==='fight'){patStart(id);return'ok';}return'noc3';},
  clearBullets:function(){for(let i=ebullets.length-1;i>=0;i--)if(ebullets[i].rm)ebullets.splice(i,1);return'ok';},
  reset:function(){RM.resetRun();return'ok';}
};
console.log('[rm] v1.4.4 — 60 itens, sinergias, A SENTENÇA FINAL e as SPELL CARDS DO JUÍZO CARMESIM carregados.');

})();
