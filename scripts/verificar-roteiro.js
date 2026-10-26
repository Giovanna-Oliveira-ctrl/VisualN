// Confere o roteiro de Sete Velas: rótulos, saltos, trechos sem saída e todos os caminhos até os finais.
// Uso: node scripts/verificar-roteiro.js
// Carrega o próprio jogo no Chromium (Playwright) para usar o mesmo compilador do motor.
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await pagina.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await pagina.waitForFunction(() => window.SeteVelas && window.SeteVelas.PROG);

  const relatorio = await pagina.evaluate(() => {
    const { rotulos, cmds } = window.SeteVelas.PROG;
    const problemas = [];
    const porIndice = {};
    for (const [nome, i] of Object.entries(rotulos)) (porIndice[i] = porIndice[i] || []).push(nome);

    // 1. saltos para rótulos que não existem
    const alvos = new Set();
    for (const c of cmds) {
      if (c.t === 'escolha') c.opcoes.forEach((o) => alvos.add([o.vai, c.linha]));
      if (c.t === 'cmd' && c.nome === 'vai') alvos.add([c.args[0], c.linha]);
      if (c.t === 'cmd' && c.nome === 'se') alvos.add([c.raw.split('->')[1].trim(), c.linha]);
    }
    for (const [alvo, linha] of alvos) if (!(alvo in rotulos)) problemas.push(`linha ${linha}: rótulo inexistente "${alvo}"`);

    // 2. trechos que escorregam para o rótulo seguinte sem @vai, escolha ou final
    for (let i = 1; i < cmds.length; i++) {
      if (!porIndice[i]) continue;
      const ant = cmds[i - 1];
      const fecha = ant.t === 'escolha' || (ant.t === 'cmd' && ['vai', 'final'].includes(ant.nome));
      if (!fecha) problemas.push(`linha ${ant.linha}: o trecho antes de "${porIndice[i][0]}" não termina com @vai, escolha ou @final`);
    }

    // 3. rótulos nunca usados
    const usados = new Set([...alvos].map(([a]) => a));
    usados.add('inicio');
    for (const nome of Object.keys(rotulos)) if (!usados.has(nome)) problemas.push(`rótulo nunca usado: "${nome}"`);

    // 4. todos os caminhos (com memória por estado)
    const palavras = (t) => t.replace(/\{[^}]*\}/g, 'x').split(/\s+/).filter(Boolean).length;
    function valor(vars, x, dir) {
      x = x.trim();
      if (/^-?\d+$/.test(x)) return Number(x);
      if (x in vars) return vars[x];
      return dir ? x : 0;
    }
    function avaliar(vars, cond) {
      return cond.split('||').some((p) => p.split('&&').every((t) => {
        t = t.trim();
        let neg = false;
        while (t.startsWith('!')) { neg = !neg; t = t.slice(1).trim(); }
        const m = t.match(/^(\w+)\s*(>=|<=|==|!=|>|<)\s*(\S+)$/);
        let r;
        if (m) { const a = valor(vars, m[1]); const b = valor(vars, m[3], true); r = { '>=': a >= b, '<=': a <= b, '==': a == b, '!=': a != b, '>': a > b, '<': a < b }[m[2]]; }
        else r = !!valor(vars, t);
        return neg ? !r : r;
      }));
    }
    function aplicar(vars, texto) {
      for (const parte of texto.split(',')) {
        const m = parte.trim().match(/^(\w+)\s*(\+=|-=|=)\s*(.+)$/);
        if (!m) continue;
        let v = 0;
        const re = /([+-]?)\s*(\w+)/g;
        let k;
        while ((k = re.exec(m[3]))) { const n = /^\d+$/.test(k[2]) ? +k[2] : +vars[k[2]] || 0; v += k[1] === '-' ? -n : n; }
        const at = +vars[m[1]] || 0;
        vars[m[1]] = m[2] === '=' ? v : m[2] === '+=' ? at + v : at - v;
      }
    }
    const memo = new Map();
    const pilha = new Set();
    let estados = 0;
    function andar(pc, vars) {
      const chave = pc + '|' + JSON.stringify(Object.keys(vars).sort().map((k) => [k, vars[k]]));
      if (memo.has(chave)) return memo.get(chave);
      if (pilha.has(chave)) return null; // laço (ex.: tentar as velas de novo)
      pilha.add(chave);
      estados++;
      vars = { ...vars };
      let n = 0;
      let res = null;
      for (let guarda = 0; guarda < 5000; guarda++) {
        const c = cmds[pc];
        if (!c) { problemas.push('o roteiro acabou sem @final depois da linha ' + cmds[pc - 1]?.linha); res = { finais: {}, min: n, max: n }; break; }
        pc++;
        if (c.t === 'fala') { n += palavras(c.texto); continue; }
        if (c.t === 'escolha') {
          const ops = c.opcoes.filter((o) => !o.cond || avaliar(vars, o.cond));
          if (!ops.length) problemas.push('nenhuma opção visível na linha ' + c.linha + ' com ' + JSON.stringify(vars));
          res = juntar(ops.map((o) => { const v = { ...vars }; o.sets.forEach((s) => aplicar(v, s)); return andar(rotulos[o.vai], v); }), n);
          break;
        }
        if (c.nome === 'set') aplicar(vars, c.raw);
        else if (c.nome === 'vai') pc = rotulos[c.args[0]];
        else if (c.nome === 'se') { const [cond, alvo] = c.raw.split('->'); if (avaliar(vars, cond)) pc = rotulos[alvo.trim()]; }
        else if (c.nome === 'velas') {
          const noite = c.raw.match(/noite=(\d)/)[1];
          res = juntar([7, 3].map((k) => andar(pc, { ...vars, ['velas' + noite]: k })), n);
          break;
        } else if (c.nome === 'final') { res = { finais: { [c.args[0]]: 1 }, min: n, max: n }; break; }
      }
      pilha.delete(chave);
      memo.set(chave, res);
      return res;
    }
    function juntar(lista, n) {
      const ok = lista.filter(Boolean);
      const finais = {};
      ok.forEach((r) => Object.keys(r.finais).forEach((f) => { finais[f] = 1; }));
      return { finais, min: n + Math.min(...ok.map((r) => r.min)), max: n + Math.max(...ok.map((r) => r.max)) };
    }
    const r = andar(rotulos.inicio, {});

    // caminho específico: palavras até cada final, pelo caminho mais curto e mais longo
    return { problemas, finais: Object.keys(r.finais), minPalavras: r.min, maxPalavras: r.max, estados, totalFalas: cmds.filter((c) => c.t === 'fala').length };
  });

  console.log('Falas no roteiro:', relatorio.totalFalas);
  console.log('Estados explorados:', relatorio.estados);
  console.log('Finais alcançáveis:', relatorio.finais.join(', '));
  console.log(`Palavras lidas por partida: de ${relatorio.minPalavras} a ${relatorio.maxPalavras}`);
  if (erros.length) console.log('Erros de JavaScript na página:\n  ' + erros.join('\n  '));
  if (relatorio.problemas.length) {
    console.log('Problemas:\n  ' + [...new Set(relatorio.problemas)].join('\n  '));
    process.exitCode = 1;
  } else console.log('Nenhum problema encontrado no roteiro.');
  await navegador.close();
})();
