import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema({
    jobtype:{
        type:String,
    },
    code:{
        type:String,
    },
    jobdate:{
        type:String,
    },
    problem:{
        type:String,
    },
    jobdetail:{
        type:String,
    },
    rootcause:{
        type:String,
    },
    cost:{
        type:Number,
    },
    completiondate:{
        type:String,
    },
    supplier:{
        type:String,
    },
    status:{
        type:String,
    }
},{timestamps:true})

const Maintenance = mongoose.model('Maintenance', maintenanceSchema)

export default Maintenance