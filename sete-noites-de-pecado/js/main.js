/* =========================================================================
   MOTOR PRINCIPAL
   Liga todas as partes: executa o roteiro comando por comando, aplica
   afinidades e flags, salva e carrega, e cuida do teclado, mouse e toque.

   Comandos que o roteiro entende (veja exemplos em story/prologue.js):
   @cena id [escuro|apagado|vulto] [fade|corte|preto]
   @mostra id [expressão] [esquerda|centro|direita] [mascara|sem-mascara]
   @esconde id | todos
   @musica nome | parar          @ambiente nome | parar          @som nome
   @efeito tremer | tremer-forte | flash | flash-vermelho | apagar | escurecer | clarear
   @espera segundos              @capitulo id                     @documento id
   @define efeitos               @se condição -> rotulo           @vai rotulo
   @favorito                     @aviso texto                     @fim_capitulo id
   @final id
   ========================================================================= */
window.Jogo = (() => {
  const $ = (seletor) => document.querySelector(seletor);
  const comandos = window.Roteiro.comandos;
  const POSICOES = ['esquerda', 'centro', 'direita'];
  const TRANSICOES = ['fade', 'corte', 'preto'];

  let estado = window.Estado.novo();
  let config = window.Armazenamento.configuracoes();
  let emJogo = false;
  let modo = null;          // o que o jogo está esperando: fala, escolha, espera, cartao, documento, transicao, fim
  let pularSegurando = false;
  let timerEspera = null;
  let terminarCartao = null;
  let carregando = false;

  /* ---------- execução do roteiro ---------- */
  function executar() {
    for (let guarda = 0; guarda < 5000; guarda++) {
      const c = comandos[estado.pc];
      if (!c) {
        console.error('O roteiro acabou sem @fim_capitulo ou @final.');
        irParaTitulo();
        return;
      }
      estado.atual = estado.pc;
      estado.pc++;
      let bloqueia = false;
      try { bloqueia = rodar(c); } catch (e) { console.error(`Erro em ${c.arquivo}, linha ${c.linha}:`, e); }
      if (bloqueia) return;
    }
    console.error('O roteiro parece preso em um laço perto de', comandos[estado.pc]);
  }

  function continuar() {
    modo = null;
    executar();
  }

  function irPara(rotulo) {
    const i = window.Roteiro.posicao(rotulo);
    if (i === undefined) { console.error('Rótulo não existe:', rotulo); return; }
    estado.pc = i;
  }

  function rodar(c) {
    if (c.tipo === 'fala') return rodarFala(c);
    if (c.tipo === 'escolha') return rodarEscolha(c);
    return rodarComando(c);
  }

  function rodarFala(c) {
    if (c.quem && c.expressao) window.Palco.expressao(c.quem, c.expressao);
    window.Palco.destacar(c.quem);
    estado.ultimaFala = { quem: c.quem, texto: c.texto, chave: c.chave };
    modo = 'fala';
    window.Dialogo.mostrar(c, { instantaneo: pularSegurando });
    return true;
  }

  function rodarEscolha(c) {
    const visiveis = c.opcoes.filter((o) => window.Estado.avaliar(estado, o.condicao));
    if (!visiveis.length) {
      console.error(`Nenhuma opção disponível em ${c.arquivo}, linha ${c.linha}`);
      return false;
    }
    window.Dialogo.definirPular(false);
    modo = 'escolha';
    salvarAutomatico();
    window.Escolhas.mostrar(visiveis, escolher);
    return true;
  }

  function escolher(opcao) {
    if (modo !== 'escolha') return;
    const texto = window.Dialogo.formatar(opcao.texto).replace(/_/g, '');
    estado.escolhas.push({ capitulo: estado.capitulo, texto });
    window.Dialogo.registrarEscolha(texto);
    avisarAfinidade(window.Estado.aplicar(estado, opcao.efeitos));
    irPara(opcao.vai);
    continuar();
  }

  function avisarAfinidade(mudancas) {
    if (!config.avisosAfinidade || carregando) return;
    for (const m of mudancas) {
      const p = window.PERSONAGENS[m.personagem];
      if (!p) continue;
      const revelado = !p.revelaCom || estado.vars[p.revelaCom];
      const nome = revelado ? p.nome : 'Alguém';
      window.Telas.aviso(m.quantidade > 0 ? `${nome} vai se lembrar disso.` : `${nome} não gostou disso.`, p.cor);
      window.Som.efeito('afinidade');
    }
  }

  function rodarComando(c) {
    const a = c.args;
    switch (c.nome) {
      case 'cena': {
        const id = a[0];
        let transicao = 'fade';
        const opcoes = {};
        for (const x of a.slice(1)) {
          if (TRANSICOES.includes(x)) transicao = x;
          else opcoes[x] = true;
        }
        estado.tela.cena = id;
        estado.tela.opcoes = opcoes;
        const rapido = window.Dialogo.pulando || pularSegurando;
        if (transicao === 'preto' && !rapido) {
          modo = 'transicao';
          window.Dialogo.ocultar();
          window.Palco.cena(id, opcoes, 'preto').then(() => { if (modo === 'transicao') continuar(); });
          return true;
        }
        window.Palco.cena(id, opcoes, transicao, rapido);
        return false;
      }
      case 'mostra': {
        const [id, ...resto] = a;
        let expressao = null;
        let posicao;
        let mascara;
        for (const x of resto) {
          if (POSICOES.includes(x)) posicao = x;
          else if (x === 'mascara') mascara = true;
          else if (x === 'sem-mascara') mascara = false;
          else expressao = x;
        }
        window.Palco.mostrar(id, expressao || window.Palco.emCena[id]?.expressao || 'neutro', posicao, mascara);
        return false;
      }
      case 'esconde':
        if (a[0] === 'todos') window.Palco.esconderTodos(); else window.Palco.esconder(a[0]);
        return false;
      case 'musica':
        estado.tela.musica = a[0] === 'parar' ? null : a[0];
        window.Som.musica(estado.tela.musica);
        return false;
      case 'ambiente':
        estado.tela.ambiente = a[0] === 'parar' ? null : a[0];
        window.Som.ambiente(estado.tela.ambiente);
        return false;
      case 'som':
        if (!window.Dialogo.pulando && !carregando) window.Som.efeito(a[0]);
        return false;
      case 'efeito':
        if (!window.Dialogo.pulando) window.Palco.efeito(a[0]);
        return false;
      case 'espera':
        return esperar(parseFloat(a[0]) || 1);
      case 'capitulo':
        return mostrarCapitulo(a[0]);
      case 'define':
      case 'afinidade':
        avisarAfinidade(window.Estado.aplicar(estado, c.resto));
        return false;
      case 'se': {
        const m = c.resto.match(/^(.*?)->\s*([\wÀ-ú]+)\s*$/);
        if (m && window.Estado.avaliar(estado, m[1])) irPara(m[2]);
        return false;
      }
      case 'vai':
        irPara(a[0]);
        return false;
      case 'documento':
        return mostrarDocumento(a[0]);
      case 'favorito':
        estado.vars.favorito = window.Estado.favorito(estado, a.length ? a : undefined);
        return false;
      case 'aviso':
        window.Telas.aviso(window.Dialogo.formatar(c.resto));
        return false;
      case 'fim_capitulo':
        return fimDeCapitulo(a[0]);
      case 'final':
        return mostrarFinal(a[0]);
      default:
        console.warn(`Comando desconhecido "@${c.nome}" em ${c.arquivo}, linha ${c.linha}`);
        return false;
    }
  }

  function esperar(segundos) {
    modo = 'espera';
    window.Dialogo.ocultar();
    timerEspera = setTimeout(fimDaEspera, window.Dialogo.pulando ? 60 : segundos * 1000);
    return true;
  }

  function fimDaEspera() {
    clearTimeout(timerEspera);
    if (modo === 'espera') continuar();
  }

  function capituloPorId(id) {
    return window.CAPITULOS.find((cap) => cap.id === id);
  }

  function atualizarRotulo() {
    const cap = capituloPorId(estado.capitulo);
    if (!cap) return;
    $('#rotulo-capitulo').textContent = cap.numero
      ? `Capítulo ${cap.numero} · ${cap.titulo}${cap.pecado ? ' · ' + cap.pecado : ''}`
      : `${cap.titulo} · ${cap.subtitulo}`;
  }

  function mostrarCapitulo(id) {
    const cap = capituloPorId(id);
    if (!cap) return false;
    estado.capitulo = id;
    atualizarRotulo();
    salvarAutomatico();
    window.Dialogo.esconderTudo();
    modo = 'cartao';
    window.Som.efeito('sino');
    terminarCartao = window.Telas.cartaoCapitulo(cap, () => {
      terminarCartao = null;
      if (modo === 'cartao') continuar();
    }, carregando || window.Dialogo.pulando);
    return true;
  }

  function mostrarDocumento(id) {
    if (!window.DOCUMENTOS[id]) return false;
    if (!estado.documentos.includes(id)) estado.documentos.push(id);
    // No modo Pular, documentos já lidos em outra partida passam direto.
    if (window.Dialogo.pulando && window.Armazenamento.foiLido('doc:' + id)) return false;
    window.Armazenamento.marcarLido('doc:' + id);
    window.Dialogo.definirPular(false);
    modo = 'documento';
    window.Telas.documento(id, () => { if (modo === 'documento') continuar(); });
    return true;
  }

  function fimDeCapitulo(id) {
    const i = window.CAPITULOS.findIndex((cap) => cap.id === id);
    const cap = window.CAPITULOS[i];
    const proximo = window.CAPITULOS[i + 1];
    modo = 'fim';
    window.Dialogo.definirPular(false);
    window.Dialogo.definirAuto(false);
    window.Dialogo.esconderTudo();
    window.Palco.esconderTodos();
    // O salvamento automático aponta para o começo do próximo capítulo, se ele já existir.
    if (proximo && proximo.disponivel && window.Roteiro.posicao(proximo.inicio) !== undefined) {
      const atual = estado.atual;
      estado.atual = window.Roteiro.posicao(proximo.inicio);
      estado.capitulo = proximo.id;
      salvarAutomatico();
      estado.atual = atual;
      estado.capitulo = id;
    } else salvarAutomatico();
    window.Telas.fimCapitulo(cap, estado, proximo, () => {
      if (!proximo || !proximo.disponivel) return;
      irPara(proximo.inicio);
      continuar();
    });
    return true;
  }

  function mostrarFinal(id) {
    const dados = window.FINAIS.find((f) => f.id === id) || { id, titulo: id, tipo: 'alternativo' };
    modo = 'fim';
    window.Dialogo.definirPular(false);
    window.Dialogo.definirAuto(false);
    window.Dialogo.esconderTudo();
    window.Armazenamento.marcarFinal(id);
    $('#barra-jogo').hidden = true;
    const volta = window.Armazenamento.carregarJogo('auto');
    window.Telas.final(dados, !!volta, () => carregar(window.Armazenamento.carregarJogo('auto')));
    return true;
  }

  /* ---------- salvar e carregar ---------- */
  function fotografia() {
    const copia = window.Estado.copiar(estado);
    copia.pc = estado.atual;
    copia.tela.personagens = window.Palco.fotografia();
    const cap = capituloPorId(estado.capitulo);
    const trecho = estado.ultimaFala ? window.Dialogo.formatar(estado.ultimaFala.texto).replace(/_/g, '') : '';
    return {
      versao: 1,
      quando: Date.now(),
      nome: estado.nome,
      tituloCapitulo: cap ? (cap.numero ? `Cap. ${cap.numero} · ${cap.titulo}` : cap.titulo) : '',
      trecho: trecho.length > 90 ? trecho.slice(0, 88) + '…' : trecho,
      estado: copia,
    };
  }

  function salvar(espaco) {
    if (!emJogo) return false;
    return window.Armazenamento.salvarJogo(espaco, fotografia());
  }

  function salvarAutomatico() {
    if (emJogo && !carregando) window.Armazenamento.salvarJogo('auto', fotografia());
  }

  function carregar(dados) {
    if (!dados || !dados.estado) return;
    carregando = true;
    pararTudo();
    window.Telas.fecharTudo();
    estado = Object.assign(window.Estado.novo(), window.Estado.copiar(dados.estado));
    estado.pc = dados.estado.pc;
    emJogo = true;
    window.Dialogo.limparHistorico();
    window.Palco.reiniciar();
    window.Palco.cena(estado.tela.cena || 'preto', estado.tela.opcoes || {}, 'corte', true);
    window.Palco.restaurar(estado.tela.personagens);
    window.Som.iniciar();
    window.Som.musica(estado.tela.musica);
    window.Som.ambiente(estado.tela.ambiente);
    $('#barra-jogo').hidden = false;
    atualizarRotulo();
    const c = comandos[estado.pc];
    if (c && c.tipo === 'escolha' && estado.ultimaFala) {
      window.Dialogo.mostrar(estado.ultimaFala, { instantaneo: true, registrar: false });
    }
    modo = null;
    executar();
    carregando = false;
  }

  function novoJogo(nome) {
    pararTudo();
    estado = window.Estado.novo(nome);
    emJogo = true;
    window.Dialogo.limparHistorico();
    window.Palco.reiniciar();
    $('#barra-jogo').hidden = false;
    estado.pc = window.Roteiro.posicao('prologo') ?? 0;
    modo = null;
    executar();
  }

  function pararTudo() {
    clearTimeout(timerEspera);
    window.Escolhas.esconder();
    window.Dialogo.definirAuto(false);
    window.Dialogo.definirPular(false);
    window.Dialogo.esconderTudo();
    modo = null;
  }

  function irParaTitulo() {
    pararTudo();
    emJogo = false;
    window.Palco.reiniciar();
    window.Palco.cena('titulo', {}, 'corte', true);
    window.Som.musica('tema');
    window.Som.ambiente('vento');
    window.Telas.titulo();
  }

  /* Abrir o menu pausa os modos Auto e Pular. */
  function pausar() {
    window.Dialogo.definirAuto(false);
    window.Dialogo.definirPular(false);
  }

  /* ---------- entrada: clique, toque e teclado ---------- */
  function avancar() {
    if (!emJogo || window.Telas.painelAberto()) return;
    if (modo === 'fala') window.Dialogo.avancar();
    else if (modo === 'espera') fimDaEspera();
    else if (modo === 'cartao' && terminarCartao) terminarCartao();
  }

  window.Dialogo.aoContinuar = () => {
    if (modo === 'fala') continuar();
  };

  function ligarEntrada() {
    $('#caixa').addEventListener('click', (e) => {
      if (e.target.closest('button') && e.target.id !== 'bt-avancar') return;
      e.stopPropagation();
      window.Som.iniciar();
      avancar();
    });
    $('#bt-avancar').addEventListener('click', (e) => {
      e.stopPropagation();
      avancar();
    });
    // Clicar no cenário também avança.
    $('#palco').addEventListener('click', (e) => {
      if (e.target.closest('button, input, label, a, .tela, #escolhas, #barra-jogo')) return;
      window.Som.iniciar();
      avancar();
    });
    $('#palco').addEventListener('wheel', (e) => {
      if (emJogo && e.deltaY < 0 && !window.Telas.painelAberto() && (modo === 'fala' || modo === 'escolha')) window.Telas.painel('historico');
    }, { passive: true });

    $('.acoes-rapidas').addEventListener('click', (e) => {
      const b = e.target.closest('[data-acao]');
      if (!b) return;
      e.stopPropagation();
      const acao = b.dataset.acao;
      if (acao === 'auto') window.Dialogo.definirAuto(!window.Dialogo.auto);
      else if (acao === 'pular') window.Dialogo.definirPular(!window.Dialogo.pulando);
      else if (acao === 'menu') window.Telas.painel(window.innerWidth < 720 ? 'salvar' : 'diario');
      else window.Telas.painel(acao);
      b.blur();
    });

    document.addEventListener('keydown', (e) => {
      window.Som.iniciar();
      const telaConfirmacao = !$('#confirmacao').hidden;
      if (e.key === 'Escape') {
        if (telaConfirmacao) $('#bt-confirmar-nao').click();
        else if (window.Telas.painelAberto()) window.Telas.fecharPainel();
        else if (!$('#tela-documento').hidden) $('#bt-documento-fechar').click();
        else if (emJogo && (modo === 'fala' || modo === 'escolha')) window.Telas.painel('salvar');
        return;
      }
      if (!emJogo || window.Telas.painelAberto() || telaConfirmacao) return;
      if (e.target.closest && e.target.closest('input')) return;
      if (modo === 'escolha') {
        if (window.Escolhas.tecla(e)) e.preventDefault();
        return;
      }
      if (e.key === 'Control') {
        if (!pularSegurando && modo === 'fala') {
          pularSegurando = true;
          window.Dialogo.definirPular(true);
        }
        return;
      }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        const botao = e.target.closest && e.target.closest('button');
        if (botao && botao.id !== 'bt-avancar' && !botao.closest('.acoes-rapidas')) return; // o próprio botão cuida disso
        if (botao) botao.blur();
        e.preventDefault();
        avancar();
      } else if (e.key === 'a' || e.key === 'A') window.Dialogo.definirAuto(!window.Dialogo.auto);
      else if (e.key === 'h' || e.key === 'H') window.Telas.painel('historico');
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Control' && pularSegurando) {
        pularSegurando = false;
        window.Dialogo.definirPular(false);
      }
    });

    // Tela inicial
    $('#bt-novo').addEventListener('click', () => {
      window.Som.iniciar();
      const comecar = () => window.Telas.nome(novoJogo);
      if (window.Armazenamento.carregarJogo('auto')) {
        window.Telas.confirmar('Começar um novo jogo? O salvamento automático atual será substituído na primeira escolha. Os jogos salvos nos espaços continuam guardados.', comecar, 'Começar');
      } else comecar();
    });
    $('#bt-continuar').addEventListener('click', () => carregar(window.Armazenamento.carregarJogo('auto')));
    $('#bt-carregar').addEventListener('click', () => { window.Som.iniciar(); window.Telas.painel('carregar'); });
    $('#bt-configuracoes').addEventListener('click', () => { window.Som.iniciar(); window.Telas.painel('configuracoes'); });
    $('#bt-sobre').addEventListener('click', () => { window.Som.iniciar(); window.Telas.painel('sobre'); });

    // O navegador só libera som depois do primeiro toque.
    document.addEventListener('pointerdown', () => window.Som.iniciar(), { once: true });
  }

  /* ---------- início ---------- */
  function iniciar(dadosAoVivo) {
    if (window.Roteiro.avisos.length) console.warn('Avisos do roteiro:\n' + window.Roteiro.avisos.join('\n'));
    window.Telas.aplicarConfiguracoes(config);
    window.Telas.ligarBotoes();
    window.Telas.ornamentar();
    ligarEntrada();
    if (dadosAoVivo && dadosAoVivo.jogo) carregar(dadosAoVivo.jogo);
    else irParaTitulo();
  }

  // Quando a página publicada é atualizada, o visualizador do Claude mantém o jogo onde estava.
  try { window.claude?.hot?.snapshot?.(() => (emJogo ? { jogo: fotografia() } : {})); } catch { /* fora do visualizador */ }

  const api = {
    get estado() { return estado; },
    get config() { return config; },
    set config(c) { config = c; },
    get emJogo() { return emJogo; },
    get modo() { return modo; },
    salvar, carregar, novoJogo, irParaTitulo, pausar, avancar,
    // atalhos para testes automáticos
    escolher: (i) => document.querySelectorAll('#escolhas button')[i]?.click(),
    irPara: (rotulo) => { pararTudo(); irPara(rotulo); continuar(); },
  };

  const hot = window.claude?.hot;
  const comecar = () => {
    if (hot && typeof hot.ready === 'function') hot.ready(iniciar);
    else iniciar(hot?.data);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', comecar);
  else comecar();

  return api;
})();
