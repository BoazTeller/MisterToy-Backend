import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'

import { userService } from '../user/user.service.js'
import { loggerService } from '../../services/logger.service.js'

const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234')
const saltRounds = 10

export const authService = {
    signup,
    login,
    getLoginToken,
    validateToken
}

async function login(username, password) {
    if (!username || !password) {
        loggerService.warn('Login called with missing fields')
        throw new Error('Missing required login data')
    }

    try {
        const user = await userService.getByUsername(username)
        if (!user) throw new Error('Invalid username or password')

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) throw new Error('Invalid username or password')

        const { password: _, ...userWithoutPassword } = user
        return userWithoutPassword
    } catch (err) {
        loggerService.warn(`Login failed for username: ${username}`)
        throw err
    }
}

async function signup(username, password, fullname) {
    if (!username || !password || !fullname) {
        loggerService.warn('Signup called with missing fields')
        throw new Error('Missing required signup data')
    }

    try {
        const existingUser = await userService.getByUsername(username)
        if (existingUser) throw new Error('Username already taken')

        const hashedPassword = await bcrypt.hash(password, saltRounds)
        return await userService.add({
            username,
            password: hashedPassword,
            fullname,
            isAdmin: false
        })
    } catch (err) {
        loggerService.error('Signup failed:', err)
        throw err
    }
}

function getLoginToken(user) {
    // User only contains non-sensitive data
    const safeUser = {
        _id: user._id,
        fullname: user.fullname,
        isAdmin: !!user.isAdmin
    }

    return cryptr.encrypt(JSON.stringify(safeUser))
}

function validateToken(token) {
    try {
        const json = cryptr.decrypt(token)
        return JSON.parse(json)
    } catch (err) {
        loggerService.warn('Invalid login token')
        return null
    }
}