import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    lotno:{
        type:String,
        unique:true,
    },
    colourcode:{
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

const Product = mongoose.model('Product', productSchema)

export default Product