import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    role:{
        type:String,
    },
    tokenversion:{
        type:Number,
        default:0
    }
},{timestamps:true})

const User = mongoose.model('User', userSchema)

export default User