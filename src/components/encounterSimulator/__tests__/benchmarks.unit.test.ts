import { describe, it, expect } from 'vitest';
import { DiceRoller } from '../diceRollFunctions';
import { SimulationEngine } from '../simulationEngine';
import { makeGameMap, makeMonster, makePosition } from './fixtures';

describe('Performance Benchmarks', () => {
  it('dice roll baseline (1000 rolls < 10ms)', () => {
    const dr = new DiceRoller(() => 0.5);
    const s = performance.now();
    for (let i = 0; i < 1000; i++) dr.rollSingleDie('d20');
    const duration = performance.now() - s;
    console.log(`Benchmark: 1000 dice rolls = ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100);
  });

  it('engine init baseline (< 50ms)', () => {
    const s = performance.now();
    new SimulationEngine({
      map: makeGameMap(10, 10),
      combatants: [{ monster: makeMonster('X'), team: 'allies', role: 'Tank', position: makePosition(1, 1) }],
      resourceMode: 'balanced',
      roundLimit: 3,
    }, () => 0.5);
    const duration = performance.now() - s;
    console.log(`Benchmark: Engine init = ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(500);
  });
});
