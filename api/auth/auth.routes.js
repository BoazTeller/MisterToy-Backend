// External modules
import express from 'express'

// Controllers
import { 
    login, 
    signup, 
    logout 
} from './auth.controller.js'

// Router setup
const authRouter = express.Router()

// Auth route definitions
authRouter.post('/login', login)
authRouter.post('/signup', signup)
authRouter.post('/logout', logout)

export const authRoutes = authRouter