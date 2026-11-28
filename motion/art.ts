import type { World } from './worlds';

const waves = Array.from({ length: 55 }, (_, i) => {
  const y = 124 + i * 5;
  const offset = 27 + i * 1.43;
  return `<path d="M-60 ${y + offset}C116 ${y - offset} 238 ${y + offset * 1.7} 438 ${y + offset *.62}S730 ${y - offset * 1.12} 960 ${y + offset * .3}"/>`;
}).join('');

export function fallbackArt(world: World): string {
  if (world === 'tide') return `<svg viewBox="0 0 900 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="wave-wire" x2="0" y2="1"><stop offset="0" stop-color="var(--c-shade)"/><stop offset=".64" stop-color="var(--c-accent)"/><stop offset="1" stop-color="var(--c-beam)"/></linearGradient></defs>
    <g class="fallback-tide"><g fill="none" stroke="url(#wave-wire)" stroke-width="1.5">${waves}</g>
      <path d="M-20 314C160 175 271 393 462 329S728 154 940 305" stroke="var(--c-peak)" stroke-width="3" fill="none" opacity=".74"/>
    </g></svg>`;

  if (world === 'kiln') return `<svg viewBox="0 0 700 610" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="heat" x1="0" x2="0" y1="1" y2="0"><stop stop-color="var(--c-peak)"/><stop offset=".34" stop-color="var(--c-beam)"/><stop offset=".74" stop-color="var(--c-accent)"/><stop offset="1" stop-color="var(--c-shade)"/></linearGradient>
      <radialGradient id="emberbed"><stop stop-color="var(--c-accent)" stop-opacity=".61"/><stop offset="1" stop-color="var(--c-shade)" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="381" cy="498" rx="224" ry="70" fill="url(#emberbed)"/>
    <g fill="url(#heat)">
      <path class="fallback-flame flame-back" d="M223 489C149 418 310 347 270 254c48 24 64 50 64 106 34-66 125-98 84-229 61 57 88 114 68 176-15 56 144 100 55 181-72 48-247 57-318 1Z"/>
      <path class="fallback-flame" d="M261 476c-14-73 104-107 81-206 62 56 22 90 31 134 29-33 96-43 99-99 75 64 9 92 44 125 25 47-25 77-81 76-68 20-160 7-174-30Z"/>
      <path class="fallback-flame flame-core" fill="var(--c-peak)" d="M338 482c-5-46 46-58 62-89 20 35-2 43 31 63 19 32-10 50-32 49-24 14-58-1-61-23Z"/>
    </g>
    <g class="fallback-embers" fill="var(--c-beam)"><circle cx="254" cy="345" r="4"/><circle cx="464" cy="254" r="3"/><circle cx="574" cy="321" r="3"/><circle cx="309" cy="201" r="3"/><circle cx="393" cy="117" r="2.5"/><circle cx="229" cy="217" r="2"/><circle cx="481" cy="174" r="2.2"/></g>
    <g class="fallback-embers embers-far" fill="var(--c-accent)"><circle cx="301" cy="407" r="4"/><circle cx="509" cy="357" r="2.5"/><circle cx="545" cy="264" r="3"/><circle cx="331" cy="280" r="2.5"/><circle cx="369" cy="341" r="3"/></g>
  </svg>`;

  return `<svg viewBox="0 0 740 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="ribbon-lime" x2=".8" y2="1"><stop stop-color="var(--c-peak)"/><stop offset=".3" stop-color="var(--c-accent)"/><stop offset=".62" stop-color="var(--c-shade)"/><stop offset=".9" stop-color="var(--c-peak)"/><stop offset="1" stop-color="var(--c-accent)"/></linearGradient>
      <linearGradient id="ribbon-blue" x2=".73" y2="1"><stop stop-color="var(--c-shade)"/><stop offset=".28" stop-color="var(--c-beam)"/><stop offset=".53" stop-color="var(--c-peak)"/><stop offset=".78" stop-color="var(--c-shade)"/><stop offset="1" stop-color="var(--c-beam)"/></linearGradient>
    </defs>
    <g fill="none">
      <path class="fallback-ribbon ribbon-back" d="M-148 447C32 430 156 77 306 138S367 546 498 444 531 59 856 115" stroke="url(#ribbon-blue)" stroke-width="105"/>
      <path class="fallback-ribbon" d="M-138 404C53 419 180 85 299 158S368 537 526 366 549 43 859 125" stroke="url(#ribbon-lime)" stroke-width="66"/>
      <path class="fallback-ribbon ribbon-fine" d="M-135 472C95 470 205 188 303 245S388 593 565 398 558 120 845 151" stroke="var(--c-art)" stroke-opacity=".57" stroke-width="2"/>
    </g>
  </svg>`;
}

export function transitArt(): string {
  const profiles: Record<World, string> = {
    flow: 'M0 88C230 136 254 12 461 59S760 149 970 59 1100 35 1200 48V678C1090 639 1000 746 852 698S604 611 409 700 150 652 0 706Z',
    tide: 'M0 72C240 155 470-35 699 66S963 153 1200 56V695C1000 599 863 759 657 696S273 623 0 712Z',
    kiln: 'M0 71 96 62 213 87 320 48 426 68 524 35 665 84 772 70 877 108 982 63 1080 91 1200 49V696L1094 677 985 709 869 665 768 727 653 687 553 707 446 679 336 722 225 685 115 705 0 669Z',
  };
  return `<div class="transit" data-transit aria-hidden="true" hidden>
    ${Object.entries(profiles).map(([id, path]) => `<svg data-sheet="${id}" viewBox="0 0 1200 750" preserveAspectRatio="none"><path d="${path}"/></svg>`).join('')}
    <span class="transit-name" data-transit-name></span>
  </div>`;
}
