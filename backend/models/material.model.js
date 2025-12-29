import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
    lotno:{
        type:String,
        unique:true,
    },
    material:{
        type:String,
    },
    quantity:{
        type:Number,
    },
    palletno:{
        type:String,
    },
    location:{
        type:String,
    },
    user:{
        type:String,
    },
    status:{
        type:String,
    },
    qrCode: {  // 可选：如果您想存储QR码图片
        type: String,
        default: ''
    }
},{timestamps:true})

const Material = mongoose.model('Material', materialSchema)

export default Material