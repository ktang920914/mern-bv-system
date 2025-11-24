import express from 'express'
import { deleteSupplier, getSuppliers, supplier, updateSupplier } from '../controllers/purchase.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.post('/supplier', verifyToken, supplier)
router.get('/getsuppliers', verifyToken, getSuppliers)
router.delete('/delete/:supplierId', verifyToken, deleteSupplier)
router.put('/update/:supplierId', verifyToken, updateSupplier)

export default router