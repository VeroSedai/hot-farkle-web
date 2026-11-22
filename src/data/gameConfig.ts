export const GameConfig = {
  StageTargets: [750, 1400, 2200] as const,
  EndlessStageStep: 1000,
  EndlessStageMultiplier: 1.75,
  TotalStages: 3,

  TargetPoints: 750,
  MaxTurns: 4,
  StartingShields: 2,
  MaxShields: 3,
  StartingCoins: 2,

  StageClearBaseCoins: 3,
  OverkillPointsPerCoin: 500,
  MaxOverkillBonusCoins: 5,

  MaxConsumableSlots: 2,
  SpintaSuccessBonus: 150,

  ShopCostRepairShield: 2,
  ShopCostConsumable: 2,
  ShopConsumableSellValue: 1,
  ShopCostSpecialDie: 3,
  ShopCostTrisMultiplierUpgrade: 4,
  ShopCostTrisMultiplierStep: 2,
  ShopCostReroll: 1,

  DefaultDiceCount: 6,
  ReducedHotDiceCount: 5,
  MaxMultiplier: 8,

  BossStageNumber: 3,
  GeloPerenneStartingFrozenDice: 1,
  FornaceMaxTurns: 3,
  FornaceHotDiceLevelStep: 2,
  EsattoreSingleFiveCoinReward: 1,
  IceDieFrozenBonusPerDie: 100,
} as const;

export function isBossStage(stage: number): boolean {
  return stage >= GameConfig.BossStageNumber && stage % GameConfig.BossStageNumber === 0;
}

export function getStageTarget(stage: number): number {
  if (stage >= 1 && stage <= GameConfig.StageTargets.length) {
    return GameConfig.StageTargets[stage - 1];
  }
  if (stage > GameConfig.StageTargets.length) {
    const lastTarget = GameConfig.StageTargets[GameConfig.StageTargets.length - 1];
    const endlessDepth = stage - GameConfig.StageTargets.length;
    const rawTarget = lastTarget * Math.pow(GameConfig.EndlessStageMultiplier, endlessDepth);
    return Math.round(rawTarget / 100) * 100;
  }
  return GameConfig.TargetPoints;
}
