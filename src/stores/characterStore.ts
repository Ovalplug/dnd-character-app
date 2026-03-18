import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { db, type Character } from '../database/db';
import type { playerCharacter, Race } from '../types';

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
        name: '',
        level: 1,
        classes: [],
        race: null,
        background: null,
        alignment: undefined,
        xp: undefined,
        inspiration: undefined,
        feats: [],
        languages: [],
        abilityScores: {},
        proficiencyModifier: 2,
        inventory: [],
        maxHp: 0,
        currHp: 0,
        ac: 0,
        speed: 0,
        size: 'medium',
        skillProficiencies: {},
        image: undefined,
        hitDice: undefined,
        currentHitDice: undefined,
        deathSaves: undefined,
        currency: undefined,
        passivePerception: undefined,
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
      const newChar: Character = {
        ...this.currNewCharacter,
        id: uuidv4(),
      };
      await db.characters.add(newChar);
      this.characters.push(newChar);
      this.currNewCharacter = null;
      return newChar.id;
    },

    async updateCharacter(character: Character) {
      character.updatedAt = Date.now();
      await db.characters.put(character);
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
      }
    },
  },
});
