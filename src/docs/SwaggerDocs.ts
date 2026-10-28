import { Express, Request, Response, Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./openapi";

export class SwaggerDocs {
  public static mount(app: Express): void {
    app.get("/api/docs.json", (_req: Request, res: Response) => {
      res.status(200).json(openApiSpec);
    });

    const router = Router();
    router.use(swaggerUi.serve);
    router.get("/", swaggerUi.setup(openApiSpec, { customSiteTitle: "Blog API Docs" }));
    app.use("/api/docs", router);
  }
}
