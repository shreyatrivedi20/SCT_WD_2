/* ============================================================
   VOICE ANNOUNCER
   Spoken feedback via SpeechSynthesis ("Two laps completed",
   "Welcome to Chronos", etc). Separate from VoiceCommander,
   which only listens — this module only speaks.
   Fails silently on unsupported browsers.
   ============================================================ */

class VoiceAnnouncer {
  constructor() {
    this.supported = 'speechSynthesis' in window;
    this.enabled = localStorage.getItem('sw_announce') !== 'false'; // on by default
  }

  setEnabled(val) {
    this.enabled = val;
    localStorage.setItem('sw_announce', String(val));
    if (!val) window.speechSynthesis.cancel();
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  speak(text) {
    if (!this.supported || !this.enabled) return;
    window.speechSynthesis.cancel(); // don't let announcements queue/stack
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1;
    utter.volume = 0.9;
    window.speechSynthesis.speak(utter);
  }

  /* ---- Canned phrases the app calls into ---- */
  welcome() { this.speak('Welcome to Chronos.'); }
  started() { this.speak('Timer started.'); }
  paused() { this.speak('Timer paused.'); }
  reset() { this.speak('Timer reset.'); }

  lapCompleted(count) {
    const noun = count === 1 ? 'lap' : 'laps';
    this.speak(`${count} ${noun} completed.`);
  }

  stepChanged(label) {
    this.speak(label); // e.g. "Focus", "Rest", "Short break"
  }

  sequenceComplete() {
    this.speak('Session complete.');
  }

  hourReached(hours) {
    const noun = hours === 1 ? 'hour' : 'hours';
    this.speak(`${hours} ${noun} reached.`);
  }
}

window.VoiceAnnouncer = VoiceAnnouncer;
