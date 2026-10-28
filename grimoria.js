/* ================================================================
   THOR REVENGE — v1.9.0 "O GRIMÓRIO DAS CEM ALMAS"
   grimoria.js — o Grimório: 100 novos itens (34 bênçãos · 33 pactos ·
   33 armas), FEIXES com dano por tick (5 frames, sem acúmulo), o
   REGISTRO CENTRAL DE SINERGIAS, a MAGIKA (eventos raros), efeitos
   de status APLICADOS PELOS INIMIGOS ao Thor, IA mais esperta
   (antecipação + encurralamento) e a ABERTURA DO LIVRO no menu.
   --------------------------------------------------------------
   Nada aqui reconstrói o jogo: tudo vive de ganchos aditivos
   (window.__GRI) e wrappers que PRESERVAM as funções originais.
   Os arquivos originais continuam intactos exceto pelos 6 ganchos
   de uma linha marcados "v1.9.0" dentro do game.js.
   ================================================================ */
(function(){
'use strict';
if(window.__GRI)return;

var GRI={v:'1.9.0',name:'O GRIMÓRIO DAS CEM ALMAS'};
window.__GRI=GRI;

/* ============ ajudantes ============ */
function safe(fn){try{return fn();}catch(e){return undefined;}}
function now(){return performance.now()/1000;}
function grnd(a,b){return a+Math.random()*(b-a);}
function gpick(arr){return arr[(Math.random()*arr.length)|0];}
function gcircle(x,y,r,dmg,col){ /* explosão do grimório — só fere inimigos, nunca o Thor */
  safe(function(){
    for(var i=0;i<enemies.length;i++){var e=enemies[i];
      if(e.dead||e.spawnT<1)continue;
      var d=Math.hypot(e.x-x,e.y-y);
      if(d<r+e.r&&!shadowInvuln(e)){e.hp-=dmg;e.flash=.12;if(e.hp<=0)killEnemy(e);}
    }
    if(typeof boss!=='undefined'&&boss&&boss.heads){for(var j=0;j<boss.heads.length;j++){var h=boss.heads[j];if(h&&!h.dead){var hd=Math.hypot(h.x-x,h.y-y);if(hd<r+(h.r||26)){h.hp-=dmg;h.flash=.12;}}}}
    if(typeof sparks==='function')sparks(x,y,col||'#ffd9a0',14,240,.55,3,true);
  });
}
function gtxt(x,y,txt,col,size){safe(function(){texts.push({x:x,y:y,txt:txt,t:0,life:1.4,c:col||'#ffd9a0',size:size||11,disp:true});});}
function gsparks(x,y,col,n,sp,life,r){safe(function(){sparks(x,y,col,n,sp,life,r,true);});}

/* registro de descobertas do grimório (persistente) */
function acqMeta(id){safe(function(){if(!META.acq)META.acq={};if(!META.acq[id]){META.acq[id]=1;saveMeta();}});}
if(!META.griSyn)META.griSyn={};
if(!META.griTest){META.griTest={};}

/* ================================================================
   1. AS 34 BÊNÇÕES
   Cada uma com efeito REAL, implementado nos motores abaixo.
   ================================================================ */
function bl(id,q,glyph,name,desc,apply,extra){
  var it={id:id,q:q,glyph:glyph,name:name,max:extra&&extra.max||1,desc:desc,
    can:function(){return (game.up[id]||0)<(extra&&extra.max||1);},
    apply:function(){apply();game.up[id]=(game.up[id]||0)+1;if(extra&&extra.on)extra.on();}};
  return it;
}
var BLESS=[
bl('gri_olho_sacristao',2,'eye','OLHO DO SACRISTÃO','o primeiro segredo de cada andar rende um presente extra — e inimigos que entram na tela ganham um aviso dourado (nada te pega pelas costas sem sinal).',
  function(){game.gri_sacristao=1;}),
bl('gri_selo_vigilia',3,'shield','SELO DA VIGÍLIA','uma vez por sala, o primeiro golpe que acertaria Thor é bloqueado pelo selo (recarrega ao limpar cada sala).',
  function(){game.gri_selo=1;}),
bl('gri_chave_purgatorio',4,'stake','CHAVE DO PURGATÓRIO','uma vez por andar, reaparecem as cartas de recompensa — aperte [R] com as cartas na tela para sorteá-las de novo.',
  function(){game.gri_chave=1;},{}),
bl('gri_dente_veredito',3,'fangs','DENTE DO VEREDITO','acertos seguidos no MESMO inimigo empilham marcas; a cada 6 marcas, a sentença detona (+25 de dano em área curta).',
  function(){game.gri_veredito=1;}),
bl('gri_cinza_vela',4,'flame','CINZA DA ÚLTIMA VELA','uma vez por andar, com a vida a menos de 30%, uma onda de cinzas afasta e apaga os projéteis próximos (não cura — dá espaço).',
  function(){game.gri_vela=1;}),
bl('gri_olhos_caronte',2,'soulg','OLHOS DE CARONTE','ao limpar uma sala, Caronte sussurra onde há algo escondido: o primeiro inimigo da sala seguinte rende almas reveladas.',
  function(){game.gri_caronte=1;}),
bl('gri_pena_escrivao',1,'eye','PENA DO ESCRIVÃO','o escrivão anota tudo: senhores e mini-bosses mostram a vida restante por número, e a sala conta seus ameaçadores no canto.',
  function(){game.gri_escrivao=1;}),
bl('gri_sino_condenados',3,'hammer','SINO DOS CONDENADOS','limpar uma sala SEM SOFRER DANO faz o sino ecoar: os inimigos da sala seguinte nascem atordoados por 2,5 segundos.',
  function(){game.gri_sino=1;}),
bl('gri_rosario_partido',2,'valhalla','ROSÁRIO PARTIDO','efeitos negativos (queimadura, veneno, lentidão) duram 40% menos sobre Thor.',
  function(){game.gri_rosario=1;}),
bl('gri_cinzel_memoria',4,'book','CINZEL DA MEMÓRIA','o último padrão de um senhor fica registrado: quando ele repete, um sino mental toca e você causa +10% de dano a ele por 3 segundos.',
  function(){game.gri_cinzel=1;}),
bl('gri_lente_astrologo',2,'nova','LENTE DO ASTRÓLOGO','projéteis inimigos lentos deixam um fio sutil indicando a direção — o céu anuncia o que vem.',
  function(){game.gri_lente=1;}),
bl('gri_pele_sal',1,'shield','PELE DE SAL','sua pele endurecida absorve 3 de cada golpe recebido (mínimo 4).',
  function(){game.gri_sal=1;}),
bl('gri_veu_silencio',3,'dark','VÉU DO SILÊNCIO','na Escola, andar devagar reduz seu ruído pela metade — a Coisa de Cervo demora a te achar pelo som.',
  function(){game.gri_veu=1;}),
bl('gri_selo_segunda_porta',3,'stake','SELO DA SEGUNDA PORTA','a primeira recompensa ÉPICA de cada andar vem em dobro — a segunda porta também se abre.',
  function(){game.gri_segporta=1;}),
bl('gri_lingua_recuperada',1,'book','LÍNGUA RECAPTURADA','você fala de novo com os que ainda temem: a feira do Errante oferece uma mercadoria extra.',
  function(){game.gri_lingua=1;}),
bl('gri_ampulheta_cinzas',3,'nova','AMPULHETA DE CINZAS','desviar por pouco de um projétil concede 0,5s de tolerância após o desvio — a areia cai devagar para quem dança bem.',
  function(){game.gri_ampulheta=1;}),
bl('gri_pupila_caim',2,'blood','PUPILA DE CAIM','inimigos feridos ficam marcados pela pupila por 3s — acertá-los marcados causa +1 de dano por tiro.',
  function(){game.gri_caim=1;}),
bl('gri_coroa_espinhos',3,'crown','COROA DE ESPINHOS FRIOS','contato com inimigos causa 25% menos dano a Thor e reflete 8 de dano frio no que ousou tocar a coroa.',
  function(){game.gri_coroa=1;}),
bl('gri_mapa_lamentacoes',3,'reach','MAPA DAS LAMENTAÇÕES','ao descer, o mapa sustenta a fala do andar: quantas salas de combate, tesouros e perigos esperam.',
  function(){game.gri_mapa=1;}),
bl('gri_lampada_circulo',1,'light','LÂMPADA DO PRIMEIRO CÍRCULO','uma lâmpada fria ilumina ao redor de Thor — os cantos escuros perdem um pouco do medo.',
  function(){game.gri_lampada=1;}),
bl('gri_selo_contrapeso',4,'shield','SELO DO CONTRAPESO','quanto mais projéteis inimigos zumbem perto, mais calmo fica o corpo: até -35% de dano recebido com a sala cheia.',
  function(){game.gri_contrapeso=1;}),
bl('gri_po_confissao',2,'soulg','PÓ DE CONFISSÃO','após limpar uma sala, o pó às vezes sussurra uma confissão antiga: +15 almas.',
  function(){game.gri_po=1;}),
bl('gri_medalha_peregrino',1,'valhalla','MEDALHA DO PEREGRINO','salas opcionais rendem +30 almas ao Peregrino que se desvia do caminho reto.',
  function(){game.gri_peregrino=1;}),
bl('gri_coracao_pedra',2,'hammer','CORAÇÃO DE PEDRA','atordoamentos tremem menos: o tempo de impacto é reduzido pela metade e a lentidão passa mais rápido.',
  function(){game.gri_pedra=1;}),
bl('gri_iris_sentenca',3,'eye','ÍRIS DA SENTENÇA','seus disparos curvam sutilmente para inimigos marcados (Caim, Veredito, Arpão) — a sentença encontra o culpado.',
  function(){game.gri_iris=1;}),
bl('gri_pena_testemunha',1,'book','PENA DA TESTEMUNHA','a primeira aparição de cada senhor é registrada no grimório para sempre, com uma marca de pena.',
  function(){game.gri_testemunha=1;}),
bl('gri_ancora_alma',2,'stake','ÂNCORA DA ALMA','balas gélidas não mais congelam seus passos, e o mundo treme 30% menos quando você é atingido.',
  function(){game.gri_ancora=1;}),
bl('gri_chama_confessor',2,'flame','CHAMA DO CONFESSOR','concluir desafios de sala SEM SOFRER DANO rende +50 almas e uma fagulha do confessor.',
  function(){game.gri_confessor=1;}),
bl('gri_selo_tres_cabecas',5,'fangs','SELO DAS TRÊS CABEÇAS','derrotar um ELITE desperta o selo: -20% de dano recebido até você derrotar o próximo elite (renova só com elite).',
  function(){game.gri_cabecas=1;}),
bl('gri_espelho_culpa',4,'dark','ESPELHO DA CULPA','uma vez por andar, uma ilusão da sua culpa aparece num canto da sala nova — se encarar o reflexo, +5 almas.',
  function(){game.gri_espelho=1;}),
bl('gri_prego_vigilia',2,'stake','PREGO DA VIGÍLIA','inimigos que mudam de direção de repente para te cercar ficam pregados no lugar por 1,5s — e machucam mais fácil.',
  function(){game.gri_prego=1;}),
bl('gri_papiro_retorno',1,'book','PAPIRO DO RETORNO','o que foi escrito permanece: +8% de almas em tudo o que coletar.',
  function(){game.gri_papiro=1;}),
bl('gri_cinza_lunar',2,'light','CINZA LUNAR','suas balas brilham num azul pálido de lua — impossível confundir o que é seu do que é deles.',
  function(){game.gri_cinza=1;}),
bl('gri_ultima_pagina',5,'book','BÊNÇÃO DA ÚLTIMA PÁGINA','terminar um andar SEM USAR o item ativo vira uma página escrita: +40 almas e 15% de chance de uma recompensa épica.',
  function(){game.gri_ultima=1;})
];
/* ================================================================
   2. OS 33 PACTOS — risco claro, vantagem real, NUNCA drenagem de vida
   (desc começa com "PACTO" — o jogo reconhece a categoria assim)
   ================================================================ */
var PACTS=[
{id:'gri_segunda_voz',q:4,glyph:'wave',name:'PACTO: SEGUNDA VOZ',max:1,desc:'PACTO — seu item ativo ecoa: a recarga fica 35% mais curta e 10% das vezes o eco repete o efeito inteiro de graça.',can:function(){return!game.up.gri_segunda_voz;},apply:function(){game.up.gri_segunda_voz=1;game.gri_voz=1;}},
{id:'gri_credor_cinzas',q:3,glyph:'soulg',name:'PACTO: CREDOR DAS CINZAS',max:1,desc:'PACTO — +35% de almas coletadas; mas ao ser atingido, o Credor toma uma parte das próximas coletas.',can:function(){return!game.up.gri_credor;},apply:function(){game.up.gri_credor=1;game.gri_credor=1;}},
{id:'gri_porta_fechada',q:3,glyph:'stake',name:'PACTO: PORTA FECHADA',max:1,desc:'PACTO — salas de tesouro oferecem uma recompensa extra; metade delas guarda uma onda de sombras atrás da porta.',can:function(){return!game.up.gri_porta;},apply:function(){game.up.gri_porta=1;game.gri_porta=1;}},
{id:'gri_ultima_brasa',q:3,glyph:'flame',name:'PACTO: ÚLTIMA BRASA',max:1,desc:'PACTO — limpar salas sem sofrer dano acende a brasa: +25% de dano acumulado (até +75%); ser atingido apaga tudo.',can:function(){return!game.up.gri_brasa;},apply:function(){game.up.gri_brasa=1;game.gri_brasa=1;}},
{id:'gri_contrato_eco',q:3,glyph:'wave',name:'PACTO: CONTRATO DO ECO',max:1,desc:'PACTO — 20% dos seus disparos ecoam atrás da bala com 40% do dano; a cadência cai 10%.',can:function(){return!game.up.gri_eco;},apply:function(){game.up.gri_eco=1;game.gri_eco=1;P.rateMult*=.9;}},
{id:'gri_assinatura_falsa',q:2,glyph:'book',name:'PACTO: ASSINATURA FALSA',max:1,desc:'PACTO — a primeira carta de cada andar carrega um nome mentiroso: 25% de chance de vir com um presente extra escondido.',can:function(){return!game.up.gri_assin;},apply:function(){game.up.gri_assin=1;game.gri_assin=1;}},
{id:'gri_juros_sangue',q:4,glyph:'blood',name:'PACTO: JUROS DE SANGUE',max:1,desc:'PACTO — paga 20 de vida máxima NA HORA (explícito, único) e recebe +40% de dano para sempre. sem drenagem, sem surpresa.',can:function(){return!game.up.gri_jurossangue&&player.maxHp>45;},apply:function(){game.up.gri_jurossangue=1;player.maxHp-=20;player.hp=Math.min(player.hp,player.maxHp);P.dmgMult*=1.4;}},
{id:'gri_clausula_silencio',q:2,glyph:'dark',name:'PACTO: CLÁUSULA DE SILÊNCIO',max:1,desc:'PACTO — salas opcionais rendem +40% de almas; em troca, os projéteis inimigos voam 8% mais rápido.',can:function(){return!game.up.gri_silencio;},apply:function(){game.up.gri_silencio=1;game.gri_silencio=1;game.gri_ebfast=1.08;}},
{id:'gri_divida_caronte',q:3,glyph:'soulg',name:'PACTO: DÍVIDA DE CARONTE',max:1,desc:'PACTO — Caronte remar por você uma vez por andar: uma morte por andar é desfeita com metade da vida; cada novo andar cobra 30 almas.',can:function(){return!game.up.gri_carontediv;},apply:function(){game.up.gri_carontediv=1;game.gri_carontediv=1;}},
{id:'gri_testemunha_oculta',q:4,glyph:'eye',name:'PACTO: TESTEMUNHA OCULTA',max:1,desc:'PACTO — encontros com ELITES ficam bem mais comuns (+6% por sala); os elites que aparecem são mais teimosos.',can:function(){return!game.up.gri_oculta;},apply:function(){game.up.gri_oculta=1;game.gri_oculta=1;}},
{id:'gri_contrato_vidro',q:4,glyph:'shard',name:'PACTO: CONTRATO DE VIDRO',max:1,desc:'PACTO — seus projéteis causam +35% de dano, mas cada golpe recebido dói 50% mais. vidro afiado dos dois lados.',can:function(){return!game.up.gri_vidro;},apply:function(){game.up.gri_vidro=1;game.gri_vidroDmg=1.5;P.dmgMult*=1.35;}},
{id:'gri_prazo_final',q:2,glyph:'bolt',name:'PACTO: PRAZO FINAL',max:1,desc:'PACTO — limpar uma sala em menos de 12 segundos rende +20 almas de bônus. demorar não mata — só paga menos.',can:function(){return!game.up.gri_prazo;},apply:function(){game.up.gri_prazo=1;game.gri_prazo=1;}},
{id:'gri_coro_devedores',q:3,glyph:'wave',name:'PACTO: CORO DOS DEVEDORES',max:1,desc:'PACTO — 12% dos inimigos mortos soltam um ECO que repete um último suspiro de ataque contra o que restar.',can:function(){return!game.up.gri_coro;},apply:function(){game.up.gri_coro=1;game.gri_coro=1;}},
{id:'gri_pacto_atalho',q:2,glyph:'reach',name:'PACTO: O ATALHO',max:1,desc:'PACTO — suas recompensas oferecem 3 cartas em vez de 2; em troca, prêmios lendários pesam menos no sorteio.',can:function(){return!game.up.gri_atalho;},apply:function(){game.up.gri_atalho=1;game.gri_atalho=1;}},
{id:'gri_moeda_marcada',q:2,glyph:'soulg',name:'PACTO: MOEDA MARCADA',max:1,desc:'PACTO — +25% de almas em todas as coletas; salas de tesouro às vezes (25%) entregam só poeira.',can:function(){return!game.up.gri_moeda;},apply:function(){game.up.gri_moeda=1;game.gri_moeda=1;}},
{id:'gri_clausula_distancia',q:3,glyph:'reach',name:'PACTO: CLÁUSULA DA DISTÂNCIA',max:1,desc:'PACTO — balas que viajam mais de 240px causam +35% de dano; sua cadência cai 8% por tanta precisão.',can:function(){return!game.up.gri_distancia;},apply:function(){game.up.gri_distancia=1;game.gri_distancia=1;P.rateMult*=.92;}},
{id:'gri_penhor_memoria',q:3,glyph:'book',name:'PACTO: PENHOR DA MEMÓRIA',max:1,desc:'PACTO — uma vez por andar, a próxima recompensa repetirá o ÚLTIMO item que você recebeu (cópia fiel).',can:function(){return!game.up.gri_penhor;},apply:function(){game.up.gri_penhor=1;game.gri_penhor=1;}},
{id:'gri_pacto_vigia',q:3,glyph:'eye',name:'PACTO: DO VIGIA',max:1,desc:'PACTO — elites têm mais vida (×1.5 extra), mas 25% deles deixam cair uma recompensa épica ao morrer.',can:function(){return!game.up.gri_vigia;},apply:function(){game.up.gri_vigia=1;game.gri_vigia=1;}},
{id:'gri_divida_compartilhada',q:3,glyph:'wave',name:'PACTO: DÍVIDA COMPARTILHADA',max:1,desc:'PACTO — dano em inimigos MARCADOS espalha 25% do golpe para até 2 vizinhos próximos.',can:function(){return!game.up.gri_compart;},apply:function(){game.up.gri_compart=1;game.gri_compart=1;}},
{id:'gri_contrato_espelho',q:3,glyph:'dark',name:'PACTO: CONTRATO DO ESPELHO',max:1,desc:'PACTO — a cada 20s, um reflexo falso de Thor surge por 4s e metade dos inimigos atira nele em vez de em você.',can:function(){return!game.up.gri_espelhoP;},apply:function(){game.up.gri_espelhoP=1;game.gri_espelhoP=1;}},
{id:'gri_aposta_mercador',q:3,glyph:'soulg',name:'PACTO: APOSTA DO MERCADOR',max:1,desc:'PACTO — 15% das salas limpas sem dano soltam DUAS recompensas; a que você demorar desaparece em 6 segundos.',can:function(){return!game.up.gri_aposta;},apply:function(){game.up.gri_aposta=1;game.gri_aposta=1;}},
{id:'gri_selo_sobrevivente',q:2,glyph:'crown',name:'PACTO: ÚLTIMO SOBREVIVENTE',max:1,desc:'PACTO — o último inimigo da sala fica teimoso (+30% de vida ao ficar só) e paga bem: +25 almas ao cair.',can:function(){return!game.up.gri_sobrev;},apply:function(){game.up.gri_sobrev=1;game.gri_sobrev=1;}},
{id:'gri_clausula_cacador',q:3,glyph:'fangs',name:'PACTO: CLÁUSULA DO CAÇADOR',max:1,desc:'PACTO — +40% de dano contra quem te PERSEGUE; suas balas viajam 8% mais devagar por tanto peso na ponta.',can:function(){return!game.up.gri_cacador;},apply:function(){game.up.gri_cacador=1;game.gri_cacador=1;game.gri_bslow=.92;}},
{id:'gri_duas_portas',q:4,glyph:'stake',name:'PACTO: DUAS PORTAS',max:1,desc:'PACTO — salas de tesouro sempre abrem DUAS cartas, e você escolhe UMA. a outra porta se fecha para sempre.',can:function(){return!game.up.gri_duasportas;},apply:function(){game.up.gri_duasportas=1;game.gri_duasportas=1;}},
{id:'gri_contrato_pressa',q:2,glyph:'wind',name:'PACTO: CONTRATO DA PRESSA',max:1,desc:'PACTO — em movimento, você atira 20% mais rápido; ficar parado demais apaga o bônus até voltar a andar.',can:function(){return!game.up.gri_pressa;},apply:function(){game.up.gri_pressa=1;game.gri_pressa=1;}},
{id:'gri_pacto_exilio',q:3,glyph:'dark',name:'PACTO: PACTO DO EXÍLIO',max:1,desc:'PACTO — recompensas épicas chegam 15% mais fácil; paga 10 de vida máxima na hora do selo (explícito).',can:function(){return!game.up.gri_exilio&&player.maxHp>50;},apply:function(){game.up.gri_exilio=1;game.gri_exilio=1;player.maxHp-=10;player.hp=Math.min(player.hp,player.maxHp);}},
{id:'gri_confissao_obrigatoria',q:2,glyph:'book',name:'PACTO: CONFISSÃO OBRIGATÓRIA',max:1,desc:'PACTO — a cada 3 salas limpas, uma confissão vale +20 almas... e deixa uma marca de pecado (+5% dano recebido por 30s).',can:function(){return!game.up.gri_confissao;},apply:function(){game.up.gri_confissao=1;game.gri_confissao=1;}},
{id:'gri_clausula_cacada',q:4,glyph:'fangs',name:'PACTO: CLÁUSULA DA CAÇADA',max:1,desc:'PACTO — senhores convocam uma rajada extra ao terminar cada padrão; em troca você causa -10% de dano a eles.',can:function(){return!game.up.gri_cacada;},apply:function(){game.up.gri_cacada=1;game.gri_cacada=1;}},
{id:'gri_pacto_repeticao',q:3,glyph:'twin',name:'PACTO: DA REPETIÇÃO',max:1,desc:'PACTO — na metade de cada andar, o primeiro item recebido reaparece como uma cópia enfraquecida do mesmo poder.',can:function(){return!game.up.gri_repeticao;},apply:function(){game.up.gri_repeticao=1;game.gri_repeticao=1;}},
{id:'gri_fiador_desconhecido',q:3,glyph:'eye',name:'PACTO: FIADOR DESCONHECIDO',max:1,desc:'PACTO — uma entidade sem nome deixa presentes na primeira sala de cada andar (35%)... mas às vezes a ajuda VIRA a recompensa da sala.',can:function(){return!game.up.gri_fiador;},apply:function(){game.up.gri_fiador=1;game.gri_fiador=1;}},
{id:'gri_ultima_bala',q:3,glyph:'shot',name:'PACTO: A ÚLTIMA BALA',max:1,desc:'PACTO — o 6º disparo seguido detona com +80% de dano; a sequência seguinte começa mais devagar.',can:function(){return!game.up.gri_ultbala;},apply:function(){game.up.gri_ultbala=1;game.gri_ultbala=1;}},
{id:'gri_balanca',q:4,glyph:'crown',name:'PACTO: DA BALANÇA',max:1,desc:'PACTO — a balança equilibra: +20% de dano e +15% de almas; -10% de velocidade. tudo é cobrado na mesma moeda.',can:function(){return!game.up.gri_balanca;},apply:function(){game.up.gri_balanca=1;P.dmgMult*=1.2;P.soulMult*=1.15;P.speedMult*=.9;}},
{id:'gri_pagina_rasgada',q:3,glyph:'book',name:'PACTO: DA PÁGINA RASGADA',max:1,desc:'PACTO — uma vez por andar, limpar uma sala pode soltar uma PÁGINA RASGADA: o segredo dela é sorteado entre várias categorias.',can:function(){return!game.up.gri_rasgada;},apply:function(){game.up.gri_rasgada=1;game.gri_rasgada=1;}}
];
/* ================================================================
   3. AS 33 ARMAS — cada uma muda a FORMA de jogar (formato de tiro).
   O motor (weaponPost + passes de quadro) executa o comportamento.
   griW marca arma-formato; os FEIXES (griBeam) têm motor próprio.
   ================================================================ */
var ARMS=[
{id:'gri_agulhas',q:3,glyph:'stake',name:'AGULHAS DO ESCRIVÃO',max:1,desc:'seus disparos viram AGULHAS finas e rápidas (velocidade +55%, dano -45%) em rajadas de três, quase sem dispersão.',can:function(){return!game.up.gri_agulhas;},apply:function(){game.up.gri_agulhas=1;game.griw_agulhas=1;}},
{id:'gri_martelo',q:4,glyph:'hammer',name:'MARTELO DO JUÍZO',max:1,desc:'a cada 4 disparos, um projétil PESADO: lento, enorme, dano ×2.2 — e empurra quem ele acerta.',can:function(){return!game.up.gri_martelo;},apply:function(){game.up.gri_martelo=1;game.griw_martelo=1;}},
{id:'gri_rosario',q:3,glyph:'valhalla',name:'ROSÁRIO BALÍSTICO',max:1,desc:'a cada 3 disparos, uma conta do rosário desce em ARCO, caindo sobre os condenados (com gravidade de verdade).',can:function(){return!game.up.gri_rosario;},apply:function(){game.up.gri_rosario=1;game.griw_rosario=1;}},
{id:'gri_cerberus',q:3,glyph:'fangs',name:'DENTE DE CERBERUS',max:1,desc:'cada disparo sai em TRÊS presas em formação estreita (dano ×0.6 cada) — o cão morde em leque fechado.',can:function(){return!game.up.gri_cerberus;},apply:function(){game.up.gri_cerberus=1;game.griw_cerberus=1;}},
{id:'gri_bumerangue',q:4,glyph:'shot',name:'LÂMINA BUMERANGUE',max:1,desc:'a cada 5 disparos, uma LÂMINA que voa, hesita e VOLTA ao ponto de origem, cortando na ida e na volta.',can:function(){return!game.up.gri_bumerangue;},apply:function(){game.up.gri_bumerangue=1;game.griw_bumerangue=1;}},
{id:'gri_calice',q:4,glyph:'flame',name:'CÁLICE TRINCADO',max:1,desc:'os impactos estouram numa pequena explosão sagrada (raio 60) — o vinho do cálice é fogo.',can:function(){return!game.up.gri_calice;},apply:function(){game.up.gri_calice=1;game.griw_calice=1;}},
{id:'gri_papiro',q:3,glyph:'book',name:'PAPIRO CORTANTE',max:1,desc:'folhas de papel amaldiçoadas: ao bater nas paredes, cada folha se DIVIDE em dois fragmentos cortantes.',can:function(){return!game.up.gri_papiro;},apply:function(){game.up.gri_papiro=1;game.griw_papiro=1;}},
{id:'gri_sinoferro',q:4,glyph:'hammer',name:'SINO DE FERRO',max:1,desc:'a cada 2,5s o sino toca: uma ONDA circular curta atravessa os inimigos próximos (dano 14).',can:function(){return!game.up.gri_sinoferro;},apply:function(){game.up.gri_sinoferro=1;game.griw_sinoferro=1;}},
{id:'gri_corda',q:3,glyph:'reach',name:'CORDA DE CARONTE',max:1,desc:'a cada 4 disparos, um arpão de corda PUXA inimigos leves em direção ao ponto de impacto.',can:function(){return!game.up.gri_corda;},apply:function(){game.up.gri_corda=1;game.griw_corda=1;}},
{id:'gri_flechas',q:3,glyph:'twin',name:'FLECHAS DO PURGATÓRIO',max:1,desc:'atirar na MESMA direção afia a mira: precisão crescente até perfeita e +10% de dano enquanto segurar a linha.',can:function(){return!game.up.gri_flechas;},apply:function(){game.up.gri_flechas=1;game.griw_flechas=1;}},
{id:'gri_espinhos',q:2,glyph:'stake',name:'ESPINHOS DO ABISMO',max:1,desc:'a cada 3 disparos, um espinho RASTEIRO avança colado ao chão em linha reta — baixo, rápido, difícil de ver.',can:function(){return!game.up.gri_espinhos;},apply:function(){game.up.gri_espinhos=1;game.griw_espinhos=1;}},
{id:'gri_vitral',q:3,glyph:'shard',name:'ESTILHAÇOS DE VITRAL',max:1,desc:'seus disparos RICOCHETEIAM uma vez nas paredes, perdendo 20% do dano no batismo do vidro.',can:function(){return!game.up.gri_vitral;},apply:function(){game.up.gri_vitral=1;game.griw_vitral=1;}},
{id:'gri_lanca',q:4,glyph:'reach',name:'LANÇA DO PEREGRINO',max:1,desc:'a cada 6 disparos, a LANÇA parte em linha reta: veloz, de alcance longo, dano ×1.8 — a fé atravessa a multidão.',can:function(){return!game.up.gri_lanca;},apply:function(){game.up.gri_lanca=1;game.griw_lanca=1;}},
{id:'gri_relogio',q:3,glyph:'nova',name:'RELÓGIO PARTIDO',max:1,desc:'acertos desaceleram o inimigo por 1,2s — o tempo range nas engrenagens partidas (nunca congela de vez).',can:function(){return!game.up.gri_relogio;},apply:function(){game.up.gri_relogio=1;game.griw_relogio=1;}},
{id:'gri_mascara',q:3,glyph:'dark',name:'MÁSCARA DO ECO',max:1,desc:'25% dos disparos ganham um eco num ângulo diferente (±22°) com 40% do dano — a máscara repete o que você diz.',can:function(){return!game.up.gri_mascara;},apply:function(){game.up.gri_mascara=1;game.griw_mascara=1;}},
{id:'gri_coroa_giratoria',q:4,glyph:'crown',name:'COROA GIRATÓRIA',max:1,desc:'a cada 4s, três projéteis ORBITAM Thor por um instante e depois partem para fora, coroando quem espera.',can:function(){return!game.up.gri_coroag;},apply:function(){game.up.gri_coroag=1;game.griw_coroag=1;}},
{id:'gri_corrente',q:3,glyph:'bolt',name:'CORRENTE DO PENITENTE',max:1,desc:'a cada 3 disparos, o projétil carrega um ARCO de energia ligado ao anterior (dano +15% no elo).',can:function(){return!game.up.gri_corrente;},apply:function(){game.up.gri_corrente=1;game.griw_corrente=1;}},
{id:'gri_tinta',q:4,glyph:'dark',name:'TINTA ABISSAL',max:1,desc:'a cada 5 disparos, derrama TINTA no chão: quem pisar detona a marca (dano 18 em raio 70).',can:function(){return!game.up.gri_tinta;},apply:function(){game.up.gri_tinta=1;game.griw_tinta=1;}},
{id:'gri_duas_sentencas',q:4,glyph:'twin',name:'DUAS SENTENÇAS',max:1,desc:'disparos ALTERNADOS: um rápido e leve (dano ×0.7, velocidade ×1.25), outro lento e pesado (dano ×1.5, velocidade ×0.75).',can:function(){return!game.up.gri_duassent;},apply:function(){game.up.gri_duassent=1;game.griw_duassent=1;}},
{id:'gri_agulha_lunar',q:2,glyph:'light',name:'AGULHA LUNAR',max:1,desc:'agulhas finas ganham +12% de dano após voar 200px — quanto mais longe a lua, mais fundo o fio.',can:function(){return!game.up.gri_agulhal;},apply:function(){game.up.gri_agulhal=1;game.griw_agulhal=1;}},
{id:'gri_coracao_mecanico',q:4,glyph:'bolt',name:'CORAÇÃO MECÂNICO',max:1,desc:'a cada 8 disparos, o coração engrenado DESCARREGA uma onda automática ao redor de Thor (dano 16).',can:function(){return!game.up.gri_mecanico;},apply:function(){game.up.gri_mecanico=1;game.griw_mecanico=1;}},
{id:'gri_roda',q:4,glyph:'saw',name:'RODA DO INFERNO',max:1,desc:'a cada 7s lança uma RODA serrilhada que atravessa a arena, bate na borda e RETORNA (grande, pesada, quica 2 vezes).',can:function(){return!game.up.gri_roda;},apply:function(){game.up.gri_roda=1;game.griw_roda=1;}},
{id:'gri_arpao',q:4,glyph:'stake',name:'ARPÃO DAS ALMAS',max:1,desc:'o primeiro acerto MARCA o alvo por 4s; seus disparos seguintes curvam LEVEMENTE para o marcado (nunca teleguiado de verdade).',can:function(){return!game.up.gri_arpao;},apply:function(){game.up.gri_arpao=1;game.griw_arpao=1;}},
{id:'gri_candelabro',q:3,glyph:'flame',name:'CANDELABRO PROFANO',max:1,desc:'impactos deixam chamas acesas por 1,5s no chão — quem passar pela luz do candelabro queima.',can:function(){return!game.up.gri_candelabro;},apply:function(){game.up.gri_candelabro=1;game.griw_candelabro=1;}},
{id:'gri_bussola',q:2,glyph:'reach',name:'BÚSSOLA QUEBRADA',max:1,desc:'os disparos ALTERNAM entre dois ângulos fixos (±8°) — a agulha nunca aponta o norte, mas alterna certeira.',can:function(){return!game.up.gri_bussola;},apply:function(){game.up.gri_bussola=1;game.griw_bussola=1;}},
{id:'gri_veu_navalhas',q:3,glyph:'shot',name:'VÉU DE NAVALHAS',max:1,desc:'cada disparo abre um leque curto de CINCO navalhas (dano ×0.55) — a meio passo, ninguém escapa do véu.',can:function(){return!game.up.gri_veun;},apply:function(){game.up.gri_veun=1;game.griw_veun=1;}},
{id:'gri_mordida_vazio',q:4,glyph:'maw',name:'MORDIDA DO VAZIO',max:1,desc:'a cada 6 disparos, a mordida do vazio ABSORVE projéteis inimigos comuns no caminho (até 3) e engorda +4 de dano cada.',can:function(){return!game.up.gri_mordidav;},apply:function(){game.up.gri_mordidav=1;game.griw_mordidav=1;}},
{id:'gri_pendulo',q:3,glyph:'wave',name:'PÊNDULO DO CARRASCO',max:1,desc:'seus disparos OSCILAM lateralmente enquanto avançam, como a lâmina sobre o cadeiral.',can:function(){return!game.up.gri_pendulo;},apply:function(){game.up.gri_pendulo=1;game.griw_pendulo=1;}},
{id:'gri_selo_explosivo',q:4,glyph:'burst',name:'SELO EXPLOSIVO',max:1,desc:'3 acertos no MESMO inimigo selam a marca: ela detona após um instante (24 de dano em raio 90).',can:function(){return!game.up.gri_seloex;},apply:function(){game.up.gri_seloex=1;game.griw_seloex=1;}},
{id:'gri_lamento_vidro',q:3,glyph:'shard',name:'LAMENTO DE VIDRO',max:1,desc:'acertar um inimigo quebra o lamento: a bala se FRAGMENTA em dois cacos (40% do dano cada).',can:function(){return!game.up.gri_lamentov;},apply:function(){game.up.gri_lamentov=1;game.griw_lamentov=1;}},
{id:'gri_capsula',q:2,glyph:'venom',name:'CÁPSULA DE CINZAS',max:1,desc:'acertos derramam uma nuvem de cinzas: inimigos dentro dela demoram 25% mais para atirar.',can:function(){return!game.up.gri_capsula;},apply:function(){game.up.gri_capsula=1;game.griw_capsula=1;}},
{id:'gri_feixe_pecado',q:5,glyph:'light',name:'FEIXE DO PRIMEIRO PECADO',max:1,desc:'ARMA DE FEIXE (raríssima): segure o disparo — um feixe contínuo castiga por TICKS regulares (a cada 5 quadros). Não acumula dano: o castigo é constante.',griBeam:'pecado',can:function(){return!game.up.gri_feixe_pecado&&(META.descidas|0)>=1;},apply:function(){game.up.gri_feixe_pecado=1;game.griw_beam='pecado';}},
{id:'gri_raio_julgamento',q:6,glyph:'bolt',name:'RAIO DO ÚLTIMO JULGAMENTO',max:1,desc:'FEIXE SUPREMO (raríssimo): atravessa TODOS os alinhados nos dois sentidos, completa marcas, gira em vitral e devora o que o vazio abstraiu. posicionamento é sentença.',griBeam:'julgamento',can:function(){return!game.up.gri_raio_julgamento&&(META.descidas|0)>=2;},apply:function(){game.up.gri_raio_julgamento=1;game.griw_beam='julgamento';}}
];

/* ============ registro: 100 itens entram no catálogo do jogo ============ */
function register(){
  safe(function(){
    var n0=UPGRADES.length;
    BLESS.forEach(function(it){UPGRADES.push(it);});
    PACTS.forEach(function(it){
      UPGRADES.push(it);
      if(PACT_IDS.indexOf(it.id)<0)PACT_IDS.push(it.id);
    });
    ARMS.forEach(function(it){
      UPGRADES.push(it);
      if(it.griBeam)GRI.beamIds[it.griBeam]=it.id;
    });
    GRI.registered=UPGRADES.length-n0;
    GRI.counts={bless:BLESS.length,pacts:PACTS.length,arms:ARMS.length};
    /* o grimório registra os ids adquiridos quando o jogo grava (chooseUpgrade/pickup
       já chamam META.acq) — nada extra necessário */
  });
}
GRI.beamIds={pecado:'gri_feixe_pecado',julgamento:'gri_raio_julgamento'};

/* ============ peso de pactos/feixes nos sorteios (ganchos do game.js) ============ */
GRI.pactW=function(u){
  try{
    if(PACT_IDS.indexOf(u.id)>=0)return 0.35;              /* v1.9.0: pactos bem mais difíceis */
    if(u.griBeam)return (META.descidas|0)>=1?0.45:0;      /* feixes: raros e só depois da 1ª descida */
  }catch(e){}
  return 1;
};
GRI.dropOk=function(u,minQ){
  try{
    if(PACT_IDS.indexOf(u.id)>=0)return Math.random()<0.15;          /* chão: pacto raro */
    if(u.griBeam)return minQ>=5;                                     /* feixes: só tier épico+ */
    if(u.id==='gri_raio_julgamento')return (META.descidas|0)>=2;
  }catch(e){}
  return true;
};
/* ================================================================
   4. MOTOR DAS ARMAS — fireShot embrulhado (o original roda sempre)
   ================================================================ */
var CHASE_SET={sh:1,cr:1,crs:1,ru:1,fa:1,mf:1,al:1,pn:1};
GRI.shotN=0;GRI.flechaDir=null;GRI.flechaK=0;
GRI.orb=[];GRI.orbT=0;GRI.rodaT=0;GRI.sinoT=0;GRI.mecK=0;GRI.echoQ=[];GRI.zones=[];GRI.chainLast=null;
GRI._beamAcc=0;GRI.beam={on:false,ang:0,last:0,kind:null,targets:{},charge:0};
GRI.beamTick=5/60; /* v1.9.0: cadência do feixe = 5 frames a 60 FPS (83,3ms) — independente do FPS real */

function wpost(made,a){
  try{
    var up=game.up,gn=game.griw_;
    if(!made.length)return;
    /* CINZA LUNAR: cor pálida */
    if(game.gri_cinza)made.forEach(function(b){b.color='#cfe9ff';b.gri=true;});
    /* AGULHAS: tudo vira agulha tripla */
    if(gn==='__none')return;
    if(game.griw_agulhas){
      var f0=made[0];
      made.forEach(function(b){var sp=Math.hypot(b.vx,b.vy)*1.55;b.vx=Math.cos(a)*sp;b.vy=Math.sin(a)*sp;b.dmg*=.55;b.r=2.5;b._griAgu=1;b.color='#d8ecff';});
      for(var k=1;k<=2;k++)made.push({x:f0.x,y:f0.y,vx:Math.cos(a+k*.045)*Math.hypot(f0.vx,f0.vy)*1.55,vy:Math.sin(a+k*.045)*Math.hypot(f0.vx,f0.vy)*1.55,r:2.5,dmg:f0.dmg,life:f0.life,a:a+k*.045,color:'#d8ecff',_griAgu:1});
    }
    if(game.griw_cerberus&&made[0]){var c0=made[0],cs=Math.hypot(c0.vx,c0.vy);
      for(var c=1;c<=2;c++)made.push({x:c0.x,y:c0.y,vx:Math.cos(a+(c-(c%2?1:-1)*.5)*.09)*cs,vy:Math.sin(a+(c%2?1:-1)*.045+.09)*cs,r:c0.r,dmg:c0.dmg*.6,life:c0.life,a:a,color:c0.color});
      made.forEach(function(b){b.dmg*=.6/1;}); /* presas dividem a mordida */
      made[0].dmg/=0.6;made[0].dmg*=0.6; /* normaliza a primeira */
      made.forEach(function(b,i){if(i>0)b.dmg=c0.dmg*.6;else b.dmg=c0.dmg*.6;});
    }
    if(game.griw_veun&&made[0]){var v0=made[0],vs=Math.hypot(v0.vx,v0.vy);
      made.length=0;
      for(var v=-2;v<=2;v++)bullets.push({x:v0.x,y:v0.y,vx:Math.cos(a+v*.25)*vs*.92,vy:Math.sin(a+v*.25)*vs*.92,r:4,dmg:v0.dmg*.55,life:(v0.life||.5)*.62,a:a+v*.25,color:v0.color});
    }
    if(game.griw_bussola)made.forEach(function(b,i){var g=a+(GRI.shotN%2?1:-1)*.14,sp=Math.hypot(b.vx,b.vy);b.vx=Math.cos(g)*sp;b.vy=Math.sin(g)*sp;});
    if(game.griw_martelo){GRI.shotN2=(GRI.shotN2||0)+1;made.forEach(function(b){if(GRI.shotN2%4===0){b._griHeavy=1;b.vx*=.55;b.vy*=.55;b.r*=1.6;b.dmg*=2.2;}});}
    if(game.griw_rosario)made.forEach(function(b,i){if(i===0&&(GRI.shotN%3===0)){b._griArc=1;}});else if(game.griw_rosario&&(GRI.shotN%3===0)&&made[0])made[0]._griArc=1;
    if(game.griw_espinhos&&made[0]&&GRI.shotN%3===0){var e0=made[0],es=Math.hypot(e0.vx,e0.vy);e0.vx=Math.cos(a)*es*1.3;e0.vy=Math.sin(a)*es*1.3;e0.r=3;e0._griGround=1;e0.color='#7fae8f';}
    if(game.griw_lanca){GRI.lanK=(GRI.lanK||0)+1;made.forEach(function(b){if(GRI.lanK%6===0){b.vx*=1.6;b.vy*=1.6;b.life*=1.5;b.dmg*=1.8;b.r=7;b._griLanca=1;}});}
    if(game.griw_duassent)made.forEach(function(b,i){var heavy=GRI.shotN%2===0;var sp=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*sp*(heavy?.75:1.25);b.vy=Math.sin(a)*sp*(heavy?.75:1.25);b.dmg*=heavy?1.5:.7;b.r=heavy?7:3.5;});
    if(game.griw_flechas){if(GRI.flechaDir!==null&&Math.abs(angDiff(a,GRI.flechaDir))<.12)GRI.flechaK++;else GRI.flechaK=0;GRI.flechaDir=a;
      if(GRI.flechaK>=2)made.forEach(function(b){b.dmg*=1.1;b._griSharp=1;});}
    if(game.griw_corrente&&made[0]&&GRI.shotN%3===0){GRI.chainSeq=(GRI.chainSeq||0)+1;made[0].dmg*=1.15;made[0]._griChain=GRI.chainSeq;}
    if(game.griw_mordidav){GRI.mawK=(GRI.mawK||0)+1;if(GRI.mawK%6===0&&made[0]){made[0]._griMaw=1;made[0]._griMawN=0;}}
    if(game.gri_distancia)made.forEach(function(b){b._ox=b.x;b._oy=b.y;});
    if(game.gri_bslow)made.forEach(function(b){b.vx*=game.gri_bslow;b.vy*=game.gri_bslow;});
    if(game.griw_pendulo)made.forEach(function(b,i){if(i===0)b._griOsc={ph:rnd(0,6.28),base:Math.hypot(b.vx,b.vy)};});
    if(game.griw_vitral)made.forEach(function(b){b._griRic=0;});
    if(game.griw_papiro)made.forEach(function(b){b._griPaper=1;});
    if(game.griw_bumerangue){GRI.bumK=(GRI.bumK||0)+1;if(GRI.bumK%5===0&&made[0]){var bm=made[0];bm._griBum=.45;bm._griBumOx=bm.x;bm._griBumOy=bm.y;}}
    /* MÁSCARA DO ECO — eco angular */
    if(game.griw_mascara&&made[0]&&Math.random()<.25){var m0=made[0],ms=Math.hypot(m0.vx,m0.vy),ma=a+(Math.random()<.5?1:-1)*.38;
      bullets.push({x:m0.x,y:m0.y,vx:Math.cos(ma)*ms,vy:Math.sin(ma)*ms,r:4,dmg:m0.dmg*.4,life:m0.life*.8,a:ma,color:m0.color,_griEcho:1});}
    /* CONTRATO DO ECO — eco reto atrás */
    if(game.gri_eco&&made[0]&&Math.random()<.2){var k0=made[0],ks=Math.hypot(k0.vx,k0.vy);
      bullets.push({x:k0.x-Math.cos(a)*14,y:k0.y-Math.sin(a)*14,vx:Math.cos(a)*ks*.8,vy:Math.sin(a)*ks*.8,r:4,dmg:k0.dmg*.4,life:k0.life*.9,a:a,color:k0.color,_griEcho:1});}
  }catch(e){}
}
function setupWeapons(){
  try{
    var _fs=fireShot;
    fireShot=function(a){
      /* FEIXE: segurar o disparo sustenta o feixe (nenhuma bala nasce) */
      if(game.griw_beam&&game.state==='play'){
        GRI.beam.on=true;GRI.beam.ang=a;GRI.beam.last=now();GRI.beam.kind=game.griw_beam;
        return;
      }
      GRI.shotN++;
      var _n=bullets.length;
      _fs(a);
      var made=bullets.slice(_n);
      wpost(made,a);
      /* pressa: em movimento, cadência maior (shotT ajustado após o tiro) */
      if(game.gri_pressa&&Math.hypot(player.mvx,player.mvy)>.1)player.shotT*=.8;
      if(game.gri_falsoT>0)player.shotT*=1.5;
      if(game.gri_ultbala){
        GRI.ultK=(GRI.ultK||0)+1;
        if(GRI.ultK%6===0){made.forEach(function(b){b._griLast=1;});}
        if(GRI.ultK%6===0)player.shotT*=1.5;
      }
      if(game.griw_mecanico){GRI.mecK++;if(GRI.mecK%8===0){gcircle(player.x,player.y,110,16*P.dmgMult,'#9fd8ff');gsparks(player.x,player.y,'#9fd8ff',12,220,.5,3);}}
      /* CORDA DE CARONTE — o 4º tiro puxa */
      if(game.griw_corda){GRI.cordK=(GRI.cordK||0)+1;if(GRI.cordK%4===0&&made[0])made[0]._griPull=1;}
      /* TINTA ABISSAL — o 5º tiro derrama tinta */
      if(game.griw_tinta){GRI.tintK=(GRI.tintK||0)+1;if(GRI.tintK%5===0&&made[0])GRI.zones.push({x:made[0].x,y:made[0].y,r:70,t:10,dmg:18*P.dmgMult,kind:'ink',tk:0});}
      /* ÍRIS DA SENTENÇA — leve curva dos disparos recém-nascidos para o marcado */
      if(game.gri_iris){
        var _mk=GRI.markedEnemy(a);
        if(_mk){
          var _ta2=Math.atan2(_mk.y-player.y,_mk.x-player.x),_da=angDiff(_ta2,a);
          if(Math.abs(_da)<.09){
            made.forEach(function(b){var _sp=Math.hypot(b.vx,b.vy),_na=a+clamp(_da,-.05,.05);
              b.vx=Math.cos(_na)*_sp;b.vy=Math.sin(_na)*_sp;});
          }
        }
      }
    };
  }catch(e){}
}
GRI.markedEnemy=function(a,tol){
  var best=null,bd=1e9;
  for(var i=0;i<enemies.length;i++){var e=enemies[i];if(e.dead)continue;
    var m=(e._vmark>0||e._caimT>0||e._arpaoT>0);
    if(!m)continue;
    var d=dist(player.x,player.y,e.x,e.y);
    var aa=Math.atan2(e.y-player.y,e.x-player.x);
    if(Math.abs(angDiff(aa,a))>.1)continue;
    if(d<bd){bd=d;best=e;}
  }
  return best;
};

/* ============ passos por quadro das balas do grimório ============ */
function bulletPass(dt){
  try{
    var i,b;
    for(i=bullets.length-1;i>=0;i--){
      b=bullets[i];
      if(!b)continue;
      if(b._griArc)b.vy+=520*dt;                                   /* ROSÁRIO: arco */
      if(b._griOsc){var per=b._griOsc.ph+game.t*6;var pv=Math.hypot(b.vx,b.vy)||1;var px=Math.cos(per)*.9;
        b.vx+=-Math.sin(Math.atan2(b.vy,b.vx))*pv*px*dt*3;b.vy+=Math.cos(Math.atan2(b.vx,b.vy))*pv*px*dt*3;}
      if(b._griBum!==undefined&&b._griBum>0){b._griBum-=dt;if(b._griBum<=0){b.vx*=-1;b.vy*=-1;b.life=Math.max(b.life||0,.9);b._griBum=undefined;gsparks(b.x,b.y,'#e6dac4',4,120,.3,2);}}
      if(b._griMaw){ /* MORDIDA DO VAZIO: absorve balas inimigas comuns */
        for(var j=ebullets.length-1;j>=0;j--){var eb=ebullets[j];
          if(eb.fake||eb.home)continue;
          if(dist(eb.x,eb.y,b.x,b.y)<26+b.r){ebullets.splice(j,1);if(b._griMawN<3){b.dmg+=4;b._griMawN++;gsparks(b.x,b.y,'#4a1c1c',3,90,.3,2);}}
        }
      }
      if(b._griWheel&&b._griWheel<2){ /* RODA: quica nas bordas */
        if(b.x<ROOM.x+10||b.x>ROOM.x+ROOM.w-10){b.vx*=-1;b._griWheel++;gsparks(b.x,b.y,'#ff8f3d',6,160,.4,3);}
        if(b.y<ROOM.y+10||b.y>ROOM.y+ROOM.h-10){b.vy*=-1;b._griWheel++;}
      }
      if(b._griRic!==undefined&&b._griRic<1){ /* VITRAL: um ricochete */
        if(b.x<ROOM.x+6||b.x>ROOM.x+ROOM.w-6){b.vx*=-1;b._griRic++;b.dmg*=.8;}
        if(b.y<ROOM.y+6||b.y>ROOM.y+ROOM.h-6){b.vy*=-1;b._griRic++;b.dmg*=.8;}
      }
      if(b._griPaper){ /* PAPIRO: divide na parede */
        if(b.x<ROOM.x+8||b.x>ROOM.x+ROOM.w-8||b.y<ROOM.y+8||b.y>ROOM.y+ROOM.h-8){
          var pd=Math.hypot(b.vx,b.vy)||1,pa=Math.atan2(b.vy,b.vx);
          for(var p=0;p<2;p++)bullets.push({x:b.x,y:b.y,vx:Math.cos(pa+(p?.5:-.5))*pd*.8,vy:Math.sin(pa+(p?.5:-.5))*pd*.8,r:3,dmg:b.dmg*.4,life:.5,a:pa,color:b.color,_griPaper:0});
          bullets.splice(i,1);continue;
        }
      }
    }
    /* ARPÃO: leve curva dos disparos para o marcado */
    if(game.griw_arpao){
      var mk=null;
      for(var m2=0;m2<enemies.length;m2++){var ee=enemies[m2];if(!ee.dead&&ee._arpaoT>0){mk=ee;break;}}
      if(mk){
        for(i=0;i<bullets.length;i++){b=bullets[i];
          if(b.gri||b._griAgu||b._griEcho)continue;
          var bb=Math.atan2(b.vy,b.vx),ta=Math.atan2(mk.y-b.y,mk.x-b.x),da=angDiff(ta,bb);
          if(Math.abs(da)<.5){var spd2=Math.hypot(b.vx,b.vy),nb=bb+clamp(da,-1,1)*1.6*dt;
            b.vx=Math.cos(nb)*spd2;b.vy=Math.sin(nb)*spd2;}
        }
      }
    }
  }catch(e){}
}
/* temporizadores de arma (órbitas, roda, sino, coroa) */
function weaponTimers(dt){
  try{
    /* COROA GIRATÓRIA */
    if(game.griw_coroag){GRI.orbT-=dt;
      if(GRI.orbT<=0){GRI.orbT=4;
        for(var o=0;o<3;o++)GRI.orb.push({ang:o*2.094+rnd(0,.5),t:1.2});}
    }
    for(var i=GRI.orb.length-1;i>=0;i--){var ob=GRI.orb[i];ob.ang+=3.4*dt;ob.t-=dt;
      if(ob.t<=0){var sp=560;
        bullets.push({x:player.x+Math.cos(ob.ang)*34,y:player.y+Math.sin(ob.ang)*34,vx:Math.cos(ob.ang)*sp,vy:Math.sin(ob.ang)*sp,r:6,dmg:14*P.dmgMult,life:.9,a:ob.ang,color:'#ffd9a0',_griOrb:1});
        GRI.orb.splice(i,1);}
      else if(game.griSyn&&game.griSyn.coroaveu&&ob.t<.5){ /* sinergia coroa+véu: sai em leque */
        for(var f=0;f<3;f++)bullets.push({x:player.x+Math.cos(ob.ang)*30,y:player.y+Math.sin(ob.ang)*30,vx:Math.cos(ob.ang+(f-1)*.3)*480,vy:Math.sin(ob.ang+(f-1)*.3)*480,r:4,dmg:9*P.dmgMult,life:.7,a:ob.ang,color:'#ffd9a0'});
        GRI.orb.splice(i,1);}
    }
    /* SINO DE FERRO */
    if(game.griw_sinoferro){GRI.sinoT-=dt;
      if(GRI.sinoT<=0){GRI.sinoT=2.5;gcircle(player.x,player.y,150,14*P.dmgMult,'#cfd8dc');
        safe(function(){rings.push({x:player.x,y:player.y,r:10,vr:320,max:150,dmg:0,c:'rgba(207,216,220,.5)'});});}}
    /* RODA DO INFERNO */
    if(game.griw_roda){GRI.rodaT-=dt;
      if(GRI.rodaT<=0){GRI.rodaT=7;
        var ra=rnd(0,6.28);
        bullets.push({x:player.x,y:player.y,vx:Math.cos(ra)*330,vy:Math.sin(ra)*330,r:16,dmg:20*P.dmgMult,life:6,a:ra,color:'#ff8f3d',_griWheel:0});}}
  }catch(e){}
}
/* ============ explosões, marcas e consequências de acerto ============ */
GRI.playerHit=function(e,b){
  try{
    if(!e||e.dead)return;
    /* DENTE DO VEREDITO — marcas + detonação a cada 6 */
    if(game.gri_veredito){
      e._vmark=(e._vmark||0)+1;e._vmarkT=3;
      if(e._vmark>=6){e._vmark=0;e.hp-=25*P.dmgMult;gcircle(e.x,e.y,70,25*P.dmgMult,'#c9a44c');gtxt(e.x,e.y-30,'VEREDITO!','#c9a44c',11);}
    }
    /* PUPILA DE CAIM — bônus contra marcados */
    if(game.gri_caim){if(e._caimT>0)e.hp-=1;e._caimT=3;}
    /* SELO EXPLOSIVO — 3 acertos selam */
    if(game.griw_seloex){
      e._seloK=(e._seloK||0)+1;e._seloT=2;
      if(e._seloK>=3&&!e._seloBoom){e._seloK=0;e._seloBoom=.3;}
    }
    /* ARPÃO DAS ALMAS — marca */
    if(game.griw_arpao&&!e._arpaoT)e._arpaoT=4;
    /* RELÓGIO PARTIDO — lentidão */
    if(game.griw_relogio)e.slowT=Math.max(e.slowT||0,1.2);
    /* MARTELO — empurrão */
    if(b&&b._griHeavy){var ha=Math.atan2(e.y-player.y,e.x-player.x);e.x+=Math.cos(ha)*26;e.y+=Math.sin(ha)*26;}
    /* CORDA — puxa leves */
    if(b&&b._griPull){if((e.r||12)<18){var pa2=Math.atan2(player.y-e.y,player.x-e.x);e.x+=Math.cos(pa2)*60;e.y+=Math.sin(pa2)*60;gtxt(e.x,e.y-24,'puxado!','#7fb8ff',9);}}
    /* CLÁUSULA DA DISTÂNCIA / AGULHA LUNAR — bônus por distância */
    if(b){
      var trav=b._ox!==undefined?Math.hypot(b.x-b._ox,b.y-b._oy):0;
      if(game.gri_distancia&&trav>240)e.hp-=b.dmg*.35;
      if(game.griw_agulhal&&trav>200)e.hp-=b.dmg*.12;
    }
    /* CLÁUSULA DO CAÇADOR — +40% em perseguidores */
    if(game.gri_cacador&&CHASE_SET[e.type])e.hp-=b?b.dmg*.4:0;
    /* PREGO DA VIGÍLIA — pregados machucam mais fácil */
    if(e._pregoT>0)e.hp-=1;
    /* DÍVIDA COMPARTILHADA — espalha 25% em marcados */
    if(game.gri_compart&&(e._vmark>0||e._caimT>0||e._arpaoT>0)&&b){
      var n2=0;
      for(var i2=0;i2<enemies.length&&n2<2;i2++){var o2=enemies[i2];
        if(o2===e||o2.dead)continue;
        if(dist(e.x,e.y,o2.x,o2.y)<110){o2.hp-=b.dmg*.25;o2.flash=.08;n2++;}}
    }
    /* CÁLICE TRINCADO — mini explosão no impacto */
    if(game.griw_calice)gcircle(b?b.x:e.x,b?b.y:e.y,60,10*P.dmgMult,'#ffd9a0');
    /* CANDELABRO — chama no chão */
    if(game.griw_candelabro&&b)GRI.zones.push({x:b.x,y:b.y,r:44,t:1.5,dmg:4*P.dmgMult,kind:'flame',tk:0});
    /* CÁPSULA — nuvem de cinzas */
    if(game.griw_capsula&&b)GRI.zones.push({x:b.x,y:b.y,r:56,t:3,dmg:0,kind:'cloud',tk:0});
    /* TINTA — derramada por disparo (feita no wpost via tiro nº5 → aqui não) */
    /* LAMENTO DE VIDRO — fragmentação (evita cadeia infinita) */
    if(game.griw_lamentov&&b&&!b._griFrag&&!b._griEcho){
      var la=Math.atan2(b.vy,b.vx),ls=Math.hypot(b.vx,b.vy)*.85;
      for(var f2=0;f2<2;f2++)bullets.push({x:b.x,y:b.y,vx:Math.cos(la+(f2?.6:-.6))*ls,vy:Math.sin(la+(f2?.6:-.6))*ls,r:3,dmg:b.dmg*.4,life:.45,a:la,color:b.color,_griFrag:1});
    }
  }catch(e){}
};
GRI.onKill=function(e){
  try{
    /* CORO DOS DEVEDORES — eco do último suspiro */
    if(game.gri_coro&&Math.random()<.12)GRI.echoQ.push({t:now()+.5,x:e.x,y:e.y});
    /* PACTO DO VIGIA — elite pode cair épico */
    if(game.gri_vigia&&e.elite&&Math.random()<.25)safe(function(){dropRandomBlessing(e.x,e.y);});
    /* SELO DAS TRÊS CABEÇAS — renova com elite */
    if(game.gri_cabecas&&e.elite){game.gri_cabecasT=8;gtxt(player.x,player.y-44,'O SELO DESPERTA','#c9a44c',11);}
    /* ÚLTIMO SOBREVIVENTE — paga bem */
    if(game.gri_sobrev&&e._griLastOne){safe(function(){gainSouls(25);});gtxt(e.x,e.y-30,'+25 (sobrevivente)','#c9a44c',11);}
    /* SACRISTÃO/OLHOS DE CARONTE — primeira vítima da sala revelada */
    if(game.gri_caronteVision){game.gri_caronteVision=0;safe(function(){gainSouls(12);});gtxt(e.x,e.y-34,'OLHOS DE CARONTE: +12 almas','#bfd8e8',11);}
  }catch(e){}
};
/* zonas (chamas, tinta, nuvens) + ecos + selos pendentes */
function zonePass(dt){
  try{
    for(var i=GRI.zones.length-1;i>=0;i--){var z=GRI.zones[i];z.t-=dt;z.tk-=dt;
      if(z.kind==='flame'&&z.tk<=0){z.tk=.5;
        for(var j=0;j<enemies.length;j++){var e=enemies[j];
          if(!e.dead&&dist(e.x,e.y,z.x,z.y)<z.r+e.r){e.hp-=z.dmg;e.burnT=Math.max(e.burnT||0,1);e.flash=.06;}}
      }
      if(z.kind==='ink'&&z.tk<=0){z.tk=.2;
        for(var k=0;k<enemies.length;k++){var e2=enemies[k];
          if(!e2.dead&&!z._done&&dist(e2.x,e2.y,z.x,z.y)<z.r+e2.r){z._done=1;gcircle(z.x,z.y,z.r,18*P.dmgMult,'#241731');}}}
      if(z.kind==='cloud'){
        for(var c=0;c<enemies.length;c++){var e3=enemies[c];
          if(!e3.dead&&dist(e3.x,e3.y,z.x,z.y)<z.r+e3.r&&e3.shootT!==undefined)e3.shootT+=dt*.25;}
      }
      if(z.t<=0)GRI.zones.splice(i,1);
    }
    /* selo explosivo pendente */
    for(var s=0;s<enemies.length;s++){var e4=enemies[s];
      if(e4._seloBoom!==undefined&&e4._seloBoom>0){e4._seloBoom-=dt;
        if(e4._seloBoom<=0){delete e4._seloBoom;gcircle(e4.x,e4.y,90,24*P.dmgMult,'#ff8f3d');
          if(game.griSyn&&game.griSyn.caliceselo)gcircle(e4.x,e4.y,60,12*P.dmgMult,'#ffd9a0');}}
      /* marcas com prazo */
      if(e4._vmarkT>0){e4._vmarkT-=dt;if(e4._vmarkT<=0)e4._vmark=0;}
      if(e4._caimT>0)e4._caimT-=dt;
      if(e4._arpaoT>0)e4._arpaoT-=dt;
      if(e4._seloT>0){e4._seloT-=dt;if(e4._seloT<=0)e4._seloK=0;}
      if(e4._pregoT>0)e4._pregoT-=dt;
    }
    /* ecos dos devedores */
    for(var q=GRI.echoQ.length-1;q>=0;q--){var ec=GRI.echoQ[q];
      if(now()>=ec.t){GRI.echoQ.splice(q,1);
        safe(function(){
          var aa=Math.atan2(player.y-ec.y,player.x-ec.x);
          for(var n=0;n<3;n++)ebullets.push({x:ec.x,y:ec.y,vx:Math.cos(aa+(n-1)*.3)*190,vy:Math.sin(aa+(n-1)*.3)*190,r:5,c:'#8a7d6c',life:2.4});
        });}
    }
  }catch(e){}
}
/* ================================================================
   5. EFEITOS DE STATUS NO THOR — os inimigos também aplicam efeitos
   (queimadura · veneno · lentidão), como o jogador aplica neles.
   DoT nunca mata sozinho: para em 1 de vida. Rosário/Âncora interagem.
   ================================================================ */
GRI.applyStatus=function(kind,dur,pow){
  try{
    if(player.dead)return;
    var rm=game.gri_rosario?.6:1;               /* ROSÁRIO PARTIDO: -40% duração */
    if(kind==='slow'){if(game.gri_ancora)return; player.slowT=Math.max(player.slowT||0,dur*rm);}
    else if(kind==='burn'){player.burnT=Math.max(player.burnT||0,dur*rm);player.burnD=Math.max(player.burnD||0,pow);if((player.burnT||0)>=dur*rm*.99)gtxt(player.x,player.y-34,'QUEIMADURA','#ff8f3d',10);}
    else if(kind==='pois'){player.poisT=Math.max(player.poisT||0,dur*rm);player.poisD=Math.max(player.poisD||0,pow);if((player.poisT||0)>=dur*rm*.99)gtxt(player.x,player.y-34,'VENENO','#a8c24f',10);}
  }catch(e){}
};
/* balas inimigas: cor → efeito (chance moderada; nunca balas falsas) */
GRI.bulletHit=function(b){
  try{
    if(!b||b.fake||b._griStatus)return;
    /* SELO DA VIGÍLIA: já bloqueou (shieldHits consumido no hurtPlayer) — nada aqui */
    var c=b.c||'';
    if(c==='#ff8f3d'||c==='#ff6b2d'||c==='#c25a7a'){if(Math.random()<.32)GRI.applyStatus('burn',2.2,2.4+game.floor*1.1);}
    else if(c==='#5ad0a0'||c==='#a8c24f'){if(Math.random()<.30)GRI.applyStatus('pois',3,1.6+game.floor*.8);}
    /* '#9fd8ff' já aplica lentidão nativa (game.js) — âncora anula dentro de applyStatus */
    b._griStatus=1;
  }catch(e){}
};
/* contato corporal: famílias específicas aplicam efeito + COROA DE ESPINHOS */
GRI.contactHit=function(e){
  try{
    if(!e||e.dead)return;
    if(e.type==='fa'||e.type==='mf')GRI.applyStatus('burn',2,2.2+game.floor);
    else if(e.type==='cr'||e.type==='crs'||e.type==='al')GRI.applyStatus('pois',2.6,1.5+game.floor*.7);
    /* COROA DE ESPINHOS FRIOS: reflete e alivia o contato (marca o golpe como contato) */
    if(game.gri_coroa){
      game.gri_contactT=.3;
      safe(function(){
        e.hp-=8*P.dmgMult;e.flash=.1;
        gsparks(e.x,e.y,'#9fd8ff',8,170,.4,3);
        if(e.hp<=0)killEnemy(e);
      });
    }
  }catch(e){}
};
/* dano recebido — todas as reduções/aumentos do grimório num só lugar */
GRI.hurtDmg=function(dmg){
  try{
    var d=dmg;
    if(game.gri_sal)d=Math.max(4,d-3);                                  /* PELE DE SAL */
    if(game.gri_fomeDmg)d*=1.25;                                        /* PACTO DA FOME (nova contrapartida) */
    if(game.gri_vidroDmg)d*=game.gri_vidroDmg;                          /* CONTRATO DE VIDRO */
    if(game.gri_contactT>0&&game.gri_coroa)d*=.75;                      /* COROA: contato -25% */
    if(game.gri_cabecasT>0)d*=.8;                                       /* TRÊS CABEÇAS */
    if(game.gri_confissaoT>0)d*=1.05;                                   /* marca da confissão */
    if(game.gri_contrapeso){                                            /* SELO DO CONTRAPESO */
      var n=0;
      for(var i=0;i<ebullets.length;i++){var b=ebullets[i];if(!b.fake&&dist(b.x,b.y,player.x,player.y)<150)n++;}
      if(n>=16)d*=.65;else if(n>=8)d*=.8;
    }
    return Math.max(1,Math.round(d));
  }catch(e){return dmg;}
};
function statusPass(dt){
  try{
    if(player.dead)return;
    var rm=game.gri_pedra?1.8:1;               /* CORAÇÃO DE PEDRA: passa mais rápido */
    if(player.burnT>0){player.burnT-=dt*rm;
      player.hp=Math.max(1,player.hp-(player.burnD||2)*dt*.5);
      if(Math.random()<dt*6)particles.push({x:player.x+rnd(-9,9),y:player.y+rnd(-9,9),vx:rnd(-12,12),vy:rnd(-40,-12),life:.4,t:0,r:rnd(1,2),c:'#ff8f3d',drag:1,glow:true});}
    else player.burnD=0;
    if(player.poisT>0){player.poisT-=dt*rm;
      player.hp=Math.max(1,player.hp-(player.poisD||1.4)*dt*.5);
      if(Math.random()<dt*4)particles.push({x:player.x+rnd(-9,9),y:player.y+rnd(-9,9),vx:rnd(-10,10),vy:rnd(-26,-8),life:.5,t:0,r:rnd(1,2),c:'#a8c24f',drag:1});}
    else player.poisD=0;
    if(game.gri_rosario&&player.slowT>0)player.slowT-=dt*1.4;   /* ROSÁRIO também acelera a lentidão */
    if(game.gri_contactT>0)game.gri_contactT-=dt;
    if(game.gri_confissaoT>0)game.gri_confissaoT-=dt;
    if(game.gri_cabecasT>0)game.gri_cabecasT-=dt;
    if(game.gri_falsoT>0)game.gri_falsoT-=dt;
    if(game.gri_memDmgT>0)game.gri_memDmgT-=dt;
    /* CINZA DA ÚLTIMA VELA — 1×/andar ao ficar crítica: onda que limpa projéteis */
    if(game.gri_vela&&!game.gri_velaUsed&&player.hp<=player.maxHp*.3){
      game.gri_velaUsed=true;
      var n=0;
      for(var i=ebullets.length-1;i>=0;i--){var b=ebullets[i];
        if(!b.fake&&dist(b.x,b.y,player.x,player.y)<190){ebullets.splice(i,1);n++;}}
      gsparks(player.x,player.y,'#8a7d6c',26,300,.8,4);
      gtxt(player.x,player.y-46,'A ÚLTIMA VELA ('+n+' apagados)','#c9b08a',11);
      try{sfx.echo();}catch(e){}
    }
    /* AMPULHETA DE CINZAS — desviar por pouco dá tolerância */
    if(game.gri_ampulheta&&player.dashT>0){
      for(var j=0;j<ebullets.length;j++){var eb=ebullets[j];
        if(!eb.fake&&dist(eb.x,eb.y,player.x,player.y)<44){game.gri_grace=true;break;}}
    }
    if(game.gri_grace&&player.dashT<=0){game.gri_grace=false;player.inv=Math.max(player.inv,.5);gtxt(player.x,player.y-30,'tolerância de cinzas','#c9b08a',9);}
  }catch(e){}
}

/* ================================================================
   6. MAGIKA — o valor sorteado no início da descida e seus eventos
   ================================================================ */
var MAGIKA_EVENTS=[
 {id:'luz_estranha',w:22,txt:'A LUZ VEIO ESTRANHA NESTA DESCIDA',dur:26},
 {id:'mensagem_velha',w:20,txt:'UMA MENSAGEM QUE NÃO ESTAVA NO GRIMÓRIO',dur:1},
 {id:'sombra_aparicao',w:14,txt:'ALGO TE OLHOU DE UM CANTO... E SUMIU',dur:4},
 {id:'paleta_pallida',w:16,txt:'AS CORES DO INFERNO DESCORARAM',dur:22},
 {id:'silencio_denso',w:18,txt:'O SILENCIO FICOU DENSO DEMAIS',dur:30}
];
GRI.magikaRoll=function(){
  try{
    game.magika=(Math.random()*1000)|0;
    game.magikaEv=[];
    var pool=MAGIKA_EVENTS.slice();
    var n=Math.random()<.35?2:1;
    for(var i=0;i<n&&pool.length;i++){
      var tot=0;pool.forEach(function(e){tot+=e.w;});
      var r=Math.random()*tot,acc=0,idx=0;
      for(;idx<pool.length;idx++){acc+=pool[idx].w;if(r<=acc)break;}
      idx=Math.min(idx,pool.length-1);
      game.magikaEv.push({id:pool[idx].id,t:0,dur:pool[idx].dur,done:false,uses:0});
      pool.splice(idx,1);
    }
    gtxt(W/2,H*.2,'MAGIKA · '+game.magika,'#9d6bb5',12);
  }catch(e){}
};
function magikaPass(dt){
  try{
    if(!game.magikaEv||!game.magikaEv.length)return;
    for(var i=0;i<game.magikaEv.length;i++){var ev=game.magikaEv[i];
      if(ev.done)continue;
      ev.t+=dt;
      if(ev.t>2&&!ev._announced){ev._announced=true;
        var def=null;MAGIKA_EVENTS.forEach(function(m){if(m.id===ev.id)def=m;});
        if(def)game.banner={type:'small',txt:'MAGIKA',sub:def.txt.toLowerCase(),t:0,dur:3.4};
      }
      if(ev.t>=ev.dur)ev.done=true;
    }
  }catch(e){}
}
GRI.magikaActive=function(id){
  try{if(!game.magikaEv)return false;
    for(var i=0;i<game.magikaEv.length;i++)if(game.magikaEv[i].id===id&&!game.magikaEv[i].done)return true;
  }catch(e){}
  return false;
};

/* ================================================================
   7. IA — antecipação da posição, encurralamento suave e menos pressa
   ================================================================ */
GRI.pvx=0;GRI.pvy=0;GRI._px=0;GRI._py=0;GRI._velT=0;
function aiPass(dt){
  try{
    /* velocidade estimada de Thor (para a antecipação) */
    GRI._velT+=dt;
    if(GRI._velT>=.1){
      var vx=(player.x-GRI._px)/GRI._velT,vy=(player.y-GRI._py)/GRI._velT;
      GRI.pvx=GRI.pvx*.6+vx*.4;GRI.pvy=GRI.pvy*.6+vy*.4;
      GRI._px=player.x;GRI._py=player.y;GRI._velT=0;
    }
    /* encurralamento: perseguidores ganham lados distintos (empurrão suave) */
    for(var i=0;i<enemies.length;i++){var e=enemies[i];
      if(e.dead||e.spawnT<1)continue;
      if(e.type==='cr'||e.type==='crs'||e.type==='ru'){
        if(e._flank===undefined)e._flank=((i%3)-1); /* -1 esq · 0 centro · 1 dir */
        if(e._flank!==0){
          var d=dist(e.x,e.y,player.x,player.y);
          if(d>90&&d<420){
            var aa=Math.atan2(player.y-e.y,player.x-e.x)+e._flank*1.25;
            var tx=player.x-Math.cos(aa)*190,ty=player.y-Math.sin(aa)*190;
            var pull=Math.min(30*dt,1);
            e.x+=(tx-e.x)*pull*.22;e.y+=(ty-e.y)*pull*.22;
          }
        }
      }
      /* PREGO DA VIGÍLIA — mudança abrupta de direção marca */
      if(game.gri_prego){
        var na=Math.atan2(player.y-e.y,player.x-e.x);
        if(e._lastAng!==undefined&&Math.abs(angDiff(na,e._lastAng))>1.8)e._pregoT=1.5;
        e._lastAng=na;
      }
      /* ÚLTIMO SOBREVIVENTE — marca o único de pé */
      if(game.gri_sobrev&&!e._griLastOne){
        var alive=0;for(var k=0;k<enemies.length;k++)if(!enemies[k].dead)alive++;
        if(alive===1){e._griLastOne=true;e.hp*=1.3;}
      }
      /* CINZEL DA MEMÓRIA — reconhece repetição de padrão de senhores */
      if(game.gri_cinzel&&e.pat&&e.st){
        if(e._memPat===e.pat&&e._memCount!==undefined){e._memCount++;}
        else {e._memCount=0;}
        e._memPat=e.pat;
        if(e._memCount>0&&e.st==='tele'&&!e._memFlag){e._memFlag=true;
          gtxt(e.x,e.y-e.r-18,'PADRÃO RECONHECIDO','#c9a44c',10);
          game.gri_memDmgT=3;
        }
        if(e.st!=='tele')e._memFlag=false;
      }
    }
    /* CONTRATO DO ESPELHO — o reflexo falso */
    if(game.gri_espelhoP){
      GRI.decT=(GRI.decT||0)-dt;
      if(GRI.decT<=0){GRI.decT=20;GRI.decoy={x:player.x+grnd(-140,140),y:player.y+grnd(-110,110),t:4};
        gtxt(GRI.decoy.x,GRI.decoy.y-30,'O REFLEXO','#9d6bb5',10);}
      if(GRI.decoy){GRI.decoy.t-=dt;if(GRI.decoy.t<=0)GRI.decoy=null;}
    }
    /* FIADOR DESCONHECIDO — presente por andar */
    if(game.gri_fiador&&!game.gri_fiadoFloor&&game.floor>0){
      game.gri_fiadoFloor=true;
      if(Math.random()<.35){
        if(Math.random()<.15)game.gri_fiadoSteal=true;
        else safe(function(){
          var roll=Math.random();
          if(roll<.5)for(var s2=0;s2<8;s2++)pickups.push({type:'soul',x:player.x+rnd(-30,30),y:player.y+rnd(-30,30),t:0,ph:rnd(TAU)});
          else if(roll<.8){game.fagulha=(game.fagulha||0)+1;gtxt(player.x,player.y-40,'O FIADOR DEIXOU UMA FAGULHA','#ff8f3d',11);}
          else pickups.push({type:'heart',x:player.x+rnd(-20,20),y:player.y-30,t:0,ph:rnd(TAU)});
          gtxt(player.x,player.y-58,'algo te deixou um presente...','#9d6bb5',10);
        });
      }
    }
    /* ÚLTIMA PÁGINA — andar terminou sem usar o ativo? */
    if(game._griLastFloor!==undefined&&game.floor>game._griLastFloor){
      game._griLastFloor=game.floor;
      if(game.gri_ultima&&!game._griActiveUsed){
        safe(function(){
          gainSouls(40);
          gtxt(player.x,player.y-50,'A ÚLTIMA PÁGINA: +40 almas','#c9a44c',11);
          if(Math.random()<.15)dropRandomBlessing(player.x,player.y-40);
        });
      }
      game._griActiveUsed=false;
    }
  }catch(e){}
}
/* fireEnemyShots embrulhado: antecipação + reflexo + cláusulas */
function setupAI(){
  try{
    var _fes=fireEnemyShots;
    fireEnemyShots=function(e,n,spread,vel,c,r){
      try{
        if(game.gri_ebfast){vel*=game.gri_ebfast;}
        var base=Math.atan2(player.y-e.y,player.x-e.x);
        /* ANTECIPAÇÃO: cuspidores, feiticeiros e vigias miram onde você VAI estar */
        if(e._lead===undefined)e._lead=(e.type==='sp'||e.type==='fs'||e.type==='vg')?(.35+Math.random()*.3):0;
        var d=dist(e.x,e.y,player.x,player.y);
        var tFly=d/Math.max(60,vel);
        var aim=base;
        if(e._lead>0){
          aim=Math.atan2(player.y+GRI.pvy*tFly*e._lead-e.y,player.x+GRI.pvx*tFly*e._lead-e.x);
          aim+=grnd(-.09,.09); /* erro humano: continua desviável */
        }
        /* CONTRATO DO ESPELHO: metade atira no reflexo */
        if(GRI.decoy&&Math.random()<.5)aim=Math.atan2(GRI.decoy.y-e.y,GRI.decoy.x-e.x);
        for(var i=0;i<n;i++){
          var a=aim+(i-(n-1)/2)*spread;
          ebullets.push({x:e.x+Math.cos(a)*e.r,y:e.y+Math.sin(a)*e.r,vx:Math.cos(a)*vel,vy:Math.sin(a)*vel,r:r,c:c});
        }
        sfx.spit();
      }catch(err){ /* se algo falhar, a original responde */
        _fes(e,n,spread,vel,c,r);
      }
    };
    /* spawnEnemy embrulhado: sino dos condenados, elites da testemunha, registro de senhores */
    var _se=spawnEnemy;
    spawnEnemy=function(type,x,y,kaizo,hpMul){
      var e=_se(type,x,y,kaizo,hpMul);
      try{
        if(!e)return e;
        if(game.gri_sinoNext){e.slowT=Math.max(e.slowT||0,2.5);if(e.shootT!==undefined)e.shootT=Math.max(e.shootT,2.5);}
        if(game.gri_oculta&&!e.elite&&Math.random()<.06){e.elite=true;e.hp*=2.2;e.sp*=1.18;e.r*=1.18;}
        if(game.gri_vigia&&e.elite)e.hp*=1.5;
        if(game.gri_testemunha&&(type==='mb'||type==='ex'||type==='vi'||type==='gz'||type==='rk'||type==='e404')&&!META.griTest[type]){
          META.griTest[type]=1;saveMeta();
          gtxt(e.x,e.y-e.r-20,'A PENA REGISTROU: '+e.type.toUpperCase(),'#c9b08a',10);
        }
      }catch(err){}
      return e;
    };
  }catch(e){}
}
/* ================================================================
   8. O FEIXE — dano por tick a cada 5 quadros (83,3ms @60), SEM acúmulo
   • o dano por tick é constante: segurar o feixe no alvo NUNCA aumenta
     o valor (a carga visual é só visual)
   • temporizador acumulado por dt — independente da taxa de quadros
   • alvo fora do feixe → estado de contato reiniciado
   • vários alvos alinhados: cada um recebe independentemente
   ================================================================ */
function beamTargets(){
  var out=[];
  try{
    var kind=GRI.beam.kind==='julgamento'?2:1; /* 1 = só à frente · 2 = os dois sentidos */
    var range=430*P.reachMult;
    var dx=Math.cos(GRI.beam.ang),dy=Math.sin(GRI.beam.ang);
    var minT=kind===2?-range:0;
    function probe(x,y,r,obj,kindTag){
      var rx=x-player.x,ry=y-player.y;
      var t=rx*dx+ry*dy;
      if(t<minT||t>range)return;
      var perp=Math.abs(rx*dy-ry*dx);
      if(perp<r+6)out.push({obj:obj,t:t,kindTag:kindTag});
    }
    for(var i=0;i<enemies.length;i++){var e=enemies[i];
      if(!e.dead&&e.spawnT>=1)probe(e.x,e.y,e.r,e,'e');
    }
    if(typeof boss!=='undefined'&&boss&&boss.heads){
      for(var h=0;h<boss.heads.length;h++){var hd=boss.heads[h];
        if(hd&&!hd.dead&&!hd.hidden)probe(hd.x,hd.y,hd.r||26,hd,'h');
      }
    }
  }catch(e){}
  return out;
}
function beamPass(dt){
  try{
    var B=GRI.beam;
    if(B.on&&now()-B.last>.14)B.on=false;         /* soltou o disparo — feixe apaga */
    if(!B.on){B.targets={};return;}
    var dmgTick=(B.kind==='julgamento'?9:6.5)*P.dmgMult;
    GRI._beamAcc+=dt;
    var ticks=0;
    while(GRI._beamAcc>=GRI.beamTick&&ticks<4){
      GRI._beamAcc-=GRI.beamTick;ticks++;
      var list=beamTargets();
      var seen={};
      for(var i=0;i<list.length;i++){
        var tg=list[i],o=tg.obj,key=(tg.kindTag==='h'?'h':'e')+(o.__griId||(o.__griId=++GRI._uid));
        seen[key]=1;
        o.hp-=dmgTick;o.flash=Math.max(o.flash||0,.08);
        /* SINERGIAS DO FEIXE (8) */
        if(game.griSyn&&game.griSyn.feixevitral&&i===0&&list.length>1){ /* vitral: ramifica 30% num extra */
          list[1].obj.hp-=dmgTick*.3;
        }
        if(game.griw_relogio)o.slowT=Math.max(o.slowT||0,1.0);        /* feixe+relógio */
        if(game.griw_seloex){o._seloK=(o._seloK||0)+1;o._seloT=2;if(o._seloK>=3&&!o._seloBoom){o._seloK=0;o._seloBoom=.3;}} /* feixe+selo */
        if(game.griw_agulhas)o._caimT=Math.max(o._caimT||0,1.5);      /* feixe+agulhas: marca para perfuração */
        if(game.griw_coroag){for(var c=0;c<GRI.orb.length;c++){var ob2=GRI.orb[c]; /* feixe+coroa: orbitais convergem */
          var ca=Math.atan2(o.y-player.y,o.x-player.x);ob2.ang=ob2.ang*.7+ca*.3;}}
        gsparks(o.x,o.y,B.kind==='julgamento'?'#fff3c4':'#ffd9a0',3,140,.3,2);
      }
      /* alvo que saiu do feixe: estado reiniciado */
      for(var k in B.targets)if(!seen[k])delete B.targets[k];
      B.targets=seen;
      /* morte por feixe */
      for(var m=0;m<enemies.length;m++){var e2=enemies[m];if(!e2.dead&&e2.hp<=0)killEnemy(e2);}
      /* feixe+máscara: agenda o eco do feixe */
      if(game.griw_mascara&&list.length)GRI.beamEcho={t:now()+.1,dur:1.0,ang:B.ang,until:now()+1.1};
    }
  }catch(e){}
}
GRI._uid=0;

/* ================================================================
   9. O REGISTRO CENTRAL DE SINERGIAS — combinações reais entre itens
   Ativa/desativa sozinha; descoberta persiste em META.griSyn.
   ================================================================ */
var GRI_SYN=[
 {key:'sacristaomap',name:'O MAPA DO SACRISTÃO',need:['gri_olho_sacristao','gri_mapa_lamentacoes'],sub:'olho do sacristão + mapa das lamentações: cada andar começa com o sussurro das passagens — +25 almas de presente'},
 {key:'selorosario',name:'A VIGÍLIA PARTIDA',need:['gri_selo_vigilia','gri_rosario_partido'],sub:'selo da vigília + rosário partido: quando o selo bloqueia, ele também queima os efeitos negativos sobre Thor'},
 {key:'agulhaveredito',name:'A SENTENÇA DAS AGULHAS',need:['gri_agulhas','gri_cerberus'],sub:'agulhas do escrivão + dente de cerberus: alvos com 3 marcas recebem um leque concentrado de agulhas'},
 {key:'martelopedra',name:'O JUÍZO DE PEDRA',need:['gri_martelo','gri_coracao_pedra'],sub:'martelo do juízo + coração de pedra: impactos pesados não mais atordoam Thor — o juízo segue firme'},
 {key:'bumemascara',name:'O ECO DO RETORNO',need:['gri_bumerangue','gri_mascara'],sub:'lâmina bumerangue + máscara do eco: o retorno da lâmina deixa um eco ilusório que ainda corta (25% do dano)'},
 {key:'papirotinta',name:'TINTA E PAPEL',need:['gri_papiro','gri_tinta'],sub:'papiro cortante + tinta abissal: fragmentos que nascem das paredes deixam marcas de tinta no chão'},
 {key:'relogiopendulo',name:'O TEMPO OSCILANTE',need:['gri_relogio','gri_pendulo'],sub:'relógio partido + pêndulo do carrasco: balas oscilantes desenham o rastro da trajetória e desaceleram quem roça a fio'},
 {key:'coroaveu',name:'A COROA ABERTA',need:['gri_coroa_giratoria','gri_veu_navalhas'],sub:'coroa giratória + véu de navalhas: os projéteis orbitais saem em leque quando o tempo acaba'},
 {key:'caliceselo',name:'O VINHO DETONA',need:['gri_calice','gri_selo_explosivo'],sub:'cálice trincado + selo explosivo: a marca selada detona uma segunda explosão sagrada'},
 {key:'arpaolanca',name:'A FÉ APONTADA',need:['gri_arpao','gri_lanca'],sub:'arpão das almas + lança do peregrino: as lanças curvam para o alvo marcado pelo arpão'},
 {key:'feixevitral',name:'O VITRAL DO PECADO',need:['gri_feixe_pecado','gri_vitral'],sub:'feixe do primeiro pecado + estilhaços de vitral: o feixe ramifica em vitral — o alvo extra sofre 30% (sem acelerar o dano principal)'},
 {key:'sinoancora',name:'A ONDA FIRME',need:['gri_sinoferro','gri_ancora_alma'],sub:'sino de ferro + âncora da alma: cada onda do sino firma os pés — lentidão zerada e tremor pela metade'},
 {key:'paginaprazo',name:'A PÁGINA NO PRAZO',need:['gri_ultima_pagina','gri_prazo_final'],sub:'bênção da última página + prazo final: andar rápido sem o ativo solta uma recompensa épica'},
 {key:'portasduas',name:'AS DUAS SEGUNDAS PORTAS',need:['gri_selo_segunda_porta','gri_duas_portas'],sub:'selo da segunda porta + duas portas: todo tesouro deixa cair um presente temático extra'},
 {key:'cinzalampada',name:'A LUZ DAS DUAS LUAS',need:['gri_cinza_lunar','gri_lampada_circulo'],sub:'cinza lunar + lâmpada do primeiro círculo: suas balas brilham como lua cheia (+5% de almas da claridade)'}
];
function synScan(){
  try{
    if(!game.griSyn)game.griSyn={};
    for(var i=0;i<GRI_SYN.length;i++){var s=GRI_SYN[i];
      var ok=true;
      for(var j=0;j<s.need.length;j++)if(!(game.up[s.need[j]]>0)){ok=false;break;}
      if(ok&&!game.griSyn[s.key]){
        game.griSyn[s.key]=1;
        game.banner={type:'small',txt:'SINERGIA — '+s.name,sub:s.sub,t:0,dur:3.2};
        gsparks(player.x,player.y,'#c9a0ff',18,260,.7,3.5);
        try{sfx.levelup();blip('sine',600,900,.25,.12);}catch(e){}
        if(!META.griSyn[s.key]){META.griSyn[s.key]=1;saveMeta();}
      }else if(!ok&&game.griSyn[s.key]){
        delete game.griSyn[s.key];   /* item removido/perdido → sinergia desativa */
      }
    }
  }catch(e){}
}
function synergyPass(dt){
  try{
    GRI._synT=(GRI._synT||0)+dt;
    if(GRI._synT<.5)return;
    GRI._synT=0;
    synScan();
    /* selorosario: selo bloqueou → queima efeitos */
    if(game.griSyn&&game.griSyn.selorosario){
      if((game.shieldHits|0)<(GRI._prevShield|0)){player.burnT=0;player.poisT=0;player.slowT=0;}
      GRI._prevShield=game.shieldHits|0;
    }
    /* agulhaveredito: leque concentrado em marcados */
    if(game.griSyn&&game.griSyn.agulhaveredito){
      GRI._aguT=(GRI._aguT||0)-0.5;
      if(GRI._aguT<=0){
        for(var i=0;i<enemies.length;i++){var e=enemies[i];
          if(!e.dead&&(e._vmark|0)>=3&&dist(e.x,e.y,player.x,player.y)<420){
            GRI._aguT=1.2;
            var aa=Math.atan2(e.y-player.y,e.x-player.x);
            for(var k=0;k<3;k++)bullets.push({x:player.x,y:player.y,vx:Math.cos(aa+(k-1)*.07)*760,vy:Math.sin(aa+(k-1)*.07)*760,r:2.5,dmg:6*P.dmgMult,life:.9,a:aa,color:'#d8ecff',_griAgu:1});
            break;
          }}
      }
    }
    /* martelopedra: juízo firme — impactos pesados não atordoam */
    if(game.griSyn&&game.griSyn.martelopedra&&game.hitstop>0)game.hitstop*=.45;
    /* bumemascara: eco no retorno */
    if(game.griSyn&&game.griSyn.bumemascara){
      for(var b2=0;b2<bullets.length;b2++){var bb=bullets[b2];
        if(bb._griBumOx!==undefined&&!bb._griBumE){
          var dx2=bb.x-bb._griBumOx,dy2=bb.y-bb._griBumOy;
          var dNow=Math.hypot(dx2,dy2),dNext=Math.hypot(dx2+bb.vx*.05,dy2+bb.vy*.05);
          if(dNow>90&&dNext<dNow){
            bb._griBumE=1;
            bullets.push({x:bb._griBumOx,y:bb._griBumOy,vx:bb.vx*.6,vy:bb.vy*.6,r:4,dmg:bb.dmg*.25,life:.6,a:0,color:'#9d6bb5',_griEcho:1});
          }
        }}
    }
    /* papirotinta: fragmentos de parede deixam tinta */
    if(game.griSyn&&game.griSyn.papirotinta){
      for(var p3=0;p3<bullets.length;p3++){var bp=bullets[p3];
        if(bp._griPaper===0&&!bp._griInk){
          if(bp.x<ROOM.x+26||bp.x>ROOM.x+ROOM.w-26||bp.y<ROOM.y+26||bp.y>ROOM.y+ROOM.h-26){
            bp._griInk=1;GRI.zones.push({x:bp.x,y:bp.y,r:60,t:8,dmg:18*P.dmgMult,kind:'ink',tk:0});
          }
        }}
    }
    /* arpaolanca: lanças curvam para o marcado */
    if(game.griSyn&&game.griSyn.arpaolanca){
      var mk2=null;
      for(var m3=0;m3<enemies.length;m3++)if(!enemies[m3].dead&&enemies[m3]._arpaoT>0){mk2=enemies[m3];break;}
      if(mk2)for(var l3=0;l3<bullets.length;l3++){var bl3=bullets[l3];
        if(bl3._griLanca){
          var cb=Math.atan2(bl3.vy,bl3.vx),ta3=Math.atan2(mk2.y-bl3.y,mk2.x-bl3.x),d3=angDiff(ta3,cb);
          var sp3=Math.hypot(bl3.vx,bl3.vy),nb3=cb+clamp(d3,-1,1)*1.2*(1/60);
          bl3.vx=Math.cos(nb3)*sp3;bl3.vy=Math.sin(nb3)*sp3;
        }}
    }
    /* sinoancora: onda firma os pés */
    if(game.griSyn&&game.griSyn.sinoancora&&game.griw_sinoferro){
      if((GRI.sinoT|0)!==GRI._sinoPrev){GRI._sinoPrev=GRI.sinoT|0;
        if(GRI.sinoT>2){player.slowT=0;game.shake*=.5;}}
    }
    /* relogiopendulo: rastro + lentidão por roçar */
    if(game.griSyn&&game.griSyn.relogiopendulo){
      for(var o4=0;o4<bullets.length;o4++){var bo=bullets[o4];
        if(bo._griOsc){
          for(var e5=0;e5<enemies.length;e5++){var e6=enemies[e5];
            if(!e6.dead&&dist(e6.x,e6.y,bo.x,bo.y)<24+e6.r)e6.slowT=Math.max(e6.slowT||0,1.5);
          }}
      }
    }
    /* paginaprazo: recompensa épica do andar rápido */
    if(game.griSyn&&game.griSyn.paginaprazo){
      if((game.floor|0)!==(GRI._synFloor|0)){GRI._synFloor=game.floor|0;
        if(GRI._synFloor>1&&!game._griActiveUsed&&game._griFloorFast)dropRandomBlessing(player.x,player.y-30);
        game._griFloorFast=true;
      }
    }
  }catch(e){}
}

/* ================================================================
   10. GANCHOS DE SALA, ECONOMIA E RECOMPENSAS (wrappers preservados)
   ================================================================ */
function setupHooks(){
  try{
    /* roomCleared */
    var _rc=roomCleared;
    roomCleared=function(){
      _rc();
      try{
        var kind=(game.mapRooms&&game.mapRooms[game.roomIdx]&&game.mapRooms[game.roomIdx].kind)||'';
        var noDmg=!game.gri_hurtRoom;
        /* SINO DOS CONDENADOS */
        if(game.gri_sino&&noDmg){game.gri_sinoNext=true;gtxt(player.x,player.y-40,'O SINO ECOA — a sala seguinte treme','#cfd8dc',10);}
        /* OLHOS DE CARONTE */
        if(game.gri_caronte)game.gri_caronteVision=true;
        /* PÓ DE CONFISSÃO */
        if(game.gri_po&&Math.random()<.25){gainSouls(15);gtxt(player.x,player.y-44,'o pó sussurra: +15 almas','#bfd8e8',10);}
        /* MEDALHA DO PEREGRINO + CHAMA DO CONFESSOR */
        if(kind==='challenge'){
          if(game.gri_peregrino)gainSouls(30);
          if(game.gri_confessor&&noDmg){gainSouls(50);game.fagulha=(game.fagulha||0)+1;gtxt(player.x,player.y-46,'O CONFESSOR SORRI: +50','#ff8f3d',10);}
        }
        /* PRAZO FINAL */
        if(game.gri_prazo&&(game._roomT||0)>0&&(game._roomT|0)<12){gainSouls(20);gtxt(player.x,player.y-40,'PRAZO CUMPRIDO: +20','#c9a44c',10);}
        /* CONFISSÃO OBRIGATÓRIA */
        if(game.gri_confissao){
          game.gri_confK=(game.gri_confK||0)+1;
          if(game.gri_confK>=3){game.gri_confK=0;gainSouls(20);game.gri_confissaoT=30;
            gtxt(player.x,player.y-44,'CONFISSÃO: +20 almas · marca de pecado','#9d6bb5',10);}
        }
        /* APOSTA DO MERCADOR */
        if(game.gri_aposta&&noDmg&&Math.random()<.15){
          for(var a=0;a<2;a++){
            var _id=safe(function(){var pl=UPGRADES.filter(function(u){return u.can()&&u.q<=2;});return pl.length?pick(pl).id:'forca';})||'forca';
            pickups.push({type:'blessing_drop',dropType:'upgrade',dropId:_id,rarity:'comum',x:player.x+(a?46:-46),y:player.y-10,t:0,ph:rnd(TAU),griTTL:6});
          }
          gtxt(player.x,player.y-56,'O MERCADOR APOSTA: duas recompensas — uma some','#c9a44c',10);
        }
        /* PÁGINA RASGADA */
        if(game.gri_rasgada&&!game.gri_rasgUsed&&Math.random()<.15){
          game.gri_rasgUsed=true;
          var roll2=Math.random();
          if(roll2<.4){gainSouls(25);gtxt(player.x,player.y-40,'PÁGINA RASGADA: +25 almas','#c9b08a',10);}
          else if(roll2<.7){game.fagulha=(game.fagulha||0)+1;gtxt(player.x,player.y-40,'PÁGINA RASGADA: fagulha','#c9b08a',10);}
          else pickups.push({type:'heart',x:player.x,y:player.y-34,t:0,ph:rnd(TAU)});
        }
        game.gri_hurtRoom=false;game._roomT=0;
      }catch(e){}
    };
    /* rollUpgrades — O ATALHO (3ª carta) e DUAS PORTAS (tesouro sempre 2) */
    var _ru=rollUpgrades;
    rollUpgrades=function(){
      var out=_ru();
      try{
        if(game.gri_atalho&&out.length<3){
          var extra=_ru();
          for(var i=0;i<extra.length&&out.length<3;i++){
            var dup=false;
            for(var j=0;j<out.length;j++)if(out[j].id===extra[i].id)dup=true;
            if(!dup)out.push(extra[i]);
          }
        }
        if(game.gri_duasportas&&game.treasureOpen&&out.length<2){
          var extra2=_ru();
          if(extra2.length)out.push(extra2[0]);
        }
      }catch(e){}
      return out;
    };
    /* chooseUpgrade — assinatura falsa, penhor da memória */
    var _cu=chooseUpgrade;
    chooseUpgrade=function(u){
      try{GRI.lastItem={id:u.id,q:u.q};}catch(e){}
      _cu(u);
      try{
        if(game.gri_assin&&!game.gri_assinFloor){game.gri_assinFloor=true;
          if(Math.random()<.25){
            var pl=UPGRADES.filter(function(x){return x.can()&&x.q<=2&&x.id!==u.id;});
            if(pl.length){var g=pick(pl);g.apply();game.up[g.id]=(game.up[g.id]||0)+1;
              gtxt(player.x,player.y-46,'A ASSINATURA ERA FALSA: '+g.name,'#c9b08a',11);}
          }
        }
        if(game.gri_penhor&&!game.gri_penhorUsed&&GRI.lastItem&&GRI.lastItem.id!==u.id){
          var def=null;
          for(var d=0;d<UPGRADES.length;d++)if(UPGRADES[d].id===GRI.lastItem.id){def=UPGRADES[d];break;}
          if(def&&(def.max||1)>1){game.gri_penhorUsed=true;def.apply();game.up[def.id]=(game.up[def.id]||0)+1;
            gtxt(player.x,player.y-46,'O PENHOR REPETE: '+def.name+' (fraco)','#9d6bb5',11);}
        }
      }catch(e){}
    };
    /* openTreasure — porta fechada, moeda marcada, portasduas */
    var _ot=openTreasure;
    openTreasure=function(){
      try{
        if(game.gri_moeda&&Math.random()<.25){
          gainSouls(60);sfx.soul();
          gtxt(player.x,player.y-40,'A MOEDA MARCADA: só poeira','#8a7d6c',11);
          return;
        }
      }catch(e){}
      _ot();
      try{
        if(game.gri_porta){
          if(Math.random()<.5){
            for(var w=0;w<3+irnd(0,2);w++)safe(function(){spawnEnemy('sh',player.x+rnd(-160,160),player.y+rnd(-120,120));});
            game.banner={type:'small',txt:'A PORTA FECHADA',sub:'sombras esperavam atrás do tesouro',t:0,dur:2.6};
            try{sfx.growl();}catch(e){}
          }else dropRandomBlessing(player.x+40,player.y-30);
        }
        if(game.griSyn&&game.griSyn.portasduas){
          var _id2=safe(function(){var pl=UPGRADES.filter(function(u){return u.can()&&u.q>=3;});return pl.length?pick(pl).id:null;});
          if(_id2)pickups.push({type:'blessing_drop',dropType:'upgrade',dropId:_id2,rarity:'temático',x:player.x-60,y:player.y-30,t:0,ph:rnd(TAU)});
        }
      }catch(e){}
    };
    /* tryActiveItem — última página, segunda voz */
    var _ta=tryActiveItem;
    tryActiveItem=function(){
      game._griActiveUsed=true;
      _ta();
      try{
        if(game.gri_voz&&game.activeCd>0){
          game.activeCd=Math.max(1,game.activeCd*.65);
          if(Math.random()<.10){
            var key=game.activeItem,it=key?ACTIVE_ITEMS[key]:null;
            if(it&&it.activate){setTimeout(function(){try{if(game.state==='play'){it.activate();gtxt(player.x,player.y-40,'A SEGUNDA VOZ ECOA','#9d6bb5',11);}}catch(e){}},900);}
          }
          gtxt(player.x,player.y-34,'a voz volta mais cedo','#9d6bb5',9);
        }
      }catch(e){}
    };
    /* gainSouls — papiro, credor, moeda, cinzalampada */
    var _gs=gainSouls;
    gainSouls=function(n){
      try{
        var mul=1;
        if(game.gri_papiro)mul*=1.08;
        if(game.gri_moeda)mul*=1.25;
        if(game.griSyn&&game.griSyn.cinzalampada)mul*=1.05;
        if(game.gri_credor&&GRI._credorK>0){GRI._credorK--;n=Math.round(n*.5);}
        return _gs(Math.max(0,Math.round(n*mul)));
      }catch(e){return _gs(n);}
    };
    /* startGame — magika + reset do grimório */
    var _sg=startGame;
    startGame=function(w){
      _sg(w);
      try{
        GRI.magikaRoll();
        game.gri_velaUsed=false;game.gri_fiadoFloor=false;game.gri_assinFloor=false;
        game.gri_penhorUsed=false;game.gri_rasgUsed=false;game.gri_hurtRoom=false;game._roomT=0;
        game._griLastFloor=game.floor;
        GRI.beam.on=false;GRI.beam.targets={};GRI.zones.length=0;GRI.orb.length=0;GRI.echoQ.length=0;
        if(game.gri_mapa&&game.mapRooms){
          var cnt={};
          game.mapRooms.forEach(function(r){cnt[r.kind]=(cnt[r.kind]||0)+1;});
          var parts=[];for(var k in cnt)parts.push(cnt[k]+' '+k);
          game.banner={type:'small',txt:'O MAPA DAS LAMENTAÇÕES',sub:'este andar sustenta: '+parts.join(' · '),t:0,dur:3.4};
        }
      }catch(e){}
    };
    /* renderBook — mensagem da Magika + seção de sinergias do grimório */
    var _rb=renderBook;
    renderBook=function(){
      _rb();
      try{
        var body=document.getElementById('bookBody');
        if(!body)return;
        if(body.innerHTML.indexOf('OS PARES DO INFERNO')>=0){
          var h='<div class="bkSec">O GRIMÓRIO DAS CEM ALMAS — COMBINAÇÕES NOVAS</div>';
          for(var i=0;i<GRI_SYN.length;i++){var s=GRI_SYN[i];
            var got=META.griSyn[s.key];
            h+='<div class="bkRow'+(got?' ficha':'')+'"><b>'+(got?s.name:'? ? ?')+'</b><span>'+(got?'descoberta':'escondida')+'</span>';
            h+='<em>'+(got?s.sub:'duas peças do grimório que ainda não se encontraram')+'</em></div>';
          }
          body.innerHTML+='<div style="margin-top:14px">'+h+'</div>';
        }
        if(GRI.magikaActive('mensagem_velha')){
          body.innerHTML='<div class="bkSec" style="color:#9d6bb5">MAGIKA · '+game.magika+'</div><div class="bkEmpty">"a décima terceira descida escreveu entre as linhas: ELA VOLTA PELO QUE É DELO."</div>'+body.innerHTML;
        }
      }catch(e){}
    };
  }catch(e){}
}
/* ================================================================
   11. DESENHO DO GRIMÓRIO — feixes, marcas, zonas, luz e Magika
   ================================================================ */
GRI.drawWorld=function(ctx,ox,oy){
  try{
    if(game.state!=='play'&&game.state!=='boss'&&game.state!=='vsintro'&&game.state!=='dead')return;
    ctx.save();ctx.translate(ox,oy);
    var i;
    /* LÂMPADA DO PRIMEIRO CÍRCULO */
    if(game.gri_lampada){
      var lg=ctx.createRadialGradient(player.x,player.y,10,player.x,player.y,180);
      lg.addColorStop(0,'rgba(255,243,196,.10)');lg.addColorStop(1,'rgba(255,243,196,0)');
      ctx.fillStyle=lg;ctx.fillRect(player.x-190,player.y-190,380,380);
    }
    /* LENTE DO ASTRÓLOGO — fio de direção nas balas lentas */
    if(game.gri_lente){
      ctx.strokeStyle='rgba(230,218,196,.22)';ctx.lineWidth=1;
      for(i=0;i<ebullets.length;i++){var lb=ebullets[i];
        if(lb.fake||lb.home)continue;
        var lv=Math.hypot(lb.vx,lb.vy);
        if(lv<300&&lv>40){
          var ln=lv/300*14;
          ctx.beginPath();ctx.moveTo(lb.x,lb.y);ctx.lineTo(lb.x+lb.vx/lv*ln,lb.y+lb.vy/lv*ln);ctx.stroke();
        }}
    }
    /* ZONAS: chamas, tinta, nuvens */
    for(i=0;i<GRI.zones.length;i++){var z=GRI.zones[i];
      if(z.kind==='flame'){
        ctx.globalAlpha=.28+Math.sin(game.t*9+i)*.1;
        ctx.fillStyle='#ff8f3d';ctx.beginPath();ctx.arc(z.x,z.y,z.r*(0.7+Math.sin(game.t*6)*.15),0,TAU);ctx.fill();
        ctx.globalAlpha=1;
      }else if(z.kind==='ink'){
        ctx.globalAlpha=.5;ctx.fillStyle='#181022';
        ctx.beginPath();ctx.arc(z.x,z.y,z.r*.8,0,TAU);ctx.fill();ctx.globalAlpha=1;
      }else if(z.kind==='cloud'){
        ctx.globalAlpha=.22;ctx.fillStyle='#8f8577';
        ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();ctx.globalAlpha=1;
      }
    }
    /* ÓRBITAS DA COROA */
    for(i=0;i<GRI.orb.length;i++){var ob=GRI.orb[i];
      ctx.fillStyle='#ffd9a0';ctx.beginPath();ctx.arc(player.x+Math.cos(ob.ang)*34,player.y+Math.sin(ob.ang)*34,5,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(255,217,160,.3)';ctx.beginPath();ctx.arc(player.x,player.y,34,0,TAU);ctx.stroke();
    }
    /* MARCAS: veredito, caim, arpão, selo, prego, sobrevivente, memória */
    for(i=0;i<enemies.length;i++){var e=enemies[i];if(e.dead)continue;
      if((e._vmark|0)>0){
        ctx.fillStyle='#c9a44c';
        for(var v2=0;v2<e._vmark;v2++){var va=game.t*2+v2*1.05;
          ctx.fillRect(e.x+Math.cos(va)*(e.r+7)-2,e.y+Math.sin(va)*(e.r+7)-2,4,4);}
      }
      if(e._caimT>0){ctx.fillStyle='rgba(217,70,90,.8)';ctx.beginPath();ctx.arc(e.x,e.y-e.r-6,2.5,0,TAU);ctx.fill();}
      if(e._arpaoT>0){ctx.strokeStyle='#7fb8ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(e.x,e.y,e.r+5,0,TAU);ctx.stroke();
        gtxt2(ctx,e.x,e.y-e.r-14,'⚓','#7fb8ff');}
      if(e._pregoT>0){ctx.fillStyle='#c9b08a';ctx.fillRect(e.x-1.5,e.y-e.r-10,3,8);}
      if(e._griLastOne){gtxt2(ctx,e.x,e.y-e.r-12,'♛','#ffd9a0');}
      if(game.gri_memDmgT>0&&(e.type==='mb'||e.type==='ex'||e.type==='vi'||e.type==='gz')){
        ctx.strokeStyle='rgba(201,164,76,.5)';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(e.x,e.y,e.r+12+Math.sin(game.t*5)*2,0,TAU);ctx.stroke();
      }
    }
    /* REFLEXO DO ESPELHO (pacto) */
    if(GRI.decoy){
      ctx.globalAlpha=.35;ctx.fillStyle='#9d6bb5';
      ctx.beginPath();ctx.arc(GRI.decoy.x,GRI.decoy.y,11,0,TAU);ctx.fill();
      ctx.globalAlpha=1;
    }
    /* ILUSÃO DA CULPA (1×/andar) */
    if(GRI.ghost&&GRI.ghost.t>0){
      GRI.ghost.t-=1/60;
      ctx.globalAlpha=Math.min(.4,GRI.ghost.t*.3);
      ctx.fillStyle='#4a3a5a';
      ctx.beginPath();ctx.arc(GRI.ghost.x,GRI.ghost.y,14,0,TAU);ctx.fill();
      ctx.globalAlpha=1;
    }
    /* O FEIXE — desenhado por cima de tudo, com carga apenas VISUAL */
    var B=GRI.beam;
    if(B.on){
      var range=430*P.reachMult;
      var ex=player.x+Math.cos(B.ang)*range,ey=player.y+Math.sin(B.ang)*range;
      var col=B.kind==='julgamento'?'#fff3c4':'#ffd9a0';
      var wid=(B.kind==='julgamento'?7:5)+Math.sin(game.t*24)*1.2;
      ctx.globalAlpha=.35;ctx.strokeStyle=col;ctx.lineWidth=wid*2.6;
      ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(ex,ey);ctx.stroke();
      ctx.globalAlpha=.95;ctx.lineWidth=wid;
      ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(ex,ey);ctx.stroke();
      ctx.globalAlpha=1;ctx.strokeStyle='#fff';ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(ex,ey);ctx.stroke();
    }
    if(GRI.beamEcho&&now()<GRI.beamEcho.until){ /* máscara do eco: eco visual do feixe */
      ctx.globalAlpha=.3;
      ctx.strokeStyle='#9d6bb5';ctx.lineWidth=3;
      var ee=430*P.reachMult;
      ctx.beginPath();ctx.moveTo(player.x,player.y);
      ctx.lineTo(player.x+Math.cos(GRI.beamEcho.ang+.2)*ee,player.y+Math.sin(GRI.beamEcho.ang+.2)*ee);ctx.stroke();
      ctx.globalAlpha=1;
    }
    /* PÊNDULO: rastro da trajetória (sinergia com relógio) */
    if(game.griSyn&&game.griSyn.relogiopendulo){
      ctx.strokeStyle='rgba(230,218,196,.14)';ctx.lineWidth=1;
      for(i=0;i<bullets.length;i++){var pb=bullets[i];
        if(pb._griOsc){ctx.beginPath();ctx.moveTo(pb.x,pb.y);ctx.lineTo(pb.x-pb.vx*.06,pb.y-pb.vy*.06);ctx.stroke();}}
    }
    /* ESCRIVÃO: vida dos senhores em número */
    if(game.gri_escrivao){
      ctx.font='600 10px IBM Plex Mono,monospace';ctx.textAlign='center';
      for(i=0;i<enemies.length;i++){var eb2=enemies[i];
        if(eb2.dead)continue;
        if(eb2.type==='mb'||eb2.type==='ex'||eb2.type==='vi'||eb2.type==='gz'){
          ctx.fillStyle='#e6dac4';
          ctx.fillText(Math.max(0,Math.ceil(eb2.hp))+' / '+eb2.maxHp,eb2.x,eb2.y-eb2.r-12);
        }
      }
    }
    ctx.restore();
    /* MAGIKA — tinta de tela (espaço de tela, sem a câmera) */
    if(GRI.magikaActive('luz_estranha')){
      ctx.fillStyle='rgba(80,40,120,.07)';ctx.fillRect(0,0,W,H);
    }
    if(GRI.magikaActive('paleta_pallida')){
      ctx.fillStyle='rgba(190,200,205,.08)';ctx.fillRect(0,0,W,H);
    }
    if(GRI.magikaActive('sombra_aparicao')&&GRI.magikaActive('sombra_aparicao')){
      var ap=(Math.sin(game.t*.7)+1)/2;
      if(ap>.86){
        ctx.globalAlpha=(ap-.86)*5;
        ctx.fillStyle='#241731';
        ctx.beginPath();ctx.arc(W*.12,H*.2,26,0,TAU);ctx.fill();
        ctx.globalAlpha=1;
      }
    }
  }catch(e){}
};
function gtxt2(ctx,x,y,s,col){try{ctx.font='600 11px IBM Plex Mono,monospace';ctx.textAlign='center';ctx.fillStyle=col;ctx.fillText(s,x,y);}catch(e){}}

/* ================================================================
   12. A ABERTURA DO LIVRO — capa que abre, tinta que revela, sem prender
   ================================================================ */
var INTRO_CSS='';
function buildBookIntro(){
  try{
    if(document.getElementById('bookIntro'))return;
    var seen=false;
    try{seen=localStorage.getItem('thor_intro_v19')==='1';}catch(e){}
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)seen=true;
    var d=document.createElement('div');
    d.id='bookIntro';
    d.innerHTML='<div class="bi-dark"></div><div class="bi-light"></div>'+
      '<div class="bi-book"><div class="bi-cover"><span class="bi-sym">✠</span><span class="bi-t">THOR</span><span class="bi-t2">REVENGE</span></div>'+
      '<div class="bi-pgs"><div class="bi-pg l"></div><div class="bi-pg r"></div></div>'+
      '<div class="bi-title">THOR: REVENGE</div><div class="bi-sub">o grimório das cem almas · v1.9.0</div></div>'+
      '<div class="bi-skip">clique para abrir o livro</div>';
    document.body.appendChild(d);
    var css=document.createElement('style');css.textContent=INTRO_CSS;document.head.appendChild(css);
    function kill(quick){
      try{
        d.classList.add(quick?'bi-out-fast':'bi-out');
        try{localStorage.setItem('thor_intro_v19','1');}catch(e){}
        setTimeout(function(){try{d.remove();css.remove();}catch(e){}},quick?350:900);
      }catch(e){}
    }
    d.addEventListener('click',function(){kill(true);});
    window.addEventListener('keydown',function esc(ev){if(d.isConnected){kill(true);window.removeEventListener('keydown',esc);}},{once:false});
    /* qualquer erro de áudio/carregamento NUNCA prende o menu */
    setTimeout(function(){if(d.isConnected&&!d.classList.contains('bi-out'))kill(false);},8200);
    if(seen){kill(true);return;}
    /* a sequência: preto → luz → capa abre → páginas → tinta → fora */
    setTimeout(function(){d.classList.add('bi-s1');},150);
    setTimeout(function(){d.classList.add('bi-s2');},1400);
    setTimeout(function(){d.classList.add('bi-s3');},2600);
    setTimeout(function(){d.classList.add('bi-s4');},3600);
    setTimeout(function(){d.classList.add('bi-s5');},4900);
    setTimeout(function(){kill(false);},5900);
  }catch(e){
    safe(function(){var b=document.getElementById('bookIntro');if(b)b.remove();});
  }
}
INTRO_CSS='#bookIntro{position:fixed;inset:0;z-index:60;background:#020102;display:flex;align-items:center;justify-content:center;transition:opacity .9s;perspective:1200px}'+
'#bookIntro.bi-out{opacity:0;pointer-events:none}#bookIntro.bi-out-fast{opacity:0;pointer-events:none;transition:opacity .3s}'+
'#bookIntro .bi-dark{position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 55%,rgba(60,34,16,.16),transparent 70%)}'+
'#bookIntro .bi-light{position:absolute;inset:0;opacity:0;transition:opacity 2.4s;background:radial-gradient(34% 28% at 50% 54%,rgba(255,214,150,.16),transparent 70%)}'+
'#bookIntro.bi-s1 .bi-light{opacity:1}'+
'.bi-book{position:relative;width:min(430px,78vw);height:min(330px,52vh)}'+
'.bi-cover{position:absolute;inset:0;transform-origin:left center;transform-style:preserve-3d;transition:transform 2.3s cubic-bezier(.32,.66,.24,1);backface-visibility:hidden;-webkit-backface-visibility:hidden;'+
'background:linear-gradient(118deg,#231610 0%,#33211494 34%,#1a100a 70%,#2b1a10 100%);border:2px solid #0e0805;border-radius:6px 12px 12px 6px;'+
'box-shadow:inset 0 0 46px rgba(0,0,0,.85),0 18px 60px rgba(0,0,0,.7);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;z-index:3}'+
'#bookIntro.bi-s2 .bi-cover{transform:rotateY(-138deg)}'+
'.bi-sym{font-family:"Metamorphous",serif;font-size:34px;color:#8a6d3a;text-shadow:0 0 14px rgba(138,109,58,.4)}'+
'.bi-t{font-family:"Pirata One",serif;font-size:40px;color:#c9b08a;letter-spacing:.14em}'+
'.bi-t2{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.5em;color:#a52a3a}'+
'.bi-pgs{position:absolute;inset:6px;border-radius:4px 10px 10px 4px;background:linear-gradient(100deg,#b9a67f 0%,#c9b78e 46%,#9c8b66 54%,#b3a17a 100%);opacity:0;transition:opacity 1.4s .5s;box-shadow:inset 0 0 30px rgba(60,42,20,.5)}'+
'#bookIntro.bi-s2 .bi-pgs{opacity:1}'+
'.bi-pg{position:absolute;top:0;bottom:0;width:50%;background:linear-gradient(180deg,#c2b088,#ab9a72)}'+
'.bi-pg.l{left:0;border-radius:4px 0 0 4px;box-shadow:inset -12px 0 24px rgba(60,42,20,.35)}'+
'.bi-pg.r{right:0;border-radius:0 4px 4px 0;box-shadow:inset 12px 0 24px rgba(60,42,20,.35)}'+
'.bi-title{position:absolute;left:0;right:0;top:38%;text-align:center;font-family:"Pirata One",serif;font-size:clamp(26px,4.6vw,42px);color:#2b1d10;opacity:0;transition:opacity 1.6s,letter-spacing 1.6s;letter-spacing:.4em;z-index:4}'+
'#bookIntro.bi-s3 .bi-title{opacity:.92;letter-spacing:.12em}'+
'.bi-sub{position:absolute;left:0;right:0;top:55%;text-align:center;font-family:"IM Fell English SC",serif;font-size:13px;color:#4a3520;opacity:0;transition:opacity 1.5s;z-index:4}'+
'#bookIntro.bi-s4 .bi-sub{opacity:.85}'+
'.bi-skip{position:absolute;bottom:26px;left:0;right:0;text-align:center;font-family:"IBM Plex Mono",monospace;font-size:9px;letter-spacing:.3em;color:#6e5a3a;opacity:.6}'+
'@media (prefers-reduced-motion:reduce){#bookIntro{display:none}}';

/* ================================================================
   13. O QUADRO MESTRE + BOTAÇÃO
   ================================================================ */
GRI.frame=function(dt){
  try{
    var inPlay=game.state==='play';
    if(inPlay){
      game._roomT=(game._roomT||0)+dt;
      statusPass(dt);
      aiPass(dt);
      bulletPass(dt);
      weaponTimers(dt);
      zonePass(dt);
      synergyPass(dt);
      beamPass(dt);
      magikaPass(dt);
      /* APOSTA DO MERCADOR: recompensa ignorada desaparece */
      for(var i=pickups.length-1;i>=0;i--){var p=pickups[i];
        if(p.griTTL!==undefined){p.griTTL-=dt;if(p.griTTL<=0){pickups.splice(i,1);gtxt(p.x,p.y-14,'a recompensa descartada apodreceu','#8a7d6c',9);}}}
      /* CREDOR DAS CINZAS: ao ser atingido, o credor cobra as próximas coletas */
    }
  }catch(e){}
};
function setupFx(){
  try{
    /* vinheta de status (queimadura/veneno) — DOM, zero toque no canvas do HUD */
    if(!document.getElementById('griFx')){
      var f=document.createElement('div');f.id='griFx';document.body.appendChild(f);
      var st=document.createElement('style');
      st.textContent='#griFx{position:fixed;inset:0;z-index:12;pointer-events:none;opacity:0;transition:opacity .4s;box-shadow:inset 0 0 120px rgba(255,143,61,.55)}';
      document.head.appendChild(st);
    }
  }catch(e){}
}
function updateFx(){
  try{
    var f=document.getElementById('griFx');if(!f)return;
    var b=(player.burnT||0)>0,p2=(player.poisT||0)>0;
    if(b){f.style.boxShadow='inset 0 0 120px rgba(255,143,61,.55)';f.style.opacity='.85';}
    else if(p2){f.style.boxShadow='inset 0 0 120px rgba(168,194,79,.5)';f.style.opacity='.8';}
    else f.style.opacity='0';
  }catch(e){}
}
function setupFrame(){
  try{
    var E=window.__EXPANSION;
    if(E&&typeof E.frame==='function'){
      var _ef=E.frame;
      E.frame=function(dt){_ef(dt);GRI.frame(dt);updateFx();};
      /* credor das cinzas + âncora (tremor) após cada dano */
      if(typeof E.afterHurt==='function'){
        var _ah=E.afterHurt;
        E.afterHurt=function(){
          _ah();
          try{
            if(game.gri_credor)GRI._credorK=3;
            if(game.gri_ancora)game.shake*=.7;
          }catch(e){}
        };
      }
    }else{
      /* rede de segurança: sem a expansion, o grimório roda por conta própria */
      setInterval(function(){try{GRI.frame(1/60);updateFx();}catch(e){}},16);
    }
    /* CHAVE DO PURGATÓRIO: [R] re-sorteia as cartas 1× por andar */
    window.addEventListener('keydown',function(ev){
      try{
        if((ev.key==='r'||ev.key==='R')&&game.state==='levelup'&&game.gri_chave&&!game.gri_chaveUsedFloor){
          game.gri_chaveUsedFloor=true;
          buildUpgradeCards(!!game.treasureOpen);
          gtxt(player.x,player.y-44,'A CHAVE VIRA A PÁGINA','#c9b08a',11);
          try{blip('sine',700,980,.2,.1);}catch(e){}
        }
      }catch(e){}
    });
  }catch(e){}
}
/* ============ BOTAÇÃO ============ */
function boot(){
  try{register();}catch(e){}
  try{setupWeapons();}catch(e){}
  try{setupAI();}catch(e){}
  try{setupHooks();}catch(e){}
  try{setupFx();}catch(e){}
  try{setupFrame();}catch(e){}
  /* v1.9.2: a abertura agora é o LIVRO VIVO (livro.js) + a INTRODUÇÃO
     CINEMATOGRÁFICA (intro.js) — a capa antiga sai de cena para as
     aberturas nunca brigarem na mesma mesa (guard à prova de versão) */
  try{if(window.__BOOK)return;}catch(e){}
  try{
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',buildBookIntro);
    else buildBookIntro();
  }catch(e){}
  /* O GRIMÓRIO DAS CEM ALMAS — pronto. */
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
