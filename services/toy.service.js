import fs from 'fs/promises'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'

const TOYS_FILE = './data/toys.json'
const PAGE_SIZE = 3
const gToys = utilService.readJsonFile(TOYS_FILE)

export const toyService = {
    query,
    getById,
    save,
    remove
}

async function query(queryOptions = {}) {
    const { filterBy = {}, sortBy = {}, pagination = {}} = queryOptions

    // Fallback safety file gets corrupted
    let toysToReturn = Array.isArray(gToys) ? [...gToys] : []

    toysToReturn = _filterToys(toysToReturn, filterBy)
    toysToReturn = _sortToys(toysToReturn, sortBy)
    toysToReturn = _paginateToys(toysToReturn, pagination)

    return toysToReturn
}

async function getById(toyId) {
    const toy = gToys.find(toy => toy._id === toyId)
    if (!toy) return Promise.reject(`Toy with ID ${toyId} not found`)

    return toy
}

async function save(toyToSave) {
    if (toyToSave._id) {
        const toyIdx = gToys.findIndex(toy => toy._id === toyToSave._id)
        if (toyIdx === -1) throw new Error(`Toy with ID ${toyToSave._id} not found`)

        gToys[toyIdx] = {
            ...gToys[toyIdx],
            ...toyToSave,
            updatedAt: Date.now()
        }
    } else {
        toyToSave._id = utilService.makeId()
        toyToSave.createdAt = Date.now()
        toyToSave.updatedAt = Date.now()
        gToys.unshift(toyToSave)
    }

    await  _saveToysToFile()
    return toyToSave
}

async function remove(toyId) {
    const idx = gToys.findIndex(toy => toy._id === toyId)
    if (idx === -1) throw new Error(`Toy with ID ${toyId} not found`)

    gToys.splice(idx, 1)

    // Returning true if _saveToysToFile() write succeeded.
    // If _saveToysToFile() fails, the rejection automatically propagates up,
    // and this function will also reject
    await _saveToysToFile()
}

function _filterToys(toys, filterBy) {
    let filteredToys = [...toys]

    if (filterBy.txt) {
        const regex = new RegExp(filterBy.txt, 'i')
        filteredToys = filteredToys.filter(toy => regex.test(toy.name))
    }

    if (typeof filterBy.inStock === 'boolean') {
        filteredToys = filteredToys.filter(toy => toy.inStock === filterBy.inStock)
    }

    if (Array.isArray(filterBy.labels) && filterBy.labels.length) {
        filteredToys = filteredToys.filter(toy =>
            filterBy.labels.every(label => toy?.labels?.includes(label))
        )
    }

    if (+filterBy.minPrice > 0 || +filterBy.maxPrice > 0) {
        const min = (+filterBy.minPrice > 0) ? +filterBy.minPrice : 1
        const max = (+filterBy.maxPrice > 0) ? +filterBy.maxPrice : Infinity
    
        // Filter by price only if max price is higher than min price
        if (max >= min) {
            filteredToys = filteredToys.filter(toy => toy.price >= min && toy.price <= max)
        }
    }

    return filteredToys
}

function _sortToys(toys, sortBy) {
    const sortedToys = [...toys]
    const { sortField, sortDir } = sortBy

    if (sortDir !== 1 && sortDir !== -1) return sortedToys

    if (sortField === 'name') {
        sortedToys.sort((toy1, toy2) =>
            toy1.name.localeCompare(toy2.name) * sortDir
        )
    } else if (['price', 'createdAt'].includes(sortField)) {
        sortedToys.sort((toy1, toy2) =>
            (toy1[sortField] - toy2[sortField]) * sortDir
        )
    }

    return sortedToys
}

function _paginateToys(toys, pagination) {
    const pageIdx = pagination.pageIdx || 0
    const pageSize = pagination.pageSize || PAGE_SIZE
    const startIdx = pageIdx * pageSize

    return toys.slice(startIdx, startIdx + pageSize)
}

async function _saveToysToFile() {
    const toysStr = JSON.stringify(gToys, null, 4)

    try {
        // Promise resolves silenty (need to import fs/promises)
        await fs.writeFile(TOYS_FILE, toysStr)
    } catch (err) {
        loggerService.error('Failed to write toys to file', err)
        throw err
    }
}