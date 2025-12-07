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

// 创建待办事项 - 支持多选
export const todo = async (req, res, next) => {
  try {
    const {
      date,
      code,
      selectedCodes,
      activity,
      status = 'Incomplete',
      repeatType = 'none',
      repeatInterval = 1,
      repeatEndDate
    } = req.body;

    if (!date || !activity) {
      return next(errorHandler(400, 'Date and activity are required'));
    }

    // 确定要创建的codes
    const codesToCreate = selectedCodes && Array.isArray(selectedCodes) && selectedCodes.length > 0 
      ? selectedCodes 
      : (code ? [code] : []);

    if (codesToCreate.length === 0) {
      return next(errorHandler(400, 'Please select at least one item'));
    }

    // 批量创建todos
    const todosToCreate = codesToCreate.map(codeItem => ({
      date,
      code: codeItem,
      activity,
      status,
      repeatType,
      repeatInterval,
      repeatEndDate,
      isRecurring: repeatType !== 'none',
      isGenerated: false,
      parentTodo: null,
      userId: req.user.id
    }));

    const createdTodos = await Todo.insertMany(todosToCreate);

    // 如果设置了重复，为每个todo生成重复实例
    if (repeatType !== 'none') {
      for (const todoItem of createdTodos) {
        try {
          await generateRecurringTodos(todoItem);
        } catch (error) {
          console.error('Error generating recurring todos for todo:', todoItem._id, error);
        }
      }
    }

    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
      date: currentDate,
      activity: 'Create todo',
      detail: `${req.user.username}`
    });
    await newActivity.save();

    res.status(201).json({
      success: true,
      todos: createdTodos,
      message: `${createdTodos.length} todo(s) created${repeatType !== 'none' ? ' with recurring instances' : ''}`
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

    // 如果是重复的主todo，删除所有相关todo
    if (todo.isRecurring) {
      await Todo.deleteMany({ parentTodo: req.params.todoId });
    }
    // 如果是生成的子todo，检查父todo是否需要更新
    else if (todo.parentTodo) {
      const childCount = await Todo.countDocuments({ 
        parentTodo: todo.parentTodo, 
        _id: { $ne: req.params.todoId } 
      });
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
      detail: `${req.user.username}`
    });
    await newActivity.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Todo is deleted'
    });
    
  } catch (error) {
    next(error);
  }
};

// 更新待办事项 - 支持多选
export const updateTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.todoId);
    
    if (!todo) {
      return next(errorHandler(404, 'Todo not found'));
    }

    const { selectedCodes, ...updateData } = req.body;
    
    // 如果提供了多选的codes
    if (selectedCodes && Array.isArray(selectedCodes) && selectedCodes.length > 0) {
      // 删除原有的todo（如果是重复的，也删除所有生成的todo）
      if (todo.isRecurring) {
        await Todo.deleteMany({ parentTodo: req.params.todoId });
      }
      
      // 删除当前todo
      await Todo.findByIdAndDelete(req.params.todoId);
      
      // 为每个选中的item code创建新的todo
      const todosToCreate = selectedCodes.map(code => ({
        date: updateData.date || todo.date,
        code: code,
        activity: updateData.activity || todo.activity,
        status: updateData.status || todo.status,
        repeatType: updateData.repeatType || todo.repeatType,
        repeatInterval: updateData.repeatInterval || todo.repeatInterval,
        repeatEndDate: updateData.repeatEndDate || todo.repeatEndDate,
        isRecurring: (updateData.repeatType || todo.repeatType) !== 'none',
        isGenerated: false,
        parentTodo: null,
        userId: req.user.id
      }));
      
      // 批量创建新的todos
      const createdTodos = await Todo.insertMany(todosToCreate);
      
      // 如果设置了重复，为每个新的todo生成重复实例
      if (updateData.repeatType && updateData.repeatType !== 'none') {
        for (const newTodo of createdTodos) {
          try {
            await generateRecurringTodos(newTodo);
          } catch (error) {
            console.error('Error generating recurring todos for todo:', newTodo._id, error);
          }
        }
      }
      
      // 记录活动日志
      const currentDate = new Date().toLocaleString();
      const newActivity = new Activity({
        date: currentDate,
        activity: 'Update todo',
        detail: `${req.user.username}`
      });
      await newActivity.save();
      
      return res.status(200).json({
        success: true,
        message: 'Todo updated to multiple items',
        todos: createdTodos,
        count: createdTodos.length
      });
      
    } else {
      // 原有逻辑：单个todo更新
      const shouldRegenerate = updateData.repeatType && updateData.repeatType !== todo.repeatType;
      
      if (shouldRegenerate && todo.isRecurring) {
        await Todo.deleteMany({ parentTodo: req.params.todoId });
      }

      const updatedTodo = await Todo.findByIdAndUpdate(req.params.todoId, {
        $set: {
          date: updateData.date || todo.date,
          code: updateData.code || todo.code,
          activity: updateData.activity || todo.activity,
          status: updateData.status || todo.status,
          repeatType: updateData.repeatType || todo.repeatType,
          repeatInterval: updateData.repeatInterval || todo.repeatInterval,
          repeatEndDate: updateData.repeatEndDate || todo.repeatEndDate,
          isRecurring: (updateData.repeatType || todo.repeatType) !== 'none'
        },
      }, { new: true });

      if (shouldRegenerate && updateData.repeatType && updateData.repeatType !== 'none') {
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
        detail: `${req.user.username}`
      });
      await newActivity.save();

      return res.status(200).json({
        success: true,
        todo: updatedTodo,
        message: 'Todo updated successfully'
      });
    }

  } catch (error) {
    next(error);
  }
};