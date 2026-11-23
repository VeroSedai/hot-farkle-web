import React from 'react';
import { BossType } from '../data/bossType';

interface SwirlBackgroundProps {
  heat?: number;
  accentHex?: string;
  bossType?: BossType;
}

export const SwirlBackground: React.FC<SwirlBackgroundProps> = ({
  heat = 0,
  bossType = BossType.None,
}) => {
  const isHot = heat > 0.35;
  const bossClass =
    bossType === BossType.Fornace
      ? 'pop-bg-boss-fornace'
      : bossType === BossType.GeloPerenne
        ? 'pop-bg-boss-gelo'
        : bossType === BossType.Esattore
          ? 'pop-bg-boss-esattore'
          : '';

  return (
    <div
      className={`pop-bg ${isHot ? 'pop-bg-hot' : ''} ${bossClass}`.trim()}
      aria-hidden="true"
    >
      <div className="pop-bg-halftone-left" />
      <div className="pop-bg-halftone-right" />
      <div className="pop-bg-band">
        <div className="pop-bg-band-halftone" />
      </div>
    </div>
  );
};
