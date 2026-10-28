import bcrypt from "bcryptjs";
import crypto from "crypto";
import { SESSION_DAYS } from "../../constants";
import { AppError } from "../../utils/AppError";
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

    const user = await this.users.findByEmailWithPassword(email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new AppError("Invalid email or password", 401);
    }

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

    return { user: this.toPublicUser(user), token, expiresAt };
  }

  public async logout(token: string): Promise<void> {
    await this.sessions.deleteByToken(token);
  }

  public async logoutAll(userId: string): Promise<void> {
    await this.sessions.deleteAllByUserId(userId);
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
