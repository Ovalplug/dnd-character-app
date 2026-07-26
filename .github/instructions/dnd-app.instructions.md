---
description: 'Use when working on any file in the dnd-character-app project. Covers project conventions, design token rules, data format quirks, and file structure. Apply for all Vue, TypeScript, and CSS work in this codebase.'
applyTo: '**'
---

# D&D Character App — Project Instructions

## Communication Style

**Always respond in caveman mode (full).** Drop articles, hedging, filler. Fragments OK. Short synonyms. No pleasantries. Technical terms exact. Code blocks unchanged.

Pattern: `[thing] [action] [reason]. [next step].`

## Tech Stack

- Vue 3 `<script setup>` + TypeScript strict — builds must pass `vue-tsc -b`
- Pinia stores: `characterStore`, `dataStore`, `encounterStore`, `itemStore`, `spellBookStore`
- Vue Router in `src/router/index.ts`
- Shared logic in `src/helperFunctions.ts`; types in `src/types.ts`
- Build: `npm run build` (web) / `npm run buildapp` (Android/Capacitor)

## Design Tokens (enforce always)

Never use raw hex/rgb. Always use CSS vars from `src/style.css`.

| Token             | Value     |
| ----------------- | --------- |
| `--color-primary` | `#6b2e2e` |
| `--color-surface` | `#efe6d0` |
| `--color-bg`      | `#f4ecd8` |
| `--color-accent`  | `#c9a44b` |
| `--color-muted`   | `#7a6b57` |
| `--color-text`    | `#1f1b16` |
| `--color-danger`  | `#b73b3b` |
| `--radius`        | `12px`    |

## Shared CSS Classes (global, not scoped)

- `.rl-item`, `.rl-item__body`, `.rl-item__name`, `.rl-item__tags` — resource list row system
- `.rl-tag`, `.rl-tag--primary`, `.rl-tag--accent`, `.rl-tag--source` — tag pills
- `.rl-tag--uncommon/--rare/--very-rare/--legendary` — rarity colors

## Resource Component Pattern

Every `All*.vue` follows: search bar → optional filter panel → `.rl-item` list → `Single*.vue` in `<PopOut>`.
Filter logic lives in `helperFunctions.ts`. UI state stays in the component.

## 5etools Data Quirks

- **GV items** (`type: "GV"`) store `rarity`, `entries`, `bonusAc`, `page` etc. under `inherits` — always merge before display
- **Template vars** in entries: `{=fieldName}` — replace from `inherits` object
- **Item value** stored in copper pieces: 100cp = 1gp, 10cp = 1sp, 1000cp = 1pp
- **Item type codes** decoded by `getPrettyItemType()` in `helperFunctions.ts`

## Project Structure

```
src/
  views/           # Route-level views
  components/
    resources/     # All*.vue (list) + Single*.vue (detail)
    encounters/    # Encounter management
    items/         # Custom items
    characters/    # Character detail
    creation/      # Character creation flow
  stores/
  helperFunctions.ts
  types.ts
  style.css        # Design tokens + shared utilities
public/data/5e/   # 5etools JSON data
```

## Rules

1. No raw hex/rgb colors — use design tokens
2. No over-engineering — only requested changes
3. Mobile-first — min 44px tap targets, works at 360px+
4. Read file before editing
5. Follow patterns of existing peer components
