/* ============================================================
   MODES
   Stopwatch counts up freely.
   Pomodoro / Workout are countdown-driven preset sequences.
   ============================================================ */

const Modes = {
  STOPWATCH: 'stopwatch',
  POMODORO: 'pomodoro',
  WORKOUT: 'workout',

  pomodoroSequence: [
    { label: 'Focus', ms: 25 * 60 * 1000 },
    { label: 'Short break', ms: 5 * 60 * 1000 },
    { label: 'Focus', ms: 25 * 60 * 1000 },
    { label: 'Short break', ms: 5 * 60 * 1000 },
    { label: 'Focus', ms: 25 * 60 * 1000 },
    { label: 'Long break', ms: 15 * 60 * 1000 },
  ],

  workoutSequence: [
    { label: 'Work', ms: 30 * 1000 },
    { label: 'Rest', ms: 15 * 1000 },
    { label: 'Work', ms: 30 * 1000 },
    { label: 'Rest', ms: 15 * 1000 },
    { label: 'Work', ms: 30 * 1000 },
    { label: 'Rest', ms: 15 * 1000 },
    { label: 'Work', ms: 30 * 1000 },
    { label: 'Rest', ms: 15 * 1000 },
  ],

  getSequence(mode) {
    if (mode === this.POMODORO) return this.pomodoroSequence;
    if (mode === this.WORKOUT) return this.workoutSequence;
    return null;
  },
};

/* Countdown-driven engine wrapper for Pomodoro / Workout modes.
   Reuses TimerEngine's raf loop concept but counts down through steps. */
class IntervalRunner extends EventTarget {
  constructor(sequence) {
    super();
    this.sequence = sequence;
    this.stepIndex = 0;
    this.remainingMs = sequence[0].ms;
    this.running = false;
    this._rafId = null;
    this._stepStartedAt = 0;
    this._stepElapsedAtPause = 0;
  }

  get currentStep() { return this.sequence[this.stepIndex]; }

  start() {
    if (this.running) return;
    this.running = true;
    this._stepStartedAt = performance.now() - this._stepElapsedAtPause;
    this._loop();
    this._emit('start');
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this._rafId);
    this._emit('pause');
  }

  toggle() { this.running ? this.pause() : this.start(); }

  reset() {
    this.pause();
    this.stepIndex = 0;
    this._stepElapsedAtPause = 0;
    this.remainingMs = this.sequence[0].ms;
    this._emit('reset');
    this._emit('tick');
  }

  _loop() {
    if (!this.running) return;
    const elapsed = performance.now() - this._stepStartedAt;
    this._stepElapsedAtPause = elapsed;
    this.remainingMs = Math.max(this.currentStep.ms - elapsed, 0);
    this._emit('tick');
    if (this.remainingMs <= 0) {
      this._advance();
      return;
    }
    this._rafId = requestAnimationFrame(() => this._loop());
  }

  _advance() {
    const finishedStep = this.currentStep;
    const finishedIndex = this.stepIndex;
    this.stepIndex++;
    const hasNext = this.stepIndex < this.sequence.length;

    if (hasNext) {
      this._stepElapsedAtPause = 0;
      this._stepStartedAt = performance.now();
      this.remainingMs = this.currentStep.ms;
    } else {
      this.running = false;
    }

    this._emit('stepComplete', { ...finishedStep, index: finishedIndex });

    if (hasNext) {
      this._loop();
    } else {
      this._emit('sequenceComplete');
    }
  }

  _emit(name, detail = null) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

window.Modes = Modes;
window.IntervalRunner = IntervalRunner;
