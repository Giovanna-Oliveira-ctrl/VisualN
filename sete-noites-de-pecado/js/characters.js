/* =========================================================================
   PERSONAGENS
   Aqui ficam os dados de cada personagem: nome, cor, descrição e imagens.

   - "romance: true" faz o personagem ter afinidade e aparecer no Diário.
   - "afinidadeInicial" é o valor com que a afinidade começa (de -10 a 20).
   - "nomeAntes" e "revelaCom": enquanto a variável indicada em "revelaCom"
     não existir, o nome mostrado na caixa de diálogo é "nomeAntes".
   - "imagens": deixe vazio para usar a arte provisória. Quando tiver imagens
     de verdade, coloque os arquivos em assets/characters/ e escreva, por exemplo:
       imagens: { neutro: 'assets/characters/lucien-neutro.png',
                  sorriso: 'assets/characters/lucien-sorriso.png' }
     Expressões usadas no roteiro: neutro, sorriso, serio, triste, surpreso, irritado.
   ========================================================================= */
window.PERSONAGENS = {
  lucien: {
    nome: 'Lucien',
    nomeCompleto: 'Lucien Blackwell',
    titulo: 'O herdeiro',
    cor: '#c9a24e',
    romance: true,
    afinidadeInicial: 0,
    descricao: 'Herdeiro da família que mantém Saint Agnes de pé. Elegante, orgulhoso e cruel com as palavras. Nunca diz tudo o que sabe.',
    imagens: {},
  },
  dorian: {
    nome: 'Dorian',
    nomeCompleto: 'Dorian Ashford',
    titulo: 'O melhor amigo',
    cor: '#b3263a',
    romance: true,
    afinidadeInicial: 2,
    descricao: 'Seu melhor amigo há seis anos. Carismático, irônico e impossível de prever. Nunca contou que cresceu em Bellgrave.',
    imagens: {},
  },
  elias: {
    nome: 'Elias',
    nomeCompleto: 'Elias Whitmore',
    titulo: 'O confidente',
    cor: '#e3d6bc',
    romance: true,
    afinidadeInicial: 0,
    descricao: 'Doutorando e guardião da Biblioteca Histórica. Gentil, atento a tudo. Parece saber de você coisas que você nunca contou.',
    imagens: {},
  },
  cassian: {
    nome: 'Cassian',
    nomeCompleto: 'Cassian Vale',
    titulo: 'O rebelde',
    cor: '#8a97a8',
    romance: true,
    afinidadeInicial: 0,
    descricao: 'Sarcástico, impulsivo e sempre de saída. Olhou para você como quem vê um fantasma.',
    imagens: {},
  },
  adrian: {
    nome: 'Adrian',
    nomeCompleto: 'Adrian Vesper',
    titulo: 'O segredo',
    cor: '#9db9c9',
    romance: true,
    secreto: true,
    afinidadeInicial: 0,
    nomeAntes: '???',
    revelaCom: 'sabeNomeAdrian',
    descricao: 'Herdeiro da Casa Vesper. Oficialmente, morreu no incêndio de sete anos atrás.',
    imagens: {},
  },
  anne: {
    nome: 'Anne',
    nomeCompleto: 'Anne Voss',
    titulo: 'A desaparecida',
    cor: '#7a1f33',
    descricao: 'Desapareceu na Noite das Sete Máscaras, sete anos atrás.',
    imagens: {},
  },
  margot: {
    nome: 'Margot',
    nomeCompleto: 'Margot Sinclair',
    titulo: 'A colega de quarto',
    cor: '#d39a4a',
    descricao: 'Sua colega de quarto. Sabe de todas as fofocas de Saint Agnes, inclusive das que não deveria.',
    imagens: {},
  },
  anfitriao: {
    nome: 'O Anfitrião',
    nomeCompleto: 'O Anfitrião do Círculo de Ônix',
    titulo: 'Máscara de ônix',
    cor: '#b89a5a',
    descricao: 'Ninguém sabe quem está por trás da máscara de ônix.',
    imagens: {},
  },
};

/* Falantes que não são personagens com imagem.
   "eu" é a protagonista; "voz" é alguém que não se vê; "memoria" são lembranças (sem nome, em itálico). */
window.FALANTES_ESPECIAIS = {
  eu: { nome: '{nome}', cor: '#efe4cf' },
  voz: { nome: '???', cor: '#c23a4a' },
  memoria: { nome: '', cor: '#d8c7a6' },
};
