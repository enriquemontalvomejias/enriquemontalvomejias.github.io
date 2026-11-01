"""Miniaturas para compartir la web (Open Graph, 1200 x 630).

Genera:
  docs/og/portfolio.png    la general: portada, Trayectoria, Formación y Rumbo
  docs/og/<proyecto>.png   una por cada writeup con "proyecto:" en el front matter

Se ejecuta sola en cada despliegue (.github/workflows/deploy.yml), así que al
añadir un proyecto su miniatura aparece sin hacer nada. Para verlas en local:

    pip install pillow
    python scripts/miniaturas.py

Usa las mismas fuentes IBM Plex que la web (docs/assets/fonts).
"""

from pathlib import Path
import re

import yaml
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
FONTS = DOCS / "assets" / "fonts"
OUT = DOCS / "og"

W, H = 1200, 630
M = 80  # margen

INK = (14, 23, 38)
LINE = (36, 52, 77)
TEXT = (230, 236, 244)
TEXT2 = (184, 197, 214)
MUTED = (141, 157, 181)
CYAN = (56, 189, 248)
AMBER = (242, 184, 75)
GREEN = (94, 211, 154)
RED = (255, 122, 107)


def font(name, size):
    return ImageFont.truetype(str(FONTS / f"{name}-Latin1.woff2"), size)


COND_BOLD = lambda s: font("IBMPlexSansCondensed-Bold", s)
COND_SEMI = lambda s: font("IBMPlexSansCondensed-SemiBold", s)
COND_MED = lambda s: font("IBMPlexSansCondensed-Medium", s)
SANS = lambda s: font("IBMPlexSans-Regular", s)
MONO = lambda s: font("IBMPlexMono-Regular", s)


# ── Lectura de la configuración y del contenido ──────────────────────────

class _Loader(yaml.SafeLoader):
    """Lee mkdocs.yml ignorando las etiquetas !!python/name de Material."""


_Loader.add_multi_constructor("tag:yaml.org,2002:python/name:", lambda *a: None)


def front_matter(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^﻿?---\r?\n(.*?)\r?\n---\r?\n", text, re.S)
    return yaml.safe_load(m.group(1)) if m else {}


def nav_titles(nav, acc=None):
    """{ 'proyectos/glpi.md': 'Inventario de activos con GLPI', ... }"""
    acc = {} if acc is None else acc
    for item in nav or []:
        if isinstance(item, dict):
            for title, value in item.items():
                if isinstance(value, str):
                    acc[value] = title
                else:
                    nav_titles(value, acc)
    return acc


# ── Dibujo ───────────────────────────────────────────────────────────────

def canvas():
    img = Image.new("RGBA", (W, H), INK + (255,))
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(grid)
    for x in range(0, W, 40):
        g.line([(x, 0), (x, H)], fill=MUTED + (12,))
    for y in range(0, H, 40):
        g.line([(0, y), (W, y)], fill=MUTED + (12,))
    return Image.alpha_composite(img, grid)


def overlay(img, paint):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    paint(ImageDraw.Draw(layer))
    return Image.alpha_composite(img, layer)


def mark(d, x, y, size=46):
    """La marca EM de la cabecera."""
    d.rounded_rectangle([x, y, x + size, y + size], radius=5, outline=CYAN, width=3)
    f = COND_BOLD(int(size * 0.42))
    tw = d.textlength("EM", font=f)
    d.text((x + (size - tw) / 2, y + size / 2), "EM", font=f, fill=CYAN, anchor="lm")


def wrap(d, text, f, width, max_lines):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if d.textlength(test, font=f) <= width:
            cur = test
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        while d.textlength(last + "…", font=f) > width and " " in last:
            last = last.rsplit(" ", 1)[0]
        lines[-1] = last.rstrip(",.:;") + "…"
    return lines


def chips(d, items, x, y, max_x, f, h=40):
    """Fila de chips; si no caben todos, termina en +N."""
    pad = 14
    for i, item in enumerate(items):
        w = d.textlength(item, font=f) + pad * 2
        rest = len(items) - i - 1
        more_w = (d.textlength(f"+{rest}", font=f) + pad * 2 + 10) if rest else 0
        if x + w + more_w > max_x:
            label = f"+{len(items) - i}"
            w = d.textlength(label, font=f) + pad * 2
            d.rounded_rectangle([x, y, x + w, y + h], radius=4, outline=LINE, width=2)
            d.text((x + pad, y + h / 2), label, font=f, fill=MUTED, anchor="lm")
            return
        d.rounded_rectangle([x, y, x + w, y + h], radius=4, outline=LINE, width=2)
        d.text((x + pad, y + h / 2), item, font=f, fill=TEXT2, anchor="lm")
        x += w + 10


def topology(img, ox, oy, sw, sh, alpha=1.0, labels=True):
    """La red de la portada en pequeño: tráfico, ataque y alerta en wazuh."""
    nodes = {
        "kali": (0.02, 0.62, "attacker"), "internet": (0.16, 0.92, "cloud"),
        "pfsense": (0.34, 0.55, "fw"), "dc01": (0.56, 0.88, "host"),
        "glpi": (0.62, 0.12, "host"), "pc01": (0.78, 0.6, "host"),
        "wazuh": (0.97, 0.3, "siem"),
    }
    links = [("kali", "internet"), ("internet", "pfsense"), ("pfsense", "dc01"),
             ("dc01", "glpi"), ("dc01", "pc01"), ("pc01", "wazuh"), ("glpi", "wazuh"),
             ("dc01", "wazuh")]
    attack = ["kali", "internet", "pfsense", "dc01", "wazuh"]
    P = {k: (ox + v[0] * sw, oy + v[1] * sh) for k, v in nodes.items()}
    a = lambda v: int(v * alpha)

    def paint(d):
        for s, e in links:
            d.line([P[s], P[e]], fill=MUTED + (a(55),), width=2)
        for s, e in zip(attack, attack[1:]):
            d.line([P[s], P[e]], fill=RED + (a(90),), width=2)
        # paquetes a lo largo del ataque
        for s, e, t, col in [("internet", "pfsense", .55, RED), ("dc01", "wazuh", .6, AMBER),
                             ("dc01", "glpi", .35, CYAN), ("pc01", "wazuh", .5, CYAN)]:
            x = P[s][0] + (P[e][0] - P[s][0]) * t
            y = P[s][1] + (P[e][1] - P[s][1]) * t
            d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=col + (a(45),))
            d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=col + (a(240),))
        # alerta en wazuh
        wx, wy = P["wazuh"]
        for r, al in [(30, 140), (46, 70)]:
            d.ellipse([wx - r, wy - r, wx + r, wy + r], outline=RED + (a(al),), width=2)
        for k, (x, y) in P.items():
            kind = nodes[k][2]
            if kind == "fw":
                d.polygon([(x, y - 11), (x + 11, y), (x, y + 11), (x - 11, y)],
                          fill=INK + (255,), outline=TEXT + (a(170),))
            elif kind == "siem":
                d.ellipse([x - 11, y - 11, x + 11, y + 11], fill=INK + (255,), outline=RED + (a(255),), width=3)
                d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=RED + (a(255),))
            else:
                col = RED if kind == "attacker" else (MUTED if kind == "cloud" else CYAN)
                d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=INK + (255,), outline=col + (a(200),), width=3)
            if labels:
                d.text((x + 15, y), k, font=MONO(17), fill=TEXT + (a(110),), anchor="lm")
        if labels:
            d.text((wx - 6, wy - 62), "alerta · 4625", font=MONO(17), fill=RED + (a(235),), anchor="mm")

    return overlay(img, paint)


def finish(img, path):
    img.convert("RGB").save(path, "PNG", optimize=True)
    print("  ", path.relative_to(ROOT))


# ── Miniaturas ───────────────────────────────────────────────────────────

def general(cfg, home):
    hero = home.get("hero", {})
    img = canvas()
    img = topology(img, 640, 400, 470, 170)
    d = ImageDraw.Draw(img)

    mark(d, M, 64)
    d.text((M + 64, 87), cfg.get("site_description", ""), font=SANS(24), fill=MUTED, anchor="lm")

    first, _, rest = hero.get("nombre", "").partition(" ")
    f = COND_SEMI(122)
    d.text((M - 4, 150), first, font=f, fill=TEXT)
    d.text((M - 4, 262), rest, font=f, fill=TEXT)

    intro = (home.get("proyectos") or {}).get("intro", "")
    for i, line in enumerate(wrap(d, intro, SANS(27), 560, 3)):
        d.text((M, 418 + i * 38), line, font=SANS(27), fill=TEXT2)

    url = cfg["site_url"].split("://", 1)[-1].rstrip("/")
    d.text((M, 570), url, font=MONO(22), fill=CYAN)
    finish(img, OUT / "portfolio.png")


def project(cfg, slug, title, pr):
    img = canvas()
    img = topology(img, 830, 36, 300, 150, alpha=.55, labels=False)
    d = ImageDraw.Draw(img)

    mark(d, M, 58, 42)
    d.text((M + 58, 79), "Enrique Montalvo", font=COND_SEMI(28), fill=TEXT, anchor="lm")

    # Estado, contexto y fechas
    y = 168
    estado = str(pr.get("estado", ""))
    col = {"completado": GREEN, "en curso": AMBER}.get(estado.lower(), MUTED)
    d.ellipse([M, y - 6, M + 12, y + 6], fill=col)
    x = M + 24
    for i, part in enumerate([estado, pr.get("contexto"), pr.get("fechas")]):
        if not part:
            continue
        f = SANS(25)
        d.text((x, y), str(part), font=f, fill=TEXT if i == 0 else MUTED, anchor="lm")
        x += d.textlength(str(part), font=f) + 30

    # Título: mejor en una línea (aunque sea algo más pequeño); si no, en dos
    def fit(sizes, max_lines):
        for size in sizes:
            f = COND_SEMI(size)
            lines = wrap(d, title, f, W - 2 * M, 3)
            if len(lines) <= max_lines:
                return size, f, lines
        return size, f, lines[:2]

    size, f, lines = fit((84, 76), 1)
    if len(lines) > 1:
        size, f, lines = fit((84, 72, 62), 2)
    y = 205
    for line in lines:
        d.text((M - 3, y), line, font=f, fill=TEXT)
        y += int(size * 1.05)

    # Resumen, hasta donde quepa antes de los chips
    chips_y = 488
    f = SANS(28)
    room = max(1, min(3, (chips_y - 24 - (y + 24)) // 40))
    for i, line in enumerate(wrap(d, str(pr.get("resumen", "")), f, W - 2 * M - 40, room)):
        d.text((M, y + 24 + i * 40), line, font=f, fill=TEXT2)

    chips(d, [str(s) for s in pr.get("stack", [])], M, chips_y, W - M, COND_MED(23))

    d.line([(M, 552), (W - M, 552)], fill=LINE, width=2)
    url = cfg["site_url"].split("://", 1)[-1].rstrip("/") + f"/proyectos/{slug}/"
    d.text((M, 590), url, font=MONO(21), fill=CYAN, anchor="lm")
    finish(img, OUT / f"{slug}.png")


def main():
    cfg = yaml.load((ROOT / "mkdocs.yml").read_text(encoding="utf-8"), Loader=_Loader)
    titles = nav_titles(cfg.get("nav"))
    OUT.mkdir(exist_ok=True)
    print("Miniaturas:")
    general(cfg, front_matter(DOCS / "index.md"))
    for md in sorted((DOCS / "proyectos").glob("*.md")):
        pr = front_matter(md).get("proyecto")
        if not pr:
            continue
        rel = md.relative_to(DOCS).as_posix()
        title = titles.get(rel) or md.stem
        project(cfg, md.stem, title, pr)


if __name__ == "__main__":
    main()
