# D&D Character App (nya~ =^･ω･^=)

A Vue 3 + TypeScript companion for D&D 5e — character sheets, encounter simulator (seeded RNG, deterministic replay), spellbooks, inventory, and level-up assistant. Desktop + Android (Capacitor 8). IndexedDB persistence (Dexie), Pinia state, PWA.

## For users
- Manage multiple characters with ability scores, skills, spells, inventory.
- Build and run encounters; automated combat engine replayable via seed.
- Offline-first: all data lives locally (IndexedDB).

## For developers
- Vue 3 `<script setup>`, TypeScript strict (`verbatimModuleSyntax`, `noUnusedLocals`, `erasableSyntaxOnly` — no `enum`).
- `npm run build` runs `vue-tsc -b` + `vite build`; don't skip the type-check.
- Tests: Vitest (jsdom); `test-blueprint.md` maps pure-module coverage targets.
- `npm run format` (Prettier v2, 100-col, 2-space soft tabs) before committing.

## Quick start
```bash
npm install
npm run dev      # dev server
npm run build    # type-check + build
npm run test     # vitest
npm run full     # format → build → dev
```

Android: `npm run buildapp` (Capacitor sync + open Studio).

See `AGENTS.md` for full conventions and `test-blueprint.md` for test targets.
