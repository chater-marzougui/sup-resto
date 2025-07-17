import winston from "winston";

// const logstashHost = process.env.NODE_ENV === "production" ? "logstash" : "localhost";

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    ],
});

const formatter = winston.format.printf(({ level, message, timestamp }) => {
    let msg = `${timestamp} [${level}] : ${message} `;
    return msg;
});

logger.add(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.splat(),
            formatter
        ),
    })
);

logger.on("error", (error) => {
    console.error("Logging error:", error);
    // Optionally implement reconnection logic or alerting mechanisms
});

export default logger;
