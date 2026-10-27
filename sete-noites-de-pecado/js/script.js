/* =========================================================================
   ROTEIRO
   Lê os capítulos escritos em story/*.js e transforma o texto em uma lista
   de comandos que o jogo executa um por um.

   Cada capítulo chama Roteiro.adicionar({ id, roteiro }). O formato do
   roteiro está explicado no README e no topo de story/prologue.js.
   ========================================================================= */
window.Roteiro = (() => {
  const comandos = [];   // todos os comandos de todos os capítulos, em ordem
  const rotulos = {};    // nome do rótulo -> posição na lista de comandos
  const avisos = [];     // problemas encontrados ao ler o roteiro

  const ehFalante = (id) => (id in (window.PERSONAGENS || {})) || (id in (window.FALANTES_ESPECIAIS || {}));

  function lerOpcao(texto, arquivo, linha) {
    let condicao = null;
    let efeitos = '';
    const mCond = texto.match(/\[se\s+([^\]]+)\]\s*$/);
    if (mCond) {
      condicao = mCond[1].trim();
      texto = texto.slice(0, mCond.index).trim();
    }
    const mEfeitos = texto.match(/->\s*[\wÀ-ú]+\s*\{([^}]*)\}\s*$/);
    if (mEfeitos) {
      efeitos = mEfeitos[1].trim();
      texto = texto.slice(0, texto.lastIndexOf('{')).trim();
    }
    const m = texto.match(/^(.*?)\s*->\s*([\wÀ-ú]+)$/);
    if (!m) {
      avisos.push(`${arquivo}, linha ${linha}: opção sem "-> rotulo": ${texto}`);
      return null;
    }
    return { texto: m[1], vai: m[2], efeitos, condicao, linha };
  }

  function adicionar({ id, roteiro }) {
    let escolhaAberta = null;
    roteiro.split('\n').forEach((bruta, i) => {
      const linha = i + 1;
      const l = bruta.trim();
      if (!l || l.startsWith('//')) return;

      if (l.startsWith('#')) {
        const nome = l.slice(1).trim();
        if (nome in rotulos) avisos.push(`${id}, linha ${linha}: rótulo repetido "${nome}"`);
        rotulos[nome] = comandos.length;
        escolhaAberta = null;
        return;
      }

      if (l.startsWith('>')) {
        if (!escolhaAberta) {
          escolhaAberta = { tipo: 'escolha', opcoes: [], arquivo: id, linha };
          comandos.push(escolhaAberta);
        }
        const opcao = lerOpcao(l.slice(1).trim(), id, linha);
        if (opcao) escolhaAberta.opcoes.push(opcao);
        return;
      }
      escolhaAberta = null;

      if (l.startsWith('@')) {
        const corpo = l.slice(1);
        const nome = corpo.split(/\s+/)[0];
        const resto = corpo.slice(nome.length).trim();
        comandos.push({ tipo: 'comando', nome, resto, args: resto ? resto.split(/\s+/) : [], arquivo: id, linha });
        return;
      }

      // Fala: "lucien: texto" ou "lucien (sorriso): texto"
      const m = l.match(/^([a-zà-ú_]+)(?:\s*\(([\wÀ-ú ]+)\))?\s*:\s*(.+)$/);
      if (m && ehFalante(m[1])) {
        comandos.push({ tipo: 'fala', quem: m[1], expressao: m[2] ? m[2].trim() : null, texto: m[3], arquivo: id, linha, chave: `${id}:${linha}` });
      } else {
        comandos.push({ tipo: 'fala', quem: null, expressao: null, texto: l, arquivo: id, linha, chave: `${id}:${linha}` });
      }
    });
  }

  function posicao(rotulo) {
    return rotulos[rotulo];
  }

  return { adicionar, posicao, comandos, rotulos, avisos };
})();
