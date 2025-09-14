import express from 'express'
import { deleteLog, getLogs } from '../controllers/activity.controller.js'

const router = express.Router()

router.get('/getlogs', getLogs)
router.delete('/delete/:logId', deleteLog)

export default router