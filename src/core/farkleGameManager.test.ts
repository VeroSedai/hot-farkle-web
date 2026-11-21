import { describe, expect, it } from 'vitest';
import { BossType } from '../data/bossType';
import { ConsumableType } from '../data/consumableType';
import { Die, DieState, DieType } from './die';
import { FarkleGameManager } from './farkleGameManager';
import { ScoreEvaluator } from './scoreEvaluator';

describe('ScoreEvaluator', () => {
  it('evaluates full straight, small straights, tris, and singles', () => {
    expect(ScoreEvaluator.evaluateValues([1, 2, 3, 4, 5, 6])).toEqual({
      score: 1500,
      isValidSelection: true,
      bonusCoins: 0,
    });

    expect(ScoreEvaluator.evaluateValues([2, 3, 4, 5, 6])).toEqual({
      score: 750,
      isValidSelection: true,
      bonusCoins: 0,
    });

    expect(ScoreEvaluator.evaluateValues([1, 1, 1])).toEqual({
      score: 1000,
      isValidSelection: true,
      bonusCoins: 0,
    });

    expect(ScoreEvaluator.evaluateValues([4, 4, 4, 4])).toEqual({
      score: 800,
      isValidSelection: true,
      bonusCoins: 0,
    });

    expect(ScoreEvaluator.evaluateValues([2])).toEqual({
      score: 0,
      isValidSelection: false,
      bonusCoins: 0,
    });
  });

  it('evaluates special dice (Golden, Multiplier) and Esattore boss', () => {
    const goldenOne = new Die(0, 1, DieState.Selected, DieType.Golden);
    const multFive = new Die(1, 5, DieState.Selected, DieType.Multiplier);
    // 250 (golden 1) + 50 (5) = 300, doubled by Multiplier = 600
    expect(ScoreEvaluator.evaluate([goldenOne, multFive])).toEqual({
      score: 600,
      isValidSelection: true,
      bonusCoins: 0,
    });

    const singleFive = new Die(0, 5, DieState.Selected, DieType.Standard);
    expect(ScoreEvaluator.evaluate([singleFive], 0, 1.0, BossType.Esattore)).toEqual({
      score: 0,
      isValidSelection: true,
      bonusCoins: 1,
    });
  });
});

describe('FarkleGameManager', () => {
  it('starts a run and banks a valid selection', () => {
    // Deterministic rng returning 0 -> all dice roll 1
    const gm = new FarkleGameManager(() => 0);
    gm.startNewRun();
    expect(gm.currentStage).toBe(1);
    expect(gm.dice.every((d) => d.value === 1)).toBe(true);

    gm.toggleSelectDie(0);
    gm.toggleSelectDie(1);
    gm.toggleSelectDie(2);
    expect(gm.isSelectionValid).toBe(true);
    expect(gm.previewSelectionScore).toBe(1000);

    const banked = gm.bankPotAndEndTurn();
    expect(banked).toBe(true);
    // 1000 reaches Stage 1 target -> opens shop
    expect(gm.isInShop).toBe(true);
    expect(gm.coins).toBe(5); // 2 starting + 3 stage clear
  });

  it('supports DadoJolly consumable to turn a die into 1', () => {
    const gm = new FarkleGameManager(() => 0.35); // rolls 3
    gm.startNewRun();
    gm.equippedConsumables.push(ConsumableType.DadoJolly);
    gm.dice[0].value = 4;

    const used = gm.useTargetedConsumable(0, 0);
    expect(used).toBe(true);
    expect(gm.dice[0].value).toBe(1);
    expect(gm.equippedConsumables.length).toBe(0);
  });

  it('allows selling an equipped consumable in the shop to free a belt slot', () => {
    const gm = new FarkleGameManager(() => 0);
    gm.startNewRun();
    gm.toggleSelectDie(0);
    gm.toggleSelectDie(1);
    gm.toggleSelectDie(2);
    gm.bankPotAndEndTurn();

    expect(gm.isInShop).toBe(true);
    gm.equippedConsumables.push(ConsumableType.Polizza, ConsumableType.Trifoglio);
    expect(gm.canBuyShopConsumable).toBe(false);

    const coinsBefore = gm.coins;
    const sold = gm.sellShopConsumable(0);
    expect(sold).toBe(ConsumableType.Polizza);
    expect(gm.equippedConsumables).toEqual([ConsumableType.Trifoglio]);
    expect(gm.coins).toBe(coinsBefore + 1);
    expect(gm.canBuyShopConsumable).toBe(true);
  });
});
