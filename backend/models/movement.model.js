import mongoose from "mongoose";

const movementSchema = new mongoose.Schema({
    date:{
        type:String,
    },
    item:{
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

const Movement = mongoose.model('Movement', movementSchema)

export default Movement