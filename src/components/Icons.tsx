import React from 'react';
import { GiDiceFire } from 'react-icons/gi';
import { TbJoker } from 'react-icons/tb';
import {
  LuBookOpen,
  LuClover,
  LuCoins,
  LuCrown,
  LuDices,
  LuEye,
  LuFlame,
  LuHouse,
  LuLandmark,
  LuLock,
  LuMagnet,
  LuMenu,
  LuMoon,
  LuPlay,
  LuRefreshCw,
  LuScale,
  LuShield,
  LuShieldCheck,
  LuSkull,
  LuSnowflake,
  LuSun,
  LuTrophy,
  LuVolume2,
  LuVolumeX,
  LuZap,
} from 'react-icons/lu';
import { BossType } from '../data/bossType';
import { ConsumableType } from '../data/consumableType';
import { RelicType } from '../data/relicType';

interface IconProps {
  className?: string;
  size?: number;
}

export const ConsumableIcon: React.FC<{ type: ConsumableType; size?: number; className?: string }> = ({
  type,
  size = 24,
  className,
}) => {
  switch (type) {
    case ConsumableType.GettoneSpinta:
      return <LuZap size={size} className={className} />;
    case ConsumableType.GhiaccioSecco:
      return <LuSnowflake size={size} className={className} />;
    case ConsumableType.Polizza:
      return <LuShieldCheck size={size} className={className} />;
    case ConsumableType.DadoJolly:
      return <TbJoker size={size} className={className} />;
    case ConsumableType.Trifoglio:
      return <LuClover size={size} className={className} />;
  }
};

export const RelicIcon: React.FC<{ relic: RelicType; size?: number; className?: string }> = ({
  relic,
  size = 22,
  className,
}) => {
  switch (relic) {
    case RelicType.DenteOro:
      return <LuCoins size={size} className={className} />;
    case RelicType.GuantoGhiaccio:
      return <LuSnowflake size={size} className={className} />;
    case RelicType.FiammaResidua:
      return <LuFlame size={size} className={className} />;
    case RelicType.MonocoloBaro:
      return <LuEye size={size} className={className} />;
    case RelicType.MicciaLunga:
      return <LuZap size={size} className={className} />;
  }
};

export const BossIcon: React.FC<{ boss: BossType; size?: number; className?: string }> = ({
  boss,
  size = 20,
  className,
}) => {
  switch (boss) {
    case BossType.GeloPerenne:
      return <LuSnowflake size={size} className={className} />;
    case BossType.Fornace:
      return <LuFlame size={size} className={className} />;
    case BossType.Esattore:
      return <LuCoins size={size} className={className} />;
    case BossType.Usuraio:
      return <LuLandmark size={size} className={className} />;
    case BossType.Purista:
      return <LuScale size={size} className={className} />;
    default:
      return <LuDices size={size} className={className} />;
  }
};

export const GameIcons = {
  Shield: (p: IconProps) => <LuShield {...p} />,
  Coins: (p: IconProps) => <LuCoins {...p} />,
  Crown: (p: IconProps) => <LuCrown {...p} />,
  Magnet: (p: IconProps) => <LuMagnet {...p} />,
  Dice: (p: IconProps) => <LuDices {...p} />,
  DiceFire: (p: IconProps) => <GiDiceFire {...p} />,
  Flame: (p: IconProps) => <LuFlame {...p} />,
  Clover: (p: IconProps) => <LuClover {...p} />,
  Rules: (p: IconProps) => <LuBookOpen {...p} />,
  Trophy: (p: IconProps) => <LuTrophy {...p} />,
  Skull: (p: IconProps) => <LuSkull {...p} />,
  Reroll: (p: IconProps) => <LuRefreshCw {...p} />,
  Snowflake: (p: IconProps) => <LuSnowflake {...p} />,
  Lock: (p: IconProps) => <LuLock {...p} />,
  Home: (p: IconProps) => <LuHouse {...p} />,
  Menu: (p: IconProps) => <LuMenu {...p} />,
  Play: (p: IconProps) => <LuPlay {...p} />,
  SoundOn: (p: IconProps) => <LuVolume2 {...p} />,
  SoundOff: (p: IconProps) => <LuVolumeX {...p} />,
  Moon: (p: IconProps) => <LuMoon {...p} />,
  Sun: (p: IconProps) => <LuSun {...p} />,
};
