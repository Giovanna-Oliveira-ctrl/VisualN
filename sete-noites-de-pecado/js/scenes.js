/* =========================================================================
   CENÁRIOS
   Cada cenário é uma "receita": uma lista de camadas desenhadas de trás para
   a frente (primeiro o céu, depois as montanhas, a casa, os objetos da frente).

   COMO EDITAR UMA RECEITA
   - Cada camada tem um "tipo" (o pincel) e alguns números e cores.
   - As coordenadas usam uma tela imaginária de 1600 de largura por 900 de altura:
     x = 0 é a esquerda, x = 1600 a direita; y = 0 é o topo, y = 900 o chão.
   - Cores são escritas como '#rrggbb'. Troque e recarregue a página para ver.
   - "quando: 'escuro'" faz a camada aparecer só naquela variante do cenário;
     "exceto: 'escuro'" faz ela sumir naquela variante. No roteiro, a variante
     é pedida assim: @cena dormitorio escuro
   - "clima" são efeitos animados por cima: neblina, brasas, cinzas, poeira...

   COMO TROCAR POR UMA IMAGEM DE VERDADE
   1. Coloque o arquivo em assets/backgrounds/ (de preferência 1920x1080).
   2. Escreva o caminho em "imagem", por exemplo:
        imagem: 'assets/backgrounds/biblioteca.jpg',
   3. Pronto: o jogo passa a usar a imagem e mantém os efeitos de "clima".
      Deixe "imagem: null" para continuar usando o desenho feito com código.
   ========================================================================= */
window.CENARIOS = {
  titulo: {
    nome: 'Casa Vesper do outro lado do lago (tela inicial)',
    imagem: null,
    // Em telas estreitas (celular em pé), mostra o lado direito, onde fica a casa.
    alinhar: 'xMaxYMid',
    camadas: [
      { tipo: 'ceu', cores: ['#04050a', '#0c0d19', '#1a1424', '#2a1a26'], paradas: [0, 0.4, 0.75, 1] },
      { tipo: 'estrelas', quantidade: 130, ate: 430, semente: 'titulo' },
      { tipo: 'lua', x: 1250, y: 165, raio: 46, cor: '#efe2c6', halo: 0.38 },
      { tipo: 'nuvens', y: 240, altura: 120, cor: '#3a2f45', opacidade: 0.45, quantidade: 6 },
      { tipo: 'montanhas', base: 530, altura: 140, cor: '#100d17', semente: 'titulo-m' },
      { tipo: 'floresta', base: 562, alturaMin: 50, alturaMax: 120, cor: '#08080d', semente: 'titulo-f', chao: false },
      { tipo: 'mansao', x: 1330, base: 566, escala: 0.4, acesas: 0.35, brilho: 0.35 },
      { tipo: 'lago', topo: 562, cores: ['#0b0c15', '#020204'], lua: { x: 1250, opacidade: 0.7 }, reflexos: [{ x: 1300, linhas: 7 }, { x: 1360, linhas: 6 }] },
      { tipo: 'rosas', x: 1060, y: 690, largura: 600, altura: 230, quantidade: 15, escala: 1.6, semente: 'titulo-r' },
      { tipo: 'sombra', cores: [['#000000', 0.92], ['#000000', 0.7], ['#000000', 0]], paradas: [0, 0.35, 0.62] },
    ],
    clima: [{ tipo: 'neblina', y: 52, altura: 22, opacidade: 0.22 }],
  },

  sonho: {
    nome: 'Lembrança: fogo sobre a água',
    imagem: null,
    camadas: [
      { tipo: 'ceu', cores: ['#050203', '#1c0507', '#3e0b0d', '#140304'], paradas: [0, 0.42, 0.58, 1] },
      { tipo: 'brilho', x: 800, y: 470, rx: 900, ry: 260, cor: '#ff5a1e', opacidade: 0.35, pulsar: true },
      { tipo: 'floresta', base: 534, alturaMin: 60, alturaMax: 150, cor: '#060203', semente: 'sonho-f', chao: false },
      { tipo: 'lago', topo: 532, cores: ['#160506', '#020001'], ondas: 30, corOnda: '#ff8a4a' },
      { tipo: 'incendio', x: 760, base: 534, escala: 0.5, reflexo: 534 },
      { tipo: 'mascara_flutuante', x: 800, y: 300, escala: 1.5, rotacao: -10 },
      { tipo: 'vinheta', forca: 0.9 },
    ],
    clima: [{ tipo: 'brasas', quantidade: 34 }],
  },

  estacao: {
    nome: 'Estação de trem de Bellgrave, ao entardecer',
    imagem: null,
    camadas: [
      { tipo: 'ceu', cores: ['#140d1a', '#3a1d2c', '#7a3a36', '#c27248'], paradas: [0, 0.45, 0.8, 1] },
      { tipo: 'brilho', x: 900, y: 560, rx: 900, ry: 220, cor: '#ffa060', opacidade: 0.32 },
      { tipo: 'nuvens', y: 290, altura: 120, cor: '#5a2a38', opacidade: 0.5, semente: 'estacao-n' },
      { tipo: 'montanhas', base: 540, altura: 150, cores: ['#2c1b2b', '#1a1220'], semente: 'estacao-m' },
      { tipo: 'silhueta_gotica', x: 880, largura: 300, base: 530, alturaMin: 40, alturaMax: 110, escala: 0.8, cor: '#1b1220', janela: '#ffb45a', acesas: 0.25, semente: 'agnes-longe' },
      { tipo: 'floresta', base: 566, alturaMin: 30, alturaMax: 90, cor: '#120c14', semente: 'estacao-f', chao: false },
      { tipo: 'lago', topo: 564, cores: ['#5a3040', '#1a1018'], ondas: 24, corOnda: '#e7b08a', reflexos: [{ x: 1000, linhas: 5, largura: 10, opacidade: 0.4 }, { x: 1060, linhas: 5, largura: 10, opacidade: 0.4 }] },
      { tipo: 'estacao', topo: 120, placaX: 800, bancoX: 250, lampioes: [520, 1080] },
    ],
    clima: [{ tipo: 'neblina', y: 54, altura: 20, opacidade: 0.2, cor: '225,195,205' }],
  },

  campus: {
    nome: 'Pátio principal da Universidade de Saint Agnes, à noite',
    imagem: null,
    camadas: [
      { tipo: 'ceu', cores: ['#04050a', '#0c0d18', '#1a1626', '#2a1c28'], paradas: [0, 0.4, 0.8, 1] },
      { tipo: 'estrelas', quantidade: 90, ate: 360, semente: 'campus' },
      { tipo: 'lua', x: 1300, y: 140, raio: 36, halo: 0.3 },
      { tipo: 'nuvens', y: 200, altura: 140, cor: '#2e2638', opacidade: 0.45, semente: 'campus-n' },
      { tipo: 'silhueta_gotica', x: -40, largura: 1680, base: 470, alturaMin: 60, alturaMax: 150, cor: '#0f0d15', janela: '#e09a50', acesas: 0.08, semente: 'campus-fundo' },
      { tipo: 'fachada_gotica', centro: 800, largura: 1460, base: 650, altura: 290, acesas: 0.55 },
      { tipo: 'hera', areas: [{ x: 90, y: 420, l: 260, a: 230 }, { x: 1250, y: 380, l: 260, a: 270 }, { x: 560, y: 560, l: 110, a: 90 }] },
      { tipo: 'piso', topo: 650, estilo: 'pedra', cor: '#1d1a1f', cor2: '#0d0b0e', profundidade: 400 },
      { tipo: 'poste', x: 330, base: 770, altura: 290 },
      { tipo: 'poste', x: 1270, base: 770, altura: 290 },
    ],
    clima: [{ tipo: 'neblina', y: 64, altura: 26, opacidade: 0.18 }],
  },

  dormitorio: {
    nome: 'Quarto no dormitório de Saint Agnes',
    imagem: null,
    camadas: [
      { tipo: 'parede', cor: '#25131a', cor2: '#1a0e13', padrao: 'damasco', rodape: 640 },
      { tipo: 'janelas', itens: [{ x: 620, y: 80, l: 280, a: 520, lua: { x: 0.66, y: 0.3, raio: 32 }, arvores: true, raioDx: 30 }], pisoY: 700, forcaRaio: 0.14, variantes: { escuro: { forcaRaio: 0.3, brilho: 0.36 } } },
      { tipo: 'quadros', itens: [{ x: 1090, y: 200, l: 120, a: 150 }] },
      { tipo: 'piso', topo: 700, estilo: 'madeira', cor: '#1b110d', cor2: '#0b0706' },
      { tipo: 'cama', x: 110, base: 800, largura: 430, cor: '#47101a' },
      { tipo: 'escrivaninha', x: 1180, base: 790, escala: 1.1, acesa: true, exceto: 'escuro' },
      { tipo: 'escrivaninha', x: 1180, base: 790, escala: 1.1, acesa: false, quando: 'escuro' },
      { tipo: 'sombra', quando: 'escuro', cores: [['#040713', 0.55], ['#040713', 0.62]], x2: 0, y2: 1 },
      { tipo: 'brilho', quando: 'escuro', x: 760, y: 360, rx: 320, ry: 380, cor: '#9fb6d8', opacidade: 0.2 },
    ],
    clima: [
      { tipo: 'poeira', quantidade: 14, de: 42, ate: 62, y: 18, altura: 50, exceto: 'escuro' },
      { tipo: 'luz-velas', x: 74, y: 62, opacidade: 0.2, exceto: 'escuro' },
    ],
  },

  biblioteca: {
    nome: 'Biblioteca Histórica de Saint Agnes',
    imagem: null,
    camadas: [
      { tipo: 'parede', cor: '#140e0c', padrao: 'nenhum' },
      { tipo: 'estantes', de: -20, ate: 1620, topo: -20, base: 700, cor: '#1e130d', galeria: 330, escada: 290, vao: [610, 990] },
      { tipo: 'janelas', itens: [{ x: 680, y: 60, l: 240, a: 520, lua: { x: 0.3, y: 0.25, raio: 22 }, raioDx: 60 }], pisoY: 700, forcaRaio: 0.2, luz: '#a9bedc' },
      { tipo: 'piso', topo: 700, estilo: 'madeira', cor: '#1a110c', cor2: '#090605', tapete: { largura: 520, cor: '#3a0c16' } },
      { tipo: 'luminarias', itens: [{ x: 300, y: 700, escala: 0.9 }, { x: 1300, y: 700, escala: 0.9 }] },
    ],
    clima: [{ tipo: 'poeira', quantidade: 30, de: 38, ate: 64, y: 8, altura: 65 }],
  },

  salao: {
    nome: 'Salão nobre (recepção dos bolsistas)',
    imagem: null,
    camadas: [
      { tipo: 'parede', cor: '#2a1015', cor2: '#1c0a0e', padrao: 'damasco', rodape: 620, opacidadePadrao: 0.3 },
      { tipo: 'janelas', itens: [{ x: 90, y: 100, l: 200, a: 460 }, { x: 1310, y: 100, l: 200, a: 460 }], raios: false, luz: '#9fb6d8', brilho: 0.12 },
      { tipo: 'cortinas', cor: '#4a0f1c', itens: [{ x: 30, largura: 150, lado: 'esq', base: 650 }, { x: 240, largura: 120, lado: 'dir', base: 650 }, { x: 1240, largura: 120, lado: 'esq', base: 650 }, { x: 1420, largura: 150, lado: 'dir', base: 650 }] },
      { tipo: 'quadros', itens: [{ x: 500, y: 200, l: 170, a: 230 }, { x: 930, y: 200, l: 170, a: 230 }, { x: 735, y: 250, l: 130, a: 170, fundo: '#2a2a3a' }] },
      { tipo: 'lustre', x: 560, y: 130, escala: 0.9 },
      { tipo: 'lustre', x: 1040, y: 130, escala: 0.9 },
      { tipo: 'piso', topo: 690, estilo: 'xadrez', cor: '#1a1416', cor2: '#0c0a0b', contraste: 0.28, reflexo: { largura: 600, forca: 0.2 } },
    ],
    clima: [{ tipo: 'luz-velas', x: 50, y: 28, opacidade: 0.14 }],
  },

  torre: {
    nome: 'Alto da torre do sino',
    imagem: null,
    camadas: [
      { tipo: 'ceu', cores: ['#03040a', '#0a0d1c', '#16182c', '#262038'], paradas: [0, 0.4, 0.78, 1] },
      { tipo: 'estrelas', quantidade: 200, ate: 480, semente: 'torre' },
      { tipo: 'lua', x: 960, y: 270, raio: 36, halo: 0.35 },
      { tipo: 'nuvens', y: 380, altura: 60, cor: '#2c2840', opacidade: 0.35, semente: 'torre-n' },
      { tipo: 'montanhas', base: 520, altura: 110, cor: '#0f1120', semente: 'torre-m' },
      { tipo: 'floresta', base: 556, alturaMin: 18, alturaMax: 44, cor: '#080910', semente: 'torre-f', chao: false },
      { tipo: 'mansao', x: 1180, base: 560, escala: 0.11, acesas: 0.6, brilho: 0.3 },
      { tipo: 'lago', topo: 556, cores: ['#121628', '#06070c'], lua: { x: 960, linhas: 20, largura: 44 }, reflexos: [{ x: 1180, linhas: 6, largura: 6 }] },
      { tipo: 'floresta', base: 760, alturaMin: 30, alturaMax: 70, cor: '#05060a', semente: 'torre-f2', chao: true },
      { tipo: 'arco_moldura', x: 250, y: 30, largura: 1100, cor: '#100d11' },
      { tipo: 'sino', x: 800, y: 48, escala: 0.74 },
      { tipo: 'parapeito', topo: 770, cor: '#18151b' },
    ],
    clima: [],
  },

  lago: {
    nome: 'Margem do lago de Bellgrave',
    imagem: null,
    camadas: [
      { tipo: 'ceu', cores: ['#04050b', '#0b0e1c', '#18182a', '#221a2a'], paradas: [0, 0.45, 0.8, 1] },
      { tipo: 'estrelas', quantidade: 140, ate: 420, semente: 'lago' },
      { tipo: 'lua', x: 820, y: 170, raio: 42 },
      { tipo: 'nuvens', y: 260, altura: 100, cor: '#2c2840', opacidade: 0.4, semente: 'lago-n' },
      { tipo: 'montanhas', base: 500, altura: 120, cor: '#0d0d18', semente: 'lago-m' },
      { tipo: 'floresta', base: 522, alturaMin: 40, alturaMax: 110, cor: '#07070c', semente: 'lago-f', chao: false },
      { tipo: 'mansao', x: 1090, base: 526, escala: 0.2, acesas: 0.55, brilho: 0.3 },
      { tipo: 'lago', topo: 522, lua: { x: 820, opacidade: 0.8 }, reflexos: [{ x: 1070, linhas: 8 }, { x: 1110, linhas: 7 }] },
      { tipo: 'floresta', base: 940, de: -80, ate: 240, alturaMin: 380, alturaMax: 620, cor: '#030305', semente: 'lago-perto1', chao: false },
      { tipo: 'floresta', base: 940, de: 1400, ate: 1700, alturaMin: 380, alturaMax: 620, cor: '#030305', semente: 'lago-perto2', chao: false },
      { tipo: 'pier', xBase: 380, larguraBase: 360, xTopo: 690, larguraTopo: 70, yTopo: 592 },
    ],
    clima: [{ tipo: 'neblina', y: 52, altura: 22, opacidade: 0.24 }],
  },

  vesper_fachada: {
    nome: 'Casa Vesper: fachada meio queimada, cheia de velas',
    imagem: null,
    camadas: [
      { tipo: 'ceu', cores: ['#030308', '#0a0a14', '#171222', '#2a1622'], paradas: [0, 0.4, 0.8, 1] },
      { tipo: 'estrelas', quantidade: 70, ate: 300, semente: 'vesper' },
      { tipo: 'lua', x: 1340, y: 120, raio: 34, veu: '#1a1626', opacidadeVeu: 0.25 },
      { tipo: 'nuvens', y: 160, altura: 120, cor: '#2a2236', opacidade: 0.5, semente: 'vesper-n' },
      { tipo: 'floresta', base: 600, alturaMin: 120, alturaMax: 260, cor: '#060509', semente: 'vesper-f', chao: false },
      { tipo: 'mansao', x: 800, base: 610, escala: 0.85, acesas: 0.7, queimada: true, portaAcesa: true },
      { tipo: 'escadaria', centro: 800, topo: 606, larguraTopo: 240, larguraBase: 1600, degraus: 10, velas: 70 },
      { tipo: 'poste', x: 330, base: 660, altura: 210, escala: 0.9, forca: 0.5 },
      { tipo: 'poste', x: 1270, base: 660, altura: 210, escala: 0.9, forca: 0.5 },
      { tipo: 'rosas', x: -40, y: 640, largura: 360, altura: 230, quantidade: 12, escala: 1.4, semente: 'vesper-r1' },
      { tipo: 'rosas', x: 1280, y: 640, largura: 360, altura: 230, quantidade: 12, escala: 1.4, semente: 'vesper-r2' },
    ],
    clima: [
      { tipo: 'neblina', y: 62, altura: 26, opacidade: 0.18 },
      { tipo: 'brasas', quantidade: 10, de: 55, ate: 82, tamanho: 2 },
    ],
  },

  baile: {
    nome: 'Salão de baile da Casa Vesper (baile de máscaras)',
    imagem: null,
    camadas: [
      { tipo: 'parede', cor: '#1e0c12', cor2: '#12070b', padrao: 'damasco', rodape: 640, opacidadePadrao: 0.28 },
      { tipo: 'janelas', exceto: 'apagado', itens: [{ x: 110, y: 110, l: 180, a: 430 }, { x: 1310, y: 110, l: 180, a: 430 }], raios: false, brilho: 0.12 },
      { tipo: 'espelhos', itens: [{ x: 420, y: 150, l: 170, a: 420 }, { x: 1010, y: 150, l: 170, a: 420 }], reflexoLuz: '#ffb45a', variantes: { apagado: { reflexoLuz: '#9fb6d8' } } },
      { tipo: 'manchas', itens: [{ x: 350, y: 300, rx: 90, ry: 70 }, { x: 1240, y: 250, rx: 110, ry: 80 }, { x: 760, y: 110, rx: 140, ry: 60, forca: 0.6 }] },
      { tipo: 'lustre', x: 800, y: 150, escala: 1.15, aceso: true, exceto: 'apagado' },
      { tipo: 'lustre', x: 800, y: 150, escala: 1.15, aceso: false, quando: 'apagado' },
      { tipo: 'piso', topo: 660, estilo: 'xadrez', cor: '#1a1214', contraste: 0.32, reflexo: { largura: 700, forca: 0.25 }, variantes: { apagado: { reflexo: { largura: 700, forca: 0.15, cor: '#9fb6d8' } } } },
      { tipo: 'candelabro', x: 330, base: 740, altura: 300, aceso: true, exceto: 'apagado' },
      { tipo: 'candelabro', x: 1270, base: 740, altura: 300, aceso: true, exceto: 'apagado' },
      { tipo: 'candelabro', x: 330, base: 740, altura: 300, aceso: false, quando: 'apagado' },
      { tipo: 'candelabro', x: 1270, base: 740, altura: 300, aceso: false, quando: 'apagado' },
      { tipo: 'pedestal_rosas', itens: [{ x: 640, base: 720, escala: 0.9 }, { x: 960, base: 720, escala: 0.9 }] },
      { tipo: 'sombra', quando: 'apagado', cores: [['#030612', 0.66], ['#030612', 0.74]], x2: 0, y2: 1 },
      { tipo: 'janelas', quando: 'apagado', itens: [{ x: 110, y: 110, l: 180, a: 430, raioDx: 160 }, { x: 1310, y: 110, l: 180, a: 430, raioDx: -160 }], raios: true, brilho: 0.34, forcaRaio: 0.26, pisoY: 720 },
    ],
    clima: [
      { tipo: 'luz-velas', x: 50, y: 25, opacidade: 0.2, exceto: 'apagado' },
      { tipo: 'neblina', y: 36, altura: 60, opacidade: 0.16, cor: '230,200,190', exceto: 'apagado' },
      { tipo: 'neblina', y: 50, altura: 50, opacidade: 0.2, cor: '170,190,220', quando: 'apagado' },
    ],
  },

  ala_queimada: {
    nome: 'Ala queimada da Casa Vesper',
    imagem: null,
    camadas: [
      { tipo: 'ceu', cores: ['#04050b', '#0c0f1d', '#1a1a2c'] },
      { tipo: 'estrelas', quantidade: 90, ate: 330, semente: 'ala' },
      { tipo: 'lua', x: 1000, y: 150, raio: 36 },
      { tipo: 'parede', topo: 300, cor: '#15100f', cor2: '#0b0908', padrao: 'pedra', opacidadePadrao: 0.5 },
      { tipo: 'manchas', itens: [{ x: 250, y: 520, rx: 200, ry: 150 }, { x: 1300, y: 480, rx: 220, ry: 160 }, { x: 800, y: 420, rx: 300, ry: 120, forca: 0.6 }] },
      { tipo: 'janelas', itens: [{ x: 170, y: 390, l: 140, a: 260 }, { x: 1290, y: 390, l: 140, a: 260 }], ceu: ['#0d1220', '#18203a'], raios: false, brilho: 0.1, moldura: '#0b0909' },
      { tipo: 'teto_quebrado', base: 330, cor: '#0b0909', brasas: true },
      { tipo: 'piso', topo: 700, estilo: 'madeira', cor: '#141010', cor2: '#070505' },
      { tipo: 'feixe', x1: 760, x2: 1060, y1: 300, x3: 680, x4: 1180, y2: 740, cor: '#b9c8e0', forca: 0.14 },
      { tipo: 'piano', x: 860, base: 724, escala: 1 },
    ],
    clima: [{ tipo: 'cinzas', quantidade: 26 }],
  },

  galeria: {
    nome: 'Galeria dos espelhos da Casa Vesper',
    imagem: null,
    camadas: [
      { tipo: 'parede', cor: '#1a1014', cor2: '#100a0d', padrao: 'painel', rodape: 660, opacidadePadrao: 0.2 },
      { tipo: 'espelhos', itens: [{ x: 150, y: 160, l: 160, a: 420 }, { x: 720, y: 110, l: 160, a: 470, rachado: true }, { x: 1290, y: 160, l: 160, a: 420 }], reflexoLuz: '#ffb45a' },
      { tipo: 'quadros', itens: [{ x: 440, y: 220, l: 150, a: 200 }, { x: 1010, y: 220, l: 150, a: 200, olhosRaspados: true }] },
      { tipo: 'arandelas', itens: [{ x: 375, y: 300 }, { x: 640, y: 300 }, { x: 960, y: 300 }, { x: 1225, y: 300 }] },
      { tipo: 'piso', topo: 700, estilo: 'madeira', cor: '#1a100c', cor2: '#080504', tapete: { largura: 560, cor: '#3a0a14' } },
    ],
    clima: [{ tipo: 'luz-velas', x: 50, y: 40, opacidade: 0.14 }],
  },

  terraco: {
    nome: 'Terraço da Casa Vesper sobre o lago',
    imagem: null,
    camadas: [
      { tipo: 'ceu', cores: ['#04050b', '#0b0e1c', '#18182a', '#261c2c'], paradas: [0, 0.45, 0.8, 1] },
      { tipo: 'estrelas', quantidade: 150, ate: 420, semente: 'terraco' },
      { tipo: 'lua', x: 800, y: 190, raio: 44 },
      { tipo: 'nuvens', y: 270, altura: 90, cor: '#2c2840', opacidade: 0.38, semente: 'terraco-n' },
      { tipo: 'montanhas', base: 500, altura: 110, cor: '#0d0d18', semente: 'terraco-m' },
      { tipo: 'floresta', base: 520, alturaMin: 30, alturaMax: 90, cor: '#07070c', semente: 'terraco-f', chao: false },
      { tipo: 'lago', topo: 520, lua: { x: 800, opacidade: 0.85, largura: 80 } },
      { tipo: 'balaustrada', topo: 612, base: 770, cor: '#1c181c', pilares: [170, 1430] },
      { tipo: 'lanternas', itens: [{ x: 170, y: 552, escala: 0.9 }, { x: 1430, y: 552, escala: 0.9 }] },
      { tipo: 'rosas', x: 1260, y: 700, largura: 360, altura: 200, quantidade: 8, escala: 1.3, semente: 'terraco-r' },
    ],
    clima: [{ tipo: 'neblina', y: 49, altura: 15, opacidade: 0.22 }],
  },

  preto: {
    nome: 'Escuridão',
    imagem: null,
    camadas: [],
  },
};
