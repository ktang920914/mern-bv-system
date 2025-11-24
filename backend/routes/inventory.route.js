import express from 'express'
import { deleteItem, getItems, item, updateItem } from '../controllers/inventory.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.post('/item', verifyToken, item)
router.get('/getitems', verifyToken, getItems)
router.delete('/delete/:itemId', verifyToken, deleteItem)
router.put('/update/:itemId', verifyToken, updateItem)

export default router