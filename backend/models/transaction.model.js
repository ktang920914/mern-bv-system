import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    date:{
        type:String,
    },
    code:{
        type:String,
    },
    transaction:{
        type:String,
    },
    balance:{
        type:Number,
    },
    quantity:{
        type:Number,
    },
    user:{
        type:String,
    }
},{timestamps:true})

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction