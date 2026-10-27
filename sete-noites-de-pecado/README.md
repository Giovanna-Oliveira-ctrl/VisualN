# Sete Noites de Pecado

*Seven Nights of Sin*: uma visual novel de dark romance, mistério psicológico e dark academia, feita com HTML, CSS e JavaScript puros. Roda no navegador, no computador, no tablet e no celular, sem instalar nada.

> Em Bellgrave, uma cidade antiga cercada por um lago e por florestas, uma bolsista chega à Universidade de Saint Agnes. Na primeira noite, recebe um convite para uma festa clandestina: *"Sete noites. Sete pecados. Uma verdade que ninguém merece conhecer."* O convite está assinado por Anne Voss, uma moça que desapareceu há sete anos.

Esta é a **primeira versão jogável**: prólogo e Capítulo 1 (*A Festa das Máscaras*), com cerca de 20 minutos por partida.

---

## Como jogar no seu computador

**Jeito mais simples:** abra a pasta `sete-noites-de-pecado` e dê dois cliques em `index.html`. O jogo abre no navegador.

- Funciona sem internet. Só as fontes (Bodoni Moda e Spectral) vêm do Google Fonts; sem internet, o navegador usa fontes parecidas.
- O progresso fica salvo no próprio navegador. Se você abrir em outro navegador ou em uma janela anônima, ele começa do zero.

**Se preferir um servidor local** (útil quando for colocar imagens e músicas):

```
cd sete-noites-de-pecado
python3 -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador. No VS Code, a extensão *Live Server* faz o mesmo com um clique.

## Controles

| Ação | Mouse ou toque | Teclado |
| --- | --- | --- |
| Avançar o texto | Clicar na caixa de diálogo, no cenário ou em **Avançar** | `Espaço`, `Enter` ou `→` |
| Mostrar o texto inteiro de uma vez | Clicar enquanto o texto aparece | `Espaço` |
| Escolher uma opção | Tocar na opção | Números `1` a `4`, ou `↑` `↓` e `Enter` |
| Menu (salvar, carregar, diário, configurações) | **Menu** no canto superior | `Esc` |
| Histórico das falas | **Histórico**, ou rolar o mouse para cima | `H` |
| Modo automático | **Auto** | `A` |
| Pular o que já foi lido | **Pular** | Segurar `Ctrl` |

## O que já funciona

- **Tela inicial:** Novo jogo, Continuar, Carregar jogo, Configurações e Sobre.
- **Ficha de matrícula:** você escolhe o nome da protagonista (o padrão é Clara).
- **Diálogos:** nome de quem fala, texto que aparece aos poucos (ou de uma vez), indicador de "escrevendo" e de "pode avançar", botão Avançar, clique na caixa para continuar.
- **Pular:** passa só pelo texto que você já leu. Para sozinho quando chega em algo novo; dá para mudar isso em Configurações.
- **Auto:** avança sozinho, com pausa ajustável.
- **Escolhas:** registradas no Diário. Mudam falas, cenas, afinidade e o que acontece depois.
- **Afinidade:** Lucien, Dorian, Elias, Cassian e Adrian têm afinidade própria, que sobe e desce. Ela decide quem segura a sua mão no escuro e com quem é a cena romântica do fim do capítulo. O jogo avisa quando alguém "vai se lembrar disso"; o aviso pode ser desligado.
- **Rotas:** quatro rotas principais e a rota secreta de Adrian, já preparadas em `story/routes.js`. A rota será decidida no Capítulo 3.
- **Mistério:** documentos encontrados (convite, fotografia, livro de hóspedes...) ficam guardados no Diário, junto com as relações, as escolhas feitas e a galeria de finais.
- **Finais:** um final ruim já existe (*A Recusa*). Os outros nove estão planejados e aparecem trancados na galeria.
- **Salvamento:** automático a cada escolha e a cada capítulo, mais 8 espaços manuais. Continuar, carregar e reiniciar a história.
- **Configurações:** velocidade do texto, texto instantâneo, tamanho do texto, volume geral, de música e de efeitos, desligar música ou efeitos, reduzir animações, alto contraste.
- **Celular e tablet:** layout que se ajusta à tela, botões grandes para toque e áreas seguras de iPhone respeitadas.
- **Som:** músicas, ambientes (chuva, lago, festa, fogo...) e efeitos são gerados no próprio navegador. Nenhum arquivo de áudio é necessário.

## Como testar cada parte

1. **Novo jogo e nome:** clique em Novo jogo, troque o nome e comece. O nome aparece nas falas.
2. **Escolhas e afinidade:** no Capítulo 1, dance com a máscara dourada e escolha "Apertar a mão dele". Aparece o aviso "Lucien vai se lembrar disso." Abra **Menu → Diário → Relações** para ver os medidores.
3. **Rotas diferentes:** jogue de novo dando atenção a outro personagem. A cena romântica do fim do capítulo muda.
4. **Rota secreta:** à meia-noite, quando as velas apagam, siga a figura até a galeria de espelhos.
5. **Final ruim:** na manhã do Capítulo 1, escolha queimar o convite.
6. **Salvar e carregar:** Menu → Salvar → escolha um espaço. Feche a página, abra de novo e use Carregar jogo.
7. **Continuar:** feche no meio de um capítulo, abra de novo e clique em Continuar. O jogo volta à última escolha.
8. **Pular:** comece um novo jogo e aperte Pular. Ele passa rápido pelo prólogo e para na primeira escolha ou no primeiro texto novo.
9. **Acessibilidade:** em Configurações, ligue Texto instantâneo, Alto contraste e Reduzir animações.
10. **Celular:** abra no celular, ou no computador aperte `F12` e ative a visão de celular do navegador.

## Onde está cada coisa

```
sete-noites-de-pecado/
├── index.html            a página do jogo (todas as telas)
├── css/
│   ├── style.css         visual da interface (cores, caixa de diálogo, menus)
│   └── scenes.css        visual e animações dos cenários e personagens provisórios
├── js/                   a lógica do jogo
│   ├── main.js           o motor: executa o roteiro, salva, carrega, teclado e toque
│   ├── dialogue.js       caixa de diálogo, texto aparecendo, histórico, Auto e Pular
│   ├── choices.js        tela de escolhas
│   ├── state.js          afinidade, flags e escolhas da partida; condições do roteiro
│   ├── save.js           salvamento no navegador (localStorage)
│   ├── script.js         lê o roteiro dos capítulos
│   ├── stage.js          cenário, personagens em cena e efeitos de tela
│   ├── menus.js          tela inicial, menu, diário, configurações, sobre
│   ├── audio.js          música e efeitos sonoros
│   ├── characters.js     personagens: nomes, cores, descrições e imagens
│   ├── scenes.js         cenários: receitas da arte provisória e imagens
│   └── art.js            desenha cenários e personagens provisórios (SVG)
├── story/                a história (é aqui que você mais vai mexer)
│   ├── chapters.js       os 7 capítulos, pecados e epígrafes
│   ├── prologue.js       roteiro do prólogo (com o manual do formato no topo)
│   ├── chapter1.js       roteiro do Capítulo 1
│   ├── documents.js      cartas, fotos e bilhetes
│   └── routes.js         rotas românticas e lista de finais
├── assets/               imagens, músicas e sons de verdade (vazias por enquanto)
│   ├── backgrounds/  characters/  music/  sounds/  ui/
└── scripts/              ferramentas de conferência e publicação
```

## Como mexer na história

O roteiro é escrito como uma peça de teatro, em `story/prologue.js` e `story/chapter1.js`. O manual completo está no topo de `story/prologue.js`. Um exemplo:

```
# biblioteca_noite
@cena biblioteca
@mostra elias sorriso centro
elias: Eu sabia que você ia achar este lugar.
Narração: tudo o que não tem nome antes dos dois-pontos.
> "Por que você está aqui?" -> elias_porque {elias+1}
> Ir embora sem responder. -> sair {elias-1, fugiuElias}
> Mostrar a fotografia. -> elias_foto [se sabeQueEstava]
```

- `elias+1` aumenta a afinidade. `fugiuElias` liga uma flag que você pode testar depois com `@se fugiuElias -> rotulo`.
- `[se sabeQueEstava]` faz a opção aparecer só se a flag existir.

**Depois de editar, rode o verificador** (precisa do Node.js e do Playwright):

```
node scripts/verificar-roteiro.js
```

Ele avisa se algum rótulo não existe, se algum trecho não termina, se um nome de cenário ou de som está errado e se algum caminho fica sem fim.

### Adicionar o Capítulo 2

1. Copie `story/chapter1.js` como `story/chapter2.js`, troque `id: 'cap1'` por `id: 'cap2'` e escreva o roteiro começando com `# cap2` e `@capitulo cap2` e terminando com `@fim_capitulo cap2`.
2. No `index.html`, logo depois de `<script src="story/chapter1.js"></script>`, adicione `<script src="story/chapter2.js"></script>`.
3. Em `story/chapters.js`, mude `disponivel: false` para `disponivel: true` no Capítulo 2.

Pronto: o fim do Capítulo 1 passa a levar ao Capítulo 2, e quem salvou no fim do Capítulo 1 continua de lá.

### Trocar a arte provisória por imagens

- **Cenários:** coloque a imagem em `assets/backgrounds/` (de preferência 1920×1080) e escreva o caminho no campo `imagem` do cenário em `js/scenes.js`. Exemplo: `imagem: 'assets/backgrounds/biblioteca.jpg'`.
- **Personagens:** coloque imagens com fundo transparente (PNG, proporção 2:3) em `assets/characters/` e preencha `imagens` em `js/characters.js`. Exemplo: `imagens: { neutro: 'assets/characters/lucien-neutro.png', sorriso: 'assets/characters/lucien-sorriso.png' }`.
- **Música e sons:** coloque os arquivos em `assets/music/` ou `assets/sounds/` e escreva o caminho em `ARQUIVOS_DE_AUDIO`, no topo de `js/audio.js`.

Use apenas imagens e sons que você criou ou que têm licença para uso. O jogo usa a arte provisória para tudo o que ainda não tiver arquivo, então dá para trocar aos poucos.

## Publicar na web

**GitHub Pages (grátis):**

1. No GitHub, abra o repositório e vá em **Settings → Pages**.
2. Em *Build and deployment*, escolha *Deploy from a branch*, selecione a branch e a pasta `/ (root)` e salve.
3. Em alguns minutos o jogo estará em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/sete-noites-de-pecado/`.

**Netlify Drop:** arraste a pasta `sete-noites-de-pecado` para [app.netlify.com/drop](https://app.netlify.com/drop).

**Um arquivo só:** `python3 scripts/montar-pagina-unica.py sete-noites.html` junta tudo num único `.html`, fácil de mandar para alguém.

## Próximas etapas

- Capítulos 2 a 7, um por noite e por pecado: Inveja, Avareza, Ira, Luxúria, Preguiça e Soberba.
- Escolha de rota no Capítulo 3 e cenas exclusivas de cada rota.
- Finais românticos, alternativos, ruins, o final verdadeiro e o final secreto de Adrian.
- Arte original de cenários e personagens com expressões, no lugar da arte provisória.
- Música gravada ou composta, se você quiser trocar a sintetizada.
- Galeria de imagens e de músicas desbloqueáveis.
- Tradução para inglês (*Seven Nights of Sin*).
