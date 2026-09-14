"""
Generates Radify's diner/jukebox pixel art at NATIVE texel resolution —
no upscaling here. CSS scales everything via --px / --px-hero.

World tiles repeat via CSS background-repeat, so the far background
fills any viewport with zero stretching. Hero sprites (the jukebox
group) are fixed-size and bottom-anchored to the floor line.

Run `python scripts/gen-scene.py` to (re)generate everything, or
`python scripts/gen-scene.py --preview` to also write 3x3-tiled
previews of every seamless tile for a manual seam check.
"""

import math
import random
import sys

from PIL import Image, ImageDraw

from pixelkit import (
    AMBER_300,
    AMBER_500,
    AMBER_700,
    CREAM,
    CREAM_DARK,
    EMBER,
    EMBER_DARK,
    GOLD,
    INK,
    INK_SOFT,
    NEON,
    TRANSPARENT,
    VINYL,
    WOOD,
    WOOD_DARK,
    WOOD_LIGHT,
    bevel_rect,
    block,
    new_canvas,
    preview_tiled_3x3,
    save_native,
    speckle,
)

OUT = "public/scene"
TILE = 16  # texels per repeating world tile


# ------------------------------------------------------------- tiles
def make_tile_wall():
    img = new_canvas(TILE, TILE)
    d = ImageDraw.Draw(img)
    block(d, 0, 0, TILE, "wallpaper")
    speckle(d, (2, 2, TILE - 3, TILE - 3), CREAM_DARK, 2, random.Random(1))
    return img


def make_tile_wainscot():
    img = new_canvas(TILE, TILE)
    d = ImageDraw.Draw(img)
    block(d, 0, 0, TILE, "wood_panel")
    speckle(d, (2, 2, TILE - 3, TILE - 3), WOOD_DARK, 2, random.Random(2))
    return img


def make_tile_floor():
    img = new_canvas(TILE, TILE)
    d = ImageDraw.Draw(img)
    half = TILE // 2
    block(d, 0, 0, half, "floor_light")
    block(d, half, 0, half, "floor_dark")
    block(d, 0, half, half, "floor_dark")
    block(d, half, half, half, "floor_light")
    return img


def make_trim_rail():
    img = new_canvas(TILE, 6)
    d = ImageDraw.Draw(img)
    bevel_rect(d, 0, 0, TILE - 1, 1, "gold_trim")
    bevel_rect(d, 0, 2, TILE - 1, 5, "wood_panel")
    return img


def make_trim_baseboard():
    img = new_canvas(TILE, 4)
    d = ImageDraw.Draw(img)
    bevel_rect(d, 0, 0, TILE - 1, 3, "wood_panel")
    return img


def make_tile_dust(size=48, seed=7):
    rnd = random.Random(seed)
    img = new_canvas(size, size)
    d = ImageDraw.Draw(img)
    for _ in range(14):
        x, y = rnd.randint(0, size - 1), rnd.randint(0, size - 1)
        a = rnd.randint(70, 180)
        c = GOLD if rnd.random() < 0.6 else CREAM_DARK
        d.point((x, y), fill=(*c[:3], a))
    return img


# ------------------------------------------------------------- props
def make_window_group():
    """Window with a hard-stepped light shaft baked in, terminating at
    the sprite's bottom edge (positioned flush with the floor line)."""
    w, h = 56, 88
    img = new_canvas(w, h)
    d = ImageDraw.Draw(img)

    wx0, wy0, wx1, wy1 = 6, 4, 49, 43
    bevel_rect(d, wx0 - 2, wy0 - 2, wx1 + 2, wy1 + 2, "wood_panel")

    # two flat panes — sky, then a sun-block band — instead of a gradient
    midy = (wy0 + wy1) // 2
    d.rectangle([wx0, wy0, wx1, midy], fill=AMBER_300)
    d.rectangle([wx0, midy + 1, wx1, wy1], fill=GOLD)
    d.rectangle([wx0, wy0, wx1, wy1], outline=INK, width=1)

    # mullions
    midx = (wx0 + wx1) // 2
    d.rectangle([midx - 1, wy0, midx + 1, wy1], fill=WOOD_DARK)
    d.rectangle([wx0, midy - 1, wx1, midy + 1], fill=WOOD_DARK)

    # hard-stepped light shaft, 4 solid alpha tiers, wide staircase steps
    shaft_top = wy1 + 3
    tiers = [(0.55, 4), (0.4, 4), (0.28, 5), (0.18, h - shaft_top - 13)]
    left0, right0 = wx0 + 3, wx1 - 3
    y = shaft_top
    step_i = 0
    for alpha_f, step_h in tiers:
        spread = step_i * 5
        left = max(0, left0 - spread)
        right = min(w - 1, right0 + spread)
        a = int(255 * alpha_f)
        d.rectangle([left, y, right, y + step_h - 1], fill=(*AMBER_100_RGB, a))
        y += step_h
        step_i += 1

    return img


AMBER_100_RGB = (255, 217, 160)


def make_booth():
    w, h = 56, 48
    img = new_canvas(w, h)
    d = ImageDraw.Draw(img)

    # bench back
    bevel_rect(d, 0, 0, w - 1, 22, "upholstery")
    # bench seat
    bevel_rect(d, 0, 23, w - 1, 34, "upholstery")
    d.rectangle([0, 23, w - 1, 24], fill=GOLD)

    # small table
    tx0, ty0, tx1, ty1 = 30, 20, 55, 26
    bevel_rect(d, tx0, ty0, tx1, ty1, "wood_panel")
    d.rectangle([tx0 + 10, ty1, tx0 + 14, h - 3], fill=WOOD_DARK)
    d.rectangle([tx0, h - 3, tx1, h - 1], fill=WOOD_DARK)

    return img


# ------------------------------------------------------------- hero: jukebox body
HW, HH = 48, 64  # hero texel bounding box


def make_jukebox_back():
    img = new_canvas(HW, HH)
    d = ImageDraw.Draw(img)
    bevel_rect(d, 6, 10, HW - 7, 40, "vinyl", outline=INK)
    return img


def make_jukebox_front():
    img = new_canvas(HW, HH)
    d = ImageDraw.Draw(img)

    # feet
    d.rectangle([4, HH - 3, 8, HH - 1], fill=INK)
    d.rectangle([HW - 9, HH - 3, HW - 5, HH - 1], fill=INK)

    # body
    bevel_rect(d, 2, 20, HW - 3, HH - 4, "wood_panel")

    # dome top — two large blocky steps, not a fine curve
    bevel_rect(d, 6, 4, HW - 7, 11, "gold_trim")
    bevel_rect(d, 2, 12, HW - 3, 19, "gold_trim")

    # mechanism cutout (transparent — vinyl/tonearm show through here)
    cx0, cy0, cx1, cy1 = 5, 21, HW - 6, 45
    d.rectangle([cx0 - 1, cy0 - 1, cx1 + 1, cy1 + 1], outline=INK, width=1)
    d.rectangle([cx0, cy0, cx1, cy1], fill=TRANSPARENT)

    # control strip
    sy0 = 48
    bevel_rect(d, 4, sy0, HW - 5, sy0 + 6, "upholstery")
    for i, bx in enumerate(range(7, HW - 8, 5)):
        d.rectangle([bx, sy0 + 2, bx + 2, sy0 + 4], fill=GOLD if i % 2 == 0 else AMBER_300)

    # coin slot
    d.rectangle([HW - 11, sy0 + 9, HW - 7, sy0 + 10], fill=INK)

    # side trim
    d.rectangle([2, 20, 3, HH - 4], fill=GOLD)
    d.rectangle([HW - 4, 20, HW - 3, HH - 4], fill=GOLD)

    return img


def make_jukebox_glow():
    img = new_canvas(HW, HH)
    d = ImageDraw.Draw(img)
    # flat, stepped bleed — not blurred — behind the dome and mechanism
    d.rectangle([4, 6, HW - 5, 46], fill=(*AMBER_500[:3], 70))
    d.rectangle([8, 10, HW - 9, 42], fill=(*GOLD[:3], 90))
    return img


# ------------------------------------------------------------- hero: vinyl sheet
VINYL_FRAMES = 8
VINYL_SPAN_DEG = 90  # 4-fold label symmetry -> only need one quarter turn
VF = 32  # frame size


def _draw_vinyl_frame(d, cx, cy, angle_deg):
    r_disc = 15
    r_label = 7
    r_spindle = 1

    # disc — rotation-invariant
    d.ellipse([cx - r_disc, cy - r_disc, cx + r_disc, cy + r_disc], fill=VINYL, outline=INK)
    for r in (13, 10, 8):
        shade = INK_SOFT if r % 4 == 1 else VINYL
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=shade, width=1)

    # label — 4 alternating wedges, classified per-pixel so edges stay crisp
    for y in range(cy - r_label, cy + r_label + 1):
        for x in range(cx - r_label, cx + r_label + 1):
            dx, dy = x - cx, y - cy
            if dx * dx + dy * dy > r_label * r_label:
                continue
            angle = (math.degrees(math.atan2(dy, dx)) - angle_deg) % 90
            d.point((x, y), fill=GOLD if angle < 45 else AMBER_700)
    d.ellipse(
        [cx - r_label, cy - r_label, cx + r_label, cy + r_label], outline=INK, width=1
    )

    # 4 light-catch streaks, 90 degrees apart, rotating with the label —
    # keeps the loop seamless since everything visible has 4-fold symmetry
    for k in range(4):
        a = math.radians(angle_deg + k * 90)
        for t in (9, 11, 13):
            x = int(cx + t * math.cos(a))
            y = int(cy + t * math.sin(a))
            if 0 <= x < VF and 0 <= y < VF:
                d.point((x, y), fill=CREAM)

    # spindle
    d.ellipse(
        [cx - r_spindle, cy - r_spindle, cx + r_spindle, cy + r_spindle], fill=INK
    )


def make_vinyl_sheet():
    sheet = new_canvas(VF * VINYL_FRAMES, VF)
    for i in range(VINYL_FRAMES):
        frame = new_canvas(VF, VF)
        d = ImageDraw.Draw(frame)
        angle = (VINYL_SPAN_DEG / VINYL_FRAMES) * i
        _draw_vinyl_frame(d, VF // 2, VF // 2, angle)
        sheet.paste(frame, (i * VF, 0), frame)
    return sheet


# ------------------------------------------------------------- hero: tonearm sheet
ARM_FRAMES = 7
AW, AH = 28, 24
PIVOT = (AW - 4, 4)  # top-right mount
PARKED_ANGLE = 250  # degrees, pointing away from the record
LANDED_ANGLE = 165  # resting on the record's outer groove
ARM_LEN = 20


def _draw_tonearm_frame(d, t):
    angle = PARKED_ANGLE + (LANDED_ANGLE - PARKED_ANGLE) * t
    a = math.radians(angle)
    px, py = PIVOT
    ex = px + ARM_LEN * math.cos(a)
    ey = py + ARM_LEN * math.sin(a)

    # pivot mount
    d.ellipse([px - 3, py - 3, px + 3, py + 3], fill=GOLD, outline=INK)
    # shaft — outline first (wider line beneath), then face color on top
    d.line([px, py, ex, ey], fill=INK, width=4)
    d.line([px, py, ex, ey], fill=WOOD_LIGHT, width=2)
    # head / cartridge
    d.rectangle([ex - 2, ey - 2, ex + 2, ey + 2], fill=INK)
    d.rectangle([ex - 1, ey - 1, ex + 1, ey + 1], fill=GOLD)


def make_tonearm_sheet():
    sheet = new_canvas(AW * ARM_FRAMES, AH)
    for i in range(ARM_FRAMES):
        frame = new_canvas(AW, AH)
        d = ImageDraw.Draw(frame)
        t = i / (ARM_FRAMES - 1)
        _draw_tonearm_frame(d, t)
        sheet.paste(frame, (i * AW, 0), frame)
    return sheet


# ------------------------------------------------------------------ main
TILES = ["tile-wall", "tile-wainscot", "tile-floor"]


def main():
    import os

    os.makedirs(OUT, exist_ok=True)

    save_native(make_tile_wall(), f"{OUT}/tile-wall.png")
    save_native(make_tile_wainscot(), f"{OUT}/tile-wainscot.png")
    save_native(make_tile_floor(), f"{OUT}/tile-floor.png")
    save_native(make_trim_rail(), f"{OUT}/trim-rail.png")
    save_native(make_trim_baseboard(), f"{OUT}/trim-baseboard.png")
    save_native(make_tile_dust(), f"{OUT}/tile-dust.png")

    save_native(make_window_group(), f"{OUT}/window-group.png")
    save_native(make_booth(), f"{OUT}/booth.png")

    save_native(make_jukebox_back(), f"{OUT}/jukebox-back.png")
    save_native(make_jukebox_front(), f"{OUT}/jukebox-front.png")
    save_native(make_jukebox_glow(), f"{OUT}/jukebox-glow.png")
    save_native(make_vinyl_sheet(), f"{OUT}/vinyl-spin.png")
    save_native(make_tonearm_sheet(), f"{OUT}/tonearm-sweep.png")

    if "--preview" in sys.argv:
        for name in TILES:
            preview_tiled_3x3(f"{OUT}/{name}.png", f"{OUT}/_preview-{name}.png")


if __name__ == "__main__":
    main()
