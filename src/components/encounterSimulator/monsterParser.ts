/**
 * Monster Ability Parser (OOP)
 * Extracts spell references, legendary actions, lair actions, and mythic actions
 * from monster stat block JSON text entries.
 */

import type { Monster, Entry, MonsterCR } from '../../types';
import type { ParsedAbility, ParsedAttack, ParsedMonsterProfile } from './emulatorTyping';

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

  /**
   * Parse a full combat profile from a monster stat block:
   * real attack bonus, damage expressions, multiattack count, and proficiency bonus.
   */
  parseMonsterProfile(monster: Monster): ParsedMonsterProfile {
    const attacks: ParsedAttack[] = [];
    let multiattackCount = 1;
    let hasMultiattack = false;
    let multiattackSequence: Array<{ attackName: string; count: number }> | undefined;

    const numberWords = new Set([
      'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    ]);

    if (monster.action) {
      for (const entry of monster.action) {
        if (typeof entry !== 'object' || !entry || !('name' in entry)) continue;
        const e = entry as any;
        const name: string = e.name || '';
        const text = this.flattenEntries(e.entries || []).join(' ');

        if (/^multiattack$/i.test(name)) {
          hasMultiattack = true;

          // Parse named attack sequence: "one Bite attack and two Claw attacks"
          const seqPattern = /(\w+)\s+(\w+)\s+attacks?/gi;
          const seqMatches = [...text.matchAll(seqPattern)].filter(
            m => numberWords.has((m[1] ?? '').toLowerCase()) || /^\d+$/.test(m[1] ?? '')
          );

          if (seqMatches.length > 0) {
            multiattackSequence = [];
            let total = 0;
            for (const m of seqMatches) {
              const countWord = m[1] ?? '1';
              const attackName = m[2] ?? '';
              const count = isNaN(Number(countWord))
                ? this.wordToNumber(countWord)
                : parseInt(countWord, 10);
              multiattackSequence.push({ attackName, count });
              total += count;
            }
            multiattackCount = total;
          } else {
            // Fallback: simple total count
            const countMatch = text.match(
              /makes?\s+(?:up\s+to\s+)?(\w+|\d+)\s+(?:\w+\s+)?attacks?/i
            );
            if (countMatch) {
              const word = countMatch[1] ?? '2';
              multiattackCount = isNaN(Number(word))
                ? this.wordToNumber(word)
                : parseInt(word, 10);
            } else {
              multiattackCount = 2;
            }
          }
          continue;
        }

        const attack = this.parseAttackFromText(name, text);
        if (attack) attacks.push(attack);
      }
    }

    return {
      attacks,
      multiattackCount,
      hasMultiattack,
      multiattackSequence,
      proficiencyBonus: MonsterParser.getProficiencyBonus(monster.cr),
      isLegendary: !!(monster.legendary && monster.legendary.length > 0),
    };
  }

  private parseAttackFromText(name: string, text: string): ParsedAttack | null {
    // Match "Melee Weapon Attack: +11 to hit" / "Ranged Spell Attack: +6 to hit"
    const attackTypeMatch = text.match(
      /(melee\s+or\s+ranged|melee|ranged)\s+(?:weapon|spell)\s+attack:\s*([+-]\d+)\s+to\s+hit/i
    );
    if (!attackTypeMatch) return null;

    const typeStr = (attackTypeMatch[1] ?? '').toLowerCase();
    const isMelee = typeStr.includes('melee');
    const isRanged = typeStr.includes('ranged');
    const attackBonus = parseInt(attackTypeMatch[2] ?? '0', 10);

    const reachMatch = text.match(/reach\s+(\d+)\s*ft/i);
    const reach = reachMatch ? parseInt(reachMatch[1] ?? '5', 10) : 5;

    const rangeMatch = text.match(/range\s+(\d+\/?(\d*))\s*ft/i);
    const range = rangeMatch ? rangeMatch[1] : undefined;

    // Collect all damage groups from the entry.
    // Handle two formats:
    //   1. 5etools tags:  {@damage 2d10+5} or {@dice 1d6}
    //   2. Plain text:    "16 (2d10 + 5) piercing damage" (with or without "Hit:" prefix)
    const damageGroups: Array<{ expr: string; type: string }> = [];

    // Format 1: {@damage ...} inline tags
    const tagPattern = /\{@(?:damage|dice)\s+([^}]+)\}/gi;
    let tagMatch: RegExpExecArray | null;
    while ((tagMatch = tagPattern.exec(text)) !== null) {
      const afterTag = text.slice(tagMatch.index + tagMatch[0].length);
      const typeMatch = afterTag.match(/^[^a-zA-Z]*([a-zA-Z]+)\s+damage/i);
      if (typeMatch) {
        damageGroups.push({
          expr: (tagMatch[1] ?? '1d6').trim().replace(/\s+/g, ''),
          type: typeMatch[1]?.toLowerCase() ?? 'bludgeoning',
        });
      }
    }

    // Format 2: "N (XdY + Z) type damage" — no Hit: prefix required
    if (damageGroups.length === 0) {
      const plainPattern = /\d+\s*\(\s*([^)]+?)\s*\)\s*(\w+)\s*damage/gi;
      let plainMatch: RegExpExecArray | null;
      while ((plainMatch = plainPattern.exec(text)) !== null) {
        damageGroups.push({
          expr: (plainMatch[1] ?? '1d6').trim().replace(/\s+/g, ''),
          type: (plainMatch[2] ?? 'bludgeoning').toLowerCase(),
        });
      }
    }

    if (damageGroups.length === 0) return null;

    // Combine all expressions (e.g. "2d10+5" + "2d6" → "2d10+5+2d6").
    // Use the primary (first) damage type as the attack's type.
    const damageExpression = damageGroups.map(g => g.expr).join('+');
    const damageType = damageGroups[0]?.type ?? 'bludgeoning';

    return { name, attackBonus, damageExpression, damageType, isRanged, isMelee, reach, range };
  }

  private wordToNumber(word: string): number {
    const map: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };
    return map[word.toLowerCase()] ?? 2;
  }

  /**
   * Derive proficiency bonus from a monster's CR.
   */
  static getProficiencyBonus(cr: MonsterCR): number {
    const crStr = typeof cr === 'string' ? cr : cr.cr;
    let crValue: number;
    if (crStr.includes('/')) {
      const parts = crStr.split('/');
      crValue = parseInt(parts[0] ?? '0', 10) / parseInt(parts[1] ?? '1', 10);
    } else {
      crValue = parseFloat(crStr);
    }
    if (isNaN(crValue) || crValue < 5) return 2;
    if (crValue < 9) return 3;
    if (crValue < 13) return 4;
    if (crValue < 17) return 5;
    if (crValue < 21) return 6;
    if (crValue < 25) return 7;
    if (crValue < 29) return 8;
    return 9;
  }
}
