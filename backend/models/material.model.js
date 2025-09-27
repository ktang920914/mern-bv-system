import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
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
    }
},{timestamps:true})

const Material = mongoose.model('Material', materialSchema)

export default Material