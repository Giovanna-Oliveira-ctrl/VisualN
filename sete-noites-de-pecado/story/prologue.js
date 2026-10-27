/* =========================================================================
   PRÓLOGO · O convite

   COMO O ROTEIRO É ESCRITO (vale para todos os capítulos)

   # nome_do_rotulo           marca um trecho; escolhas e @vai pulam para ele
   Texto solto                narração (o que a protagonista pensa e vê)
   lucien: Fala.              fala de um personagem (ids em js/characters.js)
   lucien (sorriso): Fala.    fala que também muda a expressão dele na tela
   eu: Fala.                  fala da protagonista
   voz: Fala.                 alguém que não aparece (nome "???")
   memoria: Texto.            lembrança, em itálico e sem nome
   _palavras_                 aparecem em itálico
   {nome}                     vira o nome que a jogadora escolheu

   > Texto da opção -> rotulo {lucien+1, dorian-1, viuAdrian} [se pistas>=2]
       Cada linha começando com ">" é uma opção. Entre chaves: efeitos
       (afinidade sobe ou desce, flags ligadas, contadores). Entre colchetes:
       condição para a opção aparecer. Ambos são opcionais.

   @cena biblioteca                 troca o cenário (fade, corte ou preto no fim)
   @mostra lucien serio direita     mostra alguém (expressão, posição, "mascara")
   @esconde lucien   /  @esconde todos
   @musica tema   /  @ambiente chuva   /  @som carta   (veja nomes em js/audio.js)
   @efeito tremer | flash | flash-vermelho | apagar
   @define pistas+1, viuAdrian      muda afinidade, flags e contadores
   @se lucien>=3 -> rotulo          pula se a condição for verdadeira
   @vai rotulo                      pula sempre
   @documento convite               mostra um documento e guarda no Diário
   @favorito                        guarda em "favorito" quem tem mais afinidade
   @capitulo cap1  /  @fim_capitulo cap1  /  @final recusa

   Todo trecho precisa terminar com @vai, uma escolha, @fim_capitulo ou @final.
   Depois de editar, rode: node scripts/verificar-roteiro.js
   ========================================================================= */
window.Roteiro.adicionar({
  id: 'prologo',
  roteiro: String.raw`
# prologo
@cena preto corte
@capitulo prologo
@cena sonho preto
@ambiente fogo
@musica misterio
memoria: Água fria até a cintura. Fogo em cima da água.
memoria: Alguém aperta a minha mão com tanta força que dói.
voz: Não olha para trás. Promete.
memoria: Eu prometo.
memoria: E olho.
@efeito flash
@som susto
@cena preto corte
@ambiente parar
@musica parar
Acordei com a testa encostada na janela do trem e o coração batendo como se eu tivesse corrido a noite inteira.
Sete anos sonhando a mesma coisa. Era de se esperar que, em algum momento, eu me acostumasse.
@cena estacao
@ambiente vento
@som trem
"Bellgrave", anunciou o condutor, no tom de quem dá uma notícia ruim.
Da plataforma, a cidade parecia um desenho a carvão que alguém esqueceu de terminar. Um lago escuro, imenso. Uma floresta fechada em volta. E, acima das árvores, as torres de Saint Agnes, pontudas como agulhas costurando a neblina.
@documento carta_bolsa
Eu carregava aquela carta no bolso do casaco havia três meses, como se ela pudesse sumir se eu a deixasse em casa.
Eu nunca me inscrevi para bolsa nenhuma. Nunca tinha ouvido falar de Saint Agnes antes daquele envelope de papel grosso aparecer na minha caixa de correio.
Trabalho restaurando documentos antigos num museu pequeno da capital. Sou boa nisso: em encontrar o que o tempo apagou.
Com a minha própria vida, nunca tive tanta sorte. O verão em que fiz dezessete anos simplesmente não existe na minha memória. Os médicos chamaram de amnésia dissociativa. Minha tia chamou de "o acidente" e nunca mais tocou no assunto.
Ela morreu no inverno passado e levou junto a única versão da história que eu conhecia.
@musica campus
@mostra dorian sorriso centro
dorian: Você está com cara de quem vai voltar correndo para o trem.
Dorian Ashford. Meu melhor amigo há seis anos, e a única pessoa capaz de usar um sobretudo que custa mais que o meu aluguel numa plataforma úmida como se estivesse num desfile.
Ele me abraçou. Demorou um segundo a mais que de costume para me soltar.
dorian (serio): Eu ainda acho que você não devia ter aceitado.
eu: Você disse isso umas quarenta vezes por telefone.
dorian: E você não ouviu nenhuma. Bellgrave não é lugar para gente como você.
eu: Gente como eu?
dorian (sorriso): Gente boa. Aqui a gente come gente boa no café da manhã.
> "Também senti saudade, Dorian." -> pro_dorian_saudade {dorian+1}
> "Você vai me explicar por que está com essa cara?" -> pro_dorian_cara {desconfiaDorian, pistas+1}
> Bagunçar o cabelo dele, só porque ele odeia. -> pro_dorian_cabelo {dorian+1, provocouDorian}

# pro_dorian_saudade
dorian (sorriso): Eu sei. Sou inesquecível. É uma maldição.
Ele pegou a minha mala antes que eu pudesse protestar, como fazia desde que nos conhecemos.
@vai pro_caminho

# pro_dorian_cara
dorian (serio): Que cara?
eu: Essa. A que você faz quando está escondendo alguma coisa.
Por um instante, ele não respondeu. O sorriso voltou, mas não chegou aos olhos.
dorian (sorriso): Estou escondendo que senti sua falta. Pronto, falei. Pode me processar.
@vai pro_caminho

# pro_dorian_cabelo
dorian (irritado): Seis anos e você ainda acha isso engraçado.
eu: Seis anos e você ainda reage. Então, sim.
dorian (sorriso): Bem-vinda a Bellgrave, sua criatura cruel.
@vai pro_caminho

# pro_caminho
@esconde dorian
@cena campus
@ambiente noite
O caminho da estação até a universidade atravessava a cidade velha: ruas de pedra, casas estreitas de janelas escuras, um silêncio de domingo em plena sexta-feira.
Saint Agnes surgiu no alto da colina como uma catedral que decidiu virar escola. Arcos ogivais, vitrais, gárgulas de olhos gastos pela chuva. Hera subindo pelas paredes como se tentasse esconder alguma coisa.
@mostra dorian neutro centro
dorian: Biblioteca à esquerda, capela à direita, o refeitório mais caro e mais ruim do país lá no fundo.
dorian: E aquela torre é o campanário. Proibido subir. Todo mundo sobe.
Foi então que eu vi os cartazes.
Dezenas deles, presos nos postes, nas portas, no quadro de avisos da entrada. O mesmo rosto em todos: uma moça de cabelo longo e liso, com uma fita preta prendendo a franja.
@documento cartaz_anne
eu: Quem é ela?
dorian (serio): Ninguém que você precise conhecer.
Ele respondeu rápido demais. E pareceu perceber.
dorian (triste): Desculpa. É que essa história assombra a cidade inteira. Uma aluna sumiu numa festa, sete anos atrás. Teve um incêndio na Casa Vesper, lá na beira do lago. A Anne nunca foi encontrada.
dorian: Todo ano, nesta época, alguém espalha esses cartazes. E todo ano a cidade finge que não viu.
Olhei de novo para o rosto no papel. Não senti nada. Nenhuma lembrança.
Só um frio estranho no pulso esquerdo, como se alguém tivesse amarrado uma fita ali com força.
@vai pro_recepcao

# pro_recepcao
@esconde todos
@cena salao preto
@musica parar
@ambiente festa
A recepção dos novos alunos acontecia no Salão Nobre: lustres de cristal, retratos de reitores mortos havia séculos e gente demais vestida para um baile que ninguém tinha anunciado.
Dorian sumiu na multidão em cinco minutos. Cumprimentar herdeiros, segundo ele, era um esporte de contato.
Fiquei perto da parede, segurando uma taça de vinho que não pretendia beber, até parar diante de um retrato no fim do salão.
Um rapaz de casaco escuro, sentado ao lado de um piano. Cabelo ondulado, olhar distante, como se ouvisse uma música que só ele escutava.
A plaquinha de bronze dizia: _Adrian Vesper, 2000 – 2019._
Alguma coisa dentro de mim se mexeu. Não uma lembrança. Uma sensação de degrau que falta no escuro.
@musica misterio
@mostra lucien serio direita
lucien: Ninguém olha para esse quadro por tanto tempo.
lucien: A não ser que tenha um motivo.
Ele estava ao meu lado como se sempre tivesse estado ali. Alto, terno preto de corte impecável, cabelo penteado para trás, um anel de sinete dourado no dedo mínimo.
lucien: Lucien Blackwell. E você deve ser a bolsista da Vesper.
eu: Isso é um cumprimento ou um diagnóstico?
lucien (sorriso): Ainda não decidi.
lucien: Sabe quantas vezes essa bolsa foi concedida nos últimos sete anos?
eu: Imagino que você vá me contar.
lucien (serio): Nenhuma. A família Vesper deixou de existir junto com aquela casa. Mesmo assim, de repente, aparece uma bolsa com o nome deles. E aparece você.
lucien: Bolsistas não costumam durar muito em Saint Agnes. Os da Vesper, menos ainda.
> "Que bom que eu não vim para durar. Vim para estudar." -> pro_lucien_rebate {lucien+1}
> Ignorar o comentário e voltar a olhar o quadro. -> pro_lucien_ignora {ignorouLucien, lucien+1}
> "Quem era ele? O rapaz do quadro." -> pro_lucien_adrian {perguntouAdrian, pistas+1}

# pro_lucien_rebate
Ele levantou uma sobrancelha. Pela primeira vez, pareceu realmente olhar para mim.
lucien (sorriso): Afiada. Isso vai ser interessante.
lucien (serio): Um conselho, bolsista: em Saint Agnes, ninguém faz uma pergunta sem já saber a resposta. Aprenda rápido.
@vai pro_lucien_fim

# pro_lucien_ignora
Voltei a olhar o retrato, como se ele não estivesse ali. Ouvi um sopro curto, quase uma risada.
lucien (surpreso): Ninguém me ignora nesta sala.
eu: Então eu sou a primeira. Pode anotar.
lucien (sorriso): Ah, eu vou anotar.
@vai pro_lucien_fim

# pro_lucien_adrian
O rosto dele mudou. Foi muito rápido, como uma porta batendo com o vento.
lucien (serio): Adrian Vesper. O último herdeiro da Casa Vesper.
lucien: Morreu no incêndio. Como quase tudo naquela casa.
eu: Vocês eram amigos?
lucien (triste): Em Bellgrave, ninguém é amigo de ninguém. Somos sobrenomes que se cumprimentam.
@vai pro_lucien_fim

# pro_lucien_fim
@esconde lucien
Ele se afastou antes que eu pudesse responder. Mas, antes de sumir entre os convidados, olhou para trás. Não para mim.
Para o meu pulso.
@vai pro_biblioteca

# pro_biblioteca
@cena biblioteca preto
@ambiente biblioteca
@musica campus
A secretaria me mandou buscar a chave do quarto na Biblioteca Histórica, porque em Saint Agnes até as chaves dos dormitórios moram entre livros.
Estantes subiam até perder de vista. Escadas de rodinha, abajures verdes, um cheiro de papel antigo e cera de vela que me fez sentir em casa pela primeira vez no dia.
@mostra elias sorriso centro
elias: Você é a bolsista da Vesper.
Atrás do balcão, um rapaz de óculos redondos e colete de lã fechava um livro com o cuidado de quem cobre alguém que dorme.
elias: Elias Whitmore. Eu cuido da Biblioteca Histórica. Ou ela cuida de mim, ainda não decidimos.
eu: Todo mundo aqui já sabe quem eu sou?
elias (sorriso): Em Bellgrave, uma pessoa nova é o assunto do século. Você vai ser comentada até chegar outra. Pode levar uns cinquenta anos.
Ele me entregou uma chave de ferro com uma etiqueta de couro: _Ala Leste, quarto 7._
elias (serio): Sete. Claro que seria sete.
eu: Isso é ruim?
elias: Isso é Bellgrave.
Enquanto eu guardava a chave, ele pôs uma xícara de chá ao lado da minha mão. Fumegando. Sem açúcar, com uma casca fina de laranja boiando.
Exatamente do jeito que eu tomo. Do jeito que eu nunca contei para ninguém, porque é estranho demais para contar.
eu: Como você sabia?
elias (neutro): Sabia o quê?
eu: Do chá. Da laranja.
Ele piscou devagar.
elias (sorriso): Palpite. Você tem cara de quem gosta de coisas amargas com um pouco de luz.
> "Isso foi gentil. E um pouco assustador." -> pro_elias_gentil {elias+1}
> "Palpites assim costumam ter outro nome. Você andou me pesquisando?" -> pro_elias_desconfia {desconfiaElias, pistas+1}
> Aceitar o chá e perguntar sobre a Bolsa Vesper. -> pro_elias_bolsa {elias+1, pistas+1}

# pro_elias_gentil
elias (sorriso): Gentil e assustador. Vou colocar isso no meu currículo.
elias: Se precisar de qualquer coisa, livros, mapas, um lugar silencioso para se esconder de herdeiros barulhentos, eu estou sempre aqui.
@vai pro_elias_fim

# pro_elias_desconfia
elias (serio): Eu pesquiso livros. Pessoas são bem menos organizadas.
Ele sustentou o meu olhar por um instante. Depois sorriu, e o sorriso era tão tranquilo que eu me senti ridícula por ter perguntado.
elias (sorriso): Mas é bom saber que você desconfia. Vai precisar disso aqui.
@vai pro_elias_fim

# pro_elias_bolsa
elias (neutro): A Bolsa Vesper foi criada há doze anos pela família Vesper. Uma vaga por ano, escolhida pela própria família.
elias: Depois do incêndio, ninguém mais recebeu. Os Vesper acabaram. Não sobrou ninguém para escolher.
eu: Então quem me escolheu?
elias (serio): Essa é uma ótima pergunta para fazer em voz baixa.
@vai pro_elias_fim

# pro_elias_fim
@esconde elias
Quando saí, olhei para trás. Ele não estava lendo. Estava me vendo ir embora, com a xícara vazia na mão.
@vai pro_dormitorio

# pro_dormitorio
@cena dormitorio preto
@ambiente noite
@musica parar
O quarto 7 da Ala Leste tinha uma janela ogival enorme, duas camas de madeira escura e uma colega de quarto sentada de pernas cruzadas em cima da minha mala.
@mostra margot sorriso centro
margot: Então você é a famosa bolsista fantasma!
margot: Margot Sinclair. Terceiro ano de Literatura, especialista em fofoca, péssima em química, ótima em guardar segredo. Mentira, péssima em guardar segredo.
eu: Bolsista fantasma?
margot: A Bolsa Vesper, amiga. É a bolsa de uma família morta para estudar perto de uma casa queimada. Metade do campus está apostando em quem te escolheu.
margot (serio): E, sinceramente? Escolheram uma semana bem macabra para você chegar.
margot: Amanhã começa a semana do aniversário. Sete anos da Noite das Sete Máscaras.
eu: O incêndio.
margot: O incêndio, o sumiço da Anne Voss, a morte do Adrian Vesper. O pacote completo.
margot: Sete pessoas foram a uma festa na Casa Vesper. Uma morreu, uma sumiu, e as outras nunca contaram a mesma história duas vezes.
margot: Dizem que era coisa do Círculo de Ônix.
eu: O Dorian me disse que o Círculo é só um clube de herdeiros entediados.
margot (sorriso): O Dorian Ashford disse isso? Que fofo. O Dorian Ashford guarda um anel de ônix na gaveta de meias desde os dezoito anos.
margot: Fonte: confia.
> Rir e pedir mais detalhes sobre o Círculo. -> pro_margot_circulo {pistas+1}
> "Como você sabe o que o Dorian guarda na gaveta?" -> pro_margot_dorian {margotDorian}
> Mudar de assunto. Você está exausta. -> pro_margot_dormir

# pro_margot_circulo
margot: Ninguém sabe quem são todos. Só os sobrenomes de sempre: Blackwell, Ashford, Vale, Whitmore. E os Vesper, antes de acabarem.
margot: Eles dão festas para as quais ninguém foi convidado e todo mundo estava. Jogos. Desafios. Dizem que, para entrar, você precisa entregar um segredo capaz de destruir a sua vida.
margot (serio): E dizem que eles guardam esses segredos. Todos. Para sempre.
@vai pro_margot_fim

# pro_margot_dorian
margot (sorriso): Ciúme já? Gostei de você.
margot: Uma festa no segundo ano, muito vinho, o Dorian chorando no banheiro e me mostrando o anel como quem confessa um crime. Ele nem deve lembrar.
margot (serio): Ele disse uma coisa naquela noite. "Eu devia ter tirado ela de lá antes do fogo." Nunca disse quem era "ela".
@vai pro_margot_fim

# pro_margot_dormir
margot: Justo. Bellgrave cansa só de olhar.
margot (serio): Mas, olha, um conselho de uma amiga que você conheceu há quatro minutos: se alguém te oferecer uma máscara esta semana, recusa.
@vai pro_margot_fim

# pro_margot_fim
@esconde margot
Margot dormiu em dez minutos, no meio de uma frase. Eu fiquei olhando o teto até a lua atravessar a janela inteira.
Às duas da manhã, desisti de dormir.
@vai pro_torre

# pro_torre
@cena torre preto
@ambiente vento
@musica misterio
O campanário era proibido, segundo Dorian. Então, naturalmente, a porta estava aberta.
Subi os degraus de pedra até o topo, onde o vento cheirava a chuva e a floresta. Lá embaixo, o lago de Bellgrave parecia um buraco no mundo.
E, do outro lado da água, quase invisível na neblina, uma casa escura na margem. Grande. Com uma ala inteira sem telhado.
cassian: Bela vista, né? Para quem gosta de ruína.
@mostra cassian neutro direita
Ele estava sentado no parapeito, de costas para o abismo, como se a gravidade fosse um boato. Jaqueta de couro com a gola levantada, cabelo bagunçado pelo vento, uma argola pequena brilhando na orelha.
cassian: Aquela é a Casa Vesper. Foi a melhor festa da cidade. Literalmente pegou fogo.
eu: Isso foi de muito mau gosto.
cassian (sorriso): Eu sou de muito mau gosto. Cassian Vale. E você é...
Ele se virou para me olhar direito. E parou.
cassian (surpreso): ...
A brasa do cigarro tremeu entre os dedos dele. Por um segundo, ele me olhou como quem vê alguém voltar de um lugar de onde ninguém volta.
cassian (serio): Não. Esquece. Você é a bolsista. A nova.
eu: Você me conhece?
cassian: Eu conheço o tipo. Gente que chega em Bellgrave achando que vai sair do mesmo jeito.
cassian: Faz um favor para você mesma: pega o primeiro trem de volta. Amanhã. Antes que alguém resolva te convidar para alguma coisa.
> "Você fala como se tivesse medo por mim." -> pro_cassian_medo {cassian+1}
> "E você, por que não foi embora?" -> pro_cassian_porque {cassian+1, pistas+1}
> "Eu não aceito conselho de quem senta em parapeito." -> pro_cassian_parapeito {cassian+1, desafiouCassian}

# pro_cassian_medo
cassian (irritado): Medo? De você? Eu não tenho medo nem de altura.
Ele bateu o cigarro no parapeito. As cinzas sumiram no escuro.
cassian (serio): Eu só não gosto de ver a história se repetir.
@vai pro_cassian_fim

# pro_cassian_porque
cassian (serio): Porque Bellgrave não deixa.
cassian: Meu sobrenome está gravado em metade dos tijolos desta universidade. Meu pai tem retrato no Salão Nobre. Eu tenho uma dívida que não fui eu que fiz.
cassian (sorriso): E porque alguém precisa ficar aqui em cima avisando os bolsistas. É praticamente trabalho voluntário.
@vai pro_cassian_fim

# pro_cassian_parapeito
cassian (sorriso): Justo.
Ele desceu do parapeito num pulo, parou perto demais e me olhou de cima a baixo.
cassian: Você tem coragem ou falta de juízo. Em Bellgrave, dá no mesmo.
@vai pro_cassian_fim

# pro_cassian_fim
cassian (neutro): Boa noite, bolsista. Tranca a porta.
@esconde cassian
Ele desceu as escadas assobiando uma melodia. Seis notas, que pararam no meio, como uma pergunta sem resposta.
Eu conhecia aquela música. Não sabia de onde. Mas conhecia.
@define memorias+1
@vai pro_convite

# pro_convite
@cena dormitorio escuro preto
@ambiente noite
@musica misterio
Quando voltei para o quarto, a vela da escrivaninha estava apagada. Eu não lembrava de ter acendido.
No chão, encostado na porta, um envelope preto.
Papel grosso, pesado. Um selo de cera escura, quase brilhante, com o desenho de um anel. Meu nome escrito à mão, em tinta vermelha.
Margot dormia. O corredor estava vazio.
@som carta
@documento convite
Dentro do envelope, além do cartão, havia uma fita fina de seda vermelha.
Meus dedos reconheceram a fita antes de mim. Quando percebi, ela já estava amarrada no meu pulso esquerdo, no lugar exato onde eu tinha sentido frio mais cedo.
Eu não conhecia nenhuma Anne Voss.
Então por que as minhas mãos não paravam de tremer?
@fim_capitulo prologo
`,
});
