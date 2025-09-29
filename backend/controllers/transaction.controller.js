import Transaction from "../models/transaction.model.js"
import Inventory from "../models/inventory.model.js"
import { errorHandler } from "../utils/error.js"
import Activity from "../models/activity.model.js"

// 通用的 QR 码更新函数 - 只修改日期格式
const updateQRCode = async (inventory) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const qrCodeContent = JSON.stringify({
        code: inventory.code,
        type: inventory.type,
        location: inventory.location,
        supplier: inventory.supplier,
        balance: inventory.balance,
        status: inventory.status,
        createdAt: formatDate(inventory.createdAt),
        lastUpdated: formatDate(new Date())
    });
    
    inventory.qrCode = qrCodeContent;
    return await inventory.save();
};

export const record = async (req,res,next) => {
    const {date,code,transaction,quantity,user,status} = req.body
    try {
        let inventory = await Inventory.findOne({code})

        if(!inventory){
            // 如果item不存在，创建默认的item
            inventory = new Inventory({
                code,
                balance: 0,
                type: 'Unknown',
                location: 'Unknown',
                supplier: 'Unknown',
                status: 'Active',
                createdAt: new Date().toISOString()
            })
        }

        const qty = Number(quantity)
        let newBalance = inventory.balance; // 默认保持不变

        // 只有状态为 Active 时才进行库存计算
        if(status === 'Active'){
            if(transaction === 'In'){
                newBalance = inventory.balance + qty
            }else if(transaction === 'Out'){
                if(inventory.balance < quantity){
                    return next(errorHandler(404, 'Insufficient Stock'))
                }
                newBalance = inventory.balance - qty
            }
            
            // 更新inventory的balance（仅当Active时）
            inventory.balance = newBalance
            // 更新QR码内容（仅当Active时）
            await updateQRCode(inventory);
        }

        const newTransaction = new Transaction({
            date,
            code,
            transaction,
            quantity: qty,
            user,
            balance: newBalance, // 记录计算后的余额（即使是Inactive也记录）
            status
        })

        await Promise.all([
            newTransaction.save(),
            inventory.save()
        ])

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create transaction',
            detail: `${req.user.username} create transaction to the system`
        })
        await newActivity.save()
        res.status(201).json(newTransaction)
    } catch (error) {
        next(error)
    }
}

export const getRecords = async (req,res,next) => {
    try {
        const records = await Transaction.find().sort({createdAt:-1})
        res.status(200).json(records)
    } catch (error) {
        next(error)
    }
}

export const deleteRecord = async (req,res,next) => {
    try {
        // 获取要删除的记录
        const recordToDelete = await Transaction.findById(req.params.recordId);
        if(!recordToDelete){
            return next(errorHandler(404, 'Transaction not found'))
        }

        // 检查这是否是最新的记录（按创建时间排序）
        const latestRecord = await Transaction.findOne({ code: recordToDelete.code })
            .sort({ createdAt: -1 });
        
        if (!latestRecord || latestRecord._id.toString() !== recordToDelete._id.toString()) {
            return next(errorHandler(400, 'Delete Failed: Can only delete the latest transaction. Please delete from the most recent one first.'))
        }

        const inventory = await Inventory.findOne({ code: recordToDelete.code });
        if(!inventory){
            return next(errorHandler(404, 'Inventory item not found'))
        }

        // 只有原记录状态为 Active 时才进行库存回滚
        if(recordToDelete.status === 'Active'){
            let newBalance;
            if(recordToDelete.transaction === 'In'){
                if(inventory.balance < recordToDelete.quantity){
                    return next(errorHandler(400, 'Delete Failed: Insufficient stock'))
                }
                newBalance = inventory.balance - recordToDelete.quantity
            }else if (recordToDelete.transaction === 'Out') {
                newBalance = inventory.balance + recordToDelete.quantity
            }

            // 更新inventory的balance
            inventory.balance = newBalance
            
            // 更新QR码内容
            await updateQRCode(inventory);
        }

        await Promise.all([
            inventory.save(),
            Transaction.findByIdAndDelete(req.params.recordId)
        ]);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete transaction',
            detail: `${req.user.username} delete transaction from the system`
        })
        await newActivity.save()
        res.status(200).json('Record is deleted')
    } catch (error) {
        next(error)
    }
}

export const updateRecord = async (req, res, next) => {
    try {
        const record = await Transaction.findById(req.params.recordId);
        if (!record) {
            return next(errorHandler(404, 'Record not found'));
        }

        const inventory = await Inventory.findOne({ code: record.code });
        if (!inventory) {
            return next(errorHandler(404, 'Inventory item not found'));
        }

        // 获取新的状态和数量
        const newStatus = req.body.status || record.status;
        const newQuantity = Number(req.body.quantity) || record.quantity;

        // 如果没有实际更改，直接返回
        if (record.status === newStatus && record.quantity === newQuantity) {
            return res.status(200).json(record);
        }

        // 1. 重新计算所有记录的余额（考虑每个记录的status）
        const allRecords = await Transaction.find({ code: record.code })
            .sort({ createdAt: 1 });

        let runningBalance = 0;
        const updatePromises = [];

        for (const rec of allRecords) {
            let effectiveQuantity = rec.quantity;
            let effectiveStatus = rec.status;
            let recordBalance = runningBalance; // 保存当前记录应有的余额

            // 如果是当前更新的记录，使用新的值
            if (rec._id.toString() === record._id.toString()) {
                effectiveQuantity = newQuantity;
                effectiveStatus = newStatus;
            }

            // 计算余额 - 只对Active状态的记录进行计算
            if (effectiveStatus === 'Active') {
                if (rec.transaction === 'In') {
                    runningBalance += effectiveQuantity;
                } else if (rec.transaction === 'Out') {
                    // 检查是否会变成负数
                    if (runningBalance < effectiveQuantity) {
                        return next(errorHandler(400, 'Cannot update: This would make historical balance negative'));
                    }
                    runningBalance -= effectiveQuantity;
                }
            }

            // 更新记录的余额 - 使用recordBalance而不是runningBalance
            // 对于当前记录，需要特殊处理
            if (rec._id.toString() === record._id.toString()) {
                // 当前更新记录使用计算后的余额
                updatePromises.push(
                    Transaction.findByIdAndUpdate(rec._id, {
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
                    Transaction.findByIdAndUpdate(rec._id, {
                        $set: { balance: runningBalance }
                    }, { new: true })
                );
            }
        }

        // 等待所有更新完成
        await Promise.all(updatePromises);

        // 2. 获取更新后的当前记录
        const updatedRecord = await Transaction.findById(req.params.recordId);

        // 3. 更新inventory的余额为最终计算的结果
        inventory.balance = runningBalance;
        await updateQRCode(inventory);
        await inventory.save();

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update transaction',
            detail: `${req.user.username} update transaction to the system`
        });
        await newActivity.save();
        
        res.status(200).json(updatedRecord);
    } catch (error) {
        next(error);
    }
}