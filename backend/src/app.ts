import cors from "cors";
import express, { type Application } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { requestLogger } from "./middleware/requestLogger";
import { chatRouter } from "./routes/chat.routes";
import { healthRouter } from "./routes/health.routes";

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  app.use("/health", healthRouter);
  app.use("/api/chat", chatRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
