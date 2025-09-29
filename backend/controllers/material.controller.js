import Activity from "../models/activity.model.js"
import Material from "../models/material.model.js"
import Movement from "../models/movement.model.js"
import { errorHandler } from "../utils/error.js"

// 通用的 QR 码更新函数
const updateQRCode = async (material) => {
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
        material: material.material,
        quantity: material.quantity,
        palletno: material.palletno,
        location: material.location,
        user: material.user,
        status: material.status,
        createdAt: formatDate(material.createdAt),
        lastUpdated: formatDate(new Date())
    });
    
    material.qrCode = qrCodeContent;
    return await material.save();
};

export const material = async (req,res,next) => {
    try {
        const {material, quantity, palletno, location, user, status} = req.body
        const existingMaterial = await Material.findOne({material})
        if(existingMaterial){
            return next(errorHandler(404, 'Material is exists'))
        }

        const materialQuantity = quantity || 0;

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
            material,
            quantity: materialQuantity,
            palletno,
            location,
            user,
            status,
            createdAt: formatDate(new Date())
        })

        const newMaterial = new Material({
            material,
            quantity: materialQuantity,
            palletno,
            location,
            user,
            status,
            qrCode: qrCodeContent
        })

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create material',
            detail: `${req.user.username} created material in the system`
        })
        await newActivity.save()

        await newMaterial.save()
        res.status(201).json({message:'Register successfully'})
    } catch (error) {
        next(error)
    }
}

export const getMaterials = async (req,res,next) => {
    try {
        const materials = await Material.find().sort({updatedAt:-1})
        res.status(200).json(materials)
    } catch (error) {
        next(error)
    }
}

export const deleteMaterial = async (req,res,next) => {
    try {
        // 先找到要删除的物品
        const itemToDelete = await Material.findById(req.params.materialId);
        if (!itemToDelete) {
            return next(errorHandler(404, 'Item not found'));
        }

        // 获取物品的material，用于删除相关的交易记录
        const itemCode = itemToDelete.material;
        
        // 构造movement中item字段的格式
        const movementItemName = `Material: ${itemCode}`;

        // 同时删除物品和相关的交易记录
        await Promise.all([
            Material.findByIdAndDelete(req.params.materialId),
            Movement.deleteMany({ item: movementItemName }) // 使用正确的格式
        ]);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete material',
            detail: `${req.user.username} delete material ${itemCode} and all related movements from the system`
        });
        await newActivity.save();
        
        res.status(200).json('Material and related movements are deleted');
    } catch (error) {
        next(error);
    }
}

export const updateMaterial = async (req,res,next) => {
    try {
        const existingMaterial = await Material.findOne({ 
            material: req.body.material,
            _id: { $ne: req.params.materialId } 
        });
        
        if (existingMaterial) {
            return next(errorHandler(404, 'Update Failed'))
        }

        // 更新字段并重新生成 QR 码
        const updatedMaterial = await Material.findByIdAndUpdate(req.params.materialId, {
            $set: {
                material: req.body.material,
                location: req.body.location,
                user: req.body.user,
                quantity: req.body.quantity,
                palletno: req.body.palletno,
                status: req.body.status
            },
        }, {new: true})

        // 更新 QR 码内容
        await updateQRCode(updatedMaterial);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update material',
            detail: `${req.user.username} update material to the system`
        })
        await newActivity.save()
        res.status(200).json(updatedMaterial)
    } catch (error) {
        next(error)
    }
}