export enum DieState {
  InPool = 'InPool',
  Selected = 'Selected',
  Locked = 'Locked',
  Frozen = 'Frozen',
}

export enum DieType {
  Standard = 'Standard',
  Golden = 'Golden',         // 1 vale 250 pt (invece di 100), 5 vale 100 pt (invece di 50)
  Loaded = 'Loaded',         // Facce truccate: 1, 1, 5, 5, 3, 6
  Multiplier = 'Multiplier', // Se bloccato in una selezione valida, raddoppia i punti
}

export type RngFn = () => number;

const LOADED_FACES = [1, 1, 5, 5, 3, 6] as const;

export class Die {
  public static readonly MinId = 0;
  public static readonly MaxId = 5;
  public static readonly MinValue = 1;
  public static readonly MaxValue = 6;

  public readonly id: number;
  private _value: number;
  public state: DieState;
  public type: DieType;

  constructor(
    id: number,
    initialValue: number = Die.MinValue,
    initialState: DieState = DieState.InPool,
    type: DieType = DieType.Standard
  ) {
    if (id < Die.MinId || id > Die.MaxId) {
      throw new RangeError(`L'Id del dado deve essere compreso tra ${Die.MinId} e ${Die.MaxId}.`);
    }
    this.id = id;
    this._value = Die.MinValue;
    this.value = initialValue;
    this.state = initialState;
    this.type = type;
  }

  public get value(): number {
    return this._value;
  }

  public set value(val: number) {
    if (val < Die.MinValue || val > Die.MaxValue) {
      throw new RangeError(`Il valore del dado deve essere compreso tra ${Die.MinValue} e ${Die.MaxValue}.`);
    }
    this._value = val;
  }

  public roll(rng: RngFn = Math.random): number {
    if (this.type === DieType.Loaded) {
      const idx = Math.floor(rng() * LOADED_FACES.length);
      this.value = LOADED_FACES[idx];
    } else {
      this.value = Math.floor(rng() * (Die.MaxValue - Die.MinValue + 1)) + Die.MinValue;
    }
    return this.value;
  }

  public reset(state: DieState = DieState.InPool): void {
    this.state = state;
  }

  public clone(): Die {
    return new Die(this.id, this.value, this.state, this.type);
  }
}
