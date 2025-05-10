import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path, { dirname } from 'path'
import { fileURLToPath  } from 'url'

// Services
import { loggerService } from './services/logger.service.js'

// Routes
import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
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
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
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