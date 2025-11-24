import express from 'express'
import { deleteLog, getLogs } from '../controllers/activity.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.get('/getlogs', verifyToken, getLogs)
router.delete('/delete/:logId', verifyToken, deleteLog)

export default router