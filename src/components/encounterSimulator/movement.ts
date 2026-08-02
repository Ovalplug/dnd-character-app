/**
 * Movement & Tactical System (OOP)
 * Handles pathfinding, line of sight, cover calculations, and movement validation.
 */

import type { PRNG } from './diceRollFunctions';
import type { Position, GameMap, SimulatorCombatant } from './emulatorTyping';

/**
 * Represents cover against an attack.
 */
export const CoverType = {
  None: 0,
  Half: 2,
  ThreeQuarters: 5,
  Total: 999,
} as const;

/**
 * Path node for A* pathfinding.
 */
interface PathNode {
  position: Position;
  gCost: number; // Cost from start
  hCost: number; // Heuristic cost to goal
  parent: PathNode | null;
}

/**
 * Movement path result.
 */
export interface MovePath {
  positions: Position[];
  movementCost: number;
  reachable: boolean;
}

/**
 * Resolves movement and tactical positioning.
 */
export class MovementResolver {
  private diagonalMovement: boolean = true;

  constructor(_rng: PRNG) {
    // PRNG passed for future use in movement calculations
  }

  /**
   * Get all reachable positions from current location with given movement speed.
   */
  getReachablePositions(
    from: Position,
    map: GameMap,
    movementSpeed: number,
    combatants: SimulatorCombatant[] = []
  ): Position[] {
    const reachable: Position[] = [];
    const visited = new Set<string>();

    const queue: { pos: Position; costRemaining: number }[] = [{ pos: from, costRemaining: movementSpeed }];
    visited.add(`${from.x},${from.y}`);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;

      // Check all adjacent positions
      const neighbors = this.getAdjacentPositions(current.pos);
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (visited.has(key)) continue;
        visited.add(key);

        // Check if passable
        if (!this.canMoveTo(neighbor, map, combatants)) continue;

        // Get movement cost for this cell
        const cell = map.getCell(neighbor);
        const moveCost = cell ? cell.getMovementCost() : 1;

        if (current.costRemaining >= moveCost) {
          reachable.push(neighbor);
          if (current.costRemaining - moveCost > 0) {
            queue.push({
              pos: neighbor,
              costRemaining: current.costRemaining - moveCost,
            });
          }
        }
      }
    }

    return reachable;
  }

  /**
   * Check if a position is passable (not a wall, not occupied by enemy).
   */
  canMoveTo(
    position: Position,
    map: GameMap,
    combatants: SimulatorCombatant[] = [],
    allowEnemies: boolean = false
  ): boolean {
    // Check map bounds
    if (!map.isInBounds(position)) return false;

    // Check cell type
    const cell = map.getCell(position);
    if (cell && !cell.isPassable()) return false;

    // Check occupancy
    const occupied = combatants.some(c => c.position.equals(position));
    if (occupied && !allowEnemies) return false;

    return true;
  }

  /**
   * Find shortest path using A* algorithm.
   */
  findPath(
    from: Position,
    to: Position,
    map: GameMap,
    combatants: SimulatorCombatant[] = []
  ): MovePath {
    if (!map.isInBounds(to)) {
      return { positions: [], movementCost: 0, reachable: false };
    }

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    const startNode: PathNode = {
      position: from,
      gCost: 0,
      hCost: this.heuristic(from, to),
      parent: null,
    };

    openSet.push(startNode);
    const startKey = `${from.x},${from.y}`;
    gScore.set(startKey, 0);
    fScore.set(startKey, startNode.hCost);

    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current: PathNode | null = openSet[0] ?? null;
      let currentIndex = 0;
      
      if (!current) break;
      
      for (let i = 1; i < openSet.length; i++) {
        const openNode = openSet[i];
        if (!openNode) continue;
        const currentF = fScore.get(`${openNode.position.x},${openNode.position.y}`) || Infinity;
        const lowestF = fScore.get(`${current.position.x},${current.position.y}`) || Infinity;
        if (currentF < lowestF) {
          current = openNode;
          currentIndex = i;
        }
      }

      if (!current) break;
      
      if (current.position.equals(to)) {
        // Reconstruct path
        const path: Position[] = [];
        let node: PathNode | null = current;
        while (node) {
          path.unshift(node.position);
          node = node.parent;
        }
        return {
          positions: path.slice(1), // Exclude start position
          movementCost: current.gCost,
          reachable: true,
        };
      }

      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.position.x},${current.position.y}`);

      // Check neighbors
      for (const neighbor of this.getAdjacentPositions(current.position)) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(neighborKey)) continue;
        if (!this.canMoveTo(neighbor, map, combatants)) continue;

        const cell = map.getCell(neighbor);
        const moveCost = cell ? cell.getMovementCost() : 1;
        const tentativeGScore = current!.gCost + moveCost;

        const existingGScore = gScore.get(neighborKey) ?? Infinity;
        if (tentativeGScore >= existingGScore) continue;

        // This path is better
        const neighborNode: PathNode = {
          position: neighbor,
          gCost: tentativeGScore,
          hCost: this.heuristic(neighbor, to),
          parent: current,
        };

        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + neighborNode.hCost);

        const existingNode = openSet.find(n => n && n.position.equals(neighbor));
        if (!existingNode) {
          openSet.push(neighborNode);
        }
      }
    }

    // No path found
    return { positions: [], movementCost: 0, reachable: false };
  }

  /**
   * Calculate line of sight between two positions.
   * Uses Bresenham's line algorithm.
   */
  hasLineOfSight(
    from: Position,
    to: Position,
    map: GameMap,
    maxDistance?: number
  ): boolean {
    const line = this.bresenhamLine(from, to);

    // Check max distance
    if (maxDistance && line.length > maxDistance) return false;

    // Check all cells in line for obstructions
    for (const pos of line) {
      if (pos.equals(from) || pos.equals(to)) continue; // Skip start and end

      const cell = map.getCell(pos);
      if (cell && !cell.isPassable()) return false;
    }

    return true;
  }

  /**
   * Determine cover between attacker and target.
   */
  getCover(
    attacker: Position,
    target: Position,
    map: GameMap
  ): typeof CoverType[keyof typeof CoverType] {
    const line = this.bresenhamLine(attacker, target);

    let coverCount = 0;
    for (const pos of line) {
      if (pos.equals(attacker) || pos.equals(target)) continue;

      const cell = map.getCell(pos);
      if (cell && !cell.isPassable()) {
        coverCount++;
      }
    }

    // Convert obstruction count to cover type
    if (coverCount === 0) return CoverType.None;
    if (coverCount === 1) return CoverType.Half;
    if (coverCount === 2) return CoverType.ThreeQuarters;
    return CoverType.Total;
  }

  /**
   * Calculate distance between two positions (Chebyshev distance for grid).
   */
  distance(from: Position, to: Position): number {
    return Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y));
  }

  /**
   * Get adjacent positions (up to 8 neighbors).
   */
  private getAdjacentPositions(pos: Position): Position[] {
    const neighbors: Position[] = [];

    // Cardinal directions
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue; // Skip self

        // Skip diagonals if not enabled
        if (!this.diagonalMovement && Math.abs(dx) === 1 && Math.abs(dy) === 1) continue;

        neighbors.push(new (pos.constructor as any)(pos.x + dx, pos.y + dy));
      }
    }

    return neighbors;
  }

  /**
   * Heuristic for A* pathfinding (Chebyshev distance).
   */
  private heuristic(from: Position, to: Position): number {
    return Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y));
  }

  /**
   * Generate line of positions using Bresenham's algorithm.
   */
  private bresenhamLine(from: Position, to: Position): Position[] {
    const points: Position[] = [];
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1;
    const sy = from.y < to.y ? 1 : -1;

    let x = from.x;
    let y = from.y;
    let err = (dx > dy ? dx : -dy) / 2;

    while (true) {
      points.push(new (from.constructor as any)(x, y));

      if (x === to.x && y === to.y) break;

      const e2 = err;
      if (e2 > -dx) {
        err -= dy;
        x += sx;
      }
      if (e2 < dy) {
        err += dx;
        y += sy;
      }
    }

    return points;
  }
}
