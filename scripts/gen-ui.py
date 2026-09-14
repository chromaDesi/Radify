"""
Generates Radify's HUD icon sheet and modal-backdrop dither tile, at
native texel resolution — same convention as gen-scene.py.
"""

import math

from PIL import Image, ImageDraw

from pixelkit import GOLD, INK, TRANSPARENT, new_canvas, save_native

OUT = "public/ui"
CELL = 12
ICON_NAMES = ["play", "pause", "prev", "next", "gear", "check", "cross", "google"]

# Google brand colors — a deliberate, disclosed exception to the locked
# palette, used only for this inert placeholder control's icon.
GOOGLE_BLUE = (66, 133, 244, 255)
GOOGLE_RED = (234, 67, 53, 255)
GOOGLE_YELLOW = (251, 188, 5, 255)
GOOGLE_GREEN = (52, 168, 83, 255)


def _icon_canvas():
    return new_canvas(CELL, CELL)


def draw_play(d):
    d.polygon([(3, 2), (3, 9), (9, 5)], fill=INK)


def draw_pause(d):
    d.rectangle([3, 2, 5, 9], fill=INK)
    d.rectangle([7, 2, 9, 9], fill=INK)


def draw_prev(d):
    d.rectangle([2, 2, 3, 9], fill=INK)
    d.polygon([(9, 2), (9, 9), (4, 5)], fill=INK)


def draw_next(d):
    d.rectangle([8, 2, 9, 9], fill=INK)
    d.polygon([(2, 2), (2, 9), (7, 5)], fill=INK)


def draw_gear(d):
    cx = cy = CELL // 2
    d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=INK)
    d.ellipse([cx - 1, cy - 1, cx + 1, cy + 1], fill=TRANSPARENT)
    for angle in range(0, 360, 45):
        a = math.radians(angle)
        tx, ty = cx + 4.5 * math.cos(a), cy + 4.5 * math.sin(a)
        d.rectangle([tx - 1, ty - 1, tx + 1, ty + 1], fill=INK)


def draw_check(d):
    d.line([(2, 6), (5, 9), (10, 2)], fill=INK, width=2)


def draw_cross(d):
    d.line([(2, 2), (9, 9)], fill=INK, width=2)
    d.line([(9, 2), (2, 9)], fill=INK, width=2)


def draw_google(d):
    cx = cy = CELL // 2
    r_out, r_in = 5, 3
    for y in range(CELL):
        for x in range(CELL):
            dx, dy = x - cx, y - cy
            dist2 = dx * dx + dy * dy
            if not (r_in * r_in <= dist2 <= r_out * r_out):
                continue
            angle = math.degrees(math.atan2(dy, dx)) % 360
            if angle < 90:
                color = GOOGLE_RED
            elif angle < 180:
                color = GOOGLE_YELLOW
            elif angle < 270:
                color = GOOGLE_GREEN
            else:
                color = GOOGLE_BLUE
            d.point((x, y), fill=color)
    # the crossbar that makes a ring read as a "G"
    d.rectangle([cx, cy - 1, cx + r_out, cy + 1], fill=GOOGLE_BLUE)


DRAWERS = {
    "play": draw_play,
    "pause": draw_pause,
    "prev": draw_prev,
    "next": draw_next,
    "gear": draw_gear,
    "check": draw_check,
    "cross": draw_cross,
    "google": draw_google,
}


def make_icon_sheet():
    sheet = new_canvas(CELL * len(ICON_NAMES), CELL)
    for i, name in enumerate(ICON_NAMES):
        cell = _icon_canvas()
        d = ImageDraw.Draw(cell)
        DRAWERS[name](d)
        sheet.paste(cell, (i * CELL, 0), cell)
    return sheet


def make_dither_dim():
    """4x4 ordered-dither tile for the settings-modal ::backdrop."""
    img = new_canvas(4, 4)
    d = ImageDraw.Draw(img)
    pattern = [
        (0, 0, 170), (2, 0, 110),
        (0, 2, 110), (2, 2, 170),
    ]
    for x, y, a in pattern:
        d.rectangle([x, y, x + 1, y + 1], fill=(*INK[:3], a))
    return img


def main():
    import os

    os.makedirs(OUT, exist_ok=True)
    save_native(make_icon_sheet(), f"{OUT}/icons.png")
    save_native(make_dither_dim(), f"{OUT}/dither-dim.png")
    print("icon order:", ICON_NAMES)


if __name__ == "__main__":
    main()
