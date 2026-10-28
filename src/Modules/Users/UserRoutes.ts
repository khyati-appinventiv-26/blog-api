import { Router } from "express";
import { UserController } from "./UserController";
import { PostController } from "../Posts/PostController";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware";

export class UserRoutes {
  public readonly router: Router;
  private readonly controller = new UserController();
  private readonly postController = new PostController();
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
    this.router.get(
      "/me/posts",
      this.authMiddleware.handle,
      this.postController.listMine
    );
  }
}

