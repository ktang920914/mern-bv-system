import CustomerSchedule from "../models/customer.model.js";
import { errorHandler } from "../utils/error.js";

// 1. Create
export const createSchedule = async (req, res, next) => {
    try {
        const { customerID, customerName, code, orderdate, prodstart, prodend, targetcompletion, deliverydate, lotno, colourcode, material, qty, pax, remark } = req.body;

        const isShutDown = customerName === 'PLAN SHUT DOWN';

        if (isShutDown) {
            // 如果是 Shut Down，只强制要求 Extruder (code), Prod Start, Prod End 和 Reason (targetcompletion)
            if (!code || !prodstart || !prodend || !targetcompletion) {
                return next(errorHandler(400, 'For Plan Shut Down, Extruder, Prod Start, Prod End, and Reason are required.'));
            }
        } else {
            // 正常的 Production，强制要求所有资料
            if (!customerID || !customerName || !code || !orderdate || !prodstart || !prodend || !lotno || !targetcompletion || !deliverydate) {
                return next(errorHandler(400, 'Please provide all required fields.'));
            }
        }

        const newSchedule = new CustomerSchedule({
            customerID, customerName, code, orderdate, prodstart, prodend, targetcompletion, deliverydate, lotno, colourcode, material, qty, pax, remark
        });

        const savedSchedule = await newSchedule.save();
        res.status(201).json(savedSchedule);
    } catch (error) {
        next(error);
    }
};

// 2. Read
export const getSchedules = async (req, res, next) => {
    try {
        const schedules = await CustomerSchedule.find().sort({ createdAt: -1 });
        res.status(200).json(schedules);
    } catch (error) {
        next(error);
    }
};

// 3. Update
export const updateSchedule = async (req, res, next) => {
    try {
        const { customerID, customerName, code, orderdate, prodstart, prodend, targetcompletion, deliverydate, lotno, colourcode, material, qty, pax } = req.body;

        const isShutDown = customerName === 'PLAN SHUT DOWN';

        // Update 同样加上验证逻辑
        if (isShutDown) {
            if (!code || !prodstart || !prodend || !targetcompletion) {
                return next(errorHandler(400, 'For Plan Shut Down, Extruder, Prod Start, Prod End, and Reason are required.'));
            }
        } else {
            if (!customerID || !customerName || !code || !orderdate || !prodstart || !prodend || !lotno || !targetcompletion || !deliverydate) {
                return next(errorHandler(400, 'Please provide all required fields.'));
            }
        }

        const updatedSchedule = await CustomerSchedule.findByIdAndUpdate(
            req.params.customerjobId,
            {
                $set: {
                    customerID, customerName, code, orderdate, prodstart, prodend, targetcompletion, deliverydate, lotno, colourcode, material, qty, pax,
                    status: req.body.status,
                    actualoutput: req.body.actualoutput,
                    wastage: req.body.wastage,
                    planprodtime: req.body.planprodtime,
                    operatingtime: req.body.operatingtime,
                    proddelay: req.body.proddelay,
                    irr: req.body.irr,
                    arr: req.body.arr,
                    productionDate: req.body.productionDate, 
                    remark: req.body.remark,
                    qctime: req.body.qctime,
                    so: req.body.so,
                    startup: req.body.startup
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

// 4. Delete
export const deleteSchedule = async (req, res, next) => {
    try {
        const deletedSchedule = await CustomerSchedule.findByIdAndDelete(req.params.customerjobId);
        if (!deletedSchedule) return next(errorHandler(404, 'Schedule not found'));
        res.status(200).json('The schedule has been deleted');
    } catch (error) {
        next(error);
    }
};