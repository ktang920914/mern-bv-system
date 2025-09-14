import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    code:{
        type:String,
        unique:true,
    },
    type:{
        type:String,
    },
    location:{
        type:String,
    },
    supplier:{
        type:String,
    },
    balance:{
        type:Number,
        default:0
    },
    status:{
        type:String,
    }
},{timestamps:true})

const Inventory = mongoose.model('Inventory', inventorySchema)

export default Inventory