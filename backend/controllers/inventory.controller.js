import Activity from "../models/activity.model.js"
import Inventory from "../models/inventory.model.js"
import { errorHandler } from "../utils/error.js"

export const item = async (req,res,next) => {
    const {code,type,location,supplier,balance,status} = req.body
    try {
        const existingItem = await Inventory.findOne({code})
        if(existingItem){
            return next(errorHandler(404, 'Item already exists'))
        }

        // 生成固定 QR 内容（创建时生成，后续不变）
        const qrCodeContent = JSON.stringify({
            code,
            type,
            location,
            supplier,
            balance,
            status,
            createdAt: new Date().toISOString()
        })

        const newItem = new Inventory({
            code,
            type,
            location,
            supplier,
            balance,
            status,
            qrCode: qrCodeContent
        })

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create item',
            detail: `${req.user.username} created item in the system`
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
        await Inventory.findByIdAndDelete(req.params.itemId)
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete item',
            detail: `${req.user.username} deleted item from the system`
        })
        await newActivity.save()
        res.status(200).json({message:'Item deleted successfully'})
    } catch (error) {
        next(error)
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

        // 更新其他字段，不改 qrCode
        const updatedItem = await Inventory.findByIdAndUpdate(req.params.itemId, {
            $set: {
                code: req.body.code,
                type: req.body.type,
                location: req.body.location,
                supplier: req.body.supplier,
                balance: req.body.balance,
                status: req.body.status
            },
        },{new:true})

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update item',
            detail: `${req.user.username} updated item in the system`
        })
        await newActivity.save()
        res.status(200).json(updatedItem)
    } catch (error) {
        next(error)
    }
}
