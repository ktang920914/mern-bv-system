import Activity from "../models/activity.model.js"
import Movement from "../models/movement.model.js"
import Product from "../models/product.model.js"
import Material from "../models/material.model.js" 

export const movement = async (req, res, next) => {
    const { date, item, transaction, quantity, user } = req.body
    
    try {
        // 解析 item 值（格式：product_colourcode 或 material_materialname）
        const [itemType, itemCode] = item.split('_')
        let stockItem;
        let itemName;

        if (itemType === 'product') {
            // 查找产品
            stockItem = await Product.findOne({ colourcode: itemCode })
            itemName = `Product: ${itemCode}`
        } else if (itemType === 'material') {
            // 查找材料
            stockItem = await Material.findOne({ material: itemCode })
            itemName = `Material: ${itemCode}`
        }

        if (!stockItem) {
            return next(errorHandler(404, `${itemType === 'product' ? 'Product' : 'Material'} not found`))
        }

        const qty = Number(quantity)
        let newBalance;

        if (transaction === 'In') {
            newBalance = stockItem.quantity + qty
        } else if (transaction === 'Out') {
            if (stockItem.quantity < qty) {
                return next(errorHandler(400, 'Insufficient Stock'))
            }
            newBalance = stockItem.quantity - qty
        } else {
            return next(errorHandler(400, 'Invalid transaction type'))
        }

        const newMovement = new Movement({
            date,
            item: itemName,
            transaction,
            quantity: qty,
            user,
            balance: newBalance
        })

        // 更新库存数量
        stockItem.quantity = newBalance

        await Promise.all([
            newMovement.save(),
            stockItem.save()
        ])

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create movement',
            detail: `${req.user.username} created movement for ${itemName}`
        })
        await newActivity.save()
        
        res.status(201).json(newMovement)
    } catch (error) {
        next(error)
    }
}

export const getMovements = async (req,res,next) => {
    try {
        const movements = await Movement.find().sort({createdAt:-1})
        res.status(200).json(movements)
    } catch (error) {
        next(error)
    }
}