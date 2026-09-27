# D&D Character App — Agent Instructions

**Vue 3 + TypeScript + Vite** — D&D 5e character manager, encounter simulator, and companion app. Targets desktop and Android (Capacitor 8). Uses Pinia for state, Dexie (IndexedDB) for persistence, and Vitest for testing.

## Commands

| Command | What |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check (`vue-tsc -b`) then build to `dist/` |
| `npm run test` | Run Vitest suite |
| `npm run test:watch` | Interactive Vitest watcher |
| `npm run test:coverage` | Run tests with V8 coverage |
| `npm run preview` | Preview production build |
| `npm run format` | Prettier write (same as `pretty`) |
| `npm run buildapp` | Build + `cap sync android` + open Android Studio |

## Project Structure

```
src/
  components/       # Vue SFCs
    characters/     # Character sheets + views
    creation/       # Character creation wizard
    encounterSimulator/  # Automated combat engine (OOP classes, seeded RNG)
    items/          # Backpack / inventory
    levelup/        # Level-up assistant
    resources/      # Bestiary, spells, classes reference
  composables/      # Shared Vue composables
  stores/           # Pinia stores
  views/            # Router-level pages
  database/db.ts    # Dexie IndexedDB schema
  types.ts          # All TypeScript types (1000+ lines)
  helperFunctions.ts
  constants.ts
```

## Conventions

- **Format**: Prettier — 100-col, 2-space soft tabs, semicolons, single quotes, LF line endings, `arrowParens: avoid`. Run `npm run format` before committing.
- **Modules**: ES modules (`"type": "module"`). TypeScript `verbatimModuleSyntax` enforced (import types with `import type {…}`).
- **Imports**: Grouped — Vue/Pinia/core first, then app stores, then helpers/components. Relative paths from `src/`.
- **Pinia stores**: `defineStore('id', () => { … })` composition API style. Reactive state accessed via `storeToRefs` when destructuring.
- **IndexedDB**: Dexie wrapper in `src/database/db.ts`. Character and encounter data stored in IndexedDB — rebuilds/flushes are app-level actions.
- **Types**: `src/types.ts` is the single source of truth — ~1000 lines of D&D 5e domain types. Re-export encounter simulator types from `emulatorTyping.ts` through it.
- **Route props**: Pass Pinia stores via route props (`props: () => ({ dataStore: useDataStore() })`) rather than direct store imports in deeply nested components.
- **Component naming**: PascalCase Vue SFCs. Nested views under `views/`, sub-components under `subcomponents/`.
- **Encounter simulator**: OOP design (`DiceRoller` class, `SimulationEngine` class). Deterministic replay via seeded PRNG (`seedrandom`). Test files follow `*.test.ts` pattern.

## Pitfalls

- **`vue-tsc -b` is part of the build** — `npm run build` fails silently on type errors only if you skip `vue-tsc`. Always run `npm run build` to validate types, not just `vite build`.
- **`verbatimModuleSyntax`** — `import { SomeType } from '…'` must be `import type { SomeType } from '…'` if used only as a type annotation. Plain imports for runtime values only.
- **`erasableSyntaxOnly`** — TypeScript 5.9+ option; never uses `enum` or `const enum`.
- **`noUnusedLocals` / `noUnusedParameters`** — strict TS config; any unused import or `_`-prefixed param still causes errors. Remove or use them.
- **Vitest** runs in `jsdom` environment (`globals: true`). Test files go in `src/**/*.test.ts`. No test files currently exist.
- **Prettier v2** (not v3) — `vueIndentScriptAndStyle: true` is required. Do not upgrade Prettier without checking compatibility.
- **Capacitor Android build** — requires Node.js on the Windows host (not WSL). `npm run buildapp` handles the full pipeline.
- **PWA** — built with `vite-plugin-pwa`. Manifest and service worker config in `vite.config.ts`. Icons in `public/pwa-*.png`.
