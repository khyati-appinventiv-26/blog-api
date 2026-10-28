import { NextFunction, Request, Response } from "express";
import { RedisKeys } from "../constants";
import { AppError } from "../utils/AppError";
import { cache } from "../utils/redisCache";
import { SessionRepository } from "../Repository/SessionRepository";
import { UserRepository } from "../Repository/UserRepository";

export class AuthMiddleware {
  private readonly sessions = new SessionRepository();
  private readonly users = new UserRepository();

  public handle = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);
      if (!token) {
        throw new AppError("Unauthorized", 401);
      }

      let userId = await cache.getString(RedisKeys.session(token));

      if (!userId) {
        const session = await this.sessions.findByToken(token);
        if (!session || session.expiresAt.getTime() <= Date.now()) {
          if (session) {
            await this.sessions.deleteByToken(token);
          }
          throw new AppError("Unauthorized", 401);
        }

        userId = String(session.userId);
        const ttlSeconds = Math.max(
          1,
          Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
        );
        await cache.setString(RedisKeys.session(token), userId, ttlSeconds);
        await cache.sadd(RedisKeys.userSessions(userId), token);
      }

      const user = await this.users.findById(userId);
      if (!user) {
        throw new AppError("Unauthorized", 401);
      }

      req.user = user;
      req.sessionToken = token;
      next();
    } catch (err) {
      next(err);
    }
  };

  private extractToken(req: Request): string | undefined {
    const header = req.get("authorization");
    if (!header) return undefined;

    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return undefined;
    }
    return token;
  }
}
