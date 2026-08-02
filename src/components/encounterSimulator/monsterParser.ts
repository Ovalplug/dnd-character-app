/**
 * Monster Ability Parser (OOP)
 * Extracts spell references, legendary actions, lair actions, and mythic actions
 * from monster stat block JSON text entries.
 */

import type { Monster, Entry } from '../../types';
import type { ParsedAbility } from './emulatorTyping';

/**
 * Parses monster abilities from text entries.
 */
export class MonsterParser {
  private spellNames: Set<string>;

  constructor(spellNames: Set<string> = new Set()) {
    this.spellNames = spellNames;
  }

  /**
   * Initialize spell name set for validation.
   * Pass all known spell names from dataStore to validate references.
   */
  setSpellNames(names: string[]): void {
    this.spellNames = new Set(names.map(n => n.toLowerCase()));
  }

  /**
   * Parse all abilities from a monster stat block.
   */
  parseMonsterActions(monster: Monster): ParsedAbility[] {
    const abilities: ParsedAbility[] = [];

    if (monster.action) {
      abilities.push(...this.parseEntries(monster.action, 'action'));
    }
    if (monster.legendary) {
      abilities.push(...this.parseEntries(monster.legendary, 'legendary'));
    }
    if (monster.reaction) {
      abilities.push(...this.parseEntries(monster.reaction, 'reaction'));
    }
    if (monster.lairActions) {
      abilities.push(...this.parseEntries(monster.lairActions, 'lair'));
    }
    if (monster.mythic) {
      abilities.push(...this.parseEntries(monster.mythic, 'mythic'));
    }

    return abilities;
  }

  /**
   * Parse an array of entries (from action/legendary/etc. fields).
   */
  private parseEntries(
    entries: Entry[],
    type: 'action' | 'legendary' | 'reaction' | 'lair' | 'mythic'
  ): ParsedAbility[] {
    const abilities: ParsedAbility[] = [];

    for (const entry of entries) {
      if (typeof entry === 'string') {
        continue; // Skip plain strings
      }

      if (typeof entry === 'object' && entry !== null && 'name' in entry) {
        const ability = this.parseAbilityEntry(entry as any, type);
        if (ability) {
          abilities.push(ability);
        }
      }
    }

    return abilities;
  }

  /**
   * Parse a single ability entry object.
   */
  private parseAbilityEntry(
    entry: any,
    type: 'action' | 'legendary' | 'reaction' | 'lair' | 'mythic'
  ): ParsedAbility | null {
    const name = entry.name || '';
    if (!name) return null;

    const entries = this.flattenEntries(entry.entries || []);
    const costDescription = this.extractCost(entries);
    const dc = this.extractDC(entries);
    const spellReference = this.detectSpellReference(entries);
    const requiresConcentration = this.detectConcentration(entries);
    const rechargeRoll = this.extractRecharge(name + ' ' + entries.join(' '));

    return {
      name,
      type,
      costDescription,
      entries,
      spellReference,
      dc,
      requiresConcentration,
      rechargeRoll,
    };
  }

  /**
   * Flatten nested entries into simple string array.
   */
  private flattenEntries(entries: any[]): string[] {
    const result: string[] = [];
    for (const entry of entries) {
      if (typeof entry === 'string') {
        result.push(entry);
      } else if (typeof entry === 'object' && entry !== null) {
        if ('entries' in entry && Array.isArray(entry.entries)) {
          result.push(...this.flattenEntries(entry.entries));
        } else if ('items' in entry && Array.isArray(entry.items)) {
          result.push(...this.flattenEntries(entry.items));
        }
      }
    }
    return result;
  }

  /**
   * Extract cost description (e.g., "Costs 2 Legendary Actions").
   */
  private extractCost(entries: string[]): string {
    const text = entries.join(' ');
    const costMatch = text.match(/Costs? (\d+) (?:legendary|mythic) actions?/i);
    return costMatch ? costMatch[0] : '';
  }

  /**
   * Extract DC from ability text (e.g., "DC 16").
   */
  private extractDC(entries: string[]): number | undefined {
    const text = entries.join(' ');
    const dcMatch = text.match(/DC (\d+)/i);
    return dcMatch ? parseInt(dcMatch[1] ?? '0', 10) : undefined;
  }

  /**
   * Detect if ability requires concentration.
   */
  private detectConcentration(entries: string[]): boolean {
    const text = entries.join(' ').toLowerCase();
    return /concentration/i.test(text);
  }

  /**
   * Extract recharge pattern (e.g., "Recharge 5–6").
   */
  private extractRecharge(text: string): string | undefined {
    const rechargeMatch = text.match(/Recharge (\d+(?:–\d+)?)/i);
    return rechargeMatch ? rechargeMatch[1] : undefined;
  }

  /**
   * Detect spell references by matching spell names.
   */
  private detectSpellReference(entries: string[]): string | undefined {
    const text = entries.join(' ');

    // Common spell names that might appear
    const commonSpells = [
      'Fireball',
      'Magic Missile',
      'Hold Person',
      'Cone of Cold',
      'Chain Lightning',
      'Lightning Bolt',
      'Meteor Storm',
      'Fly',
      'Invisibility',
      'Teleport',
      'Charm Person',
      'Sleep',
      'Web',
      'Stinking Cloud',
      'Fog Cloud',
      'Dimension Door',
      'Mirror Image',
      'Polymorph',
      'Disintegrate',
    ];

    for (const spell of commonSpells) {
      if (new RegExp(`\\b${spell}\\b`, 'i').test(text)) {
        return spell;
      }
    }

    // Also check against spell name set if provided
    for (const spellName of this.spellNames) {
      if (new RegExp(`\\b${spellName}\\b`, 'i').test(text)) {
        return spellName;
      }
    }

    return undefined;
  }

  /**
   * Get all spells mentioned in a monster's abilities.
   */
  getMonsterSpells(monster: Monster): string[] {
    const abilities = this.parseMonsterActions(monster);
    const spells = new Set<string>();

    // From parsed abilities
    for (const ability of abilities) {
      if (ability.spellReference) {
        spells.add(ability.spellReference);
      }
    }

    // From spellcasting field
    if (monster.spellcasting && Array.isArray(monster.spellcasting)) {
      for (const sc of monster.spellcasting) {
        if (sc.spells) {
          for (let level = 0; level <= 9; level++) {
            const key = level as keyof typeof sc.spells;
            if (sc.spells[key]?.spells) {
              for (const spell of sc.spells[key].spells) {
                spells.add(spell);
              }
            }
          }
        }
        if (sc.will) {
          for (const spell of sc.will) {
            spells.add(spell);
          }
        }
        if (sc.daily) {
          for (const [_, spellList] of Object.entries(sc.daily)) {
            if (Array.isArray(spellList)) {
              for (const spell of spellList) {
                spells.add(spell);
              }
            }
          }
        }
      }
    }

    return Array.from(spells);
  }
}
