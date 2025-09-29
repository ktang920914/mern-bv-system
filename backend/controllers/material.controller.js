import Activity from "../models/activity.model.js"
import Material from "../models/material.model.js"
import Movement from "../models/movement.model.js"
import { errorHandler } from "../utils/error.js"

export const material = async (req,res,next) => {
    try {
    const {material, quantity, palletno, location, user, status} = req.body
    const existingMaterial = await Material.findOne({material})
    if(existingMaterial){
        return next(errorHandler(404, 'Material is exists'))
    }

    const materialQuantity = quantity || 0;
    const newMaterial = new Material({
        material,
        quantity:materialQuantity,
        palletno,
        location,
        user,
        status
    })
    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
        date: currentDate,
        activity: 'Create material',
        detail: `${req.user.username} create material to the system`
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

        // 获取物品的colourcode，用于删除相关的交易记录
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
        const updatedMaterial = await Material.findByIdAndUpdate(req.params.materialId, {
        $set: {
            material: req.body.material,
            location: req.body.location,
            user:req.body.user,
            quantity:req.body.quantity,
            palletno:req.body.palletno,
            status:req.body.status
        },
    },{new:true})
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