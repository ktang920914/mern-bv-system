import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { getMovements, movement } from '../controllers/movement.controller.js';

const router = express.Router();

router.post('/movement', verifyToken, movement)
router.get('/getmovements', getMovements)

export default router;