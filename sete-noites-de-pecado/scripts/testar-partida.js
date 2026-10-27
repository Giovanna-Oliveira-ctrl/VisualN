// Joga partidas inteiras de Sete Noites de Pecado no Chromium, clicando como uma pessoa.
// Uso (na pasta do projeto): node scripts/testar-partida.js [pasta-para-capturas-de-tela]
//
// Cada rota prefere opções com certas palavras. No fim, confere se a cena romântica
// foi com o personagem esperado, se o final certo apareceu e se não houve erros.
// Também testa salvar, recarregar a página e carregar o jogo.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROTAS = {
  lucien: { espera: { favorito: 'lucien', fim: 'cap1' }, prefere: ['saudade', 'Que bom que eu não vim', 'Isso foi gentil', 'Rir e pedir', 'medo por mim', 'Guardar segredo', 'mão estendida', 'Apertar a mão dele', 'máscara prateada', 'Por que você está', 'Ficar onde estou', 'gravata'] },
  dorian: { espera: { favorito: 'dorian', fim: 'cap1' }, prefere: ['saudade', 'Bagunçar', 'Mudar de assunto', 'Mostrar o convite para Dorian', 'Prometo', 'terraço', 'Abraçar o Dorian', 'máscara dourada', 'Pisar', 'Ficar onde estou', 'Segurar o rosto'] },
  elias: { espera: { favorito: 'elias', fim: 'cap1', adrian: true }, prefere: ['cara?', 'Aceitar o chá', 'Como você sabe', 'biblioteca e mostrar para Elias', 'máscara prateada', 'Fechar o livro', 'terraço', 'Termina a frase', 'Seguir a figura', 'Entrelaçar'] },
  cassian: { espera: { favorito: 'cassian', fim: 'cap1' }, prefere: ['cara?', 'Ignorar', 'pedir mais', 'parapeito', 'Guardar segredo', 'máscara preta', 'Segurar a mão dele', 'máscara prateada', 'Por que você está', 'Ficar onde estou', 'Me leva até a água'] },
  recusa: { espera: { final: 'A Recusa' }, prefere: ['saudade', 'Quem era ele', 'Palpites', 'Como você sabe o que', 'E você, por que', 'Queimar'] },
};

async function jogar(navegador, nomeRota, rota, pasta) {
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|fonts\.g/.test(m.text())) erros.push(m.text()); });
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await pagina.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await pagina.evaluate(() => localStorage.clear());
  await pagina.reload();
  await pagina.click('#bt-novo');
  await pagina.fill('#campo-nome', 'Iris');
  await pagina.click('#form-nome button[type=submit]');

  let capturas = 0;
  const capturar = async (rotulo) => {
    if (!pasta || capturas > 16) return;
    await pagina.waitForTimeout(900);
    await pagina.screenshot({ path: path.join(pasta, `${nomeRota}-${String(capturas++).padStart(2, '0')}-${rotulo}.png`) });
  };

  const escolhas = [];
  let falas = 0;
  let salvouTeste = false;
  for (let passo = 0; passo < 4000; passo++) {
    const modo = await pagina.evaluate(() => window.Jogo.modo);
    if (modo === 'fala') {
      falas++;
      if ([2, 30, 80, 140, 200].includes(falas)) await capturar('fala');
      // Teste de salvar e carregar, uma vez, no meio da partida.
      if (falas === 60 && !salvouTeste && nomeRota === 'lucien') {
        salvouTeste = true;
        const antes = await pagina.evaluate(() => { window.Jogo.salvar(3); return JSON.stringify({ a: window.Jogo.estado.afinidade, pc: window.Jogo.estado.atual }); });
        await pagina.reload();
        await pagina.click('#bt-carregar');
        await pagina.click('.espaco:has(.espaco-num:text-is("3"))');
        await pagina.waitForFunction(() => window.Jogo.emJogo);
        const depois = await pagina.evaluate(() => JSON.stringify({ a: window.Jogo.estado.afinidade, pc: window.Jogo.estado.atual }));
        if (antes !== depois) erros.push(`Salvar e carregar mudou o estado: ${antes} → ${depois}`);
        else console.log('   salvar → recarregar a página → carregar: OK');
        continue;
      }
      await pagina.evaluate(() => { window.Jogo.avancar(); window.Jogo.avancar(); });
      continue;
    }
    if (modo === 'escolha') {
      const textos = await pagina.$$eval('#escolhas .escolha-texto', (els) => els.map((e) => e.textContent));
      let i = textos.findIndex((t) => rota.prefere.some((p) => t.includes(p)));
      if (i < 0) i = 0;
      escolhas.push(textos[i]);
      if (escolhas.length === 1 || /gravata|rosto|Entrelaçar|água|Seguir a figura/.test(textos[i])) await capturar('escolha');
      await pagina.click(`#escolhas .escolha >> nth=${i}`);
      continue;
    }
    if (modo === 'documento') {
      if (capturas < 6) await capturar('documento');
      await pagina.click('#bt-documento-fechar');
      continue;
    }
    if (modo === 'cartao') {
      if (capturas < 3) await capturar('capitulo');
      await pagina.evaluate(() => window.Jogo.avancar());
      await pagina.waitForTimeout(50);
      continue;
    }
    if (modo === 'espera') { await pagina.evaluate(() => window.Jogo.avancar()); continue; }
    if (modo === 'fim') {
      if (!(await pagina.isHidden('#tela-final'))) break;
      const cap = await pagina.evaluate(() => window.Jogo.estado.capitulo);
      await capturar('fim-' + cap);
      if (cap === 'prologo') { await pagina.click('#bt-proximo-capitulo'); continue; }
      break;
    }
    await pagina.waitForTimeout(80);
  }

  const r = await pagina.evaluate(() => ({
    capitulo: window.Jogo.estado.capitulo,
    favorito: window.Jogo.estado.vars.cenaRomantica,
    adrian: !!window.Jogo.estado.vars.sabeNomeAdrian,
    afinidade: window.Jogo.estado.afinidade,
    docs: window.Jogo.estado.documentos.length,
    final: document.querySelector('#tela-final').hidden ? null : document.querySelector('#final-titulo').textContent,
    fimCap: !document.querySelector('#tela-fim-capitulo').hidden,
  }));
  const e = rota.espera;
  const ok = (e.final ? r.final === e.final : r.fimCap && r.capitulo === e.fim)
    && (!e.favorito || r.favorito === e.favorito)
    && (!e.adrian || r.adrian);
  console.log(`${ok ? 'OK  ' : 'ERRO'} rota ${nomeRota}: ${r.final ? 'final "' + r.final + '"' : 'fim do capítulo ' + r.capitulo}, cena romântica com ${r.favorito || '—'}${r.adrian ? ', encontrou Adrian' : ''}; ${falas} falas, ${escolhas.length} escolhas, ${r.docs} documentos; afinidade ${JSON.stringify(r.afinidade)}`);
  if (!ok) console.log('   escolhas: ' + escolhas.join(' | '));
  if (erros.length) console.log('   erros:\n     ' + [...new Set(erros)].join('\n     '));
  await pagina.close();
  return ok && !erros.length;
}

(async () => {
  const pasta = process.argv[2];
  if (pasta) fs.mkdirSync(pasta, { recursive: true });
  const navegador = await chromium.launch();
  let tudoCerto = true;
  for (const [nome, rota] of Object.entries(ROTAS)) tudoCerto = (await jogar(navegador, nome, rota, pasta)) && tudoCerto;
  await navegador.close();
  process.exitCode = tudoCerto ? 0 : 1;
})();
