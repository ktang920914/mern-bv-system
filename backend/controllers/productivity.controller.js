import Productivity from "../models/productivity.model.js";
import Activity from "../models/activity.model.js";
import Planning from "../models/planning.model.js";
import Job from "../models/job.model.js";

export const getProductivities = async (req, res, next) => {
    try {
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'View productivity',
            detail: `${req.user.username} view productivity from the system`
        })
        await newActivity.save()
        const productivities = await Productivity.find().sort({updatedAt:-1});
        res.status(200).json(productivities);
    } catch (error) {
        next(error);
    }
};

export const updateProductivity = async (req, res, next) => {
    try {
        const existingProductivity = await Productivity.findById(req.params.productivityId);

        const operator = req.body.operator
        const totaloutput = Number(req.body.totaloutput) || 0;
        const totalorder = existingProductivity.totalorder || 0;
        const screwout = Number(req.body.screwout) || 0;
        const startup = Number(req.body.startup) || 0;
        const processcomplication = Number(req.body.processcomplication) || 0;
        const qctime = Number(req.body.qctime) || 0;
        const washup = Number(req.body.washup) || 0;
        const vent = Number(req.body.vent) || 0;
        const unevenpallet = Number(req.body.unevenpallet) || 0;
        const whiteoil = Number(req.body.whiteoil) || 0;
        const stranddrop = Number(req.body.stranddrop) || 0;
        const trialrun = Number(req.body.trialrun) || 0;
        const meterstart = Number(req.body.meterstart) || 0;
        const meterend = Number(req.body.meterend) || 0;
        const reject = Number(req.body.reject) || 0;
        
        const totalmeter = meterend - meterstart
        const downtime = screwout + startup + processcomplication + qctime
        const wastage = totaloutput - totalorder
        
        // 计算operatingtime的算法
        const calculateOperatingTime = (start, end, downtime) => {
            // 将字符串时间转换为Date对象
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            // 计算时间差（毫秒）
            const timeDiff = endDate.getTime() - startDate.getTime();
            
            // 转换为分钟
            const minutesDiff = timeDiff / (1000 * 60);
            
            // 加上停机时间
            return minutesDiff - (Number(downtime) || 0);
        };
        
        // 计算operatingtime
        const operatingtime = calculateOperatingTime(
            existingProductivity.starttime, 
            existingProductivity.endtime, 
            downtime
        );

        // 计算arr (Average Run Rate)
        let arr = 0;
        if (operatingtime > 0) {
            arr = Number((totaloutput / operatingtime).toFixed(1));
        }

        // 计算 availability
        let availability = 0;
        if (existingProductivity.planprodtime > 0) {
            availability = Number((operatingtime / existingProductivity.planprodtime).toFixed(2));
        }

        // 计算 performance = (totaloutput / operatingtime) / irr
        let performance = 0;
        const irr = Number(existingProductivity.irr) || 0;
        if (operatingtime > 0 && irr > 0) {
            performance = Number(((totaloutput / operatingtime) / irr).toFixed(2));
        }
        
        // 计算 quality = (totaloutput - reject) / totaloutput
        let quality = 0;
        if (totaloutput > 0) {
            quality = Number(((totaloutput - reject) / totaloutput).toFixed(2));
        }
        
        // 计算 OEE = availability * performance * quality
        let oee = 0;
        if (availability > 0 && performance > 0 && quality > 0) {
            oee = Number((availability * performance * quality).toFixed(2));
        }

        const updatedProductivity = await Productivity.findByIdAndUpdate(req.params.productivityId, {
            $set: {
                operator: operator,
                totaloutput: totaloutput,
                reject: reject,
                startup: startup,
                screwout: screwout,
                processcomplication: processcomplication,
                qctime: qctime,
                downtime: downtime,
                reason: req.body.reason,
                washresin: req.body.washresin,
                washup: washup,
                stranddrop: stranddrop,
                whiteoil: whiteoil,
                vent: vent,
                unevenpallet: unevenpallet,
                trialrun: trialrun,
                wastage: wastage,
                meterstart: meterstart,
                meterend: meterend,
                totalmeter: totalmeter,
                color: req.body.color,
                density: req.body.density,
                operator: req.body.operator,
                operatingtime: operatingtime, // 添加operatingtime
                arr: arr, // 添加arr
                availability: availability, // 添加availability
                performance: performance, // 添加performance
                quality: quality, // 添加quality
                oee: oee // 添加oee
            },
        }, {new: true})

        // 同时更新对应的作业数据和Planning数据
        if (updatedProductivity && updatedProductivity.lotno) {
            // 查找对应的作业
            const jobToUpdate = await Job.findOne({ lotno: updatedProductivity.lotno });
            
            if (jobToUpdate) {
                // 更新作业的数据
                await Job.findByIdAndUpdate(
                    jobToUpdate._id,
                    {
                        $set: {
                            lotno: req.body.lotno,
                            totaloutput: totaloutput,
                            reject: reject,
                            startup: startup,
                            screwout: screwout,
                            processcomplication: processcomplication,
                            qctime: qctime,
                            downtime: downtime,
                            washup: washup,
                            stranddrop: stranddrop,
                            whiteoil: whiteoil,
                            vent: vent,
                            unevenpallet: unevenpallet,
                            trialrun: trialrun,
                            wastage: wastage,
                            meterstart: meterstart,
                            meterend: meterend,
                            totalmeter: totalmeter,
                            operator:operator,
                            operatingtime: operatingtime, // 更新operatingtime
                            arr: arr, // 更新arr
                            availability: availability, // 更新availability
                            performance: performance, // 更新performance
                            quality: quality, // 更新quality
                            oee: oee // 更新oee
                        }
                    },
                    { new: true }
                );
            }
            
            // 查找对应的Planning数据
            const planningToUpdate = await Planning.findOne({ lotno: updatedProductivity.lotno });
            
            if (planningToUpdate) {
                // 更新Planning的数据
                await Planning.findByIdAndUpdate(
                    planningToUpdate._id,
                    {
                        $set: {
                            totaloutput: totaloutput,
                            reject: reject,
                            startup: startup,
                            screwout: screwout,
                            processcomplication: processcomplication,
                            qctime: qctime,
                            downtime: downtime,
                            washup: washup,
                            stranddrop: stranddrop,
                            whiteoil: whiteoil,
                            vent: vent,
                            unevenpallet: unevenpallet,
                            trialrun: trialrun,
                            wastage: wastage,
                            meterstart: meterstart,
                            meterend: meterend,
                            totalmeter: totalmeter,
                            operator:operator,
                            operatingtime: operatingtime, // 更新operatingtime
                            arr: arr, // 更新arr
                            availability: availability, // 更新availability
                            performance: performance, // 更新performance
                            quality: quality, // 更新quality
                            oee: oee // 更新oee
                        }
                    },
                    { new: true }
                );
            }
        }

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update productivity',
            detail: `${req.user.username} update productivity to the system`
        });
        await newActivity.save();
        
        res.status(200).json(updatedProductivity);
    } catch (error) {
        next(error);
    }
};