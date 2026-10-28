import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./openapi";

export class SwaggerDocs {
  public static mount(app: Express): void {
    app.get("/api/docs.json", (_req: Request, res: Response) => {
      res.json(openApiSpec);
    });

    app.use(
      "/api/docs",
      swaggerUi.serve,
      swaggerUi.setup(openApiSpec, {
        customSiteTitle: "Blog API Docs",
      })
    );
  }
}
