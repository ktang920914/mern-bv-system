import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { getPlannings, updatePlanning } from '../controllers/planning.controller.js'

const router = express.Router()

router.get('/getplannings', verifyToken, getPlannings)
router.put('/update/:planningId', verifyToken, updatePlanning)

export default router