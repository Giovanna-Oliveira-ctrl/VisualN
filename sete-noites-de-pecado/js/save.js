/* =========================================================================
   SALVAMENTO
   Tudo o que precisa sobreviver quando a página fecha fica no localStorage
   do navegador: jogos salvos, configurações, falas já lidas e finais vistos.
   Se o navegador bloquear o armazenamento (janela anônima, por exemplo),
   o jogo continua funcionando, só não guarda nada.
   ========================================================================= */
window.Armazenamento = (() => {
  const PREFIXO = 'sete-noites:';
  const ESPACOS = 8; // quantos espaços de salvamento manual existem

  function ler(chave, padrao) {
    try {
      const texto = localStorage.getItem(PREFIXO + chave);
      return texto ? JSON.parse(texto) : padrao;
    } catch {
      return padrao;
    }
  }

  function gravar(chave, valor) {
    try {
      localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
      return true;
    } catch {
      return false;
    }
  }

  function apagar(chave) {
    try { localStorage.removeItem(PREFIXO + chave); } catch { /* sem armazenamento */ }
  }

  /* ---------- configurações ---------- */
  const PADRAO = {
    velocidadeTexto: 45,      // letras por segundo
    textoInstantaneo: false,
    tamanhoTexto: 1,          // 0.85 a 1.3
    pausaAuto: 1,             // multiplicador da pausa no modo automático
    volumeGeral: 0.8,
    volumeMusica: 0.6,
    volumeEfeitos: 0.8,
    musicaLigada: true,
    efeitosLigados: true,
    reduzirAnimacoes: false,
    altoContraste: false,
    pularSoLido: true,
    avisosAfinidade: true,
  };

  function configuracoes() {
    return { ...PADRAO, ...ler('configuracoes', {}) };
  }

  function salvarConfiguracoes(config) {
    gravar('configuracoes', config);
  }

  /* ---------- jogos salvos ---------- */
  // espaco: 'auto' ou um número de 1 a ESPACOS
  function salvarJogo(espaco, dados) {
    return gravar('jogo-' + espaco, dados);
  }

  function carregarJogo(espaco) {
    return ler('jogo-' + espaco, null);
  }

  function apagarJogo(espaco) {
    apagar('jogo-' + espaco);
  }

  function listarJogos() {
    const lista = [{ espaco: 'auto', dados: carregarJogo('auto') }];
    for (let i = 1; i <= ESPACOS; i++) lista.push({ espaco: i, dados: carregarJogo(i) });
    return lista;
  }

  function existeAlgumJogo() {
    return listarJogos().some((j) => j.dados);
  }

  /* ---------- falas já lidas (para o botão Pular) ---------- */
  let lidos = new Set(ler('lidos', []));
  let timerLidos = null;

  function gravarLidos() {
    clearTimeout(timerLidos);
    timerLidos = null;
    gravar('lidos', [...lidos]);
  }

  function marcarLido(chave) {
    if (lidos.has(chave)) return;
    lidos.add(chave);
    clearTimeout(timerLidos);
    timerLidos = setTimeout(gravarLidos, 800);
  }

  // Grava na hora se a página for fechada ou escondida antes do intervalo.
  const gravarSePendente = () => { if (timerLidos) gravarLidos(); };
  window.addEventListener('pagehide', gravarSePendente);
  document.addEventListener('visibilitychange', () => { if (document.hidden) gravarSePendente(); });

  function foiLido(chave) {
    return lidos.has(chave);
  }

  /* ---------- finais encontrados e progresso entre partidas ---------- */
  function finaisVistos() {
    return ler('finais', {});
  }

  function marcarFinal(id) {
    const vistos = finaisVistos();
    vistos[id] = Date.now();
    gravar('finais', vistos);
  }

  function apagarTudo() {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith(PREFIXO)).forEach((k) => localStorage.removeItem(k));
    } catch { /* sem armazenamento */ }
    lidos = new Set();
  }

  return {
    ESPACOS, PADRAO, ler, gravar, apagar,
    configuracoes, salvarConfiguracoes,
    salvarJogo, carregarJogo, apagarJogo, listarJogos, existeAlgumJogo,
    marcarLido, foiLido,
    finaisVistos, marcarFinal, apagarTudo,
  };
})();
