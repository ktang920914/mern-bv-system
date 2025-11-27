import Activity from "../models/activity.model.js"
import Sparepart from "../models/sparepart.model.js";
import Transaction from "../models/transaction.model.js"
import { errorHandler } from "../utils/error.js"

// 通用的 QR 码更新函数
const updateQRCode = async (sparepart) => {
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

export const sparepart = async (req,res,next) => {
    const {code,type,location,supplier,balance,status} = req.body
    try {
        const existingItem = await Sparepart.findOne({code})
        if(existingItem){
            return next(errorHandler(404, 'Sparepart already exists'))
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

        const newItem = new Sparepart({
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
            activity: 'Create sparepart',
            detail: `${req.user.username}`
        })
        await newActivity.save()
        await newItem.save()
        res.status(201).json({message:'Register successfully'})
    } catch (error) {
        next(error)
    }
}

export const getSpareparts = async (req,res,next) => {
    try {
        const spareparts = await Sparepart.find().sort({updatedAt:-1})
        res.status(200).json(spareparts)
    } catch (error) {
        next(error)
    }
}

export const deleteSparepart = async (req,res,next) => {
    try {
        // 先找到要删除的物品
        const sparepartToDelete = await Sparepart.findById(req.params.sparepartId);
        if (!sparepartToDelete) {
            return next(errorHandler(404, 'Sparepart not found'));
        }

        // 获取物品的code，用于删除相关的交易记录
        const sparepartCode = sparepartToDelete.code;

        // 同时删除物品和相关的交易记录
        await Promise.all([
            Sparepart.findByIdAndDelete(req.params.sparepartId),
            Transaction.deleteMany({ code: sparepartCode }) // 删除所有与该物品code相关的交易记录
        ]);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete sparepart',
            detail: `${req.user.username}`
        });
        await newActivity.save();
        
        res.status(200).json({message:'Sparepart and all related transactions deleted successfully'});
    } catch (error) {
        next(error);
    }
}

export const updateSparepart = async (req,res,next) => {
    try {
        const existingSparepart = await Sparepart.findOne({ 
            code: req.body.code,
            _id: { $ne: req.params.sparepartId } 
        });
        
        if (existingSparepart) {
            return next(errorHandler(404, 'Update Failed: code already exists'))
        }

        // 更新字段并重新生成 QR 码
        const updatedSparepart = await Sparepart.findByIdAndUpdate(req.params.sparepartId, {
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
        await updateQRCode(updatedSparepart);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update sparepart',
            detail: `${req.user.username}`
        })
        await newActivity.save()
        res.status(200).json(updatedSparepart)
    } catch (error) {
        next(error)
    }
}