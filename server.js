import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'

import { loggerService } from './services/logger.service.js'

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

app.get('/api', (req, res) => {
    res.send('hello')
})

app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

// Server listen
const PORT = 3030
app.listen(PORT, err => {
    if (err) loggerService.error('Failed to start server:', err)
    else loggerService.info(`Server is running at: http://127.0.0.1:${PORT}/`)
})
