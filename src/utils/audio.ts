class SoundManager {
  private bgm: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private rollBuffer: AudioBuffer | null = null;
  private selectBuffer: AudioBuffer | null = null;
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

    if (this.audioCtx && !this.buffersLoading && !this.rollBuffer && !this.selectBuffer) {
      this.buffersLoading = true;
      this.loadBuffer('./audio/dice_roll.wav').then((buf) => {
        this.rollBuffer = buf;
      });
      this.loadBuffer('./audio/dice_select.wav').then((buf) => {
        this.selectBuffer = buf;
      });
    }
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

  private playOneShot(buffer: AudioBuffer | null, pitch: number, volume: number): void {
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
    source.start(0);
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

  public playRoll(isSingleDie = false): void {
    this.unlock();
    if (this.sfxMuted) return;
    const pitch = isSingleDie
      ? 1.12 + Math.random() * 0.12
      : 0.95 + Math.random() * 0.12;
    const volume = isSingleDie ? 0.5 : 0.65;
    this.playOneShot(this.rollBuffer, pitch, volume);
  }

  public playSelect(isSelecting = true, selectedCount = 1): void {
    this.unlock();
    if (this.sfxMuted) return;
    const clampedCount = Math.max(1, selectedCount);
    const pitch = isSelecting
      ? Math.min(1.35, Math.max(1.0, 1.0 + (clampedCount - 1) * 0.05))
      : 0.86;
    const volume = isSelecting ? 0.6 : 0.45;
    this.playOneShot(this.selectBuffer, pitch, volume);
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
