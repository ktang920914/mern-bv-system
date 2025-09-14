import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    date:{
        type:String,
    },
    supplier:{
        type:String,
    },
    doc:{
        type:String,
    },
    docno:{
        type:String,
    },
    item:{
        type:String,
    },
    quantity:{
        type:Number,
    },
    amount:{
        type:Number,
    },
    costcategory:{
        type:String,
    },
    status:{
        type:String,
    }
},{timestamps:true})

const Order = mongoose.model('Order', orderSchema)

export default Order