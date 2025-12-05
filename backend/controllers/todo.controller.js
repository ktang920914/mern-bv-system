import Activity from "../models/activity.model.js";
import Todo from "../models/todo.model.js";
import { errorHandler } from "../utils/error.js";

// 工具函数 - 生成重复待办事项
async function generateRecurringTodos(mainTodo) {
  try {
    const { _id, date, code, activity, repeatType, repeatInterval = 1, repeatEndDate, userId } = mainTodo;
    
    const startDate = new Date(date);
    const endDate = repeatEndDate ? new Date(repeatEndDate) : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
    
    const recurringDates = calculateRecurringDates(startDate, endDate, repeatType, repeatInterval);
    
    if (recurringDates.length === 0) return;

    const recurringTodos = recurringDates.map(recurringDate => ({
      date: recurringDate.toISOString().split('T')[0],
      code,
      activity,
      status: 'Incomplete',
      repeatType: 'none',
      isRecurring: false,
      isGenerated: true,
      parentTodo: _id,
      userId
    }));

    await Todo.insertMany(recurringTodos);
    console.log(`Generated ${recurringTodos.length} recurring todos for activity: ${activity}`);
    
    await Todo.findByIdAndUpdate(_id, { isRecurring: true });
    
  } catch (error) {
    console.error('Error generating recurring todos:', error);
    throw error;
  }
}

// 计算重复日期
function calculateRecurringDates(startDate, endDate, repeatType, interval = 1) {
  const dates = [];
  let currentDate = new Date(startDate);
  
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

// 创建待办事项
export const todo = async (req, res, next) => {
  try {
    const {
      date,
      code,
      activity,
      status = 'Incomplete',
      repeatType = 'none',
      repeatInterval = 1,
      repeatEndDate
    } = req.body;

    if (!date || !code || !activity) {
      return next(errorHandler(400, 'All fields are required'));
    }

    const todoData = {
      date,
      code,
      activity,
      status,
      repeatType,
      repeatInterval,
      repeatEndDate,
      isRecurring: repeatType !== 'none',
      isGenerated: false,
      parentTodo: null,
      userId: req.user.id
    };

    const todo = new Todo(todoData);
    const savedTodo = await todo.save();

    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
      date: currentDate,
      activity: 'Create todo',
      detail: `${req.user.username} created todo: ${activity}`
    });
    await newActivity.save();

    if (repeatType !== 'none') {
      try {
        await generateRecurringTodos(savedTodo);
      } catch (error) {
        console.error('Error generating recurring todos:', error);
      }
    }

    res.status(201).json({
      success: true,
      todo: savedTodo,
      message: repeatType !== 'none' ? 'Todo with recurring instances created' : 'Todo created'
    });

  } catch (error) {
    next(error);
  }
};

// 获取所有待办事项
export const getTodos = async (req, res, next) => {
  try {
    const todos = await Todo.find().sort({updatedAt:-1});
    res.status(200).json(todos);
  } catch (error) {
    next(error);
  }
};

// 获取日历待办事项
export const getCalendarTodos = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const userId = req.user.id;

    let query = { userId };
    
    if (start && end) {
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    const todos = await Todo.find(query)
      .select('date code description section status repeatType isGenerated parentTodo activity')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      todos
    });

  } catch (error) {
    next(error);
  }
};

// 删除待办事项
export const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.todoId);
    
    if (!todo) {
      return next(errorHandler(404, 'Todo not found'));
    }

    if (todo.isRecurring) {
      await Todo.deleteMany({ parentTodo: req.params.todoId });
    } else if (todo.parentTodo) {
      const childCount = await Todo.countDocuments({ parentTodo: todo.parentTodo, _id: { $ne: req.params.todoId } });
      if (childCount === 0) {
        await Todo.findByIdAndUpdate(todo.parentTodo, { 
          isRecurring: false, 
          repeatType: 'none',
          repeatEndDate: null
        });
      }
    }

    await Todo.findByIdAndDelete(req.params.todoId);

    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
      date: currentDate,
      activity: 'Delete todo',
      detail: `${req.user.username} deleted todo: ${todo.activity}`
    });
    await newActivity.save();
    
    res.status(200).json({ success: true, message: 'Todo is deleted' });
    
  } catch (error) {
    next(error);
  }
};

// 更新待办事项
export const updateTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.todoId);
    
    if (!todo) {
      return next(errorHandler(404, 'Todo not found'));
    }

    const shouldRegenerate = req.body.repeatType && req.body.repeatType !== todo.repeatType;
    
    if (shouldRegenerate && todo.isRecurring) {
      await Todo.deleteMany({ parentTodo: req.params.todoId });
    }

    const updatedTodo = await Todo.findByIdAndUpdate(req.params.todoId, {
      $set: {
        date: req.body.date,
        code: req.body.code,
        activity: req.body.activity,
        status: req.body.status,
        repeatType: req.body.repeatType,
        repeatInterval: req.body.repeatInterval,
        repeatEndDate: req.body.repeatEndDate,
        isRecurring: req.body.repeatType !== 'none'
      },
    }, { new: true });

    if (shouldRegenerate && req.body.repeatType !== 'none') {
      try {
        await generateRecurringTodos(updatedTodo);
      } catch (error) {
        console.error('Error regenerating recurring todos:', error);
      }
    }

    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
      date: currentDate,
      activity: 'Update todo',
      detail: `${req.user.username} updated todo: ${updatedTodo.activity}`
    });
    await newActivity.save();

    res.status(200).json(updatedTodo);

  } catch (error) {
    next(error);
  }
};