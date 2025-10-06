import Activity from "../models/activity.model.js"
import Purchase from "../models/purchase.model.js"
import { errorHandler } from "../utils/error.js"

export const supplier = async (req,res,next) => {
    const {supplier,contact,description,address,pic,email,status} = req.body
    try {
        const existingSupplier = await Purchase.findOne({supplier})
        if(existingSupplier){
            return next(errorHandler(404, 'Supplier is exists'))
        }

        const newSupplier = new Purchase({
            supplier,
            contact,
            description,
            address,
            pic,
            email,
            status
        })

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create supplier',
            detail: `${req.user.username} create supplier`
        })
        await newActivity.save()

        await newSupplier.save()
        res.status(201).json({message:'Register successfully'})
    } catch (error) {
        next(error)
    }
}

export const getSuppliers = async (req,res,next) => {
    try {
        const suppliers = await Purchase.find().sort({updatedAt:-1})
        res.status(200).json(suppliers)
    } catch (error) {
        next(error)
    }
}

export const deleteSupplier = async (req,res,next) => {
    try {
        await Purchase.findByIdAndDelete(req.params.supplierId)
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete supplier',
            detail: `${req.user.username} delete supplier`
        })
        await newActivity.save()
        res.status(200).json('Supplier is deleted')
    } catch (error) {
        next(error)
    }
}

export const updateSupplier = async (req,res,next) => {
    try {
        const existingSupplier = await Purchase.findOne({ 
            supplier: req.body.supplier,
            _id: { $ne: req.params.supplierId } 
        });
        
        if (existingSupplier) {
            return next(errorHandler(404, 'Update Failed'))
        }
        const updatedSupplier = await Purchase.findByIdAndUpdate(req.params.supplierId, {
        $set: {
            supplier: req.body.supplier,
            contact: req.body.contact,
            description: req.body.description,
            address:req.body.address,
            pic:req.body.pic,
            email:req.body.email,
            status:req.body.status
        },
    },{new:true})
    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
        date: currentDate,
        activity: 'Update supplier',
        detail: `${req.user.username} update supplier`
    })
    await newActivity.save()
    res.status(200).json(updatedSupplier)
    } catch (error) {
        next(error)
    }
}
