import { Router } from "express";
import { HealthController } from "./HealthController";

export class HealthRoutes {
  public readonly router: Router;
  private readonly controller: HealthController;

  constructor() {
    this.router = Router();
    this.controller = new HealthController();
    this.register();
  }

  private register(): void {
    this.router.get("/health", (req, res) => this.controller.check(req, res));
  }
}
