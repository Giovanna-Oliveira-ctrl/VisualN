/* Sete Velas — roteiro

   Como ler este arquivo:
   # rotulo                     começo de um trecho (para onde as escolhas e o @vai pulam)
   Texto solto                  narração
   L: / C: / E: / R: / H:       falas de {li}, Dona Cida, você, vó Rosa (carta e diário) e da coisa no porão
   > Texto -> rotulo {a+=1} [se cond]   opção de escolha, com efeitos e condição opcionais
   @cena nome [opções] [fade|corte|preto]   @mostra quem expressão [esq|centro|dir]   @expr   @some
   @musica / @ambiente / @som   @fx chuva|neblina|poeira|nada   @tremer [forte]   @flash   @relampago
   @set a=1, b+=2   @se cond -> rotulo   @vai rotulo   @titulo Título | Subtítulo   @velas noite=1 vento=0   @final id

   {nome} é o nome de quem joga. {li} é Helena ou Heitor. {masculino|feminino} escolhe a forma conforme o par.
   A narração é em primeira pessoa e evita marcar o gênero de quem joga.
*/
window.FINAIS = [
  { id: 'luz', titulo: 'Primeira Luz', texto: 'O trato se desfez, e a Valsa da Névoa ganhou um final.', dica: 'Saiba tudo, ganhe a confiança de quem toca piano e não tenha medo da porta.' },
  { id: 'eterna', titulo: 'Vela Eterna', texto: 'Em noites de neblina, duas sombras dançam na janela do casarão.', dica: 'Às vezes, ficar é a única saída.' },
  { id: 'estrada', titulo: 'Estrada de Volta', texto: 'Todo dia 23 de junho, sete velas acesas numa janela da capital.', dica: 'Há quem não possa atravessar o portão.' },
  { id: 'fuga', titulo: 'Fuga na Tempestade', texto: 'Quando o fogo apagou, a porta do porão estava aberta.', dica: 'Correr nem sempre é escapar.' },
  { id: 'onibus', titulo: 'Ônibus das Seis', texto: 'Uma janela acesa no alto do morro, e depois nenhuma.', dica: 'Dona Cida avisou o horário.' },
  { id: 'porta', titulo: 'Porta Aberta', texto: 'Agora sou eu quem toca a valsa. Ainda não sei o final.', dica: 'Nem todo pedido deve ser atendido.' },
];

window.HISTORIA = String.raw`
# inicio
@set afeto=0
@cena preto corte
@titulo Prólogo | A herança
@cena estrada
@ambiente vento
@fx neblina
@som onibus
O ônibus me deixou no acostamento da serra e foi embora depressa, como quem foge de alguma coisa.
Na última hora de viagem, eu tinha visto a neblina engolir as curvas, uma a uma. Agora ela estava em toda parte: nos pinheiros, no asfalto molhado, na placa enferrujada do ponto.
_São Bento do Sereno, 3 km._
No bolso do casaco, a carta do cartório. Eu tinha lido tantas vezes que o papel já estava mole nas dobras.
"...comunicamos o falecimento da Sra. Rosa Amarante, aos 71 anos, e informamos que o imóvel da Rua do Rosário, nº 7, passa a pertencer a {nome} Amarante, única pessoa viva da família."
Eu só tinha visto minha avó uma vez, aos sete anos. Lembro de uma casa enorme, de um cheiro de cera derretida e de uma senhora que não me deixava chegar perto da escada do porão.
Minha mãe nunca quis voltar. Saiu de São Bento aos dezoito anos e, sempre que alguém tocava no assunto, dizia a mesma coisa:
_Aquela casa come gente._
Ela morreu há três anos sem explicar o que queria dizer com isso.
Peguei a mala e comecei a andar.
@cena vila preto
@som sino
Cheguei à praça quando o sino da matriz batia cinco horas.
São Bento do Sereno parecia ter parado num ano de que ninguém mais lembrava. Sobrados coloridos de janelas fechadas, calçamento de pedra, postes de ferro acendendo um a um.
E ninguém na rua. Nem um cachorro.
Só uma porta aberta, na esquina, com luz amarela lá dentro e uma placa pintada à mão:
_Padaria Santa Luzia, desde 1951._
@vai padaria

# padaria
@cena padaria preto
@fx nada
@ambiente chuva
O sino da porta tocou quando entrei. Lá fora, a garoa começava.
@mostra cida neutro
C: Fecha a porta, que a neblina entra junto.
A senhora atrás do balcão me olhou de cima a baixo, devagar, como quem confere uma encomenda.
C: Você tem os olhos da Rosa. Igualzinhos.
E: A senhora conhecia a minha avó?
C: Conhecia? Sessenta e tantos anos de amizade, criança. A gente aprendeu a ler junto, naquela igreja ali da praça.
C: Aparecida. Mas aqui todo mundo me chama de Dona Cida.
Ela me serviu café num copo americano e um pão de queijo tão quente que queimou meus dedos. Não perguntou se eu queria.
C: Come. Ninguém entra naquela casa de barriga vazia.
Depois, enxugou as mãos no avental e tirou de debaixo do balcão um molho de chaves de ferro, pesado como uma ferradura.
Sete chaves. Contei sem querer.
C: E isto aqui a Rosa pediu pra eu entregar em mãos. Na sua mão e na de mais ninguém.
Um envelope pequeno, amarelado, com o meu nome escrito numa letra trêmula.
@expr cida triste
R: Meu bem, se esta carta chegou até você, é porque eu não estou mais aí para acender as velas. Agora é com você.
R: São só três coisas. Peço que não ache bobagem de velha.
R: Primeiro: toda noite, antes da meia-noite, acenda as sete velas da escada do porão. Todas as sete. Todas as noites.
R: Segundo: nunca, por motivo nenhum, abra a porta do porão. Nem se alguém pedir. _Principalmente_ se alguém pedir.
R: Terceiro: seja gentil com quem mora na casa. Faz muito tempo que ninguém é.
R: Com todo o amor que eu não soube te dar, sua avó Rosa.
Dobrei a carta devagar.
E: "Quem mora na casa"? Ela não morava sozinha?
@expr cida medo
Dona Cida demorou a responder. O relógio de pêndulo encheu o silêncio.
C: ...Morava.
C: Olha, criança. Vou te dizer o que eu disse pra Rosa a vida inteira: vende aquela casa. Pro primeiro que aparecer, pelo preço que der. E vai embora.
C: Mas, enquanto estiver lá dentro, faz o que ela pediu.
> "A senhora acredita nessas coisas?" -> cida_acredita
> "Pode deixar. Eu vou fazer o que ela pediu." -> cida_promessa {cidaConfia=1}

# cida_acredita
@expr cida neutro
C: Eu acredito no que eu vi, criança.
C: E eu vi a Rosa acender aquelas velas toda santa noite, por cinquenta e dois anos. Com febre, com enchente, na noite do enterro do próprio pai.
C: Mulher nenhuma faz uma coisa dessas à toa.
@vai cida_saida

# cida_promessa
@expr cida neutro
C: Boa. A Rosa ia gostar de ouvir isso.
Ela segurou minha mão por cima do balcão. A mão dela era quente e áspera de farinha.
C: Qualquer coisa, qualquer coisa mesmo, você corre pra cá. A padaria abre às cinco da manhã.
@vai cida_saida

# cida_saida
C: Ah, e outra coisa.
C: O último ônibus pra capital sai aqui da praça às seis da tarde. Todo dia, faça chuva ou faça sol.
C: Só pra você saber.
@some cida
@vai casa_chegada

# casa_chegada
@cena fachada preto
@ambiente vento
@fx neblina
A Rua do Rosário subia o morro até onde acabava o calçamento. O número 7 era a última casa.
Era maior do que na minha lembrança. Paredes brancas manchadas de musgo, janelas de madeira azul descascando, um portão de ferro que gemeu quando empurrei.
No jardim, as hortênsias tinham crescido sem ninguém para podar. Azuis, enormes, quase da altura da minha cintura.
Foi então que eu vi.
Lá em cima, numa das janelas do segundo andar, uma luz amarela, trêmula.
Uma vela acesa.
Dona Cida tinha dito que ninguém entrava ali desde o enterro, duas semanas antes.
@som porta
Quando olhei de novo, a janela estava escura.
@vai sala_chegada

# sala_chegada
@cena sala preto
@fx poeira
@ambiente casa
Por dentro, a casa cheirava a cera, a mofo e a flores velhas.
Passei as primeiras horas tirando lençóis de cima dos móveis e abrindo janelas que não abriam havia anos. Retratos de gente séria me olhavam das paredes. Um relógio parado marcava quatro e dez.
Comi o resto do pão de queijo de pé, na cozinha. Quando a noite caiu, eu já tinha esquecido da janela.
Foi aí que ouvi o piano.
@musica valsa
Uma valsa. Lenta, triste, tocada com cuidado, como se cada nota pudesse quebrar.
Vinha da sala grande.
Havia alguém ao piano, de costas para mim, quase invisível na penumbra.
> "Quem está aí?" -> encontro_firme
> Ficar em silêncio e ouvir a música até o fim. -> encontro_ouvir {afeto+=1, ouviu=1}

# encontro_firme
@musica nada
@som nota
A música parou no meio de uma frase.
@mostra li medo
L: Desculpa. Eu não queria assustar.
@vai encontro

# encontro_ouvir
Não me mexi. Não sei quanto tempo durou. A valsa subia, hesitava, voltava, e no final simplesmente parou, como quem perde o fio de uma frase.
@musica nada
@mostra li neutro
L: Você esperou a música acabar.
L: Quase ninguém faz isso.
@vai encontro

# encontro
@expr li neutro
{Ele|Ela} se levantou e veio até a luz da janela.
Devia ter a minha idade, talvez um pouco mais. Pele pálida, olhos escuros e cansados, roupa de outra época, como figurino de novela antiga. No pescoço, uma corrente fina com uma medalhinha oval.
O ar ficou mais frio quando {ele|ela} chegou perto. Achei que fosse a janela aberta.
@set conhece=1
L: {Heitor|Helena}. Muito prazer.
L: Eu cuido da casa. Cuidava, pra Dona Rosa. Ela me deixava morar na edícula, lá no fundo do jardim, e eu cuidava das plantas. E das velas.
E: Ninguém me falou de você.
@expr li triste
L: A Dona Rosa não era de falar muito de mim.
@expr li sorriso
L: Mas falava muito de você, {nome}. Mostrava a sua foto, de quando você veio aqui com sete anos.
L: Você chorou porque não deixaram você descer a escada do porão.
E: Eu não lembro disso.
L: Eu lembro.
> "Você toca muito bem." -> elogio {afeto+=1}
> "Você costuma entrar assim na casa dos outros?" -> provoca

# elogio
@expr li sorriso
L: Faz muito tempo que ninguém me diz isso.
L: Essa valsa é minha. Eu chamo de _Valsa da Névoa_. Nunca consegui terminar.
L: Toda vez que chego na última parte, a música some da minha cabeça.
@vai encontro_fim

# provoca
@expr li sorriso
L: Esta casa é mais minha do que você imagina, {nome}.
@expr li neutro
L: Mas você tem razão. Desculpa. Eu devia ter batido.
@vai encontro_fim

# encontro_fim
{Ele|Ela} olhou para o relógio parado na parede, como se ele marcasse alguma coisa.
L: Está quase na hora.
E: Hora de quê?
L: Das velas. A Dona Rosa te deixou um bilhete, não deixou?
L: Vem. Eu te mostro onde ficam.
@vai noite1

# noite1
@some todos
@musica nada
@titulo Primeira noite | As sete velas
@cena porao velas=0
@ambiente casa
@fx poeira
A escada do porão ficava atrás de uma porta estreita, no fim da cozinha. Doze degraus de pedra, úmidos, descendo para um frio que não tinha nada a ver com o inverno.
Lá embaixo, uma porta de madeira grossa, presa por correntes e um cadeado do tamanho do meu punho.
Na frente dela, numa saliência de pedra, sete velas brancas, em fila. A cera escorrida de cinquenta anos formava uma espécie de raiz no chão.
O cheiro era de terra molhada e de alguma coisa doce, como flor apodrecendo.
@mostra li neutro
L: Uma de cada vez, da esquerda para a direita. A Dona Rosa dizia que a ordem importa.
L: Eu nunca tive coragem de perguntar por quê.
E: Você não acende?
@expr li triste
L: Eu não posso.
L: ...Quer dizer, não é meu papel. Tem que ser alguém da família.
@some li
@velas noite=1 vento=0
@se velas1>=7 -> noite1_ok
@vai noite1_falhou

# noite1_ok
@cena porao velas=7 corte
As sete chamas ficaram de pé, retas, imóveis, como se nenhum ar se mexesse ali embaixo.
E então, do outro lado da porta, alguma coisa suspirou.
Um suspiro longo e fundo, de quem se acomoda para dormir.
@mostra li neutro
L: Pronto. Ele dorme.
E: Ele quem?
@expr li triste
{Ele|Ela} demorou um pouco para responder.
L: O porão. Casa velha tem dessas coisas.
@vai noite1_despedida

# noite1_falhou
@set despertou+=1
@cena porao velas=$velas1 corte
@som relogio
O relógio da sala começou a bater a meia-noite antes que eu terminasse.
@som batida
@tremer
E a porta respondeu.
Três batidas. Lentas. Do lado de dentro.
@mostra li medo
L: Acende, {nome}. Acende as outras. Agora.
Minhas mãos tremiam tanto que quebrei dois fósforos. Na terceira tentativa, a chama pegou, e fui acendendo as que faltavam, da esquerda para a direita.
@cena porao velas=7 corte
@som acender
As batidas pararam na sétima.
Ficamos um tempo ali, ouvindo. Do outro lado da porta, alguma coisa respirava devagar, como quem volta a dormir contrariado.
L: Ele acordou um pouco. Só um pouco.
L: Amanhã, mais cedo. Por favor.
@vai noite1_despedida

# noite1_despedida
@expr li neutro
Subimos em silêncio. Na porta da cozinha, {ele|ela} parou.
L: Boa noite, {nome}.
L: Se ouvir alguma coisa esta noite... não responda.
@some li
Quando me virei para perguntar o que {ele|ela} queria dizer com aquilo, a cozinha estava vazia.
Não ouvi a porta dos fundos abrir. Não ouvi passo nenhum.
@vai quarto1

# quarto1
@cena quarto preto
@fx nada
@ambiente chuva
O quarto que um dia tinha sido da minha mãe ficava no segundo andar. A cama era alta, de madeira escura, e rangia cada vez que eu me mexia.
Lá fora, a garoa tinha virado chuva.
Fiquei olhando o teto, ouvindo a casa. Casas velhas fazem barulho à noite, eu repetia. A madeira esfria. O telhado assenta.
@som relogio
Em algum lugar lá embaixo, um relógio que eu jurava estar parado bateu meia-noite.
@musica tensao
@som batida
E depois, as batidas.
Vinham de baixo. Do fundo da casa. Do porão.
@som batida
@tremer
E então, uma voz. Abafada pelas tábuas do chão, mas inconfundível.
H: {nome}... meu bem...
H: Desce aqui. A vó tem uma coisa pra te mostrar.
Era a voz da minha avó. Eu tinha ouvido aquela voz uma única vez, aos sete anos, e mesmo assim reconheci.
> Descer até o porão. -> q1_descer
> Cobrir a cabeça e não responder. -> q1_ficar
> Chamar baixinho por {li}. -> q1_chamar {afeto+=1, chamou=1}

# q1_descer
@set desceu=1
@cena corredor preto
@ambiente casa
Não sei por que me levantei. Talvez porque era a voz dela. Talvez porque uma parte de mim ainda tinha sete anos e queria, finalmente, descer aquela escada.
O corredor estava escuro. No fim dele, o espelho grande devolvia a luz fraca da janela.
@cena porao velas=7 preto
@som passos
Desci os degraus de pedra contando: um, dois, três... doze.
As sete velas continuavam acesas. Mas as chamas não estavam retas. Estavam inclinadas, todas, na minha direção, como se alguma coisa do outro lado da porta estivesse puxando o ar.
H: Isso, meu bem. Abre pra vó. Está tão frio aqui.
Minha mão já estava na corrente quando outra mão, gelada, segurou meu pulso.
@mostra li medo
@som susto
@flash
L: Não.
L: Não é ela, {nome}. A Dona Rosa nunca, nunca ia te chamar aqui embaixo.
A voz do outro lado da porta riu. Não era mais a voz da minha avó. Não era voz de ninguém.
@expr li triste
{Ele|Ela} me puxou escada acima sem soltar meu pulso. Os dedos {dele|dela} eram tão frios que doíam.
L: Eu não devia estar aqui dentro a essa hora. Mas ouvi você descendo.
L: Por favor. Não faz isso de novo.
@vai dia2

# q1_ficar
@cena quarto escuro corte
Puxei o cobertor por cima da cabeça, como uma criança, e prendi a respiração.
@som batida
As batidas continuaram. Depois pararam.
@som passos
Depois começaram de novo, mais perto. Na escada. No corredor.
Pararam bem na frente da minha porta.
Um silêncio comprido.
@som arranhar
E então alguma coisa começou a arranhar a madeira, devagar, de baixo para cima, como unhas compridas experimentando a porta.
@tremer
@musica nada
@som nota
Lá embaixo, uma única nota de piano soou no escuro. Suave. Quase um aviso.
O arranhado parou na hora.
Não preguei o olho até o dia clarear.
@vai dia2

# q1_chamar
Não sei por que fiz isso. Foi o primeiro nome que me veio.
E: {li}...?
Nem tinha terminado de falar quando ouvi os passos no corredor. Passos leves, rápidos.
@som porta
A porta se abriu.
@musica nada
@mostra li neutro
{Heitor|Helena} estava ali, com uma vela na mão. A chama não tremia, como se não houvesse vento nenhum no mundo.
As batidas pararam. Assim, de uma vez.
L: Ele gosta de assustar quem chega. Não liga.
L: Eu fico aqui até você dormir.
{Ele|Ela} se sentou no chão, com as costas no batente da porta e a vela no colo.
E: Você não vai dormir?
@expr li sorriso
L: Eu não durmo muito.
Adormeci com {ele|ela} cantarolando a valsa, baixinho. A melodia subia, hesitava e parava sempre no mesmo lugar.
@vai dia2

# dia2
@some todos
@musica nada
@titulo Segundo dia | O que a casa guarda
@cena fachada
@ambiente vento
@fx neblina
A manhã chegou cinzenta, sem sol, com a neblina grudada nas janelas.
Procurei {Heitor|Helena} pela casa inteira. Na cozinha, na sala, no jardim. Nada.
Então fui até a edícula, no fundo do terreno.
A porta estava trancada com um cadeado tão enferrujado que tinha virado uma peça só com o trinco. Pela janela suja, dava para ver uma cama sem colchão, teias de aranha e um calendário na parede.
_Junho de 1974._
Ninguém morava ali. Ninguém entrava ali havia décadas.
Voltei para dentro com o estômago gelado. Eu tinha o dia inteiro até escurecer e perguntas demais.
@set tempo=2
@vai dia2_menu

# dia2_menu
@se tempo<=0 -> dia2_fim
@se tempo==1 -> dia2_menu_tarde
O que fazer primeiro?
@vai dia2_opcoes

# dia2_menu_tarde
@cena fachada
@ambiente vento
@fx neblina
A tarde já ia pela metade. Ainda dava tempo para mais uma coisa antes de escurecer.
@vai dia2_opcoes

# dia2_opcoes
> Ir até a padaria conversar com Dona Cida. -> d2_cida [se !cidaHistoria]
> Mexer no escritório da vó Rosa. -> d2_escritorio [se !diario]
> Olhar os retratos antigos da sala. -> d2_retratos [se !foto]

# d2_cida
@set tempo-=1, cidaHistoria=1
@cena vila preto
@fx neblina
Desci o morro até a praça. De dia, a cidade continuava vazia, como se todo mundo tivesse combinado de ficar em casa.
@cena padaria preto
@fx nada
@ambiente chuva
@mostra cida neutro
C: Dormiu?
E: Mais ou menos.
Dona Cida não perguntou mais nada. Só me serviu o café e ficou me olhando beber.
E: Dona Cida... quem morava na edícula?
@expr cida triste
Ela suspirou e se sentou no banquinho atrás do balcão, como quem se prepara para uma história comprida.
C: Em 1974, a casa da Rosa era pensão. O pai dela alugava os quartos pra quem vinha passar o inverno na serra.
C: Naquele ano veio {um moço|uma moça} do Rio. Pianista. Tocava toda noite, e a cidade inteira parava na porta pra ouvir.
C: A Rosa tinha dezenove anos. Se apaixonou, claro. Todo mundo se apaixonou um pouco.
C: Na noite de São João, {ele|ela} sumiu. Disseram que tinha fugido pro Rio sem pagar a pensão.
C: A Rosa nunca acreditou. Foi dali em diante que começou essa história das velas.
E: E como {ele|ela} se chamava?
C: {Heitor|Helena}. {Heitor|Helena} Duarte.
@som vidro
@tremer
A xícara escorregou da minha mão e se espatifou no chão.
@expr cida medo
C: Criança? Que cara é essa?
> Contar sobre {li}. -> d2_cida_conta {cidaSabe=1}
> "Nada. Só... frio." -> d2_cida_cala

# d2_cida_conta
Contei tudo. O piano, a medalhinha, a mão gelada, a chama que não tremia.
Dona Cida fez o sinal da cruz três vezes.
C: {Ele|Ela} sumiu há cinquenta e dois anos, criança.
C: Se ainda está naquela casa, é porque o porão não deixou ir embora.
@expr cida triste
C: A Rosa vivia mexendo naquele piano, sabia? Abria a tampa toda semana. Nunca tocou uma nota na vida, mas abria.
C: Eu achava que era saudade. Agora já não sei.
@vai d2_cida_fim

# d2_cida_cala
@expr cida neutro
C: Frio, sei.
Ela varreu os cacos sem tirar os olhos de mim.
C: A Rosa também ficava com essa cara, às vezes. Quando voltava do jardim, no fim da tarde.
@vai d2_cida_fim

# d2_cida_fim
@some cida
Saí da padaria com o gosto do café na boca e o nome martelando na cabeça.
{Heitor|Helena} Duarte. 1974.
@vai dia2_menu

# d2_escritorio
@set tempo-=1, diario=1
@cena escritorio preto
@fx poeira
@ambiente casa
O escritório da vó Rosa ficava no fim do corredor. Cartas empilhadas, um terço pendurado no abajur, fotos em porta-retratos pequenos.
A gaveta de baixo da escrivaninha estava trancada. A menor das sete chaves abriu.
Lá dentro, um caderno de capa de couro. A primeira página tinha a data de 1974.
R: _24 de junho de 1974._ Meu pai sempre disse que o porão era do Hóspede. Que o bisavô Coronel fez um trato em 1888: o ouro das minas em troca de uma alma da família a cada geração.
R: Eu achava que era história para criança não descer a escada. Esta noite, abri a porta. Só queria ver.
R: {Heitor|Helena} desceu atrás de mim, para me proteger. A porta se fechou sozinha. Só eu subi.
Virei as páginas. A letra mudava com os anos, ficava menor, mais trêmula.
R: _1975._ O Hóspede levou a alma errada. {Heitor|Helena} não é Amarante, e ele não consegue engolir quem não é do sangue.
R: Enquanto as sete velas queimarem, ele dorme. E {ele|ela} fica na casa, entre uma coisa e outra. Vejo {Heitor|Helena} no jardim, ao entardecer, igualzinh{o|a} àquela noite.
R: _1990._ {Ele|Ela} me perguntou por que não envelhece. Contei tudo. {Ele|Ela} me perdoou. Eu nunca vou me perdoar.
R: _2019._ Achei o contrato do Coronel, escrito com sangue, emparedado no antigo quarto dele. Ali diz como desfazer o trato.
R: O sangue Amarante e a mão de quem foi levado, juntos, queimando o contrato na chama da sétima vela. Diante da porta aberta.
R: Diante da porta _aberta_.
R: Sou velha demais, e covarde demais. Escondi o contrato dentro do piano, debaixo da tecla que não toca.
R: _2026._ O Hóspede está com fome. Fala com {Heitor|Helena} à noite. Promete liberdade se {ele|ela} levar alguém do sangue até a porta.
R: Tenho medo do que cinquenta anos de solidão fazem com uma alma.
A última página estava em branco, a não ser por uma linha escrita com tanta força que quase rasgou o papel:
R: _Não deixe {ele|ela} sozinh{o|a}._
Fechei o diário. Lá fora, a neblina tinha engrossado tanto que a janela parecia pintada de branco.
{Heitor|Helena} não cuidava da casa. Fazia parte dela.
@vai dia2_menu

# d2_retratos
@set tempo-=1, foto=1
@cena sala preto
@fx poeira
@ambiente casa
De dia, a sala parecia menor e mais cansada. A luz cinzenta entrava pelas cortinas e mostrava a poeira dançando no ar.
As paredes eram cobertas de retratos. Homens de bigode, mulheres de gola alta, crianças sérias demais para a idade.
O maior deles, em cima da lareira, era de um homem de farda escura e olhar duro. Uma plaquinha de latão dizia: _Cel. Joaquim Amarante, 1888._
Alguém tinha raspado os olhos dele da tela. Com uma faca, pelo jeito.
Numa cômoda, entre porta-retratos menores, uma fotografia me fez parar.
@cena retrato
Uma festa de São João. Bandeirinhas de papel, uma fogueira desfocada ao fundo.
Uma moça de tranças, rindo, que só podia ser a vó Rosa aos dezenove anos.
E, ao lado dela, com a mesma roupa, a mesma medalhinha e o mesmo meio sorriso cansado...
{Heitor|Helena}.
Igualzinh{o|a}. Nem um dia mais velh{o|a}.
Atrás da foto, na letra da minha avó: _Rosa e {Heitor|Helena}. São João, 23/06/1974. A última noite._
@cena sala
Guardei a foto no bolso do casaco. Não sei bem por quê.
Talvez para ter certeza, mais tarde, de que eu não tinha imaginado.
@vai dia2_menu

# dia2_fim
@set pistas=foto+diario+cidaHistoria
@cena fachada preto
@ambiente vento
@fx neblina
O sol se pôs atrás da serra às cinco e quarenta.
Às cinco e quarenta e um, ouvi o piano.
@vai noite2

# noite2
@titulo Segunda noite | Valsa da Névoa
@cena sala
@fx poeira
@ambiente nada
@musica valsa
@mostra li sorriso
{Heitor|Helena} estava ao piano, como na primeira noite. Dessa vez, não parou de tocar quando entrei.
L: Achei que você ia passar o dia na cidade. Ou pegar o ônibus das seis.
E: Pensei nisso.
@expr li neutro
L: E?
E: E estou aqui.
@expr li sorriso
{Ele|Ela} sorriu sem tirar os olhos das teclas.
@se pistas>=1 -> n2_saber
@vai n2_convite

# n2_saber
Eu sabia coisas que {ele|ela} não sabia que eu sabia. O peso disso estava no bolso, na cabeça, em tudo.
> Mostrar a foto de São João de 1974. -> n2_foto [se foto]
> Contar o que Dona Cida disse sobre 1974. -> n2_cida [se cidaHistoria]
> Contar que li o diário da vó Rosa. -> n2_diario [se diario]
> Não dizer nada, por enquanto. -> n2_convite

# n2_foto
@musica nada
Coloquei a foto em cima do piano, ao lado das mãos {dele|dela}.
A música parou.
@expr li triste
{Ele|Ela} ficou olhando a fotografia por muito tempo. Tocou a imagem da Rosa com a ponta dos dedos.
L: Ela estava tão bonita naquela noite.
L: Então você já sabe.
@vai n2_revelacao

# n2_cida
@musica nada
E: {Heitor|Helena} Duarte. Pianista, do Rio. Sumiu na noite de São João de 1974.
A música parou.
@expr li triste
L: A Cida ainda lembra de mim.
L: Ela usava uma trança só, comprida, e roubava doce da cozinha da pensão.
L: Então você já sabe.
@vai n2_revelacao

# n2_revelacao
L: Eu não envelheço, {nome}. Não saio desta casa. Já nem lembro direito do gosto do café.
L: A Dona Rosa me pediu pra não te contar logo. Disse que você ia fugir.
@expr li medo
L: Você... tem medo de mim?
> "Não tenho." -> n2_semmedo {afeto+=1}
> "Tenho. Mas eu fiquei." -> n2_commedo {afeto+=1}
> "Ainda não sei." -> n2_pensar

# n2_semmedo
@expr li sorriso
L: Mentira. Mas {obrigado|obrigada} por mentir.
@vai n2_convite_saber

# n2_commedo
@expr li sorriso
L: Isso é bom. Quem não tem medo desta casa não está prestando atenção.
@vai n2_convite_saber

# n2_pensar
@expr li triste
L: É justo.
@vai n2_convite_saber

# n2_diario
@musica nada
E: Eu li o diário da vó Rosa.
As mãos {dele|dela} pararam em cima das teclas.
@expr li medo
L: Ela escreveu tudo, não escreveu?
L: Então você sabe o que ele me pede. Toda noite, do outro lado daquela porta.
{Ele|Ela} fechou a tampa do piano devagar.
L: Eu nunca faria isso com você, {nome}.
@expr li triste
L: ...Eu acho que nunca faria. Cinquenta e dois anos é muito tempo. Eu não sei mais direito quem eu sou.
> "Eu acredito em você." -> n2_acredito {afeto+=2, confia=1}
> "Como eu posso ter certeza?" -> n2_duvido

# n2_acredito
{Ele|Ela} me olhou como se eu tivesse dito uma coisa impossível.
L: Ninguém acredita em mim desde 1974. Nem eu.
@expr li sorriso
L: {Obrigado|Obrigada}.
@vai n2_convite_saber

# n2_duvido
L: Não pode. Essa é a parte mais difícil.
L: Eu também não posso ter certeza de você.
@vai n2_convite_saber

# n2_convite_saber
@musica valsa
{Ele|Ela} abriu de novo o piano e tocou as primeiras notas da valsa, mais leves agora.
@vai n2_convite

# n2_convite
@expr li sorriso
L: Dança comigo?
L: Ninguém dança comigo desde...
@expr li triste
L: Faz tempo.
> Aceitar a dança. -> n2_danca {afeto+=1}
> "Eu não sei dançar valsa." -> n2_naosei

# n2_naosei
@expr li sorriso
L: Ninguém sabe, no começo.
L: É só contar até três e confiar em quem está conduzindo.
@vai n2_danca

# n2_danca
@set dancou=1
@musica valsa
{Ele|Ela} estendeu a mão. Eu segurei.
Era fria. Não gelada como no porão, mas fria como a mão de alguém que acabou de entrar da chuva.
Um, dois, três. Um, dois, três.
Pisei no pé {dele|dela} duas vezes. Na terceira volta, já não pisava mais.
A sala girava devagar: os retratos, as velas, as cortinas vermelhas, o rosto {dele|dela} perto do meu.
Foi só no segundo giro que percebi.
O piano continuava tocando.
As teclas afundavam e voltavam, uma a uma, sem ninguém no banco.
@expr li neutro
L: Não olha pra ele.
L: Olha pra mim.
E eu olhei. E, por alguns minutos, esqueci o porão, a carta, a cidade parada no tempo.
@musica nada
@som nota
A valsa parou no mesmo lugar de sempre. Uma nota antes do fim.
L: Sempre aqui. Sempre essa nota que falta.
@vai n2_jardim

# n2_jardim
@cena jardim preto
@ambiente noite
@fx neblina
@mostra li neutro
Saímos para o jardim. A chuva tinha parado, e o céu abria um buraco redondo para a lua.
Vaga-lumes acendiam e apagavam entre as hortênsias, como velas pequenas que ninguém precisa vigiar.
L: Sabe do que eu sinto mais falta?
L: Do frio. Do frio de verdade, de bater o queixo. Agora eu só sinto o frio de dentro.
L: E do pão de queijo da Santa Luzia. A Cida roubava da fornada pra mim.
@expr li sorriso
L: E você? Tem alguém te esperando lá na capital?
> "Ninguém." -> n2_ninguem {afeto+=1}
> "Não sei se eu quero voltar." -> n2_ficar {afeto+=1, querFicar=1}
> "Tenho minha vida lá. Meu trabalho, minhas coisas." -> n2_vida

# n2_ninguem
@expr li triste
L: Então somos duas solidões.
@expr li sorriso
L: Dizem que duas solidões juntas viram outra coisa.
@vai n2_quase

# n2_ficar
@expr li neutro
L: Não diz isso tão rápido. Esta casa escuta.
@expr li sorriso
L: ...Mas eu gostei de ouvir.
@vai n2_quase

# n2_vida
@expr li triste
L: Que bom. De verdade.
L: Alguém precisa ter uma vida.
@vai n2_quase

# n2_quase
@se afeto>=3 -> n2_quase_beijo
@vai n2_relogio

# n2_quase_beijo
Ficamos perto. Perto demais. Eu sentia o frio vindo {dele|dela}, como quem fica de pé na frente de uma janela aberta.
{Ele|Ela} levantou a mão e afastou um fio de cabelo do meu rosto. Os dedos tremiam.
L: {nome}, eu...
@vai n2_relogio

# n2_relogio
@som sino
O sino da matriz, lá embaixo, bateu onze e meia.
@expr li medo
L: As velas.
@vai n2_espelho

# n2_espelho
@cena corredor preto
@ambiente casa
@fx nada
@mostra li neutro
Fomos pelo corredor de cima, lado a lado. No fim dele, o espelho grande refletia a luz das arandelas.
Olhei sem querer.
No espelho, só havia uma pessoa andando pelo corredor.
Eu.
Ao meu lado, onde {Heitor|Helena} deveria estar, o espelho mostrava apenas o papel de parede descascado.
@some li
@cena corredor vulto corte
@som susto
@flash
@tremer forte
E atrás de mim, no reflexo, alto demais para caber no corredor, alguma coisa sorria.
@cena corredor corte
@mostra li sombrio
Virei de uma vez.
@expr li neutro
Não havia nada. Só {Heitor|Helena}, me olhando com a testa franzida.
L: O que foi?
Por um instante, um instante só, eu podia jurar que os olhos {dele|dela} tinham ficado brancos.
@set espelho=1
L: Vem. Está quase na hora.
@vai n2_velas

# n2_velas
@cena porao velas=0 preto
@ambiente vento
@fx poeira
Lá embaixo, o ar estava diferente. Uma corrente fria subia por baixo da porta e fazia a poeira dançar.
L: Ele está mais acordado hoje. Cuidado com o vento.
@some li
@velas noite=2 vento=1
@se velas2>=7 -> n2_velas_ok
@vai n2_velas_falhou

# n2_velas_ok
@cena porao velas=7 corte
As sete chamas tremeram, se inclinaram e, por fim, se endireitaram.
Do outro lado da porta, ouvi alguma coisa se arrastar para longe. Contrariada.
@vai n2_fim

# n2_velas_falhou
@set despertou+=1
@cena porao velas=$velas2 corte
@som relogio
A meia-noite chegou antes da última vela.
@som correntes
@tremer forte
As correntes da porta pularam, como se alguém tivesse dado um tranco do outro lado.
H: Quase, sangue da Rosa. Quase.
Acendi as que faltavam com as mãos em pânico. A porta só sossegou na sétima chama.
@cena porao velas=7 corte
@vai n2_fim

# n2_fim
@cena quarto preto
@fx nada
@ambiente chuva
@mostra li neutro
{Heitor|Helena} me acompanhou até a porta do quarto.
@se afeto>=4 -> n2_fim_carinho
L: Boa noite, {nome}.
@vai n2_fim_aviso

# n2_fim_carinho
@expr li sorriso
{Ele|Ela} hesitou um segundo. Depois se inclinou e encostou os lábios na minha testa.
Foi como encostar numa vidraça no inverno. E, mesmo assim, alguma coisa em mim esquentou.
L: Boa noite, {nome}.
@vai n2_fim_aviso

# n2_fim_aviso
@expr li medo
L: Amanhã vem tempestade. A Dona Rosa dizia que é nas noites de tempestade que ele acorda mais fácil.
L: Se você for embora amanhã... eu vou entender.
@some li
@vai dia3

# dia3
@musica nada
@titulo Terceiro dia | Tempestade
@cena sala
@ambiente vento
@fx poeira
Acordei com o céu da cor de chumbo. As nuvens desciam pela serra tão baixas que engoliam a torre da matriz.
Na sala, em cima do piano, havia uma folha de partitura que não estava ali na noite anterior.
A tinta ainda parecia fresca.
_Valsa da Névoa. Para {nome}._
A última pauta estava em branco.
@som porta
Às quatro da tarde, bateram na porta.
@cena fachada preto
@fx neblina
@mostra cida neutro
C: Vim te buscar.
Dona Cida estava no portão, com um guarda-chuva preto e uma sacola de pão. Os olhos vermelhos de quem não dormiu.
C: Sonhei com a Rosa essa noite. Ela estava em pé na escada do porão e não parava de repetir o seu nome.
@expr cida medo
C: O ônibus das seis, criança. Pega ele. Hoje.
@se cidaConfia && !diario -> d3_cida_pagina
@vai d3_escolha

# d3_cida_pagina
@set diario=1, paginaCida=1
@expr cida triste
C: Mas você me prometeu cuidar das velas. E gente de palavra não vai embora fácil.
Ela tirou da sacola uma folha dobrada em quatro, amarelada, arrancada de um caderno.
C: A Rosa me deu isso no mês passado. Disse: "se o sangue ficar, entrega".
R: O contrato do Coronel está dentro do piano, debaixo da tecla que não toca.
R: O trato se desfaz com o sangue Amarante e a mão de quem foi levado, juntos, queimando o contrato na chama da sétima vela. Diante da porta aberta.
R: Eu nunca tive coragem. Talvez você tenha.
C: Eu não sei o que isso quer dizer. E não quero saber.
@vai d3_escolha

# d3_escolha
@expr cida neutro
C: Seis horas, na praça. Eu espero até o ônibus sair.
@some cida
O vento arrancou um punhado de pétalas das hortênsias e jogou contra a janela.
Eu tinha duas horas para decidir.
> Pegar o ônibus das seis. -> final_onibus
> Ficar mais uma noite. -> noite3

# final_onibus
@cena vila preto
@ambiente chuva
@fx chuva
@som sino
Fiz a mala em dez minutos. Não olhei para o piano quando passei pela sala.
Dona Cida me esperava na praça, embaixo do toldo da padaria. Me deu um abraço comprido e um pacote de pão de queijo ainda quente.
@som onibus
O ônibus saiu às seis em ponto.
@cena estrada preto
@fx neblina
Na primeira curva, me virei no banco e olhei para trás.
Lá no alto do morro, no casarão do número 7, uma janela estava acesa. Uma luz amarela, trêmula.
Fiquei olhando até a neblina engolir a casa.
Antes disso, a luz se apagou.
@ambiente nada
@musica caixinha
Nunca mais voltei a São Bento do Sereno. Vendi a casa por telefone, pelo preço que deram.
Às vezes, em noites de neblina, ouço uma valsa no apartamento vizinho. Ela sempre para no mesmo lugar, uma nota antes do fim.
Nunca tive coragem de perguntar quem toca.
@final onibus

# noite3
@some todos
@titulo Terceira noite | Sete velas
@cena sala escuro
@ambiente tempestade
@fx chuva
Dona Cida esperou na praça até as seis e dez. Da janela, vi o farol do ônibus descendo a serra sem mim.
A tempestade chegou com a noite. Às dez horas, um raio caiu em algum lugar perto da matriz e a luz da cidade inteira apagou.
@relampago
Fiquei na sala, com uma vela acesa em cima do piano, esperando.
@musica tensao
@som batida
As batidas começaram às onze. Não vinham só do porão. Vinham das paredes, do teto, do chão. A casa inteira batia, como um coração.
@relampago
@mostra li medo
No clarão de um relâmpago, {Heitor|Helena} estava no meio da sala.
L: Ele acordou, {nome}. Antes da hora. A tempestade...
@some li
@cena porao velas=7 preto
@fx nada
Corremos até a escada do porão. As sete velas ainda estavam acesas.
@som vela
@cena porao velas=5 corte
Duas se apagaram de uma vez, com um sopro que veio de dentro da porta.
@som vela
@cena porao velas=3 corte
Depois mais duas.
H: Sangue da Rosa...
H: Finalmente.
@mostra li medo
@se afeto>=4 -> n3_confissao
@vai n3_tentacao

# n3_confissao
@expr li triste
{Heitor|Helena} segurou meus dois braços. As mãos {dele|dela} tremiam.
L: {nome}, eu preciso te contar uma coisa. Antes de qualquer outra.
L: Ele me prometeu. Todas as noites, durante anos. Que, se eu trouxesse alguém do sangue até a porta, eu podia ir embora. Sentir o sol de novo. Morrer direito, como todo mundo.
L: Na primeira noite, quando você chegou... eu pensei em fazer isso. Juro que pensei.
@se ouviu -> n3_conf_ouviu
@se chamou -> n3_conf_chamou
@vai n3_conf_resto

# n3_conf_ouviu
L: Mas aí você ficou lá, em silêncio, ouvindo a minha valsa até o fim. Ninguém nunca tinha feito isso.
@vai n3_conf_resto

# n3_conf_chamou
L: Mas aí você chamou o meu nome, no escuro, com medo. O meu. Fazia cinquenta anos que ninguém me chamava.
@vai n3_conf_resto

# n3_conf_resto
L: Eu não consigo. Eu não quero.
L: Eu gosto de você, {nome}. Do jeito mais bobo e impossível que alguém pode gostar de outra pessoa.
@set confessou=1
@se diario -> n3_plano
@vai n3_sem_saida

# n3_tentacao
@expr li sombrio
{Heitor|Helena} não estava olhando para mim. Estava olhando para a porta.
L: Vem comigo, {nome}.
L: Lá embaixo. Ele só quer conversar.
A voz era {dele|dela}, mas não era. Tinha outra coisa por baixo, como um eco atrasado.
@relampago
No clarão, vi os olhos {dele|dela}. Brancos. Inteiramente brancos.
L: Cinquenta e dois anos, {nome}. Você não sabe o que é isso. Por favor. É só abrir a porta.
> Seguir {li} até a porta. -> final_porta
> Fugir da casa no meio da tempestade. -> final_fuga
> "Eu sei o que ele te prometeu. A Rosa escreveu tudo." -> n3_resgate [se diario]
> "Eu sei quem você é, {li}. E não é isso." -> n3_resgate2 [se pistas>=2 && !diario]

# n3_resgate
E: E eu sei como acabar com isso. Sem ninguém precisar descer de mão dada com ele.
@tremer
{Heitor|Helena} se curvou como se tivesse levado um soco.
@expr li triste
Quando levantou o rosto, os olhos eram {dele|dela} de novo. Escuros, molhados, assustados.
L: Desculpa. Desculpa, {nome}. Eu não sou isso. Eu não quero ser isso.
@set afeto+=2, confessou=1
@vai n3_plano

# n3_resgate2
E: Você é a pessoa que tocava piano pra cidade inteira ouvir. Que a Cida e a Rosa amavam.
@tremer
@expr li triste
{Ele|Ela} piscou. Uma, duas vezes. Os olhos voltaram a ser escuros.
L: Desculpa. Por um momento eu não estava aqui.
@set confessou=1
@vai n3_sem_saida

# n3_sem_saida
@expr li triste
L: Não tem como me tirar daqui, {nome}. A Rosa procurou a vida inteira.
@som batida
@tremer
A porta do porão estremeceu nas correntes.
L: Ele não vai parar. Não com você aqui. Vai embora, enquanto ainda tem vela acesa.
> "Então eu fico. Com você. Do jeito que for." -> final_eterna
> "Vem comigo. A gente tenta sair daqui." -> n3_tentar_sair

# n3_tentar_sair
@some li
@cena fachada preto
@ambiente tempestade
@fx chuva
Puxei {Heitor|Helena} pela mão, pela cozinha, pela sala, pela porta da frente, pelo jardim afogado de chuva.
No portão, a mão {dele|dela} escapou da minha.
@mostra li triste
{Ele|Ela} estava {parado|parada} do lado de dentro, a um passo da calçada. Tentou atravessar. A chuva passava através {dele|dela}.
L: Eu não consigo. Eu nunca consegui.
L: Vai, {nome}. Por favor. Antes que ele acorde de vez.
@vai final_estrada

# n3_plano
E: O contrato do Coronel. A Rosa escondeu no piano. Debaixo da tecla que não toca.
@expr li medo
L: No piano...?
L: Cinquenta e dois anos eu toquei em cima disso.
@some li
@cena sala escuro preto
@fx nada
@mostra li neutro
Subimos correndo. {Heitor|Helena} se sentou ao piano no escuro e tocou a valsa até a última parte, até o lugar onde ela sempre parava.
@som tecla
A tecla afundou sem som nenhum. Um baque oco, de madeira.
L: É essa. Sempre foi essa. A nota do final.
Arrancamos a tampa do teclado com as mãos. Embaixo da tecla muda, enrolado e amarrado com uma fita de cetim, havia um papel grosso e amarelado.
Escrito numa tinta marrom que não era tinta.
_Eu, Joaquim Amarante, entrego ao Hóspede uma alma do meu sangue a cada geração, em troca do ouro desta terra..._
@som vela
@musica nada
Lá embaixo, a última vela se apagou.
Silêncio absoluto. Nem a chuva se ouvia mais.
@som correntes
Depois, devagar, as correntes começaram a cair.
@expr li medo
L: Diante da porta aberta. Foi o que ela escreveu, não foi?
> Descer com {li}, agora. -> n3_ritual
> "E se der errado?" -> n3_duvida

# n3_duvida
@expr li sorriso
L: Então pelo menos eu não vou ter passado a eternidade sem tentar.
L: E vou ter dançado uma valsa com você. Já é mais do que eu tinha.
@vai n3_ritual

# n3_ritual
@some li
@cena porao velas=0 preto
@musica tensao
@fx poeira
A escada estava escura como um poço. As sete velas, apagadas, ainda soltavam fumaça.
As correntes estavam no chão. A porta, entreaberta, respirava.
@mostra li medo
L: As velas primeiro. Ele não sai enquanto elas estiverem acesas.
L: Rápido, {nome}.
@some li
@vai n3_velas

# n3_velas
@velas noite=3 vento=2
@se velas3>=7 -> n3_porta
@cena porao velas=$velas3 corte
@som correntes
@tremer forte
H: Tão devagar, sangue da Rosa. Tão devagar.
A porta se abriu mais um palmo. Um frio de túmulo subiu pela escada.
@mostra li medo
L: De novo! Eu seguro a porta!
@some li
@vai n3_velas

# n3_porta
@cena porao velas=7 corte
As sete chamas se ergueram ao mesmo tempo, altas e brancas.
@cena porao velas=7 aberta corte
@som porta
E a porta se abriu de vez.
@cena hospede corte
@som susto
@flash
@tremer forte
Ele era alto demais para o porão. Feito de fumaça e de escuro, com dedos compridos como galhos secos e dois olhos pálidos, sem pupila.
H: Sangue da Rosa.
H: Você veio me dar o que é meu.
@mostra li medo
{Heitor|Helena} parou ao meu lado e segurou minha mão. A mão {dele|dela} estava gelada. A minha também.
Furei o dedo na ponta enferrujada do cadeado. Uma gota escura caiu sobre o contrato.
H: Meu bem...
Era de novo a voz da vó Rosa. Doce. Cansada. Exatamente como na carta.
H: Meu bem, não faz isso com a vó. Ele protegeu esta família por mais de cem anos.
> Queimar o contrato na chama da sétima vela. -> final_luz
> Hesitar. A voz é tão parecida com a dela... -> n3_hesita

# n3_hesita
@expr li triste
L: {nome}. Olha pra mim. Não pra ele.
L: A Rosa passou cinquenta e dois anos acendendo vela para essa coisa não sair. Ela nunca ia te pedir isso.
H: Meu bem...
> Queimar o contrato na chama da sétima vela. -> final_luz

# final_luz
@some todos
Segurei o contrato sobre a sétima vela. {Heitor|Helena} pôs a mão por cima da minha.
Por um segundo, senti a mão {dele|dela} quente.
@flash
O papel pegou fogo com uma chama azul.
@som susto
@tremer forte
O Hóspede gritou. Gritou com todas as vozes que tinha roubado em cento e trinta e oito anos: homens, mulheres, crianças, a voz da minha avó, a minha própria voz.
@flash
As sete velas viraram sete colunas de fogo branco.
@cena preto corte
@musica nada
@ambiente nada
@fx nada
E então, nada.
@espera 2
Nem chuva. Nem vento. Nem batida.
Só o cheiro de cera, e a mão {dele|dela} ainda na minha.
@cena amanhecer preto
@musica amanhecer
@mostra li sorriso
O sol nasceu às seis e doze.
Estávamos na varanda, no degrau de madeira, ombro com ombro, vendo a neblina se desfazer no vale.
{Heitor|Helena} estendeu a mão para a luz. Ficou olhando os próprios dedos como se nunca os tivesse visto.
L: Eu estou sentindo o sol, {nome}.
L: Está quente.
Encostei minha mão na {dele|dela}. Não estava fria. Pela primeira vez, não estava fria.
L: Eu posso ir agora. Eu sinto isso. Como uma porta aberta, bem atrás de mim.
@expr li triste
E: Então vai. Você esperou tempo demais.
@expr li sorriso
L: Ainda não.
L: Se você deixar, eu fico mais um pouco. Quero ver mais umas mil manhãs como esta. Com você.
E então {ele|ela} me beijou, e o beijo tinha gosto de café e de manhã de inverno.
@some li
Um ano depois, o casarão da Rua do Rosário virou pousada.
Dona Cida fornece o pão de queijo. Diz que é a única pousada da serra onde tem coragem de dormir.
Toda tarde, quando o sol se põe, quem está na sala ouve um piano tocando uma valsa.
A _Valsa da Névoa_ agora tem um final. Escrevemos a quatro mãos.
@final luz

# final_eterna
@expr li medo
L: Não. {nome}, não...
E: Eu fico. A Rosa passou cinquenta e dois anos do seu lado sem poder te tocar. Eu posso fazer melhor que isso.
@some li
@cena porao velas=0 aberta preto
@fx nada
Desci os doze degraus com {Heitor|Helena} atrás de mim, chamando meu nome.
Abri a porta.
@cena hospede corte
@som susto
@flash
H: Sangue da Rosa. De livre vontade.
E: Pode me levar. Mas deixa {ele|ela} comigo.
O Hóspede riu, e o riso tinha cem vozes.
H: Uma alma do sangue, entregue de livre vontade, me alimenta por cem anos.
H: Pode ficar com o seu fantasma. Vocês têm todo o tempo do mundo.
@cena preto corte
@musica nada
@ambiente nada
Senti frio. Um frio que começou nos dedos e foi subindo, devagar, sem pressa, até não sobrar nada em mim que não fosse frio.
@espera 2
@cena sala preto
@musica valsa
@mostra li triste
Quando abri os olhos, estava na sala. As velas acesas. A chuva tinha parado.
{Heitor|Helena} estava ao piano, chorando sem lágrimas.
L: Você não precisava.
E: Precisava.
Estendi a mão. A minha mão agora era fria como a {dele|dela}. E, pela primeira vez, a {dele|dela} não me pareceu fria nenhuma.
@expr li sorriso
L: Dança comigo?
Na cidade, dizem que o casarão do número 7 é assombrado.
Em noites de neblina, quem passa pela Rua do Rosário vê, pela janela da sala, duas sombras dançando uma valsa que nunca termina.
Dona Cida sobe o morro toda tarde. Deixa dois pães de queijo em cima do piano e conversa um pouco com a sala vazia.
Às vezes, a sala responde com uma valsa.
@final eterna

# final_estrada
@some todos
@cena estrada preto
@ambiente chuva
@fx neblina
@musica caixinha
Andei a noite inteira debaixo de chuva, até a estrada da serra. Peguei carona com um caminhoneiro que não fez nenhuma pergunta.
Antes da última curva, olhei para trás.
O casarão estava escuro. Mas, numa janela do segundo andar, havia sete pontinhos de luz.
Sete velas. Alguém tinha acendido de novo.
@cena preto corte
@fx nada
Nunca vendi a casa. Pago os impostos todo ano, e Dona Cida manda notícias: o jardim continua bonito. As hortênsias nunca morrem.
E toda noite de 23 de junho, onde quer que eu esteja, acendo sete velas na janela.
Para que {ele|ela} saiba que alguém lembra.
@final estrada

# final_fuga
@some todos
@cena fachada preto
@ambiente tempestade
@fx chuva
@som susto
@flash
Corri. Pela cozinha, pela sala, pela porta da frente, pelo jardim inundado.
Atrás de mim, {Heitor|Helena} gritava o meu nome. Primeiro com a voz {dele|dela}. Depois com a voz da minha avó. Depois com a minha.
Não olhei para trás.
@cena vila preto
Esmurrei a porta da padaria até Dona Cida abrir, de camisola e terço na mão. Passei a noite na cozinha dela, de olhos abertos, ouvindo a chuva.
@cena estrada preto
@ambiente vento
@fx neblina
Peguei o primeiro ônibus da manhã.
@cena preto corte
@fx nada
@musica tensao
Dois meses depois, chegou uma carta de Dona Cida.
O casarão tinha pegado fogo numa noite de tempestade. Ninguém soube explicar como: a luz da cidade estava cortada, e a casa estava vazia.
Os bombeiros encontraram só cinzas. Cinzas, e uma escada de pedra que descia para um porão.
A porta lá embaixo estava aberta. As correntes, arrebentadas.
E as sete velas, apagadas.
@final fuga

# final_porta
@musica tensao
Segui {Heitor|Helena} escada abaixo. Cada degrau mais frio que o outro.
@some li
@cena porao velas=0 preto
@som correntes
As correntes caíram sozinhas antes de chegarmos lá embaixo. As velas se apagaram juntas, num único sopro.
@cena porao velas=0 aberta corte
{Ele|Ela} abriu a porta para mim.
@cena hospede corte
@som susto
@flash
@tremer forte
H: Sangue da Rosa. Finalmente.
@mostra li triste
Na última luz que sobrou, vi o rosto {dele|dela}. Os olhos tinham voltado ao normal. Estavam cheios de lágrimas.
L: Desculpa. Desculpa. Desculpa...
@cena preto corte
@some todos
@ambiente nada
@musica nada
@espera 2
@cena sala escuro preto
@musica valsa
{Heitor|Helena} não está mais aqui. Foi embora naquela noite, como ele tinha prometido.
O casarão foi vendido no ano seguinte. Uma família da capital, com duas crianças.
Eles não sabem das velas. Ninguém contou.
Eu tento avisar. Toco piano toda noite, a mesma valsa, para ver se alguém desce para ouvir. Para ver se alguém pergunta.
Ainda não sei o final.
@final porta
`;
