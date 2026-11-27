// Watch the GitHub Actions run for this push, using the credential already in git's manager.
import { execSync } from 'node:child_process';

const cred = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', shell: 'bash' }).toString();
const token = cred.match(/password=(.+)/)?.[1]?.trim();
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
const repo = 'vbs-0/vbs-0.github.io';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 40; i++) {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=1`, { headers });
  const data = await res.json();
  const run = data.workflow_runs?.[0];
  if (!run) break;
  if (run.status === 'completed') {
    console.log(`run ${run.id}: ${run.conclusion} — ${run.html_url}`);
    process.exit(run.conclusion === 'success' ? 0 : 1);
  }
  if (i === 0) console.log(`run ${run.id}: ${run.status}, waiting…`);
  await wait(20000);
}
console.log('timed out waiting');
