import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { loggerService } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

export const toyService = {
    query,
    getById,
    add,
    update,
    remove,
    addToyMsg,
    removeToyMsg
}

async function query(queryOptions = {}) {
    const { filterBy = {}, sortBy = {}, pagination = {} } = queryOptions
    const criteria = _buildCriteria(filterBy)
    const sort = _buildSort(sortBy)
    const { pageIdx = 0, pageSize = 3 } = pagination

    try {
        const toyCollection = await dbService.getCollection('toy')
        const toys = await toyCollection.find(criteria)
            .sort(sort)
            .skip(pageIdx * pageSize)
            .limit(pageSize)
            .toArray()

        return toys
    } catch (err) {
        loggerService.error('Cannot query toys', err)
        throw err
    }
}

async function getById(toyId) {
    try {
        const toyCollection = await dbService.getCollection('toy')
        const toy = await toyCollection.findOne({ _id: ObjectId.createFromHexString(toyId) })
        return toy
    } catch (err) {
        loggerService.error(`Toy with ID ${toyId} not found`)
        throw err
    }
}

async function add(toy) {
    try {
        const toyCollection = await dbService.getCollection('toy')
        await toyCollection.insertOne(toy)
        return toy
    } catch (err) {
        loggerService.error('Could not add toy', err)
        throw err
    }
}

async function update(toy) {
    try {
        const { _id, ...toyToUpdate } = toy
        const toyCollection = await dbService.getCollection('toy')
        await toyCollection.updateOne({ _id: ObjectId.createFromHexString(_id) }, { $set: toyToUpdate })
        return toy
    } catch (err) {
        loggerService.error(`Could not update toy ${toy?._id}`, err)
        throw err
    }
}

async function remove(toyId) {
    try {
        const toyCollection = await dbService.getCollection('toy')
        const { deletedCount } = await toyCollection.deleteOne({ _id: ObjectId.createFromHexString(toyId) })
        return deletedCount === 1
    } catch (err) {
        loggerService.error(`Cannot remove toy ${toyId}`, err)
        throw err
    }
}

async function addToyMsg(toyId, msg) {
    try {
        msg.id = utilService.makeId()
        msg.createdAt = Date.now()

        const collection = await dbService.getCollection('toy')
        const { modifiedCount } = await collection.updateOne(
            { _id: ObjectId.createFromHexString(toyId) },
            { $push: { msgs: msg } }
        )

        if (!modifiedCount) {
            loggerService.warn(`No toy found with ID ${toyId} to add msg`)
            throw new Error('Toy not found')
        }

        return msg
    } catch (err) {
        loggerService.error(`Cannot add toy msg to ${toyId}`, err)
        throw err
    }
}

async function removeToyMsg(toyId, msgId) {
    try {
        const collection = await dbService.getCollection('toy')
        const { modifiedCount } = await collection.updateOne(
            { _id: ObjectId.createFromHexString(toyId) },
            { $pull: { msgs: { id: msgId } } }
        )

        if (!modifiedCount) {
            loggerService.warn(`No msg ${msgId} found in toy ${toyId}`)
            throw new Error('Message not found')
        }

        return msgId
    } catch (err) {
        loggerService.error(`Cannot remove toy msg from ${toyId}`, err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}

    if (filterBy.txt) {
        criteria.name = { $regex: filterBy.txt, $options: 'i' }
    }

    if (typeof filterBy.inStock === 'boolean') {
        criteria.inStock = filterBy.inStock
    }

    if (Array.isArray(filterBy.labels) && filterBy.labels.length) {
        criteria.labels = { $all: filterBy.labels }
    }

    const min = +filterBy.minPrice || 0
    const max = +filterBy.maxPrice || Infinity
    criteria.price = { $gte: min, $lte: max }

    return criteria
}

function _buildSort(sortBy) {
    const sort = {}

    const isDescending = sortBy.sortDir === -1
    const field = sortBy.sortField

    if (field) {
        sort[field] = isDescending ? -1 : 1
    }

    return sort
}