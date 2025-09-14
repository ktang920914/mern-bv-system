import express from 'express'
import { deleteUser, getUsers, login, logout, register, updateUser } from '../controllers/auth.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.post('/login', login)
router.post('/register', register)
router.post('/logout', verifyToken, logout)
router.get('/getusers', getUsers)
router.delete('/delete/:userId', verifyToken, deleteUser)
router.put('/update/:userId', verifyToken, updateUser)

export default router