import path from "path";
import winston from "winston";
import "winston-daily-rotate-file";

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || "development";
    const isDevelopment = env === "development";
    return isDevelopment ? "debug" : "debug";
};

const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    // winston.format.colorize({ all: true }),
    winston.format.printf((info) => `${info.level}: ${info.message}`)
);

const transports = [];

if (process.env.NODE_ENV === "production") {
    const fileTransport = new (winston.transports.DailyRotateFile)({
        filename: path.join(process.env.HOME ?? '', "/logs/arkchat-backend-%DATE%.log"),
        zippedArchive: true,
        maxFiles: "30d",
    });
    transports.push(fileTransport);
} else {
    transports.push(new winston.transports.Console());
}

const Logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

export default Logger;
