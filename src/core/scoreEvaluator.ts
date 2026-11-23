import { BossType } from '../data/bossType';
import { GameConfig } from '../data/gameConfig';
import { translate } from '../i18n/I18nContext';
import type { Language } from '../i18n/it';
import { Die, DieType } from './die';

export interface ScoreEvaluationResult {
  score: number;
  isValidSelection: boolean;
  bonusCoins: number;
}

const FULL_STRAIGHT_SCORE = 1500;
const HIGH_SMALL_STRAIGHT_SCORE = 750; // 2-3-4-5-6
const LOW_SMALL_STRAIGHT_SCORE = 500;  // 1-2-3-4-5
const THREE_ONES_SCORE = 1000;

const SINGLE_ONE_SCORE = 100;
const GOLDEN_SINGLE_ONE_SCORE = 250;

const SINGLE_FIVE_SCORE = 50;
const GOLDEN_SINGLE_FIVE_SCORE = 100;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function isFullStraight(counts: number[]): boolean {
  for (let face = 1; face <= 6; face++) {
    if (counts[face] !== 1) return false;
  }
  return true;
}

function isThreePairs(counts: number[]): boolean {
  let pairs = 0;
  for (let face = 1; face <= 6; face++) {
    if (counts[face] === 2) pairs++;
    else if (counts[face] !== 0) return false;
  }
  return pairs === 3;
}

function hasRange(counts: number[], startFace: number, endFace: number): boolean {
  for (let face = startFace; face <= endFace; face++) {
    if (counts[face] < 1) return false;
  }
  return true;
}

function consumeRange(counts: number[], startFace: number, endFace: number): void {
  for (let face = startFace; face <= endFace; face++) {
    counts[face]--;
  }
}

function evaluateCounts(
  counts: number[],
  totalDiceCount: number,
  goldenOnesCount: number,
  goldenFivesCount: number,
  hasMultiplierDie: boolean,
  trisBaseMultiplier: number,
  activeBoss: BossType,
  allowThreePairs: boolean = false
): ScoreEvaluationResult {
  if (totalDiceCount === 6 && isFullStraight(counts)) {
    let straightPoints = FULL_STRAIGHT_SCORE;
    if (activeBoss === BossType.Purista) {
      straightPoints = Math.round(straightPoints * GameConfig.PuristaStraightMultiplier);
    }
    if (hasMultiplierDie) straightPoints *= 2;
    return { score: straightPoints, isValidSelection: true, bonusCoins: 0 };
  }

  if (allowThreePairs && totalDiceCount === 6 && isThreePairs(counts)) {
    let pairsPoints = GameConfig.MonocoloThreePairsScore;
    if (hasMultiplierDie) pairsPoints *= 2;
    return { score: pairsPoints, isValidSelection: true, bonusCoins: 0 };
  }

  let totalScore = 0;
  let bonusCoins = 0;

  if (hasRange(counts, 2, 6)) {
    const straightScore =
      activeBoss === BossType.Purista
        ? Math.round(HIGH_SMALL_STRAIGHT_SCORE * GameConfig.PuristaStraightMultiplier)
        : HIGH_SMALL_STRAIGHT_SCORE;
    totalScore += straightScore;
    consumeRange(counts, 2, 6);
    goldenFivesCount = Math.min(goldenFivesCount, counts[5]);
  } else if (hasRange(counts, 1, 5)) {
    const straightScore =
      activeBoss === BossType.Purista
        ? Math.round(LOW_SMALL_STRAIGHT_SCORE * GameConfig.PuristaStraightMultiplier)
        : LOW_SMALL_STRAIGHT_SCORE;
    totalScore += straightScore;
    consumeRange(counts, 1, 5);
    goldenOnesCount = Math.min(goldenOnesCount, counts[1]);
    goldenFivesCount = Math.min(goldenFivesCount, counts[5]);
  }

  for (let face = Die.MinValue; face <= Die.MaxValue; face++) {
    const count = counts[face];
    if (count === 0) continue;

    if (count >= 3) {
      const baseTrisScore = face === 1 ? THREE_ONES_SCORE : face * 100;
      const extraDiceMultiplier = 1 << (count - 3);
      const rawTrisScore = baseTrisScore * extraDiceMultiplier;
      let boostedTrisScore = Math.round(rawTrisScore * Math.max(1.0, trisBaseMultiplier));
      if (activeBoss === BossType.Purista) {
        boostedTrisScore = Math.round(boostedTrisScore * GameConfig.PuristaTrisMultiplier);
      }
      totalScore += boostedTrisScore;
      continue;
    }

    if (face === 1) {
      const effectiveGoldenOnes = clamp(goldenOnesCount, 0, count);
      const standardOnes = count - effectiveGoldenOnes;
      totalScore += effectiveGoldenOnes * GOLDEN_SINGLE_ONE_SCORE + standardOnes * SINGLE_ONE_SCORE;
    } else if (face === 5) {
      if (activeBoss === BossType.Esattore) {
        bonusCoins += count * GameConfig.EsattoreSingleFiveCoinReward;
      } else {
        const effectiveGoldenFives = clamp(goldenFivesCount, 0, count);
        const standardFives = count - effectiveGoldenFives;
        totalScore += effectiveGoldenFives * GOLDEN_SINGLE_FIVE_SCORE + standardFives * SINGLE_FIVE_SCORE;
      }
    } else {
      return { score: 0, isValidSelection: false, bonusCoins: 0 };
    }
  }

  const isValid = totalScore > 0 || bonusCoins > 0;
  if (!isValid) {
    return { score: 0, isValidSelection: false, bonusCoins: 0 };
  }

  if (hasMultiplierDie && totalScore > 0) {
    totalScore *= 2;
  }

  return { score: totalScore, isValidSelection: true, bonusCoins };
}

export const ScoreEvaluator = {
  evaluateValues(selectedValues: readonly number[]): ScoreEvaluationResult {
    if (!selectedValues || selectedValues.length === 0 || selectedValues.length > 6) {
      return { score: 0, isValidSelection: false, bonusCoins: 0 };
    }

    const counts = new Array<number>(7).fill(0);
    for (const val of selectedValues) {
      if (val < Die.MinValue || val > Die.MaxValue) {
        return { score: 0, isValidSelection: false, bonusCoins: 0 };
      }
      counts[val]++;
    }

    return evaluateCounts(counts, selectedValues.length, 0, 0, false, 1.0, BossType.None);
  },

  evaluate(
    selectedDice: readonly Die[],
    _hotDiceLevel = 0,
    trisBaseMultiplier = 1.0,
    activeBoss: BossType = BossType.None,
    isFirstRollOfTurn = false,
    allowThreePairs = false
  ): ScoreEvaluationResult {
    if (!selectedDice || selectedDice.length === 0 || selectedDice.length > 6) {
      return { score: 0, isValidSelection: false, bonusCoins: 0 };
    }

    const counts = new Array<number>(7).fill(0);
    let goldenOnesCount = 0;
    let goldenFivesCount = 0;
    let hasMultiplierDie = false;
    let merchantDiceCount = 0;
    let volatileDiceCount = 0;

    for (const die of selectedDice) {
      if (!die || die.value < Die.MinValue || die.value > Die.MaxValue) {
        return { score: 0, isValidSelection: false, bonusCoins: 0 };
      }
      counts[die.value]++;

      if (die.type === DieType.Golden) {
        if (die.value === 1) goldenOnesCount++;
        else if (die.value === 5) goldenFivesCount++;
      } else if (die.type === DieType.Multiplier) {
        hasMultiplierDie = true;
      } else if (die.type === DieType.Merchant) {
        merchantDiceCount++;
      } else if (die.type === DieType.Volatile) {
        volatileDiceCount++;
      }
    }

    const result = evaluateCounts(
      counts,
      selectedDice.length,
      goldenOnesCount,
      goldenFivesCount,
      hasMultiplierDie,
      trisBaseMultiplier,
      activeBoss,
      allowThreePairs
    );

    if (!result.isValidSelection) {
      return result;
    }

    const extraCoins = merchantDiceCount * GameConfig.MerchantDieCoinReward;
    const extraVolatilePts = isFirstRollOfTurn
      ? volatileDiceCount * GameConfig.VolatileFirstRollBonus
      : 0;

    return {
      score: result.score + extraVolatilePts,
      isValidSelection: true,
      bonusCoins: result.bonusCoins + extraCoins,
    };
  },

  describeSelection(
    selectedDice: readonly Die[],
    hotDiceLevel = 0,
    activeBoss: BossType = BossType.None,
    lang: Language = 'it',
    allowThreePairs = false
  ): string {
    if (!selectedDice || selectedDice.length === 0 || selectedDice.length > 6) {
      return '';
    }

    const evalResult = ScoreEvaluator.evaluate(
      selectedDice,
      hotDiceLevel,
      1.0,
      activeBoss,
      false,
      allowThreePairs
    );
    if (!evalResult.isValidSelection || (evalResult.score <= 0 && evalResult.bonusCoins <= 0)) {
      return '';
    }

    const counts = new Array<number>(7).fill(0);
    for (const die of selectedDice) {
      if (!die || die.value < Die.MinValue || die.value > Die.MaxValue) {
        return '';
      }
      counts[die.value]++;
    }

    if (selectedDice.length === 6 && isFullStraight(counts)) {
      return translate(lang, 'combos.fullStraight');
    }

    if (allowThreePairs && selectedDice.length === 6 && isThreePairs(counts)) {
      return translate(lang, 'combos.threePairs');
    }

    const parts: string[] = [];

    if (hasRange(counts, 2, 6)) {
      parts.push(translate(lang, 'combos.highStraight'));
      consumeRange(counts, 2, 6);
    } else if (hasRange(counts, 1, 5)) {
      parts.push(translate(lang, 'combos.lowStraight'));
      consumeRange(counts, 1, 5);
    }

    for (let face = Die.MinValue; face <= Die.MaxValue; face++) {
      const count = counts[face];
      if (count <= 0) continue;

      if (count === 3) {
        parts.push(translate(lang, 'combos.tris', { face }));
      } else if (count === 4) {
        parts.push(translate(lang, 'combos.poker', { face }));
      } else if (count >= 5) {
        parts.push(translate(lang, 'combos.nOfAKind', { count, face }));
      } else {
        for (let c = 0; c < count; c++) {
          parts.push(face.toString());
        }
      }
    }

    return parts.join(' + ');
  },

  hasAnyScoringCombination(poolValues: readonly number[], allowThreePairs = false): boolean {
    if (!poolValues || poolValues.length === 0) return false;

    const counts = new Array<number>(7).fill(0);
    for (const val of poolValues) {
      if (val < Die.MinValue || val > Die.MaxValue) continue;
      counts[val]++;
    }

    if (
      (poolValues.length === 6 && isFullStraight(counts)) ||
      (allowThreePairs && poolValues.length === 6 && isThreePairs(counts)) ||
      hasRange(counts, 1, 5) ||
      hasRange(counts, 2, 6)
    ) {
      return true;
    }

    if (counts[1] >= 1 || counts[5] >= 1) {
      return true;
    }

    for (let face = Die.MinValue; face <= Die.MaxValue; face++) {
      if (counts[face] >= 3) return true;
    }

    return false;
  },
};
