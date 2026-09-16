/** Global keyboard system: palette, section jumps, j/k, ?, Esc, easter egg. */
import { SECTIONS, currentSectionIndex, scrollToSection } from './nav';
import {
  anyOverlayOpen,
  closeTopOverlay,
  openProjectModal,
  togglePalette,
  toggleShortcuts,
} from './overlays';

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTyping(el: EventTarget | null): boolean {
  const n = el as HTMLElement | null;
  return !!n && (TYPING.has(n.tagName) || n.isContentEditable);
}

export function initKeyboard(): void {
  // details buttons on experiment cards
  document.querySelectorAll<HTMLElement>('[data-project-details]').forEach((btn) => {
    btn.addEventListener('click', () => openProjectModal(btn.dataset.projectDetails!));
  });

  // hint chip in hero + header chip
  document
    .querySelectorAll<HTMLElement>('[data-open-palette]')
    .forEach((el) => el.addEventListener('click', togglePalette));

  // hidden easter egg buffer: type "glass"
  let buf = '';
  let eggArmed = false;

  addEventListener('keydown', (e) => {
    const meta = e.metaKey || e.ctrlKey;

    if (meta && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePalette();
      return;
    }
    if (e.key === 'Escape') {
      if (closeTopOverlay()) e.preventDefault();
      return;
    }
    if (isTyping(e.target) || meta || e.altKey) return;

    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      e.preventDefault();
      toggleShortcuts();
      return;
    }
    if (e.key === '/') {
      e.preventDefault();
      togglePalette();
      return;
    }
    if (anyOverlayOpen()) return; // overlays own remaining keys

    if (e.key >= '1' && e.key <= '5') {
      const id = SECTIONS[Number(e.key) - 1];
      if (id) {
        scrollToSection(id);
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'j' || e.key === 'k') {
      const idx = currentSectionIndex();
      const next = e.key === 'j' ? Math.min(idx + 1, SECTIONS.length - 1) : Math.max(idx - 1, 0);
      scrollToSection(SECTIONS[next]);
      e.preventDefault();
      return;
    }

    // ---- easter egg: type G-L-A-S-S ----
    if (/^[a-z]$/i.test(e.key)) {
      buf = (buf + e.key.toLowerCase()).slice(-5);
      if (!eggArmed && buf === 'glass') {
        eggArmed = true;
        window.dispatchEvent(new CustomEvent('bq:energy'));
        setTimeout(() => (eggArmed = false), 4000);
        buf = '';
      }
    }
  });
}
