/* =========================================================================
   ESTADO DO JOGO
   Guarda tudo o que muda durante uma partida: nome da protagonista,
   afinidade com cada personagem, variáveis (flags) da história, escolhas
   feitas, documentos encontrados e o que está na tela.
   Também sabe ler as condições e os efeitos escritos no roteiro, como
   "lucien>=3 && viuAdrian" ou "dorian+1, pistas+1, mostrouConvite".
   ========================================================================= */
window.Estado = (() => {
  const AFINIDADE_MIN = -10;
  const AFINIDADE_MAX = 20;

  // Personagens com afinidade (os que têm romance: true em characters.js)
  const romances = () => Object.keys(window.PERSONAGENS).filter((id) => window.PERSONAGENS[id].romance);

  function novo(nome) {
    const afinidade = {};
    for (const id of romances()) afinidade[id] = window.PERSONAGENS[id].afinidadeInicial || 0;
    return {
      versao: 1,
      nome: nome || 'Clara',
      capitulo: 'prologo',
      pc: 0,                 // próximo comando do roteiro a executar
      atual: 0,              // comando que está na tela agora
      afinidade,
      vars: {},              // flags e contadores da história
      escolhas: [],          // { capitulo, texto }
      documentos: [],        // ids de documentos encontrados
      tela: { cena: 'preto', opcoes: {}, personagens: {}, musica: null, ambiente: null },
      ultimaFala: null,
      criadoEm: Date.now(),
    };
  }

  /* ---------- leitura de valores ---------- */
  function valor(estado, nome, ladoDireito) {
    nome = nome.trim();
    if (/^-?\d+(\.\d+)?$/.test(nome)) return Number(nome);
    if (nome in estado.afinidade) return estado.afinidade[nome];
    if (nome in estado.vars) return estado.vars[nome];
    // do lado direito de uma comparação, palavras soltas são texto (ex.: favorito==lucien)
    return ladoDireito ? nome : 0;
  }

  /* Condições: "a>=3", "!flag", "a && b", "a || b", "favorito==lucien" */
  function avaliar(estado, condicao) {
    if (!condicao) return true;
    return condicao.split('||').some((parte) => parte.split('&&').every((termo) => {
      let t = termo.trim();
      let negar = false;
      while (t.startsWith('!')) { negar = !negar; t = t.slice(1).trim(); }
      const m = t.match(/^([\wÀ-ú]+)\s*(>=|<=|==|!=|>|<)\s*(\S+)$/);
      let resultado;
      if (m) {
        const a = valor(estado, m[1]);
        // Se o lado esquerdo é um texto (ex.: favorito==lucien), o direito é lido como texto também.
        const b = typeof a === 'string' ? m[3] : valor(estado, m[3], true);
        resultado = { '>=': a >= b, '<=': a <= b, '==': a == b, '!=': a != b, '>': a > b, '<': a < b }[m[2]]; // eslint-disable-line eqeqeq
      } else {
        resultado = !!valor(estado, t);
      }
      return negar ? !resultado : resultado;
    }));
  }

  /* Efeitos: "lucien+1, cassian-1, pistas+1, rota=lucien, viuAdrian"
     Devolve a lista de mudanças de afinidade, para o jogo poder avisar a jogadora. */
  function aplicar(estado, efeitos) {
    const mudancas = [];
    if (!efeitos) return mudancas;
    for (const bruto of efeitos.split(',')) {
      const item = bruto.trim();
      if (!item) continue;
      let m = item.match(/^([\wÀ-ú]+)\s*([+-])\s*(\d+)$/);
      if (m) {
        const qtd = Number(m[3]) * (m[2] === '-' ? -1 : 1);
        if (m[1] in estado.afinidade) {
          const antes = estado.afinidade[m[1]];
          estado.afinidade[m[1]] = Math.max(AFINIDADE_MIN, Math.min(AFINIDADE_MAX, antes + qtd));
          mudancas.push({ personagem: m[1], quantidade: qtd });
        } else {
          estado.vars[m[1]] = (Number(estado.vars[m[1]]) || 0) + qtd;
        }
        continue;
      }
      m = item.match(/^([\wÀ-ú]+)\s*=\s*(.+)$/);
      if (m) {
        const v = m[2].trim();
        const numero = Number(v);
        if (m[1] in estado.afinidade && !isNaN(numero)) estado.afinidade[m[1]] = numero;
        else estado.vars[m[1]] = isNaN(numero) ? v : numero;
        continue;
      }
      if (/^[\wÀ-ú]+$/.test(item)) estado.vars[item] = 1;
    }
    return mudancas;
  }

  /* Quem tem mais afinidade entre os candidatos. Empate: vale quem foi visto por último. */
  function favorito(estado, candidatos) {
    const lista = candidatos || romances().filter((id) => !window.PERSONAGENS[id].secreto);
    let melhor = null;
    for (const id of lista) {
      const a = estado.afinidade[id] ?? 0;
      if (!melhor || a > melhor.a || (a === melhor.a && estado.vars.ultimoEncontro === id)) melhor = { id, a };
    }
    return melhor ? melhor.id : null;
  }

  function copiar(estado) {
    return JSON.parse(JSON.stringify(estado));
  }

  return { novo, valor, avaliar, aplicar, favorito, copiar, romances, AFINIDADE_MIN, AFINIDADE_MAX };
})();
