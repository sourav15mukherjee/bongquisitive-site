/**
 * ─────────────────────────────────────────────────────────────────────
 *  SITE CONTENT — edit everything here.
 *  Palette (⌘K), project detail modals and research entries read from
 *  this file. Home-page card blurbs live in index.html — keep both in
 *  sync (or wire them up later).
 * ─────────────────────────────────────────────────────────────────────
 */

export const SITE = {
  name: 'Bongquisitive',
  legalName: 'BONGQUISITIVE SOLUTIONS PRIVATE LIMITED',
  tagline: 'A one-person lab building tools and games that sharpen your mind.',
  email: 'bongquisitivesolutions@gmail.com',
  location: 'Kolkata, West Bengal, India',
  github: 'https://github.com/sourav15mukherjee',
  domain: 'https://bongquisitive.com', // TODO: set the real production domain
};

export interface Project {
  id: string;
  name: string;
  badge: string;
  short: string;
  long: string;
  pills: string[];
  links: { label: string; url: string; primary?: boolean }[];
}

export const PROJECTS: Project[] = [
  {
    id: 'split-focus',
    name: 'Split Focus',
    badge: 'HTML5 Canvas Game',
    short: 'A cognitive training game that measures how your brain distributes attention across two independent visual zones.',
    long: 'Split Focus is a dual-lane arcade experiment built on HTML5 Canvas. You pilot two independent streams at once while the game silently measures how your attention divides between them — reaction asymmetry, recovery time, drift under load. Short runs, honest metrics, a progress dashboard that watches you improve.',
    pills: ['Dual-Lane Arcade', 'Attention Metrics', 'Training Modes', 'Progress Dashboard'],
    links: [
      { label: 'Play on itch.io', url: 'https://bongquisitive.itch.io/split-focus', primary: true },
      { label: 'Web play ↗', url: 'https://splitfocus.netlify.app/' },
    ],
  },
  {
    id: 'skillforge',
    name: 'SkillForge',
    badge: 'Next.js AI Platform',
    short: 'AI-powered skill file generator for Claude Code & OpenClaw. Turn ideas into production-ready skills in seconds, with built-in security scanning.',
    long: 'SkillForge turns a rough idea into a production-ready skill file for Claude Code or OpenClaw in seconds. A built-in security scanner reviews every generation, the free catalog offers community skills to fork, and everything exports as install-ready ZIPs. Fewer ritual keystrokes, more building.',
    pills: ['AI Generation', 'Security Scanner', 'Free Skill Catalog', 'Install-Ready ZIPs'],
    links: [
      { label: 'Try SkillForge', url: 'https://skillforge-tawny.vercel.app', primary: true },
      { label: 'Free skills ↗', url: 'https://github.com/sourav15mukherjee/skillforge-free-skills' },
    ],
  },
  {
    id: 'flux-wing',
    name: 'Flux Wing',
    badge: 'Vanilla Canvas Arcade · PWA',
    short: 'Gravity-shift cyber arcade. Flip polarity mid-flight, dilate time, pilot blackout sectors blind — pure Canvas + Web Audio, zero dependencies.',
    long: 'Flux Wing is a high-octane gravity-inversion arcade built on pure HTML5 Canvas and the Web Audio API — no frameworks, no image files, no audio files, no dependencies. One tap keeps you airborne while green gates invert gravity, purple gates plunge the sector into a 9.5-second blackout lit only by your flashlight cone, red portals teleport you across the screen, and Shift bends time by 30% when the maze gets impossible. Every sound — flaps, lasers, orb chimes, explosions — is synthesized live in the browser. Installable as a PWA and playable offline.',
    pills: ['Gravity Inversion', 'Chrono Dilation', 'Lights-Out Mode', 'Portals & Mazes', '100% Procedural Audio'],
    links: [
      { label: 'Play Flux Wing', url: 'https://sourav15mukherjee.github.io/flux-wing/', primary: true },
      { label: 'Source ↗', url: 'https://github.com/sourav15mukherjee/flux-wing' },
    ],
  },
];

export interface ResearchEntry {
  id: string;
  period: string;
  title: string;
  summary: string;
  status: 'active' | 'paused' | 'seed';
}

export const RESEARCH: ResearchEntry[] = [
  {
    id: 'attention-signal',
    period: '2025 →',
    title: 'Attention as a measurable signal',
    summary:
      'Using Split Focus telemetry to model how attention splits across two simultaneous tasks — exploring whether score curves act as cognitive fingerprints over time.',
    status: 'active',
  },
  {
    id: 'ai-workflows',
    period: '2025 →',
    title: 'AI-assisted developer workflows',
    summary:
      'Studying how generated skill files change day-to-day work with coding agents; feeding the findings back into SkillForge’s generation and scanning heuristics.',
    status: 'active',
  },
  {
    id: 'physics-interfaces',
    period: '2026 →',
    title: 'Physics-driven interfaces',
    summary:
      'Prototyping tactile web interfaces — liquid glass, cloth and fluid simulations — that make information feel manipulable rather than merely readable. You are looking at one right now.',
    status: 'active',
  },
  {
    id: 'dual-task-learning',
    period: '2026 · seed',
    title: 'Dual-task learning curves',
    summary:
      'Can short daily sessions in attention games measurably improve task-switching? Designing a small longitudinal study around Split Focus training modes.',
    status: 'seed',
  },
];
