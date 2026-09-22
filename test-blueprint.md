# Unit-Test Blueprint: Pure-Logic TypeScript Modules
## D&D Character App — Vitest Target Mapping

> **Scope:** 11 source files across `src/` and `src/components/encounterSimulator/` and `src/components/levelup/`.
> **Goal:** Map every exported function/constant with exact signatures, imports, side-effect profile, and testability notes.

---

## 1. `src/types.ts` — Core Type Definitions

**Side effects:** None. Zero runtime imports. Pure TypeScript type declarations.
**Testability:** Types are not directly testable as code, but they define the shape of all fixtures used across every other module. Documented here for fixture construction.

### Key exported types (relevant to helper functions):

| Export | Kind | Shape / Example |
|--------|------|-----------------|
| `playerCharacter` | interface | `{ id: string, name: string, level: number, abilityScores: AbilityScoreValues, classLevels: ClassLevels, maxHp: number, currHp: number, ac: number, speed: CharSpeed, skillProficiencies: PlayerSkills, proficiencyModifier: number, inventory: Items, spellcasting: SpellCasting, ... }` |
| `AbilityScoreValues` | interface | `{ str: number, dex: number, con: number, int: number, wis: number, cha: number }` — core ability scores |
| `ClassLevels` | interface | `{ artificer: number, barbarian: number, bard: number, cleric: number, druid: number, fighter: number, monk: number, paladin: number, ranger: number, rogue: number, sorcerer: number, warlock: number, wizard: number }` |
| `SpellcastingInfo` | interface | `{ isSpellcaster: boolean, castingMode: SpellcastingCastingMode, spellcastingAbility: string \| null, cantripsKnown: number, spellsKnownCount: number, maxPrepared: number, spellSlots: Record<number, {max: number; used: number}>, innateSpells: Array<{name: string; level: number; ability: string}>, expandedSpellNames: string[] }` |
| `SpellcastingCastingMode` | literal union | `'known' \| 'prepared' \| 'spellbook' \| 'innate' \| 'none'` |
| `Item` | interface | `{ name: string, type?: ItemTypeCode, rarity?: string, weight?: number, dmg1?: string, dmgType?: string, weapon?: boolean, armor?: boolean, equipped?: boolean, ... }` |
| `Proficiency` | interface | `{ proficient: boolean, expertise: boolean }` |
| `PlayerSkills` | interface | 18 skill keys, each `{ proficient: boolean, expertise: boolean }` |
| `SavingThrow` | literal union | `'str' \| 'dex' \| 'con' \| 'int' \| 'wis' \| 'cha'` |
| `Monster` | interface | `{ name: string, str: number, dex: number, con: number, int: number, wis: number, cha: number, cr: MonsterCR, hp: number \| {formula: string; average: number}, ac: ..., skill: Record<SkillChoice, string>, resist?: ..., immune?: ..., vulnerable?: ..., spellcasting?: ..., attacks: ..., ... }` |
| `Race` | interface | `{ name: string, speed?: RaceSpeed, ability?: Ability[], ... }` |
| `Background` | interface | `{ name: string, skillProficiencies?: string[], ... }` |
| `CharClass` | interface | `{ name: string, hd: string, subclassAtLvl: number, classTableGroups: ..., classFeatures: ClassFeatures, ... }` |
| `HitDice` | interface | `{ total: number, current: number, dieType: keyof DiceTypes }` |
| `Currency` | interface | `{ cp: number, sp: number, ep: number, gp: number, pp: number }` |
| `SpellCasting` | interface | `{ spellCaster: SpellCaster, spellSlots?: Record<number, {max: number; used: number}>, cantrips?: Spells, ... }` |
| `Languages` | interface | Keyed by language name: `{ speak: boolean, read: boolean, write: boolean }` |

### Re-exported encounter simulator types (for test fixtures):

| Export | Source |
|--------|--------|
| `GridPosition`, `MapCell`, `ConditionState`, `SpellReference`, `ParsedAbility`, `ParsedAttack`, `ParsedMonsterProfile`, `SimSpell`, `DiceGroup`, `DamageRoll`, `RoleDefinition`, `ActionCandidate`, `TurnResult`, `TurnEvent`, `SimulationConfig`, `SimulationResult`, `BatchStatistics`, `SimulationRun`, `SimulationBatch`, `CombatantRoleType`, `CompositeRole`, `CellType`, `ResourceMode`, `SimulationOutcome`, `ActionType`, `Team`, `DiceType`, `DiceRolls` | `emulatorTyping.ts` |
| `Position`, `GameMapCell`, `GameMap`, `Condition`, `SimulatorCombatant`, `SimulationState`, `ROLE_DEFINITIONS` | `emulatorTyping.ts` |
| `RoundLog`, `SimulationStatistics` | `simulationEngine.ts` |

---

## 2. `src/constants.ts` — Static Data Maps

**Side effects:** None. Zero imports from other project files (only `type` imports from `./types` which are compile-time only).
**Testability:** Fully pure. Tests assert identity/static content.

| Export | Signature / Content | Description |
|--------|---------------------|-------------|
| `APP_VERSION` | `const APP_VERSION = '5.1.0'` | Hardcoded app version string |
| `SAVE_ABBRS` | `const SAVE_ABBRS: {key: SavingThrow; abbr: string}[]` | 6-entry array mapping saving throw names to abbreviations: `{key: 'str', abbr: 'STR'}`, `{key: 'dex', abbr: 'DEX'}`, etc. |
| `BASIC_ACTIONS` | `const BASIC_ACTIONS: CombatAction[]` | 14 combat action definitions (Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use Object, Grapple, Shove, Opportunity Attack, Cast a Spell [Reaction]) |
| `UPDATE_MANIFEST_URL` | `const UPDATE_MANIFEST_URL = 'https://...'` | URL string for version updates |
| `SKILL_NAME_MAP` | `const SKILL_NAME_MAP: Record<string, keyof PlayerSkills>` | 20-entry map: lowercase skill names (including variants like `'animalhandling'`) → PascalCase keys (`'animalHandling'`) |
| `SAVING_THROW_MAP` | `const SAVING_THROW_MAP: Record<string, SavingThrow>` | 12-entry map: ability names (e.g. `'strength'`) and abbreviations (`'str'`) → canonical `'str'`, `'dex'`, etc. |
| `SAVE_PRETTY` | `const SAVE_PRETTY: Record<SavingThrow, string>` | 6-entry map: canonical → pretty names: `'str' → 'Strength'` |
| `SKILL_ABILITY` | `const SKILL_ABILITY: Record<keyof PlayerSkills, keyof AbilityScoreValues>` | 18-entry map: skill → associated ability score (e.g. `'athletics': 'str'`, `'stealth': 'dex'`) |
| `SKILL_PRETTY` | `const SKILL_PRETTY: Record<keyof PlayerSkills, string>` | 18-entry map: skill → pretty name (e.g. `'stealth': 'Stealth'`) |
| `CR_TO_XP` | `const CR_TO_XP: Record<string, number>` | 31-entry map: CR string `'0'` through `'30'` → XP values (10 to 155000) |
| `CR_VALUES` | `const CR_VALUES = [0, 0.125, 0.25, ... 30]` | Array of 34 CR numeric values (includes fractional CRs) |
| `SPELL_CLASS_LIST` | `const SPELL_CLASS_LIST = ['artificer', 'bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard']` | List of classes with spellcasting |

---

## 3. `src/helperFunctions.ts` — Character Logic Utilities

**Side effects:** Imports `type` from `./types` (compile-time only), and named imports `SKILL_NAME_MAP`, `SAVING_THROW_MAP` from `./constants` (pure data). **No Pinia, no Dexie, no DOM, no network.**
**Testability:** Almost entirely pure functions. Excellent unit-test targets. No global mutable state.

### Exported types

| Export | Kind | Description |
|--------|------|-------------|
| `ItemFilterTag` | type | Union of 8 item filter strings: `'attunement' \| 'wondrous' \| 'tattoo' \| 'vehicle' \| 'armor' \| 'weapon' \| 'magical' \| 'cursed'` |
| `FeatPrerequisiteTag` | type | Union of 14 prerequisite tag strings |
| `FeatSpellTag` | type | Literal `'grants-spells'` |
| `InventoryStackRow` | type | `{ key: string, item: Item, quantity: number }` — used for inventory display |

### Exported functions

| Function | Signature | Pure? | Description |
|----------|-----------|-------|-------------|
| `getPrettyAbilityName` | `(shorthand: string) => string` | ✅ Pure | Converts ability shorthand `'str'` → `'Strength'` etc. |
| `getPrettySize` | `(size: string) => string` | ✅ Pure | Converts size shorthand `'M'` → `'Medium'`, `'S'` → `'Small'` |
| `getPrettyAlignment` | `(alignment: string) => string` | ✅ Pure | Converts alignment shorthand to full text |
| `getPrettySpellSchool` | `(school: string) => string` | ✅ Pure | Converts school code `'a'` → `'Abjuration'`, `'c'` → `'Conjuration'` |
| `getPrettySpellLevel` | `(level: number) => string` | ✅ Pure | `0` → `'Cantrip'`, `1-9` → `'1st'`-`'9th'` |
| `getPrettySpellClassList` | `(classes: {name: string}[]) => string` | ✅ Pure | Joins class names into display string |
| **`calculateDc`** | **`(proficiency: number, modifier: number) => number`** | **✅ Pure** | **D&D 5e DC formula: `8 + proficiency + modifier`** |
| **`calculateAttackModifier`** | **`(proficiency: number, modifier: number) => number`** | **✅ Pure** | **Attack bonus: `proficiency + modifier`** |
| `getFeatAbilityFilters` | `(feat: Feat) => SavingThrow[]` | ✅ Pure | Extracts ability score filters from a feat's prerequisite |
| `getFeatPrerequisiteTags` | `(feat: Feat) => FeatPrerequisiteTag[]` | ✅ Pure | Extracts prerequisite tags from a feat |
| `getPrettyFeatPrerequisiteTag` | `(tag: FeatPrerequisiteTag) => string` | ✅ Pure | Tag → display string |
| `getFeatSpellTags` | `(feat: Feat) => FeatSpellTag[]` | ✅ Pure | Detects if feat grants spells |
| `getPrettyFeatSpellTag` | `(tag: FeatSpellTag) => string` | ✅ Pure | `'grants-spells'` → `'Grants Spells'` |
| `getRefinedSpellsList` | `(spells: Spell[]) => { ... }` | ✅ Pure | Returns spells sorted/grouped by level |
| `getRefinedItemsList` | `(items: Items, filters?: ItemFilterTag[]) => { ... }` | ✅ Pure | Filters and sorts inventory items |
| `getRefinedFeatsList` | `(feats: Feat[], filters?: FeatPrerequisiteTag[]) => { ... }` | ✅ Pure | Filters and sorts feats |
| `getPrettyItemType` | `(type?: string) => string` | ✅ Pure | `ItemTypeCode` → display name: `'$'` → `'Treasure'`, `'M'` → `'Melee Weapon'` |
| **`abilityMod`** | **`(score: number) => number`** | **✅ Pure** | **Core D&D 5e formula: `Math.floor((score - 10) / 2)`** |
| **`calculateProficiencyBonus`** | **`(level: number) => number`** | **✅ Pure** | **Returns 2 (lvl 1-4), 3 (5-8), 4 (9-12), 5 (13-16), 6 (17+)** |
| `capitalizeFirstLetter` | `(str: string) => string` | ✅ Pure | Capitalizes first character |
| `getPrettyMonsterType` | `(monsterType: MonsterType) => string` | ✅ Pure | Converts monster type to display string |
| **`computeCharSpellcasting`** | **`(char: playerCharacter) => SpellcastingInfo`** | **✅ Pure** | **Computes spellcasting profile from character: slot progression, cantrips known, spells known/prepared counts, casting mode. Reads `classLevels`, `classes`, `abilityScores`. No store access.** |
| `getPrettyCastingMode` | `(mode: SpellcastingCastingMode) => string` | ✅ Pure | Converts casting mode to display string |
| `getInventoryItemDisplayName` | `(item: Item) => string` | ✅ Pure | Returns `item.displayName || item.name` |
| `isWeaponItem` | `(item: Item) => boolean` | ✅ Pure | Checks `item.weapon === true` or `item.type === 'M' \| 'R'` |
| `isShieldItem` | `(item: Item) => boolean` | ✅ Pure | `item.type === 'S'` |
| `isArmorItem` | `(item: Item) => boolean` | ✅ Pure | Checks `item.armor === true` or type codes `'LA'`, `'MA'`, `'HA'`, `'S'` |
| `getInventoryItemCategory` | `(item: Item) => string` | ✅ Pure | Returns `'Shield'`, `'Armor'`, or `'Weapon'` |
| `itemRequiresAttunement` | `(item: Item) => boolean` | ✅ Pure | `item.reqAttune !== undefined && !== false` |
| `getInventoryItemBadges` | `(item: Item) => string[]` | ✅ Pure | Derives badges from item data (rarity, magic, attunement) |
| `getInventoryItemFacts` | `(item: Item) => string[]` | ✅ Pure | Derives facts array from item data |
| **`stackInventoryItems`** | **`(items: Items) => InventoryStackRow[]`** | **✅ Pure** | **Groups items by name, sums quantities** |
| `getPrettySpeed` | `(speed: number \| Record<string, any>) => string` | ✅ Pure | Formats speed value → `'{N} ft.'` |
| `getPrettyAbilityScoreValues` | `(scores: any[] \| Record<string, any>) => string` | ✅ Pure | Formats ability scores for display |
| `getLanguagesFromRace` | `(race: Race \| null) => string[]` | ✅ Pure | Extracts language names from race data |
| `getLanguagesFromBackground` | `(background: Background \| null) => string[]` | ✅ Pure | Extracts language names from background data |
| `getAllLanguages` | `(race: Race \| null, background: Background \| null) => string[]` | ✅ Pure | Combines race + background languages |
| `setStartedLanguages` | `(languages: string[], isRogue: boolean) => Languages` | ✅ Pure | Creates initial Languages object with specified languages enabled |
| `getFeaturesForLevel` | `(classFeatures: ClassFeatures, level: number) => ClassFeature[]` | ✅ Pure | Returns features at a given level from `ClassFeatures` array |

**Best unit-test targets (pure, well-defined):**
- `abilityMod(score)` — deterministic formula
- `calculateProficiencyBonus(level)` — deterministic lookup
- `calculateDc(proficiency, modifier)` — deterministic formula
- `calculateAttackModifier(proficiency, modifier)` — deterministic formula
- `stackInventoryItems(items)` — grouping/aggregation
- `computeCharSpellcasting(char)` — complex pure logic, high test coverage potential
- `getRefinedItemsList` and `getRefinedFeatsList` — filtering/sorting
- `getFeaturesForLevel` — array access logic

---

## 4. `src/components/encounterSimulator/emulatorTyping.ts` — Types & Base Classes

**Side effects:** Imports `type { Monster }` from `'../../types'` (compile-time only). No runtime side effects.
**Testability:** Pure types and classes. No Pinia/Dexie/DOM/network.

### Exported types/literals

| Export | Kind | Description |
|--------|------|-------------|
| `CombatantRoleType` | type | Union: `'Tank' \| 'Healer' \| 'DamageDealer' \| 'Controller' \| 'Boss' \| 'Coward' \| 'Scout' \| 'Support'` |
| `CompositeRole` | type | Template literal: `${CombatantRoleType}` or `${CombatantRoleType}+${CombatantRoleType}` |
| `CellType` | type | `'empty' \| 'wall' \| 'difficult_terrain' \| 'elevation'` |
| `ResourceMode` | type | `'low' \| 'balanced' \| 'max'` |
| `SimulationOutcome` | type | `'allies_win' \| 'enemies_win' \| 'tie' \| 'round_limit'` |
| `ActionType` | type | `'attack' \| 'cast_spell' \| 'move' \| 'dodge' \| 'disengage' \| 'dash' \| 'action_other'` |
| `HazardType` | type | `'floor_fire' \| 'pit' \| 'toxic_cloud' \| 'lightning_storm' \| 'quaking_ground' \| 'acid_splash'` |
| `MoraleState` | type | `'fearless' \| 'steadfast' \| 'wary' \| 'faltering' \| 'rout'` |
| `Team` | type | `'allies' \| 'enemies' \| 'neutral'` |
| `DiceType` | type | `'d4' \| 'd6' \| 'd8' \| 'd10' \| 'd12' \| 'd20' \| 'd100'` |
| `DiceRolls` | type | `[{ type: DiceType; count: number; modifier?: number }]` |

### Key exported interfaces

| Interface | Key Fields |
|-----------|-----------|
| `GridPosition` | `{ x: number, y: number }` |
| `MapCell` | `{ type: CellType, elevation?: number }` |
| `SpellReference` | `{ name: string, level: number, ability?: string, dc?: number }` |
| `ParsedAbility` | `{ name: string, type: 'action'/'legendary'/'reaction'/'lair'/'mythic', costDescription: string, entries: string[], spellReference: string\|undefined, dc: number\|undefined, requiresConcentration: boolean, rechargeRoll: string\|undefined }` |
| `DiceGroup` | `{ expression: string, diceType: string, count: number, rolls: number[], subtotal: number }` |
| `DamageRoll` | `{ expression: string, groups: DiceGroup[], modifier: number, rawTotal: number, total: number, damageType: string, isCrit: boolean }` |
| `ParsedAttack` | `{ name: string, attackBonus: number, damageExpression: string, damageType: string, isRanged: boolean, isMelee: boolean, reach?: number, range?: string, damageOptions?: Array<{expression: string; type: string}> }` |
| `AttackDetails` | `{ type: 'melee'|'ranged'|'spell'|'ability', range: number, toHit: number|null, targets: number, damage: Array<{type: string; damage: string; when?: string}>, save?: {dc: number; ability: SavingThrow}, inflictsConditions?: Array<{condition: string; save?: string; escape: number|null}> }` |
| `ParsedMonsterProfile` | `{ attacks: ParsedAttack[], multiattackCount: number, hasMultiattack: boolean, proficiencyBonus: number, isLegendary: boolean, attackDetails: AttackDetails[], primarySaveDC: number\|undefined }` |
| `ActionCandidate` | `{ type: ActionType, targetIndex?: number, expectedDamage?: number, expectedHealing?: number, resourceCost?: {spellSlot?: number}, ... }` |
| `TurnResult` | `{ ... }` — result of a combatant's turn |
| `SimulationConfig` | `{ maxRounds?: number, resourceMode: ResourceMode, seed?: number, ... }` |
| `SimulationResult` | `{ roundLogs: RoundLog[], statistics: SimulationStatistics, ... }` |
| `RoleDefinition` | `{ type: CombatantRoleType, actionWeights: Record<string, number>, targetPriorities: Record<string, number>, resourcePreference: 'save'|'spend'|'balanced' }` |
| `ConditionEffect` | `{ attackRollPenalty?: number, saveRollPenalty?: number, movementPenalty?: number, ... }` |
| `AoESpellTargetResult` | `{ spellName: string, aoeType: string, centerPosition: Position, radius: number, damageDealt: number, targetsAffected: string[], saveResult?: {succeeded: number; failed: number} }` |
| `OpportunityAttackResult` | `{ triggered: boolean, isHit: boolean, finalDamage: number, combatantName: string, targetName: string }` |
| `HitDiceHealResult` | `{ hitDiceRolled: number, conMod: number, totalHealed: number, currentHp: number, hitDiceRemaining: number }` |
| `SpellSaveResult` | `{ targetName: string, dc: number, rolled: number, ability: string, succeeded: boolean, halfDamageOnSuccess: boolean, baseDamage: number, finalDamage: number, conditionApplied: string\|undefined }` |
| `BatchStatistics` | `{ totalRuns: number, totalRounds: number, avgRounds: number, ... }` |
| `SimulationBatch` | `{ batchId: string, results: SimulationResult[], statistics: BatchStatistics }` |

### Exported classes

| Class | Signature | Key Methods | Side Effects |
|-------|-----------|-------------|-------------|
| **`Position`** | **`class Position { x: number; y: number; constructor(x: number, y: number); distanceTo(other: Position): number; equals(other: Position): boolean; }`** | `distanceTo()`, `equals()` | **Pure — no side effects** |
| **`GameMapCell`** | **`class GameMapCell { position: Position; type: CellType; elevation: number; constructor(position: Position, type: CellType, elevation?: number); getMovementCost(): number; isPassable(): boolean; }`** | `getMovementCost()`, `isPassable()` | **Pure — no side effects** |
| **`GameMap`** | **`class GameMap { width: number; height: number; cells: MapCell[][]; constructor(width: number, height: number, cells?: MapCell[][]); getCell(pos: Position): GameMapCell\|undefined; isInBounds(pos: Position): boolean; }`** | `getCell()`, `isInBounds()` | **Pure — no side effects** |
| **`Condition`** | **`class Condition { type: string; duration: number; source: string; constructor(type: string, duration: number, source?: string); }`** | Basic data class | **Pure — no side effects** |
| **`SimulatorCombatant`** | **`class SimulatorCombatant`** | `getName(): string; takeDamage(amount: number): void; addCondition(c: Condition): void; removeCondition(idx: number): void; hasCondition(type: string): boolean; getAc(): number; getMaxHp(): number; checkConcentration(damage: number, rng: PRNG): void; getActiveConditionEffects(): ConditionEffect; checkFlanking(target: SimulatorCombatant): boolean; ...` | **Stateful (mutable HP, conditions, counters) but NO Pinia/Dexie/DOM/network** — testable with mock `PRNG` |
| **`SimulationState`** | **`class SimulationState`** | `getTeam(team: Team): SimulatorCombatant[]; getCurrentTurn(): SimulatorCombatant; nextTurn(): void; ...` | **Stateful but pure (no external dependencies)** |
| `ROLE_DEFINITIONS` | `const ROLE_DEFINITIONS: Record<CombatantRoleType, RoleDefinition>` | Static data | **Pure — constant object** |

---

## 5. `src/components/encounterSimulator/diceRollFunctions.ts` — Seeded Dice Rolling

**Side effects:** None. Imports only `type { DiceType, DiceGroup }` from `'./emulatorTyping'` (compile-time).
**Testability:** **Excellent** — `DiceRoller` class is seeded-PRNG, fully deterministic with injected PRNG. `calculateAverageRoll` is a pure function.

### Exported types/functions

| Export | Signature | Description |
|--------|-----------|-------------|
| `PRNG` | `type PRNG = () => number` | Type alias for seeded random function returning `0-1` |
| **`DiceRoller`** | **`class DiceRoller { constructor(rng: PRNG); rollSingleDie(diceType: DiceType): number; rollD20(modifier?: number, advantage?: boolean, disadvantage?: boolean): number; rollDice(count: number, diceType: DiceType, modifier?: number): number; rollDamage(diceGroups: Array<{count: number; type: DiceType; modifier?: number}>): number; rollCritDamage(diceGroups: Array<{count: number; type: DiceType; modifier?: number}>): number; rollAttack(modifier?: number, advantage?: boolean, disadvantage?: boolean): {roll: number; isCrit: boolean}; rollSave(dc: number, abilityModifier: number, advantage?: boolean, disadvantage?: boolean): boolean; rollInitiative(dexModifier: number): number; parseDamageExpressionDetailed(expression: string, isCrit?: boolean): {total: number; groups: DiceGroup[]; modifier: number}; parseDamageExpression(expression: string): number; averageDamage(expression: string): number; calculateAverageDamage(diceGroups: Array<{count: number; type: DiceType; modifier?: number}>): number; }`** | **Seeded RNG dice roller. All methods deterministic when seeded. Cache is instance-level.** |
| **`calculateAverageRoll`** | **`(diceType: DiceType, numberToRoll: number, modifier: number) => number`** | **Pure: `((sides + 1) / 2) * count + modifier`. Deprecated but still exported.** |

**Best unit-test targets:**
- `calculateAverageRoll` — simple pure function, edge cases
- `DiceRoller` with seeded PRNG — deterministic: inject `() => 0.5` and verify exact outputs
- `DiceRoller.averageDamage('2d6+3')` — deterministic average: `(3.5*2) + 3 = 10`
- `DiceRoller.rollD20(mod, advantage, disadvantage)` — all 4 combos
- `DiceRoller.rollSave(dc, mod)` — true/false boundary at `roll + mod === dc`
- `DiceRoller.parseDamageExpression('2d6+3')` — with seeded RNG

---

## 6. `src/components/encounterSimulator/combatRules.ts` — Combat Resolution

**Side effects:** Imports `PRNG` type and `DiceRoller` from `'./diceRollFunctions'`, types + `Position`, `Condition` from `'./emulatorTyping'`, `Monster` type from `'../../types'`, `MovementResolver` from `'./movement'`. **No Pinia, no Dexie, no DOM, no network.** Constructor creates internal `DiceRoller` and `MovementResolver` instances.
**Testability:** `CombatResolver` class — stateful via mutable `SimulatorCombatant` args but deterministic with seeded RNG.

### Exported interfaces

| Interface | Key Fields |
|-----------|-----------|
| `AttackResult` | `{ rolled: number, isCrit: boolean, isHit: boolean, finalDamage: number, totalDamageDealt: number, resistanceApplied?: 'immune'|'resist'|'vulnerable'|'normal', damageBreakdown?: DamageRoll, hitPenalty?: number, hitAdvantage?: boolean }` |
| `SaveResult` | `{ targetName: string, dc: number, rolled: number, succeeded: boolean, damageHalfOnSuccess: boolean, baseDamage: number, finalDamage: number }` |
| `DeathSaveResult` | `{ rolled: number, isCrit: boolean, isSuccess: boolean, successCount: number, failureCount: number, isDead: boolean }` |

### Exported class

| Class | Signature | Description |
|-------|-----------|-------------|
| **`CombatResolver`** | **`class CombatResolver { constructor(rng: PRNG); resolveAttack(attacker: SimulatorCombatant, target: SimulatorCombatant, weaponModifier?: number, damageExpression?: string, advantage?: boolean, disadvantage?: boolean, damageType?: string, isRanged?: boolean, map?: any): AttackResult; resolveSave(caster: SimulatorCombatant, targets: SimulatorCombatant[], dc: number, damageExpression?: string, savingThrowAbility?: SavingThrow, halfDamageOnSuccess?: boolean, conditionOnFail?: string, conditionDuration?: number): SpellSaveResult[]; resolveDeathSave(combatant: SimulatorCombatant): DeathSaveResult; applyCondition(target: SimulatorCombatant, type: string, duration: number, sourceName?: string): void; removeCondition(target: SimulatorCombatant, type: string): void; hasCondition(target: SimulatorCombatant, type: string): boolean; getAoETargets(center: Position, radius: number, aoeType: 'sphere'|'cone'|'line'|'burst'|'blob', allCombatants: SimulatorCombatant[], caster: SimulatorCombatant, casterPosition?: Position): SimulatorCombatant[]; resolveAoESpell(caster, targets, spellName, damageExpression, dc?, savingThrowAbility?, halfDamageOnSuccess?, conditionOnFail?, conditionDuration?, aoeType?, centerPosition?): AoESpellTargetResult; getEffectiveAC(target: SimulatorCombatant, options?: {isRanged?: boolean; isMelee?: boolean; hasCover?: boolean; coverAmount?: number}): number; rollDamage(expression: string): number; canOpportunityAttack(combatant: SimulatorCombatant, opponent: SimulatorCombatant): boolean; resolveOpportunityAttack(attacker: SimulatorCombatant, target: SimulatorCombatant, fromPos: any, toPos: any): OpportunityAttackResult; checkOpportunityAttacks(movingCombatant, fromPos, toPos, allCombatants, map): OpportunityAttackResult[]; resolveHitDiceHealing(combatant: SimulatorCombatant, hitDiceToSpend: number): HitDiceHealResult; isAlive(combatant: SimulatorCombatant): boolean; isUnconscious(combatant: SimulatorCombatant): boolean; }`** | Resolves all combat mechanics. Mutates combatant state. Deterministic via seeded PRNG. |

**Best unit-test targets:**
- `resolveAttack` — crit vs normal vs miss, resistance/immunity/vulnerability, flanking
- `resolveSave` — auto-fail on 1, auto-success on 20, half vs full damage
- `resolveDeathSave` — crit (+2 success), fumble (+2 fail), stabilize, death
- `checkResistance` (private, test via public `resolveAttack`) — string matching with " damage" suffix handling
- `getEffectiveAC` — cover bonuses
- `canOpportunityAttack` — pure boolean logic with multiple preconditions
- `isAlive` / `isUnconscious` — trivial pure predicates

---

## 7. `src/components/encounterSimulator/movement.ts` — Movement & Pathfinding

**Side effects:** Imports `PRNG` type from `'./diceRollFunctions'` (type-only). No Pinia, no Dexie, no DOM, no network.
**Testability:** **Excellent** — pure algorithms (BFS, A*, Bresenham's line, Chebyshev distance).

### Exported constants/classes/interfaces

| Export | Signature | Description |
|--------|-----------|-------------|
| **`CoverType`** | **`const CoverType: {None: 0; Half: 2; ThreeQuarters: 5; Total: 999}`** | **Pure constants — cover AC bonus values** |
| **`MovePath`** | **`interface MovePath { positions: Position[]; movementCost: number; reachable: boolean }`** | **Interface for path results** |
| **`MovementResolver`** | **`class MovementResolver { constructor(rng: PRNG); getReachablePositions(from: Position, map: GameMap, movementSpeed: number, combatants?: SimulatorCombatant[]): Position[]; canMoveTo(position: Position, map: GameMap, combatants?: SimulatorCombatant[], allowEnemies?: boolean): boolean; findPath(from: Position, to: Position, map: GameMap, combatants?: SimulatorCombatant[]): MovePath; hasLineOfSight(from: Position, to: Position, map: GameMap, maxDistance?: number): boolean; getCover(attacker: Position, target: Position, map: GameMap): (typeof CoverType)[keyof typeof CoverType]; distance(from: Position, to: Position): number; }`** | **A* pathfinding, BFS reachable cells, Bresenham LOS/cover, Chebyshev distance** |

**Best unit-test targets:**
- `distance()` — Chebyshev distance formula (pure math)
- `canMoveTo()` — bounds, cell passability, occupancy checks
- `getCover()` — 0/1/2+ obstructions → None/Half/ThreeQuarters/Total
- `hasLineOfSight()` — Bresenham line + wall checks
- `findPath()` — A* with walls, blocked paths, diagonal movement
- `getReachablePositions()` — BFS with movement speed limits, terrain costs

---

## 8. `src/components/encounterSimulator/aiDecisions.ts` — AI Decision Making

**Side effects:** Imports `PRNG` type from `'./diceRollFunctions'`, types + `Position` from `'./emulatorTyping'`, `MovementResolver` from `'./movement'`. No Pinia, no Dexie, no DOM, no network.
**Testability:** `AIDecisionMaker` — stateful via mutable scoring but deterministic with seeded RNG. Complex scoring logic is testable.

### Exported interfaces

| Interface | Key Fields |
|-----------|-----------|
| `ScoringFactors` | `{ damageWeight: number, healingWeight: number, survivalWeight: number, controlWeight: number, supportWeight: number }` |
| `ThreatAssessment` | `{ combatantName: string, threatLevel: number, distanceToAlly: number, damageOutput: number, isEliminated: boolean }` |

### Exported class

| Class | Signature | Description |
|-------|-----------|-------------|
| **`AIDecisionMaker`** | **`class AIDecisionMaker { constructor(rng: PRNG); selectAction(combatant: SimulatorCombatant, candidates: ActionCandidate[], state: SimulationState, roleWeights: RoleDefinition): ActionCandidate\|null; scoreAction(candidate: ActionCandidate, combatant: SimulatorCombatant, state: SimulationState, roleWeights: RoleDefinition): number; assessThreats(defender: SimulatorCombatant, state: SimulationState): ThreatAssessment[]; evaluatePosition(combatant: SimulatorCombatant, target: SimulatorCombatant, state: SimulationState, roleWeights: RoleDefinition): 'approach' \| 'hold' \| 'retreat'; evaluateAoEPlacement(centerPosition: {x: number, y: number}, radius: number, caster: SimulatorCombatant, state: SimulationState): number; findBestAoECenter(candidates: Array<{x: number, y: number}>, radius: number, caster: SimulatorCombatant, state: SimulationState): {x: number, y: number} \| null; }`** | Role-based AI action scoring and selection. Multiple private scoring helpers. |

**Best unit-test targets:**
- `scoreAction` — damage bonus, healing urgency (HP thresholds), resource cost penalties
- `assessThreats` — threat level 0-100 calculation with role multipliers
- `evaluatePosition` — retreat (<40% HP + save preference), approach (>2 dist)
- `evaluateAoEPlacement` — enemy damage vs friendly fire scoring
- `findBestAoECenter` — candidate selection with positive score check

---

## 9. `src/components/encounterSimulator/monsterParser.ts` — Monster Stat Block Parser

**Side effects:** Imports `type { Monster, Entry, MonsterCR }` from `'../../types'` (compile-time only). No Pinia, no Dexie, no DOM, no network.
**Testability:** **Excellent** — regex-based parsing, deterministic output from deterministic input.

### Exported class

| Class | Signature | Description |
|-------|-----------|-------------|
| **`MonsterParser`** | **`class MonsterParser { constructor(spellNames?: Set<string>); setSpellNames(names: string[]): void; parseMonsterActions(monster: Monster): ParsedAbility[]; parseMonsterProfile(monster: Monster): ParsedMonsterProfile; static getProficiencyBonus(cr: MonsterCR): number; }`** | Parses text entries from monster stat blocks into structured ability/attack profiles. |

**Key private methods (exposed via testable public surface):**
- `flattenEntries()` — nested `Entry[]` → flat `string[]`
- `extractCost()` — regex `"Costs N legendary actions"`
- `extractDC()` — regex `"DC N"`
- `detectConcentration()` — case-insensitive `concentration` check
- `extractRecharge()` — regex `"Recharge N-N"`
- `detectSpellReference()` — word-boundary regex matching against known spells
- `parseAttackFromText()` — regex for `"Melee Weapon Attack: +N to hit"`, damage extraction, 5etools `{@damage}` tags
- `wordToNumber()` — `"one"` → `1`, etc.
- `parseAttackDetails()` — structured `attackDetails` JSON parsing

**Best unit-test targets:**
- `parseMonsterActions()` — action/legendary/reaction/lair/mythic parsing
- `parseMonsterProfile()` — multiattack detection, attack bonus/damage extraction
- `getProficiencyBonus(cr)` — static method: CR ranges → proficiency bonus 2-9
- `extractDC()` — `"DC 16"` → `16`
- `extractRecharge()` — `"Recharge 5–6"` → `"5–6"`
- `detectSpellReference()` — `"Fireball"` in text
- `parseAttackFromText()` — melee/ranged regex, damage extraction from `{@damage}` tags and plain text formats

---

## 10. `src/components/encounterSimulator/simulationEngine.ts` — Core Simulation Loop

**Side effects:** Imports types and runtime classes from `emulatorTyping`, `movement`, `combatRules`, `diceRollFunctions`, `monsterParser`. No Pinia, no Dexie, no DOM, no network.
**Testability:** `SimulationEngine` class — orchestrates the other modules. Complex integration logic, testable with mock `PRNG`.

### Exported interfaces

| Interface | Key Fields |
|-----------|-----------|
| `RoundLog` | `{ round: number, turn: number, combatantId: string, action: ActionCandidate\|null, result: TurnResult }` |
| `SimulationStatistics` | `{ roundsCompleted: number, winningTeam: string\|null, totalRounds: number, combatantsAlive: number }` |
| `ProfilingData` | `{ totalMs: number, initMs: number, roundsMs: number, actionCandidatesMs: number, attackResolveMs: number, spellResolveMs: number, roundCount: number, turnCount: number, hotPaths: Array<{name: string; totalMs: number; callCount: number}> }` |

### Exported class

| Class | Signature | Description |
|-------|-----------|-------------|
| **`SimulationEngine`** | **`class SimulationEngine { constructor(config: SimulationConfig, allies: SimulatorCombatant[], enemies: SimulatorCombatant[]); run(): SimulationResult; runBatch(count: number): SimulationBatch; getStatistics(): SimulationStatistics; }`** | Core simulation loop: initializes state, runs round-by-round combat, returns results with profiling data. |

**Best unit-test targets:**
- `run()` — single simulation: verify round-by-round progression, win condition, log structure
- `runBatch()` — batch execution, statistics aggregation
- `getStatistics()` — post-simulation stats verification
- Integration testing: verify `SimulationEngine` correctly composes `CombatResolver`, `AIDecisionMaker`, `MovementResolver`, `DiceRoller`

---

## 11. `src/components/levelup/levelUpHelpers.ts` — Level-Up Logic

**Side effects:** Imports `type { CharClass, ClassLevels, Entries, playerCharacter, SpellcastingCastingMode }` from `'../../types'` (compile-time), and calls `computeCharSpellcasting` from `'../../helperFunctions'` (pure function, no store access). **No Pinia, no Dexie, no DOM, no network.**
**Testability:** **Excellent** — pure function with deterministic output from deterministic input.

### Exported types

| Export | Kind | Description |
|--------|------|-------------|
| `LevelTableChange` | interface | `{ label: string, oldValue: string, newValue: string }` — delta between class table rows |
| `LevelUpFeature` | interface | `{ name: string, entries?: Entries, gainSubclassFeature?: boolean }` |
| `LevelUpAnalysis` | interface | `{ newClassLevel: number, currentClassLevel: number, isNewClass: boolean, featuresGained: LevelUpFeature[], hasASI: boolean, needsSubclass: boolean, cantripsDelta: number, spellsKnownDelta: number, isSpellcaster: boolean, castingMode: SpellcastingCastingMode, newSpellSlotsDescription: string[], tableChanges: LevelTableChange[], maxSpellSlotLevel: number }` |

### Exported function

| Function | Signature | Description |
|----------|-----------|-------------|
| **`computeLevelUpAnalysis`** | **`(character: playerCharacter, chosenClass: CharClass) => LevelUpAnalysis`** | **Pure: computes all level-up deltas. Reads `character.classLevels`, `character.classes`, calls `computeCharSpellcasting` (also pure). Returns feature gains, ASI detection, subclass unlock, spell slot deltas, table changes.** |

**Best unit-test targets:**
- `computeLevelUpAnalysis(char, class)` — level 1→2, multi-classing in, ASI detection
- Subclass unlock detection (`needsSubclass`)
- Spell slot delta generation (new slot level appears)
- Table change computation (old vs new class table values)
- Edge cases: level 0 class (first level), spellbook casters (+2 spells/level)

---

## Summary: Testability Matrix

| File | Export Count | Pure Functions | Needs Mocks | DOM? | Pinia? | Dexie/LS? | Network? |
|------|-------------|---------------|-------------|------|--------|-----------|----------|
| `src/types.ts` | ~50 types | N/A (types only) | No | No | No | No | No |
| `src/constants.ts` | 12 constants | ✅ All | No | No | No | No | No |
| `src/helperFunctions.ts` | ~30 exports | ✅ All | No | No | No | No | No |
| `emulatorTyping.ts` | ~30 exports | ✅ Classes | No* | No | No | No | No |
| `diceRollFunctions.ts` | 2 exports + class | ✅ All | Seeded RNG** | No | No | No | No |
| `combatRules.ts` | 3 interfaces + class | Partial | Seeded RNG** | No | No | No | No |
| `movement.ts` | 2 exports + class | ✅ All | No | No | No | No | No |
| `aiDecisions.ts` | 2 interfaces + class | Partial | Seeded RNG** | No | No | No | No |
| `monsterParser.ts` | 1 class | ✅ All | No | No | No | No | No |
| `simulationEngine.ts` | 3 interfaces + class | Partial | Seeded RNG** | No | No | No | No |
| `levelUpHelpers.ts` | 1 function | ✅ All | No | No | No | No | No |

> *Classes like `SimulatorCombatant`, `Position`, `GameMap` are stateful but self-contained — no external dependencies.
> **Seeded RNG injection makes these fully deterministic and testable without real randomness.

### Highest-value test targets (purest functions):
1. `abilityMod(score)` — `src/helperFunctions.ts`
2. `calculateProficiencyBonus(level)` — `src/helperFunctions.ts`
3. `calculateDc(proficiency, modifier)` — `src/helperFunctions.ts`
4. `calculateAttackModifier(proficiency, modifier)` — `src/helperFunctions.ts`
5. `calculateAverageRoll(diceType, count, modifier)` — `diceRollFunctions.ts`
6. `DiceRoller.averageDamage(expression)` — `diceRollFunctions.ts`
7. `MovementResolver.distance()` — `movement.ts`
8. `MonsterParser.getProficiencyBonus(cr)` — `monsterParser.ts`
9. `MonsterParser.extractDC()`, `extractRecharge()` — `monsterParser.ts`
10. `computeCharSpellcasting(char)` — `src/helperFunctions.ts` (complex pure logic)
11. `stackInventoryItems(items)` — `src/helperFunctions.ts` (aggregation)
12. `computeLevelUpAnalysis(char, class)` — `levelUpHelpers.ts` (complex pure logic)
13. `getRefinedItemsList()` / `getRefinedFeatsList()` — `src/helperFunctions.ts` (filtering/sorting)
