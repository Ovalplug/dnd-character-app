// this is where all the calculation logic functions will be stored.
// such as dice rolling, damage calcs etc

// rules will be stored in the rules file

import type { DiceRolls, DiceType } from './emulatorTyping';

function getDiceValue(diceType: DiceType): number {
  switch (diceType) {
    case 'd4':
      return 4;
    case 'd6':
      return 6;
    case 'd8':
      return 8;
    case 'd10':
      return 10;
    case 'd12':
      return 12;
    case 'd20':
      return 20;
    case 'd100':
      return 100;

    default:
      return 0;
  }
}

export function calculateAverageRoll(
  diceType: DiceType,
  numberToRoll: number,
  modifier: number
): number {
  return ((getDiceValue(diceType) + 1) / 2) * numberToRoll + modifier;
}

export function rollDice(diceType: DiceRolls): number {
  console.log('rolling dice');
  console.log(diceType);

  let total: number = 0;

  diceType.forEach(roll => {
    console.log(
      'rolling dice for',
      roll,
      ' with an average roll of ',
      calculateAverageRoll(roll.dice, roll.number, roll.modifier ? roll.modifier : 0)
    );
    for (let i = 0; i < roll.number; i++) {
      total += Math.floor(Math.random() * getDiceValue(roll.dice)) + 1;
      roll.modifier ? (total += roll.modifier) : null;
    }
  });
  return total;
}

export function rollDiceWithAdvantageOrDisadvantage(diceType: DiceRolls, advantage: boolean): number {
  const roll1 = rollDice(diceType);
  const roll2 = rollDice(diceType);

  if (advantage) {
    return Math.max(roll1, roll2);
  } else {
    return Math.min(roll1, roll2);
  }
}