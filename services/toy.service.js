import { ObjectId } from 'mongodb'
import { dbService } from './db.service.js'
import { loggerService } from './logger.service.js'

export const toyService = {
    query,
    getById,
    add,
    update,
    remove
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
        // Returns a result object like: { acknowledged: true, deletedCount: 1 }
        // If no document was found, deletedCount will be 0
        return await toyCollection.deleteOne({ _id: ObjectId.createFromHexString(toyId) })
    } catch (err) {
        loggerService.error(`Cannot remove toy ${toyId}`)
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
