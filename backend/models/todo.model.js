// models/Todo.js
import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
    date:{
        type: String, // 开始日期
    },
    code:{
        type: String,
    },
    activity:{
        type: String,
    },
    status:{
        type: String,
    },
    // 新增重复设置字段
    repeatType: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'],
        default: 'none'
    },
    repeatInterval: {
        type: Number, // 对于自定义间隔，比如每3个月
        default: 1
    },
    repeatEndDate: {
        type: String, // 重复结束日期
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    parentTodo: {
        type: mongoose.Schema.Types.ObjectId, // 对于重复的todo，指向原始todo
        ref: 'Todo'
    }
},{timestamps: true})

const Todo = mongoose.model('Todo', todoSchema)

export default Todo