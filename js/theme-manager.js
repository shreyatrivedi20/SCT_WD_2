/* ============================================================
   THEME MANAGER
   ============================================================ */

const ThemeManager = {
  KEY: 'sw_theme',
  themes: ['dark', 'light', 'neon'],

  init() {
    const saved = localStorage.getItem(this.KEY) || 'dark';
    this.apply(saved);
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.KEY, theme);
    this.current = theme;
  },

  cycle() {
    const idx = this.themes.indexOf(this.current);
    const next = this.themes[(idx + 1) % this.themes.length];
    this.apply(next);
    return next;
  },
};

window.ThemeManager = ThemeManager;
