"""
gen-sketch.py — one-time asset tooling.

Bakes a stylized version of the hero photo for the index "design becomes
reality" load animation (the drawing develops into the finished photo).

STYLE:
  "cad"    — crisp edge-extracted linework (a CAD/technical wireframe), toned
             in the site's engineering-ink teal on warm paper. Matches the
             dimension-line / blueprint / title-block language.
  "pencil" — classic dodge pencil sketch (soft graphite on paper).

Run:  python scripts/gen-sketch.py
Requires: Pillow  (pip install Pillow)
"""

from PIL import Image, ImageOps, ImageFilter, ImageMath

SRC = "images/shop/185855_orig.jpg"
OUT = "images/shop/185855_sketch.png"
STYLE = "cad"

# palette (matches site.css tokens)
PAPER = (247, 244, 236)   # --paper
INK = (44, 50, 56)        # graphite (pencil)
ACCENT = (39, 58, 71)     # ~--accent teal, a touch deeper so thin lines read


def pencil(gray):
    inv = ImageOps.invert(gray)
    radius = max(8, round(gray.width / 85))
    blurred = inv.filter(ImageFilter.GaussianBlur(radius))
    expr = "convert(min(a * 255 / (256 - b), 255), 'L')"
    try:
        sketch = ImageMath.unsafe_eval(expr, a=gray, b=blurred)
    except AttributeError:
        sketch = ImageMath.eval(expr, a=gray, b=blurred)
    sketch = ImageOps.autocontrast(sketch, cutoff=1)
    return ImageOps.colorize(sketch, black=INK, white=PAPER)


def cad(gray):
    # soften fine texture so we trace structure, not noise
    base = gray.filter(ImageFilter.GaussianBlur(0.8))
    edges = base.filter(ImageFilter.FIND_EDGES)        # bright edges on black
    edges = ImageOps.autocontrast(edges, cutoff=2)
    # suppress weak/noisy edges, firm up the strong structural lines
    edges = edges.point(lambda p: 0 if p < 22 else min(255, int((p - 22) * 1.7)))
    # thicken lines very slightly so the wireframe reads at display size
    edges = edges.filter(ImageFilter.MaxFilter(3))
    # edges: 0 = no line (paper), 255 = strong line (ink)
    return ImageOps.colorize(edges, black=PAPER, white=ACCENT).convert("RGB")


def main():
    gray = Image.open(SRC).convert("L")
    out = cad(gray) if STYLE == "cad" else pencil(gray).convert("RGB")
    # duotone needs few colors — palette PNG keeps it light
    out = out.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    out.save(OUT, optimize=True)
    print(f"saved {OUT}  {out.size}  style={STYLE}")


if __name__ == "__main__":
    main()
