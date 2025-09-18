// routes/case.route.js
import express from 'express';
import { getCases, updateCaseStats } from '../controllers/case.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/getcases', verifyToken, getCases);
router.post('/updatecasestats', verifyToken, updateCaseStats);

export default router;