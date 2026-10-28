import { Router } from "express";
import { StatsController } from "./StatsController";

export class StatsRoutes {
  public readonly router: Router;
  private readonly controller = new StatsController();

  constructor() {
    this.router = Router();
    this.register();
  }

  private register(): void {
    this.router.get("/", this.controller.getStats);
  }
}
