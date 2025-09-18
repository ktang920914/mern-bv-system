import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { deleteMaintenance, getMaintenances, maintenance, updateMaintenance } from '../controllers/maintenance.controller.js';


const router = express.Router();

router.post('/job', verifyToken, maintenance)
router.get('/getmaintenances', getMaintenances)
router.delete('/delete/:maintenanceId', verifyToken, deleteMaintenance)
router.put('/update/:maintenanceId', verifyToken, updateMaintenance)

export default router;