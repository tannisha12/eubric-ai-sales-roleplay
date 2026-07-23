import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

export function startServer(): void {
  const app = createApp();

  app.listen(env.port, () => {
    logger.info(`${env.appName} listening on port ${env.port} [${env.nodeEnv}]`);
  });
}
