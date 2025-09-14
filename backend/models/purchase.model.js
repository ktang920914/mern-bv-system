import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
    supplier:{
        type:String,
        unique:true,
    },
    contact:{
        type:String,
    },
    description:{
        type:String,
    },
    address:{
        type:String,
    },
    pic:{
        type:String,
    },
    email:{
        type:String,
    },
    status:{
        type:String,
    }
},{timestamps:true})

const Purchase = mongoose.model('Purchase', purchaseSchema)

export default Purchase