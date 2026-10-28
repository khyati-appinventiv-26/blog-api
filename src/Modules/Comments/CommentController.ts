import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { CommentService } from "./CommentService";

export class CommentController {
  private readonly commentService = new CommentService();

  private paramId(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
  }

  public create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }
      const data = await this.commentService.create(
        req.user,
        this.paramId(req.params.id),
        req.body?.text
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public list = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.commentService.list(
        this.paramId(req.params.id),
        req.query
      );
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  };

  public remove = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }
      await this.commentService.remove(req.user, this.paramId(req.params.id));
      res.status(200).json({ success: true, message: "Comment deleted" });
    } catch (err) {
      next(err);
    }
  };
}
