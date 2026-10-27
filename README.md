# VisualN

Visual novels para o navegador, feitas com HTML, CSS e JavaScript.

| Jogo | Pasta | Estado |
| --- | --- | --- |
| **Sete Noites de Pecado** (*Seven Nights of Sin*): dark romance, mistério psicológico e dark academia, com cinco interesses românticos | [`sete-noites-de-pecado/`](sete-noites-de-pecado/) | Protótipo: prólogo e Capítulo 1 de 7 |
| **Sete Velas**: romance com terror num casarão da serra mineira | raiz do repositório (`index.html`) | Completo: 3 noites e 6 finais |

Para jogar, abra o `index.html` da pasta do jogo no navegador. Cada jogo tem o próprio README com instruções.

---

## Sete Velas

Uma visual novel de romance e terror, feita para o navegador.

Uma pessoa herda um casarão numa cidadezinha de neblina na serra mineira. A avó deixou três instruções: acender sete velas toda noite antes da meia-noite, nunca abrir a porta do porão e ser gentil com quem mora na casa. Na primeira noite, alguém está tocando piano na sala.

- Três noites, cerca de 20 minutos por partida.
- No começo você escolhe o par romântico (Helena ou Heitor). A história é a mesma.
- Seis finais diferentes, que dependem das suas escolhas e das pistas que você encontrar.
- Um minijogo das velas a cada noite.
- Salvamento automático a cada escolha, 6 espaços para salvar, histórico do texto, modo automático e opção de pular texto.
- Trilha e efeitos sonoros gerados no próprio navegador, sem arquivos de áudio. Melhor com fones.

### Como jogar

Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox ou Safari), no computador ou no celular.

- Clique, toque ou aperte espaço para avançar o texto.
- Números escolhem as opções. `Esc` abre o menu, `H` abre o histórico, `A` liga o modo automático e `Ctrl` segurado pula o texto.
- Em **Opções** dá para desligar os flashes de luz e o tremor da tela.

### Arte

Nesta primeira versão, cenários e personagens são pintados por código (`js/pintor.js`). Para trocar qualquer cena ou expressão por uma imagem de verdade:

1. Coloque o arquivo em `arte/cenas/` (cenários, de preferência 1920×1080) ou em `arte/personagens/` (personagens com fundo transparente, proporção 2:3).
2. Escreva o caminho em `arte/arte.js`. Os nomes aceitos estão explicados no próprio arquivo.

O jogo usa a imagem quando ela existe e a pintura por código quando não existe, então dá para trocar aos poucos.

### Onde está cada coisa

| Arquivo | O que tem |
| --- | --- |
| `js/historia.js` | Todo o roteiro: falas, escolhas, condições e finais. O formato está explicado no topo do arquivo. |
| `js/motor.js` | O motor do jogo: texto, escolhas, salvamento, transições, minijogo das velas. |
| `js/pintor.js` | Cenários e personagens desenhados por código. |
| `js/som.js` | Música e efeitos sonoros sintetizados. |
| `css/estilo.css` | Visual da interface. |
| `arte/arte.js` | Lista de imagens prontas que substituem a pintura por código. |
| `scripts/` | Ferramentas de conferência e de publicação (precisam de Node.js e Playwright). |

### Conferir o roteiro depois de editar

```
node scripts/verificar-roteiro.js   # rótulos, saltos e se todos os finais são alcançáveis
node scripts/testar-partida.js      # joga quatro partidas inteiras clicando como uma pessoa
```
