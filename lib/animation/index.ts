// lib/animation/index.ts — All anime.js animations (SSR-safe, call from useEffect)

const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const isMobile = () =>
  typeof window !== 'undefined' && window.innerWidth < 768;

export async function scrollReveal(selector: string, options: {
  delay?: number; staggerMs?: number; duration?: number; once?: boolean;
} = {}) {
  const { delay = 0, once = true } = options;
  const staggerMs = options.staggerMs ?? (isMobile() ? 50 : 80);
  const duration = options.duration ?? (isMobile() ? 500 : 700);
  const { animate, stagger } = await import('animejs');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const children = entry.target.querySelectorAll(selector + ' .anim-child, ' + selector);
      const targets = children.length > 0 ? Array.from(children) : [entry.target];
      animate(targets, {
        opacity: [0, 1], translateY: [50, 0], scale: [0.97, 1],
        delay: stagger(staggerMs, { start: delay }),
        duration, easing: 'easeOutExpo',
      });
      if (once) observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(selector).forEach(el => observer.observe(el));
  return () => observer.disconnect();
}

export function textScramble(el: HTMLElement, finalText: string, duration = 1500) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const steps = Math.ceil(duration / 50);
  let step = 0;

  const interval = setInterval(() => {
    const progress = step / steps;
    el.textContent = finalText
      .split('')
      .map((char, i) => {
        if (char === ' ') return ' ';
        if (i / finalText.length < progress) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');
    step++;
    if (step > steps) {
      el.textContent = finalText;
      clearInterval(interval);
    }
  }, 50);
}

export function counterUp(el: HTMLElement, target: number, suffix = '', duration = 2000) {
  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();

    const { animate } = await import('animejs');
    const obj = { val: 0 };
    animate(obj, {
      val: target, duration, easing: 'easeOutExpo',
      update: () => { el.textContent = Math.round(obj.val) + suffix; },
    });
  }, { threshold: 0.5 });
  observer.observe(el);
}

export function cardTilt(selector: string) {
  if (isTouchDevice()) return;

  document.querySelectorAll<HTMLElement>(selector).forEach(card => {
    card.style.transition = 'transform 0.1s ease';
    card.style.willChange = 'transform';
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = ((e.clientY - cy) / (rect.height / 2)) * -8;
      const ry = ((e.clientX - cx) / (rect.width / 2)) * 8;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s var(--ease-expo)';
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    });
  });
}

export function magneticButton(selector: string) {
  if (isTouchDevice()) return;

  document.querySelectorAll<HTMLElement>(selector).forEach(btn => {
    btn.addEventListener('mousemove', async (e) => {
      const { animate } = await import('animejs');
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.25;
      const dy = (e.clientY - cy) * 0.25;
      animate(btn, { translateX: dx, translateY: dy, duration: 400, easing: 'easeOutExpo' });
    });
    btn.addEventListener('mouseleave', async () => {
      const { animate } = await import('animejs');
      animate(btn, { translateX: 0, translateY: 0, duration: 600, easing: 'easeOutExpo' });
    });
  });
}

export async function clipReveal(selector: string, delay = 0) {
  const { animate, stagger } = await import('animejs');
  const els = document.querySelectorAll<HTMLElement>(selector);
  els.forEach(el => { el.style.clipPath = 'inset(0 100% 0 0)'; el.style.opacity = '1'; });

  animate(els, {
    clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
    delay: stagger(120, { start: delay }),
    duration: 900, easing: 'easeInOutExpo',
  });
}

export async function staggerGrid(selector: string, cols = 3) {
  const { animate, stagger } = await import('animejs');
  const els = document.querySelectorAll(selector);
  animate(els, {
    opacity: [0, 1], translateY: [40, 0], scale: [0.94, 1],
    delay: stagger(70, { grid: [cols, Math.ceil(els.length / cols)], from: 'first' }),
    duration: 650, easing: 'easeOutExpo',
  });
}

export async function heroEntrance() {
  const { createTimeline, stagger } = await import('animejs');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.hero-anim, .nav-wrap').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
    });
    return;
  }

  const mobile = isMobile();
  const tl = createTimeline();

  if (mobile) {
    tl
      .add('.nav-wrap', { opacity: [0, 1], duration: 400, easing: 'easeOutExpo' }, 0)
      .add('.hero-creature', { opacity: [0, 1], duration: 600, easing: 'easeOutExpo' }, 0)
      .add('.hero-badge', { opacity: [0, 1], duration: 400, easing: 'easeOutExpo' }, 200)
      .add('.hero-title-line-1', { opacity: [0, 1], translateY: [30, 0], duration: 600, easing: 'easeOutExpo' }, 300)
      .add('.hero-title-line-2', { opacity: [0, 1], translateY: [30, 0], duration: 600, easing: 'easeOutExpo' }, 450)
      .add('.hero-subtitle', { opacity: [0, 1], duration: 400, easing: 'easeOutExpo' }, 700)
      .add('.hero-cta-wrap', { opacity: [0, 1], duration: 400, easing: 'easeOutExpo' }, 900)
      .add('.hero-stat', {
        opacity: [0, 1],
        delay: stagger(60), duration: 400, easing: 'easeOutExpo',
      }, 1000);
  } else {
    tl
      .add('.nav-wrap', { opacity: [0, 1], translateY: [-16, 0], duration: 600, easing: 'easeOutExpo' }, 0)
      .add('.hero-badge', { opacity: [0, 1], scale: [0.8, 1], duration: 500, easing: 'easeOutExpo' }, 200)
      .add('.hero-title-line-1', { opacity: [0, 1], translateY: [60, 0], duration: 700, easing: 'easeOutExpo' }, 350)
      .add('.hero-title-line-2', { opacity: [0, 1], translateY: [60, 0], duration: 700, easing: 'easeOutExpo' }, 450)
      .add('.hero-subtitle', { opacity: [0, 1], translateY: [30, 0], duration: 600, easing: 'easeOutExpo' }, 650)
      .add('.hero-cta-wrap', { opacity: [0, 1], translateY: [20, 0], duration: 500, easing: 'easeOutExpo' }, 800)
      .add('.hero-creature', { opacity: [0, 1], scale: [0.85, 1], duration: 800, easing: 'easeOutExpo' }, 300)
      .add('.hero-stat', {
        opacity: [0, 1], translateY: [20, 0],
        delay: stagger(100), duration: 500, easing: 'easeOutExpo',
      }, 1000);
  }
}
