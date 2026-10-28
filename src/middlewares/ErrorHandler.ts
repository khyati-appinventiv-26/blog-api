import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export class ErrorHandler {
  public handle(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message =
      err instanceof Error ? err.message : "Internal server error";

    if (!(err instanceof AppError)) {
      console.error("Unhandled error:", err);
    }

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
