import { redisProvider } from "../providers/redis/RedisProvider";

export class Cache {
  public async getJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = await redisProvider.getClient().get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error("cache getJSON error:", (err as Error).message);
      return null;
    }
  }

  public async setJSON(
    key: string,
    value: unknown,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const payload = JSON.stringify(value);
      if (ttlSeconds !== undefined && ttlSeconds > 0) {
        await redisProvider.getClient().set(key, payload, "EX", ttlSeconds);
      } else {
        await redisProvider.getClient().set(key, payload);
      }
    } catch (err) {
      console.error("cache setJSON error:", (err as Error).message);
    }
  }

  public async delKeys(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await redisProvider.getClient().del(...keys);
    } catch (err) {
      console.error("cache delKeys error:", (err as Error).message);
    }
  }
}

export const cache = new Cache();
