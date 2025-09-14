import express from 'express'
import { deleteOrder, getorders, order, updateOrder } from '../controllers/order.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.post('/order', verifyToken, order)
router.get('/getorders', getorders)
router.delete('/delete/:orderId', verifyToken, deleteOrder)
router.put('/update/:orderId', verifyToken, updateOrder)

export default router