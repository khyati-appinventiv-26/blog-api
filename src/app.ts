import express, {
  Express,
  NextFunction,
  Request,
  Response,
} from "express";
import cookieParser from "cookie-parser";
import { HealthRoutes } from "./Modules/Health/HealthRoutes";
import { ErrorHandler } from "./middlewares/ErrorHandler";

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
    this.app.use(cookieParser());

    const healthRoutes = new HealthRoutes();
    this.app.use("/api", healthRoutes.router);

    this.app.use(
      (err: unknown, req: Request, res: Response, next: NextFunction) =>
        this.errorHandler.handle(err, req, res, next)
    );
  }

  public getExpressApp(): Express {
    return this.app;
  }
}
