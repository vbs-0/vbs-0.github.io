#!/usr/bin/env node
/**
 * Copies real screenshots and logos out of the owner's public repositories into src/assets/projects/
 * and records where each one came from in provenance.json.
 *
 *   node scripts/fetch-screenshots.mjs           download what is missing
 *   node scripts/fetch-screenshots.mjs --force   download everything again
 *   node scripts/fetch-screenshots.mjs --check   verify files against provenance.json, no network
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'assets', 'projects');
const provenancePath = join(outDir, 'provenance.json');

/** [destination, owner/repo, branch, path in the repository] */
const MANIFEST = [
  ['studease/logo.png', 'vbs-0/studease', 'main', 'frontend/public/icon-512.png'],
  ['studease/web-overview.png', 'vbs-0/studease', 'main', 'docs/screenshots/overview.png'],
  ['studease/web-account.png', 'vbs-0/studease', 'main', 'docs/screenshots/learner-account.png'],
  ['studease/phone-overview.png', 'vbs-0/studease', 'main', 'docs/screenshots/mobile/overview.png'],
  ['studease/phone-scholarships.png', 'vbs-0/studease', 'main', 'docs/screenshots/mobile/scholarships.png'],
  ['pam/logo.png', 'vbs-0/pam', 'main', 'docs/brand/logo-transparent.png'],
  ['pam/web-folio.png', 'vbs-0/pam', 'main', 'docs/screenshots/web/02-home.png'],
  ['pam/web-budgets.png', 'vbs-0/pam', 'main', 'docs/screenshots/web/04-budgets.png'],
  ['pam/phone-folio.png', 'vbs-0/pam', 'main', 'docs/screenshots/android/01-home.png'],
  ['pam/phone-spend.png', 'vbs-0/pam', 'main', 'docs/screenshots/android/04-spend.png'],
  ['quantumlink/web-chat.png', 'vbs-0/QuantumLink-PQC', 'main', 'evidence/2026-11-11/screenshots/06-final-alice-desktop.png'],
  ['quantumlink/web-handshake.png', 'vbs-0/QuantumLink-PQC', 'main', 'evidence/2026-11-11/screenshots/03-incoming-handshake.png'],
  ['termadb/phone-help.png', 'vbs-0/termadb', 'main', 'live-05-help-clean.png'],
  ['predoctor/chart-roc.png', 'vbs-0/predoctor1.2', 'main', 'models/static/images/roc_curves.png'],
  ['dsaallocator/web-verified.png', 'vbs-0/DSAAllocator', 'main', 'images/image8.png'],
];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const rawUrl = (repo, ref, path) =>
  `https://raw.githubusercontent.com/${repo}/${ref}/${path.split('/').map(encodeURIComponent).join('/')}`;

const mode = process.argv.includes('--check') ? 'check' : process.argv.includes('--force') ? 'force' : 'missing';
const previous = existsSync(provenancePath) ? JSON.parse(readFileSync(provenancePath, 'utf8')) : [];
const byFile = new Map(previous.map((p) => [p.file, p]));

if (mode === 'check') {
  let bad = 0;
  for (const [file] of MANIFEST) {
    const abs = join(outDir, file);
    const rec = byFile.get(file);
    if (!existsSync(abs)) { console.error(`missing  ${file}`); bad++; continue; }
    if (!rec) { console.error(`no provenance  ${file}`); bad++; continue; }
    if (sha256(readFileSync(abs)) !== rec.sha256) { console.error(`changed  ${file}`); bad++; }
  }
  console.log(bad ? `${bad} problem(s)` : `${MANIFEST.length} images match provenance.json`);
  process.exit(bad ? 1 : 0);
}

const records = [];
let fetched = 0;
for (const [file, repo, ref, path] of MANIFEST) {
  const abs = join(outDir, file);
  const known = byFile.get(file);
  if (mode === 'missing' && existsSync(abs) && known) { records.push(known); continue; }
  const source = rawUrl(repo, ref, path);
  const res = await fetch(source);
  if (!res.ok) {
    console.error(`FAILED ${res.status} ${source}`);
    if (known) records.push(known);
    process.exitCode = 1;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, buf);
  records.push({ file, repo, ref, path, source, sha256: sha256(buf), bytes: buf.length, fetchedAt: new Date().toISOString().slice(0, 10) });
  fetched++;
  console.log(`fetched  ${file}  (${buf.length} bytes)`);
}
writeFileSync(provenancePath, `${JSON.stringify(records, null, 2)}\n`);
console.log(`${fetched} fetched, ${records.length} recorded in src/assets/projects/provenance.json`);
