import { authService } from './auth.service.js'
import { loggerService } from '../../services/logger.service.js'

export async function login(req, res) {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).send({ err: 'Missing required signup fields' })
    }

    try {
        const user = await authService.login(username, password)
        const loginToken = authService.getLoginToken(user)

        res.cookie('loginToken', loginToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24
        })

        loggerService.info(`User logged in: ${user.fullname}`)
        // Using status/send instead of json for more clarity
        res.status(200).send(user)
    } catch (err) {
        loggerService.error('Login failed:', err)
        res.status(401).send({ err: 'Invalid credentials' })
    }
}

export async function signup(req, res) {
    const { username, password, fullname } = req.body

    if (!username || !password || !fullname) {
        return res.status(400).send({ err: 'Missing required signup fields' })
    }

    try {
        const account = await authService.signup(username, password, fullname)
        // Auth service returns account without password, but just for double safety
        const { password: _, ...accountWithoutPassword } = account
        loggerService.info(`New account created: ${JSON.stringify(accountWithoutPassword)}`)

        const user = await authService.login(username, password)
        const loginToken = authService.getLoginToken(user)

        res.cookie('loginToken', loginToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24
        })

        res.status(200).send(user)
    } catch (err) {
        loggerService.error('Signup failed:', err)
        res.status(500).send({ err: 'Signup failed' })
    }
}

export async function logout(req, res) {
    try {
        res.clearCookie('loginToken')
        res.status(200).send({ msg: 'Logged out successfully'})
    } catch (err) {
        loggerService.error('Logout failed')
        res.status(500).send({ err: 'Logout failed' })
    }
}