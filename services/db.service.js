import { MongoClient } from 'mongodb'

import { config } from '../config/index.js'
import { loggerService } from './logger.service.js'

let dbConn = null

export const dbService = {
    getCollection
}

async function getCollection(collectionName) {
    try {
        const db = await connect()
        const collection = db.collection(collectionName)

        return collection
    } catch (err) {
        loggerService.error('Could not fetch Mongo collection', err)
        throw err
    }
}

async function connect() {
    if (dbConn) return dbConn

    try {
        const client = await MongoClient.connect(
            config.dbURL, 
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        )

        dbConn = client.db(config.dbName)

        return dbConn
    } catch (err) {
        loggerService.error('Could not connect to DB', err)
        throw err
    }
}