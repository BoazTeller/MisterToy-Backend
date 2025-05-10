import { MongoClient } from 'mongodb'
import { loggerService } from './logger.service.js'

export const dbService = {
    getCollection
}

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'toy_db'

var dbConn = null

async function getCollection(collectionName) {
    try {
        const db = await _connect()
        const collection = await db.collection(collectionName)
        return collection
    } catch (err) {
        loggerService.error('Could not fetch Mongo collection', err)
        throw err
    }
}

async function _connect() {
    if (dbConn) return dbConn

    try {
        const client = await MongoClient.connect(url)
        const db = client.db(dbName)
        dbConn = db
        return db
    } catch (err) {
        loggerService.error('Could not connect to DB', err)
        throw err
    }
}