import Activity from "../models/activity.model.js"
import Extruder from "../models/extruder.model.js";
import Transaction from "../models/transaction.model.js"
import { errorHandler } from "../utils/error.js"

// 通用的 QR 码更新函数
const updateQRCode = async (extruder) => {
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

export const extruder = async (req,res,next) => {
    const {code,type,location,supplier,balance,status} = req.body
    try {
        const existingItem = await Extruder.findOne({code})
        if(existingItem){
            return next(errorHandler(404, 'Extruder already exists'))
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

        const newItem = new Extruder({
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

export const getExtruders = async (req,res,next) => {
    try {
        const extruders = await Extruder.find().sort({updatedAt:-1})
        res.status(200).json(extruders)
    } catch (error) {
        next(error)
    }
}

export const deleteExtruder = async (req,res,next) => {
    try {
        // 先找到要删除的物品
        const extruderToDelete = await Extruder.findById(req.params.extruderId);
        if (!extruderToDelete) {
            return next(errorHandler(404, 'Extruder not found'));
        }

        // 获取物品的code，用于删除相关的交易记录
        const extruderCode = extruderToDelete.code;

        // 同时删除物品和相关的交易记录
        await Promise.all([
            Extruder.findByIdAndDelete(req.params.extruderId),
            Transaction.deleteMany({ code: extruderCode }) // 删除所有与该物品code相关的交易记录
        ]);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete extruder',
            detail: `${req.user.username}`
        });
        await newActivity.save();
        
        res.status(200).json({message:'Extruder and all related transactions deleted successfully'});
    } catch (error) {
        next(error);
    }
}

export const updateExtruder = async (req,res,next) => {
    try {
        const existingExtruder = await Extruder.findOne({ 
            code: req.body.code,
            _id: { $ne: req.params.extruderId } 
        });
        
        if (existingExtruder) {
            return next(errorHandler(404, 'Update Failed: code already exists'))
        }

        // 更新字段并重新生成 QR 码
        const updatedExtruder = await Extruder.findByIdAndUpdate(req.params.extruderId, {
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
        await updateQRCode(updatedExtruder);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update extruder',
            detail: `${req.user.username}`
        })
        await newActivity.save()
        res.status(200).json(updatedExtruder)
    } catch (error) {
        next(error)
    }
}