import fs from 'fs'
import { utilService } from './util.service.js'

const TOYS_FILE = './data/toys.json'
const gToys = utilService.readJsonFile(TOYS_FILE)

export const toyService = {
    query,
    getById,
    save,
    remove
}

function query() {
    return Promise.resolve(gToys)
}

function getById(toyId) {
    const toy = gToys.find(toy => toy._id === toyId)
    if (!toy) return Promise.reject(`Toy with ID ${toyId} not found`)

    return Promise.resolve(toy)
}

function save(toyToSave) {
    if (toyToSave._id) {
        const toyIdx = gToys.findIndex(toy => toy._id === toyToSave._id)
        if (toyIdx === -1) return Promise.reject(`Toy with ID ${toyToSave._id} not found`)

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

    return _saveToysToFile().then(() => toyToSave)
}

function remove(toyId) {
    const idx = gToys.findIndex(toy => toy._id === toyId)
    if (idx === -1) return Promise.reject(`Toy with ID ${toyId} not found`)

    gToys.splice(idx, 1)
    return _saveToysToFile()
}

function _saveToysToFile() {
    return new Promise((resolve, reject) => {
        const toysStr = JSON.stringify(gToys, null, 4)

        fs.writeFile(TOYS_FILE, toysStr, err => {
            if (err) {
                loggerService.error('Failed to write toys to file', err)
                return reject(err)
            }

            resolve()
        })
    })
}
