import dotenv from "dotenv";

dotenv.config();

export const APP_NAME = "blog_assignment_project";
export const REDIS_KEY_PREFIX = `${APP_NAME}:`;
export const SESSION_DAYS = 7;

export const config = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  appName: APP_NAME,
} as const;

export type PostSort = "newest" | "oldest" | "mostCommented";

export const RedisKeys = {
  session: (token: string) => `${REDIS_KEY_PREFIX}session:${token}`,
  user: (userId: string) => `${REDIS_KEY_PREFIX}user:${userId}`,
  userSessions: (userId: string) =>
    `${REDIS_KEY_PREFIX}user:${userId}:sessions`,
  post: (postId: string) => `${REDIS_KEY_PREFIX}post:${postId}`,
  postListVersion: () => `${REDIS_KEY_PREFIX}posts:list:version`,
  postList: (params: {
    version: number;
    page: number;
    limit: number;
    search: string;
    tag: string;
    sort: PostSort;
  }) =>
    `${REDIS_KEY_PREFIX}posts:list:v${params.version}:p${params.page}:l${params.limit}:s${params.search}:t${params.tag}:o${params.sort}`,
  stats: () => `${REDIS_KEY_PREFIX}stats`,
  loginFail: (email: string) =>
    `${REDIS_KEY_PREFIX}login:fail:${email.toLowerCase()}`,
} as const;

export const RedisTTL = {
  session: 60 * 60 * 24 * SESSION_DAYS,
  user: 60 * 60,
  post: 60 * 10,
  postList: 60,
  stats: 60 * 5,
  loginFail: 60 * 15,
} as const;
