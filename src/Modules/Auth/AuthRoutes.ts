import { Router } from "express";
import { AuthController } from "./AuthController";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware";

export class AuthRoutes {
  public readonly router: Router;
  private readonly controller = new AuthController();
  private readonly authMiddleware = new AuthMiddleware();

  constructor() {
    this.router = Router();
    this.register();
  }

  private register(): void {
    this.router.post("/signup", this.controller.signup);
    this.router.post("/login", this.controller.login);
    this.router.post(
      "/logout",
      this.authMiddleware.handle,
      this.controller.logout
    );
    this.router.post(
      "/logout-all",
      this.authMiddleware.handle,
      this.controller.logoutAll
    );
  }
}
