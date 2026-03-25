import Activity from "../models/activity.model.js"
import Client from "../models/client.model.js"
import { errorHandler } from "../utils/error.js"

export const customer = async (req,res,next) => {
    const { clientID, clientName } = req.body
    try {
    const existingCustomer = await Client.findOne({clientName})
        if(existingCustomer){
            return next(errorHandler(404, 'Customer is exists'))
        }
    const existingCustomerID = await Client.findOne({clientID})
        if(existingCustomerID){
            return next(errorHandler(404, 'Customer ID is exists'))
        }
    const newCustomer = new Client({
        clientID,
        clientName
    })

    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
        date: currentDate,
        activity: 'Create customer',
        detail: `${req.user.username}`
    })
    await newActivity.save()

    await newCustomer.save()
    res.status(201).json({message:'Register successfully'})

    } catch (error) {
    next(error)
    }
}

export const getCustomers = async (req,res,next) => {
    try {
        const customers = await Client.find().sort({updatedAt:-1})
        res.status(200).json(customers)
    } catch (error) {
        next(error)
    }
}

export const deleteCustomer = async (req,res,next) => {
    try {
        await Client.findByIdAndDelete(req.params.customerId)
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete customer',
            detail: `${req.user.username}`
        })
        await newActivity.save()
        res.status(200).json('Customer is deleted')
    } catch (error) {
        next(error)
    }
}

export const updateCustomer = async (req,res,next) => {
    try {
        const existingCustomer = await Client.findOne({ 
            clientName: req.body.clientName,
            _id: { $ne: req.params.customerId } 
        });
        
        if (existingCustomer) {
            return next(errorHandler(404, 'Update Failed'))
        }
        const updatedCustomer = await Client.findByIdAndUpdate(req.params.customerId, {
        $set: {
            clientID: req.body.clientID,
            clientName: req.body.clientName
        },
    },{new:true})
    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
        date: currentDate,
        activity: 'Update customer',
        detail: `${req.user.username}`
    })
    await newActivity.save()
    res.status(200).json(updatedCustomer)
    } catch (error) {
        next(error)
    }
}