import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import fs from "fs";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "info";
};

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const getTransports = (serviceName: string) => {
  const transports: winston.transport[] = [
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, `%DATE%-${serviceName}-error.log`),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: "error",
      auditFile: path.join(logsDir, `.${serviceName}-error-audit.json`),
      utc: true,
      createSymlink: false,
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, `%DATE%-${serviceName}-combined.log`),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      auditFile: path.join(logsDir, `.${serviceName}-combined-audit.json`),
      utc: true,
      createSymlink: false,
    }),
  ];

  if (process.env.NODE_ENV !== "production") {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  return transports;
};

export const createLogger = (serviceName: string) => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || level(),
    levels,
    format,
    defaultMeta: { service: serviceName },
    transports: getTransports(serviceName),
    exitOnError: false,
  });

  logger.transports.forEach((transport) => {
    if (transport instanceof winston.transports.DailyRotateFile) {
      transport.on("error", (error) => {
        console.error("Logger transport error:", error);
      });
    }
  });

  return logger;
};
