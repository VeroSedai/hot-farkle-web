type SfxKey =
  | 'roll'
  | 'select'
  | 'hotDice'
  | 'youDied'
  | 'youWon'
  | 'openShop'
  | 'buyItem'
  | 'useItem'
  | 'selectionLand';

const SFX_URLS: Record<SfxKey, string> = {
  roll: './audio/dice_roll.wav',
  select: './audio/dice_select.wav',
  hotDice: './audio/sfx_HOT_DICE.wav',
  youDied: './audio/sfx_YOU_DIED.wav',
  youWon: './audio/sfx_YOU_WON.wav',
  openShop: './audio/sfx_open_shop.wav',
  buyItem: './audio/sfx_buy_item.wav',
  useItem: './audio/sfx_use_item.wav',
  selectionLand: './audio/sfx_die_selection_land.wav',
};

interface LoadedSfx {
  buffer: AudioBuffer;
  offset: number;
}

class SoundManager {
  private bgm: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private sfxMap = new Map<SfxKey, LoadedSfx>();
  private buffersLoading = false;
  private bgmMuted = false;
  private sfxMuted = false;

  private ensureInit(): void {
    if (typeof window === 'undefined') return;

    if (!this.bgm && typeof Audio !== 'undefined') {
      this.bgm = new Audio('./audio/bgm_main.wav');
      this.bgm.loop = true;
      this.bgm.autoplay = true;
      this.bgm.volume = 0.25;
    }

    if (!this.audioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }

    if (this.audioCtx && !this.buffersLoading && this.sfxMap.size === 0) {
      this.buffersLoading = true;
      for (const [key, url] of Object.entries(SFX_URLS) as [SfxKey, string][]) {
        this.loadBuffer(url).then((buf) => {
          if (buf) {
            this.sfxMap.set(key, {
              buffer: buf,
              offset: this.findSoundStartOffset(buf),
            });
          }
        });
      }
    }
  }

  private findSoundStartOffset(buffer: AudioBuffer): number {
    const data = buffer.getChannelData(0);
    const threshold = 0.01;
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > threshold) {
        return Math.max(0, (i - 16) / buffer.sampleRate);
      }
    }
    return 0;
  }

  private async loadBuffer(url: string): Promise<AudioBuffer | null> {
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      if (!this.audioCtx) return null;
      return await this.audioCtx.decodeAudioData(arr);
    } catch {
      return null;
    }
  }

  private playOneShot(
    buffer: AudioBuffer | null,
    offset: number,
    pitch: number,
    volume: number,
    delaySeconds = 0
  ): void {
    if (!this.audioCtx || !buffer) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = pitch;

    const gainNode = this.audioCtx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    const when = delaySeconds > 0 ? this.audioCtx.currentTime + delaySeconds : 0;
    source.start(when, offset);
  }

  public unlock(): void {
    this.ensureInit();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    if (!this.bgmMuted && this.bgm && this.bgm.paused) {
      this.bgm.play().catch(() => {});
    }
  }

  private playSfx(key: SfxKey, pitch = 1.0, volume = 0.65, delaySeconds = 0): void {
    this.unlock();
    if (this.sfxMuted) return;
    const entry = this.sfxMap.get(key);
    if (entry) {
      this.playOneShot(entry.buffer, entry.offset, pitch, volume, delaySeconds);
    }
  }

  public playRoll(isSingleDie = false, delaySeconds = 0, volumeScale = 1.0): void {
    const pitch = isSingleDie
      ? 1.12 + Math.random() * 0.12
      : 0.95 + Math.random() * 0.12;
    const baseVolume = isSingleDie ? 0.5 : 0.65;
    const volume = baseVolume * Math.max(0, Math.min(1, volumeScale));
    this.playSfx('roll', pitch, volume, delaySeconds);
  }

  public playSelect(isSelecting = true, selectedCount = 1): void {
    const clampedCount = Math.max(1, selectedCount);
    const pitch = isSelecting
      ? Math.min(1.35, Math.max(1.0, 1.0 + (clampedCount - 1) * 0.05))
      : 0.86;
    const volume = isSelecting ? 0.6 : 0.45;
    this.playSfx('select', pitch, volume);
  }

  public playHotDice(): void {
    this.playSfx('hotDice', 1.0, 0.75);
  }

  public playYouDied(): void {
    this.playSfx('youDied', 1.0, 0.75);
  }

  public playYouWon(): void {
    this.playSfx('youWon', 1.0, 0.75);
  }

  public playOpenShop(): void {
    this.playSfx('openShop', 1.0, 0.65);
  }

  public playBuyItem(): void {
    this.playSfx('buyItem', 0.96 + Math.random() * 0.08, 0.65);
  }

  public playUseItem(): void {
    this.playSfx('useItem', 1.0, 0.65);
  }

  public playSelectionLand(startIndex = 0, addedCount = 1): void {
    this.unlock();
    if (this.sfxMuted || addedCount <= 0) return;
    const entry = this.sfxMap.get('selectionLand');
    if (!entry) return;
    for (let i = 0; i < addedCount; i++) {
      const semitone = startIndex + i;
      const pitch = Math.pow(2, semitone / 12);
      this.playOneShot(entry.buffer, entry.offset, pitch, 0.6, i * 0.06);
    }
  }

  public toggleBgm(): boolean {
    this.ensureInit();
    this.bgmMuted = !this.bgmMuted;
    if (this.bgm) {
      if (this.bgmMuted) {
        this.bgm.pause();
      } else {
        this.bgm.play().catch(() => {});
      }
    }
    return this.bgmMuted;
  }

  public toggleSfx(): boolean {
    this.ensureInit();
    this.sfxMuted = !this.sfxMuted;
    return this.sfxMuted;
  }

  public toggleMute(): boolean {
    const nextMuted = !this.isAllMuted();
    this.bgmMuted = nextMuted;
    this.sfxMuted = nextMuted;
    this.ensureInit();
    if (this.bgm) {
      if (this.bgmMuted) {
        this.bgm.pause();
      } else {
        this.bgm.play().catch(() => {});
      }
    }
    return nextMuted;
  }

  public isBgmMuted(): boolean {
    return this.bgmMuted;
  }

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public isAllMuted(): boolean {
    return this.bgmMuted && this.sfxMuted;
  }
}

export const soundManager = new SoundManager();
