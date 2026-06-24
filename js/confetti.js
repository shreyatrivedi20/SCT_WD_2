/* ============================================================
   CONFETTI
   Lightweight canvas confetti burst — no external library.
   ============================================================ */

class Confetti {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._running = false;
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(originX, originY, count = 70) {
    const colors = ['#ff9f1c', '#3ec9d6', '#e8e6e0', '#ff5e5b', '#7ee787'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        x: originX, y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        life: 1,
      });
    }
    if (!this._running) this._animate();
  }

  _animate() {
    this._running = true;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(p => {
      p.vy += 0.18;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.life -= 0.012;
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(p.life, 0);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rot);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.ctx.restore();
    });
    this.particles = this.particles.filter(p => p.life > 0 && p.y < this.canvas.height + 40);
    if (this.particles.length > 0) {
      requestAnimationFrame(() => this._animate());
    } else {
      this._running = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

window.Confetti = Confetti;
