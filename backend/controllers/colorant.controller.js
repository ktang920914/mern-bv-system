import ColorantSchedule from "../models/colorant.model.js";
import { errorHandler } from "../utils/error.js";

// 1. Create
export const createColorant = async (req, res, next) => {
    try {
        const { 
            category, mixerID, type, customerName, productiondate, orderdate, 
            targetcompletion, deliverydate, lotno, colourcode, 
            material, pigmentKg, additiveKg 
        } = req.body;

        if (!category || !mixerID || !type || !customerName || !lotno || !colourcode || !material) {
            return next(errorHandler(400, 'Please provide all required fields.'));
        }

        const newColorant = new ColorantSchedule({
            category,
            mixerID, 
            type, 
            customerName, 
            productiondate, 
            orderdate, 
            targetcompletion, 
            deliverydate, 
            lotno, 
            colourcode, 
            material, 
            pigmentKg, 
            additiveKg
        });

        const savedColorant = await newColorant.save();
        res.status(201).json(savedColorant);
    } catch (error) {
        next(error);
    }
};

// 2. Read
export const getColorants = async (req, res, next) => {
    try {
        const colorants = await ColorantSchedule.find().sort({ createdAt: -1 });
        res.status(200).json(colorants);
    } catch (error) {
        next(error);
    }
};

// 3. Update
export const updateColorant = async (req, res, next) => {
    try {
        const { 
            category, mixerID, type, customerName, productiondate, orderdate, 
            targetcompletion, deliverydate, lotno, colourcode, 
            material, pigmentKg, additiveKg, status 
        } = req.body;

        if (!category || !mixerID || !type || !customerName || !lotno || !colourcode || !material) {
            return next(errorHandler(400, 'Please provide all required fields.'));
        }

        const updatedColorant = await ColorantSchedule.findByIdAndUpdate(
            req.params.colorantjobId,
            {
                $set: {
                    category,
                    mixerID, 
                    type, 
                    customerName, 
                    productiondate, 
                    orderdate, 
                    targetcompletion, 
                    deliverydate, 
                    lotno, 
                    colourcode, 
                    material, 
                    pigmentKg, 
                    additiveKg, 
                    status
                }
            },
            { new: true } 
        );

        if (!updatedColorant) return next(errorHandler(404, 'Colorant schedule not found'));
        res.status(200).json(updatedColorant);
    } catch (error) {
        next(error);
    }
};

// 4. Delete
export const deleteColorant = async (req, res, next) => {
    try {
        const deletedColorant = await ColorantSchedule.findByIdAndDelete(req.params.colorantjobId);
        if (!deletedColorant) return next(errorHandler(404, 'Schedule not found'));
        res.status(200).json('The schedule has been deleted');
    } catch (error) {
        next(error);
    }
};