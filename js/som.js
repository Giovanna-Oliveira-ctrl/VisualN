/* Sete Velas — som sintetizado (Web Audio). Nenhum arquivo de áudio é necessário. */
(() => {
  'use strict';

  let ac = null;
  let mestre, busMusica, busAmbiente, busEfeitos, envioReverb, ruidoBranco, ruidoMarrom;
  const vol = { geral: 0.8, musica: 0.7, efeitos: 0.9 };
  let musicaAtual = { nome: 'nada', parar: null };
  let ambienteAtual = { nome: 'nada', parar: null };
  let pendente = { musica: null, ambiente: null };

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const agora = () => ac.currentTime;
  const aleat = (a, b) => a + Math.random() * (b - a);

  function iniciar() {
    if (ac) {
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ac = new AC(); } catch { ac = null; return; }
    mestre = ac.createGain();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    mestre.connect(comp);
    comp.connect(ac.destination);
    busMusica = ac.createGain();
    busAmbiente = ac.createGain();
    busEfeitos = ac.createGain();
    busMusica.connect(mestre);
    busAmbiente.connect(mestre);
    busEfeitos.connect(mestre);
    const reverb = ac.createConvolver();
    reverb.buffer = impulso(3.4, 2.6);
    envioReverb = ac.createGain();
    envioReverb.gain.value = 0.5;
    envioReverb.connect(reverb);
    reverb.connect(mestre);
    ruidoBranco = criarRuido(4, false);
    ruidoMarrom = criarRuido(6, true);
    aplicarVolumes();
    if (pendente.ambiente) ambiente(pendente.ambiente);
    if (pendente.musica) musica(pendente.musica);
  }

  function impulso(seg, decaimento) {
    const n = Math.floor(ac.sampleRate * seg);
    const buf = ac.createBuffer(2, n, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decaimento);
    }
    return buf;
  }

  function criarRuido(seg, marrom) {
    const n = Math.floor(ac.sampleRate * seg);
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    let ultimo = 0;
    for (let i = 0; i < n; i++) {
      const b = Math.random() * 2 - 1;
      if (marrom) {
        ultimo = (ultimo + 0.02 * b) / 1.02;
        d[i] = ultimo * 3.5;
      } else d[i] = b;
    }
    return buf;
  }

  function fonteRuido(marrom = false) {
    const s = ac.createBufferSource();
    s.buffer = marrom ? ruidoMarrom : ruidoBranco;
    s.loop = true;
    s.loopStart = Math.random();
    return s;
  }

  function aplicarVolumes() {
    if (!ac) return;
    const t = agora();
    mestre.gain.setTargetAtTime(vol.geral, t, 0.05);
    busMusica.gain.setTargetAtTime(vol.musica, t, 0.05);
    busAmbiente.gain.setTargetAtTime(vol.efeitos * 0.85, t, 0.05);
    busEfeitos.gain.setTargetAtTime(vol.efeitos, t, 0.05);
  }

  function volumes(v) {
    Object.assign(vol, v);
    aplicarVolumes();
  }

  /* ---------- instrumentos ---------- */

  function piano(nota, quando, dur, vel, destino = busMusica, brilho = 1) {
    const f = midi(nota);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.linearRampToValueAtTime(vel, quando + 0.006);
    g.gain.exponentialRampToValueAtTime(vel * 0.32, quando + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur + 1.6);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = (1600 + vel * 3800) * brilho;
    const parciais = [[1, 1], [2, 0.42], [3, 0.16], [4, 0.08], [6, 0.025]];
    for (const [h, a] of parciais) {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * h * (1 + 0.0004 * h * h);
      const og = ac.createGain();
      og.gain.value = a;
      o.connect(og);
      og.connect(g);
      o.start(quando);
      o.stop(quando + dur + 1.8);
    }
    g.connect(lp);
    lp.connect(destino);
    const env = ac.createGain();
    env.gain.value = 0.55;
    lp.connect(env);
    env.connect(envioReverb);
  }

  function caixinha(nota, quando, vel, destino = busMusica) {
    const f = midi(nota);
    for (const [h, a, d] of [[1, 1, 1.6], [4, 0.25, 0.5], [6.8, 0.08, 0.2]]) {
      const o = ac.createOscillator();
      o.type = h === 1 ? 'triangle' : 'sine';
      o.frequency.value = f * h;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, quando);
      g.gain.linearRampToValueAtTime(vel * a, quando + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, quando + d);
      o.connect(g);
      g.connect(destino);
      const e = ac.createGain();
      e.gain.value = 0.7;
      g.connect(e);
      e.connect(envioReverb);
      o.start(quando);
      o.stop(quando + d + 0.05);
    }
  }

  function pad(notas, destino, vel = 0.05, ataque = 3) {
    const g = ac.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(vel, agora(), ataque / 3);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const oscs = [];
    for (const n of notas) {
      for (const d of [-4, 4]) {
        const o = ac.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midi(n);
        o.detune.value = d;
        o.connect(lp);
        o.start();
        oscs.push(o);
      }
    }
    lp.connect(g);
    g.connect(destino);
    const e = ac.createGain();
    e.gain.value = 0.4;
    g.connect(e);
    e.connect(envioReverb);
    return {
      parar(fade = 1.5) {
        const t = agora();
        g.gain.cancelScheduledValues(t);
        g.gain.setTargetAtTime(0.0001, t, fade / 3);
        oscs.forEach((o) => o.stop(t + fade + 0.5));
      },
    };
  }

  /* ---------- músicas ---------- */

  // Valsa da Névoa, em ré menor. Cada compasso: [acorde do baixo, melodia [nota, tempos]].
  const VALSA = [
    [[38, 53, 57], [[69, 2], [65, 1]]],
    [[38, 53, 57], [[74, 2], [72, 1]]],
    [[43, 58, 62], [[70, 2], [69, 1]]],
    [[43, 58, 62], [[67, 3]]],
    [[36, 52, 55], [[64, 1], [67, 1], [72, 1]]],
    [[36, 52, 55], [[70, 2], [69, 1]]],
    [[41, 57, 60], [[69, 2], [67, 1]]],
    [[33, 55, 61], [[69, 1], [73, 1], [76, 1]]],
    [[38, 53, 57], [[77, 2], [76, 1]]],
    [[38, 53, 57], [[74, 2], [69, 1]]],
    [[43, 58, 62], [[70, 2], [74, 1]]],
    [[43, 58, 62], [[67, 2], [70, 1]]],
    [[34, 58, 62], [[74, 2], [72, 1]]],
    [[33, 55, 61], [[73, 2], [64, 1]]],
    [[38, 53, 57], [[74, 3]]],
    [[38, 50, 57], [[0, 3]]],
  ];

  function agendador(passoFn, intervalo) {
    let proximo = agora() + 0.15;
    let i = 0;
    let vivo = true;
    const tick = () => {
      if (!vivo) return;
      while (proximo < agora() + 0.6) {
        proximo += passoFn(i++, proximo);
      }
    };
    const id = setInterval(tick, intervalo);
    tick();
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }

  function tocarValsa(caixa) {
    const batida = 60 / (caixa ? 92 : 78);
    const saida = ac.createGain();
    saida.gain.value = 1;
    saida.connect(busMusica);
    const parar = agendador((i, t) => {
      const [baixo, mel] = VALSA[i % VALSA.length];
      const swing = () => aleat(-0.012, 0.012);
      if (caixa) {
        let tt = t;
        for (const [n, tempos] of mel) {
          if (n) caixinha(n + 12, tt + swing(), 0.16, saida);
          tt += tempos * batida;
        }
        caixinha(baixo[1] + 12, t + batida, 0.05, saida);
        caixinha(baixo[2] + 12, t + 2 * batida, 0.05, saida);
      } else {
        piano(baixo[0], t + swing(), batida * 1.4, 0.2, saida);
        piano(baixo[1], t + batida + swing(), batida * 0.8, 0.075, saida);
        piano(baixo[2], t + batida + swing(), batida * 0.8, 0.07, saida);
        piano(baixo[1], t + 2 * batida + swing(), batida * 0.8, 0.06, saida);
        piano(baixo[2], t + 2 * batida + swing(), batida * 0.8, 0.055, saida);
        let tt = t;
        for (const [n, tempos] of mel) {
          if (n) piano(n, tt + swing(), tempos * batida, 0.24, saida);
          tt += tempos * batida;
        }
      }
      return 3 * batida * ((i % VALSA.length) === 15 ? 1.35 : 1);
    }, 120);
    return (fade = 1.2) => {
      parar();
      const t = agora();
      saida.gain.setTargetAtTime(0.0001, t, fade / 3);
      setTimeout(() => saida.disconnect(), (fade + 3) * 1000);
    };
  }

  function tocarTensao() {
    const saida = ac.createGain();
    saida.gain.value = 0.0001;
    saida.gain.setTargetAtTime(1, agora(), 1.2);
    saida.connect(busMusica);
    const oscs = [];
    for (const [f, a] of [[55, 0.09], [58.3, 0.06], [82.4, 0.04], [116.5, 0.025]]) {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ac.createGain();
      g.gain.value = a;
      const lfo = ac.createOscillator();
      lfo.frequency.value = aleat(0.05, 0.15);
      const lg = ac.createGain();
      lg.gain.value = a * 0.6;
      lfo.connect(lg);
      lg.connect(g.gain);
      o.connect(g);
      g.connect(saida);
      o.start();
      lfo.start();
      oscs.push(o, lfo);
    }
    const parar = agendador((i, t) => {
      coracao(t, 0.55, saida);
      return 1.05;
    }, 150);
    return (fade = 1.5) => {
      parar();
      const t = agora();
      saida.gain.setTargetAtTime(0.0001, t, fade / 3);
      oscs.forEach((o) => o.stop(t + fade + 1));
    };
  }

  function tocarAmanhecer() {
    const saida = ac.createGain();
    saida.gain.value = 1;
    saida.connect(busMusica);
    const p = pad([50, 57, 62, 66], saida, 0.035, 5);
    const arpejo = [62, 66, 69, 74, 69, 66, 64, 67, 71, 74, 71, 67, 62, 66, 69, 73, 76, 73, 69, 66];
    const parar = agendador((i, t) => {
      piano(arpejo[i % arpejo.length], t, 0.9, 0.11, saida, 0.8);
      return 0.62;
    }, 150);
    return (fade = 2) => {
      parar();
      p.parar(fade);
      saida.gain.setTargetAtTime(0.0001, agora(), fade / 3);
    };
  }

  /* ---------- ambientes ---------- */

  function cadeiaRuido(marrom, tipo, freq, q, ganho, destino) {
    const s = fonteRuido(marrom);
    const f = ac.createBiquadFilter();
    f.type = tipo;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.value = ganho;
    s.connect(f);
    f.connect(g);
    g.connect(destino);
    s.start();
    return { s, f, g };
  }

  function ambChuva(forte) {
    const saida = ac.createGain();
    saida.gain.value = 0.0001;
    saida.gain.setTargetAtTime(1, agora(), 1);
    saida.connect(busAmbiente);
    const a = cadeiaRuido(false, 'highpass', 900, 0.4, forte ? 0.16 : 0.09, saida);
    const b = cadeiaRuido(true, 'lowpass', 500, 0.5, forte ? 0.5 : 0.28, saida);
    const fontes = [a.s, b.s];
    const parar = agendador((i, t) => {
      gota(t, saida, forte ? 0.05 : 0.03);
      return aleat(0.04, forte ? 0.12 : 0.25);
    }, 120);
    return (fade = 1.5) => {
      parar();
      const t = agora();
      saida.gain.setTargetAtTime(0.0001, t, fade / 3);
      fontes.forEach((s) => s.stop(t + fade + 1));
    };
  }

  function gota(t, destino, vel) {
    const s = fonteRuido(false);
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = aleat(2500, 6000);
    f.Q.value = 6;
    const g = ac.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    s.connect(f);
    f.connect(g);
    g.connect(destino);
    s.start(t);
    s.stop(t + 0.05);
  }

  function ambVento(intensidade = 1) {
    const saida = ac.createGain();
    saida.gain.value = 0.0001;
    saida.gain.setTargetAtTime(1, agora(), 1.5);
    saida.connect(busAmbiente);
    const v = cadeiaRuido(false, 'bandpass', 500, 0.9, 0.22 * intensidade, saida);
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = ac.createGain();
    lg.gain.value = 320;
    lfo.connect(lg);
    lg.connect(v.f.frequency);
    const lfo2 = ac.createOscillator();
    lfo2.frequency.value = 0.11;
    const lg2 = ac.createGain();
    lg2.gain.value = 0.12 * intensidade;
    lfo2.connect(lg2);
    lg2.connect(v.g.gain);
    lfo.start();
    lfo2.start();
    return (fade = 1.5) => {
      const t = agora();
      saida.gain.setTargetAtTime(0.0001, t, fade / 3);
      [v.s, lfo, lfo2].forEach((s) => s.stop(t + fade + 1));
    };
  }

  function ambCasa() {
    const saida = ac.createGain();
    saida.gain.value = 0.0001;
    saida.gain.setTargetAtTime(1, agora(), 1.5);
    saida.connect(busAmbiente);
    const oscs = [];
    for (const [f, a] of [[41.2, 0.07], [41.7, 0.06], [61.7, 0.025]]) {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ac.createGain();
      g.gain.value = a;
      o.connect(g);
      g.connect(saida);
      o.start();
      oscs.push(o);
    }
    const ar = cadeiaRuido(true, 'lowpass', 220, 0.5, 0.12, saida);
    const parar = agendador((i, t) => {
      if (i > 0) rangido(t, saida, 0.05);
      return aleat(7, 15);
    }, 500);
    return (fade = 1.5) => {
      parar();
      const t = agora();
      saida.gain.setTargetAtTime(0.0001, t, fade / 3);
      [...oscs, ar.s].forEach((o) => o.stop(t + fade + 1));
    };
  }

  function ambNoite() {
    const saida = ac.createGain();
    saida.gain.value = 0.0001;
    saida.gain.setTargetAtTime(1, agora(), 1.5);
    saida.connect(busAmbiente);
    const ar = cadeiaRuido(true, 'lowpass', 300, 0.5, 0.08, saida);
    const parar = agendador((i, t) => {
      const n = 2 + Math.floor(Math.random() * 3);
      const f = aleat(4200, 5200);
      for (let k = 0; k < n; k++) grilo(t + k * 0.07, f, saida);
      return aleat(0.5, 1.6);
    }, 150);
    return (fade = 1.5) => {
      parar();
      const t = agora();
      saida.gain.setTargetAtTime(0.0001, t, fade / 3);
      ar.s.stop(t + fade + 1);
    };
  }

  function grilo(t, f, destino) {
    const o = ac.createOscillator();
    o.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.012, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g);
    g.connect(destino);
    o.start(t);
    o.stop(t + 0.06);
  }

  function ambTempestade() {
    const pararChuva = ambChuva(true);
    const pararVento = ambVento(1.4);
    const saida = ac.createGain();
    saida.connect(busAmbiente);
    const parar = agendador((i, t) => {
      if (i > 0) trovao(t, saida, 0.5);
      return aleat(9, 18);
    }, 500);
    return (fade = 1.5) => {
      parar();
      pararChuva(fade);
      pararVento(fade);
      saida.gain.setTargetAtTime(0.0001, agora(), fade / 3);
    };
  }

  /* ---------- efeitos ---------- */

  function envelope(g, t, pico, ataque, queda) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + queda);
  }

  function baque(t, destino, vel = 0.6, freq = 70) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
    const g = ac.createGain();
    envelope(g, t, vel, 0.004, 0.3);
    o.connect(g);
    g.connect(destino);
    o.start(t);
    o.stop(t + 0.4);
    const s = fonteRuido(true);
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 600;
    const gs = ac.createGain();
    envelope(gs, t, vel * 0.8, 0.002, 0.15);
    s.connect(f);
    f.connect(gs);
    gs.connect(destino);
    s.start(t);
    s.stop(t + 0.25);
    const e = ac.createGain();
    e.gain.value = 0.4;
    g.connect(e);
    e.connect(envioReverb);
  }

  function coracao(t, vel, destino = busEfeitos) {
    baque(t, destino, vel, 48);
    baque(t + 0.24, destino, vel * 0.7, 44);
  }

  function rangido(t, destino, vel = 0.12, dur = 1.1) {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    const f0 = aleat(140, 220);
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f0 * 1.5, t + dur * 0.4);
    o.frequency.linearRampToValueAtTime(f0 * 0.8, t + dur);
    const vib = ac.createOscillator();
    vib.frequency.value = 23;
    const vg = ac.createGain();
    vg.gain.value = 18;
    vib.connect(vg);
    vg.connect(o.frequency);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 6;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.15);
    g.gain.linearRampToValueAtTime(vel * 0.6, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp);
    bp.connect(g);
    g.connect(destino);
    const e = ac.createGain();
    e.gain.value = 0.5;
    g.connect(e);
    e.connect(envioReverb);
    o.start(t);
    vib.start(t);
    o.stop(t + dur + 0.1);
    vib.stop(t + dur + 0.1);
  }

  function trovao(t, destino, vel = 0.9) {
    const s = fonteRuido(true);
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(90, t + 3.5);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.06);
    g.gain.setTargetAtTime(vel * 0.5, t + 0.3, 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
    s.connect(f);
    f.connect(g);
    g.connect(destino);
    const e = ac.createGain();
    e.gain.value = 0.5;
    g.connect(e);
    e.connect(envioReverb);
    s.start(t);
    s.stop(t + 4.8);
  }

  function sino(t, destino, base = 196, vel = 0.22) {
    for (const [r, a, d] of [[0.5, 0.5, 6], [1, 1, 4.5], [1.19, 0.5, 3.5], [1.56, 0.35, 3], [2, 0.3, 2.5], [2.51, 0.2, 2], [3.01, 0.12, 1.4]]) {
      const o = ac.createOscillator();
      o.frequency.value = base * r;
      const g = ac.createGain();
      envelope(g, t, vel * a, 0.004, d);
      o.connect(g);
      g.connect(destino);
      const e = ac.createGain();
      e.gain.value = 0.6;
      g.connect(e);
      e.connect(envioReverb);
      o.start(t);
      o.stop(t + d + 0.1);
    }
  }

  function sopro(t, destino, vel = 0.25, dur = 0.35, freq = 1200) {
    const s = fonteRuido(false);
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(freq * 0.4, t + dur);
    f.Q.value = 0.8;
    const g = ac.createGain();
    envelope(g, t, vel, dur * 0.25, dur * 0.75);
    s.connect(f);
    f.connect(g);
    g.connect(destino);
    s.start(t);
    s.stop(t + dur + 0.05);
  }

  const EFEITOS = {
    batida(t) {
      for (let i = 0; i < 3; i++) baque(t + i * 0.55, busEfeitos, 0.9, 60);
    },
    passos(t) {
      for (let i = 0; i < 4; i++) baque(t + i * 0.52, busEfeitos, 0.35, 90);
    },
    porta(t) {
      rangido(t, busEfeitos, 0.16, 1.4);
    },
    sino(t) {
      sino(t, busEfeitos, 196, 0.22);
      sino(t + 2.2, busEfeitos, 196, 0.16);
    },
    relogio(t) {
      for (let i = 0; i < 4; i++) sino(t + i * 1.3, busEfeitos, 147, 0.16);
    },
    trovao(t) {
      trovao(t, busEfeitos, 0.95);
    },
    coracao(t) {
      for (let i = 0; i < 4; i++) coracao(t + i * 0.9, 0.7);
    },
    vela(t) {
      sopro(t, busEfeitos, 0.3, 0.3, 1500);
    },
    acender(t) {
      sopro(t, busEfeitos, 0.35, 0.18, 4000);
      sopro(t + 0.08, busEfeitos, 0.12, 0.6, 900);
    },
    rajada(t) {
      sopro(t, busEfeitos, 0.28, 1.1, 700);
    },
    nota(t) {
      piano(50, t, 2, 0.35, busEfeitos);
    },
    tecla(t) {
      baque(t, busEfeitos, 0.3, 140);
    },
    vidro(t) {
      for (let i = 0; i < 6; i++) {
        const o = ac.createOscillator();
        o.frequency.value = aleat(2500, 7000);
        const g = ac.createGain();
        envelope(g, t + i * 0.02, 0.06, 0.002, aleat(0.2, 0.6));
        o.connect(g);
        g.connect(busEfeitos);
        o.start(t + i * 0.02);
        o.stop(t + 0.8);
      }
      sopro(t, busEfeitos, 0.35, 0.15, 5000);
    },
    arranhar(t) {
      const s = fonteRuido(false);
      const f = ac.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 2400;
      f.Q.value = 3;
      const g = ac.createGain();
      g.gain.value = 0;
      for (let i = 0; i < 26; i++) {
        const tt = t + i * 0.09 + aleat(0, 0.03);
        g.gain.setValueAtTime(0.0001, tt);
        g.gain.linearRampToValueAtTime(0.18, tt + 0.02);
        g.gain.linearRampToValueAtTime(0.0001, tt + 0.07);
      }
      s.connect(f);
      f.connect(g);
      g.connect(busEfeitos);
      s.start(t);
      s.stop(t + 2.6);
    },
    correntes(t) {
      for (let i = 0; i < 9; i++) {
        const tt = t + i * aleat(0.05, 0.14);
        const o = ac.createOscillator();
        o.type = 'square';
        o.frequency.value = aleat(1800, 3200);
        const bp = ac.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = aleat(2500, 4500);
        bp.Q.value = 12;
        const g = ac.createGain();
        envelope(g, tt, 0.12, 0.002, aleat(0.08, 0.25));
        o.connect(bp);
        bp.connect(g);
        g.connect(busEfeitos);
        const e = ac.createGain();
        e.gain.value = 0.5;
        g.connect(e);
        e.connect(envioReverb);
        o.start(tt);
        o.stop(tt + 0.3);
      }
      baque(t + 0.9, busEfeitos, 0.5, 80);
    },
    sussurro(t) {
      for (let i = 0; i < 5; i++) sopro(t + i * 0.28, busEfeitos, 0.12, 0.25, aleat(1800, 3200));
    },
    susto(t) {
      const g = ac.createGain();
      envelope(g, t, 0.32, 0.01, 1.8);
      const ws = ac.createWaveShaper();
      const curva = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 128) - 1;
        curva[i] = Math.tanh(x * 3);
      }
      ws.curve = curva;
      for (const n of [37, 38, 44, 49, 50, 61]) {
        const o = ac.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(midi(n + 12), t);
        o.frequency.exponentialRampToValueAtTime(midi(n + 11), t + 1.8);
        o.connect(ws);
        o.start(t);
        o.stop(t + 2);
      }
      ws.connect(g);
      g.connect(busEfeitos);
      const e = ac.createGain();
      e.gain.value = 0.6;
      g.connect(e);
      e.connect(envioReverb);
      sopro(t, busEfeitos, 0.4, 0.5, 600);
      baque(t, busEfeitos, 0.8, 50);
    },
    onibus(t) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(48, t);
      o.frequency.linearRampToValueAtTime(62, t + 1.5);
      o.frequency.linearRampToValueAtTime(40, t + 5);
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 260;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 5.5);
      o.connect(lp);
      lp.connect(g);
      g.connect(busEfeitos);
      o.start(t);
      o.stop(t + 5.6);
      sopro(t + 0.2, busEfeitos, 0.12, 2.5, 400);
    },
    cartao(t) {
      piano(38, t, 3, 0.22, busEfeitos, 0.6);
      piano(45, t + 0.02, 3, 0.12, busEfeitos, 0.6);
    },
  };

  function efeito(nome) {
    if (!ac) return;
    const fn = EFEITOS[nome];
    if (!fn) return;
    try { fn(agora() + 0.02); } catch (e) { console.warn('som', nome, e); }
  }

  const MUSICAS = {
    valsa: () => tocarValsa(false),
    caixinha: () => tocarValsa(true),
    tensao: tocarTensao,
    amanhecer: tocarAmanhecer,
  };
  const AMBIENTES = {
    chuva: () => ambChuva(false),
    tempestade: ambTempestade,
    vento: () => ambVento(1),
    casa: ambCasa,
    noite: ambNoite,
  };

  function trocar(canal, tabela, nome, registro) {
    if (!ac) {
      pendente[canal] = nome;
      return;
    }
    if (registro.nome === nome) return;
    if (registro.parar) registro.parar();
    registro.nome = nome;
    registro.parar = null;
    const fn = tabela[nome];
    if (fn) {
      try { registro.parar = fn(); } catch (e) { console.warn('som', nome, e); }
    }
  }

  function musica(nome) {
    pendente.musica = nome;
    trocar('musica', MUSICAS, nome || 'nada', musicaAtual);
  }

  function ambiente(nome) {
    pendente.ambiente = nome;
    trocar('ambiente', AMBIENTES, nome || 'nada', ambienteAtual);
  }

  function pararTudo() {
    musica('nada');
    ambiente('nada');
  }

  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend().catch(() => {});
    else ac.resume().catch(() => {});
  });

  window.Som = { iniciar, efeito, musica, ambiente, volumes, pararTudo, get ativo() { return !!ac; } };
})();
