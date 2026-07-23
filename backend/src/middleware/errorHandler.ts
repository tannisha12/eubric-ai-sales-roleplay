import type { NextFunction, Request, Response } from "express";
import { isProduction } from "../config/env";
import type { HttpError } from "../types/http";
import { logger } from "../utils/logger";

// Express identifies error-handling middleware by its 4-argument signature,
// so `next` must stay in the parameter list even though it's unused.
export function errorHandler(
  err: HttpError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;

  logger.error(`${req.method} ${req.originalUrl} -> ${statusCode} ${err.message}`);

  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
    ...(isProduction ? {} : { stack: err.stack }),
  });
}
