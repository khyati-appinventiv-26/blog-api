import { Router } from "express";
import { UserController } from "./UserController";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware";

export class UserRoutes {
  public readonly router: Router;
  private readonly controller = new UserController();
  private readonly authMiddleware = new AuthMiddleware();

  constructor() {
    this.router = Router();
    this.register();
  }

  private register(): void {
    this.router.get("/me", this.authMiddleware.handle, this.controller.getMe);
    this.router.patch(
      "/me",
      this.authMiddleware.handle,
      this.controller.updateMe
    );
  }
}
