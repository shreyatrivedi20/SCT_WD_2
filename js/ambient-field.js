/* ============================================================
   AMBIENT PARTICLE BACKGROUND
   Slow drifting dots, like dust in a lab under instrument light.
   Respects prefers-reduced-motion.
   ============================================================ */

class AmbientField {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.count = opts.count || 46;
    this.color = opts.color || '255,255,255';
    this.particles = [];
    this.paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._seed();
    if (!this.paused) this._animate();
    else this._drawStatic();
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _seed() {
    this.particles = Array.from({ length: this.count }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      r: 0.6 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      a: 0.08 + Math.random() * 0.22,
    }));
  }

  _drawStatic() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${p.a})`;
      ctx.fill();
    });
  }

  setColor(rgbString) {
    this.color = rgbString;
  }

  _animate() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(() => this._animate());
  }
}

window.AmbientField = AmbientField;
