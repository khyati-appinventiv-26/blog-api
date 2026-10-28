import { config } from "./constants";
import { App } from "./app";
import { Database } from "./providers/database/Database";

class Server {
  private readonly app: App;
  private readonly database: Database;

  constructor() {
    this.app = new App();
    this.database = new Database();
  }

  public async start(): Promise<void> {
    await this.database.connect();

    this.app.getExpressApp().listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  }
}

new Server().start().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
