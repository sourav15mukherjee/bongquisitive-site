/** Overlays: command palette, shortcuts sheet, project modal, toast. */
import { PROJECTS, RESEARCH, SITE } from '../data/content';
import { scrollToSection } from './nav';

type CloseFn = () => void;
const openStack: CloseFn[] = [];

export function closeTopOverlay(): boolean {
  const fn = openStack[openStack.length - 1];
  if (!fn) return false;
  fn();
  return true;
}

export function anyOverlayOpen(): boolean {
  return openStack.length > 0;
}

function trackOverlay(close: CloseFn): void {
  openStack.push(close);
}

function untrackOverlay(close: CloseFn): void {
  const i = openStack.indexOf(close);
  if (i >= 0) openStack.splice(i, 1);
}

/** Focus trap inside an overlay element. Returns a cleanup fn. */
function trapFocus(el: HTMLElement): () => void {
  const selector = 'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])';
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusables = Array.from(el.querySelectorAll<HTMLElement>(selector))
      .filter((n) => n.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  };
  el.addEventListener('keydown', onKey);
  return () => el.removeEventListener('keydown', onKey);
}

/* ---------- Toast ---------- */
let toastEl: HTMLElement | null = null;
let toastTimer = 0;

export function toast(msg: string): void {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast glass';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl!.classList.remove('show'), 1900);
}

/* ---------- Project modal ---------- */
let modalBuilt = false;

function buildModal(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'overlay modal-wrap';
  wrap.hidden = true;
  wrap.innerHTML = `
    <div class="overlay-backdrop" data-close></div>
    <div class="modal glass" role="dialog" aria-modal="true" aria-label="Project details">
      <button class="modal-close" data-close aria-label="Close dialog">✕</button>
      <span class="tech-badge" id="modal-badge"></span>
      <h3 id="modal-title"></h3>
      <p class="m-desc" id="modal-desc"></p>
      <div class="pills" id="modal-pills"></div>
      <div class="cta-row" id="modal-links"></div>
    </div>`;
  document.body.appendChild(wrap);
  modalBuilt = true;
  return wrap;
}

export function openProjectModal(projectId: string): void {
  const project = PROJECTS.find((p) => p.id === projectId);
  if (!project) return;
  const wrap = modalBuilt ? (document.querySelector('.modal-wrap') as HTMLElement) : buildModal();

  (wrap.querySelector('#modal-badge') as HTMLElement).textContent = project.badge;
  (wrap.querySelector('#modal-title') as HTMLElement).textContent = project.name;
  (wrap.querySelector('#modal-desc') as HTMLElement).textContent = project.long;
  (wrap.querySelector('#modal-pills') as HTMLElement).innerHTML = project.pills
    .map((p) => `<span class="pill">${p}</span>`)
    .join('');
  (wrap.querySelector('#modal-links') as HTMLElement).innerHTML = project.links
    .map((l) =>
      l.primary
        ? `<a class="btn btn-primary" href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a>`
        : `<a class="btn btn-ghost" href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a>`,
    )
    .join('');

  openOverlay(wrap);
}

/* ---------- Generic overlay open/close ---------- */
function openOverlay(wrap: HTMLElement): void {
  const opener = document.activeElement as HTMLElement | null;
  wrap.hidden = false;
  const untrap = trapFocus(wrap);
  const close = () => {
    if (wrap.hidden) return;
    wrap.hidden = true;
    untrap();
    untrackOverlay(close);
    opener?.focus();
  };
  wrap.querySelectorAll<HTMLElement>('[data-close]').forEach((el) =>
    el.addEventListener('click', close),
  );
  trackOverlay(close);
  const focusable = wrap.querySelector<HTMLElement>('input, .modal-close, button:not([data-close])');
  focusable?.focus();
  (wrap as any)._close = close;
}

export function closeOverlayEl(wrap: HTMLElement): void {
  (wrap as any)._close?.();
}

/* ---------- Command palette ---------- */
interface PaletteItem {
  label: string;
  hint?: string;
  group: string;
  keywords: string;
  run: () => void;
}

function buildItems(): PaletteItem[] {
  const items: PaletteItem[] = [];

  const sections: [string, string][] = [
    ['Home', 'top'],
    ['The Lab', 'lab'],
    ['Experiments', 'experiments'],
    ['Open Investigations', 'research'],
    ['Contact', 'contact'],
  ];
  sections.forEach(([label, id], i) =>
    items.push({
      label,
      hint: String(i + 1),
      group: 'Go to',
      keywords: `section ${label} jump`,
      run: () => scrollToSection(id),
    }),
  );

  PROJECTS.forEach((p) =>
    items.push({
      label: `${p.name} — details`,
      hint: '⏎',
      group: 'Experiments',
      keywords: `${p.name} project details modal ${p.badge}`,
      run: () => openProjectModal(p.id),
    }),
  );
  PROJECTS.forEach((p) =>
    p.links.forEach((l) =>
      items.push({
        label: `${p.name} · ${l.label}`,
        hint: '↗',
        group: 'Open links',
        keywords: `${p.name} ${l.label} link open`,
        run: () => window.open(l.url, '_blank', 'noopener'),
      }),
    ),
  );

  RESEARCH.forEach((r) =>
    items.push({
      label: r.title,
      hint: r.status,
      group: 'Research',
      keywords: `research ${r.title} ${r.status}`,
      run: () => scrollToSection(`research-${r.id}`),
    }),
  );

  items.push(
    {
      label: 'Copy email address',
      hint: '⧉',
      group: 'Actions',
      keywords: 'copy email clipboard contact',
      run: () => {
        navigator.clipboard
          ?.writeText(SITE.email)
          .then(() => toast('Email copied to clipboard'))
          .catch(() => toast(SITE.email));
      },
    },
    {
      label: 'Email the lab',
      hint: '↗',
      group: 'Actions',
      keywords: 'email mail contact write',
      run: () => (location.href = `mailto:${SITE.email}`),
    },
    {
      label: 'GitHub profile',
      hint: '↗',
      group: 'Actions',
      keywords: 'github code source open',
      run: () => window.open(SITE.github, '_blank', 'noopener'),
    },
    {
      label: 'Keyboard shortcuts',
      hint: '?',
      group: 'Actions',
      keywords: 'shortcuts keys help keyboard',
      run: () => toggleShortcuts(),
    },
  );

  return items;
}

let paletteEl: HTMLElement | null = null;
let paletteInput: HTMLInputElement | null = null;
let paletteList: HTMLUListElement | null = null;
let items: PaletteItem[] = [];
let filtered: PaletteItem[] = [];
let selected = 0;

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 1;
  let qi = 0;
  let score = 0;
  let streak = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      streak++;
      score += 1 + streak * 0.6 + (ti === 0 ? 1.2 : 0);
      qi++;
    } else {
      streak = 0;
    }
  }
  return qi === q.length ? score : 0;
}

function renderPalette(): void {
  if (!paletteList) return;
  const q = paletteInput?.value.trim() ?? '';
  filtered = items
    .map((it) => ({ it, s: Math.max(fuzzyScore(q, it.label), fuzzyScore(q, it.keywords) * 0.8) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 9)
    .map((x) => x.it);
  selected = 0;

  if (filtered.length === 0) {
    paletteList.innerHTML = `<li class="palette-empty">Nothing matches “${q}”.</li>`;
    return;
  }
  let html = '';
  let lastGroup = '';
  filtered.forEach((it, i) => {
    if (it.group !== lastGroup) {
      html += `<li class="palette-group" aria-hidden="true">${it.group}</li>`;
      lastGroup = it.group;
    }
    html += `
      <li class="palette-item" role="option" data-i="${i}" aria-selected="${i === selected}">
        <span>${it.label}</span>
        ${it.hint ? `<span class="pi-hint">${it.hint}</span>` : ''}
      </li>`;
  });
  paletteList.innerHTML = html;
}

function highlight(): void {
  paletteList?.querySelectorAll('.palette-item').forEach((el) => {
    el.setAttribute('aria-selected', String(Number((el as HTMLElement).dataset.i) === selected));
  });
  paletteList
    ?.querySelectorAll('.palette-item')
    [selected]?.scrollIntoView({ block: 'nearest' });
}

function ensurePalette(): HTMLElement {
  if (paletteEl) return paletteEl;
  items = buildItems();
  paletteEl = document.createElement('div');
  paletteEl.className = 'overlay';
  paletteEl.hidden = true;
  paletteEl.innerHTML = `
    <div class="overlay-backdrop" data-close></div>
    <div class="palette glass" role="dialog" aria-modal="true" aria-label="Command palette">
      <input id="palette-input" type="text" placeholder="Type a command or search…"
             autocomplete="off" spellcheck="false" aria-label="Search commands">
      <ul class="palette-list" id="palette-list" role="listbox" aria-label="Commands"></ul>
      <div class="palette-foot mono">↑↓ navigate&ensp;·&ensp;↵ open&ensp;·&ensp;esc close</div>
    </div>`;
  document.body.appendChild(paletteEl);
  paletteInput = paletteEl.querySelector('#palette-input');
  paletteList = paletteEl.querySelector('#palette-list');

  paletteInput!.addEventListener('input', renderPalette);
  paletteInput!.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      selected = (selected + 1) % filtered.length;
      highlight();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      selected = (selected - 1 + filtered.length) % filtered.length;
      highlight();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      filtered[selected]?.run();
      closePalette();
      e.preventDefault();
    }
  });
  paletteList!.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('.palette-item');
    if (!li) return;
    filtered[Number(li.dataset.i)]?.run();
    closePalette();
  });
  paletteList!.addEventListener('pointermove', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('.palette-item');
    if (li && Number(li.dataset.i) !== selected) {
      selected = Number(li.dataset.i);
      highlight();
    }
  });
  return paletteEl;
}

export function openPalette(): void {
  const p = ensurePalette();
  if (!p.hidden) return;
  if (paletteInput) paletteInput.value = '';
  renderPalette();
  openOverlay(p);
}

export function closePalette(): void {
  if (paletteEl) closeOverlayEl(paletteEl);
}

export function togglePalette(): void {
  if (paletteEl && !paletteEl.hidden) closePalette();
  else openPalette();
}

/* ---------- Shortcuts overlay ---------- */
let shortcutsEl: HTMLElement | null = null;

export function toggleShortcuts(): void {
  if (shortcutsEl && !shortcutsEl.hidden) {
    closeOverlayEl(shortcutsEl);
    return;
  }
  if (!shortcutsEl) {
    shortcutsEl = document.createElement('div');
    shortcutsEl.className = 'overlay';
    shortcutsEl.hidden = true;
    shortcutsEl.innerHTML = `
      <div class="overlay-backdrop" data-close></div>
      <div class="shortcuts glass" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
        <h2>Keyboard shortcuts</h2>
        <p class="sub">This site is built to be driven without a mouse.</p>
        <div class="sc-grid">
          <span class="sc-desc">Open command palette</span><span class="sc-keys"><kbd>⌘</kbd><kbd>K</kbd></span>
          <span class="sc-desc">Jump to section</span><span class="sc-keys"><kbd>1</kbd>–<kbd>5</kbd></span>
          <span class="sc-desc">Next / previous section</span><span class="sc-keys"><kbd>J</kbd><kbd>K</kbd></span>
          <span class="sc-desc">Open experiment details</span><span class="sc-keys"><kbd>⏎</kbd></span>
          <span class="sc-desc">This cheat sheet</span><span class="sc-keys"><kbd>?</kbd></span>
          <span class="sc-desc">Close anything</span><span class="sc-keys"><kbd>Esc</kbd></span>
        </div>
      </div>`;
    document.body.appendChild(shortcutsEl);
  }
  openOverlay(shortcutsEl);
}
