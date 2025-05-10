// External modules
import express from 'express'

// Controllers
import {
    getToys,
    getToyById,
    addToy,
    updateToy,
    removeToy,
    addToyMsg,
    removeToyMsg
} from './toy.controller.js'

// Middlewares
import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

// Router setup
const toyRouter = express.Router()

// Toy route definitions
toyRouter.get('/', log, getToys)             
toyRouter.get('/:id', getToyById)
toyRouter.post('/', requireAuth, addToy)
toyRouter.put('/:id', requireAuth, updateToy)
toyRouter.delete('/:id', requireAdmin, requireAuth, removeToy)

// Toy msg route definitions
toyRouter.post('/:id/msg', requireAuth, addToyMsg)
toyRouter.delete('/:id/msg/:msgId', requireAdmin, requireAuth, removeToyMsg)

export const toyRoutes = toyRouter