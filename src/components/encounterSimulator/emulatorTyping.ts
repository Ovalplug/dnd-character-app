// this is where all the typing logic will be stored for the emulator

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
export type DiceRolls = [
  {
    dice: DiceType;
    number: number;
    modifier?: number;
  }
];
