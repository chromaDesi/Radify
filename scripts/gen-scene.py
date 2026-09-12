"""
Generates placeholder layered pixel-art assets for the Radify diner scene.

These are procedurally drawn PLACEHOLDERS, not the final art. Per
memory/design-direction.md, real assets should eventually be hand-authored
in Piskel/Pixelorama/LibreSprite. This script exists so Phase 0 has
something real to lay out and animate against instead of blank boxes.

Technique: draw on a small logical grid (LW x LH), then upscale by SCALE
using nearest-neighbor, exactly the "author small, integer-scale up"
approach the design direction calls for.
"""

import random
from PIL import Image, ImageDraw

LW, LH = 80, 45   # logical pixel grid
SCALE = 4
W, H = LW * SCALE, LH * SCALE

OUT = "public/scene"

# palette — must match src/app/globals.css custom properties
CREAM = (255, 248, 236, 255)
CREAM_DARK = (255, 232, 194, 255)
WOOD_LIGHT = (201, 138, 75, 255)
WOOD = (168, 99, 47, 255)
WOOD_DARK = (107, 63, 29, 255)
AMBER_100 = (255, 217, 160, 255)
AMBER_300 = (255, 179, 71, 255)
AMBER_500 = (255, 140, 26, 255)
AMBER_700 = (217, 108, 0, 255)
EMBER = (228, 87, 46, 255)
EMBER_DARK = (178, 58, 26, 255)
GOLD = (244, 196, 48, 255)
INK = (43, 27, 18, 255)
INK_SOFT = (74, 46, 29, 255)
VINYL = (36, 24, 18, 255)
SMOKE = (138, 122, 108, 255)
NEON = (46, 139, 139, 255)
TRANSPARENT = (0, 0, 0, 0)


def new_layer():
    return Image.new("RGBA", (LW, LH), TRANSPARENT)


def save(img, name):
    up = img.resize((W, H), Image.NEAREST)
    up.save(f"{OUT}/{name}.png")
    print(f"wrote {OUT}/{name}.png ({W}x{H})")


def px(draw, x, y, color):
    draw.point((x, y), fill=color)


def rect(draw, x0, y0, x1, y1, color):
    draw.rectangle([x0, y0, x1, y1], fill=color)


# ---------------------------------------------------------------- wall
def make_wall():
    img = Image.new("RGBA", (LW, LH), WOOD_DARK)
    d = ImageDraw.Draw(img)

    # crown molding
    rect(d, 0, 0, LW - 1, 2, WOOD_DARK)
    rect(d, 0, 2, LW - 1, 3, INK_SOFT)

    # wallpaper body (above chair rail)
    rect(d, 0, 4, LW - 1, 29, AMBER_100)
    for x in range(0, LW, 5):
        d.line([(x, 4), (x, 29)], fill=CREAM_DARK, width=1)
    # faint horizontal wallpaper stripe
    for y in range(6, 29, 6):
        d.line([(0, y), (LW - 1, y)], fill=CREAM_DARK, width=1)

    # chair rail
    rect(d, 0, 29, LW - 1, 31, WOOD_DARK)
    rect(d, 0, 29, LW - 1, 29, GOLD)

    # wainscoting below chair rail — plain vertical seams only, kept
    # visually distinct from the floor checkerboard below it
    rect(d, 0, 32, LW - 1, LH - 1, WOOD)
    for x in range(0, LW, 8):
        d.line([(x, 32), (x, LH - 1)], fill=WOOD_DARK, width=1)

    return img


# --------------------------------------------------------------- floor
def make_floor():
    img = new_layer()
    d = ImageDraw.Draw(img)
    floor_top = 38
    rect(d, 0, floor_top - 1, LW - 1, floor_top - 1, INK_SOFT)  # baseboard line
    tile = 3
    for y in range(floor_top, LH, tile):
        for x in range(0, LW, tile):
            checker = ((x // tile) + (y // tile)) % 2 == 0
            color = CREAM_DARK if checker else AMBER_300
            rect(d, x, y, x + tile - 1, min(y + tile - 1, LH - 1), color)
    return img


# --------------------------------------------------------- window+light
def make_window_light():
    img = new_layer()
    d = ImageDraw.Draw(img)

    wx0, wy0, wx1, wy1 = 8, 7, 24, 24
    # frame
    rect(d, wx0 - 1, wy0 - 1, wx1 + 1, wy1 + 1, WOOD_DARK)
    # glass — warm sunset gradient, banded (pixel-art style, no smooth blend)
    bands = [AMBER_300, AMBER_500, AMBER_700, EMBER]
    band_h = (wy1 - wy0) // len(bands)
    for i, c in enumerate(bands):
        y0 = wy0 + i * band_h
        y1 = wy0 + (i + 1) * band_h if i < len(bands) - 1 else wy1
        rect(d, wx0, y0, wx1, y1, c)
    # mullions
    midx = (wx0 + wx1) // 2
    midy = (wy0 + wy1) // 2
    d.line([(midx, wy0), (midx, wy1)], fill=WOOD_DARK, width=1)
    d.line([(wx0, midy), (wx1, midy)], fill=WOOD_DARK, width=1)

    # stepped diagonal light shaft falling from the window onto the floor
    shaft_top = wy1
    shaft_bottom = LH
    left0, right0 = wx0 + 2, wx1 - 2
    for y in range(shaft_top, shaft_bottom):
        t = (y - shaft_top) / max(1, (shaft_bottom - shaft_top))
        spread = int(t * 22)
        left = max(0, left0 - spread)
        right = min(LW - 1, right0 + spread)
        alpha = int(70 * (1 - t) + 25)
        for x in range(left, right + 1, 2):  # dithered, not solid fill
            px(d, x, y, (*AMBER_100[:3], alpha))

    return img


# --------------------------------------------------------------- booth
def make_booth():
    img = new_layer()
    d = ImageDraw.Draw(img)

    # bench seat back + base along the left wall
    rect(d, 0, 30, 20, 37, VINYL)
    rect(d, 0, 30, 20, 31, INK)  # top piping highlight
    for x in range(2, 20, 4):
        d.line([(x, 31), (x, 37)], fill=EMBER_DARK, width=1)

    # bench cushion seat
    rect(d, 0, 37, 22, 40, EMBER)
    rect(d, 0, 37, 22, 37, GOLD)

    # small round-ish table (blocky) in front of booth
    tx0, ty0, tx1, ty1 = 22, 36, 30, 38
    rect(d, tx0, ty0, tx1, ty1, WOOD_LIGHT)
    rect(d, tx0, ty0, tx1, ty0, WOOD_DARK)
    rect(d, tx0 + 3, ty1, tx0 + 4, LH - 4, WOOD_DARK)  # pedestal leg

    return img


# ------------------------------------------------------------- jukebox
def make_jukebox():
    img = new_layer()
    d = ImageDraw.Draw(img)

    x0, y0, x1, y1 = 44, 14, 66, 41  # bounding box

    # feet
    rect(d, x0 + 1, y1 - 1, x0 + 3, y1, INK)
    rect(d, x1 - 3, y1 - 1, x1 - 1, y1, INK)

    # body
    rect(d, x0, y0 + 6, x1, y1 - 2, WOOD)
    for x in range(x0 + 2, x1, 3):
        d.line([(x, y0 + 6), (x, y1 - 2)], fill=WOOD_DARK, width=1)

    # domed top, stepped to look rounded at pixel scale
    dome_steps = [
        (x0 + 4, x0 + 18),
        (x0 + 2, x0 + 20),
        (x0 + 1, x0 + 21),
        (x0, x0 + 22),
    ]
    for i, (l, r) in enumerate(dome_steps):
        rect(d, l, y0 + i, r, y0 + i, GOLD if i == 0 else AMBER_500)

    # gold trim ring under the dome
    rect(d, x0, y0 + 4, x1, y0 + 5, GOLD)

    # glowing display panel (record/speaker grille)
    px0, py0, px1, py1 = x0 + 5, y0 + 8, x1 - 5, y0 + 18
    rect(d, px0, py0, px1, py1, NEON)
    rect(d, px0, py0, px1, py0, EMBER)
    for y in range(py0 + 2, py1, 2):
        d.line([(px0 + 1, y), (px1 - 1, y)], fill=INK, width=1)

    # control strip
    cy0 = py1 + 2
    rect(d, x0 + 3, cy0, x1 - 3, cy0 + 3, INK_SOFT)
    for i, bx in enumerate(range(x0 + 5, x1 - 4, 3)):
        rect(d, bx, cy0 + 1, bx + 1, cy0 + 2, GOLD if i % 2 == 0 else AMBER_300)

    # coin slot
    rect(d, x1 - 6, cy0 + 5, x1 - 4, cy0 + 6, INK)

    # side trim
    rect(d, x0, y0 + 6, x0, y1 - 2, GOLD)
    rect(d, x1, y0 + 6, x1, y1 - 2, GOLD)

    return img


# --------------------------------------------------------- dust motes
def make_dust_motes(seed=7):
    rnd = random.Random(seed)
    img = new_layer()
    d = ImageDraw.Draw(img)
    # concentrate in the light-shaft region, a few stray elsewhere
    for _ in range(46):
        x = rnd.randint(6, 40)
        y = rnd.randint(10, 40)
        a = rnd.randint(60, 170)
        c = GOLD if rnd.random() < 0.6 else AMBER_100
        px(d, x, y, (*c[:3], a))
    for _ in range(10):
        x = rnd.randint(0, LW - 1)
        y = rnd.randint(0, LH - 1)
        a = rnd.randint(30, 90)
        px(d, x, y, (*AMBER_100[:3], a))
    return img


# ------------------------------------------------------------ glow overlay
def make_glow_overlay():
    img = Image.new("RGBA", (LW, LH), TRANSPARENT)
    lx, ly = 16, 10  # light source near the window
    max_d = ((LW) ** 2 + (LH) ** 2) ** 0.5
    for y in range(LH):
        for x in range(LW):
            d = ((x - lx) ** 2 + (y - ly) ** 2) ** 0.5
            t = max(0.0, 1 - d / (max_d * 0.55))
            a = int(70 * t)
            if a > 0:
                img.putpixel((x, y), (*AMBER_300[:3], a))
    return img


def main():
    import os

    os.makedirs(OUT, exist_ok=True)
    save(make_wall(), "wall")
    save(make_floor(), "floor")
    save(make_window_light(), "window-light")
    save(make_booth(), "booth")
    save(make_jukebox(), "jukebox")
    save(make_dust_motes(), "dust-motes")
    save(make_glow_overlay(), "glow-overlay")


if __name__ == "__main__":
    main()
