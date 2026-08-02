<template>
  <div class="map-editor">
    <div class="map-editor__header">
      <h2 class="map-editor__title">Tactical Map Editor</h2>
      <div class="map-editor__controls">
        <button class="btn btn--sm" @click="clearMap">Clear</button>
        <button class="btn btn--sm" @click="randomizeMap">Randomize</button>
        <button class="btn btn--sm" @click="emitMap">Save Map</button>
      </div>
    </div>

    <div class="map-editor__grid-container">
      <div class="map-editor__grid" :style="gridStyle">
        <button
          v-for="(cell, idx) in cells"
          :key="`cell-${idx}`"
          class="map-editor__cell"
          :class="getCellClasses(cell)"
          :title="`${cell.position.x}, ${cell.position.y}`"
          @click="toggleCell(cell)"
        >
          <span v-if="showCoords" class="map-editor__coord">{{ cell.position.x }},{{ cell.position.y }}</span>
        </button>
      </div>
    </div>

    <div class="map-editor__legend">
      <div class="map-editor__legend-item">
        <div class="map-editor__legend-color map-editor__legend-color--walkable"></div>
        <span>Walkable</span>
      </div>
      <div class="map-editor__legend-item">
        <div class="map-editor__legend-color map-editor__legend-color--blocked"></div>
        <span>Blocked</span>
      </div>
      <div class="map-editor__legend-item">
        <div class="map-editor__legend-color map-editor__legend-color--difficult"></div>
        <span>Difficult</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GameMap, GameMapCell, CellType } from '../../types';
import { GameMapCell as GameMapCellClass, GameMap as GameMapClass, Position as PositionClass } from '../../types';

const props = withDefaults(
  defineProps<{
    width?: number;
    height?: number;
  }>(),
  {
    width: 20,
    height: 20
  }
);

const emit = defineEmits<{
  'map-updated': [map: GameMap];
}>();

const showCoords = ref(false);
const mapData = ref<GameMapCell[]>([]);

const cells = computed(() => {
  const result: GameMapCell[] = [];
  for (let y = 0; y < props.height; y++) {
    for (let x = 0; x < props.width; x++) {
      const existing = mapData.value.find((c: GameMapCell) => c.position.x === x && c.position.y === y);
      if (existing) {
        result.push(existing);
      } else {
        const pos = new PositionClass(x, y);
        const newCell = new GameMapCellClass(pos, 'empty' as CellType);
        result.push(newCell);
      }
    }
  }
  return result;
});

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.width}, 1fr)`,
  gridTemplateRows: `repeat(${props.height}, 1fr)`
}));

function getCellClasses(cell: GameMapCell): Record<string, boolean> {
  return {
    'map-editor__cell--walkable': cell.type === 'empty',
    'map-editor__cell--blocked': cell.type === 'wall',
    'map-editor__cell--difficult': cell.type === 'difficult_terrain'
  };
}

function toggleCell(cell: GameMapCell): void {
  const nextType: CellType =
    cell.type === 'empty'
      ? 'wall'
      : cell.type === 'wall'
        ? 'difficult_terrain'
        : 'empty';

  const existing = mapData.value.findIndex((c: GameMapCell) => c.position.x === cell.position.x && c.position.y === cell.position.y);
  if (existing >= 0 && mapData.value[existing]) {
    mapData.value[existing].type = nextType;
  } else {
    const newCell = new GameMapCellClass(cell.position.clone(), nextType);
    mapData.value.push(newCell);
  }
}

function clearMap(): void {
  mapData.value = [];
}

function randomizeMap(): void {
  mapData.value = [];
  for (let y = 0; y < props.height; y++) {
    for (let x = 0; x < props.width; x++) {
      const rand = Math.random();
      if (rand < 0.15) {
        const newCell = new GameMapCellClass(new PositionClass(x, y), 'wall' as CellType);
        mapData.value.push(newCell);
      } else if (rand < 0.25) {
        const newCell = new GameMapCellClass(new PositionClass(x, y), 'difficult_terrain' as CellType);
        mapData.value.push(newCell);
      }
    }
  }
}

function emitMap(): void {
  const gameMap = new GameMapClass(props.width, props.height, 5);
  for (const cell of mapData.value) {
    gameMap.setCell(cell.position, cell.type, cell.elevation);
  }
  emit('map-updated', gameMap);
}
</script>

<style scoped>
.map-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg);
  border-radius: var(--radius);
}

.map-editor__header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  sm: flex-direction row;
}

.map-editor__title {
  margin: 0;
  color: var(--color-text);
  font-size: 1.25rem;
}

.map-editor__controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.btn:active {
  background: var(--color-accent);
}

.btn--sm {
  padding: 0.375rem 0.75rem;
}

.map-editor__grid-container {
  overflow-x: auto;
  min-height: 300px;
  display: flex;
  justify-content: center;
}

.map-editor__grid {
  display: grid;
  gap: 2px;
  background: var(--color-surface);
  padding: 0.5rem;
  border-radius: var(--radius);
  aspect-ratio: 1;
  width: 100%;
  max-width: 500px;
}

.map-editor__cell {
  aspect-ratio: 1;
  border: 1px solid var(--color-muted);
  cursor: pointer;
  font-size: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
  position: relative;
  overflow: hidden;
  padding: 0;
}

.map-editor__cell--walkable {
  background: var(--color-bg);
  color: var(--color-muted);
}

.map-editor__cell--walkable:active {
  background: var(--color-accent);
}

.map-editor__cell--blocked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.map-editor__cell--difficult {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.map-editor__coord {
  font-size: 0.5rem;
  opacity: 0.6;
}

.map-editor__legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
}

.map-editor__legend-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.map-editor__legend-color {
  width: 1rem;
  height: 1rem;
  border-radius: 2px;
  border: 1px solid var(--color-muted);
}

.map-editor__legend-color--walkable {
  background: var(--color-bg);
}

.map-editor__legend-color--blocked {
  background: var(--color-primary);
}

.map-editor__legend-color--difficult {
  background: var(--color-accent);
}
</style>
