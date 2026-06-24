/* ============================================================
   VOICE COMMANDS
   Uses webkitSpeechRecognition where available. Optional feature —
   fails gracefully and silently on unsupported browsers.
   ============================================================ */

class VoiceCommander extends EventTarget {
  constructor() {
    super();
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!Recognition;
    this.listening = false;
    if (!this.supported) return;

    this.recognition = new Recognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const text = last[0].transcript.trim().toLowerCase();
      this._route(text);
    };
    this.recognition.onerror = () => { /* swallow */ };
    this.recognition.onend = () => {
      if (this.listening) this.recognition.start(); // keep-alive
    };
  }

  _route(text) {
    const map = [
      [/start|begin|go/, 'start'],
      [/pause|stop/, 'pause'],
      [/reset|clear/, 'reset'],
      [/lap|split|mark/, 'lap'],
    ];
    for (const [pattern, action] of map) {
      if (pattern.test(text)) {
        this.dispatchEvent(new CustomEvent('command', { detail: action }));
        return;
      }
    }
  }

  toggle() {
    if (!this.supported) return false;
    this.listening = !this.listening;
    if (this.listening) this.recognition.start();
    else this.recognition.stop();
    return this.listening;
  }
}

window.VoiceCommander = VoiceCommander;
