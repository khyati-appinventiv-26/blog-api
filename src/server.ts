import { Server } from "./server/Server";

new Server().start().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
