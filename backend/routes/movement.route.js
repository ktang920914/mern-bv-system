import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { deleteMovement, getMovements, movement, updateMovement } from '../controllers/movement.controller.js';

const router = express.Router();

router.post('/movement', verifyToken, movement)
router.get('/getmovements', getMovements)
router.delete('/delete/:movementId', verifyToken, deleteMovement)
router.put('/update/:movementId', verifyToken, updateMovement)

export default router;