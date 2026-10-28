import { IUser, User } from "../model/User";

export class UserRepository {
  public async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<IUser> {
    return User.create(data);
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  public async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select("+password");
  }

  public async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  public async updateName(id: string, name: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      { name },
      { returnDocument: "after", runValidators: true }
    );
  }
}
