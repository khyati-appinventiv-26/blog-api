import express, {
  Express,
  NextFunction,
  Request,
  Response,
} from "express";
import { HealthRoutes } from "./Modules/Health/HealthRoutes";
import { AuthRoutes } from "./Modules/Auth/AuthRoutes";
import { UserRoutes } from "./Modules/Users/UserRoutes";
import { PostRoutes } from "./Modules/Posts/PostRoutes";
import { CommentRoutes } from "./Modules/Comments/CommentRoutes";
import { ErrorHandler } from "./middlewares/errorHandler";

export class App {
  private readonly app: Express;
  private readonly errorHandler: ErrorHandler;

  constructor() {
    this.app = express();
    this.errorHandler = new ErrorHandler();
    this.setup();
  }

  private setup(): void {
    this.app.use(express.json());

    this.app.use("/api", new HealthRoutes().router);
    this.app.use("/api/auth", new AuthRoutes().router);
    this.app.use("/api/users", new UserRoutes().router);
    this.app.use("/api/posts", new PostRoutes().router);
    this.app.use("/api/comments", new CommentRoutes().router);

    this.app.use(
      (err: unknown, req: Request, res: Response, next: NextFunction) =>
        this.errorHandler.handle(err, req, res, next)
    );
  }

  public getExpressApp(): Express {
    return this.app;
  }
}
