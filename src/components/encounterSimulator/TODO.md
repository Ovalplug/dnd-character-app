# Encounter Simulator TODO List

## Phase 1: Critical Bug Fixes

- [x] Fix typo in emulatorTyping.ts:279 - Change 'DamagDealer' to 'DamageDealer' in ROLE_DEFINITIONS
- [x] Remove type assertion in simulationEngine.ts:52 - Properly type config.combatants
- [x] Fix damage roll handling in simulationEngine.ts:523-531 - Add crit support for spell damage
- [x] Implement immunity check in combatRules.ts:107 - Check for immunity before applying damage
- [x] Fix role weights property access in aiDecisions.ts:80 - Use correct property path
- [x] Update role type comparison in aiDecisions.ts:123 - Be consistent with Healer vs type === 'Healer'
- [x] Add better fallback for multiattack parsing in aiDecisions.ts:419

## Phase 2: Core Improvements

- [x] Add spell save mechanics to simulationEngine.ts
- [x] Implement line of sight checks for ranged attacks
- [x] Add cover calculation for attack bonuses
- [x] Implement advantage/disadvantage for flanking situations
- [x] Add status effect application and resolution
- [x] Implement concentration conflict resolution

## Phase 3: Enhanced Features

- [ ] Add opportunity attacks when leaving reach
- [ ] Implement hit dice usage for out-of-combat healing
- [ ] Add environmental hazards and traps
- [ ] Implement side objectives with behavioral influence
- [ ] Add morale system for AI decision making
- [ ] Enhance AoE spell targeting with multiple placement options

## Phase 4: Performance & Optimization

- [ ] Add caching for common damage calculations
- [ ] Optimize pathfinding algorithm
- [ ] Implement early termination for clearly lost battles
- [ ] Add parallel processing for batch simulations
- [ ] Profile and optimize hot code paths

## Phase 5: Testing & Validation

- [ ] Write unit tests for core mechanics
- [ ] Create integration tests for full encounters
- [ ] Add regression tests for known edge cases
- [ ] Implement simulation validation checks
- [ ] Add performance benchmarks
