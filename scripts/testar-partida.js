// Joga partidas inteiras de Sete Velas no Chromium, clicando como uma pessoa, e confere se cada rota chega ao final esperado.
// Uso: node scripts/testar-partida.js [pasta-para-capturas]
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROTAS = {
  luz: { par: 'heitor', esperado: 'Primeira Luz', prefere: ['ouvir', 'toca muito bem', 'Pode deixar', 'Chamar', 'escritório', 'retratos', 'diário', 'acredito', 'Aceitar', 'Ninguém', 'Ficar mais', 'Descer com', 'Queimar'] },
  onibus: { par: 'helena', esperado: 'Ônibus das Seis', prefere: ['Quem está', 'costuma', 'acredita nessas', 'Cobrir', 'padaria', 'retratos', 'foto', 'Não tenho', 'Aceitar', 'Não sei se', 'Pegar o ônibus'] },
  porta: { par: 'helena', esperado: 'Porta Aberta', prefere: ['Quem está', 'costuma', 'acredita nessas', 'Descer até', 'padaria', 'retratos', 'Não dizer', 'não sei dançar', 'Tenho minha vida', 'Ficar mais', 'Seguir'] },
  eterna: { par: 'heitor', esperado: 'Vela Eterna', prefere: ['ouvir', 'toca muito bem', 'acredita nessas', 'Chamar', 'padaria', 'Contar sobre', 'retratos', 'foto', 'Tenho. Mas', 'Aceitar', 'Não sei se', 'Ficar mais', 'Então eu fico'] },
};

async function jogar(navegador, nomeRota, rota, pastaCapturas) {
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|net::/.test(m.text())) erros.push(m.text()); });
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await pagina.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await pagina.evaluate(() => localStorage.clear());
  await pagina.click('#bt-novo');
  await pagina.fill('#campo-nome', 'Teste');
  await pagina.click('#passo-nome button[type=submit]');
  await pagina.click(`.par[data-li="${rota.par}"]`);
  await pagina.click('#bt-comecar');

  const escolhas = [];
  let falas = 0;
  let capturas = 0;
  const capturar = async (rotulo) => {
    if (!pastaCapturas || capturas > 14) return;
    await pagina.waitForTimeout(700);
    await pagina.screenshot({ path: path.join(pastaCapturas, `${nomeRota}-${String(capturas++).padStart(2, '0')}-${rotulo}.png`) });
  };
  await capturar('inicio');
  for (let passo = 0; passo < 3000; passo++) {
    const modo = await pagina.evaluate(() => window.SeteVelas.modo);
    if (modo === 'final') break;
    if (modo === 'escolha') {
      const textos = await pagina.$$eval('#escolhas button span', (els) => els.map((e) => e.textContent));
      let i = textos.findIndex((t) => rota.prefere.some((p) => t.includes(p)));
      if (i < 0) i = 0;
      escolhas.push(textos[i]);
      if (escolhas.length <= 2 || /Queimar|Seguir|ônibus|fico/.test(textos[i])) await capturar('escolha');
      await pagina.click(`#escolhas button >> nth=${i}`);
      continue;
    }
    if (modo === 'velas') {
      await capturar('velas');
      for (let tentativa = 0; tentativa < 40; tentativa++) {
        const estado = await pagina.evaluate(() => {
          const b = [...document.querySelectorAll('#velas-fila .vela')];
          return { aberto: !document.querySelector('#velas-jogo').hidden, proxima: b.findIndex((x) => x.classList.contains('proxima')) };
        });
        if (!estado.aberto) break;
        if (estado.proxima >= 0) await pagina.click(`#velas-fila .vela >> nth=${estado.proxima}`, { timeout: 2000 }).catch(() => {});
        await pagina.waitForTimeout(120);
      }
      await pagina.waitForFunction(() => window.SeteVelas.modo !== 'velas', null, { timeout: 30000 });
      continue;
    }
    if (modo === 'fala' || modo === 'cartao' || modo === 'espera') {
      falas++;
      if (falas === 3 || falas === 40 || falas === 120) await capturar('fala');
      await pagina.evaluate(() => { window.SeteVelas.avancar(); window.SeteVelas.avancar(); });
      await pagina.waitForTimeout(15);
      continue;
    }
    await pagina.waitForTimeout(100);
  }
  await capturar('final');
  const titulo = await pagina.textContent('#final-titulo');
  const ok = titulo === rota.esperado;
  console.log(`${ok ? 'OK ' : 'ERRO'} rota ${nomeRota}: chegou em "${titulo}" (esperado "${rota.esperado}") com ${falas} falas e ${escolhas.length} escolhas.`);
  if (!ok) console.log('   escolhas:', escolhas.join(' | '));
  if (erros.length) console.log('   erros no console:\n     ' + [...new Set(erros)].join('\n     '));
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
