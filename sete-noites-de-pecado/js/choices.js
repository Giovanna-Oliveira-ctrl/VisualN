/* =========================================================================
   ESCOLHAS
   Mostra as opções na tela, deixa escolher com mouse, toque ou teclado
   (números 1 a 9 e setas) e avisa o motor qual foi a escolhida.
   O registro das escolhas e os efeitos (afinidade, flags) ficam em main.js.
   ========================================================================= */
window.Escolhas = (() => {
  const caixa = () => document.getElementById('escolhas');
  let aoEscolher = null;
  let aberta = false;

  /* opcoes: [{ texto, ... }]. aoEscolherFn recebe a opção escolhida. */
  function mostrar(opcoes, aoEscolherFn) {
    aoEscolher = aoEscolherFn;
    aberta = true;
    const el = caixa();
    const lista = el.querySelector('.escolhas-lista');
    lista.replaceChildren();
    opcoes.forEach((opcao, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'escolha';
      b.style.animationDelay = `${i * 70}ms`;
      const numero = document.createElement('span');
      numero.className = 'escolha-numero';
      numero.textContent = String(i + 1);
      numero.setAttribute('aria-hidden', 'true');
      const texto = document.createElement('span');
      texto.className = 'escolha-texto';
      texto.textContent = window.Dialogo.formatar(opcao.texto).replace(/_/g, '');
      b.append(numero, texto);
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        escolher(opcao);
      });
      lista.append(b);
    });
    el.hidden = false;
    requestAnimationFrame(() => lista.querySelector('button')?.focus({ preventScroll: true }));
  }

  function escolher(opcao) {
    if (!aberta) return;
    aberta = false;
    caixa().hidden = true;
    window.Som?.efeito('escolha');
    const fn = aoEscolher;
    aoEscolher = null;
    if (fn) fn(opcao);
  }

  function esconder() {
    aberta = false;
    aoEscolher = null;
    caixa().hidden = true;
  }

  /* Teclado: números escolhem, setas mudam o foco. Devolve true se usou a tecla. */
  function tecla(evento) {
    if (!aberta) return false;
    const botoes = [...caixa().querySelectorAll('button')];
    const n = parseInt(evento.key, 10);
    if (n >= 1 && n <= botoes.length) {
      botoes[n - 1].click();
      return true;
    }
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      const i = botoes.indexOf(document.activeElement);
      const proximo = evento.key === 'ArrowDown' ? (i + 1) % botoes.length : (i - 1 + botoes.length) % botoes.length;
      botoes[proximo].focus();
      return true;
    }
    return false;
  }

  return { mostrar, esconder, tecla, get aberta() { return aberta; } };
})();
