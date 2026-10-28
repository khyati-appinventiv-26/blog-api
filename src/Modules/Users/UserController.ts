import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { UserService } from "./UserService";

export class UserController {
  private readonly userService = new UserService();

  public getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }
      const result = await this.userService.getMe(req.user);
      res.setHeader("X-Cache", result.cache);
      res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      next(err);
    }
  };

  public updateMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }
      const data = await this.userService.updateMe(req.user, req.body?.name);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
