import { authService } from '../api/auth/auth.service.js'
import { loggerService} from '../services/logger.service.js'

export function requireAuth(req, res, next) {
    const loginToken = req.cookies?.loginToken
    const loggedinUser = authService.validateToken(loginToken)

    if (!loggedinUser) {
        loggerService.warn('Unauthorized access attempt')
        return res.status(401).send('Not Authenticated!')
    }

    req.loggedinUser = loggedinUser
    next()
}

export function requireAdmin(req, res, next) {
    const loginToken = req.cookies?.loginToken
    const loggedinUser = authService.validateToken(loginToken)

    if (!loggedinUser?.isAdmin) {
        loggerService.warn(
            `${loggedinUser?.fullname || 'Unknown user'} attempted admin action`
        )
        return res.status(403).send('Not Authorized')
    }

    next()
}