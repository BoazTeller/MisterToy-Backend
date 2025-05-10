import fs from 'fs'

export const loggerService = {
    debug(...args) {
        log('DEBUG', ...args)
    },
    info(...args) {
        log('INFO', ...args)
    },
    warn(...args) {
        log('WARN', ...args)
    },
    error(...args) {
        log('ERROR', ...args)
    }
}

const logsDir = './logs'
const logFilePath = `${logsDir}/backend.log`

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir)
}

function log(level, ...args) {
    const formattedTime = new Date().toLocaleString('he')
    const parts = args.map(arg =>
        typeof arg === 'string' || isError(arg) ? arg : JSON.stringify(arg)
    )
    const line = `${formattedTime} - ${level} - ${parts.join(' | ')}\n`

    console.log(line)
    fs.appendFile(logFilePath, line, err => {
        if (err) console.error('FATAL: Cannot write to log file')
    })
}

function isError(value) {
    return value && value.stack && value.message
}