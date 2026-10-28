import { Router } from "express";
import { PostController } from "./PostController";
import { CommentController } from "../Comments/CommentController";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware";

export class PostRoutes {
  public readonly router: Router;
  private readonly controller = new PostController();
  private readonly commentController = new CommentController();
  private readonly authMiddleware = new AuthMiddleware();

  constructor() {
    this.router = Router();
    this.register();
  }

  private register(): void {
    this.router.get("/", this.controller.list);
    this.router.post("/", this.authMiddleware.handle, this.controller.create);

    this.router.get("/:id/comments", this.commentController.list);
    this.router.post(
      "/:id/comments",
      this.authMiddleware.handle,
      this.commentController.create
    );

    this.router.get("/:id", this.controller.getById);
    this.router.patch(
      "/:id",
      this.authMiddleware.handle,
      this.controller.update
    );
    this.router.delete(
      "/:id",
      this.authMiddleware.handle,
      this.controller.remove
    );
  }
}
