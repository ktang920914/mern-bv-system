import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { deleteTodo, getTodos, todo, updateTodo } from '../controllers/todo.controller.js'

const router = express.Router()

router.post('/todo', verifyToken, todo)
router.get('/getTodos', getTodos)
router.delete('/delete/:todoId', verifyToken, deleteTodo)
router.put('/update/:todoId', verifyToken, updateTodo)

export default router