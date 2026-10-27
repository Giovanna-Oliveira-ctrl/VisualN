// Confere o roteiro de Sete Noites de Pecado sem precisar jogar.
// Uso (na pasta do projeto): node scripts/verificar-roteiro.js
//
// Verifica: rótulos que não existem, trechos que "escorregam" para o próximo
// sem @vai, nomes de cenários, sons, documentos, expressões e capítulos
// desconhecidos, falas com nome de personagem errado, e percorre TODOS os
// caminhos possíveis das escolhas para garantir que cada um chega a um fim.
// Precisa do Playwright (já vem instalado no ambiente do Claude Code).
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  const errosJs = [];
  pagina.on('pageerror', (e) => errosJs.push(e.message));
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await pagina.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await pagina.waitForFunction(() => window.Roteiro && window.Jogo);

  const r = await pagina.evaluate(() => {
    const { comandos, rotulos, avisos } = window.Roteiro;
    const problemas = [...avisos];
    const onde = (c) => `${c.arquivo}, linha ${c.linha}`;
    const EXPRESSOES = ['neutro', 'sorriso', 'serio', 'triste', 'surpreso', 'irritado'];
    const cenarios = window.CENARIOS ? Object.keys(window.CENARIOS) : null;
    const sons = window.Som.nomes;
    const capitulos = window.CAPITULOS.map((c) => c.id);
    const finais = window.FINAIS.map((f) => f.id);

    // 1. Referências
    const alvos = [];
    for (const c of comandos) {
      if (c.tipo === 'escolha') c.opcoes.forEach((o) => alvos.push([o.vai, c]));
      if (c.tipo === 'fala') {
        if (c.expressao && !EXPRESSOES.includes(c.expressao)) problemas.push(`${onde(c)}: expressão desconhecida "${c.expressao}"`);
        if (!c.quem && /^[a-zà-ú_]+(\s*\([^)]*\))?\s*:/.test(c.texto)) problemas.push(`${onde(c)}: parece uma fala, mas o personagem não existe: "${c.texto.slice(0, 30)}"`);
        continue;
      }
      if (c.tipo !== 'comando') continue;
      const a = c.args;
      if (c.nome === 'vai') alvos.push([a[0], c]);
      if (c.nome === 'se') alvos.push([(c.resto.split('->')[1] || '').trim(), c]);
      if (c.nome === 'cena' && cenarios && !cenarios.includes(a[0])) problemas.push(`${onde(c)}: cenário desconhecido "${a[0]}"`);
      if ((c.nome === 'mostra' || c.nome === 'esconde') && a[0] !== 'todos' && !window.PERSONAGENS[a[0]]) problemas.push(`${onde(c)}: personagem desconhecido "${a[0]}"`);
      if (c.nome === 'mostra') a.slice(1).forEach((x) => {
        if (!['esquerda', 'centro', 'direita', 'mascara', 'sem-mascara', ...EXPRESSOES].includes(x)) problemas.push(`${onde(c)}: palavra desconhecida em @mostra: "${x}"`);
      });
      if (c.nome === 'musica' && a[0] !== 'parar' && !sons.musicas.includes(a[0])) problemas.push(`${onde(c)}: música desconhecida "${a[0]}"`);
      if (c.nome === 'ambiente' && a[0] !== 'parar' && !sons.ambientes.includes(a[0])) problemas.push(`${onde(c)}: ambiente desconhecido "${a[0]}"`);
      if (c.nome === 'som' && !sons.efeitos.includes(a[0])) problemas.push(`${onde(c)}: efeito sonoro desconhecido "${a[0]}"`);
      if (c.nome === 'documento' && !window.DOCUMENTOS[a[0]]) problemas.push(`${onde(c)}: documento desconhecido "${a[0]}"`);
      if ((c.nome === 'capitulo' || c.nome === 'fim_capitulo') && !capitulos.includes(a[0])) problemas.push(`${onde(c)}: capítulo desconhecido "${a[0]}"`);
      if (c.nome === 'final' && !finais.includes(a[0])) problemas.push(`${onde(c)}: final desconhecido "${a[0]}"`);
      if (!['cena', 'mostra', 'esconde', 'musica', 'ambiente', 'som', 'efeito', 'espera', 'capitulo', 'define', 'afinidade', 'se', 'vai', 'documento', 'favorito', 'aviso', 'fim_capitulo', 'final'].includes(c.nome)) problemas.push(`${onde(c)}: comando desconhecido "@${c.nome}"`);
    }
    for (const [alvo, c] of alvos) if (!(alvo in rotulos)) problemas.push(`${onde(c)}: rótulo inexistente "${alvo}"`);

    // 2. Trechos que escorregam para o rótulo seguinte
    const porPosicao = {};
    for (const [nome, i] of Object.entries(rotulos)) porPosicao[i] = nome;
    for (let i = 1; i < comandos.length; i++) {
      if (!porPosicao[i]) continue;
      const ant = comandos[i - 1];
      const fecha = ant.tipo === 'escolha' || (ant.tipo === 'comando' && ['vai', 'final', 'fim_capitulo'].includes(ant.nome));
      if (!fecha) problemas.push(`${onde(ant)}: o trecho antes de "# ${porPosicao[i]}" não termina com @vai, escolha, @fim_capitulo ou @final`);
    }

    // 3. Rótulos nunca usados
    const usados = new Set(alvos.map(([a]) => a));
    window.CAPITULOS.forEach((c) => usados.add(c.inicio));
    for (const nome of Object.keys(rotulos)) if (!usados.has(nome)) problemas.push(`rótulo nunca usado: "${nome}"`);

    // 4. Todos os caminhos
    const memo = new Map();
    const emAndamento = new Set();
    const visitados = new Set();
    let estados = 0;
    const palavras = (t) => t.split(/\s+/).filter(Boolean).length;
    function andar(pc, est) {
      const chave = pc + '|' + JSON.stringify(est.afinidade) + JSON.stringify(Object.entries(est.vars).sort());
      if (memo.has(chave)) return memo.get(chave);
      if (emAndamento.has(chave)) return null;
      emAndamento.add(chave);
      estados++;
      est = window.Estado.copiar(est);
      let n = 0;
      let res = null;
      for (let guarda = 0; guarda < 20000; guarda++) {
        const c = comandos[pc];
        if (!c) { problemas.push('o roteiro acabou sem fim depois de ' + onde(comandos[pc - 1])); res = { fins: {}, min: n, max: n }; break; }
        visitados.add(pc);
        pc++;
        if (c.tipo === 'fala') { n += palavras(c.texto); continue; }
        if (c.tipo === 'escolha') {
          const ops = c.opcoes.filter((o) => window.Estado.avaliar(est, o.condicao));
          if (!ops.length) { problemas.push(`${onde(c)}: nenhuma opção visível com ${JSON.stringify(est.vars)}`); res = { fins: {}, min: n, max: n }; break; }
          res = juntar(ops.map((o) => { const e2 = window.Estado.copiar(est); window.Estado.aplicar(e2, o.efeitos); return andar(rotulos[o.vai], e2); }), n);
          break;
        }
        const a = c.args;
        if (c.nome === 'define' || c.nome === 'afinidade') window.Estado.aplicar(est, c.resto);
        else if (c.nome === 'vai') pc = rotulos[a[0]];
        else if (c.nome === 'se') { const [cond, alvo] = c.resto.split('->'); if (window.Estado.avaliar(est, cond)) pc = rotulos[alvo.trim()]; }
        else if (c.nome === 'favorito') est.vars.favorito = window.Estado.favorito(est, a.length ? a : undefined);
        else if (c.nome === 'final') { res = { fins: { ['final: ' + a[0]]: 1 }, min: n, max: n }; break; }
        else if (c.nome === 'fim_capitulo') {
          const i = window.CAPITULOS.findIndex((x) => x.id === a[0]);
          const prox = window.CAPITULOS[i + 1];
          if (prox && prox.disponivel) { pc = rotulos[prox.inicio]; continue; }
          res = { fins: { ['fim de capítulo: ' + a[0]]: 1 }, min: n, max: n };
          break;
        }
      }
      emAndamento.delete(chave);
      memo.set(chave, res);
      return res;
    }
    function juntar(lista, n) {
      const ok = lista.filter(Boolean);
      const fins = {};
      ok.forEach((x) => Object.assign(fins, x.fins));
      return { fins, min: n + Math.min(...ok.map((x) => x.min)), max: n + Math.max(...ok.map((x) => x.max)) };
    }
    const inicio = window.Estado.novo('Clara');
    const resultado = andar(rotulos.prologo, inicio);
    for (const [nome, i] of Object.entries(rotulos)) {
      if (!visitados.has(i) && comandos[i]) problemas.push(`trecho que nenhum caminho alcança: "# ${nome}" (${onde(comandos[i])})`);
    }

    // 5. Afinidade máxima que cada personagem consegue atingir no protótipo
    const falas = comandos.filter((c) => c.tipo === 'fala').length;
    return { problemas: [...new Set(problemas)], fins: Object.keys(resultado.fins), min: resultado.min, max: resultado.max, estados, falas, rotulos: Object.keys(rotulos).length, cenariosConferidos: !!cenarios };
  });

  console.log(`Falas no roteiro: ${r.falas} · rótulos: ${r.rotulos} · estados explorados: ${r.estados}`);
  console.log('Fins alcançáveis: ' + r.fins.join(', '));
  console.log(`Palavras lidas por partida (prólogo + capítulo 1): de ${r.min} a ${r.max}`);
  if (!r.cenariosConferidos) console.log('Aviso: js/scenes.js não carregou, então os nomes de cenários não foram conferidos.');
  if (errosJs.length) console.log('Erros de JavaScript na página:\n  ' + errosJs.join('\n  '));
  if (r.problemas.length) {
    console.log(`\n${r.problemas.length} problema(s):\n  ` + r.problemas.join('\n  '));
    process.exitCode = 1;
  } else console.log('Nenhum problema encontrado no roteiro.');
  await navegador.close();
})();
