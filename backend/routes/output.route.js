import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { calculateOutputs } from '../controllers/output.controller.js';

const router = express.Router()

router.get('/calculate', verifyToken, calculateOutputs);

export default router