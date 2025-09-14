import express from 'express';
import { getCosts } from '../controllers/cost.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/getcosts', verifyToken, getCosts)

export default router;