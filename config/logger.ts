/**
 * -------------------------------------------------------------------------------------------------------------
 * NOTE: log manager function
 * 
 * AUTHOR: pravats459@gmail.com
 * VERSION: 1.0.0
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
 * Create rotation transporter
 */
const transport: DailyRotateFile = new DailyRotateFile({
    filename:      `${process.env.LOG_FOLDER}${process.env.LOG_FILE}`,
    datePattern:   'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize:       '20m',
    maxFiles:      '14d',
});

/**
 * Create logger
 */
const logger = winston.createLogger({
    format: logFormat,
    transports: [
        transport,
        new winston.transports.Console({
            level: 'info',
        }),
    ],
});

export default logger;
