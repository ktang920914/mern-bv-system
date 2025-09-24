import express from 'express'
import { deleteProduct, getProducts, product, updateProduct } from '../controllers/product.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.post('/product', verifyToken, product)
router.get('/getproducts', getProducts)
router.delete('/delete/:productId', verifyToken, deleteProduct)
router.put('/update/:productId', verifyToken, updateProduct)

export default router