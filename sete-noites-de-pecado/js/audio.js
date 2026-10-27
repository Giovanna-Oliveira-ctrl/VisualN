/* =========================================================================
   SOM
   Músicas, ambientes e efeitos são sintetizados no próprio navegador
   (Web Audio), então o jogo não depende de nenhum arquivo de áudio.

   Para usar arquivos de verdade no lugar de um som sintetizado, coloque o
   arquivo em assets/music/ ou assets/sounds/ e escreva o caminho abaixo, por exemplo:
     musicas: { tema: 'assets/music/tema.mp3' },
     efeitos: { carta: 'assets/sounds/carta.mp3' },
   ========================================================================= */
const ARQUIVOS_DE_AUDIO = {
  musicas: {},
  ambientes: {},
  efeitos: {},
};

window.Som = (() => {
  let ac = null;
  let mestre, busMusica, busAmbiente, busEfeitos, envioReverb, ruidoBranco, ruidoMarrom;
  let config = { volumeGeral: 0.8, volumeMusica: 0.6, volumeEfeitos: 0.8, musicaLigada: true, efeitosLigados: true };
  const canais = { musica: { nome: null, parar: null }, ambiente: { nome: null, parar: null } };
  const pedidos = { musica: null, ambiente: null };

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const agora = () => ac.currentTime;
  const aleat = (a, b) => a + Math.random() * (b - a);

  /* O navegador só deixa tocar som depois de um clique ou toque. */
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
    [busMusica, busAmbiente, busEfeitos].forEach((b) => b.connect(mestre));
    const reverb = ac.createConvolver();
    reverb.buffer = impulso(3.6, 2.4);
    envioReverb = ac.createGain();
    envioReverb.gain.value = 0.5;
    envioReverb.connect(reverb);
    reverb.connect(mestre);
    ruidoBranco = criarRuido(4, false);
    ruidoMarrom = criarRuido(6, true);
    aplicarVolumes();
    if (pedidos.ambiente) ambiente(pedidos.ambiente);
    if (pedidos.musica) musica(pedidos.musica);
  }

  function impulso(seg, queda) {
    const n = Math.floor(ac.sampleRate * seg);
    const buf = ac.createBuffer(2, n, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, queda);
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
      if (marrom) { ultimo = (ultimo + 0.02 * b) / 1.02; d[i] = ultimo * 3.5; } else d[i] = b;
    }
    return buf;
  }

  function fonteRuido(marrom = false) {
    const s = ac.createBufferSource();
    s.buffer = marrom ? ruidoMarrom : ruidoBranco;
    s.loop = true;
    return s;
  }

  function aplicarVolumes() {
    if (!ac) return;
    const t = agora();
    mestre.gain.setTargetAtTime(config.volumeGeral, t, 0.05);
    busMusica.gain.setTargetAtTime(config.musicaLigada ? config.volumeMusica : 0, t, 0.05);
    busAmbiente.gain.setTargetAtTime(config.efeitosLigados ? config.volumeEfeitos * 0.8 : 0, t, 0.05);
    busEfeitos.gain.setTargetAtTime(config.efeitosLigados ? config.volumeEfeitos : 0, t, 0.05);
    for (const a of arquivosTocando) a.atualizar();
  }

  function configurar(novaConfig) {
    config = { ...config, ...novaConfig };
    aplicarVolumes();
  }

  /* ---------- instrumentos ---------- */
  function envelope(g, t, pico, ataque, queda) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + queda);
  }

  function comReverb(no, quanto) {
    const e = ac.createGain();
    e.gain.value = quanto;
    no.connect(e);
    e.connect(envioReverb);
  }

  function piano(nota, quando, dur, vel, destino, brilho = 1) {
    const f = midi(nota);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.linearRampToValueAtTime(vel, quando + 0.006);
    g.gain.exponentialRampToValueAtTime(vel * 0.3, quando + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur + 1.6);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = (1500 + vel * 3500) * brilho;
    for (const [h, a] of [[1, 1], [2, 0.4], [3, 0.15], [4, 0.07], [6, 0.02]]) {
      const o = ac.createOscillator();
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
    comReverb(lp, 0.55);
  }

  // Cravo: som de corda beliscada, para o baile de máscaras
  function cravo(nota, quando, vel, destino) {
    const f = midi(nota);
    const g = ac.createGain();
    envelope(g, quando, vel, 0.003, 0.9);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(5200, quando);
    lp.frequency.exponentialRampToValueAtTime(900, quando + 0.6);
    for (const [tipo, mult, a] of [['sawtooth', 1, 0.5], ['square', 2, 0.15]]) {
      const o = ac.createOscillator();
      o.type = tipo;
      o.frequency.value = f * mult;
      const og = ac.createGain();
      og.gain.value = a;
      o.connect(og);
      og.connect(g);
      o.start(quando);
      o.stop(quando + 1);
    }
    g.connect(lp);
    lp.connect(destino);
    comReverb(lp, 0.4);
  }

  function caixinha(nota, quando, vel, destino) {
    const f = midi(nota);
    for (const [h, a, d] of [[1, 1, 1.5], [4, 0.25, 0.45], [6.8, 0.08, 0.2]]) {
      const o = ac.createOscillator();
      o.type = h === 1 ? 'triangle' : 'sine';
      o.frequency.value = f * h;
      const g = ac.createGain();
      envelope(g, quando, vel * a, 0.004, d);
      o.connect(g);
      g.connect(destino);
      comReverb(g, 0.7);
      o.start(quando);
      o.stop(quando + d + 0.05);
    }
  }

  function pad(notas, destino, vel = 0.04, ataque = 4, tipo = 'sawtooth', corte = 900) {
    const g = ac.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(vel, agora(), ataque / 3);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = corte;
    const oscs = [];
    for (const n of notas) {
      for (const d of [-5, 5]) {
        const o = ac.createOscillator();
        o.type = tipo;
        o.frequency.value = midi(n);
        o.detune.value = d;
        o.connect(lp);
        o.start();
        oscs.push(o);
      }
    }
    lp.connect(g);
    g.connect(destino);
    comReverb(g, 0.45);
    return (fade = 2) => {
      const t = agora();
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(0.0001, t, fade / 3);
      oscs.forEach((o) => o.stop(t + fade + 0.6));
    };
  }

  /* Agenda notas um pouco à frente, sem travar a página. */
  function agendador(passo, intervalo = 120) {
    let proximo = agora() + 0.15;
    let i = 0;
    let vivo = true;
    const tick = () => {
      if (!vivo) return;
      while (proximo < agora() + 0.6) proximo += passo(i++, proximo);
    };
    const id = setInterval(tick, intervalo);
    tick();
    return () => { vivo = false; clearInterval(id); };
  }

  function canalComSaida(destino) {
    const saida = ac.createGain();
    saida.gain.value = 0.0001;
    saida.gain.setTargetAtTime(1, agora(), 0.8);
    saida.connect(destino);
    return saida;
  }

  function fechar(saida, paradas, fade = 1.5) {
    paradas.forEach((p) => p && p(fade));
    const t = agora();
    saida.gain.cancelScheduledValues(t);
    saida.gain.setTargetAtTime(0.0001, t, fade / 3);
    setTimeout(() => saida.disconnect(), (fade + 3) * 1000);
  }

  /* ---------- músicas ---------- */

  // Tema principal: piano lento em mi menor sobre um órgão distante.
  const TEMA = [[64, 2], [67, 1], [71, 3], [69, 1.5], [67, 0.5], [66, 1], [64, 3], [0, 1],
    [64, 1], [66, 1], [67, 1], [71, 2], [74, 1], [72, 3], [71, 2], [0, 1]];
  function musicaTema() {
    const saida = canalComSaida(busMusica);
    const p = pad([40, 47, 52, 55], saida, 0.03, 5, 'triangle', 700);
    const batida = 60 / 64;
    let k = 0;
    const parar = agendador((i, t) => {
      const [n, tempos] = TEMA[k % TEMA.length];
      k++;
      if (n) piano(n, t, tempos * batida, 0.2, saida);
      if (k % 4 === 1) piano(40 + (Math.floor(k / 8) % 2 ? 3 : 0), t, 3, 0.12, saida, 0.7);
      return tempos * batida;
    }, 150);
    return (f) => fechar(saida, [parar, p], f);
  }

  // Campus: arpejos suaves em lá menor e fá maior.
  function musicaCampus() {
    const saida = canalComSaida(busMusica);
    const acordes = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 56, 59, 64]];
    const parar = agendador((i, t) => {
      const a = acordes[Math.floor(i / 8) % acordes.length];
      const ordem = [0, 1, 2, 3, 2, 1, 2, 3];
      piano(a[ordem[i % 8]], t, 0.8, i % 8 === 0 ? 0.16 : 0.1, saida, 0.8);
      if (i % 8 === 0) piano(a[0] - 12, t, 3, 0.12, saida, 0.6);
      return 0.42;
    }, 150);
    return (f) => fechar(saida, [parar], f);
  }

  // Mistério: zumbido grave e notas soltas de piano, sem ritmo previsível.
  function musicaMisterio() {
    const saida = canalComSaida(busMusica);
    const p = pad([33, 40, 44], saida, 0.035, 6, 'sawtooth', 380);
    const escala = [69, 71, 72, 76, 77, 81, 84];
    const parar = agendador((i, t) => {
      if (i > 0) piano(escala[Math.floor(Math.random() * escala.length)], t, 2, aleat(0.06, 0.12), saida, 0.7);
      return aleat(2.2, 4.5);
    }, 300);
    return (f) => fechar(saida, [parar, p], f);
  }

  // Baile: valsa de cravo em ré menor, elegante e um pouco torta.
  const VALSA_BAILE = [
    [[38, 57, 62], [[74, 1], [77, 1], [76, 1]]], [[38, 57, 62], [[74, 2], [69, 1]]],
    [[43, 58, 62], [[70, 1], [74, 1], [79, 1]]], [[43, 58, 62], [[77, 2], [76, 1]]],
    [[45, 57, 61], [[76, 1], [73, 1], [69, 1]]], [[45, 57, 61], [[67, 2], [64, 1]]],
    [[38, 57, 62], [[65, 1], [69, 1], [74, 1]]], [[45, 55, 61], [[73, 3]]],
  ];
  function musicaBaile() {
    const saida = canalComSaida(busMusica);
    const batida = 60 / 132;
    const parar = agendador((i, t) => {
      const [baixo, mel] = VALSA_BAILE[i % VALSA_BAILE.length];
      cravo(baixo[0], t, 0.16, saida);
      cravo(baixo[1], t + batida, 0.07, saida);
      cravo(baixo[2], t + batida, 0.06, saida);
      cravo(baixo[1], t + 2 * batida, 0.06, saida);
      cravo(baixo[2], t + 2 * batida, 0.05, saida);
      let tt = t;
      for (const [n, tempos] of mel) {
        cravo(n, tt, 0.13, saida);
        tt += tempos * batida;
      }
      return 3 * batida;
    }, 120);
    return (f) => fechar(saida, [parar], f);
  }

  // Romance: acordes quentes e um piano que demora em cada nota.
  function musicaRomance() {
    const saida = canalComSaida(busMusica);
    const p = pad([49, 56, 61, 65], saida, 0.025, 6, 'triangle', 1100);
    const frase = [73, 72, 68, 65, 0, 68, 70, 72, 70, 68, 0, 0, 65, 68, 73, 75, 77, 75, 73, 0];
    const parar = agendador((i, t) => {
      const n = frase[i % frase.length];
      if (n) piano(n, t, 1.4, 0.14, saida, 0.85);
      if (i % 10 === 0) piano(i % 20 === 0 ? 37 : 42, t, 4, 0.12, saida, 0.6);
      return 0.75;
    }, 150);
    return (f) => fechar(saida, [parar, p], f);
  }

  // Tensão: batimento cardíaco sobre um acorde dissonante.
  function musicaTensao() {
    const saida = canalComSaida(busMusica);
    const p = pad([36, 37, 43], saida, 0.04, 2, 'sawtooth', 300);
    const parar = agendador((i, t) => { coracao(t, 0.5, saida); return 1.05; }, 150);
    return (f) => fechar(saida, [parar, p], f);
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
    return { s, f, g, parar: (fade = 1.5) => s.stop(agora() + fade + 1) };
  }

  function lfo(alvo, freq, profundidade) {
    const o = ac.createOscillator();
    o.frequency.value = freq;
    const g = ac.createGain();
    g.gain.value = profundidade;
    o.connect(g);
    g.connect(alvo);
    o.start();
    return (fade = 1.5) => o.stop(agora() + fade + 1);
  }

  function ambienteChuva() {
    const saida = canalComSaida(busAmbiente);
    const a = cadeiaRuido(false, 'highpass', 900, 0.4, 0.1, saida);
    const b = cadeiaRuido(true, 'lowpass', 500, 0.5, 0.3, saida);
    const parar = agendador((i, t) => { gota(t, saida); return aleat(0.05, 0.22); }, 120);
    return (f) => fechar(saida, [parar, a.parar, b.parar], f);
  }

  function gota(t, destino) {
    const s = fonteRuido(false);
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = aleat(2500, 6000);
    f.Q.value = 6;
    const g = ac.createGain();
    envelope(g, t, 0.03, 0.001, 0.03);
    s.connect(f);
    f.connect(g);
    g.connect(destino);
    s.start(t);
    s.stop(t + 0.06);
  }

  function ambienteVento() {
    const saida = canalComSaida(busAmbiente);
    const v = cadeiaRuido(false, 'bandpass', 500, 0.9, 0.2, saida);
    const p1 = lfo(v.f.frequency, 0.07, 320);
    const p2 = lfo(v.g.gain, 0.11, 0.1);
    return (f) => fechar(saida, [v.parar, p1, p2], f);
  }

  function ambienteNoite() {
    const saida = canalComSaida(busAmbiente);
    const ar = cadeiaRuido(true, 'lowpass', 300, 0.5, 0.07, saida);
    const parar = agendador((i, t) => {
      const n = 2 + Math.floor(Math.random() * 3);
      const f = aleat(4200, 5200);
      for (let k = 0; k < n; k++) {
        const o = ac.createOscillator();
        o.frequency.value = f;
        const g = ac.createGain();
        envelope(g, t + k * 0.07, 0.01, 0.01, 0.04);
        o.connect(g);
        g.connect(saida);
        o.start(t + k * 0.07);
        o.stop(t + k * 0.07 + 0.07);
      }
      return aleat(0.6, 1.8);
    }, 150);
    return (f) => fechar(saida, [parar, ar.parar], f);
  }

  function ambienteLago() {
    const saida = canalComSaida(busAmbiente);
    const agua = cadeiaRuido(true, 'lowpass', 380, 0.6, 0.35, saida);
    const p = lfo(agua.g.gain, 0.18, 0.2);
    const parar = agendador((i, t) => { if (i) respingo(t, saida, 0.04); return aleat(1.5, 4); }, 200);
    return (f) => fechar(saida, [parar, agua.parar, p], f);
  }

  function respingo(t, destino, vel) {
    const s = fonteRuido(false);
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(300, t + 0.3);
    const g = ac.createGain();
    envelope(g, t, vel, 0.02, 0.35);
    s.connect(f);
    f.connect(g);
    g.connect(destino);
    s.start(t);
    s.stop(t + 0.45);
  }

  function ambienteFesta() {
    const saida = canalComSaida(busAmbiente);
    const vozes = cadeiaRuido(true, 'bandpass', 420, 1.2, 0.22, saida);
    const p = lfo(vozes.f.frequency, 0.3, 120);
    const parar = agendador((i, t) => {
      if (i && Math.random() < 0.5) tilintar(t, saida);
      return aleat(0.8, 2.6);
    }, 200);
    return (f) => fechar(saida, [parar, vozes.parar, p], f);
  }

  function tilintar(t, destino) {
    for (let k = 0; k < 2; k++) {
      const o = ac.createOscillator();
      o.frequency.value = aleat(2800, 4200);
      const g = ac.createGain();
      envelope(g, t + k * 0.05, 0.02, 0.002, 0.4);
      o.connect(g);
      g.connect(destino);
      o.start(t + k * 0.05);
      o.stop(t + 0.6);
    }
  }

  function ambienteFogo() {
    const saida = canalComSaida(busAmbiente);
    const ronco = cadeiaRuido(true, 'lowpass', 200, 0.7, 0.4, saida);
    const parar = agendador((i, t) => {
      const s = fonteRuido(false);
      const f = ac.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 1500;
      const g = ac.createGain();
      envelope(g, t, aleat(0.04, 0.12), 0.001, 0.02);
      s.connect(f);
      f.connect(g);
      g.connect(saida);
      s.start(t);
      s.stop(t + 0.04);
      return aleat(0.03, 0.25);
    }, 100);
    return (f) => fechar(saida, [parar, ronco.parar], f);
  }

  function ambienteBiblioteca() {
    const saida = canalComSaida(busAmbiente);
    const sala = cadeiaRuido(true, 'lowpass', 250, 0.5, 0.06, saida);
    const parar = agendador((i, t) => {
      const o = ac.createOscillator();
      o.frequency.value = i % 2 ? 1900 : 2200;
      const g = ac.createGain();
      envelope(g, t, 0.012, 0.001, 0.03);
      o.connect(g);
      g.connect(saida);
      o.start(t);
      o.stop(t + 0.05);
      return 1;
    }, 200);
    return (f) => fechar(saida, [parar, sala.parar], f);
  }

  /* ---------- efeitos ---------- */
  function baque(t, destino, vel = 0.6, freq = 70) {
    const o = ac.createOscillator();
    o.frequency.setValueAtTime(freq * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
    const g = ac.createGain();
    envelope(g, t, vel, 0.004, 0.3);
    o.connect(g);
    g.connect(destino);
    o.start(t);
    o.stop(t + 0.4);
    comReverb(g, 0.4);
  }

  function coracao(t, vel, destino = busEfeitos) {
    baque(t, destino, vel, 48);
    baque(t + 0.24, destino, vel * 0.7, 44);
  }

  function sopro(t, destino, vel, dur, freq) {
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

  function sino(t, base, vel) {
    for (const [r, a, d] of [[0.5, 0.5, 5], [1, 1, 4], [1.19, 0.5, 3], [1.56, 0.35, 2.6], [2, 0.3, 2.2], [2.51, 0.2, 1.8]]) {
      const o = ac.createOscillator();
      o.frequency.value = base * r;
      const g = ac.createGain();
      envelope(g, t, vel * a, 0.004, d);
      o.connect(g);
      g.connect(busEfeitos);
      comReverb(g, 0.6);
      o.start(t);
      o.stop(t + d + 0.1);
    }
  }

  const EFEITOS = {
    trem(t) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(55, t);
      o.frequency.linearRampToValueAtTime(38, t + 4);
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 240;
      const g = ac.createGain();
      envelope(g, t, 0.18, 0.5, 4.5);
      o.connect(lp);
      lp.connect(g);
      g.connect(busEfeitos);
      o.start(t);
      o.stop(t + 5.2);
      sopro(t + 0.3, busEfeitos, 0.12, 2.5, 500);
      for (let i = 0; i < 6; i++) baque(t + 0.5 + i * 0.32 + (i % 2) * 0.1, busEfeitos, 0.12, 120);
    },
    carta(t) {
      sopro(t, busEfeitos, 0.2, 0.25, 3000);
      sopro(t + 0.22, busEfeitos, 0.12, 0.35, 1800);
    },
    pagina(t) {
      sopro(t, busEfeitos, 0.16, 0.4, 2500);
    },
    porta(t) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(170, t);
      o.frequency.linearRampToValueAtTime(260, t + 0.6);
      o.frequency.linearRampToValueAtTime(140, t + 1.3);
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 900;
      bp.Q.value = 6;
      const g = ac.createGain();
      envelope(g, t, 0.12, 0.15, 1.2);
      o.connect(bp);
      bp.connect(g);
      g.connect(busEfeitos);
      o.start(t);
      o.stop(t + 1.5);
    },
    sino(t) {
      sino(t, 196, 0.2);
    },
    meia_noite(t) {
      for (let i = 0; i < 4; i++) sino(t + i * 1.2, 147, 0.17);
    },
    passos(t) {
      for (let i = 0; i < 4; i++) baque(t + i * 0.5, busEfeitos, 0.3, 95);
    },
    batida(t) {
      for (let i = 0; i < 3; i++) baque(t + i * 0.55, busEfeitos, 0.8, 62);
    },
    coracao(t) {
      for (let i = 0; i < 4; i++) coracao(t + i * 0.9, 0.6);
    },
    vela(t) {
      sopro(t, busEfeitos, 0.28, 0.3, 1500);
    },
    agua(t) {
      respingo(t, busEfeitos, 0.3);
      respingo(t + 0.15, busEfeitos, 0.15);
    },
    vidro(t) {
      for (let i = 0; i < 6; i++) {
        const o = ac.createOscillator();
        o.frequency.value = aleat(2500, 7000);
        const g = ac.createGain();
        envelope(g, t + i * 0.02, 0.05, 0.002, aleat(0.2, 0.6));
        o.connect(g);
        g.connect(busEfeitos);
        o.start(t + i * 0.02);
        o.stop(t + 0.8);
      }
      sopro(t, busEfeitos, 0.3, 0.15, 5000);
    },
    caixinha(t) {
      // Seis notas que param no meio, como uma pergunta sem resposta.
      [76, 79, 83, 81, 79, 76].forEach((n, i) => caixinha(n, t + i * 0.42, 0.16, busEfeitos));
    },
    susto(t) {
      const g = ac.createGain();
      envelope(g, t, 0.3, 0.01, 1.8);
      const ws = ac.createWaveShaper();
      const curva = new Float32Array(256);
      for (let i = 0; i < 256; i++) curva[i] = Math.tanh(((i / 128) - 1) * 3);
      ws.curve = curva;
      for (const n of [49, 50, 56, 61, 62]) {
        const o = ac.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(midi(n), t);
        o.frequency.exponentialRampToValueAtTime(midi(n - 1), t + 1.8);
        o.connect(ws);
        o.start(t);
        o.stop(t + 2);
      }
      ws.connect(g);
      g.connect(busEfeitos);
      comReverb(g, 0.6);
      baque(t, busEfeitos, 0.7, 50);
    },
    escolha(t) {
      caixinha(83, t, 0.08, busEfeitos);
      caixinha(88, t + 0.08, 0.06, busEfeitos);
    },
    afinidade(t) {
      caixinha(88, t, 0.05, busEfeitos);
      caixinha(91, t + 0.1, 0.04, busEfeitos);
      caixinha(95, t + 0.2, 0.03, busEfeitos);
    },
    clique(t) {
      const o = ac.createOscillator();
      o.frequency.value = 1400;
      const g = ac.createGain();
      envelope(g, t, 0.03, 0.001, 0.05);
      o.connect(g);
      g.connect(busEfeitos);
      o.start(t);
      o.stop(t + 0.08);
    },
  };

  /* ---------- arquivos de áudio (opcionais) ---------- */
  const arquivosTocando = new Set();
  function tocarArquivo(caminho, tipo) {
    const audio = new Audio(caminho);
    audio.loop = tipo !== 'efeito';
    const item = {
      atualizar() {
        const ligado = tipo === 'musica' ? config.musicaLigada : config.efeitosLigados;
        const vol = tipo === 'musica' ? config.volumeMusica : config.volumeEfeitos;
        audio.volume = ligado ? Math.min(1, vol * config.volumeGeral) : 0;
      },
    };
    item.atualizar();
    arquivosTocando.add(item);
    audio.addEventListener('ended', () => arquivosTocando.delete(item));
    audio.play().catch(() => {});
    return () => { audio.pause(); arquivosTocando.delete(item); };
  }

  const MUSICAS = { tema: musicaTema, campus: musicaCampus, misterio: musicaMisterio, baile: musicaBaile, romance: musicaRomance, tensao: musicaTensao };
  const AMBIENTES = { chuva: ambienteChuva, vento: ambienteVento, noite: ambienteNoite, lago: ambienteLago, festa: ambienteFesta, fogo: ambienteFogo, biblioteca: ambienteBiblioteca };

  function trocar(canal, tabela, arquivos, nome) {
    pedidos[canal] = nome;
    if (!ac) return;
    const c = canais[canal];
    if (c.nome === nome) return;
    if (c.parar) c.parar();
    c.nome = nome;
    c.parar = null;
    if (!nome || nome === 'parar') return;
    try {
      if (arquivos[nome]) c.parar = tocarArquivo(arquivos[nome], canal === 'musica' ? 'musica' : 'ambiente');
      else if (tabela[nome]) c.parar = tabela[nome]();
    } catch (e) { console.warn('Som:', nome, e); }
  }

  function musica(nome) { trocar('musica', MUSICAS, ARQUIVOS_DE_AUDIO.musicas, nome); }
  function ambiente(nome) { trocar('ambiente', AMBIENTES, ARQUIVOS_DE_AUDIO.ambientes, nome); }

  function efeito(nome) {
    if (!ac || !config.efeitosLigados) return;
    try {
      if (ARQUIVOS_DE_AUDIO.efeitos[nome]) tocarArquivo(ARQUIVOS_DE_AUDIO.efeitos[nome], 'efeito');
      else if (EFEITOS[nome]) EFEITOS[nome](agora() + 0.02);
    } catch (e) { console.warn('Som:', nome, e); }
  }

  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend().catch(() => {});
    else ac.resume().catch(() => {});
  });

  return {
    iniciar, configurar, musica, ambiente, efeito,
    pararTudo() { musica(null); ambiente(null); },
    get nomes() { return { musicas: Object.keys(MUSICAS), ambientes: Object.keys(AMBIENTES), efeitos: Object.keys(EFEITOS) }; },
  };
})();
