/* ============================================================
   TIMER ENGINE
   Pure timing logic: start, pause, reset, lap capture.
   No DOM access here — emits events that other modules consume.
   ============================================================ */

class TimerEngine extends EventTarget {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.elapsedMs = 0;
    this.lapStartMs = 0;
    this.running = false;
    this._rafId = null;
    this._startedAt = 0;
    this.laps = [];
    this._emit('reset');
    this._emit('tick');
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._startedAt = performance.now() - this.elapsedMs;
    this._loop();
    this._emit('start');
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this._rafId);
    this._emit('pause');
  }

  toggle() {
    this.running ? this.pause() : this.start();
  }

  lap() {
    if (!this.running) return null;
    const lapTime = this.elapsedMs - this.lapStartMs;
    const entry = {
      index: this.laps.length + 1,
      lapMs: lapTime,
      totalMs: this.elapsedMs,
    };
    this.laps.push(entry);
    this.lapStartMs = this.elapsedMs;
    this._emit('lap', entry);
    return entry;
  }

  _loop() {
    if (!this.running) return;
    this.elapsedMs = performance.now() - this._startedAt;
    this._emit('tick');
    this._rafId = requestAnimationFrame(() => this._loop());
  }

  _emit(name, detail = null) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /* Stats derived from current laps */
  getStats() {
    if (this.laps.length === 0) return null;
    const times = this.laps.map(l => l.lapMs);
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return {
      fastest,
      slowest,
      avg,
      fastestIndex: times.indexOf(fastest) + 1,
      slowestIndex: times.indexOf(slowest) + 1,
      count: this.laps.length,
    };
  }
}

window.TimerEngine = TimerEngine;
