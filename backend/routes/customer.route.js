import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { createSchedule, deleteSchedule, getSchedules, updateSchedule } from '../controllers/customer.controller.js'

const router = express.Router()

router.post('/customerjob', verifyToken, createSchedule)
router.get('/getcustomerjobs', verifyToken, getSchedules)
router.delete('/delete/:customerjobId', verifyToken, deleteSchedule)
router.put('/update/:customerjobId', verifyToken, updateSchedule)

export default router