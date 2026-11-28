import { certifications, education, experience, hackathons, layerById, profile, projectById, projects, type Project } from '../src/content';
import { cssVars, motionPalettes } from '../src/styles/palettes';
import { fallbackArt, transitArt } from './art';
import { worldIds, worlds, type World } from './worlds';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]!));
const esc = escapeHtml;

const arrow = '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M4 16 16 4m-8 0h8v8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const down = '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M10 3v14m-5-5 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const wordmark = '<svg viewBox="0 0 34 34" width="34" height="34" aria-hidden="true"><path d="M5 26C13 26 11 8 20 8h9M5 18c7 0 7-10 13-10M14 26h2c9 0 7-18 15-18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

export const plateFor = (project: Project) => project.shots.find((shot) => shot.kind !== 'phone');
const projectUrl = (id: string) => `#work-${id}`;
export const imageName = (id: string) => `work-plates/${id}.webp`;

function proof(project: Project): string {
  const metric = project.metrics[0];
  if (!metric) return '';
  const value = esc(metric.value);
  return `<p class="proof">${metric.source ? `<a href="${esc(metric.source)}">${value}</a>` : `<strong>${value}</strong>`}<span>${esc(metric.label)}</span></p>`;
}

function notes(project: Project): string {
  return `<p>${esc(project.summary)}</p>
    <ul>${project.highlights.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
    <p><strong>Stack:</strong> ${project.stack.map(esc).join(', ')}</p>
    ${project.limits?.length ? `<p><strong>Limits:</strong> ${project.limits.map(esc).join(' ')}</p>` : ''}`;
}

const links = (project: Project) => `<ul class="proof-links">${project.links.map((link) => (
  `<li><a href="${esc(link.url)}">${esc(link.label)} ${arrow}</a></li>`
)).join('')}</ul>`;

function projectPlate(project: Project, base: string): string {
  const shot = plateFor(project);
  if (shot) return `<figure class="plate"><div class="plate-matte">
    <img data-project-image src="${base}${imageName(project.id)}" loading="lazy" decoding="async" alt="${esc(shot.alt)}">
    </div>${shot.caption ? `<figcaption>${esc(shot.caption)}</figcaption>` : ''}</figure>`;
  const figure = project.figure;
  if (figure?.kind === 'bars') return `<div class="work-figure"><p>${esc(figure.title)}</p><dl>${figure.items.map((item) => (
    `<div><dt>${esc(item.label)}</dt><dd>${item.value.toLocaleString('en-US')} bytes</dd></div>`
  )).join('')}</dl></div>`;
  if (figure?.kind === 'table') return `<div class="work-figure"><table><caption>${esc(figure.title)}</caption>
    <thead><tr>${figure.head.map((value) => `<th scope="col">${esc(value)}</th>`).join('')}</tr></thead>
    <tbody>${figure.rows.map(([name, ...cells]) => `<tr><th scope="row">${esc(name!)}</th>${cells.map((value) => `<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  return '';
}

function exhibit(project: Project, base: string): string {
  return `<article class="exhibit" id="work-${project.id}" aria-labelledby="label-${project.id}">
    <div class="exhibit-copy"><p class="project-layer">${esc(layerById(project.layers[0]!).name)}${project.status ? ` / ${esc(project.status)}` : ''}</p>
    <h3 id="label-${project.id}">${esc(project.name)}</h3><p>${esc(project.oneLiner)}</p>${proof(project)}
    ${links(project)}<details class="read-notes"><summary>Build notes</summary>${notes(project)}</details></div>
    ${projectPlate(project, base)}
  </article>`;
}

function otherWork(exclude: Set<string>): string {
  return `<section class="archive wrap" aria-labelledby="archive-title"><h2 id="archive-title">More work</h2>
    ${projects.filter((project) => !exclude.has(project.id)).map((project) => (
      `<details><summary><span>${esc(project.name)}</span><span>${esc(layerById(project.layers[0]!).name)}</span></summary>
      <div class="archive-note">${project.status ? `<p>${esc(project.status)}</p>` : ''}${proof(project)}${notes(project)}${links(project)}</div></details>`
    )).join('')}</section>`;
}

function about(): string {
  return `<section id="about" class="about wrap" aria-labelledby="about-title">
    <div><h2 id="about-title">About</h2><p>${esc(profile.about[0]!)}</p></div>
    <div class="record"><h3>${esc(experience.employer)} / ${esc(experience.product)}</h3>
    <ul>${experience.roles.map((role) => `<li>${esc(role.title)} <span>${esc(role.start)} &ndash; ${role.end ? esc(role.end) : 'Present'}</span></li>`).join('')}</ul>
    <h3>Education</h3><ul>${education.map((row) => `<li>${esc(row.degree)} &middot; ${esc(row.field)} <span>${esc(row.school)} / ${esc(row.start)}&ndash;${esc(row.end)}</span></li>`).join('')}</ul>
    <h3>Certification and hackathons</h3><ul>${certifications.map((item) => `<li>${esc(item.name)} <span>${esc(item.issuer)}</span></li>`).join('')}${hackathons.map((item) => `<li>${esc(item.name)} <span>${esc(item.result)}</span></li>`).join('')}</ul></div>
  </section>`;
}

export function renderWorld(world: World, base: string): string {
  const edition = worlds[world];
  const pathFor = (id: World) => base + worlds[id].path;
  const featured = edition.projectIds.map(projectById);
  const title = `${profile.name} | ${edition.name} - In Motion`;
  const resume = base + profile.resumePath.slice(1);
  return `<!doctype html>
<html lang="en" data-world="${world}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${esc(profile.thesisBody)}">
  <meta name="theme-color" content="${motionPalettes[world].paper}">
  <meta name="color-scheme" content="${world === 'kiln' ? 'dark' : 'light'}">
  <title>${esc(title)}</title>
  <link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
  <style>${worldIds.map((id) => `[data-world="${id}"],[data-color="${id}"]{${cssVars(motionPalettes[id])}}`).join('')}</style>
  <link rel="stylesheet" href="/client/style.css">
  ${world === 'tide' ? '<link rel="stylesheet" href="/client/tide-type.css">' : ''}
  <script>
    try {
      var root = document.documentElement;
      if (sessionStorage.getItem('vbs-motion-paused') === 'true') root.dataset.paused = 'true';
      if (!root.hasAttribute('data-paused') && !matchMedia('(prefers-reduced-motion: reduce)').matches &&
        sessionStorage.getItem('vbs-motion-arrival') === location.pathname) {
        root.dataset.arrival = 'true';
        sessionStorage.removeItem('vbs-motion-arrival');
        setTimeout(function () { delete root.dataset.arrival; }, 2400);
      }
    } catch {}
  </script>
  <script type="module" src="/client/main.ts"></script>
</head>
<body>
  <a href="#main" class="skip">Skip to content</a>
  <header class="top wrap">
    <a class="mark" href="${base}" data-to-world="flow" aria-label="In Motion home">${wordmark}<span>${esc(profile.handle)}<span class="mark-edition"> / In Motion</span></span></a>
    <nav class="world-picker" aria-label="Choose a motion edition">
      ${worldIds.map((id) => `<a href="${pathFor(id)}" data-to-world="${id}"${id === world ? ' aria-current="page"' : ''}>${worlds[id].name}</a>`).join('')}
    </nav>
    <nav class="top-links" aria-label="Portfolio">
      <a class="top-work" href="#work">Work</a><a href="${resume}" download>Resume ${down}</a>
    </nav>
  </header>
  <main id="main" tabindex="-1">
    <section class="hero wrap" aria-labelledby="page-title">
      <div class="hero-copy">
        <h1 id="page-title" tabindex="-1">${edition.headline.map((line, i) => `<span class="line"><${i ? 'em' : 'span'}>${esc(line)}</${i ? 'em' : 'span'}></span>`).join(' ')}</h1>
        <div class="byline"><strong>${esc(profile.name)}</strong><span>${esc(profile.role)} &middot; ${esc(profile.focus)}</span></div>
        <p class="hero-lede">${esc(edition.intro)}</p>
        <div class="hero-links"><a class="primary" href="#work">Explore work ${down}</a><a class="contact-jump" href="#contact">Contact ${arrow}</a></div>
      </div>
      <div class="scene">
        <figure class="scene-window" data-stage data-render="css" aria-label="${esc(edition.material)}">
          <div class="scene-fallback" aria-hidden="true">${fallbackArt(world)}</div>
          <canvas aria-hidden="true"></canvas>
          <div class="scene-matte" aria-hidden="true"></div>
        </figure>
        <div class="scene-controls"><span>${esc(edition.material)}</span>
          <label class="pause-label"><input type="checkbox" data-pause> Pause motion</label></div>
      </div>
    </section>
    <section class="work" id="work" aria-labelledby="work-title">
      <div class="wrap work-layout">
        <header class="work-index"><h2 id="work-title">${esc(edition.work)}</h2>
          <nav aria-label="Selected projects">${featured.map((project) => `<a href="${projectUrl(project.id)}">${esc(project.name)} ${down}</a>`).join('')}</nav>
        </header>
        <div class="exhibits">${featured.map((project) => exhibit(project, base)).join('')}</div>
      </div>
    </section>
    ${otherWork(new Set(edition.projectIds))}
    ${about()}
    <section id="contact" class="contact" aria-labelledby="contact-title"><div class="wrap">
      <h2 id="contact-title">Let's build something.</h2><a class="contact-mail" href="mailto:${esc(profile.email)}">${esc(profile.email)} ${arrow}</a>
      <ul class="proof-links">${profile.contacts.filter((entry) => entry.kind !== 'email').map((entry) => `<li><a href="${entry.kind === 'resume' ? resume : esc(entry.href)}"${entry.kind === 'resume' ? ' download' : ''}>${entry.kind === 'phone' ? esc(entry.value) : esc(entry.label)} ${entry.kind === 'resume' ? down : arrow}</a></li>`).join('')}</ul>
    </div></section>
  </main>
  <footer class="footer wrap"><span>${esc(profile.name)}</span><nav aria-label="Other editions">${worldIds.filter((id) => id !== world).map((id) => `<a href="${pathFor(id)}" data-to-world="${id}">See ${worlds[id].name} ${arrow}</a>`).join('')}</nav></footer>
  ${transitArt()}
</body>
</html>`;
}
