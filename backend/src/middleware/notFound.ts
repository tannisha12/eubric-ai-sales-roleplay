import type { NextFunction, Request, Response } from "express";
import type { HttpError } from "../types/http";

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  const error: HttpError = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}
