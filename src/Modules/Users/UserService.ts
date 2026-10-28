import { AppError } from "../../utils/AppError";
import { UserRepository } from "../../Repository/UserRepository";
import { AuthService, PublicUser } from "../Auth/AuthService";
import { IUser } from "../../model/User";

export class UserService {
  private readonly users = new UserRepository();
  private readonly authService = new AuthService();

  public async getMe(user: IUser): Promise<PublicUser> {
    return this.authService.toPublicUser(user);
  }

  public async updateMe(user: IUser, nameInput: unknown): Promise<PublicUser> {
    if (typeof nameInput !== "string") {
      throw new AppError("Name is required", 400);
    }
    const name = nameInput.trim();
    if (name.length < 2 || name.length > 50) {
      throw new AppError("Name must be between 2 and 50 characters", 400);
    }

    const updated = await this.users.updateName(String(user._id), name);
    if (!updated) {
      throw new AppError("User not found", 404);
    }

    return this.authService.toPublicUser(updated);
  }
}
