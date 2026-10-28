import { RedisKeys } from "../constants";
import { cache } from "./redisCache";

export async function invalidatePostCaches(postId: string): Promise<void> {
  await cache.delKeys(RedisKeys.post(postId));
  await cache.incr(RedisKeys.postListVersion());
}
