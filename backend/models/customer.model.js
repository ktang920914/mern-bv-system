import mongoose from "mongoose";

const customerScheduleSchema = new mongoose.Schema({
    customerID: { type: String, required: true },
    customerName: { type: String, required: true },
    code: { type: String, required: true }, 
    orderdate: { type: String, required: true }, // 新增: 订单日期 (纯日期不带时间)
    prodstart: { type: String, required: true }, 
    prodend: { type: String, required: true }, 
    targetcompletion: { type: String, required: true },
    deliverydate: { type: String, required: true },
    lotno: { type: String, required: true },
    colourcode: { type: String, required: true },
    material: { type: String, required: true },
    qty: { type: Number, required: true },
    pax: { type: Number, required: true },

    status: { type: String, default: 'In Progress' },
    productionDate: { type: Date }, 

    actualoutput: { type: Number, default: 0 },
    wastage: { type: Number, default: 0 },
    planprodtime: { type: Number, default: 0 },
    operatingtime: { type: Number, default: 0 },
    proddelay: { type: Number, default: 0 },
    irr: { type: Number, default: 0 },
    arr: { type: Number, default: 0 },
    remark: { type: String, default: '' },

    // --- 新增用于自动计算的字段 (单位：分钟) ---
    qctime: { type: Number, default: 0 },
    so: { type: Number, default: 0 },
    startup: { type: Number, default: 0 }

}, { timestamps: true });

const CustomerSchedule = mongoose.model('CustomerSchedule', customerScheduleSchema);
export default CustomerSchedule;