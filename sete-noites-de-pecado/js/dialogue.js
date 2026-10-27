/* =========================================================================
   DIÁLOGOS
   Mostra cada fala na caixa de diálogo: nome de quem fala, texto aparecendo
   aos poucos (ou de uma vez), indicador de "ainda escrevendo" e de "pode
   avançar". Também guarda o histórico e controla os modos Auto e Pular.
   ========================================================================= */
window.Dialogo = (() => {
  const $ = (id) => document.getElementById(id);
  let digitando = null;      // { partes, total, intervalo }
  let timerAvanco = null;
  let auto = false;
  let pulando = false;
  let falaAtual = null;
  const historico = [];
  const LIMITE_HISTORICO = 400;

  // Quem o motor avisa quando a pessoa quer ir para a próxima fala.
  let aoContinuar = () => {};

  const config = () => window.Jogo?.config || {};
  const estado = () => window.Jogo?.estado || { nome: 'Clara', vars: {} };

  /* Troca {nome} pelo nome da protagonista. */
  function formatar(texto) {
    return String(texto).replace(/\{nome\}/g, estado().nome);
  }

  /* Nome e cor de quem fala, respeitando nomes ainda secretos. */
  function falante(id) {
    if (!id) return { nome: '', cor: '' };
    const especial = window.FALANTES_ESPECIAIS?.[id];
    if (especial) return { nome: formatar(especial.nome), cor: especial.cor };
    const p = window.PERSONAGENS?.[id];
    if (!p) return { nome: id, cor: '' };
    const revelado = !p.revelaCom || estado().vars[p.revelaCom];
    return { nome: revelado ? p.nome : (p.nomeAntes || '???'), cor: p.cor };
  }

  /* _texto_ vira itálico. */
  function partes(texto) {
    return texto.split('_').map((t, i) => ({ texto: t, italico: i % 2 === 1 })).filter((p) => p.texto);
  }

  function desenhar(lista, quantos) {
    const alvo = $('caixa-texto');
    alvo.replaceChildren();
    let resto = quantos;
    for (const p of lista) {
      if (resto <= 0) break;
      const pedaco = p.texto.slice(0, resto);
      resto -= p.texto.length;
      if (p.italico) {
        const em = document.createElement('em');
        em.textContent = pedaco;
        alvo.append(em);
      } else {
        alvo.append(document.createTextNode(pedaco));
      }
    }
  }

  function indicador(estadoIndicador) {
    $('caixa-indicador').dataset.estado = estadoIndicador; // 'escrevendo' | 'pronto' | ''
  }

  /* Mostra uma fala. fala = { quem, texto, chave } */
  function mostrar(fala, { instantaneo = false, registrar = true } = {}) {
    falaAtual = fala;
    const { nome, cor } = falante(fala.quem);
    const texto = formatar(fala.texto);
    const lista = partes(texto);
    const plano = lista.map((p) => p.texto).join('');
    const caixa = $('caixa');
    caixa.hidden = false;
    caixa.classList.remove('oculta');
    caixa.dataset.quem = fala.quem || 'narracao';
    caixa.style.setProperty('--cor-falante', cor || 'var(--marfim)');
    $('caixa-nome').textContent = nome;
    $('caixa-nome').hidden = !nome;
    $('leitor').textContent = (nome ? nome + ': ' : '') + plano;

    const jaLida = fala.chave ? window.Armazenamento.foiLido(fala.chave) : true;
    if (registrar) {
      historico.push({ nome, texto: plano, quem: fala.quem });
      if (historico.length > LIMITE_HISTORICO) historico.shift();
    }

    // Modo pular: só passa direto pelo que já foi lido (a não ser que a pessoa escolha pular tudo).
    if (pulando && config().pularSoLido && !jaLida) {
      definirPular(false);
      window.Telas?.aviso('Texto novo. O modo Pular foi pausado.');
    }
    if (fala.chave) window.Armazenamento.marcarLido(fala.chave);

    clearInterval(digitando?.intervalo);
    clearTimeout(timerAvanco);
    if (instantaneo || pulando || config().textoInstantaneo) {
      desenhar(lista, plano.length);
      digitando = null;
      terminou();
      return;
    }
    const inicio = performance.now();
    const velocidade = config().velocidadeTexto || 45;
    digitando = { lista, total: plano.length };
    indicador('escrevendo');
    desenhar(lista, 0);
    digitando.intervalo = setInterval(() => {
      const n = Math.floor(((performance.now() - inicio) / 1000) * velocidade);
      if (n >= digitando.total) completar();
      else desenhar(lista, n);
    }, 16);
  }

  function completar() {
    if (!digitando) return;
    clearInterval(digitando.intervalo);
    desenhar(digitando.lista, digitando.total);
    digitando = null;
    terminou();
  }

  function terminou() {
    indicador('pronto');
    clearTimeout(timerAvanco);
    if (pulando) timerAvanco = setTimeout(() => aoContinuar(), 60);
    else if (auto) {
      const n = $('caixa-texto').textContent.length;
      timerAvanco = setTimeout(() => aoContinuar(), (1200 + n * 45) * (config().pausaAuto || 1));
    }
  }

  /* Clique, toque, espaço ou botão Avançar. */
  function avancar() {
    if (digitando) { completar(); return; }
    if (pulando) { definirPular(false); return; }
    clearTimeout(timerAvanco);
    aoContinuar();
  }

  function escrevendo() {
    return !!digitando;
  }

  function ocultar() {
    clearInterval(digitando?.intervalo);
    digitando = null;
    clearTimeout(timerAvanco);
    $('caixa').classList.add('oculta');
    indicador('');
  }

  function esconderTudo() {
    ocultar();
    $('caixa').hidden = true;
  }

  function definirAuto(valor) {
    auto = valor;
    window.Telas?.marcarBotao('auto', valor);
    if (auto && !digitando && falaAtual) terminou();
    if (!auto) clearTimeout(timerAvanco);
  }

  function definirPular(valor) {
    pulando = valor;
    window.Telas?.marcarBotao('pular', valor);
    if (pulando) {
      if (digitando) completar();
      else if (falaAtual && $('caixa-indicador').dataset.estado === 'pronto') terminou();
    } else clearTimeout(timerAvanco);
  }

  function registrarEscolha(texto) {
    historico.push({ nome: '', texto, escolha: true });
  }

  function limparHistorico() {
    historico.length = 0;
  }

  return {
    mostrar, avancar, completar, escrevendo, ocultar, esconderTudo, formatar, falante,
    definirAuto, definirPular, registrarEscolha, limparHistorico, historico,
    get auto() { return auto; },
    get pulando() { return pulando; },
    set aoContinuar(fn) { aoContinuar = fn; },
  };
})();
