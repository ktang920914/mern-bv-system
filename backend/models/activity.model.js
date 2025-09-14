import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    date:{
        type:String,
    },
    activity:{
        type:String,
    },
    detail:{
        type:String,
    }
},{timestamps:true})

const Activity = mongoose.model('Activity', activitySchema)

export default Activity