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

- [x] Add opportunity attacks when leaving reach
- [x] Implement hit dice usage for out-of-combat healing
- [x] Add environmental hazards and traps
- [x] Implement side objectives with behavioral influence
- [x] Add morale system for AI decision making
- [x] Enhance AoE spell targeting with multiple placement options

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

---

## Phase 6: Leverage Structured attackDetails Data

**Background:** The bestiary JSON files (bestiary-part-\*.json) now contain structured attackDetails on 67.8% of monster actions (5,052/7,455). The current code only parses attacks from raw TEXT using regex, ignoring the rich structured data.

### 6.1: Add attackDetails types to emulatorTyping.ts

- [ ] Add AttackDetails interface:
  ```typescript
  interface AttackDetails {
    type: 'melee' | 'ranged' | 'spell' | 'ability';
    range: number; // feet
    toHit: number | null; // null = save-based
    targets: number | -1 | 'all'; // -1 = area, 1 = single
    damage: Array<{ type: string; damage: string; when?: string }>;
    save?: { dc: number; ability: string };
    inflictsConditions?: Array<{ condition: string; save?: string; escape?: number | null }>;
  }
  ```
- [ ] Add ParsedAttackWithDetails interface extending ParsedAttack with attackDetails field
- [ ] Export new types from emulatorTyping.ts

### 6.2: Update MonsterParser to consume attackDetails

- [ ] Add parseAttackDetails() method in MonsterParser to extract structured data from JSON attackDetails field
- [ ] Modify parseAttackFromText() to fall back to attackDetails when regex fails
- [ ] Update parseMonsterProfile() to populate attacks from BOTH text parsing AND attackDetails
- [ ] Add parseConditionsFromAttackDetails() to extract condition info (grappled, restrained, charmed, etc.)
- [ ] Priority: attackDetails > text regex (structured data is ground truth)

### 6.3: Enhance ActionCandidate interface

- [ ] Add damageType support for multiple damage types (array or primary)
- [ ] Add inflictsCondition field to ActionCandidate
- [ ] Add isAreaAttack flag
- [ ] Add attackType ('melee' | 'ranged' | 'spell' | 'ability')
- [ ] Add targetCount for multi-target attacks

### 6.4: Improve action scoring with attackDetails

- [ ] **Save-based attack scoring**: When attackDetails.save exists, calculate expected damage with:
  - Full damage on failed save (50% chance avg)
  - Half damage on success (if halfDamageOnSuccess=true)
  - Condition bonus when inflictsConditions present
- [ ] **Condition priority scoring**: Boost score when attack inflicts:
  - Grappled: +3 (removes movement, easy to hit)
  - Restrained: +5 (attackers have advantage)
  - Prone: +2 (ranged advantage, melee disadvantage)
  - Charmed: +4 (turns ally against enemies)
  - Stunned/Paralyzed: +8 (auto-crit on hits)
  - Blinded: +2 (attackers have advantage)
- [ ] **Area attack scoring**: For targets: -1 or targets: 'all':
  - Count alive enemies in area radius
  - Score = (avg damage per target × enemy count)
  - Prefer AoE when multiple enemies clustered
- [ ] **Multi-damage scoring**: When damage array has multiple entries (e.g., greatsword 1d8+3 / 1d10+3):
  - Use highest damage option in scoring
  - Track both options in ActionCandidate for actual execution

### 6.5: Execute save-based attacks

- [ ] Add executeSaveAttack() method in SimulationEngine:
  - Takes caster, action, list of targets
  - Rolls save for each target
  - Applies damage (full/half based on save)
  - Applies conditions from inflictsConditions on failed save
  - Returns TurnResult with per-target results
- [ ] Integrate into executeTurn() alongside existing executeAttack()
- [ ] Handle targets: -1 (all enemies in area) and targets: 'all'

### 6.6: Execute condition-inflicting attacks

- [ ] When executing an attack with inflictsConditions:
  - Roll save if condition has save: 'CON' etc.
  - Apply condition on failed save
  - Set escape DC from attackDetails escape value
- [ ] Update CombatResolver.resolveAttack() to accept condition info
- [ ] Update CombatResolver.resolveSave() to handle inflictsConditions

### 6.7: AI decision-making improvements

- [ ] Prefer attacks that inflict conditions over pure damage when:
  - Target has high HP (damage won't kill fast)
  - Condition removes a key ability (grapple → no movement)
- [ ] Prefer AoE attacks when 2+ enemies within area
- [ ] Prefer save DC attacks over attack roll attacks when:
  - Target save modifier is low
  - Save DC > target's save + proficiency
- [ ] Use attackDetails.type to determine attack category for role-based AI

### 6.8: Multi-damage option handling

- [ ] Some monsters have multiple damage expressions (e.g., Longsword: 1d8+3 slashing / 1d10+3 slashing)
- [ ] Parse into separate attack variants in ParsedAttack
- [ ] AI selects highest expected damage option
- [ ] Record which variant was used in TurnResult

### 6.9: Unparseable attack fallback

- [ ] 32% of attacks still lack attackDetails (Multiattack prose, edge cases)
- [ ] Add parseMultiattackProse() to extract individual attacks from Multiattack text
- [ ] Use parseAttackFromText() regex fallback for remaining text entries
- [ ] Log monsters with 0 parseable attacks for manual review

### 6.10: Testing & verification

- [ ] Verify 5+ monsters with attackDetails parse correctly (Ancient Deep Crow, etc.)
- [ ] Verify save-based attacks resolve with correct DC and damage
- [ ] Verify condition application works for grappled, restrained, charmed
- [ ] Verify area attacks hit correct number of targets
- [ ] Verify scoring prefers condition-inflicting attacks when beneficial
