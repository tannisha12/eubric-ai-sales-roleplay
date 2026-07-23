import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs.toFixed(1)}ms`
    );
  });

  next();
}
