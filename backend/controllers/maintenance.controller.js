import Activity from "../models/activity.model.js"
import Maintenance from "../models/maintenance.model.js"

// 计算作业时间（completiondate - jobdate）
const calculateJobTime = (jobdate, completiondate) => {
    if (!jobdate || !completiondate) {
        return 0;
    }
    
    try {
        const startDate = new Date(jobdate);
        const endDate = new Date(completiondate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.log("Invalid date format:", { jobdate, completiondate });
            return 0;
        }
        
        // 计算时间差（毫秒）
        const timeDiff = endDate.getTime() - startDate.getTime();
        
        // 转换为分钟
        const minutesDiff = timeDiff / (1000 * 60);
        
        // 四舍五入到最接近的整数
        return Math.round(minutesDiff);
    } catch (error) {
        console.error("Error calculating job time:", error);
        return 0;
    }
};

// 验证和格式化日期时间
const validateDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null;
    
    try {
        // 检查是否是 datetime-local 格式 (YYYY-MM-DDTHH:MM)
        if (dateTimeStr.includes('T')) {
            return new Date(dateTimeStr).toISOString();
        }
        // 如果已经是 ISO 格式
        else if (dateTimeStr.includes(':')) {
            return new Date(dateTimeStr).toISOString();
        }
        // 如果只有日期，添加默认时间
        else {
            return new Date(`${dateTimeStr}T00:00`).toISOString();
        }
    } catch (error) {
        return dateTimeStr;
    }
};

// 格式化日期时间显示
const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    
    try {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return dateTimeStr;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
        return dateTimeStr;
    }
};

// 创建维护记录
export const maintenance = async (req, res, next) => {
    const { jobtype, code, jobdate, problem, jobdetail, rootcause, cost, completiondate, supplier, status } = req.body;
    
    try {
        // 格式化日期时间
        const formattedJobdate = validateDateTime(jobdate);
        const formattedCompletiondate = validateDateTime(completiondate);
        
        // 计算作业时间
        const jobtime = calculateJobTime(formattedJobdate, formattedCompletiondate);
        
        // 创建新的维护记录
        const newMaintenance = new Maintenance({
            jobtype,
            code,
            jobdate: formattedJobdate,
            problem,
            jobdetail,
            rootcause,
            cost,
            completiondate: formattedCompletiondate,
            jobtime, // 保存计算出的作业时间
            supplier,
            status
        });

        // 记录活动日志
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create maintenance',
            detail: `${req.user.username}`
        });
        
        await newActivity.save();
        await newMaintenance.save();
        
        // 返回成功响应
        res.status(201).json({
            message: 'Maintenance job created successfully',
            jobtime,
            data: {
                ...newMaintenance._doc,
                jobdate: formatDateTime(formattedJobdate),
                completiondate: formatDateTime(formattedCompletiondate)
            }
        });
    } catch (error) {
        next(error);
    }
};

// 获取所有维护记录
// 获取维护记录 - 支持按年份筛选
export const getMaintenances = async (req, res, next) => {
    try {
        const { year } = req.query; // 获取前端传来的年份参数
        let query = {};

        // 如果传了年份，利用正则匹配 jobdate 字段开头的年份
        // 比如 year=2026，匹配 2026-xx-xx 或 2026/xx/xx
        if (year) {
            query.jobdate = { $regex: `^${year}` };
        }

        const maintenances = await Maintenance.find(query).sort({ updatedAt: -1 });
        
        // 格式化返回的日期时间并确保包含作业时间
        const formattedMaintenances = maintenances.map(maintenance => {
            const formattedJobdate = formatDateTime(maintenance.jobdate);
            const formattedCompletiondate = formatDateTime(maintenance.completiondate);
            
            let jobtime = maintenance.jobtime;
            if (jobtime === undefined || jobtime === null) {
                jobtime = calculateJobTime(maintenance.jobdate, maintenance.completiondate);
            }
            
            return {
                ...maintenance._doc,
                jobdate: formattedJobdate,
                completiondate: formattedCompletiondate,
                jobtime 
            };
        });
        
        res.status(200).json(formattedMaintenances);
    } catch (error) {
        next(error);
    }
};

// 删除维护记录
export const deleteMaintenance = async (req, res, next) => {
    try {
        await Maintenance.findByIdAndDelete(req.params.maintenanceId);
        
        // 记录活动日志
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete maintenance',
            detail: `${req.user.username}`
        });
        
        await newActivity.save();
        res.status(200).json({ message: 'Maintenance job deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// 更新维护记录
export const updateMaintenance = async (req, res, next) => {
    try {
        // 格式化日期时间
        const formattedJobdate = validateDateTime(req.body.jobdate);
        const formattedCompletiondate = validateDateTime(req.body.completiondate);
        
        // 计算作业时间
        const jobtime = calculateJobTime(formattedJobdate, formattedCompletiondate);
        
        // 更新维护记录
        const updatedMaintenance = await Maintenance.findByIdAndUpdate(
            req.params.maintenanceId,
            {
                $set: {
                    jobdate: formattedJobdate,
                    problem: req.body.problem,
                    code: req.body.code,
                    jobtype: req.body.jobtype,
                    completiondate: formattedCompletiondate,
                    jobtime, // 更新作业时间
                    jobdetail: req.body.jobdetail,
                    rootcause: req.body.rootcause,
                    supplier: req.body.supplier,
                    cost: req.body.cost,
                    status: req.body.status
                }
            },
            { new: true }
        );
        
        if (!updatedMaintenance) {
            return res.status(404).json({ message: 'Maintenance job not found' });
        }
        
        // 格式化返回的数据
        const formattedMaintenance = {
            ...updatedMaintenance._doc,
            jobdate: formatDateTime(updatedMaintenance.jobdate),
            completiondate: formatDateTime(updatedMaintenance.completiondate),
            jobtime: updatedMaintenance.jobtime
        };
        
        // 记录活动日志
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update maintenance',
            detail: `${req.user.username}`
        });
        
        await newActivity.save();
        
        res.status(200).json({
            message: 'Maintenance job updated successfully',
            data: formattedMaintenance
        });
    } catch (error) {
        next(error);
    }
};

// 获取单个维护记录
export const getMaintenanceById = async (req, res, next) => {
    try {
        const maintenance = await Maintenance.findById(req.params.maintenanceId);
        
        if (!maintenance) {
            return res.status(404).json({ message: 'Maintenance job not found' });
        }
        
        // 格式化日期时间
        const formattedJobdate = formatDateTime(maintenance.jobdate);
        const formattedCompletiondate = formatDateTime(maintenance.completiondate);
        
        // 确保包含作业时间
        let jobtime = maintenance.jobtime;
        if (jobtime === undefined || jobtime === null) {
            jobtime = calculateJobTime(maintenance.jobdate, maintenance.completiondate);
        }
        
        const formattedMaintenance = {
            ...maintenance._doc,
            jobdate: formattedJobdate,
            completiondate: formattedCompletiondate,
            jobtime
        };
        
        res.status(200).json(formattedMaintenance);
    } catch (error) {
        next(error);
    }
};
