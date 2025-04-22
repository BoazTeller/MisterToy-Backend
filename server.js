import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'

import { loggerService } from './services/logger.service.js'
import { toyService } from './services/toy.service.js'

const app = express()

const corsOptions = {
    origin: [
        'http://127.0.0.1:3030',
        'http://localhost:3030',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
    ],
    credentials: true,
}

// app.use(express.static('public'))s
app.use(cookieParser())
app.use(express.json())
app.use(cors(corsOptions))

/// *** Temporarily added res status explanations next to each res status to remind myself for future best practice ***
app.get('/api/toy', (req, res) => {
    const queryOptions = buildQueryOptions(req.query)

    toyService.query(queryOptions)
        .then(toys => res.status(200).send(toys)) // 200 - successful GET request
        .catch(err => {
            loggerService.error('GET /api/toy → Failed to fetch toys', err)
            res.status(500).send('Cannot process request') // 500 - Internal server error (only when backend fails)
        })
})

function buildQueryOptions(rawQueryParams = {}) {
    const { txt, inStock, labels, sortField, sortDir, pageIdx, pageSize } = rawQueryParams

    return {
        filterBy: {
            txt: txt?.trim() || '',
            inStock: typeof inStock === 'boolean' ? inStock : undefined,
            labels: labels || []
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

app.get('/api/toy/:toyId', (req, res) => {
    const { toyId } = req.params

    toyService.getById(toyId)
        .then(toy => res.status(200).send(toy)) 
        .catch(err => {
            loggerService.error(`GET /api/toy/${toyId} → ${err}`)
            res.status(404).send('Resource not found') // 404 - toy ID not found (client error, not server)
        })
})

app.post('/api/toy', (req, res) => {
    // Extract only relevent fields from body
    const { name, price, inStock, labels, imgUrl } = req.body

    // Need further data validation in future
    if (!name || typeof price !== 'number' || typeof inStock !== 'boolean') {
        return res.status(400).send('Invalid toy data')
    }

    // Apply safety defaults if needed
    const toy = {
        name,
        price,
        inStock,
        labels: Array.isArray(labels) ? labels : [],
        imgUrl: typeof imgUrl === 'string' ? imgUrl : ''
    }

    toyService.save(toy)
        .then(savedToy => {
            toy.msgs = ['Hello', `I’m ${toy.name}`, 'How are you?'] 
            res.status(201).send(savedToy) // 201 - standard for successful POST that creates something
        }) 
        .catch(err => {
            loggerService.error('POST /api/toy → Failed to save toy', err)
            res.status(500).send('Could not save resource') // 500 - Internal server error, write to file failed or other unexpected error
        })
})

app.put('/api/toy', (req, res) => {
    // Extract only relevent fields from body
    const { _id, name, price, inStock, labels, imgUrl } = req.body

    // Need further data validation in future
    if (!_id || !name || typeof price !== 'number' || typeof inStock !== 'boolean') {
        return res.status(400).send('Invalid toy data')
    }

    // Apply safety defaults if needed
    const toy = {
        _id,
        name,
        price,
        inStock,
        labels: Array.isArray(labels) ? labels : [],
        imgUrl: typeof imgUrl === 'string' ? imgUrl : ''
    }

    toyService.save(toy)
        .then(savedToy => res.status(200).send(savedToy)) // 200 - OK, successfully updated
        .catch(err => {
            loggerService.error('PUT /api/toy → Failed to update toy', err)
            res.status(500).send('Could not update resource') // 500 - Internal server error
        })
})

app.delete('/api/toy/:toyId', (req, res) => {
    const { toyId } = req.params

    toyService.remove(toyId)
        .then(() => res.status(200).send({ msg: 'Toy deleted successfully', toyId }))
        .catch(err => {
            loggerService.error(`DELETE /api/toy/${toyId} → Failed`, err)
            res.status(500).send('Cannot process request')
        })
})

// Fallback route - only used in production to serve frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'))

    app.get('/**', (req, res) => {
        res.sendFile(path.resolve('public/index.html'))
    })
}

// Server listen
const PORT = 3030
app.listen(PORT, err => {
    if (err) loggerService.error('Failed to start server:', err)
    else loggerService.info(`Server is running at: http://127.0.0.1:${PORT}/`)
})