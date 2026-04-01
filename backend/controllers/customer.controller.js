import CustomerSchedule from "../models/customer.model.js";
import { errorHandler } from "../utils/error.js";

// 1. 创建排程 (Create)
export const createSchedule = async (req, res, next) => {
    try {
        const { customerID, customerName, code, prodstart, prodend, targetcompletion, deliverydate, lotno, colourcode, material, qty, pax, remark } = req.body;

        if (!customerID || !customerName || !code || !prodstart || !prodend || !lotno || !targetcompletion || !deliverydate) {
            return next(errorHandler(400, 'Please provide all required fields.'));
        }

        const newSchedule = new CustomerSchedule({
            customerID, customerName, code, prodstart, prodend, targetcompletion, deliverydate, lotno, colourcode, material, qty, pax, remark
        });

        const savedSchedule = await newSchedule.save();
        res.status(201).json(savedSchedule);
    } catch (error) {
        next(error);
    }
};

// 2. 获取所有排程 (Read)
export const getSchedules = async (req, res, next) => {
    try {
        const schedules = await CustomerSchedule.find().sort({ createdAt: -1 });
        res.status(200).json(schedules);
    } catch (error) {
        next(error);
    }
};

// 3. 更新排程 (Update)
export const updateSchedule = async (req, res, next) => {
    try {
        const updatedSchedule = await CustomerSchedule.findByIdAndUpdate(
            req.params.customerjobId,
            {
                $set: {
                    // 加上前端 Modal 里需要 Update 的核心字段
                    customerID: req.body.customerID,
                    customerName: req.body.customerName,
                    code: req.body.code,
                    prodstart: req.body.prodstart,
                    prodend: req.body.prodend,
                    targetcompletion: req.body.targetcompletion,
                    deliverydate: req.body.deliverydate,
                    lotno: req.body.lotno,
                    colourcode: req.body.colourcode,
                    material: req.body.material,
                    qty: req.body.qty,
                    pax: req.body.pax,
                    
                    // 保留你原有的其他字段更新
                    status: req.body.status,
                    actualoutput: req.body.actualoutput,
                    wastage: req.body.wastage,
                    planprodtime: req.body.planprodtime,
                    operatingtime: req.body.operatingtime,
                    proddelay: req.body.proddelay,
                    irr: req.body.irr,
                    arr: req.body.arr,
                    productionDate: req.body.productionDate, 

                    // --- 新增代码 ---
                    remark: req.body.remark
                }
            },
            { new: true } 
        );

        if (!updatedSchedule) return next(errorHandler(404, 'Schedule not found'));
        res.status(200).json(updatedSchedule);
    } catch (error) {
        next(error);
    }
};

// 4. 删除排程 (Delete)
export const deleteSchedule = async (req, res, next) => {
    try {
        const deletedSchedule = await CustomerSchedule.findByIdAndDelete(req.params.customerjobId);
        if (!deletedSchedule) return next(errorHandler(404, 'Schedule not found'));
        res.status(200).json('The schedule has been deleted');
    } catch (error) {
        next(error);
    }
};

