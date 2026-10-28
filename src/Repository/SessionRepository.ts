import { ISession, Session } from "../model/Session";

export class SessionRepository {
  public async create(data: {
    userId: string;
    token: string;
    expiresAt: Date;
    userAgent: string;
  }): Promise<ISession> {
    return Session.create(data);
  }

  public async findByToken(token: string): Promise<ISession | null> {
    return Session.findOne({ token });
  }

  public async deleteByToken(token: string): Promise<ISession | null> {
    return Session.findOneAndDelete({ token });
  }

  public async deleteAllByUserId(userId: string): Promise<void> {
    await Session.deleteMany({ userId });
  }

  public async findAllByUserId(userId: string): Promise<ISession[]> {
    return Session.find({ userId });
  }
}
