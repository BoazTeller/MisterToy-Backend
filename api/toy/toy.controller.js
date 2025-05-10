import { ObjectId } from 'mongodb'

import { toyService } from './toy.service.js'
import { loggerService } from '../../services/logger.service.js'

export async function getToys(req, res) {
    const queryOptions = _buildQueryOptions(req.query)
    
    try {
        const toys = await toyService.query(queryOptions)
        res.status(200).send(toys) 
    } catch (err) {
        loggerService.error('GET /api/toy → Failed to fetch toys', err)
        res.status(500).send('Cannot process request')
    }
}

export async function getToyById(req, res) {  
    const { toyId } = req.params

    if (!ObjectId.isValid(toyId)) {
        loggerService.warn(`GET /api/toy → Invalid toy ID: ${toyId}`)
        return res.status(400).send({ err: 'Invalid toy ID format' })
    }

    try {
        const toy = await toyService.getById(toyId)
        res.status(200).send(toy)
    } catch (err) {
        loggerService.error(`GET /api/toy/${toyId || 'unknown'} → ${err}`)
        res.status(404).send('Resource not found') 
    }
}

export async function addToy(req, res) {
    const { name, price, inStock, labels, imgUrl } = req.body

    if (typeof name !== 'string' || !name.trim() || typeof price !== 'number' || typeof inStock !== 'boolean') {
        return res.status(400).send('Invalid toy data')
    }

    const toy = {
        name: name.trim(),
        price,
        inStock,
        labels: Array.isArray(labels) ? labels : [],
        imgUrl: typeof imgUrl === 'string' ? imgUrl : ''
    }

    try {
        const savedToy = await toyService.add(toy)
        res.status(201).send(savedToy) 
    } catch (err) {
        loggerService.error('POST /api/toy → Failed to save toy', err)
        res.status(500).send('Could not save resource')
    }
}

export async function updateToy(req, res) {
    const { _id, name, price, inStock, labels, imgUrl } = req.body

    if (
        !ObjectId.isValid(_id) ||
        typeof name !== 'string' || !name.trim() ||
        typeof price !== 'number' ||
        typeof inStock !== 'boolean'
    ) {
        return res.status(400).send('Invalid toy data')
    }

    const toy = {
        _id,
        name: name.trim(),
        price,
        inStock,
        labels: Array.isArray(labels) ? labels : [],
        imgUrl: typeof imgUrl === 'string' ? imgUrl : ''
    }

    try {
        const savedToy = await toyService.update(toy)
        res.status(200).send(savedToy)
    } catch (err) {
        loggerService.error(`PUT /api/toy/${_id} → Failed to update toy`, err)
        res.status(500).send('Could not update resource')
    }
}

export async function removeToy(req, res) {
    const { toyId } = req.params

    if (!ObjectId.isValid(toyId)) {
        loggerService.warn(`DELETE /api/toy → Invalid toy ID format: ${toyId}`)
        return res.status(400).send({ err: 'Invalid toy ID format' })
    }

    try {
        const wasRemoved = await toyService.remove(toyId)
        if (!wasRemoved) return res.status(404).send({ err: 'Toy not found' })

        res.status(200).send({ msg: 'Toy deleted successfully', toyId })
    } catch (err) {
        loggerService.error(`DELETE /api/toy/${toyId} → Failed`, err)
        res.status(500).send({ err: 'Cannot process request' })
    }
}

export async function addToyMsg(req, res) {
    const { loggedinUser } = req
    const toyId = req.params.id
    const { txt } = req.body

    if (!ObjectId.isValid(toyId)) {
        loggerService.warn(`POST /api/toy/:id/msg → Invalid ObjectId: ${toyId}`)
        return res.status(400).send({ err: 'Invalid toy ID' })
    }

    if (typeof txt !== 'string' || !txt.trim()) {
        loggerService.warn('POST /api/toy/:id/msg → Missing or invalid message text')
        return res.status(400).send({ err: 'Message text is required' })
    }

    const msg = {
        txt: txt.trim(),
        by: loggedinUser,
        createdAt: Date.now()
    }

    try {
        const savedMsg = await toyService.addToyMsg(toyId, msg)
        res.status(200).send(savedMsg)
    } catch (err) {
        loggerService.error(`POST /api/toy/${toyId}/msg → Failed to add message`, err)
        res.status(500).send({ err: 'Failed to add message' })
    }
}

export async function removeToyMsg(req, res) {
    const { id: toyId, msgId } = req.params

    if (!ObjectId.isValid(toyId)) {
        loggerService.warn(`DELETE /api/toy/${toyId}/msg/${msgId} → Invalid toy ID`)
        return res.status(400).send({ err: 'Invalid toy ID format' })
    }

    if (!msgId || typeof msgId !== 'string' || !msgId.trim()) {
        loggerService.warn(`DELETE /api/toy/${toyId}/msg/${msgId} → Invalid message ID`)
        return res.status(400).send({ err: 'Invalid message ID' })
    }

    try {
        const removedId = await toyService.removeToyMsg(toyId, msgId)
        res.status(200).send({ removedId })
    } catch (err) {
        loggerService.error(`DELETE /api/toy/${toyId}/msg/${msgId} → Failed`, err)
        res.status(500).send({ err: 'Failed to remove message' })
    }
}

function _buildQueryOptions(rawQueryParams = {}) {
    const {
        txt,
        inStock,
        labels,
        sortField,
        sortDir,
        pageIdx,
        pageSize,
        minPrice,
        maxPrice
    } = rawQueryParams
    
    return {
        filterBy: {
            txt: txt?.trim() || '',
            inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
            labels: Array.isArray(labels) ? labels
                : typeof labels === 'string'
                ? labels.split(',')
                : [],
            minPrice: +minPrice || -Infinity,
            maxPrice: +maxPrice || Infinity
        },
        sortBy: {
            sortField: sortField || '',
            sortDir: +sortDir || 1
        },
        pagination: {
            pageIdx: +pageIdx || 0,
            pageSize: +pageSize || 3
        }
    }
}