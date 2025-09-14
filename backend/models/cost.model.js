import mongoose from "mongoose";

const costSchema = new mongoose.Schema({
    year: {
        type:String,
    },
    type: {
        type:String,
    },
    jan: { type: Number, default: 0 },
    feb: { type: Number, default: 0 },
    mar: { type: Number, default: 0 },
    apr: { type: Number, default: 0 },
    may: { type: Number, default: 0 },
    jun: { type: Number, default: 0 },
    jul: { type: Number, default: 0 },
    aug: { type: Number, default: 0 },
    sep: { type: Number, default: 0 },
    oct: { type: Number, default: 0 },
    nov: { type: Number, default: 0 },
    dec: { type: Number, default: 0 },
    total: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Cost = mongoose.model('Cost', costSchema);

export default Cost;