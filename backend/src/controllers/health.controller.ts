import type { Request, Response } from "express";
import { env } from "../config/env";

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    service: env.appName,
    version: env.appVersion,
    timestamp: new Date().toISOString(),
  });
}
