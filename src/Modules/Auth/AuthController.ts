import { NextFunction, Request, Response } from "express";
import { AuthService } from "./AuthService";

export class AuthController {
  private readonly authService = new AuthService();

  public signup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.authService.signup(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.authService.login({
        email: req.body?.email,
        password: req.body?.password,
        userAgent: req.get("user-agent") || "",
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          expiresAt: result.expiresAt,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.sessionToken;
      const user = req.user;
      if (!token || !user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      await this.authService.logout(token, String(user._id));
      res.status(200).json({ success: true, message: "Logged out" });
    } catch (err) {
      next(err);
    }
  };

  public logoutAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      await this.authService.logoutAll(String(req.user._id));
      res.status(200).json({
        success: true,
        message: "Logged out from all devices",
      });
    } catch (err) {
      next(err);
    }
  };
}
