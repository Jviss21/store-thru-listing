# Hammoq brand tokens (IMS)

Source of truth for visual identity across **store-thru-listing** (IMS) and sibling surfaces (Fake eBay / Hammoq Market).

## Core palette

| Token | CSS variable | Hex | Role |
|-------|--------------|-----|------|
| Navy (ink) | `--ink` | `#0d1b34` | Primary surfaces, heroes, primary buttons, text |
| Ink soft | `--ink-soft` | `#162a4a` | Hover / secondary navy |
| Gold | `--gold` / `--accent` | `#f0b429` | Accent CTAs, badges, hero highlights |
| Orange | `--orange` / `--brand-orange` | `#e87a1a` | Secondary accent |
| Rust | `--rust` / `--coral` / `--danger` | `#c94a2a` | Danger / destructive |
| Mustard | `--mustard` / `--success` | `#c9a032` | Success / positive status |
| Save OK | `--save-ok` | `#0f9b94` | Save confirmation pulse |
| Mist | `--mist` | `#e9eef5` | Table headers, soft panels |
| Paper | `--paper` / `--background` | `#f6f8fb` | Page background |
| Muted | `--muted` | `#5a6b82` | Secondary text |

Defined in `src/app/globals.css`; Tailwind maps in `tailwind.config.ts`.

## UI patterns

- **Buttons:** `primary` = navy (`bg-ink`); `accent` = gold (`bg-accent` + `shadow-glow`); `secondary` = orange; `danger` = rust.
- **Heroes:** Navy (`bg-ink`) with gold left rail or accent icon tile; gold radial wash optional.
- **Cards:** `rounded-2xl border-ink/8 bg-white/75 shadow-card backdrop-blur`.
- **Typography:** `font-display` for titles; body via `--font-body`.
- **Avoid:** Generic SaaS purple / violet / indigo gradients.

## Sibling apps

| App | Path | Notes |
|-----|------|--------|
| IMS | this repo | Tokens above |
| Fake eBay / Hammoq Market | `..\..\Online Marketplace\web` | Same hex tokens in `src/app/globals.css` (forest/moss/amber aliases → navy/gold) |

See also [INTEGRATIONS.md](./INTEGRATIONS.md) (Fake eBay wiring + CTA map).
