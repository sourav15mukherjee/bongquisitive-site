/** Header state + scroll rail section spy. */

export const SECTIONS = ['top', 'lab', 'experiments', 'research', 'contact'] as const;

export function initNav(): void {
  const header = document.querySelector<HTMLElement>('.header');

  const onScroll = () => {
    header?.classList.toggle('scrolled', scrollY > 24);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // section spy → rail dots + header nav highlight
  const railLinks = new Map<string, HTMLAnchorElement>();
  document.querySelectorAll<HTMLAnchorElement>('.rail a[data-section]').forEach((a) => {
    railLinks.set(a.dataset.section!, a);
  });
  const navLinks = new Map<string, HTMLAnchorElement>();
  document.querySelectorAll<HTMLAnchorElement>('.header-nav a[data-section]').forEach((a) => {
    navLinks.set(a.dataset.section!, a);
  });

  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = e.target.id;
        railLinks.forEach((a, key) => {
          a.classList.toggle('active', key === id);
          if (key === id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
        navLinks.forEach((a, key) => {
          a.setAttribute('aria-current', key === id ? 'true' : 'false');
        });
      }
    },
    { rootMargin: '-42% 0px -52% 0px' },
  );
  SECTIONS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });
}

/** Index of the section currently closest to the viewport top band (for j/k). */
export function currentSectionIndex(): number {
  const probe = innerHeight * 0.42;
  let idx = 0;
  SECTIONS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.getBoundingClientRect().top <= probe) idx = i;
  });
  return idx;
}

export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
}
