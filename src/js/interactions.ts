/** Mouse-layer interactions: reveal-on-scroll, 3D tilt + sheen, magnetic buttons, cursor glow. */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Scroll-triggered reveals with optional data-reveal-delay for stagger. */
export function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (reduced) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  els.forEach((el) => {
    const d = el.dataset.revealDelay;
    if (d) el.style.setProperty('--d', `${d}ms`);
    io.observe(el);
  });
}

/** 3D tilt + sheen tracking for [data-tilt] cards. */
export function initTilt(): void {
  if (!finePointer || reduced) return;
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
    const MAX = 5;
    card.addEventListener('pointermove', (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${(px - 0.5) * MAX * 2}deg`);
      card.style.setProperty('--rx', `${(0.5 - py) * MAX * 2}deg`);
      card.style.setProperty('--gx', `${px * 100}%`);
      card.style.setProperty('--gy', `${py * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

/** Magnetic pull for [data-magnet] buttons. */
export function initMagnet(): void {
  if (!finePointer || reduced) return;
  document.querySelectorAll<HTMLElement>('[data-magnet]').forEach((el) => {
    el.addEventListener('pointermove', (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

/** Cursor glow dot — additive, native cursor stays visible. */
export function initCursor(): void {
  if (!finePointer || reduced) return;
  const dot = document.createElement('div');
  dot.id = 'cursor-dot';
  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.append(dot, glow);
  document.body.classList.add('cursor-on');

  let mx = innerWidth / 2; let my = innerHeight / 2;
  let dx = mx; let dy = my; let gx = mx; let gy = my;

  addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  addEventListener('pointerover', (e) => {
    const t = e.target as Element | null;
    dot.classList.toggle(
      'big',
      !!t?.closest('a, button, input, textarea, [role="button"], [data-tilt], summary'),
    );
  }, { passive: true });

  document.addEventListener('pointerleave', () => {
    dot.style.opacity = '0';
    glow.style.opacity = '0';
  });
  document.addEventListener('pointerenter', () => {
    dot.style.opacity = '';
    glow.style.opacity = '';
  });

  (function tick() {
    dx += (mx - dx) * 0.3;
    dy += (my - dy) * 0.3;
    gx += (mx - gx) * 0.08;
    gy += (my - gy) * 0.08;
    dot.style.transform = `translate(${dx}px, ${dy}px)`;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(tick);
  })();
}
