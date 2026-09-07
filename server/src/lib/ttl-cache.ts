// A tiny in-memory cache with per-entry expiry. Used to skip the database on the hot
// path where a single round trip costs hundreds of milliseconds.
export class TtlCache<K, V> {
  private readonly entries = new Map<K, { value: V; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
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
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }

  delete(key: K): void {
    this.entries.delete(key);
  }

  get size(): number {
    return this.entries.size;
  }
}
