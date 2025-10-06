import Activity from "../models/activity.model.js"
import Movement from "../models/movement.model.js"
import Product from "../models/product.model.js"
import Material from "../models/material.model.js" 
import { errorHandler } from "../utils/error.js"

export const movement = async (req, res, next) => {
    const { date, item, transaction, quantity, user, status } = req.body
    
    try {
        // 解析 item 值（格式：product_colourcode 或 material_materialname）
        const [itemType, itemCode] = item.split('_')
        let stockItem;
        let itemName;

        if (itemType === 'product') {
            // 查找产品
            stockItem = await Product.findOne({ colourcode: itemCode })
            itemName = `Product: ${itemCode}`
        } else if (itemType === 'material') {
            // 查找材料
            stockItem = await Material.findOne({ material: itemCode })
            itemName = `Material: ${itemCode}`
        }

        if (!stockItem) {
            return next(errorHandler(404, `${itemType === 'product' ? 'Product' : 'Material'} not found`))
        }

        const qty = Number(quantity)
        let newBalance;

        if (transaction === 'In') {
            newBalance = stockItem.quantity + qty
        } else if (transaction === 'Out') {
            if (stockItem.quantity < qty) {
                return next(errorHandler(400, 'Insufficient Stock'))
            }
            newBalance = stockItem.quantity - qty
        } else {
            return next(errorHandler(400, 'Invalid transaction type'))
        }

        const newMovement = new Movement({
            date,
            item: itemName,
            transaction,
            quantity: qty,
            user,
            balance: newBalance,
            status
        })

        // 更新库存数量
        stockItem.quantity = newBalance

        await Promise.all([
            newMovement.save(),
            stockItem.save()
        ])

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create movement',
            detail: `${req.user.username} created movement`
        })
        await newActivity.save()
        
        res.status(201).json(newMovement)
    } catch (error) {
        next(error)
    }
}

export const getMovements = async (req,res,next) => {
    try {
        const movements = await Movement.find().sort({createdAt:-1})
        res.status(200).json(movements)
    } catch (error) {
        next(error)
    }
}

export const deleteMovement = async (req, res, next) => {
    try {
        // 获取要删除的记录
        const movementToDelete = await Movement.findById(req.params.movementId);
        if (!movementToDelete) {
            return next(errorHandler(404, 'Movement not found'));
        }

        // 解析item名称来获取类型和代码
        const itemName = movementToDelete.item;
        let itemType, itemCode, stockItem;

        if (itemName.startsWith('Product:')) {
            itemType = 'product';
            itemCode = itemName.replace('Product:', '').trim();
            stockItem = await Product.findOne({ colourcode: itemCode });
        } else if (itemName.startsWith('Material:')) {
            itemType = 'material';
            itemCode = itemName.replace('Material:', '').trim();
            stockItem = await Material.findOne({ material: itemCode });
        }

        if (!stockItem) {
            return next(errorHandler(404, `${itemType} item not found`));
        }

        // 检查这是否是最新的记录
        const latestRecord = await Movement.findOne({ item: movementToDelete.item })
            .sort({ createdAt: -1 });
        
        if (!latestRecord || latestRecord._id.toString() !== movementToDelete._id.toString()) {
            return next(errorHandler(400, 'Delete Failed: Can only delete the latest movement. Please delete from the most recent one first.'));
        }

        // 只有原记录状态为 Active 时才进行库存回滚
        if (movementToDelete.status === 'Active') {
            let newBalance;
            if (movementToDelete.transaction === 'In') {
                if (stockItem.quantity < movementToDelete.quantity) {
                    return next(errorHandler(400, 'Delete Failed: Insufficient stock'));
                }
                newBalance = stockItem.quantity - movementToDelete.quantity;
            } else if (movementToDelete.transaction === 'Out') {
                newBalance = stockItem.quantity + movementToDelete.quantity;
            }

            // 更新库存数量
            stockItem.quantity = newBalance;
        }

        // 删除movement记录
        await Movement.findByIdAndDelete(req.params.movementId);
        
        // 保存库存更新（如果有）
        if (movementToDelete.status === 'Active') {
            await stockItem.save();
        }

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete movement',
            detail: `${req.user.username} delete movement`
        });
        await newActivity.save();
        
        res.status(200).json('Movement is deleted');
    } catch (error) {
        next(error);
    }
}

export const updateMovement = async (req, res, next) => {
    try {
        const movement = await Movement.findById(req.params.movementId);
        if (!movement) {
            return next(errorHandler(404, 'Movement not found'));
        }

        // 解析item名称来获取类型和代码
        const itemName = movement.item;
        let itemType, itemCode, stockItem;

        if (itemName.startsWith('Product:')) {
            itemType = 'product';
            itemCode = itemName.replace('Product:', '').trim();
            stockItem = await Product.findOne({ colourcode: itemCode });
        } else if (itemName.startsWith('Material:')) {
            itemType = 'material';
            itemCode = itemName.replace('Material:', '').trim();
            stockItem = await Material.findOne({ material: itemCode });
        }

        if (!stockItem) {
            return next(errorHandler(404, `${itemType} item not found`));
        }

        // 获取新的状态和数量
        const newStatus = req.body.status || movement.status;
        const newQuantity = Number(req.body.quantity) || movement.quantity;

        // 如果没有实际更改，直接返回
        if (movement.status === newStatus && movement.quantity === newQuantity) {
            return res.status(200).json(movement);
        }

        // 1. 重新计算所有记录的余额
        const allMovements = await Movement.find({ item: movement.item })
            .sort({ createdAt: 1 });

        let runningBalance = 0;
        const updatePromises = [];

        for (const mov of allMovements) {
            let effectiveQuantity = mov.quantity;
            let effectiveStatus = mov.status;
            let recordBalance = runningBalance; // 保存当前记录应有的余额

            // 如果是当前更新的记录，使用新的值
            if (mov._id.toString() === movement._id.toString()) {
                effectiveQuantity = newQuantity;
                effectiveStatus = newStatus;
            }

            // 计算余额 - 只对Active状态的记录进行计算
            if (effectiveStatus === 'Active') {
                if (mov.transaction === 'In') {
                    runningBalance += effectiveQuantity;
                } else if (mov.transaction === 'Out') {
                    // 检查是否会变成负数
                    if (runningBalance < effectiveQuantity) {
                        return next(errorHandler(400, 'Cannot update: This would make historical balance negative'));
                    }
                    runningBalance -= effectiveQuantity;
                }
            }

            // 更新记录的余额 - 使用runningBalance而不是recordBalance
            if (mov._id.toString() === movement._id.toString()) {
                // 当前更新记录使用计算后的余额
                updatePromises.push(
                    Movement.findByIdAndUpdate(mov._id, {
                        $set: { 
                            quantity: newQuantity,
                            status: newStatus,
                            balance: runningBalance 
                        }
                    }, { new: true })
                );
            } else {
                // 其他记录保持原来的余额逻辑
                updatePromises.push(
                    Movement.findByIdAndUpdate(mov._id, {
                        $set: { balance: runningBalance }
                    }, { new: true })
                );
            }
        }

        // 等待所有更新完成
        await Promise.all(updatePromises);

        // 2. 获取更新后的当前记录
        const updatedMovement = await Movement.findById(req.params.movementId);

        // 3. 更新库存的余额为最终计算的结果
        stockItem.quantity = runningBalance;
        await stockItem.save();

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update movement',
            detail: `${req.user.username} update movement`
        });
        await newActivity.save();
        
        res.status(200).json(updatedMovement);
    } catch (error) {
        next(error);
    }
}