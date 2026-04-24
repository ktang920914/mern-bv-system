import express from 'express'
import { deleteUser, getUsers, login, logout, register, updateUser } from '../controllers/auth.controller.js'
import { verifyToken } from '../utils/verifyUser.js'
import { requireRole } from '../utils/authorize.js'

const router = express.Router()

router.post('/login', login)
router.post('/register', register)
router.post('/logout', verifyToken, logout)
router.get('/getusers', verifyToken, requireRole('admin'), getUsers)
router.delete('/delete/:userId', verifyToken, requireRole('admin'), deleteUser)
router.put('/update/:userId', verifyToken, requireRole('admin'), updateUser)

export default router
