import Redis from "ioredis";
import { config } from "../../constants";

export class RedisProvider {
  private client: Redis | null = null;

  public getClient(): Redis {
    if (!this.client) {
      throw new Error("Redis has not been connected yet. Call connect() first.");
    }
    return this.client;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      client.on("error", (err: Error) => {
        console.error("Redis error:", err.message);
      });

      client
        .connect()
        .then(() => {
          this.client = client;
          console.log("Redis connected");
          resolve();
        })
        .catch((err: Error) => {
          reject(err);
        });
    });
  }
}

export const redisProvider = new RedisProvider();
