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
    },
    qrCode: {  // 可选：如果您想存储QR码图片
        type: String,
        default: ''
    }
},{timestamps:true})

const Inventory = mongoose.model('Inventory', inventorySchema)

export default Inventory