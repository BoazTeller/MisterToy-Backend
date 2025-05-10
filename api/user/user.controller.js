import { userService } from './user.service.js'
import { loggerService } from '../../services/logger.service.js'

export async function getUsers(req, res) {
    try {
        const users = await userService.query()
        res.status(200).send(users)
    } catch (err) {
        loggerService.error('GET /api/user → Failed to get users', err)
        res.status(500).send({ err: 'Failed to get users'})
    }
}

export async function getUserById(req, res) {
    const { id } = req.params

    if (!id || id === 'undefined' || id === 'null') {
        loggerService.warn(`GET /api/user → Invalid user ID: ${id || 'unknown'}`)
        return res.status(400).send('Invalid user ID')
    }

    try {
        const user = await userService.getById(id)
        if (!user) return res.status(404).send('User not found')

        res.status(200).send(user)
    } catch (err) {
        loggerService.error(`GET /api/user/${id} → Failed`, err)
        res.status(500).send({ err: 'Failed to get user' })
    }
}

export async function updateUser(req, res) {
    const user = req.body

    if (!user?._id) {
        loggerService.warn('PUT /api/user → Missing user ID in body')
        return res.status(400).send('Missing user ID')
    }

    try {
        const savedUser = await userService.update(user)
        res.status(200).send(savedUser)
    } catch (err) {
        loggerService.error(`PUT /api/user/${user._id} → Failed`, err)
        res.status(500).send({ err: 'Failed to update user' })
    }
}

export async function deleteUser(req, res) {
    const { id } = req.params

    if (!id) {
        loggerService.warn('DELETE /api/user → Missing user ID')
        return res.status(400).send('Missing user ID')
    }

    try {
        const wasDeleted = await userService.remove(id)
        if (!wasDeleted) return res.status(404).send('User not found')

        res.status(200).send({ msg: 'User deleted successfully', id })
    } catch (err) {
        loggerService.error(`DELETE /api/user/${id} → Failed`, err)
        res.status(500).send({ err: 'Failed to delete user' })
    }
}