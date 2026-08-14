# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev`: Run development server (Vite).
- `npm run build`: Build web app with type checking (`vue-tsc`).
- `npm run preview`: Preview the production build locally.
- `npm run pretty` / `npm run format`: Format code using Prettier.
- `npm run buildapp`: Full mobile build (Web build $\to$ Capacitor sync $\to$ Open Android Studio).

## Efficiency & Context Optimization

To maintain a high-performance context and reduce token consumption:

- **Use Specialized Tools**: Prefer `Grep` and `Glob` for discovery over heavy shell commands like `ls -R` or `find`.
- **Minimize File Reads**: 
  - Use `Read` with `limit`/`offset` when inspecting large files (e.g., JSON data in `public/`).
  - Check `src/types.ts` and `src/helperFunctions.ts` before reading components to understand data shapes without re-scanning the whole module.


### Tech Stack
- **Frontend**: Vue 3 (`<script setup>`) + TypeScript (Strict mode).
- **State Management**: Pinia (`characterStore`, `dataStore`, `encounterStore`, `itemStore`, `spellBookStore`).
- **Routing**: Vue Router.
- **Mobile Bridge**: Capacitor (Android target).
- **Data Persistence**: Dexie.js (IndexedDB) for local storage.
- **Design System**: Custom CSS variables in `src/style.css`. Use tokens like `--color-primary`, `--color-surface`, etc.

### Component Patterns
- **Resource List Pattern**: 
  - `All[Type].vue` (List view with search/filter)
  - `Single[Type].vue` (Detail view in `<PopOut>`)
  - Uses `.rl-item` class for row items and `.rl-tag` for pills.
- **Mobile-First**: Ensure all UI elements have minimum 44px tap targets and work on small screens.

### Data Structure & Quirks
- **Source**: 5etools JSON data in `public/data/5e/`.
- **Handling**: 
  - Always merge `inherits` property for GV items before rendering.
  - Replace `{=fieldName}` templates using the object's properties.
  - Convert all currency values to a common base (copper pieces) if necessary (`100cp = 1gp`, etc.).

### Project Structure
- `src/views/`: Route-level components.
- `src/components/`: Feature-specific components (`resources`, `encounters`, `items`, `characters`, `creation`).
- `src/stores/`: Pinia stores.
- `src/helperFunctions.ts` & `src/types.ts`: Shared logic and types.
- `public/data/5e/`: 5etools JSON datasets.

## Development Rules
- **Do not use raw hex/rgb colors**; always use CSS variables from `src/style.css`.
- **Follow existing component patterns** (especially for lists and items).
- **Mobile-first design** is mandatory.
- **Read files before editing**.
