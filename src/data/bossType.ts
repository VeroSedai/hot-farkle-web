export enum BossType {
  None = 'None',
  GeloPerenne = 'GeloPerenne', // 1 dado parte Frozen a inizio turno
  Fornace = 'Fornace',         // 3 turni invece di 4, ma Hot Dice sale di +2x
  Esattore = 'Esattore',       // I 5 singoli non danno punti ma generano +1 Moneta quando bloccati
  Usuraio = 'Usuraio',         // Bank consentito solo con Piatto >= 450 pt
  Purista = 'Purista',         // Tris dimezzati, Scale +50% pt
}

export interface BossMetadata {
  displayName: string;
  shortDescription: string;
  themeColorHex: string;
}

export const BOSS_METADATA: Record<BossType, BossMetadata> = {
  [BossType.None]: {
    displayName: 'TAVOLO STANDARD',
    shortDescription: 'Regole classiche',
    themeColorHex: '#A3A3A3',
  },
  [BossType.GeloPerenne]: {
    displayName: 'GELO PERENNE',
    shortDescription: '1 dado parte congelato ogni turno',
    themeColorHex: '#38BDF8',
  },
  [BossType.Fornace]: {
    displayName: 'FORNACE',
    shortDescription: 'Solo 3 turni, ma Hot Dice +2x',
    themeColorHex: '#F97316',
  },
  [BossType.Esattore]: {
    displayName: 'ESATTORE',
    shortDescription: 'I 5 singoli valgono 0 pt ma danno +1 Moneta',
    themeColorHex: '#F4B41A',
  },
  [BossType.Usuraio]: {
    displayName: 'USURAIO',
    shortDescription: 'Bank solo con Piatto ≥ 450 pt',
    themeColorHex: '#A855F7',
  },
  [BossType.Purista]: {
    displayName: 'PURISTA',
    shortDescription: 'Tris dimezzati, Scale +50% pt',
    themeColorHex: '#94A3B8',
  },
};
