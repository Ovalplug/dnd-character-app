/**
 * AI Decision-Making System (OOP)
 * Role-based scoring and action selection for combatants.
 */

import type { PRNG } from './diceRollFunctions';
import type { SimulatorCombatant, SimulationState, ActionCandidate } from './emulatorTyping';
import type { ROLE_DEFINITIONS } from './emulatorTyping';
import { Position } from './emulatorTyping';
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
    roleWeights: (typeof ROLE_DEFINITIONS)[keyof typeof ROLE_DEFINITIONS]
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
   * Considers: role weights, damage/healing, resource costs, and mode constraints.
   */
  scoreAction(
    candidate: ActionCandidate,
    combatant: SimulatorCombatant,
    state: SimulationState,
    roleWeights: (typeof ROLE_DEFINITIONS)[keyof typeof ROLE_DEFINITIONS]
  ): number {
    let score = roleWeights.actionWeights[candidate.type] || 0;

    // Bonus for damage actions
    if (candidate.expectedDamage && candidate.expectedDamage > 0) {
      score += candidate.expectedDamage * 0.5;
    }

    // Enhanced healing logic with threshold-based scoring
    if (candidate.expectedHealing && candidate.expectedHealing > 0) {
      score += this.scoreHealingAction(candidate, combatant, state, roleWeights);
    }

    // Target-based scoring
    if (candidate.targetIndex !== undefined) {
      const target = state.combatants[candidate.targetIndex];
      if (target) {
        const targetScore = this.scoreTarget(target, combatant, state, roleWeights);
        score += targetScore;
      }
    }

    // Resource cost penalty - scales based on availability
    if (candidate.resourceCost) {
      if (candidate.resourceCost.spellSlot) {
        score = this.applyResourceCostPenalty(score, combatant, candidate.resourceCost.spellSlot);
      }
    }

    return Math.max(0, score);
  }

  /**
   * Score healing actions with HP threshold consideration.
   * Prioritizes healing for allies in worse condition.
   */
  private scoreHealingAction(
    candidate: ActionCandidate,
    combatant: SimulatorCombatant,
    state: SimulationState,
    roleWeights: (typeof ROLE_DEFINITIONS)[keyof typeof ROLE_DEFINITIONS]
  ): number {
    let score = candidate.expectedHealing || 0;

    // Find lowest HP ally to assess urgency
    const team = state.getTeam(combatant.team);
    const lowestHpAlly = team.reduce((a, b) =>
      a.currentHp < b.currentHp ? a : b
    );

    const hpPercent = lowestHpAlly.currentHp / lowestHpAlly.getMaxHp();
    
    // Critical healing urgency (< 25% HP)
    if (hpPercent < 0.25) {
      score *= 2.0;
    } else if (hpPercent < 0.5) {
      // High urgency (25-50% HP)
      score *= 1.5;
    } else if (hpPercent < 0.75) {
      // Moderate urgency (50-75% HP)
      score *= 1.2;
    }

    // Role-based healing priorities
    if (roleWeights.type === 'Healer') {
      score *= 1.3; // Healers prioritize healing more
    } else if (roleWeights.type === 'Support') {
      score *= 1.1; // Support also prioritizes, but less than dedicated healers
    }

    return Math.max(0, score);
  }

  /**
   * Apply resource cost penalty based on resource availability.
   * In Low mode: heavy penalty. In Balanced: proportional. In Max: minimal.
   */
  private applyResourceCostPenalty(
    score: number,
    combatant: SimulatorCombatant,
    spellLevel: number
  ): number {
    const available = combatant.spellSlots[spellLevel];
    if (!available || available.max === 0) return score;

    const slotsUsed = available.used;
    const usagePercent = slotsUsed / available.max;

    // Scale penalty based on resource scarcity
    if (usagePercent >= 0.9) {
      // Critical scarcity (90%+ used)
      return score * 0.3;
    } else if (usagePercent >= 0.7) {
      // High scarcity (70-90% used)
      return score * 0.5;
    } else if (usagePercent >= 0.5) {
      // Moderate scarcity (50-70% used)
      return score * 0.8;
    }

    return score;
  }


  /**
   * Score a potential target.
   */
  private scoreTarget(
    target: SimulatorCombatant,
    attacker: SimulatorCombatant,
    state: SimulationState,
    roleWeights: (typeof ROLE_DEFINITIONS)[keyof typeof ROLE_DEFINITIONS]
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
        const weakest = teamMembers.reduce((a, b) => (a.currentHp < b.currentHp ? a : b));
        if (target === weakest) {
          score += weight;
        }
      } else if (priority === 'threatening_all') {
        // High damage output to entire team
        const allyCount = state.getTeam(attacker.team).length;
        const damage = this.estimateDamageOutput(target);
        score += damage * allyCount * (weight / 100);
      } else if (priority === 'escape_route') {
        // For cowards: prioritize moving away
        score -= weight * 2; // Negative for targets
      } else if (priority === 'isolated') {
        const nearbyEnemies = state.combatants.filter(
          c =>
            c.team !== target.team &&
            this.movementResolver.distance(c.position, target.position) <= 2
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
  assessThreats(defender: SimulatorCombatant, state: SimulationState): ThreatAssessment[] {
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
   * Enhanced with spellcaster threat and concentration assessment.
   */
  private calculateThreatLevel(
    enemy: SimulatorCombatant,
    defender: SimulatorCombatant,
    _state: SimulationState
  ): number {
    if (enemy.currentHp <= 0) return 0;

    let threat = 0;

    // Health percentage (up to 30 points)
    const hpPercent = enemy.currentHp / enemy.getMaxHp();
    threat += hpPercent * 30;

    // Distance to defender (up to 20 points - closer is more threatening)
    const distance = this.movementResolver.distance(enemy.position, defender.position);
    threat += Math.max(0, 20 - distance * 2);

    // Damage capability (up to 30 points)
    const damage = this.estimateDamageOutput(enemy);
    threat += Math.min(30, damage / 10);

    // Spellcaster threat assessment (up to 20 points)
    if (enemy.monster.spellcasting) {
      threat += 20; // Spellcasters are inherently more threatening
      
      // Check if maintaining concentration on dangerous spell
      const concentrationSpells = enemy.conditions.filter(c => c.type === 'concentrating');
      if (concentrationSpells.length > 0) {
        threat += 5; // Additional threat from active concentration
      }
    }

    // Role multiplier
    if (enemy.role.includes('Boss')) threat *= 1.5;
    if (enemy.role.includes('DamageDealer')) threat *= 1.2;
    if (enemy.role.includes('Controller')) threat *= 1.3; // Control effects are dangerous
    if (enemy.role.includes('Healer')) threat *= 1.1; // Enemy healers are moderately threatening

    // Action economy consideration - assume all abilities available if not tracked
    threat *= 1.05; // Small multiplier for action economy

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
    roleWeights: (typeof ROLE_DEFINITIONS)[keyof typeof ROLE_DEFINITIONS]
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

  /**
   * Evaluate AoE spell placement to maximize damage to enemies while minimizing friendly fire.
   * Returns score for placement at given position.
   */
  evaluateAoEPlacement(
    centerPosition: { x: number; y: number },
    radius: number,
    caster: SimulatorCombatant,
    state: SimulationState
  ): number {
    let score = 0;

    // Evaluate all combatants within AoE radius
    for (const combatant of state.combatants) {
      // Create Position object for distance calculation
      const centerPos = new Position(centerPosition.x, centerPosition.y);
      const distance = this.movementResolver.distance(centerPos, combatant.position);
      
      if (distance <= radius) {
        if (combatant.team !== caster.team) {
          // Enemy in AoE: positive score based on threat level
          const threat = this.calculateThreatLevel(combatant, caster, state);
          const hpFactor = combatant.currentHp / combatant.getMaxHp();
          score += threat * hpFactor * 2; // Weight threats and their remaining health
        } else if (combatant !== caster) {
          // Ally in AoE: negative score (friendly fire penalty)
          const allyHpPercent = combatant.currentHp / combatant.getMaxHp();
          score -= allyHpPercent * 30; // Heavy penalty for hitting low-health allies
        }
      }
    }

    return Math.max(0, score);
  }

  /**
   * Find optimal center position for an AoE spell given candidates.
   */
  findBestAoECenter(
    candidates: Array<{ x: number; y: number }>,
    radius: number,
    caster: SimulatorCombatant,
    state: SimulationState
  ): { x: number; y: number } | null {
    if (candidates.length === 0) return null;

    const firstCandidate = candidates[0] as { x: number; y: number };
    let selectedPosition = firstCandidate;
    let bestScore = this.evaluateAoEPlacement(selectedPosition, radius, caster, state);

    for (const candidate of candidates.slice(1)) {
      const score = this.evaluateAoEPlacement(candidate, radius, caster, state);
      if (score > bestScore) {
        bestScore = score;
        selectedPosition = candidate;
      }
    }

    // Only return position if it has positive net score (more enemy damage than friendly fire)
    return bestScore > 0 ? selectedPosition : null;
  }
}
