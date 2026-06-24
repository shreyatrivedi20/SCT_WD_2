/* ============================================================
   FORMAT UTILITIES
   ============================================================ */

const Format = {
  /** ms -> { h, m, s, cs } parts, centisecond precision for display */
  parts(ms) {
    const totalCs = Math.floor(ms / 10);
    const cs = totalCs % 100;
    const totalSec = Math.floor(totalCs / 100);
    const s = totalSec % 60;
    const totalMin = Math.floor(totalSec / 60);
    const m = totalMin % 60;
    const h = Math.floor(totalMin / 60);
    return { h, m, s, cs };
  },

  /** Main readout: 00:00:00.00 (hides hours if zero, unless force) */
  display(ms, forceHours = false) {
    const { h, m, s, cs } = this.parts(ms);
    const pad = (n, len = 2) => String(n).padStart(len, '0');
    if (h > 0 || forceHours) {
      return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`;
    }
    return `${pad(m)}:${pad(s)}.${pad(cs)}`;
  },

  /** Compact lap-row format: m:ss.cs */
  lapDisplay(ms) {
    const { h, m, s, cs } = this.parts(ms);
    const pad = (n, len = 2) => String(n).padStart(len, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
    return `${m}:${pad(s)}.${pad(cs)}`;
  },

  /** For CSV export: full precision seconds */
  csvSeconds(ms) {
    return (ms / 1000).toFixed(3);
  },
};

window.Format = Format;
