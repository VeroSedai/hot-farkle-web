export const GameConfig = {
  StageTargets: [1000, 1800, 2800] as const,
  TotalStages: 3,

  TargetPoints: 1000,
  MaxTurns: 4,
  StartingShields: 2,
  StartingCoins: 2,

  StageClearBaseCoins: 3,
  OverkillPointsPerCoin: 500,

  MaxConsumableSlots: 2,
  SpintaSuccessBonus: 150,

  ShopCostRepairShield: 2,
  ShopCostConsumable: 2,
  ShopCostSpecialDie: 3,
  ShopCostTrisMultiplierUpgrade: 4,
  ShopCostReroll: 1,

  DefaultDiceCount: 6,
  ReducedHotDiceCount: 5,
  MaxMultiplier: 4,

  BossStageNumber: 3,
  GeloPerenneStartingFrozenDice: 1,
  FornaceMaxTurns: 3,
  FornaceHotDiceLevelStep: 2,
  EsattoreSingleFiveCoinReward: 1,
  IceDieFrozenBonusPerDie: 100,
} as const;
