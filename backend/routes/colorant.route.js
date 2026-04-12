import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { createColorant, getColorants, updateColorant, deleteColorant } from '../controllers/colorant.controller.js'

const router = express.Router()

router.post('/colorantjob', verifyToken, createColorant)
router.get('/getcolorantjobs', verifyToken, getColorants)
router.put('/update/:colorantjobId', verifyToken, updateColorant)
router.delete('/delete/:colorantjobId', verifyToken, deleteColorant)

export default router