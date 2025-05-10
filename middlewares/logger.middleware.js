import { loggerService } from "../services/logger.service.js"

export function log(req, _, next) {
    loggerService.info(
        `[${req.method}] ${req.originalUrl}`
    )
    
    next()
}