import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { deleteMaterial, getMaterials, material, updateMaterial } from '../controllers/material.controller.js';

const router = express.Router();

router.post('/material', verifyToken, material)
router.get('/getmaterials', getMaterials)
router.delete('/delete/:materialId', verifyToken, deleteMaterial)
router.put('/update/:materialId', verifyToken, updateMaterial)

export default router;