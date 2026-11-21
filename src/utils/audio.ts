class SoundManager {
  private bgm: HTMLAudioElement | null = null;
  private rollAudio: HTMLAudioElement | null = null;
  private selectAudio: HTMLAudioElement | null = null;
  private muted = false;
  private unlocked = false;

  private ensureInit(): void {
    if (typeof Audio === 'undefined') return;
    if (!this.bgm) {
      this.bgm = new Audio('/audio/bgm_main.wav');
      this.bgm.loop = true;
      this.bgm.volume = 0.25;
    }
    if (!this.rollAudio) {
      this.rollAudio = new Audio('/audio/dice_roll.wav');
      this.rollAudio.volume = 0.55;
    }
    if (!this.selectAudio) {
      this.selectAudio = new Audio('/audio/dice_select.wav');
      this.selectAudio.volume = 0.5;
    }
  }

  public unlock(): void {
    this.ensureInit();
    if (this.unlocked) return;
    this.unlocked = true;
    if (!this.muted && this.bgm) {
      this.bgm.play().catch(() => {
        // Ignore autoplay restrictions until next gesture
        this.unlocked = false;
      });
    }
  }

  public playRoll(): void {
    this.unlock();
    if (this.muted || !this.rollAudio) return;
    this.rollAudio.currentTime = 0;
    this.rollAudio.play().catch(() => {});
  }

  public playSelect(): void {
    this.unlock();
    if (this.muted || !this.selectAudio) return;
    this.selectAudio.currentTime = 0;
    this.selectAudio.play().catch(() => {});
  }

  public toggleMute(): boolean {
    this.ensureInit();
    this.muted = !this.muted;
    if (this.bgm) {
      if (this.muted) {
        this.bgm.pause();
      } else {
        this.bgm.play().catch(() => {});
      }
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }
}

export const soundManager = new SoundManager();
