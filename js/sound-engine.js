/* ============================================================
   SOUND ENGINE
   Synthesized tones via WebAudio — no external sound files needed.
   ============================================================ */

class SoundEngine {
  constructor() {
    this.muted = localStorage.getItem('sw_muted') === 'true';
    this._ctx = null;
  }

  _ensureCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  setMuted(val) {
    this.muted = val;
    localStorage.setItem('sw_muted', String(val));
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  _tone(freq, durationMs, type = 'sine', gainPeak = 0.18) {
    if (this.muted) return;
    try {
      const ctx = this._ensureCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
      osc.start(now);
      osc.stop(now + durationMs / 1000 + 0.02);
    } catch (e) { /* audio unsupported, fail silently */ }
  }

  start() { this._tone(880, 90, 'sine'); }
  pause() { this._tone(440, 90, 'sine'); }
  reset() { this._tone(220, 140, 'triangle'); }
  lap() { this._tone(660, 70, 'square', 0.1); }
  milestone() {
    if (this.muted) return;
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this._tone(f, 180, 'sine', 0.15), i * 90);
    });
  }
}

window.SoundEngine = SoundEngine;
