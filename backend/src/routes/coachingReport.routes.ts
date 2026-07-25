import { Router } from "express";
import { postCoachingReport } from "../controllers/coachingReport.controller";

export const coachingReportRouter = Router();

coachingReportRouter.post("/", postCoachingReport);
