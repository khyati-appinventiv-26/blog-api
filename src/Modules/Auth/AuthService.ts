import bcrypt from "bcryptjs";
import crypto from "crypto";
import { RedisKeys, RedisTTL, SESSION_DAYS } from "../../constants";
import { AppError } from "../../utils/AppError";
import { cache } from "../../utils/redisCache";
import { UserRepository } from "../../Repository/UserRepository";
import { SessionRepository } from "../../Repository/SessionRepository";
import { IUser } from "../../model/User";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export class AuthService {
  private readonly users = new UserRepository();
  private readonly sessions = new SessionRepository();

  public toPublicUser(user: IUser): PublicUser {
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public async signup(input: {
    name: unknown;
    email: unknown;
    password: unknown;
  }): Promise<PublicUser> {
    const name = this.requireName(input.name);
    const email = this.requireEmail(input.email);
    const password = this.requirePassword(input.password);

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    const hashed = await bcrypt.hash(password, 10);

    try {
      const user = await this.users.create({ name, email, password: hashed });
      return this.toPublicUser(user);
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        throw new AppError("Email already registered", 409);
      }
      throw err;
    }
  }

  public async login(input: {
    email: unknown;
    password: unknown;
    userAgent: string;
  }): Promise<{ user: PublicUser; token: string; expiresAt: Date }> {
    const email = this.requireEmail(input.email);
    const password = this.requirePassword(input.password);

    await this.assertNotRateLimited(email);

    const user = await this.users.findByEmailWithPassword(email);
    if (!user) {
      await this.recordFailedLogin(email);
      throw new AppError("Invalid email or password", 401);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await this.recordFailedLogin(email);
      throw new AppError("Invalid email or password", 401);
    }

    await cache.delKeys(RedisKeys.loginFail(email));

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
    );

    await this.sessions.create({
      userId: String(user._id),
      token,
      expiresAt,
      userAgent: input.userAgent || "",
    });

    const userId = String(user._id);
    const ttlSeconds = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000)
    );
    await cache.setString(RedisKeys.session(token), userId, ttlSeconds);
    await cache.sadd(RedisKeys.userSessions(userId), token);

    return { user: this.toPublicUser(user), token, expiresAt };
  }

  public async logout(token: string, userId: string): Promise<void> {
    await this.sessions.deleteByToken(token);
    await cache.delKeys(RedisKeys.session(token));
    await cache.srem(RedisKeys.userSessions(userId), token);
  }

  public async logoutAll(userId: string): Promise<void> {
    const tokens = await cache.smembers(RedisKeys.userSessions(userId));
    const sessions = await this.sessions.findAllByUserId(userId);
    const allTokens = new Set([
      ...tokens,
      ...sessions.map((s) => s.token),
    ]);

    await this.sessions.deleteAllByUserId(userId);

    for (const token of allTokens) {
      await cache.delKeys(RedisKeys.session(token));
    }
    await cache.delKeys(RedisKeys.userSessions(userId));
  }

  private async assertNotRateLimited(email: string): Promise<void> {
    try {
      const key = RedisKeys.loginFail(email);
      const raw = await cache.getString(key);
      const count = raw === null ? 0 : Number(raw);

      if (count >= 5) {
        const ttl = await cache.ttl(key);
        const minutes = Math.max(1, Math.ceil(ttl / 60));
        throw new AppError(
          `Too many login attempts. Try again in ${minutes} minutes`,
          429
        );
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
    }
  }

  private async recordFailedLogin(email: string): Promise<void> {
    const key = RedisKeys.loginFail(email);
    const count = await cache.incr(key);
    if (count === 1) {
      await cache.expire(key, RedisTTL.loginFail);
    }
  }

  private requireName(value: unknown): string {
    if (typeof value !== "string") {
      throw new AppError("Name is required", 400);
    }
    const name = value.trim();
    if (name.length < 2 || name.length > 50) {
      throw new AppError("Name must be between 2 and 50 characters", 400);
    }
    return name;
  }

  private requireEmail(value: unknown): string {
    if (typeof value !== "string" || !value.trim()) {
      throw new AppError("Email is required", 400);
    }
    const email = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError("Invalid email format", 400);
    }
    return email;
  }

  private requirePassword(value: unknown): string {
    if (typeof value !== "string") {
      throw new AppError("Password is required", 400);
    }
    if (value.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400);
    }
    return value;
  }
}
