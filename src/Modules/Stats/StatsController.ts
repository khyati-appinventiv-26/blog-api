import { NextFunction, Request, Response } from "express";
import { StatsService } from "./StatsService";

export class StatsController {
  private readonly statsService = new StatsService();

  public getStats = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.statsService.getStats();
      res.setHeader("X-Cache", result.cache);
      res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      next(err);
    }
  };
}
