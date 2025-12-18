import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { deleteOther, getOthers, other, updateOther } from '../controllers/other.controller.js'


const router = express.Router()

router.post('/other', verifyToken, other)
router.get('/getOthers', verifyToken, getOthers)
router.delete('/delete/:otherId', verifyToken, deleteOther)
router.put('/update/:otherId', verifyToken, updateOther)

export default router