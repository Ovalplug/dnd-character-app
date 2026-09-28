import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../simulationEngine';
import { makePosition, makeGameMap, makeMonster } from './fixtures';
import type { Monster } from '../../../types';

describe('SimulationEngine — Unit (with fixtures)', () => {
  it('initializes with valid config using fixtures', () => {
    const config = {
      map: makeGameMap(10, 10),
      combatants: [
        {
          monster: makeMonster('Hero') as Monster,
          team: 'allies' as const,
          role: 'Tank' as const,
          position: makePosition(1, 1),
          applyDeathSaves: false,
          allowSurrender: false,
        },
      ],
      resourceMode: 'balanced' as const,
      roundLimit: 10,
    };
    const engine = new SimulationEngine(config, () => 0.5);
    expect(engine).toBeDefined();
    expect(engine).toBeDefined(); // state is private
  });

  it('creates profiling data', () => {
    const config = {
      map: makeGameMap(),
      combatants: [{
        monster: makeMonster('Goblin'),
        team: 'enemies' as const,
        role: 'DamageDealer' as const,
        position: makePosition(5, 5),
      }],
      resourceMode: 'balanced' as 'balanced',
      roundLimit: 5,
    };
    const engine = new SimulationEngine(config, () => 0.5);
    expect((engine as any).profiling).toBeDefined();
    expect(typeof (engine as any).profiling.phaseDurations).toBe('object');
  });
});
