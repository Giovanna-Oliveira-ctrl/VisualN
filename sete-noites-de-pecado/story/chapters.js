/* =========================================================================
   CAPÍTULOS
   Os sete capítulos (sete noites, sete pecados) e o prólogo.

   Para adicionar um capítulo novo:
   1. Crie o arquivo story/chapter2.js (copie chapter1.js como modelo) com
      Roteiro.adicionar({ id: 'cap2', roteiro: `...` }) e um rótulo "# cap2".
   2. Adicione <script src="story/chapter2.js"></script> no index.html,
      logo depois de chapter1.js.
   3. Mude "disponivel" do capítulo para true aqui embaixo.
   O fim do capítulo anterior (@fim_capitulo cap1) passa a levar para ele sozinho.
   ========================================================================= */
window.CAPITULOS = [
  {
    id: 'prologo', numero: 0, titulo: 'Prólogo', subtitulo: 'O convite',
    noite: null, pecado: null, inicio: 'prologo', disponivel: true,
    epigrafe: 'Algumas cidades guardam segredos. Bellgrave guarda pessoas.',
  },
  {
    id: 'cap1', numero: 1, titulo: 'A Festa das Máscaras', subtitulo: 'Primeira noite',
    noite: 'Primeira noite', pecado: 'Gula', inicio: 'cap1', disponivel: true,
    epigrafe: 'Aqui dentro, todos devoram alguma coisa.',
  },
  {
    id: 'cap2', numero: 2, titulo: 'O Segredo dos Outros', subtitulo: 'Segunda noite',
    noite: 'Segunda noite', pecado: 'Inveja', inicio: 'cap2', disponivel: false,
    epigrafe: 'Ninguém deseja tanto um segredo quanto quem não pode tê-lo.',
  },
  {
    id: 'cap3', numero: 3, titulo: 'O Preço da Verdade', subtitulo: 'Terceira noite',
    noite: 'Terceira noite', pecado: 'Avareza', inicio: 'cap3', disponivel: false,
    epigrafe: 'Toda verdade tem um dono. E todo dono cobra.',
  },
  {
    id: 'cap4', numero: 4, titulo: 'A Primeira Traição', subtitulo: 'Quarta noite',
    noite: 'Quarta noite', pecado: 'Ira', inicio: 'cap4', disponivel: false,
    epigrafe: 'A primeira traição nunca é a última. É só a primeira que se descobre.',
  },
  {
    id: 'cap5', numero: 5, titulo: 'O Que Você Deseja', subtitulo: 'Quinta noite',
    noite: 'Quinta noite', pecado: 'Luxúria', inicio: 'cap5', disponivel: false,
    epigrafe: 'Cuidado com o que você pede numa casa que escuta.',
  },
  {
    id: 'cap6', numero: 6, titulo: 'A Verdade Esquecida', subtitulo: 'Sexta noite',
    noite: 'Sexta noite', pecado: 'Preguiça', inicio: 'cap6', disponivel: false,
    epigrafe: 'Esquecer também é uma escolha. Só não parece.',
  },
  {
    id: 'cap7', numero: 7, titulo: 'A Última Confissão', subtitulo: 'Sétima noite',
    noite: 'Sétima noite', pecado: 'Soberba', inicio: 'cap7', disponivel: false,
    epigrafe: 'Sete noites. Sete pecados. Uma verdade que ninguém merece conhecer.',
  },
];
