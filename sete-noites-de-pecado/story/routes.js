/* =========================================================================
   ROTAS E FINAIS
   Rotas: cada interesse romântico tem uma rota com acontecimentos e finais
   próprios. A rota é decidida no Capítulo 3, pela afinidade e pelas escolhas.
   "requisito" usa o mesmo formato das condições do roteiro.

   Finais: a lista completa planejada. Só os que têm "disponivel: true"
   já existem no jogo; os outros aparecem trancados na galeria.
   tipo: romantico, alternativo, ruim, verdadeiro ou secreto.
   ========================================================================= */
window.ROTAS = {
  lucien: {
    personagem: 'lucien',
    tema: 'Rivalidade, orgulho e o peso de um sobrenome.',
    requisito: 'lucien>=8',
    capituloDeEscolha: 3,
  },
  dorian: {
    personagem: 'dorian',
    tema: 'Seis anos de amizade construídos em cima de uma mentira.',
    requisito: 'dorian>=9',
    capituloDeEscolha: 3,
  },
  elias: {
    personagem: 'elias',
    tema: 'Confiança, cuidado e tudo o que ele guardou por você.',
    requisito: 'elias>=8',
    capituloDeEscolha: 3,
  },
  cassian: {
    personagem: 'cassian',
    tema: 'Fugir junto ou ficar e encarar o fogo.',
    requisito: 'cassian>=8',
    capituloDeEscolha: 3,
  },
  adrian: {
    personagem: 'adrian',
    secreta: true,
    tema: 'Um romance impossível guardado do outro lado do espelho.',
    requisito: 'viuAdrian && sabeNomeAdrian && memorias>=6 && adrian>=6',
    dica: 'Algumas lembranças só voltam para quem segue o que não deveria existir.',
    capituloDeEscolha: 5,
  },
};

window.FINAIS = [
  { id: 'recusa', titulo: 'A Recusa', tipo: 'ruim', disponivel: true,
    descricao: 'Você queimou o convite. Bellgrave não esqueceu.',
    dica: 'Nem todo convite pode ser recusado.' },
  { id: 'lucien', titulo: 'Ouro e Cinzas', tipo: 'romantico', personagem: 'lucien', disponivel: false,
    dica: 'A rota de Lucien. Em breve.' },
  { id: 'dorian', titulo: 'Sete Anos de Silêncio', tipo: 'romantico', personagem: 'dorian', disponivel: false,
    dica: 'A rota de Dorian. Em breve.' },
  { id: 'elias', titulo: 'A Biblioteca das Coisas Esquecidas', tipo: 'romantico', personagem: 'elias', disponivel: false,
    dica: 'A rota de Elias. Em breve.' },
  { id: 'cassian', titulo: 'Fuga pelo Lago', tipo: 'romantico', personagem: 'cassian', disponivel: false,
    dica: 'A rota de Cassian. Em breve.' },
  { id: 'setima_mascara', titulo: 'A Sétima Máscara', tipo: 'alternativo', disponivel: false,
    dica: 'E se você aceitasse o lugar que o Círculo guardou para você?' },
  { id: 'esquecer', titulo: 'Esquecer de Novo', tipo: 'alternativo', disponivel: false,
    dica: 'Há quem prefira não saber.' },
  { id: 'cinzas_no_lago', titulo: 'Cinzas no Lago', tipo: 'ruim', disponivel: false,
    dica: 'A Casa Vesper pode queimar duas vezes.' },
  { id: 'ultima_confissao', titulo: 'A Última Confissão', tipo: 'verdadeiro', disponivel: false,
    dica: 'Toda a verdade, de todas as sete máscaras.' },
  { id: 'outro_lado', titulo: 'Do Outro Lado do Espelho', tipo: 'secreto', personagem: 'adrian', disponivel: false,
    dica: 'Alguém está esperando do outro lado do vidro.' },
];

window.TIPOS_DE_FINAL = {
  romantico: 'Final romântico',
  alternativo: 'Final alternativo',
  ruim: 'Final ruim',
  verdadeiro: 'Final verdadeiro',
  secreto: 'Final secreto',
};
