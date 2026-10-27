/* =========================================================================
   CAPÍTULO 1 · A Festa das Máscaras
   Primeira noite · Pecado: Gula

   O formato do roteiro está explicado no topo de story/prologue.js.
   Para criar o Capítulo 2, copie este arquivo como chapter2.js, troque o id
   para 'cap2', comece com "# cap2" e "@capitulo cap2", e termine com
   "@fim_capitulo cap2". Depois siga os passos de story/chapters.js.
   ========================================================================= */
window.Roteiro.adicionar({
  id: 'cap1',
  roteiro: String.raw`
# cap1
@esconde todos
@capitulo cap1
@cena dormitorio
@ambiente chuva
@musica campus
Margot já tinha saído quando acordei. Na escrivaninha, um bilhete dela: "Fui para a aula. Não morra. Beijos."
O convite continuava ali, ao lado do meu travesseiro. Li de novo, como se as palavras pudessem ter mudado durante a noite.
Não tinham.
_A sétima máscara é sua._
Pensei no rosto dos cartazes. No cabelo liso, na fita preta. E, de repente, sem aviso:
memoria: Uma risada de menina. Alguém trançando o meu cabelo e cantarolando, desafinada.
memoria: "Fica quieta, senão a trança sai torta."
@define memorias+1
Não era um sonho. Era uma lembrança. Eu sabia a diferença, mesmo sem saber de quem era a voz.
Alguém precisava saber daquele convite. Ou ninguém podia saber.
> Mostrar o convite para Dorian. -> c1_manha_dorian {dorian+1, mostrouDorian, ultimoEncontro=dorian}
> Levar o convite até a biblioteca e mostrar para Elias. -> c1_manha_elias {elias+1, mostrouElias, ultimoEncontro=elias}
> Guardar segredo e decidir sozinha. -> c1_manha_sozinha {segredo}
> Queimar o convite e esquecer tudo isso. -> c1_queimar

# c1_manha_dorian
@cena campus preto
@ambiente vento
@mostra dorian sorriso centro
Encontrei Dorian no pátio, com dois cafés na mão e o sorriso de quem dormiu bem. O sorriso durou até ele ver o envelope.
dorian (surpreso): Onde você arrumou isso?
eu: Estava debaixo da minha porta. Às duas da manhã.
Ele leu o cartão uma vez. Depois outra. A cor foi sumindo do rosto dele, como água escorrendo de um copo trincado.
dorian (serio): Isso é uma brincadeira do Círculo. Uma brincadeira de muito mau gosto com a bolsista nova. Você não vai.
eu: Assinada pela Anne Voss?
dorian: Qualquer um sabe escrever "Anne Voss", {nome}.
eu: E qualquer um sabia que eu ia amarrar essa fita no pulso sem nem pensar?
Ele olhou para a fita vermelha. Ficou em silêncio por tanto tempo que um sino tocou duas vezes ao longe.
dorian (triste): Se você vai, eu vou junto.
dorian: Não discute. Eu não estou pedindo.
@vai c1_tarde

# c1_manha_elias
@cena biblioteca preto
@ambiente biblioteca
@mostra elias neutro centro
A Biblioteca Histórica estava vazia, a não ser por Elias, por um gato cinza dormindo num dicionário e por uma xícara de chá que já esperava por mim no balcão.
Desta vez, não perguntei como ele sabia.
elias (serio): Selo de ônix verdadeiro. O Círculo não deixa ninguém copiar isso. Nem por brincadeira.
Ele foi até um fichário de madeira e voltou com um cartão de empréstimo amarelado. Um livro de poemas retirado sete anos atrás.
Embaixo, a assinatura: _Anne Voss._
Colocou o cartão ao lado do convite. As duas letras eram idênticas. A mesma curva no A. O mesmo traço impaciente no fim do V.
eu: Ou alguém treinou a letra dela durante sete anos...
elias: ...ou ela escreveu isto. Sim. Eu pensei nas duas coisas.
elias (triste): A Anne era minha amiga. Ela vinha aqui roubar livros de poesia e devolvia com bilhetes dentro.
eu: Você vai estar lá? Na Casa Vesper?
elias (serio): Todos nós vamos estar lá, {nome}. Todos os que sobraram.
@vai c1_tarde

# c1_manha_sozinha
@cena lago preto
@ambiente lago
Guardei o convite no bolso e passei o dia sem falar com ninguém. No fim da tarde, meus pés me levaram sozinhos até a beira do lago.
Do píer, dava para ver a Casa Vesper do outro lado da água. De perto, a ala queimada parecia uma costela exposta.
@mostra cassian serio direita
cassian: Você não ouviu nada do que eu disse ontem, né?
Cassian estava sentado na ponta do píer, jogando pedrinhas na água. Ele olhou para o meu pulso e o rosto dele endureceu.
cassian (irritado): Onde você arrumou essa fita?
eu: Veio junto com um convite.
cassian: Claro que veio.
Ele jogou a última pedra com força demais. Ela afundou sem quicar.
cassian (serio): Tá. Se você vai fazer a idiotice de ir, vai comigo. Pelo menos eu sei onde ficam as saídas daquela casa.
cassian: Já precisei de todas elas uma vez.
@define cassian+1, ultimoEncontro=cassian
@vai c1_tarde

# c1_queimar
@cena dormitorio escuro preto
@ambiente noite
@musica misterio
Acendi a vela da escrivaninha e segurei o convite sobre a chama.
O papel demorou a pegar fogo, como se resistisse. Quando pegou, queimou depressa, numa chama alta e azulada, com cheiro de rosas.
A fita vermelha eu joguei pela janela. O vento levou na direção do lago.
Passei o dia estudando. Jantei com Margot. Dormi às onze, como uma pessoa normal num lugar normal.
@musica tensao
@som batida
Às três da manhã, alguém bateu na porta. Três batidas, espaçadas.
Quando abri, o corredor estava vazio. No chão, um envelope preto. Dentro, um cartão marfim e uma única frase, com a mesma letra:
voz: _Você recusou da última vez também. Lembra o que aconteceu?_
Junto com o cartão, uma fotografia queimada nas bordas. Sete pessoas de máscara numa escadaria de pedra.
A sétima máscara estava riscada a caneta, com tanta força que o papel tinha rasgado.
@musica parar
Na manhã seguinte, comprei uma passagem de volta. Nunca mais respondi às mensagens do Dorian.
Às vezes, no meio da noite, ainda sinto uma fita apertando o meu pulso. E sonho com fogo em cima da água.
Nunca descobri o que aconteceu com Anne Voss. Nem o que aconteceu comigo.
@final recusa

# c1_tarde
@esconde todos
@cena dormitorio preto
@ambiente noite
@musica misterio
@mostra margot surpreso centro
Quando Margot voltou e viu o convite, gritou tão alto que a vizinha bateu na parede.
margot: Um convite do Círculo. Um convite do Círculo de verdade, com selo de ônix e tudo, para a Noite da Gula!
margot (serio): Assinado pela Anne Voss. Tá. Isso é horrível. Mas também é a coisa mais interessante que já aconteceu neste quarto.
Ela me emprestou um vestido preto de veludo, com mangas longas e um decote que ela chamou de "respeitosamente perigoso".
margot (sorriso): Se alguém começar a recitar coisas em latim, você me liga. Se alguém te oferecer uma bebida azul, você não bebe.
margot (triste): E, {nome}... volta. Tá? Volta.
@esconde margot
@vai c1_caminho

# c1_caminho
@cena lago preto
@ambiente lago
@musica misterio
O caminho até a Casa Vesper contornava o lago por dentro da floresta. Alguém tinha deixado velas em potes de vidro ao longo da trilha, uma a cada dez passos, como migalhas num conto de fadas que termina mal.
@se mostrouDorian -> c1_caminho_dorian
@se segredo -> c1_caminho_cassian
@vai c1_caminho_sozinha

# c1_caminho_dorian
@mostra dorian serio centro
Dorian andava ao meu lado em silêncio, com uma máscara vermelha na mão, girando-a entre os dedos como quem reza um terço.
dorian: Promete uma coisa.
dorian: Se eu disser "vamos embora", a gente vai. Sem pergunta. Sem discussão.
> "Prometo." -> c1_caminho_dorian_promete {dorian+1, prometeuDorian}
> "Só se você me disser por que está com tanto medo." -> c1_caminho_dorian_porque {pistas+1}

# c1_caminho_dorian_promete
dorian (sorriso): Obrigado.
dorian (triste): Você prometeu a mesma coisa da última vez que eu te pedi isso.
eu: Que última vez?
dorian (serio): Esquece. Chegamos.
@vai c1_porta

# c1_caminho_dorian_porque
dorian (irritado): Porque eu conheço essa casa, {nome}. E ela me conhece.
Ele não disse mais nada até a porta.
@vai c1_porta

# c1_caminho_cassian
@mostra cassian neutro direita
Cassian andava na minha frente, com as mãos nos bolsos e uma máscara preta pendurada no pescoço, desviando das velas como quem desvia de minas.
cassian: Regra número um: não bebe nada que não viu abrirem. Regra número dois: se as velas apagarem, você fica parada e encosta na parede.
eu: E a regra número três?
cassian (serio): Não existe regra número três. Da última vez, ninguém viveu o suficiente para inventar.
@vai c1_porta

# c1_caminho_sozinha
A trilha estava vazia. Só eu, as velas e o barulho da água.
Na metade do caminho, olhei para o lago. No fim de um píer quebrado, alguém estava parado na neblina, olhando na minha direção. Um rapaz, talvez. Alto, de casaco escuro.
Pisquei. O píer estava vazio.
@define viuVulto
@vai c1_porta

# c1_porta
@esconde todos
@cena vesper_fachada preto
@ambiente festa
@musica baile
A Casa Vesper não estava abandonada naquela noite.
Centenas de velas cobriam os degraus de pedra. Rosas negras subiam pelas colunas. Lanternas balançavam nos galhos, e pelas janelas sem vidro saía uma valsa tocada por alguém que não queria que ela acabasse.
A ala queimada continuava ali, preta, aberta para o céu. Ninguém parecia olhar para ela.
@mostra anfitriao neutro centro
Na porta, uma figura alta de capa negra e máscara inteira de ônix, sem expressão nenhuma.
anfitriao: Sete noites. Sete pecados.
anfitriao: Esta é a primeira noite. A noite da Gula.
anfitriao: Aqui dentro, todos devoram alguma coisa. Vinho. Segredos. Uns aos outros.
Ele abriu uma caixa de veludo. Dentro, uma máscara de renda vermelha, delicada, do tom exato da fita no meu pulso.
anfitriao: Ela foi feita para você, {nome}. Há sete anos.
eu: Quem é você?
anfitriao: Hoje? Apenas o anfitrião. Amanhã, talvez, uma resposta.
anfitriao: Ninguém entra na Casa Vesper de rosto nu.
@define tempoFesta=2
@esconde anfitriao
@vai c1_salao

# c1_salao
@cena baile preto
Coloquei a máscara. Encaixou no meu rosto como se tivesse sido moldada nele.
O salão de baile era um mar de velas, veludo e rostos escondidos. Herdeiros de Bellgrave dançavam, riam alto demais, bebiam um vinho tão escuro que parecia tinta.
Mesmo de máscara, alguns eram fáceis de reconhecer.
A máscara dourada, alta e imóvel no meio do salão, que só podia ser Lucien Blackwell. Ele não dançava com ninguém. Estendia a mão, de longe, na minha direção.
A meia-máscara preta encostada na parede do corredor que levava à ala queimada. Cassian.
Uma máscara prateada e, por trás dela, o reflexo de óculos redondos, subindo uma escada para o andar de cima. Elias.
@se mostrouDorian -> c1_salao_dorian
E uma máscara vermelha, sozinha, na porta do terraço. Dorian. Que eu não sabia que estaria ali.
@vai c1_menu

# c1_salao_dorian
E Dorian, ao meu lado, que apertou o meu braço e foi para o terraço tomar ar.
@vai c1_menu

# c1_menu
@se tempoFesta<=0 -> c1_meia_noite
@se tempoFesta==1 -> c1_menu_tarde
O relógio do salão marcava onze e quinze. Faltavam quarenta e cinco minutos para a meia-noite.
@vai c1_opcoes

# c1_menu_tarde
@cena baile preto
@musica baile
@ambiente festa
O relógio do salão marcava onze e quarenta. Ainda dava tempo para mais uma coisa.
@vai c1_opcoes

# c1_opcoes
> Aceitar a mão estendida da máscara dourada e dançar. -> c1_lucien [se !viuLucien]
> Seguir a máscara preta até a ala queimada. -> c1_cassian [se !viuCassian]
> Subir a escada atrás da máscara prateada. -> c1_elias [se !viuElias]
> Ir até o terraço sobre o lago. -> c1_dorian [se !viuDorian]

# c1_lucien
@define tempoFesta-1, viuLucien, ultimoEncontro=lucien
@mostra lucien neutro centro mascara
A máscara dourada estendeu a mão como quem faz uma aposta. Aceitei antes de pensar se devia.
lucien: Você dança mal, bolsista.
eu: Você conduz mal, herdeiro.
lucien (sorriso): Touché.
Ninguém mais em Bellgrave segurava a mão de alguém como se estivesse assinando um contrato.
Ele me girou pelo salão sem esforço. As velas viravam riscos de luz. As rosas negras pareciam se inclinar quando passávamos.
lucien (serio): Você não devia ter vindo.
eu: Todo mundo me diz isso. Ninguém me diz por quê.
lucien: Porque ninguém sabe o que você vai lembrar.
Ele olhou para o meu pulso. Para a fita.
lucien (serio): Você ainda usa isso.
eu: Ainda?
O corpo dele travou no meio do passo. Só por um segundo. O suficiente.
lucien (irritado): Força de expressão.
> "Você me conhecia. Diz a verdade." -> c1_lucien_verdade {lucien-1, pistas+1, lucienAinda}
> Apertar a mão dele e não deixar a dança acabar. -> c1_lucien_danca {lucien+2, lucienAinda}
> Pisar no pé dele. De propósito. -> c1_lucien_pe {lucien+1, lucienAinda}

# c1_lucien_verdade
lucien (serio): A verdade custa caro em Bellgrave, bolsista. E você ainda não tem como pagar.
Ele soltou a minha mão no meio da música e me deixou sozinha no centro do salão, com cinquenta máscaras olhando.
Mas, antes de ir, disse baixo, quase sem mover os lábios:
lucien (triste): Eu te conhecia. Isso é tudo o que você vai ter de graça.
@esconde lucien
@vai c1_menu

# c1_lucien_danca
Apertei a mão dele e continuei dançando, como se a pergunta nunca tivesse existido.
Por um momento, Lucien pareceu esquecer de ser cruel. A mão dele relaxou nas minhas costas. O passo ficou mais lento que a música.
lucien (triste): Você fazia isso. Mudava de assunto dançando.
lucien (serio): Se alguém te entregar um segundo envelope esta noite, me procura antes de abrir. Promete.
eu: Por que eu confiaria em você?
lucien (sorriso): Não confia. Só me procura.
@esconde lucien
@vai c1_menu

# c1_lucien_pe
Pisei. Com o salto. Com vontade.
Lucien Blackwell, herdeiro de metade da cidade, soltou uma risada curta e verdadeira, que fez três máscaras virarem para nós.
lucien (sorriso): A primeira pessoa que me pisa de propósito em sete anos.
lucien (serio): A última também foi você. Aproveita. Não vai ter uma terceira.
@esconde lucien
@vai c1_menu

# c1_cassian
@define tempoFesta-1, viuCassian, ultimoEncontro=cassian
@cena ala_queimada preto
@ambiente vento
@musica misterio
@mostra cassian serio direita mascara
A ala queimada era outro mundo. O teto tinha desabado e o céu entrava por cima. Vigas pretas, cinza no chão, papel de parede derretido em ondas. No meio de tudo, um piano coberto de fuligem.
Cassian estava ajoelhado ao lado dele, empurrando escombros com as mãos.
cassian: Você tem mesmo um talento para aparecer onde não devia.
eu: O que você está procurando?
cassian (serio): Uma coisa que eu escondi aqui. Sete anos atrás.
Debaixo do piano, ele puxou uma caixa de metal pequena, derretida de um lado. Uma caixinha de música. Deu corda com dedos sujos de carvão.
@som caixinha
Seis notas. Pararam no meio.
eu: Essa música. Você assobiou ontem, na torre.
cassian (triste): A Anne cantava isso o tempo inteiro. Era dela.
cassian: Eu estava aqui naquela noite. Todo mundo que importa estava.
> "Me conta o que aconteceu." -> c1_cassian_conta {cassian+1, pistas+1}
> Segurar a mão dele, que está tremendo. -> c1_cassian_mao {cassian+2}
> "Você escondeu uma prova de um incêndio. Isso tem nome." -> c1_cassian_acusa {cassian-1, pistas+1}

# c1_cassian_conta
cassian (serio): A gente estava jogando. Um jogo idiota do Círculo. Cada um tinha que contar um segredo à meia-noite.
cassian: A Anne disse que o dela era o pior de todos. Que, depois que ela contasse, nenhum de nós ia conseguir olhar para os outros do mesmo jeito.
cassian: À meia-noite, as velas apagaram. Quando acenderam de novo, tinha fogo no corredor. E a Anne não estava mais na sala.
cassian (triste): Não me pergunta o resto. Eu não lembro. Ou não quero lembrar. Faz sete anos que eu não sei qual dos dois.
@esconde cassian
@vai c1_volta_salao

# c1_cassian_mao
A mão dele estava fria e suja de carvão. Ele não se afastou.
cassian (surpreso): Não faz isso.
eu: Isso o quê?
cassian (triste): Isso. Você fazia isso. Antes.
Ele percebeu o que tinha dito e soltou a minha mão como se ela queimasse.
cassian (irritado): Esquece. Eu falo demais quando estou neste lugar.
@esconde cassian
@vai c1_volta_salao

# c1_cassian_acusa
cassian (irritado): Tem nome, sim. Sobrevivência.
Ele guardou a caixinha no bolso da jaqueta e passou por mim sem encostar.
cassian (serio): Pergunta para os outros o que eles esconderam. Eu pelo menos admiti.
@esconde cassian
@vai c1_volta_salao

# c1_elias
@define tempoFesta-1, viuElias, ultimoEncontro=elias
@cena biblioteca preto
@ambiente biblioteca
@musica misterio
@mostra elias neutro centro mascara
No andar de cima ficava a biblioteca da Casa Vesper. Menor que a de Saint Agnes, metade dos livros com as lombadas pretas de fumaça. Uma única vela acesa.
Elias estava sentado no chão, com a máscara prateada no alto da cabeça e um livro enorme aberto no colo.
elias (sorriso): Eu sabia que você ia achar este lugar. Pessoas como nós sempre acham as bibliotecas.
elias (serio): Vem. Você precisa ver isto antes da meia-noite.
Era o livro de hóspedes da Casa Vesper. Ele abriu numa página marcada com uma fita preta.
@documento livro_hospedes
eu: Você estava aqui.
elias: Estava. Eu nunca escondi isso. Só que ninguém nunca me perguntou.
eu: E a sétima linha?
elias: Arrancada. Na manhã seguinte ao incêndio. Eu sei porque fui eu que encontrei o livro.
elias (triste): E porque eu sei de quem era a letra.
Ele olhou para mim. Não para a máscara. Para mim.
> "De quem era?" -> c1_elias_quem {pistas+1}
> "Por que você está me contando isso?" -> c1_elias_porque {elias+1}
> Fechar o livro devagar. "Hoje não. Eu não estou pronta." -> c1_elias_fechar {elias+2}

# c1_elias_quem
elias (serio): Não é minha para contar. Mas você vai descobrir esta noite.
elias: Esta festa foi feita para isso.
@esconde elias
@vai c1_volta_salao

# c1_elias_porque
elias (triste): Porque, das sete pessoas daquela noite, você é a única que não tem culpa de ter esquecido.
elias: Nós tivemos sete anos para inventar desculpas. Você não.
@esconde elias
@vai c1_volta_salao

# c1_elias_fechar
Fechei o livro. Elias pôs a mão sobre a minha, em cima da capa de couro, sem apertar.
elias (sorriso): Então hoje não.
elias (serio): Ninguém vai te obrigar a lembrar mais rápido do que você aguenta. Nem eu.
Ficamos assim um tempo, ouvindo a valsa subir pelo assoalho. Foi a primeira vez em dois dias que eu respirei direito.
@esconde elias
@vai c1_volta_salao

# c1_dorian
@define tempoFesta-1, viuDorian, ultimoEncontro=dorian
@cena terraco preto
@ambiente lago
@musica misterio
@mostra dorian triste centro mascara
O terraço dava direto para o lago. A lua desenhava um caminho de prata na água, e a névoa subia pelas pedras da balaustrada.
Dorian estava debruçado nela, com a máscara vermelha empurrada para o alto do cabelo.
@se mostrouDorian -> c1_dorian_junto
dorian (surpreso): Você veio. Claro que veio.
dorian (triste): Eu devia ter imaginado quando você parou de responder minhas mensagens à tarde.
@vai c1_dorian_conversa

# c1_dorian_junto
dorian (sorriso): Precisava de ar. Lá dentro tem gente demais que sabe o meu nome.
@vai c1_dorian_conversa

# c1_dorian_conversa
dorian (serio): {nome}, eu menti para você.
dorian: Eu disse que a minha família era da capital. Que eu nunca tinha pisado em Bellgrave antes da faculdade.
dorian (triste): Eu cresci aqui. Nesta beira de lago. Eu conhecia a Anne. Conhecia todo mundo daquela noite.
eu: Você estava aqui.
dorian: Eu estava aqui.
dorian: E seis anos atrás, quando eu entrei naquele ateliê do museu fingindo ser um estagiário qualquer...
Ele parou. Apertou a balaustrada até os nós dos dedos ficarem brancos.
> "Por que você mentiu para mim durante seis anos?" -> c1_dorian_porque {dorian-1, pistas+1, dorianMentiu}
> Abraçar o Dorian. Brigar com ele pode ficar para amanhã. -> c1_dorian_abraco {dorian+2, dorianMentiu}
> "Termina a frase, Dorian." -> c1_dorian_frase {dorian+1, pistas+1, dorianMentiu}

# c1_dorian_porque
dorian (irritado): Porque a verdade ia te machucar mais que a mentira. Pelo menos foi o que eu disse para mim mesmo todo santo dia.
dorian (triste): Seis anos repetindo isso. Às vezes eu quase acreditava.
@esconde dorian
@vai c1_volta_salao

# c1_dorian_abraco
Abracei Dorian. Ele ficou rígido por um segundo, e depois desmontou inteiro, com o rosto escondido no meu ombro.
dorian (triste): Você devia estar furiosa comigo.
eu: Eu estou. Amanhã eu te mato. Hoje, não.
dorian (sorriso): Justo.
@esconde dorian
@vai c1_volta_salao

# c1_dorian_frase
dorian (serio): Eu não fui parar lá por acaso.
dorian: Alguém me mandou ficar perto de você. Para saber se você ia lembrar.
dorian (triste): No começo, foi isso. Depois...
Ele balançou a cabeça.
dorian: O resto, amanhã. Eu juro. Pela fita no seu pulso.
@esconde dorian
@vai c1_volta_salao

# c1_volta_salao
@vai c1_menu

# c1_meia_noite
@esconde todos
@cena baile preto
@musica parar
@ambiente festa
@som meia_noite
O relógio do salão começou a bater a meia-noite. Todo mundo parou de dançar ao mesmo tempo, como se tivesse ensaiado.
Na décima segunda badalada, todas as velas da Casa Vesper se apagaram.
@ambiente parar
@cena baile apagado corte
@efeito apagar
Escuridão. Total. Gritinhos, risadas nervosas, alguém derrubando uma taça.
@som caixinha
E então, no meio do escuro, uma caixinha de música começou a tocar. Seis notas. Pararam no meio.
voz: Você voltou.
A voz estava no meu ouvido. Tão perto que senti um hálito frio no pescoço.
Virei. A lua entrava pelas janelas e desenhava o contorno de um corredor. No fim dele, numa galeria de espelhos, uma figura pálida, de máscara branca e rachada, me olhava.
> Seguir a figura até a galeria de espelhos. -> c1_espelho {viuAdrian, adrian+1, memorias+1}
> Ficar onde estou e procurar a mão de alguém no escuro. -> c1_escuro

# c1_espelho
@cena galeria preto
@ambiente vento
@musica misterio
Andei no escuro, com a mão na parede, até a galeria. Espelhos altos de moldura dourada, um ao lado do outro, como uma fila de portas.
Não havia ninguém ali.
@cena galeria vulto corte
Até eu olhar para o espelho rachado do fim.
Do outro lado do vidro, atrás do meu reflexo, um rapaz de casaco escuro e cabelo ondulado. A máscara branca de porcelana tinha uma rachadura que descia do olho até o queixo.
Virei para trás. Corredor vazio. Voltei a olhar o espelho. Ele continuava lá.
@mostra adrian triste centro mascara
adrian: Você prometeu que ia esquecer.
adrian: Cumpriu bem demais.
eu: Quem é você?
adrian (triste): Alguém que você deixou na água.
Ele ergueu a mão até o vidro. Sem pensar, ergui a minha. O espelho estava gelado. Por um instante, só um instante, senti dedos do outro lado.
adrian (serio): Não confia em quem te mandou esse convite. E não confia em quem vai te dizer que ele é falso.
@efeito flash
@esconde adrian
@cena galeria corte
As velas voltaram a acender, todas de uma vez. O espelho mostrava só eu, sozinha, de máscara vermelha e boca aberta.
Atrás de mim, o reflexo de uma gota d'água escorria pelo vidro. Do lado de dentro.
@vai c1_jogo

# c1_escuro
Fiquei parada, como alguém tinha me ensinado um dia, e estendi a mão no escuro.
Outra mão encontrou a minha. Quente. Firme.
@favorito
@se favorito==lucien -> c1_escuro_lucien
@se favorito==elias -> c1_escuro_elias
@se favorito==cassian -> c1_escuro_cassian
@vai c1_escuro_dorian

# c1_escuro_lucien
Um anel de sinete encostou nos meus dedos. Lucien não disse nada. Só não soltou até a luz voltar.
@define lucien+1
@vai c1_escuro_fim

# c1_escuro_elias
Dedos longos, com cheiro de papel antigo e laranja. Elias sussurrou: "Respira. Conta até sete." E eu contei.
@define elias+1
@vai c1_escuro_fim

# c1_escuro_cassian
Uma mão áspera, de quem rói as unhas. Cassian puxou minhas costas contra a parede, exatamente como tinha me ensinado na trilha, e ficou na minha frente.
@define cassian+1
@vai c1_escuro_fim

# c1_escuro_dorian
Eu conheceria aquela mão em qualquer lugar. Dorian apertou meus dedos três vezes, nosso código bobo de seis anos: "estou aqui".
@define dorian+1
@vai c1_escuro_fim

# c1_escuro_fim
Quando as velas voltaram a acender, todas ao mesmo tempo, a mão já tinha soltado a minha. Mas o calor ficou.
@vai c1_jogo

# c1_jogo
@esconde todos
@cena baile preto
@ambiente festa
@musica tensao
@mostra anfitriao neutro centro
O Anfitrião estava no alto da escadaria do salão, imóvel, como se nunca tivesse saído dali.
anfitriao: Que comece o jogo da Gula.
anfitriao: Cada um de vocês vai receber um envelope. Dentro dele, um segredo que não pertence a você.
anfitriao: Devorem. Engulam. E descubram que gosto tem a verdade dos outros.
@esconde anfitriao
Criados de máscara de prata passaram com bandejas, entregando envelopes pretos. O meu tinha o meu nome em tinta vermelha, na mesma letra do convite.
@som carta
Dentro, uma fotografia.
@documento foto_mascaras
Sete jovens de máscara, na escadaria de pedra da Casa Vesper, antes do fogo. Uma máscara dourada. Uma vermelha. Uma prateada. Uma meia-máscara preta. Uma de porcelana branca. Uma de renda preta.
E, na ponta esquerda, uma menina de máscara de renda vermelha. Com uma fita fina de seda amarrada no pulso esquerdo.
@musica parar
@efeito flash
memoria: Fogo subindo pelas cortinas. Alguém gritando o meu nome.
memoria: Uma mão de menina, com uma fita preta no pulso, me empurrando na direção da porta.
anne: Corre, {nome}! Não olha para trás!
@efeito tremer
@define memorias+1, sabeQueEstava
Eu estava lá.
Sete anos atrás, na Noite das Sete Máscaras, eu estive nesta casa. Com eles.
A sétima máscara era eu.
@vai c1_romance

# c1_romance
@favorito
@se favorito==lucien -> c1_rom_lucien
@se favorito==elias -> c1_rom_elias
@se favorito==cassian -> c1_rom_cassian
@vai c1_rom_dorian

# c1_rom_lucien
@define cenaRomantica=lucien
@cena terraco preto
@ambiente lago
@musica romance
Não lembro como cheguei ao terraço. Lembro do ar frio do lago e das minhas mãos tremendo tanto que a foto fazia barulho.
@mostra lucien serio centro
Lucien estava lá. Sem máscara. Tirou a fotografia dos meus dedos com cuidado, como quem tira uma faca da mão de alguém.
Olhou para ela por muito tempo.
lucien (triste): Você estava de vermelho. Era a única pessoa naquela noite que não tinha medo de nada.
eu: Então você lembra de mim.
lucien: Eu passei sete anos tentando não lembrar.
Ele tirou o paletó e o pôs nos meus ombros. Ficou com as mãos ali um segundo a mais do que precisava.
lucien (serio): Vai embora de Bellgrave, {nome}. Amanhã cedo. Eu pago a passagem, pago o que for.
eu: Por quê?
lucien: Porque eu não vou conseguir te proteger duas vezes.
> "Duas vezes? Então você me protegeu daquela vez?" -> c1_rl_duas {lucien+1, pistas+1}
> Puxá-lo pela gravata e acabar com a distância. -> c1_rl_beijo {lucien+2, beijouLucien}
> Devolver o paletó. "Eu não preciso que ninguém me proteja." -> c1_rl_orgulho {lucien+1, orgulhoLucien}

# c1_rl_duas
lucien (triste): Eu tentei.
lucien (serio): E falhei com todo mundo daquela foto. Não me peça para falhar com você de novo.
Ele foi embora antes que eu pudesse devolver o paletó. Ficou o cheiro de cedro e de fumaça.
@vai c1_fim

# c1_rl_beijo
Puxei Lucien pela gravata. Ele não resistiu.
O beijo foi uma discussão que nenhum de nós queria vencer. Quando ele se afastou, estava sem fôlego e com uma expressão que eu nunca imaginei ver no rosto de um Blackwell. Medo.
lucien (serio): Isso foi um erro.
eu: Então erra de novo.
lucien (sorriso): Amanhã você vai me odiar, bolsista.
lucien (triste): Eu só queria que não fosse pelo motivo certo.
@vai c1_fim

# c1_rl_orgulho
Tirei o paletó e o devolvi para ele.
eu: Eu não preciso que ninguém me proteja.
Lucien riu, baixo, e por um instante pareceu muito mais jovem.
lucien (sorriso): Foi exatamente isso que você me disse sete anos atrás. Com essas palavras.
lucien (serio): Na época, você estava errada.
@vai c1_fim

# c1_rom_dorian
@define cenaRomantica=dorian
@cena terraco preto
@ambiente lago
@musica romance
Não lembro como cheguei ao terraço. Lembro do ar frio do lago e das minhas mãos tremendo tanto que a foto fazia barulho.
@mostra dorian triste centro
Dorian me encontrou ali. Viu a fotografia. Não precisou perguntar nada.
dorian: Eu sei. Eu sempre soube que você esteve aqui.
dorian: Eu fiquei perto de você esses anos todos porque precisava saber se você ia lembrar. Esse foi o começo, {nome}.
dorian (serio): Depois virou outra coisa. Virou a melhor coisa da minha vida. E eu não sei como desfazer a primeira parte.
> "Então a nossa amizade começou com uma mentira." -> c1_rd_mentira {dorian-1, magoadaDorian}
> Segurar o rosto dele. "E a outra coisa, Dorian? Virou o quê?" -> c1_rd_outra {dorian+2, quaseDorian}
> Encostar a testa no ombro dele e só respirar. -> c1_rd_ombro {dorian+1}

# c1_rd_mentira
dorian (triste): Começou. Não terminou.
dorian: Eu vou provar isso. Nem que leve mais seis anos.
Ele ficou ao meu lado até a valsa terminar, sem encostar em mim. Não sei qual de nós dois estava se segurando.
@vai c1_fim

# c1_rd_outra
Segurei o rosto dele com as duas mãos. Dorian fechou os olhos como quem se prepara para uma queda.
dorian (triste): Se eu responder isso hoje, eu perco a única coisa que eu ainda não estraguei.
Ele beijou a palma da minha mão. Só isso. Foi o suficiente para eu esquecer, por alguns segundos, de onde estava.
dorian (sorriso): Pergunta de novo no sétimo dia. Se ainda quiser saber.
@vai c1_fim

# c1_rd_ombro
Encostei a testa no ombro dele. Dorian ficou imóvel, depois passou o braço em volta de mim, devagar, como se eu pudesse quebrar.
dorian (sorriso): Seis anos e você ainda cabe exatamente aqui.
Ficamos assim até o frio do lago ganhar a discussão.
@vai c1_fim

# c1_rom_elias
@define cenaRomantica=elias
@cena biblioteca preto
@ambiente biblioteca
@musica romance
Não lembro como cheguei à biblioteca da casa. Lembro das minhas mãos tremendo tanto que a foto fazia barulho.
@mostra elias neutro centro
Elias me sentou perto da vela e tirou uma garrafa térmica da bolsa. Serviu o chá numa xícara lascada.
Sem açúcar. Com casca de laranja.
Ele segurou minhas mãos em volta da xícara até elas pararem de tremer.
elias (sorriso): Você não precisa lembrar de tudo hoje.
eu: Como você sabe do chá, Elias? De verdade.
elias (triste): Porque você me ensinou.
elias: Sete anos atrás. Numa cozinha cheia de fumaça, às quatro da manhã, quando tudo tinha acabado e ninguém conseguia parar de tremer. Você fez chá para todo mundo. Com casca de laranja. Disse que a sua mãe fazia assim.
> "Então você estava comigo depois do incêndio." -> c1_re_depois {elias+1, pistas+1}
> Entrelaçar os dedos nos dele. -> c1_re_maos {elias+2, maosElias}
> "Você lembra de tudo e eu de nada. Isso não é justo." -> c1_re_justo {elias+1}

# c1_re_depois
elias (serio): Estava. Até levarem você embora, de manhã. Ninguém me deixou ir junto.
elias: Eu escrevi para você durante um ano. Todas as cartas voltaram.
@vai c1_fim

# c1_re_maos
Entrelacei os dedos nos dele. Elias ficou muito quieto, como se tivesse medo de espantar um pássaro.
elias (sorriso): Se você quiser, eu te ajudo a lembrar. Uma coisa de cada vez.
elias (serio): Eu guardei tudo, {nome}. Tudo o que você esqueceu. Estava esperando você voltar para buscar.
@vai c1_fim

# c1_re_justo
elias (triste): Não é. Mas talvez seja misericórdia.
elias: Tem coisas daquela noite que eu daria tudo para esquecer. Você conseguiu. Eu nunca soube se te invejava ou se tinha pena.
@vai c1_fim

# c1_rom_cassian
@define cenaRomantica=cassian
@cena ala_queimada preto
@ambiente vento
@musica tensao
Não lembro de ter me mexido. Lembro de uma mão segurando o meu pulso.
@mostra cassian serio centro
cassian: A gente vai embora. Agora.
Cassian me puxou pela ala queimada, por cima de vigas e de vidro, por uma porta que eu nunca teria encontrado sozinha.
@cena lago preto
@ambiente chuva
@musica romance
Corremos até o píer. Tinha começado a chover. Ele tirou a máscara, eu tirei a minha, e por algum motivo idiota nós dois começamos a rir, sem fôlego, encharcados.
Até ele parar de rir.
cassian (triste): Eu achei que você estava morta.
cassian: Sete anos achando que você tinha ficado lá dentro. Que eu tinha deixado você lá dentro.
eu: Ninguém me contou nada.
cassian (serio): Ninguém conta nada nesta cidade. A gente só acende vela e finge.
> "Você chorou por mim?" -> c1_rc_chorou {cassian+1}
> Abraçar Cassian na chuva. -> c1_rc_abraco {cassian+2, abracoCassian}
> "Me leva até a água. Eu preciso ver onde me acharam." -> c1_rc_agua {cassian+1, pistas+1, memorias+1}

# c1_rc_chorou
cassian (irritado): Eu não choro.
cassian (sorriso): Eu fiquei muito resfriado durante um ano inteiro. É diferente.
Ele empurrou o meu ombro com o dele. Não se afastou depois.
@vai c1_fim

# c1_rc_abraco
Abracei Cassian na chuva. Ele ficou parado, com os braços abertos, como quem não sabe onde colocar as mãos.
Depois me apertou com tanta força que doeu.
cassian (triste): Não some de novo. Tá? Eu não sei fazer isso duas vezes.
@vai c1_fim

# c1_rc_agua
Cassian me levou até a ponta do píer. A água estava preta, parada, apesar da chuva.
cassian (serio): Foi ali. Os bombeiros te acharam ali, de manhã. Com água até a cintura, segurando uma máscara que não era sua.
@efeito flash
memoria: Água fria. Uma mão segurando a minha. "Não olha para trás."
memoria: Uma máscara branca, de porcelana, afundando devagar.
Quando voltei a mim, Cassian estava me segurando pelos ombros.
cassian (surpreso): Ei. Ei. Fica aqui comigo.
@vai c1_fim

# c1_fim
@esconde todos
@se viuAdrian && memorias>=3 -> c1_adrian_lago
@vai c1_volta

# c1_adrian_lago
@cena lago preto
@ambiente lago
@musica misterio
Voltei para a trilha sozinha. No meio do caminho, as velas dos potes de vidro se apagaram uma a uma, na minha frente, como se alguém soprasse cada uma.
No fim do píer quebrado, havia alguém. Sem máscara, desta vez.
@mostra adrian triste centro
adrian: Ainda não.
eu: Ainda não o quê?
adrian (serio): Ainda faltam seis noites. Você ainda não lembrou o suficiente para me ver direito.
eu: Pelo menos me diz o seu nome.
Ele sorriu, e foi o sorriso mais triste que eu já vi.
adrian (sorriso): Você sabe o meu nome. Está escrito embaixo de um quadro, no Salão Nobre.
adrian: Adrian.
@define sabeNomeAdrian, adrian+1
@efeito flash
@esconde adrian
Na ponta do píer, molhado, ficou um pedaço de porcelana branca.
@documento mascara_rachada
@vai c1_volta

# c1_volta
@esconde todos
@cena dormitorio escuro preto
@ambiente noite
@musica misterio
Cheguei ao quarto às três da manhã. Margot dormia de boca aberta, abraçada a um livro.
Em cima do meu travesseiro havia um segundo envelope preto.
@som carta
@documento segundo_bilhete
A. V.
Anne Voss.
Ou Adrian Vesper.
Tirei a máscara de renda vermelha e a deixei sobre a escrivaninha, ao lado da fita. Pela janela, do outro lado do lago, uma única vela continuava acesa na Casa Vesper.
Faltavam seis noites.
@fim_capitulo cap1
`,
});
