import { RedisKeys, RedisTTL } from "../../constants";
import { AppError } from "../../utils/AppError";
import { cache } from "../../utils/redisCache";
import { UserRepository } from "../../Repository/UserRepository";
import { AuthService, PublicUser } from "../Auth/AuthService";
import { IUser } from "../../model/User";

export class UserService {
  private readonly users = new UserRepository();
  private readonly authService = new AuthService();

  public async getMe(
    user: IUser
  ): Promise<{ data: PublicUser; cache: "HIT" | "MISS" }> {
    const userId = String(user._id);
    const cached = await cache.getJSON<PublicUser>(RedisKeys.user(userId));
    if (cached) {
      return { data: cached, cache: "HIT" };
    }

    const fresh = this.authService.toPublicUser(user);
    await cache.setJSON(RedisKeys.user(userId), fresh, RedisTTL.user);
    return { data: fresh, cache: "MISS" };
  }

  public async updateMe(user: IUser, nameInput: unknown): Promise<PublicUser> {
    if (typeof nameInput !== "string") {
      throw new AppError("Name is required", 400);
    }
    const name = nameInput.trim();
    if (name.length < 2 || name.length > 50) {
      throw new AppError("Name must be between 2 and 50 characters", 400);
    }

    const userId = String(user._id);
    const updated = await this.users.updateName(userId, name);
    if (!updated) {
      throw new AppError("User not found", 404);
    }

    await cache.delKeys(RedisKeys.user(userId));
    return this.authService.toPublicUser(updated);
  }
}
