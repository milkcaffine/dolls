(function () {
  var canvas = document.getElementById('atelierBgCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var audioBtn = document.getElementById('atelierAudioBtn');

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var w = 0;
  var h = 0;
  var dpr = 1;
  var targetX = 0.5;
  var targetY = 0.35;
  var spotX = 0.5;
  var spotY = 0.35;
  var rafId = null;
  var isAnniversary = false;

  var motes = [];
  var ripples = [];

  // Warm pentatonic music-box scale (C5, D5, E5, G5, A5, C6, D6, E6)
  var NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
  var noteIdx = 0;

  function checkAnniversary() {
    isAnniversary = !!document.querySelector('.upcoming-item.is-today');
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initMotes() {
    motes = [];
    var baseCount = w < 640 ? 24 : 42;
    var count = isAnniversary ? Math.round(baseCount * 1.6) : baseCount;
    for (var i = 0; i < count; i++) {
      var gold = isAnniversary ? (Math.random() > 0.25) : (Math.random() > 0.45);
      motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.6 + 0.9,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -(Math.random() * 0.18 + 0.05),
        alpha: Math.random() * 0.32 + 0.08,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.015 + 0.006,
        color: gold ? '245, 212, 158' : '236, 234, 230'
      });
    }
  }

  // ===== Web Audio: Warm Atelier Pad + Music Box =====
  var ac = null;
  var master = null;
  var ambientOn = true;
  var musicBoxTimer = null;

  function ensureAudio() {
    if (!ac) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ac = new AudioCtx();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function playMusicBoxNote(freq, vol) {
    var ctxA = ensureAudio();
    if (!ctxA) return;
    var now = ctxA.currentTime;
    var osc = ctxA.createOscillator();
    var overtone = ctxA.createOscillator();
    var g = ctxA.createGain();
    var og = ctxA.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2, now);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol || 0.06, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    og.gain.setValueAtTime(0.0001, now);
    og.gain.exponentialRampToValueAtTime((vol || 0.06) * 0.25, now + 0.008);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(g);
    overtone.connect(og);
    og.connect(g);
    g.connect(master || ctxA.destination);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 1.65);
    overtone.stop(now + 0.5);
  }

  function scheduleAtelierNotes() {
    if (musicBoxTimer) clearTimeout(musicBoxTimer);
    musicBoxTimer = setTimeout(function () {
      if (ambientOn && !document.hidden && ac) {
        var f = NOTES[Math.floor(Math.random() * NOTES.length)];
        playMusicBoxNote(f, 0.032);
      }
      scheduleAtelierNotes();
    }, 3200 + Math.random() * 4800);
  }

  function syncAtelierAudio() {
    var ctxA = ensureAudio();
    if (!ctxA) return;
    if (!master) {
      master = ctxA.createGain();
      master.gain.value = 0;
      master.connect(ctxA.destination);

      var lp = ctxA.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 320;
      lp.connect(master);

      // Warm Cmaj7-ish low drone (C3 + G3 + E4 very soft)
      [130.81, 196.0, 329.63].forEach(function (freq, idx) {
        var osc = ctxA.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        var g = ctxA.createGain();
        g.gain.value = [0.11, 0.06, 0.025][idx];
        osc.connect(g);
        g.connect(lp);
        osc.start();
      });

      scheduleAtelierNotes();
    }
    master.gain.setTargetAtTime(ambientOn ? 0.65 : 0, ctxA.currentTime, 0.25);
  }

  function toggleAudio() {
    ambientOn = !ambientOn;
    syncAtelierAudio();
    if (audioBtn) {
      audioBtn.classList.toggle('is-on', ambientOn);
      audioBtn.textContent = ambientOn ? '♪ ATELIER: ON' : '♪ ATELIER: OFF';
    }
  }

  function unlockDefaultAudio() {
    if (ambientOn && !master) {
      syncAtelierAudio();
    }
    window.removeEventListener('pointerdown', unlockDefaultAudio);
    window.removeEventListener('keydown', unlockDefaultAudio);
  }
  window.addEventListener('pointerdown', unlockDefaultAudio, { passive: true });
  window.addEventListener('keydown', unlockDefaultAudio, { passive: true });

  // ===== Render Loop =====
  function drawFrame() {
    ctx.fillStyle = '#0c0c0b';
    ctx.fillRect(0, 0, w, h);

    // 1. Soft studio spotlight following cursor
    spotX += (targetX - spotX) * 0.06;
    spotY += (targetY - spotY) * 0.06;
    var sx = spotX * w;
    var sy = spotY * h;
    var spotR = Math.max(w, h) * 0.42;
    var spotGrad = ctx.createRadialGradient(sx, sy, 10, sx, sy, spotR);
    spotGrad.addColorStop(0, isAnniversary ? 'rgba(245, 212, 158, 0.075)' : 'rgba(245, 212, 158, 0.048)');
    spotGrad.addColorStop(1, 'rgba(12, 12, 11, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Bokeh dust motes
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      if (!reducedMotion) {
        m.x += m.vx + (spotX - 0.5) * 0.08;
        m.y += m.vy;
        m.phase += m.speed;
        if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;
      }
      var a = m.alpha + Math.sin(m.phase) * 0.08;
      ctx.fillStyle = 'rgba(' + m.color + ', ' + Math.max(0.03, a) + ')';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Click ripples
    for (var r = ripples.length - 1; r >= 0; r--) {
      var rp = ripples[r];
      rp.radius += 1.4;
      rp.alpha -= 0.025;
      if (rp.alpha <= 0) {
        ripples.splice(r, 1);
        continue;
      }
      ctx.strokeStyle = 'rgba(245, 212, 158, ' + rp.alpha + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (!reducedMotion && !document.hidden) {
      rafId = requestAnimationFrame(drawFrame);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (!rafId && !document.hidden) {
      rafId = requestAnimationFrame(drawFrame);
    }
  }

  window.addEventListener('mousemove', function (e) {
    targetX = e.clientX / (w || 1);
    targetY = e.clientY / (h || 1);
  }, { passive: true });

  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a, button, input, select, dialog, .card, .atelier-hud')) return;
    ripples.push({ x: e.clientX, y: e.clientY, radius: 3, alpha: 0.75 });
    var freq = NOTES[noteIdx % NOTES.length];
    noteIdx++;
    playMusicBoxNote(freq, 0.065);
    if (reducedMotion) drawFrame();
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) startLoop();
  });

  if (audioBtn) audioBtn.addEventListener('click', toggleAudio);

  window.addEventListener('resize', function () {
    resize();
    initMotes();
    if (reducedMotion) drawFrame();
  });

  checkAnniversary();
  resize();
  initMotes();
  drawFrame();
})();
