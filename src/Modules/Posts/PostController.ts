import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { PostService } from "./PostService";

export class PostController {
  private readonly postService = new PostService();

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
      const data = await this.postService.create(req.user, req.body ?? {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.postService.getPublishedById(
        this.paramId(req.params.id)
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }
      const data = await this.postService.update(
        req.user,
        this.paramId(req.params.id),
        req.body ?? {}
      );
      res.status(200).json({ success: true, data });
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
      await this.postService.remove(req.user, this.paramId(req.params.id));
      res.status(200).json({ success: true, message: "Post deleted" });
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
      const result = await this.postService.listPublished(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  };

  public listMine = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }
      const data = await this.postService.listMine(req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
