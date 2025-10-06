import Activity from "../models/activity.model.js"
import Product from "../models/product.model.js"
import Movement from "../models/movement.model.js"
import { errorHandler } from "../utils/error.js"

// 通用的 QR 码更新函数
const updateQRCode = async (product) => {
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
        colourcode: product.colourcode,
        lotno: product.lotno,
        quantity: product.quantity,
        palletno: product.palletno,
        location: product.location,
        user: product.user,
        status: product.status,
        createdAt: formatDate(product.createdAt),
        lastUpdated: formatDate(new Date())
    });
    
    product.qrCode = qrCodeContent;
    return await product.save();
};

export const product = async (req,res,next) => {
    try {
        const {lotno, colourcode, quantity, palletno, location, user, status} = req.body
        const existingProduct = await Product.findOne({lotno})
        if(existingProduct){
            return next(errorHandler(404, 'Lot no is exists'))
        }

        const productQuantity = quantity || 0;

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
            colourcode,
            lotno,
            quantity: productQuantity,
            palletno,
            location,
            user,
            status,
            createdAt: formatDate(new Date())
        })

        const newProduct = new Product({
            lotno,
            colourcode,
            quantity: productQuantity,
            palletno,
            location,
            user,
            status,
            qrCode: qrCodeContent
        })

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create product',
            detail: `${req.user.username} created product`
        })
        await newActivity.save()
        await newProduct.save()
        res.status(201).json({message:'Register successfully'})
    } catch (error) {
        next(error)
    }
}

export const getProducts = async (req,res,next) => {
    try {
        const products = await Product.find().sort({updatedAt:-1})
        res.status(200).json(products)
    } catch (error) {
        next(error)
    }
}

export const deleteProduct = async (req,res,next) => {
    try {
        // 先找到要删除的物品
        const itemToDelete = await Product.findById(req.params.productId);
        if (!itemToDelete) {
            return next(errorHandler(404, 'Item not found'));
        }

        // 获取物品的colourcode，用于删除相关的交易记录
        const itemCode = itemToDelete.colourcode;
        
        // 构造movement中item字段的格式
        const movementItemName = `Product: ${itemCode}`;

        // 同时删除物品和相关的交易记录
        await Promise.all([
            Product.findByIdAndDelete(req.params.productId),
            Movement.deleteMany({ item: movementItemName }) // 使用正确的格式
        ]);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete product',
            detail: `${req.user.username} delete product`
        });
        await newActivity.save();
        
        res.status(200).json('Product and related movements are deleted');
    } catch (error) {
        next(error);
    }
}

export const updateProduct = async (req,res,next) => {
    try {
        const existingProduct = await Product.findOne({ 
            lotno: req.body.lotno,
            _id: { $ne: req.params.productId } 
        });
        
        if (existingProduct) {
            return next(errorHandler(404, 'Update Failed'))
        }

        // 更新字段并重新生成 QR 码
        const updatedProduct = await Product.findByIdAndUpdate(req.params.productId, {
            $set: {
                colourcode: req.body.colourcode,
                lotno: req.body.lotno,
                location: req.body.location,
                user: req.body.user,
                quantity: req.body.quantity,
                palletno: req.body.palletno,
                status: req.body.status
            },
        }, {new: true})

        // 更新 QR 码内容
        await updateQRCode(updatedProduct);

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update product',
            detail: `${req.user.username} update product`
        })
        await newActivity.save()
        res.status(200).json(updatedProduct)
    } catch (error) {
        next(error)
    }
}