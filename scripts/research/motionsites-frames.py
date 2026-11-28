"""Frames and contact sheets for the motionsites.ai index.
Usage: python3 scripts/research/motionsites-frames.py <index.json> <outdir> [deep]
  default: one frame per card (3 s into its preview, or its poster) + labelled 5x4 sheets
  deep:    five frames per Portfolios / 3D card (0.3, 1.5, 4, 7, 11 s)
Needs ffmpeg on PATH and Pillow (pip install pillow)."""
import json, os, re, subprocess, sys, urllib.request, math
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageDraw, ImageFont

index, outdir = sys.argv[1], sys.argv[2]
deep = len(sys.argv) > 3 and sys.argv[3] == 'deep'
items = json.load(open(index, encoding='utf-8'))
thumbs = os.path.join(outdir, 'thumbs'); os.makedirs(thumbs, exist_ok=True)
slug = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:50]
REL = {'Portfolios', '3D & interactive', '3d-page'}

def ffmpeg(args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args], timeout=60, check=True)

def job(j):
    kind, src, t, path = j
    if os.path.exists(path) and os.path.getsize(path) > 1000: return True
    try:
        if kind == 'v':
            ffmpeg(['-ss', str(t), '-i', src, '-frames:v', '1', '-vf', 'scale=400:-2', '-q:v', '4', path])
        else:
            data = urllib.request.urlopen(urllib.request.Request(src, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30).read()
            tmp = path + '.src'; open(tmp, 'wb').write(data)
            ffmpeg(['-i', tmp, '-frames:v', '1', '-vf', 'scale=400:-2', '-q:v', '4', path]); os.remove(tmp)
        return True
    except Exception:
        return False

jobs = []
for i, it in enumerate(items):
    base = os.path.join(thumbs, f"{i:03d}-{slug(it['name'])}")
    if deep:
        if REL & set(it['cats']) and it['video']:
            jobs += [('v', it['video'], t, f'{base}-{tag}.jpg') for t, tag in [(0.3, 'b0'), (1.5, 'b1'), (4, 'b2'), (7, 'b3'), (11, 'b4')]]
    else:
        jobs.append(('v', it['video'], 3, base + '-a.jpg') if it['video'] else ('p', it['img'], 0, base + '-a.jpg'))
with ThreadPoolExecutor(16) as ex: ok = sum(ex.map(job, jobs))
print('frames', ok, 'of', len(jobs))
if deep: sys.exit(0)

try:
    font = ImageFont.truetype('DejaVuSans-Bold.ttf', 15)
except OSError:
    font = ImageFont.load_default()
files = [(i, it, os.path.join(thumbs, f"{i:03d}-{slug(it['name'])}-a.jpg")) for i, it in enumerate(items)]
files = [f for f in files if os.path.exists(f[2])]
cols, rows, W, H = 5, 4, 400, 250
sheets = os.path.join(outdir, 'sheets'); os.makedirs(sheets, exist_ok=True)
for s in range(math.ceil(len(files) / (cols * rows))):
    sheet = Image.new('RGB', (cols * W, rows * (H + 26)), '#111'); d = ImageDraw.Draw(sheet)
    for k, (i, it, p) in enumerate(files[s * cols * rows:(s + 1) * cols * rows]):
        x, y = (k % cols) * W, (k // cols) * (H + 26)
        im = Image.open(p).convert('RGB'); im.thumbnail((W, H))
        sheet.paste(im, (x + (W - im.width) // 2, y + 26 + (H - im.height) // 2))
        tags = ','.join(c[:4] for c in it['cats'] if c != 'All')
        d.text((x + 6, y + 4), f"{i} {it['name']} [{tags}]"[:52], font=font, fill='#fff')
    sheet.save(os.path.join(sheets, f'all-{s:02d}.jpg'), quality=80)
print('sheets written to', sheets)
