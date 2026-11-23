import React from 'react';

interface SwirlBackgroundProps {
  heat?: number;
  accentHex?: string;
}

export const SwirlBackground: React.FC<SwirlBackgroundProps> = ({ heat = 0 }) => {
  const isHot = heat > 0.35;

  return (
    <div
      className={`pop-bg ${isHot ? 'pop-bg-hot' : ''}`}
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
