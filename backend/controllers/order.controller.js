import Activity from "../models/activity.model.js";
import Order from "../models/order.model.js";
import Cost from "../models/cost.model.js";

// 定义月份字段数组，可以在多个函数中使用
const monthFields = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export const order = async (req, res, next) => {
    const { date, doc, docno, supplier, item, quantity, amount, costcategory, status } = req.body
    try {
        const amountNum = Number(amount);
        
        const newOrder = new Order({
            date,
            doc,
            docno,
            supplier,
            item,
            quantity,
            amount: amountNum,
            costcategory,
            status
        })
        
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create order',
            detail: `${req.user.username} create order`
        })
        
        await newActivity.save()
        await newOrder.save()

        // 只有当状态为"Complete"时才计算成本
        if (status === "Complete") {
            const orderDate = new Date(date);
            const year = orderDate.getFullYear().toString();
            const month = orderDate.getMonth();
            
            const monthField = monthFields[month];
            
            let costDoc = await Cost.findOne({ year, type: costcategory });
            
            if (!costDoc) {
                costDoc = new Cost({
                    year,
                    type: costcategory,
                    [monthField]: amountNum, 
                    total: amountNum 
                });
            } else {
                const currentMonthValue = Number(costDoc[monthField] || 0);
                const currentTotalValue = Number(costDoc.total || 0);
                
                costDoc[monthField] = currentMonthValue + amountNum;
                costDoc.total = currentTotalValue + amountNum;
            }
            
            await costDoc.save();
        }

        res.status(201).json({message:'Register successfully'})
    } catch (error) {
        next(error)
    }
}

export const getorders = async (req, res, next) => {
    try {
        const orders = await Order.find().sort({updatedAt: -1})
        res.status(200).json(orders)
    } catch (error) {
        next(error)
    }
}

export const deleteOrder = async (req, res, next) => {
    try {
        const orderToDelete = await Order.findById(req.params.orderId);
        
        if (!orderToDelete) {
            return res.status(404).json('Order not found');
        }

        // 只有当状态为"Complete"时才从成本中减去
        if (orderToDelete.status === "Complete") {
            const orderDate = new Date(orderToDelete.date);
            const year = orderDate.getFullYear().toString();
            const month = orderDate.getMonth();
            
            const monthField = monthFields[month];
            
            const costDoc = await Cost.findOne({ year, type: orderToDelete.costcategory });
            
            if (costDoc) {
                const currentMonthValue = Number(costDoc[monthField] || 0);
                const currentTotalValue = Number(costDoc.total || 0);
                const amountToSubtract = Number(orderToDelete.amount || 0);
                
                costDoc[monthField] = Math.max(0, currentMonthValue - amountToSubtract);
                costDoc.total = Math.max(0, currentTotalValue - amountToSubtract);
                
                if (costDoc.total === 0) {
                    await Cost.findByIdAndDelete(costDoc._id);
                } else {
                    await costDoc.save();
                }
            }
        }

        await Order.findByIdAndDelete(req.params.orderId);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete order',
            detail: `${req.user.username} delete order`
        });
        
        await newActivity.save();
        res.status(200).json('Order is deleted');
    } catch (error) {
        next(error);
    }
}

export const updateOrder = async (req, res, next) => {
    try {
        const oldOrder = await Order.findById(req.params.orderId);
        
        if (!oldOrder) {
            return res.status(404).json('Order not found');
        }

        // 如果旧订单状态是"Complete"，需要从成本中减去
        if (oldOrder.status === "Complete") {
            const oldOrderDate = new Date(oldOrder.date);
            const oldYear = oldOrderDate.getFullYear().toString();
            const oldMonth = oldOrderDate.getMonth();
            
            const oldMonthField = monthFields[oldMonth];
            
            const oldCostDoc = await Cost.findOne({ year: oldYear, type: oldOrder.costcategory });
            
            if (oldCostDoc) {
                const oldMonthValue = Number(oldCostDoc[oldMonthField] || 0);
                const oldTotalValue = Number(oldCostDoc.total || 0);
                const oldAmount = Number(oldOrder.amount || 0);
                
                oldCostDoc[oldMonthField] = Math.max(0, oldMonthValue - oldAmount);
                oldCostDoc.total = Math.max(0, oldTotalValue - oldAmount);
                
                if (oldCostDoc.total === 0) {
                    await Cost.findByIdAndDelete(oldCostDoc._id);
                } else {
                    await oldCostDoc.save();
                }
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(req.params.orderId, {
            $set: {
                date: req.body.date,
                supplier: req.body.supplier,
                doc: req.body.doc,
                docno: req.body.docno,
                item: req.body.item,
                quantity: req.body.quantity,
                amount: req.body.amount,
                costcategory: req.body.costcategory,
                status: req.body.status
            },
        }, { new: true });

        // 只有当新状态为"Complete"时才计算成本
        if (req.body.status === "Complete") {
            const newOrderDate = new Date(req.body.date || updatedOrder.date);
            const newYear = newOrderDate.getFullYear().toString();
            const newMonth = newOrderDate.getMonth();
            const newMonthField = monthFields[newMonth];
            const newAmount = Number(req.body.amount || updatedOrder.amount);
            
            let newCostDoc = await Cost.findOne({ year: newYear, type: req.body.costcategory || updatedOrder.costcategory });
            
            if (!newCostDoc) {
                newCostDoc = new Cost({
                    year: newYear,
                    type: req.body.costcategory || updatedOrder.costcategory,
                    [newMonthField]: newAmount,
                    total: newAmount
                });
            } else {
                const newMonthValue = Number(newCostDoc[newMonthField] || 0);
                const newTotalValue = Number(newCostDoc.total || 0);
                
                newCostDoc[newMonthField] = newMonthValue + newAmount;
                newCostDoc.total = newTotalValue + newAmount;
            }
            
            await newCostDoc.save();
        }

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update order',
            detail: `${req.user.username} update order`
        });
        
        await newActivity.save();
        res.status(200).json(updatedOrder);
    } catch (error) {
        next(error);
    }
}