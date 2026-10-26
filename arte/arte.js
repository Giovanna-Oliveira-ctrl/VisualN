/* Imagens prontas do jogo.
   Enquanto uma cena ou expressão não tiver imagem aqui, o jogo usa a versão pintada por código (js/pintor.js).

   Para trocar por uma imagem de verdade:
   1. Coloque o arquivo em arte/cenas/ (cenários, de preferência 1920x1080) ou em arte/personagens/
      (personagens com fundo transparente, em pé, proporção 2:3, como 1024x1536).
   2. Escreva o caminho abaixo, usando o nome da cena ou "personagem_expressao".

   Nomes de cenas: estrada, vila, padaria, fachada, sala, sala_escuro, quarto, quarto_escuro, corredor,
   corredor_vulto, porao, porao_aberta, jardim, escritorio, amanhecer, hospede, retrato_helena, retrato_heitor.
   Personagens: helena, heitor, cida. Expressões: neutro, sorriso, triste, medo, sombrio.

   Exemplo:
     cenas: { fachada: 'arte/cenas/fachada.jpg' },
     personagens: { helena_neutro: 'arte/personagens/helena_neutro.png' },
*/
window.ARTE = {
  cenas: {},
  personagens: {},
};
