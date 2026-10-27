/* =========================================================================
   PALCO
   Cuida do que aparece atrás da caixa de diálogo: o cenário, os personagens
   em cena e efeitos como tremor, clarão e escuridão.
   Os desenhos vêm de js/art.js (arte provisória) ou das imagens indicadas
   em js/scenes.js e js/characters.js.
   ========================================================================= */
window.Palco = (() => {
  const elFundo = () => document.getElementById('fundo');
  const elPersonagens = () => document.getElementById('personagens');
  const elCortina = () => document.getElementById('cortina');
  const elClarao = () => document.getElementById('clarao');
  const POSICOES = ['esquerda', 'centro', 'direita'];
  const emCena = {}; // id -> { el, expressao, posicao, mascara }
  let cenaAtual = null;

  const animacoesReduzidas = () => document.documentElement.classList.contains('reduzir-animacoes');

  function criarCenario(id, opcoes) {
    if (window.Arte && typeof window.Arte.cenario === 'function') {
      try { return window.Arte.cenario(id, opcoes); } catch (e) { console.error('Arte.cenario', id, e); }
    }
    const div = document.createElement('div');
    div.className = 'cenario-reserva';
    return div;
  }

  /* Troca o cenário. transicao: 'fade' (padrão), 'corte' ou 'preto'.
     Devolve uma Promise que termina quando o cenário novo já está na tela. */
  function cena(id, opcoes = {}, transicao = 'fade', instantaneo = false) {
    const chave = id + JSON.stringify(opcoes);
    if (cenaAtual === chave) return Promise.resolve();
    cenaAtual = chave;
    const novo = criarCenario(id, opcoes);
    novo.classList.add('camada-cenario');
    const fundo = elFundo();
    const antigos = [...fundo.children];
    const trocar = () => {
      fundo.append(novo);
      antigos.forEach((a) => a.remove());
    };
    if (instantaneo || animacoesReduzidas()) transicao = transicao === 'preto' ? 'preto-rapido' : 'corte';

    if (transicao === 'corte') {
      trocar();
      return Promise.resolve();
    }
    if (transicao === 'preto' || transicao === 'preto-rapido') {
      const tempo = transicao === 'preto' ? 500 : 120;
      const cortina = elCortina();
      cortina.style.transitionDuration = tempo + 'ms';
      cortina.classList.add('fechada');
      return new Promise((resolver) => setTimeout(() => {
        trocar();
        requestAnimationFrame(() => cortina.classList.remove('fechada'));
        resolver();
      }, tempo));
    }
    // fade: o novo cenário aparece por cima do antigo
    novo.classList.add('surgindo');
    fundo.append(novo);
    requestAnimationFrame(() => requestAnimationFrame(() => novo.classList.remove('surgindo')));
    setTimeout(() => antigos.forEach((a) => a.remove()), 900);
    return Promise.resolve();
  }

  function criarRetrato(id, expressao, mascara) {
    if (window.Arte && typeof window.Arte.personagem === 'function') {
      try { return window.Arte.personagem(id, expressao, { mascara }); } catch (e) { console.error('Arte.personagem', id, e); }
    }
    const div = document.createElement('div');
    div.className = 'retrato-reserva';
    div.textContent = (window.PERSONAGENS[id]?.nome || id).slice(0, 1);
    return div;
  }

  /* Mostra (ou atualiza) um personagem. posicao: esquerda, centro ou direita. */
  function mostrar(id, expressao = 'neutro', posicao, mascara) {
    let p = emCena[id];
    if (!p) {
      const el = document.createElement('div');
      el.className = 'sprite entrando';
      el.dataset.id = id;
      elPersonagens().append(el);
      p = emCena[id] = { el, expressao: null, posicao: posicao || 'centro', mascara: !!mascara };
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('entrando')));
    }
    if (posicao && POSICOES.includes(posicao)) p.posicao = posicao;
    if (mascara !== undefined) p.mascara = !!mascara;
    const mudouAparencia = p.expressao !== expressao || p.el.dataset.mascara !== String(p.mascara);
    p.expressao = expressao || p.expressao || 'neutro';
    if (mudouAparencia) {
      p.el.replaceChildren(criarRetrato(id, p.expressao, p.mascara));
      p.el.dataset.mascara = String(p.mascara);
    }
    p.el.dataset.posicao = p.posicao;
    p.el.dataset.expressao = p.expressao;
    p.el.style.setProperty('--cor', window.PERSONAGENS[id]?.cor || '#e6dcc8');
    reorganizar();
  }

  function expressao(id, nova) {
    if (emCena[id] && nova && emCena[id].expressao !== nova) mostrar(id, nova);
  }

  function esconder(id, instantaneo) {
    const p = emCena[id];
    if (!p) return;
    delete emCena[id];
    if (instantaneo || animacoesReduzidas()) p.el.remove();
    else {
      p.el.classList.add('saindo');
      setTimeout(() => p.el.remove(), 500);
    }
    reorganizar();
  }

  function esconderTodos(instantaneo) {
    Object.keys(emCena).forEach((id) => esconder(id, instantaneo));
  }

  // Com uma só pessoa em cena, ela fica no centro, não importa a posição pedida.
  function reorganizar() {
    const lista = Object.values(emCena);
    for (const p of lista) p.el.dataset.lugar = lista.length === 1 ? 'centro' : p.posicao;
  }

  /* Destaca quem está falando e escurece os outros. */
  function destacar(falante) {
    const lista = Object.entries(emCena);
    for (const [id, p] of lista) {
      p.el.classList.toggle('falando', id === falante);
      p.el.classList.toggle('calado', lista.length > 1 && !!falante && id !== falante && falante in emCena);
    }
  }

  /* Estado atual, para salvar o jogo. */
  function fotografia() {
    const personagens = {};
    for (const [id, p] of Object.entries(emCena)) personagens[id] = { expressao: p.expressao, posicao: p.posicao, mascara: p.mascara };
    return personagens;
  }

  function restaurar(personagens) {
    esconderTodos(true);
    for (const [id, p] of Object.entries(personagens || {})) mostrar(id, p.expressao, p.posicao, p.mascara);
    Object.values(emCena).forEach((p) => p.el.classList.remove('entrando'));
  }

  /* Efeitos rápidos de tela. */
  function efeito(nome) {
    const palco = document.getElementById('palco');
    const config = window.Jogo?.config || {};
    if (nome === 'tremer' || nome === 'tremer-forte') {
      if (animacoesReduzidas()) return;
      palco.classList.remove('tremor', 'tremor-forte');
      void palco.offsetWidth;
      palco.classList.add(nome === 'tremer' ? 'tremor' : 'tremor-forte');
      return;
    }
    if (nome === 'flash' || nome === 'flash-vermelho' || nome === 'apagar') {
      const c = elClarao();
      c.className = 'camada';
      void c.offsetWidth;
      if (nome === 'apagar') c.classList.add('apagao');
      else if (animacoesReduzidas() || config.reduzirAnimacoes) c.classList.add('suave');
      else c.classList.add(nome === 'flash' ? 'branco' : 'vermelho');
      return;
    }
    if (nome === 'escurecer') elCortina().classList.add('meia');
    if (nome === 'clarear') elCortina().classList.remove('meia', 'fechada');
  }

  document.addEventListener('animationend', (e) => {
    if (e.target.id === 'palco') e.target.classList.remove('tremor', 'tremor-forte');
  });

  function reiniciar() {
    cenaAtual = null;
    esconderTodos(true);
    elFundo().replaceChildren();
    elCortina().classList.remove('fechada', 'meia');
  }

  return { cena, mostrar, expressao, esconder, esconderTodos, destacar, efeito, fotografia, restaurar, reiniciar, emCena };
})();
