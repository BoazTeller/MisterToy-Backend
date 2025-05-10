import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { loggerService } from '../../services/logger.service.js'

export const userService = {
    query,
    getById,
    getByUsername,
    remove,
    update,
    add
}

async function query() {
    try {
        const collection = await dbService.getCollection('user')
        const users = await collection.find().toArray()

        return users.map(({ password: _, ...userWithoutPassword }) => ({
            ...userWithoutPassword,
            createdAt: userWithoutPassword._id.getTimestamp()
        }))
    } catch (err) {
        loggerService.error('Failed to query users', err)
        throw err
    }
}

async function getById(userId) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ _id: ObjectId.createFromHexString(userId) })
        
        if (!user) return null
        
        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
    } catch (err) {
        loggerService.error(`Failed to get user by ID: ${userId}`, err)
        throw err
    }
}

async function getByUsername(username) {
    try {
        const collection = await dbService.getCollection('user')
        return await collection.findOne({ username })
    } catch (err) {
        loggerService.error('Failed to add user', err)
        throw err
    }
}

async function remove(userId) {
    try {
        const collection = await dbService.getCollection('user')
        const { deletedCount } = await collection.deleteOne({ _id: ObjectId.createFromHexString(userId) })
        return deletedCount === 1
    } catch (err) {
        loggerService.error(`Failed to remove user ${userId}`, err)
        throw err
    }
}

async function update(user) {
    try {
        const userToSave = {
            _id: ObjectId.createFromHexString(user._id),
            username: user.username,
            fullname: user.fullname
        }

        const collection = await dbService.getCollection('user')
        await collection.updateOne( { _id: userToSave._id}, { $set: userToSave })
        return userToSave
    } catch (err) {
        loggerService.error(`Failed to update user ${user._id}`, err)
        throw err
    }
}

async function add(user) {
    try {
        const existingUser = await getByUsername(user.username)
        if (existingUser) throw new Error('Username is already taken')

        const userToAdd = {
            username: user.username,
            password: user.password,
            fullname: user.fullname
        }

        const collection = await dbService.getCollection('user')
        await collection.insertOne(userToAdd)

        const { password: _, ...userWithoutPassword } = userToAdd
        return userWithoutPassword
    } catch (err) {
        loggerService.error(`Failed to update user ${user._id}`, err)
        throw err
    }
}

