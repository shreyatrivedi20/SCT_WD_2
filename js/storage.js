/* ============================================================
   STORAGE: CSV export + session history persistence
   ============================================================ */

const HistoryStore = {
  KEY: 'sw_session_history',
  MAX_SESSIONS: 25,

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || [];
    } catch { return []; }
  },

  save(session) {
    const all = this.getAll();
    all.unshift(session);
    if (all.length > this.MAX_SESSIONS) all.length = this.MAX_SESSIONS;
    localStorage.setItem(this.KEY, JSON.stringify(all));
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },
};

const CsvExport = {
  download(laps, totalMs) {
    if (!laps.length) return;
    const rows = [['Lap', 'Lap Time (s)', 'Total Time (s)']];
    laps.forEach(l => {
      rows.push([l.index, Format.csvSeconds(l.lapMs), Format.csvSeconds(l.totalMs)]);
    });
    rows.push([]);
    rows.push(['Total elapsed (s)', Format.csvSeconds(totalMs)]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `laps-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

window.HistoryStore = HistoryStore;
window.CsvExport = CsvExport;
