/**
 * -------------------------------------------------------------------------------------------------------------
 * NOTE: log manager function
 * 
 * AUTHOR: pravats459@gmail.com
 * VERSION: 1.1.0
 * -------------------------------------------------------------------------------------------------------------
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

/**
 * Create log format
 */
const logFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

/**
 * Create logger
 */
const transports: winston.transport[] = [];

// Console transport always enabled
transports.push(
    new winston.transports.Console({
        level: 'info',
    })
);

// Only use file transport if not on Vercel
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
    const transport: DailyRotateFile = new DailyRotateFile({
        filename: `${process.env.LOG_FOLDER}${process.env.LOG_FILE}`, // e.g., 'logs/app-%DATE%.log'
        datePattern: 'YYYY-MM-DD-HH',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
    });

    transports.push(transport);
}

const logger = winston.createLogger({
    format: logFormat,
    transports,
});

export default logger;
