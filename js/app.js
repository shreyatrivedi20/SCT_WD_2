/* ============================================================
   APP CONTROLLER
   Wires DOM <-> modules. Kept thin: delegates real logic
   to timer-engine, modes, storage, sound, confetti, etc.
   ============================================================ */

(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ---- State ---- */
  const engine = new TimerEngine();
  const sound = new SoundEngine();
  const voice = new VoiceCommander();
  const announcer = new VoiceAnnouncer();
  let intervalRunner = null;
  let currentMode = Modes.STOPWATCH;
  const RING_CIRCUMFERENCE = 2 * Math.PI * 120; // matches SVG r=120

  /* ---- Cached DOM ---- */
  const el = {
    time: $('#timeDisplay'),
    modeLabel: $('#modeLabel'),
    stepLabel: $('#stepLabel'),
    ring: $('#progressRing'),
    startBtn: $('#startPauseBtn'),
    lapBtn: $('#lapBtn'),
    resetBtn: $('#resetBtn'),
    lapsBody: $('#lapsBody'),
    statsPanel: $('#statsPanel'),
    statFastest: $('#statFastest'),
    statSlowest: $('#statSlowest'),
    statAvg: $('#statAvg'),
    statCount: $('#statCount'),
    muteBtn: $('#muteBtn'),
    themeBtn: $('#themeBtn'),
    exportBtn: $('#exportBtn'),
    voiceBtn: $('#voiceBtn'),
    modeButtons: $$('.mode-tab'),
    confettiCanvas: $('#confettiCanvas'),
    ambientCanvas: $('#ambientCanvas'),
    shortcutsToggle: $('#shortcutsToggle'),
    shortcutsPanel: $('#shortcutsPanel'),
    historyList: $('#historyList'),
    historyToggle: $('#historyToggle'),
    announceBtn: $('#announceBtn'),
  };

  const confetti = new Confetti(el.confettiCanvas);
  const ambient = new AmbientField(el.ambientCanvas, { count: 50 });

  /* ---- Theme ---- */
  ThemeManager.init();
  syncAmbientColorToTheme();
  el.themeBtn.addEventListener('click', () => {
    ThemeManager.cycle();
    syncAmbientColorToTheme();
  });
  function syncAmbientColorToTheme() {
    const t = ThemeManager.current;
    ambient.setColor(t === 'light' ? '40,40,50' : t === 'neon' ? '255,90,220' : '255,255,255');
  }

  /* ---- Mute ---- */
  function refreshMuteIcon() {
    el.muteBtn.textContent = sound.muted ? '🔇' : '🔊';
    el.muteBtn.setAttribute('aria-pressed', String(sound.muted));
  }
  el.muteBtn.addEventListener('click', () => { sound.toggleMuted(); refreshMuteIcon(); });
  refreshMuteIcon();

  /* ---- Announcer ---- */
  function refreshAnnounceIcon() {
    el.announceBtn.classList.toggle('is-active', announcer.enabled);
    el.announceBtn.setAttribute('aria-pressed', String(announcer.enabled));
    el.announceBtn.title = announcer.enabled ? 'Spoken announcements: on' : 'Spoken announcements: off';
  }
  if (announcer.supported) {
    el.announceBtn.hidden = false;
    el.announceBtn.addEventListener('click', () => { announcer.toggle(); refreshAnnounceIcon(); });
    refreshAnnounceIcon();
  } else {
    el.announceBtn.hidden = true;
  }

  /* ---- Mode switching ---- */
  el.modeButtons.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });

  function switchMode(mode) {
    currentMode = mode;
    engine.pause();
    engine.reset();
    el.modeButtons.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));

    if (mode === Modes.STOPWATCH) {
      intervalRunner = null;
      el.modeLabel.textContent = 'STOPWATCH';
      el.stepLabel.textContent = '';
      el.lapBtn.disabled = false;
      renderTime(0);
      setRingProgress(0);
    } else {
      const seq = Modes.getSequence(mode);
      intervalRunner = new IntervalRunner(seq);
      bindIntervalRunner(intervalRunner);
      el.modeLabel.textContent = mode === Modes.POMODORO ? 'POMODORO' : 'WORKOUT INTERVAL';
      el.stepLabel.textContent = seq[0].label.toUpperCase();
      el.lapBtn.disabled = true;
      renderTime(seq[0].ms);
      setRingProgress(0);
    }
    updateStartLabel(false);
  }

  function bindIntervalRunner(runner) {
    runner.addEventListener('tick', () => {
      renderTime(runner.remainingMs);
      const pct = 1 - runner.remainingMs / runner.currentStep.ms;
      setRingProgress(pct);
    });
    runner.addEventListener('stepComplete', () => {
      sound.milestone();
      burstConfettiAtRing();
      if (runner.stepIndex < runner.sequence.length) {
        el.stepLabel.textContent = runner.currentStep.label.toUpperCase();
        announcer.stepChanged(runner.currentStep.label);
      }
    });
    runner.addEventListener('sequenceComplete', () => {
      el.stepLabel.textContent = 'COMPLETE';
      updateStartLabel(false);
      announcer.sequenceComplete();
    });
    runner.addEventListener('start', () => { updateStartLabel(true); announcer.started(); });
    runner.addEventListener('pause', () => { updateStartLabel(false); announcer.paused(); });
  }

  /* ---- Stopwatch engine bindings ---- */
  engine.addEventListener('tick', () => {
    if (currentMode !== Modes.STOPWATCH) return;
    renderTime(engine.elapsedMs);
    const pct = (engine.elapsedMs % 60000) / 60000;
    setRingProgress(pct);
    checkHourMilestone();
  });
  engine.addEventListener('start', () => { updateStartLabel(true); announcer.started(); });
  engine.addEventListener('pause', () => { updateStartLabel(false); announcer.paused(); });
  engine.addEventListener('lap', (e) => {
    sound.lap();
    renderLapRow(e.detail);
    refreshStats();
    announcer.lapCompleted(engine.laps.length);
    checkLapMilestone();
  });
  engine.addEventListener('reset', () => {
    el.lapsBody.innerHTML = '';
    el.statsPanel.hidden = true;
    setRingProgress(0);
  });

  let lastHourFlag = -1;
  function checkHourMilestone() {
    const hours = Math.floor(engine.elapsedMs / 3600000);
    if (hours > lastHourFlag && hours > 0) {
      lastHourFlag = hours;
      sound.milestone();
      burstConfettiAtRing();
      announcer.hourReached(hours);
    }
  }
  function checkLapMilestone() {
    if (engine.laps.length > 0 && engine.laps.length % 5 === 0) {
      sound.milestone();
      burstConfettiAtRing();
    }
  }

  function burstConfettiAtRing() {
    const rect = el.ring.getBoundingClientRect();
    confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  /* ---- Render helpers ---- */
  function renderTime(ms) {
    el.time.textContent = Format.display(ms, currentMode !== Modes.STOPWATCH);
  }

  function setRingProgress(pct) {
    const offset = RING_CIRCUMFERENCE * (1 - Math.min(Math.max(pct, 0), 1));
    el.ring.style.strokeDashoffset = offset;
  }

  function renderLapRow(entry) {
    const tr = document.createElement('tr');
    tr.dataset.lapIndex = entry.index;
    tr.innerHTML = `
      <td>${entry.index}</td>
      <td class="lap-time">${Format.lapDisplay(entry.lapMs)}</td>
      <td class="lap-total">${Format.lapDisplay(entry.totalMs)}</td>
    `;
    el.lapsBody.prepend(tr);
  }

  function refreshStats() {
    const stats = engine.getStats();
    if (!stats) { el.statsPanel.hidden = true; return; }
    el.statsPanel.hidden = false;
    el.statFastest.textContent = Format.lapDisplay(stats.fastest);
    el.statSlowest.textContent = Format.lapDisplay(stats.slowest);
    el.statAvg.textContent = Format.lapDisplay(stats.avg);
    el.statCount.textContent = stats.count;

    $$('#lapsBody tr').forEach(tr => {
      tr.classList.remove('lap-fastest', 'lap-slowest');
      const idx = Number(tr.dataset.lapIndex);
      if (idx === stats.fastestIndex) tr.classList.add('lap-fastest');
      if (idx === stats.slowestIndex && stats.count > 1) tr.classList.add('lap-slowest');
    });
  }

  function updateStartLabel(isRunning) {
    el.startBtn.textContent = isRunning ? 'PAUSE' : (engine.elapsedMs > 0 && currentMode === Modes.STOPWATCH ? 'RESUME' : 'START');
    el.startBtn.classList.toggle('is-running', isRunning);
  }

  /* ---- Controls ---- */
  function activeRunner() { return currentMode === Modes.STOPWATCH ? engine : intervalRunner; }

  el.startBtn.addEventListener('click', () => {
    const runner = activeRunner();
    const wasRunning = runner.running;
    runner.toggle();
    sound[wasRunning ? 'pause' : 'start']();
  });

  el.lapBtn.addEventListener('click', () => engine.lap());

  el.resetBtn.addEventListener('click', () => {
    sound.reset();
    announcer.reset();
    if (currentMode === Modes.STOPWATCH) {
      if (engine.laps.length > 0) {
        HistoryStore.save({
          mode: 'Stopwatch',
          totalMs: engine.elapsedMs,
          lapCount: engine.laps.length,
          finishedAt: new Date().toISOString(),
        });
        renderHistory();
      }
      engine.reset();
      lastHourFlag = -1;
    } else {
      intervalRunner.reset();
      el.stepLabel.textContent = intervalRunner.currentStep.label.toUpperCase();
    }
    updateStartLabel(false);
  });

  el.exportBtn.addEventListener('click', () => CsvExport.download(engine.laps, engine.elapsedMs));

  /* ---- History ---- */
  function renderHistory() {
    const sessions = HistoryStore.getAll();
    el.historyList.innerHTML = sessions.length
      ? sessions.map(s => `
        <li>
          <span class="hist-mode">${s.mode}</span>
          <span class="hist-time">${Format.lapDisplay(s.totalMs)}</span>
          <span class="hist-laps">${s.lapCount} laps</span>
          <span class="hist-date">${new Date(s.finishedAt).toLocaleString()}</span>
        </li>`).join('')
      : '<li class="hist-empty">No sessions yet — finish a run to see it here.</li>';
  }
  renderHistory();

  el.historyToggle.addEventListener('click', () => {
    el.historyList.hidden = !el.historyList.hidden;
  });

  /* ---- Shortcuts panel ---- */
  el.shortcutsToggle.addEventListener('click', () => {
    el.shortcutsPanel.hidden = !el.shortcutsPanel.hidden;
  });

  /* ---- Keyboard shortcuts ---- */
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        el.startBtn.click();
        break;
      case 'KeyL':
        if (currentMode === Modes.STOPWATCH) engine.lap();
        break;
      case 'KeyR':
        el.resetBtn.click();
        break;
      case 'KeyM':
        sound.toggleMuted();
        refreshMuteIcon();
        break;
      case 'KeyT':
        ThemeManager.cycle();
        syncAmbientColorToTheme();
        break;
    }
  });

  /* ---- Voice commands ---- */
  if (voice.supported) {
    el.voiceBtn.hidden = false;
    voice.addEventListener('command', (e) => {
      const action = e.detail;
      if (action === 'start') el.startBtn.click();
      if (action === 'pause' && activeRunner().running) el.startBtn.click();
      if (action === 'reset') el.resetBtn.click();
      if (action === 'lap' && currentMode === Modes.STOPWATCH) engine.lap();
    });
    el.voiceBtn.addEventListener('click', () => {
      const listening = voice.toggle();
      el.voiceBtn.classList.toggle('is-listening', listening);
      el.voiceBtn.setAttribute('aria-pressed', String(listening));
    });
  } else {
    el.voiceBtn.hidden = true;
  }

  /* ---- Init ---- */
  switchMode(Modes.STOPWATCH);
  renderTime(0);

  /* Browsers block SpeechSynthesis until a user gesture occurs on the page,
     so we say the welcome line on the first click/keypress, not on load. */
  function announceWelcomeOnce() {
    announcer.welcome();
    window.removeEventListener('pointerdown', announceWelcomeOnce);
    window.removeEventListener('keydown', announceWelcomeOnce);
  }
  window.addEventListener('pointerdown', announceWelcomeOnce, { once: true });
  window.addEventListener('keydown', announceWelcomeOnce, { once: true });
})();
