// External modules
import express from 'express' 

// Controllers 
import {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} from './user.controller.js'

// Middlewares
import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'

// Router setup
const userRouter = express.Router()

// User route definitions
userRouter.get('/', getUsers)
userRouter.get('/:id', getUserById)
userRouter.put('/:id', requireAuth, updateUser)
userRouter.delete('/:id', requireAuth, requireAdmin, deleteUser)

export const userRoutes = userRouter