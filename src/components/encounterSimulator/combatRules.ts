/**
 * Combat Resolution Rules Engine (OOP)
 * Handles attack rolls, spell saves, damage resolution, death saves,
 * condition application, concentration conflict resolution, and cover.
 */

import type { PRNG } from './diceRollFunctions';
import { DiceRoller } from './diceRollFunctions';
import type {
  SimulatorCombatant,
  DamageRoll,
  SpellSaveResult,
  OpportunityAttackResult,
  HitDiceHealResult,
  AoESpellTargetResult,
} from './emulatorTyping';
import { Position } from './emulatorTyping';
import type { DiceType } from './emulatorTyping';
import { Condition } from './emulatorTyping';
import type { Monster } from '../../types';
import { MovementResolver } from './movement';

/**
 * Result of an attack roll.
 */
export interface AttackResult {
  rolled: number;
  isCrit: boolean;
  isHit: boolean;
  damageDice?: Array<{ count: number; type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' }>;
  damageModifier?: number;
  finalDamage: number;
  totalDamageDealt: number;
  resistanceApplied?: 'immune' | 'resist' | 'vulnerable' | 'normal';
  damageBreakdown?: DamageRoll;
  /** Bonus to hit from flanking (advantage), cover, or condition penalties. */
  hitPenalty?: number;
  /** Bonus to hit from flanking (advantage). */
  hitAdvantage?: boolean;
}

/**
 * Result of a saving throw.
 */
export interface SaveResult {
  targetName: string;
  dc: number;
  rolled: number;
  succeeded: boolean;
  damageHalfOnSuccess: boolean;
  baseDamage: number;
  finalDamage: number;
}

/**
 * Result of a death save.
 */
export interface DeathSaveResult {
  rolled: number;
  isCrit: boolean;
  isSuccess: boolean;
  successCount: number;
  failureCount: number;
  isDead: boolean;
}

/**
 * Resolves all combat mechanics.
 */
export class CombatResolver {
  private roller: DiceRoller;
  private movementResolver: MovementResolver;

  constructor(rng: PRNG) {
    this.roller = new DiceRoller(rng);
    this.movementResolver = new MovementResolver(rng);
  }

  /**
   * Resolve an attack roll.
   * Returns hit/miss result and applies damage if hit.
   */
  resolveAttack(
    attacker: SimulatorCombatant,
    target: SimulatorCombatant,
    weaponModifier: number = 0,
    damageExpression: string = '1d4',
    advantage: boolean = false,
    disadvantage: boolean = false,
    damageType: string = 'bludgeoning',
    isRanged: boolean = false,
    map?: any
  ): AttackResult {
    // Check for flanking advantage
    const flankingAdvantage = attacker.checkFlanking(target);
    const finalAdvantage = advantage || flankingAdvantage;

    // Check for cover against this attacker
    let coverAmount = 0;

    if (map && isRanged) {
      const cover = this.movementResolver.getCover(attacker.position, target.position, map);
      if (cover !== 0) {
        if (cover === 2) coverAmount = 2; // Half cover
        else if (cover === 5) coverAmount = 5; // Three-quarter cover
        else coverAmount = 0; // Total cover handled separately
      }
    }

    // Get condition effects on attacker
    const attackerEffects = attacker.getActiveConditionEffects();
    const attackRollPenalty = attackerEffects.attackRollPenalty ?? 0;

    // Attack roll
    const attackRoll = this.roller.rollD20(
      weaponModifier + attackRollPenalty,
      finalAdvantage,
      disadvantage
    );
    const targetAC = this.getEffectiveAC(target, { isRanged, coverAmount });
    const isHit = attackRoll >= targetAC;
    const isCrit = attackRoll === 20 + weaponModifier + attackRollPenalty;

    // Damage calculation — use detailed roll to capture individual die results
    let rawDamage = 0;
    let damageBreakdown: DamageRoll | undefined;
    if (isHit) {
      const rollResult = this.roller.parseDamageExpressionDetailed(damageExpression, isCrit);
      rawDamage = rollResult.total;
      damageBreakdown = {
        expression: isCrit ? `${damageExpression} (CRIT ×2 dice)` : damageExpression,
        groups: rollResult.groups,
        modifier: rollResult.modifier,
        rawTotal: rawDamage,
        total: rawDamage, // updated below after resistance
        damageType,
        isCrit,
      };
    }

    // Apply resistance / immunity / vulnerability
    let finalDamage = rawDamage;
    let resistance: 'immune' | 'resist' | 'vulnerable' | 'normal' = 'normal';

    if (isHit) {
      resistance = this.checkResistance(target.monster, damageType);
      if (resistance === 'immune') {
        finalDamage = 0;
      } else if (resistance === 'resist') {
        finalDamage = Math.floor(rawDamage / 2);
      } else if (resistance === 'vulnerable') {
        finalDamage = rawDamage * 2;
      }
    }

    if (damageBreakdown) damageBreakdown.total = finalDamage;

    // Apply damage
    if (isHit && finalDamage > 0) {
      const hpBefore = target.currentHp;
      target.takeDamage(finalDamage);
      attacker.totalDamageDealt += finalDamage;

      // Check concentration break if target was concentrating
      const damageTaken = hpBefore > 0 ? hpBefore - target.currentHp : finalDamage;
      if (damageTaken > 0 && target.concentratingOn) {
        target.checkConcentration(damageTaken, () => this.roller.rng());
      }
    }

    // Track hit / miss / crit on attacker
    if (!isHit) {
      attacker.missCount++;
    } else if (isCrit) {
      attacker.critCount++;
    } else {
      attacker.hitCount++;
    }

    return {
      rolled: attackRoll,
      isCrit,
      isHit,
      finalDamage: isHit ? finalDamage : 0,
      totalDamageDealt: attacker.totalDamageDealt,
      resistanceApplied: resistance,
      damageBreakdown,
      hitPenalty: attackRollPenalty,
      hitAdvantage: flankingAdvantage,
    };
  }

  /**
   * Resolve a spell save (e.g., Fireball, Cone of Cold).
   * Handles damage, resistance, and condition application.
   */
  resolveSave(
    caster: SimulatorCombatant,
    targets: SimulatorCombatant[],
    dc: number,
    damageExpression: string = '8d6',
    savingThrowAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' = 'dex',
    halfDamageOnSuccess: boolean = true,
    conditionOnFail?: string,
    conditionDuration?: number
  ): SpellSaveResult[] {
    const results: SpellSaveResult[] = [];

    for (const target of targets) {
      const abilityModifier = this.getAbilityModifier(target.monster, savingThrowAbility);
      const saveRoll = this.roller.rollD20(abilityModifier);
      const succeeded = saveRoll >= dc;

      // Auto-fail on 1, auto-success on 20

      const isAutoSuccess = saveRoll === 20;

      let baseDamage = this.roller.parseDamageExpression(damageExpression);
      let finalDamage = baseDamage;
      let conditionApplied: string | undefined;

      if (isAutoSuccess || (succeeded && halfDamageOnSuccess)) {
        // Success: take half damage (or full if halfDamageOnSuccess is false)
        if (halfDamageOnSuccess) {
          const resistance = this.checkResistance(target.monster, 'untyped');
          if (resistance === 'immune') {
            finalDamage = 0;
          } else if (resistance === 'resist') {
            finalDamage = Math.ceil(baseDamage / 4); // half of half
          } else {
            finalDamage = Math.ceil(baseDamage / 2);
          }
        }
      } else {
        // Failed save: take full damage
        const resistance = this.checkResistance(target.monster, 'untyped');
        if (resistance === 'immune') {
          finalDamage = 0;
        } else if (resistance === 'resist') {
          finalDamage = Math.floor(baseDamage / 2);
        }
        // Apply condition on failed save
        if (conditionOnFail) {
          // Remove flanking condition if target was flanked
          const idx = target.conditions.findIndex(c => c.type === 'flanked' && c.duration > 0);
          if (idx !== -1) {
            target.removeCondition(idx);
          }
          target.addCondition(
            new Condition(conditionOnFail, conditionDuration ?? 1, caster.getName())
          );
          conditionApplied = conditionOnFail;
        }
      }

      // Apply damage
      target.takeDamage(finalDamage);
      caster.totalDamageDealt += finalDamage;

      // Check concentration break if target was concentrating
      if (finalDamage > 0 && target.concentratingOn) {
        target.checkConcentration(finalDamage, () => this.roller.rng());
      }

      results.push({
        targetName: target.getName(),
        dc,
        rolled: saveRoll,
        ability: savingThrowAbility,
        succeeded: isAutoSuccess || succeeded,
        halfDamageOnSuccess,
        baseDamage,
        finalDamage,
        conditionApplied,
      });
    }

    return results;
  }

  /**
   * Resolve a death saving throw (3 successes to stabilize, 3 failures to die).
   */
  resolveDeathSave(combatant: SimulatorCombatant): DeathSaveResult {
    const roll = this.roller.rollD20();
    const isCrit = roll === 20;
    const isFumble = roll === 1;

    let isSuccess: boolean;
    if (isCrit) {
      isSuccess = true;
      combatant.deathSaves.successes += 2;
    } else if (isFumble) {
      isSuccess = false;
      combatant.deathSaves.failures += 2;
    } else {
      isSuccess = roll >= 10;
      if (isSuccess) {
        combatant.deathSaves.successes++;
      } else {
        combatant.deathSaves.failures++;
      }
    }

    const isDead = combatant.deathSaves.successes >= 3 || combatant.deathSaves.failures >= 3;

    if (combatant.deathSaves.successes >= 3) {
      combatant.isConscious = true;
      combatant.currentHp = 1;
    } else if (combatant.deathSaves.failures >= 3) {
      combatant.currentHp = -combatant.getMaxHp();
    }

    return {
      rolled: roll,
      isCrit,
      isSuccess,
      successCount: combatant.deathSaves.successes,
      failureCount: combatant.deathSaves.failures,
      isDead,
    };
  }

  /**
   * Apply a condition to a combatant.
   */
  applyCondition(
    target: SimulatorCombatant,
    type: string,
    duration: number,
    sourceName?: string
  ): void {
    // Remove conflicting conditions (prone/grappled/restrained don't stack)
    if (type === 'prone' || type === 'grappled' || type === 'restrained') {
      target.conditions = target.conditions.filter(
        c => !['prone', 'grappled', 'restrained'].includes(c.type)
      );
    }

    // Create and add condition
    const condition = new Condition(type, duration, sourceName);
    target.addCondition(condition);
  }

  /**
   * Remove a condition from a combatant.
   */
  removeCondition(target: SimulatorCombatant, type: string): void {
    const idx = target.conditions.findIndex(c => c.type === type && c.duration > 0);
    if (idx !== -1) {
      target.removeCondition(idx);
    }
  }

  /**
   * Check if a condition is active.
   */
  hasCondition(target: SimulatorCombatant, type: string): boolean {
    return target.hasCondition(type);
  }

  /**
   * Get ability modifier from monster stats.
   */
  /**
   * Get all combatants within an AoE spell area of effect.
   * Supports sphere, cone, line, burst, and blob targeting.
   */
  getAoETargets(
    center: Position,
    radius: number,
    aoeType: 'sphere' | 'cone' | 'line' | 'burst' | 'blob',
    allCombatants: SimulatorCombatant[],
    caster: SimulatorCombatant,
    casterPosition?: Position
  ): SimulatorCombatant[] {
    const targets: SimulatorCombatant[] = [];

    for (const combatant of allCombatants) {
      if (combatant.currentHp <= 0 || !combatant.isConscious) continue;
      if (combatant === caster) continue;

      const dist = combatant.position.distanceTo(center);

      if (aoeType === 'sphere' || aoeType === 'burst' || aoeType === 'blob') {
        if (dist <= radius) {
          targets.push(combatant);
        }
      } else if (aoeType === 'cone') {
        if (casterPosition) {
          const dx = casterPosition.x - center.x;
          const dy = casterPosition.y - center.y;
          const toTargetX = combatant.position.x - center.x;
          const toTargetY = combatant.position.y - center.y;
          const dot = dx * toTargetX + dy * toTargetY;
          const mag1 = Math.sqrt(dx * dx + dy * dy);
          const mag2 = Math.sqrt(toTargetX * toTargetX + toTargetY * toTargetY);
          if (mag1 > 0 && mag2 > 0) {
            const cosAngle = dot / (mag1 * mag2);
            if (cosAngle > 0.5 && dist <= radius) {
              targets.push(combatant);
            }
          }
        } else if (dist <= radius) {
          targets.push(combatant);
        }
      } else if (aoeType === 'line') {
        if (casterPosition) {
          const dx = center.x - casterPosition.x;
          const dy = center.y - casterPosition.y;
          const toTargetX = combatant.position.x - casterPosition.x;
          const toTargetY = combatant.position.y - casterPosition.y;
          const cross = Math.abs(dx * toTargetY - dy * toTargetX);
          if (cross <= radius && dist <= radius) {
            targets.push(combatant);
          }
        } else if (dist <= radius) {
          targets.push(combatant);
        }
      }
    }

    targets.sort((a, b) => a.position.distanceTo(center) - b.position.distanceTo(center));
    return targets;
  }

  /**
   * Resolve an AoE spell with multiple placement options.
   */
  resolveAoESpell(
    caster: SimulatorCombatant,
    targets: SimulatorCombatant[],
    spellName: string,
    damageExpression: string,
    dc?: number,
    savingThrowAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' = 'dex',
    halfDamageOnSuccess: boolean = true,
    conditionOnFail?: string,
    conditionDuration?: number,
    aoeType: 'sphere' | 'cone' | 'line' | 'burst' | 'blob' = 'sphere',
    centerPosition?: Position
  ): AoESpellTargetResult {
    let totalDamage = 0;
    const affectedNames: string[] = [];
    let saveSucceeded = 0;
    let saveFailed = 0;

    for (const target of targets) {
      let baseDamage: number;
      let succeeded: boolean;
      let finalDamage: number;
      if (dc !== undefined) {
        const abilityModifier = this.getAbilityModifier(target.monster, savingThrowAbility);
        const saveRoll = this.roller.rollD20(abilityModifier);
        succeeded = saveRoll >= dc;
        if (saveRoll === 1) succeeded = false;
        else if (saveRoll === 20) succeeded = true;

        baseDamage = this.roller.parseDamageExpression(damageExpression);

        if (succeeded && halfDamageOnSuccess) {
          const resistance = this.checkResistance(target.monster, 'untyped');
          if (resistance === 'immune') finalDamage = 0;
          else if (resistance === 'resist') finalDamage = Math.ceil(baseDamage / 4);
          else finalDamage = Math.ceil(baseDamage / 2);
          saveSucceeded++;
        } else {
          const resistance = this.checkResistance(target.monster, 'untyped');
          if (resistance === 'immune') finalDamage = 0;
          else if (resistance === 'resist') finalDamage = Math.floor(baseDamage / 2);
          else finalDamage = baseDamage;
          saveFailed++;

          if (conditionOnFail) {
            target.addCondition(
              new Condition(conditionOnFail, conditionDuration ?? 1, caster.getName())
            );
          }
        }
      } else {
        baseDamage = this.roller.parseDamageExpression(damageExpression);
        finalDamage = baseDamage;
      }

      target.takeDamage(finalDamage);
      caster.totalDamageDealt += finalDamage;

      if (finalDamage > 0 && target.concentratingOn) {
        target.checkConcentration(finalDamage, () => this.roller.rng());
      }

      totalDamage += finalDamage;
      affectedNames.push(target.getName());
    }

    return {
      spellName,
      aoeType,
      centerPosition: centerPosition || new Position(0, 0),
      radius: 15,
      damageDealt: totalDamage,
      targetsAffected: affectedNames,
      saveResult: dc ? { succeeded: saveSucceeded, failed: saveFailed } : undefined,
    };
  }

  private getAbilityModifier(
    monster: Monster,
    ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  ): number {
    const score = monster[ability];
    if (!score) return 0;
    return Math.floor((score - 10) / 2);
  }

  /**
   * Get AC against a specific attack type, accounting for cover.
   */
  getEffectiveAC(
    target: SimulatorCombatant,
    options: {
      isRanged?: boolean;
      isMelee?: boolean;
      hasCover?: boolean;
      coverAmount?: number;
    } = {}
  ): number {
    let ac = target.getAc();

    // Cover grants bonus AC
    if (options.hasCover && options.coverAmount) {
      ac += options.coverAmount;
    }

    return ac;
  }

  /**
   * Check resistance / immunity / vulnerability to a damage type.
   */
  private checkResistance(
    monster: Monster,
    damageType: string
  ): 'immune' | 'resist' | 'vulnerable' | 'normal' {
    const dt = damageType.toLowerCase();

    // Handle "damage" suffix variations (e.g. "fire damage" -> "fire")
    const cleanType = dt.replace(/\s+damage$/i, '');

    if (monster.immune) {
      for (const entry of monster.immune) {
        if (typeof entry === 'string' && entry.toLowerCase() === dt) return 'immune';
        if (typeof entry === 'string' && entry.toLowerCase() === cleanType) return 'immune';
        if (typeof entry === 'object' && entry !== null && 'immune' in entry) {
          const list = (entry as any).immune;
          if (Array.isArray(list) && list.some((i: string) => i.toLowerCase() === dt))
            return 'immune';
          if (Array.isArray(list) && list.some((i: string) => i.toLowerCase() === cleanType))
            return 'immune';
        }
      }
    }

    if (monster.resist) {
      for (const entry of monster.resist) {
        if (typeof entry === 'string' && entry.toLowerCase() === dt) return 'resist';
        if (typeof entry === 'string' && entry.toLowerCase() === cleanType) return 'resist';
        if (typeof entry === 'object' && entry !== null && 'resist' in entry) {
          const list = (entry as any).resist;
          if (Array.isArray(list) && list.some((r: string) => r.toLowerCase() === dt))
            return 'resist';
          if (Array.isArray(list) && list.some((r: string) => r.toLowerCase() === cleanType))
            return 'resist';
        }
      }
    }

    if (monster.vulnerable) {
      for (const entry of monster.vulnerable) {
        if (typeof entry === 'string' && entry.toLowerCase() === dt) return 'vulnerable';
        if (typeof entry === 'string' && entry.toLowerCase() === cleanType) return 'vulnerable';
      }
    }

    return 'normal';
  }

  /**
   * Roll damage for a given expression.
   */
  rollDamage(expression: string): number {
    return this.roller.parseDamageExpression(expression);
  }

  /**
   * Check if an opponent triggers an opportunity attack when this combatant moves.
   * Triggers when a creature leaves an opponent's reach (typically 5ft melee).
   */
  canOpportunityAttack(combatant: SimulatorCombatant, opponent: SimulatorCombatant): boolean {
    if (combatant.team === opponent.team) return false;
    if (combatant.currentHp <= 0 || opponent.currentHp <= 0) return false;
    if (!combatant.isConscious || !opponent.isConscious) return false;
    if (opponent.reactionUsed) return false;
    if (combatant.disengage) return false;
    const reach = opponent.profile?.attacks?.some(a => a.isMelee && a.reach >= 5);
    if (!reach) return false;
    const distance = combatant.position.distanceTo(opponent.position);
    if (distance > (opponent.profile?.attacks?.find(a => a.isMelee)?.reach ?? 5)) return false;
    if (
      opponent.hasCondition('incapacitated') ||
      opponent.hasCondition('paralyzed') ||
      opponent.hasCondition('restrained') ||
      opponent.hasCondition('grappled')
    ) {
      return false;
    }
    return true;
  }

  /**
   * Resolve an opportunity attack when a combatant leaves an opponent's reach.
   */
  resolveOpportunityAttack(
    attacker: SimulatorCombatant,
    target: SimulatorCombatant,
    _moveFrom: any,
    _moveTo: any
  ): OpportunityAttackResult {
    if (!this.canOpportunityAttack(target, attacker)) {
      return {
        triggered: false,
        isHit: false,
        finalDamage: 0,
        combatantName: attacker.getName(),
        targetName: target.getName(),
      };
    }

    const meleeAttack = attacker.profile?.attacks.find(a => a.isMelee);
    if (!meleeAttack) {
      return {
        triggered: false,
        isHit: false,
        finalDamage: 0,
        combatantName: attacker.getName(),
        targetName: target.getName(),
      };
    }

    const attackRoll = this.roller.rollD20(meleeAttack.attackBonus);
    const targetAC = target.getAc();
    const isHit = attackRoll >= targetAC;
    const isCrit = attackRoll === 20;

    let finalDamage = 0;
    if (isHit) {
      const rollResult = this.roller.parseDamageExpressionDetailed(
        meleeAttack.damageExpression,
        isCrit
      );
      finalDamage = rollResult.total;
      target.takeDamage(finalDamage);
      attacker.totalDamageDealt += finalDamage;
      attacker.reactionUsed = true;
    }

    if (!isHit) {
      attacker.missCount++;
    } else if (isCrit) {
      attacker.critCount++;
    } else {
      attacker.hitCount++;
    }

    return {
      triggered: true,
      isHit,
      finalDamage,
      combatantName: attacker.getName(),
      targetName: target.getName(),
    };
  }

  /**
   * Check if movement triggers opportunity attacks.
   */
  checkOpportunityAttacks(
    movingCombatant: SimulatorCombatant,
    fromPos: any,
    toPos: any,
    allCombatants: SimulatorCombatant[],
    _map: any
  ): OpportunityAttackResult[] {
    const results: OpportunityAttackResult[] = [];
    const enemies = allCombatants.filter(
      c => c.team !== movingCombatant.team && c.currentHp > 0 && c.isConscious
    );

    for (const enemy of enemies) {
      if (this.canOpportunityAttack(movingCombatant, enemy)) {
        const reach = enemy.profile?.attacks?.find(a => a.isMelee)?.reach || 5;
        const distStart = fromPos.distanceTo(enemy.position);
        const distEnd = toPos.distanceTo(enemy.position);
        if (distStart <= reach && distEnd > reach) {
          const result = this.resolveOpportunityAttack(enemy, movingCombatant, fromPos, toPos);
          results.push(result);
          if (result.triggered) break;
        }
      }
    }
    return results;
  }

  /**
   * Resolve hit dice healing for a combatant out of combat.
   * Each hit die rolled = dice roll + CON mod.
   */
  resolveHitDiceHealing(combatant: SimulatorCombatant, hitDiceToSpend: number): HitDiceHealResult {
    const conMod = this.getAbilityModifier(combatant.monster, 'con');
    const hitDieSize = this.getHitDieSize(combatant.monster);
    const maxHitDice = this.getMaxHitDice(combatant.monster);

    let hitDiceRolled = 0;
    let totalHealed = 0;

    for (let i = 0; i < Math.min(hitDiceToSpend, maxHitDice); i++) {
      const hitDieMap: Record<number, DiceType> = {
        4: 'd4',
        6: 'd6',
        8: 'd8',
        10: 'd10',
        12: 'd12',
        20: 'd20',
        100: 'd100',
      };
      const hitDieType = hitDieMap[hitDieSize] ?? 'd6';
      const roll = this.roller.rollSingleDie(hitDieType);
      const healAmount = roll + conMod;
      if (healAmount > 0) {
        combatant.currentHp = Math.min(combatant.getMaxHp(), combatant.currentHp + healAmount);
        totalHealed += healAmount;
        hitDiceRolled++;
      }
    }

    return {
      hitDiceRolled,
      conMod,
      totalHealed,
      currentHp: combatant.currentHp,
      hitDiceRemaining: maxHitDice - hitDiceRolled,
    };
  }

  private getHitDieSize(monster: any): number {
    if (monster.hitDie && typeof monster.hitDie === 'number') return monster.hitDie;
    const cr = this.getCRValue(monster.cr);
    if (cr <= 5) return 8;
    if (cr <= 10) return 10;
    return 12;
  }

  private getMaxHitDice(monster: any): number {
    if (monster.hitDice && typeof monster.hitDice === 'number') return monster.hitDice;
    const cr = this.getCRValue(monster.cr);
    return Math.ceil(cr * 2 + 2);
  }

  private getCRValue(cr: any): number {
    if (typeof cr === 'number') return cr;
    if (typeof cr === 'string' && cr.includes('/')) {
      const parts = cr.split('/');
      return parseInt(parts[0] || '0', 10) / parseInt(parts[1] || '1', 10);
    }
    return parseInt(cr || '1', 10) || 1;
  }

  /**
   * Determine if combatant is alive and conscious.
   */
  isAlive(combatant: SimulatorCombatant): boolean {
    return combatant.currentHp > 0 && combatant.isConscious;
  }

  /**
   * Check if combatant is unconscious (hp <= 0).
   */
  isUnconscious(combatant: SimulatorCombatant): boolean {
    return combatant.currentHp <= 0;
  }
}
