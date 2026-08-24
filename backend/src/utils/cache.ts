type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

export const ttlCache = {
  get<T>(key: string): T | undefined {
    const hit = store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      store.delete(key);
      return undefined;
    }
    return hit.value as T;
  },
  set(key: string, value: unknown, ttlMs: number): void {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  },
  invalidate(prefix?: string): void {
    if (!prefix) {
      store.clear();
      return;
    }
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },
};
