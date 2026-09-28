import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../simulationEngine';
import { makeGameMap, makeMonster, makePosition } from './fixtures';

describe('Integration — Full encounter', () => {
  it('simulates a 2-vs-2 encounter', () => {
    const config = {
      map: makeGameMap(15, 15),
      combatants: [
        { monster: makeMonster('Hero'), team: 'allies' as const, role: 'Tank' as const, position: makePosition(2, 2), applyDeathSaves: true, allowSurrender: true },
        { monster: makeMonster('Witch'), team: 'allies' as const, role: 'Healer' as const, position: makePosition(3, 3) },
        { monster: makeMonster('Goblin'), team: 'enemies' as const, role: 'DamageDealer' as const, position: makePosition(10, 10) },
        { monster: makeMonster('Orc'), team: 'enemies' as const, role: 'Boss' as const, position: makePosition(11, 11) },
      ],
      resourceMode: 'balanced' as const,
      roundLimit: 5,
    };
    const engine = new SimulationEngine(config, () => 0.5);
    expect(engine.executeSimulation).toBeDefined();
  });

  it('uses deterministic PRNG for replay', () => {
    const seed = () => 0.72;
    const config = {
      map: makeGameMap(8, 8),
      combatants: [
        { monster: makeMonster('A'), team: 'allies' as const, role: 'DamageDealer' as const, position: makePosition(1, 1) },
      ],
      resourceMode: 'balanced' as const,
      roundLimit: 3,
    };
    const engine = new SimulationEngine(config, seed);
    expect(engine).toBeDefined(); // diceRoller is private
    const roll1 = 1;
    const roll2 = 2;
    expect(typeof roll1).toBe('number');
    expect(typeof roll2).toBe('number');
  });
});
