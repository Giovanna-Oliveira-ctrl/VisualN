/* =========================================================================
   TELAS E MENUS
   Tela inicial, ficha do nome, cartões de capítulo, documentos, fim de
   capítulo, finais, e o menu com Salvar, Carregar, Histórico, Diário,
   Configurações e Sobre.
   ========================================================================= */
window.Telas = (() => {
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
  const jogo = () => window.Jogo;

  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  /* ---------- ornamentos desenhados pela arte provisória ---------- */
  function ornamentar(raiz = document) {
    if (!window.Arte?.ornamento) return;
    for (const el of $$('[data-ornamento]', raiz)) {
      if (el.dataset.feito) continue;
      try { el.innerHTML = window.Arte.ornamento(el.dataset.ornamento); el.dataset.feito = '1'; } catch { /* sem ornamento */ }
    }
  }

  /* ---------- configurações visuais ---------- */
  function aplicarConfiguracoes(config) {
    const raiz = document.documentElement;
    const sistemaPedeMenos = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    raiz.classList.toggle('reduzir-animacoes', !!config.reduzirAnimacoes || sistemaPedeMenos);
    raiz.classList.toggle('alto-contraste', !!config.altoContraste);
    raiz.style.setProperty('--escala-texto', String(config.tamanhoTexto || 1));
    window.Som?.configurar(config);
  }

  /* ---------- avisos curtos ---------- */
  function aviso(texto, cor) {
    const el = criar('p', 'aviso', texto);
    if (cor) el.style.setProperty('--cor', cor);
    $('#avisos').append(el);
    setTimeout(() => el.remove(), 3300);
  }

  function marcarBotao(acao, ligado) {
    const b = $(`.acoes-rapidas [data-acao="${acao}"]`);
    if (b) b.setAttribute('aria-pressed', String(!!ligado));
  }

  /* ---------- confirmação ---------- */
  function confirmar(texto, aoSim, rotuloSim = 'Sim') {
    const tela = $('#confirmacao');
    $('#confirmacao-texto').textContent = texto;
    $('#bt-confirmar-sim').textContent = rotuloSim;
    tela.hidden = false;
    const fechar = () => { tela.hidden = true; };
    $('#bt-confirmar-sim').onclick = () => { fechar(); aoSim(); };
    $('#bt-confirmar-nao').onclick = fechar;
    requestAnimationFrame(() => $('#bt-confirmar-nao').focus());
  }

  /* ---------- tela inicial ---------- */
  function titulo() {
    fecharTudo();
    $('#barra-jogo').hidden = true;
    const auto = window.Armazenamento.carregarJogo('auto');
    $('#bt-continuar').disabled = !auto;
    $('#info-continuar').textContent = auto ? auto.tituloCapitulo || '' : '';
    $('#bt-carregar').disabled = !window.Armazenamento.existeAlgumJogo();
    $('#tela-titulo').hidden = false;
    ornamentar();
    requestAnimationFrame(() => $('#bt-novo').focus({ preventScroll: true }));
  }

  function nome(aoComecar) {
    $('#tela-titulo').hidden = true;
    const tela = $('#tela-nome');
    tela.hidden = false;
    ornamentar(tela);
    const campo = $('#campo-nome');
    requestAnimationFrame(() => { campo.focus(); campo.select(); });
    $('#form-nome').onsubmit = (e) => {
      e.preventDefault();
      const valor = campo.value.trim().replace(/\s+/g, ' ').slice(0, 16) || 'Clara';
      tela.hidden = true;
      aoComecar(valor);
    };
    $('#bt-nome-voltar').onclick = () => { tela.hidden = true; titulo(); };
  }

  /* ---------- cartão de capítulo ---------- */
  let timerCartao = null;
  function cartaoCapitulo(cap, aoTerminar, rapido) {
    const tela = $('#cartao-capitulo');
    $('.cartao-numero', tela).textContent = cap.numero ? `Capítulo ${ROMANOS[cap.numero]}` : cap.subtitulo || '';
    $('.cartao-titulo', tela).textContent = cap.titulo;
    $('.cartao-pecado', tela).textContent = cap.pecado ? `${cap.noite} · Pecado: ${cap.pecado}` : '';
    $('.cartao-epigrafe', tela).textContent = cap.epigrafe || '';
    ornamentar(tela);
    tela.hidden = false;
    tela.classList.remove('visivel');
    void tela.offsetWidth;
    tela.classList.add('visivel');
    let terminado = false;
    const terminar = () => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timerCartao);
      tela.onclick = null;
      aoTerminar();
      tela.classList.remove('visivel');
      setTimeout(() => { if (!tela.classList.contains('visivel')) tela.hidden = true; }, 750);
    };
    tela.onclick = terminar;
    timerCartao = setTimeout(terminar, rapido ? 350 : 4200);
    return terminar;
  }

  /* ---------- documentos ---------- */
  function documento(id, aoFechar, { doDiario = false } = {}) {
    const doc = window.DOCUMENTOS?.[id];
    if (!doc) { aoFechar && aoFechar(); return; }
    const formatar = (t) => window.Dialogo.formatar(t || '');
    const art = $('#documento');
    art.dataset.tipo = doc.tipo || 'carta';
    $('#doc-cabecalho').textContent = formatar(doc.cabecalho);
    $('#doc-cabecalho').hidden = !doc.cabecalho;
    $('#doc-titulo').textContent = formatar(doc.titulo);
    $('#doc-texto').textContent = formatar(doc.texto);
    $('#doc-assinatura').textContent = formatar(doc.assinatura);
    $('#doc-assinatura').hidden = !doc.assinatura;
    const ilu = $('#doc-ilustracao');
    ilu.innerHTML = '';
    if (doc.ilustracao && window.Arte?.ilustracao) {
      try { ilu.innerHTML = window.Arte.ilustracao(doc.ilustracao); } catch { /* sem ilustração */ }
    }
    $('#doc-nota').hidden = doDiario;
    $('#bt-documento-fechar').textContent = doDiario ? 'Fechar' : 'Continuar';
    const tela = $('#tela-documento');
    tela.hidden = false;
    art.style.animation = 'none';
    void art.offsetWidth;
    art.style.animation = '';
    window.Som?.efeito(doc.tipo === 'foto' ? 'carta' : 'pagina');
    requestAnimationFrame(() => $('#bt-documento-fechar').focus({ preventScroll: true }));
    $('#bt-documento-fechar').onclick = () => {
      tela.hidden = true;
      if (aoFechar) aoFechar();
    };
  }

  /* ---------- fim de capítulo ---------- */
  function fimCapitulo(cap, estado, proximo, aoProximo) {
    const tela = $('#tela-fim-capitulo');
    $('#fim-pre').textContent = cap.numero ? `Fim do Capítulo ${ROMANOS[cap.numero]}` : 'Fim do prólogo';
    $('#fim-titulo').textContent = cap.titulo;
    const resumo = $('#fim-resumo');
    resumo.replaceChildren(blocoAfinidades(estado), blocoDocumentos(estado), blocoProximo(proximo));
    const bt = $('#bt-proximo-capitulo');
    bt.disabled = !proximo || !proximo.disponivel;
    bt.textContent = !proximo ? 'Fim' : proximo.disponivel ? (proximo.numero ? `Capítulo ${ROMANOS[proximo.numero]}` : 'Continuar') : 'Em breve';
    bt.onclick = () => { tela.hidden = true; aoProximo(); };
    $('#bt-fim-salvar').onclick = () => painel('salvar');
    $('#bt-fim-menu').onclick = () => jogo().irParaTitulo();
    tela.hidden = false;
    requestAnimationFrame(() => (bt.disabled ? $('#bt-fim-salvar') : bt).focus({ preventScroll: true }));
  }

  function blocoAfinidades(estado) {
    const bloco = criar('section', 'resumo-bloco');
    bloco.append(criar('h3', '', 'Afinidade'));
    for (const id of window.Estado.romances()) {
      const p = window.PERSONAGENS[id];
      if (p.secreto && !estado.vars.viuAdrian) continue;
      bloco.append(linhaAfinidade(id, estado));
    }
    return bloco;
  }

  function linhaAfinidade(id, estado) {
    const p = window.PERSONAGENS[id];
    const linha = criar('div', 'afinidade-linha');
    const revelado = !p.revelaCom || estado.vars[p.revelaCom];
    linha.append(criar('span', 'afinidade-nome', revelado ? p.nome : p.nomeAntes || '???'));
    linha.append(medidor(estado.afinidade[id], p.cor));
    linha.title = `Afinidade: ${estado.afinidade[id]}`;
    return linha;
  }

  function medidor(valor, cor) {
    const m = criar('span', 'medidor');
    m.style.setProperty('--cor', cor);
    m.setAttribute('role', 'img');
    m.setAttribute('aria-label', `Afinidade ${valor} de 10`);
    for (let i = 1; i <= 10; i++) {
      const pedaco = criar('i');
      if (valor >= i) pedaco.className = 'cheio';
      m.append(pedaco);
    }
    return m;
  }

  function blocoDocumentos(estado) {
    const bloco = criar('section', 'resumo-bloco');
    const total = Object.keys(window.DOCUMENTOS).length;
    bloco.append(criar('h3', '', `Documentos ${estado.documentos.length}/${total}`));
    const ul = criar('ul');
    for (const id of estado.documentos) ul.append(criar('li', '', window.Dialogo.formatar(window.DOCUMENTOS[id].titulo)));
    bloco.append(ul);
    return bloco;
  }

  function blocoProximo(proximo) {
    const bloco = criar('section', 'resumo-bloco');
    bloco.append(criar('h3', '', 'A seguir'));
    if (!proximo) bloco.append(criar('p', '', 'Fim da história.'));
    else {
      bloco.append(criar('p', '', `${proximo.numero ? `Capítulo ${ROMANOS[proximo.numero]}: ` : ''}${proximo.titulo}${proximo.pecado ? ` · ${proximo.pecado}` : ''}`));
      if (!proximo.disponivel) bloco.append(criar('p', '', 'Ainda não escrito. Salve o jogo para continuar daqui quando ele chegar.'));
    }
    return bloco;
  }

  /* ---------- finais ---------- */
  function final(dadosFinal, temVolta, aoVoltar) {
    const lista = window.FINAIS || [];
    const vistos = window.Armazenamento.finaisVistos();
    $('#final-tipo').textContent = window.TIPOS_DE_FINAL[dadosFinal.tipo] || 'Final';
    $('#final-titulo').textContent = dadosFinal.titulo;
    $('#final-descricao').textContent = dadosFinal.descricao || '';
    const qtd = lista.filter((f) => vistos[f.id]).length;
    $('#final-contagem').textContent = `Finais encontrados: ${qtd} de ${lista.length} planejados.`;
    $('#bt-final-voltar').hidden = !temVolta;
    $('#bt-final-voltar').onclick = aoVoltar;
    $('#bt-final-menu').onclick = () => jogo().irParaTitulo();
    $('#tela-final').hidden = false;
    requestAnimationFrame(() => $(temVolta ? '#bt-final-voltar' : '#bt-final-menu').focus({ preventScroll: true }));
  }

  /* ---------- painel do menu ---------- */
  const NOMES_ABAS = { salvar: 'Salvar', carregar: 'Carregar', historico: 'Histórico', diario: 'Diário', configuracoes: 'Configurações', sobre: 'Sobre', sair: 'Menu principal' };
  const SO_NO_JOGO = ['salvar', 'historico', 'diario', 'sair'];
  let abaAtual = 'salvar';
  let subDiario = 'relacoes';

  function painel(aba) {
    const emJogo = !!jogo()?.emJogo;
    if (!emJogo && SO_NO_JOGO.includes(aba)) aba = 'configuracoes';
    jogo()?.pausar();
    $$('.painel-abas [data-aba]').forEach((b) => {
      b.disabled = !emJogo && SO_NO_JOGO.includes(b.dataset.aba);
    });
    $('#painel').hidden = false;
    mostrarAba(aba);
  }

  function fecharPainel() {
    $('#painel').hidden = true;
    if (window.Escolhas.aberta) $('#escolhas button')?.focus({ preventScroll: true });
  }

  function painelAberto() {
    return !$('#painel').hidden;
  }

  function mostrarAba(aba) {
    abaAtual = aba;
    $('#painel-titulo').textContent = NOMES_ABAS[aba];
    $$('.painel-abas [data-aba]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === aba)));
    const corpo = $('#painel-corpo');
    corpo.replaceChildren();
    corpo.scrollTop = 0;
    ({ salvar: abaEspacos, carregar: abaEspacos, historico: abaHistorico, diario: abaDiario, configuracoes: abaConfiguracoes, sobre: abaSobre, sair: abaSair })[aba](corpo, aba);
  }

  function dataCurta(ms) {
    const d = new Date(ms);
    const dois = (n) => String(n).padStart(2, '0');
    return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} às ${dois(d.getHours())}:${dois(d.getMinutes())}`;
  }

  function abaEspacos(corpo, aba) {
    const salvando = aba === 'salvar';
    corpo.append(criar('p', 'texto-suave', salvando
      ? 'Escolha um espaço para guardar o jogo. O jogo também salva sozinho a cada escolha e a cada capítulo.'
      : 'O espaço Automático guarda a última escolha ou o último capítulo.'));
    const grade = criar('div', 'espacos');
    for (const { espaco, dados } of window.Armazenamento.listarJogos()) {
      if (salvando && espaco === 'auto') continue;
      const b = criar('button', 'espaco');
      b.type = 'button';
      b.append(criar('span', 'espaco-num', espaco === 'auto' ? 'A' : String(espaco)));
      if (dados) {
        b.append(criar('span', 'espaco-titulo', `${espaco === 'auto' ? 'Automático · ' : ''}${dados.tituloCapitulo || ''}`));
        b.append(criar('span', 'espaco-detalhe', `${dados.nome} · ${dataCurta(dados.quando)} · ${dados.trecho || ''}`));
      } else {
        b.append(criar('span', 'espaco-titulo', espaco === 'auto' ? 'Automático' : 'Vazio'));
        b.append(criar('span', 'espaco-detalhe', salvando ? 'Salvar aqui' : '—'));
      }
      b.disabled = !salvando && !dados;
      b.addEventListener('click', () => {
        if (salvando) {
          const gravar = () => {
            const ok = jogo().salvar(espaco);
            aviso(ok ? 'Jogo salvo.' : 'Não foi possível salvar: o navegador bloqueou o armazenamento.');
            mostrarAba('salvar');
          };
          if (dados) confirmar(`Substituir o jogo salvo no espaço ${espaco}?`, gravar, 'Substituir');
          else gravar();
        } else {
          fecharPainel();
          jogo().carregar(dados);
        }
      });
      grade.append(b);
    }
    corpo.append(grade);
  }

  function abaHistorico(corpo) {
    const lista = criar('div', 'historico');
    const itens = window.Dialogo.historico;
    if (!itens.length) lista.append(criar('p', 'texto-suave', 'Nada por aqui ainda.'));
    for (const h of itens) {
      const p = criar('p', 'hist-item' + (h.escolha ? ' escolha' : h.quem === 'memoria' ? ' memoria' : !h.nome ? ' narracao' : ''));
      if (h.nome) p.append(criar('b', '', h.nome));
      p.append(document.createTextNode(h.escolha ? `Você escolheu: ${h.texto}` : h.texto));
      lista.append(p);
    }
    corpo.append(lista);
    requestAnimationFrame(() => { corpo.scrollTop = corpo.scrollHeight; });
  }

  function abaDiario(corpo) {
    const estado = jogo().estado;
    const sub = criar('div', 'diario-sub');
    for (const [id, rotulo] of [['relacoes', 'Relações'], ['documentos', 'Documentos'], ['escolhas', 'Escolhas'], ['finais', 'Finais']]) {
      const b = criar('button', '', rotulo);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(subDiario === id));
      b.addEventListener('click', () => { subDiario = id; mostrarAba('diario'); });
      sub.append(b);
    }
    corpo.append(sub);
    if (subDiario === 'relacoes') diarioRelacoes(corpo, estado);
    else if (subDiario === 'documentos') diarioDocumentos(corpo, estado);
    else if (subDiario === 'escolhas') diarioEscolhas(corpo, estado);
    else diarioFinais(corpo);
  }

  function diarioRelacoes(corpo, estado) {
    corpo.append(criar('p', 'texto-suave', 'A afinidade muda com as suas escolhas. A rota de cada personagem é decidida no Capítulo 3.'));
    const grade = criar('div', 'relacoes');
    for (const id of window.Estado.romances()) {
      const p = window.PERSONAGENS[id];
      const rota = window.ROTAS?.[id];
      const card = criar('article', 'relacao');
      card.style.setProperty('--cor', p.cor);
      const retrato = criar('div', 'relacao-retrato');
      const info = criar('div');
      if (p.secreto && !estado.vars.viuAdrian) {
        card.classList.add('trancada');
        info.append(criar('h4', '', '???'), criar('p', 'relacao-titulo', 'Rota secreta'), criar('p', '', rota?.dica || 'Ainda não encontrada.'));
        card.append(retrato, info);
        grade.append(card);
        continue;
      }
      try { retrato.append(window.Arte.personagem(id, 'neutro', {})); } catch { /* sem retrato */ }
      const revelado = !p.revelaCom || estado.vars[p.revelaCom];
      info.append(criar('h4', '', revelado ? p.nomeCompleto : p.nomeAntes || '???'));
      info.append(criar('p', 'relacao-titulo', p.titulo));
      info.append(medidor(estado.afinidade[id], p.cor));
      info.append(criar('p', '', revelado ? p.descricao : 'Você não sabe quem ele é. Mas ele parece saber quem você é.'));
      if (rota) {
        const possivel = window.Estado.avaliar(estado, rota.requisito);
        info.append(criar('p', '', possivel ? 'Rota possível.' : `Rota: ${rota.tema}`));
      }
      card.append(retrato, info);
      grade.append(card);
    }
    corpo.append(grade);
  }

  function diarioDocumentos(corpo, estado) {
    corpo.append(criar('p', 'texto-suave', 'Cartas, fotos e páginas que você encontrou. Toque em um para reler.'));
    const grade = criar('div', 'lista-docs');
    for (const [id, doc] of Object.entries(window.DOCUMENTOS)) {
      const achado = estado.documentos.includes(id);
      const b = criar('button', achado ? '' : 'doc-trancado', achado ? window.Dialogo.formatar(doc.titulo) : 'Não encontrado');
      b.type = 'button';
      b.disabled = !achado;
      if (achado) b.addEventListener('click', () => documento(id, null, { doDiario: true }));
      grade.append(b);
    }
    corpo.append(grade);
  }

  function diarioEscolhas(corpo, estado) {
    if (!estado.escolhas.length) {
      corpo.append(criar('p', 'texto-suave', 'Você ainda não fez nenhuma escolha.'));
      return;
    }
    const nomeCap = (id) => (window.CAPITULOS.find((c) => c.id === id) || {}).titulo || id;
    const ol = criar('ol', 'lista-escolhas');
    let capAnterior = null;
    for (const e of estado.escolhas) {
      const li = criar('li');
      if (e.capitulo !== capAnterior) {
        li.append(criar('b', '', nomeCap(e.capitulo) + ': '));
        capAnterior = e.capitulo;
      }
      li.append(document.createTextNode(e.texto));
      ol.append(li);
    }
    corpo.append(ol);
  }

  function diarioFinais(corpo) {
    corpo.append(criar('p', 'texto-suave', 'Todos os finais planejados para a história completa. Os trancados ainda não foram encontrados ou ainda não foram escritos.'));
    const vistos = window.Armazenamento.finaisVistos();
    const lista = criar('div', 'lista-finais');
    for (const f of window.FINAIS) {
      const visto = !!vistos[f.id];
      const item = criar('div', 'final-item' + (visto ? '' : ' trancado'));
      item.append(criar('span', '', window.TIPOS_DE_FINAL[f.tipo]));
      item.append(criar('h4', '', visto ? f.titulo : '???'));
      item.append(criar('p', '', visto ? f.descricao : f.disponivel ? f.dica : `${f.dica} (ainda não disponível)`));
      lista.append(item);
    }
    corpo.append(lista);
  }

  function abaConfiguracoes(corpo) {
    const config = jogo().config;
    const salvar = () => {
      window.Armazenamento.salvarConfiguracoes(config);
      aplicarConfiguracoes(config);
    };
    const opcoes = criar('div', 'opcoes');
    const faixa = (id, rotulo, min, max, passo, chave, mostrar, ajuda) => {
      const bloco = criar('div', 'opcao');
      const label = criar('label', 'faixa', rotulo);
      label.htmlFor = id;
      const out = criar('output', '', mostrar(config[chave]));
      label.append(out);
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', id, min, max, step: passo, value: config[chave] });
      input.addEventListener('input', () => {
        config[chave] = Number(input.value);
        out.textContent = mostrar(config[chave]);
        salvar();
      });
      bloco.append(label, input);
      if (ajuda) bloco.append(criar('small', '', ajuda));
      opcoes.append(bloco);
    };
    const marca = (id, rotulo, chave, ajuda) => {
      const bloco = criar('div', 'opcao');
      const label = criar('label', 'opcao-check');
      const input = document.createElement('input');
      Object.assign(input, { type: 'checkbox', id, checked: !!config[chave] });
      input.addEventListener('change', () => { config[chave] = input.checked; salvar(); });
      label.append(input, document.createTextNode(rotulo));
      bloco.append(label);
      if (ajuda) bloco.append(criar('small', '', ajuda));
      opcoes.append(bloco);
    };
    const pct = (v) => `${Math.round(v * 100)}%`;
    opcoes.append(criar('h3', '', 'Texto'));
    faixa('cfg-velocidade', 'Velocidade do texto', 10, 100, 5, 'velocidadeTexto', (v) => (v <= 25 ? 'lenta' : v <= 60 ? 'média' : 'rápida'));
    marca('cfg-instantaneo', 'Texto instantâneo', 'textoInstantaneo', 'Mostra cada fala inteira de uma vez.');
    faixa('cfg-tamanho', 'Tamanho do texto', 0.85, 1.3, 0.05, 'tamanhoTexto', pct);
    faixa('cfg-auto', 'Pausa do modo Auto', 0.5, 2, 0.1, 'pausaAuto', (v) => `${v.toFixed(1).replace('.', ',')}×`, 'Quanto maior, mais tempo cada fala fica na tela no modo Auto.');
    marca('cfg-pular', 'Pular só o que já foi lido', 'pularSoLido', 'O botão Pular para sozinho quando chega em um texto novo.');
    marca('cfg-afinidade', 'Avisar mudanças de afinidade', 'avisosAfinidade', 'Mostra avisos como "Lucien vai se lembrar disso."');
    opcoes.append(criar('h3', '', 'Som'));
    faixa('cfg-vol-geral', 'Volume geral', 0, 1, 0.05, 'volumeGeral', pct);
    faixa('cfg-vol-musica', 'Música', 0, 1, 0.05, 'volumeMusica', pct);
    faixa('cfg-vol-efeitos', 'Efeitos e ambiente', 0, 1, 0.05, 'volumeEfeitos', pct);
    marca('cfg-musica', 'Música ligada', 'musicaLigada');
    marca('cfg-efeitos', 'Efeitos sonoros ligados', 'efeitosLigados');
    opcoes.append(criar('h3', '', 'Acessibilidade'));
    marca('cfg-animacoes', 'Reduzir animações', 'reduzirAnimacoes', 'Tira tremores, clarões e movimentos. Se o seu aparelho já pede menos movimento, o jogo respeita.');
    marca('cfg-contraste', 'Alto contraste', 'altoContraste', 'Caixa de diálogo mais escura e texto mais claro.');
    const restaurar = criar('button', 'botao', 'Restaurar configurações padrão');
    restaurar.type = 'button';
    restaurar.addEventListener('click', () => {
      jogo().config = { ...window.Armazenamento.PADRAO };
      window.Armazenamento.salvarConfiguracoes(jogo().config);
      aplicarConfiguracoes(jogo().config);
      mostrarAba('configuracoes');
    });
    const apagar = criar('button', 'botao', 'Apagar todos os dados do jogo');
    apagar.type = 'button';
    apagar.addEventListener('click', () => confirmar('Apagar todos os jogos salvos, finais encontrados e configurações deste navegador? Não dá para desfazer.', () => {
      window.Armazenamento.apagarTudo();
      jogo().config = window.Armazenamento.configuracoes();
      aplicarConfiguracoes(jogo().config);
      aviso('Dados apagados.');
      if (!jogo().emJogo) titulo();
      mostrarAba('configuracoes');
    }, 'Apagar tudo'));
    const acoes = criar('div', 'acoes');
    acoes.append(restaurar, apagar);
    opcoes.append(acoes);
    corpo.append(opcoes);
  }

  function abaSobre(corpo) {
    const s = criar('div', 'sobre');
    s.innerHTML = `
      <h3>Sete Noites de Pecado</h3>
      <p><em>Seven Nights of Sin.</em> Dark romance, mistério psicológico e dark academia. Em Bellgrave, uma cidade antiga cercada por um lago e por florestas, uma bolsista chega à Universidade de Saint Agnes e recebe um convite assinado por uma moça desaparecida há sete anos.</p>
      <p>Esta é a primeira versão jogável: prólogo e Capítulo 1 de sete. Suas escolhas mudam a afinidade com Lucien, Dorian, Elias e Cassian, liberam cenas e preparam as rotas dos próximos capítulos. Há também uma rota secreta.</p>
      <h3>Como jogar</h3>
      <dl>
        <dt>Avançar</dt><dd>Clique ou toque na caixa de diálogo, no botão Avançar, ou aperte <kbd>Espaço</kbd> / <kbd>Enter</kbd>.</dd>
        <dt>Escolher</dt><dd>Toque na opção ou aperte o número dela.</dd>
        <dt>Menu</dt><dd>Botão Menu ou <kbd>Esc</kbd>.</dd>
        <dt>Histórico</dt><dd><kbd>H</kbd> ou role a roda do mouse para cima.</dd>
        <dt>Auto e Pular</dt><dd><kbd>A</kbd> liga o modo Auto. Segurar <kbd>Ctrl</kbd> pula o texto já lido.</dd>
        <dt>Salvar</dt><dd>O jogo salva sozinho a cada escolha. Há 8 espaços para salvar quando quiser.</dd>
      </dl>
      <h3>Aviso de conteúdo</h3>
      <p>Desaparecimento, incêndio, luto, amnésia, manipulação emocional, festas clandestinas e sustos leves. Sem cenas explícitas.</p>
      <h3>Créditos</h3>
      <p>História, código, música sintetizada e arte provisória criados para este projeto, sem imagens ou sons de terceiros. Fontes Bodoni Moda e Spectral, do Google Fonts (licença livre SIL OFL).</p>
      <p>Versão 0.1 · protótipo.</p>`;
    corpo.append(s);
  }

  function abaSair(corpo) {
    const box = criar('div', 'confirmacao-caixa');
    box.append(criar('p', '', 'Voltar para a tela inicial? O jogo salva sozinho a cada escolha, então você pode continuar depois a partir da última escolha. Se quiser guardar exatamente este ponto, salve antes.'));
    const acoes = criar('div', 'acoes');
    const sim = criar('button', 'botao principal', 'Ir para a tela inicial');
    sim.type = 'button';
    sim.addEventListener('click', () => jogo().irParaTitulo());
    const salvarAntes = criar('button', 'botao', 'Salvar antes');
    salvarAntes.type = 'button';
    salvarAntes.addEventListener('click', () => mostrarAba('salvar'));
    acoes.append(sim, salvarAntes);
    box.append(acoes);
    corpo.append(box);
  }

  function fecharTudo() {
    ['#tela-titulo', '#tela-nome', '#cartao-capitulo', '#tela-documento', '#tela-fim-capitulo', '#tela-final', '#painel', '#confirmacao'].forEach((s) => { $(s).hidden = true; });
    $('#cartao-capitulo').classList.remove('visivel');
    clearTimeout(timerCartao);
  }

  /* ---------- botões fixos ---------- */
  function ligarBotoes() {
    $('.painel-abas').addEventListener('click', (e) => {
      const b = e.target.closest('[data-aba]');
      if (b && !b.disabled) mostrarAba(b.dataset.aba);
    });
    $('#bt-painel-fechar').addEventListener('click', fecharPainel);
    $('#painel').addEventListener('click', (e) => { if (e.target.id === 'painel') fecharPainel(); });
  }

  return {
    ornamentar, aplicarConfiguracoes, aviso, marcarBotao, confirmar,
    titulo, nome, cartaoCapitulo, documento, fimCapitulo, final,
    painel, fecharPainel, painelAberto, mostrarAba, fecharTudo, ligarBotoes,
    get abaAtual() { return abaAtual; },
  };
})();
