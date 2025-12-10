import Activity from "../models/activity.model.js";
import Todo from "../models/todo.model.js";
import { errorHandler } from "../utils/error.js";

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

    const codesToCreate = selectedCodes && Array.isArray(selectedCodes) && selectedCodes.length > 0 
      ? selectedCodes 
      : (code ? [code] : []);

    if (codesToCreate.length === 0) {
      return next(errorHandler(400, 'Please select at least one item'));
    }

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

export const getTodos = async (req, res, next) => {
  try {
    const todos = await Todo.find().sort({updatedAt:-1});
    res.status(200).json(todos);
  } catch (error) {
    next(error);
  }
};

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

export const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.todoId);
    
    if (!todo) {
      return next(errorHandler(404, 'Todo not found'));
    }

    if (todo.isRecurring) {
      await Todo.deleteMany({ parentTodo: req.params.todoId });
    }
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

export const updateTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.todoId);
    
    if (!todo) {
      return next(errorHandler(404, 'Todo not found'));
    }

    const { 
      action = 'updateOnly',
      updateType = 'main',
      selectedCodes,
      ...updateData 
    } = req.body;
    
    console.log('Updating todo:', {
      todoId: req.params.todoId,
      action,
      updateType,
      isGenerated: todo.isGenerated,
      parentTodo: todo.parentTodo,
      updateData
    });

    if (updateType === 'instance' && todo.isGenerated) {
      console.log('Updating instance only');
      
      const updatedTodo = await Todo.findByIdAndUpdate(req.params.todoId, {
        $set: {
          date: updateData.date || todo.date,
          status: updateData.status || todo.status,
          code: updateData.code || todo.code,
          activity: updateData.activity || todo.activity
        }
      }, { new: true });

      const currentDate = new Date().toLocaleString();
      const newActivity = new Activity({
        date: currentDate,
        activity: 'Update todo instance',
        detail: `${req.user.username} updated instance: ${req.params.todoId}`
      });
      await newActivity.save();

      return res.status(200).json({
        success: true,
        todo: updatedTodo,
        message: 'Todo instance updated successfully'
      });
    }
    
    const repeatTypeChanged = updateData.repeatType && updateData.repeatType !== todo.repeatType;
    const repeatIntervalChanged = updateData.repeatInterval && updateData.repeatInterval !== todo.repeatInterval;
    const repeatEndDateChanged = updateData.repeatEndDate !== todo.repeatEndDate;
    
    const shouldRegenerate = repeatTypeChanged || repeatIntervalChanged || repeatEndDateChanged;
    
    console.log('Repeat settings changed:', {
      repeatTypeChanged,
      repeatIntervalChanged,
      repeatEndDateChanged,
      shouldRegenerate,
      oldRepeatType: todo.repeatType,
      newRepeatType: updateData.repeatType
    });
    
    if (shouldRegenerate && todo.isRecurring) {
      console.log('Deleting old recurring instances');
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
      }
    }, { new: true });
    
    console.log('Main todo updated:', updatedTodo._id);
    
    if (shouldRegenerate && updatedTodo.isRecurring) {
      console.log('Regenerating recurring todos');
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
      detail: `${req.user.username} updated todo: ${req.params.todoId}`
    });
    await newActivity.save();
    
    return res.status(200).json({
      success: true,
      todo: updatedTodo,
      message: 'Todo updated successfully'
    });

  } catch (error) {
    console.error('Error in updateTodo:', error);
    next(error);
  }
};