import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  date: { type: String, required: true },
  code: { type: String, required: true },
  activity: { type: String, required: true },
  status: { type: String, default: 'Incomplete' },
  repeatType: { type: String, default: 'none' },
  repeatInterval: { type: Number, default: 1 },
  repeatEndDate: { type: String },
  isRecurring: { type: Boolean, default: false },
  isGenerated: { type: Boolean, default: false },
  parentTodo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Todo',
    default: null 
  },
  userId: { type: String, required: true }
}, { timestamps: true });

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;