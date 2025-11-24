import express from 'express'
import { deleteRecord, getRecords, record, updateRecord } from '../controllers/transaction.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.post('/record', verifyToken, record)
router.get('/getrecords', verifyToken, getRecords)
router.delete('/delete/:recordId', verifyToken, deleteRecord)
router.put('/update/:recordId',verifyToken, updateRecord)

export default router