import { config } from "../constants";
import { App } from "../app/App";
import { Database } from "../providers/database/Database";
import { redisProvider } from "../providers/redis/RedisProvider";

export class Server {
  private readonly app: App;
  private readonly database: Database;

  constructor() {
    this.app = new App();
    this.database = new Database();
  }

  public async start(): Promise<void> {
    await this.database.connect();
    await redisProvider.connect();

    this.app.getExpressApp().listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  }
}
