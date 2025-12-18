import Transaction from "../models/transaction.model.js"
import Inventory from "../models/inventory.model.js"
import Extruder from "../models/extruder.model.js"
import Sparepart from "../models/sparepart.model.js"
import Other from "../models/other.model.js"
import { errorHandler } from "../utils/error.js"
import Activity from "../models/activity.model.js"

// 检查记录属于哪种类型（inventory、extruder、sparepart 或 other）
const checkItemType = async (code) => {
    const inventoryItem = await Inventory.findOne({ code });
    if (inventoryItem) return 'inventory';
    
    const extruderItem = await Extruder.findOne({ code });
    if (extruderItem) return 'extruder';

    const sparepartItem = await Sparepart.findOne({ code });
    if (sparepartItem) return 'sparepart';

    const otherItem = await Other.findOne({ code });
    if (otherItem) return 'other';
    
    return null;
};

// 根据类型获取对应的 item 和 QR 更新函数
const getItemAndQRFunction = async (code) => {
    const inventoryItem = await Inventory.findOne({ code });
    if (inventoryItem) {
        return {
            item: inventoryItem,
            updateQRFunction: updateInventoryQRCode,
            type: 'inventory'
        };
    }
    
    const extruderItem = await Extruder.findOne({ code });
    if (extruderItem) {
        return {
            item: extruderItem,
            updateQRFunction: updateExtruderQRCode,
            type: 'extruder'
        };
    }

    const sparepartItem = await Sparepart.findOne({ code });
    if (sparepartItem) {
        return {
            item: sparepartItem,
            updateQRFunction: updateSparepartQRCode,
            type: 'sparepart'
        };
    }

    const otherItem = await Other.findOne({ code });
    if (otherItem) {
        return {
            item: otherItem,
            updateQRFunction: updateOtherQRCode,
            type: 'other'
        };
    }
    
    return null;
};

// 创建默认 item 的函数
const createDefaultItem = async (code, type = 'inventory') => {
    const defaultData = {
        code,
        balance: 0,
        type: 'Unknown',
        location: 'Unknown',
        supplier: 'Unknown',
        status: 'Active',
        createdAt: new Date().toISOString()
    };

    switch (type) {
        case 'inventory':
            const newInventory = new Inventory(defaultData);
            await newInventory.save();
            return {
                item: newInventory,
                updateQRFunction: updateInventoryQRCode,
                type: 'inventory'
            };
        case 'extruder':
            const newExtruder = new Extruder(defaultData);
            await newExtruder.save();
            return {
                item: newExtruder,
                updateQRFunction: updateExtruderQRCode,
                type: 'extruder'
            };
        case 'sparepart':
            const newSparepart = new Sparepart(defaultData);
            await newSparepart.save();
            return {
                item: newSparepart,
                updateQRFunction: updateSparepartQRCode,
                type: 'sparepart'
            };
        case 'other':
            const newOther = new Other(defaultData);
            await newOther.save();
            return {
                item: newOther,
                updateQRFunction: updateOtherQRCode,
                type: 'other'
            };
        default:
            throw new Error('Unknown item type');
    }
};

// 根据 code 格式判断 item 类型
const determineItemType = (code) => {
    // 根据你的业务规则实现
    // 例如：如果 code 以 "INV" 开头就是 inventory
    // 如果 code 以 "EXT" 开头就是 extruder  
    // 如果 code 以 "SPT" 开头就是 sparepart
    // 如果 code 以 "OTH" 开头就是 other
    if (code.startsWith('INV')) return 'inventory';
    if (code.startsWith('EXT')) return 'extruder';
    if (code.startsWith('SPT')) return 'sparepart';
    if (code.startsWith('OTH')) return 'other';
    return 'inventory'; // 默认
};

// 通用的 QR 码更新函数 - 用于 Inventory
const updateInventoryQRCode = async (inventory) => {
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

// 通用的 QR 码更新函数 - 用于 Extruder
const updateExtruderQRCode = async (extruder) => {
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
        code: extruder.code,
        type: extruder.type,
        location: extruder.location,
        supplier: extruder.supplier,
        balance: extruder.balance,
        status: extruder.status,
        createdAt: formatDate(extruder.createdAt),
        lastUpdated: formatDate(new Date())
    });
    
    extruder.qrCode = qrCodeContent;
    return await extruder.save();
};

// 通用的 QR 码更新函数 - 用于 Sparepart
const updateSparepartQRCode = async (sparepart) => {
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
        code: sparepart.code,
        type: sparepart.type,
        location: sparepart.location,
        supplier: sparepart.supplier,
        balance: sparepart.balance,
        status: sparepart.status,
        createdAt: formatDate(sparepart.createdAt),
        lastUpdated: formatDate(new Date())
    });
    
    sparepart.qrCode = qrCodeContent;
    return await sparepart.save();
};

// 通用的 QR 码更新函数 - 用于 Other
const updateOtherQRCode = async (other) => {
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
        code: other.code,
        type: other.type,
        location: other.location,
        supplier: other.supplier,
        balance: other.balance,
        status: other.status,
        createdAt: formatDate(other.createdAt),
        lastUpdated: formatDate(new Date())
    });
    
    other.qrCode = qrCodeContent;
    return await other.save();
};

export const record = async (req,res,next) => {
    const {date,code,transaction,quantity,user,status} = req.body
    try {
        // 检查 code 属于 inventory、extruder、sparepart 还是 other
        let itemData = await getItemAndQRFunction(code);
        
        if (!itemData) {
            // 如果item不存在，根据业务规则创建对应类型的默认item
            const itemType = determineItemType(code);
            itemData = await createDefaultItem(code, itemType);
        }

        const { item, updateQRFunction } = itemData;
        const qty = Number(quantity)
        let newBalance = item.balance; // 默认保持不变

        // 只有状态为 Active 时才进行库存计算
        if(status === 'Active'){
            if(transaction === 'In'){
                newBalance = item.balance + qty
            }else if(transaction === 'Out'){
                if(item.balance < qty){
                    return next(errorHandler(404, 'Insufficient Stock'))
                }
                newBalance = item.balance - qty
            }
            
            // 更新item的balance（仅当Active时）
            item.balance = newBalance
            // 更新QR码内容（仅当Active时）
            await updateQRFunction(item);
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
            item.save()
        ])

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create transaction',
            detail: `${req.user.username}`
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

        // 根据 code 获取对应的 item
        const itemData = await getItemAndQRFunction(recordToDelete.code);
        if(!itemData){
            return next(errorHandler(404, 'Item not found'))
        }

        const { item, updateQRFunction } = itemData;

        // 只有原记录状态为 Active 时才进行库存回滚
        if(recordToDelete.status === 'Active'){
            let newBalance;
            if(recordToDelete.transaction === 'In'){
                if(item.balance < recordToDelete.quantity){
                    return next(errorHandler(400, 'Delete Failed: Insufficient stock'))
                }
                newBalance = item.balance - recordToDelete.quantity
            }else if (recordToDelete.transaction === 'Out') {
                newBalance = item.balance + recordToDelete.quantity
            }

            // 更新item的balance
            item.balance = newBalance
            
            // 更新QR码内容
            await updateQRFunction(item);
        }

        await Promise.all([
            item.save(),
            Transaction.findByIdAndDelete(req.params.recordId)
        ]);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete transaction',
            detail: `${req.user.username}`
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

        // 根据 code 获取对应的 item
        const itemData = await getItemAndQRFunction(record.code);
        if(!itemData){
            return next(errorHandler(404, 'Item not found'));
        }

        const { item, updateQRFunction } = itemData;

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

            // 更新记录的余额
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

        // 3. 更新item的余额为最终计算的结果
        item.balance = runningBalance;
        await updateQRFunction(item);
        await item.save();

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update transaction',
            detail: `${req.user.username}`
        });
        await newActivity.save();
        
        res.status(200).json(updatedRecord);
    } catch (error) {
        next(error);
    }
}

// 获取特定 code 的所有交易记录
export const getRecordsByCode = async (req, res, next) => {
    try {
        const { code } = req.params;
        const records = await Transaction.find({ code }).sort({ createdAt: -1 });
        res.status(200).json(records);
    } catch (error) {
        next(error);
    }
}

// 获取交易记录统计信息
export const getTransactionStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        
        let matchStage = {};
        if (startDate && endDate) {
            matchStage.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const stats = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        transaction: '$transaction',
                        status: '$status'
                    },
                    totalQuantity: { $sum: '$quantity' },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.transaction',
                    statusBreakdown: {
                        $push: {
                            status: '$_id.status',
                            totalQuantity: '$totalQuantity',
                            count: '$count'
                        }
                    },
                    totalQuantity: { $sum: '$totalQuantity' },
                    totalCount: { $sum: '$count' }
                }
            }
        ]);

        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
}