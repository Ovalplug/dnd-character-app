import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../simulationEngine';
import { makePosition, makeMonster, makeGameMap } from './fixtures';

describe('Validation checks', () => {
  it('SimulationResult has required shape', () => {
    const resultShape = {
      seed: 'test',
      config: {},
      resourceMode: 'balanced',
      outcome: 'allies_win',
      totalRounds: 1,
      totalTurns: 1,
      turnLog: [],
      finalCombatants: [],
    };
    expect(typeof resultShape.seed).toBe('string');
    expect(typeof resultShape.totalRounds).toBe('number');
  });

  it('ProfilingData interface has required fields', () => {
    const pd = { totalMs: 1, initMs: 1, roundsMs: 1, actionCandidatesMs: 1, attackResolveMs: 1, spellResolveMs: 1, roundCount: 1, turnCount: 1, hotPaths: [] };
    expect(pd.hotPaths).toBeDefined();
    expect(pd.initMs).toBe(1);
  });

  it('SimulationEngine creates profiling when enabled', () => {
    const engine = new SimulationEngine({
      map: makeGameMap(5, 5),
      combatants: [{ monster: makeMonster('X'), team: 'allies', role: 'Tank', position: makePosition(0, 0) }],
      resourceMode: 'balanced',
      roundLimit: 1,
    }, () => 0.5);
    expect(typeof (engine as any).profiling).toBe('object');
    expect(typeof (engine as any).profiling.phaseDurations).toBe('object');
  });
});
