class SoundManager {
  private bgm: HTMLAudioElement | null = null;
  private rollAudio: HTMLAudioElement | null = null;
  private selectAudio: HTMLAudioElement | null = null;
  private bgmMuted = false;
  private sfxMuted = false;

  private ensureInit(): void {
    if (typeof Audio === 'undefined') return;
    if (!this.bgm) {
      this.bgm = new Audio('./audio/bgm_main.wav');
      this.bgm.loop = true;
      this.bgm.autoplay = true;
      this.bgm.volume = 0.25;
    }
    if (!this.rollAudio) {
      this.rollAudio = new Audio('./audio/dice_roll.wav');
      this.rollAudio.volume = 0.55;
    }
    if (!this.selectAudio) {
      this.selectAudio = new Audio('./audio/dice_select.wav');
      this.selectAudio.volume = 0.5;
    }
  }

  public unlock(): void {
    this.ensureInit();
    if (!this.bgmMuted && this.bgm && this.bgm.paused) {
      this.bgm.play().catch(() => {});
    }
  }

  public playRoll(): void {
    this.unlock();
    if (this.sfxMuted || !this.rollAudio) return;
    this.rollAudio.currentTime = 0;
    this.rollAudio.play().catch(() => {});
  }

  public playSelect(): void {
    this.unlock();
    if (this.sfxMuted || !this.selectAudio) return;
    this.selectAudio.currentTime = 0;
    this.selectAudio.play().catch(() => {});
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
