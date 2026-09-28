import { describe, it, expect } from 'vitest';
import type { MovePath } from './movement';
import { CoverType } from './movement';

describe('movement pure targets', () => {
  it('CoverType constants', () => {
    expect(CoverType.None).toBe(0);
    expect(CoverType.Half).toBe(2);
    expect(CoverType.ThreeQuarters).toBe(5);
    expect(CoverType.Total).toBe(999);
  });
  it('MovePath interface usage', () => {
    const p: MovePath = { positions: [] as any, movementCost: 5, reachable: true };
    expect(p.movementCost).toBe(5);
    expect(p.reachable).toBe(true);
  });
});
