import express from 'express';
import { deleteJob, getJobCodesByYear, getJobs, job, updateJob } from '../controllers/job.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/job', verifyToken, job)
router.get('/getjobs', verifyToken, getJobs)
router.delete('/delete/:jobId', verifyToken, deleteJob)
router.put('/update/:jobId', verifyToken, updateJob)
router.get('/get-codes-by-year', verifyToken, getJobCodesByYear)

export default router;