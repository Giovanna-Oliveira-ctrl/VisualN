/* =========================================================================
   DOCUMENTOS
   Cartas, bilhetes, fotos e páginas que a protagonista encontra.
   Aparecem na tela com o comando @documento id e ficam guardados no Diário.

   tipo: carta, convite, bilhete, cartaz, foto ou livro (muda o visual do papel).
   ilustracao: nome de um desenho de js/art.js (opcional).
   {nome} é trocado pelo nome da protagonista.
   ========================================================================= */
window.DOCUMENTOS = {
  carta_bolsa: {
    titulo: 'Carta da Bolsa Vesper',
    tipo: 'carta',
    cabecalho: 'Universidade de Saint Agnes · Secretaria de Pós-Graduação',
    texto: `Prezada {nome},

Temos a honra de comunicar que você foi selecionada para a Bolsa Vesper de Excelência, que cobre integralmente o Mestrado em História da Arte e Conservação, moradia na Ala Leste e despesas de estudo.

A bolsa é concedida por indicação. Não é necessária nenhuma inscrição.

Esperamos você em Bellgrave no início do semestre.`,
    assinatura: 'Secretaria de Pós-Graduação de Saint Agnes',
  },
  cartaz_anne: {
    titulo: 'Cartaz: Anne Voss',
    tipo: 'cartaz',
    ilustracao: 'retrato-anne',
    texto: `ANNE VOSS
DESAPARECIDA HÁ SETE ANOS

Vista pela última vez na Casa Vesper, às margens do lago de Bellgrave, na Noite das Sete Máscaras.

Vigília à beira do lago na última noite da semana.
Alguém sabe. Alguém sempre sabe.`,
  },
  convite: {
    titulo: 'O convite',
    tipo: 'convite',
    cabecalho: 'Círculo de Ônix',
    texto: `Sete noites.
Sete pecados.
Uma verdade que ninguém merece conhecer.

Casa Vesper. Amanhã, à meia-noite.
A sétima máscara é sua.`,
    assinatura: 'Anne Voss',
  },
  livro_hospedes: {
    titulo: 'Livro de hóspedes da Casa Vesper',
    tipo: 'livro',
    cabecalho: 'Noite das Sete Máscaras',
    texto: `1. Anne Voss
2. Adrian Vesper
3. Lucien Blackwell
4. Dorian Ashford
5. Cassian Vale
6. Elias Whitmore
7. ———— (página rasgada)`,
    assinatura: 'Assinado à mão, em tinta preta. A sétima linha foi arrancada.',
  },
  foto_mascaras: {
    titulo: 'A fotografia das sete máscaras',
    tipo: 'foto',
    ilustracao: 'foto-sete-mascaras',
    texto: `No verso, em tinta vermelha:

"Noite das Sete Máscaras.
Você estava lá.
Você se lembra do fogo?"`,
  },
  mascara_rachada: {
    titulo: 'Um pedaço de porcelana',
    tipo: 'bilhete',
    texto: `Um pedaço de máscara branca, de porcelana, molhado da água do lago.

Na parte de dentro, quase apagado, alguém escreveu à mão:
"Para {nome}, que prometeu não olhar para trás."`,
  },
  segundo_bilhete: {
    titulo: 'O segundo bilhete',
    tipo: 'bilhete',
    cabecalho: 'Círculo de Ônix',
    texto: `Primeira noite: Gula.
Você devorou a mentira que te contaram durante sete anos.

Segunda noite: Inveja.
Pergunte a quem você mais confia onde ele estava quando o fogo começou.`,
    assinatura: 'A. V.',
  },
};
