import Activity from "../models/activity.model.js"
import Job from "../models/job.model.js"
import Planning from "../models/planning.model.js"
import Productivity from "../models/productivity.model.js"
import { errorHandler } from "../utils/error.js"

export const job = async (req, res, next) => {
    const { code, starttime, endtime, orderdate, lotno, colourcode, material, totalorder, downtime } = req.body;
    try {
        const existingLotno = await Job.findOne({ lotno });
        if (existingLotno) {
            return next(errorHandler(404, 'Lot no is exists'));
        }

        const formatDateTime = (dateTimeStr) => {
            if (!dateTimeStr) return '';
            return dateTimeStr.replace('T', ' ');
        };

        const wastage = 0 - (Number(totalorder) || 0);
        
        // 计算operatingtime的算法（不再加上停机时间）
        const calculateOperatingTime = (start, end, downtime) => {
            // 将字符串时间转换为Date对象
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            // 计算时间差（毫秒）
            const timeDiff = endDate.getTime() - startDate.getTime();
            
            // 转换为分钟
            const minutesDiff = timeDiff / (1000 * 60);
            
            return minutesDiff - (Number(downtime) || 0);
        };
        
        // 计算prodleadtime的算法（从orderdate到endtime的天数）
        const calculatePlanProdTime = (orderDateStr, endTimeStr) => {
        // 使用UTC时间避免时区影响
        const orderDateUTC = new Date(orderDateStr + 'T00:00:00Z');
        const endDateUTC = new Date(endTimeStr.replace(' ', 'T') + 'Z');
        
        // 计算时间差（毫秒）
        const timeDiff = endDateUTC.getTime() - orderDateUTC.getTime();
        
        // 转换为天数并保留1位小数
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        const roundedDaysDiff = Math.round(daysDiff * 10) / 10; // 四舍五入到1位小数
        
        return roundedDaysDiff;
        };
        
        // 计算operatingtime（不加停机时间）
        const operatingtime = calculateOperatingTime(starttime, endtime);
        
        // 计算prodleadtime
        const prodleadtime = calculatePlanProdTime(orderdate, endtime);

        // 计算初始的planprodtime
        let planprodtime = 0;
        // 计算availability
        let availability = 0;
        if (planprodtime > 0) {
            availability = Number((operatingtime / planprodtime).toFixed(2));
        }

        // 计算performance (初始值为0，因为没有totaloutput和irr数据)
        let performance = 0;
        
        // 计算quality (初始值为0，因为没有totaloutput和reject数据)
        let quality = 0;
        
        // 计算OEE
        let oee = 0;
        if (availability > 0 && performance > 0 && quality > 0) {
            oee = Number((availability * performance * quality).toFixed(2));
        }

        const newJob = new Job({
            code,
            starttime: formatDateTime(starttime),
            endtime: formatDateTime(endtime),
            orderdate,
            lotno,
            colourcode,
            material,
            totalorder,
            wastage,
            downtime: downtime || 0,
            operatingtime,
            prodleadtime, // 添加到Job模型
            planprodtime,
            availability, // 添加到Job模型
            performance, // 添加到Job模型
            quality, // 添加到Job模型
            oee // 添加到Job模型
        });

        const newProductivity = new Productivity({
            code,
            starttime: formatDateTime(starttime),
            endtime: formatDateTime(endtime),
            orderdate,
            lotno,
            colourcode,
            material,
            totalorder,
            wastage: wastage,
            downtime: downtime || 0,
            operatingtime,
            prodleadtime,
            planprodtime,
            availability, // 添加到Productivity模型
            performance, // 添加到Productivity模型
            quality, // 添加到Productivity模型
            oee // 添加到Productivity模型
        });

        const newPlanning = new Planning({
            code,
            starttime: formatDateTime(starttime),
            endtime: formatDateTime(endtime),
            orderdate,
            lotno,
            colourcode,
            material,
            totalorder,
            wastage: wastage,
            downtime: downtime || 0,
            operatingtime, // 添加到Planning模型
            prodleadtime, // 添加到Planning模型
            planprodtime,
            availability, // 添加到Planning模型
            performance, // 添加到Planning模型
            quality, // 添加到Planning模型
            oee // 添加到Planning模型
        });

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create Job',
            detail: `${req.user.username}`
        });
        
        await newActivity.save();
        await newProductivity.save();
        await newPlanning.save();
        await newJob.save();
        res.status(201).json({ message: 'Register successfully', operatingtime, prodleadtime, availability, performance, quality, oee });
    } catch (error) {
        next(error);
    }
};

export const getJobs = async (req,res,next) => {
    try {
        // 按生产开始时间倒序排列（最新的在最前面）
        const jobs = await Job.find().sort({starttime: -1})
        res.status(200).json(jobs)
    } catch (error) {
        next(error)
    }
}

export const deleteJob = async (req,res,next) => {
    try {
        const jobToDelete = await Job.findById(req.params.jobId);
        if (!jobToDelete) {
            return next(errorHandler(404, 'Job not found'));
        }
        await Job.findByIdAndDelete(req.params.jobId)
        await Productivity.findOneAndDelete({ lotno: jobToDelete.lotno });
        await Planning.findOneAndDelete({ lotno: jobToDelete.lotno });
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete job',
            detail: `${req.user.username}`
        })
        await newActivity.save()
        res.status(200).json('Job is deleted')
    } catch (error) {
        next(error)
    }
}

export const updateJob = async (req,res,next) => {
    try {
        const existingJob = await Job.findOne({ 
            lotno: req.body.lotno,
            _id: { $ne: req.params.jobId } 
        });

        const formatDateTime = (dateTimeStr) => {
            if (!dateTimeStr) return '';
            return dateTimeStr.replace('T', ' ');
        };
        
        if (existingJob) {
            return next(errorHandler(404, 'Update Failed'))
        }

        const oldJob = await Job.findById(req.params.jobId);
        if (!oldJob) {
            return next(errorHandler(404, 'Job not found'));
        }

        // 获取对应的 Productivity 和 Planning 文档
        const productivity = await Productivity.findOne({ lotno: oldJob.lotno });
        const planning = await Planning.findOne({ lotno: oldJob.lotno });
        
        // 计算operatingtime的算法（不再加上停机时间）
        const calculateOperatingTime = (start, end) => {
            // 将字符串时间转换为Date对象
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            // 计算时间差（毫秒）
            const timeDiff = endDate.getTime() - startDate.getTime();
            
            // 转换为分钟
            const minutesDiff = timeDiff / (1000 * 60);
            
            return minutesDiff; // 直接返回时间差，不加停机时间
        };
        
        // 计算prodleadtime的算法（从orderdate到endtime的天数）
        const calculatePlanProdTime = (orderDateStr, endTimeStr) => {
            // 使用UTC时间避免时区影响
            const orderDateUTC = new Date(orderDateStr + 'T00:00:00Z');
            const endDateUTC = new Date(endTimeStr.replace(' ', 'T') + 'Z');
            
            // 计算时间差（毫秒）
            const timeDiff = endDateUTC.getTime() - orderDateUTC.getTime();
            
            // 转换为天数并保留1位小数
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            const roundedDaysDiff = Math.round(daysDiff * 10) / 10; // 四舍五入到1位小数
            
            return roundedDaysDiff;
        };
        
        // 计算新的operatingtime（不加停机时间）
        const operatingtime = calculateOperatingTime(
            req.body.starttime, 
            req.body.endtime
        );
        
        // 计算新的prodleadtime（如果endtime或orderdate有变化）
        const newOrderdate = req.body.orderdate || oldJob.orderdate;
        const newEndtime = req.body.endtime ? formatDateTime(req.body.endtime) : oldJob.endtime;
        const prodleadtime = calculatePlanProdTime(newOrderdate, newEndtime);

        // 重新计算 wastage
        const totalorder = Number(req.body.totalorder) || Number(oldJob.totalorder) || 0;
        const totaloutput = productivity ? Number(productivity.totaloutput) || 0 : 0;
        const wastage = Number((totaloutput - totalorder).toFixed(2));

        // 重新计算 planprodtime (如果totalorder、irr、ipqc或setup有变化)
        const irr = productivity ? Number(productivity.irr) || 0 : 
                   planning ? Number(planning.irr) || 0 : 0;
        const ipqc = productivity ? Number(productivity.ipqc) || 0 : 
                    planning ? Number(planning.ipqc) || 0 : 0;
        const setup = productivity ? Number(productivity.setup) || 0 : 
                     planning ? Number(planning.setup) || 0 : 0;

        let planprodtime = 0;
        if (irr > 0) {
            planprodtime = Math.round((totalorder / irr) + ipqc + setup);
        } else {
            planprodtime = Math.round(ipqc + setup);
        }

        // 重新计算 arr (Average Run Rate)
        let arr = 0;
        if (operatingtime > 0) {
            arr = Number((totaloutput / operatingtime).toFixed(1));
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
        const reject = productivity ? Number(productivity.reject) || 0 : 
                      planning ? Number(planning.reject) || 0 : 0;
        
        if (totaloutput > 0) {
            quality = Number(((totaloutput - reject) / totaloutput).toFixed(2));
        }
        
        // 计算 OEE = availability * performance * quality
        let oee = 0;
        if (availability > 0 && performance > 0 && quality > 0) {
            oee = Number((availability * performance * quality).toFixed(2));
        }

        const updatedJob = await Job.findByIdAndUpdate(req.params.jobId, {
            $set: {
                code: req.body.code,
                starttime: formatDateTime(req.body.starttime),
                endtime: formatDateTime(req.body.endtime),
                orderdate: req.body.orderdate,
                lotno: req.body.lotno,
                material: req.body.material,
                colourcode: req.body.colourcode,
                totalorder: totalorder,
                operatingtime: operatingtime, // 更新operatingtime
                prodleadtime: prodleadtime, // 更新prodleadtime
                planprodtime: planprodtime, // 更新planprodtime
                arr: arr, // 更新arr
                availability: availability, // 更新availability
                performance: performance, // 更新performance
                quality: quality, // 更新quality
                oee: oee // 更新oee
            },
        }, {new: true})

        // 更新 Productivity
        if (productivity) {
            await Productivity.findOneAndUpdate(
                { lotno: oldJob.lotno },
                {
                    $set: {
                        code: req.body.code,
                        starttime: formatDateTime(req.body.starttime),
                        endtime: formatDateTime(req.body.endtime),
                        orderdate: req.body.orderdate,
                        lotno: req.body.lotno,
                        material: req.body.material,
                        colourcode: req.body.colourcode,
                        totalorder: totalorder,
                        wastage: wastage,
                        operatingtime: operatingtime, // 更新operatingtime
                        prodleadtime: prodleadtime, // 更新prodleadtime
                        planprodtime: planprodtime, // 更新planprodtime
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

        // 更新 Planning
        if (planning) {
            await Planning.findOneAndUpdate(
                { lotno: oldJob.lotno },
                {
                    $set: {
                        code: req.body.code,
                        starttime: formatDateTime(req.body.starttime),
                        endtime: formatDateTime(req.body.endtime),
                        orderdate: req.body.orderdate,
                        lotno: req.body.lotno,
                        material: req.body.material,
                        colourcode: req.body.colourcode,
                        totalorder: totalorder,
                        wastage: wastage,
                        operatingtime: operatingtime, // 更新operatingtime
                        prodleadtime: prodleadtime, // 更新prodleadtime
                        planprodtime: planprodtime, // 更新planprodtime
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

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update job',
            detail: `${req.user.username}`
        });
        await newActivity.save();
        
        res.status(200).json(updatedJob);
    } catch (error) {
        next(error);
    }    
};