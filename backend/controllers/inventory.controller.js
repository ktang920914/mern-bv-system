import Activity from "../models/activity.model.js"
import Inventory from "../models/inventory.model.js"
import Transaction from "../models/transaction.model.js"
import { errorHandler } from "../utils/error.js"

// 通用的 QR 码更新函数
const updateQRCode = async (inventory) => {
    // 只修改 QR 码中的日期格式
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

export const item = async (req,res,next) => {
    const {code,type,location,supplier,balance,status} = req.body
    try {
        const existingItem = await Inventory.findOne({code})
        if(existingItem){
            return next(errorHandler(404, 'Item already exists'))
        }

        // 确保balance有默认值
        const itemBalance = balance || 0;

        // 生成 QR 内容 - 只修改日期格式
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
            code,
            type,
            location,
            supplier,
            balance: itemBalance,
            status,
            createdAt: formatDate(new Date())
        })

        const newItem = new Inventory({
            code,
            type,
            location,
            supplier,
            balance: itemBalance,
            status,
            qrCode: qrCodeContent
        })

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create item',
            detail: `${req.user.username}`
        })
        await newActivity.save()
        await newItem.save()
        res.status(201).json({message:'Register successfully'})
    } catch (error) {
        next(error)
    }
}

export const getItems = async (req,res,next) => {
    try {
        const items = await Inventory.find().sort({updatedAt:-1})
        res.status(200).json(items)
    } catch (error) {
        next(error)
    }
}

export const deleteItem = async (req,res,next) => {
    try {
        // 先找到要删除的物品
        const itemToDelete = await Inventory.findById(req.params.itemId);
        if (!itemToDelete) {
            return next(errorHandler(404, 'Item not found'));
        }

        // 获取物品的code，用于删除相关的交易记录
        const itemCode = itemToDelete.code;

        // 同时删除物品和相关的交易记录
        await Promise.all([
            Inventory.findByIdAndDelete(req.params.itemId),
            Transaction.deleteMany({ code: itemCode }) // 删除所有与该物品code相关的交易记录
        ]);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete item',
            detail: `${req.user.username}`
        });
        await newActivity.save();
        
        res.status(200).json({message:'Item and all related transactions deleted successfully'});
    } catch (error) {
        next(error);
    }
}

export const updateItem = async (req,res,next) => {
    try {
        const existingItem = await Inventory.findOne({ 
            code: req.body.code,
            _id: { $ne: req.params.itemId } 
        });
        
        if (existingItem) {
            return next(errorHandler(404, 'Update Failed: code already exists'))
        }

        // 更新字段并重新生成 QR 码
        const updatedItem = await Inventory.findByIdAndUpdate(req.params.itemId, {
            $set: {
                code: req.body.code,
                type: req.body.type,
                location: req.body.location,
                supplier: req.body.supplier,
                balance: req.body.balance,
                status: req.body.status
            },
        }, {new: true})

        // 更新 QR 码内容
        await updateQRCode(updatedItem);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update item',
            detail: `${req.user.username}`
        })
        await newActivity.save()
        res.status(200).json(updatedItem)
    } catch (error) {
        next(error)
    }
}