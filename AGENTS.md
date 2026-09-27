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
| `npm run full` | Format → build → start dev server (full smoke test) |
| `npm run buildapp` | Build + `cap sync android` + open Android Studio |

## Project Structure

```
src/
  assets/           # Static assets
    icons/          # App icons
  components/       # Vue SFCs
    characters/     # Character sheets + views
      views/            # Tab views (abilities, combat, inventory, etc.)
        subcomponents/  # Per-tab pieces (ability table, attacks, spells…)
    creation/       # Character creation wizard
      sections/         # Step components
    encounters/       # Manual encounter editor (create/edit/run)
    encounterSimulator/  # Automated combat engine (OOP classes, seeded RNG)
    items/          # Backpack / inventory management
    levelup/        # Level-up assistant
      sections/         # Per-step components
    proficiency/    # Proficiency/skill display components
    resources/      # Bestiary, spells, classes reference
      subRules/         # Rule reference components
    spellBooks/     # Spellbook management
  composables/      # Shared Vue composables
  database/         # IndexedDB (Dexie)
    db.ts           # Schema, migrations, CRUD helpers
  router/
    index.ts        # vue-router config (createWebHistory)
  stores/           # Pinia stores
    abilityScores.ts
    characterStore.ts
    dataStore.ts
    encounterStore.ts
    itemStore.ts
    randomNames.ts
    simulationStore.ts
    spellBookStore.ts
  views/            # Router-level pages
    HomeView.vue
    AllCharacters.vue
    CharacterView.vue
    CreationView.vue
    EncounterListView.vue
    LevelUpView.vue
    TrainingGround.vue
    ResourcesView.vue
    SettingsView.vue
    NavBar.vue
  App.vue           # Root component
  main.ts           # Entry point (creates app, mounts Pinia + router)
  style.css         # Global styles
  types.ts          # All TypeScript types (1000+ lines)
  helperFunctions.ts
  constants.ts
utilityFunctions.ts # Root-level utility (imported by vite.config.ts, tsconfig.app.json, tsconfig.node.json)
capacitor.config.ts # Capacitor 8 runtime config
```

## Conventions

- **Format**: Prettier — 100-col, 2-space soft tabs, semicolons, single quotes, LF line endings, `arrowParens: avoid`. Config in `.prettierrc`. Run `npm run format` before committing.
- **Modules**: ES modules (`"type": "module"`). TypeScript `verbatimModuleSyntax` enforced (`import type {…}` for type-only imports).
- **Imports**: Grouped — Vue/Pinia/core first, then app stores, then helpers/components. Relative paths from `src/`.
- **Vue SFCs**: Composition API with `<script setup lang="ts">`. All components use this pattern.
- **Pinia stores**: `defineStore('id', () => { … })` composition API style. Reactive state accessed via `storeToRefs` when destructuring. Pass stores via route props when consumed by deeply nested components.
- **Vue Router**: `createWebHistory()` mode. Routes defined in `src/router/index.ts` using `RouteRecordRaw`. Catch-all redirects to `/`. Some routes use route props (`props: () => ({ dataStore: useDataStore() })`).
- **IndexedDB**: Dexie wrapper in `src/database/db.ts`. Database versioned via `this.version(N).stores({…})` migrations (currently v1–v7). Each table defines primary keys with `&` prefix; secondary indexes added by listing without `&`.
- **Types**: `src/types.ts` is the single source of truth — ~1000 lines of D&D 5e domain types. Re-export encounter simulator types from `emulatorTyping.ts` through it.
- **Component naming**: PascalCase Vue SFCs. Nested views under `views/`, sub-components under `subcomponents/`.
- **Encounter simulator**: OOP design (`DiceRoller` class, `SimulationEngine` class). Deterministic replay via seeded PRNG (`seedrandom`). Test files follow `*.test.ts` pattern.
- **PWA**: Built with `vite-plugin-pwa`. Configured in `vite.config.ts` with `autoUpdate` registration, workbox `skipWaiting` + `clientsClaim`, manifest in manifest block. Icons in `public/pwa-*.png`.
- **Assets**: Global stylesheet in `src/style.css`. Icons under `src/assets/icons/`.

## TypeScript Config

- Three config files: `tsconfig.json` (root, references app + node), `tsconfig.app.json` (app code), `tsconfig.node.json` (build tooling).
- `@vue/tsconfig/tsconfig.dom.json` base.
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `erasableSyntaxOnly: true` (no `enum`), `noFallthroughCasesInSwitch: true`, `noUncheckedSideEffectImports: true`.
- `verbatimModuleSyntax` in `tsconfig.node.json`.
- `utilityFunctions.ts` is included in both `tsconfig.app.json` and `tsconfig.node.json` (root-level file, not in `src/`).

## Testing

- Vitest runs in `jsdom` environment (`globals: true`). Test files go in `src/**/*.test.ts`.
- `@vue/test-utils` (^2.5.1) is available for component testing but **no test files currently exist**.
- `@vitest/coverage-v8` for coverage reports (`npm run test:coverage`).
- Encounter simulator unit tests use seeded PRNG for deterministic replay.

## Pitfalls

- **`vue-tsc -b` is part of the build** — `npm run build` fails silently on type errors only if you skip `vue-tsc`. Always run `npm run build` to validate types, not just `vite build`.
- **`verbatimModuleSyntax`** — `import { SomeType } from '…'` must be `import type { SomeType } from '…'` if used only as a type annotation. Plain imports for runtime values only.
- **`erasableSyntaxOnly`** — TypeScript 5.9+ option; never uses `enum` or `const enum`.
- **`noUnusedLocals` / `noUnusedParameters`** — strict TS config; any unused import or `_`-prefixed param still causes errors. Remove or use them.
- **`noUncheckedSideEffectImports`** — imports used only for side effects (e.g., polyfills) are fine, but bare named imports that look like values but are only types will error.
- **Dexie schema uses primary-key-only constraints** — tables define primary keys with `&` prefix but no explicit secondary indexes. Searching by non-key fields requires adding them to the index list.
- **Dexie migrations are manual and additive** — each `this.version(N)` adds/overwrites the full store schema. Old migrations are skipped on first load; new migrations run incrementally. Never delete a migration version.
- **`fs` package is a no-op shim** — `"fs": "^0.0.1-security"` is in dependencies but does nothing in the browser. Don't rely on it for any real filesystem operation.
- **`structuredClone` for encounter persistence** — encounters use `structuredClone` before writing to Dexie to validate serializability. Non-cloneable objects (functions, undefined) will fail.
- **Route params are `string | undefined`** — params like `:id` in routes may be absent; handle both cases.
- **Vitest** runs in `jsdom` environment (`globals: true`). Test files go in `src/**/*.test.ts`. No test files currently exist.
- **Prettier v2** (not v3) — `vueIndentScriptAndStyle: true` is required. Do not upgrade Prettier without checking compatibility.
- **Capacitor Android build** — requires Node.js on the Windows host (not WSL). `npm run buildapp` handles the full pipeline. Capacitor config is in `capacitor.config.ts`.

## Environment Notes

- **No `.env` files** — app config is in source (`constants.ts`, `vite.config.ts`). No secret injection needed.
- **Browser-only** — runs in browser and Capacitor WebView. No Node.js server component.
- **IndexedDB persistence** — all user data lives in IndexedDB via Dexie. No server sync. Data is local-only.
- **Capacitor 8** — Android target. Capacitor CLI in `@capacitor/cli` and `@capacitor/android` dependencies. Native features (camera, etc.) accessed via Capacitor plugins.
