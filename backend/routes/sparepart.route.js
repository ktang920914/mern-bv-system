import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { deleteSparepart, getSpareparts, sparepart, updateSparepart } from '../controllers/sparepart.controller.js'

const router = express.Router()

router.post('/sparepart', verifyToken, sparepart)
router.get('/getSpareparts', verifyToken, getSpareparts)
router.delete('/delete/:sparepartId', verifyToken, deleteSparepart)
router.put('/update/:sparepartId', verifyToken, updateSparepart)

export default router