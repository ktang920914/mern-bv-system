import Activity from "../models/activity.model.js";
import Job from "../models/job.model.js";
import Planning from "../models/planning.model.js";
import Productivity from "../models/productivity.model.js";

export const getPlannings = async (req, res, next) => {
    try {
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'View productivity',
            detail: `${req.user.username} view productivity from the system`
        });
        await newActivity.save();
        
        const plannings = await Planning.find().sort({updatedAt:-1});
        res.status(200).json(plannings);
    } catch (error) {
        next(error);
    }
};

export const updatePlanning = async (req, res, next) => {
    try {
        // 首先获取要更新的Planning数据
        const existingPlanning = await Planning.findById(req.params.planningId);
        if (!existingPlanning) {
            return res.status(404).json({ message: "Planning not found" });
        }

        // 获取更新数据
        const irr = Number(req.body.irr) || existingPlanning.irr || 0;
        const ipqc = Number(req.body.ipqc) || existingPlanning.ipqc || 0;
        const setup = Number(req.body.setup) || existingPlanning.setup || 0;
        const lotno = req.body.lotno || existingPlanning.lotno;
        const totalorder = Number(existingPlanning.totalorder) || 0;
        const operatingtime = Number(existingPlanning.operatingtime) || 0;
        const totaloutput = Number(existingPlanning.totaloutput) || 0;
        const reject = Number(existingPlanning.reject) || 0;

        // 计算 planprodtime
        let planprodtime = 0;
        if (irr > 0) {
            planprodtime = Math.round((totalorder / irr) + ipqc + setup);
        } else {
            planprodtime = Math.round(ipqc + setup);
        }

        // 计算 availability
        let availability = 0;
        if (planprodtime > 0) {
            availability = Number((operatingtime / planprodtime).toFixed(2));
        }

        // 计算 performance = (totaloutput / operatingtime) / irr
        let performance = 0;
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

        // 更新Planning数据
        const updatedPlanning = await Planning.findByIdAndUpdate(
            req.params.planningId,
            {
                $set: {
                    irr: irr,
                    ipqc: ipqc,
                    setup: setup,
                    lotno: lotno,
                    planprodtime: planprodtime,
                    availability: availability, // 添加availability
                    performance: performance, // 添加performance
                    quality: quality, // 添加quality
                    oee: oee // 添加oee
                }
            },
            { new: true }
        );

        // 同时更新对应的Productivity和Job数据
        if (existingPlanning.lotno) {
            // 更新Productivity数据
            await Productivity.findOneAndUpdate(
                { lotno: existingPlanning.lotno },
                {
                    $set: {
                        irr: irr,
                        ipqc: ipqc,
                        setup: setup,
                        planprodtime: planprodtime,
                        availability: availability, // 添加availability
                        performance: performance, // 添加performance
                        quality: quality, // 添加quality
                        oee: oee // 添加oee
                    }
                },
                { new: true }
            );

            // 更新对应的Job数据
            await Job.findOneAndUpdate(
                { lotno: existingPlanning.lotno },
                {
                    $set: {
                        irr: irr,
                        ipqc: ipqc,
                        setup: setup,
                        planprodtime: planprodtime,
                        availability: availability, // 添加availability
                        performance: performance, // 添加performance
                        quality: quality, // 添加quality
                        oee: oee // 添加oee
                    }
                },
                { new: true }
            );
        }

        // 记录活动日志
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update planning',
            detail: `${req.user.username} updated planning to the system`
        });
        await newActivity.save();

        res.status(200).json(updatedPlanning);
    } catch (error) {
        next(error);
    }
};