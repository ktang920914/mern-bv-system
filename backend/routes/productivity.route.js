import express from 'express'
import { getProductivities, updateProductivity } from '../controllers/productivity.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.get('/getproductivities', verifyToken, getProductivities)
router.put('/update/:productivityId', verifyToken, updateProductivity)

export default router