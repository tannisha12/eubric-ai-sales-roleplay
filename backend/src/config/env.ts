import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// Loads the shared .env file at the monorepo root (created in Phase 1).
dotenv.config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });

function parsePort(raw: string | undefined): number {
  const fallback = 4000;

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(
      `Invalid PORT value: "${raw}". PORT must be an integer between 1 and 65535.`
    );
  }

  return parsed;
}

function readAppVersion(): string {
  const pkgPath = path.resolve(__dirname, "../../package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  appName: "Eubric AI Sales Roleplay",
  appVersion: readAppVersion(),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
} as const;

export const isProduction = env.nodeEnv === "production";
