import mongoose from "mongoose";

const customerScheduleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true, // Extruder 永远是必须的
    },
    prodstart: {
      type: String,
      required: true, // Prod Start 永远是必须的
    },
    prodend: {
      type: String,
      required: true, // Prod End 永远是必须的
    },
    targetcompletion: {
      type: String,
      required: true, // Reason/Target 永远是必须的
    },
    customerID: {
      type: String,
      required: true, // 填入 'SHUTDOWN' 所以这个可以保留 true
    },
    customerName: {
      type: String,
      required: true, // 填入 'PLAN SHUT DOWN'，所以可以保留 true
    },
    // ------------- 以下字段请去掉 required: true -------------
    orderdate: {
      type: String,
      required: false, // 改为 false，因为 shut down 传进来是 ''
    },
    deliverydate: {
      type: String,
      required: false, // 改为 false
    },
    lotno: {
      type: String,
      required: false, // 设为 false，即便我们传了 '-'
    },
    colourcode: {
      type: String,
      required: false, 
    },
    material: {
      type: String,
      required: false, 
    },
    qty: {
      type: Number,
      required: false, 
    },
    pax: {
      type: Number,
      required: false, 
    },
    // ... 其他字段 (status, actualoutput 等等) 保持原样 ...
  },
  { timestamps: true }
);

const CustomerSchedule = mongoose.model("CustomerSchedule", customerScheduleSchema);

export default CustomerSchedule;