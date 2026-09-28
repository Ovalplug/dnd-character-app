// Phase 5 test fixtures — uses real module classes
import { Position, GameMap, GameMapCell } from '../emulatorTyping';
import type { Monster } from '../../../types';

export const makePosition = (x: number, y: number) => new Position(x, y);

export const makeGameMap = (w = 10, h = 10) => {
  const map = new GameMap(w, h, 5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      new GameMapCell(new Position(x, y), 'empty');
      map.setCell(new Position(x, y), 'empty');
    }
  }
  return map;
};

export const makeMonster = (name: string, opts: Partial<Monster> = {}): Monster => ({
  name,
  hp: opts.hp ?? 30,
  ac: opts.ac ?? 15,
  speed: opts.speed ?? { walk: 30 },
  dex: opts.dex ?? 10,
  str: opts.str ?? 10,
  cr: opts.cr ?? '1',
  ...opts,
} as Monster);
