---
name: design-direction
description: Visual/UX direction for Radify - Minecraft-style pixel art jukebox in a sunlit diner
metadata:
  type: project
---

Radify's UI should feel homey and warm rather than like a typical dark, sleek music-streaming app. The target aesthetic is Minecraft-style pixel art depicting a jukebox sitting in a sunlit diner: blocky pixel-art assets, a pixel font, warm amber/orange lighting, soft wood tones.

**Why:** this is an explicit, deliberate stylistic choice from the user, not a placeholder — it should carry through mockups, component design, and copy tone, not just a color palette swap on a generic template.

**How to apply:** when doing frontend/design work on this project, default to the `pixel-ui-designer` agent (`.claude/agents/pixel-ui-designer.md`). The generic `frontend-design` skill is not the calibration source here — the plan locked concrete, specific pixel-art mechanics that should be followed directly instead: hand-authored PNG sprites (not CSS box-shadow grids, not SVG) at a small native resolution (320×180), scaled by whole integer multiples only with `image-rendering: pixelated`; the scene layered as separate PNGs (wall/floor/window/booth/jukebox/glow); animation via `steps()` timing only, never smooth easing; a Tailwind v4 `@theme` override (4px spacing scale, `--radius: 0`, hard zero-blur shadows) with `border-image` 9-slice PNGs for panels; a single locked 16–24 colour warm palette; Silkscreen/Pixelify Sans fonts (OFL, via next/font/google), Press Start 2P for the logo only. "Minecraft-style" means the blocky/limited-palette idiom, never actual Mojang textures or the Minecraft font. See [[project-idea]] for what the app actually does.
