import Activity from "../models/activity.model.js"
import Other from "../models/other.model.js";
import Transaction from "../models/transaction.model.js"
import { errorHandler } from "../utils/error.js"

// 通用的 QR 码更新函数
const updateQRCode = async (other) => {
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

export const other = async (req,res,next) => {
    const {code,type,location,supplier,balance,status} = req.body
    try {
        const existingItem = await Other.findOne({code})
        if(existingItem){
            return next(errorHandler(404, 'Other already exists'))
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

        const newItem = new Other({
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
            activity: 'Create other',
            detail: `${req.user.username}`
        })
        await newActivity.save()
        await newItem.save()
        res.status(201).json({message:'Register successfully'})
    } catch (error) {
        next(error)
    }
}

export const getOthers = async (req,res,next) => {
    try {
        const others = await Other.find().sort({updatedAt:-1})
        res.status(200).json(others)
    } catch (error) {
        next(error)
    }
}

export const deleteOther = async (req,res,next) => {
    try {
        // 先找到要删除的物品
        const otherToDelete = await Other.findById(req.params.otherId);
        if (!otherToDelete) {
            return next(errorHandler(404, 'Other not found'));
        }

        // 获取物品的code，用于删除相关的交易记录
        const otherCode = otherToDelete.code;

        // 同时删除物品和相关的交易记录
        await Promise.all([
            Other.findByIdAndDelete(req.params.otherId),
            Transaction.deleteMany({ code: otherCode }) // 删除所有与该物品code相关的交易记录
        ]);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete other',
            detail: `${req.user.username}`
        });
        await newActivity.save();
        
        res.status(200).json({message:'Other and all related transactions deleted successfully'});
    } catch (error) {
        next(error);
    }
}

export const updateOther = async (req,res,next) => {
    try {
        const existingOther = await Other.findOne({ 
            code: req.body.code,
            _id: { $ne: req.params.otherId } 
        });
        
        if (existingOther) {
            return next(errorHandler(404, 'Update Failed: code already exists'))
        }

        // 更新字段并重新生成 QR 码
        const updatedOther = await Other.findByIdAndUpdate(req.params.otherId, {
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
        await updateQRCode(updatedOther);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update other',
            detail: `${req.user.username}`
        })
        await newActivity.save()
        res.status(200).json(updatedOther)
    } catch (error) {
        next(error)
    }
}