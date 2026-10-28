import dotenv from "dotenv";

dotenv.config();

export const APP_NAME = "blog_assignment_project";
export const SESSION_DAYS = 7;

export const config = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI ?? "",
  appName: APP_NAME,
} as const;

export type PostSort = "newest" | "oldest" | "mostCommented";
