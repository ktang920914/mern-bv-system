import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { deleteExtruder, extruder, getExtruders, updateExtruder } from '../controllers/extruder.controller.js'

const router = express.Router()

router.post('/extruder', verifyToken, extruder)
router.get('/getExtruders', getExtruders)
router.delete('/delete/:extruderId', verifyToken, deleteExtruder)
router.put('/update/:extruderId', verifyToken, updateExtruder)

export default router