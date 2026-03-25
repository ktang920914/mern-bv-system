import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { customer, deleteCustomer, getCustomers, updateCustomer } from '../controllers/client.controller.js'

const router = express.Router()

router.post('/customer', verifyToken, customer)
router.get('/getcustomers', verifyToken, getCustomers)
router.delete('/delete/:customerId', verifyToken, deleteCustomer)
router.put('/update/:customerId', verifyToken, updateCustomer)


export default router