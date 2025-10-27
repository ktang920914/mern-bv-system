// utils/recurringTodos.js
import Activity from "../models/activity.model.js";
import Todo from "../models/todo.model.js";
import { errorHandler } from "../utils/error.js";

// 工具函数 - 生成重复待办事项
export async function generateRecurringTodos(mainTodo) {
  try {
    const { _id, date, repeatType, repeatInterval = 1, repeatEndDate, userId } = mainTodo;
    
    const startDate = new Date(date);
    const endDate = repeatEndDate ? new Date(repeatEndDate) : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
    
    const recurringDates = calculateRecurringDates(startDate, endDate, repeatType, repeatInterval);
    
    if (recurringDates.length === 0) return;

    const recurringTodos = recurringDates.map(recurringDate => ({
      date: recurringDate.toISOString().split('T')[0],
      code: mainTodo.code,
      section: mainTodo.section,
      description: mainTodo.description,
      im: mainTodo.im,
      checkpoint: mainTodo.checkpoint,
      tool: mainTodo.tool,
      reactionplan: mainTodo.reactionplan,
      status: 'Incomplete',
      repeatType: 'none',
      isRecurring: false,
      parentTodo: _id,
      userId: userId
    }));

    await Todo.insertMany(recurringTodos);
    console.log(`Generated ${recurringTodos.length} recurring todos`);
  } catch (error) {
    console.error('Error generating recurring todos:', error);
    throw error;
  }
}

// 工具函数 - 计算重复日期
function calculateRecurringDates(startDate, endDate, repeatType, interval = 1) {
  const dates = [];
  let currentDate = new Date(startDate);
  
  // 跳过第一个日期（已经是主待办事项的日期）
  switch (repeatType) {
    case 'daily':
      currentDate.setDate(currentDate.getDate() + interval);
      break;
    case 'weekly':
      currentDate.setDate(currentDate.getDate() + (7 * interval));
      break;
    case 'monthly':
      currentDate.setMonth(currentDate.getMonth() + interval);
      break;
    case 'yearly':
      currentDate.setFullYear(currentDate.getFullYear() + interval);
      break;
    case 'custom':
      currentDate.setMonth(currentDate.getMonth() + interval);
      break;
    default:
      return dates;
  }
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    
    switch (repeatType) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * interval));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
      case 'custom':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      default:
        break;
    }
  }
  
  return dates;
}

// 控制器函数
export const todo = async (req, res, next) => {
  try {
    const {
      date,
      code,
      section,
      description,
      im,
      checkpoint,
      tool,
      reactionplan,
      status = 'Incomplete',
      repeatType = 'none',
      repeatInterval = 1,
      repeatEndDate
    } = req.body;

    // 验证必填字段
    if (!date || !code || !section || !description || !im || !checkpoint || !tool || !reactionplan) {
      return next(errorHandler(400, 'All fields are required'));
    }

    // 创建主待办事项
    const todoData = {
      date,
      code,
      section,
      description,
      im,
      checkpoint,
      tool,
      reactionplan,
      status,
      repeatType,
      repeatInterval,
      repeatEndDate,
      isRecurring: repeatType !== 'none',
      userId: req.user.id
    };

    const todo = new Todo(todoData);
    const savedTodo = await todo.save();

    // 记录活动日志
    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
      date: currentDate,
      activity: 'Create todo',
      detail: `${req.user.username}`
    });
    await newActivity.save();

    // 如果是重复待办事项，生成未来的实例
    if (repeatType !== 'none') {
      try {
        await generateRecurringTodos(savedTodo);
      } catch (error) {
        console.error('Error generating recurring todos:', error);
        // 即使生成重复待办失败，也返回成功，但记录错误
      }
    }

    res.status(201).json({
      todo: savedTodo
    });

  } catch (error) {
    next(error);
  }
};

export const getTodos = async (req, res, next) => {
    try {
        const todos = await Todo.find().sort({updatedAt:-1})
        res.status(200).json(todos)
    } catch (error) {
        next(error)
    }
};

export const getCalendarTodos = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const userId = req.user.id;

    let query = { userId };
    
    // 如果提供了日期范围，过滤数据
    if (start && end) {
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    const todos = await Todo.find(query)
      .select('date code description section status repeatType')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      todos
    });

  } catch (error) {
    next(error);
  }
};

export const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.todoId);
    
    if (!todo) {
      return next(errorHandler(404, 'Todo not found'));
    }

    // 如果是父待办事项，删除所有相关的重复待办
    if (todo.isRecurring) {
      await Todo.deleteMany({ parentTodo: req.params.todoId });
    }

    // 删除主待办事项
    await Todo.findByIdAndDelete(req.params.todoId);

    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
        date: currentDate,
        activity: 'Delete todo',
        detail: `${req.user.username}`
    })
    await newActivity.save()
    res.status(200).json('Todo is deleted')
  } catch (error) {
    next(error)
  }
}

export const updateTodo = async (req, res, next) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.todoId, {
      $set: {
        date: req.body.date,
        code: req.body.code,
        section: req.body.section,
        description: req.body.description,
        im: req.body.im,
        checkpoint: req.body.checkpoint,
        tool: req.body.tool,
        reactionplan: req.body.reactionplan,
        status: req.body.status,
        repeatType: req.body.repeatType,
        repeatInterval: req.body.repeatInterval,
        repeatEndDate: req.body.repeatEndDate
      },
    }, { new: true });

    if (!updatedTodo) {
      return next(errorHandler(404, 'Todo not found'));
    }

    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
      date: currentDate,
      activity: 'Update todo',
      detail: `${req.user.username}`
    });
    await newActivity.save();

    res.status(200).json(updatedTodo);

  } catch (error) {
    next(error);
  }
};