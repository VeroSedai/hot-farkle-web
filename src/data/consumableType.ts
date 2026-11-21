export enum ConsumableType {
  GettoneSpinta = 'GettoneSpinta',
  GhiaccioSecco = 'GhiaccioSecco',
  Polizza = 'Polizza',
  DadoJolly = 'DadoJolly',
  Trifoglio = 'Trifoglio',
}

export interface ConsumableMetadata {
  displayName: string;
  shortDescription: string;
  requiresDieTarget: boolean;
}

export const CONSUMABLE_METADATA: Record<ConsumableType, ConsumableMetadata> = {
  [ConsumableType.GettoneSpinta]: {
    displayName: 'GETTONE SPINTA',
    shortDescription: 'Rilancia 1 dado (+150 pt se segna)',
    requiresDieTarget: true,
  },
  [ConsumableType.GhiaccioSecco]: {
    displayName: 'GHIACCIO SECCO',
    shortDescription: 'Congela 1 dado (+1x Moltiplicatore)',
    requiresDieTarget: true,
  },
  [ConsumableType.Polizza]: {
    displayName: 'POLIZZA',
    shortDescription: 'Salva 50% Piatto (Reset x1)',
    requiresDieTarget: false,
  },
  [ConsumableType.DadoJolly]: {
    displayName: 'DADO JOLLY',
    shortDescription: 'Trasforma 1 dado in 1',
    requiresDieTarget: true,
  },
  [ConsumableType.Trifoglio]: {
    displayName: 'TRIFOGLIO',
    shortDescription: 'Annulla prossimo Farkle',
    requiresDieTarget: false,
  },
};
