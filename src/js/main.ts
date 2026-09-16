import '../styles/bundle.css';
import { initHero } from './hero';
import { initCursor, initMagnet, initReveal, initTilt } from './interactions';
import { initNav } from './nav';
import { initKeyboard } from './keyboard';
import { toast } from './overlays';
import { SITE } from '../data/content';

initNav();
initReveal();
initTilt();
initMagnet();
initCursor();
initKeyboard();
initHero();

// footer year
const y = document.getElementById('y');
if (y) y.textContent = String(new Date().getFullYear());

// copy-email chip in contact section
document.getElementById('copy-email')?.addEventListener('click', () => {
  navigator.clipboard
    ?.writeText(SITE.email)
    .then(() => toast('Email copied to clipboard'))
    .catch(() => toast(SITE.email));
});
