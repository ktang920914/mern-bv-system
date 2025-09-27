import Activity from "../models/activity.model.js"
import Material from "../models/material.model.js"
import { errorHandler } from "../utils/error.js"

export const material = async (req,res,next) => {
    try {
    const {material, quantity, palletno, location, user, status} = req.body
    const existingMaterial = await Material.findOne({material})
    if(existingMaterial){
        return next(errorHandler(404, 'Material is exists'))
    }
    const newMaterial = new Material({
        material,
        quantity,
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
        await Material.findByIdAndDelete(req.params.materialId)
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete material',
            detail: `${req.user.username} delete material from the system`
        })
        await newActivity.save()
        res.status(200).json('Material is deleted')
    } catch (error) {
        next(error)
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