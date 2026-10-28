import dotenv from "dotenv";

dotenv.config();

export const APP_NAME = "blog_assignment_project";
export const REDIS_KEY_PREFIX = `${APP_NAME}:`;

export const config = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  appName: APP_NAME,
} as const;

export const RedisKeys = {
  session: (token: string) => `${REDIS_KEY_PREFIX}session:${token}`,
  user: (userId: string) => `${REDIS_KEY_PREFIX}user:${userId}`,
  post: (postId: string) => `${REDIS_KEY_PREFIX}post:${postId}`,
  postList: (page: number, limit: number, tag?: string) =>
    tag
      ? `${REDIS_KEY_PREFIX}posts:list:${page}:${limit}:tag:${tag}`
      : `${REDIS_KEY_PREFIX}posts:list:${page}:${limit}`,
  stats: () => `${REDIS_KEY_PREFIX}stats`,
  loginAttempts: (identifier: string) =>
    `${REDIS_KEY_PREFIX}login:attempts:${identifier}`,
} as const;

export const RedisTTL = {
  session: 60 * 60 * 24 * 7,
  user: 60 * 60,
  post: 60 * 10,
  postList: 60 * 2,
  stats: 60,
  loginAttempts: 60 * 15,
} as const;
