import Job from '../models/job.model.js'

// 前端需要的数据类型映射
const dataTypes = [
    { value: 'totalorder', label: 'Total Order' },
    { value: 'totaloutput', label: 'Total Output' },
    { value: 'totalmeter', label: 'Total Meter' },
    { value: 'wastage', label: 'Wastage' },
    { value: 'downtime', label: 'Downtime' },
    { value: 'prodleadtime', label: 'Prod Leadtime' },
    { value: 'operatingtime', label: 'Operating Time' },
    { value: 'arr', label: 'ARR' },
    { value: 'screwout', label: 'Screwout' },
    { value: 'availability', label: 'Availability' },
    { value: 'performance', label: 'Performance' },
    { value: 'quality', label: 'Quality' },
    { value: 'oee', label: 'OEE' }
];

// 需要计算平均值的数据类型
const averageDataTypes = ['arr', 'availability', 'performance', 'quality', 'oee'];

export const calculateOutputs = async (req, res, next) => {
    try {
        const { year, data, codes } = req.query;
        
        if (!year || !data) {
            return res.status(400).json({ error: 'Year and data parameters are required' });
        }
        
        // 构建查询条件
        let query = {
            endtime: {
                $exists: true,
                $ne: null
            }
        };
        
        // 如果提供了 Job Code，添加到查询条件
        if (codes && codes !== '') {
            const codeArray = codes.split(',');
            query.code = { $in: codeArray };
        }
        
        // 获取符合条件的Job数据
        const jobs = await Job.find(query);
        
        // 过滤出指定年份的jobs
        const yearJobs = jobs.filter(job => {
            if (!job.endtime) return false;
            const endTime = new Date(job.endtime);
            return endTime.getFullYear() === parseInt(year);
        });
        
        // 如果没有找到数据
        if (yearJobs.length === 0) {
            return res.status(200).json([{
                year,
                material: dataTypes.find(dt => dt.value === data)?.label || data,
                jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
                jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
                total: 0
            }]);
        }
        
        // 初始化月度数据
        const monthlyData = {
            jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
            jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
            total: 0
        };
        
        // 计算平均值的数据类型
        const isAverage = averageDataTypes.includes(data);
        
        // 特殊处理 wastage：只累加正值
        const isWastage = data === 'wastage';
        
        // 初始化计数器和总和（用于计算平均值）
        const monthlyCounts = {
            jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
            jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
        };
        
        // 处理每个Job
        yearJobs.forEach(job => {
            // 获取月份 (0-11)
            const endTime = new Date(job.endtime);
            const month = endTime.getMonth();
            
            // 映射月份到键名
            const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                              'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const monthKey = monthKeys[month];
            
            // 获取当前Job的数据值
            let value = job[data];
            if (value === undefined || value === null) {
                value = 0;
            }
            
            // 如果是 wastage，只累加正值
            if (isWastage) {
                // 只累加大于 0 的值
                if (value > 0) {
                    monthlyData[monthKey] += value;
                }
                // 如果 value <= 0，直接忽略（不累加）
            } else if (isAverage) {
                // 对于平均值数据类型，累加值和计数
                monthlyData[monthKey] += value;
                monthlyCounts[monthKey]++;
            } else {
                // 对于其他总和数据类型，直接累加
                monthlyData[monthKey] += value;
            }
        });
        
        // 如果是平均值数据类型，计算每月平均值
        if (isAverage) {
            for (const monthKey in monthlyCounts) {
                if (monthlyCounts[monthKey] > 0) {
                    monthlyData[monthKey] = monthlyData[monthKey] / monthlyCounts[monthKey];
                }
            }
        }
        
        // 计算年度总计 - 修复后的逻辑
        if (isAverage) {
            // 对于平均值数据类型，计算各月平均值的年度平均（简单平均）
            let validMonthSum = 0;
            let validMonthCount = 0;
            
            const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                              'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            
            for (const monthKey of monthKeys) {
                if (monthlyCounts[monthKey] > 0) {
                    validMonthSum += monthlyData[monthKey];
                    validMonthCount++;
                }
            }
            
            monthlyData.total = validMonthCount > 0 ? validMonthSum / validMonthCount : 0;
        } else {
            // 对于总和数据类型，直接累加所有月份
            monthlyData.total = Object.values(monthlyData).reduce((sum, value, index) => {
                // 跳过total字段本身（最后一个）
                if (index < 12) { // 前12个是月份
                    return sum + value;
                }
                return sum;
            }, 0);
        }
        
        // 创建输出对象
        const output = {
            year,
            material: dataTypes.find(dt => dt.value === data)?.label || data,
            ...monthlyData
        };
        
        res.status(200).json([output]);
    } catch (error) {
        console.error('Error in calculateOutputs:', error);
        next(error);
    }
};