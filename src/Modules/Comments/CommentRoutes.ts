import { Router } from "express";
import { CommentController } from "./CommentController";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware";

export class CommentRoutes {
  public readonly router: Router;
  private readonly controller = new CommentController();
  private readonly authMiddleware = new AuthMiddleware();

  constructor() {
    this.router = Router();
    this.register();
  }

  private register(): void {
    this.router.delete(
      "/:id",
      this.authMiddleware.handle,
      this.controller.remove
    );
  }
}
