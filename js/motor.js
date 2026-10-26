/* Sete Velas — motor da visual novel */
(() => {
  'use strict';

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const movimentoReduzido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BLOQUEIA = true;

  /* ---------- armazenamento (tudo protegido: o navegador pode recusar) ---------- */
  const PREFIXO = 'setevelas:';
  const Guarda = {
    ler(chave, padrao) {
      try {
        const v = localStorage.getItem(PREFIXO + chave);
        return v ? JSON.parse(v) : padrao;
      } catch { return padrao; }
    },
    gravar(chave, valor) {
      try { localStorage.setItem(PREFIXO + chave, JSON.stringify(valor)); return true; } catch { return false; }
    },
    apagar(chave) {
      try { localStorage.removeItem(PREFIXO + chave); } catch { /* sem armazenamento */ }
    },
  };

  /* ---------- opções ---------- */
  const OPCOES_PADRAO = { velocidade: 45, auto: 1, volGeral: 0.8, volMusica: 0.7, volEfeitos: 0.9, flashes: true, tremor: true };
  let opcoes = { ...OPCOES_PADRAO, ...Guarda.ler('opcoes', {}) };
  function salvarOpcoes() {
    Guarda.gravar('opcoes', opcoes);
    window.Som?.volumes({ geral: opcoes.volGeral, musica: opcoes.volMusica, efeitos: opcoes.volEfeitos });
  }

  /* ---------- roteiro ---------- */
  function compilar(fonte) {
    const rotulos = {};
    const cmds = [];
    let escolha = null;
    fonte.split('\n').forEach((bruta, i) => {
      const linha = i + 1;
      const l = bruta.trim();
      if (!l || l.startsWith('//')) return;
      if (l.startsWith('#')) {
        rotulos[l.slice(1).trim()] = cmds.length;
        escolha = null;
        return;
      }
      if (l.startsWith('>')) {
        if (!escolha) {
          escolha = { t: 'escolha', opcoes: [], linha };
          cmds.push(escolha);
        }
        escolha.opcoes.push(lerOpcao(l.slice(1).trim(), linha));
        return;
      }
      escolha = null;
      if (l.startsWith('@')) {
        const corpo = l.slice(1);
        const nome = corpo.split(/\s+/)[0];
        const raw = corpo.slice(nome.length).trim();
        cmds.push({ t: 'cmd', nome, raw, args: raw ? raw.split(/\s+/) : [], linha });
        return;
      }
      const m = l.match(/^([A-Z?]):\s*(.*)$/);
      cmds.push(m ? { t: 'fala', quem: m[1], texto: m[2], linha } : { t: 'fala', quem: null, texto: l, linha });
    });
    return { rotulos, cmds };
  }

  function lerOpcao(s, linha) {
    let cond = null;
    let sets = [];
    const mc = s.match(/\[se\s+([^\]]+)\]\s*$/);
    if (mc) { cond = mc[1].trim(); s = s.slice(0, mc.index).trim(); }
    const ms = s.match(/->\s*\w+\s*\{([^}]*)\}\s*$/);
    if (ms) {
      sets = ms[1].split(',').map((x) => x.trim()).filter(Boolean);
      s = s.slice(0, s.lastIndexOf('{')).trim();
    }
    const mj = s.match(/^(.*?)\s*->\s*(\w+)$/);
    if (!mj) throw new Error('Opção mal escrita na linha ' + linha + ': ' + s);
    return { texto: mj[1], vai: mj[2], sets, cond, linha };
  }

  const PROG = compilar(window.HISTORIA || '');

  /* ---------- estado ---------- */
  function novoEstado(nome = 'Ariel', li = 'helena') {
    return {
      nome, li, vars: {}, pc: 0, atual: 0,
      cena: { nome: 'preto', opts: {} }, fx: [], sprites: {},
      musica: 'nada', ambiente: 'nada', capitulo: 'Prólogo', ultimaFala: null,
    };
  }
  let estado = novoEstado();
  let emJogo = false;
  let historico = [];

  const nomeLi = () => (estado.li === 'heitor' ? 'Heitor' : 'Helena');

  function formatar(t) {
    return String(t)
      .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, masc, fem) => (estado.li === 'heitor' ? masc : fem))
      .replace(/\{nome\}/g, estado.nome)
      .replace(/\{li\}/g, nomeLi());
  }

  const FALANTES = {
    L: () => (estado.vars.conhece ? nomeLi() : '???'),
    C: () => 'Dona Cida',
    E: () => estado.nome,
    R: () => 'Rosa',
    H: () => '???',
    '?': () => '???',
  };

  function valor(x, ladoDireito) {
    x = x.trim();
    if (/^-?\d+(\.\d+)?$/.test(x)) return Number(x);
    if (x === 'li') return estado.li;
    if (x in estado.vars) return estado.vars[x];
    return ladoDireito ? x : 0;
  }

  function avaliar(cond) {
    return cond.split('||').some((parte) => parte.split('&&').every((termo) => {
      let t = termo.trim();
      let negar = false;
      while (t.startsWith('!')) { negar = !negar; t = t.slice(1).trim(); }
      const m = t.match(/^(\w+)\s*(>=|<=|==|!=|>|<)\s*(\S+)$/);
      let r;
      if (m) {
        const a = valor(m[1]);
        const b = valor(m[3], true);
        r = { '>=': a >= b, '<=': a <= b, '==': a == b, '!=': a != b, '>': a > b, '<': a < b }[m[2]]; // eslint-disable-line eqeqeq
      } else r = !!valor(t);
      return negar ? !r : r;
    }));
  }

  function soma(expr) {
    let total = 0;
    const re = /([+-]?)\s*(\w+)/g;
    let m;
    while ((m = re.exec(expr))) {
      const v = /^\d+$/.test(m[2]) ? Number(m[2]) : Number(estado.vars[m[2]]) || 0;
      total += m[1] === '-' ? -v : v;
    }
    return total;
  }

  function aplicarSet(texto) {
    for (const parte of texto.split(',')) {
      const m = parte.trim().match(/^(\w+)\s*(\+=|-=|=)\s*(.+)$/);
      if (!m) continue;
      const v = soma(m[3]);
      const atual = Number(estado.vars[m[1]]) || 0;
      estado.vars[m[1]] = m[2] === '=' ? v : m[2] === '+=' ? atual + v : atual - v;
    }
  }

  /* ---------- palco ---------- */
  const palco = $('#palco');
  const cvFundo = $('#fundo');
  const ctxFundo = cvFundo.getContext('2d');
  const cvTrans = $('#transicao');
  const ctxTrans = cvTrans.getContext('2d');
  const cvFx = $('#efeitos');
  const ctxFx = cvFx.getContext('2d');
  const camadaPersonagens = $('#personagens');
  let W = 0, H = 0, DPR = 1;
  let cenaAtual = { nome: 'preto', opts: {}, inicio: performance.now(), cache: {} };
  const imagens = {};
  const spritesVivos = {};

  function imagem(url) {
    if (!url) return null;
    let r = imagens[url];
    if (!r) {
      r = imagens[url] = { img: new Image(), ok: false };
      r.img.onload = () => { r.ok = true; };
      r.img.src = url;
    }
    return r.ok ? r.img : null;
  }

  function urlCena(nome, opts) {
    const tabela = (window.ARTE && window.ARTE.cenas) || {};
    if (nome === 'retrato') return tabela['retrato_' + estado.li] || null;
    for (const flag of ['escuro', 'vulto', 'aberta']) {
      if (opts[flag] && tabela[nome + '_' + flag]) return tabela[nome + '_' + flag];
    }
    return tabela[nome] || null;
  }

  function urlPersonagem(id, expr) {
    const tabela = (window.ARTE && window.ARTE.personagens) || {};
    return tabela[id + '_' + expr] || tabela[id + '_neutro'] || null;
  }

  function redimensionar() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = palco.clientWidth;
    H = palco.clientHeight;
    for (const cv of [cvFundo, cvTrans, cvFx]) {
      cv.width = Math.max(1, Math.round(W * DPR));
      cv.height = Math.max(1, Math.round(H * DPR));
    }
    cenaAtual.cache = {};
    Object.values(spritesVivos).forEach(dimensionarSprite);
    Efeitos.redimensionar();
  }

  function cobrir(ctx, vw, vh) {
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    const s = Math.max(cw / vw, ch / vh);
    ctx.setTransform(s, 0, 0, s, (cw - vw * s) / 2, (ch - vh * s) / 2);
  }

  function desenharFundo(agora) {
    const ctx = ctxFundo;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cvFundo.width, cvFundo.height);
    const { nome, opts } = cenaAtual;
    if (nome === 'preto') return;
    const img = imagem(urlCena(nome, opts));
    if (img) {
      cobrir(ctx, img.naturalWidth, img.naturalHeight);
      ctx.drawImage(img, 0, 0);
      if (opts.escuro && !urlCena(nome, opts).includes('_escuro')) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(2, 3, 8, 0.7)';
        ctx.fillRect(0, 0, cvFundo.width, cvFundo.height);
      }
      return;
    }
    if (!window.Pintor) return;
    cobrir(ctx, 1600, 900);
    try {
      ctx.save();
      window.Pintor.cena(nome, ctx, (agora - cenaAtual.inicio) / 1000, { ...opts, li: estado.li }, cenaAtual.cache);
      ctx.restore();
    } catch (e) {
      if (!cenaAtual.erro) console.error('Pintor.cena', nome, e);
      cenaAtual.erro = true;
    }
  }

  function lerOpcoesCena(args) {
    const opts = {};
    let modo = 'fade';
    for (const a of args) {
      if (a === 'fade' || a === 'corte' || a === 'preto') { modo = a; continue; }
      const m = a.match(/^(\w+)=(.+)$/);
      if (m) {
        let v = m[2];
        if (v.startsWith('$')) v = estado.vars[v.slice(1)] ?? 0;
        opts[m[1]] = isNaN(Number(v)) ? v : Number(v);
      } else opts[a] = true;
    }
    return { opts, modo };
  }

  let cartaoVisivel = false;
  function trocarCena(nome, opts, modo) {
    estado.cena = { nome, opts };
    const aplicar = () => {
      cenaAtual = { nome, opts, inicio: performance.now(), cache: {} };
      desenharFundo(performance.now());
    };
    if (pulando || cartaoVisivel || carregando) modo = 'corte';
    if (modo === 'corte') { aplicar(); return; }
    if (modo === 'fade') {
      ctxTrans.setTransform(1, 0, 0, 1, 0, 0);
      ctxTrans.clearRect(0, 0, cvTrans.width, cvTrans.height);
      ctxTrans.drawImage(cvFundo, 0, 0);
      cvTrans.style.transition = 'none';
      cvTrans.style.opacity = '1';
      aplicar();
      void cvTrans.offsetWidth;
      cvTrans.style.transition = 'opacity 0.9s ease';
      cvTrans.style.opacity = '0';
      return;
    }
    // preto: escurece, troca e segue; a cortina abre sozinha
    const cortina = $('#cortina');
    cortina.classList.add('fechada');
    setTimeout(() => {
      aplicar();
      setTimeout(() => cortina.classList.remove('fechada'), 120);
      modoAtual = null;
      executarAte();
    }, 480);
    modoAtual = 'transicao';
    return BLOQUEIA;
  }

  /* ---------- personagens ---------- */
  const idPersonagem = (quem) => (quem === 'li' ? estado.li : quem);

  function posX(pos) {
    const estreito = W < 700;
    return { esq: estreito ? '30%' : '27%', centro: '50%', dir: estreito ? '70%' : '73%' }[pos] || '50%';
  }

  function dimensionarSprite(s) {
    const h = Math.min(H * 0.9, W * 0.95 * 1.5);
    const w = (h * 2) / 3;
    s.el.style.width = w + 'px';
    s.el.style.height = h + 'px';
    s.cv.width = Math.max(1, Math.round(w * DPR));
    s.cv.height = Math.max(1, Math.round(h * DPR));
    s.el.style.setProperty('--x', posX(s.pos));
  }

  function mostrarSprite(quem, expr, pos) {
    let s = spritesVivos[quem];
    if (!s) {
      const el = document.createElement('div');
      el.className = 'sprite' + (carregando || pulando ? '' : ' entrando');
      const cv = document.createElement('canvas');
      const img = document.createElement('img');
      img.alt = '';
      img.hidden = true;
      el.append(cv, img);
      camadaPersonagens.append(el);
      s = spritesVivos[quem] = { quem, el, cv, ctx: cv.getContext('2d'), img, cache: {}, t0: performance.now(), expr: 'neutro', pos: 'centro' };
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('entrando')));
    }
    if (expr && expr !== s.expr) { s.expr = expr; s.cache = {}; }
    if (pos) s.pos = pos;
    dimensionarSprite(s);
    estado.sprites[quem] = { expr: s.expr, pos: s.pos };
    desenharSprite(s, performance.now());
  }

  function esconderSprite(quem, imediato) {
    const s = spritesVivos[quem];
    delete estado.sprites[quem];
    if (!s) return;
    delete spritesVivos[quem];
    if (imediato || pulando) { s.el.remove(); return; }
    s.el.classList.add('saindo');
    setTimeout(() => s.el.remove(), 600);
  }

  function esconderTodos(imediato) {
    Object.keys(spritesVivos).forEach((q) => esconderSprite(q, imediato));
    estado.sprites = {};
  }

  function destacarFalante(quem) {
    const ativo = quem === 'L' ? 'li' : quem === 'C' ? 'cida' : null;
    for (const s of Object.values(spritesVivos)) {
      s.el.classList.toggle('inativo', !!ativo && s.quem !== ativo && Object.keys(spritesVivos).length > 1);
    }
  }

  function desenharSprite(s, agora) {
    const id = idPersonagem(s.quem);
    const url = urlPersonagem(id, s.expr);
    const img = imagem(url);
    if (img) {
      if (s.img.getAttribute('src') !== url) s.img.src = url;
      s.img.hidden = false;
      s.cv.hidden = true;
      return;
    }
    s.img.hidden = true;
    s.cv.hidden = false;
    if (!window.Pintor) return;
    const ctx = s.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, s.cv.width, s.cv.height);
    const k = s.cv.width / 600;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    try {
      ctx.save();
      window.Pintor.personagem(id, s.expr, ctx, (agora - s.t0) / 1000, s.cache);
      ctx.restore();
    } catch (e) {
      if (!s.erro) console.error('Pintor.personagem', id, e);
      s.erro = true;
    }
  }

  /* ---------- efeitos de tela (chuva, neblina, poeira) ---------- */
  const Efeitos = {
    ativos: new Set(),
    gotas: [],
    motes: [],
    nevoa: null,
    definir(lista) {
      this.ativos = new Set(lista || []);
      if (!this.ativos.size) {
        ctxFx.setTransform(1, 0, 0, 1, 0, 0);
        ctxFx.clearRect(0, 0, cvFx.width, cvFx.height);
      }
    },
    redimensionar() {
      this.gotas = [];
      this.motes = [];
    },
    texturaNevoa() {
      if (this.nevoa) return this.nevoa;
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const x = c.getContext('2d');
      let semente = 7;
      const rnd = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };
      for (let i = 0; i < 70; i++) {
        const cx = rnd() * 512;
        const cy = 60 + rnd() * 170;
        const r = 30 + rnd() * 90;
        for (const dx of [-512, 0, 512]) {
          const g = x.createRadialGradient(cx + dx, cy, 0, cx + dx, cy, r);
          g.addColorStop(0, `rgba(205,214,224,${0.05 + rnd() * 0.07})`);
          g.addColorStop(1, 'rgba(205,214,224,0)');
          x.fillStyle = g;
          x.fillRect(cx + dx - r, cy - r, r * 2, r * 2);
        }
      }
      this.nevoa = c;
      return c;
    },
    desenhar(agora, dt) {
      if (!this.ativos.size) return;
      const ctx = ctxFx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cvFx.width, cvFx.height);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const t = agora / 1000;
      if (this.ativos.has('neblina')) {
        const tex = this.texturaNevoa();
        for (const [vel, escala, alfa, y] of [[14, 1.4, 0.55, 0.42], [26, 2.0, 0.4, 0.55]]) {
          const lw = 512 * escala * (W / 900 + 0.6);
          const lh = H * 0.7;
          const off = -((t * vel) % lw);
          ctx.globalAlpha = alfa;
          for (let xx = off; xx < W; xx += lw) ctx.drawImage(tex, xx, H * y - lh * 0.3, lw, lh);
        }
        ctx.globalAlpha = 1;
      }
      if (this.ativos.has('chuva') || this.ativos.has('chuva-forte')) {
        const forte = this.ativos.has('chuva-forte');
        const alvo = Math.round((W * H) / (forte ? 4200 : 8000));
        while (this.gotas.length < alvo) this.gotas.push(this.novaGota(true));
        if (this.gotas.length > alvo) this.gotas.length = alvo;
        ctx.strokeStyle = 'rgba(178, 196, 220, 0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const g of this.gotas) {
          g.y += g.v * dt;
          g.x += g.v * 0.16 * dt;
          if (g.y > H + 30) Object.assign(g, this.novaGota(false));
          ctx.moveTo(g.x, g.y);
          ctx.lineTo(g.x - g.len * 0.16, g.y - g.len);
        }
        ctx.stroke();
      }
      if (this.ativos.has('poeira')) {
        if (!this.motes.length) {
          for (let i = 0; i < 46; i++) this.motes.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.6, f: Math.random() * 6.28, v: 4 + Math.random() * 10 });
        }
        for (const m of this.motes) {
          m.y -= m.v * dt * 0.4;
          m.x += Math.sin(t * 0.4 + m.f) * dt * 6;
          if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
          const a = 0.18 + 0.18 * Math.sin(t * 1.3 + m.f);
          ctx.fillStyle = `rgba(255, 220, 170, ${a})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, 6.283);
          ctx.fill();
        }
      }
    },
    novaGota(inicio) {
      return { x: Math.random() * (W + 200) - 150, y: inicio ? Math.random() * H : -30 - Math.random() * 80, v: 900 + Math.random() * 600, len: 14 + Math.random() * 16 };
    },
  };

  function texturaGrao() {
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const x = c.getContext('2d');
    const d = x.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    try { $('#grao').style.backgroundImage = `url(${c.toDataURL('image/png')})`; } catch { /* sem grão */ }
  }

  /* ---------- laço de desenho ---------- */
  let ultimoQuadro = 0;
  function quadro(agora) {
    requestAnimationFrame(quadro);
    if (document.hidden) return;
    if (agora - ultimoQuadro < 31) return;
    const dt = Math.min(0.1, (agora - ultimoQuadro) / 1000);
    ultimoQuadro = agora;
    desenharFundo(agora);
    for (const s of Object.values(spritesVivos)) desenharSprite(s, agora);
    Efeitos.desenhar(agora, dt);
    if (!$('#tela-config').hidden) desenharPrevias(agora);
  }

  /* ---------- efeitos pontuais ---------- */
  function tremer(forte) {
    if (!opcoes.tremor || movimentoReduzido() || pulando) return;
    palco.classList.remove('tremor', 'tremor-forte');
    void palco.offsetWidth;
    palco.classList.add(forte ? 'tremor-forte' : 'tremor');
  }
  palco.addEventListener('animationend', (e) => {
    if (e.target === palco) palco.classList.remove('tremor', 'tremor-forte');
  });

  function flash(tipo) {
    if (pulando) return;
    const el = $('#flash');
    el.className = 'camada';
    void el.offsetWidth;
    el.classList.add(!opcoes.flashes || movimentoReduzido() ? 'suave' : tipo === 'vermelho' ? 'vermelho' : 'branco');
  }

  function relampago() {
    if (pulando) return;
    const el = $('#flash');
    el.className = 'camada';
    void el.offsetWidth;
    el.classList.add(!opcoes.flashes || movimentoReduzido() ? 'suave' : 'relampago');
    setTimeout(() => window.Som?.efeito('trovao'), 450);
  }

  /* ---------- texto ---------- */
  const caixa = $('#caixa');
  const elNome = $('#nome');
  const elFala = $('#fala');
  const elSeta = $('#seta');
  const elLeitor = $('#leitor');
  let digitacao = null;
  let timerAuto = null;
  let auto = false;
  let pulando = false;
  let pularSegurando = false;
  let modoAtual = null;
  let carregando = false;

  function segmentar(texto) {
    return texto.split('_').map((parte, i) => ({ texto: parte, em: i % 2 === 1 })).filter((s) => s.texto);
  }

  function renderizarTexto(segs, n) {
    elFala.replaceChildren();
    let resto = n;
    for (const s of segs) {
      if (resto <= 0) break;
      const pedaco = s.texto.slice(0, resto);
      resto -= s.texto.length;
      if (s.em) {
        const em = document.createElement('em');
        em.textContent = pedaco;
        elFala.append(em);
      } else elFala.append(document.createTextNode(pedaco));
    }
  }

  function mostrarFala(quem, texto, instantaneo) {
    const nome = quem ? (FALANTES[quem] ? FALANTES[quem]() : quem) : '';
    const formatado = formatar(texto);
    const segs = segmentar(formatado);
    const plano = segs.map((s) => s.texto).join('');
    estado.ultimaFala = { quem, texto };
    caixa.hidden = false;
    caixa.classList.remove('oculta');
    caixa.dataset.quem = quem || 'narrador';
    elNome.textContent = nome;
    elNome.hidden = !nome;
    elSeta.classList.remove('ativa');
    destacarFalante(quem);
    elLeitor.textContent = (nome ? nome + ': ' : '') + plano;
    if (!instantaneo) historico.push({ nome, texto: plano });
    if (historico.length > 300) historico.shift();
    clearInterval(digitacao?.id);
    const total = plano.length;
    if (instantaneo || pulando || pularSegurando || opcoes.velocidade >= 100) {
      renderizarTexto(segs, total);
      digitacao = { fim: true };
      textoCompleto();
      return;
    }
    const inicio = performance.now();
    digitacao = { segs, total, fim: false };
    digitacao.id = setInterval(() => {
      const n = Math.floor(((performance.now() - inicio) / 1000) * opcoes.velocidade * 1.2);
      if (n >= total) completarTexto();
      else renderizarTexto(segs, n);
    }, 16);
    renderizarTexto(segs, 0);
  }

  function completarTexto() {
    if (!digitacao || digitacao.fim) return;
    clearInterval(digitacao.id);
    renderizarTexto(digitacao.segs, digitacao.total);
    digitacao.fim = true;
    textoCompleto();
  }

  function textoCompleto() {
    elSeta.classList.add('ativa');
    clearTimeout(timerAuto);
    if (modoAtual !== 'fala') return;
    if (pulando || pularSegurando) {
      timerAuto = setTimeout(continuar, 45);
    } else if (auto) {
      const n = elFala.textContent.length;
      timerAuto = setTimeout(continuar, (1100 + n * 42) * opcoes.auto);
    }
  }

  function continuar() {
    clearTimeout(timerAuto);
    if (modoAtual !== 'fala') return;
    modoAtual = null;
    executarAte();
  }

  /* ---------- execução ---------- */
  function executarAte() {
    let guarda = 0;
    while (true) {
      if (++guarda > 4000) { console.error('Roteiro preso em laço perto da linha', PROG.cmds[estado.pc]?.linha); return; }
      const c = PROG.cmds[estado.pc];
      if (!c) { irParaTitulo(); return; }
      estado.atual = estado.pc;
      estado.pc++;
      let bloqueia = false;
      try { bloqueia = executar(c); } catch (e) { console.error('Erro na linha', c.linha, e); }
      if (bloqueia) return;
    }
  }

  function executar(c) {
    if (c.t === 'fala') {
      modoAtual = 'fala';
      mostrarFala(c.quem, c.texto);
      return BLOQUEIA;
    }
    if (c.t === 'escolha') return mostrarEscolhas(c);
    const a = c.args;
    switch (c.nome) {
      case 'cena': {
        const { opts, modo } = lerOpcoesCena(a.slice(1));
        return trocarCena(a[0], opts, modo);
      }
      case 'fx':
        estado.fx = a.filter((x) => x !== 'nada');
        Efeitos.definir(estado.fx);
        return false;
      case 'mostra':
        mostrarSprite(a[0], a[1] || 'neutro', a[2]);
        return false;
      case 'expr':
        mostrarSprite(a[0], a[1]);
        return false;
      case 'some':
        if (a[0] === 'todos') esconderTodos(); else esconderSprite(a[0]);
        return false;
      case 'som':
        if (!pulando && !carregando) window.Som?.efeito(a[0]);
        return false;
      case 'musica':
        estado.musica = a[0];
        window.Som?.musica(a[0]);
        return false;
      case 'ambiente':
        estado.ambiente = a[0];
        window.Som?.ambiente(a[0]);
        return false;
      case 'tremer':
        tremer(a[0] === 'forte');
        return false;
      case 'flash':
        flash(a[0]);
        return false;
      case 'relampago':
        relampago();
        return false;
      case 'espera':
        return esperar(parseFloat(a[0]) || 1);
      case 'titulo':
        return cartaoCapitulo(c.raw);
      case 'set':
        aplicarSet(c.raw);
        return false;
      case 'se': {
        const m = c.raw.match(/^(.*?)->\s*(\w+)\s*$/);
        if (m && avaliar(m[1])) irPara(m[2]);
        return false;
      }
      case 'vai':
        irPara(a[0]);
        return false;
      case 'velas': {
        const p = {};
        a.forEach((x) => { const [k, v] = x.split('='); p[k] = Number(v); });
        return jogoDasVelas(p);
      }
      case 'final':
        return mostrarFinal(a[0]);
      default:
        console.warn('Comando desconhecido:', c.nome, 'linha', c.linha);
        return false;
    }
  }

  function irPara(rotulo) {
    const i = PROG.rotulos[rotulo];
    if (i == null) { console.error('Rótulo inexistente:', rotulo); return; }
    estado.pc = i;
  }

  let timerEspera = null;
  function esperar(seg) {
    modoAtual = 'espera';
    caixa.classList.add('oculta');
    timerEspera = setTimeout(fimEspera, pulando ? 50 : seg * 1000);
    return BLOQUEIA;
  }
  function fimEspera() {
    clearTimeout(timerEspera);
    if (modoAtual !== 'espera') return;
    modoAtual = null;
    executarAte();
  }

  let timerCartao = null;
  function cartaoCapitulo(raw) {
    const [titulo, sub = ''] = raw.split('|').map((s) => s.trim());
    estado.capitulo = titulo;
    autosalvar();
    const el = $('#cartao');
    $('.cartao-titulo', el).textContent = titulo;
    $('.cartao-sub', el).textContent = sub;
    el.hidden = false;
    el.classList.remove('visivel');
    void el.offsetWidth;
    el.classList.add('visivel');
    cartaoVisivel = true;
    caixa.hidden = true;
    modoAtual = 'cartao';
    if (!pulando) window.Som?.efeito('cartao');
    timerCartao = setTimeout(fimCartao, pulando ? 400 : 3400);
    return BLOQUEIA;
  }
  function fimCartao() {
    clearTimeout(timerCartao);
    if (modoAtual !== 'cartao') return;
    modoAtual = null;
    executarAte();
    cartaoVisivel = false;
    const el = $('#cartao');
    el.classList.remove('visivel');
    setTimeout(() => { if (!cartaoVisivel) el.hidden = true; }, 650);
  }

  /* ---------- escolhas ---------- */
  function mostrarEscolhas(c) {
    pararPulo();
    const visiveis = c.opcoes.filter((o) => !o.cond || avaliar(o.cond));
    if (!visiveis.length) { console.error('Nenhuma opção disponível na linha', c.linha); return false; }
    modoAtual = 'escolha';
    autosalvar();
    elSeta.classList.remove('ativa');
    const box = $('#escolhas');
    box.replaceChildren();
    visiveis.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'escolha';
      const span = document.createElement('span');
      span.textContent = formatar(o.texto).replace(/_/g, '');
      const k = document.createElement('kbd');
      k.textContent = String(i + 1);
      b.append(span, k);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); escolher(o); });
      box.append(b);
    });
    box.hidden = false;
    requestAnimationFrame(() => box.querySelector('button')?.focus({ preventScroll: true }));
    return BLOQUEIA;
  }

  function escolher(o) {
    if (modoAtual !== 'escolha') return;
    $('#escolhas').hidden = true;
    historico.push({ nome: '', texto: formatar(o.texto).replace(/_/g, ''), escolha: true });
    o.sets.forEach(aplicarSet);
    irPara(o.vai);
    modoAtual = null;
    executarAte();
  }

  /* ---------- jogo das velas ---------- */
  let velas = null;
  function jogoDasVelas({ noite = 1, vento = 0 }) {
    pararPulo();
    pararAuto();
    modoAtual = 'velas';
    caixa.hidden = true;
    const tela = $('#velas-jogo');
    const fila = $('#velas-fila');
    const dica = $('#velas-dica');
    const relogio = $('#velas-relogio');
    const contagem = $('#velas-contagem');
    fila.replaceChildren();
    const alturas = [62, 70, 58, 74, 64, 60, 68];
    const botoes = alturas.map((alt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vela';
      b.style.setProperty('--altura', alt + '%');
      b.innerHTML = '<span class="halo"></span><span class="chama"></span><span class="pavio"></span><span class="cera"></span>';
      b.setAttribute('aria-label', `Vela ${i + 1}, apagada`);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); clicarVela(i); });
      fila.append(b);
      return b;
    });
    const duracao = noite === 1 ? 26 : 22;
    velas = { noite, vento, acesas: 0, botoes, inicio: performance.now(), duracao, fim: false, timers: [] };
    dica.textContent = 'Da esquerda para a direita, antes da meia-noite.';
    tela.hidden = false;
    atualizarVelas();
    const passo = () => {
      if (!velas || velas.fim) return;
      const dec = (performance.now() - velas.inicio) / 1000;
      const restante = Math.max(0, 120 * (1 - dec / velas.duracao));
      relogio.textContent = formatarRelogio(restante);
      relogio.classList.toggle('urgente', restante < 30);
      if (restante <= 0) { terminarVelas(); return; }
      velas.timers.push(setTimeout(passo, 100));
    };
    passo();
    if (vento > 0) agendarRajada();
    contagem.textContent = '';
    requestAnimationFrame(() => botoes[0].focus({ preventScroll: true }));
    return BLOQUEIA;
  }

  function formatarRelogio(restante) {
    // 120 segundos de jogo entre 23:58:00 e 00:00:00
    if (restante <= 0) return '00:00:00';
    const decorrido = 120 - Math.ceil(restante);
    const total = 23 * 3600 + 58 * 60 + decorrido;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':');
  }

  function atualizarVelas() {
    if (!velas) return;
    velas.botoes.forEach((b, i) => {
      const acesa = i < velas.acesas;
      b.classList.toggle('acesa', acesa);
      b.classList.toggle('proxima', i === velas.acesas);
      b.setAttribute('aria-label', `Vela ${i + 1}, ${acesa ? 'acesa' : 'apagada'}`);
    });
    $('#velas-contagem').textContent = `${velas.acesas} de 7 acesas`;
  }

  function clicarVela(i) {
    if (!velas || velas.fim) return;
    const b = velas.botoes[i];
    if (i === velas.acesas) {
      velas.acesas++;
      window.Som?.efeito('acender');
      atualizarVelas();
      if (velas.acesas >= 7) {
        $('#velas-dica').textContent = 'As sete chamas ficam de pé.';
        velas.fim = true;
        velas.timers.push(setTimeout(terminarVelas, 1100));
      }
    } else if (i > velas.acesas) {
      b.classList.remove('errada');
      void b.offsetWidth;
      b.classList.add('errada');
      $('#velas-dica').textContent = 'A ordem importa. Da esquerda para a direita.';
    }
  }

  function agendarRajada() {
    if (!velas || velas.fim) return;
    const [min, max] = velas.vento >= 2 ? [2.4, 3.8] : [3.6, 5.4];
    velas.timers.push(setTimeout(() => {
      if (!velas || velas.fim) return;
      const fila = $('#velas-fila');
      window.Som?.efeito('rajada');
      fila.classList.add('rajada');
      $('#velas-dica').textContent = 'Uma corrente de ar sobe por baixo da porta...';
      velas.timers.push(setTimeout(() => {
        fila.classList.remove('rajada');
        if (!velas || velas.fim) return;
        const apagar = velas.vento >= 2 && velas.acesas > 3 ? 2 : 1;
        for (let k = 0; k < apagar && velas.acesas > 0; k++) {
          velas.acesas--;
          const b = velas.botoes[velas.acesas];
          b.classList.remove('fumaca');
          void b.offsetWidth;
          b.classList.add('fumaca');
        }
        window.Som?.efeito('vela');
        atualizarVelas();
        agendarRajada();
      }, 750));
    }, (min + Math.random() * (max - min)) * 1000));
  }

  function terminarVelas() {
    if (!velas) return;
    velas.fim = true;
    velas.timers.forEach(clearTimeout);
    estado.vars['velas' + velas.noite] = velas.acesas;
    velas = null;
    $('#velas-jogo').hidden = true;
    modoAtual = null;
    executarAte();
  }

  /* ---------- finais ---------- */
  function mostrarFinal(id) {
    pararPulo();
    pararAuto();
    modoAtual = 'final';
    const lista = window.FINAIS || [];
    const meta = lista.find((f) => f.id === id) || { titulo: id, texto: '' };
    const vistos = Guarda.ler('finais', {});
    vistos[id] = true;
    Guarda.gravar('finais', vistos);
    caixa.hidden = true;
    $('#menu-rapido').hidden = true;
    const n = lista.findIndex((f) => f.id === id) + 1;
    $('#final-numero').textContent = `Final ${n} de ${lista.length}`;
    $('#final-titulo').textContent = meta.titulo;
    $('#final-texto').textContent = formatar(meta.texto);
    const qtd = lista.filter((f) => vistos[f.id]).length;
    $('#final-cont').textContent = qtd >= lista.length
      ? 'Você encontrou todos os finais.'
      : `Você já encontrou ${qtd} de ${lista.length} finais.`;
    $('#bt-final-voltar').hidden = !Guarda.ler('slot-auto', null);
    $('#tela-final').hidden = false;
    window.Som?.ambiente('nada');
    return BLOQUEIA;
  }

  /* ---------- salvar e carregar ---------- */
  function fotografia() {
    return {
      versao: 1,
      quando: Date.now(),
      capitulo: estado.capitulo,
      trecho: estado.ultimaFala ? formatar(estado.ultimaFala.texto).replace(/_/g, '') : '',
      estado: JSON.parse(JSON.stringify({ ...estado, pc: estado.atual })),
    };
  }

  function autosalvar() {
    if (!emJogo || carregando) return;
    Guarda.gravar('slot-auto', fotografia());
  }

  function carregar(dados) {
    if (!dados || !dados.estado) return;
    fecharTudo();
    carregando = true;
    pararPulo();
    pararAuto();
    estado = Object.assign(novoEstado(), JSON.parse(JSON.stringify(dados.estado)));
    estado.pc = estado.atual;
    historico = [];
    emJogo = true;
    esconderTodos(true);
    cenaAtual = { nome: estado.cena.nome, opts: estado.cena.opts || {}, inicio: performance.now(), cache: {} };
    Efeitos.definir(estado.fx);
    for (const [q, s] of Object.entries(dados.estado.sprites || {})) mostrarSprite(q, s.expr, s.pos);
    window.Som?.iniciar();
    window.Som?.musica(estado.musica);
    window.Som?.ambiente(estado.ambiente);
    mostrarTelaJogo();
    const c = PROG.cmds[estado.pc];
    if (c && c.t === 'escolha' && estado.ultimaFala) mostrarFala(estado.ultimaFala.quem, estado.ultimaFala.texto, true);
    carregando = false;
    modoAtual = null;
    executarAte();
  }

  /* ---------- telas ---------- */
  function fecharTudo() {
    ['#tela-titulo', '#tela-config', '#tela-final', '#velas-jogo', '#cartao', '#painel'].forEach((s) => { $(s).hidden = true; });
    $('#escolhas').hidden = true;
    clearTimeout(timerCartao);
    clearTimeout(timerEspera);
    if (velas) { velas.timers.forEach(clearTimeout); velas = null; }
    cartaoVisivel = false;
    $('#cortina').classList.remove('fechada');
  }

  function mostrarTelaJogo() {
    $('#menu-rapido').hidden = false;
  }

  function irParaTitulo() {
    fecharTudo();
    emJogo = false;
    pararPulo();
    pararAuto();
    modoAtual = null;
    caixa.hidden = true;
    $('#menu-rapido').hidden = true;
    esconderTodos(true);
    Efeitos.definir(['neblina']);
    cenaAtual = { nome: 'fachada', opts: {}, inicio: performance.now(), cache: {} };
    window.Som?.ambiente('vento');
    window.Som?.musica('caixinha');
    const auto = Guarda.ler('slot-auto', null);
    $('#bt-continuar').disabled = !auto;
    $('#continuar-info').textContent = auto ? auto.capitulo : '';
    const vistos = Guarda.ler('finais', {});
    const lista = window.FINAIS || [];
    $('#cont-finais').textContent = `${lista.filter((f) => vistos[f.id]).length}/${lista.length}`;
    $('#tela-titulo').hidden = false;
    requestAnimationFrame(() => $('#bt-novo').focus({ preventScroll: true }));
  }

  let liEscolhido = null;
  function abrirConfig() {
    window.Som?.iniciar();
    $('#tela-titulo').hidden = true;
    $('#tela-config').hidden = false;
    $('#passo-nome').hidden = false;
    $('#passo-par').hidden = true;
    const campo = $('#campo-nome');
    requestAnimationFrame(() => { campo.focus(); campo.select(); });
  }

  const previas = {};
  function desenharPrevias(agora) {
    if ($('#passo-par').hidden || !window.Pintor) return;
    for (const b of $$('.par')) {
      const id = b.dataset.li;
      const cv = $('canvas', b);
      const ctx = cv.getContext('2d');
      const p = previas[id] || (previas[id] = { cache: {}, t0: agora });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      const k = cv.width / 600;
      ctx.setTransform(k, 0, 0, k, 0, -cv.height * 0.02);
      try {
        ctx.save();
        window.Pintor.personagem(id, b.getAttribute('aria-pressed') === 'true' ? 'sorriso' : 'neutro', ctx, (agora - p.t0) / 1000, p.cache);
        ctx.restore();
      } catch { /* prévia opcional */ }
    }
  }

  function comecarJogo() {
    const nome = ($('#campo-nome').value || '').trim().replace(/\s+/g, ' ').slice(0, 18) || 'Ariel';
    estado = novoEstado(nome, liEscolhido || 'helena');
    historico = [];
    emJogo = true;
    fecharTudo();
    esconderTodos(true);
    Efeitos.definir([]);
    cenaAtual = { nome: 'preto', opts: {}, inicio: performance.now(), cache: {} };
    window.Som?.musica('nada');
    window.Som?.ambiente('nada');
    mostrarTelaJogo();
    estado.pc = PROG.rotulos.inicio ?? 0;
    modoAtual = null;
    executarAte();
  }

  /* ---------- painel ---------- */
  let abaAtual = 'opcoes';
  function abrirPainel(aba) {
    if (modoAtual === 'velas') return;
    pararPulo();
    pararAuto();
    const painel = $('#painel');
    painel.hidden = false;
    $$('.painel-abas [data-aba]').forEach((b) => {
      const soJogo = ['salvar', 'historico', 'menu'].includes(b.dataset.aba);
      b.disabled = soJogo && !emJogo;
    });
    mostrarAba(aba);
  }

  function fecharPainel() {
    $('#painel').hidden = true;
    if (modoAtual === 'escolha') $('#escolhas button')?.focus({ preventScroll: true });
  }

  const NOMES_ABAS = { salvar: 'Salvar', carregar: 'Carregar', historico: 'Histórico', opcoes: 'Opções', finais: 'Finais', menu: 'Sair do jogo' };
  function mostrarAba(aba) {
    abaAtual = aba;
    $('#painel-titulo').textContent = NOMES_ABAS[aba];
    $$('.painel-abas [data-aba]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === aba)));
    const corpo = $('#painel-corpo');
    corpo.replaceChildren();
    ({ salvar: abaSlots, carregar: abaSlots, historico: abaHistorico, opcoes: abaOpcoes, finais: abaFinais, menu: abaMenu })[aba](corpo, aba);
  }

  const dataCurta = (ms) => {
    const d = new Date(ms);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  function abaSlots(corpo, aba) {
    const salvar = aba === 'salvar';
    const lista = document.createElement('div');
    lista.className = 'slots';
    const chaves = salvar ? [1, 2, 3, 4, 5, 6] : ['auto', 1, 2, 3, 4, 5, 6];
    for (const k of chaves) {
      const dados = Guarda.ler('slot-' + k, null);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot';
      const num = document.createElement('span');
      num.className = 'slot-num';
      num.textContent = k === 'auto' ? 'A' : String(k);
      const cap = document.createElement('span');
      cap.className = 'slot-cap';
      const trecho = document.createElement('span');
      trecho.className = 'slot-trecho';
      if (dados) {
        cap.textContent = (k === 'auto' ? 'Automático · ' : '') + dados.capitulo;
        const t = document.createElement('time');
        t.textContent = dataCurta(dados.quando);
        cap.append(t);
        trecho.textContent = dados.trecho || '';
      } else {
        cap.textContent = k === 'auto' ? 'Automático' : 'Vazio';
        trecho.textContent = salvar ? 'Clique para salvar aqui.' : '';
      }
      b.append(num, cap, trecho);
      b.disabled = !salvar && !dados;
      b.addEventListener('click', () => {
        if (salvar) {
          const ok = Guarda.gravar('slot-' + k, fotografia());
          aviso(ok ? 'Jogo salvo.' : 'Não deu para salvar: o navegador bloqueou o armazenamento.');
          mostrarAba('salvar');
        } else carregar(dados);
      });
      lista.append(b);
    }
    corpo.append(lista);
  }

  function abaHistorico(corpo) {
    const lista = document.createElement('div');
    lista.className = 'historico';
    if (!historico.length) {
      const p = document.createElement('p');
      p.className = 'hist-item';
      p.textContent = 'Nada por aqui ainda.';
      lista.append(p);
    }
    for (const h of historico) {
      const p = document.createElement('p');
      p.className = 'hist-item' + (h.escolha ? ' escolha' : '');
      if (h.nome) {
        const b = document.createElement('b');
        b.textContent = h.nome;
        p.append(b);
      }
      p.append(document.createTextNode(h.escolha ? 'Você escolheu: ' + h.texto : h.texto));
      lista.append(p);
    }
    corpo.append(lista);
    requestAnimationFrame(() => { corpo.scrollTop = corpo.scrollHeight; });
  }

  function abaOpcoes(corpo) {
    const wrap = document.createElement('div');
    wrap.className = 'opcoes';
    const faixa = (id, rotulo, min, max, passo, chave, mostrar, ajuda) => {
      const div = document.createElement('div');
      div.className = 'opcao';
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = rotulo;
      const out = document.createElement('output');
      out.textContent = mostrar(opcoes[chave]);
      label.append(out);
      const input = document.createElement('input');
      input.type = 'range';
      input.id = id;
      input.min = min;
      input.max = max;
      input.step = passo;
      input.value = opcoes[chave];
      input.addEventListener('input', () => {
        opcoes[chave] = Number(input.value);
        out.textContent = mostrar(opcoes[chave]);
        salvarOpcoes();
      });
      div.append(label, input);
      if (ajuda) {
        const s = document.createElement('small');
        s.textContent = ajuda;
        div.append(s);
      }
      wrap.append(div);
    };
    const marca = (id, rotulo, chave, ajuda) => {
      const div = document.createElement('div');
      div.className = 'opcao';
      const label = document.createElement('label');
      label.className = 'opcao-check';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.checked = !!opcoes[chave];
      input.addEventListener('change', () => { opcoes[chave] = input.checked; salvarOpcoes(); });
      label.append(input, document.createTextNode(rotulo));
      div.append(label);
      if (ajuda) {
        const s = document.createElement('small');
        s.textContent = ajuda;
        div.append(s);
      }
      wrap.append(div);
    };
    const pct = (v) => Math.round(v * 100) + '%';
    faixa('op-velocidade', 'Velocidade do texto', 10, 100, 5, 'velocidade', (v) => (v >= 100 ? 'instantâneo' : v <= 25 ? 'lenta' : v <= 60 ? 'média' : 'rápida'));
    faixa('op-auto', 'Pausa no modo automático', 0.5, 2, 0.1, 'auto', (v) => v.toFixed(1).replace('.', ',') + '×', 'Quanto maior, mais tempo cada fala fica na tela antes de passar sozinha.');
    faixa('op-vol-geral', 'Volume geral', 0, 1, 0.05, 'volGeral', pct);
    faixa('op-vol-musica', 'Música', 0, 1, 0.05, 'volMusica', pct);
    faixa('op-vol-efeitos', 'Efeitos e ambiente', 0, 1, 0.05, 'volEfeitos', pct);
    marca('op-flashes', 'Flashes de luz', 'flashes', 'Desligado, os clarões viram um escurecer suave.');
    marca('op-tremor', 'Tremor da tela', 'tremor');
    const atalhos = document.createElement('p');
    atalhos.className = 'opcao';
    atalhos.innerHTML = '<small>Atalhos: espaço ou Enter avançam, números escolhem, Ctrl segurado pula, A liga o automático, H abre o histórico, Esc abre este menu.</small>';
    wrap.append(atalhos);
    corpo.append(wrap);
  }

  function abaFinais(corpo) {
    const lista = document.createElement('div');
    lista.className = 'finais';
    const vistos = Guarda.ler('finais', {});
    (window.FINAIS || []).forEach((f, i) => {
      const div = document.createElement('div');
      const visto = !!vistos[f.id];
      div.className = 'final-item' + (visto ? '' : ' trancado');
      const h = document.createElement('h3');
      h.textContent = `${i + 1}. ${visto ? f.titulo : '???'}`;
      const p = document.createElement('p');
      p.textContent = visto ? f.texto.replace(/\{[^}]*\}/g, (m) => formatar(m)) : f.dica;
      div.append(h, p);
      lista.append(div);
    });
    corpo.append(lista);
  }

  function abaMenu(corpo) {
    const box = document.createElement('div');
    box.className = 'confirmar';
    const p = document.createElement('p');
    p.textContent = 'Voltar para a tela inicial? O que aconteceu depois da última escolha não fica salvo, a não ser que você salve antes.';
    const acoes = document.createElement('div');
    const sim = document.createElement('button');
    sim.type = 'button';
    sim.className = 'botao primario';
    sim.textContent = 'Ir para a tela inicial';
    sim.addEventListener('click', irParaTitulo);
    const nao = document.createElement('button');
    nao.type = 'button';
    nao.className = 'botao';
    nao.textContent = 'Continuar jogando';
    nao.addEventListener('click', fecharPainel);
    acoes.append(sim, nao);
    box.append(p, acoes);
    corpo.append(box);
  }

  let timerAviso = null;
  function aviso(texto) {
    let el = $('#aviso');
    if (!el) {
      el = document.createElement('p');
      el.id = 'aviso';
      el.setAttribute('role', 'status');
      palco.append(el);
    }
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => { el.hidden = true; }, 2200);
  }

  /* ---------- auto e pular ---------- */
  function definirAuto(v) {
    auto = v;
    $('[data-acao="auto"]').setAttribute('aria-pressed', String(v));
    if (v && modoAtual === 'fala' && digitacao?.fim) textoCompleto();
    if (!v) clearTimeout(timerAuto);
  }
  function pararAuto() { if (auto) definirAuto(false); }
  function definirPulo(v) {
    pulando = v;
    $('[data-acao="pular"]').setAttribute('aria-pressed', String(v));
    if (v) {
      if (modoAtual === 'fala') { if (!digitacao?.fim) completarTexto(); else textoCompleto(); }
      if (modoAtual === 'cartao') fimCartao();
      if (modoAtual === 'espera') fimEspera();
    }
  }
  function pararPulo() { if (pulando) definirPulo(false); pularSegurando = false; }

  /* ---------- entrada ---------- */
  function avancar() {
    if (!emJogo || !$('#painel').hidden) return;
    if (modoAtual === 'fala') {
      if (pulando) { pararPulo(); return; }
      if (digitacao && !digitacao.fim) completarTexto();
      else continuar();
    } else if (modoAtual === 'cartao') fimCartao();
    else if (modoAtual === 'espera') fimEspera();
  }

  palco.addEventListener('click', (e) => {
    if (e.target.closest('button, input, label, a, .tela:not(#cartao)')) return;
    window.Som?.iniciar();
    avancar();
  });

  palco.addEventListener('wheel', (e) => {
    if (emJogo && e.deltaY < 0 && $('#painel').hidden && modoAtual !== 'velas') abrirPainel('historico');
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    const painelAberto = !$('#painel').hidden;
    if (e.key === 'Escape') {
      if (painelAberto) fecharPainel();
      else if (emJogo && $('#tela-final').hidden) abrirPainel('opcoes');
      return;
    }
    if (painelAberto || !emJogo) return;
    if (e.target.closest && e.target.closest('input')) return;
    if (modoAtual === 'escolha') {
      const n = parseInt(e.key, 10);
      const botoes = $$('#escolhas button');
      if (n >= 1 && n <= botoes.length) { e.preventDefault(); botoes[n - 1].click(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const i = botoes.indexOf(document.activeElement);
        const prox = e.key === 'ArrowDown' ? (i + 1) % botoes.length : (i - 1 + botoes.length) % botoes.length;
        botoes[prox]?.focus();
      }
      return;
    }
    if (modoAtual === 'velas') return;
    if (e.key === 'Control') {
      if (!pularSegurando) { pularSegurando = true; if (modoAtual === 'fala' && digitacao?.fim) textoCompleto(); else completarTexto(); }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
      if (e.target.closest && e.target.closest('button') && e.key !== 'ArrowRight') {
        if (!e.target.closest('#menu-rapido')) return;
        e.target.blur();
      }
      e.preventDefault();
      avancar();
    } else if (e.key === 'a' || e.key === 'A') definirAuto(!auto);
    else if (e.key === 'h' || e.key === 'H') abrirPainel('historico');
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Control') pularSegurando = false;
  });

  $('#menu-rapido').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    const acao = b.dataset.acao;
    if (acao === 'auto') definirAuto(!auto);
    else if (acao === 'pular') definirPulo(!pulando);
    else if (acao === 'menu') abrirPainel(W < 640 ? 'salvar' : 'menu');
    else abrirPainel(acao);
    b.blur();
  });

  $('.painel-abas').addEventListener('click', (e) => {
    const b = e.target.closest('[data-aba]');
    if (b && !b.disabled) mostrarAba(b.dataset.aba);
  });
  $('#bt-fechar-painel').addEventListener('click', fecharPainel);
  $('#painel').addEventListener('click', (e) => { if (e.target.id === 'painel') fecharPainel(); });

  $('#bt-novo').addEventListener('click', abrirConfig);
  $('#bt-continuar').addEventListener('click', () => carregar(Guarda.ler('slot-auto', null)));
  $('#bt-carregar').addEventListener('click', () => { window.Som?.iniciar(); abrirPainel('carregar'); });
  $('#bt-finais').addEventListener('click', () => { window.Som?.iniciar(); abrirPainel('finais'); });
  $('#bt-opcoes').addEventListener('click', () => { window.Som?.iniciar(); abrirPainel('opcoes'); });

  $('#passo-nome').addEventListener('submit', (e) => {
    e.preventDefault();
    $('#passo-nome').hidden = true;
    $('#passo-par').hidden = false;
    requestAnimationFrame(() => $('.par').focus({ preventScroll: true }));
  });
  $('[data-voltar]').addEventListener('click', irParaTitulo);
  $('[data-voltar-nome]').addEventListener('click', () => {
    $('#passo-par').hidden = true;
    $('#passo-nome').hidden = false;
  });
  $$('.par').forEach((b) => b.addEventListener('click', () => {
    liEscolhido = b.dataset.li;
    $$('.par').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    $('#bt-comecar').disabled = false;
  }));
  $('#bt-comecar').addEventListener('click', comecarJogo);

  $('#bt-final-voltar').addEventListener('click', () => carregar(Guarda.ler('slot-auto', null)));
  $('#bt-final-titulo').addEventListener('click', irParaTitulo);

  // Sons só podem começar depois de um gesto da pessoa.
  document.addEventListener('pointerdown', () => window.Som?.iniciar(), { once: true });
  document.addEventListener('keydown', () => window.Som?.iniciar(), { once: true });

  /* ---------- atualização ao vivo do Claude (mantém o jogo onde estava) ---------- */
  try {
    window.claude?.hot?.snapshot?.(() => (emJogo ? { jogo: fotografia(), historico } : {}));
  } catch { /* fora do visualizador */ }

  /* ---------- início ---------- */
  function iniciar(dados) {
    texturaGrao();
    salvarOpcoes();
    redimensionar();
    window.addEventListener('resize', redimensionar);
    requestAnimationFrame(quadro);
    if (dados && dados.jogo) {
      carregar(dados.jogo);
      if (Array.isArray(dados.historico)) historico = dados.historico;
    } else irParaTitulo();
  }

  // Para testes automáticos.
  window.SeteVelas = {
    get estado() { return estado; },
    get modo() { return modoAtual; },
    PROG,
    avancar,
    escolher: (i) => $$('#escolhas button')[i]?.click(),
    terminarVelas: (n) => { if (velas) { velas.acesas = n; terminarVelas(); } },
    irPara: (rotulo) => { irPara(rotulo); modoAtual = null; executarAte(); },
    pular: definirPulo,
  };

  const hot = window.claude?.hot;
  if (hot && typeof hot.ready === 'function') hot.ready(iniciar);
  else iniciar(hot?.data ?? {});
})();
