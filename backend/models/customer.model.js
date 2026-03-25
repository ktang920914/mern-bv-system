import mongoose from "mongoose";

const customerScheduleSchema = new mongoose.Schema({
    customerID: { type: String, required: true },
    customerName: { type: String, required: true },
    code: { type: String, required: true }, // Extruder ID
    prodstart: { type: String, required: true }, // 加回
    prodend: { type: String, required: true }, // 加回
    targetcompletion: { type: String, required: true },
    deliverydate: { type: String, required: true },
    lotno: { type: String, required: true },
    colourcode: { type: String, required: true },
    material: { type: String, required: true },
    qty: { type: Number, required: true },
    pax: { type: Number, required: true }
}, { timestamps: true });

const CustomerSchedule = mongoose.model('CustomerSchedule', customerScheduleSchema);

export default CustomerSchedule;