import chalk from 'chalk';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'log';

const colors: Record<LogLevel, chalk.Chalk> = {
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  debug: chalk.magenta,
  log: chalk.white,
};

const icons: Record<LogLevel, string> = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    debug: '🐛',
    log: '📝',
};

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    let logMessage = `${icons[level]}  ${chalk.gray(timestamp)} ${colors[level](`[${level.toUpperCase()}]`)} ${message}`;
    if (data) {
        const jsonData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        logMessage += `\n${chalk.gray(jsonData)}`;
    }
    return logMessage;
}

const logger = {
    info: (message: string, data?: unknown) => {
        console.log(formatMessage('info', message, data));
    },
    warn: (message: string, data?: unknown) => {
        console.warn(formatMessage('warn', message, data));
    },
    error: (message: string, data?: unknown) => {
        console.error(formatMessage('error', message, data));
    },
    debug: (message: string, data?: unknown) => {
        console.debug(formatMessage('debug', message, data));
    },
    log: (message: string, data?: unknown) => {
        console.log(formatMessage('log', message, data));
    },
};

export default logger; 