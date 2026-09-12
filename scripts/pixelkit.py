"""
Shared Minecraft-idiom drawing primitives for Radify's pixel art.

Two hard rules for everything drawn with this module:
1. No feature smaller than 2 texels.
2. Every discrete object gets a full 1-texel INK outline on its
   silhouette, plus INK seams between adjoining block faces.

Assets are written at NATIVE texel resolution — no upscaling here.
All scaling happens in CSS via --px / --px-hero (see globals.css).
"""

from PIL import Image, ImageDraw

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

# Material 3-tone ramps: (light, face, dark). Pick one per object; never
# mix ramps within the same block.
MATERIALS = {
    "wallpaper": (CREAM, AMBER_100, CREAM_DARK),
    "wood_panel": (WOOD_LIGHT, WOOD, WOOD_DARK),
    "floor_light": (CREAM, CREAM_DARK, AMBER_100),
    "floor_dark": (AMBER_300, AMBER_500, AMBER_700),
    "gold_trim": (GOLD, AMBER_500, AMBER_700),
    "upholstery": (EMBER, EMBER_DARK, INK_SOFT),
    "vinyl": (INK_SOFT, VINYL, INK),
    "glass_neon": (CREAM, NEON, INK_SOFT),
}


def new_canvas(w, h):
    return Image.new("RGBA", (w, h), TRANSPARENT)


def _ramp(material):
    return MATERIALS[material] if isinstance(material, str) else material


def block(d, x, y, size, material, outline=INK):
    """One Minecraft-style block: flat face, a 2-texel lighter band on
    the top+left, a 2-texel darker band on the bottom+right, and a
    1-texel outline around the whole thing."""
    light, face, dark = _ramp(material)
    x1, y1 = x + size - 1, y + size - 1
    d.rectangle([x, y, x1, y1], fill=face)
    d.rectangle([x, y, x1, y + 1], fill=light)
    d.rectangle([x, y, x + 1, y1], fill=light)
    d.rectangle([x, y1 - 1, x1, y1], fill=dark)
    d.rectangle([x1 - 1, y, x1, y1], fill=dark)
    d.rectangle([x, y, x1, y1], outline=outline, width=1)


def bevel_rect(d, x0, y0, x1, y1, material, outline=INK, ow=1):
    """Same 3-tone bevel convention as block(), for a non-square rect."""
    light, face, dark = _ramp(material)
    d.rectangle([x0, y0, x1, y1], fill=face)
    d.rectangle([x0, y0, x1, y0 + 1], fill=light)
    d.rectangle([x0, y0, x0 + 1, y1], fill=light)
    d.rectangle([x0, y1 - 1, x1, y1], fill=dark)
    d.rectangle([x1 - 1, y0, x1, y1], fill=dark)
    d.rectangle([x0, y0, x1, y1], outline=outline, width=ow)


def speckle(d, rect, color, count, rng):
    """Very sparse single-texel noise confined within rect."""
    x0, y0, x1, y1 = rect
    for _ in range(count):
        x = rng.randint(x0, x1)
        y = rng.randint(y0, y1)
        d.point((x, y), fill=color)


def save_native(img, path):
    img.save(path)
    print(f"wrote {path} ({img.width}x{img.height})")


def preview_tiled_3x3(tile_path, out_path):
    """Debug helper: lay a tile 3x3 so seams are actually checkable —
    a single isolated tile won't reveal a broken repeat."""
    tile = Image.open(tile_path).convert("RGBA")
    w, h = tile.size
    sheet = Image.new("RGBA", (w * 3, h * 3), TRANSPARENT)
    for ty in range(3):
        for tx in range(3):
            sheet.paste(tile, (tx * w, ty * h))
    sheet.save(out_path)
    print(f"wrote {out_path} (3x3 tiling of {tile_path})")
