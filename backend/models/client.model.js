import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
    clientID:{
        type:String,
        unique:true,
    },
    clientName:{
        type:String,
    }
},{timestamps:true})

const Client = mongoose.model('Client', clientSchema)

export default Client