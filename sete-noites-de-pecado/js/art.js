/* =========================================================================
   ARTE PROVISÓRIA
   Desenha os cenários e os personagens com SVG e CSS, sem nenhuma imagem.
   As "receitas" dos cenários ficam em js/scenes.js. Aqui ficam os "pincéis"
   (pedaços de desenho reutilizáveis: céu, lua, floresta, janelas góticas...).

   Quando houver imagens de verdade, não é preciso mexer aqui:
   - cenários: preencha "imagem" na receita em js/scenes.js;
   - personagens: preencha "imagens" em js/characters.js.
   ========================================================================= */
(() => {
  'use strict';

  const NS_SVG = 'http://www.w3.org/2000/svg';
  let contador = 0;
  const novoId = (prefixo) => `arte-${prefixo}-${++contador}`;
  const r1 = (v) => Math.round(v * 10) / 10;

  /* ---------- números aleatórios com semente (o mesmo cenário sai sempre igual) ---------- */
  function hash(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) {
      h ^= texto.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function aleatorio(semente) {
    let a = typeof semente === 'number' ? semente >>> 0 : hash(String(semente));
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- cores ---------- */
  function rgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function misturar(a, b, t) {
    const x = rgb(a);
    const y = rgb(b);
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  const clarear = (c, t) => misturar(c, '#ffffff', t);
  const escurecer = (c, t) => misturar(c, '#000000', t);

  /* ---------- geometria ---------- */
  function suave(pontos) {
    if (pontos.length < 3) return 'M' + pontos.map((p) => p.map(r1).join(',')).join(' L');
    let d = `M${r1(pontos[0][0])},${r1(pontos[0][1])}`;
    for (let i = 1; i < pontos.length - 1; i++) {
      const [x, y] = pontos[i];
      const [nx, ny] = pontos[i + 1];
      d += ` Q${r1(x)},${r1(y)} ${r1((x + nx) / 2)},${r1((y + ny) / 2)}`;
    }
    const u = pontos[pontos.length - 1];
    return d + ` L${r1(u[0])},${r1(u[1])}`;
  }

  // Janela em arco ogival (gótico): ocupa de x até x+l, ápice em yTopo, base em yTopo+a.
  function arcoGotico(x, yTopo, l, a) {
    const ys = Math.min(yTopo + l * 0.866, yTopo + a);
    return `M${r1(x)},${r1(yTopo + a)} L${r1(x)},${r1(ys)} A${r1(l)},${r1(l)} 0 0 1 ${r1(x + l / 2)},${r1(yTopo)} A${r1(l)},${r1(l)} 0 0 1 ${r1(x + l)},${r1(ys)} L${r1(x + l)},${r1(yTopo + a)} Z`;
  }

  // Janela em arco redondo.
  function arcoRedondo(x, yTopo, l, a) {
    const r = l / 2;
    return `M${r1(x)},${r1(yTopo + a)} L${r1(x)},${r1(yTopo + r)} A${r1(r)},${r1(r)} 0 0 1 ${r1(x + l)},${r1(yTopo + r)} L${r1(x + l)},${r1(yTopo + a)} Z`;
  }

  function chamaPath(x, y, s) {
    return `M${r1(x)},${r1(y)} C${r1(x - 4.2 * s)},${r1(y - 4 * s)} ${r1(x - 3.2 * s)},${r1(y - 11 * s)} ${r1(x)},${r1(y - 17 * s)} C${r1(x + 3.2 * s)},${r1(y - 11 * s)} ${r1(x + 4.2 * s)},${r1(y - 4 * s)} ${r1(x)},${r1(y)} Z`;
  }

  // Estrela de sete pontas {7/3}, símbolo do Círculo de Ônix.
  function heptagrama(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i * 3 * 2 * Math.PI) / 7;
      pts.push(`${r1(cx + Math.cos(a) * r)},${r1(cy + Math.sin(a) * r)}`);
    }
    return 'M' + pts.join(' L') + ' Z';
  }

  /* ---------- contexto de desenho (guarda <defs> e o orçamento de animações) ---------- */
  function novoContexto(semente, opcoes = {}, limiteAnimacoes = 46) {
    const defs = [];
    const cache = {};
    let animadas = 0;
    const c = {
      defs,
      opcoes,
      rnd: aleatorio(semente),
      animar() {
        animadas++;
        return animadas <= limiteAnimacoes;
      },
      atraso(max = 4) {
        return `animation-delay:-${r1(c.rnd() * max)}s`;
      },
      linear(cores, { x1 = 0, y1 = 0, x2 = 0, y2 = 1, paradas, unidades } = {}) {
        const id = novoId('g');
        const st = cores.map((cor, i) => parada(cor, paradas ? paradas[i] : cores.length === 1 ? 0 : i / (cores.length - 1))).join('');
        const u = unidades ? ` gradientUnits="${unidades}"` : '';
        defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${u}>${st}</linearGradient>`);
        return `url(#${id})`;
      },
      radial(cores, { cx = 0.5, cy = 0.5, r = 0.5, fx, fy, paradas } = {}) {
        const id = novoId('r');
        const st = cores.map((cor, i) => parada(cor, paradas ? paradas[i] : cores.length === 1 ? 0 : i / (cores.length - 1))).join('');
        const f = fx != null ? ` fx="${fx}" fy="${fy}"` : '';
        defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${f}>${st}</radialGradient>`);
        return `url(#${id})`;
      },
      // Poça de luz: centro forte que se dissolve.
      luz(cor, opacidade = 1) {
        const chave = `luz${cor}${opacidade}`;
        if (!cache[chave]) cache[chave] = c.radial([[cor, opacidade], [cor, opacidade * 0.32], [cor, 0]], { paradas: [0, 0.38, 1] });
        return cache[chave];
      },
      chama() {
        if (!cache.chama) {
          cache.chama = c.radial(
            [['#fff8e2', 1], ['#ffd884', 1], ['#ff9c3c', 0.95], ['#c4421a', 0.55], ['#8a1f10', 0]],
            { cx: 0.5, cy: 0.78, r: 0.62, paradas: [0, 0.22, 0.5, 0.78, 1] },
          );
        }
        return cache.chama;
      },
      cera(cor = '#e8dcc2') {
        const chave = 'cera' + cor;
        if (!cache[chave]) cache[chave] = c.linear([escurecer(cor, 0.35), clarear(cor, 0.25), cor, escurecer(cor, 0.45)], { x2: 1, y2: 0, paradas: [0, 0.35, 0.6, 1] });
        return cache[chave];
      },
      filtro(id, corpo) {
        if (!cache['f' + id]) {
          const fid = novoId(id);
          defs.push(`<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%">${corpo}</filter>`);
          cache['f' + id] = `url(#${fid})`;
        }
        return cache['f' + id];
      },
    };
    return c;
  }

  function parada(cor, pos) {
    const [c, o] = Array.isArray(cor) ? cor : [cor, 1];
    return `<stop offset="${r1(pos * 1000) / 1000}" stop-color="${c}" stop-opacity="${r1(o * 1000) / 1000}"/>`;
  }

  const cls = (nome, ativo) => (ativo ? ` class="${nome}"` : '');

  /* ---------- pequenos objetos reaproveitados ---------- */
  function vela(c, x, y, s = 1, acesa = true, { corCera = '#e9dcc2', halo = true, corHalo = '#ffb35c', forcaHalo = 0.55 } = {}) {
    const h = 26 * s;
    const w = 7 * s;
    let m = '';
    if (acesa && halo) {
      const anima = c.animar();
      m += `<ellipse${cls('arte-halo', anima)} style="${anima ? c.atraso(3) : ''}" cx="${r1(x)}" cy="${r1(y - h - 8 * s)}" rx="${r1(46 * s)}" ry="${r1(46 * s)}" fill="${c.luz(corHalo, forcaHalo)}"/>`;
    }
    m += `<rect x="${r1(x - w / 2)}" y="${r1(y - h)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(1.4 * s)}" fill="${c.cera(corCera)}"/>`;
    m += `<path d="M${r1(x - w / 2)},${r1(y - h + 1)} q${r1(w * 0.2)},${r1(5 * s)} 0,${r1(9 * s)}" stroke="${clarear(corCera, 0.3)}" stroke-width="${r1(1.4 * s)}" fill="none" opacity=".7"/>`;
    m += `<line x1="${r1(x)}" y1="${r1(y - h)}" x2="${r1(x)}" y2="${r1(y - h - 3 * s)}" stroke="#1a1210" stroke-width="${r1(0.9 * s)}"/>`;
    if (acesa) {
      const anima = c.animar();
      m += `<path${cls('arte-chama', anima)} style="${anima ? c.atraso(2) : ''}" d="${chamaPath(x, y - h - 1.5 * s, s)}" fill="${c.chama()}"/>`;
    } else {
      m += `<path class="arte-fumaca" d="M${r1(x)},${r1(y - h - 3 * s)} c${r1(-3 * s)},${r1(-8 * s)} ${r1(4 * s)},${r1(-12 * s)} 0,${r1(-22 * s)} c${r1(-4 * s)},${r1(-8 * s)} ${r1(3 * s)},${r1(-13 * s)} 0,${r1(-22 * s)}" stroke="#a7a19a" stroke-width="${r1(1.1 * s)}" fill="none" opacity=".3"/>`;
    }
    return m;
  }

  function pinheiro(cx, base, w, h, rnd) {
    const camadas = 5 + Math.floor(rnd() * 3);
    const dir = [];
    const esq = [];
    for (let i = 1; i <= camadas; i++) {
      const t = i / camadas;
      const y = base - h + h * t * 0.9;
      const wi = (w / 2) * t * (0.8 + rnd() * 0.35);
      dir.push([cx + wi, y], [cx + wi * 0.42, y - h * 0.035]);
      esq.push([cx - wi * (0.9 + rnd() * 0.2), y + rnd() * 3], [cx - wi * 0.42, y - h * 0.035]);
    }
    const tronco = w * 0.05;
    let d = `M${r1(cx)},${r1(base - h)}`;
    for (const [x, y] of dir) d += ` L${r1(x)},${r1(y)}`;
    d += ` L${r1(cx + tronco)},${r1(base - h * 0.08)} L${r1(cx + tronco)},${r1(base)} L${r1(cx - tronco)},${r1(base)} L${r1(cx - tronco)},${r1(base - h * 0.08)}`;
    for (let i = esq.length - 1; i >= 0; i -= 2) d += ` L${r1(esq[i - 1][0])},${r1(esq[i - 1][1])} L${r1(esq[i][0])},${r1(esq[i][1])}`;
    return d + ' Z';
  }

  function rosa(c, x, y, s, rnd, cor = '#140609', borda = '#8a1a2c') {
    const g = c.radial([[clarear(cor, 0.12), 1], [cor, 1], [escurecer(cor, 0.6), 1]], { cx: 0.42, cy: 0.38, r: 0.62 });
    const rot = r1((rnd() - 0.5) * 50);
    let m = `<g transform="translate(${r1(x)},${r1(y)}) rotate(${rot}) scale(${r1(s * 100) / 100})">`;
    m += '<ellipse cx="0" cy="2" rx="17" ry="13" fill="#090305"/>';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rnd() * 0.5;
      m += `<ellipse cx="${r1(Math.cos(a) * 8)}" cy="${r1(Math.sin(a) * 6)}" rx="11" ry="8" transform="rotate(${r1((a * 180) / Math.PI)} ${r1(Math.cos(a) * 8)} ${r1(Math.sin(a) * 6)})" fill="${g}" stroke="${borda}" stroke-width=".9" stroke-opacity=".55"/>`;
    }
    m += `<path d="M-7,1 C-7,-7 6,-8 7,-1 C8,5 -1,7 -3,2 C-4,-2 2,-3 2,0" fill="none" stroke="${borda}" stroke-width="1.2" stroke-opacity=".75"/>`;
    m += `<ellipse cx="-3" cy="-4" rx="5" ry="2.2" fill="${borda}" opacity=".35"/>`;
    return m + '</g>';
  }

  function folha(x, y, s, ang, cor) {
    return `<path d="M0,0 C6,-6 18,-6 26,0 C18,6 6,6 0,0 Z" transform="translate(${r1(x)},${r1(y)}) rotate(${r1(ang)}) scale(${r1(s * 100) / 100})" fill="${cor}"/>`;
  }

  /* =========================================================================
     PINCÉIS DE CENÁRIO (cada um recebe o contexto "c" e os parâmetros "p")
     ========================================================================= */
  const P = {};

  P.ceu = (c, p) => `<rect x="-20" y="-20" width="1640" height="940" fill="${c.linear(p.cores, { paradas: p.paradas })}"/>`;

  P.retangulo = (c, p) => {
    const fill = p.cores ? c.linear(p.cores, { paradas: p.paradas, x2: p.horizontal ? 1 : 0, y2: p.horizontal ? 0 : 1 }) : p.cor;
    return `<rect x="${p.x ?? -20}" y="${p.y ?? -20}" width="${p.largura ?? 1640}" height="${p.altura ?? 940}" fill="${fill}" opacity="${p.opacidade ?? 1}"/>`;
  };

  P.brilho = (c, p) => {
    const anima = p.pulsar && c.animar();
    return `<ellipse${cls('arte-pulsa', anima)} cx="${p.x}" cy="${p.y}" rx="${p.rx ?? p.raio}" ry="${p.ry ?? p.raio}" fill="${c.luz(p.cor, p.opacidade ?? 1)}"/>`;
  };

  P.estrelas = (c, p) => {
    const rnd = aleatorio(p.semente ?? 'estrelas');
    const q = p.quantidade ?? 110;
    const ate = p.ate ?? 480;
    let s = '';
    for (let i = 0; i < q; i++) {
      const x = (p.de ?? 0) + rnd() * ((p.largura ?? 1600));
      const y = Math.pow(rnd(), 1.5) * ate;
      const r = 0.5 + rnd() * rnd() * 1.7;
      const o = 0.2 + rnd() * 0.7;
      const pisca = i % 5 === 0 && c.animar();
      s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${p.cor ?? '#f1e8d8'}" opacity="${r1(o * 100) / 100}"${pisca ? ` class="arte-cintila" style="${c.atraso(6)}"` : ''}/>`;
    }
    return `<g>${s}</g>`;
  };

  P.lua = (c, p) => {
    const { x, y, raio = 44, cor = '#f0e6cf', halo = 0.35 } = p;
    const disco = c.radial([[clarear(cor, 0.35), 1], [cor, 1], [escurecer(cor, 0.22), 1]], { cx: 0.42, cy: 0.38, r: 0.66 });
    let s = `<ellipse cx="${x}" cy="${y}" rx="${raio * 8}" ry="${raio * 6}" fill="${c.luz(cor, halo * 0.45)}"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${raio * 2.3}" fill="${c.luz(cor, halo)}"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${raio}" fill="${disco}"/>`;
    const rnd = aleatorio('lua' + x);
    for (let i = 0; i < 5; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * raio * 0.6;
      s += `<ellipse cx="${r1(x + Math.cos(a) * d)}" cy="${r1(y + Math.sin(a) * d)}" rx="${r1(raio * (0.1 + rnd() * 0.16))}" ry="${r1(raio * (0.08 + rnd() * 0.12))}" fill="${escurecer(cor, 0.2)}" opacity=".35"/>`;
    }
    if (p.veu) s += `<circle cx="${x}" cy="${y}" r="${raio + 1}" fill="${p.veu}" opacity="${p.opacidadeVeu ?? 0.35}"/>`;
    return s;
  };

  P.nuvens = (c, p) => {
    const rnd = aleatorio(p.semente ?? 'nuvens');
    let s = '';
    for (let i = 0; i < (p.quantidade ?? 7); i++) {
      const x = -100 + rnd() * 1800;
      const y = p.y + (rnd() - 0.5) * (p.altura ?? 80);
      const rx = 180 + rnd() * 360;
      const ry = 16 + rnd() * 38;
      s += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${c.luz(p.cor ?? '#3a3346', (p.opacidade ?? 0.5) * (0.5 + rnd() * 0.5))}"/>`;
    }
    const anima = p.derivar !== false && c.animar();
    return `<g${cls('arte-nuvens', anima)}>${s}</g>`;
  };

  P.montanhas = (c, p) => {
    const rnd = aleatorio(p.semente ?? 'montanhas');
    const f = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
    const pts = [];
    for (let x = -80; x <= 1680; x += 40) {
      const t = x / 1600;
      const v = 0.55 * Math.sin(t * Math.PI * (p.ondas ?? 2.2) + f[0]) + 0.3 * Math.sin(t * Math.PI * 5.3 + f[1]) + 0.15 * Math.sin(t * Math.PI * 11 + f[2]);
      pts.push([x, p.base - p.altura * (0.5 + 0.5 * v)]);
    }
    const chao = p.chao ?? 920;
    const fill = p.cores ? c.linear(p.cores) : p.cor;
    return `<path d="${suave(pts)} L1680,${chao} L-80,${chao} Z" fill="${fill}"/>`;
  };

  P.floresta = (c, p) => {
    const rnd = aleatorio(p.semente ?? 'floresta');
    let d = '';
    const de = p.de ?? -80;
    const ate = p.ate ?? 1680;
    let x = de;
    while (x < ate) {
      const h = p.alturaMin + rnd() * (p.alturaMax - p.alturaMin);
      const w = h * (p.largura ?? 0.34);
      d += pinheiro(x, p.base + rnd() * (p.variacao ?? 6), w, h, rnd);
      x += w * (p.densidade ?? 0.42) * (0.6 + rnd() * 0.8);
    }
    if (p.chao !== false) d += `M${de},${p.base} H${ate} V${typeof p.chao === 'number' ? p.chao : 920} H${de} Z`;
    const fill = p.cores ? c.linear(p.cores) : p.cor;
    return `<path d="${d}" fill="${fill}"/>`;
  };

  P.lago = (c, p) => {
    const topo = p.topo;
    let s = `<rect x="-20" y="${topo}" width="1640" height="${940 - topo}" fill="${c.linear(p.cores ?? ['#0d1019', '#030406'])}"/>`;
    s += `<rect x="-20" y="${topo - 1}" width="1640" height="2.5" fill="${p.corHorizonte ?? '#3a4152'}" opacity=".45"/>`;
    const rnd = aleatorio(p.semente ?? 'lago');
    const coluna = (x, cor, largura, opacidade, linhas, espalhar) => {
      let m = '';
      for (let i = 0; i < linhas; i++) {
        const y = topo + 4 + i * i * (p.passo ?? 0.95) + rnd() * 5;
        if (y > 905) break;
        const w = largura * (0.35 + rnd() * 0.9) * (1 + i * 0.05);
        const o = opacidade * (1 - i / (linhas + 3)) * (0.45 + rnd() * 0.55);
        const anima = c.animar();
        m += `<rect${cls('arte-reflexo', anima)} style="${anima ? c.atraso(4) : ''}" x="${r1(x - w / 2 + (rnd() - 0.5) * espalhar)}" y="${r1(y)}" width="${r1(w)}" height="${r1(1.3 + rnd() * 2.2)}" rx="1" fill="${cor}" opacity="${r1(o * 100) / 100}"/>`;
      }
      return m;
    };
    if (p.lua) s += coluna(p.lua.x, p.lua.cor ?? '#e9dcc0', p.lua.largura ?? 64, p.lua.opacidade ?? 0.75, p.lua.linhas ?? 26, 22);
    for (const r of p.reflexos ?? []) s += coluna(r.x, r.cor ?? '#ffb35c', r.largura ?? 14, r.opacidade ?? 0.6, r.linhas ?? 9, 6);
    for (let i = 0; i < (p.ondas ?? 36); i++) {
      const y = topo + 8 + Math.pow(rnd(), 1.6) * (900 - topo);
      const w = 30 + rnd() * 140;
      s += `<rect x="${r1(rnd() * 1600)}" y="${r1(y)}" width="${r1(w)}" height="1.2" fill="${p.corOnda ?? '#8d9ab3'}" opacity="${r1((0.04 + rnd() * 0.08) * 100) / 100}"/>`;
    }
    return s;
  };

  // Silhueta distante de prédios góticos (torres, pináculos, janelinhas acesas).
  P.silhueta_gotica = (c, p) => {
    const rnd = aleatorio(p.semente ?? 'silhueta');
    const esc = p.escala ?? 1;
    let corpo = '';
    let jan = '';
    let x = p.x;
    const fim = p.x + p.largura;
    while (x < fim) {
      const w = (28 + rnd() * 58) * esc;
      const h = (p.alturaMin + rnd() * (p.alturaMax - p.alturaMin));
      const topo = p.base - h;
      corpo += `M${r1(x)},${p.base + 2} V${r1(topo)} H${r1(x + w)} V${p.base + 2} Z`;
      const tipo = rnd();
      if (tipo < 0.42) {
        corpo += `M${r1(x - 2)},${r1(topo)} L${r1(x + w / 2)},${r1(topo - w * 0.75)} L${r1(x + w + 2)},${r1(topo)} Z`;
      } else if (tipo < 0.68) {
        const tw = w * 0.42;
        const tx = x + (w - tw) / 2;
        const th = h * (0.35 + rnd() * 0.55);
        corpo += `M${r1(tx)},${r1(topo)} V${r1(topo - th)} H${r1(tx + tw)} V${r1(topo)} Z`;
        corpo += `M${r1(tx - 2)},${r1(topo - th)} L${r1(tx + tw / 2)},${r1(topo - th - tw * 2.8)} L${r1(tx + tw + 2)},${r1(topo - th)} Z`;
        corpo += `M${r1(tx - 1)},${r1(topo - th)} l1.5,-${r1(tw * 0.9)} l1.5,${r1(tw * 0.9)} Z M${r1(tx + tw - 2)},${r1(topo - th)} l1.5,-${r1(tw * 0.9)} l1.5,${r1(tw * 0.9)} Z`;
      } else if (tipo < 0.84) {
        for (let k = x; k < x + w - 5; k += 9 * esc) corpo += `M${r1(k)},${r1(topo + 1)} V${r1(topo - 6 * esc)} H${r1(k + 5 * esc)} V${r1(topo + 1)} Z`;
      } else {
        corpo += `M${r1(x + 3)},${r1(topo)} l2.5,-${r1(h * 0.35)} l2.5,${r1(h * 0.35)} Z M${r1(x + w - 8)},${r1(topo)} l2.5,-${r1(h * 0.35)} l2.5,${r1(h * 0.35)} Z`;
      }
      if (p.janela) {
        for (let jy = topo + 10 * esc; jy < p.base - 10 * esc; jy += 16 * esc) {
          for (let jx = x + 5 * esc; jx < x + w - 8 * esc; jx += 11 * esc) {
            if (rnd() < (p.acesas ?? 0.18)) jan += `<path d="${arcoGotico(jx, jy, 4 * esc, 8 * esc)}" fill="${p.janela}" opacity="${r1((0.5 + rnd() * 0.5) * 100) / 100}"/>`;
          }
        }
      }
      x += w;
    }
    const fill = p.cores ? c.linear(p.cores) : p.cor;
    let brilhos = '';
    if (p.brilhoJanelas) brilhos = `<ellipse cx="${p.x + p.largura / 2}" cy="${p.base - p.alturaMax * 0.4}" rx="${p.largura * 0.55}" ry="${p.alturaMax * 0.7}" fill="${c.luz(p.janela, p.brilhoJanelas)}"/>`;
    return `${brilhos}<path d="${corpo}" fill="${fill}"/>${jan}`;
  };

  // Janela gótica com vitral, mainel e rendilhado. Usada em fachadas e interiores.
  function janelaGotica(c, x, y, l, a, { acesa, corLuz = '#ffb45a', vidroEscuro = '#0d0b13', moldura = '#2e2833', detalhe = 0.6, brilho = 0.32 } = {}) {
    let m = '';
    const vidro = acesa
      ? c.linear([[clarear(corLuz, 0.25), 0.95], [corLuz, 0.92], [escurecer(corLuz, 0.35), 0.95]])
      : vidroEscuro;
    if (acesa && brilho) m += `<ellipse cx="${r1(x + l / 2)}" cy="${r1(y + a * 0.55)}" rx="${r1(l * 1.6)}" ry="${r1(a * 0.95)}" fill="${c.luz(corLuz, brilho)}"/>`;
    m += `<path d="${arcoGotico(x - 3, y - 4, l + 6, a + 4)}" fill="${moldura}"/>`;
    m += `<path d="${arcoGotico(x, y, l, a)}" fill="${vidro}"/>`;
    if (detalhe > 0 && l > 14) {
      const cor = acesa ? escurecer(corLuz, 0.65) : moldura;
      const sw = Math.max(1, l * 0.06);
      m += `<line x1="${r1(x + l / 2)}" y1="${r1(y + l * 0.45)}" x2="${r1(x + l / 2)}" y2="${r1(y + a)}" stroke="${cor}" stroke-width="${r1(sw)}"/>`;
      if (a > l * 2) m += `<line x1="${r1(x)}" y1="${r1(y + a * 0.62)}" x2="${r1(x + l)}" y2="${r1(y + a * 0.62)}" stroke="${cor}" stroke-width="${r1(sw)}"/>`;
      m += `<circle cx="${r1(x + l / 2)}" cy="${r1(y + l * 0.42)}" r="${r1(l * 0.16)}" fill="none" stroke="${cor}" stroke-width="${r1(sw * 0.8)}"/>`;
    }
    return m;
  }

  // Fachada gótica próxima (Saint Agnes): torre do relógio, alas, contrafortes, janelas.
  P.fachada_gotica = (c, p) => {
    const { centro = 800, largura = 1500, base = 640, altura = 300, cor = '#1b1720', telhado = '#100d13', detalhe = '#2b2531', janela = '#ffb45a', acesas = 0.6 } = p;
    const rnd = aleatorio(p.semente ?? 'fachada');
    const esq = centro - largura / 2;
    const dir = centro + largura / 2;
    const tw = 190;
    const tx = centro - tw / 2;
    const tTopo = base - altura * 1.3;
    let s = '';
    // telhado das alas, com águas-furtadas
    s += `<path d="M${esq - 12},${base - altura} L${esq + 70},${base - altura - 120} H${dir - 70} L${dir + 12},${base - altura} Z" fill="${telhado}"/>`;
    for (let x = esq + 140; x < dir - 120; x += 210) {
      if (Math.abs(x - centro) < tw) continue;
      s += `<path d="M${x - 22},${base - altura - 40} V${base - altura - 78} L${x},${base - altura - 112} L${x + 22},${base - altura - 78} V${base - altura - 40} Z" fill="${cor}"/>`;
      s += janelaGotica(c, x - 9, base - altura - 92, 18, 40, { acesa: rnd() < acesas, corLuz: janela, moldura: detalhe, brilho: 0.18 });
    }
    // paredes
    const parede = c.linear([clarear(cor, 0.06), cor, escurecer(cor, 0.25)]);
    s += `<rect x="${esq}" y="${base - altura}" width="${largura}" height="${altura + 4}" fill="${parede}"/>`;
    s += `<rect x="${esq}" y="${base - altura}" width="${largura}" height="10" fill="${detalhe}"/>`;
    s += `<rect x="${esq}" y="${base - altura * 0.48}" width="${largura}" height="6" fill="${detalhe}" opacity=".8"/>`;
    // contrafortes com pináculos e janelas entre eles
    const baias = [];
    for (let x = esq + 30; x < dir - 20; x += 150) {
      if (x > tx - 40 && x < tx + tw + 20) continue;
      baias.push(x);
      s += `<path d="M${x - 11},${base + 4} V${base - altura + 10} L${x - 6},${base - altura - 34} H${x + 6} L${x + 11},${base - altura + 10} V${base + 4} Z" fill="${detalhe}"/>`;
      s += `<path d="M${x - 3},${base - altura - 34} L${x},${base - altura - 86} L${x + 3},${base - altura - 34} Z" fill="${detalhe}"/>`;
    }
    for (const x of baias) {
      const prox = x + 150;
      if (prox > dir - 10 || (prox > tx - 40 && x < tx + tw)) continue;
      const meio = x + 75;
      s += janelaGotica(c, meio - 26, base - altura + 34, 52, 104, { acesa: rnd() < acesas, corLuz: janela, moldura: detalhe });
      s += janelaGotica(c, meio - 30, base - altura * 0.48 + 26, 60, 132, { acesa: rnd() < acesas, corLuz: janela, moldura: detalhe });
    }
    // torre do relógio
    s += `<rect x="${tx}" y="${tTopo}" width="${tw}" height="${base - tTopo + 4}" fill="${parede}"/>`;
    s += `<rect x="${tx - 8}" y="${tTopo - 10}" width="${tw + 16}" height="14" fill="${detalhe}"/>`;
    for (const px of [tx - 4, tx + tw - 12]) {
      s += `<path d="M${px},${tTopo - 8} V${tTopo - 40} L${px + 8},${tTopo - 90} L${px + 16},${tTopo - 40} V${tTopo - 8} Z" fill="${detalhe}"/>`;
    }
    s += `<path d="M${tx + 14},${tTopo - 8} L${centro},${tTopo - 250} L${tx + tw - 14},${tTopo - 8} Z" fill="${telhado}"/>`;
    s += `<path d="M${centro - 1.5},${tTopo - 248} V${tTopo - 282} M${centro - 9},${tTopo - 270} H${centro + 9}" stroke="${detalhe}" stroke-width="3"/>`;
    for (let i = 0; i < 2; i++) s += janelaGotica(c, tx + 34 + i * 92, tTopo + 26, 30, 70, { acesa: false, moldura: detalhe });
    const relY = tTopo + 160;
    s += `<circle cx="${centro}" cy="${relY}" r="120" fill="${c.luz('#f3e2b8', 0.28)}"/>`;
    s += `<circle cx="${centro}" cy="${relY}" r="50" fill="${detalhe}"/>`;
    s += `<circle cx="${centro}" cy="${relY}" r="44" fill="${c.radial([['#f6ead0', 0.95], ['#d9c49a', 0.9], ['#8d7a58', 0.9]])}"/>`;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      s += `<line x1="${r1(centro + Math.cos(a) * 36)}" y1="${r1(relY + Math.sin(a) * 36)}" x2="${r1(centro + Math.cos(a) * 41)}" y2="${r1(relY + Math.sin(a) * 41)}" stroke="#3a2e22" stroke-width="${i % 3 === 0 ? 3 : 1.5}"/>`;
    }
    s += `<line x1="${centro}" y1="${relY}" x2="${centro - 4}" y2="${relY - 30}" stroke="#1f1712" stroke-width="3.5" stroke-linecap="round"/>`;
    s += `<line x1="${centro}" y1="${relY}" x2="${centro - 1}" y2="${relY - 22}" stroke="#1f1712" stroke-width="5" stroke-linecap="round" transform="rotate(-8 ${centro} ${relY})"/>`;
    s += janelaGotica(c, centro - 34, relY + 74, 68, 120, { acesa: true, corLuz: janela, moldura: detalhe, brilho: 0.25 });
    // portal
    s += `<ellipse cx="${centro}" cy="${base - 40}" rx="170" ry="120" fill="${c.luz('#ffa850', 0.35)}"/>`;
    s += `<path d="${arcoGotico(centro - 62, base - 196, 124, 196)}" fill="${detalhe}"/>`;
    s += `<path d="${arcoGotico(centro - 52, base - 184, 104, 184)}" fill="${c.linear([['#ffcf86', 1], ['#e08a3c', 1], ['#5a2a14', 1]])}"/>`;
    s += `<path d="M${centro - 52},${base} V${base - 120} L${centro - 30},${base - 110} V${base} Z M${centro + 52},${base} V${base - 120} L${centro + 30},${base - 110} V${base} Z" fill="#2a1a12" opacity=".85"/>`;
    return s;
  };

  // Casa Vesper: mansão gótica (pode estar meio queimada).
  P.mansao = (c, p) => {
    const { x = 800, base = 600, escala = 1, cor = '#141017', telhado = '#0c0a0e', detalhe = '#231c24', janela = '#ffb04f', acesas = 0.5, queimada = false, piscar = true, brilho = 0.3 } = p;
    const rnd = aleatorio(p.semente ?? 'mansao');
    const parede = p.cores ? c.linear(p.cores) : cor;
    let s = `<g transform="translate(${x},${base}) scale(${escala})">`;
    // telhados (centro, torre, alas)
    s += `<path d="M-238,-300 L0,-440 L238,-300 Z" fill="${telhado}"/>`;
    s += `<path d="M-470,-210 L-430,-292 H-238 V-210 Z" fill="${telhado}"/>`;
    if (!queimada) s += `<path d="M470,-210 L430,-292 H238 V-210 Z" fill="${telhado}"/>`;
    s += `<rect x="-400" y="-340" width="26" height="70" fill="${detalhe}"/><rect x="330" y="-350" width="26" height="80" fill="${detalhe}"/>`;
    // paredes
    s += `<rect x="-230" y="-300" width="460" height="304" fill="${parede}"/>`;
    s += `<rect x="-460" y="-212" width="232" height="216" fill="${parede}"/>`;
    if (queimada) {
      s += `<path d="M228,4 V-212 L252,-200 L266,-236 L290,-206 L308,-226 L326,-198 L352,-240 L372,-204 L396,-222 L420,-196 L444,-214 L460,-200 V4 Z" fill="${escurecer(cor, 0.25)}"/>`;
      const vigas = [[250, -200, 280, -300], [300, -206, 290, -320], [350, -204, 380, -288], [400, -210, 430, -300], [446, -206, 452, -262], [262, -258, 420, -262]];
      for (const [x1, y1, x2, y2] of vigas) s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0a0708" stroke-width="9" stroke-linecap="square"/>`;
      s += `<ellipse cx="340" cy="-120" rx="150" ry="150" fill="${c.luz('#000000', 0.55)}"/>`;
    } else {
      s += `<rect x="228" y="-212" width="232" height="216" fill="${parede}"/>`;
    }
    // torre central
    s += `<rect x="-62" y="-520" width="124" height="230" fill="${parede}"/>`;
    s += `<path d="M-74,-520 L0,-660 L74,-520 Z" fill="${telhado}"/>`;
    s += `<path d="M-1.5,-656 V-690 M-8,-676 H8" stroke="${detalhe}" stroke-width="3"/>`;
    s += `<rect x="-238" y="-306" width="476" height="10" fill="${detalhe}"/><rect x="-466" y="-216" width="244" height="8" fill="${detalhe}"/>`;
    if (!queimada) s += `<rect x="222" y="-216" width="244" height="8" fill="${detalhe}"/>`;
    // janelas
    const jan = (jx, jy, l, a, chance = acesas) => {
      const acesa = rnd() < chance;
      let m = janelaGotica(c, jx, jy, l, a, { acesa, corLuz: janela, moldura: detalhe, brilho, detalhe: 0.6 });
      if (acesa && piscar && c.animar()) m = `<g class="arte-pisca-janela" style="${c.atraso(5)}">${m}</g>`;
      return m;
    };
    for (let andar = 0; andar < 3; andar++) {
      for (let i = 0; i < 5; i++) s += jan(-200 + i * 86, -280 + andar * 92, 36, 70);
    }
    for (let andar = 0; andar < 2; andar++) {
      for (let i = 0; i < 3; i++) {
        s += jan(-440 + i * 70, -192 + andar * 96, 32, 66);
        if (!queimada) s += jan(262 + i * 70, -192 + andar * 96, 32, 66);
        else s += janelaGotica(c, 262 + i * 70, -150 + andar * 70, 32, 56, { acesa: false, vidroEscuro: '#050304', moldura: '#0e0a0b' });
      }
    }
    s += jan(-20, -490, 40, 76, Math.max(acesas, 0.4));
    s += `<circle cx="0" cy="-380" r="26" fill="${detalhe}"/><circle cx="0" cy="-380" r="20" fill="${rnd() < acesas ? janela : '#0d0b13'}" opacity=".9"/>`;
    // porta
    s += `<path d="${arcoGotico(-40, -110, 80, 114)}" fill="${detalhe}"/>`;
    s += `<path d="${arcoGotico(-32, -100, 64, 104)}" fill="${p.portaAcesa ? c.linear([['#ffcf86', 1], ['#d47a30', 1], ['#4a200f', 1]]) : '#0b090c'}"/>`;
    if (p.portaAcesa) s += `<ellipse cx="0" cy="-20" rx="150" ry="90" fill="${c.luz('#ff9e48', 0.35)}"/>`;
    return s + '</g>';
  };

  // Estação de trem: cobertura de ferro e vidro, colunas, lampiões, placa, banco e trilhos.
  P.estacao = (c, p) => {
    const ferro = p.cor ?? '#120f12';
    const topo = p.topo ?? 120;
    let s = '';
    // trilhos e cascalho
    s += `<rect x="-20" y="650" width="1640" height="90" fill="${c.linear(['#14121a', '#0a090c'])}"/>`;
    for (const y of [676, 712]) s += `<rect x="-20" y="${y}" width="1640" height="3" fill="#6f6a72" opacity=".55"/><rect x="-20" y="${y + 3}" width="1640" height="3" fill="#050405"/>`;
    for (let x = -20; x < 1640; x += 38) s += `<rect x="${x}" y="670" width="20" height="52" fill="#1b1714" opacity=".7"/>`;
    // plataforma
    s += `<path d="M-20,738 H1620 V940 H-20 Z" fill="${c.linear(['#2a2528', '#141115', '#09080a'])}"/>`;
    s += `<rect x="-20" y="736" width="1640" height="7" fill="#a89d8a" opacity=".55"/>`;
    for (let x = -20; x < 1640; x += 120) s += `<line x1="${x}" y1="743" x2="${x - 60}" y2="940" stroke="#0b0a0c" stroke-width="2" opacity=".6"/>`;
    // cobertura
    s += `<rect x="-20" y="-20" width="1640" height="${topo + 20}" fill="${c.linear(['#0b090b', ferro])}"/>`;
    for (let x = -20; x < 1640; x += 26) s += `<line x1="${x}" y1="0" x2="${x}" y2="${topo - 14}" stroke="#2a2630" stroke-width="2" opacity=".55"/>`;
    s += `<path d="M-20,${topo} ${Array.from({ length: 41 }, (_, i) => `Q${-20 + i * 41 + 20},${topo + 22} ${-20 + (i + 1) * 41},${topo}`).join(' ')} V${topo - 8} H-20 Z" fill="${ferro}"/>`;
    // colunas com treliças em arco
    const colunas = p.colunas ?? [150, 1450];
    for (const x of colunas) {
      s += `<rect x="${x - 9}" y="${topo}" width="18" height="${738 - topo}" fill="${ferro}"/>`;
      s += `<rect x="${x - 15}" y="${topo + 4}" width="30" height="12" fill="${ferro}"/><rect x="${x - 15}" y="722" width="30" height="16" fill="${ferro}"/>`;
      s += `<path d="M${x - 9},${topo + 110} Q${x - 9},${topo + 18} ${x - 150},${topo + 12}" stroke="${ferro}" stroke-width="7" fill="none"/>`;
      s += `<path d="M${x + 9},${topo + 110} Q${x + 9},${topo + 18} ${x + 150},${topo + 12}" stroke="${ferro}" stroke-width="7" fill="none"/>`;
      s += `<circle cx="${x - 38}" cy="${topo + 40}" r="10" fill="none" stroke="${ferro}" stroke-width="4"/><circle cx="${x + 38}" cy="${topo + 40}" r="10" fill="none" stroke="${ferro}" stroke-width="4"/>`;
    }
    // lampiões pendurados
    for (const x of p.lampioes ?? [520, 1080]) {
      s += `<line x1="${x}" y1="${topo}" x2="${x}" y2="${topo + 70}" stroke="${ferro}" stroke-width="3"/>`;
      s += `<ellipse cx="${x}" cy="${topo + 96}" rx="190" ry="190" fill="${c.luz('#ffbe6a', 0.42)}"/>`;
      s += `<path d="M${x - 14},${topo + 74} H${x + 14} L${x + 10},${topo + 112} H${x - 10} Z" fill="${c.linear([['#ffe2a8', 1], ['#ffad52', 1]])}" stroke="${ferro}" stroke-width="3"/>`;
      s += `<path d="M${x - 18},${topo + 74} L${x},${topo + 62} L${x + 18},${topo + 74} Z" fill="${ferro}"/>`;
    }
    // placa
    const px = p.placaX ?? 800;
    s += `<line x1="${px - 70}" y1="${topo}" x2="${px - 70}" y2="${topo + 46}" stroke="${ferro}" stroke-width="3"/><line x1="${px + 70}" y1="${topo}" x2="${px + 70}" y2="${topo + 46}" stroke="${ferro}" stroke-width="3"/>`;
    s += `<rect x="${px - 112}" y="${topo + 44}" width="224" height="46" rx="3" fill="#1d1418" stroke="#8c7444" stroke-width="2"/>`;
    s += `<text x="${px}" y="${topo + 75}" text-anchor="middle" font-family="'Cormorant Garamond', 'Times New Roman', serif" font-size="25" letter-spacing="7" fill="#d6c39a">BELLGRAVE</text>`;
    // banco
    const bx = p.bancoX ?? 300;
    s += `<g fill="#0c0a0c"><rect x="${bx}" y="700" width="170" height="10"/><rect x="${bx}" y="668" width="170" height="8"/><rect x="${bx}" y="684" width="170" height="6"/><rect x="${bx + 10}" y="708" width="8" height="34"/><rect x="${bx + 152}" y="708" width="8" height="34"/><rect x="${bx + 6}" y="660" width="8" height="52"/><rect x="${bx + 156}" y="660" width="8" height="52"/></g>`;
    return s;
  };

  P.poste = (c, p) => {
    const { x, base = 700, altura = 270, cor = '#0c0a0d', luz = '#ffbe6a', escala = 1 } = p;
    const a = altura * escala;
    let s = `<ellipse cx="${x}" cy="${base - a + 24 * escala}" rx="${170 * escala}" ry="${170 * escala}" fill="${c.luz(luz, p.forca ?? 0.45)}"/>`;
    s += `<g fill="${cor}"><rect x="${x - 10 * escala}" y="${base - 26 * escala}" width="${20 * escala}" height="${26 * escala}"/><rect x="${x - 4 * escala}" y="${base - a}" width="${8 * escala}" height="${a}"/>`;
    s += `<path d="M${x - 16 * escala},${base - a} H${x + 16 * escala} L${x},${base - a - 14 * escala} Z"/></g>`;
    s += `<path d="M${x - 11 * escala},${base - a + 2 * escala} H${x + 11 * escala} L${x + 8 * escala},${base - a + 40 * escala} H${x - 8 * escala} Z" fill="${c.linear([['#ffe4ad', 1], [luz, 1]])}" stroke="${cor}" stroke-width="${2.5 * escala}"/>`;
    return s;
  };

  P.hera = (c, p) => {
    const rnd = aleatorio(p.semente ?? 'hera');
    let s = '';
    for (const area of p.areas) {
      const n = Math.round((area.l * area.a) / (p.densidade ?? 260));
      for (let i = 0; i < n; i++) {
        const x = area.x + rnd() * area.l;
        const y = area.y + Math.pow(rnd(), 0.7) * area.a;
        const cor = rnd() < 0.2 ? (p.corClara ?? '#2a3a26') : (p.cor ?? '#121a12');
        s += folha(x, y, 0.4 + rnd() * 0.45, rnd() * 360, cor);
      }
    }
    return `<g opacity="${p.opacidade ?? 0.9}">${s}</g>`;
  };

  P.rosas = (c, p) => {
    const rnd = aleatorio(p.semente ?? 'rosas');
    const { x, y, largura = 300, altura = 160, quantidade = 9, escala = 1 } = p;
    let s = '';
    for (let i = 0; i < quantidade * 3; i++) {
      const fx = x + rnd() * largura;
      const fy = y + rnd() * altura;
      s += folha(fx, fy, escala * (0.9 + rnd() * 0.9), rnd() * 360, rnd() < 0.3 ? '#16231a' : '#0a110c');
    }
    for (let i = 0; i < quantidade; i++) {
      const rx = x + rnd() * largura;
      const ry = y + rnd() * altura * 0.8;
      s += `<path d="M${r1(rx)},${r1(ry)} q${r1((rnd() - 0.5) * 30)},${r1(50 * escala)} ${r1((rnd() - 0.5) * 20)},${r1(110 * escala)}" stroke="#0a0f0b" stroke-width="${r1(3 * escala)}" fill="none"/>`;
      s += rosa(c, rx, ry, escala * (0.9 + rnd() * 0.7), rnd, p.cor, p.borda);
    }
    return s;
  };

  P.pier = (c, p) => {
    const { xBase = 520, larguraBase = 300, xTopo = 760, larguraTopo = 60, yTopo = 560, cor = '#120d0c' } = p;
    let s = '';
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      const y = 900 - (900 - yTopo) * Math.pow(t, 0.75);
      const xl = xBase + (xTopo - xBase) * t;
      const w = larguraBase + (larguraTopo - larguraBase) * t;
      const ph = 40 * (1 - t) + 8;
      s += `<rect x="${r1(xl + 4)}" y="${r1(y)}" width="${r1(Math.max(3, 9 * (1 - t) + 2))}" height="${r1(ph)}" fill="${escurecer(cor, 0.3)}"/>`;
      s += `<rect x="${r1(xl + w - 12 * (1 - t) - 4)}" y="${r1(y)}" width="${r1(Math.max(3, 9 * (1 - t) + 2))}" height="${r1(ph)}" fill="${escurecer(cor, 0.3)}"/>`;
    }
    s += `<path d="M${xBase},905 L${xTopo},${yTopo} H${xTopo + larguraTopo} L${xBase + larguraBase},905 Z" fill="${c.linear([clarear(cor, 0.08), cor])}"/>`;
    for (let i = 1; i < 16; i++) {
      const t = Math.pow(i / 16, 0.75);
      const y = 905 - (905 - yTopo) * t;
      const xl = xBase + (xTopo - xBase) * t;
      const w = larguraBase + (larguraTopo - larguraBase) * t;
      s += `<line x1="${r1(xl)}" y1="${r1(y)}" x2="${r1(xl + w)}" y2="${r1(y)}" stroke="#050404" stroke-width="${r1(2.5 * (1 - t) + 0.6)}" opacity=".7"/>`;
    }
    if (p.lanterna !== false) {
      const lx = xTopo + larguraTopo - 6;
      const ly = yTopo - 46;
      s += `<ellipse cx="${lx}" cy="${ly + 10}" rx="120" ry="120" fill="${c.luz('#ffb45a', 0.5)}"/>`;
      s += `<rect x="${lx - 2}" y="${ly + 10}" width="4" height="40" fill="${cor}"/>`;
      s += `<path d="M${lx - 8},${ly - 4} H${lx + 8} L${lx + 6},${ly + 14} H${lx - 6} Z" fill="${c.linear([['#ffe2a8', 1], ['#ffa94e', 1]])}" stroke="${cor}" stroke-width="2"/>`;
    }
    return s;
  };

  P.balaustrada = (c, p) => {
    const { topo = 610, base = 760, cor = '#1a1619', de = -20, ate = 1620, passo = 46 } = p;
    const pedra = c.linear([clarear(cor, 0.16), cor, escurecer(cor, 0.4)]);
    let s = `<rect x="${de}" y="${base - 26}" width="${ate - de}" height="${940 - base + 26}" fill="${c.linear([escurecer(cor, 0.1), escurecer(cor, 0.6)])}"/>`;
    let balaustres = '';
    for (let x = de + 20; x < ate; x += passo) {
      const h = base - 26 - (topo + 24);
      const y0 = topo + 24;
      balaustres += `<path d="M${x - 9},${y0 + h} C${x - 16},${y0 + h * 0.75} ${x - 16},${y0 + h * 0.48} ${x - 5},${y0 + h * 0.36} C${x - 2},${y0 + h * 0.2} ${x - 8},${y0 + h * 0.08} ${x - 7},${y0} H${x + 7} C${x + 8},${y0 + h * 0.08} ${x + 2},${y0 + h * 0.2} ${x + 5},${y0 + h * 0.36} C${x + 16},${y0 + h * 0.48} ${x + 16},${y0 + h * 0.75} ${x + 9},${y0 + h} Z"/>`;
    }
    s += `<g fill="${pedra}">${balaustres}</g>`;
    s += `<rect x="${de}" y="${topo}" width="${ate - de}" height="26" fill="${pedra}"/>`;
    s += `<rect x="${de}" y="${topo}" width="${ate - de}" height="3" fill="${clarear(cor, 0.35)}" opacity=".6"/>`;
    for (const x of p.pilares ?? []) {
      s += `<rect x="${x - 34}" y="${topo - 20}" width="68" height="${base - topo + 20}" fill="${pedra}"/>`;
      s += `<rect x="${x - 40}" y="${topo - 30}" width="80" height="14" fill="${clarear(cor, 0.1)}"/>`;
    }
    return s;
  };

  P.lanternas = (c, p) => {
    let s = '';
    for (const it of p.itens) {
      const e = it.escala ?? 1;
      const { x, y } = it;
      s += `<ellipse cx="${x}" cy="${y + 8 * e}" rx="${150 * e}" ry="${150 * e}" fill="${c.luz(p.luz ?? '#ffb45a', p.forca ?? 0.5)}"/>`;
      if (it.corrente) s += `<line x1="${x}" y1="${it.corrente}" x2="${x}" y2="${y - 22 * e}" stroke="#0b090b" stroke-width="${2 * e}"/>`;
      s += `<path d="M${x - 12 * e},${y - 16 * e} H${x + 12 * e} L${x + 9 * e},${y + 22 * e} H${x - 9 * e} Z" fill="${c.linear([['#ffe7b4', 1], ['#ffa648', 1]])}" stroke="#0b090b" stroke-width="${3 * e}"/>`;
      s += `<path d="M${x - 15 * e},${y - 16 * e} L${x},${y - 28 * e} L${x + 15 * e},${y - 16 * e} Z M${x - 11 * e},${y + 22 * e} H${x + 11 * e} V${y + 28 * e} H${x - 11 * e} Z" fill="#0b090b"/>`;
      s += `<line x1="${x}" y1="${y - 14 * e}" x2="${x}" y2="${y + 20 * e}" stroke="#0b090b" stroke-width="${1.5 * e}"/>`;
    }
    return s;
  };

  P.arco_moldura = (c, p) => {
    const { x = 230, y = 70, largura = 1140, cor = '#0e0c0f' } = p;
    const pedra = c.linear([clarear(cor, 0.12), cor], { x2: 1, y2: 0 });
    let s = `<path fill-rule="evenodd" d="M-20,-20 H1620 V940 H-20 Z ${arcoGotico(x, y, largura, 940 - y)}" fill="${pedra}"/>`;
    s += `<path d="${arcoGotico(x, y, largura, 940 - y)}" fill="none" stroke="${clarear(cor, 0.2)}" stroke-width="10"/>`;
    s += `<path d="${arcoGotico(x - 30, y - 34, largura + 60, 940 - y + 34)}" fill="none" stroke="${clarear(cor, 0.08)}" stroke-width="6"/>`;
    const rnd = aleatorio('arco');
    for (let i = 0; i < 40; i++) {
      const lado = rnd() < 0.5 ? rnd() * (x - 30) : x + largura + 30 + rnd() * (1600 - x - largura - 30);
      const yy = rnd() * 900;
      s += `<rect x="${r1(lado)}" y="${r1(yy)}" width="${r1(40 + rnd() * 60)}" height="2" fill="#000" opacity=".35"/>`;
    }
    return s;
  };

  P.sino = (c, p) => {
    const { x = 420, y = 120, escala = 1, cor = '#2a2220' } = p;
    const e = escala;
    const bronze = c.linear([clarear(cor, 0.25), cor, escurecer(cor, 0.5)], { x2: 1, y2: 0, paradas: [0, 0.35, 1] });
    let s = `<g transform="translate(${x},${y}) scale(${e})">`;
    s += `<rect x="-260" y="-30" width="520" height="34" fill="#100c0b"/><rect x="-26" y="-6" width="52" height="40" fill="#120d0b"/>`;
    s += `<path d="M-24,34 C-30,40 -60,46 -70,90 C-78,128 -80,170 -112,206 C-118,214 -112,224 -100,224 H100 C112,224 118,214 112,206 C80,170 78,128 70,90 C60,46 30,40 24,34 Z" fill="${bronze}"/>`;
    s += `<path d="M-104,212 H104" stroke="${clarear(cor, 0.35)}" stroke-width="5" opacity=".6"/>`;
    s += `<path d="M-62,120 H62" stroke="${clarear(cor, 0.25)}" stroke-width="2" opacity=".45"/>`;
    s += `<circle cx="0" cy="236" r="14" fill="#0c0807"/>`;
    s += `<path d="M-96,200 C-70,160 -66,100 -50,60" stroke="#e9d8b0" stroke-width="3" fill="none" opacity=".18"/>`;
    return s + '</g>';
  };

  P.parapeito = (c, p) => {
    const { topo = 650, cor = '#161317' } = p;
    const pedra = c.linear([clarear(cor, 0.18), cor, escurecer(cor, 0.5)]);
    let s = `<rect x="-20" y="${topo}" width="1640" height="${940 - topo}" fill="${pedra}"/>`;
    for (let x = -20; x < 1640; x += 150) s += `<rect x="${x}" y="${topo - 46}" width="96" height="50" fill="${pedra}"/><rect x="${x}" y="${topo - 46}" width="96" height="3" fill="${clarear(cor, 0.35)}" opacity=".5"/>`;
    const rnd = aleatorio('parapeito');
    for (let y = topo + 30; y < 900; y += 34) {
      const off = rnd() * 80;
      s += `<rect x="-20" y="${y}" width="1640" height="2" fill="#000" opacity=".4"/>`;
      for (let x = -20 + off; x < 1640; x += 120) s += `<rect x="${r1(x)}" y="${y}" width="2" height="34" fill="#000" opacity=".3"/>`;
    }
    return s;
  };

  P.escadaria = (c, p) => {
    const { centro = 800, topo = 600, larguraTopo = 380, larguraBase = 1500, degraus = 9, cor = '#1f1a1d', velas = 60, acesas = true } = p;
    const rnd = aleatorio(p.semente ?? 'escadaria');
    let s = '';
    const ys = [];
    for (let i = 0; i <= degraus; i++) ys.push(topo + (905 - topo) * Math.pow(i / degraus, 1.25));
    for (let i = 0; i < degraus; i++) {
      const t = i / degraus;
      const w0 = larguraTopo + (larguraBase - larguraTopo) * t;
      const w1 = larguraTopo + (larguraBase - larguraTopo) * ((i + 1) / degraus);
      const y0 = ys[i];
      const y1 = ys[i + 1];
      const espelho = y0 + (y1 - y0) * 0.45;
      s += `<path d="M${r1(centro - w0 / 2)},${r1(y0)} H${r1(centro + w0 / 2)} L${r1(centro + w1 / 2)},${r1(espelho)} H${r1(centro - w1 / 2)} Z" fill="${clarear(cor, 0.1)}"/>`;
      s += `<path d="M${r1(centro - w1 / 2)},${r1(espelho)} H${r1(centro + w1 / 2)} V${r1(y1)} H${r1(centro - w1 / 2)} Z" fill="${escurecer(cor, 0.35)}"/>`;
    }
    const lista = [];
    for (let i = 0; i < velas; i++) {
      const deg = Math.floor(rnd() * degraus);
      const t = (deg + 0.5) / degraus;
      const w = larguraTopo + (larguraBase - larguraTopo) * t;
      let u = rnd();
      if (Math.abs(u - 0.5) < 0.12) u = u < 0.5 ? u - 0.14 : u + 0.14;
      const xx = centro - w / 2 + u * w;
      const yy = ys[deg] + (ys[deg + 1] - ys[deg]) * 0.42;
      lista.push([xx, yy, 0.55 + t * 1.1]);
    }
    lista.sort((a, b) => a[1] - b[1]);
    for (const [xx, yy, e] of lista) s += vela(c, xx, yy, e, acesas, { forcaHalo: 0.42 });
    return s;
  };

  P.parede = (c, p) => {
    const { cor = '#1a1216', cor2, topo = -20, base = 940, padrao = 'damasco', rodape } = p;
    let s = `<rect x="-20" y="${topo}" width="1640" height="${base - topo}" fill="${c.linear([escurecer(cor, 0.45), cor, cor2 ?? escurecer(cor, 0.2)], { paradas: [0, 0.55, 1] })}"/>`;
    const id = novoId('pad');
    if (padrao === 'damasco') {
      c.defs.push(`<pattern id="${id}" width="90" height="120" patternUnits="userSpaceOnUse"><path d="M45,10 C60,30 70,40 45,60 C20,40 30,30 45,10 Z M45,60 C58,72 62,90 45,110 C28,90 32,72 45,60 Z M0,60 C10,70 14,80 0,92 M90,60 C80,70 76,80 90,92" fill="none" stroke="${clarear(cor, 0.22)}" stroke-width="2"/><circle cx="45" cy="60" r="4" fill="${clarear(cor, 0.2)}"/></pattern>`);
      s += `<rect x="-20" y="${topo}" width="1640" height="${base - topo}" fill="url(#${id})" opacity="${p.opacidadePadrao ?? 0.35}"/>`;
    } else if (padrao === 'pedra') {
      c.defs.push(`<pattern id="${id}" width="140" height="70" patternUnits="userSpaceOnUse"><path d="M0,0 H140 M0,35 H140 M70,0 V35 M0,35 V70 M140,35 V70" stroke="#000" stroke-width="2.5" opacity=".55"/></pattern>`);
      s += `<rect x="-20" y="${topo}" width="1640" height="${base - topo}" fill="url(#${id})" opacity="${p.opacidadePadrao ?? 0.6}"/>`;
    } else if (padrao === 'painel') {
      c.defs.push(`<pattern id="${id}" width="160" height="300" patternUnits="userSpaceOnUse"><rect x="16" y="20" width="128" height="260" fill="none" stroke="${clarear(cor, 0.18)}" stroke-width="3"/><rect x="26" y="30" width="108" height="240" fill="none" stroke="#000" stroke-width="2" opacity=".5"/></pattern>`);
      s += `<rect x="-20" y="${topo}" width="1640" height="${base - topo}" fill="url(#${id})" opacity="${p.opacidadePadrao ?? 0.5}"/>`;
    }
    if (rodape) {
      s += `<rect x="-20" y="${rodape}" width="1640" height="${base - rodape}" fill="${c.linear([escurecer(cor, 0.3), escurecer(cor, 0.6)])}"/>`;
      s += `<rect x="-20" y="${rodape}" width="1640" height="8" fill="${clarear(cor, 0.15)}"/>`;
      for (let x = 20; x < 1600; x += 160) s += `<rect x="${x}" y="${rodape + 26}" width="120" height="${Math.max(10, base - rodape - 50)}" fill="none" stroke="${clarear(cor, 0.1)}" stroke-width="3" opacity=".7"/>`;
    }
    return s;
  };

  P.piso = (c, p) => {
    const { topo = 700, cor = '#1a1310', cor2, estilo = 'madeira', fugaX = 800 } = p;
    const fugaY = topo - (p.profundidade ?? 260);
    let s = `<rect x="-20" y="${topo}" width="1640" height="${940 - topo}" fill="${c.linear([escurecer(cor, 0.3), cor2 ?? cor])}"/>`;
    if (estilo === 'madeira') {
      for (let x = -900; x < 2500; x += 70) {
        const t = (topo - fugaY) / (905 - fugaY);
        const xt = fugaX + (x - fugaX) * t;
        s += `<line x1="${r1(xt)}" y1="${topo}" x2="${x}" y2="905" stroke="#000" stroke-width="1.5" opacity=".45"/>`;
      }
    } else if (estilo === 'xadrez') {
      const linhas = 9;
      const colunas = 22;
      const claro = clarear(cor, 0.22);
      const yl = [];
      for (let i = 0; i <= linhas; i++) yl.push(topo + (905 - topo) * Math.pow(i / linhas, 1.6));
      const xEm = (x, y) => fugaX + (x - fugaX) * ((y - fugaY) / (905 - fugaY));
      let tiles = '';
      for (let i = 0; i < linhas; i++) {
        for (let j = -colunas; j < colunas; j++) {
          if ((i + j) % 2 === 0) continue;
          const x0 = fugaX + j * 130;
          const x1 = fugaX + (j + 1) * 130;
          tiles += `M${r1(xEm(x0, yl[i]))},${r1(yl[i])} L${r1(xEm(x1, yl[i]))},${r1(yl[i])} L${r1(xEm(x1, yl[i + 1]))},${r1(yl[i + 1])} L${r1(xEm(x0, yl[i + 1]))},${r1(yl[i + 1])} Z`;
        }
      }
      s += `<path d="${tiles}" fill="${claro}" opacity="${p.contraste ?? 0.5}"/>`;
    } else if (estilo === 'pedra') {
      for (let i = 1; i < 8; i++) {
        const y = topo + (905 - topo) * Math.pow(i / 8, 1.5);
        s += `<line x1="-20" y1="${r1(y)}" x2="1620" y2="${r1(y)}" stroke="#000" stroke-width="2" opacity=".4"/>`;
      }
      for (let x = -900; x < 2500; x += 150) {
        const t = (topo - fugaY) / (905 - fugaY);
        s += `<line x1="${r1(fugaX + (x - fugaX) * t)}" y1="${topo}" x2="${x}" y2="905" stroke="#000" stroke-width="2" opacity=".35"/>`;
      }
    }
    if (p.tapete) {
      const t = p.tapete;
      const tt = (topo - fugaY) / (905 - fugaY);
      s += `<path d="M${r1(fugaX - t.largura / 2 * tt)},${topo} H${r1(fugaX + t.largura / 2 * tt)} L${fugaX + t.largura / 2},905 H${fugaX - t.largura / 2} Z" fill="${c.linear([escurecer(t.cor, 0.4), t.cor])}"/>`;
      s += `<path d="M${r1(fugaX - t.largura / 2 * tt + 8 * tt)},${topo} L${fugaX - t.largura / 2 + 22},905 M${r1(fugaX + t.largura / 2 * tt - 8 * tt)},${topo} L${fugaX + t.largura / 2 - 22},905" stroke="#b08d4a" stroke-width="2.5" opacity=".45"/>`;
    }
    if (p.reflexo) s += `<ellipse cx="${p.reflexo.x ?? fugaX}" cy="${topo + 60}" rx="${p.reflexo.largura ?? 500}" ry="90" fill="${c.luz(p.reflexo.cor ?? '#ffb45a', p.reflexo.forca ?? 0.25)}"/>`;
    s += `<rect x="-20" y="${topo}" width="1640" height="${(905 - topo) * 0.5}" fill="${c.linear([['#000', 0.55], ['#000', 0]])}"/>`;
    return s;
  };

  // Janelas altas em arco com céu noturno, lua e feixes de luz no chão.
  P.janelas = (c, p) => {
    const { itens, ceu = ['#101a2c', '#1d2a44', '#2c3550'], luz = '#9fb6d8', moldura = '#1b161c', pisoY = 760, raios = true, forcaRaio = 0.22 } = p;
    let s = '';
    const vidro = c.linear(ceu);
    itens.forEach((it, idx) => {
      const { x, y, l, a } = it;
      const forma = it.redonda ? arcoRedondo : arcoGotico;
      const clip = novoId('clip');
      c.defs.push(`<clipPath id="${clip}"><path d="${forma(x, y, l, a)}"/></clipPath>`);
      if (raios) {
        const anima = c.animar();
        const g = c.linear([[luz, forcaRaio], [luz, 0]]);
        s += `<path${cls('arte-raio', anima)} style="${anima ? c.atraso(6) : ''}" d="M${x + l * 0.1},${y + a * 0.5} L${x + l * 0.9},${y + a * 0.5} L${x + l * 1.6 + (it.raioDx ?? 120)},${pisoY + 120} L${x - l * 0.6 + (it.raioDx ?? 120)},${pisoY + 120} Z" fill="${g}"/>`;
      }
      s += `<ellipse cx="${x + l / 2}" cy="${y + a * 0.5}" rx="${l * 1.6}" ry="${a * 0.8}" fill="${c.luz(luz, p.brilho ?? 0.22)}"/>`;
      s += `<path d="${forma(x - 14, y - 14, l + 28, a + 22)}" fill="${moldura}"/>`;
      s += `<g clip-path="url(#${clip})"><rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${vidro}"/>`;
      const rnd = aleatorio('janela' + idx + x);
      for (let i = 0; i < 18; i++) s += `<circle cx="${r1(x + rnd() * l)}" cy="${r1(y + rnd() * a * 0.7)}" r="${r1(0.6 + rnd())}" fill="#efe6d6" opacity="${r1((0.3 + rnd() * 0.6) * 100) / 100}"/>`;
      if (it.lua) s += P.lua(c, { x: x + l * (it.lua.x ?? 0.62), y: y + a * (it.lua.y ?? 0.3), raio: it.lua.raio ?? 26, halo: 0.5 });
      if (it.arvores) s += `<path d="${pinheiro(x + l * 0.2, y + a + 4, 60, a * 0.45, rnd)} ${pinheiro(x + l * 0.75, y + a + 4, 70, a * 0.38, rnd)}" fill="#05070b"/>`;
      s += '</g>';
      const sw = Math.max(4, l * 0.045);
      s += `<g stroke="${moldura}" stroke-width="${r1(sw)}" fill="none">`;
      s += `<line x1="${x + l / 2}" y1="${y + l * 0.3}" x2="${x + l / 2}" y2="${y + a}"/>`;
      for (let k = 1; k < 4; k++) s += `<line x1="${x}" y1="${r1(y + a * (0.35 + k * 0.17))}" x2="${x + l}" y2="${r1(y + a * (0.35 + k * 0.17))}" stroke-width="${r1(sw * 0.55)}"/>`;
      if (!it.redonda) s += `<path d="${arcoGotico(x + l * 0.08, y + l * 0.55, l * 0.42, a * 0.25)} ${arcoGotico(x + l * 0.5, y + l * 0.55, l * 0.42, a * 0.25)}" stroke-width="${r1(sw * 0.6)}"/><circle cx="${x + l / 2}" cy="${r1(y + l * 0.36)}" r="${r1(l * 0.13)}" stroke-width="${r1(sw * 0.6)}"/>`;
      s += '</g>';
      s += `<rect x="${x - 26}" y="${y + a}" width="${l + 52}" height="16" fill="${clarear(moldura, 0.12)}"/>`;
    });
    return s;
  };

  P.estantes = (c, p) => {
    const { de = -20, ate = 1620, topo = -20, base = 760, cor = '#1a120e', semente = 'estantes', vao } = p;
    const rnd = aleatorio(semente);
    const madeira = c.linear([clarear(cor, 0.1), cor, escurecer(cor, 0.4)], { x2: 1, y2: 0 });
    let s = `<rect x="${de}" y="${topo}" width="${ate - de}" height="${base - topo}" fill="${escurecer(cor, 0.55)}"/>`;
    const cores = ['#4a1620', '#2a3424', '#3d2a18', '#1c2338', '#5a4220', '#3a1a2a', '#26201c', '#55301c', '#1f2a2a'];
    const prateleira = p.prateleira ?? 74;
    let livros = '';
    for (let y = base - 10; y > topo + 30; y -= prateleira) {
      const escuridao = 1 - (y - topo) / (base - topo);
      if (escuridao > 0.88) continue;
      for (let x = de; x < ate;) {
        if (vao && x > vao[0] && x < vao[1]) { x = vao[1]; continue; }
        const w = 8 + rnd() * 15;
        const h = prateleira * (0.58 + rnd() * 0.3);
        if (rnd() < 0.05) { x += w * 2; continue; }
        const inclina = rnd() < 0.04 ? 8 : 0;
        const cor2 = cores[Math.floor(rnd() * cores.length)];
        livros += `<rect x="${r1(x)}" y="${r1(y - h)}" width="${r1(w)}" height="${r1(h)}" fill="${cor2}"${inclina ? ` transform="rotate(${inclina} ${r1(x)} ${r1(y)})"` : ''}/>`;
        if (rnd() < 0.35) livros += `<rect x="${r1(x + 1)}" y="${r1(y - h * 0.8)}" width="${r1(w - 2)}" height="2" fill="#c9a24e" opacity=".35"/>`;
        x += w + 0.8;
      }
      livros += `<rect x="${de}" y="${y}" width="${ate - de}" height="10" fill="${madeira}"/>`;
    }
    s += livros;
    for (let x = de; x <= ate; x += p.passoColuna ?? 230) {
      if (vao && x > vao[0] && x < vao[1]) continue;
      s += `<rect x="${x - 11}" y="${topo}" width="22" height="${base - topo}" fill="${madeira}"/>`;
    }
    if (p.galeria) {
      const g = p.galeria;
      s += `<rect x="${de}" y="${g}" width="${ate - de}" height="16" fill="${madeira}"/>`;
      let bal = '';
      for (let x = de; x < ate; x += 22) bal += `<rect x="${x}" y="${g - 46}" width="5" height="46"/>`;
      s += `<g fill="${escurecer(cor, 0.2)}">${bal}</g><rect x="${de}" y="${g - 52}" width="${ate - de}" height="8" fill="${madeira}"/>`;
    }
    if (p.escada) {
      const ex = p.escada;
      s += `<g stroke="${escurecer(cor, 0.1)}" stroke-width="9" stroke-linecap="round"><line x1="${ex}" y1="${base + 20}" x2="${ex + 120}" y2="${topo + 160}"/><line x1="${ex + 60}" y1="${base + 20}" x2="${ex + 180}" y2="${topo + 160}"/></g>`;
      for (let i = 1; i < 14; i++) {
        const t = i / 14;
        const x1 = ex + 120 * t;
        const y1 = base + 20 - (base + 20 - topo - 160) * t;
        s += `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x1 + 60)}" y2="${r1(y1)}" stroke="${escurecer(cor, 0.1)}" stroke-width="6"/>`;
      }
    }
    s += `<rect x="${de}" y="${topo}" width="${ate - de}" height="${(base - topo) * 0.75}" fill="${c.linear([['#000', 0.96], ['#000', 0.55], ['#000', 0]], { paradas: [0, 0.45, 1] })}"/>`;
    return s;
  };

  P.luminarias = (c, p) => {
    let s = '';
    for (const it of p.itens) {
      const { x, y } = it;
      const e = it.escala ?? 1;
      s += `<ellipse cx="${x}" cy="${y + 20 * e}" rx="${260 * e}" ry="${160 * e}" fill="${c.luz('#ffc77a', 0.45)}"/>`;
      s += `<rect x="${x - 220 * e}" y="${y + 40 * e}" width="${440 * e}" height="${16 * e}" fill="#1c120c"/><rect x="${x - 200 * e}" y="${y + 56 * e}" width="${400 * e}" height="${200 * e}" fill="#0d0907"/>`;
      s += `<path d="M${x + 60 * e},${y + 40 * e} l${70 * e},${-6 * e} l${6 * e},${6 * e} l${-70 * e},${6 * e} Z" fill="#d9ccb0" opacity=".7"/>`;
      s += `<rect x="${x - 4 * e}" y="${y - 10 * e}" width="${8 * e}" height="${50 * e}" fill="#8a6a2a"/><ellipse cx="${x}" cy="${y + 38 * e}" rx="${26 * e}" ry="${6 * e}" fill="#6a5020"/>`;
      s += `<path d="M${x - 48 * e},${y - 6 * e} C${x - 46 * e},${y - 34 * e} ${x + 46 * e},${y - 34 * e} ${x + 48 * e},${y - 6 * e} Z" fill="${c.linear([['#3d7a52', 1], ['#173523', 1]])}"/>`;
      s += `<path d="M${x - 46 * e},${y - 6 * e} H${x + 46 * e}" stroke="#ffe2a0" stroke-width="${3 * e}" opacity=".8"/>`;
    }
    return s;
  };

  P.escrivaninha = (c, p) => {
    const { x = 1100, base = 760, escala = 1, acesa = true, cor = '#1c120d' } = p;
    const e = escala;
    let s = `<g transform="translate(${x},${base}) scale(${e})">`;
    if (acesa) s += `<ellipse cx="40" cy="-120" rx="300" ry="220" fill="${c.luz('#ffb45a', 0.42)}"/>`;
    s += `<rect x="-170" y="-150" width="340" height="18" fill="${c.linear([clarear(cor, 0.2), cor])}"/>`;
    s += `<rect x="-160" y="-132" width="70" height="132" fill="${escurecer(cor, 0.2)}"/><rect x="100" y="-132" width="50" height="132" fill="${escurecer(cor, 0.2)}"/>`;
    s += `<rect x="-150" y="-118" width="50" height="34" fill="none" stroke="${clarear(cor, 0.12)}" stroke-width="2"/><circle cx="-125" cy="-101" r="3" fill="#8a6a2a"/>`;
    const livros = [['#4a1620', 120, 20], ['#2a3424', 110, 16], ['#3d2a18', 126, 18], ['#1c2338', 100, 14]];
    let yy = -150;
    livros.forEach(([corL, w, h], i) => {
      yy -= h;
      s += `<rect x="${-130 + i * 6}" y="${yy}" width="${w}" height="${h}" fill="${corL}"/><rect x="${-128 + i * 6}" y="${yy + h / 2 - 1}" width="${w - 4}" height="2" fill="#c9a24e" opacity=".3"/>`;
    });
    s += `<path d="M10,-150 l70,-4 l4,4 l-70,4 Z" fill="#e2d6bb" opacity=".8"/>`;
    s += `<ellipse cx="80" cy="-150" rx="16" ry="5" fill="#2b2421"/>`;
    s += vela(c, 80, -152, 1.6, acesa);
    return s + '</g>';
  };

  P.cama = (c, p) => {
    const { x = 330, base = 790, largura = 480, cor = '#5a1420', madeira = '#160e0b' } = p;
    let s = '';
    s += `<path d="M${x - 20},${base - 300} C${x - 20},${base - 360} ${x + 60},${base - 380} ${x + largura / 2},${base - 390} C${x + largura - 60},${base - 380} ${x + largura + 20},${base - 360} ${x + largura + 20},${base - 300} V${base} H${x - 20} Z" fill="${c.linear([clarear(madeira, 0.08), madeira])}"/>`;
    s += `<path d="M${x + 20},${base - 290} C${x + 40},${base - 330} ${x + largura - 40},${base - 330} ${x + largura - 20},${base - 290}" stroke="${clarear(madeira, 0.15)}" stroke-width="5" fill="none"/>`;
    s += `<rect x="${x + 30}" y="${base - 230}" width="${largura * 0.38}" height="60" rx="26" fill="${c.linear(['#bdb2a0', '#5d564d'])}"/><rect x="${x + largura * 0.55}" y="${base - 232}" width="${largura * 0.38}" height="60" rx="26" fill="${c.linear(['#b3a896', '#58514a'])}"/>`;
    s += `<path d="M${x - 30},${base - 190} H${x + largura + 30} L${x + largura + 50},${base + 10} H${x - 50} Z" fill="${c.linear([clarear(cor, 0.12), cor, escurecer(cor, 0.55)])}"/>`;
    for (let i = 1; i < 6; i++) s += `<path d="M${x + (largura * i) / 6},${base - 186} q${-8 + i * 2},100 ${-14 + i * 3},196" stroke="#000" stroke-width="3" opacity=".25" fill="none"/>`;
    return s;
  };

  P.lustre = (c, p) => {
    const { x = 800, y = 140, escala = 1, aceso = true, ouro = '#9a7a3a' } = p;
    const e = escala;
    const rnd = aleatorio('lustre' + x);
    let s = '';
    if (aceso) s += `<ellipse cx="${x}" cy="${y + 40 * e}" rx="${380 * e}" ry="${300 * e}" fill="${c.luz('#ffc373', p.forca ?? 0.42)}"/>`;
    s += `<line x1="${x}" y1="-20" x2="${x}" y2="${y - 40 * e}" stroke="#0c0a09" stroke-width="${4 * e}"/>`;
    s += `<g transform="translate(${x},${y}) scale(${e})"><g fill="none" stroke="${ouro}" stroke-width="4">`;
    s += '<path d="M0,-40 V70"/><ellipse cx="0" cy="40" rx="120" ry="20"/><ellipse cx="0" cy="0" rx="74" ry="12"/>';
    for (let i = 0; i < 6; i++) s += `<path d="M0,30 C${-40 + i * 16},${50} ${-120 + i * 48},${60} ${-120 + i * 48},${36}"/>`;
    s += '</g>';
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      s += `<path d="M${r1(Math.cos(a) * 118)},${r1(42 + Math.sin(a) * 18)} l-3,12 l3,8 l3,-8 Z" fill="#e8dcc4" opacity="${r1((0.35 + rnd() * 0.4) * 100) / 100}"/>`;
    }
    s += '</g>';
    for (let i = 0; i < 6; i++) s += vela(c, x + (-120 + i * 48) * e, y + 34 * e, 1.1 * e, aceso, { forcaHalo: 0.35 });
    for (let i = 0; i < 4; i++) s += vela(c, x + (-60 + i * 40) * e, y - 4 * e, 0.9 * e, aceso, { halo: false });
    return s;
  };

  P.candelabro = (c, p) => {
    const { x, base = 760, altura = 300, escala = 1, aceso = true, ouro = '#7d6230' } = p;
    const e = escala;
    const topo = base - altura * e;
    let s = `<g fill="${ouro}"><path d="M${x - 40 * e},${base} L${x},${base - 30 * e} L${x + 40 * e},${base} Z"/><rect x="${x - 4 * e}" y="${topo}" width="${8 * e}" height="${altura * e - 20 * e}"/></g>`;
    s += `<path d="M${x - 70 * e},${topo - 4 * e} C${x - 70 * e},${topo + 40 * e} ${x + 70 * e},${topo + 40 * e} ${x + 70 * e},${topo - 4 * e} M${x - 36 * e},${topo - 6 * e} C${x - 36 * e},${topo + 22 * e} ${x + 36 * e},${topo + 22 * e} ${x + 36 * e},${topo - 6 * e}" stroke="${ouro}" stroke-width="${5 * e}" fill="none"/>`;
    for (const dx of [-70, -36, 0, 36, 70]) s += vela(c, x + dx * e, topo - 4 * e, 1.25 * e, aceso, { forcaHalo: 0.4 });
    return s;
  };

  P.quadros = (c, p) => {
    const ouro = c.linear(['#d4b26a', '#8a6a2a', '#5a4218', '#b8954e'], { x2: 1, y2: 1 });
    let s = '';
    for (const it of p.itens) {
      const { x, y, l, a } = it;
      s += `<rect x="${x - 14}" y="${y - 14}" width="${l + 28}" height="${a + 28}" fill="${ouro}"/><rect x="${x - 6}" y="${y - 6}" width="${l + 12}" height="${a + 12}" fill="#2a1e0e"/>`;
      s += `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${c.radial([it.fundo ?? '#3a2a22', escurecer(it.fundo ?? '#3a2a22', 0.7)], { cy: 0.35, r: 0.8 })}"/>`;
      const cx = x + l / 2;
      const hy = y + a * 0.36;
      const hr = l * 0.17;
      s += `<path d="M${r1(cx - l * 0.38)},${y + a} C${r1(cx - l * 0.36)},${r1(y + a * 0.66)} ${r1(cx - l * 0.18)},${r1(y + a * 0.6)} ${r1(cx)},${r1(y + a * 0.6)} C${r1(cx + l * 0.18)},${r1(y + a * 0.6)} ${r1(cx + l * 0.36)},${r1(y + a * 0.66)} ${r1(cx + l * 0.38)},${y + a} Z" fill="#0d0907"/>`;
      s += `<ellipse cx="${r1(cx)}" cy="${r1(hy)}" rx="${r1(hr)}" ry="${r1(hr * 1.25)}" fill="#160f0b"/>`;
      if (it.olhosRaspados) {
        let riscos = '';
        const rr = aleatorio('raspado' + x);
        for (let k = 0; k < 7; k++) {
          const yy = hy - hr * 0.25 + rr() * hr * 0.4;
          riscos += `M${r1(cx - hr * (0.7 + rr() * 0.3))},${r1(yy)} L${r1(cx + hr * (0.7 + rr() * 0.3))},${r1(yy + (rr() - 0.5) * hr * 0.3)} `;
        }
        s += `<path d="${riscos}" stroke="#d8cbb0" stroke-width="2" opacity=".6" fill="none"/>`;
      }
      s += `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${c.linear([['#fff', 0.06], ['#fff', 0]], { x2: 1, y2: 1 })}"/>`;
    }
    return s;
  };

  P.cortinas = (c, p) => {
    const { cor = '#4a0f1c', topo = -20 } = p;
    let s = '';
    for (const it of p.itens) {
      const { x, largura, base = 780, lado = 'esq' } = it;
      const dobras = [];
      const n = 7;
      for (let i = 0; i <= n; i++) dobras.push([i / n, i % 2 === 0 ? escurecer(cor, 0.55) : clarear(cor, 0.12)]);
      const g = c.linear(dobras.map((d) => d[1]), { x2: 1, y2: 0, paradas: dobras.map((d) => d[0]) });
      const amarra = topo + (base - topo) * 0.58;
      const recolhe = lado === 'esq' ? x + largura * 0.25 : x + largura * 0.75;
      const d = lado === 'esq'
        ? `M${x},${topo} H${x + largura} C${x + largura * 0.9},${amarra - 120} ${recolhe + 30},${amarra - 20} ${recolhe},${amarra} C${recolhe + 10},${amarra + 80} ${x + largura * 0.7},${base - 60} ${x + largura * 0.8},${base} H${x} Z`
        : `M${x + largura},${topo} H${x} C${x + largura * 0.1},${amarra - 120} ${recolhe - 30},${amarra - 20} ${recolhe},${amarra} C${recolhe - 10},${amarra + 80} ${x + largura * 0.3},${base - 60} ${x + largura * 0.2},${base} H${x + largura} Z`;
      s += `<path d="${d}" fill="${g}"/>`;
      s += `<ellipse cx="${recolhe}" cy="${amarra}" rx="${largura * 0.18}" ry="9" fill="#9a7a3a" opacity=".8"/>`;
    }
    if (p.bando) s += `<path d="M-20,${topo} H1620 V${topo + 70} ${Array.from({ length: 9 }, (_, i) => `Q${1620 - i * 182 - 91},${topo + 140} ${1620 - (i + 1) * 182},${topo + 70}`).join(' ')} Z" fill="${c.linear([escurecer(cor, 0.2), cor])}"/>`;
    return s;
  };

  P.espelhos = (c, p) => {
    const ouro = c.linear(['#d4b26a', '#7a5a22', '#4a3414', '#b8954e'], { x2: 1, y2: 1 });
    let s = '';
    for (const it of p.itens) {
      const { x, y, l, a } = it;
      const clip = novoId('esp');
      c.defs.push(`<clipPath id="${clip}"><path d="${arcoRedondo(x, y, l, a)}"/></clipPath>`);
      s += `<path d="${arcoRedondo(x - 18, y - 18, l + 36, a + 30)}" fill="${ouro}"/><path d="${arcoRedondo(x - 6, y - 6, l + 12, a + 10)}" fill="#24180a"/>`;
      s += `<g clip-path="url(#${clip})"><rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${c.linear([p.vidro ?? '#262a33', escurecer(p.vidro ?? '#262a33', 0.55)])}"/>`;
      if (p.reflexoLuz !== false) s += `<ellipse cx="${x + l * 0.35}" cy="${y + a * 0.55}" rx="${l * 0.5}" ry="${a * 0.25}" fill="${c.luz(p.reflexoLuz ?? '#ffb45a', 0.28)}"/>`;
      s += `<path d="M${x},${y + a * 0.2} L${x + l},${y + a * 0.05} V${y + a * 0.16} L${x},${y + a * 0.34} Z" fill="#fff" opacity=".05"/>`;
      if (it.rachado && c.opcoes.vulto) {
        const vx = x + l * 0.46;
        const hy = y + a * 0.4;
        const anima = c.animar();
        s += `<g${cls('arte-vulto', anima)} opacity=".24" filter="${c.filtro('borrao', '<feGaussianBlur stdDeviation="2.2"/>')}">`;
        s += `<path d="M${r1(vx - l * 0.4)},${y + a} C${r1(vx - l * 0.38)},${r1(hy + a * 0.2)} ${r1(vx - l * 0.18)},${r1(hy + a * 0.14)} ${r1(vx)},${r1(hy + a * 0.14)} C${r1(vx + l * 0.18)},${r1(hy + a * 0.14)} ${r1(vx + l * 0.38)},${r1(hy + a * 0.2)} ${r1(vx + l * 0.4)},${y + a} Z" fill="${c.linear(['#c9d8e2', '#5a6a78'])}"/>`;
        s += `<rect x="${r1(vx - l * 0.06)}" y="${r1(hy + a * 0.04)}" width="${r1(l * 0.12)}" height="${r1(a * 0.12)}" fill="#b9c9d4"/>`;
        s += `<ellipse cx="${r1(vx)}" cy="${r1(hy)}" rx="${r1(l * 0.12)}" ry="${r1(l * 0.155)}" fill="#dbe5ec"/>`;
        s += `<path d="M${r1(vx - l * 0.14)},${r1(hy + l * 0.04)} C${r1(vx - l * 0.17)},${r1(hy - l * 0.2)} ${r1(vx + l * 0.17)},${r1(hy - l * 0.2)} ${r1(vx + l * 0.14)},${r1(hy + l * 0.05)} C${r1(vx + l * 0.18)},${r1(hy + l * 0.14)} ${r1(vx + l * 0.1)},${r1(hy + l * 0.2)} ${r1(vx + l * 0.12)},${r1(hy + l * 0.1)}" fill="#7f94a4"/>`;
        s += '</g>';
      }
      if (it.rachado) {
        const rnd = aleatorio('racha' + x);
        const cx0 = x + l * 0.66;
        const cy0 = y + a * 0.2;
        let d = '';
        for (let k = 0; k < 9; k++) {
          let px = cx0;
          let py = cy0;
          const ang = (k / 9) * Math.PI * 2 + rnd() * 0.4;
          d += `M${r1(px)},${r1(py)}`;
          for (let j = 0; j < 4; j++) {
            const passo = 22 + rnd() * 50;
            const aa = ang + (rnd() - 0.5) * 0.7;
            px += Math.cos(aa) * passo;
            py += Math.sin(aa) * passo;
            d += ` L${r1(px)},${r1(py)}`;
          }
        }
        s += `<path d="${d}" stroke="#e8edf2" stroke-width="1.3" fill="none" opacity=".55"/><circle cx="${r1(cx0)}" cy="${r1(cy0)}" r="6" fill="#e8edf2" opacity=".35"/>`;
      }
      s += '</g>';
    }
    return s;
  };

  P.manchas = (c, p) => {
    let s = '';
    for (const it of p.itens) {
      s += `<ellipse cx="${it.x}" cy="${it.y}" rx="${it.rx}" ry="${it.ry}" fill="${c.luz('#050302', it.forca ?? 0.8)}"/>`;
      s += `<path d="M${it.x - it.rx * 0.4},${it.y} C${it.x - it.rx * 0.3},${it.y - it.ry * 1.4} ${it.x + it.rx * 0.2},${it.y - it.ry * 1.6} ${it.x + it.rx * 0.1},${it.y - it.ry * 2.2} C${it.x + it.rx * 0.4},${it.y - it.ry * 1.2} ${it.x + it.rx * 0.5},${it.y - it.ry * 0.6} ${it.x + it.rx * 0.4},${it.y} Z" fill="#050302" opacity="${(it.forca ?? 0.8) * 0.5}"/>`;
    }
    return s;
  };

  P.teto_quebrado = (c, p) => {
    const { cor = '#0d0a0a', base = 330 } = p;
    const rnd = aleatorio('teto');
    let buraco = 'M330,-20';
    const pts = [];
    for (let x = 330; x <= 1270; x += 40) pts.push([x, 30 + rnd() * 50 + Math.sin(x / 120) * 30]);
    for (let x = 1270; x >= 330; x -= 36) pts.push([x, base - 40 - rnd() * 90 - Math.sin(x / 90) * 40]);
    buraco = 'M' + pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' L') + ' Z';
    let s = `<path fill-rule="evenodd" d="M-20,-20 H1620 V${base + 60} H-20 Z ${buraco}" fill="${c.linear([escurecer(cor, 0.3), cor])}"/>`;
    const vigas = [[300, 120, 720, 410, 26], [1300, 90, 980, 400, 22], [520, 40, 560, 300, 18], [1100, 60, 1180, 330, 20], [760, 10, 880, 260, 16]];
    for (const [x1, y1, x2, y2, w] of vigas) {
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#080606" stroke-width="${w}" stroke-linecap="butt"/>`;
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3a2a22" stroke-width="2" opacity=".5" transform="translate(-${w / 2 - 2},0)"/>`;
      if (p.brasas) s += `<circle cx="${x2}" cy="${y2}" r="${w * 0.4}" fill="${c.luz('#ff6a24', 0.7)}"/>`;
    }
    return s;
  };

  P.piano = (c, p) => {
    const { x = 900, base = 720, escala = 1, cor = '#0b090a', poeira = '#8f8a85' } = p;
    const e = escala;
    let s = `<g transform="translate(${x},${base}) scale(${e})">`;
    s += `<path d="M-250,-170 L60,-200 C150,-208 230,-190 250,-140 C266,-100 240,-80 200,-78 L-250,-60 Z" fill="${cor}"/>`;
    s += `<path d="M-250,-170 L60,-200 C150,-208 230,-190 250,-140" stroke="${poeira}" stroke-width="3" fill="none" opacity=".5"/>`;
    s += `<path d="M-230,-176 L120,-330 L150,-198 Z" fill="${clarear(cor, 0.05)}"/><line x1="-40" y1="-186" x2="40" y2="-290" stroke="${cor}" stroke-width="4"/>`;
    s += `<path d="M-230,-176 L120,-330" stroke="${poeira}" stroke-width="2.5" opacity=".45"/>`;
    s += `<rect x="-262" y="-112" width="170" height="26" fill="${c.linear([['#7a7570', 1], ['#3a3632', 1]])}"/>`;
    for (let i = 0; i < 12; i++) s += `<rect x="${-258 + i * 14}" y="-112" width="7" height="15" fill="#0a0909"/>`;
    s += `<g fill="${cor}"><rect x="-240" y="-62" width="18" height="62"/><rect x="170" y="-80" width="18" height="80"/><rect x="40" y="-70" width="16" height="70"/></g>`;
    s += `<rect x="-300" y="-40" width="120" height="16" fill="${cor}"/><rect x="-292" y="-24" width="10" height="24" fill="${cor}"/><rect x="-198" y="-24" width="10" height="24" fill="${cor}"/>`;
    return s + '</g>';
  };

  P.pedestal_rosas = (c, p) => {
    let s = '';
    const rnd = aleatorio('pedestal');
    for (const it of p.itens) {
      const { x, base = 760 } = it;
      const e = it.escala ?? 1;
      const pedra = c.linear(['#4a4048', '#1d181c'], { x2: 1, y2: 0 });
      s += `<rect x="${x - 26 * e}" y="${base - 150 * e}" width="${52 * e}" height="${150 * e}" fill="${pedra}"/><rect x="${x - 36 * e}" y="${base - 160 * e}" width="${72 * e}" height="14" fill="${pedra}"/>`;
      s += `<path d="M${x - 28 * e},${base - 160 * e} C${x - 34 * e},${base - 196 * e} ${x - 18 * e},${base - 210 * e} ${x - 14 * e},${base - 222 * e} H${x + 14 * e} C${x + 18 * e},${base - 210 * e} ${x + 34 * e},${base - 196 * e} ${x + 28 * e},${base - 160 * e} Z" fill="#141015"/>`;
      for (let i = 0; i < 9; i++) s += folha(x + (rnd() - 0.5) * 80 * e, base - 222 * e - rnd() * 50 * e, e * 1.1, rnd() * 360, '#0a110c');
      for (let i = 0; i < 7; i++) s += rosa(c, x + (rnd() - 0.5) * 70 * e, base - 236 * e - rnd() * 46 * e, e * 1.05, rnd);
    }
    return s;
  };

  P.incendio = (c, p) => {
    const { x = 760, base = 520, escala = 0.62, reflexo = 540 } = p;
    const rnd = aleatorio('incendio');
    let chamas = '';
    const cores = ['#ffd27a', '#ff9a3a', '#e5531e', '#a8240f'];
    for (let i = 0; i < 26; i++) {
      const fx = x + (rnd() - 0.5) * 560 * escala * 1.6;
      const fh = (80 + rnd() * 220) * escala * 1.4;
      const fw = (24 + rnd() * 50) * escala * 1.4;
      const fy = base - (rnd() * 280 * escala);
      const cor = cores[Math.floor(rnd() * cores.length)];
      const anima = c.animar();
      const torce = (rnd() - 0.5) * fw * 1.2;
      chamas += `<path${cls('arte-fogo', anima)} style="${anima ? c.atraso(2) : ''}" d="M${r1(fx - fw)},${r1(fy)} C${r1(fx - fw * 1.1)},${r1(fy - fh * 0.45)} ${r1(fx - fw * 0.3 + torce)},${r1(fy - fh * 0.7)} ${r1(fx + torce)},${r1(fy - fh)} C${r1(fx + fw * 0.15 + torce * 0.5)},${r1(fy - fh * 0.62)} ${r1(fx + fw * 1.05)},${r1(fy - fh * 0.42)} ${r1(fx + fw)},${r1(fy)} Z" fill="${cor}" opacity="${r1((0.45 + rnd() * 0.45) * 100) / 100}"/>`;
    }
    const casa = P.mansao(c, { x, base, escala, cor: '#0a0506', telhado: '#060304', detalhe: '#120808', janela: '#ffb04f', acesas: 0.85, piscar: true, queimada: true, brilho: 0.45 });
    const suaviza = c.filtro('chamas', '<feGaussianBlur stdDeviation="3"/>');
    const grupo = `<ellipse cx="${x}" cy="${base - 160 * escala}" rx="${700 * escala}" ry="${420 * escala}" fill="${c.luz('#ff6a24', 0.55)}"/>${casa}<g style="mix-blend-mode:screen" filter="${suaviza}">${chamas}</g>`;
    const clip = novoId('agua');
    c.defs.push(`<clipPath id="${clip}"><rect x="-20" y="${reflexo}" width="1640" height="400"/></clipPath>`);
    const ondas = novoId('ondas');
    let linhas = '';
    for (let y = reflexo; y < 900; y += 6) linhas += `<rect x="-20" y="${y}" width="1640" height="3" fill="#fff"/>`;
    c.defs.push(`<mask id="${ondas}">${linhas}</mask>`);
    return `${grupo}<g clip-path="url(#${clip})"><g mask="url(#${ondas})" opacity=".42"><g class="arte-ondula"><g transform="translate(0,${reflexo * 2}) scale(1,-1)">${grupo}</g></g></g></g>`;
  };

  P.mascara_flutuante = (c, p) => {
    const { x = 800, y = 330, escala = 1.6, rotacao = -8 } = p;
    const anima = c.animar();
    return `<ellipse cx="${x}" cy="${y}" rx="${200 * escala}" ry="${140 * escala}" fill="${c.luz('#f3e6d0', 0.18)}"/><g${cls('arte-flutua', anima)}><g transform="translate(${x - 80 * escala},${y - 40 * escala}) rotate(${rotacao} ${80 * escala} ${40 * escala}) scale(${escala})">${mascaraOrnamento(c, '#efe7da', '#b8ad9c', true)}</g></g>`;
  };

  // Feixe de luz (luar entrando por um buraco ou janela).
  P.feixe = (c, p) => {
    const { x1, x2, y1, x3, x4, y2, cor = '#b9c8e0', forca = 0.2 } = p;
    const anima = c.animar();
    const borra = c.filtro('feixe', '<feGaussianBlur stdDeviation="14"/>');
    return `<g filter="${borra}"><path${cls('arte-raio', anima)} d="M${x1},${y1} L${x2},${y1} L${x4},${y2} L${x3},${y2} Z" fill="${c.linear([[cor, forca * 0.5], [cor, forca], [cor, forca * 0.3], [cor, 0]], { paradas: [0, 0.25, 0.7, 1] })}"/></g><ellipse cx="${(x3 + x4) / 2}" cy="${y2}" rx="${(x4 - x3) * 0.7}" ry="60" fill="${c.luz(cor, forca * 0.9)}"/>`;
  };

  // Arandelas: castiçais presos à parede.
  P.arandelas = (c, p) => {
    let s = '';
    for (const it of p.itens) {
      const e = it.escala ?? 1;
      const { x, y } = it;
      s += `<path d="M${x},${y + 30 * e} C${x - 4 * e},${y + 10 * e} ${x - 22 * e},${y + 10 * e} ${x - 22 * e},${y - 4 * e} M${x},${y + 30 * e} C${x + 4 * e},${y + 10 * e} ${x + 22 * e},${y + 10 * e} ${x + 22 * e},${y - 4 * e}" stroke="${p.ouro ?? '#8a6a2a'}" stroke-width="${3 * e}" fill="none"/>`;
      s += `<rect x="${x - 6 * e}" y="${y + 24 * e}" width="${12 * e}" height="${16 * e}" fill="${p.ouro ?? '#8a6a2a'}"/>`;
      s += vela(c, x - 22 * e, y - 2 * e, 0.9 * e, p.acesas !== false, { forcaHalo: 0.5 });
      s += vela(c, x + 22 * e, y - 2 * e, 0.9 * e, p.acesas !== false, { forcaHalo: 0.5 });
    }
    return s;
  };

  P.vinheta = (c, p) => `<rect x="-20" y="-20" width="1640" height="940" fill="${c.radial([['#000', 0], ['#000', 0], ['#000', p.forca ?? 0.75]], { r: 0.75, paradas: [0, 0.55, 1] })}"/>`;

  P.sombra = (c, p) => `<rect x="-20" y="-20" width="1640" height="940" fill="${c.linear(p.cores, { x1: p.x1 ?? 0, y1: p.y1 ?? 0, x2: p.x2 ?? 1, y2: p.y2 ?? 0, paradas: p.paradas })}"/>`;

  /* =========================================================================
     ORNAMENTOS (strings SVG usadas na interface)
     ========================================================================= */
  function mascaraOrnamento(c, cor, borda, porcelana = false) {
    const fill = porcelana ? c.linear([clarear(cor, 0.3), cor, escurecer(cor, 0.18)]) : c.linear([clarear(cor, 0.15), cor, escurecer(cor, 0.4)]);
    let s = `<path fill-rule="evenodd" d="M6,18 C20,30 40,8 80,24 C120,8 140,30 154,18 C158,46 142,66 116,68 C100,69 90,60 80,56 C70,60 60,69 44,68 C18,66 2,46 6,18 Z M36,38 C46,28 62,30 70,40 C60,48 44,48 36,38 Z M124,38 C114,28 98,30 90,40 C100,48 116,48 124,38 Z" fill="${fill}" stroke="${borda}" stroke-width="2"/>`;
    s += `<path d="M18,30 C28,22 34,30 30,36 M142,30 C132,22 126,30 130,36 M74,20 C78,14 82,14 86,20" stroke="${borda}" stroke-width="1.4" fill="none" opacity=".8"/>`;
    if (porcelana) s += `<path d="M96,24 L104,36 L98,44 L108,58 M60,56 L54,62 L58,68" stroke="#6a625a" stroke-width="1.2" fill="none" opacity=".7"/>`;
    return s;
  }

  function ornamento(nome, cor) {
    const c = novoContexto('orn' + nome, {}, 3);
    let vb = '0 0 100 100';
    let corpo = '';
    switch (nome) {
      case 'rosa': {
        vb = '0 0 100 150';
        const rnd = aleatorio('rosa-orn');
        corpo += '<path d="M50,64 C46,90 56,112 48,148" stroke="#0e1410" stroke-width="3.5" fill="none"/>';
        corpo += folha(48, 100, 1.1, -150, '#101a12') + folha(51, 118, 1, -30, '#0c140e');
        corpo += '<path d="M47,84 l-6,-3 l5,6 Z M52,128 l6,-2 l-5,6 Z" fill="#0e1410"/>';
        corpo += rosa(c, 50, 48, 2.2, rnd, cor ?? '#16070b', '#9a1f33');
        break;
      }
      case 'mascara':
        vb = '0 0 160 80';
        corpo = mascaraOrnamento(c, '#141015', cor ?? '#c9a24e');
        break;
      case 'selo': {
        vb = '0 0 120 120';
        const rnd = aleatorio('selo');
        const pts = [];
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * Math.PI * 2;
          const r = 52 + (rnd() - 0.5) * 8;
          pts.push(`${r1(60 + Math.cos(a) * r)},${r1(60 + Math.sin(a) * r)}`);
        }
        const cera = c.radial([[clarear(cor ?? '#1b1a1f', 0.25), 1], [cor ?? '#1b1a1f', 1], [escurecer(cor ?? '#1b1a1f', 0.6), 1]], { cx: 0.38, cy: 0.34, r: 0.7 });
        corpo += `<path d="M${pts.join(' L')} Z" fill="${cera}"/>`;
        corpo += '<circle cx="60" cy="60" r="38" fill="none" stroke="#000" stroke-width="3" opacity=".5"/><circle cx="60" cy="60" r="36" fill="none" stroke="#b8954e" stroke-width="1.6" opacity=".85"/>';
        corpo += `<path d="${heptagrama(60, 60, 28)}" fill="none" stroke="#c9a24e" stroke-width="1.8" stroke-linejoin="round"/>`;
        corpo += '<circle cx="60" cy="60" r="5" fill="#c9a24e" opacity=".85"/><ellipse cx="44" cy="40" rx="14" ry="6" fill="#fff" opacity=".08" transform="rotate(-30 44 40)"/>';
        break;
      }
      case 'vela':
        vb = '0 0 60 110';
        corpo = vela(c, 30, 104, 2.3, true, { corCera: cor ?? '#efe3c8', halo: false });
        break;
      case 'divisor': {
        vb = '0 0 400 24';
        const k = cor ?? '#b08d4a';
        corpo = `<g stroke="${k}" fill="none" stroke-width="1.2"><path d="M20,12 H170 M230,12 H380"/><path d="M170,12 C178,4 186,4 190,12 C186,20 178,20 170,12 M230,12 C222,4 214,4 210,12 C214,20 222,20 230,12"/><path d="M60,12 C70,6 80,6 84,12 M340,12 C330,6 320,6 316,12" opacity=".7"/></g><path d="M200,4 L208,12 L200,20 L192,12 Z" fill="${k}"/><circle cx="20" cy="12" r="2" fill="${k}"/><circle cx="380" cy="12" r="2" fill="${k}"/>`;
        break;
      }
      case 'canto': {
        vb = '0 0 80 80';
        const k = cor ?? '#b08d4a';
        corpo = `<g stroke="${k}" fill="none" stroke-width="1.4"><path d="M4,76 V12 C4,7 7,4 12,4 H76"/><path d="M12,64 V20 C12,15 15,12 20,12 H64" opacity=".6"/><path d="M4,40 C14,40 20,32 20,24 C20,18 26,14 32,16 C38,18 38,26 32,28" /><path d="M40,4 C40,14 32,20 24,20"/></g><circle cx="12" cy="12" r="3" fill="${k}"/>`;
        break;
      }
      default:
        return '';
    }
    return `<svg xmlns="${NS_SVG}" viewBox="${vb}" aria-hidden="true" focusable="false"><defs>${c.defs.join('')}</defs>${corpo}</svg>`;
  }

  /* =========================================================================
     PERSONAGENS
     ========================================================================= */
  const APARENCIAS = {
    lucien: { acento: '#c9a24e', frio: '#5d6b88', ombros: 1.07, cabelo: 'penteado', corCabelo: '#0d0b0c', roupa: 'terno', mascara: { forma: 'veneziana', cor: '#120f13', borda: '#c9a24e' } },
    dorian: { acento: '#b3263a', frio: '#5a6380', ombros: 1.03, cabelo: 'ondulado', corCabelo: '#1a0f0c', roupa: 'blazer', mascara: { forma: 'veneziana', cor: '#7a1424', borda: '#e0566a', joia: '#ff7a8a' } },
    elias: { acento: '#e3d6bc', frio: '#617089', ombros: 0.98, cabelo: 'curto', corCabelo: '#2a1d14', roupa: 'colete', oculos: true, cachecol: true, mascara: { forma: 'simples', cor: '#a9adb5', borda: '#eef0f3', metal: true } },
    cassian: { acento: '#8a97a8', frio: '#8a97a8', ombros: 1.04, cabelo: 'baguncado', corCabelo: '#0b0a0c', roupa: 'jaqueta', brinco: true, mascara: { forma: 'meia', cor: '#131315', borda: '#3d4148' } },
    adrian: { acento: '#9db9c9', frio: '#9db9c9', ombros: 0.99, cabelo: 'longo_ondulado', corCabelo: '#120f12', roupa: 'sobretudo', fantasma: true, mascara: { forma: 'porcelana', cor: '#ece6dc', borda: '#cbbfae' } },
    anne: { acento: '#7a1f33', frio: '#7d6f6a', feminino: true, ombros: 0.86, cabelo: 'liso_longo', corCabelo: '#120c0b', roupa: 'vestido', fita: true, desbotada: true, mascara: { forma: 'renda', cor: '#0d0a0c', borda: '#4a3238' } },
    margot: { acento: '#d39a4a', frio: '#6a6f86', feminino: true, ombros: 0.88, cabelo: 'chanel', corCabelo: '#2b1a10', roupa: 'cardigan', argolas: true, mascara: { forma: 'simples', cor: '#5a3a1a', borda: '#d39a4a' } },
    anfitriao: { acento: '#c9a24e', frio: '#5a5a66', ombros: 1.12, cabelo: 'capuz', roupa: 'manto', sempreMascara: true, mascara: { forma: 'inteira', cor: '#0b0b0d', borda: '#c9a24e' } },
    generico: { acento: '#b8a98a', frio: '#5d6b88', ombros: 1, cabelo: 'curto', corCabelo: '#141010', roupa: 'terno' },
  };

  const POSES = {
    neutro: { rot: 0, dy: 0, calor: 1, brilho: 1, sobr: 0, boca: 0 },
    sorriso: { rot: -3, dy: -3, calor: 1.15, brilho: 1.12, sobr: -1, boca: 1 },
    serio: { rot: 0, dy: 1, calor: 0.85, brilho: 0.9, sobr: 1, boca: 0 },
    triste: { rot: 4, dy: 8, calor: 0.7, brilho: 0.8, sobr: -2, boca: -1 },
    surpreso: { rot: -1, dy: -7, calor: 1, brilho: 1.18, sobr: -3, boca: 2 },
    irritado: { rot: -2, dy: 2, calor: 1.25, brilho: 1.02, sobr: 3, boca: -0.5 },
  };

  // Ajusta coordenadas x ao redor do centro (300) para alargar ou estreitar ombros.
  function largura(path, k) {
    return path.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${r1(300 + (Number(x) - 300) * k)},${y}`);
  }

  function torsoPath(a) {
    const k = a.ombros ?? 1;
    if (a.feminino) return largura('M270,500 C246,516 196,526 158,546 C126,562 112,592 108,632 C104,710 100,810 98,905 L502,905 C500,810 496,710 492,632 C488,592 474,562 442,546 C404,526 354,516 330,500 Z', k / 0.88);
    return largura('M262,500 C232,516 176,530 140,548 C108,562 92,592 86,632 C80,710 74,810 70,905 L530,905 C526,810 520,710 514,632 C508,592 492,562 460,548 C424,530 368,516 338,500 Z', k);
  }

  function cabecaPath(a) {
    if (a.feminino) return 'M300,232 C342,232 372,262 373,318 C374,366 354,404 326,426 C316,434 308,437 300,437 C292,437 284,434 274,426 C246,404 226,366 227,318 C228,262 258,232 300,232 Z';
    return 'M300,226 C346,226 378,258 380,315 C382,365 362,408 332,432 C320,441 310,444 300,444 C290,444 280,441 268,432 C238,408 218,365 220,315 C222,258 254,226 300,226 Z';
  }

  function pescocoPath(a) {
    return a.feminino ? 'M274,410 C276,450 272,482 266,512 L334,512 C328,482 324,450 326,410 Z' : 'M266,412 C268,452 264,486 256,516 L344,516 C336,486 332,452 334,412 Z';
  }

  // Cabelo: "tras" fica atrás da cabeça e do corpo; "frente" fica por cima do rosto.
  function cabeloPaths(a) {
    switch (a.cabelo) {
      case 'penteado':
        return {
          tras: 'M214,340 C202,272 226,198 300,186 C374,196 398,268 386,340 C380,354 372,356 368,346 C366,300 356,266 336,252 C314,240 286,240 264,252 C244,266 234,300 232,346 C228,356 220,354 214,340 Z',
          frente: '',
          mechas: ['M252,256 C268,222 300,204 344,210', 'M262,248 C284,226 318,218 360,230', 'M236,292 C236,246 262,214 300,202', 'M246,272 C256,236 286,214 326,210', 'M372,300 C374,262 362,232 340,216'],
        };
      case 'ondulado':
        return {
          tras: 'M212,360 C196,296 206,232 248,204 C280,182 330,182 360,202 C396,226 406,292 388,360 C384,370 378,368 376,356 C376,330 372,306 362,292 C252,288 238,300 226,356 C222,368 214,370 212,360 Z',
          frente: 'M226,300 C230,254 262,224 302,220 C342,222 372,250 378,298 C368,288 360,290 356,306 C346,284 330,284 326,302 C318,282 304,278 296,300 C290,318 300,330 292,336 C284,312 274,288 260,286 C250,292 242,300 240,316 C236,302 232,298 226,300 Z',
          mechas: ['M296,300 C292,318 300,328 294,336', 'M248,240 C268,224 292,220 316,228', 'M330,232 C352,238 366,254 374,274', 'M232,300 C230,330 222,346 216,356', 'M370,300 C374,330 382,346 386,356', 'M262,262 C276,248 296,244 314,250'],
        };
      case 'curto':
        return {
          tras: 'M220,328 C214,262 242,212 300,206 C358,210 386,258 380,328 C376,338 372,338 370,330 C366,296 360,276 346,264 C320,254 272,252 254,262 C240,274 232,296 230,330 C228,338 222,338 220,328 Z',
          frente: 'M252,262 C262,244 286,236 306,238 C292,246 282,256 276,270 Z',
          mechas: ['M268,250 C290,236 324,236 350,252', 'M270,232 L266,262'],
        };
      case 'baguncado':
        return {
          tras: 'M206,440 C190,380 190,300 208,250 C226,204 266,184 304,186 C348,188 384,212 396,262 C408,316 404,386 392,442 L380,404 L374,446 L364,398 L362,350 C358,320 348,300 336,292 C300,288 262,290 246,300 C238,320 236,350 236,396 L228,446 L222,404 L214,448 Z',
          frente: 'M228,316 C232,266 262,234 302,230 C342,232 372,256 378,300 C370,292 366,300 366,318 C358,300 350,296 344,322 C336,300 326,294 318,314 C312,298 302,294 294,320 C288,300 278,298 270,330 C266,306 258,302 250,322 C246,306 238,306 228,316 Z',
          mechas: ['M250,250 C276,232 312,230 344,246', 'M232,330 C228,370 230,400 238,430', 'M372,330 C376,370 374,400 368,430'],
        };
      case 'longo_ondulado':
        return {
          tras: 'M216,470 C202,440 208,404 200,370 C192,326 204,256 250,216 C280,194 322,192 354,208 C396,232 410,290 402,350 C398,392 404,428 392,466 C386,484 374,482 372,466 C376,442 368,420 364,398 C368,366 364,328 352,302 C330,292 270,292 248,302 C236,330 232,368 236,400 C232,420 226,442 230,466 C228,484 220,486 216,470 Z',
          frente: 'M226,338 C228,276 258,236 300,232 C342,236 372,276 374,338 C364,306 350,290 332,286 C322,300 310,304 302,292 C294,304 280,302 268,286 C250,290 236,306 226,338 Z',
          mechas: ['M232,352 C222,384 234,410 226,446', 'M368,352 C378,384 366,410 374,446', 'M246,330 C238,360 244,392 238,420', 'M354,330 C362,360 356,392 362,420', 'M262,250 C286,236 316,236 340,250', 'M300,234 C292,252 282,266 268,286', 'M300,234 C310,252 320,266 332,286'],
        };
      case 'liso_longo':
        return {
          tras: 'M212,760 C206,640 212,520 216,420 C216,330 226,262 254,234 C276,214 324,214 346,234 C374,262 384,330 384,420 C388,520 394,640 388,760 Z',
          frente: 'M228,560 C226,480 226,400 230,330 C232,276 258,240 298,236 C276,256 262,300 258,352 C254,420 256,500 262,580 Z M372,560 C374,480 374,400 370,330 C368,276 342,240 302,236 C324,256 338,300 342,352 C346,420 344,500 338,580 Z',
          mechas: ['M240,360 C236,440 238,520 244,560', 'M360,360 C364,440 362,520 356,560', 'M250,330 C246,420 248,500 252,570', 'M350,330 C354,420 352,500 348,570', 'M222,450 C220,560 222,660 226,740', 'M378,450 C380,560 378,660 374,740', 'M300,232 V262'],
        };
      case 'chanel':
        return {
          tras: 'M214,440 C204,380 204,300 220,256 C240,212 270,200 300,200 C330,200 360,212 380,256 C396,300 396,380 386,440 C360,446 340,440 338,430 L262,430 C260,440 240,446 214,440 Z',
          frente: 'M230,300 C238,252 266,226 300,224 C334,226 362,252 370,300 Z',
          mechas: ['M244,300 V260', 'M272,300 V246', 'M300,300 V240', 'M328,300 V246', 'M356,300 V262'],
        };
      case 'capuz':
        return {
          tras: 'M150,620 C170,500 190,380 214,300 C232,236 262,170 300,140 C338,170 368,236 386,300 C410,380 430,500 450,620 Z',
          frente: '',
          mechas: [],
          capuz: true,
        };
      default:
        return cabeloPaths({ cabelo: 'curto' });
    }
  }

  function roupaDetalhes(c, a, base) {
    const tecido = (cor) => c.linear([clarear(cor, 0.08), cor, escurecer(cor, 0.45)], { x1: 0, y1: 0, x2: 1, y2: 0.4 });
    const pele = c.linear(['#6d5146', '#3a2a25', '#140e0d'], { x2: 1, y2: 0 });
    const camisa = c.linear(['#d8cfbe', '#8e8678', '#2a2724'], { x2: 1, y2: 0.3 });
    let s = '';
    const espelhar = (m) => `${m}<g transform="translate(600,0) scale(-1,1)">${m}</g>`;
    switch (a.roupa) {
      case 'terno': {
        s += `<path d="M260,508 L300,700 L340,508 C322,520 278,520 260,508 Z" fill="${camisa}"/>`;
        s += '<path d="M291,520 H309 L313,544 L305,554 L315,684 L300,708 L285,684 L295,554 L287,544 Z" fill="#17121a"/>';
        s += `<path d="M293,524 H307 L309,538 L300,548 L291,538 Z" fill="${a.acento}" opacity=".18"/>`;
        s += espelhar(`<path d="M260,506 C246,560 244,610 258,660 L300,712 L276,612 L284,566 L268,544 Z" fill="${tecido('#0f0d12')}"/><path d="M260,506 C246,560 244,610 258,660 L300,712" stroke="${a.acento}" stroke-width="1.6" fill="none" opacity=".35"/><path d="M262,508 L284,500 L276,532 Z" fill="#e6dccb" opacity=".7"/>`);
        s += `<path d="M404,640 l26,-6 l-6,20 Z" fill="${a.acento}" opacity=".75"/>`;
        break;
      }
      case 'blazer': {
        s += `<path d="M246,508 L300,780 L354,508 C330,522 270,522 246,508 Z" fill="${camisa}"/>`;
        s += `<path d="M272,512 L300,590 L328,512 C316,520 284,520 272,512 Z" fill="${pele}"/>`;
        s += espelhar('<path d="M262,506 L250,548 L280,536 Z" fill="#e2d8c6" opacity=".75"/>');
        s += '<g transform="rotate(8 300 600)"><path d="M292,592 H310 L312,612 L304,620 L316,760 L302,786 L288,760 L296,620 L290,612 Z" fill="#5c1020"/></g>';
        s += espelhar(`<path d="M244,506 C226,580 228,680 248,800 L270,905 H232 C210,780 200,640 214,540 Z" fill="${tecido('#1c1117')}"/><path d="M244,506 C226,580 228,680 248,800" stroke="${a.acento}" stroke-width="1.8" fill="none" opacity=".4"/>`);
        break;
      }
      case 'colete': {
        s += `<path d="M196,560 C226,540 256,526 268,514 L300,640 L332,514 C344,526 374,540 404,560 C422,640 432,780 440,905 L160,905 C168,780 178,640 196,560 Z" fill="${tecido('#2f2b1e')}"/>`;
        const rib = novoId('rib');
        c.defs.push(`<pattern id="${rib}" width="9" height="20" patternUnits="userSpaceOnUse"><rect width="4" height="20" fill="#000" opacity=".22"/></pattern>`);
        s += `<path d="M196,560 C226,540 256,526 268,514 L300,640 L332,514 C344,526 374,540 404,560 C422,640 432,780 440,905 L160,905 C168,780 178,640 196,560 Z" fill="url(#${rib})"/>`;
        s += `<path d="M268,514 L300,640 L332,514 C320,522 280,522 268,514 Z" fill="${camisa}"/>`;
        s += '<path d="M293,524 H307 L309,540 L303,548 L310,632 L300,646 L290,632 L297,548 L291,540 Z" fill="#26332a"/>';
        s += `<path d="M268,514 L300,640 L332,514" stroke="${a.acento}" stroke-width="1.5" fill="none" opacity=".35"/>`;
        if (a.cachecol) {
          s += `<path d="M252,484 C270,504 330,504 350,484 L356,520 C330,540 270,540 246,520 Z" fill="${tecido('#3a1820')}"/>`;
          s += `<path d="M262,516 C252,600 250,700 246,780 L286,784 C288,700 290,600 292,526 Z" fill="${tecido('#3a1820')}"/>`;
          s += '<g stroke="#c9b48c" stroke-width="3" opacity=".35"><line x1="250" y1="600" x2="290" y2="602"/><line x1="248" y1="640" x2="289" y2="642"/><line x1="247" y1="760" x2="287" y2="762"/></g>';
          s += '<g stroke="#3a1820" stroke-width="2"><line x1="250" y1="782" x2="248" y2="800"/><line x1="258" y1="783" x2="257" y2="802"/><line x1="266" y1="783" x2="266" y2="801"/><line x1="274" y1="783" x2="275" y2="802"/><line x1="282" y1="784" x2="283" y2="800"/></g>';
        }
        break;
      }
      case 'jaqueta': {
        s += '<path d="M262,510 C280,536 320,536 338,510 L344,640 L256,640 Z" fill="#222126"/>';
        s += espelhar(`<path d="M262,512 L232,440 L248,436 L282,520 Z" fill="${tecido('#141317')}"/><path d="M232,440 L282,520" stroke="${a.acento}" stroke-width="1.6" opacity=".45"/>`);
        s += espelhar(`<path d="M256,520 C240,600 238,700 252,820 L262,905 H220 C206,780 200,640 214,548 Z" fill="${tecido('#121115')}"/>`);
        s += '<line x1="262" y1="560" x2="258" y2="905" stroke="#6d7480" stroke-width="2" stroke-dasharray="3 3" opacity=".6"/>';
        s += `<path d="M150,600 C170,580 200,568 226,566" stroke="${a.acento}" stroke-width="3" fill="none" opacity=".25"/><path d="M450,600 C430,580 400,568 374,566" stroke="${a.acento}" stroke-width="3" fill="none" opacity=".18"/>`;
        break;
      }
      case 'sobretudo': {
        s += espelhar(`<path d="M300,620 L246,514 L240,420 L268,436 L300,560 Z" fill="${tecido('#11151b')}"/><path d="M240,420 L246,514 L300,620" stroke="${a.acento}" stroke-width="1.6" fill="none" opacity=".45"/>`);
        s += '<path d="M274,446 C288,470 312,470 326,446 L334,500 C320,520 280,520 266,500 Z" fill="#cfc6b6" opacity=".85"/><path d="M290,486 C296,520 304,520 310,486 L306,540 L300,560 L294,540 Z" fill="#bdb3a2" opacity=".85"/>';
        for (const yy of [640, 700, 760, 820]) s += `<circle cx="262" cy="${yy}" r="5" fill="#2a3038"/><circle cx="338" cy="${yy}" r="5" fill="#2a3038"/>`;
        break;
      }
      case 'vestido': {
        const renda = novoId('renda');
        c.defs.push(`<pattern id="${renda}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.2" fill="#5a4a40"/></pattern>`);
        const gola = 'M300,514 C272,516 238,528 218,552 C212,584 246,602 282,592 C294,588 299,574 300,560 Z';
        s += espelhar(`<path d="${gola}" fill="${c.linear(['#d6c8b0', '#8a7d6a'], { x2: 1, y2: 0.6 })}"/><path d="${gola}" fill="url(#${renda})" opacity=".5"/><path d="M218,552 C212,584 246,602 282,592" stroke="#efe4d0" stroke-width="2" fill="none" stroke-dasharray="2 4" opacity=".6"/>`);
        s += '<circle cx="300" cy="590" r="7" fill="#5a0f1e" stroke="#b08d4a" stroke-width="1.5"/>';
        for (const yy of [640, 690, 740, 790]) s += `<circle cx="300" cy="${yy}" r="3.5" fill="#3a2a2a"/>`;
        break;
      }
      case 'cardigan': {
        s += `<path d="M262,508 C280,530 320,530 338,508 L352,905 H248 Z" fill="${c.linear(['#9a8a6e', '#5a4e3e', '#221c15'], { x2: 1, y2: 0.2 })}"/>`;
        s += espelhar(`<path d="M262,510 C246,580 244,680 252,905 H150 C140,760 150,620 170,560 C200,540 236,524 262,510 Z" fill="${tecido('#4a3420')}"/>`);
        for (const yy of [600, 660, 720, 780]) s += `<circle cx="258" cy="${yy}" r="4" fill="#b08d4a" opacity=".8"/>`;
        break;
      }
      case 'manto': {
        s += `<path d="M150,620 C130,700 120,800 110,905 H490 C480,800 470,700 450,620 C420,600 380,590 300,590 C220,590 180,600 150,620 Z" fill="${tecido('#0b0a0d')}"/>`;
        for (const x of [210, 260, 340, 390]) s += `<path d="M${x},620 C${x - 6},720 ${x + 6},820 ${x - 4},905" stroke="#000" stroke-width="5" opacity=".45" fill="none"/>`;
        s += `<circle cx="300" cy="606" r="18" fill="#c9a24e" opacity=".85"/><circle cx="300" cy="606" r="13" fill="#0b0b0d"/><path d="${heptagrama(300, 606, 10)}" stroke="#c9a24e" stroke-width="1.2" fill="none"/>`;
        break;
      }
      default:
        break;
    }
    return s;
  }

  function mascaraRosto(c, a) {
    const m = a.mascara;
    if (!m) return '';
    const g = m.forma === 'porcelana'
      ? c.linear(['#fbf7f0', m.cor, '#b9b0a2'], { x2: 1, y2: 0.4 })
      : c.linear([clarear(m.cor, m.metal ? 0.45 : 0.18), m.cor, escurecer(m.cor, 0.45)], { x2: 1, y2: 0.4 });
    const olhos = 'M246,338 Q268,325 290,338 Q268,350 246,338 Z M310,338 Q332,325 354,338 Q332,350 310,338 Z';
    let corpo = '';
    switch (m.forma) {
      case 'veneziana':
        corpo = `<path fill-rule="evenodd" d="M188,296 C214,306 246,300 300,322 C354,300 386,306 412,296 C412,330 398,362 362,370 C338,374 318,362 300,354 C282,362 262,374 238,370 C202,362 188,330 188,296 Z ${olhos}" fill="${g}" stroke="${m.borda}" stroke-width="2.4"/>`;
        corpo += `<path d="M206,312 C222,302 236,312 230,322 M394,312 C378,302 364,312 370,322 M290,326 C296,318 304,318 310,326" stroke="${m.borda}" stroke-width="1.6" fill="none" opacity=".8"/>`;
        if (m.joia) corpo += `<circle cx="300" cy="330" r="4.5" fill="${m.joia}"/>`;
        break;
      case 'simples':
        corpo = `<path fill-rule="evenodd" d="M222,326 C232,306 270,306 300,322 C330,306 368,306 378,326 C384,350 366,366 342,364 C322,362 310,352 300,348 C290,352 278,362 258,364 C234,366 216,350 222,326 Z ${olhos}" fill="${g}" stroke="${m.borda}" stroke-width="2"/>`;
        break;
      case 'meia':
        corpo = `<path fill-rule="evenodd" d="M214,300 C232,268 290,262 318,272 L336,302 C362,302 384,314 386,332 C386,352 368,362 346,360 C326,356 316,350 306,352 L298,418 C270,428 236,410 224,380 C214,356 210,326 214,300 Z ${olhos}" fill="${g}" stroke="${m.borda}" stroke-width="2"/>`;
        break;
      case 'porcelana':
        corpo = `<path fill-rule="evenodd" d="M300,236 C344,236 370,266 372,318 C374,366 354,408 326,428 C316,435 308,438 300,438 C292,438 284,435 274,428 C246,408 226,366 228,318 C230,266 256,236 300,236 Z M244,338 Q268,322 292,338 Q268,354 244,338 Z M308,338 Q332,322 356,338 Q332,354 308,338 Z" fill="${g}" stroke="${m.borda}" stroke-width="1.6"/>`;
        corpo += '<path d="M290,404 Q300,408 310,404" stroke="#8a8278" stroke-width="2" fill="none"/>';
        corpo += '<path d="M332,244 L322,270 L330,288 L318,312 M240,380 L256,392 L252,408 M352,396 L340,404" stroke="#4a443e" stroke-width="1.6" fill="none" opacity=".75"/>';
        corpo += '<path d="M322,270 L330,288" stroke="#c9a24e" stroke-width="1.6" opacity=".6"/>';
        break;
      case 'renda': {
        const renda = novoId('renda');
        c.defs.push(`<pattern id="${renda}" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.6" fill="#5a4048"/></pattern>`);
        const d = `M218,324 C230,302 270,304 300,320 C330,304 370,302 382,324 C390,348 372,370 346,368 C324,366 312,356 300,350 C288,356 276,366 254,368 C228,370 210,348 218,324 Z ${olhos}`;
        corpo = `<path fill-rule="evenodd" d="${d}" fill="${g}"/><path fill-rule="evenodd" d="${d}" fill="url(#${renda})"/><path d="M226,360 q6,8 12,0 q6,8 12,0 q6,8 12,0 M326,360 q6,8 12,0 q6,8 12,0 q6,8 12,0" stroke="${m.borda}" stroke-width="1.4" fill="none"/>`;
        break;
      }
      case 'inteira':
        corpo = `<path fill-rule="evenodd" d="M300,232 C346,232 374,264 376,318 C378,368 358,412 328,434 C318,441 308,444 300,444 C292,444 282,441 272,434 C242,412 222,368 224,318 C226,264 254,232 300,232 Z M250,338 Q270,332 290,340 Q270,344 250,338 Z M310,340 Q330,332 350,338 Q330,344 310,340 Z" fill="${c.linear(['#2a2a30', '#0b0b0d', '#000000'], { x2: 1, y2: 0.5 })}" stroke="${m.borda}" stroke-width="1.6"/>`;
        corpo += `<path d="M300,250 V430 M262,312 C280,304 320,304 338,312" stroke="${m.borda}" stroke-width="1.2" fill="none" opacity=".6"/><path d="${heptagrama(300, 278, 11)}" stroke="${m.borda}" stroke-width="1.2" fill="none" opacity=".85"/>`;
        corpo += '<ellipse cx="270" cy="280" rx="22" ry="10" fill="#fff" opacity=".07" transform="rotate(-20 270 280)"/>';
        break;
      default:
        break;
    }
    return `<g class="arte-mascara-rosto">${corpo}</g>`;
  }

  function rostoDetalhes(c, a, pose, temMascara) {
    let s = '';
    const sb = pose.sobr;
    if (!temMascara) {
      s += `<ellipse cx="268" cy="338" rx="23" ry="11" fill="${c.luz('#050304', 0.55)}"/><ellipse cx="332" cy="338" rx="23" ry="11" fill="${c.luz('#050304', 0.6)}"/>`;
      const ye = 316 - (sb < 0 ? -sb * 2.5 : 0);
      const dentro = sb > 0 ? sb * 3 : sb < -1 ? -5 : 0;
      s += `<path d="M246,${r1(ye + 2)} Q266,${r1(ye - 6)} 288,${r1(ye + 1 + dentro)}" stroke="#120b0c" stroke-width="4" fill="none" stroke-linecap="round" opacity=".42"/>`;
      s += `<path d="M312,${r1(ye + 1 + dentro)} Q334,${r1(ye - 6)} 354,${r1(ye + 2)}" stroke="#120b0c" stroke-width="4" fill="none" stroke-linecap="round" opacity=".42"/>`;
    }
    s += '<path d="M306,346 Q313,372 302,386" stroke="#0e0909" stroke-width="2.5" fill="none" opacity=".35"/>';
    const b = pose.boca;
    if (b === 2) s += '<ellipse cx="300" cy="408" rx="6" ry="8" fill="#140a0b" opacity=".45"/>';
    else s += `<path d="M${b > 0 ? 280 : 283},${r1(406 - b * 3)} Q300,${r1(408 + b * 6)} ${b > 0 ? 320 : 317},${r1(406 - b * 3)}" stroke="#2a1416" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/>`;
    s += `<ellipse cx="256" cy="366" rx="24" ry="34" fill="${c.luz(misturar('#c98d70', a.acento, 0.25), 0.22 * pose.calor)}"/>`;
    if (pose === POSES.triste && !temMascara) s += '<path d="M260,352 q-2,10 0,16" stroke="#dfe8f0" stroke-width="2" fill="none" opacity=".45"/>';
    return s;
  }

  function personagemSVG(id, expressao, opcoes) {
    const a = APARENCIAS[id] ?? APARENCIAS.generico;
    const pose = POSES[expressao] ?? POSES.neutro;
    const c = novoContexto('p' + id, opcoes, 8);
    const comMascara = !!(opcoes.mascara || a.sempreMascara);
    const cab = cabeloPaths(a);
    const head = `rotate(${pose.rot} 300 470) translate(0 ${pose.dy}) translate(300 340) scale(${a.feminino ? 1.08 : 1.1}) translate(-300 -340)`;
    const sil = novoId('sil');
    const torso = torsoPath(a);
    const corpoSil = `<path d="${torso}"/>${a.roupa === 'manto' ? '<path d="M150,620 C130,700 120,800 110,905 H490 C480,800 470,700 450,620 C420,600 380,590 300,590 C220,590 180,600 150,620 Z"/>' : ''}<path d="${pescocoPath(a)}"/><g transform="${head}"><path d="${cab.tras}"/><path d="${cabecaPath(a)}"/>${cab.frente ? `<path d="${cab.frente}"/>` : ''}</g>`;
    c.defs.push(`<g id="${sil}">${corpoSil}</g>`);
    const borda = novoId('borda');
    const bordaFria = novoId('fria');
    const cheio = novoId('cheio');
    c.defs.push(`<mask id="${borda}" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="900"><use href="#${sil}" fill="#fff"/><use href="#${sil}" fill="#000" transform="translate(9 5)"/></mask>`);
    c.defs.push(`<mask id="${bordaFria}" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="900"><use href="#${sil}" fill="#fff"/><use href="#${sil}" fill="#000" transform="translate(-6 3)"/></mask>`);
    c.defs.push(`<mask id="${cheio}" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="900"><use href="#${sil}" fill="#fff"/></mask>`);

    const acento = pose.calor >= 1 ? misturar(a.acento, '#ffcf8a', (pose.calor - 1) * 0.6) : misturar(a.acento, a.frio, (1 - pose.calor) * 0.8);
    const pele = c.linear([misturar('#8a6454', a.acento, 0.14), '#4a3430', '#1c1413', '#0b0707'], { x1: 0.05, y1: 0.1, x2: 0.95, y2: 0.35, paradas: [0, 0.32, 0.66, 1] });
    const corCabelo = a.corCabelo ?? '#120e0e';
    const cabelo = c.linear([clarear(corCabelo, 0.12), corCabelo, escurecer(corCabelo, 0.5)], { x2: 1, y2: 0.3 });
    const roupaBase = { terno: '#0f0d12', blazer: '#1c1117', colete: '#4e4a42', jaqueta: '#141317', sobretudo: '#11151b', vestido: '#1a0d12', cardigan: '#2a1f16', manto: '#0b0a0d' }[a.roupa] ?? '#121014';
    const tronco = c.linear([clarear(roupaBase, 0.1), roupaBase, escurecer(roupaBase, 0.55)], { x2: 1, y2: 0.25 });

    let s = '';
    // cabelo de trás (fica atrás de tudo)
    s += `<g transform="${head}"><path d="${cab.tras}" fill="${cab.capuz ? tronco : cabelo}"/></g>`;
    s += `<path d="${torso}" fill="${tronco}"/>`;
    s += `<path d="${pescocoPath(a)}" fill="${pele}"/>`;
    s += `<path d="${pescocoPath(a)}" fill="${c.linear([['#000', 0.7], ['#000', 0]])}"/>`;
    s += roupaDetalhes(c, a);
    // cabeça
    s += `<g transform="${head}">`;
    if (cab.capuz) {
      s += `<path d="${cabecaPath(a)}" fill="#050405"/>`;
    } else {
      if (!a.feminino) s += `<ellipse cx="221" cy="340" rx="9" ry="20" fill="#2a1c19"/><ellipse cx="379" cy="340" rx="9" ry="20" fill="#110b0b"/>`;
      s += `<path d="${cabecaPath(a)}" fill="${pele}"/>`;
      s += rostoDetalhes(c, a, pose, comMascara);
    }
    if (cab.frente) s += `<path d="${cab.frente}" fill="${cabelo}"/>`;
    s += `<g stroke="${acento}" stroke-width="1.7" fill="none" opacity=".3" stroke-linecap="round">${cab.mechas.map((d) => `<path d="${d}"/>`).join('')}</g>`;
    if (a.fita) s += `<g transform="translate(362 246) rotate(18)"><path d="M0,0 C-22,-18 -30,4 -6,6 Z M0,0 C22,-18 30,4 6,6 Z" fill="#080506"/><circle cx="0" cy="2" r="5" fill="#140a0c"/><path d="M-2,6 L-10,40 M2,6 L12,38" stroke="#080506" stroke-width="5"/></g>`;
    if (a.oculos && !comMascara) s += `<g fill="none" stroke="#d6cdb8" stroke-width="2.6" opacity=".75"><circle cx="268" cy="338" r="23"/><circle cx="332" cy="338" r="23"/><path d="M291,334 Q300,328 309,334 M245,334 L224,328 M355,334 L376,328"/></g><path class="arte-reflexo-oculos" d="M254,326 q8,-8 18,-6" stroke="#fff" stroke-width="2.4" fill="none" opacity=".55"/>`;
    if (a.brinco) s += '<circle cx="380" cy="366" r="3.5" fill="#cfd6df"/><circle cx="381" cy="365" r="1.2" fill="#fff"/>';
    if (a.argolas) s += '<circle cx="226" cy="392" r="13" fill="none" stroke="#c9952e" stroke-width="3"/><circle cx="374" cy="392" r="13" fill="none" stroke="#7d5c1c" stroke-width="3"/>';
    if (comMascara) s += mascaraRosto(c, a);
    s += '</g>';
    // luz de contorno (quente à esquerda, fria à direita) e escurecimento da base
    const forca = Math.min(1, 0.85 * pose.brilho);
    s += `<rect width="600" height="900" mask="url(#${borda})" fill="${c.linear([[acento, forca], [acento, forca * 0.45], [acento, 0.05]], { x2: 1, y2: 0, paradas: [0, 0.45, 1] })}"/>`;
    s += `<rect width="600" height="900" mask="url(#${borda})" fill="${acento}" opacity="${r1(0.35 * pose.brilho * 100) / 100}" filter="${c.filtro('brilho', '<feGaussianBlur stdDeviation="5"/>')}"/>`;
    s += `<rect width="600" height="900" mask="url(#${bordaFria})" fill="${c.linear([[a.frio, 0], [a.frio, 0.1], [a.frio, 0.55]], { x2: 1, y2: 0, paradas: [0, 0.5, 1] })}"/>`;
    s += `<rect width="600" height="900" mask="url(#${cheio})" fill="${c.linear([['#000', 0], ['#000', 0], ['#000', 0.82]], { paradas: [0, 0.62, 1] })}"/>`;

    let figura = `<g class="arte-respira">${s}</g>`;
    if (a.fantasma) {
      const desvanece = novoId('fant');
      c.defs.push(`<radialGradient id="${desvanece}g" cx="0.5" cy="0.42" r="0.62"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="${desvanece}" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="900"><rect width="600" height="900" fill="url(#${desvanece}g)"/></mask>`);
      let particulas = '';
      const rnd = aleatorio('fantasma');
      for (let i = 0; i < 14; i++) particulas += `<circle class="arte-particula" style="animation-delay:-${r1(rnd() * 6)}s;--dx:${r1((rnd() - 0.5) * 60)}px" cx="${r1(170 + rnd() * 260)}" cy="${r1(300 + rnd() * 450)}" r="${r1(1 + rnd() * 2.2)}" fill="${a.acento}" opacity=".6"/>`;
      figura = `<g class="arte-fantasma"><g mask="url(#${desvanece})">${figura}</g>${particulas}</g>`;
    }
    return `<svg xmlns="${NS_SVG}" viewBox="0 0 600 900" preserveAspectRatio="xMidYMax meet" width="100%" height="100%" aria-hidden="true" focusable="false"><defs>${c.defs.join('')}</defs>${figura}</svg>`;
  }

  /* =========================================================================
     ILUSTRAÇÕES DE DOCUMENTOS (fotografias antigas)
     ========================================================================= */
  function fotoMoldura(c, l, a, conteudo, { borda = 18, tom = '#c9a87a' } = {}) {
    const grao = c.filtro('grao', '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.55 0"/><feComposite in2="SourceGraphic" operator="in"/>');
    const clip = novoId('foto');
    c.defs.push(`<clipPath id="${clip}"><rect x="${borda}" y="${borda}" width="${l - borda * 2}" height="${a - borda * 2}"/></clipPath>`);
    let s = `<rect width="${l}" height="${a}" fill="${c.linear(['#efe5cf', '#d9caa9'], { x2: 1, y2: 1 })}"/>`;
    s += `<g clip-path="url(#${clip})">${conteudo}`;
    s += `<rect x="${borda}" y="${borda}" width="${l - borda * 2}" height="${a - borda * 2}" fill="${tom}" opacity=".18" style="mix-blend-mode:multiply"/>`;
    s += `<rect x="${borda}" y="${borda}" width="${l - borda * 2}" height="${a - borda * 2}" fill="#fff" filter="${grao}" opacity=".9"/>`;
    s += `<rect x="${borda}" y="${borda}" width="${l - borda * 2}" height="${a - borda * 2}" fill="${c.radial([['#000', 0], ['#2a1a0c', 0.55]], { r: 0.75 })}"/>`;
    const rnd = aleatorio('riscos' + l);
    for (let i = 0; i < 7; i++) {
      const x = borda + rnd() * (l - borda * 2);
      s += `<path d="M${r1(x)},${borda} q${r1((rnd() - 0.5) * 20)},${r1(a * 0.4)} ${r1((rnd() - 0.5) * 30)},${r1(a - borda * 2)}" stroke="#f6eedd" stroke-width=".8" opacity="${r1((0.15 + rnd() * 0.25) * 100) / 100}" fill="none"/>`;
    }
    s += '</g>';
    s += `<path d="M${l - 70},${a} L${l},${a - 60} V${a} Z" fill="#cdbb95" opacity=".9"/><path d="M${l - 70},${a} L${l},${a - 60}" stroke="#a8956d" stroke-width="1"/>`;
    return s;
  }

  function figuraFoto(x, base, h, { cabelo = 'curto', feminino = false, mascara = '#e7dcc6', fita = false, tom = '#3a2a1c' } = {}) {
    const e = h / 300;
    const ombro = feminino ? 46 : 54;
    let s = `<g transform="translate(${r1(x)},${r1(base)}) scale(${r1(e * 100) / 100})">`;
    s += `<path d="M${-ombro},-150 C${-ombro - 10},-110 ${-ombro - 12},-50 ${-ombro + 4},0 H${ombro - 4} C${ombro + 12},-50 ${ombro + 10},-110 ${ombro},-150 C${ombro - 10},-166 22,-174 0,-174 C-22,-174 ${-ombro + 10},-166 ${-ombro},-150 Z" fill="${tom}"/>`;
    s += `<rect x="-9" y="-196" width="18" height="26" fill="${tom}"/>`;
    s += `<ellipse cx="0" cy="-222" rx="${feminino ? 22 : 24}" ry="${feminino ? 29 : 31}" fill="${tom}"/>`;
    if (cabelo === 'longo') s += `<path d="M-24,-228 C-26,-262 26,-262 24,-228 C30,-190 30,-150 26,-120 L-26,-120 C-30,-150 -30,-190 -24,-228 Z" fill="${tom}"/>`;
    else s += `<path d="M-25,-224 C-28,-258 28,-258 25,-224 C20,-240 -20,-240 -25,-224 Z" fill="${tom}"/>`;
    s += `<path fill-rule="evenodd" d="M-26,-228 C-16,-238 -6,-234 0,-228 C6,-234 16,-238 26,-228 C28,-214 18,-206 8,-210 C4,-212 2,-216 0,-216 C-2,-216 -4,-212 -8,-210 C-18,-206 -28,-214 -26,-228 Z M-18,-224 Q-11,-229 -5,-223 Q-11,-219 -18,-224 Z M18,-224 Q11,-229 5,-223 Q11,-219 18,-224 Z" fill="${mascara}"/>`;
    if (fita) s += `<path d="M${-ombro - 4},-70 C${-ombro - 2},-60 ${-ombro + 6},-58 ${-ombro + 8},-66" stroke="#c4102a" stroke-width="5" fill="none"/><path d="M${-ombro + 2},-62 l-6,22 M${-ombro + 6},-62 l4,20" stroke="#c4102a" stroke-width="2.5"/>`;
    return s + '</g>';
  }

  function ilustracao(nome) {
    const c = novoContexto('ilu' + nome, {}, 0);
    let l = 640;
    let a = 440;
    let conteudo = '';
    switch (nome) {
      case 'foto-sete-mascaras': {
        conteudo += `<rect width="${l}" height="${a}" fill="${c.linear(['#8a7458', '#5e4a34', '#3a2c1e'])}"/>`;
        conteudo += `<rect x="150" y="40" width="340" height="230" fill="#6e5a42"/>`;
        conteudo += `<path d="${arcoGotico(270, 70, 100, 200)}" fill="#2a1e14"/>`;
        conteudo += `<path d="${arcoGotico(186, 90, 46, 90)}" fill="#3a2c1e"/><path d="${arcoGotico(408, 90, 46, 90)}" fill="#3a2c1e"/>`;
        conteudo += `<rect x="130" y="34" width="380" height="10" fill="#4a3a28"/>`;
        conteudo += `<rect x="0" y="30" width="150" height="250" fill="#4a3c2c"/><rect x="490" y="30" width="150" height="250" fill="#4a3c2c"/>`;
        for (let i = 0; i < 6; i++) conteudo += `<rect x="${60 - i * 4}" y="${270 + i * 28}" width="${520 + i * 8}" height="28" fill="${i % 2 ? '#8a765a' : '#7a684e'}"/><rect x="${60 - i * 4}" y="${270 + i * 28}" width="${520 + i * 8}" height="4" fill="#a8946f" opacity=".7"/>`;
        const fundo = [[230, 300, 230, {}], [320, 300, 240, {}], [410, 300, 232, { feminino: true, cabelo: 'longo' }], [500, 300, 228, {}]];
        const frente = [[150, 368, 260, { feminino: true, cabelo: 'longo', fita: true }], [300, 372, 262, {}], [450, 370, 262, { cabelo: 'curto' }]];
        for (const [x, b, h, o] of fundo) conteudo += figuraFoto(x, b, h, { tom: '#3e3020', ...o });
        for (const [x, b, h, o] of frente) conteudo += figuraFoto(x, b, h, { tom: '#22180f', ...o });
        conteudo += `<text x="${l - 52}" y="${a - 30}" font-family="'Cormorant Garamond', Georgia, serif" font-style="italic" font-size="22" fill="#2a1e12" opacity=".55">VII</text>`;
        break;
      }
      case 'retrato-anne': {
        l = 400;
        a = 520;
        conteudo += `<rect width="${l}" height="${a}" fill="${c.radial(['#a88e6c', '#6a5640', '#3a2c20'], { cy: 0.35, r: 0.8 })}"/>`;
        conteudo += '<g transform="translate(-100,10) scale(1)">';
        conteudo += '<path d="M212,760 C206,640 212,520 216,420 C216,330 226,262 254,234 C276,214 324,214 346,234 C374,262 384,330 384,420 C388,520 394,640 388,760 Z" fill="#1e1610"/>';
        conteudo += '<path d="M270,500 C246,516 196,526 158,546 C126,562 112,592 108,632 L98,905 L502,905 L492,632 C488,592 474,562 442,546 C404,526 354,516 330,500 Z" fill="#2a1e16"/>';
        conteudo += '<path d="M274,410 C276,450 272,482 266,512 L334,512 C328,482 324,450 326,410 Z" fill="#8a6e52"/>';
        conteudo += '<path d="M300,508 C276,520 238,534 214,560 C220,600 262,610 296,586 C298,560 300,540 300,508 Z M300,508 C324,520 362,534 386,560 C380,600 338,610 304,586 C302,560 300,540 300,508 Z" fill="#cdb894"/>';
        conteudo += `<path d="M300,232 C342,232 372,262 373,318 C374,366 354,404 326,426 C316,434 308,437 300,437 C292,437 284,434 274,426 C246,404 226,366 227,318 C228,262 258,232 300,232 Z" fill="${c.linear(['#b0927a', '#8a6e56', '#5a4636'], { x2: 1, y2: 0.2 })}"/>`;
        conteudo += '<ellipse cx="268" cy="336" rx="15" ry="6" fill="#3a2a1e" opacity=".75"/><ellipse cx="332" cy="336" rx="15" ry="6" fill="#3a2a1e" opacity=".75"/>';
        conteudo += '<path d="M252,318 Q268,312 284,318 M316,318 Q332,312 348,318" stroke="#3a2a1e" stroke-width="3" fill="none" opacity=".6"/>';
        conteudo += '<path d="M302,350 Q307,370 298,380" stroke="#5a4636" stroke-width="2" fill="none" opacity=".6"/><path d="M286,402 Q300,408 314,402" stroke="#5a3a30" stroke-width="3" fill="none" opacity=".7"/>';
        conteudo += '<path d="M228,560 C226,480 226,400 230,330 C232,276 258,240 298,236 C276,256 262,300 258,352 C254,420 256,500 262,580 Z M372,560 C374,480 374,400 370,330 C368,276 342,240 302,236 C324,256 338,300 342,352 C346,420 344,500 338,580 Z" fill="#1e1610"/>';
        conteudo += '<g transform="translate(362 246) rotate(18)"><path d="M0,0 C-22,-18 -30,4 -6,6 Z M0,0 C22,-18 30,4 6,6 Z" fill="#0a0806"/><circle cx="0" cy="2" r="5" fill="#140e0a"/><path d="M-2,6 L-10,40 M2,6 L12,38" stroke="#0a0806" stroke-width="5"/></g>';
        conteudo += '</g>';
        break;
      }
      case 'casa-vesper-antiga': {
        conteudo += `<rect width="${l}" height="${a}" fill="${c.linear(['#c9b79a', '#b3a084', '#8a7658'])}"/>`;
        conteudo += `<path d="M0,300 C120,280 220,292 320,284 C430,276 520,290 640,282 V440 H0 Z" fill="#6e5e46"/>`;
        conteudo += `<g transform="scale(0.4)">${P.floresta(c, { base: 760, alturaMin: 140, alturaMax: 260, cor: '#5a4a36', semente: 'foto-floresta', de: 0, ate: 1600, chao: false })}</g>`;
        conteudo += `<g transform="translate(-20,10) scale(0.42)">${P.mansao(c, { x: 800, base: 720, escala: 1, cor: '#6a5640', telhado: '#3e3022', detalhe: '#54432f', janela: '#2e2418', acesas: 0, piscar: false, brilho: 0 })}</g>`;
        conteudo += `<rect x="0" y="330" width="${l}" height="110" fill="${c.linear(['#8e7c60', '#5a4a36'])}"/>`;
        conteudo += '<path d="M0,336 H640" stroke="#c9b79a" stroke-width="2" opacity=".5"/>';
        break;
      }
      default:
        return '';
    }
    const moldura = fotoMoldura(c, l, a, conteudo);
    return `<svg xmlns="${NS_SVG}" viewBox="0 0 ${l} ${a}" aria-hidden="true" focusable="false"><defs>${c.defs.join('')}</defs>${moldura}</svg>`;
  }

  /* =========================================================================
     CLIMA (camadas animadas em HTML por cima do SVG: neblina, brasas, poeira, cinzas)
     ========================================================================= */
  function climaHTML(lista, semente) {
    const rnd = aleatorio('clima' + semente);
    let h = '';
    for (const cl of lista) {
      switch (cl.tipo) {
        case 'neblina': {
          const cor = cl.cor ?? '205,212,224';
          const camadas = cl.camadas ?? 2;
          for (let i = 0; i < camadas; i++) {
            const op = (cl.opacidade ?? 0.35) * (1 - i * 0.25);
            h += `<div class="arte-neblina" style="top:${cl.y ?? 55}%;height:${cl.altura ?? 40}%;--cor:${cor};--op:${r1(op * 100) / 100};animation-duration:${(cl.velocidade ?? 90) * (1 + i * 0.6)}s;animation-delay:-${r1(rnd() * 40)}s;transform-origin:center"></div>`;
          }
          break;
        }
        case 'brasas':
        case 'cinzas':
        case 'poeira': {
          const q = Math.min(cl.quantidade ?? 24, 40);
          for (let i = 0; i < q; i++) {
            const x = (cl.de ?? 0) + rnd() * ((cl.ate ?? 100) - (cl.de ?? 0));
            const tam = r1((cl.tamanho ?? (cl.tipo === 'poeira' ? 2 : 3)) * (0.5 + rnd()));
            const dur = r1((cl.duracao ?? (cl.tipo === 'poeira' ? 14 : 9)) * (0.6 + rnd() * 0.8));
            const y = cl.tipo === 'poeira' ? `top:${r1((cl.y ?? 10) + rnd() * (cl.altura ?? 70))}%;` : '';
            h += `<span class="arte-${cl.tipo}" style="left:${r1(x)}%;${y}--s:${tam}px;--dx:${r1((rnd() - 0.5) * 80)}px;animation-duration:${dur}s;animation-delay:-${r1(rnd() * dur)}s"></span>`;
          }
          break;
        }
        case 'luz-velas':
          h += `<div class="arte-luz-velas" style="--x:${cl.x ?? 50}%;--y:${cl.y ?? 50}%;--cor:${cl.cor ?? '255,170,90'};--op:${cl.opacidade ?? 0.18}"></div>`;
          break;
        case 'vinheta':
          h += `<div class="arte-vinheta-html" style="--op:${cl.forca ?? 0.7}"></div>`;
          break;
        default:
          break;
      }
    }
    return h ? `<div class="arte-clima" aria-hidden="true">${h}</div>` : '';
  }

  /* ---------- seleção de camadas por variante ---------- */
  function ativa(item, opcoes) {
    const lista = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
    if (lista(item.quando).some((f) => !opcoes[f])) return false;
    if (lista(item.exceto).some((f) => opcoes[f])) return false;
    return true;
  }

  function aplicarVariantes(item, opcoes) {
    if (!item.variantes) return item;
    let r = { ...item };
    for (const [flag, mudancas] of Object.entries(item.variantes)) if (opcoes[flag]) r = { ...r, ...mudancas };
    return r;
  }

  /* =========================================================================
     API PÚBLICA
     ========================================================================= */
  function cenario(id, opcoes = {}) {
    const el = document.createElement('div');
    el.className = `arte-cenario arte-cena-${id}`;
    el.setAttribute('aria-hidden', 'true');
    const receitas = window.CENARIOS || {};
    const receita = receitas[id];
    if (!receita || id === 'preto') {
      el.style.background = '#000';
      return el;
    }
    const flags = { ...opcoes };
    const clima = (receita.clima ?? []).filter((cl) => ativa(cl, flags));
    if (typeof receita.imagem === 'string' && receita.imagem) {
      el.classList.add('arte-com-imagem');
      el.style.backgroundImage = `url("${receita.imagem}")`;
      el.innerHTML = climaHTML(clima, id);
      return el;
    }
    const c = novoContexto(id, flags, receita.limiteAnimacoes ?? 46);
    let corpo = '';
    for (const bruta of receita.camadas ?? []) {
      if (!ativa(bruta, flags)) continue;
      const camada = aplicarVariantes(bruta, flags);
      const pincel = P[camada.tipo];
      if (!pincel) {
        console.warn('Arte: pincel desconhecido', camada.tipo, 'no cenário', id);
        continue;
      }
      try {
        corpo += pincel(c, camada);
      } catch (erro) {
        console.error('Arte: erro ao desenhar', camada.tipo, 'no cenário', id, erro);
      }
    }
    el.innerHTML = `<svg class="arte-svg" xmlns="${NS_SVG}" viewBox="0 0 1600 900" preserveAspectRatio="${receita.alinhar ?? 'xMidYMid'} slice" aria-hidden="true" focusable="false"><defs>${c.defs.join('')}</defs>${corpo}</svg>${climaHTML(clima, id)}`;
    return el;
  }

  function personagem(id, expressao = 'neutro', opcoes = {}) {
    const el = document.createElement('div');
    el.className = `arte-personagem arte-p-${id}`;
    el.setAttribute('aria-hidden', 'true');
    const imagens = window.PERSONAGENS?.[id]?.imagens;
    const url = imagens?.[expressao] || imagens?.neutro;
    if (typeof url === 'string' && url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.className = 'arte-personagem-img';
      el.append(img);
      return el;
    }
    if ((APARENCIAS[id] ?? APARENCIAS.generico).desbotada) el.classList.add('arte-desbotada');
    el.innerHTML = personagemSVG(id, expressao, opcoes);
    return el;
  }

  window.Arte = {
    cenario,
    personagem,
    ornamento,
    ilustracao,
    get cenarios() { return Object.keys(window.CENARIOS || {}); },
    personagens: Object.keys(APARENCIAS).filter((k) => k !== 'generico'),
    expressoes: Object.keys(POSES),
  };
})();
