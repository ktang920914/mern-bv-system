import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { getOutputs } from '../controllers/output.controller.js'

const router = express.Router()

router.get('/getoutputs', verifyToken, getOutputs)

export default router