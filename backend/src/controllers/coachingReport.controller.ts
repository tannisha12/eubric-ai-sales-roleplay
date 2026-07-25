import type { NextFunction, Request, Response } from "express";
import { generateCoachingReport } from "../services/coachingReport.service";
import type {
  CoachingReportRequestBody,
  CoachingReportResponseBody,
} from "../types/coachingReport";
import type { HttpError } from "../types/http";

export async function postCoachingReport(
  req: Request<unknown, CoachingReportResponseBody, CoachingReportRequestBody>,
  res: Response<CoachingReportResponseBody>,
  next: NextFunction
): Promise<void> {
  const { conversationHistory, persona } = req.body ?? {};

  if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
    const error: HttpError = new Error(
      "`conversationHistory` is required and must be a non-empty array."
    );
    error.statusCode = 400;
    next(error);
    return;
  }

  try {
    const report = await generateCoachingReport(conversationHistory, persona);
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
}
