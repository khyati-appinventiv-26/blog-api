import { redisProvider } from "../providers/redis/RedisProvider";

export class RedisCache {
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

  public async getString(key: string): Promise<string | null> {
    try {
      return await redisProvider.getClient().get(key);
    } catch (err) {
      console.error("cache getString error:", (err as Error).message);
      return null;
    }
  }

  public async setString(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      if (ttlSeconds !== undefined && ttlSeconds > 0) {
        await redisProvider.getClient().set(key, value, "EX", ttlSeconds);
      } else {
        await redisProvider.getClient().set(key, value);
      }
    } catch (err) {
      console.error("cache setString error:", (err as Error).message);
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

  public async incr(key: string): Promise<number | null> {
    try {
      return await redisProvider.getClient().incr(key);
    } catch (err) {
      console.error("cache incr error:", (err as Error).message);
      return null;
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await redisProvider.getClient().expire(key, ttlSeconds);
    } catch (err) {
      console.error("cache expire error:", (err as Error).message);
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await redisProvider.getClient().ttl(key);
    } catch (err) {
      console.error("cache ttl error:", (err as Error).message);
      return -1;
    }
  }

  public async sadd(key: string, member: string): Promise<void> {
    try {
      await redisProvider.getClient().sadd(key, member);
    } catch (err) {
      console.error("cache sadd error:", (err as Error).message);
    }
  }

  public async srem(key: string, member: string): Promise<void> {
    try {
      await redisProvider.getClient().srem(key, member);
    } catch (err) {
      console.error("cache srem error:", (err as Error).message);
    }
  }

  public async smembers(key: string): Promise<string[]> {
    try {
      return await redisProvider.getClient().smembers(key);
    } catch (err) {
      console.error("cache smembers error:", (err as Error).message);
      return [];
    }
  }
}

export const cache = new RedisCache();
