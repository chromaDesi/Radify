---
name: design-direction
description: Visual/UX direction for Radify - Minecraft-style pixel art jukebox in a sunlit diner
metadata:
  type: project
---

Radify's UI should feel homey, warm, and like a game — not a typical dark, sleek music-streaming app, and not "small/fine-detail pixel art" either (an early pass reads as Terraria; the target is genuinely Minecraft: flat color blocks, thick outlines, two-tone block-face shading, no gradients). The scene is a full-screen jukebox-in-a-sunlit-diner game world with floating HUD panels on top, not a centered stacked card. Warm amber/orange lighting, soft wood tones, a pixel font.

**Why:** this is an explicit, deliberate stylistic choice from the user, confirmed and sharpened after seeing the first pass — it should carry through mockups, component design, and copy tone, not just a color palette swap on a generic template.

**How to apply:** when doing frontend/design work on this project, default to the `pixel-ui-designer` agent (`.claude/agents/pixel-ui-designer.md`) and follow the concrete mechanics documented in `CLAUDE.md`'s Conventions section (the authoritative, current source — this file is a summary): native-texel PNG sprites (never CSS box-shadow grids, never SVG, never upscaled in Python) scaled only via the two locked CSS custom properties `--px`/`--px-hero`, both multiples of 4; far background as seamless repeating CSS tiles, hero/prop sprites as fixed-size bottom-anchored PNGs — never one image stretched to fill the viewport; `steps()`-driven sprite-sheet scrubbing for animation (vinyl spin, tonearm drop/pull), never CSS `rotate()`/`transform` on pixel art and never smooth easing; the PixelPanel double-bevel (light inset top/left, dark inset bottom/right, solid drop shadow) for the Minecraft inventory-window frame, not soft/blurred shadows; a single locked warm palette; Silkscreen/Pixelify Sans fonts (OFL, via next/font/google), Press Start 2P for the logo only. "Minecraft-style" means the blocky/limited-palette idiom, never actual Mojang textures or the Minecraft font. See [[project-idea]] for what the app actually does.
