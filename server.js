import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path, { dirname } from 'path'
import { fileURLToPath  } from 'url'

// Services
import { loggerService } from './services/logger.service.js'

// Routes
import { toyService } from './services/toy.service.js'
import { toyRoutes } from './api/toy/toy.routes.js'

// Suport for __dirname in ES modules
const __filename = fileURLToPath (import.meta.url)
const __dirname = dirname(__filename)

// App setup
const app = express()
const isProduction = process.env.NODE_ENV === 'production'

// Middleware
app.use(cookieParser())
app.use(express.json())

if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'public')))
} else {
    const corsOptions = {
        origin: [
            'http://127.0.0.1:3030',
            'http://localhost:3030',
            'http://127.0.0.1:5173',
            'http://localhost:5173',
        ],
        credentials: true,
    }
    app.use(cors(corsOptions))
}

// API Routes

/// *** Temporarily added res status explanations next to each res status to remind myself for future best practice ***
app.get('/api/toy', async (req, res) => {
    const queryOptions = _buildQueryOptions(req.query)

    try {
        const toys = await toyService.query(queryOptions)
        res.status(200).send(toys) // 200 - successful GET request
    } catch (err) {
        loggerService.error('GET /api/toy → Failed to fetch toys', err)
        res.status(500).send('Cannot process request') // 500 - Internal server error (only when backend fails)
    }
})

app.get('/api/toy/:toyId', async (req, res) => {
    const { toyId } = req.params

    try {
        const toy = await toyService.getById(toyId)
        res.status(200).send(toy)
    } catch (err) {
        loggerService.error(`GET /api/toy/${toyId} → ${err}`)
        res.status(404).send('Resource not found') // 404 - toy ID not found (client error, not server)
    }
})

app.post('/api/toy', async (req, res) => {
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

    try {
        const savedToy = await toyService.add(toy)
        toy.msgs = ['Hello', `I’m ${toy.name}`, 'How are you?'] 
        res.status(201).send(savedToy) // 201 - standard for successful POST that creates something
    } catch (err) {
        loggerService.error('POST /api/toy → Failed to save toy', err)
        res.status(500).send('Could not save resource') // 500 - Internal server error, write to file failed or other unexpected error
    }
})

app.put('/api/toy', async (req, res) => {
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

    try {
        const savedToy = await toyService.update(toy)
        res.status(200).send(savedToy)
    } catch (err) {
        loggerService.error('PUT /api/toy → Failed to update toy', err)
        res.status(500).send('Could not update resource') // 500 - Internal server error
    }
})

app.delete('/api/toy/:toyId', async (req, res) => {
    const { toyId } = req.params

    try {
        await toyService.remove(toyId)
        res.status(200).send({ msg: 'Toy deleted successfully', toyId })
    } catch (err) {
        loggerService.error(`DELETE /api/toy/${toyId} → Failed`, err)
        res.status(500).send('Cannot process request')
    }
})

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
    
    // Not the most easily readable inStock and labels parsing but it does its job!
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

app.use('/api/toy', toyRoutes)

// Fallback route
if (isProduction) {
    app.get('/*all', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'public/index.html'))
    })
}

// Start server
const port = process.env.PORT || 3030
app.listen(port, (err) => {
    if (err) loggerService.error('Server failed to start', err)
    else loggerService.info(`Server is running on http://localhost:${port}`)
})