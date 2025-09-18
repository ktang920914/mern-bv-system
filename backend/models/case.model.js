// models/case.model.js
import mongoose from "mongoose";

const caseSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Breakdown', 'Kaizen', 'Inspect', 'Maintenance']
    },
    month: {
        type: String,
        required: true,
        enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    year: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        default: 0
    },
    totalCost: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Case = mongoose.model('Case', caseSchema);

export default Case;