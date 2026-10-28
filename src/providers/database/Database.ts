import mongoose from "mongoose";
import { config } from "../../constants";

export class Database {
  public async connect(): Promise<void> {
    if (!config.mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected (db: ${config.appName})`);
  }
}
