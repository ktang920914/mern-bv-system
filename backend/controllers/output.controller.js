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
        
        // --- 核心优化部分 START ---
        // 构建查询条件
        // 直接在数据库层面筛选：只查找 endtime 以指定年份 (e.g., "2025") 开头的数据
        // 这样可以避免把整个数据库几年的数据都拉取到内存中
        let query = {
            endtime: {
                $exists: true,
                $ne: null,
                $regex: `^${year}` // 正则匹配：例如 ^2025 匹配所有2025年的完工时间
            }
        };
        // --- 核心优化部分 END ---
        
        // 如果提供了 Job Code，添加到查询条件
        if (codes && codes !== '') {
            // 如果 codes 包含逗号，说明是多选；如果没有，就是一个单项数组
            const codeArray = codes.split(',');
            query.code = { $in: codeArray };
        }
        
        // 获取符合条件的Job数据 (只获取当年的数据，量小且快)
        const yearJobs = await Job.find(query);
        
        // 如果没有找到数据，返回全0结构
        if (yearJobs.length === 0) {
            return res.status(200).json([{
                year,
                dataType: data,
                dataTypeLabel: dataTypes.find(dt => dt.value === data)?.label || data,
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
        
        // 初始化计数器（用于计算平均值）
        const monthlyCounts = {
            jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
            jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
        };
        
        // 月份键名映射数组
        const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                          'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

        // 处理每个Job
        yearJobs.forEach(job => {
            // 确保使用 endtime (Prod End) 来确定月份归属
            const endTime = new Date(job.endtime);
            const monthIndex = endTime.getMonth(); // 0 = Jan, 1 = Feb...
            
            // 安全检查：确保月份有效
            if (monthIndex >= 0 && monthIndex < 12) {
                const monthKey = monthKeys[monthIndex];
                
                // 获取当前Job的数据值，确保转为数字
                let value = job[data];
                value = (value === undefined || value === null || value === '') ? 0 : Number(value);
                
                // 根据数据类型处理逻辑
                if (isWastage) {
                    // Wastage 规则：只累加大于 0 的值
                    if (value > 0) {
                        monthlyData[monthKey] += value;
                    }
                } else if (isAverage) {
                    // 平均值规则：
                    // 这里可以根据业务调整：是否要把 0 值计入平均分母？
                    // 通常如果是 OEE, Availability 等，0 可能代表有数据但是是0，或者没跑数据。
                    // 这里保守处理：只要该条记录存在，就计入（除非你需要过滤掉0值）
                    monthlyData[monthKey] += value;
                    monthlyCounts[monthKey]++;
                } else {
                    // 总和规则 (Total Output, Operating Time 等)：直接累加
                    monthlyData[monthKey] += value;
                }
            }
        });
        
        // 后处理：计算平均值并格式化数字
        if (isAverage) {
            // 计算每月平均值
            for (const monthKey in monthlyCounts) {
                if (monthlyCounts[monthKey] > 0) {
                    const avg = monthlyData[monthKey] / monthlyCounts[monthKey];
                    monthlyData[monthKey] = Number(avg.toFixed(2));
                }
            }

            // 计算年度总平均 (Total Average)
            // 逻辑：所有有数据的月份的平均值
            let validMonthSum = 0;
            let validMonthCount = 0;
            
            for (const monthKey of monthKeys) {
                if (monthlyCounts[monthKey] > 0) {
                    validMonthSum += monthlyData[monthKey];
                    validMonthCount++;
                }
            }
            
            monthlyData.total = validMonthCount > 0 ? Number((validMonthSum / validMonthCount).toFixed(2)) : 0;

        } else {
            // 处理总和类型的格式化和年度总计
            let yearTotal = 0;

            for (const monthKey of monthKeys) {
                // 格式化每月数据保留2位小数
                monthlyData[monthKey] = Number(monthlyData[monthKey].toFixed(2));
                yearTotal += monthlyData[monthKey];
            }
            
            monthlyData.total = Number(yearTotal.toFixed(2));
        }
        
        // 创建输出对象
        const output = {
            year,
            dataType: data,
            dataTypeLabel: dataTypes.find(dt => dt.value === data)?.label || data,
            // 如果是比较模式 (Selected Codes)，前端可能需要 code 字段，但这里聚合后的数据通常不带单一 code
            // 除非 codes 只有一个。这里保持原结构返回。
            code: codes && !codes.includes(',') ? codes : null, 
            ...monthlyData
        };
        
        res.status(200).json([output]);

    } catch (error) {
        console.error('Error in calculateOutputs:', error);
        next(error);
    }
};