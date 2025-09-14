import Transaction from "../models/transaction.model.js"
import Inventory from "../models/inventory.model.js"
import { errorHandler } from "../utils/error.js"
import Activity from "../models/activity.model.js"

export const record = async (req,res,next) => {
    const {date,code,transaction,quantity,user} = req.body
    try {
        let inventory = await Inventory.findOne({code})

        if(!inventory){
            inventory = new Inventory({
                code,
                balance:0
            })
        }

        const qty = Number(quantity)
        let newBalance;

        if(transaction === 'In'){
            newBalance = inventory.balance + qty
        }else if(transaction === 'Out'){
            if(inventory.balance < quantity){
                return next(errorHandler(404, 'Insufficient Stock'))
            }
            newBalance = inventory.balance - qty
        }
        const newTransaction = new Transaction({
            date,
            code,
            transaction,
            quantity:qty,
            user,
            balance:newBalance
        })
        inventory.balance = newBalance
        await Promise.all([
            newTransaction.save(),
            inventory.save()
        ])

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create transaction',
            detail: `${req.user.username} create transaction to the system`
        })
        await newActivity.save()
        res.status(201).json(newTransaction)
    } catch (error) {
        next(error)
    }
}

export const getRecords = async (req,res,next) => {
    try {
        const records = await Transaction.find().sort({createdAt:-1})
        res.status(200).json(records)
    } catch (error) {
        next(error)
    }
}

export const deleteRecord = async (req,res,next) => {
    try {
        const record = await Transaction.findById(req.params.recordId)
        if(!record){
            return next(errorHandler(404, 'Failed'))
        }
        const inventory = await Inventory.findOne({code: record.code});
        if(!inventory){
            return next(errorHandler(404, 'Failed'))
        }
        if(record.transaction === 'In'){
            if(inventory.balance < record.quantity){
                return next(errorHandler(400, 'Delete Failed'))
            }
            inventory.balance -= record.quantity
        }else if (record.transaction === 'Out') {
            inventory.balance += record.quantity
        }
        await Promise.all([
            inventory.save(),
            Transaction.findByIdAndDelete(req.params.recordId)
        ]);
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete transaction',
            detail: `${req.user.username} delete transaction from the system`
        })
        await newActivity.save()
        res.status(200).json('Record is deleted')
    } catch (error) {
        next(error)
    }
}

export const updateRecord = async (req,res,next) => {
    try {
        const updatedRecord = await Transaction.findByIdAndUpdate(req.params.recordId, {
        $set: {
            balance:req.body.balance
        },
    },{new:true})
    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
        date: currentDate,
        activity: 'Update transaction',
        detail: `${req.user.username} update transaction to the system`
    })
    await newActivity.save()
    res.status(200).json(updatedRecord)
    } catch (error) {
        next(error)
    }
}
