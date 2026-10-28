# THOR REVENGE — v1.9.2 "O LIVRO VIVO · A INTRODUÇÃO CINEMATOGRÁFICA" (v60: CÍRCULOS fecha o livro e mostra
# a LOUSA — os nove círculos desenhados a giz, cada ciclo no seu anel, e UM círculo
# fora do desenho: a PENUMBRA DAS ALMAS · cada opção vira uma folha com aproximação
# de câmera própria · MENU MAIS LEVE: o mundo atrás do menu não é mais desenhado,
# velas/poeira dormem quando outra tela cobre o livro, capa sem filter por quadro ·
# todo o resto do livro vivo v58 continua: capa com lombada, conteúdo JÁ ESCRITO,
# registro das almas, página de ajustes, abertura pulável, ANIMAÇÕES DO LIVRO ·
# EDITOR DE MODS segue fora do jogo — a forja é o mod-studio.html)

## NOVO (v60 / v1.9.2) — A INTRODUÇÃO CINEMATOGRÁFICA (intro.js)
Depois da abertura do livro, a câmera MERGULHA no manuscrito e a história proibida se
torna real: a prancha do grande abismo, o Inferno registrado em camadas (muralhas,
portas fechadas, silhuetas na fumaça), as frases nas margens ("Toda queda tem um
começo." / "Nem toda alma chega ao fim de sua jornada."), a região quase vazia onde
THOR — o cachorro morto-vivo — acorda com peso (ergue a cabeça, olha os próprios
membros, silêncio) e caminha para a passagem; a câmera volta ao livro (a ilustração
mudou; a anotação registra "O corpo foi perdido. A vontade permaneceu."), a marca de
tinta aparece sozinha na margem ("ele acordou.") e o desenho vira o mundo — o papel
some, os traços ganham volume, a paleta fria da Penumbra assume. O THOR REVENGE
revela-se sobre o corredor final com o INICIAR abaixo.
· ~45s na primeira apresentação; PULÁVEL (clique/tecla/roda, dica discreta no canto).
· Não repete automaticamente (thorCineSeen); "rever a introdução" fica na ENTRADA.
· Respeita ANIMAÇÕES DO LIVRO=DESLIGADAS, mudo e volumes; dorme com a aba oculta.
· Zero sobras: loop morto no fim, canvas removido, áudio encerrado.
· Arquitetura: UM canvas #cineCv com UM rAF próprio; toda a arte pré-renderizada 1×
  (prancha 1280×2000, chão, corredor, livro, grão, vinheta); palco 1280×720 cover-fit
  (qualquer resolução); duração por dt real (teto .25s); watchdog próprio.
· Pure incremental: zero mudança em gameplay, saves, lousa, handlers e sprites.

## NOVO (v59 / v1.9.1) — A LOUSA DOS CÍRCULOS + MENU MAIS LEVE

- **A LOUSA**: clicar CÍRCULOS fecha o livro devagar (capa com peso) e mostra a
  lousa de giz: os NOVE anéis concêntricos com cada ciclo no seu anel (os mortos
  riscados a giz vermelho), PARAÍSO em cima, LIMBO embaixo — e **UM círculo FORA
  do desenho: a PENUMBRA DAS ALMAS** (a descida começa ali). I — ABISMO continua
  com o cartão de giz "descer direto, sem levar nada"; a porta da ESCOLA continua
  existindo (o jogo decide quando mostrar). Ao sair da lousa, o livro REABRE
  sozinho e a câmera volta pra casa. Arte estática em SVG (filtro de giz
  rasterizado 1×) — zero custo por quadro; IDs preservados (circlePenumbra/
  circleLimbo/circleEscola/circlesBack) — os handlers originais seguem mandando.
- **CADA OPÇÃO = UMA FOLHA + POSE PRÓPRIA**: ALMAS (1.16×, esquerda da página
  direita), INVENTÁRIO (1.09×), GRIMÓRIO (1.19×, página esquerda), CONTINUAR vira
  a folha marcada e MERGULHA (1.3×), MODS RECUA a câmera (folha solta maior) —
  e a câmera só volta pra casa quando a tela abre por cima fecha.
- **MENU MAIS LEVE (não trava)**: o loop do jogo NÃO desenha mais o mundo atrás
  do menu (o livro cobre a tela — o render volta no mesmo tick ao sair); velas e
  poeira DORMEM quando a lousa/mapa/lista/opções cobrem o livro; a capa em
  movimento usa uma classe CSS de sombra (sem filter re-pintado por quadro); poeira
  em canvas menor (12 motas, a cada 3 quadros); largura da câmera em cache.

## NOVO (v58 — histórico) — O LIVRO VIVO

- **O LIVRO FÍSICO**: mesa de carvalho pintada 1× (canvas estático), duas velas com
  chamas a 11 fps, 16 motas de poeira, capa de couro com lombada/✠ que abre com peso
  (dip de mão, assentamento, primeira folha) e **conteúdo já escrito nas páginas** —
  sem tela vazia em nenhum momento. Pule com um clique/tecla; da 2ª visita a abertura
  fica curta; `prefers-reduced-motion` pula direto.
- **INTERAÇÃO POR OPÇÃO**: DESCER vira a página do mapa desenhado a tinta; RETORNAR
  volta ao REGISTRO DAS ALMAS (saves = inscrições com nome/karma/estado — carregar,
  renomear, queimar, restaurar cinza, exportar/importar, com zoom da câmera na folha);
  OPÇÕES pousa "Das Marcas e Ajustes" (controles como anotações, sliders de tinta);
  CÍRCULOS/ALMAS/INVENTÁRIO/GRIMÓRIO ganham folha rápida + pousada própria; MODS
  entra como folha solta; ABANDONAR fecha o livro devagar (e reabre com a despedida).
- **ENGENHARIA**: câmera 3D por transform (GPU), folha com dobra/sombra, easing real,
  UMA transição por vez + watchdog — o menu nunca fica travado; teclado (Tab/Enter)
  intacto; o menu pode abrir/fechar quantas vezes for sem duplicar nada.
- **DESEMPENHO**: UM loop rAF para tudo que DORME quando o menu sai da tela/aba
  oculta; velas 11 fps em canvases 40×58; poeira a cada 2 quadros; nada de
  blur/filter por quadro; mapa tinta pré-renderizado 1×.
- **ANIMAÇÕES DO LIVRO**: opção nova (COMPLETAS/LEVES/DESLIGADAS) nas OPÇÕES.
- **O EDITOR DE MODS SAIU DO JOGO**: mods.js ficou com O GERENCIADOR (importar o
  JSON do studio, ativar/desativar/exportar/excluir + abrir o studio) — o motor
  segue rodando mods importados (balas, 8 formatos, padrões, spell cards, máquinas,
  sprites, buff/nerf). mods.js: 3066 → ~860 linhas, runtime intacto.

# THOR REVENGE (v57 — histórico: 100 novos itens com efeitos 100 novos itens com efeitos
# reais — 34 bênçãos · 33 pactos · 33 armas · FEIXES raríssimos com dano por TICK a
# cada 5 quadros sem acúmulo · pactos bem mais difíceis de selar · inimigos aplicam
# queimadura/veneno/lentidão ao Thor · IA com antecipação e encurralamento, Coisa de
# Cervo mais lenta que o jogador · ZERO drenagem passiva de vida · 15 sinergias
# centrais + 8 de feixe · MAGIKA com sorteio por descida · menu-livro com abertura
# animada · MOD STUDIO EXTERNO mod-studio.html)

## NOVO (v57 / v1.9.0) — O GRIMÓRIO DAS CEM ALMAS

- **CEM ITENS NOVOS (grimoria.js)**: 34 BÊNÇÃOS (Selo da Vigília bloqueia 1 golpe
  por sala; Dente do Veredito empilha marcas e detona a cada 6; Rosário Partido
  encurta efeitos negativos; Seis portas de recompensa em dobro…), 33 PACTOS (risco
  claro, vantagem real — e NENHUM drena vida: Juros de Sangue paga 20 de vida máxima
  UMA vez, na hora; Contrato de Vidro troca dano por dano recebido ×1.5…) e 33
  ARMAS (Agulhas do Escrivão, Martelo do Juízo, Lâmina Bumerangue, Tinta Abissal,
  Coroa Giratória, Roda do Inferno, Arpão das Almas, Pêndulo do Carrasco…).
- **FEIXES**: Feixe do Primeiro Pecado (q5, depois da 1ª descida) e Raio do Último
  Julgamento (q6, depois da 2ª). Segure o disparo: dano por TICK a cada 5 quadros
  (temporizador acumulado — independente do FPS), o dano NUNCA acumula por
  permanecer no alvo, a carga é só visual, e cada alvo alinhado recebe
  independentemente. 8 sinergias exclusivas de feixe (agulhas, relógio, vitral,
  selo, coroa, cálice, máscara, arpão).
- **PACTOS MAIS DIFÍCEIS**: peso ×0.35 nas cartas, 15% no chão, fora do básico da
  feira (e 25% na rara), o altar de sangue cobra 30 de vida e escala +10 por uso.
- **INIMIGOS APLICAM EFEITOS**: balas de fogo queimam, verdes envenenam (e as
  gélidas congelam como sempre); contato de faíscas/morcegos queima, corrupções e
  almas envenenam. Nenhum efeito mata sozinho — para em 1 de vida. Vinheta de
  status na tela; ROSÁRIO PARTIDO e ÂNCORA DA ALMA interagem.
- **IA MAIS ESPERTA**: cuspedores/feiticeiros/vigias miram ONDE VOCÊ VAI ESTAR (com
  erro humano); perseguidores (corrupção/espectro-veloz) tentam fechar os lados;
  sh/cr/crs mais lentos; Coisa de Cervo a 255 de perseguição (Thor corre 285) —
  o terror é a caça, não a velocidade bruta.
- **ZERO DRENAGEM PASSIVA**: auditoria completa — Pacto da Fome, Fome Insciável,
  Coração Falso, Açougueiro, Falso Rei, Barqueiro, Dívida Infinita e Dívida de
  Sangue reescritos: cobram almas, cadência ou dano recebido, nunca mais vida.
- **SINERGIAS REAIS**: registro central de 15 combinações entre os itens novos
  (ativam e desativam sozinhas; descobertas ficam no grimório, aba SINERGIAS).
- **MAGIKA**: cada descida sorteia um valor (0-999) e 1-2 eventos (luz estranha,
  mensagem velha no grimório, aparição, paleta pálida, silêncio denso).
- **O LIVRO**: menu renovado como grimório antigo de duas páginas com dobra
  central; abertura animada (capa 3D → tinta que revela) pulável com um clique.
- **MOD STUDIO EXTERNO**: mod-studio.html abre FORA do jogo (mesma pasta) —
  gerenciador, 17 famílias de balas, forja de padrões (5 formações + desenho +
  intervalo + 8 formatos + bala personalizada), MÁQUINA DE BLOCOS com linha do
  tempo e simulação, USAR NOS INIMIGOS e buff/nerf. EXPORTA o JSON que o EDITOR
  DE MODS do jogo IMPORTA. O estúdio interno do jogo continua intacto.

## NOVO (v56 / v1.8.0) — A MÁQUINA DAS ALMAS

- **MÁQUINA DE BLOCOS (nova aba — o Visual Logic Editor)**: monte o ataque com
  blocos conectados, SEM programar. **DISPARAR PADRÃO** (mira no jogador ou
  ângulo fixo; ×vezes com intervalo), **ESPERAR**, **GIRAR FORMAÇÃO** (graus +
  giro contínuo por Xs), **VELOCIDADE DAS BALAS** (×), **COR DAS BALAS**,
  **DIVIDIR BALAS** (cada bala vira N em leque, após Xs), **ESPERAR VIDA DO
  CHEFE** (o ataque pausa até o chefe chegar a X% — adianta com SIMULAR DANO
  −10% na área de testes), **REPETIR SEQUÊNCIA** (com CORPO aninhado),
  **ALEATÓRIO ENTRE DOIS RAMOS**, **SIMULTÂNEO** (os dois ramos ao mesmo
  tempo), **USAR OUTRA MÁQUINA** (sua sequência salva vira bloco reutilizável
  em outros projetos) e **ENCERRAR ATAQUE**. Cada bloco tem seus campos
  próprios — mexeu, salvou, a linha do tempo redesenha.
- **LINHA DO TEMPO**: o ataque compilado no tempo — cada bloco é um trecho na
  cor do tipo, com o total estimado (e a marca ? nos portões de vida / USAR,
  que dependem da luta). Enquanto a máquina roda, o PONTEIRO corre numa faixa
  no pé da arena mostrando onde o ataque está.
- **NO JOGO REAL**: **TORNAR A SPELL DO SENHOR** — a máquina vira a spell card
  do Bruxo/Carrasco/Viúva/Golem e roda pelo MESMO trilho das spell cards
  (zero mudança no motor; arquivos originais intactos). REMOVER SPELL DA
  MÁQUINA desfaz. Status mostra todas as máquinas presas.
- **SIMULADOR COM JOGADOR DE TESTE**: o Thor da área de testes ganhou PILOTO
  AUTOMÁTICO — **PARADO**, **LATERAL** (vai-e-volta), **CIRCULAR**, **ROTA**
  (clique pontos na arena — até 10 — e ele faz o circuito) e **REPRODUZIR**
  (grava o SEU movimento a 30 Hz e repete em laço — compare versões A/B do
  mesmo ataque com o mesmo piloto). **SIMULAR DANO −10%** adianta os portões
  de vida. Gravação: ● GRAVAR MOVIMENTO / ■ PARAR / LIMPAR.
- **O mod CRIAÇÃO já vem com A MÁQUINA DE EXEMPLO**: espiral → esperar →
  acelerar → girar → dividir → anel → encerrar (a sequência do conceito).

## NOVO (v55 / v1.7.3) — A FORJA DAS BALAS

- **FORJA DO PADRÃO (área de testes)**: o modo CRIAR/EDITAR MEU PADRÃO virou
  criação completa — **tipo de formação** (desenho, espiral, anel, estrela,
  onda) com **MINI-TELA DE DESENHO** dentro da própria área de testes;
  **INTERVALO entre vagas** editável (a cadência das vagas é sua; o intervalo
  também vale nos padrões atribuídos aos senhores); **FORMATO DA BALA (8)**
  com GALERIA ao vivo (círculo, diamante, estrela, anel, seta, quadrado,
  cruz, oval — desenhados com a cor/tamanho do padrão); **BALA
  PERSONALIZADA** — o padrão nasce com o estilo COMPLETO de uma bala da aba
  BALAS (forma, tamanho, cor, transparência, brilho, rastro, rotação);
  **DUPLICAR ESTE** para mexer nos que já têm sem perder o original.
- **USAR NOS INIMIGOS**: painel na forja — escolha o SENHOR + o padrão
  nativo dele e **SUBSTITUA** pelo padrão da forja (`data.bossPats`, vale no
  jogo com o mod ATIVADO), ou **TORNE-O A SPELL CARD** do senhor (todos os
  ataques viram ele). Painel de status mostra tudo que o mod já substituiu /
  vinculou. REMOVER para os dois.
- **OS 8 FORMATOS EM TODO LUGAR**: o sim da área de testes, o preview da aba
  PADRÕES e o JOGO REAL (gancho aditivo no drawEBullets — `b.sh` só existe
  em balas nascidas da forja) desenham o formato escolhido; o estilo da bala
  personalizada é aplicado até com o mod apenas ABERTO (não ativo) dentro da
  área de testes, para prever com fidelidade.
- **O EDITOR DE PADRÕES (aba) também ganhou**: intervalo entre vagas,
  FORMATO DA BALA (8) e BALA PERSONALIZADA — salvos no mesmo padrão.

## NOVO (v54 / v1.7.2) — A OFICINA VIVA

- **A ÁREA DE TESTES É A SALA DO JOGO**: a arena clássica 660×400 se aposentou.
  Os TRÊS modos agora rodam no mesmo simulador fiel (a sala REAL, as mesmas
  paredes e o mesmo Thor de teste — 240 px/s, 120 no foco). Testar longe do
  jogo enganava; agora o que você vê no teste é o que você enfrenta na luta.
- **CRIAR / EDITAR MEU PADRÃO (ao vivo)**: novo modo da área de testes — o
  boneco dispara um padrão SEU sem parar, na escala do jogo, enquanto você
  mexe em **balas por vaga, velocidade, tamanho, rotação/vaga e cor** DURANTE
  o teste: a próxima vaga já nasce com os novos valores e já fica SALVO no
  mod. **+ NOVO PADRÃO** cria um ali mesmo; **ABRIR NO EDITOR DE PADRÕES**
  pula para o desenho à mão com o padrão selecionado.
- **BUFF / NERF nos padrões do jogo**: no modo chefe real, dois sliders —
  **VELOCIDADE DAS BALAS (×0.4–2.5)** e **CADÊNCIA DE RE-ATAQUE (×0.4–2)** —
  mudam SÓ o padrão escolhido daquele senhor. O efeito aparece na hora no
  simulador e fica salvo no mod (`data.tuning` 'tipo|padrão' → {sp,cd});
  **vale na luta real quando o mod está ATIVADO** (botão **ATIVAR ESTE MOD**
  ali mesmo; **REMOVER AJUSTE** desfaz; o HUD mostra "BUFF/NERF: VEL ×… ·
  CAD ×…"). As balas nascem marcadas com o padrão de origem (tagBullets nos
  8 atos dos senhores) e recebem o ajuste 1× cada (updateEBullets); a
  cadência entra nos 4 fins de padrão (endTune) sem tocar o encadeamento.
- **COMO FICA NO JOGO (sprites)**: o editor de sprites ganhou a pré-visuali-
  zação que faltava — o sprite desenhado na **caixa REAL que o motor usa**
  para cada slot (Thor 52×58, inimigos r×3, senhores r×3-3.4, Caronte r×4,
  a Besta em tela, o piso esticado na sala), numa mini-cena de sala. Modos
  **SOBREPOSTO NO JOGO** (original a X% por baixo do seu) e **LADO A LADO NO
  JOGO** (original no jogo | o seu no jogo), e o botão **SALVAR E VER NO
  JOGO**: salva, ATIVA o mod e fecha o editor para você ver o sprite na luta.
- **AVANÇO TRIPLO CORRIGIDO (o Carrasco)**: ele avança **EM DIREÇÃO AO
  JOGADOR nas TRÊS investidas** — cada uma mira onde o Thor está no momento
  (a rota carmesim aparece no chão) e cada batida na parede espalha estilha-
  ços. Na **terceira**, QUANDO CHEGA PERTO (~150px), desfere **O GOLPE DA PÁ
  ali mesmo** (anel de aviso 132px, 0.5s para sair, estouro com brechas). Se
  o Thor despistar, ele completa a investida e o golpe sai na parede do
  mesmo jeito. Fase II: avanços a 800 px/s e anel extra.

# THOR REVENGE — v1.7.1 "O ENSAIO DOS SENHORES" (v53: o estúdio MOSTRA tudo —
# pré-visualizações consertadas (balas voando + galeria dos 8 formatos ao vivo,
# padrões disparando do centro), nova aba PADRÕES DOS BOSSES com os padrões
# REAIS dos 4 senhores (como funcionam, simulação com a IA verdadeira e
# substituição pelo padrão do seu mod), SPELL CARDS DO JOGO documentadas com
# VER AO VIVO, spell FAZ para o boss OU SUBSTITUI UM padrão dele, e a ÁREA DE
# TESTES com CHEFE REAL — a mesma IA do jogo, Fase II ligável)

## NOVO (v53 / v1.7.1) — O ENSAIO DOS SENHORES

- **PRÉ-VISUALIZAÇÕES CONSERTADAS**: as previews de BALAS e PADRÕES morriam no
  boot (o laço saía com o editor fechado e ninguém as reativava) — agora cada
  aba reativa a sua preview ao entrar. A bala voa pelo caminho usando o estilo
  ATUAL dos campos (não precisa salvar) e a **GALERIA DOS 8 FORMATOS** (círculo,
  diamante, estrela, anel, seta, quadrado, cruz, oval) redesenha a cada ajuste
  de cor/tamanho/brilho/transparência.
- **NOVA ABA — PADRÕES DOS BOSSES**: o catálogo REAL dos padrões dos 4 senhores
  de mapa (Bruxo 20, Carrasco 12, Viúva 9, Golem 9 — clássicos, exclusivos
  kaizo e as SPELL CARDS assinatura ★). Cada padrão mostra a descrição de COMO
  ELE FUNCIONA, o botão **SIMULAR NA ÁREA DE TESTES** (roda a IA verdadeira do
  jogo, com Fase II) e a **SUBSTITUIÇÃO**: escolha um padrão SEU para entrar no
  lugar do padrão nativo quando o chefe sortear ele (com o mod ATIVADO).
- **SPELL CARDS DO JOGO**: a aba de spell cards lista os feitiços reais dos
  senhores (GRIMÓRIO RASGADO, INVESTIDA RICOCHETE, AVANÇO TRIPLO, ENXAME
  VAMPIRO, FIOS DA MORTE, MARÉ DE MAGMA) com descrição e **VER AO VIVO**.
- **SPELL — FAZER OU SUBSTITUIR**: o vínculo da spell card virou um MODO:
  `só na ÁREA DE TESTES` · `FAZER PARA O BOSS` (substitui TODOS os ataques) ·
  `SUBSTITUIR UM padrão do boss` (escolhe chefe + padrão alvo — o resto do
  moveset continua o original).
- **ÁREA DE TESTES COM CHEFE REAL**: além de testar a sua spell contra o Thor,
  o modo **SIMULAR PADRÃO REAL DE CHEFE** roda o padrão escolhido com a MESMA
  IA do jogo (telegráfos, minas, fios da morte, maré de magma, cura do
  morcego, investidas, Fase II) contra um Thor de teste (WASD/setas, SHIFT
  foco). A simulação troca os cenários do motor num try/finally e devolve
  tudo — a run real não é tocada. HUD mostra HP do chefe (a cura do morcego
  aparece!), hits e balas.
- Atalho no console: `__MODS.simBoss("gz","kz_magma")` pula direto para a
  simulação.

# THOR REVENGE — v1.7.0 "O ESTÚDIO DAS ALMAS" (v52: o EDITOR DE MODS integrado
# ao jogo — gerenciador de mods (ativar/desativar/exportar/importar), editor de
# balas (forma/tamanho/cor/alpha/brilho/rastro/rotação/velocidade), editor de
# padrões desenhados com o mouse, editor de spell cards vinculáveis aos
# senhores de mapa, editor de sprites com referência transparente do original,
# área de testes com Thor controlável; os arquivos originais nunca sobrescritos)

## NOVO (v52 / v1.7.0) — O ESTÚDIO DAS ALMAS

- **EDITOR DE MODS no menu principal** (botão lilás EDITOR DE MODS): a
  plataforma de criação inteira dentro do jogo — nada de download, nada de
  código. Os arquivos originais NUNCA são sobrescritos: cada mod vive no
  navegador (localStorage) e viaja como JSON.
- **GERENCIADOR**: crie/renomeie/descreva/versone mods, ATIVE ou DESATIVE a
  qualquer momento, EXPORTAR (baixa .json ou copia para a caixa) e IMPORTAR
  (cole o JSON ou escolha o arquivo — validação com mensagem de erro clara).
  O mod **CRIAÇÃO** já vem instalado com exemplos (2 padrões + 1 spell card).
- **EDITOR DE BALAS**: 16 famílias de bala do jogo identificadas pela cor;
  para cada uma: forma (círculo, diamante, estrela, anel, seta, quadrado,
  cruz, oval), tamanho (×0.2–×4), cor, transparência, brilho, rastro,
  rotação (graus/s) e velocidade (×0.3–×2.5) — com pré-visualização ao vivo.
  Com o mod ATIVADO as balas reais mudam na hora (velocidade aplicada 1× na
  bala nova; visual desenhado pelo mod).
- **EDITOR DE PADRÕES**: DESENHE a formação com o mouse/toque no canvas — o
  traço vira a formação de balas — ou use os tipos prontos (espiral, anel,
  estrela, onda). Ajuste quantidade (3–64), velocidade, rotação por vaga
  (acumula — espiral gira), tamanho e cor. Pré-visualização disparando do
  centro.
- **EDITOR DE SPELL CARDS**: nome, personagem que usa, dificuldade livre e a
  sequência de fases: cada fase = padrão + atraso + intervalo + vezes +
  segura (reordenáveis, removíveis). **VÍNCULO COM O CHEFE**: Bruxo,
  Carrasco, Viúva ou Golem — com o mod ativo, o senhor de mapa lança a SUA
  spell card (placa SPELL CARD na tela) em vez dos padrões normais.
- **EDITOR DE SPRITES**: 34 slots (Thor, os quatro senhores, Cérbero, cabeça,
  Caronte, a Besta, piso, inimigos, cavaleiros…). Ferramentas: lápis,
  borracha, balde, conta-gotas, desfazer (20 passos), limpar. **O ORIGINAL
  COMO REFERÊNCIA**: o arquivo real de assets/sprites/ aparece
  semitransparente por baixo (opacidade 0–100%), com modo LADO A LADO,
  nome do arquivo e dimensões de ambos à vista; sem bitmap (arte vetorial),
  a tela começa vazia para você desenhar do zero. Salvar entra no mod;
  RESTAURAR ORIGINAL remove o override.
- **ÁREA DE TESTES**: arena própria com Thor controlável (WASD/setas, SHIFT
  mostra a hitbox de foco de 4px) contra a spell card selecionada — pausar
  (P), passo a passo (.), reiniciar (R), HUD com tempo/balas/hits/HP.
- **SEGURANÇA**: mods só existem no navegador; exportar antes de limpar os
  dados; importar valida o formato; desativar o mod devolve TUDO ao original
  instantaneamente.
- **E o Editor de Mapas completo fica para a próxima versão** — o estúdio de
  balas/padrões/spells/sprites já está inteiro.

# THOR REVENGE — v1.6.4 "A CORTE DUPLA" (v51: o Carrasco ganhou DOIS movesets
 "A CORTE DUPLA" (v51: o Carrasco ganhou DOIS movesets
# — o AVANÇO TRIPLO (3 investidas marcadas; na 3ª, o ATAQUE DA PÁ de perto) e
# o ENXAME VAMPIRO (morcegos que curam o chefe ao te acertar); A ENXURRADA:
# balas kaizo 30% mais rápidas e padrões MUITO mais densos; senhores re-atacam
# ~23% mais rápido no kaizo; e 5% das salas de chefe acordam DOIS senhores)

## NOVO (v51 / v1.6.4) — A CORTE DUPLA

- **O CARRASCO — AVANÇO TRIPLO (spell card)**: ele avança TRÊS vezes. Cada vez
  que BATE NA PAREDE, a direção do PRÓXIMO avanço aparece NO CHÃO (linha
  carmesim tracejada). Na TERCEIRA investida ele usa **O ATAQUE DA PÁ**:
  anel de aviso ao redor dele, depois o golpe de perto — estilhaços em anel
  com brecha + a lâmina varrendo na direção que ele olha. Fase II: avanços
  de 800 px/s e anel maior.
- **O CARRASCO — ENXAME VAMPIRO (spell card)**: morcegos de asas roxas que
  perseguem o Thor. **CADA morcego que ACERTA CURA o Carrasco** (+18, Fase II
  +26 — o número verde aparece em cima dele). Os morcegos são DERRUBÁVEIS a
  tiro. Fase II: duas vagas de morcegos.
- **A ENXURRADA (velocidade)**: em sala kaizo, TODAS as balas inimigas voam
  **30% mais rápido** (acumula com hard/NEO).
- **A ENXURRADA (densidade)**: MUITO mais balas em todos os padrões — sigilos
  9/6 com 8 estilhaços cada, leques 7/5, cometas 6/4 vagas ×4, fileiras do
  Grimório 15 (brecha garantida), guilhotinas 4/3 colunas × 9 lâminas,
  corrente 2× mais densa, execução com 8 tiros por braço, investida com
  18/13 estilhaços, ninhada 4/3 crias, laço 32/26, fissuras 4/3 × 13
  cusparadas, tempestade 14/10 nuvens, núcleo 24 por volta × 4/3, maré de
  magma com 14 vagas e 4 cristas — e os clássicos do Bruxo kaizo também
  (espiral 5 braços, shotgun 10×6, coroas 5×22, pétalas 17, enxame 16…).
- **CADÊNCIA**: no modo kaizo os quatro senhores re-atacam **~23% mais
  rápido** (Bruxo 0,42s, Carrasco 0,85s, Viúva 0,7s, Golem 1,0s entre
  padrões).
- **A CORTE DUPLA (5%)**: em cada sala de chefe do mapa, 5% de chance de
  acordar **DOIS senhores ao mesmo tempo** (o gêmeo nasce com 80% da vida).
  O aviso A CORTE DUPLA entra na tela e o subtítulo do banner troca.
- **Nada mudou nas regras de justiça**: brechas continuam garantidas em toda
  onda; nenhum padrão fecha todas as rotas de fuga; telegráficos intactos.

# THOR REVENGE — v1.6.3 "OS QUATRO FEITIÇOS" (v50: cada senhor de mapa ganhou
# THOR REVENGE — v1.6.3 "OS QUATRO FEITIÇOS" (v50: cada senhor de mapa ganhou
# o SEU spell card assinatura com Fase II própria — Grimório Rasgado, Investida
# Ricochete, Fios da Morte, Maré de Magma; conserto: Carrasco/Viúva/Golem agora
# lançam os feitiços exclusivos kaizo que já tinham; loja em destaque total;
# drops saem das paredes sozinhos; o portal espera a bênção do chefe)

## NOVO (v50 / v1.6.3) — OS QUATRO FEITIÇOS

- **SPELL CARD ASSINATURA PARA CADA SENHOR DE MAPA** (entra com a placa SPELL
  CARD na tela e domina o sorteio na Fase II):
  * **O BRUXO — GRIMÓRIO RASGADO**: linhas mágicas atravessam a arena, piscam
    em roxo e cospem fileiras de projéteis (brecha de duas vagas garantida).
    Fase II: LEITURA DUPLA — horizontais primeiro, diagonais depois, com
    aviso visual próprio (magenta).
  * **O CARRASCO — INVESTIDA RICOCHETE**: atravessa a arena, bate na parede
    (zona de impacto + estilhaços) e volta por outro ângulo; a direção aparece
    NO CHÃO antes de cada avanço. Fase II: TRÊS investidas em cadeia.
  * **A VIÚVA — FIOS DA MORTE**: fios finos entre âncoras tensionam e passam a
    CORTAR quem cruza. Fase II: sequência em triângulo e diagonais, os ativos
    continuam visíveis — e um lado da arena fica sempre aberto.
  * **O GOLEM — MARÉ DE MAGMA**: sinais verdes mostram direção e zonas seguras
    antes de a onda cruzar a arena em três cristas. Fase II: SEGUNDA onda de
    outra direção depois que a primeira passa, com zonas seguras remarcadas.
- **CONCERTO HISTÓRICO**: o Carrasco, a Viúva e o Golem tinham feitiços
  exclusivos kaizo prontos desde a v0.9.16 mas NUNCA os lançavam (só o Bruxo
  sorteava os dele) — agora os quatro minibosses sorteiam os exclusivos.
- **LOJA DO ERRANTE**: bênção selecionada em DESTAQUE TOTAL — placa clara com
  moldura azul e NOME em AZUL-ESCURO, bem legível (feira do chão e cartas).
- **DROPS NUNCA MAIS FICAM NAS PAREDES**: bênção, pacto, coração, almas,
  fagulha — dentro da parede deslizam de volta ao chão; fora do mapa, retornam
  ao MEIO da sala (checado a cada quadro).
- **O PORTAL ESPERA A BÊNÇÃO**: derrotou o chefe e a bênção está no chão? O
  portal só nasce quando você a pega.
- **COLHER COMICAMENTE GRANDE**: descrição mínima — "é uma colher.
  comicamente grande."

# THOR REVENGE — v1.6.2 "O CARROSSEL DAS ARMAS" (v49: a escolha de armas
# virou carrossel — uma arma por vez, ◀ ▶ na tela ou setas do teclado, ENTER
# confirma e pontos pulam direto; o LIMBO parou de travar — paredes espelhadas
# pré-calculadas e em cache; e a fase cinza do Limbo ficou LISA, fundo cinza
# sem estrutura nenhuma)

## NOVO (v49 / v1.6.2) — O CARROSSEL DAS ARMAS

- **A ESCOLHA DE ARMAS VIROU CARROSSEL — UMA ARMA POR VEZ**: em vez da parede
  de 8 cartas, agora você vê UMA arma de cada vez. Os botões **◀ ▶ nas
  laterais** trocam o lado (a carta desliza devagarinho); as **SETAS ← → do
  teclado** fazem o mesmo; **ENTER ou ESPAÇO confirma a arma da frente**; e os
  **pontos embaixo** pulam direto para qualquer arma (cada ponto mostra o nome
  no mouse-over). O **NORMAL/HARD** e o **VOLTAR** ficaram onde sempre
  estiveram. Funciona em TODOS os caminhos que abrem a escolha: a descida de
  verdade, o PORTÃO DO CÉRBERUS · TESTE e o LIMBO · FASE FINAL · TESTE. Os
  cliques nas cartas continuam valendo — os binds antigos ficaram intactos.
- **O LIMBO PAROU DE TRAVAR**: a causa era a **parede espelhada** do Falso
  Paraíso — a cada quadro, o jogo varria as bordas da sala (passo a passo de
  7px) e, para CADA trecho externo, criava DOIS gradientes com recorte
  (clip). Dezenas de gradientes + clips POR FRAME = a travada. Agora os
  trechos externos são **pré-calculados na construção da sala** (com corridas
  mescladas — 1 segmento por trecho, não 1 por passo) e a parte estática
  (brilho leitoso, reflexo difuso, rachaduras) fica pintada **numa camada em
  cache**: o quadro inteiro virou **1 cópia de imagem + traços de brilho
  baratos**. As rachaduras das paredes agora nascem FIXAS por sala (antes
  piscavam aleatórias a cada quadro — efeito colateral positivo). As fases
  1–3 do Limbo seguem com o mesmo visual de sempre.
- **A FASE CINZA DO LIMBO FICOU LISA — SEM ESTRUTURA NENHUMA**: no último véu
  (O LIMBO INFERNAL — FASE 2, andar 9 — o mesmo do botão de teste), o paraíso
  acaba de vez: o chão é **CINZA LISO** — sem grama, sem manchas, sem pedras,
  sem flores, sem rachaduras, **sem paredes espelhadas**, sem pólen dourado —
  e lá fora é o MESMO cinza, um tom abaixo: **sem céu, sem catedrais, sem
  árvores, sem grama distante, sem brilho animado**. A única marca no piso é
  a borda de sempre, num traço cinza-escuro. O véu de fogo e as fissuras com
  brasa MORRERAM nessa fase (a fase anterior, LIMBO INFERNAL — FASE 1, segue
  queimando como sempre). De quebra, essa fase agora é a mais LEVE do jogo.


- **A BESTA DA MORTE ACEITA A SUA ARTE**: a criatura que aparece quando você
  perde (chifres curvos, cabeça negra, olhos em brasa, sorriso serrilhado)
  agora pode ser SUBSTITUÍDA pela sua arte. Coloque um PNG (ou JPG/WEBP/GIF)
  em `assets/sprites/` com o nome **besta.png** — também valem
  **besta-das-trevas.png**, **besta-do-abismo.png**, **a-besta.png**,
  **fera.png**, **fera-das-trevas.png** e **beast.png** (maiúsculas, acentos
  e espaços tanto faz). A arte entra SOZINHA, mesmo com o jogo rodando (a
  pasta é re-escaneada a cada ~15s e a cada foco da janela; `__SPRITES_RESCAN()`
  força). O que sai: a besta vetorial inteira. O que fica: o texto de
  provocação aleatório e a assinatura *— A BESTA DO ABISMO —*. Tamanho livre
  (a caixa é ~340×400, centrada um pouco acima do centro — espaço para
  chifres). Sem o arquivo, a besta vetorial de sempre aparece — nada quebra.
  No STANDALONE: crie a pasta `assets/sprites/` ao lado do .html e coloque o
  besta.png lá dentro (funciona por duplo clique).
- **O JOGO INTEIRO SE ENCAIXA NA SUA RESOLUÇÃO — SEM BARRA DE ROLAGEM**: o
  canvas já preenchia a janela (letterbox); agora o re-encaixe também dispara
  na ROTAÇÃO do celular, ao ENTRAR/SAIR da tela cheia (F11), no
  visualViewport (zoom/barras do sistema) e com um segundo passe atrasado
  (navegadores que assentam o layout tarde). E os PAINÉIS DOM (menu, seletor
  de armas, opções, versão…) que não couberem na janela ROLAM POR DENTRO —
  nenhum botão fica mais cortado em telas/janelas pequenas; em monitores que
  cabem tudo, NADA muda visualmente (o centrador é idêntico ao de sempre).
  A página em si nunca tem barra de rolagem (overflow travado + overscroll
  desligado).

## NOVO (v47 / v1.6.0) — O CONSERTO DAS SALAS

- **SALAS SECRETAS — A CHANCE MÍNIMA**: TODA entrada numa sala secreta (inclusive
  revisitas) tem **10% de revelar uma BÊNÇÃO ALEATÓRIA** extra; se a visita já
  deixou uma bênção no chão, ela não duplica. O presente da primeira visita
  (bênção 50% / +4 de vida 50% / rei 14%) segue intacto.
- **O VELHO REI FECHA A SALA**: entrou numa sala secreta e o rei está lá? As
  portas (e a rachadura da sala isolada) TRANCAM atrás de você — não existe
  volta até o rei cair. A despedida dele reabre tudo (updateReiDeath → openDoors),
  como sempre fez.
- **PORTAS CEDEM À EXPLOSÃO**: a bomba (PORTA DAS SOMBRAS), o tiro explosivo
  (Pólvora) e a FAGULHA [Q] destroem portas trancadas **por inimigos**
  (combate/desafio não varrido) ou **por enigma** (puzzle não resolvido).
  A porta destruída nasce aberta se você voltar (r.doorBlown persiste por sala).
  **CHEFE, MINI-CHEFE e chefe secreto continuam sagrados** — essas trancas
  nenhuma bomba quebra (salas do chefe nem têm portas).
- **NADA MAIS DESAPARECE**: a regra dos 11 segundos morreu — almas e vida no chão
  não expiram mais (bênçãos/ativos/fagulha já eram imortais). E ao SAIR da sala
  os itens não são apagados: ficam guardados na sala (savedPk) e voltam exatamente
  onde estavam ao reentrar, com o deslocamento da nova origem compensado. Baús
  seguem com o sistema antigo de re-push; a varredura da sala (collectRoomPickups)
  também não apaga mais bênçãos/ativos/fagulhas.
- **HITBOX MENOR**: player.hitR 5px → **4px** (36% menos área de dano). O r:11
  continua para movimento/portas/itens. O **ponto carmesim SÓ aparece com SHIFT
  segurado** (FOCO) — soltou, some (comportamento da v1.4.6, agora explícito).
- **DESCRIÇÕES CURTAS**: O CREDOR e a COLHER COMICAMENTE GRANDE (expansion.js
  X_WEAPONS.hint) encurtadas para o essencial.
- **BOTÃO LIMBO · FASE FINAL · TESTE** no menu (temporário, igual ao do portão):
  escolha a arma e caia direto na fase 4 do Limbo (O LIMBO INFERNAL — FASE 2,
  andar 9) — varreu o mapa, o Juiz desperta. startLimboTestDirect +
  game.limboTestPending (preservado no resetAll, limpo no wBack).

## NOVO (v46 / v1.5.9) — O ATALHO DE VOLTA

- **O BOTÃO "PORTÃO DO CÉRBERUS · TESTE" ESTÁ DE VOLTA NO MENU** — a remoção da
  v1.5.8 foi longe demais: o usuário pediu de volta porque vai testar a luta do
  Cérbero agora. Escolha a arma e caia direto no caminho do portão, sem descer
  andar nenhum (startGateDirect + bind('gateTestBtn') restaurados como eram).
- **OS SPRITES DE TESTE CONTINUAM FORA** — a pasta COLOQUE SPRITES AQUI segue
  limpa para a SUA arte, e o jogo segue desenhando a ARTE VETORIAL original
  (colou um PNG seu lá? ele entra sozinho, como sempre).
- **NADA mecânico mudou**: cutscene da fera dormindo, texto lento, apresentação
  em IM Fell English SC, pó sem nada, mensagem vermelha, remake com regen e os
  dois temas (guardiao do inferno / juiz da sentença negra) seguem intactos.

## NOVO (v45 / v1.5.8) — O PALCO ESTÁ PRONTO

- **OS SPRITES DE TESTE SAÍRAM**: as doze artes de teste que moravam na raiz de
  assets/sprites (thor, cérbero, caronte, vigia, morcego, velho rei, feiticeiro,
  peão, sombra, piso/fundo, lamentadora e a cópia "Velho Rei.PNG") foram removidas.
- A pasta **COLOQUE SPRITES AQUI** fica limpa para a SUA arte: colou um PNG com o
  nome certo? ele entra sozinho (detecção automática v4, manifesto sprites.txt
  opcional segue funcionando — agora só com exemplos comentados).
- Sem os PNGs, o jogo volta a desenhar a **ARTE VETORIAL original** — a queda
  always-on do sistema: sem arquivo nada quebra, nunca fica invisível.
- **O BOTÃO TEMPORÁRIO "PORTÃO DO CÉRBERUS · TESTE" saiu do menu** — o portão
  está aprovado; o caminho até ele volta a ser a descida de verdade
  (Penumbra das Almas → Penumbra Infernal → Caminho do Portão). *(v1.5.9: o botão
  voltou a pedido do usuário — ver NOVO v46.)*
- **NADA mecânico mudou**: cutscene da fera dormindo, texto lento, apresentação
  em IM Fell English SC, pó sem nada, mensagem vermelha, remake com regen e os
  dois temas (guardiao do inferno / juiz da sentença negra) seguem intactos.

 o Thor SAI do portão POR BAIXO e o Cérbero fica NA FRENTE; o texto antigo digita mais lento e a fera acorda ainda mais devagar; a luta abre com A APRESENTAÇÃO DO BOSS na fonte IM FELL ENGLISH SC — inscrição O GUARDIÃO DA PASSAGEM, CERBERUS com impacto grave + luz + rugido, linha carmesim + epíteto O CÃO DAS TRÊS SENTENÇAS e o nome sumindo LENTO quando o chefe se move; no remake, véu sutil + LUZ BRANCA + a 2ª apresentação CERBERUS · O CÃO NEGRO DO JUÍZO CARMESIM; e os DOIS temas novos na pasta de músicas: guardiao do inferno e juiz da sentença negra)

## NOVO (v44 / v1.5.7) — O GUARDIÃO DA PASSAGEM

- **O THOR SAI DO PORTÃO POR BAIXO**: o vão fica no CHÃO da arena — ele emerge
  SUBINDO, fica lá embaixo (H*.74) e o **CÉRBERO fica NA FRENTE dele** (centro-alto,
  W*.5 / H*.40): o encontro é de frente, olho a olho. O portão se fecha atrás dele.
- **TEXTO E ACORDAR MAIS LENTOS**: o texto antigo digita a **8,5 letras/s** (era 13)
  e cada cabeça ergue em **3,0 / 5,2 / 7,4s** com subida de **3,4s** (era 2,4s).
- **A APRESENTAÇÃO DO BOSS** (fonte **IM FELL ENGLISH SC**, assets/fonts/):
  a tela **escurece rápido**, **o som ambiente fica ABAFADO** (lowpass 520Hz via
  `__MUSIC_MUFFLE`), a inscrição pequena **O GUARDIÃO DA PASSAGEM** surge primeiro,
  **CERBERUS irrompe no centro** com impacto sonoro grave + breve expansão de luz +
  ELE RUGINDO, a **linha carmesim** desenha-se e revela **O CÃO DAS TRÊS SENTENÇAS** —
  e o nome **desaparece LENTO quando o chefe começa a se mover** (fade 1,8s por cima
  da luta, hook global `drawCerbCard` no render).
- **NO REMAKE, A MESMA CERIMÔNIA**: o cenário escurece **BEM SUTILMENTE** até a
  transformação completar (véu .38 subindo em ~5,4s), **a criatura emite LUZ BRANCA**
  (halo amplo + brasas claras) e a **segunda apresentação entra no clarão**:
  **CERBERUS · O CÃO NEGRO DO JUÍZO CARMESIM** — mesma fonte; o momento em que a
  luta muda de escala.
- **OS DOIS TEMAS NA PASTA DE MÚSICAS** (`assets/audio/music/`):
  **guardiao-do-inferno.ogg** (Cérbero 1 — 45,7s, Sol menor, marcha ritual + três
  latidos de serra) e **juiz-da-sentenca-negra.ogg** (Cérbero 2 — 38,4s, Lá menor,
  sino do veredito + arpejos de julgamento). Colocou o arquivo, ele toca; sem
  arquivo, os temas sintetizados embutidos seguem. No standalone ambos vão embutidos.

## NOVO (v43 / v1.5.6) — A FERA DORME

- **A CUTSCENE ANTIGA existe de verdade**: ao entrar pelo portão, o **SPRITE ANTIGO
  DO CÉRBERO** — o de verdade (corpo, pernas, cauda, pescoços e as três cabeças) —
  está **DORMINDO** no fundo da arena: olhos fechados (`wake=0` no drawHead), cabeças
  recolhidas, roncando. Nada de silhueta desenhada à mão.
- **ACORDAR LENTO**: cada cabeça ergue no seu tempo (2,2s / 3,6s / 5,0s, rampa de
  2,4s) — os olhos abrem devagar, os pescoços sobem, um rosnado por cabeça. O Thor
  desce do vão sozinho (scripted) e o portão se fecha atrás dele.
- **O TEXTO antigo, letra por letra** (máquina de escrever, caixa de legenda):
  *"Cérbero, fera cruel e disforme, late como um cão com suas três goelas."*
  Quando o texto termina, **o TÍTULO ÚNICO DO BOSS entra** (`CÉRBERO — o guardião
  do portão — três gargantas, uma fome`) **e a luta começa**. Relógio de segurança:
  a luta abre em 14s de qualquer jeito — a cena nunca prende.
- **O antigo derrotado APENAS VIRA PÓ — sem nada**: derrubou as 3 cabeças, o corpo
  fica na cena se desfazendo (fade + partículas de pó cinza subindo do corpo e das
  cabeças) — **sem cura na hora, sem aviso, sem música**. A barra do antigo se
  recolhe (`barT=0`; a HUD esconde a barra/etiqueta enquanto `barT≤0`).
- **A MENSAGEM VERMELHA, poucos segundos depois**: aos 3,2s do pó entra na tela,
  em vermelho e tremendo, **"oh cão, voce cometeu um grave erro"** (Pirata One 30px,
  pulso escuro-avermelhado, 3s).
- **O REMAKE desperta em seguida** (cutscene transform intacta: silhueta derrete em
  luz branca → 3 pescoços → CERBERUS — A SENTENÇA FINAL) — e **a VIDA DE THOR SE
  REGENERA SOZINHA enquanto o Cérbero novo começa o diálogo** (cura contínua de
  maxHp/4,2 por segundo durante a transformação, partículas douradas + uma única
  "VIDA RESTAURADA" ao encher — cheia antes do primeiro padrão).
- **Blindagens**: balas inimigas do antigo somem com a morte dele (o momento é de
  silêncio); a barra da SENTENÇA não aparece no pó nem na transformação; os FX do
  Cérbero antigo (`frameCerberus`/`drawCerberusFX`) já se guardavam com `boss.dying`.
- Versão: index ×3 + `?v=156` ×8, `__EXP_VERSION 1.5.6`, `RM.v 1.5.6`, changelog 48.

## NOVO (v42 / v1.5.5) — O PORTÃO DE FRENTE

- **O PORTÃO está DE FRENTE, NO ALTO**: embutido na FACE NORTE de basalto que ocupa
  o horizonte inteiro do Caminho do Portão — a laje vulcânica agora atravessa a tela
  de parede a parede (paredes laterais dos dois lados) e você SOBE até a moldura como
  quem vai entrar de verdade.
- **A abertura foi consertada**: as folhas estavam deslizando para o centro — parecia
  que o portão se FECHAVA. Agora as bordas externas ficam presas e as folhas recuam
  para FORA (o selo carmesim se parte no início). A MESMA correção foi aplicada ao
  portão da cutscene de entrada.
- **O DENTRO do portão é TOTALMENTE BRANCO**: o vão revelado é preenchido por luz
  plena (a bainha amarelo-alaranjada e as chamas continuam ao redor) — não mais uma
  fenda fina.
- **O Thor ENTRA pelo portão**: aberto o portão, ele anda sozinho para dentro do vão
  e o branco o engole — e AO ENTRAR começa a CUTSCENE ANTIGA do Cérbero (portão da
  arena, as três cabeças, o snap), exatamente antes da luta. Nada mudou nela.

## NOVO (v41 / v1.5.4) — A SEGUNDA DESCIDA

- **O PORTÃO agora fica NO MEIO da tela**: embutido num PAREDÃO de basalto que desce
  do céu ao chão e ocupa a metade direita inteira — a laje vulcânica termina exatamente
  nele (o chão NUNCA passa do portão). O gatilho do segredo (O Thor que Não Desceu)
  acompanhou o portão para o centro da laje.
- **A ABERTURA virou um clarão**: no MEIO, um BRANCO BRILHANTE; ao redor, chamas
  amarelo-alaranjadas — faíscas brancas nascendo da fenda, línguas de fogo nas
  beiradas das folhas, a radiação inundando a tela (aura branca pulsante depois de aberta).
- **A ARENA do Cérbero = o MESMO VISUAL da PENUMBRA INFERNAL**: chão ebranquecido
  queimando nas bordas (tremulação + fogo fora do cenário incluídos) — da cutscene
  antiga de entrada (INTACTA: portão devagar, três cabeças, o snap) até a luta e o fim.
- **O FIM trocou de porta**: NÃO existe mais portão do inferno depois da SENTENÇA —
  abre A SEGUNDA DESCIDA, uma escada fria e grande que desce da arena direto para o
  CORREDOR AZULADO; atravessou, vem CARONTE, depois o LIMBO em 4 fases e o Juiz.
- **Blindagens**: nenhuma escada de andar nasce na arena (a trava `_arenaLock` zera em
  startGatePath/startBlueCorr/resetAll); o gatilho da escada do fim arma em 0,4s com
  raio generoso — andar direto chega nela (o atraso antigo de 1s fazia o Thor passar reto).

## NOVO (v40 / v1.5.3) — O PORTÃO RESPONDE

- **A CAUSA do "portão não abre" achada e morta**: O THOR QUE NÃO DESCEU (o segredo
  do corredor) nascia INVISÍVEL — `drawGatePath` não desenhava inimigos — e enquanto
  ele vivia (4.000+ HP com 6+ bênçãos) a fase `sthor` segurava o caminho. Agora ele
  **aparece de verdade** (silhueta roxa + barra de vida, igual em qualquer sala) e a
  luta tem **VÁLVULA**: fuja dele por 4s (ou sobreviva 75s) e ele desiste e volta
  para a fila; venceu? bênção de recompensa.
- **O PORTÃO RESPONDE EM walk E sthor**: lutar virou opção, não prisão — chegue no
  portão mesmo com o segredo no seu encalço e [Z] abre; ele desiste ao ver a folha
  ceder. A rede de 10s continua (ninguém fica preso).
- **PROXIMIDADE pela MOLDURA, não pelo centro**: o portão é alto (y=H*.42); quem
  andava pela base da laje ficava a 361px do CENTRO e o prompt nunca acendia. Agora
  a distância é medida até o RETÂNGULO da moldura (282×422) — chegou perto em
  qualquer altura da folha, o prompt acende.
- **A LAJE DE PEDRA — chão que não ultrapassa o portão**: o corredor ganhou um chão
  de verdade (lajes grandes com juntas irregulares, borda acesa pela lava, sombra de
  profundidade) com PAREDES de basalto dos dois lados e uma trava dura: os limites
  de andar TERMINAM antes da moldura (x ≤ gp.x-161) — não existe mais andar "em cima
  do cenário", pisar nas colunas nem atravessar o portão fechado. Fissuras e poças
  nascem e são CLIPADAS dentro da laje (semeadas — a sala não muda a cada olhar).
- **BOTÃO DE TESTE no menu (temporário)**: `PORTÃO DO CÉRBERUS · TESTE` — escolha a
  arma e caia DIRETO no corredor (`gatePending` → `startGatePath`) para conferir o
  [Z] sem descer andar nenhum. Marca no HTML para remover quando aprovado.
- TESTES: test_v153.py 24/24 ao vivo (botão → corredor → laje → [Z] → cerbintro →
  antigo → SENTENÇA → segredo visível → [Z] durante o segredo) + smoke standalone
  12/12 (file://) + regressões v1.5.2 13/13 · v1.5.1 25/26* · v1.5.0 19/19
  (*F1 = corrida antiga do harness, o boss morreu antes do kill scriptado; a corrente
  F2–F5 inteira passou). node --check ×6 OK.
- Versão: index ×3 + `?v=153` ×8, `__EXP_VERSION 1.5.3`, `RM.v 1.5.3`, changelog 45.

## NOVO (v39 / v1.5.2) — O PORTÃO QUE ESPERA UMA MÃO

- **O CAMINHO DO PORTÃO virou um MINI MAPA VULCÂNICO**: um único trecho compacto de
  pedra marrom-escura sob céu vermelho — fissuras de lava pré-geradas que respiram,
  poças incandescentes, colunas de basalto com topos acesos e brasas subindo. Os dois
  corredores compridos da v1.3.3 saíram (o segredo do Thor que Não Desceu continua,
  agora no meio do caminho).
- **O PORTÃO ENORME abre com [Z]**: nada de gatilho invisível — chegue perto
  (raio 210px), o prompt `[Z] · ABRIR O PORTÃO` acende e as duas folhas de pedra
  abrem em 2,6s direto para a cerbintro. Rede de segurança: encostado por 10s,
  o portão cede sozinho (`o calor o venceu`). Interagir respeita os binds
  (`keybinds.interact`) e o botão de interação do toque.
- **ANTIGO VENCIDO → SENTENÇA NA HORA**: a cadeia killHead → RM.cerbDown() já
  assumia; agora a transição é VISÍVEL (texts `O GUARDIÃO TOMBOU` +
  `a sentença desperta das três bocas`). A luta real (gatepath, `_cerbFight=1`)
  foi testada ponta a ponta: 13/13.
- **PORTAS = PASSAGENS DA COR DO CHÃO**: `drawDoors` pinta o vão com o piso
  amostrado da própria sala (`doorFloorColor`, cache 0,5s; fallback por zona).
  Trancada: escurecida com costura fina. Aberta: respiração de luz discreta.
  A porta extra (PORTAL) e as rachadas (sala secreta) continuam com marca própria.
  **A escola e o castelo não passam por drawDoors** — portas deles intocadas.
- **FIX de erro de console**: `addColorStop` do horizonte do vulcão recebia a
  expressão dentro da string (estourava por frame) — corrigido com concatenação.
- Versão: index ×3 + `?v=152` ×8, `__EXP_VERSION 1.5.2`, `RM.v 1.5.2`, changelog 44.

## NOVO (v38 / v1.5.1) — AS PORTAS SE ABREM

- **A PORTA PARA O CÉRBERO NUNCA MAIS TRAVA**: a causa raiz era a decoração
  v1.5.0 — um arco/estátua grande nascido a 66px de uma porta tinha raio de
  colisão (até ~95px + o corpo do Thor) maior que a própria folga, e o
  jogador era empurrado para longe do gatilho SEMPRE; como as salas
  re-sorteavam as estruturas a cada entrada, a porta podia "fechar" do nada.
  Fix duplo: **progresso acima de decoração** (perto de portas abertas, da
  escada para o fundo e do portal, o raio das estruturas encolhe sozinho até
  virar caminho livre) + **folga de nascença dobrada** (100px das portas).
- **SALAS PERSISTENTES**: a primeira composição de estruturas de cada sala
  fica guardada na sala (`_decorSave`) — sair e entrar mostra as MESMAS
  estruturas nos mesmos lugares. A janela interativa também persiste.
- **SELETOR DE DIFICULDADE reordenado**: FÁCIL · NORMAL · HARD · PUNIÇÃO ·
  ABISMO · PENITÊNCIA · KAIZO — o FÁCIL é o primeiro a ser escolhido e o
  KAIZO o último.
- **MODO KAIZO = todos os bosses kaizo**: no modo KAIZO o miniboss de cada
  andar nasce na forma branca DE CARA (`game.kaizoRun`), não só quando repete.
- **BOSS REPETIDO = NEO**: o boss já enfrentado na run volta como **NEO —**
  (nome, banner, VS e barra de vida): ataques quase contínuos — encadeia
  padrões com 55% de chance, aviso (tele) 40% mais curto, intervalo entre
  ataques pela metade — e todos os tiros 30% mais rápidos enquanto ele vive.
- **PENUMBRA INFERNAL legível**: as almas (pickups) nascem em **vermelho
  forte ou azul forte** (alternando por alma) com brilho e contorno escuro —
  o chão branco as engolia; e os **tiros do Thor** ganharam halo escuro +
  borda de brasa para ler em qualquer fundo claro.
- **MORCEGO FLAMEJANTE**: saiu do pool do andar 2 — só caça a partir da
  PENUMBRA INFERNAL (andar 3+).

## v1.5.0 "OS SALÕES DO DANMAKU" (v37)

### Salas maiores de verdade + CÂMERA
- No Normal e acima, as salas cresceram **~1,35× a largura e ~1,25× a altura**
  (arenas de chefe ~1,69× a área) — e a **câmera acompanha o Thor** pelos
  limites do mundo. HUD, vinheta e efeitos de tela ficam **fixos**.
- **FÁCIL** mantém as dimensões de sempre (perfil legado).

### TRANSIÇÃO DESLIZANTE entre salas
- Atravessou a porta: a sala antiga **desliza para fora**, a nova **entra pelo
  lado certo**, sem tela preta e sem teleporte (0,32s). O mergulho segue
  existindo para portal/escada/andar.

### Inimigos PRÉ-POSICIONADOS (sem surgimento artificial)
- Nas dificuldades novas, a guarnição **já está na sala** quando Thor entra —
  postos em anel + cruz, longe da entrada. Reentrou sem limpar? Ela volta.

### Salas HABITADAS: composições predefinidas
- Estruturas nascem de **modelos planejados** (corredor de estátuas, ilha de
  colunas, altar em ruínas, memória de alguém…) com variações, validação de
  portas/centro e **anti-repetição**.

### APRESENTAÇÃO VS dos mini-chefes
- **THOR — VS — MINI-CHEFE** antes da luta (1,15s), só para quem NÃO tinha
  cena própria. Os retratos deslizam, o VS bate no centro.

### O anel com brecha única se aposentou (Normal e acima)
- Viúva, Golem, Rei, Erro 404, Cavaleiros e as cabeças do Cérbero agora usam
  **CÍRCULOS COMPLETOS** (rotativos, consecutivos, alternados) e **PADRÕES EM
  X** (duplos, combinados com círculo) — densidade e velocidade sobem até o
  Kaizo. O anel antigo com a brecha (`gapW`) continua intacto no **FÁCIL**.

### O CREDOR planta ÂNCORA nas paredes
- Botão direito na **parede**: a âncora prende — Thor **pende da corda**,
  **balança** e, ao soltar, **voa com o impulso** acumulado. A corda recolhe
  devagar; solta sozinha no limite.
- Bônus: a "batida na parede" agora só conta quando o corpo foi **realmente
  bloqueado** — objetos paravam de se gastar sozinhos no meio da sala.

### Textos curtos: Colher Comicamente Grande e O CREDOR
- As descrições das duas armas ficaram curtas e diretas (título e mecânicas
  preservados).

### Menu: as novidades de volta
- O menu ganhou a linha **v1.5.0 — OS SALÕES DO DANMAKU** (clicável — abre o
  registro completo com a entrada 42), botão de versão e changelog atualizados.
- A citação de Dante **só vira a página quando você entra no jogo de novo** —
  parou de trocar sozinha no menu.

## NOVO (v35 / v1.4.6) — OITO BARRAS, UM ALVO

### A sentença agora tem 8 BARRAS DE VIDA — uma por spell card
- Cada barra de vida É uma spell card, **nesta ordem**: Rosário → Cruz →
  Espiral → Caçada → Eclipse → Chuva → Três Sentenças → **Vermelho Absoluto**.
- Esvaziou a barra, a card **QUEBRA** (aviso na tela + faixa carmesim marcada
  na barra), pausa de **no máximo 2 segundos** e a próxima sobe com a barra
  cheia. A oitava barra zerada é a **única morte**.
- Dentro da card ele **ataca sem parar** — o padrão recomeça sozinho até a
  barra cair. A barra tem **8 divisões** + contador **CARD n/8** (também na
  placa da spell card).

### AS TRÊS CABEÇAS ATIRAM AO MESMO TEMPO
- Onde uma cabeça atacava sozinha, agora **as três disparam juntas**: as
  rajadas das Três Sentenças, os leques de 17, as espirais, a cruz diagonal
  (as outras duas cabeças respondem espelhadas) e a chuva lateral.

### HITBOX do Cérbero MUITO maior — e ele SEMPRE toma dano
- Corpo **118** (+ tronco baixo **95**), cabeças **32**, contato **84**.
- **Nenhuma janela sem dano**: ritual, descanso, salto e até a TRANSFORMAÇÃO
  (depois do clarão, t≥2.2s) tomam dano — nenhum momento engole tiros.

### Thor virou alvo de Touhou: hitbox = UM TIRO + FOCO no SHIFT
- A hitbox de **dano** do Thor agora tem **o tamanho de um tiro (5px)** — o
  corpo visual continua servindo para portas, itens, escadas e coleta.
- **Segurar SHIFT** mostra o círculo branco com o ponto carmesim no centro —
  e deixa o passo **lento** (foco). Na escola o SHIFT continua o sneak.

### DESVIO = TOQUE DUPLO na direção
- Invista apertando a **mesma tecla de movimento 2× rápido** (←←, →→, ↑↑, ↓↓;
  janela de 0,27s). O botão de desvio do **toque** segue funcionando.
- A tela de CONTROLES explica a mudança.

## NOVO (v34 / v1.4.5) — O RIO FINALMENTE LEVA

### O bug do Thor invisível após o Caronte morreu
- Ao aceitar a travessia, a cutscene do barco ficava **presa para sempre**: o
  limbo montava por baixo, mas o estado `boatride` nunca saía — e nos últimos
  instantes da chegada Thor **nem era desenhado**. Ele "sumia" e o **LIMBO
  nunca chegava**.
- Agora o barco **atraca de verdade**: Thor desce **visível** e o LIMBO abre
  na hora. Blindagem extra: qualquer caminho que monte o limbo força o estado
  de jogo de volta ao normal.

### O corredor esfria devagar — e começa VERMELHO de verdade
- O corredor azulado agora **começa avermelhado como a Garganta**: paredes
  quentes, brasas subindo do chão — antes as cores iniciais eram tão escuras
  que o vermelho era invisível.
- O calor **esfria LENTAMENTE** conforme você avança (curva que segura o
  vermelho no começo) e a névoa fria só toma conta perto do barco.

### CÉRBERO: a especificação COMPLETA das 8 spell cards — sem piedade
- **Rosário**: anéis TRIPLOS (rápido/médio/lento) com lacunas que alternam em
  sequência determinística + **dentes laterais persistentes** (arcos da
  esquerda, linhas diagonais pequenas e rápidas da direita) + 3 anéis de
  fechamento com **divisão ±18°**.
- **Cruz da Matilha**: leque central de **13 a ~70°**, cruz diagonal de **11
  por salva** (a 2ª execução inverte a ordem das cabeças) e a **cruz
  quebrada** — leque estreito + laterais largos com a abertura migrando.
- **Espiral da Serpente**: 3 correntes a ~0,10s por 2,4s + **serpente dupla**
  (a central pausa e cospe 3 rápidos, 2×) + **nó carmesim** (correntes
  cruzando o centro) + espiral final que **se divide**.
- **Caçada Sem Rastro**: **HISTÓRICO DE POSIÇÕES** de Thor (atual · -0,25s ·
  -0,5s) — 6 salvas atrasadas, **pinças triplas** (esquerda no passado,
  direita no presente, central entre elas) e 3 marcas onde **a do meio falha
  de propósito**.
- **Eclipse Carmesim**: anéis de **28/36/44 posições** com aberturas
  alternando em sentidos opostos + **lua partida** (arcos laterais + 8
  rápidos centrais, 2 combinações) + anel final **rápido de abertura mínima**.
- **Chuva do Último Círculo**: **8 posições, 6 chovem por salva** e os
  corredores livres **migram** a cada salva (nas altas dificuldades sobra UM);
  3 linhas horizontais de altura crescente + **impacto central** (onda com
  aberturas + duas colunas lentas fechando) + chuva diagonal final.
- **Três Sentenças**: **5 rajadas centrais** de 3 a 0,40s + **3 leques de 17
  projéteis a 80°** (cada um respondido pelo centro) + espiral de **2,5s** +
  **VEREDITO** (3 grupos em velocidades diferentes + salva final).
- **Vermelho Absoluto**: os **7 eventos** — firmamento carmesim, **corredor
  condenado** (linha + leques convergindo), espiral tripla, **tempestade das
  três bocas**, o círculo se fecha, última sentença (pausa → leque → espiral
  → linha) e **4 combinações crescentes** com 3 arcos finais.
- Por cima de tudo: **teto de 500 balas** (antes 320), **densidade e duração
  máxima escalando pela tabela de dificuldade** (Normal/Difícil/Infernal/
  Kaizo) e cada spell card com **tempo máximo próprio** — quanto pior o modo,
  menos tempo você tem.

## NOVO (v33 / v1.4.4) — AS SPELL CARDS DO JUÍZO CARMESIM

### A terceira fase virou danmaku de verdade
- Cada um dos 8 padrões agora é uma **SPELL CARD** com **ritual de ativação**:
  o disparo anterior se interrompe, pontos carmesins acendem no ar, os três
  pescoços se erguem e um **sino distante** toca — então o ataque começa.
- A **placa SPELL CARD** entra no **canto superior direito**: moldura fina de
  registro ritualístico, entrada deslizante, `SPELL CARD` + o nome completo —
  **Cão Branco 「Rosário dos Trinta e Três Dentes」**, 「Cruz da Matilha」,
  「Espiral da Serpente」, 「Caçada Sem Rastro」, 「Eclipse Carmesim」,
  「Chuva do Último Círculo」, 「Três Sentenças」 e o **「Vermelho Absoluto」**.
  O nome fica **discreto durante o ataque** (não pisca, não cobre a luta) e
  apaga quando o padrão termina. Barra de vida e HUD seguem visíveis.

### A criatura branca sobre a arena escura
- Na luta real, a forma volta a ser **BRANCA e luminosa** — detalhes lavados,
  **fissuras carmesins na boca e nos olhos** quando uma spell card chega —
  sobre a **arena escura** com a clareira de luz sob o Thor (mantidas).
- **No laboratório** (chão branco) a forma **obsidiana** fica, para o corpo
  continuar legível nos testes.

### A Garganta Vulcânica finalmente termina
- Derrotou o **FERREIRO DAS ALMAS**? A **ESCADA DO FRIO** desce **onde ele
  caiu** (azul, "A ESCADA · O CORREDOR"). Pise nela e você desce para o
  **CORREDOR AZULADO** → **Caronte** → **Limbo**. Nunca mais fase infinita:
  se a escada sumir por qualquer motivo, ela **renasce** no salão.
- A **barra do CÉRBERO não aparece mais na Garganta** (o ending reativava o
  chefe antigo e a barra ficava por cima).

### Rótulos de fase corretos
- **LIMBO INFERNAL** deixa de mostrar "LIMBO · FASE".
- Entrar no **andar 3** anuncia **PENUMBRA INFERNAL** em placa grande
  ("O CHÃO RACHA"); a **fase 3 do Limbo** anuncia **O LIMBO INFERNAL**
  ("O PARAÍSO ESQUENTA"). O Limbo segue anunciado após o Caronte e a Garganta
  após o Cérbero, como sempre foi.

### FAGULHA explosiva de verdade + textos mínimos
- O tiro da **FAGULHA [Q]** agora **TAMBÉM QUEBRA A JANELA** do **ERRO 404**
  (como o tiro sísmico). Ao pegar, só **"FAGULHA ×N · [Q]"**; a **GUARDA
  PROFANA** (parry) descreve em uma linha.
- O **HUD do item ativo mostra só "SPC"** (sem o nome). A **ficha completa
  ficou no livro**: o equipado com o estado da partida (PRONTO/recarga) +
  **TODOS os outros** do catálogo, cada um com **DANO · ALCANCE · TIROS** — e
  a **FAGULHA** com quantos tiros restam (×N).
- **Descrições resumidas** no livro (bênçãos, pactos, catálogo) e na **arca
  [3]** do modo dev — a frase inteira continua nos dados e nas cartas de
  escolha do jogo.

## NOVO (v32 / v1.4.3) — A ESCADA E A FÚRIA

### A sala de testes virou lugar físico
- Apertar **[0]** no modo dev **não abre mais o overlay direto**: uma **escada
  roxa se abre no chão**, perto do Thor ([0] de novo a fecha).
- **Pise nela** e você desce (fade curto, nunca trava) para a **GRANDE ARENA**:
  uma sala de tela cheia, sem portas, só para testar bosses. O **laboratório**
  (bosses · montar salas · arca) já abre junto, e a **escada no topo** devolve
  para a sala onde você estava. Com luta em andamento, a escada de saída
  espera o fim ("termine a luta antes de subir").

### A SENTENÇA FINAL sem piedade
- **A janela VULNERÁVEL deixou de existir**: os 8 padrões se encadeiam sem
  descanso — só um respiro curto entre eles e, da etapa 2 em diante, um salto
  telegrafado. É bullet hell de verdade agora.
- **Hitbox maior**: corpo 50→86, cabeças 15→22 (acertar ficou mais justo — e o
  corpo maior ocupa mais espaço na dança das balas). Teto de balas 250→320.
- **Dificuldades apertadas**: DIFÍCIL cx2 · INFERNAL cx3 · **KAIZO cx4** (4ª
  salva no Rosário, leques mais largos, colunas mais frequentes, sentenças
  extra, anéis do corpo no Vermelho Absoluto) e a **vida da sentença escala
  com a dificuldade** (KAIZO 1,3×).

### Segunda luta começa justa
- Ao derrubar o **Cérbero antigo**, a vida do Thor é **restaurada por inteiro**
  antes da transformação ("VIDA RESTAURADA"). Também vale invocando direto no
  laboratório.

### Visual: obsidiana, não branco
- A forma nova trocou o **branco pela OBSIDIANA** (#171019) com **contorno e
  brasa carmesins**; os telegrafos (pescoços que vão disparar) agora correm
  brasa fina — mais legíveis que antes.
- **Fora do laboratório**, a arena **inverte as cores só na segunda fase**: o
  chão branco afunda na escuridão (véu 62%) com a **clareira de luz sob o
  Thor**. No lab, a arena fica clara para testar.

### Correções
- **Tiros que não somem**: as balas da sentença (`rm`) não são mais cortadas
  pelos limites da sala — o Cérbero alcançando a parte escura fora do mapa
  continuava sem atirar por uns instantes (as balas morriam ao nascer).
- **Thor invisível pós-Cérbero (raiz)**: o ending deixava `playerAlpha=0`
  (Thor entrava no portão desvanecendo) e nada restaurava — ele ficava
  **INVISÍVEL** na Garganta Vulcânica, no corredor azul, no barco de Caronte e
  no Limbo inteiro. Restaurado em startGarganta/startBlueCorr/Caronte.

## NOVO (v31 / v1.4.2) — A SENTENÇA NO LABORATÓRIO
## NOVO (v30 / v1.4.1) — A SENTENÇA CONVOCADA

O **BOSSES FUTUROS** (laboratório de bosses, após vencer Caronte) agora tem o
Cérbero novo.

### CÉRBERO — A SENTENÇA FINAL no seletor
- Nova carta no seletor: **CÉRBERO — A SENTENÇA FINAL**. Clicou, a silhueta
  antiga **derrete em luz branca** (transformação de 5,4s) e o Cérbero
  remasterizado assume na hora — três pescoços de serpente, barra própria e os
  **8 padrões de bullet hell carmesim** nas 4 etapas (Despertar → Perseguição →
  Três Sentenças → Vermelho Absoluto), **sem precisar derrubar as três cabeças
  antes**.
- A carta antiga **CÉRBERO** continua exatamente como sempre: o guardião de
  três bocas, intocado — e no laboratório a SENTENÇA nunca assume a luta dele.
- Ordem tanto faz: nada de flag sobrando de uma sentença para contaminar a
  próxima invocação.
- Acessível no **modo NERDCIRNO67** e para qualquer um que chegue à tela de
  vitória do Caronte (botão BOSSES FUTUROS).

### Preservado
- Nada foi removido: as 60 itens v1.4.0, sinergias, a transformação na
  progressão normal (matar as 3 cabeças no portão), armas, escola, castelo —
  tudo continua funcionando.

---

## ANTERIOR (v29 / v1.4.0) — A SENTENÇA FINAL

## NOVO (v29 / v1.4.0) — A SENTENÇA FINAL

A maior expansão até agora: **60 itens novos**, **sistema de sinergias em 3
níveis** e a **terceira fase do Cérbero** — um bullet hell completo.

### 60 itens novos (todos com efeito real, raridade e entrada em drops/loja/altar)
- **24 BÊNÇÃOS**: Olho do Sacristão, Halo Quebrado, Última Vela, Dente do
  Veredito, Chave do Purgatório ([R] troca uma oferta por 40 almas, 1×/descida),
  Cinza Incandescente, Ossos em Órbita, Coração Emprestado, Estilhaço de
  Reflexo, Sino dos Ausentes, Pena Carbonizada, Turíbulo Vazio, Pupila da
  Ruína, Ampulheta do Último Segundo, Coroa de Espinhos, Rosário Sem Contas,
  Máscara da Testemunha, Evangelho Rasurado, Ímã de Almas, Frio de Abismo,
  Pena dos Condenados, Relógio do Pecado, Coroa do Último e o **PATO HEREGE**
  (meme raro: um patinho atravessa a sala e dá uma bicada fraca — com quack
  alegre DEMAIS para o inferno).
- **20 PACTOS** (poder por um preço real): Credor das Almas, Porta Fechada
  (baús em dobro + onda extra), Segunda Voz, Última Cinza, Contrato de Sangue,
  Dízimo do Inferno, Dívida Crescente, Pacto do Silêncio, Mãos Famintas, Juros
  Compostos, Favor da Mentira, Aposta do Carrasco, Contrato de Espelhos, Altar
  Invertido, Nome Apagado, Promessa Quebrada, Coroa de Ganância, Pacto do
  Enxame, Preço da Pressa e **A Última Testemunha** (a 1ª morte da descida é
  recusada — e o pacto se desfaz).
- **16 ARMAS** (itens que mudam o FORMATO do ataque, estilo Isaac): Lamento
  (perfura), Rosário de Balas, Espingarda do Sacrilégio, Agulha da Penitência,
  Incensário, Dente de Cérbero (o 3º tiro caça), Vela de Funeral (explode),
  Sermão Quebrado (ondas H/V), Espelho Faminto (ricochete), Coroa Balística,
  Cravo do Abismo (prega e sangra), Liturgia de Estilhaços (divide), Mordida
  Dupla (afasta e converge), Arco do Herege (curva), Cálice Vazio (bebe
  projéteis e cospe rajada) e Canhão de Excomunhão (carrega e atravessa tudo).

### Sinergias (15 combinadas, 3 níveis)
- **LEVES / FORTES / ESPECIAIS** — as especiais têm banner com nome próprio:
  **O ESPELHO QUE DEVOLVE**, **O SERMÃO DUPLADO**, **O SILÊNCIO ARMADO** e a
  piada proposital **O PATO REFLETIDO (INÚTIL)**.
- Motor por tags compartilhadas (fire/ice/orbit/pierce/bounce/split/homing/
  explosion) — sem multiplicação infinita (limites de projéteis e de gatilhos).

### CÉRBERO — A SENTENÇA FINAL (3ª fase bullet hell)
- Ao derrubar as 3 cabeças: ele **brilha até ficar branco**, a arena escurece
  (círculo de luz sob Thor), os pescoços sobem como serpentes e ele se ergue
  **humanoide, agachado, com 3 pescoços de serpente e 3 cabeças de cachorro**.
- **8 padrões carmesim** legíveis: Rosário de 33 Dentes, Cruz da Matilha,
  Espiral da Serpente, Caçada sem Rastro (marcas no chão), Eclipse Carmesim,
  Chuva do Último Círculo (colunas telegrafadas), Três Sentenças e o
  **Vermelho Absoluto**.
- **4 etapas por vida**: Despertar → Perseguição → Três Sentenças → Vermelho
  Absoluto, com janelas **VULNERÁVEL** sinalizadas por um breve silêncio.
- **Dificuldades integradas** (usa as categorias existentes): NORMAL 1,00× /
  HARD (Difícil) 1,08× / PUNIÇÃO-ABISMO (Infernal) 1,16× / KAIZO-PENITÊNCIA
  (Kaizo) 1,24× de velocidade; intervalo entre salvas 1,00/0,92/0,84/0,76×.
- Trilha própria em camadas (cresce conforme a vida cai) + cues sonoros que
  ensinam cada padrão. Ao vencer, os projéteis **desaparecem na hora** e a cena
  antiga (diálogo + ALMA NEGRA) segue intacta.

### Preservado
- Nada foi removido: armas antigas, itens v1.2/v1.3, salas secretas, escada do
  boss, morcego flamejante, colher carregada, chão da Penumbra Infernal, escola,
  castelo, Caronte, Juiz — tudo continua funcionando (regressões aprovadas).

---

## ANTERIOR (v28 / v1.3.5) — O CHÃO QUE QUEIMA

Ajuste visual da Penumbra Infernal, seguindo a referência enviada.

### O chão da PENUMBRA INFERNAL como na referência
- O centro do chão ficou quase **BRANCO PURO** (uniforme, sobre qualquer
  base — inclusive o fundo.png opcional do usuário).
- As bordas de cada retângulo de chão queimam em **FAIXAS**: vermelho
  profundo rente à parede → laranja vivo → derretendo no branco.
- **Textura de brasa** (manchas irregulares de fogo) sobre as faixas e uma
  **linha de brasa** escura rente à borda.
- A borda queimada **TREMULA**: línguas de chama vivas piscam ao longo do
  contorno do chão.

### FOGO queimando FORA do cenário
- **Às vezes** (mais ou menos 2 de cada 3 salas) um **FOGO queima no vazio**,
  junto às paredes, FORA do chão: clarão no escuro, três línguas de chama
  tremulando, núcleo claro e **brasas subindo**. De 1 a 3 fogos por sala,
  nunca dentro do cenário.

### O que NÃO mudou
- A **Penumbra das Almas** segue NORMAL: bem escura, sem tom infernal.
- Colher carregada, escada do boss, sala secreta, morcego flamejante e o
  resto da v1.3.4 continuam exatamente como estavam.

---



## NOVO (v27 / v1.3.4) — A COLHERADA CARREGADA

Versão de correção e pequenas adições.

### A COLHER ganhou corpo (sprites)
- **SPRITES NOVOS em assets/sprites/armas/**: **colher.png** (a colher
  **PARADA**, carregada na pata do Thor) e **colher-ataque.png** (a colher
  **ATACANDO**, varrendo o arco da colherada). Os dois podem ser trocados
  pelo usuário — sem arquivo, um desenho vetorial de colher gigante entra
  no lugar (nada quebra).
- Ela agora **APARECE** enquanto equipada: parada na pata (com balanço),
  recuando enquanto carrega e girando no golpe.

### CARREGAR: segure o botão/mouse
- **SEGURAR o botão do mouse (ou o dedo na tela)** começa a **CARGA**: um
  anel enche ao redor do Thor, partículas são puxadas para a colher e um
  **"CARREGADA!"** + brilho marcam a carga cheia (1,15s).
- **SOLTOU, DESCE O PORRADA**: a colherada sai com até **2,5× de dano**
  (24 → 60 base), **arco e alcance maiores** e um **arremesso muito mais
  forte** (o inimigo voa muito mais longe — o empurrão quase dobra).
- **DE GRANDE PORTE VOAM UM POUCO MENOS**: chefes (Cérbero, Velho Rei,
  404, Juiz, chefes-x), brutamontes, grão-de-ossos e peregrinos recebem
  cerca de **metade do empurrão** — grandes, pesados.
- Toque rápido = a colherada rápida de sempre; **setas seguradas** atacam
  contínuo como sempre (sem carga). Durante a carga as setas não disparam.

### Penumbra das Almas: de volta ao NORMAL
- A **PENUMBRA DAS ALMAS voltou a ser bem ESCURA**, como antes — sem o
  tom infernal, sem brasas subindo, sem fissuras em brasa (fase 2 mantém o
  véu cinza e as árvores mortas de sempre).
- A **PENUMBRA INFERNAL** continua com o chão **esbranquiçado queimando
  laranja e vermelho nas bordas** (isso não mudou).

---

## NOVO (v26 / v1.3.3) — A ESCADA QUE DESCE

Versão de correção e pequenas adições.

### Progressão consertada
- **CHEGAR AO CÉRBERO NÃO EXIGE MAIS VARRER O ANDAR** — o bug acabou: mate **o
  boss** da Penumbra Infernal e uma **ESCADA DESCE no chão do salão** (banner
  "A ESCADA PARA O FUNDO"). Pisar nela desce para o corredor do portão.
- **O CORREDOR FICOU MAIS LONGO** — dois trechos de caminhada (com uma falinha
  de transição) e, no 2º trecho, um **PORTAL DE FRENTE** no meio do caminho,
  atravessado a pé, antes do portão enorme do Cérbero.

### Salas novas
- **SALA SECRETA ISOLADA** — um cômodo **solto no mapa**, **sem ligação com
  NENHUMA sala**. No mapa ele aparece como um recuso pulsando em roxo com "?":
  ache-o, vá até o cômodo vizinho e detone a **parede rachada** com a FAGULHA
  EXPLOSIVA [Q]. De dentro **não existe outra porta** — só o caminho de volta.
  Ela dá **uma coisa só**: um item, **+4 de vida máxima** ou **o VELHO REI**.
- **A SALA DO BOSS É A ÚLTIMA DO ANDAR** — beco sem saída com **uma única
  entrada**; nenhuma sala existe além dela.

### A COLHER COMICAMENTE GRANDE virou arma de PERTO
- A colherada é **corpo a corpo** e **ARREMESSA os demônios longe**.
- **Sinergias elementais**: a colher absorve o que você carrega — **fogo
  queima** (queimadura), **explosão detona** (onda de choque), **gelo congela**
  (lentidão), **raio salta** para 2 alvos, **água faz poça**, **vento
  arremessa mais longe**, **terra estremece**, **luz e escuridão cortam mais
  fundo**.
- A cada **13 colheradas** que acertam, **O CÉU RESPONDE** — um raio divino
  cai onde a colher aponta (com **A SOPA DIVINA**, o raio salta em 3 demônios).

### Visual
- **PENUMBRA INFERNAL**: chão **esbranquiçado**, queimando **laranja e
  vermelho nas bordas** de cada sala.
- **PENUMBRA DAS ALMAS**: tom **mais infernal** — carvão quente, brasas
  subindo e fissuras em brasa no piso.

### Inimigo novo
- **MORCEGO FLAMEJANTE** — voa errático, **telegrafa o bote com um clarão**,
  **mergulha em chamas** deixando brasas no rastro e **cospe brasa de longe**.
  Sprite novo incluído: **assets/sprites/morcego.png** (a pasta de sprites foi
  atualizada).

### Títulos
- Os rótulos de meme saíram das cartas das armas ("MEME SAGRADO", "MEME",
  "o meme que luta" etc.) e a evolução do Teclado agora se chama **TEMPESTADE
  DE TECLAS**.

---

## NOVO (v25 / v1.3.2) — O CHICOTE DA DÍVIDA

O **CREDOR** virou um **chicote 100% jogável no mouse** (o resto do jogo continua
com teclado/toque como sempre — só esta arma é guiada pelo cursor):

- **BOTÃO ESQUERDO** — com um inimigo perto do cursor (ou na linha do chicote),
  a corrente **PRENDE e ARRASTA** o devedor até você: **golpe imediato e
  ARREMESSO** na hitbox, o corpo voa, **se choca com os outros e todos no
  choque recebem dano** (o fluxo da v1.3.1, agora mirado pelo cursor).
- **BOTÃO ESQUERDO sem ninguém perto** — o chicote **ESTALA EM ÁREA**: um arco
  à frente (±100°, alcance ~205) que fere todos no corte, com recarga rápida
  (0,55s) para estilar de novo.
- **BOTÃO DIREITO** — **AMARRA** um inimigo **ou um OBJETO DO MAPA** (ossos,
  velas, entulho, correntes, estátuas, estruturas…). A presa presa **segue o
  seu mouse**: esfregue-a **nas paredes** para machucá-la, **arraste-a pelos
  inimigos** para ferir quem estiver no caminho (o objeto também se gasta) e
  **mexa freneticamente** para acumular força — **ao soltar o botão ela VOA
  MAIS LONGE** (até ~2,3× a velocidade) e o corpo arremessado continua ferindo
  todo mundo no choque.
- **Objetos têm vida própria e PODEM QUEBRAR** nas paredes ou no abuso — ao
  quebrar, deixam cair **1 alma**. Objetos pesados (estátua, coluna,
  catedral…) arrastam mais devagar e aguentam mais; a **marca antiga** (pista
  do enigma dos ecos) **nunca se amarra**.
- **Segurança**: o inimigo amarrado **não age** enquanto dura a amarra
  (chefes resistem: arrasto lento, 2,4s no máximo) e a amarra **se solta
  sozinha** no limite (7s inimigos / 6,5s objetos) — **nunca prende para
  sempre**; morreu ou trocou de sala, solta na hora. Em telas de toque: o
  toque mantém o puxar/estalo (o amarrar é do mouse).
- **Visual**: mira nova no cursor, corrente viva presa à presa e o estalo
  desenhado no arco.

## NOVO (v24 / v1.3.1) — TRÊS GARGANTAS

### Correções pedidas
- **ITENS ATIVOS — fim do loop "pegou muitas vezes"**: pegar um item ativo com
  outro equipado agora **ARREMESSA** o antigo para fora do corpo e ele fica
  **2 segundos impossível de repégar**. Pegar continua sendo só **passar por
  cima** — sem tecla, sem puxar.
- **AS ARMAS NOVAS NÃO ATACAM MAIS SOZINHAS**: as 6 armas da expansão
  obedecem ao comando como as antigas — **clique/toque** dispara na hora,
  **setas seguradas** atacam contínuo. Nada de tiro automático.
- **O CREDOR refeito**: a corrente **PRENDE** o devedor, **ARRASTA** até
  você e, **na hitbox do Thor, o golpe vem imediato e ARREMESSA o corpo** —
  ele voa, **se choca com os outros** e **todos no choque recebem dano**.
- **A colher assume o nome verdadeiro**: **COLHER COMICAMENTE GRANDE**.
- **PENUMBRA INFERNAL consertada**: o portal fantasma do andar 4 (que jogava
  num "andar 5" normal e travava) **não existe mais**. Varreu as duas fases →
  vem a **FASE ÚNICA**: caminhar um curto período até o **PORTÃO ENORME**, que
  abre devagar direto para a **sala nova do CÉRBERO**.

### CÉRBERO remasterizado
- **Entrada nova (cutscene)**: o portão abre devagar; Cérbero imóvel na arena;
  as três cabeças observam **direções diferentes**; a **central acompanha
  Thor**; **quando Thor se aproxima**, as três se viram **simultaneamente**;
  a música começa **gradual e ameaçadora**; o nome do chefe aparece na hora
  certa, **sem interromper a ação**. O velho "sono" congelado de 14s saiu do
  caminho — a luta começa na chegada.
- **As 3 fases agora LIGAM de verdade na luta** (o gancho antigo só existia no
  estado da intro — nunca rodava durante a luta real):
  **FASE I — O CÃO QUE CAÇA** (investida telegrafada: solo pulsando + seta),
  **FASE II — A FOME DAS TRÊS BOCAS** (leques conjuntos + pescoços que
  avançam), **FASE III — O ÚLTIMO PORTÃO** (arena escura, uivo, anéis de
  choque e a janela **VULNERÁVEL**).
- **O diálogo antigo pós-derrota e a ALMA NEGRA continuam intactos.**

---

## NOVO (v23 / v1.3.0) — O PORTÃO DO INFERNO

A grande **expansão pré-v2**, 100% aditiva. Módulo novo `expansion.js` (~2.400
linhas) enganchado por ganchos de 1 linha — nada antigo foi reescrito.

### Progressão nova (a descida completa)
1. **PENUMBRA DAS ALMAS — FASE 1**: sombras, almas perdidas (como era).
2. **PENUMBRA DAS ALMAS — FASE 2**: a terra que perdeu a vida — véu cinza,
   árvores mortas, poeira.
3. **PENUMBRA INFERNAL — FASE 1**: fissuras acesas, chuva de brasas.
4. **PENUMBRA INFERNAL — FASE 2**: as paredes deformam; o portão aguarda.
5. **CAMINHO DO PORTÃO**: caminhada sem inimigos até o portão gigante que
   abre devagar — e o **CÉRBERO remasterizado**: cutscene de entrada (as
   três cabeças observando direções diferentes, a central te acompanhando,
   o snap simultâneo), 3 fases (A FOME DAS TRÊS BOCAS aos 66%, O ÚLTIMO
   PORTÃO aos 33%) e cutscene de saída pelo portão.
6. **GARGANTA VULCÂNICA** (1 fase muito difícil): poças de lava, erupções
   telegrafadas — guardada pelo **FERREIRO DAS ALMAS**.
7. **CORREDOR AZULADO**: o vermelho morre, a névoa fria toma conta, o som da
   lava desaparece — até o barco de **CARONTE** (travessia narrativa; a run
   continua inteira).
8. **O LIMBO — 4 FASES** (2 normais + 2 infernais), terminando no tribunal do
   **JUIZ SEM ROSTO** — a vitória clássica agora é do fim do Limbo.

### Categorias elementais + sinergias
- 8 elementos: **Luz, Escuridão, Fogo, Água, Gelo, Vento, Raio, Terra** —
  chips coloridos nas cartas; sistema extensível (basta acrescentar entradas).
- **Pares novos**: VAPOR ESCALDANTE (fogo+água), PRISÃO DO AQUERONTE
  (água+gelo), CONDUTOR DOS CONDENADOS (água+raio), INCÊNDIO DO INFERNO
  (vento+fogo), SEPULTURA GLACIAL (terra+gelo) — com efeitos reais por frame.
- **Sinergias de itens**: CARNICEIRO, MADRUGADA, CADEIA ARDENTE, VENDAVAL
  GELADO, O COBRADOR, DUPLA TESTEMUNHA, TIRO PARLANTINO, MARÉ DE BRASA.
- **Grimório ganhou a aba SINERGIAS**: descobertas salvas em META.psyn;
  as não descobertas aparecem rasuradas (só a dica dos elementos).

### Conteúdo novo
- **16 bênçãos + 11 pactos novos**: Sol Estilhaçado, Halo Partido, Última
  Centelha, Coração do Vazio, Correntes do Pecado, Reflexo que Não É Seu,
  Brasa Insaciável, Lágrimas do Aqueronte, Silêncio Glacial, Pulmão do
  Vendaval, Nervos da Tempestade, Cinzas do Primeiro Mundo (+4 originais);
  Pactos do Açougueiro, da Hora Roubada, do Barqueiro, da Testemunha, do
  Falso Rei, da Última Pena, do Desenvolvedor, 404 (secreto), da Dívida
  Infinita, do Silêncio e do Péssimo Negócio — todos com preço real.
- **6 armas novas** na escolha inicial (cada uma com evolução): A SENTENÇA
  (→A ABSOLVIÇÃO), PISTOLAS DO ÚLTIMO PECADO (→A LITURGIA), O CREDOR
  (→JUROS DE SANGUE), COLHER COMICAMENTE GRANDE (→A SOPA DIVINA), PEIXE DE
  GUERRA (→PEIXE APOCALÍPTICO), TECLADO DO PECADOR (→TEMPESTADE DE TECLAS, renomeada na v1.3.3).
- **Novos chefes/encontros**: JUIZ SEM ROSTO (final do Limbo), FERREIRO DAS
  ALMAS (Garganta, troca de arma por fase de vida), ANJO ACORRENTADO
  (correntes destrutíveis, raro no Limbo Infernal), SERPENTE QUE ENGOLE
  ESTRELAS (secreta nas salas secretas do Limbo), THOR QUE NÃO DESCEU
  (aparece no caminho do portão para builds de 6+ bênçãos) e o CERVO
  DESFIGURADO (aparições silenciosas em salas vazias da Penumbra).
- **Dificuldades**: PUNIÇÃO, KAIZO (título), ABISMO (caçada em grupo) e
  PENITÊNCIA (desbloqueia ao concluir o Abismo) + 7 modificadores: Inferno
  Instável, Sem Misericórdia, Dívida de Sangue, Silêncio Absoluto, O Inferno
  Observa, Portas Fechadas, Sem Segunda Chance.
- **9 conquistas novas** + música por zona (vulcão, corredor azul, portão,
  Cérbero, Juiz) — sintetizadas, e continuam substituíveis por arquivo em
  assets/audio/music/.

### Correções pedidas
- **CUTSCENE DE TRANSIÇÃO (≤1s)**: ao passar de porta ou subir escadas, uma
  vinheta curta com a silhueta do Thor atravessando a fresta — e, para a
  **coisa de cervo**, quando ele cruza uma porta perto de você a fresta
  acende e a silhueta dele passa (não bloqueia o jogo, intervalo de 7s).
- **RECOMEÇAR NA ESCOLA**: morreu na escola e clicou **TENTAR NOVAMENTE**?
  Revive direto na fase da escola (o RECOMEÇAR da pausa segue para o menu
  normal de sempre).
- **MENSAGENS DE MORTE**: cada morte mostra uma zombaria DIFERENTE (sem
  repetir enquanto houver) — e depois de muitas mortes na sessão a besta
  desiste: só **"..."** e o jogo começa normalmente.
- **LATIDO DA ESCOLA CONSERTADO**: o ESPAÇO estava MUDO antes da revelação
  do cervo (state 'none') e depois que ele ia embora ('gone'/'illusion') —
  parecia bug. Agora o latido **sempre soa** (som + partículas + mensagem);
  atrair a criatura continua funcionando exatamente como antes.

## NOVO (v22 / v1.2.3) — ANDAR DE CIMA

- **O RELÓGIO DA SALA DE CIMA (fix do soft lock de escada)**: um erro antigo
  (da v1.2.0) fazia **entrar em corrA2/salaA21 quebrar o DESENHO do jogo em
  silêncio** — a tela congelava (o jogo rodava por baixo, invisível). Era a
  causa real do "trava ao subir a escada". Consertado: o relógio desenha.
- **A ESCADA É INSTANTÂNEA**: antes ela usava o timer cancelável das portas
  (0.42s) — quem continuava andando (ou parava a 26–48px e voltava a andar)
  cancelava a travessia sem perceber e passava reto (parava noutra sala, ex.:
  salaA11). Agora é **pisou, sobe**.
- **ANTI-PÊNDULO (histérese + cooldown)**: ao chegar no andar de cima, a escada
  de volta fica **muda** até você se AFASTAR (raio 48px) e re-encostar de
  propósito — não desce mais sozinho com a tecla pressionada, e **parar em
  cima dela não dispara nada**. Pela escada você nasce 44px para dentro.
- **CONFIRMAÇÃO DO ANDAR**: usar qualquer escada mostra o nome do andar
  ("estrutura A — andar de cima.") — progresso visível.
- **Cache-busting no workspace**: os scripts carregam com `?v=` — o navegador
  nunca mais mistura arquivos antigos do cache com os novos.

## v21 — v1.2.2 "TRAVESSIA LIVRE" (resumo no changelog dentro do jogo)

## NOVO (v21 / v1.2.2) — TRAVESSIA LIVRE

- **FIM DO CONGELAMENTO AO PASSAR DE SALA** (subir a escada, atravessar
  portas): a causa era pedido de rede **SÍNCRONO** — a thread do jogo ficava
  presa até responder, a cada **15s** e a cada **foco da janela**. Em disco
  local era instantâneo; via preview/proxy, travava por segundos. Tudo agora
  é **assíncrono** (manifesto `sprites.txt` + listagem da pasta).
- **Varredura de sprites enxuta**: sem listagem, o re-scan disparava ~1.000
  pedidos por ciclo (afogava a rede); agora a fila de fallback roda **uma vez
  só** (na carga) e o ciclo de 15s faz **1 pedido** quando há listagem.
- **Relógio de segurança da travessia**: se a queda entre salas ficar presa
  por qualquer motivo, ela se conclui sozinha após 4s — soft lock de
  travessia, nunca mais.
- **Workspace**: a listagem de diretórios funciona nele — sprites próprios
  soltos em `assets/sprites/` são detectados (~15s) também pelo workspace.

## v20 — v1.2.1 "OLHOS NO ESCURO" (resumo no changelog dentro do jogo)

## NOVO (v20 / v1.2.1) — OLHOS NO ESCURO

- **FEIXE DO REI é AZUL**: a bênção ativa dispara um feixe azul
  (aura `#9fd4ff`, corpo `#7fb8ff`, miolo branco-gelo). O feixe dourado
  permanece apenas na sinergia **PISTOLAS DUPLAS + O FEIXE**.
  Sprite trocável em `assets/sprites/armas/feixe.png`.
- **CERVO CONCERTADO (esconderijos)**:
  - Enquanto você está escondido ele **NÃO congela mais** — continua
    patrulhando, entra na sala, fuça e **vai embora**.
  - Escondido **sem ele ver**, ele não te acha. Ele só vem se:
    **viu/ouviu você entrar** (estava na mesma sala na hora),
    for a **caçada final** (incêndio), ou o esconderijo foi **aprendido**
    (2+ usos no mesmo lugar — ele lembra).
  - **Sem teleporte**: ele **caminha de porta em porta** até o armário.
    Saiu no meio do caminho? Ele chega num armário vazio, procura e parte.
  - **Sair do armário é sempre possível** — só não dá mais quando a porta
    já está sendo arrancada (fase final do achamento).
  - Se ele **não consegue chegar** (portas trancadas no caminho), **desiste**
    e o rastro esfria.
- **ANTI SOFT-LOCK**: a morte do cervo limpa todo estado de esconderijo;
  a tela de morte e os botões sempre respondem.

## v19 — v1.2.0 "A ESCOLA EM CHAMAS" (resumo no changelog dentro do jogo)

## NOVO (v19 / v1.2.0) — A ESCOLA EM CHAMAS

**A escola virou o ato final:**
- **Enigmas completos e mais difíceis**: os últimos enigmas existem — agora são
  possíveis os **8 fragmentos**. Cinco livros na ordem, relógios que exigem a
  **ordem dos selos coloridos** e registros que fazem barulho (a escola escuta).
- **O cervo**: a **primeira aparição é uma ILUSÃO** (alguns segundos depois ele
  vem de verdade). Cada fragmento o deixa **mais insano** — mais rápido, ouve
  mais longe e arma **EMBOCADAS** atrás das portas.
- **O ESPELHO**: **6 toques [Z]** abrem o mundo espelhado — onde **VOCÊ MESMO**
  caça: olhe DIRETO para ele e ele para; encare-o 1.6s e o **8º fragmento se
  revela** (ele mora na sala dos professores invertida).
- **O RITUAL FINAL**: com os 8 fragmentos, o pentagrama do pátio **alaga** a
  escola e então **tudo pega fogo** — FUJA pela porta acesa da entrada enquanto
  o cervo persegue **na sua velocidade**.
- **VENCEU?** Conquista única **A ESCOLA EM CHAMAS** + tela especial de fuga
  (clique volta ao menu) + liberados para as próximas descidas: **CINZAS DO
  RITUAL** (bênção), **O PACTO DA FUGA** (pacto) e **SINO DA ESCOLA** (item).

**Fora da escola:**
- **PISTOLAS GÊMEAS APARECEM** (a chamada de render faltava!) com sprite em
  `assets/sprites/armas/` — e viram **PISTOLAS DUPLAS** ao serem pegas DE NOVO;
  aí sim, com **O FEIXE**, nasce a transformação completa (feixe dourado).
- **3 novas bênçãos**: **GARRA DE FERA**, **FEIXE DO REI** (ativa, dourada) e
  **INSTINTO DE PANTERA** (desvio intocável).
- **Baús** agora dão apenas **fagulha, coração ou almas**; **salas de desafio
  sempre** pagam com baú + bênção/item à vista.
- **Puzzles do jogo comum** mais difíceis (pulso mais rápido, memória menor) e
  a variação nova **CÍRCULO DAS CORES**: acerte a cor pedida **5 vezes seguidas**.
- **Sprites direcionais** (`thor_frente/tras/lado.png`,
  `<inimigo>_frente/tras/lado.png`), **GIF animado** e **VÍDEO (mp4/webm)**
  detectados na pasta de sprites, + cutscene da escola (`cutscene.png|gif|mp4`).

## NOVO (v18 / v1.1.4) — SANGUE BARATO

- **O altar de sacrifício ficou barato**: em vez de exigir 10 corações (a vida
  inteira), o pacto custa apenas **10 DE VIDA**. Um beliscão por um pacto selado —
  e continua repetível (um sacrifício por visita à sala do altar).
  Textos do altar, da dica `[Z]` e do grimório atualizados juntos.
- **Senha secreta do modo dev**: no menu, digite `nerdcirno67`, depois `penumbra`
  e por fim `TransMiranda` — o **MODO NERDCIRNO67** destrava na hora, sem precisar
  das conquistas, com a mensagem "ou vc pode ser um chato que nn quer as
  conquistas...faça oque quiser". Maiúsculas não importam; com TODAS as conquistas,
  `nerdcirno67` sozinho continua ligando/desligando o modo, como antes.

## NOVO (v17 / v1.1.3) — A FACE DO PACTO
- **Arte própria (sprite) para bênçãos, pactos e itens ativos**: coloque um PNG
  (ou JPG/WEBP) em `assets/sprites/drops/` com o **ID do item** (`forca.png`,
  `iraodin.png`, `latido.png`…) ou com o **nome** dele sem acentos/espaços
  (`forca-do-pacto.png`, `latido-infernal.png`…). ~64×64 px fica ideal.
- O sprite aparece **na carta** da escolha de bênção, **no drop** do baú, **na
  feira** do Errante, no **drop de item ativo** e nas **miniaturas** do grimório
  e da arca [3]. A lista completa dos nomes aceitos (46+18+1) está em
  `assets/sprites/drops/COLOQUE-SPRITES-AQUI.txt`.
- Sem arquivo, o glifo/nome de sempre é usado — nada quebra. Itens visíveis
  re-leem a pasta a cada ~6s (troca de arte com o jogo rodando!); no console:
  `__DROPS_RESCAN()` força, `__DROPS_DEBUG()` diagnostica.
- Corrigido também um texto duplicado da v1.1.1 que aparecia no changelog
  depois da entrada da v1.1.2.

## NOVO (v16 / v1.1.2) — A FEIRA DO ERRANTE

- **A loja agora é no CHÃO**: as mercadorias do Errante ficam expostas ao redor dele
  (num arco rente — não é um círculo, não fica espalhado, nada muito longe), cada uma
  com o **preço em almas**. **Caminhe até o item e pressione [Z]** para comprar.
- **Comprar não derruba nada**: o efeito é imediato na hora da compra — e o presente
  do **REGATEADOR** (primeira compra grátis com relíquia) agora vem direto, sem drop.
- **Correções do menu**: o **Cérbero não aparece mais atrás da tela de escolha de
  arma** (a seleção é opaca, no estilo do menu novo) e **o título/nunca mais fica
  atrás da porta de pedra** (veias de brasa e fumaça foram para trás do texto).

## NOVO (v15 / v1.1.1) — A ESCOLA ESQUECIDA

- **A escola saiu da descida**: o fim do Limbo volta a levar direto ao **PORTÃO** como
  antes — a POÇA "afoga-se" não existe mais, e o 4º andar revela o **LIMBO** de novo.
- **A escola virou opcional**: uma **porta de teste** no menu **CÍRCULOS** (card `???`).
  Por enquanto ela está **sempre aberta** — sem exigir 3 descidas — apenas para testar
  se está funcionando corretamente. Quando o teste acabar, a porta volta a exigir
  3 descidas (ou o parâmetro `?escola=1`).
- Chegar ao fim da escola pela porta de teste conduz ao encontro com **Caronte** e à
  descida normal, como era antigamente.

## NOVO (v14 / v1.1.0) — O LIVRO DOS CONDENADOS

### MENU INFERNAL (inspiração: Divina Comédia)
- **Tela inicial refeita**: uma enorme porta de pedra quase na escuridão, com inscrições
  vivas ("CONDEMNATVM · INFERNVM"), fenda de luz respirando, fumaça e veias de brasa.
  O mouse desloca a câmera da porta (parallax); ao escolher uma opção, ela abre parcialmente.
- **Botões diegéticos**: `DESCER` · `RETORNAR` · `CÍRCULOS` · `ALMAS` · `INVENTÁRIO` ·
  `GRIMÓRIO` · `OPÇÕES` · `ABANDONAR O INFERNO`.
- **DESCER** abre o mapa vertical do Inferno (PARAÍSO → IX…I → LIMBO) com a maioria dos
  círculos riscados — "Você acredita que conhece o caminho?".
- **RETORNAR** abre o **LIVRO DOS CONDENADOS**: cada save é uma folha (Condição, Última
  descida, Karma, Estado da alma) — e quem já foi convidado encontra a **folha queimada**.
- **Dante em pessoa**: trechos em italiano/latim surgem no menu. Fique parado alguns
  segundos: a câmera desce, a música baixa — e **CÍRCULO X** pisca uma vez. Ninguém explica.
- **Paleta**: preto, marrom envelhecido, cinza de pedra, vermelho escuro, branco queimado.

### ALMAS + GRIMÓRIO
- **CONQUISTAS virou ALMAS**: registros de almas; as não reveladas aparecem como
  `[REGISTRO CORROMPIDO]` (a dica continua lá). Contador de **PECADOS CONHECIDOS n/7**.
- **GRIMÓRIO** com 8 categorias: DEMÔNIOS, BOSSES, ENTIDADES, PACTOS, BÊNÇÕES, MALDIÇÕES,
  CÍRCULOS e FRAGMENTOS — fichas com STATUS, CÍRCULO e NATUREZA.
- O **INVENTÁRIO** (antigo códice) guarda o que você carrega nesta descida — incluindo as
  **SENTENÇAS DOS PECADOS** aceitos.

### GAMEPLAY
- **FAGULHA EXPLOSIVA virou arma**: `[Q]` dispara a brasa — um tiro normal, só que
  explosivo (estoura em área nos demônios e detona as paredes rachadas). Tiro comum
  não gasta mais a fagulha.
- **Salas secretas sem link no mapa**: nem depois de descobertas — achá-las é a recompensa.
- **O VELHO REI** agora só caça **SALAS SECRETAS** (1% de chance ao entrar).
- **O ERRANTE não abandona mais o posto**: voltar à loja o reencontra com o mesmo estoque.
- **Salas de enigma sem estruturas**: só o mecanismo — nada de colunas e entulho.
- **Sala de sacrifício refeita**: exige **10 corações** (sempre), é **repetível** sem sair
  da sala e paga **sempre** com um **PACTO**.
- **BÊNÇÃO × PACTO**: bênção é o poder comum; **pacto** é o acordo que sempre dá buff E
  nerf (Coração Falso, Corpo de Vidro, Pacto da Fome, Olho Gordo…) — e é o pagamento
  padrão do altar. Cartas e catálogo marcados como `BÊNÇÃO ·` ou `PACTO ·`.
- **O FEIXE** agora recebe **multiplicadores de tiros** (Lâminas Gêmeas = feixes em leque)
  e **aplica elementos** (gelo/fogo/veneno/trovão) em quem atravessa.
- **PISTOLAS GÊMEAS com aparência de duas pistolas** (uma em cada pata, clarão ao atirar).
- **GÊMEAS DO FEIXE (transformação) refeita**: durante a carga, a outra pistola cospe
  **mini-feixes rápidos** (fracos); soltou a barra cheia, ela dispara um **feixe +40% de dano**.

### OS SETE PECADOS CAPITAIS — SENTENÇAS
21 bênçãos/pactos foram marcados com pecados (3 por pecado). Aceite 3 do mesmo pecado e
receba a **SENTENÇA** dele, um buff único e permanente:
- **A GULA** (Coração, Fome da Fera, Fome Insaciável): a cada 15 abates, +5 de vida máxima.
- **A AVAREZA** (Ganância, Ímã de Almas, Pacto do Vão): almas +50% e lojas 20% mais baratas.
- **A IRA** (Ira do Soberano, Olho Gordo, Sede de Sangue): levar dano detona fúria em chamas.
- **A SOBERBA** (Espelho Quebrado, Pesadelo Cego, Corpo de Vidro): vida cheia = +30% de dano.
- **A INVEJA** (Olho do Caçador, Olho do Vigia, Isolamento): +3 almas por abate.
- **A PREGUIÇA** (Sangue Grosso, Sangue Pesado, Carga de Pedra): parado 1s, cura 2 HP/s.
- **A LUXÚRIA** (Lágrimas, Coração Falso, Vendaval): inimigos próximos ficam 25% mais lentos.


## NOVO (v13 / v1.0.0) — A QUEDA DOS PACTOS

### CONVERSÃO TEMÁTICA: MITOLOGIA NÓRDICA → DEMONOLOGIA INFERNALE
- **Não é mais uma aventura de um deus antigo no Inferno.** O universo agora é
  **demonológico e próprio**: hierarquia do Trono Cinza → Sete Selos → Arquidemônios →
  Senhores de Círculo → demônios → almas condenadas.
- O protagonista é **THOR, o cão-executor do Trono Cinza** — descendo círculo por
  círculo para cobrar o **pacto quebrado** pelos Arquidemônios. A "vingança" agora tem
  dono, dívida e selo.
- **Bênçãos viraram PACTOS** (com preços escondidos em algumas). Itens renomeados:
  FORÇA DO PACTO, GELO DO PRIMEIRO FRIO, FOGO DA PRIMEIRA CHAMA, TREVAS DO VÉU,
  O VEREDICTO (o martelo), IRA DO SOBERANO, ÉGIDE DO PACTO, TROVÃO DO JUÍZO,
  LÁGRIMA DA PECADORA, ANEL DO INVERNO ETERNO, AURORA PROFANA, PUNHO DO VEREDICTO…
- **Limbo → ABISMO** — o falso paraíso onde as almas não avançam nem desaparecem.
- **O ERRO 404** agora é a anomalia que os registros do Inferno apagaram — algo
  anterior à hierarquia, que nem os demônios sabem nomear.
- Lore ambiental espalhada: nomes raspados nas paredes, degraus contados até o
  Trono Cinza, perguntas da pedra que ensinam a hierarquia sem explicar nada.

### ENIGMAS SEM INDICAÇÃO — E SEMPRE COM BAÚ
- **Placas**: sem números. A sequência **pulsa uma única vez** (estilo Simon) e depois
  é memória pura — erro não revela nada.
- **Braseiros**: a barra de ordem **saiu**. As chamas pulsam a ordem uma vez no chão;
  na dificuldade alta existe uma **lacuna** que não pulsa.
- **Todo puzzle resolvido materializa um baú** — dificuldade com recompensa garantida.

### SALAS SECRETAS REAIS + FAGULHA EXPLOSIVA
- Salas secretas **saíram do mapa**: nem desenho, nem "?" — a única pista física é uma
  **parede rachada** discreta (poeira cai dela).
- A parede só cede à **FAGULHA EXPLOSIVA** (consumível): tiro ou mordida com fagulha
  no bolso detona a passagem.
- Fagulhas caem de **inimigos LARANJAS** (garantido), raramente de inimigos normais
  (2%) e estão no estoque do ERRANTE.

### RAROS DA DESCIDA — E VIDA MAIS RARA
- Inimigos normais têm **5% de chance de nascer raros**:
  - **VERMELHO** (2,5%): mais duro e **dropa coração garantido**;
  - **LARANJA** (2,5%): **dropa FAGULHA EXPLOSIVA garantida**.
- Drops de vida comuns caíram de ~50% para ~16% por abate — almas são o sustento.

### SINERGIAS NOVAS + ARMAS NOVAS (pistolas e feixe)
- **VAPOR FERVENTE** (fogo+gelo): **o tiro morre** — Thor exala fumaça fervente de
  alcance curto que queima continuamente quem tocar.
- **REAÇÃO VOLÁTIL** (fogo+raio): raio em inimigo **em chamas** detona em explosão.
- **PISTOLAS GÊMEAS** (arma nova): dois canos, cadência rápida, bala leve.
- **O FEIXE** (arma nova): **segure o disparo para carregar a barra; solte cheia** e o
  raio perfura tudo na linha. Mudança real de dinâmica.
- **GÊMEAS DO FEIXE** (transformação): com as duas, as pistolas **canalizam o feixe** —
  soltar dispara **dois raios gêmeos** paralelos.

### OUTROS
- Conquistas: descrições viraram **dicas abrangentes** (nada de "como desbloquear").
- Catálogo do grimório: descrições de pactos/armas só se revelam **depois de selados**
  numa descida anterior (salvo no save).
- Mensagem de especialização **se apaga sozinha** (corrigido o banner eterno — causa
  raiz: banner nascendo sem timer).

---


## NOVO (v12 / v0.9.16) — A FORJA DE BUILDS

### KAIZO É UM TÍTULO — E CADA BOSS TEM SEUS PADRÕES EXCLUSIVOS
- A barra e o banner agora mostram **KAIZO — [nome real do boss]** (ex.: *KAIZO — O BRUXO DA PENUMBRA*).
- Cada um dos 4 mini-bosses ganhou **3 padrões exclusivos** com **telegráficos visuais
  (círculos/linhas piscando com arco de progresso) e sonoros** — dá sempre para reagir:
  - **Bruxo**: sigilos que detonam ao seu redor, espelhos que disparam leques, cometas perseguidores;
  - **Carrasco**: guilhotinas verticais telegrafadas, corrente giratória em leque, execução em cruz;
  - **Viúva**: teias que prendem o chão, ninhada de aracnídeos, laço em anel que fecha;
  - **Golem**: fissuras que cospem fogo em linhas, tempestade de cinzas, núcleo fundido em espiral com brechas.
- **FASE II aos 50% de vida**: o boss desperta (aviso claro, tela treme, projéteis somem),
  fica mais rápido, usa mais os padrões exclusivos e **encadeia combos** (anti-decoração).
- A dificuldade vem da **complexidade e combinação** — não de vida/dano inflados. Brechas reais em tudo.

### 3 BÊNÇÃOS DO MESMO TIPO = ESPECIALIZAÇÃO (com mensagem única em 2 atos)
- Primeiro surge **"3 BÊNÇÃOS DE GELO…"** — depois a tela anuncia a especialização com
  som, flash e partículas. São **13 especializações**: BRUXA DO GELO, FILHO DAS CHAMAS,
  VOZ DA TEMPESTADE, SENHOR DO SANGUE, CÁLICE DA PESTE, COROA DAS TREVAS, AURORA PROFANA, DANÇARINO DO VENTO, FILHO DA FERA, CAMPEÃO DA GUERRA, VÓRTICE DAS ALMAS,
  CHUVA DE AÇO e PUNHO DO VEREDICTO. Cada recompensa **muda mecânicas** (congelados explodem,
  abates curam, cada kill chama relâmpago, dash corta inimigos…), não só números.
- Ativa **uma vez por conjunto por run** (registrado em `game.specs`).

### SINERGIAS DE PAR — builds cruzadas
- Bênçãos de tipos diferentes formam **10 sinergias**: VAPOR CORTANTE (gelo+fogo),
  SUPERCONDUTOR (gelo+trovão), GRANIZO PESADO (gelo+projéteis), PRAGA ÍGNEA
  (fogo+veneno), FERVURA DO SANGUE (fogo+sangue), ESTÁTICA DO VENTO (trovão+vento),
  ECLIPSE (luz+trevas), LUZ VITAL (luz+sangue), MIASMA PROFUNDO (veneno+trevas),
  VENTO CORTANTE (vento+projéteis). Efeitos reais em applyElem/elemDmg/abates.

### SÓ 1 ITEM ATIVO — E 12 ATIVOS NOVOS
- Pegar um ativo com outro equipado **dropa o antigo no chão** como pickup
  (roxo, nome visível) — a escolha é sua. **Nunca dois ao mesmo tempo.**
- HUD nova: círculo com **tag ATIVO**, nome do item e recarga (na escola vira o
  LATIDO com tag ESC — roxo vs dourado distinguem ativo de passivo).
- Novos ativos: **AMPULHETA QUEBRADA** (tempo dilatado a 40%), **PORTA DAS SOMBRAS**
  (teleporte + bomba), **MURMÚRIO DOS CORVOS** (2 corvos caçadores), **ÉGIDE DO PACTO**
  (bloqueia 3 golpes), **SEMENTE DA VIDA** (regeneração), **PIROCLASMO** (3 ondas de fogo),
  **DECRETO DO ABISMO** (inimigos frágeis +40%), **IMAGEM ESPELHADA** (isca),
  **MUNIÇÃO ÉTERICA** (tiros atravessam), **FORMA DA FERA** (transformação),
  **CHAMADO DO PRIMEIRO FOGO** (meteoros telegrafados), **ANEL DO INVERNO ETERNO** (congela tudo).

### MENU DE CONQUISTAS — SALÃO DOS TROFÉUS
- Botão **CONQUISTAS** no menu: todas as 22 conquistas com **dica de desbloqueio**,
  **barra de progresso**, desbloqueadas ★ douradas vs bloqueadas ☆ cinzas.
- Notificação de **TROFÉU** (medalha dourada pulsante) distinta das mensagens comuns.
- Novas conquistas: FORMA BRANCA, CAÇADOR DE KAIZO, ALQUIMISTA, GRIMÓRIO DAS MARCAS,
  ESCOLHIDO, PANTEÃO, ARSENAL PESSOAL, MIL ALMAS. Tudo salvo junto ao save (META.conq).

### O TEMPO PARADO NUNCA MAIS TRAVA O JOGO (correção definitiva)
- **Causa raiz achada**: a onda visual do O MUNDO entrava na lógica de dano das
  shockwaves (sem `hit` Set) e lançava exceção DENTRO do frame — o laço continuava,
  mas atualização e render morriam: **tela congelada** com inimigos em cena.
- **Correção**: ondas sem `dmg`/`hit` viram só visual; decremento de worldT/slowMoT
  é **único e centralizado no frame()** (funciona em play, bossintro, carontefight,
  corridor — não importa onde ativar); teto de segurança de 12s; **zero setTimeout**.
- Bônus: **AMPULHETA** traz câmera lenta integrada ao laço (inimigos a 40%, tudo o
  mais vivo — HUD, input, efeitos), e telegráficos KAIZO congelam junto com O MUNDO (justo).


## NOVO (v11 / v0.9.15) — A IA DO COISA DE CERVO REFEITA: NADA DE TELEPORTE

### ELA CAMINHA (e nasce no PÁTIO)
- A criatura da escola **não teleporta mais** — acabou o "aparece do nada".
  Ela agora **sempre nasce no PÁTIO** e **anda de sala em sala**, atravessando
  as portas de verdade (entra pela porta, do lado certo, visível).
- Enquanto vaga, escolhe salas aleatórias, fuça cantos, **para para escutar**
  (vira a cabeça, o cone de visão acompanha) e segue adiante.

### ELA ESCUTA
- **Passos normais** (andar) são ouvidos **na mesma sala**;
- **Correr (dash)** e **portas rangendo** atravessam paredes (até 2 salas);
- **SHIFT (andar devagar)** quase não faz barulho — nem do lado ela escuta;
- **ESPAÇO (latido)** atrai ela de **qualquer lugar** da escola até o ponto exato;
- Ouviu algo? Ela **caminha até o local**, fuça por um tempo e volta a vagar.

### ELA PERSEGUE DE VERDADE
- Se ela te ver dentro do **cone de visão**, começa a caçada — e agora a
  perseguição é **física**: ela **corre atrás de você porta a porta**. Se você
  atravessar a porta primeiro, ganha vantagem — ela precisa contornar.
- Ela **te perde** se quebrar a linha de visão (vai procurar por onde você
  estava), e **não atravessa o espelho** — o mundo invertido é refúgio.
- No **ritual**, ela caminha até o ponto de onde assiste (e vai embora quando
  a água sobe). No **1º fragmento**, ela atravessa a escola inteira pra te ver
  de perto — e depois **sai andando** pela porta, sem sumir.

## NOVO (v10 / v0.9.14)

### KAIZO AGORA É A VERSÃO DO MODO ABISMO (hardmode)
- O boss de mapa que **repete na run** (KAIZO, branco) passou a usar, mesmo em
  **run NORMAL**, os **stats base do modo ABISMO**: vida, velocidade e cadência
  do hardmode — e por cima os multiplicadores kaizo (+60% vida, +18% velocidade,
  ataques 28% mais rápidos).
- Os **padrões** também ficaram os do hardmode: o Bruxo kaizo usa os feitiços
  extras do abismo (shotgun, rings, bothwalls, twin) e todos os 4 mini-bosses
  (Bruxo, Carrasco, Viúva, Golem de Cinzas) com timings, salvas e paredes
  extras da dificuldade alta. Resumo: **kaizo = o boss do hardmode no normal**.

### O MODO SECRETO AGORA SE CHAMA NERDCIRNO67
- No menu, digite **"NerdCirno67"** (letras e números, qualquer maiúscula) —
  a palavra antiga "penumbra" não funciona mais.
- A regra continua: só abre com **TODAS as conquistas**, e nele **nenhuma
  bênção é concedida** (baú/tesouro viram almas).

### O ERRANTE COBRU CARO PELO QUE É FORTE
- O básico continua barato: coração 12, bênçãos fracas/médias 14–22.
- Mas se ele oferecer algo **forte**, o preço dispara:
  * **Bênção rara (q3): 90–135 almas** (marcada com ◆ RARO na loja);
  * **Armas** (Trovão à Distância / Mordida da Fera): **140 almas**.
- SORTE DO ERRANTE e REGATEADOR continuam dando desconto em tudo.

### ESPELHO DA ESCOLA: 3 TOQUES PARA ATRAVESSAR
- Com 7 fragmentos, o espelho do banheiro **não abre de primeira**: é preciso
  interagir com **[Z] 3 vezes**. Nas duas primeiras o vidro range, o reflexo
  atrasa e a superfície ondula (com contagem 1/3 e 2/3 na tela); na terceira
  o mundo espelhado finalmente te engole. O contador fica salvo no progresso.


## NOVO (v9 / v0.9.13) — o fim do Limbo afoga, bosses repetem brancos e o save não some

### O FIM DO LIMBO: A POÇA "AFOGA-SE"
- Ao terminar o **Limbo inteiro** (Cérbero cai), não aparece mais um portal
  para o final antigo: surge uma **POÇA DE ÁGUA** com a mensagem
  **"afoga-se"**. Entre nela e Thor se afoga — e **acorda na ESCOLA**.
- Quem entra na escola assim está **SEM ARMAS** (removidas temporariamente:
  tiro, mordida, parry, serra e lâmina voltam só quando você sai).

### CARONTE TEM BÊNÇÃO ÚNICA
- Derrotar o barqueiro concede o **MANTO DAS ALMAS** (só ele dá):
  +35% almas · +15% dano · +1 coração. Aparece no livro.

### MODO PENUMBRA GANHOU REGRA (e conquistas existem agora)
- **14 CONQUISTAS** novas (lista completa no LIVRO — tecla B, ou botão
  BESTIÁRIO no menu): abates, vitórias, Caronte, Erro 404, os 4 Cavaleiros,
  a Alma do Rei, a escola, o castelo, modo inferno, todas as relíquias,
  20 espécies no bestiário...
- O **MODO PENUMBRA** (desde v10 renomeado: digite **"NerdCirno67"** no menu)
  só abre com **TODAS as conquistas** — e nele **nenhuma bênção é concedida**
  (baú/tesouro viram almas; a run começa avisando).

### BOSSES REPETIDOS = KAIZO
- Se o chefe do mapa **já apareceu nessa run** e volta, ele vem na versão
  **KAIZO**: nome **KAIZO**, textura esbranquiçada (aura branca),
  **+60% vida, +18% velocidade e ataques 28% mais rápidos**.

### DROP DO BAÚ = NOME + COR
- O item no chão mostra **APENAS O NOME do item com a COR da raridade**
  (comum cinza · raro azul · épico laranja · lendário violeta) — sem textura.
- Quer imagem própria? Coloque um PNG em `assets/sprites/drops/<id>.png`
  (ex.: `forca.png`, `iraodin.png`) — aí ela substitui o nome.

### O ERRANTE FICOU GENEROSO (porém mais fraco)
- A loja agora vende **3 bênçãos comuns baratas (14–22 almas)** + coração
  a 12 + às vezes uma rara a 26; armas por 55 (era 65).

### MAIS VARIAÇÕES DE INIMIGOS (bullet hell)
- **8 elites novos** (16% a partir do 2º círculo; 8% no 1º, +8% no difícil):
  Sombra Anciã, Brutamonte Podre, Cuspedor Cego, Feiticeiro Rasgado,
  Ceifa Negra, Osso-Santo, Vigia Triplo, Enxame Abissal — vida/velocidade
  maiores, **atacam quase 2× mais rápido**, anel vermelho e registro próprio
  no bestiário (tipo+'E').

### BESTIÁRIO DE VERDADE
- Cada inimigo visto mostra **RETRATO + VIDA + VELOCIDADE + DANO + descrição**.
- Novas seções: **CATÁLOGO DE BÊNÇÕES** (todas, com raridade) e
  **ITENS ATIVOS** (com recarga), e **CONQUISTAS** (★/☆).

### A ESCOLA FICOU MAIS VIVA (e mais cruel)
- **1º fragmento = ELA VEM ATÉ VOCÊ**: quando a mensagem aparece, a criatura
  nasce na borda mais distante e **caminha até quase encostar** — é assim
  que você a conhece. Ela encara você e recua (não mata na apresentação).
- **ESPAÇO = LATIDO**: faz um som alto e **ela vai ao local EXATO** onde
  você estava (use com muito juízo — ou de propósito).
- **CAMPO DE VISÃO EM CONE (±76°)**: estar na mesma sala NÃO basta — ela
  precisa te VER no cone. Atravessar por fora do cone é possível; barulho
  continua a atraindo. O cone aparece desenhado em vermelho fraco.
- **PORTAS COM SOM**: Thor agora **abre** a porta (0,4s) com rangido —
  se ela estiver perto, **ela ouve** e vem conferir.
- **SHIFT = ANDAR DEVAGAR**: passos quase inaudíveis (o desvio fica
  desativado dentro da escola — Shift não é mais dash lá).
- **ESCONDERIJOS NOVOS**: 6 mesas de aluno + mesa do professor (14 pontos no
  total). Mesa = meio óbvio; mesa do professor = óbvio demais (ele acha
  rápido). **Esconder 2+ vezes no MESMO lugar ensina ele** — mesmo de longe,
  ele lembra e vai direto naquele esconderijo.

### SAVES: NÃO SUMIRAM NUNCA MAIS
- **O CONTINUAR agora é persistente** (localStorage): fechar o navegador
  não apaga mais a partida em andamento — era por isso que o save "sumia".
- SAVES ganhou: **renomear** o slot (ex.: "bruno"), **backup automático**
  antes de deletar (+ botão restaurar), e **EXPORTAR / IMPORTAR** todos os
  slots num arquivo `.json` (leva o save para qualquer navegador/pasta).
- Campos desconhecidos de saves antigos **nunca mais são descartados**.

### SLOTS NOVOS PARA VOCÊ EDITAR (nada quebra sem eles)
- `assets/sprites/drops/<id>.png` — imagem opcional do drop do baú.

## NOVO (v8 / v0.9.12) — A ESCOLA fica pior (de propósito)

### O CERVO (o caçador)
- **Qualquer 1º fragmento ativa a criatura** — antes só o da sala de aula.
- **SUSTO de tela inteira**: quando ele te alcança (ou abre o armário),
  a tela vira RUÍDO ESTÁTICO + a caveira de cervo cresce no centro.
- **ARMÁRIOS (esconderijo)** em 8 pontos: Z perto do armário esconde você.
  Esconder COM o caçador ativo é sentença de morte: cutscene — ele anda
  até o armário devagar, abre, e aí vem o susto. Esconder com a escola
  vazia é seguro (Z de novo para sair).
- **Coração acelera**: quanto mais perto ele está, mais rápida a batida.

### A ESCOLA INVERTIDA
- **O mundo inteiro aparece ESPELHADO** e o véu agora é AZUL (e mais escuro).
- **O caçador lá não é o cervo: é VOCÊ** — mesmo sprite do Thor, tremendo
  e distorcendo cada vez mais perto, com ecos fantasma e olhos vermelhos.
- **Olhar com o mouse**: dentro da escola invertida, segure o botão do
  mouse para encarar o cursor.

### PUZZLES MAIS DIFÍCEIS
- Ordem dos livros e horas dos relógios **sorteadas a cada entrada**
  (sem decoreba) — o mural da entrada e as mensagens continuam dando a dica.
- **4 registros** em vez de 3 (o banheiro ficou maislotado).
- O **3º relógio mudou de sala**: está no corredor de cima agora.

### SLOTS NOVOS PARA VOCÊ EDITAR (nada quebra sem eles)
- `assets/sprites/escola/cervo-caveira.png` — caveira do susto
- `assets/sprites/escola/rosto.png` — rosto do susto na escola invertida
- `assets/sprites/escola/estatica.png` — textura do ruído do susto
- `assets/audio/sfx/heartbeat.mp3` (ou `assets/audio/heartbeat.mp3`) — a batida

## CORRIGIDO (v8 / v0.9.12) — os 10 bugs da escola
1. 🔴 **A inundação nunca começava** — o ritual terminava e o nível da água
   ficava preso em 0 (updateFlood só rodava com nível > 0). Agora a água
   sobe, atrapalha a velocidade e afunda o centro.
2. 🔴 **Bênção/tesouro com tela vazia** — o jogo procurava `#cards` mas o
   HTML tem `#upgradeCards`; as cartas agora aparecem de verdade.
3. 🟠 **Porta da chave nascia aberta para sempre** — o código mutava o dado
   global das salas. A destrava agora vive no progresso salvo (e sobrevive
   a fechar/abrir o jogo).
4. 🟠 **`?frag=N` era só visual** — agora também libera as CONDIÇÕES
   (livros/ordem, registros, relógios+pad, abrigo, espelho pronto,
   caçador ativo).
5. 🟠 **`?frag=N` não valia na escola-da-run** — agora vale nos dois
   caminhos (menu e 4º andar).
6. 🟠 **CONTINUAR jogava a água fora** — o snapshot não guardava
   inundação/ritual; agora devolve a água no nível exato e o ritual no
   ponto em que estava.
7. 🟠 **Espelho permitia entrar infinitas vezes** — depois do 8º
   fragmento o espelho FECHA ("o espelho não mostra mais nada").
8. 🟠 **Escadas A e B inconsistentes** — as duas escadas agora chegam no
   MESMO lado de onde se sobe (A: oeste→oeste, B: leste→leste).
9. 🟡 **Botão da SERRA não funcionava na escola** — o estado `school`
   faltava na lista; agora arremessa (e mira o mouse).
10. 🟡 **Botão do LIVRO não funcionava na escola** — abre agora, e ao
    fechar volta para a escola (antes devolvia para 'play' e corrompia
    o estado).
- Versão do menu atualizada: **v0.9.12**.

## NOTAS DO v10 / v0.9.14
- Versão do menu: **v0.9.14**.
- KAIZO, preços do ERRANTE e o espelho de 3 toques valem também no
  CONTINUAR (o contador do espelho viaja com o progresso da escola).

## NOTAS DO v9 / v0.9.13
- Versão do menu: **v0.9.13**.
- Se o save "bruno" sumiu no seu navegador: ele provavelmente está no
  localStorage de OUTRA pasta/navegador (cada pasta do computador tem seu
  próprio armazenamento em alguns navegadores). Abra o jogo na mesma pasta
  de antes, ou use **SAVES → EXPORTAR/IMPORTAR** para transferir. Slots
  podem ser **renomeados** (ex.: bruno) para nunca mais se perderem.
- O desvio (dash) continua normal FORA da escola; dentro dela SHIFT anda
  devagar de propósito (stealth).

## CORRIGIDO (v7 / v0.9.11) — 3 travamentos reais no PUZZLE DA CAIXA
- **Você atravessava a caixa** (e o empurrão morria): a fórmula de
  anti-sobreposição era um ESPELHO — em vez de empurrar o jogador para
  fora, teleportava-o para o LADO OPOSTO da caixa. Agora empurra para
  fora, na direção certa, e a checagem roda TODO frame (não só quando
  empurrando).
- **A caixa travava nas emendas do chão**: salas em "L"/"T" têm dois
  retângulos que se sobrepõem por pouco; a margem antiga criava uma
  zona morta que a caixa nunca cruzava. Margem reduzida (26→10) e,
  melhor ainda, **a caixa e o alvo agora nascem no MESMO retângulo** —
  o puzzle sempre tem solução.
- **O resgate "a caixa respira e volta ao lugar" nunca disparava**
  quando a caixa estava encostada na parede (o cool refrescava a cada
  tentativa e o contador de teimosia não andava). Agora teimosia
  acumula mesmo encostada — 9s empurrando à toa e a caixa volta.
- Versão do menu atualizada: **v0.9.11**.

## NOVO (v6) — O CONVITE: digite `bruno` no menu
- No menu principal, digite **b-r-u-n-o** (teclado). A casa aceita o nome:
  a tela pisca, um trovão baixo... e você está diante do **castelo abandonado**.
- **O caminho (longo de propósito)**: o PORTÃO (o cervo observa; cruzes
  tortas) → o SALÃO → o CORREDOR DOS CRIADOS (os quadros olham de volta) →
  a ESCADARIA (escada de verdade: devagar, cada degrau range) → a GALERIA
  (a VIGILANTE — não a olhe... ou olhe: ela congela sob o seu olhar) →
  **A SACADA**.
- **A SACADA (o evento da lua)**: a música para. A lua **racha** → um
  **sem-rosto emerge da racha** → fica lá, pendido, olhando → **cai da
  tela**. Silêncio. Depois, um rugido em algum lugar embaixo.
- A capela reage (as cruzes viram) e o salão ganha um **alçapão** para a
  CRIPTA — onde o que caiu da lua te espera: **O SEM-ROSTO** (boss, 3 fases,
  puxão gravitacional no fim).
- Venceu? *"o castelo te deixa ir."* Morreu? **O CASTELO TE GUARDA.**
- **Monge Afogado** (cospe água, deixa poças que freadas), **O Penitente**
  (ajoelha — e então bate), **A Vigilante** (anjo-weeping-angel).

## NOVO (v6) — o castelo fica cada vez mais bizarro e grotesco
- Um medidor interno (**grot**) sobe conforme você avança: as cores adoecem,
  **as paredes respiram**, as cruzes sangram, o HUD corrompe letras, a casa
  sussurra coisas erradas, o **cervo aparece cada vez mais perto** (e nunca
  usa a porta) e o título da janela às vezes... não é o seu jogo.

## NOVO (v6) — tudo do castelo editável FORA do código (data-driven)
- **Mapa**: objeto `CASTLE_AREAS` no topo de `castelo.js` (áreas, portas,
  decoração, grot por área — edite e o castelo muda).
- **Sprites**: `assets/sprites/castelo/` — `cervo`, `monge`, `penitente`,
  `vigilante`, `sem-rosto`, `rosto`, `lua` (veja o .txt lá).
- **Músicas**: `assets/audio/music/` → `castelo.mp3` (explorar),
  `castelo-luta.mp3` (combate), `castelo-sacada.mp3` (a sacada — quase
  silêncio), `castelo-boss.mp3` (O SEM-ROSTO). Sem arquivo → temas
  sintetizados embutidos.
- Atalho de teste: `?castelo=1` na URL entra direto.

## CORRIGIDO (v6) — sprites de Thor e inimigos (bug do "não aparece")
- O gancho do PNG do Thor **vazava o estado do canvas** a cada frame
  (`save()` sem `restore()`): durante o piscar de invulnerabilidade o
  alpha 0.4 vazava para o resto do frame e a pilha crescia sem parar.
  Corrigido — sprite externo + flicker + resto do jogo convivem agora.
- **Trocar um PNG pelo MESMO nome** agora atualiza na hora (ao voltar o
  foco da janela ou `__SPRITES_RESCAN()`) — antes só arquivos novos/renomeados
  eram detectados. Funciona em `http://` **e** `file://` (duplo clique).

## NOVO (v5) — recompensa garantida em TODO andar
- **Andar 1**: sempre existe **uma sala do baú**. O baú dá **1 item de
  qualquer raridade** — quanto mais raro, mais difícil de aparecer
  (comum > raro > épico > lendário). Sem mais pedestal enganoso.
- **Do andar 2 em diante**: o item mora numa **SALA DE DESAFIO garantida**.
  Complete a sala → um baú aparece → o item é seu.
- A dificuldade do desafio **sobe muito por andar**: mais inimigos, tipos
  mais duros e **+22% de vida por andar**.
- O **chefe do mapa agora aparece em TODO andar** — inclusive no primeiro
  (antes podia simplesmente não existir no andar 1).

## NOVO (v5) — SALA DAS RELÍQUIAS (as relíquias não acumulam mais)
- As relíquias ficaram **muito mais fortes e diversas** (revive, relâmpagos,
  escudo de glitch, presente do ERRANTE...). Nada de "só vida".
- **Elas não acumulam mais**: com 2+ relíquias desbloqueadas, a sala inicial
  da run vira a **SALA DAS RELÍQUIAS** — as portas ficam **trancadas até
  você escolher UMA** para a descida inteira. Escolha difícil de propósito.
- Com apenas 1 relíquia desbloqueada, ela é aplicada sozinha (como antes).

## NOVO (v5) — SORTE DO ERRANTE (desconto só na loja)
- O desconto agora é um evento **exclusivo da LOJA do ERRANTE**: com sorte
  (25%), todos os itens daquela loja ficam **30% mais baratos**.
- Nenhum "evento de preço" acontece mais fora dela.

## NOVO (v5) — dois puzzles novos
- **A CAIXA E O PONTO** (simples): empurre a caixa até a marca no chão.
  Ande contra ela — ela desliza até bater em algo. Se ela enrolar num
  canto, respira e volta ao lugar.
- **A PEDRA QUE PERGUNTA** (raro): a pedra faz uma pergunta **sobre o
  próprio jogo** e você responde com os pés, pisando no pedestal certo.
  Errar desperta sombras.

## NOVO (v5) — sala de SACRIFÍCIO de verdade
- **O altar agora aparece** (antes era invisível — só existia no minimapa).
- E pode ser usado **várias vezes**: uma oferta por visita à sala
  (10% da vida atual por tentativa; quanto menos vida, maior a chance).

## NOVO (v5) — A ESCOLA VAZIA agora aparece NO ANDAR 4
- Com a escola `???` desbloqueada (3 descidas completas), a descida natural
  **entra na escola no lugar do Limbo ao chegar no 4º andar** — sem reset:
  vida, almas, bênçãos, arma e item ativo continuam.
- Terminou a escola (ritual + afundamento)? A descida segue direto para o
  **5º andar (o guardião)**.
- O card `???` do menu continua existindo para jogar a escola isolada.
- CONTINUAR funciona dentro da escola-da-run também.

## Correções incluídas (v5)
- **BUG PRINCIPAL — bênção/item não pegável**: os drops de bênção e de item
  ativo tinham um ramo de código morto (nunca eram coletados) e expiravam
  em 11 segundos. Agora são coletados por toque, **não expiram mais**, têm
  visual próprio (gema da raridade / orbe do item) e bênção que não couber
  vira almas — nada mais é desperdiçado.
- Baú de tesouro/desafio sempre materializa um item (cai um tier se preciso).

## Como jogar
1. Extraia o zip e mantenha os arquivos juntos (não renomeie pastas).
2. Abra o `index.html` no navegador (duplo clique).
   - Se algo não carregar, rode um servidor local na pasta: `python -m http.server`
     e acesse `http://localhost:8000`.
3. Menu → DESCER AO INFERNO → escolha a arma → jogue.

## NOVO (v4) — a 4ª DESCIDA: `???`
Depois de **completar 3 descidas** (vencer o chefe de 3 andares), uma quarta
opção aparece no seletor **CÍRCULOS DO INFERNO**:

> **???**
> ...
> NÃO HÁ REGISTRO

Sem tela de arma, sem explicação. Uma escola vazia.

- Exploração livre: pátio central, duas estruturas com escadas para subir,
  corredores, salas laterais (muitas vazias de propósito) e área externa.
- **8 fragmentos** espalhados — cada um com uma condição diferente
  (sala trancada, livros em ordem, relógios parados, escuridão, lado de fora,
  registros do banheiro... o último só existe do outro lado do espelho).
- Ao pegar o primeiro: *"um arrepio enorme se forma..."* → *"você não está
  sozinho"* — e o **CAÇADOR** começa a existir (caveira de cervo, manto
  preto, ossos por dentro). Ele observa, procura, persegue. **Corra.**
  Ele não morre, não dropa nada, não é um boss — é uma caçada.
- Com 7/8, o espelho do banheiro acorda. Do outro lado: **a escola
  invertida** — portas no lugar errado, corredores impossíveis.
- 8/8 → as partes estão completas → o **pátio** tem um lugar para o ritual.
- O ritual termina e **o pátio inunda**. Quando a água ficar funda demais,
  entre no centro... e desça para o **5º círculo (Rio de Caronte)**.
- HUD mínimo: apenas `FRAGMENTOS n/8`. Sem quests, sem setas, sem nomes.
- Morrer na escola pode mostrar **VOCÊ FOI ENCONTRADO**. Os fragmentos
  coletados continuam salvos.

### Sprites da fase — edite sem mexer no código
Pasta dedicada: `assets/sprites/escola/` (veja o `.txt` lá dentro):

| Arquivo | O que substitui |
|---|---|
| `cacador.png` | O CAÇADOR inteiro |
| `cacador-cabeca.png` | só a caveira de cervo |
| `fragmento.png` | as 8 partes do ritual |
| `espelho.png` | os espelhos da fase |

### Músicas da fase → `assets/audio/music/`
| Arquivo | Momento |
|---|---|
| `escola-ambiente.mp3` | a escola em silêncio (quase nada acontece) |
| `escola-cacada.mp3` | o caçador está te perseguindo |
| `escola-espelho.mp3` | escola invertida / espelho |
| `escola-ritual.mp3` | montando o ritual |
| `escola-inundacao.mp3` | o pátio alagando e a descida |

Sem arquivos → temas sintetizados próprios (quase silêncio, pulso grave na
caçada, drone na inundação).

## NOVO (v4) — botão CONTINUAR
Saiu pelo menu no meio da partida (ESC → VOLTAR AO MENU) **sem morrer**?
O menu ganha o botão **CONTINUAR**: você volta exatamente para onde estava —
mesma arma, vida, bênçãos, almas, mapa e andar. Morrer ou começar uma run
nova apaga o ponto de continuação. Serve para a escola `???` também.

## NOVO (v4) — detecção de áudios melhorada
- Áudios colocados na pasta **com o jogo já aberto** agora são detectados
  (antes, um arquivo novo só era visto depois de recarregar a página).
- No console (F12): `__AUDIO_RESCAN()` força uma nova varredura na hora.

## Correções incluídas (v1)
- **audio.js recriado** (era o arquivo que faltava e quebrava os botões/tela escura).
- **assets/sprites/sprites.js** criado (elimina 404).
- Salvar "Alma Negra de Caronte" agora persiste (caronteKills nas metas).
- Rede de segurança: se o áudio falhar, o jogo segue funcionando.

## NOVO (v3) — derrota interrompe a música com fade
- Ao morrer, TODA a música de fundo (a sua ou a embutida) abaixa
  **degradamente até o silêncio em ~3s**, como se fosse interrompida
  pela derrota.
- Se existir `morte.mp3`, ele só começa **depois** do fade terminar.
- Ao voltar pro menu ou recomeçar, a música de game over é
  **interrompida** na hora e a música do menu/jogo volta.

## NOVO (v4) — sprites trocáveis por arquivo: 100% dos inimigos e bosses
O jogo **detecta imagens** que você colocar em `assets/sprites/` e usa no
lugar do desenho original — sem mexer em código. Sem o arquivo, o
desenho original continua (nada quebra, nunca fica invisível).

**O que mudou na v4 (correção do bug "meus sprites não aparecem"):**
- **Re-scan automático**: a pasta é re-escaneada a cada ~15s e quando a
  janela ganha foco — sprite colado com o jogo rodando entra sozinho.
- **Nomes flexíveis**: maiúsculas/minúsculas, acentos, espaços e `_`
  viram hífen automaticamente (`Velho Rei.PNG` = `velho-rei.png`).
- **Manifesto opcional** `assets/sprites/sprites.txt` para usar
  qualquer nome de arquivo (`velho-rei = minha-arte.png`).
- **Cobertura completa**: TODOS os 25+ inimigos comuns aceitam sprite,
  mais o **Cérbero** (inteiro ou por cabeça), o **Caronte** na batalha
  do rio e os inimigos do **Falso Paraíso/Limbo** (que antes ignoravam
  sprites — parte do bug relatado).
- Efeitos de combate (flash de dano, veneno, lentidão, telegrafia e a
  aura de triunfo dos Cavaleiros) continuam por cima do seu sprite.

| Sprite | Personagem |
|---|---|
| `thor.png` | o Thor (desenhe olhando para a DIREITA — o jogo gira conforme a mira) |
| `velho-rei.png` | O Velho Rei (fase I e II) |
| `espelho.png` | espelhos/sombras da fase II |
| `erro-404.png` | Erro 404 |
| `bruxo.png`, `carrasco.png`, `viuva.png`, `golem.png` | chefes dos círculos |
| `cerbero.png` / `cerbero-cabeca.png` | o Cérbero inteiro / só as cabeças |
| `caronte.png` | Caronte (batalha do rio) |
| `cavaleiro-branco.png`, `cavaleiro-vermelho.png`, `cavaleiro-preto.png`, `cavaleiro-descorado.png` | Cavaleiros |
| `observador.png` | O Observador |
| `sombra.png`, `brutamonte.png`, `cuspedor.png`, `feiticeiro.png`, `espectro-veloz.png`, `ceifador.png`, `grao-de-ossos.png`, `alma-perdida.png`, `espectro.png`, `lamentadora.png`, `corrupiao.png`, `corrupiao-menor.png`, `vigia.png`, `peregrino.png`, `faisca-fantasma.png` | TODOS os inimigos comuns (apelidos curtos `sh`, `br`... também valem) |
| `peao.png`, `filhote.png` | inimigos comuns |
| `fundo.png` | **cenário** — piso das salas (esticado ao tamanho da sala; paredes e efeitos continuam por cima) |

Detalhes:
- Aceita `.png` (recomendado, com transparência), `.jpg`, `.jpeg`, `.webp`.
- Diagnóstico: no console (F12), `__SPRITES_DEBUG()` lista o que foi
  encontrado; `__SPRITES_RESCAN()` força nova varredura;
  `__AUDIO_DEBUG()` mostra a música atual e o fade.
- Lista completa com dicas: `assets/sprites/COLOQUE-SPRITES-AQUI.txt`.

## NOVO (v2) — coloque SUAS músicas e sons no jogo
O jogo agora **detecta arquivos de áudio seus automaticamente**.
Basta colocar os arquivos nas pastas certas com o nome certo
(mp3, ogg ou wav). Sem o arquivo, o jogo usa os sons embutidos — nunca quebra.

### 🎵 Músicas → `assets/audio/music/`
| Arquivo | Onde toca |
|---|---|
| `menu.mp3` | menu principal |
| `inferno.mp3` | gameplay normal (salas e corredores) |
| `chefe.mp3` | todos os chefes (genérica) |
| `velho-rei.mp3` | O VELHO REI — fase I |
| `velho-rei-fase2.mp3` | **O VELHO REI — fase II (novo tema!)** |
| `cerbero.mp3` | Cérbero |
| `bruxo.mp3` / `carrasco.mp3` / `viuva.mp3` / `golem.mp3` | chefes dos círculos |
| `erro-404.mp3` | Erro 404 |
| `caronte.mp3` | Caronte (encontro + batalha no rio) |
| `cavaleiro-branco.mp3`, `cavaleiro-vermelho.mp3`, `cavaleiro-preto.mp3`, `cavaleiro-descorado.mp3` | Cavaleiros do Apocalipse |
| `observador.mp3` | O Observador |
| `vitoria.mp3` | tela de vitória |
| `morte.mp3` | tela de game over |
| `escola.mp3` (+ `-cacada`/`-espelho`/`-ritual`/`-inundacao`) | A ESCOLA VAZIA |
| `castelo.mp3` | O CONVITE — explorar o castelo |
| `castelo-luta.mp3` | O CONVITE — combate no castelo |
| `castelo-sacada.mp3` | O CONVITE — a sacada (quase silêncio) |
| `castelo-boss.mp3` | O CONVITE — O SEM-ROSTO |

Sem música de chefe específica? O jogo cai para `chefe.mp3`, e sem essa,
para o tema sintetizado embutido de cada chefe.

### 🔊 Efeitos → `assets/audio/sfx/`
Use o mesmo nome do efeito (atenção a maiúsculas/minúsculas):

`glitch, levelup, heart, echo, rumble, roar, gate, static, creak, growl,
hurt, die, dash, throw, saw, howl, parry, headDie, boom, spit, shotS,
thunder, freeze, ehit, bhit, thud, bite, slash, nova, stake, shock, kill,
explode, win, soul, dust, snore`

Exemplos: `boom.mp3`, `roar.mp3`, `levelup.mp3`, `shotS.wav`.
Cada efeito é detectado na primeira vez que toca.

### Tema novo da fase II do Velho Rei (embutido)
Mesmo sem arquivo, a fase II ("Espehos das Sombras") agora tem tema próprio
sintetizado: relógio de xadrez acelerando + baixo cromático + arpejo de
espelhos desafinados. A fase I tem valsa lenta própria e os demais chefes
têm marcha tensa própria. Colocando `velho-rei-fase2.mp3`, o seu arquivo
substitui o tema embutido.

### Detalhes técnicos
- Formatos: `.mp3` (recomendado), `.ogg` ou `.wav`.
- A detecção é automática ao carregar a página (músicas) e na 1ª vez que
  um efeito toca (sons) — com re-detecção automática de arquivos novos
  (música: a cada 25s · efeitos: a cada 12s).
- Volume das músicas/efeitos segue as opções do jogo; o botão de mudo
  também controla os seus arquivos.
- Diagnóstico: no console do navegador (F12), digite `__AUDIO_DEBUG()`
  para ver o modo musical atual e qual arquivo está tocando; `__AUDIO_RESCAN()`
  re-escaneia as pastas na hora.
- ⚠️ Se abrir com duplo clique (file://) e seus áudios não tocarem, seu
  navegador está bloqueando mídia local — use um servidor local
  (`python -m http.server`).

---

### Dicas de teste (para desenvolvedor)
Abra o jogo com parâmetros na URL:
- `?escola=1` — libera o card `???` no seletor imediatamente.
- `?frag=N` — começa a escola com N fragmentos já coletados.
- Console: `__SCHOOL_INT.debug()` mostra área, caçador e progresso da fase.
