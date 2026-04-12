import mongoose from 'mongoose';

const colorantScheduleSchema = new mongoose.Schema({
    category: { type: String, required: true }, // 'OTHER' or 'PIGMENT'
    mixerID: { type: String, required: true }, // e.g., 'M-A'
    type: { type: String, required: true }, // e.g., 'P', 'L11', 'L12'
    customerName: { type: String, required: true },
    productiondate: { type: String, required: true },
    lotno: { type: String, required: true },
    colourcode: { type: String, required: true },
    material: { type: String, required: true },
    pigmentKg: { type: Number, required: true, default: 0 },
    additiveKg: { type: Number, required: true, default: 0 },
    targetcompletion: { type: String }, 
    deliverydate: { type: String },
    orderdate: { type: String },
    status: { type: String, default: 'In Progress' }
}, { timestamps: true });

const ColorantSchedule = mongoose.model('ColorantSchedule', colorantScheduleSchema);
export default ColorantSchedule;