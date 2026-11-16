const SWEEP_AT_SIZE = 1_000;

export class TtlCache<K, V> {
  private readonly entries = new Map<K, { value: V; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
    private readonly sweepAtSize: number = SWEEP_AT_SIZE,
  ) {}

  get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.entries.size >= this.sweepAtSize) this.sweep();
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }

  get size(): number {
    return this.entries.size;
  }

  private sweep(): void {
    const now = this.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }
}
