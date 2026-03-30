import mongoose from "mongoose";

const customerScheduleSchema = new mongoose.Schema({
    // --- 计划排程字段 ---
    customerID: { type: String, required: true },
    customerName: { type: String, required: true },
    code: { type: String, required: true }, 
    prodstart: { type: String, required: true }, 
    prodend: { type: String, required: true }, 
    targetcompletion: { type: String, required: true },
    deliverydate: { type: String, required: true },
    lotno: { type: String, required: true },
    colourcode: { type: String, required: true },
    material: { type: String, required: true },
    qty: { type: Number, required: true },
    pax: { type: Number, required: true },

    // --- 增加状态控制字段 ---
    status: { type: String, default: 'In Progress' }, // <--- 这里加上！

    // --- 实际生产输出字段 ---
    actualoutput: { type: Number, default: 0 },
    wastage: { type: Number, default: 0 },
    planprodtime: { type: Number, default: 0 },
    operatingtime: { type: Number, default: 0 },
    proddelay: { type: Number, default: 0 },
    irr: { type: Number, default: 0 },
    arr: { type: Number, default: 0 }

}, { timestamps: true });

const CustomerSchedule = mongoose.model('CustomerSchedule', customerScheduleSchema);

export default CustomerSchedule;