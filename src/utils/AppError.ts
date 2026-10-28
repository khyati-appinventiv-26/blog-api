export class AppError extends Error {
  public readonly statusCode: number;
  public readonly success = false as const;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
