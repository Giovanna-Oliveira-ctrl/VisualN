/* Sete Velas — pintor.js
 * Arte provisória pintada por código: cenários num espaço virtual de 1600x900
 * e personagens num espaço de 600x900. Tudo é determinístico (sementes fixas);
 * as camadas estáticas são pintadas uma vez e guardadas no cache, e a cada
 * quadro só se animam detalhes (chamas, névoa, vaga-lumes, pêndulo, fumaça). */
(function () {
  'use strict';

  const W = 1600, H = 900, CW = 600, CH = 900, TAU = Math.PI * 2;

  // ---------------------------------------------------------------- utilidades
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }
  // resolução das camadas em cache, conforme a escala real do contexto
  function resOf(ctx) {
    let s = 1;
    try { const m = ctx.getTransform(); s = Math.hypot(m.a, m.b); } catch (e) { /* sem getTransform */ }
    return clamp(Math.round(s * 4) / 4, 0.5, 1.25);
  }
  // ruído suave 0..1 para tremulação
  function fl(x) {
    return 0.5 + 0.22 * Math.sin(x) + 0.16 * Math.sin(x * 2.31 + 1.7) + 0.12 * Math.sin(x * 5.13 + 0.3);
  }
  function bz(p0, p1, p2, p3, u) {
    const v = 1 - u;
    return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3;
  }

  // ---------------------------------------------------------------- primitivas
  function vg(g, x, y0, w, y1, stops) {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    for (const s of stops) gr.addColorStop(s[0], s[1]);
    g.fillStyle = gr;
    g.fillRect(x, y0, w, y1 - y0);
  }
  function lin(g, x0, y0, x1, y1, stops) {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    for (const s of stops) gr.addColorStop(s[0], s[1]);
    return gr;
  }
  // poça de luz (radial), opcionalmente achatada na vertical
  function light(g, x, y, r, rgb, a, mode, sy) {
    g.save();
    g.globalCompositeOperation = mode || 'screen';
    g.translate(x, y);
    if (sy) g.scale(1, sy);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`);
    gr.addColorStop(0.22, `rgba(${rgb},${a * 0.6})`);
    gr.addColorStop(0.5, `rgba(${rgb},${a * 0.22})`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(-r, -r, 2 * r, 2 * r);
    g.restore();
  }
  function soft(g, x, y, r, rgba0, sy, rot) {
    g.save();
    g.translate(x, y);
    if (rot) g.rotate(rot);
    if (sy) g.scale(1, sy);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    gr.addColorStop(0, rgba0);
    gr.addColorStop(1, rgba0.replace(/[\d.]+\)$/, '0)'));
    g.fillStyle = gr;
    g.fillRect(-r, -r, 2 * r, 2 * r);
    g.restore();
  }
  function shade(g, color, a, mode) {
    g.save();
    g.globalCompositeOperation = mode || 'multiply';
    g.globalAlpha = a;
    g.fillStyle = color;
    g.fillRect(-10, -10, W + 20, H + 20);
    g.restore();
  }
  function haze(g, y0, y1, rgb, a0, a1) {
    vg(g, 0, y0, W, y1, [[0, `rgba(${rgb},${a0})`], [1, `rgba(${rgb},${a1})`]]);
  }
  function band(g, yc, h, rgb, a) {
    vg(g, 0, yc - h / 2, W, yc + h / 2, [[0, `rgba(${rgb},0)`], [0.5, `rgba(${rgb},${a})`], [1, `rgba(${rgb},0)`]]);
  }
  function poly(g, pts) {
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath();
  }
  function fillPoly(g, pts, fill) { poly(g, pts); g.fillStyle = fill; g.fill(); }
  function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); }
  function arch(g, x, y, w, h) {
    g.beginPath();
    g.moveTo(x, y + h);
    g.lineTo(x, y + w / 2);
    g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
    g.lineTo(x + w, y + h);
    g.closePath();
  }
  function rrect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function line(g, x0, y0, x1, y1) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }

  // desfoque portátil (reduz e amplia); funciona inclusive onde ctx.filter não existe
  function softBlur(c, f) {
    const w = Math.max(1, Math.round(c.width / f)), h = Math.max(1, Math.round(c.height / f));
    const s = mk(w, h), sg = s.getContext('2d');
    sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = 'high';
    sg.drawImage(c, 0, 0, w, h);
    const o = mk(c.width, c.height), og = o.getContext('2d');
    og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
    og.drawImage(s, 0, 0, c.width, c.height);
    return o;
  }

  // passada de pinceladas: amostra a cor da própria imagem e pinta traços curtos
  function brushPass(c, rnd, o) {
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    const img = g.getImageData(0, 0, w, h).data;
    const r = o.r || 1;
    const n = Math.round((o.n || 10000) * (w * h) / (1600 * 900 * r * r) * r * r * (o.area || 1));
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.lineCap = 'round';
    if (o.atop) g.globalCompositeOperation = 'source-atop';
    const smear = (o.smear || 6) * r;
    const L0 = o.len[0] * r, L1 = o.len[1] * r, W0 = o.width[0] * r, W1 = o.width[1] * r;
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h;
      const sx = clamp((x + (rnd() - 0.5) * smear) | 0, 0, w - 1);
      const sy = clamp((y + (rnd() - 0.5) * smear) | 0, 0, h - 1);
      const k = (sy * w + sx) * 4;
      const a = img[k + 3];
      if (a < 24) continue;
      const ang = (o.ang || 0) + (rnd() - 0.5) * (o.spread || 0.6);
      const L = L0 + rnd() * (L1 - L0);
      const dx = Math.cos(ang) * L * 0.5, dy = Math.sin(ang) * L * 0.5;
      const v = 1 + (rnd() - 0.5) * (o.vary || 0.14);
      g.strokeStyle = 'rgba(' + clamp(img[k] * v, 0, 255) + ',' + clamp(img[k + 1] * v, 0, 255) + ',' +
        clamp(img[k + 2] * v, 0, 255) + ',' + (o.alpha * a / 255).toFixed(3) + ')';
      g.lineWidth = W0 + rnd() * (W1 - W0);
      g.beginPath();
      g.moveTo(x - dx, y - dy);
      g.lineTo(x + dx, y + dy);
      g.stroke();
    }
    g.restore();
  }

  // ---------------------------------------------------------------- brilhos e névoa (animação)
  const sprites = {};
  function glowSprite(rgb) {
    let s = sprites[rgb];
    if (s) return s;
    s = mk(128, 128);
    const g = s.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.12, `rgba(${rgb},0.7)`);
    gr.addColorStop(0.3, `rgba(${rgb},0.3)`);
    gr.addColorStop(0.6, `rgba(${rgb},0.08)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    sprites[rgb] = s;
    return s;
  }
  function glow(ctx, x, y, rad, rgb, alpha, mode) {
    if (alpha <= 0.004 || rad <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = mode || 'lighter';
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(glowSprite(rgb), x - rad, y - rad, rad * 2, rad * 2);
    ctx.restore();
  }
  const fogCache = {};
  // textura de névoa repetível na horizontal (meia resolução, desenhada esticada)
  function fogTex(seed, h, n, rgb, rMin, rMax) {
    const key = seed + '|' + h + '|' + rgb;
    if (fogCache[key]) return fogCache[key];
    const rnd = mulberry32(seed);
    const c = mk(W / 2, h / 2), g = c.getContext('2d');
    g.scale(0.5, 0.5);
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, y = h * 0.25 + rnd() * h * 0.5;
      const rr = rMin + rnd() * (rMax - rMin), a = 0.05 + rnd() * 0.13, sq = 0.28 + rnd() * 0.22;
      for (const ox of [-W, 0, W]) {
        g.save();
        g.translate(x + ox, y);
        g.scale(1, sq);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, rr);
        gr.addColorStop(0, `rgba(${rgb},${a})`);
        gr.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gr;
        g.fillRect(-rr, -rr, rr * 2, rr * 2);
        g.restore();
      }
    }
    fogCache[key] = c;
    return c;
  }
  function drawFog(ctx, tex, y, h, t, speed, alpha) {
    const off = (((t * speed) % W) + W) % W;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(tex, -off, y, W, h);
    ctx.drawImage(tex, W - off, y, W, h);
    ctx.restore();
  }

  // chama de vela (animada)
  function flame(ctx, x, y, h, t, seed, lean, power) {
    const p = power == null ? 1 : power;
    const f = 0.8 + 0.2 * fl(t * 9 + seed * 7.1);
    const sway = (fl(t * 4.3 + seed * 3.3) - 0.5) * h * 0.35 + (lean || 0) * h;
    const hh = h * f;
    glow(ctx, x, y - hh * 0.45, h * 6.5 * (0.88 + 0.12 * f) * p, '255,150,70', 0.2 * p);
    glow(ctx, x, y - hh * 0.4, h * 2.2, '255,200,120', 0.35 * p);
    const gr = ctx.createRadialGradient(x + sway * 0.3, y - hh * 0.32, 0, x + sway * 0.3, y - hh * 0.32, hh * 0.85);
    gr.addColorStop(0, 'rgba(255,252,232,1)');
    gr.addColorStop(0.3, 'rgba(255,214,130,0.98)');
    gr.addColorStop(0.7, 'rgba(255,130,45,0.7)');
    gr.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = gr;
    const bw = h * 0.17;
    ctx.beginPath();
    ctx.moveTo(x - bw, y);
    ctx.quadraticCurveTo(x - bw * 1.3, y - hh * 0.45, x + sway, y - hh);
    ctx.quadraticCurveTo(x + bw * 1.3, y - hh * 0.45, x + bw, y);
    ctx.quadraticCurveTo(x, y + h * 0.14, x - bw, y);
    ctx.fill();
    ctx.fillStyle = 'rgba(90,120,255,0.35)';
    ell(ctx, x, y - h * 0.04, bw * 0.55, h * 0.07);
    ctx.fill();
  }
  // fio de fumaça de vela apagada
  function smokeCurl(ctx, x, y, t, seed, len) {
    const L = len || 90;
    const gr = ctx.createLinearGradient(0, y, 0, y - L);
    gr.addColorStop(0, 'rgba(190,190,200,0.32)');
    gr.addColorStop(1, 'rgba(190,190,200,0)');
    ctx.save();
    ctx.strokeStyle = gr;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const u = i / 18;
      const xx = x + Math.sin(u * 7 + t * 1.6 + seed) * 7 * u + Math.sin(u * 3 - t * 0.7 + seed * 2) * 5 * u * u;
      const yy = y - u * L;
      if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
    }
    ctx.stroke();
    ctx.restore();
  }
  // vela estática (corpo, pavio, escorridos)
  function candleBody(g, x, yb, h, w, seed) {
    const rnd = mulberry32(seed);
    g.save();
    g.fillStyle = lin(g, x - w / 2, 0, x + w / 2, 0, [[0, '#efe3c6'], [0.45, '#d9c9a5'], [1, '#8c7c62']]);
    g.beginPath();
    g.moveTo(x - w / 2, yb);
    g.lineTo(x - w / 2, yb - h + 3);
    g.quadraticCurveTo(x, yb - h - 3, x + w / 2, yb - h + 3);
    g.lineTo(x + w / 2, yb);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(245,236,214,0.9)';
    for (let i = 0; i < 3; i++) {
      const dx = x - w / 2 + rnd() * w, dl = 6 + rnd() * h * 0.5;
      rrect(g, dx - 1.6, yb - h + 2, 3.2, dl, 1.6);
      g.fill();
    }
    g.strokeStyle = '#1c1410';
    g.lineWidth = 1.4;
    line(g, x, yb - h, x + 0.5, yb - h - 6);
    g.restore();
  }

  // ---------------------------------------------------------------- elementos de cenário
  function ridge(g, rnd, y, amp, color, f) {
    f = f || 1;
    const p = [rnd() * 10, rnd() * 10, rnd() * 10, rnd() * 10];
    const ys = [];
    g.beginPath();
    g.moveTo(-10, H + 10);
    for (let x = -10; x <= W + 10; x += 6) {
      const yy = y - amp * (0.45 * Math.sin(x * 0.0035 * f + p[0]) + 0.3 * Math.sin(x * 0.009 * f + p[1]) +
        0.17 * Math.sin(x * 0.023 * f + p[2]) + 0.08 * Math.sin(x * 0.061 * f + p[3]));
      ys.push(yy);
      g.lineTo(x, yy);
    }
    g.lineTo(W + 10, H + 10);
    g.closePath();
    g.fillStyle = color;
    g.fill();
    return (x) => ys[clamp(Math.round((x + 10) / 6), 0, ys.length - 1)];
  }
  function clouds(g, rnd, n, y0, y1, cols) {
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, y = y0 + rnd() * (y1 - y0), rx = 120 + rnd() * 280, sq = 0.06 + rnd() * 0.1;
      const c = cols[(rnd() * cols.length) | 0];
      g.save();
      g.translate(x, y);
      g.scale(1, sq);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      gr.addColorStop(0, `rgba(${c},${0.25 + rnd() * 0.3})`);
      gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr;
      g.fillRect(-rx, -rx, rx * 2, rx * 2);
      g.restore();
    }
  }
  // araucária: tronco reto e copa em candelabro, com tufos nas pontas
  function araucaria(g, rnd, x, yb, h, color, detail) {
    g.save();
    g.fillStyle = color;
    g.strokeStyle = color;
    g.lineCap = 'round';
    const top = yb - h, tw = Math.max(1, h * 0.013);
    g.beginPath();
    g.moveTo(x - tw, yb);
    g.lineTo(x - tw * 0.45, top + h * 0.06);
    g.lineTo(x + tw * 0.45, top + h * 0.06);
    g.lineTo(x + tw, yb);
    g.closePath();
    g.fill();
    if (detail) {
      g.lineWidth = Math.max(1, h * 0.004);
      for (let i = 0; i < 5; i++) {
        const by = top + h * (0.35 + rnd() * 0.4), s = rnd() < 0.5 ? -1 : 1;
        line(g, x, by, x + s * h * (0.03 + rnd() * 0.04), by - h * 0.02);
      }
    }
    const crown = h * (0.3 + rnd() * 0.1);
    const nb = detail ? 13 : 7;
    const tuftN = detail ? 16 : 6;
    for (let i = 0; i < nb; i++) {
      const u = (i + 0.5) / nb * 2 - 1;
      const ex = x + u * crown * (0.85 + rnd() * 0.3);
      const by = top + h * (0.07 + 0.2 * Math.abs(u) + rnd() * 0.04);
      const ty = top + h * (0.015 + 0.035 * rnd() + 0.03 * Math.abs(u));
      g.lineWidth = Math.max(0.8, h * 0.006);
      g.beginPath();
      g.moveTo(x, by);
      g.quadraticCurveTo(lerp(x, ex, 0.75), by + h * 0.01, ex, ty + h * 0.02);
      g.stroke();
      for (let k = 0; k < tuftN; k++) {
        const rx = h * 0.028 * (0.5 + rnd() * 0.7);
        ell(g, ex + (rnd() - 0.5) * h * 0.075, ty + (rnd() - 0.35) * h * 0.035, rx, rx * (0.35 + rnd() * 0.2), (rnd() - 0.5) * 0.5);
        g.fill();
      }
    }
    for (let k = 0; k < tuftN; k++) {
      const rx = h * 0.03 * (0.5 + rnd() * 0.6);
      ell(g, x + (rnd() - 0.5) * h * 0.08, top + h * 0.03 + (rnd() - 0.5) * h * 0.03, rx, rx * 0.45, (rnd() - 0.5) * 0.4);
      g.fill();
    }
    g.restore();
  }
  function leafy(g, rnd, x, y, rx, ry, color, n) {
    g.save();
    g.fillStyle = color;
    for (let i = 0; i < (n || 140); i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd());
      const r = 8 + rnd() * 26;
      ell(g, x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, r, r * (0.7 + rnd() * 0.3));
      g.fill();
    }
    g.restore();
  }
  // hortênsias: arbusto de folhas escuras com cabeças de flores azuis
  function hydrangea(g, rnd, x, y, R, cols, lit) {
    g.save();
    for (let i = 0; i < 46; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * R;
      g.fillStyle = rnd() < 0.5 ? '#14201a' : '#1b2a21';
      ell(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6 + R * 0.25, 14 + rnd() * 14, 7 + rnd() * 7, rnd() * TAU);
      g.fill();
    }
    const heads = 5 + ((rnd() * 4) | 0);
    for (let hI = 0; hI < heads; hI++) {
      const hx = x + (rnd() - 0.5) * R * 1.5, hy = y + (rnd() - 0.6) * R * 0.7, hr = R * (0.24 + rnd() * 0.14);
      for (let j = 0; j < 46; j++) {
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * hr;
        const fx = hx + Math.cos(a) * d, fy = hy + Math.sin(a) * d * 0.85;
        const up = clamp(((hy - fy) / hr + (hx - fx) / hr * (lit || 0.3)) * 0.5 + 0.5, 0, 1);
        const c = cols[(rnd() * cols.length) | 0];
        g.fillStyle = `rgba(${c},${0.55 + up * 0.45})`;
        const pr = 2.2 + rnd() * 2.6;
        for (let p = 0; p < 4; p++) {
          ell(g, fx + Math.cos(p * Math.PI / 2 + a) * pr * 0.7, fy + Math.sin(p * Math.PI / 2 + a) * pr * 0.7, pr * 0.75, pr * 0.55, p * Math.PI / 2 + a);
          g.fill();
        }
        if (up > 0.7) { g.fillStyle = 'rgba(230,240,255,0.25)'; ell(g, fx, fy, 1, 1); g.fill(); }
      }
    }
    g.restore();
  }
  function grassEdge(g, rnd, pts, color, n, hgt) {
    g.save();
    g.strokeStyle = color;
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const u = rnd(), k = Math.floor(u * (pts.length / 2 - 1)) * 2;
      const f = u * (pts.length / 2 - 1) - k / 2;
      const x = lerp(pts[k], pts[k + 2], f), y = lerp(pts[k + 1], pts[k + 3], f);
      g.lineWidth = 1 + rnd() * 1.5;
      line(g, x, y, x + (rnd() - 0.5) * 10, y - hgt * (0.4 + rnd() * 0.8));
    }
    g.restore();
  }
  function stoneWall(g, rnd, x0, y0, x1, y1, base, var_, mortar) {
    g.save();
    g.beginPath();
    g.rect(x0, y0, x1 - x0, y1 - y0);
    g.clip();
    g.fillStyle = mortar;
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0; y < y1;) {
      const bh = 26 + rnd() * 22;
      for (let x = x0 - rnd() * 60; x < x1;) {
        const bw = 40 + rnd() * 70;
        const v = (rnd() - 0.5) * var_;
        g.fillStyle = `rgb(${base[0] + v},${base[1] + v},${base[2] + v * 1.1})`;
        rrect(g, x + 2, y + 2, bw - 4, bh - 4, 5);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.04)';
        g.fillRect(x + 4, y + 3, bw - 8, 3);
        x += bw;
      }
      y += bh;
    }
    g.restore();
  }
  function books(g, rnd, x0, x1, yb, hmax) {
    const cols = ['#4a1c1c', '#2a3a2a', '#3b2a1c', '#1f2a3d', '#5a4a2a', '#3a2232', '#2c2c2c', '#5c3a22'];
    for (let x = x0; x < x1;) {
      if (rnd() < 0.08) { x += 10 + rnd() * 20; continue; }
      const bw = 12 + rnd() * 18, bh = hmax * (0.65 + rnd() * 0.35);
      const lean = rnd() < 0.1 ? (rnd() - 0.5) * 0.25 : 0;
      g.save();
      g.translate(x + bw / 2, yb);
      g.rotate(lean);
      g.fillStyle = cols[(rnd() * cols.length) | 0];
      g.fillRect(-bw / 2, -bh, bw - 1, bh);
      g.fillStyle = 'rgba(200,170,90,0.35)';
      g.fillRect(-bw / 2 + 1, -bh * 0.85, bw - 3, 2);
      g.fillRect(-bw / 2 + 1, -bh * 0.2, bw - 3, 2);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(bw / 2 - 4, -bh, 3, bh);
      g.restore();
      x += bw;
    }
  }
  function frameGilt(g, x, y, w, h, oval) {
    g.save();
    const gold = lin(g, x, y, x + w, y + h, [[0, '#a7823c'], [0.4, '#6a4e22'], [0.7, '#9a7838'], [1, '#4a3518']]);
    g.fillStyle = gold;
    if (oval) { ell(g, x + w / 2, y + h / 2, w / 2, h / 2); g.fill(); }
    else g.fillRect(x, y, w, h);
    g.fillStyle = '#16100c';
    if (oval) { ell(g, x + w / 2, y + h / 2, w / 2 - 12, h / 2 - 12); g.fill(); }
    else g.fillRect(x + 12, y + 12, w - 24, h - 24);
    g.restore();
  }
  // vulto de retrato antigo dentro da moldura (busto escuro)
  function portraitBust(g, cx, cy, s, tone) {
    g.save();
    g.fillStyle = tone;
    ell(g, cx, cy, 16 * s, 21 * s);
    g.fill();
    g.beginPath();
    g.moveTo(cx - 40 * s, cy + 70 * s);
    g.quadraticCurveTo(cx - 34 * s, cy + 28 * s, cx, cy + 22 * s);
    g.quadraticCurveTo(cx + 34 * s, cy + 28 * s, cx + 40 * s, cy + 70 * s);
    g.closePath();
    g.fill();
    g.restore();
  }

  // ======================================================================== CENAS
  const SCENES = {};

  // ---------------------------------------------------------------- estrada
  SCENES.estrada = {
    brush: { n: 15000, len: [8, 24], width: [2, 5], alpha: 0.2, ang: 0, spread: 0.45, smear: 8 },
    build(g, rnd) {
      vg(g, 0, 0, W, H, [[0, '#101726'], [0.2, '#222c44'], [0.38, '#4a4f67'], [0.47, '#7d6f74'], [0.53, '#6a687b'], [0.62, '#2e3540'], [1, '#141920']]);
      light(g, 1080, 430, 600, '255,150,100', 0.28);
      clouds(g, rnd, 26, 30, 330, ['22,28,44', '22,28,44', '150,128,138']);
      ridge(g, rnd, 388, 58, '#585e71', 0.8);
      haze(g, 330, 470, '205,190,195', 0, 0.35);
      const r2 = ridge(g, rnd, 428, 70, '#41485b', 1.1);
      for (let i = 0; i < 50; i++) { const x = rnd() * W; araucaria(g, rnd, x, r2(x) + 6, 20 + rnd() * 26, '#394052', 0); }
      haze(g, 400, 525, '190,188,200', 0, 0.5);
      const r3 = ridge(g, rnd, 488, 44, '#2a303c', 1.5);
      for (let i = 0; i < 36; i++) { const x = rnd() * W; if (x > 880 && x < 1010) continue; araucaria(g, rnd, x, r3(x) + 8, 46 + rnd() * 60, '#222832', 0); }
      haze(g, 468, 560, '185,188,198', 0.04, 0.48);
      vg(g, 0, 520, W, H, [[0, 'rgba(16,20,24,0)'], [0.35, 'rgba(18,22,27,0.85)'], [1, 'rgba(10,13,16,1)']]);
      // estrada
      g.save();
      g.beginPath();
      g.moveTo(330, 900);
      g.bezierCurveTo(430, 700, 880, 560, 930, 484);
      g.lineTo(954, 484);
      g.bezierCurveTo(1010, 560, 1160, 700, 1250, 900);
      g.closePath();
      g.fillStyle = lin(g, 0, 484, 0, 900, [[0, '#5e6271'], [0.25, '#3c4049'], [1, '#1b1f26']]);
      g.fill();
      g.clip();
      for (let i = 0; i < 90; i++) {
        const y = 490 + Math.pow(rnd(), 1.3) * 410, x = 600 + rnd() * 700, l = 8 + (y - 480) * 0.15;
        g.strokeStyle = `rgba(${rnd() < 0.3 ? '255,170,130' : '150,155,175'},${0.05 + rnd() * 0.08})`;
        g.lineWidth = 1 + (y - 480) * 0.012;
        line(g, x, y, x + (rnd() - 0.5) * 3, y + l);
      }
      light(g, 942, 520, 160, '255,170,130', 0.2);
      g.restore();
      // faixa central tracejada
      g.save();
      g.lineCap = 'butt';
      for (let u = 0.03; u < 0.97; u += 0.055) {
        const u2 = u + 0.022;
        g.strokeStyle = `rgba(205,190,140,${0.4 - u * 0.25})`;
        g.lineWidth = lerp(9, 1, Math.pow(u, 0.6));
        g.beginPath();
        g.moveTo(bz(790, 795, 945, 942, u), bz(900, 700, 560, 484, u));
        g.lineTo(bz(790, 795, 945, 942, u2), bz(900, 700, 560, 484, u2));
        g.stroke();
      }
      g.restore();
      // mourões na margem direita
      for (let u = 0.12; u < 0.92; u += 0.11) {
        const x = bz(1250, 1160, 1010, 954, u) + lerp(40, 4, u), y = bz(900, 700, 560, 484, u);
        const s = lerp(1, 0.08, Math.pow(u, 0.7));
        g.fillStyle = '#20252b';
        g.fillRect(x, y - 70 * s, 10 * s, 70 * s);
        g.fillStyle = 'rgba(160,160,175,0.2)';
        g.fillRect(x, y - 70 * s, 3 * s, 70 * s);
      }
      // morro da esquerda com araucárias grandes
      g.fillStyle = lin(g, 0, 360, 420, 900, [[0, '#1d2329'], [1, '#0e1215']]);
      g.beginPath();
      g.moveTo(-10, 350);
      g.bezierCurveTo(150, 370, 320, 470, 420, 600);
      g.bezierCurveTo(470, 680, 380, 800, 330, 910);
      g.lineTo(-10, 910);
      g.closePath();
      g.fill();
      grassEdge(g, rnd, [0, 352, 150, 372, 300, 455, 420, 600, 440, 680, 370, 820], '#1b2226', 260, 18);
      araucaria(g, rnd, 150, 470, 440, '#0d1115', 1);
      araucaria(g, rnd, 345, 560, 360, '#10141a', 1);
      araucaria(g, rnd, 40, 570, 300, '#0c1014', 1);
      // margem direita
      araucaria(g, rnd, 1475, 610, 480, '#0e1217', 1);
      araucaria(g, rnd, 1335, 570, 310, '#12161c', 1);
      araucaria(g, rnd, 1180, 540, 180, '#181d24', 1);
      // ponto de ônibus
      g.fillStyle = '#2a1d16';
      g.fillRect(596, 468, 7, 176);
      g.fillStyle = lin(g, 560, 430, 640, 480, [[0, '#7a4a2c'], [0.5, '#5c3520'], [1, '#3a2216']]);
      rrect(g, 566, 436, 68, 40, 4);
      g.fill();
      g.fillStyle = 'rgba(220,200,170,0.5)';
      g.font = 'bold 13px Georgia, serif';
      g.textAlign = 'center';
      g.fillText('PONTO', 600, 461);
      g.fillStyle = 'rgba(40,20,10,0.5)';
      for (let i = 0; i < 9; i++) { ell(g, 570 + rnd() * 60, 440 + rnd() * 32, 2 + rnd() * 4, 1 + rnd() * 3); g.fill(); }
      // banco
      g.fillStyle = '#2b2119';
      g.fillRect(470, 606, 112, 9);
      g.fillRect(474, 584, 104, 7);
      g.fillStyle = '#1a140f';
      g.fillRect(478, 615, 6, 26);
      g.fillRect(568, 615, 6, 26);
      g.fillRect(478, 590, 5, 18);
      g.fillRect(569, 590, 5, 18);
      g.fillStyle = 'rgba(200,180,160,0.12)';
      g.fillRect(470, 606, 112, 2);
    },
    prep(st) {
      st.fog1 = fogTex(11, 200, 46, '205,205,215', 90, 240);
      st.fog2 = fogTex(12, 260, 36, '170,176,192', 120, 280);
    },
    anim(ctx, t, o, st) {
      drawFog(ctx, st.fog1, 400, 170, t, 7, 0.6);
      const k = clamp(1 - t / 7, 0, 1);
      if (k > 0) {
        const u = Math.min(1, t / 7), x = lerp(946, 942, u), y = lerp(522, 490, u), s = lerp(1, 0.35, u);
        ctx.fillStyle = `rgba(18,20,26,${k})`;
        ctx.fillRect(x - 13 * s, y - 15 * s, 26 * s, 17 * s);
        for (const dx of [-9, 9]) {
          glow(ctx, x + dx * s, y, 30 * s, '255,40,30', 0.9 * k);
          ctx.fillStyle = `rgba(255,90,70,${k})`;
          ctx.fillRect(x + dx * s - 2 * s, y - 1.5 * s, 4 * s, 3 * s);
        }
      }
      drawFog(ctx, st.fog2, 560, 260, t, -11, 0.35);
    },
  };

  // ---------------------------------------------------------------- vila
  function church(g, rnd) {
    const wallA = '#b4bbc5', wallB = '#7d8593', stone = '#5f584f', slate = '#363d4a';
    for (const tx of [600, 900]) {
      vg(g, tx, 228, 100, 640, [[0, wallA], [1, wallB]]);
      g.fillStyle = stone;
      g.fillRect(tx, 228, 10, 412);
      g.fillRect(tx + 90, 228, 10, 412);
      g.fillRect(tx - 6, 222, 112, 10);
      g.fillRect(tx - 4, 302, 108, 8);
      arch(g, tx + 28, 240, 44, 56);
      g.fillStyle = '#121419';
      g.fill();
      g.strokeStyle = stone;
      g.lineWidth = 4;
      g.stroke();
      g.fillStyle = '#4a3a22';
      g.beginPath();
      g.moveTo(tx + 40, 290);
      g.quadraticCurveTo(tx + 41, 266, tx + 50, 264);
      g.quadraticCurveTo(tx + 59, 266, tx + 60, 290);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255,210,140,0.25)';
      g.fillRect(tx + 43, 272, 2, 14);
      arch(g, tx + 34, 380, 32, 54);
      g.fillStyle = '#171a21';
      g.fill();
      g.strokeStyle = stone;
      g.lineWidth = 4;
      g.stroke();
      g.fillStyle = lin(g, tx, 0, tx + 100, 0, [[0, '#4d5666'], [0.5, slate], [1, '#1f242d']]);
      g.beginPath();
      g.moveTo(tx + 2, 224);
      g.bezierCurveTo(tx - 6, 190, tx + 30, 178, tx + 50, 148);
      g.bezierCurveTo(tx + 70, 178, tx + 106, 190, tx + 98, 224);
      g.closePath();
      g.fill();
      g.fillStyle = '#2a2e36';
      g.fillRect(tx + 48, 112, 4, 38);
      g.fillRect(tx + 41, 122, 18, 4);
    }
    vg(g, 700, 300, 200, 640, [[0, wallA], [1, wallB]]);
    g.fillStyle = wallA;
    g.beginPath();
    g.moveTo(700, 304);
    g.bezierCurveTo(704, 262, 744, 272, 750, 250);
    g.bezierCurveTo(760, 222, 784, 214, 800, 198);
    g.bezierCurveTo(816, 214, 840, 222, 850, 250);
    g.bezierCurveTo(856, 272, 896, 262, 900, 304);
    g.closePath();
    g.fill();
    g.strokeStyle = stone;
    g.lineWidth = 6;
    g.stroke();
    g.fillStyle = stone;
    g.fillRect(696, 300, 208, 9);
    g.fillStyle = '#2a2e36';
    g.fillRect(798, 158, 5, 42);
    g.fillRect(789, 170, 23, 5);
    ell(g, 800, 258, 19, 19);
    g.fillStyle = '#14161c';
    g.fill();
    g.lineWidth = 5;
    g.stroke();
    for (const wx of [744, 828]) {
      arch(g, wx, 360, 28, 58);
      g.fillStyle = '#1a1d24';
      g.fill();
      g.lineWidth = 4;
      g.stroke();
    }
    // portada de cantaria e porta azul
    g.fillStyle = stone;
    arch(g, 744, 470, 112, 172);
    g.fill();
    arch(g, 756, 482, 88, 160);
    g.fillStyle = lin(g, 756, 0, 844, 0, [[0, '#355879'], [1, '#203a55']]);
    g.fill();
    g.strokeStyle = 'rgba(10,20,30,0.6)';
    g.lineWidth = 2;
    line(g, 800, 500, 800, 642);
    for (const px of [764, 806]) {
      g.strokeRect(px, 540, 30, 40);
      g.strokeRect(px, 590, 30, 44);
    }
    g.fillStyle = '#6d665c';
    g.fillRect(730, 640, 140, 9);
    g.fillRect(716, 649, 168, 9);
    // sombreamento lateral e manchas
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = lin(g, 600, 0, 1000, 0, [[0, 'rgba(120,130,150,0.2)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(60,70,95,0.55)']]);
    g.fillRect(590, 100, 420, 560);
    g.restore();
    for (let i = 0; i < 26; i++) {
      const x = 610 + rnd() * 380, y = 330 + rnd() * 300;
      soft(g, x, y, 10 + rnd() * 26, 'rgba(60,62,55,0.18)', 2.2);
    }
  }
  function house(g, rnd, o) {
    const { x, w, top, bot } = o;
    const h = bot - top;
    vg(g, x, top, w, bot, [[0, o.wall], [1, o.wall2]]);
    for (let i = 0; i < 10; i++) soft(g, x + rnd() * w, bot - rnd() * h * 0.4, 12 + rnd() * 30, 'rgba(40,45,35,0.22)', 1.8);
    g.fillStyle = 'rgba(55,50,46,0.65)';
    g.fillRect(x, top, 9, h);
    g.fillRect(x + w - 9, top, 9, h);
    // beiral de telha visto de baixo
    g.fillStyle = '#2a1c17';
    g.beginPath();
    g.moveTo(x - 12, top + 2);
    g.lineTo(x + w + 12, top + 2);
    g.lineTo(x + w + 4, top - 30);
    g.lineTo(x - 4, top - 30);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(110,62,44,0.55)';
    g.lineWidth = 2;
    for (let tx = x - 6; tx < x + w + 6; tx += 11) line(g, tx, top - 28, tx + 1, top + 1);
    vg(g, x, top + 2, w, top + 26, [[0, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]);
    const floors = 2;
    const n = Math.max(1, Math.round(w / 95));
    for (let f = 0; f < floors; f++) {
      const y0 = top + 34 + f * h * 0.48, wh = Math.min(92, h * 0.28), ww = Math.min(46, (w / n) * 0.42);
      for (let i = 0; i < n; i++) {
        const wx = x + ((i + 0.5) * w) / n - ww / 2;
        const isDoor = f === 1 && i === Math.floor(n / 2);
        const hh = isDoor ? bot - y0 : wh;
        const lit = !isDoor && rnd() < o.litP;
        g.fillStyle = '#6a6359';
        g.fillRect(wx - 5, y0 - 5, ww + 10, hh + 7);
        if (lit) {
          g.fillStyle = lin(g, 0, y0, 0, y0 + hh, [[0, '#ffc97a'], [1, '#d98a3e']]);
          g.fillRect(wx, y0, ww, hh);
          g.fillStyle = 'rgba(80,40,20,0.35)';
          g.fillRect(wx + ww * 0.55, y0, ww * 0.45, hh);
        } else {
          g.fillStyle = isDoor ? '#2a1d14' : '#10131a';
          g.fillRect(wx, y0, ww, hh);
        }
        if (!isDoor) {
          g.fillStyle = o.sh;
          const open = rnd() < 0.7;
          if (open) {
            g.fillRect(wx - ww * 0.5 - 5, y0, ww * 0.46, hh);
            g.fillRect(wx + ww + 5, y0, ww * 0.46, hh);
            g.fillStyle = 'rgba(0,0,0,0.25)';
            for (let s = 4; s < hh; s += 7) { g.fillRect(wx - ww * 0.5 - 5, y0 + s, ww * 0.46, 2); g.fillRect(wx + ww + 5, y0 + s, ww * 0.46, 2); }
          } else {
            g.fillRect(wx, y0, ww, hh);
            g.strokeStyle = 'rgba(0,0,0,0.35)';
            g.lineWidth = 2;
            line(g, wx + ww / 2, y0, wx + ww / 2, y0 + hh);
          }
          if (f === 0 && rnd() < 0.55) {
            g.strokeStyle = '#121418';
            g.lineWidth = 2;
            line(g, wx - 10, y0 + hh * 0.62, wx + ww + 10, y0 + hh * 0.62);
            line(g, wx - 10, y0 + hh, wx + ww + 10, y0 + hh);
            g.lineWidth = 1.2;
            for (let b = wx - 8; b < wx + ww + 10; b += 5) line(g, b, y0 + hh * 0.62, b, y0 + hh);
          }
        }
        if (lit) light(g, wx + ww / 2, y0 + hh / 2, 110, '255,175,95', 0.35);
      }
    }
  }
  function streetLamp(g, x, yb, yt) {
    g.fillStyle = '#121418';
    g.fillRect(x - 4, yt + 40, 8, yb - yt - 40);
    g.beginPath();
    g.moveTo(x - 13, yb);
    g.lineTo(x - 6, yb - 34);
    g.lineTo(x + 6, yb - 34);
    g.lineTo(x + 13, yb);
    g.fill();
    g.beginPath();
    g.moveTo(x - 17, yt + 8);
    g.lineTo(x + 17, yt + 8);
    g.lineTo(x + 11, yt + 42);
    g.lineTo(x - 11, yt + 42);
    g.closePath();
    g.fillStyle = '#ffd593';
    g.fill();
    g.strokeStyle = '#121418';
    g.lineWidth = 2;
    g.stroke();
    line(g, x, yt + 8, x, yt + 42);
    g.fillStyle = '#121418';
    g.beginPath();
    g.moveTo(x - 22, yt + 9);
    g.lineTo(x, yt - 10);
    g.lineTo(x + 22, yt + 9);
    g.closePath();
    g.fill();
    g.fillRect(x - 2, yt - 20, 4, 12);
    light(g, x, yt + 25, 280, '255,175,95', 0.55);
    light(g, x, yb + 6, 240, '255,170,90', 0.3, 'screen', 0.28);
  }
  function cobbles(g, rnd, y0, warmX) {
    g.fillStyle = '#1b1e24';
    g.fillRect(0, y0, W, H - y0);
    for (let y = y0 + 2; y < H;) {
      const s = (y - y0 + 40) * 0.07 + 3;
      for (let x = -rnd() * s * 2; x < W;) {
        const sw = s * (1.4 + rnd() * 0.9);
        const v = 26 + rnd() * 20;
        g.fillStyle = `rgb(${v},${v + 2},${v + 7})`;
        rrect(g, x + 1, y + 1, sw - 2, s - 2, s * 0.35);
        g.fill();
        let warm = 0;
        for (const wx of warmX) warm = Math.max(warm, 1 - Math.abs(x - wx) / 300);
        g.fillStyle = warm > 0 ? `rgba(255,180,110,${0.05 + warm * 0.22})` : 'rgba(170,180,200,0.07)';
        g.fillRect(x + sw * 0.2, y + 2, sw * 0.6, Math.max(1, s * 0.12));
        x += sw;
      }
      y += s;
    }
  }
  SCENES.vila = {
    brush: { n: 14000, len: [6, 18], width: [2, 4], alpha: 0.2, ang: Math.PI / 2, spread: 0.5, smear: 6 },
    build(g, rnd) {
      vg(g, 0, 0, W, H, [[0, '#0b111e'], [0.28, '#1a243b'], [0.5, '#363f58'], [0.68, '#272d39'], [1, '#121419']]);
      light(g, 800, 320, 720, '140,155,205', 0.25);
      clouds(g, rnd, 20, 20, 260, ['18,24,40', '120,128,160']);
      ridge(g, rnd, 330, 60, '#232c44', 0.9);
      haze(g, 260, 480, '150,160,185', 0, 0.5);
      church(g, rnd);
      haze(g, 100, 660, '110,125,160', 0.1, 0.32);
      cobbles(g, rnd, 600, [520, 1080]);
      house(g, rnd, { x: 410, w: 190, top: 340, bot: 640, wall: '#8a8d8c', wall2: '#5f6366', sh: '#36574a', litP: 0.25 });
      house(g, rnd, { x: 1000, w: 190, top: 340, bot: 640, wall: '#8c8270', wall2: '#5f584c', sh: '#2c4a66', litP: 0.3 });
      haze(g, 280, 660, '120,132,160', 0.05, 0.25);
      house(g, rnd, { x: 210, w: 210, top: 262, bot: 670, wall: '#7c8890', wall2: '#4f575e', sh: '#6e4f28', litP: 0.3 });
      house(g, rnd, { x: 1180, w: 210, top: 262, bot: 670, wall: '#8a7f7a', wall2: '#58504c', sh: '#2f4a3a', litP: 0.35 });
      house(g, rnd, { x: -20, w: 240, top: 150, bot: 720, wall: '#6c7178', wall2: '#3c4046', sh: '#2c4a66', litP: 0.4 });
      house(g, rnd, { x: 1380, w: 240, top: 150, bot: 720, wall: '#73706a', wall2: '#403d39', sh: '#5a3f22', litP: 0.3 });
      band(g, 610, 140, '150,160,185', 0.35);
      shade(g, '#55627d', 0.35);
      streetLamp(g, 520, 700, 418);
      streetLamp(g, 1080, 700, 418);
    },
    prep(st) {
      st.fog1 = fogTex(21, 220, 40, '160,170,195', 100, 260);
      st.fog2 = fogTex(22, 260, 34, '140,150,175', 120, 300);
    },
    anim(ctx, t, o, st) {
      drawFog(ctx, st.fog1, 470, 200, t, 6, 0.5);
      glow(ctx, 520, 443, 120, '255,190,110', 0.1 + 0.05 * fl(t * 3));
      glow(ctx, 1080, 443, 120, '255,190,110', 0.1 + 0.05 * fl(t * 3.4 + 2));
      drawFog(ctx, st.fog2, 560, 260, t, -9, 0.4);
    },
  };

  // ---------------------------------------------------------------- padaria
  SCENES.padaria = {
    brush: { n: 16000, len: [6, 16], width: [2, 4], alpha: 0.22, ang: Math.PI / 2, spread: 0.7, smear: 6 },
    build(g, rnd) {
      vg(g, 0, 0, W, H, [[0, '#3c2c21'], [0.45, '#4d3928'], [1, '#1d140e']]);
      for (let i = 0; i < 40; i++) soft(g, rnd() * W, rnd() * 520, 20 + rnd() * 60, `rgba(${rnd() < 0.5 ? '90,70,50' : '30,20,14'},0.25)`, 0.6 + rnd());
      g.fillStyle = '#24170f';
      g.fillRect(0, 430, W, 140);
      g.strokeStyle = 'rgba(0,0,0,0.4)';
      g.lineWidth = 3;
      for (let x = 20; x < W; x += 120) g.strokeRect(x, 446, 100, 108);
      // janela com chuva
      g.fillStyle = '#23170e';
      g.fillRect(78, 138, 404, 404);
      vg(g, 98, 158, 364, 522, [[0, '#0a1120'], [0.6, '#16223a'], [1, '#1f2a40']]);
      g.save();
      g.beginPath();
      g.rect(98, 158, 364, 364);
      g.clip();
      g.fillStyle = 'rgba(8,12,20,0.9)';
      g.fillRect(120, 300, 120, 222);
      g.fillRect(300, 270, 150, 252);
      for (let i = 0; i < 16; i++) light(g, 110 + rnd() * 340, 240 + rnd() * 260, 14 + rnd() * 34, rnd() < 0.6 ? '255,180,100' : '140,170,230', 0.45, 'screen');
      vg(g, 98, 400, 364, 522, [[0, 'rgba(200,210,230,0)'], [1, 'rgba(200,210,230,0.16)']]);
      g.fillStyle = 'rgba(210,225,255,0.35)';
      for (let i = 0; i < 220; i++) { ell(g, 100 + rnd() * 360, 160 + rnd() * 360, 0.8 + rnd() * 1.8, 1 + rnd() * 2.2); g.fill(); }
      g.restore();
      g.fillStyle = '#23170e';
      g.fillRect(274, 158, 12, 364);
      g.fillRect(98, 334, 364, 12);
      g.fillStyle = '#2d1e13';
      g.fillRect(64, 536, 432, 18);
      // prateleiras de pão à direita
      for (const sy of [190, 310, 430]) {
        g.fillStyle = '#2a1a10';
        g.fillRect(1380, sy, 230, 12);
        for (let x = 1392; x < 1590; x += 34 + rnd() * 10) {
          g.fillStyle = `rgb(${120 + rnd() * 30},${78 + rnd() * 20},${40 + rnd() * 10})`;
          ell(g, x + 14, sy - 14, 18, 13);
          g.fill();
          g.fillStyle = 'rgba(255,220,160,0.25)';
          ell(g, x + 10, sy - 19, 8, 3, -0.2);
          g.fill();
        }
      }
      // relógio de pêndulo (caixa)
      g.fillStyle = lin(g, 1228, 0, 1332, 0, [[0, '#4a2e18'], [0.5, '#3a2212'], [1, '#1e120a']]);
      g.fillRect(1228, 140, 104, 340);
      g.beginPath();
      g.moveTo(1222, 142);
      g.quadraticCurveTo(1280, 92, 1338, 142);
      g.closePath();
      g.fill();
      ell(g, 1280, 196, 38, 38);
      g.fillStyle = '#cfc5ab';
      g.fill();
      g.strokeStyle = '#7a5a2a';
      g.lineWidth = 3;
      g.stroke();
      g.strokeStyle = '#2a1e14';
      g.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        line(g, 1280 + Math.cos(a) * 30, 196 + Math.sin(a) * 30, 1280 + Math.cos(a) * 35, 196 + Math.sin(a) * 35);
      }
      g.lineWidth = 3;
      line(g, 1280, 196, 1280 + Math.cos(-2.2) * 20, 196 + Math.sin(-2.2) * 20);
      g.lineWidth = 2;
      line(g, 1280, 196, 1280 + Math.cos(-0.4) * 28, 196 + Math.sin(-0.4) * 28);
      g.fillStyle = '#0d0907';
      g.fillRect(1248, 250, 64, 206);
      // santos na prateleira
      g.fillStyle = '#2a1a10';
      g.fillRect(900, 262, 230, 10);
      const saints = [[950, '#3b5d86'], [1010, '#5a3a24'], [1068, '#bdb3a0']];
      for (const [sx, c] of saints) {
        g.fillStyle = c;
        g.beginPath();
        g.moveTo(sx - 15, 262);
        g.quadraticCurveTo(sx - 13, 222, sx, 214);
        g.quadraticCurveTo(sx + 13, 222, sx + 15, 262);
        g.closePath();
        g.fill();
        g.fillStyle = '#c9a789';
        ell(g, sx, 207, 7, 8);
        g.fill();
        g.strokeStyle = 'rgba(230,200,120,0.6)';
        g.lineWidth = 1.5;
        ell(g, sx, 204, 11, 4);
        g.stroke();
      }
      g.fillStyle = '#6a1218';
      g.fillRect(1104, 240, 16, 22);
      // luminária pendente
      g.strokeStyle = '#120c08';
      g.lineWidth = 3;
      line(g, 820, 0, 820, 120);
      g.fillStyle = lin(g, 760, 0, 880, 0, [[0, '#2f4a3a'], [0.4, '#4d6e5a'], [1, '#1c2c22']]);
      g.beginPath();
      g.moveTo(800, 118);
      g.lineTo(840, 118);
      g.lineTo(886, 172);
      g.lineTo(754, 172);
      g.closePath();
      g.fill();
      g.fillStyle = '#ffe2a8';
      ell(g, 820, 172, 66, 9);
      g.fill();
      // balcão e vitrine
      g.fillStyle = '#2b1a0f';
      g.fillRect(250, 582, 1360, 320);
      g.strokeStyle = 'rgba(0,0,0,0.45)';
      g.lineWidth = 4;
      for (let x = 280; x < 1600; x += 170) g.strokeRect(x, 610, 140, 240);
      g.fillStyle = lin(g, 0, 560, 0, 584, [[0, '#6a4428'], [1, '#3a2414']]);
      g.fillRect(240, 560, 1380, 24);
      g.fillStyle = 'rgba(255,220,170,0.35)';
      g.fillRect(240, 560, 1380, 2);
      g.fillStyle = '#1a120c';
      g.fillRect(520, 452, 560, 108);
      vg(g, 526, 458, 548, 556, [[0, '#3a2a1a'], [1, '#5a3f22']]);
      for (let row = 0; row < 2; row++) {
        const ty = 500 + row * 34;
        g.fillStyle = '#7a7466';
        g.fillRect(536, ty + 8, 300, 4);
        for (let x = 548; x < 830; x += 22) {
          g.fillStyle = `rgb(${200 + rnd() * 30},${150 + rnd() * 20},${70 + rnd() * 20})`;
          ell(g, x, ty + 2, 10, 8);
          g.fill();
          g.fillStyle = 'rgba(255,240,200,0.45)';
          ell(g, x - 3, ty - 2, 4, 2);
          g.fill();
        }
      }
      g.fillStyle = '#e7d8b6';
      g.beginPath();
      g.moveTo(880, 548);
      g.lineTo(880, 500);
      g.lineTo(1040, 500);
      g.lineTo(1040, 548);
      g.closePath();
      g.fill();
      g.fillStyle = '#6a3a1e';
      g.fillRect(880, 518, 160, 10);
      g.fillStyle = '#3a2214';
      g.beginPath();
      g.moveTo(990, 500);
      g.lineTo(1040, 500);
      g.lineTo(1040, 548);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(220,230,240,0.18)';
      g.lineWidth = 3;
      for (let i = 0; i < 6; i++) line(g, 540 + i * 100, 556, 600 + i * 100, 460);
      g.strokeStyle = '#8a8070';
      g.lineWidth = 3;
      g.strokeRect(520, 452, 560, 108);
      // bule esmaltado
      g.fillStyle = lin(g, 1150, 0, 1220, 0, [[0, '#e8e4da'], [0.5, '#c9c3b6'], [1, '#6e6a62']]);
      g.beginPath();
      g.moveTo(1158, 560);
      g.lineTo(1166, 500);
      g.lineTo(1206, 500);
      g.lineTo(1214, 560);
      g.closePath();
      g.fill();
      g.fillStyle = '#2b4a7a';
      g.fillRect(1164, 498, 44, 6);
      g.fillRect(1157, 554, 58, 6);
      g.strokeStyle = '#c9c3b6';
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(1162, 520);
      g.quadraticCurveTo(1140, 516, 1132, 498);
      g.stroke();
      g.beginPath();
      g.moveTo(1210, 508);
      g.quadraticCurveTo(1238, 512, 1210, 544);
      g.stroke();
      // luz
      shade(g, '#40384a', 0.45);
      light(g, 820, 190, 760, '255,190,120', 0.55);
      light(g, 800, 505, 360, '255,200,130', 0.4);
      light(g, 280, 340, 360, '120,150,210', 0.16);
      light(g, 1112, 240, 70, '255,60,40', 0.5);
      vg(g, 0, 720, W, H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.55)']]);
    },
    prep(st, o, rnd) {
      st.drops = [];
      for (let i = 0; i < 34; i++) st.drops.push({ x: 100 + rnd() * 360, ph: rnd(), sp: 0.5 + rnd() * 0.9, l: 10 + rnd() * 16 });
    },
    anim(ctx, t, o, st) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(98, 158, 364, 364);
      ctx.clip();
      ctx.strokeStyle = 'rgba(200,215,240,0.28)';
      ctx.lineWidth = 1.2;
      for (const d of st.drops) {
        const y = 150 + (((t * d.sp * 0.6 + d.ph) % 1) * 400);
        line(ctx, d.x, y, d.x - 1, y + d.l);
      }
      ctx.restore();
      // pêndulo
      const a = Math.sin(t * Math.PI) * 0.2;
      const px = 1280 + Math.sin(a) * 150, py = 252 + Math.cos(a) * 150;
      ctx.strokeStyle = '#8a6a32';
      ctx.lineWidth = 2;
      line(ctx, 1280, 252, px, py);
      ctx.fillStyle = '#b38b3e';
      ell(ctx, px, py, 13, 13);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,230,160,0.5)';
      ell(ctx, px - 4, py - 4, 4, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(180,190,200,0.07)';
      ctx.fillRect(1248, 250, 64, 206);
      // vapor do bule
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.25 + i / 3) % 1;
        glow(ctx, 1132 + Math.sin(ph * 6 + i) * 6, 492 - ph * 80, 16 + ph * 22, '220,220,225', 0.12 * Math.sin(ph * Math.PI), 'screen');
      }
      glow(ctx, 1112, 236, 40, '255,90,50', 0.15 + 0.12 * fl(t * 6));
      glow(ctx, 820, 180, 260, '255,200,130', 0.04 * fl(t * 1.5));
    },
  };

  // ---------------------------------------------------------------- fachada
  function mansion(g, rnd) {
    const L = 420, R = 1180, top = 268, bot = 700;
    // telhado de quatro águas
    g.fillStyle = lin(g, 0, 140, 0, 262, [[0, '#3b241d'], [1, '#22140f']]);
    g.beginPath();
    g.moveTo(L - 46, 262);
    g.lineTo(L + 110, 150);
    g.lineTo(R - 110, 150);
    g.lineTo(R + 46, 262);
    g.closePath();
    g.fill();
    g.save();
    g.clip();
    g.strokeStyle = 'rgba(120,70,50,0.35)';
    g.lineWidth = 2;
    for (let y = 156; y < 262; y += 9) line(g, 300, y, 1300, y);
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    for (let x = 330; x < 1290; x += 14) line(g, x, 150, x + (x - 800) * 0.12, 262);
    for (let i = 0; i < 18; i++) soft(g, L + rnd() * (R - L), 160 + rnd() * 90, 20 + rnd() * 40, 'rgba(40,50,35,0.4)', 0.5);
    g.restore();
    g.fillStyle = '#2b1c16';
    g.fillRect(L + 110, 146, R - L - 220, 6);
    // paredes
    vg(g, L, top - 6, R - L, bot, [[0, '#8e97a3'], [0.6, '#7a838f'], [1, '#4d535b']]);
    vg(g, L, top - 6, R - L, top + 30, [[0, 'rgba(0,0,0,0.6)'], [1, 'rgba(0,0,0,0)']]);
    for (let i = 0; i < 26; i++) {
      const x = L + rnd() * (R - L), y = bot - rnd() * 140;
      soft(g, x, y, 20 + rnd() * 50, 'rgba(46,58,40,0.35)', 1.6);
    }
    for (let i = 0; i < 14; i++) {
      const x = L + rnd() * (R - L);
      vg(g, x, top + 10, 6 + rnd() * 14, top + 60 + rnd() * 160, [[0, 'rgba(40,40,36,0.3)'], [1, 'rgba(40,40,36,0)']]);
    }
    g.fillStyle = '#69665f';
    g.fillRect(L, top - 6, 24, bot - top + 6);
    g.fillRect(R - 24, top - 6, 24, bot - top + 6);
    g.fillRect(L - 6, top - 10, R - L + 12, 10);
    g.fillRect(L, 470, R - L, 8);
    // janelas de cima
    const ux = [500, 650, 800, 950, 1100];
    for (const cx of ux) {
      const wx = cx - 34, wy = 316, ww = 68, wh = 118;
      g.fillStyle = '#6b665d';
      g.fillRect(wx - 7, wy - 9, ww + 14, wh + 14);
      if (cx === 950) {
        g.fillStyle = lin(g, 0, wy, 0, wy + wh, [[0, '#ffcf86'], [1, '#d4823a']]);
        g.fillRect(wx, wy, ww, wh);
        g.fillStyle = 'rgba(120,60,30,0.5)';
        g.fillRect(wx + ww * 0.62, wy, ww * 0.38, wh);
        g.fillStyle = 'rgba(90,40,20,0.4)';
        g.fillRect(wx, wy, ww * 0.18, wh);
      } else {
        g.fillStyle = '#0f1218';
        g.fillRect(wx, wy, ww, wh);
        g.strokeStyle = 'rgba(120,130,150,0.25)';
        g.lineWidth = 2;
        g.strokeRect(wx + 4, wy + 4, ww - 8, wh - 8);
        line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh);
        line(g, wx, wy + wh / 2, wx + ww, wy + wh / 2);
      }
      g.strokeStyle = '#2b1d14';
      g.lineWidth = 3;
      line(g, wx, wy + wh * 0.5, wx + ww, wy + wh * 0.5);
      line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh);
      g.fillStyle = '#35516b';
      if (cx === 1100) {
        g.save();
        g.translate(wx + ww + 6, wy + 4);
        g.rotate(0.18);
        g.fillRect(0, 0, 32, wh);
        g.restore();
        g.fillRect(wx - 40, wy, 32, wh);
      } else {
        g.fillRect(wx - 40, wy, 32, wh);
        g.fillRect(wx + ww + 8, wy, 32, wh);
      }
      g.fillStyle = 'rgba(0,0,0,0.3)';
      for (let s = 6; s < wh; s += 8) { g.fillRect(wx - 40, wy + s, 32, 2); if (cx !== 1100) g.fillRect(wx + ww + 8, wy + s, 32, 2); }
      g.fillStyle = '#5c584f';
      g.fillRect(wx - 12, wy + wh + 4, ww + 24, 8);
    }
    // térreo: porta e janelas com grade
    for (const cx of [500, 650, 950, 1100]) {
      const wx = cx - 32, wy = 520, ww = 64, wh = 100;
      g.fillStyle = '#6b665d';
      g.fillRect(wx - 7, wy - 9, ww + 14, wh + 14);
      g.fillStyle = '#0d1016';
      g.fillRect(wx, wy, ww, wh);
      g.fillStyle = '#2e4760';
      if (rnd() < 0.5) g.fillRect(wx, wy, ww, wh);
      g.strokeStyle = '#111317';
      g.lineWidth = 3;
      for (let b = wx + 8; b < wx + ww; b += 11) line(g, b, wy, b, wy + wh);
      line(g, wx, wy + 30, wx + ww, wy + 30);
    }
    g.fillStyle = '#6b665d';
    arch(g, 752, 506, 96, 196);
    g.fill();
    arch(g, 764, 518, 72, 184);
    g.fillStyle = lin(g, 764, 0, 836, 0, [[0, '#3a281a'], [1, '#1a110a']]);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)';
    g.lineWidth = 2;
    line(g, 800, 540, 800, 702);
    g.fillStyle = 'rgba(200,170,100,0.6)';
    ell(g, 792, 620, 2.5, 2.5);
    g.fill();
    ell(g, 808, 620, 2.5, 2.5);
    g.fill();
  }
  SCENES.fachada = {
    brush: { n: 15000, len: [6, 18], width: [2, 4], alpha: 0.2, ang: Math.PI / 2, spread: 0.6, smear: 6 },
    build(g, rnd) {
      vg(g, 0, 0, W, H, [[0, '#0e1524'], [0.28, '#202a42'], [0.48, '#3d4359'], [0.6, '#4a4b5d'], [1, '#191c23']]);
      light(g, 1250, 360, 520, '210,150,140', 0.18);
      clouds(g, rnd, 22, 20, 260, ['16,22,36', '110,110,140']);
      ridge(g, rnd, 292, 90, '#252d41', 0.8);
      haze(g, 220, 420, '150,158,182', 0, 0.42);
      ridge(g, rnd, 362, 60, '#2e3649', 1.2);
      haze(g, 320, 480, '160,165,186', 0.05, 0.42);
      araucaria(g, rnd, 300, 560, 540, '#191e28', 1);
      leafy(g, rnd, 1390, 400, 190, 220, '#141920', 160);
      leafy(g, rnd, 200, 470, 150, 170, '#141920', 120);
      mansion(g, rnd);
      shade(g, '#4c5a78', 0.4);
      light(g, 950, 375, 180, '255,175,95', 0.6);
      light(g, 950, 375, 420, '255,160,80', 0.2);
      // muro, pilares e portão
      g.fillStyle = lin(g, 0, 640, 0, 740, [[0, '#59606a'], [1, '#2d3238']]);
      g.fillRect(250, 646, 450, 80);
      g.fillRect(900, 646, 450, 80);
      g.fillStyle = '#3e434a';
      g.fillRect(244, 640, 462, 10);
      g.fillRect(894, 640, 462, 10);
      for (const px of [672, 900]) {
        g.fillStyle = lin(g, px, 0, px + 30, 0, [[0, '#6d737b'], [1, '#3b4047']]);
        g.fillRect(px, 560, 30, 180);
        g.fillStyle = '#4a4f56';
        g.fillRect(px - 5, 552, 40, 12);
        ell(g, px + 15, 544, 12, 10);
        g.fill();
      }
      g.strokeStyle = '#0d0f12';
      g.fillStyle = '#0d0f12';
      g.lineWidth = 4;
      for (let x = 712; x <= 888; x += 16) {
        const sh = x > 800 ? (x - 800) * 0.06 : 0;
        line(g, x, 610 + sh, x, 740);
        g.beginPath();
        g.moveTo(x - 5, 612 + sh);
        g.lineTo(x, 596 + sh);
        g.lineTo(x + 5, 612 + sh);
        g.fill();
      }
      g.lineWidth = 3;
      line(g, 702, 640, 898, 646);
      line(g, 702, 700, 898, 704);
      g.beginPath();
      g.moveTo(702, 610);
      g.quadraticCurveTo(800, 548, 898, 610);
      g.stroke();
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.arc(740 + i * 30, 618 - Math.sin((i / 4) * Math.PI) * 18, 9, 0, TAU);
        g.stroke();
      }
      hydrangea(g, rnd, 340, 655, 80, ['70,100,170', '90,120,190', '120,110,180', '60,80,140'], 0.3);
      hydrangea(g, rnd, 520, 668, 70, ['70,100,170', '100,90,170', '60,80,140'], 0.3);
      hydrangea(g, rnd, 1080, 668, 76, ['70,100,170', '90,120,190', '60,80,140'], 0.3);
      hydrangea(g, rnd, 1270, 655, 84, ['80,110,180', '120,110,180', '60,80,140'], 0.3);
      grassEdge(g, rnd, [0, 740, 1600, 740], '#161d1c', 500, 24);
      vg(g, 0, 726, W, H, [[0, '#12171a'], [1, '#0a0d0f']]);
      band(g, 690, 130, '150,160,185', 0.3);
    },
    prep(st) {
      st.fog1 = fogTex(31, 240, 40, '150,158,182', 100, 260);
      st.fog2 = fogTex(32, 220, 40, '165,172,195', 110, 260);
    },
    anim(ctx, t, o, st) {
      drawFog(ctx, st.fog1, 250, 190, t, 4, 0.45);
      const f = fl(t * 5.5);
      glow(ctx, 950, 375, 70, '255,190,110', 0.18 + 0.18 * f);
      glow(ctx, 950, 380, 260, '255,150,70', 0.05 + 0.06 * f);
      drawFog(ctx, st.fog2, 600, 240, t, -8, 0.55);
    },
  };

  // ---------------------------------------------------------------- sala
  function damask(g, rnd, x0, y0, x1, y1, rgba) {
    g.save();
    g.fillStyle = rgba;
    for (let y = y0; y < y1; y += 64) {
      for (let x = x0 + ((y / 64) % 2) * 32; x < x1; x += 64) {
        ell(g, x, y, 6, 14);
        g.fill();
        ell(g, x - 10, y + 8, 5, 3, 0.6);
        g.fill();
        ell(g, x + 10, y + 8, 5, 3, -0.6);
        g.fill();
        ell(g, x, y - 18, 2.5, 2.5);
        g.fill();
      }
    }
    g.restore();
  }
  const SALA_CANDLES = [[225, 300, 0], [260, 286, 1], [295, 300, 2], [1086, 322, 3], [1108, 310, 4], [1130, 300, 5], [1152, 310, 6], [1174, 322, 7]];
  SCENES.sala = {
    brush: { n: 16000, len: [6, 18], width: [2, 4], alpha: 0.22, ang: Math.PI / 2, spread: 0.6, smear: 6 },
    build(g, rnd, o) {
      vg(g, 0, 0, W, H, [[0, '#2c1a1e'], [0.6, '#3a2426'], [1, '#1a0f10']]);
      damask(g, rnd, 0, 60, W, 560, 'rgba(120,70,60,0.18)');
      for (let i = 0; i < 6; i++) soft(g, rnd() * W, 60 + rnd() * 120, 40 + rnd() * 80, 'rgba(110,90,70,0.3)', 0.8);
      g.fillStyle = '#1b100c';
      g.fillRect(0, 0, W, 44);
      g.fillStyle = 'rgba(160,120,70,0.3)';
      g.fillRect(0, 44, W, 3);
      g.fillStyle = '#1d110d';
      g.fillRect(0, 560, W, 220);
      g.strokeStyle = 'rgba(0,0,0,0.45)';
      g.lineWidth = 3;
      for (let x = 30; x < W; x += 150) g.strokeRect(x, 580, 120, 160);
      // janela e cortinas
      vg(g, 780, 110, 260, 610, [[0, '#18263f'], [1, '#22324e']]);
      light(g, 905, 220, 160, '190,210,255', 0.4);
      g.fillStyle = '#e8eef8';
      ell(g, 920, 200, 22, 22);
      g.fill();
      const curtain = (x0, x1) => {
        g.fillStyle = '#4a0f18';
        g.fillRect(x0, 96, x1 - x0, 560);
        for (let x = x0; x < x1; x += 22) {
          g.fillStyle = lin(g, x, 0, x + 22, 0, [[0, 'rgba(0,0,0,0.45)'], [0.5, 'rgba(255,120,120,0.12)'], [1, 'rgba(0,0,0,0.45)']]);
          g.fillRect(x, 96, 22, 560);
        }
      };
      curtain(716, 852);
      curtain(966, 1102);
      g.fillStyle = '#3d0c14';
      g.beginPath();
      g.moveTo(700, 80);
      g.lineTo(1118, 80);
      g.lineTo(1118, 140);
      for (let i = 0; i <= 4; i++) g.quadraticCurveTo(1118 - i * 104.5 - 52, 190, 1118 - (i + 1) * 104.5, 140);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(200,160,80,0.5)';
      g.fillRect(700, 78, 418, 5);
      // retratos
      frameGilt(g, 440, 112, 120, 172, true);
      portraitBust(g, 500, 182, 1.15, '#3a2a22');
      frameGilt(g, 1160, 120, 140, 180, false);
      portraitBust(g, 1230, 190, 1.2, '#2e2420');
      frameGilt(g, 1340, 150, 130, 150, false);
      g.fillStyle = '#20251c';
      g.fillRect(1356, 166, 98, 118);
      // piano
      g.fillStyle = lin(g, 170, 0, 630, 0, [[0, '#2a1610'], [0.5, '#1c0e0a'], [1, '#0e0705']]);
      g.fillRect(176, 330, 450, 430);
      g.fillStyle = '#2e1a12';
      g.fillRect(160, 318, 482, 18);
      g.fillStyle = 'rgba(200,140,90,0.25)';
      g.fillRect(160, 318, 482, 2);
      g.strokeStyle = 'rgba(160,110,70,0.25)';
      g.lineWidth = 2;
      g.strokeRect(200, 360, 400, 150);
      g.strokeRect(220, 380, 360, 110);
      g.fillStyle = '#d9cfb4';
      g.save();
      g.translate(400, 432);
      g.rotate(-0.04);
      g.fillRect(-70, -36, 140, 70);
      g.strokeStyle = 'rgba(40,30,20,0.6)';
      g.lineWidth = 1;
      for (let k = 0; k < 5; k++) for (let l = 0; l < 5; l++) line(g, -60, -26 + k * 12 + l * 2, 60, -26 + k * 12 + l * 2);
      g.fillStyle = 'rgba(40,30,20,0.7)';
      for (let k = 0; k < 18; k++) { ell(g, -58 + rnd() * 116, -26 + ((rnd() * 5) | 0) * 12 + 4, 2.5, 2); g.fill(); }
      g.restore();
      g.fillStyle = '#120906';
      g.fillRect(170, 532, 462, 16);
      g.fillStyle = '#d6c9a2';
      g.fillRect(186, 548, 430, 30);
      g.strokeStyle = 'rgba(80,60,40,0.6)';
      g.lineWidth = 1;
      for (let x = 186; x <= 616; x += 13.4) line(g, x, 548, x, 578);
      g.fillStyle = '#0a0606';
      for (let i = 0; i < 32; i++) {
        const m = i % 7;
        if (m === 2 || m === 6) continue;
        g.fillRect(186 + i * 13.4 + 9, 548, 8, 18);
      }
      g.fillStyle = '#1a0d08';
      g.fillRect(180, 578, 446, 182);
      g.fillStyle = '#8a6a32';
      g.fillRect(380, 735, 10, 22);
      g.fillRect(410, 735, 10, 22);
      // candelabro sobre o piano
      g.strokeStyle = '#8a6c36';
      g.lineWidth = 4;
      line(g, 260, 318, 260, 290);
      g.beginPath();
      g.moveTo(225, 302);
      g.quadraticCurveTo(260, 330, 295, 302);
      g.stroke();
      candleBody(g, 225, 302, 30, 9, 1);
      candleBody(g, 260, 288, 34, 9, 2);
      candleBody(g, 295, 302, 30, 9, 3);
      // candelabro de pé
      g.fillStyle = '#6e5428';
      g.fillRect(1126, 336, 8, 430);
      g.beginPath();
      g.moveTo(1100, 770);
      g.lineTo(1130, 740);
      g.lineTo(1160, 770);
      g.closePath();
      g.fill();
      g.strokeStyle = '#7a5e2e';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(1086, 324);
      g.quadraticCurveTo(1130, 372, 1174, 324);
      g.stroke();
      g.beginPath();
      g.moveTo(1108, 312);
      g.quadraticCurveTo(1130, 342, 1152, 312);
      g.stroke();
      for (const c of SALA_CANDLES.slice(3)) candleBody(g, c[0], c[1], 28, 8, 10 + c[2]);
      // móveis cobertos com lençóis
      const sheet = (pts, sh) => {
        g.fillStyle = lin(g, pts[0], 0, pts[pts.length - 2], 0, [[0, '#a7a9b2'], [1, '#5c5f6a']]);
        poly(g, pts);
        g.fill();
        g.strokeStyle = 'rgba(40,40,50,0.35)';
        g.lineWidth = 3;
        for (const s of sh) line(g, s[0], s[1], s[2], s[3]);
      };
      g.save();
      g.beginPath();
      g.moveTo(1210, 790);
      g.bezierCurveTo(1200, 640, 1240, 560, 1300, 540);
      g.bezierCurveTo(1360, 520, 1380, 600, 1420, 590);
      g.bezierCurveTo(1480, 560, 1560, 560, 1580, 640);
      g.lineTo(1600, 790);
      g.closePath();
      g.fillStyle = lin(g, 1200, 0, 1600, 0, [[0, '#9a9da8'], [1, '#4a4d58']]);
      g.fill();
      g.strokeStyle = 'rgba(30,30,40,0.35)';
      g.lineWidth = 4;
      for (let i = 0; i < 9; i++) { const x = 1230 + i * 40; line(g, x, 600 + (i % 2) * 20, x + 10, 790); }
      g.restore();
      sheet([1020, 790, 1030, 700, 1070, 660, 1110, 670, 1130, 700, 1140, 790], [[1060, 680, 1050, 790], [1100, 690, 1110, 790]]);
      // chão e tapete
      vg(g, 0, 770, W, H, [[0, '#1a0f0a'], [1, '#0c0705']]);
      g.fillStyle = '#3a1016';
      g.beginPath();
      g.moveTo(300, 900);
      g.lineTo(420, 800);
      g.lineTo(1200, 800);
      g.lineTo(1320, 900);
      g.closePath();
      g.fill();
      // luz
      if (o.escuro) {
        shade(g, '#100a12', 0.82);
        light(g, 260, 290, 360, '255,160,80', 0.42);
        light(g, 910, 230, 220, '150,170,230', 0.12);
      } else {
        shade(g, '#2a2232', 0.55);
        light(g, 260, 290, 560, '255,170,90', 0.5);
        light(g, 1130, 300, 520, '255,170,90', 0.45);
        light(g, 910, 300, 260, '150,170,230', 0.18);
        light(g, 910, 840, 220, '150,170,230', 0.12, 'screen', 0.3);
      }
    },
    anim(ctx, t, o) {
      const list = o.escuro ? [SALA_CANDLES[1]] : SALA_CANDLES;
      for (const c of list) flame(ctx, c[0], c[1] - (c[2] === 1 ? 34 : c[2] < 3 ? 30 : 28) - 5, 15, t, c[2] + 1, 0, o.escuro ? 1.2 : 0.8);
      const f = fl(t * 4);
      if (o.escuro) glow(ctx, 260, 250, 260, '255,140,60', 0.06 + 0.06 * f);
      else {
        glow(ctx, 260, 260, 320, '255,150,70', 0.04 + 0.05 * f);
        glow(ctx, 1130, 280, 320, '255,150,70', 0.04 + 0.05 * fl(t * 4.4 + 1));
      }
    },
  };

  // ---------------------------------------------------------------- quarto
  SCENES.quarto = {
    brush: { n: 16000, len: [6, 18], width: [2, 4], alpha: 0.22, ang: Math.PI / 2, spread: 0.6, smear: 6 },
    build(g, rnd, o) {
      vg(g, 0, 0, W, H, [[0, '#1d2431'], [0.6, '#262e3c'], [1, '#12151b']]);
      g.strokeStyle = 'rgba(140,150,170,0.06)';
      g.lineWidth = 10;
      for (let x = 0; x < W; x += 46) line(g, x, 0, x, 560);
      for (let i = 0; i < 20; i++) soft(g, rnd() * W, rnd() * 500, 30 + rnd() * 70, 'rgba(20,24,30,0.4)', 1.2);
      g.fillStyle = '#15100c';
      g.fillRect(0, 560, W, 30);
      // janela
      vg(g, 920, 110, 240, 590, [[0, '#0c1322'], [0.7, '#152034'], [1, '#1b2740']]);
      g.save();
      g.beginPath();
      g.rect(920, 110, 240, 480);
      g.clip();
      leafy(g, rnd, 980, 420, 90, 140, '#070b12', 60);
      leafy(g, rnd, 1130, 360, 70, 160, '#080c14', 50);
      g.fillStyle = 'rgba(200,215,240,0.32)';
      for (let i = 0; i < 260; i++) { ell(g, 922 + rnd() * 236, 112 + rnd() * 476, 0.8 + rnd() * 1.6, 1 + rnd() * 2.4); g.fill(); }
      g.restore();
      g.fillStyle = '#1a120c';
      g.fillRect(908, 98, 264, 14);
      g.fillRect(908, 588, 264, 16);
      g.fillRect(908, 98, 14, 506);
      g.fillRect(1158, 98, 14, 506);
      g.fillRect(1034, 110, 12, 480);
      g.fillRect(920, 340, 240, 10);
      g.fillStyle = '#2d4660';
      poly(g, [908, 104, 860, 130, 860, 580, 908, 600]);
      g.fill();
      poly(g, [1172, 104, 1220, 130, 1220, 580, 1172, 600]);
      g.fill();
      g.fillStyle = 'rgba(0,0,0,0.3)';
      for (let s = 140; s < 580; s += 12) { g.fillRect(864, s, 40, 3); g.fillRect(1176, s, 40, 3); }
      // oratório
      g.fillStyle = '#3a2414';
      poly(g, [80, 420, 80, 262, 140, 220, 200, 262, 200, 420]);
      g.fill();
      g.fillStyle = '#120a06';
      g.fillRect(94, 272, 92, 132);
      g.fillStyle = '#4a2e18';
      g.fillRect(62, 272, 30, 132);
      g.fillRect(188, 272, 30, 132);
      for (const [sx, c] of [[120, '#3b5d86'], [160, '#7a6a58']]) {
        g.fillStyle = c;
        g.beginPath();
        g.moveTo(sx - 11, 400);
        g.quadraticCurveTo(sx - 10, 352, sx, 344);
        g.quadraticCurveTo(sx + 10, 352, sx + 11, 400);
        g.closePath();
        g.fill();
        g.fillStyle = '#b89a80';
        ell(g, sx, 338, 6, 7);
        g.fill();
      }
      g.fillStyle = '#7a1018';
      g.fillRect(132, 386, 16, 18);
      // crucifixo
      g.fillStyle = '#2a1a10';
      g.fillRect(486, 196, 8, 56);
      g.fillRect(472, 212, 36, 7);
      // cama
      g.fillStyle = lin(g, 220, 0, 760, 0, [[0, '#2f1d12'], [1, '#160d07']]);
      g.beginPath();
      g.moveTo(232, 520);
      g.lineTo(232, 336);
      g.bezierCurveTo(330, 330, 380, 268, 490, 270);
      g.bezierCurveTo(600, 268, 650, 330, 748, 336);
      g.lineTo(748, 520);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(170,120,70,0.25)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(262, 500);
      g.lineTo(262, 352);
      g.bezierCurveTo(350, 346, 390, 296, 490, 298);
      g.bezierCurveTo(590, 296, 630, 346, 718, 352);
      g.lineTo(718, 500);
      g.stroke();
      for (const px of [220, 742]) {
        g.fillStyle = '#24160d';
        g.fillRect(px, 262, 22, 520);
        ell(g, px + 11, 256, 14, 14);
        g.fill();
      }
      g.fillStyle = '#c3c8d0';
      g.beginPath();
      g.moveTo(196, 780);
      g.lineTo(206, 500);
      g.lineTo(770, 500);
      g.lineTo(800, 780);
      g.closePath();
      g.fill();
      g.fillStyle = '#d5d9e0';
      rrect(g, 262, 470, 170, 64, 24);
      g.fill();
      rrect(g, 548, 470, 170, 64, 24);
      g.fill();
      g.fillStyle = '#5a3b40';
      g.beginPath();
      g.moveTo(186, 790);
      g.lineTo(200, 600);
      g.bezierCurveTo(400, 580, 600, 590, 786, 600);
      g.lineTo(812, 790);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)';
      g.lineWidth = 4;
      for (let i = 0; i < 7; i++) line(g, 250 + i * 80, 600, 230 + i * 86, 790);
      // criado-mudo e lamparina
      g.fillStyle = '#2a190e';
      g.fillRect(806, 520, 100, 180);
      g.fillStyle = '#3a2414';
      g.fillRect(800, 512, 112, 12);
      g.fillStyle = '#6e5634';
      g.beginPath();
      g.moveTo(836, 512);
      g.lineTo(842, 496);
      g.lineTo(870, 496);
      g.lineTo(876, 512);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(220,230,235,0.25)';
      g.beginPath();
      g.moveTo(844, 496);
      g.quadraticCurveTo(836, 470, 848, 440);
      g.lineTo(864, 440);
      g.quadraticCurveTo(876, 470, 868, 496);
      g.closePath();
      g.fill();
      // guarda-roupa
      g.fillStyle = lin(g, 1240, 0, 1540, 0, [[0, '#2a190e'], [1, '#120a05']]);
      g.fillRect(1250, 150, 290, 620);
      g.fillStyle = '#20140b';
      g.beginPath();
      g.moveTo(1232, 158);
      g.lineTo(1240, 120);
      g.quadraticCurveTo(1395, 70, 1550, 120);
      g.lineTo(1558, 158);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(150,100,60,0.25)';
      g.lineWidth = 3;
      g.strokeRect(1270, 180, 118, 540);
      g.strokeRect(1402, 180, 118, 540);
      g.fillStyle = '#050302';
      g.fillRect(1393, 176, 9, 548);
      g.fillStyle = 'rgba(200,160,90,0.6)';
      ell(g, 1384, 450, 3, 4);
      g.fill();
      vg(g, 0, 780, W, H, [[0, '#130d09'], [1, '#080605']]);
      // feixe de luz fria da janela
      g.save();
      g.globalCompositeOperation = 'screen';
      g.fillStyle = lin(g, 1040, 590, 900, 900, [[0, 'rgba(130,160,220,0.22)'], [1, 'rgba(130,160,220,0)']]);
      poly(g, [920, 590, 1160, 590, 1120, 900, 700, 900]);
      g.fill();
      g.restore();
      if (o.escuro) {
        shade(g, '#0c0f18', 0.8);
        light(g, 1040, 340, 420, '140,170,230', 0.35);
        light(g, 960, 760, 300, '140,170,230', 0.16, 'screen', 0.4);
      } else {
        shade(g, '#2a2c3c', 0.55);
        light(g, 856, 470, 560, '255,170,90', 0.5);
        light(g, 1040, 340, 380, '140,170,230', 0.22);
        light(g, 140, 395, 90, '255,70,50', 0.4);
      }
    },
    prep(st, o, rnd) {
      st.drops = [];
      for (let i = 0; i < 40; i++) st.drops.push({ x: 924 + rnd() * 232, ph: rnd(), sp: 0.4 + rnd() * 0.9, l: 10 + rnd() * 18 });
    },
    anim(ctx, t, o, st) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(920, 110, 240, 480);
      ctx.clip();
      ctx.strokeStyle = 'rgba(200,215,245,0.3)';
      ctx.lineWidth = 1.2;
      for (const d of st.drops) {
        const y = 100 + (((t * d.sp * 0.55 + d.ph) % 1) * 520);
        line(ctx, d.x, y, d.x - 1.5, y + d.l);
      }
      ctx.restore();
      if (!o.escuro) {
        flame(ctx, 856, 478, 16, t, 3, 0, 0.9);
        glow(ctx, 856, 470, 300, '255,150,70', 0.04 + 0.05 * fl(t * 4.2));
      }
      glow(ctx, 140, 392, 40, '255,80,50', 0.12 + 0.1 * fl(t * 6 + 1));
    },
  };

  // ---------------------------------------------------------------- corredor
  const VP = { x: 800, y: 380 };
  const P = (X, Y, z) => [VP.x + X / z, VP.y - Y / z];
  SCENES.corredor = {
    brush: { n: 15000, len: [6, 16], width: [2, 4], alpha: 0.22, ang: Math.PI / 2, spread: 0.6, smear: 6 },
    build(g, rnd, o) {
      const Z = 4, XW = 800, YC = 380, YF = -520;
      const q = (pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
      // teto
      q([P(-XW, YC, 1), P(XW, YC, 1), P(XW, YC, Z), P(-XW, YC, Z)]);
      g.fillStyle = '#120d0c';
      g.fill();
      g.strokeStyle = '#1d1512';
      g.lineWidth = 12;
      for (let z = 1.2; z < Z; z *= 1.32) { const a = P(-XW, YC, z), b = P(XW, YC, z); line(g, a[0], a[1], b[0], b[1]); }
      // paredes
      for (const s of [-1, 1]) {
        q([P(s * XW, YC, 1), P(s * XW, YF, 1), P(s * XW, YF, Z), P(s * XW, YC, Z)]);
        g.fillStyle = s < 0 ? '#2e2420' : '#271e1b';
        g.fill();
        g.save();
        g.clip();
        g.strokeStyle = 'rgba(90,60,50,0.25)';
        g.lineWidth = 2;
        for (let z = 1; z < Z; z *= 1.06) { const a = P(s * XW, YC, z), b = P(s * XW, -200, z); line(g, a[0], a[1], b[0], b[1]); }
        g.fillStyle = '#1a110d';
        q([P(s * XW, -200, 1), P(s * XW, YF, 1), P(s * XW, YF, Z), P(s * XW, -200, Z)]);
        g.fill();
        g.restore();
      }
      // chão
      q([P(-XW, YF, 1), P(XW, YF, 1), P(XW, YF, Z), P(-XW, YF, Z)]);
      g.fillStyle = '#24170f';
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.45)';
      g.lineWidth = 2;
      for (let X = -XW; X <= XW; X += 100) { const a = P(X, YF, 1), b = P(X, YF, Z); line(g, a[0], a[1], b[0], b[1]); }
      for (let X = -XW; X < XW; X += 100) {
        for (let z = 1 + rnd() * 0.5; z < Z; z += 0.5 + rnd() * 0.8) { const a = P(X, YF, z), b = P(X + 100, YF, z); line(g, a[0], a[1], b[0], b[1]); }
      }
      q([P(-260, YF, 1), P(260, YF, 1), P(260, YF, Z), P(-260, YF, Z)]);
      g.fillStyle = '#3a1218';
      g.fill();
      g.strokeStyle = 'rgba(180,140,80,0.25)';
      g.lineWidth = 3;
      for (const X of [-220, 220]) { const a = P(X, YF, 1), b = P(X, YF, Z); line(g, a[0], a[1], b[0], b[1]); }
      // portas
      for (const s of [-1, 1]) {
        for (const [z1, z2] of [[1.35, 1.8], [2.35, 2.75]]) {
          q([P(s * XW, YF, z1), P(s * XW, 230, z1), P(s * XW, 230, z2), P(s * XW, YF, z2)]);
          g.fillStyle = '#3a281c';
          g.fill();
          const m = 0.06;
          q([P(s * XW, YF, z1 + m), P(s * XW, 200, z1 + m), P(s * XW, 200, z2 - m), P(s * XW, YF, z2 - m)]);
          g.fillStyle = '#180f0a';
          g.fill();
          const kn = P(s * XW, -120, z2 - 0.1);
          g.fillStyle = 'rgba(210,170,100,0.6)';
          ell(g, kn[0], kn[1], 4 / z2 * 1.6, 4 / z2 * 1.6);
          g.fill();
        }
      }
      // parede do fundo e espelho
      const a = P(-XW, YC, Z), b = P(XW, YF, Z);
      g.fillStyle = '#2a201c';
      g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      damask(g, rnd, a[0], a[1] + 10, b[0], b[1] - 60, 'rgba(110,70,55,0.15)');
      const mx = 744, mw = 112, my = 300, mh = 196;
      g.fillStyle = lin(g, mx - 12, my, mx + mw + 12, my + mh, [[0, '#7a6438'], [0.5, '#4a3a20'], [1, '#6b5530']]);
      arch(g, mx - 12, my - 14, mw + 24, mh + 26);
      g.fill();
      arch(g, mx, my, mw, mh);
      g.fillStyle = lin(g, 0, my, 0, my + mh, [[0, '#262a30'], [1, '#14161a']]);
      g.fill();
      g.save();
      arch(g, mx, my, mw, mh);
      g.clip();
      const mvx = mx + mw / 2, mvy = my + mh * 0.42;
      g.fillStyle = 'rgba(70,55,45,0.5)';
      poly(g, [mx, my + mh, mvx - 14, mvy + 18, mvx + 14, mvy + 18, mx + mw, my + mh]);
      g.fill();
      g.fillStyle = 'rgba(40,30,28,0.6)';
      poly(g, [mx, my, mvx - 14, mvy - 14, mvx - 14, mvy + 18, mx, my + mh]);
      g.fill();
      poly(g, [mx + mw, my, mvx + 14, mvy - 14, mvx + 14, mvy + 18, mx + mw, my + mh]);
      g.fill();
      for (let i = 0; i < 26; i++) soft(g, mx + rnd() * mw, my + rnd() * mh, 6 + rnd() * 16, 'rgba(140,130,110,0.18)');
      light(g, mvx - 20, my + 40, 60, '200,210,230', 0.2);
      g.restore();
      g.fillStyle = '#2a1e14';
      g.fillRect(mx - 18, my + mh + 10, mw + 36, 10);
      // arandelas
      for (const s of [-1, 1]) {
        for (const z of [1.18, 2.05, 3.05]) {
          const p = P(s * XW, 60, z);
          const sc = 1 / z;
          g.fillStyle = '#5a4524';
          g.fillRect(p[0] - 14 * sc * -s, p[1] + 6 * sc, 26 * sc * -s, 6 * sc);
          candleBody(g, p[0] + 14 * sc * -s, p[1] + 6 * sc, 40 * sc, 11 * sc, (z * 10) | 0);
        }
      }
      shade(g, '#18121a', 0.6);
      for (const s of [-1, 1]) {
        for (const z of [1.18, 2.05, 3.05]) {
          const p = P(s * XW, 60, z);
          light(g, p[0], p[1], 360 / z, '255,160,80', 0.5);
          const f = P(s * XW * 0.6, YF, z);
          light(g, f[0], f[1], 260 / z, '255,150,70', 0.18, 'screen', 0.35);
        }
      }
      light(g, 800, 400, 160, '255,170,100', 0.12);
    },
    anim(ctx, t, o) {
      const XW = 800;
      for (const s of [-1, 1]) {
        let i = 0;
        for (const z of [1.18, 2.05, 3.05]) {
          const p = P(s * XW, 60, z), sc = 1 / z;
          flame(ctx, p[0] + 14 * sc * -s, p[1] + 6 * sc - 40 * sc - 4 * sc, 20 * sc, t, i * 2 + (s > 0 ? 1 : 0), 0, 1);
          i++;
        }
      }
      if (o.vulto) {
        const mx = 744, mw = 112, my = 300, mh = 196;
        const a = 0.35 + 0.2 * fl(t * 0.8);
        ctx.save();
        arch(ctx, mx, my, mw, mh);
        ctx.clip();
        const sx = mx + mw / 2 + Math.sin(t * 0.5) * 3, top = my + 30;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#050406';
        ell(ctx, sx, top + 14, 9, 15);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx - 9, top + 30);
        ctx.quadraticCurveTo(sx - 26, top + 40, sx - 22, my + mh);
        ctx.lineTo(sx + 22, my + mh);
        ctx.quadraticCurveTo(sx + 26, top + 40, sx + 9, top + 30);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#050406';
        ctx.lineWidth = 3;
        line(ctx, sx - 22, top + 50, sx - 30, top + 120);
        line(ctx, sx + 22, top + 50, sx + 30, top + 120);
        ctx.globalAlpha = 1;
        glow(ctx, sx - 3.5, top + 12, 5, '220,230,255', a * 0.9);
        glow(ctx, sx + 3.5, top + 12, 5, '220,230,255', a * 0.9);
        ctx.restore();
      }
    },
  };

  // ---------------------------------------------------------------- porão
  const PORAO_X = [640, 693, 746, 800, 854, 907, 960];
  const PORAO_H = [44, 58, 36, 64, 40, 52, 38];
  const PORAO_ORDER = [6, 1, 4, 0, 5, 2, 3]; // ordem em que se apagam
  function poraoLit(n) {
    const off = new Set(PORAO_ORDER.slice(0, 7 - clamp(n, 0, 7)));
    return PORAO_X.map((_, i) => !off.has(i));
  }
  function chainLink(g, x, y, ang, s) {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.strokeStyle = '#2a2622';
    g.lineWidth = 4 * s;
    ell(g, 0, 0, 9 * s, 5 * s);
    g.stroke();
    g.strokeStyle = 'rgba(200,170,120,0.25)';
    g.lineWidth = 1.2 * s;
    g.beginPath();
    g.ellipse(0, 0, 9 * s, 5 * s, 0, Math.PI * 1.1, Math.PI * 1.7);
    g.stroke();
    g.restore();
  }
  function chain(g, x0, y0, x1, y1, sag) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 14);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = lerp(x0, x1, u), y = lerp(y0, y1, u) + Math.sin(u * Math.PI) * sag;
      const u2 = Math.min(1, u + 0.01);
      const ang = Math.atan2(lerp(y0, y1, u2) + Math.sin(u2 * Math.PI) * sag - y, lerp(x0, x1, u2) - x) + (i % 2 ? Math.PI / 2 * 0.0 : 0);
      chainLink(g, x, y, ang + (i % 2 ? 0 : 0), i % 2 ? 0.7 : 1);
    }
  }
  SCENES.porao = {
    brush: { n: 15000, len: [6, 16], width: [2, 4], alpha: 0.22, ang: 0, spread: 1.2, smear: 6 },
    build(g, rnd, o) {
      const velas = o.velas == null ? 7 : clamp(o.velas | 0, 0, 7);
      const k = velas / 7;
      g.fillStyle = '#0b0c10';
      g.fillRect(0, 0, W, H);
      // paredes laterais de pedra (em perspectiva simplificada)
      g.save();
      poly(g, [0, 0, 650, 180, 650, 640, 0, 900]);
      g.clip();
      stoneWall(g, rnd, 0, 0, 660, 900, [44, 42, 44], 18, '#141416');
      vg(g, 0, 0, 660, 900, [[0, 'rgba(0,0,0,0.2)'], [1, 'rgba(0,0,0,0.4)']]);
      g.fillStyle = lin(g, 0, 0, 650, 0, [[0, 'rgba(0,0,0,0.65)'], [1, 'rgba(0,0,0,0)']]);
      g.fillRect(0, 0, 660, 900);
      g.restore();
      g.save();
      poly(g, [1600, 0, 950, 180, 950, 640, 1600, 900]);
      g.clip();
      stoneWall(g, rnd, 940, 0, 1600, 900, [40, 39, 42], 18, '#121214');
      g.fillStyle = lin(g, 950, 0, 1600, 0, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.7)']]);
      g.fillRect(940, 0, 660, 900);
      g.restore();
      // abóbada
      g.fillStyle = '#08090c';
      poly(g, [0, 0, 1600, 0, 950, 180, 650, 180]);
      g.fill();
      // parede do fundo
      stoneWall(g, rnd, 650, 180, 950, 640, [52, 48, 46], 16, '#18171a');
      // degraus (descendo em direção ao espectador)
      for (let i = 0; i < 7; i++) {
        const y = 640 + 260 * Math.pow(i / 6, 1.5);
        const w2 = lerp(150, 800, Math.pow(i / 6, 1.2));
        g.fillStyle = `rgb(${34 - i * 2},${33 - i * 2},${36 - i * 2})`;
        g.fillRect(800 - w2, y, w2 * 2, 300);
        g.fillStyle = 'rgba(200,170,120,0.12)';
        g.fillRect(800 - w2, y, w2 * 2, 3);
      }
      // símbolos riscados
      g.strokeStyle = 'rgba(210,200,180,0.22)';
      g.lineWidth = 2;
      const sym = [[560, 300], [1030, 330], [600, 470], [1000, 470], [700, 210], [900, 205]];
      for (const [sx, sy] of sym) {
        line(g, sx, sy - 18, sx, sy + 18);
        line(g, sx - 10, sy - 6, sx + 10, sy - 6);
        ell(g, sx, sy, 24, 24);
        g.stroke();
      }
      for (let i = 0; i < 7; i++) line(g, 600 + i * 7, 560, 600 + i * 7, 590);
      line(g, 596, 575, 650, 572);
      // portada
      g.fillStyle = '#3c3936';
      arch(g, 662, 196, 276, 444);
      g.fill();
      if (o.aberta) {
        arch(g, 680, 214, 240, 426);
        g.fillStyle = '#010102';
        g.fill();
        g.fillStyle = lin(g, 680, 0, 760, 0, [[0, '#3a2516'], [1, '#1c120a']]);
        poly(g, [680, 260, 748, 238, 748, 632, 680, 640]);
        g.fill();
        g.strokeStyle = '#141210';
        g.lineWidth = 6;
        for (const yy of [300, 450, 590]) line(g, 680, yy, 748, yy - 10);
      } else {
        arch(g, 680, 214, 240, 426);
        g.fillStyle = lin(g, 680, 0, 920, 0, [[0, '#3e2817'], [0.5, '#2c1c10'], [1, '#1c120a']]);
        g.fill();
        g.save();
        g.clip();
        g.strokeStyle = 'rgba(0,0,0,0.5)';
        g.lineWidth = 3;
        for (let x = 710; x < 920; x += 34) line(g, x, 214, x, 640);
        g.fillStyle = '#17140f';
        for (const yy of [300, 450, 590]) {
          g.fillRect(680, yy, 240, 16);
          g.fillStyle = 'rgba(180,140,90,0.3)';
          for (let x = 690; x < 920; x += 26) { ell(g, x, yy + 8, 3, 3); g.fill(); }
          g.fillStyle = '#17140f';
        }
        g.restore();
        chain(g, 690, 250, 912, 560, 30);
        chain(g, 912, 250, 690, 560, 30);
        g.fillStyle = lin(g, 770, 0, 830, 0, [[0, '#4a4036'], [1, '#1c1814']]);
        rrect(g, 772, 412, 56, 62, 8);
        g.fill();
        g.strokeStyle = '#2a2420';
        g.lineWidth = 8;
        g.beginPath();
        g.arc(800, 412, 18, Math.PI, 0);
        g.stroke();
        g.fillStyle = '#050403';
        ell(g, 800, 436, 6, 6);
        g.fill();
        g.fillRect(797, 438, 6, 16);
      }
      // parapeito e velas
      g.fillStyle = '#4a4540';
      g.fillRect(600, 560, 400, 16);
      g.fillStyle = '#2e2a27';
      g.fillRect(606, 576, 388, 34);
      g.fillStyle = 'rgba(240,230,205,0.85)';
      for (let i = 0; i < 26; i++) {
        const x = 608 + rnd() * 384, l = 6 + rnd() * 26;
        rrect(g, x, 574, 3 + rnd() * 3, l, 2);
        g.fill();
      }
      const lit = poraoLit(velas);
      PORAO_X.forEach((x, i) => {
        candleBody(g, x, 562, PORAO_H[i], 13, 40 + i);
        if (!lit[i]) { g.fillStyle = '#0a0806'; g.fillRect(x - 1, 562 - PORAO_H[i] - 6, 2, 6); }
      });
      if (o.aberta) {
        for (let i = 0; i < 4; i++) chain(g, 640 + i * 70, 640 + rnd() * 30, 760 + i * 60, 650 + rnd() * 40, 10);
      }
      shade(g, '#0d1220', 0.55 + (1 - k) * 0.35);
      light(g, 800, 520, 560 * (0.35 + 0.65 * k), '255,160,80', 0.18 + 0.5 * k);
      light(g, 800, 600, 300, '255,150,70', 0.25 * k, 'screen', 0.4);
      light(g, 800, 60, 700, '70,90,150', 0.18);
    },
    anim(ctx, t, o) {
      const velas = o.velas == null ? 7 : clamp(o.velas | 0, 0, 7);
      const lit = poraoLit(velas);
      let n = 0;
      PORAO_X.forEach((x, i) => {
        const top = 562 - PORAO_H[i] - 5;
        if (lit[i]) { flame(ctx, x, top, 17, t, i + 1, 0, 0.9); n++; }
        else smokeCurl(ctx, x, top, t, i * 1.7, 80);
      });
      glow(ctx, 800, 500, 380, '255,140,60', (0.03 + 0.05 * fl(t * 3.7)) * (n / 7));
      if (o.aberta) {
        const blink = (t % 6) > 5.82 ? 0 : 1;
        const a = (0.45 + 0.25 * fl(t * 1.3)) * blink;
        glow(ctx, 838, 338, 9, '220,232,255', a);
        glow(ctx, 862, 338, 9, '220,232,255', a);
        ctx.fillStyle = `rgba(235,240,255,${a * 0.8})`;
        ell(ctx, 838, 338, 3.2, 1.5);
        ctx.fill();
        ell(ctx, 862, 338, 3.2, 1.5);
        ctx.fill();
      }
    },
  };

  // ---------------------------------------------------------------- jardim
  SCENES.jardim = {
    brush: { n: 15000, len: [6, 18], width: [2, 4], alpha: 0.2, ang: Math.PI / 2, spread: 0.8, smear: 6 },
    build(g, rnd) {
      vg(g, 0, 0, W, H, [[0, '#060a16'], [0.35, '#101c33'], [0.55, '#1e2e48'], [0.7, '#14202c'], [1, '#0a1012']]);
      for (let i = 0; i < 220; i++) {
        const x = rnd() * W, y = rnd() * 380, r = rnd() < 0.08 ? 1.6 : 0.8;
        g.fillStyle = `rgba(220,230,255,${0.3 + rnd() * 0.6})`;
        ell(g, x, y, r, r);
        g.fill();
      }
      light(g, 1220, 150, 420, '170,190,240', 0.3);
      g.fillStyle = '#e9edf4';
      ell(g, 1220, 150, 46, 46);
      g.fill();
      for (let i = 0; i < 6; i++) soft(g, 1206 + rnd() * 30, 136 + rnd() * 30, 6 + rnd() * 10, 'rgba(150,160,180,0.35)');
      clouds(g, rnd, 12, 80, 260, ['30,40,64', '120,135,170']);
      // casa ao fundo à esquerda
      g.fillStyle = '#0d121c';
      poly(g, [0, 640, 0, 270, 70, 230, 460, 230, 520, 270, 520, 640]);
      g.fill();
      g.fillStyle = '#121928';
      for (const [x, y] of [[90, 320], [210, 320], [330, 320], [90, 470], [210, 470]]) g.fillRect(x, y, 44, 76);
      g.fillStyle = '#ffbb6e';
      g.fillRect(332, 470, 40, 74);
      light(g, 352, 506, 120, '255,170,90', 0.5);
      // árvores
      leafy(g, rnd, 1470, 330, 200, 250, '#070c12', 200);
      leafy(g, rnd, 600, 330, 180, 120, '#0b131b', 120);
      // chão
      vg(g, 0, 560, W, H, [[0, '#111c1d'], [1, '#070b0c']]);
      grassEdge(g, rnd, [0, 566, 1600, 566], '#18262a', 600, 20);
      // caminho de pedras
      for (let i = 0; i < 12; i++) {
        const u = i / 11, y = lerp(900, 620, Math.pow(u, 0.8)), s = lerp(1, 0.25, u);
        g.fillStyle = `rgba(${120 - u * 40},${130 - u * 40},${150 - u * 40},0.55)`;
        ell(g, 800 + Math.sin(u * 3) * 40 * s, y, 70 * s, 18 * s);
        g.fill();
      }
      // coreto
      const cx = 800;
      g.fillStyle = '#7d8696';
      ell(g, cx, 610, 190, 26);
      g.fill();
      g.fillStyle = '#9aa3b3';
      g.fillRect(cx - 190, 596, 380, 14);
      g.fillStyle = '#0c1018';
      g.fillRect(cx - 160, 440, 320, 156);
      const posts = [-160, -88, -30, 30, 88, 160];
      for (const px of posts) {
        g.fillStyle = lin(g, cx + px - 7, 0, cx + px + 7, 0, [[0, '#6c7584'], [0.5, '#d4dbe6'], [1, '#8a93a2']]);
        g.fillRect(cx + px - 7, 440, 14, 160);
      }
      g.strokeStyle = '#b8c0cd';
      g.lineWidth = 4;
      line(g, cx - 160, 530, cx + 160, 530);
      line(g, cx - 160, 588, cx + 160, 588);
      g.lineWidth = 2;
      for (let x = cx - 156; x < cx + 160; x += 10) line(g, x, 532, x, 588);
      g.fillStyle = lin(g, cx - 200, 0, cx + 200, 0, [[0, '#59616f'], [0.6, '#c6cedb'], [1, '#7c8594']]);
      g.beginPath();
      g.moveTo(cx - 200, 446);
      g.quadraticCurveTo(cx - 60, 420, cx - 20, 330);
      g.lineTo(cx, 300);
      g.lineTo(cx + 20, 330);
      g.quadraticCurveTo(cx + 60, 420, cx + 200, 446);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(40,50,70,0.35)';
      g.lineWidth = 2;
      for (let i = 1; i < 8; i++) { const u = i / 8; line(g, lerp(cx - 200, cx - 12, u), lerp(446, 320, Math.pow(u, 0.6)), lerp(cx + 200, cx + 12, u), lerp(446, 320, Math.pow(u, 0.6))); }
      g.fillStyle = '#c6cedb';
      for (let x = cx - 196; x < cx + 200; x += 16) { g.beginPath(); g.arc(x + 8, 446, 8, 0, Math.PI); g.fill(); }
      g.fillRect(cx - 3, 270, 6, 32);
      ell(g, cx, 268, 7, 7);
      g.fill();
      // jasmim
      for (let i = 0; i < 380; i++) {
        const side = rnd() < 0.6 ? -1 : 1;
        const u = rnd();
        const x = side < 0 ? cx - 200 + rnd() * 120 : cx + 90 + rnd() * 110, y = 440 + u * 160 - (side < 0 && rnd() < 0.4 ? 30 : 0);
        g.fillStyle = rnd() < 0.5 ? '#14261c' : '#1d3326';
        ell(g, x, y, 6 + rnd() * 6, 3 + rnd() * 3, rnd() * TAU);
        g.fill();
        if (rnd() < 0.35) { g.fillStyle = 'rgba(240,245,255,0.85)'; ell(g, x + 2, y - 1, 1.6, 1.6); g.fill(); }
      }
      // fonte
      g.fillStyle = '#3d4844';
      ell(g, 1220, 600, 130, 28);
      g.fill();
      g.fillStyle = '#56625c';
      g.fillRect(1090, 570, 260, 30);
      ell(g, 1220, 570, 130, 22);
      g.fill();
      g.fillStyle = '#1d2a33';
      ell(g, 1220, 572, 118, 16);
      g.fill();
      g.fillStyle = '#56625c';
      g.fillRect(1210, 488, 20, 82);
      ell(g, 1220, 488, 40, 10);
      g.fill();
      for (let i = 0; i < 30; i++) soft(g, 1100 + rnd() * 240, 560 + rnd() * 50, 10 + rnd() * 20, 'rgba(50,80,40,0.45)', 0.6);
      g.strokeStyle = 'rgba(200,220,255,0.35)';
      g.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(1205 + i * 8, 490); g.quadraticCurveTo(1190 + i * 14, 500, 1185 + i * 18, 566); g.stroke(); }
      hydrangea(g, rnd, 200, 680, 150, ['60,90,170', '90,110,190', '120,110,190', '50,70,140'], 0.2);
      hydrangea(g, rnd, 1420, 720, 150, ['60,90,170', '80,100,180', '110,100,180'], -0.3);
      // galho em primeiro plano
      g.strokeStyle = '#05080b';
      g.lineWidth = 14;
      g.beginPath();
      g.moveTo(-10, 40);
      g.quadraticCurveTo(200, 70, 380, 30);
      g.stroke();
      leafy(g, rnd, 220, 50, 220, 60, '#05080b', 120);
      shade(g, '#2a3a5a', 0.4);
      light(g, 1220, 400, 700, '120,145,200', 0.12);
      light(g, 820, 420, 260, '170,190,240', 0.12);
    },
    prep(st, o, rnd) {
      st.fog = fogTex(41, 240, 40, '150,170,200', 100, 260);
      st.ff = [];
      for (let i = 0; i < 28; i++) st.ff.push({ x: 120 + rnd() * 1360, y: 380 + rnd() * 300, p: rnd() * 10, s: 0.5 + rnd() * 0.8 });
    },
    anim(ctx, t, o, st) {
      drawFog(ctx, st.fog, 540, 220, t, 6, 0.5);
      for (const f of st.ff) {
        const x = f.x + Math.sin(t * 0.31 * f.s + f.p) * 50 + Math.sin(t * 0.83 * f.s + f.p * 2) * 18;
        const y = f.y + Math.cos(t * 0.27 * f.s + f.p * 1.3) * 30 + Math.sin(t * 0.7 + f.p) * 10;
        const b = Math.pow(Math.max(0, Math.sin(t * 1.1 * f.s + f.p * 3)), 2);
        glow(ctx, x, y, 18, '200,255,120', 0.55 * b);
        ctx.fillStyle = `rgba(240,255,200,${0.9 * b})`;
        ell(ctx, x, y, 1.6, 1.6);
        ctx.fill();
      }
    },
  };

  // ---------------------------------------------------------------- escritório
  SCENES.escritorio = {
    brush: { n: 16000, len: [6, 16], width: [2, 4], alpha: 0.22, ang: Math.PI / 2, spread: 0.6, smear: 6 },
    build(g, rnd) {
      vg(g, 0, 0, W, H, [[0, '#2a1f17'], [0.6, '#33261b'], [1, '#150f0a']]);
      for (const [x0, x1] of [[0, 540], [1080, 1600]]) {
        g.fillStyle = '#1d130c';
        g.fillRect(x0, 40, x1 - x0, 600);
        for (let sy = 150; sy < 640; sy += 112) {
          books(g, rnd, x0 + 14, x1 - 14, sy, 96);
          g.fillStyle = '#2e1e12';
          g.fillRect(x0, sy, x1 - x0, 12);
          g.fillStyle = 'rgba(200,150,90,0.2)';
          g.fillRect(x0, sy, x1 - x0, 2);
        }
      }
      // janela com névoa
      vg(g, 640, 110, 320, 430, [[0, '#566173'], [1, '#353d4c']]);
      g.save();
      g.beginPath();
      g.rect(640, 110, 320, 320);
      g.clip();
      leafy(g, rnd, 700, 380, 80, 120, 'rgba(30,36,46,0.6)', 50);
      leafy(g, rnd, 920, 330, 70, 140, 'rgba(36,42,52,0.5)', 50);
      g.restore();
      g.fillStyle = '#1d130c';
      g.fillRect(628, 98, 344, 14);
      g.fillRect(628, 428, 344, 16);
      g.fillRect(628, 98, 14, 346);
      g.fillRect(958, 98, 14, 346);
      g.fillRect(794, 110, 12, 320);
      g.fillRect(640, 264, 320, 10);
      g.fillStyle = 'rgba(230,225,215,0.12)';
      for (const [x0, dir] of [[600, 1], [1000, -1]]) {
        g.beginPath();
        g.moveTo(x0, 90);
        g.lineTo(x0 + dir * 60, 90);
        g.quadraticCurveTo(x0 + dir * 40, 300, x0 + dir * 70, 470);
        g.lineTo(x0, 470);
        g.closePath();
        g.fill();
      }
      // mesa
      g.fillStyle = lin(g, 0, 520, 0, 650, [[0, '#4a2e1a'], [1, '#2e1c10']]);
      poly(g, [330, 520, 1270, 520, 1390, 650, 210, 650]);
      g.fill();
      g.fillStyle = '#20140b';
      g.fillRect(210, 650, 1180, 260);
      g.strokeStyle = 'rgba(0,0,0,0.45)';
      g.lineWidth = 3;
      g.strokeRect(260, 680, 300, 120);
      g.strokeRect(1040, 680, 300, 120);
      g.strokeStyle = 'rgba(120,80,40,0.25)';
      g.lineWidth = 2;
      for (let i = 0; i < 18; i++) { const y = 528 + rnd() * 116; line(g, 300, y, 1300, y + (rnd() - 0.5) * 4); }
      // cartas espalhadas
      for (let i = 0; i < 9; i++) {
        const x = 380 + rnd() * 300, y = 560 + rnd() * 60, a = (rnd() - 0.5) * 0.6;
        g.save();
        g.translate(x, y);
        g.rotate(a);
        g.fillStyle = `rgb(${210 + rnd() * 20},${198 + rnd() * 20},${168 + rnd() * 20})`;
        g.fillRect(-46, -30, 92, 60);
        g.strokeStyle = 'rgba(50,35,25,0.45)';
        g.lineWidth = 1;
        for (let l = -20; l < 24; l += 7) { g.beginPath(); g.moveTo(-38, l); for (let xx = -38; xx < 38; xx += 6) g.lineTo(xx, l + Math.sin(xx * 0.7 + l) * 1.2); g.stroke(); }
        g.restore();
      }
      g.save();
      g.translate(1150, 600);
      g.rotate(0.15);
      g.fillStyle = '#cbb894';
      g.fillRect(-50, -30, 100, 60);
      g.strokeStyle = 'rgba(80,60,40,0.5)';
      line(g, -50, -30, 0, 4);
      line(g, 50, -30, 0, 4);
      g.fillStyle = '#7a1a1a';
      ell(g, 0, 4, 8, 8);
      g.fill();
      g.restore();
      // diário aberto
      g.fillStyle = '#3a1e12';
      poly(g, [700, 545, 900, 545, 912, 600, 688, 600]);
      g.fill();
      g.fillStyle = '#e2d4b2';
      poly(g, [706, 540, 798, 546, 798, 594, 696, 590]);
      g.fill();
      g.fillStyle = '#d8c9a4';
      poly(g, [802, 546, 894, 540, 904, 590, 802, 594]);
      g.fill();
      g.strokeStyle = 'rgba(60,35,20,0.6)';
      g.lineWidth = 1;
      for (let l = 0; l < 6; l++) {
        g.beginPath();
        for (let xx = 712; xx < 790; xx += 4) g.lineTo(xx, 552 + l * 6.5 + Math.sin(xx * 0.9 + l * 3) * 1);
        g.stroke();
        g.beginPath();
        for (let xx = 810; xx < 888; xx += 4) g.lineTo(xx, 552 + l * 6.5 + Math.sin(xx * 0.8 + l) * 1);
        g.stroke();
      }
      g.strokeStyle = '#7a1018';
      g.lineWidth = 3;
      line(g, 800, 594, 806, 640);
      // terço
      g.fillStyle = '#3a2416';
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * TAU;
        ell(g, 980 + Math.cos(a) * 42, 590 + Math.sin(a) * 16, 3.2, 3.2);
        g.fill();
      }
      g.strokeStyle = '#3a2416';
      g.lineWidth = 2;
      line(g, 1012, 602, 1030, 630);
      g.fillStyle = '#c9a050';
      g.fillRect(1026, 628, 4, 18);
      g.fillRect(1020, 634, 16, 3);
      // porta-retratos
      for (const [px, py] of [[440, 470], [1210, 462]]) {
        g.fillStyle = '#6a4e22';
        g.fillRect(px - 32, py, 64, 80);
        g.fillStyle = '#8a6a44';
        g.fillRect(px - 24, py + 8, 48, 62);
        portraitBust(g, px, py + 34, 0.55, '#3a2a1a');
      }
      g.fillStyle = '#121010';
      g.fillRect(990, 500, 24, 26);
      g.strokeStyle = '#d8d0c0';
      g.lineWidth = 2;
      line(g, 1006, 504, 1046, 432);
      // lamparina
      g.fillStyle = '#7a5e34';
      ell(g, 1100, 524, 34, 9);
      g.fill();
      g.fillRect(1090, 494, 20, 30);
      g.fillStyle = 'rgba(220,230,235,0.28)';
      g.beginPath();
      g.moveTo(1088, 496);
      g.quadraticCurveTo(1078, 462, 1092, 420);
      g.lineTo(1108, 420);
      g.quadraticCurveTo(1122, 462, 1112, 496);
      g.closePath();
      g.fill();
      shade(g, '#2c2434', 0.55);
      light(g, 1100, 470, 640, '255,170,90', 0.55);
      light(g, 800, 270, 300, '160,175,200', 0.18);
      vg(g, 0, 700, W, H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.6)']]);
    },
    prep(st) { st.fog = fogTex(51, 320, 30, '200,205,215', 80, 200); },
    anim(ctx, t, o, st) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(640, 110, 320, 320);
      ctx.clip();
      drawFog(ctx, st.fog, 150, 300, t, 9, 0.6);
      ctx.restore();
      flame(ctx, 1100, 478, 18, t, 5, 0, 0.9);
      glow(ctx, 1100, 470, 320, '255,150,70', 0.04 + 0.05 * fl(t * 3.9));
    },
  };

  // ---------------------------------------------------------------- amanhecer
  SCENES.amanhecer = {
    brush: { n: 15000, len: [8, 24], width: [2, 5], alpha: 0.2, ang: 0, spread: 0.45, smear: 8 },
    build(g, rnd) {
      vg(g, 0, 0, W, H, [[0, '#6c8bb0'], [0.25, '#a6b5c6'], [0.42, '#efc68e'], [0.5, '#f8dcae'], [0.6, '#c9b39a'], [1, '#556052']]);
      light(g, 820, 430, 700, '255,220,160', 0.55);
      g.save();
      g.globalCompositeOperation = 'screen';
      for (let i = 0; i < 16; i++) {
        const a = -Math.PI + (i / 15) * Math.PI + (rnd() - 0.5) * 0.08;
        g.fillStyle = `rgba(255,230,180,${0.04 + rnd() * 0.05})`;
        g.beginPath();
        g.moveTo(820, 430);
        g.lineTo(820 + Math.cos(a - 0.03) * 1400, 430 + Math.sin(a - 0.03) * 1400);
        g.lineTo(820 + Math.cos(a + 0.03) * 1400, 430 + Math.sin(a + 0.03) * 1400);
        g.closePath();
        g.fill();
      }
      g.restore();
      g.fillStyle = '#fff7e2';
      ell(g, 820, 432, 42, 42);
      g.fill();
      clouds(g, rnd, 14, 120, 360, ['255,210,170', '200,180,200']);
      ridge(g, rnd, 450, 50, '#a59fb4', 0.8);
      band(g, 470, 80, '255,225,185', 0.7);
      ridge(g, rnd, 500, 60, '#6f8579', 1.1);
      band(g, 520, 90, '255,232,200', 0.55);
      const r3 = ridge(g, rnd, 560, 50, '#3e5847', 1.4);
      for (let i = 0; i < 26; i++) { const x = rnd() * W; araucaria(g, rnd, x, r3(x) + 6, 40 + rnd() * 50, '#2f4436', 0); }
      band(g, 600, 120, '255,236,210', 0.4);
      // aves
      g.strokeStyle = 'rgba(60,50,60,0.6)';
      g.lineWidth = 2;
      for (const [bx, by, s] of [[1040, 300, 1], [1080, 286, 0.8], [1010, 320, 0.7]]) {
        g.beginPath();
        g.moveTo(bx - 10 * s, by - 4 * s);
        g.quadraticCurveTo(bx - 4 * s, by - 6 * s, bx, by);
        g.quadraticCurveTo(bx + 4 * s, by - 6 * s, bx + 10 * s, by - 4 * s);
        g.stroke();
      }
      // varanda
      const wood = '#3a2a1e';
      g.fillStyle = wood;
      g.fillRect(0, 0, W, 48);
      g.fillStyle = 'rgba(255,200,140,0.35)';
      g.fillRect(0, 46, W, 3);
      for (const px of [60, 1490]) {
        g.fillStyle = lin(g, px, 0, px + 50, 0, [[0, '#2a1d14'], [0.5, '#4a3424'], [1, '#22170f']]);
        g.fillRect(px, 0, 50, 900);
        g.fillStyle = 'rgba(255,190,120,0.3)';
        g.fillRect(px + (px < 800 ? 46 : 0), 0, 4, 900);
      }
      g.strokeStyle = wood;
      g.lineWidth = 12;
      line(g, 110, 48, 210, 130);
      line(g, 1490, 48, 1390, 130);
      g.fillStyle = wood;
      g.fillRect(0, 600, W, 22);
      g.fillStyle = 'rgba(255,200,140,0.45)';
      g.fillRect(0, 600, W, 3);
      for (let x = 130; x < 1480; x += 42) {
        g.fillStyle = lin(g, x, 0, x + 16, 0, [[0, '#2e2117'], [0.5, '#4a3626'], [1, '#2a1d14']]);
        g.beginPath();
        g.moveTo(x, 622);
        g.lineTo(x + 16, 622);
        g.quadraticCurveTo(x + 22, 690, x + 16, 760);
        g.lineTo(x, 760);
        g.quadraticCurveTo(x - 6, 690, x, 622);
        g.fill();
      }
      g.fillStyle = wood;
      g.fillRect(0, 760, W, 18);
      vg(g, 0, 778, W, H, [[0, '#2a1d14'], [1, '#160f0a']]);
      hydrangea(g, rnd, 150, 700, 150, ['90,120,200', '140,130,210', '200,140,190', '110,150,220'], 0.5);
      hydrangea(g, rnd, 1460, 730, 150, ['90,120,200', '150,130,210', '210,150,200'], -0.5);
      light(g, 820, 430, 380, '255,230,170', 0.35);
      g.fillStyle = 'rgba(255,255,240,0.9)';
      for (let i = 0; i < 60; i++) { ell(g, (rnd() < 0.5 ? 40 + rnd() * 260 : 1320 + rnd() * 260), 600 + rnd() * 240, 1.1, 1.1); g.fill(); }
    },
    prep(st, o, rnd) {
      st.fog = fogTex(61, 260, 40, '255,236,210', 100, 280);
      st.sp = [];
      for (let i = 0; i < 26; i++) st.sp.push({ x: rnd() < 0.5 ? 40 + rnd() * 260 : 1320 + rnd() * 260, y: 600 + rnd() * 240, p: rnd() * 10 });
    },
    anim(ctx, t, o, st) {
      glow(ctx, 820, 430, 420, '255,220,160', 0.1 + 0.05 * Math.sin(t * 0.6), 'screen');
      drawFog(ctx, st.fog, 470, 230, t, 5, 0.45);
      for (const s of st.sp) {
        const b = Math.pow(Math.max(0, Math.sin(t * 1.4 + s.p * 3)), 6);
        glow(ctx, s.x, s.y, 8, '255,250,230', b * 0.9);
      }
    },
  };

  // ---------------------------------------------------------------- hóspede
  const HOSP_X = [560, 640, 720, 800, 880, 960, 1040];
  const HOSP_H = [40, 52, 34, 58, 38, 48, 36];
  const HOSP_OUT = [0.8, 2.3, 3.9, Infinity, 4.8, 3.1, 1.6];
  function hospedePath() {
    const p = new Path2D();
    p.ellipse(800, 98, 30, 54, -0.06, 0, TAU);
    const b = new Path2D();
    b.moveTo(792, 140);
    b.lineTo(808, 140);
    b.bezierCurveTo(840, 170, 892, 168, 912, 196);
    b.bezierCurveTo(936, 250, 932, 330, 940, 380);
    b.bezierCurveTo(946, 430, 950, 480, 954, 520);
    b.lineTo(934, 522);
    b.bezierCurveTo(926, 470, 912, 420, 898, 370);
    b.bezierCurveTo(886, 320, 876, 270, 866, 240);
    b.bezierCurveTo(860, 320, 858, 400, 848, 520);
    b.bezierCurveTo(830, 590, 770, 590, 752, 520);
    b.bezierCurveTo(742, 400, 740, 320, 734, 240);
    b.bezierCurveTo(724, 270, 714, 320, 702, 370);
    b.bezierCurveTo(688, 420, 674, 470, 666, 522);
    b.lineTo(646, 520);
    b.bezierCurveTo(650, 480, 654, 430, 660, 380);
    b.bezierCurveTo(668, 330, 664, 250, 688, 196);
    b.bezierCurveTo(708, 168, 760, 170, 792, 140);
    b.closePath();
    p.addPath(b);
    return p;
  }
  function hospedeFingers(g) {
    g.lineCap = 'round';
    for (const [wx, dir] of [[656, -1], [944, 1]]) {
      for (let f = 0; f < 5; f++) {
        const spread = (f - 2) * 0.2;
        const len = 70 + (f === 2 ? 30 : f === 1 || f === 3 ? 20 : 0);
        const ang = Math.PI / 2 + spread + dir * 0.12;
        let x = wx, y = 520;
        for (let s = 0; s < 6; s++) {
          const nx = x + Math.cos(ang + dir * s * 0.05) * len / 6, ny = y + Math.sin(ang + dir * s * 0.05) * len / 6;
          g.lineWidth = lerp(7, 2, s / 5);
          line(g, x, y, nx, ny);
          x = nx; y = ny;
        }
      }
    }
  }
  SCENES.hospede = {
    brush: { n: 12000, len: [6, 16], width: [2, 4], alpha: 0.2, ang: Math.PI / 2, spread: 0.6, smear: 6 },
    build(g, rnd, o, r) {
      g.fillStyle = '#05060a';
      g.fillRect(0, 0, W, H);
      stoneWall(g, rnd, 0, 0, W, 640, [22, 22, 26], 10, '#0b0b0e');
      vg(g, 0, 0, W, 640, [[0, 'rgba(4,5,8,0.6)'], [1, 'rgba(4,5,8,0.1)']]);
      vg(g, 0, 600, W, H, [[0, '#121216'], [1, '#07070a']]);
      // figura
      const fc = mk(W * r, H * r), fg = fc.getContext('2d');
      fg.scale(r, r);
      const path = hospedePath();
      fg.fillStyle = '#020204';
      fg.fill(path);
      fg.strokeStyle = '#020204';
      hospedeFingers(fg);
      // costelas tênues
      fg.strokeStyle = 'rgba(90,100,130,0.12)';
      fg.lineWidth = 2;
      for (let i = 0; i < 6; i++) { fg.beginPath(); fg.moveTo(770, 260 + i * 26); fg.quadraticCurveTo(800, 250 + i * 26, 830, 260 + i * 26); fg.stroke(); }
      // fumaça baixa
      fg.save();
      fg.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 60; i++) soft(fg, 700 + rnd() * 200, 470 + rnd() * 120, 18 + rnd() * 30, 'rgba(0,0,0,0.55)');
      fg.restore();
      const halo = softBlur(fc, 10 * r);
      g.save();
      g.globalAlpha = 0.9;
      g.drawImage(halo, 0, 0, W, H);
      g.drawImage(softBlur(fc, 24 * r), 0, 0, W, H);
      g.restore();
      // fiapos de fumaça
      g.strokeStyle = 'rgba(8,8,12,0.6)';
      for (let i = 0; i < 80; i++) {
        const x = 650 + rnd() * 300, y = 60 + rnd() * 480;
        if (!fg.isPointInPath(path, x * r, y * r)) continue;
        g.lineWidth = 1 + rnd() * 3;
        g.beginPath();
        g.moveTo(x, y);
        g.bezierCurveTo(x + (rnd() - 0.5) * 60, y - 20, x + (rnd() - 0.5) * 80, y - 50, x + (rnd() - 0.5) * 90, y - 80 - rnd() * 40);
        g.stroke();
      }
      g.drawImage(fc, 0, 0, W, H);
      // contorno frio
      const rimC = mk(W * r, H * r), rg = rimC.getContext('2d');
      rg.drawImage(fc, 0, 0);
      rg.globalCompositeOperation = 'source-in';
      rg.fillStyle = 'rgb(120,140,180)';
      rg.fillRect(0, 0, rimC.width, rimC.height);
      rg.globalCompositeOperation = 'destination-out';
      rg.drawImage(fc, -5 * r, 3 * r);
      g.save();
      g.globalAlpha = 0.35;
      g.drawImage(softBlur(rimC, 2 * r), 0, 0, W, H);
      g.restore();
      // correntes partidas
      chain(g, 520, 700, 700, 690, 12);
      chain(g, 900, 710, 1080, 700, 14);
      chain(g, 760, 760, 860, 740, 6);
      // parapeito e velas
      g.fillStyle = '#26221f';
      g.fillRect(520, 600, 560, 20);
      g.fillStyle = '#171513';
      g.fillRect(526, 620, 548, 40);
      HOSP_X.forEach((x, i) => candleBody(g, x, 602, HOSP_H[i], 13, 70 + i));
      light(g, 800, 120, 500, '70,90,140', 0.1);
    },
    prep(st, o, rnd) {
      st.wisps = [];
      const path = hospedePath();
      const c = mk(4, 4).getContext('2d');
      let guard = 0;
      while (st.wisps.length < 44 && guard++ < 4000) {
        const x = 640 + rnd() * 320, y = 40 + rnd() * 500;
        if (c.isPointInPath(path, x, y) && (!c.isPointInPath(path, x - 14, y) || !c.isPointInPath(path, x + 14, y) || !c.isPointInPath(path, x, y - 14))) {
          st.wisps.push({ x, y, p: rnd(), d: x < 800 ? -1 : 1, s: 0.15 + rnd() * 0.2 });
        }
      }
    },
    anim(ctx, t, o, st) {
      for (const w of st.wisps) {
        const ph = (t * w.s + w.p) % 1;
        const x = w.x + w.d * ph * 26 + Math.sin(t * 1.3 + w.p * 9) * 5, y = w.y - ph * 60;
        glow(ctx, x, y, 22 + ph * 26, '10,10,16', 0.75 * Math.sin(ph * Math.PI), 'source-over');
      }
      let lit = 0;
      HOSP_X.forEach((x, i) => {
        const top = 602 - HOSP_H[i] - 5;
        if (t < HOSP_OUT[i]) {
          const dying = clamp((HOSP_OUT[i] - t) / 0.6, 0.15, 1);
          flame(ctx, x, top, 17 * dying, t, i + 3, 0.4 + 0.2 * Math.sin(t * 3 + i), 0.9 * dying);
          lit++;
        } else smokeCurl(ctx, x, top, t, i * 1.3, 100);
      });
      glow(ctx, 800, 560, 480, '255,140,60', 0.06 * lit / 7 + 0.03 * fl(t * 5));
      const a = 0.65 + 0.35 * fl(t * 1.7);
      for (const ex of [787, 813]) {
        glow(ctx, ex, 92, 16, '200,220,255', a * 0.7);
        ctx.fillStyle = `rgba(235,242,255,${a})`;
        ell(ctx, ex, 92, 5, 2.2, ex < 800 ? 0.15 : -0.15);
        ctx.fill();
      }
    },
  };

  // ---------------------------------------------------------------- retrato
  SCENES.retrato = {
    brush: { n: 9000, len: [8, 24], width: [2, 4], alpha: 0.18, ang: 0, spread: 0.3, smear: 8 },
    build(g, rnd, o, r) {
      // mesa de madeira
      vg(g, 0, 0, W, H, [[0, '#2c1c12'], [1, '#160d08']]);
      g.lineWidth = 2;
      for (let i = 0; i < 160; i++) {
        const y = rnd() * H;
        g.strokeStyle = `rgba(${rnd() < 0.5 ? '70,44,26' : '18,10,6'},${0.2 + rnd() * 0.3})`;
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= W; x += 40) g.lineTo(x, y + Math.sin(x * 0.004 + i) * 10 + Math.sin(x * 0.02 + i * 3) * 2);
        g.stroke();
      }
      light(g, 520, 160, 900, '255,190,120', 0.35);
      // foto
      const li = o.li === 'heitor' ? 'heitor' : 'helena';
      const pw = 540, ph = 430, iw = 492, ih = 340, bx = 24, by = 24;
      const photo = mk(pw * r, ph * r), pg = photo.getContext('2d');
      pg.scale(r, r);
      pg.fillStyle = '#e4d8bf';
      pg.fillRect(0, 0, pw, ph);
      const img = mk(iw * r, ih * r), ig = img.getContext('2d');
      ig.scale(r, r);
      vg(ig, 0, 0, iw, ih, [[0, '#2a2016'], [1, '#4a3826']]);
      light(ig, 70, 300, 260, '255,220,160', 0.55);
      for (let i = 0; i < 18; i++) light(ig, rnd() * iw, 20 + rnd() * 80, 8 + rnd() * 8, '255,235,190', 0.6);
      ig.strokeStyle = 'rgba(240,225,190,0.5)';
      ig.lineWidth = 1;
      for (const [y0, sag] of [[22, 30], [64, 24]]) {
        ig.beginPath();
        ig.moveTo(-10, y0);
        ig.quadraticCurveTo(iw / 2, y0 + sag, iw + 10, y0);
        ig.stroke();
        for (let x = 0; x < iw; x += 18) {
          const u = x / iw, yy = y0 + 4 * u * (1 - u) * sag;
          ig.fillStyle = (x / 18) % 2 ? 'rgba(235,215,175,0.8)' : 'rgba(120,90,60,0.8)';
          poly(ig, [x, yy, x + 14, yy + 1, x + 7, yy + 16]);
          ig.fill();
        }
      }
      for (let i = 0; i < 6; i++) { ig.fillStyle = 'rgba(20,14,8,0.6)'; ell(ig, rnd() < 0.5 ? rnd() * 80 : iw - rnd() * 80, 200 + rnd() * 140, 30, 70); ig.fill(); }
      const fig = (nome, cx, s, top) => {
        const c = composeChar(buildChar(nome, 'sorriso', 0.75));
        ig.drawImage(sepia(c), cx - (CW * s) / 2, top, CW * s, CH * s);
      };
      fig(li, iw * 0.66, 0.5, -26);
      fig('rosa', iw * 0.34, 0.48, -6);
      // envelhecimento
      ig.save();
      const vgn = ig.createRadialGradient(iw / 2, ih / 2, ih * 0.3, iw / 2, ih / 2, iw * 0.7);
      vgn.addColorStop(0, 'rgba(40,25,10,0)');
      vgn.addColorStop(1, 'rgba(40,25,10,0.65)');
      ig.fillStyle = vgn;
      ig.fillRect(0, 0, iw, ih);
      ig.restore();
      for (let i = 0; i < 400; i++) {
        ig.fillStyle = rnd() < 0.5 ? 'rgba(250,240,220,0.35)' : 'rgba(30,20,10,0.35)';
        ig.fillRect(rnd() * iw, rnd() * ih, 1 + rnd(), 1 + rnd());
      }
      ig.strokeStyle = 'rgba(250,240,220,0.3)';
      for (let i = 0; i < 14; i++) { ig.lineWidth = 0.6 + rnd(); const x = rnd() * iw; line(ig, x, rnd() * ih * 0.3, x + (rnd() - 0.5) * 40, ih * (0.6 + rnd() * 0.4)); }
      if (o.riscado) {
        const fx = iw * 0.66, fy = -26 + 280 * 0.5;
        ig.lineCap = 'round';
        for (let i = 0; i < 70; i++) {
          const a = (rnd() - 0.5) * 1.2 - 0.5;
          const l = 30 + rnd() * 50;
          const x = fx + (rnd() - 0.5) * 70, y = fy + (rnd() - 0.5) * 90;
          ig.strokeStyle = rnd() < 0.7 ? `rgba(245,238,225,${0.5 + rnd() * 0.4})` : 'rgba(20,12,8,0.7)';
          ig.lineWidth = 1 + rnd() * 2.5;
          line(ig, x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2, x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2);
        }
      }
      pg.drawImage(img, bx, by, iw, ih);
      pg.fillStyle = 'rgba(120,90,50,0.25)';
      for (let i = 0; i < 6; i++) soft(pg, rnd() * pw, rnd() * ph, 20 + rnd() * 40, 'rgba(140,100,50,0.2)');
      pg.fillStyle = '#3a2a20';
      pg.font = 'italic 28px "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive';
      pg.textAlign = 'center';
      pg.fillText('São João · 1974', pw / 2, ph - 26);
      pg.strokeStyle = 'rgba(255,255,255,0.35)';
      pg.lineWidth = 2;
      line(pg, pw - 90, 0, pw, 80);
      // sombra e foto sobre a mesa
      g.save();
      g.translate(800, 340);
      g.rotate(-0.06);
      g.fillStyle = 'rgba(0,0,0,0.5)';
      g.fillRect(-pw / 2 + 12, -ph / 2 + 16, pw, ph);
      g.drawImage(softBlur(photo, 1), -pw / 2, -ph / 2, pw, ph);
      g.drawImage(photo, -pw / 2, -ph / 2, pw, ph);
      g.fillStyle = lin(g, -pw / 2, -ph / 2, pw / 2, ph / 2, [[0, 'rgba(255,240,210,0.16)'], [0.4, 'rgba(255,240,210,0)'], [1, 'rgba(0,0,0,0.2)']]);
      g.fillRect(-pw / 2, -ph / 2, pw, ph);
      g.restore();
      vg(g, 0, 640, W, H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]);
    },
    anim(ctx, t) {
      glow(ctx, 560, 180, 500, '255,190,120', 0.04 + 0.02 * Math.sin(t * 0.8), 'screen');
    },
  };

  SCENES.preto = {
    build(g) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); },
  };

  function buildScene(nome, opts, r) {
    const S = SCENES[nome];
    const c = mk(W * r, H * r), g = c.getContext('2d');
    g.scale(r, r);
    const rnd = mulberry32(hashStr('cena:' + nome));
    S.build(g, rnd, opts, r);
    if (S.brush) brushPass(c, mulberry32(hashStr('pincel:' + nome)), Object.assign({ r }, S.brush));
    return c;
  }

  // ======================================================================== PERSONAGENS
  function facePath(h) {
    const { cx, cy, rx, ry, jaw } = h;
    const p = new Path2D();
    p.moveTo(cx, cy - ry);
    p.bezierCurveTo(cx + rx * 0.92, cy - ry, cx + rx * 1.06, cy - ry * 0.25, cx + rx, cy + ry * 0.12);
    p.bezierCurveTo(cx + rx * 0.96, cy + ry * 0.5, cx + rx * jaw * 1.2, cy + ry * 0.96, cx, cy + ry);
    p.bezierCurveTo(cx - rx * jaw * 1.2, cy + ry * 0.96, cx - rx * 0.96, cy + ry * 0.5, cx - rx, cy + ry * 0.12);
    p.bezierCurveTo(cx - rx * 1.06, cy - ry * 0.25, cx - rx * 0.92, cy - ry, cx, cy - ry);
    p.closePath();
    return p;
  }
  function torsoPath(S) {
    const c = 300, n = S.neckW, s = S.sw, y = S.shY || 470;
    const p = new Path2D();
    p.moveTo(c - n, 410);
    p.bezierCurveTo(c - n - 6, y - 22, c - s + 76, y - 14, c - s + 20, y + 10);
    p.bezierCurveTo(c - s - 18, y + 30, c - s - 30, y + 120, c - s - 28, 920);
    p.lineTo(c + s + 28, 920);
    p.bezierCurveTo(c + s + 30, y + 120, c + s + 18, y + 30, c + s - 20, y + 10);
    p.bezierCurveTo(c + s - 76, y - 14, c + n + 6, y - 22, c + n, 410);
    p.closePath();
    return p;
  }
  function neckPath(S, y0, y1) {
    const p = new Path2D(), n = S.neckW;
    p.moveTo(300 - n + 2, y0);
    p.lineTo(300 + n - 2, y0);
    p.quadraticCurveTo(300 + n, (y0 + y1) / 2, 300 + n + 6, y1);
    p.lineTo(300 - n - 6, y1);
    p.quadraticCurveTo(300 - n, (y0 + y1) / 2, 300 - n + 2, y0);
    p.closePath();
    return p;
  }
  function strands(g, rnd, n, from, to, col, w) {
    g.save();
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = from(rnd), b = to(rnd, a);
      g.strokeStyle = col(rnd);
      g.lineWidth = w[0] + rnd() * (w[1] - w[0]);
      g.beginPath();
      g.moveTo(a[0], a[1]);
      g.bezierCurveTo(lerp(a[0], b[0], 0.3) + (rnd() - 0.5) * 30, lerp(a[1], b[1], 0.3), lerp(a[0], b[0], 0.7) + (rnd() - 0.5) * 30, lerp(a[1], b[1], 0.7), b[0], b[1]);
      g.stroke();
    }
    g.restore();
  }
  // traços do rosto: discretos, em claro-escuro, sem desenho de cartoon
  function faceFeatures(g, S, E, rnd, opt) {
    const h = S.head, { cx, cy, rx, ry } = h;
    const o = opt || {};
    g.save();
    g.clip(facePath(h));
    soft(g, cx - rx * 0.42, cy + ry * 0.1, rx * 0.55, 'rgba(255,214,176,0.22)', 1.2);
    soft(g, cx + rx * 0.62, cy + ry * 0.05, rx * 0.7, 'rgba(25,12,8,0.45)', 1.4);
    soft(g, cx, cy - ry * 0.55, rx * 0.6, 'rgba(255,220,190,0.12)', 0.6);
    const ey = cy - ry * 0.05, ex = rx * 0.38;
    soft(g, cx - ex, ey, rx * 0.28, 'rgba(45,22,16,0.5)', 0.6);
    soft(g, cx + ex, ey, rx * 0.28, 'rgba(30,14,10,0.6)', 0.6);
    const wide = E.wide ? 1.35 : 1;
    for (const s of [-1, 1]) {
      const x = cx + s * ex;
      if (!E.eyes) {
        if (E.wide) { g.fillStyle = 'rgba(220,210,200,0.22)'; ell(g, x, ey + 1, rx * 0.15, ry * 0.05); g.fill(); }
        g.fillStyle = 'rgba(18,9,7,0.7)';
        ell(g, x, ey + 1, rx * 0.15 * (E.wide ? 1 : 1), ry * 0.034 * wide);
        g.fill();
        g.fillStyle = 'rgba(8,4,3,0.75)';
        ell(g, x + rx * 0.01, ey + 1, rx * 0.055, ry * 0.03 * wide);
        g.fill();
      } else {
        g.fillStyle = 'rgba(5,2,2,0.85)';
        ell(g, x, ey + 1, rx * 0.17, ry * 0.05);
        g.fill();
      }
      // pálpebra
      g.strokeStyle = 'rgba(30,14,10,0.45)';
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(x, ey + 2, rx * 0.17, ry * 0.05 * wide, 0, Math.PI * 1.08, Math.PI * 1.92);
      g.stroke();
      // sobrancelhas
      const inner = cx + s * rx * 0.16, outer = cx + s * rx * 0.62;
      const by = ey - ry * 0.16;
      let di = 0, dout = 0;
      if (E.brow === 'triste') { di = -ry * 0.05; dout = ry * 0.02; }
      if (E.brow === 'medo') { di = -ry * 0.06; dout = -ry * 0.03; }
      if (E.brow === 'raiva') { di = ry * 0.04; dout = -ry * 0.02; }
      if (E.brow === 'alegre') { di = -ry * 0.015; dout = -ry * 0.015; }
      g.strokeStyle = `rgba(20,12,9,${S.browA || 0.55})`;
      g.lineWidth = S.browW || 3;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(inner, by + di);
      g.quadraticCurveTo(lerp(inner, outer, 0.5), by - ry * 0.035 + (di + dout) / 2, outer, by + ry * 0.03 + dout);
      g.stroke();
    }
    if (!E.eyes) {
      g.fillStyle = 'rgba(255,240,220,0.75)';
      ell(g, cx - ex - rx * 0.03, ey - 1, 1.6, 1.6);
      g.fill();
    }
    // nariz
    g.strokeStyle = 'rgba(40,20,14,0.3)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(cx + rx * 0.05, ey + ry * 0.08);
    g.quadraticCurveTo(cx + rx * 0.14, cy + ry * 0.28, cx + rx * 0.1, cy + ry * 0.38);
    g.stroke();
    soft(g, cx + rx * 0.04, cy + ry * 0.4, rx * 0.14, 'rgba(40,20,14,0.35)', 0.6);
    soft(g, cx - rx * 0.06, cy + ry * 0.33, rx * 0.08, 'rgba(255,230,210,0.25)', 0.8);
    g.fillStyle = 'rgba(30,12,8,0.4)';
    ell(g, cx - rx * 0.08, cy + ry * 0.42, rx * 0.04, ry * 0.015);
    g.fill();
    ell(g, cx + rx * 0.1, cy + ry * 0.42, rx * 0.04, ry * 0.015);
    g.fill();
    // boca
    const my = cy + ry * 0.6, mw = rx * (S.mouthW || 0.24), cv = E.mouth || 0;
    soft(g, cx, my + ry * 0.02, mw * 1.1, `rgba(${S.lip || '130,55,48'},0.38)`, 0.3);
    g.strokeStyle = 'rgba(40,14,10,0.6)';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(cx - mw, my - cv * ry * 0.03);
    g.quadraticCurveTo(cx, my + cv * ry * 0.05, cx + mw, my - cv * ry * 0.03);
    g.stroke();
    soft(g, cx - rx * 0.05, my + ry * 0.09, mw * 0.6, 'rgba(255,220,200,0.14)', 0.35);
    // queixo e maxilar
    soft(g, cx + rx * 0.2, cy + ry * 0.95, rx * 0.8, 'rgba(20,10,6,0.35)', 0.35);
    if (o.extra) o.extra(g, cx, cy, rx, ry, ey, ex);
    g.restore();
  }

  // ---- Helena
  function drawHelena(gb, gd, gh, S, E, rnd) {
    const { cx, cy, rx, ry } = S.head;
    // cabelo de trás
    const back = new Path2D();
    back.moveTo(300, 166);
    back.bezierCurveTo(374, 158, 408, 214, 404, 290);
    back.bezierCurveTo(402, 352, 424, 400, 448, 452);
    back.bezierCurveTo(472, 504, 452, 562, 470, 612);
    back.bezierCurveTo(482, 652, 452, 684, 430, 690);
    back.bezierCurveTo(382, 706, 340, 680, 300, 700);
    back.bezierCurveTo(258, 690, 220, 710, 172, 690);
    back.bezierCurveTo(150, 680, 118, 650, 130, 612);
    back.bezierCurveTo(148, 562, 128, 504, 152, 452);
    back.bezierCurveTo(176, 400, 198, 352, 196, 290);
    back.bezierCurveTo(192, 214, 226, 158, 300, 166);
    back.closePath();
    gb.fillStyle = S.hair;
    gb.fill(back);
    gb.save();
    gb.clip(back);
    strands(gb, rnd, 160, (r) => [200 + r() * 200, 170 + r() * 60], (r, a) => [a[0] + (a[0] - 300) * 0.4 + (r() - 0.5) * 40, 600 + r() * 100],
      (r) => `rgba(${S.hairHi},${0.08 + r() * 0.16})`, [1, 2.5]);
    gb.restore();
    // pescoço e corpo
    gd.fillStyle = S.skin;
    gd.fill(neckPath(S, 330, 470));
    soft(gd, 300, 392, 60, 'rgba(20,10,6,0.6)', 0.5);
    const torso = torsoPath(S);
    gd.fillStyle = S.cloth;
    gd.fill(torso);
    for (const s of [-1, 1]) { gd.fillStyle = S.cloth; ell(gd, 300 + s * (S.sw - 16), 486, 44, 34, s * 0.3); gd.fill(); }
    gd.save();
    gd.clip(torso);
    gd.strokeStyle = 'rgba(80,60,40,0.25)';
    gd.lineWidth = 3;
    for (const s of [-1, 1]) {
      gd.beginPath();
      gd.moveTo(300 + s * 90, 500);
      gd.quadraticCurveTo(300 + s * 60, 640, 300 + s * 70, 900);
      gd.stroke();
    }
    gd.fillStyle = 'rgba(240,230,210,0.18)';
    for (let i = 0; i < 70; i++) {
      const x = 215 + rnd() * 170, y = 455 + rnd() * 85;
      gd.beginPath();
      gd.arc(x, y, 2 + rnd() * 3, 0, TAU);
      gd.fill();
    }
    gd.strokeStyle = 'rgba(90,70,50,0.3)';
    gd.lineWidth = 2;
    gd.beginPath();
    gd.moveTo(200, 545);
    gd.quadraticCurveTo(300, 565, 400, 545);
    gd.stroke();
    gd.fillStyle = 'rgba(60,40,30,0.25)';
    gd.fillRect(140, 815, 320, 16);
    for (let x = 150; x < 450; x += 14) { gd.strokeStyle = 'rgba(60,40,30,0.25)'; line(gd, x, 831, x + 4, 900); }
    gd.restore();
    // gola alta de renda
    const collar = new Path2D();
    collar.moveTo(300 - S.neckW - 8, 452);
    collar.lineTo(300 - S.neckW - 3, 392);
    collar.quadraticCurveTo(300, 384, 300 + S.neckW + 3, 392);
    collar.lineTo(300 + S.neckW + 8, 452);
    collar.quadraticCurveTo(300, 462, 300 - S.neckW - 8, 452);
    collar.closePath();
    gd.fillStyle = '#e6dcc6';
    gd.fill(collar);
    gd.fillStyle = '#e6dcc6';
    for (let x = 300 - S.neckW - 2; x <= 300 + S.neckW + 2; x += 7) { ell(gd, x, 391 + Math.abs(x - 300) * 0.12, 4, 4); gd.fill(); }
    gd.save();
    gd.clip(collar);
    gd.fillStyle = 'rgba(110,90,70,0.35)';
    for (let y = 398; y < 456; y += 7) for (let x = 262; x < 340; x += 7) { ell(gd, x + (y % 14 ? 3.5 : 0), y, 1.4, 1.4); gd.fill(); }
    gd.strokeStyle = 'rgba(120,100,80,0.3)';
    gd.lineWidth = 1;
    for (let x = 266; x < 336; x += 5) line(gd, x, 396, x, 454);
    gd.restore();
    // botões de pérola
    for (let y = 474; y < 900; y += 34) {
      gd.fillStyle = 'rgba(40,30,20,0.4)';
      ell(gd, 301, y + 1.5, 5, 5);
      gd.fill();
      gd.fillStyle = '#eee6d6';
      ell(gd, 300, y, 4.5, 4.5);
      gd.fill();
      gd.fillStyle = 'rgba(255,255,255,0.8)';
      ell(gd, 298.5, y - 1.5, 1.4, 1.4);
      gd.fill();
    }
    medallion(gd, 300, 566, 276, 452, 324, 452);
    // rosto e cabelo da frente
    gh.fillStyle = S.skin;
    gh.fill(facePath(S.head));
    faceFeatures(gh, S, E, rnd);
    const front = mk(gh.canvas.width, gh.canvas.height), fg = front.getContext('2d');
    fg.setTransform(gh.getTransform());
    const outer = new Path2D();
    outer.moveTo(300, 168);
    outer.bezierCurveTo(370, 162, 398, 214, 396, 272);
    outer.bezierCurveTo(394, 330, 394, 380, 406, 430);
    outer.bezierCurveTo(420, 480, 424, 540, 410, 600);
    outer.bezierCurveTo(402, 632, 380, 642, 366, 624);
    outer.lineTo(232, 624);
    outer.bezierCurveTo(218, 642, 198, 632, 190, 600);
    outer.bezierCurveTo(176, 540, 180, 480, 194, 430);
    outer.bezierCurveTo(206, 380, 206, 330, 204, 272);
    outer.bezierCurveTo(202, 214, 230, 162, 300, 168);
    outer.closePath();
    fg.fillStyle = S.hair;
    fg.fill(outer);
    fg.save();
    fg.clip(outer);
    strands(fg, rnd, 150, (r) => [282 + r() * 14, 196 + r() * 10],
      (r) => { const side = r() < 0.55 ? -1 : 1; return [300 + side * (70 + r() * 40), 300 + r() * 320]; },
      (r) => `rgba(${S.hairHi},${0.1 + r() * 0.2})`, [1, 2.4]);
    fg.restore();
    const win = new Path2D();
    win.moveTo(cx - rx * 0.86, 920);
    win.lineTo(cx - rx * 0.86, cy + ry * 0.7);
    win.bezierCurveTo(cx - rx * 0.9, cy + ry * 0.2, cx - rx * 0.92, cy - ry * 0.1, cx - rx * 0.8, cy - ry * 0.42);
    win.bezierCurveTo(cx - rx * 0.6, cy - ry * 0.7, cx - rx * 0.3, cy - ry * 0.8, cx - rx * 0.12, cy - ry * 0.74);
    win.bezierCurveTo(cx + rx * 0.1, cy - ry * 0.66, cx + rx * 0.6, cy - ry * 0.56, cx + rx * 0.84, cy - ry * 0.12);
    win.bezierCurveTo(cx + rx * 0.92, cy + ry * 0.2, cx + rx * 0.9, cy + ry * 0.6, cx + rx * 0.76, cy + ry * 1.12);
    win.bezierCurveTo(cx + rx * 0.72, cy + ry * 1.4, cx + rx * 0.8, cy + ry * 2, cx + rx * 0.86, 920);
    win.closePath();
    fg.save();
    fg.globalCompositeOperation = 'destination-out';
    fg.fill(win);
    fg.restore();
    // sombra que o cabelo projeta no rosto
    gh.save();
    gh.clip(facePath(S.head));
    soft(gh, cx + rx * 0.5, cy - ry * 0.55, rx * 0.8, 'rgba(15,8,5,0.5)', 0.5);
    gh.restore();
    gh.save();
    gh.setTransform(1, 0, 0, 1, 0, 0);
    gh.drawImage(front, 0, 0);
    gh.restore();
  }
  function medallion(g, x, y, ax, ay, bx, by) {
    g.strokeStyle = '#b8903e';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(ax, ay);
    g.quadraticCurveTo(lerp(ax, x, 0.4), lerp(ay, y, 0.8), x, y - 12);
    g.quadraticCurveTo(lerp(bx, x, 0.4), lerp(by, y, 0.8), bx, by);
    g.stroke();
    g.fillStyle = 'rgba(30,20,10,0.4)';
    ell(g, x + 1.5, y + 2, 10, 13);
    g.fill();
    g.fillStyle = lin(g, x - 9, y - 12, x + 9, y + 12, [[0, '#f0d080'], [0.5, '#b8903e'], [1, '#6a4e1e']]);
    ell(g, x, y, 9, 12);
    g.fill();
    g.strokeStyle = 'rgba(80,55,20,0.7)';
    g.lineWidth = 1;
    ell(g, x, y, 6, 9);
    g.stroke();
    g.fillStyle = 'rgba(90,60,20,0.6)';
    ell(g, x, y - 3, 2, 2.5);
    g.fill();
    g.fillRect(x - 2, y, 4, 6);
    g.fillStyle = 'rgba(255,250,220,0.9)';
    ell(g, x - 3, y - 5, 1.6, 2.4, 0.4);
    g.fill();
  }

  // ---- Heitor
  function curlyCap(S, rnd) {
    const { cx, cy, rx, ry } = S.head;
    const circles = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * (1.02 + (i / 16) * 0.96);
      const k = 1 + rnd() * 0.08;
      circles.push([cx + Math.cos(a) * (rx + 6) * k, cy - 8 + Math.sin(a) * (ry + 8) * k, 22 + rnd() * 10]);
    }
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * (1.12 + (i / 10) * 0.76);
      circles.push([cx + Math.cos(a) * rx * 0.7, cy - 14 + Math.sin(a) * ry * 0.85, 26 + rnd() * 8]);
    }
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) circles.push([cx + s * (rx + 2 + rnd() * 6), cy - 6 + k * 18, 16 + rnd() * 6]);
    }
    return circles;
  }
  function drawHeitor(gb, gd, gh, S, E, rnd) {
    const { cx, cy, rx, ry } = S.head;
    const caps = curlyCap(S, rnd);
    // nuca encaracolada atrás
    gb.fillStyle = S.hair;
    for (let i = 0; i < 12; i++) { ell(gb, cx + (rnd() - 0.5) * 150, cy + 40 + rnd() * 80, 20 + rnd() * 10, 18 + rnd() * 8); gb.fill(); }
    for (const c of caps) { ell(gb, c[0], c[1] + 6, c[2], c[2]); gb.fill(); }
    // corpo: camisa, colete
    gd.fillStyle = S.skin;
    gd.fill(neckPath(S, 330, 480));
    soft(gd, 300, 392, 70, 'rgba(20,10,6,0.6)', 0.5);
    soft(gd, 300, 418, 10, 'rgba(255,220,190,0.18)', 1.6);
    const torso = torsoPath(S);
    gd.fillStyle = S.cloth;
    gd.fill(torso);
    gd.save();
    gd.clip(torso);
    gd.strokeStyle = 'rgba(70,60,50,0.3)';
    gd.lineWidth = 3;
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
      gd.beginPath();
      gd.moveTo(300 + s * (150 + k * 12), 500 + k * 40);
      gd.quadraticCurveTo(300 + s * (190 + k * 6), 650, 300 + s * (200 + k * 4), 900);
      gd.stroke();
    }
    // decote em V com pele
    gd.fillStyle = S.skin;
    poly(gd, [cx - 30, 436, cx + 30, 436, cx + 4, 534, cx - 4, 534]);
    gd.fill();
    soft(gd, 300, 520, 26, 'rgba(30,14,8,0.4)', 1.4);
    medallion(gd, 300, 506, 278, 446, 322, 446);
    // colarinho
    gd.fillStyle = '#ddd8cc';
    poly(gd, [cx - 32, 426, cx - 74, 452, cx - 52, 500, cx - 12, 512, cx - 28, 470]);
    gd.fill();
    poly(gd, [cx + 32, 426, cx + 74, 452, cx + 52, 500, cx + 12, 512, cx + 28, 470]);
    gd.fill();
    gd.strokeStyle = 'rgba(40,30,20,0.4)';
    gd.lineWidth = 2;
    poly(gd, [cx - 32, 426, cx - 74, 452, cx - 52, 500, cx - 12, 512, cx - 28, 470]);
    gd.stroke();
    poly(gd, [cx + 32, 426, cx + 74, 452, cx + 52, 500, cx + 12, 512, cx + 28, 470]);
    gd.stroke();
    // colete
    const vest = (s) => {
      const p = new Path2D();
      p.moveTo(cx + s * 52, 460);
      p.lineTo(cx + s * 118, 476);
      p.bezierCurveTo(cx + s * 126, 540, cx + s * 150, 600, cx + s * 146, 650);
      p.lineTo(cx + s * 156, 920);
      p.lineTo(cx - s * 8, 920);
      p.lineTo(cx - s * 8, 640);
      p.bezierCurveTo(cx + s * 4, 590, cx + s * 30, 520, cx + s * 52, 460);
      p.closePath();
      return p;
    };
    for (const s of [1, -1]) {
      const v = vest(s);
      gd.fillStyle = S.vest;
      gd.fill(v);
      gd.save();
      gd.clip(v);
      gd.strokeStyle = 'rgba(120,90,70,0.12)';
      gd.lineWidth = 1.2;
      for (let k = -400; k < 400; k += 7) line(gd, cx + k, 460, cx + k + 120 * s, 920);
      gd.strokeStyle = 'rgba(0,0,0,0.5)';
      gd.lineWidth = 3;
      line(gd, cx + s * 70, 770, cx + s * 120, 764);
      gd.restore();
      gd.strokeStyle = 'rgba(0,0,0,0.45)';
      gd.lineWidth = 2;
      gd.stroke(v);
    }
    for (let y = 660; y < 900; y += 48) {
      gd.fillStyle = 'rgba(0,0,0,0.5)';
      ell(gd, 301, y + 1.5, 5.5, 5.5);
      gd.fill();
      gd.fillStyle = '#6a5034';
      ell(gd, 300, y, 5, 5);
      gd.fill();
      gd.fillStyle = 'rgba(255,220,160,0.45)';
      ell(gd, 298.5, y - 1.5, 1.4, 1.4);
      gd.fill();
    }
    gd.restore();
    // rosto (barba por fazer)
    gh.fillStyle = S.skin;
    gh.fill(facePath(S.head));
    faceFeatures(gh, S, E, rnd, {
      extra(g) {
        g.fillStyle = 'rgba(25,15,10,0.12)';
        for (let i = 0; i < 1400; i++) {
          const a = rnd() * Math.PI, d = rnd();
          const x = cx + Math.cos(a) * rx * 0.95 * d, y = cy + ry * 0.25 + Math.sin(a) * ry * 0.78 * d;
          if (Math.abs(x - cx) < rx * 0.3 && y < cy + ry * 0.55) continue;
          g.fillRect(x, y, 1.4, 1.4);
        }
      },
    });
    const front = mk(gh.canvas.width, gh.canvas.height), fg = front.getContext('2d');
    fg.setTransform(gh.getTransform());
    fg.fillStyle = S.hair;
    for (const c of caps) { ell(fg, c[0], c[1], c[2], c[2]); fg.fill(); }
    fg.lineCap = 'round';
    for (let i = 0; i < 360; i++) {
      const c = caps[(rnd() * caps.length) | 0];
      const a = rnd() * TAU, d = rnd() * c[2] * 0.8;
      const x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d, r0 = 4 + rnd() * 6;
      fg.strokeStyle = rnd() < 0.6 ? `rgba(${S.hairHi},${0.15 + rnd() * 0.25})` : 'rgba(0,0,0,0.35)';
      fg.lineWidth = 1.2 + rnd() * 1.4;
      fg.beginPath();
      fg.arc(x, y, r0, rnd() * TAU, rnd() * TAU + 2.6);
      fg.stroke();
    }
    const win = new Path2D();
    win.moveTo(cx - rx * 0.9, 920);
    win.lineTo(cx - rx * 0.9, cy + ry * 0.2);
    win.bezierCurveTo(cx - rx * 0.95, cy - ry * 0.1, cx - rx * 0.86, cy - ry * 0.4, cx - rx * 0.64, cy - ry * 0.54);
    win.bezierCurveTo(cx - rx * 0.3, cy - ry * 0.66, cx + rx * 0.3, cy - ry * 0.68, cx + rx * 0.66, cy - ry * 0.52);
    win.bezierCurveTo(cx + rx * 0.88, cy - ry * 0.38, cx + rx * 0.95, cy - ry * 0.1, cx + rx * 0.9, cy + ry * 0.2);
    win.lineTo(cx + rx * 0.9, 920);
    win.closePath();
    fg.save();
    fg.globalCompositeOperation = 'destination-out';
    fg.fill(win);
    fg.restore();
    gh.save();
    gh.clip(facePath(S.head));
    soft(gh, cx + rx * 0.4, cy - ry * 0.5, rx * 0.8, 'rgba(15,8,5,0.45)', 0.4);
    gh.restore();
    gh.save();
    gh.setTransform(1, 0, 0, 1, 0, 0);
    gh.drawImage(front, 0, 0);
    gh.restore();
  }

  // ---- Dona Cida
  function drawCida(gb, gd, gh, S, E, rnd) {
    const { cx, cy, rx, ry } = S.head;
    // coque baixo (aparece de lado, atrás da cabeça)
    gb.fillStyle = S.hair;
    ell(gb, cx + rx * 0.82, cy + ry * 0.32, 34, 30, 0.3);
    gb.fill();
    gb.strokeStyle = `rgba(${S.hairHi},0.3)`;
    gb.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      gb.beginPath();
      gb.arc(cx + rx * 0.82, cy + ry * 0.32, 8 + i * 1.8, rnd() * TAU, rnd() * TAU + 2);
      gb.stroke();
    }
    // corpo
    gd.fillStyle = S.skin;
    gd.fill(neckPath(S, 340, 470));
    soft(gd, 300, 400, 60, 'rgba(20,10,6,0.6)', 0.5);
    gd.strokeStyle = 'rgba(40,20,14,0.3)';
    gd.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { gd.beginPath(); gd.moveTo(278, 418 + i * 12); gd.quadraticCurveTo(300, 424 + i * 12, 322, 418 + i * 12); gd.stroke(); }
    const torso = torsoPath(S);
    gd.fillStyle = S.cloth;
    gd.fill(torso);
    gd.save();
    gd.clip(torso);
    for (let i = 0; i < 70; i++) {
      const x = 150 + rnd() * 300, y = 440 + rnd() * 460;
      const c = rnd() < 0.5 ? '200,140,150' : '220,215,200';
      for (let p = 0; p < 5; p++) { gd.fillStyle = `rgba(${c},0.3)`; ell(gd, x + Math.cos(p * 1.256) * 4, y + Math.sin(p * 1.256) * 4, 3, 2, p); gd.fill(); }
    }
    gd.restore();
    gd.fillStyle = '#9a95a0';
    for (const s of [-1, 1]) { gd.beginPath(); gd.ellipse(300 + s * 26, 448, 30, 16, s * 0.3, 0, TAU); gd.fill(); }
    // xale de tricô
    const shawl = (s) => {
      const p = new Path2D();
      p.moveTo(cx + s * 32, 436);
      p.bezierCurveTo(cx + s * 84, 444, cx + s * 150, 456, cx + s * 182, 500);
      p.bezierCurveTo(cx + s * 214, 560, cx + s * 210, 700, cx + s * 204, 920);
      p.lineTo(cx + s * 70, 920);
      p.bezierCurveTo(cx + s * 70, 760, cx + s * 52, 600, cx + s * 48, 520);
      p.bezierCurveTo(cx + s * 46, 480, cx + s * 40, 460, cx + s * 32, 436);
      p.closePath();
      return p;
    };
    for (const s of [-1, 1]) {
      const p = shawl(s);
      gd.fillStyle = S.shawl;
      gd.fill(p);
      gd.save();
      gd.clip(p);
      gd.strokeStyle = 'rgba(160,130,130,0.22)';
      gd.lineWidth = 1.6;
      for (let y = 440; y < 920; y += 9) {
        for (let x = cx + s * 30; s > 0 ? x < cx + 220 : x > cx - 220; x += s * 9) {
          gd.beginPath();
          gd.moveTo(x - 3, y + Math.sin(x * 0.02) * 6);
          gd.lineTo(x, y + 4 + Math.sin(x * 0.02) * 6);
          gd.lineTo(x + 3, y + Math.sin(x * 0.02) * 6);
          gd.stroke();
        }
      }
      gd.restore();
      gd.strokeStyle = '#4c3c3e';
      gd.lineWidth = 9;
      gd.beginPath();
      gd.moveTo(cx + s * 34, 440);
      gd.bezierCurveTo(cx + s * 44, 470, cx + s * 50, 600, cx + s * 70, 920);
      gd.stroke();
    }
    // mãos e terço
    gd.fillStyle = S.skin;
    ell(gd, 278, 800, 46, 30, 0.35);
    gd.fill();
    ell(gd, 322, 812, 46, 30, -0.4);
    gd.fill();
    gd.strokeStyle = 'rgba(40,20,14,0.4)';
    gd.lineWidth = 2;
    for (let i = 0; i < 4; i++) { line(gd, 296 + i * 10, 790 + i * 3, 312 + i * 12, 830 + i * 2); }
    gd.fillStyle = '#4a2c18';
    for (let i = 0; i < 26; i++) {
      const u = i / 25, a = Math.PI * (0.05 + u * 0.9);
      ell(gd, 300 - Math.cos(a) * 70, 800 + Math.sin(a) * 70, 4.4, 4.4);
      gd.fill();
      gd.fillStyle = 'rgba(255,220,170,0.4)';
      ell(gd, 299 - Math.cos(a) * 70, 798 + Math.sin(a) * 70, 1.2, 1.2);
      gd.fill();
      gd.fillStyle = '#4a2c18';
    }
    gd.fillStyle = '#b8903e';
    gd.fillRect(298, 868, 4, 24);
    gd.fillRect(290, 874, 20, 4);
    // rosto com rugas
    gh.fillStyle = S.skin;
    gh.fill(facePath(S.head));
    faceFeatures(gh, S, E, rnd, {
      extra(g) {
        g.strokeStyle = 'rgba(40,18,12,0.28)';
        g.lineWidth = 1.6;
        for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx - rx * 0.45, cy - ry * (0.42 - i * 0.07)); g.quadraticCurveTo(cx, cy - ry * (0.46 - i * 0.07), cx + rx * 0.45, cy - ry * (0.42 - i * 0.07)); g.stroke(); }
        for (const s of [-1, 1]) {
          g.beginPath();
          g.moveTo(cx + s * rx * 0.18, cy + ry * 0.36);
          g.quadraticCurveTo(cx + s * rx * 0.36, cy + ry * 0.5, cx + s * rx * 0.3, cy + ry * 0.72);
          g.stroke();
          for (let k = 0; k < 3; k++) line(g, cx + s * rx * 0.58, cy - ry * 0.04 + k * 5, cx + s * rx * 0.72, cy - ry * 0.08 + k * 8);
        }
      },
    });
    const front = mk(gh.canvas.width, gh.canvas.height), fg = front.getContext('2d');
    fg.setTransform(gh.getTransform());
    const cap = new Path2D();
    cap.moveTo(cx - rx - 6, cy + ry * 0.1);
    cap.bezierCurveTo(cx - rx - 12, cy - ry * 0.8, cx - rx * 0.4, cy - ry - 18, cx, cy - ry - 14);
    cap.bezierCurveTo(cx + rx * 0.5, cy - ry - 16, cx + rx + 14, cy - ry * 0.7, cx + rx + 8, cy + ry * 0.2);
    cap.lineTo(cx + rx * 0.9, cy + ry * 0.2);
    cap.lineTo(cx - rx * 0.9, cy + ry * 0.2);
    cap.closePath();
    fg.fillStyle = S.hair;
    fg.fill(cap);
    fg.save();
    fg.clip(cap);
    strands(fg, rnd, 120, (r) => [cx - 4 + r() * 8, cy - ry - 8], (r) => { const s = r() < 0.5 ? -1 : 1; return [cx + s * (rx + 6), cy + r() * ry * 0.3]; },
      (r) => `rgba(${S.hairHi},${0.12 + r() * 0.22})`, [1, 2]);
    fg.restore();
    const win = new Path2D();
    win.moveTo(cx - rx * 0.9, 920);
    win.lineTo(cx - rx * 0.9, cy);
    win.bezierCurveTo(cx - rx * 0.9, cy - ry * 0.4, cx - rx * 0.6, cy - ry * 0.62, cx, cy - ry * 0.6);
    win.bezierCurveTo(cx + rx * 0.6, cy - ry * 0.62, cx + rx * 0.9, cy - ry * 0.4, cx + rx * 0.9, cy);
    win.lineTo(cx + rx * 0.9, 920);
    win.closePath();
    fg.save();
    fg.globalCompositeOperation = 'destination-out';
    fg.fill(win);
    fg.restore();
    gh.save();
    gh.setTransform(1, 0, 0, 1, 0, 0);
    gh.drawImage(front, 0, 0);
    gh.restore();
  }

  // ---- Rosa (só aparece no retrato de 1974): tranças, chapéu de palha e sardas pintadas
  function drawRosa(gb, gd, gh, S, E, rnd) {
    const { cx, cy, rx, ry } = S.head;
    gb.fillStyle = S.hair;
    ell(gb, cx, cy - 10, rx + 14, ry + 8);
    gb.fill();
    gd.fillStyle = S.skin;
    gd.fill(neckPath(S, 330, 470));
    soft(gd, 300, 392, 60, 'rgba(20,10,6,0.6)', 0.5);
    const torso = torsoPath(S);
    gd.fillStyle = S.cloth;
    gd.fill(torso);
    gd.save();
    gd.clip(torso);
    gd.fillStyle = 'rgba(40,30,30,0.35)';
    for (let y = 440; y < 920; y += 22) for (let x = 100; x < 520; x += 22) if (((x + y) / 22) % 2 < 1) gd.fillRect(x, y, 11, 11);
    gd.fillStyle = 'rgba(240,235,225,0.75)';
    for (let x = 200; x < 400; x += 12) { ell(gd, x, 462 + Math.abs(x - 300) * 0.2, 7, 5); gd.fill(); }
    gd.restore();
    gh.fillStyle = S.skin;
    gh.fill(facePath(S.head));
    faceFeatures(gh, S, E, rnd, {
      extra(g) {
        g.fillStyle = 'rgba(60,30,20,0.55)';
        for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { ell(g, cx + s * rx * (0.3 + rnd() * 0.3), cy + ry * (0.18 + rnd() * 0.16), 1.5, 1.5); g.fill(); }
      },
    });
    const front = mk(gh.canvas.width, gh.canvas.height), fg = front.getContext('2d');
    fg.setTransform(gh.getTransform());
    fg.fillStyle = S.hair;
    const cap = new Path2D();
    cap.moveTo(cx - rx - 8, cy + ry * 0.3);
    cap.bezierCurveTo(cx - rx - 10, cy - ry, cx + rx + 10, cy - ry, cx + rx + 8, cy + ry * 0.3);
    cap.closePath();
    fg.fill(cap);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 11; k++) {
        const y = cy + ry * 0.3 + k * 26, x = cx + s * (rx + 2 + k * 2.6);
        fg.fillStyle = S.hair;
        ell(fg, x, y, 15 - k * 0.5, 16, s * (k % 2 ? 0.4 : -0.4));
        fg.fill();
        fg.strokeStyle = `rgba(${S.hairHi},0.3)`;
        fg.lineWidth = 1.5;
        fg.stroke();
      }
      fg.fillStyle = '#c0392b';
      ell(fg, cx + s * (rx + 32), cy + ry * 0.3 + 11 * 26, 12, 6);
      fg.fill();
    }
    const win = new Path2D();
    win.moveTo(cx - rx * 0.88, cy + ry * 1.5);
    win.lineTo(cx - rx * 0.88, cy);
    win.bezierCurveTo(cx - rx * 0.88, cy - ry * 0.5, cx - rx * 0.5, cy - ry * 0.6, cx, cy - ry * 0.56);
    win.bezierCurveTo(cx + rx * 0.5, cy - ry * 0.6, cx + rx * 0.88, cy - ry * 0.5, cx + rx * 0.88, cy);
    win.lineTo(cx + rx * 0.88, cy + ry * 1.5);
    win.closePath();
    fg.save();
    fg.globalCompositeOperation = 'destination-out';
    fg.fill(win);
    fg.restore();
    // chapéu de palha
    fg.fillStyle = '#c9b07a';
    ell(fg, cx, cy - ry * 0.72, rx * 2.1, 26, -0.04);
    fg.fill();
    fg.beginPath();
    fg.moveTo(cx - rx * 0.9, cy - ry * 0.72);
    fg.bezierCurveTo(cx - rx * 0.9, cy - ry * 1.6, cx + rx * 0.9, cy - ry * 1.6, cx + rx * 0.9, cy - ry * 0.72);
    fg.closePath();
    fg.fill();
    fg.strokeStyle = 'rgba(90,70,30,0.5)';
    fg.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) { fg.beginPath(); fg.ellipse(cx, cy - ry * 0.72, rx * (0.95 + i * 0.13), 8 + i * 2, -0.04, Math.PI * 0.05, Math.PI * 0.95); fg.stroke(); }
    fg.fillStyle = '#7a2a20';
    fg.fillRect(cx - rx * 0.9, cy - ry * 0.86, rx * 1.8, 12);
    gh.save();
    gh.setTransform(1, 0, 0, 1, 0, 0);
    gh.drawImage(front, 0, 0);
    gh.restore();
  }

  const CHARS = {
    helena: { head: { cx: 300, cy: 282, rx: 70, ry: 94, jaw: 0.4 }, neckW: 29, sw: 160, skin: '#b88f72', hair: '#1c1310', hairHi: '160,115,80', cloth: '#cbb998', lip: '150,60,55', draw: drawHelena, brushAng: Math.PI / 2 },
    heitor: { head: { cx: 300, cy: 280, rx: 76, ry: 98, jaw: 0.56 }, neckW: 38, sw: 192, skin: '#ab8367', hair: '#17100d', hairHi: '150,105,70', cloth: '#c9c3b6', vest: '#3b2b21', browW: 4.2, browA: 0.7, mouthW: 0.27, lip: '120,60,50', draw: drawHeitor, brushAng: Math.PI / 2 },
    cida: { head: { cx: 300, cy: 300, rx: 68, ry: 88, jaw: 0.5 }, neckW: 30, sw: 172, shY: 480, skin: '#a27e68', hair: '#908a85', hairHi: '235,230,225', cloth: '#2c2a38', shawl: '#3d3337', lip: '120,70,65', draw: drawCida, brushAng: Math.PI / 2 },
    rosa: { head: { cx: 300, cy: 290, rx: 64, ry: 86, jaw: 0.42 }, neckW: 27, sw: 150, skin: '#c09276', hair: '#2a1d16', hairHi: '170,125,90', cloth: '#b9a98c', lip: '150,60,55', draw: drawRosa, brushAng: Math.PI / 2 },
  };
  const EXPR = {
    neutro: { rot: 0, dy: 0, warm: '255,176,104', cool: '120,150,215', wA: 0.95, cA: 0.7, mouth: 0, brow: null },
    sorriso: { rot: -0.03, dy: -6, warm: '255,192,120', cool: '130,160,220', wA: 1.15, cA: 0.55, tint: '255,170,110,0.08', mouth: 1, brow: 'alegre' },
    triste: { rot: 0.07, dy: 10, warm: '225,160,115', cool: '120,160,235', wA: 0.55, cA: 1, tint: '60,90,150,0.16', mouth: -0.8, brow: 'triste', tear: true },
    medo: { rot: 0.0, dy: 3, warm: '215,170,135', cool: '150,185,245', wA: 0.6, cA: 1.15, tint: '80,110,170,0.2', mouth: -0.5, brow: 'medo', wide: true, tremble: true },
    sombrio: { rot: -0.02, dy: 0, warm: '200,30,40', cool: '190,235,205', wA: 1.1, cA: 0.85, tint: '20,0,10,0.38', mouth: -0.2, brow: 'raiva', eyes: true, smoke: true },
  };

  function rim(c, res, rgb, dx, alpha, haloA) {
    const w = c.width, h = c.height;
    const t = mk(w, h), tg = t.getContext('2d');
    tg.drawImage(c, 0, 0);
    tg.globalCompositeOperation = 'source-in';
    tg.fillStyle = `rgb(${rgb})`;
    tg.fillRect(0, 0, w, h);
    tg.globalCompositeOperation = 'destination-out';
    tg.drawImage(c, dx * res, -Math.abs(dx) * 0.35 * res);
    const b = softBlur(t, 2.2 * res);
    const g = c.getContext('2d');
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = Math.min(1, alpha);
    g.drawImage(b, 0, 0);
    if (haloA) {
      g.globalCompositeOperation = 'destination-over';
      g.globalAlpha = haloA;
      g.drawImage(softBlur(t, 9 * res), 0, 0);
    }
    g.restore();
  }
  function finishLayer(c, res, E) {
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = lin(g, 0.18 * w, 0, 0.9 * w, 0, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,0.4)'], [1, 'rgba(0,0,0,0.8)']]);
    g.fillRect(0, 0, w, h);
    g.fillStyle = lin(g, 0, 0.42 * h, 0, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.62)']]);
    g.fillRect(0, 0, w, h);
    const rg = g.createRadialGradient(0.22 * w, 0.3 * h, 0, 0.22 * w, 0.3 * h, 0.62 * w);
    rg.addColorStop(0, `rgba(${E.warm},${0.16 * E.wA})`);
    rg.addColorStop(1, `rgba(${E.warm},0)`);
    g.fillStyle = rg;
    g.fillRect(0, 0, w, h);
    if (E.tint) { g.fillStyle = `rgba(${E.tint})`; g.fillRect(0, 0, w, h); }
    g.restore();
    rim(c, res, E.warm, 9, 0.9 * E.wA, 0.28 * E.wA);
    rim(c, res, E.cool, -6, 0.62 * E.cA, 0.18 * E.cA);
  }

  const charMemo = new Map();
  function buildChar(nome, expr, res) {
    const key = nome + '|' + expr + '|' + res;
    if (charMemo.has(key)) { const v = charMemo.get(key); charMemo.delete(key); charMemo.set(key, v); return v; }
    const S = CHARS[nome], E = EXPR[expr];
    const L = { back: mk(CW * res, CH * res), body: mk(CW * res, CH * res), head: mk(CW * res, CH * res), res, edges: [] };
    const gb = L.back.getContext('2d'), gd = L.body.getContext('2d'), gh = L.head.getContext('2d');
    for (const g of [gb, gd, gh]) g.scale(res, res);
    S.draw(gb, gd, gh, S, E, mulberry32(hashStr('pers:' + nome)));
    const br = mulberry32(hashStr('pincel:' + nome + expr));
    for (const c of [L.back, L.body, L.head]) {
      brushPass(c, br, { r: res, n: 26000, len: [4, 12], width: [1.5, 3.5], alpha: 0.28, ang: S.brushAng, spread: 0.8, smear: 5, atop: true, vary: 0.1 });
      finishLayer(c, res, E);
    }
    if (E.smoke) {
      const rnd = mulberry32(99);
      for (const c of [L.body, L.back]) {
        const g = c.getContext('2d');
        g.save();
        g.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 80; i++) soft(g, 80 + rnd() * 440, 700 + rnd() * 220, 20 + rnd() * 40, `rgba(0,0,0,${0.3 + rnd() * 0.4})`);
        g.restore();
      }
      const all = composeChar(L);
      const data = all.getContext('2d').getImageData(0, 0, all.width, all.height).data;
      const aw = all.width, ah = all.height;
      const A = (x, y) => { const ix = Math.round(x * res), iy = Math.round(y * res); return ix < 0 || iy < 0 || ix >= aw || iy >= ah ? 0 : data[(iy * aw + ix) * 4 + 3]; };
      let guard = 0;
      while (L.edges.length < 46 && guard++ < 6000) {
        const x = 60 + rnd() * 480, y = 150 + rnd() * 700;
        if (A(x, y) > 120 && (A(x - 16, y) < 20 || A(x + 16, y) < 20 || A(x, y - 16) < 20)) L.edges.push({ x, y, p: rnd(), d: x < 300 ? -1 : 1, s: 0.18 + rnd() * 0.22 });
      }
    }
    charMemo.set(key, L);
    while (charMemo.size > 8) charMemo.delete(charMemo.keys().next().value);
    return L;
  }
  function composeChar(L) {
    const c = mk(L.back.width, L.back.height), g = c.getContext('2d');
    g.drawImage(L.back, 0, 0);
    g.drawImage(L.body, 0, 0);
    g.drawImage(L.head, 0, 0);
    return c;
  }
  function sepia(c) {
    const o = mk(c.width, c.height), g = o.getContext('2d');
    g.drawImage(c, 0, 0);
    const d = g.getImageData(0, 0, o.width, o.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      let l = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255;
      l = Math.pow(l, 0.62) * 1.12;
      p[i] = clamp(l * 255 * 1.05 + 18, 0, 255);
      p[i + 1] = clamp(l * 255 * 0.88 + 8, 0, 255);
      p[i + 2] = clamp(l * 255 * 0.64, 0, 255);
    }
    g.putImageData(d, 0, 0);
    return o;
  }

  // ======================================================================== API
  window.Pintor = {
    cenas: Object.keys(SCENES),
    personagens: ['helena', 'heitor', 'cida'],
    expressoes: Object.keys(EXPR),

    cena(nome, ctx, t, opts, cache) {
      opts = opts || {};
      cache = cache || {};
      if (!SCENES[nome]) nome = 'preto';
      const S = SCENES[nome];
      const r = resOf(ctx);
      if (!cache.base || cache.r !== r || cache.nome !== nome) {
        cache.base = buildScene(nome, opts, r);
        cache.r = r;
        cache.nome = nome;
        cache.st = {};
        if (S.prep) S.prep(cache.st, opts, mulberry32(hashStr('anim:' + nome)));
      }
      ctx.drawImage(cache.base, 0, 0, W, H);
      if (S.anim) {
        ctx.save();
        S.anim(ctx, t || 0, opts, cache.st);
        ctx.restore();
      }
    },

    personagem(nome, expr, ctx, t, cache) {
      cache = cache || {};
      if (!CHARS[nome] || nome === 'rosa') nome = 'helena';
      let e = EXPR[expr] ? expr : 'neutro';
      if (nome === 'cida' && e !== 'triste' && e !== 'medo') e = 'neutro';
      const res = resOf(ctx);
      const key = nome + '|' + e + '|' + res;
      const L = cache[key] || (cache[key] = buildChar(nome, e, res));
      const E = EXPR[e];
      t = t || 0;
      const br = Math.sin(t * 1.7);
      ctx.save();
      if (E.tremble) ctx.translate(Math.sin(t * 41) * 1.1 + Math.sin(t * 23) * 0.6, Math.cos(t * 37) * 0.8);
      const headT = () => {
        ctx.translate(300, 420);
        ctx.rotate(E.rot + Math.sin(t * 0.6) * 0.006);
        ctx.translate(-300, -420 + E.dy - br * 1.6);
      };
      ctx.save();
      headT();
      ctx.drawImage(L.back, 0, 0, CW, CH);
      ctx.restore();
      ctx.save();
      ctx.translate(300, CH);
      ctx.scale(1 + br * 0.002, 1 + br * 0.004);
      ctx.translate(-300, -CH);
      ctx.drawImage(L.body, 0, 0, CW, CH);
      ctx.restore();
      ctx.save();
      headT();
      ctx.drawImage(L.head, 0, 0, CW, CH);
      const h = CHARS[nome].head, ey = h.cy - h.ry * 0.05, ex = h.rx * 0.38;
      if (E.eyes) {
        const a = 0.75 + 0.25 * fl(t * 2.1);
        for (const s of [-1, 1]) {
          glow(ctx, h.cx + s * ex, ey + 1, 26, '255,235,235', a * 0.55);
          ctx.fillStyle = `rgba(255,250,250,${a})`;
          ell(ctx, h.cx + s * ex, ey + 1, h.rx * 0.11, h.ry * 0.03);
          ctx.fill();
        }
      }
      if (E.tear) {
        const ph = (t * 0.25) % 1;
        const ty = ey + h.ry * 0.12 + ph * h.ry * 0.3;
        glow(ctx, h.cx - ex + 3, ty, 7, '210,230,255', 0.6 * Math.sin(ph * Math.PI));
      }
      ctx.restore();
      if (E.smoke && L.edges.length) {
        for (const p of L.edges) {
          const ph = (t * p.s + p.p) % 1;
          const x = p.x + p.d * ph * 28 + Math.sin(t * 1.4 + p.p * 9) * 5, y = p.y - ph * 70;
          glow(ctx, x, y, 18 + ph * 22, '30,18,26', 0.7 * Math.sin(ph * Math.PI), 'source-over');
        }
      }
      ctx.restore();
    },
  };
})();
