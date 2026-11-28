/**
 * Original Film artwork: the same mountain pass in two exposures, a dyed standard and a dust matte.
 * This is a print shop, not a runtime renderer. Nothing here reads the reference movie or the network.
 * npm run film:art [-- <output directory>]
 */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { hexToRgb } from '../src/lib/color.ts';
import { filmInks as inks } from '../src/styles/palettes.ts';

const out = process.argv[2] ?? fileURLToPath(new URL('../src/assets/film/', import.meta.url));
await mkdir(out, { recursive: true });
const W = 1536, H = 896, tau = Math.PI * 2;
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const f = (v) => Number(v.toFixed(1));
function random(seed) {
  return () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
}
const seed = random(7421);
const lattice = Float32Array.from({ length: 256 * 256 }, seed);
const cell = (x, y) => lattice[((y & 255) << 8) | (x & 255)];
function noise(x, y) {
  const i = Math.floor(x), j = Math.floor(y), u = smooth(x - i), v = smooth(y - j);
  return lerp(lerp(cell(i, j), cell(i + 1, j), u), lerp(cell(i, j + 1), cell(i + 1, j + 1), u), v);
}
function wash(x, y) {
  return noise(x, y) * 0.54 + noise(x * 2.1 + 3, y * 2.1) * 0.27
    + noise(x * 4.4, y * 4.4 + 5) * 0.13 + noise(x * 9, y * 9) * 0.06;
}
const path = (d, fill, attrs = '') => `<path d="${d}" fill="${fill}" ${attrs}/>`;
const line = (d, ink, width = 1, opacity = 1) =>
  path(d, 'none', `stroke="${ink}" stroke-width="${f(width)}" opacity="${f(opacity)}" stroke-linecap="round"`);
const poly = (points, color) => path(`M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`, color);
const circle = (x, y, r, fill, opacity = 1) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" opacity="${opacity}"/>`;
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);
const raw = (pixels, width, height, channels) => sharp(pixels, { raw: { width, height, channels } });
const write = (image, name, options = {}) => image.webp({ quality: 85, alphaQuality: 86, effort: 5, ...options }).toFile(resolve(out, name));

function tower(x, y, scale, p, night) {
  const parts = [
    path('M-111 44l12-20 16-9 10-19 131-2 16 12 16 17 16 29-34-19-9 16-38-20-14 34-22-31-36 25-17-22z', p.moss),
    path('M-103 39l31-39h24l-18 16-6 17-8-9zM44 3h23l18 24-18-11 4 13z', p.stone),
    path('M-77 2l8-26h139l10 26z', p.stone),
    line('M-75 -6h151M-66 -19h130', p.parapet, 2),
  ];
  for (let tier = 0; tier < 3; tier++) {
    const w = 70 - tier * 15, b = -23 - tier * 41;
    parts.push(path(`M${-w} ${b}v-27h${2 * w}v27z`, p.timber));
    for (let k = -w + 6; k < w - 7; k += 13) {
      if (night) parts.push(circle(k + 4, b - 13, 13, p.window, 0.055));
      parts.push(path(`M${k} ${b - 6}v-13h8v13z`, p.window, `opacity="${night ? 1 : 0.35}"`));
      parts.push(line(`M${k + 4} ${b - 18}v11`, p.timber, 1.3));
    }
    const e = w + 26, shoulder = Math.round(w * 0.46);
    parts.push(path(`M${-e} ${b - 34}Q${-w} ${b - 26} ${-shoulder} ${b - 48}L0 ${b - 62}
      L${shoulder} ${b - 48}Q${w} ${b - 26} ${e} ${b - 34}Q${w} ${b - 17} 0 ${b - 24}Q${-w} ${b - 18} ${-e} ${b - 34}Z`, p.tile));
    parts.push(line(`M${-e} ${b - 34}Q${-w} ${b - 20} 0 ${b - 28}Q${w} ${b - 20} ${e} ${b - 34}`, p.glint, 2.7));
    for (let k = -w; k <= w; k += 7) {
      const h = 14 * (1 - Math.abs(k / w));
      parts.push(line(`M${k * 0.72} ${b - 33 - h}l${k * 0.18} ${h + 4}`, p.glint, 0.9, 0.6));
    }
  }
  parts.push(line('M0 -164v-20m-5 10h10', p.timber, 3), circle(0, -184, 2.6, p.glint));
  return `<g transform="translate(${x} ${y}) scale(${scale})">${parts.join('')}</g>`;
}

function pass(exposure) {
  const p = inks[exposure], night = exposure === 'night', rnd = random(1627);
  const sun = night ? [997, 182, 46] : [992, 210, 76];
  const marks = [`<defs><linearGradient id="sky" x2="0" y2="1" gradientUnits="objectBoundingBox">
    <stop stop-color="${p.zenith}"/><stop offset=".79" stop-color="${p.haze}"/></linearGradient></defs>`,
    path(`M0 0h${W}v${H}H0z`, 'url(#sky)')];
  for (let i = 0; i < 130; i++) {
    const x = rnd() * W, y = rnd() * 375, size = 0.45 + rnd() * 1.25;
    const opacity = f(0.28 + rnd() * 0.58);
    if (night) marks.push(circle(x, y, size, p.disc, opacity));
  }
  for (let k = 6; k >= 1; k--) marks.push(circle(sun[0], sun[1], sun[2] + k * 3.7, p.disc, 0.025));
  marks.push(circle(...sun, p.disc));
  const ridge = (anchors, grit, key) => (x) => {
    const t = clamp(x / W) * (anchors.length - 1), i = Math.min(anchors.length - 2, Math.floor(t));
    return lerp(anchors[i], anchors[i + 1], t - i)
      + (wash(x / 40, key) - 0.5) * grit + (noise(x / 4, key) - 0.5) * grit * 0.12;
  };
  const mountain = (anchors, grit, key, base, face, grain, treeSize = 0) => {
    const top = ridge(anchors, grit, key), points = [];
    for (let x = 0; x <= W; x += 3) points.push([x, top(x)]);
    marks.push(poly([...points, [W, H], [0, H]], base));
    // Broken downhill brush marks follow the contour rather than a screen-space pattern.
    for (let x = -8; x < W; x += 4 + rnd() * 10) {
      const y = top(x), steep = top(x - 9) - y, length = (15 + rnd() * 95) * (steep > 0 ? 1.4 : 0.7);
      const drift = -length * (0.25 + rnd() * 0.42), width = 1 + rnd() * (steep > 0 ? 13 : 5);
      marks.push(path(`M${f(x)} ${f(y + 1)}q${f(drift * 0.23)} ${f(length * 0.53)} ${f(drift)} ${f(length)}
        l${f(width + 2)} ${f(-length * 0.16)}L${f(x + width)} ${f(y + 5)}Z`, face, `opacity="${f(0.24 + rnd() * 0.5)}"`));
      if (steep > 3) marks.push(line(`M${f(x)} ${f(y)}l${f(drift * 0.7)} ${f(length * 0.7)}`, grain, 1.3, 0.5));
    }
    if (treeSize) {
      for (let x = 2; x < W; x += 5 + rnd() * 9) {
        const h = (0.32 + rnd() ** 2) * treeSize, y = top(x) + 5;
        if (noise(x / 72, 76) < 0.35) continue;
        marks.push(path(`M${f(x)} ${f(y - h)}l${f(-h * 0.15)} ${f(h * 0.56)}l${f(h * 0.08)} -1l${f(-h * 0.21)} ${f(h * 0.44)}h${f(h * 0.55)}
          l${f(-h * 0.22)} ${f(-h * 0.42)}l${f(h * 0.09)} 1Z`, base));
      }
    }
    return top;
  };
  mountain([390, 338, 446, 285, 461, 365, 285, 354, 244, 358, 164, 328, 302, 208, 388], 63, 23, p.distant, p.haze, p.disc);
  mountain([411, 500, 371, 497, 433, 536, 426, 337, 473, 403, 273, 420, 211, 338, 450], 71, 93, p.shale, p.distant, p.glint);
  const far = mountain([574, 461, 570, 512, 594, 538, 442, 492, 563, 484, 407, 385, 513, 402, 345], 57, 35, p.jade, p.shale, p.glint, 11);
  marks.push(tower(778, f(far(778) + 6), 0.32, p, night));
  const middle = mountain([621, 511, 564, 657, 716, 656, 570, 652, 726, 631, 552, 486, 477, 563, 639, 531, 440], 50, 56, p.moss, p.jade, p.glint, 19);
  const ty = f(middle(1154) - 1);
  marks.push(tower(1154, ty, 1.14, p, night));

  // Stone causeway, from the tower parapet into the near right corner.
  const knots = [[1183, ty], [1212, 548], [1327, 569], [1344, 599], [1230, 630], [1127, 676], [1182, 717], [1450, 776], [1566, 848], [1400, 948]];
  const side = (t) => {
    const q = clamp(t) * (knots.length - 1), i = Math.min(knots.length - 2, Math.floor(q)), u = q - i;
    const v = (axis) => {
      const a = knots[Math.max(0, i - 1)][axis], b = knots[i][axis], c = knots[i + 1][axis], d = knots[Math.min(knots.length - 1, i + 2)][axis];
      return 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u ** 2 + (-a + 3 * b - 3 * c + d) * u ** 3);
    };
    return [v(0), v(1), 3.5 + t ** 1.7 * 46];
  };
  for (let i = 0; i < 125; i++) {
    const [x, y, w] = side(i / 125), [X, Y, v] = side((i + 1) / 125);
    marks.push(poly([[x-w,y], [X-v,Y], [X-v,Y+v], [x-w,y+w]], p.stone),
      poly([[x-w,y], [X-v,Y], [X+v,Y], [x+w,y]], p.parapet),
      line(`M${f(x-w)} ${f(y+w*0.43)}L${f(X-v)} ${f(Y+v*0.43)}`, p.moss, w * 0.055, 0.7));
    if (i % 2 === 0) {
      for (const s of [-1, 1]) marks.push(poly([[x+s*w,y],[X+s*v,Y],[X+s*v,Y-v*0.28],[x+s*w,y-w*0.28]], p.stone));
    }
  }
  mountain([718, 667, 716, 842, 881, 828, 815, 864, 908, 946, 967], 46, 8, p.pine, p.moss, p.jade, 30);
  mountain([755, 726, 790, 871, 929, 978, 1030, 1060], 40, 82, p.deep, p.pine, p.jade, 47);
  // A small line of birds gives the wide sky a scale.
  for (let i = 0; i < 7; i++) {
    const x = 665 + i * 18, y = 220 + Math.sin(i * 0.7) * 14 - i * 3;
    marks.push(line(`M${f(x-6)} ${f(y-2)}q3 -1 6 2q3 -4 6 -4`, p.pine, 1.5, 0.8));
  }
  return svg(W, H, marks.join(''));
}

async function landscape(exposure) {
  const data = await sharp(pass(exposure)).removeAlpha().raw().toBuffer();
  const rng = random(544), night = exposure === 'night', haze = hexToRgb(inks[exposure].haze);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3, u = x / W, v = y / H;
    const mist = clamp((wash(u * 4 + noise(u * 5, v * 7), v * 15 + u * 1.4) - 0.45) * 3)
      * clamp((0.63 - v) * 3) * (night ? 0.32 : 0.49);
    const paper = (noise(x * 0.13 + y * 0.08, y * 0.37) - 0.5) * 7 + (rng() - 0.5) * 6;
    for (let c = 0; c < 3; c++) data[i+c] = clamp(lerp(data[i+c], haze[c], mist) + paper, 0, 255);
  }
  await write(raw(data, W, H, 3), `${exposure}.webp`);
}

async function dust() {
  const w = 896, h = 576, density = new Float32Array(w * h), pixels = Buffer.alloc(w*h*4);
  const [shade, mid, lit] = [inks.dust.shadow, inks.dust.body, inks.dust.light].map(hexToRgb);
  const rng = random(33);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    const curl = wash(u * 3 + 4, v * 3 + 2);
    const n = wash(u * 6 + curl * 7, v * 5 + wash(u * 5 + curl, v * 4) * 6);
    const front = 0.2 + u * 0.49 + 0.13 * Math.sin(u * 8 + 1);
    density[y*w+x] = (v - front) * 1.45 + (n - 0.5) * 1.5;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const j = y*w+x, d = density[j], light = density[Math.max(0,y-7)*w+Math.max(0,x-5)];
    const value = clamp(0.58 - d * 0.27 + (d - light) * 2.7 + (wash(x/44,y/44)-0.5)*0.6);
    let a = smooth(clamp((d+0.09)*3.8));
    const grit = rng();
    if (a < 0.8 && grit > 0.991 && d > -0.29) a = 0.6;
    for (let c = 0; c < 3; c++) pixels[j*4+c] = clamp((value < 0.48 ? lerp(shade[c],mid[c],value/0.48) : lerp(mid[c],lit[c],(value-0.48)/0.52)) + (grit-0.5)*8,0,255);
    pixels[j*4+3] = Math.round(a*255);
  }
  await write(raw(pixels,w,h,4),'dust.webp');
}

async function standard() {
  const w = 816, h = 706, p = inks.silk;
  const marks = [path(`M58 56h697v545H58z`,p.dye)];
  for (let i=0; i<13; i++) {
    const x = 57+i*54;
    marks.push(path(`M${x} 579h51v67l-18 -15l-17 22l-16 -9z`,p.dye));
  }
  for (const x of [62, 728]) {
    marks.push(path(`M${x} 53h22v549h-22z`,p.hem),line(`M${x+9} 56v543`,p.gold,2,0.8));
  }
  for (const y of [72, 548, 580]) {
    marks.push(line(`M65 ${y}h677`,p.hem,10),line(`M65 ${y-4}h677`,p.gold,2));
  }
  // A cut-block V/B/S maker's seal, drawn rather than relying on a system glyph.
  marks.push(`<g transform="translate(407 305) rotate(-5)">`,
    path('M-151 -109l153 -92l147 92l-3 212l-146 91l-154 -91z','none',`stroke="${p.gold}" stroke-width="5"`),
    path('M-122 -91l120 -72l119 72v161l-118 74l-122 -73z','none',`stroke="${p.block}" stroke-width="10"`),
    path('M-101 -73l26 -12l67 67l-13 28zM-59 -102l24 -13l53 54l-11 30zM-4 -13l32 -93l27 15l-30 87z',p.block),
    path('M-54 1l24 17l-11 31l41 24l44 -28l-29 -12l-18 12l-16 -11l20 -16l29 -8l7 -15l36 -18l-15 45l-16 8l35 16l-8 14l-70 44l-76 -42z',p.block),
    path('M-80 72l70 45l78 -46l-7 18l-71 45l-73 -48z',p.gold),'</g>');
  for (let i=0; i<10; i++) {
    const x=86+i*70;
    marks.push(path(`M${x} 549l8 12l8-12l8 12l8-12`, 'none',`stroke="${p.gold}" stroke-width="2"`));
  }
  marks.push(line('M38 50h738',p.block,11),line('M38 47h738',p.gold,2.5));
  for (let x=72;x<750;x+=96) marks.push(path(`M${x} 43h9v22h-9z`,p.hem),line(`M${x+2} 44v16`,p.gold,1.5));
  const flat = await sharp(svg(w,h,marks.join(''))).ensureAlpha().raw().toBuffer(), pixels = Buffer.alloc(w*h*4);
  const rnd = random(512);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const u=x/w, v=y/h, phase=tau*(u*1.92+v*0.19+0.065*Math.sin(tau*(v*0.97+u*0.6)));
    const sx=Math.round(x-14*Math.sin(phase)-10*Math.sin(v*6+u*4));
    const sy=Math.round(y-24*Math.sin(phase)*Math.min(1,v*3)-12*Math.sin(u*5-0.4));
    if (sx<0||sx>=w||sy<0||sy>=h) continue;
    const i=(sy*w+sx)*4, j=(y*w+x)*4;
    const light=0.66+0.43*(0.5+0.5*Math.cos(phase+0.45))**2+0.24*Math.max(0,Math.cos(phase*2.12+1.3))**5
      +0.07*Math.sin(v*15+u*4)+0.05*(noise(x/2,y/16)-0.5);
    const thread=(rnd()-0.5)*8+(y%3===0?2:-1);
    for (let c=0;c<3;c++) pixels[j+c]=clamp(flat[i+c]*light+thread,0,255);
    pixels[j+3]=flat[i+3];
  }
  await write(raw(pixels,w,h,4),'standard.webp');
}

await Promise.all([landscape('day'), landscape('night'), dust(), standard()]);
console.log(`Printed day, night, dust and silk to ${out}`);
