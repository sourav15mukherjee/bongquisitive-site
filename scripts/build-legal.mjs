/**
 * Generates the root-level policy pages from legal/template.html + legal/fragments/*.
 * Each fragment file starts with a JSON front-matter block:
 *   {"title": "...", "description": "..."}
 * Run automatically by `npm run build` (prebuild) — or `node scripts/build-legal.mjs`.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const template = readFileSync(resolve(root, 'legal/template.html'), 'utf8');
const year = new Date().getFullYear();

const fragDir = resolve(root, 'legal/fragments');
let count = 0;

for (const file of readdirSync(fragDir)) {
  if (!file.endsWith('.html')) continue;
  const raw = readFileSync(resolve(fragDir, file), 'utf8');
  const match = raw.match(/^\s*\{([\s\S]*?)\}\s*(\r?\n|$)/);
  if (!match) throw new Error(`Missing front-matter in legal/fragments/${file}`);
  const meta = JSON.parse(`{${match[1]}}`);
  const content = raw.slice(match[0].length).replace(/\n{3,}/g, '\n\n').trimEnd();

  const html = template
    .replaceAll('{{TITLE}}', () => meta.title)
    .replaceAll('{{DESC}}', () => meta.description)
    .replaceAll('{{YEAR}}', () => String(year))
    .replace('{{CONTENT}}', () => `\n    ${content}`);

  writeFileSync(resolve(root, file), html);
  count++;
  console.log(`  built ${file}  (${meta.title})`);
}
console.log(`Legal pages: ${count}`);
