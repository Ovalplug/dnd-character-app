# Encounter Simulator — Scope Document

## Overview

The encounter simulator is a tactical combat resolution engine that evaluates D&D 5e encounters through multi-run analysis. Users configure encounter layout, participant stat blocks, and strategic roles, then run simulations (1–1000+) to gather statistical outcomes and tactical insights.

**Core Purpose:** Accuracy-first predictive tool for encounter balance, tactical validation, and resource burn analysis.

---

## Feature Breakdown

### 1. Encounter Setup UI

#### Map Configuration

- **Variable grid system:** User-defined dimensions (e.g., 10×10, 20×15)
- **Cell size:** Fixed 5 ft per cell (D&D standard)
- **Map features:**
  - Starting positions per combatant/team (drag-or-click placement)
  - Walls (block LOS and movement)
  - Difficult terrain (double movement cost)
  - Elevation changes (affect ranged attacks, some spells)
  - Side objectives (optional markers; may influence AI behavior)
- **Grid editing:** Add/remove/modify features before sim starts

#### Participant Setup

- **Add combatants:** Import from character builder or bestiary
- **Grouping:** Assign to teams (Players, Enemies, Neutral, etc.)
- **Per-combatant config:**
  - Stat block (ability scores, AC, HP, speeds, etc.)
  - Actions/bonus actions/reactions (spells, attacks, abilities, legendary/mythic/lair actions parsed from JSON)
  - Available resources (spell slots by level, ability recharges, weapon charges)
  - Assigned roles (one or more; see AI section)
  - Starting position on map
  - **Toggles:**
    - Apply death saves (default: ON for PCs, OFF for enemies; toggle per combatant)
    - Allow surrender/flee (for Coward role, default: ON; toggle per combatant)
    - Surrender HP threshold (e.g., 30%; configurable per Coward combatant)

#### Role Assignment

- **Available roles:** Tank, Healer, Damage Dealer, Controller, Boss, Coward, Scout, Support (extensible)
- **Multi-role support:** A character can have "Tank + Support"
- **Role-driven behavior:** Roles influence action prioritization and tactics

---

### 2. Simulation Engine

#### Combat Rules Implementation

- **Full 5e mechanics:**
  - Initiative (d20 + DEX modifier, advantage/disadvantage)
  - Attack rolls (full randomness, crits on natural 20)
  - Damage rolls (full randomness per weapon/spell)
  - Saving throws (full randomness)
  - All status effects (prone, grappled, stunned, paralyzed, unconscious, concentrating, etc.)
  - Advantage/disadvantage on relevant rolls (flanking grants advantage on melee attacks; high ground grants advantage on ranged attacks; hidden combatant gains advantage on attack roll, breaks on attacking)
  - Action economy (action, bonus action, reaction, movement per turn)
  - Opportunity attacks (triggered when opponent leaves reach without Disengage or move-away action)
  - Legendary actions, mythic actions, lair actions (parsed from stat blocks, executed per JSON definitions)
- **Death Saves:**
  - Default applied to Player Characters only (toggleable per enemy if needed)
  - Natural 20 on save: regain 1 HP, conscious and active
  - Natural 1 on save: counts as 2 failures
  - 3 failures: death
  - 3 successes: stable (unconscious, not dying)
  - Successful hit by ally on unconscious target: conscious, regains 1 HP
- **Resources:**
  - All combatants start with full resource pools (spell slots, ability recharges, weapon charges, etc.)
  - Resources do **not** refresh mid-encounter (no short rests)
  - Hit Dice: Only usable if combatant has ability/feat explicitly allowing it outside short rest (otherwise restricted to combat healing spells only)
  - Resource constraints scale per mode (see Split Testing section)

#### Movement System

- **Movement allocation:**
  - Combatants can move → action → move (in any order, up to speed limit)
  - Diagonal movement costs 5 ft (PHB standard)
  - Difficult terrain doubles movement cost
  - Elevation affects ranged attack rolls and spell saving throws (high ground grants advantage on ranged attacks; elevation gap affects accuracy)
  - Pathing considers obstacles (walls, other combatants)
- **Line of Sight & Cover:**
  - All ranged attacks and spells require clear LOS to target
  - Cover provides AC bonuses:
    - **Half Cover:** +2 AC (e.g., behind statue, barrel, partial wall)
    - **Full Cover:** Cannot be targeted by attack/spell (e.g., behind stone wall, dense tree)
  - Cover blocks spell effects (no AoE through full cover, but AoE can spill around half cover)
  - Elevation affects LOS (higher vantage can see over half cover at ground level)

#### AI/Decision-Making: Weighted Decision System

All decisions (action selection, target selection, concentration conflicts) are resolved through a **weighted scoring system**. Each possible action or target receives a numerical score based on role-driven weights and situation factors. Highest score wins.

**Decision Weights by Role:**

- **Tank:** High weight for protecting allies (+10 to allies in danger), drawing enemy attention, positioning between threat and vulnerable allies. Low weight for dealing damage.
- **Healer:** High weight for allies needing healing (scaled by role: +10 for allies <75% HP, +15 for <50%, +20 for <25%). Weight for offensive actions lower except in emergencies.
- **Damage Dealer:** High weight for maximizing single-target damage. Boss enemies get +10 weight. Low weight for non-damage actions unless action economy demands it.
- **Controller:** High weight for crowd-control effects that disable threats. Boss enemies and groups of enemies get +10 weight.
- **Boss:** High weight for high-damage actions, coordinating ally actions, escalating tactics as battle progresses (increase threat weight as battle drags).
- **Coward:** High weight for self-preservation actions (retreat, disengage, positioning away from threats). If HP <30% (or toggle threshold), multiply weight for flee/surrender actions by 2.
- **Scout:** High weight for mobility and positioning (flanking, high ground). Isolated/lone enemy targets get +10 weight.
- **Support:** High weight for buff/enabling ally actions. Secondary weight for damage. Can cast healing at lower HP thresholds than dedicated Healer.

**Threat Assessment (Target Selection):**
Each potential target receives a threat score:

- Base: Enemy damage output estimate (avg damage per turn)
- Modifiers:
  - Boss enemies: +10
  - High HP pool: +5
  - High AC (harder to hit): -3
  - Spellcaster (concentration threat): +5
  - Currently threatening nearest ally: +8
  - Wounded (already taken damage): +2 (priority finish)
- Apply role-specific bonuses (e.g., Tank adds +10 to enemies closest to squishy allies)
- Apply resource mode scaling (Low/Balanced/Max)

**Action Selection:**
Each candidate action (attack enemy A, cast spell X on ally B, move to position C, Dodge, etc.) receives a score:

- Role priority weight (Damage Dealer heavily weights Attack action, Tank weights Defensive action)
- Expected outcome (% to-hit, damage roll estimate, healing value estimate)
- Resource cost (penalty higher in Low Resource mode, ignored in Max Resource mode)
- Action economy (2 actions consumed = lower score unless critical)
- Safety/risk (risky positioning = lower score for self-preservation roles)

Highest-scoring action executes.

**Concentration Conflicts:**
If combatant maintains concentration spell (e.g., _Blessing of Protection_) and an action might conflict:

- Score maintaining concentration (status quo)
- Score breaking concentration to cast new spell (compare benefit of new spell vs loss of active buff)
- Choose higher-scoring option

**Role-Based Behavior:**

- **Deep role-based behavior:**
  - **Tank:** Maximize party defense (position between allies & enemies, use defensive spells, draw enemy attention)
  - **Healer:** Monitor ally HP pools, cast healing when allies below threshold (variable by role + action economy trade-off)
  - **Damage Dealer:** Maximize damage output while managing resources
  - **Controller:** Use crowd-control spells (web, hold person, etc.), prioritize disabling threats
  - **Boss:** Act as a tactical leader, coordinate with allies, escalate tactics as battle progresses
  - **Coward:** Prioritize self-preservation. When HP falls below threshold (togglable, default 30%), sharply increase weight for retreat/flee actions. Can Disengage and move away from threats. If surrounded or no escape path, may Surrender (ends individual participation, or removes from combat if allowed by toggle)
  - **Scout:** Prioritize mobility and positioning for advantage, focus on isolated targets
  - **Support:** Enable allies (buffs, action economy support), secondarily deal damage
- **Resource-aware decisions:**
  - In **Low Resource mode:** Heavily penalize resource-cost actions (spell slots, charges, HD usage). Prefer cantrips, melee attacks.
  - In **Balanced mode:** Scale resource penalties proportionally based on expected encounter length.
  - In **Max Resource mode:** No penalty for resource costs; optimize purely for effect/damage.
- **Adaptive tactics:**
  - Reassess priorities each turn (re-score all options)
  - Consider positioning, LOS, movement costs, cover (factors into hit probability)
  - Account for concentration and status effects (status effects reduce scoring for actions requiring dodging/positioning)

#### Simulation Loop (per combatant per turn)

1. Check status (unconscious? dead? can act? concentration maintained?)
2. Assess situation (threat assessment, resource inventory, position evaluation)
3. Generate candidate actions (scored by weighted decision system)
4. For AoE actions: evaluate placement to maximize enemy damage while minimizing friendly fire
5. Select highest-scoring action
6. Execute action (move, cast, attack, Dodge, Disengage, Dash, etc.)
7. Resolve rolls (attack, damage, saves, etc.) using full RNG
8. Update state (HP, spell slots, status effects, positions, concentration status)

---

## 5. Mechanics Implementation Details

### Healing Decision Logic

Healers and Support combatants decide to heal based on **weighted scoring** that combines:

- **Ally HP threshold:** Lower HP = higher score for healing
  - Healer: +20 for allies <25% HP, +15 for <50%, +10 for <75%
  - Support: +15 for allies <30% HP, +10 for <60%
- **Action economy trade-off:** Healing action = foregone damage. Score reduced by expected damage dealt if action taken instead.
  - Resource mode impact: In Low Resource mode, healing score reduced (fewer spell slots, prefer to ration). In Max Resource mode, healing score boosted (optimal output).
- **Concentration conflict:** If breaking active concentration spell, apply penalty (compare benefit vs. loss of buff).

Example: Support sees Rogue at 40% HP. Healing score = base(+10 for <60%) - penalty(foregone damage = -5) = +5. Meanwhile, casting _Fireball_ at 3 enemies = +12 damage score. _Fireball_ chosen.

### Advantage/Disadvantage Sources

- **Flanking:** Attacking enemy with ally on opposite side grants advantage on melee attack
- **High ground:** Ranged attacker on higher elevation grants advantage on ranged attack roll
- **Stealth/Hidden:** Hidden attacker gains advantage on first attack roll; attacking breaks hidden status
- **Status effects:** Certain conditions grant/deny advantage (e.g., prone enemy = melee disadvantage, ranged advantage; invisible attacker has advantage)

### AoE Spell Targeting

Casters evaluate AoE spell placements to maximize damage while minimizing friendly fire:

- Generate candidate center/radius points for spell (e.g., _Fireball_ 20-ft radius)
- Score each placement: damage to enemies - damage to allies (weighted heavily against friendly fire)
- Execute highest-scoring placement or skip spell if friendlies would take significant damage

### End Conditions

- One team eliminated or incapacitated (all unconscious/dead)
- Predetermined round limit exceeded (if set)
- All combatants of a team Surrendered (if Coward toggle enabled)
- All objectives completed (if applicable)

---

### 3. Split Testing (Resource Modes)

**Three parallel simulation tracks (1/3 of runs each):**

1. **Low Resource Mode (1/3 of runs):**

   - All participants start with reduced resources
   - Spell slots: Capped at 1/3 of available (e.g., 9 slots becomes 3)
   - Ability uses (recharges): Capped at 1/3 of available
   - Weapon charges: Capped at 1/3
   - No consumables (potions, etc.)
   - **AI behavior:** Heavily penalize resource-cost actions. Strongly prefer cantrips and melee attacks. Save spell slots for emergencies only.
   - **Use case:** Test encounter vs. under-prepped party

2. **Balanced Mode (1/3 of runs):**

   - Standard resource pools as defined in stat blocks
   - Full spell slots, ability uses, weapon charges
   - **AI behavior:** Scale resource penalties based on expected encounter length estimate. Use resources proportionally across encounter.
   - **Use case:** Typical encounter tuning

3. **Max Resource Mode (1/3 of runs):**
   - All participants start with full resources
   - Full spell slots, ability uses, weapon charges
   - If ability recharges on short rest (not applicable mid-encounter), still start fully charged
   - **AI behavior:** No penalty for resource costs. Optimize purely for damage/effect output. Use most powerful actions liberally.
   - **Use case:** Test encounter vs. well-prepped party with full resources

**Interpretation:** Split testing exposes encounter balance across different resource scenarios, helping identify if encounter is trivial with buffs or brutal when resources dry up. Compare win rates and tactical diversity across modes.

---

### 4. Output & Reporting

#### Simulation-Level Metrics

- **Overall outcomes:**
  - Win rate per team (as % across all runs)
  - Average rounds to completion
  - Total runs completed

#### Per-Team Metrics

- Average final HP (across survivors + team)
- Total damage dealt (aggregate)
- Resources burned (spell slots, ability uses)
- Casualties / survival rate

#### Per-Combatant Metrics

- Damage dealt (avg per run)
- Damage taken (avg per run)
- Actions taken (frequency breakdown: attacks, spells, movement, etc.)
- Resource usage (spell slots by level, ability charges, etc.)
- Status effect uptime (times affected by condition X, avg duration)
- Kills attributed
- Death rate (% of runs participant died)

#### Breakdown by Resource Mode

- Separate reporting per mode (Low/Balanced/Max)
- Side-by-side comparison tables

#### Raw Data Export

- Per-run logs (verbose): participant turns, rolls, outcomes
- Aggregate CSV: combatant stats across all runs

---

## Non-Goals

- **Not a VTT:** No fog of war, token art library, chat, or persistent world
- **Not a map builder:** Minimal decoration; functional layout only
- **Not a character creator:** Uses existing character builder and bestiary
- **Not live multiplayer:** Single-user analysis tool
- **No fancy visualization:** Raw tables/stats; fancy graphs deferred

---

## Technical Considerations

### Performance

- Target: 1000 simulations in <30 seconds (accuracy prioritized over raw speed)
- Optimization: Pre-compute where possible (stat arrays, ability lists)
- Bottleneck: Pathfinding, status effect resolution, resource tracking

### Data Structure

- Leverage existing character/bestiary data (stat blocks, actions, spells)
- Encapsulate simulation state per run (position, HP, resources, statuses)
- Track turn-by-turn events for reporting/debugging

### Complexity Management

- Start with core mechanics, iterate toward full depth
- Modular AI: Role behaviors composed from decision primitives
- Status effect system: Pluggable effect handlers

---

## MVP vs. Future

### MVP

- Variable grid with walls and difficult terrain
- 2+ teams (friendly/enemy minimum)
- 5–8 core roles
- Low/Balanced/Max resource split testing
- Basic stats reporting (outcomes, avg rounds, damage per combatant)
- Full 5e mechanics (rolls, saves, status effects, action economy)

### Future Enhancements

- Additional terrain types (water, lava, hazards)
- Side objectives with behavioral influence
- Advanced AI meta (morale, surrender conditions)
- Interactive replay (step through simulation turn-by-turn)
- Graphical charts and heatmaps
- Custom role creation UI
- Encounter library/templates
