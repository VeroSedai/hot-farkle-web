import React from 'react';
import { GameIcons } from './Icons';

interface HomeScreenProps {
  muted: boolean;
  onStartGame: () => void;
  onOpenRules: () => void;
  onToggleMute: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  muted,
  onStartGame,
  onOpenRules,
  onToggleMute,
}) => {
  return (
    <div className="home-layout">
      <div className="home-top-bar">
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleMute}
          aria-label={muted ? 'Attiva audio' : 'Disattiva audio'}
        >
          {muted ? <GameIcons.SoundOff size={20} /> : <GameIcons.SoundOn size={20} />}
        </button>
      </div>

      <div className="home-hero">
        <div className="home-emblem">
          <GameIcons.DiceFire size={72} className="home-fire-icon" />
        </div>
        <h1 className="home-title">HOT FARKLE</h1>
      </div>

      <div className="home-actions">
        <button type="button" className="btn btn-gold btn-full btn-hero" onClick={onStartGame}>
          <GameIcons.Play size={22} /> GIOCA
        </button>
        <button type="button" className="btn btn-ghost btn-full" onClick={onOpenRules}>
          <GameIcons.Rules size={20} /> REGOLE
        </button>
      </div>
    </div>
  );
};
