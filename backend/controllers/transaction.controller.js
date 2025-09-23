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
    const {date,code,transaction,quantity,user} = req.body
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
        let newBalance;

        if(transaction === 'In'){
            newBalance = inventory.balance + qty
        }else if(transaction === 'Out'){
            if(inventory.balance < quantity){
                return next(errorHandler(404, 'Insufficient Stock'))
            }
            newBalance = inventory.balance - qty
        }

        const newTransaction = new Transaction({
            date,
            code,
            transaction,
            quantity: qty,
            user,
            balance: newBalance
        })

        // 更新inventory的balance
        inventory.balance = newBalance
        
        // 更新QR码内容
        await updateQRCode(inventory);

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
        const record = await Transaction.findById(req.params.recordId)
        if(!record){
            return next(errorHandler(404, 'Failed'))
        }
        const inventory = await Inventory.findOne({code: record.code});
        if(!inventory){
            return next(errorHandler(404, 'Failed'))
        }

        let newBalance;
        if(record.transaction === 'In'){
            if(inventory.balance < record.quantity){
                return next(errorHandler(400, 'Delete Failed: Insufficient stock'))
            }
            newBalance = inventory.balance - record.quantity
        }else if (record.transaction === 'Out') {
            newBalance = inventory.balance + record.quantity
        }

        // 更新inventory的balance
        inventory.balance = newBalance
        
        // 更新QR码内容
        await updateQRCode(inventory);

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

export const updateRecord = async (req,res,next) => {
    try {
        const record = await Transaction.findById(req.params.recordId);
        if (!record) {
            return next(errorHandler(404, 'Record not found'));
        }

        const inventory = await Inventory.findOne({code: record.code});
        if (!inventory) {
            return next(errorHandler(404, 'Inventory item not found'));
        }

        // 更新transaction的balance
        const updatedRecord = await Transaction.findByIdAndUpdate(req.params.recordId, {
            $set: {
                balance: req.body.balance
            },
        }, {new: true})

        // 同时更新inventory的balance和QR码
        inventory.balance = req.body.balance;
        await updateQRCode(inventory);
        await inventory.save();

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update transaction',
            detail: `${req.user.username} update transaction to the system`
        })
        await newActivity.save()
        res.status(200).json(updatedRecord)
    } catch (error) {
        next(error)
    }
}