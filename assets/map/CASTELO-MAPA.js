/* ==============================================================
   THOR REVENGE — O MAPA DO CASTELO (EDITÁVEL FORA DO CÓDIGO)
   ==============================================================

   Este arquivo GERA O CASTELO DO SAVE BRUNO. Você pode mudar,
   acrescentar e apagar salas SEM ABRIR o game.js — basta editar
   aqui e recarregar a página (F5).

   Se este arquivo estiver apagado ou com erro de digitação, o
   jogo usa o mapa padrão interno (nada quebra — veja o console).

   ------------------------------------------------------------
   COMO FUNCIONA UMA SALA
   ------------------------------------------------------------
   {id:'salao', at:[1,0], kind:'combat', name:'SALÃO DO BANQUETE',
    weird:.16, word:'devorem', wave:['sh','sh','bmonge'],
    rects:[[0,0,780,460]], doors:{w:'antessala',n:'biblioteca',s:'arca'}}

   id     — nome interno ÚNICO da sala (outras salas usam ele nas portas).
            Não repita ids e não use espaços/acentos.
   at     — posição no MINIMAPA [coluna, linha]. Subir = linha mais negativa.
   kind   — 'start'   : onde o Thor começa (só numa sala!)
            'combat'  : tem onda de inimigos (campo wave)
            'empty'   : corredor/sala sem onda (use flavor:'silent')
            'treasure': sala da ARCA (bau de recompensa)
   name   — nome que aparece no HUD/minimapa (pode ter acento).
   weird  — 0 a 1: QUANTO MAIS BIZARRO/GROTESCO a sala fica.
            .30 = leve · .60 = veias e dentes · .72 = carne pulsando
            .86+ = olhos que seguem o Thor. A rota final deve ficar ~.97.
   word   — frase riscada na parede da sala (pode ser '') .
   wave   — lista de inimigos da onda (só em kind:'combat'):
            'sh' (sombra), 'bmonge' (Monge Afogado),
            'bestatua' (A Vigilante), 'bflagelo' (O Penitente),
            'pn' (peão), 'puppy' (filhote), 'observer' (observador)
   stairs — true: sala é ESCADA (sobe um andar — HUD mostra o ANDAR).
   rects  — formato da sala: [x, y, LARGURA, ALTURA] em pixels.
            Várias rects = sala em forma de L/T etc. (x,y somam).
   doors  — portas: n (cima), s (baixo), e (direita), w (esquerda)
            apontando para o id de outra sala. A porta de volta é
            criada sozinha (bidirecional).

   ------------------------------------------------------------
   REGRAS DE OURO (para nada quebrar)
   ------------------------------------------------------------
   1. EXATAMENTE UMA sala kind:'start' (a ANTESALA).
   2. Toda porta precisa apontar para um id que EXISTE.
   3. Salas grandes: retângulo principal começa em [0,0].
   4. A SACADA (a última, onde a lua aparece) precisa chamar-se
      'sacada' — o céu, a lua e a cutscene do boss dependem do id.
   5. A capela precisa chamar-se 'capela' (segredo da A CRIPTA).
   6. Mantenha uma rota ligada da antessala até a sacada.

   Sprite da lua do castelo: assets/sprites/bruno-lua.png
   Sprite do boss (a figura): assets/sprites/bruno-boss.png
   ============================================================== */

window.BRUNO_MAP_DATA=[

 {id:'antessala', at:[0,0], kind:'start', name:'ANTESALA', weird:.06,
  word:'alguém acordou',
  rects:[[0,0,620,380],[620,70,170,240]],
  doors:{e:'salao'}},

 {id:'salao', at:[1,0], kind:'combat', name:'SALÃO DO BANQUETE', weird:.16,
  word:'devorem', wave:['sh','sh','bmonge'],
  rects:[[0,0,780,460]],
  doors:{w:'antessala', n:'biblioteca', s:'arca'}},

 {id:'biblioteca', at:[1,-1], kind:'empty', flavor:'silent', name:'BIBLIOTECA', weird:.3,
  word:'não cabe',
  rects:[[0,0,250,560]],
  doors:{s:'salao', e:'escada1'}},

 {id:'escada1', at:[2,-1], kind:'empty', flavor:'silent', stairs:true, name:'ESCADA I', weird:.32,
  word:'sobe',
  rects:[[0,0,230,560]],
  doors:{w:'biblioteca', n:'capela'}},

 {id:'capela', at:[2,-2], kind:'combat', name:'CAPELA', weird:.42,
  word:'ele sabe', wave:['bestatua','bflagelo'],
  rects:[[0,0,430,350]],
  doors:{s:'escada1', e:'corredor1'}},

 {id:'corredor1', at:[3,-2], kind:'empty', flavor:'silent', name:'CORREDOR I', weird:.5,
  word:'conta os passos',
  rects:[[0,0,130,540]],
  doors:{w:'capela', n:'corredor2'}},

 {id:'corredor2', at:[3,-3], kind:'empty', flavor:'silent', name:'CORREDOR II', weird:.55,
  word:'de lado',
  rects:[[0,0,130,540],[130,410,190,130]],
  doors:{s:'corredor1', e:'escada2'}},

 {id:'escada2', at:[4,-3], kind:'combat', stairs:true, name:'ESCADA II', weird:.58,
  word:'ainda sobe', wave:['bflagelo','bmonge'],
  rects:[[0,0,210,600]],
  doors:{w:'corredor2', n:'galeria'}},

 {id:'galeria', at:[4,-4], kind:'empty', flavor:'silent', name:'GALERIA DEITADA', weird:.62,
  word:'não é a primeira vez',
  rects:[[0,0,570,120]],
  doors:{s:'escada2', e:'cozinha'}},

 {id:'cozinha', at:[5,-4], kind:'combat', name:'A COZINHA', weird:.72,
  word:'a carne lembra', wave:['bflagelo','bflagelo','bmonge'],
  rects:[[0,0,520,380]],
  doors:{w:'galeria', n:'bercario'}},

 {id:'bercario', at:[5,-5], kind:'empty', flavor:'silent', name:'O BERÇÁRIO', weird:.8,
  word:'foi aqui que você nasceu',
  rects:[[0,0,340,300]],
  doors:{s:'cozinha', e:'trono'}},

 {id:'trono', at:[6,-5], kind:'empty', flavor:'silent', name:'A SALA DO TRONO', weird:.86,
  word:'ainda está quente',
  rects:[[0,0,420,340]],
  doors:{w:'bercario', n:'respira'}},

 {id:'respira', at:[6,-6], kind:'empty', flavor:'silent', name:'O CORREDOR QUE RESPIRA', weird:.92,
  word:'ele respira com você',
  rects:[[0,0,120,520]],
  doors:{s:'trono', e:'final'}},

 {id:'final', at:[7,-6], kind:'empty', flavor:'silent', name:'CORREDOR FINAL', weird:.94,
  word:'não olhe',
  rects:[[0,0,90,620]],
  doors:{w:'respira', n:'sacada'}},

 {id:'sacada', at:[7,-7], kind:'empty', flavor:'silent', name:'A SACADA', weird:.97,
  rects:[[0,0,880,250]],
  doors:{s:'final'}},

 {id:'arca', at:[1,1], kind:'treasure', name:'ARCA ESTRANHA', weird:.2,
  word:'devolva',
  rects:[[0,0,310,250]],
  doors:{n:'salao'}}

];
