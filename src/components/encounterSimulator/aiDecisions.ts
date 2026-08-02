/**
 * AI Decision-Making System (OOP)
 * Role-based scoring and action selection for combatants.
 */

import type { PRNG } from './diceRollFunctions';
import type {
  SimulatorCombatant,
  SimulationState,
  ActionCandidate,
} from './emulatorTyping';
import type { ROLE_DEFINITIONS } from './emulatorTyping';
import { MovementResolver } from './movement';

/**
 * Scoring factors for action evaluation.
 */
export interface ScoringFactors {
  damageWeight: number;
  healingWeight: number;
  survivalWeight: number;
  controlWeight: number;
  supportWeight: number;
}

/**
 * Threat assessment of a combatant.
 */
export interface ThreatAssessment {
  combatantName: string;
  threatLevel: number; // 0-100
  distanceToAlly: number;
  damageOutput: number;
  isEliminated: boolean;
}

/**
 * AI decision maker using role-based weighting.
 */
export class AIDecisionMaker {
  private rng: PRNG;
  private movementResolver: MovementResolver;

  constructor(rng: PRNG) {
    this.rng = rng;
    this.movementResolver = new MovementResolver(rng);
  }

  /**
   * Select an action from candidates using role-based scoring.
   */
  selectAction(
    combatant: SimulatorCombatant,
    candidates: ActionCandidate[],
    state: SimulationState,
    roleWeights: typeof ROLE_DEFINITIONS[keyof typeof ROLE_DEFINITIONS]
  ): ActionCandidate | null {
    if (candidates.length === 0) return null;

    // Score each candidate
    const scored = candidates.map(candidate => ({
      candidate,
      score: this.scoreAction(candidate, combatant, state, roleWeights),
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Select highest scoring action with some randomness
    const topScore = scored[0]?.score ?? 0;
    const topCandidates = scored.filter(s => s.score >= topScore * 0.9); // Within 10% of best

    if (topCandidates.length === 0) return null;

    const selected = topCandidates[Math.floor(this.rng() * topCandidates.length)];
    return selected ? selected.candidate : null;
  }

  /**
   * Score a single action candidate.
   */
  scoreAction(
    candidate: ActionCandidate,
    combatant: SimulatorCombatant,
    state: SimulationState,
    roleWeights: typeof ROLE_DEFINITIONS[keyof typeof ROLE_DEFINITIONS]
  ): number {
    let score = roleWeights.actionWeights[candidate.type] || 0;

    // Bonus for damage actions
    if (candidate.expectedDamage && candidate.expectedDamage > 0) {
      score += candidate.expectedDamage * 0.5;
    }

    // Bonus for healing actions
    if (candidate.expectedHealing && candidate.expectedHealing > 0) {
      score += candidate.expectedHealing * 1.0;
    }

    // Target-based scoring
    if (candidate.targetIndex !== undefined) {
      const target = state.combatants[candidate.targetIndex];
      if (target) {
        const targetScore = this.scoreTarget(target, combatant, state, roleWeights);
        score += targetScore;
      }
    }

    // Resource cost penalty
    if (candidate.resourceCost) {
      if (candidate.resourceCost.spellSlot) {
        // Penalty for using spell slots when low
        const available = combatant.spellSlots[candidate.resourceCost.spellSlot];
        if (available && available.used >= available.max - 1) {
          score *= 0.5;
        }
      }
    }

    return Math.max(0, score);
  }

  /**
   * Score a potential target.
   */
  private scoreTarget(
    target: SimulatorCombatant,
    attacker: SimulatorCombatant,
    state: SimulationState,
    roleWeights: typeof ROLE_DEFINITIONS[keyof typeof ROLE_DEFINITIONS]
  ): number {
    let score = 0;

    // Skip if same team or already dead
    if (target.team === attacker.team || target.currentHp <= 0) return -1000;

    // Ability-specific priorities
    for (const [priority, weight] of Object.entries(roleWeights.targetPriorities)) {
      if (priority === 'nearest_to_ally') {
        const distToAlly = this.distanceToNearestAlly(target, attacker, state);
        score += (100 - distToAlly) * (weight / 100);
      } else if (priority === 'damage_output') {
        const damage = this.estimateDamageOutput(target);
        score += damage * (weight / 100);
      } else if (priority === 'ally_low_hp') {
        const lowHpAllies = state
          .getTeam(attacker.team)
          .filter(c => c.currentHp < c.getMaxHp() * 0.5);
        if (lowHpAllies.length > 0) {
          score += weight;
        }
      } else if (priority === 'ally_in_danger') {
        const endangeredAllies = state
          .getTeam(attacker.team)
          .filter(c => c.currentHp < c.getMaxHp() * 0.3);
        if (endangeredAllies.length > 0) {
          score += weight;
        }
      } else if (priority === 'boss') {
        if (target.role.includes('Boss')) {
          score += weight;
        }
      } else if (priority === 'highest_damage') {
        const damage = this.estimateDamageOutput(target);
        const teamDamages = state.combatants
          .filter(c => c.team !== attacker.team)
          .map(c => this.estimateDamageOutput(c));
        const maxDamage = Math.max(...teamDamages);
        if (damage >= maxDamage * 0.9) {
          score += weight;
        }
      } else if (priority === 'weak') {
        if (target.currentHp < target.getMaxHp() * 0.5) {
          score += weight;
        }
      } else if (priority === 'weakest') {
        const teamMembers = state.combatants.filter(c => c.team !== attacker.team);
        const weakest = teamMembers.reduce((a, b) =>
          a.currentHp < b.currentHp ? a : b
        );
        if (target === weakest) {
          score += weight;
        }
      } else if (priority === 'threatening_all') {
        // High damage output to entire team
        const allyCount = state.getTeam(attacker.team).length;
        const damage = this.estimateDamageOutput(target);
        score += (damage * allyCount) * (weight / 100);
      } else if (priority === 'escape_route') {
        // For cowards: prioritize moving away
        score -= weight * 2; // Negative for targets
      } else if (priority === 'isolated') {
        const nearbyEnemies = state.combatants.filter(
          c => c.team !== target.team && this.movementResolver.distance(c.position, target.position) <= 2
        );
        if (nearbyEnemies.length <= 1) {
          score += weight;
        }
      } else if (priority === 'flanked') {
        // Target has enemies on multiple sides
        const enemies = state.combatants.filter(c => c.team !== target.team);
        let flankedCount = 0;
        for (let angle = 0; angle < 360; angle += 90) {
          const hasEnemy = enemies.some(e => {
            const dx = e.position.x - target.position.x;
            const dy = e.position.y - target.position.y;
            return Math.abs(dx) > 0 && Math.abs(dy) > 0;
          });
          if (hasEnemy) flankedCount++;
        }
        if (flankedCount >= 2) score += weight;
      } else if (priority === 'low_ac') {
        if (target.getAc() < 14) {
          score += weight;
        }
      }
    }

    return score;
  }

  /**
   * Evaluate all potential targets and return threat assessment.
   */
  assessThreats(
    defender: SimulatorCombatant,
    state: SimulationState
  ): ThreatAssessment[] {
    const enemies = state.combatants.filter(c => c.team !== defender.team);
    const assessments: ThreatAssessment[] = [];

    for (const enemy of enemies) {
      const threatLevel = this.calculateThreatLevel(enemy, defender, state);
      const distance = this.movementResolver.distance(enemy.position, defender.position);
      const damage = this.estimateDamageOutput(enemy);

      assessments.push({
        combatantName: enemy.getName(),
        threatLevel,
        distanceToAlly: distance,
        damageOutput: damage,
        isEliminated: enemy.currentHp <= 0,
      });
    }

    return assessments.sort((a, b) => b.threatLevel - a.threatLevel);
  }

  /**
   * Calculate overall threat level (0-100).
   */
  private calculateThreatLevel(
    enemy: SimulatorCombatant,
    defender: SimulatorCombatant,
    _state: SimulationState
  ): number {
    if (enemy.currentHp <= 0) return 0;

    let threat = 0;

    // Health percentage
    const hpPercent = enemy.currentHp / enemy.getMaxHp();
    threat += hpPercent * 30;

    // Distance to defender
    const distance = this.movementResolver.distance(enemy.position, defender.position);
    threat += Math.max(0, 20 - distance * 2);

    // Damage capability
    const damage = this.estimateDamageOutput(enemy);
    threat += Math.min(30, damage / 10);

    // Role multiplier
    if (enemy.role.includes('Boss')) threat *= 1.5;
    if (enemy.role.includes('DamagDealer')) threat *= 1.2;

    return Math.min(100, threat);
  }

  /**
   * Estimate damage output based on monster stats.
   */
  private estimateDamageOutput(combatant: SimulatorCombatant): number {
    const monster = combatant.monster;

    // Base damage from hit dice
    let damage = 5;
    if (monster.hp && typeof monster.hp === 'object' && monster.hp.average) {
      damage = Math.floor(monster.hp.average / 10);
    }

    // Add ability modifier
    const strMod = Math.floor((monster.str - 10) / 2);
    damage += Math.max(0, strMod);

    // Adjustment for spellcasting
    if (monster.spellcasting) {
      damage += 5;
    }

    return Math.max(1, damage);
  }

  /**
   * Distance to nearest ally.
   */
  private distanceToNearestAlly(
    target: SimulatorCombatant,
    _attacker: SimulatorCombatant,
    state: SimulationState
  ): number {
    const allies = state.getTeam(target.team).filter(c => c.currentHp > 0);
    if (allies.length === 0) return 999;

    let minDistance = 999;
    for (const ally of allies) {
      const distance = this.movementResolver.distance(target.position, ally.position);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  /**
   * Evaluate positioning: should combatant move closer, stay, or retreat?
   */
  evaluatePosition(
    combatant: SimulatorCombatant,
    target: SimulatorCombatant,
    _state: SimulationState,
    roleWeights: typeof ROLE_DEFINITIONS[keyof typeof ROLE_DEFINITIONS]
  ): 'approach' | 'hold' | 'retreat' {
    const distance = this.movementResolver.distance(combatant.position, target.position);
    const combatantHpPercent = combatant.currentHp / combatant.getMaxHp();

    // Coward-like roles retreat when low
    if (roleWeights.resourcePreference === 'save' && combatantHpPercent < 0.4) {
      return 'retreat';
    }

    // Aggressive roles approach
    if (roleWeights.resourcePreference === 'spend' && distance > 2) {
      return 'approach';
    }

    // Default: hold position if in range, approach if not
    return distance > 2 ? 'approach' : 'hold';
  }
}
