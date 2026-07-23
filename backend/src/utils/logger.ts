type LogLevel = "info" | "warn" | "error" | "debug";

function write(level: LogLevel, message: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string): void => write("info", message),
  warn: (message: string): void => write("warn", message),
  error: (message: string): void => write("error", message),
  debug: (message: string): void => write("debug", message),
};
