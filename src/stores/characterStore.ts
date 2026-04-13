import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { db, type Character } from '../database/db';
import type {
  AbilityScoreValues,
  AllProficiencies,
  Background,
  CharClass,
  CharSpeed,
  ClassLevels,
  DiceTypes,
  HitDice,
  Languages,
  playerCharacter,
  PlayerSkills,
  Race,
  Subclass,
  Subrace,
} from '../types';
import {
  calculateAbilityScoreModifier,
  calculatePassivePerception,
  calculateProficiencyBonus,
} from '../helperFunctions';

export const useCharacterStore = defineStore('characters', {
  state: () => ({
    characters: [] as Character[],
    loaded: false,
    currNewCharacter: null as playerCharacter | null,
  }),

  actions: {
    async loadCharacters() {
      this.characters = await db.characters.toArray();
      this.loaded = true;
    },

    /**
     * Start a new character creation process.
     * Initializes currNewCharacter.
     */
    startNewCharacterCreation() {
      this.currNewCharacter = {
        id: uuidv4(),
        name: '',
        level: 1,
        classes: [],
        classLevels: {
          artificer: 0,
          barbarian: 0,
          bard: 0,
          cleric: 0,
          druid: 0,
          fighter: 0,
          monk: 0,
          paladin: 0,
          ranger: 0,
          rogue: 0,
          sorcerer: 0,
          warlock: 0,
          wizard: 0,
        },
        subclasses: {},
        race: null,
        subrace: null,
        background: null,
        alignment: undefined,
        xp: undefined,
        inspiration: undefined,
        feats: [],
        languages: {
          common: { speak: false, read: false, write: false },
          elvish: { speak: false, read: false, write: false },
          dwarvish: { speak: false, read: false, write: false },
          giant: { speak: false, read: false, write: false },
          gnomish: { speak: false, read: false, write: false },
          goblin: { speak: false, read: false, write: false },
          halfling: { speak: false, read: false, write: false },
          orc: { speak: false, read: false, write: false },
          abyssal: { speak: false, read: false, write: false },
          celestial: { speak: false, read: false, write: false },
          draconic: { speak: false, read: false, write: false },
          deepSpeech: { speak: false, read: false, write: false },
          infernal: { speak: false, read: false, write: false },
          primordial: { speak: false, read: false, write: false },
          sylvan: { speak: false, read: false, write: false },
          undercommon: { speak: false, read: false, write: false },
          thievesCant: { speak: false, read: false, write: false },
        },
        abilityScores: {
          str: 10,
          dex: 10,
          con: 10,
          int: 10,
          wis: 10,
          cha: 10,
        },
        proficiencyModifier: 2,
        inventory: [],
        maxHp: 0,
        currHp: 0,
        tempHp: 0,
        ac: 0,
        speed: { base: 30 },
        size: 'medium',
        skillProficiencies: {
          acrobatics: { proficient: false, expertise: false },
          animalHandling: { proficient: false, expertise: false },
          arcana: { proficient: false, expertise: false },
          athletics: { proficient: false, expertise: false },
          deception: { proficient: false, expertise: false },
          history: { proficient: false, expertise: false },
          insight: { proficient: false, expertise: false },
          intimidation: { proficient: false, expertise: false },
          investigation: { proficient: false, expertise: false },
          medicine: { proficient: false, expertise: false },
          nature: { proficient: false, expertise: false },
          perception: { proficient: false, expertise: false },
          performance: { proficient: false, expertise: false },
          persuasion: { proficient: false, expertise: false },
          religion: { proficient: false, expertise: false },
          sleightOfHand: { proficient: false, expertise: false },
          stealth: { proficient: false, expertise: false },
          survival: { proficient: false, expertise: false },
        },
        image: undefined,
        hitDice: [],
        deathSaves: undefined,
        currency: undefined,
        passivePerception: undefined,
        initiativeBonus: 0,
        personalityTraits: [],
        ideals: [],
        bonds: [],
        flaws: [],
        featuresAndTraits: [],
        attacks: [],
        spellcasting: undefined,
        notes: undefined,
        alliesAndOrganizations: [],
        backstory: undefined,
        attunedItems: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    },

    /**
     * Save the current new character to the DB and characters list.
     * Resets currNewCharacter.
     */
    async finalizeCharacterCreation() {
      if (!this.currNewCharacter) return;
      // Deep-clone via JSON round-trip to strip Vue reactive Proxy wrappers,
      // which cannot be serialized by IndexedDB's structured clone algorithm.
      const newChar: Character = JSON.parse(
        JSON.stringify({
          ...this.currNewCharacter,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );
      await db.characters.add(newChar);
      this.characters.push(newChar);
      this.currNewCharacter = null;
      return newChar.id;
    },

    async updateCharacter(character: Character) {
      character.updatedAt = Date.now();
      const serialized: Character = JSON.parse(JSON.stringify(character));
      await db.characters.put(serialized);
      const idx = this.characters.findIndex(c => c.id === character.id);
      if (idx !== -1) this.characters[idx] = serialized;
    },

    async deleteCharacter(id: string) {
      await db.characters.delete(id);
      this.characters = this.characters.filter(c => c.id !== id);
    },

    updateCharacterName(newName: string) {
      if (this.currNewCharacter) {
        this.currNewCharacter.name = newName;
      }
    },

    updateCharacterRace(newRace: Race) {
      if (this.currNewCharacter) {
        this.currNewCharacter.race = newRace;
        this.currNewCharacter.subrace = null;
      }
    },

    updateCharacterSubrace(subrace: Subrace | null) {
      if (this.currNewCharacter) {
        this.currNewCharacter.subrace = subrace;
      }
    },

    updateCharacterBackground(newBackground: Background) {
      if (this.currNewCharacter) {
        this.currNewCharacter.background = newBackground;
      }
    },

    updateCharacterClasses(newClass: CharClass) {
      if (this.currNewCharacter) {
        this.currNewCharacter.classes.push(newClass);
        this.currNewCharacter.classLevels[newClass.name.toLowerCase() as keyof ClassLevels]++;
      }
    },

    updateCharacterSubclasses(className: string, subclass: Subclass) {
      if (this.currNewCharacter) {
        if (!this.currNewCharacter.subclasses) {
          this.currNewCharacter.subclasses = {};
        }
        if (!this.currNewCharacter.subclasses[className]) {
          this.currNewCharacter.subclasses[className] = [];
        }
        this.currNewCharacter.subclasses[className].push(subclass);
      }
    },

    getCharLevel() {
      if (!this.currNewCharacter) return 0;
      return Object.values(this.currNewCharacter.classLevels).reduce((sum, lvl) => sum + lvl, 0);
    },

    getCharClasses() {
      if (!this.currNewCharacter) return [];
      return Object.entries(this.currNewCharacter.classLevels)
        .filter(([_, lvl]) => lvl > 0)
        .map(([className, lvl]) => ({ name: className, level: lvl }));
    },

    getCharFullClasses(): CharClass[] {
      return this.currNewCharacter?.classes || [];
    },

    isRogue() {
      if (!this.currNewCharacter) return false;
      return this.currNewCharacter.classes.some(c => c.name.toLowerCase() === 'rogue');
    },

    getRaceAbilityScoreIncreases() {
      if (!this.currNewCharacter || !this.currNewCharacter.race) return {};
      // return this.currNewCharacter.race.abilityScoreIncreases || {};
      return [];
    },

    setNewCharAbilityScores(abilityScores: AbilityScoreValues) {
      if (this.currNewCharacter) {
        this.currNewCharacter.abilityScores = abilityScores;
      }
    },

    getCharLanguages() {
      if (!this.currNewCharacter) return {};
      return this.currNewCharacter.languages || {};
    },

    updateCharacterLanguages(languages: Languages) {
      if (this.currNewCharacter) {
        this.currNewCharacter.languages = languages;
      }
    },

    getCharRace() {
      return this.currNewCharacter?.race || null;
    },

    getCharBackground() {
      return this.currNewCharacter?.background || null;
    },

    getCharFeats() {
      return this.currNewCharacter?.feats || [];
    },

    updateAllProficiencies(proficiencies: AllProficiencies) {
      if (this.currNewCharacter) {
        this.currNewCharacter.allProficiencies = proficiencies;
        // Also sync skillProficiencies for backwards compat
        this.currNewCharacter.skillProficiencies = proficiencies.skills;
      }
    },

    getStartingHp(character: playerCharacter): number {
      const hd = character.classes[0]?.hd;
      const hdValue = hd ? parseInt(hd.substring(1)) : 8; // Default to d8 if no class or hd found
      const conMod = calculateAbilityScoreModifier(
        character.abilityScores.con,
        character.proficiencyModifier,
        false,
        false
      );
      return hdValue + conMod;
    },

    //this can be positive or negative damage (eg healing)
    // it should never go above max hp or below 0
    async applyDamage(id: string, damage: number) {
      const character = await db.characters.get(id);
      if (!character) return;
      if (damage < 0) {
        // Healing: ignore tempHp, restore currHp without exceeding maxHp
        character.currHp = Math.min(character.currHp - damage, character.maxHp);
      } else {
        // Damage: drain tempHp first, then spill into currHp
        const tempHpDamage = Math.min(character.tempHp, damage);
        character.tempHp -= tempHpDamage;
        const remainingDamage = damage - tempHpDamage;
        character.currHp = Math.max(character.currHp - remainingDamage, 0);
      }
      await this.updateCharacter(character);
    },

    async updateAc(id: string, newAc: number) {
      //eventually this will have functionality to take in items and calculate from that
      //but for now it'll just be to manually set based on input

      //TODO: add functionality to update ac based on equipped items, similar to how hp is calculated from class and con mod
      const character = await db.characters.get(id);
      if (!character) return;
      character.ac = newAc;
      await this.updateCharacter(character);
    },

    async applyTempHp(id: string, tempHp: number) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.tempHp = tempHp;
      await this.updateCharacter(character);
    },

    async toggleInspiration(id: string) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.inspiration = !character.inspiration;
      await this.updateCharacter(character);
    },

    async updateDeathSaves(id: string, successes: number, failures: number) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.deathSaves = { successes, failures };
      await this.updateCharacter(character);
    },

    async updateSpeed(id: string, newSpeed: CharSpeed) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.speed = newSpeed;
      await this.updateCharacter(character);
    },

    async updateSkillProficiencies(id: string, newProficiencies: PlayerSkills) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.skillProficiencies = newProficiencies;
      await this.updateCharacter(character);
    },

    async touchUpCharacter(id: string) {
      // this function can be used at any time to recalculate and update any derived fields on the character, such as proficiency bonus or passive perception, based on their current state. This is useful to ensure all fields are up-to-date before saving or displaying the character.
      const character = await db.characters.get(id);
      if (!character) return;

      // Recalculate proficiency bonus based on level
      const level = Object.values(character.classLevels).reduce((sum, lvl) => sum + lvl, 0);
      const proficiencyModifier = calculateProficiencyBonus(level);
      const wisMod = Math.floor((character.abilityScores.wis - 10) / 2);
      const passivePerception = calculatePassivePerception(
        wisMod,
        proficiencyModifier,
        character.skillProficiencies.perception.proficient,
        character.skillProficiencies.perception.expertise
      );
      const maxHp = character.maxHp !== 0 ? character.maxHp : this.getStartingHp(character);
      const ac =
        10 +
        calculateAbilityScoreModifier(
          character.abilityScores.dex,
          character.proficiencyModifier,
          false,
          false
        );
      const tempHp = character.tempHp || 0;
      const hitDice: HitDice[] = [];
      character.classes.forEach(charClass => {
        if (charClass.hd) {
          const dieType = charClass.hd.substring(1) as keyof DiceTypes;
          const classLevel =
            character.classLevels[charClass.name.toLowerCase() as keyof ClassLevels];
          const current = classLevel; // Assuming all hit dice are available at the start of the day
          hitDice.push({ total: classLevel, current: current, dieType: dieType });
        }
      });
      console.log('race speed: ', character.race?.speed);
      console.log('subrace speed: ', character.subrace?.speed);
      const resolveSpeed = (rawSpeed: number | { walk?: number; fly?: number; swim?: number; climb?: number; burrow?: number } | undefined): Partial<CharSpeed> => {
        if (rawSpeed === undefined) return {};
        if (typeof rawSpeed === 'number') return { base: rawSpeed };
        return {
          ...(rawSpeed.walk !== undefined ? { base: rawSpeed.walk } : {}),
          ...(rawSpeed.fly !== undefined ? { fly: rawSpeed.fly } : {}),
          ...(rawSpeed.swim !== undefined ? { swim: rawSpeed.swim } : {}),
          ...(rawSpeed.climb !== undefined ? { climb: rawSpeed.climb } : {}),
          ...(rawSpeed.burrow !== undefined ? { burrow: rawSpeed.burrow } : {}),
        };
      };
      let speed: CharSpeed = { base: 30, ...resolveSpeed(character.race?.speed) };
      if (character.subrace?.speed !== undefined) {
        speed = { ...speed, ...resolveSpeed(character.subrace.speed) };
      }
      const initiativeBonus =
        character.initiativeBonus > 0
          ? character.initiativeBonus
          : calculateAbilityScoreModifier(character.abilityScores.dex, 0, false, false);
      character.level = level;
      character.proficiencyModifier = proficiencyModifier;
      character.passivePerception = passivePerception;
      character.maxHp = maxHp;
      character.currHp = maxHp;
      character.ac = ac;
      character.tempHp = tempHp;
      character.hitDice = hitDice;
      character.speed = speed;
      character.initiativeBonus = initiativeBonus;
      // After updating derived fields, save the character to the database
      await this.updateCharacter(character);
    },
  },
});
